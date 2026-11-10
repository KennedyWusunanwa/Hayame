package com.hayame.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hayame.app.core.analytics.AnalyticsService
import com.hayame.app.core.network.AvailabilityEnvelope
import com.hayame.app.core.network.AppAnnouncementDto
import com.hayame.app.core.network.BookingDto
import com.hayame.app.core.network.CarDto
import com.hayame.app.core.network.CarsMetaDto
import com.hayame.app.core.network.CarPhotoItemDto
import com.hayame.app.core.network.ConversationDto
import com.hayame.app.core.network.HostApplicationRequest
import com.hayame.app.core.network.LegalDocumentDto
import com.hayame.app.core.network.MessageDto
import com.hayame.app.core.network.MobileMeDto
import com.hayame.app.core.network.NotificationPreferencesDto
import com.hayame.app.core.network.PaystackFinalizeRequest
import com.hayame.app.core.network.PaystackInitDto
import com.hayame.app.core.network.PendingCheckoutDto
import com.hayame.app.core.network.ProfileUpsertRequest
import com.hayame.app.core.network.RenterVerificationDto
import com.hayame.app.core.network.ReviewDto
import com.hayame.app.core.network.TermsDto
import com.hayame.app.core.network.preferredAvatarRaw
import com.hayame.app.core.network.withAvatarFallback
import com.hayame.app.core.repo.AuthRepository
import com.hayame.app.core.repo.BookingRepository
import com.hayame.app.core.repo.CarsRepository
import com.hayame.app.core.repo.HostRepository
import com.hayame.app.core.repo.MessagingRepository
import com.hayame.app.core.repo.StorageRepository
import com.hayame.app.core.session.SessionStore
import com.hayame.app.push.PushTokenStore
import com.hayame.app.ui.navigation.HostMainTab
import com.hayame.app.ui.navigation.MainTab
import com.hayame.app.ui.reference.AndroidReferenceData
import com.hayame.app.ui.state.UiState
import com.hayame.app.push.PushEvents
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import retrofit2.HttpException
import java.io.File
import java.time.Instant
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import kotlin.math.roundToInt

/**
 * Checkout selections kept on this device so closing the checkout never throws
 * the renter's work away. Persisted as JSON in [SessionStore].
 */
@Serializable
data class BookingDraft(
    val carId: String,
    val startDate: String,
    val endDate: String,
    val region: String,
    val city: String,
    val address: String,
    val tripMode: String? = null,
    val deliveryAddress: String = "",
    val deliveryTime: String = "",
    val contactPhone: String = "",
    val deliveryNotes: String = "",
    val carTitle: String = "",
    val carImageUrl: String? = null,
    val dailyPrice: Int = 0,
    /** Checkout step the renter was on (0 = trip details ... 3 = payment). */
    val step: Int = 0,
    val userId: String = "",
    val updatedAtMillis: Long = 0L,
)

/** What the server decided when the renter asked to resume a saved checkout. */
sealed interface SavedCheckoutResumeResult {
    data class Ready(val checkout: PendingCheckoutDto) : SavedCheckoutResumeResult
    data class Blocked(val checkout: PendingCheckoutDto) : SavedCheckoutResumeResult
    data class Completed(val bookingId: String, val conversationId: String?) : SavedCheckoutResumeResult
    data class Failed(val message: String, val gone: Boolean) : SavedCheckoutResumeResult
}

/** Where the renter stands with the identity check every renter passes before booking. */
enum class RenterVerificationStatus {
    /** Not loaded yet, or the server could not be reached. Never blocks booking. */
    UNKNOWN,
    UNVERIFIED,
    PENDING,
    APPROVED,
    REJECTED,
}

data class RenterVerificationUiState(
    val status: RenterVerificationStatus = RenterVerificationStatus.UNKNOWN,
    /** False when the server has verification switched off. */
    val required: Boolean = true,
    /** The server's single answer on whether a booking may go ahead. */
    val canBook: Boolean = true,
    val submittedAt: String? = null,
    val reviewedAt: String? = null,
    val rejectionReason: String? = null,
    val isLoading: Boolean = false,
) {
    /**
     * True only when the server has told us this renter may not book yet. An unknown
     * status never blocks: the server stays the real gate.
     */
    val blocksBooking: Boolean
        get() = status != RenterVerificationStatus.UNKNOWN && !canBook
}

/** Progress of sending the three verification photos. [step] 1-3 = uploading that photo, 4 = sending for review. */
data class RenterVerificationSubmitState(
    val inProgress: Boolean = false,
    val step: Int = 0,
    val error: String? = null,
)

/**
 * The Terms of Service as last loaded from the server. [mustAccept] is true only when the
 * server has said this signed-in user has to accept the current version; a failed or empty
 * load never sets it, so the app is never blocked on a guess (the server still refuses
 * bookings from users who have not accepted).
 */
data class TermsUiState(
    /** Only ever a document with at least one section. */
    val document: TermsDto? = null,
    val isLoading: Boolean = false,
    /** The last load failed and there is nothing to show. */
    val loadFailed: Boolean = false,
    val mustAccept: Boolean = false,
)

data class TermsAcceptState(
    val inProgress: Boolean = false,
    val error: String? = null,
    /** The version on screen was replaced by a newer one while the user was reading. */
    val updatedWhileReading: Boolean = false,
)

/**
 * One policy document (Protection, Cancellation or Privacy) as last loaded. The copy saved on
 * the device shows first; the server's copy replaces it when it arrives.
 */
data class LegalDocumentUiState(
    /** Only ever a document with at least one question. */
    val document: LegalDocumentDto? = null,
    val isLoading: Boolean = false,
    /** The last load failed and there is nothing to show. */
    val loadFailed: Boolean = false,
    /** The last load failed, so what is on screen is the copy saved on this device. */
    val showingSavedCopy: Boolean = false,
)

/** Where the request to delete the account stands. [receivedMessage] is the server's answer. */
data class AccountDeletionUiState(
    val inProgress: Boolean = false,
    val error: String? = null,
    val receivedMessage: String? = null,
)

data class ListingSubmissionResult(
    val createdCar: CarDto? = null,
    val uploadedCount: Int = 0,
    val uploadFailures: List<String> = emptyList(),
    val error: String? = null,
)

data class AuthPromptRequest(
    val message: String,
    val destination: String? = null,
)

private const val WrongEmailOrPasswordMessage = "Wrong email or password."

class AppViewModel(
    private val authRepository: AuthRepository,
    private val carsRepository: CarsRepository,
    private val bookingRepository: BookingRepository,
    private val messagingRepository: MessagingRepository,
    private val hostRepository: HostRepository,
    private val storageRepository: StorageRepository,
    private val sessionStore: SessionStore,
) : ViewModel() {
    private val defaultNotificationPreferences = NotificationPreferencesDto(
        booking_updates = true,
        messages = true,
        account_security = true,
        news_announcements = false,
    )

    private val _bootstrapping = MutableStateFlow(true)
    val bootstrapping: StateFlow<Boolean> = _bootstrapping.asStateFlow()

    private val _isAuthenticated = MutableStateFlow(false)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated.asStateFlow()

    private val _isGuestMode = MutableStateFlow(false)
    val isGuestMode: StateFlow<Boolean> = _isGuestMode.asStateFlow()

    private val _me = MutableStateFlow<MobileMeDto?>(null)
    val me: StateFlow<MobileMeDto?> = _me.asStateFlow()

    private val _carsState = MutableStateFlow<UiState<List<CarDto>>>(UiState.Idle)
    val carsState: StateFlow<UiState<List<CarDto>>> = _carsState.asStateFlow()

    private val _carDetailState = MutableStateFlow<UiState<CarDto>>(UiState.Idle)
    val carDetailState: StateFlow<UiState<CarDto>> = _carDetailState.asStateFlow()

    private val _favoritesState = MutableStateFlow<UiState<Set<String>>>(UiState.Idle)
    val favoritesState: StateFlow<UiState<Set<String>>> = _favoritesState.asStateFlow()

    private val _bookingsState = MutableStateFlow<UiState<List<BookingDto>>>(UiState.Idle)
    val bookingsState: StateFlow<UiState<List<BookingDto>>> = _bookingsState.asStateFlow()

    private val _conversationsState = MutableStateFlow<UiState<List<ConversationDto>>>(UiState.Idle)
    val conversationsState: StateFlow<UiState<List<ConversationDto>>> = _conversationsState.asStateFlow()

    private val _messagesState = MutableStateFlow<UiState<List<MessageDto>>>(UiState.Idle)
    val messagesState: StateFlow<UiState<List<MessageDto>>> = _messagesState.asStateFlow()

    private val _selectedConversationId = MutableStateFlow<String?>(null)
    val selectedConversationId: StateFlow<String?> = _selectedConversationId.asStateFlow()

    private val _pendingBookingFocus = MutableStateFlow<String?>(null)
    val pendingBookingFocus: StateFlow<String?> = _pendingBookingFocus.asStateFlow()

    private val _pendingHostTab = MutableStateFlow<HostMainTab?>(null)
    val pendingHostTab: StateFlow<HostMainTab?> = _pendingHostTab.asStateFlow()

    /** A renter tab a screen asked the main shell to show (e.g. "Explore cars" on an empty state). */
    private val _pendingMainTab = MutableStateFlow<MainTab?>(null)
    val pendingMainTab: StateFlow<MainTab?> = _pendingMainTab.asStateFlow()

    private val _myCarsState = MutableStateFlow<UiState<List<CarDto>>>(UiState.Idle)
    val myCarsState: StateFlow<UiState<List<CarDto>>> = _myCarsState.asStateFlow()

    // Platform fee the server charges on top of the daily rate (percent). Set
    // in the admin and sent with every car list, so price previews match the
    // amount the server will actually charge.
    private val _platformFeePercent = MutableStateFlow(10.0)
    val platformFeePercent: StateFlow<Double> = _platformFeePercent.asStateFlow()

    private val _carPhotosState = MutableStateFlow<UiState<List<CarPhotoItemDto>>>(UiState.Idle)
    val carPhotosState: StateFlow<UiState<List<CarPhotoItemDto>>> = _carPhotosState.asStateFlow()

    private val _carPhotosLimit = MutableStateFlow(7)
    val carPhotosLimit: StateFlow<Int> = _carPhotosLimit.asStateFlow()

    private val _hostReviewsState = MutableStateFlow<UiState<Int>>(UiState.Idle)
    val hostReviewsState: StateFlow<UiState<Int>> = _hostReviewsState.asStateFlow()

    private val _hostReviewsListState = MutableStateFlow<UiState<List<ReviewDto>>>(UiState.Idle)
    val hostReviewsListState: StateFlow<UiState<List<ReviewDto>>> = _hostReviewsListState.asStateFlow()

    private val _carReviewsState = MutableStateFlow<UiState<List<ReviewDto>>>(UiState.Idle)
    val carReviewsState: StateFlow<UiState<List<ReviewDto>>> = _carReviewsState.asStateFlow()

    private val _hostApplicationMessage = MutableStateFlow<String?>(null)
    val hostApplicationMessage: StateFlow<String?> = _hostApplicationMessage.asStateFlow()

    private val _locations = MutableStateFlow(AndroidReferenceData.districtsByRegion)
    val locations: StateFlow<Map<String, List<String>>> = _locations.asStateFlow()

    private val _catalog = MutableStateFlow(AndroidReferenceData.carModelsByMake)
    val catalog: StateFlow<Map<String, List<String>>> = _catalog.asStateFlow()

    private val _snackbar = MutableStateFlow<String?>(null)
    val snackbar: StateFlow<String?> = _snackbar.asStateFlow()

    private val _authPrompt = MutableStateFlow<AuthPromptRequest?>(null)
    val authPrompt: StateFlow<AuthPromptRequest?> = _authPrompt.asStateFlow()

    private val _notificationPreferences = MutableStateFlow(defaultNotificationPreferences)
    val notificationPreferences: StateFlow<NotificationPreferencesDto> = _notificationPreferences.asStateFlow()

    private val _activeAnnouncement = MutableStateFlow<AppAnnouncementDto?>(null)
    val activeAnnouncement: StateFlow<AppAnnouncementDto?> = _activeAnnouncement.asStateFlow()

    private val _pendingCheckout = MutableStateFlow<PaystackInitDto?>(null)
    val pendingCheckout: StateFlow<PaystackInitDto?> = _pendingCheckout.asStateFlow()

    /** Effective appearance: true when the UI should be dark right now. */
    private val _darkModeEnabled = MutableStateFlow(false)
    val darkModeEnabled: StateFlow<Boolean> = _darkModeEnabled.asStateFlow()

    /** What the user chose in Settings: follow the phone, always light, or always dark. */
    private val _appearanceMode = MutableStateFlow(AppearanceMode.SYSTEM)
    val appearanceMode: StateFlow<AppearanceMode> = _appearanceMode.asStateFlow()

    /** The phone's own setting, reported by the activity. */
    private var systemDarkTheme = false

    // Home browse location (city to region) — deliberately separate from the
    // profile city; only affects which vehicles are ranked "near you".
    private val _browseLocation = MutableStateFlow("" to "")
    val browseLocation: StateFlow<Pair<String, String>> = _browseLocation.asStateFlow()

    private val _appearanceTransitionEvents = MutableSharedFlow<Boolean>(extraBufferCapacity = 1)
    val appearanceTransitionEvents: SharedFlow<Boolean> = _appearanceTransitionEvents.asSharedFlow()

    private val _bookingDraft = MutableStateFlow<BookingDraft?>(null)
    val bookingDraft: StateFlow<BookingDraft?> = _bookingDraft.asStateFlow()

    /** Checkout the renter started paying for and did not finish (server-held). */
    private val _savedCheckout = MutableStateFlow<PendingCheckoutDto?>(null)
    val savedCheckout: StateFlow<PendingCheckoutDto?> = _savedCheckout.asStateFlow()

    private val _savedCheckoutLoading = MutableStateFlow(false)
    val savedCheckoutLoading: StateFlow<Boolean> = _savedCheckoutLoading.asStateFlow()

    /** Bumped whenever a checkout is paid, so screens still showing it can leave. */
    private val _lastCompletedCheckoutBookingId = MutableStateFlow<String?>(null)
    val lastCompletedCheckoutBookingId: StateFlow<String?> = _lastCompletedCheckoutBookingId.asStateFlow()

    private var lastSavedCheckoutRefreshMillis = 0L

    /** Identity check every renter passes before booking (see RenterVerificationScreens.kt). */
    private val _renterVerification = MutableStateFlow(RenterVerificationUiState())
    val renterVerification: StateFlow<RenterVerificationUiState> = _renterVerification.asStateFlow()

    private val _renterVerificationSubmit = MutableStateFlow(RenterVerificationSubmitState())
    val renterVerificationSubmit: StateFlow<RenterVerificationSubmitState> = _renterVerificationSubmit.asStateFlow()

    /** Set when something outside the screen (a push tap, a refused hold) wants the verification screen opened. */
    private val _renterVerificationScreenRequested = MutableStateFlow(false)
    val renterVerificationScreenRequested: StateFlow<Boolean> = _renterVerificationScreenRequested.asStateFlow()

    private var lastRenterVerificationRefreshMillis = 0L
    private var renterVerificationVersion = 0L

    /** Terms of Service every signed-in user accepts (see TermsScreens.kt). */
    private val _terms = MutableStateFlow(TermsUiState())
    val terms: StateFlow<TermsUiState> = _terms.asStateFlow()

    private val _termsAccept = MutableStateFlow(TermsAcceptState())
    val termsAccept: StateFlow<TermsAcceptState> = _termsAccept.asStateFlow()

    /** Policy documents by slug (see LegalDocumentScreens.kt). */
    private val _legalDocuments = MutableStateFlow<Map<String, LegalDocumentUiState>>(emptyMap())
    val legalDocuments: StateFlow<Map<String, LegalDocumentUiState>> = _legalDocuments.asStateFlow()
    private val legalDocumentRequestVersions = mutableMapOf<String, Long>()

    /** The "Delete account" request (see DeleteAccountScreens.kt). */
    private val _accountDeletion = MutableStateFlow(AccountDeletionUiState())
    val accountDeletion: StateFlow<AccountDeletionUiState> = _accountDeletion.asStateFlow()

    private var lastTermsRefreshMillis = 0L
    private var termsRequestVersion = 0L
    /** A booking call was refused with terms_required: trust that over a cached "not required". */
    private var termsRefusedByServer = false
    private val uploadedVerificationPaths = mutableMapOf<String, String>()
    private val draftJson = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    private var pendingAnnouncements: List<AppAnnouncementDto> = emptyList()
    private var firstLaunchAtMillis: Long? = null
    private var referenceDataLoaded = false
    private var referenceDataLoading = false
    private var carsRequestVersion = 0L
    private var carReviewsCarId: String? = null

    init {
        bootstrap()
        viewModelScope.launch {
            PushEvents.events.collect { data -> handlePushData(data) }
        }
    }

    /** A push arrived while the app is open: refresh what it talks about. */
    private fun handlePushData(data: Map<String, String>) {
        if (!_isAuthenticated.value) return
        when (data["type"]) {
            "listing_status" -> {
                loadMyCars()
                loadCars(mapOf("sort" to "new_listings", "limit" to "48"))
            }
            "renter_verification" -> refreshRenterVerification(force = true)
            else -> {
                loadBookings()
                refreshConversations()
                loadMyCars()
            }
        }
    }

    private var lastForegroundRefreshAt = 0L

    /**
     * Called from the activity's onResume: pick up decisions and bookings that
     * came in while the app was away. Throttled, since onResume also fires on
     * quick app switches.
     */
    fun refreshOnForeground() {
        if (!_isAuthenticated.value) return
        val now = System.currentTimeMillis()
        if (now - lastForegroundRefreshAt < 15_000L) return
        lastForegroundRefreshAt = now
        loadMyCars()
        loadBookings()
        refreshConversations()
        refreshRenterVerification()
        refreshTerms()
    }

    fun dismissSnackbar() {
        _snackbar.value = null
    }

    fun dismissAuthPrompt() {
        _authPrompt.value = null
    }

    fun setDarkMode(enabled: Boolean) {
        setAppearanceMode(if (enabled) AppearanceMode.DARK else AppearanceMode.LIGHT)
    }

    fun setAppearanceMode(mode: AppearanceMode) {
        val before = _darkModeEnabled.value
        _appearanceMode.value = mode
        val after = resolveDarkMode()
        if (before != after) {
            viewModelScope.launch { _appearanceTransitionEvents.emit(after) }
        }
        _darkModeEnabled.value = after
        viewModelScope.launch {
            sessionStore.setAppearanceMode(mode.storageValue)
            sessionStore.setDarkMode(after)
        }
    }

    /** Called by the activity whenever the phone's light/dark setting changes. */
    fun setSystemDarkTheme(dark: Boolean) {
        if (systemDarkTheme == dark) return
        systemDarkTheme = dark
        _darkModeEnabled.value = resolveDarkMode()
    }

    private fun resolveDarkMode(): Boolean = when (_appearanceMode.value) {
        AppearanceMode.SYSTEM -> systemDarkTheme
        AppearanceMode.LIGHT -> false
        AppearanceMode.DARK -> true
    }

    fun setBrowseLocation(city: String, region: String) {
        val next = city.trim() to region.trim()
        _browseLocation.value = next
        viewModelScope.launch { sessionStore.setBrowseLocation(next.first, next.second) }
    }

    fun bootstrap() {
        viewModelScope.launch {
            _bootstrapping.value = true
            try {
                _appearanceMode.value = AppearanceMode.fromStorage(sessionStore.appearanceMode())
                _darkModeEnabled.value = resolveDarkMode()
                _browseLocation.value = sessionStore.browseLocation()
                restoreBookingDraft()
                val loggedIn = authRepository.isLoggedIn()
                _isAuthenticated.value = loggedIn
                if (loggedIn) {
                    loadAfterAuth()
                    registerPushIfAvailable()
                    viewModelScope.launch {
                        runCatching { loadMeWithAvatarFallback() }
                            .onSuccess { _me.value = it }
                            .onFailure {
                                _snackbar.value = it.readableMessage("Session expired. Please log in again.")
                                authRepository.logout()
                                _isAuthenticated.value = false
                            }
                    }
                }
                loadReferenceData()
                refreshActiveAnnouncements()
                if (!loggedIn) {
                    loadCars()
                }
            } catch (error: Throwable) {
                _snackbar.value = error.readableMessage("Unable to finish app startup.")
            } finally {
                _bootstrapping.value = false
            }
        }
    }

    private fun loadAfterAuth() {
        loadCars()
        loadFavorites()
        loadBookings()
        loadConversations()
        loadHostStatus()
        loadHostReviews()
        loadNotificationPreferences()
        refreshActiveAnnouncements()
        refreshSavedCheckout(force = true)
        refreshRenterVerification(force = true)
        refreshTerms(force = true)
    }

    fun login(
        email: String,
        password: String,
        onSuccess: () -> Unit = {},
        onFailure: (String) -> Unit = { _snackbar.value = it },
    ) {
        viewModelScope.launch {
            _bootstrapping.value = true
            runCatching { authRepository.login(email, password) }
                .onSuccess {
                    _isAuthenticated.value = true
                    _isGuestMode.value = false
                    _me.value = loadMeWithAvatarFallback()
                    loadAfterAuth()
                    registerPushIfAvailable()
                    AnalyticsService.track("login_completed")
                    onSuccess()
                }
                .onFailure { onFailure(it.loginFailureMessage()) }
            _bootstrapping.value = false
        }
    }

    fun signup(
        firstName: String,
        lastName: String,
        email: String,
        password: String,
        city: String,
        region: String,
        onSuccess: (requiresEmailConfirmation: Boolean) -> Unit = {},
    ) {
        viewModelScope.launch {
            _bootstrapping.value = true
            runCatching {
                authRepository.signup(firstName, lastName, email, password, city, region)
            }.onSuccess { session ->
                AnalyticsService.track("signup_completed")
                if ((session.requires_email_confirmation == true) || session.access_token.isNullOrBlank()) {
                    _snackbar.value = "Account created. Please confirm your email before logging in."
                    onSuccess(true)
                } else {
                    _isAuthenticated.value = true
                    _isGuestMode.value = false
                    _me.value = loadMeWithAvatarFallback()
                    loadAfterAuth()
                    registerPushIfAvailable()
                    onSuccess(false)
                }
            }.onFailure {
                _snackbar.value = it.readableMessage("Sign up failed")
            }
            _bootstrapping.value = false
        }
    }

    fun forgotPassword(email: String) {
        viewModelScope.launch {
            runCatching { authRepository.forgotPassword(email) }
                .onSuccess { _snackbar.value = "If this account exists, a reset email has been sent." }
                .onFailure { _snackbar.value = it.readableMessage("Unable to send password reset email") }
        }
    }

    fun resendConfirmation(email: String) {
        viewModelScope.launch {
            runCatching { authRepository.resendConfirmation(email) }
                .onSuccess { _snackbar.value = "Confirmation email sent if account exists." }
                .onFailure { _snackbar.value = it.readableMessage("Unable to resend confirmation email") }
        }
    }

    fun logout() {
        viewModelScope.launch {
            val pushToken =
                PushTokenStore.lastUploadedToken()
                    ?: PushTokenHolder.token
                    ?: PushTokenStore.currentToken()
            if (!pushToken.isNullOrBlank()) {
                runCatching { hostRepository.unregisterAndroidPushToken(pushToken) }
            }
            authRepository.logout()
            PushTokenStore.clearUploadedToken()
            _isAuthenticated.value = false
            _isGuestMode.value = false
            _authPrompt.value = null
            _me.value = null
            _favoritesState.value = UiState.Idle
            _bookingsState.value = UiState.Idle
            _conversationsState.value = UiState.Idle
            _messagesState.value = UiState.Idle
            _selectedConversationId.value = null
            _carReviewsState.value = UiState.Idle
            _carPhotosState.value = UiState.Idle
            _carPhotosLimit.value = 7
            _bookingDraft.value = null
            _pendingCheckout.value = null
            _savedCheckout.value = null
            _savedCheckoutLoading.value = false
            clearRenterVerification()
            clearTerms()
            _accountDeletion.value = AccountDeletionUiState()
            _notificationPreferences.value = defaultNotificationPreferences
            _pendingBookingFocus.value = null
            _pendingHostTab.value = null
            pendingAnnouncements = emptyList()
            _activeAnnouncement.value = null
            loadCars()
            refreshActiveAnnouncements()
        }
    }

    fun continueAsGuest() {
        _isGuestMode.value = true
        _isAuthenticated.value = false
        _authPrompt.value = null
        _me.value = null
        _favoritesState.value = UiState.Empty
        _bookingsState.value = UiState.Empty
        _conversationsState.value = UiState.Empty
        _messagesState.value = UiState.Empty
        _selectedConversationId.value = null
        loadCars()
        refreshActiveAnnouncements()
        _snackbar.value = "Guest mode enabled."
    }

    fun returnToAuth() {
        _isGuestMode.value = false
        _snackbar.value = null
        _authPrompt.value = null
    }

    fun loadReferenceData() {
        if (referenceDataLoaded || referenceDataLoading) return
        referenceDataLoading = true
        viewModelScope.launch {
            try {
                runCatching { carsRepository.getLocations() }
                    .onSuccess { envelope ->
                    val remote = envelope.data.orEmpty().filterKeys { it.isNotBlank() }
                    _locations.value = if (remote.isEmpty()) {
                        AndroidReferenceData.districtsByRegion
                    } else {
                        AndroidReferenceData.districtsByRegion.toMutableMap().apply {
                            remote.forEach { (region, cities) ->
                                val canonicalRegion = AndroidReferenceData.normalizedRegion(region)
                                this[canonicalRegion] = (this[canonicalRegion].orEmpty() + cities)
                                    .map { it.trim() }
                                    .filter { it.isNotBlank() }
                                    .distinct()
                            }
                        }
                    }
                    }
                runCatching { carsRepository.getCarCatalog() }
                    .onSuccess { envelope ->
                    val remote = envelope.makes
                        .filter { it.name.isNotBlank() }
                        .associate { make ->
                            make.name to make.models.map { it.name }.filter { it.isNotBlank() }
                        }
                    _catalog.value = if (remote.isEmpty()) {
                        AndroidReferenceData.carModelsByMake
                    } else {
                        AndroidReferenceData.carModelsByMake.toMutableMap().apply {
                            remote.forEach { (make, models) ->
                                val canonicalMake = AndroidReferenceData.normalizedMake(make).ifBlank { make.trim() }
                                this[canonicalMake] = (this[canonicalMake].orEmpty() + models)
                                    .map { it.trim() }
                                    .filter { it.isNotBlank() }
                                    .distinct()
                            }
                        }
                    }
                    }
                referenceDataLoaded = true
            } finally {
                referenceDataLoading = false
            }
        }
    }

    fun loadCars(params: Map<String, String> = emptyMap()) {
        val requestVersion = ++carsRequestVersion
        viewModelScope.launch {
            val hasExistingCars = _carsState.value is UiState.Success<List<CarDto>>
            if (!hasExistingCars) {
                _carsState.value = UiState.Loading
            }
            runCatching { carsRepository.getCars(params) }
                .onSuccess { envelope ->
                    applyPlatformFee(envelope.meta)
                    if (requestVersion == carsRequestVersion) {
                        _carsState.value = if (envelope.data.isEmpty()) UiState.Empty else UiState.Success(envelope.data)
                    }
                }
                .onFailure {
                    if (requestVersion != carsRequestVersion) return@onFailure
                    val message = it.readableMessage("Unable to load cars.")
                    if (hasExistingCars) {
                        _snackbar.value = message
                    } else {
                        _carsState.value = UiState.Error(message)
                    }
                }
        }
    }

    fun loadCarDetail(carId: String) {
        viewModelScope.launch {
            val current = (_carDetailState.value as? UiState.Success<CarDto>)?.data
            val cached = (_carsState.value as? UiState.Success<List<CarDto>>)?.data?.firstOrNull { it.id == carId }
            if (current?.id != carId) {
                _carDetailState.value = cached?.let { UiState.Success(it) } ?: UiState.Loading
            }
            runCatching { carsRepository.getCarDetail(carId).data }
                .onSuccess { _carDetailState.value = UiState.Success(it) }
                .onFailure {
                    if ((_carDetailState.value as? UiState.Success<CarDto>)?.data?.id != carId) {
                        _carDetailState.value = UiState.Error(it.readableMessage("Unable to load car details."))
                    }
                }
        }
    }

    fun loadCarReviews(carId: String) {
        viewModelScope.launch {
            if (carReviewsCarId != carId) {
                _carReviewsState.value = UiState.Loading
            }
            carReviewsCarId = carId
            runCatching { bookingRepository.getCarReviews(carId).data }
                .onSuccess { reviews ->
                    _carReviewsState.value = if (reviews.isEmpty()) UiState.Empty else UiState.Success(reviews)
                }
                .onFailure { _carReviewsState.value = UiState.Error(it.readableMessage("Unable to load car reviews.")) }
        }
    }

    fun checkAvailability(
        carId: String,
        startDate: String,
        endDate: String,
        onResult: (available: Boolean, message: String?) -> Unit,
    ) {
        loadAvailabilitySnapshot(
            carId = carId,
            startDate = startDate,
            endDate = endDate,
        ) { envelope, error ->
            if (error != null) {
                onResult(false, error)
            } else if (envelope?.available == true) {
                onResult(true, "Dates are available.")
            } else {
                onResult(false, envelope?.reason ?: "Selected dates are unavailable.")
            }
        }
    }

    fun loadAvailabilitySnapshot(
        carId: String,
        startDate: String,
        endDate: String,
        onResult: (AvailabilityEnvelope?, String?) -> Unit,
    ) {
        viewModelScope.launch {
            runCatching { carsRepository.getAvailability(carId, startDate, endDate) }
                .onSuccess { envelope ->
                    onResult(envelope, null)
                }
                .onFailure {
                    onResult(null, it.readableMessage("Unable to check availability."))
                }
        }
    }

    fun loadFavorites() {
        viewModelScope.launch {
            if (!_isAuthenticated.value) {
                _favoritesState.value = UiState.Empty
                return@launch
            }
            if (_favoritesState.value !is UiState.Success && _favoritesState.value !is UiState.Empty) {
                _favoritesState.value = UiState.Loading
            }
            runCatching { carsRepository.getFavorites().data.map { it.car_id }.toSet() }
                .onSuccess { ids ->
                    _favoritesState.value = if (ids.isEmpty()) UiState.Empty else UiState.Success(ids)
                }
                .onFailure { _favoritesState.value = UiState.Error(it.readableMessage("Unable to load favorites.")) }
        }
    }

    fun toggleFavorite(carId: String, currentlyFavorite: Boolean, authDestination: String? = null) {
        viewModelScope.launch {
            if (!_isAuthenticated.value) {
                requireAuthentication(
                    message = "Sign in or sign up to save listings.",
                    destination = authDestination,
                )
                return@launch
            }
            runCatching { carsRepository.setFavorite(carId, !currentlyFavorite) }
                .onSuccess {
                    AnalyticsService.track(
                        if (currentlyFavorite) "car_unfavorited" else "car_favorited",
                        mapOf("car_id" to carId),
                    )
                    loadFavorites()
                }
                .onFailure { _snackbar.value = it.readableMessage("Unable to update favorite") }
        }
    }

    fun loadBookings() {
        viewModelScope.launch {
            if (!_isAuthenticated.value) return@launch
            if (_bookingsState.value !is UiState.Success && _bookingsState.value !is UiState.Empty) {
                _bookingsState.value = UiState.Loading
            }
            runCatching { bookingRepository.getBookings().data }
                .onSuccess { list ->
                    _bookingsState.value = if (list.isEmpty()) UiState.Empty else UiState.Success(list)
                }
                .onFailure { _bookingsState.value = UiState.Error(it.readableMessage("Unable to load bookings.")) }
        }
    }

    fun createBookingHoldAndInitiatePayment(
        carId: String,
        startDate: String,
        endDate: String,
        tripMode: String?,
        tripUseRegion: String,
        tripUseCity: String,
        tripUseAddress: String,
        deliveryAddress: String?,
        deliveryTime: String?,
        contactPhone: String?,
        deliveryNotes: String?,
        callbackUrl: String,
        onReady: (PaystackInitDto) -> Unit,
        onError: (String) -> Unit = {},
        onVerificationRequired: () -> Unit = {},
    ) {
        viewModelScope.launch {
            val tripDays = runCatching {
                ChronoUnit.DAYS.between(LocalDate.parse(startDate), LocalDate.parse(endDate))
                    .coerceAtLeast(0)
            }.getOrDefault(0)
            AnalyticsService.track(
                "booking_started",
                mapOf("car_id" to carId, "region" to tripUseRegion, "days" to tripDays),
            )
            runCatching {
                val hold = bookingRepository.createHold(
                    carId = carId,
                    startDate = startDate,
                    endDate = endDate,
                    tripMode = tripMode,
                    tripUseRegion = tripUseRegion,
                    tripUseCity = tripUseCity,
                    tripUseAddress = tripUseAddress,
                    deliveryAddress = deliveryAddress,
                    deliveryTime = deliveryTime,
                    contactPhone = contactPhone,
                    deliveryNotes = deliveryNotes,
                )
                val initiated = bookingRepository.initiatePaystack(
                    bookingId = hold.bookingId,
                    callbackUrl = callbackUrl,
                ).data
                val amountMinor = initiated.amount?.roundToInt() ?: 0
                if (amountMinor <= 0) {
                    error("Invalid payment amount from server.")
                }
                val checkoutUrl = initiated.payment_url
                    ?.trim()
                    ?.takeIf { it.isNotBlank() }
                    ?: initiated.authorization_url.trim().takeIf { it.isNotBlank() }
                    ?: error("Missing payment URL from server.")
                initiated.copy(
                    amount = amountMinor.toDouble(),
                    authorization_url = checkoutUrl,
                    payment_url = checkoutUrl,
                )
            }.onSuccess { init ->
                _pendingCheckout.value = init
                AnalyticsService.track(
                    "booking_payment_started",
                    mapOf(
                        "car_id" to carId,
                        "price_bucket" to analyticsPriceBucket((init.amount ?: 0.0) / 100.0),
                    ),
                )
                onReady(init)
            }.onFailure {
                val refusal = it.forbiddenBody()
                if (refusal != null && noteVerificationRequired(refusal)) {
                    // The server wants the identity check first: guide the renter
                    // there instead of showing a dead-end error.
                    onVerificationRequired()
                    return@onFailure
                }
                if (refusal != null && noteTermsRequired(refusal)) {
                    // The agreement screen now covers the app; once it is accepted the renter
                    // is back on this checkout and can pay. No snackbar underneath it.
                    onError(extractApiMessage(refusal) ?: TermsRequiredMessage)
                    return@onFailure
                }
                val message = if (refusal != null) {
                    extractApiMessage(refusal) ?: "Unable to start booking"
                } else {
                    it.readableMessage("Unable to start booking")
                }
                _snackbar.value = message
                onError(message)
            }
        }
    }

    fun finalizePaystack(
        request: PaystackFinalizeRequest,
        onSuccess: (conversationId: String?) -> Unit = {},
        onError: (String) -> Unit = {},
    ) {
        viewModelScope.launch {
            runCatching { bookingRepository.finalizePaystack(request) }
                .onSuccess { result ->
                    val paymentStatus = result.data?.payment_status?.trim()?.lowercase()
                    val bookingStatus = result.data?.status?.trim()?.lowercase()
                    // A booking the webhook already moved to the host (or confirmed)
                    // is paid, even if the row came back without payment_status.
                    val bookingIsPaid = paymentStatus == "paid" ||
                        bookingStatus == "awaiting_host" ||
                        bookingStatus == "confirmed"
                    if (!bookingIsPaid) {
                        onError("Payment not completed yet. Finish payment in secure checkout before verifying.")
                        return@onSuccess
                    }
                    _pendingCheckout.value = null
                    markCheckoutCompleted(request.bookingId)
                    AnalyticsService.track(
                        "booking_completed",
                        mapOf("car_id" to request.carId, "region" to request.tripUseRegion),
                    )
                    loadBookings()
                    loadConversations()
                    onSuccess(result.conversationId)
                }
                .onFailure {
                    val message = it.readableMessage("Unable to finalize payment")
                    _snackbar.value = message
                    onError(message)
                }
        }
    }

    fun approveBooking(bookingId: String) {
        viewModelScope.launch {
            runCatching { bookingRepository.approveBooking(bookingId) }
                .onSuccess {
                    _snackbar.value = "Booking approved."
                    loadBookings()
                }
                .onFailure { _snackbar.value = it.readableMessage("Unable to approve booking") }
        }
    }

    fun rejectBooking(bookingId: String, reason: String?) {
        viewModelScope.launch {
            runCatching { bookingRepository.rejectBooking(bookingId, reason) }
                .onSuccess {
                    _snackbar.value = "Booking rejected and refund triggered."
                    loadBookings()
                }
                .onFailure { _snackbar.value = it.readableMessage("Unable to reject booking") }
        }
    }

    fun createDispute(bookingId: String, reason: String) {
        viewModelScope.launch {
            runCatching { bookingRepository.createDispute(bookingId, reason) }
                .onSuccess { _snackbar.value = "Dispute opened." }
                .onFailure { _snackbar.value = it.readableMessage("Unable to open dispute") }
        }
    }

    fun submitReview(
        bookingId: String,
        rating: Int,
        comment: String,
        onSuccess: () -> Unit = {},
        onError: (String) -> Unit = {},
    ) {
        viewModelScope.launch {
            runCatching { bookingRepository.submitReview(bookingId, rating, comment) }
                .onSuccess {
                    _snackbar.value = "Review submitted."
                    AnalyticsService.track("review_submitted")
                    onSuccess()
                }
                .onFailure {
                    val message = it.readableMessage("Unable to submit review")
                    _snackbar.value = message
                    onError(message)
                }
        }
    }

    fun setBookingDraft(
        carId: String,
        startDate: String,
        endDate: String,
        region: String,
        city: String,
        address: String,
        tripMode: String? = null,
        deliveryAddress: String = "",
        deliveryTime: String = "",
        contactPhone: String = "",
        deliveryNotes: String = "",
        carTitle: String = _bookingDraft.value?.takeIf { it.carId == carId }?.carTitle.orEmpty(),
        carImageUrl: String? = _bookingDraft.value?.takeIf { it.carId == carId }?.carImageUrl,
        dailyPrice: Int = _bookingDraft.value?.takeIf { it.carId == carId }?.dailyPrice ?: 0,
        step: Int = 0,
        persist: Boolean = true,
    ) {
        val draft = BookingDraft(
            carId = carId,
            startDate = startDate,
            endDate = endDate,
            region = region,
            city = city,
            address = address,
            tripMode = tripMode,
            deliveryAddress = deliveryAddress,
            deliveryTime = deliveryTime,
            contactPhone = contactPhone,
            deliveryNotes = deliveryNotes,
            carTitle = carTitle,
            carImageUrl = carImageUrl,
            dailyPrice = dailyPrice,
            step = step,
            userId = _me.value?.user?.id.orEmpty(),
            updatedAtMillis = System.currentTimeMillis(),
        )
        _bookingDraft.value = draft
        if (persist) {
            viewModelScope.launch {
                runCatching { sessionStore.setCheckoutDraftJson(draftJson.encodeToString(draft)) }
            }
        }
    }

    fun clearBookingDraft() {
        _bookingDraft.value = null
        viewModelScope.launch { runCatching { sessionStore.setCheckoutDraftJson(null) } }
    }

    private suspend fun restoreBookingDraft() {
        val raw = runCatching { sessionStore.checkoutDraftJson() }.getOrNull() ?: return
        val draft = runCatching { draftJson.decodeFromString(BookingDraft.serializer(), raw) }.getOrNull() ?: return
        // Drafts older than three days are stale: the dates have likely passed.
        val ageMillis = System.currentTimeMillis() - draft.updatedAtMillis
        if (draft.updatedAtMillis > 0L && ageMillis > 72L * 60L * 60L * 1000L) {
            runCatching { sessionStore.setCheckoutDraftJson(null) }
            return
        }
        _bookingDraft.value = draft
    }

    // MARK: Resumable checkout ------------------------------------------------------------------

    /**
     * Asks the server for an unfinished checkout. Throttled so Home, Trips and
     * foregrounding do not each fire a request; [force] skips the throttle.
     */
    fun refreshSavedCheckout(force: Boolean = false) {
        if (!_isAuthenticated.value) {
            _savedCheckout.value = null
            return
        }
        val now = System.currentTimeMillis()
        if (!force && now - lastSavedCheckoutRefreshMillis < 20_000L) return
        lastSavedCheckoutRefreshMillis = now
        viewModelScope.launch {
            if (_savedCheckout.value == null) _savedCheckoutLoading.value = true
            runCatching { bookingRepository.pendingCheckout() }
                .onSuccess { envelope ->
                    val completed = envelope.completed
                    if (completed?.bookingId != null) {
                        // A payment that had gone through while the app was away
                        // was just confirmed by the server. Nothing left to resume.
                        markCheckoutCompleted(completed.bookingId)
                        _snackbar.value = "Your earlier payment went through. The booking is now in Trips."
                        loadBookings()
                        loadConversations()
                    } else {
                        _savedCheckout.value = envelope.data
                        val draft = _bookingDraft.value
                        if (envelope.data != null && draft != null && draft.carId == envelope.data.carId) {
                            // The server copy carries the same choices plus a booking id.
                            clearBookingDraft()
                        }
                    }
                }
            _savedCheckoutLoading.value = false
        }
    }

    /** Re-checks every condition server-side and refreshes the hold. Does not open Paystack. */
    fun resumeSavedCheckout(bookingId: String, onResult: (SavedCheckoutResumeResult) -> Unit) {
        viewModelScope.launch {
            runCatching { bookingRepository.resumeCheckout(bookingId) }
                .onSuccess { result ->
                    when (result.outcome) {
                        "completed" -> {
                            val id = result.bookingId ?: bookingId
                            markCheckoutCompleted(id)
                            loadBookings()
                            loadConversations()
                            onResult(SavedCheckoutResumeResult.Completed(id, result.conversationId))
                        }
                        "ready" -> {
                            val checkout = result.checkout
                            if (checkout == null) {
                                onResult(SavedCheckoutResumeResult.Failed("We couldn't resume your booking. Please try again.", gone = false))
                            } else {
                                _savedCheckout.value = checkout
                                onResult(SavedCheckoutResumeResult.Ready(checkout))
                            }
                        }
                        else -> {
                            val checkout = result.checkout
                            if (checkout == null) {
                                onResult(SavedCheckoutResumeResult.Failed("We couldn't resume your booking. Please try again.", gone = false))
                            } else {
                                _savedCheckout.value = checkout
                                onResult(SavedCheckoutResumeResult.Blocked(checkout))
                            }
                        }
                    }
                }
                .onFailure { error ->
                    val refusal = error.forbiddenBody()
                    if (refusal != null) {
                        if (noteVerificationRequired(refusal)) requestRenterVerificationScreen()
                        noteTermsRequired(refusal)
                        onResult(
                            SavedCheckoutResumeResult.Failed(
                                extractApiMessage(refusal) ?: "We couldn't resume your booking. Please try again.",
                                gone = false,
                            ),
                        )
                        return@onFailure
                    }
                    val gone = (error as? HttpException)?.code() == 404
                    if (gone) _savedCheckout.value = null
                    onResult(
                        SavedCheckoutResumeResult.Failed(
                            error.readableMessage("We couldn't resume your booking. Please try again."),
                            gone = gone,
                        ),
                    )
                }
        }
    }

    /** Starts Paystack for a checkout the server just marked ready, reusing its held booking. */
    fun initiateResumedPayment(
        checkout: PendingCheckoutDto,
        callbackUrl: String,
        onReady: (PaystackInitDto) -> Unit,
        onError: (String) -> Unit,
    ) {
        viewModelScope.launch {
            runCatching {
                val initiated = bookingRepository.initiatePaystack(
                    bookingId = checkout.bookingId,
                    callbackUrl = callbackUrl,
                ).data
                val amountMinor = initiated.amount?.roundToInt() ?: 0
                if (amountMinor <= 0) error("Invalid payment amount from server.")
                val checkoutUrl = initiated.payment_url
                    ?.trim()
                    ?.takeIf { it.isNotBlank() }
                    ?: initiated.authorization_url.trim().takeIf { it.isNotBlank() }
                    ?: error("Missing payment URL from server.")
                initiated.copy(
                    amount = amountMinor.toDouble(),
                    authorization_url = checkoutUrl,
                    payment_url = checkoutUrl,
                )
            }.onSuccess { init ->
                _pendingCheckout.value = init
                AnalyticsService.track(
                    "booking_payment_started",
                    mapOf(
                        "car_id" to checkout.carId,
                        "price_bucket" to analyticsPriceBucket((init.amount ?: 0.0) / 100.0),
                    ),
                )
                onReady(init)
            }.onFailure {
                val refusal = it.forbiddenBody()
                val message = if (refusal != null) {
                    if (noteVerificationRequired(refusal)) requestRenterVerificationScreen()
                    noteTermsRequired(refusal)
                    extractApiMessage(refusal) ?: "Unable to start payment"
                } else {
                    it.readableMessage("Unable to start payment")
                }
                onError(message)
            }
        }
    }

    /**
     * Drops the saved checkout: releases the hold server-side (when there is one)
     * and forgets any local draft. [onDone] receives false only when the server refused.
     */
    fun abandonSavedCheckout(bookingId: String?, carId: String?, onDone: (Boolean) -> Unit = {}) {
        viewModelScope.launch {
            if (bookingId.isNullOrBlank()) {
                clearBookingDraft()
                onDone(true)
                return@launch
            }
            runCatching { bookingRepository.abandonCheckout(bookingId) }
                .onSuccess { result ->
                    if (result?.outcome == "completed" && result.bookingId != null) {
                        markCheckoutCompleted(result.bookingId)
                        _snackbar.value = "Your earlier payment went through, so this booking was kept. Find it in Trips."
                        loadBookings()
                    } else {
                        if (_savedCheckout.value?.bookingId == bookingId) _savedCheckout.value = null
                        if (carId != null && _bookingDraft.value?.carId == carId) clearBookingDraft()
                        AnalyticsService.track("booking_abandoned", mapOf("car_id" to carId.orEmpty(), "stage" to "resume"))
                    }
                    onDone(true)
                }
                .onFailure {
                    _snackbar.value = it.readableMessage("We couldn't clear that booking. Please try again.")
                    onDone(false)
                }
        }
    }

    private fun markCheckoutCompleted(bookingId: String) {
        _savedCheckout.value = null
        _savedCheckoutLoading.value = false
        clearBookingDraft()
        _lastCompletedCheckoutBookingId.value = bookingId
    }

    fun showMessage(message: String) {
        _snackbar.value = message
    }

    // MARK: Renter identity verification --------------------------------------------------------

    /**
     * Loads the renter's verification status. Lightly throttled so sign-in, foregrounding
     * and screens do not each fire a request; [force] skips the throttle. A failed request
     * (offline, or an older server without the endpoint) leaves the status as it was, which
     * is UNKNOWN until the first answer, so booking is never blocked on a guess.
     */
    fun refreshRenterVerification(force: Boolean = false) {
        if (!_isAuthenticated.value) return
        val now = System.currentTimeMillis()
        if (!force && now - lastRenterVerificationRefreshMillis < 10_000L) return
        lastRenterVerificationRefreshMillis = now
        val version = ++renterVerificationVersion
        _renterVerification.value = _renterVerification.value.copy(isLoading = true)
        viewModelScope.launch {
            val result = runCatching { bookingRepository.getRenterVerification() }
            // A newer load, a submit or a sign-out happened meanwhile: this answer is stale.
            if (version != renterVerificationVersion) return@launch
            val dto = result.getOrNull()
            if (dto != null) {
                applyRenterVerification(dto)
            } else {
                _renterVerification.value = _renterVerification.value.copy(isLoading = false)
            }
        }
    }

    private fun applyRenterVerification(dto: RenterVerificationDto) {
        val status = parseRenterVerificationStatus(dto.status)
        val previous = _renterVerification.value
        _renterVerification.value = RenterVerificationUiState(
            status = status,
            required = dto.required ?: true,
            canBook = dto.canBook ?: (status == RenterVerificationStatus.APPROVED || dto.required == false),
            submittedAt = dto.submittedAt,
            reviewedAt = dto.reviewedAt,
            rejectionReason = dto.rejectionReason?.trim()?.takeIf { it.isNotBlank() },
            isLoading = false,
        )
        if (status != previous.status && !_renterVerificationSubmit.value.inProgress) {
            _renterVerificationSubmit.value = RenterVerificationSubmitState()
        }
    }

    private fun parseRenterVerificationStatus(raw: String?): RenterVerificationStatus {
        return when (raw?.trim()?.lowercase()) {
            "unverified" -> RenterVerificationStatus.UNVERIFIED
            "pending" -> RenterVerificationStatus.PENDING
            "approved" -> RenterVerificationStatus.APPROVED
            "rejected" -> RenterVerificationStatus.REJECTED
            else -> RenterVerificationStatus.UNKNOWN
        }
    }

    /**
     * Reads a 403 body from a booking call. Returns true (and records that this renter
     * cannot book yet) when the server refused because the identity check is missing.
     */
    private fun noteVerificationRequired(body: String): Boolean {
        val json = runCatching { draftJson.parseToJsonElement(body).jsonObject }.getOrNull() ?: return false
        val code = runCatching { json["code"]?.jsonPrimitive?.contentOrNull }.getOrNull()
        if (code != "verification_required") return false
        val reported = parseRenterVerificationStatus(
            runCatching { json["verificationStatus"]?.jsonPrimitive?.contentOrNull }.getOrNull(),
        )
        val current = _renterVerification.value
        renterVerificationVersion += 1
        _renterVerification.value = current.copy(
            status = when {
                reported != RenterVerificationStatus.UNKNOWN -> reported
                current.status == RenterVerificationStatus.UNKNOWN ||
                    current.status == RenterVerificationStatus.APPROVED -> RenterVerificationStatus.UNVERIFIED
                else -> current.status
            },
            required = true,
            canBook = false,
            isLoading = false,
        )
        refreshRenterVerification(force = true)
        return true
    }

    fun requestRenterVerificationScreen() {
        _renterVerificationScreenRequested.value = true
    }

    fun consumeRenterVerificationScreenRequest() {
        _renterVerificationScreenRequested.value = false
    }

    fun dismissRenterVerificationError() {
        val current = _renterVerificationSubmit.value
        if (!current.inProgress && current.error != null) {
            _renterVerificationSubmit.value = RenterVerificationSubmitState()
        }
    }

    /**
     * Uploads the three prepared photos to the private ID bucket and sends them for review.
     * Runs in the view model so it survives rotation; photos that already uploaded are not
     * sent again when the renter retries after a failure.
     */
    fun submitRenterVerification(face: File, licenceFront: File, licenceBack: File) {
        if (_renterVerificationSubmit.value.inProgress) return
        _renterVerificationSubmit.value = RenterVerificationSubmitState(inProgress = true, step = 1)
        viewModelScope.launch {
            runCatching {
                // Confirms the session first (refreshing an expired token), and stops
                // early when another device already sent photos for review.
                val latest = runCatching { bookingRepository.getRenterVerification() }.getOrNull()
                val latestStatus = parseRenterVerificationStatus(latest?.status)
                if (latest != null &&
                    (latestStatus == RenterVerificationStatus.PENDING || latestStatus == RenterVerificationStatus.APPROVED)
                ) {
                    return@runCatching latest
                }

                val userId = _me.value?.user?.id?.takeIf { it.isNotBlank() }
                    ?: loadMeWithAvatarFallback().also { _me.value = it }.user.id
                val uploads = listOf(
                    "face" to face,
                    "licence-front" to licenceFront,
                    "licence-back" to licenceBack,
                )
                val paths = uploads.mapIndexed { index, (kind, file) ->
                    _renterVerificationSubmit.value = RenterVerificationSubmitState(inProgress = true, step = index + 1)
                    val cacheKey = "$userId|$kind|${file.absolutePath}|${file.length()}|${file.lastModified()}"
                    uploadedVerificationPaths[cacheKey]
                        ?: storageRepository.uploadRenterVerificationPhoto(userId = userId, kind = kind, file = file)
                            .also { uploadedVerificationPaths[cacheKey] = it }
                }
                _renterVerificationSubmit.value = RenterVerificationSubmitState(inProgress = true, step = 4)
                bookingRepository.submitRenterVerification(
                    facePath = paths[0],
                    licenceFrontPath = paths[1],
                    licenceBackPath = paths[2],
                )
            }.onSuccess { dto ->
                listOf(face, licenceFront, licenceBack).forEach { file -> runCatching { file.delete() } }
                // Signed out while the photos were on their way: nothing to show.
                if (!_isAuthenticated.value) return@onSuccess
                uploadedVerificationPaths.clear()
                renterVerificationVersion += 1
                _renterVerificationSubmit.value = RenterVerificationSubmitState()
                if (dto != null && parseRenterVerificationStatus(dto.status) != RenterVerificationStatus.UNKNOWN) {
                    applyRenterVerification(dto)
                } else {
                    _renterVerification.value = _renterVerification.value.copy(
                        status = RenterVerificationStatus.PENDING,
                        rejectionReason = null,
                        isLoading = false,
                    )
                }
                AnalyticsService.track("renter_verification_submitted")
                refreshRenterVerification(force = true)
            }.onFailure { error ->
                if (!_isAuthenticated.value) return@onFailure
                _renterVerificationSubmit.value = RenterVerificationSubmitState(
                    error = error.readableMessage(
                        "We couldn't send your photos. Check your connection and try again. Your photos are still here.",
                    ),
                )
                // A 409 means photos are already under review: pick that up.
                refreshRenterVerification(force = true)
            }
        }
    }

    private fun clearRenterVerification() {
        renterVerificationVersion += 1
        lastRenterVerificationRefreshMillis = 0L
        uploadedVerificationPaths.clear()
        _renterVerification.value = RenterVerificationUiState()
        _renterVerificationSubmit.value = RenterVerificationSubmitState()
        _renterVerificationScreenRequested.value = false
    }

    // MARK: Terms of Service --------------------------------------------------------------------

    /**
     * Loads the agreement text and, when signed in, whether this user has accepted it.
     * Lightly throttled like [refreshRenterVerification]; [force] skips the throttle. Fails
     * open: a failed request, a 404 from an older server or a document with no sections
     * never asks for acceptance, and never takes away a document already on screen.
     */
    fun refreshTerms(force: Boolean = false) {
        val now = System.currentTimeMillis()
        if (!force && now - lastTermsRefreshMillis < 10_000L) return
        lastTermsRefreshMillis = now
        val version = ++termsRequestVersion
        _terms.value = _terms.value.copy(isLoading = true)
        viewModelScope.launch {
            val result = runCatching { bookingRepository.getTerms() }
            // A newer load, an accept or a sign-in/sign-out happened meanwhile: this answer is stale.
            if (version != termsRequestVersion) return@launch
            val answer = result.getOrNull()
            val dto = answer?.withReadableSections()
            if (dto != null) {
                applyTerms(dto)
            } else {
                val current = _terms.value
                // An answer without text can still say there is nothing left to accept.
                val cleared = answer != null && (answer.accepted == true || answer.required == false)
                if (cleared) termsRefusedByServer = false
                _terms.value = current.copy(
                    isLoading = false,
                    loadFailed = current.document == null,
                    mustAccept = current.mustAccept && !cleared,
                )
            }
        }
    }

    private fun applyTerms(dto: TermsDto) {
        val signedIn = _isAuthenticated.value
        val previous = _terms.value
        val accepted = dto.accepted == true
        if (accepted) termsRefusedByServer = false
        val mustAccept = signedIn && !accepted && (dto.required == true || termsRefusedByServer)
        _terms.value = TermsUiState(document = dto, mustAccept = mustAccept)
        val versionChanged = previous.document != null && previous.document.version != dto.version
        val accept = _termsAccept.value
        if (!accept.inProgress) {
            _termsAccept.value = when {
                !mustAccept -> TermsAcceptState()
                versionChanged && previous.mustAccept -> TermsAcceptState(updatedWhileReading = true)
                else -> accept
            }
        }
    }

    /** Posts the acceptance of the version on screen. Runs here so it survives rotation. */
    fun acceptTerms() {
        if (_termsAccept.value.inProgress || !_isAuthenticated.value) return
        val document = _terms.value.document ?: return
        _termsAccept.value = _termsAccept.value.copy(inProgress = true, error = null)
        viewModelScope.launch {
            runCatching { bookingRepository.acceptTerms(document.version.orEmpty()) }
                .onSuccess { result ->
                    // Signed out while the request was on its way: nothing to show.
                    if (!_isAuthenticated.value) return@onSuccess
                    termsRequestVersion += 1
                    termsRefusedByServer = false
                    _termsAccept.value = TermsAcceptState()
                    val latest = _terms.value.document ?: document
                    _terms.value = TermsUiState(
                        document = latest.copy(accepted = true, acceptedAt = result?.acceptedAt ?: latest.acceptedAt),
                    )
                    AnalyticsService.track("terms_accepted")
                }
                .onFailure { error ->
                    if (!_isAuthenticated.value) return@onFailure
                    if ((error as? HttpException)?.code() == 409) {
                        // The version on screen is no longer the current one: show the new text.
                        _termsAccept.value = TermsAcceptState(
                            error = "We have updated these terms. Please read the latest version, then accept.",
                        )
                        refreshTerms(force = true)
                    } else {
                        _termsAccept.value = TermsAcceptState(
                            error = if (error is HttpException) {
                                error.readableMessage("We couldn't save your acceptance. Please try again.")
                            } else {
                                "We couldn't save your acceptance. Check your connection and try again."
                            },
                            updatedWhileReading = _termsAccept.value.updatedWhileReading,
                        )
                    }
                }
        }
    }

    /**
     * Reads a 403 body from a booking call. Returns true when the server refused because the
     * Terms of Service are not accepted, and puts the agreement screen up: at once when the
     * text is already loaded, otherwise as soon as it arrives.
     */
    private fun noteTermsRequired(body: String): Boolean {
        val json = runCatching { draftJson.parseToJsonElement(body).jsonObject }.getOrNull() ?: return false
        val code = runCatching { json["code"]?.jsonPrimitive?.contentOrNull }.getOrNull()
        if (code != "terms_required") return false
        termsRefusedByServer = true
        val current = _terms.value
        if (current.document != null && _isAuthenticated.value) {
            _terms.value = current.copy(
                document = current.document.copy(accepted = false, acceptedAt = null),
                mustAccept = true,
            )
        }
        refreshTerms(force = true)
        return true
    }

    private fun clearTerms() {
        termsRequestVersion += 1
        lastTermsRefreshMillis = 0L
        termsRefusedByServer = false
        // The text is the same for everyone; only this user's acceptance is forgotten.
        val document = _terms.value.document?.copy(accepted = null, acceptedAt = null)
        _terms.value = TermsUiState(document = document)
        _termsAccept.value = TermsAcceptState()
    }

    // MARK: Policy documents --------------------------------------------------------------------

    /**
     * Loads one policy document ("protection", "cancellation" or "privacy"). The copy saved
     * on this device shows at once when nothing is on screen yet, then the server's copy
     * replaces it and is saved for next time. A failed load never takes away a document that
     * is already showing.
     */
    fun loadLegalDocument(slug: String) {
        val key = slug.trim().lowercase()
        if (key.isEmpty()) return
        val version = (legalDocumentRequestVersions[key] ?: 0L) + 1L
        legalDocumentRequestVersions[key] = version
        updateLegalDocument(key) { it.copy(isLoading = true, loadFailed = false) }
        viewModelScope.launch {
            if (_legalDocuments.value[key]?.document == null) {
                val saved = runCatching { bookingRepository.cachedLegalDocument(key) }.getOrNull()?.withQuestions()
                if (saved != null && legalDocumentRequestVersions[key] == version) {
                    updateLegalDocument(key) { if (it.document == null) it.copy(document = saved) else it }
                }
            }
            val fresh = runCatching { bookingRepository.getLegalDocument(key) }.getOrNull()?.withQuestions()
            // A newer load of the same document started meanwhile: this answer is stale.
            if (legalDocumentRequestVersions[key] != version) return@launch
            if (fresh != null) {
                updateLegalDocument(key) { LegalDocumentUiState(document = fresh) }
                bookingRepository.cacheLegalDocument(key, fresh)
            } else {
                updateLegalDocument(key) {
                    it.copy(
                        isLoading = false,
                        loadFailed = it.document == null,
                        showingSavedCopy = it.document != null,
                    )
                }
            }
        }
    }

    private fun updateLegalDocument(slug: String, change: (LegalDocumentUiState) -> LegalDocumentUiState) {
        val all = _legalDocuments.value
        _legalDocuments.value = all + (slug to change(all[slug] ?: LegalDocumentUiState()))
    }

    /** Drops empty groups and questions; null when nothing readable is left. */
    private fun LegalDocumentDto.withQuestions(): LegalDocumentDto? {
        val readable = groups.orEmpty().mapNotNull { group ->
            val questions = group.questions.orEmpty().mapNotNull { question ->
                val paragraphs = question.a.orEmpty().map { it.trim() }.filter { it.isNotEmpty() }
                val text = question.q?.trim().orEmpty()
                if (text.isEmpty() || paragraphs.isEmpty()) null else question.copy(q = text, a = paragraphs)
            }
            if (questions.isEmpty()) null else group.copy(questions = questions)
        }
        return if (readable.isEmpty()) null else copy(groups = readable)
    }

    // MARK: Account deletion --------------------------------------------------------------------

    /**
     * Sends the request to delete this account. Runs here so it survives rotation. Nothing
     * is signed out until the user has read the answer and taps Done ([finishAccountDeletion]).
     */
    fun requestAccountDeletion() {
        val current = _accountDeletion.value
        if (current.inProgress || current.receivedMessage != null || !_isAuthenticated.value) return
        _accountDeletion.value = AccountDeletionUiState(inProgress = true)
        viewModelScope.launch {
            runCatching { authRepository.requestAccountDeletion() }
                .onSuccess { result ->
                    if (!_isAuthenticated.value) return@onSuccess
                    if (result?.requested == false) {
                        _accountDeletion.value = AccountDeletionUiState(
                            error = result.message?.trim()?.takeIf { it.isNotEmpty() }
                                ?: "We couldn't send your request. Please try again.",
                        )
                        return@onSuccess
                    }
                    _accountDeletion.value = AccountDeletionUiState(
                        receivedMessage = result?.message?.trim()?.takeIf { it.isNotEmpty() }
                            ?: "We have your request. Your account will be deleted within 30 days.",
                    )
                }
                .onFailure { error ->
                    if (!_isAuthenticated.value) return@onFailure
                    _accountDeletion.value = AccountDeletionUiState(
                        error = if (error is HttpException) {
                            error.readableMessage("We couldn't send your request. Please try again.")
                        } else {
                            "We couldn't send your request. Check your connection and try again."
                        },
                    )
                }
        }
    }

    /** Leaving the screen before anything was sent: forget a failed attempt. */
    fun dismissAccountDeletionError() {
        val current = _accountDeletion.value
        if (!current.inProgress && current.receivedMessage == null && current.error != null) {
            _accountDeletion.value = AccountDeletionUiState()
        }
    }

    /** The request was received and read: sign out of this device. */
    fun finishAccountDeletion() {
        if (_accountDeletion.value.receivedMessage == null) return
        logout()
    }

    fun loadNotificationPreferences() {
        viewModelScope.launch {
            if (!_isAuthenticated.value) {
                _notificationPreferences.value = defaultNotificationPreferences
                return@launch
            }
            runCatching { hostRepository.notificationPreferences().data }
                .onSuccess { prefs ->
                    _notificationPreferences.value = prefs.normalize(defaultNotificationPreferences)
                }
                .onFailure {
                    _snackbar.value = it.readableMessage("Unable to load notification settings")
                }
        }
    }

    fun updateNotificationPreference(
        bookingUpdates: Boolean? = null,
        messages: Boolean? = null,
        accountSecurity: Boolean? = null,
        newsAnnouncements: Boolean? = null,
    ) {
        val current = _notificationPreferences.value.normalize(defaultNotificationPreferences)
        val next = NotificationPreferencesDto(
            booking_updates = bookingUpdates ?: current.booking_updates,
            messages = messages ?: current.messages,
            account_security = accountSecurity ?: current.account_security,
            news_announcements = newsAnnouncements ?: current.news_announcements,
        )
        _notificationPreferences.value = next
        if (!_isAuthenticated.value) return

        viewModelScope.launch {
            runCatching { hostRepository.updateNotificationPreferences(next).data }
                .onSuccess { saved ->
                    _notificationPreferences.value = saved.normalize(defaultNotificationPreferences)
                }
                .onFailure {
                    _notificationPreferences.value = current
                    _snackbar.value = it.readableMessage("Unable to save notification settings")
                }
        }
    }

    fun refreshActiveAnnouncements() {
        viewModelScope.launch {
            val locallySeen = sessionStore.seenAnnouncementIds()
            val installedAfter = firstLaunchAtMillis ?: sessionStore.firstLaunchAtMillis().also {
                firstLaunchAtMillis = it
            }
            runCatching { hostRepository.announcements().data }
                .onSuccess { announcements ->
                    pendingAnnouncements = announcements.filter { announcement ->
                        announcement.shouldDisplay(locallySeen, installedAfter)
                    }
                    if (_activeAnnouncement.value?.delivery == "push") {
                        return@onSuccess
                    }
                    _activeAnnouncement.value = pendingAnnouncements.firstOrNull()
                }
                .onFailure {
                    if (_activeAnnouncement.value == null) {
                        pendingAnnouncements = emptyList()
                    }
                }
        }
    }

    fun showAnnouncementFromPush(
        id: String,
        title: String?,
        body: String?,
        category: String?,
        ctaUrl: String?,
    ) {
        val normalizedId = id.trim()
        val normalizedTitle = title?.trim().takeUnless { it.isNullOrBlank() } ?: "Hayame update"
        val normalizedBody = body?.trim().takeUnless { it.isNullOrBlank() } ?: "Open Hayame for the latest update."
        if (normalizedId.isBlank()) return

        val announcement = AppAnnouncementDto(
            id = normalizedId,
            title = normalizedTitle,
            body = normalizedBody,
            category = category?.trim().takeUnless { it.isNullOrBlank() } ?: "news",
            delivery = "push",
            audience = "all",
            show_once = true,
            cta_label = ctaUrl?.trim().takeUnless { it.isNullOrBlank() }?.let { "Open" },
            cta_url = ctaUrl?.trim().takeUnless { it.isNullOrBlank() },
            seen = false,
        )
        pendingAnnouncements = listOf(announcement) + pendingAnnouncements.filterNot { it.id == normalizedId }
        _activeAnnouncement.value = announcement
    }

    fun dismissActiveAnnouncement() {
        val current = _activeAnnouncement.value ?: return
        viewModelScope.launch {
            if (current.show_once != false) {
                sessionStore.markAnnouncementSeen(current.id)
                if (_isAuthenticated.value) {
                    runCatching { hostRepository.markAnnouncementSeen(current.id) }
                }
            }
            pendingAnnouncements = pendingAnnouncements.filterNot { it.id == current.id }
            _activeAnnouncement.value = pendingAnnouncements.firstOrNull()
        }
    }

    fun requireAuthentication(message: String, destination: String? = null) {
        if (_isAuthenticated.value) return
        _authPrompt.value = AuthPromptRequest(
            message = message,
            destination = destination,
        )
    }

    fun loadConversations() {
        viewModelScope.launch {
            if (!_isAuthenticated.value) return@launch
            if (_conversationsState.value !is UiState.Success && _conversationsState.value !is UiState.Empty) {
                _conversationsState.value = UiState.Loading
            }
            runCatching { messagingRepository.conversations().data }
                .onSuccess { list ->
                    _conversationsState.value = if (list.isEmpty()) UiState.Empty else UiState.Success(list)
                }
                .onFailure { _conversationsState.value = UiState.Error(it.readableMessage("Unable to load conversations.")) }
        }
    }

    fun refreshConversations() {
        viewModelScope.launch {
            if (!_isAuthenticated.value) return@launch
            runCatching { messagingRepository.conversations().data }
                .onSuccess { list ->
                    _conversationsState.value = if (list.isEmpty()) UiState.Empty else UiState.Success(list)
                }
        }
    }

    fun createConversation(hostId: String?, participantId: String?, carId: String?, onCreated: (String) -> Unit) {
        viewModelScope.launch {
            runCatching { messagingRepository.createConversation(hostId = hostId, participantId = participantId, carId = carId).id }
                .onSuccess {
                    loadConversations()
                    onCreated(it)
                }
                .onFailure { _snackbar.value = it.readableMessage("Unable to create conversation") }
        }
    }

    fun selectConversation(conversationId: String) {
        _selectedConversationId.value = conversationId
        loadMessages(conversationId)
    }

    fun focusBooking(bookingId: String, openHostBookings: Boolean = false) {
        val normalized = bookingId.trim()
        if (normalized.isBlank()) return
        _pendingBookingFocus.value = normalized
        if (openHostBookings) {
            _pendingHostTab.value = HostMainTab.BOOKINGS
        }
    }

    fun requestHostTab(tab: HostMainTab) {
        _pendingHostTab.value = tab
    }

    fun requestMainTab(tab: MainTab) {
        _pendingMainTab.value = tab
    }

    fun consumePendingMainTab(tab: MainTab) {
        if (_pendingMainTab.value == tab) {
            _pendingMainTab.value = null
        }
    }

    fun consumePendingBookingFocus(bookingId: String) {
        if (_pendingBookingFocus.value == bookingId) {
            _pendingBookingFocus.value = null
        }
    }

    fun consumePendingHostTab(tab: HostMainTab) {
        if (_pendingHostTab.value == tab) {
            _pendingHostTab.value = null
        }
    }

    fun loadMessages(conversationId: String, since: String? = null) {
        viewModelScope.launch {
            _messagesState.value = UiState.Loading
            runCatching {
                messagingRepository.messages(
                    conversationId = conversationId,
                    since = since,
                    markRead = true,
                ).data
            }.onSuccess { list ->
                _messagesState.value = if (list.isEmpty()) UiState.Empty else UiState.Success(list)
                loadConversations()
            }.onFailure {
                _messagesState.value = UiState.Error(it.readableMessage("Unable to load messages."))
            }
        }
    }

    fun refreshMessages(conversationId: String) {
        viewModelScope.launch {
            if (!_isAuthenticated.value) return@launch
            val current = (_messagesState.value as? UiState.Success<List<MessageDto>>)?.data.orEmpty()
            val since = current.maxByOrNull { it.created_at }?.created_at
            runCatching {
                messagingRepository.messages(
                    conversationId = conversationId,
                    since = since,
                    markRead = true,
                ).data
            }.onSuccess { incoming ->
                if (incoming.isNotEmpty()) {
                    val merged = (current + incoming)
                        .associateBy { it.id }
                        .values
                        .sortedBy { it.created_at }
                    _messagesState.value = UiState.Success(merged)
                } else if (_messagesState.value is UiState.Loading) {
                    _messagesState.value = if (current.isEmpty()) UiState.Empty else UiState.Success(current)
                }
                refreshConversations()
            }
        }
    }

    fun sendMessage(conversationId: String, body: String) {
        viewModelScope.launch {
            if (body.isBlank()) return@launch
            runCatching { messagingRepository.sendMessage(conversationId, body.trim()) }
                .onSuccess { response ->
                    val current = (_messagesState.value as? UiState.Success<List<MessageDto>>)?.data.orEmpty()
                    _messagesState.value = UiState.Success(
                        (current + response.data)
                            .associateBy { it.id }
                            .values
                            .sortedBy { it.created_at },
                    )
                    AnalyticsService.track("message_sent")
                    refreshConversations()
                }
                .onFailure { _snackbar.value = it.readableMessage("Unable to send message") }
        }
    }

    fun sendMessageIfMissing(conversationId: String, body: String) {
        viewModelScope.launch {
            val trimmed = body.trim()
            if (trimmed.isBlank()) return@launch
            runCatching {
                val existing = messagingRepository.messages(
                    conversationId = conversationId,
                    markRead = false,
                    limit = 500,
                ).data
                val alreadySent = existing.any { message ->
                    message.body.trim() == trimmed
                }
                if (!alreadySent) {
                    messagingRepository.sendMessage(conversationId, trimmed)
                }
            }.onSuccess {
                loadMessages(conversationId)
            }.onFailure {
                _snackbar.value = it.readableMessage("Unable to send message")
            }
        }
    }

    /** Reloads the signed-in profile (name, avatar, host status) for pull to refresh. */
    fun refreshProfile() {
        viewModelScope.launch {
            if (!_isAuthenticated.value) return@launch
            runCatching { loadMeWithAvatarFallback() }.onSuccess { _me.value = it }
        }
    }

    fun loadHostStatus() {
        viewModelScope.launch {
            if (!_isAuthenticated.value) return@launch
            runCatching {
                val meValue = _me.value
                val hostStatus = hostRepository.hostStatus()
                meValue?.copy(
                    is_host = hostStatus.is_host,
                    host_status = hostStatus.status,
                    host_application_status = hostStatus.host_application_status,
                )
            }.onSuccess { updated ->
                if (updated != null) {
                    _me.value = updated
                }
                loadHostApplication()
            }.onFailure {
                _snackbar.value = it.readableMessage("Unable to load host status")
            }
        }
    }

    fun loadHostApplication() {
        viewModelScope.launch {
            if (!_isAuthenticated.value) return@launch
            runCatching { hostRepository.hostApplication().data }
                .onSuccess { application ->
                    val current = _me.value
                    if (current != null) {
                        _me.value = current.copy(host_application = application)
                    }
                }
        }
    }

    fun submitHostApplication(request: HostApplicationRequest) {
        viewModelScope.launch {
            runCatching { hostRepository.submitHostApplication(request) }
                .onSuccess {
                    _hostApplicationMessage.value = "Application submitted."
                    loadHostStatus()
                }
                .onFailure { _hostApplicationMessage.value = it.readableMessage("Unable to submit host application") }
        }
    }

    fun activateHost() {
        viewModelScope.launch {
            runCatching { hostRepository.activateHost() }
                .onSuccess {
                    loadHostStatus()
                    _snackbar.value = "Host mode activated."
                }
                .onFailure { _snackbar.value = it.readableMessage("Unable to activate host") }
        }
    }

    private fun applyPlatformFee(meta: CarsMetaDto?) {
        val value = meta?.platform_fee_percent ?: return
        if (value.isFinite() && value >= 0.0 && value <= 100.0) {
            _platformFeePercent.value = value
        }
    }

    fun loadMyCars() {
        viewModelScope.launch {
            if (_myCarsState.value !is UiState.Success && _myCarsState.value !is UiState.Empty) {
                _myCarsState.value = UiState.Loading
            }
            runCatching { carsRepository.getMyCars() }
                .onSuccess { envelope ->
                    applyPlatformFee(envelope.meta)
                    val list = envelope.data
                    _myCarsState.value = if (list.isEmpty()) UiState.Empty else UiState.Success(list)
                }
                .onFailure { _myCarsState.value = UiState.Error(it.readableMessage("Unable to load your listings")) }
        }
    }

    fun loadCarPhotos(carId: String) {
        viewModelScope.launch {
            _carPhotosState.value = UiState.Loading
            runCatching { carsRepository.getCarPhotos(carId) }
                .onSuccess { envelope ->
                    _carPhotosLimit.value = envelope.meta?.max_photos ?: 7
                    _carPhotosState.value = if (envelope.data.isEmpty()) UiState.Empty else UiState.Success(envelope.data)
                }
                .onFailure { _carPhotosState.value = UiState.Error(it.readableMessage("Unable to load listing photos")) }
        }
    }

    fun uploadCarPhoto(carId: String, file: File, replacePhotoId: String? = null) {
        viewModelScope.launch {
            runCatching { carsRepository.uploadCarPhoto(carId, file, replacePhotoId) }
                .onSuccess {
                    _snackbar.value = if (replacePhotoId.isNullOrBlank()) "Photo uploaded." else "Photo replaced."
                    loadCarPhotos(carId)
                }
                .onFailure { _snackbar.value = it.readableMessage("Unable to upload photo") }
        }
    }

    fun deleteCarPhoto(carId: String, photoId: String) {
        viewModelScope.launch {
            runCatching { carsRepository.deleteCarPhoto(carId, photoId) }
                .onSuccess {
                    _snackbar.value = "Photo deleted."
                    loadCarPhotos(carId)
                }
                .onFailure { _snackbar.value = it.readableMessage("Unable to delete photo") }
        }
    }

    fun createCar(payload: JsonObject, onDone: () -> Unit = {}) {
        viewModelScope.launch {
            runCatching { carsRepository.createCar(payload) }
                .onSuccess {
                    _snackbar.value = "Listing submitted for review."
                    loadMyCars()
                    onDone()
                }
                .onFailure { _snackbar.value = it.readableMessage("Unable to create listing") }
        }
    }

    fun submitListing(
        payload: JsonObject,
        pendingPhotoFiles: List<File> = emptyList(),
        onComplete: (ListingSubmissionResult) -> Unit = {},
    ) {
        viewModelScope.launch {
            runCatching {
                val created = carsRepository.createCar(payload).data
                var uploadedCount = 0
                val uploadFailures = mutableListOf<String>()

                pendingPhotoFiles.take(7).forEach { file ->
                    runCatching { carsRepository.uploadCarPhoto(created.id, file) }
                        .onSuccess { uploadedCount += 1 }
                        .onFailure { uploadFailures += it.readableMessage("Unable to upload photo") }
                }

                loadMyCars()
                ListingSubmissionResult(
                    createdCar = created,
                    uploadedCount = uploadedCount,
                    uploadFailures = uploadFailures,
                )
            }.onSuccess { result ->
                _snackbar.value = when {
                    result.uploadFailures.isNotEmpty() ->
                        "Listing submitted. ${result.uploadedCount} photo(s) uploaded, and some uploads failed."
                    result.uploadedCount > 0 ->
                        "Listing submitted and ${result.uploadedCount} photo(s) uploaded."
                    else -> "Listing submitted for review."
                }
                onComplete(result)
            }.onFailure {
                val message = it.readableMessage("Unable to create listing")
                _snackbar.value = message
                onComplete(ListingSubmissionResult(error = message))
            }
        }
    }

    fun updateCar(
        carId: String,
        payload: JsonObject,
        onDone: () -> Unit = {},
        onError: (String) -> Unit = {},
    ) {
        viewModelScope.launch {
            runCatching { carsRepository.updateCar(carId, payload) }
                .onSuccess {
                    _snackbar.value = "Listing updated."
                    loadMyCars()
                    onDone()
                }
                .onFailure {
                    val message = it.readableMessage("Unable to update listing")
                    _snackbar.value = message
                    onError(message)
                }
        }
    }

    fun updateCarApprovalStatus(carId: String, status: String) {
        val payload = buildJsonObject { put("approval_status", status) }
        updateCar(
            carId = carId,
            payload = payload,
            onDone = { loadCars(mapOf("limit" to "100")) },
        )
    }

    fun deleteCar(carId: String) {
        viewModelScope.launch {
            runCatching { carsRepository.deleteCar(carId) }
                .onSuccess {
                    _snackbar.value = "Listing deleted."
                    loadMyCars()
                }
                .onFailure { _snackbar.value = it.readableMessage("Unable to delete listing") }
        }
    }

    fun loadHostReviewsCount() {
        viewModelScope.launch {
            _hostReviewsState.value = UiState.Loading
            runCatching { bookingRepository.getHostReviews().data.size }
                .onSuccess {
                    _hostReviewsState.value = UiState.Success(it)
                }
                .onFailure { _hostReviewsState.value = UiState.Error(it.readableMessage("Unable to load host reviews")) }
        }
    }

    fun loadHostReviews() {
        viewModelScope.launch {
            _hostReviewsListState.value = UiState.Loading
            runCatching { bookingRepository.getHostReviews().data }
                .onSuccess { reviews ->
                    _hostReviewsListState.value = if (reviews.isEmpty()) UiState.Empty else UiState.Success(reviews)
                    _hostReviewsState.value = UiState.Success(reviews.size)
                }
                .onFailure {
                    _hostReviewsListState.value = UiState.Error(it.readableMessage("Unable to load host reviews"))
                    _hostReviewsState.value = UiState.Error(it.readableMessage("Unable to load host reviews"))
                }
        }
    }

    fun saveAvailabilityWindow(
        carId: String,
        startDate: String,
        endDate: String,
        available: Boolean,
        onDone: (Boolean) -> Unit = {},
    ) {
        viewModelScope.launch {
            runCatching { carsRepository.saveAvailabilityWindow(carId, startDate, endDate, available) }
                .onSuccess {
                    _snackbar.value = if (available) "Those days are open for bookings again." else "Dates blocked."
                    onDone(true)
                }
                .onFailure {
                    _snackbar.value = it.readableMessage("Unable to save availability window")
                    onDone(false)
                }
        }
    }

    fun saveAvailabilityRecurring(
        carId: String,
        startDate: String,
        endDate: String,
        repeatDays: List<String>,
        onDone: (Boolean) -> Unit = {},
    ) {
        viewModelScope.launch {
            runCatching { carsRepository.saveAvailabilityRecurring(carId, startDate, endDate, repeatDays) }
                .onSuccess {
                    _snackbar.value = "Weekly days off saved."
                    onDone(true)
                }
                .onFailure {
                    _snackbar.value = it.readableMessage("Unable to save recurring availability")
                    onDone(false)
                }
        }
    }

    fun upsertProfile(
        userId: String,
        firstName: String,
        lastName: String,
        fullName: String,
        city: String,
        region: String,
        phone: String,
        avatarFile: File? = null,
    ) {
        viewModelScope.launch {
            runCatching {
                val avatarUrl = if (avatarFile != null) {
                    storageRepository.uploadAvatar(userId = userId, file = avatarFile)
                } else {
                    _me.value.preferredAvatarRaw()
                }
                carsRepository.upsertProfile(
                    ProfileUpsertRequest(
                        id = userId,
                        first_name = firstName,
                        last_name = lastName,
                        full_name = fullName,
                        city = city,
                        region = region,
                        phone = phone,
                        avatar_url = avatarUrl,
                    ),
                )
            }.onSuccess {
                _snackbar.value = "Profile saved."
                runCatching { loadMeWithAvatarFallback() }.onSuccess { _me.value = it }
            }.onFailure {
                _snackbar.value = it.readableMessage("Unable to save profile")
            }
        }
    }

    fun uploadHostIdentity(userId: String, front: File?, back: File?, requestBuilder: (frontPath: String?, backPath: String?) -> HostApplicationRequest) {
        viewModelScope.launch {
            runCatching {
                val frontPath = front?.let { storageRepository.uploadHostId(userId = userId, side = "front", file = it) }
                val backPath = back?.let { storageRepository.uploadHostId(userId = userId, side = "back", file = it) }
                submitHostApplication(requestBuilder(frontPath, backPath))
            }.onFailure {
                _snackbar.value = it.readableMessage("Unable to upload host ID files")
            }
        }
    }

    fun submitHostApplicationWithDocuments(
        userId: String,
        front: File?,
        back: File?,
        existingFrontPath: String? = null,
        existingBackPath: String? = null,
        face: File?,
        requestBuilder: (frontPath: String, backPath: String) -> HostApplicationRequest,
        onResult: (error: String?) -> Unit,
    ) {
        viewModelScope.launch {
            AnalyticsService.track("host_application_started")
            runCatching {
                val frontPath = front?.let {
                    storageRepository.uploadHostId(userId = userId, side = "front", file = it)
                } ?: existingFrontPath?.trim()?.takeIf { it.isNotBlank() }
                    ?: throw IllegalArgumentException("ID front image is required")
                val backPath = back?.let {
                    storageRepository.uploadHostId(userId = userId, side = "back", file = it)
                } ?: existingBackPath?.trim()?.takeIf { it.isNotBlank() }
                    ?: throw IllegalArgumentException("ID back image is required")

                if (face != null) {
                    val avatarUrl = storageRepository.uploadAvatar(userId = userId, file = face)
                    val current = _me.value
                    val fullName = current?.profile?.full_name
                        ?.trim()
                        ?.takeIf { it.isNotBlank() }
                        ?: requestBuilder(frontPath, backPath).full_name
                    val nameParts = fullName.split(Regex("\\s+")).filter { it.isNotBlank() }
                    carsRepository.upsertProfile(
                        ProfileUpsertRequest(
                            id = userId,
                            first_name = current?.profile?.first_name ?: nameParts.firstOrNull().orEmpty(),
                            last_name = current?.profile?.last_name ?: nameParts.drop(1).joinToString(" "),
                            full_name = fullName,
                            city = current?.profile?.city ?: requestBuilder(frontPath, backPath).city,
                            region = current?.profile?.region ?: requestBuilder(frontPath, backPath).region,
                            phone = current?.profile?.phone ?: requestBuilder(frontPath, backPath).phone,
                            avatar_url = avatarUrl,
                        ),
                    )
                }

                hostRepository.submitHostApplication(requestBuilder(frontPath, backPath))
            }.onSuccess { response ->
                _hostApplicationMessage.value = "Application submitted."
                AnalyticsService.track("host_application_submitted")
                val current = _me.value
                if (current != null) {
                    _me.value = current.copy(
                        host_application_status = response.data?.status ?: "pending",
                        host_application = response.data ?: current.host_application,
                    )
                }
                runCatching { loadMeWithAvatarFallback() }.onSuccess { _me.value = it }
                loadHostStatus()
                onResult(null)
            }.onFailure { error ->
                val message = error.readableMessage("Unable to submit application. Please check your details and try again.")
                _hostApplicationMessage.value = message
                onResult(message)
            }
        }
    }

    fun registerPushIfAvailable(token: String? = null) {
        viewModelScope.launch {
            val pushToken =
                token?.trim().takeUnless { it.isNullOrBlank() }
                    ?: PushTokenHolder.token
                    ?: PushTokenStore.currentToken()
            if (pushToken.isNullOrBlank()) return@launch
            val previousToken = PushTokenStore.lastUploadedToken()?.takeIf { it != pushToken }
            runCatching { hostRepository.registerAndroidPushToken(pushToken, previousToken) }
                .onSuccess { response ->
                    if (response.registered != false) {
                        PushTokenStore.markUploadedToken(pushToken)
                    }
                    if (response.registered == false) {
                        response.warning?.let { _snackbar.value = it }
                    }
                }
        }
    }

    private suspend fun loadMeWithAvatarFallback(): MobileMeDto {
        val me = authRepository.getMe()
        if (!me.preferredAvatarRaw().isNullOrBlank()) return me
        val fallbackAvatar = runCatching { storageRepository.findLatestAvatarUrl(me.user.id) }.getOrNull()
        return me.withAvatarFallback(fallbackAvatar)
    }

    private fun analyticsPriceBucket(amountGhs: Double): String = when {
        !amountGhs.isFinite() || amountGhs < 0 -> "unknown"
        amountGhs < 200 -> "0-199"
        amountGhs < 500 -> "200-499"
        amountGhs < 1_000 -> "500-999"
        amountGhs < 2_000 -> "1000-1999"
        amountGhs < 5_000 -> "2000-4999"
        else -> "5000+"
    }

    companion object {
        private object PushTokenHolder {
            var token: String? = null
        }

        fun cachePushToken(token: String?) {
            val normalized = token?.trim()?.takeIf { it.isNotEmpty() }
            PushTokenHolder.token = normalized
            PushTokenStore.saveCurrentToken(normalized)
        }
    }
}

private fun NotificationPreferencesDto?.normalize(
    fallback: NotificationPreferencesDto,
): NotificationPreferencesDto {
    return NotificationPreferencesDto(
        booking_updates = this?.booking_updates ?: fallback.booking_updates,
        messages = this?.messages ?: fallback.messages,
        account_security = this?.account_security ?: fallback.account_security,
        news_announcements = this?.news_announcements ?: fallback.news_announcements,
    )
}

private fun AppAnnouncementDto.shouldDisplay(locallySeen: Set<String>, installedAfterMillis: Long): Boolean {
    if (id.isBlank()) return false
    if (title.isNullOrBlank() || body.isNullOrBlank()) return false
    if (delivery?.trim()?.lowercase() != "push") {
        val publishedAtMillis = published_at?.trim()?.takeIf { it.isNotBlank() }?.let { raw ->
            runCatching { Instant.parse(raw).toEpochMilli() }.getOrNull()
        } ?: return false
        if (publishedAtMillis < installedAfterMillis) return false
    }
    if (show_once == false) return true
    if (seen == true) return false
    return id !in locallySeen
}

/**
 * A cancellation (coroutine job cancelled, or an OkHttp "Canceled" call) is benign —
 * it happens when a refresh supersedes an in-flight request or a scope is torn down.
 * It must never surface to the user.
 */
private fun Throwable.isCancellation(): Boolean {
    if (this is java.util.concurrent.CancellationException) return true
    val msg = message?.trim()?.lowercase()
    return msg == "canceled" || msg == "cancelled"
}

/**
 * The raw body of a 403 from our API, or null for anything else. An error body can only be
 * read once, so callers that need both the `code` and the `message` read it through here.
 */
private const val TermsRequiredMessage = "Please accept the Terms of Service to book."

/** Drops blank sections and paragraphs; null when nothing readable is left. */
private fun TermsDto.withReadableSections(): TermsDto? {
    val readable = sections.orEmpty().mapNotNull { section ->
        val title = section.title?.trim().orEmpty()
        val paragraphs = section.paragraphs.orEmpty().map { it.trim() }.filter { it.isNotEmpty() }
        if (title.isEmpty() && paragraphs.isEmpty()) null else section.copy(title = title, paragraphs = paragraphs)
    }
    return if (readable.isEmpty()) null else copy(sections = readable)
}

private fun Throwable.forbiddenBody(): String? {
    val http = this as? HttpException ?: return null
    if (http.code() != 403) return null
    return runCatching { http.response()?.errorBody()?.string()?.trim() }.getOrNull().orEmpty()
}

private fun Throwable.readableMessage(fallback: String): String {
    // Trust by ORIGIN, not type. The ONLY user-safe message is the sanitized `message`
    // field our own backend returns (via failJson) — which reaches us as an HttpException
    // body from Retrofit (Retrofit only talks to our API host). Every other throwable —
    // OkHttp/IO/DNS/TLS/timeout, kotlinx SerializationException, cancellation, or a raw
    // Vercel/gateway HTML body — carries developer-facing text and must NEVER surface.
    if (isCancellation()) return fallback
    val http = this as? HttpException ?: return fallback
    val body = http.response()?.errorBody()?.string()?.trim().orEmpty()
    return extractApiMessage(body) ?: fallback
}

/**
 * Extracts the sanitized `message` from our backend's JSON error envelope
 * (`{"message":"..."}`). Returns null for HTML/gateway/non-envelope bodies so the caller
 * falls back to a friendly string.
 */
private fun extractApiMessage(body: String): String? {
    if (body.isBlank() || body.startsWith("<")) return null
    val raw = Regex("\"message\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"")
        .find(body)?.groupValues?.getOrNull(1) ?: return null
    val decoded = raw.replace("\\\"", "\"").replace("\\n", " ").replace("\\/", "/").trim()
    return decoded.takeIf { it.isNotBlank() && it.length <= 200 }
}

private fun Throwable.loginFailureMessage(): String {
    val message = readableMessage(WrongEmailOrPasswordMessage)
    val lowered = message.lowercase()
    val statusCode = (this as? HttpException)?.code()
    return if (statusCode == 401 || (lowered.contains("invalid") && lowered.contains("credential"))) {
        WrongEmailOrPasswordMessage
    } else {
        message
    }
}

/** How the app picks light or dark: follow the phone, or force one. */
enum class AppearanceMode(val storageValue: String, val title: String, val subtitle: String) {
    SYSTEM("system", "Auto", "Follows your phone's setting"),
    LIGHT("light", "Light", "Always light"),
    DARK("dark", "Dark", "Always dark");

    companion object {
        fun fromStorage(value: String?): AppearanceMode = entries.firstOrNull { it.storageValue == value } ?: SYSTEM
    }
}

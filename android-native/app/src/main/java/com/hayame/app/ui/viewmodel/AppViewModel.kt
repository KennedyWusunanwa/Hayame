package com.hayame.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hayame.app.core.network.AvailabilityEnvelope
import com.hayame.app.core.network.AppAnnouncementDto
import com.hayame.app.core.network.BookingDto
import com.hayame.app.core.network.CarDto
import com.hayame.app.core.network.CarPhotoItemDto
import com.hayame.app.core.network.ConversationDto
import com.hayame.app.core.network.HostApplicationRequest
import com.hayame.app.core.network.MessageDto
import com.hayame.app.core.network.MobileMeDto
import com.hayame.app.core.network.NotificationPreferencesDto
import com.hayame.app.core.network.PaystackFinalizeRequest
import com.hayame.app.core.network.PaystackInitDto
import com.hayame.app.core.network.ProfileUpsertRequest
import com.hayame.app.core.network.ReviewDto
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
import com.hayame.app.ui.reference.AndroidReferenceData
import com.hayame.app.ui.state.UiState
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import retrofit2.HttpException
import java.io.File
import java.time.Instant
import kotlin.math.roundToInt

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

    private val _myCarsState = MutableStateFlow<UiState<List<CarDto>>>(UiState.Idle)
    val myCarsState: StateFlow<UiState<List<CarDto>>> = _myCarsState.asStateFlow()

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

    private val _darkModeEnabled = MutableStateFlow(false)
    val darkModeEnabled: StateFlow<Boolean> = _darkModeEnabled.asStateFlow()

    // Home browse location (city to region) — deliberately separate from the
    // profile city; only affects which vehicles are ranked "near you".
    private val _browseLocation = MutableStateFlow("" to "")
    val browseLocation: StateFlow<Pair<String, String>> = _browseLocation.asStateFlow()

    private val _appearanceTransitionEvents = MutableSharedFlow<Boolean>(extraBufferCapacity = 1)
    val appearanceTransitionEvents: SharedFlow<Boolean> = _appearanceTransitionEvents.asSharedFlow()

    private val _bookingDraft = MutableStateFlow<BookingDraft?>(null)
    val bookingDraft: StateFlow<BookingDraft?> = _bookingDraft.asStateFlow()

    private var pendingAnnouncements: List<AppAnnouncementDto> = emptyList()
    private var firstLaunchAtMillis: Long? = null

    init {
        bootstrap()
    }

    fun dismissSnackbar() {
        _snackbar.value = null
    }

    fun dismissAuthPrompt() {
        _authPrompt.value = null
    }

    fun setDarkMode(enabled: Boolean) {
        if (_darkModeEnabled.value != enabled) {
            viewModelScope.launch {
                _appearanceTransitionEvents.emit(enabled)
            }
        }
        _darkModeEnabled.value = enabled
        viewModelScope.launch { sessionStore.setDarkMode(enabled) }
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
                _darkModeEnabled.value = sessionStore.darkMode()
                _browseLocation.value = sessionStore.browseLocation()
                val loggedIn = authRepository.isLoggedIn()
                _isAuthenticated.value = loggedIn
                if (loggedIn) {
                    runCatching { loadMeWithAvatarFallback() }
                        .onSuccess {
                            _me.value = it
                            loadAfterAuth()
                        }
                        .onFailure {
                            _snackbar.value = it.readableMessage("Session expired. Please log in again.")
                            authRepository.logout()
                            _isAuthenticated.value = false
                        }
                }
                loadReferenceData()
                refreshActiveAnnouncements()
                if (!loggedIn) {
                    _carsState.value = UiState.Loading
                    runCatching { carsRepository.getCars() }
                        .onSuccess { envelope ->
                            _carsState.value = if (envelope.data.isEmpty()) UiState.Empty else UiState.Success(envelope.data)
                        }
                        .onFailure { _carsState.value = UiState.Error(it.readableMessage("Unable to load cars.")) }
                }
            } catch (error: Throwable) {
                _snackbar.value = error.readableMessage("Unable to finish app startup.")
            } finally {
                _bootstrapping.value = false
            }
        }
    }

    private suspend fun loadAfterAuth() {
        loadCars()
        loadFavorites()
        loadBookings()
        loadConversations()
        loadHostStatus()
        loadHostReviews()
        loadNotificationPreferences()
        refreshActiveAnnouncements()
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
        viewModelScope.launch {
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
        }
    }

    fun loadCars(params: Map<String, String> = emptyMap()) {
        viewModelScope.launch {
            val hasExistingCars = _carsState.value is UiState.Success<List<CarDto>>
            if (!hasExistingCars) {
                _carsState.value = UiState.Loading
            }
            runCatching { carsRepository.getCars(params) }
                .onSuccess { envelope ->
                    _carsState.value = if (envelope.data.isEmpty()) UiState.Empty else UiState.Success(envelope.data)
                }
                .onFailure {
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
            _carDetailState.value = UiState.Loading
            runCatching { carsRepository.getCarDetail(carId).data }
                .onSuccess { _carDetailState.value = UiState.Success(it) }
                .onFailure { _carDetailState.value = UiState.Error(it.readableMessage("Unable to load car details.")) }
        }
    }

    fun loadCarReviews(carId: String) {
        viewModelScope.launch {
            _carReviewsState.value = UiState.Loading
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
            _favoritesState.value = UiState.Loading
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
                .onSuccess { loadFavorites() }
                .onFailure { _snackbar.value = it.readableMessage("Unable to update favorite") }
        }
    }

    fun loadBookings() {
        viewModelScope.launch {
            if (!_isAuthenticated.value) return@launch
            _bookingsState.value = UiState.Loading
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
    ) {
        viewModelScope.launch {
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
                onReady(init)
            }.onFailure {
                val message = it.readableMessage("Unable to start booking")
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
                    if (paymentStatus != "paid") {
                        onError("Payment not completed yet. Finish payment in secure checkout before verifying.")
                        return@onSuccess
                    }
                    _pendingCheckout.value = null
                    _bookingDraft.value = null
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
    ) {
        _bookingDraft.value = BookingDraft(
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
        )
    }

    fun clearBookingDraft() {
        _bookingDraft.value = null
    }

    fun showMessage(message: String) {
        _snackbar.value = message
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
            _conversationsState.value = UiState.Loading
            runCatching { messagingRepository.conversations().data }
                .onSuccess { list ->
                    _conversationsState.value = if (list.isEmpty()) UiState.Empty else UiState.Success(list)
                }
                .onFailure { _conversationsState.value = UiState.Error(it.readableMessage("Unable to load conversations.")) }
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

    fun sendMessage(conversationId: String, body: String) {
        viewModelScope.launch {
            if (body.isBlank()) return@launch
            runCatching { messagingRepository.sendMessage(conversationId, body.trim()) }
                .onSuccess {
                    loadMessages(conversationId)
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

    fun loadMyCars() {
        viewModelScope.launch {
            _myCarsState.value = UiState.Loading
            runCatching { carsRepository.getMyCars().data }
                .onSuccess { list ->
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

    fun saveAvailabilityWindow(carId: String, startDate: String, endDate: String, available: Boolean) {
        viewModelScope.launch {
            runCatching { carsRepository.saveAvailabilityWindow(carId, startDate, endDate, available) }
                .onSuccess { _snackbar.value = "Availability window saved." }
                .onFailure { _snackbar.value = it.readableMessage("Unable to save availability window") }
        }
    }

    fun saveAvailabilityRecurring(carId: String, startDate: String, endDate: String, repeatDays: List<String>) {
        viewModelScope.launch {
            runCatching { carsRepository.saveAvailabilityRecurring(carId, startDate, endDate, repeatDays) }
                .onSuccess { _snackbar.value = "Recurring availability saved." }
                .onFailure { _snackbar.value = it.readableMessage("Unable to save recurring availability") }
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

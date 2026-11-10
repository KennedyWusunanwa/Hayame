package com.hayame.app.ui.screens

import com.hayame.app.ui.components.coachTarget
import com.hayame.app.ui.components.CoachTour
import com.hayame.app.ui.components.CoachStep
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.Crossfade
import androidx.compose.animation.SizeTransform
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.animateIntAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.keyframes
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.AccountBalance
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.DirectionsCar
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material.icons.outlined.EventBusy
import androidx.compose.material.icons.outlined.Explore
import androidx.compose.material.icons.outlined.HourglassTop
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Key
import androidx.compose.material.icons.outlined.LocalShipping
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.PhoneIphone
import androidx.compose.material.icons.outlined.Place
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.VerifiedUser
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import coil.compose.AsyncImage
import com.hayame.app.core.network.CarDto
import com.hayame.app.core.network.PaystackFinalizeRequest
import com.hayame.app.core.network.preferredPhone
import com.hayame.app.ui.components.ErrorBlock
import com.hayame.app.ui.components.LoadingBlock
import com.hayame.app.ui.navigation.NavRoutes
import com.hayame.app.ui.state.UiState
import com.hayame.app.ui.theme.LocalHayameColors
import com.hayame.app.ui.viewmodel.AppViewModel
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Locale
import kotlin.math.max
import kotlin.math.roundToInt
import kotlinx.coroutines.delay

// Booking flow: everything after "Book now". Four steps (dates, handoff, review, pay) with a
// persistent car strip, a segmented progress bar, a running total in the bottom bar, and motion
// on every change: directional step slides, staggered sections, counting money, chip bounces,
// expanding delivery details, a shake on validation errors, and a success stage after payment.

@Composable
fun BookingScreen(
    viewModel: AppViewModel,
    carId: String,
    pendingPaystackCallbackUri: String?,
    onBack: () -> Unit,
    onOpenConversation: (String) -> Unit,
    onBookingCompleted: () -> Unit,
    onPaystackCallbackConsumed: () -> Unit,
    onVerificationRequired: () -> Unit = {},
) {
    val pendingCheckout by viewModel.pendingCheckout.collectAsState()
    val renterVerification by viewModel.renterVerification.collectAsState()
    val carState by viewModel.carDetailState.collectAsState()
    val locations by viewModel.locations.collectAsState()
    val bookingDraft by viewModel.bookingDraft.collectAsState()
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val me by viewModel.me.collectAsState()
    val platformFeePercent by viewModel.platformFeePercent.collectAsState()
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    var startDate by remember(carId) { mutableStateOf(LocalDate.now()) }
    var endDate by remember(carId) { mutableStateOf(LocalDate.now().plusDays(1)) }
    var blockedBookingDates by remember(carId) { mutableStateOf<Set<LocalDate>>(emptySet()) }
    var selectedQuickDuration by rememberSaveable(carId) { mutableStateOf<Int?>(null) }
    var region by remember(carId) { mutableStateOf("Greater Accra Region") }
    var city by remember(carId) { mutableStateOf("Accra") }
    var address by remember(carId) { mutableStateOf("") }
    var tripMode by rememberSaveable(carId) { mutableStateOf<CheckoutTripMode?>(null) }
    var deliveryAddress by rememberSaveable(carId) { mutableStateOf("") }
    var deliveryTime by rememberSaveable(carId) { mutableStateOf(defaultDeliveryTimeString()) }
    var contactPhone by rememberSaveable(carId) { mutableStateOf("") }
    var deliveryNotes by rememberSaveable(carId) { mutableStateOf("") }
    var paymentMessage by rememberSaveable(carId) { mutableStateOf<String?>(null) }
    var isProcessingPayment by rememberSaveable(carId) { mutableStateOf(false) }
    var isLoadingBookingAvailability by rememberSaveable(carId) { mutableStateOf(false) }
    var initialized by rememberSaveable(carId) { mutableStateOf(false) }
    var awaitingPaymentReturn by rememberSaveable(carId) { mutableStateOf(false) }
    var returnedFromPaymentWithoutCallback by rememberSaveable(carId) { mutableStateOf(false) }
    var currentStep by rememberSaveable(carId) { mutableStateOf(CheckoutStep.TRIP_DETAILS) }
    var bookingSucceeded by rememberSaveable(carId) { mutableStateOf(false) }
    var errorPulse by remember(carId) { mutableIntStateOf(0) }
    var activeDateTarget by remember(carId) { mutableStateOf<String?>(null) }
    // Shortest trip the host accepts. 1 until the car loads so nothing jumps
    // around; the date effects below re-run once the real value is known.
    val minimumNights = (carState as? UiState.Success<CarDto>)?.data?.minimumTripDays ?: 1

    LaunchedEffect(carId) {
        viewModel.loadCarDetail(carId)
        viewModel.loadReferenceData()
    }

    fun resolvedTripAddress(): String = address.trim().ifBlank { city.trim() }

    fun goBackWithinCheckout() {
        val previousStep = CheckoutStep.values().getOrNull(currentStep.ordinal - 1) ?: return
        paymentMessage = null
        currentStep = previousStep
    }

    val regionOptions = remember(locations, region) {
        buildList {
            add(region)
            locations.keys.filter { it.isNotBlank() }.sorted().forEach(::add)
        }.distinct()
    }
    val cityOptions = remember(locations, region, city) {
        buildList {
            add(city)
            locations[region].orEmpty()
                .filter { it.isNotBlank() }
                .sorted()
                .forEach(::add)
        }.distinct()
    }

    LaunchedEffect(carState, bookingDraft) {
        val car = (carState as? UiState.Success<CarDto>)?.data ?: return@LaunchedEffect
        if (initialized) return@LaunchedEffect
        val draft = bookingDraft?.takeIf { it.carId == carId }
        startDate = parseApiDate(draft?.startDate) ?: LocalDate.now()
        val earliestEnd = startDate.plusDays(car.minimumTripDays.toLong())
        endDate = parseApiDate(draft?.endDate)?.takeIf { !it.isBefore(earliestEnd) } ?: earliestEnd
        region = draft?.region?.takeIf { it.isNotBlank() } ?: (car.region ?: region)
        city = draft?.city?.takeIf { it.isNotBlank() } ?: (car.city ?: city)
        address = draft?.address.orEmpty()
        tripMode = draft?.tripMode?.let(::parseCheckoutTripMode)
            ?: if (car.delivery_available == true) null else CheckoutTripMode.PICKUP
        deliveryAddress = draft?.deliveryAddress.orEmpty()
        deliveryTime = draft?.deliveryTime?.takeIf { it.isNotBlank() } ?: defaultDeliveryTimeString()
        contactPhone = draft?.contactPhone.orEmpty()
        deliveryNotes = draft?.deliveryNotes.orEmpty()
        if (draft != null) {
            // Reopen exactly where the saved checkout left off.
            currentStep = CheckoutStep.values().getOrNull(draft.step) ?: CheckoutStep.TRIP_DETAILS
        }
        initialized = true
    }

    // Keep the device-side draft current so closing the checkout never throws the renter's
    // work away. Only once they are past the dates step (or picked a trip mode) is it worth
    // keeping; a server-held checkout for this car already carries these choices.
    val savedCheckoutForDraft by viewModel.savedCheckout.collectAsState()
    LaunchedEffect(initialized, isAuthenticated, startDate, endDate, region, city, address, tripMode, deliveryAddress, deliveryTime, contactPhone, deliveryNotes, currentStep, carState) {
        if (!initialized || !isAuthenticated) return@LaunchedEffect
        val progressed = currentStep != CheckoutStep.TRIP_DETAILS || tripMode != null
        if (!progressed) return@LaunchedEffect
        if (savedCheckoutForDraft?.carId == carId) return@LaunchedEffect
        val car = (carState as? UiState.Success<CarDto>)?.data
        viewModel.setBookingDraft(
            carId = carId,
            startDate = startDate.toApiDate(),
            endDate = endDate.toApiDate(),
            region = region.trim(),
            city = city.trim(),
            address = address.trim(),
            tripMode = tripMode?.rawValue,
            deliveryAddress = deliveryAddress.trim(),
            deliveryTime = deliveryTime.trim(),
            contactPhone = contactPhone.trim(),
            deliveryNotes = deliveryNotes.trim(),
            carTitle = car?.title?.trim().orEmpty(),
            carImageUrl = car?.image_url ?: car?.car_photos.orEmpty().firstNotNullOfOrNull { it.url },
            dailyPrice = (car?.daily_price ?: 0.0).roundToInt(),
            step = currentStep.ordinal,
        )
    }

    LaunchedEffect(startDate, blockedBookingDates, minimumNights) {
        if (blockedBookingDates.isNotEmpty() && !isBookableStartDate(startDate, blockedBookingDates, minimumNights)) {
            nextBookableStartDate(
                from = if (startDate.isBefore(LocalDate.now())) LocalDate.now() else startDate,
                duration = minimumNights,
                blockedDates = blockedBookingDates,
            )?.let { adjustedStart ->
                if (adjustedStart != startDate) {
                    startDate = adjustedStart
                    return@LaunchedEffect
                }
            }
        }

        preferredBookingEndDate(
            currentEnd = endDate,
            startDate = startDate,
            blockedDates = blockedBookingDates,
            minimumNights = minimumNights,
        )?.let { adjustedEnd ->
            if (adjustedEnd != endDate) {
                endDate = adjustedEnd
            }
        }
        selectedQuickDuration?.let { duration ->
            if (endDate != startDate.plusDays(duration.toLong())) {
                selectedQuickDuration = null
            }
        }
    }

    LaunchedEffect(cityOptions, region) {
        if (cityOptions.none { it.equals(city, ignoreCase = true) }) {
            city = cityOptions.firstOrNull() ?: city
        }
    }

    LaunchedEffect(tripMode, me?.preferredPhone()) {
        if (tripMode == CheckoutTripMode.DELIVERY && contactPhone.isBlank()) {
            contactPhone = me.preferredPhone().orEmpty()
        }
    }

    LaunchedEffect(carId) {
        val today = LocalDate.now()
        isLoadingBookingAvailability = true
        viewModel.loadAvailabilitySnapshot(
            carId = carId,
            startDate = today.toApiDate(),
            endDate = today.plusDays(180).toApiDate(),
        ) { envelope, error ->
            isLoadingBookingAvailability = false
            if (error != null) {
                paymentMessage = error
                return@loadAvailabilitySnapshot
            }

            val blocked = envelope?.blockedDates.orEmpty().mapNotNull(::parseApiDate).toSet()
            blockedBookingDates = blocked
            selectedQuickDuration = null
            val nextStart = nextBookableStartDate(
                from = today,
                duration = minimumNights,
                blockedDates = blocked,
            )

            if (nextStart == null) {
                paymentMessage = "No upcoming available dates in the next 6 months."
                return@loadAvailabilitySnapshot
            }

            startDate = if (isBookableStartDate(startDate, blocked, minimumNights)) startDate else nextStart
            preferredBookingEndDate(
                currentEnd = endDate,
                startDate = startDate,
                blockedDates = blocked,
                minimumNights = minimumNights,
            )?.let { endDate = it }
        }
    }

    DisposableEffect(lifecycleOwner, awaitingPaymentReturn, pendingCheckout, isProcessingPayment, pendingPaystackCallbackUri) {
        val observer = LifecycleEventObserver { _, event ->
            if (
                event == Lifecycle.Event.ON_RESUME &&
                awaitingPaymentReturn &&
                pendingCheckout != null &&
                !isProcessingPayment &&
                pendingPaystackCallbackUri.isNullOrBlank()
            ) {
                awaitingPaymentReturn = false
                returnedFromPaymentWithoutCallback = true
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    when (val state = carState) {
        UiState.Loading -> BookingFlowFrame(step = currentStep, onBack = onBack) {
            LoadingBlock("Loading checkout...")
        }

        is UiState.Error -> BookingFlowFrame(step = currentStep, onBack = onBack) {
            ErrorBlock(state.message, onRetry = { viewModel.loadCarDetail(carId) })
        }

        is UiState.Success -> {
            val car = state.data
            val carTitle = car.title?.takeIf { it.isNotBlank() } ?: "Hayame listing"
            val pricePerDay = (car.daily_price ?: 0.0).roundToInt()
            val insuranceFee = (car.insurance_fee ?: 0.0).roundToInt().coerceAtLeast(0)
            val deliveryAvailable = car.delivery_available == true
            val baseDeliveryFee = if (deliveryAvailable) {
                (car.delivery_fee ?: 0.0).roundToInt().coerceAtLeast(0)
            } else {
                0
            }
            val selectedTripMode = tripMode ?: CheckoutTripMode.PICKUP
            val deliveryFee = if (selectedTripMode == CheckoutTripMode.DELIVERY) baseDeliveryFee else 0
            val depositAmount = (car.deposit_amount ?: 0.0).roundToInt().coerceAtLeast(0)
            val outsideListingRegion = !region.equals(car.region.orEmpty(), ignoreCase = true)
            val outsideRegionFee = (car.outside_accra_fee ?: 0.0).roundToInt().coerceAtLeast(0)
            val outsideSurcharge = if (outsideListingRegion) outsideRegionFee else 0
            val nights = max(1, ChronoUnit.DAYS.between(startDate, endDate).toInt())
            val subtotal = pricePerDay * nights
            // Service fee at the platform fee the admin set (sent with every car list).
            // The server is authoritative; this keeps the displayed total honest.
            val platformFee = (subtotal * platformFeePercent / 100).roundToInt()
            val totalAmount = subtotal + platformFee + insuranceFee + deliveryFee + outsideSurcharge + depositAmount
            val locationHelperText = if (outsideListingRegion) {
                if (outsideRegionFee > 0) "Outside listing region (+GHS $outsideRegionFee)" else "Outside listing region"
            } else {
                "Within listing region (no extra charges)"
            }
            val summaryImageUrl = remember(car.id, car.image_url, car.car_photos) {
                resolveAppImage(car.image_url) ?: car.car_photos.orEmpty().firstNotNullOfOrNull { resolveAppImage(it.url) }
            }

            fun applyQuickTripDuration(days: Int) {
                val adjustedStart = nextBookableStartDate(
                    from = startDate,
                    duration = days,
                    blockedDates = blockedBookingDates,
                )
                if (adjustedStart == null) {
                    selectedQuickDuration = null
                    paymentMessage = "No $days-day slot is available in the next 6 months."
                } else {
                    startDate = adjustedStart
                    endDate = adjustedStart.plusDays(days.toLong())
                    selectedQuickDuration = days
                    paymentMessage = null
                }
            }

            fun finalizePendingPayment(referenceOverride: String? = null) {
                val checkout = pendingCheckout ?: return
                val resolvedReference = referenceOverride
                    ?.trim()
                    ?.takeIf { it.isNotBlank() }
                if (resolvedReference.isNullOrBlank()) {
                    paymentMessage = "Payment was not completed. Open secure checkout and finish payment before verifying."
                    return
                }
                returnedFromPaymentWithoutCallback = false
                awaitingPaymentReturn = false
                isProcessingPayment = true
                paymentMessage = null
                viewModel.finalizePaystack(
                    request = PaystackFinalizeRequest(
                        bookingId = checkout.bookingId,
                        carId = carId,
                        startDate = startDate.toApiDate(),
                        endDate = endDate.toApiDate(),
                        tripUseRegion = region.trim(),
                        tripUseCity = city.trim(),
                        tripUseAddress = resolvedTripAddress(),
                        reference = resolvedReference,
                        amount = (checkout.amount ?: 0.0).roundToInt(),
                    ),
                    onSuccess = {
                        isProcessingPayment = false
                        returnedFromPaymentWithoutCallback = false
                        bookingSucceeded = true
                    },
                    onError = {
                        isProcessingPayment = false
                        returnedFromPaymentWithoutCallback = false
                        paymentMessage = "$it Your selections are saved — finish anytime from Home or Trips."
                        errorPulse += 1
                        viewModel.refreshSavedCheckout(force = true)
                    },
                )
            }

            // Renters pass an identity check before paying. Their selections are kept as the
            // saved-checkout draft, so the booking can be finished once they are approved.
            fun openVerificationInsteadOfPaying() {
                viewModel.setBookingDraft(
                    carId = carId,
                    startDate = startDate.toApiDate(),
                    endDate = endDate.toApiDate(),
                    region = region.trim(),
                    city = city.trim(),
                    address = address.trim(),
                    tripMode = tripMode?.rawValue,
                    deliveryAddress = deliveryAddress.trim(),
                    deliveryTime = deliveryTime.trim(),
                    contactPhone = contactPhone.trim(),
                    deliveryNotes = deliveryNotes.trim(),
                    carTitle = car.title?.trim().orEmpty(),
                    carImageUrl = car.image_url ?: car.car_photos.orEmpty().firstNotNullOfOrNull { it.url },
                    dailyPrice = pricePerDay,
                    step = currentStep.ordinal,
                )
                isProcessingPayment = false
                awaitingPaymentReturn = false
                paymentMessage = null
                onVerificationRequired()
            }

            fun beginPayment() {
                val normalizedRegion = region.trim()
                val normalizedCity = city.trim()
                val normalizedAddress = resolvedTripAddress()
                val normalizedDeliveryAddress = deliveryAddress.trim()
                val normalizedDeliveryTime = deliveryTime.trim()
                val normalizedContactPhone = contactPhone.trim()
                val normalizedDeliveryNotes = deliveryNotes.trim()

                if (!isAuthenticated) {
                    viewModel.setBookingDraft(
                        carId = carId,
                        startDate = startDate.toApiDate(),
                        endDate = endDate.toApiDate(),
                        region = normalizedRegion,
                        city = normalizedCity,
                        address = address.trim(),
                        tripMode = tripMode?.rawValue,
                        deliveryAddress = normalizedDeliveryAddress,
                        deliveryTime = normalizedDeliveryTime,
                        contactPhone = normalizedContactPhone,
                        deliveryNotes = normalizedDeliveryNotes,
                    )
                    viewModel.requireAuthentication(
                        message = "Sign in or sign up to continue booking.",
                        destination = NavRoutes.booking(carId),
                    )
                    return
                }
                if (!endDate.isAfter(startDate)) {
                    paymentMessage = "End date must be after start date."
                    return
                }
                if (normalizedRegion.isBlank()) {
                    paymentMessage = "Select your trip region to continue."
                    return
                }
                if (normalizedCity.isBlank()) {
                    paymentMessage = "Select your trip city to continue."
                    return
                }
                if (deliveryAvailable && tripMode == null) {
                    paymentMessage = "Choose pickup or delivery to continue."
                    return
                }
                if (selectedTripMode == CheckoutTripMode.DELIVERY) {
                    if (normalizedDeliveryAddress.length < 6) {
                        paymentMessage = "Enter the exact delivery address."
                        return
                    }
                    if (!isValidDeliveryTime(normalizedDeliveryTime)) {
                        paymentMessage = "Enter a valid delivery time in HH:mm format."
                        return
                    }
                    if (normalizedContactPhone.phoneDigitsCount() !in 7..15) {
                        paymentMessage = "Enter a valid contact phone number."
                        return
                    }
                }

                if (renterVerification.blocksBooking) {
                    openVerificationInsteadOfPaying()
                    return
                }

                isProcessingPayment = true
                paymentMessage = null
                viewModel.setBookingDraft(
                    carId = carId,
                    startDate = startDate.toApiDate(),
                    endDate = endDate.toApiDate(),
                    region = normalizedRegion,
                    city = normalizedCity,
                    address = address.trim(),
                    tripMode = tripMode?.rawValue,
                    deliveryAddress = normalizedDeliveryAddress,
                    deliveryTime = normalizedDeliveryTime,
                    contactPhone = normalizedContactPhone,
                    deliveryNotes = normalizedDeliveryNotes,
                    carTitle = car.title?.trim().orEmpty(),
                    carImageUrl = car.image_url ?: car.car_photos.orEmpty().firstNotNullOfOrNull { it.url },
                    dailyPrice = pricePerDay,
                    step = CheckoutStep.PAYMENT.ordinal,
                )
                viewModel.createBookingHoldAndInitiatePayment(
                    carId = carId,
                    startDate = startDate.toApiDate(),
                    endDate = endDate.toApiDate(),
                    tripMode = tripMode?.rawValue,
                    tripUseRegion = normalizedRegion,
                    tripUseCity = normalizedCity,
                    tripUseAddress = normalizedAddress,
                    deliveryAddress = normalizedDeliveryAddress.takeIf { selectedTripMode == CheckoutTripMode.DELIVERY },
                    deliveryTime = normalizedDeliveryTime.takeIf { selectedTripMode == CheckoutTripMode.DELIVERY },
                    contactPhone = normalizedContactPhone.takeIf { selectedTripMode == CheckoutTripMode.DELIVERY },
                    deliveryNotes = normalizedDeliveryNotes.takeIf { selectedTripMode == CheckoutTripMode.DELIVERY },
                    callbackUrl = "hayame://payment-callback",
                    onReady = {
                        isProcessingPayment = false
                        awaitingPaymentReturn = true
                        openExternalUrl(context, it.payment_url ?: it.authorization_url)
                    },
                    onError = {
                        isProcessingPayment = false
                        awaitingPaymentReturn = false
                        paymentMessage = "$it Your selections are saved — finish anytime from Home or Trips."
                        errorPulse += 1
                        viewModel.refreshSavedCheckout(force = true)
                    },
                    // The server asked for the identity check after all (403 verification_required).
                    onVerificationRequired = { openVerificationInsteadOfPaying() },
                )
            }

            LaunchedEffect(pendingPaystackCallbackUri, pendingCheckout?.reference) {
                if (!pendingPaystackCallbackUri.isNullOrBlank() && pendingCheckout != null && !isProcessingPayment) {
                    val callbackResult = parsePaystackCallback(pendingPaystackCallbackUri)
                    awaitingPaymentReturn = false
                    onPaystackCallbackConsumed()
                    if (callbackResult.isCancelled || callbackResult.reference.isNullOrBlank()) {
                        paymentMessage = "Payment was cancelled or not completed. Your selections are saved — finish anytime from Home or Trips."
                        viewModel.refreshSavedCheckout(force = true)
                    } else {
                        finalizePendingPayment(callbackResult.reference)
                    }
                }
            }

            LaunchedEffect(returnedFromPaymentWithoutCallback, pendingCheckout?.reference, isProcessingPayment) {
                val checkout = pendingCheckout
                if (returnedFromPaymentWithoutCallback && checkout != null && !isProcessingPayment) {
                    paymentMessage = "Checking payment status..."
                    finalizePendingPayment(checkout.reference)
                }
            }

            // ---- Redesigned flow -------------------------------------------------------------
            val colors = LocalHayameColors.current
            val haptics = LocalHapticFeedback.current
            val shake = remember { Animatable(0f) }
            val hostName = car.host_name?.takeIf { it.isNotBlank() } ?: car.owner?.full_name?.takeIf { it.isNotBlank() } ?: "the host"
            val listingPlace = listOfNotNull(car.city?.takeIf { it.isNotBlank() }, car.region?.takeIf { it.isNotBlank() })
                .joinToString(", ")
                .ifBlank { "Ghana" }
            val tripTimeLabel = if (selectedTripMode == CheckoutTripMode.DELIVERY && isValidDeliveryTime(deliveryTime)) {
                bookingTimeLabel(deliveryTime)
            } else {
                "10:00 AM"
            }
            val rangeIsFree = isBookableStartDate(startDate, blockedBookingDates) &&
                isBookableEndDate(endDate, startDate, blockedBookingDates)

            LaunchedEffect(errorPulse) {
                if (errorPulse == 0) return@LaunchedEffect
                haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                shake.snapTo(0f)
                shake.animateTo(
                    targetValue = 0f,
                    animationSpec = keyframes {
                        durationMillis = 380
                        -16f at 45
                        14f at 105
                        -10f at 165
                        7f at 225
                        -4f at 290
                        0f at 380
                    },
                )
            }

            fun fail(message: String) {
                paymentMessage = message
                errorPulse += 1
            }

            fun goTo(step: CheckoutStep) {
                paymentMessage = null
                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                currentStep = step
            }

            fun finishAfterSuccess() {
                viewModel.showMessage("Payment successful. Your booking is now in Trips.")
                onBookingCompleted()
            }

            fun handlePrimaryAction() {
                when (currentStep) {
                    CheckoutStep.TRIP_DETAILS -> {
                        if (!endDate.isAfter(startDate)) {
                            fail("Choose an end date after your start date.")
                        } else {
                            goTo(CheckoutStep.LOCATION)
                        }
                    }

                    CheckoutStep.LOCATION -> {
                        if (deliveryAvailable && tripMode == null) {
                            fail("Choose pickup or delivery to continue.")
                        } else if (region.trim().isBlank()) {
                            fail("Select your trip region to continue.")
                        } else if (city.trim().isBlank()) {
                            fail("Select your trip city to continue.")
                        } else if (selectedTripMode == CheckoutTripMode.DELIVERY && deliveryAddress.trim().length < 6) {
                            fail("Enter the exact delivery address.")
                        } else if (selectedTripMode == CheckoutTripMode.DELIVERY && !isValidDeliveryTime(deliveryTime.trim())) {
                            fail("Enter a valid delivery time in HH:mm format.")
                        } else if (selectedTripMode == CheckoutTripMode.DELIVERY && contactPhone.trim().phoneDigitsCount() !in 7..15) {
                            fail("Enter a valid contact phone number.")
                        } else {
                            goTo(CheckoutStep.REVIEW)
                        }
                    }

                    CheckoutStep.REVIEW -> {
                        if (isAuthenticated && renterVerification.blocksBooking) {
                            openVerificationInsteadOfPaying()
                        } else {
                            goTo(CheckoutStep.PAYMENT)
                        }
                    }

                    CheckoutStep.PAYMENT -> beginPayment()
                }
            }

            BackHandler(enabled = bookingSucceeded) { finishAfterSuccess() }
            BackHandler(enabled = !bookingSucceeded && currentStep != CheckoutStep.TRIP_DETAILS) { goBackWithinCheckout() }

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(colors.pageBackground),
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .statusBarsPadding()
                        .imePadding(),
                ) {
                    BookingFlowHeader(
                        step = currentStep,
                        onBack = {
                            if (currentStep == CheckoutStep.TRIP_DETAILS) onBack() else goBackWithinCheckout()
                        },
                    )
                    BookingCarStrip(
                        imageUrl = summaryImageUrl,
                        title = carTitle,
                        pricePerDay = pricePerDay,
                        place = car.city?.takeIf { it.isNotBlank() } ?: listingPlace,
                    )

                    AnimatedContent(
                        targetState = currentStep,
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth(),
                        transitionSpec = {
                            val forward = targetState.ordinal > initialState.ordinal
                            val enterSpring = spring<IntOffset>(dampingRatio = 0.86f, stiffness = Spring.StiffnessMediumLow)
                            (
                                slideInHorizontally(enterSpring) { width -> if (forward) width / 2 else -width / 2 } +
                                    fadeIn(tween(260, delayMillis = 40))
                                ).togetherWith(
                                slideOutHorizontally(tween(220)) { width -> if (forward) -width / 4 else width / 4 } +
                                    fadeOut(tween(160)),
                            ).using(SizeTransform(clip = false))
                        },
                        label = "booking-step",
                    ) { step ->
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .verticalScroll(rememberScrollState())
                                .padding(horizontal = 16.dp)
                                .padding(top = 10.dp, bottom = 28.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp),
                        ) {
                            StaggeredAppear(index = 0) { BookingStepHeading(step) }

                            when (step) {
                                CheckoutStep.TRIP_DETAILS -> {
                                    StaggeredAppear(index = 1, modifier = Modifier.coachTarget("booking.dates")) {
                                        BookingDateRangeCard(
                                            startDate = startDate,
                                            endDate = endDate,
                                            nights = nights,
                                            timeLabel = tripTimeLabel,
                                            activeTarget = activeDateTarget,
                                            onPickStart = { activeDateTarget = "start" },
                                            onPickEnd = { activeDateTarget = "end" },
                                        )
                                    }
                                    StaggeredAppear(index = 2) {
                                        BookingAvailabilityRow(
                                            isLoading = isLoadingBookingAvailability,
                                            isFree = rangeIsFree,
                                        )
                                    }
                                    StaggeredAppear(index = 3) {
                                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                            BookingLabel("Quick picks")
                                            Row(
                                                modifier = Modifier.horizontalScroll(rememberScrollState()),
                                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                            ) {
                                                val quickPicks = listOf(2 to "2 days", 3 to "3 days", 5 to "5 days", 7 to "1 week")
                                                (if (car.allow_one_day_booking == true) listOf(1 to "1 day") + quickPicks else quickPicks).forEach { (days, label) ->
                                                    BookingChoiceChip(
                                                        label = label,
                                                        selected = selectedQuickDuration == days,
                                                    ) {
                                                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                                        applyQuickTripDuration(days)
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    StaggeredAppear(index = 4) {
                                        BookingPricePreview(
                                            pricePerDay = pricePerDay,
                                            nights = nights,
                                            subtotal = subtotal,
                                        )
                                    }
                                }

                                CheckoutStep.LOCATION -> {
                                    StaggeredAppear(index = 1) {
                                        if (deliveryAvailable) {
                                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                                Row(
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .height(IntrinsicSize.Max),
                                                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                                                ) {
                                                    BookingModeTile(
                                                        title = CheckoutTripMode.PICKUP.label,
                                                        icon = Icons.Outlined.Place,
                                                        line = "Meet the host at the car",
                                                        price = "Free",
                                                        selected = tripMode == CheckoutTripMode.PICKUP,
                                                        modifier = Modifier
                                                            .weight(1f)
                                                            .fillMaxHeight(),
                                                    ) {
                                                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                                        tripMode = CheckoutTripMode.PICKUP
                                                        paymentMessage = null
                                                    }
                                                    BookingModeTile(
                                                        title = CheckoutTripMode.DELIVERY.label,
                                                        icon = Icons.Outlined.LocalShipping,
                                                        line = "Brought to your door",
                                                        price = if (baseDeliveryFee > 0) ghs(baseDeliveryFee) else "Free",
                                                        selected = tripMode == CheckoutTripMode.DELIVERY,
                                                        modifier = Modifier
                                                            .weight(1f)
                                                            .fillMaxHeight(),
                                                    ) {
                                                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                                        tripMode = CheckoutTripMode.DELIVERY
                                                        if (contactPhone.isBlank()) {
                                                            contactPhone = me.preferredPhone().orEmpty()
                                                        }
                                                        paymentMessage = null
                                                    }
                                                }
                                                androidx.compose.animation.AnimatedVisibility(
                                                    visible = tripMode == null,
                                                    enter = fadeIn() + expandVertically(),
                                                    exit = fadeOut() + shrinkVertically(),
                                                ) {
                                                    Text(
                                                        text = "Choose one to continue.",
                                                        style = MaterialTheme.typography.bodyMedium,
                                                        fontWeight = FontWeight.SemiBold,
                                                        color = colors.warning,
                                                    )
                                                }
                                            }
                                        } else {
                                            BookingModeTile(
                                                title = CheckoutTripMode.PICKUP.label,
                                                icon = Icons.Outlined.Place,
                                                line = "This listing is pickup only",
                                                price = "Free",
                                                selected = true,
                                                modifier = Modifier.fillMaxWidth(),
                                            ) {}
                                        }
                                    }

                                    androidx.compose.animation.AnimatedVisibility(
                                        visible = tripMode == CheckoutTripMode.DELIVERY,
                                        enter = expandVertically(spring(dampingRatio = 0.9f, stiffness = Spring.StiffnessMediumLow)) + fadeIn(tween(220, delayMillis = 60)),
                                        exit = shrinkVertically(tween(220)) + fadeOut(tween(140)),
                                    ) {
                                        BookingSectionCard(title = "Delivery details", icon = Icons.Outlined.LocalShipping) {
                                            BookingTextField(
                                                label = "Delivery address",
                                                value = deliveryAddress,
                                                onValueChange = { deliveryAddress = it },
                                                placeholder = "House number, street, landmark",
                                            )
                                            BookingLabel("Delivery time")
                                            BookingDeliveryTimeChips(
                                                value = deliveryTime,
                                                onChange = { deliveryTime = it },
                                            )
                                            BookingTextField(
                                                label = "Contact phone",
                                                value = contactPhone,
                                                onValueChange = { contactPhone = it },
                                                placeholder = "+233 24 123 4567",
                                                keyboardType = KeyboardType.Phone,
                                            )
                                            BookingTextField(
                                                label = "Notes for the host (optional)",
                                                value = deliveryNotes,
                                                onValueChange = { deliveryNotes = it.take(500) },
                                                placeholder = "Gate code, landmark, or handoff notes",
                                                minLines = 3,
                                            )
                                            Text(
                                                text = if (deliveryFee > 0) "Delivery fee: ${ghs(deliveryFee)}" else "This listing offers free delivery.",
                                                style = MaterialTheme.typography.bodyMedium,
                                                fontWeight = FontWeight.SemiBold,
                                                color = colors.brandBlue,
                                            )
                                        }
                                    }

                                    androidx.compose.animation.AnimatedVisibility(
                                        visible = tripMode == CheckoutTripMode.PICKUP,
                                        enter = expandVertically() + fadeIn(),
                                        exit = shrinkVertically() + fadeOut(),
                                    ) {
                                        BookingInfoRow(
                                            icon = Icons.Outlined.Place,
                                            title = "Pick up in $listingPlace",
                                            subtitle = "The host shares the exact spot once they confirm.",
                                            boxed = true,
                                        )
                                    }

                                    StaggeredAppear(index = 2) {
                                        BookingSectionCard(title = "Where will you drive?", icon = Icons.Outlined.Explore) {
                                            SelectionField(
                                                selected = region,
                                                placeholder = "Region",
                                                options = regionOptions,
                                                onSelected = { region = it },
                                            )
                                            SelectionField(
                                                selected = city,
                                                placeholder = "City",
                                                options = cityOptions,
                                                onSelected = { city = it },
                                            )
                                            BookingTextField(
                                                label = "Destination (optional)",
                                                value = address,
                                                onValueChange = { address = it },
                                                placeholder = "Area, landmark, or route",
                                            )
                                            BookingRegionChip(
                                                outside = outsideListingRegion,
                                                fee = outsideRegionFee,
                                            )
                                        }
                                    }
                                }

                                CheckoutStep.REVIEW -> {
                                    StaggeredAppear(index = 1) {
                                        BookingCarHero(
                                            imageUrl = summaryImageUrl,
                                            title = carTitle,
                                            hostName = hostName,
                                            rating = car.avg_rating ?: 0.0,
                                            reviews = (car.reviews_count ?: 0.0).roundToInt().coerceAtLeast(0),
                                        )
                                    }
                                    StaggeredAppear(index = 2) {
                                        BookingSectionCard(
                                            title = "Your trip",
                                            icon = Icons.Outlined.CalendarMonth,
                                            action = { BookingEditButton { goTo(CheckoutStep.TRIP_DETAILS) } },
                                        ) {
                                            BookingTimelineNode(
                                                icon = null,
                                                title = "Pick-up",
                                                value = "${startDate.bookingLabel("EEE, d MMM")} · $tripTimeLabel",
                                                detail = if (selectedTripMode == CheckoutTripMode.DELIVERY) {
                                                    deliveryAddress.trim().ifBlank { "Delivery address to confirm" }
                                                } else {
                                                    listingPlace
                                                },
                                                isLast = false,
                                                filled = true,
                                            )
                                            BookingTimelineNode(
                                                icon = null,
                                                title = "Return",
                                                value = "${endDate.bookingLabel("EEE, d MMM")} · $tripTimeLabel",
                                                detail = "$nights day${if (nights == 1) "" else "s"} in total",
                                                isLast = true,
                                                filled = false,
                                            )
                                        }
                                    }
                                    StaggeredAppear(index = 3) {
                                        BookingSectionCard(
                                            title = "Handoff",
                                            icon = if (selectedTripMode == CheckoutTripMode.DELIVERY) Icons.Outlined.LocalShipping else Icons.Outlined.Place,
                                            action = { BookingEditButton { goTo(CheckoutStep.LOCATION) } },
                                        ) {
                                            BookingDetailLine("Method", selectedTripMode.label)
                                            if (selectedTripMode == CheckoutTripMode.DELIVERY) {
                                                BookingDetailLine("Address", deliveryAddress.trim().ifBlank { "Not provided" })
                                                BookingDetailLine("Time", deliveryTime.trim().takeIf { isValidDeliveryTime(it) }?.let(::bookingTimeLabel) ?: "Not provided")
                                                BookingDetailLine("Contact", contactPhone.trim().ifBlank { "Not provided" })
                                                if (deliveryNotes.trim().isNotBlank()) {
                                                    BookingDetailLine("Notes", deliveryNotes.trim())
                                                }
                                            } else {
                                                BookingDetailLine("Pick-up area", listingPlace)
                                            }
                                            BookingDetailLine("Driving in", "${resolvedTripAddress()}, ${region.trim()}")
                                            if (outsideListingRegion) {
                                                BookingRegionChip(outside = true, fee = outsideRegionFee)
                                            }
                                        }
                                    }
                                    StaggeredAppear(index = 4) {
                                        val lines = buildList {
                                            add("${ghs(pricePerDay)} × $nights day${if (nights == 1) "" else "s"}" to subtotal)
                                            add("Service fee" to platformFee)
                                            add("Insurance" to insuranceFee)
                                            if (selectedTripMode == CheckoutTripMode.DELIVERY) add("Delivery" to deliveryFee)
                                            if (outsideListingRegion || outsideSurcharge > 0) add("Outside region fee" to outsideSurcharge)
                                        }
                                        BookingPriceBreakdown(lines = lines, deposit = depositAmount, total = totalAmount)
                                    }
                                    StaggeredAppear(index = 5) {
                                        BookingSectionCard(title = "Good to know", icon = Icons.Outlined.Info) {
                                            BookingInfoRow(
                                                icon = Icons.Outlined.VerifiedUser,
                                                title = "Host confirms before pickup",
                                                subtitle = "If $hostName declines, you're refunded in full.",
                                            )
                                            BookingInfoRow(
                                                icon = Icons.Outlined.EventBusy,
                                                title = "Cancellation: ${(car.cancellation_policy ?: "Moderate").replace('_', ' ').replaceFirstChar { it.uppercase() }}",
                                                subtitle = "Refunds follow the host's cancellation policy.",
                                            )
                                            if (depositAmount > 0) {
                                                BookingInfoRow(
                                                    icon = Icons.Outlined.Shield,
                                                    title = "Refundable deposit",
                                                    subtitle = "${ghs(depositAmount)} comes back after the car is returned safely.",
                                                )
                                            }
                                        }
                                    }
                                }

                                CheckoutStep.PAYMENT -> {
                                    StaggeredAppear(index = 1) {
                                        BookingPayHero(
                                            total = totalAmount,
                                            deposit = depositAmount,
                                            nights = nights,
                                        )
                                    }
                                    StaggeredAppear(index = 2) {
                                        BookingSectionCard(title = "Pay your way", icon = Icons.Outlined.CreditCard) {
                                            BookingInfoRow(
                                                icon = Icons.Outlined.PhoneIphone,
                                                title = "Mobile Money",
                                                subtitle = "MTN, Telecel and AirtelTigo",
                                            )
                                            BookingInfoRow(
                                                icon = Icons.Outlined.CreditCard,
                                                title = "Card",
                                                subtitle = "Visa and Mastercard",
                                            )
                                            BookingInfoRow(
                                                icon = Icons.Outlined.AccountBalance,
                                                title = "Bank transfer",
                                                subtitle = "Available in secure checkout",
                                            )
                                            Row(
                                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                                verticalAlignment = Alignment.CenterVertically,
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .clip(RoundedCornerShape(12.dp))
                                                    .background(colors.success.copy(alpha = 0.10f))
                                                    .padding(horizontal = 12.dp, vertical = 10.dp),
                                            ) {
                                                Icon(Icons.Outlined.Lock, contentDescription = null, tint = colors.success, modifier = Modifier.size(16.dp))
                                                Text(
                                                    text = "Secured by Paystack. We never see your card details.",
                                                    style = MaterialTheme.typography.bodyMedium,
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = colors.success,
                                                )
                                            }
                                        }
                                    }
                                    StaggeredAppear(index = 3) {
                                        BookingSectionCard(title = "What happens next", icon = Icons.Outlined.Schedule) {
                                            BookingTimelineNode(
                                                icon = Icons.Outlined.Lock,
                                                title = "Step 1",
                                                value = "Pay securely",
                                                detail = "Card, mobile money or bank transfer through Paystack.",
                                                isLast = false,
                                                filled = true,
                                            )
                                            BookingTimelineNode(
                                                icon = Icons.Outlined.VerifiedUser,
                                                title = "Step 2",
                                                value = "$hostName confirms",
                                                detail = "Usually within a few hours. Full refund if declined.",
                                                isLast = false,
                                                filled = false,
                                            )
                                            BookingTimelineNode(
                                                icon = Icons.Outlined.Key,
                                                title = "Step 3",
                                                value = "Pick up your car",
                                                detail = "${startDate.bookingLabel("EEEE, d MMM")} at $tripTimeLabel",
                                                isLast = true,
                                                filled = false,
                                            )
                                        }
                                    }
                                    pendingCheckout?.let { checkout ->
                                        StaggeredAppear(index = 4) {
                                            BookingSectionCard(title = "Payment pending", icon = Icons.Outlined.HourglassTop) {
                                                Text(
                                                    text = "Finish paying in the secure checkout. We detect it automatically when you come back.",
                                                    style = MaterialTheme.typography.bodyMedium,
                                                    color = colors.mutedText,
                                                )
                                                BookingDetailLine("Reference", checkout.reference)
                                                Button(
                                                    onClick = {
                                                        awaitingPaymentReturn = true
                                                        paymentMessage = null
                                                        openExternalUrl(context, checkout.payment_url ?: checkout.authorization_url)
                                                    },
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .height(50.dp),
                                                    shape = RoundedCornerShape(16.dp),
                                                    colors = ButtonDefaults.buttonColors(containerColor = colors.brandBlue, contentColor = Color.White),
                                                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp, pressedElevation = 0.dp),
                                                ) {
                                                    Text("Open secure checkout", fontWeight = FontWeight.Bold)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (currentStep == CheckoutStep.TRIP_DETAILS) {
                        CoachTour(
                            id = "booking",
                            steps = listOf(
                                CoachStep("booking.progress", "Four quick steps", "Go back anytime. Nothing is charged until the last step."),
                                CoachStep("booking.dates", "Tap a date to change it", "Days that are already booked are blocked."),
                                CoachStep("booking.total", "Always see the cost", "This updates as you choose. Fees and the deposit show before you pay."),
                            ),
                        )
                    }
                    val showsTotal = currentStep == CheckoutStep.REVIEW || currentStep == CheckoutStep.PAYMENT
                    BookingBottomBar(
                        amount = if (showsTotal) totalAmount else subtotal,
                        caption = if (showsTotal) "total incl. deposit" else "$nights day${if (nights == 1) "" else "s"} · before fees",
                        buttonText = when {
                            currentStep != CheckoutStep.PAYMENT -> "Continue"
                            isProcessingPayment -> "Processing"
                            else -> "Pay ${ghs(totalAmount)}"
                        },
                        isLoading = isProcessingPayment && currentStep == CheckoutStep.PAYMENT,
                        showArrow = currentStep != CheckoutStep.PAYMENT,
                        message = paymentMessage,
                        shakeOffset = shake.value,
                        onClick = ::handlePrimaryAction,
                    )
                }

                activeDateTarget?.let { target ->
                    val isStart = target == "start"
                    AvailabilityCalendarDialog(
                        title = if (isStart) "Choose pick-up date" else "Choose return date",
                        selectedDate = if (isStart) startDate else endDate,
                        minimumDate = if (isStart) LocalDate.now() else startDate.plusDays(minimumNights.toLong()),
                        blockedDates = blockedBookingDates,
                        selectionRange = startDate..endDate,
                        canSelectDate = { candidate ->
                            if (isStart) {
                                isBookableStartDate(candidate, blockedBookingDates, minimumNights)
                            } else {
                                isBookableEndDate(candidate, startDate, blockedBookingDates, minimumNights)
                            }
                        },
                        onDismiss = { activeDateTarget = null },
                        onDateSelected = { picked ->
                            selectedQuickDuration = null
                            if (isStart) startDate = picked else endDate = picked
                            paymentMessage = null
                            activeDateTarget = null
                        },
                    )
                }

                if (isProcessingPayment) {
                    PaymentProcessingOverlay()
                }

                androidx.compose.animation.AnimatedVisibility(
                    visible = bookingSucceeded,
                    enter = fadeIn(tween(320)) + scaleIn(initialScale = 1.04f, animationSpec = tween(360)),
                    exit = fadeOut(tween(200)),
                ) {
                    BookingSuccessStage(
                        imageUrl = summaryImageUrl,
                        carTitle = carTitle,
                        hostName = hostName,
                        dateLine = "${startDate.bookingLabel("EEE, d MMM")} – ${endDate.bookingLabel("EEE, d MMM")}",
                        place = listingPlace,
                        onDone = ::finishAfterSuccess,
                    )
                }
            }
        }

        else -> BookingFlowFrame(step = currentStep, onBack = onBack) {
            LoadingBlock("Loading checkout...")
        }
    }
}

// MARK: Steps and trip mode ---------------------------------------------------------------------

/** The four checkout steps. Ordinals are persisted in the checkout draft (0 = dates ... 3 = pay). */
private enum class CheckoutStep(
    val title: String,
    val heading: String,
    val subtitle: String,
) {
    TRIP_DETAILS(
        title = "Dates",
        heading = "When do you need it?",
        subtitle = "Pick your dates. Booked days are blocked for you.",
    ),
    LOCATION(
        title = "Handoff",
        heading = "How do you want the car?",
        subtitle = "Choose pickup or delivery, then where you'll drive.",
    ),
    REVIEW(
        title = "Review",
        heading = "Check your trip",
        subtitle = "Everything you're booking, and every charge, before you pay.",
    ),
    PAYMENT(
        title = "Pay",
        heading = "Confirm and pay",
        subtitle = "Pay securely. The host confirms before pickup.",
    ),
}

private enum class CheckoutTripMode(
    val rawValue: String,
    val label: String,
) {
    PICKUP(rawValue = "pickup", label = "Pickup"),
    DELIVERY(rawValue = "delivery", label = "Delivery"),
}

private fun parseCheckoutTripMode(value: String?): CheckoutTripMode? {
    return CheckoutTripMode.entries.firstOrNull { it.rawValue.equals(value?.trim(), ignoreCase = true) }
}

private fun defaultDeliveryTimeString(): String = "10:00"

private fun isValidDeliveryTime(value: String): Boolean {
    return Regex("""^\d{2}:\d{2}$""").matches(value.trim())
}

private fun String.phoneDigitsCount(): Int = count { it.isDigit() }

private fun LocalDate.toApiDate(): String = format(DateTimeFormatter.ISO_LOCAL_DATE)

private fun LocalDate.bookingLabel(pattern: String): String = format(DateTimeFormatter.ofPattern(pattern, Locale.US))

private fun ghs(amount: Int): String = "GHS " + String.format(Locale.US, "%,d", amount)

/** "10:00" -> "10:00 AM". Falls back to 10:00 AM for anything unparseable. */
private fun bookingTimeLabel(hhmm: String): String =
    runCatching { LocalTime.parse(hhmm.trim()).format(DateTimeFormatter.ofPattern("h:mm a", Locale.US)) }
        .getOrDefault("10:00 AM")

/** Swallows taps so nothing underneath an overlay can be pressed. */
@Composable
private fun Modifier.blockTouches(): Modifier = this.clickable(
    interactionSource = remember { MutableInteractionSource() },
    indication = null,
    onClick = {},
)

// MARK: Frame -----------------------------------------------------------------------------------

@Composable
private fun BookingFlowFrame(
    step: CheckoutStep,
    onBack: () -> Unit,
    content: @Composable () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LocalHayameColors.current.pageBackground)
            .statusBarsPadding(),
    ) {
        BookingFlowHeader(step = step, onBack = onBack)
        Box(modifier = Modifier.weight(1f)) { content() }
    }
}

/** Close/back button, crossfading step title, "2 of 4" counter and the segmented progress bar. */
@Composable
private fun BookingFlowHeader(step: CheckoutStep, onBack: () -> Unit) {
    val colors = LocalHayameColors.current
    val isFirst = step == CheckoutStep.TRIP_DETAILS
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .padding(top = 8.dp, bottom = 12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(44.dp),
        ) {
            Surface(
                onClick = onBack,
                shape = CircleShape,
                color = colors.fieldBackground,
                modifier = Modifier
                    .size(40.dp)
                    .align(Alignment.CenterStart),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Crossfade(targetState = isFirst, label = "booking-back-icon") { first ->
                        Icon(
                            imageVector = if (first) Icons.Outlined.Close else Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = if (first) "Close checkout" else "Back",
                            tint = colors.brandNavy,
                            modifier = Modifier.size(20.dp),
                        )
                    }
                }
            }

            AnimatedContent(
                targetState = step.title,
                modifier = Modifier.align(Alignment.Center),
                transitionSpec = {
                    (fadeIn(tween(240)) + slideInVertically(tween(260)) { it / 3 })
                        .togetherWith(fadeOut(tween(140)))
                },
                label = "booking-title",
            ) { title ->
                Text(
                    text = title,
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.brandNavy,
                )
            }

            Surface(
                shape = CircleShape,
                color = colors.brandBlue.copy(alpha = 0.12f),
                modifier = Modifier.align(Alignment.CenterEnd),
            ) {
                AnimatedContent(
                    targetState = step.ordinal + 1,
                    transitionSpec = {
                        val up = targetState > initialState
                        (slideInVertically { if (up) it else -it } + fadeIn())
                            .togetherWith(slideOutVertically { if (up) -it else it } + fadeOut())
                    },
                    label = "booking-step-count",
                ) { number ->
                    Text(
                        text = "$number of ${CheckoutStep.entries.size}",
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        color = colors.brandBlue,
                    )
                }
            }
        }

        Box(modifier = Modifier.coachTarget("booking.progress")) {
            BookingProgressBar(step = step)
        }
    }
}

/** Four capsules; the one you arrive at fills from empty with a spring. */
@Composable
private fun BookingProgressBar(step: CheckoutStep) {
    val colors = LocalHayameColors.current
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        CheckoutStep.entries.forEach { segment ->
            val target = if (segment.ordinal <= step.ordinal) 1f else 0f
            val fill = remember { Animatable(if (segment.ordinal < step.ordinal) 1f else 0f) }
            LaunchedEffect(target) {
                fill.animateTo(target, spring(dampingRatio = 0.85f, stiffness = Spring.StiffnessLow))
            }
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(4.dp)
                    .clip(CircleShape)
                    .background(colors.fieldBackground),
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(fill.value)
                        .clip(CircleShape)
                        .background(colors.brandBlue),
                )
            }
        }
    }
}

@Composable
private fun BookingCarStrip(imageUrl: String?, title: String, pricePerDay: Int, place: String) {
    val colors = LocalHayameColors.current
    Row(
        modifier = Modifier
            .padding(horizontal = 16.dp)
            .padding(bottom = 6.dp)
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(colors.fieldBackground)
            .padding(8.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BookingCarPhoto(
            imageUrl = imageUrl,
            modifier = Modifier.size(width = 56.dp, height = 44.dp),
            corner = 12.dp,
        )
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(1.dp)) {
            Text(
                text = title,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = colors.brandNavy,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = "${ghs(pricePerDay)}/day · $place",
                style = MaterialTheme.typography.bodyMedium,
                color = colors.mutedText,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun BookingCarPhoto(imageUrl: String?, modifier: Modifier, corner: Dp) {
    val colors = LocalHayameColors.current
    if (imageUrl.isNullOrBlank()) {
        Box(
            modifier = modifier
                .clip(RoundedCornerShape(corner))
                .background(colors.brandLight),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Outlined.DirectionsCar, contentDescription = null, tint = colors.brandBlue)
        }
    } else {
        AsyncImage(
            model = imageUrl,
            contentDescription = null,
            modifier = modifier.clip(RoundedCornerShape(corner)),
            contentScale = ContentScale.Crop,
        )
    }
}

@Composable
private fun BookingStepHeading(step: CheckoutStep) {
    val colors = LocalHayameColors.current
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(
            text = step.heading,
            fontSize = 26.sp,
            lineHeight = 32.sp,
            fontWeight = FontWeight.Bold,
            color = colors.brandNavy,
        )
        Text(
            text = step.subtitle,
            style = MaterialTheme.typography.bodyLarge,
            color = colors.mutedText,
        )
    }
}

@Composable
private fun BookingLabel(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.bodyLarge,
        fontWeight = FontWeight.Bold,
        color = LocalHayameColors.current.brandNavy,
    )
}

/** Rounded card with an icon chip and title row; an optional trailing action (e.g. Edit). */
@Composable
private fun BookingSectionCard(
    title: String,
    icon: ImageVector,
    action: (@Composable () -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val colors = LocalHayameColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(20.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .background(colors.fieldBackground, RoundedCornerShape(11.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = null, tint = colors.brandNavy, modifier = Modifier.size(18.dp))
            }
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = colors.brandNavy,
                modifier = Modifier.weight(1f),
            )
            action?.invoke()
        }
        content()
    }
}

@Composable
private fun BookingEditButton(onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    Surface(onClick = onClick, shape = CircleShape, color = colors.brandBlue.copy(alpha = 0.10f)) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.Outlined.Edit, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(14.dp))
            Text("Edit", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = colors.brandBlue)
        }
    }
}

// MARK: Dates -----------------------------------------------------------------------------------

/** Pick-up | Return halves with the day count riding the seam between them. */
@Composable
private fun BookingDateRangeCard(
    startDate: LocalDate,
    endDate: LocalDate,
    nights: Int,
    timeLabel: String,
    activeTarget: String?,
    onPickStart: () -> Unit,
    onPickEnd: () -> Unit,
) {
    val colors = LocalHayameColors.current
    Box(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(IntrinsicSize.Min)
                .clip(RoundedCornerShape(20.dp))
                .background(colors.cardBackground)
                .border(1.dp, colors.border, RoundedCornerShape(20.dp)),
        ) {
            BookingDateHalf(
                caption = "Pick-up",
                date = startDate,
                timeLabel = timeLabel,
                active = activeTarget == "start",
                alignEnd = false,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight(),
                onClick = onPickStart,
            )
            Box(
                modifier = Modifier
                    .width(1.dp)
                    .fillMaxHeight()
                    .background(colors.border),
            )
            BookingDateHalf(
                caption = "Return",
                date = endDate,
                timeLabel = timeLabel,
                active = activeTarget == "end",
                alignEnd = true,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight(),
                onClick = onPickEnd,
            )
        }
        Surface(
            shape = CircleShape,
            color = colors.brandBlue,
            modifier = Modifier.align(Alignment.Center),
        ) {
            AnimatedContent(
                targetState = nights,
                transitionSpec = {
                    val up = targetState > initialState
                    (slideInVertically(spring(dampingRatio = 0.7f, stiffness = Spring.StiffnessMedium)) { if (up) it else -it } + fadeIn())
                        .togetherWith(slideOutVertically { if (up) -it else it } + fadeOut())
                },
                label = "booking-nights",
            ) { count ->
                Text(
                    text = if (count == 1) "1 day" else "$count days",
                    modifier = Modifier.padding(horizontal = 11.dp, vertical = 6.dp),
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                )
            }
        }
    }
}

@Composable
private fun BookingDateHalf(
    caption: String,
    date: LocalDate,
    timeLabel: String,
    active: Boolean,
    alignEnd: Boolean,
    modifier: Modifier,
    onClick: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val tint by animateColorAsState(
        targetValue = if (active) colors.brandBlue.copy(alpha = 0.10f) else Color.Transparent,
        label = "booking-date-half",
    )
    Column(
        modifier = modifier
            .background(tint)
            .clickable(onClick = onClick)
            .padding(16.dp),
        horizontalAlignment = if (alignEnd) Alignment.End else Alignment.Start,
        verticalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(5.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Outlined.CalendarMonth, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(14.dp))
            Text(caption, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = colors.brandBlue)
        }
        Spacer(modifier = Modifier.height(6.dp))
        AnimatedContent(
            targetState = date,
            transitionSpec = {
                (slideInVertically(tween(280)) { it / 2 } + fadeIn(tween(240)))
                    .togetherWith(slideOutVertically(tween(200)) { -it / 2 } + fadeOut(tween(160)))
            },
            contentAlignment = if (alignEnd) Alignment.TopEnd else Alignment.TopStart,
            label = "booking-date-$caption",
        ) { day ->
            Column(horizontalAlignment = if (alignEnd) Alignment.End else Alignment.Start) {
                Text(day.bookingLabel("EEEE"), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = colors.mutedText)
                Text(day.bookingLabel("d MMM"), fontSize = 22.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy)
            }
        }
        Text(timeLabel, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
    }
}

@Composable
private fun BookingAvailabilityRow(isLoading: Boolean, isFree: Boolean) {
    val colors = LocalHayameColors.current
    val state = when {
        isLoading -> 0
        isFree -> 1
        else -> 2
    }
    AnimatedContent(
        targetState = state,
        transitionSpec = {
            (fadeIn(tween(240)) + slideInVertically(tween(260)) { it / 3 }).togetherWith(fadeOut(tween(140)))
        },
        label = "booking-availability",
    ) { current ->
        val tone = when (current) {
            0 -> colors.brandBlue
            1 -> colors.success
            else -> colors.warning
        }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(tone.copy(alpha = 0.10f))
                .padding(horizontal = 14.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            when (current) {
                0 -> CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = tone)
                1 -> Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = tone, modifier = Modifier.size(18.dp))
                else -> Icon(Icons.Outlined.Info, contentDescription = null, tint = tone, modifier = Modifier.size(18.dp))
            }
            Text(
                text = when (current) {
                    0 -> "Checking availability…"
                    1 -> "These dates are free"
                    else -> "Some of these days are taken. Pick other dates."
                },
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.SemiBold,
                color = tone,
            )
        }
    }
}

/** Flat chip that bounces when it becomes selected. */
@Composable
private fun BookingChoiceChip(label: String, selected: Boolean, onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    val scale = remember { Animatable(1f) }
    LaunchedEffect(selected) {
        if (selected) {
            scale.snapTo(0.88f)
            scale.animateTo(1f, spring(dampingRatio = 0.42f, stiffness = 700f))
        }
    }
    val background by animateColorAsState(if (selected) colors.brandBlue else colors.chipBackground, label = "chip-bg")
    val foreground by animateColorAsState(if (selected) Color.White else colors.brandNavy, label = "chip-fg")
    Surface(
        onClick = onClick,
        shape = CircleShape,
        color = background,
        border = if (selected) null else BorderStroke(1.dp, colors.border),
        modifier = Modifier.graphicsLayer {
            scaleX = scale.value
            scaleY = scale.value
        },
    ) {
        Text(
            text = label,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Bold,
            color = foreground,
        )
    }
}

@Composable
private fun BookingPricePreview(pricePerDay: Int, nights: Int, subtotal: Int) {
    val colors = LocalHayameColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(20.dp))
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            AnimatedContent(
                targetState = nights,
                transitionSpec = { fadeIn(tween(200)).togetherWith(fadeOut(tween(120))) },
                label = "booking-preview-nights",
            ) { count ->
                Text(
                    text = "${ghs(pricePerDay)} × $count day${if (count == 1) "" else "s"}",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.brandNavy,
                )
            }
            Text(
                text = "Fees and deposit are shown before you pay.",
                style = MaterialTheme.typography.bodySmall,
                color = colors.mutedText,
            )
        }
        BookingAnimatedMoney(amount = subtotal, fontSize = 22.sp, color = colors.brandNavy)
    }
}

/** Money that counts to its new value instead of jumping. */
@Composable
private fun BookingAnimatedMoney(
    amount: Int,
    fontSize: TextUnit,
    color: Color,
    modifier: Modifier = Modifier,
) {
    val animated by animateIntAsState(
        targetValue = amount,
        animationSpec = tween(durationMillis = 550, easing = FastOutSlowInEasing),
        label = "booking-money",
    )
    Text(
        text = ghs(animated),
        modifier = modifier,
        fontSize = fontSize,
        fontWeight = FontWeight.Bold,
        color = color,
        maxLines = 1,
    )
}

// MARK: Handoff ---------------------------------------------------------------------------------

/** Pickup / Delivery choice. Selected tiles get a brand ring, a tint and a check that pops in. */
@Composable
private fun BookingModeTile(
    title: String,
    icon: ImageVector,
    line: String,
    price: String,
    selected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val pressScale by animateFloatAsState(
        targetValue = if (pressed) 0.96f else 1f,
        animationSpec = spring(stiffness = Spring.StiffnessMedium),
        label = "mode-press",
    )
    val borderColor by animateColorAsState(if (selected) colors.brandBlue else colors.border, label = "mode-border")
    val background by animateColorAsState(
        if (selected) colors.brandBlue.copy(alpha = 0.08f) else colors.cardBackground,
        label = "mode-bg",
    )
    val chip by animateColorAsState(if (selected) colors.brandBlue else colors.fieldBackground, label = "mode-chip")
    Box(
        modifier = modifier
            .graphicsLayer {
                scaleX = pressScale
                scaleY = pressScale
            }
            .clip(RoundedCornerShape(20.dp))
            .background(background)
            .border(if (selected) 2.dp else 1.dp, borderColor, RoundedCornerShape(20.dp))
            .clickable(interactionSource = interaction, indication = null, onClick = onClick)
            .padding(16.dp),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(chip, RoundedCornerShape(14.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = null, tint = if (selected) Color.White else colors.brandNavy, modifier = Modifier.size(22.dp))
            }
            Spacer(modifier = Modifier.height(2.dp))
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
            Text(line, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
            Text(price, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.brandBlue)
        }
        androidx.compose.animation.AnimatedVisibility(
            visible = selected,
            modifier = Modifier.align(Alignment.TopEnd),
            enter = scaleIn(spring(dampingRatio = 0.45f, stiffness = 600f)) + fadeIn(),
            exit = scaleOut(tween(140)) + fadeOut(tween(140)),
        ) {
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .background(colors.brandBlue, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Outlined.Check, contentDescription = "Selected", tint = Color.White, modifier = Modifier.size(14.dp))
            }
        }
    }
}

@Composable
private fun BookingTextField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    keyboardType: KeyboardType = KeyboardType.Text,
    minLines: Int = 1,
) {
    val colors = LocalHayameColors.current
    val singleLine = minLines == 1
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(label, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text(placeholder, color = colors.mutedText) },
            singleLine = singleLine,
            minLines = minLines,
            maxLines = if (singleLine) 1 else 5,
            keyboardOptions = KeyboardOptions(
                keyboardType = keyboardType,
                capitalization = if (keyboardType == KeyboardType.Text) KeyboardCapitalization.Sentences else KeyboardCapitalization.None,
            ),
            textStyle = MaterialTheme.typography.bodyLarge.copy(color = colors.brandNavy),
            shape = RoundedCornerShape(14.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = colors.brandBlue,
                unfocusedBorderColor = colors.border,
                focusedContainerColor = colors.fieldBackground,
                unfocusedContainerColor = colors.fieldBackground,
                focusedTextColor = colors.brandNavy,
                unfocusedTextColor = colors.brandNavy,
                cursorColor = colors.brandBlue,
            ),
        )
    }
}

/** Common delivery times as chips, plus "Other time" for a time picker. */
@Composable
private fun BookingDeliveryTimeChips(value: String, onChange: (String) -> Unit) {
    val presets = remember { listOf("08:00", "10:00", "12:00", "14:00", "16:00", "18:00") }
    var showPicker by remember { mutableStateOf(false) }
    val isCustom = value !in presets && isValidDeliveryTime(value)
    Row(
        modifier = Modifier.horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        presets.forEach { time ->
            BookingChoiceChip(
                label = runCatching { LocalTime.parse(time).format(DateTimeFormatter.ofPattern("h a", Locale.US)) }.getOrDefault(time),
                selected = value == time,
            ) { onChange(time) }
        }
        BookingChoiceChip(
            label = if (isCustom) bookingTimeLabel(value) else "Other time",
            selected = isCustom,
        ) { showPicker = true }
    }
    if (showPicker) {
        BookingTimePickerDialog(
            initial = value,
            onDismiss = { showPicker = false },
            onConfirm = { picked ->
                onChange(picked)
                showPicker = false
            },
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun BookingTimePickerDialog(initial: String, onDismiss: () -> Unit, onConfirm: (String) -> Unit) {
    val colors = LocalHayameColors.current
    val parsed = runCatching { LocalTime.parse(initial.trim()) }.getOrNull() ?: LocalTime.of(10, 0)
    val state = rememberTimePickerState(initialHour = parsed.hour, initialMinute = parsed.minute, is24Hour = false)
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = colors.cardBackground,
        title = { Text("Delivery time", fontWeight = FontWeight.Bold, color = colors.brandNavy) },
        text = { TimePicker(state = state) },
        confirmButton = {
            TextButton(onClick = { onConfirm(String.format(Locale.US, "%02d:%02d", state.hour, state.minute)) }) {
                Text("Set time", color = colors.brandBlue, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = colors.mutedText)
            }
        },
    )
}

/** Green "within region" or amber "outside region +fee" chip that swaps with a fade. */
@Composable
private fun BookingRegionChip(outside: Boolean, fee: Int) {
    val colors = LocalHayameColors.current
    AnimatedContent(
        targetState = outside,
        transitionSpec = { (fadeIn(tween(220)) + scaleIn(initialScale = 0.94f)).togetherWith(fadeOut(tween(120))) },
        label = "booking-region",
    ) { isOutside ->
        val tone = if (isOutside) colors.warning else colors.success
        Row(
            modifier = Modifier
                .clip(CircleShape)
                .background(tone.copy(alpha = 0.12f))
                .padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = if (isOutside) Icons.Outlined.Info else Icons.Outlined.CheckCircle,
                contentDescription = null,
                tint = tone,
                modifier = Modifier.size(15.dp),
            )
            Text(
                text = when {
                    !isOutside -> "Within the listing region"
                    fee > 0 -> "Outside the listing region +${ghs(fee)}"
                    else -> "Outside the listing region"
                },
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = tone,
            )
        }
    }
}

@Composable
private fun BookingInfoRow(icon: ImageVector, title: String, subtitle: String, boxed: Boolean = false) {
    val colors = LocalHayameColors.current
    val base = Modifier.fillMaxWidth()
    Row(
        modifier = if (boxed) {
            base
                .clip(RoundedCornerShape(16.dp))
                .background(colors.cardBackground)
                .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                .padding(14.dp)
        } else {
            base
        },
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(38.dp)
                .background(colors.brandBlue.copy(alpha = 0.10f), RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(18.dp))
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(title, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
            Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
        }
    }
}

// MARK: Review ----------------------------------------------------------------------------------

@Composable
private fun BookingCarHero(imageUrl: String?, title: String, hostName: String, rating: Double, reviews: Int) {
    val colors = LocalHayameColors.current
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        BookingCarPhoto(
            imageUrl = imageUrl,
            modifier = Modifier
                .fillMaxWidth()
                .height(170.dp),
            corner = 20.dp,
        )
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(title, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "Hosted by $hostName",
                    style = MaterialTheme.typography.bodyMedium,
                    color = colors.mutedText,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f, fill = false),
                )
                Box(
                    modifier = Modifier
                        .size(3.dp)
                        .background(colors.mutedText.copy(alpha = 0.5f), CircleShape),
                )
                Icon(Icons.Filled.Star, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(13.dp))
                Text(
                    text = if (reviews > 0) "${String.format(Locale.US, "%.1f", rating)} ($reviews)" else "New",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    color = colors.brandNavy,
                )
            }
        }
    }
}

/** One stop on a vertical timeline: a node, a connecting line, and three lines of text. */
@Composable
private fun BookingTimelineNode(
    icon: ImageVector?,
    title: String,
    value: String,
    detail: String,
    isLast: Boolean,
    filled: Boolean,
) {
    val colors = LocalHayameColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(IntrinsicSize.Min),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Column(
            modifier = Modifier
                .width(28.dp)
                .fillMaxHeight(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            if (icon != null) {
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .background(if (filled) colors.brandBlue else colors.fieldBackground, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(icon, contentDescription = null, tint = if (filled) Color.White else colors.brandNavy, modifier = Modifier.size(14.dp))
                }
            } else {
                Box(
                    modifier = Modifier
                        .padding(top = 4.dp)
                        .size(12.dp)
                        .then(
                            if (filled) {
                                Modifier.background(colors.brandBlue, CircleShape)
                            } else {
                                Modifier.border(2.dp, colors.brandBlue, CircleShape)
                            },
                        ),
                )
            }
            if (!isLast) {
                Box(
                    modifier = Modifier
                        .padding(vertical = 4.dp)
                        .width(2.dp)
                        .weight(1f)
                        .background(colors.brandBlue.copy(alpha = 0.25f), CircleShape),
                )
            }
        }
        Column(
            modifier = Modifier
                .weight(1f)
                .padding(bottom = if (isLast) 0.dp else 14.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            Text(title, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = colors.mutedText)
            Text(value, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
            Text(detail, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
        }
    }
}

@Composable
private fun BookingDetailLine(label: String, value: String) {
    val colors = LocalHayameColors.current
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText, modifier = Modifier.width(96.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
            color = colors.brandNavy,
            textAlign = TextAlign.End,
            modifier = Modifier.weight(1f),
        )
    }
}

/** Charges that stagger in, a highlighted refundable deposit, then the total counting up. */
@Composable
private fun BookingPriceBreakdown(lines: List<Pair<String, Int>>, deposit: Int, total: Int) {
    val colors = LocalHayameColors.current
    BookingSectionCard(title = "Price details", icon = Icons.Outlined.Receipt) {
        lines.forEachIndexed { index, (label, value) ->
            StaggeredAppear(index = index + 1) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(label, style = MaterialTheme.typography.bodyLarge, color = colors.mutedText, modifier = Modifier.weight(1f))
                    Text(ghs(value), style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                }
            }
        }
        StaggeredAppear(index = lines.size + 1) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(colors.success.copy(alpha = 0.10f))
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Icon(Icons.Outlined.Shield, contentDescription = null, tint = colors.success, modifier = Modifier.size(16.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text("Refundable deposit", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold, color = colors.brandNavy)
                    Text("Returned after the trip", style = MaterialTheme.typography.bodySmall, color = colors.mutedText)
                }
                Text(ghs(deposit), style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.success)
            }
        }
        HorizontalDivider(color = colors.border)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Total", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy, modifier = Modifier.weight(1f))
            BookingAnimatedMoney(amount = total, fontSize = 26.sp, color = colors.brandNavy)
        }
        Text(
            text = "No hidden fees. This is what you pay at checkout.",
            style = MaterialTheme.typography.bodySmall,
            color = colors.mutedText,
        )
    }
}

// MARK: Pay -------------------------------------------------------------------------------------

@Composable
private fun BookingPayHero(total: Int, deposit: Int, nights: Int) {
    val colors = LocalHayameColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(Brush.linearGradient(listOf(colors.heroStart, colors.heroEnd)))
            .background(Brush.radialGradient(listOf(colors.heroHighlight, Color.Transparent), radius = 520f))
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text("You'll pay", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold, color = Color.White.copy(alpha = 0.82f))
        BookingAnimatedMoney(amount = total, fontSize = 40.sp, color = Color.White)
        Text(
            text = if (deposit > 0) {
                "Includes ${ghs(deposit)} refundable deposit"
            } else {
                "For $nights day${if (nights == 1) "" else "s"}, all fees included"
            },
            style = MaterialTheme.typography.bodyMedium,
            color = Color.White.copy(alpha = 0.82f),
        )
    }
}

/** Running amount on the left, the step's action on the right; errors slide in above and the bar shakes. */
@Composable
private fun BookingBottomBar(
    amount: Int,
    caption: String,
    buttonText: String,
    isLoading: Boolean,
    showArrow: Boolean,
    message: String?,
    shakeOffset: Float,
    onClick: () -> Unit,
) {
    val colors = LocalHayameColors.current
    var lastMessage by remember { mutableStateOf("") }
    if (!message.isNullOrBlank()) lastMessage = message
    val isInfo = lastMessage.startsWith("Checking")
    val tone = if (isInfo) colors.brandBlue else colors.danger

    Column(modifier = Modifier.fillMaxWidth()) {
        androidx.compose.animation.AnimatedVisibility(
            visible = !message.isNullOrBlank(),
            enter = expandVertically(spring(dampingRatio = 0.8f, stiffness = Spring.StiffnessMedium)) + fadeIn(),
            exit = shrinkVertically(tween(180)) + fadeOut(tween(140)),
        ) {
            Row(
                modifier = Modifier
                    .padding(horizontal = 16.dp)
                    .padding(bottom = 8.dp)
                    .fillMaxWidth()
                    .graphicsLayer { translationX = shakeOffset.dp.toPx() }
                    .clip(RoundedCornerShape(14.dp))
                    .background(tone.copy(alpha = 0.12f))
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    imageVector = if (isInfo) Icons.Outlined.Info else Icons.Outlined.ErrorOutline,
                    contentDescription = null,
                    tint = tone,
                    modifier = Modifier.size(18.dp),
                )
                Text(lastMessage, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = tone)
            }
        }
        Surface(color = colors.cardBackground, shadowElevation = 12.dp) {
            Column {
                HorizontalDivider(color = colors.bottomBarSeparator)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                        .graphicsLayer { translationX = shakeOffset.dp.toPx() },
                    horizontalArrangement = Arrangement.spacedBy(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(modifier = Modifier.weight(1f).coachTarget("booking.total"), verticalArrangement = Arrangement.spacedBy(1.dp)) {
                        BookingAnimatedMoney(amount = amount, fontSize = 22.sp, color = colors.brandNavy)
                        AnimatedContent(
                            targetState = caption,
                            transitionSpec = { fadeIn(tween(220)).togetherWith(fadeOut(tween(120))) },
                            label = "booking-caption",
                        ) { text ->
                            Text(text, style = MaterialTheme.typography.bodySmall, color = colors.mutedText, maxLines = 1)
                        }
                    }
                    Button(
                        onClick = onClick,
                        enabled = !isLoading,
                        modifier = Modifier.height(52.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = colors.brandBlue,
                            contentColor = Color.White,
                            disabledContainerColor = colors.brandBlue.copy(alpha = 0.7f),
                            disabledContentColor = Color.White,
                        ),
                        elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp, pressedElevation = 0.dp),
                        contentPadding = PaddingValues(horizontal = 22.dp),
                    ) {
                        AnimatedContent(
                            targetState = buttonText to isLoading,
                            transitionSpec = {
                                (fadeIn(tween(200)) + slideInVertically(tween(240)) { it / 2 })
                                    .togetherWith(fadeOut(tween(120)) + slideOutVertically(tween(160)) { -it / 2 })
                            },
                            label = "booking-cta",
                        ) { (text, loading) ->
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                                if (loading) {
                                    CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = Color.White)
                                }
                                Text(text, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                                if (!loading && showArrow) {
                                    Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(18.dp))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// MARK: Processing and success ------------------------------------------------------------------

/** Scrim with a pulsing lock while the payment is confirmed. Shared with the resume checkout. */
@Composable
internal fun PaymentProcessingOverlay() {
    val colors = LocalHayameColors.current
    val pulse = rememberInfiniteTransition(label = "payment-pulse")
    val ring by pulse.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.7f,
        animationSpec = infiniteRepeatable(tween(1400, easing = LinearOutSlowInEasing), RepeatMode.Restart),
        label = "payment-ring",
    )
    val lockScale by pulse.animateFloat(
        initialValue = 0.94f,
        targetValue = 1.06f,
        animationSpec = infiniteRepeatable(tween(700, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "payment-lock",
    )
    var dots by remember { mutableIntStateOf(0) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(380)
            dots = (dots + 1) % 4
        }
    }
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.45f))
            .blockTouches(),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier
                .padding(32.dp)
                .clip(RoundedCornerShape(24.dp))
                .background(colors.cardBackground)
                .padding(horizontal = 28.dp, vertical = 26.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Box(modifier = Modifier.size(88.dp), contentAlignment = Alignment.Center) {
                Box(
                    modifier = Modifier
                        .size(60.dp)
                        .graphicsLayer {
                            scaleX = ring
                            scaleY = ring
                            alpha = ((1.7f - ring) / 0.85f).coerceIn(0f, 1f)
                        }
                        .border(2.dp, colors.brandBlue.copy(alpha = 0.6f), CircleShape),
                )
                Box(
                    modifier = Modifier
                        .size(60.dp)
                        .graphicsLayer {
                            scaleX = lockScale
                            scaleY = lockScale
                        }
                        .background(colors.brandBlue.copy(alpha = 0.14f), CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Outlined.Lock, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(26.dp))
                }
            }
            Text("Confirming your payment", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                repeat(3) { index ->
                    Box(
                        modifier = Modifier
                            .size(7.dp)
                            .graphicsLayer { alpha = if (dots > index) 1f else 0.25f }
                            .background(colors.brandBlue, CircleShape),
                    )
                }
            }
            Text(
                text = "Keep the app open. This only takes a few seconds.",
                style = MaterialTheme.typography.bodyMedium,
                color = colors.mutedText,
                textAlign = TextAlign.Center,
            )
        }
    }
}

/** Shown once payment is verified: a check that springs in, the trip, and where it goes next. */
@Composable
private fun BookingSuccessStage(
    imageUrl: String?,
    carTitle: String,
    hostName: String,
    dateLine: String,
    place: String,
    onDone: () -> Unit,
) {
    val colors = LocalHayameColors.current
    var started by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { started = true }
    val checkScale by animateFloatAsState(
        targetValue = if (started) 1f else 0.3f,
        animationSpec = spring(dampingRatio = 0.45f, stiffness = 260f),
        label = "success-check",
    )
    val pulse = rememberInfiniteTransition(label = "success-pulse")
    val ring by pulse.animateFloat(
        initialValue = 1f,
        targetValue = 1.7f,
        animationSpec = infiniteRepeatable(tween(1600, easing = LinearOutSlowInEasing), RepeatMode.Restart),
        label = "success-ring",
    )
    val waitingDot by pulse.animateFloat(
        initialValue = 0.4f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(650), RepeatMode.Reverse),
        label = "success-waiting",
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.pageBackground)
            .blockTouches()
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(modifier = Modifier.weight(1f))
        Box(modifier = Modifier.size(150.dp), contentAlignment = Alignment.Center) {
            Box(
                modifier = Modifier
                    .size(96.dp)
                    .graphicsLayer {
                        scaleX = ring
                        scaleY = ring
                        alpha = ((1.7f - ring) / 0.7f).coerceIn(0f, 1f) * 0.6f
                    }
                    .border(2.dp, colors.success, CircleShape),
            )
            Box(
                modifier = Modifier
                    .size(96.dp)
                    .graphicsLayer {
                        scaleX = checkScale
                        scaleY = checkScale
                    }
                    .background(colors.success, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Outlined.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(48.dp))
            }
        }
        Spacer(modifier = Modifier.height(16.dp))
        StaggeredAppear(index = 2) {
            Text("Request sent", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy, textAlign = TextAlign.Center)
        }
        Spacer(modifier = Modifier.height(6.dp))
        StaggeredAppear(index = 3) {
            Text(
                text = "Payment received. We've let $hostName know, and you'll get a notification the moment they confirm.",
                style = MaterialTheme.typography.bodyLarge,
                color = colors.mutedText,
                textAlign = TextAlign.Center,
            )
        }
        Spacer(modifier = Modifier.height(22.dp))
        StaggeredAppear(index = 4) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(colors.cardBackground)
                    .border(1.dp, colors.border, RoundedCornerShape(18.dp))
                    .padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                BookingCarPhoto(imageUrl = imageUrl, modifier = Modifier.size(width = 72.dp, height = 56.dp), corner = 12.dp)
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(carTitle, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(dateLine, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
                    Text(place, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
        }
        Spacer(modifier = Modifier.height(16.dp))
        StaggeredAppear(index = 5) {
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
                SuccessStepNode(label = "Paid", done = true, current = false, alpha = 1f, modifier = Modifier.weight(1f))
                SuccessStepNode(label = "Host confirms", done = false, current = true, alpha = waitingDot, modifier = Modifier.weight(1f))
                SuccessStepNode(label = "Pickup", done = false, current = false, alpha = 1f, modifier = Modifier.weight(1f))
            }
        }
        Spacer(modifier = Modifier.weight(1f))
        StaggeredAppear(index = 6) {
            Button(
                onClick = onDone,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = colors.brandBlue, contentColor = Color.White),
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp, pressedElevation = 0.dp),
            ) {
                Text("View in Trips", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun SuccessStepNode(label: String, done: Boolean, current: Boolean, alpha: Float, modifier: Modifier) {
    val colors = LocalHayameColors.current
    Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(
            modifier = Modifier
                .size(26.dp)
                .graphicsLayer { this.alpha = if (current) alpha else 1f }
                .then(
                    when {
                        done -> Modifier.background(colors.success, CircleShape)
                        current -> Modifier.background(colors.brandBlue, CircleShape)
                        else -> Modifier.border(2.dp, colors.border, CircleShape)
                    },
                ),
            contentAlignment = Alignment.Center,
        ) {
            when {
                done -> Icon(Icons.Outlined.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                current -> Box(modifier = Modifier.size(8.dp).background(Color.White, CircleShape))
                else -> Unit
            }
        }
        Text(
            text = label,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = if (done || current) FontWeight.Bold else FontWeight.Medium,
            color = if (done || current) colors.brandNavy else colors.mutedText,
            textAlign = TextAlign.Center,
        )
    }
}

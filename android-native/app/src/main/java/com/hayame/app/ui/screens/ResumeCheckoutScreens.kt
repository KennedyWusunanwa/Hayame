package com.hayame.app.ui.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.outlined.Bookmark
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.DirectionsCar
import androidx.compose.material.icons.outlined.ShoppingCart
import androidx.compose.material.icons.outlined.Timer
import androidx.compose.material.icons.outlined.WarningAmber
import androidx.compose.material.icons.outlined.WifiOff
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import coil.compose.AsyncImage
import com.hayame.app.core.network.CheckoutIssueDto
import com.hayame.app.core.network.PaystackFinalizeRequest
import com.hayame.app.core.network.PaystackInitDto
import com.hayame.app.core.network.PendingCheckoutDto
import com.hayame.app.ui.theme.LocalHayameColors
import com.hayame.app.ui.theme.LocalDarkMode
import com.hayame.app.ui.viewmodel.AppViewModel
import com.hayame.app.ui.viewmodel.BookingDraft
import com.hayame.app.ui.viewmodel.SavedCheckoutResumeResult
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.delay
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import kotlin.math.roundToInt

// MARK: Resumable checkout -----------------------------------------------------------------------
//
// A renter who starts paying and drops out (closed the Paystack tab, card declined, app killed,
// MoMo prompt ignored) keeps their work: the server holds the booking row with every option they
// chose, and this device keeps a draft of anything picked before paying. These composables surface
// that as a "Finish your booking" card on Home and Trips, a strip on the listing, and a resume
// screen that re-checks every condition (car still bookable, dates still free, price unchanged)
// before Paystack is opened again.

/** Whatever the renter can pick back up; a server-held checkout wins over a local draft. */
sealed interface ResumableCheckoutUi {
    data class Held(val checkout: PendingCheckoutDto) : ResumableCheckoutUi
    data class Draft(val draft: BookingDraft) : ResumableCheckoutUi

    val carId: String
        get() = when (this) {
            is Held -> checkout.carId
            is Draft -> draft.carId
        }
}

@Composable
fun rememberResumableCheckout(viewModel: AppViewModel): ResumableCheckoutUi? {
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val saved by viewModel.savedCheckout.collectAsState()
    val draft by viewModel.bookingDraft.collectAsState()
    val me by viewModel.me.collectAsState()
    if (!isAuthenticated) return null
    saved?.let { return ResumableCheckoutUi.Held(it) }
    val localDraft = draft ?: return null
    // Only drafts that progressed past the first step are worth surfacing.
    if (localDraft.step <= 0 && localDraft.tripMode == null) return null
    if (localDraft.userId.isNotBlank() && me?.user?.id != null && localDraft.userId != me?.user?.id) return null
    return ResumableCheckoutUi.Draft(localDraft)
}

// MARK: Card (Home / Trips) ----------------------------------------------------------------------

@Composable
fun ResumeCheckoutCard(
    resumable: ResumableCheckoutUi,
    viewModel: AppViewModel,
    onResume: () -> Unit,
    index: Int = 0,
) {
    val colors = LocalHayameColors.current
    var showAbandonConfirm by remember { mutableStateOf(false) }
    var isAbandoning by remember { mutableStateOf(false) }
    val held = (resumable as? ResumableCheckoutUi.Held)?.checkout

    val title = when (resumable) {
        is ResumableCheckoutUi.Held -> resumable.checkout.car?.title?.trim().takeUnless { it.isNullOrBlank() } ?: "Hayame listing"
        is ResumableCheckoutUi.Draft -> resumable.draft.carTitle.ifBlank { "Hayame listing" }
    }
    val imageUrl = when (resumable) {
        is ResumableCheckoutUi.Held -> resolveAppImage(resumable.checkout.car?.imageUrl)
        is ResumableCheckoutUi.Draft -> resolveAppImage(resumable.draft.carImageUrl)
    }
    val (startDate, endDate) = resumableDates(resumable)
    val nights = ChronoUnit.DAYS.between(startDate, endDate).toInt().coerceAtLeast(1)
    val tripMode = when (resumable) {
        is ResumableCheckoutUi.Held -> if (resumable.checkout.isDelivery) "Delivery" else "Pickup"
        is ResumableCheckoutUi.Draft -> if (resumable.draft.tripMode == "delivery") "Delivery" else "Pickup"
    }
    val totalText = when (resumable) {
        is ResumableCheckoutUi.Held -> "GHS ${resumable.checkout.totalAmount}"
        is ResumableCheckoutUi.Draft -> "GHS ${resumable.draft.dailyPrice * nights}+"
    }

    StaggeredAppear(index = index) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = colors.cardBackground,
            border = BorderStroke(
                1.2.dp,
                Brush.linearGradient(listOf(colors.brandBlue.copy(alpha = 0.55f), colors.border, colors.brandBlue.copy(alpha = 0.25f))),
            ),
            modifier = Modifier
                .fillMaxWidth()
                .shadow(10.dp, RoundedCornerShape(24.dp), ambientColor = colors.brandBlue.copy(alpha = 0.18f), spotColor = colors.brandBlue.copy(alpha = 0.18f)),
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    val darkMode = LocalDarkMode.current
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .then(
                                if (darkMode) Modifier.background(colors.brandBlue.copy(alpha = 0.16f), RoundedCornerShape(12.dp))
                                else Modifier.background(Brush.linearGradient(listOf(colors.brandBlue, colors.primaryButtonEnd)), RoundedCornerShape(12.dp)),
                            ),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            if (held == null) Icons.Outlined.Bookmark else Icons.Outlined.ShoppingCart,
                            contentDescription = null,
                            tint = if (darkMode) colors.brandBlue else Color.White,
                            modifier = Modifier.size(18.dp),
                        )
                    }
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text("Finish your booking", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                        Text(
                            if (held == null) "Your selections are saved on this phone." else "Everything you chose is saved. Pick up where you left off.",
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.mutedText,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                    CheckoutStatusChip(resumable)
                }

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    CheckoutThumbnail(imageUrl = imageUrl, width = 92.dp, height = 70.dp)
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text(checkoutDateRangeLabel(startDate, endDate), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = colors.brandBlue)
                        Text("$nights day${if (nights == 1) "" else "s"} • $tripMode", style = MaterialTheme.typography.bodySmall, color = colors.mutedText)
                    }
                    Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(if (held == null) "FROM" else "TOTAL", style = MaterialTheme.typography.labelSmall, color = colors.mutedText, fontWeight = FontWeight.Bold)
                        Text(totalText, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy, maxLines = 1)
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    GradientActionButton(
                        text = if (held == null) "Continue" else "Resume",
                        modifier = Modifier.weight(1f),
                        onClick = onResume,
                    )
                    OutlinedButton(
                        onClick = { showAbandonConfirm = true },
                        enabled = !isAbandoning,
                        shape = RoundedCornerShape(16.dp),
                        border = BorderStroke(1.dp, colors.border),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = colors.mutedText, containerColor = colors.fieldBackground),
                        modifier = Modifier.height(48.dp),
                    ) {
                        if (isAbandoning) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = colors.mutedText)
                        } else {
                            Text("Abandon", fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
        }
    }

    if (showAbandonConfirm) {
        AbandonCheckoutDialog(
            message = if (held == null) {
                "Your saved selections for $title will be cleared."
            } else {
                "The dates held for you will be released and the saved checkout cleared."
            },
            onDismiss = { showAbandonConfirm = false },
            onConfirm = {
                showAbandonConfirm = false
                isAbandoning = true
                viewModel.abandonSavedCheckout(bookingId = held?.bookingId, carId = resumable.carId) { isAbandoning = false }
            },
        )
    }
}

@Composable
private fun AbandonCheckoutDialog(message: String, onDismiss: () -> Unit, onConfirm: () -> Unit) {
    val colors = LocalHayameColors.current
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = colors.cardBackground,
        title = { Text("Abandon this booking?", color = colors.brandNavy, fontWeight = FontWeight.Bold) },
        text = { Text(message, color = colors.mutedText) },
        confirmButton = {
            TextButton(onClick = onConfirm) { Text("Abandon booking", color = colors.danger, fontWeight = FontWeight.Bold) }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Keep it", color = colors.brandBlue, fontWeight = FontWeight.Bold) }
        },
    )
}

/** Live countdown while the hold is active, otherwise the state of the saved checkout. */
@Composable
private fun CheckoutStatusChip(resumable: ResumableCheckoutUi) {
    val colors = LocalHayameColors.current
    when (resumable) {
        is ResumableCheckoutUi.Held -> {
            val expiry = remember(resumable.checkout.holdExpiresAt) { parseHoldExpiry(resumable.checkout.holdExpiresAt) }
            if (expiry != null && resumable.checkout.isHeld) {
                val remaining = rememberCountdownSeconds(expiry)
                if (remaining > 0) {
                    StatusChip(
                        text = "Held ${formatCountdown(remaining)}",
                        tint = if (remaining < 120) colors.warning else colors.brandBlue,
                        icon = Icons.Outlined.Timer,
                        live = true,
                    )
                } else {
                    StatusChip(text = "Hold ended", tint = colors.mutedText, icon = Icons.Outlined.Timer)
                }
            } else {
                StatusChip(text = "Saved", tint = colors.mutedText, icon = Icons.Outlined.Bookmark)
            }
        }
        is ResumableCheckoutUi.Draft -> StatusChip(text = "Draft", tint = colors.mutedText, icon = Icons.Outlined.Bookmark)
    }
}

@Composable
private fun StatusChip(
    text: String,
    tint: Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    live: Boolean = false,
) {
    val pulse by animateFloatAsState(if (live) 1f else 0f, tween(600), label = "chip-pulse")
    Surface(shape = RoundedCornerShape(999.dp), color = tint.copy(alpha = 0.12f)) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(5.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(13.dp).graphicsLayer { alpha = 0.7f + 0.3f * pulse })
            Text(text, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = tint)
        }
    }
}

@Composable
private fun CheckoutThumbnail(imageUrl: String?, width: androidx.compose.ui.unit.Dp, height: androidx.compose.ui.unit.Dp) {
    val colors = LocalHayameColors.current
    Box(
        modifier = Modifier
            .size(width = width, height = height)
            .clip(RoundedCornerShape(14.dp))
            .background(colors.brandLight),
        contentAlignment = Alignment.Center,
    ) {
        if (!imageUrl.isNullOrBlank()) {
            AsyncImage(model = imageUrl, contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        } else {
            Icon(Icons.Outlined.DirectionsCar, contentDescription = null, tint = colors.brandBlue)
        }
    }
}

@Composable
private fun GradientActionButton(text: String, modifier: Modifier = Modifier, enabled: Boolean = true, loading: Boolean = false, onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        modifier = modifier.height(48.dp),
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent, disabledContainerColor = Color.Transparent),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(colors.brandBlue, RoundedCornerShape(16.dp))
                .graphicsLayer { alpha = if (enabled) 1f else 0.6f },
            contentAlignment = Alignment.Center,
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                if (loading) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = Color.White)
                }
                Text(text, color = Color.White, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodyLarge)
            }
        }
    }
}

// MARK: Strip (listing) --------------------------------------------------------------------------

/** Compact reminder above the booking bar on the listing the checkout is for. */
@Composable
fun ResumeCheckoutStrip(resumable: ResumableCheckoutUi, onResume: () -> Unit) {
    val colors = LocalHayameColors.current
    val (startDate, endDate) = resumableDates(resumable)
    val detail = when (resumable) {
        is ResumableCheckoutUi.Held -> "${checkoutDateRangeLabel(startDate, endDate)} • GHS ${resumable.checkout.totalAmount}"
        is ResumableCheckoutUi.Draft -> "${checkoutDateRangeLabel(startDate, endDate)} • draft saved"
    }
    Surface(
        onClick = onResume,
        shape = RoundedCornerShape(16.dp),
        color = colors.brandLight,
        border = BorderStroke(1.dp, colors.brandBlue.copy(alpha = 0.22f)),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier.size(30.dp).background(colors.brandBlue, RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    if (resumable is ResumableCheckoutUi.Held) Icons.Outlined.ShoppingCart else Icons.Outlined.Bookmark,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(16.dp),
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                Text("You have an unfinished booking for this car", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(detail, style = MaterialTheme.typography.bodySmall, color = colors.mutedText, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Text("Resume", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = colors.brandBlue)
        }
    }
}

// MARK: Resume screen ----------------------------------------------------------------------------

private sealed interface ResumePhase {
    data object Verifying : ResumePhase
    data class Ready(val checkout: PendingCheckoutDto) : ResumePhase
    data class Blocked(val checkout: PendingCheckoutDto) : ResumePhase
    data class Failed(val message: String) : ResumePhase
}

private enum class CheckRowState { PENDING, PASSED, FAILED, SKIPPED }

private val checkTitles = listOf("Listing still available", "Dates still free", "Price confirmed")

private fun checkIndexFor(issue: CheckoutIssueDto?): Int = when (issue?.code) {
    "car_not_found", "car_unavailable", "listing_not_approved", "own_car", "delivery_unavailable" -> 0
    "dates_invalid", "dates_past", "dates_taken", "dates_blocked", "hold_failed" -> 1
    else -> 2
}

/**
 * Re-verifies a held checkout with the server, then offers to pay, edit the details, or abandon.
 * Every condition is checked again before Paystack opens.
 */
@Composable
fun ResumeCheckoutScreen(
    viewModel: AppViewModel,
    pendingPaystackCallbackUri: String?,
    onBack: () -> Unit,
    onEditDetails: (carId: String) -> Unit,
    onBookingCompleted: (bookingId: String) -> Unit,
    onPaystackCallbackConsumed: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val saved by viewModel.savedCheckout.collectAsState()
    val lastCompleted by viewModel.lastCompletedCheckoutBookingId.collectAsState()
    val initial = remember { saved }

    if (initial == null) {
        LaunchedEffect(Unit) { onBack() }
        return
    }

    var phase by remember { mutableStateOf<ResumePhase>(ResumePhase.Verifying) }
    var checksCompleted by remember { mutableIntStateOf(0) }
    var failedIndex by remember { mutableStateOf<Int?>(null) }
    var verifyNonce by remember { mutableIntStateOf(0) }
    var session by remember { mutableStateOf<PaystackInitDto?>(null) }
    var isProcessingPayment by rememberSaveable { mutableStateOf(false) }
    var awaitingPaymentReturn by rememberSaveable { mutableStateOf(false) }
    var returnedFromPaymentWithoutCallback by rememberSaveable { mutableStateOf(false) }
    var paymentMessage by rememberSaveable { mutableStateOf<String?>(null) }
    var showAbandonConfirm by remember { mutableStateOf(false) }
    var isAbandoning by remember { mutableStateOf(false) }
    val completedAtOpen = remember { lastCompleted }

    val checkout = when (val current = phase) {
        is ResumePhase.Ready -> current.checkout
        is ResumePhase.Blocked -> current.checkout
        else -> initial
    }

    // A checkout opened from here and paid in the full checkout screen: nothing left to show.
    LaunchedEffect(lastCompleted) {
        if (lastCompleted != null && lastCompleted != completedAtOpen) onBack()
    }

    LaunchedEffect(verifyNonce) {
        phase = ResumePhase.Verifying
        checksCompleted = 0
        failedIndex = null
        paymentMessage = null
        val deferred = CompletableDeferred<SavedCheckoutResumeResult>()
        viewModel.resumeSavedCheckout(initial.bookingId) { deferred.complete(it) }
        // Tick the first checks while the request is in flight so the wait reads as progress.
        var ticks = 0
        while (!deferred.isCompleted && ticks < 2) {
            delay(380)
            if (!deferred.isCompleted) {
                ticks += 1
                checksCompleted = ticks
            }
        }
        suspend fun reveal(target: Int) {
            while (checksCompleted < target) {
                checksCompleted += 1
                delay(220)
            }
        }
        when (val result = deferred.await()) {
            is SavedCheckoutResumeResult.Ready -> {
                reveal(3)
                phase = ResumePhase.Ready(result.checkout)
            }
            is SavedCheckoutResumeResult.Blocked -> {
                val index = checkIndexFor(result.checkout.issues.firstOrNull())
                reveal(index)
                failedIndex = index
                phase = ResumePhase.Blocked(result.checkout)
            }
            is SavedCheckoutResumeResult.Completed -> {
                reveal(3)
                viewModel.showMessage("Your earlier payment went through. The booking is now in Trips.")
                viewModel.focusBooking(result.bookingId)
                onBookingCompleted(result.bookingId)
            }
            is SavedCheckoutResumeResult.Failed -> {
                if (result.gone) {
                    viewModel.showMessage(result.message)
                    onBack()
                } else {
                    phase = ResumePhase.Failed(result.message)
                }
            }
        }
    }

    fun finalizeWith(reference: String?) {
        val active = session ?: return
        val resolved = reference?.trim()?.takeIf { it.isNotBlank() }
        if (resolved == null) {
            paymentMessage = "Payment wasn't completed. Your booking is still saved — try again when you're ready."
            return
        }
        returnedFromPaymentWithoutCallback = false
        awaitingPaymentReturn = false
        isProcessingPayment = true
        paymentMessage = null
        viewModel.finalizePaystack(
            request = PaystackFinalizeRequest(
                bookingId = active.bookingId,
                carId = checkout.carId,
                startDate = checkout.startDate,
                endDate = checkout.endDate,
                tripUseRegion = checkout.tripUseRegion.orEmpty(),
                tripUseCity = checkout.tripUseCity.orEmpty(),
                tripUseAddress = checkout.tripUseAddress.orEmpty(),
                reference = resolved,
                amount = (active.amount ?: 0.0).roundToInt(),
            ),
            onSuccess = {
                isProcessingPayment = false
                viewModel.showMessage("Payment successful. Your booking is now in Trips.")
                viewModel.focusBooking(active.bookingId)
                onBookingCompleted(active.bookingId)
            },
            onError = { message ->
                isProcessingPayment = false
                paymentMessage = "$message Your booking is still saved — try again when you're ready."
                // The hold may have expired or been superseded: re-run the checks.
                verifyNonce += 1
            },
        )
    }

    fun pay() {
        val ready = (phase as? ResumePhase.Ready)?.checkout ?: return
        isProcessingPayment = true
        paymentMessage = null
        viewModel.initiateResumedPayment(
            checkout = ready,
            callbackUrl = "hayame://payment-callback",
            onReady = { init ->
                session = init
                isProcessingPayment = false
                awaitingPaymentReturn = true
                openExternalUrl(context, init.payment_url ?: init.authorization_url)
            },
            onError = { message ->
                isProcessingPayment = false
                paymentMessage = "$message Your booking is still saved — try again when you're ready."
                verifyNonce += 1
            },
        )
    }

    LaunchedEffect(pendingPaystackCallbackUri, session?.reference) {
        if (!pendingPaystackCallbackUri.isNullOrBlank() && session != null && !isProcessingPayment) {
            val callback = parsePaystackCallback(pendingPaystackCallbackUri)
            awaitingPaymentReturn = false
            onPaystackCallbackConsumed()
            if (callback.isCancelled || callback.reference.isNullOrBlank()) {
                paymentMessage = "Payment was cancelled or not completed. Your booking is still saved."
            } else {
                finalizeWith(callback.reference)
            }
        }
    }

    LaunchedEffect(returnedFromPaymentWithoutCallback, session?.reference, isProcessingPayment) {
        val active = session
        if (returnedFromPaymentWithoutCallback && active != null && !isProcessingPayment) {
            paymentMessage = "Checking payment status..."
            finalizeWith(active.reference)
        }
    }

    DisposableEffect(lifecycleOwner, awaitingPaymentReturn, session, isProcessingPayment, pendingPaystackCallbackUri) {
        val observer = LifecycleEventObserver { _, event ->
            if (
                event == Lifecycle.Event.ON_RESUME &&
                awaitingPaymentReturn &&
                session != null &&
                !isProcessingPayment &&
                pendingPaystackCallbackUri.isNullOrBlank()
            ) {
                awaitingPaymentReturn = false
                returnedFromPaymentWithoutCallback = true
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    fun openEditor(step: Int) {
        viewModel.setBookingDraft(
            carId = checkout.carId,
            startDate = checkout.startDate,
            endDate = checkout.endDate,
            region = checkout.tripUseRegion.orEmpty(),
            city = checkout.tripUseCity.orEmpty(),
            address = checkout.tripUseAddress.orEmpty(),
            tripMode = checkout.tripMode,
            deliveryAddress = checkout.deliveryAddress.orEmpty(),
            deliveryTime = checkout.deliveryTime.orEmpty(),
            contactPhone = checkout.contactPhone.orEmpty(),
            deliveryNotes = checkout.deliveryNotes.orEmpty(),
            carTitle = checkout.car?.title.orEmpty(),
            carImageUrl = checkout.car?.imageUrl,
            dailyPrice = (checkout.car?.dailyPrice ?: 0.0).roundToInt(),
            step = step,
            persist = false,
        )
        onEditDetails(checkout.carId)
    }

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = { CheckoutTopBar(title = "Finish your booking", backLabel = "Close", onBack = onBack) },
        bottomBar = {
            Surface(color = colors.cardBackground.copy(alpha = 0.96f), shadowElevation = 10.dp) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    paymentMessage?.takeIf { it.isNotBlank() }?.let {
                        Text(it, style = MaterialTheme.typography.bodyMedium, color = colors.danger, fontWeight = FontWeight.SemiBold)
                    }
                    when (val current = phase) {
                        is ResumePhase.Ready -> {
                            GradientActionButton(
                                text = if (isProcessingPayment) "Processing..." else "Pay GHS ${current.checkout.totalAmount}",
                                loading = isProcessingPayment,
                                modifier = Modifier.fillMaxWidth(),
                                onClick = ::pay,
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                SecondaryPillButton(text = "Edit details", modifier = Modifier.weight(1f)) { openEditor(step = 2) }
                                OutlinedButton(
                                    onClick = { showAbandonConfirm = true },
                                    enabled = !isAbandoning && !isProcessingPayment,
                                    modifier = Modifier.weight(1f).height(44.dp),
                                    shape = RoundedCornerShape(999.dp),
                                    border = BorderStroke(1.dp, colors.danger.copy(alpha = 0.4f)),
                                    colors = ButtonDefaults.outlinedButtonColors(contentColor = colors.danger),
                                ) {
                                    if (isAbandoning) {
                                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = colors.danger)
                                    } else {
                                        Text("Abandon", fontWeight = FontWeight.SemiBold)
                                    }
                                }
                            }
                        }
                        is ResumePhase.Blocked -> {
                            GradientActionButton(text = "Choose new dates", modifier = Modifier.fillMaxWidth()) { openEditor(step = 0) }
                            OutlinedButton(
                                onClick = { showAbandonConfirm = true },
                                enabled = !isAbandoning,
                                modifier = Modifier.fillMaxWidth().height(44.dp),
                                shape = RoundedCornerShape(999.dp),
                                border = BorderStroke(1.dp, colors.danger.copy(alpha = 0.4f)),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = colors.danger),
                            ) {
                                Text("Abandon booking", fontWeight = FontWeight.SemiBold)
                            }
                        }
                        ResumePhase.Verifying -> {
                            Text(
                                "Checking that everything still lines up...",
                                style = MaterialTheme.typography.bodyMedium,
                                color = colors.mutedText,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp),
                            )
                        }
                        is ResumePhase.Failed -> {
                            SecondaryPillButton(text = "Try again", modifier = Modifier.fillMaxWidth()) { verifyNonce += 1 }
                        }
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                }
            }
        },
    ) { inner ->
        Box(modifier = Modifier.fillMaxSize().padding(inner)) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                VerificationCard(phase = phase, checksCompleted = checksCompleted, failedIndex = failedIndex)

                AnimatedContent(
                    targetState = phase,
                    transitionSpec = {
                        (fadeIn(tween(240)) + slideInVertically(tween(320, easing = FastOutSlowInEasing)) { it / 8 })
                            .togetherWith(fadeOut(tween(140)))
                    },
                    label = "resume-phase",
                ) { current ->
                    when (current) {
                        is ResumePhase.Ready -> Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                            ListingCard(checkout = current.checkout, showHold = true)
                            TripSummaryCard(checkout = current.checkout)
                            PriceBreakdownCard(checkout = current.checkout)
                        }
                        is ResumePhase.Blocked -> Box(modifier = Modifier.graphicsLayer { alpha = 0.72f }) {
                            ListingCard(checkout = current.checkout, showHold = false)
                        }
                        is ResumePhase.Failed -> Spacer(modifier = Modifier.height(1.dp))
                        ResumePhase.Verifying -> Spacer(modifier = Modifier.height(1.dp))
                    }
                }
                Spacer(modifier = Modifier.height(24.dp))
            }

            if (isProcessingPayment) {
                PaymentProcessingOverlay()
            }
        }
    }

    if (showAbandonConfirm) {
        AbandonCheckoutDialog(
            message = "The dates held for you will be released and the saved checkout cleared.",
            onDismiss = { showAbandonConfirm = false },
            onConfirm = {
                showAbandonConfirm = false
                isAbandoning = true
                viewModel.abandonSavedCheckout(bookingId = checkout.bookingId, carId = checkout.carId) { ok ->
                    isAbandoning = false
                    if (ok) onBack()
                }
            },
        )
    }
}

@Composable
private fun VerificationCard(phase: ResumePhase, checksCompleted: Int, failedIndex: Int?) {
    val colors = LocalHayameColors.current
    val (title, subtitle) = when (phase) {
        ResumePhase.Verifying -> "Re-checking your booking" to "We make sure the car, dates and price are still exactly as you left them."
        is ResumePhase.Ready -> "All good — ready to pay" to "Your hold was refreshed and the price confirmed. Nothing was charged yet."
        is ResumePhase.Blocked -> "Something changed" to (phase.checkout.issues.firstOrNull()?.message ?: "Pick new dates to continue.")
        is ResumePhase.Failed -> "Couldn't reach Hayame" to phase.message
    }
    CheckoutStepCard {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier.size(38.dp).background(colors.brandLight, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                when (phase) {
                    ResumePhase.Verifying -> CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp, color = colors.brandBlue)
                    is ResumePhase.Ready -> Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = colors.success)
                    is ResumePhase.Blocked -> Icon(Icons.Outlined.WarningAmber, contentDescription = null, tint = colors.warning)
                    is ResumePhase.Failed -> Icon(Icons.Outlined.WifiOff, contentDescription = null, tint = colors.danger)
                }
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = colors.mutedText)
            }
        }
        Spacer(modifier = Modifier.height(4.dp))
        checkTitles.forEachIndexed { index, label ->
            val state = when {
                failedIndex != null && index == failedIndex -> CheckRowState.FAILED
                failedIndex != null && index > failedIndex -> CheckRowState.SKIPPED
                phase is ResumePhase.Failed && index >= checksCompleted -> CheckRowState.SKIPPED
                index < checksCompleted -> CheckRowState.PASSED
                else -> CheckRowState.PENDING
            }
            val detail = if (state == CheckRowState.FAILED) (phase as? ResumePhase.Blocked)?.checkout?.issues?.firstOrNull()?.message else null
            VerificationRow(label = label, state = state, detail = detail)
        }
    }
}

@Composable
private fun VerificationRow(label: String, state: CheckRowState, detail: String?) {
    val colors = LocalHayameColors.current
    val fill = when (state) {
        CheckRowState.PASSED -> colors.success
        CheckRowState.FAILED -> colors.danger
        else -> colors.fieldBackground
    }
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top, modifier = Modifier.padding(vertical = 4.dp)) {
        Box(
            modifier = Modifier
                .size(26.dp)
                .background(fill, CircleShape)
                .then(if (state == CheckRowState.PENDING) Modifier.border(1.5.dp, colors.controlStroke, CircleShape) else Modifier),
            contentAlignment = Alignment.Center,
        ) {
            val marked = state == CheckRowState.PASSED || state == CheckRowState.FAILED
            val markScale by animateFloatAsState(if (marked) 1f else 0.4f, tween(220, easing = FastOutSlowInEasing), label = "mark-scale")
            val markAlpha by animateFloatAsState(if (marked) 1f else 0f, tween(180), label = "mark-alpha")
            if (marked || markAlpha > 0.01f) {
                Icon(
                    if (state == CheckRowState.FAILED) Icons.Filled.Close else Icons.Filled.Check,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(14.dp).graphicsLayer { scaleX = markScale; scaleY = markScale; alpha = markAlpha },
                )
            }
            if (state == CheckRowState.SKIPPED) {
                Box(modifier = Modifier.width(10.dp).height(2.dp).background(colors.mutedText, RoundedCornerShape(1.dp)))
            }
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                label,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = if (state == CheckRowState.SKIPPED) colors.mutedText else colors.brandNavy,
            )
            if (!detail.isNullOrBlank()) {
                Text(detail, style = MaterialTheme.typography.bodySmall, color = colors.danger)
            }
        }
    }
}

@Composable
private fun ListingCard(checkout: PendingCheckoutDto, showHold: Boolean) {
    val colors = LocalHayameColors.current
    val start = parseApiDate(checkout.startDate) ?: LocalDate.now()
    val end = parseApiDate(checkout.endDate) ?: start.plusDays(1)
    CheckoutStepCard {
        Row(horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.Top) {
            CheckoutThumbnail(imageUrl = resolveAppImage(checkout.car?.imageUrl), width = 86.dp, height = 72.dp)
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                Text(
                    checkout.car?.title?.trim().takeUnless { it.isNullOrBlank() } ?: "Hayame listing",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = colors.brandNavy,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(checkoutDateRangeLabel(start, end), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = colors.brandBlue)
                Text(
                    "${checkout.nightCount} day${if (checkout.nightCount == 1) "" else "s"} • ${if (checkout.isDelivery) "Delivery" else "Pickup"}",
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.mutedText,
                )
                if (showHold) {
                    val expiry = remember(checkout.holdExpiresAt) { parseHoldExpiry(checkout.holdExpiresAt) }
                    if (expiry != null) {
                        val remaining = rememberCountdownSeconds(expiry)
                        StatusChip(
                            text = if (remaining > 0) "Held for you ${formatCountdown(remaining)}" else "Hold ended",
                            tint = when {
                                remaining <= 0 -> colors.mutedText
                                remaining < 120 -> colors.warning
                                else -> colors.success
                            },
                            icon = Icons.Outlined.Timer,
                            live = remaining > 0,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TripSummaryCard(checkout: PendingCheckoutDto) {
    val colors = LocalHayameColors.current
    val tripUse = listOf(checkout.tripUseAddress, checkout.tripUseCity, checkout.tripUseRegion)
        .mapNotNull { it?.trim()?.takeIf { value -> value.isNotBlank() } }
        .joinToString(", ")
    CheckoutStepCard {
        Text("Trip summary", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
        InfoLine(label = "Trip mode", value = if (checkout.isDelivery) "Delivery" else "Pickup")
        InfoLine(label = "Trip use area", value = tripUse.ifBlank { "Not provided" })
        if (checkout.isDelivery) {
            InfoLine(label = "Delivery address", value = checkout.deliveryAddress.orEmpty())
            checkout.deliveryTime?.takeIf { it.isNotBlank() }?.let { InfoLine(label = "Delivery time", value = it) }
            checkout.contactPhone?.takeIf { it.isNotBlank() }?.let { InfoLine(label = "Contact phone", value = it) }
        }
    }
}

@Composable
private fun PriceBreakdownCard(checkout: PendingCheckoutDto) {
    val colors = LocalHayameColors.current
    val pricing = checkout.pricing
    fun amount(value: Double?): String = "GHS ${(value ?: 0.0).roundToInt()}"
    CheckoutStepCard {
        Text("Price breakdown", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
        InfoLine(label = "Daily rate × ${checkout.nightCount}", value = amount(pricing?.subtotal))
        InfoLine(label = "Insurance", value = amount(pricing?.insuranceFee))
        InfoLine(label = "Service fee", value = amount(pricing?.platformFee))
        if (checkout.isDelivery) InfoLine(label = "Delivery", value = amount(pricing?.deliveryFee))
        if ((pricing?.outsideAccraSurcharge ?: 0.0) > 0) InfoLine(label = "Outside region fee", value = amount(pricing?.outsideAccraSurcharge))
        InfoLine(label = "Deposit", value = amount(pricing?.depositAmount))
        HorizontalDivider(color = colors.border)
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.Bottom) {
            Text("Total", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
            Spacer(modifier = Modifier.weight(1f))
            Text("GHS ${checkout.totalAmount}", style = MaterialTheme.typography.headlineMedium.copy(fontSize = 28.sp), fontWeight = FontWeight.ExtraBold, color = colors.brandBlue)
        }
        Text(
            "Confirmed by the server just now. This is the exact amount Paystack will charge.",
            style = MaterialTheme.typography.bodySmall,
            color = colors.mutedText,
        )
    }
}

// MARK: Helpers ----------------------------------------------------------------------------------

private fun resumableDates(resumable: ResumableCheckoutUi): Pair<LocalDate, LocalDate> {
    val (rawStart, rawEnd) = when (resumable) {
        is ResumableCheckoutUi.Held -> resumable.checkout.startDate to resumable.checkout.endDate
        is ResumableCheckoutUi.Draft -> resumable.draft.startDate to resumable.draft.endDate
    }
    val start = parseApiDate(rawStart) ?: LocalDate.now()
    val end = parseApiDate(rawEnd)?.takeIf { it.isAfter(start) } ?: start.plusDays(1)
    return start to end
}

private fun checkoutDateRangeLabel(start: LocalDate, end: LocalDate): String {
    val short = DateTimeFormatter.ofPattern("d MMM")
    val long = DateTimeFormatter.ofPattern("d MMM yyyy")
    return "${start.format(short)} – ${if (start.year == end.year) end.format(short) else end.format(long)}"
}

private fun parseHoldExpiry(raw: String?): Long? {
    if (raw.isNullOrBlank()) return null
    return runCatching { OffsetDateTime.parse(raw).toInstant().toEpochMilli() }.getOrNull()
}

private fun formatCountdown(seconds: Int): String = "%d:%02d".format(seconds / 60, seconds % 60)

@Composable
private fun rememberCountdownSeconds(expiryMillis: Long): Int {
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(expiryMillis) {
        while (true) {
            now = System.currentTimeMillis()
            if (now >= expiryMillis) break
            delay(1_000)
        }
    }
    return ((expiryMillis - now) / 1_000L).toInt().coerceAtLeast(0)
}

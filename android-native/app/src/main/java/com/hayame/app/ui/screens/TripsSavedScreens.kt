package com.hayame.app.ui.screens

import com.hayame.app.ui.components.HayameRefreshBox
import com.hayame.app.ui.components.coachTarget
import com.hayame.app.ui.components.CoachTour
import com.hayame.app.ui.components.CoachStep
import android.content.Context
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.outlined.Bolt
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.ChatBubble
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.DirectionsCar
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.LocalOffer
import androidx.compose.material.icons.outlined.Map
import androidx.compose.material.icons.outlined.Nightlight
import androidx.compose.material.icons.outlined.Place
import androidx.compose.material.icons.outlined.Replay
import androidx.compose.material.icons.outlined.ReportProblem
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.AlertDialog
import androidx.compose.material.icons.filled.Check
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.DropdownMenu
import androidx.compose.material.icons.outlined.LocalShipping
import androidx.compose.material.icons.outlined.SwapVert
import androidx.compose.material.icons.outlined.FilterList
import androidx.compose.foundation.horizontalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.hayame.app.core.network.BookingDto
import com.hayame.app.core.network.CarDto
import com.hayame.app.ui.components.ErrorBlock
import com.hayame.app.ui.components.HayameShimmerBlock
import com.hayame.app.ui.navigation.MainTab
import com.hayame.app.ui.navigation.NavRoutes
import com.hayame.app.ui.state.UiState
import com.hayame.app.ui.theme.LocalHayameColors
import com.hayame.app.ui.theme.LocalDarkMode
import com.hayame.app.ui.viewmodel.AppViewModel
import kotlinx.coroutines.delay
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import kotlin.math.roundToInt

// MARK: Trips ------------------------------------------------------------------------------------
//
// The Trips tab leads with the renter's next trip as a branded hero (countdown, journey rail,
// one-tap message), then the rest of the upcoming and past trips as compact cards with a details
// drawer. Everything settles in with a stagger, loading shows shaped skeletons, and the
// Upcoming / Past switch slides a pill between the two.

private const val SavedLayoutPrefsName = "hayame_saved_layout"
private const val SavedLayoutPrefsKey = "layout"

@Composable
internal fun TripsTab(
    viewModel: AppViewModel,
    paddingValues: PaddingValues,
    onOpenHostVehicles: () -> Unit,
    onOpenCarDetail: (String) -> Unit,
    onOpenConversation: (String) -> Unit,
    onResumeCheckout: (ResumableCheckoutUi) -> Unit = {},
) {
    CoachTour(
        id = "trips",
        steps = listOf(
            CoachStep("trips.segment", "Upcoming and past", "Switch between trips ahead and trips you've taken."),
            CoachStep("trips.card", "Everything for your trip", "Message the host, see details or report a problem from here."),
        ),
    )
    val colors = LocalHayameColors.current
    val bookingsState by viewModel.bookingsState.collectAsState()
    val carsState by viewModel.carsState.collectAsState()
    val pendingBookingFocus by viewModel.pendingBookingFocus.collectAsState()
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val me by viewModel.me.collectAsState()
    val resumableCheckout = rememberResumableCheckout(viewModel)
    val listState = rememberLazyListState()
    var segment by rememberSaveable { mutableIntStateOf(0) }
    var disputeTarget by remember { mutableStateOf<BookingDto?>(null) }
    var highlightedId by remember { mutableStateOf<String?>(null) }

    val knownCars = (carsState as? UiState.Success<List<CarDto>>)?.data.orEmpty()
    val carsById = remember(knownCars) { knownCars.associateBy { it.id } }
    val guestTrips = (bookingsState as? UiState.Success<List<BookingDto>>)
        ?.data
        .orEmpty()
        .filter {
            !it.role.orEmpty().contains("owner", ignoreCase = true) &&
                it.payment_status.equals("paid", ignoreCase = true)
        }
    val today = LocalDate.now()
    val upcoming = guestTrips
        .filter { (parseApiDate(it.end_date) ?: today) >= today }
        .sortedWith(compareBy<BookingDto> { parseApiDate(it.start_date) ?: today }.thenByDescending { it.created_at.orEmpty() })
    val past = guestTrips
        .filter { (parseApiDate(it.end_date) ?: today) < today }
        .sortedByDescending { it.created_at.orEmpty() }
    val nextTrip = upcoming.firstOrNull()
    val otherUpcoming = upcoming.drop(1)
    val isLoading = bookingsState is UiState.Loading || bookingsState is UiState.Idle
    val subtitle = when {
        !isAuthenticated -> "Your bookings, past and present."
        isLoading -> "Your bookings, past and present."
        upcoming.isEmpty() && past.isEmpty() -> "Your bookings will appear here after payment."
        else -> "${upcoming.size} upcoming • ${past.size} past"
    }

    LaunchedEffect(Unit) {
        viewModel.loadBookings()
        viewModel.refreshSavedCheckout()
        if (knownCars.isEmpty()) {
            viewModel.loadCars(mapOf("limit" to "100"))
        }
    }

    LaunchedEffect(pendingBookingFocus, guestTrips) {
        val bookingId = pendingBookingFocus ?: return@LaunchedEffect
        val booking = guestTrips.firstOrNull { it.id == bookingId } ?: return@LaunchedEffect
        val targetSegment = if ((parseApiDate(booking.end_date) ?: today) < today) 1 else 0
        segment = targetSegment
        highlightedId = bookingId
        delay(350)
        val key = if (targetSegment == 0) "upcoming-$bookingId" else "past-$bookingId"
        val index = listState.layoutInfo.totalItemsCount.takeIf { it > 0 }?.let {
            (0 until it).firstOrNull { position -> listState.layoutInfo.visibleItemsInfo.any { info -> info.index == position && info.key == key } }
        }
        if (index != null) listState.animateScrollToItem(index)
        viewModel.consumePendingBookingFocus(bookingId)
    }

    HayameRefreshBox(
        onRefresh = { viewModel.loadBookings(); viewModel.refreshSavedCheckout(force = true); viewModel.loadCars(mapOf("limit" to "100")) },
        modifier = Modifier.fillMaxSize(),
        indicatorTopPadding = paddingValues.calculateTopPadding(),
    ) {
    LazyColumn(
            state = listState,
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            item(key = "trips-header") {
                Spacer(modifier = Modifier.height(16.dp))
                StaggeredAppear(index = 0) { TabHeader(title = "Trips", subtitle = subtitle) }
            }
            if (resumableCheckout != null) {
                item(key = "resume-checkout") {
                    ResumeCheckoutCard(
                        resumable = resumableCheckout,
                        viewModel = viewModel,
                        onResume = { onResumeCheckout(resumableCheckout) },
                        index = 1,
                    )
                }
            }
            when (val state = bookingsState) {
                is UiState.Error -> item(key = "trips-error") {
                    StaggeredAppear(index = 1) { ErrorBlock(state.message, onRetry = { viewModel.loadBookings() }) }
                }
                UiState.Loading, UiState.Idle -> {
                    if (!isAuthenticated) {
                        item(key = "trips-guest") {
                            StaggeredAppear(index = 1) {
                                GuestGateCard(
                                    title = "Log in to see your trips",
                                    message = "Your bookings, pickup countdowns and host chats live here once you sign in.",
                                    icon = Icons.Outlined.CalendarMonth,
                                    actionTitle = "Log in",
                                    onClick = { viewModel.requireAuthentication("Sign in or sign up to view your trips.", NavRoutes.main(MainTab.TRIPS)) },
                                )
                            }
                        }
                    } else {
                        item(key = "trips-skeleton-hero") { StaggeredAppear(index = 1) { TripHeroSkeleton() } }
                        item(key = "trips-skeleton-1") { StaggeredAppear(index = 2) { TripCardSkeleton() } }
                        item(key = "trips-skeleton-2") { StaggeredAppear(index = 3) { TripCardSkeleton() } }
                    }
                }
                UiState.Empty, is UiState.Success -> {
                    if (!isAuthenticated) {
                        item(key = "trips-guest") {
                            StaggeredAppear(index = 1) {
                                GuestGateCard(
                                    title = "Log in to see your trips",
                                    message = "Your bookings, pickup countdowns and host chats live here once you sign in.",
                                    icon = Icons.Outlined.CalendarMonth,
                                    actionTitle = "Log in",
                                    onClick = { viewModel.requireAuthentication("Sign in or sign up to view your trips.", NavRoutes.main(MainTab.TRIPS)) },
                                )
                            }
                        }
                    } else {
                        item(key = "trips-segments") {
                            StaggeredAppear(index = 1, modifier = Modifier.coachTarget("trips.segment")) {
                                TripsSegmentControl(
                                    selected = segment,
                                    upcomingCount = upcoming.size,
                                    pastCount = past.size,
                                    onSelect = { segment = it },
                                )
                            }
                        }
                        if (segment == 0) {
                            if (nextTrip == null) {
                                item(key = "upcoming-empty") {
                                    StaggeredAppear(index = 0) {
                                        TripsEmptyCard(
                                            title = "No upcoming trips",
                                            message = "Find a car you like and your next trip will show up here with a live countdown.",
                                            icon = Icons.Outlined.DirectionsCar,
                                            actionTitle = "Explore cars",
                                            onClick = { viewModel.requestMainTab(MainTab.EXPLORE) },
                                        )
                                    }
                                }
                            } else {
                                item(key = "upcoming-${nextTrip.id}") {
                                    StaggeredAppear(index = 0, modifier = Modifier.coachTarget("trips.card")) {
                                        NextTripHeroCard(
                                            booking = nextTrip,
                                            car = carsById[nextTrip.car_id.orEmpty()],
                                            highlighted = highlightedId == nextTrip.id,
                                            onOpenCar = onOpenCarDetail,
                                            onMessage = { messageHostForTrip(viewModel, nextTrip, me, onOpenConversation) },
                                            onDispute = { disputeTarget = nextTrip },
                                        )
                                    }
                                }
                                if (otherUpcoming.isNotEmpty()) {
                                    item(key = "upcoming-title") {
                                        StaggeredAppear(index = 1) { TripsSectionTitle("Also coming up", otherUpcoming.size) }
                                    }
                                    items(otherUpcoming, key = { "upcoming-${it.id}" }) { booking ->
                                        val index = otherUpcoming.indexOf(booking) + 2
                                        StaggeredAppear(index = index) {
                                            TripCard(
                                                booking = booking,
                                                car = carsById[booking.car_id.orEmpty()],
                                                isPast = false,
                                                highlighted = highlightedId == booking.id,
                                                onOpenCar = onOpenCarDetail,
                                                onMessage = { messageHostForTrip(viewModel, booking, me, onOpenConversation) },
                                                onDispute = { disputeTarget = booking },
                                            )
                                        }
                                    }
                                }
                            }
                        } else {
                            if (past.isEmpty()) {
                                item(key = "past-empty") {
                                    StaggeredAppear(index = 0) {
                                        TripsEmptyCard(
                                            title = "No past trips yet",
                                            message = "Completed trips land here so you can book the same car again in a tap.",
                                            icon = Icons.Outlined.History,
                                            actionTitle = "Explore cars",
                                            onClick = { viewModel.requestMainTab(MainTab.EXPLORE) },
                                        )
                                    }
                                }
                            } else {
                                items(past, key = { "past-${it.id}" }) { booking ->
                                    StaggeredAppear(index = past.indexOf(booking)) {
                                        TripCard(
                                            booking = booking,
                                            car = carsById[booking.car_id.orEmpty()],
                                            isPast = true,
                                            highlighted = highlightedId == booking.id,
                                            onOpenCar = onOpenCarDetail,
                                            onMessage = { messageHostForTrip(viewModel, booking, me, onOpenConversation) },
                                            onDispute = { disputeTarget = booking },
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
            item(key = "trips-footer") { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }

    disputeTarget?.let { booking ->
        TripDisputeDialog(
            booking = booking,
            onDismiss = { disputeTarget = null },
            onSubmit = { reason ->
                viewModel.createDispute(booking.id, reason)
                disputeTarget = null
            },
        )
    }
    // Host vehicles shortcut is reachable from the profile; kept for callers.
    @Suppress("UNUSED_EXPRESSION") onOpenHostVehicles
    @Suppress("UNUSED_EXPRESSION") colors
}

@Composable
internal fun TabHeader(title: String, subtitle: String, trailing: @Composable () -> Unit = {}) {
    val colors = LocalHayameColors.current
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(title, fontSize = 30.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy)
            Text(subtitle, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = colors.mutedText)
        }
        trailing()
    }
}

@Composable
private fun TripsSegmentControl(selected: Int, upcomingCount: Int, pastCount: Int, onSelect: (Int) -> Unit) {
    val colors = LocalHayameColors.current
    BoxWithConstraints(
        modifier = Modifier
            .fillMaxWidth()
            .clip(CircleShape)
            .background(colors.cardBackground)
            .border(1.dp, colors.border, CircleShape)
            .padding(4.dp),
    ) {
        val segmentWidth = (maxWidth - 4.dp) / 2
        val pillOffset by animateFloatAsState(if (selected == 0) 0f else 1f, tween(280, easing = FastOutSlowInEasing), label = "segment-pill")
        Box(
            modifier = Modifier
                .offset(x = segmentWidth * pillOffset + 2.dp * pillOffset)
                .width(segmentWidth)
                .height(40.dp)
                .background(Brush.horizontalGradient(listOf(colors.brandBlue, colors.primaryButtonEnd)), CircleShape),
        )
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            listOf("Upcoming" to upcomingCount, "Past" to pastCount).forEachIndexed { index, (label, count) ->
                val active = index == selected
                Row(
                    modifier = Modifier
                        .weight(1f)
                        .height(40.dp)
                        .clip(CircleShape)
                        .clickable { onSelect(index) },
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(label, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = if (active) Color.White else colors.brandNavy)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        "$count",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = if (active) Color.White else colors.brandNavy,
                        modifier = Modifier
                            .background(if (active) Color.White.copy(alpha = 0.22f) else colors.subtleFill, CircleShape)
                            .padding(horizontal = 7.dp, vertical = 2.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun TripsSectionTitle(title: String, count: Int) {
    val colors = LocalHayameColors.current
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 4.dp)) {
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
        if (count > 0) {
            Text(
                "$count",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = colors.brandBlue,
                modifier = Modifier.background(colors.brandBlue.copy(alpha = 0.12f), CircleShape).padding(horizontal = 7.dp, vertical = 2.dp),
            )
        }
    }
}

// MARK: Trip models ------------------------------------------------------------------------------

private data class TripJourney(
    val completed: Int,
    val progress: Float,
    val caption: String?,
    val accentIsSuccess: Boolean,
    val accentIsWarning: Boolean,
    val accentIsDanger: Boolean,
    val showsMarker: Boolean,
)

private fun tripJourney(booking: BookingDto, status: BookingDisplayStatus, today: LocalDate): TripJourney {
    val start = parseApiDate(booking.start_date)
    val end = parseApiDate(booking.end_date)
    val created = booking.created_at?.take(10)?.let { parseApiDate(it) }
    fun fraction(from: LocalDate?, to: LocalDate?): Float {
        if (from == null || to == null) return 0.5f
        val total = ChronoUnit.DAYS.between(from, to).toFloat()
        if (total <= 0f) return 1f
        return (ChronoUnit.DAYS.between(from, today).toFloat() / total).coerceIn(0f, 1f)
    }
    return when (status) {
        BookingDisplayStatus.Pending -> TripJourney(1, 0.5f, "Awaiting host", false, true, false, true)
        BookingDisplayStatus.Confirmed -> TripJourney(2, fraction(created ?: today.minusDays(1), start), "Pickup ${relativeDayLabel(start, today)}", false, false, false, true)
        BookingDisplayStatus.Ongoing -> TripJourney(3, fraction(start, end), "Return ${relativeDayLabel(end, today)}", true, false, false, true)
        BookingDisplayStatus.Completed -> TripJourney(4, 1f, null, false, false, false, false)
        BookingDisplayStatus.Cancelled, BookingDisplayStatus.Rejected, BookingDisplayStatus.Refunded -> TripJourney(1, 0f, null, false, false, true, false)
    }
}

private fun relativeDayLabel(target: LocalDate?, today: LocalDate): String {
    if (target == null) return "soon"
    val days = ChronoUnit.DAYS.between(today, target)
    return when {
        days <= 0L -> "today"
        days == 1L -> "tomorrow"
        else -> "in $days days"
    }
}

private fun tripDateLabel(raw: String?): String {
    val date = parseApiDate(raw) ?: return raw ?: "-"
    return date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
}

private fun tripModeLabel(booking: BookingDto): String =
    if (!booking.delivery_address.isNullOrBlank() || (booking.delivery_fee ?: 0.0) > 0.0) "Delivery" else "Pickup"

private fun tripUseLabel(booking: BookingDto): String =
    listOf(booking.trip_use_address, booking.trip_use_city, booking.trip_use_region)
        .mapNotNull { it?.trim()?.takeIf(String::isNotBlank) }
        .joinToString(", ")
        .ifBlank { "Not provided" }

private fun tripSubtitle(booking: BookingDto): String {
    val host = booking.cars?.owner?.full_name?.trim().orEmpty()
    val hostLine = if (host.isNotBlank() && !host.equals("Host", ignoreCase = true)) "Hosted by $host" else ""
    val location = listOf(booking.trip_use_city, booking.trip_use_region)
        .mapNotNull { it?.trim()?.takeIf(String::isNotBlank) }
        .joinToString(", ")
    return listOf(hostLine, location).filter { it.isNotBlank() }.joinToString(" • ")
}

private fun tripImageUrl(booking: BookingDto, car: CarDto?): String? =
    resolveAppImage(car?.image_url)
        ?: car?.car_photos.orEmpty().firstNotNullOfOrNull { resolveAppImage(it.url) }
        ?: resolveAppImage(booking.cars?.image_url)
        ?: booking.cars?.car_photos.orEmpty().firstNotNullOfOrNull { resolveAppImage(it.url) }

private fun tripTitle(booking: BookingDto, car: CarDto?): String =
    booking.cars?.title?.trim()?.takeIf { it.isNotBlank() }
        ?: car?.title?.trim()?.takeIf { it.isNotBlank() }
        ?: "Trip with Hayame"

// MARK: Next trip hero -----------------------------------------------------------------------------

@Composable
private fun NextTripHeroCard(
    booking: BookingDto,
    car: CarDto?,
    highlighted: Boolean,
    onOpenCar: (String) -> Unit,
    onMessage: () -> Unit,
    onDispute: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val today = LocalDate.now()
    val status = resolveBookingDisplayStatus(booking.status, booking.start_date, booking.end_date)
    val journey = remember(booking.id, status, today) { tripJourney(booking, status, today) }
    var showDetails by remember { mutableStateOf(false) }
    val carId = booking.car_id?.trim()?.takeIf { it.isNotBlank() } ?: car?.id.orEmpty()
    val eyebrow = when (status) {
        BookingDisplayStatus.Ongoing -> "TRIP IN PROGRESS"
        BookingDisplayStatus.Pending -> "AWAITING HOST"
        else -> "NEXT TRIP"
    }
    val hostName = booking.cars?.owner?.full_name?.trim().takeUnless { it.isNullOrBlank() } ?: "the host"
    val countdownTitle = when (status) {
        BookingDisplayStatus.Pending -> "Waiting for $hostName"
        BookingDisplayStatus.Ongoing -> "Return ${relativeDayLabel(parseApiDate(booking.end_date), today)}"
        BookingDisplayStatus.Confirmed -> "Pickup ${relativeDayLabel(parseApiDate(booking.start_date), today)}"
        else -> status.label
    }
    val countdownCaption = when (status) {
        BookingDisplayStatus.Pending -> "We'll notify you the moment they respond."
        BookingDisplayStatus.Ongoing -> "Ends ${tripDateLabel(booking.end_date)}"
        BookingDisplayStatus.Confirmed -> "Starts ${tripDateLabel(booking.start_date)}"
        else -> bookingHelperText(status, BookingDisplayRole.Renter, booking.payment_status)
    }
    val progress by animateFloatAsState(journey.progress, tween(800, easing = FastOutSlowInEasing), label = "hero-progress")

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(16.dp, RoundedCornerShape(26.dp), ambientColor = colors.brandBlue.copy(alpha = 0.2f), spotColor = colors.brandBlue.copy(alpha = 0.2f))
            .clip(RoundedCornerShape(26.dp))
            .background(colors.cardBackground)
            .border(if (highlighted) 2.dp else 1.dp, if (highlighted) colors.brandBlue else colors.border, RoundedCornerShape(26.dp)),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.linearGradient(listOf(colors.heroStart, colors.heroEnd)))
                .background(Brush.radialGradient(listOf(colors.heroHighlight, Color.Transparent), radius = 560f)),
        ) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(eyebrow, style = MaterialTheme.typography.labelLarge, letterSpacing = 0.8.sp, color = Color.White.copy(alpha = 0.78f), modifier = Modifier.weight(1f))
                    HeroStatusPill(text = status.label, live = status == BookingDisplayStatus.Pending || status == BookingDisplayStatus.Ongoing)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.Top) {
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                        Text(tripTitle(booking, car), fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White, maxLines = 2, overflow = TextOverflow.Ellipsis)
                        Text("${tripDateLabel(booking.start_date)} – ${tripDateLabel(booking.end_date)}", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = Color.White.copy(alpha = 0.9f))
                        tripSubtitle(booking).takeIf { it.isNotBlank() }?.let {
                            Text(it, style = MaterialTheme.typography.bodySmall, color = Color.White.copy(alpha = 0.75f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                    }
                    TripThumbnail(
                        imageUrl = tripImageUrl(booking, car),
                        width = 96.dp,
                        height = 76.dp,
                        cornerRadius = 16.dp,
                        modifier = Modifier
                            .border(1.dp, Color.White.copy(alpha = 0.45f), RoundedCornerShape(16.dp))
                            .clickable(enabled = carId.isNotBlank()) { onOpenCar(carId) },
                    )
                }
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(countdownTitle, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Box(modifier = Modifier.fillMaxWidth().height(5.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.25f))) {
                        Box(modifier = Modifier.fillMaxWidth(progress.coerceIn(0.02f, 1f)).height(5.dp).background(Color.White, CircleShape))
                    }
                    Text(countdownCaption, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold, color = Color.White.copy(alpha = 0.8f))
                }
            }
        }

        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            TripJourneyRail(journey = journey.copy(caption = null))

            AnimatedVisibility(visible = showDetails, enter = fadeIn() + expandVertically(), exit = fadeOut() + shrinkVertically()) {
                TripDetailsGrid(booking)
            }

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                Button(
                    onClick = onMessage,
                    modifier = Modifier.weight(1f).height(44.dp),
                    shape = CircleShape,
                    colors = ButtonDefaults.buttonColors(containerColor = colors.brandBlue, contentColor = Color.White),
                ) {
                    Icon(Icons.Outlined.ChatBubble, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Message host", fontWeight = FontWeight.Bold)
                }
                Surface(
                    onClick = { showDetails = !showDetails },
                    shape = CircleShape,
                    color = colors.brandLight,
                    modifier = Modifier.height(44.dp),
                ) {
                    Row(modifier = Modifier.padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(if (showDetails) "Hide" else "Details", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                        val rotation by animateFloatAsState(if (showDetails) 180f else 0f, tween(220), label = "hero-chevron")
                        Icon(Icons.Outlined.ExpandMore, contentDescription = null, tint = colors.brandNavy, modifier = Modifier.size(18.dp).graphicsLayer { rotationZ = rotation })
                    }
                }
                if (booking.payment_status.equals("paid", ignoreCase = true)) {
                    Surface(onClick = onDispute, shape = CircleShape, color = colors.fieldBackground, modifier = Modifier.size(44.dp)) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(Icons.Outlined.ReportProblem, contentDescription = "Open dispute", tint = colors.mutedText, modifier = Modifier.size(18.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun HeroStatusPill(text: String, live: Boolean) {
    val pulse = rememberInfiniteTransition(label = "hero-pill")
    val scale by pulse.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.25f,
        animationSpec = infiniteRepeatable(tween(900, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "hero-pill-dot",
    )
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        modifier = Modifier
            .background(Color.White.copy(alpha = 0.2f), CircleShape)
            .border(1.dp, Color.White.copy(alpha = 0.3f), CircleShape)
            .padding(horizontal = 10.dp, vertical = 6.dp),
    ) {
        Box(modifier = Modifier.size(7.dp).graphicsLayer { if (live) { scaleX = scale; scaleY = scale } }.background(Color.White, CircleShape))
        Text(text, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = Color.White)
    }
}

/** Requested → Confirmed → Pickup → Return, with a car marker travelling toward the next stop. */
@Composable
private fun TripJourneyRail(journey: TripJourney) {
    val colors = LocalHayameColors.current
    val accent = when {
        journey.accentIsDanger -> colors.danger
        journey.accentIsWarning -> colors.warning
        journey.accentIsSuccess -> colors.success
        else -> colors.brandBlue
    }
    val titles = listOf("Requested", "Confirmed", "Pickup", "Return")
    val progress by animateFloatAsState(journey.progress, tween(800, easing = FastOutSlowInEasing), label = "rail-progress")
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        journey.caption?.let {
            Text(it, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = accent, modifier = Modifier.fillMaxWidth(), textAlign = androidx.compose.ui.text.style.TextAlign.Center)
        }
        BoxWithConstraints(modifier = Modifier.fillMaxWidth().height(44.dp)) {
            val widthPx = constraints.maxWidth.toFloat()
            val inset = with(androidx.compose.ui.platform.LocalDensity.current) { 15.dp.toPx() }
            val spacing = (widthPx - inset * 2) / (titles.size - 1)
            val centers = titles.indices.map { inset + it * spacing }
            val from = (journey.completed - 1).coerceIn(0, titles.size - 1)
            val to = journey.completed.coerceIn(0, titles.size - 1)
            val markerX = centers[from] + (centers[to] - centers[from]) * (if (journey.completed >= titles.size) 1f else progress)
            val lineY = with(androidx.compose.ui.platform.LocalDensity.current) { 30.dp.toPx() }
            val nodeRadius = with(androidx.compose.ui.platform.LocalDensity.current) { 7.dp.toPx() }
            val track = colors.controlStroke
            val cardBackground = colors.cardBackground
            Canvas(modifier = Modifier.fillMaxSize()) {
                for (segment in 0 until titles.size - 1) {
                    val done = segment < journey.completed
                    drawLine(
                        color = if (done) accent else track,
                        start = Offset(centers[segment] + nodeRadius, lineY),
                        end = Offset(centers[segment + 1] - nodeRadius, lineY),
                        strokeWidth = 2.dp.toPx(),
                        cap = StrokeCap.Round,
                        pathEffect = PathEffect.dashPathEffect(floatArrayOf(4f, 10f)),
                    )
                }
                titles.indices.forEach { index ->
                    val done = index < journey.completed
                    val current = index == journey.completed
                    drawCircle(color = if (done) accent else cardBackground, radius = nodeRadius, center = Offset(centers[index], lineY))
                    drawCircle(
                        color = if (done || current) accent else track,
                        radius = nodeRadius,
                        center = Offset(centers[index], lineY),
                        style = androidx.compose.ui.graphics.drawscope.Stroke(width = (if (current) 2.dp else 1.5.dp).toPx()),
                    )
                }
            }
            if (journey.showsMarker) {
                Box(
                    modifier = Modifier
                        .offset { androidx.compose.ui.unit.IntOffset((markerX - 15.dp.toPx()).roundToInt(), (lineY - 15.dp.toPx() - 14.dp.toPx()).roundToInt()) }
                        .size(30.dp)
                        .shadow(6.dp, CircleShape, ambientColor = accent.copy(alpha = 0.4f), spotColor = accent.copy(alpha = 0.4f))
                        .background(accent, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Outlined.DirectionsCar, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                }
            }
        }
        Row(modifier = Modifier.fillMaxWidth()) {
            titles.forEachIndexed { index, title ->
                Text(
                    title,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = if (index < journey.completed) colors.brandNavy else colors.mutedText,
                    modifier = Modifier.weight(1f),
                    textAlign = when (index) {
                        0 -> androidx.compose.ui.text.style.TextAlign.Start
                        titles.lastIndex -> androidx.compose.ui.text.style.TextAlign.End
                        else -> androidx.compose.ui.text.style.TextAlign.Center
                    },
                )
            }
        }
    }
}

@Composable
private fun TripDetailsGrid(booking: BookingDto) {
    val colors = LocalHayameColors.current
    val nights = parsedTripDays(booking.start_date, booking.end_date)
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            TripFact("Duration", "$nights night${if (nights == 1) "" else "s"}", Icons.Outlined.Nightlight, Modifier.weight(1f))
            TripFact("Trip mode", tripModeLabel(booking), Icons.Outlined.Place, Modifier.weight(1f))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            TripFact("Total paid", "GHS ${(booking.total_price ?: 0.0).roundToInt()}", Icons.Outlined.CreditCard, Modifier.weight(1f))
            TripFact("Trip use area", tripUseLabel(booking), Icons.Outlined.Map, Modifier.weight(1f))
        }
        booking.payment_reference?.takeIf { it.isNotBlank() }?.let {
            Text("Payment ref: $it", style = MaterialTheme.typography.labelMedium, color = colors.mutedText)
        }
        booking.rejection_reason?.takeIf { it.isNotBlank() }?.let {
            Text("Reason: $it", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold, color = colors.danger)
        }
    }
}

@Composable
private fun TripFact(label: String, value: String, icon: ImageVector, modifier: Modifier = Modifier) {
    val colors = LocalHayameColors.current
    Row(
        modifier = modifier.background(colors.fieldBackground, RoundedCornerShape(14.dp)).padding(10.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Box(modifier = Modifier.size(26.dp).background(colors.brandBlue.copy(alpha = 0.12f), RoundedCornerShape(8.dp)), contentAlignment = Alignment.Center) {
            Icon(icon, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(14.dp))
        }
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(label.uppercase(), style = MaterialTheme.typography.labelSmall, letterSpacing = 0.5.sp, color = colors.mutedText)
            Text(value, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy, maxLines = 2, overflow = TextOverflow.Ellipsis)
        }
    }
}

// MARK: Trip card ---------------------------------------------------------------------------------

@Composable
private fun TripCard(
    booking: BookingDto,
    car: CarDto?,
    isPast: Boolean,
    highlighted: Boolean,
    onOpenCar: (String) -> Unit,
    onMessage: () -> Unit,
    onDispute: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val today = LocalDate.now()
    val status = resolveBookingDisplayStatus(booking.status, booking.start_date, booking.end_date)
    val journey = remember(booking.id, status, today) { tripJourney(booking, status, today) }
    var showDetails by remember { mutableStateOf(false) }
    val carId = booking.car_id?.trim()?.takeIf { it.isNotBlank() } ?: car?.id.orEmpty()
    val nights = parsedTripDays(booking.start_date, booking.end_date)
    val canDispute = booking.payment_status.equals("paid", ignoreCase = true) &&
        status != BookingDisplayStatus.Cancelled && status != BookingDisplayStatus.Refunded

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(if (highlighted) 14.dp else 8.dp, RoundedCornerShape(22.dp), ambientColor = colors.cardShadow, spotColor = colors.cardShadow)
            .clip(RoundedCornerShape(22.dp))
            .background(colors.cardBackground)
            .border(if (highlighted) 2.dp else 1.dp, if (highlighted) colors.brandBlue else colors.border, RoundedCornerShape(22.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top) {
            TripThumbnail(
                imageUrl = tripImageUrl(booking, car),
                width = 84.dp,
                height = 68.dp,
                cornerRadius = 14.dp,
                modifier = Modifier.clickable(enabled = carId.isNotBlank()) { onOpenCar(carId) },
            )
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.Top) {
                    Text(tripTitle(booking, car), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy, maxLines = 2, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                    VehicleBrandLogo(title = tripBrandLogoTitle(car, booking), selected = false, modifier = Modifier.size(width = 34.dp, height = 24.dp))
                }
                tripSubtitle(booking).takeIf { it.isNotBlank() }?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, color = colors.mutedText, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    BookingStatusBadge(status = status)
                    Icon(Icons.Outlined.CalendarMonth, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(12.dp))
                    Text("${tripDateLabel(booking.start_date)} – ${tripDateLabel(booking.end_date)}", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = colors.brandBlue, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
        }

        if (!isPast) {
            TripJourneyRail(journey = journey)
        }

        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            TripMetric("$nights", if (nights == 1) "night" else "nights")
            TripMetric(tripModeLabel(booking), "handoff")
            Spacer(modifier = Modifier.weight(1f))
            Column(horizontalAlignment = Alignment.End) {
                Text("TOTAL", style = MaterialTheme.typography.labelSmall, color = colors.mutedText)
                Text("GHS ${(booking.total_price ?: 0.0).roundToInt()}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
            }
        }

        AnimatedVisibility(visible = showDetails, enter = fadeIn() + expandVertically(), exit = fadeOut() + shrinkVertically()) {
            TripDetailsGrid(booking)
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            TripActionChip("Message", Icons.Outlined.ChatBubble, prominent = !isPast, onClick = onMessage)
            if (isPast && carId.isNotBlank()) {
                TripActionChip("Book again", Icons.Outlined.Replay, prominent = true, onClick = { onOpenCar(carId) })
            }
            if (canDispute) {
                TripActionChip("Dispute", Icons.Outlined.ReportProblem, prominent = false, onClick = onDispute)
            }
            Spacer(modifier = Modifier.weight(1f))
            val rotation by animateFloatAsState(if (showDetails) 180f else 0f, tween(220), label = "card-chevron")
            Surface(onClick = { showDetails = !showDetails }, shape = CircleShape, color = colors.fieldBackground, modifier = Modifier.size(36.dp)) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(Icons.Outlined.ExpandMore, contentDescription = if (showDetails) "Hide details" else "Show details", tint = colors.brandNavy, modifier = Modifier.size(18.dp).graphicsLayer { rotationZ = rotation })
                }
            }
        }
    }
}

@Composable
private fun TripMetric(value: String, unit: String) {
    val colors = LocalHayameColors.current
    Column {
        Text(value, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
        Text(unit.uppercase(), style = MaterialTheme.typography.labelSmall, letterSpacing = 0.4.sp, color = colors.mutedText)
    }
}

@Composable
private fun TripActionChip(text: String, icon: ImageVector, prominent: Boolean, onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    Surface(onClick = onClick, shape = CircleShape, color = if (prominent) colors.brandBlue else colors.brandLight) {
        Row(modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Icon(icon, contentDescription = null, tint = if (prominent) Color.White else colors.brandNavy, modifier = Modifier.size(14.dp))
            Text(text, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = if (prominent) Color.White else colors.brandNavy)
        }
    }
}

@Composable
private fun TripThumbnail(imageUrl: String?, width: Dp, height: Dp, cornerRadius: Dp, modifier: Modifier = Modifier) {
    val colors = LocalHayameColors.current
    Box(
        modifier = modifier
            .size(width = width, height = height)
            .clip(RoundedCornerShape(cornerRadius))
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
private fun TripDisputeDialog(booking: BookingDto, onDismiss: () -> Unit, onSubmit: (String) -> Unit) {
    val colors = LocalHayameColors.current
    var reason by rememberSaveable(booking.id) { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = colors.cardBackground,
        title = { Text("Open a dispute", color = colors.brandNavy, fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("${tripTitle(booking, null)} • ${tripDateLabel(booking.start_date)} – ${tripDateLabel(booking.end_date)}", style = MaterialTheme.typography.bodySmall, color = colors.mutedText)
                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it.take(600) },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Tell us what went wrong") },
                    minLines = 3,
                    maxLines = 6,
                    shape = RoundedCornerShape(16.dp),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = colors.brandBlue, unfocusedBorderColor = colors.border),
                )
            }
        },
        confirmButton = {
            TextButton(onClick = { onSubmit(reason.trim()) }, enabled = reason.trim().length >= 5) {
                Text("Submit", color = colors.brandBlue, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel", color = colors.mutedText, fontWeight = FontWeight.Bold) }
        },
    )
}

// MARK: Trip states -------------------------------------------------------------------------------

@Composable
private fun TripHeroSkeleton() {
    val colors = LocalHayameColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(26.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(26.dp)),
    ) {
        Column(modifier = Modifier.fillMaxWidth().background(colors.brandLight).padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                HayameShimmerBlock(modifier = Modifier.size(width = 80.dp, height = 10.dp), cornerRadius = 5.dp)
                HayameShimmerBlock(modifier = Modifier.size(width = 78.dp, height = 24.dp), cornerRadius = 12.dp)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    HayameShimmerBlock(modifier = Modifier.size(width = 190.dp, height = 20.dp), cornerRadius = 8.dp)
                    HayameShimmerBlock(modifier = Modifier.size(width = 150.dp, height = 12.dp), cornerRadius = 6.dp)
                    HayameShimmerBlock(modifier = Modifier.size(width = 120.dp, height = 10.dp), cornerRadius = 5.dp)
                }
                HayameShimmerBlock(modifier = Modifier.size(width = 96.dp, height = 76.dp), cornerRadius = 16.dp)
            }
            HayameShimmerBlock(modifier = Modifier.size(width = 170.dp, height = 18.dp), cornerRadius = 8.dp)
            HayameShimmerBlock(modifier = Modifier.fillMaxWidth().height(5.dp), cornerRadius = 3.dp)
        }
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            HayameShimmerBlock(modifier = Modifier.fillMaxWidth().height(44.dp), cornerRadius = 10.dp)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                HayameShimmerBlock(modifier = Modifier.weight(1f).height(40.dp), cornerRadius = 20.dp)
                HayameShimmerBlock(modifier = Modifier.size(width = 110.dp, height = 40.dp), cornerRadius = 20.dp)
            }
        }
    }
}

@Composable
private fun TripCardSkeleton() {
    val colors = LocalHayameColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(22.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            HayameShimmerBlock(modifier = Modifier.size(width = 84.dp, height = 68.dp), cornerRadius = 14.dp)
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                HayameShimmerBlock(modifier = Modifier.size(width = 160.dp, height = 15.dp), cornerRadius = 6.dp)
                HayameShimmerBlock(modifier = Modifier.size(width = 120.dp, height = 11.dp), cornerRadius = 6.dp)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    HayameShimmerBlock(modifier = Modifier.size(width = 70.dp, height = 20.dp), cornerRadius = 10.dp)
                    HayameShimmerBlock(modifier = Modifier.size(width = 110.dp, height = 12.dp), cornerRadius = 6.dp)
                }
            }
        }
        HayameShimmerBlock(modifier = Modifier.fillMaxWidth().height(40.dp), cornerRadius = 10.dp)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HayameShimmerBlock(modifier = Modifier.size(width = 100.dp, height = 36.dp), cornerRadius = 18.dp)
            HayameShimmerBlock(modifier = Modifier.size(width = 90.dp, height = 36.dp), cornerRadius = 18.dp)
        }
    }
}

@Composable
private fun TripsEmptyCard(title: String, message: String, icon: ImageVector, actionTitle: String, onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    val ripple = rememberInfiniteTransition(label = "trips-empty")
    val ring by ripple.animateFloat(
        initialValue = 0.7f,
        targetValue = 1.7f,
        animationSpec = infiniteRepeatable(tween(2200, easing = LinearEasing), RepeatMode.Restart),
        label = "trips-empty-ring",
    )
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(24.dp))
            .padding(22.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(modifier = Modifier.size(120.dp), contentAlignment = Alignment.Center) {
            Box(
                modifier = Modifier
                    .size(96.dp)
                    .graphicsLayer { scaleX = ring; scaleY = ring; alpha = (1.7f - ring).coerceIn(0f, 1f) }
                    .border(1.5.dp, colors.brandBlue.copy(alpha = 0.3f), CircleShape),
            )
            Box(modifier = Modifier.size(96.dp).background(colors.brandLight, CircleShape), contentAlignment = Alignment.Center) {
                Icon(icon, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(40.dp))
            }
        }
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
        Text(message, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
        GradientPillButton(text = actionTitle, modifier = Modifier.fillMaxWidth(), onClick = onClick)
    }
}

/** Signed-out placeholder shared by Trips and Saved. */
@Composable
internal fun GuestGateCard(title: String, message: String, icon: ImageVector, actionTitle: String, onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(22.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            val darkMode = LocalDarkMode.current
            Box(
                modifier = Modifier.size(44.dp).then(
                    if (darkMode) Modifier.background(colors.brandBlue.copy(alpha = 0.16f), RoundedCornerShape(14.dp))
                    else Modifier.background(Brush.linearGradient(listOf(colors.brandBlue, colors.primaryButtonEnd)), RoundedCornerShape(14.dp)),
                ),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = null, tint = if (darkMode) colors.brandBlue else Color.White, modifier = Modifier.size(20.dp))
            }
            Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                Text(message, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
            }
        }
        GradientPillButton(text = actionTitle, modifier = Modifier.fillMaxWidth(), onClick = onClick)
    }
}

// MARK: Saved ------------------------------------------------------------------------------------
//
// Saved listings as a small gallery: a summary strip (how many, cheapest day rate, how many book
// instantly), a list/grid toggle, and cards whose heart pops and removes the card in place.

@Composable
internal fun SavedTab(
    viewModel: AppViewModel,
    paddingValues: PaddingValues,
    onOpenCarDetail: (String) -> Unit,
) {
    CoachTour(
        id = "saved",
        steps = listOf(
            CoachStep("saved.sort", "Sort your shortlist", "Order by price, rating or newest, and filter to instant book or delivery."),
            CoachStep("saved.layout", "Grid or list", "Switch how your saved cars are shown."),
        ),
    )
    val colors = LocalHayameColors.current
    val context = LocalContext.current
    val favoritesState by viewModel.favoritesState.collectAsState()
    val carsState by viewModel.carsState.collectAsState()
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val prefs = remember(context) { context.getSharedPreferences(SavedLayoutPrefsName, Context.MODE_PRIVATE) }
    var layoutName by rememberSaveable { mutableStateOf(prefs.getString(SavedLayoutPrefsKey, ExploreLayoutMode.GRID.name) ?: ExploreLayoutMode.GRID.name) }
    val layout = remember(layoutName) { runCatching { ExploreLayoutMode.valueOf(layoutName) }.getOrElse { ExploreLayoutMode.GRID } }

    LaunchedEffect(Unit) {
        viewModel.loadFavorites()
        viewModel.loadCars()
    }

    var sortName by rememberSaveable { mutableStateOf(prefs.getString(SavedSortPrefsKey, SavedSort.NEWEST.name) ?: SavedSort.NEWEST.name) }
    val sort = remember(sortName) { runCatching { SavedSort.valueOf(sortName) }.getOrElse { SavedSort.NEWEST } }
    var instantOnly by rememberSaveable { mutableStateOf(false) }
    var deliveryOnly by rememberSaveable { mutableStateOf(false) }

    val favoriteIds = (favoritesState as? UiState.Success<Set<String>>)?.data.orEmpty()
    val cars = (carsState as? UiState.Success<List<CarDto>>)?.data.orEmpty()
    // Everything the renter saved, before sorting and filters.
    val allSavedCars = remember(favoriteIds, cars) { cars.filter { it.id in favoriteIds } }
    // What the list shows: the saved cars after the sort and the toggles.
    val savedCars = remember(allSavedCars, sort, instantOnly, deliveryOnly) {
        var list = allSavedCars
        if (instantOnly) list = list.filter { it.instant_book == true }
        if (deliveryOnly) list = list.filter { it.delivery_available == true }
        when (sort) {
            SavedSort.NEWEST -> list.sortedByDescending { it.created_at.orEmpty() }
            SavedSort.PRICE_LOW -> list.sortedBy { it.daily_price ?: 0.0 }
            SavedSort.PRICE_HIGH -> list.sortedByDescending { it.daily_price ?: 0.0 }
            SavedSort.TOP_RATED -> list.sortedWith(compareByDescending<CarDto> { it.avg_rating ?: 0.0 }.thenByDescending { it.reviews_count ?: 0.0 })
        }
    }
    val isLoading = isAuthenticated && (favoritesState is UiState.Loading || favoritesState is UiState.Idle || (carsState is UiState.Loading && allSavedCars.isEmpty()))
    val prices = allSavedCars.map { (it.daily_price ?: 0.0).roundToInt() }
    val lowest = prices.minOrNull() ?: 0
    val highest = prices.maxOrNull() ?: 0
    val subtitle = when {
        !isAuthenticated -> "Your shortlist, synced to your account."
        isLoading -> "Gathering your shortlist..."
        allSavedCars.isEmpty() -> "Tap the heart on any listing to keep it here."
        lowest == highest -> "${allSavedCars.size} car${if (allSavedCars.size == 1) "" else "s"} • GHS $lowest/day"
        else -> "${allSavedCars.size} car${if (allSavedCars.size == 1) "" else "s"} • GHS $lowest – $highest/day"
    }
    val fullSpan: (androidx.compose.foundation.lazy.grid.LazyGridItemSpanScope.() -> GridItemSpan) = { GridItemSpan(maxLineSpan) }

    HayameRefreshBox(
        onRefresh = { viewModel.loadFavorites(); viewModel.loadCars() },
        modifier = Modifier.fillMaxSize(),
        indicatorTopPadding = paddingValues.calculateTopPadding(),
    ) {
    LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item(key = "saved-header", span = fullSpan) {
                Column {
                    Spacer(modifier = Modifier.height(16.dp))
                    StaggeredAppear(index = 0) {
                        TabHeader(title = "Saved", subtitle = subtitle) {
                            if (isAuthenticated && allSavedCars.isNotEmpty()) {
                                Box(modifier = Modifier.coachTarget("saved.layout")) {
                                    ExploreLayoutToggle(selectedLayout = layout) { selected ->
                                        layoutName = selected.name
                                        prefs.edit().putString(SavedLayoutPrefsKey, selected.name).apply()
                                    }
                                }
                            }
                        }
                    }
                }
            }
            when {
                !isAuthenticated -> item(key = "saved-guest", span = fullSpan) {
                    StaggeredAppear(index = 1) {
                        GuestGateCard(
                            title = "Log in to save cars",
                            message = "Hearts you tap sync to your account and wait for you here.",
                            icon = Icons.Filled.Favorite,
                            actionTitle = "Log in",
                            onClick = { viewModel.requireAuthentication("Sign in or sign up to open your saved listings.", NavRoutes.main(MainTab.SAVED)) },
                        )
                    }
                }
                isLoading -> {
                    item(key = "saved-summary-skeleton", span = fullSpan) { StaggeredAppear(index = 1) { SavedSummarySkeleton() } }
                    items(4, key = { "saved-skeleton-$it" }) { index -> StaggeredAppear(index = index + 2) { SavedCardSkeleton() } }
                }
                favoritesState is UiState.Error -> item(key = "saved-error", span = fullSpan) {
                    StaggeredAppear(index = 1) { ErrorBlock((favoritesState as UiState.Error).message, onRetry = { viewModel.loadFavorites() }) }
                }
                allSavedCars.isEmpty() -> item(key = "saved-empty", span = fullSpan) {
                    StaggeredAppear(index = 1) { SavedEmptyCard(onClick = { viewModel.requestMainTab(MainTab.EXPLORE) }) }
                }
                else -> {
                    item(key = "saved-summary", span = fullSpan) { StaggeredAppear(index = 1) { SavedSummaryStrip(allSavedCars, sort) } }
                    item(key = "saved-filters", span = fullSpan) {
                        StaggeredAppear(index = 2, modifier = Modifier.coachTarget("saved.sort")) {
                            SavedFilterBar(
                                sort = sort,
                                instantOnly = instantOnly,
                                deliveryOnly = deliveryOnly,
                                onSort = { selected ->
                                    sortName = selected.name
                                    prefs.edit().putString(SavedSortPrefsKey, selected.name).apply()
                                },
                                onToggleInstant = { instantOnly = !instantOnly },
                                onToggleDelivery = { deliveryOnly = !deliveryOnly },
                            )
                        }
                    }
                    if (savedCars.isEmpty()) {
                        item(key = "saved-no-match", span = fullSpan) {
                            Column(
                                modifier = Modifier.fillMaxWidth().padding(22.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(10.dp),
                            ) {
                                Icon(Icons.Outlined.FilterList, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(30.dp))
                                Text("Nothing matches these filters", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                TextButton(onClick = { instantOnly = false; deliveryOnly = false }) {
                                    Text("Clear filters", color = colors.brandBlue, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    } else {
                        items(savedCars, key = { it.id }, span = { if (layout == ExploreLayoutMode.LIST) GridItemSpan(maxLineSpan) else GridItemSpan(1) }) { car ->
                            StaggeredAppear(index = savedCars.indexOf(car) + 3) {
                                ListingCard(
                                    car = car,
                                    isFavorite = true,
                                    layout = if (layout == ExploreLayoutMode.GRID) ListingCardLayout.TILE else ListingCardLayout.ROW,
                                    imageHeight = 132.dp,
                                    emphasizeSaved = true,
                                    onClick = { onOpenCarDetail(car.id) },
                                    onFavoriteClick = { viewModel.toggleFavorite(car.id, currentlyFavorite = true) },
                                )
                            }
                        }
                    }
                }
            }
                item(key = "saved-footer", span = fullSpan) { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }
}

/** How the Saved list is ordered. Persisted so the choice sticks between visits. */
internal enum class SavedSort(val title: String) {
    NEWEST("Newest"),
    PRICE_LOW("Price: low to high"),
    PRICE_HIGH("Price: high to low"),
    TOP_RATED("Top rated"),
}

private const val SavedSortPrefsKey = "sort"

/** Sort menu plus quick toggles, in one scrolling chip row. */
@Composable
private fun SavedFilterBar(
    sort: SavedSort,
    instantOnly: Boolean,
    deliveryOnly: Boolean,
    onSort: (SavedSort) -> Unit,
    onToggleInstant: () -> Unit,
    onToggleDelivery: () -> Unit,
) {
    val colors = LocalHayameColors.current
    var sortMenuOpen by remember { mutableStateOf(false) }
    Row(
        modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box {
            Surface(onClick = { sortMenuOpen = true }, shape = CircleShape, color = colors.brandBlue) {
                Row(modifier = Modifier.padding(horizontal = 13.dp, vertical = 9.dp), horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.SwapVert, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                    Text(sort.title, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = Color.White)
                    Icon(Icons.Outlined.ExpandMore, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                }
            }
            DropdownMenu(expanded = sortMenuOpen, onDismissRequest = { sortMenuOpen = false }, containerColor = colors.cardBackground) {
                SavedSort.entries.forEach { option ->
                    DropdownMenuItem(
                        text = { Text(option.title, color = colors.brandNavy, fontWeight = if (option == sort) FontWeight.Bold else FontWeight.Medium) },
                        leadingIcon = { if (option == sort) Icon(Icons.Filled.Check, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(16.dp)) },
                        onClick = { sortMenuOpen = false; onSort(option) },
                    )
                }
            }
        }
        SavedToggleChip("Instant book", Icons.Outlined.Bolt, instantOnly, onToggleInstant)
        SavedToggleChip("Delivery", Icons.Outlined.LocalShipping, deliveryOnly, onToggleDelivery)
    }
}

@Composable
private fun SavedToggleChip(title: String, icon: ImageVector, isOn: Boolean, onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    Surface(
        onClick = onClick,
        shape = CircleShape,
        color = if (isOn) colors.brandBlue.copy(alpha = 0.12f) else colors.cardBackground,
        border = BorderStroke(1.dp, if (isOn) colors.brandBlue else colors.border),
    ) {
        Row(modifier = Modifier.padding(horizontal = 13.dp, vertical = 9.dp), horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, contentDescription = null, tint = if (isOn) colors.brandBlue else colors.brandNavy, modifier = Modifier.size(14.dp))
            Text(title, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = if (isOn) colors.brandBlue else colors.brandNavy)
        }
    }
}

@Composable
private fun SavedSummaryStrip(cars: List<CarDto>, sort: SavedSort = SavedSort.NEWEST) {
    val colors = LocalHayameColors.current
    val lowest = cars.minOfOrNull { (it.daily_price ?: 0.0).roundToInt() } ?: 0
    val highest = cars.maxOfOrNull { (it.daily_price ?: 0.0).roundToInt() } ?: 0
    val instant = cars.count { it.instant_book == true }
    val showsHighest = sort == SavedSort.PRICE_HIGH
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        SavedStatTile("${cars.size}", if (cars.size == 1) "saved car" else "saved cars", Icons.Filled.Favorite, colors.danger, Modifier.weight(1f))
        SavedStatTile("GHS ${if (showsHighest) highest else lowest}", if (showsHighest) "highest / day" else "lowest / day", Icons.Outlined.LocalOffer, colors.brandBlue, Modifier.weight(1f))
        SavedStatTile("$instant", "instant book", Icons.Outlined.Bolt, colors.success, Modifier.weight(1f))
    }
}

@Composable
private fun SavedStatTile(value: String, label: String, icon: ImageVector, tint: Color, modifier: Modifier = Modifier) {
    val colors = LocalHayameColors.current
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(16.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Box(modifier = Modifier.size(26.dp).background(tint.copy(alpha = 0.13f), RoundedCornerShape(8.dp)), contentAlignment = Alignment.Center) {
            Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(14.dp))
        }
        Text(value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(label, style = MaterialTheme.typography.labelSmall, color = colors.mutedText, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun SavedEmptyCard(onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    val floatAnim = rememberInfiniteTransition(label = "saved-empty")
    val beat by floatAnim.animateFloat(
        initialValue = 0.96f,
        targetValue = 1.06f,
        animationSpec = infiniteRepeatable(tween(1200, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "saved-empty-beat",
    )
    val rise by floatAnim.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(2400, easing = LinearEasing), RepeatMode.Restart),
        label = "saved-empty-rise",
    )
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(24.dp))
            .padding(22.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(modifier = Modifier.size(130.dp), contentAlignment = Alignment.Center) {
            Box(modifier = Modifier.size(104.dp).background(colors.brandLight, CircleShape))
            Icon(Icons.Filled.Favorite, contentDescription = null, tint = colors.danger.copy(alpha = 0.9f), modifier = Modifier.size(44.dp).graphicsLayer { scaleX = beat; scaleY = beat })
            repeat(3) { index ->
                val phase = ((rise + index * 0.33f) % 1f)
                Icon(
                    Icons.Outlined.FavoriteBorder,
                    contentDescription = null,
                    tint = colors.brandBlue.copy(alpha = (1f - phase) * 0.5f),
                    modifier = Modifier
                        .size((10 + index * 3).dp)
                        .offset(x = (-44 + index * 44).dp, y = (-30 - phase * 34).dp),
                )
            }
        }
        Text("Nothing saved yet", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
        Text("Tap the heart on any listing and it will wait for you here, synced across your devices.", style = MaterialTheme.typography.bodyMedium, color = colors.mutedText, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
        GradientPillButton(text = "Explore cars", modifier = Modifier.fillMaxWidth(), onClick = onClick)
    }
}

@Composable
private fun SavedSummarySkeleton() {
    val colors = LocalHayameColors.current
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        repeat(3) {
            Column(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(16.dp))
                    .background(colors.cardBackground)
                    .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                    .padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                HayameShimmerBlock(modifier = Modifier.size(26.dp), cornerRadius = 8.dp)
                HayameShimmerBlock(modifier = Modifier.size(width = 54.dp, height = 16.dp), cornerRadius = 6.dp)
                HayameShimmerBlock(modifier = Modifier.size(width = 70.dp, height = 10.dp), cornerRadius = 5.dp)
            }
        }
    }
}

@Composable
private fun SavedCardSkeleton() {
    val colors = LocalHayameColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(20.dp)),
    ) {
        HayameShimmerBlock(modifier = Modifier.fillMaxWidth().height(124.dp), cornerRadius = 0.dp)
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
            HayameShimmerBlock(modifier = Modifier.size(width = 110.dp, height = 13.dp), cornerRadius = 6.dp)
            HayameShimmerBlock(modifier = Modifier.size(width = 80.dp, height = 10.dp), cornerRadius = 5.dp)
            HayameShimmerBlock(modifier = Modifier.size(width = 50.dp, height = 10.dp), cornerRadius = 5.dp)
        }
    }
}

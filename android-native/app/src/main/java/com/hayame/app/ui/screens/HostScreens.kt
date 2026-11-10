package com.hayame.app.ui.screens

import com.hayame.app.ui.components.HayameRefreshBox
import com.hayame.app.ui.components.coachTarget
import com.hayame.app.ui.components.CoachTour
import com.hayame.app.ui.components.CoachStep
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.animateIntAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.AttachMoney
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.CameraAlt
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.DirectionsCar
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.Flag
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.MailOutline
import androidx.compose.material.icons.outlined.NotificationsActive
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Phone
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material.icons.outlined.SwapHoriz
import androidx.compose.material.icons.outlined.Timeline
import androidx.compose.material.icons.outlined.Verified
import androidx.compose.material.icons.outlined.Favorite
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.hayame.app.BuildConfig
import com.hayame.app.core.network.BookingDto
import com.hayame.app.core.network.CarDto
import com.hayame.app.core.network.ReviewDto
import com.hayame.app.core.network.preferredAvatarRaw
import com.hayame.app.core.network.preferredCity
import com.hayame.app.core.network.preferredEmail
import com.hayame.app.core.network.preferredFullName
import com.hayame.app.core.network.preferredPhone
import com.hayame.app.core.network.preferredRegion
import com.hayame.app.ui.components.HayameShimmerBlock
import com.hayame.app.ui.state.UiState
import com.hayame.app.ui.theme.LocalHayameColors
import com.hayame.app.ui.viewmodel.AppViewModel
import java.text.NumberFormat
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.roundToInt

// MARK: Host home -------------------------------------------------------------------------------
//
// Same language as the More tab: greeting header, a brand hero with the host-mode switch and the
// month's earnings, a requests banner when guests are waiting, animated stat tiles, a six-month
// earnings chart, quick actions, a listings carousel, recent activity and the host tools.

@Composable
fun HostDashboardScreen(
    viewModel: AppViewModel,
    onBack: () -> Unit,
    onOpenCars: () -> Unit,
    onOpenCreateCar: () -> Unit,
    onOpenBookings: () -> Unit,
    onOpenEarnings: () -> Unit,
    onOpenMessages: () -> Unit,
    onOpenFavorites: () -> Unit = {},
    onOpenReviews: () -> Unit,
    onOpenProfile: () -> Unit,
    onOpenContact: () -> Unit = {},
    onOpenSettings: () -> Unit = {},
) {
    CoachTour(
        id = "hostHome",
        steps = listOf(
            CoachStep("host.hero", "Your month at a glance", "Earnings so far, listings and requests waiting on you."),
            CoachStep("host.switch", "Switch modes", "Flip this to go back to renting."),
        ),
    )
    val colors = LocalHayameColors.current
    val me by viewModel.me.collectAsState()
    val myCarsState by viewModel.myCarsState.collectAsState()
    val bookingsState by viewModel.bookingsState.collectAsState()
    val hostReviewsState by viewModel.hostReviewsListState.collectAsState()
    val conversationsState by viewModel.conversationsState.collectAsState()
    var hostModeEnabled by remember { mutableStateOf(true) }
    var revealed by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.loadMyCars()
        viewModel.loadBookings()
        viewModel.loadHostReviews()
        viewModel.loadConversations()
        kotlinx.coroutines.delay(350)
        revealed = true
    }

    val currentUserId = me?.user?.id.orEmpty()
    val cars = (myCarsState as? UiState.Success<List<CarDto>>)?.data.orEmpty()
    val bookings = (bookingsState as? UiState.Success<List<BookingDto>>)?.data.orEmpty()
    val hostBookings = remember(bookings, currentUserId) { bookings.filter { isHostBooking(it, currentUserId) } }
    val reviews = (hostReviewsState as? UiState.Success<List<ReviewDto>>)?.data.orEmpty()
    val unreadCount = (conversationsState as? UiState.Success<List<com.hayame.app.core.network.ConversationDto>>)
        ?.data?.sumOf { it.unread_count ?: 0 } ?: 0
    val urgentBookings = remember(hostBookings) {
        hostBookings.filter { it.status.equals("awaiting_host", true) && it.payment_status.equals("paid", true) }
    }
    val earningBookings = hostBookings.filter { isEarningStatus(it.status) }
    val totalEarnings = earningBookings.sumOf { (it.total_price ?: 0.0).roundToInt() }
    val monthKey = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"))
    val monthlyEarnings = earningBookings.filter { bookingMonthKey(it.created_at) == monthKey }.sumOf { (it.total_price ?: 0.0).roundToInt() }
    val completedTrips = hostBookings.count { it.status.equals("completed", true) }
    val averageRating = if (reviews.isEmpty()) 0.0 else reviews.map { it.rating ?: 0.0 }.average()
    val monthlySeries = remember(hostBookings) { buildHostMonthlySeries(hostBookings) }
    val isBookingsLoading = bookingsState is UiState.Loading && hostBookings.isEmpty()
    val isListingsLoading = myCarsState is UiState.Loading && cars.isEmpty()
    val fullName = me.preferredFullName()?.takeIf { it.isNotBlank() } ?: "Host"
    val firstName = fullName.trim().split(" ").firstOrNull().orEmpty().ifBlank { "Host" }
    val avatarUrl = resolveAppImage(me.preferredAvatarRaw())

    Scaffold(containerColor = colors.pageBackground) { inner ->
        HayameRefreshBox(
            onRefresh = { viewModel.loadMyCars(); viewModel.loadBookings(); viewModel.loadHostReviews(); viewModel.loadConversations() },
            modifier = Modifier.fillMaxSize(),
            indicatorTopPadding = inner.calculateTopPadding(),
        ) {
        LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(inner),
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 28.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp),
            ) {
                item(key = "header") {
                    StaggeredAppear(index = 0) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(hostGreeting(), style = MaterialTheme.typography.labelLarge, color = colors.mutedText)
                                Text(firstName, fontSize = 30.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            }
                            PressableSurface(onClick = onOpenProfile, shape = CircleShape, border = null, containerColor = Color.Transparent, pressedScale = 0.9f) {
                                AvatarRing(size = 46.dp, strokeWidth = 2.dp) {
                                    RemoteAvatar(imageUrl = avatarUrl, name = fullName, fallback = "H", size = 38.dp, textStyle = MaterialTheme.typography.labelLarge)
                                }
                            }
                        }
                    }
                }

                item(key = "hero") {
                    StaggeredAppear(index = 1, modifier = Modifier.coachTarget("host.hero")) {
                        HostHeroCard(
                            monthlyEarnings = monthlyEarnings,
                            bookingsCount = earningBookings.size,
                            listingsCount = cars.size,
                            waitingCount = urgentBookings.size,
                            hostModeEnabled = hostModeEnabled,
                            revealed = revealed,
                            onHostModeChange = { enabled ->
                                hostModeEnabled = enabled
                                if (!enabled) onBack()
                            },
                        )
                    }
                }

                if (urgentBookings.isNotEmpty()) {
                    item(key = "urgent") {
                        StaggeredAppear(index = 2) {
                            UrgentRequestsCard(count = urgentBookings.size, onClick = onOpenBookings)
                        }
                    }
                }

                item(key = "stats") {
                    StaggeredAppear(index = 3) {
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            if (isBookingsLoading) {
                                repeat(2) {
                                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                        repeat(2) { HayameShimmerBlock(modifier = Modifier.weight(1f).height(96.dp), cornerRadius = 18.dp) }
                                    }
                                }
                            } else {
                                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                    HostStatTile("Total earned", hostMoney(totalEarnings), hostMoney(0), Icons.Outlined.AttachMoney, colors.success, revealed, Modifier.weight(1f), onOpenEarnings)
                                    HostStatTile("Completed trips", completedTrips.toString(), "0", Icons.Outlined.Flag, colors.brandBlue, revealed, Modifier.weight(1f), onOpenBookings)
                                }
                                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                    HostStatTile("My cars", cars.size.toString(), "0", Icons.Outlined.DirectionsCar, colors.warning, revealed, Modifier.weight(1f), onOpenCars)
                                    HostStatTile("Rating", if (reviews.isEmpty()) "New" else String.format(Locale.US, "%.1f", averageRating), "0.0", Icons.Outlined.Star, colors.danger, revealed, Modifier.weight(1f), onOpenReviews)
                                }
                            }
                        }
                    }
                }

                item(key = "chart") {
                    StaggeredAppear(index = 4) {
                        PressableSurface(onClick = onOpenEarnings, pressedScale = 0.985f) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                        Text("Earnings, last 6 months", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                        Text(
                                            if (monthlySeries.all { it.amount == 0 }) "Confirmed bookings will show up here." else "Tap for payouts and history",
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = colors.mutedText,
                                        )
                                    }
                                    Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = colors.mutedText.copy(alpha = 0.7f))
                                }
                                HostEarningsBars(series = monthlySeries, revealed = revealed, modifier = Modifier.fillMaxWidth().height(132.dp))
                            }
                        }
                    }
                }

                item(key = "actions") {
                    StaggeredAppear(index = 5) {
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                QuickActionTile("Add a car", "Create a new listing", Icons.Outlined.Add, colors.brandBlue, Modifier.weight(1f), onClick = onOpenCreateCar)
                                QuickActionTile("Bookings", if (urgentBookings.isEmpty()) "Requests and history" else "${urgentBookings.size} to review", Icons.Outlined.CalendarMonth, colors.warning, Modifier.weight(1f), badge = urgentBookings.size, onClick = onOpenBookings)
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                QuickActionTile("Inbox", if (unreadCount == 0) "All caught up" else "$unreadCount unread", Icons.Outlined.ChatBubbleOutline, colors.success, Modifier.weight(1f), badge = unreadCount, onClick = onOpenMessages)
                                QuickActionTile("Earnings", "Payouts and trends", Icons.Outlined.Timeline, colors.danger, Modifier.weight(1f), onClick = onOpenEarnings)
                            }
                        }
                    }
                }

                item(key = "listings") {
                    StaggeredAppear(index = 6) {
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                                Text("YOUR LISTINGS", style = MaterialTheme.typography.labelLarge, letterSpacing = 0.6.sp, color = colors.mutedText, modifier = Modifier.weight(1f).padding(start = 4.dp))
                                TextButton(onClick = onOpenCars) { Text("Manage", color = colors.brandBlue, fontWeight = FontWeight.SemiBold) }
                            }
                            when {
                                isListingsLoading -> LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                    items(3) { HayameShimmerBlock(modifier = Modifier.width(200.dp).height(176.dp), cornerRadius = 18.dp) }
                                }
                                cars.isEmpty() -> PressableSurface(onClick = onOpenCreateCar) {
                                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                                        Box(
                                            contentAlignment = Alignment.Center,
                                            modifier = Modifier
                                                .size(48.dp)
                                                .background(colors.brandLight, RoundedCornerShape(14.dp)),
                                        ) {
                                            Icon(Icons.Outlined.DirectionsCar, contentDescription = null, tint = colors.brandBlue)
                                        }
                                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                            Text("List your first car", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                            Text("Photos, price and availability take a few minutes.", style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
                                        }
                                        Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = colors.mutedText.copy(alpha = 0.7f))
                                    }
                                }
                                else -> LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp), contentPadding = PaddingValues(vertical = 2.dp)) {
                                    items(cars.take(6), key = { it.id }) { car ->
                                        HostListingCard(car = car, onClick = onOpenCars)
                                    }
                                }
                            }
                        }
                    }
                }

                item(key = "activity") {
                    StaggeredAppear(index = 7) {
                        GroupCard(title = "Recent activity", actionTitle = if (hostBookings.isEmpty()) null else "All bookings", onAction = onOpenBookings) {
                            when {
                                isBookingsLoading -> repeat(3) { index ->
                                    Row(modifier = Modifier.padding(horizontal = 16.dp, vertical = 13.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                        HayameShimmerBlock(modifier = Modifier.size(34.dp), cornerRadius = 10.dp)
                                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                            HayameShimmerBlock(modifier = Modifier.width(150.dp).height(14.dp))
                                            HayameShimmerBlock(modifier = Modifier.width(110.dp).height(10.dp))
                                        }
                                    }
                                    if (index < 2) RowDivider()
                                }
                                hostBookings.isEmpty() -> RowLabel(icon = Icons.Outlined.CalendarMonth, tint = colors.mutedText, title = "No bookings yet", subtitle = "Requests appear here as soon as guests book.") {}
                                else -> {
                                    val recent = hostBookings.sortedByDescending { it.created_at.orEmpty() }.take(3)
                                    recent.forEachIndexed { index, booking ->
                                        val awaiting = booking.status.equals("awaiting_host", true)
                                        val renter = booking.renter?.full_name?.takeIf { it.isNotBlank() } ?: "Guest"
                                        RowLabel(
                                            icon = Icons.Outlined.DirectionsCar,
                                            tint = if (awaiting) colors.warning else colors.brandBlue,
                                            title = booking.cars?.title?.takeIf { it.isNotBlank() } ?: "Booking",
                                            subtitle = "$renter · ${bookingDateLabel(booking.start_date)} – ${bookingDateLabel(booking.end_date)}",
                                            modifier = Modifier.clickable(onClick = onOpenBookings),
                                        ) {
                                            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                                BookingStatusBadge(status = resolveBookingDisplayStatus(booking.status, booking.start_date, booking.end_date))
                                                Text(hostMoney((booking.total_price ?: 0.0).roundToInt()), style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                            }
                                        }
                                        if (index < recent.lastIndex) RowDivider()
                                    }
                                }
                            }
                        }
                    }
                }

                item(key = "tools") {
                    StaggeredAppear(index = 8) {
                        GroupCard(title = "Host tools") {
                            NavRow(Icons.Outlined.Star, colors.warning, "Guest feedback", if (reviews.isEmpty()) "No reviews yet" else "${reviews.size} ${if (reviews.size == 1) "review" else "reviews"}", onOpenReviews)
                            RowDivider()
                            NavRow(Icons.Outlined.FavoriteBorder, colors.danger, "Favourites insights", "Which listings guests save most", onOpenFavorites)
                            RowDivider()
                            NavRow(Icons.Outlined.Settings, colors.brandNavy, "Settings", "Appearance, app icon, notifications", onOpenSettings)
                            RowDivider()
                            NavRow(Icons.Outlined.MailOutline, colors.brandBlue, "Host support", "We reply within a day", onOpenContact)
                        }
                    }
                }
            }
        }
    }
}

// MARK: Host profile ----------------------------------------------------------------------------

@Composable
fun HostProfileScreen(
    viewModel: AppViewModel,
    onBack: () -> Unit,
    onOpenReviews: () -> Unit = {},
    onOpenFavorites: () -> Unit = {},
    onOpenContact: () -> Unit = {},
    onOpenProtection: () -> Unit = {},
    onOpenCancellation: () -> Unit = {},
    onOpenTerms: () -> Unit = {},
    onTurnOffHostMode: () -> Unit = onBack,
    onOpenCars: () -> Unit = {},
    onOpenBookings: () -> Unit = {},
    onEditProfile: () -> Unit = {},
    onOpenSettings: () -> Unit = {},
) {
    val colors = LocalHayameColors.current
    val me by viewModel.me.collectAsState()
    val bootstrapping by viewModel.bootstrapping.collectAsState()
    val myCarsState by viewModel.myCarsState.collectAsState()
    val bookingsState by viewModel.bookingsState.collectAsState()
    val hostReviewsState by viewModel.hostReviewsListState.collectAsState()
    var revealed by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.loadMyCars()
        viewModel.loadBookings()
        viewModel.loadHostReviews()
        kotlinx.coroutines.delay(300)
        revealed = true
    }

    val currentUserId = me?.user?.id.orEmpty()
    val cars = (myCarsState as? UiState.Success<List<CarDto>>)?.data.orEmpty()
    val bookings = (bookingsState as? UiState.Success<List<BookingDto>>)?.data.orEmpty()
    val hostBookings = remember(bookings, currentUserId) { bookings.filter { isHostBooking(it, currentUserId) } }
    val reviews = (hostReviewsState as? UiState.Success<List<ReviewDto>>)?.data.orEmpty()
    val completedTrips = hostBookings.count { it.status.equals("completed", true) }
    val approved = hostBookings.count { it.status.equals("confirmed", true) || it.status.equals("completed", true) }
    val rejected = hostBookings.count { it.status.equals("rejected", true) }
    val approvalRate: Float? = if (approved + rejected > 0) approved.toFloat() / (approved + rejected) else null
    val averageRating = if (reviews.isEmpty()) 0.0 else reviews.map { it.rating ?: 0.0 }.average()
    val fullName = me.preferredFullName()?.takeIf { it.isNotBlank() } ?: me?.user?.email ?: "Host"
    val email = me.preferredEmail().orEmpty()
    val location = listOfNotNull(me.preferredCity(), me.preferredRegion()).filter { it.isNotBlank() }.joinToString(", ")
    val hostLevel = hostLevelLabel(me?.profile?.host_level)
    val isHeaderLoading = bootstrapping && me == null

    Scaffold(containerColor = colors.pageBackground) { inner ->
        HayameRefreshBox(
            onRefresh = { viewModel.refreshProfile(); viewModel.loadMyCars(); viewModel.loadBookings(); viewModel.loadHostReviews() },
            modifier = Modifier.fillMaxSize(),
            indicatorTopPadding = inner.calculateTopPadding(),
        ) {
        LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(inner),
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 28.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp),
            ) {
                item(key = "header") {
                    StaggeredAppear(index = 0) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                            Text("Profile", fontSize = 30.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy, modifier = Modifier.weight(1f))
                            PressableSurface(onClick = onOpenSettings, shape = CircleShape, modifier = Modifier.size(42.dp)) {
                                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                                    Icon(Icons.Outlined.Settings, contentDescription = "Settings", tint = colors.brandNavy)
                                }
                            }
                        }
                    }
                }

                item(key = "hero") {
                    StaggeredAppear(index = 1) {
                        if (isHeaderLoading) {
                            ProfileHeaderSkeleton()
                        } else {
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                                Box {
                                    AvatarRing(size = 116.dp, strokeWidth = 3.dp) {
                                        RemoteAvatar(imageUrl = resolveAppImage(me.preferredAvatarRaw()), name = fullName, fallback = "H", size = 98.dp, textStyle = MaterialTheme.typography.headlineLarge)
                                    }
                                    PressableSurface(
                                        onClick = onEditProfile,
                                        shape = CircleShape,
                                        containerColor = colors.brandBlue,
                                        modifier = Modifier
                                            .align(Alignment.BottomEnd)
                                            .size(34.dp)
                                            .border(3.dp, colors.pageBackground, CircleShape),
                                    ) {
                                        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                                            Icon(Icons.Outlined.CameraAlt, contentDescription = "Change photo", tint = Color.White, modifier = Modifier.size(16.dp))
                                        }
                                    }
                                }
                                Spacer(Modifier.height(14.dp))
                                Text(fullName, fontSize = 26.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy, textAlign = TextAlign.Center)
                                if (email.isNotBlank()) {
                                    Spacer(Modifier.height(4.dp))
                                    Text(email, style = MaterialTheme.typography.bodyLarge, color = colors.mutedText)
                                }
                                Spacer(Modifier.height(12.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    RoleChip(text = hostLevel, icon = Icons.Outlined.Verified)
                                    if (location.isNotBlank()) RoleChip(text = location, icon = Icons.Outlined.LocationOn)
                                }
                            }
                        }
                    }
                }

                item(key = "stats") {
                    StaggeredAppear(index = 2) {
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            HostStatTile("Cars", cars.size.toString(), "0", Icons.Outlined.DirectionsCar, colors.brandBlue, revealed, Modifier.weight(1f), onOpenCars)
                            HostStatTile("Trips hosted", completedTrips.toString(), "0", Icons.Outlined.Flag, colors.success, revealed, Modifier.weight(1f), onOpenBookings)
                            HostStatTile("Rating", if (reviews.isEmpty()) "New" else String.format(Locale.US, "%.1f", averageRating), "0.0", Icons.Outlined.Star, colors.warning, revealed, Modifier.weight(1f), onOpenReviews)
                        }
                    }
                }

                item(key = "performance") {
                    StaggeredAppear(index = 3) {
                        HostPerformanceCard(
                            approvalRate = approvalRate,
                            awaiting = hostBookings.count { it.status.equals("awaiting_host", true) },
                            upcoming = hostBookings.count { it.status.equals("confirmed", true) },
                            reviews = reviews.size,
                            revealed = revealed,
                        )
                    }
                }

                item(key = "tools") {
                    StaggeredAppear(index = 4) {
                        GroupCard(title = "Host tools") {
                            NavRow(Icons.Outlined.DirectionsCar, colors.brandBlue, "My listings", "${cars.size} ${if (cars.size == 1) "car" else "cars"} listed", onOpenCars)
                            RowDivider()
                            NavRow(Icons.Outlined.Star, colors.warning, "Guest feedback", if (reviews.isEmpty()) "No reviews yet" else "${reviews.size} ${if (reviews.size == 1) "review" else "reviews"}", onOpenReviews)
                            RowDivider()
                            NavRow(Icons.Outlined.FavoriteBorder, colors.danger, "Favourites insights", "Which listings guests save most", onOpenFavorites)
                            RowDivider()
                            NavRow(Icons.Outlined.Settings, colors.brandNavy, "Settings", "Appearance, app icon, notifications, privacy", onOpenSettings)
                        }
                    }
                }

                item(key = "details") {
                    StaggeredAppear(index = 5) {
                        GroupCard(title = "Personal details", actionTitle = "Edit", onAction = onEditProfile) {
                            DetailRow(Icons.Outlined.Person, "Full name", me.preferredFullName().orEmpty(), "Add your name")
                            RowDivider()
                            DetailRow(Icons.Outlined.Email, "Email", email, "Not set")
                            RowDivider()
                            DetailRow(Icons.Outlined.Phone, "Phone", me.preferredPhone().orEmpty(), "Add a phone number")
                            RowDivider()
                            DetailRow(Icons.Outlined.LocationOn, "Location", location, "Add your city")
                        }
                    }
                }

                item(key = "support") {
                    StaggeredAppear(index = 6) {
                        GroupCard(title = "Support & legal") {
                            NavRow(Icons.Outlined.MailOutline, colors.brandBlue, "Contact us", "We reply within a day", onOpenContact)
                            RowDivider()
                            NavRow(Icons.Outlined.Shield, colors.success, "Protection", "What's covered on every trip", onOpenProtection)
                            RowDivider()
                            NavRow(Icons.Outlined.CalendarMonth, colors.warning, "Cancellation policy", "Refund tiers and timing", onOpenCancellation)
                            RowDivider()
                            NavRow(Icons.Outlined.Description, colors.brandBlue, "Terms of Service", "The agreement for using Hayame", onOpenTerms)
                        }
                    }
                }

                item(key = "footer") {
                    StaggeredAppear(index = 7) {
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            PressableSurface(
                                onClick = onTurnOffHostMode,
                                shape = RoundedCornerShape(999.dp),
                                containerColor = colors.brandLight,
                                border = BorderStroke(1.dp, colors.brandBlue.copy(alpha = 0.25f)),
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Row(horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth().padding(vertical = 13.dp)) {
                                    Icon(Icons.Outlined.SwapHoriz, contentDescription = null, tint = colors.brandNavy, modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.width(8.dp))
                                    Text("Switch to renting", color = colors.brandNavy, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodyLarge)
                                }
                            }
                            SignOutButton { viewModel.logout() }
                            Text("Hayame v${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})", style = MaterialTheme.typography.labelLarge, color = colors.mutedText)
                        }
                    }
                }
            }
        }
    }
}

// MARK: Building blocks ------------------------------------------------------------------------

@Composable
private fun HostHeroCard(
    monthlyEarnings: Int,
    bookingsCount: Int,
    listingsCount: Int,
    waitingCount: Int,
    hostModeEnabled: Boolean,
    revealed: Boolean,
    onHostModeChange: (Boolean) -> Unit,
) {
    val colors = LocalHayameColors.current
    val shown by animateIntAsState(if (revealed) monthlyEarnings else 0, tween(800, easing = FastOutSlowInEasing), label = "hero-earnings")
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(Brush.linearGradient(listOf(colors.heroStart, colors.heroEnd)))
            .background(Brush.radialGradient(listOf(colors.heroHighlight, Color.Transparent), radius = 560f)),
    ) {
        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("THIS MONTH", style = MaterialTheme.typography.labelLarge, letterSpacing = 0.8.sp, color = Color.White.copy(alpha = 0.75f))
                    Text(hostMoney(shown), fontSize = 34.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("earned across $bookingsCount bookings", style = MaterialTheme.typography.bodyMedium, color = Color.White.copy(alpha = 0.8f))
                }
                Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Host mode", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = Color.White.copy(alpha = 0.85f))
                    Box(modifier = Modifier.coachTarget("host.switch")) {
                        HostModeSwitch(checked = hostModeEnabled, onCheckedChange = onHostModeChange)
                    }
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HeroChip("$listingsCount ${if (listingsCount == 1) "listing" else "listings"}", Icons.Outlined.DirectionsCar)
                HeroChip(if (waitingCount == 0) "No requests waiting" else "$waitingCount waiting", if (waitingCount == 0) Icons.Outlined.CheckCircle else Icons.Outlined.NotificationsActive)
            }
        }
    }
}

@Composable
private fun HostModeSwitch(checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    val colors = LocalHayameColors.current
    val knobOffset by animateFloatAsState(if (checked) 1f else 0f, tween(220, easing = FastOutSlowInEasing), label = "host-switch")
    Box(
        modifier = Modifier
            .width(50.dp)
            .height(30.dp)
            .clip(CircleShape)
            .background(if (checked) Color.White.copy(alpha = 0.95f) else Color.White.copy(alpha = 0.3f))
            .clickable { onCheckedChange(!checked) }
            .padding(3.dp),
    ) {
        Box(
            modifier = Modifier
                .size(24.dp)
                .graphicsLayer { translationX = knobOffset * 20.dp.toPx() }
                .shadow(2.dp, CircleShape)
                .background(if (checked) colors.brandBlue else Color.White, CircleShape),
        )
    }
}

@Composable
private fun HeroChip(text: String, icon: ImageVector) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        modifier = Modifier
            .background(Color.White.copy(alpha = 0.18f), CircleShape)
            .padding(horizontal = 12.dp, vertical = 7.dp),
    ) {
        Icon(icon, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
        Text(text, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = Color.White)
    }
}

@Composable
private fun UrgentRequestsCard(count: Int, onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    val pulse = rememberInfiniteTransition(label = "urgent-pulse")
    val ring by pulse.animateFloat(
        initialValue = 1f,
        targetValue = 2.1f,
        animationSpec = infiniteRepeatable(tween(1800, easing = FastOutSlowInEasing), RepeatMode.Restart),
        label = "urgent-ring",
    )
    PressableSurface(
        onClick = onClick,
        containerColor = colors.danger.copy(alpha = 0.08f),
        border = BorderStroke(1.dp, colors.danger.copy(alpha = 0.25f)),
    ) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            Box(contentAlignment = Alignment.Center, modifier = Modifier.size(44.dp)) {
                Box(
                    modifier = Modifier
                        .size(42.dp)
                        .graphicsLayer { scaleX = ring; scaleY = ring; alpha = (2.1f - ring) / 1.1f * 0.5f }
                        .border(1.5.dp, colors.danger, CircleShape),
                )
                Box(contentAlignment = Alignment.Center, modifier = Modifier.size(42.dp).background(colors.danger, CircleShape)) {
                    Icon(Icons.Outlined.NotificationsActive, contentDescription = null, tint = Color.White)
                }
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text("$count ${if (count == 1) "request needs" else "requests need"} your answer", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                Text("Guests have paid and are waiting for approval.", style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
            }
            Text(
                "Review",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                modifier = Modifier
                    .background(colors.danger, CircleShape)
                    .padding(horizontal = 14.dp, vertical = 8.dp),
            )
        }
    }
}

@Composable
private fun HostStatTile(
    title: String,
    value: String,
    placeholder: String,
    icon: ImageVector,
    tint: Color,
    revealed: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val colors = LocalHayameColors.current
    PressableSurface(onClick = onClick, modifier = modifier, shape = RoundedCornerShape(18.dp), pressedScale = 0.96f) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Box(contentAlignment = Alignment.Center, modifier = Modifier.size(30.dp).background(tint.copy(alpha = 0.13f), RoundedCornerShape(9.dp))) {
                Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(16.dp))
            }
            AnimatedVisibility(visible = revealed, enter = fadeIn(tween(350)) + scaleIn(initialScale = 0.9f), exit = fadeOut()) {
                Text(value, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            if (!revealed) {
                Text(placeholder, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy.copy(alpha = 0.3f), maxLines = 1)
            }
            Text(title, style = MaterialTheme.typography.labelLarge, color = colors.mutedText, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

@Composable
private fun HostEarningsBars(series: List<HostMonthlyBucket>, revealed: Boolean, modifier: Modifier = Modifier) {
    val colors = LocalHayameColors.current
    val maxAmount = (series.maxOfOrNull { it.amount } ?: 0).coerceAtLeast(1)
    val progress by animateFloatAsState(if (revealed) 1f else 0f, tween(900, easing = FastOutSlowInEasing), label = "bars")
    val barBrush = Brush.verticalGradient(listOf(colors.brandBlue, colors.primaryButtonEnd))
    Column(modifier = modifier) {
        Canvas(modifier = Modifier.fillMaxWidth().weight(1f)) {
            val count = series.size.coerceAtLeast(1)
            val gap = 10.dp.toPx()
            val barWidth = (size.width - gap * (count - 1)) / count
            val minHeight = 6.dp.toPx()
            series.forEachIndexed { index, bucket ->
                val ratio = bucket.amount.toFloat() / maxAmount
                val target = (size.height * ratio).coerceAtLeast(minHeight)
                val h = minHeight + (target - minHeight) * progress
                val left = index * (barWidth + gap)
                val top = size.height - h
                val radius = androidx.compose.ui.geometry.CornerRadius(7.dp.toPx())
                if (bucket.amount == 0) {
                    drawRoundRect(color = colors.subtleFill, topLeft = Offset(left, top), size = Size(barWidth, h), cornerRadius = radius)
                } else {
                    drawRoundRect(brush = barBrush, topLeft = Offset(left, top), size = Size(barWidth, h), cornerRadius = radius)
                }
            }
        }
        Spacer(Modifier.height(6.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            series.forEach { bucket ->
                Text(bucket.month, style = MaterialTheme.typography.labelMedium, color = colors.mutedText, textAlign = TextAlign.Center, modifier = Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun HostListingCard(car: CarDto, onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    val approved = car.approval_status.equals("approved", ignoreCase = true)
    val imageUrl = resolveAppImage(car.image_url ?: car.car_photos?.firstOrNull()?.url)
    PressableSurface(onClick = onClick, shape = RoundedCornerShape(18.dp), modifier = Modifier.width(220.dp), pressedScale = 0.96f) {
        Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Box(modifier = Modifier.fillMaxWidth().height(112.dp).clip(RoundedCornerShape(14.dp)).background(colors.brandLight)) {
                if (!imageUrl.isNullOrBlank()) {
                    AsyncImage(model = imageUrl, contentDescription = car.title, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                } else {
                    Icon(Icons.Outlined.DirectionsCar, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.align(Alignment.Center).size(28.dp))
                }
                Text(
                    if (approved) "Live" else "Pending review",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    modifier = Modifier
                        .padding(8.dp)
                        .background(if (approved) colors.success else colors.warning, CircleShape)
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                )
            }
            Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(car.title ?: "Listing", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("${hostMoney((car.daily_price ?: 0.0).roundToInt())}/day", style = MaterialTheme.typography.labelLarge, color = colors.brandBlue, modifier = Modifier.weight(1f))
                    Icon(Icons.Outlined.Favorite, contentDescription = null, tint = colors.danger, modifier = Modifier.size(12.dp))
                    Spacer(Modifier.width(3.dp))
                    Text("${(car.favorites_count ?: 0.0).roundToInt()}", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = colors.danger)
                }
            }
        }
    }
}

@Composable
private fun HostPerformanceCard(approvalRate: Float?, awaiting: Int, upcoming: Int, reviews: Int, revealed: Boolean) {
    val colors = LocalHayameColors.current
    val progress by animateFloatAsState(if (revealed) (approvalRate ?: 0f) else 0f, tween(800, easing = FastOutSlowInEasing), label = "approval")
    val percent by animateIntAsState(if (revealed) ((approvalRate ?: 0f) * 100).roundToInt() else 0, tween(800, easing = FastOutSlowInEasing), label = "approval-pct")
    Surface(shape = RoundedCornerShape(18.dp), color = colors.brandLight, border = BorderStroke(1.dp, colors.brandBlue.copy(alpha = 0.18f)), modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.Timeline, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text("Hosting performance", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy, modifier = Modifier.weight(1f))
                if (approvalRate != null) {
                    Text("$percent% approved", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = colors.brandBlue)
                }
            }
            LinearProgressIndicator(
                progress = { progress },
                color = colors.brandBlue,
                trackColor = colors.brandBlue.copy(alpha = 0.15f),
                modifier = Modifier.fillMaxWidth().height(8.dp).clip(CircleShape),
            )
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                PerformanceStat(awaiting.toString(), "awaiting")
                PerformanceStat(upcoming.toString(), "upcoming")
                PerformanceStat(reviews.toString(), "reviews")
            }
            Text(
                if (approvalRate == null) "Approve requests quickly to build your approval rate. Guests see responsive hosts first."
                else "Guests see responsive hosts first. Keep approving paid requests promptly to stay on top.",
                style = MaterialTheme.typography.bodyMedium,
                color = colors.mutedText,
            )
        }
    }
}

@Composable
private fun PerformanceStat(value: String, label: String) {
    val colors = LocalHayameColors.current
    Column(verticalArrangement = Arrangement.spacedBy(1.dp)) {
        Text(value, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy)
        Text(label, style = MaterialTheme.typography.labelMedium, color = colors.mutedText)
    }
}

// MARK: Helpers ----------------------------------------------------------------------------------

private fun isEarningStatus(status: String?): Boolean =
    status.equals("awaiting_host", true) || status.equals("confirmed", true) || status.equals("completed", true)

private fun hostMoney(amount: Int): String = "GH₵" + NumberFormat.getIntegerInstance(Locale.US).format(amount)

private fun hostGreeting(): String = when (LocalTime.now().hour) {
    in 5..11 -> "Good morning"
    in 12..16 -> "Good afternoon"
    else -> "Good evening"
}

private fun bookingDateLabel(raw: String?): String {
    val date = runCatching { LocalDate.parse(raw.orEmpty().take(10)) }.getOrNull() ?: return raw.orEmpty().take(10)
    return date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
}

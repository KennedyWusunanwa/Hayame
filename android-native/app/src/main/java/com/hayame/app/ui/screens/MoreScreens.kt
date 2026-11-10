package com.hayame.app.ui.screens

import com.hayame.app.ui.components.HayameRefreshBox
import com.hayame.app.ui.components.coachTarget
import com.hayame.app.ui.components.CoachTour
import com.hayame.app.ui.components.CoachStep
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.MutableTransitionState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.animateIntAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.outlined.AdminPanelSettings
import androidx.compose.material.icons.outlined.Apps
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.BarChart
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.CameraAlt
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.PhoneAndroid
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.outlined.DirectionsCar
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.HourglassEmpty
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Key
import androidx.compose.material.icons.outlined.LightMode
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.MailOutline
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.PersonOutline
import androidx.compose.material.icons.outlined.Phone
import androidx.compose.material.icons.outlined.Public
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.material.icons.outlined.Replay
import androidx.compose.material.icons.outlined.Lightbulb
import com.hayame.app.ui.components.LocalCoachMarks
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hayame.app.BuildConfig
import com.hayame.app.core.AppIconManager
import com.hayame.app.core.HayameAppIcon
import com.hayame.app.core.analytics.AnalyticsService
import com.hayame.app.core.network.MobileMeDto
import com.hayame.app.core.network.isAdmin
import com.hayame.app.core.network.preferredAvatarRaw
import com.hayame.app.core.network.preferredCity
import com.hayame.app.core.network.preferredEmail
import com.hayame.app.core.network.preferredFullName
import com.hayame.app.core.network.preferredPhone
import com.hayame.app.core.network.preferredRegion
import com.hayame.app.ui.components.HayameShimmerBlock
import com.hayame.app.ui.navigation.MainTab
import com.hayame.app.ui.navigation.NavRoutes
import com.hayame.app.ui.state.UiState
import com.hayame.app.ui.theme.LocalHayameColors
import com.hayame.app.ui.viewmodel.AppearanceMode
import com.hayame.app.ui.theme.LocalDarkMode
import com.hayame.app.ui.viewmodel.AppViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// MARK: More tab ---------------------------------------------------------------------------------
//
// The More tab is the front door to the account: a profile hero, quick actions, hosting and the
// way into Settings. Sections settle in with a staggered slide, cards shrink under the finger, and
// remote data shows shimmer skeletons instead of empty gaps.

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun MoreTab(
    viewModel: AppViewModel,
    paddingValues: PaddingValues,
    appearanceHighlightNonce: Int = 0,
    onOpenMessages: () -> Unit,
    onOpenDashboard: () -> Unit,
    onOpenBecomeHost: () -> Unit,
    onOpenHostDashboard: () -> Unit,
    onOpenTrips: () -> Unit,
    onOpenSaved: () -> Unit = {},
    onOpenProfile: () -> Unit,
    onOpenContact: () -> Unit,
    onOpenProtection: () -> Unit,
    onOpenCancellation: () -> Unit,
    onOpenPrivacy: () -> Unit,
    onOpenAuth: () -> Unit = {},
    onOpenAdmin: () -> Unit = {},
    onOpenSettings: (highlightAppearance: Boolean) -> Unit = {},
    onOpenProfileOverview: () -> Unit = {},
    onOpenVerification: () -> Unit = {},
    onOpenTerms: () -> Unit = {},
) {
    CoachTour(
        id = "more",
        steps = listOf(
            CoachStep("more.profile", "Your profile", "Complete it so hosts know who's booking."),
            CoachStep("more.quick", "Shortcuts", "Trips, messages, saved cars and your dashboard."),
            CoachStep("more.settings", "Settings", "Appearance, app icon, notifications and these tips."),
        ),
    )
    val colors = LocalHayameColors.current
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val bootstrapping by viewModel.bootstrapping.collectAsState()
    val me by viewModel.me.collectAsState()
    val bookingsState by viewModel.bookingsState.collectAsState()
    val favoritesState by viewModel.favoritesState.collectAsState()
    val conversationsState by viewModel.conversationsState.collectAsState()
    val renterVerification by viewModel.renterVerification.collectAsState()
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()
    var isRefreshing by remember { mutableStateOf(false) }

    LaunchedEffect(appearanceHighlightNonce) {
        if (appearanceHighlightNonce > 0) onOpenSettings(true)
    }

    LaunchedEffect(isAuthenticated) {
        if (isAuthenticated) {
            viewModel.loadBookings()
            viewModel.loadFavorites()
            viewModel.loadConversations()
            viewModel.refreshRenterVerification()
        }
    }

    val tripsCount = (bookingsState as? UiState.Success)?.data?.size ?: 0
    val savedCount = (favoritesState as? UiState.Success)?.data?.size ?: 0
    val unreadCount = (conversationsState as? UiState.Success)?.data?.sumOf { it.unread_count ?: 0 } ?: 0
    val isProfileLoading = isAuthenticated && bootstrapping && me == null

    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = {
            isRefreshing = true
            if (isAuthenticated) {
                viewModel.loadBookings()
                viewModel.loadFavorites()
                viewModel.loadConversations()
                viewModel.refreshRenterVerification(force = true)
            }
            scope.launch {
                delay(900)
                isRefreshing = false
            }
        },
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues),
    ) {
        LazyColumn(
            state = listState,
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 28.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            item(key = "header") {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                    Text(
                        "More",
                        fontSize = 30.sp,
                        fontWeight = FontWeight.Bold,
                        color = colors.brandNavy,
                        modifier = Modifier.weight(1f),
                    )
                    PressableSurface(
                        onClick = { onOpenSettings(false) },
                        shape = CircleShape,
                        modifier = Modifier.size(42.dp).coachTarget("more.settings"),
                    ) {
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                            Icon(Icons.Outlined.Settings, contentDescription = "Settings", tint = colors.brandNavy)
                        }
                    }
                }
            }

            item(key = "hero") {
                StaggeredAppear(index = 0, modifier = Modifier.coachTarget("more.profile")) {
                    when {
                        !isAuthenticated -> GuestHeroCard(onLogin = onOpenAuth)
                        isProfileLoading -> MoreHeroSkeleton()
                        else -> ProfileHeroCard(me = me, onClick = onOpenProfileOverview)
                    }
                }
            }

            item(key = "actions") {
                StaggeredAppear(index = 1, modifier = Modifier.coachTarget("more.quick")) {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            QuickActionTile(
                                title = "Trips",
                                subtitle = when {
                                    !isAuthenticated -> "Sign in to see trips"
                                    tripsCount == 0 -> "No trips yet"
                                    else -> "$tripsCount ${if (tripsCount == 1) "trip" else "trips"}"
                                },
                                icon = Icons.Outlined.CalendarMonth,
                                tint = colors.brandBlue,
                                modifier = Modifier.weight(1f),
                            ) {
                                if (isAuthenticated) onOpenTrips() else viewModel.requireAuthentication(
                                    message = "Sign in or sign up to view your trips.",
                                    destination = NavRoutes.main(MainTab.TRIPS),
                                )
                            }
                            QuickActionTile(
                                title = "Messages",
                                subtitle = when {
                                    !isAuthenticated -> "Chat with hosts"
                                    unreadCount == 0 -> "All caught up"
                                    else -> "$unreadCount unread"
                                },
                                icon = Icons.Outlined.ChatBubbleOutline,
                                tint = colors.success,
                                badge = unreadCount,
                                modifier = Modifier.weight(1f),
                            ) {
                                if (isAuthenticated) onOpenMessages() else viewModel.requireAuthentication(
                                    message = "Sign in or sign up to view your messages.",
                                    destination = NavRoutes.Messages,
                                )
                            }
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            QuickActionTile(
                                title = "Saved",
                                subtitle = if (savedCount == 0) "Nothing saved yet" else "$savedCount ${if (savedCount == 1) "car" else "cars"}",
                                icon = Icons.Outlined.FavoriteBorder,
                                tint = colors.danger,
                                modifier = Modifier.weight(1f),
                            ) {
                                if (isAuthenticated) onOpenSaved() else viewModel.requireAuthentication(
                                    message = "Sign in or sign up to open your saved listings.",
                                    destination = NavRoutes.main(MainTab.SAVED),
                                )
                            }
                            QuickActionTile(
                                title = "Dashboard",
                                subtitle = "Spend & activity",
                                icon = Icons.Outlined.Dashboard,
                                tint = colors.warning,
                                modifier = Modifier.weight(1f),
                            ) {
                                if (isAuthenticated) onOpenDashboard() else viewModel.requireAuthentication(
                                    message = "Sign in or sign up to open your dashboard.",
                                    destination = NavRoutes.Dashboard,
                                )
                            }
                        }
                    }
                }
            }

            if (isAuthenticated) {
                item(key = "identity") {
                    StaggeredAppear(index = 2) {
                        GroupCard(title = "Identity") {
                            RenterVerificationRow(state = renterVerification, onClick = onOpenVerification)
                        }
                    }
                }
            }

            item(key = "hosting") {
                StaggeredAppear(index = 2) {
                    GroupCard(title = "Hosting") {
                        HostingSection(
                            viewModel = viewModel,
                            onOpenBecomeHost = onOpenBecomeHost,
                            onOpenHostDashboard = onOpenHostDashboard,
                        )
                    }
                }
            }

            item(key = "preferences") {
                StaggeredAppear(index = 3) {
                    GroupCard(title = "Preferences") {
                        NavRow(
                            icon = Icons.Outlined.Settings,
                            tint = colors.brandNavy,
                            title = "Settings",
                            subtitle = "Appearance, app icon, notifications, privacy",
                            onClick = { onOpenSettings(false) },
                        )
                    }
                }
            }

            item(key = "support") {
                StaggeredAppear(index = 4) {
                    GroupCard(title = "Support & legal") {
                        NavRow(Icons.Outlined.MailOutline, colors.brandBlue, "Contact us", "We reply within a day", onOpenContact)
                        RowDivider()
                        NavRow(Icons.Outlined.Shield, colors.success, "Protection", "What's covered on every trip", onOpenProtection)
                        RowDivider()
                        NavRow(Icons.Outlined.CalendarMonth, colors.warning, "Cancellation policy", "Refund tiers and timing", onOpenCancellation)
                        RowDivider()
                        NavRow(Icons.Outlined.Public, colors.mutedText, "Privacy", "How we handle your data", onOpenPrivacy)
                        RowDivider()
                        NavRow(Icons.Outlined.Description, colors.brandBlue, "Terms of Service", "The agreement for using Hayame", onOpenTerms)
                    }
                }
            }

            if (me.isAdmin()) {
                item(key = "admin") {
                    StaggeredAppear(index = 5) {
                        GroupCard(title = "Admin") {
                            NavRow(Icons.Outlined.AdminPanelSettings, colors.brandBlue, "Admin panel", "Approvals, listings and users", onOpenAdmin)
                        }
                    }
                }
            }

            item(key = "footer") {
                StaggeredAppear(index = 6) {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        if (isAuthenticated) {
                            SignOutButton { viewModel.logout() }
                        }
                        Text(
                            "Hayame v${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})",
                            style = MaterialTheme.typography.labelLarge,
                            color = colors.mutedText,
                        )
                    }
                }
            }
        }
    }
}

// MARK: Profile page -----------------------------------------------------------------------------

@Composable
fun ProfileOverviewScreen(
    viewModel: AppViewModel,
    onBack: () -> Unit,
    onEditProfile: () -> Unit,
    onOpenTrips: () -> Unit,
    onOpenSaved: () -> Unit,
    onOpenMessages: () -> Unit,
    onOpenBecomeHost: () -> Unit,
    onOpenHostDashboard: () -> Unit,
    onOpenAuth: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val bootstrapping by viewModel.bootstrapping.collectAsState()
    val me by viewModel.me.collectAsState()
    val bookingsState by viewModel.bookingsState.collectAsState()
    val favoritesState by viewModel.favoritesState.collectAsState()
    val conversationsState by viewModel.conversationsState.collectAsState()
    var statsRevealed by remember { mutableStateOf(false) }

    LaunchedEffect(isAuthenticated) {
        if (isAuthenticated) {
            viewModel.loadBookings()
            viewModel.loadFavorites()
            viewModel.loadConversations()
        }
        delay(320)
        statsRevealed = true
    }

    val completeness = remember(me) { ProfileCompleteness(me) }
    val name = me.preferredFullName() ?: if (isAuthenticated) "Your profile" else "Guest"
    val email = me.preferredEmail().orEmpty()
    val location = listOfNotNull(me.preferredCity(), me.preferredRegion()).filter { it.isNotBlank() }.joinToString(", ")
    val hostStatus = (me?.host_application_status ?: me?.host_status ?: "").trim().lowercase()
    val isHost = me?.is_host == true || hostStatus == "approved"
    val roleLabel = when {
        me.isAdmin() -> "Admin"
        isHost -> "Host"
        isAuthenticated -> "Renter"
        else -> "Guest"
    }
    val roleIcon = when {
        me.isAdmin() -> Icons.Outlined.AdminPanelSettings
        isHost -> Icons.Outlined.Key
        else -> Icons.Outlined.DirectionsCar
    }
    val isHeaderLoading = isAuthenticated && bootstrapping && me == null
    val isStatsLoading = bookingsState is UiState.Loading || favoritesState is UiState.Loading
    val tripsCount = (bookingsState as? UiState.Success)?.data?.size ?: 0
    val savedCount = (favoritesState as? UiState.Success)?.data?.size ?: 0
    val chatsCount = (conversationsState as? UiState.Success)?.data?.size ?: 0

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = {
            ScreenTopBar(title = "Profile", onBack = onBack) {
                if (isAuthenticated) {
                    TextButton(onClick = onEditProfile) {
                        Text("Edit", color = colors.brandBlue, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        },
    ) { inner ->
        HayameRefreshBox(
            onRefresh = { viewModel.refreshProfile(); viewModel.loadBookings(); viewModel.loadFavorites(); viewModel.loadConversations() },
            modifier = Modifier.fillMaxSize(),
            indicatorTopPadding = inner.calculateTopPadding(),
        ) {
        LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(inner),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp),
            ) {
                item(key = "hero") {
                    StaggeredAppear(index = 0) {
                        if (isHeaderLoading) {
                            ProfileHeaderSkeleton()
                        } else {
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                                Box {
                                    AvatarRing(size = 116.dp, strokeWidth = 3.dp) {
                                        RemoteAvatar(
                                            imageUrl = resolveAppImage(me.preferredAvatarRaw()),
                                            name = name,
                                            fallback = "U",
                                            size = 98.dp,
                                            textStyle = MaterialTheme.typography.headlineLarge,
                                        )
                                    }
                                    if (isAuthenticated) {
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
                                }
                                Spacer(Modifier.height(14.dp))
                                Text(name, fontSize = 26.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy, textAlign = TextAlign.Center)
                                if (email.isNotBlank()) {
                                    Spacer(Modifier.height(4.dp))
                                    Text(email, style = MaterialTheme.typography.bodyLarge, color = colors.mutedText)
                                }
                                Spacer(Modifier.height(12.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    RoleChip(text = roleLabel, icon = roleIcon)
                                    if (location.isNotBlank()) RoleChip(text = location, icon = Icons.Outlined.LocationOn)
                                }
                            }
                        }
                    }
                }

                item(key = "stats") {
                    StaggeredAppear(index = 1) {
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            if (isStatsLoading) {
                                repeat(3) { HayameShimmerBlock(modifier = Modifier.weight(1f).height(84.dp), cornerRadius = 18.dp) }
                            } else {
                                StatTile(value = tripsCount, title = "Trips", icon = Icons.Outlined.CalendarMonth, tint = colors.brandBlue, revealed = statsRevealed, modifier = Modifier.weight(1f), onClick = onOpenTrips)
                                StatTile(value = savedCount, title = "Saved", icon = Icons.Outlined.FavoriteBorder, tint = colors.danger, revealed = statsRevealed, modifier = Modifier.weight(1f), onClick = onOpenSaved)
                                StatTile(value = chatsCount, title = "Chats", icon = Icons.Outlined.ChatBubbleOutline, tint = colors.success, revealed = statsRevealed, modifier = Modifier.weight(1f), onClick = onOpenMessages)
                            }
                        }
                    }
                }

                if (isAuthenticated && completeness.fraction < 1f) {
                    item(key = "completeness") {
                        StaggeredAppear(index = 2) {
                            CompletenessCard(completeness = completeness, revealed = statsRevealed, onFinish = onEditProfile)
                        }
                    }
                }

                item(key = "details") {
                    StaggeredAppear(index = 3) {
                        GroupCard(title = "Personal details", actionTitle = if (isAuthenticated) "Edit" else null, onAction = onEditProfile) {
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

                item(key = "hosting") {
                    StaggeredAppear(index = 4) {
                        GroupCard(title = "Hosting") {
                            HostingSection(viewModel = viewModel, onOpenBecomeHost = onOpenBecomeHost, onOpenHostDashboard = onOpenHostDashboard)
                        }
                    }
                }

                item(key = "footer") {
                    StaggeredAppear(index = 5) {
                        if (isAuthenticated) {
                            SignOutButton { viewModel.logout() }
                        } else {
                            GradientPillButton(text = "Log in / Sign up", modifier = Modifier.fillMaxWidth(), onClick = onOpenAuth)
                        }
                    }
                }
            }
        }
    }
}

// MARK: Settings ---------------------------------------------------------------------------------

@Composable
fun SettingsScreen(
    viewModel: AppViewModel,
    highlightAppearance: Boolean = false,
    onBack: () -> Unit,
    onEditProfile: () -> Unit,
    onOpenProfileOverview: () -> Unit,
    onOpenBecomeHost: () -> Unit,
    onOpenHostDashboard: () -> Unit,
    onOpenProtection: () -> Unit,
    onOpenCancellation: () -> Unit,
    onOpenPrivacy: () -> Unit,
    onOpenAuth: () -> Unit,
    onOpenTerms: () -> Unit = {},
    onOpenDeleteAccount: () -> Unit = {},
) {
    val coachMarks = LocalCoachMarks.current
    val settingsContext = LocalContext.current
    // Flips after "Replay all tips" so the row itself confirms the tap worked.
    var tipsReplayed by rememberSaveable { mutableStateOf(false) }
    val colors = LocalHayameColors.current
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val darkModeEnabled by viewModel.darkModeEnabled.collectAsState()
    val appearanceMode by viewModel.appearanceMode.collectAsState()
    val notificationPreferences by viewModel.notificationPreferences.collectAsState()
    var analyticsEnabled by remember { mutableStateOf(AnalyticsService.hasConsent()) }
    var glowAppearance by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()

    LaunchedEffect(highlightAppearance) {
        if (!highlightAppearance) return@LaunchedEffect
        delay(350)
        listState.animateScrollToItem(1)
        glowAppearance = true
        delay(2_800)
        glowAppearance = false
    }

    val glowColor by animateColorAsState(
        targetValue = if (glowAppearance) colors.brandBlue else Color.Transparent,
        animationSpec = tween(420),
        label = "appearance-glow",
    )

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = { ScreenTopBar(title = "Settings", onBack = onBack) },
    ) { inner ->
        HayameRefreshBox(
            onRefresh = { viewModel.refreshProfile(); viewModel.loadNotificationPreferences() },
            modifier = Modifier.fillMaxSize(),
            indicatorTopPadding = inner.calculateTopPadding(),
        ) {
        LazyColumn(
                state = listState,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(inner),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp),
            ) {
                item(key = "account") {
                    StaggeredAppear(index = 0) {
                        GroupCard(title = "Account") {
                            if (isAuthenticated) {
                                NavRow(Icons.Outlined.Edit, colors.brandBlue, "Edit profile", "Name, phone, photo and location", onEditProfile)
                                RowDivider()
                                NavRow(Icons.Outlined.PersonOutline, colors.brandNavy, "View profile", "Trips, saved cars and progress", onOpenProfileOverview)
                            } else {
                                NavRow(Icons.Outlined.PersonOutline, colors.brandBlue, "Log in / Sign up", "Book cars and message hosts", onOpenAuth)
                            }
                        }
                    }
                }

                item(key = "appearance") {
                    StaggeredAppear(index = 1) {
                        GroupCard(
                            title = "Appearance",
                            border = BorderStroke(2.dp, glowColor),
                        ) {
                            AppearanceModeRow(mode = appearanceMode, onSelect = { viewModel.setAppearanceMode(it) })
                            RowDivider()
                            AppIconPickerSection(modifier = Modifier.padding(16.dp))
                        }
                    }
                }

                coachMarks?.let { tips ->
                    item(key = "tips") {
                        StaggeredAppear(index = 2) {
                            GroupCard(title = "Tips") {
                                ToggleRow(
                                    icon = Icons.Outlined.Lightbulb,
                                    tint = colors.warning,
                                    title = "Show tips",
                                    subtitle = "Point out key buttons the first time you open a screen",
                                    checked = tips.enabled,
                                    onCheckedChange = { tips.updateEnabled(it) },
                                )
                                RowDivider()
                                NavRow(
                                    icon = if (tipsReplayed) Icons.Outlined.CheckCircle else Icons.Outlined.Replay,
                                    tint = if (tipsReplayed) colors.success else colors.brandBlue,
                                    title = "Replay all tips",
                                    subtitle = if (tipsReplayed) {
                                        "Tips are on again. They'll show as you open each screen."
                                    } else {
                                        "See every screen's tour again"
                                    },
                                ) {
                                    tips.replayAll()
                                    tipsReplayed = true
                                    android.widget.Toast.makeText(
                                        settingsContext,
                                        "Tips are back on. Open any screen to see its tips again.",
                                        android.widget.Toast.LENGTH_LONG,
                                    ).show()
                                }
                            }
                        }
                    }
                }

                if (isAuthenticated) {
                    item(key = "notifications") {
                        StaggeredAppear(index = 2) {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                GroupTitle("Notifications")
                                NotificationPreferencesCard(
                                    preferences = notificationPreferences,
                                    isAuthenticated = true,
                                    onPreferenceChange = { key, enabled ->
                                        when (key) {
                                            "booking_updates" -> viewModel.updateNotificationPreference(bookingUpdates = enabled)
                                            "messages" -> viewModel.updateNotificationPreference(messages = enabled)
                                            "account_security" -> viewModel.updateNotificationPreference(accountSecurity = enabled)
                                            "news_announcements" -> viewModel.updateNotificationPreference(newsAnnouncements = enabled)
                                        }
                                    },
                                )
                            }
                        }
                    }
                }

                item(key = "privacy") {
                    StaggeredAppear(index = 3) {
                        GroupCard(title = "Privacy") {
                            ToggleRow(
                                icon = Icons.Outlined.BarChart,
                                tint = colors.brandBlue,
                                title = "Share usage analytics",
                                subtitle = "Which cars people look for and where booking gets stuck",
                                checked = analyticsEnabled,
                                onCheckedChange = { enabled ->
                                    AnalyticsService.setConsent(enabled)
                                    analyticsEnabled = enabled
                                },
                            )
                            Text(
                                "We never track you across other apps or sell your data. Turning this off deletes the analytics id stored on this device.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = colors.mutedText,
                                modifier = Modifier.padding(start = 16.dp, end = 16.dp, bottom = 14.dp),
                            )
                        }
                    }
                }

                item(key = "hosting") {
                    StaggeredAppear(index = 4) {
                        GroupCard(title = "Hosting") {
                            HostingSection(viewModel = viewModel, onOpenBecomeHost = onOpenBecomeHost, onOpenHostDashboard = onOpenHostDashboard)
                        }
                    }
                }

                item(key = "about") {
                    StaggeredAppear(index = 5) {
                        GroupCard(title = "About") {
                            NavRow(Icons.Outlined.Description, colors.brandBlue, "Terms of Service", null, onOpenTerms)
                            RowDivider()
                            NavRow(Icons.Outlined.Public, colors.mutedText, "Privacy policy", null, onOpenPrivacy)
                            RowDivider()
                            NavRow(Icons.Outlined.CalendarMonth, colors.warning, "Cancellation policy", null, onOpenCancellation)
                            RowDivider()
                            NavRow(Icons.Outlined.Shield, colors.success, "Protection", null, onOpenProtection)
                            RowDivider()
                            RowLabel(icon = Icons.Outlined.Info, tint = colors.brandNavy, title = "Version", subtitle = null) {
                                Text("v${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})", style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
                            }
                        }
                    }
                }

                if (isAuthenticated) {
                    item(key = "signout") {
                        StaggeredAppear(index = 6) {
                            SignOutButton { viewModel.logout() }
                        }
                    }
                    item(key = "delete-account") {
                        StaggeredAppear(index = 7) {
                            DeleteAccountLink(onClick = onOpenDeleteAccount)
                        }
                    }
                }
            }
        }
    }
}

// MARK: App icon picker --------------------------------------------------------------------------

@Composable
fun AppIconPickerSection(modifier: Modifier = Modifier) {
    val colors = LocalHayameColors.current
    val context = LocalContext.current
    var selected by remember { mutableStateOf(AppIconManager.current(context)) }
    var changedOnce by remember { mutableStateOf(false) }

    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            RowIconChip(icon = Icons.Outlined.Apps, tint = colors.brandBlue)
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text("App icon", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold, color = colors.brandNavy)
                Text("Pick the icon shown on your home screen", style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            HayameAppIcon.entries.forEach { icon ->
                AppIconOption(
                    icon = icon,
                    selected = icon == selected,
                    modifier = Modifier.weight(1f),
                ) {
                    if (icon != selected) {
                        AppIconManager.select(context, icon)
                        selected = icon
                        changedOnce = true
                    }
                }
            }
        }
        AnimatedVisibility(visible = changedOnce, enter = fadeIn() + slideInVertically { it / 3 }) {
            Text(
                "Your launcher may take a moment to refresh the icon.",
                style = MaterialTheme.typography.bodyMedium,
                color = colors.mutedText,
            )
        }
    }
}

@Composable
private fun AppIconOption(
    icon: HayameAppIcon,
    selected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val scale by animateFloatAsState(if (selected) 1f else 0.94f, spring(stiffness = Spring.StiffnessMediumLow), label = "icon-scale")
    val border by animateColorAsState(if (selected) colors.brandBlue else colors.border, tween(220), label = "icon-border")
    // Read straight from the palette (not animated) so the card follows a light/dark switch immediately.
    val background = if (selected) colors.brandLight else colors.fieldBackground

    PressableSurface(onClick = onClick, shape = RoundedCornerShape(16.dp), containerColor = background, modifier = modifier) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 14.dp),
        ) {
            Box {
                Image(
                    painter = painterResource(id = icon.previewRes),
                    contentDescription = icon.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .size(66.dp)
                        .graphicsLayer { scaleX = scale; scaleY = scale }
                        .shadow(if (selected) 10.dp else 0.dp, RoundedCornerShape(15.dp), ambientColor = colors.brandBlue, spotColor = colors.brandBlue)
                        .clip(RoundedCornerShape(15.dp))
                        .border(if (selected) 2.5.dp else 1.dp, border, RoundedCornerShape(15.dp)),
                )
                androidx.compose.animation.AnimatedVisibility(
                    visible = selected,
                    enter = scaleIn() + fadeIn(),
                    exit = scaleOut() + fadeOut(),
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .offset(x = 7.dp, y = (-7).dp),
                ) {
                    Icon(
                        Icons.Filled.CheckCircle,
                        contentDescription = null,
                        tint = colors.brandBlue,
                        modifier = Modifier
                            .size(22.dp)
                            .background(colors.cardBackground, CircleShape),
                    )
                }
            }
            Text(icon.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
            Text(icon.subtitle, style = MaterialTheme.typography.labelLarge, color = colors.mutedText, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

// MARK: Hosting section (shared) ------------------------------------------------------------------

@Composable
private fun HostingSection(
    viewModel: AppViewModel,
    onOpenBecomeHost: () -> Unit,
    onOpenHostDashboard: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val me by viewModel.me.collectAsState()
    val hostStatus = (me?.host_application_status ?: me?.host_status ?: "").trim().lowercase()
    val isHost = me?.is_host == true || hostStatus == "approved"
    var hostModeEnabled by remember { mutableStateOf(false) }

    when {
        isHost -> ToggleRow(
            icon = Icons.Outlined.Key,
            tint = colors.brandBlue,
            title = "Host mode",
            subtitle = "Dashboard, listings, bookings and earnings",
            checked = hostModeEnabled,
            onCheckedChange = { enabled ->
                hostModeEnabled = enabled
                if (enabled) {
                    if (isAuthenticated) {
                        onOpenHostDashboard()
                    } else {
                        hostModeEnabled = false
                        viewModel.requireAuthentication(
                            message = "Sign in or sign up to access host mode.",
                            destination = NavRoutes.HostShell,
                        )
                    }
                }
            },
        )
        hostStatus == "pending" -> NavRow(
            icon = Icons.Outlined.HourglassEmpty,
            tint = colors.warning,
            title = "Application under review",
            subtitle = "We'll notify you once it's approved",
            onClick = onOpenBecomeHost,
        )
        else -> NavRow(
            icon = Icons.Outlined.DirectionsCar,
            tint = colors.success,
            title = "Become a host",
            subtitle = "List your car and start earning",
            onClick = onOpenBecomeHost,
        )
    }
}

// MARK: Building blocks ------------------------------------------------------------------------

/** Slides and fades a section into place on first composition; `index` staggers siblings. */
@Composable
fun StaggeredAppear(index: Int, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    val state = remember { MutableTransitionState(false) }
    LaunchedEffect(Unit) { state.targetState = true }
    val delay = index.coerceAtMost(10) * 55
    AnimatedVisibility(
        visibleState = state,
        modifier = modifier,
        enter = fadeIn(tween(240, delayMillis = delay)) +
            slideInVertically(tween(360, delayMillis = delay, easing = FastOutSlowInEasing)) { it / 10 },
        exit = fadeOut(tween(120)),
    ) {
        content()
    }
}

/** A clickable surface that shrinks slightly while pressed. */
@Composable
fun PressableSurface(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    shape: RoundedCornerShape = RoundedCornerShape(20.dp),
    containerColor: Color = LocalHayameColors.current.cardBackground,
    border: BorderStroke? = BorderStroke(1.dp, LocalHayameColors.current.border),
    pressedScale: Float = 0.97f,
    content: @Composable () -> Unit,
) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed) pressedScale else 1f, spring(stiffness = Spring.StiffnessMedium), label = "press-scale")
    Surface(
        onClick = onClick,
        modifier = modifier.graphicsLayer { scaleX = scale; scaleY = scale },
        shape = shape,
        color = containerColor,
        border = border,
        interactionSource = interaction,
        shadowElevation = 0.dp,
    ) {
        content()
    }
}

@Composable
private fun PressableSurface(
    onClick: () -> Unit,
    shape: androidx.compose.ui.graphics.Shape,
    modifier: Modifier = Modifier,
    containerColor: Color = LocalHayameColors.current.cardBackground,
    content: @Composable () -> Unit,
) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed) 0.92f else 1f, spring(stiffness = Spring.StiffnessMedium), label = "press-scale")
    Surface(
        onClick = onClick,
        modifier = modifier.graphicsLayer { scaleX = scale; scaleY = scale },
        shape = shape,
        color = containerColor,
        border = BorderStroke(1.dp, LocalHayameColors.current.border),
        interactionSource = interaction,
    ) {
        content()
    }
}

@Composable
private fun GroupTitle(title: String) {
    Text(
        title.uppercase(),
        style = MaterialTheme.typography.labelLarge,
        letterSpacing = 0.6.sp,
        color = LocalHayameColors.current.mutedText,
        modifier = Modifier.padding(horizontal = 4.dp),
    )
}

/** Rounded card with an optional title above it. Rows inside separate with [RowDivider]. */
@Composable
fun GroupCard(
    title: String? = null,
    actionTitle: String? = null,
    onAction: (() -> Unit)? = null,
    border: BorderStroke? = null,
    content: @Composable () -> Unit,
) {
    val colors = LocalHayameColors.current
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        if (title != null) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                Box(modifier = Modifier.weight(1f)) { GroupTitle(title) }
                if (actionTitle != null && onAction != null) {
                    TextButton(onClick = onAction) {
                        Text(actionTitle, color = colors.brandBlue, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = colors.cardBackground,
            border = border ?: BorderStroke(1.dp, colors.border),
            shadowElevation = 0.dp,
            modifier = Modifier
                .fillMaxWidth()
                .shadow(6.dp, RoundedCornerShape(20.dp), ambientColor = colors.cardShadow, spotColor = colors.cardShadow),
        ) {
            Column { content() }
        }
    }
}

@Composable
fun RowDivider() {
    HorizontalDivider(modifier = Modifier.padding(start = 62.dp), color = LocalHayameColors.current.border)
}

@Composable
internal fun RowIconChip(icon: ImageVector, tint: Color) {
    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .size(34.dp)
            .background(tint.copy(alpha = 0.13f), RoundedCornerShape(10.dp)),
    ) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(18.dp))
    }
}

@Composable
internal fun RowLabel(
    icon: ImageVector,
    tint: Color,
    title: String,
    subtitle: String?,
    modifier: Modifier = Modifier,
    trailing: @Composable () -> Unit,
) {
    val colors = LocalHayameColors.current
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 13.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        RowIconChip(icon = icon, tint = tint)
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold, color = colors.brandNavy)
            if (!subtitle.isNullOrBlank()) {
                Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText, maxLines = 2, overflow = TextOverflow.Ellipsis)
            }
        }
        trailing()
    }
}

@Composable
fun NavRow(icon: ImageVector, tint: Color, title: String, subtitle: String?, onClick: () -> Unit) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed) 0.985f else 1f, spring(stiffness = Spring.StiffnessMedium), label = "row-scale")
    RowLabel(
        icon = icon,
        tint = tint,
        title = title,
        subtitle = subtitle,
        modifier = Modifier
            .graphicsLayer { scaleX = scale; scaleY = scale }
            .clickable(interactionSource = interaction, indication = null, onClick = onClick),
    ) {
        Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = LocalHayameColors.current.mutedText.copy(alpha = 0.7f), modifier = Modifier.size(20.dp))
    }
}

/** Appearance choice: follow the phone, always light, or always dark. */
@Composable
private fun AppearanceModeRow(mode: AppearanceMode, onSelect: (AppearanceMode) -> Unit) {
    val colors = LocalHayameColors.current
    fun iconFor(option: AppearanceMode): ImageVector = when (option) {
        AppearanceMode.SYSTEM -> Icons.Outlined.PhoneAndroid
        AppearanceMode.LIGHT -> Icons.Outlined.LightMode
        AppearanceMode.DARK -> Icons.Outlined.DarkMode
    }
    Column {
        RowLabel(
            icon = iconFor(mode),
            tint = if (mode == AppearanceMode.LIGHT) colors.warning else colors.brandBlue,
            title = "Appearance",
            subtitle = mode.subtitle,
        ) {}
        Row(
            modifier = Modifier
                .padding(start = 16.dp, end = 16.dp, bottom = 14.dp)
                .fillMaxWidth()
                .background(colors.fieldBackground, CircleShape)
                .padding(4.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            AppearanceMode.entries.forEach { option ->
                val selected = option == mode
                Surface(
                    onClick = { if (!selected) onSelect(option) },
                    shape = CircleShape,
                    color = if (selected) colors.brandBlue else Color.Transparent,
                    modifier = Modifier.weight(1f),
                ) {
                    Row(
                        modifier = Modifier.padding(vertical = 9.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(iconFor(option), contentDescription = null, tint = if (selected) Color.White else colors.brandNavy, modifier = Modifier.size(14.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(option.title, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = if (selected) Color.White else colors.brandNavy)
                    }
                }
            }
        }
    }
}

@Composable
fun ToggleRow(
    icon: ImageVector,
    tint: Color,
    title: String,
    subtitle: String?,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
) {
    val colors = LocalHayameColors.current
    RowLabel(
        icon = icon,
        tint = tint,
        title = title,
        subtitle = subtitle,
        modifier = Modifier.clickable { onCheckedChange(!checked) },
    ) {
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedTrackColor = colors.brandBlue,
                checkedThumbColor = Color.White,
                uncheckedTrackColor = colors.controlStroke,
                uncheckedThumbColor = Color.White,
                uncheckedBorderColor = Color.Transparent,
            ),
        )
    }
}

@Composable
internal fun DetailRow(icon: ImageVector, title: String, value: String, placeholder: String) {
    val colors = LocalHayameColors.current
    val isEmpty = value.isBlank()
    RowLabel(icon = icon, tint = if (isEmpty) colors.mutedText else colors.brandBlue, title = title, subtitle = if (isEmpty) placeholder else value) {
        Icon(
            if (isEmpty) Icons.Outlined.Edit else Icons.Filled.CheckCircle,
            contentDescription = null,
            tint = if (isEmpty) colors.brandBlue else colors.success,
            modifier = Modifier.size(20.dp),
        )
    }
}

@Composable
internal fun RoleChip(text: String, icon: ImageVector) {
    val colors = LocalHayameColors.current
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        modifier = Modifier
            .background(colors.brandLight, CircleShape)
            .border(1.dp, colors.brandBlue.copy(alpha = 0.2f), CircleShape)
            .padding(horizontal = 12.dp, vertical = 7.dp),
    ) {
        Icon(icon, contentDescription = null, tint = colors.brandNavy, modifier = Modifier.size(14.dp))
        Text(text, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
    }
}

@Composable
internal fun QuickActionTile(
    title: String,
    subtitle: String,
    icon: ImageVector,
    tint: Color,
    modifier: Modifier = Modifier,
    badge: Int = 0,
    onClick: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val darkMode = LocalDarkMode.current
    PressableSurface(onClick = onClick, modifier = modifier, pressedScale = 0.96f) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.Top, modifier = Modifier.fillMaxWidth()) {
                // Solid tinted chip in light mode; a soft tinted fill in dark mode so the
                // icons do not glow against the dark cards.
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(40.dp)
                        .then(if (darkMode) Modifier else Modifier.shadow(8.dp, RoundedCornerShape(13.dp), ambientColor = tint, spotColor = tint))
                        .then(
                            if (darkMode) Modifier.background(tint.copy(alpha = 0.16f), RoundedCornerShape(13.dp))
                            else Modifier.background(Brush.linearGradient(listOf(tint, tint.copy(alpha = 0.72f))), RoundedCornerShape(13.dp)),
                        ),
                ) {
                    Icon(icon, contentDescription = null, tint = if (darkMode) tint else Color.White, modifier = Modifier.size(20.dp))
                }
                Spacer(Modifier.weight(1f))
                AnimatedVisibility(visible = badge > 0, enter = scaleIn() + fadeIn(), exit = scaleOut() + fadeOut()) {
                    Text(
                        if (badge > 99) "99+" else badge.toString(),
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        modifier = Modifier
                            .background(colors.danger, CircleShape)
                            .padding(horizontal = 7.dp, vertical = 3.dp),
                    )
                }
            }
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

@Composable
private fun StatTile(
    value: Int,
    title: String,
    icon: ImageVector,
    tint: Color,
    revealed: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val shown by animateIntAsState(if (revealed) value else 0, tween(700, easing = FastOutSlowInEasing), label = "stat")
    PressableSurface(onClick = onClick, modifier = modifier, shape = RoundedCornerShape(18.dp), pressedScale = 0.96f) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(18.dp))
            Text(shown.toString(), fontSize = 24.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy)
            Text(title, style = MaterialTheme.typography.labelLarge, color = colors.mutedText)
        }
    }
}

@Composable
private fun CompletenessCard(completeness: ProfileCompleteness, revealed: Boolean, onFinish: () -> Unit) {
    val colors = LocalHayameColors.current
    val progress by animateFloatAsState(if (revealed) completeness.fraction else 0f, tween(800, easing = FastOutSlowInEasing), label = "completeness")
    val percent by animateIntAsState(if (revealed) completeness.percent else 0, tween(800, easing = FastOutSlowInEasing), label = "percent")
    Surface(
        shape = RoundedCornerShape(18.dp),
        color = colors.brandLight,
        border = BorderStroke(1.dp, colors.brandBlue.copy(alpha = 0.18f)),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.AutoAwesome, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text("Complete your profile", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy, modifier = Modifier.weight(1f))
                Text("$percent%", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandBlue)
            }
            LinearProgressIndicator(
                progress = { progress },
                color = colors.brandBlue,
                trackColor = colors.brandBlue.copy(alpha = 0.15f),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(CircleShape),
            )
            Text(
                "Hosts approve faster when they can see who they're renting to. Add ${completeness.missingSummary}.",
                style = MaterialTheme.typography.bodyMedium,
                color = colors.mutedText,
            )
            SecondaryPillButton(text = "Finish profile", modifier = Modifier.fillMaxWidth(), onClick = onFinish)
        }
    }
}

@Composable
private fun ProfileHeroCard(me: MobileMeDto?, onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    val completeness = remember(me) { ProfileCompleteness(me) }
    val name = me.preferredFullName() ?: "Your profile"
    val progress by animateFloatAsState(completeness.fraction, tween(700), label = "hero-progress")

    PressableSurface(onClick = onClick, border = null, containerColor = Color.Transparent) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(22.dp))
                .background(Brush.linearGradient(listOf(colors.heroStart, colors.heroEnd)))
                .background(Brush.radialGradient(listOf(colors.heroHighlight, Color.Transparent), radius = 520f)),
        ) {
            Row(
                modifier = Modifier.padding(18.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                AvatarRing(size = 66.dp, strokeWidth = 2.5.dp, colors = listOf(Color.White, Color.White.copy(alpha = 0.25f), Color.White)) {
                    RemoteAvatar(
                        imageUrl = resolveAppImage(me.preferredAvatarRaw()),
                        name = name,
                        fallback = "U",
                        size = 54.dp,
                        textStyle = MaterialTheme.typography.titleLarge,
                    )
                }
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    Text(name, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(me.preferredEmail().orEmpty(), style = MaterialTheme.typography.bodyMedium, color = Color.White.copy(alpha = 0.78f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        LinearProgressIndicator(
                            progress = { progress },
                            color = Color.White,
                            trackColor = Color.White.copy(alpha = 0.22f),
                            modifier = Modifier
                                .width(92.dp)
                                .height(4.dp)
                                .clip(CircleShape),
                        )
                        Text("${completeness.percent}% complete", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = Color.White.copy(alpha = 0.9f))
                    }
                }
                Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = Color.White.copy(alpha = 0.8f))
            }
        }
    }
}

@Composable
private fun GuestHeroCard(onLogin: () -> Unit) {
    val colors = LocalHayameColors.current
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(Brush.linearGradient(listOf(colors.heroStart, colors.heroEnd)))
            .background(Brush.radialGradient(listOf(colors.heroHighlight, Color.Transparent), radius = 520f)),
    ) {
        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(58.dp)
                        .background(Color.White.copy(alpha = 0.18f), CircleShape),
                ) {
                    Icon(Icons.Outlined.PersonOutline, contentDescription = null, tint = Color.White, modifier = Modifier.size(30.dp))
                }
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Browsing as a guest", fontSize = 19.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("Sign in to book cars, message hosts and keep your favourites.", style = MaterialTheme.typography.bodyMedium, color = Color.White.copy(alpha = 0.8f))
                }
            }
            PressableSurface(onClick = onLogin, shape = RoundedCornerShape(999.dp), containerColor = Color.White, border = null) {
                Text(
                    "Log in / Sign up",
                    color = colors.brandBlue,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp),
                )
            }
        }
    }
}

@Composable
internal fun SignOutButton(onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    PressableSurface(
        onClick = onClick,
        shape = RoundedCornerShape(999.dp),
        border = BorderStroke(1.dp, colors.danger.copy(alpha = 0.25f)),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 13.dp),
        ) {
            Icon(Icons.AutoMirrored.Outlined.Logout, contentDescription = null, tint = colors.danger, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text("Sign out", color = colors.danger, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodyLarge)
        }
    }
}

/** The quiet way into "Delete account", under Sign out at the very end of Settings. */
@Composable
private fun DeleteAccountLink(onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        TextButton(onClick = onClick, modifier = Modifier.heightIn(min = 48.dp)) {
            Text(
                "Delete account",
                color = colors.danger,
                fontWeight = FontWeight.SemiBold,
                style = MaterialTheme.typography.bodyMedium,
            )
        }
        Text(
            "Ask us to delete your account and personal information.",
            color = colors.mutedText,
            style = MaterialTheme.typography.bodySmall,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 24.dp),
        )
    }
}

/** Rotating gradient ring around an avatar. */
@Composable
fun AvatarRing(
    size: Dp,
    strokeWidth: Dp = 3.dp,
    colors: List<Color> = listOf(
        LocalHayameColors.current.brandBlue,
        LocalHayameColors.current.brandLight,
        LocalHayameColors.current.brandBlue.copy(alpha = 0.4f),
        LocalHayameColors.current.brandBlue,
    ),
    content: @Composable () -> Unit,
) {
    val transition = rememberInfiniteTransition(label = "avatar-ring")
    val angle by transition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(8000, easing = LinearEasing)),
        label = "ring-angle",
    )
    Box(modifier = Modifier.size(size), contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.fillMaxSize().graphicsLayer { rotationZ = angle }) {
            val stroke = strokeWidth.toPx()
            drawCircle(
                brush = Brush.sweepGradient(colors),
                radius = (this.size.minDimension - stroke) / 2f,
                style = Stroke(width = stroke),
            )
        }
        Box(modifier = Modifier.size(size - strokeWidth * 2 - 6.dp).clip(CircleShape)) { content() }
    }
}

@Composable
internal fun ScreenTopBar(title: String, onBack: () -> Unit, actions: @Composable () -> Unit = {}) {
    val colors = LocalHayameColors.current
    Surface(color = colors.pageBackground) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = colors.brandNavy)
            }
            Text(
                title,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = colors.brandNavy,
                modifier = Modifier
                    .weight(1f)
                    .padding(start = 4.dp),
            )
            actions()
        }
    }
}

// MARK: Skeletons --------------------------------------------------------------------------------

@Composable
private fun MoreHeroSkeleton() {
    val colors = LocalHayameColors.current
    Surface(shape = RoundedCornerShape(22.dp), color = colors.cardBackground, border = BorderStroke(1.dp, colors.border), modifier = Modifier.fillMaxWidth()) {
        Row(modifier = Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            HayameShimmerBlock(modifier = Modifier.size(66.dp), cornerRadius = 33.dp)
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                HayameShimmerBlock(modifier = Modifier.width(150.dp).height(18.dp))
                HayameShimmerBlock(modifier = Modifier.width(190.dp).height(12.dp))
                HayameShimmerBlock(modifier = Modifier.width(110.dp).height(8.dp))
            }
        }
    }
}

@Composable
internal fun ProfileHeaderSkeleton() {
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(14.dp), modifier = Modifier.fillMaxWidth()) {
        HayameShimmerBlock(modifier = Modifier.size(116.dp), cornerRadius = 58.dp)
        HayameShimmerBlock(modifier = Modifier.width(170.dp).height(22.dp))
        HayameShimmerBlock(modifier = Modifier.width(200.dp).height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HayameShimmerBlock(modifier = Modifier.width(86.dp).height(28.dp), cornerRadius = 14.dp)
            HayameShimmerBlock(modifier = Modifier.width(120.dp).height(28.dp), cornerRadius = 14.dp)
        }
    }
}

// MARK: Helpers ----------------------------------------------------------------------------------

class ProfileCompleteness(me: MobileMeDto?) {
    private val checks: List<Pair<String, Boolean>> = listOf(
        "your name" to !me.preferredFullName().isNullOrBlank(),
        "an email" to !me.preferredEmail().isNullOrBlank(),
        "a phone number" to !me.preferredPhone().isNullOrBlank(),
        "your city" to !me.preferredCity().isNullOrBlank(),
        "a profile photo" to !me.preferredAvatarRaw().isNullOrBlank(),
    )

    val fraction: Float = checks.count { it.second }.toFloat() / checks.size
    val percent: Int = (fraction * 100).toInt()
    val missingSummary: String
        get() {
            val missing = checks.filter { !it.second }.map { it.first }
            return when (missing.size) {
                0 -> "nothing else"
                1 -> missing[0]
                else -> missing.dropLast(1).joinToString(", ") + " and " + missing.last()
            }
        }
}

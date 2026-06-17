package com.hayame.app.ui.navigation

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectTapGestures
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
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.animation.togetherWith
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.navigation.NavBackStackEntry
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.hayame.app.ui.screens.AdminShellScreen
import com.hayame.app.ui.screens.BecomeHostScreen
import com.hayame.app.ui.screens.BookingScreen
import com.hayame.app.ui.screens.CancellationPolicyScreen
import com.hayame.app.ui.screens.CarDetailScreen
import com.hayame.app.ui.screens.ContactScreen
import com.hayame.app.ui.screens.ConversationScreen
import com.hayame.app.ui.screens.GuestProfileScreen
import com.hayame.app.ui.screens.HostApplicationPendingScreen
import com.hayame.app.ui.screens.HostAvailabilityEditorScreen
import com.hayame.app.ui.screens.HostBookingsScreen
import com.hayame.app.ui.screens.HostCarEditorScreen
import com.hayame.app.ui.screens.HostCarsScreen
import com.hayame.app.ui.screens.HostDashboardScreen
import com.hayame.app.ui.screens.HostEarningsScreen
import com.hayame.app.ui.screens.HostFavoritesScreen
import com.hayame.app.ui.screens.HostListingPhotosScreen
import com.hayame.app.ui.screens.HostProfileScreen
import com.hayame.app.ui.screens.HostPublicProfileScreen
import com.hayame.app.ui.screens.HostReviewsScreen
import com.hayame.app.ui.screens.HostShell
import com.hayame.app.ui.screens.LoginScreen
import com.hayame.app.ui.screens.MainShell
import com.hayame.app.ui.screens.MarketingPagesScreen
import com.hayame.app.ui.screens.MessagesScreen
import com.hayame.app.ui.screens.PrivacyScreen
import com.hayame.app.ui.screens.ProtectionScreen
import com.hayame.app.ui.screens.RenterDashboardScreen
import com.hayame.app.ui.screens.SignupScreen
import com.hayame.app.ui.screens.SplashScreen
import com.hayame.app.ui.screens.SupportLegalScreen
import com.hayame.app.ui.viewmodel.AppViewModel
import com.hayame.app.ui.theme.LocalHayameColors
import kotlinx.coroutines.delay

private const val SplashMinimumDurationMs = 5_000L

@Composable
fun HayameNavApp(
    viewModel: AppViewModel,
    pendingConversationId: String?,
    pendingBookingId: String?,
    pendingBookingRecipientRole: String?,
    pendingPaystackCallbackUri: String?,
    pendingAnnouncementId: String?,
    pendingAnnouncementTitle: String?,
    pendingAnnouncementBody: String?,
    pendingAnnouncementCategory: String?,
    pendingAnnouncementCtaUrl: String?,
    onConversationConsumed: () -> Unit,
    onBookingConsumed: () -> Unit,
    onPaystackCallbackConsumed: () -> Unit,
    onAnnouncementConsumed: () -> Unit,
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val snackbarHostState = remember { SnackbarHostState() }

    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val isGuestMode by viewModel.isGuestMode.collectAsState()
    val me by viewModel.me.collectAsState()
    val bootstrapping by viewModel.bootstrapping.collectAsState()
    val snackbarMessage by viewModel.snackbar.collectAsState()
    val authPrompt by viewModel.authPrompt.collectAsState()
    val activeAnnouncement by viewModel.activeAnnouncement.collectAsState()
    val context = LocalContext.current
    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current
    val appearanceHighlightNonce = 0
    var hasRequestedNotificationPermission by rememberSaveable { mutableStateOf(false) }
    var visibleMainTab by rememberSaveable { mutableStateOf<MainTab?>(null) }
    var visibleHostTab by rememberSaveable { mutableStateOf<HostMainTab?>(null) }

    var pendingProtectedRoute by rememberSaveable { mutableStateOf<String?>(null) }
    var authRouteOverride by rememberSaveable { mutableStateOf<String?>(null) }

    val hasAppAccess = isAuthenticated || isGuestMode
    val latestHasAppAccess by rememberUpdatedState(hasAppAccess)
    val latestCurrentRoute by rememberUpdatedState(currentRoute)
    val hostStatus = (me?.host_application_status ?: me?.host_status ?: "").lowercase()
    val canShowAnnouncement = hasAppAccess && when (currentRoute) {
        NavRoutes.MainRoute -> visibleMainTab == MainTab.HOME
        NavRoutes.HostShell -> visibleHostTab == HostMainTab.DASHBOARD
        else -> false
    }

    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
    ) {}

    LaunchedEffect(bootstrapping, canShowAnnouncement) {
        if (
            !hasRequestedNotificationPermission &&
            !bootstrapping &&
            canShowAnnouncement &&
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
        ) {
            hasRequestedNotificationPermission = true
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    LaunchedEffect(currentRoute) {
        if (currentRoute != NavRoutes.MainRoute) visibleMainTab = null
        if (currentRoute != NavRoutes.HostShell) visibleHostTab = null
    }

    LaunchedEffect(Unit) {
        delay(SplashMinimumDurationMs)
        if (latestCurrentRoute == NavRoutes.Splash || latestCurrentRoute == null) {
            val destination = if (latestHasAppAccess) NavRoutes.main() else NavRoutes.Login
            navController.navigate(destination) {
                popUpTo(NavRoutes.Splash) { inclusive = true }
                launchSingleTop = true
            }
        }
    }

    LaunchedEffect(isAuthenticated) {
        if (isAuthenticated) {
            viewModel.registerPushIfAvailable()
        }
    }

    LaunchedEffect(pendingAnnouncementId, pendingAnnouncementTitle, pendingAnnouncementBody, pendingAnnouncementCategory, pendingAnnouncementCtaUrl) {
        val announcementId = pendingAnnouncementId
        if (announcementId.isNullOrBlank()) return@LaunchedEffect
        viewModel.showAnnouncementFromPush(
            id = announcementId,
            title = pendingAnnouncementTitle,
            body = pendingAnnouncementBody,
            category = pendingAnnouncementCategory,
            ctaUrl = pendingAnnouncementCtaUrl,
        )
        onAnnouncementConsumed()
    }

    LaunchedEffect(snackbarMessage) {
        val message = snackbarMessage ?: return@LaunchedEffect
        snackbarHostState.showSnackbar(message)
        viewModel.dismissSnackbar()
    }

    LaunchedEffect(Unit) {
        viewModel.appearanceTransitionEvents.collect {
            navController.navigate(NavRoutes.main(MainTab.HOME)) {
                popUpTo(navController.graph.findStartDestination().id) {
                    saveState = false
                }
                launchSingleTop = true
            }
        }
    }

    LaunchedEffect(bootstrapping, hasAppAccess, currentRoute, isAuthenticated, pendingProtectedRoute, authRouteOverride) {
        val authRoutes = setOf(NavRoutes.Login, NavRoutes.Signup)

        if (currentRoute == NavRoutes.Splash || currentRoute == null) return@LaunchedEffect

        if (bootstrapping) return@LaunchedEffect

        if (hasAppAccess && currentRoute in authRoutes) {
            val destination = if (isAuthenticated) {
                val next = pendingProtectedRoute ?: NavRoutes.main()
                pendingProtectedRoute = null
                next
            } else {
                NavRoutes.main()
            }
            navController.navigate(destination) {
                popUpTo(NavRoutes.Login) { inclusive = true }
                launchSingleTop = true
            }
            return@LaunchedEffect
        }

        if (!hasAppAccess && currentRoute !in authRoutes) {
            val destination = authRouteOverride ?: NavRoutes.Login
            authRouteOverride = null
            navController.navigate(destination) {
                launchSingleTop = true
            }
        }
    }

    LaunchedEffect(pendingConversationId, bootstrapping, isAuthenticated) {
        val conversationId = pendingConversationId
        if (bootstrapping || !isAuthenticated || conversationId.isNullOrBlank()) return@LaunchedEffect
        navController.navigate(NavRoutes.conversation(conversationId)) {
            launchSingleTop = true
        }
        onConversationConsumed()
    }

    LaunchedEffect(pendingBookingId, pendingBookingRecipientRole, bootstrapping, isAuthenticated) {
        val bookingId = pendingBookingId
        if (bootstrapping || !isAuthenticated || bookingId.isNullOrBlank()) return@LaunchedEffect

        val role = pendingBookingRecipientRole?.trim()?.lowercase()
        if (role == "host") {
            viewModel.focusBooking(bookingId, openHostBookings = true)
            navController.navigate(NavRoutes.HostShell) {
                launchSingleTop = true
            }
        } else {
            viewModel.focusBooking(bookingId)
            navController.navigate(NavRoutes.main(MainTab.TRIPS)) {
                launchSingleTop = true
            }
        }
        onBookingConsumed()
    }

    if (canShowAnnouncement) activeAnnouncement?.let { announcement ->
        val ctaUrl = announcement.cta_url?.takeIf { it.isNotBlank() }
        val colors = LocalHayameColors.current
        val category = announcement.category?.trim()?.lowercase()
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.36f)),
            contentAlignment = Alignment.Center,
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .widthIn(max = 390.dp)
                    .padding(20.dp)
                    .shadow(
                        elevation = 28.dp,
                        shape = RoundedCornerShape(24.dp),
                        ambientColor = Color.Black.copy(alpha = 0.18f),
                        spotColor = Color.Black.copy(alpha = 0.18f),
                    )
                    .clip(RoundedCornerShape(24.dp))
                    .background(colors.cardBackground)
                    .border(1.dp, colors.border, RoundedCornerShape(24.dp)),
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.Top,
                        horizontalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(RoundedCornerShape(24.dp))
                                .background(colors.brandBlue.copy(alpha = 0.12f)),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                text = "H",
                                color = colors.brandBlue,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Black,
                            )
                        }

                        Column(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(7.dp),
                        ) {
                            Text(
                                text = if (category == "news") "News & announcements" else "App update",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = colors.brandBlue,
                            )
                            Text(
                                text = announcement.title ?: "Hayame",
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Bold,
                                color = colors.brandNavy,
                            )
                        }

                        TextButton(
                            onClick = { viewModel.dismissActiveAnnouncement() },
                        ) {
                            Text("✕", color = colors.mutedText, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Text(
                        text = announcement.body ?: "",
                        style = MaterialTheme.typography.bodyLarge,
                        color = colors.brandNavy.copy(alpha = 0.88f),
                        maxLines = 8,
                        overflow = TextOverflow.Ellipsis,
                    )

                    if (announcement.show_once != false) {
                        Text(
                            text = "Shown once on this device.",
                            style = MaterialTheme.typography.labelMedium,
                            color = colors.mutedText,
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        if (ctaUrl != null) {
                            Button(
                                onClick = {
                                    runCatching {
                                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(ctaUrl)).apply {
                                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                        }
                                        context.startActivity(intent)
                                    }
                                    viewModel.dismissActiveAnnouncement()
                                },
                                modifier = Modifier.weight(1f),
                            ) {
                                Text(announcement.cta_label ?: "Open")
                            }
                            TextButton(
                                onClick = { viewModel.dismissActiveAnnouncement() },
                                modifier = Modifier.weight(1f),
                            ) {
                                Text(
                                    "Not now",
                                    color = colors.brandBlue,
                                    fontWeight = FontWeight.SemiBold,
                                )
                            }
                        } else {
                            Button(
                                onClick = { viewModel.dismissActiveAnnouncement() },
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Text("Got it")
                            }
                        }
                    }
                }
            }
        }
    }

    Scaffold(
        modifier = Modifier.pointerInput(Unit) {
            detectTapGestures(onTap = {
                focusManager.clearFocus()
                keyboardController?.hide()
            })
        },
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
    ) { innerPadding ->
        val isSplashRoute = currentRoute == NavRoutes.Splash || currentRoute == null
        Box(
            modifier = Modifier
                .fillMaxSize()
                .then(if (isSplashRoute) Modifier else Modifier.padding(innerPadding)),
        ) {
            NavHost(
                navController = navController,
                startDestination = NavRoutes.Splash,
                enterTransition = {
                    fadeIn(tween(260, easing = FastOutSlowInEasing)) +
                        slideInHorizontally(tween(260, easing = FastOutSlowInEasing)) { it / 14 }
                },
                exitTransition = {
                    fadeOut(tween(220, easing = FastOutSlowInEasing)) +
                        slideOutHorizontally(tween(220, easing = FastOutSlowInEasing)) { -it / 18 }
                },
                popEnterTransition = {
                    fadeIn(tween(260, easing = FastOutSlowInEasing)) +
                        slideInHorizontally(tween(260, easing = FastOutSlowInEasing)) { -it / 14 }
                },
                popExitTransition = {
                    fadeOut(tween(220, easing = FastOutSlowInEasing)) +
                        slideOutHorizontally(tween(220, easing = FastOutSlowInEasing)) { it / 18 }
                },
            ) {
                composable(NavRoutes.Splash) {
                    SplashScreen()
                }
                composable(NavRoutes.Login) {
                    LoginScreen(
                        viewModel = viewModel,
                        onSignup = { navController.navigate(NavRoutes.Signup) },
                        onContinueAsGuest = {
                            pendingProtectedRoute = null
                            authRouteOverride = null
                            viewModel.continueAsGuest()
                            navController.navigate(NavRoutes.main()) {
                                popUpTo(NavRoutes.Login) { inclusive = true }
                            }
                        },
                    )
                }
                composable(NavRoutes.Signup) {
                    SignupScreen(
                        viewModel = viewModel,
                        onBackToLogin = { navController.popBackStack() },
                    )
                }
                composable(
                    route = NavRoutes.MainRoute,
                    arguments = listOf(
                        navArgument("tab") {
                            type = NavType.StringType
                            nullable = true
                            defaultValue = "home"
                        },
                    ),
                ) { backStack ->
                    val initialTab = parseMainTab(backStack.arguments?.getString("tab"))
                    MainShell(
                        viewModel = viewModel,
                        initialTab = initialTab,
                        onSelectedTabChanged = {
                            visibleMainTab = it
                            visibleHostTab = null
                        },
                        onOpenCarDetail = { navController.navigate(NavRoutes.carDetail(it)) },
                        onOpenConversation = { navController.navigate(NavRoutes.conversation(it)) },
                        // Land on the More tab when returning from Messages by
                        // placing it beneath Messages on the back stack.
                        onOpenMessages = {
                            navController.navigate(NavRoutes.main(MainTab.MORE))
                            navController.navigate(NavRoutes.Messages)
                        },
                        onOpenDashboard = { navController.navigate(NavRoutes.Dashboard) },
                        onOpenBecomeHost = { navController.navigate(NavRoutes.BecomeHost) },
                        onOpenHostDashboard = { navController.navigate(NavRoutes.HostShell) },
                        onOpenHostVehicles = {
                            viewModel.requestHostTab(HostMainTab.CARS)
                            navController.navigate(NavRoutes.HostShell)
                        },
                        onOpenTrips = { navController.navigate(NavRoutes.main(MainTab.TRIPS)) },
                        onOpenProfile = { navController.navigate(NavRoutes.Profile) },
                        onOpenContact = { navController.navigate(NavRoutes.Contact) },
                        onOpenProtection = { navController.navigate(NavRoutes.Protection) },
                        onOpenCancellation = { navController.navigate(NavRoutes.Cancellation) },
                        onOpenPrivacy = { navController.navigate(NavRoutes.Privacy) },
                        onOpenAuth = { navController.navigate(NavRoutes.Login) },
                        onOpenAdmin = { navController.navigate(NavRoutes.AdminShell) },
                        appearanceHighlightNonce = appearanceHighlightNonce,
                    )
                }
                composable(NavRoutes.Dashboard) {
                    RenterDashboardScreen(
                        viewModel = viewModel,
                        onBack = { navController.popBackStack() },
                        onOpenTrips = { navController.navigate(NavRoutes.main(MainTab.TRIPS)) },
                        onOpenSaved = { navController.navigate(NavRoutes.main(MainTab.SAVED)) },
                        onOpenMessages = {
                            navController.navigate(NavRoutes.main(MainTab.MORE))
                            navController.navigate(NavRoutes.Messages)
                        },
                        onOpenBecomeHost = {
                            if (hostStatus == "pending") {
                                navController.navigate(NavRoutes.HostPending)
                            } else {
                                navController.navigate(NavRoutes.BecomeHost)
                            }
                        },
                        onOpenHostDashboard = { navController.navigate(NavRoutes.HostShell) },
                        onOpenHostVehicles = {
                            viewModel.requestHostTab(HostMainTab.CARS)
                            navController.navigate(NavRoutes.HostShell)
                        },
                    )
                }
                composable(NavRoutes.HostShell) {
                    HostShell(
                        viewModel = viewModel,
                        onSelectedTabChanged = {
                            visibleHostTab = it
                            visibleMainTab = null
                        },
                        onExitHostMode = {
                            val popped = navController.popBackStack()
                            if (!popped) {
                                navController.navigate(NavRoutes.main()) { launchSingleTop = true }
                            }
                        },
                        onOpenConversation = { navController.navigate(NavRoutes.conversation(it)) },
                        onOpenCarEditor = { carId -> navController.navigate(NavRoutes.hostCarEditor(carId)) },
                        onOpenListingPhotos = { carId -> navController.navigate(NavRoutes.hostListingPhotos(carId)) },
                        onOpenAvailability = { carId -> navController.navigate(NavRoutes.hostAvailability(carId)) },
                        onOpenFavorites = { navController.navigate(NavRoutes.HostFavorites) },
                        onOpenContact = { navController.navigate(NavRoutes.Contact) },
                        onOpenProtection = { navController.navigate(NavRoutes.Protection) },
                        onOpenCancellation = { navController.navigate(NavRoutes.Cancellation) },
                        onOpenReviews = { navController.navigate(NavRoutes.HostReviews) },
                    )
                }
                composable(
                    route = NavRoutes.CarDetail + "/{carId}",
                    arguments = listOf(navArgument("carId") { type = NavType.StringType }),
                ) { backStack ->
                    val carId = backStack.arguments?.getString("carId").orEmpty()
                    CarDetailScreen(
                        viewModel = viewModel,
                        carId = carId,
                        onBack = { navController.popBackStack() },
                        onBook = { navController.navigate(NavRoutes.booking(it)) },
                        onOpenConversation = { navController.navigate(NavRoutes.conversation(it)) },
                        onOpenProtection = { navController.navigate(NavRoutes.Protection) },
                        onOpenHostProfile = { ownerId ->
                            if (ownerId.isNotBlank()) navController.navigate(NavRoutes.hostPublicProfile(ownerId))
                        },
                    )
                }
                composable(
                    route = NavRoutes.Booking + "/{carId}",
                    arguments = listOf(navArgument("carId") { type = NavType.StringType }),
                ) { backStack ->
                    val carId = backStack.arguments?.getString("carId").orEmpty()
                    BookingScreen(
                        viewModel = viewModel,
                        carId = carId,
                        pendingPaystackCallbackUri = pendingPaystackCallbackUri,
                        onBack = { navController.popBackStack() },
                        onOpenConversation = { navController.navigate(NavRoutes.conversation(it)) },
                        onBookingCompleted = {
                            navController.navigate(NavRoutes.main(MainTab.TRIPS)) {
                                popUpTo(NavRoutes.MainRoute) { inclusive = true }
                                launchSingleTop = true
                            }
                        },
                        onPaystackCallbackConsumed = onPaystackCallbackConsumed,
                    )
                }
                composable(NavRoutes.Messages) {
                    MessagesScreen(
                        viewModel = viewModel,
                        onBack = { navController.popBackStack() },
                        onOpenConversation = { navController.navigate(NavRoutes.conversation(it)) },
                    )
                }
                composable(
                    route = NavRoutes.Conversation + "/{conversationId}",
                    arguments = listOf(navArgument("conversationId") { type = NavType.StringType }),
                ) { backStack ->
                    val conversationId = backStack.arguments?.getString("conversationId").orEmpty()
                    ConversationScreen(
                        viewModel = viewModel,
                        conversationId = conversationId,
                        onBack = { navController.popBackStack() },
                    )
                }
                composable(NavRoutes.BecomeHost) {
                    BecomeHostScreen(
                        viewModel = viewModel,
                        onBack = { navController.popBackStack() },
                    )
                }
                composable(NavRoutes.HostPending) {
                    HostApplicationPendingScreen(
                        viewModel = viewModel,
                        onBack = { navController.popBackStack() },
                        onOpenBecomeHost = { navController.navigate(NavRoutes.BecomeHost) },
                    )
                }
                composable(NavRoutes.HostDashboard) {
                    HostDashboardScreen(
                        viewModel = viewModel,
                        onBack = { navController.popBackStack() },
                        onOpenCars = { navController.navigate(NavRoutes.HostCars) },
                        onOpenCreateCar = { navController.navigate(NavRoutes.hostCarEditor(null)) },
                        onOpenBookings = { navController.navigate(NavRoutes.HostBookings) },
                        onOpenEarnings = { navController.navigate(NavRoutes.HostEarnings) },
                        onOpenMessages = { navController.navigate(NavRoutes.Messages) },
                        onOpenFavorites = { navController.navigate(NavRoutes.HostFavorites) },
                        onOpenReviews = { navController.navigate(NavRoutes.HostReviews) },
                        onOpenProfile = { navController.navigate(NavRoutes.HostProfile) },
                    )
                }
                composable(NavRoutes.HostCars) {
                    HostCarsScreen(
                        viewModel = viewModel,
                        onBack = { navController.popBackStack() },
                        onCreate = { navController.navigate(NavRoutes.hostCarEditor(null)) },
                        onEdit = { navController.navigate(NavRoutes.hostCarEditor(it)) },
                        onOpenPhotos = { navController.navigate(NavRoutes.hostListingPhotos(it)) },
                        onOpenAvailability = { navController.navigate(NavRoutes.hostAvailability(it)) },
                    )
                }
                composable(
                    route = NavRoutes.HostCarEditor + "/{carId}",
                    arguments = listOf(navArgument("carId") { type = NavType.StringType }),
                ) { backStack ->
                    val carId = backStack.arguments?.getString("carId")
                    HostCarEditorScreen(
                        viewModel = viewModel,
                        carId = carId,
                        onBack = { navController.popBackStack() },
                        onOpenPhotos = { navController.navigate(NavRoutes.hostListingPhotos(it)) },
                        onOpenAvailability = { navController.navigate(NavRoutes.hostAvailability(it)) },
                    )
                }
                composable(
                    route = NavRoutes.HostListingPhotos + "/{carId}",
                    arguments = listOf(navArgument("carId") { type = NavType.StringType }),
                ) { backStack ->
                    val carId = backStack.arguments?.getString("carId").orEmpty()
                    HostListingPhotosScreen(
                        viewModel = viewModel,
                        carId = carId,
                        onBack = { navController.popBackStack() },
                    )
                }
                composable(
                    route = NavRoutes.HostAvailability + "/{carId}",
                    arguments = listOf(navArgument("carId") { type = NavType.StringType }),
                ) { backStack ->
                    val carId = backStack.arguments?.getString("carId").orEmpty()
                    HostAvailabilityEditorScreen(
                        viewModel = viewModel,
                        carId = carId,
                        onBack = { navController.popBackStack() },
                    )
                }
                composable(NavRoutes.HostBookings) {
                    HostBookingsScreen(
                        viewModel = viewModel,
                        onBack = { navController.popBackStack() },
                        onOpenConversation = { navController.navigate(NavRoutes.conversation(it)) },
                    )
                }
                composable(NavRoutes.HostEarnings) {
                    HostEarningsScreen(
                        viewModel = viewModel,
                        onBack = { navController.popBackStack() },
                    )
                }
                composable(NavRoutes.HostReviews) {
                    HostReviewsScreen(
                        viewModel = viewModel,
                        onBack = { navController.popBackStack() },
                    )
                }
                composable(NavRoutes.HostFavorites) {
                    HostFavoritesScreen(
                        viewModel = viewModel,
                        onBack = { navController.popBackStack() },
                    )
                }
                composable(NavRoutes.HostProfile) {
                    HostProfileScreen(
                        viewModel = viewModel,
                        onBack = { navController.popBackStack() },
                        onOpenReviews = { navController.navigate(NavRoutes.HostReviews) },
                        onOpenFavorites = { navController.navigate(NavRoutes.HostFavorites) },
                        onOpenContact = { navController.navigate(NavRoutes.Contact) },
                        onOpenProtection = { navController.navigate(NavRoutes.Protection) },
                        onOpenCancellation = { navController.navigate(NavRoutes.Cancellation) },
                        onTurnOffHostMode = { navController.popBackStack() },
                    )
                }
                composable(NavRoutes.Profile) {
                    GuestProfileScreen(
                        viewModel = viewModel,
                        onBack = { navController.popBackStack() },
                    )
                }
                composable(NavRoutes.SupportLegal) {
                    SupportLegalScreen(
                        onBack = { navController.popBackStack() },
                        onOpenContact = { navController.navigate(NavRoutes.Contact) },
                        onOpenPrivacy = { navController.navigate(NavRoutes.Privacy) },
                        onOpenProtection = { navController.navigate(NavRoutes.Protection) },
                        onOpenCancellation = { navController.navigate(NavRoutes.Cancellation) },
                        onOpenMarketing = { navController.navigate(NavRoutes.Marketing) },
                    )
                }
                composable(NavRoutes.Contact) {
                    ContactScreen(onBack = { navController.popBackStack() })
                }
                composable(NavRoutes.Privacy) {
                    PrivacyScreen(onBack = { navController.popBackStack() })
                }
                composable(NavRoutes.Protection) {
                    ProtectionScreen(onBack = { navController.popBackStack() })
                }
                composable(NavRoutes.Cancellation) {
                    CancellationPolicyScreen(onBack = { navController.popBackStack() })
                }
                composable(NavRoutes.Marketing) {
                    MarketingPagesScreen(onBack = { navController.popBackStack() })
                }
                composable(
                    route = NavRoutes.HostPublicProfile + "/{ownerId}",
                    arguments = listOf(navArgument("ownerId") { type = NavType.StringType }),
                ) { backStack ->
                    val ownerId = backStack.arguments?.getString("ownerId").orEmpty()
                    HostPublicProfileScreen(
                        viewModel = viewModel,
                        ownerId = ownerId,
                        onBack = { navController.popBackStack() },
                        onOpenCarDetail = { navController.navigate(NavRoutes.carDetail(it)) },
                    )
                }
                composable(NavRoutes.AdminShell) {
                    AdminShellScreen(
                        viewModel = viewModel,
                        onExitAdmin = {
                            val popped = navController.popBackStack()
                            if (!popped) navController.navigate(NavRoutes.HostShell) { launchSingleTop = true }
                        },
                        onOpenConversation = { navController.navigate(NavRoutes.conversation(it)) },
                    )
                }
            }

            authPrompt?.let { prompt ->
                AlertDialog(
                    onDismissRequest = { viewModel.dismissAuthPrompt() },
                    title = { Text("Sign in required") },
                    text = { Text(prompt.message) },
                    confirmButton = {
                        Button(
                            onClick = {
                                pendingProtectedRoute = prompt.destination ?: resolvedDestination(navBackStackEntry) ?: NavRoutes.main()
                                authRouteOverride = NavRoutes.Login
                                viewModel.returnToAuth()
                            },
                        ) {
                            Text("Sign in")
                        }
                    },
                    dismissButton = {
                        TextButton(
                            onClick = {
                                pendingProtectedRoute = prompt.destination ?: resolvedDestination(navBackStackEntry) ?: NavRoutes.main()
                                authRouteOverride = NavRoutes.Signup
                                viewModel.returnToAuth()
                            },
                        ) {
                            Text("Sign up")
                        }
                    },
                )
            }

        }
    }
}

private fun resolvedDestination(entry: NavBackStackEntry?): String? {
    val route = entry?.destination?.route ?: return null
    val arguments = entry.arguments
    return when (route) {
        NavRoutes.MainRoute -> NavRoutes.main(parseMainTab(arguments?.getString("tab")))
        NavRoutes.CarDetail + "/{carId}" -> arguments?.getString("carId")?.let(NavRoutes::carDetail)
        NavRoutes.Booking + "/{carId}" -> arguments?.getString("carId")?.let(NavRoutes::booking)
        NavRoutes.Conversation + "/{conversationId}" -> arguments?.getString("conversationId")?.let(NavRoutes::conversation)
        NavRoutes.HostCarEditor + "/{carId}" -> arguments?.getString("carId")?.let(NavRoutes::hostCarEditor)
        NavRoutes.HostListingPhotos + "/{carId}" -> arguments?.getString("carId")?.let(NavRoutes::hostListingPhotos)
        NavRoutes.HostAvailability + "/{carId}" -> arguments?.getString("carId")?.let(NavRoutes::hostAvailability)
        else -> route
    }
}

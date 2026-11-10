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
import androidx.compose.foundation.layout.calculateEndPadding
import androidx.compose.foundation.layout.calculateStartPadding
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
import androidx.compose.animation.scaleOut
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
import androidx.compose.material3.Icon
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.Icons
import androidx.compose.material3.TextButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalLayoutDirection
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
import com.hayame.app.ui.screens.CarDetailScreen
import com.hayame.app.ui.screens.ContactScreen
import com.hayame.app.ui.screens.DeleteAccountScreen
import com.hayame.app.ui.screens.LegalDocumentKind
import com.hayame.app.ui.screens.LegalDocumentScreen
import com.hayame.app.ui.screens.ConversationScreen
import com.hayame.app.ui.screens.GuestProfileScreen
import com.hayame.app.ui.screens.HostApplicationPendingScreen
import com.hayame.app.ui.screens.HostAvailabilityEditorScreen
import com.hayame.app.ui.screens.HostCarEditorScreen
import com.hayame.app.ui.screens.HostFavoritesScreen
import com.hayame.app.ui.screens.HostListingPhotosScreen
import com.hayame.app.ui.screens.HostPublicProfileScreen
import com.hayame.app.ui.screens.HostReviewsScreen
import com.hayame.app.ui.screens.HostShell
import com.hayame.app.ui.screens.LoginScreen
import com.hayame.app.ui.screens.MainShell
import com.hayame.app.ui.screens.ProfileOverviewScreen
import com.hayame.app.ui.screens.ResumableCheckoutUi
import com.hayame.app.ui.screens.RenterVerificationScreen
import com.hayame.app.ui.screens.ResumeCheckoutScreen
import com.hayame.app.ui.screens.SettingsScreen
import com.hayame.app.ui.screens.MarketingPagesScreen
import com.hayame.app.ui.screens.MessagesScreen
import com.hayame.app.ui.screens.RenterDashboardScreen
import com.hayame.app.ui.screens.SignupScreen
import com.hayame.app.ui.screens.SplashScreen
import androidx.compose.ui.semantics.clearAndSetSemantics
import com.hayame.app.ui.screens.SupportLegalScreen
import com.hayame.app.ui.screens.TermsScreen
import com.hayame.app.ui.components.HostModeSwitchOverlay
import com.hayame.app.ui.viewmodel.AppViewModel
import com.hayame.app.ui.theme.LocalHayameColors
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// Long enough for the splash to draw the wordmark, slide the car in and show the loader dots.
private const val SplashMinimumDurationMs = 1_400L

@Composable
fun HayameNavApp(
    viewModel: AppViewModel,
    pendingConversationId: String?,
    pendingBookingId: String?,
    pendingBookingRecipientRole: String?,
    pendingCarId: String?,
    pendingPaystackCallbackUri: String?,
    pendingAnnouncementId: String?,
    pendingAnnouncementTitle: String?,
    pendingAnnouncementBody: String?,
    pendingAnnouncementCategory: String?,
    pendingAnnouncementCtaUrl: String?,
    onConversationConsumed: () -> Unit,
    onBookingConsumed: () -> Unit,
    onCarConsumed: () -> Unit,
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

    // Branded interstitial that covers the swap between the renter and host shells.
    val modeSwitchScope = rememberCoroutineScope()
    var modeSwitchTargetsHost by remember { mutableStateOf<Boolean?>(null) }
    val enterHostMode: (HostMainTab?) -> Unit = { tab ->
        if (tab != null) viewModel.requestHostTab(tab)
        if (modeSwitchTargetsHost == null) {
            modeSwitchTargetsHost = true
            modeSwitchScope.launch {
                delay(480)
                navController.navigate(NavRoutes.HostShell) { launchSingleTop = true }
                delay(950)
                modeSwitchTargetsHost = null
            }
        }
    }
    val exitHostMode: () -> Unit = {
        if (modeSwitchTargetsHost == null) {
            modeSwitchTargetsHost = false
            modeSwitchScope.launch {
                delay(480)
                val popped = navController.popBackStack()
                if (!popped) {
                    navController.navigate(NavRoutes.main()) { launchSingleTop = true }
                }
                delay(950)
                modeSwitchTargetsHost = null
            }
        }
    }

    val hasAppAccess = isAuthenticated || isGuestMode
    val latestHasAppAccess by rememberUpdatedState(hasAppAccess)

    // Coming back to the app is when a dropped payment is most likely to have
    // settled (or a hold to have expired): re-check the saved checkout.
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) viewModel.refreshSavedCheckout()
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    // A server-held checkout opens the verification screen; a local draft
    // reopens the checkout pre-filled where the renter left it.
    val openResumableCheckout: (ResumableCheckoutUi) -> Unit = { resumable ->
        when (resumable) {
            is ResumableCheckoutUi.Held -> navController.navigate(NavRoutes.ResumeCheckout) { launchSingleTop = true }
            is ResumableCheckoutUi.Draft -> navController.navigate(NavRoutes.booking(resumable.draft.carId))
        }
    }
    // The identity check renters pass before booking. Opened from More, the Home prompt,
    // the checkout gate, a refused hold and a "not approved" push.
    val openRenterVerification: () -> Unit = {
        navController.navigate(NavRoutes.RenterVerification) { launchSingleTop = true }
    }
    val renterVerificationScreenRequested by viewModel.renterVerificationScreenRequested.collectAsState()
    LaunchedEffect(renterVerificationScreenRequested, bootstrapping, isAuthenticated, currentRoute) {
        if (!renterVerificationScreenRequested || bootstrapping || !isAuthenticated) return@LaunchedEffect
        // Wait for the splash to hand over, so Back from the screen lands in the app.
        if (currentRoute == null || currentRoute == NavRoutes.Splash) return@LaunchedEffect
        viewModel.consumeRenterVerificationScreenRequest()
        navController.navigate(NavRoutes.RenterVerification) { launchSingleTop = true }
    }
    val latestCurrentRoute by rememberUpdatedState(currentRoute)
    val hostStatus = (me?.host_application_status ?: me?.host_status ?: "").lowercase()
    // The agreement screen (drawn by the activity above everything here) is up: keep what
    // is underneath quiet until it has been accepted.
    val termsState by viewModel.terms.collectAsState()
    val termsGateActive = isAuthenticated && termsState.mustAccept && termsState.document != null
    val openTerms: () -> Unit = {
        navController.navigate(NavRoutes.Terms) { launchSingleTop = true }
    }
    val canShowAnnouncement = hasAppAccess && !termsGateActive && when (currentRoute) {
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
        val message = snackbarMessage?.takeIf { it.isNotBlank() }
        if (message == null) {
            if (snackbarMessage != null) viewModel.dismissSnackbar()
            return@LaunchedEffect
        }
        snackbarHostState.showSnackbar(message)
        viewModel.dismissSnackbar()
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

        // Signed out, the read-only Terms of Service opened from sign-up stay reachable.
        if (!hasAppAccess && currentRoute !in authRoutes && currentRoute != NavRoutes.Terms) {
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

    LaunchedEffect(pendingCarId, bootstrapping, hasAppAccess) {
        val carId = pendingCarId
        if (bootstrapping || !hasAppAccess || carId.isNullOrBlank()) return@LaunchedEffect
        navController.navigate(NavRoutes.carDetail(carId)) {
            launchSingleTop = true
        }
        onCarConsumed()
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
                            Icon(Icons.Outlined.Close, contentDescription = "Dismiss", tint = colors.mutedText, modifier = Modifier.size(18.dp))
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

    Box(
        modifier = Modifier
            .fillMaxSize()
            // Screen readers read the agreement, not the app hidden behind it.
            .then(if (termsGateActive) Modifier.clearAndSetSemantics {} else Modifier),
    ) {
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
            val layoutDirection = LocalLayoutDirection.current
            val ownsBottomNavigation = currentRoute in setOf(
                NavRoutes.MainRoute,
                NavRoutes.HostShell,
                NavRoutes.AdminShell,
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .then(
                        if (isSplashRoute) {
                            Modifier
                        } else {
                            Modifier.padding(
                                start = innerPadding.calculateStartPadding(layoutDirection),
                                top = innerPadding.calculateTopPadding(),
                                end = innerPadding.calculateEndPadding(layoutDirection),
                                bottom = if (ownsBottomNavigation) 0.dp else innerPadding.calculateBottomPadding(),
                            )
                        },
                    ),
            ) {
                NavHost(
                    navController = navController,
                    startDestination = NavRoutes.Splash,
                    enterTransition = {
                        if (initialState.destination.route == NavRoutes.Splash) {
                            // Coming out of the splash: a plain fade under the zoom.
                            fadeIn(tween(420, delayMillis = 80, easing = FastOutSlowInEasing))
                        } else {
                            fadeIn(tween(260, easing = FastOutSlowInEasing)) +
                                slideInHorizontally(tween(260, easing = FastOutSlowInEasing)) { it / 14 }
                        }
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
                    composable(
                        NavRoutes.Splash,
                        // The splash zooms toward the viewer and fades as the app takes over.
                        exitTransition = {
                            fadeOut(tween(360, delayMillis = 60, easing = FastOutSlowInEasing)) +
                                scaleOut(targetScale = 1.7f, animationSpec = tween(440, easing = FastOutSlowInEasing))
                        },
                        popExitTransition = {
                            fadeOut(tween(360, delayMillis = 60, easing = FastOutSlowInEasing)) +
                                scaleOut(targetScale = 1.7f, animationSpec = tween(440, easing = FastOutSlowInEasing))
                        },
                    ) {
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
                            onOpenTerms = openTerms,
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
                            onOpenHostDashboard = { enterHostMode(null) },
                            onOpenHostVehicles = { enterHostMode(HostMainTab.CARS) },
                            onOpenTrips = { navController.navigate(NavRoutes.main(MainTab.TRIPS)) },
                            onOpenProfile = { navController.navigate(NavRoutes.Profile) },
                            onOpenContact = { navController.navigate(NavRoutes.Contact) },
                            onOpenProtection = { navController.navigate(NavRoutes.Protection) },
                            onOpenCancellation = { navController.navigate(NavRoutes.Cancellation) },
                            onOpenPrivacy = { navController.navigate(NavRoutes.Privacy) },
                            onOpenAuth = { navController.navigate(NavRoutes.Login) },
                            onOpenAdmin = { navController.navigate(NavRoutes.AdminShell) },
                            onOpenSettings = { highlight -> navController.navigate(NavRoutes.settings(highlight)) },
                            onOpenProfileOverview = { navController.navigate(NavRoutes.ProfileOverview) },
                            appearanceHighlightNonce = appearanceHighlightNonce,
                            onResumeCheckout = openResumableCheckout,
                            onOpenVerification = openRenterVerification,
                            onOpenTerms = openTerms,
                        )
                    }
                    composable(NavRoutes.RenterVerification) {
                        RenterVerificationScreen(
                            viewModel = viewModel,
                            onBack = { navController.popBackStack() },
                            // Approved with a booking waiting: reopen it in place of this screen.
                            onContinueBooking = { resumable ->
                                val destination = when (resumable) {
                                    is ResumableCheckoutUi.Held -> NavRoutes.ResumeCheckout
                                    is ResumableCheckoutUi.Draft -> NavRoutes.booking(resumable.draft.carId)
                                }
                                navController.navigate(destination) {
                                    popUpTo(NavRoutes.RenterVerification) { inclusive = true }
                                    launchSingleTop = true
                                }
                            },
                        )
                    }
                    composable(NavRoutes.ResumeCheckout) {
                        ResumeCheckoutScreen(
                            viewModel = viewModel,
                            pendingPaystackCallbackUri = pendingPaystackCallbackUri,
                            onBack = { navController.popBackStack() },
                            onEditDetails = { carId -> navController.navigate(NavRoutes.booking(carId)) },
                            onBookingCompleted = {
                                navController.navigate(NavRoutes.main(MainTab.TRIPS)) {
                                    popUpTo(NavRoutes.MainRoute) { inclusive = true }
                                    launchSingleTop = true
                                }
                            },
                            onPaystackCallbackConsumed = onPaystackCallbackConsumed,
                        )
                    }
                    composable(NavRoutes.ProfileOverview) {
                        ProfileOverviewScreen(
                            viewModel = viewModel,
                            onBack = { navController.popBackStack() },
                            onEditProfile = { navController.navigate(NavRoutes.Profile) },
                            onOpenTrips = { navController.navigate(NavRoutes.main(MainTab.TRIPS)) },
                            onOpenSaved = { navController.navigate(NavRoutes.main(MainTab.SAVED)) },
                            onOpenMessages = { navController.navigate(NavRoutes.Messages) },
                            onOpenBecomeHost = { navController.navigate(NavRoutes.BecomeHost) },
                            onOpenHostDashboard = { enterHostMode(null) },
                            onOpenAuth = { navController.navigate(NavRoutes.Login) },
                        )
                    }
                    composable(
                        route = NavRoutes.SettingsRoute,
                        arguments = listOf(
                            navArgument("highlight") {
                                type = NavType.StringType
                                nullable = true
                                defaultValue = "0"
                            },
                        ),
                    ) { backStack ->
                        SettingsScreen(
                            viewModel = viewModel,
                            highlightAppearance = backStack.arguments?.getString("highlight") == "1",
                            onBack = { navController.popBackStack() },
                            onEditProfile = { navController.navigate(NavRoutes.Profile) },
                            onOpenProfileOverview = { navController.navigate(NavRoutes.ProfileOverview) },
                            onOpenBecomeHost = { navController.navigate(NavRoutes.BecomeHost) },
                            onOpenHostDashboard = { enterHostMode(null) },
                            onOpenProtection = { navController.navigate(NavRoutes.Protection) },
                            onOpenCancellation = { navController.navigate(NavRoutes.Cancellation) },
                            onOpenPrivacy = { navController.navigate(NavRoutes.Privacy) },
                            onOpenAuth = { navController.navigate(NavRoutes.Login) },
                            onOpenTerms = openTerms,
                            onOpenDeleteAccount = { navController.navigate(NavRoutes.DeleteAccount) { launchSingleTop = true } },
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
                            onOpenHostDashboard = { enterHostMode(null) },
                            onOpenHostVehicles = { enterHostMode(HostMainTab.CARS) },
                        )
                    }
                    composable(NavRoutes.HostShell) {
                        HostShell(
                            viewModel = viewModel,
                            onSelectedTabChanged = {
                                visibleHostTab = it
                                visibleMainTab = null
                            },
                            onExitHostMode = exitHostMode,
                            onOpenConversation = { navController.navigate(NavRoutes.conversation(it)) },
                            onOpenCarEditor = { carId -> navController.navigate(NavRoutes.hostCarEditor(carId)) },
                            onOpenListingPhotos = { carId -> navController.navigate(NavRoutes.hostListingPhotos(carId)) },
                            onOpenAvailability = { carId -> navController.navigate(NavRoutes.hostAvailability(carId)) },
                            onOpenFavorites = { navController.navigate(NavRoutes.HostFavorites) },
                            onOpenContact = { navController.navigate(NavRoutes.Contact) },
                            onOpenProtection = { navController.navigate(NavRoutes.Protection) },
                            onOpenCancellation = { navController.navigate(NavRoutes.Cancellation) },
                            onOpenReviews = { navController.navigate(NavRoutes.HostReviews) },
                            onOpenSettings = { navController.navigate(NavRoutes.settings(false)) },
                            onEditProfile = { navController.navigate(NavRoutes.Profile) },
                            onOpenTerms = openTerms,
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
                            onResumeCheckout = openResumableCheckout,
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
                            // The renter's selections are saved as a draft, so the checkout is
                            // swapped for the verification screen; the draft reopens it later
                            // from Home, Trips, the listing or the verification screen itself.
                            onVerificationRequired = {
                                navController.navigate(NavRoutes.RenterVerification) {
                                    popUpTo(NavRoutes.Booking + "/{carId}") { inclusive = true }
                                    launchSingleTop = true
                                }
                            },
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
                            onOpenAuth = { navController.navigate(NavRoutes.Login) },
                            onOpenHostDashboard = { enterHostMode(null) },
                            onSubmissionCompleted = {
                                navController.navigate(NavRoutes.HostPending) {
                                    popUpTo(NavRoutes.BecomeHost) { inclusive = true }
                                }
                            },
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
                        // Old standalone host page: open it as a tab of the host shell so it has
                        // the tab bar and the normal back behaviour.
                        LaunchedEffect(Unit) {
                            viewModel.requestHostTab(HostMainTab.DASHBOARD)
                            navController.navigate(NavRoutes.HostShell) {
                                popUpTo(NavRoutes.HostDashboard) { inclusive = true }
                                launchSingleTop = true
                            }
                        }
                    }
                    composable(NavRoutes.HostCars) {
                        // Old standalone host page: open it as a tab of the host shell so it has
                        // the tab bar and the normal back behaviour.
                        LaunchedEffect(Unit) {
                            viewModel.requestHostTab(HostMainTab.CARS)
                            navController.navigate(NavRoutes.HostShell) {
                                popUpTo(NavRoutes.HostCars) { inclusive = true }
                                launchSingleTop = true
                            }
                        }
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
                        // Old standalone host page: open it as a tab of the host shell so it has
                        // the tab bar and the normal back behaviour.
                        LaunchedEffect(Unit) {
                            viewModel.requestHostTab(HostMainTab.BOOKINGS)
                            navController.navigate(NavRoutes.HostShell) {
                                popUpTo(NavRoutes.HostBookings) { inclusive = true }
                                launchSingleTop = true
                            }
                        }
                    }
                    composable(NavRoutes.HostEarnings) {
                        // Old standalone host page: open it as a tab of the host shell so it has
                        // the tab bar and the normal back behaviour.
                        LaunchedEffect(Unit) {
                            viewModel.requestHostTab(HostMainTab.EARNINGS)
                            navController.navigate(NavRoutes.HostShell) {
                                popUpTo(NavRoutes.HostEarnings) { inclusive = true }
                                launchSingleTop = true
                            }
                        }
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
                        // Old standalone host page: open it as a tab of the host shell so it has
                        // the tab bar and the normal back behaviour.
                        LaunchedEffect(Unit) {
                            viewModel.requestHostTab(HostMainTab.PROFILE)
                            navController.navigate(NavRoutes.HostShell) {
                                popUpTo(NavRoutes.HostProfile) { inclusive = true }
                                launchSingleTop = true
                            }
                        }
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
                            onOpenTerms = openTerms,
                        )
                    }
                    composable(NavRoutes.Terms) {
                        TermsScreen(viewModel = viewModel, onBack = { navController.popBackStack() })
                    }
                    composable(NavRoutes.Contact) {
                        ContactScreen(onBack = { navController.popBackStack() })
                    }
                    // Protection, Cancellation and Privacy share one screen; the text comes from the server.
                    listOf(
                        NavRoutes.Protection to LegalDocumentKind.PROTECTION,
                        NavRoutes.Cancellation to LegalDocumentKind.CANCELLATION,
                        NavRoutes.Privacy to LegalDocumentKind.PRIVACY,
                    ).forEach { (route, kind) ->
                        composable(route) {
                            LegalDocumentScreen(
                                viewModel = viewModel,
                                kind = kind,
                                onBack = { navController.popBackStack() },
                                onOpenContact = { navController.navigate(NavRoutes.Contact) { launchSingleTop = true } },
                                onOpenDocument = { other ->
                                    // One document replaces the other, so Back returns to where reading started.
                                    navController.navigate(legalDocumentRoute(other)) {
                                        popUpTo(route) { inclusive = true }
                                        launchSingleTop = true
                                    }
                                },
                                onOpenTerms = openTerms,
                                onOpenDeleteAccount = if (kind == LegalDocumentKind.PRIVACY && isAuthenticated) {
                                    { navController.navigate(NavRoutes.DeleteAccount) { launchSingleTop = true } }
                                } else {
                                    null
                                },
                            )
                        }
                    }
                    composable(NavRoutes.DeleteAccount) {
                        DeleteAccountScreen(
                            viewModel = viewModel,
                            onBack = { navController.popBackStack() },
                            // Signing out sends the app back to the sign-in screen; this page
                            // is closed first so it is not waiting underneath for the next user.
                            onFinished = {
                                navController.popBackStack()
                                viewModel.finishAccountDeletion()
                            },
                        )
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
                            onOpenCarEditor = { navController.navigate(NavRoutes.hostCarEditor(it)) },
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
        HostModeSwitchOverlay(
            visible = modeSwitchTargetsHost != null,
            targetsHost = modeSwitchTargetsHost == true,
            modifier = Modifier.fillMaxSize(),
        )
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

private fun legalDocumentRoute(kind: LegalDocumentKind): String = when (kind) {
    LegalDocumentKind.PROTECTION -> NavRoutes.Protection
    LegalDocumentKind.CANCELLATION -> NavRoutes.Cancellation
    LegalDocumentKind.PRIVACY -> NavRoutes.Privacy
}

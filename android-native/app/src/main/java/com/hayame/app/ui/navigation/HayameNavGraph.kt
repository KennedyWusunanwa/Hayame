package com.hayame.app.ui.navigation

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavBackStackEntry
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
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

@Composable
fun HayameNavApp(
    viewModel: AppViewModel,
    pendingConversationId: String?,
    pendingBookingId: String?,
    pendingBookingRecipientRole: String?,
    pendingPaystackCallbackUri: String?,
    onConversationConsumed: () -> Unit,
    onBookingConsumed: () -> Unit,
    onPaystackCallbackConsumed: () -> Unit,
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val isGuestMode by viewModel.isGuestMode.collectAsState()
    val me by viewModel.me.collectAsState()
    val bootstrapping by viewModel.bootstrapping.collectAsState()
    val snackbarMessage by viewModel.snackbar.collectAsState()
    val authPrompt by viewModel.authPrompt.collectAsState()
    val activeAnnouncement by viewModel.activeAnnouncement.collectAsState()
    val context = LocalContext.current

    var pendingProtectedRoute by rememberSaveable { mutableStateOf<String?>(null) }
    var authRouteOverride by rememberSaveable { mutableStateOf<String?>(null) }

    val hasAppAccess = isAuthenticated || isGuestMode
    val hostStatus = (me?.host_application_status ?: me?.host_status ?: "").lowercase()

    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
    ) {}

    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    LaunchedEffect(isAuthenticated) {
        if (isAuthenticated) {
            viewModel.registerPushIfAvailable()
        }
    }

    LaunchedEffect(snackbarMessage) {
        val message = snackbarMessage ?: return@LaunchedEffect
        snackbarHostState.showSnackbar(message)
        viewModel.dismissSnackbar()
    }

    LaunchedEffect(bootstrapping, hasAppAccess, navBackStackEntry, isAuthenticated, pendingProtectedRoute, authRouteOverride) {
        if (bootstrapping) return@LaunchedEffect
        val currentRoute = navBackStackEntry?.destination?.route
        val authRoutes = setOf(NavRoutes.Login, NavRoutes.Signup)

        if (currentRoute == NavRoutes.Splash || currentRoute == null) {
            val destination = if (hasAppAccess) NavRoutes.main() else NavRoutes.Login
            navController.navigate(destination) {
                popUpTo(NavRoutes.Splash) { inclusive = true }
                launchSingleTop = true
            }
            return@LaunchedEffect
        }

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

    activeAnnouncement?.let { announcement ->
        val ctaUrl = announcement.cta_url?.takeIf { it.isNotBlank() }
        AlertDialog(
            onDismissRequest = { viewModel.dismissActiveAnnouncement() },
            title = { Text(announcement.title ?: "Hayame") },
            text = { Text(announcement.body ?: "") },
            confirmButton = {
                if (ctaUrl != null) {
                    TextButton(
                        onClick = {
                            runCatching {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(ctaUrl)).apply {
                                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                }
                                context.startActivity(intent)
                            }
                            viewModel.dismissActiveAnnouncement()
                        },
                    ) {
                        Text(announcement.cta_label ?: "Open")
                    }
                } else {
                    Button(onClick = { viewModel.dismissActiveAnnouncement() }) {
                        Text("OK")
                    }
                }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.dismissActiveAnnouncement() }) {
                    Text("Dismiss")
                }
            },
        )
    }

    Scaffold(
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
        ) {
            NavHost(navController = navController, startDestination = NavRoutes.Splash) {
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
                        onOpenCarDetail = { navController.navigate(NavRoutes.carDetail(it)) },
                        onOpenMessages = { navController.navigate(NavRoutes.Messages) },
                        onOpenDashboard = { navController.navigate(NavRoutes.Dashboard) },
                        onOpenBecomeHost = { navController.navigate(NavRoutes.BecomeHost) },
                        onOpenHostDashboard = { navController.navigate(NavRoutes.HostShell) },
                        onOpenTrips = { navController.navigate(NavRoutes.main(MainTab.TRIPS)) },
                        onOpenProfile = { navController.navigate(NavRoutes.Profile) },
                        onOpenContact = { navController.navigate(NavRoutes.Contact) },
                        onOpenProtection = { navController.navigate(NavRoutes.Protection) },
                        onOpenCancellation = { navController.navigate(NavRoutes.Cancellation) },
                        onOpenPrivacy = { navController.navigate(NavRoutes.Privacy) },
                    )
                }
                composable(NavRoutes.Dashboard) {
                    RenterDashboardScreen(
                        viewModel = viewModel,
                        onBack = { navController.popBackStack() },
                        onOpenTrips = { navController.navigate(NavRoutes.main(MainTab.TRIPS)) },
                        onOpenSaved = { navController.navigate(NavRoutes.main(MainTab.SAVED)) },
                        onOpenMessages = { navController.navigate(NavRoutes.Messages) },
                        onOpenBecomeHost = {
                            if (hostStatus == "pending") {
                                navController.navigate(NavRoutes.HostPending)
                            } else {
                                navController.navigate(NavRoutes.BecomeHost)
                            }
                        },
                        onOpenHostDashboard = { navController.navigate(NavRoutes.HostShell) },
                    )
                }
                composable(NavRoutes.HostShell) {
                    HostShell(
                        viewModel = viewModel,
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

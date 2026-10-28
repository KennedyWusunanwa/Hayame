package com.hayame.app

import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.outlined.BarChart
import androidx.compose.material.icons.outlined.Cancel
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.LightMode
import androidx.compose.material3.Icon
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.view.WindowCompat
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import com.hayame.app.core.analytics.AnalyticsService
import com.hayame.app.ui.navigation.HayameNavApp
import com.hayame.app.ui.theme.HayameTheme
import com.hayame.app.ui.theme.LocalHayameColors
import com.hayame.app.ui.viewmodel.AppViewModel
import com.hayame.app.ui.viewmodel.AppViewModelFactory

class MainActivity : ComponentActivity() {
    private lateinit var viewModelFactory: AppViewModelFactory
    private val viewModel: AppViewModel by viewModels { viewModelFactory }

    private var pendingConversationId by mutableStateOf<String?>(null)
    private var pendingBookingId by mutableStateOf<String?>(null)
    private var pendingCarId by mutableStateOf<String?>(null)
    private var pendingBookingRecipientRole by mutableStateOf<String?>(null)
    private var pendingPaystackCallbackUri by mutableStateOf<String?>(null)
    private var pendingAnnouncementId by mutableStateOf<String?>(null)
    private var pendingAnnouncementTitle by mutableStateOf<String?>(null)
    private var pendingAnnouncementBody by mutableStateOf<String?>(null)
    private var pendingAnnouncementCategory by mutableStateOf<String?>(null)
    private var pendingAnnouncementCtaUrl by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        val container = (application as HayameApplication).container
        viewModelFactory = AppViewModelFactory(container)
        super.onCreate(savedInstanceState)

        ingestIntent(intent)

        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color(0xFF0F85E3).toArgb()
        window.navigationBarColor = Color(0xFF0F85E3).toArgb()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.navigationBarDividerColor = Color(0xFF0F85E3).toArgb()
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.isNavigationBarContrastEnforced = false
            window.isStatusBarContrastEnforced = false
        }
        WindowCompat.getInsetsController(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }

        setContent {
            val darkMode by viewModel.darkModeEnabled.collectAsState()
            var showAppearanceTransition by remember { mutableStateOf(false) }
            var appearanceTransitionTargetsDarkMode by remember { mutableStateOf(darkMode) }
            var showAnalyticsConsent by remember { mutableStateOf(false) }

            LaunchedEffect(Unit) {
                viewModel.appearanceTransitionEvents.collect { targetsDarkMode ->
                    appearanceTransitionTargetsDarkMode = targetsDarkMode
                    showAppearanceTransition = true
                    kotlinx.coroutines.delay(1_420)
                    showAppearanceTransition = false
                }
            }
            LaunchedEffect(Unit) {
                kotlinx.coroutines.delay(900)
                showAnalyticsConsent = AnalyticsService.needsConsentDecision()
            }

            HayameTheme(darkTheme = darkMode) {
                val colors = LocalHayameColors.current
                SideEffect {
                    val navigationBarColor = colors.cardBackground.toArgb()
                    window.statusBarColor = colors.pageBackground.toArgb()
                    window.navigationBarColor = navigationBarColor
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                        window.navigationBarDividerColor = navigationBarColor
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        window.isNavigationBarContrastEnforced = false
                        window.isStatusBarContrastEnforced = false
                    }
                    WindowCompat.getInsetsController(window, window.decorView).apply {
                        isAppearanceLightStatusBars = !darkMode
                        isAppearanceLightNavigationBars = !darkMode
                    }
                }
                Box(modifier = Modifier.fillMaxSize()) {
                    HayameNavApp(
                        viewModel = viewModel,
                        pendingConversationId = pendingConversationId,
                        pendingBookingId = pendingBookingId,
                        pendingBookingRecipientRole = pendingBookingRecipientRole,
                        pendingCarId = pendingCarId,
                        pendingPaystackCallbackUri = pendingPaystackCallbackUri,
                        pendingAnnouncementId = pendingAnnouncementId,
                        pendingAnnouncementTitle = pendingAnnouncementTitle,
                        pendingAnnouncementBody = pendingAnnouncementBody,
                        pendingAnnouncementCategory = pendingAnnouncementCategory,
                        pendingAnnouncementCtaUrl = pendingAnnouncementCtaUrl,
                        onConversationConsumed = { pendingConversationId = null },
                        onBookingConsumed = {
                            pendingBookingId = null
                            pendingBookingRecipientRole = null
                        },
                        onCarConsumed = { pendingCarId = null },
                        onPaystackCallbackConsumed = { pendingPaystackCallbackUri = null },
                        onAnnouncementConsumed = {
                            pendingAnnouncementId = null
                            pendingAnnouncementTitle = null
                            pendingAnnouncementBody = null
                            pendingAnnouncementCategory = null
                            pendingAnnouncementCtaUrl = null
                        },
                    )

                    AnimatedVisibility(
                        visible = showAppearanceTransition,
                        enter = fadeIn(tween(280)) + scaleIn(initialScale = 1.01f),
                        exit = fadeOut(tween(420)) + scaleOut(targetScale = 1.005f),
                    ) {
                        AppearanceTransitionOverlay(targetsDarkMode = appearanceTransitionTargetsDarkMode)
                    }

                    if (showAnalyticsConsent) {
                        AnalyticsConsentDialog(
                            onDecision = { granted ->
                                AnalyticsService.setConsent(granted)
                                showAnalyticsConsent = false
                            },
                        )
                    }
                }
            }
        }

        window.decorView.postDelayed({
            initializePushTokenRegistration()
        }, 500L)
    }

    private fun initializePushTokenRegistration() {
        val firebaseApp = FirebaseApp.initializeApp(this)
        if (firebaseApp != null) {
            FirebaseMessaging.getInstance().token
                .addOnSuccessListener { token ->
                    AppViewModel.cachePushToken(token)
                    viewModel.registerPushIfAvailable(token)
                }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        ingestIntent(intent)
    }

    override fun onResume() {
        super.onResume()
        viewModel.refreshActiveAnnouncements()
    }

    private fun ingestIntent(intent: Intent?) {
        val announcementFromExtra = intent?.getStringExtra("announcementId")
        val announcementFromData = intent?.data?.getQueryParameter("announcementId")
        val resolvedAnnouncement = if (!announcementFromExtra.isNullOrBlank()) announcementFromExtra else announcementFromData
        if (!resolvedAnnouncement.isNullOrBlank()) {
            pendingAnnouncementId = resolvedAnnouncement
            pendingAnnouncementTitle =
                intent?.getStringExtra("announcementTitle")
                    ?: intent?.data?.getQueryParameter("title")
            pendingAnnouncementBody =
                intent?.getStringExtra("announcementBody")
                    ?: intent?.data?.getQueryParameter("body")
            pendingAnnouncementCategory =
                intent?.getStringExtra("announcementCategory")
                    ?: intent?.data?.getQueryParameter("category")
            pendingAnnouncementCtaUrl =
                intent?.getStringExtra("announcementCtaUrl")
                    ?: intent?.data?.getQueryParameter("ctaUrl")
            return
        }

        val fromExtra = intent?.getStringExtra("conversationId")
        val fromData = intent?.data?.getQueryParameter("conversationId")
        val resolved = if (!fromExtra.isNullOrBlank()) fromExtra else fromData
        if (!resolved.isNullOrBlank()) {
            pendingConversationId = resolved
            return
        }

        val bookingFromExtra = intent?.getStringExtra("bookingId")
        val bookingFromData = intent?.data?.getQueryParameter("bookingId")
        val resolvedBooking = if (!bookingFromExtra.isNullOrBlank()) bookingFromExtra else bookingFromData
        if (!resolvedBooking.isNullOrBlank()) {
            pendingBookingId = resolvedBooking
            pendingBookingRecipientRole =
                intent?.getStringExtra("recipientRole")
                    ?: intent?.data?.getQueryParameter("recipientRole")
            return
        }

        val carIntentData = intent?.data
        val carIntentScheme = carIntentData?.scheme?.lowercase()
        val carIntentHost = carIntentData?.host?.lowercase()
        val carIdFromPath = if (carIntentScheme == "https" && (carIntentHost == "hayamegh.com" || carIntentHost == "www.hayamegh.com")) {
            val segments = carIntentData?.pathSegments.orEmpty()
            val carsIndex = segments.indexOf("cars")
            if (carsIndex >= 0 && carsIndex + 1 < segments.size) segments[carsIndex + 1] else null
        } else {
            null
        }
        val carFromExtra = intent?.getStringExtra("carId")
        val carFromData = intent?.data?.getQueryParameter("carId")
        val resolvedCarId = carIdFromPath ?: (if (!carFromExtra.isNullOrBlank()) carFromExtra else carFromData)
        if (!resolvedCarId.isNullOrBlank()) {
            pendingCarId = resolvedCarId
            return
        }

        val data = intent?.data
        val scheme = data?.scheme?.lowercase()
        if (scheme == "hayameandroid" || scheme == "hayame") {
            pendingPaystackCallbackUri = data.toString()
        }
    }
}

@Composable
private fun AnalyticsConsentDialog(onDecision: (Boolean) -> Unit) {
    val colors = LocalHayameColors.current
    Dialog(
        onDismissRequest = {},
        properties = DialogProperties(dismissOnBackPress = false, dismissOnClickOutside = false),
    ) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = colors.cardBackground,
            tonalElevation = 6.dp,
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(24.dp),
                verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(18.dp),
            ) {
                Icon(
                    Icons.Outlined.BarChart,
                    contentDescription = null,
                    tint = colors.brandBlue,
                    modifier = Modifier.size(40.dp),
                )
                Text("Help us improve Hayame?", color = colors.brandNavy, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                Text(
                    "We'd like to measure how people search and book, so we can fix what's broken and list the cars you're actually looking for.",
                    color = colors.mutedText,
                    fontSize = 14.sp,
                )
                ConsentBullet(
                    icon = Icons.Outlined.CheckCircle,
                    tint = colors.success,
                    text = "What we'd collect: which cars you view, what you search for, and where a booking gets stuck.",
                )
                ConsentBullet(
                    icon = Icons.Outlined.Cancel,
                    tint = colors.danger,
                    text = "What we never do: track you across other apps or websites, sell your data, or use advertising trackers.",
                )
                ConsentBullet(
                    icon = Icons.Outlined.CheckCircle,
                    tint = colors.brandBlue,
                    text = "You can change this any time in Settings. Declining does not limit any feature.",
                )
                Button(
                    onClick = { onDecision(true) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = colors.brandBlue),
                ) { Text("Allow", modifier = Modifier.padding(vertical = 6.dp), color = Color.White, fontWeight = FontWeight.Bold) }
                Button(
                    onClick = { onDecision(false) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = colors.subtleFill, contentColor = colors.brandNavy),
                ) { Text("No thanks", modifier = Modifier.padding(vertical = 6.dp), fontWeight = FontWeight.Bold) }
            }
        }
    }
}

@Composable
private fun ConsentBullet(icon: androidx.compose.ui.graphics.vector.ImageVector, tint: Color, text: String) {
    val colors = LocalHayameColors.current
    Row(horizontalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(10.dp)) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(18.dp))
        Text(text, modifier = Modifier.weight(1f), color = colors.mutedText, fontSize = 13.sp)
    }
}

@Composable
private fun AppearanceTransitionOverlay(targetsDarkMode: Boolean) {
    val pulse = rememberInfiniteTransition(label = "appearance-pulse")
    val haloScale by pulse.animateFloat(
        initialValue = 0.86f,
        targetValue = 1.06f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1_200),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "halo-scale",
    )
    val foreground = if (targetsDarkMode) Color.White else Color(0xFF0A2B54)
    val backgroundColors = if (targetsDarkMode) {
        listOf(Color(0xFF061B2D), Color(0xFF103452))
    } else {
        listOf(Color(0xFFF0F8FF), Color(0xFFC8E5FF))
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.linearGradient(
                    colors = backgroundColors,
                ),
            ),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(contentAlignment = Alignment.Center) {
                Box(
                    modifier = Modifier
                        .size(148.dp)
                        .scale(haloScale)
                        .background(foreground.copy(alpha = if (targetsDarkMode) 0.12f else 0.10f), CircleShape),
                )
                Box(
                    modifier = Modifier
                        .size(112.dp)
                        .background(foreground.copy(alpha = if (targetsDarkMode) 0.08f else 0.07f), CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = if (targetsDarkMode) Icons.Outlined.DarkMode else Icons.Outlined.LightMode,
                        contentDescription = if (targetsDarkMode) "Dark mode" else "Light mode",
                        tint = foreground,
                        modifier = Modifier.size(58.dp),
                    )
                }
            }
            Text(
                text = if (targetsDarkMode) "Dark mode" else "Light mode",
                color = foreground,
                fontWeight = FontWeight.ExtraBold,
                fontSize = 22.sp,
            )
        }
    }
}

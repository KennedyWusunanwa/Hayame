package com.hayame.app.ui.screens

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.hardware.biometrics.BiometricPrompt
import android.net.Uri
import android.os.Build
import android.os.CancellationSignal
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.DrawableRes
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectDragGesturesAfterLongPress
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items as gridItems
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.automirrored.outlined.ExitToApp
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.outlined.AddCircleOutline
import androidx.compose.material.icons.outlined.AccountBalance
import androidx.compose.material.icons.outlined.AttachMoney
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.ChatBubble
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material.icons.outlined.DirectionsCar
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.LightMode
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.MailOutline
import androidx.compose.material.icons.outlined.MoreHoriz
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.PhoneIphone
import androidx.compose.material.icons.outlined.Public
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.Tune
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.AnimationVector1D
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.compose.ui.zIndex
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import coil.compose.AsyncImage
import coil.compose.SubcomposeAsyncImage
import com.hayame.app.R
import com.hayame.app.BuildConfig
import com.hayame.app.core.network.BookingDto
import com.hayame.app.core.network.CarDto
import com.hayame.app.core.network.HostApplicationRequest
import com.hayame.app.core.network.MobileMeDto
import com.hayame.app.core.network.NotificationPreferencesDto
import com.hayame.app.core.network.PaystackFinalizeRequest
import com.hayame.app.core.network.ReviewDto
import com.hayame.app.core.network.preferredAvatarRaw
import com.hayame.app.core.network.preferredCity
import com.hayame.app.core.network.preferredEmail
import com.hayame.app.core.network.preferredFirstName
import com.hayame.app.core.network.preferredFullName
import com.hayame.app.core.network.preferredLastName
import com.hayame.app.core.network.preferredPhone
import com.hayame.app.core.network.preferredRegion
import com.hayame.app.ui.components.CarCard
import com.hayame.app.ui.components.EmptyBlock
import com.hayame.app.ui.components.ErrorBlock
import com.hayame.app.ui.components.LoadingBlock
import com.hayame.app.ui.components.RemoteImageUrlResolver
import com.hayame.app.ui.components.SectionHeader
import com.hayame.app.ui.navigation.HostMainTab
import com.hayame.app.ui.navigation.MainTab
import com.hayame.app.ui.navigation.NavRoutes
import com.hayame.app.ui.state.UiState
import com.hayame.app.ui.theme.BrandBlue
import com.hayame.app.ui.theme.BrandLight
import com.hayame.app.ui.theme.BrandNavy
import com.hayame.app.ui.theme.CardBackground
import com.hayame.app.ui.theme.Danger
import com.hayame.app.ui.theme.LocalHayameColors
import com.hayame.app.ui.theme.MutedText
import com.hayame.app.ui.theme.PageBackground
import com.hayame.app.ui.theme.Success
import com.hayame.app.ui.theme.Warning
import com.hayame.app.ui.viewmodel.BookingDraft
import com.hayame.app.ui.viewmodel.AppViewModel
import com.hayame.app.ui.viewmodel.ListingSubmissionResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.CoroutineScope
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.File
import java.text.Normalizer
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException
import java.time.temporal.ChronoUnit
import java.util.Locale
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

@Composable
fun SplashScreen() {
    val progress = remember { Animatable(0f) }
    val logoScale = remember { Animatable(1f) }
    val splashMotion = rememberInfiniteTransition(label = "splash-motion")
    val logoFloat by splashMotion.animateFloat(
        initialValue = 5f,
        targetValue = -5f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "logo-float",
    )
    val shimmerShift by splashMotion.animateFloat(
        initialValue = -38f,
        targetValue = 210f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "bar-shimmer",
    )
    val topPanelOffset = remember { Animatable(-600f) }
    val bottomPanelOffset = remember { Animatable(600f) }
    val logoAlpha = remember { Animatable(0f) }
    val logoEntryScale = remember { Animatable(0.82f) }
    val taglineAlpha = remember { Animatable(0f) }
    val taglineOffset = remember { Animatable(12f) }
    val badgeAlpha = remember { Animatable(0f) }
    val barAlpha = remember { Animatable(0f) }

    val streak1X = remember { Animatable(-400f) }
    val streak2X = remember { Animatable(-400f) }
    val streak3X = remember { Animatable(-400f) }

    val pulseTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by pulseTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1600, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "pulse-scale",
    )
    val pulseAlpha by pulseTransition.animateFloat(
        initialValue = 0f,
        targetValue = 0.18f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1600, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "pulse-alpha",
    )

    val badgeScale = remember { Animatable(0.88f) }
    val sublineAlpha = remember { Animatable(0f) }

    LaunchedEffect(Unit) {
        launch {
            logoScale.animateTo(
                targetValue = 1f,
                animationSpec = spring(dampingRatio = 0.72f, stiffness = 180f),
            )
        }
        launch {
            progress.animateTo(
                targetValue = 1f,
                animationSpec = tween(durationMillis = 4650, easing = FastOutSlowInEasing),
            )
        }
    }

    LaunchedEffect(Unit) {
        // Stage 1 - panels slide in (T+0ms)
        launch {
            topPanelOffset.animateTo(
                targetValue = 0f,
                animationSpec = spring(dampingRatio = 0.78f, stiffness = 200f),
            )
        }
        launch {
            bottomPanelOffset.animateTo(
                targetValue = 0f,
                animationSpec = spring(dampingRatio = 0.78f, stiffness = 200f),
            )
        }

        // Stage 2 - logo entrance (T+300ms)
        delay(300)
        launch {
            logoAlpha.animateTo(1f, animationSpec = tween(durationMillis = 300))
        }
        launch {
            logoEntryScale.animateTo(
                targetValue = 1f,
                animationSpec = spring(dampingRatio = 0.72f, stiffness = 220f),
            )
        }

        // Stage 3 - tagline slides up (T+500ms)
        delay(200)
        launch {
            taglineAlpha.animateTo(1f, animationSpec = tween(durationMillis = 380, easing = FastOutSlowInEasing))
        }
        launch {
            taglineOffset.animateTo(0f, animationSpec = tween(durationMillis = 380, easing = FastOutSlowInEasing))
        }

        // Stage 4 - progress bar fades in (T+750ms)
        delay(250)
        barAlpha.animateTo(1f, animationSpec = tween(durationMillis = 280))
    }

    LaunchedEffect(Unit) {
        delay(380)

        fun CoroutineScope.loopStreak(
            anim: Animatable<Float, AnimationVector1D>,
            initialDelay: Long,
            duration: Int,
        ) = launch {
            delay(initialDelay)
            while (true) {
                anim.snapTo(-400f)
                anim.animateTo(
                    targetValue = 500f,
                    animationSpec = tween(durationMillis = duration, easing = LinearEasing),
                )
            }
        }

        loopStreak(streak1X, initialDelay = 0L, duration = 1100)
        loopStreak(streak2X, initialDelay = 280L, duration = 1200)
        loopStreak(streak3X, initialDelay = 550L, duration = 1000)

        launch {
            delay(240)
            sublineAlpha.animateTo(1f, animationSpec = tween(durationMillis = 350))
        }
        launch {
            delay(320)
            launch {
                badgeAlpha.animateTo(1f, animationSpec = tween(durationMillis = 280))
            }
            launch {
                badgeScale.animateTo(
                    targetValue = 1f,
                    animationSpec = spring(dampingRatio = 0.72f, stiffness = 220f),
                )
            }
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.55f)
                .offset { IntOffset(x = 0, y = topPanelOffset.value.roundToInt()) }
                .background(Color(0xFF1484D9))
                .clipToBounds(),
            contentAlignment = Alignment.Center,
        ) {
            Box(
                modifier = Modifier
                    .width(90.dp)
                    .height(2.5.dp)
                    .offset(x = streak1X.value.dp, y = 20.dp)
                    .background(Color.White.copy(alpha = 0.18f), RoundedCornerShape(99.dp)),
            )
            Box(
                modifier = Modifier
                    .width(60.dp)
                    .height(1.5.dp)
                    .offset(x = streak2X.value.dp, y = 36.dp)
                    .background(Color.White.copy(alpha = 0.12f), RoundedCornerShape(99.dp)),
            )
            Box(
                modifier = Modifier
                    .width(44.dp)
                    .height(1.5.dp)
                    .offset(x = streak3X.value.dp, y = 8.dp)
                    .background(Color.White.copy(alpha = 0.10f), RoundedCornerShape(99.dp)),
            )

            Box(
                modifier = Modifier
                    .size(280.dp)
                    .scale(pulseScale)
                    .border(
                        width = 2.dp,
                        color = Color.White.copy(alpha = pulseAlpha),
                        shape = CircleShape,
                    ),
            )

            Box(
                modifier = Modifier
                    .size(300.dp)
                    .background(Color.White.copy(alpha = 0.08f), CircleShape),
            )

            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Image(
                    painter = painterResource(id = R.drawable.hayame_logo_white),
                    contentDescription = "Hayame",
                    modifier = Modifier
                        .width(210.dp)
                        .scale(logoEntryScale.value * logoScale.value)
                        .offset(y = logoFloat.dp)
                        .alpha(logoAlpha.value),
                    contentScale = ContentScale.Fit,
                )
                Surface(
                    color = Color.White,
                    shape = RoundedCornerShape(99.dp),
                    modifier = Modifier
                        .alpha(badgeAlpha.value)
                        .scale(badgeScale.value),
                ) {
                    Text(
                        text = "Ghana's No.1 Car Rental Platform",
                        color = Color(0xFF1484D9),
                        style = MaterialTheme.typography.labelMedium.copy(fontSize = 11.sp),
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                    )
                }
            }
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
                .offset { IntOffset(x = 0, y = bottomPanelOffset.value.roundToInt()) }
                .background(Color.White),
            contentAlignment = Alignment.Center,
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(18.dp),
                modifier = Modifier.padding(horizontal = 48.dp),
            ) {
                Text(
                    text = "Rent a car, anytime, anywhere in Ghana.",
                    style = MaterialTheme.typography.bodyLarge.copy(fontSize = 16.sp),
                    color = Color(0xFF0A2B54),
                    fontWeight = FontWeight.Medium,
                    textAlign = TextAlign.Center,
                    lineHeight = 26.sp,
                    modifier = Modifier
                        .alpha(taglineAlpha.value)
                        .offset(y = taglineOffset.value.dp),
                )

                Text(
                    text = "Trusted by renters across Ghana",
                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp),
                    color = Color(0xFF737D91),
                    fontWeight = FontWeight.Medium,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.alpha(sublineAlpha.value),
                )

                Box(
                    modifier = Modifier
                        .width(180.dp)
                        .height(4.dp)
                        .alpha(barAlpha.value),
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(RoundedCornerShape(99.dp))
                            .background(Color(0xFFEDF7FF)),
                    )
                    Box(
                        modifier = Modifier
                            .fillMaxHeight()
                            .fillMaxWidth(progress.value)
                            .clip(RoundedCornerShape(99.dp))
                            .background(Color(0xFF1484D9)),
                    )
                    Box(
                        modifier = Modifier
                            .width(60.dp)
                            .fillMaxHeight()
                            .offset(x = shimmerShift.dp)
                            .clip(RoundedCornerShape(99.dp))
                            .background(
                                Brush.horizontalGradient(
                                    colors = listOf(
                                        Color.White.copy(alpha = 0f),
                                        Color.White.copy(alpha = 0.8f),
                                        Color.White.copy(alpha = 0f),
                                    )
                                )
                            ),
                    )
                }
            }
        }
    }
}

@Composable
fun LoginScreen(
    viewModel: AppViewModel,
    onSignup: () -> Unit,
    onContinueAsGuest: () -> Unit = {},
) {
    val context = LocalContext.current
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var passwordVisible by rememberSaveable { mutableStateOf(false) }
    var saveLoginWithBiometrics by rememberSaveable { mutableStateOf(true) }
    var hasBiometricCredentials by remember { mutableStateOf(hasStoredBiometricCredentials(context)) }
    val biometricsAvailable = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
    val bootstrapping by viewModel.bootstrapping.collectAsState()

    AuthScaffold(
        title = "Welcome back.",
        subtitle = "Log in to continue",
        selectedTab = AuthTab.LOGIN,
        onTabChange = { if (it == AuthTab.SIGNUP) onSignup() },
        onContinueAsGuest = onContinueAsGuest,
        content = {
        AuthTextField(
            label = "Email",
            value = email,
            onValueChange = { email = it },
            keyboardType = KeyboardType.Email,
        )
        AuthPasswordField(
            label = "Password",
            value = password,
            onValueChange = { password = it },
            visible = passwordVisible,
            onToggleVisibility = { passwordVisible = !passwordVisible },
        )
        AuthPrimaryButton(
            text = if (bootstrapping) "Please wait..." else "Log in",
            enabled = !bootstrapping,
        ) {
            viewModel.login(email, password) {
                if (saveLoginWithBiometrics && biometricsAvailable) {
                    saveBiometricCredentials(context, email, password)
                    hasBiometricCredentials = true
                }
            }
        }

        if (biometricsAvailable) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFF7FAFF), RoundedCornerShape(14.dp))
                    .border(1.dp, Color(0xFFE0EAF8), RoundedCornerShape(14.dp))
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(2.dp),
                ) {
                    Text(
                        "Save login for biometrics",
                        color = Color(0xFF0A2B54),
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp,
                    )
                    Text(
                        "Use it for quick login after signing out.",
                        color = Color(0xFF737D91),
                        fontWeight = FontWeight.Medium,
                        fontSize = 11.sp,
                    )
                }
                Switch(
                    checked = saveLoginWithBiometrics,
                    onCheckedChange = { saveLoginWithBiometrics = it },
                )
            }
        }

        if (hasBiometricCredentials) {
            AuthBiometricButton(text = "Log in with biometrics") {
                launchBiometricLogin(
                    context = context,
                    onCredentials = { savedEmail, savedPassword ->
                        email = savedEmail
                        password = savedPassword
                        viewModel.login(savedEmail, savedPassword)
                    },
                    onUnavailable = {
                        hasBiometricCredentials = hasStoredBiometricCredentials(context)
                    },
                )
            }
        }

        TextButton(
            onClick = {
                if (email.isNotBlank()) {
                    viewModel.forgotPassword(email)
                }
            },
            modifier = Modifier.align(Alignment.CenterHorizontally),
        ) {
            Text("Forgot password?", color = Color(0xFF1484D9), fontWeight = FontWeight.SemiBold)
        }

        if (email.isNotBlank()) {
            TextButton(
                onClick = { viewModel.resendConfirmation(email) },
                modifier = Modifier.align(Alignment.CenterHorizontally),
            ) {
                Text("Resend verification email", color = Color(0xFF1484D9), fontWeight = FontWeight.SemiBold)
            }
        }

        Row(
            modifier = Modifier.align(Alignment.CenterHorizontally),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("No account?", color = Color(0xFF737D91), fontSize = 13.sp)
            TextButton(onClick = onSignup, contentPadding = PaddingValues(0.dp)) {
                Text("Sign up", color = Color(0xFF1484D9), fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
            }
        }
        },
    )
}

@Composable
fun SignupScreen(
    viewModel: AppViewModel,
    onBackToLogin: () -> Unit,
) {
    var firstName by rememberSaveable { mutableStateOf("") }
    var lastName by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var passwordVisible by rememberSaveable { mutableStateOf(false) }
    var region by rememberSaveable { mutableStateOf("") }
    var city by rememberSaveable { mutableStateOf("") }
    val bootstrapping by viewModel.bootstrapping.collectAsState()
    val cityOptions = remember(region, city) { authCitiesFor(region, city) }

    AuthScaffold(
        title = "Create your account.",
        subtitle = "Start renting in minutes",
        selectedTab = AuthTab.SIGNUP,
        onTabChange = { if (it == AuthTab.LOGIN) onBackToLogin() },
        onContinueAsGuest = null,
        content = {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            AuthTextField("First name", firstName, { firstName = it }, modifier = Modifier.weight(1f))
            AuthTextField("Last name", lastName, { lastName = it }, modifier = Modifier.weight(1f))
        }
        AuthTextField("Email", email, { email = it }, keyboardType = KeyboardType.Email)
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            AuthSelectField("Region", region, AuthReferenceData.regions, { selection ->
                region = selection
                val options = authCitiesFor(selection, city)
                if (options.none { it.equals(city, ignoreCase = true) }) {
                    city = options.firstOrNull().orEmpty()
                }
            }, modifier = Modifier.weight(1f))
            AuthSelectField("City", city, cityOptions, { city = it }, modifier = Modifier.weight(1f))
        }
        AuthPasswordField(
            label = "Password",
            value = password,
            onValueChange = { password = it },
            visible = passwordVisible,
            onToggleVisibility = { passwordVisible = !passwordVisible },
        )

        AuthPrimaryButton(
            text = if (bootstrapping) "Please wait..." else "Create account",
            enabled = !bootstrapping,
        ) {
            viewModel.signup(
                firstName = firstName,
                lastName = lastName,
                email = email,
                password = password,
                city = city,
                region = region,
            )
        }

        Row(
            modifier = Modifier.align(Alignment.CenterHorizontally),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Already registered?", color = Color(0xFF737D91), fontSize = 13.sp)
            TextButton(onClick = onBackToLogin, contentPadding = PaddingValues(0.dp)) {
                Text("Log in", color = Color(0xFF1484D9), fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
            }
        }

        Spacer(modifier = Modifier.height(8.dp))
        OutlinedButton(
            onClick = { viewModel.continueAsGuest() },
            modifier = Modifier.fillMaxWidth().height(48.dp),
            shape = RoundedCornerShape(99.dp),
            border = BorderStroke(1.5.dp, Color(0xFFD0DEF0)),
            colors = ButtonDefaults.outlinedButtonColors(containerColor = Color.White),
        ) {
            Text("Continue as guest", color = Color(0xFF0A2B54), fontWeight = FontWeight.Medium)
        }
        },
    )
}

private object AuthReferenceData {
    val regions = listOf(
        "Greater Accra Region",
        "Ashanti Region",
        "Western Region",
        "Central Region",
        "Eastern Region",
        "Volta Region",
        "Northern Region",
        "Upper East Region",
        "Upper West Region",
        "Bono Region",
        "Bono East Region",
        "Ahafo Region",
        "Western North Region",
        "Oti Region",
        "North East Region",
        "Savannah Region",
    )

    val citiesByRegion = mapOf(
        "Greater Accra Region" to listOf("Accra", "Tema", "Madina", "East Legon", "Adenta"),
        "Ashanti Region" to listOf("Kumasi", "Obuasi", "Ejisu"),
        "Western Region" to listOf("Takoradi", "Sekondi", "Tarkwa"),
        "Central Region" to listOf("Cape Coast", "Kasoa", "Winneba"),
        "Eastern Region" to listOf("Koforidua", "Akosombo", "Nsawam"),
        "Volta Region" to listOf("Ho", "Hohoe", "Keta"),
        "Northern Region" to listOf("Tamale", "Yendi"),
    )
}

private fun authCitiesFor(region: String, preferred: String): List<String> {
    val defaults = AuthReferenceData.citiesByRegion[region].orEmpty().ifEmpty { listOf("Accra") }
    return if (preferred.isNotBlank() && defaults.none { it.equals(preferred, ignoreCase = true) }) {
        listOf(preferred) + defaults
    } else {
        defaults
    }
}

private data class StoredBiometricCredentials(val email: String, val password: String)

private fun saveBiometricCredentials(context: Context, email: String, password: String) {
    val cleanEmail = email.trim()
    if (cleanEmail.isBlank() || password.isBlank()) return
    context.getSharedPreferences("hayame_biometric_login", Context.MODE_PRIVATE)
        .edit()
        .putString("email", cleanEmail)
        .putString("password", password)
        .apply()
}

private fun loadBiometricCredentials(context: Context): StoredBiometricCredentials? {
    val prefs = context.getSharedPreferences("hayame_biometric_login", Context.MODE_PRIVATE)
    val email = prefs.getString("email", null).orEmpty()
    val password = prefs.getString("password", null).orEmpty()
    return if (email.isNotBlank() && password.isNotBlank()) {
        StoredBiometricCredentials(email, password)
    } else {
        null
    }
}

private fun hasStoredBiometricCredentials(context: Context): Boolean {
    return loadBiometricCredentials(context) != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
}

private fun launchBiometricLogin(
    context: Context,
    onCredentials: (String, String) -> Unit,
    onUnavailable: () -> Unit,
) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
        onUnavailable()
        return
    }
    val credentials = loadBiometricCredentials(context) ?: run {
        onUnavailable()
        return
    }
    val activity = context as? Activity ?: run {
        onUnavailable()
        return
    }
    val prompt = BiometricPrompt.Builder(context)
        .setTitle("Log in to Hayame")
        .setSubtitle("Use biometrics to unlock your saved login")
        .setNegativeButton("Cancel", activity.mainExecutor) { _, _ -> }
        .build()
    prompt.authenticate(
        CancellationSignal(),
        activity.mainExecutor,
        object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult?) {
                onCredentials(credentials.email, credentials.password)
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence?) {
                onUnavailable()
            }
        },
    )
}

@Composable
fun MainShell(
    viewModel: AppViewModel,
    initialTab: MainTab = MainTab.HOME,
    appearanceHighlightNonce: Int = 0,
    onOpenCarDetail: (String) -> Unit,
    onOpenConversation: (String) -> Unit,
    onOpenMessages: () -> Unit,
    onOpenDashboard: () -> Unit,
    onOpenBecomeHost: () -> Unit,
    onOpenHostDashboard: () -> Unit,
    onOpenHostVehicles: () -> Unit,
    onOpenTrips: () -> Unit,
    onOpenProfile: () -> Unit,
    onOpenContact: () -> Unit,
    onOpenProtection: () -> Unit,
    onOpenCancellation: () -> Unit,
    onOpenPrivacy: () -> Unit,
    onOpenAuth: () -> Unit,
) {
    var tab by rememberSaveable(initialTab) { mutableStateOf(initialTab) }
    var homeSearchToken by rememberSaveable { mutableStateOf(0) }
    var homeSearchQuery by rememberSaveable { mutableStateOf("") }
    var homeSearchCarType by rememberSaveable { mutableStateOf("") }
    var homeSearchRegion by rememberSaveable { mutableStateOf("") }
    var homeSearchCity by rememberSaveable { mutableStateOf("") }
    var homeSearchMaxPrice by rememberSaveable { mutableStateOf(8000f) }
    var homeSearchInstantOnly by rememberSaveable { mutableStateOf(false) }
    val tabs = remember { MainTab.entries }
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val focusManager = LocalFocusManager.current
    val colors = LocalHayameColors.current

    LaunchedEffect(initialTab) {
        tab = initialTab
    }

    Scaffold(
        modifier = Modifier.pointerInput(Unit) {
            detectTapGestures(onTap = { focusManager.clearFocus() })
        },
        containerColor = colors.pageBackground,
        bottomBar = {
            HayameBottomTabBar(
                items = tabs.map { item ->
                    HayameBottomNavItem(
                        id = item,
                        title = item.title,
                        icon = when (item) {
                            MainTab.HOME -> Icons.Outlined.Home
                            MainTab.EXPLORE -> Icons.Outlined.Search
                            MainTab.TRIPS -> Icons.Outlined.CalendarMonth
                            MainTab.SAVED -> Icons.Outlined.FavoriteBorder
                            MainTab.MORE -> Icons.Outlined.MoreHoriz
                        },
                    )
                },
                selected = tab,
                onSelect = { item ->
                    when {
                        item == MainTab.TRIPS && !isAuthenticated -> {
                            viewModel.requireAuthentication(
                                message = "Sign in or sign up to view your trips.",
                                destination = NavRoutes.main(MainTab.TRIPS),
                            )
                        }
                        item == MainTab.SAVED && !isAuthenticated -> {
                            viewModel.requireAuthentication(
                                message = "Sign in or sign up to open your saved listings.",
                                destination = NavRoutes.main(MainTab.SAVED),
                            )
                        }
                        else -> {
                            tab = item
                        }
                    }
                },
            )
        },
    ) { innerPadding ->
        AnimatedContent(
            targetState = tab,
            transitionSpec = {
                (fadeIn(tween(180)) + slideInHorizontally { it / 14 })
                    .togetherWith(fadeOut(tween(120)) + slideOutHorizontally { -it / 18 })
            },
            label = "main-tab-transition",
        ) { selectedTab ->
            when (selectedTab) {
                MainTab.HOME -> HomeTab(
                    viewModel = viewModel,
                    paddingValues = innerPadding,
                    onOpenCarDetail = onOpenCarDetail,
                    onOpenMessages = onOpenMessages,
                    onOpenExplore = { tab = MainTab.EXPLORE },
                    onOpenMore = { tab = MainTab.MORE },
                    onOpenAuth = onOpenAuth,
                    onApplySearchToExplore = { search, carType, region, city, maxPrice, instantOnly ->
                        homeSearchQuery = search
                        homeSearchCarType = carType
                        homeSearchRegion = region
                        homeSearchCity = city
                        homeSearchMaxPrice = maxPrice
                        homeSearchInstantOnly = instantOnly
                        homeSearchToken += 1
                        tab = MainTab.EXPLORE
                    },
                )
                MainTab.EXPLORE -> ExploreTab(
                    viewModel = viewModel,
                    paddingValues = innerPadding,
                    onOpenCarDetail = onOpenCarDetail,
                    homeSearchToken = homeSearchToken,
                    homeSearchQuery = homeSearchQuery,
                    homeSearchCarType = homeSearchCarType,
                    homeSearchRegion = homeSearchRegion,
                    homeSearchCity = homeSearchCity,
                    homeSearchMaxPrice = homeSearchMaxPrice,
                    homeSearchInstantOnly = homeSearchInstantOnly,
                )
                MainTab.TRIPS -> TripsTab(
                    viewModel = viewModel,
                    paddingValues = innerPadding,
                    onOpenHostVehicles = onOpenHostVehicles,
                    onOpenCarDetail = onOpenCarDetail,
                    onOpenConversation = onOpenConversation,
                )
                MainTab.SAVED -> SavedTab(
                    viewModel = viewModel,
                    paddingValues = innerPadding,
                    onOpenCarDetail = onOpenCarDetail,
                )
                MainTab.MORE -> MoreTab(
                    viewModel = viewModel,
                    paddingValues = innerPadding,
                    appearanceHighlightNonce = appearanceHighlightNonce,
                    onOpenMessages = onOpenMessages,
                    onOpenDashboard = onOpenDashboard,
                    onOpenBecomeHost = onOpenBecomeHost,
                    onOpenHostDashboard = onOpenHostDashboard,
                    onOpenTrips = onOpenTrips,
                    onOpenProfile = onOpenProfile,
                    onOpenContact = onOpenContact,
                    onOpenProtection = onOpenProtection,
                    onOpenCancellation = onOpenCancellation,
                    onOpenPrivacy = onOpenPrivacy,
                )
            }
        }
    }
}

@Composable
fun HostShell(
    viewModel: AppViewModel,
    onExitHostMode: () -> Unit,
    onOpenConversation: (String) -> Unit,
    onOpenCarEditor: (String?) -> Unit,
    onOpenListingPhotos: (String) -> Unit,
    onOpenAvailability: (String) -> Unit,
    onOpenFavorites: () -> Unit,
    onOpenContact: () -> Unit,
    onOpenProtection: () -> Unit,
    onOpenCancellation: () -> Unit,
    onOpenReviews: () -> Unit,
) {
    var tab by rememberSaveable { mutableStateOf(HostMainTab.DASHBOARD) }
    val conversationsState by viewModel.conversationsState.collectAsState()
    val pendingHostTab by viewModel.pendingHostTab.collectAsState()
    val navigationItems = remember {
        listOf(
            HostMainTab.DASHBOARD to Icons.Outlined.Home,
            HostMainTab.CARS to Icons.Outlined.DirectionsCar,
            HostMainTab.BOOKINGS to Icons.Outlined.CalendarMonth,
            HostMainTab.EARNINGS to Icons.Outlined.AttachMoney,
            HostMainTab.INBOX to Icons.Outlined.ChatBubble,
            HostMainTab.PROFILE to Icons.Outlined.Person,
        )
    }
    val unreadCount = (conversationsState as? UiState.Success<List<com.hayame.app.core.network.ConversationDto>>)
        ?.data
        ?.sumOf { it.unread_count ?: 0 }
        ?: 0
    val colors = LocalHayameColors.current

    LaunchedEffect(pendingHostTab) {
        val requestedTab = pendingHostTab ?: return@LaunchedEffect
        tab = requestedTab
        viewModel.consumePendingHostTab(requestedTab)
    }

    Scaffold(
        containerColor = colors.pageBackground,
        bottomBar = {
            HayameBottomTabBar(
                items = navigationItems.map { (item, icon) ->
                    HayameBottomNavItem(
                        id = item,
                        title = if (item == HostMainTab.DASHBOARD) "Home" else item.title,
                        icon = icon,
                        badgeCount = if (item == HostMainTab.INBOX) unreadCount else 0,
                    )
                },
                selected = tab,
                onSelect = { tab = it },
            )
        },
    ) { inner ->
        Box(modifier = Modifier.fillMaxSize().padding(inner)) {
            AnimatedContent(
                targetState = tab,
                transitionSpec = {
                    (fadeIn(tween(180)) + slideInHorizontally { it / 14 })
                        .togetherWith(fadeOut(tween(120)) + slideOutHorizontally { -it / 18 })
                },
                label = "host-tab-transition",
            ) { selectedTab ->
                when (selectedTab) {
                    HostMainTab.DASHBOARD -> HostDashboardScreen(
                        viewModel = viewModel,
                        onBack = onExitHostMode,
                        onOpenCars = { tab = HostMainTab.CARS },
                        onOpenCreateCar = { tab = HostMainTab.CARS },
                        onOpenBookings = { tab = HostMainTab.BOOKINGS },
                        onOpenEarnings = { tab = HostMainTab.EARNINGS },
                        onOpenMessages = { tab = HostMainTab.INBOX },
                        onOpenFavorites = { tab = HostMainTab.PROFILE },
                        onOpenReviews = { tab = HostMainTab.PROFILE },
                        onOpenProfile = { tab = HostMainTab.PROFILE },
                    )
                    HostMainTab.CARS -> HostCarsScreen(
                        viewModel = viewModel,
                        onBack = onExitHostMode,
                        onCreate = { onOpenCarEditor(null) },
                        onEdit = onOpenCarEditor,
                        onOpenPhotos = onOpenListingPhotos,
                        onOpenAvailability = onOpenAvailability,
                    )
                    HostMainTab.BOOKINGS -> HostBookingsScreen(viewModel = viewModel, onBack = onExitHostMode, onOpenConversation = onOpenConversation)
                    HostMainTab.EARNINGS -> HostEarningsScreen(viewModel = viewModel, onBack = onExitHostMode)
                    HostMainTab.INBOX -> MessagesScreen(
                        viewModel = viewModel,
                        onBack = onExitHostMode,
                        onOpenConversation = onOpenConversation,
                        title = "Inbox",
                        showBackButton = false,
                    )
                    HostMainTab.PROFILE -> HostProfileScreen(
                        viewModel = viewModel,
                        onBack = onExitHostMode,
                        onOpenReviews = onOpenReviews,
                        onOpenFavorites = onOpenFavorites,
                        onOpenContact = onOpenContact,
                        onOpenProtection = onOpenProtection,
                        onOpenCancellation = onOpenCancellation,
                        onTurnOffHostMode = onExitHostMode,
                    )
                }
            }
        }
    }
}

private data class HayameBottomNavItem<T>(
    val id: T,
    val title: String,
    val icon: ImageVector,
    val badgeCount: Int = 0,
)

@Composable
private fun <T> HayameBottomTabBar(
    items: List<HayameBottomNavItem<T>>,
    selected: T,
    onSelect: (T) -> Unit,
) {
    val colors = LocalHayameColors.current
    Surface(
        color = colors.cardBackground,
        shadowElevation = 8.dp,
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            HorizontalDivider(color = colors.border)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .padding(horizontal = 10.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                items.forEach { item ->
                    val isSelected = item.id == selected
                    val tint = if (isSelected) colors.brandBlue else colors.mutedText
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(28.dp))
                            .background(if (isSelected) colors.brandLight else Color.Transparent)
                            .clickable { onSelect(item.id) }
                            .padding(vertical = 8.dp, horizontal = 2.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(3.dp),
                    ) {
                        BadgedBox(
                            badge = {
                                if (item.badgeCount > 0) {
                                    Badge(containerColor = colors.danger, contentColor = Color.White) {
                                        Text(if (item.badgeCount > 99) "99+" else item.badgeCount.toString())
                                    }
                                }
                            },
                        ) {
                            Icon(
                                imageVector = item.icon,
                                contentDescription = item.title,
                                tint = tint,
                                modifier = Modifier.size(26.dp),
                            )
                        }
                        Text(
                            text = item.title,
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.SemiBold,
                            color = tint,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
            }
        }
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun HomeTab(
    viewModel: AppViewModel,
    paddingValues: PaddingValues,
    onOpenCarDetail: (String) -> Unit,
    onOpenMessages: () -> Unit,
    onOpenExplore: () -> Unit,
    onOpenMore: () -> Unit,
    onOpenAuth: () -> Unit,
    onApplySearchToExplore: (String, String, String, String, Float, Boolean) -> Unit,
) {
    val carsState by viewModel.carsState.collectAsState()
    val favoritesState by viewModel.favoritesState.collectAsState()
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val me by viewModel.me.collectAsState()
    val locations by viewModel.locations.collectAsState()
    val conversationsState by viewModel.conversationsState.collectAsState()
    val favoriteIds = (favoritesState as? UiState.Success<Set<String>>)?.data ?: emptySet()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var query by rememberSaveable { mutableStateOf("") }
    var selectedRegion by rememberSaveable { mutableStateOf("Any region") }
    var selectedCity by rememberSaveable { mutableStateOf("Any city") }
    var selectedType by rememberSaveable { mutableStateOf("Any type") }
    var maxPrice by rememberSaveable { mutableStateOf(5000f) }
    var selectedCat by rememberSaveable { mutableStateOf("All") }
    var homeSearchText by rememberSaveable { mutableStateOf("") }
    var showHomeFilterSheet by rememberSaveable { mutableStateOf(false) }
    var homeRegion by rememberSaveable { mutableStateOf("") }
    var homeCity by rememberSaveable { mutableStateOf("") }
    var homeMaxPrice by rememberSaveable { mutableStateOf(8000f) }
    var homeInstantOnly by rememberSaveable { mutableStateOf(false) }
    var homeLocation by remember { mutableStateOf<HomeLocation?>(null) }
    var detectedCityName by remember { mutableStateOf<String?>(null) }
    val colors = LocalHayameColors.current
    val locationPermission = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { granted ->
        if (granted) {
            scope.launch {
                homeLocation = fetchHomeLocation(context)
                detectedCityName = homeLocation?.cityName
            }
        }
    }

    val regionOptions = remember(locations) {
        listOf("Any region") + locations.keys.filter { it.isNotBlank() }.sorted()
    }
    val cityOptions = remember(locations, selectedRegion) {
        val cities = if (selectedRegion == "Any region") locations.values.flatten() else locations[selectedRegion].orEmpty()
        listOf("Any city") + cities.filter { it.isNotBlank() }.distinct().sorted()
    }
    val carTypeOptions = remember(carsState) {
        val types = (carsState as? UiState.Success<List<CarDto>>)
            ?.data
            ?.mapNotNull { it.car_type?.trim() }
            ?.filter { it.isNotBlank() }
            ?.distinct()
            .orEmpty()
            .sorted()
        listOf("Any type") + types
    }
    val availableCategories = remember(carsState) {
        val defaultTypes = listOf("SUV", "Sedan", "Electric", "Luxury", "Pickup", "Van", "Compact", "Convertible", "Minivan", "Crossover")
        val types = (carsState as? UiState.Success<List<CarDto>>)
            ?.data
            ?.mapNotNull { it.car_type?.trim()?.takeIf { type -> type.isNotBlank() } }
            ?: emptyList()
        listOf("All") + (defaultTypes + types).distinct().sorted()
    }
    val homeCars = remember(carsState) {
        (carsState as? UiState.Success<List<CarDto>>)?.data ?: emptyList()
    }
    val nearYouCars = remember(homeCars, homeLocation) {
        val loc = homeLocation
        if (loc == null) {
            homeCars.take(5)
        } else {
            homeCars
                .map { car ->
                    val lat = car.latitude ?: car.lat
                    val lng = car.longitude ?: car.lng
                    val dist = if (lat != null && lng != null) {
                        distanceKm(loc.lat, loc.lng, lat, lng)
                    } else if (car.city.orEmpty().equals(loc.cityName.orEmpty(), ignoreCase = true)) {
                        0.0
                    } else {
                        999.0
                    }
                    car to dist
                }
                .sortedBy { it.second }
                .take(5)
                .map { it.first }
        }
    }
    val carsListed = (carsState as? UiState.Success<List<CarDto>>)?.data?.size ?: 0
    val approvedHosts = remember(carsState) {
        val count = (carsState as? UiState.Success<List<CarDto>>)
            ?.data
            ?.mapNotNull { it.owner_id ?: it.host_name }
            ?.toSet()
            ?.size
            ?: 0
        if (count > 0) maxOf(count, 24) else 24
    }
    val unreadCount = (conversationsState as? UiState.Success<List<com.hayame.app.core.network.ConversationDto>>)
        ?.data
        ?.sumOf { it.unread_count ?: 0 }
        ?: 0
    val profileCity = me?.profile?.city?.trim().orEmpty()
    val profileRegion = me?.profile?.region?.trim().orEmpty()
    val selectedCarType = if (selectedType == "Any type") "" else selectedType

    fun applyFilters() {
        val params = mutableMapOf<String, String>()
        params["sort"] = "new_listings"
        params["limit"] = "48"
        if (query.trim().isNotEmpty()) params["q"] = query.trim()
        if (selectedRegion != "Any region") params["region"] = selectedRegion
        if (selectedCity != "Any city") params["city"] = selectedCity
        if (selectedType != "Any type") params["carType"] = selectedType
        if (maxPrice < 5000f) params["maxPrice"] = maxPrice.toInt().toString()
        viewModel.loadCars(params)
    }

    fun applyHomeSearchToExplore() {
        onApplySearchToExplore(
            homeSearchText.trim(),
            if (selectedCat == "All") "" else selectedCat,
            homeRegion,
            homeCity,
            homeMaxPrice,
            homeInstantOnly,
        )
    }

    LaunchedEffect(Unit) {
        locationPermission.launch(Manifest.permission.ACCESS_COARSE_LOCATION)
        homeLocation = fetchHomeLocation(context)
        detectedCityName = homeLocation?.cityName
        viewModel.loadReferenceData()
        viewModel.loadCars(mapOf("sort" to "new_listings", "limit" to "48"))
        viewModel.loadFavorites()
        viewModel.loadConversations()
    }

    LaunchedEffect(availableCategories) {
        if (!availableCategories.contains(selectedCat)) {
            selectedCat = "All"
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
        item {
            Spacer(modifier = Modifier.height(6.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
	                Row(
	                    modifier = Modifier
	                        .weight(1f)
	                        .clickable {
	                            if (isAuthenticated) {
	                                onOpenMore()
	                            } else {
	                                onOpenAuth()
	                            }
	                        },
	                    horizontalArrangement = Arrangement.spacedBy(10.dp),
	                    verticalAlignment = Alignment.CenterVertically,
	                ) {
	                    RemoteAvatar(
	                        imageUrl = resolveAppImage(me.preferredAvatarRaw()),
                        name = me.preferredFullName() ?: me?.user?.email,
                        fallback = "U",
                        size = 42.dp,
                        textStyle = MaterialTheme.typography.labelLarge,
	                    )
	                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
	                        val displayName = if (isAuthenticated) {
	                            me.preferredFullName()?.trim()
	                                .takeUnless { it.isNullOrBlank() } ?: "Guest"
	                        } else {
	                            "Sign in or sign up"
	                        }
	                        val locationText = listOfNotNull(
	                            me?.profile?.city?.trim()?.takeIf { it.isNotBlank() },
	                            me?.profile?.region?.trim()?.takeIf { it.isNotBlank() },
                        ).firstOrNull() ?: detectedCityName ?: "Ghana"
	                        Text(
                            text = displayName,
                            style = MaterialTheme.typography.titleMedium.copy(fontSize = 16.sp),
	                            color = colors.brandNavy,
	                            fontWeight = FontWeight.Bold,
	                        )
	                        if (isAuthenticated) {
	                            Row(
	                                horizontalArrangement = Arrangement.spacedBy(4.dp),
	                                verticalAlignment = Alignment.CenterVertically,
	                            ) {
	                                Icon(
	                                    Icons.Outlined.LocationOn,
	                                    contentDescription = null,
	                                    tint = colors.mutedText,
	                                    modifier = Modifier.size(12.dp),
	                                )
	                                Text(
	                                    text = locationText,
	                                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 13.sp),
	                                    color = colors.mutedText,
	                                )
	                                Icon(
	                                    Icons.Outlined.ExpandMore,
	                                    contentDescription = null,
	                                    tint = BrandBlue,
	                                    modifier = Modifier.size(12.dp),
	                                )
	                            }
	                        }
	                    }
	                }
                Surface(
                    shape = CircleShape,
                    color = colors.cardBackground,
                    tonalElevation = 0.dp,
                    shadowElevation = 0.dp,
                    border = BorderStroke(1.dp, Color.Black.copy(alpha = 0.06f)),
                    modifier = Modifier.size(42.dp).clickable {
                        if (isAuthenticated) {
                            onOpenMessages()
                        } else {
                            viewModel.requireAuthentication(
                                message = "Sign in or sign up to view your messages.",
                                destination = NavRoutes.Messages,
                            )
                        }
                    },
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.Outlined.ChatBubble, contentDescription = "Messages", tint = colors.brandNavy)
                        if (unreadCount > 0) {
                            Box(
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(top = 6.dp, end = 6.dp)
                                    .size(10.dp)
                                    .background(BrandBlue, CircleShape)
                            )
                        }
                    }
                }
            }
        }
        item {
            Row(
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth(),
            ) {
                OutlinedTextField(
                    value = homeSearchText,
                    onValueChange = { homeSearchText = it },
                    modifier = Modifier.weight(1f),
	                    singleLine = true,
	                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
	                    keyboardActions = KeyboardActions(onSearch = { applyHomeSearchToExplore() }),
	                    shape = RoundedCornerShape(14.dp),
                    placeholder = { Text("Car, city, or host...", color = colors.mutedText) },
                    leadingIcon = {
                        Icon(Icons.Outlined.Search, contentDescription = null, tint = colors.mutedText)
                    },
                    trailingIcon = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (homeSearchText.isNotEmpty()) {
                                    IconButton(onClick = { homeSearchText = "" }) {
                                    Icon(Icons.Outlined.Close, contentDescription = "Clear", tint = colors.mutedText)
                                }
                            }
                            IconButton(onClick = { showHomeFilterSheet = true }) {
                                Box(
                                    modifier = Modifier
                                        .background(BrandBlue, RoundedCornerShape(10.dp))
                                        .padding(8.dp),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Icon(
                                        Icons.Outlined.Tune,
                                        contentDescription = "Filters",
                                        tint = Color.White,
                                        modifier = Modifier.size(16.dp),
                                    )
                                }
                            }
                        }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BrandBlue,
                        unfocusedBorderColor = colors.border,
                        focusedContainerColor = colors.cardBackground,
                        unfocusedContainerColor = colors.cardBackground,
                        focusedTextColor = colors.brandNavy,
                        unfocusedTextColor = colors.brandNavy,
                    ),
                )
	                Button(
	                    onClick = { applyHomeSearchToExplore() },
	                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BrandBlue),
                    modifier = Modifier.height(56.dp),
                ) {
                    Text("Search", color = Color.White, fontWeight = FontWeight.SemiBold)
                }
            }
        }
        item {
            LazyRow(
                contentPadding = PaddingValues(horizontal = 0.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                items(availableCategories) { cat ->
                    Surface(
                        onClick = { selectedCat = cat },
                        shape = RoundedCornerShape(20.dp),
                        color = if (selectedCat == cat) colors.brandBlue else colors.cardBackground,
                        border = if (selectedCat == cat) null else BorderStroke(1.dp, colors.border),
                    ) {
                        Text(
                            text = cat,
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                            style = MaterialTheme.typography.labelLarge.copy(fontSize = 13.sp),
                            color = if (selectedCat == cat) Color.White else colors.brandNavy,
                            fontWeight = FontWeight.Medium,
                        )
                    }
                }
            }
        }
        when (val state = carsState) {
            UiState.Loading,
            UiState.Idle -> item { HomeLoadingPlaceholder() }
            is UiState.Error -> item {
                ErrorBlock(
                    state.message,
                    onRetry = { viewModel.loadCars(mapOf("sort" to "new_listings", "limit" to "48")) },
                )
            }
            UiState.Empty -> item { EmptyBlock("No cars yet", "No listings are available right now.") }
            is UiState.Success -> {
                item {
                    HomeNearYouSection(
                        cars = nearYouCars,
                        favoriteIds = favoriteIds,
                        onOpen = onOpenCarDetail,
                        onFavorite = { car ->
                            viewModel.toggleFavorite(
                                carId = car.id,
                                currentlyFavorite = favoriteIds.contains(car.id),
                                authDestination = NavRoutes.main(MainTab.HOME),
                            )
                        },
                        onSeeAll = onOpenExplore,
                    )
                }
                item {
                    HomeSectionTitlePlaceholderAware(title = "Popular picks", onSeeAll = onOpenExplore)
                }
                if (homeCars.isEmpty()) {
                    item { EmptyBlock("No cars yet", "No listings are available right now.") }
                } else {
                    items(homeCars.take(3), key = { it.id }) { car ->
                        HomeFeaturedCarRow(
                            car = car,
                            isFavorite = favoriteIds.contains(car.id),
                            onOpen = { onOpenCarDetail(car.id) },
                            onToggleFavorite = {
                                viewModel.toggleFavorite(
                                    carId = car.id,
                                    currentlyFavorite = favoriteIds.contains(car.id),
                                    authDestination = NavRoutes.main(MainTab.HOME),
                                )
                            },
                        )
                    }
                }
            }
        }
        item {
            GradientPillButton(
                text = "Explore More",
                modifier = Modifier.fillMaxWidth(),
                onClick = onOpenExplore,
            )
        }
        item { Spacer(modifier = Modifier.height(24.dp)) }
        }

        if (showHomeFilterSheet) {
            ModalBottomSheet(onDismissRequest = { showHomeFilterSheet = false }) {
                ExploreFilterContent(
                    locations = locations,
                    selectedRegion = homeRegion,
                    selectedCity = homeCity,
                    maxPrice = homeMaxPrice,
                    instantOnly = homeInstantOnly,
                    onRegionChange = {
                        homeRegion = it
                        homeCity = ""
                    },
                    onCityChange = { homeCity = it },
                    onMaxPriceChange = { homeMaxPrice = it },
                    onInstantOnlyChange = { homeInstantOnly = it },
                    onDismiss = { showHomeFilterSheet = false },
                )
            }
        }
    }
}

@Composable
private fun ExploreFilterContent(
    locations: Map<String, List<String>>,
    selectedRegion: String,
    selectedCity: String,
    maxPrice: Float,
    instantOnly: Boolean,
    onRegionChange: (String) -> Unit,
    onCityChange: (String) -> Unit,
    onMaxPriceChange: (Float) -> Unit,
    onInstantOnlyChange: (Boolean) -> Unit,
    onDismiss: () -> Unit,
) {
    val regionOptions = remember(locations) {
        listOf("") + locations.keys.filter { it.isNotBlank() }.sorted()
    }
    val cityOptions = remember(locations, selectedRegion) {
        val cities = if (selectedRegion.isBlank()) {
            locations.values.flatten()
        } else {
            locations[selectedRegion].orEmpty()
        }
        listOf("") + cities.filter { it.isNotBlank() }.distinct().sorted()
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 16.dp)
            .navigationBarsPadding(),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Filters", style = MaterialTheme.typography.titleLarge, color = BrandNavy, fontWeight = FontWeight.Bold)
            TextButton(onClick = onDismiss) {
                Text("Done", color = BrandBlue, fontWeight = FontWeight.SemiBold)
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
            HomeFilterChip(
                label = selectedRegion.ifBlank { "Any region" },
                options = regionOptions.map { it.ifBlank { "Any region" } },
                modifier = Modifier.weight(1f),
                onSelected = { onRegionChange(if (it == "Any region") "" else it) },
            )
            HomeFilterChip(
                label = selectedCity.ifBlank { "Any city" },
                options = cityOptions.map { it.ifBlank { "Any city" } },
                modifier = Modifier.weight(1f),
                onSelected = { onCityChange(if (it == "Any city") "" else it) },
            )
        }
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                "Max GHS ${maxPrice.roundToInt()}",
                style = MaterialTheme.typography.labelLarge,
                color = MutedText,
                fontWeight = FontWeight.SemiBold,
            )
            Slider(
                value = maxPrice,
                onValueChange = onMaxPriceChange,
                valueRange = 100f..8000f,
                steps = 157,
                colors = SliderDefaults.colors(
                    activeTrackColor = BrandBlue,
                    inactiveTrackColor = Color(0xFFE4E8EF),
                    thumbColor = Color.White,
                    activeTickColor = Color.Transparent,
                    inactiveTickColor = Color.Transparent,
                ),
            )
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Instant Book only", color = BrandNavy, fontWeight = FontWeight.SemiBold)
            Switch(checked = instantOnly, onCheckedChange = onInstantOnlyChange)
        }
    }
}

@Composable
private fun HomeSectionTitlePlaceholderAware(title: String, onSeeAll: () -> Unit) {
    val colors = LocalHayameColors.current
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            title,
            style = MaterialTheme.typography.titleLarge,
            color = colors.brandNavy,
            fontWeight = FontWeight.SemiBold,
        )
        TextButton(onClick = onSeeAll) {
            Text("See all", color = BrandBlue, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
private fun HomeLoadingPlaceholder() {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        HomeNearYouPlaceholderSection()
        HomePopularPicksPlaceholderSection()
    }
}

@Composable
private fun HomeNearYouPlaceholderSection() {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        HomeSkeletonBlock(
            modifier = Modifier
                .width(88.dp)
                .height(20.dp),
            cornerRadius = 7,
        )
        HomeSkeletonBlock(
            modifier = Modifier
                .width(48.dp)
                .height(14.dp),
            cornerRadius = 6,
        )
    }
    Spacer(modifier = Modifier.height(10.dp))
    LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        items(2) {
            HomeNearYouPlaceholderCard()
        }
    }
}

@Composable
private fun HomeNearYouPlaceholderCard() {
    val colors = LocalHayameColors.current
    Card(
        modifier = Modifier.width(238.dp),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
        border = BorderStroke(1.dp, colors.border),
    ) {
        Column {
            HomeSkeletonBlock(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(154.dp),
                cornerRadius = 18,
            )
            Column(
                modifier = Modifier.padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(7.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    HomeSkeletonBlock(
                        modifier = Modifier
                            .width(128.dp)
                            .height(15.dp),
                        cornerRadius = 6,
                    )
                    HomeSkeletonBlock(
                        modifier = Modifier
                            .width(42.dp)
                            .height(18.dp),
                        cornerRadius = 9,
                    )
                }
                HomeSkeletonBlock(
                    modifier = Modifier
                        .width(92.dp)
                        .height(12.dp),
                    cornerRadius = 6,
                )
                HomeSkeletonBlock(
                    modifier = Modifier
                        .width(104.dp)
                        .height(17.dp),
                    cornerRadius = 6,
                )
            }
        }
    }
}

@Composable
private fun HomePopularPicksPlaceholderSection() {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        HomeSkeletonBlock(
            modifier = Modifier
                .width(132.dp)
                .height(22.dp),
            cornerRadius = 7,
        )
        HomeSkeletonBlock(
            modifier = Modifier
                .width(48.dp)
                .height(14.dp),
            cornerRadius = 6,
        )
    }
    Spacer(modifier = Modifier.height(12.dp))
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        repeat(3) {
            HomeFeaturedRowPlaceholderCard()
        }
    }
}

@Composable
private fun HomeFeaturedRowPlaceholderCard() {
    val colors = LocalHayameColors.current
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
        border = BorderStroke(1.dp, colors.border),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            HomeSkeletonBlock(
                modifier = Modifier
                    .width(136.dp)
                    .height(104.dp),
                cornerRadius = 14,
            )
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                HomeSkeletonBlock(
                    modifier = Modifier
                        .fillMaxWidth(0.82f)
                        .height(17.dp),
                    cornerRadius = 6,
                )
                HomeSkeletonBlock(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(13.dp),
                    cornerRadius = 6,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    HomeSkeletonBlock(
                        modifier = Modifier
                            .width(46.dp)
                            .height(18.dp),
                        cornerRadius = 9,
                    )
                    HomeSkeletonBlock(
                        modifier = Modifier
                            .width(66.dp)
                            .height(18.dp),
                        cornerRadius = 9,
                    )
                }
                HomeSkeletonBlock(
                    modifier = Modifier
                        .width(112.dp)
                        .height(18.dp),
                    cornerRadius = 6,
                )
            }
            HomeSkeletonBlock(
                modifier = Modifier.size(42.dp),
                cornerRadius = 21,
            )
        }
    }
}

@Composable
private fun HomeSkeletonBlock(modifier: Modifier, cornerRadius: Int) {
    val colors = LocalHayameColors.current
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(cornerRadius.dp))
            .background(colors.mutedText.copy(alpha = 0.14f)),
    )
}

@Composable
private fun HomeNearYouSection(
    cars: List<CarDto>,
    favoriteIds: Set<String>,
    onOpen: (String) -> Unit,
    onFavorite: (CarDto) -> Unit,
    onSeeAll: () -> Unit,
) {
    val colors = LocalHayameColors.current
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                "Near you",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.SemiBold,
                color = colors.brandNavy,
            )
            TextButton(onClick = onSeeAll) {
                Text("See all", color = BrandBlue, fontWeight = FontWeight.Medium)
            }
        }
        LazyRow(
            contentPadding = PaddingValues(horizontal = 0.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            items(cars.take(5), key = { it.id }) { car ->
                HomeNearYouCard(
                    car = car,
                    isFavorite = favoriteIds.contains(car.id),
                    onClick = { onOpen(car.id) },
                    onFavoriteClick = { onFavorite(car) },
                )
            }
        }
    }
}

@Composable
private fun HomeNearYouCard(
    car: CarDto,
    isFavorite: Boolean,
    onClick: () -> Unit,
    onFavoriteClick: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val imageUrl = remember(car.id, car.image_url, car.car_photos) {
        resolveAppImage(car.image_url) ?: car.car_photos.orEmpty()
            .firstNotNullOfOrNull { resolveAppImage(it.url) }
    }
    Card(
        modifier = Modifier.width(260.dp).clickable(onClick = onClick),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
        border = BorderStroke(1.dp, colors.border),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column {
            Box(modifier = Modifier.fillMaxWidth().height(160.dp)) {
                AsyncImage(
                    model = imageUrl,
                    contentDescription = null,
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)),
                    contentScale = ContentScale.Crop,
                )
                if (car.instant_book == true) {
                    Surface(
                        modifier = Modifier
                            .padding(10.dp)
                            .align(Alignment.TopStart),
                        color = Color.White.copy(alpha = 0.92f),
                        shape = RoundedCornerShape(8.dp),
                    ) {
                        Text(
                            "⚡ Instant",
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = Success,
                        )
                    }
                }
                Surface(
                    modifier = Modifier
                        .padding(10.dp)
                        .size(30.dp)
                        .align(Alignment.TopEnd)
                        .clickable(onClick = onFavoriteClick),
                    color = colors.cardBackground.copy(alpha = 0.92f),
                    shape = CircleShape,
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                            contentDescription = null,
                            tint = if (isFavorite) Color.Red else colors.brandNavy,
                            modifier = Modifier.size(14.dp),
                        )
                    }
                }
            }
            Column(
                modifier = Modifier.padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    car.title.orEmpty(),
                    style = MaterialTheme.typography.titleMedium.copy(fontSize = 15.sp),
                    fontWeight = FontWeight.SemiBold,
                    color = colors.brandNavy,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        "📍 ${car.city.orEmpty()}",
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.mutedText,
                    )
                    val hasReviews = (car.reviews_count ?: 0.0) > 0
                    Text(
                        "★ ${if (hasReviews) String.format("%.1f", car.avg_rating ?: 0.0) else "New"}",
                        style = MaterialTheme.typography.labelMedium,
                        color = Warning,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
                Text(
                    "GHS ${(car.daily_price ?: 0.0).roundToInt()} / day",
                    style = MaterialTheme.typography.titleMedium.copy(fontSize = 15.sp),
                    fontWeight = FontWeight.SemiBold,
                    color = BrandBlue,
                )
            }
        }
    }
}

@Composable
private fun HomeFilterChip(
    label: String,
    options: List<String>,
    modifier: Modifier = Modifier,
    onSelected: (String) -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }
    Box(modifier = modifier) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(99.dp))
                .clickable { expanded = true },
            shape = RoundedCornerShape(99.dp),
            color = Color(0xFFE8F2FC),
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = label,
                    style = MaterialTheme.typography.labelLarge.copy(fontSize = 11.sp),
                    color = BrandNavy,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Icon(Icons.Outlined.ExpandMore, contentDescription = null, tint = BrandNavy, modifier = Modifier.size(14.dp))
            }
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            options.forEach { option ->
                DropdownMenuItem(
                    text = { Text(option) },
                    onClick = {
                        onSelected(option)
                        expanded = false
                    },
                )
            }
        }
    }
}

@Composable
private fun HomeLocationTag(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
) {
    Surface(
        shape = RoundedCornerShape(99.dp),
        color = Color.White,
        border = BorderStroke(1.dp, Color.Black.copy(alpha = 0.08f)),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(icon, contentDescription = null, tint = BrandNavy, modifier = Modifier.size(16.dp))
            Text(label, color = BrandNavy, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun HomeFeaturedCarRow(
    car: CarDto,
    isFavorite: Boolean,
    onOpen: () -> Unit,
    onToggleFavorite: () -> Unit,
) {
    val colors = LocalHayameColors.current
    Box {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(colors.cardBackground)
                .border(BorderStroke(1.dp, colors.border), RoundedCornerShape(18.dp))
                .clickable(onClick = onOpen)
                .padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.Top,
        ) {
            AsyncImage(
                model = car.image_url ?: car.car_photos?.firstOrNull()?.url,
                contentDescription = null,
                modifier = Modifier
                    .size(width = 136.dp, height = 104.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(colors.brandLight),
                contentScale = ContentScale.Crop,
            )
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    car.title.orEmpty(),
                    style = MaterialTheme.typography.titleMedium.copy(fontSize = 17.sp),
                    color = colors.brandNavy,
                    fontWeight = FontWeight.Bold,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    listOfNotNull(car.city, car.region).joinToString(", "),
                    style = MaterialTheme.typography.bodyMedium.copy(fontSize = 13.sp),
                    color = colors.mutedText,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    val hasReviews = (car.reviews_count ?: 0.0) > 0
                    Text(
                        text = "★ ${if (hasReviews) String.format("%.1f", car.avg_rating ?: 0.0) else "New"}",
                        style = MaterialTheme.typography.labelLarge.copy(fontSize = 12.sp),
                        color = Warning,
                        fontWeight = FontWeight.Bold,
                    )
                    if (car.instant_book == true) {
                        Surface(
                            shape = RoundedCornerShape(999.dp),
                            color = Success.copy(alpha = 0.14f),
                        ) {
                            Text(
                                text = "Instant",
                                color = Success,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            )
                        }
                    }
                }
                Text(
                    "GHS${(car.daily_price ?: 0.0).toInt()}/day",
                    style = MaterialTheme.typography.bodyLarge.copy(fontSize = 15.sp),
                    color = BrandBlue,
                    fontWeight = FontWeight.Bold,
                )
            }
            Spacer(modifier = Modifier.widthIn(min = 24.dp))
        }

        Surface(
            shape = CircleShape,
            color = colors.cardBackground.copy(alpha = 0.96f),
            border = BorderStroke(1.dp, colors.border),
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(8.dp)
                .size(32.dp)
                .clickable(onClick = onToggleFavorite),
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                    contentDescription = "Favorite",
                    tint = if (isFavorite) Color.Red else colors.brandNavy,
                    modifier = Modifier.size(16.dp),
                )
            }
        }
    }
}

private enum class ExploreLayoutMode {
    LIST,
    GRID,
}

@Composable
private fun ExploreTab(
    viewModel: AppViewModel,
    paddingValues: PaddingValues,
    onOpenCarDetail: (String) -> Unit,
    homeSearchToken: Int = 0,
    homeSearchQuery: String = "",
    homeSearchCarType: String = "",
    homeSearchRegion: String = "",
    homeSearchCity: String = "",
    homeSearchMaxPrice: Float = 8000f,
    homeSearchInstantOnly: Boolean = false,
) {
    val carsState by viewModel.carsState.collectAsState()
    val favoritesState by viewModel.favoritesState.collectAsState()
    val favoriteIds = (favoritesState as? UiState.Success<Set<String>>)?.data ?: emptySet()
    var query by rememberSaveable { mutableStateOf("") }
    var sort by rememberSaveable { mutableStateOf("new_listings") }
    var appliedCarType by rememberSaveable { mutableStateOf("") }
    var selectedBrand by rememberSaveable { mutableStateOf("") }
    var appliedRegion by rememberSaveable { mutableStateOf("") }
    var appliedCity by rememberSaveable { mutableStateOf("") }
    var appliedMaxPrice by rememberSaveable { mutableStateOf(8000f) }
    var appliedInstantOnly by rememberSaveable { mutableStateOf(false) }
    var layoutMode by rememberSaveable { mutableStateOf(ExploreLayoutMode.LIST.name) }
    val selectedLayout = remember(layoutMode) {
        runCatching { ExploreLayoutMode.valueOf(layoutMode) }.getOrElse { ExploreLayoutMode.LIST }
    }
    val vehicleBrandOptions = remember(carsState) {
        val popular = listOf(
            "Toyota",
            "Honda",
            "Kia",
            "Hyundai",
            "Range Rover",
            "Mercedes-Benz",
            "BMW",
            "Nissan",
            "Ford",
            "Mitsubishi",
        )
        val liveBrands = (carsState as? UiState.Success<List<CarDto>>)
            ?.data
            ?.mapNotNull { it.brand?.trim()?.takeIf { brand -> brand.isNotBlank() } }
            ?: emptyList()
        (popular + liveBrands)
            .distinctBy { it.lowercase() }
    }

    fun exploreParams(): Map<String, String> {
        val params = mutableMapOf<String, String>()
        params["sort"] = sort
        if (query.trim().isNotEmpty()) params["q"] = query.trim()
        if (appliedCarType.isNotEmpty()) params["carType"] = appliedCarType
        if (selectedBrand.isNotEmpty()) params["brand"] = selectedBrand
        if (appliedRegion.isNotEmpty()) params["region"] = appliedRegion
        if (appliedCity.isNotEmpty()) params["city"] = appliedCity
        if (appliedMaxPrice < 8000f) params["maxPrice"] = appliedMaxPrice.toInt().toString()
        if (appliedInstantOnly) params["instantBook"] = "true"
        return params
    }

    LaunchedEffect(Unit) {
        if (homeSearchToken == 0) {
            viewModel.loadCars()
        }
        viewModel.loadFavorites()
    }

    LaunchedEffect(homeSearchToken) {
        if (homeSearchToken > 0) {
            query = homeSearchQuery
            appliedCarType = homeSearchCarType
            selectedBrand = ""
            appliedRegion = homeSearchRegion
            appliedCity = homeSearchCity
            appliedMaxPrice = homeSearchMaxPrice
            appliedInstantOnly = homeSearchInstantOnly
            val params = mutableMapOf<String, String>()
            params["sort"] = sort
            if (homeSearchQuery.trim().isNotEmpty()) params["q"] = homeSearchQuery.trim()
            if (homeSearchCarType.isNotEmpty()) params["carType"] = homeSearchCarType
            if (homeSearchRegion.isNotEmpty()) params["region"] = homeSearchRegion
            if (homeSearchCity.isNotEmpty()) params["city"] = homeSearchCity
            if (homeSearchMaxPrice < 8000f) params["maxPrice"] = homeSearchMaxPrice.toInt().toString()
            if (homeSearchInstantOnly) params["instantBook"] = "true"
            viewModel.loadCars(params)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues)
            .padding(horizontal = 16.dp),
    ) {
        Spacer(modifier = Modifier.height(16.dp))
	        OutlinedTextField(
	            value = query,
	            onValueChange = { query = it },
            placeholder = { Text("Search by car, city or region") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null) },
	            singleLine = true,
	            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
	            keyboardActions = KeyboardActions(onSearch = { viewModel.loadCars(exploreParams()) }),
	            trailingIcon = {
	                if (query.isNotEmpty()) {
	                    TextButton(onClick = {
	                        viewModel.loadCars(exploreParams())
	                    }) { Text("Search", fontWeight = FontWeight.Bold) }
	                }
	            }
	        )

	        VehicleBrandCarousel(
	            brands = vehicleBrandOptions,
	            selectedBrand = selectedBrand,
	            onSelect = { brand ->
	                selectedBrand = brand
	                val params = exploreParams().toMutableMap()
	                if (brand.isBlank()) {
	                    params.remove("brand")
	                } else {
	                    params["brand"] = brand
	                }
	                viewModel.loadCars(params)
	            },
	        )

	        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(modifier = Modifier.weight(1f)) {
                LazyRow(
                    contentPadding = PaddingValues(vertical = 0.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val filters = listOf("Price Low" to "price_low", "Price High" to "price_high", "Top Rated" to "top_rated", "Latest" to "new_listings")
                    items(filters) { filter ->
                        val selected = sort == filter.second
                        Surface(
	                            onClick = {
	                                sort = filter.second
	                                viewModel.loadCars(exploreParams() + ("sort" to filter.second))
	                            },
                            shape = RoundedCornerShape(20.dp),
                            color = if (selected) BrandBlue else Color.White,
                            border = if (selected) null else BorderStroke(1.dp, Color.LightGray.copy(alpha = 0.5f)),
                            modifier = Modifier.height(36.dp)
                        ) {
                            Box(modifier = Modifier.padding(horizontal = 16.dp), contentAlignment = Alignment.Center) {
                                Text(filter.first, style = MaterialTheme.typography.labelLarge, color = if (selected) Color.White else BrandNavy)
                            }
                        }
                    }
                }
            }
            ExploreLayoutToggle(
                selectedLayout = selectedLayout,
                onSelect = { layoutMode = it.name },
            )
        }

        when (val state = carsState) {
            UiState.Loading -> LoadingBlock("Searching...")
            is UiState.Error -> ErrorBlock(state.message, onRetry = { viewModel.loadCars() })
	            UiState.Empty -> EmptyBlock("No matching listings", "Try changing filters or search terms.")
	            is UiState.Success -> {
	                val visibleCars = if (selectedBrand.isBlank()) {
	                    state.data
	                } else {
	                    state.data.filter { it.brand.orEmpty().equals(selectedBrand, ignoreCase = true) }
	                }
	                if (visibleCars.isEmpty()) {
	                    EmptyBlock("No matching listings", "Try another vehicle make or search term.")
	                } else if (selectedLayout == ExploreLayoutMode.GRID) {
	                    LazyVerticalGrid(
                        columns = GridCells.Fixed(2),
                        modifier = Modifier.weight(1f),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
	                        verticalArrangement = Arrangement.spacedBy(16.dp),
	                        contentPadding = PaddingValues(bottom = 16.dp),
	                    ) {
	                        gridItems(visibleCars, key = { it.id }) { car ->
	                            ExploreGridCard(
                                car = car,
                                isFavorite = favoriteIds.contains(car.id),
                                onClick = { onOpenCarDetail(car.id) },
                                onFavoriteClick = {
                                    viewModel.toggleFavorite(
                                        carId = car.id,
                                        currentlyFavorite = favoriteIds.contains(car.id),
                                        authDestination = NavRoutes.main(MainTab.EXPLORE),
                                    )
                                },
                            )
                        }
                    }
                } else {
	                    LazyColumn(
                        modifier = Modifier.weight(1f),
	                        verticalArrangement = Arrangement.spacedBy(16.dp),
	                        contentPadding = PaddingValues(bottom = 16.dp)
	                    ) {
	                        items(visibleCars, key = { it.id }) { car ->
	                            CarCard(
                                car = car,
                                isFavorite = favoriteIds.contains(car.id),
                                imageHeight = 220.dp,
                                onClick = { onOpenCarDetail(car.id) },
                                onFavoriteClick = {
                                    viewModel.toggleFavorite(
                                        carId = car.id,
                                        currentlyFavorite = favoriteIds.contains(car.id),
                                        authDestination = NavRoutes.main(MainTab.EXPLORE),
                                    )
                                },
                            )
                        }
                    }
                }
            }
            UiState.Idle -> LoadingBlock()
        }
    }
}

@Composable
private fun VehicleBrandCarousel(
    brands: List<String>,
    selectedBrand: String,
    onSelect: (String) -> Unit,
) {
    LazyRow(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 10.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        contentPadding = PaddingValues(vertical = 2.dp),
    ) {
        item {
            VehicleBrandPill(
                title = "All",
                selected = selectedBrand.isBlank(),
                onClick = { onSelect("") },
            )
        }
        items(brands, key = { it }) { brand ->
            VehicleBrandPill(
                title = brand,
                selected = selectedBrand.equals(brand, ignoreCase = true),
                onClick = { onSelect(brand) },
            )
        }
    }
}

@Composable
private fun VehicleBrandPill(
    title: String,
    selected: Boolean,
    onClick: () -> Unit,
) {
    val colors = LocalHayameColors.current

    Column(
        modifier = Modifier
            .size(width = 82.dp, height = 74.dp)
            .clickable(onClick = onClick)
            .padding(horizontal = 6.dp, vertical = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        VehicleBrandLogo(
            title = title,
            selected = selected,
            modifier = Modifier.size(width = 54.dp, height = 38.dp),
        )
        Text(
            text = title,
            style = MaterialTheme.typography.labelSmall,
            color = if (selected) colors.brandBlue else colors.brandNavy,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
        )
        Box(
            modifier = Modifier
                .size(width = 22.dp, height = 3.dp)
                .background(if (selected) BrandBlue else Color.Transparent, CircleShape),
        )
    }
}

@Composable
private fun VehicleBrandLogo(
    title: String,
    selected: Boolean,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val colors = LocalHayameColors.current
    val darkMode = colors.pageBackground.luminance() < 0.5f
    val logoRes = vehicleBrandLogoRes(context, title)
    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        if (logoRes != null) {
            Image(
                painter = painterResource(id = logoRes),
                contentDescription = "$title logo",
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Fit,
                colorFilter = if (darkMode && !selected) ColorFilter.tint(Color.White) else null,
            )
        } else if (title == "All") {
            Icon(
                Icons.Outlined.DirectionsCar,
                contentDescription = null,
                tint = if (selected) colors.brandBlue else colors.mutedText,
                modifier = Modifier.size(26.dp),
            )
        } else {
            Text(
                text = brandMonogram(title),
                style = MaterialTheme.typography.labelSmall.copy(fontSize = 14.sp),
                color = if (selected) colors.brandBlue else colors.mutedText,
                fontWeight = FontWeight.Black,
                maxLines = 1,
            )
        }
    }
}

@DrawableRes
private fun vehicleBrandLogoRes(context: Context, title: String): Int? {
    return vehicleBrandLogoCandidates(title)
        .firstNotNullOfOrNull { assetName ->
            context.resources
                .getIdentifier(assetName, "drawable", context.packageName)
                .takeIf { it != 0 }
        }
}

private fun vehicleBrandLogoCandidates(title: String): List<String> {
    val normalizedTitle = Normalizer
        .normalize(title.trim().lowercase(Locale.US), Normalizer.Form.NFD)
        .replace("\\p{Mn}+".toRegex(), "")

    val withoutParentheses = normalizedTitle
        .replace("\\s*\\([^)]*\\)".toRegex(), "")
        .trim()

    val aliases = mapOf(
        "baic" to listOf("baic_motor"),
        "gac" to listOf("gac_group"),
        "range rover" to listOf("land_rover"),
        "mercedes" to listOf("mercedes_benz"),
        "mercedes benz" to listOf("mercedes_benz"),
        "mercedes-benz" to listOf("mercedes_benz"),
        "mg" to listOf("mg"),
        "mini" to listOf("mini"),
        "ram" to listOf("ram"),
        "rolls royce" to listOf("rolls_royce"),
        "rolls-royce" to listOf("rolls_royce"),
        "samsung" to listOf("renault_samsung"),
        "samsung older badge" to listOf("renault_samsung"),
        "zx auto" to listOf("zx_auto"),
    )

    val parentheticalSlugs = "\\(([^)]+)\\)"
        .toRegex()
        .findAll(normalizedTitle)
        .map { vehicleBrandLogoSlug(it.groupValues[1]) }
        .toList()

    val slugs = aliases[normalizedTitle].orEmpty() +
        aliases[withoutParentheses].orEmpty() +
        listOf(vehicleBrandLogoSlug(normalizedTitle), vehicleBrandLogoSlug(withoutParentheses)) +
        parentheticalSlugs

    return slugs
        .filter { it.isNotBlank() }
        .distinct()
        .map { "car_logo_$it" }
}

private fun vehicleBrandLogoSlug(value: String): String {
    return value
        .replace("&", " and ")
        .replace("[^a-z0-9]+".toRegex(), "_")
        .trim('_')
}

private fun brandMonogram(title: String): String {
    if (title == "All") return "ALL"
    return title
        .split(" ")
        .filter { it.isNotBlank() }
        .take(2)
        .mapNotNull { it.firstOrNull()?.uppercaseChar()?.toString() }
        .joinToString("")
        .ifBlank { title.take(2).uppercase() }
}

@Composable
private fun ExploreLayoutToggle(
    selectedLayout: ExploreLayoutMode,
    onSelect: (ExploreLayoutMode) -> Unit,
) {
    Surface(
        shape = RoundedCornerShape(22.dp),
        color = Color.White,
        border = BorderStroke(1.dp, Color.LightGray.copy(alpha = 0.45f)),
    ) {
        Row(
            modifier = Modifier.padding(4.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            ExploreLayoutButton(
                selected = selectedLayout == ExploreLayoutMode.LIST,
                iconRes = R.drawable.ic_explore_layout_list,
                contentDescription = "Default list view",
                onClick = { onSelect(ExploreLayoutMode.LIST) },
            )
            ExploreLayoutButton(
                selected = selectedLayout == ExploreLayoutMode.GRID,
                iconRes = R.drawable.ic_explore_layout_grid,
                contentDescription = "2 by 2 grid view",
                onClick = { onSelect(ExploreLayoutMode.GRID) },
            )
        }
    }
}

@Composable
private fun ExploreLayoutButton(
    selected: Boolean,
    iconRes: Int,
    contentDescription: String,
    onClick: () -> Unit,
) {
    Surface(
        modifier = Modifier
            .size(38.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        color = if (selected) BrandBlue.copy(alpha = 0.16f) else Color.Transparent,
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(
                painter = painterResource(id = iconRes),
                contentDescription = contentDescription,
                tint = if (selected) BrandBlue else BrandNavy,
                modifier = Modifier.size(18.dp),
            )
        }
    }
}

@Composable
private fun ExploreGridCard(
    car: CarDto,
    isFavorite: Boolean,
    onClick: () -> Unit,
    onFavoriteClick: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val imageUrl = remember(car.id, car.image_url, car.car_photos) {
        resolveAppImage(car.image_url) ?: car.car_photos.orEmpty().firstNotNullOfOrNull { resolveAppImage(it.url) }
    }
    val title = car.title?.trim().takeUnless { it.isNullOrBlank() }
        ?: listOfNotNull(car.brand?.trim(), car.model?.trim()).filter { it.isNotBlank() }.joinToString(" ").ifBlank { "Hayame listing" }
    val location = listOfNotNull(car.city, car.region).joinToString(", ").ifBlank { "Ghana" }
    val price = (car.daily_price ?: 0.0).roundToInt()
    val rating = String.format("%.1f", car.avg_rating ?: 0.0)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
        border = BorderStroke(1.dp, colors.border),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Box {
                if (!imageUrl.isNullOrBlank()) {
                    AsyncImage(
                        model = imageUrl,
                        contentDescription = null,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(184.dp)
                            .clip(RoundedCornerShape(topStart = 18.dp, topEnd = 18.dp)),
                        contentScale = ContentScale.Crop,
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(184.dp)
                            .background(colors.brandLight),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text("No image", color = colors.mutedText)
                    }
                }

                Surface(
                    shape = CircleShape,
                    color = colors.cardBackground.copy(alpha = 0.96f),
                    border = BorderStroke(1.dp, colors.border),
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(10.dp)
                        .size(38.dp)
                        .clickable(onClick = onFavoriteClick),
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                            contentDescription = "Favorite",
                            tint = if (isFavorite) Color.Red else colors.brandNavy,
                            modifier = Modifier.size(18.dp),
                        )
                    }
                }
            }

            Column(
                modifier = Modifier.padding(start = 12.dp, end = 12.dp, bottom = 12.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = BrandNavy,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = location,
                    style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                    color = MutedText,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "★ $rating",
                        style = MaterialTheme.typography.labelLarge,
                        color = Warning,
                        fontWeight = FontWeight.Bold,
                    )
                    if (car.instant_book == true) {
                        Surface(
                            shape = RoundedCornerShape(999.dp),
                            color = Success.copy(alpha = 0.14f),
                        ) {
                            Text(
                                text = "Instant",
                                color = Success,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            )
                        }
                    }
                }
                Text(
                    text = "GHS$price / day",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.ExtraBold,
                    color = BrandBlue,
                )
            }
        }
    }
}

@Composable
private fun TripsTab(
    viewModel: AppViewModel,
    paddingValues: PaddingValues,
    onOpenHostVehicles: () -> Unit,
    onOpenCarDetail: (String) -> Unit,
    onOpenConversation: (String) -> Unit,
) {
    val bookingsState by viewModel.bookingsState.collectAsState()
    val pendingBookingFocus by viewModel.pendingBookingFocus.collectAsState()
    val me by viewModel.me.collectAsState()
    val listState = rememberLazyListState()
    val guestTrips = (bookingsState as? UiState.Success<List<BookingDto>>)
        ?.data
        .orEmpty()
        .filter {
            !it.role.orEmpty().contains("owner", ignoreCase = true) &&
                it.payment_status.equals("paid", ignoreCase = true)
        }
    val today = LocalDate.now()
    val upcomingTrips = guestTrips.filter { (parseApiDate(it.end_date) ?: today) >= today }
    val pastTrips = guestTrips.filter { (parseApiDate(it.end_date) ?: today) < today }
    val hostStatus = (me?.host_application_status ?: me?.host_status ?: "").trim().lowercase()
    val isHost = me?.is_host == true || hostStatus == "approved"

    LaunchedEffect(Unit) { viewModel.loadBookings() }

    LaunchedEffect(pendingBookingFocus, guestTrips) {
        val bookingId = pendingBookingFocus ?: return@LaunchedEffect
        val index = guestTrips.indexOfFirst { it.id == bookingId }
        if (index < 0) return@LaunchedEffect
        listState.animateScrollToItem(index + 1)
        viewModel.consumePendingBookingFocus(bookingId)
    }

    LazyColumn(
        state = listState,
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item { Spacer(modifier = Modifier.height(16.dp)); SectionHeader("Your trips") }
        when (val state = bookingsState) {
            UiState.Loading -> item { LoadingBlock("Loading bookings...") }
            is UiState.Error -> item { ErrorBlock(state.message, onRetry = { viewModel.loadBookings() }) }
            UiState.Empty -> item { EmptyBlock("No trips yet", "Your bookings will appear here after payment.") }
            is UiState.Success -> {
                if (guestTrips.isEmpty()) {
                    item { EmptyBlock("No trips yet", "Your bookings will appear here after payment.") }
                } else {
                    item { SectionHeader("Upcoming bookings") }
                    if (upcomingTrips.isEmpty()) {
                        item { EmptyBlock("No upcoming trips", "Book your next ride from Explore.") }
                    } else {
                        items(upcomingTrips, key = { it.id }) { booking ->
                            BookingCard(
                                booking = booking,
                                onOpenCarDetail = onOpenCarDetail,
                                onMessageHost = { messageHostForTrip(viewModel, booking, me, onOpenConversation) },
                                onApprove = { viewModel.approveBooking(it) },
                                onReject = { id, r -> viewModel.rejectBooking(id, r) },
                                onDispute = { id, r -> viewModel.createDispute(id, r) },
                                isHighlighted = pendingBookingFocus == booking.id,
                            )
                        }
                    }

                    item {
                        SectionHeader(
                            title = "Past trips",
                            action = "Vehicles",
                            onAction = {
                                if (isHost) {
                                    onOpenHostVehicles()
                                } else {
                                    viewModel.showMessage("Host access is required to open vehicles.")
                                }
                            },
                        )
                    }
                    if (pastTrips.isEmpty()) {
                        item { EmptyBlock("No past trips", "Completed trips appear here.") }
                    } else {
                        items(pastTrips, key = { it.id }) { booking ->
                        BookingCard(
                            booking = booking,
                            onOpenCarDetail = onOpenCarDetail,
                            onMessageHost = { messageHostForTrip(viewModel, booking, me, onOpenConversation) },
                            onApprove = { viewModel.approveBooking(it) },
                            onReject = { id, r -> viewModel.rejectBooking(id, r) },
                            onDispute = { id, r -> viewModel.createDispute(id, r) },
                            isHighlighted = pendingBookingFocus == booking.id,
                        )
                        }
                    }
                }
            }
            UiState.Idle -> item { LoadingBlock() }
        }
        item { Spacer(modifier = Modifier.height(24.dp)) }
    }
}

@Composable
private fun BookingCard(
    booking: com.hayame.app.core.network.BookingDto,
    onOpenCarDetail: (String) -> Unit,
    onMessageHost: () -> Unit,
    onApprove: (String) -> Unit,
    onReject: (String, String) -> Unit,
    onDispute: (String, String) -> Unit,
    isHighlighted: Boolean = false,
) {
    var disputeReason by remember { mutableStateOf("") }
    val displayStatus = resolveBookingDisplayStatus(
        status = booking.status,
        startDate = booking.start_date,
        endDate = booking.end_date,
    )
    val helperText = bookingHelperText(
        status = displayStatus,
        role = BookingDisplayRole.Renter,
        paymentStatus = booking.payment_status,
    )
    val showPaidBadge = shouldShowCompletedPaidBadge(displayStatus, booking.payment_status)
    val carId = booking.car_id.orEmpty()
    val vehicleImageUrl = resolveAppImage(booking.cars?.image_url)
        ?: booking.cars?.car_photos.orEmpty().firstNotNullOfOrNull { resolveAppImage(it.url) }
    val brandTitle = booking.cars?.brand?.takeIf { it.isNotBlank() }
        ?: booking.cars?.title
        ?: "All"
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = carId.isNotBlank()) { onOpenCarDetail(carId) },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = if (isHighlighted) 6.dp else 2.dp),
        border = BorderStroke(
            width = if (isHighlighted) 2.dp else 1.dp,
            color = if (isHighlighted) BrandBlue else Color.Black.copy(alpha = 0.05f),
        ),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                if (!vehicleImageUrl.isNullOrBlank()) {
                    AsyncImage(
                        model = vehicleImageUrl,
                        contentDescription = null,
                        modifier = Modifier
                            .size(width = 86.dp, height = 70.dp)
                            .clip(RoundedCornerShape(14.dp)),
                        contentScale = ContentScale.Crop,
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .size(width = 86.dp, height = 70.dp)
                            .background(BrandLight, RoundedCornerShape(14.dp)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Outlined.DirectionsCar, contentDescription = null, tint = BrandBlue)
                    }
                }

                Column(modifier = Modifier.weight(1f)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = booking.cars?.title ?: "Trip with Hayame",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = BrandNavy,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis,
                            )
                            Text(
                                text = helperText,
                                style = MaterialTheme.typography.bodySmall,
                                color = MutedText,
                                modifier = Modifier.padding(top = 4.dp),
                            )
                        }
                        VehicleBrandLogo(
                            title = brandTitle,
                            selected = false,
                            modifier = Modifier.size(width = 38.dp, height = 28.dp),
                        )
                    }
                }
                BookingStatusBadgeStack(
                    status = displayStatus,
                    showPaidBadge = showPaidBadge,
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                Column {
                    Text("START", style = MaterialTheme.typography.labelSmall, color = MutedText)
                    Text(booking.start_date ?: "-", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                }
                Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = Color.LightGray, modifier = Modifier.size(16.dp))
                Column {
                    Text("END", style = MaterialTheme.typography.labelSmall, color = MutedText)
                    Text(booking.end_date ?: "-", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(text = "Total Price", style = MaterialTheme.typography.bodyMedium, color = MutedText)
                Spacer(modifier = Modifier.weight(1f))
                Text(text = "GH₵${(booking.total_price ?: 0.0).toInt()}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold, color = BrandBlue)
            }

            if ((booking.role ?: "").contains("owner") && booking.status == "awaiting_host") {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = { onApprove(booking.id) }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(8.dp)) { Text("Approve") }
                    OutlinedButton(onClick = { onReject(booking.id, "Rejected by host") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(8.dp)) { Text("Reject") }
                }
            } else if (booking.status == "completed" || booking.status == "cancelled") {
                OutlinedButton(
                    onClick = onMessageHost,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                ) {
                    Icon(Icons.Outlined.ChatBubble, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Message host")
                }
            } else {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = onMessageHost,
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp),
                    ) { Text("Message host", style = MaterialTheme.typography.labelLarge) }
                    OutlinedTextField(
                        value = disputeReason,
                        onValueChange = { disputeReason = it },
                        placeholder = { Text("Reason for dispute...", style = MaterialTheme.typography.bodySmall) },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true
                    )
                    Button(
                        onClick = { if (disputeReason.isNotBlank()) onDispute(booking.id, disputeReason); disputeReason = "" },
                        enabled = disputeReason.isNotBlank(),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp)
                    ) { Text("Dispute", style = MaterialTheme.typography.labelLarge) }
                }
            }
        }
    }
}

private fun messageHostForTrip(
    viewModel: AppViewModel,
    booking: BookingDto,
    me: MobileMeDto?,
    onOpenConversation: (String) -> Unit,
) {
    val existingConversationId = booking.conversation_id?.trim().orEmpty()
    val summary = tripMessageSummary(booking, me)
    if (existingConversationId.isNotBlank()) {
        viewModel.sendMessageIfMissing(existingConversationId, summary)
        onOpenConversation(existingConversationId)
        return
    }

    val hostId = booking.cars?.owner_id?.trim().orEmpty()
    if (hostId.isBlank()) {
        viewModel.showMessage("Host details are not available for this booking.")
        return
    }

    viewModel.createConversation(
        hostId = hostId,
        participantId = null,
        carId = booking.car_id?.trim().orEmpty().takeIf { it.isNotBlank() },
    ) { conversationId ->
        viewModel.sendMessageIfMissing(conversationId, summary)
        onOpenConversation(conversationId)
    }
}

private fun tripMessageSummary(booking: BookingDto, me: MobileMeDto?): String {
    val mode = if ((booking.delivery_fee ?: 0.0) > 0.0) "Delivery" else "Pickup"
    val location = listOf(
        booking.trip_use_address,
        booking.trip_use_city,
        booking.trip_use_region,
    ).mapNotNull { it?.trim()?.takeIf(String::isNotBlank) }
        .joinToString(", ")
        .ifBlank { "Not provided" }
    val deliveryAddress = booking.delivery_address?.trim().orEmpty()
    val deliveryTime = booking.delivery_time?.trim().orEmpty()
    val contactPhone = booking.contact_phone?.trim().orEmpty()
    val deliveryNotes = booking.delivery_notes?.trim().orEmpty()
    val start = booking.start_date?.trim().orEmpty().ifBlank { "-" }
    val end = booking.end_date?.trim().orEmpty().ifBlank { "-" }
    val days = parsedTripDays(start, end)
    val lines = mutableListOf(
        "Trip details",
        "Car: ${booking.cars?.title ?: "Trip with Hayame"}",
        "Guest: ${me.preferredFullName() ?: booking.renter?.full_name ?: "Guest"}",
        "Dates: $start - $end",
        "Duration: $days day${if (days == 1) "" else "s"}",
        "Time: ${deliveryTime.ifBlank { "Not set" }}",
        "$mode: ${deliveryAddress.ifBlank { location }}",
        "Trip use area: $location",
        "Price: GHS ${(booking.total_price ?: 0.0).roundToInt()}",
        "Daily rate: GHS ${(booking.daily_rate ?: 0.0).roundToInt()}",
        "Subtotal: GHS ${(booking.subtotal ?: 0.0).roundToInt()}",
        "Insurance: GHS ${(booking.insurance_fee ?: 0.0).roundToInt()}",
        "Delivery fee: GHS ${(booking.delivery_fee ?: 0.0).roundToInt()}",
        "Outside region fee: GHS ${(booking.outside_accra_surcharge ?: 0.0).roundToInt()}",
        "Deposit: GHS ${(booking.deposit_amount ?: 0.0).roundToInt()}",
        "Payment ref: ${booking.payment_reference?.trim()?.takeIf(String::isNotBlank) ?: "N/A"}",
        "Booking ID: ${booking.id}",
    )
    if (contactPhone.isNotBlank()) lines += "Contact phone: $contactPhone"
    if (deliveryNotes.isNotBlank()) lines += "Notes: $deliveryNotes"
    return lines.joinToString("\n")
}

private fun parsedTripDays(startDate: String?, endDate: String?): Int {
    val start = parseApiDate(startDate)
    val end = parseApiDate(endDate)
    return if (start != null && end != null && end.isAfter(start)) {
        max(1, ChronoUnit.DAYS.between(start, end).toInt())
    } else {
        1
    }
}

@Composable
private fun StatusBadge(status: String) {
    val color = when (status.lowercase()) {
        "confirmed", "approved" -> Color(0xFFE8F5E9) to Color(0xFF2E7D32)
        "awaiting_host", "pending" -> Color(0xFFFFF3E0) to Color(0xFFE65100)
        "cancelled", "rejected" -> Color(0xFFFFEBEE) to Color(0xFFC62828)
        else -> Color(0xFFF5F5F5) to Color(0xFF616161)
    }
    Surface(color = color.first, shape = RoundedCornerShape(4.dp)) {
        Text(
            text = status.uppercase().replace("_", " "),
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = color.second
        )
    }
}

@Composable
private fun SavedTab(
    viewModel: AppViewModel,
    paddingValues: PaddingValues,
    onOpenCarDetail: (String) -> Unit,
) {
    val favoritesState by viewModel.favoritesState.collectAsState()
    val carsState by viewModel.carsState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadFavorites()
        viewModel.loadCars()
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item { Spacer(modifier = Modifier.height(16.dp)); SectionHeader("Saved for later") }
        when {
            favoritesState is UiState.Loading || carsState is UiState.Loading -> item { LoadingBlock() }
            favoritesState is UiState.Error -> item {
                ErrorBlock((favoritesState as UiState.Error).message, onRetry = { viewModel.loadFavorites() })
            }
            favoritesState is UiState.Empty -> item {
                EmptyBlock("No saved listings", "Tap the heart icon on any car to save it here.")
            }
            favoritesState is UiState.Success && carsState is UiState.Success -> {
                val favoriteIds = (favoritesState as UiState.Success<Set<String>>).data
                val cars = (carsState as UiState.Success<List<CarDto>>).data.filter { favoriteIds.contains(it.id) }
                if (cars.isEmpty()) {
                    item { EmptyBlock("No saved listings", "Tap the heart icon on any car to save it here.") }
                } else {
                    items(cars, key = { it.id }) { car ->
                        CarCard(
                            car = car,
                            isFavorite = true,
                            onClick = { onOpenCarDetail(car.id) },
                            onFavoriteClick = { viewModel.toggleFavorite(car.id, true) },
                        )
                    }
                }
            }
            else -> item { EmptyBlock("No saved listings", "Tap the heart icon on any car to save it here.") }
        }
        item { Spacer(modifier = Modifier.height(24.dp)) }
    }
}

@Composable
private fun MoreTab(
    viewModel: AppViewModel,
    paddingValues: PaddingValues,
    appearanceHighlightNonce: Int = 0,
    onOpenMessages: () -> Unit,
    onOpenDashboard: () -> Unit,
    onOpenBecomeHost: () -> Unit,
    onOpenHostDashboard: () -> Unit,
    onOpenTrips: () -> Unit,
    onOpenProfile: () -> Unit,
    onOpenContact: () -> Unit,
    onOpenProtection: () -> Unit,
    onOpenCancellation: () -> Unit,
    onOpenPrivacy: () -> Unit,
) {
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val me by viewModel.me.collectAsState()
    val notificationPreferences by viewModel.notificationPreferences.collectAsState()
    var hostModeEnabled by remember { mutableStateOf(false) }
    var glowAppearanceSettings by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()

    val displayName = me.preferredFullName() ?: "Guest User"
    val displayEmail = when {
        isAuthenticated -> me.preferredEmail() ?: "Email not set"
        else -> "Browsing in guest mode"
    }
    val displayPhone = me.preferredPhone().orEmpty()
    val displayCity = me.preferredCity().orEmpty()
    val displayRegion = me.preferredRegion().orEmpty()
    val displayLocation = listOf(displayCity, displayRegion).filter { it.isNotBlank() }.joinToString(", ")
    val avatarUrl = resolveAppImage(me.preferredAvatarRaw())
    val hostStatus = (me?.host_application_status ?: me?.host_status ?: "").trim().lowercase()
    val isHost = me?.is_host == true || hostStatus == "approved"
    val isPending = hostStatus == "pending"
    val colors = LocalHayameColors.current

    LaunchedEffect(appearanceHighlightNonce) {
        if (appearanceHighlightNonce <= 0) return@LaunchedEffect
        listState.animateScrollToItem(6)
        glowAppearanceSettings = true
        kotlinx.coroutines.delay(2_800)
        glowAppearanceSettings = false
    }

    LazyColumn(
        state = listState,
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Spacer(modifier = Modifier.height(16.dp))
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                    ) {
                        RemoteAvatar(
                            imageUrl = avatarUrl,
                            name = displayName,
                            fallback = "U",
                            size = 64.dp,
                            textStyle = MaterialTheme.typography.headlineSmall,
                        )

                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                            Text(
                                displayName,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = colors.brandNavy,
                            )
                            Text(
                                displayEmail,
                                style = MaterialTheme.typography.bodyMedium,
                                color = colors.mutedText,
                            )
                        }
                    }

                    if (displayLocation.isNotBlank()) {
                        InfoLine(label = "Location", value = displayLocation)
                    }
                    if (isAuthenticated && displayPhone.isNotBlank()) {
                        InfoLine(label = "Phone", value = displayPhone)
                    }

                    if (isAuthenticated) {
                        SecondaryPillButton(
                            text = "Edit profile",
                            modifier = Modifier.fillMaxWidth(),
                            onClick = onOpenProfile,
                        )
                    }
                }
            }
        }

        item {
            SectionHeader("Profile settings")
        }

        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(8.dp)) {
                    ActionRow(
                        title = "Edit profile",
                        icon = Icons.Outlined.Person,
                        onClick = {
                            if (isAuthenticated) {
                                onOpenProfile()
                            } else {
                                viewModel.requireAuthentication(
                                    message = "Sign in or sign up to edit your profile.",
                                    destination = NavRoutes.Profile,
                                )
                            }
                        },
                    )
                    HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = Color.LightGray.copy(alpha = 0.2f))
                    ActionRow(
                        title = "Trips",
                        icon = Icons.Outlined.CalendarMonth,
                        onClick = {
                            if (isAuthenticated) {
                                onOpenTrips()
                            } else {
                                viewModel.requireAuthentication(
                                    message = "Sign in or sign up to view your trips.",
                                    destination = NavRoutes.main(MainTab.TRIPS),
                                )
                            }
                        },
                    )
                    HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = Color.LightGray.copy(alpha = 0.2f))
                    ActionRow(
                        title = "Messages",
                        icon = Icons.Outlined.ChatBubble,
                        onClick = {
                            if (isAuthenticated) {
                                onOpenMessages()
                            } else {
                                viewModel.requireAuthentication(
                                    message = "Sign in or sign up to view your messages.",
                                    destination = NavRoutes.Messages,
                                )
                            }
                        },
                    )
                    HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = Color.LightGray.copy(alpha = 0.2f))
                    ActionRow(
                        title = "Dashboard",
                        icon = Icons.Outlined.Home,
                        onClick = {
                            if (isAuthenticated) {
                                onOpenDashboard()
                            } else {
                                viewModel.requireAuthentication(
                                    message = "Sign in or sign up to open your dashboard.",
                                    destination = NavRoutes.Dashboard,
                                )
                            }
                        },
                    )
                }
            }
        }

        item {
            SectionHeader("Notifications")
        }

        item {
            NotificationPreferencesCard(
                preferences = notificationPreferences,
                isAuthenticated = isAuthenticated,
                onPreferenceChange = { key, enabled ->
                    when (key) {
                        "booking_updates" -> viewModel.updateNotificationPreference(bookingUpdates = enabled)
                        "messages" -> viewModel.updateNotificationPreference(messages = enabled)
                        "account_security" -> viewModel.updateNotificationPreference(accountSecurity = enabled)
                        "news_announcements" -> viewModel.updateNotificationPreference(newsAnnouncements = enabled)
                    }
                },
                onRequireSignIn = {
                    viewModel.requireAuthentication(
                        message = "Sign in or sign up to manage notification preferences.",
                        destination = NavRoutes.Profile,
                    )
                },
            )
        }

        item {
            SectionHeader("Appearance")
        }

        item {
            val darkModeEnabled by viewModel.darkModeEnabled.collectAsState()
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                border = BorderStroke(
                    width = if (glowAppearanceSettings) 2.dp else 1.dp,
                    color = if (glowAppearanceSettings) colors.brandBlue else Color.Transparent,
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.then(
                    if (glowAppearanceSettings) {
                        Modifier.border(
                            width = 1.dp,
                            color = colors.brandBlue.copy(alpha = 0.25f),
                            shape = RoundedCornerShape(20.dp),
                        )
                    } else {
                        Modifier
                    },
                ),
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Icon(
                        imageVector = if (darkModeEnabled) Icons.Outlined.DarkMode else Icons.Outlined.LightMode,
                        contentDescription = null,
                        tint = colors.brandBlue,
                        modifier = Modifier.size(24.dp),
                    )
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            if (darkModeEnabled) "Dark mode" else "Light mode",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.brandNavy,
                        )
                        Text(
                            "Switch between light and dark appearance.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = colors.mutedText,
                        )
                    }
                    Switch(
                        checked = darkModeEnabled,
                        onCheckedChange = { viewModel.setDarkMode(it) },
                    )
                }
            }
        }

        item {
            SectionHeader("Hosting")
        }

        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            ) {
                when {
                    isHost -> {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                            ) {
                                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Text(
                                        "Host mode",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.SemiBold,
                                        color = colors.brandNavy,
                                    )
                                    Text(
                                        "Turn on Host mode to access host dashboard, listings, bookings, and earnings.",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = colors.mutedText,
                                    )
                                }
                                Switch(
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
                            }
                        }
                    }

                    isPending -> {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            InfoLine(label = "Application", value = "Pending")
                            Text(
                                "Your host application is pending review.",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.SemiBold,
                                color = Warning,
                            )
                            SecondaryPillButton(
                                text = "Review application",
                                modifier = Modifier.fillMaxWidth(),
                                onClick = {
                                    if (isAuthenticated) {
                                        onOpenBecomeHost()
                                    } else {
                                        viewModel.requireAuthentication(
                                            message = "Sign in or sign up to review your host application.",
                                            destination = NavRoutes.BecomeHost,
                                        )
                                    }
                                },
                            )
                        }
                    }

                    else -> {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            Text(
                                "Start hosting to unlock listings, approvals, earnings, and host support tools.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = colors.mutedText,
                            )
                            SecondaryPillButton(
                                text = "Become a Host",
                                modifier = Modifier.fillMaxWidth(),
                                onClick = {
                                    if (isAuthenticated) {
                                        onOpenBecomeHost()
                                    } else {
                                        viewModel.requireAuthentication(
                                            message = "Sign in or sign up to become a host.",
                                            destination = NavRoutes.BecomeHost,
                                        )
                                    }
                                },
                            )
                        }
                    }
                }
            }
        }

        item {
            SectionHeader("Support")
        }

        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            ) {
                Column(modifier = Modifier.padding(8.dp)) {
                    ActionRow(title = "Contact", icon = Icons.Outlined.MailOutline, onClick = onOpenContact)
                    HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = Color.LightGray.copy(alpha = 0.2f))
                    ActionRow(title = "Protection", icon = Icons.Outlined.Shield, onClick = onOpenProtection)
                    HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = Color.LightGray.copy(alpha = 0.2f))
                    ActionRow(title = "Cancellation Policy", icon = Icons.Outlined.CalendarMonth, onClick = onOpenCancellation)
                    HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = Color.LightGray.copy(alpha = 0.2f))
                    ActionRow(title = "Privacy", icon = Icons.Outlined.Public, onClick = onOpenPrivacy)
                }
            }
        }

        item {
            if (isAuthenticated) {
                OutlinedButton(
                    onClick = { viewModel.logout() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp),
                    shape = RoundedCornerShape(999.dp),
                    border = BorderStroke(1.dp, Danger.copy(alpha = 0.28f)),
                    colors = ButtonDefaults.outlinedButtonColors(containerColor = MaterialTheme.colorScheme.surface),
                ) {
                    Text(
                        text = "Sign out",
                        color = Danger,
                        style = MaterialTheme.typography.bodyLarge.copy(fontSize = 15.sp),
                        fontWeight = FontWeight.SemiBold,
                    )
                }
            } else {
                GradientPillButton(
                    text = "Log in / Sign up",
                    modifier = Modifier.fillMaxWidth(),
                    onClick = { viewModel.returnToAuth() },
                )
            }
        }

        item { Spacer(modifier = Modifier.height(24.dp)) }
    }
}

@Composable
private fun ActionRow(title: String, icon: androidx.compose.ui.graphics.vector.ImageVector, onClick: () -> Unit, color: Color? = null) {
    val colors = LocalHayameColors.current
    val contentColor = color ?: colors.brandNavy
    val iconColor = color ?: colors.mutedText
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 16.dp, horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(24.dp))
        Text(title, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium, color = contentColor)
        Spacer(modifier = Modifier.weight(1f))
        Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = colors.mutedText.copy(alpha = 0.7f), modifier = Modifier.size(20.dp))
    }
}

@Composable
private fun NotificationPreferencesCard(
    preferences: NotificationPreferencesDto,
    isAuthenticated: Boolean,
    onPreferenceChange: (key: String, enabled: Boolean) -> Unit,
    onRequireSignIn: (() -> Unit)? = null,
) {
    val colors = LocalHayameColors.current
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text(
                "Control which updates can reach your device. News and press releases stay optional.",
                style = MaterialTheme.typography.bodySmall,
                color = colors.mutedText,
            )

            if (!isAuthenticated) {
                Text(
                    "Sign in to save notification preferences across your devices.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = colors.brandNavy,
                )
                if (onRequireSignIn != null) {
                    SecondaryPillButton(
                        text = "Sign in to manage",
                        modifier = Modifier.fillMaxWidth(),
                        onClick = onRequireSignIn,
                    )
                }
                return@Column
            }

            NotificationPreferenceRow(
                title = "Trips & bookings",
                subtitle = "Approvals, confirmations, refunds, and schedule changes.",
                checked = preferences.booking_updates ?: true,
                onCheckedChange = { onPreferenceChange("booking_updates", it) },
            )
            NotificationPreferenceRow(
                title = "Messages",
                subtitle = "New chats and replies from guests or hosts.",
                checked = preferences.messages ?: true,
                onCheckedChange = { onPreferenceChange("messages", it) },
            )
            NotificationPreferenceRow(
                title = "Account & security",
                subtitle = "Identity checks, host application updates, and critical notices.",
                checked = preferences.account_security ?: true,
                onCheckedChange = { onPreferenceChange("account_security", it) },
            )
            NotificationPreferenceRow(
                title = "News & announcements",
                subtitle = "Press releases, launches, and optional product updates.",
                checked = preferences.news_announcements ?: false,
                onCheckedChange = { onPreferenceChange("news_announcements", it) },
            )
        }
    }
}

@Composable
private fun NotificationPreferenceRow(
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
) {
    val colors = LocalHayameColors.current
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(
                title,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.SemiBold,
                color = colors.brandNavy,
            )
            Text(
                subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = colors.mutedText,
            )
        }
        Switch(checked = checked, onCheckedChange = onCheckedChange)
    }
}

@Composable
private fun GradientPillButton(
    text: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val darkMode = colors.pageBackground.luminance() < 0.5f
    Button(
        onClick = onClick,
        modifier = modifier.height(48.dp),
        shape = RoundedCornerShape(999.dp),
        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
        contentPadding = PaddingValues(0.dp),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.horizontalGradient(
                        colors = if (darkMode) {
                            listOf(colors.brandBlue, Color(0xFF1484D9))
                        } else {
                            listOf(colors.brandBlue, colors.brandNavy)
                        },
                    )
                )
                .clip(RoundedCornerShape(999.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = text,
                color = Color.White,
                style = MaterialTheme.typography.bodyLarge.copy(fontSize = 16.sp),
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}

@Composable
private fun SecondaryPillButton(
    text: String,
    modifier: Modifier = Modifier,
    isSelected: Boolean = false,
    onClick: () -> Unit,
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier.height(44.dp),
        shape = RoundedCornerShape(999.dp),
        border = BorderStroke(1.dp, if (isSelected) BrandBlue else BrandBlue.copy(alpha = 0.25f)),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = if (isSelected) BrandBlue else BrandLight,
            contentColor = if (isSelected) Color.White else BrandNavy,
        ),
    ) {
        Text(
            text = text,
            color = if (isSelected) Color.White else BrandNavy,
            style = MaterialTheme.typography.bodyLarge.copy(fontSize = 15.sp),
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun CarDetailScreen(
    viewModel: AppViewModel,
    carId: String,
    onBack: () -> Unit,
    onBook: (String) -> Unit,
    onOpenConversation: (String) -> Unit,
    onOpenProtection: () -> Unit = {},
) {
    val state by viewModel.carDetailState.collectAsState()
    val favoritesState by viewModel.favoritesState.collectAsState()
    val bookingsState by viewModel.bookingsState.collectAsState()
    val carReviewsState by viewModel.carReviewsState.collectAsState()
    val bookingDraft by viewModel.bookingDraft.collectAsState()
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val locations by viewModel.locations.collectAsState()
    val colors = LocalHayameColors.current
    val favoriteIds = (favoritesState as? UiState.Success<Set<String>>)?.data ?: emptySet()

    LaunchedEffect(carId) {
        viewModel.loadCarDetail(carId)
        viewModel.loadFavorites()
        viewModel.loadReferenceData()
        viewModel.loadCarReviews(carId)
    }

    LaunchedEffect(isAuthenticated, carId) {
        if (isAuthenticated) {
            viewModel.loadBookings()
        }
    }

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = {
            Surface(color = colors.cardBackground, shadowElevation = 2.dp) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 10.dp),
                ) {
                    IconButton(onClick = onBack, modifier = Modifier.align(Alignment.CenterStart)) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = colors.brandNavy)
                    }
                    Text(
                        text = "Car Detail",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.ExtraBold,
                        color = colors.brandNavy,
                        modifier = Modifier.align(Alignment.Center),
                    )
                }
            }
        },
    ) { inner ->
        when (val s = state) {
            UiState.Loading -> LoadingBlock("Loading details...")
            is UiState.Error -> ErrorBlock(s.message, onRetry = { viewModel.loadCarDetail(carId) })
            is UiState.Success -> {
                val car = s.data
                val imageUrls = remember(car.id, car.image_url, car.car_photos) {
                    buildList {
                        resolveAppImage(car.image_url)?.let(::add)
                        car.car_photos.orEmpty().forEach { photo ->
                            resolveAppImage(photo.url)?.let(::add)
                        }
                    }.distinct()
                }
                val galleryItems = if (imageUrls.isEmpty()) listOf("") else imageUrls
                val pricePerDay = (car.daily_price ?: 0.0).roundToInt()
                val insuranceFee = (car.insurance_fee ?: 0.0).roundToInt().coerceAtLeast(0)
                val deliveryFee = if (car.delivery_available == true) (car.delivery_fee ?: 0.0).roundToInt().coerceAtLeast(0) else 0
                val depositAmount = (car.deposit_amount ?: 0.0).roundToInt().coerceAtLeast(0)
                val outsideRegionFee = (car.outside_accra_fee ?: 0.0).roundToInt().coerceAtLeast(0)
                val ratingValue = car.avg_rating ?: 0.0
                val reviewsCount = (car.reviews_count ?: 0.0).roundToInt().coerceAtLeast(0)
                val hostId = car.owner_id ?: car.owner?.id
                val hostName = car.host_name ?: car.owner?.full_name ?: "Hayame Host"
                val hostAvatar = car.host_avatar ?: car.owner?.avatar_url
                val hostLevel = car.host_level ?: car.owner?.host_level ?: "Verified Host"
                val hostLocation = listOfNotNull(car.owner?.city, car.region).joinToString(", ").ifBlank {
                    listOfNotNull(car.city, car.region).joinToString(", ")
                }
                val quickMessages = remember(car.id) {
                    listOf(
                        "Hi! Is this car available this week?",
                        "Can I pick up the car in the morning?",
                        "Do you offer delivery or pickup?",
                        "What documents do you require?",
                    )
                }
                val listingReviews = (carReviewsState as? UiState.Success<List<ReviewDto>>)?.data.orEmpty()
                val currentBookings = (bookingsState as? UiState.Success<List<BookingDto>>)?.data.orEmpty()
                val completedReviewBooking = remember(currentBookings, car.id) {
                    currentBookings.firstOrNull { booking ->
                        booking.car_id == car.id && booking.status.equals("completed", ignoreCase = true)
                    }
                }
                val normalizedFeatures = remember(car.features, car.air_conditioning, car.instant_book, car.delivery_available) {
                    buildList {
                        car.features.orEmpty()
                            .map { it.trim() }
                            .filter { it.isNotEmpty() }
                            .forEach(::add)
                        if (isEmpty()) {
                            if (car.air_conditioning == true) add("Air Conditioning")
                            if (car.instant_book == true) add("Instant Book")
                            if (car.delivery_available == true) add("Delivery Available")
                        }
                    }.distinct()
                }
                val carTitle = remember(car.id, car.title, car.brand, car.model) {
                    car.title?.trim()?.takeIf { it.isNotBlank() }
                        ?: listOfNotNull(car.brand?.trim(), car.model?.trim())
                            .filter { it.isNotBlank() }
                            .joinToString(" ")
                            .ifBlank { "Hayame listing" }
                }
                val carBrand = remember(car.id, car.brand, carTitle) {
                    car.brand?.trim()?.takeIf { it.isNotBlank() }
                        ?: carTitle.split(" ").firstOrNull().orEmpty()
                }
                val carModel = remember(car.id, car.model, carTitle, carBrand) {
                    car.model?.trim()?.takeIf { it.isNotBlank() }
                        ?: carTitle.removePrefix(carBrand).trim().ifBlank { "—" }
                }
                val addedDateLabel = remember(car.created_at) { formatAddedDateLabel(car.created_at) }

                var showGallery by rememberSaveable(car.id) { mutableStateOf(false) }
                var selectedImageIndex by rememberSaveable(car.id) { mutableStateOf(0) }
                var startDate by remember(car.id) { mutableStateOf(LocalDate.now()) }
                var endDate by remember(car.id) { mutableStateOf(LocalDate.now().plusDays(1)) }
                var blockedBookingDates by remember(car.id) { mutableStateOf<Set<LocalDate>>(emptySet()) }
                var selectedQuickDuration by rememberSaveable(car.id) { mutableStateOf<Int?>(null) }
                var tripUseRegion by remember(car.id) {
                    mutableStateOf(car.region?.trim().takeUnless { it.isNullOrBlank() } ?: "Greater Accra Region")
                }
                var tripUseCity by remember(car.id) {
                    mutableStateOf(car.city?.trim().takeUnless { it.isNullOrBlank() } ?: "Accra")
                }
                var tripUseAddress by remember(car.id) { mutableStateOf("") }
                var reviewRating by remember(car.id) { mutableStateOf(5) }
                var reviewComment by remember(car.id) { mutableStateOf("") }
                var reviewStatusMessage by remember(car.id) { mutableStateOf<String?>(null) }
                var availabilityMessage by remember(car.id) { mutableStateOf<String?>(null) }
                var isCheckingAvailability by remember(car.id) { mutableStateOf(false) }
                var isLoadingBookingAvailability by remember(car.id) { mutableStateOf(false) }
                var showFloatingBookingBar by rememberSaveable(car.id) { mutableStateOf(false) }

                val regionOptions = remember(locations, car.region, tripUseRegion) {
                    buildList {
                        add(tripUseRegion)
                        car.region?.trim()?.takeIf { it.isNotEmpty() }?.let(::add)
                        locations.keys.filter { it.isNotBlank() }.sorted().forEach(::add)
                    }.distinct()
                }
                val cityOptions = remember(locations, tripUseRegion, tripUseCity, car.city) {
                    val baseCities = locations[tripUseRegion].orEmpty()
                    buildList {
                        add(tripUseCity)
                        car.city?.trim()?.takeIf { it.isNotEmpty() }?.let(::add)
                        baseCities.filter { it.isNotBlank() }.sorted().forEach(::add)
                    }.distinct()
                }
                val daysCount = remember(startDate, endDate) {
                    max(1, ChronoUnit.DAYS.between(startDate, endDate).toInt())
                }
                val subtotal = pricePerDay * daysCount
                val outsideListingRegion = remember(tripUseRegion, car.region) {
                    !tripUseRegion.equals(car.region.orEmpty(), ignoreCase = true)
                }
                val outsideAccra = remember(tripUseRegion, tripUseCity) {
                    !tripUseRegion.contains("accra", ignoreCase = true) || !tripUseCity.contains("accra", ignoreCase = true)
                }
                val outsideSurcharge = if (outsideListingRegion) outsideRegionFee else 0
                val coroutineScope = rememberCoroutineScope()
                val pagerState = rememberPagerState(
                    initialPage = selectedImageIndex.coerceIn(0, galleryItems.lastIndex),
                    pageCount = { galleryItems.size },
                )

                LaunchedEffect(pagerState.currentPage) {
                    selectedImageIndex = pagerState.currentPage
                }

                LaunchedEffect(car.id, bookingDraft) {
                    val draft = bookingDraft?.takeIf { it.carId == car.id } ?: return@LaunchedEffect
                    parseApiDate(draft.startDate)?.let { startDate = it }
                    parseApiDate(draft.endDate)?.let { endDate = it }
                    tripUseRegion = draft.region.ifBlank { tripUseRegion }
                    tripUseCity = draft.city.ifBlank { tripUseCity }
                    tripUseAddress = draft.address
                }

                LaunchedEffect(startDate, blockedBookingDates) {
                    if (blockedBookingDates.isNotEmpty() && !isBookableStartDate(startDate, blockedBookingDates)) {
                        nextBookableStartDate(
                            from = if (startDate.isBefore(LocalDate.now())) LocalDate.now() else startDate,
                            duration = 1,
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

                LaunchedEffect(car.id) {
                    showFloatingBookingBar = false
                    delay(90)
                    showFloatingBookingBar = true
                }

                LaunchedEffect(car.id) {
                    val today = LocalDate.now()
                    isLoadingBookingAvailability = true
                    viewModel.loadAvailabilitySnapshot(
                        carId = car.id,
                        startDate = today.toApiDate(),
                        endDate = today.plusDays(180).toApiDate(),
                    ) { envelope, error ->
                        isLoadingBookingAvailability = false
                        if (error != null) {
                            availabilityMessage = error
                            return@loadAvailabilitySnapshot
                        }

                        val blocked = envelope?.blockedDates.orEmpty().mapNotNull(::parseApiDate).toSet()
                        blockedBookingDates = blocked
                        selectedQuickDuration = null
                        val nextStart = nextBookableStartDate(
                            from = today,
                            duration = 1,
                            blockedDates = blocked,
                        )

                        if (nextStart == null) {
                            availabilityMessage = "No upcoming available dates in the next 6 months."
                            return@loadAvailabilitySnapshot
                        }

                        startDate = if (isBookableStartDate(startDate, blocked)) startDate else nextStart
                        preferredBookingEndDate(
                            currentEnd = endDate,
                            startDate = startDate,
                            blockedDates = blocked,
                        )?.let { endDate = it }
                    }
                }

                LaunchedEffect(regionOptions, car.region) {
                    if (tripUseRegion.isBlank()) {
                        tripUseRegion = car.region?.takeIf { !it.isNullOrBlank() } ?: regionOptions.firstOrNull().orEmpty()
                    }
                }

                LaunchedEffect(cityOptions, tripUseRegion, car.city) {
                    if (cityOptions.none { it.equals(tripUseCity, ignoreCase = true) }) {
                        tripUseCity = cityOptions.firstOrNull() ?: (car.city ?: "Accra")
                    }
                }

                fun openHostChat(preset: String? = null) {
                    if (hostId.isNullOrBlank()) {
                        viewModel.showMessage("Host details are not available for this listing.")
                        return
                    }
                    if (!isAuthenticated) {
                        viewModel.requireAuthentication(
                            message = "Sign in or sign up to send messages.",
                            destination = NavRoutes.carDetail(car.id),
                        )
                        return
                    }
                    viewModel.createConversation(
                        hostId = hostId,
                        participantId = null,
                        carId = car.id,
                    ) { conversationId ->
                        if (!preset.isNullOrBlank()) {
                            viewModel.sendMessage(conversationId, preset)
                        }
                        onOpenConversation(conversationId)
                    }
                }

                fun openBookingFlow() {
                    viewModel.setBookingDraft(
                        carId = car.id,
                        startDate = startDate.toApiDate(),
                        endDate = endDate.toApiDate(),
                        region = tripUseRegion,
                        city = tripUseCity,
                        address = tripUseAddress.trim(),
                    )
                    if (!isAuthenticated) {
                        viewModel.requireAuthentication(
                            message = "Sign in or sign up to book this car.",
                            destination = NavRoutes.booking(car.id),
                        )
                        return
                    }
                    onBook(car.id)
                }

                fun submitReviewNow() {
                    if (!isAuthenticated) {
                        viewModel.requireAuthentication(
                            message = "Sign in or sign up to leave a review.",
                            destination = NavRoutes.carDetail(car.id),
                        )
                        return
                    }
                    val booking = completedReviewBooking
                    if (booking == null) {
                        reviewStatusMessage = "Only guests with completed trips can review this listing."
                        return
                    }
                    viewModel.submitReview(
                        bookingId = booking.id,
                        rating = reviewRating,
                        comment = reviewComment.trim(),
                        onSuccess = {
                            reviewStatusMessage = "Review submitted."
                            reviewComment = ""
                            reviewRating = 5
                            viewModel.loadCarReviews(car.id)
                        },
                        onError = { reviewStatusMessage = it },
                    )
                }

                fun checkAvailabilityNow() {
                    if (!endDate.isAfter(startDate)) {
                        availabilityMessage = "End date must be after start date."
                        return
                    }
                    isCheckingAvailability = true
                    viewModel.loadAvailabilitySnapshot(
                        carId = car.id,
                        startDate = startDate.toApiDate(),
                        endDate = endDate.toApiDate(),
                    ) { envelope, error ->
                        isCheckingAvailability = false
                        if (error != null) {
                            availabilityMessage = error
                        } else {
                            blockedBookingDates = blockedBookingDates + envelope?.blockedDates.orEmpty().mapNotNull(::parseApiDate)
                            availabilityMessage = if (envelope?.available == true) {
                                "Dates are available."
                            } else {
                                envelope?.reason ?: "Selected dates are unavailable."
                            }
                        }
                    }
                }

            fun applyQuickTripDuration(days: Int) {
                val adjustedStart = nextBookableStartDate(
                    from = startDate,
                    duration = days,
                    blockedDates = blockedBookingDates,
                )
                if (adjustedStart == null) {
                    selectedQuickDuration = null
                    availabilityMessage = "No $days-day slot is available in the next 6 months."
                } else {
                    startDate = adjustedStart
                    endDate = adjustedStart.plusDays(days.toLong())
                    selectedQuickDuration = days
                    availabilityMessage = null
                }
            }

                Box(modifier = Modifier.fillMaxSize()) {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(inner)
                            .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                        contentPadding = PaddingValues(bottom = 152.dp),
                    ) {
                        item { Spacer(modifier = Modifier.height(2.dp)) }
                        item {
                            DetailSectionCard {
                                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                                        DetailPill("Car in ${car.city ?: "Ghana"}", BrandLight, BrandBlue)
                                        DetailPill(car.car_type ?: "Car", BrandLight, BrandNavy)
                                        DetailPill("Added $addedDateLabel", Color.Black.copy(alpha = 0.04f), MutedText)
                                    }

                                    Row(horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.Top) {
                                        Column(
                                            modifier = Modifier.weight(1f),
                                            verticalArrangement = Arrangement.spacedBy(4.dp),
                                        ) {
                                            Text(
                                                text = carTitle,
                                                style = MaterialTheme.typography.headlineLarge,
                                                fontWeight = FontWeight.ExtraBold,
                                                color = BrandNavy,
                                            )
                                            Text(
                                                text = listOfNotNull(car.city, car.region).joinToString(", "),
                                                style = MaterialTheme.typography.titleMedium,
                                                color = MutedText,
                                            )
                                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                                                Text(
                                                    text = "★ ${String.format("%.1f", ratingValue)}",
                                                    style = MaterialTheme.typography.titleMedium,
                                                    fontWeight = FontWeight.Bold,
                                                    color = Warning,
                                                )
                                                Text(
                                                    text = "$reviewsCount reviews",
                                                    style = MaterialTheme.typography.titleMedium,
                                                    color = MutedText,
                                                )
                                            }
                                        }
                                        FavoriteOverviewButton(
                                            isFavorite = favoriteIds.contains(car.id),
                                            onClick = {
                                                viewModel.toggleFavorite(
                                                    carId = car.id,
                                                    currentlyFavorite = favoriteIds.contains(car.id),
                                                    authDestination = NavRoutes.carDetail(car.id),
                                                )
                                            },
                                        )
                                    }
                                }
                            }
                        }

                    item {
                        SectionHeader(title = "Car photo")
                        DetailSectionCard {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                HorizontalPager(
                                    state = pagerState,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(250.dp)
                                        .clip(RoundedCornerShape(22.dp))
                                        .clickable {
                                            if (imageUrls.isNotEmpty()) {
                                                showGallery = true
                                            }
                                        },
                                ) { page ->
                                    val imageUrl = galleryItems[page]
                                    if (imageUrl.isBlank()) {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxSize()
                                                .background(BrandLight),
                                            contentAlignment = Alignment.Center,
                                        ) {
                                            Text("No photos available", color = MutedText)
                                        }
                                    } else {
                                        AsyncImage(
                                            model = imageUrl,
                                            contentDescription = null,
                                            modifier = Modifier.fillMaxSize(),
                                            contentScale = ContentScale.Crop,
                                        )
                                    }
                                }

                                if (imageUrls.size > 1) {
                                    LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                        items(imageUrls.size, key = { it }) { index ->
                                            AsyncImage(
                                                model = imageUrls[index],
                                                contentDescription = null,
                                                modifier = Modifier
                                                    .size(width = 78.dp, height = 56.dp)
                                                    .clip(RoundedCornerShape(10.dp))
                                                    .border(
                                                        width = if (selectedImageIndex == index) 2.dp else 1.dp,
                                                        color = if (selectedImageIndex == index) BrandBlue else Color.Black.copy(alpha = 0.08f),
                                                        shape = RoundedCornerShape(10.dp),
                                                    )
                                                    .clickable {
                                                        selectedImageIndex = index
                                                        coroutineScope.launch { pagerState.scrollToPage(index) }
                                                    },
                                                contentScale = ContentScale.Crop,
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    item {
                        SectionHeader(title = "Details")
                        DetailSectionCard {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                CarDetailLine(label = "LOCATION", value = listOfNotNull(car.city, car.region).joinToString(", "))
                                CarDetailLine(label = "BRAND", value = carBrand.ifBlank { "—" })
                                CarDetailLine(label = "MODEL", value = carModel.ifBlank { "—" })
                                CarDetailLine(label = "CAR TYPE", value = car.car_type ?: "Car")
                                CarDetailLine(label = "SEATS", value = "${(car.seats ?: 5.0).roundToInt()} seats")
                                CarDetailLine(label = "TRANSMISSION", value = (car.transmission ?: "Automatic").lowercase())
                                CarDetailLine(label = "FUEL", value = (car.fuel_type ?: "Petrol").lowercase())
                                CarDetailLine(label = "REGION", value = car.region ?: "—")
                            }
                        }
                    }

                    item {
                        SectionHeader(title = "Description")
                        DetailSectionCard {
                            Text(
                                text = car.description?.takeIf { it.isNotBlank() } ?: "No description provided.",
                                style = MaterialTheme.typography.bodyLarge,
                                color = MutedText,
                                lineHeight = 24.sp,
                            )
                        }
                    }

                    item {
                        SectionHeader(title = "Features")
                        DetailSectionCard {
                            if (normalizedFeatures.isEmpty()) {
                                Text("No features listed.", color = MutedText)
                            } else {
                                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    normalizedFeatures.chunked(2).forEach { row ->
                                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                            row.forEach { feature ->
                                                Surface(
                                                    modifier = Modifier.weight(1f),
                                                    shape = RoundedCornerShape(12.dp),
                                                    color = BrandLight,
                                                ) {
                                                    Text(
                                                        text = feature,
                                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                                                        style = MaterialTheme.typography.bodyLarge,
                                                        fontWeight = FontWeight.SemiBold,
                                                        color = BrandNavy,
                                                    )
                                                }
                                            }
                                            if (row.size == 1) {
                                                Spacer(modifier = Modifier.weight(1f))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    item {
                        SectionHeader(title = "Latest reviews")
                        DetailSectionCard {
                            when (carReviewsState) {
                                UiState.Loading -> LoadingBlock("Loading reviews...")
                                is UiState.Error -> Text((carReviewsState as UiState.Error).message, color = MutedText)
                                UiState.Empty -> Text("No reviews yet. Be the first to share your experience.", color = MutedText)
                                is UiState.Success -> Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    listingReviews.take(3).forEach { review ->
                                        ReviewSummaryCard(review = review)
                                    }
                                }
                                else -> Text("No reviews yet. Be the first to share your experience.", color = MutedText)
                            }
                        }
                    }

                    item {
                        SectionHeader(title = "Leave a review")
                        DetailSectionCard {
                            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                InfoLine(label = "Trip", value = completedReviewBooking?.id ?: "No eligible completed trip")
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Text(
                                        text = "Rating",
                                        style = MaterialTheme.typography.bodyLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = BrandNavy,
                                    )
                                    Spacer(modifier = Modifier.weight(1f))
                                    (1..5).forEach { star ->
                                        Text(
                                            text = if (star <= reviewRating) "★" else "☆",
                                            modifier = Modifier.clickable { reviewRating = star },
                                            style = MaterialTheme.typography.headlineSmall,
                                            color = Warning,
                                        )
                                    }
                                }
                                OutlinedTextField(
                                    value = reviewComment,
                                    onValueChange = { reviewComment = it },
                                    modifier = Modifier.fillMaxWidth(),
                                    minLines = 4,
                                    maxLines = 5,
                                    placeholder = { Text("Share your experience") },
                                    shape = RoundedCornerShape(14.dp),
                                )
                                Text(
                                    text = if (completedReviewBooking != null && isAuthenticated) {
                                        "Submit your review for a completed trip."
                                    } else {
                                        "Only guests with completed trips can review this listing."
                                    },
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = if (completedReviewBooking != null && isAuthenticated) BrandBlue else MutedText,
                                )
                                GradientPillButton(
                                    text = "Submit review",
                                    modifier = Modifier.fillMaxWidth(),
                                    onClick = ::submitReviewNow,
                                )
                                if (!reviewStatusMessage.isNullOrBlank()) {
                                    Text(reviewStatusMessage.orEmpty(), color = MutedText, style = MaterialTheme.typography.bodyMedium)
                                }
                            }
                        }
                    }

                    item {
                        SectionHeader(title = "Availability")
                        DetailSectionCard {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                InfoLine(label = "Status", value = if (car.is_available == false) "Unavailable" else "Available")
                                Text("AVAILABILITY PREVIEW", style = MaterialTheme.typography.labelMedium, color = MutedText, fontWeight = FontWeight.Bold)
                                InfoLine(label = "Selected dates", value = "${startDate.toDisplayDate()} - ${endDate.toDisplayDate()}")
                                SecondaryPillButton(
                                    text = if (isCheckingAvailability) "Checking..." else "Check availability",
                                    modifier = Modifier.fillMaxWidth(),
                                    onClick = ::checkAvailabilityNow,
                                )
                                if (!availabilityMessage.isNullOrBlank()) {
                                    val message = availabilityMessage.orEmpty()
                                    Text(
                                        text = message,
                                        color = if (message.contains("available", ignoreCase = true)) Success else Warning,
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.SemiBold,
                                    )
                                }
                            }
                        }
                    }

                        item {
                            SectionHeader(title = "Trip")
                            DetailSectionCard {
                                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    Text(
                                        text = "Pay now with Paystack; host approval required before pickup.",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MutedText,
                                    )
                                    Text(
                                        text = "Refunded if host rejects",
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Success,
                                    )

                                    Text("HOST VERIFICATION", style = MaterialTheme.typography.labelMedium, color = MutedText, fontWeight = FontWeight.Bold)
                                    HostVerificationLine("ID Verified", car.id_verified == true || car.owner?.id_verified == true)
                                    HostVerificationLine("Phone Verified", car.phone_verified == true || car.owner?.phone_verified == true)
                                    HostVerificationLine("Email Verified", car.email_verified == true || car.owner?.email_verified == true)

                                    InfoLine(label = "Cancellation", value = car.cancellation_policy ?: "Moderate")

                                    Text("TRIP DATES", style = MaterialTheme.typography.labelMedium, color = MutedText, fontWeight = FontWeight.Bold)
                                    DateSelectionRow(
                                        label = "Start date",
                                        date = startDate,
                                        minimumDate = LocalDate.now(),
                                        blockedDates = blockedBookingDates,
                                        isLoadingAvailability = isLoadingBookingAvailability,
                                        selectionRange = startDate..endDate,
                                        canSelectDate = { candidate -> isBookableStartDate(candidate, blockedBookingDates) },
                                    ) {
                                        selectedQuickDuration = null
                                        startDate = it
                                    }
                                    DateSelectionRow(
                                        label = "End date",
                                        date = endDate,
                                        minimumDate = startDate.plusDays(1),
                                        blockedDates = blockedBookingDates,
                                        isLoadingAvailability = isLoadingBookingAvailability,
                                        selectionRange = startDate..endDate,
                                        canSelectDate = { candidate -> isBookableEndDate(candidate, startDate, blockedBookingDates) },
                                    ) {
                                        selectedQuickDuration = null
                                        endDate = it
                                    }
                                    Text(
                                        text = "Unavailable dates are crossed out. The first available trip day is selected automatically.",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MutedText,
                                    )

                                    Text("Quick select:", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold, color = BrandNavy)
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        SecondaryPillButton(text = "2 days", modifier = Modifier.weight(1f), isSelected = selectedQuickDuration == 2) { applyQuickTripDuration(2) }
                                        SecondaryPillButton(text = "5 days", modifier = Modifier.weight(1f), isSelected = selectedQuickDuration == 5) { applyQuickTripDuration(5) }
                                        SecondaryPillButton(text = "7 days", modifier = Modifier.weight(1f), isSelected = selectedQuickDuration == 7) { applyQuickTripDuration(7) }
                                    }

                                    Text("TRIP USE LOCATION", style = MaterialTheme.typography.labelMedium, color = MutedText, fontWeight = FontWeight.Bold)
                                    Text("Listing region: ${car.region ?: "Unknown"}", color = MutedText, style = MaterialTheme.typography.bodyMedium)

                                    SelectionField(
                                        selected = tripUseRegion,
                                        placeholder = "Select region",
                                        options = regionOptions,
                                        onSelected = { tripUseRegion = it },
                                    )
                                    SelectionField(
                                        selected = tripUseCity,
                                        placeholder = "Select city / district",
                                        options = cityOptions,
                                        onSelected = { tripUseCity = it },
                                    )
                                    OutlinedTextField(
                                        value = tripUseAddress,
                                        onValueChange = { tripUseAddress = it },
                                        modifier = Modifier.fillMaxWidth(),
                                        placeholder = { Text("Exact area / destination") },
                                        shape = RoundedCornerShape(14.dp),
                                    )
                                    Text("Minimum 3 characters.", style = MaterialTheme.typography.labelLarge, color = MutedText)

                                    Text(
                                        text = if (outsideListingRegion) {
                                            if (outsideRegionFee > 0) "Outside listing region trip (+GH₵$outsideRegionFee)" else "Outside listing region trip"
                                        } else {
                                            "Within listing region (no outside-region surcharge)"
                                        },
                                        color = if (outsideListingRegion) Warning else Success,
                                        style = MaterialTheme.typography.bodyLarge,
                                        fontWeight = FontWeight.SemiBold,
                                    )
                                    if (outsideListingRegion) {
                                        Text(
                                            text = "Trip use region differs from listing region (${car.region ?: "Unknown"}).",
                                            color = MutedText,
                                            style = MaterialTheme.typography.bodyMedium,
                                        )
                                    }
                                    if (outsideAccra) {
                                        Text(
                                            text = "Trip use location is also outside Accra.",
                                            color = MutedText,
                                            style = MaterialTheme.typography.bodyMedium,
                                        )
                                    }

                                    InfoLine(label = "Daily rate x $daysCount day(s)", value = "GH₵$subtotal")
                                    InfoLine(label = "Insurance fee", value = "GH₵$insuranceFee")
                                    InfoLine(label = "Delivery fee", value = "GH₵$deliveryFee")
                                    InfoLine(
                                        label = if (outsideSurcharge == 0) "Outside listing region surcharge (not applied)" else "Outside listing region surcharge",
                                        value = "GH₵$outsideSurcharge",
                                    )
                                    InfoLine(label = "Deposit", value = "GH₵$depositAmount")
                                    Text(
                                        text = "Final payable total is calculated by the server at checkout.",
                                        color = MutedText,
                                        style = MaterialTheme.typography.labelLarge,
                                    )

                                    SecondaryPillButton(
                                        text = "View protection details",
                                        modifier = Modifier.fillMaxWidth(),
                                        onClick = onOpenProtection,
                                    )
                                }
                            }
                        }

                        item {
                            SectionHeader(title = "Host")
                            DetailSectionCard {
                                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                        HostAvatar(hostAvatar = hostAvatar, hostName = hostName)
                                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                            Text(hostName, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = BrandNavy)
                                            Text(hostLevel, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold, color = BrandBlue)
                                            if (hostLocation.isNotBlank()) {
                                                Text(hostLocation, style = MaterialTheme.typography.bodyMedium, color = MutedText)
                                            }
                                        }
                                    }

                                    HostVerificationLine("ID Verified", car.id_verified == true || car.owner?.id_verified == true)
                                    HostVerificationLine("Phone Verified", car.phone_verified == true || car.owner?.phone_verified == true)
                                    HostVerificationLine("Email Verified", car.email_verified == true || car.owner?.email_verified == true)
                                    Text(
                                        text = "Host level updates as verification and trip performance grow.",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MutedText,
                                    )

                                    TextButton(
                                        onClick = { viewModel.showMessage("Host public profile is the next parity screen to expose on Android.") },
                                        contentPadding = PaddingValues(0.dp),
                                    ) {
                                        Text("View host", color = BrandBlue, fontWeight = FontWeight.Bold)
                                    }

                                    SecondaryPillButton(
                                        text = "Message $hostName",
                                        modifier = Modifier.fillMaxWidth(),
                                        onClick = { openHostChat(quickMessages.firstOrNull()) },
                                    )
                                    Text("Use a quick prompt to start the chat.", style = MaterialTheme.typography.bodyMedium, color = MutedText)
                                    quickMessages.forEach { prompt ->
                                        SecondaryPillButton(
                                            text = prompt,
                                            modifier = Modifier.fillMaxWidth(),
                                            onClick = { openHostChat(prompt) },
                                        )
                                    }
                                    SecondaryPillButton(
                                        text = "Chat without message",
                                        modifier = Modifier.fillMaxWidth(),
                                        onClick = { openHostChat(null) },
                                    )
                                }
                            }
                        }
                        item { Spacer(modifier = Modifier.height(24.dp)) }
                    }

                    AnimatedVisibility(
                        visible = showFloatingBookingBar,
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(horizontal = 16.dp)
                            .navigationBarsPadding()
                            .imePadding()
                            .padding(bottom = 12.dp),
                        enter = fadeIn(animationSpec = tween(durationMillis = 220, delayMillis = 60)) +
                            slideInVertically(
                                initialOffsetY = { it / 2 },
                                animationSpec = spring(dampingRatio = 0.88f, stiffness = 420f),
                            ),
                        exit = fadeOut(animationSpec = tween(durationMillis = 140)) +
                            slideOutVertically(
                                targetOffsetY = { it / 2 },
                                animationSpec = tween(durationMillis = 160),
                            ),
                    ) {
                        FloatingBookingBar(
                            pricePerDay = pricePerDay,
                            onBook = ::openBookingFlow,
                        )
                    }

                    if (showGallery && imageUrls.isNotEmpty()) {
                        FullScreenPhotoGallery(
                            imageUrls = imageUrls,
                            initialPage = selectedImageIndex,
                            onDismiss = { showGallery = false },
                        )
                    }
                }
            }
            else -> Unit
        }
    }
}

@Composable
private fun DetailSectionCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            content = content,
        )
    }
}

@Composable
private fun FloatingBookingBar(
    pricePerDay: Int,
    onBook: () -> Unit,
) {
    val isDarkTheme = isSystemInDarkTheme()
    val containerColor = if (isDarkTheme) Color(0xD9162230) else Color.White.copy(alpha = 0.90f)
    val borderColor = if (isDarkTheme) Color.White.copy(alpha = 0.10f) else Color.White.copy(alpha = 0.78f)
    val primaryTextColor = if (isDarkTheme) Color.White else BrandNavy
    val secondaryTextColor = if (isDarkTheme) Color.White.copy(alpha = 0.72f) else MutedText

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = containerColor,
        tonalElevation = 6.dp,
        shadowElevation = 12.dp,
        border = BorderStroke(1.dp, borderColor),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(2.dp),
            ) {
                Text(
                    text = "Price per day",
                    style = MaterialTheme.typography.labelLarge,
                    color = secondaryTextColor,
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalAlignment = Alignment.Bottom,
                ) {
                    Text(
                        text = "GHS $pricePerDay",
                        style = MaterialTheme.typography.headlineSmall.copy(fontSize = 24.sp),
                        fontWeight = FontWeight.ExtraBold,
                        color = primaryTextColor,
                    )
                    Text(
                        text = "/ day",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = secondaryTextColor,
                    )
                }
            }

            Button(
                onClick = onBook,
                modifier = Modifier
                    .height(48.dp)
                    .widthIn(min = 134.dp),
                shape = RoundedCornerShape(999.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = BrandBlue,
                    contentColor = Color.White,
                ),
            ) {
                Text(
                    text = "Book now",
                    style = MaterialTheme.typography.bodyLarge.copy(fontSize = 15.sp),
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
    }
}

@Composable
private fun DetailPill(
    text: String,
    backgroundColor: Color,
    textColor: Color,
) {
    Surface(
        color = backgroundColor,
        shape = RoundedCornerShape(999.dp),
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.SemiBold,
            color = textColor,
        )
    }
}

@Composable
private fun FavoriteOverviewButton(
    isFavorite: Boolean,
    onClick: () -> Unit,
) {
    Surface(
        modifier = Modifier
            .widthIn(min = 130.dp)
            .clickable(onClick = onClick),
        color = Color.White,
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, Color.Black.copy(alpha = 0.08f)),
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Icon(
                imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                contentDescription = "Favorite",
                tint = if (isFavorite) Color.Red else BrandNavy,
            )
            Text(
                text = "Save to favorites",
                textAlign = TextAlign.Center,
                style = MaterialTheme.typography.labelLarge,
                color = MutedText,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}

@Composable
private fun CarDetailLine(label: String, value: String) {
    Row(verticalAlignment = Alignment.Top) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.Bold,
            color = MutedText,
        )
        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = value,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Bold,
            color = BrandNavy,
            textAlign = TextAlign.End,
        )
    }
}

@Composable
private fun InfoLine(label: String, value: String) {
    val colors = LocalHayameColors.current

    Row(verticalAlignment = Alignment.Top) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyLarge,
            color = colors.mutedText,
        )
        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = value,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.SemiBold,
            color = colors.brandNavy,
            textAlign = TextAlign.End,
        )
    }
}

@Composable
private fun HostAvatar(
    hostAvatar: String?,
    hostName: String,
) {
    val resolvedHostAvatar = resolveAppImage(hostAvatar)
    if (!resolvedHostAvatar.isNullOrBlank()) {
        AsyncImage(
            model = resolvedHostAvatar,
            contentDescription = null,
            modifier = Modifier
                .size(54.dp)
                .clip(CircleShape)
                .border(1.dp, Color.Black.copy(alpha = 0.08f), CircleShape),
            contentScale = ContentScale.Crop,
        )
    } else {
        Box(
            modifier = Modifier
                .size(54.dp)
                .background(BrandLight, CircleShape)
                .border(1.dp, Color.Black.copy(alpha = 0.08f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Text(hostInitials(hostName), color = BrandNavy, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun HostVerificationLine(
    label: String,
    verified: Boolean,
) {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(10.dp)
                .background(if (verified) BrandBlue else Danger.copy(alpha = 0.75f), CircleShape),
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.SemiBold,
            color = BrandNavy,
        )
    }
}

@Composable
private fun ReviewSummaryCard(review: ReviewDto) {
    val rating = (review.rating ?: 0.0).roundToInt().coerceIn(1, 5)
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Color.Black.copy(alpha = 0.05f)),
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(
                text = review.reviewer?.full_name ?: "Hayame guest",
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Bold,
                color = BrandNavy,
            )
            Text(
                text = "★".repeat(rating),
                style = MaterialTheme.typography.bodyLarge,
                color = Warning,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = review.comment?.takeIf { it.isNotBlank() } ?: "No comment provided.",
                style = MaterialTheme.typography.bodyMedium,
                color = MutedText,
            )
        }
    }
}

@Composable
private fun DateSelectionRow(
    label: String,
    date: LocalDate,
    minimumDate: LocalDate,
    blockedDates: Set<LocalDate> = emptySet(),
    isLoadingAvailability: Boolean = false,
    selectionRange: ClosedRange<LocalDate>? = null,
    canSelectDate: (LocalDate) -> Boolean = { candidate -> !candidate.isBefore(minimumDate) && candidate !in blockedDates },
    onDateSelected: (LocalDate) -> Unit,
) {
    var showCalendar by remember(label, date, minimumDate, blockedDates, selectionRange) { mutableStateOf(false) }

    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.SemiBold,
            color = BrandNavy,
        )
        Spacer(modifier = Modifier.weight(1f))
        Surface(
            modifier = Modifier.clickable { showCalendar = true },
            color = Color(0xFFF1F3F6),
            shape = RoundedCornerShape(999.dp),
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text(
                    text = date.toDisplayDate(),
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = BrandNavy,
                )
                if (isLoadingAvailability) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = BrandBlue,
                    )
                } else {
                    Icon(
                        imageVector = Icons.Outlined.CalendarMonth,
                        contentDescription = null,
                        tint = BrandBlue,
                    )
                }
            }
        }
    }

    if (showCalendar) {
        AvailabilityCalendarDialog(
            title = "Choose $label",
            selectedDate = date,
            minimumDate = minimumDate,
            blockedDates = blockedDates,
            selectionRange = selectionRange,
            canSelectDate = canSelectDate,
            onDismiss = { showCalendar = false },
        ) { selected ->
            showCalendar = false
            onDateSelected(selected)
        }
    }
}

private data class BookingCalendarMonthUi(
    val title: String,
    val weeks: List<List<LocalDate?>>,
)

@Composable
private fun AvailabilityCalendarDialog(
    title: String,
    selectedDate: LocalDate,
    minimumDate: LocalDate,
    blockedDates: Set<LocalDate>,
    selectionRange: ClosedRange<LocalDate>?,
    canSelectDate: (LocalDate) -> Boolean,
    onDismiss: () -> Unit,
    onDateSelected: (LocalDate) -> Unit,
) {
    val darkMode = isSystemInDarkTheme()
    val months = remember(minimumDate) { buildBookingCalendarMonths(minimumDate, 6) }
    val weekdayLabels = remember { listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat") }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false),
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 24.dp),
            color = if (darkMode) Color(0xFF152033) else Color.White,
            shape = RoundedCornerShape(28.dp),
            tonalElevation = 8.dp,
            shadowElevation = 18.dp,
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = if (darkMode) Color.White else BrandNavy,
                    )
                    Spacer(modifier = Modifier.weight(1f))
                    TextButton(onClick = onDismiss) {
                        Text("Done")
                    }
                }

                Text(
                    text = "Unavailable days are crossed out. Only bookable dates can be selected.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (darkMode) Color.White.copy(alpha = 0.7f) else MutedText,
                )

                months.forEach { month ->
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                color = if (darkMode) Color.White.copy(alpha = 0.04f) else Color(0xFFF8FAFC),
                                shape = RoundedCornerShape(20.dp),
                            )
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Text(
                            text = month.title,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = if (darkMode) Color.White else BrandNavy,
                        )

                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            weekdayLabels.forEach { weekday ->
                                Text(
                                    text = weekday,
                                    modifier = Modifier.weight(1f),
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = if (darkMode) Color.White.copy(alpha = 0.62f) else MutedText,
                                    textAlign = TextAlign.Center,
                                )
                            }
                        }

                        month.weeks.forEach { week ->
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                week.forEach { day ->
                                    if (day == null) {
                                        Spacer(modifier = Modifier.weight(1f).height(42.dp))
                                    } else {
                                        val blocked = day in blockedDates
                                        val selected = day == selectedDate
                                        val inRange = selectionRange?.let { day >= it.start && day <= it.endInclusive } == true
                                        val selectable = !day.isBefore(minimumDate) && canSelectDate(day)
                                        Surface(
                                            modifier = Modifier
                                                .weight(1f)
                                                .height(42.dp)
                                                .clickable(enabled = selectable) { onDateSelected(day) },
                                            color = when {
                                                selected -> BrandBlue
                                                inRange && selectable -> BrandBlue.copy(alpha = 0.14f)
                                                !selectable -> Color.Black.copy(alpha = if (darkMode) 0.14f else 0.03f)
                                                else -> Color.Transparent
                                            },
                                            shape = CircleShape,
                                        ) {
                                            Box(contentAlignment = Alignment.Center) {
                                                Text(
                                                    text = day.dayOfMonth.toString(),
                                                    style = MaterialTheme.typography.bodyMedium,
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = when {
                                                        selected -> Color.White
                                                        blocked || !selectable -> if (darkMode) Color.White.copy(alpha = 0.42f) else MutedText.copy(alpha = 0.6f)
                                                        darkMode -> Color.White
                                                        else -> BrandNavy
                                                    },
                                                    textDecoration = if (blocked || !selectable) TextDecoration.LineThrough else TextDecoration.None,
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SelectionField(
    selected: String,
    placeholder: String,
    options: List<String>,
    onSelected: (String) -> Unit,
) {
    var expanded by remember(selected, options) { mutableStateOf(false) }

    Box {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { expanded = true },
            color = Color.White,
            shape = RoundedCornerShape(14.dp),
            border = BorderStroke(1.dp, Color.Black.copy(alpha = 0.08f)),
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text(
                    text = selected.ifBlank { placeholder },
                    modifier = Modifier.weight(1f),
                    style = MaterialTheme.typography.bodyLarge,
                    color = if (selected.isBlank()) MutedText else BrandBlue,
                    fontWeight = FontWeight.SemiBold,
                )
                Icon(Icons.Outlined.ExpandMore, contentDescription = null, tint = BrandBlue)
            }
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            options.forEach { option ->
                DropdownMenuItem(
                    text = { Text(option) },
                    onClick = {
                        expanded = false
                        onSelected(option)
                    },
                )
            }
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun FullScreenPhotoGallery(
    imageUrls: List<String>,
    initialPage: Int,
    onDismiss: () -> Unit,
) {
    val pagerState = rememberPagerState(
        initialPage = initialPage.coerceIn(0, imageUrls.lastIndex),
        pageCount = { imageUrls.size },
    )

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black),
        ) {
            HorizontalPager(
                state = pagerState,
                modifier = Modifier.fillMaxSize(),
            ) { page ->
                AsyncImage(
                    model = imageUrls[page],
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Fit,
                )
            }

            IconButton(
                onClick = onDismiss,
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(top = 18.dp, start = 12.dp)
                    .background(Color.Black.copy(alpha = 0.45f), CircleShape),
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Close gallery",
                    tint = Color.White,
                )
            }

            Surface(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(top = 24.dp, end = 16.dp),
                color = Color.Black.copy(alpha = 0.45f),
                shape = RoundedCornerShape(99.dp),
            ) {
                Text(
                    text = "${pagerState.currentPage + 1}/${imageUrls.size}",
                    color = Color.White,
                    style = MaterialTheme.typography.labelMedium,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                )
            }
        }
    }
}

@Composable
fun BookingScreen(
    viewModel: AppViewModel,
    carId: String,
    pendingPaystackCallbackUri: String?,
    onBack: () -> Unit,
    onOpenConversation: (String) -> Unit,
    onBookingCompleted: () -> Unit,
    onPaystackCallbackConsumed: () -> Unit,
) {
    val pendingCheckout by viewModel.pendingCheckout.collectAsState()
    val carState by viewModel.carDetailState.collectAsState()
    val locations by viewModel.locations.collectAsState()
    val bookingDraft by viewModel.bookingDraft.collectAsState()
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val me by viewModel.me.collectAsState()
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
        endDate = parseApiDate(draft?.endDate)?.takeIf { it.isAfter(startDate) } ?: startDate.plusDays(1)
        region = draft?.region?.takeIf { it.isNotBlank() } ?: (car.region ?: region)
        city = draft?.city?.takeIf { it.isNotBlank() } ?: (car.city ?: city)
        address = draft?.address.orEmpty()
        tripMode = draft?.tripMode?.let(::parseCheckoutTripMode)
            ?: if (car.delivery_available == true) null else CheckoutTripMode.PICKUP
        deliveryAddress = draft?.deliveryAddress.orEmpty()
        deliveryTime = draft?.deliveryTime?.takeIf { it.isNotBlank() } ?: defaultDeliveryTimeString()
        contactPhone = draft?.contactPhone.orEmpty()
        deliveryNotes = draft?.deliveryNotes.orEmpty()
        initialized = true
    }

    LaunchedEffect(startDate, blockedBookingDates) {
        if (blockedBookingDates.isNotEmpty() && !isBookableStartDate(startDate, blockedBookingDates)) {
            nextBookableStartDate(
                from = if (startDate.isBefore(LocalDate.now())) LocalDate.now() else startDate,
                duration = 1,
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
                duration = 1,
                blockedDates = blocked,
            )

            if (nextStart == null) {
                paymentMessage = "No upcoming available dates in the next 6 months."
                return@loadAvailabilitySnapshot
            }

            startDate = if (isBookableStartDate(startDate, blocked)) startDate else nextStart
            preferredBookingEndDate(
                currentEnd = endDate,
                startDate = startDate,
                blockedDates = blocked,
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
        UiState.Loading -> {
            Scaffold(
                containerColor = PageBackground,
                topBar = {
                    CheckoutTopBar(title = "Checkout", backLabel = "Cancel", onBack = onBack)
                },
            ) { inner ->
                Box(modifier = Modifier.padding(inner)) {
                    LoadingBlock("Loading checkout...")
                }
            }
        }

        is UiState.Error -> {
            Scaffold(
                containerColor = PageBackground,
                topBar = {
                    CheckoutTopBar(title = "Checkout", backLabel = "Cancel", onBack = onBack)
                },
            ) { inner ->
                Box(modifier = Modifier.padding(inner)) {
                    ErrorBlock(state.message, onRetry = { viewModel.loadCarDetail(carId) })
                }
            }
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
            val totalAmount = subtotal + insuranceFee + deliveryFee + outsideSurcharge + depositAmount
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
                        viewModel.showMessage("Payment successful. Your booking is now in Trips.")
                        returnedFromPaymentWithoutCallback = false
                        onBookingCompleted()
                    },
                    onError = {
                        isProcessingPayment = false
                        returnedFromPaymentWithoutCallback = false
                        paymentMessage = it
                    },
                )
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
                        paymentMessage = it
                    },
                )
            }

            LaunchedEffect(pendingPaystackCallbackUri, pendingCheckout?.reference) {
                if (!pendingPaystackCallbackUri.isNullOrBlank() && pendingCheckout != null && !isProcessingPayment) {
                    val callbackResult = parsePaystackCallback(pendingPaystackCallbackUri)
                    awaitingPaymentReturn = false
                    onPaystackCallbackConsumed()
                    if (callbackResult.isCancelled || callbackResult.reference.isNullOrBlank()) {
                        paymentMessage = "Payment was cancelled or not completed."
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

            Scaffold(
                containerColor = PageBackground,
                topBar = {
                    CheckoutTopBar(
                        title = currentStep.title,
                        backLabel = if (currentStep == CheckoutStep.TRIP_DETAILS) "Cancel" else "Back",
                        onBack = {
                            if (currentStep == CheckoutStep.TRIP_DETAILS) onBack() else goBackWithinCheckout()
                        },
                    )
                },
                bottomBar = {
                    CheckoutBottomBar(
                        buttonText = if (currentStep == CheckoutStep.PAYMENT) {
                            if (isProcessingPayment) "Processing..." else "Make payment"
                        } else {
                            "Next"
                        },
                        note = currentStep.footerNote,
                        error = paymentMessage,
                        isLoading = isProcessingPayment && currentStep == CheckoutStep.PAYMENT,
                    ) {
                        when (currentStep) {
                            CheckoutStep.TRIP_DETAILS -> {
                                if (!endDate.isAfter(startDate)) {
                                    paymentMessage = "Choose an end date after your start date."
                                } else {
                                    paymentMessage = null
                                    currentStep = CheckoutStep.LOCATION
                                }
                            }

                            CheckoutStep.LOCATION -> {
                                if (deliveryAvailable && tripMode == null) {
                                    paymentMessage = "Choose pickup or delivery to continue."
                                } else if (region.trim().isBlank()) {
                                    paymentMessage = "Select your trip region to continue."
                                } else if (city.trim().isBlank()) {
                                    paymentMessage = "Select your trip city to continue."
                                } else if (selectedTripMode == CheckoutTripMode.DELIVERY && deliveryAddress.trim().length < 6) {
                                    paymentMessage = "Enter the exact delivery address."
                                } else if (selectedTripMode == CheckoutTripMode.DELIVERY && !isValidDeliveryTime(deliveryTime.trim())) {
                                    paymentMessage = "Enter a valid delivery time in HH:mm format."
                                } else if (selectedTripMode == CheckoutTripMode.DELIVERY && contactPhone.trim().phoneDigitsCount() !in 7..15) {
                                    paymentMessage = "Enter a valid contact phone number."
                                } else {
                                    paymentMessage = null
                                    currentStep = CheckoutStep.REVIEW
                                }
                            }

                            CheckoutStep.REVIEW -> {
                                paymentMessage = null
                                currentStep = CheckoutStep.PAYMENT
                            }

                            CheckoutStep.PAYMENT -> beginPayment()
                        }
                    }
                },
            ) { inner ->
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(inner)
                ) {
                    CheckoutProgressHeader(
                        currentStep = currentStep,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp),
                    )

                    AnimatedContent(
                        targetState = currentStep,
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth(),
                        transitionSpec = {
                            if (targetState.ordinal > initialState.ordinal) {
                                (slideInHorizontally(animationSpec = tween(240)) { it / 3 } + fadeIn(animationSpec = tween(220))).togetherWith(
                                    slideOutHorizontally(animationSpec = tween(180)) { -it / 5 } + fadeOut(animationSpec = tween(180))
                                )
                            } else {
                                (slideInHorizontally(animationSpec = tween(240)) { -it / 3 } + fadeIn(animationSpec = tween(220))).togetherWith(
                                    slideOutHorizontally(animationSpec = tween(180)) { it / 5 } + fadeOut(animationSpec = tween(180))
                                )
                            }
                        },
                        label = "checkout-step",
                    ) { step ->
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .verticalScroll(rememberScrollState())
                                .padding(horizontal = 16.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp),
                        ) {
                            when (step) {
                                CheckoutStep.TRIP_DETAILS -> {
                                    CheckoutStepCard {
                                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                            Text(
                                                text = "Your trip",
                                                style = MaterialTheme.typography.bodyLarge,
                                                fontWeight = FontWeight.Bold,
                                                color = BrandNavy,
                                            )
                                            Text(
                                                text = "$nights day${if (nights == 1) "" else "s"}",
                                                style = MaterialTheme.typography.headlineMedium,
                                                fontWeight = FontWeight.ExtraBold,
                                                color = BrandBlue,
                                            )
                                            Text(
                                                text = "Choose dates below. Unavailable and booked days are blocked automatically.",
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = MutedText,
                                            )
                                        }
                                    }

                                    CheckoutStepCard {
                                        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                            DateSelectionRow(
                                                label = "Start date",
                                                date = startDate,
                                                minimumDate = LocalDate.now(),
                                                blockedDates = blockedBookingDates,
                                                isLoadingAvailability = isLoadingBookingAvailability,
                                                selectionRange = startDate..endDate,
                                                canSelectDate = { candidate -> isBookableStartDate(candidate, blockedBookingDates) },
                                            ) {
                                                selectedQuickDuration = null
                                                startDate = it
                                            }
                                            DateSelectionRow(
                                                label = "End date",
                                                date = endDate,
                                                minimumDate = startDate.plusDays(1),
                                                blockedDates = blockedBookingDates,
                                                isLoadingAvailability = isLoadingBookingAvailability,
                                                selectionRange = startDate..endDate,
                                                canSelectDate = { candidate -> isBookableEndDate(candidate, startDate, blockedBookingDates) },
                                            ) {
                                                selectedQuickDuration = null
                                                endDate = it
                                            }
                                            Text(
                                                text = "Unavailable dates are crossed out. The first bookable day is selected for you automatically.",
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = MutedText,
                                            )
                                            Text(
                                                text = "Quick select",
                                                style = MaterialTheme.typography.bodyLarge,
                                                fontWeight = FontWeight.Bold,
                                                color = BrandNavy,
                                            )
                                            SecondaryPillButton(text = "2 days", modifier = Modifier.fillMaxWidth(), isSelected = selectedQuickDuration == 2) {
                                                applyQuickTripDuration(2)
                                            }
                                            SecondaryPillButton(text = "5 days", modifier = Modifier.fillMaxWidth(), isSelected = selectedQuickDuration == 5) {
                                                applyQuickTripDuration(5)
                                            }
                                            SecondaryPillButton(text = "7 days", modifier = Modifier.fillMaxWidth(), isSelected = selectedQuickDuration == 7) {
                                                applyQuickTripDuration(7)
                                            }
                                        }
                                    }

	                                }

                                CheckoutStep.LOCATION -> {
                                    CheckoutStepCard {
                                        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                                            CheckoutSectionHeader(
                                                title = "Trip mode",
                                                helpTitle = "Pickup or delivery",
                                                helpMessage = "Pickup means you meet at the listing area and no delivery fee is charged. Delivery means the host brings the car to your preferred handoff point.",
                                            )

                                            if (deliveryAvailable) {
                                                BookingModeOptionCard(
                                                    title = CheckoutTripMode.PICKUP.label,
                                                    subtitle = CheckoutTripMode.PICKUP.subtitle,
                                                    trailingText = "No delivery fee",
                                                    selected = tripMode == CheckoutTripMode.PICKUP,
                                                    onClick = {
                                                        tripMode = CheckoutTripMode.PICKUP
                                                        paymentMessage = null
                                                    },
                                                )
                                                BookingModeOptionCard(
                                                    title = CheckoutTripMode.DELIVERY.label,
                                                    subtitle = CheckoutTripMode.DELIVERY.subtitle,
                                                    trailingText = if (baseDeliveryFee > 0) "GHS $baseDeliveryFee" else "Free",
                                                    selected = tripMode == CheckoutTripMode.DELIVERY,
                                                    onClick = {
                                                        tripMode = CheckoutTripMode.DELIVERY
                                                        if (contactPhone.isBlank()) {
                                                            contactPhone = me.preferredPhone().orEmpty()
                                                        }
                                                        paymentMessage = null
                                                    },
                                                )
                                                if (tripMode == null) {
                                                    Text(
                                                        text = "Choose pickup or delivery to continue.",
                                                        style = MaterialTheme.typography.bodyMedium,
                                                        fontWeight = FontWeight.SemiBold,
                                                        color = Warning,
                                                    )
                                                }
                                            } else {
                                                BookingModeSummaryCard(
                                                    title = CheckoutTripMode.PICKUP.label,
                                                    message = "This listing is pickup only.",
                                                )
                                            }
                                        }
                                    }

                                    if (tripMode == CheckoutTripMode.DELIVERY) {
                                        CheckoutStepCard {
                                            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                                                CheckoutSectionHeader(
                                                    title = "Delivery details",
                                                    helpTitle = "Delivery details",
                                                    helpMessage = "These details are shared with the host so they know where and when to bring the car.",
                                                )

                                                OutlinedTextField(
                                                    value = deliveryAddress,
                                                    onValueChange = { deliveryAddress = it },
                                                    modifier = Modifier.fillMaxWidth(),
                                                    label = { Text("Delivery address") },
                                                    placeholder = { Text("House number, street, landmark") },
                                                    shape = RoundedCornerShape(16.dp),
                                                    colors = OutlinedTextFieldDefaults.colors(
                                                        focusedBorderColor = BrandBlue,
                                                        unfocusedBorderColor = Color.Black.copy(alpha = 0.08f),
                                                    ),
                                                )
                                                OutlinedTextField(
                                                    value = deliveryTime,
                                                    onValueChange = { deliveryTime = it.take(5) },
                                                    modifier = Modifier.fillMaxWidth(),
                                                    label = { Text("Preferred delivery time") },
                                                    placeholder = { Text("10:00") },
                                                    shape = RoundedCornerShape(16.dp),
                                                    colors = OutlinedTextFieldDefaults.colors(
                                                        focusedBorderColor = BrandBlue,
                                                        unfocusedBorderColor = Color.Black.copy(alpha = 0.08f),
                                                    ),
                                                )
                                                OutlinedTextField(
                                                    value = contactPhone,
                                                    onValueChange = { contactPhone = it },
                                                    modifier = Modifier.fillMaxWidth(),
                                                    label = { Text("Contact phone") },
                                                    placeholder = { Text("+233 24 123 4567") },
                                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                                                    shape = RoundedCornerShape(16.dp),
                                                    colors = OutlinedTextFieldDefaults.colors(
                                                        focusedBorderColor = BrandBlue,
                                                        unfocusedBorderColor = Color.Black.copy(alpha = 0.08f),
                                                    ),
                                                )
                                                OutlinedTextField(
                                                    value = deliveryNotes,
                                                    onValueChange = { deliveryNotes = it.take(500) },
                                                    modifier = Modifier.fillMaxWidth(),
                                                    label = { Text("Delivery notes (optional)") },
                                                    placeholder = { Text("Gate code, landmark, or handoff notes") },
                                                    minLines = 3,
                                                    maxLines = 5,
                                                    shape = RoundedCornerShape(16.dp),
                                                    colors = OutlinedTextFieldDefaults.colors(
                                                        focusedBorderColor = BrandBlue,
                                                        unfocusedBorderColor = Color.Black.copy(alpha = 0.08f),
                                                    ),
                                                )
                                                Text(
                                                    text = if (deliveryFee > 0) {
                                                        "Delivery fee: GHS $deliveryFee"
                                                    } else {
                                                        "This listing offers free delivery."
                                                    },
                                                    style = MaterialTheme.typography.bodyMedium,
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = BrandBlue,
                                                )
                                            }
                                        }
                                    }

                                    CheckoutStepCard {
                                        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
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
                                            OutlinedTextField(
                                                value = address,
                                                onValueChange = { address = it },
                                                modifier = Modifier.fillMaxWidth(),
                                                placeholder = { Text("Exact destination (optional)") },
                                                shape = RoundedCornerShape(16.dp),
                                                colors = OutlinedTextFieldDefaults.colors(
                                                    focusedBorderColor = BrandBlue,
                                                    unfocusedBorderColor = Color.Black.copy(alpha = 0.08f),
                                                ),
                                            )
                                            Text(
                                                text = locationHelperText,
                                                style = MaterialTheme.typography.bodyLarge,
                                                fontWeight = FontWeight.SemiBold,
                                                color = if (outsideListingRegion) Warning else Success,
                                            )
                                        }
                                    }

                                    CheckoutStepCard {
                                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                            Text(
                                                text = "Smart defaults",
                                                style = MaterialTheme.typography.bodyLarge,
                                                fontWeight = FontWeight.Bold,
                                                color = BrandNavy,
                                            )
                                            Text(
                                                text = "Trip use location stays separate from pickup or delivery so pricing and host handoff stay accurate.",
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = MutedText,
                                            )
                                        }
                                    }
                                }

                                CheckoutStep.REVIEW -> {
                                    CheckoutStepCard {
                                        Row(
                                            horizontalArrangement = Arrangement.spacedBy(14.dp),
                                            verticalAlignment = Alignment.Top,
                                        ) {
                                            if (!summaryImageUrl.isNullOrBlank()) {
                                                AsyncImage(
                                                    model = summaryImageUrl,
                                                    contentDescription = null,
                                                    modifier = Modifier
                                                        .size(width = 86.dp, height = 72.dp)
                                                        .clip(RoundedCornerShape(16.dp)),
                                                    contentScale = ContentScale.Crop,
                                                )
                                            } else {
                                                Box(
                                                    modifier = Modifier
                                                        .size(width = 86.dp, height = 72.dp)
                                                        .background(BrandLight, RoundedCornerShape(16.dp)),
                                                    contentAlignment = Alignment.Center,
                                                ) {
                                                    Icon(
                                                        Icons.Outlined.DirectionsCar,
                                                        contentDescription = null,
                                                        tint = BrandBlue,
                                                    )
                                                }
                                            }

                                            Column(
                                                modifier = Modifier.weight(1f),
                                                verticalArrangement = Arrangement.spacedBy(6.dp),
                                            ) {
                                                Text(
                                                    text = carTitle,
                                                    style = MaterialTheme.typography.titleLarge,
                                                    fontWeight = FontWeight.Bold,
                                                    color = BrandNavy,
                                                    maxLines = 2,
                                                    overflow = TextOverflow.Ellipsis,
                                                )
                                                Text(
                                                    text = "${startDate.toDisplayDate()} - ${endDate.toDisplayDate()}",
                                                    style = MaterialTheme.typography.bodyLarge,
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = BrandBlue,
                                                )
                                                Text(
                                                    text = "$nights day${if (nights == 1) "" else "s"} • ${selectedTripMode.label}",
                                                    style = MaterialTheme.typography.bodyMedium,
                                                    color = MutedText,
                                                    maxLines = 2,
                                                    overflow = TextOverflow.Ellipsis,
                                                )
                                                Text(
                                                    text = resolvedTripAddress(),
                                                    style = MaterialTheme.typography.bodyMedium,
                                                    color = MutedText,
                                                    maxLines = 2,
                                                    overflow = TextOverflow.Ellipsis,
                                                )
                                            }
                                        }
                                    }

                                    CheckoutStepCard {
                                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                            Text(
                                                text = "Trip summary",
                                                style = MaterialTheme.typography.bodyLarge,
                                                fontWeight = FontWeight.Bold,
                                                color = BrandNavy,
                                            )
                                            InfoLine(label = "Trip mode", value = selectedTripMode.label)
                                            InfoLine(label = "Trip use area", value = resolvedTripAddress())
                                            if (selectedTripMode == CheckoutTripMode.DELIVERY) {
                                                InfoLine(label = "Delivery address", value = deliveryAddress.trim().ifBlank { "Not provided" })
                                                InfoLine(label = "Delivery time", value = deliveryTime.trim().ifBlank { "Not provided" })
                                                InfoLine(label = "Contact phone", value = contactPhone.trim().ifBlank { "Not provided" })
                                                if (deliveryNotes.trim().isNotBlank()) {
                                                    InfoLine(label = "Delivery notes", value = deliveryNotes.trim())
                                                }
                                            }
                                        }
                                    }

                                    CheckoutStepCard {
                                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                            Text(
                                                text = "Price breakdown",
                                                style = MaterialTheme.typography.bodyLarge,
                                                fontWeight = FontWeight.Bold,
                                                color = BrandNavy,
                                            )
                                            InfoLine(label = "Daily rate × $nights", value = "GHS $subtotal")
                                            InfoLine(label = "Insurance", value = "GHS $insuranceFee")
                                            if (selectedTripMode == CheckoutTripMode.DELIVERY) {
                                                InfoLine(label = "Delivery", value = "GHS $deliveryFee")
                                            }
                                            if (outsideListingRegion || outsideSurcharge > 0) {
                                                InfoLine(label = "Outside region fee", value = "GHS $outsideSurcharge")
                                            }
                                            InfoLine(label = "Deposit", value = "GHS $depositAmount")
                                            HorizontalDivider(color = Color.Black.copy(alpha = 0.08f))
                                            Row(verticalAlignment = Alignment.Bottom) {
                                                Text(
                                                    text = "Total",
                                                    style = MaterialTheme.typography.bodyLarge,
                                                    fontWeight = FontWeight.Bold,
                                                    color = BrandNavy,
                                                )
                                                Spacer(modifier = Modifier.weight(1f))
                                                Text(
                                                    text = "GHS $totalAmount",
                                                    style = MaterialTheme.typography.headlineMedium,
                                                    fontWeight = FontWeight.ExtraBold,
                                                    color = BrandBlue,
                                                )
                                            }
                                            Text(
                                                text = "No hidden fees. This is the amount shown before payment.",
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = MutedText,
                                            )
                                        }
                                    }
                                }

                                CheckoutStep.PAYMENT -> {
                                    CheckoutStepCard {
                                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                            Text(
                                                text = "Total amount",
                                                style = MaterialTheme.typography.bodyLarge,
                                                fontWeight = FontWeight.Bold,
                                                color = MutedText,
                                            )
                                            Text(
                                                text = "GHS $totalAmount",
                                                style = MaterialTheme.typography.headlineLarge,
                                                fontWeight = FontWeight.ExtraBold,
                                                color = BrandNavy,
                                            )
                                            Text(
                                                text = "Secure payment with no hidden fees.",
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = MutedText,
                                            )
                                        }
                                    }

                                    CheckoutStepCard {
                                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                            Text(
                                                text = "Payment methods",
                                                style = MaterialTheme.typography.bodyLarge,
                                                fontWeight = FontWeight.Bold,
                                                color = BrandNavy,
                                            )
                                            CheckoutPaymentMethodRow(
                                                title = "Mobile Money",
                                                subtitle = "Fast checkout from your phone",
                                                icon = Icons.Outlined.PhoneIphone,
                                            )
                                            CheckoutPaymentMethodRow(
                                                title = "Card",
                                                subtitle = "Visa and Mastercard supported",
                                                icon = Icons.Outlined.CreditCard,
                                            )
                                            CheckoutPaymentMethodRow(
                                                title = "Bank transfer",
                                                subtitle = "Available in secure checkout",
                                                icon = Icons.Outlined.AccountBalance,
                                            )
                                        }
                                    }

                                    CheckoutStepCard {
                                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                            Text(
                                                text = "What happens next",
                                                style = MaterialTheme.typography.bodyLarge,
                                                fontWeight = FontWeight.Bold,
                                                color = BrandNavy,
                                            )
                                            Text(
                                                text = "Tap Make payment and we'll open the secure checkout sheet to finish your booking.",
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = MutedText,
                                            )
                                        }
                                    }

                                    if (pendingCheckout != null) {
                                        CheckoutStepCard {
                                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                                Text(
                                                    text = "Payment pending",
                                                    style = MaterialTheme.typography.titleLarge,
                                                    fontWeight = FontWeight.Bold,
                                                    color = BrandNavy,
                                                )
                                                Text(
                                                    text = "Complete the payment in the secure checkout sheet. We'll detect completion automatically when you return.",
                                                    style = MaterialTheme.typography.bodyMedium,
                                                    color = MutedText,
                                                )
                                                InfoLine(label = "Reference", value = pendingCheckout!!.reference)
                                                GradientPillButton(
                                                    text = "Open checkout",
                                                    modifier = Modifier.fillMaxWidth(),
                                                    onClick = {
                                                        awaitingPaymentReturn = true
                                                        paymentMessage = null
                                                        openExternalUrl(
                                                            context,
                                                            pendingCheckout!!.payment_url ?: pendingCheckout!!.authorization_url,
                                                        )
                                                    },
                                                )
                                            }
                                        }
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(24.dp))
                        }
                    }
                }

                if (isProcessingPayment) {
                    PaymentProcessingOverlay()
                }
            }
        }

        else -> Unit
    }
}

private enum class CheckoutTripMode(
    val rawValue: String,
    val label: String,
    val subtitle: String,
) {
    PICKUP(
        rawValue = "pickup",
        label = "Pickup",
        subtitle = "Pick up the car at the listing area and avoid the delivery fee.",
    ),
    DELIVERY(
        rawValue = "delivery",
        label = "Delivery",
        subtitle = "Have the host bring the car to your preferred handoff point.",
    ),
}

private fun parseCheckoutTripMode(value: String?): CheckoutTripMode? {
    return CheckoutTripMode.entries.firstOrNull { it.rawValue.equals(value?.trim(), ignoreCase = true) }
}

private fun defaultDeliveryTimeString(): String = "10:00"

private fun isValidDeliveryTime(value: String): Boolean {
    return Regex("""^\d{2}:\d{2}$""").matches(value.trim())
}

private fun String.phoneDigitsCount(): Int = count { it.isDigit() }

@Composable
private fun CheckoutSectionHeader(
    title: String,
    helpTitle: String? = null,
    helpMessage: String? = null,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Bold,
            color = BrandNavy,
        )
        if (!helpTitle.isNullOrBlank() && !helpMessage.isNullOrBlank()) {
            InlineInfoButton(title = helpTitle, message = helpMessage)
        }
    }
}

@Composable
private fun InlineInfoButton(
    title: String,
    message: String,
) {
    var open by remember { mutableStateOf(false) }

    IconButton(onClick = { open = true }, modifier = Modifier.size(22.dp)) {
        Icon(
            Icons.Outlined.Info,
            contentDescription = title,
            tint = BrandBlue,
            modifier = Modifier.size(16.dp),
        )
    }

    if (open) {
        AlertDialog(
            onDismissRequest = { open = false },
            confirmButton = {
                TextButton(onClick = { open = false }) {
                    Text("OK")
                }
            },
            title = { Text(title, color = BrandNavy, fontWeight = FontWeight.Bold) },
            text = { Text(message, color = MutedText) },
        )
    }
}

@Composable
private fun BookingModeOptionCard(
    title: String,
    subtitle: String,
    trailingText: String,
    selected: Boolean,
    onClick: () -> Unit,
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        color = if (selected) BrandBlue.copy(alpha = 0.1f) else BrandLight,
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(
            1.dp,
            if (selected) BrandBlue else Color.Black.copy(alpha = 0.05f),
        ),
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(title, color = BrandNavy, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyLarge)
                Text(subtitle, color = MutedText, style = MaterialTheme.typography.bodyMedium)
            }
            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(trailingText, color = BrandBlue, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelLarge)
                Surface(
                    modifier = Modifier.size(18.dp),
                    shape = CircleShape,
                    color = if (selected) BrandBlue else Color.Transparent,
                    border = BorderStroke(2.dp, if (selected) BrandBlue else Color.Black.copy(alpha = 0.14f)),
                ) {}
            }
        }
    }
}

@Composable
private fun BookingModeSummaryCard(
    title: String,
    message: String,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = BrandLight,
        shape = RoundedCornerShape(16.dp),
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("✓", color = Success, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(title, color = BrandNavy, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyLarge)
                Text(message, color = MutedText, style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}

@Composable
private fun CheckoutTopBar(
    title: String,
    backLabel: String,
    onBack: () -> Unit,
) {
    val colors = LocalHayameColors.current
    Surface(color = colors.cardBackground, shadowElevation = 2.dp) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 10.dp),
        ) {
            TextButton(onClick = onBack, modifier = Modifier.align(Alignment.CenterStart)) {
                Text(backLabel, color = colors.brandBlue, fontWeight = FontWeight.Bold)
            }
            Text(
                text = title,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.ExtraBold,
                color = colors.brandNavy,
                modifier = Modifier.align(Alignment.Center),
            )
        }
    }
}

private enum class CheckoutStep(
    val title: String,
    val subtitle: String,
    val progressLabel: String,
    val footerNote: String,
) {
    TRIP_DETAILS(
        title = "Trip details",
        subtitle = "Set your dates first. Nothing else competes for attention here.",
        progressLabel = "Trip",
        footerNote = "Choose your dates first.",
    ),
    LOCATION(
        title = "Location",
        subtitle = "Choose pickup or delivery, then confirm where the trip will happen.",
        progressLabel = "Location",
        footerNote = "Pickup or delivery comes first. Then confirm the trip area.",
    ),
    REVIEW(
        title = "Review & price",
        subtitle = "See the trip mode, handoff details, and every charge before you pay.",
        progressLabel = "Review",
        footerNote = "Review every charge before continuing.",
    ),
    PAYMENT(
        title = "Checkout",
        subtitle = "Confirm the total, then complete payment securely.",
        progressLabel = "Pay",
        footerNote = "Secure payment. No hidden fees.",
    ),
}

@Composable
private fun CheckoutProgressHeader(
    currentStep: CheckoutStep,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Text(
            text = "Step ${currentStep.ordinal + 1} of ${CheckoutStep.values().size}",
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.Bold,
            color = BrandBlue,
        )
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(
                text = currentStep.title,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.ExtraBold,
                color = BrandNavy,
            )
            Text(
                text = currentStep.subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MutedText,
            )
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            CheckoutStep.values().forEach { step ->
                CheckoutProgressItem(
                    step = step,
                    isActive = step == currentStep,
                    isCompleted = step.ordinal < currentStep.ordinal,
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}

@Composable
private fun CheckoutProgressItem(
    step: CheckoutStep,
    isActive: Boolean,
    isCompleted: Boolean,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Surface(
            modifier = Modifier.size(28.dp),
            shape = CircleShape,
            color = if (isActive || isCompleted) BrandBlue else Color.White,
            border = BorderStroke(1.dp, if (isActive || isCompleted) BrandBlue else Color.Black.copy(alpha = 0.08f)),
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text(
                    text = if (isCompleted) "✓" else "${step.ordinal + 1}",
                    color = if (isActive || isCompleted) Color.White else MutedText,
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.labelLarge,
                )
            }
        }
        Text(
            text = step.progressLabel,
            style = MaterialTheme.typography.labelMedium,
            color = if (isActive || isCompleted) BrandNavy else MutedText,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
private fun CheckoutStepCard(
    content: @Composable ColumnScope.() -> Unit,
) {
    Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Color.Black.copy(alpha = 0.05f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            content = content,
        )
    }
}

@Composable
private fun CheckoutBottomBar(
    buttonText: String,
    note: String,
    error: String?,
    isLoading: Boolean,
    onClick: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val darkMode = colors.pageBackground.luminance() < 0.5f
    val primaryGradient = if (darkMode) {
        listOf(colors.brandBlue, Color(0xFF1484D9))
    } else {
        listOf(colors.brandBlue, colors.brandNavy)
    }
    Surface(color = colors.cardBackground.copy(alpha = 0.96f), shadowElevation = 10.dp) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            if (!error.isNullOrBlank()) {
                Text(
                    text = error,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Danger,
                    fontWeight = FontWeight.SemiBold,
                )
            }

            Button(
                onClick = onClick,
                enabled = !isLoading,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp),
                shape = RoundedCornerShape(18.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                contentPadding = PaddingValues(0.dp),
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.horizontalGradient(colors = primaryGradient),
                            RoundedCornerShape(18.dp),
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                strokeWidth = 2.dp,
                                color = Color.White,
                            )
                        }
                        Text(
                            text = buttonText,
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White,
                        )
                    }
                }
            }

            Text(
                text = note,
                style = MaterialTheme.typography.bodyMedium,
                color = colors.mutedText,
            )
        }
    }
}

@Composable
private fun CheckoutPaymentMethodRow(
    title: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = BrandLight,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .background(BrandBlue.copy(alpha = 0.12f), CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = BrandBlue,
                    modifier = Modifier.size(18.dp),
                )
            }
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(2.dp),
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold,
                    color = BrandNavy,
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MutedText,
                )
            }
        }
    }
}

@Composable
private fun PaymentProcessingOverlay() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.2f)),
        contentAlignment = Alignment.Center,
    ) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 22.dp, vertical = 18.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                CircularProgressIndicator(color = BrandBlue)
                Text("Processing payment", color = BrandNavy, fontWeight = FontWeight.Bold)
                Text(
                    "Please wait while we confirm your payment.",
                    color = MutedText,
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}

private fun parseApiDate(value: String?): LocalDate? {
    if (value.isNullOrBlank()) return null
    return runCatching { LocalDate.parse(value, DateTimeFormatter.ISO_LOCAL_DATE) }.getOrNull()
}

private fun buildBookingCalendarMonths(startDate: LocalDate, count: Int): List<BookingCalendarMonthUi> {
    val monthFormatter = DateTimeFormatter.ofPattern("LLLL yyyy")
    val firstMonth = startDate.withDayOfMonth(1)

    return (0 until count).map { offset ->
        val monthStart = firstMonth.plusMonths(offset.toLong())
        val daysInMonth = monthStart.lengthOfMonth()
        val leadingEmptyCells = monthStart.dayOfWeek.value % 7
        val cells = buildList<LocalDate?> {
            repeat(leadingEmptyCells) { add(null) }
            repeat(daysInMonth) { dayIndex -> add(monthStart.plusDays(dayIndex.toLong())) }
        }
        val weeks = cells.chunked(7).map { week ->
            if (week.size < 7) {
                week + List(7 - week.size) { null }
            } else {
                week
            }
        }

        BookingCalendarMonthUi(
            title = monthStart.format(monthFormatter),
            weeks = weeks,
        )
    }
}

private fun isContinuousBookingRangeAvailable(
    startDate: LocalDate,
    endDate: LocalDate,
    blockedDates: Set<LocalDate>,
): Boolean {
    if (!endDate.isAfter(startDate)) return false
    var current = startDate
    while (current.isBefore(endDate)) {
        if (current in blockedDates) return false
        current = current.plusDays(1)
    }
    return true
}

private fun isBookableStartDate(date: LocalDate, blockedDates: Set<LocalDate>): Boolean {
    return !date.isBefore(LocalDate.now()) &&
        isContinuousBookingRangeAvailable(
            startDate = date,
            endDate = date.plusDays(1),
            blockedDates = blockedDates,
        )
}

private fun isBookableEndDate(date: LocalDate, startDate: LocalDate, blockedDates: Set<LocalDate>): Boolean {
    return date.isAfter(startDate) &&
        isContinuousBookingRangeAvailable(
            startDate = startDate,
            endDate = date,
            blockedDates = blockedDates,
        )
}

private fun preferredBookingEndDate(
    currentEnd: LocalDate,
    startDate: LocalDate,
    blockedDates: Set<LocalDate>,
): LocalDate? {
    if (isBookableEndDate(currentEnd, startDate, blockedDates)) {
        return currentEnd
    }

    val fallback = startDate.plusDays(1)
    return if (isContinuousBookingRangeAvailable(startDate, fallback, blockedDates)) fallback else null
}

private fun nextBookableStartDate(
    from: LocalDate,
    duration: Int,
    blockedDates: Set<LocalDate>,
): LocalDate? {
    var current = from
    repeat(180) {
        if (
            isContinuousBookingRangeAvailable(
                startDate = current,
                endDate = current.plusDays(duration.toLong()),
                blockedDates = blockedDates,
            )
        ) {
            return current
        }
        current = current.plusDays(1)
    }
    return null
}

private data class PaystackCallbackResult(
    val reference: String?,
    val isCancelled: Boolean,
)

private fun parsePaystackCallback(callbackUri: String?): PaystackCallbackResult {
    if (callbackUri.isNullOrBlank()) return PaystackCallbackResult(reference = null, isCancelled = false)
    val parsed = runCatching { Uri.parse(callbackUri) }.getOrNull()
        ?: return PaystackCallbackResult(reference = null, isCancelled = false)
    val reference = listOf("reference", "trxref")
        .firstNotNullOfOrNull { key ->
            parsed.getQueryParameter(key)?.trim()?.takeIf { it.isNotBlank() }
        }
    val status = parsed.getQueryParameter("status")?.trim()?.lowercase()
    val cancelled = (
        status == "cancelled" ||
            status == "canceled" ||
            status == "failed" ||
            status == "error"
        )
    return PaystackCallbackResult(reference = reference, isCancelled = cancelled)
}

private fun LocalDate.toApiDate(): String = format(DateTimeFormatter.ISO_LOCAL_DATE)

private fun LocalDate.toDisplayDate(): String = format(DateTimeFormatter.ofPattern("d MMM yyyy"))

private fun hostInitials(name: String): String {
    return name.split(" ")
        .filter { it.isNotBlank() }
        .take(2)
        .mapNotNull { it.firstOrNull()?.toString() }
        .joinToString("")
        .uppercase()
        .ifBlank { "H" }
}

private fun formatAddedDateLabel(createdAt: String?): String {
    if (createdAt.isNullOrBlank()) return "—"
    val candidate = createdAt.take(10)
    return try {
        LocalDate.parse(candidate, DateTimeFormatter.ISO_LOCAL_DATE)
            .format(DateTimeFormatter.ofPattern("MMM d, yyyy"))
    } catch (_: DateTimeParseException) {
        candidate
    }
}
@Composable
fun MessagesScreen(
    viewModel: AppViewModel,
    onBack: () -> Unit,
    onOpenConversation: (String) -> Unit,
    title: String = "Messages",
    showBackButton: Boolean = true,
) {
    val state by viewModel.conversationsState.collectAsState()
    LaunchedEffect(Unit) { viewModel.loadConversations() }

    Scaffold(
        topBar = {
            PageTopBar(title = title, onBack = if (showBackButton) onBack else null)
        }
    ) { inner ->
        when (val s = state) {
            UiState.Loading -> LoadingBlock("Loading...")
            is UiState.Error -> ErrorBlock(s.message, onRetry = { viewModel.loadConversations() })
            UiState.Empty -> EmptyBlock("No messages", "Your conversations will appear here.")
            is UiState.Success -> LazyColumn(modifier = Modifier.fillMaxSize().padding(inner).padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                item { Spacer(modifier = Modifier.height(8.dp)) }
                items(s.data, key = { it.id }) { row ->
                    ConversationItem(row = row, onClick = { onOpenConversation(row.id) })
                }
            }
            else -> {}
        }
    }
}

@Composable
private fun ConversationItem(row: com.hayame.app.core.network.ConversationDto, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            val other = row.other_user
            val otherAvatar = resolveAppImage(other?.avatar)
            if (!otherAvatar.isNullOrBlank()) {
                AsyncImage(model = otherAvatar, contentDescription = null, modifier = Modifier.size(52.dp).clip(CircleShape), contentScale = ContentScale.Crop)
            } else {
                Box(modifier = Modifier.size(52.dp).background(BrandLight, CircleShape), contentAlignment = Alignment.Center) {
                    Text(other?.name?.take(1) ?: "U", fontWeight = FontWeight.Bold, color = BrandBlue)
                }
            }
            Column(modifier = Modifier.weight(1f)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(other?.name ?: "User", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    if ((row.unread_count ?: 0) > 0) {
                        Surface(color = BrandBlue, shape = CircleShape) {
                            Text("${row.unread_count}", color = Color.White, style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                        }
                    }
                }
                Text(row.last_message_preview ?: "Tap to open chat", style = MaterialTheme.typography.bodyMedium, color = MutedText, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

@Composable
fun ConversationScreen(
    viewModel: AppViewModel,
    conversationId: String,
    onBack: () -> Unit,
) {
    val messagesState by viewModel.messagesState.collectAsState()
    val me by viewModel.me.collectAsState()
    var draft by rememberSaveable { mutableStateOf("") }

    LaunchedEffect(conversationId) { viewModel.selectConversation(conversationId) }

    Scaffold(
        topBar = {
            Row(modifier = Modifier.fillMaxWidth().background(Color.White).padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back") }
                Text("Chat", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 8.dp))
            }
        },
        bottomBar = {
            Surface(tonalElevation = 4.dp, color = Color.White) {
                Row(modifier = Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = draft,
                        onValueChange = { draft = it },
                        placeholder = { Text("Type a message...") },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(24.dp),
                        maxLines = 4
                    )
                    IconButton(
                        onClick = { if (draft.isNotBlank()) { viewModel.sendMessage(conversationId, draft); draft = "" } },
                        enabled = draft.isNotBlank(),
                        modifier = Modifier.background(if (draft.isNotBlank()) BrandBlue else Color.LightGray, CircleShape).size(48.dp)
                    ) { Icon(Icons.AutoMirrored.Filled.Send, contentDescription = null, tint = Color.White) }
                }
            }
        }
    ) { inner ->
        when (val s = messagesState) {
            UiState.Loading -> LoadingBlock()
            is UiState.Error -> ErrorBlock(s.message, onRetry = { viewModel.loadMessages(conversationId) })
            is UiState.Success -> LazyColumn(
                modifier = Modifier.fillMaxSize().padding(inner).padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                reverseLayout = false
            ) {
                item { Spacer(modifier = Modifier.height(8.dp)) }
                items(s.data, key = { it.id }) { message ->
                    val isMe = message.sender_id == me?.user?.id
                    MessageBubble(message = message, isMe = isMe)
                }
                item { Spacer(modifier = Modifier.height(8.dp)) }
            }
            else -> {}
        }
    }
}

@Composable
private fun MessageBubble(message: com.hayame.app.core.network.MessageDto, isMe: Boolean) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (isMe) Alignment.End else Alignment.Start
    ) {
        Surface(
            color = if (isMe) BrandBlue else Color(0xFFEFEFEF),
            shape = RoundedCornerShape(
                topStart = 16.dp,
                topEnd = 16.dp,
                bottomStart = if (isMe) 16.dp else 4.dp,
                bottomEnd = if (isMe) 4.dp else 16.dp
            )
        ) {
            Text(
                text = message.body,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                color = if (isMe) Color.White else BrandNavy,
                style = MaterialTheme.typography.bodyLarge
            )
        }
        Text(
            text = message.created_at.takeLast(5),
            style = MaterialTheme.typography.labelSmall,
            color = MutedText,
            modifier = Modifier.padding(top = 2.dp, start = 4.dp, end = 4.dp)
        )
    }
}

@Composable
fun BecomeHostScreen(viewModel: AppViewModel, onBack: () -> Unit) {
    Scaffold(
        topBar = {
            Row(modifier = Modifier.fillMaxWidth().background(Color.White).padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back") }
                Text("Become a Host", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 8.dp))
            }
        },
    ) { inner ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(inner).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("Host application", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = BrandNavy)
                        Text("Your Android host application form is being finalized to match iOS parity.", color = MutedText)
                        Button(onClick = { viewModel.loadHostStatus() }, modifier = Modifier.fillMaxWidth()) { Text("Refresh status") }
                    }
                }
            }
        }
    }
}

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
) {
    val me by viewModel.me.collectAsState()
    val myCarsState by viewModel.myCarsState.collectAsState()
    val bookingsState by viewModel.bookingsState.collectAsState()
    val hostReviewsState by viewModel.hostReviewsListState.collectAsState()
    val conversationsState by viewModel.conversationsState.collectAsState()
    var hostModeEnabled by rememberSaveable { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        viewModel.loadMyCars()
        viewModel.loadBookings()
        viewModel.loadHostReviews()
        viewModel.loadConversations()
    }

    val carsCount = (myCarsState as? UiState.Success<List<CarDto>>)?.data?.size ?: 0
    val currentUserId = me?.user?.id.orEmpty()
    val bookings = (bookingsState as? UiState.Success<List<com.hayame.app.core.network.BookingDto>>)?.data.orEmpty()
    val hostBookings = remember(bookings, currentUserId) {
        bookings.filter { isHostBooking(it, currentUserId) }
    }
    val reviewList = (hostReviewsState as? UiState.Success<List<ReviewDto>>)?.data.orEmpty()
    val unreadCount = (conversationsState as? UiState.Success<List<com.hayame.app.core.network.ConversationDto>>)
        ?.data
        ?.sumOf { it.unread_count ?: 0 }
        ?: 0
    val urgentBookings = remember(hostBookings) {
        hostBookings.filter {
            it.status.equals("awaiting_host", ignoreCase = true) && it.payment_status.equals("paid", ignoreCase = true)
        }
    }
    val totalEarnings = hostBookings
        .filter { it.status.equals("confirmed", ignoreCase = true) || it.status.equals("completed", ignoreCase = true) || it.status.equals("awaiting_host", ignoreCase = true) }
        .sumOf { (it.total_price ?: 0.0).toInt() }
    val currentMonthKey = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"))
    val thisMonthEarnings = hostBookings
        .filter { bookingMonthKey(it.created_at) == currentMonthKey }
        .sumOf { (it.total_price ?: 0.0).toInt() }
    val averageRating = if (reviewList.isEmpty()) 0.0 else reviewList.map { it.rating ?: 0.0 }.average()
    val fullName = me.preferredFullName()?.takeIf { it.isNotBlank() } ?: me?.user?.email ?: "Host"
    val avatarUrl = resolveAppImage(me.preferredAvatarRaw())
    val colors = LocalHayameColors.current

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = {
            PageTopBar(title = "Dashboard")
        },
    ) { inner ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(inner).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Text("Host Dashboard", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold, color = colors.brandNavy)
            }
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text("Host mode", style = MaterialTheme.typography.titleMedium, color = colors.brandNavy, fontWeight = FontWeight.Bold)
                                Text("Turn off Host mode to move back to User mode.", color = colors.mutedText, style = MaterialTheme.typography.bodyMedium)
                            }
                            Switch(
                                checked = hostModeEnabled,
                                onCheckedChange = { enabled ->
                                    hostModeEnabled = enabled
                                    if (!enabled) {
                                        onBack()
                                    }
                                },
                            )
                        }
                    }
                }
            }
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        RemoteAvatar(
                            imageUrl = avatarUrl,
                            name = fullName,
                            fallback = "H",
                            size = 48.dp,
                            textStyle = MaterialTheme.typography.labelLarge,
                            borderColor = Color.Black.copy(alpha = 0.08f),
                        )
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text(fullName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                            Text("Manage host settings", color = colors.mutedText, style = MaterialTheme.typography.bodyMedium)
                        }
                        SecondaryPillButton(text = "Open", onClick = onOpenProfile)
                    }
                }
            }
            if (urgentBookings.isNotEmpty()) {
                item {
                    Card(
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("Urgent booking requests", color = Danger, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                            Text("You have ${urgentBookings.size} request(s) waiting for approval.", color = colors.mutedText, style = MaterialTheme.typography.bodyMedium)
                            SecondaryPillButton(text = "Review now", onClick = onOpenBookings)
                        }
                    }
                }
            }
            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    HostMetricCard(title = "Total Earnings", value = "GH₵$totalEarnings", modifier = Modifier.weight(1f))
                    HostMetricCard(title = "This Month", value = "GH₵$thisMonthEarnings", modifier = Modifier.weight(1f))
                }
            }
            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    HostMetricCard(title = "My Cars", value = "$carsCount", modifier = Modifier.weight(1f))
                    HostMetricCard(title = "Reviews", value = String.format("%.1f/5", averageRating), modifier = Modifier.weight(1f))
                }
            }
            item { Text("Quick nav", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold, color = colors.brandNavy) }
            item { HostQuickActionCard("Overview", "Snapshot of host performance", Icons.Outlined.Home, onClick = {}) }
            item { HostQuickActionCard("Vehicles", "Create and manage car listings", Icons.Outlined.DirectionsCar, onOpenCars) }
            item { HostQuickActionCard("Add car", "Create a new listing", Icons.Outlined.AddCircleOutline, onOpenCreateCar) }
            item { HostQuickActionCard("Bookings", "Review requests and trip history", Icons.Outlined.CalendarMonth, onOpenBookings) }
            item { HostQuickActionCard("Earnings", "Track payout performance", Icons.Outlined.AttachMoney, onOpenEarnings) }
            item {
                HostQuickActionCard(
                    title = "Unread messages",
                    subtitle = if (unreadCount > 0) "$unreadCount unread chat message(s)." else "No unread messages.",
                    icon = Icons.Outlined.MailOutline,
                    onClick = onOpenMessages,
                )
            }
            item { HostQuickActionCard(if (unreadCount > 0) "Chats $unreadCount" else "Chats", "Open and respond to guest conversations.", Icons.Outlined.ChatBubble, onOpenMessages) }
            item { HostQuickActionCard("Reviews", "Read guest feedback", Icons.Outlined.FavoriteBorder, onOpenReviews) }
            item { HostQuickActionCard("Favorites insights", "See most-saved listings", Icons.Outlined.FavoriteBorder, onOpenFavorites) }
            item { HostQuickActionCard("Settings", "Manage host settings", Icons.Outlined.Person, onOpenProfile) }
            item { Spacer(modifier = Modifier.height(16.dp)) }
        }
    }
}

@Composable
fun HostCarsScreen(
    viewModel: AppViewModel,
    onBack: () -> Unit,
    onCreate: () -> Unit,
    onEdit: (String) -> Unit,
    onOpenPhotos: (String) -> Unit = {},
    onOpenAvailability: (String) -> Unit = {},
) {
    val state by viewModel.myCarsState.collectAsState()
    val colors = LocalHayameColors.current

    LaunchedEffect(Unit) { viewModel.loadMyCars() }

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = {
            PageTopBar(title = "My Cars")
        },
    ) { inner ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(inner).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable(onClick = onCreate),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                    border = BorderStroke(1.dp, colors.border),
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 18.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Icon(Icons.Outlined.AddCircleOutline, contentDescription = null, tint = BrandBlue)
                        Text("Create Listing", color = colors.brandNavy, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                    }
                }
            }
            item {
                Text("My car listing", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
            }
            when (val s = state) {
                UiState.Loading -> item { LoadingBlock("Loading host listings...") }
                is UiState.Error -> item { ErrorBlock(s.message, onRetry = { viewModel.loadMyCars() }) }
                UiState.Empty -> item { EmptyBlock("No listings yet", "Create your first listing to start hosting.") }
                is UiState.Success -> {
                    items(s.data, key = { it.id }) { car ->
                        val thumbnailUrl = resolveAppImage(car.image_url)
                            ?: car.car_photos.orEmpty().firstNotNullOfOrNull { resolveAppImage(it.url) }
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onEdit(car.id) },
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                            border = BorderStroke(1.dp, colors.border),
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.Top,
                                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                                ) {
                                    HostListingThumbnail(imageUrl = thumbnailUrl)

                                    Column(
                                        modifier = Modifier.weight(1f),
                                        verticalArrangement = Arrangement.spacedBy(8.dp),
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            verticalAlignment = Alignment.Top,
                                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        ) {
                                            Text(
                                                car.title ?: listOfNotNull(car.brand, car.model).joinToString(" "),
                                                style = MaterialTheme.typography.titleMedium,
                                                fontWeight = FontWeight.Bold,
                                                color = colors.brandNavy,
                                                modifier = Modifier.weight(1f),
                                            )
                                            StatusBadge(status = if (car.approval_status.equals("approved", ignoreCase = true)) "approved" else "pending")
                                        }
                                        Text(
                                            listOfNotNull(car.city, car.region).joinToString(", "),
                                            color = colors.mutedText,
                                            style = MaterialTheme.typography.bodyMedium,
                                        )
                                        Text(
                                            "GH₵${(car.daily_price ?: 0.0).toInt()} / day",
                                            color = BrandBlue,
                                            fontWeight = FontWeight.Bold,
                                        )
                                    }
                                }
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                                    OutlinedButton(onClick = { onEdit(car.id) }, modifier = Modifier.weight(1f)) { Text("Open") }
                                    OutlinedButton(onClick = { onOpenPhotos(car.id) }, modifier = Modifier.weight(1f)) { Text("Photos") }
                                }
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                                    OutlinedButton(onClick = { onOpenAvailability(car.id) }, modifier = Modifier.weight(1f)) { Text("Availability") }
                                    OutlinedButton(onClick = { viewModel.deleteCar(car.id) }, modifier = Modifier.weight(1f)) { Text("Delete", color = Danger) }
                                }
                            }
                        }
                    }
                }
                UiState.Idle -> item { LoadingBlock("Loading host listings...") }
            }
        }
    }
}

@Composable
fun HostCarEditorScreen(
    viewModel: AppViewModel,
    carId: String?,
    onBack: () -> Unit,
    onOpenPhotos: (String) -> Unit = {},
    onOpenAvailability: (String) -> Unit = {},
) {
    val myCarsState by viewModel.myCarsState.collectAsState()
    val locations by viewModel.locations.collectAsState()
    val catalog by viewModel.catalog.collectAsState()
    val context = LocalContext.current
    val colors = LocalHayameColors.current
    val scope = rememberCoroutineScope()
    val prefs = remember(context) {
        context.getSharedPreferences("hayame_listing_editor", Context.MODE_PRIVATE)
    }
    val json = remember {
        Json {
            ignoreUnknownKeys = true
            encodeDefaults = true
        }
    }
    val currentYear = LocalDate.now().year
    val maxListingYear = currentYear + 1
    val minListingYear = 2000
    val maxPhotos = 7
    val maxPhotoBytes = 4 * 1024 * 1024
    val createDraftStorageKey = "hayame.host.create_listing_draft.v1"
    val existingCar = (myCarsState as? UiState.Success<List<CarDto>>)
        ?.data
        ?.firstOrNull { it.id == carId }
    val isCreate = carId.isNullOrBlank() || carId == "new"
    var didHydrate by rememberSaveable(carId) { mutableStateOf(false) }
    var isSaving by rememberSaveable(carId) { mutableStateOf(false) }
    var editorNotice by rememberSaveable(carId) { mutableStateOf<String?>(null) }
    var editorError by rememberSaveable(carId) { mutableStateOf<String?>(null) }

    var title by rememberSaveable(carId) { mutableStateOf("") }
    var brand by rememberSaveable(carId) { mutableStateOf("") }
    var model by rememberSaveable(carId) { mutableStateOf("") }
    var yearInput by rememberSaveable(carId) { mutableStateOf(currentYear.toString()) }
    var dailyPrice by rememberSaveable(carId) { mutableStateOf("300") }
    var region by rememberSaveable(carId) { mutableStateOf("") }
    var city by rememberSaveable(carId) { mutableStateOf("") }
    var carType by rememberSaveable(carId) { mutableStateOf("") }
    var transmission by rememberSaveable(carId) { mutableStateOf("Automatic") }
    var fuelType by rememberSaveable(carId) { mutableStateOf("Petrol") }
    var seats by rememberSaveable(carId) { mutableStateOf("5") }
    var description by rememberSaveable(carId) { mutableStateOf("") }
    var instantBook by rememberSaveable(carId) { mutableStateOf(false) }
    var deliveryAvailable by rememberSaveable(carId) { mutableStateOf(false) }
    var airConditioning by rememberSaveable(carId) { mutableStateOf(true) }
    var deliveryFee by rememberSaveable(carId) { mutableStateOf("") }
    var insuranceFee by rememberSaveable(carId) { mutableStateOf("") }
    var depositAmount by rememberSaveable(carId) { mutableStateOf("") }
    var outsideAccraFee by rememberSaveable(carId) { mutableStateOf("") }
    var cancellationPolicy by rememberSaveable(carId) { mutableStateOf("Moderate") }
    var pendingUploads by remember { mutableStateOf(emptyList<PendingListingUpload>()) }
    var currentStepIndex by rememberSaveable(carId) { mutableStateOf(0) }
    var showInsuranceField by rememberSaveable(carId) { mutableStateOf(false) }
    var showDepositField by rememberSaveable(carId) { mutableStateOf(false) }
    var showOutsideRegionFeeField by rememberSaveable(carId) { mutableStateOf(false) }
    var hasCustomTitleOverride by rememberSaveable(carId) { mutableStateOf(false) }
    var lastAutoGeneratedTitle by rememberSaveable(carId) { mutableStateOf("") }

    val currentStep = HostListingEditorStep.entries[currentStepIndex.coerceIn(0, HostListingEditorStep.entries.lastIndex)]

    val regionOptions = remember(locations, region) {
        withCurrentOption(locations.keys.filter { it.isNotBlank() }.sorted(), region)
    }
    val strictCityOptions = remember(locations, region) {
        if (region.isBlank()) {
            emptyList()
        } else {
            locations[region].orEmpty().filter { it.isNotBlank() }.distinct().sorted()
        }
    }
    val cityOptions = remember(locations, region, city) {
        withCurrentOption(strictCityOptions, city)
    }
    val brandOptions = remember(catalog, brand) {
        withCurrentOption(catalog.keys.filter { it.isNotBlank() }.sorted(), brand)
    }
    val strictModelOptions = remember(catalog, brand) {
        catalog[brand].orEmpty().filter { it.isNotBlank() }.distinct().sorted()
    }
    val modelOptions = remember(catalog, brand, model) {
        withCurrentOption(strictModelOptions, model)
    }
    val typeOptions = remember(carType) {
        withCurrentOption(
            listOf("SUV", "Sedan", "Luxury", "Van", "Pickup", "Hatchback", "Coupe"),
            carType,
        )
    }
    val transmissionOptions = remember { listOf("Automatic", "Manual") }
    val fuelOptions = remember { listOf("Petrol", "Diesel", "Hybrid", "Electric") }
    val cancellationOptions = remember { listOf("Flexible", "Moderate", "Strict") }
    val yearOptions = remember(currentYear, maxListingYear) { (maxListingYear downTo minListingYear).map(Int::toString) }
    val existingCoverUrl = remember(existingCar?.id, existingCar?.image_url, existingCar?.car_photos) {
        existingCar?.let { car ->
            resolveAppImage(car.image_url) ?: car.car_photos.orEmpty().firstNotNullOfOrNull { resolveAppImage(it.url) }
        }
    }
    val pricingSuggestion = remember(carType, yearInput) {
        suggestedListingPricing(
            carType = carType,
            year = yearInput.trim().toIntOrNull() ?: currentYear,
        )
    }
    val generatedListingTitle = remember(brand, model, yearInput) {
        buildGeneratedListingTitle(
            brand = brand,
            model = model,
            year = yearInput.trim().toIntOrNull(),
        )
    }
    val generatedListingTitlePreview = generatedListingTitle ?: "Select brand, model and year"

    fun normalizedListingTitle(value: String): String {
        return value.trim().replace(Regex("\\s+"), " ")
    }

    fun configureGeneratedTitleState() {
        val generated = normalizedListingTitle(
            buildGeneratedListingTitle(
                brand = brand,
                model = model,
                year = yearInput.trim().toIntOrNull(),
            ).orEmpty(),
        )
        val current = normalizedListingTitle(title)
        lastAutoGeneratedTitle = generated
        hasCustomTitleOverride = current.isNotBlank() &&
            (generated.isBlank() || !current.equals(generated, ignoreCase = true))
        if (current.isBlank() && generated.isNotBlank()) {
            title = generated
            hasCustomTitleOverride = false
        }
    }

    fun updateTitleOverrideState(newValue: String) {
        val current = normalizedListingTitle(newValue)
        val generated = normalizedListingTitle(
            buildGeneratedListingTitle(
                brand = brand,
                model = model,
                year = yearInput.trim().toIntOrNull(),
            ).orEmpty(),
        )
        hasCustomTitleOverride = current.isNotBlank() &&
            (generated.isBlank() || !current.equals(generated, ignoreCase = true))
        if (current.isBlank()) {
            lastAutoGeneratedTitle = generated
            title = generated
            hasCustomTitleOverride = false
        }
    }

    fun syncGeneratedTitleIfNeeded(force: Boolean = false) {
        val generated = normalizedListingTitle(
            buildGeneratedListingTitle(
                brand = brand,
                model = model,
                year = yearInput.trim().toIntOrNull(),
            ).orEmpty(),
        )
        val current = normalizedListingTitle(title)
        val previousGenerated = normalizedListingTitle(lastAutoGeneratedTitle)
        val matchesPreviousGenerated = previousGenerated.isNotBlank() &&
            current.equals(previousGenerated, ignoreCase = true)
        val shouldApply = force || current.isBlank() || !hasCustomTitleOverride || matchesPreviousGenerated

        lastAutoGeneratedTitle = generated
        if (generated.isBlank() && !force && current.isNotBlank()) return

        if (shouldApply && title != generated) {
            title = generated
            hasCustomTitleOverride = false
        }
    }

    fun jumpToStep(step: HostListingEditorStep) {
        currentStepIndex = step.ordinal
    }

    fun validationError(step: HostListingEditorStep): String? {
        val parsedYear = yearInput.trim().toIntOrNull()
        val parsedDailyPrice = dailyPrice.trim().toIntOrNull()
        val parsedSeats = seats.trim().toIntOrNull()
        val normalizedCancellation = cancellationPolicy.trim().ifBlank { "Moderate" }

        return when (step) {
            HostListingEditorStep.BASIC_INFO -> when {
                title.trim().length < 3 -> "Add a listing title before continuing."
                brand.trim().isEmpty() -> "Brand is required."
                model.trim().isEmpty() -> "Model is required."
                parsedYear == null || parsedYear !in minListingYear..maxListingYear -> "Enter a valid year."
                else -> null
            }

            HostListingEditorStep.VEHICLE_DETAILS -> when {
                carType.trim().isEmpty() -> "Select a car type to continue."
                parsedSeats == null || parsedSeats !in 2..8 -> "Seats must be between 2 and 8."
                description.trim().length < 10 -> "Description must be at least 10 characters."
                else -> null
            }

            HostListingEditorStep.PRICING -> when {
                parsedDailyPrice == null || parsedDailyPrice !in 50..10_000 ->
                    "Daily price must be between GHS 50 and GHS 10,000."
                else -> null
            }

            HostListingEditorStep.LOCATION -> when {
                region.trim().length < 2 -> "Region is required."
                city.trim().length < 2 -> "City is required."
                else -> null
            }

            HostListingEditorStep.FEATURES_RULES -> when {
                normalizedCancellation !in cancellationOptions -> "Choose a valid cancellation policy."
                else -> null
            }

            HostListingEditorStep.PHOTOS -> when {
                isCreate && pendingUploads.isEmpty() -> "Add at least one photo before publishing."
                else -> null
            }

            HostListingEditorStep.REVIEW -> null
        }
    }

    fun firstInvalidStep(): HostListingEditorStep? {
        return HostListingEditorStep.entries.firstOrNull { validationError(it) != null }
    }

    fun currentDraft(): ListingEditorDraftState {
        return ListingEditorDraftState(
            title = title.trim(),
            brand = brand.trim(),
            model = model.trim(),
            year = yearInput.trim().toIntOrNull() ?: currentYear,
            price = dailyPrice.trim().toIntOrNull() ?: 300,
            region = region.trim(),
            city = city.trim(),
            carType = carType.trim(),
            transmission = transmission.trim().ifBlank { "Automatic" },
            fuelType = fuelType.trim().ifBlank { "Petrol" },
            seats = seats.trim().toIntOrNull() ?: 5,
            description = description,
            instantBook = instantBook,
            deliveryAvailable = deliveryAvailable,
            airConditioning = airConditioning,
            deliveryFee = deliveryFee.trim().toIntOrNull() ?: 0,
            insuranceFee = insuranceFee.trim().toIntOrNull() ?: 0,
            depositAmount = depositAmount.trim().toIntOrNull() ?: 0,
            outsideAccraFee = outsideAccraFee.trim().toIntOrNull() ?: 0,
            cancellationPolicy = cancellationPolicy.trim().ifBlank { "Moderate" },
        )
    }

    fun applyDraft(draft: ListingEditorDraftState) {
        title = draft.title
        brand = draft.brand
        model = draft.model
        yearInput = draft.year.toString()
        dailyPrice = draft.price.toString()
        region = draft.region
        city = draft.city
        carType = draft.carType
        transmission = draft.transmission.ifBlank { "Automatic" }
        fuelType = draft.fuelType.ifBlank { "Petrol" }
        seats = draft.seats.toString()
        description = draft.description
        instantBook = draft.instantBook
        deliveryAvailable = draft.deliveryAvailable
        airConditioning = draft.airConditioning
        deliveryFee = draft.deliveryFee.asOptionalFeeText()
        insuranceFee = draft.insuranceFee.asOptionalFeeText()
        depositAmount = draft.depositAmount.asOptionalFeeText()
        outsideAccraFee = draft.outsideAccraFee.asOptionalFeeText()
        cancellationPolicy = draft.cancellationPolicy.ifBlank { "Moderate" }
        showInsuranceField = draft.insuranceFee > 0
        showDepositField = draft.depositAmount > 0
        showOutsideRegionFeeField = draft.outsideAccraFee > 0
        configureGeneratedTitleState()
    }

    fun persistCreateDraftIfNeeded() {
        if (!isCreate) return
        val encoded = json.encodeToString(ListingEditorDraftState.serializer(), currentDraft())
        val emptyDraft = emptyListingEditorDraft(currentYear)
        if (currentDraft() == emptyDraft) {
            prefs.edit().remove(createDraftStorageKey).apply()
        } else {
            prefs.edit().putString(createDraftStorageKey, encoded).apply()
        }
    }

    fun clearCreateDraft() {
        prefs.edit().remove(createDraftStorageKey).apply()
    }

    fun removePendingUpload(id: String) {
        pendingUploads.firstOrNull { it.id == id }?.file?.delete()
        pendingUploads = pendingUploads.filterNot { it.id == id }
        editorNotice = if (pendingUploads.isEmpty()) null else "${pendingUploads.size} photo(s) ready."
    }

    fun importPendingUploads(uris: List<Uri>) {
        if (!isCreate || uris.isEmpty()) return
        val remaining = maxPhotos - pendingUploads.size
        if (remaining <= 0) {
            editorError = "Photo limit reached."
            return
        }
        scope.launch {
            val prepared = mutableListOf<PendingListingUpload>()
            val failures = mutableListOf<String>()

            uris.take(remaining).forEachIndexed { index, uri ->
                runCatching {
                    prepareListingImageFile(
                        context = context,
                        uri = uri,
                        prefix = "listing-photo-${System.currentTimeMillis()}-$index",
                        maxBytes = maxPhotoBytes,
                    )
                }.onSuccess { file ->
                    prepared += PendingListingUpload(
                        id = file.absolutePath,
                        name = file.name,
                        filePath = file.absolutePath,
                    )
                }.onFailure {
                    failures += (it.message ?: "Unable to prepare one of the selected images.")
                }
            }

            if (prepared.isNotEmpty()) {
                pendingUploads = (pendingUploads + prepared).take(maxPhotos)
                editorNotice = "${pendingUploads.size} photo(s) ready."
            }
            editorError = failures.firstOrNull()
        }
    }

    val pickPhotos = rememberLauncherForActivityResult(ActivityResultContracts.GetMultipleContents()) { uris ->
        importPendingUploads(uris)
    }
    val pickFiles = rememberLauncherForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
        importPendingUploads(uris)
    }

    LaunchedEffect(Unit) {
        viewModel.loadReferenceData()
        viewModel.loadMyCars()
    }

    LaunchedEffect(existingCar?.id, isCreate, didHydrate) {
        if (didHydrate) return@LaunchedEffect
        if (isCreate) {
            didHydrate = true
            val saved = prefs.getString(createDraftStorageKey, null)
            val restored = saved?.let {
                runCatching { json.decodeFromString(ListingEditorDraftState.serializer(), it) }.getOrNull()
            }
            if (restored != null) {
                applyDraft(restored)
                editorNotice = "Draft restored."
            }
            return@LaunchedEffect
        }

        if (existingCar != null) {
            didHydrate = true
            title = existingCar.title.orEmpty()
            brand = existingCar.brand.orEmpty()
            model = existingCar.model.orEmpty()
            yearInput = ((existingCar.car_year ?: existingCar.year ?: currentYear.toDouble()).roundToInt()).toString()
            dailyPrice = ((existingCar.daily_price ?: 300.0).roundToInt()).toString()
            region = existingCar.region.orEmpty()
            city = existingCar.city.orEmpty()
            carType = existingCar.car_type.orEmpty()
            transmission = normalizeSelectionLabel(existingCar.transmission, "Automatic")
            fuelType = normalizeSelectionLabel(existingCar.fuel_type, "Petrol")
            seats = ((existingCar.seats ?: 5.0).roundToInt()).toString()
            description = existingCar.description.orEmpty()
            instantBook = existingCar.instant_book == true
            deliveryAvailable = existingCar.delivery_available == true
            airConditioning = existingCar.air_conditioning != false
            deliveryFee = ((existingCar.delivery_fee ?: 0.0).roundToInt()).asOptionalFeeText()
            insuranceFee = ((existingCar.insurance_fee ?: 0.0).roundToInt()).asOptionalFeeText()
            depositAmount = ((existingCar.deposit_amount ?: 0.0).roundToInt()).asOptionalFeeText()
            outsideAccraFee = ((existingCar.outside_accra_fee ?: 0.0).roundToInt()).asOptionalFeeText()
            cancellationPolicy = normalizeSelectionLabel(existingCar.cancellation_policy, "Moderate")
            showInsuranceField = insuranceFee.isNotBlank()
            showDepositField = depositAmount.isNotBlank()
            showOutsideRegionFeeField = outsideAccraFee.isNotBlank()
            configureGeneratedTitleState()
        }
    }

    LaunchedEffect(region, strictCityOptions) {
        if (city.isNotBlank() && strictCityOptions.none { it.equals(city, ignoreCase = true) }) {
            city = strictCityOptions.firstOrNull().orEmpty()
        }
    }

    LaunchedEffect(brand, strictModelOptions) {
        if (model.isNotBlank() && strictModelOptions.none { it.equals(model, ignoreCase = true) }) {
            model = ""
        }
    }

    LaunchedEffect(brand, model, yearInput) {
        syncGeneratedTitleIfNeeded()
    }

    LaunchedEffect(deliveryAvailable) {
        if (!deliveryAvailable) {
            deliveryFee = ""
        }
    }

    LaunchedEffect(
        title,
        brand,
        model,
        yearInput,
        dailyPrice,
        region,
        city,
        carType,
        transmission,
        fuelType,
        seats,
        description,
        instantBook,
        deliveryAvailable,
        airConditioning,
        deliveryFee,
        insuranceFee,
        depositAmount,
        outsideAccraFee,
        cancellationPolicy,
    ) {
        persistCreateDraftIfNeeded()
    }

    fun saveListing() {
        val invalidStep = firstInvalidStep()
        if (invalidStep != null) {
            editorError = validationError(invalidStep)
            editorNotice = null
            jumpToStep(invalidStep)
            return
        }

        val parsedYear = yearInput.trim().toIntOrNull()
        val parsedDailyPrice = dailyPrice.trim().toIntOrNull()
        val parsedSeats = seats.trim().toIntOrNull()
        val parsedDeliveryFee = deliveryFee.trim().toIntOrNull() ?: 0
        val parsedInsuranceFee = insuranceFee.trim().toIntOrNull() ?: 0
        val parsedDepositAmount = depositAmount.trim().toIntOrNull() ?: 0
        val parsedOutsideAccraFee = outsideAccraFee.trim().toIntOrNull() ?: 0
        val normalizedCancellation = cancellationPolicy.trim().ifBlank { "Moderate" }

        editorNotice = null
        editorError = null
        isSaving = true

        val payload = buildJsonObject {
            put("title", title.trim())
            put("description", description.trim())
            put("daily_price", parsedDailyPrice!!)
            put("city", city.trim())
            put("region", region.trim())
            put("car_type", carType.trim())
            put("seats", parsedSeats!!)
            put("transmission", transmission.trim().lowercase())
            put("fuel_type", fuelType.trim().lowercase())
            put("brand", brand.trim())
            put("model", model.trim())
            put("car_year", parsedYear)
            put("is_available", true)
            put("instant_book", instantBook)
            put("delivery_available", deliveryAvailable)
            put("air_conditioning", airConditioning)
            put("delivery_fee", if (deliveryAvailable) parsedDeliveryFee else 0)
            put("insurance_fee", parsedInsuranceFee)
            put("deposit_amount", parsedDepositAmount)
            put("outside_accra_fee", parsedOutsideAccraFee)
            put("cancellation_policy", normalizedCancellation.lowercase())
            put("features", buildJsonArray {
                if (airConditioning) add(JsonPrimitive("Air Conditioning"))
                if (instantBook) add(JsonPrimitive("Instant Book"))
                if (deliveryAvailable) add(JsonPrimitive("Delivery Available"))
            })
        }

        if (isCreate) {
            viewModel.submitListing(
                payload = payload,
                pendingPhotoFiles = pendingUploads.map { it.file },
            ) { result: ListingSubmissionResult ->
                isSaving = false
                if (!result.error.isNullOrBlank()) {
                    editorError = result.error
                    return@submitListing
                }
                if (result.uploadFailures.isNotEmpty()) {
                    viewModel.showMessage("Listing created, but some photos failed to upload. Open the listing and add the remaining photos.")
                }
                deletePendingListingUploads(pendingUploads)
                pendingUploads = emptyList()
                clearCreateDraft()
                onBack()
            }
        } else if (!carId.isNullOrBlank() && carId != "new") {
            viewModel.updateCar(
                carId = carId,
                payload = payload,
                onDone = {
                    isSaving = false
                    onBack()
                },
                onError = {
                    isSaving = false
                    editorError = it
                },
            )
        } else {
            isSaving = false
        }
    }

    fun handleBackAction() {
        if (currentStep == HostListingEditorStep.BASIC_INFO) {
            onBack()
        } else {
            jumpToStep(HostListingEditorStep.entries[currentStep.ordinal - 1])
        }
    }

    fun handlePrimaryAction() {
        if (currentStep == HostListingEditorStep.REVIEW) {
            saveListing()
            return
        }

        val error = validationError(currentStep)
        if (error != null) {
            editorError = error
            editorNotice = null
            return
        }

        editorError = null
        editorNotice = null
        jumpToStep(HostListingEditorStep.entries[currentStep.ordinal + 1])
    }

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = {
            Surface(color = colors.cardBackground, tonalElevation = 2.dp) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = colors.brandNavy)
                    }
                    Text(
                        if (isCreate) "Create Listing" else "Edit Listing",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = colors.brandNavy,
                        modifier = Modifier.weight(1f),
                    )
                    if (isCreate) {
                        TextButton(
                            onClick = {
                                persistCreateDraftIfNeeded()
                                editorNotice = "Draft saved on this device."
                                editorError = null
                            },
                            enabled = !isSaving,
                        ) {
                            Text("Save Draft", color = BrandBlue, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        },
        bottomBar = {
            HostListingBottomBar(
                backTitle = if (currentStep == HostListingEditorStep.BASIC_INFO) "Cancel" else "Back",
                primaryTitle = if (currentStep == HostListingEditorStep.REVIEW) {
                    if (isSaving) "Publishing..." else if (isCreate) "Publish Listing" else "Save Listing"
                } else {
                    "Next"
                },
                isPrimaryDisabled = isSaving,
                onBack = ::handleBackAction,
                onPrimary = ::handlePrimaryAction,
            )
        },
    ) { inner ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(inner),
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                HostListingProgressHeader(currentStep = currentStep)
                if (!editorNotice.isNullOrBlank()) {
                    HostListingStatusBanner(text = editorNotice.orEmpty(), color = Success)
                }
                if (!editorError.isNullOrBlank()) {
                    HostListingStatusBanner(text = editorError.orEmpty(), color = Danger)
                }
            }

            AnimatedContent(
                targetState = currentStep,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                transitionSpec = {
                    if (targetState.ordinal > initialState.ordinal) {
                        (slideInHorizontally(animationSpec = tween(240)) { it / 3 } + fadeIn(animationSpec = tween(220))).togetherWith(
                            slideOutHorizontally(animationSpec = tween(180)) { -it / 5 } + fadeOut(animationSpec = tween(180))
                        )
                    } else {
                        (slideInHorizontally(animationSpec = tween(240)) { -it / 3 } + fadeIn(animationSpec = tween(220))).togetherWith(
                            slideOutHorizontally(animationSpec = tween(180)) { it / 5 } + fadeOut(animationSpec = tween(180))
                        )
                    }
                },
                label = "host-listing-step",
            ) { step ->
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    when (step) {
                        HostListingEditorStep.BASIC_INFO -> {
                            HostListingStepIntro(
                                title = "Basic Info",
                                subtitle = "Keep it short, clear, and easy to scan in search results.",
                            )
                            HostListingStepCard {
                                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                                    FieldLabelWithInfo(
                                        label = "Listing title",
                                        helpTitle = "Listing title",
                                        helpMessage = "We auto-generate the default title from the brand, model, and year so listings stay clean and consistent. You can still edit it if you need a custom title.",
                                    )
                                    OutlinedTextField(
                                        value = title,
                                        onValueChange = {
                                            title = it
                                            updateTitleOverrideState(it)
                                        },
                                        modifier = Modifier.fillMaxWidth(),
                                        placeholder = { Text("e.g. Honda Civic 2019") },
                                        shape = RoundedCornerShape(16.dp),
                                    )
                                    Text(
                                        text = if (hasCustomTitleOverride) {
                                            "Custom title active. Clear it to return to the default format: $generatedListingTitlePreview"
                                        } else {
                                            "Default format: $generatedListingTitlePreview"
                                        },
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MutedText,
                                    )
                                    SelectionTextField(
                                        label = "Brand",
                                        value = brand,
                                        options = brandOptions,
                                        onValueChange = { selection ->
                                            brand = selection
                                            val updatedModels = catalog[selection].orEmpty()
                                                .filter { it.isNotBlank() }
                                                .distinct()
                                                .sorted()
                                            if (updatedModels.none { it.equals(model, ignoreCase = true) }) {
                                                model = ""
                                            }
                                        },
                                        allowCustomValue = false,
                                    )
                                    SelectionTextField(
                                        label = "Model",
                                        value = model,
                                        options = modelOptions,
                                        onValueChange = { model = it },
                                        allowCustomValue = false,
                                    )
                                    SelectionTextField(
                                        label = "Year",
                                        value = yearInput,
                                        options = withCurrentOption(yearOptions, yearInput),
                                        onValueChange = { yearInput = it.filter(Char::isDigit).take(4) },
                                        allowCustomValue = false,
                                    )
                                    Text(
                                        text = "Valid range: $minListingYear-$maxListingYear",
                                        style = MaterialTheme.typography.labelLarge,
                                        color = MutedText,
                                    )
                                }
                            }
                        }

                        HostListingEditorStep.VEHICLE_DETAILS -> {
                            HostListingStepIntro(
                                title = "Vehicle Details",
                                subtitle = "Describe the car clearly before guests get to the review screen.",
                            )
                            HostListingStepCard {
                                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                                    SelectionTextField("Car type", carType, typeOptions, { carType = it }, allowCustomValue = false)
                                    SelectionTextField("Transmission", transmission, transmissionOptions, { transmission = it }, allowCustomValue = false)
                                    SelectionTextField("Fuel type", fuelType, fuelOptions, { fuelType = it }, allowCustomValue = false)
                                    HostSeatsStepper(
                                        seats = seats.trim().toIntOrNull()?.coerceIn(2, 8) ?: 5,
                                        onSeatsChange = { seats = it.toString() },
                                    )
                                    OutlinedTextField(
                                        value = description,
                                        onValueChange = { description = it },
                                        label = { Text("Description") },
                                        modifier = Modifier.fillMaxWidth(),
                                        minLines = 4,
                                        maxLines = 8,
                                        shape = RoundedCornerShape(16.dp),
                                    )
                                    Text(
                                        text = "Tell guests about condition, comfort, and what makes pickup easy.",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MutedText,
                                    )
                                }
                            }
                        }

                        HostListingEditorStep.PRICING -> {
                            HostListingStepIntro(
                                title = "Pricing",
                                subtitle = "Set the base day rate first, then reveal extras only when you need them.",
                            )
                            HostListingStepCard {
                                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                                    HostHeroPriceField(
                                        value = dailyPrice,
                                        onValueChange = { dailyPrice = it.filter(Char::isDigit) },
                                        suggestionText = "Suggested: GHS ${pricingSuggestion.first}–${pricingSuggestion.second}/day",
                                    )
                                    Text(
                                        text = "Optional add-ons",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = BrandNavy,
                                    )
                                    if (showInsuranceField || insuranceFee.isNotBlank()) {
                                        OutlinedTextField(
                                            value = insuranceFee,
                                            onValueChange = { insuranceFee = it.filter(Char::isDigit) },
                                            label = { Text("Insurance (per trip)") },
                                            modifier = Modifier.fillMaxWidth(),
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                            shape = RoundedCornerShape(16.dp),
                                        )
                                        SecondaryPillButton(text = "Remove insurance", modifier = Modifier.fillMaxWidth()) {
                                            showInsuranceField = false
                                            insuranceFee = ""
                                        }
                                    } else {
                                        SecondaryPillButton(text = "Add insurance", modifier = Modifier.fillMaxWidth()) {
                                            showInsuranceField = true
                                        }
                                    }

                                    if (showDepositField || depositAmount.isNotBlank()) {
                                        OutlinedTextField(
                                            value = depositAmount,
                                            onValueChange = { depositAmount = it.filter(Char::isDigit) },
                                            label = { Text("Security deposit") },
                                            modifier = Modifier.fillMaxWidth(),
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                            shape = RoundedCornerShape(16.dp),
                                        )
                                        SecondaryPillButton(text = "Remove security deposit", modifier = Modifier.fillMaxWidth()) {
                                            showDepositField = false
                                            depositAmount = ""
                                        }
                                    } else {
                                        SecondaryPillButton(text = "Add security deposit", modifier = Modifier.fillMaxWidth()) {
                                            showDepositField = true
                                        }
                                    }
                                }
                            }
                        }

                        HostListingEditorStep.LOCATION -> {
                            HostListingStepIntro(
                                title = "Location",
                                subtitle = "Search quality improves when the region and city are precise.",
                            )
                            HostListingStepCard {
                                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                                    SelectionTextField(
                                        "Region",
                                        region,
                                        regionOptions,
                                        { selection ->
                                            region = selection
                                            val updatedCities = locations[selection].orEmpty()
                                                .filter { it.isNotBlank() }
                                                .distinct()
                                                .sorted()
                                            if (updatedCities.none { it.equals(city, ignoreCase = true) }) {
                                                city = updatedCities.firstOrNull().orEmpty()
                                            }
                                        },
                                        allowCustomValue = false,
                                    )
                                    SelectionTextField("City", city, cityOptions, { city = it }, allowCustomValue = false)
                                    Text(
                                        text = "Guests use this to find nearby cars, so keep it accurate.",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MutedText,
                                    )
                                }
                            }
                        }

                        HostListingEditorStep.FEATURES_RULES -> {
                            HostListingStepIntro(
                                title = "Features & Rules",
                                subtitle = "Set the booking behavior and any optional trip charges here.",
                            )
                            HostListingStepCard {
                                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                                    HostToggleRow(
                                        label = "Instant Book",
                                        checked = instantBook,
                                        helpTitle = "Instant Book",
                                        helpMessage = "When Instant Book is on, guests can confirm the trip immediately after payment instead of waiting for you to manually approve the request.",
                                    ) { instantBook = it }
                                    HostToggleRow(
                                        label = "Delivery available",
                                        checked = deliveryAvailable,
                                        helpTitle = "Delivery",
                                        helpMessage = "Turn this on if you want guests to choose delivery during checkout. Add a delivery fee only if you charge for bringing the car to them.",
                                    ) { deliveryAvailable = it }
                                    HostToggleRow("Air conditioning", airConditioning) { airConditioning = it }
                                    SelectionTextField(
                                        label = "Cancellation policy",
                                        value = cancellationPolicy,
                                        options = cancellationOptions,
                                        onValueChange = { cancellationPolicy = it },
                                        allowCustomValue = false,
                                    )
                                }
                            }

                            if (deliveryAvailable || deliveryFee.isNotBlank()) {
                                HostListingStepCard {
                                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                        OutlinedTextField(
                                            value = deliveryFee,
                                            onValueChange = { deliveryFee = it.filter(Char::isDigit) },
                                            label = { Text("Delivery fee") },
                                            modifier = Modifier.fillMaxWidth(),
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                            shape = RoundedCornerShape(16.dp),
                                        )
                                        Text(
                                            text = "Only applied when delivery is enabled.",
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MutedText,
                                        )
                                    }
                                }
                            }

                            HostListingStepCard {
                                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    Text(
                                        text = "Extra trip rule",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = BrandNavy,
                                    )
                                    if (showOutsideRegionFeeField || outsideAccraFee.isNotBlank()) {
                                        OutlinedTextField(
                                            value = outsideAccraFee,
                                            onValueChange = { outsideAccraFee = it.filter(Char::isDigit) },
                                            label = { Text("Outside listing region fee") },
                                            modifier = Modifier.fillMaxWidth(),
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                            shape = RoundedCornerShape(16.dp),
                                        )
                                        SecondaryPillButton(text = "Remove outside-region fee", modifier = Modifier.fillMaxWidth()) {
                                            showOutsideRegionFeeField = false
                                            outsideAccraFee = ""
                                        }
                                    } else {
                                        SecondaryPillButton(text = "Add outside listing region fee", modifier = Modifier.fillMaxWidth()) {
                                            showOutsideRegionFeeField = true
                                        }
                                    }
                                }
                            }
                        }

                        HostListingEditorStep.PHOTOS -> {
                            HostListingStepIntro(
                                title = "Photos",
                                subtitle = "The first photo becomes the cover, so lead with your strongest angle.",
                            )
                            HostListingStepCard {
                                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                                    Text(
                                        text = "Upload clear exterior and interior photos. Maximum $maxPhotos photos, up to 4MB each.",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MutedText,
                                    )
                                    if (isCreate) {
                                        if (pendingUploads.isEmpty()) {
                                            Box(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .height(180.dp)
                                                    .background(BrandLight, RoundedCornerShape(20.dp)),
                                                contentAlignment = Alignment.Center,
                                            ) {
                                                Text("No photos selected yet.", color = MutedText)
                                            }
                                        } else {
                                            HostPendingUploadGrid(
                                                uploads = pendingUploads,
                                                onRemove = ::removePendingUpload,
                                                onReorder = { from, to ->
                                                    pendingUploads = pendingUploads.moveItem(from, to)
                                                },
                                            )
                                            Text(
                                                text = "Long-press and drag to reorder. The first photo is the cover.",
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = MutedText,
                                            )
                                        }
                                        SecondaryPillButton(
                                            text = if (pendingUploads.size >= maxPhotos) "Photo limit reached" else "Add from Photos",
                                            modifier = Modifier.fillMaxWidth(),
                                            onClick = { pickPhotos.launch("image/*") },
                                        )
                                        SecondaryPillButton(
                                            text = "Add from Files",
                                            modifier = Modifier.fillMaxWidth(),
                                            onClick = { pickFiles.launch(arrayOf("image/*")) },
                                        )
                                    } else {
                                        if (!existingCoverUrl.isNullOrBlank()) {
                                            AsyncImage(
                                                model = existingCoverUrl,
                                                contentDescription = "Current cover",
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .height(200.dp)
                                                    .clip(RoundedCornerShape(18.dp)),
                                                contentScale = ContentScale.Crop,
                                            )
                                        }
                                        if (!carId.isNullOrBlank() && carId != "new") {
                                            SecondaryPillButton(
                                                text = "Manage listing photos",
                                                modifier = Modifier.fillMaxWidth(),
                                                onClick = { onOpenPhotos(carId) },
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        HostListingEditorStep.REVIEW -> {
                            HostListingStepIntro(
                                title = "Review & Publish",
                                subtitle = "Check the full listing once, then publish with confidence.",
                            )

                            HostListingSummaryCard(
                                title = "Basic info",
                                lines = listOf(
                                    title.ifBlank { "Title pending" },
                                    listOf(brand, model, yearInput).filter { it.isNotBlank() }.joinToString(" • "),
                                ),
                                onEdit = { jumpToStep(HostListingEditorStep.BASIC_INFO) },
                            )
                            HostListingSummaryCard(
                                title = "Vehicle details",
                                lines = listOf(
                                    listOf(carType, transmission, fuelType).filter { it.isNotBlank() }.joinToString(" • "),
                                    "${seats.trim().ifBlank { "5" }} seats",
                                    description.ifBlank { "Description pending" },
                                ),
                                onEdit = { jumpToStep(HostListingEditorStep.VEHICLE_DETAILS) },
                            )
                            HostListingSummaryCard(
                                title = "Pricing",
                                lines = listOf(
                                    "GHS ${dailyPrice.ifBlank { "0" }} / day",
                                    if (insuranceFee.isBlank()) "Insurance not added" else "Insurance: GHS $insuranceFee",
                                    if (depositAmount.isBlank()) "Deposit not added" else "Deposit: GHS $depositAmount",
                                ),
                                onEdit = { jumpToStep(HostListingEditorStep.PRICING) },
                            )
                            HostListingSummaryCard(
                                title = "Location",
                                lines = listOf(
                                    region.ifBlank { "Region pending" },
                                    city.ifBlank { "City pending" },
                                ),
                                onEdit = { jumpToStep(HostListingEditorStep.LOCATION) },
                            )
                            HostListingSummaryCard(
                                title = "Features & rules",
                                lines = listOf(
                                    if (instantBook) "Instant Book enabled" else "Instant Book off",
                                    if (deliveryAvailable) "Delivery enabled" else "Delivery off",
                                    if (airConditioning) "Air conditioning included" else "Air conditioning off",
                                    cancellationPolicy,
                                ),
                                onEdit = { jumpToStep(HostListingEditorStep.FEATURES_RULES) },
                            )
                            HostListingStepCard {
                                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = "Photos",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = BrandNavy,
                                            modifier = Modifier.weight(1f),
                                        )
                                        TextButton(onClick = { jumpToStep(HostListingEditorStep.PHOTOS) }) {
                                            Text("Edit")
                                        }
                                    }
                                    Text(
                                        text = if (isCreate) {
                                            if (pendingUploads.isEmpty()) "No photos added yet" else "${pendingUploads.size} photo(s) ready"
                                        } else {
                                            val currentCount = existingCar?.car_photos?.size ?: 0
                                            if (currentCount == 0) "No photos uploaded yet" else "$currentCount current photo(s)"
                                        },
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MutedText,
                                    )
                                    when {
                                        isCreate && pendingUploads.isNotEmpty() -> {
                                            AsyncImage(
                                                model = pendingUploads.first().previewUri,
                                                contentDescription = "Cover preview",
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .height(180.dp)
                                                    .clip(RoundedCornerShape(18.dp)),
                                                contentScale = ContentScale.Crop,
                                            )
                                        }
                                        !existingCoverUrl.isNullOrBlank() -> {
                                            AsyncImage(
                                                model = existingCoverUrl,
                                                contentDescription = "Current cover",
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .height(180.dp)
                                                    .clip(RoundedCornerShape(18.dp)),
                                                contentScale = ContentScale.Crop,
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (!isCreate && currentStep != HostListingEditorStep.REVIEW && !carId.isNullOrBlank() && carId != "new") {
                        HostListingStepCard {
                            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                Text(
                                    text = "Availability",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = BrandNavy,
                                )
                                Text(
                                    text = "Blocked dates remain in the availability editor after you save changes.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MutedText,
                                )
                                SecondaryPillButton(
                                    text = "Edit blocked dates and weekly blocks",
                                    modifier = Modifier.fillMaxWidth(),
                                    onClick = { onOpenAvailability(carId) },
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(120.dp))
                }
            }
        }
    }
}

@Composable
fun HostBookingsScreen(
    viewModel: AppViewModel,
    onBack: () -> Unit,
    onOpenConversation: (String) -> Unit = {},
) {
    val bookingsState by viewModel.bookingsState.collectAsState()
    val me by viewModel.me.collectAsState()
    val pendingBookingFocus by viewModel.pendingBookingFocus.collectAsState()
    val currentUserId = me?.user?.id.orEmpty()
    val listState = rememberLazyListState()

    LaunchedEffect(Unit) { viewModel.loadBookings() }

    val hostBookings = (bookingsState as? UiState.Success<List<BookingDto>>)
        ?.data
        .orEmpty()
        .filter { isHostBooking(it, currentUserId) }

    LaunchedEffect(pendingBookingFocus, hostBookings) {
        val bookingId = pendingBookingFocus ?: return@LaunchedEffect
        val index = hostBookings.indexOfFirst { it.id == bookingId }
        if (index < 0) return@LaunchedEffect
        listState.animateScrollToItem(index)
        viewModel.consumePendingBookingFocus(bookingId)
    }

    Scaffold(
        topBar = {
            PageTopBar(title = "Host Bookings")
        },
    ) { inner ->
        LazyColumn(
            state = listState,
            modifier = Modifier.fillMaxSize().padding(inner).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            when (val state = bookingsState) {
                UiState.Loading -> item { LoadingBlock("Loading host bookings...") }
                is UiState.Error -> item { ErrorBlock(state.message, onRetry = { viewModel.loadBookings() }) }
                UiState.Empty -> item { EmptyBlock("No host bookings", "Requests will show here when guests book your cars.") }
                is UiState.Success -> {
                    if (hostBookings.isEmpty()) {
                        item { EmptyBlock("No host bookings", "Requests will show here when guests book your cars.") }
                    } else {
                        items(hostBookings, key = { it.id }) { booking ->
                            val canAct = booking.status.equals("awaiting_host", ignoreCase = true) && booking.payment_status.equals("paid", ignoreCase = true)
                            Card(
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                border = BorderStroke(
                                    width = if (pendingBookingFocus == booking.id) 2.dp else 1.dp,
                                    color = if (pendingBookingFocus == booking.id) BrandBlue else Color.Black.copy(alpha = 0.05f),
                                ),
                                elevation = CardDefaults.cardElevation(
                                    defaultElevation = if (pendingBookingFocus == booking.id) 6.dp else 1.dp,
                                ),
                            ) {
                                val displayStatus = resolveBookingDisplayStatus(
                                    status = booking.status,
                                    startDate = booking.start_date,
                                    endDate = booking.end_date,
                                )
                                val helperText = bookingHelperText(
                                    status = displayStatus,
                                    role = BookingDisplayRole.Host,
                                    paymentStatus = booking.payment_status,
                                )
                                val showPaidBadge = shouldShowCompletedPaidBadge(
                                    displayStatus,
                                    booking.payment_status,
                                )
                                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
                                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                            Text(
                                                booking.cars?.title ?: "Hayame listing",
                                                style = MaterialTheme.typography.titleMedium,
                                                color = BrandNavy,
                                                fontWeight = FontWeight.Bold,
                                            )
                                            Text(
                                                text = "Renter: ${booking.renter?.full_name ?: "Guest"}",
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = MutedText,
                                                fontWeight = FontWeight.Medium,
                                            )
                                            Text(
                                                text = helperText,
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MutedText,
                                            )
                                        }
                                        BookingStatusBadgeStack(
                                            status = displayStatus,
                                            showPaidBadge = showPaidBadge,
                                        )
                                    }
                                    InfoLine(label = "Trip", value = "${booking.start_date.orEmpty().ifBlank { "-" }} - ${booking.end_date.orEmpty().ifBlank { "-" }}")
                                    InfoLine(label = "Trip use", value = booking.trip_use_address ?: listOfNotNull(booking.trip_use_city, booking.trip_use_region).joinToString(", ").ifBlank { "Not provided" })
                                    InfoLine(label = "Payment", value = booking.payment_status?.replace("_", " ")?.uppercase() ?: "PENDING")
                                    InfoLine(label = "Total", value = "GHS${(booking.total_price ?: 0.0).roundToInt()}")
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                                        OutlinedButton(
                                            onClick = {
                                                val conversationId = booking.conversation_id
                                                if (!conversationId.isNullOrBlank()) {
                                                    onOpenConversation(conversationId)
                                                } else if (!booking.renter_id.isNullOrBlank()) {
                                                    viewModel.createConversation(
                                                        hostId = currentUserId.ifBlank { booking.cars?.owner_id.orEmpty() }.takeIf { it.isNotBlank() },
                                                        participantId = booking.renter_id,
                                                        carId = booking.car_id,
                                                    ) { created ->
                                                        onOpenConversation(created)
                                                    }
                                                } else {
                                                    viewModel.showMessage("Guest conversation is not available for this booking.")
                                                }
                                            },
                                            modifier = Modifier.weight(1f),
                                        ) {
                                            Text("Message")
                                        }
                                        if (canAct) {
                                            OutlinedButton(onClick = { viewModel.rejectBooking(booking.id, "Rejected by host") }, modifier = Modifier.weight(1f)) {
                                                Text("Reject")
                                            }
                                            Button(onClick = { viewModel.approveBooking(booking.id) }, modifier = Modifier.weight(1f)) {
                                                Text("Approve")
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                UiState.Idle -> item { LoadingBlock("Loading host bookings...") }
            }
        }
    }
}

@Composable
fun HostEarningsScreen(viewModel: AppViewModel, onBack: () -> Unit) {
    val bookingsState by viewModel.bookingsState.collectAsState()
    val me by viewModel.me.collectAsState()
    val currentUserId = me?.user?.id.orEmpty()

    LaunchedEffect(Unit) { viewModel.loadBookings() }

    val hostBookings = (bookingsState as? UiState.Success<List<BookingDto>>)
        ?.data
        .orEmpty()
        .filter { isHostBooking(it, currentUserId) }
    val earningBookings = hostBookings.filter {
        it.status.equals("awaiting_host", ignoreCase = true) ||
            it.status.equals("confirmed", ignoreCase = true) ||
            it.status.equals("completed", ignoreCase = true)
    }
    val totalEarned = earningBookings.sumOf { (it.total_price ?: 0.0).roundToInt() }
    val pendingPayout = hostBookings
        .filter { it.status.equals("awaiting_host", ignoreCase = true) }
        .sumOf { (it.total_price ?: 0.0).roundToInt() }
    val completedTrips = hostBookings.count { it.status.equals("completed", ignoreCase = true) }
    val monthlySeries = remember(hostBookings) { buildHostMonthlySeries(hostBookings) }
    val maxSeriesAmount = monthlySeries.maxOfOrNull { it.amount }?.coerceAtLeast(1) ?: 1
    val colors = LocalHayameColors.current
    val darkMode = colors.pageBackground.luminance() < 0.5f
    val chartGradient = if (darkMode) {
        listOf(colors.brandBlue, Color(0xFF1484D9))
    } else {
        listOf(colors.brandBlue, colors.brandNavy)
    }

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = {
            PageTopBar(title = "Earnings")
        },
    ) { inner ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(inner).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Text("Payouts overview", style = MaterialTheme.typography.headlineSmall, color = colors.brandNavy, fontWeight = FontWeight.ExtraBold)
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                    HostMetricCard(title = "Total earned", value = "GHS$totalEarned", modifier = Modifier.weight(1f))
                    HostMetricCard(title = "Pending", value = "GHS$pendingPayout", modifier = Modifier.weight(1f))
                }
            }
            item {
                Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = colors.cardBackground)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Revenue trend", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                        if (monthlySeries.all { it.amount == 0 }) {
                            EmptyBlock("No payouts yet", "Completed or confirmed bookings will appear as earnings here.")
                        } else {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.Bottom,
                            ) {
                                monthlySeries.forEach { bucket ->
                                    val barHeight = max(20, ((bucket.amount.toFloat() / maxSeriesAmount.toFloat()) * 160f).roundToInt())
                                    Column(
                                        modifier = Modifier.weight(1f),
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.spacedBy(6.dp),
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .height(barHeight.dp)
                                                .fillMaxWidth()
                                                .clip(RoundedCornerShape(10.dp))
                                                .background(
                                                    Brush.verticalGradient(
                                                        colors = chartGradient,
                                                    )
                                                )
                                        )
                                        Text(bucket.month, style = MaterialTheme.typography.labelMedium, color = colors.mutedText)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            item {
                Text("Payout history", style = MaterialTheme.typography.headlineSmall, color = colors.brandNavy, fontWeight = FontWeight.ExtraBold)
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                    HostMetricCard(title = "Completed trips", value = "$completedTrips", modifier = Modifier.weight(1f))
                    HostMetricCard(title = "Tracked months", value = "${monthlySeries.size}", modifier = Modifier.weight(1f))
                }
            }
            items(monthlySeries, key = { it.month }) { bucket ->
                Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = colors.cardBackground)) {
                    Row(modifier = Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(bucket.month, color = colors.brandNavy, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                        Surface(
                            shape = RoundedCornerShape(999.dp),
                            color = if (bucket.isPending) Warning.copy(alpha = 0.14f) else Success.copy(alpha = 0.14f),
                        ) {
                            Text(
                                if (bucket.isPending) "pending" else "paid",
                                color = if (bucket.isPending) Warning else Success,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            )
                        }
                        Text("GHS${bucket.amount}", color = BrandBlue, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun HostReviewsScreen(viewModel: AppViewModel, onBack: () -> Unit) {
    val state by viewModel.hostReviewsListState.collectAsState()
    val colors = LocalHayameColors.current
    LaunchedEffect(Unit) { viewModel.loadHostReviews() }

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = {
            PageTopBar(title = "Host Reviews", onBack = onBack)
        },
    ) { inner ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().background(colors.pageBackground).padding(inner).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            when (val s = state) {
                UiState.Loading -> item { LoadingBlock("Loading reviews...") }
                is UiState.Error -> item { ErrorBlock(s.message, onRetry = { viewModel.loadHostReviews() }) }
                UiState.Empty -> item { EmptyBlock("No reviews yet", "Reviews from completed trips will appear here.") }
                is UiState.Success -> {
                    items(s.data, key = { it.id }) { review ->
                        Card(
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                            border = BorderStroke(1.dp, colors.border),
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text("Rating: ${review.rating ?: 0}", color = colors.brandNavy, fontWeight = FontWeight.Bold)
                                Text(review.comment ?: "No comment", color = colors.mutedText)
                                Text(review.created_at ?: "", style = MaterialTheme.typography.labelSmall, color = colors.mutedText)
                            }
                        }
                    }
                }
                UiState.Idle -> item { LoadingBlock("Loading reviews...") }
            }
        }
    }
}

@Composable
fun GuestProfileScreen(
    viewModel: AppViewModel,
    onBack: () -> Unit,
) {
    val me by viewModel.me.collectAsState()
    val locations by viewModel.locations.collectAsState()
    val context = LocalContext.current
    val colors = LocalHayameColors.current
    val textFieldColors = OutlinedTextFieldDefaults.colors(
        focusedTextColor = colors.brandNavy,
        unfocusedTextColor = colors.brandNavy,
        focusedLabelColor = colors.brandBlue,
        unfocusedLabelColor = colors.mutedText,
        focusedBorderColor = colors.brandBlue,
        unfocusedBorderColor = colors.border,
        cursorColor = colors.brandBlue,
        focusedContainerColor = colors.cardBackground,
        unfocusedContainerColor = colors.cardBackground,
    )
    val userId = me?.user?.id.orEmpty()
    var firstName by rememberSaveable(userId) { mutableStateOf(me.preferredFirstName().orEmpty()) }
    var lastName by rememberSaveable(userId) { mutableStateOf(me.preferredLastName().orEmpty()) }
    var phone by rememberSaveable(userId) { mutableStateOf(me.preferredPhone().orEmpty()) }
    var city by rememberSaveable(userId) { mutableStateOf(me.preferredCity().orEmpty()) }
    var region by rememberSaveable(userId) { mutableStateOf(me.preferredRegion().orEmpty()) }
    var avatarFile by remember { mutableStateOf<File?>(null) }

    LaunchedEffect(Unit) {
        viewModel.loadReferenceData()
    }

    LaunchedEffect(
        userId,
        me.preferredFirstName(),
        me.preferredLastName(),
        me.preferredPhone(),
        me.preferredCity(),
        me.preferredRegion(),
        me.preferredAvatarRaw(),
    ) {
        firstName = me.preferredFirstName().orEmpty()
        lastName = me.preferredLastName().orEmpty()
        phone = me.preferredPhone().orEmpty()
        city = me.preferredCity().orEmpty()
        region = me.preferredRegion().orEmpty()
    }

    val regionOptions = remember(locations, region) {
        val options = locations.keys.filter { it.isNotBlank() }.sorted()
        if (region.isNotBlank() && region !in options) {
            listOf(region) + options
        } else {
            options
        }
    }
    val cityOptions = remember(locations, region, city) {
        val options = if (region.isBlank()) {
            locations.values.flatten()
        } else {
            locations[region].orEmpty()
        }.filter { it.isNotBlank() }.distinct().sorted()
        if (city.isNotBlank() && city !in options) {
            listOf(city) + options
        } else {
            options
        }
    }

    LaunchedEffect(region, cityOptions) {
        if (city.isNotBlank() && city !in cityOptions) {
            city = cityOptions.firstOrNull().orEmpty()
        }
    }

    val pickAvatar = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        val picked = uri ?: return@rememberLauncherForActivityResult
        avatarFile = copyUriToTempFile(context, picked, "avatar")
    }

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = {
            PageTopBar(title = "Edit Profile", onBack = onBack)
        },
    ) { inner ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().background(colors.pageBackground).padding(inner).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                    border = BorderStroke(1.dp, colors.border),
                ) {
                    Column(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        val displayAvatar = avatarFile?.let { Uri.fromFile(it).toString() } ?: resolveAppImage(me.preferredAvatarRaw())
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            RemoteAvatar(
                                imageUrl = displayAvatar,
                                name = me.preferredFullName() ?: me?.user?.email,
                                fallback = "U",
                                size = 96.dp,
                                textStyle = MaterialTheme.typography.headlineMedium,
                            )
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(me.preferredFullName() ?: "Guest User", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                Text(me.preferredEmail() ?: me?.user?.email.orEmpty(), style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
                                Text("Upload a clear headshot (JPG/PNG).", style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
                            }
                        }
                        Row(horizontalArrangement = Arrangement.End, modifier = Modifier.fillMaxWidth()) {
                            OutlinedButton(
                                onClick = { pickAvatar.launch("image/*") },
                                shape = RoundedCornerShape(16.dp),
                                border = BorderStroke(1.dp, colors.brandBlue.copy(alpha = 0.36f)),
                                modifier = Modifier.height(48.dp),
                            ) {
                                Text("Change photo", color = colors.brandBlue, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                    border = BorderStroke(1.dp, colors.border),
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(value = firstName, onValueChange = { firstName = it }, label = { Text("First name") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(16.dp), colors = textFieldColors)
                            OutlinedTextField(value = lastName, onValueChange = { lastName = it }, label = { Text("Last name") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(16.dp), colors = textFieldColors)
                        }
                        OutlinedTextField(value = phone, onValueChange = { phone = it }, label = { Text("Phone") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), colors = textFieldColors)
                        SelectionTextField(
                            label = "Region",
                            value = region,
                            options = regionOptions,
                            onValueChange = { region = it },
                            allowCustomValue = true,
                        )
                        SelectionTextField(
                            label = "City",
                            value = city,
                            options = cityOptions,
                            onValueChange = { city = it },
                            allowCustomValue = true,
                        )
                        GradientPillButton(
                            text = "Save profile",
                            modifier = Modifier.fillMaxWidth(),
                            onClick = {
                                val safeFirst = firstName.trim()
                                val safeLast = lastName.trim()
                                val fullName = listOf(safeFirst, safeLast)
                                    .filter { it.isNotBlank() }
                                    .joinToString(" ")
                                    .ifBlank { me.preferredFullName() ?: me?.user?.email.orEmpty() }
                                if (userId.isNotBlank()) {
                                    viewModel.upsertProfile(
                                        userId = userId,
                                        firstName = safeFirst,
                                        lastName = safeLast,
                                        fullName = fullName,
                                        city = city.trim(),
                                        region = region.trim(),
                                        phone = phone.trim(),
                                        avatarFile = avatarFile,
                                    )
                                }
                            },
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun HostProfileScreen(
    viewModel: AppViewModel,
    onBack: () -> Unit,
    onOpenReviews: () -> Unit = {},
    onOpenFavorites: () -> Unit = {},
    onOpenContact: () -> Unit = {},
    onOpenProtection: () -> Unit = {},
    onOpenCancellation: () -> Unit = {},
    onTurnOffHostMode: () -> Unit = onBack,
) {
    val me by viewModel.me.collectAsState()
    val notificationPreferences by viewModel.notificationPreferences.collectAsState()
    val profile = me?.profile
    val avatarUrl = resolveAppImage(me.preferredAvatarRaw())
    val fullName = me.preferredFullName()?.takeIf { it.isNotBlank() } ?: me?.user?.email ?: "Host"
    val email = me.preferredEmail() ?: me?.user?.email.orEmpty()
    val location = listOfNotNull(me.preferredCity(), me.preferredRegion())
        .filter { it.isNotBlank() }
        .joinToString(", ")
        .ifBlank { "Location not set" }
    val hostLevel = profile?.host_level?.takeIf { !it.isNullOrBlank() } ?: "Verified Host"
    val colors = LocalHayameColors.current

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = {
            PageTopBar(title = "Profile")
        },
    ) { inner ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(inner).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                    border = BorderStroke(1.dp, colors.border),
                ) {
                    Column(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            RemoteAvatar(
                                imageUrl = avatarUrl,
                                name = fullName,
                                fallback = "H",
                                size = 56.dp,
                                textStyle = MaterialTheme.typography.titleMedium,
                            )
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(fullName, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                Text(email, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
                            }
                        }
                        HorizontalDivider(color = colors.border)
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Icon(Icons.Outlined.LocationOn, contentDescription = null, tint = colors.mutedText)
                            Text(location, style = MaterialTheme.typography.bodyMedium, color = colors.brandNavy)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Icon(Icons.Outlined.Shield, contentDescription = null, tint = BrandBlue)
                            Text("Host level: $hostLevel", style = MaterialTheme.typography.bodyMedium, color = BrandBlue, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
            item {
                Text("Notifications", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
            }
            item {
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
            item {
                Text("Host", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
            }
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                    border = BorderStroke(1.dp, colors.border),
                ) {
                    Column(modifier = Modifier.padding(8.dp)) {
                        ActionRow("Guest feedback", Icons.Outlined.FavoriteBorder, onOpenReviews)
                        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = colors.border)
                        ActionRow("Favorites analytics", Icons.Outlined.FavoriteBorder, onOpenFavorites)
                        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = colors.border)
                        ActionRow("Contact", Icons.Outlined.MailOutline, onOpenContact)
                        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = colors.border)
                        ActionRow("Protection", Icons.Outlined.Shield, onOpenProtection)
                        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = colors.border)
                        ActionRow("Cancellation", Icons.Outlined.CalendarMonth, onOpenCancellation)
                    }
                }
            }
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                    border = BorderStroke(1.dp, colors.border),
                ) {
                    Column(modifier = Modifier.padding(8.dp)) {
                        ActionRow("Turn off Host mode", Icons.Outlined.Home, onTurnOffHostMode)
                        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = colors.border)
                        ActionRow("Sign out", Icons.AutoMirrored.Outlined.ExitToApp, onClick = { viewModel.logout() }, color = Danger)
                    }
                }
            }
        }
    }
}

@Composable
fun SupportLegalScreen(
    onBack: () -> Unit,
    onOpenContact: () -> Unit = {},
    onOpenPrivacy: () -> Unit = {},
    onOpenProtection: () -> Unit = {},
    onOpenCancellation: () -> Unit = {},
    onOpenMarketing: () -> Unit = {},
) {
    Scaffold(
        topBar = {
            Row(modifier = Modifier.fillMaxWidth().background(Color.White).padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back") }
                Text("Support & Legal", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 8.dp))
            }
        },
    ) { inner ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(inner).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item {
                Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(8.dp)) {
                        ActionRow("Contact", Icons.Outlined.MailOutline, onOpenContact)
                        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = Color.LightGray.copy(alpha = 0.2f))
                        ActionRow("Privacy", Icons.Outlined.Person, onOpenPrivacy)
                        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = Color.LightGray.copy(alpha = 0.2f))
                        ActionRow("Protection", Icons.Outlined.Shield, onOpenProtection)
                        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = Color.LightGray.copy(alpha = 0.2f))
                        ActionRow("Cancellation", Icons.Outlined.CalendarMonth, onOpenCancellation)
                        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = Color.LightGray.copy(alpha = 0.2f))
                        ActionRow("Marketing pages", Icons.Outlined.Search, onOpenMarketing)
                    }
                }
            }
        }
    }
}

@Composable
private fun HostMetricCard(title: String, value: String, modifier: Modifier = Modifier) {
    val colors = LocalHayameColors.current
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(title, style = MaterialTheme.typography.labelMedium, color = colors.mutedText)
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold, color = colors.brandNavy)
        }
    }
}

@Composable
private fun PageTopBar(title: String, onBack: (() -> Unit)? = null) {
    val colors = LocalHayameColors.current
    Surface(color = colors.cardBackground, tonalElevation = 2.dp) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (onBack != null) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = colors.brandNavy)
                }
                Text(
                    title,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = colors.brandNavy,
                    modifier = Modifier.padding(start = 8.dp),
                )
            } else {
                Text(
                    title,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = colors.brandNavy,
                    modifier = Modifier.padding(horizontal = 8.dp),
                )
            }
        }
    }
}

private data class HostMonthlyBucket(
    val month: String,
    val amount: Int,
    val isPending: Boolean,
)

@Serializable
private data class ListingEditorDraftState(
    val title: String = "",
    val brand: String = "",
    val model: String = "",
    val year: Int = LocalDate.now().year,
    val price: Int = 300,
    val region: String = "",
    val city: String = "",
    val carType: String = "",
    val transmission: String = "Automatic",
    val fuelType: String = "Petrol",
    val seats: Int = 5,
    val description: String = "",
    val instantBook: Boolean = false,
    val deliveryAvailable: Boolean = false,
    val airConditioning: Boolean = true,
    val deliveryFee: Int = 0,
    val insuranceFee: Int = 0,
    val depositAmount: Int = 0,
    val outsideAccraFee: Int = 0,
    val cancellationPolicy: String = "Moderate",
)

private data class PendingListingUpload(
    val id: String,
    val name: String,
    val filePath: String,
) {
    val file: File
        get() = File(filePath)

    val previewUri: String
        get() = Uri.fromFile(file).toString()
}

private fun emptyListingEditorDraft(currentYear: Int): ListingEditorDraftState {
    return ListingEditorDraftState(year = currentYear)
}

private fun Int.asOptionalFeeText(): String {
    return if (this == 0) "" else this.toString()
}

private fun buildGeneratedListingTitle(
    brand: String?,
    model: String?,
    year: Int?,
): String? {
    val normalizedBrand = brand.orEmpty().trim().replace(Regex("\\s+"), " ")
    val normalizedModel = model.orEmpty().trim().replace(Regex("\\s+"), " ")
    val normalizedYear = year?.takeIf { it > 0 }?.toString().orEmpty()
    if (normalizedBrand.isBlank() || normalizedModel.isBlank() || normalizedYear.isBlank()) {
        return null
    }
    return "$normalizedBrand $normalizedModel $normalizedYear"
}

private fun resolveAppImage(raw: String?): String? = RemoteImageUrlResolver.resolve(raw)

@Composable
private fun HostListingThumbnail(imageUrl: String?) {
    Box(
        modifier = Modifier
            .size(width = 92.dp, height = 76.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(BrandLight),
        contentAlignment = Alignment.Center,
    ) {
        if (!imageUrl.isNullOrBlank()) {
            AsyncImage(
                model = imageUrl,
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop,
            )
        } else {
            Icon(
                Icons.Outlined.DirectionsCar,
                contentDescription = null,
                tint = BrandBlue,
                modifier = Modifier.size(22.dp),
            )
        }
    }
}

private fun avatarInitials(value: String?, fallback: String = "U"): String {
    val initials = value
        .orEmpty()
        .trim()
        .split(" ")
        .filter { it.isNotBlank() }
        .take(2)
        .mapNotNull { it.firstOrNull()?.toString() }
        .joinToString("")
        .uppercase()
    return initials.ifBlank { fallback }
}

@Composable
private fun RemoteAvatar(
    imageUrl: String?,
    name: String?,
    fallback: String,
    size: androidx.compose.ui.unit.Dp,
    textStyle: androidx.compose.ui.text.TextStyle,
    modifier: Modifier = Modifier,
    borderColor: Color? = null,
) {
    val initials = avatarInitials(name, fallback)
    val avatarModifier = modifier
        .size(size)
        .clip(CircleShape)
        .then(
            if (borderColor != null) Modifier.border(1.dp, borderColor, CircleShape) else Modifier
        )

    if (imageUrl.isNullOrBlank()) {
        AvatarFallback(initials = initials, textStyle = textStyle, modifier = avatarModifier)
        return
    }

    SubcomposeAsyncImage(
        model = imageUrl,
        contentDescription = name,
        modifier = avatarModifier,
        contentScale = ContentScale.Crop,
        loading = {
            AvatarFallback(initials = initials, textStyle = textStyle, modifier = Modifier.fillMaxSize())
        },
        error = {
            AvatarFallback(initials = initials, textStyle = textStyle, modifier = Modifier.fillMaxSize())
        },
    )
}

@Composable
private fun AvatarFallback(
    initials: String,
    textStyle: androidx.compose.ui.text.TextStyle,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier.background(BrandLight, CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = initials,
            style = textStyle,
            fontWeight = FontWeight.Bold,
            color = BrandNavy,
        )
    }
}

private fun withCurrentOption(options: List<String>, current: String): List<String> {
    return buildList {
        val trimmedCurrent = current.trim()
        if (trimmedCurrent.isNotEmpty()) {
            add(trimmedCurrent)
        }
        addAll(options)
    }.distinct()
}

private fun normalizeSelectionLabel(value: String?, fallback: String): String {
    val normalized = value?.trim().orEmpty()
    if (normalized.isBlank()) return fallback
    return normalized
        .replace("_", " ")
        .lowercase()
        .split(" ")
        .filter { it.isNotBlank() }
        .joinToString(" ") { token ->
            token.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
        }
        .ifBlank { fallback }
}

private fun deletePendingListingUploads(uploads: List<PendingListingUpload>) {
    uploads.forEach { upload ->
        runCatching { upload.file.delete() }
    }
}

private suspend fun prepareListingImageFile(
    context: Context,
    uri: Uri,
    prefix: String,
    maxBytes: Int,
): File = withContext(Dispatchers.IO) {
    val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
        ?: throw IllegalStateException("Unable to read selected image.")
    val extension = context.contentResolver.getType(uri)?.substringAfter('/')?.lowercase()
        ?.takeIf { it.isNotBlank() }
        ?: "jpg"

    if (bytes.size <= maxBytes) {
        val temp = File.createTempFile(prefix, ".$extension", context.cacheDir)
        temp.writeBytes(bytes)
        return@withContext temp
    }

    val decoded = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
        ?: throw IllegalStateException("Unable to prepare selected image.")
    var workingBitmap = decoded
    var quality = 92
    var encoded = ByteArrayOutputStream()
    workingBitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, quality, encoded)

    while (encoded.size() > maxBytes && quality > 55) {
        encoded.reset()
        quality -= 8
        workingBitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, quality, encoded)
    }

    while (encoded.size() > maxBytes && maxOf(workingBitmap.width, workingBitmap.height) > 1600) {
        val scaled = android.graphics.Bitmap.createScaledBitmap(
            workingBitmap,
            (workingBitmap.width * 0.85f).toInt().coerceAtLeast(1),
            (workingBitmap.height * 0.85f).toInt().coerceAtLeast(1),
            true,
        )
        if (workingBitmap !== decoded) {
            workingBitmap.recycle()
        }
        workingBitmap = scaled
        encoded = ByteArrayOutputStream()
        workingBitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, quality, encoded)
    }

    if (encoded.size() > maxBytes) {
        if (workingBitmap !== decoded) {
            workingBitmap.recycle()
        }
        decoded.recycle()
        throw IllegalStateException("Selected image is still larger than 4MB after compression.")
    }

    val temp = File.createTempFile(prefix, ".jpg", context.cacheDir)
    temp.writeBytes(encoded.toByteArray())

    if (workingBitmap !== decoded) {
        workingBitmap.recycle()
    }
    decoded.recycle()
    temp
}

private fun isHostBooking(booking: BookingDto, currentUserId: String): Boolean {
    return booking.role.orEmpty().contains("owner", ignoreCase = true) ||
        (!currentUserId.isBlank() && booking.cars?.owner_id == currentUserId)
}

private fun bookingMonthKey(raw: String?): String? {
    val parsed = parseApiLocalDate(raw) ?: return null
    return parsed.format(DateTimeFormatter.ofPattern("yyyy-MM"))
}

private fun parseApiLocalDate(raw: String?): LocalDate? {
    val value = raw?.trim().orEmpty()
    if (value.isBlank()) return null
    return runCatching { LocalDate.parse(value.take(10)) }.getOrNull()
}

private fun buildHostMonthlySeries(bookings: List<BookingDto>): List<HostMonthlyBucket> {
    val formatter = DateTimeFormatter.ofPattern("MMM")
    val now = LocalDate.now().withDayOfMonth(1)
    return (0..5).map { offset ->
        val month = now.minusMonths((5 - offset).toLong())
        val monthKey = month.format(DateTimeFormatter.ofPattern("yyyy-MM"))
        val monthlyBookings = bookings.filter { bookingMonthKey(it.created_at) == monthKey }
        HostMonthlyBucket(
            month = month.format(formatter),
            amount = monthlyBookings
                .filter {
                    it.status.equals("awaiting_host", ignoreCase = true) ||
                        it.status.equals("confirmed", ignoreCase = true) ||
                        it.status.equals("completed", ignoreCase = true)
                }
                .sumOf { (it.total_price ?: 0.0).roundToInt() },
            isPending = monthlyBookings.any { it.status.equals("awaiting_host", ignoreCase = true) },
        )
    }
}

@Composable
private fun HostQuickActionCard(
    title: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit,
) {
    val colors = LocalHayameColors.current
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 18.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(colors.brandLight),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(28.dp))
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(title, style = MaterialTheme.typography.headlineMedium, color = colors.brandNavy, fontWeight = FontWeight.Bold)
                Text(subtitle, style = MaterialTheme.typography.titleLarge, color = colors.mutedText, fontWeight = FontWeight.Medium)
            }
            Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = colors.mutedText.copy(alpha = 0.7f), modifier = Modifier.size(28.dp))
        }
    }
}

@Composable
private fun HostToggleRow(
    label: String,
    checked: Boolean,
    helpTitle: String? = null,
    helpMessage: String? = null,
    onCheckedChange: (Boolean) -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        FieldLabelWithInfo(
            label = label,
            helpTitle = helpTitle,
            helpMessage = helpMessage,
            modifier = Modifier.weight(1f),
        )
        Switch(checked = checked, onCheckedChange = onCheckedChange)
    }
}

@Composable
private fun FieldLabelWithInfo(
    label: String,
    helpTitle: String? = null,
    helpMessage: String? = null,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(
            label,
            color = BrandNavy,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Bold,
        )
        if (!helpTitle.isNullOrBlank() && !helpMessage.isNullOrBlank()) {
            InlineInfoButton(title = helpTitle, message = helpMessage)
        }
    }
}

private enum class HostListingEditorStep(val title: String, val shortTitle: String) {
    BASIC_INFO("Basic Info", "Info"),
    VEHICLE_DETAILS("Vehicle Details", "Details"),
    PRICING("Pricing", "Pricing"),
    LOCATION("Location", "Place"),
    FEATURES_RULES("Features & Rules", "Rules"),
    PHOTOS("Photos", "Photos"),
    REVIEW("Review & Publish", "Review"),
}

private fun suggestedListingPricing(carType: String, year: Int): Pair<Int, Int> {
    val base = when (carType.trim().lowercase()) {
        "luxury" -> 520
        "van" -> 360
        "pickup" -> 340
        "suv" -> 310
        "coupe" -> 290
        "hatchback" -> 220
        else -> 250
    }
    val lower = max(120, base + ((year - 2018) * 8))
    return lower to (lower + 70)
}

private fun <T> List<T>.moveItem(fromIndex: Int, toIndex: Int): List<T> {
    if (fromIndex == toIndex || fromIndex !in indices || toIndex !in indices) return this
    val mutable = toMutableList()
    val moved = mutable.removeAt(fromIndex)
    mutable.add(toIndex, moved)
    return mutable.toList()
}

private fun calculatePhotoReorderTarget(fromIndex: Int, dragOffset: Offset, totalCount: Int): Int {
    var targetIndex = fromIndex
    if (dragOffset.x > 72f) targetIndex += 1
    if (dragOffset.x < -72f) targetIndex -= 1
    if (dragOffset.y > 92f) targetIndex += 2
    if (dragOffset.y < -92f) targetIndex -= 2
    return targetIndex.coerceIn(0, max(totalCount - 1, 0))
}

@Composable
private fun HostListingProgressHeader(currentStep: HostListingEditorStep) {
    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text(
                text = "Step ${currentStep.ordinal + 1} of ${HostListingEditorStep.entries.size}",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold,
                color = BrandBlue,
            )
            Text(
                text = currentStep.title,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.ExtraBold,
                color = BrandNavy,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HostListingEditorStep.entries.forEach { step ->
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp),
                            color = if (step.ordinal <= currentStep.ordinal) BrandBlue else Color.White,
                            shape = RoundedCornerShape(999.dp),
                            border = BorderStroke(
                                1.dp,
                                if (step.ordinal <= currentStep.ordinal) BrandBlue else Color.Black.copy(alpha = 0.08f),
                            ),
                        ) {}
                        Text(
                            text = step.shortTitle,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (step == currentStep) BrandBlue else MutedText,
                            modifier = Modifier.fillMaxWidth(),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            textAlign = TextAlign.Center,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun HostListingStatusBanner(text: String, color: Color) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = color.copy(alpha = 0.08f),
        shape = RoundedCornerShape(18.dp),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(10.dp)
                    .background(color, CircleShape),
            )
            Text(text = text, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = color)
        }
    }
}

@Composable
private fun HostListingStepIntro(title: String, subtitle: String) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(text = title, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold, color = BrandNavy)
        Text(text = subtitle, style = MaterialTheme.typography.bodyMedium, color = MutedText)
    }
}

@Composable
private fun HostListingStepCard(content: @Composable ColumnScope.() -> Unit) {
    Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            content = content,
        )
    }
}

@Composable
private fun HostHeroPriceField(value: String, onValueChange: (String) -> Unit, suggestionText: String) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(text = "Daily price", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = BrandNavy)
        Surface(
            color = BrandLight,
            shape = RoundedCornerShape(22.dp),
            border = BorderStroke(1.dp, BrandBlue.copy(alpha = 0.14f)),
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 18.dp, vertical = 18.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text("GHS", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = BrandBlue)
                OutlinedTextField(
                    value = value,
                    onValueChange = { onValueChange(it.filter(Char::isDigit)) },
                    modifier = Modifier.weight(1f),
                    textStyle = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.ExtraBold, color = BrandNavy),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    shape = RoundedCornerShape(16.dp),
                )
                Text("/ day", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = MutedText)
            }
        }
        Text(text = suggestionText, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = BrandBlue)
        Text(
            text = "This is the main number guests notice first, so keep it competitive and easy to justify.",
            style = MaterialTheme.typography.bodyMedium,
            color = MutedText,
        )
    }
}

@Composable
private fun HostSeatsStepper(seats: Int, onSeatsChange: (Int) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(text = "Seats", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = BrandNavy)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFFF7F9FC), RoundedCornerShape(16.dp))
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            SecondaryPillButton(text = "-", modifier = Modifier.widthIn(min = 56.dp)) {
                onSeatsChange(max(2, seats - 1))
            }
            Text(
                text = "$seats seats",
                modifier = Modifier.weight(1f),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.ExtraBold,
                color = BrandBlue,
                textAlign = TextAlign.Center,
            )
            SecondaryPillButton(text = "+", modifier = Modifier.widthIn(min = 56.dp)) {
                onSeatsChange(min(8, seats + 1))
            }
        }
    }
}

@Composable
private fun HostListingBottomBar(
    backTitle: String,
    primaryTitle: String,
    isPrimaryDisabled: Boolean,
    onBack: () -> Unit,
    onPrimary: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val darkMode = colors.pageBackground.luminance() < 0.5f
    val primaryGradient = if (darkMode) {
        listOf(colors.brandBlue, Color(0xFF1484D9))
    } else {
        listOf(colors.brandBlue, colors.brandNavy)
    }
    Surface(color = colors.cardBackground.copy(alpha = 0.96f), tonalElevation = 6.dp) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp)
                .navigationBarsPadding(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            SecondaryPillButton(text = backTitle, modifier = Modifier.widthIn(min = 110.dp), onClick = onBack)
            Button(
                onClick = onPrimary,
                modifier = Modifier.weight(1f),
                enabled = !isPrimaryDisabled,
                shape = RoundedCornerShape(18.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                contentPadding = PaddingValues(),
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = Brush.horizontalGradient(colors = primaryGradient),
                            shape = RoundedCornerShape(18.dp),
                        )
                        .padding(vertical = 16.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(primaryTitle, color = Color.White, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun HostListingSummaryCard(title: String, lines: List<String>, onEdit: () -> Unit) {
    HostListingStepCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(text = title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = BrandNavy, modifier = Modifier.weight(1f))
            TextButton(onClick = onEdit) {
                Text("Edit")
            }
        }
        lines.filter { it.isNotBlank() }.forEach { line ->
            Text(text = line, style = MaterialTheme.typography.bodyMedium, color = MutedText)
        }
    }
}

@Composable
private fun HostPendingUploadGrid(
    uploads: List<PendingListingUpload>,
    onRemove: (String) -> Unit,
    onReorder: (Int, Int) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        uploads.chunked(2).forEachIndexed { rowIndex, row ->
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                row.forEachIndexed { columnIndex, upload ->
                    val index = rowIndex * 2 + columnIndex
                    var dragOffset by remember(upload.id) { mutableStateOf(Offset.Zero) }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(148.dp)
                            .offset { IntOffset(dragOffset.x.roundToInt(), dragOffset.y.roundToInt()) }
                            .zIndex(if (dragOffset != Offset.Zero) 1f else 0f)
                            .clip(RoundedCornerShape(18.dp))
                            .background(BrandLight)
                            .pointerInput(upload.id, uploads.size) {
                                detectDragGesturesAfterLongPress(
                                    onDrag = { change, amount ->
                                        change.consume()
                                        dragOffset += amount
                                    },
                                    onDragEnd = {
                                        val target = calculatePhotoReorderTarget(index, dragOffset, uploads.size)
                                        if (target != index) {
                                            onReorder(index, target)
                                        }
                                        dragOffset = Offset.Zero
                                    },
                                    onDragCancel = {
                                        dragOffset = Offset.Zero
                                    },
                                )
                            },
                    ) {
                        AsyncImage(
                            model = upload.previewUri,
                            contentDescription = upload.name,
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop,
                        )
                        Text(
                            text = if (index == 0) "Cover" else "Drag",
                            modifier = Modifier
                                .align(Alignment.BottomStart)
                                .padding(10.dp)
                                .background(if (index == 0) BrandBlue else Color.Black.copy(alpha = 0.58f), RoundedCornerShape(999.dp))
                                .padding(horizontal = 10.dp, vertical = 6.dp),
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                        )
                        IconButton(
                            onClick = { onRemove(upload.id) },
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .padding(6.dp)
                                .size(30.dp)
                                .background(Color.White.copy(alpha = 0.92f), CircleShape),
                        ) {
                            Icon(Icons.Outlined.Close, contentDescription = "Remove photo", tint = Danger)
                        }
                    }
                }
                if (row.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun SelectionTextField(
    label: String,
    value: String,
    options: List<String>,
    onValueChange: (String) -> Unit,
    allowCustomValue: Boolean,
    modifier: Modifier = Modifier,
) {
    var expanded by remember(value, options) { mutableStateOf(false) }
    val colors = LocalHayameColors.current

    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        OutlinedTextField(
            value = value,
            onValueChange = {
                if (allowCustomValue) {
                    onValueChange(it)
                }
            },
            modifier = Modifier.fillMaxWidth(),
            label = { Text(label) },
            readOnly = !allowCustomValue,
            trailingIcon = {
                if (options.isNotEmpty()) {
                    IconButton(onClick = { expanded = !expanded }) {
                        Icon(Icons.Outlined.ExpandMore, contentDescription = "Options", tint = colors.brandBlue)
                    }
                }
            },
            shape = RoundedCornerShape(16.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = colors.brandNavy,
                unfocusedTextColor = colors.brandNavy,
                focusedLabelColor = colors.brandBlue,
                unfocusedLabelColor = colors.mutedText,
                focusedBorderColor = colors.brandBlue,
                unfocusedBorderColor = colors.border,
                cursorColor = colors.brandBlue,
                focusedContainerColor = colors.cardBackground,
                unfocusedContainerColor = colors.cardBackground,
            ),
        )
        if (options.isNotEmpty()) {
            DropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false },
                containerColor = colors.cardBackground,
            ) {
                options.forEach { option ->
                    DropdownMenuItem(
                        text = { Text(option, color = colors.brandNavy) },
                        onClick = {
                            onValueChange(option)
                            expanded = false
                        },
                    )
                }
            }
        }
    }
}

private fun openExternalUrl(context: Context, url: String) {
    runCatching {
        val heightPx = (context.resources.displayMetrics.heightPixels * 0.82f).toInt()
        CustomTabsIntent.Builder()
            .setShowTitle(true)
            .setShareState(CustomTabsIntent.SHARE_STATE_OFF)
            .setBookmarksButtonEnabled(false)
            .setDownloadButtonEnabled(false)
            .setCloseButtonPosition(CustomTabsIntent.CLOSE_BUTTON_POSITION_END)
            .setToolbarCornerRadiusDp(24)
            .setInitialActivityHeightPx(heightPx, CustomTabsIntent.ACTIVITY_HEIGHT_ADJUSTABLE)
            .setBackgroundInteractionEnabled(false)
            .build()
            .launchUrl(context, Uri.parse(url))
    }.onFailure {
        runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) }
    }
}

private fun copyUriToTempFile(context: Context, uri: Uri, prefix: String): File? {
    return runCatching {
        val extension = context.contentResolver.getType(uri)?.substringAfter('/') ?: "jpg"
        val temp = File.createTempFile(prefix, "." + extension, context.cacheDir)
        context.contentResolver.openInputStream(uri).use { input -> temp.outputStream().use { output -> input?.copyTo(output) } }
        temp
    }.getOrNull()
}

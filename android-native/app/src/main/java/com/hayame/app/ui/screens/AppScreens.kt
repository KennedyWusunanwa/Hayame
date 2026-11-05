package com.hayame.app.ui.screens

import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.asPaddingValues
import com.hayame.app.ui.components.HayameRefreshBox
import com.hayame.app.ui.components.coachTarget
import com.hayame.app.ui.components.CoachTour
import com.hayame.app.ui.components.CoachStep
import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.hardware.biometrics.BiometricPrompt
import android.net.Uri
import android.os.Build
import android.os.CancellationSignal
import androidx.activity.compose.BackHandler
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
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
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
import androidx.compose.foundation.layout.heightIn
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
import androidx.compose.foundation.text.BasicTextField
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
import androidx.compose.material.icons.outlined.BarChart
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.ChatBubble
import androidx.compose.material.icons.outlined.Close
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.runtime.derivedStateOf
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.People
import androidx.compose.material.icons.outlined.LocalGasStation
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.AcUnit
import androidx.compose.material.icons.outlined.LocalShipping
import androidx.compose.material.icons.outlined.Verified
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.outlined.Bolt
import androidx.compose.material.icons.outlined.Place
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material.icons.outlined.DirectionsCar
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.LightMode
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.MailOutline
import androidx.compose.material.icons.outlined.MyLocation
import androidx.compose.material.icons.outlined.MoreHoriz
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.PhoneIphone
import androidx.compose.material.icons.outlined.Public
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Share
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
import androidx.compose.material3.rememberModalBottomSheetState
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
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
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
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.hayame.app.core.analytics.AnalyticsService
import androidx.compose.ui.zIndex
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.core.view.WindowCompat
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
import com.hayame.app.core.network.preferredRole
import com.hayame.app.core.network.isAdmin
import com.hayame.app.ui.components.BookingPlaceholderCard
import com.hayame.app.ui.components.ConversationPlaceholderRow
import com.hayame.app.ui.components.EmptyBlock
import com.hayame.app.ui.components.ErrorBlock
import com.hayame.app.ui.components.ExploreListRowPlaceholder
import com.hayame.app.ui.components.HayameShimmerBlock
import com.hayame.app.ui.components.HostListingPlaceholderRow
import com.hayame.app.ui.components.LoadingBlock
import com.hayame.app.ui.components.RemoteImageUrlResolver
import com.hayame.app.ui.components.SectionHeader
import com.hayame.app.ui.navigation.HostMainTab
import com.hayame.app.ui.navigation.MainTab
import com.hayame.app.ui.navigation.NavRoutes
import com.hayame.app.ui.reference.AndroidReferenceData
import com.hayame.app.ui.state.UiState
import com.hayame.app.ui.theme.Danger
import com.hayame.app.ui.theme.LocalDarkMode
import com.hayame.app.ui.theme.LocalHayameColors
import com.hayame.app.ui.theme.ManropeFamily
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
import kotlin.math.PI
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sin

@Composable
fun LoginScreen(
    viewModel: AppViewModel,
    onSignup: () -> Unit,
    onContinueAsGuest: () -> Unit = {},
) {
    val context = LocalContext.current
    val colors = LocalHayameColors.current
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var passwordVisible by rememberSaveable { mutableStateOf(false) }
    var saveLoginWithBiometrics by rememberSaveable { mutableStateOf(true) }
    var hasBiometricCredentials by remember { mutableStateOf(hasStoredBiometricCredentials(context)) }
    var loginErrorMessage by rememberSaveable { mutableStateOf<String?>(null) }
    val biometricsAvailable = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
    val bootstrapping by viewModel.bootstrapping.collectAsState()
    val activeLoginErrorMessage = loginErrorMessage

    if (activeLoginErrorMessage != null) {
        AlertDialog(
            onDismissRequest = { loginErrorMessage = null },
            title = { Text("Unable to log in") },
            text = { Text(activeLoginErrorMessage) },
            confirmButton = {
                TextButton(onClick = { loginErrorMessage = null }) {
                    Text("OK")
                }
            },
        )
    }

    AuthScaffold(
        title = "Welcome back.",
        subtitle = "Log in to continue",
        selectedTab = AuthTab.LOGIN,
        onTabChange = { if (it == AuthTab.SIGNUP) onSignup() },
        onContinueAsGuest = null,
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
            viewModel.login(
                email = email,
                password = password,
                onSuccess = {
                    if (saveLoginWithBiometrics && biometricsAvailable) {
                        saveBiometricCredentials(context, email, password)
                        hasBiometricCredentials = true
                    }
                },
                onFailure = { loginErrorMessage = it },
            )
        }

        OutlinedButton(
            onClick = onContinueAsGuest,
            modifier = Modifier.fillMaxWidth().height(48.dp),
            shape = RoundedCornerShape(99.dp),
            border = BorderStroke(1.5.dp, colors.border),
            colors = ButtonDefaults.outlinedButtonColors(containerColor = colors.cardBackground),
        ) {
            Text("Continue as guest", color = colors.brandNavy, fontWeight = FontWeight.Medium)
        }

        if (biometricsAvailable) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(colors.pageBackground, RoundedCornerShape(14.dp))
                    .border(1.dp, colors.border, RoundedCornerShape(14.dp))
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
                        color = colors.brandNavy,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp,
                    )
                    Text(
                        "Use it for quick login after signing out.",
                        color = colors.mutedText,
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
                        viewModel.login(
                            email = savedEmail,
                            password = savedPassword,
                            onFailure = { loginErrorMessage = it },
                        )
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
            Text("Forgot password?", color = colors.brandBlue, fontWeight = FontWeight.SemiBold)
        }

        if (email.isNotBlank()) {
            TextButton(
                onClick = { viewModel.resendConfirmation(email) },
                modifier = Modifier.align(Alignment.CenterHorizontally),
            ) {
                Text("Resend verification email", color = colors.brandBlue, fontWeight = FontWeight.SemiBold)
            }
        }

        Row(
            modifier = Modifier.align(Alignment.CenterHorizontally),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("No account?", color = colors.mutedText, fontSize = 13.sp)
            TextButton(onClick = onSignup, contentPadding = PaddingValues(0.dp)) {
                Text("Sign up", color = colors.brandBlue, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
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
    val colors = LocalHayameColors.current
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
            AuthSelectField("Region", region, AndroidReferenceData.regions, { selection ->
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
            Text("Already registered?", color = colors.mutedText, fontSize = 13.sp)
            TextButton(onClick = onBackToLogin, contentPadding = PaddingValues(0.dp)) {
                Text("Log in", color = colors.brandBlue, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
            }
        }

        Spacer(modifier = Modifier.height(8.dp))
        OutlinedButton(
            onClick = { viewModel.continueAsGuest() },
            modifier = Modifier.fillMaxWidth().height(48.dp),
            shape = RoundedCornerShape(99.dp),
            border = BorderStroke(1.5.dp, colors.border),
            colors = ButtonDefaults.outlinedButtonColors(containerColor = colors.cardBackground),
        ) {
            Text("Continue as guest", color = colors.brandNavy, fontWeight = FontWeight.Medium)
        }
        },
    )
}

private fun authCitiesFor(region: String, preferred: String): List<String> {
    return AndroidReferenceData.citiesFor(region, preferred)
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

@SuppressLint("NewApi")
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
    onSelectedTabChanged: (MainTab) -> Unit = {},
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
    onOpenAdmin: () -> Unit = {},
    onOpenSettings: (highlightAppearance: Boolean) -> Unit = {},
    onOpenProfileOverview: () -> Unit = {},
    onResumeCheckout: (ResumableCheckoutUi) -> Unit = {},
) {
    var tab by rememberSaveable { mutableStateOf(initialTab) }
    var homeSearchToken by rememberSaveable { mutableStateOf(0) }
    var homeSearchQuery by rememberSaveable { mutableStateOf("") }
    var homeSearchCarType by rememberSaveable { mutableStateOf("") }
    var homeSearchRegion by rememberSaveable { mutableStateOf("") }
    var homeSearchCity by rememberSaveable { mutableStateOf("") }
    var homeSearchBrand by rememberSaveable { mutableStateOf("") }
    var homeSearchModel by rememberSaveable { mutableStateOf("") }
    var homeSearchMinPrice by rememberSaveable { mutableStateOf(50) }
    var homeSearchMaxPrice by rememberSaveable { mutableStateOf(8000f) }
    var homeSearchInstantOnly by rememberSaveable { mutableStateOf(false) }
    var homeSearchTransmission by rememberSaveable { mutableStateOf("") }
    var homeSearchFuel by rememberSaveable { mutableStateOf("") }
    var homeSearchDeliveryOnly by rememberSaveable { mutableStateOf(false) }
    var homeSearchAcOnly by rememberSaveable { mutableStateOf(false) }
    val tabs = remember { MainTab.entries }
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val conversationsState by viewModel.conversationsState.collectAsState()
    val focusManager = LocalFocusManager.current
    val colors = LocalHayameColors.current
    val unreadCount = (conversationsState as? UiState.Success<List<com.hayame.app.core.network.ConversationDto>>)
        ?.data
        ?.sumOf { it.unread_count ?: 0 }
        ?: 0

    // Only a new route tab moves the shell. Coming back from a pushed screen
    // (Dashboard, Settings, a car) re-enters this composable, and must keep the
    // tab the user was on instead of jumping to the route's start tab.
    var appliedInitialTab by rememberSaveable { mutableStateOf(initialTab) }
    LaunchedEffect(initialTab) {
        if (initialTab != appliedInitialTab) {
            appliedInitialTab = initialTab
            tab = initialTab
        }
    }

    LaunchedEffect(tab) {
        onSelectedTabChanged(tab)
    }

    // Back (or the edge swipe) from another tab returns to Home before leaving the app.
    BackHandler(enabled = tab != MainTab.HOME) { tab = MainTab.HOME }

    val pendingMainTab by viewModel.pendingMainTab.collectAsState()
    LaunchedEffect(pendingMainTab) {
        val requested = pendingMainTab ?: return@LaunchedEffect
        tab = requested
        viewModel.consumePendingMainTab(requested)
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
                        badgeCount = if (item == MainTab.MORE) unreadCount else 0,
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
                    onResumeCheckout = onResumeCheckout,
                    onApplySearchToExplore = { search, carType, region, city, brand, model, minPrice, maxPrice, instantOnly, transmission, fuel, deliveryOnly, acOnly ->
                        homeSearchQuery = search
                        homeSearchCarType = carType
                        homeSearchRegion = region
                        homeSearchCity = city
                        homeSearchBrand = brand
                        homeSearchModel = model
                        homeSearchMinPrice = minPrice
                        homeSearchMaxPrice = maxPrice
                        homeSearchInstantOnly = instantOnly
                        homeSearchTransmission = transmission
                        homeSearchFuel = fuel
                        homeSearchDeliveryOnly = deliveryOnly
                        homeSearchAcOnly = acOnly
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
                    homeSearchBrand = homeSearchBrand,
                    homeSearchModel = homeSearchModel,
                    homeSearchMinPrice = homeSearchMinPrice,
                    homeSearchMaxPrice = homeSearchMaxPrice,
                    homeSearchInstantOnly = homeSearchInstantOnly,
                    homeSearchTransmission = homeSearchTransmission,
                    homeSearchFuel = homeSearchFuel,
                    homeSearchDeliveryOnly = homeSearchDeliveryOnly,
                    homeSearchAcOnly = homeSearchAcOnly,
                )
                MainTab.TRIPS -> TripsTab(
                    viewModel = viewModel,
                    paddingValues = innerPadding,
                    onOpenHostVehicles = onOpenHostVehicles,
                    onOpenCarDetail = onOpenCarDetail,
                    onOpenConversation = onOpenConversation,
                    onResumeCheckout = onResumeCheckout,
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
                    onOpenAdmin = onOpenAdmin,
                    onOpenSaved = { tab = MainTab.SAVED },
                    onOpenAuth = onOpenAuth,
                    onOpenSettings = onOpenSettings,
                    onOpenProfileOverview = onOpenProfileOverview,
                )
            }
        }
    }
}

@Composable
fun HostShell(
    viewModel: AppViewModel,
    onSelectedTabChanged: (HostMainTab) -> Unit = {},
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
    onOpenSettings: () -> Unit = {},
    onEditProfile: () -> Unit = {},
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

    LaunchedEffect(tab) {
        onSelectedTabChanged(tab)
    }

    // Back returns to the host Home tab first, then leaves host mode the same
    // way the host-mode switch does.
    BackHandler {
        if (tab != HostMainTab.DASHBOARD) tab = HostMainTab.DASHBOARD else onExitHostMode()
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
                        onOpenCreateCar = { onOpenCarEditor(null) },
                        onOpenBookings = { tab = HostMainTab.BOOKINGS },
                        onOpenEarnings = { tab = HostMainTab.EARNINGS },
                        onOpenMessages = { tab = HostMainTab.INBOX },
                        onOpenFavorites = onOpenFavorites,
                        onOpenReviews = onOpenReviews,
                        onOpenProfile = { tab = HostMainTab.PROFILE },
                        onOpenContact = onOpenContact,
                        onOpenSettings = onOpenSettings,
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
                        onOpenCars = { tab = HostMainTab.CARS },
                        onOpenBookings = { tab = HostMainTab.BOOKINGS },
                        onEditProfile = onEditProfile,
                        onOpenSettings = onOpenSettings,
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
    val isDark = LocalDarkMode.current
    Surface(
        color = colors.cardBackground,
        shadowElevation = if (isDark) 0.dp else 8.dp,
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            if (!isDark) {
                HorizontalDivider(color = colors.border)
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(62.dp)
                    .padding(horizontal = 10.dp, vertical = 5.dp),
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
                            .padding(vertical = 5.dp, horizontal = 2.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(2.dp),
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
                                modifier = Modifier.size(24.dp),
                            )
                        }
                        Text(
                            text = item.title,
                            style = MaterialTheme.typography.labelLarge.copy(fontSize = 11.sp),
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.SemiBold,
                            color = tint,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.navigationBarsPadding())
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
    onApplySearchToExplore: (String, String, String, String, String, String, Int, Float, Boolean, String, String, Boolean, Boolean) -> Unit,
    onResumeCheckout: (ResumableCheckoutUi) -> Unit = {},
) {
    CoachTour(
        id = "home",
        steps = listOf(
            CoachStep("home.search", "Search anything", "Look up a car, a city or a host, then tap the magnifier."),
            CoachStep("home.filters", "Fine-tune results", "Set price, seats, delivery and more."),
            CoachStep("home.categories", "Browse by body type", "Tap a type to filter instantly. The most popular types come first."),
            CoachStep("home.location", "Change area", "Pick the city you're browsing in to see cars near you."),
        ),
    )
    val resumableCheckout = rememberResumableCheckout(viewModel)
    val isAuthenticatedForCheckout by viewModel.isAuthenticated.collectAsState()
    LaunchedEffect(isAuthenticatedForCheckout) { viewModel.refreshSavedCheckout() }
    val carsState by viewModel.carsState.collectAsState()
    val favoritesState by viewModel.favoritesState.collectAsState()
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val me by viewModel.me.collectAsState()
    val locations by viewModel.locations.collectAsState()
    val catalog by viewModel.catalog.collectAsState()
    val conversationsState by viewModel.conversationsState.collectAsState()
    val favoriteIds = (favoritesState as? UiState.Success<Set<String>>)?.data ?: emptySet()
    val context = LocalContext.current
    val homeLayoutPrefs = remember(context) {
        context.getSharedPreferences(HomePopularLayoutPrefsName, Context.MODE_PRIVATE)
    }
    val scope = rememberCoroutineScope()
    var selectedCat by rememberSaveable { mutableStateOf("All") }
    var popularLayoutModeName by rememberSaveable {
        mutableStateOf(
            homeLayoutPrefs.getString(HomePopularLayoutPrefsKey, ExploreLayoutMode.LIST.name)
                ?: ExploreLayoutMode.LIST.name,
        )
    }
    val popularLayoutMode = remember(popularLayoutModeName) {
        runCatching { ExploreLayoutMode.valueOf(popularLayoutModeName) }
            .getOrElse { ExploreLayoutMode.LIST }
    }
    var homeSearchText by rememberSaveable { mutableStateOf("") }
    var showHomeFilterSheet by rememberSaveable { mutableStateOf(false) }
    val homeFilterSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var homeRegion by rememberSaveable { mutableStateOf("") }
    var homeCity by rememberSaveable { mutableStateOf("") }
    var homeMake by rememberSaveable { mutableStateOf("") }
    var homeModel by rememberSaveable { mutableStateOf("") }
    var homeVehicleType by rememberSaveable { mutableStateOf("") }
    var homeTransmission by rememberSaveable { mutableStateOf("") }
    var homeFuel by rememberSaveable { mutableStateOf("") }
    var homeMinPrice by rememberSaveable { mutableStateOf(50) }
    var homeMaxPrice by rememberSaveable { mutableStateOf(8000f) }
    var homeInstantOnly by rememberSaveable { mutableStateOf(false) }
    var homeDeliveryOnly by rememberSaveable { mutableStateOf(false) }
    var homeAcOnly by rememberSaveable { mutableStateOf(false) }
    var homeLocation by remember { mutableStateOf<HomeLocation?>(null) }
    var detectedCityName by remember { mutableStateOf<String?>(null) }
    var homeLocationResolving by rememberSaveable { mutableStateOf(false) }
    val browseLocation by viewModel.browseLocation.collectAsState()
    var showLocationSheet by rememberSaveable { mutableStateOf(false) }
    val locationSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val colors = LocalHayameColors.current
    val locationPermission = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { granted ->
        if (granted) {
            scope.launch {
                homeLocationResolving = true
                homeLocation = fetchHomeLocation(context)
                detectedCityName = homeLocation?.cityName ?: homeLocation?.regionName
                homeLocationResolving = false
            }
        } else {
            homeLocationResolving = false
        }
    }

    val availableCategories = remember(carsState) {
        val cars = (carsState as? UiState.Success<List<CarDto>>)?.data.orEmpty()
        val types = cars.mapNotNull { it.car_type?.trim()?.takeIf { type -> type.isNotBlank() } }
        val unique = (AndroidReferenceData.carTypes + types).distinctBy { it.lowercase(Locale.US) }
        // Most populated body type first; ties keep the catalogue order, empty ones trail.
        val counts = unique.associateWith { category -> cars.count { matchesHomeCategory(it.car_type, category) } }
        listOf("All") + unique.sortedByDescending { counts[it] ?: 0 }
    }
    val allHomeCars = remember(carsState) {
        (carsState as? UiState.Success<List<CarDto>>)?.data ?: emptyList()
    }
    // The feed follows the category pill the moment it changes.
    val homeCars = remember(allHomeCars, selectedCat) {
        allHomeCars.filter { matchesHomeCategory(it.car_type, selectedCat) }
    }
    val homeMakeOptions = remember(carsState, catalog) {
        val liveBrands = (carsState as? UiState.Success<List<CarDto>>)
            ?.data
            ?.mapNotNull { it.brand?.trim()?.takeIf { brand -> brand.isNotBlank() } }
            ?: emptyList()
        (AndroidReferenceData.carMakes + catalog.keys + liveBrands)
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .distinctBy { it.lowercase(Locale.US) }
    }
    val homeModelOptions = remember(carsState, catalog, homeMake, homeModel) {
        val liveModels = (carsState as? UiState.Success<List<CarDto>>)
            ?.data
            ?.filter { homeMake.isBlank() || it.brand.orEmpty().equals(homeMake, ignoreCase = true) }
            ?.mapNotNull { it.model?.trim()?.takeIf { model -> model.isNotBlank() } }
            ?: emptyList()
        (AndroidReferenceData.modelsFor(homeMake, homeModel) + catalog[AndroidReferenceData.normalizedMake(homeMake)].orEmpty() + liveModels)
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .distinctBy { it.lowercase(Locale.US) }
            .sortedWith(String.CASE_INSENSITIVE_ORDER)
    }
    val homeTypeOptions = remember(carsState) {
        val liveTypes = (carsState as? UiState.Success<List<CarDto>>)
            ?.data
            ?.mapNotNull { it.car_type?.trim()?.takeIf { type -> type.isNotBlank() } }
            ?: emptyList()
        (AndroidReferenceData.carTypes + liveTypes).distinctBy { it.lowercase(Locale.US) }
    }
    val homeTransmissionOptions = remember(carsState) {
        val liveValues = (carsState as? UiState.Success<List<CarDto>>)
            ?.data
            ?.mapNotNull { it.transmission?.trim()?.takeIf { value -> value.isNotBlank() } }
            ?: emptyList()
        (AndroidReferenceData.transmissions + liveValues).distinctBy { it.lowercase(Locale.US) }
    }
    val homeFuelOptions = remember(carsState) {
        val liveValues = (carsState as? UiState.Success<List<CarDto>>)
            ?.data
            ?.mapNotNull { it.fuel_type?.trim()?.takeIf { value -> value.isNotBlank() } }
            ?: emptyList()
        (AndroidReferenceData.fuels + liveValues).distinctBy { it.lowercase(Locale.US) }
    }
    // Browse location: the manually chosen city/region wins; otherwise the
    // GPS-detected one. Never sourced from (or written to) the profile city.
    val browseCity = browseLocation.first
    val browseRegion = browseLocation.second
    val effectiveCity = browseCity.ifBlank { homeLocation?.cityName?.trim().orEmpty() }
    val effectiveRegion = browseRegion.ifBlank { homeLocation?.regionName?.trim().orEmpty() }
    val nearYouCars = remember(homeCars, homeLocation, effectiveCity, effectiveRegion) {
        val loc = homeLocation
        // Cars carry no coordinates from the API today, so proximity is
        // city-match first, region-match second; distance is a tiebreaker
        // that activates automatically if coordinates ever appear.
        fun locationRank(car: CarDto): Int = when {
            effectiveCity.isNotBlank() &&
                AndroidReferenceData.cityMatches(car.city.orEmpty(), effectiveCity) -> 0
            effectiveRegion.isNotBlank() &&
                car.region.orEmpty().trim().equals(effectiveRegion, ignoreCase = true) -> 1
            else -> 2
        }
        fun distance(car: CarDto): Double {
            val lat = car.latitude ?: car.lat
            val lng = car.longitude ?: car.lng
            return if (loc != null && lat != null && lng != null) {
                distanceKm(loc.lat, loc.lng, lat, lng)
            } else {
                999.0
            }
        }
        if (effectiveCity.isBlank() && effectiveRegion.isBlank() && loc == null) {
            homeCars.take(5)
        } else {
            homeCars
                .sortedWith(compareBy({ locationRank(it) }, { distance(it) }))
                .take(5)
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
    fun applyHomeSearchToExplore() {
        val selectedFilterType = homeVehicleType.ifBlank {
            if (selectedCat == "All") "" else selectedCat
        }
        onApplySearchToExplore(
            homeSearchText.trim(),
            selectedFilterType,
            homeRegion,
            homeCity,
            homeMake,
            homeModel,
            homeMinPrice,
            homeMaxPrice,
            homeInstantOnly,
            homeTransmission,
            homeFuel,
            homeDeliveryOnly,
            homeAcOnly,
        )
    }

    LaunchedEffect(Unit) {
        viewModel.loadReferenceData()
        viewModel.loadCars(mapOf("sort" to "new_listings", "limit" to "48"))
        viewModel.loadFavorites()
        viewModel.loadConversations()

        if (hasHomeLocationPermission(context)) {
            homeLocationResolving = true
            homeLocation = fetchHomeLocation(context)
            detectedCityName = homeLocation?.cityName ?: homeLocation?.regionName
            homeLocationResolving = false
        } else {
            homeLocationResolving = true
            locationPermission.launch(Manifest.permission.ACCESS_COARSE_LOCATION)
        }
    }

    LaunchedEffect(availableCategories) {
        if (!availableCategories.contains(selectedCat)) {
            selectedCat = "All"
        }
    }

    HayameRefreshBox(
        onRefresh = { viewModel.loadCars(mapOf("sort" to "new_listings", "limit" to "48")); viewModel.loadFavorites(); viewModel.loadConversations(); viewModel.refreshSavedCheckout(force = true) },
        modifier = Modifier.fillMaxSize(),
        indicatorTopPadding = paddingValues.calculateTopPadding(),
    ) {
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
    	                                .takeUnless { it.isNullOrBlank() } ?: "Guest User"
    	                        } else {
    	                            "Sign in or sign up"
    	                        }
    	                        val locationText = listOfNotNull(
    	                            browseCity.takeIf { it.isNotBlank() }
    	                                ?.let(AndroidReferenceData::cityDisplayName),
    	                            browseRegion.takeIf { it.isNotBlank() },
    	                            detectedCityName?.trim()?.takeIf { it.isNotBlank() }
    	                                ?.let(AndroidReferenceData::cityDisplayName),
    	                            me?.profile?.city?.trim()?.takeIf { it.isNotBlank() },
    	                            me?.profile?.region?.trim()?.takeIf { it.isNotBlank() },
                            ).firstOrNull() ?: "Ghana"
    	                        Text(
                                text = displayName,
                                style = MaterialTheme.typography.titleMedium.copy(fontSize = 16.sp),
    	                            color = colors.brandNavy,
    	                            fontWeight = FontWeight.Bold,
    	                        )
    	                        Row(
    	                            horizontalArrangement = Arrangement.spacedBy(4.dp),
    	                            verticalAlignment = Alignment.CenterVertically,
    	                            modifier = Modifier.coachTarget("home.location").clickable { showLocationSheet = true },
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
    	                                contentDescription = "Change location",
    	                                tint = LocalHayameColors.current.brandBlue,
    	                                modifier = Modifier.size(12.dp),
    	                            )
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
                                        .background(LocalHayameColors.current.brandBlue, CircleShape)
                                )
                            }
                        }
                    }
                }
            }
            item {
                OutlinedTextField(
                    value = homeSearchText,
                    onValueChange = { homeSearchText = it },
                    modifier = Modifier.fillMaxWidth().coachTarget("home.search"),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                    keyboardActions = KeyboardActions(onSearch = { applyHomeSearchToExplore() }),
                    shape = RoundedCornerShape(16.dp),
                    placeholder = { Text("Car, city, or host...", color = colors.mutedText) },
                    trailingIcon = {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(end = 6.dp)) {
                            if (homeSearchText.isNotEmpty()) {
                                IconButton(onClick = { homeSearchText = "" }, modifier = Modifier.size(36.dp)) {
                                    Icon(Icons.Outlined.Close, contentDescription = "Clear search", tint = colors.mutedText, modifier = Modifier.size(18.dp))
                                }
                            }
                            IconButton(onClick = { showHomeFilterSheet = true }, modifier = Modifier.size(38.dp).coachTarget("home.filters")) {
                                Icon(Icons.Outlined.Tune, contentDescription = "Filters", tint = colors.brandNavy, modifier = Modifier.size(22.dp))
                            }
                            Spacer(modifier = Modifier.width(2.dp))
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .background(colors.brandBlue, RoundedCornerShape(12.dp))
                                    .clickable { applyHomeSearchToExplore() },
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(Icons.Outlined.Search, contentDescription = "Search", tint = Color.White, modifier = Modifier.size(20.dp))
                            }
                        }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = LocalHayameColors.current.brandBlue,
                        unfocusedBorderColor = colors.border,
                        focusedContainerColor = colors.fieldBackground,
                        unfocusedContainerColor = colors.fieldBackground,
                        focusedTextColor = colors.brandNavy,
                        unfocusedTextColor = colors.brandNavy,
                    ),
                )
            }
            item {
                LazyRow(
                    modifier = Modifier.coachTarget("home.categories"),
                    contentPadding = PaddingValues(horizontal = 0.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    items(availableCategories) { cat ->
                        val isSelected = selectedCat == cat
                        Surface(
                            onClick = { selectedCat = cat },
                            shape = RoundedCornerShape(20.dp),
                            color = if (isSelected) colors.brandBlue else colors.cardBackground,
                            border = if (isSelected) null else BorderStroke(1.dp, colors.border),
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 13.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.spacedBy(7.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Icon(
                                    painter = painterResource(carTypeIconRes(cat)),
                                    contentDescription = null,
                                    tint = if (isSelected) Color.White else colors.brandNavy,
                                    modifier = Modifier.size(width = 20.dp, height = 15.dp),
                                )
                                Text(
                                    text = cat,
                                    style = MaterialTheme.typography.labelLarge.copy(fontSize = 13.sp),
                                    color = if (isSelected) Color.White else colors.brandNavy,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.SemiBold,
                                )
                            }
                        }
                    }
                }
            }
            if (resumableCheckout != null) {
                item(key = "resume-checkout") {
                    ResumeCheckoutCard(
                        resumable = resumableCheckout,
                        viewModel = viewModel,
                        onResume = { onResumeCheckout(resumableCheckout) },
                    )
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
                            title = when {
                                effectiveCity.isNotBlank() ->
                                    "Near ${AndroidReferenceData.cityDisplayName(effectiveCity)}"
                                effectiveRegion.isNotBlank() -> "Near $effectiveRegion"
                                else -> "Near you"
                            },
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
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = "Popular picks",
                                style = MaterialTheme.typography.titleLarge,
                                color = colors.brandNavy,
                                fontWeight = FontWeight.Bold,
                            )
                            Spacer(modifier = Modifier.weight(1f))
                            ExploreLayoutToggle(
                                selectedLayout = popularLayoutMode,
                                onSelect = { selected ->
                                    popularLayoutModeName = selected.name
                                    homeLayoutPrefs.edit()
                                        .putString(HomePopularLayoutPrefsKey, selected.name)
                                        .apply()
                                },
                            )
                            TextButton(onClick = onOpenExplore) {
                                Text("See all", color = colors.brandBlue, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                    if (homeCars.isEmpty()) {
                        item {
                            if (allHomeCars.isEmpty()) {
                                EmptyBlock("No cars yet", "No listings are available right now.")
                            } else {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(colors.cardBackground)
                                        .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                                        .padding(22.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(10.dp),
                                ) {
                                    Icon(
                                        painter = painterResource(carTypeIconRes(selectedCat)),
                                        contentDescription = null,
                                        tint = colors.brandBlue,
                                        modifier = Modifier.size(width = 44.dp, height = 34.dp),
                                    )
                                    Text("No ${selectedCat.lowercase()} listings yet", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                    Text(
                                        "Try another type, or browse everything that's available right now.",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = colors.mutedText,
                                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                                    )
                                    TextButton(onClick = { selectedCat = "All" }) {
                                        Text("Show all cars", color = colors.brandBlue, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    } else if (popularLayoutMode == ExploreLayoutMode.GRID) {
                        items(homeCars.take(6).chunked(2), key = { row -> row.first().id }) { row ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(14.dp),
                                verticalAlignment = Alignment.Top,
                            ) {
                                row.forEach { car ->
                                    Box(modifier = Modifier.weight(1f)) {
                                        ListingCard(
                                            car = car,
                                            isFavorite = favoriteIds.contains(car.id),
                                            imageHeight = 140.dp,
                                            onClick = { onOpenCarDetail(car.id) },
                                            onFavoriteClick = {
                                                viewModel.toggleFavorite(
                                                    carId = car.id,
                                                    currentlyFavorite = favoriteIds.contains(car.id),
                                                    authDestination = NavRoutes.main(MainTab.HOME),
                                                )
                                            },
                                        )
                                    }
                                }
                                if (row.size == 1) Spacer(modifier = Modifier.weight(1f))
                            }
                        }
                    } else {
                        items(homeCars.take(6), key = { it.id }) { car ->
                            ListingCard(
                                car = car,
                                isFavorite = favoriteIds.contains(car.id),
                                layout = ListingCardLayout.ROW,
                                onClick = { onOpenCarDetail(car.id) },
                                onFavoriteClick = {
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
                SolidPillButton(
                    text = "Explore More",
                    modifier = Modifier.fillMaxWidth(),
                    onClick = onOpenExplore,
                )
            }
            item { Spacer(modifier = Modifier.height(24.dp)) }
            }

            if (showLocationSheet) {
                ModalBottomSheet(
                    onDismissRequest = { showLocationSheet = false },
                    sheetState = locationSheetState,
                ) {
                    HomeLocationPickerContent(
                        locations = locations,
                        selectedCity = browseCity,
                        selectedRegion = browseRegion,
                        detectedCity = detectedCityName,
                        onUseCurrentLocation = {
                            viewModel.setBrowseLocation("", "")
                            if (hasHomeLocationPermission(context)) {
                                scope.launch {
                                    homeLocationResolving = true
                                    homeLocation = fetchHomeLocation(context)
                                    detectedCityName = homeLocation?.cityName ?: homeLocation?.regionName
                                    homeLocationResolving = false
                                }
                            } else {
                                homeLocationResolving = true
                                locationPermission.launch(Manifest.permission.ACCESS_COARSE_LOCATION)
                            }
                            showLocationSheet = false
                        },
                        onSelect = { city, region ->
                            viewModel.setBrowseLocation(city, region)
                            showLocationSheet = false
                        },
                    )
                }
            }

            if (showHomeFilterSheet) {
                ModalBottomSheet(
                    onDismissRequest = { showHomeFilterSheet = false },
                    sheetState = homeFilterSheetState,
                ) {
                    ExploreFilterContent(
                        locations = locations,
                        selectedRegion = homeRegion,
                        selectedCity = homeCity,
                        selectedMake = homeMake,
                        selectedModel = homeModel,
                        selectedType = homeVehicleType,
                        selectedTransmission = homeTransmission,
                        selectedFuel = homeFuel,
                        minPrice = homeMinPrice,
                        maxPrice = homeMaxPrice,
                        instantOnly = homeInstantOnly,
                        deliveryOnly = homeDeliveryOnly,
                        acOnly = homeAcOnly,
                        makeOptions = homeMakeOptions,
                        modelOptions = homeModelOptions,
                        typeOptions = homeTypeOptions,
                        transmissionOptions = homeTransmissionOptions,
                        fuelOptions = homeFuelOptions,
                        onRegionChange = {
                            homeRegion = it
                            homeCity = ""
                        },
                        onCityChange = { homeCity = it },
                        onMakeChange = {
                            homeMake = it
                            homeModel = ""
                        },
                        onModelChange = { homeModel = it },
                        onTypeChange = { homeVehicleType = it },
                        onTransmissionChange = { homeTransmission = it },
                        onFuelChange = { homeFuel = it },
                        onMinPriceChange = { homeMinPrice = it },
                        onMaxPriceChange = { homeMaxPrice = it },
                        onInstantOnlyChange = { homeInstantOnly = it },
                        onDeliveryOnlyChange = { homeDeliveryOnly = it },
                        onAcOnlyChange = { homeAcOnly = it },
                        onReset = {
                            homeRegion = ""
                            homeCity = ""
                            homeMake = ""
                            homeModel = ""
                            homeVehicleType = ""
                            homeTransmission = ""
                            homeFuel = ""
                            homeMinPrice = 50
                            homeMaxPrice = 8000f
                            homeInstantOnly = false
                            homeDeliveryOnly = false
                            homeAcOnly = false
                        },
                        onDismiss = { showHomeFilterSheet = false },
                    )
                }
            }
        }
    }
}

@Composable
private fun HomeLocationPickerContent(
    locations: Map<String, List<String>>,
    selectedCity: String,
    selectedRegion: String,
    detectedCity: String?,
    onUseCurrentLocation: () -> Unit,
    onSelect: (String, String) -> Unit,
) {
    val colors = LocalHayameColors.current
    var query by rememberSaveable { mutableStateOf("") }
    val stableLocations = remember { locations }
    val filtered = remember(stableLocations, query) {
        val q = query.trim()
        if (q.isEmpty()) {
            stableLocations
        } else {
            stableLocations.mapNotNull { (region, cities) ->
                val cityMatches = cities.filter {
                    AndroidReferenceData.citySearchText(it).contains(q, ignoreCase = true)
                }
                when {
                    region.contains(q, ignoreCase = true) -> region to cities
                    cityMatches.isNotEmpty() -> region to cityMatches
                    else -> null
                }
            }.toMap()
        }
    }
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            "Choose location",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.SemiBold,
            color = colors.brandNavy,
        )
        Text(
            "Vehicles near this location are shown first. This does not change the location on your profile.",
            style = MaterialTheme.typography.bodySmall,
            color = colors.mutedText,
        )
        Surface(
            onClick = onUseCurrentLocation,
            shape = RoundedCornerShape(14.dp),
            color = colors.cardBackground,
            border = BorderStroke(1.dp, colors.border),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    Icons.Outlined.MyLocation,
                    contentDescription = null,
                    tint = LocalHayameColors.current.brandBlue,
                    modifier = Modifier.size(18.dp),
                )
                Column {
                    Text(
                        "Use my current location",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium,
                        color = colors.brandNavy,
                    )
                    if (!detectedCity.isNullOrBlank()) {
                        Text(
                            "Detected: $detectedCity",
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.mutedText,
                        )
                    }
                }
            }
        }
        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            shape = RoundedCornerShape(14.dp),
            placeholder = { Text("Search city or region...", color = colors.mutedText) },
            leadingIcon = {
                Icon(Icons.Outlined.Search, contentDescription = null, tint = colors.mutedText)
            },
            trailingIcon = {
                if (query.isNotEmpty()) {
                    IconButton(onClick = { query = "" }) {
                        Icon(Icons.Outlined.Close, contentDescription = "Clear", tint = colors.mutedText)
                    }
                }
            },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = LocalHayameColors.current.brandBlue,
                unfocusedBorderColor = colors.border,
                focusedContainerColor = colors.fieldBackground,
                unfocusedContainerColor = colors.fieldBackground,
                focusedTextColor = colors.brandNavy,
                unfocusedTextColor = colors.brandNavy,
            ),
        )
        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(max = 380.dp),
        ) {
            if (filtered.isEmpty()) {
                item {
                    Text(
                        "No matching locations.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = colors.mutedText,
                        modifier = Modifier.padding(vertical = 16.dp),
                    )
                }
            }
            filtered.forEach { (region, cities) ->
                item(key = "region-$region") {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelect("", region) }
                            .padding(vertical = 10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            region,
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.mutedText,
                        )
                        if (selectedRegion.equals(region, ignoreCase = true) && selectedCity.isBlank()) {
                            Icon(
                                Icons.Outlined.Check,
                                contentDescription = "Selected",
                                tint = LocalHayameColors.current.brandBlue,
                                modifier = Modifier.size(16.dp),
                            )
                        } else {
                            Text(
                                "All of $region",
                                style = MaterialTheme.typography.bodySmall,
                                color = LocalHayameColors.current.brandBlue,
                            )
                        }
                    }
                }
                items(cities, key = { "city-$region-$it" }) { city ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelect(city, region) }
                            .padding(start = 12.dp)
                            .padding(vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            AndroidReferenceData.cityDisplayName(city),
                            style = MaterialTheme.typography.bodyMedium,
                            color = colors.brandNavy,
                        )
                        if (selectedCity.equals(city, ignoreCase = true)) {
                            Icon(
                                Icons.Outlined.Check,
                                contentDescription = "Selected",
                                tint = LocalHayameColors.current.brandBlue,
                                modifier = Modifier.size(16.dp),
                            )
                        }
                    }
                }
            }
            item { Spacer(modifier = Modifier.height(28.dp)) }
        }
    }
}

@Composable
private fun ExploreFilterContent(
    locations: Map<String, List<String>>,
    selectedRegion: String,
    selectedCity: String,
    selectedMake: String = "",
    selectedModel: String = "",
    selectedType: String = "",
    selectedTransmission: String = "",
    selectedFuel: String = "",
    minPrice: Int = 50,
    maxPrice: Float,
    instantOnly: Boolean,
    deliveryOnly: Boolean = false,
    acOnly: Boolean = false,
    makeOptions: List<String> = AndroidReferenceData.carMakes,
    modelOptions: List<String> = emptyList(),
    typeOptions: List<String> = AndroidReferenceData.carTypes,
    transmissionOptions: List<String> = AndroidReferenceData.transmissions,
    fuelOptions: List<String> = AndroidReferenceData.fuels,
    onRegionChange: (String) -> Unit,
    onCityChange: (String) -> Unit,
    onMakeChange: (String) -> Unit = {},
    onModelChange: (String) -> Unit = {},
    onTypeChange: (String) -> Unit = {},
    onTransmissionChange: (String) -> Unit = {},
    onFuelChange: (String) -> Unit = {},
    onMinPriceChange: (Int) -> Unit = {},
    onMaxPriceChange: (Float) -> Unit,
    onInstantOnlyChange: (Boolean) -> Unit,
    onDeliveryOnlyChange: (Boolean) -> Unit = {},
    onAcOnlyChange: (Boolean) -> Unit = {},
    onReset: () -> Unit = {},
    onDismiss: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val regionOptions = remember(locations) {
        listOf("") + (AndroidReferenceData.regions + locations.keys)
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .distinctBy { it.lowercase(Locale.US) }
            .sortedWith(String.CASE_INSENSITIVE_ORDER)
    }
    val cityOptions = remember(locations, selectedRegion) {
        val cities = if (selectedRegion.isBlank()) {
            AndroidReferenceData.districtsByRegion.values.flatten() + locations.values.flatten()
        } else {
            AndroidReferenceData.citiesFor(selectedRegion) + locations[selectedRegion].orEmpty()
        }
        listOf("") + cities
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .distinctBy { it.lowercase(Locale.US) }
            .sortedWith(String.CASE_INSENSITIVE_ORDER)
    }
    val normalizedMakeOptions = remember(makeOptions, selectedMake) {
        (listOf("") + makeOptions + selectedMake)
            .map { it.trim() }
            .distinctBy { it.lowercase(Locale.US) }
            .filter { it.isNotBlank() || it == "" }
    }
    val normalizedModelOptions = remember(modelOptions, selectedModel) {
        (listOf("") + modelOptions + selectedModel)
            .map { it.trim() }
            .distinctBy { it.lowercase(Locale.US) }
            .filter { it.isNotBlank() || it == "" }
    }
    val normalizedTypeOptions = remember(typeOptions, selectedType) {
        (listOf("") + typeOptions + selectedType)
            .map { it.trim() }
            .distinctBy { it.lowercase(Locale.US) }
            .filter { it.isNotBlank() || it == "" }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .navigationBarsPadding(),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            TextButton(onClick = onReset) {
                Text("Reset", color = colors.brandBlue)
            }
            Text("Filters", style = MaterialTheme.typography.titleLarge, color = colors.brandNavy, fontWeight = FontWeight.Bold)
            TextButton(onClick = onDismiss) {
                Text("Done", color = colors.brandBlue, fontWeight = FontWeight.Bold)
            }
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .background(colors.pageBackground),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            item {
                FilterSectionCard(title = "Location") {
                    FilterPickerRow("Region", selectedRegion.ifBlank { "Any" }, regionOptions.map { it.ifBlank { "Any" } }) {
                        onRegionChange(if (it == "Any") "" else it)
                    }
                    FilterDivider()
                    FilterPickerRow("City", selectedCity.ifBlank { "Any" }, cityOptions.map { it.ifBlank { "Any" } }) {
                        onCityChange(if (it == "Any") "" else it)
                    }
                }
            }
            item {
                FilterSectionCard(title = "Vehicle") {
                    FilterPickerRow("Make", selectedMake.ifBlank { "Any" }, normalizedMakeOptions.map { it.ifBlank { "Any" } }) {
                        onMakeChange(if (it == "Any") "" else it)
                    }
                    FilterDivider()
                    FilterPickerRow("Model", selectedModel.ifBlank { "Any" }, normalizedModelOptions.map { it.ifBlank { "Any" } }) {
                        onModelChange(if (it == "Any") "" else it)
                    }
                    FilterDivider()
                    FilterPickerRow("Type", selectedType.ifBlank { "Any" }, normalizedTypeOptions.map { it.ifBlank { "Any" } }) {
                        onTypeChange(if (it == "Any") "" else it)
                    }
                    FilterDivider()
                    FilterPickerRow("Transmission", selectedTransmission.ifBlank { "Any" }, (listOf("") + transmissionOptions).map { it.ifBlank { "Any" } }) {
                        onTransmissionChange(if (it == "Any") "" else it)
                    }
                    FilterDivider()
                    FilterPickerRow("Fuel", selectedFuel.ifBlank { "Any" }, (listOf("") + fuelOptions).map { it.ifBlank { "Any" } }) {
                        onFuelChange(if (it == "Any") "" else it)
                    }
                }
            }
            item {
                FilterSectionCard(title = "Price") {
                    FilterStepperRow("Min price", "GHS$minPrice", minPrice > 50, { onMinPriceChange((minPrice - 50).coerceAtLeast(50)) }, { onMinPriceChange((minPrice + 50).coerceAtMost(5000)) })
                    FilterDivider()
                    FilterStepperRow("Max price", "GHS${maxPrice.roundToInt()}", maxPrice.roundToInt() > 100, { onMaxPriceChange((maxPrice - 50f).coerceAtLeast(100f)) }, { onMaxPriceChange((maxPrice + 50f).coerceAtMost(8000f)) })
                }
            }
            item {
                FilterSectionCard(title = "Options") {
                    FilterToggleRow("Instant Book", instantOnly, onInstantOnlyChange)
                    FilterDivider()
                    FilterToggleRow("Delivery available", deliveryOnly, onDeliveryOnlyChange)
                    FilterDivider()
                    FilterToggleRow("Air conditioning", acOnly, onAcOnlyChange)
                }
            }
            item {
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
}

@Composable
private fun FilterSectionCard(
    title: String,
    content: @Composable ColumnScope.() -> Unit,
) {
    val colors = LocalHayameColors.current
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            title,
            style = MaterialTheme.typography.labelLarge,
            color = colors.mutedText,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(horizontal = 4.dp),
        )
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = colors.cardBackground,
            border = BorderStroke(1.dp, colors.border),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(content = content)
        }
    }
}

@Composable
private fun FilterDivider() {
    val colors = LocalHayameColors.current
    HorizontalDivider(color = colors.border, modifier = Modifier.padding(start = 16.dp))
}

@Composable
private fun FilterPickerRow(
    label: String,
    value: String,
    options: List<String>,
    onSelected: (String) -> Unit,
) {
    val colors = LocalHayameColors.current
    var expanded by remember { mutableStateOf(false) }

    Box {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { expanded = true }
                .padding(horizontal = 16.dp, vertical = 14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(label, color = colors.brandNavy, style = MaterialTheme.typography.bodyLarge)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(value, color = colors.mutedText, style = MaterialTheme.typography.bodyMedium)
                Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = colors.mutedText, modifier = Modifier.size(18.dp))
            }
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            options.distinct().forEach { option ->
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
private fun FilterStepperRow(
    label: String,
    value: String,
    canDecrease: Boolean,
    onDecrease: () -> Unit,
    onIncrease: () -> Unit,
) {
    val colors = LocalHayameColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text("$label: $value", color = colors.brandNavy, style = MaterialTheme.typography.bodyLarge)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            OutlinedButton(
                onClick = onDecrease,
                enabled = canDecrease,
                shape = CircleShape,
                contentPadding = PaddingValues(0.dp),
                modifier = Modifier.size(36.dp),
            ) {
                Text("-", fontWeight = FontWeight.Bold)
            }
            OutlinedButton(
                onClick = onIncrease,
                shape = CircleShape,
                contentPadding = PaddingValues(0.dp),
                modifier = Modifier.size(36.dp),
            ) {
                Text("+", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun FilterToggleRow(
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
) {
    val colors = LocalHayameColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(label, color = colors.brandNavy, style = MaterialTheme.typography.bodyLarge)
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = androidx.compose.material3.SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = colors.brandBlue,
            )
        )
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
            Text("See all", color = LocalHayameColors.current.brandBlue, fontWeight = FontWeight.Medium)
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
    val infiniteTransition = rememberInfiniteTransition(label = "shimmer")
    val progress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1050, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "shimmer_progress",
    )
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(cornerRadius.dp))
            .background(colors.skeletonBase)
            .drawWithContent {
                drawContent()
                val sweepWidth = size.width * 0.8f
                val startX = (size.width + sweepWidth) * progress - sweepWidth
                drawRect(
                    brush = Brush.horizontalGradient(
                        colors = listOf(Color.Transparent, colors.skeletonHighlight, Color.Transparent),
                        startX = startX,
                        endX = startX + sweepWidth,
                    ),
                )
            },
    )
}

@Composable
private fun HomeNearYouSection(
    cars: List<CarDto>,
    favoriteIds: Set<String>,
    onOpen: (String) -> Unit,
    onFavorite: (CarDto) -> Unit,
    onSeeAll: () -> Unit,
    title: String = "Near you",
) {
    val colors = LocalHayameColors.current
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                title,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.SemiBold,
                color = colors.brandNavy,
            )
            TextButton(onClick = onSeeAll) {
                Text("See all", color = LocalHayameColors.current.brandBlue, fontWeight = FontWeight.Medium)
            }
        }
        LazyRow(
            contentPadding = PaddingValues(horizontal = 0.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            items(cars.take(5), key = { it.id }) { car ->
                ListingCard(
                    car = car,
                    isFavorite = favoriteIds.contains(car.id),
                    modifier = Modifier.width(236.dp),
                    imageHeight = 150.dp,
                    onClick = { onOpen(car.id) },
                    onFavoriteClick = { onFavorite(car) },
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
            color = LocalHayameColors.current.fieldBackground,
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
                    color = LocalHayameColors.current.brandNavy,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Icon(Icons.Outlined.ExpandMore, contentDescription = null, tint = LocalHayameColors.current.brandNavy, modifier = Modifier.size(14.dp))
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
        color = LocalHayameColors.current.chipBackground,
        border = BorderStroke(1.dp, LocalHayameColors.current.border),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(icon, contentDescription = null, tint = LocalHayameColors.current.brandNavy, modifier = Modifier.size(16.dp))
            Text(label, color = LocalHayameColors.current.brandNavy, fontWeight = FontWeight.SemiBold)
        }
    }
}

internal enum class ExploreLayoutMode {
    LIST,
    GRID,
}

private const val ExploreLayoutPrefsName = "hayame_explore_layout"
private const val ExploreLayoutPrefsKey = "layout_mode"
private const val HomePopularLayoutPrefsName = "hayame_home_popular_layout"
private const val HomePopularLayoutPrefsKey = "layout_mode"

@Composable
private fun PageTitle(title: String) {
    val colors = LocalHayameColors.current
    Text(
        text = title,
        style = MaterialTheme.typography.headlineLarge.copy(fontSize = 34.sp),
        color = colors.brandNavy,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.fillMaxWidth(),
    )
}

private fun normalizedExploreSearchTokens(query: String): List<String> {
    return Normalizer
        .normalize(query.trim().lowercase(Locale.US), Normalizer.Form.NFD)
        .replace(Regex("\\p{Mn}+"), "")
        .split(Regex("\\s+"))
        .map { it.trim() }
        .filter { it.isNotBlank() }
}

private fun CarDto.matchesExploreSearch(tokens: List<String>): Boolean {
    if (tokens.isEmpty()) return true
    val haystack = Normalizer
        .normalize(
            listOfNotNull(
                title,
                description,
                brand,
                model,
                city,
                region,
                car_type,
                transmission,
                fuel_type,
                host_name,
                host_level,
                year?.roundToInt()?.toString(),
                car_year?.roundToInt()?.toString(),
                if (instant_book == true) "instant book" else null,
                if (delivery_available == true) "delivery available" else null,
                if (air_conditioning == true) "air conditioning ac" else null,
                features?.joinToString(" "),
            ).joinToString(" ").lowercase(Locale.US),
            Normalizer.Form.NFD,
        )
        .replace(Regex("\\p{Mn}+"), "")
    return tokens.all { token -> haystack.contains(token) }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun ExploreTab(
    viewModel: AppViewModel,
    paddingValues: PaddingValues,
    onOpenCarDetail: (String) -> Unit,
    homeSearchToken: Int = 0,
    homeSearchQuery: String = "",
    homeSearchCarType: String = "",
    homeSearchRegion: String = "",
    homeSearchCity: String = "",
    homeSearchBrand: String = "",
    homeSearchModel: String = "",
    homeSearchMinPrice: Int = 50,
    homeSearchMaxPrice: Float = 8000f,
    homeSearchInstantOnly: Boolean = false,
    homeSearchTransmission: String = "",
    homeSearchFuel: String = "",
    homeSearchDeliveryOnly: Boolean = false,
    homeSearchAcOnly: Boolean = false,
) {
    CoachTour(
        id = "explore",
        steps = listOf(
            CoachStep("explore.filters", "Filters", "Narrow the list by price, type, delivery and instant book."),
            CoachStep("explore.layout", "Grid or list", "Switch how listings are shown."),
        ),
    )
    val carsState by viewModel.carsState.collectAsState()
    val favoritesState by viewModel.favoritesState.collectAsState()
    val locations by viewModel.locations.collectAsState()
    val catalog by viewModel.catalog.collectAsState()
    val favoriteIds = (favoritesState as? UiState.Success<Set<String>>)?.data ?: emptySet()
    val colors = LocalHayameColors.current
    val context = LocalContext.current
    val exploreLayoutPrefs = remember(context) {
        context.getSharedPreferences(ExploreLayoutPrefsName, Context.MODE_PRIVATE)
    }
    var query by rememberSaveable { mutableStateOf("") }
    var sort by rememberSaveable { mutableStateOf("new_listings") }
    var appliedCarType by rememberSaveable { mutableStateOf("") }
    var selectedBrand by rememberSaveable { mutableStateOf("") }
    var selectedModel by rememberSaveable { mutableStateOf("") }
    var appliedRegion by rememberSaveable { mutableStateOf("") }
    var appliedCity by rememberSaveable { mutableStateOf("") }
    var appliedMinPrice by rememberSaveable { mutableStateOf(50) }
    var appliedMaxPrice by rememberSaveable { mutableStateOf(8000f) }
    var appliedInstantOnly by rememberSaveable { mutableStateOf(false) }
    var appliedDeliveryOnly by rememberSaveable { mutableStateOf(false) }
    var appliedAcOnly by rememberSaveable { mutableStateOf(false) }
    var appliedTransmission by rememberSaveable { mutableStateOf("") }
    var appliedFuel by rememberSaveable { mutableStateOf("") }
    var showFilters by rememberSaveable { mutableStateOf(false) }
    val exploreFilterSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var sortMenuExpanded by remember { mutableStateOf(false) }
    var layoutMode by rememberSaveable {
        mutableStateOf(exploreLayoutPrefs.getString(ExploreLayoutPrefsKey, ExploreLayoutMode.LIST.name) ?: ExploreLayoutMode.LIST.name)
    }
    val selectedLayout = remember(layoutMode) {
        runCatching { ExploreLayoutMode.valueOf(layoutMode) }.getOrElse { ExploreLayoutMode.LIST }
    }
    val vehicleBrandOptions = remember(carsState, catalog) {
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
        (popular + AndroidReferenceData.carMakes + catalog.keys + liveBrands)
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .distinctBy { it.lowercase(Locale.US) }
    }
    val modelOptions = remember(carsState, catalog, selectedBrand, selectedModel) {
        val liveModels = (carsState as? UiState.Success<List<CarDto>>)
            ?.data
            ?.filter { selectedBrand.isBlank() || it.brand.orEmpty().equals(selectedBrand, ignoreCase = true) }
            ?.mapNotNull { it.model?.trim()?.takeIf { model -> model.isNotBlank() } }
            ?: emptyList()
        (AndroidReferenceData.modelsFor(selectedBrand, selectedModel) + catalog[AndroidReferenceData.normalizedMake(selectedBrand)].orEmpty() + liveModels)
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .distinctBy { it.lowercase(Locale.US) }
            .sortedWith(String.CASE_INSENSITIVE_ORDER)
    }
    val typeOptions = remember(carsState) {
        val liveTypes = (carsState as? UiState.Success<List<CarDto>>)
            ?.data
            ?.mapNotNull { it.car_type?.trim()?.takeIf { type -> type.isNotBlank() } }
            .orEmpty()
        (AndroidReferenceData.carTypes + liveTypes).distinctBy { it.lowercase(Locale.US) }
    }
    val transmissionOptions = remember(carsState) {
        val liveValues = (carsState as? UiState.Success<List<CarDto>>)
            ?.data
            ?.mapNotNull { it.transmission?.trim()?.takeIf { value -> value.isNotBlank() } }
            .orEmpty()
        (AndroidReferenceData.transmissions + liveValues).distinctBy { it.lowercase(Locale.US) }
    }
    val fuelOptions = remember(carsState) {
        val liveValues = (carsState as? UiState.Success<List<CarDto>>)
            ?.data
            ?.mapNotNull { it.fuel_type?.trim()?.takeIf { value -> value.isNotBlank() } }
            .orEmpty()
        (AndroidReferenceData.fuels + liveValues).distinctBy { it.lowercase(Locale.US) }
    }
    val searchTokens = remember(query) { normalizedExploreSearchTokens(query) }

    fun exploreParams(): Map<String, String> {
        val params = mutableMapOf<String, String>()
        params["sort"] = sort
        if (query.trim().isNotEmpty()) params["q"] = query.trim()
        if (appliedCarType.isNotEmpty()) params["carType"] = appliedCarType
        if (selectedBrand.isNotEmpty()) params["brand"] = selectedBrand
        if (selectedModel.isNotEmpty()) params["model"] = selectedModel
        if (appliedRegion.isNotEmpty()) params["region"] = appliedRegion
        if (appliedCity.isNotEmpty()) params["city"] = appliedCity
        if (appliedMinPrice > 50) params["minPrice"] = appliedMinPrice.toString()
        if (appliedMaxPrice < 8000f) params["maxPrice"] = appliedMaxPrice.toInt().toString()
        if (appliedInstantOnly) params["instantBook"] = "true"
        if (appliedDeliveryOnly) params["delivery"] = "true"
        if (appliedAcOnly) params["airConditioning"] = "true"
        if (appliedTransmission.isNotEmpty()) params["transmission"] = appliedTransmission
        if (appliedFuel.isNotEmpty()) params["fuelType"] = appliedFuel
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
            selectedBrand = homeSearchBrand
            selectedModel = homeSearchModel
            appliedRegion = homeSearchRegion
            appliedCity = homeSearchCity
            appliedMinPrice = homeSearchMinPrice
            appliedMaxPrice = homeSearchMaxPrice
            appliedInstantOnly = homeSearchInstantOnly
            appliedDeliveryOnly = homeSearchDeliveryOnly
            appliedAcOnly = homeSearchAcOnly
            appliedTransmission = homeSearchTransmission
            appliedFuel = homeSearchFuel
            val params = mutableMapOf<String, String>()
            params["sort"] = sort
            if (homeSearchQuery.trim().isNotEmpty()) params["q"] = homeSearchQuery.trim()
            if (homeSearchCarType.isNotEmpty()) params["carType"] = homeSearchCarType
            if (homeSearchBrand.isNotEmpty()) params["brand"] = homeSearchBrand
            if (homeSearchModel.isNotEmpty()) params["model"] = homeSearchModel
            if (homeSearchRegion.isNotEmpty()) params["region"] = homeSearchRegion
            if (homeSearchCity.isNotEmpty()) params["city"] = homeSearchCity
            if (homeSearchMinPrice > 50) params["minPrice"] = homeSearchMinPrice.toString()
            if (homeSearchMaxPrice < 8000f) params["maxPrice"] = homeSearchMaxPrice.toInt().toString()
            if (homeSearchInstantOnly) params["instantBook"] = "true"
            if (homeSearchDeliveryOnly) params["delivery"] = "true"
            if (homeSearchAcOnly) params["airConditioning"] = "true"
            if (homeSearchTransmission.isNotEmpty()) params["transmission"] = homeSearchTransmission
            if (homeSearchFuel.isNotEmpty()) params["fuelType"] = homeSearchFuel
            viewModel.loadCars(params)
        }
    }

    HayameRefreshBox(
        onRefresh = { viewModel.loadCars(exploreParams()); viewModel.loadFavorites() },
        modifier = Modifier.fillMaxSize(),
        indicatorTopPadding = paddingValues.calculateTopPadding(),
    ) {
    Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
            ) {
                Spacer(modifier = Modifier.height(16.dp))
                PageTitle("Explore")
                Spacer(modifier = Modifier.height(14.dp))

                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = colors.cardBackground,
                    border = BorderStroke(1.dp, colors.border),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(Icons.Outlined.Search, contentDescription = null, tint = colors.mutedText, modifier = Modifier.size(20.dp))
                        BasicTextField(
                            value = query,
                            onValueChange = { query = it },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            textStyle = TextStyle(
                                color = colors.brandNavy,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium,
                                fontFamily = ManropeFamily,
                            ),
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                            keyboardActions = KeyboardActions(onSearch = { viewModel.loadCars(exploreParams()) }),
                            decorationBox = { innerTextField ->
                                if (query.isBlank()) {
                                    Text(
                                        text = "Search cars, cities, hosts",
                                        color = colors.mutedText,
                                        style = MaterialTheme.typography.bodyMedium,
                                    )
                                }
                                innerTextField()
                            },
                        )
                        if (query.trim().isNotEmpty()) {
                            IconButton(onClick = { query = "" }, modifier = Modifier.size(28.dp)) {
                                Icon(Icons.Outlined.Close, contentDescription = "Clear", tint = colors.mutedText, modifier = Modifier.size(16.dp))
                            }
                        }
                        Box {
                            Surface(
                                modifier = Modifier.clickable { sortMenuExpanded = true },
                                shape = RoundedCornerShape(999.dp),
                                color = colors.brandLight,
                            ) {
                                Text(
                                    text = "Sort",
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
                                    style = MaterialTheme.typography.labelLarge.copy(fontSize = 12.sp),
                                    color = colors.brandBlue,
                                    fontWeight = FontWeight.Bold,
                                )
                            }
                            DropdownMenu(expanded = sortMenuExpanded, onDismissRequest = { sortMenuExpanded = false }) {
                                listOf(
                                    "Price Low" to "price_low",
                                    "Price High" to "price_high",
                                    "Top Rated" to "top_rated",
                                    "Latest" to "new_listings",
                                ).forEach { option ->
                                    DropdownMenuItem(
                                        text = { Text(option.first) },
                                        onClick = {
                                            sort = option.second
                                            sortMenuExpanded = false
                                            viewModel.loadCars(exploreParams() + ("sort" to option.second))
                                        },
                                    )
                                }
                            }
                        }
                        Box(modifier = Modifier.coachTarget("explore.layout")) {
                            ExploreLayoutToggle(
                                selectedLayout = selectedLayout,
                                onSelect = {
                                    layoutMode = it.name
                                    exploreLayoutPrefs.edit().putString(ExploreLayoutPrefsKey, it.name).apply()
                                },
                            )
                        }
                        IconButton(onClick = { showFilters = true }, modifier = Modifier.size(34.dp).coachTarget("explore.filters")) {
                            Icon(
                                Icons.Outlined.Tune,
                                contentDescription = "Filters",
                                tint = colors.brandBlue,
                                modifier = Modifier.size(20.dp),
                            )
                        }
                    }
                }

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
                Spacer(modifier = Modifier.height(12.dp))

            when (val state = carsState) {
                UiState.Loading -> Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    repeat(4) { ExploreListRowPlaceholder() }
                }
                is UiState.Error -> ErrorBlock(state.message, onRetry = { viewModel.loadCars() })
    	            UiState.Empty -> EmptyBlock("No matching listings", "Try changing filters or search terms.")
    	            is UiState.Success -> {
    	                val visibleCars = state.data.filter { car ->
                            car.matchesExploreSearch(searchTokens) &&
                                (selectedBrand.isBlank() || car.brand.orEmpty().equals(selectedBrand, ignoreCase = true)) &&
                                (selectedModel.isBlank() || car.model.orEmpty().equals(selectedModel, ignoreCase = true)) &&
                                (appliedCarType.isBlank() || car.car_type.orEmpty().equals(appliedCarType, ignoreCase = true)) &&
                                (appliedTransmission.isBlank() || car.transmission.orEmpty().equals(appliedTransmission, ignoreCase = true)) &&
                                (appliedFuel.isBlank() || car.fuel_type.orEmpty().equals(appliedFuel, ignoreCase = true)) &&
                                ((car.daily_price ?: 0.0).roundToInt() >= appliedMinPrice) &&
                                (!appliedDeliveryOnly || car.delivery_available == true) &&
                                (!appliedAcOnly || car.air_conditioning == true)
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
    	                            ListingCard(
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
    	                        verticalArrangement = Arrangement.spacedBy(12.dp),
    	                        contentPadding = PaddingValues(bottom = 16.dp)
    	                    ) {
    	                        items(visibleCars, key = { it.id }) { car ->
    	                            ListingCard(
                                    car = car,
                                    isFavorite = favoriteIds.contains(car.id),
                                    layout = ListingCardLayout.ROW,
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
                UiState.Idle -> Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    repeat(4) { ExploreListRowPlaceholder() }
                }
            }
            }

            if (showFilters) {
                ModalBottomSheet(
                    onDismissRequest = { showFilters = false },
                    sheetState = exploreFilterSheetState,
                ) {
                    ExploreFilterContent(
                        locations = locations,
                        selectedRegion = appliedRegion,
                        selectedCity = appliedCity,
                        selectedMake = selectedBrand,
                        selectedModel = selectedModel,
                        selectedType = appliedCarType,
                        selectedTransmission = appliedTransmission,
                        selectedFuel = appliedFuel,
                        minPrice = appliedMinPrice,
                        maxPrice = appliedMaxPrice,
                        instantOnly = appliedInstantOnly,
                        deliveryOnly = appliedDeliveryOnly,
                        acOnly = appliedAcOnly,
                        makeOptions = vehicleBrandOptions,
                        modelOptions = modelOptions,
                        typeOptions = typeOptions,
                        transmissionOptions = transmissionOptions,
                        fuelOptions = fuelOptions,
                        onRegionChange = {
                            appliedRegion = it
                            appliedCity = ""
                        },
                        onCityChange = { appliedCity = it },
                        onMakeChange = {
                            selectedBrand = it
                            selectedModel = ""
                        },
                        onModelChange = { selectedModel = it },
                        onTypeChange = { appliedCarType = it },
                        onTransmissionChange = { appliedTransmission = it },
                        onFuelChange = { appliedFuel = it },
                        onMinPriceChange = { appliedMinPrice = it },
                        onMaxPriceChange = { appliedMaxPrice = it },
                        onInstantOnlyChange = { appliedInstantOnly = it },
                        onDeliveryOnlyChange = { appliedDeliveryOnly = it },
                        onAcOnlyChange = { appliedAcOnly = it },
                        onReset = {
                            appliedRegion = ""
                            appliedCity = ""
                            selectedBrand = ""
                            selectedModel = ""
                            appliedCarType = ""
                            appliedTransmission = ""
                            appliedFuel = ""
                            appliedMinPrice = 50
                            appliedMaxPrice = 8000f
                            appliedInstantOnly = false
                            appliedDeliveryOnly = false
                            appliedAcOnly = false
                        },
                        onDismiss = {
                            showFilters = false
                            viewModel.loadCars(exploreParams())
                        },
                    )
                }
            }
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
                .background(if (selected) LocalHayameColors.current.brandBlue else Color.Transparent, CircleShape),
        )
    }
}

@Composable
internal fun VehicleBrandLogo(
    title: String,
    selected: Boolean,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val colors = LocalHayameColors.current
    val logoRes = vehicleBrandLogoRes(context, title)
    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        if (logoRes != null) {
            Image(
                painter = painterResource(id = logoRes),
                contentDescription = "$title logo",
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Fit,
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
        "aeolus" to listOf("dongfeng"),
        "aeolus dongfeng aeolus" to listOf("dongfeng"),
        "baic" to listOf("baic_motor"),
        "deepal" to listOf("changan"),
        "deepal changan deepal" to listOf("changan"),
        "dongfeng aeolus" to listOf("dongfeng"),
        "gac" to listOf("gac_group"),
        "maruti suzuki" to listOf("suzuki"),
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
internal fun ExploreLayoutToggle(
    selectedLayout: ExploreLayoutMode,
    onSelect: (ExploreLayoutMode) -> Unit,
) {
    Surface(
        shape = RoundedCornerShape(22.dp),
        color = LocalHayameColors.current.cardBackground,
        border = BorderStroke(1.dp, LocalHayameColors.current.border),
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
        color = if (selected) LocalHayameColors.current.brandBlue.copy(alpha = 0.16f) else Color.Transparent,
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(
                painter = painterResource(id = iconRes),
                contentDescription = contentDescription,
                tint = if (selected) LocalHayameColors.current.brandBlue else LocalHayameColors.current.brandNavy,
                modifier = Modifier.size(18.dp),
            )
        }
    }
}

internal fun tripBrandLogoTitle(car: CarDto?, booking: BookingDto): String {
    val explicitBrand = listOfNotNull(car?.brand, booking.cars?.brand)
        .firstOrNull { it.trim().isNotBlank() }
        ?.trim()
    if (!explicitBrand.isNullOrBlank()) return explicitBrand

    val title = booking.cars?.title?.trim()?.takeIf { it.isNotBlank() }
        ?: car?.title?.trim()?.takeIf { it.isNotBlank() }
        ?: return "All"

    return AndroidReferenceData.carMakes.firstOrNull { make ->
        val normalizedMake = make
            .replace("-", " ")
            .replace("(", " ")
            .replace(")", " ")
            .replace(Regex("\\s+"), " ")
            .trim()
        title.contains(make, ignoreCase = true) ||
            (normalizedMake.isNotBlank() && title.contains(normalizedMake, ignoreCase = true))
    } ?: title
}

internal fun messageHostForTrip(
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
    val location = listOf(
        booking.trip_use_address,
        booking.trip_use_city,
        booking.trip_use_region,
    ).mapNotNull { it?.trim()?.takeIf(String::isNotBlank) }
        .joinToString(", ")
        .ifBlank { "Not provided" }
    val deliveryAddress = booking.delivery_address?.trim().orEmpty()
    val mode = if (deliveryAddress.isNotBlank() || (booking.delivery_fee ?: 0.0) > 0.0) "Delivery" else "Pickup"
    val handoffLocation = deliveryAddress.ifBlank { location }
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
        "$mode location: $handoffLocation",
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

internal fun parsedTripDays(startDate: String?, endDate: String?): Int {
    val start = parseApiDate(startDate)
    val end = parseApiDate(endDate)
    return if (start != null && end != null && end.isAfter(start)) {
        max(1, ChronoUnit.DAYS.between(start, end).toInt())
    } else {
        1
    }
}

@Composable
internal fun StatusBadge(status: String) {
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
fun NotificationPreferencesCard(
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
fun GradientPillButton(
    text: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    // Kept for call sites; the app no longer uses gradients on buttons.
    SolidPillButton(text = text, modifier = modifier, onClick = onClick)
}

/** Flat brand-blue pill, the same colour as the search button. */
@Composable
fun SolidPillButton(
    text: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val colors = LocalHayameColors.current
    Button(
        onClick = onClick,
        modifier = modifier.height(50.dp),
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(containerColor = colors.brandBlue, contentColor = Color.White),
        elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp, pressedElevation = 0.dp),
    ) {
        Text(text, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold, color = Color.White)
    }
}

@Composable
fun SecondaryPillButton(
    text: String,
    modifier: Modifier = Modifier,
    isSelected: Boolean = false,
    onClick: () -> Unit,
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier.height(44.dp),
        shape = RoundedCornerShape(999.dp),
        border = BorderStroke(1.dp, if (isSelected) LocalHayameColors.current.brandBlue else LocalHayameColors.current.brandBlue.copy(alpha = 0.25f)),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = if (isSelected) LocalHayameColors.current.brandBlue else LocalHayameColors.current.brandLight,
            contentColor = if (isSelected) Color.White else LocalHayameColors.current.brandNavy,
        ),
    ) {
        Text(
            text = text,
            color = if (isSelected) Color.White else LocalHayameColors.current.brandNavy,
            style = MaterialTheme.typography.bodyLarge.copy(fontSize = 15.sp),
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@OptIn(ExperimentalFoundationApi::class, ExperimentalMaterial3Api::class)
@Composable
fun CarDetailScreen(
    viewModel: AppViewModel,
    carId: String,
    onBack: () -> Unit,
    onBook: (String) -> Unit,
    onOpenConversation: (String) -> Unit,
    onOpenProtection: () -> Unit = {},
    onOpenHostProfile: (String) -> Unit = {},
    onResumeCheckout: (ResumableCheckoutUi) -> Unit = {},
) {
    val state by viewModel.carDetailState.collectAsState()
    val favoritesState by viewModel.favoritesState.collectAsState()
    val bookingsState by viewModel.bookingsState.collectAsState()
    val carReviewsState by viewModel.carReviewsState.collectAsState()
    val bookingDraft by viewModel.bookingDraft.collectAsState()
    val resumableForCar = rememberResumableCheckout(viewModel)?.takeIf { it.carId == carId }
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val locations by viewModel.locations.collectAsState()
    val colors = LocalHayameColors.current
    val favoriteIds = (favoritesState as? UiState.Success<Set<String>>)?.data ?: emptySet()
    val context = LocalContext.current

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
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
    ) { inner ->
        when (val s = state) {
            UiState.Loading -> Box(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
                IconButton(onClick = onBack, modifier = Modifier.padding(8.dp)) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = colors.brandNavy)
                }
                LoadingBlock("Loading details...")
            }
            is UiState.Error -> Box(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
                IconButton(onClick = onBack, modifier = Modifier.padding(8.dp)) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = colors.brandNavy)
                }
                Box(modifier = Modifier.padding(top = 56.dp)) {
                    ErrorBlock(s.message, onRetry = { viewModel.loadCarDetail(carId) })
                }
            }
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
                val hostLevel = hostLevelLabel(car.host_level ?: car.owner?.host_level)
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

                fun shareListing() {
                    val shareIntent = Intent(Intent.ACTION_SEND).apply {
                        type = "text/plain"
                        putExtra(Intent.EXTRA_SUBJECT, carTitle)
                        putExtra(
                            Intent.EXTRA_TEXT,
                            "Check out $carTitle on Hayame\nhttps://www.hayamegh.com/cars/${car.id}",
                        )
                    }
                    context.startActivity(Intent.createChooser(shareIntent, "Share $carTitle"))
                }

                var showGallery by rememberSaveable(car.id) { mutableStateOf(false) }
                var selectedImageIndex by rememberSaveable(car.id) { mutableStateOf(0) }
                var startDate by remember(car.id) { mutableStateOf(LocalDate.now()) }
                var endDate by remember(car.id) { mutableStateOf(LocalDate.now().plusDays(car.minimumTripDays.toLong())) }
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
                var showLocationSheet by rememberSaveable(car.id) { mutableStateOf(false) }
                var activeDateTarget by rememberSaveable(car.id) { mutableStateOf<String?>(null) }
                var showReviewComposer by rememberSaveable(car.id) { mutableStateOf(false) }
                var showFullDescription by rememberSaveable(car.id) { mutableStateOf(false) }
                CoachTour(
                    id = "carDetail",
                    steps = listOf(
                        CoachStep("detail.photos", "Swipe the photos", "Tap a photo to see it full screen."),
                        CoachStep("detail.trip", "Your trip", "Tap the pencil to change dates or where you'll drive. The price updates as you go."),
                        CoachStep("detail.host", "Talk to the host", "Ask about pickup or delivery before you book."),
                        CoachStep("detail.book", "Ready when you are", "Book now walks you through dates, handoff and payment."),
                    ),
                )
                val listState = rememberLazyListState()
                val heroPx = with(LocalDensity.current) { 380.dp.toPx() }
                // Once the hero photo scrolls away, the floating controls get a solid bar and the title.
                val scrolledPastHero by remember(heroPx) {
                    derivedStateOf { listState.firstVisibleItemIndex > 0 || listState.firstVisibleItemScrollOffset > heroPx - 240f }
                }

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
                val platformFeePercent by viewModel.platformFeePercent.collectAsState()
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
                            duration = car.minimumTripDays,
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
                        minimumNights = car.minimumTripDays,
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
                            duration = car.minimumTripDays,
                            blockedDates = blocked,
                        )

                        if (nextStart == null) {
                            availabilityMessage = "No upcoming available dates in the next 6 months."
                            return@loadAvailabilitySnapshot
                        }

                        startDate = if (isBookableStartDate(startDate, blocked, car.minimumTripDays)) startDate else nextStart
                        preferredBookingEndDate(
                            currentEnd = endDate,
                            startDate = startDate,
                            blockedDates = blocked,
                            minimumNights = car.minimumTripDays,
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
                    // Pick up saved choices for this car so "Book now" never starts over.
                    when (val resumable = resumableForCar) {
                        is ResumableCheckoutUi.Held -> {
                            val held = resumable.checkout
                            viewModel.setBookingDraft(
                                carId = car.id,
                                startDate = held.startDate,
                                endDate = held.endDate,
                                region = held.tripUseRegion.orEmpty(),
                                city = held.tripUseCity.orEmpty(),
                                address = held.tripUseAddress.orEmpty(),
                                tripMode = held.tripMode,
                                deliveryAddress = held.deliveryAddress.orEmpty(),
                                deliveryTime = held.deliveryTime.orEmpty(),
                                contactPhone = held.contactPhone.orEmpty(),
                                deliveryNotes = held.deliveryNotes.orEmpty(),
                                carTitle = car.title?.trim().orEmpty(),
                                carImageUrl = car.image_url ?: car.car_photos.orEmpty().firstNotNullOfOrNull { it.url },
                                dailyPrice = pricePerDay,
                                step = 0,
                                persist = false,
                            )
                        }
                        is ResumableCheckoutUi.Draft -> Unit // BookingScreen restores it as-is.
                        null -> viewModel.setBookingDraft(
                            carId = car.id,
                            startDate = startDate.toApiDate(),
                            endDate = endDate.toApiDate(),
                            region = tripUseRegion,
                            city = tripUseCity,
                            address = tripUseAddress.trim(),
                            carTitle = car.title?.trim().orEmpty(),
                            carImageUrl = car.image_url ?: car.car_photos.orEmpty().firstNotNullOfOrNull { it.url },
                            dailyPrice = pricePerDay,
                            persist = false,
                        )
                    }
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
                    val isHostVerified = car.id_verified == true || car.owner?.id_verified == true
                    val isPhoneVerified = car.phone_verified == true || car.owner?.phone_verified == true
                    val isEmailVerified = car.email_verified == true || car.owner?.email_verified == true
                    val total = subtotal + (subtotal * platformFeePercent / 100).roundToInt() + insuranceFee + deliveryFee + outsideSurcharge + depositAmount
                    val yearLabel = (car.year ?: car.car_year)?.roundToInt()?.takeIf { it > 1900 }?.toString()
                    val ratingSummary = if (reviewsCount > 0) String.format("%.1f", ratingValue) else "New"
                    val isFavoriteCar = favoriteIds.contains(car.id)

                    HayameRefreshBox(
                        onRefresh = { viewModel.loadCarDetail(carId); viewModel.loadCarReviews(carId); viewModel.loadFavorites() },
                        modifier = Modifier.fillMaxSize(),
                        indicatorTopPadding = WindowInsets.statusBars.asPaddingValues().calculateTopPadding() + 56.dp,
                    ) {
                    LazyColumn(
                            state = listState,
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(inner),
                            contentPadding = PaddingValues(bottom = 140.dp),
                        ) {
                            item(key = "hero") {
                                Box(modifier = Modifier.coachTarget("detail.photos")) {
                                    DetailHeroGallery(
                                        pagerState = pagerState,
                                        images = galleryItems,
                                        selectedIndex = selectedImageIndex,
                                        onTap = { if (imageUrls.isNotEmpty()) showGallery = true },
                                    )
                                }
                            }
                            item(key = "title") {
                                Column(
                                    modifier = Modifier.padding(horizontal = 16.dp).padding(top = 18.dp, bottom = 14.dp),
                                    verticalArrangement = Arrangement.spacedBy(8.dp),
                                ) {
                                    Text(carTitle, fontSize = 26.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy, lineHeight = 32.sp)
                                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                                        Text(listOfNotNull(yearLabel, car.car_type).joinToString(" "), style = MaterialTheme.typography.bodyLarge, color = colors.mutedText)
                                        Box(modifier = Modifier.size(3.dp).background(colors.mutedText.copy(alpha = 0.5f), CircleShape))
                                        Text(ratingSummary, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                        Icon(Icons.Filled.Star, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(13.dp))
                                        Text(if (reviewsCount == 1) "(1 review)" else "($reviewsCount reviews)", style = MaterialTheme.typography.bodyLarge, color = colors.mutedText)
                                    }
                                    Row(horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.CenterVertically) {
                                        Row(horizontalArrangement = Arrangement.spacedBy(5.dp), verticalAlignment = Alignment.CenterVertically) {
                                            Icon(Icons.Outlined.Verified, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(16.dp))
                                            Text(if (hostLevel.contains("host", ignoreCase = true)) hostLevel else "$hostLevel host", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold, color = colors.brandBlue)
                                        }
                                        Row(horizontalArrangement = Arrangement.spacedBy(5.dp), verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                                            Icon(Icons.Outlined.Place, contentDescription = null, tint = colors.mutedText, modifier = Modifier.size(15.dp))
                                            Text(listOfNotNull(car.city, car.region).joinToString(", "), style = MaterialTheme.typography.bodyLarge, color = colors.mutedText, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                        }
                                    }
                                }
                            }
                            item(key = "specs") {
                                LazyRow(
                                    contentPadding = PaddingValues(horizontal = 16.dp),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    modifier = Modifier.padding(bottom = 18.dp),
                                ) {
                                    item { DetailSpecChip(Icons.Outlined.People, "${(car.seats ?: 5.0).roundToInt()} seats") }
                                    item { DetailSpecChip(Icons.Outlined.LocalGasStation, (car.fuel_type ?: "Petrol").replaceFirstChar { it.uppercase() }) }
                                    item { DetailSpecChip(Icons.Outlined.Settings, (car.transmission ?: "Automatic").replaceFirstChar { it.uppercase() }) }
                                    item { DetailSpecChip(painterRes = carTypeIconRes(car.car_type ?: "Car"), text = car.car_type ?: "Car") }
                                    if (car.air_conditioning == true) item { DetailSpecChip(Icons.Outlined.AcUnit, "A/C") }
                                    if (car.delivery_available == true) item { DetailSpecChip(Icons.Outlined.LocalShipping, "Delivery") }
                                    if (car.with_driver == true) item { DetailSpecChip(Icons.Outlined.Person, "With driver") }
                                    if (car.allow_one_day_booking == true) item { DetailSpecChip(Icons.Outlined.CalendarMonth, "1-day bookings", tint = colors.brandBlue) }
                                    if (car.instant_book == true) item { DetailSpecChip(Icons.Outlined.Bolt, "Instant book", tint = Success) }
                                }
                            }
                            item(key = "band-trip") { DetailSectionBand() }
                            item(key = "trip") {
                                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                                    Text("Your trip", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                    Box(modifier = Modifier.coachTarget("detail.trip")) {
                                        DetailEditRow(
                                            icon = Icons.Outlined.CalendarMonth,
                                            title = "Trip dates",
                                            lines = listOf("${startDate.toTripDateLabel()} at 10:00 AM", "${endDate.toTripDateLabel()} at 10:00 AM"),
                                            isLoading = isLoadingBookingAvailability,
                                            onEdit = { activeDateTarget = "start" },
                                        )
                                    }
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                                        (if (car.allow_one_day_booking == true) listOf(1, 2, 5, 7) else listOf(2, 5, 7)).forEach { days ->
                                            val selected = selectedQuickDuration == days
                                            Surface(
                                                onClick = { applyQuickTripDuration(days) },
                                                shape = CircleShape,
                                                color = if (selected) colors.brandBlue else colors.fieldBackground,
                                            ) {
                                                Text(
                                                    if (days == 1) "1 day" else "$days days",
                                                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 9.dp),
                                                    style = MaterialTheme.typography.labelLarge,
                                                    fontWeight = FontWeight.Bold,
                                                    color = if (selected) Color.White else colors.brandNavy,
                                                )
                                            }
                                        }
                                        Spacer(modifier = Modifier.weight(1f))
                                        TextButton(onClick = { activeDateTarget = "end" }, contentPadding = PaddingValues(horizontal = 6.dp)) {
                                            Icon(Icons.Outlined.CalendarMonth, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(16.dp))
                                            Spacer(modifier = Modifier.width(5.dp))
                                            Text("Return", color = colors.brandBlue, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                    HorizontalDivider(color = colors.border)
                                    DetailEditRow(
                                        icon = Icons.Outlined.Place,
                                        title = "Trip location",
                                        lines = listOf(
                                            "${AndroidReferenceData.cityDisplayName(tripUseCity)}, $tripUseRegion",
                                            tripUseAddress.trim().ifBlank { "Add the exact area or destination" },
                                        ),
                                        onEdit = { showLocationSheet = true },
                                    )
                                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            if (outsideListingRegion) Icons.Outlined.Info else Icons.Outlined.CheckCircle,
                                            contentDescription = null,
                                            tint = if (outsideListingRegion) Warning else Success,
                                            modifier = Modifier.size(14.dp),
                                        )
                                        Text(
                                            text = if (outsideListingRegion) {
                                                if (outsideRegionFee > 0) "Outside the listing region (+GHS $outsideRegionFee surcharge)" else "Outside the listing region"
                                            } else {
                                                "Within the listing region, no surcharge"
                                            },
                                            style = MaterialTheme.typography.bodyMedium,
                                            fontWeight = FontWeight.SemiBold,
                                            color = if (outsideListingRegion) Warning else Success,
                                        )
                                    }
                                    HorizontalDivider(color = colors.border)
                                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top) {
                                        DetailRowIcon(if (car.is_available == false) Icons.Outlined.Info else Icons.Outlined.CheckCircle, tint = if (car.is_available == false) Danger else Success)
                                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                            Text("Availability", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                            val message = availabilityMessage ?: if (car.is_available == false) "The host has paused this listing." else "Unavailable dates are crossed out in the calendar."
                                            val good = availabilityMessage?.let { it.contains("available", true) && !it.contains("unavailable", true) }
                                            Text(
                                                message,
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = when (good) { true -> Success; false -> Warning; null -> colors.mutedText },
                                            )
                                        }
                                        Surface(onClick = ::checkAvailabilityNow, shape = CircleShape, color = colors.brandLight, enabled = !isCheckingAvailability) {
                                            Box(modifier = Modifier.padding(horizontal = 14.dp, vertical = 9.dp), contentAlignment = Alignment.Center) {
                                                if (isCheckingAvailability) {
                                                    CircularProgressIndicator(modifier = Modifier.size(14.dp), strokeWidth = 2.dp, color = colors.brandBlue)
                                                } else {
                                                    Text("Check", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = colors.brandBlue)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            item(key = "band-price") { DetailSectionBand() }
                            item(key = "price") {
                                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    Text("Price details", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                    DetailPriceLine("GHS $pricePerDay × $daysCount day${if (daysCount == 1) "" else "s"}", subtotal)
                                    DetailPriceLine("Service fee", (subtotal * platformFeePercent / 100).roundToInt())
                                    DetailPriceLine("Insurance", insuranceFee)
                                    if (car.delivery_available == true) DetailPriceLine("Delivery (if chosen)", deliveryFee)
                                    if (outsideListingRegion) DetailPriceLine("Outside region surcharge", outsideSurcharge)
                                    DetailPriceLine("Refundable deposit", depositAmount)
                                    HorizontalDivider(color = colors.border)
                                    Row(verticalAlignment = Alignment.Bottom) {
                                        Text("Estimated total", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                        Spacer(modifier = Modifier.weight(1f))
                                        Text("GHS $total", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                    }
                                    Text(
                                        "The final total is confirmed at checkout. Pay now; the host approves before pickup and you are refunded in full if they decline.",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = colors.mutedText,
                                    )
                                    TextButton(onClick = onOpenProtection, contentPadding = PaddingValues(0.dp)) {
                                        Icon(Icons.Outlined.Shield, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Protection and cancellation details", color = colors.brandBlue, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                            item(key = "band-host") { DetailSectionBand() }
                            item(key = "host") {
                                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                                    Text("Hosted by", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                    Row(horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.CenterVertically) {
                                        HostAvatar(hostAvatar = hostAvatar, hostName = hostName)
                                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                            Text(hostName, style = MaterialTheme.typography.titleMedium.copy(fontSize = 17.sp), fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                            Text(hostLevel, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = colors.brandBlue)
                                            if (hostLocation.isNotBlank()) {
                                                Text(hostLocation, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
                                            }
                                        }
                                        Surface(onClick = { if (!hostId.isNullOrBlank()) onOpenHostProfile(hostId) }, shape = CircleShape, color = colors.fieldBackground, modifier = Modifier.size(36.dp)) {
                                            Box(contentAlignment = Alignment.Center) {
                                                Icon(Icons.Outlined.ChevronRight, contentDescription = "View host profile", tint = colors.brandNavy, modifier = Modifier.size(18.dp))
                                            }
                                        }
                                    }
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        DetailVerificationChip("ID", isHostVerified)
                                        DetailVerificationChip("Phone", isPhoneVerified)
                                        DetailVerificationChip("Email", isEmailVerified)
                                    }
                                    Surface(onClick = { openHostChat(null) }, shape = RoundedCornerShape(14.dp), color = colors.brandLight, modifier = Modifier.fillMaxWidth().coachTarget("detail.host")) {
                                        Row(modifier = Modifier.padding(vertical = 13.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                                            Icon(Icons.Outlined.ChatBubble, contentDescription = null, tint = colors.brandNavy, modifier = Modifier.size(16.dp))
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Text("Message $hostName", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                        }
                                    }
                                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        items(quickMessages) { prompt ->
                                            Surface(onClick = { openHostChat(prompt) }, shape = CircleShape, color = colors.fieldBackground) {
                                                Text(prompt, modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp), style = MaterialTheme.typography.labelLarge, color = colors.brandNavy)
                                            }
                                        }
                                    }
                                }
                            }
                            item(key = "band-about") { DetailSectionBand() }
                            item(key = "about") {
                                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Text("About this car", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                    val description = car.description?.takeIf { it.isNotBlank() } ?: "No description provided."
                                    Text(
                                        description,
                                        style = MaterialTheme.typography.bodyLarge,
                                        color = colors.mutedText,
                                        lineHeight = 22.sp,
                                        maxLines = if (showFullDescription) Int.MAX_VALUE else 4,
                                        overflow = TextOverflow.Ellipsis,
                                    )
                                    if (description.length > 180) {
                                        TextButton(onClick = { showFullDescription = !showFullDescription }, contentPadding = PaddingValues(0.dp)) {
                                            Text(if (showFullDescription) "Show less" else "Read more", color = colors.brandBlue, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text("Features", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                    if (normalizedFeatures.isEmpty()) {
                                        Text("No features listed.", style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
                                    } else {
                                        normalizedFeatures.chunked(2).forEach { row ->
                                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                                row.forEach { feature ->
                                                    Row(
                                                        modifier = Modifier.weight(1f).background(colors.fieldBackground, RoundedCornerShape(12.dp)).padding(horizontal = 12.dp, vertical = 9.dp),
                                                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                                                        verticalAlignment = Alignment.CenterVertically,
                                                    ) {
                                                        Icon(Icons.Outlined.Check, contentDescription = null, tint = colors.brandNavy, modifier = Modifier.size(14.dp))
                                                        Text(feature, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = colors.brandNavy, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                                    }
                                                }
                                                if (row.size == 1) Spacer(modifier = Modifier.weight(1f))
                                            }
                                        }
                                    }
                                }
                            }
                            item(key = "band-reviews") { DetailSectionBand() }
                            item(key = "reviews") {
                                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Text("Reviews", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy, modifier = Modifier.weight(1f))
                                        Icon(Icons.Filled.Star, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(14.dp))
                                        Text(if (reviewsCount > 0) "$ratingSummary • $reviewsCount" else "No reviews yet", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                    }
                                    when (carReviewsState) {
                                        UiState.Loading -> LoadingBlock("Loading reviews...")
                                        is UiState.Error -> Text((carReviewsState as UiState.Error).message, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
                                        is UiState.Success -> listingReviews.take(3).forEach { review -> DetailReviewRow(review) }
                                        else -> Text("Be the first to share how the trip went.", style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
                                    }
                                    if (completedReviewBooking != null && isAuthenticated) {
                                        if (showReviewComposer) {
                                            Column(
                                                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(colors.cardBackground).border(1.dp, colors.border, RoundedCornerShape(16.dp)).padding(14.dp),
                                                verticalArrangement = Arrangement.spacedBy(10.dp),
                                            ) {
                                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                    Text("Your rating", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                                    Spacer(modifier = Modifier.weight(1f))
                                                    (1..5).forEach { star ->
                                                        Icon(
                                                            imageVector = if (star <= reviewRating) Icons.Filled.Star else Icons.Outlined.StarBorder,
                                                            contentDescription = "$star star${if (star == 1) "" else "s"}",
                                                            tint = colors.brandBlue,
                                                            modifier = Modifier.size(26.dp).clickable { reviewRating = star },
                                                        )
                                                    }
                                                }
                                                OutlinedTextField(
                                                    value = reviewComment,
                                                    onValueChange = { reviewComment = it },
                                                    modifier = Modifier.fillMaxWidth(),
                                                    minLines = 3,
                                                    maxLines = 5,
                                                    placeholder = { Text("Share your experience") },
                                                    shape = RoundedCornerShape(12.dp),
                                                )
                                                SolidPillButton(text = "Submit review", modifier = Modifier.fillMaxWidth(), onClick = ::submitReviewNow)
                                            }
                                        } else {
                                            Surface(onClick = { showReviewComposer = true }, shape = CircleShape, color = colors.brandLight) {
                                                Row(modifier = Modifier.padding(horizontal = 16.dp, vertical = 11.dp), horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                                                    Icon(Icons.Outlined.Edit, contentDescription = null, tint = colors.brandNavy, modifier = Modifier.size(15.dp))
                                                    Text("Write a review", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                                }
                                            }
                                        }
                                    } else {
                                        Text("Guests can review after a completed trip.", style = MaterialTheme.typography.bodySmall, color = colors.mutedText)
                                    }
                                    if (!reviewStatusMessage.isNullOrBlank()) {
                                        Text(reviewStatusMessage.orEmpty(), color = colors.mutedText, style = MaterialTheme.typography.bodyMedium)
                                    }
                                }
                            }
                            item(key = "band-policies") { DetailSectionBand() }
                            item(key = "policies") {
                                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    Text("Good to know", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                    DetailPolicyRow(Icons.Outlined.Shield, "Cancellation", (car.cancellation_policy ?: "Moderate").replace('_', ' ').replaceFirstChar { it.uppercase() })
                                    DetailPolicyRow(Icons.Outlined.CreditCard, "Payment", "Paystack, card or mobile money")
                                    DetailPolicyRow(Icons.Outlined.CheckCircle, "Host approval", if (car.instant_book == true) "Instant book" else "Confirmed before pickup")
                                    DetailPolicyRow(Icons.Outlined.CalendarMonth, "Minimum trip", if (car.allow_one_day_booking == true) "1 day" else "2 days")
                                    DetailPolicyRow(Icons.Outlined.Person, "Driver", if (car.with_driver == true) "Comes with a driver" else "Self-drive")
                                    DetailPolicyRow(Icons.Outlined.CalendarMonth, "Listed", addedDateLabel)
                                }
                            }
                        }
                    }

                    // Floating controls over the hero photo; become a solid header once scrolled.
                    val headerBackground by animateColorAsState(
                        targetValue = if (scrolledPastHero) colors.cardBackground else Color.Transparent,
                        label = "detailHeaderBackground",
                    )
                    val headerTitleAlpha by animateFloatAsState(targetValue = if (scrolledPastHero) 1f else 0f, label = "detailHeaderTitle")
                    Column(
                        modifier = Modifier
                            .align(Alignment.TopCenter)
                            .fillMaxWidth()
                            .background(headerBackground),
                    ) {
                    Row(
                        modifier = Modifier
                            .statusBarsPadding()
                            .padding(horizontal = 16.dp, vertical = 6.dp)
                            .fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Surface(onClick = onBack, shape = CircleShape, color = colors.floatingControlBackground, modifier = Modifier.size(44.dp)) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = colors.brandNavy, modifier = Modifier.size(20.dp))
                            }
                        }
                        Text(
                            carTitle,
                            modifier = Modifier.weight(1f).padding(horizontal = 12.dp).alpha(headerTitleAlpha),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = colors.brandNavy,
                            textAlign = TextAlign.Center,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Surface(shape = CircleShape, color = colors.floatingControlBackground) {
                            Row {
                                IconButton(onClick = ::shareListing, modifier = Modifier.size(width = 48.dp, height = 44.dp)) {
                                    Icon(Icons.Outlined.Share, contentDescription = "Share $carTitle", tint = colors.brandNavy, modifier = Modifier.size(20.dp))
                                }
                                IconButton(
                                    onClick = {
                                        viewModel.toggleFavorite(
                                            carId = car.id,
                                            currentlyFavorite = isFavoriteCar,
                                            authDestination = NavRoutes.carDetail(car.id),
                                        )
                                    },
                                    modifier = Modifier.size(width = 48.dp, height = 44.dp),
                                ) {
                                    Icon(
                                        imageVector = if (isFavoriteCar) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                                        contentDescription = if (isFavoriteCar) "Remove from saved" else "Save",
                                        tint = if (isFavoriteCar) colors.danger else colors.brandNavy,
                                        modifier = Modifier.size(20.dp),
                                    )
                                }
                            }
                        }
                    }
                        if (scrolledPastHero) HorizontalDivider(color = colors.border)
                    }

                    activeDateTarget?.let { target ->
                        val isStart = target == "start"
                        AvailabilityCalendarDialog(
                            title = if (isStart) "Choose start date" else "Choose end date",
                            selectedDate = if (isStart) startDate else endDate,
                            minimumDate = if (isStart) LocalDate.now() else startDate.plusDays(car.minimumTripDays.toLong()),
                            blockedDates = blockedBookingDates,
                            selectionRange = startDate..endDate,
                            canSelectDate = { candidate ->
                                if (isStart) {
                                    isBookableStartDate(candidate, blockedBookingDates, car.minimumTripDays)
                                } else {
                                    isBookableEndDate(candidate, startDate, blockedBookingDates, car.minimumTripDays)
                                }
                            },
                            onDismiss = { activeDateTarget = null },
                            onDateSelected = { picked ->
                                if (isStart) startDate = picked else endDate = picked
                                selectedQuickDuration = null
                                availabilityMessage = null
                                activeDateTarget = null
                            },
                        )
                    }

                    if (showLocationSheet) {
                        ModalBottomSheet(
                            onDismissRequest = { showLocationSheet = false },
                            sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
                            containerColor = colors.pageBackground,
                        ) {
                            Column(
                                modifier = Modifier.padding(horizontal = 16.dp).padding(bottom = 24.dp).navigationBarsPadding(),
                                verticalArrangement = Arrangement.spacedBy(14.dp),
                            ) {
                                Text("Trip location", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                                Text("Where will you use the car? Pricing and the host handoff depend on it.", style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
                                SelectionField(selected = tripUseRegion, placeholder = "Select region", options = regionOptions, onSelected = { tripUseRegion = it })
                                SelectionField(selected = tripUseCity, placeholder = "Select city / district", options = cityOptions, onSelected = { tripUseCity = it })
                                OutlinedTextField(
                                    value = tripUseAddress,
                                    onValueChange = { tripUseAddress = it },
                                    modifier = Modifier.fillMaxWidth(),
                                    placeholder = { Text("Area, landmark, or pickup point") },
                                    shape = RoundedCornerShape(14.dp),
                                )
                                Text(
                                    text = if (outsideListingRegion) {
                                        if (outsideRegionFee > 0) "Outside ${car.region ?: "the listing region"}: +GHS $outsideRegionFee surcharge" else "Outside ${car.region ?: "the listing region"}"
                                    } else {
                                        "Within ${car.region ?: "the listing region"}, no surcharge"
                                    },
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (outsideListingRegion) Warning else Success,
                                )
                                SolidPillButton(text = "Done", modifier = Modifier.fillMaxWidth(), onClick = { showLocationSheet = false })
                            }
                        }
                    }

                    AnimatedVisibility(
                        visible = showFloatingBookingBar,
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .imePadding(),
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
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            resumableForCar?.let { resumable ->
                                Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                                    ResumeCheckoutStrip(resumable = resumable, onResume = { onResumeCheckout(resumable) })
                                }
                            }
                            FloatingBookingBar(
                                pricePerDay = pricePerDay,
                                estimatedTotal = total,
                                days = daysCount,
                                onBook = ::openBookingFlow,
                            )
                        }
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
        colors = CardDefaults.cardColors(containerColor = LocalHayameColors.current.cardBackground),
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
    estimatedTotal: Int,
    days: Int,
    onBook: () -> Unit,
) {
    val colors = LocalHayameColors.current
    Surface(color = colors.cardBackground.copy(alpha = 0.97f), shadowElevation = 12.dp) {
        Column {
            HorizontalDivider(color = colors.bottomBarSeparator)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                        Text("GHS $pricePerDay", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                        Text("/day", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = colors.mutedText, modifier = Modifier.padding(bottom = 3.dp))
                    }
                    Text("GHS $estimatedTotal est. for $days day${if (days == 1) "" else "s"}", style = MaterialTheme.typography.bodySmall, color = colors.mutedText)
                }
                Button(
                    onClick = onBook,
                    modifier = Modifier.height(50.dp).coachTarget("detail.book"),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = colors.brandBlue, contentColor = Color.White),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp, pressedElevation = 0.dp),
                    contentPadding = PaddingValues(horizontal = 26.dp),
                ) {
                    Text("Book now", style = MaterialTheme.typography.bodyLarge.copy(fontSize = 16.sp), fontWeight = FontWeight.Bold)
                }
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
private fun CircularDetailActionButton(
    icon: ImageVector,
    contentDescription: String,
    tint: Color = LocalHayameColors.current.brandNavy,
    onClick: () -> Unit,
) {
    Surface(
        modifier = Modifier
            .size(44.dp)
            .clickable(onClick = onClick),
        color = LocalHayameColors.current.cardBackground,
        shape = CircleShape,
        border = BorderStroke(1.dp, LocalHayameColors.current.border),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(
                imageVector = icon,
                contentDescription = contentDescription,
                tint = tint,
                modifier = Modifier.size(20.dp),
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
            color = LocalHayameColors.current.mutedText,
        )
        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = value,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Bold,
            color = LocalHayameColors.current.brandNavy,
            textAlign = TextAlign.End,
        )
    }
}

@Composable
internal fun InfoLine(label: String, value: String) {
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
                .border(1.dp, LocalHayameColors.current.border, CircleShape),
            contentScale = ContentScale.Crop,
        )
    } else {
        Box(
            modifier = Modifier
                .size(54.dp)
                .background(LocalHayameColors.current.brandLight, CircleShape)
                .border(1.dp, LocalHayameColors.current.border, CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Text(hostInitials(hostName), color = LocalHayameColors.current.brandNavy, fontWeight = FontWeight.Bold)
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
                .background(if (verified) LocalHayameColors.current.brandBlue else Danger.copy(alpha = 0.75f), CircleShape),
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.SemiBold,
            color = LocalHayameColors.current.brandNavy,
        )
    }
}

@Composable
private fun ReviewSummaryCard(review: ReviewDto) {
    val rating = (review.rating ?: 0.0).roundToInt().coerceIn(1, 5)
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = LocalHayameColors.current.cardBackground),
        border = BorderStroke(1.dp, LocalHayameColors.current.border),
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(
                text = review.reviewer?.full_name ?: "Hayame guest",
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Bold,
                color = LocalHayameColors.current.brandNavy,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                repeat(rating.coerceIn(1, 5)) {
                    Icon(Icons.Filled.Star, contentDescription = null, tint = Warning, modifier = Modifier.size(14.dp))
                }
            }
            Text(
                text = review.comment?.takeIf { it.isNotBlank() } ?: "No comment provided.",
                style = MaterialTheme.typography.bodyMedium,
                color = LocalHayameColors.current.mutedText,
            )
        }
    }
}

private data class BookingCalendarMonthUi(
    val title: String,
    val weeks: List<List<LocalDate?>>,
)

@Composable
internal fun AvailabilityCalendarDialog(
    title: String,
    selectedDate: LocalDate,
    minimumDate: LocalDate,
    blockedDates: Set<LocalDate>,
    selectionRange: ClosedRange<LocalDate>?,
    canSelectDate: (LocalDate) -> Boolean,
    onDismiss: () -> Unit,
    onDateSelected: (LocalDate) -> Unit,
) {
    val darkMode = LocalDarkMode.current
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
            color = LocalHayameColors.current.cardBackground,
            shape = RoundedCornerShape(28.dp),
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
                        color = if (darkMode) Color.White else LocalHayameColors.current.brandNavy,
                    )
                    Spacer(modifier = Modifier.weight(1f))
                    TextButton(onClick = onDismiss) {
                        Text("Done")
                    }
                }

                Text(
                    text = "Unavailable days are crossed out. Only bookable dates can be selected.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (darkMode) Color.White.copy(alpha = 0.7f) else LocalHayameColors.current.mutedText,
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
                            color = if (darkMode) Color.White else LocalHayameColors.current.brandNavy,
                        )

                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            weekdayLabels.forEach { weekday ->
                                Text(
                                    text = weekday,
                                    modifier = Modifier.weight(1f),
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = if (darkMode) Color.White.copy(alpha = 0.62f) else LocalHayameColors.current.mutedText,
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
                                                selected -> LocalHayameColors.current.brandBlue
                                                inRange && selectable -> LocalHayameColors.current.brandBlue.copy(alpha = 0.14f)
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
                                                        blocked || !selectable -> if (darkMode) Color.White.copy(alpha = 0.42f) else LocalHayameColors.current.mutedText.copy(alpha = 0.6f)
                                                        darkMode -> Color.White
                                                        else -> LocalHayameColors.current.brandNavy
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
internal fun SelectionField(
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
            color = LocalHayameColors.current.fieldBackground,
            shape = RoundedCornerShape(14.dp),
            border = BorderStroke(1.dp, LocalHayameColors.current.border),
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
                    color = if (selected.isBlank()) LocalHayameColors.current.mutedText else LocalHayameColors.current.brandBlue,
                    fontWeight = FontWeight.SemiBold,
                )
                Icon(Icons.Outlined.ExpandMore, contentDescription = null, tint = LocalHayameColors.current.brandBlue)
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
                // Fullscreen is a deliberate zoom — request a higher-res variant than
                // the card size the URL was originally resolved at.
                val fullResUrl = RemoteImageUrlResolver.transformed(
                    RemoteImageUrlResolver.originalUrl(imageUrls[page]),
                    width = 1400,
                )
                AsyncImage(
                    model = fullResUrl,
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

            // Brand watermark — white Hayame logo, centered over the image at low opacity.
            Image(
                painter = painterResource(id = R.drawable.hayame_logo_white),
                contentDescription = null,
                contentScale = ContentScale.Fit,
                modifier = Modifier
                    .align(Alignment.Center)
                    .width(150.dp)
                    .alpha(0.16f),
            )
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
            tint = LocalHayameColors.current.brandBlue,
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
            title = { Text(title, color = LocalHayameColors.current.brandNavy, fontWeight = FontWeight.Bold) },
            text = { Text(message, color = LocalHayameColors.current.mutedText) },
        )
    }
}

@Composable
internal fun CheckoutTopBar(
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

@Composable
internal fun CheckoutStepCard(
    content: @Composable ColumnScope.() -> Unit,
) {
    Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = LocalHayameColors.current.cardBackground),
        border = BorderStroke(1.dp, LocalHayameColors.current.border),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            content = content,
        )
    }
}

internal fun parseApiDate(value: String?): LocalDate? {
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

/**
 * [minimumNights] is the listing's shortest trip ([CarDto.minimumTripDays]):
 * a start day only counts as bookable when that many nights after it are free.
 */
internal fun isBookableStartDate(date: LocalDate, blockedDates: Set<LocalDate>, minimumNights: Int = 1): Boolean {
    return !date.isBefore(LocalDate.now()) &&
        isContinuousBookingRangeAvailable(
            startDate = date,
            endDate = date.plusDays(minimumNights.coerceAtLeast(1).toLong()),
            blockedDates = blockedDates,
        )
}

internal fun isBookableEndDate(date: LocalDate, startDate: LocalDate, blockedDates: Set<LocalDate>, minimumNights: Int = 1): Boolean {
    val earliestEnd = startDate.plusDays(minimumNights.coerceAtLeast(1).toLong())
    return !date.isBefore(earliestEnd) &&
        isContinuousBookingRangeAvailable(
            startDate = startDate,
            endDate = date,
            blockedDates = blockedDates,
        )
}

internal fun preferredBookingEndDate(
    currentEnd: LocalDate,
    startDate: LocalDate,
    blockedDates: Set<LocalDate>,
    minimumNights: Int = 1,
): LocalDate? {
    if (isBookableEndDate(currentEnd, startDate, blockedDates, minimumNights)) {
        return currentEnd
    }

    val fallback = startDate.plusDays(minimumNights.coerceAtLeast(1).toLong())
    return if (isContinuousBookingRangeAvailable(startDate, fallback, blockedDates)) fallback else null
}

internal fun nextBookableStartDate(
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

internal data class PaystackCallbackResult(
    val reference: String?,
    val isCancelled: Boolean,
)

internal fun parsePaystackCallback(callbackUri: String?): PaystackCallbackResult {
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

private fun CarDto.listingBadgeText(): String? {
    val hasReviews = (reviews_count ?: 0.0) > 0
    if (hasReviews) return String.format(Locale.US, "%.1f", avg_rating ?: 0.0)
    return if (isNewListing(created_at)) "New" else null
}

internal fun isNewListing(createdAt: String?): Boolean {
    if (createdAt.isNullOrBlank()) return false
    return try {
        val createdDate = LocalDate.parse(createdAt.take(10), DateTimeFormatter.ISO_LOCAL_DATE)
        ChronoUnit.DAYS.between(createdDate, LocalDate.now()) in 0..7
    } catch (_: DateTimeParseException) {
        false
    }
}
@Composable
fun BecomeHostScreen(
    viewModel: AppViewModel,
    onBack: () -> Unit,
    onOpenAuth: () -> Unit = {},
    onOpenHostDashboard: () -> Unit = {},
    onSubmissionCompleted: () -> Unit = onBack,
) {
    val colors = LocalHayameColors.current
    val context = LocalContext.current
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val me by viewModel.me.collectAsState()
    val application = me?.host_application
    val applicationStatus = (application?.status ?: me?.host_application_status ?: me?.host_status)
        ?.trim()
        ?.lowercase()
        .orEmpty()
    val isApproved = me?.is_host == true || applicationStatus == "approved"
    val isPending = applicationStatus == "pending"

    var fullName by rememberSaveable { mutableStateOf("") }
    var phone by rememberSaveable { mutableStateOf("") }
    var region by rememberSaveable { mutableStateOf(AndroidReferenceData.defaultRegion) }
    var city by rememberSaveable { mutableStateOf("Accra") }
    var idType by rememberSaveable { mutableStateOf("Ghana Card") }
    var idNumber by rememberSaveable { mutableStateOf("") }
    var experience by rememberSaveable { mutableStateOf("") }
    var fleetSize by rememberSaveable { mutableStateOf(1) }
    var note by rememberSaveable { mutableStateOf("") }
    var didPrefill by rememberSaveable { mutableStateOf(false) }
    var idFrontUri by remember { mutableStateOf<Uri?>(null) }
    var idBackUri by remember { mutableStateOf<Uri?>(null) }
    var faceUri by remember { mutableStateOf<Uri?>(null) }
    var idFrontFile by remember { mutableStateOf<File?>(null) }
    var idBackFile by remember { mutableStateOf<File?>(null) }
    var faceFile by remember { mutableStateOf<File?>(null) }
    var isSubmitting by rememberSaveable { mutableStateOf(false) }
    var submissionError by rememberSaveable { mutableStateOf<String?>(null) }
    var showSuccessDialog by rememberSaveable { mutableStateOf(false) }

    val idFrontPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri ?: return@rememberLauncherForActivityResult
        idFrontFile?.delete()
        idFrontUri = uri
        idFrontFile = copyUriToTempFile(context, uri, "host-id-front")
        if (idFrontFile == null) submissionError = "Unable to process selected image."
    }
    val idBackPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri ?: return@rememberLauncherForActivityResult
        idBackFile?.delete()
        idBackUri = uri
        idBackFile = copyUriToTempFile(context, uri, "host-id-back")
        if (idBackFile == null) submissionError = "Unable to process selected image."
    }
    val facePicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri ?: return@rememberLauncherForActivityResult
        faceFile?.delete()
        faceUri = uri
        faceFile = copyUriToTempFile(context, uri, "host-face")
        if (faceFile == null) submissionError = "Unable to process selected image."
    }

    val cityOptions = remember(region, city) {
        buildList {
            city.trim().takeIf { it.isNotBlank() }?.let(::add)
            AndroidReferenceData.districtsByRegion[region].orEmpty().forEach(::add)
        }.distinctBy { it.lowercase(Locale.US) }
    }
    val existingFrontPath = application?.id_front_path?.trim().orEmpty()
    val existingBackPath = application?.id_back_path?.trim().orEmpty()

    val blockingReason = when {
        !isAuthenticated -> "Sign in to submit your host application."
        isPending -> "Your application is under review."
        isSubmitting -> "Please wait for uploads to finish."
        fullName.trim().length < 2 -> "Enter your full name (at least 2 characters)."
        phone.count(Char::isDigit) < 6 -> "Enter a valid phone number (at least 6 digits)."
        region.trim().length < 2 || city.trim().length < 2 -> "Select your region and city."
        idType.isBlank() -> "Select an ID type."
        idNumber.trim().length < 4 -> "Enter your ID number (at least 4 characters)."
        idFrontFile == null && existingFrontPath.isBlank() -> "Upload your ID front image."
        idBackFile == null && existingBackPath.isBlank() -> "Upload your ID back image."
        experience.trim().length < 3 -> "Add a short hosting experience (at least 3 characters)."
        else -> null
    }

    LaunchedEffect(Unit) {
        viewModel.loadHostStatus()
    }

    LaunchedEffect(me, application?.id) {
        if (didPrefill || me == null) return@LaunchedEffect
        fullName = application?.full_name ?: me.preferredFullName().orEmpty()
        phone = application?.phone ?: me.preferredPhone().orEmpty()
        region = application?.region ?: me.preferredRegion()?.takeIf { it.isNotBlank() }
            ?: AndroidReferenceData.defaultRegion
        city = application?.city ?: me.preferredCity()?.takeIf { it.isNotBlank() } ?: "Accra"
        idType = application?.id_type ?: "Ghana Card"
        idNumber = application?.id_number.orEmpty()
        experience = application?.experience.orEmpty()
        fleetSize = application?.fleet_size?.roundToInt()?.coerceIn(1, 50) ?: 1
        note = application?.note.orEmpty()
        didPrefill = true
    }

    DisposableEffect(Unit) {
        onDispose {
            idFrontFile?.delete()
            idBackFile?.delete()
            faceFile?.delete()
        }
    }

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = {
            PageTopBar(title = "Become Host", onBack = onBack)
        },
    ) { inner ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(inner).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item { SectionHeader("Become Host") }
            item {
                Text("Apply to list your cars", style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
                Text(
                    "We verify every host to keep the marketplace safe. Applications are typically reviewed within 1-2 business days.",
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.mutedText,
                )
            }

            if (application != null || applicationStatus.isNotBlank()) {
                item {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                        border = BorderStroke(1.dp, colors.border),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text("Status", fontWeight = FontWeight.SemiBold, color = colors.brandNavy)
                            Spacer(modifier = Modifier.weight(1f))
                            Text(
                                applicationStatus.ifBlank { "pending" }.replaceFirstChar { it.uppercase() },
                                fontWeight = FontWeight.Bold,
                                color = if (isApproved) colors.success else colors.warning,
                            )
                        }
                    }
                }
                if (isApproved) {
                    item {
                        GradientPillButton(
                            text = "Open Host Dashboard",
                            modifier = Modifier.fillMaxWidth(),
                            onClick = onOpenHostDashboard,
                        )
                    }
                } else if (isPending) {
                    item {
                        Text(
                            "Your application is pending review. You will get host access once approved.",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.warning,
                        )
                    }
                }
            }

            if (!isAuthenticated) {
                item { EmptyBlock("Log in required", "Sign in to submit your host application.") }
                item {
                    GradientPillButton(
                        text = "Log in",
                        modifier = Modifier.fillMaxWidth(),
                        onClick = onOpenAuth,
                    )
                }
            } else if (!isPending && !isApproved) {
                item {
                    OutlinedTextField(
                        value = fullName,
                        onValueChange = { fullName = it },
                        label = { Text("Full name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                    )
                }
                item {
                    OutlinedTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        label = { Text("Phone") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        shape = RoundedCornerShape(12.dp),
                    )
                }
                item {
                    SelectionField(
                        selected = region,
                        placeholder = "Region",
                        options = AndroidReferenceData.regionsIncluding(region),
                        onSelected = { selected ->
                            region = selected
                            val availableCities = AndroidReferenceData.districtsByRegion[selected].orEmpty()
                            if (availableCities.none { it.equals(city, ignoreCase = true) }) {
                                city = availableCities.firstOrNull().orEmpty()
                            }
                        },
                    )
                }
                item {
                    SelectionField(
                        selected = city,
                        placeholder = "City",
                        options = cityOptions,
                        onSelected = { city = it },
                    )
                }
                item {
                    SelectionField(
                        selected = idType,
                        placeholder = "ID type",
                        options = listOf("Ghana Card", "NHIS", "Voters ID", "Driving Licence"),
                        onSelected = { idType = it },
                    )
                }
                item {
                    OutlinedTextField(
                        value = idNumber,
                        onValueChange = { idNumber = it },
                        label = { Text("ID number") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                    )
                }
                item {
                    OutlinedTextField(
                        value = experience,
                        onValueChange = { experience = it },
                        label = { Text("Hosting experience") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 3,
                        maxLines = 6,
                        shape = RoundedCornerShape(12.dp),
                    )
                }
                item {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                        border = BorderStroke(1.dp, colors.border),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text("Fleet size: $fleetSize", modifier = Modifier.weight(1f), fontWeight = FontWeight.SemiBold, color = colors.brandNavy)
                            TextButton(onClick = { fleetSize = (fleetSize - 1).coerceAtLeast(1) }) { Text("−") }
                            TextButton(onClick = { fleetSize = (fleetSize + 1).coerceAtMost(50) }) { Text("+") }
                        }
                    }
                }
                item {
                    OutlinedTextField(
                        value = note,
                        onValueChange = { note = it },
                        label = { Text("Notes (optional)") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2,
                        maxLines = 5,
                        shape = RoundedCornerShape(12.dp),
                    )
                }
                item {
                    HostApplicationPhotoCard(
                        title = "ID front image",
                        guidance = "Upload your ID front image.",
                        actionLabel = if (idFrontFile != null || existingFrontPath.isNotBlank()) "Replace ID front" else "Upload ID front",
                        selectedUri = idFrontUri,
                        isSelected = idFrontFile != null || existingFrontPath.isNotBlank(),
                        onChoose = { idFrontPicker.launch("image/*") },
                    )
                }
                item {
                    HostApplicationPhotoCard(
                        title = "ID back image",
                        guidance = "Upload your ID back image.",
                        actionLabel = if (idBackFile != null || existingBackPath.isNotBlank()) "Replace ID back" else "Upload ID back",
                        selectedUri = idBackUri,
                        isSelected = idBackFile != null || existingBackPath.isNotBlank(),
                        onChoose = { idBackPicker.launch("image/*") },
                    )
                }
                item {
                    HostApplicationPhotoCard(
                        title = "Face photo",
                        guidance = "Use a clear selfie that matches your ID.",
                        actionLabel = "Upload face photo",
                        selectedUri = faceUri,
                        fallbackImageUrl = me.preferredAvatarRaw(),
                        isSelected = faceFile != null || !me.preferredAvatarRaw().isNullOrBlank(),
                        onChoose = { facePicker.launch("image/*") },
                    )
                }
                if (!submissionError.isNullOrBlank()) {
                    item { Text(submissionError.orEmpty(), color = colors.danger, fontWeight = FontWeight.SemiBold) }
                }
                if (!blockingReason.isNullOrBlank()) {
                    item { Text(blockingReason.orEmpty(), color = colors.warning, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold) }
                }
                item {
                    GradientPillButton(
                        text = if (isSubmitting) "Submitting..." else "Submit application",
                        modifier = Modifier.fillMaxWidth().alpha(if (blockingReason == null) 1f else 0.55f),
                        onClick = {
                            val userId = me?.user?.id ?: return@GradientPillButton
                            if (blockingReason != null) return@GradientPillButton
                            isSubmitting = true
                            submissionError = null
                            viewModel.submitHostApplicationWithDocuments(
                                userId = userId,
                                front = idFrontFile,
                                back = idBackFile,
                                existingFrontPath = existingFrontPath,
                                existingBackPath = existingBackPath,
                                face = faceFile,
                                requestBuilder = { frontPath, backPath ->
                                    HostApplicationRequest(
                                        full_name = fullName.trim(),
                                        phone = phone.trim(),
                                        region = region.trim(),
                                        city = city.trim(),
                                        id_type = idType.trim(),
                                        id_number = idNumber.trim(),
                                        id_front_path = frontPath,
                                        id_back_path = backPath,
                                        note = note.trim().takeIf { it.isNotBlank() },
                                        experience = experience.trim(),
                                        fleet_size = fleetSize,
                                    )
                                },
                                onResult = { error ->
                                    isSubmitting = false
                                    submissionError = error
                                    if (error == null) showSuccessDialog = true
                                },
                            )
                        },
                    )
                }
            }
            item { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }

    if (showSuccessDialog) {
        AlertDialog(
            onDismissRequest = {},
            title = { Text("Application submitted") },
            text = { Text("Your host request is being reviewed. We will email you once there is an update.") },
            confirmButton = {
                Button(onClick = {
                    showSuccessDialog = false
                    onSubmissionCompleted()
                }) { Text("Go to dashboard") }
            },
        )
    }
}

@Composable
private fun HostApplicationPhotoCard(
    title: String,
    guidance: String,
    actionLabel: String,
    selectedUri: Uri?,
    fallbackImageUrl: String? = null,
    isSelected: Boolean,
    onChoose: () -> Unit,
) {
    val colors = LocalHayameColors.current
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
        border = BorderStroke(1.dp, colors.border),
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(title, style = MaterialTheme.typography.labelLarge, color = colors.mutedText, fontWeight = FontWeight.SemiBold)
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                if (selectedUri != null || !fallbackImageUrl.isNullOrBlank()) {
                    AsyncImage(
                        model = selectedUri ?: resolveAppImage(fallbackImageUrl),
                        contentDescription = "$title preview",
                        modifier = Modifier.size(64.dp).clip(CircleShape).border(1.dp, colors.controlStroke, CircleShape),
                        contentScale = ContentScale.Crop,
                    )
                } else {
                    Box(
                        modifier = Modifier.size(64.dp).background(colors.brandLight, CircleShape).border(1.dp, colors.controlStroke, CircleShape),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Outlined.Person, contentDescription = null, tint = colors.brandNavy)
                    }
                }
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(guidance, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
                    SecondaryPillButton(text = actionLabel, onClick = onChoose)
                }
            }
            if (isSelected) {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.Check, contentDescription = null, tint = colors.success, modifier = Modifier.size(16.dp))
                    Text("Selected", color = colors.success, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                }
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
    var allowOneDayBooking by rememberSaveable(carId) { mutableStateOf(false) }
    var withDriver by rememberSaveable(carId) { mutableStateOf(false) }
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
        withCurrentOption(AndroidReferenceData.carTypes, carType)
    }
    val transmissionOptions = remember { AndroidReferenceData.transmissions }
    val fuelOptions = remember { AndroidReferenceData.fuels }
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
            allowOneDayBooking = allowOneDayBooking,
            withDriver = withDriver,
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
        allowOneDayBooking = draft.allowOneDayBooking
        withDriver = draft.withDriver
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
                    // Never surface the raw image/file exception text.
                    failures += "Unable to prepare one of the selected images."
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
            allowOneDayBooking = existingCar.allow_one_day_booking == true
            withDriver = existingCar.with_driver == true
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
        allowOneDayBooking,
        withDriver,
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
            put("allow_one_day_booking", allowOneDayBooking)
            put("with_driver", withDriver)
            put("air_conditioning", airConditioning)
            put("delivery_fee", if (deliveryAvailable) parsedDeliveryFee else 0)
            put("insurance_fee", parsedInsuranceFee)
            put("deposit_amount", parsedDepositAmount)
            put("outside_accra_fee", parsedOutsideAccraFee)
            put("cancellation_policy", normalizedCancellation.lowercase())
            // Instant Book and delivery are their own fields above; only real
            // vehicle features belong in this list or the server rejects it.
            put("features", buildJsonArray {
                if (airConditioning) add(JsonPrimitive("Air Conditioning"))
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

    // System back steps back through the editor instead of discarding it.
    BackHandler(enabled = currentStep != HostListingEditorStep.BASIC_INFO) { handleBackAction() }

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
                            Text("Save Draft", color = LocalHayameColors.current.brandBlue, fontWeight = FontWeight.Bold)
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
                                        color = LocalHayameColors.current.mutedText,
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
                                        color = LocalHayameColors.current.mutedText,
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
                                        color = LocalHayameColors.current.mutedText,
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
                                    // Booking options sit next to the price so hosts cannot miss them.
                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(18.dp))
                                            .background(LocalHayameColors.current.brandBlue.copy(alpha = 0.06f))
                                            .border(1.dp, LocalHayameColors.current.brandBlue.copy(alpha = 0.25f), RoundedCornerShape(18.dp))
                                            .padding(14.dp),
                                        verticalArrangement = Arrangement.spacedBy(12.dp),
                                    ) {
                                        Text(
                                            text = "Booking options",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = LocalHayameColors.current.brandNavy,
                                        )
                                        Text(
                                            text = "Shown on the listing so guests know before they book.",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = LocalHayameColors.current.mutedText,
                                        )
                                        HostToggleRow(
                                            label = "Allow 1-day bookings",
                                            checked = allowOneDayBooking,
                                            helpTitle = "1-day bookings",
                                            helpMessage = "When this is on, guests can book this car for one day: pick-up at the 10:00 AM hand-off and return at the same time the next day. When it's off, every trip must be at least 2 days. The listing shows which one applies.",
                                        ) { allowOneDayBooking = it }
                                        HorizontalDivider(color = LocalHayameColors.current.border)
                                        HostToggleRow(
                                            label = "Comes with a driver",
                                            checked = withDriver,
                                            helpTitle = "With driver",
                                            helpMessage = "Turn this on if the car is only rented with a driver (chauffeur service). Guests see a \"With driver\" tag on the listing and will not expect to drive themselves.",
                                        ) { withDriver = it }
                                    }
                                    Text(
                                        text = "Optional add-ons",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = LocalHayameColors.current.brandNavy,
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
                                        color = LocalHayameColors.current.mutedText,
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
                                            color = LocalHayameColors.current.mutedText,
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
                                        color = LocalHayameColors.current.brandNavy,
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
                                        color = LocalHayameColors.current.mutedText,
                                    )
                                    if (isCreate) {
                                        if (pendingUploads.isEmpty()) {
                                            Box(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .height(180.dp)
                                                    .background(LocalHayameColors.current.brandLight, RoundedCornerShape(20.dp)),
                                                contentAlignment = Alignment.Center,
                                            ) {
                                                Text("No photos selected yet.", color = LocalHayameColors.current.mutedText)
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
                                                color = LocalHayameColors.current.mutedText,
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
                                    if (allowOneDayBooking) "1-day bookings allowed" else "2-day minimum trip",
                                    if (withDriver) "Comes with a driver" else "Self-drive",
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
                                            color = LocalHayameColors.current.brandNavy,
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
                                        color = LocalHayameColors.current.mutedText,
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
                                    color = LocalHayameColors.current.brandNavy,
                                )
                                Text(
                                    text = "Blocked dates remain in the availability editor after you save changes.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = LocalHayameColors.current.mutedText,
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
fun HostReviewsScreen(viewModel: AppViewModel, onBack: () -> Unit) {
    val state by viewModel.hostReviewsListState.collectAsState()
    val colors = LocalHayameColors.current
    LaunchedEffect(Unit) { viewModel.loadHostReviews() }
    val reviews = (state as? UiState.Success<List<ReviewDto>>)?.data.orEmpty()
        .sortedByDescending { it.created_at.orEmpty() }
    val average = if (reviews.isEmpty()) 0.0 else reviews.sumOf { it.rating ?: 0.0 } / reviews.size

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = { PageTopBar(title = "Host Reviews", onBack = onBack) },
    ) { inner ->
        HayameRefreshBox(
            onRefresh = { viewModel.loadHostReviews() },
            modifier = Modifier.fillMaxSize(),
            indicatorTopPadding = inner.calculateTopPadding(),
        ) {
        LazyColumn(
                modifier = Modifier.fillMaxSize().background(colors.pageBackground).padding(inner),
                contentPadding = PaddingValues(16.dp),
            ) {
                item(key = "header") {
                    StaggeredAppear(index = 0) {
                        Column(verticalArrangement = Arrangement.spacedBy(3.dp), modifier = Modifier.padding(bottom = 16.dp)) {
                            Text("Guest feedback", fontSize = 30.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                            Text(
                                if (reviews.isEmpty()) "Reviews from completed trips show up here."
                                else "${String.format("%.1f", average)} average across ${reviews.size} ${if (reviews.size == 1) "review" else "reviews"}",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.SemiBold,
                                color = colors.mutedText,
                            )
                        }
                    }
                }
                when (val s = state) {
                    UiState.Loading, UiState.Idle -> items(4, key = { "skeleton-$it" }) {
                        Row(modifier = Modifier.padding(vertical = 14.dp), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                            HayameShimmerBlock(modifier = Modifier.size(44.dp), cornerRadius = 22.dp)
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                HayameShimmerBlock(modifier = Modifier.width(140.dp).height(14.dp))
                                HayameShimmerBlock(modifier = Modifier.width(220.dp).height(12.dp))
                            }
                        }
                    }
                    is UiState.Error -> item(key = "error") { ErrorBlock(s.message, onRetry = { viewModel.loadHostReviews() }) }
                    UiState.Empty -> item(key = "empty") { StaggeredAppear(index = 1) { HostReviewsEmptyState() } }
                    is UiState.Success -> {
                        if (reviews.isEmpty()) {
                            item(key = "empty") { StaggeredAppear(index = 1) { HostReviewsEmptyState() } }
                        } else {
                            item(key = "summary") {
                                StaggeredAppear(index = 1) { HostReviewsSummary(reviews = reviews, average = average) }
                            }
                            itemsIndexed(reviews, key = { _, review -> review.id }) { index, review ->
                                StaggeredAppear(index = minOf(index, 8) + 2) {
                                    Column {
                                        HostReviewRow(review)
                                        if (index < reviews.size - 1) {
                                            HorizontalDivider(color = colors.border, modifier = Modifier.padding(start = 58.dp))
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
private fun HostReviewsSummary(reviews: List<ReviewDto>, average: Double) {
    val colors = LocalHayameColors.current
    var revealed by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { revealed = true }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp)
            .clip(RoundedCornerShape(20.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(20.dp))
            .padding(16.dp),
        horizontalArrangement = Arrangement.spacedBy(18.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(String.format("%.1f", average), fontSize = 44.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy)
            HostStarRow(rating = average, size = 14.dp)
            Text("${reviews.size} ${if (reviews.size == 1) "review" else "reviews"}", style = MaterialTheme.typography.labelLarge, color = colors.mutedText)
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(7.dp)) {
            (5 downTo 1).forEach { stars ->
                val count = reviews.count { (it.rating ?: 0.0).roundToInt() == stars }
                val fraction by animateFloatAsState(
                    targetValue = if (revealed) count.toFloat() / reviews.size.coerceAtLeast(1) else 0f,
                    animationSpec = tween(700, delayMillis = 150 + (5 - stars) * 60),
                    label = "review-bar-$stars",
                )
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("$stars", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = colors.mutedText, modifier = Modifier.width(10.dp))
                    Box(modifier = Modifier.weight(1f).height(7.dp).clip(CircleShape).background(colors.fieldBackground)) {
                        Box(modifier = Modifier.fillMaxHeight().fillMaxWidth(fraction).clip(CircleShape).background(colors.brandBlue))
                    }
                    Text("$count", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy, modifier = Modifier.width(18.dp))
                }
            }
        }
    }
}

@Composable
private fun HostReviewRow(review: ReviewDto) {
    val colors = LocalHayameColors.current
    val name = review.reviewer?.full_name?.takeIf { it.isNotBlank() } ?: "Hayame guest"
    val dateLabel = review.created_at?.take(10)?.let { raw ->
        runCatching { LocalDate.parse(raw).format(DateTimeFormatter.ofPattern("d MMM yyyy")) }.getOrNull()
    }.orEmpty()
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 14.dp), horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.Top) {
        Box(modifier = Modifier.size(44.dp).background(colors.brandLight, CircleShape), contentAlignment = Alignment.Center) {
            Text(avatarInitials(name, "G"), style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                Text(dateLabel, style = MaterialTheme.typography.labelMedium, color = colors.mutedText)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                HostStarRow(rating = review.rating ?: 0.0, size = 11.dp)
                review.cars?.title?.takeIf { it.isNotBlank() }?.let { title ->
                    Icon(Icons.Outlined.DirectionsCar, contentDescription = null, tint = colors.mutedText, modifier = Modifier.size(12.dp))
                    Text(title, style = MaterialTheme.typography.labelLarge, color = colors.mutedText, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
            review.comment?.takeIf { it.isNotBlank() }?.let { comment ->
                Text(comment, style = MaterialTheme.typography.bodyLarge, color = colors.brandNavy.copy(alpha = 0.88f))
            }
        }
    }
}

@Composable
private fun HostStarRow(rating: Double, size: androidx.compose.ui.unit.Dp) {
    val colors = LocalHayameColors.current
    Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
        (1..5).forEach { star ->
            val filled = rating - (star - 1) >= 0.5
            Icon(
                if (filled) Icons.Filled.Star else Icons.Outlined.StarBorder,
                contentDescription = null,
                tint = if (filled) colors.brandBlue else colors.mutedText.copy(alpha = 0.45f),
                modifier = Modifier.size(size),
            )
        }
    }
}

@Composable
private fun HostReviewsEmptyState() {
    val colors = LocalHayameColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(22.dp))
            .padding(horizontal = 24.dp, vertical = 36.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(modifier = Modifier.size(84.dp).background(colors.warning.copy(alpha = 0.14f), CircleShape), contentAlignment = Alignment.Center) {
            Icon(Icons.Outlined.StarBorder, contentDescription = null, tint = colors.warning, modifier = Modifier.size(34.dp))
        }
        Text("No reviews yet", fontSize = 19.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy)
        Text(
            "Guests can leave a rating after a completed trip. Clear handoffs and a clean car earn the best ones.",
            style = MaterialTheme.typography.bodyLarge,
            color = colors.mutedText,
            textAlign = TextAlign.Center,
        )
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
fun SupportLegalScreen(
    onBack: () -> Unit,
    onOpenContact: () -> Unit = {},
    onOpenPrivacy: () -> Unit = {},
    onOpenProtection: () -> Unit = {},
    onOpenCancellation: () -> Unit = {},
    onOpenMarketing: () -> Unit = {},
) {
    val colors = LocalHayameColors.current
    Scaffold(
        containerColor = colors.pageBackground,
        topBar = {
            PageTopBar(title = "Support & Legal", onBack = onBack)
        },
    ) { inner ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(inner).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                    border = BorderStroke(1.dp, colors.border),
                ) {
                    Column(modifier = Modifier.padding(8.dp)) {
                        ActionRow("Contact", Icons.Outlined.MailOutline, onOpenContact)
                        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = colors.border)
                        ActionRow("Privacy", Icons.Outlined.Person, onOpenPrivacy)
                        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = colors.border)
                        ActionRow("Protection", Icons.Outlined.Shield, onOpenProtection)
                        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = colors.border)
                        ActionRow("Cancellation", Icons.Outlined.CalendarMonth, onOpenCancellation)
                        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = colors.border)
                        ActionRow("Marketing pages", Icons.Outlined.Search, onOpenMarketing)
                    }
                }
            }
        }
    }
}


@Composable
fun PageTopBar(title: String, onBack: (() -> Unit)? = null) {
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

data class HostMonthlyBucket(
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
    val allowOneDayBooking: Boolean = false,
    val withDriver: Boolean = false,
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

fun resolveAppImage(raw: String?): String? = RemoteImageUrlResolver.resolve(raw)


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
fun RemoteAvatar(
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
        modifier = modifier.background(LocalHayameColors.current.brandLight, CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = initials,
            style = textStyle,
            fontWeight = FontWeight.Bold,
            color = LocalHayameColors.current.brandNavy,
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

fun isHostBooking(booking: BookingDto, currentUserId: String): Boolean {
    return booking.role.orEmpty().contains("owner", ignoreCase = true) ||
        (!currentUserId.isBlank() && booking.cars?.owner_id == currentUserId)
}

fun bookingMonthKey(raw: String?): String? {
    val parsed = parseApiLocalDate(raw) ?: return null
    return parsed.format(DateTimeFormatter.ofPattern("yyyy-MM"))
}

private fun parseApiLocalDate(raw: String?): LocalDate? {
    val value = raw?.trim().orEmpty()
    if (value.isBlank()) return null
    return runCatching { LocalDate.parse(value.take(10)) }.getOrNull()
}

fun buildHostMonthlySeries(bookings: List<BookingDto>): List<HostMonthlyBucket> {
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
            color = LocalHayameColors.current.brandNavy,
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
        colors = CardDefaults.cardColors(containerColor = LocalHayameColors.current.cardBackground),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text(
                text = "Step ${currentStep.ordinal + 1} of ${HostListingEditorStep.entries.size}",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold,
                color = LocalHayameColors.current.brandBlue,
            )
            Text(
                text = currentStep.title,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.ExtraBold,
                color = LocalHayameColors.current.brandNavy,
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
                            color = if (step.ordinal <= currentStep.ordinal) LocalHayameColors.current.brandBlue else Color.White,
                            shape = RoundedCornerShape(999.dp),
                            border = BorderStroke(
                                1.dp,
                                if (step.ordinal <= currentStep.ordinal) LocalHayameColors.current.brandBlue else LocalHayameColors.current.border,
                            ),
                        ) {}
                        Text(
                            text = step.shortTitle,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (step == currentStep) LocalHayameColors.current.brandBlue else LocalHayameColors.current.mutedText,
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
        Text(text = title, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold, color = LocalHayameColors.current.brandNavy)
        Text(text = subtitle, style = MaterialTheme.typography.bodyMedium, color = LocalHayameColors.current.mutedText)
    }
}

@Composable
private fun HostListingStepCard(content: @Composable ColumnScope.() -> Unit) {
    Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = LocalHayameColors.current.cardBackground),
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
        Text(text = "Daily price", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = LocalHayameColors.current.brandNavy)
        Surface(
            color = LocalHayameColors.current.brandLight,
            shape = RoundedCornerShape(22.dp),
            border = BorderStroke(1.dp, LocalHayameColors.current.brandBlue.copy(alpha = 0.14f)),
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 18.dp, vertical = 18.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text("GHS", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = LocalHayameColors.current.brandBlue)
                OutlinedTextField(
                    value = value,
                    onValueChange = { onValueChange(it.filter(Char::isDigit)) },
                    modifier = Modifier.weight(1f),
                    textStyle = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.ExtraBold, color = LocalHayameColors.current.brandNavy),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    shape = RoundedCornerShape(16.dp),
                )
                Text("/ day", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = LocalHayameColors.current.mutedText)
            }
        }
        Text(text = suggestionText, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = LocalHayameColors.current.brandBlue)
        Text(
            text = "This is the main number guests notice first, so keep it competitive and easy to justify.",
            style = MaterialTheme.typography.bodyMedium,
            color = LocalHayameColors.current.mutedText,
        )
    }
}

@Composable
private fun HostSeatsStepper(seats: Int, onSeatsChange: (Int) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(text = "Seats", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = LocalHayameColors.current.brandNavy)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(LocalHayameColors.current.brandLight, RoundedCornerShape(16.dp))
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
                color = LocalHayameColors.current.brandBlue,
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
                        .background(colors.brandBlue, RoundedCornerShape(18.dp))
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
            Text(text = title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = LocalHayameColors.current.brandNavy, modifier = Modifier.weight(1f))
            TextButton(onClick = onEdit) {
                Text("Edit")
            }
        }
        lines.filter { it.isNotBlank() }.forEach { line ->
            Text(text = line, style = MaterialTheme.typography.bodyMedium, color = LocalHayameColors.current.mutedText)
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
                            .background(LocalHayameColors.current.brandLight)
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
                                .background(if (index == 0) LocalHayameColors.current.brandBlue else Color.Black.copy(alpha = 0.58f), RoundedCornerShape(999.dp))
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

// ─────────────────────────────────────────────────────────────────────────────
// Host Public Profile Screen
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun HostPublicProfileScreen(
    viewModel: AppViewModel,
    ownerId: String,
    onBack: () -> Unit,
    onOpenCarDetail: (String) -> Unit,
) {
    val colors = LocalHayameColors.current
    val carsState by viewModel.carsState.collectAsState()

    LaunchedEffect(Unit) { viewModel.loadCars(mapOf("limit" to "100")) }

    val hostCars = (carsState as? UiState.Success<List<CarDto>>)?.data
        .orEmpty()
        .filter { it.owner_id == ownerId }

    val hostName = hostCars.firstOrNull()?.let {
        it.host_name ?: it.owner?.full_name
    } ?: "Host"
    val hostAvatar = hostCars.firstOrNull()?.let {
        it.host_avatar ?: it.owner?.avatar_url
    }
    val idVerified = hostCars.firstOrNull()?.let {
        it.id_verified == true || it.owner?.id_verified == true
    } ?: false
    val phoneVerified = hostCars.firstOrNull()?.let {
        it.phone_verified == true || it.owner?.phone_verified == true
    } ?: false
    val emailVerified = hostCars.firstOrNull()?.let {
        it.email_verified == true || it.owner?.email_verified == true
    } ?: false

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = { PageTopBar(title = "Host", onBack = onBack) },
    ) { inner ->
        HayameRefreshBox(
            onRefresh = { viewModel.loadCars(mapOf("limit" to "100")) },
            modifier = Modifier.fillMaxSize(),
            indicatorTopPadding = inner.calculateTopPadding(),
        ) {
        LazyColumn(
                modifier = Modifier.fillMaxSize().padding(inner).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        val avatarUrl = RemoteImageUrlResolver.resolve(hostAvatar)
                        if (!avatarUrl.isNullOrBlank()) {
                            AsyncImage(
                                model = avatarUrl,
                                contentDescription = null,
                                modifier = Modifier.size(54.dp).clip(CircleShape),
                                contentScale = ContentScale.Crop,
                            )
                        } else {
                            val initials = hostName.split(" ").take(2)
                                .mapNotNull { it.firstOrNull()?.toString() }
                                .joinToString("").uppercase().ifEmpty { "H" }
                            Box(
                                modifier = Modifier
                                    .size(54.dp)
                                    .background(colors.brandLight, CircleShape)
                                    .border(1.dp, colors.controlStroke, CircleShape),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(initials, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                            }
                        }
                        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text(
                                hostName,
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Bold,
                                color = colors.brandNavy,
                            )
                            Text(
                                "Verified host profile",
                                style = MaterialTheme.typography.bodyMedium,
                                color = colors.mutedText,
                            )
                        }
                    }
                }

                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .shadow(0.dp, RoundedCornerShape(16.dp), false, colors.cardShadow, colors.cardShadow)
                            .clip(RoundedCornerShape(16.dp))
                            .background(colors.cardBackground)
                            .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                            .padding(16.dp),
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            HostVerificationLine("ID Verified", idVerified)
                            HostVerificationLine("Phone Verified", phoneVerified)
                            HostVerificationLine("Email Verified", emailVerified)
                        }
                    }
                }

                item { SectionHeader("Listings") }

                when {
                    carsState is UiState.Loading -> items(3) { HostListingPlaceholderRow() }
                    hostCars.isEmpty() -> item { EmptyBlock("No listings", "This host has no active listings.") }
                    else -> items(hostCars, key = { it.id }) { car ->
                        ListingCard(
                            car = car,
                            isFavorite = false,
                            imageHeight = 170.dp,
                            showsFavoriteButton = false,
                            onClick = { onOpenCarDetail(car.id) },
                            onFavoriteClick = {},
                        )
                    }
                }

                item { Spacer(modifier = Modifier.height(24.dp)) }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Screens
// ─────────────────────────────────────────────────────────────────────────────

enum class AdminTab { HOME, MESSAGES, PROFILE }

@Composable
fun AdminShellScreen(
    viewModel: AppViewModel,
    onExitAdmin: () -> Unit,
    onOpenConversation: (String) -> Unit,
    onOpenCarEditor: (String) -> Unit = {},
) {
    var selectedTab by remember { mutableStateOf(AdminTab.HOME) }
    var adminPage by rememberSaveable { mutableStateOf("home") }
    var previewCarId by rememberSaveable { mutableStateOf<String?>(null) }
    val colors = LocalHayameColors.current

    BackHandler(enabled = selectedTab == AdminTab.HOME && adminPage != "home") {
        adminPage = "home"
        previewCarId = null
    }
    // Back from Messages or Profile returns to the admin Home tab first.
    BackHandler(enabled = selectedTab != AdminTab.HOME) { selectedTab = AdminTab.HOME }

    Scaffold(
        containerColor = colors.pageBackground,
        bottomBar = {
            NavigationBar(
                containerColor = colors.cardBackground,
                tonalElevation = 0.dp,
            ) {
                NavigationBarItem(
                    selected = selectedTab == AdminTab.HOME,
                    onClick = {
                        selectedTab = AdminTab.HOME
                        adminPage = "home"
                        previewCarId = null
                    },
                    icon = { Icon(Icons.Outlined.Shield, contentDescription = null) },
                    label = { Text("Admin") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = colors.brandBlue,
                        selectedTextColor = colors.brandBlue,
                        unselectedIconColor = colors.mutedText,
                        unselectedTextColor = colors.mutedText,
                        indicatorColor = colors.brandLight,
                    ),
                )
                NavigationBarItem(
                    selected = selectedTab == AdminTab.MESSAGES,
                    onClick = { selectedTab = AdminTab.MESSAGES },
                    icon = { Icon(Icons.Outlined.MailOutline, contentDescription = null) },
                    label = { Text("Messages") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = colors.brandBlue,
                        selectedTextColor = colors.brandBlue,
                        unselectedIconColor = colors.mutedText,
                        unselectedTextColor = colors.mutedText,
                        indicatorColor = colors.brandLight,
                    ),
                )
                NavigationBarItem(
                    selected = selectedTab == AdminTab.PROFILE,
                    onClick = { selectedTab = AdminTab.PROFILE },
                    icon = { Icon(Icons.Outlined.Person, contentDescription = null) },
                    label = { Text("Profile") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = colors.brandBlue,
                        selectedTextColor = colors.brandBlue,
                        unselectedIconColor = colors.mutedText,
                        unselectedTextColor = colors.mutedText,
                        indicatorColor = colors.brandLight,
                    ),
                )
            }
        },
    ) { inner ->
        when (selectedTab) {
            AdminTab.HOME -> when (adminPage) {
                "platform" -> AdminPlatformScreen(
                    viewModel = viewModel,
                    paddingValues = inner,
                    onBack = { adminPage = "home" },
                    onPreviewCar = { carId -> previewCarId = carId; adminPage = "car" },
                )
                "filters" -> AdminFiltersScreen(paddingValues = inner, onBack = { adminPage = "home" })
                "user" -> AdminUserDetailScreen(viewModel = viewModel, paddingValues = inner, onBack = { adminPage = "home" })
                "car" -> AdminCarPreviewScreen(
                    viewModel = viewModel,
                    carId = previewCarId.orEmpty(),
                    paddingValues = inner,
                    onBack = { adminPage = "home"; previewCarId = null },
                    onEdit = onOpenCarEditor,
                )
                else -> AdminHomeScreen(
                    viewModel = viewModel,
                    paddingValues = inner,
                    onOpenPlatform = { adminPage = "platform" },
                    onOpenMessages = { selectedTab = AdminTab.MESSAGES },
                    onOpenFilters = { adminPage = "filters" },
                    onOpenUser = { adminPage = "user" },
                    onPreviewCar = { carId -> previewCarId = carId; adminPage = "car" },
                )
            }
            AdminTab.MESSAGES -> MessagesScreen(
                viewModel = viewModel,
                onBack = {},
                onOpenConversation = onOpenConversation,
                title = "Admin Messages",
                showBackButton = false,
            )
            AdminTab.PROFILE -> AdminProfileTab(
                viewModel = viewModel,
                paddingValues = inner,
                onExitAdmin = onExitAdmin,
            )
        }
    }
}

@Composable
private fun AdminHomeScreen(
    viewModel: AppViewModel,
    paddingValues: PaddingValues,
    onOpenPlatform: () -> Unit,
    onOpenMessages: () -> Unit,
    onOpenFilters: () -> Unit,
    onOpenUser: () -> Unit,
    onPreviewCar: (String) -> Unit,
) {
    val colors = LocalHayameColors.current
    val carsState by viewModel.carsState.collectAsState()
    val me by viewModel.me.collectAsState()

    LaunchedEffect(Unit) { viewModel.loadCars(mapOf("limit" to "100")) }

    val allCars = (carsState as? UiState.Success<List<CarDto>>)?.data.orEmpty()
    val pendingCars = allCars.filter {
        !it.approval_status.orEmpty().equals("approved", ignoreCase = true)
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(paddingValues).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item { Spacer(modifier = Modifier.height(8.dp)) }
        item {
            Text(
                "Admin",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.ExtraBold,
                color = colors.brandNavy,
            )
        }

        item { SectionHeader("Admin overview") }

        item {
            AdminNavCard(
                title = "Platform controls",
                subtitle = "${pendingCars.size} pending listing${if (pendingCars.size == 1) "" else "s"}",
                icon = Icons.Outlined.Shield,
                onClick = onOpenPlatform,
            )
        }
        item {
            AdminNavCard(
                title = "Office messages",
                subtitle = "Open admin conversations",
                icon = Icons.Outlined.MailOutline,
                onClick = onOpenMessages,
            )
        }
        item {
            AdminNavCard(
                title = "Filter catalog",
                subtitle = "Browse vehicle makes and models",
                icon = Icons.Outlined.Tune,
                onClick = onOpenFilters,
            )
        }
        item {
            AdminNavCard(
                title = "User details",
                subtitle = "Signed in as ${me?.profile?.full_name ?: me?.user?.email ?: "Admin"}",
                icon = Icons.Outlined.Person,
                onClick = onOpenUser,
            )
        }

        item { SectionHeader("Listing moderation") }

        when (carsState) {
            UiState.Loading -> items(3) { HostListingPlaceholderRow() }
            else -> {
                if (pendingCars.isEmpty()) {
                    item {
                        EmptyBlock("No pending listings", "All listings are approved.")
                    }
                } else {
                    items(pendingCars.take(5), key = { it.id }) { car ->
                        AdminListingModerationCard(car = car, viewModel = viewModel, onPreview = { onPreviewCar(car.id) })
                    }
                }
                if (allCars.isNotEmpty()) {
                    item { SectionHeader("All listings (${allCars.size})") }
                    items(allCars, key = { "all_${it.id}" }) { car ->
                        AdminListingModerationCard(car = car, viewModel = viewModel, onPreview = { onPreviewCar(car.id) })
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(24.dp)) }
    }
}

@Composable
private fun AdminNavCard(
    title: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit,
) {
    val colors = LocalHayameColors.current
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(0.dp, RoundedCornerShape(16.dp), false, colors.cardShadow, colors.cardShadow)
            .clip(RoundedCornerShape(16.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(16.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(colors.brandLight, RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(20.dp))
            }
            Column {
                Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = colors.mutedText)
            }
            Spacer(modifier = Modifier.weight(1f))
            Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = colors.mutedText)
        }
    }
}

@Composable
private fun AdminListingModerationCard(
    car: CarDto,
    viewModel: AppViewModel,
    onPreview: () -> Unit = {},
) {
    val colors = LocalHayameColors.current
    val isApproved = car.approval_status.orEmpty().equals("approved", ignoreCase = true)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(0.dp, RoundedCornerShape(16.dp), false, colors.cardShadow, colors.cardShadow)
            .clip(RoundedCornerShape(16.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(16.dp))
            .clickable(onClick = onPreview)
            .padding(14.dp),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top,
            ) {
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        car.title ?: listOfNotNull(car.brand, car.model).joinToString(" "),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = colors.brandNavy,
                    )
                    Text(
                        listOfNotNull(car.city, car.region).joinToString(", "),
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.mutedText,
                    )
                    Text(
                        "Host: ${car.host_name ?: car.owner?.full_name ?: "Unknown"}",
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.mutedText,
                    )
                }
                StatusBadge(status = car.approval_status ?: "pending")
            }

            if (!isApproved) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    GradientPillButton(
                        text = "Approve",
                        modifier = Modifier.weight(1f),
                        onClick = { viewModel.updateCarApprovalStatus(car.id, "approved") },
                    )
                    SecondaryPillButton(
                        text = "Reject",
                        modifier = Modifier.weight(1f),
                        onClick = { viewModel.updateCarApprovalStatus(car.id, "rejected") },
                    )
                }
            }
        }
    }
}

@Composable
private fun AdminPlatformScreen(
    viewModel: AppViewModel,
    paddingValues: PaddingValues,
    onBack: () -> Unit,
    onPreviewCar: (String) -> Unit,
) {
    val carsState by viewModel.carsState.collectAsState()
    val pendingCars = (carsState as? UiState.Success<List<CarDto>>)?.data.orEmpty().filter {
        !it.approval_status.orEmpty().equals("approved", ignoreCase = true)
    }

    Column(modifier = Modifier.fillMaxSize().padding(paddingValues)) {
        PageTopBar(title = "Admin Platform", onBack = onBack)
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item { Spacer(modifier = Modifier.height(8.dp)) }
            item { SectionHeader("Platform Controls") }
            item { SectionHeader("Listing approvals") }
            when (carsState) {
                UiState.Loading, UiState.Idle -> items(3) { HostListingPlaceholderRow() }
                is UiState.Error -> item {
                    ErrorBlock((carsState as UiState.Error).message, onRetry = { viewModel.loadCars(mapOf("limit" to "100")) })
                }
                else -> {
                    if (pendingCars.isEmpty()) {
                        item { EmptyBlock("No pending listings", "All listings are approved.") }
                    } else {
                        items(pendingCars, key = { it.id }) { car ->
                            AdminListingModerationCard(
                                car = car,
                                viewModel = viewModel,
                                onPreview = { onPreviewCar(car.id) },
                            )
                        }
                    }
                }
            }
            item { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }
}

@Composable
private fun AdminFiltersScreen(
    paddingValues: PaddingValues,
    onBack: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val allModels = remember {
        AndroidReferenceData.carModelsByMake.values.flatten().distinct().sortedWith(String.CASE_INSENSITIVE_ORDER)
    }

    Column(modifier = Modifier.fillMaxSize().padding(paddingValues)) {
        PageTopBar(title = "Filter Catalog", onBack = onBack)
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            item { Spacer(modifier = Modifier.height(8.dp)) }
            item { SectionHeader("Car makes") }
            items(AndroidReferenceData.carMakes, key = { "make_$it" }) { make ->
                Text(
                    make,
                    modifier = Modifier.fillMaxWidth().background(colors.cardBackground, RoundedCornerShape(12.dp)).padding(12.dp),
                    color = colors.brandNavy,
                    style = MaterialTheme.typography.bodyLarge,
                )
            }
            item { SectionHeader("Models") }
            items(allModels, key = { "model_$it" }) { model ->
                Text(
                    model,
                    modifier = Modifier.fillMaxWidth().background(colors.cardBackground, RoundedCornerShape(12.dp)).padding(12.dp),
                    color = colors.brandNavy,
                    style = MaterialTheme.typography.bodyLarge,
                )
            }
            item { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }
}

@Composable
private fun AdminUserDetailScreen(
    viewModel: AppViewModel,
    paddingValues: PaddingValues,
    onBack: () -> Unit,
) {
    val me by viewModel.me.collectAsState()
    val colors = LocalHayameColors.current
    val profile = me?.profile

    Column(modifier = Modifier.fillMaxSize().padding(paddingValues)) {
        PageTopBar(title = "User Details", onBack = onBack)
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item { SectionHeader(me.preferredFullName() ?: "Hayame User") }
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                    border = BorderStroke(1.dp, colors.border),
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        InfoRow("Email", me?.user?.email ?: "—")
                        InfoRow("Phone", profile?.phone ?: "—")
                        InfoRow("City", profile?.city ?: "—")
                        InfoRow("Region", profile?.region ?: "—")
                        InfoRow("Role", me.preferredRole()?.replaceFirstChar { it.uppercase() } ?: "Admin")
                    }
                }
            }
        }
    }
}

@Composable
private fun AdminCarPreviewScreen(
    viewModel: AppViewModel,
    carId: String,
    paddingValues: PaddingValues,
    onBack: () -> Unit,
    onEdit: (String) -> Unit,
) {
    val carsState by viewModel.carsState.collectAsState()
    val colors = LocalHayameColors.current
    val car = (carsState as? UiState.Success<List<CarDto>>)?.data?.firstOrNull { it.id == carId }

    Column(modifier = Modifier.fillMaxSize().padding(paddingValues)) {
        PageTopBar(title = "Listing Preview", onBack = onBack)
        if (car == null) {
            EmptyBlock("Listing unavailable", "This listing could not be loaded.")
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                item {
                    val imageUrl = resolveAppImage(car.image_url)
                        ?: car.car_photos.orEmpty().firstNotNullOfOrNull { resolveAppImage(it.url) }
                    if (!imageUrl.isNullOrBlank()) {
                        AsyncImage(
                            model = imageUrl,
                            contentDescription = car.title,
                            modifier = Modifier.fillMaxWidth().height(220.dp).clip(RoundedCornerShape(16.dp)),
                            contentScale = ContentScale.Crop,
                        )
                    }
                }
                item {
                    Text(
                        car.title ?: listOfNotNull(car.brand, car.model).joinToString(" "),
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        color = colors.brandNavy,
                    )
                }
                item { Text(car.description ?: "No description available.", color = colors.mutedText) }
                item {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                        border = BorderStroke(1.dp, colors.border),
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            InfoRow("Status", car.approval_status?.replaceFirstChar { it.uppercase() } ?: "Pending")
                            InfoRow("Price", "GHS${(car.daily_price ?: 0.0).roundToInt()}/day")
                            InfoRow("Host", car.host_name ?: car.owner?.full_name ?: "Unknown")
                        }
                    }
                }
                item {
                    GradientPillButton(
                        text = "Edit Listing",
                        modifier = Modifier.fillMaxWidth(),
                        onClick = { onEdit(car.id) },
                    )
                }
                item { Spacer(modifier = Modifier.height(24.dp)) }
            }
        }
    }
}

@Composable
private fun AdminProfileTab(
    viewModel: AppViewModel,
    paddingValues: PaddingValues,
    onExitAdmin: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val me by viewModel.me.collectAsState()

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(paddingValues).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item { Spacer(modifier = Modifier.height(8.dp)) }
        item { SectionHeader("Admin Profile") }

        me?.let { profile ->
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .shadow(0.dp, RoundedCornerShape(16.dp), false, colors.cardShadow, colors.cardShadow)
                        .clip(RoundedCornerShape(16.dp))
                        .background(colors.cardBackground)
                        .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                        .padding(16.dp),
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        InfoRow("Name", profile.profile?.full_name ?: "—")
                        InfoRow("Email", profile.user.email ?: "—")
                        InfoRow("Role", profile.preferredRole()?.replaceFirstChar { it.uppercase() } ?: "Admin")
                    }
                }
            }
        }

        item { SectionHeader("Role") }

        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(0.dp, RoundedCornerShape(16.dp), false, colors.cardShadow, colors.cardShadow)
                    .clip(RoundedCornerShape(16.dp))
                    .background(colors.cardBackground)
                    .border(1.dp, colors.border, RoundedCornerShape(16.dp))
                    .padding(4.dp),
            ) {
                Column {
                    TextButton(
                        onClick = { viewModel.continueAsGuest(); onExitAdmin() },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Switch to Guest App", color = colors.brandBlue, fontWeight = FontWeight.SemiBold)
                    }
                    HorizontalDivider(color = colors.border)
                    TextButton(
                        onClick = { onExitAdmin() },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Switch to Host App", color = colors.brandBlue, fontWeight = FontWeight.SemiBold)
                    }
                    HorizontalDivider(color = colors.border)
                    TextButton(
                        onClick = { viewModel.logout() },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Sign out", color = colors.danger, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(24.dp)) }
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    val colors = LocalHayameColors.current
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
        Text(value, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
    }
}

internal fun openExternalUrl(context: Context, url: String) {
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


// MARK: Car type icons ----------------------------------------------------------------------------

/** Maps a listing's car type (and the Home category pills) to the bundled `ic_cartype_*` vectors. */
internal fun carTypeIconRes(type: String): Int {
    return when (type.trim().lowercase(Locale.US)) {
        "all" -> R.drawable.ic_cartype_all
        "suv", "4x4", "jeep", "4wd" -> R.drawable.ic_cartype_suv
        "sedan", "saloon" -> R.drawable.ic_cartype_sedan
        "hatchback", "compact", "hatch", "mini", "small" -> R.drawable.ic_cartype_hatchback
        "crossover" -> R.drawable.ic_cartype_crossover
        "convertible", "cabriolet", "roadster" -> R.drawable.ic_cartype_convertible
        "coupe", "coupé", "sports", "sport", "sports car" -> R.drawable.ic_cartype_coupe
        "pickup", "pick-up", "pick up", "bakkie" -> R.drawable.ic_cartype_pickup
        "truck", "lorry" -> R.drawable.ic_cartype_truck
        "van", "bus", "cargo van" -> R.drawable.ic_cartype_van
        "minivan", "mpv", "people carrier", "mini van" -> R.drawable.ic_cartype_minivan
        "electric", "ev", "hybrid", "plug-in" -> R.drawable.ic_cartype_electric
        "luxury", "executive", "limousine", "limo", "premium" -> R.drawable.ic_cartype_luxury
        else -> R.drawable.ic_cartype_sedan
    }
}

private val homeCategoryGroups: List<Set<String>> = listOf(
    setOf("hatchback", "compact", "hatch", "mini", "small"),
    setOf("pickup", "pick-up", "pick up", "truck", "bakkie"),
    setOf("electric", "ev"),
    setOf("coupe", "coupé", "sports", "sport", "sports car"),
    setOf("luxury", "executive", "limousine", "limo", "premium"),
    setOf("van", "cargo van", "bus"),
    setOf("minivan", "mpv", "mini van", "people carrier"),
    setOf("convertible", "cabriolet", "roadster"),
    setOf("suv", "4x4", "jeep", "4wd"),
)

/** Category pill matching for the Home feed: exact type match plus the aliases buyers use. */
internal fun matchesHomeCategory(carType: String?, category: String): Boolean {
    val selected = category.trim().lowercase(Locale.US)
    if (selected.isBlank() || selected == "all") return true
    val type = carType?.trim()?.lowercase(Locale.US).orEmpty()
    if (type == selected) return true
    return homeCategoryGroups.any { selected in it && type in it }
}


// MARK: Car detail pieces -------------------------------------------------------------------------

@Composable
private fun DetailHeroGallery(
    pagerState: androidx.compose.foundation.pager.PagerState,
    images: List<String>,
    selectedIndex: Int,
    onTap: () -> Unit,
) {
    val colors = LocalHayameColors.current
    Box(modifier = Modifier.fillMaxWidth().height(380.dp)) {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize().clickable(onClick = onTap),
        ) { page ->
            val imageUrl = images[page]
            if (imageUrl.isBlank()) {
                Box(modifier = Modifier.fillMaxSize().background(colors.brandLight), contentAlignment = Alignment.Center) {
                    Icon(Icons.Outlined.DirectionsCar, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(44.dp))
                }
            } else {
                AsyncImage(model = imageUrl, contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
            }
        }
        // Keeps the floating controls legible over bright photos.
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(150.dp)
                .background(Brush.verticalGradient(listOf(Color.Black.copy(alpha = 0.38f), Color.Transparent))),
        )
        if (images.size > 1) {
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = colors.cardBackground.copy(alpha = 0.92f),
                modifier = Modifier.align(Alignment.BottomStart).padding(16.dp),
            ) {
                Text(
                    "${selectedIndex + 1} of ${images.size}",
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = colors.brandNavy,
                )
            }
        }
    }
}

@Composable
private fun DetailSectionBand() {
    Box(modifier = Modifier.fillMaxWidth().height(8.dp).background(LocalHayameColors.current.fieldBackground))
}

@Composable
private fun DetailSpecChip(
    icon: ImageVector? = null,
    text: String,
    tint: Color = LocalHayameColors.current.brandNavy,
    painterRes: Int? = null,
) {
    val colors = LocalHayameColors.current
    Row(
        modifier = Modifier.background(colors.fieldBackground, RoundedCornerShape(12.dp)).padding(horizontal = 12.dp, vertical = 9.dp),
        horizontalArrangement = Arrangement.spacedBy(7.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        when {
            painterRes != null -> Icon(painter = painterResource(painterRes), contentDescription = null, tint = tint, modifier = Modifier.size(width = 18.dp, height = 13.dp))
            icon != null -> Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(15.dp))
        }
        Text(text, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = tint)
    }
}

@Composable
private fun DetailRowIcon(icon: ImageVector, tint: Color = LocalHayameColors.current.brandNavy) {
    Box(
        modifier = Modifier.size(40.dp).background(LocalHayameColors.current.fieldBackground, RoundedCornerShape(12.dp)),
        contentAlignment = Alignment.Center,
    ) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(19.dp))
    }
}

/** A row in "Your trip": icon, title, one or two lines, and a pencil to edit. */
@Composable
private fun DetailEditRow(
    icon: ImageVector,
    title: String,
    lines: List<String>,
    isLoading: Boolean = false,
    onEdit: () -> Unit,
) {
    val colors = LocalHayameColors.current
    Row(
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).clickable(onClick = onEdit),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.Top,
    ) {
        DetailRowIcon(icon)
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(title, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
            lines.forEach { line ->
                Text(
                    line,
                    style = MaterialTheme.typography.bodyLarge,
                    color = colors.brandNavy.copy(alpha = if (isLoading) 0.35f else 0.85f),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
        Box(
            modifier = Modifier.size(42.dp).border(1.dp, colors.controlStroke, RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Outlined.Edit, contentDescription = "Edit ${title.lowercase()}", tint = colors.brandNavy, modifier = Modifier.size(17.dp))
        }
    }
}

@Composable
private fun DetailPriceLine(label: String, value: Int) {
    val colors = LocalHayameColors.current
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(label, style = MaterialTheme.typography.bodyLarge, color = colors.mutedText, modifier = Modifier.weight(1f))
        Text("GHS $value", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
    }
}

@Composable
private fun DetailVerificationChip(label: String, verified: Boolean) {
    val colors = LocalHayameColors.current
    val tint = if (verified) Success else colors.mutedText
    Row(
        modifier = Modifier.background(tint.copy(alpha = 0.12f), CircleShape).padding(horizontal = 10.dp, vertical = 7.dp),
        horizontalArrangement = Arrangement.spacedBy(5.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(if (verified) Icons.Outlined.Verified else Icons.Outlined.Info, contentDescription = null, tint = tint, modifier = Modifier.size(13.dp))
        Text(label, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = tint)
    }
}

@Composable
private fun DetailPolicyRow(icon: ImageVector, title: String, value: String) {
    val colors = LocalHayameColors.current
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
        DetailRowIcon(icon)
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(title, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
            Text(value, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
        }
    }
}

@Composable
private fun DetailReviewRow(review: ReviewDto) {
    val colors = LocalHayameColors.current
    val rating = (review.rating ?: 0.0).roundToInt().coerceIn(1, 5)
    val name = review.reviewer?.full_name ?: "Hayame guest"
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top, modifier = Modifier.padding(vertical = 4.dp)) {
        Box(modifier = Modifier.size(36.dp).background(colors.brandLight, CircleShape), contentAlignment = Alignment.Center) {
            Text(avatarInitials(name, "G"), style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(name, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                    repeat(rating) { Icon(Icons.Filled.Star, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(11.dp)) }
                }
            }
            Text(review.comment?.takeIf { it.isNotBlank() } ?: "No comment provided.", style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
        }
    }
}

private fun LocalDate.toTripDateLabel(): String = format(DateTimeFormatter.ofPattern("EEE, d MMM"))

/** Turns an API host level such as "verified_host" into "Verified host". */
internal fun hostLevelLabel(raw: String?): String {
    val cleaned = raw?.trim()?.replace('_', ' ')?.replace('-', ' ')?.trim().orEmpty()
    if (cleaned.isBlank()) return "Verified host"
    val lower = cleaned.lowercase()
    return if (lower == "superhost" || lower == "super host") "Superhost" else lower.replaceFirstChar { it.uppercase() }
}

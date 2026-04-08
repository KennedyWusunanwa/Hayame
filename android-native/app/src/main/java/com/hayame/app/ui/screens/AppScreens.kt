package com.hayame.app.ui.screens

import android.app.DatePickerDialog
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
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
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items as gridItems
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.automirrored.outlined.ExitToApp
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.outlined.AddCircleOutline
import androidx.compose.material.icons.outlined.AttachMoney
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.ChatBubble
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material.icons.outlined.DirectionsCar
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.MailOutline
import androidx.compose.material.icons.outlined.MoreHoriz
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Public
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
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
import com.hayame.app.ui.theme.MutedText
import com.hayame.app.ui.theme.PageBackground
import com.hayame.app.ui.theme.Success
import com.hayame.app.ui.theme.Warning
import com.hayame.app.ui.viewmodel.BookingDraft
import com.hayame.app.ui.viewmodel.AppViewModel
import com.hayame.app.ui.viewmodel.ListingSubmissionResult
import kotlinx.coroutines.Dispatchers
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.File
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException
import java.time.temporal.ChronoUnit
import kotlin.math.max
import kotlin.math.roundToInt

@Composable
fun SplashScreen() {
    val progress = remember { Animatable(0f) }
    val logoScale = remember { Animatable(0.82f) }
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
    val barWidth = 248.dp

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
                animationSpec = tween(durationMillis = 1450, easing = FastOutSlowInEasing),
            )
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.linearGradient(
                    colors = listOf(
                        Color(0xFFE8F1FB),
                        Color.White,
                        BrandLight.copy(alpha = 0.45f),
                    )
                )
            ),
    ) {
        Box(
            modifier = Modifier
                .align(Alignment.Center)
                .size(220.dp)
                .offset(x = (-120).dp, y = (-250).dp)
                .background(BrandBlue.copy(alpha = 0.12f), CircleShape)
                .blur(18.dp),
        )
        Box(
            modifier = Modifier
                .align(Alignment.Center)
                .size(260.dp)
                .offset(x = 130.dp, y = 250.dp)
                .background(BrandNavy.copy(alpha = 0.08f), CircleShape)
                .blur(24.dp),
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            Spacer(modifier = Modifier.weight(1f))
            Image(
                painter = painterResource(id = R.drawable.hayame_logo),
                contentDescription = "Hayame",
                modifier = Modifier
                    .width(214.dp)
                    .scale(logoScale.value)
                    .offset(y = logoFloat.dp),
                contentScale = ContentScale.Fit,
            )
            Text(
                text = "Rent a car, anytime, anywhere in Ghana.",
                style = MaterialTheme.typography.bodyLarge,
                fontSize = 15.sp,
                color = MutedText.copy(alpha = 0.92f),
                fontWeight = FontWeight.Medium,
            )
            Box(
                modifier = Modifier
                    .width(barWidth)
                    .height(4.dp)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(4.dp)
                        .clip(RoundedCornerShape(99.dp))
                        .background(BrandLight)
                )
                Box(
                    modifier = Modifier
                        .fillMaxWidth(progress.value)
                        .height(4.dp)
                        .clip(RoundedCornerShape(99.dp))
                        .background(
                            brush = Brush.horizontalGradient(
                                colors = listOf(BrandBlue, BrandNavy),
                            )
                        )
                )
                Box(
                    modifier = Modifier
                        .offset(x = shimmerShift.dp)
                        .width(76.dp)
                        .height(4.dp)
                        .background(
                            brush = Brush.horizontalGradient(
                                colors = listOf(
                                    Color.White.copy(alpha = 0f),
                                    Color.White.copy(alpha = 0.85f),
                                    Color.White.copy(alpha = 0f),
                                ),
                            ),
                            shape = RoundedCornerShape(99.dp),
                        )
                        .clip(RoundedCornerShape(99.dp))
                )
            }
            Spacer(modifier = Modifier.weight(1f))
        }
    }
}

@Composable
fun LoginScreen(
    viewModel: AppViewModel,
    onSignup: () -> Unit,
    onContinueAsGuest: () -> Unit = {},
) {
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var passwordVisible by rememberSaveable { mutableStateOf(false) }
    val bootstrapping by viewModel.bootstrapping.collectAsState()

    AuthScaffold(
        title = "Welcome back",
        subtitle = "Log in to continue renting and hosting on Hayame.",
    ) {
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp)
        )
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
            trailingIcon = {
                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                    Icon(
                        imageVector = if (passwordVisible) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                        contentDescription = if (passwordVisible) "Hide password" else "Show password",
                        tint = MutedText,
                    )
                }
            },
        )
        Button(
            onClick = { viewModel.login(email, password) },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(12.dp),
            enabled = !bootstrapping,
        ) {
            Text(if (bootstrapping) "Please wait..." else "Log in", fontWeight = FontWeight.Bold)
        }
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            TextButton(
                onClick = {
                    if (email.isNotBlank()) {
                        viewModel.forgotPassword(email)
                    }
                },
            ) {
                Text("Forgot password", color = BrandBlue)
            }
            TextButton(
                onClick = {
                    if (email.isNotBlank()) {
                        viewModel.resendConfirmation(email)
                    }
                },
            ) {
                Text("Resend confirmation", color = BrandBlue)
            }
        }
        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = Color.LightGray.copy(alpha = 0.3f))
        TextButton(onClick = onSignup, modifier = Modifier.align(Alignment.CenterHorizontally)) {
            Text("Don't have an account? Sign up", color = BrandNavy)
        }
        TextButton(onClick = onContinueAsGuest, modifier = Modifier.align(Alignment.CenterHorizontally)) {
            Text("Continue as guest", color = MutedText)
        }
    }
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

    AuthScaffold(
        title = "Create account",
        subtitle = "Sign up to book cars, message hosts, and track trips.",
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(value = firstName, onValueChange = { firstName = it }, label = { Text("First") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp))
            OutlinedTextField(value = lastName, onValueChange = { lastName = it }, label = { Text("Last") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp))
        }
        OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
            trailingIcon = {
                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                    Icon(
                        imageVector = if (passwordVisible) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                        contentDescription = if (passwordVisible) "Hide password" else "Show password",
                        tint = MutedText,
                    )
                }
            },
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(value = region, onValueChange = { region = it }, label = { Text("Region") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp))
            OutlinedTextField(value = city, onValueChange = { city = it }, label = { Text("City") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp))
        }
        Button(
            onClick = {
                viewModel.signup(
                    firstName = firstName,
                    lastName = lastName,
                    email = email,
                    password = password,
                    city = city,
                    region = region,
                )
            },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(12.dp),
            enabled = !bootstrapping,
        ) {
            Text(if (bootstrapping) "Please wait..." else "Sign up", fontWeight = FontWeight.Bold)
        }
        TextButton(onClick = onBackToLogin, modifier = Modifier.align(Alignment.CenterHorizontally)) {
            Text("Already have an account? Log in", color = BrandNavy)
        }
    }
}

@Composable
private fun AuthScaffold(
    title: String,
    subtitle: String,
    content: @Composable ColumnScope.() -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.linearGradient(
                    colors = listOf(
                        Color(0xFFE8F1FB),
                        Color(0xFFF7F9FC),
                        Color.White,
                    )
                )
            ),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(modifier = Modifier.height(20.dp))
            Image(
                painter = painterResource(id = R.drawable.hayame_logo),
                contentDescription = "Hayame",
                modifier = Modifier.fillMaxWidth(0.48f),
                contentScale = ContentScale.Fit,
            )
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.98f)),
                elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    horizontalAlignment = Alignment.Start,
                ) {
                    Text(title, style = MaterialTheme.typography.headlineLarge, color = BrandNavy, fontWeight = FontWeight.ExtraBold)
                    Text(
                        subtitle,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MutedText,
                        modifier = Modifier.padding(top = 2.dp, bottom = 8.dp),
                    )
                    content()
                }
            }
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
fun MainShell(
    viewModel: AppViewModel,
    initialTab: MainTab = MainTab.HOME,
    onOpenCarDetail: (String) -> Unit,
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
    var tab by rememberSaveable(initialTab) { mutableStateOf(initialTab) }
    val tabs = remember { MainTab.entries }
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()

    LaunchedEffect(initialTab) {
        tab = initialTab
    }

    Scaffold(
        containerColor = PageBackground,
        bottomBar = {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 10.dp),
            ) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(34.dp),
                    color = Color.White.copy(alpha = 0.94f),
                    shadowElevation = 10.dp,
                    tonalElevation = 4.dp,
                    border = BorderStroke(1.dp, Color(0xFFE8ECF4)),
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 8.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        tabs.forEach { item ->
                            val selected = tab == item
                            val icon = when (item) {
                                MainTab.HOME -> Icons.Outlined.Home
                                MainTab.EXPLORE -> Icons.Outlined.Search
                                MainTab.TRIPS -> Icons.Outlined.CalendarMonth
                                MainTab.SAVED -> Icons.Outlined.FavoriteBorder
                                MainTab.MORE -> Icons.Outlined.MoreHoriz
                            }
                            val tint = if (selected) BrandBlue else Color(0xFF21212D)
                            Column(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(24.dp))
                                    .background(if (selected) Color(0xFFD5DEE5) else Color.Transparent)
                                    .clickable {
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
                                    }
                                    .padding(vertical = 8.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(2.dp),
                            ) {
                                Icon(icon, contentDescription = item.title, tint = tint)
                                Text(
                                    item.title,
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                    color = tint,
                                )
                            }
                        }
                    }
                }
            }
        },
    ) { innerPadding ->
        when (tab) {
            MainTab.HOME -> HomeTab(
                viewModel = viewModel,
                paddingValues = innerPadding,
                onOpenCarDetail = onOpenCarDetail,
                onOpenMessages = onOpenMessages,
                onOpenExplore = { tab = MainTab.EXPLORE },
                onOpenMore = { tab = MainTab.MORE },
            )
            MainTab.EXPLORE -> ExploreTab(
                viewModel = viewModel,
                paddingValues = innerPadding,
                onOpenCarDetail = onOpenCarDetail,
            )
            MainTab.TRIPS -> TripsTab(viewModel = viewModel, paddingValues = innerPadding)
            MainTab.SAVED -> SavedTab(
                viewModel = viewModel,
                paddingValues = innerPadding,
                onOpenCarDetail = onOpenCarDetail,
            )
            MainTab.MORE -> MoreTab(
                viewModel = viewModel,
                paddingValues = innerPadding,
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

    Scaffold(
        containerColor = Color(0xFFF2F5FA),
        bottomBar = {
            Surface(
                color = Color.White,
                shadowElevation = 8.dp,
            ) {
                Column {
                    HorizontalDivider(color = Color(0x14000000))
                    NavigationBar(
                        containerColor = Color.White,
                        tonalElevation = 0.dp,
                    ) {
                        navigationItems.forEach { (item, icon) ->
                            NavigationBarItem(
                                selected = tab == item,
                                onClick = { tab = item },
                                icon = {
                                    if (item == HostMainTab.INBOX && unreadCount > 0) {
                                        BadgedBox(
                                            badge = {
                                                Badge(containerColor = BrandBlue, contentColor = Color.White) {
                                                    Text(if (unreadCount > 99) "99+" else unreadCount.toString())
                                                }
                                            },
                                        ) {
                                            Icon(icon, contentDescription = item.title)
                                        }
                                    } else {
                                        Icon(icon, contentDescription = item.title)
                                    }
                                },
                                label = {
                                    Text(
                                        item.title,
                                        maxLines = 1,
                                    )
                                },
                                alwaysShowLabel = true,
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = BrandBlue,
                                    selectedTextColor = BrandBlue,
                                    unselectedIconColor = MutedText,
                                    unselectedTextColor = MutedText,
                                    indicatorColor = BrandLight,
                                ),
                            )
                        }
                    }
                }
            }
        },
    ) { inner ->
        Box(modifier = Modifier.fillMaxSize().padding(inner)) {
            when (tab) {
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

@Composable
private fun HomeTab(
    viewModel: AppViewModel,
    paddingValues: PaddingValues,
    onOpenCarDetail: (String) -> Unit,
    onOpenMessages: () -> Unit,
    onOpenExplore: () -> Unit,
    onOpenMore: () -> Unit,
) {
    val carsState by viewModel.carsState.collectAsState()
    val favoritesState by viewModel.favoritesState.collectAsState()
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val me by viewModel.me.collectAsState()
    val locations by viewModel.locations.collectAsState()
    val conversationsState by viewModel.conversationsState.collectAsState()
    val favoriteIds = (favoritesState as? UiState.Success<Set<String>>)?.data ?: emptySet()
    var query by rememberSaveable { mutableStateOf("") }
    var selectedRegion by rememberSaveable { mutableStateOf("Any region") }
    var selectedCity by rememberSaveable { mutableStateOf("Any city") }
    var selectedType by rememberSaveable { mutableStateOf("Any type") }
    var maxPrice by rememberSaveable { mutableStateOf(5000f) }

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

    LaunchedEffect(Unit) {
        viewModel.loadReferenceData()
        viewModel.loadCars(mapOf("sort" to "new_listings", "limit" to "48"))
        viewModel.loadFavorites()
        viewModel.loadConversations()
    }

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
                        .clickable(onClick = onOpenMore),
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
                    Column {
                        val displayName = me.preferredFullName()?.trim().takeUnless { it.isNullOrBlank() } ?: "Guest User"
                        Text(
                            displayName,
                            style = MaterialTheme.typography.titleMedium.copy(fontSize = 15.sp),
                            color = BrandNavy,
                            fontWeight = FontWeight.ExtraBold,
                        )
                        Text("Open profile", style = MaterialTheme.typography.labelLarge.copy(fontSize = 11.sp), color = MutedText)
                    }
                }
                Surface(
                    shape = CircleShape,
                    color = Color.White,
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
                        Icon(Icons.Outlined.ChatBubble, contentDescription = "Messages", tint = BrandNavy)
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
            Card(
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(containerColor = Color.Transparent),
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = Brush.linearGradient(
                                colors = listOf(BrandNavy, BrandBlue),
                            ),
                            shape = RoundedCornerShape(20.dp),
                        )
                        .padding(18.dp),
                ) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .size(220.dp)
                            .background(Color.White.copy(alpha = 0.08f), CircleShape)
                    )
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Image(
                                painter = painterResource(id = R.drawable.hayame_logo),
                                contentDescription = "Hayame",
                                modifier = Modifier.size(width = 34.dp, height = 34.dp),
                                contentScale = ContentScale.Fit,
                            )
                            Text(
                                "Ghana Car Sharing",
                                color = Color.White.copy(alpha = 0.82f),
                                style = MaterialTheme.typography.labelLarge.copy(fontSize = 10.sp),
                                fontWeight = FontWeight.Medium,
                            )
                        }
                        Text(
                            "RENT CAR ACROSS GHANA",
                            style = MaterialTheme.typography.labelLarge.copy(fontSize = 10.sp),
                            color = Color.White.copy(alpha = 0.78f),
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(
                            "Rent a Car, Anytime,\nAnywhere in Ghana.",
                            style = MaterialTheme.typography.headlineLarge.copy(fontSize = 32.sp),
                            color = Color.White,
                            fontWeight = FontWeight.ExtraBold,
                        )
                        GradientPillButton(
                            text = "Book Now",
                            modifier = Modifier.widthIn(max = 220.dp),
                            onClick = onOpenExplore,
                        )
                    }
                }
            }
        }

        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
            ) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        "Search with filters",
                        style = MaterialTheme.typography.titleMedium.copy(fontSize = 14.sp),
                        color = BrandNavy,
                        fontWeight = FontWeight.Bold,
                    )
                    OutlinedTextField(
                        value = query,
                        onValueChange = { query = it },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        placeholder = { Text("Car, city, host") },
                        leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null, tint = MutedText) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color.Black.copy(alpha = 0.06f),
                            unfocusedBorderColor = Color.Black.copy(alpha = 0.06f),
                            focusedContainerColor = Color.White,
                            unfocusedContainerColor = Color.White,
                        ),
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        HomeFilterChip(
                            label = selectedRegion,
                            options = regionOptions,
                            modifier = Modifier.weight(1f),
                            onSelected = {
                                selectedRegion = it
                                selectedCity = "Any city"
                            },
                        )
                        HomeFilterChip(
                            label = selectedCity,
                            options = cityOptions,
                            modifier = Modifier.weight(1f),
                            onSelected = { selectedCity = it },
                        )
                        HomeFilterChip(
                            label = selectedType,
                            options = carTypeOptions,
                            modifier = Modifier.weight(1f),
                            onSelected = { selectedType = it },
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            "Max GHS ${maxPrice.toInt()}",
                            style = MaterialTheme.typography.labelLarge.copy(fontSize = 12.sp),
                            color = MutedText,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Slider(
                            value = maxPrice,
                            onValueChange = { maxPrice = it },
                            valueRange = 100f..8000f,
                            steps = 157,
                            modifier = Modifier.weight(1f),
                            colors = SliderDefaults.colors(
                                activeTrackColor = BrandBlue,
                                inactiveTrackColor = Color(0xFFE4E8EF),
                                thumbColor = Color.White,
                                activeTickColor = Color.Transparent,
                                inactiveTickColor = Color.Transparent,
                            ),
                        )
                    }
                    GradientPillButton(
                        text = "Apply filters and search",
                        modifier = Modifier.fillMaxWidth(),
                        onClick = {
                            applyFilters()
                            onOpenExplore()
                        },
                    )
                }
            }
        }

        if (profileCity.isNotEmpty() || profileRegion.isNotEmpty() || selectedCarType.isNotEmpty()) {
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    if (profileCity.isNotEmpty()) {
                        HomeLocationTag(profileCity, Icons.Outlined.LocationOn)
                    }
                    if (profileRegion.isNotEmpty()) {
                        HomeLocationTag(profileRegion, Icons.Outlined.Public)
                    }
                    if (selectedCarType.isNotEmpty()) {
                        HomeLocationTag(selectedCarType, Icons.Outlined.DirectionsCar)
                    }
                }
            }
        }

        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier.weight(1f),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("CARS LISTED", style = MaterialTheme.typography.labelLarge.copy(fontSize = 10.sp), color = MutedText, fontWeight = FontWeight.SemiBold)
                        Text("$carsListed", style = MaterialTheme.typography.headlineMedium.copy(fontSize = 20.sp), color = BrandNavy, fontWeight = FontWeight.ExtraBold)
                    }
                }
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier.weight(1f),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("APPROVED HOSTS", style = MaterialTheme.typography.labelLarge.copy(fontSize = 10.sp), color = MutedText, fontWeight = FontWeight.SemiBold)
                        Text("$approvedHosts", style = MaterialTheme.typography.headlineMedium.copy(fontSize = 20.sp), color = BrandNavy, fontWeight = FontWeight.ExtraBold)
                    }
                }
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("Featured cars", style = MaterialTheme.typography.headlineLarge, color = BrandNavy, fontWeight = FontWeight.ExtraBold)
                TextButton(onClick = onOpenExplore) {
                    Text("Explore all", color = BrandBlue, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                }
            }
        }

        when (val state = carsState) {
            UiState.Loading -> item { LoadingBlock("Loading cars...") }
            is UiState.Error -> item { ErrorBlock(state.message, onRetry = { viewModel.loadCars(mapOf("sort" to "new_listings", "limit" to "48")) }) }
            UiState.Empty -> item { EmptyBlock("No cars yet", "No listings are available right now.") }
            is UiState.Success -> items(state.data.take(3), key = { it.id }) { car ->
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
            UiState.Idle -> item { LoadingBlock() }
        }
        item {
            SecondaryPillButton(
                text = "View protection details",
                onClick = onOpenMore,
            )
        }
        item { Spacer(modifier = Modifier.height(24.dp)) }
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
    Box {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(Color.White)
                .border(BorderStroke(1.dp, Color.Black.copy(alpha = 0.06f)), RoundedCornerShape(14.dp))
                .clickable(onClick = onOpen)
                .padding(10.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            AsyncImage(
                model = car.image_url ?: car.car_photos?.firstOrNull()?.url,
                contentDescription = null,
                modifier = Modifier
                    .size(width = 94.dp, height = 72.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(BrandLight),
                contentScale = ContentScale.Crop,
            )
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    car.title.orEmpty(),
                    style = MaterialTheme.typography.titleMedium.copy(fontSize = 15.sp),
                    color = BrandNavy,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    listOfNotNull(car.city, car.region).joinToString(", "),
                    style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                    color = MutedText,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    "GHS${(car.daily_price ?: 0.0).toInt()}/day",
                    style = MaterialTheme.typography.bodyLarge.copy(fontSize = 13.sp),
                    color = BrandBlue,
                    fontWeight = FontWeight.Bold,
                )
            }
            Spacer(modifier = Modifier.widthIn(min = 24.dp))
        }

        Surface(
            shape = CircleShape,
            color = Color.White.copy(alpha = 0.96f),
            border = BorderStroke(1.dp, Color.Black.copy(alpha = 0.08f)),
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
                    tint = if (isFavorite) Color.Red else BrandNavy,
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
) {
    val carsState by viewModel.carsState.collectAsState()
    val favoritesState by viewModel.favoritesState.collectAsState()
    val favoriteIds = (favoritesState as? UiState.Success<Set<String>>)?.data ?: emptySet()
    var query by rememberSaveable { mutableStateOf("") }
    var sort by rememberSaveable { mutableStateOf("new_listings") }
    var layoutMode by rememberSaveable { mutableStateOf(ExploreLayoutMode.LIST.name) }
    val selectedLayout = remember(layoutMode) {
        runCatching { ExploreLayoutMode.valueOf(layoutMode) }.getOrElse { ExploreLayoutMode.LIST }
    }

    LaunchedEffect(Unit) {
        viewModel.loadCars()
        viewModel.loadFavorites()
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
            trailingIcon = {
                if (query.isNotEmpty()) {
                    TextButton(onClick = {
                        val params = mutableMapOf<String, String>()
                        params["q"] = query.trim()
                        params["sort"] = sort
                        viewModel.loadCars(params)
                    }) { Text("Search", fontWeight = FontWeight.Bold) }
                }
            }
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
                                viewModel.loadCars(mapOf("sort" to sort, "q" to query.trim()))
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
                if (selectedLayout == ExploreLayoutMode.GRID) {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(2),
                        modifier = Modifier.weight(1f),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        contentPadding = PaddingValues(bottom = 16.dp),
                    ) {
                        gridItems(state.data, key = { it.id }) { car ->
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
                        items(state.data, key = { it.id }) { car ->
                            CarCard(
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
                }
            }
            UiState.Idle -> LoadingBlock()
        }
    }
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
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Color.Black.copy(alpha = 0.06f)),
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
                            .height(148.dp)
                            .clip(RoundedCornerShape(topStart = 18.dp, topEnd = 18.dp)),
                        contentScale = ContentScale.Crop,
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(148.dp)
                            .background(BrandLight),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text("No image", color = MutedText)
                    }
                }

                Surface(
                    shape = CircleShape,
                    color = Color.White.copy(alpha = 0.96f),
                    border = BorderStroke(1.dp, Color.Black.copy(alpha = 0.08f)),
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
                            tint = if (isFavorite) Color.Red else BrandNavy,
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
) {
    val bookingsState by viewModel.bookingsState.collectAsState()

    LaunchedEffect(Unit) { viewModel.loadBookings() }

    LazyColumn(
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
            is UiState.Success -> items(state.data, key = { it.id }) { booking ->
                BookingCard(booking = booking, onApprove = { viewModel.approveBooking(it) }, onReject = { id, r -> viewModel.rejectBooking(id, r) }, onDispute = { id, r -> viewModel.createDispute(id, r) })
            }
            UiState.Idle -> item { LoadingBlock() }
        }
        item { Spacer(modifier = Modifier.height(24.dp)) }
    }
}

@Composable
private fun BookingCard(booking: com.hayame.app.core.network.BookingDto, onApprove: (String) -> Unit, onReject: (String, String) -> Unit, onDispute: (String, String) -> Unit) {
    var disputeReason by remember { mutableStateOf("") }
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = booking.cars?.title ?: "Trip with Hayame", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = BrandNavy)
                    Text(text = "ID: #${booking.id.take(8).uppercase()}", style = MaterialTheme.typography.labelSmall, color = MutedText)
                }
                StatusBadge(status = booking.status ?: "pending")
            }
            
            HorizontalDivider(color = Color.LightGray.copy(alpha = 0.2f))
            
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
                // Actions for completed
            } else {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
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

    LazyColumn(
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
                colors = CardDefaults.cardColors(containerColor = Color.White),
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
                                color = BrandNavy,
                            )
                            Text(
                                displayEmail,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MutedText,
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
                colors = CardDefaults.cardColors(containerColor = Color.White),
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
            SectionHeader("Hosting")
        }

        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
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
                                        color = BrandNavy,
                                    )
                                    Text(
                                        "Turn on Host mode to access host dashboard, listings, bookings, and earnings.",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MutedText,
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
                                color = MutedText,
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
                colors = CardDefaults.cardColors(containerColor = Color.White),
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
                    colors = ButtonDefaults.outlinedButtonColors(containerColor = Color.White),
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
private fun ActionRow(title: String, icon: androidx.compose.ui.graphics.vector.ImageVector, onClick: () -> Unit, color: Color = BrandNavy) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 16.dp, horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Icon(icon, contentDescription = null, tint = if (color == BrandNavy) MutedText else color, modifier = Modifier.size(24.dp))
        Text(title, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium, color = color)
        Spacer(modifier = Modifier.weight(1f))
        Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = Color.LightGray, modifier = Modifier.size(20.dp))
    }
}

@Composable
private fun NotificationPreferencesCard(
    preferences: NotificationPreferencesDto,
    isAuthenticated: Boolean,
    onPreferenceChange: (key: String, enabled: Boolean) -> Unit,
    onRequireSignIn: (() -> Unit)? = null,
) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text(
                "Control which updates can reach your device. News and press releases stay optional.",
                style = MaterialTheme.typography.bodySmall,
                color = MutedText,
            )

            if (!isAuthenticated) {
                Text(
                    "Sign in to save notification preferences across your devices.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = BrandNavy,
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
                color = BrandNavy,
            )
            Text(
                subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MutedText,
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
                        colors = listOf(BrandBlue, BrandNavy),
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
    onClick: () -> Unit,
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier.height(44.dp),
        shape = RoundedCornerShape(999.dp),
        border = BorderStroke(1.dp, BrandBlue.copy(alpha = 0.25f)),
        colors = ButtonDefaults.outlinedButtonColors(containerColor = BrandLight),
    ) {
        Text(
            text = text,
            color = BrandNavy,
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
        containerColor = PageBackground,
        topBar = {
            Surface(color = Color.White, shadowElevation = 2.dp) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 10.dp),
                ) {
                    IconButton(onClick = onBack, modifier = Modifier.align(Alignment.CenterStart)) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = BrandNavy)
                    }
                    Text(
                        text = "Car Detail",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.ExtraBold,
                        color = BrandNavy,
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

                LaunchedEffect(startDate) {
                    if (!endDate.isAfter(startDate)) {
                        endDate = startDate.plusDays(1)
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
                    viewModel.checkAvailability(
                        carId = car.id,
                        startDate = startDate.toApiDate(),
                        endDate = endDate.toApiDate(),
                    ) { _, message ->
                        isCheckingAvailability = false
                        availabilityMessage = message
                    }
                }

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(inner)
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
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
                                    text = "GH₵$pricePerDay / day",
                                    style = MaterialTheme.typography.headlineSmall,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = BrandNavy,
                                )
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
                                DateSelectionRow(label = "Start date", date = startDate, minimumDate = LocalDate.now()) { startDate = it }
                                DateSelectionRow(label = "End date", date = endDate, minimumDate = startDate.plusDays(1)) { endDate = it }

                                Text("Quick select:", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold, color = BrandNavy)
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    SecondaryPillButton(text = "2 days", modifier = Modifier.weight(1f)) { endDate = startDate.plusDays(2) }
                                    SecondaryPillButton(text = "5 days", modifier = Modifier.weight(1f)) { endDate = startDate.plusDays(5) }
                                    SecondaryPillButton(text = "7 days", modifier = Modifier.weight(1f)) { endDate = startDate.plusDays(7) }
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
                                GradientPillButton(
                                    text = if (isAuthenticated) "Book Now" else "Log in to Book",
                                    modifier = Modifier.fillMaxWidth(),
                                    onClick = ::openBookingFlow,
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

                if (showGallery && imageUrls.isNotEmpty()) {
                    FullScreenPhotoGallery(
                        imageUrls = imageUrls,
                        initialPage = selectedImageIndex,
                        onDismiss = { showGallery = false },
                    )
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
    Row(verticalAlignment = Alignment.Top) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyLarge,
            color = MutedText,
        )
        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = value,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.SemiBold,
            color = BrandNavy,
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
    onDateSelected: (LocalDate) -> Unit,
) {
    val context = LocalContext.current
    val zoneId = remember { ZoneId.systemDefault() }

    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.SemiBold,
            color = BrandNavy,
        )
        Spacer(modifier = Modifier.weight(1f))
        Surface(
            modifier = Modifier.clickable {
                DatePickerDialog(
                    context,
                    { _, year, month, dayOfMonth ->
                        onDateSelected(LocalDate.of(year, month + 1, dayOfMonth))
                    },
                    date.year,
                    date.monthValue - 1,
                    date.dayOfMonth,
                ).apply {
                    datePicker.minDate = minimumDate.atStartOfDay(zoneId).toInstant().toEpochMilli()
                }.show()
            },
            color = Color(0xFFF1F3F6),
            shape = RoundedCornerShape(999.dp),
        ) {
            Text(
                text = date.toDisplayDate(),
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.SemiBold,
                color = BrandNavy,
            )
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
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    var startDate by remember(carId) { mutableStateOf(LocalDate.now()) }
    var endDate by remember(carId) { mutableStateOf(LocalDate.now().plusDays(1)) }
    var region by remember(carId) { mutableStateOf("Greater Accra Region") }
    var city by remember(carId) { mutableStateOf("Accra") }
    var address by remember(carId) { mutableStateOf("") }
    var paymentMessage by rememberSaveable(carId) { mutableStateOf<String?>(null) }
    var isProcessingPayment by rememberSaveable(carId) { mutableStateOf(false) }
    var initialized by rememberSaveable(carId) { mutableStateOf(false) }
    var awaitingPaymentReturn by rememberSaveable(carId) { mutableStateOf(false) }

    LaunchedEffect(carId) {
        viewModel.loadCarDetail(carId)
        viewModel.loadReferenceData()
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
        initialized = true
    }

    LaunchedEffect(startDate) {
        if (!endDate.isAfter(startDate)) {
            endDate = startDate.plusDays(1)
        }
    }

    LaunchedEffect(cityOptions, region) {
        if (cityOptions.none { it.equals(city, ignoreCase = true) }) {
            city = cityOptions.firstOrNull() ?: city
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
                isProcessingPayment = true
                paymentMessage = null
                viewModel.finalizePaystack(
                    request = PaystackFinalizeRequest(
                        bookingId = pendingCheckout!!.bookingId,
                        carId = carId,
                        startDate = startDate.toApiDate(),
                        endDate = endDate.toApiDate(),
                        tripUseRegion = region.trim(),
                        tripUseCity = city.trim(),
                        tripUseAddress = address.trim(),
                        reference = pendingCheckout!!.reference,
                        amount = (pendingCheckout!!.amount ?: 0.0).roundToInt(),
                    ),
                    onSuccess = { conversationId ->
                        isProcessingPayment = false
                        if (!conversationId.isNullOrBlank()) {
                            viewModel.showMessage("Payment successful.")
                            onOpenConversation(conversationId)
                        } else {
                            viewModel.showMessage("Payment successful. Your booking is now in Trips.")
                            onBookingCompleted()
                        }
                    },
                    onError = {
                        isProcessingPayment = false
                        paymentMessage = it
                    },
                )
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
                    CheckoutTopBar(
                        isProcessingPayment = false,
                        onBack = onBack,
                        onPay = {},
                    )
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
                    CheckoutTopBar(
                        isProcessingPayment = false,
                        onBack = onBack,
                        onPay = {},
                    )
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
            val deliveryFee = (car.delivery_fee ?: 0.0).roundToInt().coerceAtLeast(0)
            val depositAmount = (car.deposit_amount ?: 0.0).roundToInt().coerceAtLeast(0)
            val outsideListingRegion = !region.equals(car.region.orEmpty(), ignoreCase = true)
            val outsideRegionFee = (car.outside_accra_fee ?: 0.0).roundToInt().coerceAtLeast(0)
            val outsideSurcharge = if (outsideListingRegion) outsideRegionFee else 0
            val tripOutsideAccra = !region.contains("accra", ignoreCase = true) || !city.contains("accra", ignoreCase = true)
            val nights = max(1, ChronoUnit.DAYS.between(startDate, endDate).toInt())
            val subtotal = pricePerDay * nights

            fun finalizePendingPayment(referenceOverride: String? = null) {
                val checkout = pendingCheckout ?: return
                val resolvedReference = referenceOverride
                    ?.trim()
                    ?.takeIf { it.isNotBlank() }
                    ?: checkout.reference
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
                        tripUseAddress = address.trim(),
                        reference = resolvedReference,
                        amount = (checkout.amount ?: 0.0).roundToInt(),
                    ),
                    onSuccess = { conversationId ->
                        isProcessingPayment = false
                        if (!conversationId.isNullOrBlank()) {
                            viewModel.showMessage("Payment successful.")
                            onOpenConversation(conversationId)
                        } else {
                            viewModel.showMessage("Payment successful. Your booking is now in Trips.")
                            onBookingCompleted()
                        }
                    },
                    onError = {
                        isProcessingPayment = false
                        paymentMessage = it
                    },
                )
            }

            fun beginPayment() {
                if (!isAuthenticated) {
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

                val normalizedRegion = region.trim()
                val normalizedCity = city.trim()
                val normalizedAddress = address.trim()
                if (normalizedCity.isBlank() || normalizedAddress.length < 3) {
                    paymentMessage = "Enter city and exact area/destination (minimum 3 characters)."
                    return
                }

                isProcessingPayment = true
                paymentMessage = null
                viewModel.setBookingDraft(
                    carId = carId,
                    startDate = startDate.toApiDate(),
                    endDate = endDate.toApiDate(),
                    region = normalizedRegion,
                    city = normalizedCity,
                    address = normalizedAddress,
                )
                viewModel.createBookingHoldAndInitiatePayment(
                    carId = carId,
                    startDate = startDate.toApiDate(),
                    endDate = endDate.toApiDate(),
                    tripUseRegion = normalizedRegion,
                    tripUseCity = normalizedCity,
                    tripUseAddress = normalizedAddress,
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
                    if (callbackResult.isCancelled) {
                        paymentMessage = "Payment was cancelled or not completed."
                    } else {
                        finalizePendingPayment(callbackResult.reference)
                    }
                }
            }

            Scaffold(
                containerColor = PageBackground,
                topBar = {
                    CheckoutTopBar(
                        isProcessingPayment = isProcessingPayment,
                        onBack = onBack,
                        onPay = ::beginPayment,
                    )
                },
            ) { inner ->
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(inner)
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    item {
                        Spacer(modifier = Modifier.height(6.dp))
                        SectionHeader(title = "Trip dates")
                        DetailSectionCard {
                            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                DateSelectionRow(label = "Start date", date = startDate, minimumDate = LocalDate.now()) { startDate = it }
                                DateSelectionRow(label = "End date", date = endDate, minimumDate = startDate.plusDays(1)) { endDate = it }
                                Text("Quick select days", color = BrandNavy, fontWeight = FontWeight.SemiBold)
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    SecondaryPillButton(text = "2 days", modifier = Modifier.weight(1f)) { endDate = startDate.plusDays(2) }
                                    SecondaryPillButton(text = "5 days", modifier = Modifier.weight(1f)) { endDate = startDate.plusDays(5) }
                                    SecondaryPillButton(text = "7 days", modifier = Modifier.weight(1f)) { endDate = startDate.plusDays(7) }
                                }
                            }
                        }
                    }

                    item {
                        SectionHeader(title = "Trip use location")
                        DetailSectionCard {
                            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
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
                                    placeholder = { Text("Exact area / destination") },
                                    shape = RoundedCornerShape(14.dp),
                                )
                                Text("Minimum 3 characters.", style = MaterialTheme.typography.labelLarge, color = MutedText)
                                Text(
                                    text = if (outsideListingRegion) {
                                        if (outsideRegionFee > 0) "Outside listing region trip (+GHS$outsideRegionFee)" else "Outside listing region trip"
                                    } else {
                                        "Within listing region (no outside-region surcharge)"
                                    },
                                    style = MaterialTheme.typography.bodyLarge,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (outsideListingRegion) Warning else Success,
                                )
                                if (outsideListingRegion) {
                                    Text(
                                        text = "Trip use region differs from listing region (${car.region ?: "Unknown"}).",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MutedText,
                                    )
                                }
                                if (tripOutsideAccra) {
                                    Text(
                                        text = "Trip use location is also outside Accra.",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MutedText,
                                    )
                                }
                            }
                        }
                    }

                    item {
                        SectionHeader(title = "Summary")
                        DetailSectionCard {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                InfoLine(label = "Car", value = carTitle)
                                InfoLine(label = "Dates", value = "${startDate.toDisplayDate()} - ${endDate.toDisplayDate()}")
                                InfoLine(label = "Daily x $nights", value = "GHS$subtotal")
                                InfoLine(label = "Insurance fee", value = "GHS$insuranceFee")
                                InfoLine(label = "Delivery fee", value = "GHS$deliveryFee")
                                if (outsideRegionFee > 0 || outsideListingRegion) {
                                    InfoLine(
                                        label = if (outsideListingRegion) "Outside listing region surcharge" else "Outside listing region surcharge (not applied)",
                                        value = "GHS$outsideSurcharge",
                                    )
                                }
                                InfoLine(label = "Deposit", value = "GHS$depositAmount")
                                Text(
                                    text = "Final payable amount is calculated by the server during checkout.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MutedText,
                                )
                            }
                        }
                    }

                    if (!paymentMessage.isNullOrBlank()) {
                        item {
                            DetailSectionCard {
                                Text(paymentMessage.orEmpty(), color = Danger, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }

                    if (pendingCheckout != null) {
                        item {
                            DetailSectionCard {
                                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Text(
                                        "Payment pending",
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = BrandNavy,
                                    )
                                    Text(
                                        "Complete the payment in the secure checkout sheet. We'll detect completion automatically when you return.",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MutedText,
                                    )
                                    InfoLine(label = "Reference", value = pendingCheckout!!.reference)
                                    GradientPillButton(
                                        text = "Verify payment",
                                        modifier = Modifier.fillMaxWidth(),
                                        onClick = { finalizePendingPayment() },
                                    )
                                }
                            }
                        }
                    }

                    item { Spacer(modifier = Modifier.height(24.dp)) }
                }

                if (isProcessingPayment) {
                    PaymentProcessingOverlay()
                }
            }
        }

        else -> Unit
    }
}

@Composable
private fun CheckoutTopBar(
    isProcessingPayment: Boolean,
    onBack: () -> Unit,
    onPay: () -> Unit,
) {
    Surface(color = Color.White, shadowElevation = 2.dp) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 10.dp),
        ) {
            TextButton(onClick = onBack, modifier = Modifier.align(Alignment.CenterStart)) {
                Text("Cancel", color = BrandBlue, fontWeight = FontWeight.Bold)
            }
            Text(
                text = "Checkout",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.ExtraBold,
                color = BrandNavy,
                modifier = Modifier.align(Alignment.Center),
            )
            TextButton(
                onClick = onPay,
                enabled = !isProcessingPayment,
                modifier = Modifier.align(Alignment.CenterEnd),
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    if (isProcessingPayment) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp,
                            color = BrandBlue,
                        )
                    }
                    Text(
                        text = if (isProcessingPayment) "Processing..." else "Pay",
                        color = BrandBlue,
                        fontWeight = FontWeight.Bold,
                    )
                }
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
    val cancelled = reference == null && (
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

    Scaffold(
        topBar = {
            PageTopBar(title = "Dashboard")
        },
    ) { inner ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(inner).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Text("Host Dashboard", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold, color = BrandNavy)
            }
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text("Host mode", style = MaterialTheme.typography.titleMedium, color = BrandNavy, fontWeight = FontWeight.Bold)
                                Text("Turn off Host mode to move back to User mode.", color = MutedText, style = MaterialTheme.typography.bodyMedium)
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
                    colors = CardDefaults.cardColors(containerColor = Color.White),
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
                            Text(fullName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = BrandNavy)
                            Text("Manage host settings", color = MutedText, style = MaterialTheme.typography.bodyMedium)
                        }
                        SecondaryPillButton(text = "Open", onClick = onOpenProfile)
                    }
                }
            }
            if (urgentBookings.isNotEmpty()) {
                item {
                    Card(
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("Urgent booking requests", color = Danger, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                            Text("You have ${urgentBookings.size} request(s) waiting for approval.", color = MutedText, style = MaterialTheme.typography.bodyMedium)
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
            item { Text("Quick nav", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold, color = BrandNavy) }
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

    LaunchedEffect(Unit) { viewModel.loadMyCars() }

    Scaffold(
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
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 18.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Icon(Icons.Outlined.AddCircleOutline, contentDescription = null, tint = BrandBlue)
                        Text("Create Listing", color = BrandNavy, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                    }
                }
            }
            item {
                Text("My car listing", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = BrandNavy)
            }
            when (val s = state) {
                UiState.Loading -> item { LoadingBlock("Loading host listings...") }
                is UiState.Error -> item { ErrorBlock(s.message, onRetry = { viewModel.loadMyCars() }) }
                UiState.Empty -> item { EmptyBlock("No listings yet", "Create your first listing to start hosting.") }
                is UiState.Success -> {
                    items(s.data, key = { it.id }) { car ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onEdit(car.id) },
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                                    Text(
                                        car.title ?: listOfNotNull(car.brand, car.model).joinToString(" "),
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = BrandNavy,
                                        modifier = Modifier.weight(1f),
                                    )
                                    StatusBadge(status = if (car.approval_status.equals("approved", ignoreCase = true)) "approved" else "pending")
                                }
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(listOfNotNull(car.city, car.region).joinToString(", "), color = MutedText)
                                    Text("GH₵${(car.daily_price ?: 0.0).toInt()} / day", color = BrandBlue, fontWeight = FontWeight.Bold)
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

    val regionOptions = remember(locations, region) {
        withCurrentOption(locations.keys.filter { it.isNotBlank() }.sorted(), region)
    }
    val cityOptions = remember(locations, region, city) {
        val options = if (region.isBlank()) emptyList() else locations[region].orEmpty()
        withCurrentOption(options.filter { it.isNotBlank() }.distinct().sorted(), city)
    }
    val brandOptions = remember(catalog, brand) {
        withCurrentOption(catalog.keys.filter { it.isNotBlank() }.sorted(), brand)
    }
    val modelOptions = remember(catalog, brand, model) {
        withCurrentOption(catalog[brand].orEmpty().filter { it.isNotBlank() }.distinct().sorted(), model)
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
        }
    }

    LaunchedEffect(region, cityOptions) {
        if (city.isNotBlank() && city !in cityOptions) {
            city = cityOptions.firstOrNull().orEmpty()
        }
    }

    LaunchedEffect(brand, modelOptions) {
        if (model.isNotBlank() && model !in modelOptions) {
            model = modelOptions.firstOrNull().orEmpty()
        }
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
        val parsedYear = yearInput.trim().toIntOrNull()
        val parsedDailyPrice = dailyPrice.trim().toIntOrNull()
        val parsedSeats = seats.trim().toIntOrNull()
        val parsedDeliveryFee = deliveryFee.trim().toIntOrNull() ?: 0
        val parsedInsuranceFee = insuranceFee.trim().toIntOrNull() ?: 0
        val parsedDepositAmount = depositAmount.trim().toIntOrNull() ?: 0
        val parsedOutsideAccraFee = outsideAccraFee.trim().toIntOrNull() ?: 0
        val normalizedCancellation = cancellationPolicy.trim().ifBlank { "Moderate" }

        editorError = when {
            brand.trim().isEmpty() -> "Brand is required."
            model.trim().isEmpty() -> "Model is required."
            parsedYear == null || parsedYear !in minListingYear..maxListingYear -> "Enter a valid year."
            parsedDailyPrice == null || parsedDailyPrice !in 50..10_000 -> "Daily price must be between GHS 50 and GHS 10,000."
            region.trim().length < 2 -> "Region is required."
            city.trim().length < 2 -> "City is required."
            description.trim().length < 10 -> "Description must be at least 10 characters."
            parsedSeats == null || parsedSeats !in 2..8 -> "Seats must be between 2 and 8."
            normalizedCancellation !in cancellationOptions -> "Choose a valid cancellation policy."
            else -> null
        }
        if (editorError != null) {
            editorNotice = null
            return
        }

        editorNotice = null
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

    Scaffold(
        topBar = {
            Surface(color = Color.White, tonalElevation = 2.dp) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
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
                    Text(
                        if (isCreate) "Create Listing" else "Edit Listing",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = BrandNavy,
                        modifier = Modifier.weight(1f),
                    )
                    TextButton(onClick = ::saveListing, enabled = !isSaving) {
                        Text(
                            if (isSaving) "Saving..." else if (isCreate) "Create" else "Save",
                            color = BrandBlue,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }
            }
        },
    ) { inner ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(inner).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Listing", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = BrandNavy)
                        OutlinedTextField(
                            value = title,
                            onValueChange = { title = it },
                            label = { Text("Listing title") },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                        )
                        SelectionTextField(label = "Brand", value = brand, options = brandOptions, onValueChange = { brand = it }, allowCustomValue = false)
                        SelectionTextField(label = "Model", value = model, options = modelOptions, onValueChange = { model = it }, allowCustomValue = false)
                        OutlinedTextField(
                            value = yearInput,
                            onValueChange = { yearInput = it.filter(Char::isDigit).take(4) },
                            label = { Text("Year") },
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            shape = RoundedCornerShape(16.dp),
                        )
                        Text(
                            "Valid range: $minListingYear-$maxListingYear",
                            style = MaterialTheme.typography.labelLarge,
                            color = MutedText,
                        )
                    }
                }
            }
            item {
                Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Pricing", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = BrandNavy)
                        OutlinedTextField(
                            value = dailyPrice,
                            onValueChange = { dailyPrice = it.filter(Char::isDigit) },
                            label = { Text("Daily price") },
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            shape = RoundedCornerShape(16.dp),
                            suffix = { Text("/day") },
                        )
                        OutlinedTextField(
                            value = insuranceFee,
                            onValueChange = { insuranceFee = it.filter(Char::isDigit) },
                            label = { Text("Insurance (per trip)") },
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            shape = RoundedCornerShape(16.dp),
                        )
                        OutlinedTextField(
                            value = depositAmount,
                            onValueChange = { depositAmount = it.filter(Char::isDigit) },
                            label = { Text("Security deposit") },
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            shape = RoundedCornerShape(16.dp),
                        )
                    }
                }
            }
            item {
                Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Location", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = BrandNavy)
                        SelectionTextField(label = "Region", value = region, options = regionOptions, onValueChange = { region = it }, allowCustomValue = false)
                        SelectionTextField(label = "City", value = city, options = cityOptions, onValueChange = { city = it }, allowCustomValue = false)
                    }
                }
            }
            item {
                Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Vehicle info", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = BrandNavy)
                        SelectionTextField(label = "Car type", value = carType, options = typeOptions, onValueChange = { carType = it }, allowCustomValue = false)
                        SelectionTextField(label = "Transmission", value = transmission, options = transmissionOptions, onValueChange = { transmission = it }, allowCustomValue = false)
                        SelectionTextField(label = "Fuel", value = fuelType, options = fuelOptions, onValueChange = { fuelType = it }, allowCustomValue = false)
                        OutlinedTextField(
                            value = seats,
                            onValueChange = { seats = it.filter(Char::isDigit).take(1) },
                            label = { Text("Seats") },
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            shape = RoundedCornerShape(16.dp),
                        )
                        OutlinedTextField(
                            value = description,
                            onValueChange = { description = it },
                            label = { Text("Description") },
                            modifier = Modifier.fillMaxWidth(),
                            minLines = 3,
                            maxLines = 8,
                            shape = RoundedCornerShape(16.dp),
                        )
                    }
                }
            }
            item {
                Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Booking options", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = BrandNavy)
                        HostToggleRow("Instant Book", instantBook) { instantBook = it }
                        HostToggleRow("Delivery available", deliveryAvailable) { deliveryAvailable = it }
                        HostToggleRow("Air conditioning", airConditioning) { airConditioning = it }
                        SelectionTextField(label = "Cancellation", value = cancellationPolicy, options = cancellationOptions, onValueChange = { cancellationPolicy = it }, allowCustomValue = false)
                    }
                }
            }
            item {
                Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Extra fees", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = BrandNavy)
                        if (deliveryAvailable) {
                            OutlinedTextField(
                                value = deliveryFee,
                                onValueChange = { deliveryFee = it.filter(Char::isDigit) },
                                label = { Text("Delivery fee") },
                                modifier = Modifier.fillMaxWidth(),
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                shape = RoundedCornerShape(16.dp),
                            )
                        } else {
                            Text(
                                "Delivery fee is disabled until delivery is enabled.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MutedText,
                            )
                        }
                        OutlinedTextField(
                            value = outsideAccraFee,
                            onValueChange = { outsideAccraFee = it.filter(Char::isDigit) },
                            label = { Text("Outside listing region fee") },
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            shape = RoundedCornerShape(16.dp),
                        )
                    }
                }
            }
            item {
                Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Photos", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = BrandNavy)
                        Text(
                            "Upload from Photos or Files. Maximum 7 photos, up to 4MB each. Best quality: clear landscape shots around 1600x900 or higher.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MutedText,
                        )
                        if (isCreate) {
                            if (pendingUploads.isEmpty()) {
                                Text("No photos selected yet.", style = MaterialTheme.typography.labelLarge, color = MutedText)
                            } else {
                                LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    items(pendingUploads, key = { it.id }) { pending ->
                                        Box {
                                            AsyncImage(
                                                model = pending.previewUri,
                                                contentDescription = pending.name,
                                                modifier = Modifier
                                                    .size(width = 96.dp, height = 72.dp)
                                                    .clip(RoundedCornerShape(10.dp)),
                                                contentScale = ContentScale.Crop,
                                            )
                                            IconButton(
                                                onClick = { removePendingUpload(pending.id) },
                                                modifier = Modifier
                                                    .align(Alignment.TopEnd)
                                                    .offset(x = 6.dp, y = (-6).dp)
                                                    .size(28.dp)
                                                    .background(Color.White.copy(alpha = 0.92f), CircleShape),
                                            ) {
                                                Icon(Icons.Outlined.Close, contentDescription = "Remove photo", tint = Danger)
                                            }
                                        }
                                    }
                                }
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
                            Text(
                                "${pendingUploads.size} / $maxPhotos selected. Selected images upload automatically after listing creation.",
                                style = MaterialTheme.typography.labelLarge,
                                color = MutedText,
                            )
                        } else if (!carId.isNullOrBlank() && carId != "new") {
                            SecondaryPillButton(
                                text = "Manage listing photos",
                                modifier = Modifier.fillMaxWidth(),
                                onClick = { onOpenPhotos(carId) },
                            )
                        }
                    }
                }
            }
            item {
                Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Availability", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = BrandNavy)
                        if (isCreate) {
                            Text(
                                "Create the listing first, then configure availability windows.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = Warning,
                            )
                        } else if (!carId.isNullOrBlank() && carId != "new") {
                            SecondaryPillButton(
                                text = "Edit blocked dates and weekly blocks",
                                modifier = Modifier.fillMaxWidth(),
                                onClick = { onOpenAvailability(carId) },
                            )
                        }
                    }
                }
            }
            if (!editorNotice.isNullOrBlank()) {
                item {
                    Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                        Text(editorNotice.orEmpty(), color = Success, modifier = Modifier.padding(16.dp))
                    }
                }
            }
            if (!editorError.isNullOrBlank()) {
                item {
                    Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                        Text(editorError.orEmpty(), color = Danger, modifier = Modifier.padding(16.dp))
                    }
                }
            }
            item {
                GradientPillButton(
                    text = if (isSaving) "Saving..." else if (isCreate) "Create listing" else "Save listing",
                    modifier = Modifier.fillMaxWidth(),
                    onClick = ::saveListing,
                )
            }
            item { Spacer(modifier = Modifier.height(24.dp)) }
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
    val currentUserId = me?.user?.id.orEmpty()

    LaunchedEffect(Unit) { viewModel.loadBookings() }

    val hostBookings = (bookingsState as? UiState.Success<List<BookingDto>>)
        ?.data
        .orEmpty()
        .filter { isHostBooking(it, currentUserId) }

    Scaffold(
        topBar = {
            PageTopBar(title = "Host Bookings")
        },
    ) { inner ->
        LazyColumn(
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
                            Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
                                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                            Text("Booking Request", style = MaterialTheme.typography.labelMedium, color = MutedText, fontWeight = FontWeight.Bold)
                                            Text(booking.renter?.full_name ?: "Guest", style = MaterialTheme.typography.titleMedium, color = BrandNavy, fontWeight = FontWeight.Bold)
                                            Text(booking.cars?.title ?: "Hayame listing", style = MaterialTheme.typography.bodyLarge, color = BrandBlue, fontWeight = FontWeight.SemiBold)
                                        }
                                        StatusBadge(status = booking.status ?: "pending")
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
                                    if (booking.status.equals("awaiting_host", ignoreCase = true) && !booking.payment_status.equals("paid", ignoreCase = true)) {
                                        Text("Waiting for renter payment before approval.", color = Warning, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
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

    Scaffold(
        topBar = {
            PageTopBar(title = "Earnings")
        },
    ) { inner ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(inner).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Text("Payouts overview", style = MaterialTheme.typography.headlineSmall, color = BrandNavy, fontWeight = FontWeight.ExtraBold)
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                    HostMetricCard(title = "Total earned", value = "GHS$totalEarned", modifier = Modifier.weight(1f))
                    HostMetricCard(title = "Pending", value = "GHS$pendingPayout", modifier = Modifier.weight(1f))
                }
            }
            item {
                Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Revenue trend", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = BrandNavy)
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
                                                        colors = listOf(BrandBlue, BrandNavy),
                                                    )
                                                )
                                        )
                                        Text(bucket.month, style = MaterialTheme.typography.labelMedium, color = MutedText)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            item {
                Text("Payout history", style = MaterialTheme.typography.headlineSmall, color = BrandNavy, fontWeight = FontWeight.ExtraBold)
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                    HostMetricCard(title = "Completed trips", value = "$completedTrips", modifier = Modifier.weight(1f))
                    HostMetricCard(title = "Tracked months", value = "${monthlySeries.size}", modifier = Modifier.weight(1f))
                }
            }
            items(monthlySeries, key = { it.month }) { bucket ->
                Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Row(modifier = Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(bucket.month, color = BrandNavy, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
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
    LaunchedEffect(Unit) { viewModel.loadHostReviews() }

    Scaffold(
        topBar = {
            Row(modifier = Modifier.fillMaxWidth().background(Color.White).padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back") }
                Text("Host Reviews", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 8.dp))
            }
        },
    ) { inner ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(inner).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            when (val s = state) {
                UiState.Loading -> item { LoadingBlock("Loading reviews...") }
                is UiState.Error -> item { ErrorBlock(s.message, onRetry = { viewModel.loadHostReviews() }) }
                UiState.Empty -> item { EmptyBlock("No reviews yet", "Reviews from completed trips will appear here.") }
                is UiState.Success -> {
                    items(s.data, key = { it.id }) { review ->
                        Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text("Rating: ${review.rating ?: 0}", color = BrandNavy, fontWeight = FontWeight.Bold)
                                Text(review.comment ?: "No comment", color = MutedText)
                                Text(review.created_at ?: "", style = MaterialTheme.typography.labelSmall, color = MutedText)
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
        topBar = {
            Row(modifier = Modifier.fillMaxWidth().background(Color.White).padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back") }
                Text("Edit Profile", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 8.dp))
            }
        },
    ) { inner ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(inner).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
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
                                Text(me.preferredFullName() ?: "Guest User", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = BrandNavy)
                                Text(me.preferredEmail() ?: me?.user?.email.orEmpty(), style = MaterialTheme.typography.bodyMedium, color = MutedText)
                                Text("Upload a clear headshot (JPG/PNG).", style = MaterialTheme.typography.bodyMedium, color = MutedText)
                            }
                        }
                        Row(horizontalArrangement = Arrangement.End, modifier = Modifier.fillMaxWidth()) {
                            OutlinedButton(
                                onClick = { pickAvatar.launch("image/*") },
                                shape = RoundedCornerShape(16.dp),
                                border = BorderStroke(1.dp, BrandBlue.copy(alpha = 0.24f)),
                                modifier = Modifier.height(48.dp),
                            ) {
                                Text("Change photo", color = BrandBlue, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
            item {
                Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(value = firstName, onValueChange = { firstName = it }, label = { Text("First name") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(16.dp))
                            OutlinedTextField(value = lastName, onValueChange = { lastName = it }, label = { Text("Last name") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(16.dp))
                        }
                        OutlinedTextField(value = phone, onValueChange = { phone = it }, label = { Text("Phone") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp))
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

    Scaffold(
        topBar = {
            PageTopBar(title = "Profile")
        },
    ) { inner ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(inner).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
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
                                Text(fullName, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = BrandNavy)
                                Text(email, style = MaterialTheme.typography.bodyMedium, color = MutedText)
                            }
                        }
                        HorizontalDivider(color = Color.LightGray.copy(alpha = 0.2f))
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Icon(Icons.Outlined.LocationOn, contentDescription = null, tint = MutedText)
                            Text(location, style = MaterialTheme.typography.bodyMedium, color = BrandNavy)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Icon(Icons.Outlined.Shield, contentDescription = null, tint = BrandBlue)
                            Text("Host level: $hostLevel", style = MaterialTheme.typography.bodyMedium, color = BrandBlue, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
            item {
                Text("Notifications", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = BrandNavy)
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
                Text("Host", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = BrandNavy)
            }
            item {
                Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(8.dp)) {
                        ActionRow("Guest feedback", Icons.Outlined.FavoriteBorder, onOpenReviews)
                        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = Color.LightGray.copy(alpha = 0.2f))
                        ActionRow("Favorites analytics", Icons.Outlined.FavoriteBorder, onOpenFavorites)
                        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = Color.LightGray.copy(alpha = 0.2f))
                        ActionRow("Contact", Icons.Outlined.MailOutline, onOpenContact)
                        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = Color.LightGray.copy(alpha = 0.2f))
                        ActionRow("Protection", Icons.Outlined.Shield, onOpenProtection)
                        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = Color.LightGray.copy(alpha = 0.2f))
                        ActionRow("Cancellation", Icons.Outlined.CalendarMonth, onOpenCancellation)
                    }
                }
            }
            item {
                Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(8.dp)) {
                        ActionRow("Turn off Host mode", Icons.Outlined.Home, onTurnOffHostMode)
                        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = Color.LightGray.copy(alpha = 0.2f))
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
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(title, style = MaterialTheme.typography.labelMedium, color = MutedText)
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold, color = BrandNavy)
        }
    }
}

@Composable
private fun PageTopBar(title: String, onBack: (() -> Unit)? = null) {
    Surface(color = Color.White, tonalElevation = 2.dp) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (onBack != null) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                }
                Text(
                    title,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(start = 8.dp),
                )
            } else {
                Text(
                    title,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = BrandNavy,
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

private fun resolveAppImage(raw: String?): String? = RemoteImageUrlResolver.resolve(raw)

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
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
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
                    .background(BrandLight),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = null, tint = BrandBlue, modifier = Modifier.size(28.dp))
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(title, style = MaterialTheme.typography.headlineMedium, color = BrandNavy, fontWeight = FontWeight.Bold)
                Text(subtitle, style = MaterialTheme.typography.titleLarge, color = MutedText, fontWeight = FontWeight.Medium)
            }
            Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = Color.LightGray, modifier = Modifier.size(28.dp))
        }
    }
}

@Composable
private fun HostToggleRow(label: String, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(label, modifier = Modifier.weight(1f), color = BrandNavy, style = MaterialTheme.typography.bodyLarge)
        Switch(checked = checked, onCheckedChange = onCheckedChange)
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
                        Icon(Icons.Outlined.ExpandMore, contentDescription = "Options")
                    }
                }
            },
            shape = RoundedCornerShape(16.dp),
        )
        if (options.isNotEmpty()) {
            DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                options.forEach { option ->
                    DropdownMenuItem(
                        text = { Text(option) },
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

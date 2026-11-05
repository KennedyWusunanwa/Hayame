package com.hayame.app.ui.screens

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
import androidx.compose.animation.core.animateIntAsState
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.EventAvailable
import androidx.compose.material.icons.outlined.HourglassEmpty
import androidx.compose.material.icons.outlined.Inbox
import androidx.compose.material.icons.outlined.PhotoLibrary
import androidx.compose.material.icons.outlined.ReceiptLong
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.TrendingUp
import androidx.compose.runtime.mutableIntStateOf
import java.text.NumberFormat

// MARK: Host management --------------------------------------------------------------------------
//
// My cars, Bookings and Earnings for hosts, in the flat, image-first language the rest of the
// app uses: big titles with a muted count line, borderless photo rows, light chips for actions,
// flat brand-blue buttons, shimmer skeletons and staggered entrances.

private fun hostCurrency(amount: Int): String = "GH₵" + NumberFormat.getIntegerInstance(Locale.US).format(amount)

private fun hostDateLabel(raw: String?): String {
    val date = runCatching { LocalDate.parse(raw.orEmpty().take(10)) }.getOrNull() ?: return raw.orEmpty().take(10).ifBlank { "-" }
    return date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
}

private fun hostNights(start: String?, end: String?): Int {
    val s = runCatching { LocalDate.parse(start.orEmpty().take(10)) }.getOrNull() ?: return 1
    val e = runCatching { LocalDate.parse(end.orEmpty().take(10)) }.getOrNull() ?: return 1
    return ChronoUnit.DAYS.between(s, e).toInt().coerceAtLeast(1)
}

private fun hostListingTitle(car: CarDto): String =
    car.title?.trim()?.takeIf { it.isNotBlank() }
        ?: listOfNotNull(car.brand?.trim(), car.model?.trim()).filter { it.isNotBlank() }.joinToString(" ").ifBlank { "Hayame listing" }

private fun hostListingImage(car: CarDto): String? =
    resolveAppImage(car.image_url) ?: car.car_photos.orEmpty().firstNotNullOfOrNull { resolveAppImage(it.url) }

private fun hostBookingImage(booking: BookingDto): String? =
    resolveAppImage(booking.cars?.image_url) ?: booking.cars?.car_photos.orEmpty().firstNotNullOfOrNull { resolveAppImage(it.url) }

// MARK: Shared pieces ----------------------------------------------------------------------------

@Composable
private fun HostPageHeader(title: String, subtitle: String, trailing: @Composable () -> Unit = {}) {
    val colors = LocalHayameColors.current
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(title, fontSize = 30.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy)
            Text(subtitle, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = colors.mutedText)
        }
        trailing()
    }
}

/** Flat brand-blue button with an optional leading icon. */
@Composable
private fun HostFlatButton(
    text: String,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    container: Color = LocalHayameColors.current.brandBlue,
    content: Color = Color.White,
    enabled: Boolean = true,
    onClick: () -> Unit,
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.height(48.dp),
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = container,
            contentColor = content,
            disabledContainerColor = container.copy(alpha = 0.5f),
            disabledContentColor = content.copy(alpha = 0.8f),
        ),
        elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp, pressedElevation = 0.dp),
    ) {
        if (icon != null) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
        }
        Text(text, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
    }
}

/** Light grey chip with an outline icon, for row-level actions. */
@Composable
private fun HostActionChip(
    text: String,
    icon: ImageVector,
    onClick: () -> Unit,
    tint: Color = LocalHayameColors.current.brandNavy,
    container: Color = LocalHayameColors.current.fieldBackground,
) {
    Surface(onClick = onClick, shape = RoundedCornerShape(12.dp), color = container) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(15.dp))
            Text(text, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = tint)
        }
    }
}

@Composable
private fun HostThumbnail(imageUrl: String?, width: Dp, height: Dp, cornerRadius: Dp = 18.dp, modifier: Modifier = Modifier) {
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
            Icon(Icons.Outlined.DirectionsCar, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(24.dp))
        }
    }
}

/** Flat stat tile: tinted icon square, big number that counts up on first show, muted label. */
@Composable
private fun HostStatTileFlat(
    title: String,
    amount: Int,
    icon: ImageVector,
    tint: Color,
    modifier: Modifier = Modifier,
    formatter: (Int) -> String = { hostCurrency(it) },
) {
    val colors = LocalHayameColors.current
    var revealed by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { revealed = true }
    val shown by animateIntAsState(if (revealed) amount else 0, tween(700, easing = FastOutSlowInEasing), label = "stat-$title")
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(18.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(18.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Box(contentAlignment = Alignment.Center, modifier = Modifier.size(30.dp).background(tint.copy(alpha = 0.13f), RoundedCornerShape(9.dp))) {
            Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(16.dp))
        }
        Text(formatter(shown), fontSize = 20.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(title, style = MaterialTheme.typography.labelLarge, color = colors.mutedText, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

/** Two- or three-way switch whose flat pill slides between segments. */
@Composable
private fun HostSegmentedControl(
    segments: List<Pair<String, Int>>,
    selected: Int,
    onSelect: (Int) -> Unit,
) {
    val colors = LocalHayameColors.current
    BoxWithConstraints(
        modifier = Modifier
            .fillMaxWidth()
            .clip(CircleShape)
            .background(colors.cardBackground)
            .border(1.dp, colors.border, CircleShape)
            .padding(4.dp),
    ) {
        val count = segments.size.coerceAtLeast(1)
        val gap = 4.dp
        val segmentWidth = (maxWidth - gap * (count - 1)) / count
        val position by animateFloatAsState(selected.toFloat(), tween(280, easing = FastOutSlowInEasing), label = "host-segment")
        Box(
            modifier = Modifier
                .offset(x = (segmentWidth + gap) * position)
                .width(segmentWidth)
                .height(40.dp)
                .background(colors.brandBlue, CircleShape),
        )
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(gap)) {
            segments.forEachIndexed { index, (label, count) ->
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
                    if (count > 0) {
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
}

@Composable
private fun HostEmptyState(icon: ImageVector, title: String, message: String, actionTitle: String? = null, onAction: () -> Unit = {}) {
    val colors = LocalHayameColors.current
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
        Box(modifier = Modifier.size(84.dp).background(colors.brandLight, CircleShape), contentAlignment = Alignment.Center) {
            Icon(icon, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(36.dp))
        }
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
        Text(message, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText, textAlign = TextAlign.Center)
        if (actionTitle != null) {
            HostFlatButton(text = actionTitle, modifier = Modifier.fillMaxWidth(), onClick = onAction)
        }
    }
}

@Composable
private fun HostRowSkeleton() {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
        Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            HayameShimmerBlock(modifier = Modifier.size(width = 112.dp, height = 84.dp), cornerRadius = 18.dp)
            Column(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.weight(1f)) {
                HayameShimmerBlock(modifier = Modifier.size(width = 170.dp, height = 16.dp), cornerRadius = 6.dp)
                HayameShimmerBlock(modifier = Modifier.size(width = 120.dp, height = 12.dp), cornerRadius = 6.dp)
                HayameShimmerBlock(modifier = Modifier.size(width = 90.dp, height = 14.dp), cornerRadius = 6.dp)
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            repeat(3) { HayameShimmerBlock(modifier = Modifier.size(width = 86.dp, height = 34.dp), cornerRadius = 12.dp) }
        }
        HorizontalDivider(color = LocalHayameColors.current.border)
    }
}

@Composable
private fun HostInitialsAvatar(name: String?, size: Dp = 40.dp) {
    val colors = LocalHayameColors.current
    val initials = name.orEmpty().trim().split(" ").filter { it.isNotBlank() }.take(2).mapNotNull { it.firstOrNull()?.uppercaseChar() }.joinToString("").ifBlank { "G" }
    Box(
        modifier = Modifier.size(size).background(colors.brandLight, CircleShape).border(1.dp, colors.controlStroke, CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Text(initials, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
    }
}

// MARK: My cars ------------------------------------------------------------------------------------

@Composable
fun HostCarsScreen(
    viewModel: AppViewModel,
    onBack: () -> Unit,
    onCreate: () -> Unit,
    onEdit: (String) -> Unit,
    onOpenPhotos: (String) -> Unit = {},
    onOpenAvailability: (String) -> Unit = {},
) {
    CoachTour(
        id = "hostCars",
        steps = listOf(
            CoachStep("hostCars.add", "Add a listing", "List another car in a few steps."),
            CoachStep("hostCars.row", "Manage each car", "Edit details, photos and the days it's available."),
        ),
    )
    val state by viewModel.myCarsState.collectAsState()
    val colors = LocalHayameColors.current
    var deleteTarget by remember { mutableStateOf<CarDto?>(null) }

    LaunchedEffect(Unit) { viewModel.loadMyCars() }

    val cars = (state as? UiState.Success<List<CarDto>>)?.data.orEmpty()
    val liveCount = cars.count { it.approval_status.equals("approved", ignoreCase = true) }
    val isLoading = state is UiState.Loading || state is UiState.Idle
    val subtitle = when {
        isLoading -> "Loading your listings..."
        cars.isEmpty() -> "List a car to start hosting."
        else -> "${cars.size} listing${if (cars.size == 1) "" else "s"} • $liveCount live"
    }

    Scaffold(containerColor = colors.pageBackground) { inner ->
        HayameRefreshBox(
            onRefresh = { viewModel.loadMyCars() },
            modifier = Modifier.fillMaxSize(),
            indicatorTopPadding = inner.calculateTopPadding(),
        ) {
        LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(inner)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                item(key = "cars-header") {
                    Spacer(modifier = Modifier.height(16.dp))
                    StaggeredAppear(index = 0) { HostPageHeader(title = "My cars", subtitle = subtitle) }
                }
                item(key = "cars-add") {
                    StaggeredAppear(index = 1) {
                        HostFlatButton(text = "Add listing", icon = Icons.Outlined.Add, modifier = Modifier.fillMaxWidth().coachTarget("hostCars.add"), onClick = onCreate)
                    }
                }
                when (val s = state) {
                    UiState.Loading, UiState.Idle -> items(3, key = { "cars-skeleton-$it" }) { index ->
                        StaggeredAppear(index = index + 2) { HostRowSkeleton() }
                    }
                    is UiState.Error -> item(key = "cars-error") {
                        StaggeredAppear(index = 2) { ErrorBlock(s.message, onRetry = { viewModel.loadMyCars() }) }
                    }
                    UiState.Empty -> item(key = "cars-empty") {
                        StaggeredAppear(index = 2) {
                            HostEmptyState(
                                icon = Icons.Outlined.DirectionsCar,
                                title = "No listings yet",
                                message = "Create your first listing and it will show up here with its photos, calendar and price.",
                                actionTitle = "Add listing",
                                onAction = onCreate,
                            )
                        }
                    }
                    is UiState.Success -> {
                        if (cars.isEmpty()) {
                            item(key = "cars-empty") {
                                StaggeredAppear(index = 2) {
                                    HostEmptyState(
                                        icon = Icons.Outlined.DirectionsCar,
                                        title = "No listings yet",
                                        message = "Create your first listing and it will show up here with its photos, calendar and price.",
                                        actionTitle = "Add listing",
                                        onAction = onCreate,
                                    )
                                }
                            }
                        } else {
                            item(key = "cars-title") {
                                StaggeredAppear(index = 2) {
                                    Text("Your listings", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy, modifier = Modifier.padding(top = 4.dp))
                                }
                            }
                            items(cars, key = { it.id }) { car ->
                                StaggeredAppear(
                                    index = cars.indexOf(car) + 3,
                                    modifier = if (car.id == cars.first().id) Modifier.coachTarget("hostCars.row") else Modifier,
                                ) {
                                    HostListingRow(
                                        car = car,
                                        onOpen = { onEdit(car.id) },
                                        onPhotos = { onOpenPhotos(car.id) },
                                        onAvailability = { onOpenAvailability(car.id) },
                                        onDelete = { deleteTarget = car },
                                    )
                                }
                            }
                        }
                    }
                }
                item(key = "cars-footer") { Spacer(modifier = Modifier.height(24.dp)) }
            }
        }
    }

    deleteTarget?.let { car ->
        AlertDialog(
            onDismissRequest = { deleteTarget = null },
            containerColor = colors.cardBackground,
            title = { Text("Delete this listing?", color = colors.brandNavy, fontWeight = FontWeight.Bold) },
            text = { Text("${hostListingTitle(car)} will be removed from Hayame along with its photos and calendar.", color = colors.mutedText) },
            confirmButton = {
                TextButton(onClick = { viewModel.deleteCar(car.id); deleteTarget = null }) {
                    Text("Delete", color = colors.danger, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { deleteTarget = null }) { Text("Keep it", color = colors.brandBlue, fontWeight = FontWeight.Bold) }
            },
        )
    }
    @Suppress("UNUSED_EXPRESSION") onBack
}

@Composable
private fun HostListingRow(
    car: CarDto,
    onOpen: () -> Unit,
    onPhotos: () -> Unit,
    onAvailability: () -> Unit,
    onDelete: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val approved = car.approval_status.equals("approved", ignoreCase = true)
    val price = (car.daily_price ?: 0.0).roundToInt()
    val location = listOfNotNull(car.city?.trim(), car.region?.trim()).filter { it.isNotBlank() }.joinToString(", ").ifBlank { "Location not set" }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .clickable(onClick = onOpen),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.Top,
        ) {
            HostThumbnail(imageUrl = hostListingImage(car), width = 112.dp, height = 84.dp)
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        hostListingTitle(car),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = colors.brandNavy,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f),
                    )
                    Surface(shape = CircleShape, color = if (approved) colors.success.copy(alpha = 0.14f) else colors.warning.copy(alpha = 0.14f)) {
                        Text(
                            if (approved) "Live" else "In review",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (approved) colors.success else colors.warning,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        )
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.Place, contentDescription = null, tint = colors.mutedText, modifier = Modifier.size(13.dp))
                    Text(location, style = MaterialTheme.typography.bodySmall, color = colors.mutedText, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(hostCurrency(price), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                    Text("/day", style = MaterialTheme.typography.labelMedium, color = colors.mutedText, modifier = Modifier.padding(bottom = 2.dp, start = 2.dp))
                }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            HostActionChip("Edit", Icons.Outlined.Edit, onOpen)
            HostActionChip("Photos", Icons.Outlined.PhotoLibrary, onPhotos)
            HostActionChip("Calendar", Icons.Outlined.CalendarMonth, onAvailability)
            Spacer(modifier = Modifier.weight(1f))
            Surface(onClick = onDelete, shape = CircleShape, color = colors.danger.copy(alpha = 0.1f), modifier = Modifier.size(36.dp)) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(Icons.Outlined.DeleteOutline, contentDescription = "Delete listing", tint = colors.danger, modifier = Modifier.size(18.dp))
                }
            }
        }
        HorizontalDivider(color = colors.border)
    }
}

// MARK: Bookings -----------------------------------------------------------------------------------

private enum class HostBookingSegment(val label: String) { Requests("Requests"), Upcoming("Upcoming"), Past("Past") }

private fun hostSegmentFor(booking: BookingDto, today: LocalDate): HostBookingSegment {
    val status = booking.status.orEmpty().trim().lowercase()
    val end = runCatching { LocalDate.parse(booking.end_date.orEmpty().take(10)) }.getOrNull()
    return when {
        status == "awaiting_host" -> HostBookingSegment.Requests
        status == "completed" || status == "cancelled" || status == "rejected" || status == "refunded" -> HostBookingSegment.Past
        end != null && end.isBefore(today) -> HostBookingSegment.Past
        else -> HostBookingSegment.Upcoming
    }
}

@Composable
fun HostBookingsScreen(
    viewModel: AppViewModel,
    onBack: () -> Unit,
    onOpenConversation: (String) -> Unit = {},
) {
    CoachTour(
        id = "hostBookings",
        steps = listOf(
            CoachStep("hostBookings.segment", "Requests first", "New requests wait here until you approve or decline."),
        ),
    )
    val bookingsState by viewModel.bookingsState.collectAsState()
    val me by viewModel.me.collectAsState()
    val pendingBookingFocus by viewModel.pendingBookingFocus.collectAsState()
    val currentUserId = me?.user?.id.orEmpty()
    val listState = rememberLazyListState()
    val colors = LocalHayameColors.current
    var segment by rememberSaveable { mutableIntStateOf(0) }
    var rejectTarget by remember { mutableStateOf<BookingDto?>(null) }
    var highlightedId by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) { viewModel.loadBookings() }

    val today = LocalDate.now()
    val hostBookings = (bookingsState as? UiState.Success<List<BookingDto>>)
        ?.data
        .orEmpty()
        .filter { isHostBooking(it, currentUserId) }
    val requests = hostBookings.filter { hostSegmentFor(it, today) == HostBookingSegment.Requests }
    val upcoming = hostBookings.filter { hostSegmentFor(it, today) == HostBookingSegment.Upcoming }
        .sortedBy { it.start_date.orEmpty() }
    val past = hostBookings.filter { hostSegmentFor(it, today) == HostBookingSegment.Past }
        .sortedByDescending { it.created_at.orEmpty() }
    val shown = when (segment) { 0 -> requests; 1 -> upcoming; else -> past }
    val isLoading = bookingsState is UiState.Loading || bookingsState is UiState.Idle
    val subtitle = when {
        isLoading -> "Loading your bookings..."
        hostBookings.isEmpty() -> "Requests show up here when guests book your cars."
        requests.isNotEmpty() -> "${requests.size} request${if (requests.size == 1) "" else "s"} waiting for you"
        else -> "${upcoming.size} upcoming • ${past.size} past"
    }

    LaunchedEffect(pendingBookingFocus, hostBookings) {
        val bookingId = pendingBookingFocus ?: return@LaunchedEffect
        val booking = hostBookings.firstOrNull { it.id == bookingId } ?: return@LaunchedEffect
        segment = hostSegmentFor(booking, today).ordinal
        highlightedId = bookingId
        delay(320)
        val list = when (segment) { 0 -> requests; 1 -> upcoming; else -> past }
        val index = list.indexOfFirst { it.id == bookingId }
        if (index >= 0) listState.animateScrollToItem(index + 2)
        viewModel.consumePendingBookingFocus(bookingId)
    }

    fun messageGuest(booking: BookingDto) {
        val conversationId = booking.conversation_id
        if (!conversationId.isNullOrBlank()) {
            onOpenConversation(conversationId)
        } else if (!booking.renter_id.isNullOrBlank()) {
            viewModel.createConversation(
                hostId = currentUserId.ifBlank { booking.cars?.owner_id.orEmpty() }.takeIf { it.isNotBlank() },
                participantId = booking.renter_id,
                carId = booking.car_id,
            ) { created -> onOpenConversation(created) }
        } else {
            viewModel.showMessage("Guest conversation is not available for this booking.")
        }
    }

    Scaffold(containerColor = colors.pageBackground) { inner ->
        HayameRefreshBox(
            onRefresh = { viewModel.loadBookings() },
            modifier = Modifier.fillMaxSize(),
            indicatorTopPadding = inner.calculateTopPadding(),
        ) {
        LazyColumn(
                state = listState,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(inner)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                item(key = "bookings-header") {
                    Spacer(modifier = Modifier.height(16.dp))
                    StaggeredAppear(index = 0) { HostPageHeader(title = "Bookings", subtitle = subtitle) }
                }
                item(key = "bookings-segments") {
                    StaggeredAppear(index = 1, modifier = Modifier.coachTarget("hostBookings.segment")) {
                        HostSegmentedControl(
                            segments = listOf("Requests" to requests.size, "Upcoming" to upcoming.size, "Past" to past.size),
                            selected = segment,
                            onSelect = { segment = it },
                        )
                    }
                }
                when (val state = bookingsState) {
                    UiState.Loading, UiState.Idle -> items(3, key = { "bookings-skeleton-$it" }) { index ->
                        StaggeredAppear(index = index + 2) { HostRowSkeleton() }
                    }
                    is UiState.Error -> item(key = "bookings-error") {
                        StaggeredAppear(index = 2) { ErrorBlock(state.message, onRetry = { viewModel.loadBookings() }) }
                    }
                    UiState.Empty, is UiState.Success -> {
                        if (shown.isEmpty()) {
                            item(key = "bookings-empty-$segment") {
                                StaggeredAppear(index = 2) {
                                    when (segment) {
                                        0 -> HostEmptyState(Icons.Outlined.Inbox, "No requests right now", "New booking requests land here the moment a guest pays. You'll also get a notification.")
                                        1 -> HostEmptyState(Icons.Outlined.EventAvailable, "Nothing upcoming", "Approved trips that haven't started yet will show here.")
                                        else -> HostEmptyState(Icons.Outlined.Schedule, "No past trips yet", "Completed, cancelled and declined trips are kept here.")
                                    }
                                }
                            }
                        } else {
                            items(shown, key = { "booking-$segment-${it.id}" }) { booking ->
                                StaggeredAppear(index = shown.indexOf(booking) + 2) {
                                    if (segment == 0) {
                                        HostRequestCard(
                                            booking = booking,
                                            highlighted = highlightedId == booking.id,
                                            onApprove = { viewModel.approveBooking(booking.id) },
                                            onReject = { rejectTarget = booking },
                                            onMessage = { messageGuest(booking) },
                                        )
                                    } else {
                                        HostBookingRow(
                                            booking = booking,
                                            highlighted = highlightedId == booking.id,
                                            onMessage = { messageGuest(booking) },
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
                item(key = "bookings-footer") { Spacer(modifier = Modifier.height(24.dp)) }
            }
        }
    }

    rejectTarget?.let { booking ->
        HostRejectDialog(
            booking = booking,
            onDismiss = { rejectTarget = null },
            onConfirm = { reason ->
                viewModel.rejectBooking(booking.id, reason.ifBlank { "Rejected by host" })
                rejectTarget = null
            },
        )
    }
    @Suppress("UNUSED_EXPRESSION") onBack
}

@Composable
private fun HostRequestCard(
    booking: BookingDto,
    highlighted: Boolean,
    onApprove: () -> Unit,
    onReject: () -> Unit,
    onMessage: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val renter = booking.renter?.full_name?.trim().takeUnless { it.isNullOrBlank() } ?: "Guest"
    val carTitle = booking.cars?.title?.trim().takeUnless { it.isNullOrBlank() } ?: "Hayame listing"
    val nights = hostNights(booking.start_date, booking.end_date)
    val tripUse = booking.trip_use_address?.trim().takeUnless { it.isNullOrBlank() }
        ?: listOfNotNull(booking.trip_use_city, booking.trip_use_region).joinToString(", ").ifBlank { "Not provided" }
    val canAct = booking.status.equals("awaiting_host", ignoreCase = true) && booking.payment_status.equals("paid", ignoreCase = true)
    val displayStatus = resolveBookingDisplayStatus(booking.status, booking.start_date, booking.end_date)
    val helper = bookingHelperText(displayStatus, BookingDisplayRole.Host, booking.payment_status)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(colors.cardBackground)
            .border(if (highlighted) 2.dp else 1.dp, if (highlighted) colors.brandBlue else colors.border, RoundedCornerShape(22.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            HostInitialsAvatar(name = renter)
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(renter, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(helper, style = MaterialTheme.typography.bodySmall, color = colors.mutedText, maxLines = 2, overflow = TextOverflow.Ellipsis)
            }
            Surface(shape = CircleShape, color = colors.warning.copy(alpha = 0.14f)) {
                Row(modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp), horizontalArrangement = Arrangement.spacedBy(5.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.size(6.dp).background(colors.warning, CircleShape))
                    Text("Awaiting you", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = colors.warning)
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            HostThumbnail(imageUrl = hostBookingImage(booking), width = 84.dp, height = 66.dp, cornerRadius = 14.dp)
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(carTitle, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Row(horizontalArrangement = Arrangement.spacedBy(5.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.CalendarMonth, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(13.dp))
                    Text(
                        "${hostDateLabel(booking.start_date)} – ${hostDateLabel(booking.end_date)} • $nights night${if (nights == 1) "" else "s"}",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = colors.brandBlue,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(5.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.Place, contentDescription = null, tint = colors.mutedText, modifier = Modifier.size(13.dp))
                    Text(tripUse, style = MaterialTheme.typography.bodySmall, color = colors.mutedText, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
        }

        HorizontalDivider(color = colors.border)

        Row(verticalAlignment = Alignment.CenterVertically) {
            Column {
                Text("PAYOUT", style = MaterialTheme.typography.labelSmall, letterSpacing = 0.5.sp, color = colors.mutedText)
                Text(hostCurrency((booking.total_price ?: 0.0).roundToInt()), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
            }
            Spacer(modifier = Modifier.weight(1f))
            Surface(shape = CircleShape, color = if (booking.payment_status.equals("paid", true)) colors.success.copy(alpha = 0.14f) else colors.fieldBackground) {
                Row(modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp), horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        if (booking.payment_status.equals("paid", true)) Icons.Outlined.CheckCircle else Icons.Outlined.HourglassEmpty,
                        contentDescription = null,
                        tint = if (booking.payment_status.equals("paid", true)) colors.success else colors.mutedText,
                        modifier = Modifier.size(12.dp),
                    )
                    Text(
                        if (booking.payment_status.equals("paid", true)) "Paid" else booking.payment_status?.replace("_", " ")?.replaceFirstChar { it.uppercase() } ?: "Pending",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = if (booking.payment_status.equals("paid", true)) colors.success else colors.mutedText,
                    )
                }
            }
        }

        if (canAct) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                HostFlatButton(
                    text = "Reject",
                    modifier = Modifier.weight(1f),
                    container = colors.danger.copy(alpha = 0.12f),
                    content = colors.danger,
                    onClick = onReject,
                )
                HostFlatButton(text = "Approve", icon = Icons.Filled.Check, modifier = Modifier.weight(1.4f), onClick = onApprove)
            }
        }
        HostActionChip("Message guest", Icons.Outlined.ChatBubbleOutline, onMessage)
    }
}

@Composable
private fun HostBookingRow(
    booking: BookingDto,
    highlighted: Boolean,
    onMessage: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val renter = booking.renter?.full_name?.trim().takeUnless { it.isNullOrBlank() } ?: "Guest"
    val carTitle = booking.cars?.title?.trim().takeUnless { it.isNullOrBlank() } ?: "Hayame listing"
    val displayStatus = resolveBookingDisplayStatus(booking.status, booking.start_date, booking.end_date)
    val showPaid = shouldShowCompletedPaidBadge(displayStatus, booking.payment_status)
    val nights = hostNights(booking.start_date, booking.end_date)
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .then(if (highlighted) Modifier.border(2.dp, colors.brandBlue, RoundedCornerShape(18.dp)).padding(10.dp) else Modifier),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top) {
            HostThumbnail(imageUrl = hostBookingImage(booking), width = 96.dp, height = 74.dp, cornerRadius = 16.dp)
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                Text(carTitle, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Row(horizontalArrangement = Arrangement.spacedBy(5.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.Person, contentDescription = null, tint = colors.mutedText, modifier = Modifier.size(13.dp))
                    Text(renter, style = MaterialTheme.typography.bodySmall, color = colors.mutedText, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(5.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.CalendarMonth, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(13.dp))
                    Text(
                        "${hostDateLabel(booking.start_date)} – ${hostDateLabel(booking.end_date)} • $nights night${if (nights == 1) "" else "s"}",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = colors.brandBlue,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
        }
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            BookingStatusBadge(status = displayStatus)
            if (showPaid) BookingPaidBadge()
            Spacer(modifier = Modifier.weight(1f))
            Text(hostCurrency((booking.total_price ?: 0.0).roundToInt()), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
        }
        booking.rejection_reason?.trim()?.takeIf { it.isNotBlank() && displayStatus == BookingDisplayStatus.Rejected }?.let {
            Text("Reason: $it", style = MaterialTheme.typography.bodySmall, color = colors.danger)
        }
        HostActionChip("Message guest", Icons.Outlined.ChatBubbleOutline, onMessage)
        HorizontalDivider(color = colors.border)
    }
}

@Composable
private fun HostRejectDialog(booking: BookingDto, onDismiss: () -> Unit, onConfirm: (String) -> Unit) {
    val colors = LocalHayameColors.current
    var reason by rememberSaveable(booking.id) { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = colors.cardBackground,
        title = { Text("Decline this request?", color = colors.brandNavy, fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    "${booking.renter?.full_name ?: "The guest"} will be refunded in full. You can add a short reason they'll see.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = colors.mutedText,
                )
                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it.take(300) },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Reason (optional)") },
                    minLines = 2,
                    maxLines = 4,
                    shape = RoundedCornerShape(16.dp),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = colors.brandBlue, unfocusedBorderColor = colors.border),
                )
            }
        },
        confirmButton = {
            TextButton(onClick = { onConfirm(reason.trim()) }) { Text("Decline", color = colors.danger, fontWeight = FontWeight.Bold) }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Keep it", color = colors.brandBlue, fontWeight = FontWeight.Bold) }
        },
    )
}

// MARK: Earnings -----------------------------------------------------------------------------------

@Composable
fun HostEarningsScreen(viewModel: AppViewModel, onBack: () -> Unit) {
    CoachTour(
        id = "hostEarnings",
        steps = listOf(
            CoachStep("hostEarnings.month", "This month", "What you've earned so far this month."),
            CoachStep("hostEarnings.trend", "Six-month trend", "Amber bars are trips still awaiting approval."),
        ),
    )
    val bookingsState by viewModel.bookingsState.collectAsState()
    val me by viewModel.me.collectAsState()
    val currentUserId = me?.user?.id.orEmpty()
    val colors = LocalHayameColors.current

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
    val thisMonth = monthlySeries.lastOrNull()?.amount ?: 0
    val isLoading = bookingsState is UiState.Loading || bookingsState is UiState.Idle
    val subtitle = when {
        isLoading -> "Adding up your payouts..."
        earningBookings.isEmpty() -> "Payouts appear here once guests book your cars."
        else -> "${hostCurrency(totalEarned)} across ${earningBookings.size} booking${if (earningBookings.size == 1) "" else "s"}"
    }
    val paidMonths = monthlySeries.count { it.amount > 0 && !it.isPending }

    Scaffold(containerColor = colors.pageBackground) { inner ->
        HayameRefreshBox(
            onRefresh = { viewModel.loadBookings() },
            modifier = Modifier.fillMaxSize(),
            indicatorTopPadding = inner.calculateTopPadding(),
        ) {
        LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(inner)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                item(key = "earnings-header") {
                    Spacer(modifier = Modifier.height(16.dp))
                    StaggeredAppear(index = 0) { HostPageHeader(title = "Earnings", subtitle = subtitle) }
                }
                when (val state = bookingsState) {
                    UiState.Loading, UiState.Idle -> {
                        item(key = "earnings-skeleton-tiles") {
                            StaggeredAppear(index = 1) {
                                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    repeat(3) { HayameShimmerBlock(modifier = Modifier.weight(1f).height(96.dp), cornerRadius = 18.dp) }
                                }
                            }
                        }
                        item(key = "earnings-skeleton-chart") {
                            StaggeredAppear(index = 2) { HayameShimmerBlock(modifier = Modifier.fillMaxWidth().height(220.dp), cornerRadius = 22.dp) }
                        }
                        items(3, key = { "earnings-skeleton-row-$it" }) { index ->
                            StaggeredAppear(index = index + 3) {
                                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                    HayameShimmerBlock(modifier = Modifier.size(40.dp), cornerRadius = 12.dp)
                                    HayameShimmerBlock(modifier = Modifier.weight(1f).height(14.dp), cornerRadius = 6.dp)
                                    HayameShimmerBlock(modifier = Modifier.size(width = 70.dp, height = 14.dp), cornerRadius = 6.dp)
                                }
                            }
                        }
                    }
                    is UiState.Error -> item(key = "earnings-error") {
                        StaggeredAppear(index = 1) { ErrorBlock(state.message, onRetry = { viewModel.loadBookings() }) }
                    }
                    UiState.Empty, is UiState.Success -> {
                        item(key = "earnings-tiles") {
                            StaggeredAppear(index = 1) {
                                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    HostStatTileFlat("Total earned", totalEarned, Icons.Outlined.AccountBalanceWallet, colors.brandBlue, Modifier.weight(1f))
                                    HostStatTileFlat("This month", thisMonth, Icons.Outlined.TrendingUp, colors.success, Modifier.weight(1f).coachTarget("hostEarnings.month"))
                                    HostStatTileFlat("Pending", pendingPayout, Icons.Outlined.HourglassEmpty, colors.warning, Modifier.weight(1f))
                                }
                            }
                        }
                        item(key = "earnings-chart") {
                            StaggeredAppear(index = 2, modifier = Modifier.coachTarget("hostEarnings.trend")) { HostRevenueChart(series = monthlySeries) }
                        }
                        item(key = "earnings-summary") {
                            StaggeredAppear(index = 3) {
                                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    HostStatTileFlat("Completed trips", completedTrips, Icons.Outlined.CheckCircle, colors.brandNavy, Modifier.weight(1f)) { "$it" }
                                    HostStatTileFlat("Months paid", paidMonths, Icons.Outlined.ReceiptLong, colors.brandBlue, Modifier.weight(1f)) { "$it" }
                                }
                            }
                        }
                        item(key = "earnings-history-title") {
                            StaggeredAppear(index = 4) {
                                Text("Payout history", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy, modifier = Modifier.padding(top = 6.dp))
                            }
                        }
                        if (monthlySeries.all { it.amount == 0 }) {
                            item(key = "earnings-empty") {
                                StaggeredAppear(index = 5) {
                                    HostEmptyState(Icons.Outlined.ReceiptLong, "No payouts yet", "Confirmed and completed bookings turn into payouts here, month by month.")
                                }
                            }
                        } else {
                            items(monthlySeries.reversed(), key = { "payout-${it.month}" }) { bucket ->
                                StaggeredAppear(index = monthlySeries.reversed().indexOf(bucket) + 5) { HostPayoutRow(bucket) }
                            }
                        }
                    }
                }
                item(key = "earnings-footer") { Spacer(modifier = Modifier.height(24.dp)) }
            }
        }
    }
    @Suppress("UNUSED_EXPRESSION") onBack
}

@Composable
private fun HostRevenueChart(series: List<HostMonthlyBucket>) {
    val colors = LocalHayameColors.current
    val maxAmount = (series.maxOfOrNull { it.amount } ?: 0).coerceAtLeast(1)
    var revealed by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { revealed = true }
    val progress by animateFloatAsState(if (revealed) 1f else 0f, tween(800, easing = FastOutSlowInEasing), label = "chart-reveal")
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(22.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text("Revenue trend", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                Text("Last 6 months", style = MaterialTheme.typography.bodySmall, color = colors.mutedText)
            }
            series.lastOrNull()?.let { current ->
                Text(hostCurrency(current.amount), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandBlue)
            }
        }
        if (series.all { it.amount == 0 }) {
            Text("Nothing to chart yet. Your first confirmed booking will start the trend.", style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
        } else {
            Row(
                modifier = Modifier.fillMaxWidth().height(170.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.Bottom,
            ) {
                series.forEachIndexed { index, bucket ->
                    val isCurrent = index == series.lastIndex
                    val fraction = (bucket.amount.toFloat() / maxAmount.toFloat()).coerceIn(0.06f, 1f) * progress
                    Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height((140f * fraction).coerceAtLeast(8f).dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(
                                    when {
                                        bucket.amount == 0 -> colors.subtleFill
                                        isCurrent -> colors.brandBlue
                                        bucket.isPending -> colors.brandBlue.copy(alpha = 0.45f)
                                        else -> colors.brandBlue.copy(alpha = 0.75f)
                                    },
                                ),
                        )
                        Text(
                            bucket.month,
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.SemiBold,
                            color = if (isCurrent) colors.brandNavy else colors.mutedText,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun HostPayoutRow(bucket: HostMonthlyBucket) {
    val colors = LocalHayameColors.current
    val tint = when {
        bucket.amount == 0 -> colors.mutedText
        bucket.isPending -> colors.warning
        else -> colors.success
    }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(contentAlignment = Alignment.Center, modifier = Modifier.size(40.dp).background(tint.copy(alpha = 0.12f), RoundedCornerShape(12.dp))) {
                Icon(Icons.Outlined.ReceiptLong, contentDescription = null, tint = tint, modifier = Modifier.size(18.dp))
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(bucket.month, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                Text(
                    when {
                        bucket.amount == 0 -> "No bookings"
                        bucket.isPending -> "Includes requests awaiting your approval"
                        else -> "Paid out"
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.mutedText,
                )
            }
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(hostCurrency(bucket.amount), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = if (bucket.amount == 0) colors.mutedText else colors.brandNavy)
                Surface(shape = CircleShape, color = tint.copy(alpha = 0.14f)) {
                    Text(
                        when {
                            bucket.amount == 0 -> "Quiet"
                            bucket.isPending -> "Pending"
                            else -> "Paid"
                        },
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = tint,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                    )
                }
            }
        }
        HorizontalDivider(color = colors.border)
    }
}

package com.hayame.app.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Autorenew
import androidx.compose.material.icons.outlined.Block
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.DirectionsCar
import androidx.compose.material.icons.outlined.EventBusy
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.LockOpen
import androidx.compose.material.icons.outlined.PhotoLibrary
import androidx.compose.material.icons.outlined.Speed
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material.icons.outlined.Weekend
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.TextButton
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import com.hayame.app.ui.components.HayameShimmerBlock
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Locale
import com.hayame.app.ui.components.HayameRefreshBox
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.OpenInNew
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.hayame.app.core.network.CarDto
import com.hayame.app.core.network.CarPhotoItemDto
import com.hayame.app.ui.components.EmptyBlock
import com.hayame.app.ui.components.ErrorBlock
import com.hayame.app.ui.components.LoadingBlock
import com.hayame.app.ui.components.SectionHeader
import com.hayame.app.ui.state.UiState
import com.hayame.app.ui.theme.LocalHayameColors
import com.hayame.app.ui.viewmodel.AppViewModel
import java.io.File

@Composable
fun RenterDashboardScreen(
    viewModel: AppViewModel,
    onBack: () -> Unit,
    onOpenTrips: () -> Unit,
    onOpenSaved: () -> Unit,
    onOpenMessages: () -> Unit,
    onOpenBecomeHost: () -> Unit,
    onOpenHostDashboard: () -> Unit,
    onOpenHostVehicles: () -> Unit,
) {
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val bookingsState by viewModel.bookingsState.collectAsState()
    val favoritesState by viewModel.favoritesState.collectAsState()
    val conversationsState by viewModel.conversationsState.collectAsState()
    val me by viewModel.me.collectAsState()

    LaunchedEffect(isAuthenticated) {
        if (isAuthenticated) {
            viewModel.loadBookings()
            viewModel.loadFavorites()
            viewModel.loadConversations()
        }
    }

    val bookings = (bookingsState as? UiState.Success<List<com.hayame.app.core.network.BookingDto>>)?.data.orEmpty()
    val upcomingTrips = bookings.count { it.end_date.orEmpty() >= java.time.LocalDate.now().toString() }
    val pastTrips = (bookings.size - upcomingTrips).coerceAtLeast(0)
    val savedCount = (favoritesState as? UiState.Success<Set<String>>)?.data?.size ?: 0
    val unreadCount = (conversationsState as? UiState.Success<List<com.hayame.app.core.network.ConversationDto>>)
        ?.data
        ?.sumOf { it.unread_count ?: 0 }
        ?: 0

    val hostStatus = (me?.host_application_status ?: me?.host_status ?: "").lowercase()
    val isHost = me?.is_host == true || hostStatus == "approved"
    val colors = LocalHayameColors.current

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = {
            ParityTopBar(title = "Dashboard", onBack = onBack)
        },
    ) { inner ->
        HayameRefreshBox(
            onRefresh = { viewModel.loadBookings(); viewModel.loadFavorites(); viewModel.loadConversations() },
            modifier = Modifier.fillMaxSize(),
            indicatorTopPadding = inner.calculateTopPadding(),
        ) {
        LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(inner)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(vertical = 12.dp),
            ) {
                item {
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                        border = BorderStroke(1.dp, colors.border),
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text("Welcome back", style = androidx.compose.material3.MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold, color = colors.brandNavy)
                            Text("Manage bookings, favorites, chats, and hosting access.", color = colors.mutedText)
                        }
                    }
                }

                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                        HostStatCard("Upcoming trips", "$upcomingTrips", modifier = Modifier.weight(1f))
                        HostStatCard(
                            title = "Past trips",
                            value = "$pastTrips",
                            modifier = Modifier.weight(1f),
                            onClick = {
                                if (isHost) {
                                    onOpenHostVehicles()
                                } else {
                                    onOpenBecomeHost()
                                }
                            },
                        )
                    }
                }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                        HostStatCard("Saved cars", "$savedCount", modifier = Modifier.weight(1f))
                        HostStatCard("Unread chats", "$unreadCount", modifier = Modifier.weight(1f))
                    }
                }

                item { SectionHeader("Quick nav") }
                item { ParityNavRow("Bookings", "Review upcoming and past trips", onOpenTrips) }
                item { ParityNavRow("Chats", "Open conversations with hosts", onOpenMessages) }
                item { ParityNavRow("Favorites", "See the cars you saved", onOpenSaved) }

                if (isHost) {
                    item {
                        Card(
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                            border = BorderStroke(1.dp, colors.border),
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("Host mode is active.", color = colors.brandNavy, fontWeight = FontWeight.Bold)
                                Text("Open host dashboard to manage listings, bookings, earnings, and reviews.", color = colors.mutedText)
                                OutlinedButton(onClick = onOpenHostDashboard) { Text("Open host dashboard") }
                            }
                        }
                    }
                } else {
                    item {
                        Card(
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
                            border = BorderStroke(1.dp, colors.border),
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("Become a host", color = colors.brandNavy, fontWeight = FontWeight.Bold)
                                Text("Apply to list your cars. Review usually takes 1-2 business days.", color = colors.mutedText)
                                OutlinedButton(onClick = onOpenBecomeHost) { Text("Host application") }
                            }
                        }
                    }
                }

                if (!isAuthenticated) {
                    item {
                        EmptyBlock(
                            title = "Guest mode",
                            subtitle = "Log in to see your real bookings, favorites, and message history.",
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ParityNavRow(title: String, subtitle: String, onClick: () -> Unit) {
    val colors = LocalHayameColors.current

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
        border = BorderStroke(1.dp, colors.border),
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Icon(Icons.Outlined.Info, contentDescription = null, tint = LocalHayameColors.current.brandBlue)
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(title, color = colors.brandNavy, fontWeight = FontWeight.Bold)
                Text(subtitle, color = colors.mutedText, style = androidx.compose.material3.MaterialTheme.typography.bodySmall)
            }
            Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = colors.mutedText)
        }
    }
}

@Composable
fun ContactScreen(onBack: () -> Unit) {
    Scaffold(
        containerColor = LocalHayameColors.current.pageBackground,
        topBar = { ParityTopBar(title = "Contact", onBack = onBack) },
    ) { inner ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(inner)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(vertical = 12.dp),
        ) {
            item {
                Card(shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = LocalHayameColors.current.cardBackground)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("We are here to help with bookings, hosting and trip issues.", color = LocalHayameColors.current.mutedText)
                        Text("+233 (0) 55 555 5555", color = LocalHayameColors.current.brandNavy, fontWeight = FontWeight.Bold)
                        Text("support@hayame.com", color = LocalHayameColors.current.brandBlue, fontWeight = FontWeight.Bold)
                        Text("Accra Digital Centre, Ring Road West", color = LocalHayameColors.current.brandNavy)
                    }
                }
            }
        }
    }
}

@Composable
fun PrivacyScreen(onBack: () -> Unit) {
    Scaffold(
        containerColor = LocalHayameColors.current.pageBackground,
        topBar = { ParityTopBar(title = "Privacy", onBack = onBack) },
    ) { inner ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(inner)
                .padding(16.dp),
        ) {
            Card(shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = LocalHayameColors.current.cardBackground)) {
                Text(
                    text = "We store only the information required to operate bookings, payments, messages and listings. For account/data requests, contact support@hayame.com.",
                    modifier = Modifier.padding(16.dp),
                    color = LocalHayameColors.current.mutedText,
                )
            }
        }
    }
}

@Composable
fun ProtectionScreen(onBack: () -> Unit) {
    val sections = remember {
        listOf(
            "Damage and incident reporting" to "Hayame does not advertise bundled insurance on the platform today. Hosts should only list cars they are authorized to rent out and insure, and guests should report any new damage or trip issue promptly in Messages or Support.",
            "Trip records and support review" to "Trip dates, pricing, messages, uploaded photos, and booking status are retained in the trip record so support can review cancellations, disputes, and post-trip issues consistently.",
            "Host and guest accountability" to "Identity, phone, and email verification states are shown where available. When a policy breach or misuse report is raised, Hayame may review listing details, trip history, and conversation records before taking action.",
            "Deposits and extra fees" to "If a listing includes a security deposit or trip fee, the amount is shown before checkout and recorded on the booking. Any deduction should be backed by trip evidence or an open dispute.",
            "Disputes and emergency support" to "For accidents or immediate safety issues, contact local emergency services first. Then notify the other party and reach Hayame via Messages, the dispute flow, or support@hayame.com.",
        )
    }

    Scaffold(
        containerColor = LocalHayameColors.current.pageBackground,
        topBar = { ParityTopBar(title = "Protection", onBack = onBack) },
    ) { inner ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(inner)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(vertical = 12.dp),
        ) {
            item {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        "This page describes the support, evidence, and dispute process currently available on Hayame.",
                        color = LocalHayameColors.current.mutedText,
                        style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
                    )
                    Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = LocalHayameColors.current.cardBackground)) {
                        Text(
                            text = "Hayame does not publish bundled insurance coverage on this page. Any third-party cover must be confirmed directly with the vehicle owner.",
                            modifier = Modifier.padding(14.dp),
                            color = LocalHayameColors.current.mutedText,
                        )
                    }
                }
            }
            items(sections) { section ->
                Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = LocalHayameColors.current.cardBackground)) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(section.first, color = LocalHayameColors.current.brandNavy, fontWeight = FontWeight.Bold)
                        Text(section.second, color = LocalHayameColors.current.mutedText)
                    }
                }
            }
        }
    }
}

@Composable
fun CancellationPolicyScreen(onBack: () -> Unit) {
    val policies = remember {
        listOf(
            "Flexible" to "Best for last-minute changes and quick rebooking.",
            "Moderate" to "Balanced terms for guests and hosts. Default on new listings.",
            "Strict" to "For high-demand inventory with higher late-cancel risk.",
        )
    }

    Scaffold(
        containerColor = LocalHayameColors.current.pageBackground,
        topBar = { ParityTopBar(title = "Cancellation", onBack = onBack) },
    ) { inner ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(inner)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(vertical = 12.dp),
        ) {
            items(policies) { policy ->
                Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = LocalHayameColors.current.cardBackground)) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(policy.first, color = LocalHayameColors.current.brandNavy, fontWeight = FontWeight.Bold)
                        Text(policy.second, color = LocalHayameColors.current.mutedText)
                    }
                }
            }
        }
    }
}

@Composable
fun MarketingPagesScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val pages = remember {
        listOf(
            "Airport Car Rental Accra" to "https://www.hayamegh.com/airport-car-rental-accra",
            "Cheap Car Rental Ghana" to "https://www.hayamegh.com/cheap-car-rental-ghana",
            "List Your Car Ghana" to "https://www.hayamegh.com/list-your-car-ghana",
            "Peer-to-Peer Car Rental Ghana" to "https://www.hayamegh.com/peer-to-peer-car-rental-ghana",
            "Rent a Car Accra" to "https://www.hayamegh.com/rent-a-car-accra",
            "SUV Rental Ghana" to "https://www.hayamegh.com/suv-rental-ghana",
            "Prices" to "https://www.hayamegh.com/prices",
            "Blog" to "https://www.hayamegh.com/blog",
        )
    }

    Scaffold(
        containerColor = LocalHayameColors.current.pageBackground,
        topBar = { ParityTopBar(title = "Marketing", onBack = onBack) },
    ) { inner ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(inner)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            contentPadding = PaddingValues(vertical = 12.dp),
        ) {
            item {
                Text(
                    "SEO landing pages are served as web content and opened in-app.",
                    color = LocalHayameColors.current.mutedText,
                    style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                )
            }
            items(pages) { page ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { openExternalUrlCompat(context, page.second) },
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = LocalHayameColors.current.cardBackground),
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Text(page.first, color = LocalHayameColors.current.brandNavy, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                        Icon(Icons.Outlined.OpenInNew, contentDescription = null, tint = LocalHayameColors.current.brandBlue)
                    }
                }
            }
        }
    }
}

@Composable
fun HostApplicationPendingScreen(viewModel: AppViewModel, onBack: () -> Unit, onOpenBecomeHost: () -> Unit) {
    val me by viewModel.me.collectAsState()
    val status = (me?.host_application_status ?: me?.host_status ?: me?.host_application?.status ?: "").lowercase()

    Scaffold(
        containerColor = LocalHayameColors.current.pageBackground,
        topBar = { ParityTopBar(title = "Host Review", onBack = onBack) },
    ) { inner ->
        HayameRefreshBox(
            onRefresh = { viewModel.loadHostStatus() },
            modifier = Modifier.fillMaxSize(),
            indicatorTopPadding = inner.calculateTopPadding(),
        ) {
        LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(inner)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(vertical = 12.dp),
            ) {
                item {
                    EmptyBlock(
                        title = "Host Application Pending",
                        subtitle = "Your host application is still under review. Continue browsing as a renter while we process it.",
                    )
                }

                item {
                    Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = LocalHayameColors.current.cardBackground)) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text("Status", color = LocalHayameColors.current.mutedText)
                            Text(status.ifBlank { "pending" }.replace("_", " ").uppercase(), color = LocalHayameColors.current.brandNavy, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                        OutlinedButton(onClick = { viewModel.loadHostStatus() }, modifier = Modifier.weight(1f)) {
                            Icon(Icons.Outlined.Refresh, contentDescription = null)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Refresh")
                        }
                        Button(onClick = onOpenBecomeHost, modifier = Modifier.weight(1f)) {
                            Text("View application")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun HostFavoritesScreen(viewModel: AppViewModel, onBack: () -> Unit) {
    val myCarsState by viewModel.myCarsState.collectAsState()

    LaunchedEffect(Unit) { viewModel.loadMyCars() }

    val cars = ((myCarsState as? UiState.Success<List<CarDto>>)?.data ?: emptyList())
        .sortedByDescending { it.favorites_count ?: 0.0 }

    Scaffold(
        containerColor = LocalHayameColors.current.pageBackground,
        topBar = { ParityTopBar(title = "Favorites", onBack = onBack) },
    ) { inner ->
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
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(vertical = 12.dp),
            ) {
                when (val state = myCarsState) {
                    UiState.Loading -> item { LoadingBlock("Loading listings...") }
                    is UiState.Error -> item { ErrorBlock(state.message, onRetry = { viewModel.loadMyCars() }) }
                    UiState.Empty -> item { EmptyBlock("No host listings", "Create listings to track favorite performance.") }
                    is UiState.Success -> {
                        if (cars.isEmpty()) {
                            item { EmptyBlock("No host listings", "Create listings to track favorite performance.") }
                        } else {
                            items(cars, key = { it.id }) { car ->
                                Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = LocalHayameColors.current.cardBackground)) {
                                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Text(car.title.orEmpty().ifBlank { listOfNotNull(car.brand, car.model).joinToString(" ") }, color = LocalHayameColors.current.brandNavy, fontWeight = FontWeight.Bold)
                                        Text(listOfNotNull(car.city, car.region).joinToString(", "), color = LocalHayameColors.current.mutedText)
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text("GH₵${(car.daily_price ?: 0.0).toInt()} / day", color = LocalHayameColors.current.brandBlue, fontWeight = FontWeight.Bold)
                                            Spacer(modifier = Modifier.weight(1f))
                                            Surface(
                                                shape = RoundedCornerShape(999.dp),
                                                color = LocalHayameColors.current.fieldBackground,
                                            ) {
                                                Text(
                                                    "${(car.favorites_count ?: 0.0).toInt()} saves",
                                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                                    color = LocalHayameColors.current.brandNavy,
                                                    fontWeight = FontWeight.SemiBold,
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    UiState.Idle -> item { LoadingBlock("Loading listings...") }
                }
            }
        }
    }
}

@Composable
fun HostListingPhotosScreen(viewModel: AppViewModel, carId: String, onBack: () -> Unit) {
    val photosState by viewModel.carPhotosState.collectAsState()
    val photosLimit by viewModel.carPhotosLimit.collectAsState()
    val myCarsState by viewModel.myCarsState.collectAsState()
    val context = LocalContext.current
    val colors = LocalHayameColors.current

    var replacePhotoId by remember { mutableStateOf<String?>(null) }
    var deleteTarget by remember { mutableStateOf<CarPhotoItemDto?>(null) }
    // The last loaded list stays on screen while the server reloads after an
    // upload or delete, so the grid never flashes back to a skeleton.
    var photos by remember { mutableStateOf<List<CarPhotoItemDto>>(emptyList()) }

    LaunchedEffect(photosState) {
        when (val state = photosState) {
            is UiState.Success -> photos = state.data
            UiState.Empty -> photos = emptyList()
            else -> Unit
        }
    }

    val carTitle = remember(myCarsState, carId) {
        (myCarsState as? UiState.Success<List<CarDto>>)?.data
            ?.firstOrNull { it.id == carId }
            ?.let(::parityListingTitle)
            ?: "Listing"
    }
    val isLoading = photos.isEmpty() && (photosState is UiState.Loading || photosState is UiState.Idle)
    val isBusy = photosState is UiState.Loading && photos.isNotEmpty()
    val remainingSlots = (photosLimit - photos.size).coerceAtLeast(0)

    val pickImage = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        val pickedUri = uri ?: return@rememberLauncherForActivityResult
        val file = copyUriToTempFileCompat(context, pickedUri, "car-photo") ?: return@rememberLauncherForActivityResult
        viewModel.uploadCarPhoto(carId = carId, file = file, replacePhotoId = replacePhotoId)
        replacePhotoId = null
    }
    val pickImages = rememberLauncherForActivityResult(ActivityResultContracts.GetMultipleContents()) { uris ->
        uris.take(remainingSlots).forEach { uri ->
            val file = copyUriToTempFileCompat(context, uri, "car-photo") ?: return@forEach
            viewModel.uploadCarPhoto(carId = carId, file = file, replacePhotoId = null)
        }
    }

    LaunchedEffect(carId) {
        viewModel.loadCarPhotos(carId)
    }

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = {
            HostToolHeader(
                title = "Photos",
                subtitle = if (isLoading) "Loading photos..." else "$carTitle · ${photos.size} of $photosLimit",
                isBusy = isBusy,
                busyText = "Updating",
                onBack = onBack,
            )
        },
    ) { inner ->
        HayameRefreshBox(
            onRefresh = { viewModel.loadCarPhotos(carId) },
            modifier = Modifier.fillMaxSize(),
            indicatorTopPadding = inner.calculateTopPadding(),
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(inner)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(top = 8.dp, bottom = 32.dp),
            ) {
                item(key = "photos-grid") {
                    StaggeredAppear(index = 0) {
                        val state = photosState
                        when {
                            isLoading -> HostPhotoSkeletonGrid()
                            state is UiState.Error -> ErrorBlock(state.message, onRetry = { viewModel.loadCarPhotos(carId) })
                            photos.isEmpty() -> HostToolEmptyState(
                                icon = Icons.Outlined.PhotoLibrary,
                                title = "No photos yet",
                                message = "Listings with five or more clear photos get approved faster and booked more often.",
                            )
                            else -> HostPhotoGrid(
                                photos = photos,
                                enabled = !isBusy,
                                onReplace = { photo ->
                                    replacePhotoId = photo.id
                                    pickImage.launch("image/*")
                                },
                                onDelete = { photo -> deleteTarget = photo },
                            )
                        }
                    }
                }
                item(key = "photos-add") {
                    StaggeredAppear(index = 1) {
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            HostToolPrimaryButton(
                                text = if (remainingSlots == 0) "Photo limit reached" else "Add photos",
                                icon = Icons.Outlined.Add,
                                trailingIcon = Icons.Outlined.PhotoLibrary,
                                enabled = remainingSlots > 0 && !isBusy,
                                onClick = {
                                    replacePhotoId = null
                                    pickImages.launch("image/*")
                                },
                            )
                            Text(
                                "Up to $photosLimit photos, 4MB each. The first photo is the cover.",
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.mutedText,
                            )
                        }
                    }
                }
                item(key = "photos-tips") {
                    StaggeredAppear(index = 2) {
                        HostToolCard {
                            Text("Photos that get booked", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                            Spacer(modifier = Modifier.height(12.dp))
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                HostTipLine(Icons.Outlined.DirectionsCar, "A front three-quarter view in daylight as the cover.")
                                HostTipLine(Icons.Outlined.Weekend, "A clean interior: front seats, back seats and boot.")
                                HostTipLine(Icons.Outlined.Speed, "The dashboard with the mileage showing.")
                                HostTipLine(Icons.Outlined.VisibilityOff, "Keep number plates and people out of frame.")
                            }
                        }
                    }
                }
            }
        }
    }

    deleteTarget?.let { photo ->
        AlertDialog(
            onDismissRequest = { deleteTarget = null },
            containerColor = colors.cardBackground,
            title = { Text("Delete this photo?", color = colors.brandNavy, fontWeight = FontWeight.Bold) },
            text = { Text("Guests will no longer see it on the listing.", color = colors.mutedText) },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.deleteCarPhoto(carId = carId, photoId = photo.id)
                    deleteTarget = null
                }) {
                    Text("Delete", color = colors.danger, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { deleteTarget = null }) {
                    Text("Keep it", color = colors.brandBlue, fontWeight = FontWeight.Bold)
                }
            },
        )
    }
}

@Composable
private fun HostPhotoGrid(
    photos: List<CarPhotoItemDto>,
    enabled: Boolean,
    onReplace: (CarPhotoItemDto) -> Unit,
    onDelete: (CarPhotoItemDto) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        photos.chunked(2).forEachIndexed { rowIndex, row ->
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                row.forEachIndexed { columnIndex, photo ->
                    HostPhotoTile(
                        photo = photo,
                        isCover = rowIndex == 0 && columnIndex == 0,
                        enabled = enabled,
                        onReplace = { onReplace(photo) },
                        onDelete = { onDelete(photo) },
                        modifier = Modifier.weight(1f),
                    )
                }
                if (row.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun HostPhotoSkeletonGrid() {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        repeat(2) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                repeat(2) {
                    HayameShimmerBlock(modifier = Modifier.weight(1f).aspectRatio(4f / 3f), cornerRadius = 18.dp)
                }
            }
        }
    }
}

/** One listing photo: cover pill, replace and delete discs over the picture. */
@Composable
private fun HostPhotoTile(
    photo: CarPhotoItemDto,
    isCover: Boolean,
    enabled: Boolean,
    onReplace: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = LocalHayameColors.current
    Box(
        modifier = modifier
            .aspectRatio(4f / 3f)
            .clip(RoundedCornerShape(18.dp))
            .background(colors.brandLight)
            .border(1.dp, colors.border, RoundedCornerShape(18.dp)),
    ) {
        val resolved = resolveParityImage(photo.url)
        if (!resolved.isNullOrBlank()) {
            AsyncImage(
                model = resolved,
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop,
            )
        } else {
            Icon(
                Icons.Outlined.DirectionsCar,
                contentDescription = null,
                tint = colors.brandBlue,
                modifier = Modifier.align(Alignment.Center).size(28.dp),
            )
        }
        if (isCover) {
            Surface(shape = CircleShape, color = colors.brandBlue, modifier = Modifier.align(Alignment.TopStart).padding(8.dp)) {
                Text(
                    "Cover",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                )
            }
        }
        Row(
            modifier = Modifier.align(Alignment.BottomEnd).padding(8.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            HostPhotoDisc(icon = Icons.Outlined.Autorenew, contentDescription = "Replace photo", enabled = enabled, onClick = onReplace)
            HostPhotoDisc(icon = Icons.Outlined.DeleteOutline, contentDescription = "Delete photo", enabled = enabled, onClick = onDelete, tint = colors.danger)
        }
    }
}

@Composable
private fun HostPhotoDisc(
    icon: ImageVector,
    contentDescription: String,
    enabled: Boolean,
    onClick: () -> Unit,
    tint: Color = Color.White,
) {
    Surface(
        onClick = onClick,
        enabled = enabled,
        shape = CircleShape,
        color = Color.Black.copy(alpha = 0.5f),
        modifier = Modifier.size(30.dp),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(icon, contentDescription = contentDescription, tint = tint, modifier = Modifier.size(15.dp))
        }
    }
}

@Composable
fun HostAvailabilityEditorScreen(viewModel: AppViewModel, carId: String, onBack: () -> Unit) {
    val colors = LocalHayameColors.current
    val myCarsState by viewModel.myCarsState.collectAsState()
    val carTitle = remember(myCarsState, carId) {
        (myCarsState as? UiState.Success<List<CarDto>>)?.data
            ?.firstOrNull { it.id == carId }
            ?.let(::parityListingTitle)
            ?: "Listing"
    }

    val today = remember { LocalDate.now() }
    val maxMonths = 6
    val recurringHorizonDays = 90
    val weekdays = remember {
        listOf("mon" to "Mon", "tue" to "Tue", "wed" to "Wed", "thu" to "Thu", "fri" to "Fri", "sat" to "Sat", "sun" to "Sun")
    }
    val dayFormatter = remember { DateTimeFormatter.ofPattern("EEE d MMM", Locale.US) }

    // Days guests cannot book: manual blocks plus confirmed trips.
    var unavailableDays by remember { mutableStateOf<Set<LocalDate>>(emptySet()) }
    var isLoadingCalendar by remember { mutableStateOf(false) }
    var loadError by remember { mutableStateOf<String?>(null) }
    var rangeStart by remember { mutableStateOf<LocalDate?>(null) }
    var rangeEnd by remember { mutableStateOf<LocalDate?>(null) }
    var markAvailable by rememberSaveable { mutableStateOf(false) }
    var repeatDays by remember { mutableStateOf(setOf<String>()) }
    var isSaving by remember { mutableStateOf(false) }
    var visibleMonths by rememberSaveable { mutableIntStateOf(2) }

    fun loadCalendar() {
        if (isLoadingCalendar) return
        isLoadingCalendar = true
        loadError = null
        viewModel.loadAvailabilitySnapshot(
            carId = carId,
            startDate = today.toString(),
            endDate = today.plusDays((maxMonths * 31).toLong()).toString(),
        ) { envelope, error ->
            isLoadingCalendar = false
            if (error != null) {
                loadError = error
                return@loadAvailabilitySnapshot
            }
            unavailableDays = envelope?.blockedDates.orEmpty()
                .mapNotNull { raw -> runCatching { LocalDate.parse(raw.take(10)) }.getOrNull() }
                .toSet()
        }
    }

    fun selectDay(day: LocalDate) {
        if (day.isBefore(today)) return
        val start = rangeStart
        if (start != null && rangeEnd == null) {
            if (day.isBefore(start)) rangeStart = day else rangeEnd = day
        } else {
            rangeStart = day
            rangeEnd = null
        }
    }

    fun saveRange() {
        val start = rangeStart ?: return
        if (isSaving) return
        val end = rangeEnd ?: start
        isSaving = true
        viewModel.saveAvailabilityWindow(
            carId = carId,
            startDate = start.toString(),
            // The server treats the end date as exclusive, so the last tapped
            // day is pushed one day out to include it.
            endDate = end.plusDays(1).toString(),
            available = markAvailable,
        ) { saved ->
            isSaving = false
            if (saved) {
                rangeStart = null
                rangeEnd = null
                loadCalendar()
            }
        }
    }

    fun saveRecurring() {
        if (isSaving || repeatDays.isEmpty()) return
        isSaving = true
        viewModel.saveAvailabilityRecurring(
            carId = carId,
            startDate = today.toString(),
            endDate = today.plusDays(recurringHorizonDays.toLong()).toString(),
            repeatDays = repeatDays.toList(),
        ) { saved ->
            isSaving = false
            if (saved) loadCalendar()
        }
    }

    LaunchedEffect(carId) { loadCalendar() }

    val start = rangeStart
    val end = rangeEnd
    val selectedDayCount = if (start == null) 0 else ChronoUnit.DAYS.between(start, end ?: start).toInt() + 1
    val unavailableSoon = unavailableDays.count { !it.isBefore(today) && it.isBefore(today.plusDays(90)) }
    val selectionLabel = when {
        start == null -> "Tap a day on the calendar to start"
        end == null -> "${start.format(dayFormatter)} · now tap the last day"
        start == end -> "${start.format(dayFormatter)} · 1 day"
        else -> "${start.format(dayFormatter)} to ${end.format(dayFormatter)} · $selectedDayCount days"
    }

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = {
            HostToolHeader(
                title = "Availability",
                subtitle = if (isLoadingCalendar && unavailableDays.isEmpty()) "Loading calendar..." else carTitle,
                isBusy = isSaving,
                onBack = onBack,
            )
        },
    ) { inner ->
        HayameRefreshBox(
            onRefresh = { loadCalendar() },
            modifier = Modifier.fillMaxSize(),
            indicatorTopPadding = inner.calculateTopPadding(),
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(inner)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(top = 8.dp, bottom = 32.dp),
            ) {
                item(key = "availability-stats") {
                    StaggeredAppear(index = 0) {
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            HostToolStat(
                                value = "$unavailableSoon",
                                label = if (unavailableSoon == 1) "day unavailable" else "days unavailable",
                                hint = "Next 90 days, incl. trips",
                                tint = colors.warning,
                                modifier = Modifier.weight(1f),
                            )
                            HostToolStat(
                                value = "${(90 - unavailableSoon).coerceAtLeast(0)}",
                                label = "days open",
                                hint = "Next 90 days",
                                tint = colors.success,
                                modifier = Modifier.weight(1f),
                            )
                        }
                    }
                }
                item(key = "availability-calendar") {
                    StaggeredAppear(index = 1) {
                        HostToolCard {
                            Text("Block or open dates", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Tap the first and last day. Booked or blocked days are shaded.", style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
                            Spacer(modifier = Modifier.height(16.dp))

                            val error = loadError
                            when {
                                isLoadingCalendar && unavailableDays.isEmpty() -> {
                                    HayameShimmerBlock(modifier = Modifier.size(width = 140.dp, height = 16.dp), cornerRadius = 6.dp)
                                    Spacer(modifier = Modifier.height(10.dp))
                                    HayameShimmerBlock(modifier = Modifier.fillMaxWidth().height(220.dp), cornerRadius = 16.dp)
                                }
                                error != null && unavailableDays.isEmpty() -> ErrorBlock(error, onRetry = { loadCalendar() })
                                else -> {
                                    repeat(visibleMonths) { offset ->
                                        HostCalendarMonthView(
                                            month = YearMonth.from(today).plusMonths(offset.toLong()),
                                            today = today,
                                            unavailableDays = unavailableDays,
                                            rangeStart = rangeStart,
                                            rangeEnd = rangeEnd,
                                            onSelect = { selectDay(it) },
                                        )
                                        Spacer(modifier = Modifier.height(14.dp))
                                    }
                                    if (visibleMonths < maxMonths) {
                                        HostToolChip(text = "Show more months", icon = Icons.Outlined.ExpandMore) {
                                            visibleMonths = minOf(maxMonths, visibleMonths + 2)
                                        }
                                    }
                                }
                            }

                            HorizontalDivider(color = colors.border, modifier = Modifier.padding(vertical = 14.dp))

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    selectionLabel,
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = if (start == null) colors.mutedText else colors.brandNavy,
                                    modifier = Modifier.weight(1f),
                                )
                                if (start != null) {
                                    Text(
                                        "Clear",
                                        style = MaterialTheme.typography.labelLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = colors.brandBlue,
                                        modifier = Modifier.clickable {
                                            rangeStart = null
                                            rangeEnd = null
                                        },
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                HostModeChip(text = "Block", icon = Icons.Outlined.Block, selected = !markAvailable, modifier = Modifier.weight(1f)) { markAvailable = false }
                                HostModeChip(text = "Open up", icon = Icons.Outlined.CheckCircle, selected = markAvailable, modifier = Modifier.weight(1f)) { markAvailable = true }
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                            HostToolPrimaryButton(
                                text = if (markAvailable) "Open these days" else "Block these days",
                                icon = if (markAvailable) Icons.Outlined.LockOpen else Icons.Outlined.Lock,
                                enabled = start != null && !isSaving,
                                loading = isSaving,
                                onClick = { saveRange() },
                            )
                        }
                    }
                }
                item(key = "availability-weekly") {
                    StaggeredAppear(index = 2) {
                        HostToolCard {
                            Text("Weekly days off", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                "Blocks the chosen weekdays for the next $recurringHorizonDays days, for example every Sunday.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = colors.mutedText,
                            )
                            Spacer(modifier = Modifier.height(14.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                weekdays.forEach { (key, label) ->
                                    val selected = key in repeatDays
                                    Surface(
                                        onClick = { repeatDays = if (selected) repeatDays - key else repeatDays + key },
                                        shape = RoundedCornerShape(12.dp),
                                        color = if (selected) colors.brandBlue else colors.fieldBackground,
                                        modifier = Modifier.weight(1f).height(38.dp),
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Text(
                                                label,
                                                style = MaterialTheme.typography.labelMedium,
                                                fontWeight = FontWeight.Bold,
                                                color = if (selected) Color.White else colors.brandNavy,
                                            )
                                        }
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(14.dp))
                            HostToolSecondaryButton(
                                text = "Save weekly days off",
                                icon = Icons.Outlined.EventBusy,
                                enabled = repeatDays.isNotEmpty() && !isSaving,
                                onClick = { saveRecurring() },
                            )
                        }
                    }
                }
            }
        }
    }
}

/** One month of the host calendar: unavailable days shaded amber, the picked range blue, today ringed. */
@Composable
private fun HostCalendarMonthView(
    month: YearMonth,
    today: LocalDate,
    unavailableDays: Set<LocalDate>,
    rangeStart: LocalDate?,
    rangeEnd: LocalDate?,
    onSelect: (LocalDate) -> Unit,
) {
    val colors = LocalHayameColors.current
    val title = remember(month) { month.format(DateTimeFormatter.ofPattern("MMMM yyyy", Locale.US)) }
    val cells: List<LocalDate?> = remember(month) {
        val leading = month.atDay(1).dayOfWeek.value % 7 // Sunday-first grid
        List(leading) { null } + (1..month.lengthOfMonth()).map { month.atDay(it) }
    }
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, color = colors.brandNavy)
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            listOf("Su", "Mo", "Tu", "We", "Th", "Fr", "Sa").forEach { label ->
                Text(
                    label,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = colors.mutedText,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.weight(1f),
                )
            }
        }
        cells.chunked(7).forEach { week ->
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                week.forEach { day ->
                    if (day == null) {
                        Spacer(modifier = Modifier.weight(1f).height(40.dp))
                    } else {
                        HostCalendarDay(
                            day = day,
                            today = today,
                            isUnavailable = day in unavailableDays,
                            rangeStart = rangeStart,
                            rangeEnd = rangeEnd,
                            onSelect = onSelect,
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
                repeat(7 - week.size) {
                    Spacer(modifier = Modifier.weight(1f).height(40.dp))
                }
            }
        }
    }
}

@Composable
private fun HostCalendarDay(
    day: LocalDate,
    today: LocalDate,
    isUnavailable: Boolean,
    rangeStart: LocalDate?,
    rangeEnd: LocalDate?,
    onSelect: (LocalDate) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = LocalHayameColors.current
    val isPast = day.isBefore(today)
    val isToday = day == today
    val isEndpoint = day == rangeStart || day == rangeEnd
    val inRange = rangeStart != null && !day.isBefore(rangeStart) && !day.isAfter(rangeEnd ?: rangeStart)
    val background = when {
        isEndpoint -> colors.brandBlue
        inRange -> colors.brandBlue.copy(alpha = 0.14f)
        isUnavailable && !isPast -> colors.warning.copy(alpha = 0.14f)
        else -> Color.Transparent
    }
    val textColor = when {
        isEndpoint -> Color.White
        isPast -> colors.mutedText.copy(alpha = 0.45f)
        isUnavailable -> colors.warning
        else -> colors.brandNavy
    }
    Box(
        modifier = modifier
            .height(40.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(background)
            .then(if (isToday && !isEndpoint) Modifier.border(1.5.dp, colors.brandBlue, RoundedCornerShape(12.dp)) else Modifier)
            .clickable(enabled = !isPast) { onSelect(day) },
        contentAlignment = Alignment.Center,
    ) {
        Text(
            "${day.dayOfMonth}",
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = if (isToday || isEndpoint) FontWeight.Bold else FontWeight.SemiBold,
            color = textColor,
        )
    }
}

// MARK: Host tool pieces ----------------------------------------------------------------------
//
// Shared by the photos and availability screens so they read like the rest of
// the host area: flat buttons, 16dp corners, a custom header instead of the
// Material app bar.

@Composable
private fun HostToolHeader(
    title: String,
    subtitle: String,
    isBusy: Boolean = false,
    busyText: String = "Saving",
    onBack: () -> Unit,
) {
    val colors = LocalHayameColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(colors.pageBackground)
            .statusBarsPadding()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Surface(onClick = onBack, shape = CircleShape, color = colors.fieldBackground, modifier = Modifier.size(40.dp)) {
            Box(contentAlignment = Alignment.Center) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = colors.brandNavy, modifier = Modifier.size(18.dp))
            }
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(title, fontSize = 24.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy)
            Text(
                subtitle,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = colors.mutedText,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
        AnimatedVisibility(visible = isBusy, enter = fadeIn(), exit = fadeOut()) {
            Surface(shape = CircleShape, color = colors.brandBlue.copy(alpha = 0.12f)) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    CircularProgressIndicator(modifier = Modifier.size(12.dp), strokeWidth = 2.dp, color = colors.brandBlue)
                    Text(busyText, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = colors.brandBlue)
                }
            }
        }
    }
}

@Composable
private fun HostToolCard(content: @Composable ColumnScope.() -> Unit) {
    val colors = LocalHayameColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(22.dp))
            .padding(18.dp),
        content = content,
    )
}

@Composable
private fun HostToolPrimaryButton(
    text: String,
    icon: ImageVector? = null,
    trailingIcon: ImageVector? = null,
    enabled: Boolean = true,
    loading: Boolean = false,
    onClick: () -> Unit,
) {
    val colors = LocalHayameColors.current
    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        modifier = Modifier.fillMaxWidth().height(50.dp),
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = colors.brandBlue,
            contentColor = Color.White,
            disabledContainerColor = colors.brandBlue.copy(alpha = 0.55f),
            disabledContentColor = Color.White,
        ),
        elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp, pressedElevation = 0.dp),
    ) {
        if (loading) {
            CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = Color.White)
            Spacer(modifier = Modifier.width(8.dp))
        } else if (icon != null) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
        }
        Text(text, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
        if (trailingIcon != null && !loading) {
            Spacer(modifier = Modifier.weight(1f))
            Icon(trailingIcon, contentDescription = null, modifier = Modifier.size(16.dp))
        }
    }
}

@Composable
private fun HostToolSecondaryButton(
    text: String,
    icon: ImageVector? = null,
    enabled: Boolean = true,
    onClick: () -> Unit,
) {
    val colors = LocalHayameColors.current
    Surface(
        onClick = onClick,
        enabled = enabled,
        shape = RoundedCornerShape(16.dp),
        color = colors.fieldBackground,
        modifier = Modifier.fillMaxWidth().height(48.dp).alpha(if (enabled) 1f else 0.55f),
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxSize(),
        ) {
            if (icon != null) {
                Icon(icon, contentDescription = null, tint = colors.brandNavy, modifier = Modifier.size(18.dp))
            }
            Text(text, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
        }
    }
}

@Composable
private fun HostToolChip(text: String, icon: ImageVector, onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    Surface(onClick = onClick, shape = RoundedCornerShape(12.dp), color = colors.fieldBackground) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(icon, contentDescription = null, tint = colors.brandNavy, modifier = Modifier.size(15.dp))
            Text(text, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
        }
    }
}

@Composable
private fun HostModeChip(text: String, icon: ImageVector, selected: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(12.dp),
        color = if (selected) colors.brandNavy else colors.fieldBackground,
        modifier = modifier.height(40.dp),
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterHorizontally),
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxSize(),
        ) {
            Icon(icon, contentDescription = null, tint = if (selected) Color.White else colors.brandNavy, modifier = Modifier.size(15.dp))
            Text(text, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = if (selected) Color.White else colors.brandNavy)
        }
    }
}

@Composable
private fun HostToolStat(value: String, label: String, hint: String, tint: Color, modifier: Modifier = Modifier) {
    val colors = LocalHayameColors.current
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(18.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(18.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(3.dp),
    ) {
        Text(value, fontSize = 24.sp, fontWeight = FontWeight.Bold, color = tint)
        Text(label, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
        Text(hint, style = MaterialTheme.typography.labelSmall, color = colors.mutedText)
    }
}

@Composable
private fun HostToolEmptyState(icon: ImageVector, title: String, message: String) {
    val colors = LocalHayameColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(24.dp))
            .padding(22.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Box(
            modifier = Modifier.size(92.dp).clip(CircleShape).background(colors.brandLight),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(32.dp))
        }
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
        Text(message, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText, textAlign = TextAlign.Center)
    }
}

@Composable
private fun HostTipLine(icon: ImageVector, text: String) {
    val colors = LocalHayameColors.current
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.Top) {
        Box(
            modifier = Modifier.size(28.dp).clip(RoundedCornerShape(9.dp)).background(colors.brandLight),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(14.dp))
        }
        Text(text, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText, modifier = Modifier.weight(1f))
    }
}

private fun parityListingTitle(car: CarDto): String =
    car.title?.trim()?.takeIf { it.isNotBlank() }
        ?: listOfNotNull(car.brand?.trim(), car.model?.trim()).filter { it.isNotBlank() }.joinToString(" ").ifBlank { "Listing" }

@Composable
private fun ParityTopBar(title: String, onBack: () -> Unit) {
    val colors = LocalHayameColors.current

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(colors.cardBackground)
            .padding(horizontal = 8.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        IconButton(onClick = onBack) {
            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = colors.brandNavy)
        }
        Text(title, style = androidx.compose.material3.MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
    }
}

@Composable
private fun HostStatCard(
    title: String,
    value: String,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
) {
    val colors = LocalHayameColors.current
    val cardModifier = if (onClick == null) {
        modifier
    } else {
        modifier.clickable(onClick = onClick)
    }

    Card(
        modifier = cardModifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = colors.cardBackground),
        border = BorderStroke(1.dp, colors.border),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(title, style = androidx.compose.material3.MaterialTheme.typography.labelLarge, color = colors.mutedText)
            Text(value, style = androidx.compose.material3.MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold, color = colors.brandNavy)
        }
    }
}

private fun resolveParityImage(raw: String?): String? = com.hayame.app.ui.components.RemoteImageUrlResolver.resolve(raw)

private fun openExternalUrlCompat(context: Context, url: String) {
    runCatching {
        CustomTabsIntent.Builder().setShowTitle(true).build().launchUrl(context, Uri.parse(url))
    }.onFailure {
        runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) }
    }
}

private fun copyUriToTempFileCompat(context: Context, uri: Uri, prefix: String): File? {
    return runCatching {
        val extension = context.contentResolver.getType(uri)?.substringAfter('/') ?: "jpg"
        val temp = File.createTempFile(prefix, "." + extension, context.cacheDir)
        context.contentResolver.openInputStream(uri).use { input ->
            temp.outputStream().use { output -> input?.copyTo(output) }
        }
        temp
    }.getOrNull()
}

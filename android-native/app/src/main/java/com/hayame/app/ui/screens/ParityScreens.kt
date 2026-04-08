package com.hayame.app.ui.screens

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.browser.customtabs.CustomTabsIntent
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
import androidx.compose.material3.AssistChip
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
import com.hayame.app.ui.theme.BrandBlue
import com.hayame.app.ui.theme.BrandLight
import com.hayame.app.ui.theme.BrandNavy
import com.hayame.app.ui.theme.MutedText
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

    Scaffold(
        containerColor = Color(0xFFF8FAFF),
        topBar = {
            ParityTopBar(title = "Dashboard", onBack = onBack)
        },
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
                Card(shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("Welcome back", style = androidx.compose.material3.MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold, color = BrandNavy)
                        Text("Manage bookings, favorites, chats, and hosting access.", color = MutedText)
                    }
                }
            }

            item {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                    HostStatCard("Upcoming trips", "$upcomingTrips", modifier = Modifier.weight(1f))
                    HostStatCard("Past trips", "$pastTrips", modifier = Modifier.weight(1f))
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
                    Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("Host mode is active.", color = BrandNavy, fontWeight = FontWeight.Bold)
                            Text("Open host dashboard to manage listings, bookings, earnings, and reviews.", color = MutedText)
                            OutlinedButton(onClick = onOpenHostDashboard) { Text("Open host dashboard") }
                        }
                    }
                }
            } else {
                item {
                    Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("Become a host", color = BrandNavy, fontWeight = FontWeight.Bold)
                            Text("Apply to list your cars. Review usually takes 1-2 business days.", color = MutedText)
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

@Composable
private fun ParityNavRow(title: String, subtitle: String, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Icon(Icons.Outlined.Info, contentDescription = null, tint = BrandBlue)
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(title, color = BrandNavy, fontWeight = FontWeight.Bold)
                Text(subtitle, color = MutedText, style = androidx.compose.material3.MaterialTheme.typography.bodySmall)
            }
            Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = Color.LightGray)
        }
    }
}

@Composable
fun ContactScreen(onBack: () -> Unit) {
    Scaffold(
        containerColor = Color(0xFFF8FAFF),
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
                Card(shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("We are here to help with bookings, hosting and trip issues.", color = MutedText)
                        Text("+233 (0) 55 555 5555", color = BrandNavy, fontWeight = FontWeight.Bold)
                        Text("support@hayame.com", color = BrandBlue, fontWeight = FontWeight.Bold)
                        Text("Accra Digital Centre, Ring Road West", color = BrandNavy)
                    }
                }
            }
        }
    }
}

@Composable
fun PrivacyScreen(onBack: () -> Unit) {
    Scaffold(
        containerColor = Color(0xFFF8FAFF),
        topBar = { ParityTopBar(title = "Privacy", onBack = onBack) },
    ) { inner ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(inner)
                .padding(16.dp),
        ) {
            Card(shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Text(
                    text = "We store only the information required to operate bookings, payments, messages and listings. For account/data requests, contact support@hayame.com.",
                    modifier = Modifier.padding(16.dp),
                    color = MutedText,
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
        containerColor = Color(0xFFF8FAFF),
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
                        color = MutedText,
                        style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
                    )
                    Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                        Text(
                            text = "Hayame does not publish bundled insurance coverage on this page. Any third-party cover must be confirmed directly with the vehicle owner.",
                            modifier = Modifier.padding(14.dp),
                            color = MutedText,
                        )
                    }
                }
            }
            items(sections) { section ->
                Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(section.first, color = BrandNavy, fontWeight = FontWeight.Bold)
                        Text(section.second, color = MutedText)
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
        containerColor = Color(0xFFF8FAFF),
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
                Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(policy.first, color = BrandNavy, fontWeight = FontWeight.Bold)
                        Text(policy.second, color = MutedText)
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
        containerColor = Color(0xFFF8FAFF),
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
                    color = MutedText,
                    style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                )
            }
            items(pages) { page ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { openExternalUrlCompat(context, page.second) },
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Text(page.first, color = BrandNavy, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                        Icon(Icons.Outlined.OpenInNew, contentDescription = null, tint = BrandBlue)
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
        containerColor = Color(0xFFF8FAFF),
        topBar = { ParityTopBar(title = "Host Review", onBack = onBack) },
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
                EmptyBlock(
                    title = "Host Application Pending",
                    subtitle = "Your host application is still under review. Continue browsing as a renter while we process it.",
                )
            }

            item {
                Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("Status", color = MutedText)
                        Text(status.ifBlank { "pending" }.replace("_", " ").uppercase(), color = BrandNavy, fontWeight = FontWeight.Bold)
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

@Composable
fun HostFavoritesScreen(viewModel: AppViewModel, onBack: () -> Unit) {
    val myCarsState by viewModel.myCarsState.collectAsState()

    LaunchedEffect(Unit) { viewModel.loadMyCars() }

    val cars = ((myCarsState as? UiState.Success<List<CarDto>>)?.data ?: emptyList())
        .sortedByDescending { it.favorites_count ?: 0.0 }

    Scaffold(
        containerColor = Color(0xFFF8FAFF),
        topBar = { ParityTopBar(title = "Favorites", onBack = onBack) },
    ) { inner ->
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
                            Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Text(car.title.orEmpty().ifBlank { listOfNotNull(car.brand, car.model).joinToString(" ") }, color = BrandNavy, fontWeight = FontWeight.Bold)
                                    Text(listOfNotNull(car.city, car.region).joinToString(", "), color = MutedText)
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text("GH₵${(car.daily_price ?: 0.0).toInt()} / day", color = BrandBlue, fontWeight = FontWeight.Bold)
                                        Spacer(modifier = Modifier.weight(1f))
                                        AssistChip(onClick = {}, label = { Text("${(car.favorites_count ?: 0.0).toInt()} saves") })
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

@Composable
fun HostListingPhotosScreen(viewModel: AppViewModel, carId: String, onBack: () -> Unit) {
    val photosState by viewModel.carPhotosState.collectAsState()
    val photosLimit by viewModel.carPhotosLimit.collectAsState()
    val context = LocalContext.current

    var replacePhotoId by remember { mutableStateOf<String?>(null) }

    val pickImage = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        val pickedUri = uri ?: return@rememberLauncherForActivityResult
        val file = copyUriToTempFileCompat(context, pickedUri, "car-photo") ?: return@rememberLauncherForActivityResult
        viewModel.uploadCarPhoto(carId = carId, file = file, replacePhotoId = replacePhotoId)
        replacePhotoId = null
    }

    LaunchedEffect(carId) {
        viewModel.loadCarPhotos(carId)
    }

    val photos = (photosState as? UiState.Success<List<CarPhotoItemDto>>)?.data.orEmpty()

    Scaffold(
        containerColor = Color(0xFFF8FAFF),
        topBar = { ParityTopBar(title = "Listing Photos", onBack = onBack) },
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
                Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("Photos", color = MutedText)
                        Text("${photos.size} / $photosLimit", color = BrandNavy, fontWeight = FontWeight.Bold)
                        Text("Maximum $photosLimit photos, up to 4MB each.", color = MutedText)
                    }
                }
            }

            when (val state = photosState) {
                UiState.Loading -> item { LoadingBlock("Loading photos...") }
                is UiState.Error -> item { ErrorBlock(state.message, onRetry = { viewModel.loadCarPhotos(carId) }) }
                UiState.Empty -> item { EmptyBlock("No photos uploaded", "Upload high-quality exterior and interior angles.") }
                is UiState.Success -> {
                    items(photos, key = { it.id }) { photo ->
                        Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                val resolved = resolveParityImage(photo.url)
                                if (!resolved.isNullOrBlank()) {
                                    AsyncImage(
                                        model = resolved,
                                        contentDescription = null,
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(180.dp)
                                            .clip(RoundedCornerShape(12.dp)),
                                        contentScale = ContentScale.Crop,
                                    )
                                }
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                                    OutlinedButton(
                                        onClick = {
                                            replacePhotoId = photo.id
                                            pickImage.launch("image/*")
                                        },
                                        modifier = Modifier.weight(1f),
                                    ) {
                                        Text("Replace")
                                    }
                                    OutlinedButton(
                                        onClick = { viewModel.deleteCarPhoto(carId = carId, photoId = photo.id) },
                                        modifier = Modifier.weight(1f),
                                    ) {
                                        Text("Delete", color = Color(0xFFB42334))
                                    }
                                }
                            }
                        }
                    }
                }
                UiState.Idle -> item { LoadingBlock("Loading photos...") }
            }

            item {
                Button(
                    onClick = {
                        replacePhotoId = null
                        pickImage.launch("image/*")
                    },
                    enabled = photos.size < photosLimit,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(if (photos.size >= photosLimit) "Photo limit reached" else "Add photo")
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun HostAvailabilityEditorScreen(viewModel: AppViewModel, carId: String, onBack: () -> Unit) {
    var startDate by rememberSaveable { mutableStateOf(java.time.LocalDate.now().toString()) }
    var endDate by rememberSaveable { mutableStateOf(java.time.LocalDate.now().plusDays(1).toString()) }
    var markAvailable by rememberSaveable { mutableStateOf(false) }
    var selectedDays by remember { mutableStateOf(setOf<String>()) }

    val weekdays = remember {
        listOf(
            "mon" to "Mon",
            "tue" to "Tue",
            "wed" to "Wed",
            "thu" to "Thu",
            "fri" to "Fri",
            "sat" to "Sat",
            "sun" to "Sun",
        )
    }

    Scaffold(
        containerColor = Color(0xFFF8FAFF),
        topBar = { ParityTopBar(title = "Availability", onBack = onBack) },
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
                Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedTextField(value = startDate, onValueChange = { startDate = it }, label = { Text("Start date (YYYY-MM-DD)") }, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(value = endDate, onValueChange = { endDate = it }, label = { Text("End date (YYYY-MM-DD)") }, modifier = Modifier.fillMaxWidth())
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Mark as available", modifier = Modifier.weight(1f), color = BrandNavy)
                            Switch(checked = markAvailable, onCheckedChange = { markAvailable = it })
                        }
                        Button(
                            onClick = { viewModel.saveAvailabilityWindow(carId, startDate, endDate, markAvailable) },
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text("Save date range")
                        }
                    }
                }
            }

            item {
                Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("Recurring weekday blocks", color = BrandNavy, fontWeight = FontWeight.Bold)
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            weekdays.forEach { day ->
                                val selected = selectedDays.contains(day.first)
                                FilterChip(
                                    selected = selected,
                                    onClick = {
                                        selectedDays = if (selected) selectedDays - day.first else selectedDays + day.first
                                    },
                                    label = { Text(day.second) },
                                )
                            }
                        }
                        OutlinedButton(
                            onClick = { viewModel.saveAvailabilityRecurring(carId, startDate, endDate, selectedDays.toList()) },
                            enabled = selectedDays.isNotEmpty(),
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text("Save recurring blocks")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ParityTopBar(title: String, onBack: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White)
            .padding(horizontal = 8.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        IconButton(onClick = onBack) {
            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
        }
        Text(title, style = androidx.compose.material3.MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = BrandNavy)
    }
}

@Composable
private fun HostStatCard(title: String, value: String, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(title, style = androidx.compose.material3.MaterialTheme.typography.labelLarge, color = MutedText)
            Text(value, style = androidx.compose.material3.MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold, color = BrandNavy)
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

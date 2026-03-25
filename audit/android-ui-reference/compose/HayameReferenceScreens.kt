package com.hayame.reference

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ArrowDropDown
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

@Composable
fun HayameReferenceRoot() {
    var tab by remember { mutableStateOf(HayameTab.Home) }
    HayameBottomScaffold(
        selectedTab = tab,
        unreadCount = 2,
        onSelectTab = { tab = it }
    ) { innerPadding ->
        when (tab) {
            HayameTab.Home -> HayameHomeScreen(Modifier.padding(innerPadding))
            HayameTab.Explore -> HayameExploreScreen(Modifier.padding(innerPadding))
            HayameTab.Trips -> HayameTripsScreen(Modifier.padding(innerPadding))
            HayameTab.Saved -> HayameSavedScreen(Modifier.padding(innerPadding))
            HayameTab.More -> HayameMoreProfileScreen(Modifier.padding(innerPadding))
        }
    }
}

@Composable
fun HayameSplashScreen(modifier: Modifier = Modifier) {
    val bgBrush = Brush.linearGradient(
        listOf(HayameColor.PageBackground, HayameColor.White, HayameColor.BrandLight.copy(alpha = 0.45f))
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(bgBrush)
            .padding(horizontal = HayameSpacing.S24),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .size(220.dp)
                .align(Alignment.TopStart)
                .background(HayameColor.BrandBlue.copy(alpha = 0.12f), CircleShape)
        )
        Box(
            modifier = Modifier
                .size(260.dp)
                .align(Alignment.BottomEnd)
                .background(HayameColor.BrandNavy.copy(alpha = 0.08f), CircleShape)
        )

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(HayameSpacing.S18)
        ) {
            Box(
                modifier = Modifier
                    .size(width = 214.dp, height = 84.dp)
                    .clip(HayameRadius.InputShape)
                    .background(HayameColor.BrandLight),
                contentAlignment = Alignment.Center
            ) {
                Text("Hayame", style = HayameTypography.headlineLarge, color = HayameColor.BrandNavy)
            }

            Text(
                "Rent a car, anytime, anywhere in Ghana.",
                style = HayameTypography.bodyMedium,
                color = HayameColor.MutedText
            )

            LinearProgressIndicator(
                progress = { 1f },
                modifier = Modifier
                    .fillMaxWidth(0.72f)
                    .height(4.dp)
                    .clip(HayameRadius.PillShape),
                color = HayameColor.BrandBlue,
                trackColor = HayameColor.BrandLight
            )
        }
    }
}

@Composable
fun HayameHomeScreen(modifier: Modifier = Modifier) {
    val cars = HayamePreviewData.featuredCars

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(HayameSpacing.S16),
        verticalArrangement = Arrangement.spacedBy(HayameSpacing.S14)
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(HayameColor.BrandLight),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("KA", style = HayameTypography.labelLarge, color = HayameColor.BrandNavy)
                    }
                    Spacer(modifier = Modifier.width(HayameSpacing.S10))
                    Column {
                        Text("Kennedy Abubakar", style = HayameTypography.titleSmall, color = HayameColor.BrandNavy)
                        Text("Open profile", style = HayameTypography.labelSmall, color = HayameColor.MutedText)
                    }
                }

                Spacer(modifier = Modifier.weight(1f))

                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(HayameColor.Card)
                        .border(1.dp, HayameColor.Border, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Outlined.ChatBubbleOutline, contentDescription = null, tint = HayameColor.BrandBlue)
                }
            }
        }

        item {
            HeroBannerCard(
                title = "Rent a Car, Anytime, Anywhere in Ghana.",
                subtitle = "Rent car across Ghana",
                buttonTitle = "Book Now"
            )
        }

        item { HomeQuickFiltersCard() }

        item {
            Row(horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S10)) {
                SearchChip("Accra") { Icon(Icons.Outlined.LocationOn, contentDescription = null, tint = HayameColor.BrandNavy, modifier = Modifier.size(14.dp)) }
                SearchChip("Greater Accra") { Icon(Icons.Outlined.LocationOn, contentDescription = null, tint = HayameColor.BrandNavy, modifier = Modifier.size(14.dp)) }
                SearchChip("Sedan") { Icon(Icons.Outlined.Search, contentDescription = null, tint = HayameColor.BrandNavy, modifier = Modifier.size(14.dp)) }
            }
        }

        item {
            Row(horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S10)) {
                StatTile("Cars Listed", "${cars.size}", Modifier.weight(1f))
                StatTile("Approved Hosts", "24", Modifier.weight(1f))
            }
        }

        item {
            SectionHeader(title = "Featured cars", actionText = "Explore all")
        }

        items(cars.size) { index ->
            val car = cars[index]
            CarRowCard(car = car) {
                Icon(Icons.Outlined.FavoriteBorder, contentDescription = null, tint = HayameColor.BrandNavy)
            }
        }

        item {
            HayameSecondaryButton(
                text = "View protection details",
                modifier = Modifier.fillMaxWidth(),
                onClick = {}
            )
        }
    }
}

@Composable
private fun HeroBannerCard(title: String, subtitle: String, buttonTitle: String) {
    val heroGradient = Brush.linearGradient(listOf(HayameColor.BrandNavy, HayameColor.BrandBlue))

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(HayameRadius.HeroShape)
            .background(heroGradient)
            .padding(HayameSpacing.S18),
        verticalArrangement = Arrangement.spacedBy(HayameSpacing.S14)
    ) {
        Text("Ghana Car Sharing", style = HayameTypography.labelMedium, color = HayameColor.White.copy(alpha = 0.82f))

        Column(verticalArrangement = Arrangement.spacedBy(HayameSpacing.S6)) {
            Text(subtitle.uppercase(), style = HayameTypography.labelSmall, color = HayameColor.White.copy(alpha = 0.72f))
            Text(title, style = HayameTypography.displayLarge, color = HayameColor.White)
        }

        HayamePrimaryButton(text = buttonTitle, modifier = Modifier.fillMaxWidth(0.56f), onClick = {})
    }
}

@Composable
private fun HomeQuickFiltersCard() {
    HayameCard {
        Text("Search with filters", style = HayameTypography.titleSmall, color = HayameColor.BrandNavy)

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(HayameRadius.InputShape)
                .background(HayameColor.White)
                .border(1.dp, HayameColor.Border, HayameRadius.InputShape)
                .padding(horizontal = HayameSpacing.S10, vertical = HayameSpacing.S10),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Outlined.Search, contentDescription = null, tint = HayameColor.MutedText)
            Spacer(modifier = Modifier.width(HayameSpacing.S8))
            Text("Car, city, host", style = HayameTypography.bodySmall, color = HayameColor.MutedText)
        }

        Row(horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S8)) {
            FilterPill("Any region", Modifier.weight(1f))
            FilterPill("Any city", Modifier.weight(1f))
            FilterPill("Any type", Modifier.weight(1f))
        }

        Column(verticalArrangement = Arrangement.spacedBy(HayameSpacing.S6)) {
            Text("Max GHS 5000", style = HayameTypography.bodySmall, color = HayameColor.MutedText)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(4.dp)
                    .clip(HayameRadius.PillShape)
                    .background(HayameColor.BrandLight)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.62f)
                        .height(4.dp)
                        .clip(HayameRadius.PillShape)
                        .background(HayameColor.BrandBlue)
                )
            }
        }

        HayamePrimaryButton(
            text = "Apply filters and search",
            modifier = Modifier.fillMaxWidth(),
            onClick = {}
        )
    }
}

@Composable
private fun FilterPill(text: String, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .clip(HayameRadius.PillShape)
            .background(HayameColor.BrandLight)
            .padding(horizontal = HayameSpacing.S10, vertical = HayameSpacing.S8),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text, style = HayameTypography.labelSmall, color = HayameColor.BrandNavy)
        Icon(Icons.Outlined.ArrowDropDown, contentDescription = null, tint = HayameColor.BrandNavy)
    }
}

@Composable
fun HayameExploreScreen(modifier: Modifier = Modifier) {
    val cars = HayamePreviewData.featuredCars + HayamePreviewData.featuredCars

    LazyVerticalGrid(
        modifier = modifier.fillMaxSize(),
        columns = GridCells.Fixed(2),
        contentPadding = PaddingValues(HayameSpacing.S16),
        horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S12),
        verticalArrangement = Arrangement.spacedBy(HayameSpacing.S12)
    ) {
        item(span = { GridItemSpan(2) }) {
            ExploreSearchBar()
        }

        items(cars, key = { it.id + it.dailyPrice.toString() }) { car ->
            CarGridCard(car = car, onFavorite = {})
        }
    }
}

@Composable
private fun ExploreSearchBar() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(HayameRadius.RowShape)
            .background(HayameColor.White)
            .border(1.dp, HayameColor.Border, HayameRadius.RowShape)
            .padding(horizontal = HayameSpacing.S12, vertical = HayameSpacing.S10),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S8)
    ) {
        Icon(Icons.Outlined.Search, contentDescription = null, tint = HayameColor.MutedText)
        Text("Search cars, cities, hosts", style = HayameTypography.bodySmall, color = HayameColor.MutedText)
        Spacer(modifier = Modifier.weight(1f))

        SearchChip("Sort")

        Box(
            modifier = Modifier
                .size(28.dp)
                .clip(CircleShape)
                .background(HayameColor.BrandLight),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Outlined.Settings, contentDescription = null, tint = HayameColor.BrandBlue, modifier = Modifier.size(16.dp))
        }
    }
}

@Composable
fun HayameTripsScreen(modifier: Modifier = Modifier) {
    val upcoming = HayamePreviewData.upcomingTrips
    val past = HayamePreviewData.pastTrips

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(HayameSpacing.S16),
        verticalArrangement = Arrangement.spacedBy(HayameSpacing.S14)
    ) {
        item {
            PaymentNoticeCard(
                message = "Payment successful. Your booking is now in Trips.",
                isError = false
            )
        }

        item { SectionHeader("Upcoming bookings") }
        items(upcoming.size) { index ->
            TripBookingCard(upcoming[index])
        }

        item { SectionHeader("Past trips") }
        items(past.size) { index ->
            TripBookingCard(past[index])
        }
    }
}

@Composable
private fun PaymentNoticeCard(message: String, isError: Boolean) {
    val fg = if (isError) HayameColor.Danger else HayameColor.Success
    HayameCard {
        Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S10)) {
            Icon(Icons.Outlined.Shield, contentDescription = null, tint = fg)
            Text(message, style = HayameTypography.titleSmall, color = fg, modifier = Modifier.weight(1f))
            Text("Dismiss", style = HayameTypography.labelLarge, color = HayameColor.BrandBlue)
        }
    }
}

@Composable
private fun TripBookingCard(booking: BookingUiModel) {
    HayameCard {
        Row(verticalAlignment = Alignment.Top) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(HayameSpacing.S4)) {
                Text(booking.carTitle, style = HayameTypography.titleMedium, color = HayameColor.BrandNavy)
                Text("${booking.hostName} • ${booking.tripUseCity}, ${booking.tripUseRegion}", style = HayameTypography.bodySmall)
            }
            Column(verticalArrangement = Arrangement.spacedBy(HayameSpacing.S6), horizontalAlignment = Alignment.End) {
                BookingStatusBadge(booking.status)
                PaymentStatusBadge(booking.paymentStatus)
            }
        }

        ProgressStateRow(booking.status)

        TripDetailGrid(booking)

        booking.paymentReference?.let {
            Text("Payment ref: $it", style = HayameTypography.labelMedium, color = HayameColor.MutedText)
        }
        booking.rejectionReason?.takeIf { it.isNotBlank() }?.let {
            Text("Rejection reason: $it", style = HayameTypography.bodySmall, color = HayameColor.Danger)
        }

        Row(horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S10)) {
            HayameSecondaryButton("Message host", modifier = Modifier.weight(1f), onClick = {})
            HayameSecondaryButton("Open dispute", modifier = Modifier.weight(1f), onClick = {})
        }
    }
}

@Composable
private fun BookingStatusBadge(status: BookingStatusUi) {
    val bg = when (status) {
        BookingStatusUi.PENDING, BookingStatusUi.AWAITING_HOST -> HayameColor.Warning.copy(alpha = 0.16f)
        BookingStatusUi.CONFIRMED -> HayameColor.BrandBlue.copy(alpha = 0.16f)
        BookingStatusUi.COMPLETED -> HayameColor.Success.copy(alpha = 0.16f)
        BookingStatusUi.CANCELLED, BookingStatusUi.REJECTED, BookingStatusUi.REFUNDED -> HayameColor.Danger.copy(alpha = 0.16f)
    }
    val fg = when (status) {
        BookingStatusUi.PENDING, BookingStatusUi.AWAITING_HOST -> HayameColor.Warning
        BookingStatusUi.CONFIRMED -> HayameColor.BrandBlue
        BookingStatusUi.COMPLETED -> HayameColor.Success
        BookingStatusUi.CANCELLED, BookingStatusUi.REJECTED, BookingStatusUi.REFUNDED -> HayameColor.Danger
    }
    StatusBadge(status.label, fg, bg)
}

@Composable
private fun PaymentStatusBadge(status: PaymentStatusUi) {
    val bg = when (status) {
        PaymentStatusUi.PAID -> HayameColor.Success.copy(alpha = 0.15f)
        PaymentStatusUi.PENDING -> HayameColor.Warning.copy(alpha = 0.15f)
        PaymentStatusUi.REFUNDED, PaymentStatusUi.FAILED -> HayameColor.Danger.copy(alpha = 0.15f)
    }
    val fg = when (status) {
        PaymentStatusUi.PAID -> HayameColor.Success
        PaymentStatusUi.PENDING -> HayameColor.Warning
        PaymentStatusUi.REFUNDED, PaymentStatusUi.FAILED -> HayameColor.Danger
    }
    StatusBadge(status.label, fg, bg)
}

@Composable
private fun ProgressStateRow(status: BookingStatusUi) {
    val labels = listOf("Pending", "Confirmed", "Ongoing", "Completed")
    val active = when (status) {
        BookingStatusUi.CONFIRMED -> 1
        BookingStatusUi.COMPLETED -> 3
        else -> 0
    }

    Row(horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S4), modifier = Modifier.fillMaxWidth()) {
        labels.forEachIndexed { index, label ->
            val bg = when {
                index < active -> HayameColor.Success.copy(alpha = 0.16f)
                index == active -> HayameColor.BrandBlue.copy(alpha = 0.16f)
                else -> Color(0x26000000)
            }
            val fg = when {
                index < active -> HayameColor.Success
                index == active -> HayameColor.BrandBlue
                else -> HayameColor.MutedText
            }

            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(HayameRadius.PillShape)
                    .background(bg)
                    .padding(vertical = HayameSpacing.S4),
                contentAlignment = Alignment.Center
            ) {
                Text(label, style = HayameTypography.labelSmall, color = fg)
            }
        }
    }
}

@Composable
private fun TripDetailGrid(booking: BookingUiModel) {
    Column(verticalArrangement = Arrangement.spacedBy(HayameSpacing.S8)) {
        Row(horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S8)) {
            TripChip("Dates", "${booking.startDate} - ${booking.endDate}", Modifier.weight(1f))
            TripChip("Duration", "${booking.nights} night(s)", Modifier.weight(1f))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S8)) {
            TripChip("Daily rate", "GHS${booking.dailyRate}", Modifier.weight(1f))
            TripChip("Subtotal", "GHS${booking.subtotal}", Modifier.weight(1f))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S8)) {
            TripChip("Insurance", "GHS${booking.insuranceFee}", Modifier.weight(1f))
            TripChip("Delivery fee", "GHS${booking.deliveryFee}", Modifier.weight(1f))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S8)) {
            TripChip("Outside region fee", "GHS${booking.outsideRegionFee}", Modifier.weight(1f))
            TripChip("Total", "GHS${booking.total}", Modifier.weight(1f))
        }
    }
}

@Composable
private fun TripChip(label: String, value: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .clip(HayameRadius.ChipShape)
            .background(HayameColor.White)
            .border(1.dp, HayameColor.Border, HayameRadius.ChipShape)
            .padding(HayameSpacing.S8),
        verticalArrangement = Arrangement.spacedBy(HayameSpacing.S4)
    ) {
        Text(label.uppercase(), style = HayameTypography.labelSmall, color = HayameColor.MutedText)
        Text(value, style = HayameTypography.labelLarge, color = HayameColor.BrandNavy)
    }
}

@Composable
fun HayameSavedScreen(modifier: Modifier = Modifier) {
    val favorites = HayamePreviewData.featuredCars

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(HayameSpacing.S16),
        verticalArrangement = Arrangement.spacedBy(HayameSpacing.S14)
    ) {
        item { SectionHeader("Favorites") }

        items(favorites.size) { index ->
            CarRowCard(car = favorites[index]) {
                Icon(Icons.Outlined.FavoriteBorder, contentDescription = null, tint = HayameColor.Danger)
            }
        }

        item {
            HayameCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(verticalArrangement = Arrangement.spacedBy(HayameSpacing.S4)) {
                        Text("TOTAL FAVORITES", style = HayameTypography.labelSmall, color = HayameColor.MutedText)
                        Text(favorites.size.toString(), style = HayameTypography.headlineLarge, color = HayameColor.BrandNavy)
                    }
                    Spacer(modifier = Modifier.weight(1f))
                    Icon(Icons.Outlined.FavoriteBorder, contentDescription = null, tint = HayameColor.Danger)
                }
            }
        }
    }
}

@Composable
fun HayameMoreProfileScreen(modifier: Modifier = Modifier) {
    val profile = HayamePreviewData.profile

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(HayameSpacing.S16),
        verticalArrangement = Arrangement.spacedBy(HayameSpacing.S14)
    ) {
        item {
            HayameCard {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S12)) {
                    Box(
                        modifier = Modifier
                            .size(58.dp)
                            .clip(CircleShape)
                            .background(HayameColor.BrandLight),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("KA", style = HayameTypography.titleMedium, color = HayameColor.BrandNavy)
                    }

                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(HayameSpacing.S4)) {
                        Text(profile.fullName, style = HayameTypography.headlineMedium, color = HayameColor.BrandNavy)
                        Text(profile.email, style = HayameTypography.bodyMedium, color = HayameColor.MutedText)
                    }
                }

                InfoLine("Location", "${profile.city}, ${profile.region}")
                InfoLine("Phone", profile.phone)

                HayameSecondaryButton("Edit profile", modifier = Modifier.fillMaxWidth(), onClick = {})
            }
        }

        item {
            SectionHeader("Profile settings")
        }

        item {
            HayameCard {
                ProfileActionRow("Edit profile", icon = { Icon(Icons.Outlined.PersonOutline, contentDescription = null, tint = HayameColor.BrandNavy) }, onClick = {})
                HorizontalDivider()
                ProfileActionRow("Trips", icon = { Icon(Icons.Outlined.Search, contentDescription = null, tint = HayameColor.BrandNavy) }, onClick = {})
                HorizontalDivider()
                ProfileActionRow("Messages", icon = { Icon(Icons.Outlined.ChatBubbleOutline, contentDescription = null, tint = HayameColor.BrandNavy) }, onClick = {})
                HorizontalDivider()
                ProfileActionRow("Dashboard", icon = { Icon(Icons.Outlined.Settings, contentDescription = null, tint = HayameColor.BrandNavy) }, onClick = {})
            }
        }

        item {
            SectionHeader("Hosting")
        }

        item {
            HayameCard {
                SimpleToggleRow(label = "Host mode", checked = profile.hostModeEnabled, onCheckedChange = {})
                Text(
                    "Turn on Host mode to access host dashboard, listings, bookings, and earnings.",
                    style = HayameTypography.bodySmall,
                    color = HayameColor.MutedText
                )
                Text(profile.hostStatusLabel, style = HayameTypography.bodySmall, color = HayameColor.Warning)
            }
        }

        item {
            SectionHeader("Support")
        }

        item {
            HayameCard {
                SupportLink("Contact")
                SupportLink("Protection")
                SupportLink("Cancellation Policy")
                SupportLink("Privacy")
            }
        }

        item {
            HayameSecondaryButton("Sign out", modifier = Modifier.fillMaxWidth(), onClick = {})
        }
    }
}

@Composable
fun HayameCarDetailOverviewScreen(modifier: Modifier = Modifier) {
    val car = HayamePreviewData.featuredCars.first()

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(HayameSpacing.S16),
        verticalArrangement = Arrangement.spacedBy(HayameSpacing.S14)
    ) {
        item {
            HayameCard {
                Row(horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S8)) {
                    StatusBadge("Car in ${car.city}", HayameColor.BrandBlue, HayameColor.BrandLight)
                    StatusBadge(car.type, HayameColor.BrandNavy, HayameColor.BrandLight)
                    StatusBadge("Added Mar 19, 2026", HayameColor.MutedText, Color(0x14000000))
                }

                Row(verticalAlignment = Alignment.Top) {
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(HayameSpacing.S4)) {
                        Text(car.title, style = HayameTypography.headlineLarge, color = HayameColor.BrandNavy)
                        Text("${car.city}, ${car.region}", style = HayameTypography.bodyMedium, color = HayameColor.MutedText)
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S6)) {
                            Icon(Icons.Outlined.Star, contentDescription = null, tint = HayameColor.Warning, modifier = Modifier.size(14.dp))
                            Text("${car.rating}", style = HayameTypography.labelLarge, color = HayameColor.Warning)
                            Text("${car.reviewsCount} reviews", style = HayameTypography.bodySmall, color = HayameColor.MutedText)
                        }
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(CircleShape)
                                .background(HayameColor.White)
                                .border(1.dp, HayameColor.Border, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Outlined.FavoriteBorder, contentDescription = null, tint = HayameColor.BrandNavy)
                        }
                        Text("Save to favorites", style = HayameTypography.labelSmall, color = HayameColor.MutedText)
                    }
                }
            }
        }

        item {
            SectionHeader("Car photo")
        }

        item {
            HayameCard {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(250.dp)
                        .clip(HayameRadius.HeroShape)
                        .background(HayameColor.BrandLight)
                )
                Row(horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S10)) {
                    repeat(4) {
                        Box(
                            modifier = Modifier
                                .size(width = 78.dp, height = 56.dp)
                                .clip(HayameRadius.ChipShape)
                                .background(HayameColor.BrandLight)
                                .border(1.dp, HayameColor.Border, HayameRadius.ChipShape)
                        )
                    }
                }
            }
        }

        item {
            SectionHeader("Details")
        }

        item {
            HayameCard {
                DetailLine("LOCATION", "${car.city}, ${car.region}")
                DetailLine("BRAND", "Mercedes-Benz")
                DetailLine("MODEL", "C-Class (C180/C200/C300)")
                DetailLine("YEAR", car.year.toString())
                DetailLine("SEATS", "${car.seats} seats")
                DetailLine("TRANSMISSION", car.transmission)
                DetailLine("FUEL", car.fuelType)
                DetailLine("REGION", car.region)
            }
        }

        item {
            SectionHeader("Description")
        }

        item {
            HayameCard {
                Text(car.description, style = HayameTypography.bodyLarge, color = HayameColor.MutedText)
            }
        }

        item {
            SectionHeader("Features")
        }

        item {
            HayameCard {
                Row(horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S8)) {
                    car.features.take(3).forEach {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(HayameRadius.ChipShape)
                                .background(HayameColor.BrandLight)
                                .padding(horizontal = HayameSpacing.S10, vertical = HayameSpacing.S8)
                        ) {
                            Text(it, style = HayameTypography.labelMedium, color = HayameColor.BrandNavy)
                        }
                    }
                }
            }
        }

        item {
            SectionHeader("Latest reviews")
        }

        item {
            HayameCard {
                repeat(2) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(HayameRadius.ChipShape)
                            .background(HayameColor.White)
                            .border(1.dp, HayameColor.Border, HayameRadius.ChipShape)
                            .padding(HayameSpacing.S10),
                        verticalArrangement = Arrangement.spacedBy(HayameSpacing.S4)
                    ) {
                        Text("Guest ${it + 1}", style = HayameTypography.labelLarge, color = HayameColor.BrandNavy)
                        Text("★★★★★", style = HayameTypography.labelLarge, color = HayameColor.Warning)
                        Text("Clean car, smooth ride and fast response from host.", style = HayameTypography.bodySmall, color = HayameColor.MutedText)
                    }
                    Spacer(modifier = Modifier.height(HayameSpacing.S8))
                }
            }
        }

        item {
            SectionHeader("Host")
        }

        item {
            HayameCard {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S12)) {
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .clip(CircleShape)
                            .background(HayameColor.BrandLight),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("KL", style = HayameTypography.titleMedium, color = HayameColor.BrandNavy)
                    }

                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(HayameSpacing.S4)) {
                        Text(car.hostName, style = HayameTypography.titleMedium, color = HayameColor.BrandNavy)
                        Text(car.hostLevel, style = HayameTypography.labelLarge, color = HayameColor.BrandBlue)
                        Text(car.hostCity, style = HayameTypography.bodySmall, color = HayameColor.MutedText)
                    }
                }

                VerificationLine("ID Verified")
                VerificationLine("Phone Verified")
                VerificationLine("Email Verified")

                HayameSecondaryButton("Message ${car.hostName}", modifier = Modifier.fillMaxWidth(), onClick = {})
            }
        }
    }
}

@Composable
fun HayameCarDetailBookingSectionScreen(modifier: Modifier = Modifier) {
    val car = HayamePreviewData.featuredCars.first()

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(HayameSpacing.S16),
        verticalArrangement = Arrangement.spacedBy(HayameSpacing.S14)
    ) {
        item {
            SectionHeader("Trip")
        }

        item {
            HayameCard {
                Text("GH₵${car.dailyPrice} / day", style = HayameTypography.titleLarge, color = HayameColor.BrandNavy)
                Text(
                    "Pay now with Paystack; host approval required before pickup.",
                    style = HayameTypography.bodySmall,
                    color = HayameColor.MutedText
                )
                Text("Refunded if host rejects", style = HayameTypography.labelMedium, color = HayameColor.Success)

                Text("HOST VERIFICATION", style = HayameTypography.labelSmall, color = HayameColor.MutedText)
                VerificationLine("ID Verified")
                VerificationLine("Phone Verified")
                VerificationLine("Email Verified")

                InfoLine("Cancellation", car.cancellationPolicy)

                Text("TRIP DATES", style = HayameTypography.labelSmall, color = HayameColor.MutedText)
                MockInput("Start date", "22/03/2026")
                MockInput("End date", "24/03/2026")

                Text("Quick select:", style = HayameTypography.labelLarge, color = HayameColor.BrandNavy)
                Row(horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S8)) {
                    HayameSecondaryButton("2 days", modifier = Modifier.weight(1f), onClick = {})
                    HayameSecondaryButton("5 days", modifier = Modifier.weight(1f), onClick = {})
                    HayameSecondaryButton("7 days", modifier = Modifier.weight(1f), onClick = {})
                }

                Text("TRIP USE LOCATION", style = HayameTypography.labelSmall, color = HayameColor.MutedText)
                Text("Listing region: ${car.region}", style = HayameTypography.bodySmall, color = HayameColor.MutedText)

                MockInput("Region", "Greater Accra")
                MockInput("City / district", "Accra")
                MockInput("Exact area / destination", "East Legon")

                Text("Minimum 3 characters.", style = HayameTypography.labelMedium, color = HayameColor.MutedText)
                Text(
                    "Outside listing region trip (+GH₵${car.outsideRegionFee})",
                    style = HayameTypography.bodySmall,
                    color = HayameColor.Warning
                )

                InfoLine("Daily rate x 2 day(s)", "GH₵${car.dailyPrice * 2}")
                InfoLine("Insurance fee", "GH₵${car.insuranceFee}")
                InfoLine("Delivery fee", "GH₵${car.deliveryFee}")
                InfoLine("Outside listing region surcharge", "GH₵${car.outsideRegionFee}")
                InfoLine("Deposit", "GH₵${car.deposit}")
                Text(
                    "Final payable total is calculated by the server at checkout.",
                    style = HayameTypography.labelMedium,
                    color = HayameColor.MutedText
                )

                HayameSecondaryButton(
                    text = "View protection details",
                    modifier = Modifier.fillMaxWidth(),
                    onClick = {}
                )

                HayamePrimaryButton(
                    text = "Book Now",
                    modifier = Modifier.fillMaxWidth(),
                    onClick = {}
                )
            }
        }
    }
}

@Composable
private fun DetailLine(label: String, value: String) {
    Row(verticalAlignment = Alignment.Top) {
        Text(label, style = HayameTypography.labelSmall, color = HayameColor.MutedText)
        Spacer(modifier = Modifier.weight(1f))
        Text(value, style = HayameTypography.labelLarge, color = HayameColor.BrandNavy, textAlign = TextAlign.End)
    }
}

@Composable
private fun VerificationLine(text: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S8)) {
        Icon(Icons.Outlined.Shield, contentDescription = null, tint = HayameColor.Success, modifier = Modifier.size(16.dp))
        Text(text, style = HayameTypography.bodySmall, color = HayameColor.BrandNavy)
    }
}

@Composable
private fun MockInput(label: String, value: String) {
    Column(verticalArrangement = Arrangement.spacedBy(HayameSpacing.S4)) {
        Text(label, style = HayameTypography.labelMedium, color = HayameColor.MutedText)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(HayameRadius.InputShape)
                .background(HayameColor.White)
                .border(1.dp, HayameColor.Border, HayameRadius.InputShape)
                .padding(horizontal = HayameSpacing.S12, vertical = HayameSpacing.S10)
        ) {
            Text(value, style = HayameTypography.bodyLarge, color = HayameColor.BrandNavy)
        }
    }
}

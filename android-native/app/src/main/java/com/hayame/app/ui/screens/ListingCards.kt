package com.hayame.app.ui.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.Bolt
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.DirectionsCar
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.hayame.app.core.network.CarDto
import com.hayame.app.ui.components.HayameShimmerBlock
import com.hayame.app.ui.theme.LocalHayameColors
import kotlin.math.roundToInt

// MARK: Listing cards ------------------------------------------------------------------------------
//
// One card for every listing surface (Home, Explore, Saved). Image first: the photo carries the
// card with rounded corners and no container, the heart and any badge float over it, and the facts
// sit as plain text underneath. Two layouts share the same anatomy: a tile (photo on top) and a
// row (photo on the left) for compact lists.

internal enum class ListingCardLayout { TILE, ROW }

@Composable
internal fun ListingCard(
    car: CarDto,
    isFavorite: Boolean,
    onClick: () -> Unit,
    onFavoriteClick: () -> Unit,
    modifier: Modifier = Modifier,
    layout: ListingCardLayout = ListingCardLayout.TILE,
    imageHeight: Dp = 156.dp,
    showsFavoriteButton: Boolean = true,
    emphasizeSaved: Boolean = false,
) {
    val colors = LocalHayameColors.current
    val imageUrl = remember(car.id, car.image_url, car.car_photos) {
        resolveAppImage(car.image_url) ?: car.car_photos.orEmpty().firstNotNullOfOrNull { resolveAppImage(it.url) }
    }
    val title = car.title?.trim().takeUnless { it.isNullOrBlank() }
        ?: listOfNotNull(car.brand?.trim(), car.model?.trim()).filter { it.isNotBlank() }.joinToString(" ").ifBlank { "Hayame listing" }
    val year = (car.year ?: car.car_year)?.roundToInt()?.takeIf { it > 1900 }
    val reviews = (car.reviews_count ?: 0.0).roundToInt().coerceAtLeast(0)
    val ratingText = when {
        reviews > 0 -> String.format("%.1f", car.avg_rating ?: 0.0)
        isNewListing(car.created_at) -> "New"
        else -> "No reviews yet"
    }
    val price = (car.daily_price ?: 0.0).roundToInt()

    val photo: @Composable (Modifier) -> Unit = { photoModifier ->
        Box(
            modifier = photoModifier
                .clip(RoundedCornerShape(18.dp))
                .background(colors.brandLight),
        ) {
            if (!imageUrl.isNullOrBlank()) {
                AsyncImage(model = imageUrl, contentDescription = title, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
            } else {
                Icon(Icons.Outlined.DirectionsCar, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.align(Alignment.Center).size(28.dp))
            }
            if (showsFavoriteButton && layout == ListingCardLayout.TILE) {
                Box(modifier = Modifier.align(Alignment.TopEnd).padding(8.dp)) {
                    ListingHeartButton(isFavorite = isFavorite, emphasizeSaved = emphasizeSaved, onClick = onFavoriteClick)
                }
            }
            if (car.instant_book == true || car.allow_one_day_booking == true) {
                Row(
                    modifier = Modifier.align(Alignment.BottomStart).padding(8.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    if (car.instant_book == true) ListingPhotoPill(Icons.Outlined.Bolt, "Instant")
                    if (car.allow_one_day_booking == true) ListingPhotoPill(Icons.Outlined.CalendarMonth, "1 day")
                }
            }
        }
    }

    val facts: @Composable (Modifier) -> Unit = { factsModifier ->
        Column(modifier = factsModifier, verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy, maxLines = 2, overflow = TextOverflow.Ellipsis)
            Row(horizontalArrangement = Arrangement.spacedBy(5.dp), verticalAlignment = Alignment.CenterVertically) {
                if (year != null) {
                    Text("$year", style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
                    Box(modifier = Modifier.size(3.dp).background(colors.mutedText.copy(alpha = 0.5f), CircleShape))
                }
                Text(
                    ratingText,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = if (reviews > 0) FontWeight.Bold else FontWeight.Medium,
                    color = if (reviews > 0) colors.brandNavy else colors.mutedText,
                )
                if (reviews > 0) {
                    Icon(Icons.Filled.Star, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(12.dp))
                    Text("($reviews)", style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
                }
            }
            Text(car.city.orEmpty().ifBlank { car.region.orEmpty().ifBlank { "Ghana" } }, style = MaterialTheme.typography.bodySmall, color = colors.mutedText, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Row(verticalAlignment = Alignment.Bottom, modifier = Modifier.padding(top = 4.dp)) {
                Text("GHS $price", style = MaterialTheme.typography.titleMedium.copy(fontSize = 17.sp), fontWeight = FontWeight.Bold, color = colors.brandNavy)
                Text("/day", style = MaterialTheme.typography.labelMedium, color = colors.mutedText, modifier = Modifier.padding(start = 2.dp, bottom = 1.dp))
            }
        }
    }

    when (layout) {
        ListingCardLayout.TILE -> Column(
            modifier = modifier.clickable(onClick = onClick),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            photo(Modifier.fillMaxWidth().height(imageHeight))
            facts(Modifier.fillMaxWidth())
        }
        ListingCardLayout.ROW -> Row(
            modifier = modifier.fillMaxWidth().clickable(onClick = onClick),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.Top,
        ) {
            photo(Modifier.size(width = 128.dp, height = 96.dp))
            facts(Modifier.weight(1f).padding(top = 2.dp))
            if (showsFavoriteButton) {
                ListingHeartButton(isFavorite = isFavorite, emphasizeSaved = emphasizeSaved, onDark = false, onClick = onFavoriteClick)
            }
        }
    }
}

/** The heart that floats over a listing photo (or sits beside a row). */
@Composable
internal fun ListingHeartButton(
    isFavorite: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    emphasizeSaved: Boolean = false,
    onDark: Boolean = true,
) {
    val colors = LocalHayameColors.current
    var bounce by remember { mutableIntStateOf(0) }
    val scale by animateFloatAsState(if (bounce % 2 == 1) 1.2f else 1f, tween(160), label = "heart-bounce")
    val tint = when {
        isFavorite && (emphasizeSaved || !onDark) -> colors.danger
        isFavorite -> Color.White
        onDark -> Color.White
        else -> colors.brandNavy
    }
    val disc = when {
        onDark && isFavorite && emphasizeSaved -> colors.floatingControlBackground
        onDark -> Color.Black.copy(alpha = 0.22f)
        else -> colors.fieldBackground
    }
    Box(
        modifier = modifier
            .size(34.dp)
            .background(disc, CircleShape)
            .clickable { bounce += 1; onClick() },
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
            contentDescription = if (isFavorite) "Remove from saved" else "Save",
            tint = tint,
            modifier = Modifier.size(17.dp).graphicsLayer { scaleX = scale; scaleY = scale },
        )
    }
}

/** Shimmer stand-in with the same anatomy as [ListingCard]. */
@Composable
internal fun ListingCardSkeleton(layout: ListingCardLayout = ListingCardLayout.TILE, imageHeight: Dp = 156.dp, modifier: Modifier = Modifier) {
    when (layout) {
        ListingCardLayout.TILE -> Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(10.dp)) {
            HayameShimmerBlock(modifier = Modifier.fillMaxWidth().height(imageHeight), cornerRadius = 18.dp)
            HayameShimmerBlock(modifier = Modifier.size(width = 150.dp, height = 15.dp), cornerRadius = 6.dp)
            HayameShimmerBlock(modifier = Modifier.size(width = 110.dp, height = 11.dp), cornerRadius = 5.dp)
            HayameShimmerBlock(modifier = Modifier.size(width = 80.dp, height = 14.dp), cornerRadius = 6.dp)
        }
        ListingCardLayout.ROW -> Row(modifier = modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            HayameShimmerBlock(modifier = Modifier.size(width = 128.dp, height = 96.dp), cornerRadius = 18.dp)
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                HayameShimmerBlock(modifier = Modifier.size(width = 150.dp, height = 15.dp), cornerRadius = 6.dp)
                HayameShimmerBlock(modifier = Modifier.size(width = 110.dp, height = 11.dp), cornerRadius = 5.dp)
                HayameShimmerBlock(modifier = Modifier.size(width = 80.dp, height = 14.dp), cornerRadius = 6.dp)
            }
            Spacer(modifier = Modifier.width(1.dp))
        }
    }
}

/** Small dark capsule over a listing photo: "Instant", "1 day". */
@Composable
private fun ListingPhotoPill(icon: androidx.compose.ui.graphics.vector.ImageVector, text: String) {
    Row(
        modifier = Modifier
            .background(Color.Black.copy(alpha = 0.42f), CircleShape)
            .padding(horizontal = 8.dp, vertical = 5.dp),
        horizontalArrangement = Arrangement.spacedBy(3.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, contentDescription = null, tint = Color.White, modifier = Modifier.size(11.dp))
        Text(text, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = Color.White)
    }
}

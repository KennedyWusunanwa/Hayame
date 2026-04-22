package com.hayame.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.hayame.app.core.network.CarDto
import com.hayame.app.ui.theme.Border
import com.hayame.app.ui.theme.BrandBlue
import com.hayame.app.ui.theme.BrandLight
import com.hayame.app.ui.theme.BrandNavy
import com.hayame.app.ui.theme.CardBackground
import com.hayame.app.ui.theme.MutedText

@Composable
fun LoadingBlock(label: String = "Loading...") {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        CircularProgressIndicator(color = BrandBlue)
        Text(text = label, style = MaterialTheme.typography.bodyMedium, color = MutedText)
    }
}

@Composable
fun ErrorBlock(message: String, retryLabel: String = "Retry", onRetry: () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = CardBackground),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(text = "Something went wrong", style = MaterialTheme.typography.titleMedium, color = BrandNavy)
            Text(text = message, style = MaterialTheme.typography.bodyMedium, color = MutedText)
            OutlinedButton(onClick = onRetry) {
                Text(retryLabel)
            }
        }
    }
}

@Composable
fun EmptyBlock(title: String, subtitle: String) {
    Card(
        colors = CardDefaults.cardColors(containerColor = CardBackground),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(text = title, style = MaterialTheme.typography.titleMedium, color = BrandNavy)
            Text(text = subtitle, style = MaterialTheme.typography.bodyMedium, color = MutedText)
        }
    }
}

@Composable
fun CarCard(
    car: CarDto,
    isFavorite: Boolean,
    imageHeight: androidx.compose.ui.unit.Dp = 180.dp,
    onClick: () -> Unit,
    onFavoriteClick: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = CardBackground),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(imageHeight)
                    .clip(RoundedCornerShape(16.dp))
                    .background(BrandLight),
            ) {
                val imageUrl = resolvedCarImageUrl(car)
                if (!imageUrl.isNullOrBlank()) {
                    AsyncImage(
                        model = imageUrl,
                        contentDescription = car.title,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop,
                    )
                }

                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.8f))
                        .clickable(onClick = onFavoriteClick),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                        contentDescription = null,
                        tint = if (isFavorite) Color.Red else BrandNavy,
                        modifier = Modifier.size(20.dp),
                    )
                }

                if (car.instant_book == true) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.BottomStart)
                            .padding(8.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(BrandBlue)
                            .padding(horizontal = 8.dp, vertical = 4.dp),
                    ) {
                        Text("INSTANT", color = Color.White, style = MaterialTheme.typography.labelSmall)
                    }
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = car.title.orEmpty(),
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    color = BrandNavy,
                )

                Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.LocationOn, contentDescription = null, tint = MutedText, modifier = Modifier.size(14.dp))
                    Text(
                        text = listOfNotNull(car.city, car.region).joinToString(", "),
                        style = MaterialTheme.typography.bodySmall,
                        color = MutedText,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "GH₵${car.daily_price?.toInt() ?: 0}",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold),
                    color = BrandBlue,
                )
                Text(text = " / day", style = MaterialTheme.typography.bodySmall, color = MutedText)
                Spacer(modifier = Modifier.weight(1f))
                if (car.avg_rating != null && car.avg_rating!! > 0) {
                    Text(text = "⭐ ${String.format("%.1f", car.avg_rating)}", style = MaterialTheme.typography.labelLarge, color = BrandNavy)
                }
            }
        }
    }
}

private fun resolvedCarImageUrl(car: CarDto): String? {
    val primary = RemoteImageUrlResolver.resolve(car.image_url)
    if (!primary.isNullOrBlank()) return primary
    return car.car_photos
        ?.asSequence()
        ?.mapNotNull { RemoteImageUrlResolver.resolve(it.url) }
        ?.firstOrNull()
}

@Composable
fun SectionHeader(title: String, action: String? = null, onAction: (() -> Unit)? = null) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(title, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold), color = BrandNavy)
        Spacer(modifier = Modifier.weight(1f))
        if (action != null && onAction != null) {
            TextButton(onClick = onAction) {
                Text(action, color = BrandBlue, fontWeight = FontWeight.Bold)
            }
        }
    }
}

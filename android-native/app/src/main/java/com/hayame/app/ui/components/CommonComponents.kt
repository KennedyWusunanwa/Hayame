package com.hayame.app.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
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
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.hayame.app.core.network.CarDto
import com.hayame.app.ui.theme.LocalHayameColors

@Composable
fun HayameShimmerBlock(
    modifier: Modifier,
    cornerRadius: Dp = 10.dp,
) {
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
            .clip(RoundedCornerShape(cornerRadius))
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
fun LoadingBlock(label: String = "Loading...") {
    val colors = LocalHayameColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        CircularProgressIndicator(color = colors.brandBlue)
        Text(text = label, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
    }
}

@Composable
fun ErrorBlock(message: String, retryLabel: String = "Retry", onRetry: () -> Unit) {
    val colors = LocalHayameColors.current
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(
                elevation = 0.dp,
                shape = RoundedCornerShape(16.dp),
                ambientColor = colors.cardShadow,
                spotColor = colors.cardShadow,
            )
            .clip(RoundedCornerShape(16.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(16.dp))
            .padding(16.dp),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(text = "Something went wrong", style = MaterialTheme.typography.titleMedium, color = colors.brandNavy)
            Text(text = message, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
            OutlinedButton(onClick = onRetry) {
                Text(retryLabel)
            }
        }
    }
}

@Composable
fun EmptyBlock(title: String, subtitle: String) {
    val colors = LocalHayameColors.current
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(
                elevation = 0.dp,
                shape = RoundedCornerShape(16.dp),
                ambientColor = colors.cardShadow,
                spotColor = colors.cardShadow,
            )
            .clip(RoundedCornerShape(16.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(16.dp))
            .padding(16.dp),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(text = title, style = MaterialTheme.typography.titleMedium, color = colors.brandNavy)
            Text(text = subtitle, style = MaterialTheme.typography.bodyMedium, color = colors.mutedText)
        }
    }
}

@Composable
fun CarCard(
    car: CarDto,
    isFavorite: Boolean,
    imageHeight: Dp = 180.dp,
    onClick: () -> Unit,
    onFavoriteClick: () -> Unit,
) {
    val colors = LocalHayameColors.current
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(
                elevation = 10.dp,
                shape = RoundedCornerShape(20.dp),
                clip = false,
                ambientColor = colors.cardShadow,
                spotColor = colors.cardShadow,
            )
            .clip(RoundedCornerShape(20.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(20.dp))
            .clickable(onClick = onClick),
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
                    .background(colors.brandLight),
            ) {
                val imageUrl = resolvedCarImageUrl(car)
                if (!imageUrl.isNullOrBlank()) {
                    // Blur-up LQIP: a tiny variant blurred behind the full image. Only when
                    // a real (smaller) thumbnail variant exists — otherwise it would just
                    // load the full original twice (transforms are currently disabled).
                    val thumbUrl = RemoteImageUrlResolver.transformed(
                        RemoteImageUrlResolver.originalUrl(imageUrl),
                        width = 40,
                        quality = 40,
                    )
                    if (thumbUrl != null && thumbUrl != imageUrl) {
                        AsyncImage(
                            model = thumbUrl,
                            contentDescription = null,
                            modifier = Modifier
                                .fillMaxSize()
                                .blur(14.dp),
                            contentScale = ContentScale.Crop,
                        )
                    }
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
                        .background(colors.floatingControlBackground)
                        .clickable(onClick = onFavoriteClick),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                        contentDescription = null,
                        tint = if (isFavorite) Color.Red else colors.brandNavy,
                        modifier = Modifier.size(20.dp),
                    )
                }

                if (car.instant_book == true) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.BottomStart)
                            .padding(8.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(colors.brandBlue)
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
                    color = colors.brandNavy,
                )

                Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.LocationOn, contentDescription = null, tint = colors.mutedText, modifier = Modifier.size(14.dp))
                    Text(
                        text = listOfNotNull(car.city, car.region).joinToString(", "),
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.mutedText,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "GH₵${car.daily_price?.toInt() ?: 0}",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold),
                    color = colors.brandBlue,
                )
                Text(text = " / day", style = MaterialTheme.typography.bodySmall, color = colors.mutedText)
                Spacer(modifier = Modifier.weight(1f))
                if (car.avg_rating != null && car.avg_rating!! > 0) {
                    Text(text = "⭐ ${String.format("%.1f", car.avg_rating)}", style = MaterialTheme.typography.labelLarge, color = colors.brandNavy)
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
    val colors = LocalHayameColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(title, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold), color = colors.brandNavy)
        Spacer(modifier = Modifier.weight(1f))
        if (action != null && onAction != null) {
            TextButton(onClick = onAction) {
                Text(action, color = colors.brandBlue, fontWeight = FontWeight.Bold)
            }
        }
    }
}

// Skeleton placeholder composables matching iOS patterns

@Composable
fun BookingPlaceholderCard() {
    val colors = LocalHayameColors.current
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(0.dp, RoundedCornerShape(16.dp), false, colors.cardShadow, colors.cardShadow)
            .clip(RoundedCornerShape(16.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(16.dp))
            .padding(14.dp),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    HayameShimmerBlock(modifier = Modifier.size(width = 132.dp, height = 15.dp), cornerRadius = 6.dp)
                    HayameShimmerBlock(modifier = Modifier.size(width = 170.dp, height = 12.dp), cornerRadius = 6.dp)
                }
                HayameShimmerBlock(modifier = Modifier.size(width = 72.dp, height = 22.dp), cornerRadius = 11.dp)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HayameShimmerBlock(modifier = Modifier.size(width = 120.dp, height = 11.dp), cornerRadius = 6.dp)
                HayameShimmerBlock(modifier = Modifier.size(width = 84.dp, height = 11.dp), cornerRadius = 6.dp)
            }
        }
    }
}

@Composable
fun ConversationPlaceholderRow() {
    val colors = LocalHayameColors.current
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(0.dp, RoundedCornerShape(16.dp), false, colors.cardShadow, colors.cardShadow)
            .clip(RoundedCornerShape(16.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(16.dp))
            .padding(14.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            HayameShimmerBlock(modifier = Modifier.size(48.dp), cornerRadius = 24.dp)
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                HayameShimmerBlock(modifier = Modifier.size(width = 118.dp, height = 13.dp), cornerRadius = 6.dp)
                HayameShimmerBlock(modifier = Modifier.size(width = 188.dp, height = 11.dp), cornerRadius = 6.dp)
            }
            HayameShimmerBlock(modifier = Modifier.size(width = 34.dp, height = 10.dp), cornerRadius = 5.dp)
        }
    }
}

@Composable
fun HostListingPlaceholderRow() {
    val colors = LocalHayameColors.current
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(0.dp, RoundedCornerShape(14.dp), false, colors.cardShadow, colors.cardShadow)
            .clip(RoundedCornerShape(14.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(14.dp))
            .padding(14.dp),
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                HayameShimmerBlock(modifier = Modifier.size(width = 154.dp, height = 14.dp), cornerRadius = 6.dp)
                HayameShimmerBlock(modifier = Modifier.size(width = 120.dp, height = 12.dp), cornerRadius = 6.dp)
            }
            HayameShimmerBlock(modifier = Modifier.size(width = 84.dp, height = 20.dp), cornerRadius = 10.dp)
        }
    }
}

@Composable
fun ExploreListRowPlaceholder() {
    val colors = LocalHayameColors.current
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(0.dp, RoundedCornerShape(16.dp), false, colors.cardShadow, colors.cardShadow)
            .clip(RoundedCornerShape(16.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(16.dp))
            .padding(12.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            HayameShimmerBlock(modifier = Modifier.size(width = 94.dp, height = 72.dp), cornerRadius = 12.dp)
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                HayameShimmerBlock(modifier = Modifier.size(width = 150.dp, height = 14.dp), cornerRadius = 6.dp)
                HayameShimmerBlock(modifier = Modifier.size(width = 110.dp, height = 12.dp), cornerRadius = 6.dp)
                HayameShimmerBlock(modifier = Modifier.size(width = 84.dp, height = 12.dp), cornerRadius = 6.dp)
            }
        }
    }
}

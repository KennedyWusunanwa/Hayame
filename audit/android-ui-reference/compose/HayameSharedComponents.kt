package com.hayame.reference

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.EllipsisHoriz
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material.icons.outlined.PersonOutline
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

enum class HayameTab(val label: String) {
    Home("Home"),
    Explore("Explore"),
    Trips("Trips"),
    Saved("Saved"),
    More("More")
}

@Composable
fun HayameBottomScaffold(
    selectedTab: HayameTab,
    unreadCount: Int,
    onSelectTab: (HayameTab) -> Unit,
    content: @Composable (PaddingValues) -> Unit
) {
    Scaffold(
        containerColor = HayameColor.PageBackground,
        bottomBar = {
            NavigationBar(containerColor = HayameColor.Card) {
                val items = listOf(
                    HayameTab.Home to Icons.Outlined.Home,
                    HayameTab.Explore to Icons.Outlined.Search,
                    HayameTab.Trips to Icons.Outlined.CalendarMonth,
                    HayameTab.Saved to Icons.Outlined.FavoriteBorder,
                    HayameTab.More to Icons.Outlined.EllipsisHoriz
                )

                items.forEach { (tab, icon) ->
                    NavigationBarItem(
                        selected = selectedTab == tab,
                        onClick = { onSelectTab(tab) },
                        icon = {
                            if (tab == HayameTab.More && unreadCount > 0) {
                                BadgedBox(
                                    badge = {
                                        Badge(containerColor = HayameColor.BrandBlue) {
                                            Text(text = unreadCount.toString())
                                        }
                                    }
                                ) {
                                    Icon(icon, contentDescription = tab.label)
                                }
                            } else {
                                Icon(icon, contentDescription = tab.label)
                            }
                        },
                        label = { Text(tab.label) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = HayameColor.BrandBlue,
                            selectedTextColor = HayameColor.BrandBlue,
                            unselectedIconColor = HayameColor.MutedText,
                            unselectedTextColor = HayameColor.MutedText,
                            indicatorColor = HayameColor.BrandLight
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        content(innerPadding)
    }
}

@Composable
fun HayamePage(content: @Composable () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(HayameColor.PageBackground)
    ) {
        content()
    }
}

@Composable
fun HayameCard(
    modifier: Modifier = Modifier,
    content: @Composable Column.() -> Unit
) {
    Surface(
        modifier = modifier,
        color = HayameColor.Card,
        shape = HayameRadius.CardShape,
        shadowElevation = 4.dp,
        tonalElevation = 0.dp,
        border = androidx.compose.foundation.BorderStroke(1.dp, HayameColor.Border)
    ) {
        Column(
            modifier = Modifier.padding(HayameSpacing.S14),
            verticalArrangement = Arrangement.spacedBy(HayameSpacing.S8),
            content = content
        )
    }
}

@Composable
fun HayamePrimaryButton(
    text: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    val gradient = Brush.horizontalGradient(listOf(HayameColor.BrandBlue, HayameColor.BrandNavy))
    Box(
        modifier = modifier
            .clip(HayameRadius.PillShape)
            .background(gradient)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = onClick
            )
            .padding(horizontal = HayameSpacing.S16, vertical = HayameSpacing.S12),
        contentAlignment = Alignment.Center
    ) {
        Text(text = text, color = HayameColor.White, style = HayameTypography.titleSmall)
    }
}

@Composable
fun HayameSecondaryButton(
    text: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .clip(HayameRadius.PillShape)
            .background(HayameColor.BrandLight)
            .border(1.dp, HayameColor.BrandBlue.copy(alpha = 0.25f), HayameRadius.PillShape)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = onClick
            )
            .padding(horizontal = HayameSpacing.S14, vertical = HayameSpacing.S10),
        contentAlignment = Alignment.Center
    ) {
        Text(text = text, style = HayameTypography.labelLarge, color = HayameColor.BrandNavy)
    }
}

@Composable
fun SectionHeader(title: String, actionText: String? = null, onAction: (() -> Unit)? = null) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(title, style = HayameTypography.headlineMedium, color = HayameColor.BrandNavy)
        Spacer(modifier = Modifier.weight(1f))
        if (actionText != null && onAction != null) {
            Text(
                text = actionText,
                style = HayameTypography.titleSmall,
                color = HayameColor.BrandBlue,
                modifier = Modifier.clickable(onClick = onAction)
            )
        }
    }
}

@Composable
fun StatTile(title: String, value: String, modifier: Modifier = Modifier) {
    HayameCard(modifier) {
        Text(
            title.uppercase(),
            style = HayameTypography.labelSmall,
            color = HayameColor.MutedText
        )
        Text(value, style = HayameTypography.headlineLarge, color = HayameColor.BrandNavy)
    }
}

@Composable
fun InfoLine(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth()) {
        Text(label, style = HayameTypography.bodyMedium, color = HayameColor.MutedText)
        Spacer(modifier = Modifier.weight(1f))
        Text(value, style = HayameTypography.titleSmall, color = HayameColor.BrandNavy)
    }
}

@Composable
fun StatusBadge(text: String, foreground: Color, background: Color) {
    Box(
        modifier = Modifier
            .clip(HayameRadius.PillShape)
            .background(background)
            .padding(horizontal = HayameSpacing.S8, vertical = HayameSpacing.S4)
    ) {
        Text(text, style = HayameTypography.labelSmall, color = foreground)
    }
}

@Composable
fun SearchChip(text: String, icon: @Composable (() -> Unit)? = null) {
    Row(
        modifier = Modifier
            .clip(HayameRadius.PillShape)
            .background(HayameColor.Card)
            .border(1.dp, HayameColor.Border, HayameRadius.PillShape)
            .padding(horizontal = HayameSpacing.S10, vertical = HayameSpacing.S8),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S6)
    ) {
        icon?.invoke()
        Text(text, style = HayameTypography.labelLarge, color = HayameColor.BrandNavy)
    }
}

@Composable
fun CarRowCard(
    car: CarUiModel,
    modifier: Modifier = Modifier,
    trailing: @Composable (() -> Unit)? = null
) {
    Surface(
        modifier = modifier,
        color = HayameColor.Card,
        shape = HayameRadius.RowShape,
        border = androidx.compose.foundation.BorderStroke(1.dp, HayameColor.Border)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(HayameSpacing.S10),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S12)
        ) {
            Box(
                modifier = Modifier
                    .size(width = 94.dp, height = 72.dp)
                    .clip(HayameRadius.InputShape)
                    .background(HayameColor.BrandLight)
            )

            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(HayameSpacing.S4)) {
                Text(
                    car.title,
                    style = HayameTypography.titleSmall,
                    color = HayameColor.BrandNavy,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text("${car.city}, ${car.region}", style = HayameTypography.bodySmall, color = HayameColor.MutedText)
                Text("GHS${car.dailyPrice}/day", style = HayameTypography.labelLarge, color = HayameColor.BrandBlue)
            }

            trailing?.invoke()
        }
    }
}

@Composable
fun CarGridCard(
    car: CarUiModel,
    modifier: Modifier = Modifier,
    onFavorite: (() -> Unit)? = null
) {
    Surface(
        modifier = modifier,
        color = HayameColor.Card,
        shape = HayameRadius.CardShape,
        border = androidx.compose.foundation.BorderStroke(1.dp, HayameColor.Border)
    ) {
        Column(modifier = Modifier.padding(HayameSpacing.S10), verticalArrangement = Arrangement.spacedBy(HayameSpacing.S10)) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp)
                    .clip(HayameRadius.RowShape)
                    .background(HayameColor.BrandLight)
            ) {
                if (onFavorite != null) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(HayameSpacing.S8)
                            .size(30.dp)
                            .clip(CircleShape)
                            .background(HayameColor.White)
                            .border(1.dp, HayameColor.Border, CircleShape)
                            .clickable(onClick = onFavorite),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Outlined.FavoriteBorder, contentDescription = "Favorite", tint = HayameColor.BrandNavy)
                    }
                }
            }

            Text(car.title, style = HayameTypography.titleSmall, color = HayameColor.BrandNavy, maxLines = 1)
            Text("${car.city}, ${car.region}", style = HayameTypography.bodySmall, color = HayameColor.MutedText, maxLines = 1)

            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(HayameSpacing.S6)) {
                Icon(Icons.Outlined.Star, contentDescription = null, tint = HayameColor.Warning, modifier = Modifier.size(12.dp))
                Text(String.format("%.1f", car.rating), style = HayameTypography.labelSmall, color = HayameColor.Warning)
                if (car.instantBook) {
                    StatusBadge(
                        text = "Instant",
                        foreground = HayameColor.Success,
                        background = HayameColor.Success.copy(alpha = 0.14f)
                    )
                }
            }

            Row(verticalAlignment = Alignment.Bottom) {
                Text("GHS${car.dailyPrice}", style = HayameTypography.titleLarge, color = HayameColor.BrandNavy)
                Spacer(modifier = Modifier.width(HayameSpacing.S4))
                Text("/ day", style = HayameTypography.bodySmall, color = HayameColor.BrandBlue)
            }
        }
    }
}

@Composable
fun ProfileActionRow(title: String, icon: @Composable () -> Unit, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = HayameSpacing.S8),
        verticalAlignment = Alignment.CenterVertically
    ) {
        icon()
        Spacer(modifier = Modifier.width(HayameSpacing.S10))
        Text(title, style = HayameTypography.titleSmall, color = HayameColor.BrandNavy)
        Spacer(modifier = Modifier.weight(1f))
        Icon(Icons.Outlined.PersonOutline, contentDescription = null, tint = HayameColor.MutedText, modifier = Modifier.size(14.dp))
    }
}

@Composable
fun SupportLink(text: String) {
    Text(
        text = text,
        style = HayameTypography.titleSmall,
        color = HayameColor.BrandNavy,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = HayameSpacing.S6)
    )
}

@Composable
fun SimpleToggleRow(label: String, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, style = HayameTypography.titleSmall, color = HayameColor.BrandNavy)
        Spacer(modifier = Modifier.weight(1f))
        Switch(checked = checked, onCheckedChange = onCheckedChange)
    }
}

@Composable
fun PlaceholderList(items: Int, title: String) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(HayameSpacing.S16),
        verticalArrangement = Arrangement.spacedBy(HayameSpacing.S12)
    ) {
        item {
            Text(title, style = HayameTypography.headlineMedium, color = HayameColor.BrandNavy)
        }
        items(items) {
            HayameCard {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(68.dp)
                        .clip(HayameRadius.RowShape)
                        .background(HayameColor.BrandLight)
                )
            }
        }
    }
}

@Composable
fun HorizontalDivider() {
    Divider(color = HayameColor.Border, thickness = 1.dp)
}

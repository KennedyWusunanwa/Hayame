package com.hayame.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

private val LightHayameColorScheme: ColorScheme = lightColorScheme(
    primary = BrandBlue,
    onPrimary = Color.White,
    primaryContainer = BrandLight,
    onPrimaryContainer = BrandNavy,
    secondary = BrandNavy,
    onSecondary = Color.White,
    secondaryContainer = BrandLight,
    onSecondaryContainer = BrandNavy,
    tertiary = BrandBlue,
    onTertiary = Color.White,
    tertiaryContainer = BrandLight,
    onTertiaryContainer = BrandNavy,
    background = PageBackground,
    onBackground = BrandNavy,
    surface = CardBackground,
    onSurface = BrandNavy,
    surfaceVariant = Color(0xFFF1F6FD),
    onSurfaceVariant = MutedText,
    surfaceTint = BrandBlue,
    surfaceContainerLowest = PageBackground,
    surfaceContainerLow = Color(0xFFF0F6FE),
    surfaceContainer = Color(0xFFF1F6FD),
    surfaceContainerHigh = Color(0xFFEAF2FB),
    surfaceContainerHighest = Color(0xFFE2EDF9),
    surfaceBright = CardBackground,
    surfaceDim = Color(0xFFD8E4F3),
    inverseSurface = BrandNavy,
    inverseOnSurface = Color(0xFFF0F8FF),
    inversePrimary = Color(0xFF4DB3FF),
    outline = Color(0xFFE0EAF8),
    outlineVariant = Color(0x14000000),
    error = Danger,
    onError = Color.White,
    errorContainer = Color(0xFFFFDAD6),
    onErrorContainer = Color(0xFF410002),
    scrim = Color(0x52000000),
)

private val DarkHayameColorScheme: ColorScheme = darkColorScheme(
    primary = DarkHayameColors.brandBlue,
    onPrimary = Color.White,
    primaryContainer = DarkHayameColors.brandLight,
    onPrimaryContainer = DarkHayameColors.brandNavy,
    secondary = DarkHayameColors.brandNavy,
    onSecondary = Color(0xFF04182D),
    secondaryContainer = DarkHayameColors.brandLight,
    onSecondaryContainer = DarkHayameColors.brandNavy,
    tertiary = DarkHayameColors.brandBlue,
    onTertiary = Color.White,
    tertiaryContainer = DarkHayameColors.brandLight,
    onTertiaryContainer = DarkHayameColors.brandNavy,
    background = DarkHayameColors.pageBackground,
    onBackground = DarkHayameColors.brandNavy,
    surface = DarkHayameColors.cardBackground,
    onSurface = DarkHayameColors.brandNavy,
    surfaceVariant = DarkHayameColors.fieldBackground,
    onSurfaceVariant = DarkHayameColors.mutedText,
    surfaceTint = Color.Transparent,
    surfaceContainerLowest = DarkHayameColors.pageBackground,
    surfaceContainerLow = Color(0xFF091F35),
    surfaceContainer = DarkHayameColors.cardBackground,
    surfaceContainerHigh = DarkHayameColors.elevatedBackground,
    surfaceContainerHighest = Color(0xFF16334F),
    surfaceBright = DarkHayameColors.elevatedBackground,
    surfaceDim = DarkHayameColors.pageBackground,
    inverseSurface = DarkHayameColors.brandNavy,
    inverseOnSurface = DarkHayameColors.pageBackground,
    inversePrimary = Color(0xFF1484D9),
    outline = DarkHayameColors.border,
    outlineVariant = DarkHayameColors.controlStroke,
    error = DarkHayameColors.danger,
    onError = Color(0xFF250808),
    errorContainer = Color(0xFF4D1111),
    onErrorContainer = Color(0xFFFFDAD6),
    scrim = Color(0x52000000),
)

private val HayameTypography = Typography(
    headlineLarge = TextStyle(fontSize = 26.sp, fontWeight = FontWeight.Bold),
    headlineMedium = TextStyle(fontSize = 22.sp, fontWeight = FontWeight.Bold),
    titleLarge = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Bold),
    titleMedium = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.SemiBold),
    bodyLarge = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Medium),
    bodyMedium = TextStyle(fontSize = 13.sp, fontWeight = FontWeight.Medium),
    labelLarge = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.SemiBold),
)

@Composable
fun HayameTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val hayameColors = if (darkTheme) DarkHayameColors else LightHayameColors
    val materialColorScheme = if (darkTheme) DarkHayameColorScheme else LightHayameColorScheme

    CompositionLocalProvider(LocalHayameColors provides hayameColors, LocalDarkMode provides darkTheme) {
        MaterialTheme(
            colorScheme = materialColorScheme,
            typography = HayameTypography,
            content = content,
        )
    }
}

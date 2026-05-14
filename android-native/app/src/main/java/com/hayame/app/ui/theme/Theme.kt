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
    background = PageBackground,
    onBackground = BrandNavy,
    surface = CardBackground,
    onSurface = BrandNavy,
    surfaceVariant = Color(0xFFEAF2FB),
    onSurfaceVariant = MutedText,
    outline = Color(0xFFE0EAF8),
    error = Danger,
    onError = Color.White,
)

private val DarkHayameColorScheme: ColorScheme = darkColorScheme(
    primary = DarkHayameColors.brandBlue,
    onPrimary = Color(0xFF04182D),
    primaryContainer = DarkHayameColors.brandLight,
    onPrimaryContainer = DarkHayameColors.brandNavy,
    secondary = DarkHayameColors.brandNavy,
    onSecondary = Color(0xFF04182D),
    background = DarkHayameColors.pageBackground,
    onBackground = DarkHayameColors.brandNavy,
    surface = DarkHayameColors.cardBackground,
    onSurface = DarkHayameColors.brandNavy,
    surfaceVariant = Color(0xFF16334F),
    onSurfaceVariant = DarkHayameColors.mutedText,
    outline = DarkHayameColors.border,
    error = DarkHayameColors.danger,
    onError = Color(0xFF250808),
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

    CompositionLocalProvider(LocalHayameColors provides hayameColors) {
        MaterialTheme(
            colorScheme = materialColorScheme,
            typography = HayameTypography,
            content = content,
        )
    }
}

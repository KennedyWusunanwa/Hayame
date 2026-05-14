package com.hayame.app.ui.theme

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

@Immutable
data class HayameColors(
    val brandBlue: Color,
    val brandNavy: Color,
    val brandLight: Color,
    val pageBackground: Color,
    val cardBackground: Color,
    val border: Color,
    val mutedText: Color,
    val success: Color,
    val warning: Color,
    val danger: Color,
)

val LightHayameColors = HayameColors(
    brandBlue = Color(0xFF1484D9),
    brandNavy = Color(0xFF0A2B54),
    brandLight = Color(0xFFEDF7FF),
    pageBackground = Color(0xFFF7FAFF),
    cardBackground = Color(0xFFFFFFFF),
    border = Color(0x14000000),
    mutedText = Color(0xFF737D91),
    success = Color(0xFF1CA15F),
    warning = Color(0xFFED8F30),
    danger = Color(0xFFE04141),
)

val DarkHayameColors = HayameColors(
    brandBlue = Color(0xFF4DB3FF),
    brandNavy = Color(0xFFEAF4FF),
    brandLight = Color(0xFF123452),
    pageBackground = Color(0xFF071A2F),
    cardBackground = Color(0xFF0E263F),
    border = Color(0x33FFFFFF),
    mutedText = Color(0xFFA8B4C8),
    success = Color(0xFF4DDB93),
    warning = Color(0xFFFFB35C),
    danger = Color(0xFFFF6B6B),
)

val LocalHayameColors = staticCompositionLocalOf { LightHayameColors }

package com.hayame.app.ui.theme

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

@Immutable
data class HayameColors(
    val brandBlue: Color,
    val brandNavy: Color,
    val brandLight: Color,
    val authHeaderBackground: Color,
    val pageBackground: Color,
    val cardBackground: Color,
    val elevatedBackground: Color,
    val fieldBackground: Color,
    val chipBackground: Color,
    val floatingControlBackground: Color,
    val subtleFill: Color,
    val border: Color,
    val controlStroke: Color,
    val mutedText: Color,
    val success: Color,
    val warning: Color,
    val danger: Color,
    val cardShadow: Color,
    val skeletonBase: Color,
    val skeletonHighlight: Color,
    val bottomBarSeparator: Color,
    val primaryButtonEnd: Color,
)

val LightHayameColors = HayameColors(
    brandBlue = Color(0xFF1484D9),
    brandNavy = Color(0xFF0A2B54),
    brandLight = Color(0xFFEDF7FF),
    authHeaderBackground = Color(0xFF1484D9),
    pageBackground = Color(0xFFF7FAFF),
    cardBackground = Color(0xFFFFFFFF),
    elevatedBackground = Color(0xFFFFFFFF),
    fieldBackground = Color(0xFFF1F6FD),
    chipBackground = Color(0xFFFFFFFF),
    floatingControlBackground = Color(0xEBFFFFFF),
    subtleFill = Color(0x0A000000),
    border = Color(0x0F000000),            // iOS cardStroke light: black @ 6%
    controlStroke = Color(0x14000000),
    mutedText = Color(0xFF737D91),
    success = Color(0xFF1CA160),
    warning = Color(0xFFED8F30),
    danger = Color(0xFFE04040),
    cardShadow = Color(0x0D000000),        // iOS cardShadow light: black @ 5%
    skeletonBase = Color(0x14000000),      // iOS skeletonBase light: black @ 8%
    skeletonHighlight = Color(0x80FFFFFF), // iOS skeletonHighlight light: white @ 50%
    bottomBarSeparator = Color(0xBFFFFFFF),// iOS bottomBarSeparator light: white @ 75%
    primaryButtonEnd = Color(0xFF0A2B54),  // iOS primaryButtonEnd light: brandNavy
)

val DarkHayameColors = HayameColors(
    brandBlue = Color(0xFF4DB3FF),
    brandNavy = Color(0xFFEAF4FF),
    brandLight = Color(0xFF123452),
    authHeaderBackground = Color(0xFF0E3A66),
    pageBackground = Color(0xFF071A2F),
    cardBackground = Color(0xFF0E263F),
    elevatedBackground = Color(0xFF132D49),
    fieldBackground = Color(0xFF102A44),
    chipBackground = Color(0xFF102A44),
    floatingControlBackground = Color(0xF0102A44),
    subtleFill = Color(0x14FFFFFF),
    border = Color(0x1AFFFFFF),            // iOS cardStroke dark: white @ 10%
    controlStroke = Color(0x24FFFFFF),
    mutedText = Color(0xFFA8B4C8),
    success = Color(0xFF4DDB93),
    warning = Color(0xFFFFB35C),
    danger = Color(0xFFFF6B6B),
    cardShadow = Color(0x47000000),        // iOS cardShadow dark: black @ 28%
    skeletonBase = Color(0x1AFFFFFF),      // iOS skeletonBase dark: white @ 10%
    skeletonHighlight = Color(0x2EFFFFFF), // iOS skeletonHighlight dark: white @ 18%
    bottomBarSeparator = Color(0x1FFFFFFF),// iOS bottomBarSeparator dark: white @ 12%
    primaryButtonEnd = Color(0xFF1484D9),  // iOS primaryButtonEnd dark: brandBlue
)

val LocalHayameColors = staticCompositionLocalOf { LightHayameColors }
val LocalDarkMode = staticCompositionLocalOf { false }

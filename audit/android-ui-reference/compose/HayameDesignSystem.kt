package com.hayame.reference

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Typography
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

object HayameColor {
    val BrandBlue = Color(0xFF1484D9)
    val BrandNavy = Color(0xFF0A2B54)
    val BrandLight = Color(0xFFEDF7FF)

    val PageBackground = Color(0xFFF7FAFF)
    val Card = Color(0xFFFFFFFF)
    val Border = Color(0x14000000)
    val MutedText = Color(0xFF737D91)

    val Success = Color(0xFF1CA15F)
    val Warning = Color(0xFFED8F30)
    val Danger = Color(0xFFE04141)

    val White = Color(0xFFFFFFFF)
}

object HayameSpacing {
    val S4 = 4.dp
    val S6 = 6.dp
    val S8 = 8.dp
    val S10 = 10.dp
    val S12 = 12.dp
    val S14 = 14.dp
    val S16 = 16.dp
    val S18 = 18.dp
    val S20 = 20.dp
    val S24 = 24.dp
    val S28 = 28.dp
}

object HayameRadius {
    val Chip = 10.dp
    val Input = 12.dp
    val Row = 14.dp
    val Card = 16.dp
    val Hero = 20.dp
    val Pill = 999.dp

    val ChipShape = RoundedCornerShape(Chip)
    val InputShape = RoundedCornerShape(Input)
    val RowShape = RoundedCornerShape(Row)
    val CardShape = RoundedCornerShape(Card)
    val HeroShape = RoundedCornerShape(Hero)
    val PillShape = RoundedCornerShape(Pill)
}

val HayameTypography = Typography(
    displayLarge = TextStyle(fontSize = 32.sp, fontWeight = FontWeight.Bold, color = HayameColor.White),
    headlineLarge = TextStyle(fontSize = 26.sp, fontWeight = FontWeight.Bold, color = HayameColor.BrandNavy),
    headlineMedium = TextStyle(fontSize = 22.sp, fontWeight = FontWeight.Bold, color = HayameColor.BrandNavy),
    titleLarge = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Bold, color = HayameColor.BrandNavy),
    titleMedium = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.Bold, color = HayameColor.BrandNavy),
    titleSmall = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = HayameColor.BrandNavy),
    bodyLarge = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Medium, color = HayameColor.BrandNavy),
    bodyMedium = TextStyle(fontSize = 13.sp, fontWeight = FontWeight.Medium, color = HayameColor.MutedText),
    bodySmall = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium, color = HayameColor.MutedText),
    labelLarge = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = HayameColor.BrandNavy),
    labelMedium = TextStyle(fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = HayameColor.MutedText),
    labelSmall = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = HayameColor.MutedText)
)

package com.hayame.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.DirectionsCar
import androidx.compose.material.icons.outlined.Key
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hayame.app.ui.theme.LocalHayameColors
import com.hayame.app.ui.theme.LocalDarkMode
import kotlin.math.cos
import kotlin.math.sin

/**
 * Full-screen branded interstitial shown while the app swaps between the renter and host shells:
 * gradient backdrop, a light sweep, radar rings, a sparkle burst and the icon popping in, then the
 * copy sliding up. [visible] drives the fade in/out; the caller swaps screens while it is covered.
 */
@Composable
fun HostModeSwitchOverlay(visible: Boolean, targetsHost: Boolean, modifier: Modifier = Modifier) {
    AnimatedVisibility(
        visible = visible,
        modifier = modifier,
        enter = fadeIn(tween(220)) + scaleIn(initialScale = 1.06f, animationSpec = tween(260, easing = FastOutSlowInEasing)),
        exit = fadeOut(tween(380)),
    ) {
        ModeSwitchContent(targetsHost = targetsHost)
    }
}

@Composable
private fun ModeSwitchContent(targetsHost: Boolean) {
    val colors = LocalHayameColors.current
    val darkMode = LocalDarkMode.current
    // Same deep navy field as the splash screen in dark mode; bright brand blue (host)
    // or pale sky (renter) in light mode.
    val gradient = when {
        darkMode && targetsHost -> listOf(Color(0xFF0F3A66), Color(0xFF081A2E), Color(0xFF03101D))
        darkMode -> listOf(Color(0xFF0D2A49), Color(0xFF081A2E), Color(0xFF03101D))
        targetsHost -> listOf(colors.brandBlue, colors.primaryButtonEnd)
        else -> listOf(Color(0xFFEDF7FF), Color(0xFFC7E6FF))
    }
    val foreground = if (darkMode || targetsHost) Color.White else colors.brandNavy
    val accent = when {
        darkMode -> Color(0xFF4DB3FF)
        targetsHost -> Color.White
        else -> colors.brandBlue
    }
    val sweepAlpha = if (darkMode) 0.12f else if (targetsHost) 0.22f else 0.35f

    var started by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { started = true }
    val iconScale by animateFloatAsState(if (started) 1f else 0.4f, spring(dampingRatio = 0.55f, stiffness = Spring.StiffnessMediumLow), label = "icon-scale")
    val iconRotation by animateFloatAsState(if (started) 0f else -14f, spring(dampingRatio = 0.6f, stiffness = Spring.StiffnessMediumLow), label = "icon-rotation")
    val textProgress by animateFloatAsState(if (started) 1f else 0f, tween(420, delayMillis = 220, easing = FastOutSlowInEasing), label = "text")
    val sweep by animateFloatAsState(if (started) 1f else -1f, tween(900, delayMillis = 100, easing = FastOutSlowInEasing), label = "sweep")
    val burst by animateFloatAsState(if (started) 1f else 0f, tween(850, delayMillis = 180, easing = FastOutSlowInEasing), label = "burst")
    val pulse = rememberInfiniteTransition(label = "pulse")
    val ring by pulse.animateFloat(
        initialValue = 0.45f,
        targetValue = 2.6f,
        animationSpec = infiniteRepeatable(tween(1800, easing = LinearEasing), RepeatMode.Restart),
        label = "ring",
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.linearGradient(gradient)),
        contentAlignment = Alignment.Center,
    ) {
        // Light band sweeping across once.
        Box(
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer {
                    translationX = sweep * size.width * 1.2f
                    rotationZ = 18f
                }
                .background(
                    Brush.horizontalGradient(
                        listOf(Color.Transparent, accent.copy(alpha = sweepAlpha), Color.Transparent),
                    ),
                ),
        )

        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(22.dp)) {
            Box(contentAlignment = Alignment.Center, modifier = Modifier.size(150.dp)) {
                // Radar rings
                repeat(2) { index ->
                    val phase = ((ring + index * 1.05f - 0.45f) % 2.15f) + 0.45f
                    Box(
                        modifier = Modifier
                            .size(60.dp)
                            .graphicsLayer {
                                scaleX = phase; scaleY = phase
                                alpha = ((2.6f - phase) / 2.15f).coerceIn(0f, 1f) * 0.6f
                            }
                            .border(1.5.dp, accent.copy(alpha = 0.5f), CircleShape),
                    )
                }
                // Sparkle burst
                repeat(10) { index ->
                    val angle = index / 10f * 2f * Math.PI.toFloat() - Math.PI.toFloat() / 2f
                    val distance = 92.dp * (if (index % 2 == 0) 1f else 0.78f) * burst
                    val dotColor = when (index % 3) { 0 -> accent; 1 -> accent.copy(alpha = 0.7f); else -> colors.warning }
                    Box(
                        modifier = Modifier
                            .graphicsLayer {
                                translationX = cos(angle) * distance.toPx()
                                translationY = sin(angle) * distance.toPx()
                                val s = 1f - 0.7f * burst
                                scaleX = s; scaleY = s
                                alpha = (1f - burst) * 0.95f
                            }
                            .size(if (index % 3 == 0) 7.dp else 5.dp)
                            .background(dotColor, CircleShape),
                    )
                }
                Box(
                    modifier = Modifier
                        .size(124.dp)
                        .background(accent.copy(alpha = if (targetsHost) 0.18f else 0.14f), CircleShape)
                        .border(1.5.dp, accent.copy(alpha = 0.35f), CircleShape),
                )
                Icon(
                    imageVector = if (targetsHost) Icons.Outlined.Key else Icons.Outlined.DirectionsCar,
                    contentDescription = null,
                    tint = foreground,
                    modifier = Modifier
                        .size(54.dp)
                        .graphicsLayer { scaleX = iconScale; scaleY = iconScale; rotationZ = iconRotation },
                )
            }
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.graphicsLayer {
                    translationY = (1f - textProgress) * 18.dp.toPx()
                    alpha = textProgress
                },
            ) {
                Text(
                    if (targetsHost) "Host mode on" else "Back to renting",
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                    color = foreground,
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    if (targetsHost) "Opening your dashboard…" else "Browse and book cars",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = foreground.copy(alpha = 0.78f),
                )
            }
        }
    }
}

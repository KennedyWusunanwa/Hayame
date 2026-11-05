package com.hayame.app.ui.screens

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import kotlin.math.roundToInt
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.layout
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathMeasure
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.core.view.WindowCompat
import com.hayame.app.R
import com.hayame.app.ui.theme.LocalDarkMode
import com.hayame.app.ui.theme.LocalHayameColors
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin

// Splash: a drifting brand field with soft bokeh, a glow and two quiet rings,
// while a pen of light writes the HAYAME wordmark, the letters flash solid and
// the car slides in over the top. Same choreography as iOS, compressed to fit
// the short Android splash. The first frame matches the window background, so
// the system splash hands over without a flash.

/** Seconds from the first frame. */
private object SplashTimeline {
    const val TRACE_START = 0.04f
    const val TRACE_DURATION = 0.42f
    const val FILL_START = 0.40f
    const val FILL_DURATION = 0.14f
    const val CAR_START = 0.36f
    const val CAR_DURATION = 0.34f
    const val DOTS_START = 0.9f

    /** Everything after this is ambient: breathing, bokeh, rings. */
    const val SETTLE = 0.72f
}

private val SplashLightField = listOf(Color(0xFF29A3F5), Color(0xFF148AE6), Color(0xFF0D70CC))
private val SplashDarkField = listOf(Color(0xFF0D2A49), Color(0xFF081A2E), Color(0xFF03101D))

@Composable
fun SplashScreen() {
    val context = LocalContext.current
    val appColors = LocalHayameColors.current
    val darkMode = LocalDarkMode.current
    val field = if (darkMode) SplashDarkField else SplashLightField
    val accent = if (darkMode) Color(0xFF4DB3FF) else Color.White
    val reduceMotion = remember {
        runCatching {
            android.provider.Settings.Global.getFloat(
                context.contentResolver,
                android.provider.Settings.Global.ANIMATOR_DURATION_SCALE,
                1f,
            ) == 0f
        }.getOrDefault(false)
    }

    SplashSystemBars(top = field.first(), bottom = field.last(), appColors = appColors, darkMode = darkMode)

    // One clock drives every layer, so each launch plays the same way.
    val time by produceState(initialValue = if (reduceMotion) 10f else 0f) {
        if (reduceMotion) return@produceState
        val start = withFrameNanos { it }
        while (true) {
            withFrameNanos { now -> value = (now - start) / 1_000_000_000f }
        }
    }

    val bokeh = remember {
        listOf(
            SplashBokeh(0.16f, 0.18f, 0.32f, 0.07f, 22f, 0.0f),
            SplashBokeh(0.84f, 0.12f, 0.24f, 0.08f, 18f, 0.6f),
            SplashBokeh(0.90f, 0.46f, 0.42f, 0.05f, 28f, 1.2f),
            SplashBokeh(0.10f, 0.62f, 0.36f, 0.06f, 24f, 1.8f),
            SplashBokeh(0.74f, 0.82f, 0.28f, 0.07f, 20f, 2.4f),
            SplashBokeh(0.30f, 0.88f, 0.22f, 0.06f, 16f, 3.0f),
            SplashBokeh(0.50f, 0.30f, 0.18f, 0.06f, 14f, 3.6f),
        )
    }

    // Slow breathing used by the glow, the bokeh and the settled logo.
    val breath = if (reduceMotion) 0.5f else (1f - cos(time * 2f * PI.toFloat() / 5.6f)) / 2f
    // Gradient direction swings gently from vertical toward diagonal and back.
    val sway = if (reduceMotion) 0f else (1f - cos(time * 2f * PI.toFloat() / 16f)) / 2f

    // Always cover the whole window, even while the app's padding kicks in under
    // the exit zoom, so no strip of page colour shows behind the system bars.
    var originInWindow by remember { mutableStateOf(Offset.Zero) }
    val rootView = LocalView.current.rootView
    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .onGloballyPositioned { originInWindow = it.positionInWindow() }
            .layout { measurable, constraints ->
                val width = if (rootView.width > 0) maxOf(rootView.width, constraints.maxWidth) else constraints.maxWidth
                val height = if (rootView.height > 0) maxOf(rootView.height, constraints.maxHeight) else constraints.maxHeight
                val placeable = measurable.measure(Constraints.fixed(width, height))
                layout(constraints.maxWidth, constraints.maxHeight) {
                    placeable.place(-originInWindow.x.roundToInt(), -originInWindow.y.roundToInt())
                }
            },
    ) {
        val logoWidth = (maxWidth * 0.62f).coerceIn(230.dp, 300.dp)

        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height
            val minSide = size.minDimension

            drawRect(
                brush = Brush.linearGradient(
                    colors = field,
                    start = Offset(w * 0.5f * (1f - sway), 0f),
                    end = Offset(w * (0.5f + 0.5f * sway), h),
                ),
            )

            // Soft off-centre light so the field reads as depth, not a flat fill.
            val lightCenter = Offset(w * 0.5f, h * 0.38f)
            val lightRadius = minSide * (0.78f + 0.17f * sway)
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(Color.White.copy(alpha = if (darkMode) 0.05f else 0.14f), Color.Transparent),
                    center = lightCenter,
                    radius = lightRadius,
                ),
                radius = lightRadius,
                center = lightCenter,
            )

            bokeh.forEach { dot ->
                val phase = time * 2f * PI.toFloat() / (6.4f + dot.phase) + dot.phase
                val dy = sin(phase) * dot.drift * density
                val scale = 0.94f + 0.12f * ((sin(phase) + 1f) / 2f)
                val radius = dot.size * w * 0.5f * scale
                val c = Offset(dot.x * w, dot.y * h + dy)
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(Color.White.copy(alpha = dot.opacity), Color.White.copy(alpha = dot.opacity * 0.4f), Color.Transparent),
                        center = c,
                        radius = radius,
                    ),
                    radius = radius,
                    center = c,
                )
            }

            val center = Offset(w / 2f, h / 2f)
            // Large diffuse glow behind the logo.
            val glowRadius = 170.dp.toPx() * (0.96f + 0.10f * breath)
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(accent.copy(alpha = if (darkMode) 0.26f else 0.16f), Color.Transparent),
                    center = center,
                    radius = glowRadius,
                ),
                radius = glowRadius,
                center = center,
            )

            // Two quiet rings that keep expanding.
            if (!reduceMotion) {
                for (i in 0 until 2) {
                    val local = time - i * 1.5f
                    if (local < 0f) continue
                    val p = (local % 3.4f) / 3.4f
                    val eased = 1f - (1f - p).pow(3)
                    val baseRadius = 84.dp.toPx()
                    drawCircle(
                        color = accent.copy(alpha = (1f - eased) * if (darkMode) 0.34f else 0.26f),
                        radius = baseRadius * (0.8f + 1.5f * eased),
                        center = center,
                        style = Stroke(width = 1.2.dp.toPx()),
                    )
                }
            }
        }

        val settled = time > SplashTimeline.SETTLE
        val logoBreath = if (settled) 0.995f + 0.025f * breath else 1f
        Box(
            modifier = Modifier
                .align(Alignment.Center)
                .graphicsLayer {
                    scaleX = logoBreath
                    scaleY = logoBreath
                },
        ) {
            WordmarkReveal(width = logoWidth, time = time, darkMode = darkMode, reduceMotion = reduceMotion)
        }

        val dotsAlpha = if (reduceMotion) 1f else ((time - SplashTimeline.DOTS_START) / 0.4f).coerceIn(0f, 1f)
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 96.dp)
                .graphicsLayer { alpha = dotsAlpha },
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            for (i in 0 until 3) {
                val wave = if (reduceMotion) 1f else (sin((time - i * 0.2f) * PI.toFloat() / 0.7f) + 1f) / 2f
                Box(
                    modifier = Modifier
                        .size(7.dp)
                        .graphicsLayer {
                            val s = 0.82f + 0.18f * wave
                            scaleX = s
                            scaleY = s
                            alpha = 0.32f + 0.63f * wave
                        }
                        .background(Color.White, CircleShape),
                )
            }
        }
    }
}

/** Keeps the status and navigation bars on the splash field while it shows. */
@Composable
private fun SplashSystemBars(top: Color, bottom: Color, appColors: com.hayame.app.ui.theme.HayameColors, darkMode: Boolean) {
    val activity = LocalContext.current as? Activity
    val window = activity?.window

    fun apply() {
        if (window == null) return
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = top.toArgb()
        window.navigationBarColor = bottom.toArgb()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.navigationBarDividerColor = bottom.toArgb()
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.isNavigationBarContrastEnforced = false
            window.isStatusBarContrastEnforced = false
        }
        WindowCompat.getInsetsController(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }
    }

    SideEffect { apply() }

    LaunchedEffect(window) {
        while (window != null) {
            apply()
            kotlinx.coroutines.delay(120)
        }
    }

    DisposableEffect(window, appColors, darkMode) {
        apply()
        onDispose {
            if (window != null) {
                WindowCompat.setDecorFitsSystemWindows(window, true)
                window.statusBarColor = appColors.pageBackground.toArgb()
                val navigationBarColor = appColors.cardBackground.toArgb()
                window.navigationBarColor = navigationBarColor
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    window.navigationBarDividerColor = navigationBarColor
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    window.isNavigationBarContrastEnforced = false
                    window.isStatusBarContrastEnforced = false
                }
                WindowCompat.getInsetsController(window, window.decorView).apply {
                    isAppearanceLightStatusBars = !darkMode
                    isAppearanceLightNavigationBars = !darkMode
                }
            }
        }
    }
}

private data class SplashBokeh(
    val x: Float,
    val y: Float,
    val size: Float,
    val opacity: Float,
    val drift: Float,
    val phase: Float,
)

// MARK: Wordmark reveal ---------------------------------------------------------------------------

/**
 * Writes the wordmark with a glowing pen, flashes it solid, then slides the car
 * silhouette in from the left with light streaks. The stroke follows the
 * letters' centreline, authored in the logo bitmap's own 1808x944 space.
 */
@Composable
private fun WordmarkReveal(width: Dp, time: Float, darkMode: Boolean, reduceMotion: Boolean) {
    val height = width * (WordmarkGeometry.DESIGN_HEIGHT / WordmarkGeometry.DESIGN_WIDTH)
    val logo = painterResource(id = R.drawable.splash_wordmark)
    val glowColor = if (darkMode) Color(0xFF73C7FF) else Color.White

    if (reduceMotion) {
        Image(
            painter = logo,
            contentDescription = "Hayame",
            colorFilter = ColorFilter.tint(Color.White),
            contentScale = ContentScale.FillBounds,
            modifier = Modifier.size(width, height),
        )
        return
    }

    val trace = easeInOutCubic(((time - SplashTimeline.TRACE_START) / SplashTimeline.TRACE_DURATION).coerceIn(0f, 1f))
    val fill = easeOutCubic(((time - SplashTimeline.FILL_START) / SplashTimeline.FILL_DURATION).coerceIn(0f, 1f))
    val car = ((time - SplashTimeline.CAR_START) / SplashTimeline.CAR_DURATION).coerceIn(0f, 1f)
    val carEase = easeOutBack(car)
    val flash = max(0f, 1f - abs((time - (SplashTimeline.FILL_START + 0.05f)) / 0.12f))

    val paths = remember { WordmarkGeometry.build() }
    val trimmed = remember { Path() }
    val head = remember(trace) { paths.trim(trace, trimmed) }
    val density = LocalDensity.current
    val widthPx = with(density) { width.toPx() }
    val scale = widthPx / WordmarkGeometry.DESIGN_WIDTH
    val carSplitPx = WordmarkGeometry.CAR_SPLIT_Y * scale

    Box(modifier = Modifier.size(width, height)) {
        // Glow trail behind the pen.
        Canvas(
            modifier = Modifier
                .matchParentSize()
                .blur(9.dp)
                .graphicsLayer { alpha = 1f - fill },
        ) {
            withTransform({ scale(scale, scale, pivot = Offset.Zero) }) {
                drawPath(
                    trimmed,
                    color = glowColor.copy(alpha = 0.75f),
                    style = Stroke(width = WordmarkGeometry.STROKE * 2.2f, cap = StrokeCap.Round, join = StrokeJoin.Round),
                )
            }
        }

        // The pen stroke itself.
        Canvas(
            modifier = Modifier
                .matchParentSize()
                .graphicsLayer { alpha = 1f - fill * 0.85f },
        ) {
            withTransform({ scale(scale, scale, pivot = Offset.Zero) }) {
                drawPath(
                    trimmed,
                    color = Color.White,
                    style = Stroke(width = WordmarkGeometry.STROKE, cap = StrokeCap.Round, join = StrokeJoin.Round),
                )
            }
        }

        // Finished letters, then a soft flash as the stroke turns solid.
        WordmarkPart(logo, keepTop = false, splitPx = carSplitPx, modifier = Modifier.graphicsLayer { alpha = fill })
        if (flash > 0f) {
            WordmarkPart(
                logo,
                keepTop = false,
                splitPx = carSplitPx,
                modifier = Modifier
                    .blur(8.dp)
                    .graphicsLayer { alpha = flash * 0.9f },
            )
        }

        // Light streaks trailing the car.
        if (car > 0f && car < 1f) {
            Canvas(
                modifier = Modifier
                    .matchParentSize()
                    .graphicsLayer {
                        translationX = -widthPx * 0.5f * (1f - carEase)
                        alpha = sin(car * PI.toFloat()) * 0.9f
                    },
            ) {
                for (index in 0 until 3) {
                    val streakWidth = size.width * (0.34f - index * 0.08f)
                    val y = carSplitPx * (0.42f + index * 0.18f)
                    val x = -size.width * 0.22f - index * 10.dp.toPx()
                    drawRoundRect(
                        color = Color.White.copy(alpha = 0.55f),
                        topLeft = Offset(x, y),
                        size = Size(streakWidth, 2.5.dp.toPx()),
                        cornerRadius = androidx.compose.ui.geometry.CornerRadius(2.dp.toPx()),
                    )
                }
            }
        }

        // Car silhouette slides in over the letters.
        WordmarkPart(
            logo,
            keepTop = true,
            splitPx = carSplitPx,
            modifier = Modifier.graphicsLayer {
                translationX = -widthPx * 0.55f * (1f - carEase)
                alpha = (car * 2.2f).coerceIn(0f, 1f)
            },
        )

        // Pen head.
        if (trace > 0f && trace < 1f && head != null) {
            Canvas(modifier = Modifier.matchParentSize()) {
                val c = Offset(head.x * scale, head.y * scale)
                val r = WordmarkGeometry.STROKE * scale
                drawCircle(
                    brush = Brush.radialGradient(listOf(glowColor.copy(alpha = 0.7f), Color.Transparent), center = c, radius = r * 1.8f),
                    radius = r * 1.8f,
                    center = c,
                )
                drawCircle(color = Color.White, radius = r * 0.75f, center = c)
            }
        }
    }
}

/** One half of the bitmap: the car above the split, or the letters below it. */
@Composable
private fun WordmarkPart(
    painter: androidx.compose.ui.graphics.painter.Painter,
    keepTop: Boolean,
    splitPx: Float,
    modifier: Modifier = Modifier,
) {
    Image(
        painter = painter,
        contentDescription = null,
        colorFilter = ColorFilter.tint(Color.White),
        contentScale = ContentScale.FillBounds,
        modifier = Modifier
            .fillMaxSize()
            .then(modifier)
            .drawWithContent {
                if (keepTop) {
                    clipRect(bottom = splitPx) { this@drawWithContent.drawContent() }
                } else {
                    clipRect(top = splitPx) { this@drawWithContent.drawContent() }
                }
            },
    )
}

private fun easeInOutCubic(x: Float): Float = if (x < 0.5f) 4f * x * x * x else 1f - (-2f * x + 2f).pow(3) / 2f
private fun easeOutCubic(x: Float): Float = 1f - (1f - x).pow(3)
private fun easeOutBack(x: Float): Float {
    val c1 = 1.25f
    val c3 = c1 + 1f
    return 1f + c3 * (x - 1f).pow(3) + c1 * (x - 1f).pow(2)
}

/**
 * The wordmark's single-stroke centreline (same as iOS `HayameWordmarkShape`),
 * split into pen strokes in writing order so trimming 0..1 draws left to right.
 */
private object WordmarkGeometry {
    const val DESIGN_WIDTH = 1808f
    const val DESIGN_HEIGHT = 944f
    const val CAR_SPLIT_Y = 344f
    const val STROKE = 47f

    class Strokes(private val parts: List<Path>) {
        private val lengths: List<Float> = parts.map { part ->
            PathMeasure().apply { setPath(part, false) }.length
        }
        private val total = lengths.sum()

        /** Writes the first [fraction] of the wordmark into [out]; returns the pen position. */
        fun trim(fraction: Float, out: Path): Offset? {
            out.reset()
            if (fraction <= 0f) return null
            var remaining = fraction * total
            var head: Offset? = null
            val measure = PathMeasure()
            for ((index, part) in parts.withIndex()) {
                if (remaining <= 0f) break
                val length = lengths[index]
                measure.setPath(part, false)
                if (remaining >= length) {
                    out.addPath(part)
                    head = measure.getPosition(length)
                    remaining -= length
                } else {
                    measure.getSegment(0f, remaining, out, true)
                    head = measure.getPosition(remaining)
                    remaining = 0f
                }
            }
            return head
        }
    }

    fun build(): Strokes {
        val top = 374f
        val bottom = 675f
        val bar = 522f
        val parts = mutableListOf<Path>()
        var p = Path()

        fun start(x: Float, y: Float) {
            if (!p.isEmpty) parts += p
            p = Path()
            p.moveTo(x, y)
        }
        fun line(x: Float, y: Float) = p.lineTo(x, y)
        // Angles in degrees on a y-down canvas; a clockwise arc sweeps positive.
        fun arc(cx: Float, cy: Float, r: Float, from: Float, to: Float, clockwise: Boolean) {
            val sweep = if (clockwise) {
                val d = ((to - from) % 360f + 360f) % 360f
                if (d == 0f) 360f else d
            } else {
                val d = ((from - to) % 360f + 360f) % 360f
                -(if (d == 0f) 360f else d)
            }
            p.arcTo(Rect(cx - r, cy - r, cx + r, cy + r), from, sweep, false)
        }

        // H
        start(64.5f, top); line(64.5f, bottom)
        start(64.5f, bar); line(269f, bar)
        start(269f, top); line(269f, bottom)

        // A, Y and the second A share one continuous stroke.
        start(341f, bottom); line(341f, 477f)
        arc(449f, 477f, 108f, 180f, 360f, clockwise = true)
        line(557f, 565f)
        arc(663.5f, 565f, 106.5f, 180f, 0f, clockwise = false)
        line(770f, 475.5f)
        arc(877.5f, 475.5f, 107.5f, 180f, 360f, clockwise = true)
        line(985f, bottom)

        // Y descender
        start(770f, 565f); line(770f, 883f)

        // A crossbars
        start(341f, bar); line(557f, bar)
        start(770f, bar); line(985f, bar)

        // M: two flat-topped arches
        val mR = 72f
        start(1058f, bottom); line(1058f, 368f + mR)
        arc(1058f + mR, 368f + mR, mR, 180f, 270f, clockwise = true)
        line(1231.5f - mR, 368f)
        arc(1231.5f - mR, 368f + mR, mR, 270f, 360f, clockwise = true)
        line(1231.5f, 657f)
        start(1231.5f, 368f + mR)
        arc(1231.5f + mR, 368f + mR, mR, 180f, 270f, clockwise = true)
        line(1404.5f - mR, 368f)
        arc(1404.5f - mR, 368f + mR, mR, 270f, 360f, clockwise = true)
        line(1404.5f, bottom)

        // E
        val eR = 80f
        start(1741f, 366.5f); line(1472.5f + eR, 366.5f)
        arc(1472.5f + eR, 366.5f + eR, eR, 270f, 180f, clockwise = false)
        line(1472.5f, 673f - eR)
        arc(1472.5f + eR, 673f - eR, eR, 180f, 90f, clockwise = false)
        line(1741f, 673f)
        start(1472.5f, bar); line(1724f, bar)

        if (!p.isEmpty) parts += p
        return Strokes(parts)
    }
}

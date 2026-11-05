package com.hayame.app.ui.components

import android.content.Context
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.SizeTransform
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.VectorConverter
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
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.waitForUpOrCancellation
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.material.icons.outlined.WavingHand
import androidx.compose.animation.core.LinearEasing
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hayame.app.ui.theme.LocalHayameColors
import kotlinx.coroutines.delay
import kotlin.math.roundToInt

// First-use tips. The first time a screen opens, its key controls are lit one
// at a time with a soft spotlight and a short card. Each screen's tour shows
// once; Skip ends it, "Skip all tips" turns tips off, and Settings can replay
// them. Screens mark controls with Modifier.coachTarget and declare a tour
// with CoachTour; the overlay at the activity root draws everything.

data class CoachStep(val targetId: String, val title: String, val message: String)

internal data class CoachTourState(val id: String, val steps: List<CoachStep>, val index: Int) {
    val step: CoachStep get() = steps[index]
    val isLast: Boolean get() = index == steps.lastIndex
}

@Stable
class CoachMarkController(context: Context) {
    private val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    private val seen: MutableSet<String> = prefs.getStringSet(KEY_SEEN, emptySet()).orEmpty().toMutableSet()
    private var welcomeDone = prefs.getBoolean(KEY_WELCOME, false)
    private var pending: CoachTourState? = null

    internal val targets = mutableStateMapOf<String, Rect>()
    internal var rootSize by mutableStateOf(IntSize.Zero)

    var enabled by mutableStateOf(prefs.getBoolean(KEY_ENABLED, true))
        private set
    internal var tour by mutableStateOf<CoachTourState?>(null)
        private set
    internal var showWelcome by mutableStateOf(false)
        private set

    val isShowing: Boolean get() = tour != null || showWelcome

    fun hasSeen(tourId: String): Boolean = tourId in seen

    internal fun register(id: String, bounds: Rect) {
        if (targets[id] != bounds) targets[id] = bounds
    }

    internal fun unregister(id: String) {
        targets.remove(id)
    }

    /** Starts [tourId] if tips are on, it hasn't been seen and some targets are on screen. */
    internal fun request(tourId: String, steps: List<CoachStep>): Boolean {
        if (!enabled || tourId in seen || tour != null || showWelcome) return false
        val visible = steps.filter { isOnScreen(it.targetId) }
        if (visible.isEmpty()) return false
        val state = CoachTourState(tourId, visible, 0)
        if (welcomeDone) {
            tour = state
        } else {
            pending = state
            showWelcome = true
        }
        return true
    }

    /** The screen went away mid-tour: hide it without marking it seen. */
    internal fun cancel(tourId: String) {
        if (tour?.id == tourId) tour = null
        if (pending?.id == tourId) {
            pending = null
            showWelcome = false
        }
    }

    fun next() {
        val current = tour ?: return
        var index = current.index + 1
        while (index < current.steps.size && targets[current.steps[index].targetId] == null) index++
        if (index >= current.steps.size) finish(current.id) else tour = current.copy(index = index)
    }

    fun skipTour() {
        tour?.let { finish(it.id) }
    }

    fun acceptWelcome() {
        markWelcomeDone()
        showWelcome = false
        tour = pending
        pending = null
    }

    /** Back on the welcome card: no tour this time, tips stay on for other screens. */
    fun dismissWelcome() {
        markWelcomeDone()
        pending?.let { markSeen(it.id) }
        pending = null
        showWelcome = false
    }

    fun skipAll() {
        markWelcomeDone()
        pending = null
        showWelcome = false
        tour = null
        updateEnabled(false)
    }

    fun updateEnabled(value: Boolean) {
        enabled = value
        prefs.edit().putBoolean(KEY_ENABLED, value).apply()
        if (!value) {
            tour = null
            pending = null
            showWelcome = false
        }
    }

    /** Every tour shows again, starting with the welcome card. */
    fun replayAll() {
        seen.clear()
        welcomeDone = false
        prefs.edit().putStringSet(KEY_SEEN, emptySet()).putBoolean(KEY_WELCOME, false).putBoolean(KEY_ENABLED, true).apply()
        enabled = true
    }

    private fun finish(tourId: String) {
        markSeen(tourId)
        tour = null
    }

    private fun markSeen(tourId: String) {
        seen += tourId
        prefs.edit().putStringSet(KEY_SEEN, seen.toSet()).apply()
    }

    private fun markWelcomeDone() {
        welcomeDone = true
        prefs.edit().putBoolean(KEY_WELCOME, true).apply()
    }

    private fun isOnScreen(targetId: String): Boolean {
        val bounds = targets[targetId] ?: return false
        if (bounds.width <= 1f || bounds.height <= 1f) return false
        if (rootSize == IntSize.Zero) return true
        val screen = Rect(0f, 0f, rootSize.width.toFloat(), rootSize.height.toFloat())
        val visible = bounds.intersect(screen)
        if (visible.width <= 0f || visible.height <= 0f) return false
        return visible.width * visible.height >= 0.6f * bounds.width * bounds.height
    }

    companion object {
        private const val PREFS = "hayame_tips"
        private const val KEY_ENABLED = "enabled"
        private const val KEY_SEEN = "seen"
        private const val KEY_WELCOME = "welcome_done"

        /** Used by the debug launch extra `hayame_reset_tips`. */
        fun reset(context: Context) {
            context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply()
        }
    }
}

val LocalCoachMarks = staticCompositionLocalOf<CoachMarkController?> { null }

/** Marks this element as something a tour can point at. */
fun Modifier.coachTarget(id: String): Modifier = composed {
    val controller = LocalCoachMarks.current
    if (controller == null) {
        Modifier
    } else {
        DisposableEffect(controller, id) {
            onDispose { controller.unregister(id) }
        }
        Modifier.onGloballyPositioned { coordinates ->
            if (coordinates.isAttached) controller.register(id, coordinates.boundsInRoot())
        }
    }
}

/**
 * Declares the tour for the screen it sits in. It asks to start once the
 * screen has settled and stops if the screen goes away.
 */
@Composable
fun CoachTour(id: String, steps: List<CoachStep>, delayMillis: Long = 800L) {
    val controller = LocalCoachMarks.current ?: return
    if (!controller.enabled || controller.hasSeen(id)) return
    LaunchedEffect(controller, id) {
        delay(delayMillis)
        // Targets may still be loading; try a few times before giving up for now.
        repeat(6) {
            if (controller.hasSeen(id) || controller.request(id, steps)) return@LaunchedEffect
            delay(700)
        }
    }
    DisposableEffect(controller, id) {
        onDispose { controller.cancel(id) }
    }
}

// MARK: Overlay -----------------------------------------------------------------------------------

/** Draw once at the activity root, above the app content. */
@Composable
fun CoachMarkOverlay(controller: CoachMarkController, modifier: Modifier = Modifier) {
    val tour = controller.tour
    val showWelcome = controller.showWelcome

    Box(
        modifier = modifier
            .fillMaxSize()
            .onSizeChanged { controller.rootSize = it },
    ) {
        androidx.compose.animation.AnimatedVisibility(
            visible = showWelcome,
            enter = fadeIn(tween(240)),
            exit = fadeOut(tween(200)),
        ) {
            CoachWelcome(controller)
        }

        // Keeps the last tour drawn while the overlay fades out.
        val lastTour = remember { Remembered<CoachTourState?>(null) }
        if (tour != null) lastTour.value = tour
        androidx.compose.animation.AnimatedVisibility(
            visible = tour != null,
            enter = fadeIn(tween(260)),
            exit = fadeOut(tween(220)),
        ) {
            lastTour.value?.let { CoachSpotlight(controller, it) }
        }
    }

    if (tour != null || showWelcome) {
        BackHandler {
            if (showWelcome) controller.dismissWelcome() else controller.skipTour()
        }
    }
}

/** Swallows every touch so nothing underneath reacts; a full tap calls [onTap]. */
private fun Modifier.blockTouches(onTap: () -> Unit = {}): Modifier = composed {
    val latest by rememberUpdatedState(onTap)
    pointerInput(Unit) {
        awaitEachGesture {
            val down = awaitFirstDown(requireUnconsumed = true)
            down.consume()
            val up = waitForUpOrCancellation()
            if (up != null) {
                up.consume()
                latest()
            }
        }
    }
}

/** Holds the last value seen without making composition write to state. */
private class Remembered<T>(var value: T)

@Composable
private fun CoachSpotlight(controller: CoachMarkController, tour: CoachTourState) {
    val colors = LocalHayameColors.current
    val density = LocalDensity.current
    val haptics = LocalHapticFeedback.current
    val root = controller.rootSize

    val lastBounds = remember { Remembered(Rect.Zero) }
    val liveBounds = controller.targets[tour.step.targetId]
    if (liveBounds != null) lastBounds.value = liveBounds
    val padding = with(density) { 6.dp.toPx() }
    val edge = with(density) { 6.dp.toPx() }
    // Full-width controls keep their ring on screen.
    val cutout = lastBounds.value.inflate(padding).let { hole ->
        if (root == IntSize.Zero) {
            hole
        } else {
            Rect(
                left = hole.left.coerceAtLeast(edge),
                top = hole.top.coerceAtLeast(edge),
                right = hole.right.coerceAtMost(root.width - edge),
                bottom = hole.bottom.coerceAtMost(root.height - edge),
            )
        }
    }

    // The hole starts wide and closes in on the first target, then glides between targets.
    val animatedCutout = remember {
        Animatable(cutout.inflate(with(density) { 90.dp.toPx() }), Rect.VectorConverter)
    }
    LaunchedEffect(cutout) {
        animatedCutout.animateTo(cutout, spring(dampingRatio = 0.82f, stiffness = Spring.StiffnessMediumLow))
    }

    val pulse by rememberInfiniteTransition(label = "coach-pulse").animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1300, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "coach-ring",
    )

    val advance: () -> Unit = {
        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
        controller.next()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .blockTouches(onTap = advance),
    ) {
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer { compositingStrategy = CompositingStrategy.Offscreen },
        ) {
            drawRect(Color.Black.copy(alpha = 0.58f))
            val hole = animatedCutout.value
            val radius = CornerRadius(16.dp.toPx())
            drawRoundRect(
                color = Color.Black,
                topLeft = hole.topLeft,
                size = hole.size,
                cornerRadius = radius,
                blendMode = BlendMode.Clear,
            )
            // Soft ring that breathes outward around the lit control.
            val grow = 4.dp.toPx() * pulse
            drawRoundRect(
                color = colors.brandBlue.copy(alpha = 0.95f - 0.55f * pulse),
                topLeft = Offset(hole.left - grow, hole.top - grow),
                size = Size(hole.width + grow * 2f, hole.height + grow * 2f),
                cornerRadius = CornerRadius(radius.x + grow),
                style = Stroke(width = 2.dp.toPx()),
            )
        }

        CoachTipCard(
            controller = controller,
            tour = tour,
            target = cutout,
            root = root,
            onNext = advance,
        )
    }
}

@Composable
private fun CoachTipCard(
    controller: CoachMarkController,
    tour: CoachTourState,
    target: Rect,
    root: IntSize,
    onNext: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val density = LocalDensity.current
    val insets = WindowInsets.safeDrawing
    val topInset = insets.getTop(density).toFloat()
    val bottomInset = insets.getBottom(density).toFloat()
    val margin = with(density) { 16.dp.toPx() }
    val gap = with(density) { 14.dp.toPx() }
    val cardWidthPx = minOf(with(density) { 340.dp.toPx() }, root.width - margin * 2f).coerceAtLeast(0f)
    val cardWidth = with(density) { cardWidthPx.toDp() }

    var cardSize by remember { mutableStateOf(IntSize.Zero) }
    val placement = remember(target, cardSize, root, topInset, bottomInset) {
        val below = target.bottom + gap
        val fitsBelow = below + cardSize.height <= root.height - bottomInset - margin
        val y = if (fitsBelow) {
            below
        } else {
            (target.top - gap - cardSize.height).coerceAtLeast(topInset + margin)
        }
        val maxX = (root.width - margin - cardSize.width).coerceAtLeast(margin)
        val x = (target.center.x - cardSize.width / 2f).coerceIn(margin, maxX)
        IntOffset(x.roundToInt(), y.roundToInt())
    }

    val offset = remember { Animatable(IntOffset.Zero, IntOffset.VectorConverter) }
    var placed by remember { mutableStateOf(false) }
    LaunchedEffect(placement, cardSize) {
        if (cardSize == IntSize.Zero) return@LaunchedEffect
        if (!placed) {
            offset.snapTo(placement)
            placed = true
        } else {
            offset.animateTo(placement, spring(dampingRatio = 0.86f, stiffness = Spring.StiffnessMediumLow))
        }
    }
    val appear by animateFloatAsState(if (placed) 1f else 0f, tween(260), label = "coach-card")

    Column(
        modifier = Modifier
            .offset { offset.value }
            .width(cardWidth)
            .onSizeChanged { cardSize = it }
            .graphicsLayer {
                alpha = appear
                translationY = (1f - appear) * 12.dp.toPx()
            }
            .shadow(18.dp, RoundedCornerShape(20.dp), clip = false)
            .clip(RoundedCornerShape(20.dp))
            .background(colors.cardBackground)
            .border(1.dp, colors.border, RoundedCornerShape(20.dp))
            .blockTouches()
            .padding(16.dp),
    ) {
        AnimatedContent(
            targetState = tour.index,
            transitionSpec = {
                (fadeIn(tween(220, delayMillis = 60)) + slideInVertically(tween(260)) { it / 6 })
                    .togetherWith(fadeOut(tween(120)))
                    .using(SizeTransform(clip = false))
            },
            label = "coach-step",
        ) { index ->
            val step = tour.steps[index]
            Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                if (tour.steps.size > 1) {
                    Text(
                        "${index + 1} of ${tour.steps.size}",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = colors.brandBlue,
                    )
                }
                Text(step.title, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                Text(step.message, fontSize = 14.sp, color = colors.mutedText, lineHeight = 20.sp)
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                "Skip",
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.SemiBold,
                color = colors.mutedText,
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .pointerInput(Unit) {
                        awaitEachGesture {
                            awaitFirstDown().consume()
                            val up = waitForUpOrCancellation()
                            if (up != null) {
                                up.consume()
                                controller.skipTour()
                            }
                        }
                    }
                    .padding(horizontal = 6.dp, vertical = 8.dp),
            )
            Spacer(modifier = Modifier.weight(1f))
            if (tour.steps.size > 1) {
                Row(horizontalArrangement = Arrangement.spacedBy(5.dp), verticalAlignment = Alignment.CenterVertically) {
                    tour.steps.indices.forEach { index ->
                        val active = index == tour.index
                        val dotWidth by animateFloatAsState(if (active) 16f else 6f, spring(dampingRatio = 0.7f), label = "coach-dot")
                        Box(
                            modifier = Modifier
                                .size(width = dotWidth.dp, height = 6.dp)
                                .background(if (active) colors.brandBlue else colors.controlStroke, CircleShape),
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.weight(1f))
            Surface(onClick = onNext, shape = CircleShape, color = colors.brandBlue) {
                AnimatedContent(
                    targetState = tour.isLast,
                    transitionSpec = { fadeIn(tween(180)).togetherWith(fadeOut(tween(120))) },
                    label = "coach-next",
                ) { last ->
                    Text(
                        if (last) "Got it" else "Next",
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        modifier = Modifier.padding(horizontal = 18.dp, vertical = 9.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun CoachWelcome(controller: CoachMarkController) {
    val colors = LocalHayameColors.current
    val context = LocalContext.current
    val reduceMotion = remember {
        runCatching {
            android.provider.Settings.Global.getFloat(
                context.contentResolver,
                android.provider.Settings.Global.ANIMATOR_DURATION_SCALE,
                1f,
            ) == 0f
        }.getOrDefault(false)
    }
    var shown by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { shown = true }

    // A friendly wave: swing about the wrist for ~1.1 s, rest ~1.4 s, repeat.
    val wave = remember { Animatable(0f) }
    LaunchedEffect(reduceMotion) {
        if (reduceMotion) return@LaunchedEffect
        delay(300)
        while (true) {
            wave.snapTo(0f)
            wave.animateTo(
                targetValue = 1f,
                // Linear clock; each beat eases on its own in waveRotation.
                animationSpec = tween(WAVE_SWING_MS, easing = LinearEasing),
            )
            delay(WAVE_REST_MS)
        }
    }
    val pulse by rememberInfiniteTransition(label = "coach-welcome").animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1400, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "coach-welcome-pulse",
    )

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.58f))
            .blockTouches(),
        contentAlignment = Alignment.Center,
    ) {
        val cardWidth = minOf(340.dp, maxWidth - 32.dp)
        androidx.compose.animation.AnimatedVisibility(
            visible = shown,
            enter = fadeIn(tween(240)) + scaleIn(initialScale = 0.9f, animationSpec = spring(dampingRatio = 0.7f, stiffness = Spring.StiffnessMediumLow)),
            exit = fadeOut(tween(160)) + scaleOut(targetScale = 0.96f),
        ) {
            Column(
                modifier = Modifier
                    .width(cardWidth)
                    .shadow(24.dp, RoundedCornerShape(26.dp), clip = false)
                    .clip(RoundedCornerShape(26.dp))
                    .background(colors.cardBackground)
                    .border(1.dp, colors.border, RoundedCornerShape(26.dp))
                    .padding(horizontal = 22.dp, vertical = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.size(84.dp)) {
                    Box(
                        modifier = Modifier
                            .size(84.dp)
                            .graphicsLayer {
                                val s = 0.86f + 0.14f * pulse
                                scaleX = s
                                scaleY = s
                                alpha = 1f - 0.5f * pulse
                            }
                            .background(colors.brandBlue.copy(alpha = 0.16f), CircleShape),
                    )
                    Box(
                        modifier = Modifier
                            .size(58.dp)
                            .background(colors.brandBlue, CircleShape),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            Icons.Outlined.WavingHand,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier
                                .size(28.dp)
                                .graphicsLayer {
                                    val progress = wave.value
                                    transformOrigin = TransformOrigin(0.7f, 0.9f)
                                    rotationZ = waveRotation(progress)
                                    val bob = waveBob(progress)
                                    scaleX = bob
                                    scaleY = bob
                                },
                        )
                    }
                }
                Text("Welcome to Hayame", fontSize = 21.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy, textAlign = TextAlign.Center)
                Text(
                    "Want a quick tour? We'll point out the key buttons once on each screen. You can skip anytime.",
                    fontSize = 14.sp,
                    lineHeight = 20.sp,
                    color = colors.mutedText,
                    textAlign = TextAlign.Center,
                )
                Spacer(modifier = Modifier.height(4.dp))
                Surface(
                    onClick = { controller.acceptWelcome() },
                    shape = RoundedCornerShape(16.dp),
                    color = colors.brandBlue,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text("Show me around", style = MaterialTheme.typography.bodyLarge.copy(fontSize = 16.sp), fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }
                Text(
                    "Skip all tips",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.mutedText,
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .pointerInput(Unit) {
                            awaitEachGesture {
                                awaitFirstDown().consume()
                                val up = waitForUpOrCancellation()
                                if (up != null) {
                                    up.consume()
                                    controller.skipAll()
                                }
                            }
                        }
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                )
            }
        }
    }
}

private const val WAVE_SWING_MS = 1100
private const val WAVE_REST_MS = 1400L

/** Keyframed angle across one swing: 0, 18, -8, 16, -6, 12, 0 degrees, eased between beats. */
private fun waveRotation(progress: Float): Float {
    val beats = floatArrayOf(0f, 18f, -8f, 16f, -6f, 12f, 0f)
    if (progress <= 0f || progress >= 1f) return 0f
    val segment = progress * (beats.size - 1)
    val index = segment.toInt().coerceAtMost(beats.size - 2)
    val t = FastOutSlowInEasing.transform(segment - index)
    return beats[index] + (beats[index + 1] - beats[index]) * t
}

/** Rises to 1.06 on the first swing, settles back to 1. */
private fun waveBob(progress: Float): Float {
    val peak = 1f / 6f
    return when {
        progress <= 0f || progress >= 1f -> 1f
        progress < peak -> 1f + 0.06f * FastOutSlowInEasing.transform(progress / peak)
        progress < peak * 3f -> 1.06f - 0.06f * FastOutSlowInEasing.transform((progress - peak) / (peak * 2f))
        else -> 1f
    }
}

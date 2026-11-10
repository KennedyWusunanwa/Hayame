package com.hayame.app.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.calculateEndPadding
import androidx.compose.foundation.layout.calculateStartPadding
import androidx.compose.foundation.layout.displayCutout
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBars
import androidx.compose.foundation.layout.union
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hayame.app.core.network.TermsDto
import com.hayame.app.ui.components.HayameRefreshBox
import com.hayame.app.ui.theme.LocalHayameColors
import com.hayame.app.ui.theme.ManropeFamily
import com.hayame.app.ui.viewmodel.AppViewModel
import com.hayame.app.ui.viewmodel.TermsAcceptState
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

private const val TermsFallbackTitle = "Terms of Service"

/**
 * The agreement every signed-in user accepts, drawn over the whole app (above the nav host)
 * while the server says this user still has to accept the current version. It cannot be
 * dismissed: Back sends the app to the background ([onBack]) and the only other ways out are
 * "Accept & Continue" at the end of the text and a small "Sign out".
 */
@Composable
fun TermsAgreementGate(
    viewModel: AppViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = LocalHayameColors.current
    val terms by viewModel.terms.collectAsState()
    val accept by viewModel.termsAccept.collectAsState()
    val focusManager = LocalFocusManager.current
    val keyboard = LocalSoftwareKeyboardController.current

    BackHandler(onBack = onBack)
    LaunchedEffect(Unit) {
        // Whatever was being typed underneath is out of reach now.
        focusManager.clearFocus(force = true)
        keyboard?.hide()
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(colors.pageBackground)
            // Nothing underneath reacts to touches that land outside the controls.
            .pointerInput(Unit) {},
    ) {
        val document = terms.document
        if (document != null) {
            TermsDocumentLayout(
                document = document,
                edgeToEdge = true,
                accept = accept,
                onAccept = viewModel::acceptTerms,
                onSignOut = viewModel::logout,
            )
        }
    }
}

/**
 * The same agreement, read only: opened from the legal lists and from sign-up. No Accept
 * button; says when the signed-in user accepted, when the server knows.
 */
@Composable
fun TermsScreen(
    viewModel: AppViewModel,
    onBack: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val terms by viewModel.terms.collectAsState()

    LaunchedEffect(Unit) { viewModel.refreshTerms(force = true) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.pageBackground),
    ) {
        val document = terms.document
        if (document != null) {
            TermsDocumentLayout(
                document = document,
                edgeToEdge = false,
                onBack = onBack,
                onRefresh = { viewModel.refreshTerms(force = true) },
                isRefreshing = { terms.isLoading },
            )
        } else {
            Column(modifier = Modifier.fillMaxSize()) {
                TermsHeader(title = TermsFallbackTitle, lastUpdated = null, onBack = onBack)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 24.dp, vertical = 32.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    if (terms.loadFailed && !terms.isLoading) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            Text(
                                "We couldn't load the terms",
                                style = TermsSectionTitleStyle,
                                color = colors.brandNavy,
                                textAlign = TextAlign.Center,
                            )
                            Text(
                                "Check your connection and try again.",
                                style = TermsNoteStyle,
                                color = colors.mutedText,
                                textAlign = TextAlign.Center,
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            TermsOutlinePillButton(text = "Retry") { viewModel.refreshTerms(force = true) }
                        }
                    } else {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(14.dp),
                        ) {
                            CircularProgressIndicator(color = colors.brandBlue, strokeWidth = 3.dp)
                            Text("Loading the terms...", style = TermsNoteStyle, color = colors.mutedText)
                        }
                    }
                }
            }
        }
    }
}

/**
 * Fixed header, the sections scrolling beneath it, a floating "Scroll to Bottom" while the end
 * is out of sight, and the closing buttons after the last paragraph. With [onAccept] it is the
 * agreement to accept; without it, the read-only copy.
 */
@Composable
private fun TermsDocumentLayout(
    document: TermsDto,
    /** True when drawn at the root, where it has to keep clear of the system bars itself. */
    edgeToEdge: Boolean,
    accept: TermsAcceptState = TermsAcceptState(),
    onAccept: (() -> Unit)? = null,
    onSignOut: (() -> Unit)? = null,
    onBack: (() -> Unit)? = null,
    onRefresh: (() -> Unit)? = null,
    isRefreshing: () -> Boolean = { false },
) {
    val layoutDirection = LocalLayoutDirection.current
    val insets = if (edgeToEdge) {
        WindowInsets.systemBars.union(WindowInsets.displayCutout).asPaddingValues()
    } else {
        PaddingValues(0.dp)
    }
    val bottomInset = insets.calculateBottomPadding()
    // A newer version of the text starts from its top.
    val scrollState = key(document.version) { rememberScrollState() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(
                start = insets.calculateStartPadding(layoutDirection),
                top = insets.calculateTopPadding(),
                end = insets.calculateEndPadding(layoutDirection),
            ),
    ) {
        TermsHeader(
            title = document.title?.trim()?.takeIf { it.isNotEmpty() } ?: TermsFallbackTitle,
            lastUpdated = document.lastUpdated?.trim()?.takeIf { it.isNotEmpty() },
            onBack = onBack,
            onSignOut = onSignOut,
            signOutEnabled = !accept.inProgress,
        )

        if (onRefresh != null) {
            HayameRefreshBox(
                onRefresh = onRefresh,
                modifier = Modifier.fillMaxWidth().weight(1f),
                isBusy = isRefreshing,
            ) {
                TermsScrollArea(document, scrollState, bottomInset, accept, onAccept)
            }
        } else {
            Box(modifier = Modifier.fillMaxWidth().weight(1f)) {
                TermsScrollArea(document, scrollState, bottomInset, accept, onAccept)
            }
        }
    }
}

/** The scrolling text with the floating "Scroll to Bottom" over a soft fade of it. */
@Composable
private fun TermsScrollArea(
    document: TermsDto,
    scrollState: ScrollState,
    bottomInset: Dp,
    accept: TermsAcceptState,
    onAccept: (() -> Unit)?,
) {
    val colors = LocalHayameColors.current
    val scope = rememberCoroutineScope()
    // Hide the floating button once the closing buttons start to come into view.
    val endZonePx = with(LocalDensity.current) { 132.dp.toPx() }
    val awayFromEnd by remember(scrollState, endZonePx) {
        derivedStateOf {
            scrollState.maxValue != Int.MAX_VALUE && scrollState.maxValue - scrollState.value > endZonePx
        }
    }
    // A failed Accept adds a line above the button: keep the closing buttons in view.
    LaunchedEffect(accept.error) {
        if (accept.error != null) {
            withFrameNanos { }
            scrollState.animateScrollTo(scrollState.maxValue)
        }
    }
    Box(modifier = Modifier.fillMaxSize()) {
        TermsBody(
            document = document,
            scrollState = scrollState,
            bottomInset = bottomInset,
            accept = accept,
            onAccept = onAccept,
            onScrollToTop = { scope.launch { scrollState.animateScrollTo(0) } },
        )

        AnimatedVisibility(
            visible = awayFromEnd,
            modifier = Modifier.align(Alignment.BottomCenter),
            enter = fadeIn(tween(180)),
            exit = fadeOut(tween(160)),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            0f to colors.pageBackground.copy(alpha = 0f),
                            0.7f to colors.pageBackground.copy(alpha = 0.94f),
                            1f to colors.pageBackground,
                        ),
                    )
                    .padding(top = 44.dp, bottom = bottomInset + 18.dp),
                contentAlignment = Alignment.Center,
            ) {
                TermsOutlinePillButton(
                    text = "Scroll to Bottom",
                    containerColor = colors.cardBackground,
                ) {
                    scope.launch { scrollState.animateScrollTo(scrollState.maxValue) }
                }
            }
        }
    }
}

@Composable
private fun TermsHeader(
    title: String,
    lastUpdated: String?,
    onBack: (() -> Unit)? = null,
    onSignOut: (() -> Unit)? = null,
    signOutEnabled: Boolean = true,
) {
    val colors = LocalHayameColors.current
    Column(modifier = Modifier.fillMaxWidth()) {
        if (onBack != null) {
            IconButton(
                onClick = onBack,
                modifier = Modifier.padding(start = 12.dp, top = 4.dp),
            ) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = colors.brandNavy)
            }
        }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 24.dp, end = 12.dp)
                .heightIn(min = if (onSignOut != null) 48.dp else 28.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                "AGREEMENT",
                style = TextStyle(
                    fontFamily = ManropeFamily,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.2.sp,
                ),
                color = colors.mutedText,
                modifier = Modifier.weight(1f),
            )
            if (onSignOut != null) {
                TextButton(onClick = onSignOut, enabled = signOutEnabled) {
                    Text(
                        "Sign out",
                        style = TermsNoteStyle,
                        color = colors.mutedText.copy(alpha = if (signOutEnabled) 1f else 0.5f),
                    )
                }
            }
        }
        Text(
            title,
            style = TextStyle(
                fontFamily = ManropeFamily,
                fontSize = 28.sp,
                lineHeight = 34.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = (-0.3).sp,
            ),
            color = colors.brandNavy,
            modifier = Modifier
                .padding(horizontal = 24.dp)
                .semantics { heading() },
        )
        if (lastUpdated != null) {
            Text(
                "Last updated on $lastUpdated",
                style = TermsNoteStyle,
                color = colors.mutedText,
                modifier = Modifier.padding(start = 24.dp, end = 24.dp, top = 6.dp),
            )
        }
        Spacer(modifier = Modifier.height(18.dp))
        HorizontalDivider(thickness = 1.dp, color = colors.border)
    }
}

@Composable
private fun TermsBody(
    document: TermsDto,
    scrollState: ScrollState,
    bottomInset: Dp,
    accept: TermsAcceptState,
    onAccept: (() -> Unit)?,
    onScrollToTop: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val acceptedNote = remember(document.accepted, document.acceptedAt) {
        if (document.accepted == true) termsAcceptedNote(document.acceptedAt) else null
    }
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(start = 24.dp, end = 24.dp, top = 24.dp, bottom = bottomInset + 28.dp),
    ) {
        if (onAccept != null && accept.updatedWhileReading) {
            Text(
                "We have updated these terms. Please read the latest version.",
                style = TermsNoteStyle.copy(fontWeight = FontWeight.SemiBold),
                color = colors.brandBlue,
                modifier = Modifier.padding(bottom = 22.dp),
            )
        }
        if (onAccept == null && acceptedNote != null) {
            Row(
                modifier = Modifier.padding(bottom = 22.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    Icons.Outlined.CheckCircle,
                    contentDescription = null,
                    tint = colors.success,
                    modifier = Modifier.size(18.dp),
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(acceptedNote, style = TermsNoteStyle, color = colors.mutedText)
            }
        }

        document.sections.orEmpty().forEachIndexed { index, section ->
            if (index > 0) Spacer(modifier = Modifier.height(30.dp))
            val heading = section.title.orEmpty()
            if (heading.isNotEmpty()) {
                Text(
                    heading,
                    style = TermsSectionTitleStyle,
                    color = colors.brandNavy,
                    modifier = Modifier.semantics { heading() },
                )
            }
            section.paragraphs.orEmpty().forEachIndexed { paragraphIndex, paragraph ->
                Spacer(modifier = Modifier.height(if (paragraphIndex == 0 && heading.isEmpty()) 0.dp else 12.dp))
                Text(
                    paragraph,
                    style = TermsParagraphStyle,
                    color = colors.brandNavy.copy(alpha = 0.84f),
                )
            }
        }

        Spacer(modifier = Modifier.height(40.dp))
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            if (onAccept != null) {
                if (accept.error != null) {
                    Text(
                        accept.error,
                        style = TermsNoteStyle,
                        color = colors.danger,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(bottom = 14.dp),
                    )
                }
                Button(
                    onClick = onAccept,
                    enabled = !accept.inProgress,
                    modifier = Modifier
                        .widthIn(min = 232.dp)
                        .heightIn(min = 52.dp),
                    shape = RoundedCornerShape(999.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colors.brandBlue,
                        contentColor = Color.White,
                        disabledContainerColor = colors.brandBlue.copy(alpha = 0.6f),
                        disabledContentColor = Color.White,
                    ),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp, pressedElevation = 0.dp),
                    contentPadding = PaddingValues(horizontal = 28.dp, vertical = 12.dp),
                ) {
                    if (accept.inProgress) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(18.dp),
                            color = Color.White,
                            strokeWidth = 2.dp,
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                    }
                    Text(
                        if (accept.inProgress) "Saving..." else "Accept & Continue",
                        style = TermsButtonStyle,
                        color = Color.White,
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))
            }
            TermsOutlinePillButton(text = "Scroll to Top", onClick = onScrollToTop)
        }
    }
}

/** Flat outline pill, the secondary button of this screen. */
@Composable
private fun TermsOutlinePillButton(
    text: String,
    containerColor: Color = Color.Transparent,
    onClick: () -> Unit,
) {
    val colors = LocalHayameColors.current
    OutlinedButton(
        onClick = onClick,
        modifier = Modifier.heightIn(min = 46.dp),
        shape = RoundedCornerShape(999.dp),
        border = BorderStroke(1.dp, colors.brandNavy.copy(alpha = 0.28f)),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = containerColor,
            contentColor = colors.brandNavy,
        ),
        contentPadding = PaddingValues(horizontal = 24.dp, vertical = 10.dp),
    ) {
        Text(text, style = TermsButtonStyle.copy(fontSize = 14.sp), color = colors.brandNavy)
    }
}

private val TermsSectionTitleStyle = TextStyle(
    fontFamily = ManropeFamily,
    fontSize = 17.sp,
    lineHeight = 25.sp,
    fontWeight = FontWeight.SemiBold,
)

private val TermsParagraphStyle = TextStyle(
    fontFamily = ManropeFamily,
    fontSize = 15.sp,
    lineHeight = 25.sp,
    fontWeight = FontWeight.Normal,
)

private val TermsNoteStyle = TextStyle(
    fontFamily = ManropeFamily,
    fontSize = 13.sp,
    lineHeight = 19.sp,
    fontWeight = FontWeight.Medium,
)

private val TermsButtonStyle = TextStyle(
    fontFamily = ManropeFamily,
    fontSize = 15.sp,
    fontWeight = FontWeight.SemiBold,
)

/** "You accepted these terms on 10 November 2026", or without the date when it cannot be read. */
private fun termsAcceptedNote(acceptedAt: String?): String {
    val raw = acceptedAt?.trim().orEmpty()
    val date = runCatching { Instant.parse(raw).atZone(ZoneId.systemDefault()).toLocalDate() }.getOrNull()
        ?: runCatching { OffsetDateTime.parse(raw).atZoneSameInstant(ZoneId.systemDefault()).toLocalDate() }.getOrNull()
        ?: runCatching { LocalDate.parse(raw.take(10)) }.getOrNull()
    return if (date != null) {
        "You accepted these terms on ${date.format(DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.UK))}"
    } else {
        "You have accepted these terms."
    }
}

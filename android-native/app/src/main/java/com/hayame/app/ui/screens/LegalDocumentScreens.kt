package com.hayame.app.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.animateScrollBy
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.HelpOutline
import androidx.compose.material.icons.outlined.BarChart
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.CloudOff
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material.icons.outlined.MailOutline
import androidx.compose.material.icons.outlined.Public
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.SearchOff
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.listSaver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hayame.app.core.analytics.AnalyticsService
import com.hayame.app.core.network.LegalDocumentDto
import com.hayame.app.core.network.LegalTableDto
import com.hayame.app.ui.components.HayameRefreshBox
import com.hayame.app.ui.theme.LocalHayameColors
import com.hayame.app.ui.theme.ManropeFamily
import com.hayame.app.ui.viewmodel.AppViewModel
import com.hayame.app.ui.viewmodel.LegalDocumentUiState
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** The three policy documents the server writes as questions and answers. */
enum class LegalDocumentKind(
    val slug: String,
    /** Shown in the bar and in the lists of documents. */
    val shortTitle: String,
    val listSubtitle: String,
) {
    PROTECTION("protection", "Protection", "What's covered on every trip"),
    CANCELLATION("cancellation", "Cancellation policy", "Refund tiers and timing"),
    PRIVACY("privacy", "Privacy", "How we handle your data"),
}

/**
 * One policy document as a guide: summary, key points, the refund table when there is one,
 * then every question grouped under headings, searchable, each answer opening in place.
 * The text comes from the server (one copy for web and both apps); the copy saved on this
 * device shows first and when offline.
 */
@Composable
fun LegalDocumentScreen(
    viewModel: AppViewModel,
    kind: LegalDocumentKind,
    onBack: () -> Unit,
    onOpenContact: () -> Unit,
    onOpenDocument: (LegalDocumentKind) -> Unit,
    onOpenTerms: () -> Unit,
    /** Privacy only, signed in: opens the "Delete account" screen. */
    onOpenDeleteAccount: (() -> Unit)? = null,
) {
    val colors = LocalHayameColors.current
    val documents by viewModel.legalDocuments.collectAsState()
    val state = documents[kind.slug] ?: LegalDocumentUiState(isLoading = true)
    val listState = rememberLazyListState()
    val document = state.document
    // The page's own title has scrolled away: the bar takes over naming the page.
    val heroScrolledAway by remember(listState) { derivedStateOf { listState.firstVisibleItemIndex > 0 } }

    LaunchedEffect(kind) { viewModel.loadLegalDocument(kind.slug) }

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = {
            LegalTopBar(
                title = kind.shortTitle,
                showTitle = document == null || heroScrolledAway,
                onBack = onBack,
            )
        },
    ) { inner ->
        HayameRefreshBox(
            onRefresh = { viewModel.loadLegalDocument(kind.slug) },
            // The page runs on under the gesture bar; only the keyboard pushes it up.
            modifier = Modifier
                .fillMaxSize()
                .padding(top = inner.calculateTopPadding())
                .consumeWindowInsets(PaddingValues(top = inner.calculateTopPadding()))
                .imePadding(),
            isBusy = { documents[kind.slug]?.isLoading == true },
        ) {
            if (document != null) {
                LegalDocumentList(
                    kind = kind,
                    document = document,
                    showingSavedCopy = state.showingSavedCopy,
                    listState = listState,
                    bottomInset = inner.calculateBottomPadding(),
                    onOpenContact = onOpenContact,
                    onOpenDocument = onOpenDocument,
                    onOpenTerms = onOpenTerms,
                    onOpenDeleteAccount = onOpenDeleteAccount,
                )
            } else {
                // Scrollable so pulling down to retry works here too.
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 32.dp)
                        .padding(top = 48.dp, bottom = inner.calculateBottomPadding() + 48.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    if (state.loadFailed && !state.isLoading) {
                        LegalLoadError(onRetry = { viewModel.loadLegalDocument(kind.slug) })
                    } else {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(14.dp),
                        ) {
                            CircularProgressIndicator(color = colors.brandBlue, strokeWidth = 3.dp)
                            Text("Loading...", style = LegalNoteStyle, color = colors.mutedText)
                        }
                    }
                }
            }
        }
    }
}

// MARK: Rows -------------------------------------------------------------------------------------

/** Everything the page shows, top to bottom, one entry per list item. */
private sealed interface LegalRow {
    val key: String

    data object Hero : LegalRow { override val key = "hero" }
    data class SectionTitle(override val key: String, val title: String, val note: String?) : LegalRow
    data class Highlight(val number: Int, val title: String, val body: String) : LegalRow {
        override val key = "highlight-$number"
    }
    data class TableEntry(val index: Int, val label: String, val cells: List<Pair<String, String>>) : LegalRow {
        override val key = "table-$index"
    }
    data object PrivacyControls : LegalRow { override val key = "privacy-controls" }
    data object Search : LegalRow { override val key = "search" }
    data class GroupTitle(val group: Int, val title: String, val count: Int) : LegalRow {
        override val key = "group-$group"
    }
    data class Question(val id: String, val question: String, val paragraphs: List<String>) : LegalRow {
        override val key = "question-$id"
    }
    data object NoMatches : LegalRow { override val key = "no-matches" }
    data object Contact : LegalRow { override val key = "contact" }
    data object Related : LegalRow { override val key = "related" }
}

private data class LegalGroupMatches(val index: Int, val title: String, val questions: List<LegalRow.Question>)

private val StringSetSaver = listSaver<Set<String>, String>(save = { it.toList() }, restore = { it.toSet() })

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun LegalDocumentList(
    kind: LegalDocumentKind,
    document: LegalDocumentDto,
    showingSavedCopy: Boolean,
    listState: LazyListState,
    bottomInset: Dp,
    onOpenContact: () -> Unit,
    onOpenDocument: (LegalDocumentKind) -> Unit,
    onOpenTerms: () -> Unit,
    onOpenDeleteAccount: (() -> Unit)?,
) {
    val colors = LocalHayameColors.current
    val scope = rememberCoroutineScope()
    val keyboard = LocalSoftwareKeyboardController.current
    val density = LocalDensity.current
    val revealMarginPx = with(density) { 12.dp.roundToPx() }
    val bottomInsetPx = with(density) { bottomInset.roundToPx() }

    var query by rememberSaveable { mutableStateOf("") }
    // The list is filtered a moment after the last keystroke, so typing stays smooth on slow phones.
    var appliedQuery by rememberSaveable { mutableStateOf("") }
    LaunchedEffect(query) {
        if (query.isNotBlank() && query != appliedQuery) delay(160)
        appliedQuery = query
    }
    val needle = appliedQuery.trim()
    val searching = needle.isNotEmpty()
    // Answers the reader opened, and (while searching, when every match shows open) the ones they closed.
    var opened by rememberSaveable(stateSaver = StringSetSaver) { mutableStateOf(emptySet<String>()) }
    var closedWhileSearching by rememberSaveable(needle, stateSaver = StringSetSaver) { mutableStateOf(emptySet<String>()) }

    val allGroups = remember(document) {
        document.groups.orEmpty().mapIndexed { groupIndex, group ->
            LegalGroupMatches(
                index = groupIndex,
                title = group.title?.trim().orEmpty(),
                questions = group.questions.orEmpty().mapIndexed { questionIndex, question ->
                    LegalRow.Question(
                        id = "$groupIndex-$questionIndex",
                        question = question.q.orEmpty(),
                        paragraphs = question.a.orEmpty(),
                    )
                },
            )
        }
    }
    val totalQuestions = remember(allGroups) { allGroups.sumOf { it.questions.size } }
    val groups = remember(allGroups, needle) {
        if (needle.isEmpty()) {
            allGroups
        } else {
            allGroups.mapNotNull { group ->
                val matches = group.questions.filter { question ->
                    question.question.contains(needle, ignoreCase = true) ||
                        question.paragraphs.any { it.contains(needle, ignoreCase = true) }
                }
                if (matches.isEmpty()) null else group.copy(questions = matches)
            }
        }
    }
    val shownQuestions = groups.sumOf { it.questions.size }

    val rows = remember(document, groups, kind) {
        buildList {
            add(LegalRow.Hero)
            val highlights = document.highlights.orEmpty()
                .filter { !it.title.isNullOrBlank() || !it.body.isNullOrBlank() }
            if (highlights.isNotEmpty()) {
                add(LegalRow.SectionTitle("key-points", "Key points", null))
                highlights.forEachIndexed { index, highlight ->
                    add(LegalRow.Highlight(index + 1, highlight.title?.trim().orEmpty(), highlight.body?.trim().orEmpty()))
                }
            }
            val tableRows = document.table.entries()
            if (tableRows.isNotEmpty()) {
                add(
                    LegalRow.SectionTitle(
                        key = "table",
                        title = document.table?.title?.trim()?.takeIf { it.isNotEmpty() } ?: "At a glance",
                        note = document.table?.caption?.trim()?.takeIf { it.isNotEmpty() },
                    ),
                )
                addAll(tableRows)
            }
            if (kind == LegalDocumentKind.PRIVACY) add(LegalRow.PrivacyControls)
            add(LegalRow.SectionTitle("questions", "Questions and answers", null))
            add(LegalRow.Search)
            if (groups.isEmpty()) {
                add(LegalRow.NoMatches)
            } else {
                groups.forEach { group ->
                    add(LegalRow.GroupTitle(group.index, group.title, group.questions.size))
                    addAll(group.questions)
                }
            }
            add(LegalRow.Contact)
            add(LegalRow.Related)
        }
    }
    val searchIndex = remember(rows) { rows.indexOf(LegalRow.Search) }
    val groupPositions = remember(rows) {
        rows.mapIndexedNotNull { index, row -> if (row is LegalRow.GroupTitle) row.group to index else null }
    }

    // On a short window (landscape) the search area scrolls with the page instead of pinning.
    val pinSearch = LocalConfiguration.current.screenHeightDp >= 520
    var searchHeightPx by remember { mutableIntStateOf(0) }
    val searchPinned by remember(listState, searchIndex, pinSearch) {
        derivedStateOf { pinSearch && listState.firstVisibleItemIndex >= searchIndex }
    }
    // The section being read: the last heading at or above the first row showing under the pinned search.
    val currentGroup by remember(listState, groupPositions, searchIndex) {
        derivedStateOf {
            val covered = if (pinSearch) searchHeightPx else 0
            val first = listState.layoutInfo.visibleItemsInfo
                .firstOrNull { it.index > searchIndex && it.offset + it.size > covered + 1 }
                ?: return@derivedStateOf null
            if (listState.firstVisibleItemIndex < searchIndex) return@derivedStateOf null
            groupPositions.lastOrNull { it.second <= first.index }?.first
        }
    }

    fun isOpen(id: String) = if (searching) id !in closedWhileSearching else id in opened
    val shownIds = remember(groups) { groups.flatMap { group -> group.questions.map { it.id } } }
    val allOpen = shownIds.isNotEmpty() && shownIds.all { isOpen(it) }

    // A new search starts from its first match, with the field still in reach.
    var lastNeedle by remember { mutableStateOf(needle) }
    LaunchedEffect(needle) {
        if (needle == lastNeedle) return@LaunchedEffect
        lastNeedle = needle
        if (needle.isNotEmpty() && searchIndex >= 0) listState.scrollToItem(searchIndex)
    }

    LazyColumn(
        state = listState,
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = bottomInset + 36.dp),
    ) {
        rows.forEach { row ->
            if (row is LegalRow.Search) {
                val searchArea: @Composable () -> Unit = {
                    LegalSearchArea(
                        query = query,
                        onQueryChange = { query = it },
                        pinned = searchPinned,
                        countLine = when {
                            !searching -> if (totalQuestions == 1) "1 question" else "$totalQuestions questions"
                            shownQuestions == 1 -> "1 of $totalQuestions questions matches"
                            else -> "$shownQuestions of $totalQuestions questions match"
                        },
                        allOpen = allOpen,
                        canToggleAll = shownIds.isNotEmpty(),
                        onToggleAll = {
                            if (searching) {
                                closedWhileSearching = if (allOpen) shownIds.toSet() else emptySet()
                            } else {
                                opened = if (allOpen) emptySet() else shownIds.toSet()
                            }
                        },
                        groups = groups,
                        currentGroup = currentGroup,
                        onOpenGroup = { group ->
                            val position = groupPositions.firstOrNull { it.first == group }?.second
                            if (position != null) {
                                keyboard?.hide()
                                scope.launch {
                                    listState.animateScrollToItem(
                                        index = position,
                                        scrollOffset = if (pinSearch) -searchHeightPx else 0,
                                    )
                                }
                            }
                        },
                        modifier = Modifier.onSizeChanged { searchHeightPx = it.height },
                    )
                }
                if (pinSearch) {
                    stickyHeader(key = row.key, contentType = "search") { searchArea() }
                } else {
                    item(key = row.key, contentType = "search") { searchArea() }
                }
            } else {
                item(key = row.key, contentType = row::class) {
                    when (row) {
                        LegalRow.Hero -> LegalHero(
                            document = document,
                            fallbackTitle = kind.shortTitle,
                            totalQuestions = totalQuestions,
                            showingSavedCopy = showingSavedCopy,
                        )
                        is LegalRow.SectionTitle -> LegalSectionTitle(title = row.title, note = row.note)
                        is LegalRow.Highlight -> LegalHighlightCard(row)
                        is LegalRow.TableEntry -> LegalTableCard(row)
                        LegalRow.PrivacyControls -> LegalPrivacyControls(
                            onOpenContact = onOpenContact,
                            onOpenDeleteAccount = onOpenDeleteAccount,
                        )
                        is LegalRow.GroupTitle -> LegalGroupTitle(row)
                        is LegalRow.Question -> LegalQuestionCard(
                            row = row,
                            needle = needle,
                            open = isOpen(row.id),
                            onToggle = {
                                val opening = !isOpen(row.id)
                                if (searching) {
                                    closedWhileSearching =
                                        if (row.id in closedWhileSearching) closedWhileSearching - row.id else closedWhileSearching + row.id
                                } else {
                                    opened = if (row.id in opened) opened - row.id else opened + row.id
                                }
                                if (opening) {
                                    scope.launch {
                                        // Once it has opened, bring an answer that runs off the screen into view.
                                        delay(280)
                                        val item = listState.layoutInfo.visibleItemsInfo.firstOrNull { it.key == row.key }
                                            ?: return@launch
                                        val top = (if (pinSearch) searchHeightPx else 0) + revealMarginPx
                                        val bottom = listState.layoutInfo.viewportEndOffset - bottomInsetPx - revealMarginPx
                                        val hidden = item.offset + item.size - bottom
                                        val room = item.offset - top
                                        if (hidden > 0 && room > 0) {
                                            listState.animateScrollBy(minOf(hidden, room).toFloat())
                                        }
                                    }
                                }
                            },
                        )
                        LegalRow.NoMatches -> LegalNoMatches(needle = needle, onClear = { query = "" })
                        LegalRow.Contact -> LegalContactCard(
                            contact = document.contact?.trim().orEmpty(),
                            onOpenContact = onOpenContact,
                        )
                        LegalRow.Related -> LegalRelatedCard(
                            kind = kind,
                            onOpenDocument = onOpenDocument,
                            onOpenTerms = onOpenTerms,
                        )
                        LegalRow.Search -> Unit
                    }
                }
            }
        }
    }
}

/** One entry per table row: its label (first column) and the other columns as "heading, value". */
private fun LegalTableDto?.entries(): List<LegalRow.TableEntry> {
    val columns = this?.columns.orEmpty()
    return this?.rows.orEmpty().mapIndexedNotNull { index, row ->
        val label = row.firstOrNull()?.trim().orEmpty()
        val cells = row.drop(1).mapIndexedNotNull { cellIndex, value ->
            val text = value.trim()
            if (text.isEmpty()) null else columns.getOrNull(cellIndex + 1)?.trim().orEmpty() to text
        }
        if (label.isEmpty() && cells.isEmpty()) null else LegalRow.TableEntry(index, label, cells)
    }
}

// MARK: Pieces -----------------------------------------------------------------------------------

@Composable
private fun LegalTopBar(title: String, showTitle: Boolean, onBack: () -> Unit) {
    val colors = LocalHayameColors.current
    val titleAlpha by animateFloatAsState(if (showTitle) 1f else 0f, tween(180), label = "legal-bar-title")
    Surface(color = colors.pageBackground) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = colors.brandNavy)
            }
            if (showTitle) {
                Text(
                    title,
                    style = TextStyle(fontFamily = ManropeFamily, fontSize = 18.sp, fontWeight = FontWeight.Bold),
                    color = colors.brandNavy,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier
                        .weight(1f)
                        .padding(start = 4.dp, end = 12.dp)
                        .alpha(titleAlpha),
                )
            }
        }
    }
}

@Composable
private fun LegalHero(
    document: LegalDocumentDto,
    fallbackTitle: String,
    totalQuestions: Int,
    showingSavedCopy: Boolean,
) {
    val colors = LocalHayameColors.current
    val eyebrow = document.eyebrow?.trim().orEmpty()
    val summary = document.summary?.trim().orEmpty()
    val lastUpdated = document.lastUpdated?.trim().orEmpty()
    val meta = listOfNotNull(
        lastUpdated.takeIf { it.isNotEmpty() }?.let { "Last updated on $it" },
        if (totalQuestions == 1) "1 question answered" else "$totalQuestions questions answered",
    ).joinToString("  ·  ")
    Column(modifier = Modifier.padding(start = 20.dp, end = 20.dp, top = 6.dp)) {
        if (eyebrow.isNotEmpty()) {
            Text(
                eyebrow.uppercase(),
                style = TextStyle(
                    fontFamily = ManropeFamily,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.2.sp,
                ),
                color = colors.brandBlue,
            )
            Spacer(modifier = Modifier.height(10.dp))
        }
        Text(
            document.title?.trim()?.takeIf { it.isNotEmpty() } ?: fallbackTitle,
            style = TextStyle(
                fontFamily = ManropeFamily,
                fontSize = 30.sp,
                lineHeight = 36.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = (-0.4).sp,
            ),
            color = colors.brandNavy,
            modifier = Modifier.semantics { heading() },
        )
        if (summary.isNotEmpty()) {
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                summary,
                style = TextStyle(
                    fontFamily = ManropeFamily,
                    fontSize = 15.5.sp,
                    lineHeight = 25.sp,
                    fontWeight = FontWeight.Medium,
                ),
                color = colors.brandNavy.copy(alpha = 0.78f),
            )
        }
        Spacer(modifier = Modifier.height(16.dp))
        Text(meta, style = LegalNoteStyle, color = colors.mutedText)
        if (showingSavedCopy) {
            Spacer(modifier = Modifier.height(14.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(colors.warning.copy(alpha = 0.12f), RoundedCornerShape(12.dp))
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    Icons.Outlined.CloudOff,
                    contentDescription = null,
                    tint = colors.warning,
                    modifier = Modifier.size(18.dp),
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    "You are reading the copy saved on this phone. Pull down to check for a newer one.",
                    style = LegalNoteStyle,
                    color = colors.brandNavy.copy(alpha = 0.86f),
                )
            }
        }
        Spacer(modifier = Modifier.height(22.dp))
        HorizontalDivider(thickness = 1.dp, color = colors.border)
    }
}

@Composable
private fun LegalSectionTitle(title: String, note: String?) {
    val colors = LocalHayameColors.current
    Column(modifier = Modifier.padding(start = 20.dp, end = 20.dp, top = 26.dp, bottom = 4.dp)) {
        Text(
            title,
            style = LegalSectionTitleStyle,
            color = colors.brandNavy,
            modifier = Modifier.semantics { heading() },
        )
        if (note != null) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(note, style = LegalNoteStyle.copy(fontSize = 13.5.sp, lineHeight = 21.sp), color = colors.mutedText)
        }
    }
}

@Composable
private fun LegalCard(
    modifier: Modifier = Modifier,
    borderColor: Color = LocalHayameColors.current.border,
    content: @Composable () -> Unit,
) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = LocalHayameColors.current.cardBackground,
        border = BorderStroke(1.dp, borderColor),
        modifier = modifier.fillMaxWidth(),
        content = content,
    )
}

@Composable
private fun LegalHighlightCard(row: LegalRow.Highlight) {
    val colors = LocalHayameColors.current
    LegalCard(modifier = Modifier.padding(start = 20.dp, end = 20.dp, top = 10.dp)) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.Top) {
            Box(
                modifier = Modifier
                    .size(30.dp)
                    .background(colors.brandLight, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    row.number.toString(),
                    style = TextStyle(fontFamily = ManropeFamily, fontSize = 14.sp, fontWeight = FontWeight.ExtraBold),
                    color = colors.brandBlue,
                )
            }
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                if (row.title.isNotEmpty()) {
                    Text(row.title, style = LegalQuestionStyle.copy(fontWeight = FontWeight.Bold), color = colors.brandNavy)
                }
                if (row.body.isNotEmpty()) {
                    if (row.title.isNotEmpty()) Spacer(modifier = Modifier.height(4.dp))
                    Text(row.body, style = LegalBodyStyle.copy(fontSize = 14.sp, lineHeight = 22.sp), color = colors.brandNavy.copy(alpha = 0.74f))
                }
            }
        }
    }
}

/** One policy of the refund table as a card: its name, then each outcome on its own labelled line. */
@Composable
private fun LegalTableCard(row: LegalRow.TableEntry) {
    val colors = LocalHayameColors.current
    // Best outcome first in the documents we serve: green, amber, red, then neutral.
    val dots = listOf(colors.success, colors.warning, colors.danger)
    LegalCard(modifier = Modifier.padding(start = 20.dp, end = 20.dp, top = 10.dp)) {
        Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp)) {
            if (row.label.isNotEmpty()) {
                Text(
                    row.label,
                    style = TextStyle(fontFamily = ManropeFamily, fontSize = 17.sp, lineHeight = 24.sp, fontWeight = FontWeight.ExtraBold),
                    color = colors.brandNavy,
                    modifier = Modifier.semantics { heading() },
                )
                Spacer(modifier = Modifier.height(10.dp))
                HorizontalDivider(thickness = 1.dp, color = colors.border)
                Spacer(modifier = Modifier.height(4.dp))
            }
            row.cells.forEachIndexed { index, (heading, value) ->
                val applies = !value.equals("Does not apply", ignoreCase = true)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp)
                        .semantics(mergeDescendants = true) {},
                    verticalAlignment = Alignment.Top,
                ) {
                    Box(
                        modifier = Modifier
                            .padding(top = 7.dp)
                            .size(8.dp)
                            .background(
                                (dots.getOrNull(index) ?: colors.brandBlue).copy(alpha = if (applies) 1f else 0.35f),
                                CircleShape,
                            ),
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        heading,
                        style = LegalBodyStyle.copy(fontSize = 13.5.sp, lineHeight = 22.sp, fontWeight = FontWeight.SemiBold),
                        color = colors.mutedText,
                        modifier = Modifier.weight(0.4f),
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        value,
                        style = LegalBodyStyle.copy(fontSize = 14.sp, lineHeight = 22.sp, fontWeight = FontWeight.SemiBold),
                        color = if (applies) colors.brandNavy else colors.mutedText,
                        modifier = Modifier.weight(0.6f),
                    )
                }
            }
        }
    }
}

/** The privacy page's own settings, so nobody has to go looking for them after reading. */
@Composable
private fun LegalPrivacyControls(
    onOpenContact: () -> Unit,
    onOpenDeleteAccount: (() -> Unit)?,
) {
    val colors = LocalHayameColors.current
    var analyticsEnabled by remember { mutableStateOf(AnalyticsService.hasConsent()) }
    Column {
        LegalSectionTitle(
            title = "Your privacy controls",
            note = "Change these whenever you like. They apply to this phone straight away.",
        )
        Spacer(modifier = Modifier.height(10.dp))
        Box(modifier = Modifier.padding(horizontal = 20.dp)) {
            GroupCard {
                ToggleRow(
                    icon = Icons.Outlined.BarChart,
                    tint = colors.brandBlue,
                    title = "Share usage analytics",
                    subtitle = "Which cars people look for and where booking gets stuck",
                    checked = analyticsEnabled,
                    onCheckedChange = { enabled ->
                        AnalyticsService.setConsent(enabled)
                        analyticsEnabled = enabled
                    },
                )
                Text(
                    "We never track you across other apps or sell your data. Turning this off deletes the analytics id stored on this device.",
                    style = LegalNoteStyle,
                    color = colors.mutedText,
                    modifier = Modifier.padding(start = 16.dp, end = 16.dp, bottom = 14.dp),
                )
                HorizontalDivider(color = colors.border)
                NavRow(
                    Icons.Outlined.MailOutline,
                    colors.brandNavy,
                    "Ask about your data",
                    "Send a privacy or account request to our team",
                    onOpenContact,
                )
                if (onOpenDeleteAccount != null) {
                    RowDivider()
                    NavRow(
                        Icons.Outlined.DeleteOutline,
                        colors.danger,
                        "Delete account",
                        "Ask us to delete your account and personal information",
                        onOpenDeleteAccount,
                    )
                }
            }
        }
    }
}

/** Search field, the count with "Open all answers", and the chips that jump to a section. */
@Composable
private fun LegalSearchArea(
    query: String,
    onQueryChange: (String) -> Unit,
    pinned: Boolean,
    countLine: String,
    allOpen: Boolean,
    canToggleAll: Boolean,
    onToggleAll: () -> Unit,
    groups: List<LegalGroupMatches>,
    currentGroup: Int?,
    onOpenGroup: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = LocalHayameColors.current
    val keyboard = LocalSoftwareKeyboardController.current
    val chipState = rememberLazyListState()
    LaunchedEffect(currentGroup, groups) {
        val position = groups.indexOfFirst { it.index == currentGroup }
        if (position >= 0) chipState.animateScrollToItem(position)
    }
    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(colors.pageBackground),
    ) {
        Surface(
            shape = RoundedCornerShape(14.dp),
            color = colors.cardBackground,
            border = BorderStroke(1.dp, colors.controlStroke),
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 20.dp, end = 20.dp, top = 10.dp),
        ) {
            Row(
                modifier = Modifier
                    .heightIn(min = 52.dp)
                    .padding(start = 14.dp, end = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Outlined.Search, contentDescription = null, tint = colors.mutedText, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(10.dp))
                BasicTextField(
                    value = query,
                    onValueChange = { onQueryChange(it.take(80)) },
                    modifier = Modifier
                        .weight(1f)
                        .semantics { contentDescription = "Search questions" },
                    singleLine = true,
                    textStyle = TextStyle(
                        fontFamily = ManropeFamily,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Medium,
                        color = colors.brandNavy,
                    ),
                    cursorBrush = SolidColor(colors.brandBlue),
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                    // Only the keyboard goes away. Focus stays in the field, so Enter on a
                    // hardware keyboard never lands on another control (the Back button).
                    keyboardActions = KeyboardActions(onSearch = { keyboard?.hide() }),
                    decorationBox = { innerTextField ->
                        Box(contentAlignment = Alignment.CenterStart) {
                            if (query.isEmpty()) {
                                Text(
                                    "Search questions",
                                    style = TextStyle(fontFamily = ManropeFamily, fontSize = 15.sp, fontWeight = FontWeight.Medium),
                                    color = colors.mutedText,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            }
                            innerTextField()
                        }
                    },
                )
                if (query.isNotEmpty()) {
                    IconButton(onClick = { onQueryChange("") }) {
                        Icon(Icons.Outlined.Close, contentDescription = "Clear search", tint = colors.mutedText, modifier = Modifier.size(18.dp))
                    }
                } else {
                    Spacer(modifier = Modifier.width(10.dp))
                }
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 48.dp)
                .padding(start = 20.dp, end = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                countLine,
                style = LegalNoteStyle,
                color = colors.mutedText,
                modifier = Modifier
                    .weight(1f)
                    .semantics { liveRegion = LiveRegionMode.Polite },
            )
            if (canToggleAll) {
                TextButton(onClick = onToggleAll, modifier = Modifier.heightIn(min = 48.dp)) {
                    Text(
                        if (allOpen) "Close all" else "Open all answers",
                        style = LegalNoteStyle.copy(fontWeight = FontWeight.Bold),
                        color = colors.brandBlue,
                    )
                }
            }
        }

        if (groups.size > 1) {
            LazyRow(
                state = chipState,
                contentPadding = PaddingValues(horizontal = 20.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                itemsIndexed(groups, key = { _, group -> group.index }) { _, group ->
                    LegalGroupChip(
                        title = group.title.ifEmpty { "Section ${group.index + 1}" },
                        selected = group.index == currentGroup,
                        onClick = { onOpenGroup(group.index) },
                    )
                }
            }
        }
        Spacer(modifier = Modifier.height(10.dp))
        // A hairline only while pinned, where questions slide underneath.
        HorizontalDivider(thickness = 1.dp, color = if (pinned) colors.border else Color.Transparent)
    }
}

@Composable
private fun LegalGroupChip(title: String, selected: Boolean, onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    val container by animateColorAsState(if (selected) colors.brandNavy else colors.cardBackground, tween(160), label = "legal-chip")
    val content by animateColorAsState(if (selected) colors.pageBackground else colors.brandNavy, tween(160), label = "legal-chip-text")
    // 48dp tall to the finger, a slimmer pill to the eye.
    Box(
        modifier = Modifier
            .heightIn(min = 48.dp)
            .clickable(
                onClickLabel = "Go to $title",
                role = Role.Button,
                onClick = onClick,
            ),
        contentAlignment = Alignment.Center,
    ) {
        Surface(
            shape = RoundedCornerShape(999.dp),
            color = container,
            border = BorderStroke(1.dp, if (selected) Color.Transparent else colors.controlStroke),
        ) {
            Text(
                title,
                style = LegalNoteStyle.copy(fontWeight = FontWeight.SemiBold),
                color = content,
                maxLines = 1,
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 9.dp),
            )
        }
    }
}

@Composable
private fun LegalGroupTitle(row: LegalRow.GroupTitle) {
    val colors = LocalHayameColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = 20.dp, end = 20.dp, top = 18.dp, bottom = 2.dp),
        verticalAlignment = Alignment.Bottom,
    ) {
        Text(
            row.title.ifEmpty { "Section ${row.group + 1}" },
            style = LegalSectionTitleStyle.copy(fontSize = 17.sp, lineHeight = 24.sp),
            color = colors.brandNavy,
            modifier = Modifier
                .weight(1f)
                .semantics { heading() },
        )
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            if (row.count == 1) "1 question" else "${row.count} questions",
            style = LegalNoteStyle,
            color = colors.mutedText,
        )
    }
}

/** A question that opens in place to show its answer. The whole heading row is the button. */
@Composable
private fun LegalQuestionCard(
    row: LegalRow.Question,
    needle: String,
    open: Boolean,
    onToggle: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val rotation by animateFloatAsState(if (open) 180f else 0f, tween(220), label = "legal-chevron")
    val borderColor by animateColorAsState(
        if (open) colors.brandBlue.copy(alpha = 0.38f) else colors.border,
        tween(220),
        label = "legal-question-border",
    )
    val mark = colors.warning.copy(alpha = 0.3f)
    LegalCard(
        modifier = Modifier.padding(start = 20.dp, end = 20.dp, top = 10.dp),
        borderColor = borderColor,
    ) {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(
                        onClickLabel = if (open) "Hide the answer" else "Show the answer",
                        role = Role.Button,
                        onClick = onToggle,
                    )
                    .semantics { stateDescription = if (open) "Expanded" else "Collapsed" }
                    .heightIn(min = 56.dp)
                    .padding(start = 16.dp, end = 12.dp, top = 14.dp, bottom = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    remember(row.question, needle, mark) { marked(row.question, needle, mark) },
                    style = LegalQuestionStyle,
                    color = colors.brandNavy,
                    modifier = Modifier.weight(1f),
                )
                Spacer(modifier = Modifier.width(12.dp))
                Icon(
                    Icons.Outlined.ExpandMore,
                    contentDescription = null,
                    tint = if (open) colors.brandBlue else colors.mutedText,
                    modifier = Modifier
                        .size(24.dp)
                        .rotate(rotation),
                )
            }
            AnimatedVisibility(
                visible = open,
                enter = expandVertically(tween(240)) + fadeIn(tween(240)),
                exit = shrinkVertically(tween(200)) + fadeOut(tween(140)),
            ) {
                Column(
                    modifier = Modifier.padding(start = 16.dp, end = 16.dp, bottom = 18.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    HorizontalDivider(thickness = 1.dp, color = colors.border)
                    row.paragraphs.forEach { paragraph ->
                        Text(
                            remember(paragraph, needle, mark) { marked(paragraph, needle, mark) },
                            style = LegalBodyStyle,
                            color = colors.brandNavy.copy(alpha = 0.84f),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun LegalNoMatches(needle: String, onClear: () -> Unit) {
    val colors = LocalHayameColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 32.dp, vertical = 36.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(Icons.Outlined.SearchOff, contentDescription = null, tint = colors.mutedText, modifier = Modifier.size(34.dp))
        Spacer(modifier = Modifier.height(14.dp))
        Text(
            "No questions match \"$needle\"",
            style = LegalQuestionStyle.copy(fontWeight = FontWeight.Bold),
            color = colors.brandNavy,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            "Try a shorter or different word, or send us your question below.",
            style = LegalNoteStyle.copy(fontSize = 13.5.sp, lineHeight = 21.sp),
            color = colors.mutedText,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(16.dp))
        LegalOutlineButton(text = "Clear search", onClick = onClear)
    }
}

@Composable
private fun LegalContactCard(contact: String, onOpenContact: () -> Unit) {
    val colors = LocalHayameColors.current
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = colors.brandLight,
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = 20.dp, end = 20.dp, top = 30.dp),
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Icon(Icons.AutoMirrored.Outlined.HelpOutline, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(26.dp))
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                "Still have a question?",
                style = LegalSectionTitleStyle,
                color = colors.brandNavy,
                modifier = Modifier.semantics { heading() },
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                contact.ifEmpty { "Our team is happy to help. We reply within a day." },
                style = LegalBodyStyle.copy(fontSize = 14.sp, lineHeight = 22.sp),
                color = colors.brandNavy.copy(alpha = 0.8f),
            )
            Spacer(modifier = Modifier.height(16.dp))
            SolidPillButton(text = "Contact support", modifier = Modifier.fillMaxWidth(), onClick = onOpenContact)
        }
    }
}

@Composable
private fun LegalRelatedCard(
    kind: LegalDocumentKind,
    onOpenDocument: (LegalDocumentKind) -> Unit,
    onOpenTerms: () -> Unit,
) {
    val colors = LocalHayameColors.current
    Column {
        LegalSectionTitle(title = "More to read", note = null)
        Spacer(modifier = Modifier.height(10.dp))
        Box(modifier = Modifier.padding(horizontal = 20.dp)) {
            GroupCard {
                LegalDocumentKind.entries.filter { it != kind }.forEach { other ->
                    NavRow(other.icon(), other.tint(), other.shortTitle, other.listSubtitle) { onOpenDocument(other) }
                    RowDivider()
                }
                NavRow(Icons.Outlined.Description, colors.brandBlue, "Terms of Service", "The agreement for using Hayame", onOpenTerms)
            }
        }
    }
}

private fun LegalDocumentKind.icon(): ImageVector = when (this) {
    LegalDocumentKind.PROTECTION -> Icons.Outlined.Shield
    LegalDocumentKind.CANCELLATION -> Icons.Outlined.CalendarMonth
    LegalDocumentKind.PRIVACY -> Icons.Outlined.Public
}

@Composable
private fun LegalDocumentKind.tint(): Color {
    val colors = LocalHayameColors.current
    return when (this) {
        LegalDocumentKind.PROTECTION -> colors.success
        LegalDocumentKind.CANCELLATION -> colors.warning
        LegalDocumentKind.PRIVACY -> colors.mutedText
    }
}

@Composable
private fun LegalLoadError(onRetry: () -> Unit) {
    val colors = LocalHayameColors.current
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(Icons.Outlined.CloudOff, contentDescription = null, tint = colors.mutedText, modifier = Modifier.size(36.dp))
        Spacer(modifier = Modifier.height(14.dp))
        Text(
            "We couldn't load this page",
            style = LegalSectionTitleStyle,
            color = colors.brandNavy,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            "Check your connection and try again.",
            style = LegalNoteStyle.copy(fontSize = 13.5.sp, lineHeight = 21.sp),
            color = colors.mutedText,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(18.dp))
        LegalOutlineButton(text = "Retry", onClick = onRetry)
    }
}

/** Flat outline pill, the secondary button of this screen. */
@Composable
private fun LegalOutlineButton(text: String, onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    OutlinedButton(
        onClick = onClick,
        modifier = Modifier.heightIn(min = 48.dp),
        shape = RoundedCornerShape(999.dp),
        border = BorderStroke(1.dp, colors.brandNavy.copy(alpha = 0.28f)),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = colors.brandNavy),
        contentPadding = PaddingValues(horizontal = 24.dp, vertical = 10.dp),
    ) {
        Text(
            text,
            style = TextStyle(fontFamily = ManropeFamily, fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
            color = colors.brandNavy,
        )
    }
}

/** [text] with every place the search words appear given a soft background. */
private fun marked(text: String, needle: String, color: Color): AnnotatedString {
    if (needle.isEmpty()) return AnnotatedString(text)
    return buildAnnotatedString {
        append(text)
        var from = 0
        while (from < text.length) {
            val at = text.indexOf(needle, startIndex = from, ignoreCase = true)
            if (at < 0) break
            addStyle(SpanStyle(background = color), at, at + needle.length)
            from = at + needle.length
        }
    }
}

private val LegalSectionTitleStyle = TextStyle(
    fontFamily = ManropeFamily,
    fontSize = 19.sp,
    lineHeight = 27.sp,
    fontWeight = FontWeight.Bold,
    letterSpacing = (-0.1).sp,
)

private val LegalQuestionStyle = TextStyle(
    fontFamily = ManropeFamily,
    fontSize = 15.sp,
    lineHeight = 22.sp,
    fontWeight = FontWeight.SemiBold,
)

private val LegalBodyStyle = TextStyle(
    fontFamily = ManropeFamily,
    fontSize = 14.5.sp,
    lineHeight = 24.sp,
    fontWeight = FontWeight.Normal,
)

private val LegalNoteStyle = TextStyle(
    fontFamily = ManropeFamily,
    fontSize = 13.sp,
    lineHeight = 19.sp,
    fontWeight = FontWeight.Medium,
)

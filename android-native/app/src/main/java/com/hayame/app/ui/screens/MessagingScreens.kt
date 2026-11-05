package com.hayame.app.ui.screens

import com.hayame.app.ui.components.coachTarget
import com.hayame.app.ui.components.CoachTour
import com.hayame.app.ui.components.CoachStep
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.outlined.ArrowDownward
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.DirectionsCar
import androidx.compose.material.icons.outlined.DoneAll
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hayame.app.core.network.ConversationDto
import com.hayame.app.core.network.MessageDto
import com.hayame.app.ui.components.ErrorBlock
import com.hayame.app.ui.components.HayameShimmerBlock
import com.hayame.app.ui.state.UiState
import com.hayame.app.ui.theme.LocalHayameColors
import com.hayame.app.ui.viewmodel.AppViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Locale

// MARK: Inbox ------------------------------------------------------------------------------------

/**
 * Conversation list. Borderless rows with an unread ring on the avatar, a search field that
 * filters by name or preview, shimmer skeletons while loading, and pull to refresh.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MessagesScreen(
    viewModel: AppViewModel,
    onBack: () -> Unit,
    onOpenConversation: (String) -> Unit,
    title: String = "Messages",
    showBackButton: Boolean = true,
) {
    CoachTour(
        id = "messages",
        steps = listOf(
            CoachStep("inbox.search", "Find a conversation", "Search by name or by anything said in the chat."),
            CoachStep("inbox.first", "Open a chat", "Unread chats have a blue ring and a count."),
        ),
    )
    val colors = LocalHayameColors.current
    val state by viewModel.conversationsState.collectAsState()
    val scope = rememberCoroutineScope()
    var query by rememberSaveable { mutableStateOf("") }
    var isRefreshing by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.loadConversations()
        while (true) {
            delay(8_000)
            viewModel.refreshConversations()
        }
    }

    val conversations = (state as? UiState.Success<List<ConversationDto>>)?.data.orEmpty()
    val unreadTotal = conversations.sumOf { it.unread_count ?: 0 }
    val filtered = remember(conversations, query) {
        val needle = query.trim()
        if (needle.isBlank()) {
            conversations
        } else {
            conversations.filter { row ->
                row.other_user?.name.orEmpty().contains(needle, ignoreCase = true) ||
                    row.last_message_preview.orEmpty().contains(needle, ignoreCase = true) ||
                    row.car_title.orEmpty().contains(needle, ignoreCase = true)
            }
        }
    }

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = { if (showBackButton) PageTopBar(title = title, onBack = onBack) },
    ) { inner ->
        PullToRefreshBox(
            isRefreshing = isRefreshing,
            onRefresh = {
                isRefreshing = true
                viewModel.refreshConversations()
                scope.launch {
                    delay(900)
                    isRefreshing = false
                }
            },
            modifier = Modifier
                .fillMaxSize()
                .padding(inner),
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 24.dp),
            ) {
                if (!showBackButton) {
                    item(key = "inbox-header") {
                        Column(modifier = Modifier.padding(horizontal = 16.dp).padding(top = 18.dp, bottom = 14.dp)) {
                            Text(title, fontSize = 30.sp, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                            Text(
                                when {
                                    state is UiState.Loading -> "Catching up on your chats..."
                                    conversations.isEmpty() -> "Hosts and guests you talk to show up here."
                                    unreadTotal == 0 -> "All caught up"
                                    unreadTotal == 1 -> "1 unread message"
                                    else -> "$unreadTotal unread messages"
                                },
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.SemiBold,
                                color = colors.mutedText,
                                modifier = Modifier.padding(top = 3.dp),
                            )
                        }
                    }
                }

                when (val s = state) {
                    UiState.Loading, UiState.Idle -> {
                        items(6, key = { "skeleton-$it" }) { index ->
                            StaggeredAppear(index = index) { InboxSkeletonRow() }
                        }
                    }
                    is UiState.Error -> item(key = "inbox-error") {
                        Box(modifier = Modifier.padding(16.dp)) {
                            ErrorBlock(s.message, onRetry = { viewModel.loadConversations() })
                        }
                    }
                    UiState.Empty -> item(key = "inbox-empty") {
                        StaggeredAppear(index = 0) {
                            InboxEmptyState(
                                title = "No conversations yet",
                                subtitle = "Message a host from any listing and the chat will live here.",
                            )
                        }
                    }
                    is UiState.Success -> {
                        item(key = "inbox-search") {
                            StaggeredAppear(index = 0) {
                                InboxSearchField(
                                    query = query,
                                    onQueryChange = { query = it },
                                    modifier = Modifier.padding(horizontal = 16.dp).padding(top = if (showBackButton) 12.dp else 0.dp, bottom = 6.dp).coachTarget("inbox.search"),
                                )
                            }
                        }
                        if (filtered.isEmpty()) {
                            item(key = "inbox-no-match") {
                                InboxEmptyState(
                                    title = "No matches",
                                    subtitle = "Nothing in your chats mentions \"${query.trim()}\".",
                                )
                            }
                        } else {
                            items(filtered, key = { it.id }) { row ->
                                val index = filtered.indexOf(row)
                                StaggeredAppear(index = index + 1) {
                                    Column(modifier = if (index == 0) Modifier.coachTarget("inbox.first") else Modifier) {
                                        InboxRow(row = row, onClick = { onOpenConversation(row.id) })
                                        if (index < filtered.lastIndex) {
                                            HorizontalDivider(
                                                color = colors.border,
                                                modifier = Modifier.padding(start = 84.dp, end = 16.dp),
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun InboxSearchField(query: String, onQueryChange: (String) -> Unit, modifier: Modifier = Modifier) {
    val colors = LocalHayameColors.current
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(CircleShape)
            .background(colors.fieldBackground)
            .border(1.dp, colors.border, CircleShape)
            .padding(horizontal = 14.dp, vertical = 11.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Icon(Icons.Outlined.Search, contentDescription = null, tint = colors.mutedText, modifier = Modifier.size(18.dp))
        BasicTextField(
            value = query,
            onValueChange = onQueryChange,
            modifier = Modifier.weight(1f),
            singleLine = true,
            textStyle = MaterialTheme.typography.bodyLarge.copy(color = colors.brandNavy),
            cursorBrush = SolidColor(colors.brandBlue),
            decorationBox = { innerField ->
                Box {
                    if (query.isEmpty()) {
                        Text("Search chats", style = MaterialTheme.typography.bodyLarge, color = colors.mutedText)
                    }
                    innerField()
                }
            },
        )
        AnimatedVisibility(visible = query.isNotEmpty(), enter = scaleIn() + fadeIn(), exit = scaleOut() + fadeOut()) {
            Icon(
                Icons.Outlined.Close,
                contentDescription = "Clear search",
                tint = colors.mutedText,
                modifier = Modifier
                    .size(18.dp)
                    .clickable { onQueryChange("") },
            )
        }
    }
}

@Composable
private fun InboxRow(row: ConversationDto, onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    val unread = (row.unread_count ?: 0).coerceAtLeast(0)
    val isUnread = unread > 0
    val name = row.other_user?.name?.trim().takeUnless { it.isNullOrBlank() } ?: "Hayame user"
    val preview = row.last_message_preview?.trim().takeUnless { it.isNullOrBlank() } ?: "Say hello"
    val timeLabel = relativeChatTime(row.last_message_at ?: row.created_at)

    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed) 0.985f else 1f, spring(stiffness = Spring.StiffnessMedium), label = "inbox-press")
    val pressFill by animateFloatAsState(if (pressed) 1f else 0f, tween(140), label = "inbox-fill")

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .graphicsLayer { scaleX = scale; scaleY = scale }
            .background(colors.fieldBackground.copy(alpha = pressFill))
            .clickable(interactionSource = interaction, indication = null, onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 13.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Box(contentAlignment = Alignment.Center) {
            RemoteAvatar(
                imageUrl = resolveAppImage(row.other_user?.avatar),
                name = name,
                fallback = "U",
                size = 52.dp,
                textStyle = MaterialTheme.typography.titleMedium,
                modifier = Modifier.then(
                    if (isUnread) Modifier.border(2.dp, colors.brandBlue, CircleShape).padding(3.dp) else Modifier,
                ),
            )
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = if (isUnread) FontWeight.ExtraBold else FontWeight.SemiBold,
                    color = colors.brandNavy,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f),
                )
                if (timeLabel.isNotBlank()) {
                    Text(
                        timeLabel,
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (isUnread) colors.brandBlue else colors.mutedText,
                        modifier = Modifier.padding(start = 8.dp),
                    )
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    preview,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = if (isUnread) FontWeight.SemiBold else FontWeight.Medium,
                    color = if (isUnread) colors.brandNavy else colors.mutedText,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f),
                )
                AnimatedVisibility(visible = isUnread, enter = scaleIn() + fadeIn(), exit = scaleOut() + fadeOut()) {
                    Box(
                        modifier = Modifier
                            .background(colors.brandBlue, CircleShape)
                            .padding(horizontal = 7.dp, vertical = 2.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            if (unread > 99) "99+" else unread.toString(),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                        )
                    }
                }
            }
            row.car_title?.trim()?.takeIf { it.isNotBlank() }?.let { carTitle ->
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(Icons.Outlined.DirectionsCar, contentDescription = null, tint = colors.mutedText, modifier = Modifier.size(12.dp))
                    Text(carTitle, style = MaterialTheme.typography.labelMedium, color = colors.mutedText, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
        }
    }
}

@Composable
private fun InboxSkeletonRow() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 13.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        HayameShimmerBlock(modifier = Modifier.size(52.dp), cornerRadius = 26.dp)
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row {
                HayameShimmerBlock(modifier = Modifier.width(140.dp).height(14.dp))
                Spacer(Modifier.weight(1f))
                HayameShimmerBlock(modifier = Modifier.width(34.dp).height(10.dp))
            }
            HayameShimmerBlock(modifier = Modifier.fillMaxWidth(0.72f).height(11.dp))
        }
    }
}

@Composable
private fun InboxEmptyState(title: String, subtitle: String) {
    val colors = LocalHayameColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 32.dp, vertical = 48.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .background(colors.brandLight, CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Outlined.ChatBubbleOutline, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(30.dp))
        }
        Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
        Text(
            subtitle,
            style = MaterialTheme.typography.bodyMedium,
            color = colors.mutedText,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
        )
    }
}

// MARK: Chat -------------------------------------------------------------------------------------

/** One row of the chat list: either a date separator or a message with its grouping flags. */
private sealed interface ChatRow {
    val key: String

    data class DateSeparator(val label: String) : ChatRow {
        override val key: String get() = "date-$label"
    }

    data class Message(
        val message: MessageDto,
        val isMe: Boolean,
        /** Last bubble of a run from the same sender: gets the tail and the timestamp. */
        val isLastOfRun: Boolean,
        val isFirstOfRun: Boolean,
    ) : ChatRow {
        override val key: String get() = message.id
    }
}

/**
 * Chat thread. Messages are grouped into runs per sender with a tail on the last bubble, date
 * separators between days, pop-in animation for new messages, a jump-to-latest chip when scrolled
 * up, and a growing composer pinned above the keyboard.
 */
@Composable
fun ConversationScreen(
    viewModel: AppViewModel,
    conversationId: String,
    onBack: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val messagesState by viewModel.messagesState.collectAsState()
    val conversationsState by viewModel.conversationsState.collectAsState()
    val me by viewModel.me.collectAsState()
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val scope = rememberCoroutineScope()
    var draft by rememberSaveable(conversationId) { mutableStateOf("") }
    val listState = rememberLazyListState()

    val conversation = (conversationsState as? UiState.Success<List<ConversationDto>>)?.data?.firstOrNull { it.id == conversationId }
    val otherName = conversation?.other_user?.name?.trim().takeUnless { it.isNullOrBlank() } ?: "Chat"
    val otherAvatar = resolveAppImage(conversation?.other_user?.avatar)
    val subtitle = conversation?.car_title?.trim()?.takeIf { it.isNotBlank() } ?: "Hayame messages"

    LaunchedEffect(conversationId) {
        viewModel.selectConversation(conversationId)
        if (conversationsState !is UiState.Success) viewModel.loadConversations()
        while (true) {
            delay(2_000)
            viewModel.refreshMessages(conversationId)
        }
    }

    val messages = (messagesState as? UiState.Success<List<MessageDto>>)?.data.orEmpty()
    val myId = me?.user?.id
    val rows = remember(messages, myId) { buildChatRows(messages, myId) }

    // Ids present on first load do not pop in; only messages that arrive afterwards do.
    var initialIds by remember(conversationId) { mutableStateOf<Set<String>?>(null) }
    LaunchedEffect(messagesState) {
        if (initialIds == null && (messagesState is UiState.Success || messagesState is UiState.Empty)) {
            initialIds = messages.map { it.id }.toSet()
        }
    }

    // Keep the view pinned to the newest message when the reader is already near the bottom,
    // or when the newest message is their own.
    var lastSeenCount by remember(conversationId) { mutableIntStateOf(0) }
    val isNearBottom by remember {
        derivedStateOf {
            val info = listState.layoutInfo
            val lastVisible = info.visibleItemsInfo.lastOrNull()?.index ?: 0
            info.totalItemsCount == 0 || lastVisible >= info.totalItemsCount - 3
        }
    }
    LaunchedEffect(rows.size) {
        if (rows.isEmpty()) return@LaunchedEffect
        val firstLoad = lastSeenCount == 0
        val newestIsMine = (rows.lastOrNull() as? ChatRow.Message)?.isMe == true
        if (firstLoad) {
            listState.scrollToItem(rows.lastIndex)
        } else if (isNearBottom || newestIsMine) {
            listState.animateScrollToItem(rows.lastIndex)
        }
        lastSeenCount = rows.size
    }
    val showJumpToLatest by remember {
        derivedStateOf {
            val info = listState.layoutInfo
            val lastVisible = info.visibleItemsInfo.lastOrNull()?.index ?: 0
            info.totalItemsCount > 0 && lastVisible < info.totalItemsCount - 4
        }
    }

    fun send() {
        val outgoing = draft.trim()
        if (outgoing.isBlank()) return
        viewModel.sendMessage(conversationId, outgoing)
        draft = ""
        scope.launch {
            if (rows.isNotEmpty()) listState.animateScrollToItem(rows.lastIndex)
        }
    }

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = {
            ChatHeader(name = otherName, subtitle = subtitle, avatarUrl = otherAvatar, onBack = onBack)
        },
        bottomBar = {
            ChatComposer(
                value = draft,
                onValueChange = { draft = it },
                enabled = isAuthenticated,
                onSend = ::send,
            )
        },
    ) { inner ->
        Box(modifier = Modifier.fillMaxSize().padding(inner)) {
            when (val s = messagesState) {
                UiState.Loading, UiState.Idle -> ChatSkeleton()
                is UiState.Error -> Box(modifier = Modifier.padding(16.dp)) {
                    ErrorBlock(s.message, onRetry = { viewModel.loadMessages(conversationId) })
                }
                UiState.Empty -> ChatEmptyState(name = otherName)
                is UiState.Success -> LazyColumn(
                    state = listState,
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 16.dp),
                ) {
                    items(rows, key = { it.key }) { row ->
                        when (row) {
                            is ChatRow.DateSeparator -> DateSeparatorChip(label = row.label)
                            is ChatRow.Message -> {
                                val popsIn = initialIds?.contains(row.message.id) == false
                                MessageBubble(row = row, popIn = popsIn)
                            }
                        }
                    }
                }
            }

            AnimatedVisibility(
                visible = showJumpToLatest,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 12.dp),
                enter = fadeIn(tween(180)) + slideInVertically(tween(220, easing = FastOutSlowInEasing)) { it / 2 },
                exit = fadeOut(tween(140)) + slideOutVertically(tween(180)) { it / 2 },
            ) {
                Surface(
                    onClick = { scope.launch { if (rows.isNotEmpty()) listState.animateScrollToItem(rows.lastIndex) } },
                    shape = CircleShape,
                    color = colors.brandNavy,
                    shadowElevation = 6.dp,
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 9.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Icon(Icons.Outlined.ArrowDownward, contentDescription = null, tint = colors.pageBackground, modifier = Modifier.size(14.dp))
                        Text("Latest", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = colors.pageBackground)
                    }
                }
            }
        }
    }
}

@Composable
private fun ChatHeader(name: String, subtitle: String, avatarUrl: String?, onBack: () -> Unit) {
    val colors = LocalHayameColors.current
    Surface(color = colors.cardBackground, shadowElevation = 2.dp) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(start = 4.dp, end = 16.dp, top = 6.dp, bottom = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = colors.brandNavy)
            }
            RemoteAvatar(
                imageUrl = avatarUrl,
                name = name,
                fallback = "U",
                size = 38.dp,
                textStyle = MaterialTheme.typography.titleSmall,
                borderColor = colors.border,
            )
            Column(modifier = Modifier.weight(1f).padding(start = 12.dp), verticalArrangement = Arrangement.spacedBy(1.dp)) {
                Text(name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(subtitle, style = MaterialTheme.typography.labelMedium, color = colors.mutedText, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

@Composable
private fun ChatComposer(value: String, onValueChange: (String) -> Unit, enabled: Boolean, onSend: () -> Unit) {
    val colors = LocalHayameColors.current
    val hasText = value.isNotBlank()
    val sendScale by animateFloatAsState(
        targetValue = if (hasText && enabled) 1f else 0.7f,
        animationSpec = spring(dampingRatio = 0.6f, stiffness = Spring.StiffnessMediumLow),
        label = "send-scale",
    )
    val sendAlpha by animateFloatAsState(if (hasText && enabled) 1f else 0.45f, tween(160), label = "send-alpha")

    Surface(color = colors.cardBackground, shadowElevation = 8.dp) {
        Column {
            HorizontalDivider(color = colors.bottomBarSeparator)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .imePadding()
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                BasicTextField(
                    value = value,
                    onValueChange = onValueChange,
                    enabled = enabled,
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(22.dp))
                        .background(colors.fieldBackground)
                        .border(1.dp, colors.border, RoundedCornerShape(22.dp))
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    maxLines = 5,
                    textStyle = MaterialTheme.typography.bodyLarge.copy(color = colors.brandNavy, fontSize = 15.sp),
                    cursorBrush = SolidColor(colors.brandBlue),
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
                    decorationBox = { innerField ->
                        Box {
                            if (value.isEmpty()) {
                                Text(
                                    if (enabled) "Message" else "Sign in to send a message",
                                    style = MaterialTheme.typography.bodyLarge.copy(fontSize = 15.sp),
                                    color = colors.mutedText,
                                )
                            }
                            innerField()
                        }
                    },
                )
                Surface(
                    onClick = onSend,
                    enabled = hasText && enabled,
                    shape = CircleShape,
                    color = colors.brandBlue,
                    modifier = Modifier
                        .size(46.dp)
                        .graphicsLayer { scaleX = sendScale; scaleY = sendScale; alpha = sendAlpha },
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Send", tint = Color.White, modifier = Modifier.size(20.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun DateSeparatorChip(label: String) {
    val colors = LocalHayameColors.current
    Box(modifier = Modifier.fillMaxWidth().padding(vertical = 14.dp), contentAlignment = Alignment.Center) {
        Text(
            label,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            color = colors.mutedText,
            modifier = Modifier
                .background(colors.fieldBackground, CircleShape)
                .padding(horizontal = 12.dp, vertical = 5.dp),
        )
    }
}

@Composable
private fun MessageBubble(row: ChatRow.Message, popIn: Boolean) {
    val colors = LocalHayameColors.current
    val isMe = row.isMe
    val message = row.message

    // New messages scale and fade in from their own corner, like they were just sent.
    val reveal = remember(message.id) { Animatable(if (popIn) 0f else 1f) }
    LaunchedEffect(message.id) {
        if (reveal.value < 1f) reveal.animateTo(1f, spring(dampingRatio = 0.7f, stiffness = Spring.StiffnessMediumLow))
    }

    val tailRadius = 5.dp
    val fullRadius = 18.dp
    val shape = RoundedCornerShape(
        topStart = if (!isMe && !row.isFirstOfRun) tailRadius else fullRadius,
        topEnd = if (isMe && !row.isFirstOfRun) tailRadius else fullRadius,
        bottomStart = if (!isMe && row.isLastOfRun) tailRadius else fullRadius,
        bottomEnd = if (isMe && row.isLastOfRun) tailRadius else fullRadius,
    )

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = if (row.isFirstOfRun) 10.dp else 2.dp)
            .graphicsLayer {
                val progress = reveal.value
                alpha = progress
                scaleX = 0.85f + 0.15f * progress
                scaleY = 0.85f + 0.15f * progress
                transformOrigin = TransformOrigin(if (isMe) 1f else 0f, 1f)
            },
        horizontalAlignment = if (isMe) Alignment.End else Alignment.Start,
    ) {
        Surface(
            color = if (isMe) colors.brandBlue else colors.cardBackground,
            shape = shape,
            border = if (isMe) null else androidx.compose.foundation.BorderStroke(1.dp, colors.border),
            modifier = Modifier.widthIn(max = 300.dp),
        ) {
            Text(
                text = message.body,
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                color = if (isMe) Color.White else colors.brandNavy,
                style = MaterialTheme.typography.bodyLarge.copy(fontSize = 15.sp, lineHeight = 21.sp),
            )
        }
        if (row.isLastOfRun) {
            Row(
                modifier = Modifier.padding(top = 3.dp, start = 6.dp, end = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    chatClockLabel(message.created_at),
                    style = MaterialTheme.typography.labelSmall,
                    color = colors.mutedText,
                )
                if (isMe && !message.read_at.isNullOrBlank()) {
                    Icon(Icons.Outlined.DoneAll, contentDescription = "Seen", tint = colors.brandBlue, modifier = Modifier.size(13.dp))
                }
            }
        }
    }
}

@Composable
private fun ChatSkeleton() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        listOf(0.55f to false, 0.4f to false, 0.62f to true, 0.3f to true, 0.5f to false, 0.44f to true).forEachIndexed { index, (fraction, mine) ->
            StaggeredAppear(index = index) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = if (mine) Arrangement.End else Arrangement.Start) {
                    HayameShimmerBlock(modifier = Modifier.fillMaxWidth(fraction).height(40.dp), cornerRadius = 18.dp)
                }
            }
        }
    }
}

@Composable
private fun ChatEmptyState(name: String) {
    val colors = LocalHayameColors.current
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .background(colors.brandLight, CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Outlined.ChatBubbleOutline, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(30.dp))
        }
        Spacer(Modifier.height(14.dp))
        Text("Say hello to $name", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = colors.brandNavy)
        Spacer(Modifier.height(6.dp))
        Text(
            "Ask about availability, pickup, or anything on the listing.",
            style = MaterialTheme.typography.bodyMedium,
            color = colors.mutedText,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
        )
    }
}

// MARK: Grouping and time helpers ----------------------------------------------------------------

/** Groups consecutive messages from one sender (within five minutes) and inserts day separators. */
private fun buildChatRows(messages: List<MessageDto>, myId: String?): List<ChatRow> {
    if (messages.isEmpty()) return emptyList()
    val zone = ZoneId.systemDefault()
    val rows = ArrayList<ChatRow>(messages.size + 8)
    var previousDay: LocalDate? = null
    messages.forEachIndexed { index, message ->
        val instant = parseChatInstant(message.created_at)
        val day = instant?.atZone(zone)?.toLocalDate()
        if (day != null && day != previousDay) {
            rows += ChatRow.DateSeparator(dayLabel(day))
            previousDay = day
        }
        val previous = messages.getOrNull(index - 1)
        val next = messages.getOrNull(index + 1)
        val continuesPrevious = previous != null && previous.sender_id == message.sender_id &&
            sameRun(parseChatInstant(previous.created_at), instant) &&
            day == previous.let { parseChatInstant(it.created_at)?.atZone(zone)?.toLocalDate() }
        val continuesNext = next != null && next.sender_id == message.sender_id &&
            sameRun(instant, parseChatInstant(next.created_at)) &&
            day == next.let { parseChatInstant(it.created_at)?.atZone(zone)?.toLocalDate() }
        rows += ChatRow.Message(
            message = message,
            isMe = myId != null && message.sender_id == myId,
            isLastOfRun = !continuesNext,
            isFirstOfRun = !continuesPrevious,
        )
    }
    return rows
}

private fun sameRun(a: Instant?, b: Instant?): Boolean {
    if (a == null || b == null) return true
    return ChronoUnit.MINUTES.between(a, b).let { it in -5..5 }
}

private fun parseChatInstant(raw: String?): Instant? {
    if (raw.isNullOrBlank()) return null
    return runCatching { OffsetDateTime.parse(raw).toInstant() }.getOrNull()
        ?: runCatching { Instant.parse(raw) }.getOrNull()
        ?: runCatching { OffsetDateTime.parse(raw.replace(" ", "T")).toInstant() }.getOrNull()
}

private fun dayLabel(day: LocalDate): String {
    val today = LocalDate.now()
    return when (day) {
        today -> "Today"
        today.minusDays(1) -> "Yesterday"
        else -> if (day.year == today.year) {
            day.format(DateTimeFormatter.ofPattern("d MMM", Locale.US))
        } else {
            day.format(DateTimeFormatter.ofPattern("d MMM yyyy", Locale.US))
        }
    }
}

/** "9:41 AM" for the timestamp under a bubble. */
private fun chatClockLabel(raw: String?): String {
    val instant = parseChatInstant(raw) ?: return raw?.takeLast(5).orEmpty()
    return instant.atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("h:mm a", Locale.US))
}

/** "now", "5m", "3h", "Yesterday", "Mon", "12 Oct" for the inbox row. */
private fun relativeChatTime(raw: String?): String {
    val instant = parseChatInstant(raw) ?: return ""
    val now = ZonedDateTime.now()
    val then = instant.atZone(now.zone)
    val minutes = ChronoUnit.MINUTES.between(then, now)
    return when {
        minutes < 1 -> "now"
        minutes < 60 -> "${minutes}m"
        then.toLocalDate() == now.toLocalDate() -> "${ChronoUnit.HOURS.between(then, now)}h"
        then.toLocalDate() == now.toLocalDate().minusDays(1) -> "Yesterday"
        ChronoUnit.DAYS.between(then.toLocalDate(), now.toLocalDate()) < 7 -> then.format(DateTimeFormatter.ofPattern("EEE", Locale.US))
        then.year == now.year -> then.format(DateTimeFormatter.ofPattern("d MMM", Locale.US))
        else -> then.format(DateTimeFormatter.ofPattern("d MMM yyyy", Locale.US))
    }
}

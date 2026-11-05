import SwiftUI

// MARK: - Messaging
//
// The inbox is a plain list of people, not a stack of bordered cards: a ringed
// avatar when something is unread, bold name and preview, a relative time, and
// a count pill. The thread groups bubbles by sender and day, animates new
// messages in, and keeps a growing composer pinned above the keyboard.

/// Relative labels for the inbox and day labels for the thread.
enum HayameRelativeTime {
    static func inboxLabel(_ date: Date, now: Date = .now) -> String {
        let seconds = max(0, now.timeIntervalSince(date))
        let calendar = Calendar.current
        if seconds < 60 { return "Now" }
        if seconds < 3600 { return "\(Int(seconds / 60))m" }
        if calendar.isDateInToday(date) { return "\(Int(seconds / 3600))h" }
        if calendar.isDateInYesterday(date) { return "Yesterday" }
        let formatter = DateFormatter()
        formatter.dateFormat = seconds < 6 * 86_400 ? "EEE" : "d MMM"
        return formatter.string(from: date)
    }

    static func dayLabel(_ date: Date) -> String {
        let calendar = Calendar.current
        if calendar.isDateInToday(date) { return "Today" }
        if calendar.isDateInYesterday(date) { return "Yesterday" }
        let formatter = DateFormatter()
        formatter.dateFormat = calendar.isDate(date, equalTo: .now, toGranularity: .year) ? "EEEE, d MMM" : "d MMM yyyy"
        return formatter.string(from: date)
    }
}

/// Round avatar for a conversation partner: their photo, or initials on a soft
/// disc. `highlighted` draws the unread ring.
struct ConversationAvatar: View {
    let name: String
    var avatarURL: String?
    var size: CGFloat = 54
    var highlighted = false

    private var initials: String {
        let value = name
            .split(separator: " ")
            .prefix(2)
            .compactMap { $0.first.map(String.init) }
            .joined()
            .uppercased()
        return value.isEmpty ? "U" : value
    }

    var body: some View {
        ZStack {
            if highlighted {
                Circle()
                    .strokeBorder(HayameTheme.brandBlue, lineWidth: 2)
                    .transition(.scale.combined(with: .opacity))
            }
            Group {
                if let url = RemoteImageURLResolver.resolve(avatarURL) {
                    CachedRemoteImage(url: url, targetSize: CGSize(width: size * 2, height: size * 2)) {
                        Circle().fill(HayameTheme.brandLight)
                    } failure: {
                        fallback
                    }
                } else {
                    fallback
                }
            }
            .frame(width: highlighted ? size - 8 : size, height: highlighted ? size - 8 : size)
            .clipShape(Circle())
        }
        .frame(width: size, height: size)
        .animation(HayameMotion.snappy, value: highlighted)
    }

    private var fallback: some View {
        Circle()
            .fill(HayameTheme.brandLight)
            .overlay(
                Text(initials)
                    .font(.hayame(size: size * 0.32, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
            )
    }
}

// MARK: - Inbox

struct InboxScreen: View {
    @EnvironmentObject private var appState: AppState
    /// True when the inbox is a tab root (host Inbox): it draws its own big
    /// title and hides the navigation bar. Pushed from More it keeps the bar.
    var isTabRoot = false

    @State private var search = ""
    @State private var showUnreadOnly = false
    @State private var inboxTimer = Timer.publish(every: 10, on: .main, in: .common).autoconnect()
    @State private var activeChatTarget: TripChatTarget?
    @FocusState private var searchFocused: Bool

    private var sortedConversations: [Conversation] {
        appState.conversations.sorted { $0.updatedAt > $1.updatedAt }
    }

    private var unreadTotal: Int {
        appState.conversations.reduce(0) { $0 + $1.unreadCount }
    }

    private var filtered: [Conversation] {
        let query = search.trimmingCharacters(in: .whitespacesAndNewlines)
        return sortedConversations.filter { conversation in
            if showUnreadOnly && conversation.unreadCount == 0 { return false }
            guard !query.isEmpty else { return true }
            return conversation.participantName.localizedCaseInsensitiveContains(query)
                || conversation.lastMessagePreview.localizedCaseInsensitiveContains(query)
        }
    }

    private var isInitialLoading: Bool {
        if case .loading = appState.conversationsLoadState, appState.conversations.isEmpty { return true }
        return false
    }

    private var subtitle: String {
        if !appState.isAuthenticated { return "Sign in to chat with hosts and guests." }
        if isInitialLoading { return "Fetching your conversations..." }
        if appState.conversations.isEmpty { return "Conversations with hosts and guests live here." }
        if unreadTotal == 0 { return "All caught up" }
        return "\(unreadTotal) unread \(unreadTotal == 1 ? "message" : "messages")"
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 16) {
                if isTabRoot {
                    header
                }

                if !appState.isAuthenticated {
                    InboxEmptyState(
                        systemImage: "person.crop.circle.badge.exclamationmark",
                        title: "Log in to use messages",
                        message: "Conversation history and live chat are available after you sign in.",
                        actionTitle: "Log in / Sign up"
                    ) {
                        appState.returnToAuth()
                    }
                    .hayameAppear(index: 1)
                } else if isInitialLoading {
                    VStack(spacing: 0) {
                        ForEach(0..<6, id: \.self) { index in
                            ConversationPlaceholderRow()
                            if index < 5 { inboxDivider }
                        }
                    }
                    .transition(.opacity)
                } else if case .error(let message) = appState.conversationsLoadState, appState.conversations.isEmpty {
                    ErrorStateCard(title: "Messages unavailable", message: message, actionTitle: "Refresh") {
                        appState.retryConversations()
                    }
                    .hayameAppear(index: 1)
                } else if appState.conversations.isEmpty {
                    InboxEmptyState(
                        systemImage: "bubble.left.and.bubble.right.fill",
                        title: "No conversations yet",
                        message: appState.hostModeEnabled
                            ? "Guests who book or ask about your cars will show up here."
                            : "Message a host from any listing to ask about pickup, delivery or dates.",
                        actionTitle: appState.hostModeEnabled ? nil : "Explore cars"
                    ) {
                        appState.renterTab = .explore
                    }
                    .hayameAppear(index: 1)
                } else {
                    searchField
                        .coachMark("inbox.search")
                        .coachTour(.messages)
                        .hayameAppear(index: 1)

                    if unreadTotal > 0 {
                        unreadToggle
                            .hayameAppear(index: 2)
                    }

                    if filtered.isEmpty {
                        noMatchState
                            .transition(.opacity)
                    } else {
                        conversationList
                    }
                }

                Color.clear.frame(height: 8)
            }
            .padding(16)
            .animation(HayameMotion.settle, value: filtered.map(\.id))
            .animation(HayameMotion.settle, value: isInitialLoading)
        }
        .background(HayameTheme.pageBackground)
        .toolbar(isTabRoot ? .hidden : .visible, for: .navigationBar)
        .navigationTitle(isTabRoot ? "" : "Messages")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable {
            await appState.refreshAllRemoteData()
        }
        .navigationDestination(item: $activeChatTarget) { target in
            ChatThreadScreen(conversationID: target.id, participantName: target.participantName)
                .environmentObject(appState)
        }
        .onAppear {
            appState.refreshConversationsNow()
            openPendingConversationIfNeeded()
        }
        .onReceive(inboxTimer) { _ in
            appState.refreshConversationsNow()
        }
        .onChange(of: appState.pendingConversationID) { _, _ in
            openPendingConversationIfNeeded()
        }
        .onChange(of: appState.conversations.count) { _, _ in
            openPendingConversationIfNeeded()
        }
        .onChange(of: unreadTotal) { _, total in
            if total == 0 { showUnreadOnly = false }
        }
    }

    // MARK: Sections

    private var header: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text("Messages")
                    .font(.hayame(size: 30, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Text(subtitle)
                    .font(.hayame(size: 13, weight: .semibold))
                    .foregroundStyle(unreadTotal > 0 && appState.isAuthenticated ? HayameTheme.brandBlue : HayameTheme.mutedText)
                    .contentTransition(.numericText())
            }
            Spacer()
            if appState.isSyncingRemote {
                HayameStatusPill(text: "Syncing", tone: .info, isLive: true)
                    .transition(.scale.combined(with: .opacity))
            }
        }
        .animation(HayameMotion.snappy, value: appState.isSyncingRemote)
        .animation(HayameMotion.snappy, value: subtitle)
    }

    private var searchField: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .font(.hayame(size: 14, weight: .bold))
                .foregroundStyle(searchFocused ? HayameTheme.brandBlue : HayameTheme.mutedText)
            TextField("Search people or messages", text: $search)
                .font(.hayame(size: 15, weight: .medium))
                .foregroundStyle(HayameTheme.brandNavy)
                .focused($searchFocused)
                .submitLabel(.search)
                .autocorrectionDisabled()
            if !search.isEmpty {
                Button {
                    HayameHaptics.light()
                    withAnimation(HayameMotion.snappy) { search = "" }
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.hayame(size: 15, weight: .bold))
                        .foregroundStyle(HayameTheme.mutedText)
                }
                .buttonStyle(.plain)
                .transition(.scale.combined(with: .opacity))
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(HayameTheme.fieldBackground, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(searchFocused ? HayameTheme.brandBlue.opacity(0.55) : HayameTheme.cardStroke, lineWidth: 1)
        )
        .animation(HayameMotion.snappy, value: search.isEmpty)
        .animation(HayameMotion.snappy, value: searchFocused)
    }

    private var unreadToggle: some View {
        HStack(spacing: 8) {
            inboxChip(title: "All", isOn: !showUnreadOnly) {
                showUnreadOnly = false
            }
            inboxChip(title: "Unread", count: unreadTotal, isOn: showUnreadOnly) {
                showUnreadOnly = true
            }
            Spacer()
        }
    }

    private func inboxChip(title: String, count: Int = 0, isOn: Bool, action: @escaping () -> Void) -> some View {
        Button {
            guard !isOn else { return }
            HayameHaptics.select()
            withAnimation(HayameMotion.snappy, action)
        } label: {
            HStack(spacing: 6) {
                Text(title)
                    .font(.hayame(size: 13, weight: .bold))
                if count > 0 {
                    Text("\(count)")
                        .font(.hayame(size: 11, weight: .bold))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(isOn ? Color.white.opacity(0.22) : HayameTheme.brandBlue.opacity(0.14), in: Capsule())
                }
            }
            .foregroundStyle(isOn ? .white : HayameTheme.brandNavy)
            .padding(.horizontal, 13)
            .padding(.vertical, 8)
            .background(isOn ? HayameTheme.brandBlue : HayameTheme.chipBackground, in: Capsule())
            .overlay(Capsule().strokeBorder(isOn ? Color.clear : HayameTheme.controlStroke, lineWidth: 1))
        }
        .buttonStyle(HayamePressableStyle(scale: 0.95, haptic: false))
    }

    private var conversationList: some View {
        VStack(spacing: 0) {
            ForEach(Array(filtered.enumerated()), id: \.element.id) { index, conversation in
                Button {
                    HayameHaptics.light()
                    openConversation(conversation)
                } label: {
                    ConversationRowView(conversation: conversation)
                }
                .buttonStyle(HayamePressableStyle(scale: 0.985, haptic: false))
                .coachMark(index == 0 ? "inbox.first" : "inbox.row-\(conversation.id)")
                .hayameAppear(index: min(index, 8) + 2)
                .transition(.asymmetric(insertion: .opacity, removal: .opacity.combined(with: .scale(scale: 0.96))))

                if index < filtered.count - 1 {
                    inboxDivider
                }
            }
        }
    }

    private var inboxDivider: some View {
        Rectangle()
            .fill(HayameTheme.cardStroke)
            .frame(height: 1)
            .padding(.leading, 68)
    }

    private var noMatchState: some View {
        VStack(spacing: 10) {
            Image(systemName: showUnreadOnly ? "checkmark.circle" : "magnifyingglass")
                .font(.hayame(size: 28, weight: .bold))
                .foregroundStyle(HayameTheme.brandBlue)
            Text(showUnreadOnly ? "Nothing unread" : "No matches")
                .font(.hayame(size: 16, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
            Text(showUnreadOnly ? "You have read every message." : "Try another name or a word from the chat.")
                .font(.hayame(size: 13, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 36)
    }

    // MARK: Actions

    private func openConversation(_ conversation: Conversation) {
        appState.markConversationRead(conversation.id)
        activeChatTarget = TripChatTarget(id: conversation.id, participantName: conversation.participantName)
    }

    private func openPendingConversationIfNeeded() {
        guard let pendingID = appState.pendingConversationID else { return }
        let participantName = appState.conversations.first(where: { $0.id == pendingID })?.participantName ??
            appState.pendingConversationParticipantName ??
            "Chat"
        activeChatTarget = TripChatTarget(id: pendingID, participantName: participantName)
        appState.pendingConversationID = nil
        appState.pendingConversationParticipantName = nil
    }
}

/// One person in the inbox. Unread conversations get the ring, bold text and
/// a count pill; everything else stays quiet.
struct ConversationRowView: View {
    let conversation: Conversation

    private var isUnread: Bool { conversation.unreadCount > 0 }

    var body: some View {
        HStack(spacing: 14) {
            ConversationAvatar(
                name: conversation.participantName,
                avatarURL: conversation.participantAvatar,
                size: 54,
                highlighted: isUnread
            )

            VStack(alignment: .leading, spacing: 4) {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(conversation.participantName)
                        .font(.hayame(size: 16, weight: isUnread ? .bold : .semibold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .lineLimit(1)
                    Spacer(minLength: 8)
                    Text(HayameRelativeTime.inboxLabel(conversation.updatedAt))
                        .font(.hayame(size: 12, weight: isUnread ? .bold : .medium))
                        .foregroundStyle(isUnread ? HayameTheme.brandBlue : HayameTheme.mutedText)
                }

                HStack(alignment: .top, spacing: 10) {
                    Text(conversation.lastMessagePreview.isEmpty ? "Say hello" : conversation.lastMessagePreview)
                        .font(.hayame(size: 14, weight: isUnread ? .semibold : .medium))
                        .foregroundStyle(isUnread ? HayameTheme.brandNavy.opacity(0.9) : HayameTheme.mutedText)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    Spacer(minLength: 0)
                    if isUnread {
                        Text(conversation.unreadCount > 99 ? "99+" : "\(conversation.unreadCount)")
                            .font(.hayame(size: 11, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 3)
                            .background(HayameTheme.brandBlue, in: Capsule())
                            .transition(.scale.combined(with: .opacity))
                    }
                }
            }
        }
        .padding(.vertical, 12)
        .contentShape(Rectangle())
        .animation(HayameMotion.snappy, value: isUnread)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(conversation.participantName), \(isUnread ? "\(conversation.unreadCount) unread" : "read")")
    }
}

/// Shimmer stand-in with the same anatomy as `ConversationRowView`.
struct ConversationPlaceholderRow: View {
    var body: some View {
        HStack(spacing: 14) {
            SkeletonBlock(width: 54, height: 54, cornerRadius: 27)
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    SkeletonBlock(width: 128, height: 14, cornerRadius: 6)
                    Spacer()
                    SkeletonBlock(width: 30, height: 10, cornerRadius: 5)
                }
                SkeletonBlock(width: 210, height: 12, cornerRadius: 6)
            }
        }
        .padding(.vertical, 12)
    }
}

private struct InboxEmptyState: View {
    let systemImage: String
    let title: String
    let message: String
    var actionTitle: String?
    let action: () -> Void

    var body: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(HayameTheme.brandBlue.opacity(0.12))
                    .frame(width: 84, height: 84)
                Image(systemName: systemImage)
                    .font(.hayame(size: 32, weight: .bold))
                    .foregroundStyle(HayameTheme.brandBlue)
            }
            Text(title)
                .font(.hayame(size: 19, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
            Text(message)
                .font(.hayame(size: 14, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
            if let actionTitle {
                Button(actionTitle, action: action)
                    .buttonStyle(SolidPillButtonStyle())
                    .frame(maxWidth: 220)
                    .padding(.top, 4)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 24)
        .padding(.vertical, 40)
    }
}

// MARK: - Thread

struct ChatThreadScreen: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss
    let conversationID: String
    let participantName: String

    @State private var draft = ""
    @State private var isNearBottom = true
    @State private var listingTarget: Car?
    @FocusState private var composerFocused: Bool

    private static let bottomAnchor = "chat-thread-bottom"

    private var conversation: Conversation? {
        appState.conversations.first { $0.id == conversationID }
    }

    private var displayName: String {
        conversation?.participantName ?? participantName
    }

    private var linkedCar: Car? {
        guard let carID = conversation?.carID else { return nil }
        return appState.cars.first { $0.id == carID } ?? appState.hostCars.first { $0.id == carID }
    }

    private var messages: [ChatMessage] {
        appState.messagesByConversation[conversationID] ?? []
    }

    private var messageIDs: [String] {
        messages.map(\.id)
    }

    private var canSend: Bool {
        appState.isAuthenticated && !draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private var quickPrompts: [String] {
        appState.hostModeEnabled
            ? ["Thanks for booking! Pickup is at 10 AM.", "Please bring your ID and licence.", "The car is ready when you are."]
            : ["Is the car available on these dates?", "Where is the pickup point?", "Can you deliver to me?"]
    }

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView(showsIndicators: false) {
                LazyVStack(spacing: 0) {
                    if messages.isEmpty {
                        emptyThread
                            .padding(.top, 40)
                            .transition(.opacity)
                    }

                    ForEach(rows) { row in
                        switch row.kind {
                        case .day(let label):
                            ChatDayDivider(label: label)
                                .padding(.vertical, 12)
                                .transition(.opacity)
                        case .message(let message, let isFirst, let isLast):
                            ChatBubble(message: message, isFirstInRun: isFirst, isLastInRun: isLast) {
                                appState.retryMessage(conversationID: conversationID, messageID: message.id)
                            }
                            .id(message.id)
                            .padding(.top, isFirst ? 10 : 2)
                            .transition(
                                .asymmetric(
                                    insertion: .scale(scale: 0.86, anchor: message.isMine ? .bottomTrailing : .bottomLeading)
                                        .combined(with: .opacity)
                                        .combined(with: .offset(y: 10)),
                                    removal: .opacity
                                )
                            )
                        }
                    }

                    Color.clear
                        .frame(height: 1)
                        .id(Self.bottomAnchor)
                        .onAppear { isNearBottom = true }
                        .onDisappear { isNearBottom = false }
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 10)
                .animation(HayameMotion.snappy, value: messageIDs)
            }
            .scrollDismissesKeyboard(.interactively)
            .overlay(alignment: .bottomTrailing) {
                if !isNearBottom && messages.count > 2 {
                    Button {
                        HayameHaptics.light()
                        withAnimation(HayameMotion.settle) {
                            proxy.scrollTo(Self.bottomAnchor, anchor: .bottom)
                        }
                    } label: {
                        Image(systemName: "chevron.down")
                            .font(.hayame(size: 14, weight: .bold))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .frame(width: 38, height: 38)
                            .background(HayameTheme.floatingControlBackground, in: Circle())
                            .overlay(Circle().strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
                            .shadow(color: HayameTheme.cardShadow, radius: 10, x: 0, y: 4)
                    }
                    .buttonStyle(HayamePressableStyle(scale: 0.9, haptic: false))
                    .padding(.trailing, 16)
                    .padding(.bottom, 10)
                    .transition(.scale.combined(with: .opacity))
                    .accessibilityLabel("Jump to latest message")
                }
            }
            .animation(HayameMotion.snappy, value: isNearBottom)
            .safeAreaInset(edge: .top, spacing: 0) {
                threadHeader
            }
            .safeAreaInset(edge: .bottom, spacing: 0) {
                composer
            }
            .onAppear {
                appState.startRealtimeMessages(for: conversationID)
                if draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
                   let queuedDraft = appState.consumePendingConversationDraft(for: conversationID) {
                    draft = queuedDraft
                }
                DispatchQueue.main.async {
                    proxy.scrollTo(Self.bottomAnchor, anchor: .bottom)
                }
            }
            .onDisappear {
                appState.stopRealtimeMessages()
            }
            .onChange(of: messageIDs) { _, _ in
                withAnimation(HayameMotion.settle) {
                    proxy.scrollTo(Self.bottomAnchor, anchor: .bottom)
                }
            }
            .onChange(of: composerFocused) { _, focused in
                guard focused else { return }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                    withAnimation(HayameMotion.settle) {
                        proxy.scrollTo(Self.bottomAnchor, anchor: .bottom)
                    }
                }
            }
        }
        .background(HayameTheme.pageBackground.ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .navigationBarBackButtonHidden(true)
        .navigationDestination(item: $listingTarget) { car in
            CarDetailScreen(car: car)
                .environmentObject(appState)
        }
    }

    // MARK: Header

    private var threadHeader: some View {
        HStack(spacing: 12) {
            Button {
                dismiss()
            } label: {
                Image(systemName: "chevron.left")
                    .font(.hayame(size: 16, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .frame(width: 40, height: 40)
                    .background(HayameTheme.fieldBackground, in: Circle())
            }
            .buttonStyle(HayamePressableStyle(scale: 0.9))
            .accessibilityLabel("Back")

            ConversationAvatar(name: displayName, avatarURL: conversation?.participantAvatar, size: 40)

            VStack(alignment: .leading, spacing: 2) {
                Text(displayName)
                    .font(.hayame(size: 17, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .lineLimit(1)
                if let car = linkedCar {
                    Button {
                        HayameHaptics.light()
                        listingTarget = car
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "car.fill")
                                .font(.hayame(size: 10, weight: .bold))
                            Text(car.displayTitle)
                                .font(.hayame(size: 12, weight: .semibold))
                                .lineLimit(1)
                            Image(systemName: "chevron.right")
                                .font(.hayame(size: 9, weight: .bold))
                        }
                        .foregroundStyle(HayameTheme.brandBlue)
                    }
                    .buttonStyle(.plain)
                } else {
                    Text(appState.hostModeEnabled ? "Guest" : "Host")
                        .font(.hayame(size: 12, weight: .semibold))
                        .foregroundStyle(HayameTheme.mutedText)
                }
            }

            Spacer(minLength: 8)

            if appState.isAuthenticated {
                HayameStatusPill(text: "Live", tone: .success, isLive: true)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(HayameTheme.pageBackground)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(HayameTheme.cardStroke)
                .frame(height: 1)
        }
    }

    // MARK: Rows

    private enum ChatRowKind {
        case day(String)
        case message(ChatMessage, isFirst: Bool, isLast: Bool)
    }

    private struct ChatRow: Identifiable {
        let id: String
        let kind: ChatRowKind
    }

    /// Messages with day dividers, and run flags so bubbles from one sender in
    /// quick succession share tight corners and a single timestamp.
    private var rows: [ChatRow] {
        let calendar = Calendar.current
        var result: [ChatRow] = []
        var currentDay: Date?

        func sameRun(_ a: ChatMessage, _ b: ChatMessage) -> Bool {
            a.isMine == b.isMine
                && calendar.isDate(a.createdAt, inSameDayAs: b.createdAt)
                && abs(b.createdAt.timeIntervalSince(a.createdAt)) < 5 * 60
        }

        for (index, message) in messages.enumerated() {
            let day = calendar.startOfDay(for: message.createdAt)
            if currentDay != day {
                currentDay = day
                result.append(ChatRow(id: "day-\(Int(day.timeIntervalSince1970))", kind: .day(HayameRelativeTime.dayLabel(day))))
            }
            let previous = index > 0 ? messages[index - 1] : nil
            let next = index + 1 < messages.count ? messages[index + 1] : nil
            let isFirst = previous.map { !sameRun($0, message) } ?? true
            let isLast = next.map { !sameRun(message, $0) } ?? true
            result.append(ChatRow(id: message.id, kind: .message(message, isFirst: isFirst, isLast: isLast)))
        }
        return result
    }

    private var emptyThread: some View {
        VStack(spacing: 14) {
            ConversationAvatar(name: displayName, avatarURL: conversation?.participantAvatar, size: 76)
            Text("Say hello to \(displayName)")
                .font(.hayame(size: 18, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
            Text(linkedCar.map { "Ask anything about the \($0.displayTitle)." } ?? "Messages are delivered instantly and kept here.")
                .font(.hayame(size: 13, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .multilineTextAlignment(.center)

            if appState.isAuthenticated {
                VStack(spacing: 8) {
                    ForEach(Array(quickPrompts.enumerated()), id: \.element) { index, prompt in
                        Button {
                            HayameHaptics.select()
                            draft = prompt
                            composerFocused = true
                        } label: {
                            Text(prompt)
                                .font(.hayame(size: 13, weight: .semibold))
                                .foregroundStyle(HayameTheme.brandNavy)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 10)
                                .background(HayameTheme.chipBackground, in: Capsule())
                                .overlay(Capsule().strokeBorder(HayameTheme.controlStroke, lineWidth: 1))
                        }
                        .buttonStyle(HayamePressableStyle(scale: 0.96, haptic: false))
                        .hayameAppear(index: index + 1)
                    }
                }
                .padding(.top, 6)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 20)
    }

    // MARK: Composer

    private var composer: some View {
        HStack(alignment: .bottom, spacing: 10) {
            HStack(alignment: .bottom, spacing: 8) {
                TextField(
                    appState.isAuthenticated ? "Message \(displayName)" : "Log in to send a message",
                    text: $draft,
                    axis: .vertical
                )
                .lineLimit(1...5)
                .font(.hayame(size: 15, weight: .medium))
                .foregroundStyle(HayameTheme.brandNavy)
                .focused($composerFocused)
                .disabled(!appState.isAuthenticated)
                .padding(.vertical, 10)
            }
            .padding(.horizontal, 16)
            .background(HayameTheme.fieldBackground, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .strokeBorder(composerFocused ? HayameTheme.brandBlue.opacity(0.55) : HayameTheme.cardStroke, lineWidth: 1)
            )

            Button(action: send) {
                Image(systemName: "arrow.up")
                    .font(.hayame(size: 17, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 42, height: 42)
                    .background(HayameTheme.brandBlue, in: Circle())
            }
            .buttonStyle(HayamePressableStyle(scale: 0.88))
            .disabled(!canSend)
            .scaleEffect(canSend ? 1 : 0.4)
            .opacity(canSend ? 1 : 0)
            .frame(width: canSend ? 42 : 0, height: 42)
            .accessibilityLabel("Send")
        }
        .padding(.horizontal, 12)
        .padding(.top, 10)
        .padding(.bottom, 10)
        .background(HayameTheme.pageBackground)
        .overlay(alignment: .top) {
            Rectangle()
                .fill(HayameTheme.cardStroke)
                .frame(height: 1)
        }
        .animation(HayameMotion.bouncy, value: canSend)
        .animation(HayameMotion.snappy, value: composerFocused)
    }

    private func send() {
        let outgoing = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !outgoing.isEmpty else { return }
        HayameHaptics.medium()
        appState.addMessage(conversationID: conversationID, body: outgoing, mine: true)
        draft = ""
    }
}

/// "Today", "Yesterday" or the date, centred between runs of messages.
private struct ChatDayDivider: View {
    let label: String

    var body: some View {
        Text(label)
            .font(.hayame(size: 11, weight: .bold))
            .foregroundStyle(HayameTheme.mutedText)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(HayameTheme.subtleFill, in: Capsule())
            .frame(maxWidth: .infinity)
    }
}

/// One message. Mine sit on the right in brand blue; theirs on the left on a
/// card. Corners tighten between messages of the same run, the last bubble in
/// a run carries the timestamp or delivery state, and tapping any bubble shows
/// its time.
struct ChatBubble: View {
    let message: ChatMessage
    var isFirstInRun = true
    var isLastInRun = true
    var onRetry: (() -> Void)? = nil

    @State private var showsTime = false

    private var isMine: Bool { message.isMine }

    private var bubbleShape: UnevenRoundedRectangle {
        let tight: CGFloat = 6
        let round: CGFloat = 18
        if isMine {
            return UnevenRoundedRectangle(
                topLeadingRadius: round,
                bottomLeadingRadius: round,
                bottomTrailingRadius: isLastInRun ? 5 : tight,
                topTrailingRadius: isFirstInRun ? round : tight,
                style: .continuous
            )
        }
        return UnevenRoundedRectangle(
            topLeadingRadius: isFirstInRun ? round : tight,
            bottomLeadingRadius: isLastInRun ? 5 : tight,
            bottomTrailingRadius: round,
            topTrailingRadius: round,
            style: .continuous
        )
    }

    private var showsMeta: Bool {
        isLastInRun || showsTime || message.deliveryState != .sent
    }

    var body: some View {
        VStack(alignment: isMine ? .trailing : .leading, spacing: 4) {
            HStack(spacing: 0) {
                if isMine { Spacer(minLength: 56) }
                Text(message.body)
                    .font(.hayame(size: 15, weight: .medium))
                    .foregroundStyle(isMine ? .white : HayameTheme.brandNavy)
                    .multilineTextAlignment(.leading)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(isMine ? HayameTheme.brandBlue : HayameTheme.cardBackground, in: bubbleShape)
                    .overlay(bubbleShape.strokeBorder(isMine ? Color.clear : HayameTheme.cardStroke, lineWidth: 1))
                    .opacity(message.deliveryState == .sending ? 0.72 : 1)
                    .contentShape(bubbleShape)
                    .onTapGesture {
                        withAnimation(HayameMotion.snappy) { showsTime.toggle() }
                    }
                if !isMine { Spacer(minLength: 56) }
            }

            if showsMeta {
                meta
                    .padding(.horizontal, 4)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .frame(maxWidth: .infinity, alignment: isMine ? .trailing : .leading)
        .animation(HayameMotion.snappy, value: message.deliveryState)
    }

    @ViewBuilder
    private var meta: some View {
        switch message.deliveryState {
        case .sending:
            HStack(spacing: 5) {
                ProgressView()
                    .controlSize(.mini)
                    .tint(HayameTheme.mutedText)
                Text("Sending")
                    .font(.hayame(size: 11, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
            }
        case .failed:
            Button {
                HayameHaptics.warning()
                onRetry?()
            } label: {
                HStack(spacing: 5) {
                    Image(systemName: "exclamationmark.circle.fill")
                        .font(.hayame(size: 11, weight: .bold))
                    Text("Not sent. Tap to retry")
                        .font(.hayame(size: 11, weight: .bold))
                }
                .foregroundStyle(HayameTheme.danger)
            }
            .buttonStyle(.plain)
        case .sent:
            Text(message.createdAt.hayameTimeLabel())
                .font(.hayame(size: 11, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
        }
    }
}

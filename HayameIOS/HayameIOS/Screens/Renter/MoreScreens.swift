import SwiftUI
import UIKit

// MARK: - More tab
//
// The More tab is the front door to the account: a profile hero, quick actions,
// hosting, and the way into Settings. Every section settles into place with a
// staggered spring, cards respond to touch, and remote data shows skeletons
// instead of empty gaps while it loads.

struct MoreScreen: View {
    @EnvironmentObject private var appState: AppState
    @Binding var requestedRoute: MoreRoute?
    @State private var activeMoreRoute: MoreRoute?
    @State private var showSettings = false
    @State private var settingsHighlightsAppearance = false

    init(requestedRoute: Binding<MoreRoute?> = .constant(nil)) {
        _requestedRoute = requestedRoute
    }

    private var isAdmin: Bool { appState.currentUser.role == .admin }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 18) {
                header

                if appState.isAuthenticated {
                    if isProfileLoading {
                        MoreHeroSkeleton()
                            .transition(.opacity)
                    } else {
                        profileHero
                            .coachMark("more.profile")
                            .hayameAppear(index: 0)
                            .transition(.opacity.combined(with: .scale(scale: 0.98)))
                    }
                } else {
                    guestHero
                        .coachMark("more.profile")
                        .hayameAppear(index: 0)
                }

                quickActions
                    .coachMark("more.quick")
                    .coachTour(.more)
                    .hayameAppear(index: 1)

                hostingCard
                    .hayameAppear(index: 2)

                settingsGroup
                    .hayameAppear(index: 3)

                supportGroup
                    .hayameAppear(index: 4)

                if isAdmin {
                    adminGroup
                        .hayameAppear(index: 5)
                }

                footer
                    .hayameAppear(index: 6)
            }
            .padding(16)
            .animation(HayameMotion.settle, value: isProfileLoading)
        }
        .background(HayameTheme.pageBackground)
        .toolbar(.hidden, for: .navigationBar)
        .refreshable { await appState.refreshAllRemoteData() }
        .navigationDestination(item: $activeMoreRoute) { route in
            switch route {
            case .messages:
                InboxScreen()
                    .environmentObject(appState)
            case .dashboard:
                RenterDashboardScreen()
                    .environmentObject(appState)
            }
        }
        .navigationDestination(isPresented: $showSettings) {
            SettingsScreen(highlightAppearance: settingsHighlightsAppearance)
                .environmentObject(appState)
                .onDisappear { settingsHighlightsAppearance = false }
        }
        .onAppear { consumeRequestedRouteIfNeeded() }
        .onChange(of: requestedRoute) { _, _ in consumeRequestedRouteIfNeeded() }
        .onChange(of: appState.appearanceSettingsHighlightToken) { _, token in
            guard token > 0 else { return }
            settingsHighlightsAppearance = true
            showSettings = true
        }
    }

    // While the first remote sync is still filling in the signed-in profile.
    private var isProfileLoading: Bool {
        appState.isSyncingRemote && appState.currentUser.email.isEmpty
    }

    // MARK: Sections

    private var header: some View {
        HStack(alignment: .center) {
            Text("More")
                .font(.hayame(size: 30, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
            Spacer()
            if appState.isSyncingRemote {
                HayameStatusPill(text: "Syncing", tone: .info, isLive: true)
                    .transition(.scale.combined(with: .opacity))
            }
            Button {
                HayameHaptics.light()
                showSettings = true
            } label: {
                Image(systemName: "gearshape.fill")
                    .font(.hayame(size: 17, weight: .semibold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .frame(width: 40, height: 40)
                    .background(HayameTheme.cardBackground, in: Circle())
                    .overlay(Circle().strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
                    .shadow(color: HayameTheme.cardShadow, radius: 8, x: 0, y: 4)
            }
            .buttonStyle(HayamePressableStyle(scale: 0.9))
            .accessibilityLabel("Settings")
            .coachMark("more.settings")
        }
        .animation(HayameMotion.snappy, value: appState.isSyncingRemote)
    }

    private var profileHero: some View {
        NavigationLink {
            ProfileScreen()
                .environmentObject(appState)
        } label: {
            HStack(spacing: 14) {
                HayameAvatarRing(size: 66, lineWidth: 2.5, colors: [.white, .white.opacity(0.25), .white]) {
                    ProfileAvatarView(size: 54, textSize: 18, onBrand: true)
                }

                VStack(alignment: .leading, spacing: 5) {
                    Text(appState.currentUser.fullName.isEmpty ? "Your profile" : appState.currentUser.fullName)
                        .font(.hayame(size: 20, weight: .bold))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                    Text(appState.currentUser.email)
                        .font(.hayame(size: 13, weight: .medium))
                        .foregroundStyle(.white.opacity(0.78))
                        .lineLimit(1)
                    HStack(spacing: 8) {
                        HayameProgressBar(
                            fraction: ProfileCompleteness(user: appState.currentUser).fraction,
                            tint: .white,
                            track: .white.opacity(0.22),
                            height: 4
                        )
                        .frame(width: 92)
                        Text("\(ProfileCompleteness(user: appState.currentUser).percent)% complete")
                            .font(.hayame(size: 11, weight: .bold))
                            .foregroundStyle(.white.opacity(0.9))
                    }
                    .padding(.top, 2)
                }

                Spacer(minLength: 8)

                Image(systemName: "chevron.right")
                    .font(.hayame(size: 14, weight: .bold))
                    .foregroundStyle(.white.opacity(0.8))
            }
            .padding(18)
            .background(BrandHeroBackground())
            .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
            .shadow(color: HayameTheme.brandBlue.opacity(0.28), radius: 16, x: 0, y: 8)
        }
        .buttonStyle(HayamePressableStyle())
    }

    private var guestHero: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 14) {
                ZStack {
                    Circle().fill(.white.opacity(0.18))
                    Image(systemName: "person.crop.circle")
                        .font(.hayame(size: 30, weight: .medium))
                        .foregroundStyle(.white)
                }
                .frame(width: 58, height: 58)

                VStack(alignment: .leading, spacing: 4) {
                    Text("Browsing as a guest")
                        .font(.hayame(size: 19, weight: .bold))
                        .foregroundStyle(.white)
                    Text("Sign in to book cars, message hosts and keep your favourites.")
                        .font(.hayame(size: 13, weight: .medium))
                        .foregroundStyle(.white.opacity(0.8))
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            Button {
                HayameHaptics.medium()
                appState.returnToAuth()
            } label: {
                Text("Log in / Sign up")
                    .font(.hayame(size: 15, weight: .bold))
                    .foregroundStyle(HayameTheme.brandBlue)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(.white, in: Capsule())
            }
            .buttonStyle(HayamePressableStyle())
        }
        .padding(18)
        .background(BrandHeroBackground())
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .shadow(color: HayameTheme.brandBlue.opacity(0.28), radius: 16, x: 0, y: 8)
    }

    private var quickActions: some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
            QuickActionTile(title: "Trips", subtitle: tripsSubtitle, systemImage: "calendar", tint: HayameTheme.brandBlue, index: 0) {
                appState.renterTab = .trips
            }
            QuickActionTile(title: "Messages", subtitle: messagesSubtitle, systemImage: "bubble.left.and.bubble.right.fill", tint: HayameTheme.success, badge: appState.unreadMessagesCount, index: 1) {
                open(.messages)
            }
            QuickActionTile(title: "Saved", subtitle: savedSubtitle, systemImage: "heart.fill", tint: HayameTheme.danger, index: 2) {
                appState.renterTab = .favorites
            }
            QuickActionTile(title: "Dashboard", subtitle: "Spend & activity", systemImage: "chart.bar.xaxis", tint: HayameTheme.warning, index: 3) {
                open(.dashboard)
            }
        }
    }

    private var tripsSubtitle: String {
        guard appState.isAuthenticated else { return "Sign in to see trips" }
        let count = appState.renterBookings.count
        return count == 0 ? "No trips yet" : "\(count) \(count == 1 ? "trip" : "trips")"
    }

    private var messagesSubtitle: String {
        guard appState.isAuthenticated else { return "Chat with hosts" }
        let unread = appState.unreadMessagesCount
        return unread == 0 ? "All caught up" : "\(unread) unread"
    }

    private var savedSubtitle: String {
        let count = appState.favoriteCarIDs.count
        return count == 0 ? "Nothing saved yet" : "\(count) \(count == 1 ? "car" : "cars")"
    }

    private var hostingCard: some View {
        HayameGroupCard(title: "Hosting") {
            HostingSection()
        }
    }

    private var settingsGroup: some View {
        HayameGroupCard(title: "Preferences") {
            HayameActionRow(
                icon: "gearshape.fill",
                tint: HayameTheme.brandNavy,
                title: "Settings",
                subtitle: "Appearance, app icon, notifications, privacy"
            ) {
                showSettings = true
            }
        }
    }

    private var supportGroup: some View {
        HayameGroupCard(title: "Support & legal") {
            HayameNavRow(icon: "envelope.fill", tint: HayameTheme.brandBlue, title: "Contact us", subtitle: "We reply within a day") {
                ContactScreen()
            }
            HayameRowDivider()
            HayameNavRow(icon: "shield.lefthalf.filled", tint: HayameTheme.success, title: "Protection", subtitle: "What's covered on every trip") {
                ProtectionScreen()
            }
            HayameRowDivider()
            HayameNavRow(icon: "calendar.badge.clock", tint: HayameTheme.warning, title: "Cancellation policy", subtitle: "Refund tiers and timing") {
                CancellationPolicyScreen()
            }
            HayameRowDivider()
            HayameNavRow(icon: "hand.raised.fill", tint: HayameTheme.mutedText, title: "Privacy", subtitle: "How we handle your data") {
                PrivacyScreen()
            }
        }
    }

    private var adminGroup: some View {
        HayameGroupCard(title: "Admin") {
            HayameNavRow(icon: "checkmark.shield.fill", tint: HayameTheme.brandBlue, title: "Admin panel", subtitle: "Approvals, listings and users") {
                AdminShellScreen()
            }
        }
    }

    private var footer: some View {
        VStack(spacing: 12) {
            if let message = appState.syncErrorMessage, !message.isEmpty {
                Text(message)
                    .font(.hayame(size: 12, weight: .semibold))
                    .foregroundStyle(HayameTheme.danger)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            if appState.isAuthenticated {
                Button(role: .destructive) {
                    HayameHaptics.warning()
                    appState.signOut()
                } label: {
                    Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                        .font(.hayame(size: 15, weight: .semibold))
                        .foregroundStyle(HayameTheme.danger)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 13)
                        .background(HayameTheme.cardBackground, in: Capsule())
                        .overlay(Capsule().strokeBorder(HayameTheme.danger.opacity(0.25), lineWidth: 1))
                }
                .buttonStyle(HayamePressableStyle())
            }

            Text("Hayame \(AppVersion.display)")
                .font(.hayame(size: 11, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .padding(.top, 4)
        }
        .padding(.bottom, 8)
    }

    private func open(_ route: MoreRoute) {
        HayameHaptics.tap()
        activeMoreRoute = route
    }

    private func consumeRequestedRouteIfNeeded() {
        guard let requestedRoute else { return }
        activeMoreRoute = requestedRoute
        self.requestedRoute = nil
    }
}

// MARK: - Profile page

struct ProfileScreen: View {
    @EnvironmentObject private var appState: AppState
    @State private var showEditProfile = false
    @State private var statsRevealed = false

    private var user: UserProfile { appState.currentUser }
    private var completeness: ProfileCompleteness { ProfileCompleteness(user: user) }

    private var isHeaderLoading: Bool {
        appState.isAuthenticated && appState.isSyncingRemote && user.email.isEmpty
    }

    private var isStatsLoading: Bool {
        appState.bookingsLoadState == .loading || appState.favoritesLoadState == .loading
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 18) {
                if isHeaderLoading {
                    ProfileHeaderSkeleton()
                } else {
                    heroHeader
                        .hayameAppear(index: 0, offsetY: 10, scale: 0.96)
                }

                statsRow
                    .hayameAppear(index: 1)

                if appState.isAuthenticated && completeness.fraction < 1 {
                    completenessCard
                        .hayameAppear(index: 2)
                }

                detailsCard
                    .hayameAppear(index: 3)

                HayameGroupCard(title: "Hosting") {
                    HostingSection()
                }
                .hayameAppear(index: 4)

                if appState.isAuthenticated {
                    Button(role: .destructive) {
                        HayameHaptics.warning()
                        appState.signOut()
                    } label: {
                        Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                            .font(.hayame(size: 15, weight: .semibold))
                            .foregroundStyle(HayameTheme.danger)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 13)
                            .background(HayameTheme.cardBackground, in: Capsule())
                            .overlay(Capsule().strokeBorder(HayameTheme.danger.opacity(0.25), lineWidth: 1))
                    }
                    .buttonStyle(HayamePressableStyle())
                    .hayameAppear(index: 5)
                }
            }
            .padding(16)
            .animation(HayameMotion.settle, value: isHeaderLoading)
            .animation(HayameMotion.settle, value: isStatsLoading)
        }
        .background(HayameTheme.pageBackground.ignoresSafeArea())
        .navigationTitle("Profile")
        .navigationBarTitleDisplayMode(.inline)
        .hayameBarBackground()
        .toolbar {
            if appState.isAuthenticated {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Edit") { showEditProfile = true }
                        .font(.hayame(size: 15, weight: .semibold))
                }
            }
        }
        .refreshable { await appState.refreshAllRemoteData() }
        .sheet(isPresented: $showEditProfile) {
            ProfileEditSheet()
                .environmentObject(appState)
        }
        .onAppear {
            withAnimation(HayameMotion.respecting(HayameMotion.gentle).delay(0.3)) {
                statsRevealed = true
            }
        }
    }

    private var heroHeader: some View {
        VStack(spacing: 14) {
            ZStack(alignment: .bottomTrailing) {
                HayameAvatarRing(size: 112, lineWidth: 3) {
                    ProfileAvatarView(size: 96, textSize: 32, onBrand: false)
                }
                if appState.isAuthenticated {
                    Button {
                        showEditProfile = true
                    } label: {
                        Image(systemName: "camera.fill")
                            .font(.hayame(size: 12, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(width: 32, height: 32)
                            .background(HayameTheme.brandBlue, in: Circle())
                            .overlay(Circle().strokeBorder(HayameTheme.pageBackground, lineWidth: 3))
                    }
                    .buttonStyle(HayamePressableStyle(scale: 0.88))
                    .offset(x: 2, y: 2)
                }
            }

            VStack(spacing: 6) {
                Text(appState.isAuthenticated ? user.fullName : "Guest")
                    .font(.hayame(size: 26, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .multilineTextAlignment(.center)
                if appState.isAuthenticated {
                    Text(user.email)
                        .font(.hayame(size: 14, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                }
            }

            HStack(spacing: 8) {
                RoleChip(text: roleLabel, systemImage: roleIcon)
                if !locationLabel.isEmpty {
                    RoleChip(text: locationLabel, systemImage: "mappin.and.ellipse")
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 8)
    }

    private var roleLabel: String {
        if user.role == .admin { return "Admin" }
        if appState.hostAccessState == .host { return "Host" }
        return appState.isAuthenticated ? "Renter" : "Guest"
    }

    private var roleIcon: String {
        if user.role == .admin { return "checkmark.shield.fill" }
        if appState.hostAccessState == .host { return "key.fill" }
        return "car.fill"
    }

    private var locationLabel: String {
        [user.city, user.region]
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: ", ")
    }

    private var statsRow: some View {
        HStack(spacing: 12) {
            if isStatsLoading {
                ForEach(0..<3, id: \.self) { _ in
                    SkeletonBlock(height: 78, cornerRadius: 18)
                }
            } else {
                ProfileStatTile(value: appState.renterBookings.count, title: "Trips", systemImage: "calendar", tint: HayameTheme.brandBlue, revealed: statsRevealed) {
                    appState.renterTab = .trips
                }
                ProfileStatTile(value: appState.favoriteCarIDs.count, title: "Saved", systemImage: "heart.fill", tint: HayameTheme.danger, revealed: statsRevealed) {
                    appState.renterTab = .favorites
                }
                ProfileStatTile(value: appState.conversations.count, title: "Chats", systemImage: "bubble.left.fill", tint: HayameTheme.success, revealed: statsRevealed, action: nil)
            }
        }
    }

    private var completenessCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label("Complete your profile", systemImage: "sparkles")
                    .font(.hayame(size: 15, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Spacer()
                Text("\(statsRevealed ? completeness.percent : 0)%")
                    .font(.hayame(size: 15, weight: .bold))
                    .foregroundStyle(HayameTheme.brandBlue)
                    .contentTransition(.numericText(value: Double(completeness.percent)))
                    .animation(HayameMotion.gentle, value: statsRevealed)
            }
            HayameProgressBar(fraction: statsRevealed ? completeness.fraction : 0, height: 8)
            Text("Hosts approve faster when they can see who they're renting to. Add \(completeness.missingSummary).")
                .font(.hayame(size: 12, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .fixedSize(horizontal: false, vertical: true)
            Button("Finish profile") { showEditProfile = true }
                .buttonStyle(SecondaryPillButtonStyle())
        }
        .padding(16)
        .background(HayameTheme.brandLight)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(HayameTheme.brandBlue.opacity(0.18), lineWidth: 1))
    }

    private var detailsCard: some View {
        HayameGroupCard(title: "Personal details", actionTitle: appState.isAuthenticated ? "Edit" : nil, action: { showEditProfile = true }) {
            ProfileDetailRow(icon: "person.fill", title: "Full name", value: user.fullName, placeholder: "Add your name")
            HayameRowDivider()
            ProfileDetailRow(icon: "envelope.fill", title: "Email", value: user.email, placeholder: "Not set")
            HayameRowDivider()
            ProfileDetailRow(icon: "phone.fill", title: "Phone", value: user.phone, placeholder: "Add a phone number")
            HayameRowDivider()
            ProfileDetailRow(icon: "mappin.and.ellipse", title: "Location", value: locationLabel, placeholder: "Add your city")
        }
    }
}

// MARK: - Settings

struct SettingsScreen: View {
    var highlightAppearance = false

    @EnvironmentObject private var appState: AppState
    @ObservedObject private var iconManager = AppIconManager.shared
    @State private var analyticsEnabled = AnalyticsService.shared.hasConsent
    @State private var glowAppearance = false
    @State private var showEditProfile = false
    @ObservedObject private var coachMarks = CoachMarkCenter.shared
    @State private var tipsReplayed = false
    /// Short confirmation after "Replay all tips", so the tap visibly did something.
    @State private var showTipsReplayedToast = false
    @State private var tipsToastTask: Task<Void, Never>?

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView(showsIndicators: false) {
                VStack(spacing: 18) {
                    HayameGroupCard(title: "Account") {
                        if appState.isAuthenticated {
                            HayameActionRow(icon: "person.text.rectangle.fill", tint: HayameTheme.brandBlue, title: "Edit profile", subtitle: "Name, phone, photo and location") {
                                showEditProfile = true
                            }
                            HayameRowDivider()
                            HayameNavRow(icon: "person.crop.circle.fill", tint: HayameTheme.brandNavy, title: "View profile", subtitle: "Trips, saved cars and progress") {
                                ProfileScreen()
                            }
                        } else {
                            HayameActionRow(icon: "person.crop.circle.badge.plus", tint: HayameTheme.brandBlue, title: "Log in / Sign up", subtitle: "Book cars and message hosts") {
                                appState.returnToAuth()
                            }
                        }
                    }
                    .hayameAppear(index: 0)

                    HayameGroupCard(title: "Appearance") {
                        HayameAppearanceRow()
                        HayameRowDivider()
                        AppIconPickerSection()
                            .padding(16)
                    }
                    .overlay(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .strokeBorder(HayameTheme.brandBlue.opacity(glowAppearance ? 0.95 : 0), lineWidth: 2)
                    )
                    .shadow(color: HayameTheme.brandBlue.opacity(glowAppearance ? 0.34 : 0), radius: glowAppearance ? 18 : 0, x: 0, y: 0)
                    .id("appearance")
                    .hayameAppear(index: 1)

                    HayameGroupCard(title: "Tips") {
                        HayameToggleRow(
                            icon: "sparkles",
                            tint: HayameTheme.brandBlue,
                            title: "Show tips",
                            subtitle: "Highlight key buttons the first time you open a screen",
                            isOn: Binding(
                                get: { coachMarks.tipsEnabled },
                                set: { coachMarks.setTipsEnabled($0) }
                            )
                        )
                        HayameRowDivider()
                        HayameActionRow(
                            icon: tipsReplayed ? "checkmark.circle.fill" : "arrow.counterclockwise",
                            tint: tipsReplayed ? HayameTheme.success : HayameTheme.warning,
                            title: "Replay all tips",
                            subtitle: tipsReplayed
                                ? "Tips are on again. They'll show as you open each screen."
                                : "See every screen's tips again"
                        ) {
                            coachMarks.replayAll()
                            HayameHaptics.success()
                            withAnimation(HayameMotion.snappy) {
                                tipsReplayed = true
                                showTipsReplayedToast = true
                            }
                            tipsToastTask?.cancel()
                            tipsToastTask = Task { @MainActor in
                                try? await Task.sleep(nanoseconds: 2_800_000_000)
                                guard !Task.isCancelled else { return }
                                withAnimation(HayameMotion.settle) { showTipsReplayedToast = false }
                            }
                        }
                    }
                    .hayameAppear(index: 2)

                    if appState.isAuthenticated {
                        HayameGroupCard(title: "Notifications") {
                            HayameToggleRow(icon: "calendar.badge.checkmark", tint: HayameTheme.brandBlue, title: "Trips & bookings", subtitle: "Approvals, changes and trip reminders", isOn: Binding(
                                get: { appState.notificationPreferences.bookingUpdates },
                                set: { appState.updateNotificationPreference(bookingUpdates: $0) }
                            ))
                            HayameRowDivider()
                            HayameToggleRow(icon: "bubble.left.and.bubble.right.fill", tint: HayameTheme.success, title: "Messages", subtitle: "New chats and replies", isOn: Binding(
                                get: { appState.notificationPreferences.messages },
                                set: { appState.updateNotificationPreference(messages: $0) }
                            ))
                            HayameRowDivider()
                            HayameToggleRow(icon: "lock.shield.fill", tint: HayameTheme.brandNavy, title: "Account & security", subtitle: "Verification, login and account notices", isOn: Binding(
                                get: { appState.notificationPreferences.accountSecurity },
                                set: { appState.updateNotificationPreference(accountSecurity: $0) }
                            ))
                            HayameRowDivider()
                            HayameToggleRow(icon: "megaphone.fill", tint: HayameTheme.warning, title: "News & announcements", subtitle: "Optional product updates and offers", isOn: Binding(
                                get: { appState.notificationPreferences.newsAnnouncements },
                                set: { appState.updateNotificationPreference(newsAnnouncements: $0) }
                            ))
                        }
                        .hayameAppear(index: 2)
                    }

                    HayameGroupCard(title: "Privacy") {
                        // App Review Guideline 5.1.1(ii): an easy, understandable way
                        // to withdraw consent for usage-data collection.
                        HayameToggleRow(icon: "chart.bar.xaxis", tint: HayameTheme.brandBlue, title: "Share usage analytics", subtitle: "Which cars people look for and where booking gets stuck", isOn: Binding(
                            get: { analyticsEnabled },
                            set: { enabled in
                                AnalyticsService.shared.setConsent(enabled ? .granted : .denied)
                                analyticsEnabled = enabled
                            }
                        ))
                        Text("We never track you across other apps or sell your data. Turning this off deletes the analytics id stored on this device.")
                            .font(.hayame(size: 12, weight: .medium))
                            .foregroundStyle(HayameTheme.mutedText)
                            .padding(.horizontal, 16)
                            .padding(.bottom, 14)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .hayameAppear(index: 3)

                    HayameGroupCard(title: "Hosting") {
                        HostingSection()
                    }
                    .hayameAppear(index: 4)

                    HayameGroupCard(title: "About") {
                        HayameNavRow(icon: "hand.raised.fill", tint: HayameTheme.mutedText, title: "Privacy policy", subtitle: nil) {
                            PrivacyScreen()
                        }
                        HayameRowDivider()
                        HayameNavRow(icon: "calendar.badge.clock", tint: HayameTheme.warning, title: "Cancellation policy", subtitle: nil) {
                            CancellationPolicyScreen()
                        }
                        HayameRowDivider()
                        HayameNavRow(icon: "shield.lefthalf.filled", tint: HayameTheme.success, title: "Protection", subtitle: nil) {
                            ProtectionScreen()
                        }
                        HayameRowDivider()
                        HayameRowLabel(icon: "info.circle.fill", tint: HayameTheme.brandNavy, title: "Version", subtitle: nil) {
                            Text(AppVersion.display)
                                .font(.hayame(size: 13, weight: .semibold))
                                .foregroundStyle(HayameTheme.mutedText)
                        }
                    }
                    .hayameAppear(index: 5)

                    if appState.isAuthenticated {
                        Button(role: .destructive) {
                            HayameHaptics.warning()
                            appState.signOut()
                        } label: {
                            Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                                .font(.hayame(size: 15, weight: .semibold))
                                .foregroundStyle(HayameTheme.danger)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 13)
                                .background(HayameTheme.cardBackground, in: Capsule())
                                .overlay(Capsule().strokeBorder(HayameTheme.danger.opacity(0.25), lineWidth: 1))
                        }
                        .buttonStyle(HayamePressableStyle())
                        .hayameAppear(index: 6)
                    }
                }
                .padding(16)
            }
            .background(HayameTheme.pageBackground.ignoresSafeArea())
            .overlay(alignment: .bottom) {
                if showTipsReplayedToast {
                    SettingsConfirmationToast(
                        systemImage: "sparkles",
                        title: "Tips are back on",
                        message: "Open any screen to see its tips again."
                    )
                    .padding(.horizontal, 16)
                    .padding(.bottom, 12)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .refreshable {
                await appState.refreshAllRemoteData()
            }
            .hayameBarBackground()
            .sheet(isPresented: $showEditProfile) {
                ProfileEditSheet()
                    .environmentObject(appState)
            }
            .onAppear {
                guard highlightAppearance else { return }
                Task { @MainActor in
                    try? await Task.sleep(nanoseconds: 350_000_000)
                    withAnimation(HayameMotion.settle) {
                        proxy.scrollTo("appearance", anchor: .center)
                        glowAppearance = true
                    }
                    try? await Task.sleep(nanoseconds: 2_800_000_000)
                    withAnimation(.easeOut(duration: 0.45)) {
                        glowAppearance = false
                    }
                }
            }
        }
    }
}

// MARK: - App icon picker

struct AppIconPickerSection: View {
    @ObservedObject private var manager = AppIconManager.shared

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                RowIcon(systemImage: "app.badge.fill", tint: HayameTheme.brandBlue)
                VStack(alignment: .leading, spacing: 2) {
                    Text("App icon")
                        .font(.hayame(size: 15, weight: .semibold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text("Pick the icon shown on your Home Screen")
                        .font(.hayame(size: 12, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                }
                Spacer()
                if manager.isChanging {
                    ProgressView()
                        .tint(HayameTheme.brandBlue)
                        .transition(.scale.combined(with: .opacity))
                }
            }

            HStack(spacing: 12) {
                ForEach(HayameAppIcon.allCases) { icon in
                    AppIconOption(icon: icon, selected: manager.current == icon, disabled: manager.isChanging || !manager.supportsAlternateIcons) {
                        HayameHaptics.select()
                        Task { await manager.select(icon) }
                    }
                }
            }
            .animation(HayameMotion.snappy, value: manager.current)
            .animation(HayameMotion.fade, value: manager.isChanging)

            if !manager.supportsAlternateIcons {
                Text("This device doesn't support changing app icons.")
                    .font(.hayame(size: 12, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
            } else if let error = manager.lastError, !error.isEmpty {
                Text(error)
                    .font(.hayame(size: 12, weight: .semibold))
                    .foregroundStyle(HayameTheme.danger)
            }
        }
    }
}

private struct AppIconOption: View {
    let icon: HayameAppIcon
    let selected: Bool
    let disabled: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 10) {
                Image(icon.previewImageName)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 66, height: 66)
                    .clipShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 15, style: .continuous)
                            .strokeBorder(selected ? HayameTheme.brandBlue : HayameTheme.cardStroke, lineWidth: selected ? 2.5 : 1)
                    )
                    .shadow(color: HayameTheme.brandBlue.opacity(selected ? 0.3 : 0), radius: 10, x: 0, y: 5)
                    .scaleEffect(selected ? 1 : 0.94)
                    .overlay(alignment: .topTrailing) {
                        if selected {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.hayame(size: 18, weight: .bold))
                                .foregroundStyle(.white, HayameTheme.brandBlue)
                                .background(Circle().fill(HayameTheme.cardBackground).padding(1))
                                .offset(x: 7, y: -7)
                                .transition(.scale.combined(with: .opacity))
                        }
                    }

                VStack(spacing: 2) {
                    Text(icon.title)
                        .font(.hayame(size: 14, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text(icon.subtitle)
                        .font(.hayame(size: 11, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(selected ? HayameTheme.brandLight : HayameTheme.fieldBackground, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(selected ? HayameTheme.brandBlue.opacity(0.35) : Color.clear, lineWidth: 1)
            )
        }
        .buttonStyle(HayamePressableStyle())
        .disabled(disabled)
        .opacity(disabled && !selected ? 0.6 : 1)
        .accessibilityLabel("\(icon.title) app icon")
        .accessibilityAddTraits(selected ? [.isButton, .isSelected] : .isButton)
    }
}

// MARK: - Hosting section (shared by More, Profile and Settings)

private struct HostingSection: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        switch appState.hostAccessState {
        case .host:
            HayameToggleRow(
                icon: "key.fill",
                tint: HayameTheme.brandBlue,
                title: "Host mode",
                subtitle: "Dashboard, listings, bookings and earnings",
                isOn: Binding(
                    get: { appState.hostModeEnabled },
                    set: { enabled in
                        withAnimation(HayameMotion.settle) {
                            appState.hostModeEnabled = enabled
                        }
                        if enabled {
                            appState.switchToHostMode()
                        } else {
                            appState.switchToGuestMode()
                        }
                    }
                )
            )
        case .pending:
            HayameNavRow(icon: "hourglass", tint: HayameTheme.warning, title: "Application under review", subtitle: "We'll notify you once it's approved") {
                BecomeHostScreen()
            }
        default:
            HayameNavRow(icon: "car.2.fill", tint: HayameTheme.success, title: "Become a host", subtitle: "List your car and start earning") {
                BecomeHostScreen()
            }
        }
    }
}

// MARK: - Building blocks

/// Rounded card with an optional section title above it. Rows inside separate
/// themselves with `HayameRowDivider`.
struct HayameGroupCard<Content: View>: View {
    var title: String? = nil
    var actionTitle: String? = nil
    var action: (() -> Void)? = nil
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if let title {
                HStack {
                    Text(title.uppercased())
                        .font(.hayame(size: 12, weight: .bold))
                        .tracking(0.6)
                        .foregroundStyle(HayameTheme.mutedText)
                    Spacer()
                    if let actionTitle, let action {
                        Button(actionTitle, action: action)
                            .font(.hayame(size: 13, weight: .semibold))
                            .foregroundStyle(HayameTheme.brandBlue)
                    }
                }
                .padding(.horizontal, 4)
            }
            VStack(spacing: 0) {
                content()
            }
            .background(HayameTheme.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .strokeBorder(HayameTheme.cardStroke, lineWidth: 1)
            )
            .shadow(color: HayameTheme.cardShadow, radius: 12, x: 0, y: 5)
        }
    }
}

struct HayameRowDivider: View {
    var body: some View {
        Divider()
            .background(HayameTheme.cardStroke)
            .padding(.leading, 62)
    }
}

struct RowIcon: View {
    let systemImage: String
    let tint: Color

    var body: some View {
        Image(systemName: systemImage)
            .font(.hayame(size: 15, weight: .semibold))
            .foregroundStyle(tint)
            .frame(width: 34, height: 34)
            .background(tint.opacity(0.13), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}

/// Icon + title + subtitle + a trailing accessory. The base of every row.
struct HayameRowLabel<Trailing: View>: View {
    let icon: String
    let tint: Color
    let title: String
    let subtitle: String?
    @ViewBuilder let trailing: () -> Trailing

    var body: some View {
        HStack(spacing: 12) {
            RowIcon(systemImage: icon, tint: tint)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.hayame(size: 15, weight: .semibold))
                    .foregroundStyle(HayameTheme.brandNavy)
                if let subtitle, !subtitle.isEmpty {
                    Text(subtitle)
                        .font(.hayame(size: 12, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                        .lineLimit(2)
                }
            }
            Spacer(minLength: 8)
            trailing()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 13)
        .contentShape(Rectangle())
    }
}

struct HayameNavRow<Destination: View>: View {
    let icon: String
    let tint: Color
    let title: String
    let subtitle: String?
    @ViewBuilder let destination: () -> Destination

    var body: some View {
        NavigationLink {
            destination()
        } label: {
            HayameRowLabel(icon: icon, tint: tint, title: title, subtitle: subtitle) {
                Image(systemName: "chevron.right")
                    .font(.hayame(size: 13, weight: .bold))
                    .foregroundStyle(HayameTheme.mutedText.opacity(0.7))
            }
        }
        .buttonStyle(HayamePressableStyle(scale: 0.985))
    }
}

/// Bottom confirmation card used by Settings actions that otherwise change
/// nothing on screen (for example replaying the first-use tips).
private struct SettingsConfirmationToast: View {
    let systemImage: String
    let title: String
    let message: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: systemImage)
                .font(.hayame(size: 15, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 34, height: 34)
                .background(HayameTheme.success, in: Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.hayame(size: 15, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Text(message)
                    .font(.hayame(size: 13, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .padding(14)
        .background(HayameTheme.cardBackground, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
        .shadow(color: HayameTheme.cardShadow, radius: 18, x: 0, y: 8)
        .accessibilityElement(children: .combine)
    }
}

struct HayameActionRow: View {
    let icon: String
    let tint: Color
    let title: String
    let subtitle: String?
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HayameRowLabel(icon: icon, tint: tint, title: title, subtitle: subtitle) {
                Image(systemName: "chevron.right")
                    .font(.hayame(size: 13, weight: .bold))
                    .foregroundStyle(HayameTheme.mutedText.opacity(0.7))
            }
        }
        .buttonStyle(HayamePressableStyle(scale: 0.985))
    }
}

/// Appearance choice: follow the phone, always light, or always dark.
struct HayameAppearanceRow: View {
    @EnvironmentObject private var appState: AppState

    private var mode: AppearanceMode { appState.appearanceMode }

    var body: some View {
        VStack(spacing: 0) {
            HayameRowLabel(
                icon: mode.systemImage,
                tint: mode == .light ? HayameTheme.warning : HayameTheme.brandBlue,
                title: "Appearance",
                subtitle: mode.subtitle
            ) {
                EmptyView()
            }

            HStack(spacing: 6) {
                ForEach(AppearanceMode.allCases) { option in
                    let selected = option == mode
                    Button {
                        guard !selected else { return }
                        HayameHaptics.select()
                        withAnimation(HayameMotion.snappy) { appState.setAppearanceMode(option) }
                    } label: {
                        Label(option.title, systemImage: option.systemImage)
                            .font(.hayame(size: 13, weight: .bold))
                            .foregroundStyle(selected ? .white : HayameTheme.brandNavy)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 9)
                            .background(selected ? HayameTheme.brandBlue : Color.clear, in: Capsule())
                    }
                    .buttonStyle(HayamePressableStyle(scale: 0.96, haptic: false))
                    .accessibilityAddTraits(selected ? [.isButton, .isSelected] : .isButton)
                }
            }
            .padding(4)
            .background(HayameTheme.fieldBackground, in: Capsule())
            .padding(.horizontal, 16)
            .padding(.bottom, 14)
        }
        .animation(HayameMotion.snappy, value: mode)
    }
}

struct HayameToggleRow: View {
    let icon: String
    let tint: Color
    let title: String
    let subtitle: String?
    @Binding var isOn: Bool

    var body: some View {
        HayameRowLabel(icon: icon, tint: tint, title: title, subtitle: subtitle) {
            HayameSwitch(isOn: $isOn)
        }
        .onTapGesture {
            HayameHaptics.select()
            withAnimation(HayameMotion.snappy) { isOn.toggle() }
        }
        .accessibilityElement(children: .combine)
        .accessibilityValue(isOn ? "On" : "Off")
    }
}

/// Toggle style used by the explore filters and other legacy toggles; renders
/// the same springy capsule switch as `HayameSwitch`.
struct HayameSwitchToggleStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        Button {
            HayameHaptics.select()
            withAnimation(HayameMotion.snappy) { configuration.isOn.toggle() }
        } label: {
            HStack(spacing: 12) {
                configuration.label
                Spacer()
                HayameSwitch(isOn: configuration.$isOn)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityValue(configuration.isOn ? "On" : "Off")
    }
}

/// A capsule switch with a springy knob and a soft haptic.
struct HayameSwitch: View {
    @Binding var isOn: Bool

    var body: some View {
        Capsule()
            .fill(isOn ? HayameTheme.brandBlue : HayameTheme.controlStroke)
            .frame(width: 50, height: 30)
            .overlay(alignment: isOn ? .trailing : .leading) {
                Circle()
                    .fill(.white)
                    .frame(width: 24, height: 24)
                    .shadow(color: .black.opacity(0.16), radius: 2, x: 0, y: 1)
                    .padding(3)
            }
            .animation(HayameMotion.snappy, value: isOn)
            .onTapGesture {
                HayameHaptics.select()
                withAnimation(HayameMotion.snappy) { isOn.toggle() }
            }
    }
}

/// Tappable tile with a tinted icon chip, used for the quick-action grid.
struct QuickActionTile: View {
    let title: String
    let subtitle: String
    let systemImage: String
    let tint: Color
    var badge: Int = 0
    var index: Int = 0
    let action: () -> Void

    @State private var bounce = 0
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Button {
            bounce += 1
            action()
        } label: {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    // Solid tinted chip in light mode; a soft tinted fill in dark mode so
                    // the icons do not glow against the dark cards.
                    Image(systemName: systemImage)
                        .font(.hayame(size: 17, weight: .bold))
                        .foregroundStyle(colorScheme == .dark ? tint : .white)
                        .frame(width: 40, height: 40)
                        .background(
                            colorScheme == .dark ? AnyShapeStyle(tint.opacity(0.16)) : AnyShapeStyle(LinearGradient(colors: [tint, tint.opacity(0.72)], startPoint: .topLeading, endPoint: .bottomTrailing)),
                            in: RoundedRectangle(cornerRadius: 13, style: .continuous)
                        )
                        .shadow(color: colorScheme == .dark ? .clear : tint.opacity(0.35), radius: 8, x: 0, y: 4)
                        .symbolEffect(.bounce, value: bounce)
                    Spacer()
                    if badge > 0 {
                        Text(badge > 99 ? "99+" : "\(badge)")
                            .font(.hayame(size: 11, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 3)
                            .background(HayameTheme.danger, in: Capsule())
                            .transition(.scale.combined(with: .opacity))
                    }
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.hayame(size: 15, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text(subtitle)
                        .font(.hayame(size: 12, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                        .lineLimit(1)
                        .contentTransition(.numericText())
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .background(HayameTheme.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
            .shadow(color: HayameTheme.cardShadow, radius: 12, x: 0, y: 5)
        }
        .buttonStyle(HayamePressableStyle(scale: 0.96))
        .animation(HayameMotion.snappy, value: badge)
    }
}

/// Rotating gradient ring around an avatar. Stops rotating under Reduce Motion.
struct HayameAvatarRing<Content: View>: View {
    var size: CGFloat
    var lineWidth: CGFloat = 3
    var colors: [Color] = [HayameTheme.brandBlue, HayameTheme.brandLight, HayameTheme.brandBlue.opacity(0.4), HayameTheme.brandBlue]
    @ViewBuilder let content: () -> Content

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var rotation = 0.0

    var body: some View {
        ZStack {
            Circle()
                .strokeBorder(
                    AngularGradient(colors: colors, center: .center),
                    lineWidth: lineWidth
                )
                .rotationEffect(.degrees(rotation))
            content()
                .frame(width: size - lineWidth * 2 - 6, height: size - lineWidth * 2 - 6)
                .clipShape(Circle())
        }
        .frame(width: size, height: size)
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.linear(duration: 8).repeatForever(autoreverses: false)) {
                rotation = 360
            }
        }
    }
}

/// The signed-in user's avatar, or their initials on a soft disc.
struct ProfileAvatarView: View {
    @EnvironmentObject private var appState: AppState
    var size: CGFloat = 56
    var textSize: CGFloat = 18
    /// Set when the avatar sits on the blue hero so the fallback stays legible.
    var onBrand = false

    var body: some View {
        Group {
            if let url = RemoteImageURLResolver.resolve(appState.currentUser.avatar) {
                CachedRemoteImage(url: url, targetSize: CGSize(width: size * 2, height: size * 2)) {
                    Circle().fill(onBrand ? Color.white.opacity(0.2) : HayameTheme.brandLight)
                } failure: {
                    fallback
                }
            } else {
                fallback
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
    }

    private var fallback: some View {
        let initials = appState.currentUser.fullName
            .split(separator: " ")
            .prefix(2)
            .compactMap { $0.first.map(String.init) }
            .joined()
            .uppercased()
        return Circle()
            .fill(onBrand ? Color.white.opacity(0.2) : HayameTheme.brandLight)
            .overlay(
                Text(initials.isEmpty ? "U" : initials)
                    .font(.hayame(size: textSize, weight: .bold))
                    .foregroundStyle(onBrand ? Color.white : HayameTheme.brandNavy)
            )
    }
}

private struct ProfileStatTile: View {
    let value: Int
    let title: String
    let systemImage: String
    let tint: Color
    let revealed: Bool
    let action: (() -> Void)?

    var body: some View {
        let content = VStack(alignment: .leading, spacing: 8) {
            Image(systemName: systemImage)
                .font(.hayame(size: 14, weight: .bold))
                .foregroundStyle(tint)
            Text("\(revealed ? value : 0)")
                .font(.hayame(size: 24, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
                .contentTransition(.numericText(value: Double(value)))
                .animation(HayameMotion.gentle, value: revealed)
            Text(title)
                .font(.hayame(size: 12, weight: .semibold))
                .foregroundStyle(HayameTheme.mutedText)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
        .shadow(color: HayameTheme.cardShadow, radius: 10, x: 0, y: 4)

        if let action {
            Button(action: action) { content }
                .buttonStyle(HayamePressableStyle(scale: 0.96))
        } else {
            content
        }
    }
}

private struct ProfileDetailRow: View {
    let icon: String
    let title: String
    let value: String
    let placeholder: String

    private var isEmpty: Bool { value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }

    var body: some View {
        HayameRowLabel(icon: icon, tint: isEmpty ? HayameTheme.mutedText : HayameTheme.brandBlue, title: title, subtitle: isEmpty ? placeholder : value) {
            if isEmpty {
                Image(systemName: "plus.circle.fill")
                    .font(.hayame(size: 16, weight: .bold))
                    .foregroundStyle(HayameTheme.brandBlue)
            } else {
                Image(systemName: "checkmark.circle.fill")
                    .font(.hayame(size: 16, weight: .bold))
                    .foregroundStyle(HayameTheme.success)
            }
        }
    }
}

private struct RoleChip: View {
    let text: String
    let systemImage: String

    var body: some View {
        Label(text, systemImage: systemImage)
            .font(.hayame(size: 12, weight: .bold))
            .foregroundStyle(HayameTheme.brandNavy)
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(HayameTheme.brandLight, in: Capsule())
            .overlay(Capsule().strokeBorder(HayameTheme.brandBlue.opacity(0.2), lineWidth: 1))
    }
}

/// Brand gradient with a soft glow used behind hero cards. Bright blue in light
/// mode, deep muted blue in dark mode so it sits with the rest of the dark UI.
struct BrandHeroBackground: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [HayameTheme.heroStart, HayameTheme.heroEnd],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            RadialGradient(colors: [HayameTheme.heroHighlight, .clear], center: .topLeading, startRadius: 0, endRadius: 260)
            Circle()
                .fill(colorScheme == .dark ? HayameTheme.brandBlue.opacity(0.07) : .white.opacity(0.08))
                .frame(width: 220, height: 220)
                .offset(x: 150, y: 60)
        }
    }
}

// MARK: - Skeletons

struct MoreHeroSkeleton: View {
    var body: some View {
        HStack(spacing: 14) {
            SkeletonBlock(width: 66, height: 66, cornerRadius: 33)
            VStack(alignment: .leading, spacing: 8) {
                SkeletonBlock(width: 150, height: 18)
                SkeletonBlock(width: 190, height: 12)
                SkeletonBlock(width: 110, height: 8)
            }
            Spacer()
        }
        .padding(18)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
    }
}

struct ProfileHeaderSkeleton: View {
    var body: some View {
        VStack(spacing: 14) {
            SkeletonBlock(width: 112, height: 112, cornerRadius: 56)
            SkeletonBlock(width: 170, height: 22)
            SkeletonBlock(width: 200, height: 12)
            HStack(spacing: 8) {
                SkeletonBlock(width: 86, height: 28, cornerRadius: 14)
                SkeletonBlock(width: 120, height: 28, cornerRadius: 14)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 8)
    }
}

// MARK: - Helpers

extension View {
    /// Pushed screens own their navigation-bar background so it follows the app's
    /// light/dark setting immediately instead of waiting for the next push.
    func hayameBarBackground() -> some View {
        self
            .toolbarBackground(HayameTheme.pageBackground, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
    }
}

struct ProfileCompleteness {
    let user: UserProfile

    private var checks: [(String, Bool)] {
        [
            ("your name", !user.fullName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty),
            ("an email", !user.email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty),
            ("a phone number", !user.phone.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty),
            ("your city", !user.city.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty),
            ("a profile photo", !(user.avatar ?? "").isEmpty),
        ]
    }

    var fraction: Double {
        let done = checks.filter(\.1).count
        return Double(done) / Double(checks.count)
    }

    var percent: Int { Int((fraction * 100).rounded()) }

    var missingSummary: String {
        let missing = checks.filter { !$0.1 }.map(\.0)
        switch missing.count {
        case 0: return "nothing else"
        case 1: return missing[0]
        default: return missing.dropLast().joined(separator: ", ") + " and " + missing.last!
        }
    }
}

enum AppVersion {
    static var display: String {
        let info = Bundle.main.infoDictionary
        let version = info?["CFBundleShortVersionString"] as? String ?? "1.0"
        let build = info?["CFBundleVersion"] as? String ?? "1"
        return "v\(version) (\(build))"
    }
}

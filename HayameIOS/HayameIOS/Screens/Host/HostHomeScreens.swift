import SwiftUI

// MARK: - Host home
//
// The host dashboard in the same language as the renter More tab: a greeting
// header, a brand hero with the host-mode switch and the month's earnings, a
// requests banner when guests are waiting, animated stat tiles, a six-month
// earnings chart, quick actions, a listings carousel, recent activity and the
// host tools. Everything settles in with staggered springs and shows skeletons
// while remote data loads.

struct HostDashboardScreen: View {
    @EnvironmentObject private var appState: AppState
    @State private var showSettings = false
    @State private var revealed = false

    private let earningStatuses: Set<BookingStatus> = [.awaitingHost, .confirmed, .completed]

    private var hostBookings: [Booking] { appState.hostBookings }

    private var urgentBookings: [Booking] {
        hostBookings.filter { $0.status == .awaitingHost && $0.paymentStatus == .paid }
    }

    private var totalEarnings: Int {
        hostBookings.filter { earningStatuses.contains($0.status) }.reduce(0) { $0 + $1.totalPrice }
    }

    private var monthlyEarnings: Int {
        let calendar = Calendar.current
        let now = Date()
        return hostBookings
            .filter { calendar.isDate($0.createdAt, equalTo: now, toGranularity: .month) && earningStatuses.contains($0.status) }
            .reduce(0) { $0 + $1.totalPrice }
    }

    private var averageRating: Double {
        guard !appState.hostReviews.isEmpty else { return 0 }
        return Double(appState.hostReviews.reduce(0) { $0 + $1.rating }) / Double(appState.hostReviews.count)
    }

    private var monthlySeries: [HostMonthBucket] {
        HostMonthBucket.lastSixMonths(from: hostBookings, counting: earningStatuses)
    }

    private var isBookingsLoading: Bool {
        appState.bookingsLoadState == .loading && hostBookings.isEmpty
    }

    private var isListingsLoading: Bool {
        appState.publicCarsLoadState == .loading && appState.hostCars.isEmpty
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 18) {
                header
                    .hayameAppear(index: 0)

                hostHero
                    .coachMark("host.hero")
                    .coachTour(.hostHome)
                    .hayameAppear(index: 1)

                if !urgentBookings.isEmpty {
                    urgentCard
                        .hayameAppear(index: 2)
                        .transition(.scale(scale: 0.96).combined(with: .opacity))
                }

                statsGrid
                    .hayameAppear(index: 3)

                earningsChart
                    .hayameAppear(index: 4)

                quickActions
                    .hayameAppear(index: 5)

                listingsSection
                    .hayameAppear(index: 6)

                recentActivity
                    .hayameAppear(index: 7)

                toolsGroup
                    .hayameAppear(index: 8)
            }
            .padding(16)
            .animation(HayameMotion.settle, value: urgentBookings.count)
            .animation(HayameMotion.settle, value: isBookingsLoading)
            .animation(HayameMotion.settle, value: isListingsLoading)
        }
        .background(HayameTheme.pageBackground)
        .toolbar(.hidden, for: .navigationBar)
        .refreshable { await appState.refreshAllRemoteData() }
        .navigationDestination(isPresented: $showSettings) {
            SettingsScreen()
                .environmentObject(appState)
        }
        .onAppear {
            withAnimation(HayameMotion.respecting(HayameMotion.gentle).delay(0.35)) {
                revealed = true
            }
        }
    }

    // MARK: Sections

    private var header: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(HostGreeting.text)
                    .font(.hayame(size: 13, weight: .semibold))
                    .foregroundStyle(HayameTheme.mutedText)
                Text(firstName)
                    .font(.hayame(size: 30, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .lineLimit(1)
            }
            Spacer()
            if appState.isSyncingRemote {
                HayameStatusPill(text: "Syncing", tone: .info, isLive: true)
                    .transition(.scale.combined(with: .opacity))
            }
            Button {
                HayameHaptics.light()
                appState.hostTab = .profile
            } label: {
                HayameAvatarRing(size: 46, lineWidth: 2) {
                    ProfileAvatarView(size: 38, textSize: 14)
                }
            }
            .buttonStyle(HayamePressableStyle(scale: 0.9))
            .accessibilityLabel("Host profile")
        }
        .animation(HayameMotion.snappy, value: appState.isSyncingRemote)
    }

    private var firstName: String {
        let name = appState.currentUser.fullName.trimmingCharacters(in: .whitespacesAndNewlines)
        return name.split(separator: " ").first.map(String.init) ?? (name.isEmpty ? "Host" : name)
    }

    private var hostHero: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("THIS MONTH")
                        .font(.hayame(size: 11, weight: .bold))
                        .tracking(0.8)
                        .foregroundStyle(.white.opacity(0.75))
                    Text(revealed ? HostMoney.format(monthlyEarnings) : HostMoney.format(0))
                        .font(.hayame(size: 34, weight: .bold))
                        .foregroundStyle(.white)
                        .contentTransition(.numericText(value: Double(monthlyEarnings)))
                        .animation(HayameMotion.gentle, value: revealed)
                    Text("earned across \(hostBookings.filter { earningStatuses.contains($0.status) }.count) bookings")
                        .font(.hayame(size: 13, weight: .medium))
                        .foregroundStyle(.white.opacity(0.8))
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 6) {
                    Text("Host mode")
                        .font(.hayame(size: 12, weight: .bold))
                        .foregroundStyle(.white.opacity(0.85))
                    HostModeSwitch()
                        .coachMark("host.switch")
                }
            }

            HStack(spacing: 8) {
                HeroChip(text: "\(appState.hostCars.count) \(appState.hostCars.count == 1 ? "listing" : "listings")", systemImage: "car.fill")
                HeroChip(text: urgentBookings.isEmpty ? "No requests waiting" : "\(urgentBookings.count) waiting", systemImage: urgentBookings.isEmpty ? "checkmark.circle.fill" : "clock.badge.exclamationmark.fill")
            }
        }
        .padding(18)
        .background(BrandHeroBackground())
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .shadow(color: HayameTheme.brandBlue.opacity(0.28), radius: 16, x: 0, y: 8)
    }

    private var urgentCard: some View {
        Button {
            HayameHaptics.medium()
            appState.hostTab = .bookings
        } label: {
            HStack(spacing: 14) {
                ZStack {
                    HayameRadarPulse(color: HayameTheme.danger, rings: 2, duration: 2.2, maxScale: 2.2)
                        .frame(width: 40, height: 40)
                    Image(systemName: "bell.badge.fill")
                        .font(.hayame(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 42, height: 42)
                        .background(HayameTheme.danger, in: Circle())
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text("\(urgentBookings.count) \(urgentBookings.count == 1 ? "request needs" : "requests need") your answer")
                        .font(.hayame(size: 15, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text("Guests have paid and are waiting for approval.")
                        .font(.hayame(size: 12, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                }
                Spacer(minLength: 6)
                Text("Review")
                    .font(.hayame(size: 13, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(HayameTheme.danger, in: Capsule())
            }
            .padding(14)
            .background(HayameTheme.danger.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).strokeBorder(HayameTheme.danger.opacity(0.25), lineWidth: 1))
        }
        .buttonStyle(HayamePressableStyle(scale: 0.97))
    }

    private var statsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
            if isBookingsLoading {
                ForEach(0..<4, id: \.self) { _ in SkeletonBlock(height: 92, cornerRadius: 18) }
            } else {
                HostStatTile(title: "Total earned", value: HostMoney.format(totalEarnings), placeholder: HostMoney.format(0), systemImage: "banknote.fill", tint: HayameTheme.success, revealed: revealed) {
                    appState.hostTab = .earnings
                }
                HostStatTile(title: "Completed trips", value: "\(hostBookings.filter { $0.status == .completed }.count)", placeholder: "0", systemImage: "flag.checkered", tint: HayameTheme.brandBlue, revealed: revealed) {
                    appState.hostTab = .bookings
                }
                HostStatTile(title: "My cars", value: "\(appState.hostCars.count)", placeholder: "0", systemImage: "car.fill", tint: HayameTheme.warning, revealed: revealed) {
                    appState.hostTab = .cars
                }
                HostStatTile(title: "Rating", value: appState.hostReviews.isEmpty ? "New" : String(format: "%.1f", averageRating), placeholder: "0.0", systemImage: "star.fill", tint: HayameTheme.danger, revealed: revealed) {
                    appState.hostTab = .profile
                }
            }
        }
    }

    private var earningsChart: some View {
        Button {
            HayameHaptics.tap()
            appState.hostTab = .earnings
        } label: {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Earnings, last 6 months")
                            .font(.hayame(size: 15, weight: .bold))
                            .foregroundStyle(HayameTheme.brandNavy)
                        Text(monthlySeries.allSatisfy { $0.amount == 0 } ? "Confirmed bookings will show up here." : "Tap for payouts and history")
                            .font(.hayame(size: 12, weight: .medium))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.hayame(size: 13, weight: .bold))
                        .foregroundStyle(HayameTheme.mutedText.opacity(0.7))
                }
                HostEarningsBars(series: monthlySeries, revealed: revealed)
                    .frame(height: 132)
            }
            .padding(16)
            .background(HayameTheme.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
            .shadow(color: HayameTheme.cardShadow, radius: 12, x: 0, y: 5)
        }
        .buttonStyle(HayamePressableStyle(scale: 0.985))
    }

    private var quickActions: some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
            QuickActionTile(title: "Add a car", subtitle: "Create a new listing", systemImage: "plus", tint: HayameTheme.brandBlue, index: 0) {
                appState.hostTab = .cars
            }
            QuickActionTile(title: "Bookings", subtitle: urgentBookings.isEmpty ? "Requests and history" : "\(urgentBookings.count) to review", systemImage: "calendar.badge.clock", tint: HayameTheme.warning, badge: urgentBookings.count, index: 1) {
                appState.hostTab = .bookings
            }
            QuickActionTile(title: "Inbox", subtitle: appState.unreadMessagesCount == 0 ? "All caught up" : "\(appState.unreadMessagesCount) unread", systemImage: "bubble.left.and.bubble.right.fill", tint: HayameTheme.success, badge: appState.unreadMessagesCount, index: 2) {
                appState.hostTab = .inbox
            }
            QuickActionTile(title: "Earnings", subtitle: "Payouts and trends", systemImage: "chart.line.uptrend.xyaxis", tint: HayameTheme.danger, index: 3) {
                appState.hostTab = .earnings
            }
        }
    }

    private var listingsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("YOUR LISTINGS")
                    .font(.hayame(size: 12, weight: .bold))
                    .tracking(0.6)
                    .foregroundStyle(HayameTheme.mutedText)
                Spacer()
                Button("Manage") { appState.hostTab = .cars }
                    .font(.hayame(size: 13, weight: .semibold))
                    .foregroundStyle(HayameTheme.brandBlue)
            }
            .padding(.horizontal, 4)

            if isListingsLoading {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(0..<3, id: \.self) { _ in SkeletonBlock(width: 200, height: 176, cornerRadius: 18) }
                    }
                }
            } else if appState.hostCars.isEmpty {
                Button {
                    appState.hostTab = .cars
                } label: {
                    HStack(spacing: 14) {
                        Image(systemName: "car.2.fill")
                            .font(.hayame(size: 20, weight: .bold))
                            .foregroundStyle(HayameTheme.brandBlue)
                            .frame(width: 48, height: 48)
                            .background(HayameTheme.brandLight, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                        VStack(alignment: .leading, spacing: 3) {
                            Text("List your first car")
                                .font(.hayame(size: 15, weight: .bold))
                                .foregroundStyle(HayameTheme.brandNavy)
                            Text("Photos, price and availability take a few minutes.")
                                .font(.hayame(size: 12, weight: .medium))
                                .foregroundStyle(HayameTheme.mutedText)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.hayame(size: 13, weight: .bold))
                            .foregroundStyle(HayameTheme.mutedText.opacity(0.7))
                    }
                    .padding(14)
                    .background(HayameTheme.cardBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
                }
                .buttonStyle(HayamePressableStyle())
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(Array(appState.hostCars.prefix(6).enumerated()), id: \.element.id) { index, car in
                            HostListingCard(car: car) {
                                appState.hostTab = .cars
                            }
                            .hayameAppear(index: index, step: 0.05, offsetY: 0, scale: 0.96)
                        }
                    }
                    .padding(.vertical, 2)
                }
            }
        }
    }

    private var recentActivity: some View {
        HayameGroupCard(title: "Recent activity", actionTitle: hostBookings.isEmpty ? nil : "All bookings", action: { appState.hostTab = .bookings }) {
            if isBookingsLoading {
                ForEach(0..<3, id: \.self) { index in
                    HStack(spacing: 12) {
                        SkeletonBlock(width: 34, height: 34, cornerRadius: 10)
                        VStack(alignment: .leading, spacing: 6) {
                            SkeletonBlock(width: 150, height: 14)
                            SkeletonBlock(width: 110, height: 10)
                        }
                        Spacer()
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 13)
                    if index < 2 { HayameRowDivider() }
                }
            } else if hostBookings.isEmpty {
                HayameRowLabel(icon: "calendar", tint: HayameTheme.mutedText, title: "No bookings yet", subtitle: "Requests appear here as soon as guests book.") {
                    EmptyView()
                }
            } else {
                let recent = Array(hostBookings.sorted { $0.createdAt > $1.createdAt }.prefix(3))
                ForEach(Array(recent.enumerated()), id: \.element.id) { index, booking in
                    Button {
                        appState.pendingBookingID = booking.id
                        appState.hostTab = .bookings
                    } label: {
                        HayameRowLabel(
                            icon: "car.fill",
                            tint: booking.status == .awaitingHost ? HayameTheme.warning : HayameTheme.brandBlue,
                            title: booking.carTitle,
                            subtitle: "\(booking.renterName.isEmpty ? "Guest" : booking.renterName) · \(booking.startDate.hayameDateLabel()) – \(booking.endDate.hayameDateLabel())"
                        ) {
                            VStack(alignment: .trailing, spacing: 4) {
                                BookingStatusBadge(status: booking.displayStatus)
                                Text(HostMoney.format(booking.totalPrice))
                                    .font(.hayame(size: 12, weight: .bold))
                                    .foregroundStyle(HayameTheme.brandNavy)
                            }
                        }
                    }
                    .buttonStyle(HayamePressableStyle(scale: 0.985))
                    if index < recent.count - 1 { HayameRowDivider() }
                }
            }
        }
    }

    private var toolsGroup: some View {
        HayameGroupCard(title: "Host tools") {
            HayameNavRow(icon: "star.bubble.fill", tint: HayameTheme.warning, title: "Guest feedback", subtitle: appState.hostReviews.isEmpty ? "No reviews yet" : "\(appState.hostReviews.count) \(appState.hostReviews.count == 1 ? "review" : "reviews")") {
                HostReviewsScreen()
            }
            HayameRowDivider()
            HayameNavRow(icon: "heart.text.square.fill", tint: HayameTheme.danger, title: "Favourites insights", subtitle: "Which listings guests save most") {
                HostFavoritesScreen()
            }
            HayameRowDivider()
            HayameActionRow(icon: "gearshape.fill", tint: HayameTheme.brandNavy, title: "Settings", subtitle: "Appearance, app icon, notifications") {
                showSettings = true
            }
            HayameRowDivider()
            HayameNavRow(icon: "envelope.fill", tint: HayameTheme.brandBlue, title: "Host support", subtitle: "We reply within a day") {
                ContactScreen()
            }
        }
    }
}

// MARK: - Host profile

struct HostProfileScreen: View {
    @EnvironmentObject private var appState: AppState
    @State private var showEditProfile = false
    @State private var showSettings = false
    @State private var revealed = false

    private var user: UserProfile { appState.currentUser }
    private var hostBookings: [Booking] { appState.hostBookings }

    private var completedTrips: Int { hostBookings.filter { $0.status == .completed }.count }

    private var approvalRate: Double? {
        let approved = hostBookings.filter { $0.status == .confirmed || $0.status == .completed }.count
        let rejected = hostBookings.filter { $0.status == .rejected }.count
        let decided = approved + rejected
        guard decided > 0 else { return nil }
        return Double(approved) / Double(decided)
    }

    private var averageRating: Double {
        guard !appState.hostReviews.isEmpty else { return 0 }
        return Double(appState.hostReviews.reduce(0) { $0 + $1.rating }) / Double(appState.hostReviews.count)
    }

    private var hostLevel: String {
        let level = appState.hostCars.first?.hostLevel.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return level.isEmpty ? "Verified host" : level
    }

    private var locationLabel: String {
        [user.city, user.region]
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: ", ")
    }

    private var isHeaderLoading: Bool {
        appState.isSyncingRemote && user.email.isEmpty
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 18) {
                HStack {
                    Text("Profile")
                        .font(.hayame(size: 30, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Spacer()
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
                }
                .hayameAppear(index: 0)

                if isHeaderLoading {
                    ProfileHeaderSkeleton()
                } else {
                    heroHeader
                        .hayameAppear(index: 1, offsetY: 10, scale: 0.96)
                }

                statsRow
                    .hayameAppear(index: 2)

                performanceCard
                    .hayameAppear(index: 3)

                HayameGroupCard(title: "Host tools") {
                    HayameActionRow(icon: "car.fill", tint: HayameTheme.brandBlue, title: "My listings", subtitle: "\(appState.hostCars.count) \(appState.hostCars.count == 1 ? "car" : "cars") listed") {
                        appState.hostTab = .cars
                    }
                    HayameRowDivider()
                    HayameNavRow(icon: "star.bubble.fill", tint: HayameTheme.warning, title: "Guest feedback", subtitle: appState.hostReviews.isEmpty ? "No reviews yet" : "\(appState.hostReviews.count) \(appState.hostReviews.count == 1 ? "review" : "reviews")") {
                        HostReviewsScreen()
                    }
                    HayameRowDivider()
                    HayameNavRow(icon: "heart.text.square.fill", tint: HayameTheme.danger, title: "Favourites insights", subtitle: "Which listings guests save most") {
                        HostFavoritesScreen()
                    }
                    HayameRowDivider()
                    HayameActionRow(icon: "gearshape.fill", tint: HayameTheme.brandNavy, title: "Settings", subtitle: "Appearance, app icon, notifications, privacy") {
                        showSettings = true
                    }
                }
                .hayameAppear(index: 4)

                HayameGroupCard(title: "Personal details", actionTitle: "Edit", action: { showEditProfile = true }) {
                    HostDetailRow(icon: "person.fill", title: "Full name", value: user.fullName, placeholder: "Add your name")
                    HayameRowDivider()
                    HostDetailRow(icon: "envelope.fill", title: "Email", value: user.email, placeholder: "Not set")
                    HayameRowDivider()
                    HostDetailRow(icon: "phone.fill", title: "Phone", value: user.phone, placeholder: "Add a phone number")
                    HayameRowDivider()
                    HostDetailRow(icon: "mappin.and.ellipse", title: "Location", value: locationLabel, placeholder: "Add your city")
                }
                .hayameAppear(index: 5)

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
                    HayameRowDivider()
                    HayameNavRow(icon: "doc.text.fill", tint: HayameTheme.brandBlue, title: "Terms of Service", subtitle: "The agreement for using Hayame") {
                        TermsOfServiceScreen(mode: .readOnly)
                    }
                }
                .hayameAppear(index: 6)

                VStack(spacing: 12) {
                    Button {
                        HayameHaptics.medium()
                        withAnimation(HayameMotion.settle) {
                            appState.hostModeEnabled = false
                        }
                        appState.switchToGuestMode()
                    } label: {
                        Label("Switch to renting", systemImage: "arrow.left.arrow.right")
                            .font(.hayame(size: 15, weight: .semibold))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 13)
                            .background(HayameTheme.brandLight, in: Capsule())
                            .overlay(Capsule().strokeBorder(HayameTheme.brandBlue.opacity(0.25), lineWidth: 1))
                    }
                    .buttonStyle(HayamePressableStyle())

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

                    DeleteAccountLink()
                        .padding(.top, -4)

                    Text("Hayame \(AppVersion.display)")
                        .font(.hayame(size: 11, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                }
                .hayameAppear(index: 7)
            }
            .padding(16)
            .animation(HayameMotion.settle, value: isHeaderLoading)
        }
        .background(HayameTheme.pageBackground.ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .refreshable { await appState.refreshAllRemoteData() }
        .sheet(isPresented: $showEditProfile) {
            ProfileEditSheet()
                .environmentObject(appState)
        }
        .navigationDestination(isPresented: $showSettings) {
            SettingsScreen()
                .environmentObject(appState)
        }
        .onAppear {
            withAnimation(HayameMotion.respecting(HayameMotion.gentle).delay(0.3)) {
                revealed = true
            }
        }
    }

    private var heroHeader: some View {
        VStack(spacing: 14) {
            ZStack(alignment: .bottomTrailing) {
                HayameAvatarRing(size: 112, lineWidth: 3) {
                    ProfileAvatarView(size: 96, textSize: 32)
                }
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

            VStack(spacing: 6) {
                Text(user.fullName.isEmpty ? "Host" : user.fullName)
                    .font(.hayame(size: 26, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .multilineTextAlignment(.center)
                Text(user.email)
                    .font(.hayame(size: 14, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
            }

            HStack(spacing: 8) {
                HostChip(text: hostLevel, systemImage: "checkmark.seal.fill", tint: HayameTheme.brandBlue)
                if !locationLabel.isEmpty {
                    HostChip(text: locationLabel, systemImage: "mappin.and.ellipse", tint: HayameTheme.brandNavy)
                }
            }
        }
        .frame(maxWidth: .infinity)
    }

    private var statsRow: some View {
        HStack(spacing: 12) {
            HostStatTile(title: "Cars", value: "\(appState.hostCars.count)", placeholder: "0", systemImage: "car.fill", tint: HayameTheme.brandBlue, revealed: revealed) {
                appState.hostTab = .cars
            }
            HostStatTile(title: "Trips hosted", value: "\(completedTrips)", placeholder: "0", systemImage: "flag.checkered", tint: HayameTheme.success, revealed: revealed) {
                appState.hostTab = .bookings
            }
            HostStatTile(title: "Rating", value: appState.hostReviews.isEmpty ? "New" : String(format: "%.1f", averageRating), placeholder: "0.0", systemImage: "star.fill", tint: HayameTheme.warning, revealed: revealed, action: nil)
        }
    }

    private var performanceCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label("Hosting performance", systemImage: "chart.bar.fill")
                    .font(.hayame(size: 15, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Spacer()
                if let approvalRate {
                    Text("\(revealed ? Int((approvalRate * 100).rounded()) : 0)% approved")
                        .font(.hayame(size: 13, weight: .bold))
                        .foregroundStyle(HayameTheme.brandBlue)
                        .contentTransition(.numericText())
                        .animation(HayameMotion.gentle, value: revealed)
                }
            }
            HayameProgressBar(fraction: revealed ? (approvalRate ?? 0) : 0, height: 8)
            HStack(spacing: 16) {
                performanceStat(value: "\(hostBookings.filter { $0.status == .awaitingHost }.count)", label: "awaiting")
                performanceStat(value: "\(hostBookings.filter { $0.status == .confirmed }.count)", label: "upcoming")
                performanceStat(value: "\(appState.hostReviews.count)", label: "reviews")
            }
            Text(approvalRate == nil
                 ? "Approve requests quickly to build your approval rate. Guests see responsive hosts first."
                 : "Guests see responsive hosts first. Keep approving paid requests promptly to stay on top.")
                .font(.hayame(size: 12, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(16)
        .background(HayameTheme.brandLight)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(HayameTheme.brandBlue.opacity(0.18), lineWidth: 1))
    }

    private func performanceStat(value: String, label: String) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(value)
                .font(.hayame(size: 18, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
            Text(label)
                .font(.hayame(size: 11, weight: .semibold))
                .foregroundStyle(HayameTheme.mutedText)
        }
    }
}

// MARK: - Building blocks

/// Host-mode switch for the hero card: white knob on a translucent track.
private struct HostModeSwitch: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Capsule()
            .fill(appState.hostModeEnabled ? Color.white.opacity(0.95) : Color.white.opacity(0.3))
            .frame(width: 50, height: 30)
            .overlay(alignment: appState.hostModeEnabled ? .trailing : .leading) {
                Circle()
                    .fill(appState.hostModeEnabled ? HayameTheme.brandBlue : Color.white)
                    .frame(width: 24, height: 24)
                    .shadow(color: .black.opacity(0.16), radius: 2, x: 0, y: 1)
                    .padding(3)
            }
            .animation(HayameMotion.snappy, value: appState.hostModeEnabled)
            .onTapGesture {
                HayameHaptics.select()
                let enabled = !appState.hostModeEnabled
                withAnimation(HayameMotion.settle) {
                    appState.hostModeEnabled = enabled
                }
                if enabled {
                    appState.switchToHostMode()
                } else {
                    appState.switchToGuestMode()
                }
            }
            .accessibilityLabel("Host mode")
            .accessibilityValue(appState.hostModeEnabled ? "On" : "Off")
    }
}

private struct HeroChip: View {
    let text: String
    let systemImage: String

    var body: some View {
        Label(text, systemImage: systemImage)
            .font(.hayame(size: 12, weight: .bold))
            .foregroundStyle(.white)
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(.white.opacity(0.18), in: Capsule())
    }
}

private struct HostChip: View {
    let text: String
    let systemImage: String
    let tint: Color

    var body: some View {
        Label(text, systemImage: systemImage)
            .font(.hayame(size: 12, weight: .bold))
            .foregroundStyle(tint)
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(tint.opacity(0.12), in: Capsule())
            .overlay(Capsule().strokeBorder(tint.opacity(0.2), lineWidth: 1))
    }
}

private struct HostStatTile: View {
    let title: String
    let value: String
    let placeholder: String
    let systemImage: String
    let tint: Color
    let revealed: Bool
    let action: (() -> Void)?

    var body: some View {
        let content = VStack(alignment: .leading, spacing: 8) {
            Image(systemName: systemImage)
                .font(.hayame(size: 14, weight: .bold))
                .foregroundStyle(tint)
                .frame(width: 30, height: 30)
                .background(tint.opacity(0.13), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
            Text(revealed ? value : placeholder)
                .font(.hayame(size: 22, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .contentTransition(.numericText())
                .animation(HayameMotion.gentle, value: revealed)
            Text(title)
                .font(.hayame(size: 12, weight: .semibold))
                .foregroundStyle(HayameTheme.mutedText)
                .lineLimit(1)
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

private struct HostDetailRow: View {
    let icon: String
    let title: String
    let value: String
    let placeholder: String

    private var isEmpty: Bool { value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }

    var body: some View {
        HayameRowLabel(icon: icon, tint: isEmpty ? HayameTheme.mutedText : HayameTheme.brandBlue, title: title, subtitle: isEmpty ? placeholder : value) {
            Image(systemName: isEmpty ? "plus.circle.fill" : "checkmark.circle.fill")
                .font(.hayame(size: 16, weight: .bold))
                .foregroundStyle(isEmpty ? HayameTheme.brandBlue : HayameTheme.success)
        }
    }
}

/// Six bars that grow up from the baseline when the dashboard appears.
private struct HostEarningsBars: View {
    let series: [HostMonthBucket]
    let revealed: Bool

    private var maxAmount: Int { max(series.map(\.amount).max() ?? 0, 1) }

    var body: some View {
        GeometryReader { geometry in
            let chartHeight = geometry.size.height - 22
            HStack(alignment: .bottom, spacing: 10) {
                ForEach(Array(series.enumerated()), id: \.offset) { index, bucket in
                    let ratio = Double(bucket.amount) / Double(maxAmount)
                    let target = max(6, chartHeight * ratio)
                    VStack(spacing: 6) {
                        Spacer(minLength: 0)
                        RoundedRectangle(cornerRadius: 7, style: .continuous)
                            .fill(
                                bucket.amount == 0
                                    ? AnyShapeStyle(HayameTheme.subtleFill)
                                    : AnyShapeStyle(LinearGradient(colors: [HayameTheme.brandBlue, HayameTheme.primaryButtonEnd], startPoint: .top, endPoint: .bottom))
                            )
                            .frame(height: revealed ? target : 6)
                            .animation(HayameMotion.respecting(HayameMotion.gentle).delay(Double(index) * 0.05), value: revealed)
                        Text(bucket.month)
                            .font(.hayame(size: 11, weight: .semibold))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
    }
}

/// Compact listing card for the dashboard carousel.
private struct HostListingCard: View {
    let car: Car
    let action: () -> Void

    private var isApproved: Bool {
        car.approvalStatus.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() == "approved"
    }

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                ZStack(alignment: .topLeading) {
                    thumbnail
                        .frame(width: 200, height: 112)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    Text(isApproved ? "Live" : "Pending review")
                        .font(.hayame(size: 10, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(isApproved ? HayameTheme.success : HayameTheme.warning, in: Capsule())
                        .padding(8)
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text(car.title)
                        .font(.hayame(size: 14, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .lineLimit(1)
                    HStack(spacing: 6) {
                        Text("\(HostMoney.format(car.dailyPrice))/day")
                            .font(.hayame(size: 12, weight: .semibold))
                            .foregroundStyle(HayameTheme.brandBlue)
                        Spacer()
                        Label("\(car.favoritesCount)", systemImage: "heart.fill")
                            .font(.hayame(size: 11, weight: .bold))
                            .foregroundStyle(HayameTheme.danger)
                    }
                }
            }
            .padding(10)
            .frame(width: 220)
            .background(HayameTheme.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
            .shadow(color: HayameTheme.cardShadow, radius: 10, x: 0, y: 4)
        }
        .buttonStyle(HayamePressableStyle(scale: 0.96))
    }

    @ViewBuilder
    private var thumbnail: some View {
        if let url = RemoteImageURLResolver.resolve(car.imageNames.first) {
            CachedRemoteImage(url: url, targetSize: CGSize(width: 400, height: 224)) {
                thumbnailFallback
            } failure: {
                thumbnailFallback
            }
        } else {
            thumbnailFallback
        }
    }

    private var thumbnailFallback: some View {
        RoundedRectangle(cornerRadius: 14, style: .continuous)
            .fill(HayameTheme.brandLight)
            .overlay(
                Image(systemName: "car.fill")
                    .font(.hayame(size: 24, weight: .bold))
                    .foregroundStyle(HayameTheme.brandBlue)
            )
    }
}

// MARK: - Helpers

struct HostMonthBucket: Hashable {
    let month: String
    let amount: Int
    let isPending: Bool

    /// Six buckets ending with the current month, like the earnings screen.
    static func lastSixMonths(from bookings: [Booking], counting statuses: Set<BookingStatus>) -> [HostMonthBucket] {
        let calendar = Calendar.current
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM"
        let now = Date()
        return (0..<6).compactMap { offset -> HostMonthBucket? in
            guard let monthDate = calendar.date(byAdding: .month, value: -(5 - offset), to: now),
                  let range = calendar.dateInterval(of: .month, for: monthDate) else { return nil }
            let monthly = bookings.filter { $0.createdAt >= range.start && $0.createdAt < range.end }
            let amount = monthly.filter { statuses.contains($0.status) }.reduce(0) { $0 + $1.totalPrice }
            return HostMonthBucket(
                month: formatter.string(from: range.start),
                amount: amount,
                isPending: monthly.contains { $0.status == .awaitingHost }
            )
        }
    }
}

enum HostMoney {
    static func format(_ amount: Int) -> String {
        "GHS \(amount.formatted(.number.grouping(.automatic)))"
    }
}

enum HostGreeting {
    static var text: String {
        switch Calendar.current.component(.hour, from: Date()) {
        case 5..<12: return "Good morning"
        case 12..<17: return "Good afternoon"
        default: return "Good evening"
        }
    }
}

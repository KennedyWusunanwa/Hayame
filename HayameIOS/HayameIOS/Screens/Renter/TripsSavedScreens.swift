import SwiftUI

// MARK: - Trips
//
// The Trips tab leads with the renter's next trip as a branded hero (live
// countdown, journey line, one-tap message), then the rest of the upcoming and
// past trips as compact cards with an expandable details drawer. Everything
// settles in with a stagger, loading shows shaped skeletons, and switching
// between Upcoming and Past uses the same calm page transition as the tab bar.

enum TripsSegment: String, CaseIterable, Identifiable {
    case upcoming
    case past

    var id: String { rawValue }

    var title: String {
        switch self {
        case .upcoming: return "Upcoming"
        case .past: return "Past"
        }
    }
}

struct TripsScreen: View {
    @EnvironmentObject private var appState: AppState
    @State private var segment: TripsSegment = .upcoming
    @State private var activeChatTarget: TripChatTarget?
    @State private var activeVehicle: Car?
    @State private var disputeBooking: Booking?
    @State private var highlightedBookingID: String?
    @State private var resumeTarget: ResumableCheckout?

    private var visibleBookings: [Booking] {
        appState.renterBookings.filter { $0.paymentStatus == .paid }
    }

    /// Soonest first, so the hero is always the trip that is closest.
    private var upcoming: [Booking] {
        visibleBookings
            .filter { $0.endDate >= Date() }
            .sorted { lhs, rhs in
                if lhs.startDate != rhs.startDate { return lhs.startDate < rhs.startDate }
                return lhs.createdAt > rhs.createdAt
            }
    }

    private var past: [Booking] {
        visibleBookings
            .filter { $0.endDate < Date() }
            .sorted { $0.createdAt > $1.createdAt }
    }

    private var nextTrip: Booking? {
        upcoming.first { [.confirmed, .ongoing, .pending].contains($0.displayStatus) } ?? upcoming.first
    }

    private var otherUpcoming: [Booking] {
        guard let nextTrip else { return upcoming }
        return upcoming.filter { $0.id != nextTrip.id }
    }

    private var isLoading: Bool {
        if case .loading = appState.bookingsLoadState { return true }
        return false
    }

    private var subtitle: String {
        guard appState.isAuthenticated, !isLoading else { return "Your bookings, past and present." }
        if upcoming.isEmpty && past.isEmpty { return "Your bookings will appear here after payment." }
        let upcomingText = "\(upcoming.count) upcoming"
        let pastText = "\(past.count) past"
        return "\(upcomingText) • \(pastText)"
    }

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 16) {
                    header
                        .hayameAppear(index: 0)

                    if let paymentNotice = appState.paymentFlowNotice, !paymentNotice.isEmpty {
                        PaymentNoticeCard(
                            message: paymentNotice,
                            isError: appState.paymentFlowNoticeIsError
                        ) {
                            appState.paymentFlowNotice = nil
                            appState.paymentFlowNoticeIsError = false
                        }
                    }

                    if let resumable = appState.resumableCheckout {
                        ResumeCheckoutCard(resumable: resumable, index: 1) {
                            resumeTarget = resumable
                        }
                        .id(resumable.id)
                        .transition(.move(edge: .top).combined(with: .opacity))
                    }

                    if !appState.isAuthenticated {
                        GuestGateCard(
                            title: "Log in to see your trips",
                            message: "Your bookings, pickup countdowns and host chats live here once you sign in.",
                            systemImage: "calendar.badge.clock",
                            actionTitle: "Log in"
                        ) {
                            appState.returnToAuth()
                        }
                        .hayameAppear(index: 1)
                    } else if isLoading {
                        TripHeroSkeleton()
                            .hayameAppear(index: 1)
                        TripCardSkeleton()
                            .hayameAppear(index: 2)
                        TripCardSkeleton()
                            .hayameAppear(index: 3)
                    } else if case .error(let message) = appState.bookingsLoadState {
                        ErrorStateCard(
                            title: "Bookings unavailable",
                            message: message,
                            actionTitle: "Refresh"
                        ) {
                            appState.retryBookings()
                        }
                        .hayameAppear(index: 1)
                    } else {
                        TripsSegmentControl(
                            selection: $segment,
                            upcomingCount: upcoming.count,
                            pastCount: past.count
                        )
                        .coachMark("trips.segment")
                        .coachTour(.trips)
                        .hayameAppear(index: 1)

                        ZStack(alignment: .top) {
                            segmentContent
                                .id(segment)
                                .transition(HayameTabSwitch.transition)
                        }
                        .animation(HayameTabSwitch.animation, value: segment)
                    }

                    Color.clear.frame(height: 8)
                }
                .padding(16)
                .animation(HayameMotion.settle, value: appState.resumableCheckout)
                .animation(HayameMotion.settle, value: appState.paymentFlowNotice)
            }
            .background(HayameTheme.pageBackground)
            .toolbar(.hidden, for: .navigationBar)
            .refreshable {
                await appState.refreshAllRemoteData()
            }
            .navigationDestination(item: $activeChatTarget) { target in
                ChatThreadScreen(conversationID: target.id, participantName: target.participantName)
                    .environmentObject(appState)
            }
            .navigationDestination(item: $activeVehicle) { car in
                CarDetailScreen(car: car)
            }
            .sheet(item: $disputeBooking) { booking in
                TripDisputeSheet(booking: booking) { reason in
                    await appState.openDispute(bookingID: booking.id, reason: reason)
                }
                .environmentObject(appState)
            }
            .resumeCheckoutPresenter(target: $resumeTarget)
            .task(id: appState.isAuthenticated) {
                await appState.refreshPendingCheckout()
            }
            .onAppear {
                focusPendingBookingIfNeeded(proxy: proxy)
            }
            .onChange(of: appState.pendingBookingID) { _, _ in
                focusPendingBookingIfNeeded(proxy: proxy)
            }
            .onChange(of: appState.bookingsLoadState) { _, _ in
                focusPendingBookingIfNeeded(proxy: proxy)
            }
        }
    }

    // MARK: Sections

    private var header: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text("Trips")
                    .font(.hayame(size: 30, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Text(subtitle)
                    .font(.hayame(size: 13, weight: .semibold))
                    .foregroundStyle(HayameTheme.mutedText)
                    .contentTransition(.numericText())
            }
            Spacer()
            if appState.isSyncingRemote {
                HayameStatusPill(text: "Syncing", tone: .info, isLive: true)
                    .transition(.scale.combined(with: .opacity))
            }
        }
        .animation(HayameMotion.snappy, value: appState.isSyncingRemote)
    }

    @ViewBuilder
    private var segmentContent: some View {
        switch segment {
        case .upcoming:
            VStack(alignment: .leading, spacing: 16) {
                if let nextTrip {
                    NextTripHeroCard(
                        booking: nextTrip,
                        car: car(for: nextTrip),
                        isHighlighted: highlightedBookingID == nextTrip.id,
                        onOpenVehicle: { activeVehicle = $0 },
                        onMessage: { openBookingChat(for: nextTrip) },
                        onDispute: { disputeBooking = nextTrip }
                    )
                    .id(nextTrip.id)
                    .coachMark("trips.card")
                    .hayameAppear(index: 0)

                    if !otherUpcoming.isEmpty {
                        TripsSectionTitle(title: "Also coming up", count: otherUpcoming.count)
                            .hayameAppear(index: 1)
                        ForEach(Array(otherUpcoming.enumerated()), id: \.element.id) { index, booking in
                            TripCard(
                                booking: booking,
                                car: car(for: booking),
                                variant: .upcoming,
                                isHighlighted: highlightedBookingID == booking.id,
                                onOpenVehicle: { activeVehicle = $0 },
                                onMessage: { openBookingChat(for: booking) },
                                onDispute: { disputeBooking = booking }
                            )
                            .id(booking.id)
                            .hayameAppear(index: index + 2)
                        }
                    }
                } else {
                    TripsEmptyState(
                        title: "No upcoming trips",
                        message: "Find a car you like and your next trip will show up here with a live countdown.",
                        systemImage: "car.fill",
                        actionTitle: "Explore cars"
                    ) {
                        appState.renterTab = .explore
                    }
                    .hayameAppear(index: 0)
                }
            }

        case .past:
            VStack(alignment: .leading, spacing: 12) {
                if past.isEmpty {
                    TripsEmptyState(
                        title: "No past trips yet",
                        message: "Completed trips land here so you can book the same car again in a tap.",
                        systemImage: "clock.arrow.circlepath",
                        actionTitle: "Explore cars"
                    ) {
                        appState.renterTab = .explore
                    }
                    .hayameAppear(index: 0)
                } else {
                    ForEach(Array(past.enumerated()), id: \.element.id) { index, booking in
                        TripCard(
                            booking: booking,
                            car: car(for: booking),
                            variant: .past,
                            isHighlighted: highlightedBookingID == booking.id,
                            onOpenVehicle: { activeVehicle = $0 },
                            onMessage: { openBookingChat(for: booking) },
                            onDispute: { disputeBooking = booking }
                        )
                        .id(booking.id)
                        .hayameAppear(index: index)
                    }
                }
            }
        }
    }

    // MARK: Actions

    private func car(for booking: Booking) -> Car? {
        appState.cars.first { $0.id == booking.carID }
    }

    private func openBookingChat(for booking: Booking) {
        guard appState.isAuthenticated else {
            appState.syncErrorMessage = "Log in to use messages."
            return
        }

        Task {
            let summary = tripMessageSummary(for: booking)
            if let existingConversation = booking.conversationID, !existingConversation.isEmpty {
                appState.markConversationRead(existingConversation)
                await appState.addMessageIfMissing(conversationID: existingConversation, body: summary)
                activeChatTarget = TripChatTarget(id: existingConversation, participantName: booking.hostName)
                return
            }

            guard !booking.hostID.isEmpty else {
                appState.syncErrorMessage = "Host details are not available for this booking."
                return
            }

            guard let conversationID = await appState.ensureConversation(
                hostID: booking.hostID,
                carID: booking.carID,
                participantName: booking.hostName
            ) else {
                return
            }

            appState.markConversationRead(conversationID)
            await appState.addMessageIfMissing(conversationID: conversationID, body: summary)
            activeChatTarget = TripChatTarget(id: conversationID, participantName: booking.hostName)
        }
    }

    private func tripMessageSummary(for booking: Booking) -> String {
        let location = [booking.tripUseAddress, booking.tripUseCity, booking.tripUseRegion]
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: ", ")
        let deliveryAddress = booking.deliveryAddress.trimmingCharacters(in: .whitespacesAndNewlines)
        let mode = !deliveryAddress.isEmpty || booking.deliveryFee > 0 ? "Delivery" : "Pickup"
        let handoffLocation = deliveryAddress.isEmpty ? (location.isEmpty ? "Not provided" : location) : deliveryAddress
        let deliveryTime = booking.deliveryTime.trimmingCharacters(in: .whitespacesAndNewlines)
        let contactPhone = booking.contactPhone.trimmingCharacters(in: .whitespacesAndNewlines)
        let deliveryNotes = booking.deliveryNotes.trimmingCharacters(in: .whitespacesAndNewlines)
        let paymentReference = booking.paymentReference?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        var lines = [
            "Trip details",
            "Car: \(booking.carTitle)",
            "Guest: \(appState.currentUser.fullName)",
            "Dates: \(booking.startDate.hayameDateLabel()) - \(booking.endDate.hayameDateLabel())",
            "Duration: \(booking.nights) day\(booking.nights == 1 ? "" : "s")",
            "Time: \(deliveryTime.isEmpty ? "Not set" : deliveryTime)",
            "\(mode) location: \(handoffLocation)",
            "Trip use area: \(location.isEmpty ? "Not provided" : location)",
            "Price: GHS \(booking.totalPrice)",
            "Daily rate: GHS \(booking.dailyRate)",
            "Subtotal: GHS \(booking.subtotal)",
            "Insurance: GHS \(booking.insuranceFee)",
            "Delivery fee: GHS \(booking.deliveryFee)",
            "Outside region fee: GHS \(booking.outsideAccraSurcharge)",
            "Deposit: GHS \(booking.depositAmount)",
            "Payment ref: \(paymentReference.isEmpty ? "N/A" : paymentReference)",
            "Booking ID: \(booking.id)"
        ]
        if !contactPhone.isEmpty {
            lines.append("Contact phone: \(contactPhone)")
        }
        if !deliveryNotes.isEmpty {
            lines.append("Notes: \(deliveryNotes)")
        }
        return lines.joined(separator: "\n")
    }

    private func focusPendingBookingIfNeeded(proxy: ScrollViewProxy) {
        guard let pendingID = appState.pendingBookingID else { return }
        guard let booking = visibleBookings.first(where: { $0.id == pendingID }) else { return }
        let target: TripsSegment = booking.endDate < Date() ? .past : .upcoming
        if segment != target {
            segment = target
        }
        highlightedBookingID = pendingID
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
            withAnimation(.easeInOut(duration: 0.25)) {
                proxy.scrollTo(pendingID, anchor: .top)
            }
        }
        appState.consumePendingBookingFocus(ifMatches: pendingID)
    }
}

// MARK: Segment control

/// Upcoming / Past switch with a sliding pill and live counts.
private struct TripsSegmentControl: View {
    @Binding var selection: TripsSegment
    let upcomingCount: Int
    let pastCount: Int

    @Namespace private var pillNamespace

    var body: some View {
        HStack(spacing: 4) {
            ForEach(TripsSegment.allCases) { segment in
                let selected = segment == selection
                Button {
                    guard !selected else { return }
                    HayameHaptics.select()
                    selection = segment
                } label: {
                    HStack(spacing: 6) {
                        Text(segment.title)
                            .font(.hayame(size: 14, weight: .bold))
                        Text("\(count(for: segment))")
                            .font(.hayame(size: 11, weight: .bold))
                            .padding(.horizontal, 7)
                            .padding(.vertical, 2)
                            .background(
                                (selected ? Color.white.opacity(0.22) : HayameTheme.subtleFill),
                                in: Capsule()
                            )
                            .contentTransition(.numericText())
                    }
                    .foregroundStyle(selected ? .white : HayameTheme.brandNavy)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background {
                        if selected {
                            Capsule()
                                .fill(
                                    LinearGradient(
                                        colors: [HayameTheme.brandBlue, HayameTheme.primaryButtonEnd],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .matchedGeometryEffect(id: "trips-segment-pill", in: pillNamespace)
                        }
                    }
                    .contentShape(Capsule())
                }
                .buttonStyle(.plain)
            }
        }
        .padding(4)
        .background(HayameTheme.cardBackground, in: Capsule())
        .overlay(Capsule().strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
        .animation(HayameMotion.respecting(HayameMotion.snappy), value: selection)
    }

    private func count(for segment: TripsSegment) -> Int {
        segment == .upcoming ? upcomingCount : pastCount
    }
}

private struct TripsSectionTitle: View {
    let title: String
    var count: Int = 0

    var body: some View {
        HStack(spacing: 8) {
            Text(title)
                .font(.hayame(size: 17, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
            if count > 0 {
                Text("\(count)")
                    .font(.hayame(size: 11, weight: .bold))
                    .foregroundStyle(HayameTheme.brandBlue)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 2)
                    .background(HayameTheme.brandBlue.opacity(0.12), in: Capsule())
            }
            Spacer()
        }
        .padding(.top, 4)
    }
}

// MARK: Next trip hero

/// The closest trip as a branded card: status, countdown that ticks every
/// minute, the journey line, and the two actions a renter actually needs.
private struct NextTripHeroCard: View {
    let booking: Booking
    let car: Car?
    var isHighlighted = false
    let onOpenVehicle: (Car) -> Void
    let onMessage: () -> Void
    let onDispute: () -> Void

    @State private var now = Date()
    @State private var showDetails = false
    private let clock = Timer.publish(every: 60, on: .main, in: .common).autoconnect()

    private var status: BookingDisplayStatus { booking.displayStatus }

    private var imageURLString: String? {
        (car?.imageNames.first) ?? booking.carImageNames.first
    }

    private var hostLine: String {
        let host = booking.hostName.trimmingCharacters(in: .whitespacesAndNewlines)
        let hasRealHostName = !host.isEmpty && host.caseInsensitiveCompare("Host") != .orderedSame
        let location = [booking.tripUseCity, booking.tripUseRegion]
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: ", ")
        return [hasRealHostName ? "Hosted by \(host)" : nil, location.isEmpty ? nil : location]
            .compactMap { $0 }
            .joined(separator: " • ")
    }

    private var eyebrow: String {
        switch status {
        case .ongoing: return "TRIP IN PROGRESS"
        case .pending: return "AWAITING HOST"
        default: return "NEXT TRIP"
        }
    }

    private var countdownTitle: String {
        switch status {
        case .pending: return "Waiting for \(booking.hostName.isEmpty ? "the host" : booking.hostName)"
        case .ongoing: return "Return in \(TripCountdown.label(until: booking.endDate, from: now))"
        case .confirmed: return "Pickup in \(TripCountdown.label(until: booking.startDate, from: now))"
        default: return status.label
        }
    }

    private var countdownCaption: String {
        switch status {
        case .pending: return "We'll notify you the moment they respond."
        case .ongoing: return "Ends \(booking.endDate.hayameDateLabel())"
        case .confirmed: return "Starts \(booking.startDate.hayameDateLabel())"
        default: return status.helperText(for: .renter, paymentStatus: booking.paymentStatus)
        }
    }

    private var countdownFraction: Double {
        switch status {
        case .confirmed: return TripCountdown.fraction(from: booking.createdAt, to: booking.startDate, at: now)
        case .ongoing: return TripCountdown.fraction(from: booking.startDate, to: booking.endDate, at: now)
        case .pending: return 0.5
        default: return 1
        }
    }

    private var pillTone: HayameStatusPill.Tone {
        switch status {
        case .pending: return .warning
        case .ongoing: return .success
        case .confirmed: return .info
        case .completed: return .neutral
        case .cancelled, .rejected, .refunded: return .danger
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            ZStack(alignment: .topLeading) {
                BrandHeroBackground()

                VStack(alignment: .leading, spacing: 14) {
                    HStack(alignment: .center) {
                        Text(eyebrow)
                            .font(.hayame(size: 11, weight: .bold))
                            .tracking(0.8)
                            .foregroundStyle(.white.opacity(0.78))
                        Spacer()
                        HeroStatusPill(text: status.label, tone: pillTone, isLive: status == .pending || status == .ongoing)
                    }

                    HStack(alignment: .top, spacing: 14) {
                        VStack(alignment: .leading, spacing: 5) {
                            Text(booking.carTitle)
                                .font(.hayame(size: 22, weight: .bold))
                                .foregroundStyle(.white)
                                .lineLimit(2)
                                .minimumScaleFactor(0.85)
                            Text("\(booking.startDate.hayameDateLabel()) – \(booking.endDate.hayameDateLabel())")
                                .font(.hayame(size: 13, weight: .semibold))
                                .foregroundStyle(.white.opacity(0.9))
                            if !hostLine.isEmpty {
                                Text(hostLine)
                                    .font(.hayame(size: 12, weight: .medium))
                                    .foregroundStyle(.white.opacity(0.75))
                                    .lineLimit(1)
                            }
                        }
                        Spacer(minLength: 0)
                        Button {
                            if let car { onOpenVehicle(car) }
                        } label: {
                            NetworkOrFallbackImage(urlString: imageURLString, targetSize: CGSize(width: 220, height: 170))
                                .frame(width: 96, height: 76)
                                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                                        .strokeBorder(.white.opacity(0.45), lineWidth: 1)
                                )
                                .shadow(color: .black.opacity(0.18), radius: 10, x: 0, y: 6)
                        }
                        .buttonStyle(HayamePressableStyle(scale: 0.95))
                        .disabled(car == nil)
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text(countdownTitle)
                            .font(.hayame(size: 20, weight: .bold))
                            .foregroundStyle(.white)
                            .contentTransition(.numericText())
                        HayameProgressBar(fraction: countdownFraction, tint: .white, track: .white.opacity(0.25), height: 5)
                        Text(countdownCaption)
                            .font(.hayame(size: 12, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.8))
                    }
                }
                .padding(18)
            }
            .clipShape(UnevenRoundedRectangle(topLeadingRadius: 26, bottomLeadingRadius: 0, bottomTrailingRadius: 0, topTrailingRadius: 26, style: .continuous))

            VStack(alignment: .leading, spacing: 14) {
                // The gradient above already carries the countdown and start date.
                TripJourneyTimeline(booking: booking, showsCaption: false)

                if showDetails {
                    TripDetailsGrid(booking: booking)
                        .transition(.opacity.combined(with: .move(edge: .top)))
                }

                HStack(spacing: 10) {
                    Button(action: onMessage) {
                        Label("Message host", systemImage: "bubble.left.and.bubble.right.fill")
                            .font(.hayame(size: 14, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(HayameTheme.brandBlue, in: Capsule())
                    }
                    .buttonStyle(HayamePressableStyle(scale: 0.97))

                    Button {
                        HayameHaptics.select()
                        withAnimation(HayameMotion.settle) { showDetails.toggle() }
                    } label: {
                        HStack(spacing: 6) {
                            Text(showDetails ? "Hide details" : "Trip details")
                            Image(systemName: "chevron.down")
                                .font(.hayame(size: 11, weight: .bold))
                                .rotationEffect(.degrees(showDetails ? 180 : 0))
                        }
                        .font(.hayame(size: 14, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(HayameTheme.brandLight, in: Capsule())
                    }
                    .buttonStyle(HayamePressableStyle(scale: 0.97))

                    if booking.paymentStatus == .paid {
                        Button(action: onDispute) {
                            Image(systemName: "exclamationmark.bubble")
                                .font(.hayame(size: 15, weight: .bold))
                                .foregroundStyle(HayameTheme.mutedText)
                                .frame(width: 42, height: 42)
                                .background(HayameTheme.fieldBackground, in: Circle())
                        }
                        .buttonStyle(HayamePressableStyle(scale: 0.92))
                        .accessibilityLabel("Open dispute")
                    }
                }
            }
            .padding(16)
            .background(HayameTheme.cardBackground)
        }
        .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .strokeBorder(isHighlighted ? HayameTheme.brandBlue : HayameTheme.cardStroke, lineWidth: isHighlighted ? 2 : 1)
        )
        .shadow(color: HayameTheme.brandBlue.opacity(isHighlighted ? 0.22 : 0.14), radius: 18, x: 0, y: 10)
        .onReceive(clock) { now = $0 }
        .animation(HayameMotion.settle, value: isHighlighted)
    }
}

private struct HeroStatusPill: View {
    let text: String
    var tone: HayameStatusPill.Tone = .info
    var isLive = false

    @State private var pulse = false

    var body: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(.white)
                .frame(width: 7, height: 7)
                .scaleEffect(pulse ? 1.25 : 0.85)
                .opacity(pulse ? 1 : 0.6)
            Text(text)
                .font(.hayame(size: 11, weight: .bold))
                .foregroundStyle(.white)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(.white.opacity(0.2), in: Capsule())
        .overlay(Capsule().strokeBorder(.white.opacity(0.3), lineWidth: 1))
        .onAppear {
            guard isLive, !HayameMotion.reduceMotion else { return }
            withAnimation(.easeInOut(duration: 0.9).repeatForever(autoreverses: true)) { pulse = true }
        }
    }
}

/// Facts about the trip as a two-column grid: mode, area, duration, total, ref.
private struct TripDetailsGrid: View {
    let booking: Booking

    private var tripMode: String {
        !booking.deliveryAddress.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || booking.deliveryFee > 0 ? "Delivery" : "Pickup"
    }

    private var tripUse: String {
        let value = [booking.tripUseAddress, booking.tripUseCity, booking.tripUseRegion]
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: ", ")
        return value.isEmpty ? "Not provided" : value
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                TripFact(label: "Duration", value: "\(booking.nights) night\(booking.nights == 1 ? "" : "s")", systemImage: "moon.stars")
                TripFact(label: "Trip mode", value: tripMode, systemImage: tripMode == "Delivery" ? "shippingbox" : "mappin.and.ellipse")
            }
            HStack(spacing: 10) {
                TripFact(label: "Total paid", value: "GHS \(booking.totalPrice)", systemImage: "creditcard")
                TripFact(label: "Trip use area", value: tripUse, systemImage: "map")
            }
            if let paymentReference = booking.paymentReference, !paymentReference.isEmpty {
                Text("Payment ref: \(paymentReference)")
                    .font(.hayame(size: 11, weight: .semibold))
                    .foregroundStyle(HayameTheme.mutedText)
            }
            if let rejectionReason = booking.rejectionReason, !rejectionReason.isEmpty {
                Text("Reason: \(rejectionReason)")
                    .font(.hayame(size: 12, weight: .semibold))
                    .foregroundStyle(HayameTheme.danger)
            }
        }
    }
}

private struct TripFact: View {
    let label: String
    let value: String
    let systemImage: String

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: systemImage)
                .font(.hayame(size: 12, weight: .bold))
                .foregroundStyle(HayameTheme.brandBlue)
                .frame(width: 26, height: 26)
                .background(HayameTheme.brandBlue.opacity(0.12), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
            VStack(alignment: .leading, spacing: 2) {
                Text(label.uppercased())
                    .font(.hayame(size: 9, weight: .bold))
                    .tracking(0.5)
                    .foregroundStyle(HayameTheme.mutedText)
                Text(value)
                    .font(.hayame(size: 13, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(HayameTheme.fieldBackground, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

// MARK: Trip card

/// Compact card for every other trip. Upcoming trips keep the journey line;
/// past trips trade it for a "Book again" shortcut. Details fold out on demand.
private struct TripCard: View {
    enum Variant { case upcoming, past }

    let booking: Booking
    let car: Car?
    let variant: Variant
    var isHighlighted = false
    let onOpenVehicle: (Car) -> Void
    let onMessage: () -> Void
    let onDispute: () -> Void

    @State private var showDetails = false

    private var imageURLString: String? {
        (car?.imageNames.first) ?? booking.carImageNames.first
    }

    private var brandTitle: String {
        let brand = car?.brand.trimmingCharacters(in: .whitespacesAndNewlines)
            ?? booking.carBrand.trimmingCharacters(in: .whitespacesAndNewlines)
        return brand.isEmpty ? booking.carTitle : brand
    }

    private var subtitle: String {
        let host = booking.hostName.trimmingCharacters(in: .whitespacesAndNewlines)
        let location = [booking.tripUseCity, booking.tripUseRegion]
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: ", ")
        return [host, location].filter { !$0.isEmpty }.joined(separator: " • ")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                Button {
                    if let car { onOpenVehicle(car) }
                } label: {
                    NetworkOrFallbackImage(urlString: imageURLString, targetSize: CGSize(width: 200, height: 160))
                        .frame(width: 84, height: 68)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .buttonStyle(HayamePressableStyle(scale: 0.95))
                .disabled(car == nil)

                VStack(alignment: .leading, spacing: 6) {
                    HStack(alignment: .top, spacing: 8) {
                        Text(booking.carTitle)
                            .font(.hayame(size: 16, weight: .bold))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .lineLimit(2)
                        Spacer(minLength: 4)
                        VehicleBrandLogo(title: brandTitle, isSelected: false)
                            .frame(width: 34, height: 24)
                    }
                    if !subtitle.isEmpty {
                        Text(subtitle)
                            .font(.hayame(size: 12, weight: .medium))
                            .foregroundStyle(HayameTheme.mutedText)
                            .lineLimit(1)
                    }
                    HStack(spacing: 8) {
                        BookingStatusBadge(status: booking.displayStatus)
                        Label(
                            "\(booking.startDate.hayameDateLabel()) – \(booking.endDate.hayameDateLabel())",
                            systemImage: "calendar"
                        )
                        .font(.hayame(size: 11, weight: .bold))
                        .foregroundStyle(HayameTheme.brandBlue)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                    }
                }
            }

            if variant == .upcoming {
                TripJourneyTimeline(booking: booking)
            }

            HStack(spacing: 12) {
                TripMetric(value: "\(booking.nights)", unit: booking.nights == 1 ? "night" : "nights")
                TripMetric(value: booking.deliveryFee > 0 || !booking.deliveryAddress.isEmpty ? "Delivery" : "Pickup", unit: "handoff")
                Spacer()
                VStack(alignment: .trailing, spacing: 1) {
                    Text("TOTAL")
                        .font(.hayame(size: 9, weight: .bold))
                        .foregroundStyle(HayameTheme.mutedText)
                    Text("GHS \(booking.totalPrice)")
                        .font(.hayame(size: 17, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                }
            }

            if showDetails {
                TripDetailsGrid(booking: booking)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }

            HStack(spacing: 8) {
                TripActionButton(title: "Message", systemImage: "bubble.left.fill", prominent: variant == .upcoming, action: onMessage)
                if variant == .past, let car {
                    TripActionButton(title: "Book again", systemImage: "arrow.clockwise", prominent: true) {
                        onOpenVehicle(car)
                    }
                }
                if booking.paymentStatus == .paid, booking.displayStatus != .cancelled, booking.displayStatus != .refunded {
                    TripActionButton(title: "Dispute", systemImage: "exclamationmark.bubble", prominent: false, action: onDispute)
                }
                Spacer(minLength: 0)
                Button {
                    HayameHaptics.select()
                    withAnimation(HayameMotion.settle) { showDetails.toggle() }
                } label: {
                    Image(systemName: "chevron.down")
                        .font(.hayame(size: 12, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .rotationEffect(.degrees(showDetails ? 180 : 0))
                        .frame(width: 36, height: 36)
                        .background(HayameTheme.fieldBackground, in: Circle())
                }
                .buttonStyle(HayamePressableStyle(scale: 0.9))
                .accessibilityLabel(showDetails ? "Hide details" : "Show details")
            }
        }
        .padding(14)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .strokeBorder(isHighlighted ? HayameTheme.brandBlue : HayameTheme.cardStroke, lineWidth: isHighlighted ? 2 : 1)
        )
        .shadow(color: isHighlighted ? HayameTheme.brandBlue.opacity(0.2) : HayameTheme.cardShadow, radius: isHighlighted ? 14 : 10, x: 0, y: 5)
        .animation(HayameMotion.settle, value: isHighlighted)
    }
}

private struct TripMetric: View {
    let value: String
    let unit: String

    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(value)
                .font(.hayame(size: 15, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
            Text(unit.uppercased())
                .font(.hayame(size: 9, weight: .bold))
                .tracking(0.4)
                .foregroundStyle(HayameTheme.mutedText)
        }
    }
}

private struct TripActionButton: View {
    let title: String
    let systemImage: String
    var prominent = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: systemImage)
                .font(.hayame(size: 13, weight: .bold))
                .foregroundStyle(prominent ? .white : HayameTheme.brandNavy)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(prominent ? HayameTheme.brandBlue : HayameTheme.brandLight, in: Capsule())
        }
        .buttonStyle(HayamePressableStyle(scale: 0.96))
    }
}

// MARK: Trip states

private struct TripHeroSkeleton: View {
    var body: some View {
        VStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    SkeletonBlock(width: 80, height: 10, cornerRadius: 5)
                    Spacer()
                    SkeletonBlock(width: 78, height: 24, cornerRadius: 12)
                }
                HStack(alignment: .top, spacing: 14) {
                    VStack(alignment: .leading, spacing: 8) {
                        SkeletonBlock(width: 190, height: 20, cornerRadius: 8)
                        SkeletonBlock(width: 150, height: 12, cornerRadius: 6)
                        SkeletonBlock(width: 120, height: 10, cornerRadius: 5)
                    }
                    Spacer()
                    SkeletonBlock(width: 96, height: 76, cornerRadius: 16)
                }
                SkeletonBlock(width: 170, height: 18, cornerRadius: 8)
                SkeletonBlock(height: 5, cornerRadius: 3)
            }
            .padding(18)
            .background(HayameTheme.brandLight)

            VStack(alignment: .leading, spacing: 14) {
                SkeletonBlock(height: 44, cornerRadius: 10)
                HStack(spacing: 10) {
                    SkeletonBlock(height: 40, cornerRadius: 20)
                    SkeletonBlock(width: 110, height: 40, cornerRadius: 20)
                }
            }
            .padding(16)
            .background(HayameTheme.cardBackground)
        }
        .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 26, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
    }
}

private struct TripCardSkeleton: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                SkeletonBlock(width: 84, height: 68, cornerRadius: 14)
                VStack(alignment: .leading, spacing: 8) {
                    SkeletonBlock(width: 160, height: 15, cornerRadius: 6)
                    SkeletonBlock(width: 120, height: 11, cornerRadius: 6)
                    HStack(spacing: 8) {
                        SkeletonBlock(width: 70, height: 20, cornerRadius: 10)
                        SkeletonBlock(width: 110, height: 12, cornerRadius: 6)
                    }
                }
            }
            SkeletonBlock(height: 40, cornerRadius: 10)
            HStack(spacing: 8) {
                SkeletonBlock(width: 100, height: 36, cornerRadius: 18)
                SkeletonBlock(width: 90, height: 36, cornerRadius: 18)
                Spacer()
                SkeletonBlock(width: 36, height: 36, cornerRadius: 18)
            }
        }
        .padding(14)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
    }
}

private struct TripsEmptyState: View {
    let title: String
    let message: String
    let systemImage: String
    let actionTitle: String
    let action: () -> Void

    @State private var ripple = false

    var body: some View {
        VStack(spacing: 14) {
            ZStack {
                ForEach(0..<2, id: \.self) { index in
                    Circle()
                        .stroke(HayameTheme.brandBlue.opacity(0.18), lineWidth: 1.5)
                        .frame(width: 96, height: 96)
                        .scaleEffect(ripple ? 1.55 + CGFloat(index) * 0.25 : 0.7)
                        .opacity(ripple ? 0 : 0.9)
                        .animation(
                            HayameMotion.reduceMotion ? nil : .easeOut(duration: 2.2).repeatForever(autoreverses: false).delay(Double(index) * 0.7),
                            value: ripple
                        )
                }
                Circle()
                    .fill(HayameTheme.brandLight)
                    .frame(width: 96, height: 96)
                Image(systemName: systemImage)
                    .font(.hayame(size: 34, weight: .bold))
                    .foregroundStyle(HayameTheme.brandBlue)
            }
            .frame(height: 120)
            .onAppear { ripple = true }

            Text(title)
                .font(.hayame(size: 18, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
            Text(message)
                .font(.hayame(size: 13, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, 12)

            Button(action: action) {
                Text(actionTitle)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(PrimaryPillButtonStyle())
            .padding(.top, 2)
        }
        .frame(maxWidth: .infinity)
        .padding(22)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 24, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
    }
}

/// Signed-out placeholder shared by Trips and Saved.
struct GuestGateCard: View {
    @Environment(\.colorScheme) private var colorScheme
    let title: String
    let message: String
    let systemImage: String
    let actionTitle: String
    let action: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 12) {
                Image(systemName: systemImage)
                    .font(.hayame(size: 18, weight: .bold))
                    .foregroundStyle(colorScheme == .dark ? HayameTheme.brandBlue : .white)
                    .frame(width: 44, height: 44)
                    .background(
                        colorScheme == .dark
                            ? AnyShapeStyle(HayameTheme.brandBlue.opacity(0.16))
                            : AnyShapeStyle(LinearGradient(colors: [HayameTheme.brandBlue, HayameTheme.primaryButtonEnd], startPoint: .topLeading, endPoint: .bottomTrailing)),
                        in: RoundedRectangle(cornerRadius: 14, style: .continuous)
                    )
                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.hayame(size: 16, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text(message)
                        .font(.hayame(size: 13, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            Button(action: action) {
                Text(actionTitle)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(PrimaryPillButtonStyle())
        }
        .padding(16)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
    }
}

enum TripCountdown {
    static func label(until date: Date, from now: Date) -> String {
        let seconds = max(0, date.timeIntervalSince(now))
        let days = Int(seconds / 86_400)
        let hours = Int(seconds.truncatingRemainder(dividingBy: 86_400) / 3_600)
        let minutes = Int(seconds.truncatingRemainder(dividingBy: 3_600) / 60)
        if days > 0 { return hours > 0 ? "\(days)d \(hours)h" : "\(days)d" }
        if hours > 0 { return minutes > 0 ? "\(hours)h \(minutes)m" : "\(hours)h" }
        return "\(max(minutes, 1))m"
    }

    static func fraction(from start: Date, to end: Date, at now: Date) -> Double {
        let total = end.timeIntervalSince(start)
        guard total > 0 else { return 1 }
        return min(max(now.timeIntervalSince(start) / total, 0), 1)
    }
}

// MARK: - Saved
//
// Saved listings as a small gallery: a summary strip (how many, cheapest day
// rate, how many book instantly), a list/grid toggle, and cards whose heart
// pops and removes the row in place. Empty, loading and signed-out states each
// get their own shaped treatment.

/// How the Saved list is ordered. Persisted so the choice sticks between visits.
enum SavedSort: String, CaseIterable, Identifiable {
    case newest
    case priceLow
    case priceHigh
    case topRated

    var id: String { rawValue }

    var title: String {
        switch self {
        case .newest: return "Newest"
        case .priceLow: return "Price: low to high"
        case .priceHigh: return "Price: high to low"
        case .topRated: return "Top rated"
        }
    }

    var systemImage: String {
        switch self {
        case .newest: return "clock"
        case .priceLow: return "arrow.up.right"
        case .priceHigh: return "arrow.down.right"
        case .topRated: return "star"
        }
    }
}

struct FavoritesScreen: View {
    @EnvironmentObject private var appState: AppState
    @AppStorage("hayame.saved_layout_mode") private var layoutRawValue = ExploreLayoutMode.grid.rawValue
    @AppStorage("hayame.saved_sort") private var sortRawValue = SavedSort.newest.rawValue
    @State private var instantOnly = false
    @State private var deliveryOnly = false
    @State private var activeVehicle: Car?

    private let columnSpacing: CGFloat = 12

    private var layoutMode: ExploreLayoutMode {
        ExploreLayoutMode(rawValue: layoutRawValue) ?? .grid
    }

    private var sort: SavedSort {
        SavedSort(rawValue: sortRawValue) ?? .newest
    }

    /// Everything the renter saved, before sorting and filters.
    private var allSavedCars: [Car] {
        appState.favoriteCars
    }

    /// What the list shows: the saved cars after the sort and the toggles.
    private var savedCars: [Car] {
        var cars = allSavedCars
        if instantOnly { cars = cars.filter(\.instantBook) }
        if deliveryOnly { cars = cars.filter(\.deliveryAvailable) }
        switch sort {
        case .newest: return cars.sorted { $0.createdAt > $1.createdAt }
        case .priceLow: return cars.sorted { $0.dailyPrice < $1.dailyPrice }
        case .priceHigh: return cars.sorted { $0.dailyPrice > $1.dailyPrice }
        case .topRated: return cars.sorted { ($0.rating, $0.reviewsCount) > ($1.rating, $1.reviewsCount) }
        }
    }

    private var hasActiveFilters: Bool { instantOnly || deliveryOnly }

    private var isLoading: Bool {
        if case .loading = appState.favoritesLoadState { return true }
        if appState.isAuthenticated, case .loading = appState.publicCarsLoadState, savedCars.isEmpty { return true }
        return false
    }

    private var subtitle: String {
        guard appState.isAuthenticated else { return "Your shortlist, synced to your account." }
        if isLoading { return "Gathering your shortlist..." }
        if allSavedCars.isEmpty { return "Tap the heart on any listing to keep it here." }
        let prices = allSavedCars.map(\.dailyPrice)
        let lowest = prices.min() ?? 0
        let highest = prices.max() ?? 0
        let range = lowest == highest ? "GHS \(lowest)/day" : "GHS \(lowest) – \(highest)/day"
        return "\(allSavedCars.count) car\(allSavedCars.count == 1 ? "" : "s") • \(range)"
    }

    private var gridRows: [[Car]] {
        stride(from: 0, to: savedCars.count, by: 2).map { index in
            Array(savedCars[index..<min(index + 2, savedCars.count)])
        }
    }

    var body: some View {
        GeometryReader { geometry in
            let cardWidth = max(0, (geometry.size.width - 32 - columnSpacing) / 2)

            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 16) {
                    header
                        .hayameAppear(index: 0)

                    if !appState.isAuthenticated {
                        GuestGateCard(
                            title: "Log in to save cars",
                            message: "Hearts you tap sync to your account and wait for you here.",
                            systemImage: "heart.fill",
                            actionTitle: "Log in"
                        ) {
                            appState.returnToAuth()
                        }
                        .hayameAppear(index: 1)
                    } else if isLoading {
                        SavedSummarySkeleton()
                            .hayameAppear(index: 1)
                        SavedGridSkeleton(cardWidth: cardWidth, spacing: columnSpacing)
                            .hayameAppear(index: 2)
                    } else if case .error(let message) = appState.favoritesLoadState {
                        ErrorStateCard(
                            title: "Favorites unavailable",
                            message: message,
                            actionTitle: "Refresh"
                        ) {
                            appState.retryFavorites()
                        }
                        .hayameAppear(index: 1)
                    } else if allSavedCars.isEmpty {
                        SavedEmptyState {
                            appState.renterTab = .explore
                        }
                        .hayameAppear(index: 1)
                    } else {
                        SavedSummaryStrip(cars: allSavedCars, sort: sort)
                            .hayameAppear(index: 1)

                        SavedFilterBar(
                            sort: sort,
                            instantOnly: $instantOnly,
                            deliveryOnly: $deliveryOnly,
                            onSort: { selected in
                                HayameHaptics.select()
                                withAnimation(HayameMotion.settle) { sortRawValue = selected.rawValue }
                            }
                        )
                        .coachMark("saved.sort")
                        .coachTour(.saved)
                        .hayameAppear(index: 2)

                        if savedCars.isEmpty {
                            VStack(spacing: 10) {
                                Image(systemName: "line.3.horizontal.decrease.circle")
                                    .font(.hayame(size: 30, weight: .bold))
                                    .foregroundStyle(HayameTheme.brandBlue)
                                Text("Nothing matches these filters")
                                    .font(.hayame(size: 16, weight: .bold))
                                    .foregroundStyle(HayameTheme.brandNavy)
                                Button("Clear filters") {
                                    withAnimation(HayameMotion.settle) {
                                        instantOnly = false
                                        deliveryOnly = false
                                    }
                                }
                                .font(.hayame(size: 14, weight: .bold))
                                .foregroundStyle(HayameTheme.brandBlue)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(22)
                            .transition(.opacity)
                        } else if layoutMode == .grid {
                            VStack(spacing: columnSpacing) {
                                ForEach(Array(gridRows.enumerated()), id: \.offset) { rowIndex, row in
                                    HStack(alignment: .top, spacing: columnSpacing) {
                                        ForEach(row) { car in
                                            savedCard(car, layout: .grid)
                                                .frame(width: cardWidth, alignment: .topLeading)
                                                .hayameAppear(index: rowIndex + 2)
                                        }
                                        if row.count == 1 {
                                            Color.clear.frame(width: cardWidth)
                                        }
                                    }
                                }
                            }
                        } else {
                            VStack(spacing: 12) {
                                ForEach(Array(savedCars.enumerated()), id: \.element.id) { index, car in
                                    savedCard(car, layout: .list)
                                        .hayameAppear(index: index + 2)
                                }
                            }
                        }
                    }

                    Color.clear.frame(height: 8)
                }
                .padding(16)
                .animation(HayameMotion.settle, value: savedCars.map(\.id))
                .animation(HayameMotion.settle, value: layoutRawValue)
                .animation(HayameMotion.settle, value: sortRawValue)
                .animation(HayameMotion.settle, value: hasActiveFilters)
            }
        }
        .background(HayameTheme.pageBackground)
        .toolbar(.hidden, for: .navigationBar)
        .refreshable {
            await appState.refreshAllRemoteData()
        }
        .navigationDestination(item: $activeVehicle) { car in
            CarDetailScreen(car: car)
        }
    }

    private var header: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text("Saved")
                    .font(.hayame(size: 30, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Text(subtitle)
                    .font(.hayame(size: 13, weight: .semibold))
                    .foregroundStyle(HayameTheme.mutedText)
                    .contentTransition(.numericText())
            }
            Spacer()
            if appState.isAuthenticated, !allSavedCars.isEmpty {
                ExploreLayoutToggle(selectedLayout: layoutMode) { layout in
                    HayameHaptics.select()
                    layoutRawValue = layout.rawValue
                }
                .coachMark("saved.layout")
                .transition(.scale.combined(with: .opacity))
            }
        }
    }

    private func savedCard(_ car: Car, layout: ExploreLayoutMode) -> some View {
        ZStack(alignment: .topTrailing) {
            Button {
                activeVehicle = car
            } label: {
                ListingCard(
                    car: car,
                    isFavorite: true,
                    layout: layout == .grid ? .tile(imageHeight: 132) : .row,
                    showsFavoriteButton: false,
                    emphasizeSaved: true
                )
            }
            .buttonStyle(HayamePressableStyle(scale: 0.97))

            ListingHeartButton(isFavorite: true, emphasizeSaved: true, onDark: layout == .grid) {
                withAnimation(HayameMotion.settle) {
                    appState.toggleFavorite(carID: car.id)
                }
            }
            .padding(layout == .grid ? 8 : 0)
        }
        .id(car.id)
        .transition(.asymmetric(insertion: .opacity, removal: .scale(scale: 0.9).combined(with: .opacity)))
    }
}

/// Three quick facts about the shortlist. The price tile follows the sort:
/// lowest day rate normally, highest when sorting from the top down.
private struct SavedSummaryStrip: View {
    let cars: [Car]
    var sort: SavedSort = .newest

    private var lowestPrice: Int { cars.map(\.dailyPrice).min() ?? 0 }
    private var highestPrice: Int { cars.map(\.dailyPrice).max() ?? 0 }
    private var instantCount: Int { cars.filter(\.instantBook).count }
    private var showsHighest: Bool { sort == .priceHigh }

    var body: some View {
        HStack(spacing: 10) {
            SavedStatTile(value: "\(cars.count)", label: cars.count == 1 ? "saved car" : "saved cars", systemImage: "heart.fill", tint: HayameTheme.danger)
            SavedStatTile(
                value: "GHS \(showsHighest ? highestPrice : lowestPrice)",
                label: showsHighest ? "highest / day" : "lowest / day",
                systemImage: showsHighest ? "arrow.up.circle.fill" : "tag.fill",
                tint: HayameTheme.brandBlue
            )
            SavedStatTile(value: "\(instantCount)", label: "instant book", systemImage: "bolt.fill", tint: HayameTheme.success)
        }
    }
}

/// Sort menu plus quick toggles, in one scrolling chip row.
private struct SavedFilterBar: View {
    let sort: SavedSort
    @Binding var instantOnly: Bool
    @Binding var deliveryOnly: Bool
    let onSort: (SavedSort) -> Void

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                Menu {
                    ForEach(SavedSort.allCases) { option in
                        Button {
                            onSort(option)
                        } label: {
                            Label(option.title, systemImage: option == sort ? "checkmark" : option.systemImage)
                        }
                    }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "arrow.up.arrow.down")
                            .font(.hayame(size: 12, weight: .bold))
                        Text(sort.title)
                            .font(.hayame(size: 13, weight: .bold))
                        Image(systemName: "chevron.down")
                            .font(.hayame(size: 10, weight: .bold))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 13)
                    .padding(.vertical, 9)
                    .background(HayameTheme.brandBlue, in: Capsule())
                }

                SavedToggleChip(title: "Instant book", systemImage: "bolt.fill", isOn: $instantOnly)
                SavedToggleChip(title: "Delivery", systemImage: "shippingbox", isOn: $deliveryOnly)
            }
            .padding(.horizontal, 1)
        }
    }
}

private struct SavedToggleChip: View {
    let title: String
    let systemImage: String
    @Binding var isOn: Bool

    var body: some View {
        Button {
            HayameHaptics.select()
            withAnimation(HayameMotion.snappy) { isOn.toggle() }
        } label: {
            HStack(spacing: 6) {
                Image(systemName: systemImage)
                    .font(.hayame(size: 12, weight: .bold))
                Text(title)
                    .font(.hayame(size: 13, weight: .bold))
            }
            .foregroundStyle(isOn ? HayameTheme.brandBlue : HayameTheme.brandNavy)
            .padding(.horizontal, 13)
            .padding(.vertical, 9)
            .background(isOn ? HayameTheme.brandBlue.opacity(0.12) : HayameTheme.cardBackground, in: Capsule())
            .overlay(Capsule().strokeBorder(isOn ? HayameTheme.brandBlue : HayameTheme.cardStroke, lineWidth: 1))
        }
        .buttonStyle(HayamePressableStyle(scale: 0.95, haptic: false))
    }
}

private struct SavedStatTile: View {
    let value: String
    let label: String
    let systemImage: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Image(systemName: systemImage)
                .font(.hayame(size: 12, weight: .bold))
                .foregroundStyle(tint)
                .frame(width: 26, height: 26)
                .background(tint.opacity(0.13), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
            Text(value)
                .font(.hayame(size: 17, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .contentTransition(.numericText())
            Text(label)
                .font(.hayame(size: 10, weight: .semibold))
                .foregroundStyle(HayameTheme.mutedText)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
    }
}

private struct SavedEmptyState: View {
    let action: () -> Void

    @State private var float = false

    var body: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(HayameTheme.brandLight)
                    .frame(width: 104, height: 104)
                Image(systemName: "heart.fill")
                    .font(.hayame(size: 40, weight: .bold))
                    .foregroundStyle(HayameTheme.danger.opacity(0.9))
                    .scaleEffect(float ? 1.06 : 0.96)
                ForEach(0..<3, id: \.self) { index in
                    Image(systemName: "heart.fill")
                        .font(.hayame(size: CGFloat(10 + index * 3), weight: .bold))
                        .foregroundStyle(HayameTheme.brandBlue.opacity(0.35))
                        .offset(x: CGFloat(-44 + index * 44), y: float ? CGFloat(-58 - index * 6) : CGFloat(-30 - index * 6))
                        .opacity(float ? 0 : 0.9)
                        .animation(
                            HayameMotion.reduceMotion ? nil : .easeOut(duration: 2.4).repeatForever(autoreverses: false).delay(Double(index) * 0.5),
                            value: float
                        )
                }
            }
            .frame(height: 130)
            .onAppear {
                guard !HayameMotion.reduceMotion else { return }
                withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) { float = true }
            }

            Text("Nothing saved yet")
                .font(.hayame(size: 18, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
            Text("Tap the heart on any listing and it will wait for you here, synced across your devices.")
                .font(.hayame(size: 13, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, 12)

            Button(action: action) {
                Text("Explore cars")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(PrimaryPillButtonStyle())
            .padding(.top, 2)
        }
        .frame(maxWidth: .infinity)
        .padding(22)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 24, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
    }
}

private struct SavedSummarySkeleton: View {
    var body: some View {
        HStack(spacing: 10) {
            ForEach(0..<3, id: \.self) { _ in
                VStack(alignment: .leading, spacing: 8) {
                    SkeletonBlock(width: 26, height: 26, cornerRadius: 8)
                    SkeletonBlock(width: 54, height: 16, cornerRadius: 6)
                    SkeletonBlock(width: 70, height: 10, cornerRadius: 5)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(12)
                .background(HayameTheme.cardBackground)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
            }
        }
    }
}

private struct SavedGridSkeleton: View {
    let cardWidth: CGFloat
    let spacing: CGFloat

    var body: some View {
        VStack(spacing: spacing) {
            ForEach(0..<2, id: \.self) { _ in
                HStack(alignment: .top, spacing: spacing) {
                    ForEach(0..<2, id: \.self) { _ in
                        VStack(alignment: .leading, spacing: 0) {
                            SkeletonBlock(height: 124, cornerRadius: 0)
                            VStack(alignment: .leading, spacing: 7) {
                                SkeletonBlock(width: 110, height: 13, cornerRadius: 6)
                                SkeletonBlock(width: 80, height: 10, cornerRadius: 5)
                                SkeletonBlock(width: 50, height: 10, cornerRadius: 5)
                            }
                            .padding(12)
                        }
                        .frame(width: cardWidth)
                        .background(HayameTheme.cardBackground)
                        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
                    }
                }
            }
        }
    }
}

import SwiftUI
import UIKit

// MARK: - First-use tips
//
// The first time a screen is opened, its key buttons are highlighted one at a
// time: the page dims, a soft spotlight with a pulsing ring sits on the
// button, and a small card explains it. Each screen's tips show once. The very
// first time, a welcome card asks whether to take the tour or skip every tip.
//
// Screens mark buttons with `.coachMark("id")` and ask for their tour with
// `.coachTour(.home)`. Overlays are drawn by `.coachMarkHost()` at the app root
// (and inside sheets with their own scope), so the dim covers bars too.

struct CoachStep: Equatable {
    let target: String
    let title: String
    let message: String
}

struct CoachTour: Equatable {
    let id: String
    var scope: String = "app"
    let steps: [CoachStep]
}

@MainActor
final class CoachMarkCenter: ObservableObject {
    static let shared = CoachMarkCenter()

    enum Phase: Equatable { case welcome, tip }

    struct Active: Equatable {
        let tour: CoachTour
        let steps: [CoachStep]
        var index: Int
        var phase: Phase

        var step: CoachStep { steps[index] }
        var isLast: Bool { index >= steps.count - 1 }
    }

    @Published private(set) var tipsEnabled: Bool
    @Published private(set) var active: Active?
    /// Global frame of the highlighted element.
    @Published private(set) var activeFrame: CGRect?

    private var frames: [String: CGRect] = [:]
    private var pending: [String: Task<Void, Never>] = [:]
    /// Tours asked for by screens that are still showing, so they can start
    /// once whatever is covering the app (see `setHeld`) goes away.
    private var requested: [String: CoachTour] = [:]
    private var held = false
    private var seen: Set<String>
    private var welcomeDone: Bool
    /// Screenshot runs keep tips out of the way unless asked for.
    private let suppressed: Bool

    private let defaults = UserDefaults.standard
    private let enabledKey = "hayame.tips_enabled"
    private let seenKey = "hayame.tips_seen"
    private let welcomeKey = "hayame.tips_welcome_done"

    private init() {
        let args = ProcessInfo.processInfo.arguments
        if args.contains("-HAYAME_RESET_TIPS") {
            defaults.removeObject(forKey: seenKey)
            defaults.removeObject(forKey: welcomeKey)
            defaults.set(true, forKey: enabledKey)
        }
        tipsEnabled = defaults.object(forKey: enabledKey) as? Bool ?? true
        seen = Set(defaults.stringArray(forKey: seenKey) ?? [])
        welcomeDone = defaults.bool(forKey: welcomeKey)
        suppressed = args.contains("-HAYAME_SCREENSHOT_ROUTE") && !args.contains("-HAYAME_SHOW_TIPS")
        #if DEBUG
        if args.contains("-HAYAME_TIPS_SKIP_WELCOME") { welcomeDone = true }
        if let index = args.firstIndex(of: "-HAYAME_TIPS_ADVANCE_AFTER"), args.indices.contains(index + 1) {
            debugAdvanceInterval = Double(args[index + 1])
        }
        #endif
    }

    #if DEBUG
    /// Screenshot runs can't tap, so tips can step themselves along.
    private var debugAdvanceInterval: Double?

    private func scheduleDebugAdvance() {
        guard let interval = debugAdvanceInterval else { return }
        Task { [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(interval * 1_000_000_000))
            guard let self, self.active != nil else { return }
            if self.active?.phase == .welcome { self.acceptWelcome() } else { self.next() }
            self.scheduleDebugAdvance()
        }
    }
    #endif

    // MARK: Targets

    func report(_ id: String, frame: CGRect) {
        frames[id] = frame
        if let active, active.phase == .tip, active.step.target == id, activeFrame != frame {
            activeFrame = frame
        }
    }

    func remove(_ id: String) {
        frames[id] = nil
    }

    // MARK: Tours

    func request(_ tour: CoachTour) {
        guard tipsEnabled, !suppressed, !seen.contains(tour.id) else { return }
        requested[tour.id] = tour
        guard !held else { return }
        pending[tour.id]?.cancel()
        pending[tour.id] = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 900_000_000)
            guard !Task.isCancelled else { return }
            self?.start(tour)
        }
    }

    func cancel(_ tourID: String) {
        requested[tourID] = nil
        pending[tourID]?.cancel()
        pending[tourID] = nil
        if active?.tour.id == tourID {
            withAnimation(.easeOut(duration: 0.2)) {
                active = nil
                activeFrame = nil
            }
        }
    }

    /// Tips wait while something covers the whole app (the Terms of Service
    /// agreement): a tip showing now is put away without being marked as seen,
    /// and the tours of the screens underneath start when the hold ends.
    func setHeld(_ value: Bool) {
        guard held != value else { return }
        held = value
        if value {
            pending.values.forEach { $0.cancel() }
            pending = [:]
            if active != nil {
                active = nil
                activeFrame = nil
            }
        } else {
            requested.values.forEach { request($0) }
        }
    }

    private func start(_ tour: CoachTour) {
        pending[tour.id] = nil
        guard !held, active == nil, tipsEnabled, !seen.contains(tour.id) else { return }
        let screen = Self.screenBounds.insetBy(dx: 0, dy: 44)
        let steps = tour.steps.filter { step in
            guard let frame = frames[step.target], frame.width > 1, frame.height > 1 else { return false }
            let visible = frame.intersection(screen)
            return !visible.isNull && visible.height >= min(frame.height * 0.6, frame.height - 1)
        }
        guard !steps.isEmpty else { return }
        withAnimation(HayameMotion.settle) {
            active = Active(tour: tour, steps: steps, index: 0, phase: welcomeDone ? .tip : .welcome)
            activeFrame = welcomeDone ? frames[steps[0].target] : nil
        }
        #if DEBUG
        scheduleDebugAdvance()
        #endif
    }

    func next() {
        guard var current = active else { return }
        HayameHaptics.light()
        if current.isLast {
            finish()
            return
        }
        current.index += 1
        withAnimation(HayameMotion.settle) {
            active = current
            activeFrame = frames[current.step.target] ?? activeFrame
        }
    }

    func skip() {
        HayameHaptics.select()
        finish()
    }

    private func finish() {
        guard let current = active else { return }
        seen.insert(current.tour.id)
        persist()
        withAnimation(.easeOut(duration: 0.25)) {
            active = nil
            activeFrame = nil
        }
    }

    func acceptWelcome() {
        welcomeDone = true
        persist()
        guard var current = active else { return }
        HayameHaptics.light()
        current.phase = .tip
        withAnimation(HayameMotion.settle) {
            active = current
            activeFrame = frames[current.step.target]
        }
    }

    func turnOffAllTips() {
        HayameHaptics.select()
        welcomeDone = true
        tipsEnabled = false
        persist()
        withAnimation(.easeOut(duration: 0.25)) {
            active = nil
            activeFrame = nil
        }
    }

    func setTipsEnabled(_ enabled: Bool) {
        tipsEnabled = enabled
        if enabled == false {
            active = nil
            activeFrame = nil
        }
        persist()
    }

    /// Shows every screen's tips again, starting with the welcome card.
    func replayAll() {
        seen = []
        welcomeDone = false
        tipsEnabled = true
        persist()
    }

    private func persist() {
        defaults.set(tipsEnabled, forKey: enabledKey)
        defaults.set(Array(seen), forKey: seenKey)
        defaults.set(welcomeDone, forKey: welcomeKey)
    }

    private static var screenBounds: CGRect {
        let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first
        return scene?.screen.bounds ?? CGRect(x: 0, y: 0, width: 390, height: 844)
    }
}

// MARK: - Modifiers

extension View {
    /// Marks this view as something a tip can point at.
    func coachMark(_ id: String) -> some View {
        modifier(CoachMarkTargetModifier(id: id))
    }

    /// Asks for this screen's tips the first time it appears.
    func coachTour(_ tour: CoachTour) -> some View {
        modifier(CoachTourRequestModifier(tour: tour))
    }

    /// Draws tips for `scope` over this view. The app root hosts "app"; sheets
    /// with their own tours host their own scope.
    func coachMarkHost(scope: String = "app") -> some View {
        modifier(CoachMarkHostModifier(scope: scope))
    }
}

private struct CoachMarkTargetModifier: ViewModifier {
    let id: String

    func body(content: Content) -> some View {
        content.background {
            GeometryReader { proxy in
                Color.clear
                    .onAppear { CoachMarkCenter.shared.report(id, frame: proxy.frame(in: .global)) }
                    .onChange(of: proxy.frame(in: .global)) { _, frame in
                        CoachMarkCenter.shared.report(id, frame: frame)
                    }
                    .onDisappear { CoachMarkCenter.shared.remove(id) }
            }
        }
    }
}

private struct CoachTourRequestModifier: ViewModifier {
    let tour: CoachTour

    func body(content: Content) -> some View {
        content
            .onAppear { CoachMarkCenter.shared.request(tour) }
            .onDisappear { CoachMarkCenter.shared.cancel(tour.id) }
    }
}

private struct CoachMarkHostModifier: ViewModifier {
    let scope: String
    @ObservedObject private var center = CoachMarkCenter.shared

    func body(content: Content) -> some View {
        content
            .overlay {
                if let active = center.active, active.tour.scope == scope {
                    CoachMarkOverlay(active: active, frame: center.activeFrame)
                        .transition(.opacity)
                }
            }
            .animation(.easeInOut(duration: 0.28), value: center.active?.tour.id)
    }
}

// MARK: - Overlay

private struct CoachMarkOverlay: View {
    let active: CoachMarkCenter.Active
    let frame: CGRect?

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var pulse = false

    var body: some View {
        GeometryReader { proxy in
            let origin = proxy.frame(in: .global).origin
            let hole: CGRect? = active.phase == .tip
                ? frame.map { $0.offsetBy(dx: -origin.x, dy: -origin.y).insetBy(dx: -6, dy: -6) }
                : nil
            let radius = hole.map { min(18, $0.height / 2) } ?? 18

            ZStack(alignment: .topLeading) {
                CoachScrim(hole: hole ?? .zero, cornerRadius: radius)
                    .fill(Color.black.opacity(active.phase == .welcome ? 0.5 : 0.58), style: FillStyle(eoFill: true))
                    .contentShape(Rectangle())
                    .onTapGesture {
                        if active.phase == .tip { CoachMarkCenter.shared.next() }
                    }

                if let hole {
                    RoundedRectangle(cornerRadius: radius, style: .continuous)
                        .strokeBorder(HayameTheme.brandBlue, lineWidth: 2)
                        .frame(width: hole.width, height: hole.height)
                        .scaleEffect(pulse ? 1.06 : 1)
                        .opacity(pulse ? 0.25 : 0.95)
                        .position(x: hole.midX, y: hole.midY)
                        .allowsHitTesting(false)

                    RoundedRectangle(cornerRadius: radius, style: .continuous)
                        .strokeBorder(Color.white.opacity(0.85), lineWidth: 1.5)
                        .frame(width: hole.width, height: hole.height)
                        .position(x: hole.midX, y: hole.midY)
                        .allowsHitTesting(false)

                    tipCard(in: proxy.size, hole: hole)
                } else if active.phase == .welcome {
                    CoachWelcomeCard()
                        .padding(.horizontal, 24)
                        .frame(width: proxy.size.width, height: proxy.size.height)
                        .transition(.scale(scale: 0.92).combined(with: .opacity))
                }
            }
        }
        .ignoresSafeArea()
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeInOut(duration: 1.1).repeatForever(autoreverses: false)) {
                pulse = true
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityAddTraits(.isModal)
    }

    @ViewBuilder
    private func tipCard(in size: CGSize, hole: CGRect) -> some View {
        let spaceBelow = size.height - hole.maxY
        let placeBelow = spaceBelow > 250 || spaceBelow > hole.minY
        let arrowX = min(max(hole.midX, 34), size.width - 34)

        VStack(spacing: 0) {
            if placeBelow {
                Color.clear.frame(height: hole.maxY + 8)
                CoachArrow(pointsUp: true)
                    .fill(HayameTheme.cardBackground)
                    .frame(width: 18, height: 9)
                    .offset(x: arrowX - size.width / 2)
                card
                Spacer(minLength: 0)
            } else {
                Spacer(minLength: 0)
                card
                CoachArrow(pointsUp: false)
                    .fill(HayameTheme.cardBackground)
                    .frame(width: 18, height: 9)
                    .offset(x: arrowX - size.width / 2)
                Color.clear.frame(height: size.height - hole.minY + 8)
            }
        }
        .frame(width: size.width, height: size.height)
        .id(active.index)
        .transition(.asymmetric(
            insertion: .opacity.combined(with: .offset(y: placeBelow ? 12 : -12)),
            removal: .opacity
        ))
    }

    private var card: some View {
        CoachTipCard(
            step: active.step,
            index: active.index,
            count: active.steps.count,
            isLast: active.isLast
        )
        .padding(.horizontal, 20)
    }
}

/// Full-screen dim with a rounded hole; the hole animates between targets.
private struct CoachScrim: Shape {
    var hole: CGRect
    var cornerRadius: CGFloat

    var animatableData: AnimatablePair<AnimatablePair<CGFloat, CGFloat>, AnimatablePair<CGFloat, CGFloat>> {
        get { AnimatablePair(AnimatablePair(hole.minX, hole.minY), AnimatablePair(hole.width, hole.height)) }
        set {
            hole = CGRect(
                x: newValue.first.first,
                y: newValue.first.second,
                width: newValue.second.first,
                height: newValue.second.second
            )
        }
    }

    func path(in rect: CGRect) -> Path {
        var path = Path(rect)
        if hole.width > 1, hole.height > 1 {
            path.addRoundedRect(
                in: hole,
                cornerSize: CGSize(width: cornerRadius, height: cornerRadius),
                style: .continuous
            )
        }
        return path
    }
}

private struct CoachArrow: Shape {
    let pointsUp: Bool

    func path(in rect: CGRect) -> Path {
        var path = Path()
        if pointsUp {
            path.move(to: CGPoint(x: rect.minX, y: rect.maxY))
            path.addLine(to: CGPoint(x: rect.midX, y: rect.minY))
            path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        } else {
            path.move(to: CGPoint(x: rect.minX, y: rect.minY))
            path.addLine(to: CGPoint(x: rect.midX, y: rect.maxY))
            path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
        }
        path.closeSubpath()
        return path
    }
}

private struct CoachTipCard: View {
    let step: CoachStep
    let index: Int
    let count: Int
    let isLast: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "sparkles")
                    .font(.hayame(size: 11, weight: .bold))
                Text(count > 1 ? "Tip \(index + 1) of \(count)" : "Tip")
                    .font(.hayame(size: 11, weight: .bold))
                    .contentTransition(.numericText())
            }
            .foregroundStyle(HayameTheme.brandBlue)

            Text(step.title)
                .font(.hayame(size: 17, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
                .fixedSize(horizontal: false, vertical: true)

            Text(step.message)
                .font(.hayame(size: 14, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: 10) {
                Button("Skip") {
                    CoachMarkCenter.shared.skip()
                }
                .font(.hayame(size: 14, weight: .semibold))
                .foregroundStyle(HayameTheme.mutedText)
                .opacity(isLast ? 0 : 1)
                .disabled(isLast)

                Spacer(minLength: 0)

                if count > 1 {
                    HStack(spacing: 5) {
                        ForEach(0..<count, id: \.self) { dot in
                            Capsule()
                                .fill(dot == index ? HayameTheme.brandBlue : HayameTheme.controlStroke)
                                .frame(width: dot == index ? 16 : 6, height: 6)
                        }
                    }
                }

                Spacer(minLength: 0)

                Button {
                    CoachMarkCenter.shared.next()
                } label: {
                    Text(isLast ? "Got it" : "Next")
                        .font(.hayame(size: 14, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 18)
                        .padding(.vertical, 9)
                        .background(HayameTheme.brandBlue, in: Capsule())
                }
                .buttonStyle(HayamePressableStyle(scale: 0.94, haptic: false))
            }
            .padding(.top, 6)
        }
        .padding(16)
        .frame(maxWidth: 340, alignment: .leading)
        .background(HayameTheme.cardBackground, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
        .shadow(color: .black.opacity(0.22), radius: 24, x: 0, y: 12)
    }
}

private struct CoachWelcomeCard: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(HayameTheme.brandBlue.opacity(0.14))
                    .frame(width: 78, height: 78)
                CoachWavingHand(animated: !reduceMotion)
            }

            Text("Welcome to Hayame")
                .font(.hayame(size: 21, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)

            Text("Want a quick tour? We'll point out the key buttons once on each screen. You can skip anytime.")
                .font(.hayame(size: 14, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)

            Button("Show me around") {
                CoachMarkCenter.shared.acceptWelcome()
            }
            .buttonStyle(SolidPillButtonStyle())
            .padding(.top, 4)

            Button("Skip all tips") {
                CoachMarkCenter.shared.turnOffAllTips()
            }
            .font(.hayame(size: 14, weight: .semibold))
            .foregroundStyle(HayameTheme.mutedText)
        }
        .padding(22)
        .frame(maxWidth: 340)
        .background(HayameTheme.cardBackground, in: RoundedRectangle(cornerRadius: 26, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 26, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
        .shadow(color: .black.opacity(0.25), radius: 30, x: 0, y: 14)
    }
}

/// A friendly wave: three swings from the wrist that ease out, a small lift on
/// the first swing, then a short rest before waving again.
private struct CoachWavingHand: View {
    let animated: Bool

    private struct Pose {
        var angle: Double = 0
        var scale: CGFloat = 1
    }

    /// Roughly where the wrist sits in the symbol, so it pivots like a real hand.
    private let wrist = UnitPoint(x: 0.72, y: 0.92)

    var body: some View {
        let hand = Image(systemName: "hand.wave.fill")
            .font(.hayame(size: 32, weight: .bold))
            .foregroundStyle(HayameTheme.brandBlue)

        if animated {
            hand.keyframeAnimator(initialValue: Pose(), repeating: true) { content, pose in
                content
                    .rotationEffect(.degrees(pose.angle), anchor: wrist)
                    .scaleEffect(pose.scale, anchor: wrist)
            } keyframes: { _ in
                KeyframeTrack(\.angle) {
                    LinearKeyframe(0, duration: 0.35)
                    CubicKeyframe(20, duration: 0.2)
                    CubicKeyframe(-10, duration: 0.22)
                    CubicKeyframe(17, duration: 0.2)
                    CubicKeyframe(-7, duration: 0.22)
                    CubicKeyframe(11, duration: 0.2)
                    SpringKeyframe(0, duration: 0.4, spring: .bouncy)
                    LinearKeyframe(0, duration: 1.3)
                }
                KeyframeTrack(\.scale) {
                    LinearKeyframe(1, duration: 0.35)
                    SpringKeyframe(1.1, duration: 0.25, spring: .snappy)
                    CubicKeyframe(1.04, duration: 0.6)
                    SpringKeyframe(1, duration: 0.39, spring: .smooth)
                    LinearKeyframe(1, duration: 1.5)
                }
            }
        } else {
            hand
        }
    }
}

// MARK: - Tours

extension CoachTour {
    static let home = CoachTour(id: "home", steps: [
        CoachStep(target: "home.search", title: "Search anything", message: "Look up a car, a city or a host, then tap the magnifier."),
        CoachStep(target: "home.filters", title: "Fine-tune results", message: "Set price, seats, delivery and more."),
        CoachStep(target: "home.categories", title: "Browse by body type", message: "Tap a type to filter instantly. The most popular types come first."),
        CoachStep(target: "home.location", title: "Change area", message: "Pick the city you're browsing in to see cars near you.")
    ])

    static let explore = CoachTour(id: "explore", steps: [
        CoachStep(target: "explore.filters", title: "Filters", message: "Narrow the list by price, type, delivery and instant book."),
        CoachStep(target: "explore.layout", title: "Grid or list", message: "Switch how listings are shown.")
    ])

    static let carDetail = CoachTour(id: "carDetail", steps: [
        CoachStep(target: "detail.photos", title: "Swipe the photos", message: "Tap a photo to see it full screen."),
        CoachStep(target: "detail.trip", title: "Your trip", message: "Tap the pencil to change dates or where you'll drive. The price updates as you go."),
        CoachStep(target: "detail.host", title: "Talk to the host", message: "Ask about pickup or delivery before you book."),
        CoachStep(target: "detail.book", title: "Ready when you are", message: "Book now walks you through dates, handoff and payment.")
    ])

    static let booking = CoachTour(id: "booking", scope: "booking", steps: [
        CoachStep(target: "booking.progress", title: "Four quick steps", message: "Go back anytime. Nothing is charged until the last step."),
        CoachStep(target: "booking.dates", title: "Tap a date to change it", message: "Days that are already booked are blocked."),
        CoachStep(target: "booking.total", title: "Always see the cost", message: "This updates as you choose. Fees and the deposit show before you pay.")
    ])

    static let trips = CoachTour(id: "trips", steps: [
        CoachStep(target: "trips.segment", title: "Upcoming and past", message: "Switch between trips ahead and trips you've taken."),
        CoachStep(target: "trips.card", title: "Everything for your trip", message: "Message the host, see details or report a problem from here.")
    ])

    static let saved = CoachTour(id: "saved", steps: [
        CoachStep(target: "saved.sort", title: "Sort your shortlist", message: "Order by price, rating or newest, and filter to instant book or delivery."),
        CoachStep(target: "saved.layout", title: "Grid or list", message: "Switch how your saved cars are shown.")
    ])

    static let messages = CoachTour(id: "messages", steps: [
        CoachStep(target: "inbox.search", title: "Find a conversation", message: "Search by name or by anything said in the chat."),
        CoachStep(target: "inbox.first", title: "Open a chat", message: "Unread chats have a blue ring and a count.")
    ])

    static let more = CoachTour(id: "more", steps: [
        CoachStep(target: "more.profile", title: "Your profile", message: "Complete it so hosts know who's booking."),
        CoachStep(target: "more.quick", title: "Shortcuts", message: "Trips, messages, saved cars and your dashboard."),
        CoachStep(target: "more.settings", title: "Settings", message: "Appearance, app icon, notifications and these tips.")
    ])

    static let hostHome = CoachTour(id: "hostHome", steps: [
        CoachStep(target: "host.hero", title: "Your month at a glance", message: "Earnings so far, listings and requests waiting on you."),
        CoachStep(target: "host.switch", title: "Switch modes", message: "Flip this to go back to renting.")
    ])

    static let hostCars = CoachTour(id: "hostCars", steps: [
        CoachStep(target: "hostCars.add", title: "Add a listing", message: "List another car in a few steps."),
        CoachStep(target: "hostCars.row", title: "Manage each car", message: "Edit details, photos and the days it's available.")
    ])

    static let hostBookings = CoachTour(id: "hostBookings", steps: [
        CoachStep(target: "hostBookings.segment", title: "Requests first", message: "New requests wait here until you approve or decline.")
    ])

    static let hostEarnings = CoachTour(id: "hostEarnings", steps: [
        CoachStep(target: "hostEarnings.month", title: "This month", message: "What you've earned so far this month."),
        CoachStep(target: "hostEarnings.trend", title: "Six-month trend", message: "Amber bars are trips still awaiting approval.")
    ])
}

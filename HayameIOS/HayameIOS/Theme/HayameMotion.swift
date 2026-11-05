import SwiftUI
import UIKit

// MARK: - Motion tokens
//
// One place for every spring and duration the app uses, so screens move with the
// same character. Reach for these instead of inline literals.

enum HayameMotion {
    /// Quick, confident settle for taps, toggles and selection changes.
    static let snappy = Animation.spring(response: 0.32, dampingFraction: 0.78)
    /// Default for layout and step changes.
    static let settle = Animation.spring(response: 0.42, dampingFraction: 0.88)
    /// Softer motion for cards sliding in or sections appearing.
    static let gentle = Animation.spring(response: 0.55, dampingFraction: 0.86)
    /// A touch of overshoot for celebratory moments (success check, markers).
    static let bouncy = Animation.spring(response: 0.5, dampingFraction: 0.62)
    /// Plain cross-fade.
    static let fade = Animation.easeInOut(duration: 0.22)

    /// Mirrors the system Reduce Motion switch for code that runs outside a view.
    static var reduceMotion: Bool { UIAccessibility.isReduceMotionEnabled }

    /// The given animation, or a plain fade when Reduce Motion is on.
    static func respecting(_ animation: Animation) -> Animation {
        reduceMotion ? fade : animation
    }
}

// MARK: - Tab switching

/// How a root tab's page comes in when the bottom bar selection changes: a
/// short ease-out fade with a small rise, never a spring, so lists and cards
/// land without overshooting. The tab bar's pill keeps its own spring.
enum HayameTabSwitch {
    static var animation: Animation {
        HayameMotion.respecting(.easeOut(duration: 0.24))
    }

    static var transition: AnyTransition {
        if HayameMotion.reduceMotion {
            return .opacity
        }
        return .asymmetric(
            insertion: .opacity.combined(with: .offset(y: 10)),
            removal: .opacity
        )
    }
}

// MARK: - Haptics

enum HayameHaptics {
    static func tap() { UIImpactFeedbackGenerator(style: .soft).impactOccurred() }
    static func light() { UIImpactFeedbackGenerator(style: .light).impactOccurred() }
    static func medium() { UIImpactFeedbackGenerator(style: .medium).impactOccurred() }
    static func select() { UISelectionFeedbackGenerator().selectionChanged() }
    static func success() { UINotificationFeedbackGenerator().notificationOccurred(.success) }
    static func warning() { UINotificationFeedbackGenerator().notificationOccurred(.warning) }
    static func error() { UINotificationFeedbackGenerator().notificationOccurred(.error) }
}

// MARK: - Staggered appearance

/// Fades, lifts and settles a view into place when it first appears. Pass an
/// index to stagger siblings. Honors Reduce Motion by fading only.
struct HayameAppearModifier: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    let delay: Double
    let offsetY: CGFloat
    let scale: CGFloat

    @State private var shown = false

    func body(content: Content) -> some View {
        content
            .opacity(shown ? 1 : 0)
            .offset(y: shown || reduceMotion ? 0 : offsetY)
            .scaleEffect(shown || reduceMotion ? 1 : scale)
            .onAppear {
                guard !shown else { return }
                if reduceMotion {
                    withAnimation(.easeOut(duration: 0.2).delay(min(delay, 0.2))) { shown = true }
                } else {
                    withAnimation(HayameMotion.gentle.delay(delay)) { shown = true }
                }
            }
    }
}

extension View {
    /// Staggered entrance. `index` spaces siblings out; the delay is capped so
    /// long lists never keep late rows waiting.
    func hayameAppear(
        index: Int = 0,
        step: Double = 0.06,
        base: Double = 0.02,
        offsetY: CGFloat = 14,
        scale: CGFloat = 0.98
    ) -> some View {
        modifier(
            HayameAppearModifier(
                delay: base + Double(min(index, 10)) * step,
                offsetY: offsetY,
                scale: scale
            )
        )
    }
}

// MARK: - Press feedback

/// Scales a tappable card down slightly while pressed, with a soft haptic.
/// Works for `Button` and `NavigationLink`.
struct HayamePressableStyle: ButtonStyle {
    var scale: CGFloat = 0.97
    var haptic = true

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? scale : 1)
            .opacity(configuration.isPressed ? 0.94 : 1)
            .animation(HayameMotion.snappy, value: configuration.isPressed)
            .onChange(of: configuration.isPressed) { _, pressed in
                if pressed && haptic { HayameHaptics.tap() }
            }
    }
}

// MARK: - Success check

struct HayameCheckmarkShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.minX + rect.width * 0.06, y: rect.minY + rect.height * 0.55))
        path.addLine(to: CGPoint(x: rect.minX + rect.width * 0.38, y: rect.minY + rect.height * 0.86))
        path.addLine(to: CGPoint(x: rect.minX + rect.width * 0.96, y: rect.minY + rect.height * 0.18))
        return path
    }
}

/// A filled disc that pops in, then draws its checkmark. Used wherever
/// something completes: payment, approval, confirmation.
struct HayameSuccessCheck: View {
    var size: CGFloat = 72
    var color: Color = HayameTheme.success
    var delay: Double = 0

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var discScale: CGFloat = 0.25
    @State private var discOpacity = 0.0
    @State private var checkProgress: CGFloat = 0
    @State private var ringScale: CGFloat = 0.7
    @State private var ringOpacity = 0.0

    var body: some View {
        ZStack {
            Circle()
                .stroke(color.opacity(0.4), lineWidth: 2)
                .scaleEffect(ringScale)
                .opacity(ringOpacity)

            Circle()
                .fill(color)
                .scaleEffect(discScale)
                .opacity(discOpacity)

            HayameCheckmarkShape()
                .trim(from: 0, to: checkProgress)
                .stroke(.white, style: StrokeStyle(lineWidth: max(2.5, size * 0.085), lineCap: .round, lineJoin: .round))
                .frame(width: size * 0.46, height: size * 0.46)
        }
        .frame(width: size, height: size)
        .onAppear(perform: run)
    }

    private func run() {
        if reduceMotion {
            discScale = 1
            discOpacity = 1
            checkProgress = 1
            return
        }
        withAnimation(HayameMotion.bouncy.delay(delay)) {
            discScale = 1
            discOpacity = 1
        }
        withAnimation(.easeOut(duration: 0.34).delay(delay + 0.2)) {
            checkProgress = 1
        }
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: UInt64((delay + 0.12) * 1_000_000_000))
            ringOpacity = 0.9
            withAnimation(.easeOut(duration: 0.75)) {
                ringScale = 1.6
                ringOpacity = 0
            }
        }
    }
}

// MARK: - Sparkle burst

/// A handful of dots that fly outward and fade. Layer it behind a success check.
struct HayameSparkleBurst: View {
    var colors: [Color] = [HayameTheme.brandBlue, HayameTheme.success, HayameTheme.warning]
    var count = 12
    var radius: CGFloat = 58
    var delay: Double = 0.1

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var fired = false

    var body: some View {
        ZStack {
            ForEach(0..<count, id: \.self) { index in
                let angle = Double(index) / Double(count) * 2 * .pi - .pi / 2
                let distance = radius * (index.isMultiple(of: 2) ? 1 : 0.78)
                Circle()
                    .fill(colors[index % colors.count])
                    .frame(width: index.isMultiple(of: 3) ? 7 : 5, height: index.isMultiple(of: 3) ? 7 : 5)
                    .offset(
                        x: fired ? cos(angle) * distance : 0,
                        y: fired ? sin(angle) * distance : 0
                    )
                    .scaleEffect(fired ? 0.3 : 1)
                    .opacity(fired ? 0 : 0.95)
            }
        }
        .allowsHitTesting(false)
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeOut(duration: 0.85).delay(delay)) {
                fired = true
            }
        }
    }
}

// MARK: - Live status pill

/// A floating capsule with a status dot and text that slides to its next value.
struct HayameStatusPill: View {
    enum Tone {
        case info, success, warning, danger, neutral

        var color: Color {
            switch self {
            case .info: return HayameTheme.brandBlue
            case .success: return HayameTheme.success
            case .warning: return HayameTheme.warning
            case .danger: return HayameTheme.danger
            case .neutral: return HayameTheme.mutedText
            }
        }
    }

    let text: String
    var tone: Tone = .info
    /// Pulses the dot while something is in progress.
    var isLive = false
    var systemImage: String? = nil

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var pulse = false

    var body: some View {
        HStack(spacing: 8) {
            ZStack {
                if isLive && !reduceMotion {
                    Circle()
                        .fill(tone.color.opacity(0.35))
                        .frame(width: 8, height: 8)
                        .scaleEffect(pulse ? 2.6 : 1)
                        .opacity(pulse ? 0 : 1)
                }
                if let systemImage {
                    Image(systemName: systemImage)
                        .font(.hayame(size: 11, weight: .bold))
                        .foregroundStyle(tone.color)
                } else {
                    Circle()
                        .fill(tone.color)
                        .frame(width: 8, height: 8)
                }
            }
            .frame(width: 14, height: 14)

            ZStack {
                Text(text)
                    .id(text)
                    .transition(
                        .asymmetric(
                            insertion: .move(edge: .bottom).combined(with: .opacity),
                            removal: .move(edge: .top).combined(with: .opacity)
                        )
                    )
            }
            .clipped()
        }
        .font(.hayame(size: 13, weight: .semibold))
        .foregroundStyle(HayameTheme.brandNavy)
        .padding(.horizontal, 14)
        .padding(.vertical, 9)
        .background(.ultraThinMaterial, in: Capsule())
        .background(HayameTheme.floatingControlBackground, in: Capsule())
        .overlay(Capsule().strokeBorder(HayameTheme.controlStroke, lineWidth: 1))
        .shadow(color: HayameTheme.cardShadow, radius: 12, x: 0, y: 6)
        .animation(HayameMotion.settle, value: text)
        .animation(HayameMotion.fade, value: tone.color)
        .onAppear { startPulse() }
        .onChange(of: isLive) { _, _ in startPulse() }
    }

    private func startPulse() {
        guard isLive, !reduceMotion else { return }
        pulse = false
        withAnimation(.easeOut(duration: 1.4).repeatForever(autoreverses: false)) {
            pulse = true
        }
    }
}

// MARK: - Radar pulse

/// Concentric rings that expand and fade, like a signal searching outward.
struct HayameRadarPulse: View {
    var color: Color = HayameTheme.brandBlue
    var rings = 3
    var duration = 2.6
    var maxScale: CGFloat = 3.4

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var animate = false

    var body: some View {
        ZStack {
            ForEach(0..<rings, id: \.self) { index in
                Circle()
                    .stroke(color.opacity(0.5), lineWidth: 1.5)
                    .background(Circle().fill(color.opacity(0.08)))
                    .scaleEffect(animate ? maxScale : 0.45)
                    .opacity(animate ? 0 : 0.9)
                    .animation(
                        reduceMotion
                            ? nil
                            : .easeOut(duration: duration)
                                .repeatForever(autoreverses: false)
                                .delay(Double(index) * duration / Double(rings)),
                        value: animate
                    )
            }
        }
        .allowsHitTesting(false)
        .onAppear {
            guard !reduceMotion else { return }
            animate = true
        }
    }
}

// MARK: - Progress bar

/// Thin rounded bar whose fill animates to the new fraction.
struct HayameProgressBar: View {
    let fraction: Double
    var tint: Color = HayameTheme.brandBlue
    var track: Color = HayameTheme.subtleFill
    var height: CGFloat = 6

    var body: some View {
        GeometryReader { geometry in
            let clamped = min(max(fraction, 0), 1)
            ZStack(alignment: .leading) {
                Capsule().fill(track)
                Capsule()
                    .fill(tint)
                    .frame(width: max(height, geometry.size.width * clamped))
                    .animation(.easeOut(duration: 0.7), value: clamped)
            }
        }
        .frame(height: height)
    }
}

// MARK: - Timeline stepper

/// The dotted journey line from the reference parcel cards: nodes for each
/// stage, filled as they complete, with a marker that travels along the line.
struct HayameTimelineStepper: View {
    let titles: [String]
    /// How many stages are fully done (0...titles.count).
    let completedCount: Int
    /// 0...1 position of the marker between the current node and the next.
    var progress: Double = 0
    var markerSystemImage = "car.fill"
    var caption: String? = nil
    var accent: Color = HayameTheme.brandBlue
    var showsMarker = true

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private let nodeSize: CGFloat = 18
    private let markerSize: CGFloat = 30
    private let lineHeight: CGFloat = 44

    var body: some View {
        VStack(spacing: 6) {
            GeometryReader { geometry in
                let width = geometry.size.width
                let count = max(titles.count, 2)
                let inset = markerSize / 2
                let spacing = (width - inset * 2) / CGFloat(count - 1)
                let centers = (0..<count).map { inset + CGFloat($0) * spacing }
                // The marker travels from the last completed node toward the
                // one we are waiting on, like the courier between two stops.
                let fromIndex = min(max(completedCount - 1, 0), count - 1)
                let toIndex = min(max(completedCount, 0), count - 1)
                let clampedProgress = completedCount >= count ? 1 : min(max(progress, 0), 1)
                let markerX = centers[fromIndex] + (centers[toIndex] - centers[fromIndex]) * clampedProgress
                let lineY = lineHeight - nodeSize / 2 - 2

                ZStack(alignment: .topLeading) {
                    // Dotted connectors
                    ForEach(0..<(count - 1), id: \.self) { segment in
                        let done = segment < completedCount
                        Path { path in
                            path.move(to: CGPoint(x: centers[segment] + nodeSize / 2, y: lineY))
                            path.addLine(to: CGPoint(x: centers[segment + 1] - nodeSize / 2, y: lineY))
                        }
                        .stroke(
                            done ? accent : HayameTheme.controlStroke,
                            style: StrokeStyle(lineWidth: 2, lineCap: .round, dash: [2, 5])
                        )
                        .animation(HayameMotion.fade, value: done)
                    }

                    // Nodes
                    ForEach(0..<count, id: \.self) { index in
                        let done = index < completedCount
                        let current = index == completedCount
                        ZStack {
                            Circle()
                                .fill(done ? accent : HayameTheme.cardBackground)
                                .overlay(
                                    Circle().stroke(
                                        done || current ? accent : HayameTheme.controlStroke,
                                        lineWidth: current ? 2 : 1.5
                                    )
                                )
                            if done {
                                Image(systemName: "checkmark")
                                    .font(.hayame(size: 9, weight: .black))
                                    .foregroundStyle(.white)
                                    .transition(.scale.combined(with: .opacity))
                            }
                        }
                        .frame(width: nodeSize, height: nodeSize)
                        .scaleEffect(done ? 1 : (current ? 1.05 : 0.9))
                        .position(x: centers[index], y: lineY)
                        .animation(HayameMotion.snappy, value: done)
                    }

                    // Traveling marker with caption
                    if showsMarker && completedCount < count {
                        VStack(spacing: 3) {
                            if let caption, !caption.isEmpty {
                                Text(caption)
                                    .font(.hayame(size: 10, weight: .bold))
                                    .foregroundStyle(HayameTheme.brandNavy)
                                    .lineLimit(1)
                                    .fixedSize()
                            }
                            ZStack {
                                Circle().fill(HayameTheme.cardBackground)
                                Circle().stroke(accent, lineWidth: 2)
                                Image(systemName: markerSystemImage)
                                    .font(.hayame(size: 12, weight: .bold))
                                    .foregroundStyle(accent)
                            }
                            .frame(width: markerSize, height: markerSize)
                            .shadow(color: accent.opacity(0.25), radius: 6, x: 0, y: 3)
                        }
                        .position(x: markerX, y: lineY - (caption == nil ? 0 : 8))
                        .animation(reduceMotion ? nil : HayameMotion.gentle, value: markerX)
                        .transition(.scale.combined(with: .opacity))
                    }
                }
            }
            .frame(height: lineHeight)

            HStack(spacing: 0) {
                ForEach(Array(titles.enumerated()), id: \.offset) { index, title in
                    Text(title)
                        .font(.hayame(size: 10, weight: index <= completedCount ? .bold : .semibold))
                        .foregroundStyle(index <= completedCount ? HayameTheme.brandNavy : HayameTheme.mutedText)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                        .frame(maxWidth: .infinity, alignment: alignment(for: index))
                }
            }
            .padding(.horizontal, 2)
        }
    }

    private func alignment(for index: Int) -> Alignment {
        if index == 0 { return .leading }
        if index == titles.count - 1 { return .trailing }
        return .center
    }
}

// MARK: - Abstract radar scene

/// A soft, map-like backdrop (grid plus a glowing center) used when no real
/// coordinates are available for the waiting scene.
struct HayameRadarScene: View {
    var accent: Color = HayameTheme.brandBlue

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [HayameTheme.brandLight, HayameTheme.pageBackground],
                startPoint: .top,
                endPoint: .bottom
            )

            Canvas { context, size in
                let spacing: CGFloat = 28
                var path = Path()
                var x: CGFloat = 0
                while x <= size.width {
                    path.move(to: CGPoint(x: x, y: 0))
                    path.addLine(to: CGPoint(x: x, y: size.height))
                    x += spacing
                }
                var y: CGFloat = 0
                while y <= size.height {
                    path.move(to: CGPoint(x: 0, y: y))
                    path.addLine(to: CGPoint(x: size.width, y: y))
                    y += spacing
                }
                context.stroke(path, with: .color(accent.opacity(0.08)), lineWidth: 1)
            }

            RadialGradient(
                colors: [accent.opacity(0.18), .clear],
                center: .center,
                startRadius: 0,
                endRadius: 180
            )
        }
    }
}

/// Launch switches used when capturing App Store and Play Store screenshots.
enum HayameScreenshotMode {
    /// `-HAYAME_STORE_SHOTS` hides the floating tab bar so screens show their content only.
    static let hidesTabBar: Bool = {
        #if DEBUG
        return ProcessInfo.processInfo.arguments.contains("-HAYAME_STORE_SHOTS")
        #else
        return false
        #endif
    }()
}

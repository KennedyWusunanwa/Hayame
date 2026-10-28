import SwiftUI

struct SplashScreen: View {
    var darkMode: Bool = false

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var appeared = false
    @State private var animateRings = false
    @State private var animateField = false
    @State private var breathing = false
    @State private var sweep = false
    @State private var revealStart = Date()

    // Deterministic decorative "bokeh" pattern so the layout never jitters
    // between launches. Values are relative to the screen size.
    private let bokeh: [BokehDot] = [
        BokehDot(x: 0.16, y: 0.18, size: 0.32, opacity: 0.07, drift: 22, phase: 0.0),
        BokehDot(x: 0.84, y: 0.12, size: 0.24, opacity: 0.08, drift: 18, phase: 0.6),
        BokehDot(x: 0.90, y: 0.46, size: 0.42, opacity: 0.05, drift: 28, phase: 1.2),
        BokehDot(x: 0.10, y: 0.62, size: 0.36, opacity: 0.06, drift: 24, phase: 1.8),
        BokehDot(x: 0.74, y: 0.82, size: 0.28, opacity: 0.07, drift: 20, phase: 2.4),
        BokehDot(x: 0.30, y: 0.88, size: 0.22, opacity: 0.06, drift: 16, phase: 3.0),
        BokehDot(x: 0.50, y: 0.30, size: 0.18, opacity: 0.06, drift: 14, phase: 3.6)
    ]

    var body: some View {
        GeometryReader { geo in
            let logoWidth = min(max(geo.size.width * 0.62, 230), 300)

            ZStack {
                animatedBackground(size: geo.size)
                bokehLayer(size: geo.size)

                VStack(spacing: 34) {
                    ZStack {
                        logoGlow
                        rippleRings
                        HayameLogoReveal(width: logoWidth, startDate: revealStart, darkMode: darkMode)
                            .scaleEffect(breathing ? 1.02 : 0.995)
                            .shadow(color: logoShadow, radius: 20, x: 0, y: 6)
                    }
                    .frame(height: logoWidth * 0.9)

                    loaderDots
                        .opacity(appeared ? 1 : 0)
                }
                .frame(width: geo.size.width, height: geo.size.height)
            }
            .ignoresSafeArea()
        }
        .ignoresSafeArea()
        .onAppear {
            logSplash("view appeared")
            revealStart = Date()
            // The loader dots join once the wordmark has been drawn.
            withAnimation(.easeOut(duration: 0.5).delay(reduceMotion ? 0.2 : 2.9)) {
                appeared = true
            }
            withAnimation(.easeInOut(duration: 2.8).repeatForever(autoreverses: true).delay(3.0)) {
                breathing = true
            }
            withAnimation(.easeInOut(duration: 8).repeatForever(autoreverses: true)) {
                animateField = true
            }
            withAnimation(.linear(duration: 2.8).repeatForever(autoreverses: false)) {
                sweep = true
            }
            animateRings = true
        }
        .onDisappear {
            logSplash("view disappeared")
        }
    }

    // MARK: - Palette

    private var backgroundColors: [Color] {
        darkMode
            ? [
                Color(red: 0.05, green: 0.16, blue: 0.29),
                Color(red: 0.03, green: 0.10, blue: 0.19),
                Color(red: 0.01, green: 0.05, blue: 0.11)
              ]
            : [
                Color(red: 0.16, green: 0.64, blue: 0.96),
                Color(red: 0.08, green: 0.54, blue: 0.90),
                Color(red: 0.05, green: 0.44, blue: 0.80)
              ]
    }

    private var accent: Color {
        // Brand blue glow used for rings/halo in dark mode; soft white in light.
        darkMode ? Color(red: 0.30, green: 0.70, blue: 1.0) : .white
    }

    // Gentle, blue-tinted depth shadow instead of a harsh black drop shadow.
    private var logoShadow: Color {
        darkMode
            ? Color(red: 0.20, green: 0.58, blue: 1.0).opacity(0.45)
            : Color(red: 0.02, green: 0.20, blue: 0.42).opacity(0.18)
    }

    // MARK: - Background

    private func animatedBackground(size: CGSize) -> some View {
        ZStack {
            LinearGradient(
                colors: backgroundColors,
                startPoint: animateField ? .topLeading : .top,
                endPoint: animateField ? .bottomTrailing : .bottom
            )

            // Soft off-center light so the gradient feels smooth, not flat.
            RadialGradient(
                colors: [Color.white.opacity(darkMode ? 0.05 : 0.14), Color.clear],
                center: UnitPoint(x: 0.5, y: 0.38),
                startRadius: 0,
                endRadius: size.width * (animateField ? 0.95 : 0.78)
            )
        }
    }

    private func bokehLayer(size: CGSize) -> some View {
        ZStack {
            ForEach(bokeh.indices, id: \.self) { index in
                let dot = bokeh[index]
                Circle()
                    .fill(Color.white.opacity(dot.opacity))
                    .frame(width: size.width * dot.size, height: size.width * dot.size)
                    .blur(radius: 14)
                    .position(
                        x: size.width * dot.x,
                        y: size.height * dot.y + (animateField ? -dot.drift : dot.drift)
                    )
                    .scaleEffect(breathing ? 1.06 : 0.94)
                    .animation(
                        .easeInOut(duration: 3.2 + dot.phase)
                            .repeatForever(autoreverses: true)
                            .delay(dot.phase * 0.2),
                        value: breathing
                    )
            }
        }
    }

    // MARK: - Center decorations

    // Gentle, large, diffuse glow that adds depth behind the logo without a hard
    // bright disc (which previously washed the white logo out).
    private var logoGlow: some View {
        Circle()
            .fill(
                RadialGradient(
                    colors: [
                        accent.opacity(darkMode ? 0.26 : 0.16),
                        accent.opacity(0.0)
                    ],
                    center: .center,
                    startRadius: 6,
                    endRadius: 170
                )
            )
            .frame(width: 360, height: 360)
            .blur(radius: 12)
            .scaleEffect(breathing ? 1.06 : 0.96)
    }

    // Subtle rings — present for a touch of depth, but quiet rather than busy.
    private var rippleRings: some View {
        ZStack {
            ForEach(0..<2, id: \.self) { i in
                Circle()
                    .stroke(accent.opacity(darkMode ? 0.26 : 0.20), lineWidth: 1.2)
                    .frame(width: 168, height: 168)
                    .scaleEffect(animateRings ? 2.3 : 0.8)
                    .opacity(animateRings ? 0 : (darkMode ? 0.34 : 0.26))
                    .animation(
                        .easeOut(duration: 3.4)
                            .repeatForever(autoreverses: false)
                            .delay(Double(i) * 1.5),
                        value: animateRings
                    )
            }
        }
    }

    private var loaderDots: some View {
        HStack(spacing: 10) {
            ForEach(0..<3, id: \.self) { i in
                Circle()
                    .fill(Color.white)
                    .frame(width: 7, height: 7)
                    .opacity(sweep ? 0.95 : 0.32)
                    .scaleEffect(sweep ? 1 : 0.82)
                    .animation(
                        .easeInOut(duration: 0.7)
                            .repeatForever(autoreverses: true)
                            .delay(Double(i) * 0.2),
                        value: sweep
                    )
            }
        }
    }

    private func logSplash(_ message: String) {
        #if DEBUG
        print("[HayameSplash] \(message)")
        #endif
    }
}

private struct BokehDot {
    let x: CGFloat
    let y: CGFloat
    let size: CGFloat
    let opacity: Double
    let drift: CGFloat
    let phase: Double
}

// MARK: - Wordmark centerline

/// The single-stroke centerline of the HAYAME wordmark, authored in the logo
/// PNG's own 1808x944 pixel space so it lines up exactly under the bitmap.
/// Subpaths are ordered the way a pen would write the word, so trimming the
/// path from 0 to 1 "draws" it left to right.
struct HayameWordmarkShape: Shape {
    static let designSize = CGSize(width: 1808, height: 944)
    /// Everything above this design-space y is the car silhouette.
    static let carSplitY: CGFloat = 344
    /// Stroke thickness of the bitmap letterforms, in design pixels.
    static let strokeWidth: CGFloat = 47

    func path(in rect: CGRect) -> Path {
        let scale = rect.width / Self.designSize.width
        let transform = CGAffineTransform(translationX: rect.minX, y: rect.minY)
            .scaledBy(x: scale, y: scale)
        return Self.designPath.applying(transform)
    }

    static let designPath: Path = {
        var p = Path()
        let top: CGFloat = 374
        let bottom: CGFloat = 675
        let bar: CGFloat = 522

        // In SwiftUI's y-down space, increasing angles run visually clockwise.
        // `visuallyClockwise` keeps the authoring readable.
        func arc(_ center: CGPoint, _ radius: CGFloat, from: Double, to: Double, visuallyClockwise: Bool) {
            p.addArc(
                center: center,
                radius: radius,
                startAngle: .degrees(from),
                endAngle: .degrees(to),
                clockwise: !visuallyClockwise
            )
        }

        // H
        p.move(to: CGPoint(x: 64.5, y: top)); p.addLine(to: CGPoint(x: 64.5, y: bottom))
        p.move(to: CGPoint(x: 64.5, y: bar)); p.addLine(to: CGPoint(x: 269, y: bar))
        p.move(to: CGPoint(x: 269, y: top)); p.addLine(to: CGPoint(x: 269, y: bottom))

        // A, Y and the second A share one continuous stroke.
        p.move(to: CGPoint(x: 341, y: bottom)); p.addLine(to: CGPoint(x: 341, y: 477))
        arc(CGPoint(x: 449, y: 477), 108, from: 180, to: 360, visuallyClockwise: true)      // first arch
        p.addLine(to: CGPoint(x: 557, y: 565))
        arc(CGPoint(x: 663.5, y: 565), 106.5, from: 180, to: 0, visuallyClockwise: false)   // Y bowl
        p.addLine(to: CGPoint(x: 770, y: 475.5))
        arc(CGPoint(x: 877.5, y: 475.5), 107.5, from: 180, to: 360, visuallyClockwise: true) // second arch
        p.addLine(to: CGPoint(x: 985, y: bottom))

        // Y descender
        p.move(to: CGPoint(x: 770, y: 565)); p.addLine(to: CGPoint(x: 770, y: 883))

        // A crossbars
        p.move(to: CGPoint(x: 341, y: bar)); p.addLine(to: CGPoint(x: 557, y: bar))
        p.move(to: CGPoint(x: 770, y: bar)); p.addLine(to: CGPoint(x: 985, y: bar))

        // M: two flat-topped arches
        let mR: CGFloat = 72
        p.move(to: CGPoint(x: 1058, y: bottom)); p.addLine(to: CGPoint(x: 1058, y: 368 + mR))
        arc(CGPoint(x: 1058 + mR, y: 368 + mR), mR, from: 180, to: 270, visuallyClockwise: true)
        p.addLine(to: CGPoint(x: 1231.5 - mR, y: 368))
        arc(CGPoint(x: 1231.5 - mR, y: 368 + mR), mR, from: 270, to: 360, visuallyClockwise: true)
        p.addLine(to: CGPoint(x: 1231.5, y: 657))
        p.move(to: CGPoint(x: 1231.5, y: 368 + mR))
        arc(CGPoint(x: 1231.5 + mR, y: 368 + mR), mR, from: 180, to: 270, visuallyClockwise: true)
        p.addLine(to: CGPoint(x: 1404.5 - mR, y: 368))
        arc(CGPoint(x: 1404.5 - mR, y: 368 + mR), mR, from: 270, to: 360, visuallyClockwise: true)
        p.addLine(to: CGPoint(x: 1404.5, y: bottom))

        // E
        let eR: CGFloat = 80
        p.move(to: CGPoint(x: 1741, y: 366.5)); p.addLine(to: CGPoint(x: 1472.5 + eR, y: 366.5))
        arc(CGPoint(x: 1472.5 + eR, y: 366.5 + eR), eR, from: 270, to: 180, visuallyClockwise: false)
        p.addLine(to: CGPoint(x: 1472.5, y: 673 - eR))
        arc(CGPoint(x: 1472.5 + eR, y: 673 - eR), eR, from: 180, to: 90, visuallyClockwise: false)
        p.addLine(to: CGPoint(x: 1741, y: 673))
        p.move(to: CGPoint(x: 1472.5, y: bar)); p.addLine(to: CGPoint(x: 1724, y: bar))

        return p
    }()
}

// MARK: - Logo reveal

/// Draws the wordmark with a glowing pen stroke, flashes it solid, then slides
/// the car silhouette in over the top. Time-driven, so every launch plays the
/// same choreography. Reduce Motion shows the finished logo immediately.
struct HayameLogoReveal: View {
    let width: CGFloat
    let startDate: Date
    var darkMode: Bool = false

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    // Choreography, in seconds from `startDate`.
    private let traceStart = 0.35
    private let traceDuration = 1.85
    private let fillStart = 2.15
    private let fillDuration = 0.35
    private let carStart = 2.3
    private let carDuration = 0.8

    /// Total time until the logo is fully assembled and at rest.
    static let settleTime = 3.2

    private var height: CGFloat { width * HayameWordmarkShape.designSize.height / HayameWordmarkShape.designSize.width }
    private var scale: CGFloat { width / HayameWordmarkShape.designSize.width }
    private var carSplit: CGFloat { HayameWordmarkShape.carSplitY * scale }

    var body: some View {
        Group {
            if reduceMotion {
                logoImage
            } else {
                TimelineView(.animation(minimumInterval: 1.0 / 60.0)) { context in
                    animatedLogo(at: context.date.timeIntervalSince(startDate))
                }
            }
        }
        .frame(width: width, height: height)
    }

    private var logoImage: some View {
        Image("Logo")
            .renderingMode(.template)
            .resizable()
            .scaledToFit()
            .foregroundStyle(.white)
            .frame(width: width, height: height)
    }

    @ViewBuilder
    private func animatedLogo(at time: TimeInterval) -> some View {
        let trace = easeInOutCubic(clamp01((time - traceStart) / traceDuration))
        let fill = easeOutCubic(clamp01((time - fillStart) / fillDuration))
        let car = clamp01((time - carStart) / carDuration)
        let carEase = easeOutBack(car)
        let flash = max(0, 1 - abs((time - (fillStart + 0.1)) / 0.28))
        let strokeWidth = HayameWordmarkShape.strokeWidth * scale
        let glowColor = darkMode ? Color(red: 0.45, green: 0.78, blue: 1.0) : Color.white

        ZStack {
            // Glow trail behind the pen.
            HayameWordmarkShape()
                .trim(from: 0, to: trace)
                .stroke(glowColor.opacity(0.75), style: StrokeStyle(lineWidth: strokeWidth * 2.2, lineCap: .round, lineJoin: .round))
                .blur(radius: 9)
                .opacity(1 - fill)

            // The pen stroke itself.
            HayameWordmarkShape()
                .trim(from: 0, to: trace)
                .stroke(.white, style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round, lineJoin: .round))
                .opacity(1 - fill * 0.85)

            // Finished wordmark (bitmap, lower part of the logo).
            logoImage
                .mask(alignment: .bottom) {
                    Rectangle().padding(.top, carSplit)
                }
                .opacity(fill)

            // Flash as the stroke becomes solid.
            logoImage
                .mask(alignment: .bottom) {
                    Rectangle().padding(.top, carSplit)
                }
                .blur(radius: 8)
                .opacity(flash * 0.9)

            // Car silhouette slides in from the left with a light streak.
            ZStack {
                ForEach(0..<3, id: \.self) { index in
                    Capsule()
                        .fill(Color.white.opacity(0.55))
                        .frame(width: width * (0.34 - CGFloat(index) * 0.08), height: 2.5)
                        .blur(radius: 1.2)
                        .offset(
                            x: -width * 0.22 - CGFloat(index) * 10,
                            y: carSplit * (0.42 + CGFloat(index) * 0.18)
                        )
                }
            }
            .frame(width: width, height: height, alignment: .topLeading)
            .opacity(car > 0 && car < 1 ? sin(car * .pi) * 0.9 : 0)
            .offset(x: -width * 0.5 * (1 - carEase))

            logoImage
                .mask(alignment: .top) {
                    Rectangle().padding(.bottom, height - carSplit)
                }
                .offset(x: -width * 0.55 * (1 - carEase))
                .opacity(clamp01(car * 2.2))

            // Pen head.
            if trace > 0 && trace < 1 {
                let point = HayameWordmarkShape.designPath.trimmedPath(from: 0, to: trace).currentPoint ?? .zero
                ZStack {
                    Circle()
                        .fill(glowColor.opacity(0.7))
                        .frame(width: strokeWidth * 3.2, height: strokeWidth * 3.2)
                        .blur(radius: 6)
                    Circle()
                        .fill(.white)
                        .frame(width: strokeWidth * 1.5, height: strokeWidth * 1.5)
                        .shadow(color: .white.opacity(0.9), radius: 6)
                }
                .position(x: point.x * scale, y: point.y * scale)
            }
        }
        .frame(width: width, height: height)
    }

    private func clamp01(_ value: Double) -> Double { min(max(value, 0), 1) }

    private func easeInOutCubic(_ x: Double) -> Double {
        x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2
    }

    private func easeOutCubic(_ x: Double) -> Double {
        1 - pow(1 - x, 3)
    }

    private func easeOutBack(_ x: Double) -> Double {
        let c1 = 1.25
        let c3 = c1 + 1
        return 1 + c3 * pow(x - 1, 3) + c1 * pow(x - 1, 2)
    }
}

/// Zoom-through exit used when the splash hands off to the app, echoing the
/// logo flying toward the viewer. Drive `progress` from 0 to 1 with an
/// animation; the app flips `showSplash` off once it reaches 1.
struct SplashZoomOutModifier: ViewModifier {
    let progress: Double

    func body(content: Content) -> some View {
        content
            .scaleEffect(1 + progress * 6)
            .opacity(1 - progress)
            .allowsHitTesting(progress == 0)
    }
}

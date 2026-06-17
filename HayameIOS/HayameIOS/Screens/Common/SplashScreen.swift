import SwiftUI

struct SplashScreen: View {
    var darkMode: Bool = false

    @State private var appeared = false
    @State private var animateRings = false
    @State private var animateField = false
    @State private var breathing = false
    @State private var sweep = false

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
            let logoWidth = min(max(geo.size.width * 0.53, 205), 260)

            ZStack {
                animatedBackground(size: geo.size)
                bokehLayer(size: geo.size)

                VStack(spacing: 30) {
                    ZStack {
                        logoGlow
                        rippleRings
                        Image("hayame_launch_logo")
                            .resizable()
                            .scaledToFit()
                            .frame(width: logoWidth)
                            .scaleEffect((appeared ? 1 : 0.6) * (breathing ? 1.025 : 0.99))
                            .opacity(appeared ? 1 : 0)
                            .shadow(color: logoShadow, radius: 20, x: 0, y: 6)
                    }
                    .frame(height: logoWidth * 1.2)

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
            withAnimation(.spring(response: 0.78, dampingFraction: 0.66)) {
                appeared = true
            }
            withAnimation(.easeInOut(duration: 2.8).repeatForever(autoreverses: true)) {
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
        .opacity(appeared ? 1 : 0)
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

import SwiftUI

/// Full-screen branded interstitial shown while the app swaps between the
/// renter and host shells. The icon pops in on a radar pulse with a sparkle
/// burst, the copy slides up, and the whole card fades away once the new shell
/// is underneath. Honors Reduce Motion by keeping only the fade.
struct HayameModeSwitchOverlay: View {
    let targetsHost: Bool

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.colorScheme) private var colorScheme
    @State private var iconScale = 0.4
    @State private var iconRotation = -14.0
    @State private var textOffset: CGFloat = 18
    @State private var textOpacity = 0.0
    @State private var sweep: CGFloat = -1

    private var isDark: Bool { colorScheme == .dark }

    /// Same deep navy field as the splash screen in dark mode; bright brand blue
    /// (host) or pale sky (renter) in light mode.
    private var gradient: [Color] {
        if isDark {
            return targetsHost
                ? [Color(red: 0.06, green: 0.23, blue: 0.40), Color(red: 0.03, green: 0.10, blue: 0.19), Color(red: 0.01, green: 0.05, blue: 0.11)]
                : [Color(red: 0.05, green: 0.16, blue: 0.29), Color(red: 0.03, green: 0.10, blue: 0.19), Color(red: 0.01, green: 0.05, blue: 0.11)]
        }
        return targetsHost
            ? [HayameTheme.brandBlue, HayameTheme.primaryButtonEnd]
            : [Color(red: 0.93, green: 0.97, blue: 1.00), Color(red: 0.78, green: 0.90, blue: 1.00)]
    }

    private var foreground: Color { isDark || targetsHost ? .white : HayameTheme.brandNavy }
    private var accent: Color {
        if isDark { return Color(red: 0.30, green: 0.70, blue: 1.0) }
        return targetsHost ? .white : HayameTheme.brandBlue
    }
    private var sweepOpacity: Double { isDark ? 0.12 : (targetsHost ? 0.22 : 0.35) }
    private var title: String { targetsHost ? "Host mode on" : "Back to renting" }
    private var subtitle: String { targetsHost ? "Opening your dashboard…" : "Browse and book cars" }
    private var systemImage: String { targetsHost ? "key.fill" : "car.fill" }

    var body: some View {
        ZStack {
            LinearGradient(colors: gradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()

            // A soft light band that sweeps across once, like a shutter opening.
            GeometryReader { geometry in
                LinearGradient(
                    colors: [.clear, accent.opacity(sweepOpacity), .clear],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .frame(width: geometry.size.width * 0.6)
                .rotationEffect(.degrees(18))
                .offset(x: sweep * geometry.size.width * 1.2)
                .ignoresSafeArea()
            }
            .allowsHitTesting(false)

            VStack(spacing: 22) {
                ZStack {
                    if !reduceMotion {
                        HayameRadarPulse(color: accent, rings: 2, duration: 1.8, maxScale: 2.6)
                            .frame(width: 120, height: 120)
                        HayameSparkleBurst(colors: [accent, accent.opacity(0.7), HayameTheme.warning], count: 10, radius: 92, delay: 0.18)
                    }
                    Circle()
                        .fill(accent.opacity(targetsHost ? 0.18 : 0.14))
                        .frame(width: 124, height: 124)
                    Circle()
                        .strokeBorder(accent.opacity(0.35), lineWidth: 1.5)
                        .frame(width: 124, height: 124)
                    Image(systemName: systemImage)
                        .font(.hayame(size: 50, weight: .bold))
                        .foregroundStyle(foreground)
                        .scaleEffect(iconScale)
                        .rotationEffect(.degrees(iconRotation))
                }

                VStack(spacing: 6) {
                    Text(title)
                        .font(.hayame(size: 26, weight: .bold))
                        .foregroundStyle(foreground)
                    Text(subtitle)
                        .font(.hayame(size: 14, weight: .semibold))
                        .foregroundStyle(foreground.opacity(0.78))
                }
                .offset(y: textOffset)
                .opacity(textOpacity)
            }
        }
        .onAppear(perform: run)
    }

    private func run() {
        if reduceMotion {
            iconScale = 1
            iconRotation = 0
            textOffset = 0
            textOpacity = 1
            return
        }
        withAnimation(HayameMotion.bouncy.delay(0.05)) {
            iconScale = 1
            iconRotation = 0
        }
        withAnimation(HayameMotion.gentle.delay(0.22)) {
            textOffset = 0
            textOpacity = 1
        }
        withAnimation(.easeInOut(duration: 0.9).delay(0.1)) {
            sweep = 1
        }
    }
}

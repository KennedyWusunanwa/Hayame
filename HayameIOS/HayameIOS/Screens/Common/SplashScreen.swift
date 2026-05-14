import SwiftUI

struct SplashScreen: View {
    @Environment(\.colorScheme) private var colorScheme

    @State private var progress: CGFloat = 0
    @State private var logoScale: CGFloat = 1
    @State private var logoFloat: CGFloat = 5
    @State private var shimmerShift: CGFloat = -30

    // Panel entrance
    @State private var topPanelOffset: CGFloat = -500
    @State private var bottomPanelOffset: CGFloat = 500

    // Content entrances
    @State private var logoOpacity: Double = 0
    @State private var logoEntryScale: CGFloat = 0.82
    @State private var taglineOpacity: Double = 0
    @State private var taglineOffset: CGFloat = 12
    @State private var badgeOpacity: Double = 0
    @State private var barOpacity: Double = 0

    // Speed streaks - each streak has its own x-offset animation
    @State private var streak1X: CGFloat = -400
    @State private var streak2X: CGFloat = -400
    @State private var streak3X: CGFloat = -400

    // Pulse ring
    @State private var pulseScale: CGFloat = 0.85
    @State private var pulseOpacity: Double = 0

    // New text entrances
    @State private var badgeScale: CGFloat = 0.88
    @State private var sublineOpacity: Double = 0

    private var isDarkMode: Bool {
        colorScheme == .dark
    }

    var body: some View {
        GeometryReader { geo in
            ZStack {
                splashBackground
                    .ignoresSafeArea()

                VStack(spacing: 0) {

                    // -- TOP - Blue panel
                    ZStack {
                        isDarkMode ? Color.clear : HayameTheme.brandBlue

                        Group {
                            Capsule()
                                .fill(Color.white.opacity(isDarkMode ? 0.14 : 0.18))
                                .frame(width: 90, height: 2.5)
                                .offset(x: streak1X, y: 20)

                            Capsule()
                                .fill(Color.white.opacity(isDarkMode ? 0.10 : 0.12))
                                .frame(width: 60, height: 1.5)
                                .offset(x: streak2X, y: 36)

                            Capsule()
                                .fill(Color.white.opacity(isDarkMode ? 0.08 : 0.10))
                                .frame(width: 44, height: 1.5)
                                .offset(x: streak3X, y: 8)
                        }
                        .clipped()

                        Circle()
                            .stroke(Color.white.opacity(pulseOpacity), lineWidth: 2)
                            .frame(width: geo.size.width * 0.66, height: geo.size.width * 0.66)
                            .scaleEffect(pulseScale)

                        Circle()
                            .fill(Color.white.opacity(isDarkMode ? 0.10 : 0.08))
                            .background(
                                Circle()
                                    .fill(Color.white.opacity(isDarkMode ? 0.05 : 0))
                                    .blur(radius: isDarkMode ? 18 : 0)
                            )
                            .overlay(
                                Circle()
                                    .stroke(Color.white.opacity(isDarkMode ? 0.18 : 0), lineWidth: 1)
                            )
                            .shadow(
                                color: isDarkMode ? Color(red: 0.30, green: 0.70, blue: 1.0).opacity(0.26) : .clear,
                                radius: isDarkMode ? 34 : 0,
                                x: 0,
                                y: isDarkMode ? 18 : 0
                            )
                            .frame(width: geo.size.width * 0.68, height: geo.size.width * 0.68)

                        VStack(spacing: 0) {
                            Image("hayame_logo_white")
                                .resizable()
                                .scaledToFit()
                                .frame(width: 210)
                                .scaleEffect(logoEntryScale * logoScale)
                                .offset(y: logoFloat)
                                .opacity(logoOpacity)

                            Text("Ghana's No.1 Car Rental Platform")
                                .font(.system(size: 11, weight: .semibold, design: .rounded))
                                .foregroundStyle(isDarkMode ? Color(red: 0.91, green: 0.97, blue: 1.0) : HayameTheme.brandBlue)
                                .padding(.horizontal, 15)
                                .padding(.vertical, 7)
                                .background(isDarkMode ? Color.white.opacity(0.14) : Color.white)
                                .clipShape(Capsule())
                                .overlay(
                                    Capsule()
                                        .stroke(Color.white.opacity(isDarkMode ? 0.18 : 0), lineWidth: 1)
                                )
                                .opacity(badgeOpacity)
                                .scaleEffect(badgeScale)
                                .padding(.top, isDarkMode ? 18 : 14)
                        }
                    }
                    .frame(height: geo.size.height * 0.55)
                    .offset(y: topPanelOffset)
                    .clipped()

                    // -- BOTTOM - White panel
                    ZStack {
                        isDarkMode ? Color.clear : HayameTheme.pageBackground

                        VStack(spacing: isDarkMode ? 16 : 18) {
                            Text("Rent a car, anytime,\nanywhere in Ghana.")
                                .font(.system(size: isDarkMode ? 17 : 16, weight: .semibold, design: .rounded))
                                .foregroundStyle(isDarkMode ? Color(red: 0.92, green: 0.97, blue: 1.0) : HayameTheme.brandNavy)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 48)
                                .opacity(taglineOpacity)
                                .offset(y: taglineOffset)

                            Text("Trusted by renters across Ghana")
                                .font(.system(size: 12, weight: .medium, design: .rounded))
                                .foregroundStyle(isDarkMode ? Color(red: 0.68, green: 0.78, blue: 0.90) : HayameTheme.mutedText)
                                .opacity(sublineOpacity)
                                .padding(.top, isDarkMode ? 2 : 0)

                            ZStack(alignment: .leading) {
                                Capsule()
                                    .fill(isDarkMode ? Color.white.opacity(0.16) : HayameTheme.brandLight)
                                    .frame(width: isDarkMode ? 192 : 180, height: isDarkMode ? 5 : 4)
                                Capsule()
                                    .fill(isDarkMode ? Color(red: 0.30, green: 0.70, blue: 1.0) : HayameTheme.brandBlue)
                                    .frame(width: (isDarkMode ? 192 : 180) * progress, height: isDarkMode ? 5 : 4)
                                Capsule()
                                    .fill(
                                        LinearGradient(
                                            colors: [.clear, .white.opacity(isDarkMode ? 0.55 : 0.75), .clear],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                    .frame(width: 60, height: isDarkMode ? 5 : 4)
                                    .offset(x: shimmerShift - 30)
                                    .clipped()
                                    .frame(width: isDarkMode ? 192 : 180, alignment: .leading)
                            }
                            .opacity(barOpacity)
                            .padding(.top, isDarkMode ? 12 : 0)
                        }
                        .padding(.bottom, isDarkMode ? 22 : 0)
                    }
                    .frame(height: geo.size.height * 0.45)
                    .offset(y: bottomPanelOffset)
                    .clipped()
                }
            }
        }
        .ignoresSafeArea()
        .onAppear {
            // Stage 1 - panels slide in (T+0ms)
            withAnimation(.spring(response: 0.55, dampingFraction: 0.78)) {
                topPanelOffset = 0
                bottomPanelOffset = 0
            }

            // Stage 2 - logo fades + scales in (T+300ms)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.30) {
                withAnimation(.spring(response: 0.5, dampingFraction: 0.72)) {
                    logoOpacity = 1
                    logoEntryScale = 1.0
                }
            }

            // Stage 3 - tagline slides up (T+500ms)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.50) {
                withAnimation(.easeOut(duration: 0.4)) {
                    taglineOpacity = 1
                    taglineOffset = 0
                }
            }

            // Speed streaks - T+380ms, loop forever
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.38) {
                func animateStreak(delay: Double, stateUpdate: @escaping (CGFloat) -> Void, reset: @escaping () -> Void) {
                    DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                        withAnimation(.linear(duration: 1.1)) {
                            stateUpdate(500)
                        }
                        DispatchQueue.main.asyncAfter(deadline: .now() + delay + 1.15) {
                            reset()
                            animateStreak(delay: 0, stateUpdate: stateUpdate, reset: reset)
                        }
                    }
                }
                animateStreak(delay: 0.0, stateUpdate: { streak1X = $0 }, reset: { streak1X = -400 })
                animateStreak(delay: 0.28, stateUpdate: { streak2X = $0 }, reset: { streak2X = -400 })
                animateStreak(delay: 0.55, stateUpdate: { streak3X = $0 }, reset: { streak3X = -400 })
            }

            // Pulse ring - T+420ms, repeat forever
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.42) {
                withAnimation(.easeInOut(duration: 1.6).repeatForever(autoreverses: true)) {
                    pulseScale = 1.08
                    pulseOpacity = 0.18
                }
            }

            // "Trusted by renters" subline - T+620ms
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.62) {
                withAnimation(.easeOut(duration: 0.35)) {
                    sublineOpacity = 1
                }
            }

            // Badge pill - T+700ms
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.70) {
                withAnimation(.spring(response: 0.42, dampingFraction: 0.72)) {
                    badgeOpacity = 1
                    badgeScale = 1.0
                }
            }

            // Stage 4 - progress bar fades in (T+750ms)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.75) {
                withAnimation(.easeOut(duration: 0.3)) {
                    barOpacity = 1
                }
            }

            withAnimation(.spring(response: 0.9, dampingFraction: 0.72)) {
                logoScale = 1
            }
            withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                logoFloat = -5
            }
            withAnimation(.linear(duration: 1.0).repeatForever(autoreverses: false)) {
                shimmerShift = 230
            }
            withAnimation(.easeInOut(duration: 4.65)) {
                progress = 1
            }
        }
    }

    @ViewBuilder
    private var splashBackground: some View {
        if isDarkMode {
            LinearGradient(
                colors: [
                    Color(red: 0.078, green: 0.518, blue: 0.851),
                    Color(red: 0.045, green: 0.286, blue: 0.490),
                    Color(red: 0.027, green: 0.102, blue: 0.184)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
        } else {
            HayameTheme.pageBackground
        }
    }
}

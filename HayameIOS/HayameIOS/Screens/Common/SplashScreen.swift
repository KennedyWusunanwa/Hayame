import SwiftUI

struct SplashScreen: View {
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

    var body: some View {
        GeometryReader { geo in
            ZStack {
                Color.white.ignoresSafeArea()

                VStack(spacing: 0) {

                    // -- TOP - Blue panel
                    ZStack {
                        Color(red: 0.078, green: 0.518, blue: 0.851)

                        Group {
                            Capsule()
                                .fill(Color.white.opacity(0.18))
                                .frame(width: 90, height: 2.5)
                                .offset(x: streak1X, y: 20)

                            Capsule()
                                .fill(Color.white.opacity(0.12))
                                .frame(width: 60, height: 1.5)
                                .offset(x: streak2X, y: 36)

                            Capsule()
                                .fill(Color.white.opacity(0.10))
                                .frame(width: 44, height: 1.5)
                                .offset(x: streak3X, y: 8)
                        }
                        .clipped()

                        Circle()
                            .stroke(Color.white.opacity(pulseOpacity), lineWidth: 2)
                            .frame(width: geo.size.width * 0.68, height: geo.size.width * 0.68)
                            .scaleEffect(pulseScale)

                        Circle()
                            .fill(Color.white.opacity(0.08))
                            .frame(width: geo.size.width * 0.70, height: geo.size.width * 0.70)

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
                                .foregroundStyle(Color(red: 0.078, green: 0.518, blue: 0.851))
                                .padding(.horizontal, 14)
                                .padding(.vertical, 6)
                                .background(Color.white)
                                .clipShape(Capsule())
                                .opacity(badgeOpacity)
                                .scaleEffect(badgeScale)
                                .padding(.top, 14)
                        }
                    }
                    .frame(height: geo.size.height * 0.55)
                    .offset(y: topPanelOffset)
                    .clipped()

                    // -- BOTTOM - White panel
                    ZStack {
                        Color.white

                        VStack(spacing: 18) {
                            Text("Rent a car, anytime,\nanywhere in Ghana.")
                                .font(.system(size: 16, weight: .medium, design: .rounded))
                                .foregroundStyle(Color(red: 0.039, green: 0.169, blue: 0.329))
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 48)
                                .opacity(taglineOpacity)
                                .offset(y: taglineOffset)

                            Text("Trusted by renters across Ghana")
                                .font(.system(size: 12, weight: .medium, design: .rounded))
                                .foregroundStyle(Color(red: 0.451, green: 0.490, blue: 0.569))
                                .opacity(sublineOpacity)

                            ZStack(alignment: .leading) {
                                Capsule()
                                    .fill(Color(red: 0.929, green: 0.969, blue: 1.0))
                                    .frame(width: 180, height: 4)
                                Capsule()
                                    .fill(Color(red: 0.078, green: 0.518, blue: 0.851))
                                    .frame(width: 180 * progress, height: 4)
                                Capsule()
                                    .fill(
                                        LinearGradient(
                                            colors: [.clear, .white.opacity(0.75), .clear],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                    .frame(width: 60, height: 4)
                                    .offset(x: shimmerShift - 30)
                                    .clipped()
                                    .frame(width: 180, alignment: .leading)
                            }
                            .opacity(barOpacity)
                        }
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
}

import SwiftUI

struct SplashScreen: View {
    @State private var progress: CGFloat = 0
    @State private var logoScale: CGFloat = 0.82
    @State private var logoFloat = false
    @State private var shimmerShift = false

    private let barWidth: CGFloat = 248

    var body: some View {
        ZStack {
            // Layered gradients and soft blobs to avoid a flat splash background.
            LinearGradient(
                colors: [
                    HayameTheme.pageBackground,
                    Color.white,
                    HayameTheme.brandLight.opacity(0.45)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            Circle()
                .fill(HayameTheme.brandBlue.opacity(0.12))
                .frame(width: 220, height: 220)
                .blur(radius: 18)
                .offset(x: -120, y: -250)

            Circle()
                .fill(HayameTheme.brandNavy.opacity(0.08))
                .frame(width: 260, height: 260)
                .blur(radius: 24)
                .offset(x: 130, y: 250)

            VStack(spacing: 18) {
                Spacer()

                Image("Logo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 214)
                    .shadow(color: HayameTheme.brandBlue.opacity(0.22), radius: 10, x: 0, y: 5)
                .scaleEffect(logoScale)
                .offset(y: logoFloat ? -5 : 5)

                Text("Rent a car, anytime, anywhere in Ghana.")
                    .font(.system(size: 15, weight: .medium, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)
                    .opacity(0.92)

                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(HayameTheme.brandLight)
                        .frame(height: 4)
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [HayameTheme.brandBlue, HayameTheme.brandNavy],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: max(0, progress) * barWidth, height: 4)

                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [.white.opacity(0), .white.opacity(0.85), .white.opacity(0)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: 76, height: 4)
                        .offset(x: shimmerShift ? barWidth - 38 : -38)
                        .mask(
                            Capsule()
                                .frame(width: max(0, progress) * barWidth, height: 4)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        )
                }
                .frame(width: barWidth, height: 4)
                .padding(.top, 6)

                Spacer()
            }
            .padding(.horizontal, 24)
        }
        .onAppear {
            withAnimation(.spring(response: 0.9, dampingFraction: 0.72)) {
                logoScale = 1
            }
            withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                logoFloat = true
            }
            withAnimation(.linear(duration: 1.0).repeatForever(autoreverses: false)) {
                shimmerShift = true
            }
            withAnimation(.easeInOut(duration: 1.45)) {
                progress = 1
            }
        }
    }
}

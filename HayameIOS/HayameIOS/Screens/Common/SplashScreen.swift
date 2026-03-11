import SwiftUI

struct SplashScreen: View {
    @State private var progress: CGFloat = 0

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [HayameTheme.pageBackground, Color.white],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 18) {
                Spacer()

                Image("Logo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 110, height: 110)

                Text("Rent a car, anytime, anywhere in Ghana.")
                    .font(.system(size: 15, weight: .medium, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)

                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(HayameTheme.brandLight)
                        .frame(height: 10)
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [HayameTheme.brandBlue, HayameTheme.brandNavy],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: max(0, progress) * 220, height: 10)
                }
                .frame(width: 220, height: 10)
                .padding(.top, 6)

                Spacer()
            }
            .padding(.horizontal, 24)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.3)) {
                progress = 1
            }
        }
    }
}

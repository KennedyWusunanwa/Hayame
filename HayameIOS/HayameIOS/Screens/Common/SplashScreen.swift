import SwiftUI

struct SplashScreen: View {
    var body: some View {
        GeometryReader { geo in
            ZStack {
                splashBackground
                    .ignoresSafeArea()

                VStack(spacing: 0) {
                    Spacer(minLength: geo.size.height * 0.36)

                    Image("hayame_launch_logo")
                        .resizable()
                        .scaledToFit()
                        .frame(width: min(max(geo.size.width * 0.53, 205), 260))

                    Spacer()
                }
                .frame(width: geo.size.width, height: geo.size.height)
            }
        }
        .ignoresSafeArea()
        .onAppear {
            logSplash("view appeared")
        }
        .onDisappear {
            logSplash("view disappeared")
        }
    }

    private func logSplash(_ message: String) {
        #if DEBUG
        print("[HayameSplash] \(message)")
        #endif
    }

    private var splashBackground: some View {
        Color(red: 0.06, green: 0.52, blue: 0.89)
    }
}

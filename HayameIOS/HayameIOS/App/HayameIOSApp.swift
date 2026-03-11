import SwiftUI

@main
struct HayameIOSApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var appState = AppState()
    @State private var showSplash = true

    var body: some Scene {
        WindowGroup {
            ZStack {
                RootView()
                    .environmentObject(appState)
                    .opacity(showSplash ? 0 : 1)

                if showSplash {
                    SplashScreen()
                        .transition(.opacity)
                }
            }
            .task {
                try? await Task.sleep(nanoseconds: 1_800_000_000)
                withAnimation(.easeOut(duration: 0.25)) {
                    showSplash = false
                }
            }
        }
    }
}

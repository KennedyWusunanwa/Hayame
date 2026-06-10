import SwiftUI
import UIKit

@main
struct HayameIOSApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var appState = AppState()
    @State private var showSplash = true
    @State private var showAppearanceTransition = false
    @State private var appearanceTransitionTargetsDarkMode = false
    @State private var hasHandledInitialAppearance = false
    @State private var appearanceTransitionTask: Task<Void, Never>?
    @State private var hasConfiguredNotifications = false

    var body: some Scene {
        WindowGroup {
            ZStack {
                RootView()
                    .environmentObject(appState)
                    .opacity(showSplash ? 0 : 1)
                    .animation(.easeOut(duration: 0.45), value: showSplash)

                if showSplash {
                    SplashScreen()
                        .transition(.opacity)
                        .zIndex(10)
                }

                if showAppearanceTransition {
                    AppearanceTransitionOverlay(targetsDarkMode: appearanceTransitionTargetsDarkMode)
                        .transition(.opacity)
                        .zIndex(20)
                }

            }
            .preferredColorScheme(appState.darkModeEnabled ? .dark : .light)
            .onAppear {
                logSplash("root appeared")
                applyWindowStyle(appState.darkModeEnabled)
            }
            .task {
                guard showSplash else { return }
                logSplash("root timer started")
                try? await Task.sleep(nanoseconds: 5_000_000_000)
                guard !Task.isCancelled else {
                    logSplash("root timer cancelled")
                    return
                }
                logSplash("root timer finished")
                withAnimation(.easeOut(duration: 0.45)) {
                    showSplash = false
                }
                hasHandledInitialAppearance = true
                configureNotificationsIfNeeded()
            }
            .onChange(of: appState.darkModeEnabled) { _, enabled in
                if showSplash {
                    applyWindowStyle(enabled)
                    return
                }
                if hasHandledInitialAppearance {
                    presentAppearanceTransition(targetsDarkMode: enabled)
                } else {
                    hasHandledInitialAppearance = true
                }
                applyWindowStyle(enabled)
            }
            .onChange(of: scenePhase) { _, phase in
                if phase == .active {
                    applyWindowStyle(appState.darkModeEnabled)
                } else {
                    dismissAppearanceTransition()
                }
            }
        }
    }

    private func applyWindowStyle(_ darkMode: Bool) {
        HayameSystemAppearance.configure(darkMode: darkMode)
    }

    private func logSplash(_ message: String) {
        #if DEBUG
        print("[HayameSplash] \(message)")
        #endif
    }

    private func configureNotificationsIfNeeded() {
        guard !hasConfiguredNotifications else { return }
        hasConfiguredNotifications = true
        logSplash("configuring notifications")
        NotificationManager.shared.configure(launchOptions: AppDelegate.consumePendingLaunchOptions())
    }

    private func presentAppearanceTransition(targetsDarkMode: Bool) {
        appearanceTransitionTask?.cancel()
        appearanceTransitionTargetsDarkMode = targetsDarkMode
        withAnimation(.easeOut(duration: 0.28)) {
            showAppearanceTransition = true
        }

        appearanceTransitionTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 1_420_000_000)
            guard !Task.isCancelled else { return }
            withAnimation(.easeInOut(duration: 0.42)) {
                showAppearanceTransition = false
            }
            appearanceTransitionTask = nil
        }
    }

    private func dismissAppearanceTransition() {
        appearanceTransitionTask?.cancel()
        appearanceTransitionTask = nil
        if showAppearanceTransition {
            showAppearanceTransition = false
        }
    }

}

private struct AppearanceTransitionOverlay: View {
    let targetsDarkMode: Bool

    @State private var iconScale = 0.76
    @State private var iconRotation = -10.0
    @State private var haloScale = 0.72
    @State private var haloOpacity = 0.42

    private var backgroundGradient: [Color] {
        if targetsDarkMode {
            return [
                Color(red: 0.02, green: 0.10, blue: 0.18),
                Color(red: 0.05, green: 0.20, blue: 0.32)
            ]
        }

        return [
            Color(red: 0.93, green: 0.97, blue: 1.00),
            Color(red: 0.78, green: 0.90, blue: 1.00)
        ]
    }

    private var foreground: Color {
        targetsDarkMode ? .white : Color(red: 0.04, green: 0.17, blue: 0.33)
    }

    private var modeTitle: String {
        targetsDarkMode ? "Dark mode" : "Light mode"
    }

    private var systemImage: String {
        targetsDarkMode ? "moon.stars.fill" : "sun.max.fill"
    }

    var body: some View {
        ZStack {
            LinearGradient(
                colors: backgroundGradient,
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 18) {
                ZStack {
                    Circle()
                        .fill(foreground.opacity(targetsDarkMode ? 0.12 : 0.10))
                        .frame(width: 148, height: 148)
                        .scaleEffect(haloScale)
                        .opacity(haloOpacity)

                    Circle()
                        .stroke(foreground.opacity(targetsDarkMode ? 0.18 : 0.16), lineWidth: 1)
                        .frame(width: 118, height: 118)

                    Image(systemName: systemImage)
                        .font(.system(size: 54, weight: .semibold))
                        .foregroundStyle(foreground)
                        .scaleEffect(iconScale)
                        .rotationEffect(.degrees(iconRotation))
                }

                Text(modeTitle)
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundStyle(foreground)
            }
        }
        .onAppear {
            iconRotation = targetsDarkMode ? -10 : 10
            withAnimation(.spring(response: 0.68, dampingFraction: 0.86)) {
                iconScale = 1.0
                iconRotation = 0
                haloScale = 1.0
            }
            withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                haloOpacity = 0.72
            }
        }
    }
}

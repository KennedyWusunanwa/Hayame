import SwiftUI
import UIKit

@main
struct HayameIOSApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @AppStorage("hayame.appearance_intro_seen") private var hasSeenAppearanceIntro = false
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var appState = AppState()
    @State private var showSplash = true
    @State private var showAppearanceTransition = false
    @State private var appearanceTransitionTargetsDarkMode = false
    @State private var hasHandledInitialAppearance = false
    @State private var showAppearanceIntro = false
    @State private var appearanceTransitionTask: Task<Void, Never>?

    var body: some Scene {
        WindowGroup {
            ZStack {
                RootView()
                    .environmentObject(appState)
                    .opacity(showSplash ? 0 : 1)
                    .animation(.easeOut(duration: 0.45), value: showSplash)

                if showSplash {
                    SplashScreen()
                        .transition(.opacity.combined(with: .scale(scale: 1.02)))
                }

                if showAppearanceTransition {
                    AppearanceTransitionOverlay(targetsDarkMode: appearanceTransitionTargetsDarkMode)
                        .transition(.opacity)
                        .zIndex(20)
                }

                if showAppearanceIntro {
                    Color.black.opacity(0.34)
                        .ignoresSafeArea()
                        .transition(.opacity)
                        .zIndex(30)

                    AppearanceIntroPrompt(
                        darkModeEnabled: appState.darkModeEnabled,
                        onOpenSettings: {
                            hasSeenAppearanceIntro = true
                            withAnimation(.easeInOut(duration: 0.18)) {
                                showAppearanceIntro = false
                            }
                            appState.openAppearanceSettings()
                        },
                        onTryLater: {
                            hasSeenAppearanceIntro = true
                            withAnimation(.easeInOut(duration: 0.18)) {
                                showAppearanceIntro = false
                            }
                        }
                    )
                    .padding(20)
                    .transition(.scale(scale: 0.96).combined(with: .opacity))
                    .zIndex(31)
                }
            }
            .preferredColorScheme(appState.darkModeEnabled ? .dark : .light)
            .onAppear {
                applyWindowStyle(appState.darkModeEnabled)
                presentAppearanceIntroIfNeeded()
            }
            .onChange(of: appState.darkModeEnabled) { _, enabled in
                if hasHandledInitialAppearance {
                    presentAppearanceTransition(targetsDarkMode: enabled)
                } else {
                    hasHandledInitialAppearance = true
                }
                applyWindowStyle(enabled)
            }
            .onChange(of: scenePhase) { _, phase in
                if phase != .active {
                    dismissAppearanceTransition()
                }
            }
            .task {
                try? await Task.sleep(nanoseconds: 5_000_000_000)
                withAnimation(.easeOut(duration: 0.45)) {
                    showSplash = false
                }
                hasHandledInitialAppearance = true
            }
        }
    }

    private func applyWindowStyle(_ darkMode: Bool) {
        HayameSystemAppearance.configure(darkMode: darkMode)
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

    private func presentAppearanceIntroIfNeeded() {
        guard !hasSeenAppearanceIntro, !showAppearanceIntro else { return }
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 1_100_000_000)
            guard !hasSeenAppearanceIntro else { return }
            withAnimation(.easeInOut(duration: 0.18)) {
                showAppearanceIntro = true
            }
        }
    }
}

private struct AppearanceIntroPrompt: View {
    let darkModeEnabled: Bool
    let onOpenSettings: () -> Void
    let onTryLater: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .top, spacing: 14) {
                ZStack {
                    Circle()
                        .fill(HayameTheme.brandBlue.opacity(0.14))
                        .frame(width: 56, height: 56)
                    Image(systemName: darkModeEnabled ? "moon.stars.fill" : "sun.max.fill")
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundStyle(HayameTheme.brandBlue)
                }

                VStack(alignment: .leading, spacing: 5) {
                    Text("Choose your look")
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text("Hayame now supports light and dark mode. You can change it anytime in Appearance.")
                        .font(.system(size: 14, weight: .medium, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            VStack(spacing: 10) {
                Button {
                    onOpenSettings()
                } label: {
                    Label("Open Appearance settings", systemImage: "slider.horizontal.3")
                }
                .buttonStyle(PrimaryPillButtonStyle())

                Button("Try later") {
                    onTryLater()
                }
                .buttonStyle(SecondaryPillButtonStyle())
                .frame(maxWidth: .infinity, alignment: .center)
            }
        }
        .padding(22)
        .frame(maxWidth: 420)
        .background(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .fill(HayameTheme.cardBackground)
                .shadow(color: Color.black.opacity(0.22), radius: 32, x: 0, y: 18)
        )
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

import SwiftUI
import UIKit

@main
struct HayameIOSApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var appState = AppState()
    @State private var showSplash = true
    @State private var isHandingOffFromSplash = false
    @State private var splashExitProgress = 0.0
    @State private var showAppearanceTransition = false
    @State private var hideContentForAppearanceTransition = false
    @State private var appearanceTransitionTargetsDarkMode = false
    @State private var hasHandledInitialAppearance = false
    @State private var appearanceTransitionTask: Task<Void, Never>?
    @State private var hasConfiguredNotifications = false
    @State private var showAnalyticsConsent = false

    var body: some Scene {
        WindowGroup {
            rootContent
        }
    }

    @ViewBuilder
    private var rootContent: some View {
        #if DEBUG
        if let screenshotRoute = ScreenshotRoute.current {
            ScreenshotRootView(route: screenshotRoute)
                .environmentObject(appState)
                .font(.hayame(size: 15))
                .preferredColorScheme(appState.appearanceMode.preferredColorScheme)
                .onAppear {
                    applyWindowStyle(appState.darkModeEnabled)
                    AppIconManager.shared.applyLaunchArgumentIfNeeded()
                    scheduleScreenshotDarkModeToggleIfNeeded()
                    scheduleScreenshotHostToggleIfNeeded()
                    scheduleScreenshotHostTabSwitchIfNeeded()
                    scheduleScreenshotRenterTabSwitchIfNeeded()
                }
        } else {
            liveRoot
        }
        #else
        liveRoot
        #endif
    }

    /// The app content stays hidden until the splash starts its exit.
    private var isRootHidden: Bool {
        (showSplash && !isHandingOffFromSplash) || hideContentForAppearanceTransition
    }

    private var liveRoot: some View {
        ZStack {
                RootView()
                    .environmentObject(appState)
                    .coachMarkHost()
                    .opacity(isRootHidden ? 0 : 1)
                    // The app settles in from slightly enlarged while the splash
                    // logo zooms past the viewer, so the handoff reads as one move.
                    .scaleEffect(isRootHidden && !HayameMotion.reduceMotion ? 1.05 : 1)
                    .animation(.easeOut(duration: 0.55), value: isRootHidden)

                if showSplash {
                    SplashScreen(darkMode: appState.darkModeEnabled)
                        .modifier(SplashZoomOutModifier(progress: splashExitProgress))
                        // Explicit animation: App-level state changes made after an
                        // await do not reliably carry the withAnimation transaction.
                        .animation(.easeIn(duration: 0.6), value: splashExitProgress)
                        .transition(.opacity)
                        .zIndex(10)
                }

                if showAppearanceTransition {
                    AppearanceTransitionOverlay(targetsDarkMode: appearanceTransitionTargetsDarkMode)
                        .id(appearanceTransitionTargetsDarkMode)
                        .transition(.opacity)
                        .zIndex(20)
                }

            }
            .background(SystemAppearanceReporter(appState: appState))
            .preferredColorScheme(appState.appearanceMode.preferredColorScheme)
            .onAppear {
                logSplash("root appeared")
                applyWindowStyle(appState.darkModeEnabled)
            }
            .onOpenURL { url in
                appState.handleUniversalLink(url)
            }
            .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { activity in
                guard let url = activity.webpageURL else { return }
                appState.handleUniversalLink(url)
            }
            .task {
                guard showSplash else { return }
                logSplash("root timer started")
                // Long enough for the wordmark to be drawn and settle (see
                // HayameLogoReveal.settleTime), plus a beat of rest.
                try? await Task.sleep(nanoseconds: 4_700_000_000)
                guard !Task.isCancelled else {
                    logSplash("root timer cancelled")
                    return
                }
                logSplash("root timer finished")
                if HayameMotion.reduceMotion {
                    withAnimation(.easeOut(duration: 0.45)) {
                        showSplash = false
                    }
                } else {
                    // Zoom the splash through the viewer while the app fades up
                    // underneath, then drop the splash once it is out of sight.
                    withAnimation(.easeOut(duration: 0.55)) {
                        isHandingOffFromSplash = true
                    }
                    withAnimation(.easeIn(duration: 0.6)) {
                        splashExitProgress = 1
                    }
                    try? await Task.sleep(nanoseconds: 650_000_000)
                    showSplash = false
                }
                hasHandledInitialAppearance = true
                configureNotificationsIfNeeded()
                // Ask after the splash clears, not over it. Only ever asked once
                // per policy version; declining is remembered just as firmly.
                if AnalyticsService.shared.needsConsentDecision {
                    showAnalyticsConsent = true
                }
            }
            .sheet(isPresented: $showAnalyticsConsent) {
                AnalyticsConsentSheet { decision in
                    AnalyticsService.shared.setConsent(decision)
                }
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
                    appState.refreshSystemAppearanceIfFollowingSystem()
                    applyWindowStyle(appState.darkModeEnabled)
            } else {
                // Backgrounding is the last chance to send queued events before
                // the app may be suspended or killed.
                AnalyticsService.shared.flush()
                dismissAppearanceTransition()
            }
        }
    }

    private func applyWindowStyle(_ darkMode: Bool) {
        HayameSystemAppearance.configure(darkMode: darkMode)
    }

    #if DEBUG
    /// `-HAYAME_TOGGLE_HOST_AFTER <seconds>[,<seconds>...]` flips host mode at each
    /// listed time on the `mode-switch` screenshot route, to capture the interstitial.
    private func scheduleScreenshotHostToggleIfNeeded() {
        let args = ProcessInfo.processInfo.arguments
        guard let index = args.firstIndex(of: "-HAYAME_TOGGLE_HOST_AFTER"), args.indices.contains(index + 1) else { return }
        let times = args[index + 1].split(separator: ",").compactMap { Double($0.trimmingCharacters(in: .whitespaces)) }
        for seconds in times {
            Task { @MainActor in
                try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
                appState.hostModeEnabled.toggle()
            }
        }
    }

    /// `-HAYAME_HOST_TAB_AFTER <seconds>:<tab>[,<seconds>:<tab>...]` switches the
    /// host tab (dashboard, cars, bookings, earnings, inbox, profile) at each
    /// listed time on the host screenshot routes, to capture tab transitions.
    private func scheduleScreenshotHostTabSwitchIfNeeded() {
        let args = ProcessInfo.processInfo.arguments
        guard let index = args.firstIndex(of: "-HAYAME_HOST_TAB_AFTER"), args.indices.contains(index + 1) else { return }
        for entry in args[index + 1].split(separator: ",") {
            let parts = entry.split(separator: ":", maxSplits: 1).map { $0.trimmingCharacters(in: .whitespaces) }
            let tabByName: [String: HostTab] = [
                "dashboard": .dashboard, "cars": .cars, "bookings": .bookings,
                "earnings": .earnings, "inbox": .inbox, "profile": .profile,
            ]
            guard parts.count == 2, let seconds = Double(parts[0]), let tab = tabByName[parts[1].lowercased()] else { continue }
            Task { @MainActor in
                try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
                appState.hostTab = tab
            }
        }
    }

    /// `-HAYAME_RENTER_TAB_AFTER <seconds>:<tab>[,...]` switches the renter tab
    /// (home, explore, trips, favorites, more, inbox, profile, dashboard). The
    /// inbox, profile and dashboard tabs push their page from More.
    private func scheduleScreenshotRenterTabSwitchIfNeeded() {
        let args = ProcessInfo.processInfo.arguments
        guard let index = args.firstIndex(of: "-HAYAME_RENTER_TAB_AFTER"), args.indices.contains(index + 1) else { return }
        for entry in args[index + 1].split(separator: ",") {
            let parts = entry.split(separator: ":", maxSplits: 1).map { $0.trimmingCharacters(in: .whitespaces) }
            let tabByName: [String: RenterTab] = [
                "home": .home, "explore": .explore, "trips": .trips, "favorites": .favorites,
                "more": .more, "inbox": .inbox, "profile": .profile, "dashboard": .dashboard,
            ]
            guard parts.count == 2, let seconds = Double(parts[0]), let tab = tabByName[parts[1].lowercased()] else { continue }
            Task { @MainActor in
                try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
                appState.renterTab = tab
            }
        }
    }

    /// `-HAYAME_TOGGLE_DARK_AFTER <seconds>[,<seconds>...]` flips dark mode at
    /// each listed time while a screenshot route is on screen, to check that bars
    /// follow the scheme change live in both directions.
    private func scheduleScreenshotDarkModeToggleIfNeeded() {
        let args = ProcessInfo.processInfo.arguments
        guard let index = args.firstIndex(of: "-HAYAME_TOGGLE_DARK_AFTER"), args.indices.contains(index + 1) else { return }
        let times = args[index + 1].split(separator: ",").compactMap { Double($0.trimmingCharacters(in: .whitespaces)) }
        for seconds in times {
            Task { @MainActor in
                try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
                appState.setDarkMode(!appState.darkModeEnabled)
            }
        }
    }
    #endif

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
        hideContentForAppearanceTransition = true
        showAppearanceTransition = true

        appearanceTransitionTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 1_420_000_000)
            guard !Task.isCancelled else { return }
            withAnimation(.easeInOut(duration: 0.42)) {
                showAppearanceTransition = false
                hideContentForAppearanceTransition = false
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
        hideContentForAppearanceTransition = false
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
                        .font(.hayame(size: 54, weight: .semibold))
                        .foregroundStyle(foreground)
                        .scaleEffect(iconScale)
                        .rotationEffect(.degrees(iconRotation))
                }

                Text(modeTitle)
                    .font(.hayame(size: 22, weight: .bold))
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

/// Reports the phone's light/dark setting to `AppState` while the app follows
/// the system, so a change in Control Centre or at sunset applies right away.
private struct SystemAppearanceReporter: View {
    @ObservedObject var appState: AppState
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Color.clear
            .onAppear(perform: report)
            .onChange(of: colorScheme) { _, _ in report() }
            .onChange(of: appState.appearanceMode) { _, _ in report() }
    }

    private func report() {
        guard appState.appearanceMode == .system else { return }
        appState.updateSystemAppearance(prefersDark: colorScheme == .dark)
    }
}

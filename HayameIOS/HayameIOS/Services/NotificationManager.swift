import Foundation
import UIKit
import UserNotifications

@MainActor
final class NotificationManager: NSObject, ObservableObject {
    static let shared = NotificationManager()

    @Published private(set) var authorizationStatus: UNAuthorizationStatus = .notDetermined

    private let defaults = UserDefaults.standard
    private let apnsTokenDefaultsKey = "hayame.apns.device_token"

    var apnsDeviceToken: String? {
        let token = defaults.string(forKey: apnsTokenDefaultsKey)?.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let token, !token.isEmpty else { return nil }
        return token
    }

    private override init() {
        super.init()
    }

    func configure() {
        UNUserNotificationCenter.current().delegate = self
        Task {
            await refreshAuthorizationStatus()
        }
    }

    func enableUserNotifications() async {
        do {
            let center = UNUserNotificationCenter.current()
            let granted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
            await refreshAuthorizationStatus()
            if granted {
                UIApplication.shared.registerForRemoteNotifications()
            }
        } catch {
            // Notification permission can fail when disabled by system policy.
        }
    }

    func scheduleLocalNotification(title: String, body: String) async {
        guard authorizationStatus == .authorized || authorizationStatus == .provisional || authorizationStatus == .ephemeral else {
            return
        }

        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default

        let request = UNNotificationRequest(
            identifier: "local.\(UUID().uuidString)",
            content: content,
            trigger: UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        )
        try? await UNUserNotificationCenter.current().add(request)
    }

    func handleRegisteredDeviceToken(_ deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02x", $0) }.joined()
        defaults.set(token, forKey: apnsTokenDefaultsKey)
    }

    func handleRemoteNotificationRegistrationFailure(_ error: Error) {
        defaults.removeObject(forKey: apnsTokenDefaultsKey)
    }

    private func refreshAuthorizationStatus() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        authorizationStatus = settings.authorizationStatus
    }
}

extension NotificationManager: UNUserNotificationCenterDelegate {
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .badge, .sound])
    }
}

final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        configureSystemBarAppearance()
        Task { @MainActor in
            NotificationManager.shared.configure()
        }
        return true
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        configureSystemBarAppearance()
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Task { @MainActor in
            NotificationManager.shared.handleRegisteredDeviceToken(deviceToken)
        }
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        Task { @MainActor in
            NotificationManager.shared.handleRemoteNotificationRegistrationFailure(error)
        }
    }

    private func configureSystemBarAppearance() {
        let pageBackground = UIColor(red: 0.97, green: 0.98, blue: 1.0, alpha: 1.0)
        let brandBlue = UIColor(red: 0.08, green: 0.52, blue: 0.85, alpha: 1.0)
        let brandNavy = UIColor(red: 0.04, green: 0.17, blue: 0.33, alpha: 1.0)

        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithOpaqueBackground()
        navAppearance.backgroundColor = pageBackground
        navAppearance.shadowColor = UIColor.black.withAlphaComponent(0.06)
        navAppearance.titleTextAttributes = [.foregroundColor: brandNavy]
        navAppearance.largeTitleTextAttributes = [.foregroundColor: brandNavy]

        let navBar = UINavigationBar.appearance()
        navBar.standardAppearance = navAppearance
        navBar.compactAppearance = navAppearance
        navBar.scrollEdgeAppearance = navAppearance
        if #available(iOS 15.0, *) {
            navBar.compactScrollEdgeAppearance = navAppearance
        }
        navBar.tintColor = brandBlue

        // Keep tab bar visuals under SwiftUI control to avoid intermittent
        // transparent/glitched state after auth/root view transitions.
        UITabBar.appearance().tintColor = brandBlue
    }
}

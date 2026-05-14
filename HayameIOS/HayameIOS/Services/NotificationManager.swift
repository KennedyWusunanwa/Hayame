import Foundation
import UIKit
import UserNotifications

extension Notification.Name {
    static let hayameDidRegisterPushToken = Notification.Name("hayameDidRegisterPushToken")
    static let hayamePushRegistrationFailed = Notification.Name("hayamePushRegistrationFailed")
    static let hayameDidOpenPushNotification = Notification.Name("hayameDidOpenPushNotification")
}

struct PushNotificationRoute: Equatable {
    let conversationID: String?
    let bookingID: String?
    let recipientRole: String?
    let participantName: String?
    let announcementID: String?
    let announcementTitle: String?
    let announcementBody: String?
    let announcementCategory: String?
    let announcementCTAURL: String?
}

@MainActor
final class NotificationManager: NSObject, ObservableObject {
    static let shared = NotificationManager()

    @Published private(set) var authorizationStatus: UNAuthorizationStatus = .notDetermined
    @Published private(set) var registrationErrorMessage: String?

    private let defaults = UserDefaults.standard
    private let apnsTokenDefaultsKey = "hayame.apns.device_token"
    private let lastUploadedPushTokenDefaultsKey = "hayame.apns.last_uploaded_token"
    private let remotePushEnabledDefaultsKey = "hayame.apns.remote_push_enabled"
    private var pendingNotificationRoute: PushNotificationRoute?

    var apnsDeviceToken: String? {
        let token = defaults.string(forKey: apnsTokenDefaultsKey)?.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let token, !token.isEmpty else { return nil }
        return token
    }

    var lastUploadedPushToken: String? {
        let token = defaults.string(forKey: lastUploadedPushTokenDefaultsKey)?.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let token, !token.isEmpty else { return nil }
        return token
    }

    var shouldUseRemotePushDelivery: Bool {
        let authorizedStatuses: Set<UNAuthorizationStatus> = [.authorized, .provisional, .ephemeral]
        return authorizedStatuses.contains(authorizationStatus) &&
            defaults.bool(forKey: remotePushEnabledDefaultsKey) &&
            apnsDeviceToken != nil &&
            lastUploadedPushToken != nil
    }

    private override init() {
        super.init()
    }

    func configure(launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) {
        UNUserNotificationCenter.current().delegate = self
        Task {
            await refreshAuthorizationStatus()
        }

        if let remoteNotification = launchOptions?[.remoteNotification] as? [AnyHashable: Any] {
            handleNotificationResponse(userInfo: remoteNotification)
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
        registrationErrorMessage = nil
        NotificationCenter.default.post(name: .hayameDidRegisterPushToken, object: nil)
    }

    func handleRemoteNotificationRegistrationFailure(_ error: Error) {
        defaults.removeObject(forKey: apnsTokenDefaultsKey)
        defaults.set(false, forKey: remotePushEnabledDefaultsKey)
        registrationErrorMessage = error.localizedDescription
        NotificationCenter.default.post(
            name: .hayamePushRegistrationFailed,
            object: nil,
            userInfo: ["error": error.localizedDescription]
        )
        print("[push] APNs registration failed:", error.localizedDescription)
    }

    func markPushTokenRegistration(token: String, deliveryEnabled: Bool) {
        let normalized = token.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalized.isEmpty else { return }
        defaults.set(normalized, forKey: lastUploadedPushTokenDefaultsKey)
        defaults.set(deliveryEnabled, forKey: remotePushEnabledDefaultsKey)
    }

    func markRemotePushDeliveryUnavailable() {
        defaults.set(false, forKey: remotePushEnabledDefaultsKey)
    }

    func clearPushRegistrationState() {
        defaults.removeObject(forKey: lastUploadedPushTokenDefaultsKey)
        defaults.set(false, forKey: remotePushEnabledDefaultsKey)
    }

    func consumePendingNotificationRoute() -> PushNotificationRoute? {
        let route = pendingNotificationRoute
        pendingNotificationRoute = nil
        return route
    }

    func handleNotificationResponse(userInfo: [AnyHashable: Any]) {
        guard let route = parseNotificationRoute(from: userInfo) else { return }
        pendingNotificationRoute = route
        NotificationCenter.default.post(name: .hayameDidOpenPushNotification, object: nil)
    }

    private func refreshAuthorizationStatus() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        authorizationStatus = settings.authorizationStatus
    }

    private func parseNotificationRoute(from userInfo: [AnyHashable: Any]) -> PushNotificationRoute? {
        let conversationID = pushString(forKey: "conversationId", in: userInfo)
        let bookingID = pushString(forKey: "bookingId", in: userInfo)
        let recipientRole = pushString(forKey: "recipientRole", in: userInfo)
        let announcementID = pushString(forKey: "announcementId", in: userInfo)
        let announcementCategory = pushString(forKey: "category", in: userInfo)
        let announcementCTAURL = pushString(forKey: "ctaUrl", in: userInfo)
        let participantName =
            pushString(forKey: "participantName", in: userInfo) ??
            participantName(from: alertTitle(from: userInfo))
        let title = pushString(forKey: "title", in: userInfo) ?? alertTitle(from: userInfo)
        let body = pushString(forKey: "body", in: userInfo) ?? alertBody(from: userInfo)

        guard conversationID != nil || bookingID != nil || announcementID != nil else { return nil }
        return PushNotificationRoute(
            conversationID: conversationID,
            bookingID: bookingID,
            recipientRole: recipientRole?.lowercased(),
            participantName: participantName,
            announcementID: announcementID,
            announcementTitle: title,
            announcementBody: body,
            announcementCategory: announcementCategory,
            announcementCTAURL: announcementCTAURL
        )
    }

    private func pushString(forKey key: String, in userInfo: [AnyHashable: Any]) -> String? {
        if let direct = stringValue(userInfo[key]) {
            return direct
        }
        if let nested = userInfo["data"] as? [AnyHashable: Any],
           let value = stringValue(nested[key]) {
            return value
        }
        return nil
    }

    private func stringValue(_ value: Any?) -> String? {
        guard let value else { return nil }
        let normalized = String(describing: value).trimmingCharacters(in: .whitespacesAndNewlines)
        return normalized.isEmpty ? nil : normalized
    }

    private func alertTitle(from userInfo: [AnyHashable: Any]) -> String? {
        guard let aps = userInfo["aps"] as? [AnyHashable: Any] else { return nil }
        if let alert = aps["alert"] as? String {
            let normalized = alert.trimmingCharacters(in: .whitespacesAndNewlines)
            return normalized.isEmpty ? nil : normalized
        }
        if let alert = aps["alert"] as? [AnyHashable: Any] {
            return stringValue(alert["title"])
        }
        return nil
    }

    private func alertBody(from userInfo: [AnyHashable: Any]) -> String? {
        guard let aps = userInfo["aps"] as? [AnyHashable: Any] else { return nil }
        if let alert = aps["alert"] as? [AnyHashable: Any] {
            return stringValue(alert["body"])
        }
        return nil
    }

    private func participantName(from title: String?) -> String? {
        guard let title else { return nil }
        let prefix = "New message from "
        guard title.hasPrefix(prefix) else { return nil }
        let value = title.dropFirst(prefix.count).trimmingCharacters(in: .whitespacesAndNewlines)
        return value.isEmpty ? nil : value
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

    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        Task { @MainActor in
            NotificationManager.shared.handleNotificationResponse(
                userInfo: response.notification.request.content.userInfo
            )
            completionHandler()
        }
    }
}

final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        configureSystemBarAppearance()
        Task { @MainActor in
            NotificationManager.shared.configure(launchOptions: launchOptions)
        }
        return true
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
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
        let darkMode = UserDefaults.standard.bool(forKey: "hayame.dark_mode_enabled")
        HayameSystemAppearance.configure(darkMode: darkMode)
    }
}

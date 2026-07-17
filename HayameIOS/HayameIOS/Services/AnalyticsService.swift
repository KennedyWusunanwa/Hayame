import Foundation

/// First-party product analytics for the iOS app.
///
/// Mirrors the web client in `src/lib/analytics/`. Deliberately narrow:
///
///   * No IDFA, no AdSupport, no AppTrackingTransparency. Nothing here meets
///     Apple's definition of "tracking" (linking a user to data from other
///     companies' apps or websites for ads or data brokerage), so the app does
///     not show an ATT prompt and `NSPrivacyTracking` stays false.
///   * No device fingerprinting, no precise location, no PII. Events carry an
///     allowlisted set of keys only — the server strips anything else anyway.
///   * Nothing is stored or sent until the person accepts analytics in-app.
///
/// If you are tempted to add an ad SDK later: that is a different decision with
/// App Store consequences, not an extension of this file.
@MainActor
final class AnalyticsService: ObservableObject {
    static let shared = AnalyticsService()

    enum Consent: String {
        case granted
        case denied
    }

    private let consentKey = "hayame.analytics_consent"
    private let consentVersionKey = "hayame.analytics_consent_version"
    private let sessionKeyKey = "hayame.session_key"

    /// Keep in step with CONSENT_POLICY_VERSION in src/lib/analytics/consent.ts.
    /// Bumping re-asks everyone, so bump only when the policy materially changes.
    private let policyVersion = "2026-07-17"

    private let defaults = UserDefaults.standard
    private let maxQueue = 20
    private let maxPending = 30
    private let flushInterval: TimeInterval = 5

    private var queue: [[String: Any]] = []
    /// Events fired before a consent decision — held in memory only, never on disk.
    private var pending: [[String: Any]] = []
    private var flushTask: Task<Void, Never>?

    /// Injected by AppState so the service does not need to know about config.
    var baseURLProvider: (() -> String)?
    var tokenProvider: (() -> String?)?

    private init() {}

    // MARK: - Consent

    var consent: Consent? {
        // A decision made against an older policy is not informed consent for
        // what we do now; treat it as undecided.
        guard defaults.string(forKey: consentVersionKey) == policyVersion,
              let raw = defaults.string(forKey: consentKey) else {
            return nil
        }
        return Consent(rawValue: raw)
    }

    var hasConsent: Bool { consent == .granted }

    var needsConsentDecision: Bool { consent == nil }

    func setConsent(_ decision: Consent) {
        defaults.set(decision.rawValue, forKey: consentKey)
        defaults.set(policyVersion, forKey: consentVersionKey)

        if decision == .granted {
            let held = pending
            pending = []
            queue.append(contentsOf: held.suffix(maxQueue))
            scheduleFlush()
        } else {
            // Withdrawal has to actually delete what we kept, or it is cosmetic.
            pending = []
            queue = []
            defaults.removeObject(forKey: sessionKeyKey)
        }

        recordConsentDecision(granted: decision == .granted)
    }

    // MARK: - Session key

    private var sessionKey: String? {
        guard hasConsent else { return nil }
        if let existing = defaults.string(forKey: sessionKeyKey) { return existing }
        // Must match the server's /^sess_[a-z0-9]+_\d+$/i validation.
        let random = String(UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(12)).lowercased()
        let generated = "sess_\(random)_\(Int(Date().timeIntervalSince1970 * 1000))"
        defaults.set(generated, forKey: sessionKeyKey)
        return generated
    }

    private var appVersion: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "unknown"
    }

    // MARK: - Tracking

    /// Record an event. Safe to call from anywhere; never throws, never blocks.
    func track(_ name: String, _ props: [String: Any] = [:]) {
        var event: [String: Any] = ["name": name]
        if !props.isEmpty { event["props"] = props }

        guard let consent else {
            if pending.count < maxPending { pending.append(event) }
            return
        }
        guard consent == .granted else { return }

        queue.append(event)
        if queue.count >= maxQueue {
            flush()
        } else {
            scheduleFlush()
        }
    }

    private func scheduleFlush() {
        guard flushTask == nil else { return }
        flushTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: UInt64((self?.flushInterval ?? 5) * 1_000_000_000))
            await MainActor.run { self?.flush() }
        }
    }

    /// Send whatever is queued. Called on a timer and when the app backgrounds.
    func flush() {
        flushTask?.cancel()
        flushTask = nil
        guard !queue.isEmpty, hasConsent else { return }

        let batch = queue
        queue = []

        var payload: [String: Any] = [
            "events": batch,
            "platform": "ios",
            "appVersion": appVersion,
        ]
        if let sessionKey { payload["sessionKey"] = sessionKey }

        post(path: "/api/analytics", json: payload)
    }

    private func recordConsentDecision(granted: Bool) {
        var payload: [String: Any] = [
            "analytics": granted,
            "platform": "ios",
        ]
        // Only include the session key on grant — on denial it is already gone,
        // and re-creating one to log the denial would defeat the point.
        if granted, let sessionKey { payload["sessionKey"] = sessionKey }
        post(path: "/api/consent", json: payload)
    }

    // MARK: - Transport

    /// Fire-and-forget. Analytics must never surface an error or block the UI,
    /// so every failure path here is a silent return.
    private func post(path: String, json: [String: Any]) {
        guard let base = baseURLProvider?(), !base.isEmpty else { return }
        var normalized = base.trimmingCharacters(in: .whitespacesAndNewlines)
        if normalized.hasSuffix("/") { normalized.removeLast() }
        guard let url = URL(string: normalized + path) else { return }
        guard let body = try? JSONSerialization.data(withJSONObject: json) else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 10
        if let token = tokenProvider?(), !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = body

        Task.detached {
            _ = try? await URLSession.shared.data(for: request)
        }
    }
}

/// Event names. Mirrors ANALYTICS_EVENTS in src/lib/analytics/events.ts — the
/// server rejects anything not on that allowlist, so keep the two in step.
enum AnalyticsEvent {
    static let carView = "car_view"
    static let carFavorited = "car_favorited"
    static let carUnfavorited = "car_unfavorited"
    static let search = "search"
    static let bookingStarted = "booking_started"
    static let bookingDatesSelected = "booking_dates_selected"
    static let bookingPaymentStarted = "booking_payment_started"
    static let bookingCompleted = "booking_completed"
    static let bookingAbandoned = "booking_abandoned"
    static let signupCompleted = "signup_completed"
    static let loginCompleted = "login_completed"
    static let hostApplicationStarted = "host_application_started"
    static let hostApplicationSubmitted = "host_application_submitted"
    static let messageSent = "message_sent"
    static let reviewSubmitted = "review_submitted"
}

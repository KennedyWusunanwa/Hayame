#if DEBUG
import SwiftUI

enum ScreenshotRoute: String, CaseIterable, Identifiable {
    case splash
    case authLogin = "auth-login"
    case authSignup = "auth-signup"
    case home
    case explore
    case exploreFilters = "explore-filters"
    case carDetail = "car-detail"
    case bookingTrip = "booking-trip"
    case bookingCalendar = "booking-calendar"
    case bookingLocation = "booking-location"
    case bookingReview = "booking-review"
    case bookingPayment = "booking-payment"
    case paymentProcessing = "payment-processing"
    case bookingSuccess = "booking-success"
    case hostBookings = "host-bookings"
    case hostHome = "host-home"
    case hostProfile = "host-profile"
    case modeSwitch = "mode-switch"
    case trips
    case favorites
    case messages
    case profile
    case more
    case profilePage = "profile-page"
    case settings
    case renterDashboard = "renter-dashboard"
    case checkoutResumeHome = "checkout-resume-home"
    case checkoutResumeTrips = "checkout-resume-trips"
    case checkoutResumeDetail = "checkout-resume-detail"
    case checkoutResumeSheet = "checkout-resume-sheet"
    case checkoutResumeBlocked = "checkout-resume-blocked"
    case chatThread = "chat-thread"
    case hostReviews = "host-reviews"
    case hostReviewsEmpty = "host-reviews-empty"
    case verification
    case verificationPending = "verification-pending"
    case verificationRejected = "verification-rejected"
    case verificationApproved = "verification-approved"
    case verificationHome = "verification-home"
    case terms
    case termsRead = "terms-read"
    case termsError = "terms-error"
    case termsGate = "terms-gate"
    case legalProtection = "legal-protection"
    case legalProtectionQuestion = "legal-protection-question"
    case legalCancellation = "legal-cancellation"
    case legalCancellationTable = "legal-cancellation-table"
    case legalCancellationQuestions = "legal-cancellation-questions"
    case legalPrivacy = "legal-privacy"
    case legalPrivacySearch = "legal-privacy-search"
    case deleteAccount = "delete-account"
    case deleteAccountDone = "delete-account-done"

    var id: String { rawValue }

    static var current: ScreenshotRoute? {
        guard let rawValue = argumentValue(for: "-HAYAME_SCREENSHOT_ROUTE") else {
            return nil
        }
        return ScreenshotRoute(rawValue: rawValue)
    }

    private static func argumentValue(for key: String) -> String? {
        let args = ProcessInfo.processInfo.arguments
        guard let index = args.firstIndex(of: key), args.indices.contains(index + 1) else {
            return nil
        }
        return args[index + 1].trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

struct ScreenshotRootView: View {
    @EnvironmentObject private var appState: AppState
    let route: ScreenshotRoute

    var body: some View {
        Group {
            switch route {
            case .splash:
                SplashScreen(darkMode: appState.darkModeEnabled)

            case .authLogin:
                AuthFlowScreen(initialTab: .login)

            case .authSignup:
                AuthFlowScreen(initialTab: .signup)

            default:
                ScreenshotRenterRouteView(route: route)
            }
        }
        .environmentObject(appState)
        .coachMarkHost()
        .background(HayameTheme.pageBackground.ignoresSafeArea())
    }
}
#endif

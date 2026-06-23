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
    case trips
    case favorites
    case messages
    case profile
    case renterDashboard = "renter-dashboard"

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
        .background(HayameTheme.pageBackground.ignoresSafeArea())
    }
}
#endif

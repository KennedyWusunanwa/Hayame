import SwiftUI
import UIKit

/// How the app picks light or dark: follow the phone, or force one. Owned by
/// `AppState` (`appearanceMode` / `setAppearanceMode`).
enum AppearanceMode: String, CaseIterable, Identifiable {
    case system
    case light
    case dark

    var id: String { rawValue }

    /// Short label for the segmented picker in Settings.
    var title: String {
        switch self {
        case .system: return "Auto"
        case .light: return "Light"
        case .dark: return "Dark"
        }
    }

    var label: String { title }

    var subtitle: String {
        switch self {
        case .system: return "Follows your phone's setting"
        case .light: return "Always light"
        case .dark: return "Always dark"
        }
    }

    var systemImage: String {
        switch self {
        case .system: return "iphone"
        case .light: return "sun.max.fill"
        case .dark: return "moon.stars.fill"
        }
    }

    /// `nil` lets the system decide.
    var preferredColorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }

    var colorScheme: ColorScheme? { preferredColorScheme }

    var userInterfaceStyle: UIUserInterfaceStyle {
        switch self {
        case .system: return .unspecified
        case .light: return .light
        case .dark: return .dark
        }
    }
}

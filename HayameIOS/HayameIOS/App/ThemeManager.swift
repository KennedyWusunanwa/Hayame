import SwiftUI
import UIKit

enum AppearanceMode: String, CaseIterable, Identifiable {
    case system
    case light
    case dark

    var id: String { rawValue }

    var label: String {
        switch self {
        case .system:
            return "System"
        case .light:
            return "Light"
        case .dark:
            return "Dark"
        }
    }

    var colorScheme: ColorScheme? {
        switch self {
        case .system:
            return nil
        case .light:
            return .light
        case .dark:
            return .dark
        }
    }

    var userInterfaceStyle: UIUserInterfaceStyle {
        switch self {
        case .system:
            return .unspecified
        case .light:
            return .light
        case .dark:
            return .dark
        }
    }
}

@MainActor
final class ThemeManager: ObservableObject {
    private static let storageKey = "hayame.appearance_mode"

    @Published var appearanceMode: AppearanceMode {
        didSet {
            UserDefaults.standard.set(appearanceMode.rawValue, forKey: Self.storageKey)
            applyAppearanceMode()
        }
    }

    var preferredColorScheme: ColorScheme? {
        appearanceMode.colorScheme
    }

    init() {
        let storedMode = UserDefaults.standard.string(forKey: Self.storageKey)
        appearanceMode = storedMode.flatMap(AppearanceMode.init(rawValue:)) ?? .system
        applyAppearanceMode()
    }

    func setAppearanceMode(_ mode: AppearanceMode) {
        appearanceMode = mode
    }

    func applyAppearanceMode() {
    }
}

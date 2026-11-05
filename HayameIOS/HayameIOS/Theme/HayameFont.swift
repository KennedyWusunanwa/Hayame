import SwiftUI
import UIKit

// Manrope everywhere. The variable font ships in the bundle (Fonts/Manrope-Variable.ttf,
// SIL OFL) and iOS exposes its named instances, so each SwiftUI weight maps to a face.
enum HayameFontFamily {
    static let family = "Manrope"

    static func name(for weight: Font.Weight) -> String {
        switch weight {
        case .ultraLight, .thin: return "Manrope-ExtraLight"
        case .light: return "Manrope-Light"
        case .regular: return "Manrope-Regular"
        case .medium: return "Manrope-Medium"
        case .semibold: return "Manrope-SemiBold"
        case .bold: return "Manrope-Bold"
        case .heavy, .black: return "Manrope-ExtraBold"
        default: return "Manrope-Regular"
        }
    }

    static func uiFont(size: CGFloat, weight: UIFont.Weight) -> UIFont {
        let name: String
        switch weight {
        case .ultraLight, .thin: name = "Manrope-ExtraLight"
        case .light: name = "Manrope-Light"
        case .regular: name = "Manrope-Regular"
        case .medium: name = "Manrope-Medium"
        case .semibold: name = "Manrope-SemiBold"
        case .bold: name = "Manrope-Bold"
        case .heavy, .black: name = "Manrope-ExtraBold"
        default: name = "Manrope-Regular"
        }
        return UIFont(name: name, size: size) ?? UIFont.systemFont(ofSize: size, weight: weight)
    }
}

extension Font {
    /// The app face at a fixed point size, like `.system(size:weight:)` used to be.
    static func hayame(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .custom(HayameFontFamily.name(for: weight), fixedSize: size)
    }
}

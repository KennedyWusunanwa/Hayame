import SwiftUI

enum HayameTheme {
    static let brandBlue = Color(red: 0.08, green: 0.52, blue: 0.85)
    static let brandNavy = Color(red: 0.04, green: 0.17, blue: 0.33)
    static let brandLight = Color(red: 0.93, green: 0.97, blue: 1.0)
    static let mutedText = Color(red: 0.45, green: 0.49, blue: 0.57)
    static let success = Color(red: 0.11, green: 0.63, blue: 0.38)
    static let warning = Color(red: 0.93, green: 0.56, blue: 0.19)
    static let danger = Color(red: 0.88, green: 0.25, blue: 0.25)

    static let pageBackground = Color(red: 0.97, green: 0.98, blue: 1.0)
    static let cardBackground = Color.white
}

struct PrimaryPillButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 16, weight: .semibold, design: .rounded))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                LinearGradient(
                    colors: [HayameTheme.brandBlue.opacity(configuration.isPressed ? 0.8 : 1), HayameTheme.brandNavy],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .foregroundStyle(.white)
            .clipShape(Capsule())
            .shadow(color: HayameTheme.brandBlue.opacity(0.28), radius: 8, x: 0, y: 4)
    }
}

struct SecondaryPillButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 15, weight: .semibold, design: .rounded))
            .padding(.vertical, 10)
            .padding(.horizontal, 14)
            .background(HayameTheme.brandLight)
            .foregroundStyle(HayameTheme.brandNavy)
            .clipShape(Capsule())
            .overlay(Capsule().stroke(HayameTheme.brandBlue.opacity(0.25), lineWidth: 1))
            .opacity(configuration.isPressed ? 0.8 : 1)
    }
}

struct HayameCardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(14)
            .background(HayameTheme.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(Color.black.opacity(0.05), lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 4)
    }
}

extension View {
    func hayameCard() -> some View {
        modifier(HayameCardModifier())
    }

    func hayameSectionTitleStyle() -> some View {
        font(.system(size: 22, weight: .bold, design: .rounded))
            .foregroundStyle(HayameTheme.brandNavy)
    }

    func hayameCaptionStyle() -> some View {
        font(.system(size: 13, weight: .medium, design: .rounded))
            .foregroundStyle(HayameTheme.mutedText)
    }
}

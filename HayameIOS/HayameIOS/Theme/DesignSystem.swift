import SwiftUI
import UIKit

enum HayameTheme {
    static let brandBlue = adaptiveColor(light: UIColor(hex: 0x1484D9), dark: UIColor(hex: 0x4DB3FF))
    static let brandNavy = adaptiveColor(light: UIColor(hex: 0x0A2B54), dark: UIColor(hex: 0xEAF4FF))
    static let primaryButtonEnd = adaptiveColor(light: UIColor(hex: 0x0A2B54), dark: UIColor(hex: 0x1484D9))
    static let brandLight = adaptiveColor(light: UIColor(hex: 0xEDF7FF), dark: UIColor(hex: 0x123452))
    // Auth (sign in / sign up) header band. Bright brand blue in light mode, but
    // a deep, muted blue in dark mode so it reads as premium instead of glaring.
    static let authHeaderBackground = adaptiveColor(light: UIColor(hex: 0x1484D9), dark: UIColor(hex: 0x0E3A66))
    static let mutedText = adaptiveColor(light: UIColor(hex: 0x737D91), dark: UIColor(hex: 0xA8B4C8))
    static let success = adaptiveColor(light: UIColor(hex: 0x1CA160), dark: UIColor(hex: 0x4DDB93))
    static let warning = adaptiveColor(light: UIColor(hex: 0xED8F30), dark: UIColor(hex: 0xFFB35C))
    static let danger = adaptiveColor(light: UIColor(hex: 0xE04040), dark: UIColor(hex: 0xFF6B6B))

    static let pageBackground = adaptiveColor(light: UIColor(hex: 0xF7FAFF), dark: UIColor(hex: 0x071A2F))
    static let cardBackground = adaptiveColor(light: UIColor.white, dark: UIColor(hex: 0x0E263F))
    static let elevatedBackground = adaptiveColor(light: UIColor.white, dark: UIColor(hex: 0x132D49))
    static let fieldBackground = adaptiveColor(light: UIColor(hex: 0xF1F6FD), dark: UIColor(hex: 0x102A44))
    static let chipBackground = adaptiveColor(light: UIColor.white, dark: UIColor(hex: 0x102A44))
    static let floatingControlBackground = adaptiveColor(
        light: UIColor.white.withAlphaComponent(0.92),
        dark: UIColor(hex: 0x102A44, alpha: 0.94)
    )
    static let subtleFill = adaptiveColor(
        light: UIColor.black.withAlphaComponent(0.04),
        dark: UIColor.white.withAlphaComponent(0.08)
    )
    static let cardStroke = adaptiveColor(
        light: UIColor.black.withAlphaComponent(0.06),
        dark: UIColor.white.withAlphaComponent(0.10)
    )
    static let controlStroke = adaptiveColor(
        light: UIColor.black.withAlphaComponent(0.08),
        dark: UIColor.white.withAlphaComponent(0.14)
    )
    static let skeletonBase = adaptiveColor(
        light: UIColor.black.withAlphaComponent(0.08),
        dark: UIColor.white.withAlphaComponent(0.10)
    )
    static let skeletonHighlight = adaptiveColor(
        light: UIColor.white.withAlphaComponent(0.50),
        dark: UIColor.white.withAlphaComponent(0.18)
    )
    static let bottomBarSeparator = adaptiveColor(
        light: UIColor.white.withAlphaComponent(0.75),
        dark: UIColor.white.withAlphaComponent(0.12)
    )
    static let cardShadow = adaptiveColor(
        light: UIColor.black.withAlphaComponent(0.05),
        dark: UIColor.black.withAlphaComponent(0.28)
    )

    private static func adaptiveColor(light: UIColor, dark: UIColor) -> Color {
        Color(
            UIColor { traits in
                traits.userInterfaceStyle == .dark ? dark : light
            }
        )
    }
}

enum HayameSystemAppearance {
    static func configure(darkMode: Bool) {
        let palette = palette(darkMode: darkMode)

        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithOpaqueBackground()
        navAppearance.backgroundColor = palette.pageBackground
        navAppearance.shadowColor = palette.separator
        navAppearance.titleTextAttributes = [.foregroundColor: palette.primaryText]
        navAppearance.largeTitleTextAttributes = [.foregroundColor: palette.primaryText]
        navAppearance.buttonAppearance.normal.titleTextAttributes = [.foregroundColor: palette.brandBlue]
        navAppearance.doneButtonAppearance.normal.titleTextAttributes = [.foregroundColor: palette.brandBlue]

        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithOpaqueBackground()
        tabAppearance.backgroundColor = palette.cardBackground
        tabAppearance.shadowColor = palette.separator
        tabAppearance.selectionIndicatorTintColor = palette.selectedFill
        configureTabItem(tabAppearance.stackedLayoutAppearance, palette: palette)
        configureTabItem(tabAppearance.inlineLayoutAppearance, palette: palette)
        configureTabItem(tabAppearance.compactInlineLayoutAppearance, palette: palette)

        let navBar = UINavigationBar.appearance()
        navBar.standardAppearance = navAppearance
        navBar.compactAppearance = navAppearance
        navBar.scrollEdgeAppearance = navAppearance
        if #available(iOS 15.0, *) {
            navBar.compactScrollEdgeAppearance = navAppearance
        }
        navBar.tintColor = palette.brandBlue
        navBar.isTranslucent = false

        let tabBar = UITabBar.appearance()
        tabBar.standardAppearance = tabAppearance
        if #available(iOS 15.0, *) {
            tabBar.scrollEdgeAppearance = tabAppearance
        }
        tabBar.tintColor = palette.brandBlue
        tabBar.unselectedItemTintColor = palette.secondaryText
        tabBar.backgroundColor = palette.cardBackground
        tabBar.barTintColor = palette.cardBackground
        tabBar.isTranslucent = false

        // SwiftUI owns the live hierarchy. Mutating existing windows during
        // screenshot/app-switch/theme snapshots can leave only the window
        // background rendered, so keep this limited to UIKit appearance proxies.
    }

    private struct Palette {
        let pageBackground: UIColor
        let cardBackground: UIColor
        let brandBlue: UIColor
        let primaryText: UIColor
        let secondaryText: UIColor
        let selectedFill: UIColor
        let separator: UIColor
    }

    private static func palette(darkMode: Bool) -> Palette {
        if darkMode {
            return Palette(
                pageBackground: UIColor(hex: 0x071A2F),
                cardBackground: UIColor(hex: 0x0E263F),
                brandBlue: UIColor(hex: 0x4DB3FF),
                primaryText: UIColor(hex: 0xEAF4FF),
                secondaryText: UIColor(hex: 0xA8B4C8),
                selectedFill: UIColor(hex: 0x123452),
                separator: UIColor.white.withAlphaComponent(0.10)
            )
        }

        return Palette(
            pageBackground: UIColor(hex: 0xF7FAFF),
            cardBackground: UIColor.white,
            brandBlue: UIColor(hex: 0x1484D9),
            primaryText: UIColor(hex: 0x0A2B54),
            secondaryText: UIColor(hex: 0x737D91),
            selectedFill: UIColor(hex: 0xEDF7FF),
            separator: UIColor.black.withAlphaComponent(0.06)
        )
    }

    private static func configureTabItem(_ appearance: UITabBarItemAppearance, palette: Palette) {
        appearance.normal.iconColor = palette.secondaryText
        appearance.normal.titleTextAttributes = [.foregroundColor: palette.secondaryText]
        appearance.selected.iconColor = palette.brandBlue
        appearance.selected.titleTextAttributes = [.foregroundColor: palette.brandBlue]
        appearance.focused.iconColor = palette.brandBlue
        appearance.focused.titleTextAttributes = [.foregroundColor: palette.brandBlue]
    }

    private static func updateExistingBars(
        navAppearance: UINavigationBarAppearance,
        tabAppearance: UITabBarAppearance,
        palette: Palette
    ) {
        for scene in UIApplication.shared.connectedScenes {
            guard let windowScene = scene as? UIWindowScene else { continue }
            for window in windowScene.windows {
                window.backgroundColor = palette.pageBackground
                window.tintColor = palette.brandBlue
                window.rootViewController?.setNeedsStatusBarAppearanceUpdate()
                if let rootViewController = window.rootViewController {
                    updateViewControllers(in: rootViewController, palette: palette)
                }
                updateBars(in: window, navAppearance: navAppearance, tabAppearance: tabAppearance, palette: palette)
            }
        }
    }

    private static func updateViewControllers(in viewController: UIViewController, palette: Palette) {
        if let tabController = viewController as? UITabBarController {
            tabController.view.backgroundColor = palette.pageBackground
            if #available(iOS 18.0, *) {
                tabController.mode = .tabBar
            }
            if #available(iOS 26.0, *) {
                tabController.tabBarMinimizeBehavior = .never
            }
        }

        viewController.children.forEach { child in
            updateViewControllers(in: child, palette: palette)
        }

        if let presented = viewController.presentedViewController {
            updateViewControllers(in: presented, palette: palette)
        }
    }

    private static func updateBars(
        in view: UIView,
        navAppearance: UINavigationBarAppearance,
        tabAppearance: UITabBarAppearance,
        palette: Palette
    ) {
        if let navBar = view as? UINavigationBar {
            navBar.standardAppearance = navAppearance
            navBar.compactAppearance = navAppearance
            navBar.scrollEdgeAppearance = navAppearance
            if #available(iOS 15.0, *) {
                navBar.compactScrollEdgeAppearance = navAppearance
            }
            navBar.tintColor = palette.brandBlue
            navBar.isTranslucent = false
            navBar.setNeedsLayout()
        } else if let tabBar = view as? UITabBar {
            tabBar.standardAppearance = tabAppearance
            if #available(iOS 15.0, *) {
                tabBar.scrollEdgeAppearance = tabAppearance
            }
            tabBar.tintColor = palette.brandBlue
            tabBar.unselectedItemTintColor = palette.secondaryText
            tabBar.backgroundColor = palette.cardBackground
            tabBar.barTintColor = palette.cardBackground
            tabBar.isTranslucent = false
            tabBar.setNeedsLayout()
        }

        view.subviews.forEach {
            updateBars(in: $0, navAppearance: navAppearance, tabAppearance: tabAppearance, palette: palette)
        }
    }
}

private extension UIColor {
    convenience init(hex: UInt32, alpha: CGFloat = 1) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255.0,
            green: CGFloat((hex >> 8) & 0xFF) / 255.0,
            blue: CGFloat(hex & 0xFF) / 255.0,
            alpha: alpha
        )
    }
}

struct PrimaryPillButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 16, weight: .semibold, design: .rounded))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                LinearGradient(
                    colors: [
                        HayameTheme.brandBlue.opacity(configuration.isPressed ? 0.8 : 1),
                        HayameTheme.primaryButtonEnd.opacity(configuration.isPressed ? 0.86 : 1)
                    ],
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
                    .stroke(HayameTheme.cardStroke, lineWidth: 1)
            )
            .shadow(color: HayameTheme.cardShadow, radius: 10, x: 0, y: 4)
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

    func hayameNavigationChrome(colorScheme: ColorScheme) -> some View {
        self
            .toolbarBackground(HayameTheme.pageBackground, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarColorScheme(colorScheme, for: .navigationBar)
            .toolbarBackground(HayameTheme.cardBackground, for: .tabBar)
            .toolbarBackground(.visible, for: .tabBar)
            .toolbarColorScheme(colorScheme, for: .tabBar)
    }
}

struct HayameBottomTabItem<Selection: Hashable>: Identifiable {
    let id: Selection
    let title: String
    let systemImage: String
    let badgeCount: Int

    init(id: Selection, title: String, systemImage: String, badgeCount: Int = 0) {
        self.id = id
        self.title = title
        self.systemImage = systemImage
        self.badgeCount = badgeCount
    }
}

/// Floating glass navigation bar shared by the renter, host, and admin shells.
///
/// The bar renders as a detached, rounded "pill" that floats above the page
/// background with side margins, a translucent material fill, a hairline
/// border, and a soft shadow. All colors and the material adapt automatically
/// to light/dark mode through `HayameTheme`. The selected tab is marked with a
/// single pill indicator that slides between tabs via `matchedGeometryEffect`.
///
/// The component reserves its own height wherever it is hosted (inside a
/// `VStack` or a `.safeAreaInset(edge: .bottom)`), so page content is never
/// drawn underneath the floating bar.
struct HayameBottomTabBar<Selection: Hashable>: View {
    @Binding var selection: Selection
    let items: [HayameBottomTabItem<Selection>]

    @Namespace private var indicatorNamespace

    var body: some View {
        HStack(spacing: 2) {
            ForEach(items) { item in
                tabButton(for: item)
            }
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 6)
        .background(floatingBackground)
        .padding(.horizontal, 16)
        .padding(.top, 6)
        .padding(.bottom, 4)
        // Keep the floating bar visually clear of whatever it floats over so the
        // page background shows through its side margins in both color schemes.
        .background(Color.clear)
    }

    private func tabButton(for item: HayameBottomTabItem<Selection>) -> some View {
        let selected = item.id == selection
        return Button {
            guard selection != item.id else { return }
            UIImpactFeedbackGenerator(style: .soft).impactOccurred()
            withAnimation(.spring(response: 0.32, dampingFraction: 0.74)) {
                selection = item.id
            }
        } label: {
            VStack(spacing: 3) {
                Image(systemName: item.systemImage)
                    .font(.system(size: 20, weight: selected ? .semibold : .regular))
                    .symbolVariant(selected ? .fill : .none)
                    .frame(height: 24)
                    .overlay(alignment: .topTrailing) { badge(for: item) }

                Text(item.title)
                    .font(.system(size: 10, weight: selected ? .bold : .semibold, design: .rounded))
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
            .foregroundStyle(selected ? HayameTheme.brandBlue : HayameTheme.mutedText)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 7)
            .background {
                if selected {
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(HayameTheme.brandLight)
                        .matchedGeometryEffect(id: "hayameTabIndicator", in: indicatorNamespace)
                }
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(item.title)
        .accessibilityAddTraits(selected ? [.isButton, .isSelected] : .isButton)
    }

    @ViewBuilder
    private func badge(for item: HayameBottomTabItem<Selection>) -> some View {
        if item.badgeCount > 0 {
            Text(item.badgeCount > 99 ? "99+" : "\(item.badgeCount)")
                .font(.system(size: 9, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .padding(.horizontal, 4)
                .padding(.vertical, 1.5)
                .background(HayameTheme.danger, in: Capsule())
                .offset(x: 10, y: -7)
        }
    }

    private var floatingBackground: some View {
        Capsule(style: .continuous)
            .fill(.ultraThinMaterial)
            .overlay(
                Capsule(style: .continuous)
                    .fill(HayameTheme.floatingControlBackground)
            )
            .overlay(
                Capsule(style: .continuous)
                    .strokeBorder(HayameTheme.controlStroke, lineWidth: 1)
            )
            .shadow(color: HayameTheme.cardShadow, radius: 20, x: 0, y: 10)
    }
}

import SwiftUI
import UIKit

enum AuthTab: Int, CaseIterable, Identifiable {
    case login, signup
    var id: Int { rawValue }
    var label: String { self == .login ? "Log in" : "Sign up" }
}

struct AuthScaffold<Content: View>: View {
    let title: String
    let subtitle: String
    let selectedTab: AuthTab
    let onTabChange: (AuthTab) -> Void
    @ViewBuilder let content: () -> Content

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                VStack(spacing: 14) {
                    Image("hayame_logo_white")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 118)

                    HStack(spacing: 0) {
                        ForEach(AuthTab.allCases) { tab in
                            Button {
                                onTabChange(tab)
                            } label: {
                                Text(tab.label)
                                    .font(.system(size: 14, weight: .semibold, design: .rounded))
                                    .foregroundStyle(selectedTab == tab
                                        ? Color(red: 0.039, green: 0.169, blue: 0.329)
                                        : .white.opacity(0.70))
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 9)
                                    .background(selectedTab == tab ? Color.white : Color.clear)
                                    .clipShape(Capsule())
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(3)
                    .background(.white.opacity(0.18))
                    .clipShape(Capsule())
                    .padding(.horizontal, 24)
                }
                .padding(.top, 76)
                .padding(.bottom, 26)
                .frame(maxWidth: .infinity)
                .background(Color(red: 0.078, green: 0.518, blue: 0.851))

                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(title)
                            .font(.system(size: 22, weight: .bold, design: .rounded))
                            .foregroundStyle(Color(red: 0.039, green: 0.169, blue: 0.329))
                        Text(subtitle)
                            .font(.system(size: 13, weight: .medium, design: .rounded))
                            .foregroundStyle(Color(red: 0.451, green: 0.490, blue: 0.569))
                    }

                    content()
                }
                .padding(24)
                .background(Color.white)
            }
        }
        .scrollDismissesKeyboard(.interactively)
        .onTapGesture {
            UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
        }
        .background(Color(red: 0.969, green: 0.980, blue: 1.000))
        .ignoresSafeArea(edges: .top)
    }
}

struct AuthField: View {
    let label: String
    let placeholder: String
    @Binding var text: String
    var keyboardType: UIKeyboardType = .default
    @FocusState private var focused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundStyle(Color(red: 0.039, green: 0.169, blue: 0.329))
            TextField(placeholder, text: $text)
                .keyboardType(keyboardType)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .focused($focused)
                .padding(.horizontal, 14)
                .padding(.vertical, 13)
                .background(focused ? Color.white : Color(red: 0.969, green: 0.980, blue: 1.0))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(focused
                            ? Color(red: 0.078, green: 0.518, blue: 0.851)
                            : Color(red: 0.878, green: 0.918, blue: 0.973),
                            lineWidth: 1.5)
                )
        }
    }
}

struct AuthSecureField: View {
    let label: String
    @Binding var text: String
    @Binding var isVisible: Bool
    @FocusState private var focused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundStyle(Color(red: 0.039, green: 0.169, blue: 0.329))
            HStack {
                Group {
                    if isVisible {
                        TextField("••••••••", text: $text)
                    } else {
                        SecureField("••••••••", text: $text)
                    }
                }
                .focused($focused)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                Button(isVisible ? "Hide" : "Show") { isVisible.toggle() }
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(Color(red: 0.078, green: 0.518, blue: 0.851))
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            .background(focused ? Color.white : Color(red: 0.969, green: 0.980, blue: 1.0))
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(focused
                        ? Color(red: 0.078, green: 0.518, blue: 0.851)
                        : Color(red: 0.878, green: 0.918, blue: 0.973),
                        lineWidth: 1.5)
            )
        }
    }
}

struct AuthSelectField: View {
    let label: String
    @Binding var selected: String
    let options: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundStyle(Color(red: 0.039, green: 0.169, blue: 0.329))
            Menu {
                ForEach(options, id: \.self) { opt in
                    Button(opt) { selected = opt }
                }
            } label: {
                HStack {
                    Text(selected.isEmpty ? "Select" : selected)
                        .font(.system(size: 13, design: .rounded))
                        .foregroundStyle(selected.isEmpty
                            ? Color(red: 0.451, green: 0.490, blue: 0.569)
                            : Color(red: 0.039, green: 0.169, blue: 0.329))
                        .lineLimit(1)
                    Spacer()
                    Image(systemName: "chevron.down")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(Color(red: 0.451, green: 0.490, blue: 0.569))
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 13)
                .background(Color(red: 0.969, green: 0.980, blue: 1.0))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(Color(red: 0.878, green: 0.918, blue: 0.973), lineWidth: 1.5)
                )
            }
        }
    }
}

struct AuthPrimaryButton: View {
    let title: String
    let action: () -> Void
    var isLoading = false
    var isDisabled = false

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if isLoading {
                    ProgressView().tint(.white)
                }
                Text(title)
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
            .background(Color(red: 0.078, green: 0.518, blue: 0.851))
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
        .disabled(isDisabled)
        .opacity(isDisabled ? 0.65 : 1)
    }
}

struct AuthGuestButton: View {
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            Text("Continue as guest")
                .font(.system(size: 14, weight: .medium, design: .rounded))
                .foregroundStyle(Color(red: 0.039, green: 0.169, blue: 0.329))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 13)
                .background(Color.white)
                .clipShape(Capsule())
                .overlay(Capsule().stroke(Color(red: 0.816, green: 0.871, blue: 0.941), lineWidth: 1.5))
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 24)
        .padding(.vertical, 20)
        .background(Color(red: 0.969, green: 0.980, blue: 1.0))
    }
}

struct AuthBiometricButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: "faceid")
                Text(title)
            }
            .font(.system(size: 14, weight: .semibold, design: .rounded))
            .foregroundStyle(Color(red: 0.039, green: 0.169, blue: 0.329))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 13)
            .background(Color.white)
            .clipShape(Capsule())
            .overlay(Capsule().stroke(Color(red: 0.816, green: 0.871, blue: 0.941), lineWidth: 1.5))
        }
        .buttonStyle(.plain)
    }
}

import SwiftUI

// MARK: - Delete account
//
// App Review Guideline 5.1.1(v): account deletion can be started inside the
// app. The request goes to the server (`POST /api/account/deletion-request`);
// the team closes the account within 30 days, so nothing is removed on the
// phone except the session: the user is signed out once they have read the
// confirmation.

/// The quiet "Delete account" link shown under Sign out. Owns its own sheet so
/// any screen can drop it in.
struct DeleteAccountLink: View {
    @EnvironmentObject private var appState: AppState
    @State private var showSheet = false

    var body: some View {
        Button {
            HayameHaptics.light()
            showSheet = true
        } label: {
            Text("Delete account")
                .font(.hayame(size: 13, weight: .semibold))
                .foregroundStyle(HayameTheme.danger.opacity(0.9))
                .padding(.horizontal, 16)
                .frame(minHeight: 44)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityHint("Explains what is deleted and asks you to confirm")
        .sheet(isPresented: $showSheet) {
            DeleteAccountSheet()
                .environmentObject(appState)
        }
    }
}

struct DeleteAccountSheet: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss
    /// Follows the phone's text size setting; the app face itself is fixed-size.
    @ScaledMetric(relativeTo: .body) private var typeScale: CGFloat = 1

    @State private var isSubmitting = false
    @State private var errorMessage: String?
    /// Set once the server has the request: the confirmation replaces the form.
    @State private var result: AccountDeletionResult?

    private var scale: CGFloat { min(max(typeScale, 0.9), 1.5) }

    /// A deeper red than `HayameTheme.danger` (which turns coral in dark
    /// mode), so the white label stays easy to read in both appearances.
    private static let destructiveFill = Color(red: 0.78, green: 0.18, blue: 0.20)

    private static let facts: [(icon: String, text: String)] = [
        ("calendar", "Your account and personal information are deleted within 30 days."),
        ("doc.text", "Records of past payments are kept for as long as the law requires."),
        ("car", "If you have a trip in progress or money owing, your account is closed once that is settled."),
        ("arrow.uturn.backward.circle", "This cannot be undone. To use Hayame again you would need a new account.")
    ]

    var body: some View {
        VStack(spacing: 0) {
            if let result {
                confirmation(result)
                    .transition(.opacity)
            } else {
                request
                    .transition(.opacity)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(HayameTheme.pageBackground.ignoresSafeArea())
        // After the request is in, Done (which signs out) is the only way on.
        .interactiveDismissDisabled(isSubmitting || result != nil)
        #if DEBUG
        .onAppear {
            if AppState.isScreenshotMode, ScreenshotRoute.current == .deleteAccountDone {
                result = .screenshotFixture
            }
        }
        #endif
    }

    // MARK: Asking

    private var request: some View {
        VStack(spacing: 0) {
            HStack {
                Spacer()
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "xmark")
                        .font(.hayame(size: 13, weight: .bold))
                        .foregroundStyle(HayameTheme.mutedText)
                        .frame(width: 32, height: 32)
                        .background(HayameTheme.subtleFill, in: Circle())
                        .frame(width: 44, height: 44)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .disabled(isSubmitting)
                .accessibilityLabel("Close")
            }
            .padding(.horizontal, 10)
            .padding(.top, 8)

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    VStack(alignment: .leading, spacing: 14) {
                        Image(systemName: "person.crop.circle.badge.xmark")
                            .font(.hayame(size: 24, weight: .semibold))
                            .foregroundStyle(HayameTheme.danger)
                            .frame(width: 56, height: 56)
                            .background(HayameTheme.danger.opacity(0.14), in: Circle())
                            .accessibilityHidden(true)

                        Text("Delete your account?")
                            .font(.hayame(size: 26 * scale, weight: .bold))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .fixedSize(horizontal: false, vertical: true)
                            .accessibilityAddTraits(.isHeader)

                        Text("We will be sorry to see you go. Here is what happens when you ask us to delete your account.")
                            .font(.hayame(size: 15 * scale, weight: .regular))
                            .foregroundStyle(HayameTheme.brandNavy.opacity(0.84))
                            .lineSpacing(5 * scale)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    VStack(alignment: .leading, spacing: 0) {
                        ForEach(Array(Self.facts.enumerated()), id: \.offset) { index, fact in
                            if index > 0 {
                                Rectangle()
                                    .fill(HayameTheme.cardStroke)
                                    .frame(height: 1)
                                    .padding(.leading, 54)
                            }
                            HStack(alignment: .top, spacing: 14) {
                                Image(systemName: fact.icon)
                                    .font(.hayame(size: 15 * min(scale, 1.2), weight: .semibold))
                                    .foregroundStyle(HayameTheme.mutedText)
                                    .frame(width: 24)
                                    .padding(.top, 2)
                                    .accessibilityHidden(true)
                                Text(fact.text)
                                    .font(.hayame(size: 14.5 * scale, weight: .medium))
                                    .foregroundStyle(HayameTheme.brandNavy)
                                    .lineSpacing(4 * scale)
                                    .fixedSize(horizontal: false, vertical: true)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 15)
                        }
                    }
                    .background(HayameTheme.cardBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .strokeBorder(HayameTheme.cardStroke, lineWidth: 1)
                    )

                    if !appState.currentUser.email.isEmpty {
                        Text("Signed in as \(appState.currentUser.email)")
                            .font(.hayame(size: 13 * scale, weight: .medium))
                            .foregroundStyle(HayameTheme.mutedText)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.horizontal, 4)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 20)
                .padding(.top, 6)
                .padding(.bottom, 24)
            }

            VStack(spacing: 10) {
                if let errorMessage {
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "exclamationmark.circle.fill")
                            .font(.hayame(size: 14 * scale, weight: .semibold))
                        Text(errorMessage)
                            .font(.hayame(size: 13 * scale, weight: .semibold))
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .foregroundStyle(HayameTheme.danger)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.bottom, 4)
                    .transition(.opacity)
                }

                Button {
                    Task { await submit() }
                } label: {
                    HStack(spacing: 10) {
                        if isSubmitting {
                            ProgressView()
                                .tint(.white)
                        }
                        Text(isSubmitting ? "Sending your request..." : "Delete my account")
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .buttonStyle(DeleteAccountPillStyle(fill: Self.destructiveFill, foreground: .white))
                .disabled(isSubmitting)
                .accessibilityLabel(isSubmitting ? "Sending your request" : "Delete my account")

                Button {
                    dismiss()
                } label: {
                    Text("Cancel")
                }
                .buttonStyle(DeleteAccountPillStyle(fill: HayameTheme.subtleFill, foreground: HayameTheme.brandNavy))
                .disabled(isSubmitting)
            }
            .padding(.horizontal, 20)
            .padding(.top, 14)
            .padding(.bottom, 12)
            .background(HayameTheme.pageBackground)
            .overlay(alignment: .top) {
                Rectangle()
                    .fill(HayameTheme.cardStroke)
                    .frame(height: 1)
            }
            .animation(HayameMotion.fade, value: errorMessage)
        }
    }

    // MARK: Received

    private func confirmation(_ result: AccountDeletionResult) -> some View {
        VStack(spacing: 0) {
            GeometryReader { viewport in
                ScrollView {
                    VStack(spacing: 16) {
                        HayameSuccessCheck(size: 76)
                            .padding(.bottom, 6)
                            .accessibilityHidden(true)

                        Text("Request received")
                            .font(.hayame(size: 26 * scale, weight: .bold))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)
                            .accessibilityAddTraits(.isHeader)

                        Text(result.message)
                            .font(.hayame(size: 15 * scale, weight: .regular))
                            .foregroundStyle(HayameTheme.brandNavy.opacity(0.84))
                            .lineSpacing(5 * scale)
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)

                        Text("You will be signed out of this phone when you tap Done.")
                            .font(.hayame(size: 13 * scale, weight: .medium))
                            .foregroundStyle(HayameTheme.mutedText)
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.top, 4)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.horizontal, 28)
                    .padding(.vertical, 24)
                    // Centred in the sheet; scrolls only at very large text sizes.
                    .frame(minHeight: viewport.size.height)
                }
            }

            Button {
                HayameHaptics.medium()
                dismiss()
                appState.signOut()
            } label: {
                Text("Done")
            }
            .buttonStyle(DeleteAccountPillStyle(fill: HayameTheme.brandBlue, foreground: .white))
            .padding(.horizontal, 20)
            .padding(.top, 14)
            .padding(.bottom, 12)
        }
    }

    // MARK: Action

    private func submit() async {
        guard !isSubmitting else { return }
        isSubmitting = true
        errorMessage = nil
        defer { isSubmitting = false }
        let fallback = "We couldn't send your request. Please try again or email support@hayamegh.com."
        do {
            let received = try await appState.requestAccountDeletion()
            HayameHaptics.success()
            withAnimation(HayameMotion.fade) { result = received }
        } catch {
            HayameHaptics.error()
            let message = AppState.userFacingMessage(error, fallback: fallback)
            errorMessage = message.isEmpty ? fallback : message
        }
    }
}

/// Flat, full-width pill for the sheet's three actions.
private struct DeleteAccountPillStyle: ButtonStyle {
    let fill: Color
    let foreground: Color
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.hayame(size: 16, weight: .semibold))
            .foregroundStyle(foreground)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .padding(.horizontal, 20)
            .frame(minHeight: 52)
            .background(fill.opacity(configuration.isPressed ? 0.82 : 1), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .contentShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .opacity(isEnabled ? 1 : 0.7)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(HayameMotion.snappy, value: configuration.isPressed)
    }
}

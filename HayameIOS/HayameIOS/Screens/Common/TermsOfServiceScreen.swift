import SwiftUI

// MARK: - Terms of Service
//
// The text lives on the server (one copy for web, iOS and Android) and is held
// in `AppState.termsDocument`. The same screen is used two ways:
//
// - `.agreement`: covers the app until a signed-in user accepts the current
//   version (`AppState.mustAcceptTerms`). No way out except Accept or Sign out.
// - `.readOnly`: pushed from More / Settings / Profile, or shown in a sheet
//   from the sign-up form. No Accept button.

enum TermsScreenMode {
    case agreement
    case readOnly
}

struct TermsOfServiceScreen: View {
    @EnvironmentObject private var appState: AppState
    let mode: TermsScreenMode

    @State private var isLoading = false
    @State private var hasAttemptedLoad = false
    @State private var isAccepting = false
    @State private var acceptError: String?
    /// True once the end of the text (the buttons) has scrolled into view.
    @State private var reachedEnd = true
    @State private var showSignOutConfirm = false
    /// Follows the phone's text size setting; the app face itself is fixed-size.
    @ScaledMetric(relativeTo: .body) private var typeScale: CGFloat = 1

    private static let scrollSpace = "hayame.terms.scroll"

    private enum Anchor: Hashable {
        case top
        case bottom
    }

    /// Reading text grows with the text size setting, within sane limits.
    private var bodyScale: CGFloat { min(max(typeScale, 0.9), 2.0) }
    /// The fixed header grows less, so it never crowds out the text.
    private var headerScale: CGFloat { min(max(typeScale, 0.9), 1.3) }

    private var document: TermsDocument? {
        guard let document = appState.termsDocument, !document.sections.isEmpty else { return nil }
        return document
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            header

            Rectangle()
                .fill(HayameTheme.controlStroke)
                .frame(height: 1)
                .frame(maxWidth: .infinity)

            if let document {
                termsBody(document)
            } else if isLoading || !hasAttemptedLoad {
                loadingState
            } else {
                errorState
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(HayameTheme.pageBackground.ignoresSafeArea())
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadIfNeeded() }
        .confirmationDialog("Sign out of Hayame?", isPresented: $showSignOutConfirm, titleVisibility: .visible) {
            Button("Sign out", role: .destructive) { appState.signOut() }
            Button("Stay signed in", role: .cancel) {}
        } message: {
            Text("You can sign back in at any time. You will be asked to accept the terms then.")
        }
    }

    // MARK: Header

    private var header: some View {
        VStack(alignment: .leading, spacing: 6 * headerScale) {
            HStack(alignment: .firstTextBaseline, spacing: 12) {
                Text("AGREEMENT")
                    .font(.hayame(size: 11 * headerScale, weight: .bold))
                    .tracking(2.2)
                    .foregroundStyle(HayameTheme.mutedText)

                Spacer(minLength: 8)

                if mode == .agreement {
                    Button("Sign out") { showSignOutConfirm = true }
                        .font(.hayame(size: 13 * headerScale, weight: .semibold))
                        .foregroundStyle(HayameTheme.mutedText)
                        .buttonStyle(.plain)
                        .disabled(isAccepting)
                        .accessibilityHint("Leaves without accepting the terms")
                }
            }

            Text(document?.title ?? "Terms of Service")
                .font(.hayame(size: 28 * headerScale, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.isHeader)

            if let lastUpdated = document?.lastUpdated, !lastUpdated.isEmpty {
                Text("Last updated on \(lastUpdated)")
                    .font(.hayame(size: 13 * headerScale, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.top, mode == .agreement ? 22 : 6)
        .padding(.bottom, 18)
    }

    // MARK: Text

    private func termsBody(_ document: TermsDocument) -> some View {
        ScrollViewReader { proxy in
            GeometryReader { viewport in
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        Color.clear
                            .frame(height: 1)
                            .id(Anchor.top)

                        ForEach(document.sections) { section in
                            sectionView(section)
                                .padding(.bottom, 34)
                        }

                        footer(document, proxy: proxy)
                            .background {
                                GeometryReader { geometry in
                                    Color.clear.preference(
                                        key: TermsFooterTopKey.self,
                                        value: geometry.frame(in: .named(Self.scrollSpace)).minY
                                    )
                                }
                            }

                        Color.clear
                            .frame(height: 1)
                            .id(Anchor.bottom)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 20)
                    .padding(.top, 22)
                    .padding(.bottom, 28)
                }
                .coordinateSpace(name: Self.scrollSpace)
                .scrollIndicators(.visible)
                .scrollIndicatorsFlash(onAppear: true)
                .refreshable {
                    await appState.refreshTermsOfService(force: true, allowSignedOut: true)
                }
                .onPreferenceChange(TermsFooterTopKey.self) { footerTop in
                    // The buttons at the end have started to show.
                    let reached = footerTop < viewport.size.height - 28
                    guard reached != reachedEnd else { return }
                    withAnimation(HayameMotion.fade) { reachedEnd = reached }
                }
                .overlay(alignment: .bottom) {
                    if !reachedEnd {
                        scrollToBottomControl(proxy, bottomInset: viewport.safeAreaInsets.bottom)
                            .transition(.opacity)
                    }
                }
                .onChange(of: document.version) { _, _ in
                    // New text arrived (the old version was no longer current).
                    proxy.scrollTo(Anchor.top, anchor: .top)
                }
                #if DEBUG
                .task {
                    // Screenshot runs can't scroll: jump to the end when asked.
                    guard ProcessInfo.processInfo.arguments.contains("-HAYAME_TERMS_SCROLL_END") else { return }
                    try? await Task.sleep(nanoseconds: 600_000_000)
                    proxy.scrollTo(Anchor.bottom, anchor: .bottom)
                }
                #endif
            }
        }
    }

    private func sectionView(_ section: TermsSection) -> some View {
        VStack(alignment: .leading, spacing: 18) {
            if !section.title.isEmpty {
                Text(section.title)
                    .font(.hayame(size: 18 * bodyScale, weight: .semibold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityAddTraits(.isHeader)
            }

            ForEach(Array(section.paragraphs.enumerated()), id: \.offset) { _, paragraph in
                Text(paragraph)
                    .font(.hayame(size: 15 * bodyScale, weight: .regular))
                    .foregroundStyle(HayameTheme.brandNavy.opacity(0.86))
                    .lineSpacing(6 * bodyScale)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: End of the text

    private func footer(_ document: TermsDocument, proxy: ScrollViewProxy) -> some View {
        VStack(spacing: 14) {
            if mode == .agreement {
                if let acceptError {
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "exclamationmark.circle.fill")
                            .font(.hayame(size: 14 * bodyScale, weight: .semibold))
                        Text(acceptError)
                            .font(.hayame(size: 13 * bodyScale, weight: .semibold))
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .foregroundStyle(HayameTheme.danger)
                    .frame(maxWidth: 340, alignment: .leading)
                    .transition(.opacity)
                }

                Button {
                    Task { await accept() }
                } label: {
                    HStack(spacing: 10) {
                        if isAccepting {
                            ProgressView()
                                .tint(.white)
                        }
                        Text(isAccepting ? "Saving..." : "Accept & Continue")
                            .font(.hayame(size: 16 * min(bodyScale, 1.5), weight: .semibold))
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(TermsFilledPillStyle())
                .frame(maxWidth: 340)
                .disabled(isAccepting)
            } else if document.accepted == true {
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.hayame(size: 15 * bodyScale, weight: .semibold))
                        .foregroundStyle(HayameTheme.success)
                    Text(acceptedNote(document))
                        .font(.hayame(size: 14 * bodyScale, weight: .semibold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(.bottom, 4)
            }

            Button {
                withAnimation(.easeInOut(duration: 0.45)) {
                    proxy.scrollTo(Anchor.top, anchor: .top)
                }
            } label: {
                Text("Scroll to Top")
                    .font(.hayame(size: 14 * min(bodyScale, 1.5), weight: .semibold))
                    .fixedSize(horizontal: false, vertical: true)
            }
            .buttonStyle(TermsOutlinePillStyle())
            .disabled(isAccepting)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 4)
        .animation(HayameMotion.fade, value: acceptError)
    }

    private func scrollToBottomControl(_ proxy: ScrollViewProxy, bottomInset: CGFloat) -> some View {
        ZStack(alignment: .bottom) {
            // The fade runs on under the home indicator, where the text would
            // otherwise show through below the button.
            VStack(spacing: 0) {
                LinearGradient(
                    colors: [HayameTheme.pageBackground.opacity(0), HayameTheme.pageBackground],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(height: 120)
                HayameTheme.pageBackground
                    .frame(height: 16 + bottomInset)
            }
            .offset(y: bottomInset)
            .allowsHitTesting(false)

            Button {
                withAnimation(.easeInOut(duration: 0.45)) {
                    proxy.scrollTo(Anchor.bottom, anchor: .bottom)
                }
            } label: {
                Text("Scroll to Bottom")
                    .font(.hayame(size: 14 * min(bodyScale, 1.5), weight: .semibold))
                    .fixedSize(horizontal: false, vertical: true)
            }
            .buttonStyle(TermsOutlinePillStyle())
            .padding(.bottom, 14)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: Loading and error

    private var loadingState: some View {
        VStack(spacing: 14) {
            ProgressView()
                .tint(HayameTheme.brandBlue)
            Text("Loading the terms...")
                .font(.hayame(size: 14 * bodyScale, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(24)
    }

    private var errorState: some View {
        ScrollView {
            VStack(spacing: 14) {
                Image(systemName: "wifi.exclamationmark")
                    .font(.hayame(size: 30, weight: .semibold))
                    .foregroundStyle(HayameTheme.mutedText)

                Text("We couldn't load the Terms of Service")
                    .font(.hayame(size: 17 * bodyScale, weight: .semibold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)

                Text("Check your connection and try again.")
                    .font(.hayame(size: 14 * bodyScale, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)

                Button {
                    Task { await load() }
                } label: {
                    Text("Retry")
                        .font(.hayame(size: 14 * min(bodyScale, 1.5), weight: .semibold))
                }
                .buttonStyle(TermsOutlinePillStyle())
                .padding(.top, 6)
            }
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 28)
            .padding(.top, 72)
            .padding(.bottom, 28)
        }
        .refreshable { await load() }
    }

    // MARK: Actions

    private func loadIfNeeded() async {
        if document != nil {
            hasAttemptedLoad = true
            // Already on screen: quietly pick up a newer version if there is one.
            if mode == .readOnly {
                await appState.refreshTermsOfService(allowSignedOut: true)
            }
            return
        }
        await load()
    }

    private func load() async {
        guard !isLoading else { return }
        isLoading = true
        await appState.refreshTermsOfService(force: true, allowSignedOut: true)
        isLoading = false
        hasAttemptedLoad = true
    }

    private func accept() async {
        guard !isAccepting else { return }
        isAccepting = true
        acceptError = nil
        defer { isAccepting = false }
        do {
            try await appState.acceptTerms()
            HayameHaptics.success()
        } catch {
            HayameHaptics.error()
            let fallback = "We couldn't save your acceptance. Please try again."
            if let apiError = error as? APIError {
                acceptError = apiError.isTermsOutdated ? apiError.message : fallback
            } else {
                let message = AppState.userFacingMessage(error, fallback: fallback)
                acceptError = message.isEmpty ? fallback : message
            }
        }
    }

    private func acceptedNote(_ document: TermsDocument) -> String {
        guard let date = document.acceptedAt else { return "You have accepted these terms." }
        return "You accepted these terms on \(Self.acceptedDateFormatter.string(from: date))."
    }

    /// Same shape as the server's "Last updated" date, e.g. "10 November 2026".
    private static let acceptedDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_GB")
        formatter.dateFormat = "d MMMM yyyy"
        return formatter
    }()
}

/// Where the end-of-text buttons start, in the scroll view's own space.
private struct TermsFooterTopKey: PreferenceKey {
    static var defaultValue: CGFloat = .greatestFiniteMagnitude
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = min(value, nextValue())
    }
}

// MARK: - Buttons (flat pills)

private struct TermsFilledPillStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(.white)
            .padding(.vertical, 15)
            .padding(.horizontal, 28)
            .frame(minHeight: 52)
            .background(Capsule().fill(HayameTheme.brandBlue.opacity(configuration.isPressed ? 0.82 : 1)))
            .contentShape(Capsule())
            .opacity(isEnabled ? 1 : 0.75)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(HayameMotion.snappy, value: configuration.isPressed)
    }
}

private struct TermsOutlinePillStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(HayameTheme.brandNavy)
            .padding(.vertical, 12)
            .padding(.horizontal, 26)
            .frame(minHeight: 44)
            .background(Capsule().fill(HayameTheme.pageBackground))
            .overlay(Capsule().strokeBorder(HayameTheme.brandNavy.opacity(0.55), lineWidth: 1.2))
            .contentShape(Capsule())
            .opacity(isEnabled ? (configuration.isPressed ? 0.7 : 1) : 0.5)
            .animation(HayameMotion.snappy, value: configuration.isPressed)
    }
}

// MARK: - Presentation helpers

/// The read-only terms in a sheet, for places with no navigation stack (the
/// sign-up form).
struct TermsOfServiceSheet: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            TermsOfServiceScreen(mode: .readOnly)
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button {
                            dismiss()
                        } label: {
                            Image(systemName: "xmark")
                                .font(.hayame(size: 13, weight: .bold))
                                .foregroundStyle(HayameTheme.mutedText)
                                .frame(width: 30, height: 30)
                                .background(HayameTheme.subtleFill)
                                .clipShape(Circle())
                        }
                        .accessibilityLabel("Close")
                    }
                }
        }
    }
}

extension View {
    /// Puts the agreement over a sheet while the user must accept the terms.
    /// The app root shows its own cover, but that sits underneath any sheet;
    /// sheets where a booking can be made add this so the agreement is seen
    /// there too (for example when the server answers `terms_required`).
    func termsAgreementCover() -> some View {
        modifier(TermsAgreementCoverModifier())
    }
}

private struct TermsAgreementCoverModifier: ViewModifier {
    @EnvironmentObject private var appState: AppState

    func body(content: Content) -> some View {
        content.fullScreenCover(
            isPresented: Binding(
                get: { appState.mustAcceptTerms },
                set: { _ in }
            )
        ) {
            TermsOfServiceScreen(mode: .agreement)
                .environmentObject(appState)
                .interactiveDismissDisabled()
        }
    }
}

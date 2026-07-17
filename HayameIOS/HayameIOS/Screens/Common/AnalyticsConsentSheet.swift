import SwiftUI

/// Asks once whether we may measure how the app is used.
///
/// This is NOT Apple's App Tracking Transparency prompt, and it must not be
/// confused with one — Hayame does no cross-app tracking, so there is nothing
/// for ATT to gate. This covers our own first-party product analytics.
///
/// Deliberate choices, same as the web banner:
///   * "No thanks" is as prominent as "Allow". A reject option that is harder
///     to reach than accept is the pattern regulators fine people for.
///   * It cannot be swiped away without choosing — dismissal is not consent.
///   * It says what we collect and what we do not, in plain words.
struct AnalyticsConsentSheet: View {
    @Environment(\.dismiss) private var dismiss
    let onDecision: (AnalyticsService.Consent) -> Void

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Image(systemName: "chart.bar.xaxis")
                        .font(.system(size: 40, weight: .semibold))
                        .foregroundStyle(HayameTheme.brandBlue)
                        .padding(.top, 8)

                    Text("Help us improve Hayame?")
                        .font(.title2.weight(.bold))

                    Text("We'd like to measure how people search and book, so we can fix what's broken and list the cars you're actually looking for.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    VStack(alignment: .leading, spacing: 12) {
                        bullet(
                            icon: "checkmark.circle.fill",
                            tint: .green,
                            text: "What we'd collect: which cars you view, what you search for, and where a booking gets stuck."
                        )
                        bullet(
                            icon: "xmark.circle.fill",
                            tint: .red,
                            text: "What we never do: track you across other apps or websites, sell your data, or use advertising trackers."
                        )
                        bullet(
                            icon: "hand.raised.fill",
                            tint: .blue,
                            text: "You can change this any time in Settings. Declining does not limit any feature."
                        )
                    }
                    .padding(.vertical, 4)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(24)
            }

            VStack(spacing: 12) {
                Button {
                    onDecision(.granted)
                    dismiss()
                } label: {
                    Text("Allow")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(HayameTheme.brandBlue)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }

                Button {
                    onDecision(.denied)
                    dismiss()
                } label: {
                    Text("No thanks")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.secondary.opacity(0.12))
                        .foregroundStyle(.primary)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 24)
        }
        // Tall enough that all three bullets are visible without scrolling —
        // "declining does not limit any feature" is the line that most needs to
        // be read, and .medium cut it off. SwiftUI clamps to .large on short
        // devices, and the buttons live outside the ScrollView so they stay put.
        .presentationDetents([.height(620), .large])
        .presentationDragIndicator(.hidden)
        .interactiveDismissDisabled(true)
    }

    private func bullet(icon: String, tint: Color, text: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon)
                .foregroundStyle(tint)
                .font(.system(size: 16))
            Text(text)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

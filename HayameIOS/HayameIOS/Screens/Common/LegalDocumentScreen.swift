import SwiftUI

// MARK: - Policy document (Protection, Cancellation, Privacy)
//
// One screen for the three question-and-answer documents. The text comes from
// the server through `LegalDocumentStore`, which also keeps the last copy on
// disk so a document opens at once and can be read offline.

struct LegalDocumentScreen: View {
    let kind: LegalDocumentKind

    @EnvironmentObject private var appState: AppState
    @ObservedObject private var store = LegalDocumentStore.shared
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    /// Follows the phone's text size setting; the app face itself is fixed-size.
    @ScaledMetric(relativeTo: .body) private var typeScale: CGFloat = 1

    @State private var searchText = ""
    /// Answers opened by hand (question ids).
    @State private var expanded: Set<String> = []
    /// While searching every match is open; these were closed by hand.
    @State private var closedWhileSearching: Set<String> = []
    @State private var isLoading = false
    @State private var hasAttemptedLoad = false
    @State private var analyticsEnabled = AnalyticsService.shared.hasConsent
    @FocusState private var searchFocused: Bool

    private enum Anchor: Hashable {
        case top
        case keyPoints
        case choices
        case table
        case questions
        case group(Int)
        case closing
    }

    /// Reading text grows with the text size setting, within sane limits.
    private var bodyScale: CGFloat { min(max(typeScale, 0.9), 1.8) }
    /// Headings and controls grow less, so they never crowd out the text.
    private var headingScale: CGFloat { min(max(typeScale, 0.9), 1.3) }

    private var document: LegalDocument? { store.documents[kind] }

    /// Space above each part of the page (see `content`).
    private static let partTopSpace: CGFloat = 12

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    if let document {
                        content(document, proxy: proxy)
                    } else if isLoading || !hasAttemptedLoad {
                        LegalDocumentSkeleton()
                            .padding(.top, Self.partTopSpace)
                    } else {
                        errorState
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.bottom, 36)
            }
            .scrollDismissesKeyboard(.interactively)
            .refreshable { await load(force: true) }
            #if DEBUG
            .task(id: document != nil) {
                await applyScreenshotPreset(proxy)
            }
            #endif
        }
        .background(HayameTheme.pageBackground.ignoresSafeArea())
        .navigationTitle(kind.shortTitle)
        .navigationBarTitleDisplayMode(.inline)
        .hayameBarBackground()
        .task { await loadIfNeeded() }
        .onAppear { analyticsEnabled = AnalyticsService.shared.hasConsent }
        .onChange(of: searchText) { _, _ in closedWhileSearching = [] }
    }

    // MARK: Document

    @ViewBuilder
    private func content(_ document: LegalDocument, proxy: ScrollViewProxy) -> some View {
        // Each part carries its own space above, so a jump to it never lands
        // flush under the navigation bar.
        hero(document)
            .padding(.top, Self.partTopSpace)
            .id(Anchor.top)

        if !document.highlights.isEmpty {
            keyPoints(document.highlights)
                .padding(.top, Self.partTopSpace)
                .id(Anchor.keyPoints)
        }

        if let table = document.table {
            refundTable(table)
                .padding(.top, Self.partTopSpace)
                .id(Anchor.table)
        }

        if kind == .privacy {
            privacyChoices
                .padding(.top, Self.partTopSpace)
                .id(Anchor.choices)
        }

        questions(document, proxy: proxy)
            .padding(.top, Self.partTopSpace)
            .id(Anchor.questions)

        closing(document)
            .padding(.top, Self.partTopSpace)
            .id(Anchor.closing)
    }

    // MARK: Hero

    private func hero(_ document: LegalDocument) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            if !document.eyebrow.isEmpty {
                Text(document.eyebrow.uppercased())
                    .font(.hayame(size: 11 * headingScale, weight: .bold))
                    .tracking(2.2)
                    .foregroundStyle(HayameTheme.brandBlue)
            }

            Text(document.title)
                .font(.hayame(size: 30 * headingScale, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.isHeader)

            if !document.summary.isEmpty {
                Text(document.summary)
                    .font(.hayame(size: 15 * bodyScale, weight: .regular))
                    .foregroundStyle(HayameTheme.brandNavy.opacity(0.86))
                    .lineSpacing(5 * bodyScale)
                    .fixedSize(horizontal: false, vertical: true)
            }

            metaLine(document)
                .font(.hayame(size: 13 * headingScale, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .padding(.top, 2)
                .accessibilityElement(children: .combine)

            if store.refreshFailed.contains(kind) {
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "icloud.slash")
                        .font(.hayame(size: 13 * headingScale, weight: .semibold))
                    Text("Showing the copy saved on this phone. Pull down to check for a newer one.")
                        .font(.hayame(size: 13 * headingScale, weight: .medium))
                        .fixedSize(horizontal: false, vertical: true)
                }
                .foregroundStyle(HayameTheme.mutedText)
                .padding(.vertical, 10)
                .padding(.horizontal, 12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(HayameTheme.subtleFill, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .accessibilityElement(children: .combine)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 4)
    }

    /// "Last updated on <date> · <n> questions answered" on one line where it
    /// fits; otherwise the two facts sit on a line each, never broken mid-phrase.
    @ViewBuilder
    private func metaLine(_ document: LegalDocument) -> some View {
        let count = document.questionCount
        let answered = "\(count) \(count == 1 ? "question" : "questions") answered"
        if document.lastUpdated.isEmpty {
            Text(answered)
                .fixedSize(horizontal: false, vertical: true)
        } else {
            let updated = "Last updated on \(document.lastUpdated)"
            ViewThatFits(in: .horizontal) {
                Text("\(updated) · \(answered)")
                    .lineLimit(1)
                VStack(alignment: .leading, spacing: 3) {
                    Text(updated)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(answered)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    // MARK: Key points

    private func keyPoints(_ highlights: [LegalHighlight]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionTitle("Key points")

            VStack(spacing: 10) {
                ForEach(Array(highlights.enumerated()), id: \.offset) { index, highlight in
                    HStack(alignment: .top, spacing: 14) {
                        Text("\(index + 1)")
                            .font(.hayame(size: 14 * headingScale, weight: .bold))
                            .foregroundStyle(HayameTheme.brandBlue)
                            .frame(width: 30 * headingScale, height: 30 * headingScale)
                            .background(HayameTheme.brandBlue.opacity(0.14), in: Circle())
                            .accessibilityHidden(true)

                        VStack(alignment: .leading, spacing: 5) {
                            if !highlight.title.isEmpty {
                                Text(highlight.title)
                                    .font(.hayame(size: 16 * bodyScale, weight: .bold))
                                    .foregroundStyle(HayameTheme.brandNavy)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            if !highlight.body.isEmpty {
                                Text(highlight.body)
                                    .font(.hayame(size: 14 * bodyScale, weight: .regular))
                                    .foregroundStyle(HayameTheme.brandNavy.opacity(0.78))
                                    .lineSpacing(4 * bodyScale)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(16)
                    .legalCard()
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("Key point \(index + 1). \(highlight.title). \(highlight.body)")
                }
            }
        }
    }

    // MARK: Refund table

    private func refundTable(_ table: LegalTable) -> some View {
        // The first column names the row; the others are the outcomes.
        let outcomeNames = Array(table.columns.dropFirst())

        return VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 8) {
                sectionTitle(table.title.isEmpty ? "Refunds at a glance" : table.title)

                if !table.caption.isEmpty {
                    Text(table.caption)
                        .font(.hayame(size: 14 * bodyScale, weight: .regular))
                        .foregroundStyle(HayameTheme.mutedText)
                        .lineSpacing(4 * bodyScale)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.horizontal, 4)
                }
            }

            VStack(spacing: 10) {
                ForEach(Array(table.rows.enumerated()), id: \.offset) { _, row in
                    refundRowCard(row, outcomeNames: outcomeNames)
                }
            }
        }
    }

    private func refundRowCard(_ row: [String], outcomeNames: [String]) -> some View {
        let label = row.first ?? ""
        let values = Array(row.dropFirst())

        return VStack(alignment: .leading, spacing: 0) {
            Text(label)
                .font(.hayame(size: 17 * bodyScale, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, 16)
                .padding(.top, 15)
                .padding(.bottom, 13)
                .accessibilityAddTraits(.isHeader)

            Rectangle()
                .fill(HayameTheme.cardStroke)
                .frame(height: 1)

            VStack(alignment: .leading, spacing: 14) {
                ForEach(Array(values.enumerated()), id: \.offset) { index, value in
                    let style = RefundOutcomeStyle(index: index, total: values.count)
                    let applies = Self.outcomeApplies(value)

                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: style.systemImage)
                            .font(.hayame(size: 17 * headingScale, weight: .semibold))
                            .foregroundStyle(applies ? style.tint : HayameTheme.mutedText.opacity(0.55))
                            .frame(width: 22 * headingScale)
                            .padding(.top, 1)
                            .accessibilityHidden(true)

                        VStack(alignment: .leading, spacing: 3) {
                            if outcomeNames.indices.contains(index) {
                                Text(outcomeNames[index])
                                    .font(.hayame(size: 12.5 * bodyScale, weight: .semibold))
                                    .foregroundStyle(HayameTheme.mutedText)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            Text(value)
                                .font(.hayame(size: 15 * bodyScale, weight: applies ? .semibold : .medium))
                                .foregroundStyle(applies ? HayameTheme.brandNavy : HayameTheme.mutedText)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .accessibilityElement(children: .combine)
                }
            }
            .padding(16)
        }
        .legalCard()
    }

    /// "Does not apply" cells are shown quietly so the real outcomes stand out.
    private static func outcomeApplies(_ value: String) -> Bool {
        let normalized = value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        return !["does not apply", "not applicable", "n/a", "none", "-", ""].contains(normalized)
    }

    // MARK: Privacy choices

    private var privacyChoices: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionTitle("Your privacy choices")

            VStack(spacing: 0) {
                // App Review Guideline 5.1.1(ii): an easy, understandable way
                // to withdraw consent for usage-data collection.
                HayameToggleRow(
                    icon: "chart.bar.xaxis",
                    tint: HayameTheme.brandBlue,
                    title: "Share usage analytics",
                    subtitle: "Which cars people look for and where booking gets stuck",
                    isOn: Binding(
                        get: { analyticsEnabled },
                        set: { enabled in
                            AnalyticsService.shared.setConsent(enabled ? .granted : .denied)
                            analyticsEnabled = enabled
                        }
                    )
                )

                Text("We never track you across other apps or sell your data. Turning this off deletes the analytics id stored on this device.")
                    .font(.hayame(size: 12.5 * bodyScale, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 16)
                    .padding(.bottom, 15)
            }
            .legalCard()
        }
    }

    // MARK: Questions

    private func questions(_ document: LegalDocument, proxy: ScrollViewProxy) -> some View {
        let tokens = Self.searchTokens(searchText)
        let isSearching = !tokens.isEmpty
        let visible = Self.filter(document.groups, tokens: tokens)
        let visibleIDs = visible.flatMap { $0.questions.map(\.id) }
        let matchCount = visibleIDs.count
        let allOpen = !visibleIDs.isEmpty && visibleIDs.allSatisfy { isOpen($0, isSearching: isSearching) }

        return VStack(alignment: .leading, spacing: 16) {
            sectionTitle("Questions and answers")

            searchField

            if !visible.isEmpty {
                topicChips(visible, isSearching: isSearching, proxy: proxy)
            }

            if visible.isEmpty {
                noMatches
            } else {
                HStack(alignment: .firstTextBaseline, spacing: 12) {
                    Text(isSearching
                        ? "\(matchCount) of \(document.questionCount) questions match"
                        : "\(document.questionCount) questions in \(document.groups.count) \(document.groups.count == 1 ? "topic" : "topics")")
                        .font(.hayame(size: 13 * headingScale, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    Button {
                        HayameHaptics.select()
                        setAll(visibleIDs, open: !allOpen, isSearching: isSearching)
                    } label: {
                        Text(allOpen ? "Close all" : "Open all answers")
                            .font(.hayame(size: 13 * headingScale, weight: .bold))
                            .foregroundStyle(HayameTheme.brandBlue)
                            .padding(.vertical, 12)
                            .padding(.leading, 8)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 4)
                .padding(.top, -6)
                .padding(.bottom, -18)

                VStack(alignment: .leading, spacing: 14) {
                    ForEach(visible) { group in
                        groupSection(group, tokens: tokens, isSearching: isSearching)
                            .padding(.top, Self.partTopSpace)
                            .id(Anchor.group(group.id))
                    }
                }
            }
        }
    }

    private var searchField: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .font(.hayame(size: 15 * headingScale, weight: .semibold))
                .foregroundStyle(HayameTheme.mutedText)
                .accessibilityHidden(true)

            TextField(
                "",
                text: $searchText,
                prompt: Text("Search questions").foregroundStyle(HayameTheme.mutedText)
            )
            .font(.hayame(size: 15 * headingScale, weight: .medium))
            .foregroundStyle(HayameTheme.brandNavy)
            .tint(HayameTheme.brandBlue)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .submitLabel(.search)
            .focused($searchFocused)
            .onSubmit { searchFocused = false }
            .accessibilityLabel("Search questions")

            if !searchText.isEmpty {
                Button {
                    searchText = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.hayame(size: 17 * headingScale, weight: .semibold))
                        .foregroundStyle(HayameTheme.mutedText)
                        .frame(width: 36, height: 36)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Clear search")
            }
        }
        .padding(.leading, 14)
        .padding(.trailing, searchText.isEmpty ? 14 : 6)
        .frame(minHeight: 50)
        .background(HayameTheme.fieldBackground, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(searchFocused ? HayameTheme.brandBlue.opacity(0.7) : HayameTheme.controlStroke, lineWidth: 1)
        )
        .contentShape(Rectangle())
        .onTapGesture { searchFocused = true }
    }

    private func topicChips(_ groups: [LegalGroup], isSearching: Bool, proxy: ScrollViewProxy) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(groups) { group in
                    Button {
                        HayameHaptics.select()
                        searchFocused = false
                        withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.4)) {
                            proxy.scrollTo(Anchor.group(group.id), anchor: .top)
                        }
                    } label: {
                        HStack(spacing: 6) {
                            Text(group.title)
                                .font(.hayame(size: 13 * headingScale, weight: .semibold))
                                .foregroundStyle(HayameTheme.brandNavy)
                            if isSearching {
                                Text("\(group.questions.count)")
                                    .font(.hayame(size: 12 * headingScale, weight: .bold))
                                    .foregroundStyle(HayameTheme.brandBlue)
                            }
                        }
                        .padding(.horizontal, 14)
                        .frame(minHeight: 40)
                        .background(HayameTheme.chipBackground, in: Capsule())
                        .overlay(Capsule().strokeBorder(HayameTheme.controlStroke, lineWidth: 1))
                        .contentShape(Capsule())
                    }
                    .buttonStyle(HayamePressableStyle(scale: 0.96, haptic: false))
                    .accessibilityLabel(isSearching
                        ? "\(group.title), \(group.questions.count) matching"
                        : group.title)
                    .accessibilityHint("Jumps to this topic")
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 1)
        }
        // The row runs to the screen edges so chips scroll under them.
        .padding(.horizontal, -16)
    }

    private func groupSection(_ group: LegalGroup, tokens: [String], isSearching: Bool) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text(group.title)
                    .font(.hayame(size: 17 * headingScale, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .accessibilityAddTraits(.isHeader)

                Text("\(group.questions.count) \(group.questions.count == 1 ? "question" : "questions")")
                    .font(.hayame(size: 12.5 * headingScale, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
            }
            .padding(.horizontal, 4)

            VStack(spacing: 0) {
                ForEach(Array(group.questions.enumerated()), id: \.element.id) { index, question in
                    if index > 0 {
                        Rectangle()
                            .fill(HayameTheme.cardStroke)
                            .frame(height: 1)
                            .padding(.leading, 16)
                    }
                    LegalQuestionRow(
                        question: question,
                        isOpen: isOpen(question.id, isSearching: isSearching),
                        tokens: tokens,
                        bodyScale: bodyScale
                    ) {
                        toggle(question.id, isSearching: isSearching)
                    }
                }
            }
            .legalCard()
        }
    }

    private var noMatches: some View {
        VStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .font(.hayame(size: 24, weight: .semibold))
                .foregroundStyle(HayameTheme.mutedText)
                .frame(width: 56, height: 56)
                .background(HayameTheme.subtleFill, in: Circle())
                .accessibilityHidden(true)

            Text("No questions match \"\(searchText.trimmingCharacters(in: .whitespacesAndNewlines))\"")
                .font(.hayame(size: 16 * bodyScale, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 4)

            Text("Try a different word, or ask our team directly.")
                .font(.hayame(size: 14 * bodyScale, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)

            Button {
                searchText = ""
            } label: {
                Text("Clear search")
                    .font(.hayame(size: 14 * headingScale, weight: .semibold))
            }
            .buttonStyle(LegalOutlinePillStyle())
            .padding(.top, 8)
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 20)
        .padding(.vertical, 28)
        .legalCard()
    }

    // MARK: Closing

    private func closing(_ document: LegalDocument) -> some View {
        VStack(alignment: .leading, spacing: 26) {
            VStack(alignment: .leading, spacing: 10) {
                Text("Still have a question?")
                    .font(.hayame(size: 20 * headingScale, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityAddTraits(.isHeader)

                if !document.contact.isEmpty {
                    Text(document.contact)
                        .font(.hayame(size: 14.5 * bodyScale, weight: .regular))
                        .foregroundStyle(HayameTheme.brandNavy.opacity(0.82))
                        .lineSpacing(4 * bodyScale)
                        .fixedSize(horizontal: false, vertical: true)
                }

                NavigationLink {
                    ContactScreen()
                } label: {
                    Label("Contact support", systemImage: "envelope.fill")
                }
                .buttonStyle(SolidPillButtonStyle())
                .padding(.top, 8)
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .legalCard()

            relatedLinks
        }
    }

    private var relatedLinks: some View {
        HayameGroupCard(title: "More to read") {
            ForEach(LegalDocumentKind.allCases.filter { $0 != kind }) { other in
                HayameNavRow(
                    icon: other.systemImage,
                    tint: other.tint,
                    title: other.shortTitle,
                    subtitle: other.linkSubtitle
                ) {
                    LegalDocumentScreen(kind: other)
                }
                HayameRowDivider()
            }
            HayameNavRow(
                icon: "doc.text.fill",
                tint: HayameTheme.brandBlue,
                title: "Terms of Service",
                subtitle: "The agreement for using Hayame"
            ) {
                TermsOfServiceScreen(mode: .readOnly)
            }
        }
    }

    // MARK: Error

    private var errorState: some View {
        VStack(alignment: .leading, spacing: 30) {
            VStack(spacing: 12) {
                Image(systemName: "wifi.exclamationmark")
                    .font(.hayame(size: 26, weight: .semibold))
                    .foregroundStyle(HayameTheme.mutedText)
                    .frame(width: 64, height: 64)
                    .background(HayameTheme.subtleFill, in: Circle())
                    .accessibilityHidden(true)

                Text("We couldn't load this page")
                    .font(.hayame(size: 18 * bodyScale, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 4)

                Text("Check your connection and try again. Once it has loaded, you can read it offline too.")
                    .font(.hayame(size: 14 * bodyScale, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)

                Button {
                    Task { await load(force: true) }
                } label: {
                    Text("Retry")
                        .font(.hayame(size: 14 * headingScale, weight: .semibold))
                }
                .buttonStyle(LegalOutlinePillStyle())
                .padding(.top, 10)
            }
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 20)
            .padding(.top, 56)
            .padding(.bottom, 12)

            // The privacy choice never depends on the text having loaded.
            if kind == .privacy {
                privacyChoices
            }

            HayameGroupCard(title: "Need help now?") {
                HayameNavRow(icon: "envelope.fill", tint: HayameTheme.brandBlue, title: "Contact us", subtitle: "We reply within a day") {
                    ContactScreen()
                }
            }
        }
    }

    // MARK: Pieces

    private func sectionTitle(_ text: String) -> some View {
        Text(text)
            .font(.hayame(size: 20 * headingScale, weight: .bold))
            .foregroundStyle(HayameTheme.brandNavy)
            .lineSpacing(2)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 4)
            .accessibilityAddTraits(.isHeader)
    }

    // MARK: Open and close

    private func isOpen(_ id: String, isSearching: Bool) -> Bool {
        isSearching ? !closedWhileSearching.contains(id) : expanded.contains(id)
    }

    private func toggle(_ id: String, isSearching: Bool) {
        withAnimation(reduceMotion ? nil : HayameMotion.settle) {
            if isSearching {
                if closedWhileSearching.contains(id) {
                    closedWhileSearching.remove(id)
                } else {
                    closedWhileSearching.insert(id)
                }
            } else if expanded.contains(id) {
                expanded.remove(id)
            } else {
                expanded.insert(id)
            }
        }
    }

    private func setAll(_ ids: [String], open: Bool, isSearching: Bool) {
        withAnimation(reduceMotion ? nil : HayameMotion.settle) {
            if isSearching {
                closedWhileSearching = open ? [] : Set(ids)
            } else {
                expanded = open ? Set(ids) : []
            }
        }
    }

    // MARK: Search

    /// The words typed, lowercased. Every word must appear in a question or
    /// its answer for the question to match.
    static func searchTokens(_ text: String) -> [String] {
        text.lowercased()
            .split(whereSeparator: { $0.isWhitespace })
            .map(String.init)
    }

    private static func filter(_ groups: [LegalGroup], tokens: [String]) -> [LegalGroup] {
        guard !tokens.isEmpty else { return groups }
        return groups.compactMap { group in
            let matches = group.questions.filter { question in
                let haystack = ([question.q] + question.a).joined(separator: "\n")
                return tokens.allSatisfy { token in
                    haystack.range(of: token, options: [.caseInsensitive, .diacriticInsensitive]) != nil
                }
            }
            guard !matches.isEmpty else { return nil }
            var filtered = group
            filtered.questions = matches
            return filtered
        }
    }

    // MARK: Loading

    private func loadIfNeeded() async {
        if document != nil {
            hasAttemptedLoad = true
            // Already on screen (saved copy): quietly pick up a newer one.
            await store.refresh(kind, baseURL: appState.apiBaseURL)
            return
        }
        await load(force: false)
    }

    private func load(force: Bool) async {
        guard !isLoading else { return }
        isLoading = true
        await store.refresh(kind, baseURL: appState.apiBaseURL, force: force)
        isLoading = false
        hasAttemptedLoad = true
    }

    // MARK: Screenshot runs

    #if DEBUG
    /// Screenshot runs can't scroll, type or tap. The `legal-*` routes pick a
    /// state, and these launch arguments override it:
    /// `-HAYAME_LEGAL_SCROLL top|keypoints|table|choices|questions|group:<n>|closing`,
    /// `-HAYAME_LEGAL_EXPAND <n>` (opens the first n answers; `all` opens every one),
    /// `-HAYAME_LEGAL_SEARCH <text>`.
    private func applyScreenshotPreset(_ proxy: ScrollViewProxy) async {
        guard AppState.isScreenshotMode, let document else { return }
        var scroll: String?
        var expandCount = 0
        var search: String?

        switch ScreenshotRoute.current {
        case .legalProtectionQuestion:
            scroll = "questions"
            expandCount = 1
        case .legalCancellationTable:
            scroll = "table"
        case .legalCancellationQuestions:
            scroll = "group:0"
            expandCount = 1
        case .legalPrivacySearch:
            scroll = "questions"
            search = "licence"
        default:
            break
        }

        func argument(_ key: String) -> String? {
            let args = ProcessInfo.processInfo.arguments
            guard let index = args.firstIndex(of: key), args.indices.contains(index + 1) else { return nil }
            return args[index + 1].trimmingCharacters(in: .whitespacesAndNewlines)
        }
        if let value = argument("-HAYAME_LEGAL_SCROLL") { scroll = value }
        if let value = argument("-HAYAME_LEGAL_SEARCH") { search = value }
        if let value = argument("-HAYAME_LEGAL_EXPAND") {
            expandCount = value.lowercased() == "all" ? document.questionCount : (Int(value) ?? 0)
        }

        if let search { searchText = search }
        if expandCount > 0 {
            expanded = Set(document.groups.flatMap { $0.questions.map(\.id) }.prefix(expandCount))
        }

        guard let scroll else { return }
        let anchor: Anchor
        switch scroll.lowercased() {
        case "keypoints": anchor = .keyPoints
        case "table": anchor = .table
        case "choices": anchor = .choices
        case "questions": anchor = .questions
        case "closing": anchor = .closing
        case let value where value.hasPrefix("group:"):
            anchor = .group(Int(value.dropFirst("group:".count)) ?? 0)
        default: anchor = .top
        }
        try? await Task.sleep(nanoseconds: 600_000_000)
        proxy.scrollTo(anchor, anchor: .top)
    }
    #endif
}

// MARK: - Question row

/// A question that opens in place to show its answer.
private struct LegalQuestionRow: View {
    let question: LegalQuestion
    let isOpen: Bool
    /// Search words to mark in the text.
    let tokens: [String]
    let bodyScale: CGFloat
    let onToggle: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button(action: {
                HayameHaptics.select()
                onToggle()
            }) {
                HStack(alignment: .center, spacing: 14) {
                    Text(Self.marked(question.q, tokens: tokens))
                        .font(.hayame(size: 15 * bodyScale, weight: .semibold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .lineSpacing(3 * bodyScale)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    Image(systemName: "chevron.down")
                        .font(.hayame(size: 12, weight: .bold))
                        .foregroundStyle(isOpen ? HayameTheme.brandBlue : HayameTheme.mutedText)
                        .rotationEffect(.degrees(isOpen ? 180 : 0))
                        .frame(width: 30, height: 30)
                        .background(
                            isOpen ? HayameTheme.brandBlue.opacity(0.14) : HayameTheme.subtleFill,
                            in: Circle()
                        )
                        .accessibilityHidden(true)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 15)
                .frame(minHeight: 60)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(question.q)
            .accessibilityValue(isOpen ? "Expanded" : "Collapsed")
            .accessibilityHint(isOpen ? "Hides the answer" : "Shows the answer")

            if isOpen {
                VStack(alignment: .leading, spacing: 12 * bodyScale) {
                    ForEach(Array(question.a.enumerated()), id: \.offset) { _, paragraph in
                        Text(Self.marked(paragraph, tokens: tokens))
                            .font(.hayame(size: 14.5 * bodyScale, weight: .regular))
                            .foregroundStyle(HayameTheme.brandNavy.opacity(0.84))
                            .lineSpacing(5 * bodyScale)
                            .fixedSize(horizontal: false, vertical: true)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .padding(.leading, 16)
                .padding(.trailing, 20)
                .padding(.bottom, 20)
                .transition(.opacity)
                .accessibilityElement(children: .combine)
            }
        }
        // Keeps the answer inside the row while the card grows around it.
        .clipped()
    }

    /// The text with every search word marked.
    private static func marked(_ text: String, tokens: [String]) -> AttributedString {
        var attributed = AttributedString(text)
        guard !tokens.isEmpty else { return attributed }
        for token in tokens where !token.isEmpty {
            var searchRange = text.startIndex..<text.endIndex
            while let found = text.range(of: token, options: [.caseInsensitive, .diacriticInsensitive], range: searchRange) {
                if let lower = AttributedString.Index(found.lowerBound, within: attributed),
                   let upper = AttributedString.Index(found.upperBound, within: attributed) {
                    attributed[lower..<upper].backgroundColor = HayameTheme.brandBlue.opacity(0.28)
                }
                guard found.upperBound < text.endIndex else { break }
                searchRange = found.upperBound..<text.endIndex
            }
        }
        return attributed
    }
}

// MARK: - Styling

/// The three outcomes of a refund row, best first. Rows with another number of
/// outcomes get a neutral marker.
private struct RefundOutcomeStyle {
    let systemImage: String
    let tint: Color

    init(index: Int, total: Int) {
        guard total == 3 else {
            systemImage = "circle.fill"
            tint = HayameTheme.brandBlue
            return
        }
        switch index {
        case 0:
            systemImage = "checkmark.circle.fill"
            tint = HayameTheme.success
        case 1:
            systemImage = "circle.lefthalf.filled"
            tint = HayameTheme.warning
        default:
            systemImage = "xmark.circle.fill"
            tint = HayameTheme.danger
        }
    }
}

private extension LegalDocumentKind {
    var tint: Color {
        switch self {
        case .protection: return HayameTheme.success
        case .cancellation: return HayameTheme.warning
        case .privacy: return HayameTheme.mutedText
        }
    }
}

private extension View {
    /// The card surface used across the document (same look as `HayameGroupCard`).
    func legalCard() -> some View {
        self
            .background(HayameTheme.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .strokeBorder(HayameTheme.cardStroke, lineWidth: 1)
            )
            .shadow(color: HayameTheme.cardShadow, radius: 12, x: 0, y: 5)
    }
}

private struct LegalOutlinePillStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(HayameTheme.brandNavy)
            .padding(.vertical, 12)
            .padding(.horizontal, 26)
            .frame(minHeight: 44)
            .overlay(Capsule().strokeBorder(HayameTheme.brandNavy.opacity(0.55), lineWidth: 1.2))
            .contentShape(Capsule())
            .opacity(configuration.isPressed ? 0.7 : 1)
            .animation(HayameMotion.snappy, value: configuration.isPressed)
    }
}

// MARK: - Loading placeholder

private struct LegalDocumentSkeleton: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 30) {
            VStack(alignment: .leading, spacing: 14) {
                SkeletonBlock(width: 110, height: 11, cornerRadius: 5)
                SkeletonBlock(width: 250, height: 30, cornerRadius: 8)
                VStack(alignment: .leading, spacing: 8) {
                    SkeletonBlock(height: 13, cornerRadius: 6)
                    SkeletonBlock(height: 13, cornerRadius: 6)
                    SkeletonBlock(width: 190, height: 13, cornerRadius: 6)
                }
                SkeletonBlock(width: 230, height: 11, cornerRadius: 5)
            }
            .padding(.horizontal, 4)

            VStack(alignment: .leading, spacing: 12) {
                SkeletonBlock(width: 120, height: 18, cornerRadius: 7)
                    .padding(.horizontal, 4)
                ForEach(0..<3, id: \.self) { _ in
                    HStack(alignment: .top, spacing: 14) {
                        SkeletonBlock(width: 30, height: 30, cornerRadius: 15)
                        VStack(alignment: .leading, spacing: 9) {
                            SkeletonBlock(width: 170, height: 15, cornerRadius: 6)
                            SkeletonBlock(height: 12, cornerRadius: 6)
                            SkeletonBlock(width: 210, height: 12, cornerRadius: 6)
                        }
                    }
                    .padding(16)
                    .legalCard()
                }
            }

            VStack(alignment: .leading, spacing: 12) {
                SkeletonBlock(width: 200, height: 18, cornerRadius: 7)
                    .padding(.horizontal, 4)
                SkeletonBlock(height: 50, cornerRadius: 14)
                ForEach(0..<4, id: \.self) { _ in
                    SkeletonBlock(height: 60, cornerRadius: 16)
                }
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Loading")
    }
}

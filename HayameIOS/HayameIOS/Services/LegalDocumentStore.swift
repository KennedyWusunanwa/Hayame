import Foundation

// MARK: - Policy documents (Protection, Cancellation, Privacy)
//
// The text lives on the server (one copy for web, iOS and Android) and is
// served by `GET /api/legal/{slug}`. Every field is read leniently so a
// missing or renamed field never fails the whole document.

enum LegalDocumentKind: String, CaseIterable, Identifiable {
    case protection
    case cancellation
    case privacy

    var id: String { rawValue }

    /// Short name for the navigation bar and for links between documents.
    var shortTitle: String {
        switch self {
        case .protection: return "Protection"
        case .cancellation: return "Cancellation policy"
        case .privacy: return "Privacy"
        }
    }

    var linkSubtitle: String {
        switch self {
        case .protection: return "Checks, deposits and what to do if something goes wrong"
        case .cancellation: return "What you get back, and when"
        case .privacy: return "What we collect, who sees it and your choices"
        }
    }

    var systemImage: String {
        switch self {
        case .protection: return "shield.lefthalf.filled"
        case .cancellation: return "calendar.badge.clock"
        case .privacy: return "hand.raised.fill"
        }
    }
}

struct LegalHighlight: Codable, Hashable {
    var title: String
    var body: String

    private enum CodingKeys: String, CodingKey { case title, body }

    init(from decoder: Decoder) throws {
        let container = try? decoder.container(keyedBy: CodingKeys.self)
        title = LegalDecoding.string(container, .title)
        body = LegalDecoding.string(container, .body)
    }
}

struct LegalTable: Codable, Hashable {
    var title: String
    var caption: String
    /// The first column names the row label; the rest name the outcomes.
    var columns: [String]
    var rows: [[String]]

    private enum CodingKeys: String, CodingKey { case title, caption, columns, rows }

    init(from decoder: Decoder) throws {
        let container = try? decoder.container(keyedBy: CodingKeys.self)
        title = LegalDecoding.string(container, .title)
        caption = LegalDecoding.string(container, .caption)
        columns = LegalDecoding.strings(container, .columns)
        let rawRows = (try? container?.decodeIfPresent(LossyList<LossyList<LossyString>>.self, forKey: .rows))?.elements ?? []
        rows = rawRows
            .map { row in row.elements.map(\.value) }
            .filter { row in row.contains { !$0.isEmpty } }
    }

    var isEmpty: Bool { rows.isEmpty }
}

struct LegalQuestion: Codable, Hashable, Identifiable {
    /// Position in the document ("group-question"); set after decoding.
    var id: String = ""
    var q: String
    /// The answer, one entry per paragraph.
    var a: [String]

    private enum CodingKeys: String, CodingKey { case q, a }

    init(from decoder: Decoder) throws {
        let container = try? decoder.container(keyedBy: CodingKeys.self)
        q = LegalDecoding.string(container, .q)
        a = LegalDecoding.strings(container, .a)
    }
}

struct LegalGroup: Codable, Hashable, Identifiable {
    /// Position in the document; set after decoding.
    var id: Int = 0
    var title: String
    var questions: [LegalQuestion]

    private enum CodingKeys: String, CodingKey { case title, questions }

    init(from decoder: Decoder) throws {
        let container = try? decoder.container(keyedBy: CodingKeys.self)
        title = LegalDecoding.string(container, .title)
        questions = ((try? container?.decodeIfPresent(LossyList<LegalQuestion>.self, forKey: .questions))?.elements ?? [])
            .filter { !$0.q.isEmpty && !$0.a.isEmpty }
    }
}

struct LegalDocument: Codable, Hashable {
    var slug: String
    var eyebrow: String
    var title: String
    /// Already formatted by the server, e.g. "10 November 2026".
    var lastUpdated: String
    var summary: String
    var highlights: [LegalHighlight]
    var table: LegalTable?
    var groups: [LegalGroup]
    var contact: String

    private enum CodingKeys: String, CodingKey {
        case slug, eyebrow, title, lastUpdated, summary, highlights, table, groups, contact
    }

    private enum AlternateKeys: String, CodingKey {
        case lastUpdated = "last_updated"
    }

    init(from decoder: Decoder) throws {
        let container = try? decoder.container(keyedBy: CodingKeys.self)
        slug = LegalDecoding.string(container, .slug)
        eyebrow = LegalDecoding.string(container, .eyebrow)
        title = LegalDecoding.string(container, .title)
        summary = LegalDecoding.string(container, .summary)
        contact = LegalDecoding.string(container, .contact)

        var updated = LegalDecoding.string(container, .lastUpdated)
        if updated.isEmpty, let alternate = try? decoder.container(keyedBy: AlternateKeys.self) {
            updated = LegalDecoding.string(alternate, .lastUpdated)
        }
        lastUpdated = updated

        highlights = ((try? container?.decodeIfPresent(LossyList<LegalHighlight>.self, forKey: .highlights))?.elements ?? [])
            .filter { !$0.title.isEmpty || !$0.body.isEmpty }

        let decodedTable = try? container?.decodeIfPresent(LegalTable.self, forKey: .table)
        table = (decodedTable?.isEmpty == false) ? decodedTable : nil

        var decodedGroups = ((try? container?.decodeIfPresent(LossyList<LegalGroup>.self, forKey: .groups))?.elements ?? [])
            .filter { !$0.questions.isEmpty }
        for groupIndex in decodedGroups.indices {
            decodedGroups[groupIndex].id = groupIndex
            for questionIndex in decodedGroups[groupIndex].questions.indices {
                decodedGroups[groupIndex].questions[questionIndex].id = "\(groupIndex)-\(questionIndex)"
            }
        }
        groups = decodedGroups
    }

    var questionCount: Int {
        groups.reduce(0) { $0 + $1.questions.count }
    }

    /// A reply with no title or no questions is not worth showing (or caching).
    var isUsable: Bool {
        !title.isEmpty && questionCount > 0
    }
}

struct LegalDocumentEnvelopeDTO: Decodable {
    let data: LegalDocument?

    private enum CodingKeys: String, CodingKey { case data }

    init(from decoder: Decoder) throws {
        let container = try? decoder.container(keyedBy: CodingKeys.self)
        data = try? container?.decodeIfPresent(LegalDocument.self, forKey: .data)
    }
}

// MARK: Lenient decoding helpers

private enum LegalDecoding {
    static func string<Key: CodingKey>(_ container: KeyedDecodingContainer<Key>?, _ key: Key) -> String {
        guard let container else { return "" }
        if let value = try? container.decodeIfPresent(String.self, forKey: key) {
            return value.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        if let value = try? container.decodeIfPresent(Int.self, forKey: key) {
            return String(value)
        }
        return ""
    }

    /// A list of strings; a single string counts as a list of one.
    static func strings<Key: CodingKey>(_ container: KeyedDecodingContainer<Key>?, _ key: Key) -> [String] {
        guard let container else { return [] }
        if let list = try? container.decodeIfPresent(LossyList<LossyString>.self, forKey: key) {
            return list.elements.map(\.value).filter { !$0.isEmpty }
        }
        let single = string(container, key)
        return single.isEmpty ? [] : [single]
    }
}

/// A string that also accepts a number, and never fails.
private struct LossyString: Decodable {
    let value: String

    init(from decoder: Decoder) throws {
        let container = try? decoder.singleValueContainer()
        if let text = try? container?.decode(String.self) {
            value = text.trimmingCharacters(in: .whitespacesAndNewlines)
        } else if let number = try? container?.decode(Int.self) {
            value = String(number)
        } else {
            value = ""
        }
    }
}

/// A list that drops the entries it cannot read instead of failing as a whole.
private struct LossyList<Element: Decodable>: Decodable {
    let elements: [Element]

    private struct Skipped: Decodable {
        init(from decoder: Decoder) throws {}
    }

    init(from decoder: Decoder) throws {
        var container = try decoder.unkeyedContainer()
        var decoded: [Element] = []
        while !container.isAtEnd {
            if (try? container.decodeNil()) == true { continue }
            if let element = try? container.decode(Element.self) {
                decoded.append(element)
            } else if (try? container.decode(Skipped.self)) == nil {
                break
            }
        }
        elements = decoded
    }
}

// MARK: - Store

/// Holds the three policy documents. The last copy that loaded is kept on disk
/// (Caches) so each document opens at once and can be read offline; a fresh
/// copy is fetched in the background whenever a document is opened.
@MainActor
final class LegalDocumentStore: ObservableObject {
    static let shared = LegalDocumentStore()

    @Published private(set) var documents: [LegalDocumentKind: LegalDocument] = [:]
    /// Documents whose latest refresh failed (the copy on screen, if any, is the saved one).
    @Published private(set) var refreshFailed: Set<LegalDocumentKind> = []

    private let api = APIClient.shared
    private var lastRefresh: [LegalDocumentKind: Date] = [:]
    private var inFlight: [LegalDocumentKind: Task<Bool, Never>] = [:]

    private init() {
        #if DEBUG
        if AppState.isScreenshotMode {
            // Screenshot runs show the real text from fixtures, never the network.
            let withheld = Self.screenshotWithheldKinds
            for kind in LegalDocumentKind.allCases where !withheld.contains(kind) {
                documents[kind] = ScreenshotLegalFixtures.legalDocument(kind)
            }
            return
        }
        #endif
        for kind in LegalDocumentKind.allCases {
            if let cached = Self.readCache(kind) {
                documents[kind] = cached
            }
        }
    }

    /// Fetches the document. Returns true when a copy is available afterwards
    /// (fresh or saved). Throttled so reopening a screen does not refetch;
    /// `force` (Retry, pull to refresh) skips the throttle.
    @discardableResult
    func refresh(_ kind: LegalDocumentKind, baseURL: String, force: Bool = false) async -> Bool {
        #if DEBUG
        if AppState.isScreenshotMode {
            if Self.screenshotWithheldKinds.contains(kind) { refreshFailed.insert(kind) }
            return documents[kind] != nil
        }
        #endif
        if let running = inFlight[kind] {
            return await running.value
        }
        if !force, documents[kind] != nil, let last = lastRefresh[kind], Date().timeIntervalSince(last) < 300 {
            return true
        }

        let task = Task { @MainActor [api] () -> Bool in
            do {
                let envelope = try await api.getLegalDocument(baseURL: baseURL, slug: kind.rawValue)
                guard let document = envelope.data, document.isUsable else {
                    throw APIError(message: "Unable to decode server response")
                }
                self.documents[kind] = document
                self.refreshFailed.remove(kind)
                self.lastRefresh[kind] = Date()
                Self.writeCache(document, kind: kind)
                return true
            } catch {
                if !AppState.isCancellation(error) {
                    self.refreshFailed.insert(kind)
                }
                return self.documents[kind] != nil
            }
        }
        inFlight[kind] = task
        let available = await task.value
        inFlight[kind] = nil
        return available
    }

    // MARK: Disk cache

    private static func cacheURL(_ kind: LegalDocumentKind) -> URL? {
        FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first?
            .appendingPathComponent("hayame-legal-\(kind.rawValue).json")
    }

    private static func readCache(_ kind: LegalDocumentKind) -> LegalDocument? {
        guard let url = cacheURL(kind),
              let data = try? Data(contentsOf: url),
              let document = try? JSONDecoder().decode(LegalDocument.self, from: data),
              document.isUsable else {
            return nil
        }
        return document
    }

    private static func writeCache(_ document: LegalDocument, kind: LegalDocumentKind) {
        guard let url = cacheURL(kind), let data = try? JSONEncoder().encode(document) else { return }
        try? data.write(to: url, options: .atomic)
    }

    #if DEBUG
    /// `-HAYAME_LEGAL_UNAVAILABLE` leaves the documents unloaded in screenshot
    /// runs, to capture the "couldn't load" state.
    private static var screenshotWithheldKinds: Set<LegalDocumentKind> {
        ProcessInfo.processInfo.arguments.contains("-HAYAME_LEGAL_UNAVAILABLE")
            ? Set(LegalDocumentKind.allCases)
            : []
    }
    #endif
}

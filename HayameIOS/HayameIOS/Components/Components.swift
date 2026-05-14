import ImageIO
import SwiftUI
import UIKit

enum RemoteImageURLResolver {
    private static let defaultBaseURL = "https://www.hayamegh.com"

    static func resolve(_ raw: String?) -> URL? {
        guard let canonical = canonicalString(raw) else { return nil }
        return URL(string: canonical)
    }

    static func canonicalString(_ raw: String?) -> String? {
        guard var candidate = raw?.trimmingCharacters(in: .whitespacesAndNewlines), !candidate.isEmpty else {
            return nil
        }

        candidate = candidate.replacingOccurrences(of: "&amp;", with: "&")

        if candidate.hasPrefix("data:") || isPlaceholder(candidate) {
            return nil
        }

        let absolute: String
        if hasScheme(candidate) {
            absolute = candidate
        } else if candidate.hasPrefix("//") {
            absolute = "https:\(candidate)"
        } else if candidate.hasPrefix("/") {
            let base = isSupabaseStoragePath(candidate) ? supabaseBaseURL() : apiBaseURL()
            absolute = "\(base)\(candidate)"
        } else {
            let base = isSupabaseStoragePath(candidate) ? supabaseBaseURL() : apiBaseURL()
            absolute = "\(base)/\(candidate)"
        }

        return sanitizeAbsoluteURL(absolute)
    }

    private static func isPlaceholder(_ value: String) -> Bool {
        let lowered = value.lowercased()
        return lowered == "/car-placeholder.jpg" || lowered.hasSuffix("/car-placeholder.jpg")
    }

    private static func hasScheme(_ value: String) -> Bool {
        guard let components = URLComponents(string: value) else { return false }
        return components.scheme != nil
    }

    private static func isSupabaseStoragePath(_ value: String) -> Bool {
        let normalized = value
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()
        return normalized.hasPrefix("/storage/v1/object/") || normalized.hasPrefix("storage/v1/object/")
    }

    private static func apiBaseURL() -> String {
        let bundled = (Bundle.main.object(forInfoDictionaryKey: "HAYAMEAPIBaseURL") as? String)?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        var base = (bundled?.isEmpty == false ? bundled : nil) ?? defaultBaseURL
        if !base.contains("://") {
            base = "https://\(base)"
        }
        while base.hasSuffix("/") {
            base.removeLast()
        }
        return base
    }

    private static func supabaseBaseURL() -> String {
        let bundled = (Bundle.main.object(forInfoDictionaryKey: "HAYAMESupabaseURL") as? String)?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        var base = (bundled?.isEmpty == false ? bundled : nil) ?? apiBaseURL()
        if !base.contains("://") {
            base = "https://\(base)"
        }
        while base.hasSuffix("/") {
            base.removeLast()
        }
        return base
    }

    private static func shouldUpgradeHTTPToHTTPS(host: String) -> Bool {
        let lowered = host.lowercased()
        if lowered == "localhost" || lowered == "127.0.0.1" || lowered == "::1" || lowered.hasSuffix(".local") {
            return false
        }
        if isPrivateIPv4Address(lowered) {
            return false
        }
        return true
    }

    private static func isPrivateIPv4Address(_ host: String) -> Bool {
        let octets = host.split(separator: ".")
        guard octets.count == 4 else { return false }
        guard let a = Int(octets[0]), let b = Int(octets[1]), let c = Int(octets[2]), let d = Int(octets[3]) else {
            return false
        }
        guard (0...255).contains(a), (0...255).contains(b), (0...255).contains(c), (0...255).contains(d) else {
            return false
        }
        if a == 10 || a == 127 { return true }
        if a == 192 && b == 168 { return true }
        if a == 172 && (16...31).contains(b) { return true }
        if a == 169 && b == 254 { return true }
        return false
    }

    private static func sanitizeAbsoluteURL(_ raw: String) -> String? {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }

        if var components = URLComponents(string: trimmed) {
            if let host = components.host?.lowercased(), host == "localhost" || host == "127.0.0.1" || host == "::1" {
                if let apiComponents = URLComponents(string: apiBaseURL()) {
                    components.scheme = apiComponents.scheme ?? components.scheme
                    components.host = apiComponents.host
                    components.port = apiComponents.port
                } else {
                    components.scheme = "https"
                    components.host = "www.hayamegh.com"
                    components.port = nil
                }
            } else if components.scheme?.lowercased() == "http",
                      let host = components.host?.lowercased(),
                      shouldUpgradeHTTPToHTTPS(host: host) {
                // iOS image loading is more reliable over TLS for remote assets.
                components.scheme = "https"
                if components.port == 80 {
                    components.port = nil
                }
            }

            if let normalized = components.string, URL(string: normalized) != nil {
                return normalized
            }
        }

        var allowed = CharacterSet.urlFragmentAllowed
        allowed.remove(charactersIn: "\"<>\\^`{|}")
        if let encoded = trimmed.addingPercentEncoding(withAllowedCharacters: allowed), URL(string: encoded) != nil {
            return encoded
        }

        return nil
    }
}

actor RemoteImagePipeline {
    static let shared = RemoteImagePipeline()

    private let cache = NSCache<NSString, UIImage>()
    private let session: URLSession
    private var inflight: [String: Task<UIImage?, Never>] = [:]

    private init() {
        cache.countLimit = 600
        cache.totalCostLimit = 240 * 1024 * 1024
        let configuration = URLSessionConfiguration.default
        configuration.requestCachePolicy = .returnCacheDataElseLoad
        configuration.urlCache = URLCache(
            memoryCapacity: 200 * 1024 * 1024,
            diskCapacity: 2 * 1024 * 1024 * 1024,
            diskPath: "hayame-image-cache-v2"
        )
        configuration.httpMaximumConnectionsPerHost = 12
        configuration.timeoutIntervalForRequest = 20
        configuration.timeoutIntervalForResource = 60
        configuration.waitsForConnectivity = true
        session = URLSession(configuration: configuration)
    }

    private func cacheKey(for url: URL, targetPixelSize: CGSize?) -> String {
        let pixelWidth = max(0, Int((targetPixelSize?.width ?? 0).rounded(.up)))
        let pixelHeight = max(0, Int((targetPixelSize?.height ?? 0).rounded(.up)))
        return "\(url.absoluteString)#\(pixelWidth)x\(pixelHeight)"
    }

    private static func pixelCost(for image: UIImage) -> Int {
        let width = max(1, Int((image.size.width * image.scale).rounded(.up)))
        let height = max(1, Int((image.size.height * image.scale).rounded(.up)))
        return width * height * 4
    }

    nonisolated private static func decodeImage(data: Data, targetPixelSize: CGSize?) -> UIImage? {
        if let targetPixelSize, targetPixelSize.width > 0, targetPixelSize.height > 0 {
            let maxDimension = max(targetPixelSize.width, targetPixelSize.height)
            if let source = CGImageSourceCreateWithData(data as CFData, nil),
               let cgImage = CGImageSourceCreateThumbnailAtIndex(
                   source,
                   0,
                   [
                       kCGImageSourceCreateThumbnailFromImageAlways: true,
                       kCGImageSourceCreateThumbnailWithTransform: true,
                       kCGImageSourceThumbnailMaxPixelSize: max(1, Int(maxDimension.rounded(.up))),
                       kCGImageSourceShouldCacheImmediately: true
                   ] as CFDictionary
               ) {
                return UIImage(cgImage: cgImage)
            }
        }

        return UIImage(data: data)
    }

    func loadImage(from url: URL, targetPixelSize: CGSize? = nil) async -> UIImage? {
        let key = cacheKey(for: url, targetPixelSize: targetPixelSize)
        if let cached = cache.object(forKey: key as NSString) {
            return cached
        }

        if let existing = inflight[key] {
            return await existing.value
        }

        let task = Task<UIImage?, Never> { [session] in
            var request = URLRequest(url: url)
            request.cachePolicy = .returnCacheDataElseLoad
            request.timeoutInterval = 20

            do {
                let (data, response) = try await session.data(for: request)
                guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
                    return nil
                }
                guard let image = Self.decodeImage(data: data, targetPixelSize: targetPixelSize),
                      image.size.width > 1,
                      image.size.height > 1 else {
                    return nil
                }
                return image
            } catch {
                return nil
            }
        }

        inflight[key] = task
        let result = await task.value
        inflight.removeValue(forKey: key)
        if let result {
            cache.setObject(result, forKey: key as NSString, cost: Self.pixelCost(for: result))
        }

        return result
    }

    func prefetch(
        urls: [URL],
        limit: Int = 60,
        targetPixelSize: CGSize? = nil,
        maxConcurrent: Int = 6
    ) {
        let unique = Array(Set(urls.map(\.absoluteString))).prefix(limit).compactMap(URL.init(string:))
        guard !unique.isEmpty else { return }
        let safeConcurrency = max(1, min(maxConcurrent, unique.count))

        Task.detached(priority: .utility) { [weak self] in
            guard let self else { return }
            var index = 0
            while index < unique.count {
                let batchEnd = min(index + safeConcurrency, unique.count)
                let batch = unique[index..<batchEnd]
                await withTaskGroup(of: Void.self) { group in
                    for url in batch {
                        group.addTask {
                            _ = await self.loadImage(from: url, targetPixelSize: targetPixelSize)
                        }
                    }
                }
                index = batchEnd
            }
        }
    }
}

struct CachedRemoteImage<Placeholder: View, Failure: View>: View {
    enum FitMode {
        case fill
        case fit
    }

    let url: URL?
    var targetSize: CGSize? = nil
    var fitMode: FitMode = .fill
    @ViewBuilder let placeholder: () -> Placeholder
    @ViewBuilder let failure: () -> Failure

    @State private var image: UIImage?
    @State private var hasFailed = false
    private let pipeline = RemoteImagePipeline.shared

    var body: some View {
        Group {
            if let image {
                switch fitMode {
                case .fill:
                    Image(uiImage: image).resizable().scaledToFill()
                case .fit:
                    Image(uiImage: image).resizable().scaledToFit()
                }
            } else if hasFailed {
                failure()
            } else {
                placeholder()
            }
        }
        .task(id: taskID) {
            await load()
        }
    }

    private var taskID: String {
        let sizeKey: String
        if let targetSize {
            sizeKey = "\(Int(targetSize.width.rounded(.up)))x\(Int(targetSize.height.rounded(.up)))"
        } else {
            sizeKey = "auto"
        }
        return "\(url?.absoluteString ?? "nil")#\(sizeKey)"
    }

    private func load() async {
        guard let url else {
            hasFailed = true
            image = nil
            return
        }

        let scale = UIScreen.main.scale
        let pixelSize = targetSize.map { size in
            CGSize(width: max(1, size.width * scale), height: max(1, size.height * scale))
        }

        if let loaded = await pipeline.loadImage(from: url, targetPixelSize: pixelSize) {
            image = loaded
            hasFailed = false
        } else {
            image = nil
            hasFailed = true
        }
    }
}

struct HayameLogoTitle: View {
    var body: some View {
        HStack(spacing: 10) {
            Image("Logo")
                .resizable()
                .scaledToFit()
                .frame(width: 34, height: 34)
                .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))

            Text("Ghana Car Sharing")
                .font(.system(size: 10, weight: .medium, design: .rounded))
                .foregroundStyle(.white.opacity(0.82))
            Spacer()
        }
    }
}

struct HeroBannerCard: View {
    let title: String
    let subtitle: String
    let buttonTitle: String
    let action: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HayameLogoTitle()

            VStack(alignment: .leading, spacing: 6) {
                Text(subtitle.uppercased())
                    .font(.system(size: 10, weight: .semibold, design: .rounded))
                    .foregroundStyle(.white.opacity(0.72))
                Text(title)
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .lineSpacing(2)
            }

            Button(buttonTitle, action: action)
                .buttonStyle(PrimaryPillButtonStyle())
                .frame(maxWidth: 220)
        }
        .padding(18)
        .background(
            ZStack {
                LinearGradient(
                    colors: [HayameTheme.brandNavy, HayameTheme.brandBlue],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                Circle()
                    .fill(Color.white.opacity(0.08))
                    .frame(width: 220, height: 220)
                    .offset(x: 120, y: -60)
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .shadow(color: HayameTheme.brandBlue.opacity(0.32), radius: 16, x: 0, y: 10)
    }
}

struct StatTile: View {
    let title: String
    let value: String
    var action: (() -> Void)? = nil

    var body: some View {
        let content = VStack(alignment: .leading, spacing: 4) {
            Text(title.uppercased())
                .font(.system(size: 10, weight: .semibold, design: .rounded))
                .foregroundStyle(HayameTheme.mutedText)
            Text(value)
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)
        }
        .frame(maxWidth: .infinity, alignment: .leading)

        if let action {
            Button(action: action) {
                content
            }
            .buttonStyle(.plain)
            .hayameCard()
        } else {
            content
                .hayameCard()
        }
    }
}

struct SectionHeader: View {
    let title: String
    var actionTitle: String? = nil
    var action: (() -> Void)? = nil

    var body: some View {
        HStack {
            Text(title)
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)
            Spacer()
            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .font(.system(size: 14, weight: .semibold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandBlue)
            }
        }
    }
}

struct CarCardView: View {
    let car: Car
    let isFavorite: Bool
    var showsFavoriteButton: Bool = true
    let favoriteAction: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ZStack(alignment: .topTrailing) {
                NetworkOrFallbackImage(
                    urlString: car.imageNames.first,
                    targetSize: CGSize(width: 420, height: 300)
                )
                    .frame(height: 164)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

                if showsFavoriteButton {
                    Button(action: favoriteAction) {
                        Image(systemName: isFavorite ? "heart.fill" : "heart")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(isFavorite ? Color.red : HayameTheme.brandNavy)
                            .padding(8)
                            .background(HayameTheme.floatingControlBackground)
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)
                    .padding(8)
                }
            }

            VStack(alignment: .leading, spacing: 6) {
                Text(car.displayTitle)
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .lineLimit(2)

                Text("\(car.city), \(car.region)")
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)
                    .lineLimit(2)

                HStack(spacing: 8) {
                    Label(String(format: "%.1f", car.rating), systemImage: "star.fill")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(.orange)

                    if car.instantBook {
                        Text("Instant")
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                            .foregroundStyle(HayameTheme.success)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(HayameTheme.success.opacity(0.14))
                            .clipShape(Capsule())
                    }

                    Spacer()
                }

                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text("GHS\(car.dailyPrice)")
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text("/ day")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandBlue)
                }
            }
        }
        .padding(12)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(HayameTheme.cardStroke, lineWidth: 1)
        )
    }
}

struct BookingStatusBadge: View {
    let status: BookingDisplayStatus

    var body: some View {
        Text(status.label)
            .font(.system(size: 11, weight: .bold, design: .rounded))
            .foregroundStyle(foreground)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(background)
            .clipShape(Capsule())
    }

    private var background: Color {
        switch status {
        case .pending: return HayameTheme.warning.opacity(0.16)
        case .confirmed: return HayameTheme.brandBlue.opacity(0.15)
        case .ongoing: return HayameTheme.success.opacity(0.16)
        case .completed: return HayameTheme.subtleFill
        case .cancelled, .rejected, .refunded: return HayameTheme.danger.opacity(0.16)
        }
    }

    private var foreground: Color {
        switch status {
        case .pending: return HayameTheme.warning
        case .confirmed: return HayameTheme.brandBlue
        case .ongoing: return HayameTheme.success
        case .completed: return HayameTheme.mutedText
        case .cancelled, .rejected, .refunded: return HayameTheme.danger
        }
    }
}

struct BookingPaymentBadge: View {
    let label: String

    var body: some View {
        Text(label)
            .font(.system(size: 10, weight: .bold, design: .rounded))
            .foregroundStyle(HayameTheme.success)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(HayameTheme.success.opacity(0.15))
            .clipShape(Capsule())
    }
}

struct BookingStatusHeader: View {
    let title: String
    let subtitle: String?
    let helperText: String?
    let status: BookingDisplayStatus
    var showPaidBadge = false

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                Text(title)
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)

                if let subtitle, !subtitle.isEmpty {
                    Text(subtitle)
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)
                }

                if let helperText, !helperText.isEmpty {
                    Text(helperText)
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)
                }
            }

            Spacer(minLength: 12)

            VStack(alignment: .trailing, spacing: 6) {
                BookingStatusBadge(status: status)
                if showPaidBadge {
                    BookingPaymentBadge(label: "Paid")
                }
            }
        }
    }
}

struct BookingRowCard: View {
    let booking: Booking

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            BookingStatusHeader(
                title: booking.carTitle,
                subtitle: "\(booking.tripUseCity), \(booking.tripUseRegion)",
                helperText: booking.displayStatus.helperText(for: .renter, paymentStatus: booking.paymentStatus),
                status: booking.displayStatus,
                showPaidBadge: booking.shouldShowCompletedPaidBadge
            )

            HStack(spacing: 14) {
                Label(booking.startDate.hayameDateLabel(), systemImage: "calendar")
                Label("\(booking.nights) night(s)", systemImage: "moon.stars")
                Spacer()
            }
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .foregroundStyle(HayameTheme.mutedText)

            HStack {
                Text("GHS\(booking.totalPrice)")
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)
                Spacer()
                Text(booking.paymentStatus.rawValue.capitalized)
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandBlue)
            }
        }
        .hayameCard()
    }
}

struct ConversationRowView: View {
    let conversation: Conversation

    var body: some View {
        HStack(spacing: 12) {
            avatarView

            VStack(alignment: .leading, spacing: 4) {
                Text(conversation.participantName)
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .lineLimit(1)

                Text(conversation.lastMessagePreview)
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)
                    .lineLimit(1)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 6) {
                Text(conversation.updatedAt.hayameTimeLabel())
                    .font(.system(size: 10, weight: .medium, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)
                if conversation.unreadCount > 0 {
                    Text("\(conversation.unreadCount)")
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(HayameTheme.brandBlue)
                        .clipShape(Capsule())
                }
            }
        }
        .padding(10)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(HayameTheme.cardStroke, lineWidth: 1)
        )
    }

    @ViewBuilder
    private var avatarView: some View {
        if let url = RemoteImageURLResolver.resolve(conversation.participantAvatar) {
            CachedRemoteImage(url: url, targetSize: CGSize(width: 42, height: 42)) {
                Circle().fill(HayameTheme.brandLight)
            } failure: {
                fallbackAvatar
            }
            .frame(width: 42, height: 42)
            .clipShape(Circle())
            .overlay(Circle().stroke(HayameTheme.cardStroke, lineWidth: 1))
        } else {
            fallbackAvatar
                .frame(width: 42, height: 42)
                .overlay(Circle().stroke(HayameTheme.cardStroke, lineWidth: 1))
        }
    }

    private var fallbackAvatar: some View {
        Circle()
            .fill(HayameTheme.brandLight)
            .overlay(
                Text(initials(from: conversation.participantName))
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)
            )
    }

    private func initials(from name: String) -> String {
        name
            .split(separator: " ")
            .prefix(2)
            .compactMap { $0.first.map(String.init) }
            .joined()
            .uppercased()
    }
}

struct ChatBubble: View {
    let message: ChatMessage

    var body: some View {
        HStack {
            if message.isMine { Spacer(minLength: 40) }

            VStack(alignment: .leading, spacing: 4) {
                if !message.isMine {
                    Text(message.senderName)
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandBlue)
                }
                Text(message.body)
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .foregroundStyle(message.isMine ? .white : HayameTheme.brandNavy)
                if message.isMine {
                    Text(statusText)
                        .font(.system(size: 10, weight: .medium, design: .rounded))
                        .foregroundStyle(statusColor)
                } else {
                    Text(message.createdAt.hayameTimeLabel())
                        .font(.system(size: 10, weight: .medium, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)
                }
            }
            .padding(10)
            .background(message.isMine ? HayameTheme.brandBlue : HayameTheme.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(message.isMine ? Color.clear : HayameTheme.cardStroke, lineWidth: 1)
            )

            if !message.isMine { Spacer(minLength: 40) }
        }
    }

    private var statusText: String {
        switch message.deliveryState {
        case .sending:
            return "Sending..."
        case .failed:
            return "Failed to send"
        case .sent:
            return message.createdAt.hayameTimeLabel()
        }
    }

    private var statusColor: Color {
        switch message.deliveryState {
        case .failed:
            return Color(red: 1, green: 0.86, blue: 0.86)
        case .sending, .sent:
            return .white.opacity(0.8)
        }
    }
}

struct NetworkOrFallbackImage: View {
    let urlString: String?
    var targetSize: CGSize? = nil

    var body: some View {
        if let url = RemoteImageURLResolver.resolve(urlString) {
            CachedRemoteImage(url: url, targetSize: targetSize) {
                progressBackground
            } failure: {
                fallback
            }
        } else {
            fallback
        }
    }

    private var progressBackground: some View {
        ZStack {
            Rectangle().fill(HayameTheme.brandLight)
            ProgressView().tint(HayameTheme.brandBlue)
        }
    }

    private var fallback: some View {
        ZStack {
            Rectangle().fill(HayameTheme.brandLight)
            Image(systemName: "car.fill")
                .font(.system(size: 26, weight: .bold))
                .foregroundStyle(HayameTheme.brandBlue.opacity(0.45))
        }
    }
}

struct EmptyStateView: View {
    let title: String
    let message: String
    let systemImage: String

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: systemImage)
                .font(.system(size: 34, weight: .bold))
                .foregroundStyle(HayameTheme.brandBlue)
            Text(title)
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)
            Text(message)
                .font(.system(size: 13, weight: .medium, design: .rounded))
                .foregroundStyle(HayameTheme.mutedText)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(24)
        .hayameCard()
    }
}

struct InfoLine: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundStyle(HayameTheme.mutedText)
            Spacer()
            Text(value)
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)
        }
    }
}

struct LoadingStateCard: View {
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 10) {
            ProgressView()
                .tint(HayameTheme.brandBlue)
            Text(title)
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)
            Text(message)
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(HayameTheme.mutedText)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(22)
        .hayameCard()
    }
}

struct ErrorStateCard: View {
    let title: String
    let message: String
    let actionTitle: String
    let action: () -> Void

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(HayameTheme.warning)
            Text(title)
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)
            Text(message)
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(HayameTheme.mutedText)
                .multilineTextAlignment(.center)
            Button(actionTitle, action: action)
                .buttonStyle(SecondaryPillButtonStyle())
        }
        .frame(maxWidth: .infinity)
        .padding(22)
        .hayameCard()
    }
}

struct SkeletonBlock: View {
    var width: CGFloat? = nil
    var height: CGFloat
    var cornerRadius: CGFloat = 10

    @State private var shimmerOffset: CGFloat = -160

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .fill(HayameTheme.skeletonBase)
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [.clear, HayameTheme.skeletonHighlight, .clear],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .rotationEffect(.degrees(18))
                    .offset(x: shimmerOffset)
            )
            .frame(width: width, height: height)
            .clipped()
            .onAppear {
                shimmerOffset = -160
                withAnimation(.linear(duration: 1.05).repeatForever(autoreverses: false)) {
                    shimmerOffset = 320
                }
            }
    }
}

struct ListingGridPlaceholderCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            SkeletonBlock(height: 120, cornerRadius: 14)

            VStack(alignment: .leading, spacing: 6) {
                SkeletonBlock(width: 126, height: 14, cornerRadius: 6)
                SkeletonBlock(width: 90, height: 12, cornerRadius: 6)
                HStack {
                    SkeletonBlock(width: 52, height: 10, cornerRadius: 5)
                    Spacer()
                    SkeletonBlock(width: 56, height: 18, cornerRadius: 9)
                }
                SkeletonBlock(width: 88, height: 17, cornerRadius: 6)
            }
        }
        .padding(10)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(HayameTheme.cardStroke, lineWidth: 1)
        )
    }
}

struct ListingRowPlaceholderCard: View {
    var body: some View {
        HStack(spacing: 12) {
            SkeletonBlock(width: 94, height: 72, cornerRadius: 12)

            VStack(alignment: .leading, spacing: 6) {
                SkeletonBlock(width: 150, height: 14, cornerRadius: 6)
                SkeletonBlock(width: 110, height: 12, cornerRadius: 6)
                SkeletonBlock(width: 84, height: 12, cornerRadius: 6)
            }

            Spacer()
        }
        .padding(10)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(HayameTheme.cardStroke, lineWidth: 1)
        )
    }
}

struct HomeNearYouPlaceholderSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                SkeletonBlock(width: 88, height: 18, cornerRadius: 7)
                Spacer()
                SkeletonBlock(width: 48, height: 14, cornerRadius: 6)
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(0..<2, id: \.self) { _ in
                        VStack(alignment: .leading, spacing: 0) {
                            SkeletonBlock(width: 238, height: 154, cornerRadius: 18)

                            VStack(alignment: .leading, spacing: 7) {
                                HStack {
                                    SkeletonBlock(width: 128, height: 15, cornerRadius: 6)
                                    Spacer()
                                    SkeletonBlock(width: 42, height: 18, cornerRadius: 9)
                                }
                                SkeletonBlock(width: 92, height: 12, cornerRadius: 6)
                                SkeletonBlock(width: 104, height: 17, cornerRadius: 6)
                            }
                            .padding(12)
                        }
                        .frame(width: 238)
                        .background(HayameTheme.cardBackground)
                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .stroke(HayameTheme.cardStroke, lineWidth: 1)
                        )
                    }
                }
            }
        }
    }
}

struct HomePopularPicksPlaceholderSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                SkeletonBlock(width: 132, height: 20, cornerRadius: 7)
                Spacer()
                SkeletonBlock(width: 48, height: 14, cornerRadius: 6)
            }

            VStack(spacing: 12) {
                ForEach(0..<3, id: \.self) { _ in
                    HomeFeaturedRowPlaceholderCard()
                }
            }
        }
    }
}

struct HomeFeaturedRowPlaceholderCard: View {
    var body: some View {
        HStack(spacing: 14) {
            SkeletonBlock(width: 136, height: 104, cornerRadius: 14)

            VStack(alignment: .leading, spacing: 8) {
                SkeletonBlock(width: 150, height: 17, cornerRadius: 6)
                SkeletonBlock(width: 176, height: 13, cornerRadius: 6)
                HStack(spacing: 8) {
                    SkeletonBlock(width: 46, height: 18, cornerRadius: 9)
                    SkeletonBlock(width: 66, height: 18, cornerRadius: 9)
                }
                SkeletonBlock(width: 112, height: 18, cornerRadius: 6)
            }

            Spacer(minLength: 0)
            SkeletonBlock(width: 42, height: 42, cornerRadius: 21)
        }
        .padding(12)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(HayameTheme.cardStroke, lineWidth: 1)
        )
    }
}

struct BookingPlaceholderCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                VStack(alignment: .leading, spacing: 6) {
                    SkeletonBlock(width: 132, height: 15, cornerRadius: 6)
                    SkeletonBlock(width: 170, height: 12, cornerRadius: 6)
                }
                Spacer()
                SkeletonBlock(width: 72, height: 22, cornerRadius: 11)
            }

            HStack(spacing: 8) {
                SkeletonBlock(width: 120, height: 11, cornerRadius: 6)
                SkeletonBlock(width: 84, height: 11, cornerRadius: 6)
            }

            HStack(spacing: 10) {
                SkeletonBlock(width: 90, height: 34, cornerRadius: 17)
                SkeletonBlock(width: 90, height: 34, cornerRadius: 17)
            }
        }
        .hayameCard()
    }
}

struct ConversationPlaceholderRow: View {
    var body: some View {
        HStack(spacing: 12) {
            SkeletonBlock(width: 48, height: 48, cornerRadius: 24)

            VStack(alignment: .leading, spacing: 6) {
                SkeletonBlock(width: 118, height: 13, cornerRadius: 6)
                SkeletonBlock(width: 188, height: 11, cornerRadius: 6)
            }

            Spacer()

            SkeletonBlock(width: 34, height: 10, cornerRadius: 5)
        }
        .padding(12)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(HayameTheme.cardStroke, lineWidth: 1)
        )
    }
}

struct HostListingPlaceholderRow: View {
    var body: some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 6) {
                SkeletonBlock(width: 154, height: 14, cornerRadius: 6)
                SkeletonBlock(width: 120, height: 12, cornerRadius: 6)
            }
            Spacer()
            SkeletonBlock(width: 84, height: 20, cornerRadius: 10)
        }
        .padding(.vertical, 8)
    }
}

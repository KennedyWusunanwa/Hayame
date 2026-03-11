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
            absolute = "\(apiBaseURL())\(candidate)"
        } else {
            absolute = "\(apiBaseURL())/\(candidate)"
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
            } else if components.scheme?.lowercased() == "http" {
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

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title.uppercased())
                .font(.system(size: 10, weight: .semibold, design: .rounded))
                .foregroundStyle(HayameTheme.mutedText)
            Text(value)
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .hayameCard()
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
        VStack(alignment: .leading, spacing: 10) {
            ZStack(alignment: .topTrailing) {
                NetworkOrFallbackImage(
                    urlString: car.imageNames.first,
                    targetSize: CGSize(width: 360, height: 220)
                )
                    .frame(height: 120)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

                if showsFavoriteButton {
                    Button(action: favoriteAction) {
                        Image(systemName: isFavorite ? "heart.fill" : "heart")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(isFavorite ? Color.red : HayameTheme.brandNavy)
                            .padding(8)
                            .background(Color.white.opacity(0.9))
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)
                    .padding(8)
                }
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("\(car.title) \(car.year)")
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .lineLimit(1)

                Text("\(car.city), \(car.region)")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)
                    .lineLimit(1)

                HStack(spacing: 8) {
                    Label(String(format: "%.1f", car.rating), systemImage: "star.fill")
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
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
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text("/ day")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandBlue)
                }
            }
        }
        .padding(10)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color.black.opacity(0.05), lineWidth: 1)
        )
    }
}

struct BookingStatusBadge: View {
    let status: BookingStatus

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
        case .pending, .awaitingHost: return HayameTheme.warning.opacity(0.16)
        case .confirmed: return HayameTheme.brandBlue.opacity(0.15)
        case .completed: return HayameTheme.success.opacity(0.16)
        case .cancelled, .rejected, .refunded: return HayameTheme.danger.opacity(0.16)
        }
    }

    private var foreground: Color {
        switch status {
        case .pending, .awaitingHost: return HayameTheme.warning
        case .confirmed: return HayameTheme.brandBlue
        case .completed: return HayameTheme.success
        case .cancelled, .rejected, .refunded: return HayameTheme.danger
        }
    }
}

struct BookingRowCard: View {
    let booking: Booking

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(booking.carTitle)
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text("\(booking.tripUseCity), \(booking.tripUseRegion)")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)
                }
                Spacer()
                BookingStatusBadge(status: booking.status)
            }

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
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color.black.opacity(0.05), lineWidth: 1)
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
            .overlay(Circle().stroke(Color.black.opacity(0.06), lineWidth: 1))
        } else {
            fallbackAvatar
                .frame(width: 42, height: 42)
                .overlay(Circle().stroke(Color.black.opacity(0.06), lineWidth: 1))
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
                Text(message.createdAt.hayameTimeLabel())
                    .font(.system(size: 10, weight: .medium, design: .rounded))
                    .foregroundStyle(message.isMine ? .white.opacity(0.8) : HayameTheme.mutedText)
            }
            .padding(10)
            .background(message.isMine ? HayameTheme.brandBlue : Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(message.isMine ? Color.clear : Color.black.opacity(0.05), lineWidth: 1)
            )

            if !message.isMine { Spacer(minLength: 40) }
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

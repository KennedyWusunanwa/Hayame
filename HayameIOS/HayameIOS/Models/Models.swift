import Foundation

enum UserRole: String, Codable, CaseIterable, Identifiable {
    case guest
    case host
    case admin

    var id: String { rawValue }
}

enum RenterTab: Hashable {
    case home
    case explore
    case trips
    case favorites
    case more
    case inbox
    case profile
    case dashboard
}

enum HostTab: Hashable {
    case dashboard
    case cars
    case bookings
    case earnings
    case inbox
    case profile
}

enum BookingStatus: String, Codable, CaseIterable {
    case pending
    case awaitingHost = "awaiting_host"
    case confirmed
    case completed
    case cancelled
    case rejected
    case refunded

    var label: String {
        switch self {
        case .pending: return "Pending"
        case .awaitingHost: return "Awaiting Host"
        case .confirmed: return "Confirmed"
        case .completed: return "Completed"
        case .cancelled: return "Cancelled"
        case .rejected: return "Rejected"
        case .refunded: return "Refunded"
        }
    }
}

enum PaymentStatus: String, Codable, CaseIterable {
    case pending
    case paid
    case refunded
    case failed
}

enum HostApplicationStatus: String, Codable {
    case draft
    case pending
    case approved
    case rejected
}

struct UserProfile: Identifiable, Hashable {
    let id: String
    var fullName: String
    var email: String
    var phone: String
    var city: String
    var region: String
    var avatar: String?
    var role: UserRole

    static let demoGuest = UserProfile(
        id: "user-001",
        fullName: "Ama Owusu",
        email: "ama@hayame.com",
        phone: "+233 24 555 0001",
        city: "Accra",
        region: "Greater Accra Region",
        avatar: nil,
        role: .guest
    )

    static let anonymousGuest = UserProfile(
        id: "guest-user",
        fullName: "Guest User",
        email: "",
        phone: "",
        city: "",
        region: "",
        avatar: nil,
        role: .guest
    )
}

struct NotificationPreferences: Hashable {
    var bookingUpdates: Bool
    var messages: Bool
    var accountSecurity: Bool
    var newsAnnouncements: Bool

    static let defaults = NotificationPreferences(
        bookingUpdates: true,
        messages: true,
        accountSecurity: true,
        newsAnnouncements: false
    )
}

extension NotificationPreferences {
    init(dto: NotificationPreferencesDTO?) {
        self = NotificationPreferences(
            bookingUpdates: dto?.booking_updates ?? Self.defaults.bookingUpdates,
            messages: dto?.messages ?? Self.defaults.messages,
            accountSecurity: dto?.account_security ?? Self.defaults.accountSecurity,
            newsAnnouncements: dto?.news_announcements ?? Self.defaults.newsAnnouncements
        )
    }
}

struct AppAnnouncement: Identifiable, Hashable {
    let id: String
    var title: String
    var body: String
    var category: String
    var delivery: String
    var audience: String
    var showOnce: Bool
    var ctaLabel: String?
    var ctaURL: String?
    var startsAt: String?
    var endsAt: String?
    var publishedAt: String?
    var seen: Bool

    func shouldDisplay(locallySeen: Set<String>) -> Bool {
        let trimmedID = id.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedBody = body.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedID.isEmpty, !trimmedTitle.isEmpty, !trimmedBody.isEmpty else { return false }
        if !showOnce { return true }
        if seen { return false }
        return !locallySeen.contains(trimmedID)
    }
}

extension AppAnnouncement {
    init?(dto: AppAnnouncementDTO) {
        let resolvedID = dto.id.trimmingCharacters(in: .whitespacesAndNewlines)
        let resolvedTitle = (dto.title ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let resolvedBody = (dto.body ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        guard !resolvedID.isEmpty, !resolvedTitle.isEmpty, !resolvedBody.isEmpty else { return nil }

        self.init(
            id: resolvedID,
            title: resolvedTitle,
            body: resolvedBody,
            category: (dto.category ?? "system").trimmingCharacters(in: .whitespacesAndNewlines),
            delivery: (dto.delivery ?? "in_app").trimmingCharacters(in: .whitespacesAndNewlines),
            audience: (dto.audience ?? "all").trimmingCharacters(in: .whitespacesAndNewlines),
            showOnce: dto.show_once ?? true,
            ctaLabel: dto.cta_label?.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty,
            ctaURL: dto.cta_url?.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty,
            startsAt: dto.starts_at?.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty,
            endsAt: dto.ends_at?.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty,
            publishedAt: dto.published_at?.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty,
            seen: dto.seen ?? false
        )
    }
}

private extension String {
    var nilIfEmpty: String? {
        isEmpty ? nil : self
    }
}

struct Car: Identifiable, Hashable {
    let id: String
    var ownerID: String = ""
    var title: String
    var year: Int
    var brand: String = ""
    var model: String = ""
    var city: String
    var region: String
    var dailyPrice: Int
    var rating: Double
    var reviewsCount: Int
    var type: String
    var transmission: String
    var seats: Int
    var fuelType: String
    var description: String
    var features: [String] = []
    var imageNames: [String]
    var hostName: String
    var hostAvatar: String? = nil
    var hostCity: String? = nil
    var hostVerified: Bool
    var hostPhoneVerified: Bool = false
    var hostEmailVerified: Bool = false
    var hostLevel: String
    var instantBook: Bool
    var deliveryAvailable: Bool
    var airConditioning: Bool
    var deliveryFee: Int = 0
    var insuranceFee: Int = 0
    var depositAmount: Int = 0
    var outsideAccraFee: Int = 0
    var cancellationPolicy: String = "Moderate"
    var approvalStatus: String
    var isAvailable: Bool
    var favoritesCount: Int
    var createdAt: Date = .now
}

extension Car {
    var displayTitle: String {
        let normalizedTitle = Self.normalizeDisplayTitle(title)
        let yearString = String(year)
        guard !normalizedTitle.isEmpty else { return yearString }

        let escapedYear = NSRegularExpression.escapedPattern(for: yearString)
        let yearPattern = "(^|\\D)\(escapedYear)(\\D|$)"
        if normalizedTitle.range(of: yearPattern, options: .regularExpression) != nil {
            return normalizedTitle
        }

        return "\(normalizedTitle) \(yearString)"
    }

    private static func normalizeDisplayTitle(_ rawTitle: String) -> String {
        let normalizedYearSeparators = rawTitle.replacingOccurrences(
            of: #"\b([12]),(\d{3})\b"#,
            with: "$1$2",
            options: .regularExpression
        )
        let compactWhitespace = normalizedYearSeparators.replacingOccurrences(
            of: #"\s+"#,
            with: " ",
            options: .regularExpression
        )
        return compactWhitespace.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

struct Booking: Identifiable, Hashable {
    let id: String
    var carID: String
    var renterID: String = ""
    var hostID: String = ""
    var conversationID: String? = nil
    var carTitle: String
    var renterName: String
    var hostName: String
    var startDate: Date
    var endDate: Date
    var status: BookingStatus
    var paymentStatus: PaymentStatus
    var totalPrice: Int
    var tripUseRegion: String
    var tripUseCity: String
    var tripUseAddress: String
    var tripOutsideAccra: Bool = false
    var dailyRate: Int = 0
    var subtotal: Int = 0
    var platformFee: Int = 0
    var insuranceFee: Int = 0
    var deliveryFee: Int = 0
    var outsideAccraSurcharge: Int = 0
    var depositAmount: Int = 0
    var paymentReference: String? = nil
    var rejectionReason: String? = nil
    var createdAt: Date
}

struct Review: Identifiable, Hashable {
    let id: String
    var carID: String
    var carTitle: String
    var guestName: String
    var rating: Int
    var comment: String
    var createdAt: Date
}

struct Conversation: Identifiable, Hashable {
    let id: String
    var participantID: String? = nil
    var carID: String? = nil
    var participantName: String
    var participantAvatar: String?
    var lastMessagePreview: String
    var updatedAt: Date
    var unreadCount: Int
}

enum ChatMessageDeliveryState: String, Codable, Hashable {
    case sending
    case sent
    case failed
}

struct ChatMessage: Identifiable, Hashable {
    let id: String
    var conversationID: String
    var senderID: String = ""
    var senderName: String
    var body: String
    var isMine: Bool
    var createdAt: Date
    var deliveryState: ChatMessageDeliveryState = .sent
}

struct HostApplication: Identifiable, Hashable {
    let id: String
    var fullName: String
    var phone: String
    var region: String
    var city: String
    var idType: String
    var idNumber: String
    var experience: String
    var fleetSize: Int
    var note: String
    var status: HostApplicationStatus
    var rejectionReason: String?
    var idFrontPath: String = ""
    var idBackPath: String = ""
    var facePhotoURL: String? = nil
}

struct ListingDraft: Hashable, Codable {
    var id: String?
    var title: String = ""
    var brand: String = ""
    var model: String = ""
    var year: Int = Calendar.current.component(.year, from: Date())
    var price: Int = 300
    var region: String = ""
    var city: String = ""
    var carType: String = ""
    var transmission: String = "Automatic"
    var fuelType: String = "Petrol"
    var seats: Int = 5
    var description: String = ""
    var instantBook: Bool = false
    var deliveryAvailable: Bool = false
    var airConditioning: Bool = true
    var deliveryFee: Int = 0
    var insuranceFee: Int = 0
    var depositAmount: Int = 0
    var outsideAccraFee: Int = 0
    var cancellationPolicy: String = "Moderate"
}

struct ExploreFilterState: Hashable {
    var region: String = ""
    var city: String = ""
    var carType: String = ""
    var brand: String = ""
    var model: String = ""
    var fuelType: String = ""
    var transmission: String = ""
    var minPrice: Int = 50
    var maxPrice: Int = 5000
    var minSeats: Int = 2
    var minYear: Int = 2000
    var instantBookOnly: Bool = false
    var deliveryOnly: Bool = false
    var acOnly: Bool = false
    var minRating: Double = 0
}

struct PaystackCheckoutSession: Hashable {
    let bookingID: String
    let carID: String
    let startDate: String
    let endDate: String
    let tripUseRegion: String
    let tripUseCity: String
    let tripUseAddress: String
    let reference: String
    let amountMinor: Int
    let authorizationURL: String
}

enum HostAccessState: Equatable {
    case unknown
    case renter
    case pending
    case host
}

enum ViewLoadState: Equatable {
    case idle
    case loading
    case loaded
    case empty
    case error(String)
}

struct CarListingPhoto: Identifiable, Hashable {
    let id: String
    var url: String
}

struct AvailabilitySnapshot: Hashable {
    var blockedDates: [String] = []
    var available: Bool = true
    var reason: String? = nil
}

struct ReferenceDataCatalog: Hashable {
    var regionsByCity: [String: [String]] = [:]
    var makes: [String] = []
    var modelsByMake: [String: [String]] = [:]
}

extension Booking {
    var nights: Int {
        let value = Calendar.current.dateComponents([.day], from: startDate, to: endDate).day ?? 0
        return max(1, value)
    }
}

extension Date {
    func hayameDateLabel() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "dd/MM/yyyy"
        return formatter.string(from: self)
    }

    func hayameTimeLabel() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return formatter.string(from: self)
    }
}

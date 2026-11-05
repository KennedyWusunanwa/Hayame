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

enum BookingDisplayContext {
    case renter
    case host
}

enum BookingDisplayStatus: Equatable {
    case pending
    case confirmed
    case ongoing
    case completed
    case cancelled
    case rejected
    case refunded

    var label: String {
        switch self {
        case .pending: return "Pending"
        case .confirmed: return "Confirmed"
        case .ongoing: return "Ongoing"
        case .completed: return "Completed"
        case .cancelled: return "Cancelled"
        case .rejected: return "Rejected"
        case .refunded: return "Refunded"
        }
    }

    func helperText(
        for context: BookingDisplayContext,
        paymentStatus: PaymentStatus? = nil
    ) -> String {
        switch self {
        case .pending:
            switch context {
            case .renter:
                return "Waiting for host confirmation."
            case .host:
                return paymentStatus == .paid
                    ? "Review this request and decide what happens next."
                    : "Waiting for renter payment before approval."
            }
        case .confirmed:
            switch context {
            case .renter:
                return "Your trip is confirmed. Get ready."
            case .host:
                return "Booking confirmed. Prepare for handoff."
            }
        case .ongoing:
            switch context {
            case .renter:
                return "Your trip is in progress."
            case .host:
                return "Trip is in progress."
            }
        case .completed:
            return "Trip completed successfully."
        case .cancelled:
            return "This booking was cancelled."
        case .rejected:
            return "This booking was rejected."
        case .refunded:
            return "This booking was refunded."
        }
    }
}

enum PaymentStatus: String, Codable, CaseIterable {
    case pending
    case paid
    case refunded
    case failed
}

enum BookingTripMode: String, Codable, CaseIterable, Identifiable {
    case pickup
    case delivery

    var id: String { rawValue }

    var label: String {
        switch self {
        case .pickup: return "Pickup"
        case .delivery: return "Delivery"
        }
    }

    var subtitle: String {
        switch self {
        case .pickup:
            return "Pick up the car at the listing area and save the delivery fee."
        case .delivery:
            return "Have the host bring the car to your preferred handoff point."
        }
    }

    var helperTitle: String {
        switch self {
        case .pickup: return "Pickup"
        case .delivery: return "Delivery"
        }
    }

    var helperMessage: String {
        switch self {
        case .pickup:
            return "Pickup means you meet at the listing area and no delivery fee is charged."
        case .delivery:
            return "Delivery means the host brings the car to you. Add the exact address, preferred time, and a contact number."
        }
    }
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

    func shouldDisplay(locallySeen: Set<String>, installedAfter: Date? = nil) -> Bool {
        let trimmedID = id.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedBody = body.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedID.isEmpty, !trimmedTitle.isEmpty, !trimmedBody.isEmpty else { return false }
        if delivery.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() != "push",
           let installedAfter {
            guard let publishedDate else { return false }
            guard publishedDate >= installedAfter else { return false }
        }
        if !showOnce { return true }
        if seen { return false }
        return !locallySeen.contains(trimmedID)
    }

    private var publishedDate: Date? {
        Self.dateWithFractionalSeconds.date(from: publishedAt ?? "") ??
            Self.dateWithoutFractionalSeconds.date(from: publishedAt ?? "")
    }

    private static let dateWithFractionalSeconds: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    private static let dateWithoutFractionalSeconds: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()
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
    var latitude: Double? = nil
    var longitude: Double? = nil
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
    /// Hosts opt in to single-day trips; off means a 2-day minimum.
    var allowOneDayBooking: Bool = false
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
    /// Shortest trip this listing accepts, in days. Mirrors the server rule.
    var minimumTripDays: Int { allowOneDayBooking ? 1 : 2 }

    var isNewListing: Bool {
        let sevenDays: TimeInterval = 7 * 24 * 60 * 60
        let age = Date().timeIntervalSince(createdAt)
        return age >= 0 && age <= sevenDays
    }

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

func buildListingTitle(
    brand: String?,
    model: String?,
    carYear: Int?
) -> String? {
    let normalizedBrand = normalizeListingTitleComponent(brand)
    let normalizedModel = normalizeListingTitleComponent(model)
    let normalizedYear: String
    if let carYear, carYear > 0 {
        normalizedYear = String(carYear)
    } else {
        normalizedYear = ""
    }

    guard !normalizedBrand.isEmpty, !normalizedModel.isEmpty, !normalizedYear.isEmpty else {
        return nil
    }

    return "\(normalizedBrand) \(normalizedModel) \(normalizedYear)"
}

func buildListingTitlePreview(
    brand: String?,
    model: String?,
    carYear: Int?
) -> String {
    buildListingTitle(brand: brand, model: model, carYear: carYear) ?? "Select brand, model and year"
}

private func normalizeListingTitleComponent(_ rawValue: String?) -> String {
    let trimmed = (rawValue ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return "" }
    return trimmed.replacingOccurrences(
        of: #"\s+"#,
        with: " ",
        options: .regularExpression
    )
}

struct Booking: Identifiable, Hashable {
    let id: String
    var carID: String
    var renterID: String = ""
    var hostID: String = ""
    var conversationID: String? = nil
    var carTitle: String
    var carBrand: String = ""
    var carImageNames: [String] = []
    var renterName: String
    var hostName: String
    var startDate: Date
    var endDate: Date
    var status: BookingStatus
    var paymentStatus: PaymentStatus
    var totalPrice: Int
    var deliveryAddress: String = ""
    var deliveryTime: String = ""
    var contactPhone: String = ""
    var deliveryNotes: String = ""
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

extension Booking {
    var displayStatus: BookingDisplayStatus {
        switch status {
        case .completed:
            return .completed
        case .cancelled:
            return .cancelled
        case .rejected:
            return .rejected
        case .refunded:
            return .refunded
        case .confirmed:
            let now = Date()
            if now >= endDate {
                return .completed
            }
            if now >= startDate && now < endDate {
                return .ongoing
            }
            return .confirmed
        case .pending, .awaitingHost:
            return .pending
        }
    }

    var shouldShowCompletedPaidBadge: Bool {
        displayStatus == .completed && paymentStatus == .paid
    }
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
    var allowOneDayBooking: Bool = false
    var airConditioning: Bool = true
    var deliveryFee: Int = 0
    var insuranceFee: Int = 0
    var depositAmount: Int = 0
    var outsideAccraFee: Int = 0
    var cancellationPolicy: String = "Moderate"
}

struct BookingDeliveryDetails: Hashable, Codable {
    var address: String = ""
    var time: String = ""
    var contactPhone: String = ""
    var notes: String = ""
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

// MARK: - Resumable checkout

/// One thing that would stop a saved checkout from going ahead today, as the
/// server reports it (car paused, dates taken, start date passed, ...).
struct CheckoutIssue: Hashable, Codable {
    let code: String
    let message: String
}

/// The authoritative total for a saved checkout, computed server-side with the
/// same formula Paystack is charged with.
struct CheckoutPricing: Hashable, Codable {
    var nights: Int = 1
    var dailyRate: Int = 0
    var subtotal: Int = 0
    var platformFee: Int = 0
    var insuranceFee: Int = 0
    var deliveryFee: Int = 0
    var outsideAccraSurcharge: Int = 0
    var depositAmount: Int = 0
    var total: Int = 0
    var amountMinor: Int = 0
}

/// A checkout the renter started paying for and did not finish. Lives on the
/// server as the held booking row, so it survives app restarts and devices.
struct PendingCheckout: Identifiable, Hashable {
    enum HoldState: String, Hashable {
        case held
        case expired
    }

    let id: String
    var carID: String
    var state: HoldState
    var holdExpiresAt: Date?
    var createdAt: Date?
    var startDate: Date
    var endDate: Date
    var startDateString: String
    var endDateString: String
    var nights: Int
    var tripMode: BookingTripMode
    var tripUseRegion: String
    var tripUseCity: String
    var tripUseAddress: String
    var delivery: BookingDeliveryDetails
    var carTitle: String
    var carImageURL: String?
    var carDailyPrice: Int
    var carCity: String
    var carRegion: String
    var carInstantBook: Bool
    var carDeliveryAvailable: Bool
    var hostName: String
    var pricing: CheckoutPricing
    var issues: [CheckoutIssue]
    var canResume: Bool
    var paymentReference: String?

    var bookingID: String { id }

    var isHeld: Bool {
        guard state == .held, let holdExpiresAt else { return false }
        return holdExpiresAt > Date()
    }

    /// Minimal `Car` so views built around a listing (success stage, checkout
    /// sheet) can render even when the full listing is not in memory.
    func placeholderCar() -> Car {
        Car(
            id: carID,
            title: carTitle,
            year: 2020,
            city: carCity,
            region: carRegion,
            dailyPrice: carDailyPrice,
            rating: 0,
            reviewsCount: 0,
            type: "Car",
            transmission: "Automatic",
            seats: 4,
            fuelType: "Petrol",
            description: "",
            imageNames: [carImageURL].compactMap { $0 },
            hostName: hostName,
            hostVerified: false,
            hostLevel: "Host",
            instantBook: carInstantBook,
            deliveryAvailable: carDeliveryAvailable,
            airConditioning: false,
            deliveryFee: pricing.deliveryFee,
            insuranceFee: pricing.insuranceFee,
            depositAmount: pricing.depositAmount,
            outsideAccraFee: pricing.outsideAccraSurcharge,
            approvalStatus: "approved",
            isAvailable: true,
            favoritesCount: 0
        )
    }
}

/// Selections the renter made in the checkout sheet before paying, kept on
/// this device so closing the sheet never throws their work away.
struct CheckoutDraft: Hashable, Codable {
    var userID: String
    var carID: String
    var carTitle: String
    var carImageURL: String?
    var dailyPrice: Int
    var startDate: String
    var endDate: String
    var region: String
    var city: String
    var address: String
    var tripMode: BookingTripMode?
    var delivery: BookingDeliveryDetails
    var step: Int
    var updatedAt: Date
}

/// Whatever the renter can pick back up: a server-held checkout wins over a
/// local draft because it already carries a booking id and the live price.
enum ResumableCheckout: Hashable, Identifiable {
    case held(PendingCheckout)
    case draft(CheckoutDraft)

    var id: String {
        switch self {
        case .held(let checkout): return "held-\(checkout.id)"
        case .draft(let draft): return "draft-\(draft.carID)-\(draft.startDate)"
        }
    }

    var carID: String {
        switch self {
        case .held(let checkout): return checkout.carID
        case .draft(let draft): return draft.carID
        }
    }

    var carTitle: String {
        switch self {
        case .held(let checkout): return checkout.carTitle
        case .draft(let draft): return draft.carTitle
        }
    }

    var carImageURL: String? {
        switch self {
        case .held(let checkout): return checkout.carImageURL
        case .draft(let draft): return draft.carImageURL
        }
    }

    var tripMode: BookingTripMode {
        switch self {
        case .held(let checkout): return checkout.tripMode
        case .draft(let draft): return draft.tripMode ?? .pickup
        }
    }

    var heldCheckout: PendingCheckout? {
        if case .held(let checkout) = self { return checkout }
        return nil
    }

    var draft: CheckoutDraft? {
        if case .draft(let draft) = self { return draft }
        return nil
    }
}

/// What the server decided when the renter asked to resume.
enum CheckoutResumeOutcome: Hashable {
    /// Hold refreshed; the price and options are current and payment can start.
    case ready(PendingCheckout)
    /// Something changed (dates taken, car paused, ...). Issues explain what.
    case blocked(PendingCheckout)
    /// The earlier payment had gone through; the booking is already in Trips.
    case completed(bookingID: String, conversationID: String?)
}

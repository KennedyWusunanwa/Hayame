import Foundation
import SwiftUI
import UIKit

private let wrongEmailOrPasswordMessage = "Wrong email or password."
private let missingLoginFieldsMessage = "Enter your email and password."

enum ExploreSortOption: String, CaseIterable, Identifiable {
    case recommended = "Recommended"
    case priceLow = "Price: Low to High"
    case priceHigh = "Price: High to Low"
    case topRated = "Top Rated"
    case newest = "Newest"

    var id: String { rawValue }
}

enum ExploreLayoutMode: String, CaseIterable, Identifiable {
    case list
    case grid

    var id: String { rawValue }
}

@MainActor
final class AppState: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isGuestMode = false
    @Published var currentUser = UserProfile.anonymousGuest

    @Published var renterTab: RenterTab = .home
    @Published var hostTab: HostTab = .dashboard
    @Published var appearanceSettingsHighlightToken = 0

    @Published var cars: [Car] = []
    @Published var ownedCars: [Car] = []
    @Published var favoriteCarIDs: Set<String> = []

    @Published var renterBookings: [Booking] = []
    @Published var hostBookings: [Booking] = []

    @Published var hostReviews: [Review] = []
    @Published var listingReviewsByCarID: [String: [Review]] = [:]

    @Published var conversations: [Conversation] = []
    @Published var messagesByConversation: [String: [ChatMessage]] = [:]
    @Published var pendingConversationID: String?
    @Published var pendingConversationParticipantName: String?
    @Published var pendingBookingID: String?

    @Published var exploreSearchText = ""
    @Published var exploreFilters = ExploreFilterState()
    @Published var exploreSortOption: ExploreSortOption = .recommended
    @Published private(set) var exploreLayoutMode: ExploreLayoutMode = .list

    @Published var hostApplication: HostApplication?
    @Published var hostAccessState: HostAccessState = .unknown
    @Published var hostModeEnabled = false
    @Published var hostApplicationStatus: String?
    @Published var publicCarsLoadState: ViewLoadState = .idle
    @Published var bookingsLoadState: ViewLoadState = .idle
    @Published var conversationsLoadState: ViewLoadState = .idle
    @Published var favoritesLoadState: ViewLoadState = .idle
    @Published var referenceData = ReferenceDataCatalog()

    @Published var apiBaseURL: String = AppState.defaultAPIBaseURL()
    @Published var isSyncingRemote = false
    @Published var syncErrorMessage: String?
    @Published var loginErrorAlertMessage: String?
    @Published var authInfoMessage: String?
    @Published var signupConfirmationPromptMessage: String?
    @Published var paymentFlowNotice: String?
    @Published var paymentFlowNoticeIsError = false
    @Published var notificationPreferences = NotificationPreferences.defaults
    @Published var activeAnnouncement: AppAnnouncement?
    @Published var darkModeEnabled = false
    @Published var listingEditorActive = false

    private let api = APIClient.shared
    private let defaults = UserDefaults.standard

    private let authTokenKey = "hayame.auth_token"
    private let refreshTokenKey = "hayame.refresh_token"
    private let apiBaseURLKey = "hayame.api_base_url"
    private let cachedUserNameKey = "hayame.cached_user_name"
    private let cachedUserAvatarKey = "hayame.cached_user_avatar"
    private let seenAnnouncementIDsKey = "hayame.seen_announcement_ids"
    private let firstLaunchAtKey = "hayame.first_launch_at"
    private let darkModeKey = "hayame.dark_mode_enabled"
    private let exploreLayoutModeKey = "hayame.explore_layout_mode"

    private var authToken: String?
    private var refreshToken: String?
    private var pollTask: Task<Void, Never>?
    private var conversationRealtimeTask: Task<Void, Never>?
    private var pushTokenObserver: NSObjectProtocol?
    private var pushRegistrationFailureObserver: NSObjectProtocol?
    private var pushNotificationRouteObserver: NSObjectProtocol?
    private var appDidBecomeActiveObserver: NSObjectProtocol?
    private var hasSyncedOwnedCarsOnce = false
    private var hasSyncedBookingsOnce = false
    private var hasSyncedConversationsOnce = false
    private var isSyncingCars = false
    private var isSyncingConversations = false
    private var loadingConversationIDs: Set<String> = []
    private var pendingMessageDraftByConversationID: [String: String] = [:]
    private var lastServerMessageDateByConversationID: [String: Date] = [:]
    private var pendingAnnouncements: [AppAnnouncement] = []
    private var deferredPushNotificationRoute: PushNotificationRoute?
    private let localMessagePrefix = "local-msg-"

    static let iso8601WithFractional: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    static let iso8601Basic: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()

    static let dateOnlyFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
    static let productionBaseURL = "https://www.hayamegh.com"

    #if DEBUG
    static var isScreenshotMode: Bool {
        ProcessInfo.processInfo.arguments.contains("-HAYAME_SCREENSHOT_ROUTE")
    }

    private static var screenshotDarkModeEnabled: Bool {
        if let theme = screenshotArgumentValue(for: "-HAYAME_SCREENSHOT_THEME")?.lowercased() {
            return theme == "dark"
        }
        return ProcessInfo.processInfo.arguments.contains("-HAYAME_SCREENSHOT_DARK")
    }

    private static func screenshotArgumentValue(for key: String) -> String? {
        let args = ProcessInfo.processInfo.arguments
        guard let index = args.firstIndex(of: key), args.indices.contains(index + 1) else {
            return nil
        }
        return args[index + 1].trimmingCharacters(in: .whitespacesAndNewlines)
    }
    #endif

    init() {
        ensureFirstLaunchTimestamp()

        #if DEBUG
        if Self.isScreenshotMode {
            configureForScreenshots()
            return
        }
        #endif

        if let persistedBaseURL = defaults.string(forKey: apiBaseURLKey) {
            let trimmed = persistedBaseURL.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty {
                let persisted = Self.canonicalBaseURL(trimmed)
                if Self.isLoopbackBaseURL(persisted) && !Self.isLoopbackBaseURL(apiBaseURL) {
                    defaults.removeObject(forKey: apiBaseURLKey)
                } else {
                    apiBaseURL = persisted
                }
            }
        }
        darkModeEnabled = defaults.bool(forKey: darkModeKey)
        if let rawLayout = defaults.string(forKey: exploreLayoutModeKey),
           let persistedLayout = ExploreLayoutMode(rawValue: rawLayout) {
            exploreLayoutMode = persistedLayout
        }
        migrateLoopbackBaseURLIfNeeded()
        restorePersistedSession()
        pushTokenObserver = NotificationCenter.default.addObserver(
            forName: .hayameDidRegisterPushToken,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            guard let self else { return }
            Task { @MainActor in
                await self.registerPushDeviceTokenIfAvailable()
            }
        }
        pushRegistrationFailureObserver = NotificationCenter.default.addObserver(
            forName: .hayamePushRegistrationFailed,
            object: nil,
            queue: .main
        ) { [weak self] note in
            guard let self else { return }
            let message = (note.userInfo?["error"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
            let lowered = (message ?? "").lowercased()
            let isExpectedUnavailableCase =
                lowered.contains("aps-environment") ||
                lowered.contains("entitlement") ||
                lowered.contains("does not support remote notifications")
            if isExpectedUnavailableCase {
                return
            }
            Task { @MainActor in
                if let message, !message.isEmpty {
                    self.syncErrorMessage = "Push registration failed: \(message)"
                } else {
                    self.syncErrorMessage = "Push registration failed."
                }
            }
        }
        pushNotificationRouteObserver = NotificationCenter.default.addObserver(
            forName: .hayameDidOpenPushNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            guard let self else { return }
            Task { @MainActor in
                self.routePendingPushNotificationIfNeeded()
            }
        }
        appDidBecomeActiveObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            guard let self else { return }
            Task { @MainActor in
                await self.refreshActiveAnnouncements()
            }
        }
        routePendingPushNotificationIfNeeded()
        Task {
            async let referenceTask: Void = refreshReferenceData()
            async let publicCarsTask: Void = syncPublicCars()
            async let bootstrapTask: Void = bootstrapSessionIfNeeded()
            async let announcementTask: Void = refreshActiveAnnouncements()
            _ = await (referenceTask, publicCarsTask, bootstrapTask, announcementTask)
        }
    }

    #if DEBUG
    private func configureForScreenshots() {
        stopPolling()
        stopRealtimeMessages()
        darkModeEnabled = Self.screenshotDarkModeEnabled
        apiBaseURL = Self.productionBaseURL
        isAuthenticated = true
        isGuestMode = false
        currentUser = .demoGuest
        currentUser.role = .guest
        renterTab = .home
        hostTab = .dashboard
        hostAccessState = .renter
        hostModeEnabled = false

        cars = []
        ownedCars = []
        favoriteCarIDs = []
        renterBookings = []
        hostBookings = []
        hostReviews = []
        listingReviewsByCarID = [:]
        conversations = MockDataService.conversations
        messagesByConversation = MockDataService.messagesByConversation
        notificationPreferences = .defaults
        activeAnnouncement = nil
        syncErrorMessage = nil
        authInfoMessage = nil
        paymentFlowNotice = "Payment started. Your booking will appear here after checkout."
        paymentFlowNoticeIsError = false

        publicCarsLoadState = .loading
        bookingsLoadState = .loaded
        conversationsLoadState = .loaded
        favoritesLoadState = .loaded
    }

    func prepareScreenshotLiveData() async -> Bool {
        guard Self.isScreenshotMode else { return true }

        if case .loaded = publicCarsLoadState, !cars.isEmpty {
            return true
        }

        publicCarsLoadState = .loading
        syncErrorMessage = nil
        await syncPublicCars()

        let liveCarsWithPhotos = cars.filter { car in
            RemoteImageURLResolver.resolve(car.imageNames.first) != nil
        }

        guard !liveCarsWithPhotos.isEmpty else {
            syncErrorMessage = "No live listings with photos were returned from the database."
            cars = []
            publicCarsLoadState = .error(syncErrorMessage ?? "No live listings with photos were returned from the database.")
            return false
        }

        cars = liveCarsWithPhotos
        publicCarsLoadState = .loaded
        favoriteCarIDs = Set(liveCarsWithPhotos.prefix(2).map(\.id))
        renterBookings = Self.screenshotRenterBookings(from: liveCarsWithPhotos)
        bookingsLoadState = renterBookings.isEmpty ? .empty : .loaded
        favoritesLoadState = favoriteCarIDs.isEmpty ? .empty : .loaded

        await warmScreenshotImages(for: liveCarsWithPhotos)
        return true
    }

    /// Synchronously warms the in-memory image cache for every size the
    /// screenshot routes actually request (the cache key is `url#pixelWxpixelH`,
    /// so each display size needs its own entry). Blocks until the real listing
    /// photos are decoded and cached, so screens never render with empty/spinner
    /// image slots.
    private func warmScreenshotImages(for cars: [Car]) async {
        let scale = UIScreen.main.scale
        func px(_ width: CGFloat, _ height: CGFloat) -> CGSize {
            CGSize(width: width * scale, height: height * scale)
        }

        // Sizes requested by home / explore / trips / favorites list & grid cards.
        let listSizes = [px(520, 320), px(420, 300), px(320, 240), px(188, 144), px(180, 140)]
        // Sizes requested by the car-detail hero, booking hero, and detail thumbnails.
        let detailSizes = [px(900, 620), px(1206, 874), px(156, 112)]

        var work: [(url: URL, pixelSize: CGSize?)] = []

        for car in cars.prefix(8) {
            guard let url = RemoteImageURLResolver.resolve(car.imageNames.first) else { continue }
            for size in listSizes {
                work.append((url, size))
            }
        }

        if let detailCar = cars.first {
            for name in detailCar.imageNames.prefix(6) {
                guard let url = RemoteImageURLResolver.resolve(name) else { continue }
                for size in detailSizes {
                    work.append((url, size))
                }
            }
        }

        guard !work.isEmpty else { return }
        await RemoteImagePipeline.shared.warm(work, maxConcurrent: 6)
    }

    private static func screenshotRenterBookings(from cars: [Car]) -> [Booking] {
        cars.prefix(2).enumerated().map { index, car in
            let start = Calendar.current.date(byAdding: .day, value: index == 0 ? 2 : -15, to: .now) ?? .now
            let end = Calendar.current.date(byAdding: .day, value: index == 0 ? 5 : -12, to: .now) ?? .now
            let nights = max(1, Calendar.current.dateComponents([.day], from: start, to: end).day ?? 1)
            let subtotal = car.dailyPrice * nights
            let platformFee = Int(Double(subtotal) * 0.10)
            let deliveryFee = index == 0 && car.deliveryAvailable ? max(car.deliveryFee, 0) : 0
            let insuranceFee = max(car.insuranceFee, 0)
            let depositAmount = max(car.depositAmount, 0)
            var value = Booking(
                id: "shot-booking-\(index + 1)",
                carID: car.id,
                renterID: UserProfile.demoGuest.id,
                hostID: car.ownerID.isEmpty ? "live-host-\(index + 1)" : car.ownerID,
                conversationID: MockDataService.conversations.indices.contains(index) ? MockDataService.conversations[index].id : nil,
                carTitle: car.displayTitle,
                carBrand: car.brand,
                carImageNames: car.imageNames,
                renterName: UserProfile.demoGuest.fullName,
                hostName: car.hostName,
                startDate: start,
                endDate: end,
                status: index == 0 ? .confirmed : .completed,
                paymentStatus: .paid,
                totalPrice: subtotal + platformFee + deliveryFee + insuranceFee + depositAmount,
                deliveryAddress: index == 0 && car.deliveryAvailable ? "22 Airport Bypass, Accra" : "",
                deliveryTime: index == 0 && car.deliveryAvailable ? "10:00" : "",
                contactPhone: index == 0 && car.deliveryAvailable ? UserProfile.demoGuest.phone : "",
                deliveryNotes: index == 0 && car.deliveryAvailable ? "Meet at the main gate." : "",
                tripUseRegion: car.region,
                tripUseCity: car.city,
                tripUseAddress: index == 0 ? "Airport Residential" : car.city,
                dailyRate: car.dailyPrice,
                subtotal: subtotal,
                platformFee: platformFee,
                insuranceFee: insuranceFee,
                deliveryFee: deliveryFee,
                depositAmount: depositAmount,
                paymentReference: "HYM-LIVE-\(index + 1)",
                createdAt: Calendar.current.date(byAdding: .day, value: index == 0 ? -2 : -20, to: .now) ?? .now
            )
            value.deliveryAddress = index == 0 ? "22 Airport Bypass, Accra" : ""
            return value
        }
    }

    private static func screenshotAvailabilitySnapshot(start: Date) -> AvailabilitySnapshot {
        let formatter = Self.dateOnlyFormatter
        let calendar = Calendar.current
        let blocked = [3, 4, 9, 16, 23].compactMap { offset in
            calendar.date(byAdding: .day, value: offset, to: start).map(formatter.string(from:))
        }
        return AvailabilitySnapshot(blockedDates: blocked, available: true, reason: nil)
    }
    #endif

    var isHostApproved: Bool {
        hostAccessState == .host
    }

    var isHostPending: Bool {
        hostAccessState == .pending
    }

    var hasAppAccess: Bool {
        isAuthenticated || isGuestMode
    }

    var canPresentActiveAnnouncement: Bool {
        guard hasAppAccess else { return false }
        if isAuthenticated, hostAccessState == .host, hostModeEnabled {
            return hostTab == .dashboard
        }
        return renterTab == .home
    }

    var hostCars: [Car] {
        if !ownedCars.isEmpty {
            return ownedCars
        }
        return cars.filter { $0.ownerID == currentUser.id || $0.hostName == currentUser.fullName }
    }

    var unreadMessagesCount: Int {
        conversations.reduce(0) { $0 + $1.unreadCount }
    }

    var favoriteCars: [Car] {
        cars.filter { favoriteCarIDs.contains($0.id) }
    }

    var filteredCars: [Car] {
        let search = exploreSearchText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()

        var result = cars.filter { car in
            if !car.isAvailable || car.approvalStatus.lowercased() != "approved" { return false }

            if !search.isEmpty {
                let searchable = [
                    car.title,
                    car.city,
                    car.region,
                    car.type,
                    car.hostName,
                    car.description,
                    car.transmission,
                    car.fuelType
                ]
                .joined(separator: " ")
                .lowercased()
                if !searchable.contains(search) { return false }
            }

            if !exploreFilters.region.isEmpty &&
                MockDataService.normalizedRegion(car.region).caseInsensitiveCompare(MockDataService.normalizedRegion(exploreFilters.region)) != .orderedSame {
                return false
            }
            if !exploreFilters.city.isEmpty &&
                !MockDataService.cityMatches(car.city, selected: exploreFilters.city) {
                return false
            }
            if !exploreFilters.carType.isEmpty && car.type != exploreFilters.carType { return false }
            if !exploreFilters.fuelType.isEmpty && car.fuelType != exploreFilters.fuelType { return false }
            if !exploreFilters.transmission.isEmpty && car.transmission != exploreFilters.transmission { return false }
            if car.dailyPrice < exploreFilters.minPrice || car.dailyPrice > exploreFilters.maxPrice { return false }
            if car.seats < exploreFilters.minSeats { return false }
            if car.year < exploreFilters.minYear { return false }
            if exploreFilters.instantBookOnly && !car.instantBook { return false }
            if exploreFilters.deliveryOnly && !car.deliveryAvailable { return false }
            if exploreFilters.acOnly && !car.airConditioning { return false }
            if car.rating < exploreFilters.minRating { return false }

            if !exploreFilters.brand.isEmpty &&
                car.brand.caseInsensitiveCompare(exploreFilters.brand) != .orderedSame {
                return false
            }
            if !exploreFilters.model.isEmpty &&
                car.model.caseInsensitiveCompare(exploreFilters.model) != .orderedSame {
                return false
            }

            return true
        }

        switch exploreSortOption {
        case .recommended:
            result.sort { lhs, rhs in
                if lhs.instantBook != rhs.instantBook {
                    return lhs.instantBook && !rhs.instantBook
                }
                return lhs.rating > rhs.rating
            }
        case .priceLow:
            result.sort { $0.dailyPrice < $1.dailyPrice }
        case .priceHigh:
            result.sort { $0.dailyPrice > $1.dailyPrice }
        case .topRated:
            result.sort { $0.rating > $1.rating }
        case .newest:
            result.sort { $0.year > $1.year }
        }

        return result
    }

    func signIn(email: String, password: String, onSuccess: @escaping () -> Void = {}) {
        let normalizedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalizedEmail.isEmpty, !password.isEmpty else {
            loginErrorAlertMessage = missingLoginFieldsMessage
            return
        }
        Task { await signInRemote(email: normalizedEmail, password: password, onSuccess: onSuccess) }
    }

    func signUp(firstName: String, lastName: String, email: String, city: String, region: String, password: String) {
        guard !firstName.isEmpty, !lastName.isEmpty, !email.isEmpty, !password.isEmpty else { return }
        Task {
            await signUpRemote(
                firstName: firstName,
                lastName: lastName,
                email: email,
                city: city,
                region: region,
                password: password
            )
        }
    }

    func resendSignupConfirmation(email: String) {
        let normalizedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !normalizedEmail.isEmpty else {
            syncErrorMessage = "Enter your email to resend verification."
            return
        }
        Task {
            await resendSignupConfirmationRemote(email: normalizedEmail)
        }
    }

    func requestPasswordReset(email: String) {
        let normalizedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !normalizedEmail.isEmpty else {
            syncErrorMessage = "Enter your email to reset password."
            return
        }
        Task {
            await requestPasswordResetRemote(email: normalizedEmail)
        }
    }

    func consumeSignupConfirmationPrompt() {
        signupConfirmationPromptMessage = nil
    }

    func consumeLoginErrorAlert() {
        loginErrorAlertMessage = nil
    }

    func signOut() {
        let authTokenSnapshot = authToken
        let baseURLSnapshot = apiBaseURL
        let deviceTokenSnapshot = NotificationManager.shared.lastUploadedPushToken ?? NotificationManager.shared.apnsDeviceToken
        unregisterPushDeviceTokenIfPossible(
            authToken: authTokenSnapshot,
            baseURL: baseURLSnapshot,
            deviceToken: deviceTokenSnapshot
        )
        stopPolling()
        stopRealtimeMessages()
        clearPersistedSession()
        NotificationManager.shared.clearPushRegistrationState()
        isAuthenticated = false
        isGuestMode = false
        currentUser = .anonymousGuest
        renterTab = .home
        hostTab = .dashboard
        favoriteCarIDs = []
        renterBookings = []
        hostBookings = []
        hostReviews = []
        listingReviewsByCarID = [:]
        conversations = []
        messagesByConversation = [:]
        lastServerMessageDateByConversationID = [:]
        loadingConversationIDs = []
        pendingConversationID = nil
        pendingConversationParticipantName = nil
        pendingBookingID = nil
        pendingMessageDraftByConversationID = [:]
        deferredPushNotificationRoute = nil
        hostApplication = nil
        hostApplicationStatus = nil
        hostAccessState = .unknown
        hostModeEnabled = false
        ownedCars = []
        syncErrorMessage = nil
        authInfoMessage = nil
        signupConfirmationPromptMessage = nil
        paymentFlowNotice = nil
        paymentFlowNoticeIsError = false
        resetAnnouncementState()
        hasSyncedOwnedCarsOnce = false
        hasSyncedBookingsOnce = false
        hasSyncedConversationsOnce = false
        bookingsLoadState = .idle
        conversationsLoadState = .idle
        favoritesLoadState = .idle

        Task {
            await syncPublicCars()
            await refreshActiveAnnouncements()
        }
    }

    func continueAsGuest() {
        let authTokenSnapshot = authToken
        let baseURLSnapshot = apiBaseURL
        let deviceTokenSnapshot = NotificationManager.shared.lastUploadedPushToken ?? NotificationManager.shared.apnsDeviceToken
        unregisterPushDeviceTokenIfPossible(
            authToken: authTokenSnapshot,
            baseURL: baseURLSnapshot,
            deviceToken: deviceTokenSnapshot
        )
        stopPolling()
        stopRealtimeMessages()
        clearPersistedSession()
        NotificationManager.shared.clearPushRegistrationState()
        isAuthenticated = false
        isGuestMode = true
        currentUser = .anonymousGuest
        currentUser.role = .guest
        renterTab = .home
        hostTab = .dashboard
        favoriteCarIDs = []
        renterBookings = []
        hostBookings = []
        hostReviews = []
        listingReviewsByCarID = [:]
        conversations = []
        messagesByConversation = [:]
        lastServerMessageDateByConversationID = [:]
        loadingConversationIDs = []
        pendingConversationID = nil
        pendingConversationParticipantName = nil
        pendingBookingID = nil
        pendingMessageDraftByConversationID = [:]
        deferredPushNotificationRoute = nil
        hostApplication = nil
        hostApplicationStatus = nil
        hostAccessState = .renter
        hostModeEnabled = false
        ownedCars = []
        syncErrorMessage = nil
        authInfoMessage = nil
        signupConfirmationPromptMessage = nil
        paymentFlowNotice = nil
        paymentFlowNoticeIsError = false
        resetAnnouncementState()
        hasSyncedOwnedCarsOnce = false
        hasSyncedBookingsOnce = false
        hasSyncedConversationsOnce = false
        bookingsLoadState = .idle
        conversationsLoadState = .idle
        favoritesLoadState = .idle

        Task {
            await syncPublicCars()
            await refreshActiveAnnouncements()
        }
    }

    func returnToAuth() {
        stopPolling()
        stopRealtimeMessages()
        clearPersistedSession()
        isAuthenticated = false
        isGuestMode = false
        currentUser = .anonymousGuest
        currentUser.role = .guest
        renterTab = .home
        hostTab = .dashboard
        favoriteCarIDs = []
        renterBookings = []
        hostBookings = []
        hostReviews = []
        listingReviewsByCarID = [:]
        conversations = []
        messagesByConversation = [:]
        lastServerMessageDateByConversationID = [:]
        loadingConversationIDs = []
        pendingConversationID = nil
        pendingConversationParticipantName = nil
        pendingBookingID = nil
        pendingMessageDraftByConversationID = [:]
        deferredPushNotificationRoute = nil
        hostApplication = nil
        hostApplicationStatus = nil
        hostAccessState = .unknown
        hostModeEnabled = false
        ownedCars = []
        syncErrorMessage = nil
        authInfoMessage = nil
        signupConfirmationPromptMessage = nil
        paymentFlowNotice = nil
        paymentFlowNoticeIsError = false
        resetAnnouncementState()
        hasSyncedOwnedCarsOnce = false
        hasSyncedBookingsOnce = false
        hasSyncedConversationsOnce = false
        bookingsLoadState = .idle
        conversationsLoadState = .idle
        favoritesLoadState = .idle

        Task {
            await refreshActiveAnnouncements()
        }
    }

    func updateNotificationPreference(
        bookingUpdates: Bool? = nil,
        messages: Bool? = nil,
        accountSecurity: Bool? = nil,
        newsAnnouncements: Bool? = nil
    ) {
        let current = notificationPreferences
        let next = NotificationPreferences(
            bookingUpdates: bookingUpdates ?? current.bookingUpdates,
            messages: messages ?? current.messages,
            accountSecurity: accountSecurity ?? current.accountSecurity,
            newsAnnouncements: newsAnnouncements ?? current.newsAnnouncements
        )

        notificationPreferences = next
        guard isAuthenticated else { return }

        Task {
            do {
                let response = try await withAuthenticatedToken { token in
                    try await api.updateNotificationPreferences(
                        baseURL: apiBaseURL,
                        token: token,
                        preferences: next
                    )
                }
                notificationPreferences = NotificationPreferences(dto: response.data)
            } catch {
                notificationPreferences = current
                syncErrorMessage = errorMessage(error, fallback: "Unable to save notification settings.")
            }
        }
    }

    func setDarkMode(_ enabled: Bool) {
        darkModeEnabled = enabled
        defaults.set(enabled, forKey: darkModeKey)
    }

    func setExploreLayoutMode(_ mode: ExploreLayoutMode) {
        exploreLayoutMode = mode
        defaults.set(mode.rawValue, forKey: exploreLayoutModeKey)
    }

    func openAppearanceSettings() {
        if !hasAppAccess {
            continueAsGuest()
        }
        hostModeEnabled = false
        renterTab = .more
        appearanceSettingsHighlightToken += 1
    }

    func dismissActiveAnnouncement() {
        guard let announcement = activeAnnouncement else { return }

        Task {
            if announcement.showOnce {
                markAnnouncementSeenLocally(announcement.id)

                if let token = authToken?.trimmingCharacters(in: .whitespacesAndNewlines), !token.isEmpty {
                    _ = try? await api.markAnnouncementSeen(
                        baseURL: apiBaseURL,
                        token: token,
                        announcementID: announcement.id
                    )
                }
            }

            pendingAnnouncements.removeAll { $0.id == announcement.id }
            activeAnnouncement = pendingAnnouncements.first
        }
    }

    func saveProfile(fullName: String, city: String, phone: String, region: String, avatarURL: String? = nil) {
        guard authToken != nil else {
            syncErrorMessage = "Log in to update your profile."
            return
        }

        let normalizedName = fullName.trimmingCharacters(in: .whitespacesAndNewlines)
        let normalizedCity = city.trimmingCharacters(in: .whitespacesAndNewlines)
        let normalizedPhone = phone.trimmingCharacters(in: .whitespacesAndNewlines)
        let normalizedRegion = region.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalizedName.isEmpty else {
            syncErrorMessage = "Name cannot be empty."
            return
        }

        let parts = normalizedName.split(separator: " ").map(String.init)
        let firstName = parts.first ?? normalizedName
        let lastName = parts.dropFirst().joined(separator: " ")
        let normalizedAvatar = RemoteImageURLResolver.canonicalString(avatarURL) ??
            RemoteImageURLResolver.canonicalString(currentUser.avatar)

        Task {
            do {
                try await withAuthenticatedToken { token in
                    try await api.upsertProfile(
                        baseURL: apiBaseURL,
                        token: token,
                        userID: currentUser.id,
                        firstName: firstName,
                        lastName: lastName,
                        fullName: normalizedName,
                        city: normalizedCity,
                        region: normalizedRegion,
                        phone: normalizedPhone,
                        avatarURL: normalizedAvatar
                    )
                }
                currentUser.fullName = normalizedName
                if !normalizedCity.isEmpty {
                    currentUser.city = normalizedCity
                }
                if !normalizedRegion.isEmpty {
                    currentUser.region = normalizedRegion
                }
                currentUser.phone = normalizedPhone
                currentUser.avatar = normalizedAvatar
                persistCachedUserSnapshot()
                try await refreshCurrentUserContext()
                syncErrorMessage = nil
            } catch {
                syncErrorMessage = errorMessage(error, fallback: "Unable to update profile.")
            }
        }
    }

    func startRealtimeMessages(for conversationID: String) {
        guard isAuthenticated else { return }
        stopRealtimeMessages()
        if let idx = conversations.firstIndex(where: { $0.id == conversationID }) {
            conversations[idx].unreadCount = 0
        }

        conversationRealtimeTask = Task { [weak self] in
            guard let self else { return }
            await self.loadMessages(for: conversationID, markRead: true, incremental: false)
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                guard self.isAuthenticated else { continue }
                await self.loadMessages(for: conversationID, markRead: true, incremental: true)
            }
        }
    }

    func stopRealtimeMessages() {
        conversationRealtimeTask?.cancel()
        conversationRealtimeTask = nil
    }

    func refreshConversationsNow() {
        #if DEBUG
        if Self.isScreenshotMode { return }
        #endif

        guard isAuthenticated else { return }
        Task {
            await syncConversations()
        }
    }

    func retryCars() {
        Task { await syncPublicCars() }
    }

    func retryFavorites() {
        Task { await syncFavorites() }
    }

    func retryBookings() {
        Task { await syncBookings() }
    }

    func retryConversations() {
        Task { await syncConversations() }
    }

    func openDispute(bookingID: String, reason: String) async -> Bool {
        guard authToken != nil else {
            syncErrorMessage = "Log in to open a dispute."
            return false
        }
        let trimmedReason = reason.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmedReason.count >= 5 else {
            syncErrorMessage = "Dispute reason must be at least 5 characters."
            return false
        }
        do {
            try await withAuthenticatedToken { token in
                try await api.createDispute(baseURL: apiBaseURL, token: token, bookingID: bookingID, reason: trimmedReason)
            }
            syncErrorMessage = nil
            return true
        } catch {
            syncErrorMessage = errorMessage(error, fallback: "Unable to open dispute.")
            return false
        }
    }

    func submitReview(bookingID: String, rating: Int, comment: String) async -> Bool {
        guard authToken != nil else {
            syncErrorMessage = "Log in to submit a review."
            return false
        }

        let trimmedComment = comment.trimmingCharacters(in: .whitespacesAndNewlines)
        guard (1...5).contains(rating) else {
            syncErrorMessage = "Rating must be between 1 and 5."
            return false
        }
        guard trimmedComment.count >= 3 else {
            syncErrorMessage = "Comment must be at least 3 characters."
            return false
        }

        do {
            let response = try await withAuthenticatedToken { token in
                try await api.submitReview(
                    baseURL: apiBaseURL,
                    token: token,
                    bookingID: bookingID,
                    rating: rating,
                    comment: trimmedComment
                )
            }

            if let reviewDTO = response.data {
                let review = mapReview(reviewDTO)
                if !hostReviews.contains(where: { $0.id == review.id }) {
                    hostReviews.insert(review, at: 0)
                }
                var listingReviews = listingReviewsByCarID[review.carID] ?? []
                if !listingReviews.contains(where: { $0.id == review.id }) {
                    listingReviews.insert(review, at: 0)
                    listingReviewsByCarID[review.carID] = listingReviews
                }
                if let carIndex = cars.firstIndex(where: { $0.id == review.carID }) {
                    let currentCount = max(cars[carIndex].reviewsCount, 0)
                    let currentTotal = cars[carIndex].rating * Double(currentCount)
                    let updatedCount = currentCount + 1
                    cars[carIndex].reviewsCount = updatedCount
                    cars[carIndex].rating = (currentTotal + Double(review.rating)) / Double(updatedCount)
                }
            }

            syncErrorMessage = nil
            return true
        } catch {
            syncErrorMessage = errorMessage(error, fallback: "Unable to submit review.")
            return false
        }
    }

    private func migrateLoopbackBaseURLIfNeeded() {
        guard Self.isLoopbackBaseURL(apiBaseURL) else { return }
        guard let bundled = Bundle.main.object(forInfoDictionaryKey: "HAYAMEAPIBaseURL") as? String else { return }
        let candidate = Self.canonicalBaseURL(bundled)
        guard !Self.isLoopbackBaseURL(candidate) else { return }
        apiBaseURL = candidate
        defaults.set(candidate, forKey: apiBaseURLKey)
    }

    func updateAPIBaseURL(_ raw: String) {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        let normalized = Self.canonicalBaseURL(trimmed)
        apiBaseURL = normalized
        defaults.set(normalized, forKey: apiBaseURLKey)
        syncErrorMessage = nil
    }

    func switchToHostMode() {
        guard isAuthenticated else {
            syncErrorMessage = "Log in to access the host dashboard."
            return
        }
        if hostAccessState == .host {
            hostTab = .dashboard
            hostModeEnabled = true
        }
        Task {
            await syncHostApplication()
            if hostAccessState == .host {
                hostTab = .dashboard
                hostModeEnabled = true
            } else if hostAccessState == .pending {
                syncErrorMessage = "Your host application is still pending review."
            } else {
                syncErrorMessage = "Host access is not available on this account yet."
            }
        }
    }

    func switchToGuestMode() {
        currentUser.role = .guest
        renterTab = .home
        hostModeEnabled = false
    }

    func submitHostApplication(_ application: HostApplication) {
        Task {
            _ = await submitHostApplicationRemote(application)
        }
    }

    func submitHostApplicationNow(_ application: HostApplication) async -> Bool {
        await submitHostApplicationRemote(application)
    }

    func approveHostApplicationForDemo() {
        syncErrorMessage = "Demo host elevation is disabled. Submit a real host application."
    }

    func toggleFavorite(carID: String) {
        guard authToken != nil else {
            syncErrorMessage = "Log in to save cars to favorites."
            return
        }

        let wasFavorite = favoriteCarIDs.contains(carID)
        if wasFavorite {
            favoriteCarIDs.remove(carID)
        } else {
            favoriteCarIDs.insert(carID)
        }

        Task {
            do {
                try await withAuthenticatedToken { token in
                    try await api.setFavorite(baseURL: apiBaseURL, token: token, carID: carID, isFavorite: !wasFavorite)
                }
                await syncFavorites()
            } catch {
                if wasFavorite {
                    favoriteCarIDs.insert(carID)
                } else {
                    favoriteCarIDs.remove(carID)
                }
                syncErrorMessage = errorMessage(error, fallback: "Unable to update favorite.")
            }
        }
    }

    func addMessage(conversationID: String, body: String, mine: Bool = true, senderName: String? = nil) {
        let trimmed = body.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        if mine {
            guard authToken != nil else {
                syncErrorMessage = "Log in to send messages."
                return
            }

            let optimisticMessageID = appendLocalMessage(
                conversationID: conversationID,
                body: trimmed,
                mine: true,
                senderName: currentUser.fullName,
                deliveryState: .sending
            )

            Task {
                do {
                    let sent = try await withAuthenticatedToken { token in
                        try await api.sendMessage(
                            baseURL: apiBaseURL,
                            token: token,
                            conversationID: conversationID,
                            body: trimmed
                        )
                    }

                    let participant = participantName(for: conversationID)
                    let mapped = mapMessage(sent.data, participantName: participant)
                    resolveLocalMessageSendSuccess(
                        conversationID: conversationID,
                        messageID: optimisticMessageID,
                        serverMessage: mapped
                    )
                } catch {
                    updateLocalMessageDeliveryState(
                        conversationID: conversationID,
                        messageID: optimisticMessageID,
                        state: .failed
                    )
                    syncErrorMessage = errorMessage(error, fallback: "Unable to send message.")
                }
            }
            return
        }

        appendLocalMessage(
            conversationID: conversationID,
            body: trimmed,
            mine: mine,
            senderName: senderName ?? (mine ? currentUser.fullName : participantName(for: conversationID))
        )
    }

    func addMessageIfMissing(conversationID: String, body: String) async {
        let trimmed = body.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        await loadMessages(for: conversationID, markRead: false, incremental: false)
        let alreadySent = messagesByConversation[conversationID, default: []].contains(where: { message in
            message.isMine &&
                message.body.trimmingCharacters(in: .whitespacesAndNewlines) == trimmed
        })
        guard !alreadySent else { return }

        addMessage(conversationID: conversationID, body: trimmed, mine: true)
    }

    func openConversationInInbox(
        conversationID: String,
        participantName: String,
        draft: String? = nil,
        preferHostInbox: Bool = false
    ) {
        let trimmedDraft = draft?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !trimmedDraft.isEmpty {
            pendingMessageDraftByConversationID[conversationID] = trimmedDraft
        }
        markConversationRead(conversationID)
        pendingConversationID = conversationID
        pendingConversationParticipantName = participantName
        if preferHostInbox && hostAccessState == .host {
            hostModeEnabled = true
            hostTab = .inbox
        } else {
            renterTab = .inbox
        }
    }

    func consumePendingConversationDraft(for conversationID: String) -> String? {
        let draft = pendingMessageDraftByConversationID[conversationID]
        pendingMessageDraftByConversationID.removeValue(forKey: conversationID)
        return draft
    }

    func consumePendingBookingFocus(ifMatches bookingID: String) {
        guard pendingBookingID == bookingID else { return }
        pendingBookingID = nil
    }

    private func routePendingPushNotificationIfNeeded() {
        let route = NotificationManager.shared.consumePendingNotificationRoute() ?? deferredPushNotificationRoute
        guard let route else { return }

        if authToken?.isEmpty == false && !isAuthenticated {
            deferredPushNotificationRoute = route
            return
        }

        if route.recipientRole == "host", hostAccessState != .host {
            if hostAccessState == .unknown || (isAuthenticated && hostApplicationStatus == nil) {
                deferredPushNotificationRoute = route
                return
            }
        }

        deferredPushNotificationRoute = nil

        if let announcement = route.appAnnouncement {
            activeAnnouncement = announcement
            if announcement.showOnce,
               let token = authToken?.trimmingCharacters(in: .whitespacesAndNewlines),
               !token.isEmpty {
                Task { @MainActor in
                    _ = try? await api.markAnnouncementSeen(
                        baseURL: apiBaseURL,
                        token: token,
                        announcementID: announcement.id
                    )
                }
            }
            return
        }

        if let conversationID = route.conversationID {
            openConversationInInbox(
                conversationID: conversationID,
                participantName: route.participantName ?? "Chat",
                preferHostInbox: route.recipientRole == "host"
            )
            return
        }

        guard let bookingID = route.bookingID else { return }
        pendingBookingID = bookingID

        if route.recipientRole == "host", hostAccessState == .host {
            hostModeEnabled = true
            hostTab = .bookings
        } else {
            renterTab = .trips
        }
    }

    func uploadProfileAvatar(
        fileData: Data,
        fileExtension: String = "jpg",
        mimeType: String = "image/jpeg"
    ) async throws -> String {
        let uploadedURL = try await withAuthenticatedToken { token in
            try await api.uploadProfileAvatar(
                baseURL: apiBaseURL,
                token: token,
                userID: currentUser.id,
                fileData: fileData,
                fileExtension: fileExtension,
                mimeType: mimeType
            )
        }

        let canonical = RemoteImageURLResolver.canonicalString(uploadedURL) ?? uploadedURL
        currentUser.avatar = canonical
        persistCachedUserSnapshot()

        let nameValue = currentUser.fullName.trimmingCharacters(in: .whitespacesAndNewlines)
        let normalizedName = nameValue.isEmpty ? "Hayame User" : nameValue
        let nameParts = normalizedName.split(separator: " ").map(String.init)
        let firstName = nameParts.first ?? normalizedName
        let lastName = nameParts.dropFirst().joined(separator: " ")
        try await withAuthenticatedToken { token in
            try await api.upsertProfile(
                baseURL: apiBaseURL,
                token: token,
                userID: currentUser.id,
                firstName: firstName,
                lastName: lastName,
                fullName: normalizedName,
                city: currentUser.city,
                region: currentUser.region,
                phone: currentUser.phone,
                avatarURL: canonical
            )
        }

        if let resolved = RemoteImageURLResolver.resolve(canonical) {
            await RemoteImagePipeline.shared.prefetch(
                urls: [resolved],
                limit: 1,
                targetPixelSize: CGSize(width: 220, height: 220),
                maxConcurrent: 1
            )
        }
        try await refreshCurrentUserContext()
        return canonical
    }

    func uploadHostIdentityDocument(
        side: String,
        fileData: Data,
        fileExtension: String = "jpg",
        mimeType: String = "image/jpeg"
    ) async throws -> String {
        try await withAuthenticatedToken { token in
            try await api.uploadHostIdentityDocument(
                baseURL: apiBaseURL,
                token: token,
                userID: currentUser.id,
                side: side,
                fileData: fileData,
                fileExtension: fileExtension,
                mimeType: mimeType
            )
        }
    }

    func markConversationRead(_ conversationID: String) {
        if let idx = conversations.firstIndex(where: { $0.id == conversationID }) {
            conversations[idx].unreadCount = 0
        }
        Task {
            await loadMessages(for: conversationID, markRead: true, incremental: false)
        }
    }

    func ensureConversation(
        hostID: String,
        participantID: String? = nil,
        carID: String? = nil,
        participantName: String
    ) async -> String? {
        if let participantID {
            if let existing = conversations.first(where: { $0.participantID == participantID && ($0.carID == carID || carID == nil) }) {
                return existing.id
            }
        } else if let existing = conversations.first(where: { $0.participantName == participantName }) {
            return existing.id
        }

        guard authToken != nil, !hostID.isEmpty else {
            syncErrorMessage = "Log in to start a conversation."
            return nil
        }

        var payload: [String: Any] = ["hostId": hostID]
        if let participantID, !participantID.isEmpty {
            payload["participantId"] = participantID
        }
        if let carID, !carID.isEmpty {
            payload["carId"] = carID
        }

        do {
            let created = try await withAuthenticatedToken { token in
                try await api.createConversation(
                    baseURL: apiBaseURL,
                    token: token,
                    payload: payload
                )
            }

            if !conversations.contains(where: { $0.id == created.id }) {
                conversations.insert(
                    Conversation(
                        id: created.id,
                        participantID: participantID,
                        carID: carID,
                        participantName: participantName,
                        participantAvatar: nil,
                        lastMessagePreview: "",
                        updatedAt: .now,
                        unreadCount: 0
                    ),
                    at: 0
                )
            }
            return created.id
        } catch {
            syncErrorMessage = errorMessage(error, fallback: "Unable to start conversation.")
            return nil
        }
    }

    func createListing(from draft: ListingDraft) {
        Task {
            do {
                _ = try await createListingNow(from: draft)
            } catch {
                syncErrorMessage = errorMessage(error, fallback: "Unable to create listing.")
            }
        }
    }

    @discardableResult
    func createListingNow(from draft: ListingDraft) async throws -> Car {
        guard authToken != nil else {
            throw APIError(message: "Log in to create a listing.")
        }
        let payload = listingPayload(from: draft)
        let result = try await withAuthenticatedToken { token in
            try await api.createCar(baseURL: apiBaseURL, token: token, payload: payload)
        }
        let created = mapCar(result.data)
        replaceCar(created, in: &ownedCars)
        if created.approvalStatus.lowercased() == "approved" {
            replaceCar(created, in: &cars)
        } else {
            cars.removeAll { $0.id == created.id }
        }
        return created
    }

    func updateListing(_ car: Car, from draft: ListingDraft) {
        Task {
            do {
                _ = try await updateListingNow(car, from: draft)
            } catch {
                syncErrorMessage = errorMessage(error, fallback: "Unable to update listing.")
            }
        }
    }

    @discardableResult
    func updateListingNow(_ car: Car, from draft: ListingDraft) async throws -> Car {
        guard authToken != nil else {
            throw APIError(message: "Log in to update a listing.")
        }
        let payload = listingPayload(from: draft)
        let result = try await withAuthenticatedToken { token in
            try await api.updateCar(baseURL: apiBaseURL, token: token, carID: car.id, payload: payload)
        }
        let updated = mapCar(result.data)
        replaceCar(updated, in: &ownedCars)
        if updated.approvalStatus.lowercased() == "approved" {
            replaceCar(updated, in: &cars)
        } else {
            cars.removeAll { $0.id == updated.id }
        }
        return updated
    }

    func deleteListing(_ car: Car) {
        Task {
            do {
                try await deleteListingNow(car)
            } catch {
                syncErrorMessage = errorMessage(error, fallback: "Unable to delete listing.")
            }
        }
    }

    func deleteListingNow(_ car: Car) async throws {
        guard authToken != nil else {
            throw APIError(message: "Log in to delete a listing.")
        }
        try await withAuthenticatedToken { token in
            try await api.deleteCar(baseURL: apiBaseURL, token: token, carID: car.id)
        }
        ownedCars.removeAll { $0.id == car.id }
        cars.removeAll { $0.id == car.id }
    }

    func approveBooking(_ booking: Booking) {
        guard authToken != nil else {
            syncErrorMessage = "Log in to approve bookings."
            return
        }

        Task {
            do {
                try await withAuthenticatedToken { token in
                    try await api.updateBookingDecision(baseURL: apiBaseURL, token: token, bookingID: booking.id, approve: true)
                }
                await syncBookings()
            } catch {
                syncErrorMessage = errorMessage(error, fallback: "Unable to approve booking.")
            }
        }
    }

    func rejectBooking(_ booking: Booking) {
        guard authToken != nil else {
            syncErrorMessage = "Log in to reject bookings."
            return
        }

        Task {
            do {
                try await withAuthenticatedToken { token in
                    try await api.updateBookingDecision(baseURL: apiBaseURL, token: token, bookingID: booking.id, approve: false)
                }
                await syncBookings()
            } catch {
                syncErrorMessage = errorMessage(error, fallback: "Unable to reject booking.")
            }
        }
    }

    func beginBookingPayment(
        for car: Car,
        tripMode: BookingTripMode?,
        region: String,
        city: String,
        address: String,
        deliveryDetails: BookingDeliveryDetails,
        start: Date,
        end: Date
    ) async throws -> PaystackCheckoutSession {
        guard authToken != nil else {
            throw APIError(message: "Log in to book this car.")
        }

        paymentFlowNotice = nil
        paymentFlowNoticeIsError = false

        let startDate = Self.dateOnlyFormatter.string(from: start)
        let endDate = Self.dateOnlyFormatter.string(from: end)
        let normalizedRegion = MockDataService.normalizedRegion(region)
        let normalizedCity = city.trimmingCharacters(in: .whitespacesAndNewlines)
        let normalizedAddress = address.trimmingCharacters(in: .whitespacesAndNewlines)
        let resolvedAddress = normalizedAddress.isEmpty ? normalizedCity : normalizedAddress

        if normalizedCity.isEmpty {
            throw APIError(message: "Select your trip city before continuing.")
        }
        if car.deliveryAvailable, tripMode == nil {
            throw APIError(message: "Choose pickup or delivery before continuing.")
        }

        do {
            let checkoutSession = try await withAuthenticatedToken { token in
                let hold = try await api.createBookingHold(
                    baseURL: apiBaseURL,
                    token: token,
                    carID: car.id,
                    startDate: startDate,
                    endDate: endDate,
                    tripMode: tripMode,
                    tripUseRegion: normalizedRegion,
                    tripUseCity: normalizedCity,
                    tripUseAddress: resolvedAddress,
                    deliveryDetails: deliveryDetails
                )

                let initiated = try await api.initiatePaystackCheckout(
                    baseURL: apiBaseURL,
                    token: token,
                    bookingID: hold.bookingId,
                    callbackURL: "hayame://payment-callback"
                )

                let amountMinor = max(initiated.amount?.intValue ?? 0, 0)
                guard amountMinor > 0 else {
                    throw APIError(message: "Invalid payment amount from server.")
                }

                let checkoutURL = (initiated.payment_url ?? initiated.authorization_url).trimmingCharacters(in: .whitespacesAndNewlines)
                guard !checkoutURL.isEmpty else {
                    throw APIError(message: "Missing payment URL from server.")
                }

                return PaystackCheckoutSession(
                    bookingID: hold.bookingId,
                    carID: car.id,
                    startDate: startDate,
                    endDate: endDate,
                    tripUseRegion: normalizedRegion,
                    tripUseCity: normalizedCity,
                    tripUseAddress: resolvedAddress,
                    reference: initiated.reference,
                    amountMinor: amountMinor,
                    authorizationURL: checkoutURL
                )
            }
            syncErrorMessage = nil
            return checkoutSession
        } catch {
            syncErrorMessage = errorMessage(error, fallback: "Unable to start Paystack checkout.")
            throw error
        }
    }

    func completeBookingPayment(
        checkout: PaystackCheckoutSession,
        callbackURL: URL? = nil
    ) async throws -> String? {
        guard authToken != nil else {
            throw APIError(message: "Log in to complete payment.")
        }

        let resolvedReference: String
        if let callbackURL {
            guard let callbackReference = paystackReference(from: callbackURL), !callbackReference.isEmpty else {
                throw APIError(message: "Payment was cancelled or not completed.")
            }
            resolvedReference = callbackReference
        } else {
            resolvedReference = checkout.reference
        }
        if resolvedReference.isEmpty {
            throw APIError(message: "Missing payment reference from callback.")
        }

        do {
            let finalized = try await withAuthenticatedToken { token in
                try await api.finalizePaystackCheckout(
                    baseURL: apiBaseURL,
                    token: token,
                    bookingID: checkout.bookingID,
                    carID: checkout.carID,
                    startDate: checkout.startDate,
                    endDate: checkout.endDate,
                    tripUseRegion: checkout.tripUseRegion,
                    tripUseCity: checkout.tripUseCity,
                    tripUseAddress: checkout.tripUseAddress,
                    reference: resolvedReference,
                    amountMinor: checkout.amountMinor
                )
            }
            let paymentStatus = finalized.data?.payment_status?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            guard paymentStatus == "paid" else {
                throw APIError(message: "Payment not completed yet. Finish payment in secure checkout before verifying.")
            }
            await syncBookings()
            await syncConversations()
            syncErrorMessage = nil
            paymentFlowNotice = "Payment successful. Your booking is now in Trips."
            paymentFlowNoticeIsError = false
            return finalized.conversationId
        } catch {
            syncErrorMessage = errorMessage(error, fallback: "Payment completed but booking finalization failed.")
            paymentFlowNotice = syncErrorMessage
            paymentFlowNoticeIsError = true
            throw error
        }
    }

    func refreshCarDetail(carID: String) async {
        #if DEBUG
        if Self.isScreenshotMode { return }
        #endif

        do {
            let response = try await api.getCarDetail(baseURL: apiBaseURL, token: authToken, carID: carID)
            let mapped = mapCar(response.data)
            replaceCar(mapped, in: &cars)
            if ownedCars.contains(where: { $0.id == mapped.id }) || mapped.ownerID == currentUser.id {
                replaceCar(mapped, in: &ownedCars)
            }
        } catch {
            // Keep existing listing snapshot on transient failures.
        }
    }

    func refreshReferenceData() async {
        do {
            async let locationsTask = api.getLocations(baseURL: apiBaseURL)
            async let catalogTask = api.getCarCatalog(baseURL: apiBaseURL)
            let (locations, catalog) = try await (locationsTask, catalogTask)

            var regions = locations.data ?? [:]
            if regions.isEmpty {
                regions = MockDataService.citiesByRegion
            }

            let makes = catalog.makes.map(\.name)
            let modelsByMake = Dictionary(
                uniqueKeysWithValues: catalog.makes.map { make in
                    (make.name, make.models.map(\.name))
                }
            )

            referenceData = ReferenceDataCatalog(
                regionsByCity: regions,
                makes: makes,
                modelsByMake: modelsByMake
            )
            MockDataService.setRuntimeReferenceData(
                regionsByCity: regions,
                makes: makes,
                modelsByMake: modelsByMake
            )
        } catch {
            // Keep offline fallback data.
        }
    }

    func checkAvailability(carID: String, start: Date, end: Date) async -> AvailabilitySnapshot? {
        #if DEBUG
        if Self.isScreenshotMode {
            return Self.screenshotAvailabilitySnapshot(start: start)
        }
        #endif

        let startDate = Self.dateOnlyFormatter.string(from: start)
        let endDate = Self.dateOnlyFormatter.string(from: end)
        do {
            let response = try await api.getAvailability(
                baseURL: apiBaseURL,
                carID: carID,
                startDate: startDate,
                endDate: endDate
            )
            return AvailabilitySnapshot(
                blockedDates: response.blockedDates ?? [],
                available: response.available ?? false,
                reason: response.reason
            )
        } catch {
            syncErrorMessage = errorMessage(error, fallback: "Unable to check availability.")
            return nil
        }
    }

    func loadListingPhotos(carID: String) async throws -> ([CarListingPhoto], Int) {
        let response = try await withAuthenticatedToken { token in
            try await api.getCarPhotos(baseURL: apiBaseURL, token: token, carID: carID)
        }
        let photos = response.data.map { CarListingPhoto(id: $0.id, url: $0.url) }
        let maxPhotos = max(response.meta?.max_photos ?? 7, 1)
        return (photos, maxPhotos)
    }

    func uploadListingPhoto(
        carID: String,
        fileData: Data,
        fileName: String,
        mimeType: String,
        replacePhotoID: String? = nil
    ) async throws -> CarListingPhoto {
        let response = try await withAuthenticatedToken { token in
            try await api.uploadCarPhoto(
                baseURL: apiBaseURL,
                token: token,
                carID: carID,
                fileData: fileData,
                fileName: fileName,
                mimeType: mimeType,
                replacePhotoID: replacePhotoID
            )
        }
        guard let photo = response.data else {
            throw APIError(message: "Photo upload succeeded but no photo record was returned.")
        }
        return CarListingPhoto(id: photo.id, url: photo.url)
    }

    func deleteListingPhoto(carID: String, photoID: String) async throws {
        try await withAuthenticatedToken { token in
            try await api.deleteCarPhoto(baseURL: apiBaseURL, token: token, carID: carID, photoID: photoID)
        }
    }

    func saveAvailabilityWindow(
        carID: String,
        startDate: String,
        endDate: String,
        available: Bool
    ) async throws {
        _ = try await withAuthenticatedToken { token in
            try await api.saveAvailabilityWindow(
                baseURL: apiBaseURL,
                token: token,
                carID: carID,
                startDate: startDate,
                endDate: endDate,
                available: available
            )
        }
    }

    func saveRecurringAvailabilityBlocks(
        carID: String,
        startDate: String,
        endDate: String,
        repeatDays: [String]
    ) async throws {
        _ = try await withAuthenticatedToken { token in
            try await api.saveRecurringAvailabilityBlocks(
                baseURL: apiBaseURL,
                token: token,
                carID: carID,
                startDate: startDate,
                endDate: endDate,
                repeatDays: repeatDays
            )
        }
    }

    // MARK: - Session

    private func signInRemote(email: String, password: String, onSuccess: @escaping () -> Void = {}) async {
        isSyncingRemote = true
        syncErrorMessage = nil
        loginErrorAlertMessage = nil
        authInfoMessage = nil
        signupConfirmationPromptMessage = nil
        defer { isSyncingRemote = false }

        do {
            let session = try await api.login(baseURL: apiBaseURL, email: email, password: password)
            try await establishAuthenticatedSession(
                from: session,
                missingSessionMessage: "Login succeeded without an active session."
            )
            onSuccess()
        } catch {
            if shouldAutoSwitchToProductionBaseURL(after: error) {
                switchToProductionBaseURL()
                do {
                    let session = try await api.login(baseURL: apiBaseURL, email: email, password: password)
                    try await establishAuthenticatedSession(
                        from: session,
                        missingSessionMessage: "Login succeeded without an active session."
                    )
                    onSuccess()
                    return
                } catch {
                    loginErrorAlertMessage = loginErrorMessage(error)
                    return
                }
            }
            loginErrorAlertMessage = loginErrorMessage(error)
        }
    }

    private func signUpRemote(
        firstName: String,
        lastName: String,
        email: String,
        city: String,
        region: String,
        password: String
    ) async {
        isSyncingRemote = true
        syncErrorMessage = nil
        authInfoMessage = nil
        signupConfirmationPromptMessage = nil
        defer { isSyncingRemote = false }

        do {
            _ = try await api.signup(
                baseURL: apiBaseURL,
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: password,
                city: city,
                region: region
            )
            let confirmationMessage = "Account created. Check your inbox/spam for verification email, then log in."
            authInfoMessage = confirmationMessage
            signupConfirmationPromptMessage = confirmationMessage
            return
        } catch {
            if shouldAutoSwitchToProductionBaseURL(after: error) {
                switchToProductionBaseURL()
                do {
                    _ = try await api.signup(
                        baseURL: apiBaseURL,
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        password: password,
                        city: city,
                        region: region
                    )
                    let confirmationMessage = "Account created. Check your inbox/spam for verification email, then log in."
                    authInfoMessage = confirmationMessage
                    signupConfirmationPromptMessage = confirmationMessage
                    return
                } catch {
                    syncErrorMessage = errorMessage(error, fallback: "Unable to sign up.")
                    return
                }
            }
            syncErrorMessage = errorMessage(error, fallback: "Unable to sign up.")
        }
    }

    private func resendSignupConfirmationRemote(email: String) async {
        isSyncingRemote = true
        syncErrorMessage = nil
        authInfoMessage = nil
        defer { isSyncingRemote = false }

        do {
            try await api.resendSignupConfirmation(baseURL: apiBaseURL, email: email)
            authInfoMessage = "Verification email sent. Check inbox/spam."
        } catch {
            if shouldAutoSwitchToProductionBaseURL(after: error) {
                switchToProductionBaseURL()
                do {
                    try await api.resendSignupConfirmation(baseURL: apiBaseURL, email: email)
                    authInfoMessage = "Verification email sent. Check inbox/spam."
                    return
                } catch {
                    syncErrorMessage = errorMessage(error, fallback: "Unable to resend verification email.")
                    return
                }
            }
            syncErrorMessage = errorMessage(error, fallback: "Unable to resend verification email.")
        }
    }

    private func requestPasswordResetRemote(email: String) async {
        isSyncingRemote = true
        syncErrorMessage = nil
        authInfoMessage = nil
        defer { isSyncingRemote = false }

        do {
            try await api.requestPasswordReset(baseURL: apiBaseURL, email: email)
            authInfoMessage = "Password reset email sent. Check inbox/spam."
        } catch {
            if shouldAutoSwitchToProductionBaseURL(after: error) {
                switchToProductionBaseURL()
                do {
                    try await api.requestPasswordReset(baseURL: apiBaseURL, email: email)
                    authInfoMessage = "Password reset email sent. Check inbox/spam."
                    return
                } catch {
                    syncErrorMessage = errorMessage(error, fallback: "Unable to send password reset email.")
                    return
                }
            }
            syncErrorMessage = errorMessage(error, fallback: "Unable to send password reset email.")
        }
    }

    private func establishAuthenticatedSession(from session: MobileAuthSessionDTO, missingSessionMessage: String) async throws {
        guard let token = session.access_token, let user = session.user else {
            throw APIError(message: missingSessionMessage)
        }
        applySession(
            token: token,
            refreshToken: session.refresh_token,
            user: user,
            profile: session.profile,
            isHost: session.is_host,
            hostStatus: session.host_application_status ?? session.host_status
        )
        try await refreshCurrentUserContext()
        await refreshAllRemoteData()
        startPolling()
        await NotificationManager.shared.enableUserNotifications()
        await registerPushDeviceTokenIfAvailable()
        routePendingPushNotificationIfNeeded()
    }

    private func shouldAutoSwitchToProductionBaseURL(after error: Error) -> Bool {
        guard Self.isLoopbackBaseURL(apiBaseURL) else { return false }

        if let urlError = error as? URLError {
            switch urlError.code {
            case .cannotConnectToHost, .cannotFindHost, .networkConnectionLost, .notConnectedToInternet, .timedOut:
                return true
            default:
                break
            }
        }

        let nsError = error as NSError
        if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCannotConnectToHost {
            return true
        }

        return false
    }

    private func switchToProductionBaseURL() {
        let production = Self.canonicalBaseURL(Self.productionBaseURL)
        apiBaseURL = production
        defaults.set(production, forKey: apiBaseURLKey)
    }

    private func bootstrapSessionIfNeeded() async {
        guard authToken?.isEmpty == false else { return }
        isAuthenticated = true
        isGuestMode = false

        do {
            try await refreshCurrentUserContext()
            await refreshAllRemoteData()
            startPolling()
            await NotificationManager.shared.enableUserNotifications()
            await registerPushDeviceTokenIfAvailable()
            routePendingPushNotificationIfNeeded()
        } catch {
            if let apiError = error as? APIError, apiError.statusCode == 401 {
                let refreshed = await refreshAccessTokenIfPossible()
                if refreshed {
                    do {
                        try await refreshCurrentUserContext()
                        await refreshAllRemoteData()
                        startPolling()
                        await NotificationManager.shared.enableUserNotifications()
                        await registerPushDeviceTokenIfAvailable()
                        routePendingPushNotificationIfNeeded()
                        return
                    } catch {}
                }
                clearPersistedSession()
                isAuthenticated = false
                isGuestMode = false
                currentUser = .anonymousGuest
                hostApplication = nil
                hostApplicationStatus = nil
                hostAccessState = .unknown
                ownedCars = []
                resetAnnouncementState()
                hasSyncedOwnedCarsOnce = false
                stopPolling()
                stopRealtimeMessages()
                await refreshActiveAnnouncements()
                return
            }

            // Transient network/server failures should not force logout.
            syncErrorMessage = errorMessage(error, fallback: "Unable to sync account data right now.")
            startPolling()
        }
    }

    private func refreshAccessTokenIfPossible() async -> Bool {
        guard let refreshToken, !refreshToken.isEmpty else { return false }
        do {
            let refreshed = try await api.refreshToken(baseURL: apiBaseURL, refreshToken: refreshToken)
            guard let token = refreshed.access_token else { return false }
            let resolvedUser: MobileAuthUserDTO
            let resolvedProfile: ProfileDTO?
            if let user = refreshed.user {
                resolvedUser = user
                resolvedProfile = refreshed.profile
            } else {
                let me = try await api.getMe(baseURL: apiBaseURL, token: token)
                resolvedUser = me.user
                resolvedProfile = me.profile
            }
            applySession(
                token: token,
                refreshToken: refreshed.refresh_token ?? refreshToken,
                user: resolvedUser,
                profile: resolvedProfile,
                isHost: refreshed.is_host,
                hostStatus: refreshed.host_application_status ?? refreshed.host_status
            )
            return true
        } catch {
            return false
        }
    }

    private func withAuthenticatedToken<T>(
        _ operation: (_ token: String) async throws -> T
    ) async throws -> T {
        guard let token = authToken, !token.isEmpty else {
            throw APIError(message: "Session expired. Please log in again.", statusCode: 401)
        }

        do {
            return try await operation(token)
        } catch let apiError as APIError where apiError.statusCode == 401 {
            let refreshed = await refreshAccessTokenIfPossible()
            guard refreshed, let retryToken = authToken, !retryToken.isEmpty else {
                let tokenStillValid = await canResolveCurrentUserWithToken(token)
                if tokenStillValid {
                    throw apiError
                }
                expireSessionAfterUnauthorized()
                throw APIError(message: "Session expired. Please log in again.", statusCode: 401)
            }

            do {
                return try await operation(retryToken)
            } catch let retryError as APIError where retryError.statusCode == 401 {
                let tokenStillValid = await canResolveCurrentUserWithToken(retryToken)
                if tokenStillValid {
                    throw retryError
                }
                expireSessionAfterUnauthorized()
                throw APIError(message: "Session expired. Please log in again.", statusCode: 401)
            }
        }
    }

    private func canResolveCurrentUserWithToken(_ token: String) async -> Bool {
        do {
            _ = try await api.getMe(baseURL: apiBaseURL, token: token)
            return true
        } catch let apiError as APIError {
            return apiError.statusCode != 401
        } catch {
            // Network/server errors should not force a local logout.
            return true
        }
    }

    private func expireSessionAfterUnauthorized() {
        returnToAuth()
        syncErrorMessage = "Session expired. Please log in again."
    }

    private func applySession(
        token: String,
        refreshToken: String?,
        user: MobileAuthUserDTO,
        profile: ProfileDTO?,
        isHost: Bool?,
        hostStatus: String?
    ) {
        self.authToken = token
        self.refreshToken = refreshToken
        persistSession()

        isAuthenticated = true
        isGuestMode = false
        currentUser = mapUserProfile(user: user, profile: profile, isHost: false, fallbackAvatar: currentUser.avatar)
        persistCachedUserSnapshot()
        currentUser.role = .guest
        hasSyncedOwnedCarsOnce = false
        hasSyncedBookingsOnce = false
        hasSyncedConversationsOnce = false
        let normalizedHostStatus = hostStatus?.lowercased()
        hostApplicationStatus = normalizedHostStatus
        hostAccessState = resolveHostAccess(isHost: isHost ?? false, status: normalizedHostStatus)
        if hostAccessState != .host {
            hostModeEnabled = false
        }
        if hostAccessState == .host {
            currentUser.role = .host
        }

        if let hostStatus = normalizedHostStatus {
            hostApplication = HostApplication(
                id: hostApplication?.id ?? UUID().uuidString,
                fullName: hostApplication?.fullName ?? currentUser.fullName,
                phone: hostApplication?.phone ?? currentUser.phone,
                region: hostApplication?.region ?? currentUser.region,
                city: hostApplication?.city ?? currentUser.city,
                idType: hostApplication?.idType ?? "Ghana Card",
                idNumber: hostApplication?.idNumber ?? "",
                experience: hostApplication?.experience ?? "",
                fleetSize: hostApplication?.fleetSize ?? 1,
                note: hostApplication?.note ?? "",
                status: mapHostStatus(hostStatus),
                rejectionReason: hostApplication?.rejectionReason,
                idFrontPath: hostApplication?.idFrontPath ?? "",
                idBackPath: hostApplication?.idBackPath ?? "",
                facePhotoURL: hostApplication?.facePhotoURL ?? currentUser.avatar
            )
        }
    }

    private func refreshCurrentUserContext() async throws {
        let me = try await withAuthenticatedToken { token in
            try await api.getMe(baseURL: apiBaseURL, token: token)
        }
        currentUser = mapUserProfile(user: me.user, profile: me.profile, isHost: false, fallbackAvatar: currentUser.avatar)
        persistCachedUserSnapshot()
        currentUser.role = .guest

        if let application = me.host_application {
            hostApplication = mapHostApplication(application)
        } else if let status = me.host_application_status ?? me.host_status {
            hostApplication = HostApplication(
                id: hostApplication?.id ?? UUID().uuidString,
                fullName: hostApplication?.fullName ?? currentUser.fullName,
                phone: hostApplication?.phone ?? currentUser.phone,
                region: hostApplication?.region ?? currentUser.region,
                city: hostApplication?.city ?? currentUser.city,
                idType: hostApplication?.idType ?? "Ghana Card",
                idNumber: hostApplication?.idNumber ?? "",
                experience: hostApplication?.experience ?? "",
                fleetSize: hostApplication?.fleetSize ?? 1,
                note: hostApplication?.note ?? "",
                status: mapHostStatus(status),
                rejectionReason: hostApplication?.rejectionReason,
                idFrontPath: hostApplication?.idFrontPath ?? "",
                idBackPath: hostApplication?.idBackPath ?? "",
                facePhotoURL: hostApplication?.facePhotoURL ?? currentUser.avatar
            )
        }

        hostApplicationStatus = (me.host_application_status ?? me.host_status)?.lowercased()
        hostAccessState = resolveHostAccess(isHost: false, status: hostApplicationStatus)
        if hostAccessState != .host {
            hostModeEnabled = false
        }

        isAuthenticated = true
        if let avatarURL = RemoteImageURLResolver.resolve(currentUser.avatar) {
            await RemoteImagePipeline.shared.prefetch(
                urls: [avatarURL],
                limit: 1,
                targetPixelSize: CGSize(width: 160, height: 160),
                maxConcurrent: 1
            )
        }
        await syncHostApplication()
    }

    private func restorePersistedSession() {
        let persistedAuthToken = defaults.string(forKey: authTokenKey)?.trimmingCharacters(in: .whitespacesAndNewlines)
        let persistedRefreshToken = defaults.string(forKey: refreshTokenKey)?.trimmingCharacters(in: .whitespacesAndNewlines)
        authToken = (persistedAuthToken?.isEmpty == false) ? persistedAuthToken : nil
        refreshToken = (persistedRefreshToken?.isEmpty == false) ? persistedRefreshToken : nil
        if authToken != nil {
            isAuthenticated = true
            isGuestMode = false
            currentUser.role = .guest
            restoreCachedUserSnapshot()
        }
    }

    private func persistSession() {
        defaults.set(authToken, forKey: authTokenKey)
        defaults.set(refreshToken, forKey: refreshTokenKey)
    }

    private func clearPersistedSession() {
        authToken = nil
        refreshToken = nil
        defaults.removeObject(forKey: authTokenKey)
        defaults.removeObject(forKey: refreshTokenKey)
        defaults.removeObject(forKey: cachedUserNameKey)
        defaults.removeObject(forKey: cachedUserAvatarKey)
    }

    private func persistCachedUserSnapshot(allowAvatarClear: Bool = false) {
        let name = currentUser.fullName.trimmingCharacters(in: .whitespacesAndNewlines)
        let avatar = currentUser.avatar?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

        if !name.isEmpty {
            defaults.set(name, forKey: cachedUserNameKey)
        }
        if !avatar.isEmpty {
            defaults.set(avatar, forKey: cachedUserAvatarKey)
        } else if allowAvatarClear {
            defaults.removeObject(forKey: cachedUserAvatarKey)
        }
    }

    private func restoreCachedUserSnapshot() {
        let cachedName = defaults.string(forKey: cachedUserNameKey)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let cachedAvatar = defaults.string(forKey: cachedUserAvatarKey)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

        if !cachedName.isEmpty {
            currentUser.fullName = cachedName
        }
        if !cachedAvatar.isEmpty {
            currentUser.avatar = cachedAvatar
        }
    }

    private func resetAnnouncementState() {
        notificationPreferences = .defaults
        pendingAnnouncements = []
        activeAnnouncement = nil
    }

    private func seenAnnouncementIDs() -> Set<String> {
        Set(defaults.stringArray(forKey: seenAnnouncementIDsKey) ?? [])
    }

    private func markAnnouncementSeenLocally(_ announcementID: String) {
        let trimmed = announcementID.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        var ids = seenAnnouncementIDs()
        ids.insert(trimmed)
        defaults.set(Array(ids).sorted(), forKey: seenAnnouncementIDsKey)
    }

    private func ensureFirstLaunchTimestamp() {
        guard defaults.object(forKey: firstLaunchAtKey) == nil else { return }
        defaults.set(Date().timeIntervalSince1970, forKey: firstLaunchAtKey)
    }

    private func firstLaunchAt() -> Date {
        ensureFirstLaunchTimestamp()
        let seconds = defaults.double(forKey: firstLaunchAtKey)
        guard seconds > 0 else {
            let now = Date()
            defaults.set(now.timeIntervalSince1970, forKey: firstLaunchAtKey)
            return now
        }
        return Date(timeIntervalSince1970: seconds)
    }

    // MARK: - Sync

    func refreshAllRemoteData() async {
        #if DEBUG
        if Self.isScreenshotMode { return }
        #endif

        guard isAuthenticated else {
            await syncPublicCars()
            await refreshActiveAnnouncements()
            return
        }

        isSyncingRemote = true
        defer { isSyncingRemote = false }

        await refreshReferenceData()
        await syncPublicCars()
        await loadNotificationPreferences()
        await refreshActiveAnnouncements()
        await syncOwnedCars()
        await syncFavorites()
        await syncBookings()
        await syncConversations()
        await syncHostApplication()
        await syncHostReviews()
    }

    private func loadNotificationPreferences() async {
        guard isAuthenticated else {
            notificationPreferences = .defaults
            return
        }

        do {
            let response = try await withAuthenticatedToken { token in
                try await api.getNotificationPreferences(baseURL: apiBaseURL, token: token)
            }
            notificationPreferences = NotificationPreferences(dto: response.data)
        } catch {
            syncErrorMessage = errorMessage(error, fallback: "Unable to load notification settings.")
        }
    }

    private func refreshActiveAnnouncements() async {
        do {
            let trimmedToken = authToken?.trimmingCharacters(in: .whitespacesAndNewlines)
            let resolvedToken = (trimmedToken?.isEmpty == false) ? trimmedToken : nil

            let response: AppAnnouncementsEnvelopeDTO
            do {
                response = try await api.getAnnouncements(baseURL: apiBaseURL, token: resolvedToken)
            } catch let apiError as APIError where apiError.statusCode == 401 {
                response = try await api.getAnnouncements(baseURL: apiBaseURL, token: nil)
            }

            let locallySeen = seenAnnouncementIDs()
            let installedAfter = firstLaunchAt()
            pendingAnnouncements = response.data.compactMap(AppAnnouncement.init).filter { announcement in
                announcement.shouldDisplay(locallySeen: locallySeen, installedAfter: installedAfter)
            }
            if activeAnnouncement?.delivery == "push" {
                return
            }
            activeAnnouncement = pendingAnnouncements.first
        } catch {
            if activeAnnouncement == nil {
                pendingAnnouncements = []
            }
        }
    }

    private func syncPublicCars() async {
        guard !isSyncingCars else { return }
        isSyncingCars = true
        defer { isSyncingCars = false }
        if cars.isEmpty {
            publicCarsLoadState = .loading
        }

        do {
            let response: CarsEnvelopeDTO
            if let token = authToken, !token.isEmpty {
                do {
                    response = try await api.getCars(baseURL: apiBaseURL, token: token)
                } catch {
                    guard shouldRetryPublicCarsWithoutToken(after: error) else { throw error }
                    response = try await api.getCars(baseURL: apiBaseURL, token: nil)
                }
            } else {
                response = try await api.getCars(baseURL: apiBaseURL, token: nil)
            }
            await applyPublicCars(response)
        } catch {
            publicCarsLoadState = cars.isEmpty ? .error(errorMessage(error, fallback: "Unable to load listings.")) : .loaded
        }
    }

    private func shouldRetryPublicCarsWithoutToken(after error: Error) -> Bool {
        guard let apiError = error as? APIError else { return false }
        if apiError.statusCode == 401 || apiError.statusCode == 403 {
            return true
        }

        let lowered = apiError.message.lowercased()
        return lowered.contains("jwt") || lowered.contains("unauthorized") || lowered.contains("token")
    }

    private func applyPublicCars(_ response: CarsEnvelopeDTO) async {
        cars = response.data.map(mapCar)
        publicCarsLoadState = cars.isEmpty ? .empty : .loaded

        let imageURLs = cars.prefix(24).compactMap { car in
            RemoteImageURLResolver.resolve(car.imageNames.first)
        }
        let avatarURLs = cars.prefix(24).compactMap { car in
            RemoteImageURLResolver.resolve(car.hostAvatar)
        }
        await RemoteImagePipeline.shared.prefetch(
            urls: imageURLs,
            limit: 24,
            targetPixelSize: CGSize(width: 560, height: 400),
            maxConcurrent: 4
        )
        await RemoteImagePipeline.shared.prefetch(
            urls: avatarURLs,
            limit: 24,
            targetPixelSize: CGSize(width: 140, height: 140),
            maxConcurrent: 3
        )
    }

    private func syncOwnedCars() async {
        guard isAuthenticated else { return }
        do {
            let previousByID = Dictionary(uniqueKeysWithValues: ownedCars.map { ($0.id, $0.approvalStatus.lowercased()) })
            let response = try await withAuthenticatedToken { token in
                try await api.getMyCars(baseURL: apiBaseURL, token: token)
            }
            let mapped = response.data.map(mapCar)
            ownedCars = mapped
            if hasSyncedOwnedCarsOnce {
                await notifyOnOwnedListingApprovalChanges(previous: previousByID, current: mapped)
            } else {
                hasSyncedOwnedCarsOnce = true
            }
        } catch {
            // Keep last known data
        }
    }

    private func syncFavorites() async {
        guard isAuthenticated else {
            favoriteCarIDs = []
            favoritesLoadState = .idle
            return
        }
        if favoriteCarIDs.isEmpty {
            favoritesLoadState = .loading
        }
        do {
            let response = try await withAuthenticatedToken { token in
                try await api.getFavorites(baseURL: apiBaseURL, token: token)
            }
            favoriteCarIDs = Set(response.data.map { $0.car_id })
            favoritesLoadState = favoriteCarIDs.isEmpty ? .empty : .loaded
        } catch {
            favoritesLoadState = favoriteCarIDs.isEmpty ? .error(errorMessage(error, fallback: "Unable to load favorites.")) : .loaded
        }
    }

    private func syncBookings() async {
        guard isAuthenticated else { return }
        if renterBookings.isEmpty && hostBookings.isEmpty {
            bookingsLoadState = .loading
        }
        do {
            let previousByID = (renterBookings + hostBookings).reduce(into: [String: Booking]()) { partialResult, booking in
                partialResult[booking.id] = booking
            }
            let response = try await withAuthenticatedToken { token in
                try await api.getBookings(baseURL: apiBaseURL, token: token)
            }
            let mapped = response.data.map(mapBooking)
            let nextRenter = mapped.filter { $0.renterID == currentUser.id }
            let nextHost = mapped.filter { $0.hostID == currentUser.id }
            renterBookings = nextRenter
            hostBookings = nextHost
            bookingsLoadState = (nextRenter.isEmpty && nextHost.isEmpty) ? .empty : .loaded

            let nextByID = (nextRenter + nextHost).reduce(into: [String: Booking]()) { partialResult, booking in
                partialResult[booking.id] = booking
            }
            if hasSyncedBookingsOnce {
                await notifyOnBookingChanges(previous: previousByID, next: nextByID)
            } else {
                hasSyncedBookingsOnce = true
            }
        } catch {
            bookingsLoadState = (renterBookings.isEmpty && hostBookings.isEmpty) ? .error(errorMessage(error, fallback: "Unable to load bookings.")) : .loaded
        }
    }

    private func syncConversations() async {
        guard isAuthenticated else { return }
        guard !isSyncingConversations else { return }
        isSyncingConversations = true
        defer { isSyncingConversations = false }
        if conversations.isEmpty {
            conversationsLoadState = .loading
        }

        do {
            let previousUnread = conversations.reduce(into: [String: Int]()) { partialResult, conversation in
                partialResult[conversation.id] = conversation.unreadCount
            }
            let response = try await withAuthenticatedToken { token in
                try await api.getConversations(baseURL: apiBaseURL, token: token)
            }
            let mapped = response.data.map(mapConversation)
            conversations = mapped.sorted { $0.updatedAt > $1.updatedAt }
            conversationsLoadState = conversations.isEmpty ? .empty : .loaded
            let avatarURLs = conversations.prefix(80).compactMap { conversation in
                RemoteImageURLResolver.resolve(conversation.participantAvatar)
            }
            await RemoteImagePipeline.shared.prefetch(
                urls: avatarURLs,
                limit: 80,
                targetPixelSize: CGSize(width: 140, height: 140),
                maxConcurrent: 6
            )

            if hasSyncedConversationsOnce {
                await notifyOnConversationChanges(previousUnread: previousUnread, current: conversations)
            } else {
                hasSyncedConversationsOnce = true
            }
        } catch {
            conversationsLoadState = conversations.isEmpty ? .error(errorMessage(error, fallback: "Unable to load conversations.")) : .loaded
        }
    }

    private func loadMessages(for conversationID: String, markRead: Bool, incremental: Bool = false) async {
        guard isAuthenticated else { return }
        guard !loadingConversationIDs.contains(conversationID) else { return }
        loadingConversationIDs.insert(conversationID)
        defer { loadingConversationIDs.remove(conversationID) }
        do {
            let since = incremental
                ? lastServerMessageDateByConversationID[conversationID].map(Self.iso8601WithFractional.string(from:))
                : nil
            let response = try await withAuthenticatedToken { token in
                try await api.getMessages(
                    baseURL: apiBaseURL,
                    token: token,
                    conversationID: conversationID,
                    markRead: markRead,
                    since: since,
                    limit: 200
                )
            }
            let participant = participantName(for: conversationID)
            let mappedServerMessages = response.data.map {
                mapMessage($0, participantName: participant)
            }
            mergeServerMessages(
                conversationID: conversationID,
                serverMessages: mappedServerMessages,
                isIncremental: incremental
            )

            if markRead, let idx = conversations.firstIndex(where: { $0.id == conversationID }) {
                conversations[idx].unreadCount = 0
            }
        } catch {
            // Keep local messages
        }
    }

    private func syncHostApplication() async {
        guard isAuthenticated else { return }
        do {
            let status = try await withAuthenticatedToken { token in
                try await api.getHostStatus(baseURL: apiBaseURL, token: token)
            }
            let resolvedStatus = (status.host_application_status ?? status.status)?.lowercased()
            hostApplicationStatus = resolvedStatus
            hostAccessState = resolveHostAccess(isHost: status.is_host, status: resolvedStatus)
            if hostAccessState != .host {
                hostModeEnabled = false
            }
            currentUser.role = hostAccessState == .host ? .host : .guest

            if let statusRaw = resolvedStatus {
                let mappedStatus = mapHostStatus(statusRaw)
                if let current = hostApplication {
                    hostApplication = HostApplication(
                        id: current.id,
                        fullName: current.fullName,
                        phone: current.phone,
                        region: current.region,
                        city: current.city,
                        idType: current.idType,
                        idNumber: current.idNumber,
                        experience: current.experience,
                        fleetSize: current.fleetSize,
                        note: current.note,
                        status: mappedStatus,
                        rejectionReason: current.rejectionReason,
                        idFrontPath: current.idFrontPath,
                        idBackPath: current.idBackPath,
                        facePhotoURL: current.facePhotoURL
                    )
                } else {
                    hostApplication = HostApplication(
                        id: UUID().uuidString,
                        fullName: currentUser.fullName,
                        phone: currentUser.phone,
                        region: currentUser.region,
                        city: currentUser.city,
                        idType: "Ghana Card",
                        idNumber: "",
                        experience: "",
                        fleetSize: 1,
                        note: "",
                        status: mappedStatus,
                        rejectionReason: nil,
                        idFrontPath: "",
                        idBackPath: "",
                        facePhotoURL: currentUser.avatar
                    )
                }
            }
        } catch {}

        do {
            let application = try await withAuthenticatedToken { token in
                try await api.getHostApplication(baseURL: apiBaseURL, token: token)
            }
            if let data = application.data {
                let mappedApplication = mapHostApplication(data)
                hostApplication = mappedApplication

                switch mappedApplication.status {
                case .approved:
                    hostApplicationStatus = "approved"
                    hostAccessState = .host
                    currentUser.role = .host
                case .pending:
                    if hostAccessState != .host {
                        hostApplicationStatus = "pending"
                        hostAccessState = .pending
                        hostModeEnabled = false
                        currentUser.role = .guest
                    }
                case .rejected:
                    if hostAccessState != .host {
                        hostApplicationStatus = "rejected"
                        hostAccessState = .renter
                        hostModeEnabled = false
                        currentUser.role = .guest
                    }
                case .draft:
                    if hostAccessState != .host {
                        hostApplicationStatus = "draft"
                        if hostAccessState == .unknown {
                            hostAccessState = .renter
                        }
                        hostModeEnabled = false
                        currentUser.role = .guest
                    }
                }
            }
        } catch {}
    }

    private func syncHostReviews() async {
        guard isAuthenticated else { return }
        guard currentUser.role == .admin || hostAccessState == .host else { return }
        do {
            let response = try await withAuthenticatedToken { token in
                try await api.getHostReviews(baseURL: apiBaseURL, token: token)
            }
            hostReviews = response.data.map(mapReview)
            let grouped = Dictionary(grouping: hostReviews, by: \.carID)
            listingReviewsByCarID.merge(grouped) { _, new in new }
        } catch {
            // Keep last known reviews
        }
    }

    // MARK: - Host Application

    private func submitHostApplicationRemote(_ application: HostApplication) async -> Bool {
        guard authToken != nil else {
            syncErrorMessage = "Log in to submit a host application."
            return false
        }

        do {
            var payload: [String: Any] = [
                "full_name": application.fullName,
                "phone": application.phone,
                "region": application.region,
                "city": application.city,
                "id_type": application.idType,
                "id_number": application.idNumber,
                "experience": application.experience,
                "fleet_size": application.fleetSize,
                "note": application.note
            ]
            if !application.idFrontPath.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                payload["id_front_path"] = application.idFrontPath
            }
            if !application.idBackPath.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                payload["id_back_path"] = application.idBackPath
            }
            let response = try await withAuthenticatedToken { token in
                try await api.submitHostApplication(baseURL: apiBaseURL, token: token, payload: payload)
            }
            if let data = response.data {
                hostApplication = mapHostApplication(data)
            } else {
                hostApplication = application
                hostApplication?.status = .pending
            }
            hostAccessState = .pending
            hostApplicationStatus = "pending"
            syncErrorMessage = nil
            await syncHostApplication()
            return true
        } catch {
            if let apiError = error as? APIError,
               apiError.statusCode == 409 || apiError.message.localizedCaseInsensitiveContains("already pending") {
                hostAccessState = .pending
                hostApplicationStatus = "pending"
                syncErrorMessage = nil
                await syncHostApplication()
                return true
            }
            syncErrorMessage = errorMessage(error, fallback: "Unable to submit host application.")
            await syncHostApplication()
            return false
        }
    }

    // MARK: - Local Helpers

    @discardableResult
    private func appendLocalMessage(
        conversationID: String,
        body: String,
        mine: Bool,
        senderName: String,
        messageID: String = "local-msg-\(UUID().uuidString)",
        createdAt: Date = .now,
        deliveryState: ChatMessageDeliveryState = .sent
    ) -> String {
        let message = ChatMessage(
            id: messageID,
            conversationID: conversationID,
            senderID: mine ? currentUser.id : "",
            senderName: senderName,
            body: body,
            isMine: mine,
            createdAt: createdAt,
            deliveryState: deliveryState
        )

        var messages = messagesByConversation[conversationID, default: []]
        messages.append(message)
        messagesByConversation[conversationID] = normalizeMessages(messages)

        if let idx = conversations.firstIndex(where: { $0.id == conversationID }) {
            conversations[idx].lastMessagePreview = body
            conversations[idx].updatedAt = createdAt
            if !mine {
                conversations[idx].unreadCount += 1
            }
        }

        conversations.sort { $0.updatedAt > $1.updatedAt }
        return messageID
    }

    private func resolveLocalMessageSendSuccess(
        conversationID: String,
        messageID: String,
        serverMessage: ChatMessage
    ) {
        var messages = messagesByConversation[conversationID] ?? []
        if let idx = messages.firstIndex(where: { $0.id == messageID }) {
            messages[idx] = serverMessage
        } else if let idx = matchingLocalPendingIndex(for: serverMessage, in: messages) {
            messages[idx] = serverMessage
        } else if let idx = messages.firstIndex(where: { $0.id == serverMessage.id }) {
            messages[idx] = serverMessage
        } else {
            messages.append(serverMessage)
        }
        messagesByConversation[conversationID] = normalizeMessages(messages)
        updateLastServerCursor(for: conversationID, serverMessages: [serverMessage])
        updateConversationFromLatestMessage(conversationID)
    }

    private func updateLocalMessageDeliveryState(
        conversationID: String,
        messageID: String,
        state: ChatMessageDeliveryState
    ) {
        guard var messages = messagesByConversation[conversationID] else { return }
        guard let idx = messages.firstIndex(where: { $0.id == messageID }) else { return }
        messages[idx].deliveryState = state
        messagesByConversation[conversationID] = normalizeMessages(messages)
        updateConversationFromLatestMessage(conversationID)
    }

    private func mergeServerMessages(
        conversationID: String,
        serverMessages: [ChatMessage],
        isIncremental: Bool
    ) {
        let normalizedServer = serverMessages.map { message -> ChatMessage in
            var copy = message
            copy.deliveryState = .sent
            return copy
        }

        var merged: [ChatMessage]
        if isIncremental {
            merged = messagesByConversation[conversationID] ?? []
        } else {
            // Keep unresolved local sends but refresh server-backed history from source of truth.
            merged = (messagesByConversation[conversationID] ?? []).filter {
                isLocalMessageID($0.id) && $0.deliveryState != .sent
            }
        }

        for serverMessage in normalizedServer {
            if let exactIdx = merged.firstIndex(where: { $0.id == serverMessage.id }) {
                merged[exactIdx] = serverMessage
                continue
            }
            if let optimisticIdx = matchingLocalPendingIndex(for: serverMessage, in: merged) {
                merged[optimisticIdx] = serverMessage
                continue
            }
            merged.append(serverMessage)
        }

        messagesByConversation[conversationID] = normalizeMessages(merged)
        updateLastServerCursor(for: conversationID, serverMessages: normalizedServer)
        updateConversationFromLatestMessage(conversationID)
    }

    private func matchingLocalPendingIndex(for serverMessage: ChatMessage, in messages: [ChatMessage]) -> Int? {
        let tolerance: TimeInterval = 120
        return messages.enumerated()
            .filter { _, message in
                guard isLocalMessageID(message.id) else { return false }
                guard message.deliveryState != .sent else { return false }
                guard message.isMine == serverMessage.isMine else { return false }
                guard message.body == serverMessage.body else { return false }
                let delta = abs(message.createdAt.timeIntervalSince(serverMessage.createdAt))
                return delta <= tolerance
            }
            .min { lhs, rhs in
                let lhsDelta = abs(lhs.element.createdAt.timeIntervalSince(serverMessage.createdAt))
                let rhsDelta = abs(rhs.element.createdAt.timeIntervalSince(serverMessage.createdAt))
                return lhsDelta < rhsDelta
            }?
            .offset
    }

    private func normalizeMessages(_ messages: [ChatMessage]) -> [ChatMessage] {
        var byID: [String: ChatMessage] = [:]
        for message in messages {
            if let existing = byID[message.id] {
                byID[message.id] = preferredMessage(existing, message)
            } else {
                byID[message.id] = message
            }
        }
        return byID.values.sorted { lhs, rhs in
            if lhs.createdAt != rhs.createdAt {
                return lhs.createdAt < rhs.createdAt
            }
            return lhs.id < rhs.id
        }
    }

    private func preferredMessage(_ lhs: ChatMessage, _ rhs: ChatMessage) -> ChatMessage {
        let lhsRank = deliveryStateRank(lhs.deliveryState)
        let rhsRank = deliveryStateRank(rhs.deliveryState)
        if lhsRank != rhsRank {
            return lhsRank > rhsRank ? lhs : rhs
        }
        if lhs.createdAt != rhs.createdAt {
            return lhs.createdAt >= rhs.createdAt ? lhs : rhs
        }
        return rhs
    }

    private func deliveryStateRank(_ state: ChatMessageDeliveryState) -> Int {
        switch state {
        case .failed:
            return 0
        case .sending:
            return 1
        case .sent:
            return 2
        }
    }

    private func updateLastServerCursor(for conversationID: String, serverMessages: [ChatMessage]) {
        guard let latest = serverMessages.map(\.createdAt).max() else { return }
        let current = lastServerMessageDateByConversationID[conversationID]
        if let current, current >= latest { return }
        lastServerMessageDateByConversationID[conversationID] = latest
    }

    private func updateConversationFromLatestMessage(_ conversationID: String) {
        guard let latest = messagesByConversation[conversationID]?.last else { return }
        guard let idx = conversations.firstIndex(where: { $0.id == conversationID }) else { return }
        conversations[idx].lastMessagePreview = latest.body
        conversations[idx].updatedAt = latest.createdAt
        conversations.sort { $0.updatedAt > $1.updatedAt }
    }

    private func isLocalMessageID(_ messageID: String) -> Bool {
        messageID.hasPrefix(localMessagePrefix)
    }

    // MARK: - Mapping

    private func mapUserProfile(
        user: MobileAuthUserDTO,
        profile: ProfileDTO?,
        isHost: Bool,
        fallbackAvatar: String? = nil
    ) -> UserProfile {
        let metadata = user.user_metadata
        let firstName = profile?.first_name ?? metadataString(metadata, key: "first_name")
        let lastName = profile?.last_name ?? metadataString(metadata, key: "last_name")
        let fullName =
            profile?.full_name ??
            metadataString(metadata, key: "full_name") ??
            [firstName, lastName].compactMap { $0 }.joined(separator: " ").trimmingCharacters(in: .whitespacesAndNewlines)
        let avatarURL = preferredAvatarURL(
            profile?.avatar_url,
            profile?.avatar,
            metadataString(metadata, key: "avatar_url"),
            metadataString(metadata, key: "avatar"),
            metadataString(metadata, key: "picture"),
            metadataString(metadata, key: "photo_url"),
            fallbackAvatar
        )
        let resolvedIsHost = isHost || (profile?.is_host ?? false)
        let canonicalAvatar = RemoteImageURLResolver.canonicalString(avatarURL)

        let resolvedCity = (profile?.city ?? metadataString(metadata, key: "city") ?? "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let rawRegion = (profile?.region ?? metadataString(metadata, key: "region") ?? "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let resolvedRegion = rawRegion.isEmpty ? "" : MockDataService.normalizedRegion(rawRegion)

        return UserProfile(
            id: user.id,
            fullName: fullName.isEmpty ? "Hayame User" : fullName,
            email: profile?.email ?? user.email ?? "",
            phone: profile?.phone ?? "",
            city: resolvedCity,
            region: resolvedRegion,
            avatar: canonicalAvatar,
            role: resolvedIsHost ? .host : .guest
        )
    }

    private func preferredAvatarURL(_ candidates: String?...) -> String? {
        for candidate in candidates {
            guard let canonical = RemoteImageURLResolver.canonicalString(candidate) else { continue }
            let lowered = canonical.lowercased()
            if lowered.hasSuffix("/favicon.ico") || lowered.contains("/favicon.ico?") {
                continue
            }
            return canonical
        }
        return nil
    }

    private func mapCar(_ dto: CarDTO) -> Car {
        let imageURLs = dto.car_photos?.compactMap { RemoteImageURLResolver.canonicalString($0.url) } ?? []
        let fallbackImage = RemoteImageURLResolver.canonicalString(dto.image_url)
        let imageNames = imageURLs.isEmpty ? [fallbackImage].compactMap { $0 } : imageURLs
        let owner = dto.owner
        let deliveryAvailable = dto.delivery_available ?? false
        var normalizedFeatures = (dto.features ?? []).map {
            $0.trimmingCharacters(in: .whitespacesAndNewlines)
        }.filter { !$0.isEmpty }
        if (dto.air_conditioning ?? false) &&
            !normalizedFeatures.contains(where: { $0.compare("Air Conditioning", options: .caseInsensitive) == .orderedSame }) {
            normalizedFeatures.insert("Air Conditioning", at: 0)
        }

        let idVerified = dto.id_verified ?? owner?.id_verified ?? false
        let hostName = dto.host_name ?? owner?.full_name ?? "Host"

        return Car(
            id: dto.id,
            ownerID: dto.owner_id ?? owner?.id ?? "",
            title: dto.title ?? "Untitled Car",
            year: max(dto.year?.intValue ?? dto.car_year?.intValue ?? 2018, 2000),
            brand: dto.brand ?? "",
            model: dto.model ?? "",
            city: dto.city ?? "Accra",
            region: MockDataService.normalizedRegion(dto.region ?? MockDataService.defaultRegion),
            latitude: dto.latitude?.doubleValue ?? dto.lat?.doubleValue,
            longitude: dto.longitude?.doubleValue ?? dto.lng?.doubleValue,
            dailyPrice: max(dto.daily_price?.intValue ?? 0, 0),
            rating: max(dto.avg_rating?.doubleValue ?? 0, 0),
            reviewsCount: max(dto.reviews_count?.intValue ?? 0, 0),
            type: dto.car_type ?? "Car",
            transmission: normalizeTransmission(dto.transmission),
            seats: max(dto.seats?.intValue ?? 4, 2),
            fuelType: normalizeFuel(dto.fuel_type),
            description: dto.description ?? "No description available.",
            features: normalizedFeatures,
            imageNames: imageNames,
            hostName: hostName,
            hostAvatar: RemoteImageURLResolver.canonicalString(dto.host_avatar ?? owner?.avatar_url),
            hostCity: owner?.city,
            hostVerified: idVerified,
            hostPhoneVerified: dto.phone_verified ?? owner?.phone_verified ?? idVerified,
            hostEmailVerified: dto.email_verified ?? owner?.email_verified ?? idVerified,
            hostLevel: humanizeHostLevel(dto.host_level ?? owner?.host_level),
            instantBook: dto.instant_book ?? false,
            deliveryAvailable: deliveryAvailable,
            airConditioning: dto.air_conditioning ?? false,
            deliveryFee: deliveryAvailable ? max(dto.delivery_fee?.intValue ?? 0, 0) : 0,
            insuranceFee: max(dto.insurance_fee?.intValue ?? 0, 0),
            depositAmount: max(dto.deposit_amount?.intValue ?? 0, 0),
            outsideAccraFee: max(dto.outside_accra_fee?.intValue ?? 0, 0),
            cancellationPolicy: humanizeCancellationPolicy(dto.cancellation_policy),
            approvalStatus: dto.approval_status ?? "approved",
            isAvailable: dto.is_available ?? true,
            favoritesCount: max(dto.favorites_count?.intValue ?? 0, 0),
            createdAt: parseDate(dto.created_at)
        )
    }

    private func mapBooking(_ dto: BookingDTO) -> Booking {
        let status = mapBookingStatus(dto.status)
        let paymentStatus = mapPaymentStatus(dto.payment_status)
        let rawTripRegion = dto.trip_use_region?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let normalizedTripRegion = rawTripRegion.isEmpty ? "" : MockDataService.normalizedRegion(rawTripRegion)
        let normalizedTripCity = dto.trip_use_city?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

        return Booking(
            id: dto.id,
            carID: dto.car_id ?? "",
            renterID: dto.renter_id ?? "",
            hostID: dto.cars?.owner_id ?? "",
            conversationID: dto.conversation_id,
            carTitle: dto.cars?.title ?? "Car",
            carBrand: dto.cars?.brand?.trimmingCharacters(in: .whitespacesAndNewlines) ?? "",
            carImageNames: ([dto.cars?.image_url].compactMap { $0 } + (dto.cars?.car_photos ?? []).compactMap(\.url))
                .filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty },
            renterName: dto.renter?.full_name ?? (dto.renter_id == currentUser.id ? currentUser.fullName : "Guest"),
            hostName: dto.cars?.owner?.full_name ?? "Host",
            startDate: parseDate(dto.start_date),
            endDate: parseDate(dto.end_date),
            status: status,
            paymentStatus: paymentStatus,
            totalPrice: max(dto.total_price?.intValue ?? 0, 0),
            deliveryAddress: dto.delivery_address ?? "",
            deliveryTime: dto.delivery_time ?? "",
            contactPhone: dto.contact_phone ?? "",
            deliveryNotes: dto.delivery_notes ?? "",
            tripUseRegion: normalizedTripRegion,
            tripUseCity: normalizedTripCity,
            tripUseAddress: dto.trip_use_address ?? "",
            tripOutsideAccra: dto.trip_outside_accra ?? false,
            dailyRate: max(dto.daily_rate?.intValue ?? 0, 0),
            subtotal: max(dto.subtotal?.intValue ?? 0, 0),
            platformFee: max(dto.platform_fee?.intValue ?? 0, 0),
            insuranceFee: max(dto.insurance_fee?.intValue ?? 0, 0),
            deliveryFee: max(dto.delivery_fee?.intValue ?? 0, 0),
            outsideAccraSurcharge: max(dto.outside_accra_surcharge?.intValue ?? 0, 0),
            depositAmount: max(dto.deposit_amount?.intValue ?? 0, 0),
            paymentReference: dto.payment_reference,
            rejectionReason: dto.rejection_reason,
            createdAt: parseDate(dto.created_at)
        )
    }

    private func mapConversation(_ dto: ConversationDTO) -> Conversation {
        let fallbackAvatar = cars.first(where: {
            ($0.ownerID == (dto.other_user?.id ?? "")) ||
            (!$0.hostName.isEmpty &&
                $0.hostName.caseInsensitiveCompare(dto.other_user?.name ?? "") == .orderedSame)
        })?.hostAvatar

        return Conversation(
            id: dto.id,
            participantID: dto.other_user?.id,
            carID: dto.car_id,
            participantName: dto.other_user?.name ?? "User",
            participantAvatar: RemoteImageURLResolver.canonicalString(dto.other_user?.avatar ?? fallbackAvatar),
            lastMessagePreview: dto.last_message_preview ?? "",
            updatedAt: parseDate(dto.last_message_at ?? dto.created_at),
            unreadCount: max(dto.unread_count ?? 0, 0)
        )
    }

    private func mapMessage(_ dto: MessageDTO, participantName: String) -> ChatMessage {
        let mine = dto.sender_id == currentUser.id
        return ChatMessage(
            id: dto.id,
            conversationID: dto.conversation_id,
            senderID: dto.sender_id,
            senderName: mine ? currentUser.fullName : participantName,
            body: dto.body,
            isMine: mine,
            createdAt: parseDate(dto.created_at)
        )
    }

    private func mapReview(_ dto: ReviewDTO) -> Review {
        Review(
            id: dto.id,
            carID: dto.car_id ?? "",
            carTitle: dto.cars?.title ?? "Car",
            guestName: dto.reviewer?.full_name ?? "Guest",
            rating: max(dto.rating?.intValue ?? 0, 0),
            comment: dto.comment ?? "",
            createdAt: parseDate(dto.created_at)
        )
    }

    private func mapHostApplication(_ dto: HostApplicationDTO) -> HostApplication {
        HostApplication(
            id: dto.id ?? UUID().uuidString,
            fullName: dto.full_name ?? currentUser.fullName,
            phone: dto.phone ?? currentUser.phone,
            region: MockDataService.normalizedRegion(dto.region ?? currentUser.region),
            city: dto.city ?? currentUser.city,
            idType: dto.id_type ?? "Ghana Card",
            idNumber: dto.id_number ?? "",
            experience: dto.experience ?? "",
            fleetSize: max(dto.fleet_size?.intValue ?? 1, 1),
            note: dto.note ?? "",
            status: mapHostStatus(dto.status),
            rejectionReason: dto.rejection_reason,
            idFrontPath: dto.id_front_path ?? "",
            idBackPath: dto.id_back_path ?? "",
            facePhotoURL: currentUser.avatar
        )
    }

    private func mapBookingStatus(_ raw: String?) -> BookingStatus {
        guard let raw = raw?.lowercased() else { return .pending }
        return BookingStatus(rawValue: raw) ?? .pending
    }

    private func mapPaymentStatus(_ raw: String?) -> PaymentStatus {
        guard let raw = raw?.lowercased() else { return .pending }
        return PaymentStatus(rawValue: raw) ?? .pending
    }

    private func mapHostStatus(_ raw: String?) -> HostApplicationStatus {
        guard let raw = raw?.lowercased() else { return .pending }
        return HostApplicationStatus(rawValue: raw) ?? .pending
    }

    private func resolveHostAccess(isHost: Bool, status: String?) -> HostAccessState {
        if isHost { return .host }
        let normalized = status?.lowercased()
        if normalized == "approved" { return .host }
        if normalized == "pending" { return .pending }
        return .renter
    }

    private func parseDate(_ value: String?) -> Date {
        guard let value, !value.isEmpty else { return .now }
        if let date = Self.iso8601WithFractional.date(from: value) {
            return date
        }
        if let date = Self.iso8601Basic.date(from: value) {
            return date
        }
        if let date = Self.dateOnlyFormatter.date(from: value) {
            return date
        }
        return .now
    }

    private func metadataString(_ metadata: [String: StringOrBoolOrNumber]?, key: String) -> String? {
        guard let value = metadata?[key] else { return nil }
        switch value {
        case .string(let text):
            return text
        case .int(let number):
            return String(number)
        case .double(let number):
            return String(number)
        case .bool(let value):
            return value ? "true" : "false"
        case .null:
            return nil
        }
    }

    private func paystackReference(from callbackURL: URL?) -> String? {
        guard let callbackURL else { return nil }
        guard let components = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false) else {
            return nil
        }
        let queries = components.queryItems ?? []
        let preferredKeys = ["reference", "trxref"]
        for key in preferredKeys {
            if let value = queries.first(where: { $0.name.caseInsensitiveCompare(key) == .orderedSame })?.value,
               !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                return value
            }
        }
        return nil
    }

    private func participantName(for conversationID: String) -> String {
        conversations.first(where: { $0.id == conversationID })?.participantName ?? "User"
    }

    private func replaceCar(_ updated: Car, in list: inout [Car]) {
        if let idx = list.firstIndex(where: { $0.id == updated.id }) {
            list[idx] = updated
        } else {
            list.insert(updated, at: 0)
        }
    }

    private func normalizeTransmission(_ value: String?) -> String {
        guard let value, !value.isEmpty else { return "Automatic" }
        return value.capitalized
    }

    private func normalizeFuel(_ value: String?) -> String {
        guard let value, !value.isEmpty else { return "Petrol" }
        return value.capitalized
    }

    private func humanizeHostLevel(_ value: String?) -> String {
        guard let value, !value.isEmpty else { return "Host" }
        return value
            .replacingOccurrences(of: "_", with: " ")
            .split(separator: " ")
            .map { $0.capitalized }
            .joined(separator: " ")
    }

    private func humanizeCancellationPolicy(_ value: String?) -> String {
        guard let value, !value.isEmpty else { return "Moderate" }
        return value
            .replacingOccurrences(of: "_", with: " ")
            .split(separator: " ")
            .map { $0.capitalized }
            .joined(separator: " ")
    }

    private func listingPayload(from draft: ListingDraft) -> [String: Any] {
        [
            "title": draft.title,
            "description": draft.description.isEmpty ? "Clean and reliable car listing." : draft.description,
            "daily_price": draft.price,
            "city": draft.city,
            "region": draft.region,
            "car_type": draft.carType,
            "seats": draft.seats,
            "transmission": draft.transmission.lowercased(),
            "fuel_type": draft.fuelType.lowercased(),
            "brand": draft.brand,
            "model": draft.model,
            "car_year": draft.year,
            "is_available": true,
            "instant_book": draft.instantBook,
            "delivery_available": draft.deliveryAvailable,
            "air_conditioning": draft.airConditioning,
            "delivery_fee": draft.deliveryAvailable ? draft.deliveryFee : 0,
            "insurance_fee": draft.insuranceFee,
            "deposit_amount": draft.depositAmount,
            "outside_accra_fee": draft.outsideAccraFee,
            "cancellation_policy": draft.cancellationPolicy.lowercased()
        ]
    }

    private func startPolling() {
        stopPolling()
        pollTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 8_000_000_000)
                guard let self else { continue }
                guard self.isAuthenticated else { continue }
                if self.currentUser.id == UserProfile.anonymousGuest.id {
                    try? await self.refreshCurrentUserContext()
                }
                await self.registerPushDeviceTokenIfAvailable()
                await self.syncBookings()
                await self.syncConversations()
            }
        }
    }

    private func stopPolling() {
        pollTask?.cancel()
        pollTask = nil
    }

    private func registerPushDeviceTokenIfAvailable() async {
        guard isAuthenticated else { return }
        guard let deviceToken = NotificationManager.shared.apnsDeviceToken else { return }
        let previousDeviceToken = NotificationManager.shared.lastUploadedPushToken
        let previousTokenToReplace =
            previousDeviceToken == deviceToken ? nil : previousDeviceToken
        do {
            let registration = try await withAuthenticatedToken { token in
                try await api.registerPushToken(
                    baseURL: apiBaseURL,
                    token: token,
                    deviceToken: deviceToken,
                    previousDeviceToken: previousTokenToReplace
                )
            }
            let warning = registration.warning?.trimmingCharacters(in: .whitespacesAndNewlines)
            NotificationManager.shared.markPushTokenRegistration(
                token: deviceToken,
                deliveryEnabled: registration.registered != false && (warning == nil || warning?.isEmpty == true)
            )
            if registration.registered == false {
                syncErrorMessage = warning.flatMap { $0.isEmpty ? nil : $0 }
                    ?? registration.message
                    ?? "Push token registration failed."
                NotificationManager.shared.markRemotePushDeliveryUnavailable()
            }
        } catch let apiError as APIError {
            // Push registration endpoint may not be deployed yet.
            if apiError.statusCode != 404 {
                syncErrorMessage = apiError.message
            }
            NotificationManager.shared.markRemotePushDeliveryUnavailable()
        } catch {
            NotificationManager.shared.markRemotePushDeliveryUnavailable()
        }
    }

    private func unregisterPushDeviceTokenIfPossible(
        authToken: String?,
        baseURL: String,
        deviceToken: String?
    ) {
        guard let authToken, let deviceToken else { return }
        let trimmedToken = deviceToken.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedToken.isEmpty else { return }

        Task {
            do {
                _ = try await api.unregisterPushToken(
                    baseURL: baseURL,
                    token: authToken,
                    deviceToken: trimmedToken
                )
            } catch {}
        }
    }

    private func notifyOnConversationChanges(previousUnread: [String: Int], current: [Conversation]) async {
        guard !NotificationManager.shared.shouldUseRemotePushDelivery else { return }
        for conversation in current {
            let oldUnread = previousUnread[conversation.id] ?? 0
            guard conversation.unreadCount > oldUnread else { continue }
            let fallback = "You have \(conversation.unreadCount - oldUnread) new message(s)."
            let preview = conversation.lastMessagePreview.trimmingCharacters(in: .whitespacesAndNewlines)
            await NotificationManager.shared.scheduleLocalNotification(
                title: "New message from \(conversation.participantName)",
                body: preview.isEmpty ? fallback : preview
            )
        }
    }

    private func notifyOnBookingChanges(previous: [String: Booking], next: [String: Booking]) async {
        guard !NotificationManager.shared.shouldUseRemotePushDelivery else { return }
        for booking in next.values {
            let isHostContext = booking.hostID == currentUser.id
            if let existing = previous[booking.id] {
                guard existing.status != booking.status else { continue }

                let title: String
                let body: String
                switch booking.status {
                case .awaitingHost:
                    title = isHostContext ? "New booking request" : "Booking request sent"
                    body = isHostContext
                        ? "\(booking.renterName) requested \(booking.carTitle)."
                        : "Your request for \(booking.carTitle) is awaiting host approval."
                case .confirmed:
                    title = "Booking confirmed"
                    body = isHostContext
                        ? "You approved \(booking.renterName)'s booking for \(booking.carTitle)."
                        : "Your trip for \(booking.carTitle) is confirmed."
                case .rejected:
                    title = isHostContext ? "Booking rejected" : "Booking request declined"
                    body = isHostContext
                        ? "You declined \(booking.renterName)'s request for \(booking.carTitle)."
                        : "Your request for \(booking.carTitle) was declined."
                case .cancelled:
                    title = "Booking cancelled"
                    body = "\(booking.carTitle) booking was cancelled."
                case .completed:
                    title = "Trip completed"
                    body = "\(booking.carTitle) has been marked completed."
                case .refunded:
                    title = "Booking refunded"
                    body = "\(booking.carTitle) payment has been refunded."
                case .pending:
                    title = "Booking updated"
                    body = "\(booking.carTitle): \(booking.status.label)"
                }
                await NotificationManager.shared.scheduleLocalNotification(title: title, body: body)
            } else {
                let title = isHostContext ? "New booking request" : "Booking request sent"
                let body = isHostContext
                    ? "\(booking.renterName) requested \(booking.carTitle)."
                    : "Your request for \(booking.carTitle) is \(booking.status.label.lowercased())."
                await NotificationManager.shared.scheduleLocalNotification(title: title, body: body)
            }
        }
    }

    private func notifyOnOwnedListingApprovalChanges(previous: [String: String], current: [Car]) async {
        for car in current {
            let currentStatus = car.approvalStatus.lowercased()
            guard let previousStatus = previous[car.id], previousStatus != currentStatus else { continue }

            let title: String
            let body: String
            switch currentStatus {
            case "approved":
                title = "Listing approved"
                body = "\(car.displayTitle) is now live for guests."
            case "rejected":
                title = "Listing rejected"
                body = "\(car.displayTitle) was rejected. Update details and resubmit."
            case "pending":
                title = "Listing pending review"
                body = "\(car.displayTitle) is awaiting approval."
            default:
                continue
            }

            await NotificationManager.shared.scheduleLocalNotification(title: title, body: body)
        }
    }

    private func errorMessage(_ error: Error, fallback: String) -> String {
        if let apiError = error as? APIError {
            return apiError.message
        }
        if let urlError = error as? URLError {
            switch urlError.code {
            case .cannotConnectToHost, .cannotFindHost, .networkConnectionLost, .notConnectedToInternet, .timedOut:
                return "Poor network, please refresh."
            default:
                break
            }
        }

        let nsError = error as NSError
        if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCannotConnectToHost {
            return "Poor network, please refresh."
        }
        return error.localizedDescription.isEmpty ? fallback : error.localizedDescription
    }

    private func loginErrorMessage(_ error: Error) -> String {
        let message = errorMessage(error, fallback: wrongEmailOrPasswordMessage)
        let lowered = message.lowercased()
        if let apiError = error as? APIError, apiError.statusCode == 401 {
            return wrongEmailOrPasswordMessage
        }
        if lowered.contains("invalid") && lowered.contains("credential") {
            return wrongEmailOrPasswordMessage
        }
        return message
    }

    deinit {
        pollTask?.cancel()
        conversationRealtimeTask?.cancel()
        if let pushTokenObserver {
            NotificationCenter.default.removeObserver(pushTokenObserver)
        }
        if let pushRegistrationFailureObserver {
            NotificationCenter.default.removeObserver(pushRegistrationFailureObserver)
        }
        if let pushNotificationRouteObserver {
            NotificationCenter.default.removeObserver(pushNotificationRouteObserver)
        }
        if let appDidBecomeActiveObserver {
            NotificationCenter.default.removeObserver(appDidBecomeActiveObserver)
        }
    }

    private static func defaultAPIBaseURL() -> String {
        let args = ProcessInfo.processInfo.arguments
        if let idx = args.firstIndex(of: "-HAYAME_API_BASE_URL"), args.indices.contains(idx + 1) {
            let candidate = args[idx + 1].trimmingCharacters(in: .whitespacesAndNewlines)
            if !candidate.isEmpty {
                return canonicalBaseURL(candidate)
            }
        }

        let environment = ProcessInfo.processInfo.environment["HAYAME_API_BASE_URL"]?.trimmingCharacters(in: .whitespacesAndNewlines)
        if let environment, !environment.isEmpty {
            return canonicalBaseURL(environment)
        }

        if let infoValue = Bundle.main.object(forInfoDictionaryKey: "HAYAMEAPIBaseURL") as? String {
            let trimmed = infoValue.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty {
                return canonicalBaseURL(trimmed)
            }
        }

        return canonicalBaseURL(productionBaseURL)
    }

    private static func canonicalBaseURL(_ raw: String) -> String {
        var candidate = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if candidate.isEmpty {
            candidate = productionBaseURL
        }
        if !candidate.contains("://") {
            candidate = "http://\(candidate)"
        }
        while candidate.hasSuffix("/") {
            candidate.removeLast()
        }
        candidate = normalizeKnownProductionHost(candidate)
        return normalizeRuntimeBaseURL(candidate)
    }

    private static func normalizeKnownProductionHost(_ raw: String) -> String {
        guard var components = URLComponents(string: raw), let host = components.host?.lowercased() else {
            return raw
        }
        if host == "hayamegh.com" {
            components.host = "www.hayamegh.com"
            return components.string ?? raw
        }
        return raw
    }

    private static func normalizeRuntimeBaseURL(_ raw: String) -> String {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
#if targetEnvironment(simulator)
        return trimmed
#else
        guard isLoopbackBaseURL(trimmed) else { return trimmed }

        if let devMachineIP = Bundle.main.object(forInfoDictionaryKey: "HAYAMEDevMachineIP") as? String {
            let ip = devMachineIP.trimmingCharacters(in: .whitespacesAndNewlines)
            if !ip.isEmpty, var components = URLComponents(string: trimmed) {
                components.host = ip
                if components.port == nil {
                    components.port = 3000
                }
                return components.string ?? "http://\(ip):3000"
            }
        }

        return trimmed
#endif
    }

    private static func isLoopbackBaseURL(_ raw: String) -> Bool {
        guard let components = URLComponents(string: raw), let host = components.host?.lowercased() else {
            return raw.contains("localhost")
        }
        return host == "localhost" || host == "127.0.0.1" || host == "::1"
    }
}

private extension PushNotificationRoute {
    var appAnnouncement: AppAnnouncement? {
        guard let announcementID = announcementID.nilIfBlank else { return nil }
        guard let title = announcementTitle.nilIfBlank,
              let body = announcementBody.nilIfBlank
        else { return nil }

        let ctaURL = announcementCTAURL.nilIfBlank
        return AppAnnouncement(
            id: announcementID,
            title: title,
            body: body,
            category: announcementCategory.nilIfBlank ?? "news",
            delivery: "push",
            audience: "all",
            showOnce: true,
            ctaLabel: ctaURL == nil ? nil : "Open",
            ctaURL: ctaURL,
            startsAt: nil,
            endsAt: nil,
            publishedAt: nil,
            seen: false
        )
    }
}

private extension Optional where Wrapped == String {
    var nilIfBlank: String? {
        guard let value = self?.trimmingCharacters(in: .whitespacesAndNewlines), !value.isEmpty else {
            return nil
        }
        return value
    }
}

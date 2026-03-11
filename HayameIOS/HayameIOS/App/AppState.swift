import Foundation
import SwiftUI

enum ExploreSortOption: String, CaseIterable, Identifiable {
    case recommended = "Recommended"
    case priceLow = "Price: Low to High"
    case priceHigh = "Price: High to Low"
    case topRated = "Top Rated"
    case newest = "Newest"

    var id: String { rawValue }
}

@MainActor
final class AppState: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isGuestMode = false
    @Published var currentUser = UserProfile.anonymousGuest

    @Published var renterTab: RenterTab = .home
    @Published var hostTab: HostTab = .dashboard

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

    @Published var exploreSearchText = ""
    @Published var exploreFilters = ExploreFilterState()
    @Published var exploreSortOption: ExploreSortOption = .recommended

    @Published var hostApplication: HostApplication?
    @Published var hostAccessState: HostAccessState = .unknown
    @Published var hostApplicationStatus: String?
    @Published var publicCarsLoadState: ViewLoadState = .idle
    @Published var bookingsLoadState: ViewLoadState = .idle
    @Published var conversationsLoadState: ViewLoadState = .idle
    @Published var favoritesLoadState: ViewLoadState = .idle
    @Published var referenceData = ReferenceDataCatalog()

    @Published var apiBaseURL: String = AppState.defaultAPIBaseURL()
    @Published var isSyncingRemote = false
    @Published var syncErrorMessage: String?

    private let api = APIClient.shared
    private let defaults = UserDefaults.standard

    private let authTokenKey = "hayame.auth_token"
    private let refreshTokenKey = "hayame.refresh_token"
    private let apiBaseURLKey = "hayame.api_base_url"

    private var authToken: String?
    private var refreshToken: String?
    private var pollTask: Task<Void, Never>?
    private var conversationRealtimeTask: Task<Void, Never>?
    private var hasSyncedBookingsOnce = false
    private var hasSyncedConversationsOnce = false
    private var isSyncingCars = false
    private var isSyncingConversations = false
    private var loadingConversationIDs: Set<String> = []
    private var pendingMessageDraftByConversationID: [String: String] = [:]

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

    init() {
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
        migrateLoopbackBaseURLIfNeeded()
        restorePersistedSession()
        Task {
            await refreshReferenceData()
            await syncPublicCars()
            await bootstrapSessionIfNeeded()
        }
    }

    var isHostApproved: Bool {
        hostAccessState == .host
    }

    var isHostPending: Bool {
        hostAccessState == .pending
    }

    var hasAppAccess: Bool {
        isAuthenticated || isGuestMode
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
                car.city.caseInsensitiveCompare(exploreFilters.city) != .orderedSame {
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

    func signIn(email: String, password: String) {
        guard !email.isEmpty, !password.isEmpty else { return }
        Task { await signInRemote(email: email, password: password) }
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

    func signOut() {
        stopPolling()
        stopRealtimeMessages()
        clearPersistedSession()
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
        pendingConversationID = nil
        pendingConversationParticipantName = nil
        pendingMessageDraftByConversationID = [:]
        hostApplication = nil
        hostApplicationStatus = nil
        hostAccessState = .unknown
        ownedCars = []
        syncErrorMessage = nil
        hasSyncedBookingsOnce = false
        hasSyncedConversationsOnce = false
        bookingsLoadState = .idle
        conversationsLoadState = .idle
        favoritesLoadState = .idle

        Task {
            await syncPublicCars()
        }
    }

    func continueAsGuest() {
        stopPolling()
        stopRealtimeMessages()
        clearPersistedSession()
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
        pendingConversationID = nil
        pendingConversationParticipantName = nil
        pendingMessageDraftByConversationID = [:]
        hostApplication = nil
        hostApplicationStatus = nil
        hostAccessState = .renter
        ownedCars = []
        syncErrorMessage = nil
        hasSyncedBookingsOnce = false
        hasSyncedConversationsOnce = false
        bookingsLoadState = .idle
        conversationsLoadState = .idle
        favoritesLoadState = .idle

        Task {
            await syncPublicCars()
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
        pendingConversationID = nil
        pendingConversationParticipantName = nil
        pendingMessageDraftByConversationID = [:]
        hostApplication = nil
        hostApplicationStatus = nil
        hostAccessState = .unknown
        ownedCars = []
        syncErrorMessage = nil
        hasSyncedBookingsOnce = false
        hasSyncedConversationsOnce = false
        bookingsLoadState = .idle
        conversationsLoadState = .idle
        favoritesLoadState = .idle
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
        markConversationRead(conversationID)

        conversationRealtimeTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 4_000_000_000)
                guard let self else { continue }
                guard self.isAuthenticated else { continue }
                await self.loadMessages(for: conversationID, markRead: true)
                await self.syncConversations()
            }
        }
    }

    func stopRealtimeMessages() {
        conversationRealtimeTask?.cancel()
        conversationRealtimeTask = nil
    }

    func refreshConversationsNow() {
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
        Task {
            await syncHostApplication()
            if hostAccessState == .host {
                hostTab = .dashboard
            } else if hostAccessState == .pending {
                syncErrorMessage = "Your host application is still pending review."
            } else {
                syncErrorMessage = "Host access is not available on this account yet."
            }
        }
    }

    func switchToAdminMode() {
        guard isAuthenticated else {
            syncErrorMessage = "Log in to access admin."
            return
        }
        currentUser.role = .admin
    }

    func switchToGuestMode() {
        currentUser.role = .guest
        renterTab = .home
    }

    func submitHostApplication(_ application: HostApplication) {
        Task { await submitHostApplicationRemote(application) }
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
            Task {
                do {
                    _ = try await withAuthenticatedToken { token in
                        try await api.sendMessage(
                            baseURL: apiBaseURL,
                            token: token,
                            conversationID: conversationID,
                            body: trimmed
                        )
                    }
                    await loadMessages(for: conversationID, markRead: false)
                    await syncConversations()
                } catch {
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

    func openConversationInInbox(conversationID: String, participantName: String, draft: String? = nil) {
        let trimmedDraft = draft?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !trimmedDraft.isEmpty {
            pendingMessageDraftByConversationID[conversationID] = trimmedDraft
        }
        markConversationRead(conversationID)
        pendingConversationID = conversationID
        pendingConversationParticipantName = participantName
        renterTab = .inbox
    }

    func consumePendingConversationDraft(for conversationID: String) -> String? {
        let draft = pendingMessageDraftByConversationID[conversationID]
        pendingMessageDraftByConversationID.removeValue(forKey: conversationID)
        return draft
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
        if let resolved = RemoteImageURLResolver.resolve(canonical) {
            await RemoteImagePipeline.shared.prefetch(
                urls: [resolved],
                limit: 1,
                targetPixelSize: CGSize(width: 220, height: 220),
                maxConcurrent: 1
            )
        }
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
            await loadMessages(for: conversationID, markRead: true)
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
        guard authToken != nil else {
            syncErrorMessage = "Log in to create a listing."
            return
        }
        Task {
            do {
                let payload = listingPayload(from: draft)
                let result = try await withAuthenticatedToken { token in
                    try await api.createCar(baseURL: apiBaseURL, token: token, payload: payload)
                }
                let created = mapCar(result.data)
                ownedCars.insert(created, at: 0)
                if created.approvalStatus.lowercased() == "approved" {
                    cars.insert(created, at: 0)
                }
            } catch {
                syncErrorMessage = errorMessage(error, fallback: "Unable to create listing.")
            }
        }
    }

    func updateListing(_ car: Car, from draft: ListingDraft) {
        guard authToken != nil else {
            syncErrorMessage = "Log in to update a listing."
            return
        }

        Task {
            do {
                let payload = listingPayload(from: draft)
                let result = try await withAuthenticatedToken { token in
                    try await api.updateCar(baseURL: apiBaseURL, token: token, carID: car.id, payload: payload)
                }
                let updated = mapCar(result.data)
                replaceCar(updated, in: &ownedCars)
                replaceCar(updated, in: &cars)
            } catch {
                syncErrorMessage = errorMessage(error, fallback: "Unable to update listing.")
            }
        }
    }

    func deleteListing(_ car: Car) {
        guard authToken != nil else {
            syncErrorMessage = "Log in to delete a listing."
            return
        }

        Task {
            do {
                try await withAuthenticatedToken { token in
                    try await api.deleteCar(baseURL: apiBaseURL, token: token, carID: car.id)
                }
                ownedCars.removeAll { $0.id == car.id }
                cars.removeAll { $0.id == car.id }
            } catch {
                syncErrorMessage = errorMessage(error, fallback: "Unable to delete listing.")
            }
        }
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
        region: String,
        city: String,
        address: String,
        start: Date,
        end: Date
    ) async throws -> PaystackCheckoutSession {
        guard authToken != nil else {
            throw APIError(message: "Log in to book this car.")
        }

        let startDate = Self.dateOnlyFormatter.string(from: start)
        let endDate = Self.dateOnlyFormatter.string(from: end)
        let normalizedRegion = MockDataService.normalizedRegion(region)
        let normalizedCity = city.trimmingCharacters(in: .whitespacesAndNewlines)
        let normalizedAddress = address.trimmingCharacters(in: .whitespacesAndNewlines)

        if normalizedCity.isEmpty || normalizedAddress.count < 3 {
            throw APIError(message: "Trip use location is required.")
        }

        do {
            let checkoutSession = try await withAuthenticatedToken { token in
                let hold = try await api.createBookingHold(
                    baseURL: apiBaseURL,
                    token: token,
                    carID: car.id,
                    startDate: startDate,
                    endDate: endDate,
                    tripUseRegion: normalizedRegion,
                    tripUseCity: normalizedCity,
                    tripUseAddress: normalizedAddress
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
                    tripUseAddress: normalizedAddress,
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
        callbackURL: URL
    ) async throws -> String? {
        guard authToken != nil else {
            throw APIError(message: "Log in to complete payment.")
        }

        let resolvedReference = paystackReference(from: callbackURL) ?? checkout.reference
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
            await syncBookings()
            await syncConversations()
            syncErrorMessage = nil
            return finalized.conversationId
        } catch {
            syncErrorMessage = errorMessage(error, fallback: "Payment completed but booking finalization failed.")
            throw error
        }
    }

    func refreshCarDetail(carID: String) async {
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

    private func signInRemote(email: String, password: String) async {
        isSyncingRemote = true
        syncErrorMessage = nil
        defer { isSyncingRemote = false }

        do {
            let session = try await api.login(baseURL: apiBaseURL, email: email, password: password)
            try await establishAuthenticatedSession(
                from: session,
                missingSessionMessage: "Login succeeded without an active session."
            )
        } catch {
            if shouldAutoSwitchToProductionBaseURL(after: error) {
                switchToProductionBaseURL()
                do {
                    let session = try await api.login(baseURL: apiBaseURL, email: email, password: password)
                    try await establishAuthenticatedSession(
                        from: session,
                        missingSessionMessage: "Login succeeded without an active session."
                    )
                    return
                } catch {
                    syncErrorMessage = errorMessage(error, fallback: "Unable to sign in.")
                    return
                }
            }
            syncErrorMessage = errorMessage(error, fallback: "Unable to sign in.")
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
        defer { isSyncingRemote = false }

        do {
            let session = try await api.signup(
                baseURL: apiBaseURL,
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: password,
                city: city,
                region: region
            )

            if session.requires_email_confirmation == true || session.access_token == nil || session.user == nil {
                syncErrorMessage = "Account created. Verify your email, then log in."
                return
            }

            try await establishAuthenticatedSession(
                from: session,
                missingSessionMessage: "Signup succeeded without an active session."
            )
        } catch {
            if shouldAutoSwitchToProductionBaseURL(after: error) {
                switchToProductionBaseURL()
                do {
                    let session = try await api.signup(
                        baseURL: apiBaseURL,
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        password: password,
                        city: city,
                        region: region
                    )

                    if session.requires_email_confirmation == true || session.access_token == nil || session.user == nil {
                        syncErrorMessage = "Account created. Verify your email, then log in."
                        return
                    }

                    try await establishAuthenticatedSession(
                        from: session,
                        missingSessionMessage: "Signup succeeded without an active session."
                    )
                    return
                } catch {
                    syncErrorMessage = errorMessage(error, fallback: "Unable to sign up.")
                    return
                }
            }
            syncErrorMessage = errorMessage(error, fallback: "Unable to sign up.")
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
        guard authToken != nil else { return }
        do {
            try await refreshCurrentUserContext()
            await refreshAllRemoteData()
        } catch {
            let refreshed = await refreshAccessTokenIfPossible()
            if refreshed {
                do {
                    try await refreshCurrentUserContext()
                    await refreshAllRemoteData()
                    startPolling()
                    await NotificationManager.shared.enableUserNotifications()
                    await registerPushDeviceTokenIfAvailable()
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
            stopPolling()
            stopRealtimeMessages()
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
        currentUser.role = .guest
        hasSyncedBookingsOnce = false
        hasSyncedConversationsOnce = false
        let normalizedHostStatus = hostStatus?.lowercased()
        hostApplicationStatus = normalizedHostStatus
        hostAccessState = resolveHostAccess(isHost: isHost ?? false, status: normalizedHostStatus)
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
        authToken = defaults.string(forKey: authTokenKey)
        refreshToken = defaults.string(forKey: refreshTokenKey)
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
    }

    // MARK: - Sync

    func refreshAllRemoteData() async {
        guard isAuthenticated else {
            await syncPublicCars()
            return
        }

        isSyncingRemote = true
        defer { isSyncingRemote = false }

        await refreshReferenceData()
        await syncPublicCars()
        await syncOwnedCars()
        await syncFavorites()
        await syncBookings()
        await syncConversations()
        await syncHostApplication()
        await syncHostReviews()
    }

    private func syncPublicCars() async {
        guard !isSyncingCars else { return }
        isSyncingCars = true
        defer { isSyncingCars = false }
        if cars.isEmpty {
            publicCarsLoadState = .loading
        }

        do {
            let response = try await api.getCars(baseURL: apiBaseURL, token: authToken)
            cars = response.data.map(mapCar)
            publicCarsLoadState = cars.isEmpty ? .empty : .loaded
            let imageURLs = cars.prefix(80).compactMap { car in
                RemoteImageURLResolver.resolve(car.imageNames.first)
            }
            let avatarURLs = cars.prefix(80).compactMap { car in
                RemoteImageURLResolver.resolve(car.hostAvatar)
            }
            await RemoteImagePipeline.shared.prefetch(
                urls: imageURLs,
                limit: 80,
                targetPixelSize: CGSize(width: 900, height: 620),
                maxConcurrent: 8
            )
            await RemoteImagePipeline.shared.prefetch(
                urls: avatarURLs,
                limit: 80,
                targetPixelSize: CGSize(width: 140, height: 140),
                maxConcurrent: 6
            )
        } catch {
            publicCarsLoadState = cars.isEmpty ? .error(errorMessage(error, fallback: "Unable to load listings.")) : .loaded
        }
    }

    private func syncOwnedCars() async {
        guard isAuthenticated else { return }
        do {
            let response = try await withAuthenticatedToken { token in
                try await api.getMyCars(baseURL: apiBaseURL, token: token)
            }
            ownedCars = response.data.map(mapCar)
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
            let previousByID = Dictionary(uniqueKeysWithValues: (renterBookings + hostBookings).map { ($0.id, $0) })
            let response = try await withAuthenticatedToken { token in
                try await api.getBookings(baseURL: apiBaseURL, token: token)
            }
            let mapped = response.data.map(mapBooking)
            let nextRenter = mapped.filter { $0.renterID == currentUser.id }
            let nextHost = mapped.filter { $0.hostID == currentUser.id }
            renterBookings = nextRenter
            hostBookings = nextHost
            bookingsLoadState = (nextRenter.isEmpty && nextHost.isEmpty) ? .empty : .loaded

            let nextByID = Dictionary(uniqueKeysWithValues: (nextRenter + nextHost).map { ($0.id, $0) })
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
            let previousUnread = Dictionary(uniqueKeysWithValues: conversations.map { ($0.id, $0.unreadCount) })
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

    private func loadMessages(for conversationID: String, markRead: Bool) async {
        guard isAuthenticated else { return }
        guard !loadingConversationIDs.contains(conversationID) else { return }
        loadingConversationIDs.insert(conversationID)
        defer { loadingConversationIDs.remove(conversationID) }
        do {
            let response = try await withAuthenticatedToken { token in
                try await api.getMessages(
                    baseURL: apiBaseURL,
                    token: token,
                    conversationID: conversationID,
                    markRead: markRead
                )
            }
            let participant = participantName(for: conversationID)
            messagesByConversation[conversationID] = response.data.map {
                mapMessage($0, participantName: participant)
            }

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
                hostApplication = mapHostApplication(data)
                if hostApplication?.status == .pending, hostAccessState != .host {
                    hostAccessState = .pending
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

    private func submitHostApplicationRemote(_ application: HostApplication) async {
        guard authToken != nil else {
            syncErrorMessage = "Log in to submit a host application."
            return
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
            await syncHostApplication()
        } catch {
            syncErrorMessage = errorMessage(error, fallback: "Unable to submit host application.")
            await syncHostApplication()
        }
    }

    // MARK: - Local Helpers

    private func appendLocalMessage(conversationID: String, body: String, mine: Bool, senderName: String) {
        let message = ChatMessage(
            id: "msg-\(UUID().uuidString)",
            conversationID: conversationID,
            senderID: mine ? currentUser.id : "",
            senderName: senderName,
            body: body,
            isMine: mine,
            createdAt: .now
        )

        messagesByConversation[conversationID, default: []].append(message)

        if let idx = conversations.firstIndex(where: { $0.id == conversationID }) {
            conversations[idx].lastMessagePreview = body
            conversations[idx].updatedAt = .now
            if !mine {
                conversations[idx].unreadCount += 1
            }
        }

        conversations.sort { $0.updatedAt > $1.updatedAt }
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
        let avatarURL = profile?.avatar_url ?? metadataString(metadata, key: "avatar_url")
        let resolvedIsHost = isHost || (profile?.is_host ?? false)
        let canonicalAvatar = RemoteImageURLResolver.canonicalString(avatarURL) ??
            RemoteImageURLResolver.canonicalString(fallbackAvatar)

        return UserProfile(
            id: user.id,
            fullName: fullName.isEmpty ? "Hayame User" : fullName,
            email: profile?.email ?? user.email ?? "",
            phone: profile?.phone ?? "",
            city: profile?.city ?? metadataString(metadata, key: "city") ?? "Accra",
            region: MockDataService.normalizedRegion(profile?.region ?? metadataString(metadata, key: "region") ?? MockDataService.defaultRegion),
            avatar: canonicalAvatar,
            role: resolvedIsHost ? .host : .guest
        )
    }

    private func mapCar(_ dto: CarDTO) -> Car {
        let imageURLs = dto.car_photos?.compactMap { RemoteImageURLResolver.canonicalString($0.url) } ?? []
        let fallbackImage = RemoteImageURLResolver.canonicalString(dto.image_url)
        let imageNames = imageURLs.isEmpty ? [fallbackImage].compactMap { $0 } : imageURLs
        let owner = dto.owner
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
            deliveryAvailable: dto.delivery_available ?? false,
            airConditioning: dto.air_conditioning ?? false,
            deliveryFee: max(dto.delivery_fee?.intValue ?? 0, 0),
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
            renterName: dto.renter?.full_name ?? (dto.renter_id == currentUser.id ? currentUser.fullName : "Guest"),
            hostName: dto.cars?.owner?.full_name ?? "Host",
            startDate: parseDate(dto.start_date),
            endDate: parseDate(dto.end_date),
            status: status,
            paymentStatus: paymentStatus,
            totalPrice: max(dto.total_price?.intValue ?? 0, 0),
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

    private func paystackReference(from callbackURL: URL) -> String? {
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
            "delivery_fee": draft.deliveryFee,
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
                try? await Task.sleep(nanoseconds: 12_000_000_000)
                guard let self else { continue }
                guard self.isAuthenticated else { continue }
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
        do {
            try await withAuthenticatedToken { token in
                try await api.registerPushToken(baseURL: apiBaseURL, token: token, deviceToken: deviceToken)
            }
        } catch let apiError as APIError {
            // Push registration endpoint may not be deployed yet.
            if apiError.statusCode != 404 {
                syncErrorMessage = apiError.message
            }
        } catch {}
    }

    private func notifyOnConversationChanges(previousUnread: [String: Int], current: [Conversation]) async {
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
        for booking in next.values {
            if let existing = previous[booking.id] {
                guard existing.status != booking.status else { continue }
                await NotificationManager.shared.scheduleLocalNotification(
                    title: "Trip updated",
                    body: "\(booking.carTitle): \(booking.status.label)"
                )
            } else {
                let isHostNotification = booking.hostID == currentUser.id
                let title = isHostNotification ? "New booking request" : "Trip booked"
                let body = isHostNotification
                    ? "\(booking.renterName) requested \(booking.carTitle)."
                    : "Your booking for \(booking.carTitle) is now \(booking.status.label.lowercased())."
                await NotificationManager.shared.scheduleLocalNotification(title: title, body: body)
            }
        }
    }

    private func errorMessage(_ error: Error, fallback: String) -> String {
        if let apiError = error as? APIError {
            return apiError.message
        }
        if let urlError = error as? URLError {
            switch urlError.code {
            case .cannotConnectToHost, .cannotFindHost, .networkConnectionLost, .notConnectedToInternet, .timedOut:
                if Self.isLoopbackBaseURL(apiBaseURL) {
#if targetEnvironment(simulator)
                    return "Cannot reach \(apiBaseURL). Start your web server first (for example: npm run dev)."
#else
                    return "Cannot reach \(apiBaseURL) from iPhone. Set HAYAMEAPIBaseURL (or HAYAMEDevMachineIP) to your Mac LAN IP, e.g. http://192.168.1.20:3000."
#endif
                }
                return "Cannot reach \(apiBaseURL). Check server/network and try again."
            default:
                break
            }
        }

        let nsError = error as NSError
        if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCannotConnectToHost {
            if Self.isLoopbackBaseURL(apiBaseURL) {
#if targetEnvironment(simulator)
                return "Cannot reach \(apiBaseURL). Start your web server first (for example: npm run dev)."
#else
                return "Cannot reach \(apiBaseURL) from iPhone. Set HAYAMEAPIBaseURL (or HAYAMEDevMachineIP) to your Mac LAN IP, e.g. http://192.168.1.20:3000."
#endif
            }
            return "Cannot reach \(apiBaseURL). Check server/network and try again."
        }
        return error.localizedDescription.isEmpty ? fallback : error.localizedDescription
    }

    deinit {
        pollTask?.cancel()
        conversationRealtimeTask?.cancel()
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

import Foundation

struct APIError: Error, LocalizedError {
    let message: String
    let statusCode: Int?
    /// Machine-readable reason from our API, e.g. "no_account", "wrong_password",
    /// "email_not_confirmed", "rate_limited". Lets the UI act on the specific
    /// failure instead of pattern-matching prose.
    let code: String?

    init(message: String, statusCode: Int? = nil, code: String? = nil) {
        self.message = message
        self.statusCode = statusCode
        self.code = code
    }

    var errorDescription: String? {
        message
    }
}

private struct APIErrorEnvelope: Decodable {
    let message: String?
    let code: String?
}

private struct SupabaseAuthErrorEnvelope: Decodable {
    let msg: String?
    let error_description: String?
    let error: String?
}

private struct EmptyResponse: Codable {}

private struct APIMessageResponse: Decodable {
    let message: String?
}

private struct AnyEncodable: Encodable {
    private let encodeFunc: (Encoder) throws -> Void

    init<T: Encodable>(_ wrapped: T) {
        self.encodeFunc = wrapped.encode(to:)
    }

    func encode(to encoder: Encoder) throws {
        try encodeFunc(encoder)
    }
}

enum HTTPMethod: String {
    case GET
    case POST
    case PUT
    case PATCH
    case DELETE
}

// MARK: - DTOs

struct MobileAuthUserDTO: Decodable {
    let id: String
    let email: String?
    let user_metadata: [String: StringOrBoolOrNumber]?
}

struct MobileAuthSessionDTO: Decodable {
    let access_token: String?
    let refresh_token: String?
    let expires_at: Int?
    let user: MobileAuthUserDTO?
    let profile: ProfileDTO?
    let is_host: Bool?
    let host_status: String?
    let host_application_status: String?
    let requires_email_confirmation: Bool?
}

struct MobileMeDTO: Decodable {
    let user: MobileAuthUserDTO
    let profile: ProfileDTO?
    let is_host: Bool?
    let host_status: String?
    let host_application_status: String?
    let host_application: HostApplicationDTO?
}

struct ProfileDTO: Decodable {
    let id: String?
    let first_name: String?
    let last_name: String?
    let full_name: String?
    let email: String?
    let phone: String?
    let city: String?
    let region: String?
    let avatar_url: String?
    let avatar: String?
    let is_host: Bool?
    let id_verified: Bool?
    let phone_verified: Bool?
    let email_verified: Bool?
    let host_level: String?
}

struct CarsEnvelopeDTO: Decodable {
    let data: [CarDTO]
}

struct CarDetailEnvelopeDTO: Decodable {
    let data: CarDTO
}

struct CarDTO: Decodable {
    let id: String
    let owner_id: String?
    let title: String?
    let description: String?
    let brand: String?
    let model: String?
    let daily_price: DoubleOrIntOrString?
    let city: String?
    let region: String?
    let latitude: DoubleOrIntOrString?
    let longitude: DoubleOrIntOrString?
    let lat: DoubleOrIntOrString?
    let lng: DoubleOrIntOrString?
    let car_type: String?
    let seats: DoubleOrIntOrString?
    let transmission: String?
    let fuel_type: String?
    let features: [String]?
    let year: DoubleOrIntOrString?
    let car_year: DoubleOrIntOrString?
    let delivery_fee: DoubleOrIntOrString?
    let insurance_fee: DoubleOrIntOrString?
    let deposit_amount: DoubleOrIntOrString?
    let outside_accra_fee: DoubleOrIntOrString?
    let cancellation_policy: String?
    let is_available: Bool?
    let instant_book: Bool?
    let delivery_available: Bool?
    let air_conditioning: Bool?
    let approval_status: String?
    let created_at: String?
    let avg_rating: DoubleOrIntOrString?
    let reviews_count: DoubleOrIntOrString?
    let favorites_count: DoubleOrIntOrString?
    let host_name: String?
    let host_avatar: String?
    let host_level: String?
    let id_verified: Bool?
    let phone_verified: Bool?
    let email_verified: Bool?
    let image_url: String?
    let car_photos: [CarPhotoDTO]?
    let owner: ProfileDTO?
}

struct CarPhotoDTO: Decodable {
    let url: String?
}

struct FavoritesEnvelopeDTO: Decodable {
    let data: [FavoriteDTO]
}

struct FavoriteDTO: Decodable {
    let car_id: String
}

struct BookingsEnvelopeDTO: Decodable {
    let data: [BookingDTO]
}

struct BookingHoldDTO: Decodable {
    let bookingId: String
    let hold_expires_at: String?
}

struct PaystackInitEnvelopeDTO: Decodable {
    let data: PaystackInitDTO
}

struct PaystackInitDTO: Decodable {
    let bookingId: String
    let reference: String
    let amount: DoubleOrIntOrString?
    let authorization_url: String
    let payment_url: String?
}

struct PaystackFinalizeEnvelopeDTO: Decodable {
    let data: BookingDTO?
    let conversationId: String?
}

struct PushRegisterResponseDTO: Decodable {
    let registered: Bool?
    let warning: String?
    let message: String?
}

struct PushUnregisterResponseDTO: Decodable {
    let unregistered: Bool?
    let removed: Int?
    let warning: String?
    let message: String?
}

struct NotificationPreferencesDTO: Decodable {
    let booking_updates: Bool?
    let messages: Bool?
    let account_security: Bool?
    let news_announcements: Bool?
}

struct NotificationPreferencesEnvelopeDTO: Decodable {
    let data: NotificationPreferencesDTO
}

struct AppAnnouncementDTO: Decodable {
    let id: String
    let title: String?
    let body: String?
    let category: String?
    let delivery: String?
    let audience: String?
    let show_once: Bool?
    let cta_label: String?
    let cta_url: String?
    let starts_at: String?
    let ends_at: String?
    let published_at: String?
    let seen: Bool?
}

struct AppAnnouncementsEnvelopeDTO: Decodable {
    let data: [AppAnnouncementDTO]
}

struct AnnouncementSeenResponseDTO: Decodable {
    let seen: Bool?
}

struct BookingDTO: Decodable {
    let id: String
    let car_id: String?
    let renter_id: String?
    let start_date: String?
    let end_date: String?
    let status: String?
    let payment_status: String?
    let total_price: DoubleOrIntOrString?
    let delivery_address: String?
    let delivery_time: String?
    let contact_phone: String?
    let delivery_notes: String?
    let trip_use_region: String?
    let trip_use_city: String?
    let trip_use_address: String?
    let trip_outside_accra: Bool?
    let daily_rate: DoubleOrIntOrString?
    let subtotal: DoubleOrIntOrString?
    let platform_fee: DoubleOrIntOrString?
    let insurance_fee: DoubleOrIntOrString?
    let delivery_fee: DoubleOrIntOrString?
    let outside_accra_surcharge: DoubleOrIntOrString?
    let deposit_amount: DoubleOrIntOrString?
    let payment_reference: String?
    let rejection_reason: String?
    let created_at: String?
    let conversation_id: String?
    let cars: BookingCarDTO?
    let renter: BookingRenterDTO?
}

struct BookingCarDTO: Decodable {
    let id: String?
    let title: String?
    let brand: String?
    let model: String?
    let image_url: String?
    let car_photos: [CarPhotoDTO]?
    let owner_id: String?
    let owner: ProfileDTO?
}

struct BookingRenterDTO: Decodable {
    let id: String?
    let full_name: String?
}

struct HostStatusDTO: Decodable {
    let is_host: Bool
    let host_application_status: String?
    let status: String?
}

struct CarPhotosEnvelopeDTO: Decodable {
    let data: [CarPhotoItemDTO]
    let meta: CarPhotoMetaDTO?
}

struct CarPhotoItemDTO: Decodable {
    let id: String
    let url: String
}

struct CarPhotoMetaDTO: Decodable {
    let max_photos: Int?
}

struct CarPhotoMutationEnvelopeDTO: Decodable {
    let data: CarPhotoItemDTO?
}

struct AvailabilityEnvelopeDTO: Decodable {
    let blockedDates: [String]?
    let available: Bool?
    let reason: String?
}

struct AvailabilityMutationEnvelopeDTO: Decodable {
    let data: [AvailabilityRowDTO]?
}

struct AvailabilityRowDTO: Decodable {
    let id: String?
    let car_id: String?
    let start_date: String?
    let end_date: String?
    let available: Bool?
}

struct LocationsEnvelopeDTO: Decodable {
    let data: [String: [String]]?
    let message: String?
}

struct CarCatalogEnvelopeDTO: Decodable {
    let makes: [CarMakeDTO]
}

struct CarMakeDTO: Decodable {
    let id: String
    let name: String
    let models: [CarModelDTO]
}

struct CarModelDTO: Decodable {
    let id: String
    let name: String
}

struct HostApplicationEnvelopeDTO: Decodable {
    let data: HostApplicationDTO?
}

struct HostApplicationDTO: Decodable {
    let id: String?
    let status: String?
    let full_name: String?
    let phone: String?
    let region: String?
    let city: String?
    let id_type: String?
    let id_number: String?
    let id_front_path: String?
    let id_back_path: String?
    let experience: String?
    let fleet_size: DoubleOrIntOrString?
    let note: String?
    let rejection_reason: String?
}

struct ConversationsEnvelopeDTO: Decodable {
    let data: [ConversationDTO]
}

struct ConversationDTO: Decodable {
    let id: String
    let host_id: String
    let user_id: String
    let car_id: String?
    let booking_id: String?
    let created_at: String?
    let last_message_at: String?
    let last_message_preview: String?
    let unread_count: Int?
    let other_user: ConversationUserDTO?
}

struct ConversationUserDTO: Decodable {
    let id: String?
    let name: String?
    let avatar: String?
}

struct MessagesEnvelopeDTO: Decodable {
    let data: [MessageDTO]
}

struct MessageEnvelopeDTO: Decodable {
    let data: MessageDTO
}

struct MessageDTO: Decodable {
    let id: String
    let conversation_id: String
    let sender_id: String
    let body: String
    let created_at: String
    let read_at: String?
}

struct ConversationCreateDTO: Decodable {
    let id: String
}

struct ReviewsEnvelopeDTO: Decodable {
    let data: [ReviewDTO]
}

struct ReviewMutationEnvelopeDTO: Decodable {
    let data: ReviewDTO?
}

struct ReviewDTO: Decodable {
    let id: String
    let car_id: String?
    let rating: DoubleOrIntOrString?
    let comment: String?
    let created_at: String?
    let cars: ReviewCarDTO?
    let reviewer: ReviewUserDTO?
}

struct ReviewCarDTO: Decodable {
    let title: String?
}

struct ReviewUserDTO: Decodable {
    let full_name: String?
}

struct CarMutationEnvelopeDTO: Decodable {
    let data: CarDTO
}

private struct SupabaseSessionDTO: Decodable {
    let access_token: String?
    let refresh_token: String?
    let expires_at: Int?
    let user: MobileAuthUserDTO?
}

private struct SupabaseIDRowDTO: Decodable {
    let id: String
}

private struct SupabaseUnreadRowDTO: Decodable {
    let conversation_id: String?
}

private struct SupabaseConversationProfileDTO: Decodable {
    let id: String
    let full_name: String?
    let avatar_url: String?
}

struct APIClient {
    static let shared = APIClient()

    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    private let session: URLSession

    private init() {
        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
        let configuration = URLSessionConfiguration.default
        configuration.waitsForConnectivity = false
        configuration.timeoutIntervalForRequest = 20
        configuration.timeoutIntervalForResource = 60
        configuration.httpMaximumConnectionsPerHost = 10
        self.session = URLSession(configuration: configuration)
    }

    // MARK: - Mobile Auth

    func login(baseURL: String, email: String, password: String) async throws -> MobileAuthSessionDTO {
        struct Payload: Encodable {
            let email: String
            let password: String
        }
        do {
            return try await request(
                path: "/api/mobile/auth/login",
                method: .POST,
                body: Payload(email: email, password: password),
                baseURL: baseURL,
                token: nil
            )
        } catch {
            guard isMissingMobileRoute(error) else { throw error }
            return try await loginViaSupabase(email: email, password: password)
        }
    }

    func signup(
        baseURL: String,
        firstName: String,
        lastName: String,
        email: String,
        password: String,
        city: String,
        region: String
    ) async throws -> MobileAuthSessionDTO {
        struct Payload: Encodable {
            let first_name: String
            let last_name: String
            let email: String
            let password: String
            let city: String
            let region: String
        }
        do {
            return try await request(
                path: "/api/mobile/auth/signup",
                method: .POST,
                body: Payload(
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    password: password,
                    city: city,
                    region: region
                ),
                baseURL: baseURL,
                token: nil
            )
        } catch {
            guard isMissingMobileRoute(error) else { throw error }
            return try await signupViaSupabase(
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: password,
                city: city,
                region: region
            )
        }
    }

    func resendSignupConfirmation(baseURL: String, email: String) async throws {
        struct Payload: Encodable {
            let email: String
        }
        do {
            _ = try await request(
                path: "/api/mobile/auth/resend-confirmation",
                method: .POST,
                body: Payload(email: email),
                baseURL: baseURL,
                token: nil
            ) as APIMessageResponse
        } catch {
            guard isMissingMobileRoute(error) else { throw error }
            try await resendSignupConfirmationViaSupabase(email: email)
        }
    }

    func requestPasswordReset(baseURL: String, email: String) async throws {
        struct Payload: Encodable {
            let email: String
        }
        do {
            _ = try await request(
                path: "/api/mobile/auth/forgot-password",
                method: .POST,
                body: Payload(email: email),
                baseURL: baseURL,
                token: nil
            ) as APIMessageResponse
        } catch {
            guard isMissingMobileRoute(error) else { throw error }
            try await requestPasswordResetViaSupabase(email: email)
        }
    }

    func refreshToken(baseURL: String, refreshToken: String) async throws -> MobileAuthSessionDTO {
        struct Payload: Encodable {
            let refresh_token: String
        }
        do {
            return try await request(
                path: "/api/mobile/auth/refresh",
                method: .POST,
                body: Payload(refresh_token: refreshToken),
                baseURL: baseURL,
                token: nil
            )
        } catch {
            guard isMissingMobileRoute(error) else { throw error }
            return try await refreshViaSupabase(refreshToken: refreshToken)
        }
    }

    func getMe(baseURL: String, token: String) async throws -> MobileMeDTO {
        do {
            let response: MobileMeDTO = try await request(
                path: "/api/mobile/me",
                method: .GET,
                body: nil as EmptyResponse?,
                baseURL: baseURL,
                token: token
            )

            if response.profile == nil {
                if let fallback = try? await getMeViaSupabase(baseURL: baseURL, token: token), fallback.profile != nil {
                    return MobileMeDTO(
                        user: response.user,
                        profile: fallback.profile,
                        is_host: response.is_host ?? fallback.is_host,
                        host_status: response.host_status ?? fallback.host_status,
                        host_application_status: response.host_application_status ?? fallback.host_application_status,
                        host_application: response.host_application ?? fallback.host_application
                    )
                }
            }

            return response
        } catch {
            guard isMissingMobileRoute(error) else { throw error }
            return try await getMeViaSupabase(baseURL: baseURL, token: token)
        }
    }

    // MARK: - Cars

    func getCars(baseURL: String, token: String?) async throws -> CarsEnvelopeDTO {
        try await request(path: "/api/cars?mobile=1&limit=48", method: .GET, body: nil as EmptyResponse?, baseURL: baseURL, token: token)
    }

    func getCarDetail(baseURL: String, token: String?, carID: String) async throws -> CarDetailEnvelopeDTO {
        let encodedCarID = carID.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? carID
        return try await request(
            path: "/api/cars/\(encodedCarID)",
            method: .GET,
            body: nil as EmptyResponse?,
            baseURL: baseURL,
            token: token
        )
    }

    func getMyCars(baseURL: String, token: String) async throws -> CarsEnvelopeDTO {
        try await request(path: "/api/cars?mine=1&limit=200", method: .GET, body: nil as EmptyResponse?, baseURL: baseURL, token: token)
    }

    func createCar(baseURL: String, token: String, payload: [String: Any]) async throws -> CarMutationEnvelopeDTO {
        try await requestJSON(path: "/api/cars", method: .POST, json: payload, baseURL: baseURL, token: token)
    }

    func updateCar(baseURL: String, token: String, carID: String, payload: [String: Any]) async throws -> CarMutationEnvelopeDTO {
        try await requestJSON(path: "/api/cars/\(carID)", method: .PUT, json: payload, baseURL: baseURL, token: token)
    }

    func deleteCar(baseURL: String, token: String, carID: String) async throws {
        _ = try await request(path: "/api/cars/\(carID)", method: .DELETE, body: nil as EmptyResponse?, baseURL: baseURL, token: token) as EmptyResponse
    }

    func getCarPhotos(baseURL: String, token: String, carID: String) async throws -> CarPhotosEnvelopeDTO {
        let encodedCarID = carID.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? carID
        return try await request(
            path: "/api/cars/\(encodedCarID)/photos",
            method: .GET,
            body: nil as EmptyResponse?,
            baseURL: baseURL,
            token: token
        )
    }

    func uploadCarPhoto(
        baseURL: String,
        token: String,
        carID: String,
        fileData: Data,
        fileName: String,
        mimeType: String,
        replacePhotoID: String? = nil
    ) async throws -> CarPhotoMutationEnvelopeDTO {
        let encodedCarID = carID.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? carID
        let boundary = "Boundary-\(UUID().uuidString)"
        var request = try buildMultipartRequest(
            path: "/api/cars/\(encodedCarID)/photos",
            baseURL: baseURL,
            token: token,
            boundary: boundary,
            fileField: "file",
            fileName: fileName,
            mimeType: mimeType,
            fileData: fileData
        )
        if let replacePhotoID, !replacePhotoID.isEmpty {
            appendMultipartField(name: "replacePhotoId", value: replacePhotoID, to: &request, boundary: boundary)
        }
        finalizeMultipartBody(on: &request, boundary: boundary)
        return try await executeMultipart(request: request, retryable: false)
    }

    func deleteCarPhoto(baseURL: String, token: String, carID: String, photoID: String) async throws {
        struct Payload: Encodable {
            let photoId: String
        }
        let encodedCarID = carID.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? carID
        _ = try await request(
            path: "/api/cars/\(encodedCarID)/photos",
            method: .DELETE,
            body: Payload(photoId: photoID),
            baseURL: baseURL,
            token: token
        ) as EmptyResponse
    }

    // MARK: - Reference Data

    func getLocations(baseURL: String) async throws -> LocationsEnvelopeDTO {
        try await request(path: "/api/locations", method: .GET, body: nil as EmptyResponse?, baseURL: baseURL, token: nil)
    }

    func getCarCatalog(baseURL: String) async throws -> CarCatalogEnvelopeDTO {
        try await request(path: "/api/car-catalog", method: .GET, body: nil as EmptyResponse?, baseURL: baseURL, token: nil)
    }

    // MARK: - Favorites

    func getFavorites(baseURL: String, token: String) async throws -> FavoritesEnvelopeDTO {
        do {
            return try await request(path: "/api/favorites", method: .GET, body: nil as EmptyResponse?, baseURL: baseURL, token: token)
        } catch {
            guard shouldFallbackToSupabase(error) else { throw error }
            return try await getFavoritesViaSupabase(token: token)
        }
    }

    func setFavorite(baseURL: String, token: String, carID: String, isFavorite: Bool) async throws {
        struct Payload: Encodable {
            let carId: String
            let isFavorite: Bool
        }
        do {
            _ = try await request(
                path: "/api/favorites",
                method: .POST,
                body: Payload(carId: carID, isFavorite: isFavorite),
                baseURL: baseURL,
                token: token
            ) as EmptyResponse
        } catch {
            guard shouldFallbackToSupabase(error) else { throw error }
            try await setFavoriteViaSupabase(token: token, carID: carID, isFavorite: isFavorite)
        }
    }

    // MARK: - Profile

    func upsertProfile(
        baseURL: String,
        token: String,
        userID: String,
        firstName: String,
        lastName: String,
        fullName: String,
        city: String,
        region: String,
        phone: String,
        avatarURL: String?
    ) async throws {
        struct Payload: Encodable {
            let id: String
            let first_name: String
            let last_name: String
            let full_name: String
            let city: String
            let region: String
            let phone: String
            let avatar_url: String?
        }

        do {
            _ = try await request(
                path: "/api/profiles/upsert",
                method: .POST,
                body: Payload(
                    id: userID,
                    first_name: firstName,
                    last_name: lastName,
                    full_name: fullName,
                    city: city,
                    region: region,
                    phone: phone,
                    avatar_url: avatarURL
                ),
                baseURL: baseURL,
                token: token
            ) as EmptyResponse
        } catch {
            guard shouldFallbackToSupabase(error) else { throw error }
            try await upsertProfileViaSupabase(
                token: token,
                userID: userID,
                firstName: firstName,
                lastName: lastName,
                fullName: fullName,
                city: city,
                region: region,
                phone: phone,
                avatarURL: avatarURL
            )
        }
    }

    func uploadProfileAvatar(
        baseURL: String,
        token: String,
        userID: String,
        fileData: Data,
        fileExtension: String = "jpg",
        mimeType: String = "image/jpeg"
    ) async throws -> String {
        _ = baseURL
        let cleanExtension = sanitizeFileExtension(fileExtension, fallback: "jpg")
        let path = "\(userID)/avatar-\(Int(Date().timeIntervalSince1970)).\(cleanExtension)"
        let bucketCandidates = configuredBucketNames(
            primaryKeys: ["HAYAMESupabaseAvatarBucket", "HAYAMESupabaseStorageBucket"],
            fallbacks: ["car-photos", "avatars"]
        )

        var lastError: Error?
        for bucket in bucketCandidates {
            do {
                return try await uploadSupabaseStorageObject(
                    token: token,
                    bucket: bucket,
                    path: path,
                    fileData: fileData,
                    mimeType: mimeType,
                    returnPublicURL: true
                )
            } catch {
                lastError = error
                if isBucketNotFoundError(error) {
                    continue
                }
                throw error
            }
        }

        if let apiError = lastError as? APIError {
            throw APIError(message: apiError.message, statusCode: apiError.statusCode)
        }
        throw APIError(message: "Unable to upload profile photo. Configure a valid Supabase storage bucket.")
    }

    func uploadHostIdentityDocument(
        baseURL: String,
        token: String,
        userID: String,
        side: String,
        fileData: Data,
        fileExtension: String = "jpg",
        mimeType: String = "image/jpeg"
    ) async throws -> String {
        _ = baseURL
        let normalizedSide = side.lowercased() == "back" ? "back" : "front"
        let cleanExtension = sanitizeFileExtension(fileExtension, fallback: "jpg")
        let path = "\(userID)/\(normalizedSide)-\(Int(Date().timeIntervalSince1970)).\(cleanExtension)"
        let bucket = configuredBucketName(primaryKeys: ["HAYAMESupabaseHostIDBucket"], fallback: "host-ids")
        _ = try await uploadSupabaseStorageObject(
            token: token,
            bucket: bucket,
            path: path,
            fileData: fileData,
            mimeType: mimeType,
            returnPublicURL: false
        )
        return path
    }

    // MARK: - Bookings

    func getBookings(baseURL: String, token: String) async throws -> BookingsEnvelopeDTO {
        do {
            return try await request(path: "/api/bookings", method: .GET, body: nil as EmptyResponse?, baseURL: baseURL, token: token)
        } catch {
            guard shouldFallbackToSupabase(error) else { throw error }
            return try await getBookingsViaSupabase(token: token)
        }
    }

    func createBookingHold(
        baseURL: String,
        token: String,
        carID: String,
        startDate: String,
        endDate: String,
        tripMode: BookingTripMode?,
        tripUseRegion: String,
        tripUseCity: String,
        tripUseAddress: String,
        deliveryDetails: BookingDeliveryDetails
    ) async throws -> BookingHoldDTO {
        struct Payload: Encodable {
            let carId: String
            let startDate: String
            let endDate: String
            let tripMode: String?
            let tripUseRegion: String
            let tripUseCity: String
            let tripUseAddress: String
            let deliveryAddress: String?
            let deliveryTime: String?
            let contactPhone: String?
            let deliveryNotes: String?
        }

        func nilIfBlank(_ value: String) -> String? {
            let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
            return trimmed.isEmpty ? nil : trimmed
        }

        let payload = Payload(
            carId: carID,
            startDate: startDate,
            endDate: endDate,
            tripMode: tripMode?.rawValue,
            tripUseRegion: tripUseRegion,
            tripUseCity: tripUseCity,
            tripUseAddress: tripUseAddress,
            deliveryAddress: nilIfBlank(deliveryDetails.address),
            deliveryTime: nilIfBlank(deliveryDetails.time),
            contactPhone: nilIfBlank(deliveryDetails.contactPhone),
            deliveryNotes: nilIfBlank(deliveryDetails.notes)
        )

        return try await request(
            path: "/api/mobile/bookings/hold",
            method: .POST,
            body: payload,
            baseURL: baseURL,
            token: token
        )
    }

    func initiatePaystackCheckout(
        baseURL: String,
        token: String,
        bookingID: String,
        callbackURL: String
    ) async throws -> PaystackInitDTO {
        struct Payload: Encodable {
            let bookingId: String
            let callbackUrl: String
        }

        let envelope: PaystackInitEnvelopeDTO = try await request(
            path: "/api/mobile/bookings/paystack/initiate",
            method: .POST,
            body: Payload(bookingId: bookingID, callbackUrl: callbackURL),
            baseURL: baseURL,
            token: token
        )
        return envelope.data
    }

    func finalizePaystackCheckout(
        baseURL: String,
        token: String,
        bookingID: String,
        carID: String,
        startDate: String,
        endDate: String,
        tripUseRegion: String,
        tripUseCity: String,
        tripUseAddress: String,
        reference: String,
        amountMinor: Int
    ) async throws -> PaystackFinalizeEnvelopeDTO {
        struct Payload: Encodable {
            let bookingId: String
            let carId: String
            let startDate: String
            let endDate: String
            let tripUseRegion: String
            let tripUseCity: String
            let tripUseAddress: String
            let reference: String
            let amount: Int
        }

        let payload = Payload(
            bookingId: bookingID,
            carId: carID,
            startDate: startDate,
            endDate: endDate,
            tripUseRegion: tripUseRegion,
            tripUseCity: tripUseCity,
            tripUseAddress: tripUseAddress,
            reference: reference,
            amount: amountMinor
        )

        return try await request(
            path: "/api/mobile/bookings/paystack/finalize",
            method: .POST,
            body: payload,
            baseURL: baseURL,
            token: token
        )
    }

    func updateBookingDecision(baseURL: String, token: String, bookingID: String, approve: Bool) async throws {
        struct Payload: Encodable {
            let action: String
        }
        _ = try await request(
            path: "/api/bookings/\(bookingID)",
            method: .PATCH,
            body: Payload(action: approve ? "approve" : "reject"),
            baseURL: baseURL,
            token: token
        ) as EmptyResponse
    }

    func createDispute(baseURL: String, token: String, bookingID: String, reason: String) async throws {
        struct Payload: Encodable {
            let bookingId: String
            let reason: String
        }
        _ = try await request(
            path: "/api/disputes",
            method: .POST,
            body: Payload(bookingId: bookingID, reason: reason),
            baseURL: baseURL,
            token: token
        ) as EmptyResponse
    }

    func submitReview(baseURL: String, token: String, bookingID: String, rating: Int, comment: String) async throws -> ReviewMutationEnvelopeDTO {
        struct Payload: Encodable {
            let bookingId: String
            let rating: Int
            let comment: String
        }

        return try await request(
            path: "/api/reviews",
            method: .POST,
            body: Payload(bookingId: bookingID, rating: rating, comment: comment),
            baseURL: baseURL,
            token: token
        )
    }

    // MARK: - Host

    func getHostStatus(baseURL: String, token: String) async throws -> HostStatusDTO {
        try await request(path: "/api/host-status", method: .GET, body: nil as EmptyResponse?, baseURL: baseURL, token: token)
    }

    func getHostApplication(baseURL: String, token: String) async throws -> HostApplicationEnvelopeDTO {
        try await request(path: "/api/host-applications", method: .GET, body: nil as EmptyResponse?, baseURL: baseURL, token: token)
    }

    func submitHostApplication(baseURL: String, token: String, payload: [String: Any]) async throws -> HostApplicationEnvelopeDTO {
        try await requestJSON(path: "/api/host-applications", method: .POST, json: payload, baseURL: baseURL, token: token)
    }

    func getHostReviews(baseURL: String, token: String) async throws -> ReviewsEnvelopeDTO {
        try await request(path: "/api/reviews?scope=host", method: .GET, body: nil as EmptyResponse?, baseURL: baseURL, token: token)
    }

    // MARK: - Availability

    func getAvailability(baseURL: String, carID: String, startDate: String, endDate: String) async throws -> AvailabilityEnvelopeDTO {
        let encodedCar = carID.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? carID
        let encodedStart = startDate.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? startDate
        let encodedEnd = endDate.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? endDate
        return try await request(
            path: "/api/availability?carId=\(encodedCar)&startDate=\(encodedStart)&endDate=\(encodedEnd)",
            method: .GET,
            body: nil as EmptyResponse?,
            baseURL: baseURL,
            token: nil
        )
    }

    func saveAvailabilityWindow(
        baseURL: String,
        token: String,
        carID: String,
        startDate: String,
        endDate: String,
        available: Bool
    ) async throws -> AvailabilityMutationEnvelopeDTO {
        struct Payload: Encodable {
            let carId: String
            let startDate: String
            let endDate: String
            let available: Bool
        }
        return try await request(
            path: "/api/availability",
            method: .POST,
            body: Payload(carId: carID, startDate: startDate, endDate: endDate, available: available),
            baseURL: baseURL,
            token: token
        )
    }

    func saveRecurringAvailabilityBlocks(
        baseURL: String,
        token: String,
        carID: String,
        startDate: String,
        endDate: String,
        repeatDays: [String]
    ) async throws -> AvailabilityMutationEnvelopeDTO {
        struct Payload: Encodable {
            let carId: String
            let startDate: String
            let endDate: String
            let available: Bool
            let repeatDays: [String]
        }
        return try await request(
            path: "/api/availability",
            method: .POST,
            body: Payload(carId: carID, startDate: startDate, endDate: endDate, available: false, repeatDays: repeatDays),
            baseURL: baseURL,
            token: token
        )
    }

    // MARK: - Messaging

    func getConversations(baseURL: String, token: String) async throws -> ConversationsEnvelopeDTO {
        do {
            return try await request(path: "/api/conversations", method: .GET, body: nil as EmptyResponse?, baseURL: baseURL, token: token)
        } catch {
            guard shouldFallbackToSupabase(error) else { throw error }
            return try await getConversationsViaSupabase(token: token)
        }
    }

    func createConversation(baseURL: String, token: String, payload: [String: Any]) async throws -> ConversationCreateDTO {
        do {
            return try await requestJSON(path: "/api/conversations", method: .POST, json: payload, baseURL: baseURL, token: token)
        } catch {
            guard shouldFallbackToSupabase(error) else { throw error }
            return try await createConversationViaSupabase(token: token, payload: payload)
        }
    }

    func getMessages(
        baseURL: String,
        token: String,
        conversationID: String,
        markRead: Bool = true,
        since: String? = nil,
        limit: Int = 200
    ) async throws -> MessagesEnvelopeDTO {
        let encodedConversation = conversationID.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? conversationID
        let mark = markRead ? "1" : "0"
        let safeLimit = max(1, min(limit, 500))
        var path = "/api/messages?conversationId=\(encodedConversation)&markRead=\(mark)&limit=\(safeLimit)"
        if let since, !since.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            let encodedSince = since.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? since
            path += "&since=\(encodedSince)"
        }
        do {
            return try await request(
                path: path,
                method: .GET,
                body: nil as EmptyResponse?,
                baseURL: baseURL,
                token: token
            )
        } catch {
            guard shouldFallbackToSupabase(error) else { throw error }
            return try await getMessagesViaSupabase(
                token: token,
                conversationID: conversationID,
                markRead: markRead,
                since: since,
                limit: safeLimit
            )
        }
    }

    func sendMessage(baseURL: String, token: String, conversationID: String, body: String) async throws -> MessageEnvelopeDTO {
        struct Payload: Encodable {
            let conversationId: String
            let body: String
        }
        do {
            return try await request(
                path: "/api/messages",
                method: .POST,
                body: Payload(conversationId: conversationID, body: body),
                baseURL: baseURL,
                token: token
            )
        } catch {
            guard shouldFallbackToSupabase(error) else { throw error }
            return try await sendMessageViaSupabase(token: token, conversationID: conversationID, body: body)
        }
    }

    // MARK: - Push

    func registerPushToken(
        baseURL: String,
        token: String,
        deviceToken: String,
        previousDeviceToken: String? = nil
    ) async throws -> PushRegisterResponseDTO {
        struct Payload: Encodable {
            let deviceToken: String
            let previousDeviceToken: String?
            let platform: String
        }
        return try await request(
            path: "/api/mobile/push/register",
            method: .POST,
            body: Payload(
                deviceToken: deviceToken,
                previousDeviceToken: previousDeviceToken,
                platform: "ios"
            ),
            baseURL: baseURL,
            token: token
        )
    }

    func unregisterPushToken(
        baseURL: String,
        token: String,
        deviceToken: String
    ) async throws -> PushUnregisterResponseDTO {
        struct Payload: Encodable {
            let deviceToken: String
            let platform: String
        }
        return try await request(
            path: "/api/mobile/push/unregister",
            method: .DELETE,
            body: Payload(deviceToken: deviceToken, platform: "ios"),
            baseURL: baseURL,
            token: token
        )
    }

    func getNotificationPreferences(baseURL: String, token: String) async throws -> NotificationPreferencesEnvelopeDTO {
        try await request(
            path: "/api/mobile/notifications/preferences",
            method: .GET,
            body: nil as EmptyResponse?,
            baseURL: baseURL,
            token: token
        )
    }

    func updateNotificationPreferences(
        baseURL: String,
        token: String,
        preferences: NotificationPreferences
    ) async throws -> NotificationPreferencesEnvelopeDTO {
        struct Payload: Encodable {
            let booking_updates: Bool
            let messages: Bool
            let account_security: Bool
            let news_announcements: Bool
        }

        return try await request(
            path: "/api/mobile/notifications/preferences",
            method: .POST,
            body: Payload(
                booking_updates: preferences.bookingUpdates,
                messages: preferences.messages,
                account_security: preferences.accountSecurity,
                news_announcements: preferences.newsAnnouncements
            ),
            baseURL: baseURL,
            token: token
        )
    }

    func getAnnouncements(baseURL: String, token: String?) async throws -> AppAnnouncementsEnvelopeDTO {
        try await request(
            path: "/api/mobile/announcements",
            method: .GET,
            body: nil as EmptyResponse?,
            baseURL: baseURL,
            token: token
        )
    }

    func markAnnouncementSeen(
        baseURL: String,
        token: String,
        announcementID: String
    ) async throws -> AnnouncementSeenResponseDTO {
        try await request(
            path: "/api/mobile/announcements/\(announcementID)/seen",
            method: .POST,
            body: nil as EmptyResponse?,
            baseURL: baseURL,
            token: token
        )
    }

    private func isMissingMobileRoute(_ error: Error) -> Bool {
        guard let apiError = error as? APIError else { return false }
        return apiError.statusCode == 404
    }

    private func supabaseConfig() -> (baseURL: String, anonKey: String)? {
        guard
            let rawURL = Bundle.main.object(forInfoDictionaryKey: "HAYAMESupabaseURL") as? String,
            let rawAnonKey = Bundle.main.object(forInfoDictionaryKey: "HAYAMESupabaseAnonKey") as? String
        else {
            return nil
        }

        let url = rawURL.trimmingCharacters(in: .whitespacesAndNewlines).trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let anonKey = rawAnonKey.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !url.isEmpty, !anonKey.isEmpty else { return nil }
        return (url, anonKey)
    }

    private func defaultConfirmationRedirectURL() -> String {
        if
            let raw = Bundle.main.object(forInfoDictionaryKey: "HAYAMEAPIBaseURL") as? String,
            !raw.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        {
            let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmed.hasPrefix("http://") || trimmed.hasPrefix("https://") {
                return trimmed
            }
            return "https://\(trimmed)"
        }
        return "https://www.hayamegh.com"
    }

    private func loginViaSupabase(email: String, password: String) async throws -> MobileAuthSessionDTO {
        guard let config = supabaseConfig() else {
            throw APIError(message: "Server route not found (404) and Supabase fallback is not configured.")
        }
        guard let url = URL(string: "\(config.baseURL)/auth/v1/token?grant_type=password") else {
            throw APIError(message: "Invalid Supabase URL")
        }

        let session: SupabaseSessionDTO = try await supabaseRequest(
            url: url,
            method: .POST,
            jsonBody: [
                "email": email,
                "password": password,
            ],
            anonKey: config.anonKey,
            bearerToken: nil
        )

        return MobileAuthSessionDTO(
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            user: session.user,
            profile: nil,
            is_host: nil,
            host_status: nil,
            host_application_status: nil,
            requires_email_confirmation: session.access_token == nil
        )
    }

    private func signupViaSupabase(
        firstName: String,
        lastName: String,
        email: String,
        password: String,
        city: String,
        region: String
    ) async throws -> MobileAuthSessionDTO {
        guard let config = supabaseConfig() else {
            throw APIError(message: "Server route not found (404) and Supabase fallback is not configured.")
        }
        guard let url = URL(string: "\(config.baseURL)/auth/v1/signup") else {
            throw APIError(message: "Invalid Supabase URL")
        }

        let fullName = "\(firstName.trimmingCharacters(in: .whitespacesAndNewlines)) \(lastName.trimmingCharacters(in: .whitespacesAndNewlines))"
            .trimmingCharacters(in: .whitespacesAndNewlines)

        let session: SupabaseSessionDTO = try await supabaseRequest(
            url: url,
            method: .POST,
            jsonBody: [
                "email": email,
                "password": password,
                "data": [
                    "first_name": firstName,
                    "last_name": lastName,
                    "full_name": fullName,
                    "city": city,
                    "region": region,
                ],
            ],
            anonKey: config.anonKey,
            bearerToken: nil
        )

        return MobileAuthSessionDTO(
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            user: session.user,
            profile: nil,
            is_host: nil,
            host_status: nil,
            host_application_status: nil,
            requires_email_confirmation: session.access_token == nil
        )
    }

    private func resendSignupConfirmationViaSupabase(email: String) async throws {
        guard let config = supabaseConfig() else {
            throw APIError(message: "Server route not found (404) and Supabase fallback is not configured.")
        }
        guard let url = URL(string: "\(config.baseURL)/auth/v1/resend") else {
            throw APIError(message: "Invalid Supabase URL")
        }

        _ = try await supabaseRequest(
            url: url,
            method: .POST,
            jsonBody: [
                "type": "signup",
                "email": email,
                "options": [
                    "email_redirect_to": defaultConfirmationRedirectURL()
                ]
            ],
            anonKey: config.anonKey,
            bearerToken: nil
        ) as APIMessageResponse
    }

    private func requestPasswordResetViaSupabase(email: String) async throws {
        guard let config = supabaseConfig() else {
            throw APIError(message: "Server route not found (404) and Supabase fallback is not configured.")
        }
        guard let url = URL(string: "\(config.baseURL)/auth/v1/recover") else {
            throw APIError(message: "Invalid Supabase URL")
        }

        _ = try await supabaseRequest(
            url: url,
            method: .POST,
            jsonBody: [
                "email": email
            ],
            anonKey: config.anonKey,
            bearerToken: nil
        ) as APIMessageResponse
    }

    private func refreshViaSupabase(refreshToken: String) async throws -> MobileAuthSessionDTO {
        guard let config = supabaseConfig() else {
            throw APIError(message: "Server route not found (404) and Supabase fallback is not configured.")
        }
        guard let url = URL(string: "\(config.baseURL)/auth/v1/token?grant_type=refresh_token") else {
            throw APIError(message: "Invalid Supabase URL")
        }

        let session: SupabaseSessionDTO = try await supabaseRequest(
            url: url,
            method: .POST,
            jsonBody: [
                "refresh_token": refreshToken,
            ],
            anonKey: config.anonKey,
            bearerToken: nil
        )

        return MobileAuthSessionDTO(
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            user: session.user,
            profile: nil,
            is_host: nil,
            host_status: nil,
            host_application_status: nil,
            requires_email_confirmation: nil
        )
    }

    private func getMeViaSupabase(baseURL: String, token: String) async throws -> MobileMeDTO {
        guard let config = supabaseConfig() else {
            throw APIError(message: "Server route not found (404) and Supabase fallback is not configured.")
        }
        guard let userURL = URL(string: "\(config.baseURL)/auth/v1/user") else {
            throw APIError(message: "Invalid Supabase URL")
        }

        let user: MobileAuthUserDTO = try await supabaseRequest(
            url: userURL,
            method: .GET,
            jsonBody: nil,
            anonKey: config.anonKey,
            bearerToken: token
        )

        let profile: ProfileDTO?
        if let profileURL = URL(string: "\(config.baseURL)/rest/v1/profiles?id=eq.\(user.id)&select=*") {
            let profiles: [ProfileDTO] = (try? await supabaseRequest(
                url: profileURL,
                method: .GET,
                jsonBody: nil,
                anonKey: config.anonKey,
                bearerToken: token
            )) ?? []
            profile = profiles.first
        } else {
            profile = nil
        }

        let hostStatus = try? await getHostStatus(baseURL: baseURL, token: token)
        return MobileMeDTO(
            user: user,
            profile: profile,
            is_host: hostStatus?.is_host ?? false,
            host_status: hostStatus?.status,
            host_application_status: hostStatus?.host_application_status,
            host_application: nil
        )
    }

    private func shouldFallbackToSupabase(_ error: Error, statuses: Set<Int> = [401, 404, 405]) -> Bool {
        guard let apiError = error as? APIError, let statusCode = apiError.statusCode else { return false }
        return statuses.contains(statusCode)
    }

    private func getFavoritesViaSupabase(token: String) async throws -> FavoritesEnvelopeDTO {
        let user = try await fetchSupabaseUser(token: token)
        guard let config = supabaseConfig() else {
            throw APIError(message: "Supabase fallback is not configured.")
        }
        guard
            let url = supabaseURL(
                baseURL: config.baseURL,
                path: "/rest/v1/favorites",
                queryItems: [
                    URLQueryItem(name: "select", value: "car_id"),
                    URLQueryItem(name: "user_id", value: "eq.\(user.id)"),
                ]
            )
        else {
            throw APIError(message: "Invalid Supabase URL")
        }

        let rows: [FavoriteDTO] = try await supabaseRequest(
            url: url,
            method: .GET,
            jsonBody: nil,
            anonKey: config.anonKey,
            bearerToken: token
        )
        return FavoritesEnvelopeDTO(data: rows)
    }

    private func setFavoriteViaSupabase(token: String, carID: String, isFavorite: Bool) async throws {
        let user = try await fetchSupabaseUser(token: token)
        guard let config = supabaseConfig() else {
            throw APIError(message: "Supabase fallback is not configured.")
        }

        if isFavorite {
            guard
                let url = supabaseURL(
                    baseURL: config.baseURL,
                    path: "/rest/v1/favorites",
                    queryItems: [URLQueryItem(name: "on_conflict", value: "user_id,car_id")]
                )
            else {
                throw APIError(message: "Invalid Supabase URL")
            }
            try await supabaseRequestNoResponse(
                url: url,
                method: .POST,
                jsonBody: [
                    "user_id": user.id,
                    "car_id": carID,
                ],
                anonKey: config.anonKey,
                bearerToken: token,
                extraHeaders: ["Prefer": "resolution=merge-duplicates,return=minimal"]
            )
        } else {
            guard
                let url = supabaseURL(
                    baseURL: config.baseURL,
                    path: "/rest/v1/favorites",
                    queryItems: [
                        URLQueryItem(name: "user_id", value: "eq.\(user.id)"),
                        URLQueryItem(name: "car_id", value: "eq.\(carID)"),
                    ]
                )
            else {
                throw APIError(message: "Invalid Supabase URL")
            }
            try await supabaseRequestNoResponse(
                url: url,
                method: .DELETE,
                jsonBody: nil,
                anonKey: config.anonKey,
                bearerToken: token
            )
        }
    }

    private func getBookingsViaSupabase(token: String) async throws -> BookingsEnvelopeDTO {
        let user = try await fetchSupabaseUser(token: token)
        guard let config = supabaseConfig() else {
            throw APIError(message: "Supabase fallback is not configured.")
        }

        let bookingSelect =
            "id,car_id,renter_id,start_date,end_date,status,delivery_address,delivery_time,contact_phone,delivery_notes,trip_use_region,trip_use_city,trip_use_address,trip_outside_accra,daily_rate,subtotal,platform_fee,insurance_fee,delivery_fee,outside_accra_surcharge,deposit_amount,total_price,payment_status,payment_reference,rejection_reason,created_at,cars(id,title,brand,model,image_url,car_photos(url),owner_id,owner:profiles!cars_owner_id_fkey(id,full_name,avatar_url,phone)),renter:profiles!bookings_renter_id_fkey(id,full_name,avatar_url,phone)"

        guard
            let renterURL = supabaseURL(
                baseURL: config.baseURL,
                path: "/rest/v1/bookings",
                queryItems: [
                    URLQueryItem(name: "select", value: bookingSelect),
                    URLQueryItem(name: "renter_id", value: "eq.\(user.id)"),
                    URLQueryItem(name: "order", value: "created_at.desc"),
                ]
            )
        else {
            throw APIError(message: "Invalid Supabase URL")
        }

        let renterBookings: [BookingDTO] = try await supabaseRequest(
            url: renterURL,
            method: .GET,
            jsonBody: nil,
            anonKey: config.anonKey,
            bearerToken: token
        )

        let ownedCarIDs = try await fetchOwnedCarIDsViaSupabase(token: token, userID: user.id)
        var hostBookings: [BookingDTO] = []
        if !ownedCarIDs.isEmpty {
            let carList = ownedCarIDs.joined(separator: ",")
            if let ownerURL = supabaseURL(
                baseURL: config.baseURL,
                path: "/rest/v1/bookings",
                queryItems: [
                    URLQueryItem(name: "select", value: bookingSelect),
                    URLQueryItem(name: "car_id", value: "in.(\(carList))"),
                    URLQueryItem(name: "order", value: "created_at.desc"),
                ]
            ) {
                hostBookings = (try? await supabaseRequest(
                    url: ownerURL,
                    method: .GET,
                    jsonBody: nil,
                    anonKey: config.anonKey,
                    bearerToken: token
                )) ?? []
            }
        }

        let combined = renterBookings + hostBookings
        let deduped = Array(Dictionary(grouping: combined, by: \.id).values.compactMap { $0.first })
        return BookingsEnvelopeDTO(data: deduped)
    }

    private func getConversationsViaSupabase(token: String) async throws -> ConversationsEnvelopeDTO {
        let user = try await fetchSupabaseUser(token: token)
        guard let config = supabaseConfig() else {
            throw APIError(message: "Supabase fallback is not configured.")
        }

        guard
            let conversationsURL = supabaseURL(
                baseURL: config.baseURL,
                path: "/rest/v1/conversations",
                queryItems: [
                    URLQueryItem(name: "select", value: "id,host_id,user_id,car_id,booking_id,last_message_at,last_message_preview,created_at"),
                    URLQueryItem(name: "or", value: "(host_id.eq.\(user.id),user_id.eq.\(user.id))"),
                    URLQueryItem(name: "order", value: "created_at.desc"),
                ]
            )
        else {
            throw APIError(message: "Invalid Supabase URL")
        }

        let rawRows: [ConversationDTO] = try await supabaseRequest(
            url: conversationsURL,
            method: .GET,
            jsonBody: nil,
            anonKey: config.anonKey,
            bearerToken: token
        )

        let conversationIDs = rawRows.map(\.id)
        var unreadByConversation: [String: Int] = [:]
        if !conversationIDs.isEmpty,
           let unreadURL = supabaseURL(
               baseURL: config.baseURL,
               path: "/rest/v1/messages",
               queryItems: [
                   URLQueryItem(name: "select", value: "conversation_id"),
                   URLQueryItem(name: "conversation_id", value: "in.(\(conversationIDs.joined(separator: ",")))"),
                   URLQueryItem(name: "read_at", value: "is.null"),
                   URLQueryItem(name: "sender_id", value: "neq.\(user.id)"),
               ]
           ) {
            let unreadRows: [SupabaseUnreadRowDTO] = (try? await supabaseRequest(
                url: unreadURL,
                method: .GET,
                jsonBody: nil,
                anonKey: config.anonKey,
                bearerToken: token
            )) ?? []
            for row in unreadRows {
                guard let conversationID = row.conversation_id else { continue }
                unreadByConversation[conversationID, default: 0] += 1
            }
        }

        let otherIDs = Set(rawRows.map { $0.host_id == user.id ? $0.user_id : $0.host_id })
        var profilesByID: [String: SupabaseConversationProfileDTO] = [:]
        if !otherIDs.isEmpty,
           let profilesURL = supabaseURL(
               baseURL: config.baseURL,
               path: "/rest/v1/profiles",
               queryItems: [
                   URLQueryItem(name: "select", value: "id,full_name,avatar_url"),
                   URLQueryItem(name: "id", value: "in.(\(otherIDs.joined(separator: ",")))"),
               ]
           ) {
            let profiles: [SupabaseConversationProfileDTO] = (try? await supabaseRequest(
                url: profilesURL,
                method: .GET,
                jsonBody: nil,
                anonKey: config.anonKey,
                bearerToken: token
            )) ?? []
            profilesByID = Dictionary(uniqueKeysWithValues: profiles.map { ($0.id, $0) })
        }

        let data = rawRows.map { row in
            let otherID = row.host_id == user.id ? row.user_id : row.host_id
            let otherProfile = profilesByID[otherID]
            return ConversationDTO(
                id: row.id,
                host_id: row.host_id,
                user_id: row.user_id,
                car_id: row.car_id,
                booking_id: row.booking_id,
                created_at: row.created_at,
                last_message_at: row.last_message_at,
                last_message_preview: row.last_message_preview,
                unread_count: unreadByConversation[row.id] ?? 0,
                other_user: ConversationUserDTO(
                    id: otherID,
                    name: otherProfile?.full_name ?? "User",
                    avatar: otherProfile?.avatar_url
                )
            )
        }

        return ConversationsEnvelopeDTO(data: data)
    }

    private func createConversationViaSupabase(token: String, payload: [String: Any]) async throws -> ConversationCreateDTO {
        let currentUser = try await fetchSupabaseUser(token: token)
        guard let config = supabaseConfig() else {
            throw APIError(message: "Supabase fallback is not configured.")
        }

        let hostId = (payload["hostId"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
        let participantId = (payload["participantId"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
        let carId = (payload["carId"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)

        guard let resolvedHostId = hostId, !resolvedHostId.isEmpty else {
            throw APIError(message: "Missing hostId")
        }
        let resolvedUserId = (participantId?.isEmpty == false ? participantId! : currentUser.id)
        if resolvedHostId == resolvedUserId {
            throw APIError(message: "Cannot message yourself")
        }

        let existingCarQuery = (carId?.isEmpty == false) ? "eq.\(carId!)" : "is.null"
        if let existingURL = supabaseURL(
            baseURL: config.baseURL,
            path: "/rest/v1/conversations",
            queryItems: [
                URLQueryItem(name: "select", value: "id"),
                URLQueryItem(name: "host_id", value: "eq.\(resolvedHostId)"),
                URLQueryItem(name: "user_id", value: "eq.\(resolvedUserId)"),
                URLQueryItem(name: "car_id", value: existingCarQuery),
                URLQueryItem(name: "limit", value: "1"),
            ]
        ) {
            let existingRows: [SupabaseIDRowDTO] = (try? await supabaseRequest(
                url: existingURL,
                method: .GET,
                jsonBody: nil,
                anonKey: config.anonKey,
                bearerToken: token
            )) ?? []
            if let existing = existingRows.first {
                return ConversationCreateDTO(id: existing.id)
            }
        }

        guard let insertURL = supabaseURL(baseURL: config.baseURL, path: "/rest/v1/conversations") else {
            throw APIError(message: "Invalid Supabase URL")
        }

        var body: [String: Any] = [
            "host_id": resolvedHostId,
            "user_id": resolvedUserId,
        ]
        if let carId, !carId.isEmpty {
            body["car_id"] = carId
        }

        let insertedRows: [SupabaseIDRowDTO] = try await supabaseRequest(
            url: insertURL,
            method: .POST,
            jsonBody: body,
            anonKey: config.anonKey,
            bearerToken: token,
            extraHeaders: ["Prefer": "return=representation"]
        )
        guard let inserted = insertedRows.first else {
            throw APIError(message: "Unable to create conversation")
        }
        return ConversationCreateDTO(id: inserted.id)
    }

    private func getMessagesViaSupabase(
        token: String,
        conversationID: String,
        markRead: Bool,
        since: String?,
        limit: Int
    ) async throws -> MessagesEnvelopeDTO {
        guard let config = supabaseConfig() else {
            throw APIError(message: "Supabase fallback is not configured.")
        }
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "select", value: "id,conversation_id,sender_id,body,created_at,read_at"),
            URLQueryItem(name: "conversation_id", value: "eq.\(conversationID)")
        ]
        if let since, !since.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            queryItems.append(URLQueryItem(name: "created_at", value: "gt.\(since)"))
            queryItems.append(URLQueryItem(name: "order", value: "created_at.asc"))
        } else {
            queryItems.append(URLQueryItem(name: "order", value: "created_at.desc"))
        }
        queryItems.append(URLQueryItem(name: "limit", value: String(max(1, min(limit, 500)))))

        guard
            let messagesURL = supabaseURL(
                baseURL: config.baseURL,
                path: "/rest/v1/messages",
                queryItems: queryItems
            )
        else {
            throw APIError(message: "Invalid Supabase URL")
        }

        let messages: [MessageDTO] = try await supabaseRequest(
            url: messagesURL,
            method: .GET,
            jsonBody: nil,
            anonKey: config.anonKey,
            bearerToken: token
        )

        if markRead {
            let user = try await fetchSupabaseUser(token: token)
            if let markReadURL = supabaseURL(
                baseURL: config.baseURL,
                path: "/rest/v1/messages",
                queryItems: [
                    URLQueryItem(name: "conversation_id", value: "eq.\(conversationID)"),
                    URLQueryItem(name: "read_at", value: "is.null"),
                    URLQueryItem(name: "sender_id", value: "neq.\(user.id)"),
                ]
            ) {
                try? await supabaseRequestNoResponse(
                    url: markReadURL,
                    method: .PATCH,
                    jsonBody: ["read_at": ISO8601DateFormatter().string(from: Date())],
                    anonKey: config.anonKey,
                    bearerToken: token
                )
            }
        }

        let ordered = (since?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ?? true)
            ? messages.reversed()
            : messages
        return MessagesEnvelopeDTO(data: Array(ordered))
    }

    private func sendMessageViaSupabase(token: String, conversationID: String, body: String) async throws -> MessageEnvelopeDTO {
        let user = try await fetchSupabaseUser(token: token)
        guard let config = supabaseConfig() else {
            throw APIError(message: "Supabase fallback is not configured.")
        }
        guard let url = supabaseURL(baseURL: config.baseURL, path: "/rest/v1/messages") else {
            throw APIError(message: "Invalid Supabase URL")
        }

        let rows: [MessageDTO] = try await supabaseRequest(
            url: url,
            method: .POST,
            jsonBody: [
                "conversation_id": conversationID,
                "sender_id": user.id,
                "body": body,
            ],
            anonKey: config.anonKey,
            bearerToken: token,
            extraHeaders: ["Prefer": "return=representation"]
        )
        guard let message = rows.first else {
            throw APIError(message: "Unable to send message")
        }
        return MessageEnvelopeDTO(data: message)
    }

    private func fetchOwnedCarIDsViaSupabase(token: String, userID: String) async throws -> [String] {
        guard let config = supabaseConfig() else {
            return []
        }
        guard
            let url = supabaseURL(
                baseURL: config.baseURL,
                path: "/rest/v1/cars",
                queryItems: [
                    URLQueryItem(name: "select", value: "id"),
                    URLQueryItem(name: "owner_id", value: "eq.\(userID)"),
                ]
            )
        else {
            return []
        }
        let rows: [SupabaseIDRowDTO] = (try? await supabaseRequest(
            url: url,
            method: .GET,
            jsonBody: nil,
            anonKey: config.anonKey,
            bearerToken: token
        )) ?? []
        return rows.map(\.id)
    }

    private func fetchSupabaseUser(token: String) async throws -> MobileAuthUserDTO {
        guard let config = supabaseConfig() else {
            throw APIError(message: "Supabase fallback is not configured.")
        }
        guard let userURL = URL(string: "\(config.baseURL)/auth/v1/user") else {
            throw APIError(message: "Invalid Supabase URL")
        }
        return try await supabaseRequest(
            url: userURL,
            method: .GET,
            jsonBody: nil,
            anonKey: config.anonKey,
            bearerToken: token
        )
    }

    private func supabaseURL(baseURL: String, path: String, queryItems: [URLQueryItem] = []) -> URL? {
        guard var components = URLComponents(string: "\(baseURL)\(path)") else { return nil }
        if !queryItems.isEmpty {
            components.queryItems = queryItems
        }
        return components.url
    }

    private func supabaseRequest<T: Decodable>(
        url: URL,
        method: HTTPMethod,
        jsonBody: [String: Any]?,
        anonKey: String,
        bearerToken: String?,
        extraHeaders: [String: String] = [:]
    ) async throws -> T {
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        for (header, value) in extraHeaders {
            request.setValue(value, forHTTPHeaderField: header)
        }
        if let bearerToken, !bearerToken.isEmpty {
            request.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")
        }
        if let jsonBody {
            request.httpBody = try JSONSerialization.data(withJSONObject: jsonBody)
        }

        let (data, _) = try await sendRequest(request, retryable: method == .GET)
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError(message: "Unable to decode Supabase response")
        }
    }

    private func supabaseRequestNoResponse(
        url: URL,
        method: HTTPMethod,
        jsonBody: [String: Any]?,
        anonKey: String,
        bearerToken: String?,
        extraHeaders: [String: String] = [:]
    ) async throws {
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        for (header, value) in extraHeaders {
            request.setValue(value, forHTTPHeaderField: header)
        }
        if let bearerToken, !bearerToken.isEmpty {
            request.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")
        }
        if let jsonBody {
            request.httpBody = try JSONSerialization.data(withJSONObject: jsonBody)
        }
        _ = try await sendRequest(request, retryable: method == .GET)
    }

    private func upsertProfileViaSupabase(
        token: String,
        userID: String,
        firstName: String,
        lastName: String,
        fullName: String,
        city: String,
        region: String,
        phone: String,
        avatarURL: String?
    ) async throws {
        guard let config = supabaseConfig() else {
            throw APIError(message: "Supabase fallback is not configured.")
        }
        guard let url = supabaseURL(
            baseURL: config.baseURL,
            path: "/rest/v1/profiles",
            queryItems: [URLQueryItem(name: "on_conflict", value: "id")]
        ) else {
            throw APIError(message: "Invalid Supabase URL")
        }

        let payload: [String: Any] = [
            "id": userID,
            "first_name": firstName.isEmpty ? NSNull() : firstName,
            "last_name": lastName.isEmpty ? NSNull() : lastName,
            "full_name": fullName.isEmpty ? NSNull() : fullName,
            "city": city.isEmpty ? NSNull() : city,
            "region": region.isEmpty ? NSNull() : region,
            "phone": phone.isEmpty ? NSNull() : phone,
            "avatar_url": (avatarURL?.isEmpty == false) ? avatarURL! : NSNull()
        ]

        try await supabaseRequestNoResponse(
            url: url,
            method: .POST,
            jsonBody: payload,
            anonKey: config.anonKey,
            bearerToken: token,
            extraHeaders: ["Prefer": "resolution=merge-duplicates,return=minimal"]
        )
    }

    private func uploadSupabaseStorageObject(
        token: String,
        bucket: String,
        path: String,
        fileData: Data,
        mimeType: String,
        returnPublicURL: Bool
    ) async throws -> String {
        guard let config = supabaseConfig() else {
            throw APIError(message: "Supabase fallback is not configured.")
        }
        let normalizedBucket = bucket.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalizedBucket.isEmpty else {
            throw APIError(message: "Supabase storage bucket is not configured.")
        }
        let encodedPath = encodeStoragePath(path)
        guard !encodedPath.isEmpty,
              let url = URL(string: "\(config.baseURL)/storage/v1/object/\(normalizedBucket)/\(encodedPath)") else {
            throw APIError(message: "Invalid storage upload URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = HTTPMethod.POST.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue(mimeType, forHTTPHeaderField: "Content-Type")
        request.setValue(config.anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("true", forHTTPHeaderField: "x-upsert")
        request.httpBody = fileData

        _ = try await sendRequest(request, retryable: false)

        if returnPublicURL {
            return "\(config.baseURL)/storage/v1/object/public/\(normalizedBucket)/\(encodedPath)"
        }
        return path
    }

    private func configuredBucketName(primaryKeys: [String], fallback: String) -> String {
        for key in primaryKeys {
            if let value = Bundle.main.object(forInfoDictionaryKey: key) as? String {
                let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
                if !trimmed.isEmpty {
                    return trimmed
                }
            }
        }
        return fallback
    }

    private func configuredBucketNames(primaryKeys: [String], fallbacks: [String]) -> [String] {
        var values: [String] = []
        for key in primaryKeys {
            if let value = Bundle.main.object(forInfoDictionaryKey: key) as? String {
                let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
                if !trimmed.isEmpty {
                    values.append(trimmed)
                }
            }
        }
        for fallback in fallbacks {
            let trimmed = fallback.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty {
                values.append(trimmed)
            }
        }

        var uniqueValues: [String] = []
        var seen = Set<String>()
        for value in values {
            let key = value.lowercased()
            if seen.contains(key) {
                continue
            }
            seen.insert(key)
            uniqueValues.append(value)
        }
        return uniqueValues
    }

    private func isBucketNotFoundError(_ error: Error) -> Bool {
        let message: String
        if let apiError = error as? APIError {
            message = apiError.message
        } else {
            message = error.localizedDescription
        }
        let lowered = message.lowercased()
        return lowered.contains("bucket not found") || (lowered.contains("bucket") && lowered.contains("not found"))
    }

    private func sanitizeFileExtension(_ value: String, fallback: String) -> String {
        let trimmed = value
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .trimmingCharacters(in: CharacterSet(charactersIn: "."))
            .lowercased()
        guard !trimmed.isEmpty else { return fallback }
        let valid = CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyz0123456789")
        if trimmed.rangeOfCharacter(from: valid.inverted) != nil {
            return fallback
        }
        return trimmed
    }

    private func encodeStoragePath(_ value: String) -> String {
        value
            .split(separator: "/")
            .map { segment in
                String(segment).addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? String(segment)
            }
            .joined(separator: "/")
    }

    // MARK: - HTTP

    private let maxGetRetries = 3

    private func shouldRetry(statusCode: Int) -> Bool {
        statusCode == 429 || statusCode >= 500
    }

    private func shouldRetry(error: Error) -> Bool {
        guard let urlError = error as? URLError else { return false }
        switch urlError.code {
        case .timedOut,
             .networkConnectionLost,
             .notConnectedToInternet,
             .cannotConnectToHost,
             .cannotFindHost,
             .dnsLookupFailed:
            return true
        default:
            return false
        }
    }

    private func retryDelayNanos(attempt: Int) -> UInt64 {
        let base: UInt64 = 300_000_000
        let multiplier = UInt64(1 << max(0, attempt - 1))
        return base * multiplier
    }

    private func sendRequest(_ request: URLRequest, retryable: Bool) async throws -> (Data, HTTPURLResponse) {
        let retryLimit = retryable ? maxGetRetries : 1
        var attempt = 0
        while true {
            do {
                let (data, response) = try await session.data(for: request)
                guard let http = response as? HTTPURLResponse else {
                    throw APIError(message: "Invalid server response")
                }
                if (200...299).contains(http.statusCode) {
                    return (data, http)
                }
                if retryable && attempt + 1 < retryLimit && shouldRetry(statusCode: http.statusCode) {
                    attempt += 1
                    try? await Task.sleep(nanoseconds: retryDelayNanos(attempt: attempt))
                    continue
                }
                let message =
                    decodeError(
                        from: data,
                        statusCode: http.statusCode,
                        contentType: http.value(forHTTPHeaderField: "Content-Type")
                    ) ?? "Request failed with status \(http.statusCode)"
                throw APIError(
                    message: message,
                    statusCode: http.statusCode,
                    code: decodeErrorCode(from: data)
                )
            } catch {
                if retryable && attempt + 1 < retryLimit && shouldRetry(error: error) {
                    attempt += 1
                    try? await Task.sleep(nanoseconds: retryDelayNanos(attempt: attempt))
                    continue
                }
                throw error
            }
        }
    }

    private func buildMultipartRequest(
        path: String,
        baseURL: String,
        token: String?,
        boundary: String,
        fileField: String,
        fileName: String,
        mimeType: String,
        fileData: Data
    ) throws -> URLRequest {
        let normalized = normalizeBaseURL(baseURL)
        guard let url = URL(string: normalized + path) else {
            throw APIError(message: "Invalid API URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = HTTPMethod.POST.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        if let token, !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        var body = Data()
        body.append("--\(boundary)\r\n")
        body.append("Content-Disposition: form-data; name=\"\(fileField)\"; filename=\"\(fileName)\"\r\n")
        body.append("Content-Type: \(mimeType)\r\n\r\n")
        body.append(fileData)
        body.append("\r\n")
        request.httpBody = body
        return request
    }

    private func appendMultipartField(name: String, value: String, to request: inout URLRequest, boundary: String) {
        var body = request.httpBody ?? Data()
        body.append("--\(boundary)\r\n")
        body.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n")
        body.append(value)
        body.append("\r\n")
        request.httpBody = body
    }

    private func finalizeMultipartBody(on request: inout URLRequest, boundary: String) {
        var body = request.httpBody ?? Data()
        body.append("--\(boundary)--\r\n")
        request.httpBody = body
    }

    private func executeMultipart<T: Decodable>(request: URLRequest, retryable: Bool) async throws -> T {
        let (data, _) = try await sendRequest(request, retryable: retryable)
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError(message: "Unable to decode server response")
        }
    }

    private func request<T: Decodable, U: Encodable>(
        path: String,
        method: HTTPMethod,
        body: U?,
        baseURL: String,
        token: String?
    ) async throws -> T {
        let normalized = normalizeBaseURL(baseURL)
        guard let url = URL(string: normalized + path) else {
            throw APIError(message: "Invalid API URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if let token, !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body {
            request.httpBody = try encoder.encode(AnyEncodable(body))
        }

        let (data, _) = try await sendRequest(request, retryable: method == .GET)

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError(message: "Unable to decode server response")
        }
    }

    private func requestJSON<T: Decodable>(
        path: String,
        method: HTTPMethod,
        json: [String: Any],
        baseURL: String,
        token: String?
    ) async throws -> T {
        let normalized = normalizeBaseURL(baseURL)
        guard let url = URL(string: normalized + path) else {
            throw APIError(message: "Invalid API URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if let token, !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        request.httpBody = try JSONSerialization.data(withJSONObject: json)

        let (data, _) = try await sendRequest(request, retryable: method == .GET)

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError(message: "Unable to decode server response")
        }
    }

    /// Reads only the machine-readable `code`. Unlike the message, this is never
    /// displayed, so it needs no sanitizing — but it must stay confined to the
    /// small allowlist the UI knows how to act on.
    private func decodeErrorCode(from data: Data) -> String? {
        guard let envelope = try? decoder.decode(APIErrorEnvelope.self, from: data),
              let code = envelope.code,
              !code.isEmpty else { return nil }
        return code
    }

    private func decodeError(from data: Data, statusCode: Int, contentType: String? = nil) -> String? {
        let normalizedContentType = contentType?.lowercased() ?? ""
        if normalizedContentType.contains("text/html") {
            return nil
        }

        // Collect the most specific candidate message, then sanitize it. This message
        // may come from our own (sanitized) backend OR — on direct-Supabase fallback
        // paths — from PostgREST/GoTrue, which return raw DB/auth text. So NOTHING here
        // is displayed until it passes `sanitizedServerMessage`.
        var candidate: String?
        if let envelope = try? decoder.decode(APIErrorEnvelope.self, from: data), let message = envelope.message, !message.isEmpty {
            candidate = message
        } else if let supabaseError = try? decoder.decode(SupabaseAuthErrorEnvelope.self, from: data) {
            candidate = supabaseError.msg ?? supabaseError.error_description ?? supabaseError.error
        } else if let plain = String(data: data, encoding: .utf8) {
            candidate = plain.trimmingCharacters(in: .whitespacesAndNewlines)
        }

        // Returns nil (→ caller's friendly fallback) for anything that looks technical.
        return candidate.flatMap { Self.sanitizedServerMessage($0) }
    }

    /// Allows through only short, single-line, human-readable messages. Rejects raw DB /
    /// PostgREST / GoTrue / HTML / JSON / stack text so it can never reach the UI.
    static func sanitizedServerMessage(_ raw: String) -> String? {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        if trimmed.count > 160 || trimmed.contains("\n") { return nil }
        let lowered = trimmed.lowercased()
        let technicalMarkers = [
            "violates", "constraint", "duplicate key", "null value", "column ", "relation ",
            "syntax error", "permission denied", "row-level security", "sqlstate", "postgres",
            "pgrst", "exception", "traceback", "flow state", "econnrefused", "enotfound",
            "etimedout", "0x", "://", "{\"", "<", "undefined"
        ]
        if technicalMarkers.contains(where: { lowered.contains($0) }) { return nil }
        return trimmed
    }

    private func normalizeBaseURL(_ value: String) -> String {
        var trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.hasSuffix("/") {
            trimmed.removeLast()
        }
        if var components = URLComponents(string: trimmed), let host = components.host?.lowercased(), host == "hayamegh.com" {
            components.host = "www.hayamegh.com"
            if let normalized = components.string {
                return normalized
            }
        }
        return trimmed
    }
}

private extension Data {
    mutating func append(_ string: String) {
        if let data = string.data(using: .utf8) {
            append(data)
        }
    }
}

enum StringOrBoolOrNumber: Decodable {
    case string(String)
    case bool(Bool)
    case int(Int)
    case double(Double)
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else if let value = try? container.decode(Int.self) {
            self = .int(value)
        } else if let value = try? container.decode(Double.self) {
            self = .double(value)
        } else if let value = try? container.decode(String.self) {
            self = .string(value)
        } else {
            self = .null
        }
    }
}

enum DoubleOrIntOrString: Decodable {
    case double(Double)
    case int(Int)
    case string(String)
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let value = try? container.decode(Double.self) {
            self = .double(value)
        } else if let value = try? container.decode(Int.self) {
            self = .int(value)
        } else if let value = try? container.decode(String.self) {
            self = .string(value)
        } else {
            self = .null
        }
    }

    var doubleValue: Double {
        switch self {
        case .double(let value):
            return value
        case .int(let value):
            return Double(value)
        case .string(let value):
            return Double(value) ?? 0
        case .null:
            return 0
        }
    }

    var intValue: Int {
        Int(doubleValue.rounded())
    }
}

import Foundation

enum MockDataService {
    static let defaultRegion = DatabaseReferenceData.defaultRegion
    static let regions = DatabaseReferenceData.regions
    private static var runtimeCitiesByRegion: [String: [String]]?
    private static var runtimeCarMakes: [String]?
    private static var runtimeCarModelsByMake: [String: [String]]?

    static var citiesByRegion: [String: [String]] {
        runtimeCitiesByRegion ?? DatabaseReferenceData.districtsByRegion
    }

    static var carMakes: [String] {
        runtimeCarMakes ?? DatabaseReferenceData.carMakes
    }

    static var carModelsByMake: [String: [String]] {
        runtimeCarModelsByMake ?? DatabaseReferenceData.carModelsByMake
    }

    static func setRuntimeReferenceData(
        regionsByCity: [String: [String]],
        makes: [String],
        modelsByMake: [String: [String]]
    ) {
        let normalizedRegions = regionsByCity.reduce(into: [String: [String]]()) { partialResult, item in
            let key = normalizedRegion(item.key)
            partialResult[key] = item.value
        }

        runtimeCitiesByRegion = normalizedRegions.isEmpty ? nil : normalizedRegions
        runtimeCarMakes = makes.isEmpty ? nil : makes
        runtimeCarModelsByMake = modelsByMake.isEmpty ? nil : modelsByMake
    }

    static func normalizedRegion(_ raw: String) -> String {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return defaultRegion }
        let lowered = trimmed.lowercased()
        if let mapped = DatabaseReferenceData.regionAliases[lowered] {
            return mapped
        }
        let withoutSuffix = trimmed
            .replacingOccurrences(of: " Region", with: "", options: [.caseInsensitive])
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()
        if let mapped = DatabaseReferenceData.regionAliases[withoutSuffix] {
            return mapped
        }
        return trimmed
    }

    static func regionsIncluding(_ preferred: String?) -> [String] {
        let preferredValue = normalizedRegion(preferred ?? "")
        guard !preferredValue.isEmpty else { return regions }
        if regions.contains(where: { $0.caseInsensitiveCompare(preferredValue) == .orderedSame }) {
            return regions
        }
        return [preferredValue] + regions
    }

    static func cities(for region: String, preferred: String? = nil) -> [String] {
        let trimmedRegion = region.trimmingCharacters(in: .whitespacesAndNewlines)
        let canonical = trimmedRegion.isEmpty ? "" : normalizedRegion(trimmedRegion)
        var values: [String]
        if canonical.isEmpty {
            values = Array(Set(citiesByRegion.values.flatMap { $0 }))
                .sorted { $0.caseInsensitiveCompare($1) == .orderedAscending }
        } else {
            values = citiesByRegion[canonical] ?? []
        }
        let preferredCity = preferred?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !preferredCity.isEmpty && !values.contains(where: { $0.caseInsensitiveCompare(preferredCity) == .orderedSame }) {
            values.insert(preferredCity, at: 0)
        }
        if values.isEmpty {
            values = [preferredCity.isEmpty ? "Accra" : preferredCity]
        }
        return values
    }

    static func normalizedMake(_ raw: String) -> String {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return "" }
        if let match = carMakes.first(where: { $0.caseInsensitiveCompare(trimmed) == .orderedSame }) {
            return match
        }
        return trimmed
    }

    static func makesIncluding(_ preferred: String?) -> [String] {
        let preferredValue = normalizedMake(preferred ?? "")
        guard !preferredValue.isEmpty else { return carMakes }
        if carMakes.contains(where: { $0.caseInsensitiveCompare(preferredValue) == .orderedSame }) {
            return carMakes
        }
        return [preferredValue] + carMakes
    }

    static func models(for make: String, preferred: String? = nil) -> [String] {
        let canonicalMake = normalizedMake(make)
        var values = carModelsByMake[canonicalMake] ?? []
        let preferredModel = preferred?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !preferredModel.isEmpty && !values.contains(where: { $0.caseInsensitiveCompare(preferredModel) == .orderedSame }) {
            values.insert(preferredModel, at: 0)
        }
        return values
    }

    private static func normalizedLocationToken(_ raw: String?) -> String {
        let trimmed = (raw ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return "" }
        return trimmed
            .lowercased()
            .replacingOccurrences(
                of: "\\s+",
                with: " ",
                options: .regularExpression
            )
    }

    static func isGreaterAccraRegion(_ raw: String?) -> Bool {
        let normalized = normalizedLocationToken(raw)
        if normalized.isEmpty { return false }
        return normalized == "greater accra" || normalized == "greater accra region"
    }

    static func isLocationOutsideAccra(region: String?, city: String?) -> Bool {
        let normalizedRegion = normalizedLocationToken(region)
        if !normalizedRegion.isEmpty {
            return !isGreaterAccraRegion(normalizedRegion)
        }

        let normalizedCity = normalizedLocationToken(city)
        if normalizedCity.isEmpty {
            return false
        }
        return normalizedCity != "accra" && normalizedCity != "tema"
    }

    static func isOutsideListingRegion(tripRegion: String?, listingRegion: String?) -> Bool {
        let normalizedTripRegion = normalizedLocationToken(tripRegion)
        let normalizedListingRegion = normalizedLocationToken(listingRegion)
        if normalizedTripRegion.isEmpty || normalizedListingRegion.isEmpty {
            return false
        }
        return normalizedTripRegion != normalizedListingRegion
    }

    static let carTypes = ["SUV", "Sedan", "Hatchback", "Pickup", "Luxury", "Van"]
    static let transmissions = ["Automatic", "Manual"]
    static let fuels = ["Petrol", "Diesel", "Hybrid", "Electric"]

    static let cars: [Car] = [
        Car(
            id: "car-001",
            title: "Honda Civic",
            year: 2019,
            city: "Accra",
            region: "Greater Accra Region",
            dailyPrice: 500,
            rating: 4.8,
            reviewsCount: 34,
            type: "Sedan",
            transmission: "Automatic",
            seats: 5,
            fuelType: "Petrol",
            description: "Clean interior, cold AC, ideal for city and airport runs.",
            imageNames: [
                "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1493238792000-8113da705763?q=80&w=1200&auto=format&fit=crop"
            ],
            hostName: "Stanley Abu",
            hostVerified: true,
            hostLevel: "Verified Host",
            instantBook: true,
            deliveryAvailable: true,
            airConditioning: true,
            approvalStatus: "approved",
            isAvailable: true,
            favoritesCount: 14
        ),
        Car(
            id: "car-002",
            title: "Jetour T2/Traveller",
            year: 2025,
            city: "Accra",
            region: "Greater Accra Region",
            dailyPrice: 500,
            rating: 4.6,
            reviewsCount: 19,
            type: "SUV",
            transmission: "Automatic",
            seats: 5,
            fuelType: "Petrol",
            description: "Modern SUV with roomy cabin and smooth ride.",
            imageNames: [
                "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1200&auto=format&fit=crop"
            ],
            hostName: "Sefwee",
            hostVerified: true,
            hostLevel: "Top Host",
            instantBook: false,
            deliveryAvailable: true,
            airConditioning: true,
            approvalStatus: "approved",
            isAvailable: true,
            favoritesCount: 22
        ),
        Car(
            id: "car-003",
            title: "Mercedes-Benz E-Class",
            year: 2025,
            city: "Adenta",
            region: "Greater Accra Region",
            dailyPrice: 500,
            rating: 4.9,
            reviewsCount: 43,
            type: "Luxury",
            transmission: "Automatic",
            seats: 5,
            fuelType: "Petrol",
            description: "Premium comfort for executive and wedding rides.",
            imageNames: [
                "https://images.unsplash.com/photo-1617469767053-b1a5a313a2c1?q=80&w=1200&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=1200&auto=format&fit=crop"
            ],
            hostName: "Stanley Abu",
            hostVerified: true,
            hostLevel: "Top Host",
            instantBook: true,
            deliveryAvailable: false,
            airConditioning: true,
            approvalStatus: "approved",
            isAvailable: true,
            favoritesCount: 31
        ),
        Car(
            id: "car-004",
            title: "Mitsubishi Outlander",
            year: 2025,
            city: "Adenta",
            region: "Greater Accra Region",
            dailyPrice: 300,
            rating: 4.4,
            reviewsCount: 12,
            type: "SUV",
            transmission: "Automatic",
            seats: 7,
            fuelType: "Petrol",
            description: "Family SUV with extra seat capacity for long trips.",
            imageNames: [
                "https://images.unsplash.com/photo-1550355291-bbee04a92027?q=80&w=1200&auto=format&fit=crop"
            ],
            hostName: "Rosmozy Saa",
            hostVerified: false,
            hostLevel: "New Host",
            instantBook: false,
            deliveryAvailable: true,
            airConditioning: true,
            approvalStatus: "approved",
            isAvailable: true,
            favoritesCount: 9
        ),
        Car(
            id: "car-005",
            title: "Toyota Fortuner",
            year: 2022,
            city: "Kumasi",
            region: "Ashanti Region",
            dailyPrice: 650,
            rating: 4.7,
            reviewsCount: 21,
            type: "SUV",
            transmission: "Automatic",
            seats: 7,
            fuelType: "Diesel",
            description: "Reliable SUV for upcountry routes and rough roads.",
            imageNames: [
                "https://images.unsplash.com/photo-1583267746897-2cf415887172?q=80&w=1200&auto=format&fit=crop"
            ],
            hostName: "Kofi Mensah",
            hostVerified: true,
            hostLevel: "Verified Host",
            instantBook: false,
            deliveryAvailable: false,
            airConditioning: true,
            approvalStatus: "approved",
            isAvailable: true,
            favoritesCount: 16
        )
    ]

    static let renterBookings: [Booking] = [
        Booking(
            id: "book-001",
            carID: "car-001",
            carTitle: "Honda Civic",
            renterName: "Ama Owusu",
            hostName: "Stanley Abu",
            startDate: Calendar.current.date(byAdding: .day, value: 2, to: .now) ?? .now,
            endDate: Calendar.current.date(byAdding: .day, value: 5, to: .now) ?? .now,
            status: .confirmed,
            paymentStatus: .paid,
            totalPrice: 1750,
            tripUseRegion: "Greater Accra Region",
            tripUseCity: "Accra",
            tripUseAddress: "Airport Residential",
            createdAt: Calendar.current.date(byAdding: .day, value: -3, to: .now) ?? .now
        ),
        Booking(
            id: "book-002",
            carID: "car-003",
            carTitle: "Mercedes-Benz E-Class",
            renterName: "Ama Owusu",
            hostName: "Stanley Abu",
            startDate: Calendar.current.date(byAdding: .day, value: -15, to: .now) ?? .now,
            endDate: Calendar.current.date(byAdding: .day, value: -12, to: .now) ?? .now,
            status: .completed,
            paymentStatus: .paid,
            totalPrice: 1800,
            tripUseRegion: "Greater Accra Region",
            tripUseCity: "Adenta",
            tripUseAddress: "Ashaley Botwe",
            createdAt: Calendar.current.date(byAdding: .day, value: -20, to: .now) ?? .now
        )
    ]

    static let hostBookings: [Booking] = [
        Booking(
            id: "book-101",
            carID: "car-001",
            carTitle: "Honda Civic",
            renterName: "Sefwee",
            hostName: "Stanley Abu",
            startDate: Calendar.current.date(byAdding: .day, value: 1, to: .now) ?? .now,
            endDate: Calendar.current.date(byAdding: .day, value: 3, to: .now) ?? .now,
            status: .awaitingHost,
            paymentStatus: .paid,
            totalPrice: 1200,
            tripUseRegion: "Greater Accra Region",
            tripUseCity: "Accra",
            tripUseAddress: "Cantonments",
            createdAt: Calendar.current.date(byAdding: .hour, value: -8, to: .now) ?? .now
        ),
        Booking(
            id: "book-102",
            carID: "car-002",
            carTitle: "Jetour T2/Traveller",
            renterName: "Stanley Abu",
            hostName: "Stanley Abu",
            startDate: Calendar.current.date(byAdding: .day, value: -10, to: .now) ?? .now,
            endDate: Calendar.current.date(byAdding: .day, value: -7, to: .now) ?? .now,
            status: .completed,
            paymentStatus: .paid,
            totalPrice: 1650,
            tripUseRegion: "Greater Accra Region",
            tripUseCity: "Adenta",
            tripUseAddress: "Pantang",
            createdAt: Calendar.current.date(byAdding: .day, value: -13, to: .now) ?? .now
        )
    ]

    static let conversations: [Conversation] = [
        Conversation(
            id: "conv-001",
            participantName: "Stanley Abu",
            participantAvatar: nil,
            lastMessagePreview: "Hi, are you still interested in the Honda Civic?",
            updatedAt: Calendar.current.date(byAdding: .minute, value: -8, to: .now) ?? .now,
            unreadCount: 2
        ),
        Conversation(
            id: "conv-002",
            participantName: "Rosmozy Saa",
            participantAvatar: nil,
            lastMessagePreview: "Pickup can be arranged at East Legon Mall.",
            updatedAt: Calendar.current.date(byAdding: .hour, value: -2, to: .now) ?? .now,
            unreadCount: 0
        )
    ]

    static let messagesByConversation: [String: [ChatMessage]] = [
        "conv-001": [
            ChatMessage(
                id: "msg-001",
                conversationID: "conv-001",
                senderName: "Stanley Abu",
                body: "Hi Ama, the car is available from Friday.",
                isMine: false,
                createdAt: Calendar.current.date(byAdding: .minute, value: -30, to: .now) ?? .now
            ),
            ChatMessage(
                id: "msg-002",
                conversationID: "conv-001",
                senderName: "Ama Owusu",
                body: "Great. Can I pick up around 10 AM?",
                isMine: true,
                createdAt: Calendar.current.date(byAdding: .minute, value: -20, to: .now) ?? .now
            ),
            ChatMessage(
                id: "msg-003",
                conversationID: "conv-001",
                senderName: "Stanley Abu",
                body: "Yes, 10 AM works. Please come with your ID.",
                isMine: false,
                createdAt: Calendar.current.date(byAdding: .minute, value: -10, to: .now) ?? .now
            )
        ],
        "conv-002": [
            ChatMessage(
                id: "msg-004",
                conversationID: "conv-002",
                senderName: "Rosmozy Saa",
                body: "Pickup can be arranged at East Legon Mall.",
                isMine: false,
                createdAt: Calendar.current.date(byAdding: .hour, value: -2, to: .now) ?? .now
            )
        ]
    ]

    static let hostReviews: [Review] = [
        Review(id: "rev-001", carID: "car-001", carTitle: "Honda Civic", guestName: "Sefwee", rating: 5, comment: "Car was very clean and pickup was fast.", createdAt: Calendar.current.date(byAdding: .day, value: -2, to: .now) ?? .now),
        Review(id: "rev-002", carID: "car-002", carTitle: "Jetour T2/Traveller", guestName: "Nana K.", rating: 4, comment: "Great car, host responded quickly.", createdAt: Calendar.current.date(byAdding: .day, value: -5, to: .now) ?? .now)
    ]
}

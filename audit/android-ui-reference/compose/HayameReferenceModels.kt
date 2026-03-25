package com.hayame.reference

data class CarUiModel(
    val id: String,
    val title: String,
    val city: String,
    val region: String,
    val dailyPrice: Int,
    val rating: Double,
    val reviewsCount: Int,
    val imageUrl: String? = null,
    val instantBook: Boolean = false,
    val hostName: String = "Host",
    val hostLevel: String = "Verified Host",
    val hostCity: String = "Accra",
    val hostVerified: Boolean = true,
    val hostPhoneVerified: Boolean = true,
    val hostEmailVerified: Boolean = true,
    val type: String = "Sedan",
    val transmission: String = "automatic",
    val fuelType: String = "petrol",
    val seats: Int = 5,
    val year: Int = 2022,
    val description: String = "Clean and reliable car listing.",
    val features: List<String> = listOf("Air Conditioning", "Bluetooth", "USB Charging"),
    val insuranceFee: Int = 70,
    val deliveryFee: Int = 0,
    val outsideRegionFee: Int = 180,
    val deposit: Int = 0,
    val cancellationPolicy: String = "Moderate"
)

data class BookingUiModel(
    val id: String,
    val carTitle: String,
    val hostName: String,
    val tripUseCity: String,
    val tripUseRegion: String,
    val startDate: String,
    val endDate: String,
    val nights: Int,
    val status: BookingStatusUi,
    val paymentStatus: PaymentStatusUi,
    val dailyRate: Int,
    val subtotal: Int,
    val platformFee: Int,
    val insuranceFee: Int,
    val deliveryFee: Int,
    val outsideRegionFee: Int,
    val deposit: Int,
    val total: Int,
    val paymentReference: String? = null,
    val rejectionReason: String? = null
)

enum class BookingStatusUi(val label: String) {
    PENDING("Pending"),
    AWAITING_HOST("Awaiting Host"),
    CONFIRMED("Confirmed"),
    COMPLETED("Completed"),
    CANCELLED("Cancelled"),
    REJECTED("Rejected"),
    REFUNDED("Refunded")
}

enum class PaymentStatusUi(val label: String) {
    PENDING("Pending"),
    PAID("Paid"),
    REFUNDED("Refunded"),
    FAILED("Failed")
}

data class ProfileUiModel(
    val fullName: String,
    val email: String,
    val phone: String,
    val city: String,
    val region: String,
    val avatarUrl: String? = null,
    val hostModeEnabled: Boolean = false,
    val hostStatusLabel: String = "Become a Host"
)

object HayamePreviewData {
    val featuredCars = listOf(
        CarUiModel(
            id = "car-1",
            title = "Mercedes-Benz C-Class C300 2019",
            city = "Accra",
            region = "Greater Accra",
            dailyPrice = 450,
            rating = 4.9,
            reviewsCount = 41,
            instantBook = true,
            hostName = "Kwesi Lamptey"
        ),
        CarUiModel(
            id = "car-2",
            title = "Toyota Corolla LE 2021",
            city = "Accra",
            region = "Greater Accra",
            dailyPrice = 280,
            rating = 4.7,
            reviewsCount = 29,
            hostName = "Ama Owusu"
        ),
        CarUiModel(
            id = "car-3",
            title = "Hyundai Elantra 2020",
            city = "Tema",
            region = "Greater Accra",
            dailyPrice = 320,
            rating = 4.8,
            reviewsCount = 17,
            hostName = "Nana Adjei"
        )
    )

    val upcomingTrips = listOf(
        BookingUiModel(
            id = "trip-1",
            carTitle = "Mercedes-Benz C-Class C300 2019",
            hostName = "Kwesi Lamptey",
            tripUseCity = "Accra",
            tripUseRegion = "Greater Accra",
            startDate = "22/03/2026",
            endDate = "24/03/2026",
            nights = 2,
            status = BookingStatusUi.CONFIRMED,
            paymentStatus = PaymentStatusUi.PAID,
            dailyRate = 450,
            subtotal = 900,
            platformFee = 90,
            insuranceFee = 70,
            deliveryFee = 0,
            outsideRegionFee = 0,
            deposit = 0,
            total = 1060,
            paymentReference = "HYM-9381-221"
        )
    )

    val pastTrips = listOf(
        BookingUiModel(
            id = "trip-2",
            carTitle = "Toyota Corolla LE 2021",
            hostName = "Ama Owusu",
            tripUseCity = "Accra",
            tripUseRegion = "Greater Accra",
            startDate = "08/03/2026",
            endDate = "10/03/2026",
            nights = 2,
            status = BookingStatusUi.COMPLETED,
            paymentStatus = PaymentStatusUi.PAID,
            dailyRate = 280,
            subtotal = 560,
            platformFee = 56,
            insuranceFee = 50,
            deliveryFee = 0,
            outsideRegionFee = 0,
            deposit = 0,
            total = 666,
            paymentReference = "HYM-1172-114"
        )
    )

    val profile = ProfileUiModel(
        fullName = "Kennedy Abubakar",
        email = "kennedy@hayame.com",
        phone = "+233 24 555 0001",
        city = "Accra",
        region = "Greater Accra",
        hostModeEnabled = false,
        hostStatusLabel = "Your host application is pending review"
    )
}

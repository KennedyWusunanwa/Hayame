package com.hayame.app.ui.navigation

object NavRoutes {
    const val Splash = "splash"
    const val Login = "login"
    const val Signup = "signup"
    const val Main = "main"
    const val MainRoute = "main?tab={tab}"
    const val HostShell = "host_shell"
    const val Dashboard = "dashboard"
    const val CarDetail = "car_detail"
    const val Booking = "booking"
    const val Messages = "messages"
    const val Conversation = "conversation"
    const val BecomeHost = "become_host"
    const val HostPending = "host_pending"
    const val HostDashboard = "host_dashboard"
    const val HostCars = "host_cars"
    const val HostCarEditor = "host_car_editor"
    const val HostListingPhotos = "host_listing_photos"
    const val HostAvailability = "host_availability"
    const val HostBookings = "host_bookings"
    const val HostEarnings = "host_earnings"
    const val HostFavorites = "host_favorites"
    const val HostReviews = "host_reviews"
    const val Profile = "profile"
    const val HostProfile = "host_profile"
    const val SupportLegal = "support_legal"
    const val Contact = "contact"
    const val Privacy = "privacy"
    const val Protection = "protection"
    const val Cancellation = "cancellation"
    const val Marketing = "marketing"
    const val HostPublicProfile = "host_public_profile"
    const val AdminShell = "admin_shell"

    fun main(tab: MainTab? = null): String = if (tab == null) {
        Main
    } else {
        "$Main?tab=${tab.name.lowercase()}"
    }

    fun carDetail(carId: String): String = CarDetail + "/" + carId
    fun booking(carId: String): String = Booking + "/" + carId
    fun conversation(conversationId: String): String = Conversation + "/" + conversationId
    fun hostListingPhotos(carId: String): String = HostListingPhotos + "/" + carId
    fun hostAvailability(carId: String): String = HostAvailability + "/" + carId
    fun hostCarEditor(carId: String?): String = if (carId.isNullOrBlank()) {
        HostCarEditor + "/new"
    } else {
        HostCarEditor + "/" + carId
    }
    fun hostPublicProfile(ownerId: String): String = HostPublicProfile + "/" + ownerId
}

fun parseMainTab(raw: String?): MainTab {
    return when (raw?.trim()?.lowercase()) {
        "explore" -> MainTab.EXPLORE
        "trips" -> MainTab.TRIPS
        "saved" -> MainTab.SAVED
        "more" -> MainTab.MORE
        else -> MainTab.HOME
    }
}

enum class MainTab(val title: String) {
    HOME("Home"),
    EXPLORE("Explore"),
    TRIPS("Trips"),
    SAVED("Saved"),
    MORE("More"),
}

enum class HostMainTab(val title: String) {
    DASHBOARD("Dashboard"),
    CARS("Cars"),
    BOOKINGS("Bookings"),
    EARNINGS("Earnings"),
    INBOX("Inbox"),
    PROFILE("Profile"),
}

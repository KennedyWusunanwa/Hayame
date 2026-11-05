import SwiftUI
import MapKit
import PhotosUI
import UIKit
import CoreLocation
import LinkPresentation

enum MoreRoute: String, Identifiable {
    case messages
    case dashboard

    var id: String { rawValue }
}

struct RenterTabShell: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.colorScheme) private var colorScheme
    @State private var moreRoute: MoreRoute?

    var body: some View {
        ZStack {
            activeContent
                .id(activePage)
                .transition(HayameTabSwitch.transition)
        }
        .animation(HayameTabSwitch.animation, value: activePage)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(HayameTheme.pageBackground.ignoresSafeArea())
        .tint(HayameTheme.brandBlue)
        .hayameNavigationChrome(colorScheme: colorScheme)
        .onAppear {
            routeLegacyTabIfNeeded(appState.renterTab)
        }
        .onChange(of: appState.renterTab) { _, newValue in
            routeLegacyTabIfNeeded(newValue)
        }
    }

    /// The legacy inbox/profile/dashboard tabs all land on the More page, so
    /// they share one identity and do not re-animate the page.
    private var activePage: RenterTab {
        switch appState.renterTab {
        case .more, .inbox, .profile, .dashboard: return .more
        default: return appState.renterTab
        }
    }

    @ViewBuilder
    private var activeContent: some View {
        switch appState.renterTab {
        case .home:
            renterStack { RenterHomeScreen() }
        case .explore:
            renterStack { ExploreScreen() }
        case .trips:
            renterStack { TripsScreen() }
        case .favorites:
            renterStack { FavoritesScreen() }
        case .more, .inbox, .profile, .dashboard:
            renterStack { MoreScreen(requestedRoute: $moreRoute) }
        }
    }

    // Hosts the floating tab bar as a bottom safe-area inset *inside* the
    // navigation stack so each root screen's scroll content reserves space for
    // it (nothing hides behind the bar) while still scrolling under the glass.
    // The bar tucks away when a detail screen is pushed.
    private func renterStack<Content: View>(@ViewBuilder _ content: () -> Content) -> some View {
        NavigationStack {
            content()
                .safeAreaInset(edge: .bottom, spacing: 0) {
                    if !HayameScreenshotMode.hidesTabBar {
                        HayameBottomTabBar(selection: $appState.renterTab, items: renterTabItems)
                    }
                }
        }
    }

    private func routeLegacyTabIfNeeded(_ tab: RenterTab) {
        switch tab {
        case .inbox:
            moreRoute = .messages
            appState.renterTab = .more
        case .dashboard:
            moreRoute = .dashboard
            appState.renterTab = .more
        case .profile:
            appState.renterTab = .more
        default:
            break
        }
    }

    private var renterTabItems: [HayameBottomTabItem<RenterTab>] {
        [
            HayameBottomTabItem(id: .home, title: "Home", systemImage: "house"),
            HayameBottomTabItem(id: .explore, title: "Explore", systemImage: "magnifyingglass"),
            HayameBottomTabItem(id: .trips, title: "Trips", systemImage: "calendar"),
            HayameBottomTabItem(id: .favorites, title: "Saved", systemImage: "heart"),
            HayameBottomTabItem(
                id: .more,
                title: "More",
                systemImage: "ellipsis",
                badgeCount: appState.unreadMessagesCount
            )
        ]
    }
}

#if DEBUG
struct ScreenshotRenterRouteView: View {
    @EnvironmentObject private var appState: AppState
    let route: ScreenshotRoute
    @State private var isPreparingLiveListings = true
    @State private var liveListingError: String?

    init(route: ScreenshotRoute) {
        self.route = route
        _isPreparingLiveListings = State(initialValue: route != .exploreFilters)
    }

    private var screenshotCar: Car {
        appState.cars.first(where: { $0.id == "car-001" }) ??
            appState.cars.first ??
            MockDataService.cars[0]
    }

    private var startDate: Date {
        bookingAddingDays(2, to: Date())
    }

    private var endDate: Date {
        bookingAddingDays(4, to: Date())
    }

    private var blockedDates: Set<Date> {
        [
            bookingAddingDays(5, to: Date()),
            bookingAddingDays(9, to: Date()),
            bookingAddingDays(16, to: Date())
        ]
    }

    var body: some View {
        Group {
            if isPreparingLiveListings {
                ScreenshotLiveListingsLoadingView()
            } else if let liveListingError {
                ScreenshotLiveListingsErrorView(message: liveListingError)
            } else {
                routeContent
            }
        }
        .background(HayameTheme.pageBackground.ignoresSafeArea())
        .task {
            guard isPreparingLiveListings else { return }
            let ready = await appState.prepareScreenshotLiveData()
            if ready {
                liveListingError = nil
            } else {
                let syncMessage = appState.syncErrorMessage
                liveListingError = (syncMessage?.isEmpty == false) ? syncMessage : "Live listings did not load."
            }
            isPreparingLiveListings = false
        }
    }

    @ViewBuilder
    private var routeContent: some View {
        switch route {
        case .home:
            renterTab(.home)

        case .explore:
            renterTab(.explore)

        case .trips:
            renterTab(.trips)

        case .favorites:
            renterTab(.favorites)

        case .messages:
            NavigationStack {
                InboxScreen(isTabRoot: true)
            }

        case .chatThread:
            NavigationStack {
                ChatThreadScreen(conversationID: "conv-001", participantName: "Stanley Abu")
            }

        case .hostReviews, .hostReviewsEmpty:
            NavigationStack {
                HostReviewsScreen()
            }
            .onAppear {
                applyHostFixtures()
                if route == .hostReviewsEmpty { appState.hostReviews = [] }
            }

        case .profile, .more:
            renterTab(.more)
                .onAppear(perform: useDemoProfileForScreenshots)

        case .profilePage:
            NavigationStack {
                ProfileScreen()
            }
            .onAppear(perform: useDemoProfileForScreenshots)

        case .settings:
            NavigationStack {
                SettingsScreen()
            }
            .onAppear(perform: useDemoProfileForScreenshots)

        case .renterDashboard:
            NavigationStack {
                RenterDashboardScreen()
            }

        case .checkoutResumeHome:
            renterTab(.home)
                .onAppear { applyResumeCheckoutFixture(blocked: false) }

        case .checkoutResumeTrips:
            renterTab(.trips)
                .onAppear { applyResumeCheckoutFixture(blocked: false) }

        case .checkoutResumeDetail:
            NavigationStack {
                CarDetailScreen(car: screenshotCar)
            }
            .onAppear { applyResumeCheckoutFixture(blocked: false) }

        case .checkoutResumeSheet, .checkoutResumeBlocked:
            CheckoutResumeSheet(
                initial: AppState.screenshotPendingCheckout(
                    from: screenshotCar,
                    startDate: startDate,
                    endDate: endDate,
                    blocked: route == .checkoutResumeBlocked
                )
            )
            .onAppear { applyResumeCheckoutFixture(blocked: route == .checkoutResumeBlocked) }

        case .exploreFilters:
            NavigationStack {
                ExploreFilterSheet()
            }
            .onAppear {
                appState.exploreFilters.region = "Greater Accra Region"
                appState.exploreFilters.city = "Accra"
                appState.exploreFilters.carType = "SUV"
                appState.exploreFilters.instantBookOnly = true
                appState.exploreFilters.deliveryOnly = true
            }

        case .carDetail:
            NavigationStack {
                CarDetailScreen(car: screenshotCar)
            }

        case .bookingTrip:
            bookingSheet(step: .tripDetails)

        case .bookingCalendar:
            BookingAvailabilityCalendarSheet(
                title: "Choose start date",
                selectedDate: startDate,
                selectionRange: startDate...endDate,
                blockedDates: blockedDates,
                minimumDate: bookingDay(Date()),
                canSelectDate: { date in
                    isBookableStartDate(date, blockedDates: blockedDates)
                },
                onSelect: { _ in }
            )

        case .bookingLocation:
            bookingSheet(step: .location)

        case .bookingReview:
            bookingSheet(step: .review)

        case .bookingPayment:
            bookingSheet(step: .payment)

        case .paymentProcessing:
            bookingSheet(step: .payment, processing: true)

        case .bookingSuccess:
            BookingSuccessStage(
                car: screenshotCar,
                bookingID: "screenshot-booking",
                startDate: startDate,
                endDate: endDate,
                onDone: {}
            )

        case .hostBookings:
            NavigationStack {
                HostBookingsScreen()
            }
            .onAppear {
                // Reuse the renter fixtures as incoming requests so the host
                // decision cards can be captured without a second account.
                guard appState.hostBookings.isEmpty else { return }
                appState.hostBookings = appState.renterBookings.enumerated().map { index, booking in
                    var request = booking
                    if index == 0 { request.status = .awaitingHost }
                    return request
                }
                appState.bookingsLoadState = appState.hostBookings.isEmpty ? .empty : .loaded
            }

        case .modeSwitch:
            RootView()
                .onAppear {
                    useDemoProfileForScreenshots()
                    applyHostFixtures()
                    appState.hostModeEnabled = false
                }

        case .hostHome, .hostProfile:
            HostTabShell()
                .onAppear {
                    useDemoProfileForScreenshots()
                    applyHostFixtures()
                    appState.hostTab = route == .hostHome ? .dashboard : .profile
                }

        case .splash, .authLogin, .authSignup:
            EmptyView()
        }
    }

    /// Demo host data (bookings, reviews, listings) for the host screenshot routes.
    private func applyHostFixtures() {
        useDemoProfileForScreenshots()
        appState.hostAccessState = .host
        appState.hostModeEnabled = true
        if appState.hostBookings.isEmpty {
            appState.hostBookings = appState.renterBookings.enumerated().map { index, booking in
                var request = booking
                if index == 0 { request.status = .awaitingHost; request.paymentStatus = .paid }
                if index == 1 { request.status = .completed }
                return request
            }
            appState.bookingsLoadState = appState.hostBookings.isEmpty ? .empty : .loaded
        }
        if appState.hostReviews.isEmpty {
            appState.hostReviews = MockDataService.hostReviews
        }
        if appState.ownedCars.isEmpty {
            appState.ownedCars = Array(appState.cars.prefix(3))
        }
    }

    private func renterTab(_ tab: RenterTab) -> some View {
        RenterTabShell()
            .onAppear {
                appState.renterTab = tab
            }
    }

    /// A held, unfinished checkout for the first live listing, so the resume
    /// card, strip and sheet can be captured without a real abandoned payment.
    private func applyResumeCheckoutFixture(blocked: Bool) {
        useDemoProfileForScreenshots()
        appState.pendingCheckout = AppState.screenshotPendingCheckout(
            from: screenshotCar,
            startDate: startDate,
            endDate: endDate,
            blocked: blocked
        )
        appState.pendingCheckoutLoadState = .loaded
    }

    /// Profile screenshots want a signed-in look without a real session.
    private func useDemoProfileForScreenshots() {
        guard !appState.isAuthenticated else { return }
        appState.currentUser = .demoGuest
        appState.isAuthenticated = true
    }

    private func bookingSheet(step: BookingCheckoutStep, processing: Bool = false) -> some View {
        BookingSheet(
            car: screenshotCar,
            startDate: startDate,
            endDate: endDate,
            region: "Greater Accra Region",
            city: "Accra",
            address: "Airport Residential",
            blockedDates: blockedDates,
            screenshotStep: step,
            screenshotTripMode: .delivery,
            screenshotProcessing: processing
        )
    }
}

private struct ScreenshotLiveListingsLoadingView: View {
    var body: some View {
        VStack(spacing: 14) {
            ProgressView()
                .tint(HayameTheme.brandBlue)
            Text("Loading live car listings")
                .font(.hayame(size: 16, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(HayameTheme.pageBackground)
    }
}

private struct ScreenshotLiveListingsErrorView: View {
    let message: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.hayame(size: 28, weight: .bold))
                .foregroundStyle(HayameTheme.warning)
            Text("Live listings unavailable")
                .font(.hayame(size: 18, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
            Text(message)
                .font(.hayame(size: 13, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(HayameTheme.pageBackground)
    }
}
#endif

struct RenterHomeScreen: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var locationManager = HomeLocationManager()
    @State private var selectedCategory = "All"
    @State private var homeSearchText = ""
    @State private var showHomeFilters = false
    @State private var showLocationPicker = false
    @State private var resumeTarget: ResumableCheckout?
    // Browse location — deliberately separate from the profile city. A manual
    // choice wins; otherwise the GPS-detected city/region is used.
    @AppStorage("hayame.browse_city") private var browseCity = ""
    @AppStorage("hayame.browse_region") private var browseRegion = ""
    @AppStorage("hayame.detected_browse_city") private var cachedDetectedCity = ""
    @AppStorage("hayame.detected_browse_region") private var cachedDetectedRegion = ""
    @AppStorage("hayame.home_popular_layout_mode") private var popularLayoutRawValue = ExploreLayoutMode.list.rawValue

    private let pagePadding: CGFloat = 16
    private let popularColumnSpacing: CGFloat = 14

    private var popularLayoutMode: ExploreLayoutMode {
        ExploreLayoutMode(rawValue: popularLayoutRawValue) ?? .list
    }

    /// Every listing that fits the selected category pill (All passes everything).
    private var categoryCars: [Car] {
        appState.cars.filter { HomeCategoryFilter.matches(carType: $0.type, category: selectedCategory) }
    }

    private var popularCars: [Car] {
        Array(categoryCars.prefix(6))
    }

    private var popularVehicleRows: [HomePopularVehicleRow] {
        stride(from: 0, to: popularCars.count, by: 2).map { index in
            HomePopularVehicleRow(
                leading: popularCars[index],
                trailing: popularCars.indices.contains(index + 1) ? popularCars[index + 1] : nil
            )
        }
    }

    private var detectedCity: String {
        let live = locationManager.cityName?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !live.isEmpty { return live }
        return cachedDetectedCity.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var detectedRegion: String {
        let live = locationManager.regionName?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !live.isEmpty { return live }
        return cachedDetectedRegion.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var effectiveCity: String {
        let manual = browseCity.trimmingCharacters(in: .whitespacesAndNewlines)
        if !manual.isEmpty { return manual }
        return detectedCity
    }

    private var effectiveRegion: String {
        let manual = browseRegion.trimmingCharacters(in: .whitespacesAndNewlines)
        if !manual.isEmpty { return manual }
        return detectedRegion
    }

    private var nearYouTitle: String {
        if !effectiveCity.isEmpty { return "Near \(MockDataService.cityDisplayName(effectiveCity))" }
        if !effectiveRegion.isEmpty { return "Near \(effectiveRegion)" }
        return "Near you"
    }

    private var isWaitingForInitialBrowseLocation: Bool {
        browseCity.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
            browseRegion.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
            cachedDetectedCity.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
            cachedDetectedRegion.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
            // Hold the skeleton until the FIRST location attempt finishes (success
            // or failure). Gating on isResolvingLocation alone left a gap before
            // the request kicks off, flashing the generic first-5 "near you" cars.
            !locationManager.didResolveLocation
    }

    private var availableCategories: [String] {
        let defaultTypes = ["SUV", "Sedan", "Electric", "Luxury", "Pickup", "Van", "Compact", "Convertible", "Minivan", "Crossover"]
        let types = appState.cars
            .map { $0.type.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        let unique = Array(Set(defaultTypes + types)).sorted()
        // Most populated body type first; ties stay alphabetical, empty ones trail.
        var counts: [String: Int] = [:]
        for category in unique {
            counts[category] = appState.cars.filter { HomeCategoryFilter.matches(carType: $0.type, category: category) }.count
        }
        let ranked = unique.sorted { lhs, rhs in
            let left = counts[lhs] ?? 0
            let right = counts[rhs] ?? 0
            return left != right ? left > right : lhs < rhs
        }
        return ["All"] + ranked
    }

    private var nearYouCars: [Car] {
        let city = effectiveCity.lowercased()
        let region = effectiveRegion.lowercased()
        let coord = locationManager.coordinate
        if city.isEmpty && region.isEmpty && coord == nil {
            return Array(categoryCars.prefix(5))
        }

        // Listings carry no coordinates from the API today, so proximity is
        // city-match first, region-match second; real distance acts as a
        // tiebreaker that activates automatically if coordinates ever appear.
        let userLocation = coord.map { CLLocation(latitude: $0.latitude, longitude: $0.longitude) }
        func locationRank(_ car: Car) -> Int {
            if !city.isEmpty,
               MockDataService.cityMatches(car.city, selected: effectiveCity) {
                return 0
            }
            if !region.isEmpty,
               car.region.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() == region {
                return 1
            }
            return 2
        }
        func distance(_ car: Car) -> Double {
            guard let userLocation, let lat = car.latitude, let lng = car.longitude else {
                return 999_000
            }
            return userLocation.distance(from: CLLocation(latitude: lat, longitude: lng))
        }
        return categoryCars
            .sorted { (locationRank($0), distance($0)) < (locationRank($1), distance($1)) }
            .prefix(5)
            .map { $0 }
    }

    var body: some View {
        GeometryReader { geometry in
            let popularCardWidth = max(
                0,
                (geometry.size.width - (pagePadding * 2) - popularColumnSpacing) / 2
            )

        ZStack(alignment: .topLeading) {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 16) {
                HomeTopHeader(
                    user: appState.currentUser,
                    unreadCount: appState.unreadMessagesCount,
                    isAuthenticated: appState.isAuthenticated,
                    detectedCityName: detectedCity.isEmpty
                        ? detectedRegion
                        : MockDataService.cityDisplayName(detectedCity),
                    browseLocationText: browseCity.isEmpty
                        ? browseRegion
                        : MockDataService.cityDisplayName(browseCity),
                    onProfileTap: {
                        if appState.isAuthenticated {
                            appState.renterTab = .more
                        } else {
                            appState.returnToAuth()
                        }
                    },
                    onLocationTap: {
                        withAnimation(.spring(response: 0.26, dampingFraction: 0.88)) {
                            showLocationPicker.toggle()
                        }
                    },
                    onChatTap: {
                        appState.renterTab = .inbox
                    }
                )

                HStack(spacing: 4) {
                    TextField("Car, city, or host...", text: $homeSearchText)
                        .font(.hayame(size: 15))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .submitLabel(.search)
                        .onSubmit { applyHomeSearchToExplore() }
                        .frame(maxWidth: .infinity)

                    if !homeSearchText.isEmpty {
                        Button {
                            homeSearchText = ""
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .font(.hayame(size: 15, weight: .semibold))
                                .foregroundStyle(HayameTheme.mutedText)
                                .frame(width: 30, height: 36)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Clear search")
                    }

                    Button {
                        showHomeFilters = true
                    } label: {
                        Image(systemName: "slider.horizontal.3")
                            .font(.hayame(size: 17, weight: .semibold))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .frame(width: 36, height: 36)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Filters")
                    .coachMark("home.filters")

                    Button {
                        applyHomeSearchToExplore()
                    } label: {
                        Image(systemName: "magnifyingglass")
                            .font(.hayame(size: 16, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(width: 40, height: 40)
                            .background(HayameTheme.brandBlue, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .buttonStyle(HayamePressableStyle(scale: 0.92))
                    .accessibilityLabel("Search")
                }
                .padding(.leading, 16)
                .padding(.trailing, 6)
                .padding(.vertical, 6)
                .background(HayameTheme.fieldBackground)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(HayameTheme.cardStroke, lineWidth: 1)
                )
                .coachMark("home.search")

                HomeCategoryPills(selected: $selectedCategory, categories: availableCategories)
                    .coachMark("home.categories")
                    .coachTour(.home)

                if let resumable = appState.resumableCheckout {
                    ResumeCheckoutCard(resumable: resumable) {
                        resumeTarget = resumable
                    }
                    .id(resumable.id)
                    .transition(.move(edge: .top).combined(with: .opacity))
                }

                if case .loading = appState.publicCarsLoadState {
                    HomeNearYouPlaceholderSection()
                    HomePopularPicksPlaceholderSection()
                } else {
                    if isWaitingForInitialBrowseLocation {
                        HomeNearYouPlaceholderSection()
                    } else if !nearYouCars.isEmpty {
                        HomeNearYouSection(
                            cars: nearYouCars,
                            title: nearYouTitle,
                            favoriteIDs: appState.favoriteCarIDs,
                            onOpen: { car in
                                appState.renterTab = .explore
                            },
                            onToggleFavorite: { carID in
                                appState.toggleFavorite(carID: carID)
                            },
                            onSeeAll: {
                                appState.renterTab = .explore
                            }
                        )
                    }

                    HStack {
                        SectionHeader(title: "Popular picks")
                        Spacer()
                        ExploreLayoutToggle(selectedLayout: popularLayoutMode) { layout in
                            popularLayoutRawValue = layout.rawValue
                        }
                        Button("See all") {
                            appState.renterTab = .explore
                        }
                        .font(.hayame(size: 13, weight: .medium))
                        .foregroundStyle(HayameTheme.brandBlue)
                    }

                    if case .error(let message) = appState.publicCarsLoadState, appState.cars.isEmpty {
                        ErrorStateCard(
                            title: "Listings unavailable",
                            message: message,
                            actionTitle: "Refresh"
                        ) {
                            appState.retryCars()
                        }
                    } else if appState.cars.isEmpty {
                        EmptyStateView(
                            title: "No listings yet",
                            message: "No listings are available right now.",
                            systemImage: "car.rear.and.tire.marks"
                        )
                    } else if categoryCars.isEmpty {
                        VStack(spacing: 12) {
                            CarTypeIcon(type: selectedCategory)
                                .frame(width: 44, height: 34)
                                .foregroundStyle(HayameTheme.brandBlue)
                            Text("No \(selectedCategory.lowercased()) listings yet")
                                .font(.hayame(size: 16, weight: .bold))
                                .foregroundStyle(HayameTheme.brandNavy)
                            Text("Try another type, or browse everything that's available right now.")
                                .font(.hayame(size: 13, weight: .medium))
                                .foregroundStyle(HayameTheme.mutedText)
                                .multilineTextAlignment(.center)
                            Button("Show all cars") {
                                withAnimation(HayameMotion.snappy) { selectedCategory = "All" }
                            }
                            .font(.hayame(size: 14, weight: .bold))
                            .foregroundStyle(HayameTheme.brandBlue)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(22)
                        .hayameCard()
                        .transition(.opacity.combined(with: .scale(scale: 0.98)))
                    } else {
                        if popularLayoutMode == .grid {
                            LazyVStack(spacing: popularColumnSpacing) {
                                ForEach(popularVehicleRows) { row in
                                    HStack(alignment: .top, spacing: popularColumnSpacing) {
                                        homePopularGridCard(row.leading)
                                            .frame(width: popularCardWidth, alignment: .topLeading)

                                        if let trailing = row.trailing {
                                            homePopularGridCard(trailing)
                                                .frame(width: popularCardWidth, alignment: .topLeading)
                                        } else {
                                            Color.clear
                                                .frame(width: popularCardWidth)
                                                .accessibilityHidden(true)
                                        }
                                    }
                                }
                            }
                        } else {
                            LazyVStack(spacing: 12) {
                                ForEach(popularCars) { car in
                                    ZStack(alignment: .topTrailing) {
                                        NavigationLink {
                                            CarDetailScreen(car: car)
                                        } label: {
                                            ListingCard(
                                                car: car,
                                                isFavorite: appState.favoriteCarIDs.contains(car.id),
                                                layout: .row,
                                                showsFavoriteButton: false
                                            )
                                        }
                                        .buttonStyle(HayamePressableStyle(scale: 0.98))

                                        ListingHeartButton(isFavorite: appState.favoriteCarIDs.contains(car.id), onDark: false) {
                                            appState.toggleFavorite(carID: car.id)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                Button {
                    appState.renterTab = .explore
                } label: {
                    Text("Explore More")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(SolidPillButtonStyle())

                if let message = appState.syncErrorMessage, !message.isEmpty {
                    Text(message)
                        .font(.hayame(size: 12, weight: .semibold))
                        .foregroundStyle(HayameTheme.danger)
                }
            }
            .padding(16)
            .animation(HayameMotion.settle, value: appState.resumableCheckout)
            .animation(HayameMotion.settle, value: selectedCategory)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .resumeCheckoutPresenter(target: $resumeTarget)
        .task(id: appState.isAuthenticated) {
            await appState.refreshPendingCheckout()
        }
        .background(HayameTheme.pageBackground)
        .toolbar(.hidden, for: .navigationBar)
        if showLocationPicker {
            Color.black.opacity(0.001)
                .ignoresSafeArea()
                .onTapGesture {
                    withAnimation(.easeOut(duration: 0.18)) {
                        showLocationPicker = false
                    }
                }
                .zIndex(8)

            HomeLocationPickerDropdown(
                selectedCity: browseCity,
                selectedRegion: browseRegion,
                detectedCity: detectedCity.isEmpty
                    ? detectedRegion
                    : MockDataService.cityDisplayName(detectedCity),
                onUseCurrentLocation: {
                    browseCity = ""
                    browseRegion = ""
                    locationManager.requestIfNeeded()
                    withAnimation(.easeOut(duration: 0.18)) {
                        showLocationPicker = false
                    }
                },
                onSelect: { city, region in
                    browseCity = city
                    browseRegion = region
                    withAnimation(.easeOut(duration: 0.18)) {
                        showLocationPicker = false
                    }
                },
                onDismiss: {
                    withAnimation(.easeOut(duration: 0.18)) {
                        showLocationPicker = false
                    }
                }
            )
            .padding(.top, 64)
            .padding(.horizontal, 16)
            .transition(.move(edge: .top).combined(with: .opacity))
            .zIndex(9)
        }
        }
        }
        .sheet(isPresented: $showHomeFilters) {
            NavigationStack {
                ExploreFilterSheet()
                    .environmentObject(appState)
            }
        }
        .onAppear {
            #if DEBUG
            if AppState.isScreenshotMode { return }
            #endif
            locationManager.requestIfNeeded()
        }
        .onChange(of: availableCategories) { _, newCats in
            if !newCats.contains(selectedCategory) {
                selectedCategory = "All"
            }
        }
        .refreshable {
            await appState.refreshAllRemoteData()
        }
        .onChange(of: locationManager.didResolveLocation) { _, didResolve in
            guard didResolve else { return }
            syncDetectedBrowseCache()
        }
    }

    private func homePopularGridCard(_ car: Car) -> some View {
        ZStack(alignment: .topTrailing) {
            NavigationLink {
                CarDetailScreen(car: car)
            } label: {
                ListingCard(
                    car: car,
                    isFavorite: appState.favoriteCarIDs.contains(car.id),
                    layout: .tile(imageHeight: 136),
                    showsFavoriteButton: false
                )
            }
            .buttonStyle(HayamePressableStyle(scale: 0.97))

            ListingHeartButton(isFavorite: appState.favoriteCarIDs.contains(car.id)) {
                appState.toggleFavorite(carID: car.id)
            }
            .padding(8)
        }
    }

    private func applyHomeSearchToExplore() {
        let trimmedSearch = homeSearchText.trimmingCharacters(in: .whitespacesAndNewlines)
        appState.exploreSearchText = trimmedSearch
        appState.exploreFilters.carType = selectedCategory == "All" ? "" : selectedCategory
        UIApplication.shared.sendAction(
            #selector(UIResponder.resignFirstResponder),
            to: nil,
            from: nil,
            for: nil
        )
        appState.renterTab = .explore
    }

    private func syncDetectedBrowseCache() {
        let city = locationManager.cityName?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let region = locationManager.regionName?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if city.isEmpty && region.isEmpty {
            cachedDetectedCity = ""
            cachedDetectedRegion = ""
        } else {
            cachedDetectedCity = city
            cachedDetectedRegion = region
        }
    }
}

private struct HomePopularVehicleRow: Identifiable {
    let leading: Car
    let trailing: Car?

    var id: String { leading.id }
}

private struct HomeTopHeader: View {
    let user: UserProfile
    let unreadCount: Int
    let isAuthenticated: Bool
    let detectedCityName: String?
    let browseLocationText: String
    let onProfileTap: () -> Void
    let onLocationTap: () -> Void
    let onChatTap: () -> Void

    private var displayName: String {
        let trimmed = user.fullName.trimmingCharacters(in: .whitespacesAndNewlines)
        if !isAuthenticated { return "Sign in or sign up" }
        return trimmed.isEmpty ? "Guest User" : trimmed
    }

    private var locationText: String {
        // Browse location first (manual choice, then GPS), profile last —
        // the header reflects where the user is browsing, not their profile.
        let manual = browseLocationText.trimmingCharacters(in: .whitespacesAndNewlines)
        if !manual.isEmpty { return manual }
        let detected = detectedCityName?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !detected.isEmpty { return detected }
        let city = user.city.trimmingCharacters(in: .whitespacesAndNewlines)
        if !city.isEmpty { return city }
        let region = user.region.trimmingCharacters(in: .whitespacesAndNewlines)
        if !region.isEmpty { return region }
        return "Ghana"
    }

    private var initials: String {
        displayName
            .split(separator: " ")
            .prefix(2)
            .compactMap { $0.first.map(String.init) }
            .joined()
            .uppercased()
    }

    var body: some View {
        HStack(spacing: 12) {
            HStack(spacing: 10) {
                Button(action: onProfileTap) {
                    avatarView
                }
                .buttonStyle(.plain)

                VStack(alignment: .leading, spacing: 2) {
                    Button(action: onProfileTap) {
                        Text(displayName)
                            .font(.hayame(size: 16, weight: .bold))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .lineLimit(1)
                    }
                    .buttonStyle(.plain)

                    Button(action: onLocationTap) {
                        HStack(spacing: 4) {
                            Image(systemName: "mappin.circle.fill")
                                .font(.hayame(size: 11))
                                .foregroundStyle(HayameTheme.mutedText)
                            Text(locationText)
                                .font(.hayame(size: 13, weight: .medium))
                                .foregroundStyle(HayameTheme.mutedText)
                            Image(systemName: "chevron.down")
                                .font(.hayame(size: 10, weight: .bold))
                                .foregroundStyle(HayameTheme.brandBlue)
                        }
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Change browse location, currently \(locationText)")
                    .coachMark("home.location")
                }
            }

            Spacer()

            Button(action: onChatTap) {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: "message.fill")
                        .font(.hayame(size: 17, weight: .semibold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .frame(width: 42, height: 42)
                        .background(HayameTheme.cardBackground)
                        .clipShape(Circle())
                        .overlay(Circle().stroke(HayameTheme.cardStroke, lineWidth: 1))

                    if unreadCount > 0 {
                        Circle()
                            .fill(HayameTheme.brandBlue)
                            .frame(width: 10, height: 10)
                            .offset(x: -2, y: 2)
                    }
                }
            }
            .buttonStyle(.plain)
            .accessibilityLabel(unreadCount > 0 ? "Messages, unread available" : "Messages")
        }
    }

    @ViewBuilder
    private var avatarView: some View {
        if let url = RemoteImageURLResolver.resolve(user.avatar) {
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
                Text(initials.isEmpty ? "U" : initials)
                    .font(.hayame(size: 12, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
            )
    }
}

private struct SearchChip: View {
    let title: String
    let icon: String

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
            Text(title)
        }
        .font(.hayame(size: 12, weight: .semibold))
        .foregroundStyle(HayameTheme.brandNavy)
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(HayameTheme.chipBackground)
        .clipShape(Capsule())
        .overlay(Capsule().stroke(HayameTheme.controlStroke, lineWidth: 1))
    }
}

private struct HomeCategoryPills: View {
    @Binding var selected: String
    let categories: [String]

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(categories, id: \.self) { cat in
                    let isSelected = selected == cat
                    Button {
                        guard !isSelected else { return }
                        HayameHaptics.select()
                        withAnimation(HayameMotion.snappy) { selected = cat }
                    } label: {
                        HStack(spacing: 7) {
                            CarTypeIcon(type: cat)
                                .frame(width: 20, height: 15)
                            Text(cat)
                                .font(.hayame(size: 13, weight: isSelected ? .bold : .semibold))
                        }
                        .foregroundStyle(isSelected ? .white : HayameTheme.brandNavy)
                        .padding(.horizontal, 13)
                        .padding(.vertical, 8)
                        .background(isSelected ? HayameTheme.brandBlue : HayameTheme.chipBackground, in: Capsule())
                        .overlay(Capsule().stroke(HayameTheme.controlStroke, lineWidth: isSelected ? 0 : 1))
                    }
                    .buttonStyle(HayamePressableStyle(scale: 0.95, haptic: false))
                }
            }
            .padding(.horizontal, 1)
            .padding(.vertical, 1)
        }
    }
}

private struct LocationPickerRow: Identifiable, Hashable {
    enum Kind: Hashable {
        case header
        case allOfRegion
        case city(String)
    }

    let id: String
    let region: String
    let kind: Kind
}

private struct HomeLocationPickerDropdown: View {
    let selectedCity: String
    let selectedRegion: String
    let detectedCity: String?
    let onUseCurrentLocation: () -> Void
    let onSelect: (String, String) -> Void
    let onDismiss: () -> Void
    @State private var query = ""
    @State private var frozenCitiesByRegion = MockDataService.citiesByRegion

    private var regionsWithCities: [(region: String, cities: [String])] {
        let byRegion = frozenCitiesByRegion
        let ordered = byRegion.keys.sorted { $0.caseInsensitiveCompare($1) == .orderedAscending }
        let trimmedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)
        return ordered.compactMap { region in
            let cities = (byRegion[region] ?? []).sorted {
                $0.caseInsensitiveCompare($1) == .orderedAscending
            }
            guard !trimmedQuery.isEmpty else { return (region, cities) }
            if region.localizedCaseInsensitiveContains(trimmedQuery) {
                return (region, cities)
            }
            let matches = cities.filter {
                MockDataService.citySearchText($0).localizedCaseInsensitiveContains(trimmedQuery)
            }
            return matches.isEmpty ? nil : (region, matches)
        }
    }

    // Flattened so every header/row is its own LazyVStack child. Nesting a
    // full (non-lazy) ForEach per region inside the outer LazyVStack forced
    // SwiftUI to lay out an entire region's rows (up to ~47 for Ashanti) in
    // one burst as it scrolled into view — the resulting frame drop plus the
    // subsequent content-height correction visibly snapped the scroll
    // position back toward the top.
    private var flattenedRows: [LocationPickerRow] {
        regionsWithCities.flatMap { entry -> [LocationPickerRow] in
            var rows: [LocationPickerRow] = [
                LocationPickerRow(id: "header|\(entry.region)", region: entry.region, kind: .header),
                LocationPickerRow(id: "all|\(entry.region)", region: entry.region, kind: .allOfRegion),
            ]
            rows.append(contentsOf: entry.cities.map { city in
                LocationPickerRow(id: "city|\(entry.region)|\(city)", region: entry.region, kind: .city(city))
            })
            return rows
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Browse location")
                        .font(.hayame(size: 16, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text("Changes nearby cars only, not your profile.")
                        .font(.hayame(size: 12, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                }

                Spacer()

                Button(action: onDismiss) {
                    Image(systemName: "xmark")
                        .font(.hayame(size: 12, weight: .bold))
                        .foregroundStyle(HayameTheme.mutedText)
                        .frame(width: 30, height: 30)
                        .background(HayameTheme.subtleFill)
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
            }

            Button(action: onUseCurrentLocation) {
                HStack(spacing: 10) {
                    Image(systemName: "location.fill")
                        .font(.hayame(size: 14, weight: .semibold))
                        .foregroundStyle(HayameTheme.brandBlue)
                        .frame(width: 30, height: 30)
                        .background(HayameTheme.brandLight)
                        .clipShape(Circle())
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Use my current location")
                            .font(.hayame(size: 14, weight: .semibold))
                            .foregroundStyle(HayameTheme.brandNavy)
                        Text(detectedCity?.isEmpty == false ? "Detected: \(detectedCity!)" : "Uses a Ghana location when available")
                            .font(.hayame(size: 12, weight: .medium))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.hayame(size: 11, weight: .bold))
                    .foregroundStyle(HayameTheme.mutedText)
            }
            .buttonStyle(.plain)
            .padding(10)
            .background(HayameTheme.fieldBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(HayameTheme.controlStroke, lineWidth: 1)
            )

            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .font(.hayame(size: 13, weight: .semibold))
                    .foregroundStyle(HayameTheme.mutedText)
                TextField("Search city or region", text: $query)
                    .font(.hayame(size: 14, weight: .medium))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .textInputAutocapitalization(.words)
                    .autocorrectionDisabled()
                if !query.isEmpty {
                    Button {
                        query = ""
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.hayame(size: 14, weight: .semibold))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(HayameTheme.fieldBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(HayameTheme.controlStroke, lineWidth: 1)
            )

            ScrollView(showsIndicators: true) {
                LazyVStack(alignment: .leading, spacing: 8) {
                    if flattenedRows.isEmpty {
                        Text("No matching locations.")
                            .font(.hayame(size: 13, weight: .medium))
                            .foregroundStyle(HayameTheme.mutedText)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.vertical, 12)
                    }

                    ForEach(flattenedRows) { row in
                        switch row.kind {
                        case .header:
                            Text(row.region)
                                .font(.hayame(size: 12, weight: .bold))
                                .foregroundStyle(HayameTheme.mutedText)
                                .textCase(.uppercase)
                                .padding(.top, 4)

                        case .allOfRegion:
                            locationRow(
                                title: "All of \(row.region)",
                                subtitle: "Show vehicles across this region",
                                isSelected: selectedCity.isEmpty &&
                                    selectedRegion.caseInsensitiveCompare(row.region) == .orderedSame
                            ) {
                                onSelect("", row.region)
                            }

                        case .city(let city):
                            locationRow(
                                title: MockDataService.cityDisplayName(city),
                                subtitle: row.region,
                                isSelected: selectedCity.caseInsensitiveCompare(city) == .orderedSame
                            ) {
                                onSelect(city, row.region)
                            }
                        }
                    }
                }
            }
            .frame(maxHeight: 360)
        }
        .padding(14)
        .frame(maxWidth: 390, alignment: .leading)
        .background(HayameTheme.elevatedBackground)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(HayameTheme.controlStroke, lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.22), radius: 20, x: 0, y: 10)
    }

    private func locationRow(
        title: String,
        subtitle: String,
        isSelected: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 10) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.hayame(size: 14, weight: .semibold))
                        .foregroundStyle(isSelected ? HayameTheme.brandBlue : HayameTheme.brandNavy)
                        .lineLimit(2)
                    Text(subtitle)
                        .font(.hayame(size: 11, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                        .lineLimit(1)
                }
                Spacer()
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.hayame(size: 16, weight: .semibold))
                        .foregroundStyle(HayameTheme.brandBlue)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 9)
            .background(isSelected ? HayameTheme.brandLight : HayameTheme.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(isSelected ? HayameTheme.brandBlue.opacity(0.28) : HayameTheme.cardStroke, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

private struct HomeNearYouSection: View {
    let cars: [Car]
    var title: String = "Near you"
    let favoriteIDs: Set<String>
    let onOpen: (Car) -> Void
    let onToggleFavorite: (String) -> Void
    let onSeeAll: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(title)
                    .font(.hayame(size: 18, weight: .semibold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Spacer()
                Button("See all", action: onSeeAll)
                    .font(.hayame(size: 13, weight: .medium))
                    .foregroundStyle(HayameTheme.brandBlue)
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 14) {
                    ForEach(cars.prefix(5), id: \.id) { car in
                        ZStack(alignment: .topTrailing) {
                            NavigationLink {
                                CarDetailScreen(car: car)
                            } label: {
                                ListingCard(
                                    car: car,
                                    isFavorite: favoriteIDs.contains(car.id),
                                    layout: .tile(width: 236, imageHeight: 150),
                                    showsFavoriteButton: false
                                )
                            }
                            .buttonStyle(HayamePressableStyle(scale: 0.97))

                            ListingHeartButton(isFavorite: favoriteIDs.contains(car.id)) {
                                onToggleFavorite(car.id)
                            }
                            .padding(8)
                        }
                    }
                }
            }
        }
    }
}

private struct FavoriteBadgeButton: View {
    let isFavorite: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: isFavorite ? "heart.fill" : "heart")
                .font(.hayame(size: 14, weight: .bold))
                .foregroundStyle(isFavorite ? Color.red : HayameTheme.brandNavy)
                .padding(8)
                .background(HayameTheme.floatingControlBackground)
                .clipShape(Circle())
                .overlay(Circle().stroke(HayameTheme.controlStroke, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}

private struct HomeQuickFiltersCard: View {
    @EnvironmentObject private var appState: AppState

    private var cityOptions: [String] {
        if appState.exploreFilters.region.isEmpty {
            return MockDataService.regions.flatMap { MockDataService.cities(for: $0) }
        }
        return MockDataService.cities(for: appState.exploreFilters.region, preferred: appState.exploreFilters.city)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Search with filters")
                .font(.hayame(size: 14, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)

            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(HayameTheme.mutedText)
                TextField("Car, city, host", text: $appState.exploreSearchText)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            }
            .padding(10)
            .background(HayameTheme.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(HayameTheme.cardStroke, lineWidth: 1))

            HStack(spacing: 8) {
                Menu {
                    Button("Any region") {
                        appState.exploreFilters.region = ""
                        appState.exploreFilters.city = ""
                    }
                    ForEach(MockDataService.regions, id: \.self) { region in
                        Button(region) {
                            appState.exploreFilters.region = region
                            let options = MockDataService.cities(for: region, preferred: appState.exploreFilters.city)
                            if !options.contains(where: { $0.caseInsensitiveCompare(appState.exploreFilters.city) == .orderedSame }) {
                                appState.exploreFilters.city = ""
                            }
                        }
                    }
                } label: {
                    filterPill(title: appState.exploreFilters.region.isEmpty ? "Any region" : appState.exploreFilters.region)
                }

                Menu {
                    Button("Any city") { appState.exploreFilters.city = "" }
                    ForEach(cityOptions, id: \.self) { city in
                        Button {
                            appState.exploreFilters.city = city
                        } label: {
                            Text(MockDataService.cityDisplayName(city))
                        }
                    }
                } label: {
                    filterPill(
                        title: appState.exploreFilters.city.isEmpty
                            ? "Any city"
                            : MockDataService.cityDisplayName(appState.exploreFilters.city)
                    )
                }

                Menu {
                    Button("Any type") { appState.exploreFilters.carType = "" }
                    ForEach(MockDataService.carTypes, id: \.self) { type in
                        Button(type) { appState.exploreFilters.carType = type }
                    }
                } label: {
                    filterPill(title: appState.exploreFilters.carType.isEmpty ? "Any type" : appState.exploreFilters.carType)
                }
            }

            HStack(spacing: 10) {
                Text("Max GHS \(appState.exploreFilters.maxPrice)")
                    .font(.hayame(size: 12, weight: .semibold))
                    .foregroundStyle(HayameTheme.mutedText)
                Slider(
                    value: Binding(
                        get: { Double(appState.exploreFilters.maxPrice) },
                        set: { appState.exploreFilters.maxPrice = max(100, Int($0.rounded())) }
                    ),
                    in: 100...8000,
                    step: 50
                )
                .tint(HayameTheme.brandBlue)
            }

            Button("Apply filters and search") {
                appState.renterTab = .explore
            }
            .buttonStyle(PrimaryPillButtonStyle())
        }
        .padding(12)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(HayameTheme.cardStroke, lineWidth: 1)
        )
    }

    private func filterPill(title: String) -> some View {
        HStack(spacing: 6) {
            Text(title)
                .lineLimit(1)
            Image(systemName: "chevron.down")
                .font(.hayame(size: 9, weight: .bold))
        }
        .font(.hayame(size: 11, weight: .semibold))
        .foregroundStyle(HayameTheme.brandNavy)
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity)
        .background(HayameTheme.brandLight)
        .clipShape(Capsule())
    }
}

struct ExploreScreen: View {
    @EnvironmentObject private var appState: AppState
    @State private var showFilters = false
    @FocusState private var isSearchFieldFocused: Bool

    private let pagePadding: CGFloat = 16
    private let columnSpacing: CGFloat = 14
    private let popularVehicleBrands = ["Toyota", "Honda", "Kia", "Hyundai", "Range Rover", "Mercedes-Benz", "BMW", "Nissan", "Ford", "Mitsubishi"]

    private var vehicleRows: [ExploreVehicleRow] {
        let cars = appState.filteredCars
        return stride(from: 0, to: cars.count, by: 2).map { index in
            ExploreVehicleRow(
                leading: cars[index],
                trailing: cars.indices.contains(index + 1) ? cars[index + 1] : nil
            )
        }
    }

    private var vehicleBrandOptions: [String] {
        let liveBrands = appState.cars
            .map { MockDataService.normalizedMake($0.brand) }
            .filter { !$0.isEmpty }
        let ordered = popularVehicleBrands + liveBrands + MockDataService.carMakes
        var seen = Set<String>()
        return ordered.filter { brand in
            let key = brand.lowercased()
            guard !seen.contains(key) else { return false }
            seen.insert(key)
            return true
        }
    }

    var body: some View {
        GeometryReader { geometry in
            let cardWidth = max(0, (geometry.size.width - (pagePadding * 2) - columnSpacing) / 2)

            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: columnSpacing) {
                PageTitle("Explore")
                    .coachTour(.explore)

                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .foregroundStyle(HayameTheme.mutedText)
                    TextField("Search cars, cities, hosts", text: $appState.exploreSearchText)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .submitLabel(.search)
                        .focused($isSearchFieldFocused)

                    if !appState.exploreSearchText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        Button {
                            appState.exploreSearchText = ""
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .font(.hayame(size: 14, weight: .bold))
                                .foregroundStyle(HayameTheme.mutedText)
                        }
                        .buttonStyle(.plain)
                    }

                    Menu {
                        ForEach(ExploreSortOption.allCases) { option in
                            Button(option.rawValue) {
                                appState.exploreSortOption = option
                            }
                        }
                    } label: {
                        Text("Sort")
                            .font(.hayame(size: 12, weight: .bold))
                            .foregroundStyle(HayameTheme.brandBlue)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 6)
                            .background(HayameTheme.brandLight)
                            .clipShape(Capsule())
                    }

                    ExploreLayoutToggle(selectedLayout: appState.exploreLayoutMode) { layout in
                        appState.setExploreLayoutMode(layout)
                    }
                    .coachMark("explore.layout")

                    Button {
                        showFilters = true
                    } label: {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                            .font(.hayame(size: 18, weight: .semibold))
                            .foregroundStyle(HayameTheme.brandBlue)
                    }
                    .coachMark("explore.filters")
                }
                .padding(12)
                .background(HayameTheme.cardBackground)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(HayameTheme.cardStroke, lineWidth: 1))
                .contentShape(Rectangle())
                .onTapGesture {
                    isSearchFieldFocused = true
                }
                .zIndex(1)

                VehicleBrandCarousel(
                    brands: vehicleBrandOptions,
                    selectedBrand: appState.exploreFilters.brand
                ) { brand in
                    appState.exploreFilters.brand = brand
                }

                if case .loading = appState.publicCarsLoadState {
                    if appState.exploreLayoutMode == .grid {
                        LazyVStack(spacing: columnSpacing) {
                            ForEach(0..<3, id: \.self) { _ in
                                HStack(alignment: .top, spacing: columnSpacing) {
                                    ListingGridPlaceholderCard()
                                        .frame(width: cardWidth, alignment: .topLeading)
                                    ListingGridPlaceholderCard()
                                        .frame(width: cardWidth, alignment: .topLeading)
                                }
                            }
                        }
                    } else {
                        LazyVStack(spacing: 12) {
                            ForEach(0..<6, id: \.self) { _ in
                                ListingRowPlaceholderCard()
                            }
                        }
                    }
                } else if case .error(let message) = appState.publicCarsLoadState, appState.cars.isEmpty {
                    ErrorStateCard(
                        title: "Listings unavailable",
                        message: message,
                        actionTitle: "Refresh"
                    ) {
                        appState.retryCars()
                    }
                } else {
                    if appState.exploreLayoutMode == .grid {
                        LazyVStack(spacing: columnSpacing) {
                            ForEach(vehicleRows) { row in
                                HStack(alignment: .top, spacing: columnSpacing) {
                                    exploreGridCard(row.leading)
                                        .frame(width: cardWidth, alignment: .topLeading)

                                    if let trailing = row.trailing {
                                        exploreGridCard(trailing)
                                            .frame(width: cardWidth, alignment: .topLeading)
                                    } else {
                                        Color.clear
                                            .frame(width: cardWidth)
                                            .accessibilityHidden(true)
                                    }
                                }
                            }
                        }
                        .allowsHitTesting(!isSearchFieldFocused)
                    } else {
                        LazyVStack(spacing: 12) {
                            ForEach(appState.filteredCars) { car in
                                ZStack(alignment: .topTrailing) {
                                    NavigationLink {
                                        CarDetailScreen(car: car)
                                    } label: {
                                        ListingCard(
                                            car: car,
                                            isFavorite: appState.favoriteCarIDs.contains(car.id),
                                            layout: .row,
                                            showsFavoriteButton: false
                                        )
                                    }
                                    .buttonStyle(HayamePressableStyle(scale: 0.98))

                                    ListingHeartButton(isFavorite: appState.favoriteCarIDs.contains(car.id), onDark: false) {
                                        appState.toggleFavorite(carID: car.id)
                                    }
                                }
                            }
                        }
                        .allowsHitTesting(!isSearchFieldFocused)
                    }

                    if appState.filteredCars.isEmpty {
                        EmptyStateView(
                            title: "No cars found",
                            message: "Try changing city, price range, or filter options.",
                            systemImage: "car.rear.and.tire.marks"
                        )
                    }
                }
                }
                .padding(pagePadding)
            }
            .background(HayameTheme.pageBackground)
            .toolbar(.hidden, for: .navigationBar)
            .scrollDismissesKeyboard(.interactively)
            .refreshable {
                await appState.refreshAllRemoteData()
            }
        }
        .sheet(isPresented: $showFilters) {
            NavigationStack {
                ExploreFilterSheet()
            }
        }
    }

    private func exploreGridCard(_ car: Car) -> some View {
        ZStack(alignment: .topTrailing) {
            NavigationLink {
                CarDetailScreen(car: car)
            } label: {
                ListingCard(
                    car: car,
                    isFavorite: appState.favoriteCarIDs.contains(car.id),
                    layout: .tile(imageHeight: 140),
                    showsFavoriteButton: false
                )
            }
            .buttonStyle(HayamePressableStyle(scale: 0.97))

            ListingHeartButton(isFavorite: appState.favoriteCarIDs.contains(car.id)) {
                appState.toggleFavorite(carID: car.id)
            }
            .padding(8)
        }
    }
}

private struct ExploreVehicleRow: Identifiable {
    let leading: Car
    let trailing: Car?

    var id: String { leading.id }
}

private struct PageTitle: View {
    let title: String

    init(_ title: String) {
        self.title = title
    }

    var body: some View {
        Text(title)
            .font(.hayame(size: 34, weight: .bold))
            .foregroundStyle(HayameTheme.brandNavy)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.top, 2)
    }
}

private struct VehicleBrandCarousel: View {
    let brands: [String]
    let selectedBrand: String
    let onSelect: (String) -> Void

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                VehicleBrandPill(
                    title: "All",
                    isSelected: selectedBrand.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                ) {
                    onSelect("")
                }

                ForEach(brands, id: \.self) { brand in
                    VehicleBrandPill(
                        title: brand,
                        isSelected: selectedBrand.caseInsensitiveCompare(brand) == .orderedSame
                    ) {
                        onSelect(brand)
                    }
                }
            }
            .padding(.vertical, 2)
        }
    }
}

private struct VehicleBrandPill: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                VehicleBrandLogo(title: title, isSelected: isSelected)
                    .frame(width: 54, height: 38)
                Text(title)
                    .font(.hayame(size: 11, weight: .semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.72)
                    .foregroundStyle(isSelected ? HayameTheme.brandBlue : HayameTheme.brandNavy)
                Capsule()
                    .fill(isSelected ? HayameTheme.brandBlue : Color.clear)
                    .frame(width: 22, height: 3)
            }
            .frame(width: 82, height: 74)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

struct VehicleBrandLogo: View {
    let title: String
    let isSelected: Bool

    var body: some View {
        Group {
            if let assetName = vehicleBrandLogoAssetName(title) {
                Image(assetName)
                    .resizable()
                    .scaledToFit()
                    .accessibilityHidden(true)
            } else if title == "All" {
                Image(systemName: "car.fill")
                    .font(.hayame(size: 22, weight: .semibold))
                    .foregroundStyle(isSelected ? HayameTheme.brandBlue : HayameTheme.mutedText)
            } else {
                Text(monogram)
                    .font(.hayame(size: 14, weight: .black))
                    .foregroundStyle(isSelected ? HayameTheme.brandBlue : HayameTheme.mutedText)
            }
        }
    }

    private var monogram: String {
        if title == "All" { return "ALL" }
        return title
            .split(separator: " ")
            .prefix(2)
            .compactMap { $0.first }
            .map(String.init)
            .joined()
            .uppercased()
    }
}

private func vehicleBrandLogoAssetName(_ title: String) -> String? {
    for assetName in vehicleBrandLogoCandidates(for: title) {
        if UIImage(named: assetName) != nil {
            return assetName
        }
    }
    return nil
}

private func vehicleBrandLogoCandidates(for title: String) -> [String] {
    let normalizedTitle = title
        .trimmingCharacters(in: .whitespacesAndNewlines)
        .folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)
        .lowercased()

    let aliases: [String: [String]] = [
        "baic": ["baic_motor"],
        "gac": ["gac_group"],
        "range rover": ["land_rover"],
        "mercedes": ["mercedes_benz"],
        "mercedes benz": ["mercedes_benz"],
        "mercedes-benz": ["mercedes_benz"],
        "mg": ["mg"],
        "mini": ["mini"],
        "ram": ["ram"],
        "rolls royce": ["rolls_royce"],
        "rolls-royce": ["rolls_royce"],
        "samsung": ["renault_samsung"],
        "samsung older badge": ["renault_samsung"],
        "zx auto": ["zx_auto"]
    ]

    let baseSlug = vehicleBrandLogoSlug(normalizedTitle)
    let withoutParentheses = vehicleBrandLogoSlug(
        normalizedTitle.replacingOccurrences(
            of: #"\s*\([^)]*\)"#,
            with: "",
            options: .regularExpression
        )
    )
    let parentheticalMatches = vehicleBrandParentheticalValues(normalizedTitle)
        .map(vehicleBrandLogoSlug)

    let aliasSlugs = aliases[normalizedTitle] ?? aliases[withoutParentheses] ?? []
    var seen = Set<String>()
    return (aliasSlugs + [baseSlug, withoutParentheses] + parentheticalMatches)
        .filter { !$0.isEmpty }
        .filter { seen.insert($0).inserted }
        .map { "car_logo_\($0)" }
}

private func vehicleBrandLogoSlug(_ value: String) -> String {
    value
        .replacingOccurrences(of: "&", with: " and ")
        .replacingOccurrences(of: #"[^a-z0-9]+"#, with: "_", options: .regularExpression)
        .trimmingCharacters(in: CharacterSet(charactersIn: "_"))
}

private func vehicleBrandParentheticalValues(_ value: String) -> [String] {
    var matches: [String] = []
    var searchStart = value.startIndex
    while let open = value[searchStart...].firstIndex(of: "("),
          let close = value[open...].firstIndex(of: ")") {
        let contentStart = value.index(after: open)
        if contentStart < close {
            matches.append(String(value[contentStart..<close]))
        }
        searchStart = value.index(after: close)
    }
    return matches
}

struct ExploreLayoutToggle: View {
    let selectedLayout: ExploreLayoutMode
    let onSelect: (ExploreLayoutMode) -> Void

    var body: some View {
        HStack(spacing: 4) {
            ExploreLayoutToggleButton(
                systemName: "list.bullet.rectangle",
                isSelected: selectedLayout == .list,
                accessibilityLabel: "Default list view"
            ) {
                onSelect(.list)
            }

            ExploreLayoutToggleButton(
                systemName: "rectangle.grid.2x2",
                isSelected: selectedLayout == .grid,
                accessibilityLabel: "2 by 2 grid view"
            ) {
                onSelect(.grid)
            }
        }
        .padding(4)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(HayameTheme.cardStroke, lineWidth: 1)
        )
    }
}

private struct ExploreLayoutToggleButton: View {
    let systemName: String
    let isSelected: Bool
    let accessibilityLabel: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.hayame(size: 14, weight: .semibold))
                .foregroundStyle(isSelected ? HayameTheme.brandBlue : HayameTheme.brandNavy)
                .frame(width: 30, height: 30)
                .background(isSelected ? HayameTheme.brandBlue.opacity(0.14) : Color.clear)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(accessibilityLabel)
    }
}

private struct ExploreFilterSheet: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss
    @State private var draft = ExploreFilterState()
    @State private var frozenCitiesByRegion: [String: [String]] = [:]
    @State private var frozenMakes: [String] = []
    @State private var frozenModelsByMake: [String: [String]] = [:]
    @State private var isInitialized = false

    private var regionOptions: [String] {
        withCurrentOption(
            frozenCitiesByRegion.keys.sorted {
                $0.caseInsensitiveCompare($1) == .orderedAscending
            },
            current: draft.region
        )
    }

    private var cityOptions: [String] {
        withCurrentOption(catalogCities(for: draft.region), current: draft.city)
            .sorted {
                MockDataService.cityDisplayName($0).caseInsensitiveCompare(
                    MockDataService.cityDisplayName($1)
                ) == .orderedAscending
            }
    }

    private var makeOptions: [String] {
        withCurrentOption(frozenMakes, current: draft.brand)
    }

    private var modelOptions: [String] {
        let make = canonicalValue(draft.brand, in: frozenMakes) ?? draft.brand
        return withCurrentOption(frozenModelsByMake[make] ?? [], current: draft.model)
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 18) {
                ExploreFilterSection(title: "Location") {
                    NavigationLink {
                        ExploreFilterOptionList(
                            title: "Region",
                            options: regionOptions,
                            selection: $draft.region
                        )
                    } label: {
                        ExploreFilterNavigationRow(
                            title: "Region",
                            value: draft.region.isEmpty ? "Any" : draft.region
                        )
                    }
                    .buttonStyle(.plain)

                    ExploreFilterDivider()

                    NavigationLink {
                        ExploreFilterOptionList(
                            title: "City",
                            options: cityOptions,
                            selection: $draft.city,
                            displayName: MockDataService.cityDisplayName
                        )
                    } label: {
                        ExploreFilterNavigationRow(
                            title: "City",
                            value: draft.city.isEmpty
                                ? "Any"
                                : MockDataService.cityDisplayName(draft.city)
                        )
                    }
                    .buttonStyle(.plain)
                }

                ExploreFilterSection(title: "Vehicle") {
                    NavigationLink {
                        ExploreFilterOptionList(
                            title: "Make",
                            options: makeOptions,
                            selection: $draft.brand
                        )
                    } label: {
                        ExploreFilterNavigationRow(
                            title: "Make",
                            value: draft.brand.isEmpty ? "Any" : draft.brand
                        )
                    }
                    .buttonStyle(.plain)

                    ExploreFilterDivider()

                    NavigationLink {
                        ExploreFilterOptionList(
                            title: "Model",
                            options: modelOptions,
                            selection: $draft.model
                        )
                    } label: {
                        ExploreFilterNavigationRow(
                            title: "Model",
                            value: draft.model.isEmpty ? "Any" : draft.model
                        )
                    }
                    .buttonStyle(.plain)

                    ExploreFilterDivider()

                    NavigationLink {
                        ExploreFilterOptionList(
                            title: "Type",
                            options: MockDataService.carTypes,
                            selection: $draft.carType
                        )
                    } label: {
                        ExploreFilterNavigationRow(
                            title: "Type",
                            value: draft.carType.isEmpty ? "Any" : draft.carType
                        )
                    }
                    .buttonStyle(.plain)

                    ExploreFilterDivider()

                    NavigationLink {
                        ExploreFilterOptionList(
                            title: "Transmission",
                            options: MockDataService.transmissions,
                            selection: $draft.transmission
                        )
                    } label: {
                        ExploreFilterNavigationRow(
                            title: "Transmission",
                            value: draft.transmission.isEmpty ? "Any" : draft.transmission
                        )
                    }
                    .buttonStyle(.plain)

                    ExploreFilterDivider()

                    NavigationLink {
                        ExploreFilterOptionList(
                            title: "Fuel",
                            options: MockDataService.fuels,
                            selection: $draft.fuelType
                        )
                    } label: {
                        ExploreFilterNavigationRow(
                            title: "Fuel",
                            value: draft.fuelType.isEmpty ? "Any" : draft.fuelType
                        )
                    }
                    .buttonStyle(.plain)
                }

                ExploreFilterSection(title: "Price") {
                    ExploreFilterStepperRow(
                        title: "Minimum price",
                        value: "GHS\(draft.minPrice)",
                        canDecrease: draft.minPrice > 50,
                        onDecrease: { draft.minPrice = max(50, draft.minPrice - 50) },
                        onIncrease: { draft.minPrice = min(5000, draft.minPrice + 50) }
                    )

                    ExploreFilterDivider()

                    ExploreFilterStepperRow(
                        title: "Maximum price",
                        value: "GHS\(draft.maxPrice)",
                        canDecrease: draft.maxPrice > 100,
                        onDecrease: { draft.maxPrice = max(100, draft.maxPrice - 50) },
                        onIncrease: { draft.maxPrice = min(8000, draft.maxPrice + 50) }
                    )
                }

                ExploreFilterSection(title: "Options") {
                    Toggle("Instant Book", isOn: $draft.instantBookOnly)
                        .toggleStyle(HayameSwitchToggleStyle())
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)

                    ExploreFilterDivider()

                    Toggle("Delivery available", isOn: $draft.deliveryOnly)
                        .toggleStyle(HayameSwitchToggleStyle())
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)

                    ExploreFilterDivider()

                    Toggle("Air conditioning", isOn: $draft.acOnly)
                        .toggleStyle(HayameSwitchToggleStyle())
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)
                }
                .font(.hayame(size: 14, weight: .semibold))
                .foregroundStyle(HayameTheme.brandNavy)
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground.ignoresSafeArea())
        .navigationTitle("Filters")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(HayameTheme.pageBackground, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button("Reset") {
                    draft = ExploreFilterState()
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button("Done") {
                    appState.exploreFilters = validatedDraft()
                    dismiss()
                }
                    .bold()
            }
        }
        .onAppear {
            initializeIfNeeded()
        }
        .onChange(of: draft.region) { _, newValue in
            guard isInitialized else { return }
            guard !newValue.isEmpty else { return }
            let normalized = MockDataService.normalizedRegion(newValue)
            if normalized != draft.region {
                draft.region = normalized
                return
            }
            let cities = catalogCities(for: normalized)
            if let canonical = canonicalValue(draft.city, in: cities) ??
                MockDataService.canonicalCity(draft.city, region: normalized) {
                draft.city = canonical
            } else if !draft.city.isEmpty {
                draft.city = ""
            }
        }
        .onChange(of: draft.brand) { _, newValue in
            guard isInitialized else { return }
            let normalized = canonicalValue(newValue, in: frozenMakes) ?? newValue
            if normalized != draft.brand {
                draft.brand = normalized
                return
            }
            let models = frozenModelsByMake[normalized] ?? []
            if canonicalValue(draft.model, in: models) == nil, !draft.model.isEmpty {
                draft.model = ""
            }
        }
    }

    private func initializeIfNeeded() {
        guard !isInitialized else { return }
        frozenCitiesByRegion = MockDataService.citiesByRegion
        frozenMakes = MockDataService.carMakes
        frozenModelsByMake = MockDataService.carModelsByMake
        draft = appState.exploreFilters
        isInitialized = true
        draft = validatedDraft()
    }

    private func catalogCities(for region: String) -> [String] {
        let trimmed = region.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            return caseInsensitiveUnique(frozenCitiesByRegion.values.flatMap { $0 })
        }
        let normalized = MockDataService.normalizedRegion(trimmed)
        let matchingKey = frozenCitiesByRegion.keys.first {
            $0.caseInsensitiveCompare(normalized) == .orderedSame
        }
        return caseInsensitiveUnique(matchingKey.flatMap { frozenCitiesByRegion[$0] } ?? [])
    }

    private func validatedDraft() -> ExploreFilterState {
        var result = draft
        if !result.region.isEmpty {
            result.region = MockDataService.normalizedRegion(result.region)
        }

        let cities = catalogCities(for: result.region)
        if !result.city.isEmpty {
            result.city = canonicalValue(result.city, in: cities) ??
                MockDataService.canonicalCity(result.city, region: result.region) ?? ""
        }

        if !result.brand.isEmpty {
            result.brand = canonicalValue(result.brand, in: frozenMakes) ?? result.brand
        }
        let models = frozenModelsByMake[result.brand] ?? []
        if !result.model.isEmpty {
            result.model = canonicalValue(result.model, in: models) ?? ""
        }
        result.minPrice = min(result.minPrice, result.maxPrice)
        result.maxPrice = max(result.maxPrice, result.minPrice)
        return result
    }

    private func withCurrentOption(_ values: [String], current: String) -> [String] {
        var result = caseInsensitiveUnique(values)
        let trimmed = current.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmed.isEmpty, canonicalValue(trimmed, in: result) == nil {
            result.insert(trimmed, at: 0)
        }
        return result
    }

    private func canonicalValue(_ value: String, in options: [String]) -> String? {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        return options.first { $0.caseInsensitiveCompare(trimmed) == .orderedSame }
    }

    private func caseInsensitiveUnique(_ values: [String]) -> [String] {
        var seen = Set<String>()
        return values.filter { value in
            let key = value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            return !key.isEmpty && seen.insert(key).inserted
        }
    }
}

private struct ExploreFilterSection<Content: View>: View {
    let title: String
    let content: Content

    init(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased())
                .font(.hayame(size: 12, weight: .bold))
                .foregroundStyle(HayameTheme.mutedText)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                content
            }
            .background(HayameTheme.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(HayameTheme.cardStroke, lineWidth: 1)
            )
        }
    }
}

private struct ExploreFilterNavigationRow: View {
    let title: String
    let value: String

    var body: some View {
        HStack(spacing: 12) {
            Text(title)
                .font(.hayame(size: 14, weight: .semibold))
                .foregroundStyle(HayameTheme.brandNavy)

            Spacer(minLength: 12)

            Text(value)
                .font(.hayame(size: 13, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .multilineTextAlignment(.trailing)
                .lineLimit(2)

            Image(systemName: "chevron.right")
                .font(.hayame(size: 11, weight: .bold))
                .foregroundStyle(HayameTheme.mutedText)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 14)
        .contentShape(Rectangle())
    }
}

private struct ExploreFilterStepperRow: View {
    let title: String
    let value: String
    let canDecrease: Bool
    let onDecrease: () -> Void
    let onIncrease: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.hayame(size: 14, weight: .semibold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Text(value)
                    .font(.hayame(size: 12, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
            }

            Spacer()

            HStack(spacing: 8) {
                stepButton(systemName: "minus", enabled: canDecrease, action: onDecrease)
                stepButton(systemName: "plus", enabled: true, action: onIncrease)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
    }

    private func stepButton(
        systemName: String,
        enabled: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.hayame(size: 12, weight: .bold))
                .foregroundStyle(enabled ? HayameTheme.brandBlue : HayameTheme.mutedText)
                .frame(width: 32, height: 32)
                .background(HayameTheme.fieldBackground)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .stroke(HayameTheme.controlStroke, lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
        .opacity(enabled ? 1 : 0.5)
    }
}

private struct ExploreFilterDivider: View {
    var body: some View {
        Rectangle()
            .fill(HayameTheme.cardStroke)
            .frame(height: 1)
            .padding(.leading, 14)
    }
}

private struct ExploreFilterOptionList: View {
    @Environment(\.dismiss) private var dismiss
    let title: String
    let options: [String]
    @Binding var selection: String
    let displayName: (String) -> String
    @State private var query = ""

    init(
        title: String,
        options: [String],
        selection: Binding<String>,
        displayName: @escaping (String) -> String = { $0 }
    ) {
        self.title = title
        self.options = options
        _selection = selection
        self.displayName = displayName
    }

    private var filteredOptions: [String] {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return options }
        return options.filter { option in
            option.localizedCaseInsensitiveContains(trimmed) ||
                displayName(option).localizedCaseInsensitiveContains(trimmed)
        }
    }

    var body: some View {
        VStack(spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .font(.hayame(size: 13, weight: .semibold))
                    .foregroundStyle(HayameTheme.mutedText)
                TextField("Search \(title.lowercased())", text: $query)
                    .font(.hayame(size: 14, weight: .medium))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .autocorrectionDisabled()
                if !query.isEmpty {
                    Button {
                        query = ""
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(HayameTheme.fieldBackground)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(HayameTheme.controlStroke, lineWidth: 1)
            )

            ScrollView(showsIndicators: true) {
                LazyVStack(spacing: 8) {
                    if query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        optionRow(value: "", label: "Any")
                    }

                    ForEach(filteredOptions, id: \.self) { option in
                        optionRow(value: option, label: displayName(option))
                    }

                    if filteredOptions.isEmpty {
                        Text("No matching options.")
                            .font(.hayame(size: 13, weight: .medium))
                            .foregroundStyle(HayameTheme.mutedText)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.vertical, 16)
                    }
                }
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .padding(16)
        .background(HayameTheme.pageBackground.ignoresSafeArea())
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(HayameTheme.pageBackground, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
    }

    private func optionRow(value: String, label: String) -> some View {
        let selected = selection.caseInsensitiveCompare(value) == .orderedSame
        return Button {
            selection = value
            dismiss()
        } label: {
            HStack(spacing: 12) {
                Text(label)
                    .font(.hayame(size: 14, weight: .semibold))
                    .foregroundStyle(selected ? HayameTheme.brandBlue : HayameTheme.brandNavy)
                    .multilineTextAlignment(.leading)
                Spacer()
                if selected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.hayame(size: 16, weight: .semibold))
                        .foregroundStyle(HayameTheme.brandBlue)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 12)
            .background(selected ? HayameTheme.brandLight : HayameTheme.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(
                        selected ? HayameTheme.brandBlue.opacity(0.3) : HayameTheme.cardStroke,
                        lineWidth: 1
                    )
            )
        }
        .buttonStyle(.plain)
    }
}

struct ListingSharePayload: Identifiable {
    let id = UUID()
    let title: String
    let message: String
    let url: URL
    let thumbnail: UIImage
}

struct ListingShareSheet: UIViewControllerRepresentable {
    let payload: ListingSharePayload

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(
            activityItems: [ListingShareItemSource(payload: payload), payload.message],
            applicationActivities: nil
        )
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

private final class ListingShareItemSource: NSObject, UIActivityItemSource {
    private let payload: ListingSharePayload

    init(payload: ListingSharePayload) {
        self.payload = payload
    }

    func activityViewControllerPlaceholderItem(_ activityViewController: UIActivityViewController) -> Any {
        payload.url
    }

    func activityViewController(
        _ activityViewController: UIActivityViewController,
        itemForActivityType activityType: UIActivity.ActivityType?
    ) -> Any? {
        payload.url
    }

    func activityViewController(
        _ activityViewController: UIActivityViewController,
        subjectForActivityType activityType: UIActivity.ActivityType?
    ) -> String {
        payload.title
    }

    func activityViewControllerLinkMetadata(_ activityViewController: UIActivityViewController) -> LPLinkMetadata? {
        let metadata = LPLinkMetadata()
        metadata.title = payload.title
        metadata.originalURL = payload.url
        metadata.url = payload.url
        metadata.imageProvider = NSItemProvider(object: payload.thumbnail)
        return metadata
    }
}

@MainActor
enum ListingShareThumbnailRenderer {
    private static let canvasSize = CGSize(width: 1200, height: 630)

    static func render(carImage: UIImage?, listingTitle: String) -> UIImage {
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        format.opaque = true

        return UIGraphicsImageRenderer(size: canvasSize, format: format).image { context in
            let canvas = CGRect(origin: .zero, size: canvasSize)
            UIColor(red: 0.02, green: 0.18, blue: 0.34, alpha: 1).setFill()
            context.fill(canvas)

            if let carImage {
                carImage.draw(in: aspectFillRect(for: carImage.size, inside: canvas))
            } else {
                drawFallbackCar(in: canvas)
            }

            drawBottomShade(in: canvas)
            drawLogo(in: canvas)
            drawTitle(listingTitle, in: canvas)
        }
    }

    private static func aspectFillRect(for imageSize: CGSize, inside bounds: CGRect) -> CGRect {
        guard imageSize.width > 0, imageSize.height > 0 else { return bounds }
        let scale = max(bounds.width / imageSize.width, bounds.height / imageSize.height)
        let size = CGSize(width: imageSize.width * scale, height: imageSize.height * scale)
        return CGRect(
            x: bounds.midX - (size.width / 2),
            y: bounds.midY - (size.height / 2),
            width: size.width,
            height: size.height
        )
    }

    private static func drawBottomShade(in canvas: CGRect) {
        let colors = [
            UIColor.clear.cgColor,
            UIColor.black.withAlphaComponent(0.78).cgColor,
        ] as CFArray
        guard let gradient = CGGradient(
            colorsSpace: CGColorSpaceCreateDeviceRGB(),
            colors: colors,
            locations: [0, 1]
        ), let context = UIGraphicsGetCurrentContext() else { return }

        context.drawLinearGradient(
            gradient,
            start: CGPoint(x: canvas.midX, y: canvas.height * 0.48),
            end: CGPoint(x: canvas.midX, y: canvas.maxY),
            options: []
        )
    }

    private static func drawLogo(in canvas: CGRect) {
        guard let logo = UIImage(named: "hayame_logo_white") else { return }
        // Keep the brand inside the centered square crop used by the compact
        // iOS share-sheet preview, not at the landscape image's outer edge.
        let badgeRect = CGRect(x: canvas.midX - 170, y: 28, width: 340, height: 132)
        UIColor.black.withAlphaComponent(0.48).setFill()
        UIBezierPath(roundedRect: badgeRect, cornerRadius: 32).fill()

        let logoWidth: CGFloat = 250
        let ratio = logo.size.height / max(logo.size.width, 1)
        let logoRect = CGRect(
            x: canvas.midX - (logoWidth / 2),
            y: badgeRect.midY - ((logoWidth * ratio) / 2),
            width: logoWidth,
            height: logoWidth * ratio
        )
        logo.draw(in: logoRect)
    }

    private static func drawTitle(_ title: String, in canvas: CGRect) {
        let paragraph = NSMutableParagraphStyle()
        paragraph.lineBreakMode = .byTruncatingTail
        let attributes: [NSAttributedString.Key: Any] = [
            .font: HayameFontFamily.uiFont(size: 48, weight: .bold),
            .foregroundColor: UIColor.white,
            .paragraphStyle: paragraph,
        ]
        let titleRect = CGRect(x: 42, y: canvas.maxY - 118, width: 820, height: 68)
        title.draw(in: titleRect, withAttributes: attributes)
    }

    private static func drawFallbackCar(in canvas: CGRect) {
        let configuration = UIImage.SymbolConfiguration(pointSize: 180, weight: .bold)
        guard let carSymbol = UIImage(systemName: "car.fill", withConfiguration: configuration)?
            .withTintColor(.white, renderingMode: .alwaysOriginal) else { return }
        let rect = CGRect(x: canvas.midX - 150, y: canvas.midY - 100, width: 300, height: 200)
        carSymbol.draw(in: rect, blendMode: .normal, alpha: 0.32)
    }
}

private struct CarDetailLine: View {
    let label: String
    let value: String

    var body: some View {
        HStack(alignment: .top) {
            Text(label)
                .font(.hayame(size: 10, weight: .bold))
                .foregroundStyle(HayameTheme.mutedText)
            Spacer()
            Text(value)
                .font(.hayame(size: 13, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
                .multilineTextAlignment(.trailing)
        }
    }
}

struct CarImageGalleryFullScreen: View {
    let images: [String]
    @Binding var selectedIndex: Int
    @Environment(\.dismiss) private var dismiss

    private var safeImages: [String] {
        images.isEmpty ? [""] : images
    }

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Color.black.ignoresSafeArea()

            TabView(selection: $selectedIndex) {
                ForEach(Array(safeImages.enumerated()), id: \.offset) { idx, urlString in
                    ZStack {
                        Color.black

                        if let url = RemoteImageURLResolver.resolve(urlString) {
                            CachedRemoteImage(
                                url: url,
                                targetSize: CGSize(width: 1206, height: 874),
                                fitMode: .fit
                            ) {
                                ProgressView().tint(.white)
                            } failure: {
                                Image(systemName: "photo")
                                    .font(.hayame(size: 42, weight: .bold))
                                    .foregroundStyle(.white.opacity(0.7))
                            }
                        } else {
                            Image(systemName: "photo")
                                .font(.hayame(size: 42, weight: .bold))
                                .foregroundStyle(.white.opacity(0.7))
                        }
                    }
                    .tag(idx)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .always))

            // Brand watermark — white Hayame logo, centered over the image at low opacity.
            Image("hayame_logo_white")
                .resizable()
                .scaledToFit()
                .frame(width: 150)
                .opacity(0.16)
                .shadow(color: .black.opacity(0.25), radius: 5, x: 0, y: 1)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .allowsHitTesting(false)

            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.hayame(size: 14, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(10)
                    .background(Color.black.opacity(0.45))
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)
            .padding(.top, 14)
            .padding(.trailing, 14)

            VStack {
                Spacer()
                Text("\(min(selectedIndex + 1, safeImages.count)) / \(safeImages.count)")
                    .font(.hayame(size: 12, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.black.opacity(0.45))
                    .clipShape(Capsule())
                    .padding(.bottom, 24)
            }
        }
        .onAppear {
            if safeImages.indices.contains(selectedIndex) == false {
                selectedIndex = 0
            }
        }
    }
}

private struct FloatingBookingBar: View {
    @Environment(\.colorScheme) private var colorScheme

    let pricePerDay: Int
    let action: () -> Void

    var body: some View {
        HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Price per day")
                    .font(.hayame(size: 11, weight: .semibold))
                    .foregroundStyle(secondaryTextColor)

                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text("GHS \(pricePerDay)")
                        .font(.hayame(size: 24, weight: .bold))
                        .foregroundStyle(primaryTextColor)
                    Text("/ day")
                        .font(.hayame(size: 13, weight: .semibold))
                        .foregroundStyle(secondaryTextColor)
                }
            }

            Spacer(minLength: 12)

            Button(action: action) {
                Text("Book now")
                    .font(.hayame(size: 15, weight: .semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 22)
                    .padding(.vertical, 13)
                    .frame(minWidth: 134)
                    .background(HayameTheme.brandBlue, in: Capsule())
            }
            .buttonStyle(.plain)
            .shadow(color: HayameTheme.brandBlue.opacity(colorScheme == .dark ? 0.24 : 0.18), radius: 12, x: 0, y: 6)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(borderColor, lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(colorScheme == .dark ? 0.26 : 0.10), radius: 18, x: 0, y: 8)
    }

    private var primaryTextColor: Color {
        colorScheme == .dark ? .white : HayameTheme.brandNavy
    }

    private var secondaryTextColor: Color {
        colorScheme == .dark ? .white.opacity(0.7) : HayameTheme.mutedText
    }

    private var borderColor: Color {
        colorScheme == .dark ? .white.opacity(0.08) : .white.opacity(0.75)
    }
}

enum BookingCheckoutStep: Int, CaseIterable, Identifiable {
    case tripDetails
    case location
    case review
    case payment

    var id: Int { rawValue }

    var stepNumber: Int { rawValue + 1 }

    var title: String {
        switch self {
        case .tripDetails: return "Dates"
        case .location: return "Handoff"
        case .review: return "Review"
        case .payment: return "Pay"
        }
    }

    var subtitle: String {
        switch self {
        case .tripDetails: return "Set your dates first. Nothing else competes for attention here."
        case .location: return "Choose pickup or delivery, then confirm where the trip will happen."
        case .review: return "See the trip mode, handoff details, and every charge before you pay."
        case .payment: return "Confirm the total, then complete payment securely."
        }
    }

    var progressLabel: String {
        switch self {
        case .tripDetails: return "Trip"
        case .location: return "Location"
        case .review: return "Review"
        case .payment: return "Pay"
        }
    }

    var navigationTitle: String {
        self == .payment ? "Checkout" : title
    }

    var footerNote: String {
        switch self {
        case .tripDetails: return "Choose your dates first."
        case .location: return "Pickup or delivery comes first. Then confirm the trip area."
        case .review: return "Review every charge before continuing."
        case .payment: return "Secure payment. No hidden fees."
        }
    }

    var previous: BookingCheckoutStep? {
        BookingCheckoutStep(rawValue: rawValue - 1)
    }
}

struct BookingSheetCard<Content: View>: View {
    private let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            content
        }
        .padding(18)
        .background(HayameTheme.cardBackground, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(HayameTheme.cardStroke, lineWidth: 1)
        )
        .shadow(color: HayameTheme.cardShadow, radius: 12, x: 0, y: 6)
    }
}

enum BookingDateSelectionTarget: String, Identifiable {
    case start
    case end

    var id: String { rawValue }

    var calendarTitle: String {
        switch self {
        case .start: return "Choose start date"
        case .end: return "Choose end date"
        }
    }
}

struct BookingAvailabilityCalendarSheet: View {
    @Environment(\.dismiss) private var dismiss

    let title: String
    let selectedDate: Date
    let selectionRange: ClosedRange<Date>
    let blockedDates: Set<Date>
    let minimumDate: Date
    let canSelectDate: (Date) -> Bool
    let onSelect: (Date) -> Void

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 8), count: 7)
    private let weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    private var months: [BookingCalendarMonth] {
        bookingCalendarMonths(from: minimumDate, count: 6)
    }

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 22) {
                    Text("Unavailable days are crossed out. Only bookable dates can be selected.")
                        .font(.hayame(size: 13, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)

                    ForEach(months) { month in
                        VStack(alignment: .leading, spacing: 12) {
                            Text(month.title)
                                .font(.hayame(size: 18, weight: .bold))
                                .foregroundStyle(HayameTheme.brandNavy)

                            LazyVGrid(columns: columns, spacing: 10) {
                                ForEach(weekdayLabels, id: \.self) { label in
                                    Text(label)
                                        .font(.hayame(size: 11, weight: .bold))
                                        .foregroundStyle(HayameTheme.mutedText)
                                        .frame(maxWidth: .infinity)
                                }

                                ForEach(Array(month.days.enumerated()), id: \.offset) { _, day in
                                    if let day {
                                        calendarDayCell(for: day)
                                    } else {
                                        Color.clear
                                            .frame(height: 42)
                                    }
                                }
                            }
                        }
                        .padding(16)
                        .background(HayameTheme.cardBackground, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .stroke(HayameTheme.cardStroke, lineWidth: 1)
                        )
                    }
                }
                .padding(16)
            }
            .background(HayameTheme.pageBackground)
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .presentationDetents([.large])
    }

    @ViewBuilder
    private func calendarDayCell(for day: Date) -> some View {
        let normalizedDay = bookingDay(day)
        let isBlocked = blockedDates.contains(normalizedDay)
        let isSelected = Calendar.current.isDate(normalizedDay, inSameDayAs: bookingDay(selectedDate))
        let isInRange = normalizedDay >= bookingDay(selectionRange.lowerBound) && normalizedDay <= bookingDay(selectionRange.upperBound)
        let isSelectable = normalizedDay >= bookingDay(minimumDate) && canSelectDate(normalizedDay)

        Button {
            guard isSelectable else { return }
            onSelect(normalizedDay)
            dismiss()
        } label: {
            Text("\(Calendar.current.component(.day, from: normalizedDay))")
                .font(.hayame(size: 14, weight: .semibold))
                .foregroundStyle(dayTextColor(isSelectable: isSelectable, isSelected: isSelected, isBlocked: isBlocked))
                .frame(maxWidth: .infinity)
                .frame(height: 42)
                .background(dayBackgroundColor(isSelected: isSelected, isInRange: isInRange, isSelectable: isSelectable))
                .clipShape(Circle())
                .overlay {
                    if isBlocked || !isSelectable {
                        Rectangle()
                            .fill(HayameTheme.warning.opacity(0.75))
                            .frame(width: 24, height: 1.5)
                            .rotationEffect(.degrees(-28))
                    }
                }
        }
        .buttonStyle(.plain)
        .disabled(!isSelectable)
    }

    private func dayTextColor(isSelectable: Bool, isSelected: Bool, isBlocked: Bool) -> Color {
        if isSelected {
            return .white
        }
        if isBlocked || !isSelectable {
            return HayameTheme.mutedText.opacity(0.55)
        }
        return HayameTheme.brandNavy
    }

    private func dayBackgroundColor(isSelected: Bool, isInRange: Bool, isSelectable: Bool) -> Color {
        if isSelected {
            return HayameTheme.brandBlue
        }
        if isInRange && isSelectable {
            return HayameTheme.brandBlue.opacity(0.14)
        }
        if !isSelectable {
            return HayameTheme.subtleFill
        }
        return .clear
    }
}

private struct BookingCalendarMonth: Identifiable {
    let id: String
    let title: String
    let days: [Date?]
}

func bookingDay(_ date: Date) -> Date {
    Calendar.current.startOfDay(for: date)
}

func bookingAddingDays(_ days: Int, to date: Date) -> Date {
    Calendar.current.date(byAdding: .day, value: days, to: bookingDay(date)) ?? bookingDay(date)
}

func bookingDateSet(from rawValues: [String]) -> Set<Date> {
    let formatter = DateFormatter()
    formatter.calendar = Calendar(identifier: .gregorian)
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.dateFormat = "yyyy-MM-dd"
    return Set(rawValues.compactMap { formatter.date(from: $0) }.map(bookingDay))
}

private func isContinuousBookingRangeAvailable(startDate: Date, endDate: Date, blockedDates: Set<Date>) -> Bool {
    let normalizedStart = bookingDay(startDate)
    let normalizedEnd = bookingDay(endDate)
    guard normalizedEnd > normalizedStart else { return false }

    var current = normalizedStart
	    while current < normalizedEnd {
	        if blockedDates.contains(current) {
	            return false
	        }
        current = bookingAddingDays(1, to: current)
    }
    return true
}

/// `minimumNights` is the listing's shortest trip (`Car.minimumTripDays`):
/// a start day only counts as bookable when that many nights after it are free.
func isBookableStartDate(_ date: Date, blockedDates: Set<Date>, minimumNights: Int = 1) -> Bool {
    let normalizedDate = bookingDay(date)
    return normalizedDate >= bookingDay(Date()) &&
        isContinuousBookingRangeAvailable(
            startDate: normalizedDate,
            endDate: bookingAddingDays(max(minimumNights, 1), to: normalizedDate),
            blockedDates: blockedDates
        )
}

func isBookableEndDate(_ date: Date, startDate: Date, blockedDates: Set<Date>, minimumNights: Int = 1) -> Bool {
    let normalizedDate = bookingDay(date)
    let earliestEnd = bookingAddingDays(max(minimumNights, 1), to: startDate)
    return normalizedDate >= earliestEnd &&
        isContinuousBookingRangeAvailable(
            startDate: startDate,
            endDate: normalizedDate,
            blockedDates: blockedDates
        )
}

func preferredBookingEndDate(currentEnd: Date, startDate: Date, blockedDates: Set<Date>, minimumNights: Int = 1) -> Date? {
    let normalizedStart = bookingDay(startDate)
    let normalizedEnd = bookingDay(currentEnd)

    if isBookableEndDate(normalizedEnd, startDate: normalizedStart, blockedDates: blockedDates, minimumNights: minimumNights) {
        return normalizedEnd
    }

    let fallback = bookingAddingDays(max(minimumNights, 1), to: normalizedStart)
    return isContinuousBookingRangeAvailable(startDate: normalizedStart, endDate: fallback, blockedDates: blockedDates)
        ? fallback
        : nil
}

func nextBookableStartDate(from earliestDate: Date, duration: Int, blockedDates: Set<Date>) -> Date? {
    var current = bookingDay(earliestDate)
    for _ in 0..<180 {
        let proposedEnd = bookingAddingDays(duration, to: current)
        if isContinuousBookingRangeAvailable(startDate: current, endDate: proposedEnd, blockedDates: blockedDates) {
            return current
        }
        current = bookingAddingDays(1, to: current)
    }
    return nil
}

private func bookingCalendarMonths(from earliestDate: Date, count: Int) -> [BookingCalendarMonth] {
    let calendar = Calendar.current
    let monthFormatter = DateFormatter()
    monthFormatter.dateFormat = "LLLL yyyy"

    guard let firstMonth = calendar.dateInterval(of: .month, for: bookingDay(earliestDate))?.start else {
        return []
    }

    return (0..<count).compactMap { offset in
        guard
            let monthStart = calendar.date(byAdding: .month, value: offset, to: firstMonth),
            let monthRange = calendar.range(of: .day, in: .month, for: monthStart)
        else {
            return nil
        }

        let firstWeekday = calendar.component(.weekday, from: monthStart)
        let placeholders = Array(repeating: Optional<Date>.none, count: max(0, firstWeekday - 1))
        let dates = monthRange.compactMap { day -> Date? in
            calendar.date(byAdding: .day, value: day - 1, to: monthStart).map(bookingDay)
        }

        return BookingCalendarMonth(
            id: monthFormatter.string(from: monthStart),
            title: monthFormatter.string(from: monthStart),
            days: placeholders + dates
        )
    }
}

struct BookingSelectionField: View {
    let title: String
    let selected: String
    let options: [String]
    let onSelected: (String) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.hayame(size: 14, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)

            Menu {
                ForEach(options, id: \.self) { option in
                    Button(option) {
                        onSelected(option)
                    }
                }
            } label: {
                HStack(spacing: 12) {
                    Text(selected)
                        .font(.hayame(size: 16, weight: .semibold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Spacer()
                    Image(systemName: "chevron.down")
                        .font(.hayame(size: 12, weight: .bold))
                        .foregroundStyle(HayameTheme.brandBlue)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 14)
                .background(HayameTheme.brandLight, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(HayameTheme.cardStroke, lineWidth: 1)
                )
            }
        }
    }
}

// MARK: - Post-payment success stage

/// Shown over the checkout once payment is verified: a celebration beat, then
/// the booking sits on a live scene while the host is asked to confirm. The
/// status pill follows the real booking so a quick host reply shows up here.
struct BookingSuccessStage: View {
    @EnvironmentObject private var appState: AppState

    let car: Car
    let bookingID: String
    let startDate: Date
    let endDate: Date
    let onDone: () -> Void

    private enum Phase { case celebrate, waiting }
    private enum Outcome { case waiting, confirmed, declined }

    @State private var phase: Phase = .celebrate
    @State private var messageIndex = 0

    private var liveBooking: Booking? {
        appState.renterBookings.first { $0.id == bookingID }
    }

    private var hostName: String {
        let name = car.hostName.trimmingCharacters(in: .whitespacesAndNewlines)
        return name.isEmpty ? "the host" : name
    }

    private var outcome: Outcome {
        guard let liveBooking else { return .waiting }
        switch liveBooking.status {
        case .confirmed, .completed: return .confirmed
        case .rejected, .cancelled, .refunded: return .declined
        case .pending, .awaitingHost: return .waiting
        }
    }

    private var waitingMessages: [String] {
        ["Payment received", "Request sent to \(hostName)", "Waiting for \(hostName) to confirm"]
    }

    private var pillText: String {
        switch outcome {
        case .confirmed: return "\(hostName) confirmed your trip"
        case .declined: return "Request declined"
        case .waiting: return waitingMessages[min(messageIndex, waitingMessages.count - 1)]
        }
    }

    private var pillTone: HayameStatusPill.Tone {
        switch outcome {
        case .confirmed: return .success
        case .declined: return .danger
        case .waiting: return .info
        }
    }

    private var pillSymbol: String? {
        switch outcome {
        case .confirmed: return "checkmark"
        case .declined: return "xmark"
        case .waiting: return nil
        }
    }

    private var title: String {
        switch outcome {
        case .confirmed: return "You're all set"
        case .declined: return "This one didn't work out"
        case .waiting: return "Request sent"
        }
    }

    private var subtitle: String {
        switch outcome {
        case .confirmed: return "\(hostName) approved your booking. Pickup details are in Trips."
        case .declined: return "\(hostName) couldn't take this booking. Your payment will be refunded."
        case .waiting: return "We've let \(hostName) know. You'll get a notification the moment they respond."
        }
    }

    private var timelineCompleted: Int {
        outcome == .confirmed ? 2 : 1
    }

    var body: some View {
        ZStack {
            BookingWaitingScene(car: car, isSearching: outcome == .waiting)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                HayameStatusPill(
                    text: pillText,
                    tone: pillTone,
                    isLive: outcome == .waiting,
                    systemImage: pillSymbol
                )
                .padding(.top, 14)
                .opacity(phase == .waiting ? 1 : 0)
                .offset(y: phase == .waiting ? 0 : -12)

                Spacer()

                if phase == .waiting {
                    summaryCard
                        .padding(.horizontal, 16)
                        .padding(.bottom, 12)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }

            if phase == .celebrate {
                ZStack {
                    Circle()
                        .fill(HayameTheme.cardBackground.opacity(0.92))
                        .frame(width: 200, height: 200)
                        .blur(radius: 22)
                    HayameSparkleBurst(radius: 96, delay: 0.25)
                    HayameSuccessCheck(size: 116, delay: 0.1)
                }
                .transition(.scale(scale: 0.5).combined(with: .opacity))
            }
        }
        .background(HayameTheme.pageBackground)
        .task {
            try? await Task.sleep(nanoseconds: 1_600_000_000)
            guard !Task.isCancelled else { return }
            withAnimation(HayameMotion.gentle) { phase = .waiting }
            for index in 1..<waitingMessages.count {
                try? await Task.sleep(nanoseconds: 1_900_000_000)
                guard !Task.isCancelled else { return }
                withAnimation(HayameMotion.settle) { messageIndex = index }
            }
        }
        .onChange(of: outcome) { _, newValue in
            switch newValue {
            case .confirmed: HayameHaptics.success()
            case .declined: HayameHaptics.warning()
            case .waiting: break
            }
        }
    }

    private var summaryCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .center, spacing: 14) {
                HayameSuccessCheck(size: 48, color: outcome == .declined ? HayameTheme.danger : HayameTheme.success)
                    .id(outcome == .declined)
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.hayame(size: 20, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .contentTransition(.opacity)
                    Text(subtitle)
                        .font(.hayame(size: 13, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .animation(HayameMotion.settle, value: title)

            HStack(spacing: 12) {
                NetworkOrFallbackImage(urlString: car.imageNames.first, targetSize: CGSize(width: 160, height: 120))
                    .frame(width: 72, height: 56)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                VStack(alignment: .leading, spacing: 3) {
                    Text(car.displayTitle)
                        .font(.hayame(size: 15, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .lineLimit(1)
                    Text("\(startDate.hayameDateLabel()) - \(endDate.hayameDateLabel())")
                        .font(.hayame(size: 12, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                    Text("\(car.city), \(car.region)")
                        .font(.hayame(size: 12, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
            }
            .padding(12)
            .background(HayameTheme.fieldBackground, in: RoundedRectangle(cornerRadius: 16, style: .continuous))

            HayameTimelineStepper(
                titles: ["Paid", "Host confirms", "Pickup", "Return"],
                completedCount: timelineCompleted,
                progress: outcome == .waiting ? 0.5 : 0.1,
                caption: outcome == .waiting ? "Awaiting host" : nil,
                accent: outcome == .declined ? HayameTheme.danger : HayameTheme.brandBlue,
                showsMarker: outcome != .declined
            )

            Button(action: onDone) {
                Text("View in Trips")
            }
            .buttonStyle(PrimaryPillButtonStyle())
        }
        .padding(18)
        .background(HayameTheme.cardBackground, in: RoundedRectangle(cornerRadius: 26, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .stroke(HayameTheme.cardStroke, lineWidth: 1)
        )
        .shadow(color: HayameTheme.cardShadow, radius: 18, x: 0, y: 10)
    }
}

/// Backdrop for the success stage: the car on a real map when the listing has
/// coordinates, otherwise a soft radar grid. The marker pulses while the host
/// is still being asked.
private struct BookingWaitingScene: View {
    let car: Car
    let isSearching: Bool

    private var coordinate: CLLocationCoordinate2D? {
        guard let latitude = car.latitude, let longitude = car.longitude else { return nil }
        let candidate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        guard CLLocationCoordinate2DIsValid(candidate),
              abs(latitude) > 0.0001 || abs(longitude) > 0.0001 else { return nil }
        return candidate
    }

    var body: some View {
        ZStack {
            if let coordinate {
                Map(
                    initialPosition: .region(
                        MKCoordinateRegion(
                            center: coordinate,
                            span: MKCoordinateSpan(latitudeDelta: 0.014, longitudeDelta: 0.014)
                        )
                    )
                ) {
                    Annotation("", coordinate: coordinate, anchor: .center) {
                        marker
                    }
                }
                .mapStyle(.standard(elevation: .flat, pointsOfInterest: .excludingAll, showsTraffic: false))
                .mapControlVisibility(.hidden)
                .allowsHitTesting(false)
            } else {
                HayameRadarScene()
                marker.offset(y: -70)
            }

            // Fade the scene into the card so text stays legible.
            LinearGradient(
                colors: [.clear, HayameTheme.pageBackground.opacity(0.85), HayameTheme.pageBackground],
                startPoint: UnitPoint(x: 0.5, y: 0.35),
                endPoint: .bottom
            )
            .allowsHitTesting(false)
        }
    }

    private var marker: some View {
        ZStack {
            if isSearching {
                HayameRadarPulse(color: HayameTheme.brandBlue, rings: 3, maxScale: 3.2)
                    .frame(width: 64, height: 64)
            }
            ZStack {
                Circle().fill(HayameTheme.brandBlue)
                Image(systemName: "car.fill")
                    .font(.hayame(size: 16, weight: .bold))
                    .foregroundStyle(.white)
            }
            .frame(width: 42, height: 42)
            .overlay(Circle().stroke(.white, lineWidth: 3))
            .shadow(color: HayameTheme.brandBlue.opacity(0.35), radius: 10, x: 0, y: 5)
        }
        .animation(HayameMotion.fade, value: isSearching)
    }
}

struct RenterDashboardScreen: View {
    @EnvironmentObject private var appState: AppState

    private var paidRenterBookings: [Booking] {
        appState.renterBookings.filter { $0.paymentStatus == .paid }
    }

    private var upcomingCount: Int {
        paidRenterBookings.filter { $0.endDate >= Date() }.count
    }

    private var pastCount: Int {
        paidRenterBookings.filter { $0.endDate < Date() }.count
    }

	    var body: some View {
	        ScrollView {
	            VStack(alignment: .leading, spacing: 14) {
	                PageTitle("Dashboard")

	                VStack(alignment: .leading, spacing: 4) {
	                    Text("Dashboard")
                        .font(.hayame(size: 12, weight: .semibold))
                        .foregroundStyle(HayameTheme.brandBlue)
                    Text("Welcome back")
                        .font(.hayame(size: 26, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text("Manage your bookings, favorites, and profile.")
                        .font(.hayame(size: 13, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                }
                .hayameCard()

                HStack(spacing: 10) {
                    StatTile(title: "Upcoming trips", value: "\(upcomingCount)")
                    StatTile(title: "Past trips", value: "\(pastCount)") {
                        openHostVehicles()
                    }
                }

                HStack(spacing: 10) {
                    StatTile(title: "Saved cars", value: "\(appState.favoriteCars.count)")
                    StatTile(title: "Unread chats", value: "\(appState.unreadMessagesCount)")
                }

                SectionHeader(title: "Quick nav")

                DashboardNavRow(
                    title: "Overview",
                    subtitle: "Dashboard summary and activity",
                    systemImage: "rectangle.grid.2x2.fill"
                ) {}

                DashboardNavRow(
                    title: "Bookings",
                    subtitle: "Review upcoming and past trips.",
                    systemImage: "calendar"
                ) {
                    appState.renterTab = .trips
                }

                DashboardNavRow(
                    title: "Chats",
                    subtitle: "Open conversations with hosts.",
                    systemImage: "message"
                ) {
                    appState.renterTab = .inbox
                }

                DashboardNavRow(
                    title: "Favorites",
                    subtitle: "See the cars you have saved.",
                    systemImage: "heart"
                ) {
                    appState.renterTab = .favorites
                }

                DashboardNavRow(
                    title: "Profile",
                    subtitle: "Update your details and contact info.",
                    systemImage: "person"
                ) {
                    appState.renterTab = .more
                }

                DashboardNavRow(
                    title: "Reviews",
                    subtitle: "View and submit trip reviews.",
                    systemImage: "star.bubble"
                ) {
                    appState.renterTab = .trips
                }

                if appState.hostAccessState == .host {
                    SectionHeader(title: "Host Mode")
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Host access is active. Open Host Mode to manage listings, bookings, approvals, earnings, reviews, and host profile tools.")
                            .font(.hayame(size: 12, weight: .medium))
                            .foregroundStyle(HayameTheme.mutedText)
                        Button("Open host dashboard") {
                            appState.switchToHostMode()
                        }
                        .buttonStyle(SecondaryPillButtonStyle())
                    }
                    .hayameCard()
                } else if appState.hostAccessState == .pending {
                    SectionHeader(title: "Host Application")
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Your host application is pending review. You can continue using renter features while we review your documents.")
                            .font(.hayame(size: 12, weight: .medium))
                            .foregroundStyle(HayameTheme.warning)
                        NavigationLink("View application") {
                            BecomeHostScreen()
                        }
                        .font(.hayame(size: 14, weight: .bold))
                        .foregroundStyle(HayameTheme.brandBlue)
                    }
                    .hayameCard()
                } else {
                    SectionHeader(title: "Become a Host")
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Apply to list your cars. Applications are typically reviewed within 1-2 business days.")
                            .font(.hayame(size: 12, weight: .medium))
                            .foregroundStyle(HayameTheme.mutedText)
                        NavigationLink("Host application") {
                            BecomeHostScreen()
                        }
                        .font(.hayame(size: 14, weight: .bold))
                        .foregroundStyle(HayameTheme.brandBlue)
                    }
                    .hayameCard()
                }

                if let message = appState.syncErrorMessage, !message.isEmpty {
                    Text(message)
                        .font(.hayame(size: 12, weight: .semibold))
                        .foregroundStyle(HayameTheme.danger)
                }
            }
            .padding(16)
	        }
	        .background(HayameTheme.pageBackground)
	        .navigationTitle("")
	        .navigationBarTitleDisplayMode(.inline)
	        .refreshable {
	            await appState.refreshAllRemoteData()
	        }
	    }

    private func openHostVehicles() {
        guard appState.isAuthenticated else {
            appState.syncErrorMessage = "Log in to access host vehicles."
            return
        }

        guard appState.hostAccessState == .host else {
            appState.syncErrorMessage = "Host access is required to open vehicles."
            return
        }

        appState.hostTab = .cars
        appState.hostModeEnabled = true
    }
}

private struct DashboardNavRow: View {
    let title: String
    let subtitle: String
    let systemImage: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Image(systemName: systemImage)
                    .font(.hayame(size: 14, weight: .bold))
                    .foregroundStyle(HayameTheme.brandBlue)
                    .frame(width: 28, height: 28)
                    .background(HayameTheme.brandLight)
                    .clipShape(Circle())

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.hayame(size: 14, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text(subtitle)
                        .font(.hayame(size: 12, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.hayame(size: 12, weight: .bold))
                    .foregroundStyle(HayameTheme.mutedText)
            }
            .padding(12)
            .background(HayameTheme.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(HayameTheme.cardStroke, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

struct TripChatTarget: Identifiable, Hashable {
    let id: String
    let participantName: String
}

struct PaymentNoticeCard: View {
    let message: String
    let isError: Bool
    let dismiss: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            if isError {
                Image(systemName: "xmark.octagon.fill")
                    .font(.hayame(size: 18, weight: .bold))
                    .foregroundStyle(HayameTheme.danger)
            } else {
                HayameSuccessCheck(size: 24)
            }

            Text(message)
                .font(.hayame(size: 13, weight: .semibold))
                .foregroundStyle(isError ? HayameTheme.danger : HayameTheme.success)
                .multilineTextAlignment(.leading)

            Spacer(minLength: 8)

            Button("Dismiss", action: dismiss)
                .font(.hayame(size: 12, weight: .bold))
                .foregroundStyle(HayameTheme.brandBlue)
        }
        .padding(12)
        .hayameCard()
        .hayameAppear(offsetY: -10)
    }
}

/// The journey line on a trip card: Requested, Confirmed, Pickup, Return, with
/// the car marker travelling toward the next milestone and a countdown.
struct TripJourneyTimeline: View {
    let booking: Booking
    /// Hide the "Pickup in..." caption and date footer when the surrounding
    /// card already shows them (the next-trip hero).
    var showsCaption = true

    @State private var now = Date()
    private let clock = Timer.publish(every: 60, on: .main, in: .common).autoconnect()

    private struct JourneyState {
        var completed: Int
        var progress: Double
        var caption: String?
        var accent: Color
        var showsMarker: Bool
        var footer: String?
    }

    var body: some View {
        let state = journeyState(at: now)
        VStack(alignment: .leading, spacing: 8) {
            HayameTimelineStepper(
                titles: ["Requested", "Confirmed", "Pickup", "Return"],
                completedCount: state.completed,
                progress: state.progress,
                caption: showsCaption ? state.caption : nil,
                accent: state.accent,
                showsMarker: state.showsMarker
            )

            if showsCaption, let footer = state.footer {
                HStack(spacing: 10) {
                    HayameProgressBar(fraction: state.progress, tint: state.accent)
                    Text(footer)
                        .font(.hayame(size: 11, weight: .semibold))
                        .foregroundStyle(HayameTheme.mutedText)
                        .lineLimit(1)
                        .fixedSize()
                }
            }
        }
        .padding(.vertical, 4)
        .onReceive(clock) { now = $0 }
    }

    private func journeyState(at now: Date) -> JourneyState {
        switch booking.displayStatus {
        case .pending:
            return JourneyState(
                completed: 1,
                progress: 0.5,
                caption: "Awaiting host",
                accent: HayameTheme.warning,
                showsMarker: true,
                footer: nil
            )
        case .confirmed:
            let progress = fraction(from: booking.createdAt, to: booking.startDate, at: now)
            return JourneyState(
                completed: 2,
                progress: progress,
                caption: "Pickup in \(Self.remainingLabel(until: booking.startDate, from: now))",
                accent: HayameTheme.brandBlue,
                showsMarker: true,
                footer: "Starts \(booking.startDate.hayameDateLabel())"
            )
        case .ongoing:
            let progress = fraction(from: booking.startDate, to: booking.endDate, at: now)
            return JourneyState(
                completed: 3,
                progress: progress,
                caption: "Return in \(Self.remainingLabel(until: booking.endDate, from: now))",
                accent: HayameTheme.success,
                showsMarker: true,
                footer: "Ends \(booking.endDate.hayameDateLabel())"
            )
        case .completed:
            return JourneyState(
                completed: 4,
                progress: 1,
                caption: nil,
                accent: HayameTheme.brandBlue,
                showsMarker: false,
                footer: nil
            )
        case .cancelled, .rejected, .refunded:
            return JourneyState(
                completed: 1,
                progress: 0,
                caption: nil,
                accent: HayameTheme.danger,
                showsMarker: false,
                footer: nil
            )
        }
    }

    private func fraction(from start: Date, to end: Date, at now: Date) -> Double {
        let total = end.timeIntervalSince(start)
        guard total > 0 else { return 1 }
        return min(max(now.timeIntervalSince(start) / total, 0), 1)
    }

    static func remainingLabel(until date: Date, from now: Date) -> String {
        let seconds = max(0, date.timeIntervalSince(now))
        let days = Int(seconds / 86_400)
        let hours = Int(seconds.truncatingRemainder(dividingBy: 86_400) / 3_600)
        let minutes = Int(seconds.truncatingRemainder(dividingBy: 3_600) / 60)
        if days > 0 { return hours > 0 ? "\(days)d \(hours)h" : "\(days)d" }
        if hours > 0 { return minutes > 0 ? "\(hours)h \(minutes)m" : "\(hours)h" }
        return "\(max(minutes, 1))m"
    }
}

struct TripDisputeSheet: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    let booking: Booking
    let onSubmit: (String) async -> Bool

    @State private var reason = ""
    @State private var saving = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Trip") {
                    InfoLine(label: "Car", value: booking.carTitle)
                    InfoLine(label: "Dates", value: "\(booking.startDate.hayameDateLabel()) - \(booking.endDate.hayameDateLabel())")
                }
                Section("Reason") {
                    TextEditor(text: $reason)
                        .scrollContentBackground(.hidden)
                        .foregroundStyle(HayameTheme.brandNavy)
                        .frame(minHeight: 130)
                }
                if let error = appState.syncErrorMessage, !error.isEmpty {
                    Section {
                        Text(error)
                            .font(.hayame(size: 12, weight: .semibold))
                            .foregroundStyle(HayameTheme.danger)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(HayameTheme.pageBackground)
            .navigationTitle("Open Dispute")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(saving ? "Submitting..." : "Submit") {
                        Task {
                            saving = true
                            let didSubmit = await onSubmit(reason)
                            saving = false
                            if didSubmit {
                                dismiss()
                            }
                        }
                    }
                    .bold()
                    .disabled(saving || reason.trimmingCharacters(in: .whitespacesAndNewlines).count < 5)
                }
            }
        }
    }
}

struct ProfileEditSheet: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme

    @State private var fullName = ""
    @State private var phone = ""
    @State private var region = MockDataService.defaultRegion
    @State private var city = ""
    @State private var avatarURL: String?
    @State private var avatarItem: PhotosPickerItem?
    @State private var isUploadingAvatar = false
    @State private var avatarUploadError: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Profile photo") {
                    HStack(spacing: 12) {
                        avatarPreview

                        VStack(alignment: .leading, spacing: 6) {
                            Text("Current profile photo")
                                .font(.hayame(size: 13, weight: .semibold))
                                .foregroundStyle(HayameTheme.brandNavy)
                            Text("Upload a clear headshot (JPG/PNG).")
                                .font(.hayame(size: 12, weight: .medium))
                                .foregroundStyle(HayameTheme.mutedText)
                        }
                    }

                    PhotosPicker(selection: $avatarItem, matching: .images) {
                        Text(isUploadingAvatar ? "Uploading..." : "Change photo")
                    }
                    .buttonStyle(SecondaryPillButtonStyle())
                    .disabled(isUploadingAvatar)

                    if let avatarUploadError, !avatarUploadError.isEmpty {
                        Text(avatarUploadError)
                            .font(.hayame(size: 12, weight: .semibold))
                            .foregroundStyle(HayameTheme.danger)
                    }
                }
                .listRowBackground(HayameTheme.cardBackground)

                Section("Personal details") {
                    TextField("Full name", text: $fullName)
                        .foregroundStyle(HayameTheme.brandNavy)
                    TextField("Phone", text: $phone)
                        .foregroundStyle(HayameTheme.brandNavy)
                    Picker("Region", selection: $region) {
                        ForEach(MockDataService.regionsIncluding(region), id: \.self) { item in
                            Text(item).tag(item)
                        }
                    }
                    .tint(HayameTheme.brandBlue)
                    Picker("City", selection: $city) {
                        ForEach(MockDataService.cities(for: region, preferred: city), id: \.self) { item in
                            Text(item).tag(item)
                        }
                    }
                    .tint(HayameTheme.brandBlue)
                }
                .listRowBackground(HayameTheme.cardBackground)
                .foregroundStyle(HayameTheme.brandNavy)
            }
            .scrollContentBackground(.hidden)
            .background(HayameTheme.pageBackground)
            .navigationTitle("Edit Profile")
            .toolbarBackground(HayameTheme.pageBackground, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarColorScheme(colorScheme, for: .navigationBar)
            .tint(HayameTheme.brandBlue)
            .onChange(of: region) { _, newValue in
                let options = MockDataService.cities(for: newValue, preferred: city)
                if !options.contains(where: { $0.caseInsensitiveCompare(city) == .orderedSame }) {
                    city = options.first ?? city
                }
            }
            .onChange(of: avatarItem) { _, newValue in
                guard let newValue else { return }
                Task {
                    await uploadAvatar(item: newValue)
                    avatarItem = nil
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        appState.saveProfile(
                            fullName: fullName,
                            city: city,
                            phone: phone,
                            region: region,
                            avatarURL: avatarURL
                        )
                        dismiss()
                    }
                    .bold()
                    .disabled(
                        fullName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ||
                        isUploadingAvatar
                    )
                }
            }
            .onAppear {
                fullName = appState.currentUser.fullName
                phone = appState.currentUser.phone
                region = MockDataService.normalizedRegion(appState.currentUser.region)
                city = appState.currentUser.city
                avatarURL = appState.currentUser.avatar
                avatarUploadError = nil
            }
        }
    }

    @ViewBuilder
    private var avatarPreview: some View {
        if let resolved = RemoteImageURLResolver.resolve(avatarURL) {
            CachedRemoteImage(url: resolved, targetSize: CGSize(width: 88, height: 88)) {
                Circle().fill(HayameTheme.brandLight)
            } failure: {
                fallbackAvatar
            }
            .frame(width: 64, height: 64)
            .clipShape(Circle())
        } else {
            fallbackAvatar
                .frame(width: 64, height: 64)
        }
    }

    private var fallbackAvatar: some View {
        let initials = fullName
            .split(separator: " ")
            .prefix(2)
            .compactMap { $0.first.map(String.init) }
            .joined()
            .uppercased()

        return Circle()
            .fill(HayameTheme.brandLight)
            .overlay(
                Text(initials.isEmpty ? "U" : initials)
                    .font(.hayame(size: 16, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
            )
    }

    @MainActor
    private func uploadAvatar(item: PhotosPickerItem) async {
        guard appState.isAuthenticated else {
            avatarUploadError = "Log in to upload profile photo."
            return
        }
        guard !isUploadingAvatar else { return }
        isUploadingAvatar = true
        avatarUploadError = nil
        defer { isUploadingAvatar = false }

        do {
            guard let original = try await item.loadTransferable(type: Data.self),
                  let image = UIImage(data: original),
                  let jpegData = image.jpegData(compressionQuality: 0.84) else {
                throw APIError(message: "Unable to read selected image.")
            }
            let uploaded = try await appState.uploadProfileAvatar(
                fileData: jpegData,
                fileExtension: "jpg",
                mimeType: "image/jpeg"
            )
            avatarURL = uploaded
        } catch {
            let message = AppState.userFacingMessage(error, fallback: "Something went wrong. Please try again.")
            avatarUploadError = message.isEmpty ? "Unable to upload profile photo." : message
        }
    }
}

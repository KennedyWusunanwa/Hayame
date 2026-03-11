import SwiftUI
import PhotosUI
import UIKit

struct RenterTabShell: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        TabView(selection: $appState.renterTab) {
            NavigationStack {
                RenterHomeScreen()
            }
            .tabItem {
                Label("Home", systemImage: "house")
            }
            .tag(RenterTab.home)

            NavigationStack {
                ExploreScreen()
            }
            .tabItem {
                Label("Explore", systemImage: "magnifyingglass")
            }
            .tag(RenterTab.explore)

            NavigationStack {
                TripsScreen()
            }
            .tabItem {
                Label("Trips", systemImage: "calendar")
            }
            .tag(RenterTab.trips)

            NavigationStack {
                FavoritesScreen()
            }
            .tabItem {
                Label("Saved", systemImage: "heart")
            }
            .tag(RenterTab.favorites)

            NavigationStack {
                InboxScreen()
            }
            .tabItem {
                Label("Inbox", systemImage: "message")
            }
            .badge(appState.unreadMessagesCount > 0 ? appState.unreadMessagesCount : 0)
            .tag(RenterTab.inbox)

            NavigationStack {
                GuestProfileScreen()
            }
            .tabItem {
                Label("Profile", systemImage: "person")
            }
            .tag(RenterTab.profile)

            NavigationStack {
                RenterDashboardScreen()
            }
            .tabItem {
                Label("Dashboard", systemImage: "rectangle.grid.2x2.fill")
            }
            .tag(RenterTab.dashboard)
        }
        .tint(HayameTheme.brandBlue)
    }
}

struct RenterHomeScreen: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 16) {
                HomeTopHeader(
                    user: appState.currentUser,
                    unreadCount: appState.unreadMessagesCount,
                    onProfileTap: {
                        appState.renterTab = .profile
                    },
                    onChatTap: {
                        appState.renterTab = .inbox
                    }
                )

                HeroBannerCard(
                    title: "Rent a Car, Anytime, Anywhere in Ghana.",
                    subtitle: "Rent car across Ghana",
                    buttonTitle: "Book Now"
                ) {
                    appState.renterTab = .explore
                }

                HomeQuickFiltersCard()
                    .environmentObject(appState)

                HStack(spacing: 10) {
                    SearchChip(title: appState.currentUser.city, icon: "mappin.circle")
                    SearchChip(title: appState.currentUser.region, icon: "globe")
                    SearchChip(title: "Economy", icon: "car.side")
                }

                HStack(spacing: 10) {
                    StatTile(title: "Cars Listed", value: "\(appState.cars.count)")
                    StatTile(title: "Approved Hosts", value: "24")
                }

                SectionHeader(title: "Featured cars", actionTitle: "Explore all") {
                    appState.renterTab = .explore
                }

                VStack(spacing: 12) {
                    ForEach(appState.cars.prefix(3), id: \.id) { car in
                        ZStack(alignment: .topTrailing) {
                            NavigationLink {
                                CarDetailScreen(car: car)
                            } label: {
                                HomeFeaturedCarRow(
                                    car: car,
                                    isFavorite: appState.favoriteCarIDs.contains(car.id),
                                    showsFavoriteButton: false
                                ) {
                                    appState.toggleFavorite(carID: car.id)
                                }
                            }
                            .buttonStyle(.plain)

                            FavoriteBadgeButton(isFavorite: appState.favoriteCarIDs.contains(car.id)) {
                                appState.toggleFavorite(carID: car.id)
                            }
                            .padding(8)
                        }
                    }
                }

                Button("View protection details") {
                    // Intentionally routed from profile for clean tab UX.
                    appState.renterTab = .profile
                }
                .buttonStyle(SecondaryPillButtonStyle())

                if let message = appState.syncErrorMessage, !message.isEmpty {
                    Text(message)
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.danger)
                }
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .toolbar(.hidden, for: .navigationBar)
    }
}

private struct HomeTopHeader: View {
    let user: UserProfile
    let unreadCount: Int
    let onProfileTap: () -> Void
    let onChatTap: () -> Void

    private var displayName: String {
        let trimmed = user.fullName.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? "Guest User" : trimmed
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
            Button(action: onProfileTap) {
                HStack(spacing: 10) {
                    avatarView

                    VStack(alignment: .leading, spacing: 2) {
                        Text(displayName)
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .lineLimit(1)
                        Text("Open profile")
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                }
            }
            .buttonStyle(.plain)

            Spacer()

            Button(action: onChatTap) {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: "message.fill")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .frame(width: 42, height: 42)
                        .background(Color.white)
                        .clipShape(Circle())
                        .overlay(Circle().stroke(Color.black.opacity(0.06), lineWidth: 1))

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
                Text(initials.isEmpty ? "U" : initials)
                    .font(.system(size: 12, weight: .bold, design: .rounded))
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
        .font(.system(size: 12, weight: .semibold, design: .rounded))
        .foregroundStyle(HayameTheme.brandNavy)
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(.white)
        .clipShape(Capsule())
        .overlay(Capsule().stroke(Color.black.opacity(0.08), lineWidth: 1))
    }
}

private struct HomeFeaturedCarRow: View {
    let car: Car
    let isFavorite: Bool
    var showsFavoriteButton: Bool = true
    let favoriteAction: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            NetworkOrFallbackImage(
                urlString: car.imageNames.first,
                targetSize: CGSize(width: 188, height: 144)
            )
                .frame(width: 94, height: 72)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

            VStack(alignment: .leading, spacing: 4) {
                Text("\(car.title) \(car.year)")
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)
                Text("\(car.city), \(car.region)")
                    .hayameCaptionStyle()
                Text("GHS\(car.dailyPrice)/day")
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandBlue)
            }

            Spacer()

            if showsFavoriteButton {
                Button(action: favoriteAction) {
                    Image(systemName: isFavorite ? "heart.fill" : "heart")
                        .foregroundStyle(isFavorite ? .red : HayameTheme.brandNavy)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(10)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.black.opacity(0.06), lineWidth: 1))
    }
}

private struct FavoriteBadgeButton: View {
    let isFavorite: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: isFavorite ? "heart.fill" : "heart")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(isFavorite ? Color.red : HayameTheme.brandNavy)
                .padding(8)
                .background(Color.white.opacity(0.96))
                .clipShape(Circle())
                .overlay(Circle().stroke(Color.black.opacity(0.08), lineWidth: 1))
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
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)

            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(HayameTheme.mutedText)
                TextField("Car, city, host", text: $appState.exploreSearchText)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            }
            .padding(10)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.black.opacity(0.06), lineWidth: 1))

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
                        Button(city) { appState.exploreFilters.city = city }
                    }
                } label: {
                    filterPill(title: appState.exploreFilters.city.isEmpty ? "Any city" : appState.exploreFilters.city)
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
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
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
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color.black.opacity(0.06), lineWidth: 1)
        )
    }

    private func filterPill(title: String) -> some View {
        HStack(spacing: 6) {
            Text(title)
                .lineLimit(1)
            Image(systemName: "chevron.down")
                .font(.system(size: 9, weight: .bold))
        }
        .font(.system(size: 11, weight: .semibold, design: .rounded))
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

    private let columns = [GridItem(.flexible()), GridItem(.flexible())]

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 14) {
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .foregroundStyle(HayameTheme.mutedText)
                    TextField("Search cars, cities, hosts", text: $appState.exploreSearchText)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .submitLabel(.search)

                    if !appState.exploreSearchText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        Button {
                            appState.exploreSearchText = ""
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .font(.system(size: 14, weight: .bold))
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
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                            .foregroundStyle(HayameTheme.brandBlue)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 6)
                            .background(HayameTheme.brandLight)
                            .clipShape(Capsule())
                    }

                    Button {
                        showFilters = true
                    } label: {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(HayameTheme.brandBlue)
                    }
                }
                .padding(12)
                .background(.white)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.black.opacity(0.06), lineWidth: 1))

                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(appState.filteredCars) { car in
                        ZStack(alignment: .topTrailing) {
                            NavigationLink {
                                CarDetailScreen(car: car)
                            } label: {
                                CarCardView(
                                    car: car,
                                    isFavorite: appState.favoriteCarIDs.contains(car.id),
                                    showsFavoriteButton: false,
                                    favoriteAction: {}
                                )
                            }
                            .buttonStyle(.plain)

                            FavoriteBadgeButton(isFavorite: appState.favoriteCarIDs.contains(car.id)) {
                                appState.toggleFavorite(carID: car.id)
                            }
                            .padding(8)
                        }
                    }
                }

                if appState.filteredCars.isEmpty {
                    EmptyStateView(
                        title: "No cars found",
                        message: "Try changing city, price range, or filter options.",
                        systemImage: "car.rear.and.tire.marks"
                    )
                }
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Explore")
        .sheet(isPresented: $showFilters) {
            NavigationStack {
                ExploreFilterSheet()
            }
        }
    }
}

private struct ExploreFilterSheet: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    private var modelOptions: [String] {
        MockDataService.models(
            for: appState.exploreFilters.brand,
            preferred: appState.exploreFilters.model
        )
    }

    var body: some View {
        Form {
            Section("Location") {
                Picker("Region", selection: $appState.exploreFilters.region) {
                    Text("Any").tag("")
                    ForEach(MockDataService.regionsIncluding(appState.exploreFilters.region), id: \.self) { region in
                        Text(region).tag(region)
                    }
                }

                Picker("City", selection: $appState.exploreFilters.city) {
                    Text("Any").tag("")
                    ForEach(
                        MockDataService.cities(
                            for: appState.exploreFilters.region,
                            preferred: appState.exploreFilters.city
                        ) + [""],
                        id: \.self
                    ) { city in
                        if !city.isEmpty {
                            Text(city).tag(city)
                        }
                    }
                }
            }

            Section("Vehicle") {
                Picker("Make", selection: $appState.exploreFilters.brand) {
                    Text("Any").tag("")
                    ForEach(MockDataService.makesIncluding(appState.exploreFilters.brand), id: \.self) { make in
                        Text(make).tag(make)
                    }
                }
                Picker("Model", selection: $appState.exploreFilters.model) {
                    Text("Any").tag("")
                    ForEach(modelOptions + [""], id: \.self) { model in
                        if !model.isEmpty {
                            Text(model).tag(model)
                        }
                    }
                }
                Picker("Type", selection: $appState.exploreFilters.carType) {
                    Text("Any").tag("")
                    ForEach(MockDataService.carTypes, id: \.self) { type in
                        Text(type).tag(type)
                    }
                }
                Picker("Transmission", selection: $appState.exploreFilters.transmission) {
                    Text("Any").tag("")
                    ForEach(MockDataService.transmissions, id: \.self) { value in
                        Text(value).tag(value)
                    }
                }
                Picker("Fuel", selection: $appState.exploreFilters.fuelType) {
                    Text("Any").tag("")
                    ForEach(MockDataService.fuels, id: \.self) { fuel in
                        Text(fuel).tag(fuel)
                    }
                }
            }

            Section("Price") {
                Stepper("Min price: GHS\(appState.exploreFilters.minPrice)", value: $appState.exploreFilters.minPrice, in: 50...5000, step: 50)
                Stepper("Max price: GHS\(appState.exploreFilters.maxPrice)", value: $appState.exploreFilters.maxPrice, in: 100...8000, step: 50)
            }

            Section("Options") {
                Toggle("Instant Book", isOn: $appState.exploreFilters.instantBookOnly)
                Toggle("Delivery available", isOn: $appState.exploreFilters.deliveryOnly)
                Toggle("Air conditioning", isOn: $appState.exploreFilters.acOnly)
            }
        }
        .navigationTitle("Filters")
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button("Reset") {
                    appState.exploreFilters = ExploreFilterState()
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button("Done") { dismiss() }
                    .bold()
            }
        }
        .onAppear {
            if !appState.exploreFilters.region.isEmpty {
                appState.exploreFilters.region = MockDataService.normalizedRegion(appState.exploreFilters.region)
            }
            let cities = MockDataService.cities(
                for: appState.exploreFilters.region,
                preferred: appState.exploreFilters.city
            )
            if !cities.contains(where: { $0.caseInsensitiveCompare(appState.exploreFilters.city) == .orderedSame }) {
                appState.exploreFilters.city = ""
            }
            if !appState.exploreFilters.brand.isEmpty {
                appState.exploreFilters.brand = MockDataService.normalizedMake(appState.exploreFilters.brand)
            }
            let models = MockDataService.models(
                for: appState.exploreFilters.brand,
                preferred: appState.exploreFilters.model
            )
            if !models.contains(where: { $0.caseInsensitiveCompare(appState.exploreFilters.model) == .orderedSame }) {
                appState.exploreFilters.model = ""
            }
        }
        .onChange(of: appState.exploreFilters.region) { _, newValue in
            guard !newValue.isEmpty else { return }
            let normalized = MockDataService.normalizedRegion(newValue)
            if normalized != appState.exploreFilters.region {
                appState.exploreFilters.region = normalized
                return
            }
            let cities = MockDataService.cities(for: normalized, preferred: appState.exploreFilters.city)
            if !cities.contains(where: { $0.caseInsensitiveCompare(appState.exploreFilters.city) == .orderedSame }) {
                appState.exploreFilters.city = ""
            }
        }
        .onChange(of: appState.exploreFilters.brand) { _, newValue in
            let normalized = MockDataService.normalizedMake(newValue)
            if normalized != appState.exploreFilters.brand {
                appState.exploreFilters.brand = normalized
                return
            }
            let models = MockDataService.models(for: normalized, preferred: appState.exploreFilters.model)
            if !models.contains(where: { $0.caseInsensitiveCompare(appState.exploreFilters.model) == .orderedSame }) {
                appState.exploreFilters.model = ""
            }
        }
    }
}

struct CarDetailScreen: View {
    @EnvironmentObject private var appState: AppState
    let seedCar: Car

    @State private var selectedImageIndex = 0
    @State private var startDate = Date()
    @State private var endDate = Calendar.current.date(byAdding: .day, value: 1, to: Date()) ?? Date()
    @State private var tripUseRegion: String
    @State private var tripUseCity: String
    @State private var tripUseAddress = ""
    @State private var reviewRating = 5
    @State private var reviewComment = ""
    @State private var reviewStatusMessage: String?
    @State private var showBookingSheet = false
    @State private var showGallery = false
    @State private var authGateMessage = ""
    @State private var showAuthGateAlert = false
    @State private var isCheckingAvailability = false
    @State private var availabilityMessage: String?

    init(car: Car) {
        self.seedCar = car
        _tripUseRegion = State(initialValue: MockDataService.normalizedRegion(car.region))
        _tripUseCity = State(initialValue: car.city)
    }

    private var car: Car {
        appState.cars.first(where: { $0.id == seedCar.id }) ??
            appState.ownedCars.first(where: { $0.id == seedCar.id }) ??
            seedCar
    }

    private var isFavorite: Bool {
        appState.favoriteCarIDs.contains(car.id)
    }

    private var daysCount: Int {
        max(1, Calendar.current.dateComponents([.day], from: startDate, to: endDate).day ?? 1)
    }

    private var subtotal: Int {
        car.dailyPrice * daysCount
    }

    private var platformFee: Int {
        Int(Double(subtotal) * 0.10)
    }

    private var insuranceFee: Int {
        max(car.insuranceFee, 0)
    }

    private var deliveryFee: Int {
        car.deliveryAvailable ? max(car.deliveryFee, 0) : 0
    }

    private var tripOutsideAccra: Bool {
        MockDataService.isLocationOutsideAccra(region: tripUseRegion, city: tripUseCity)
    }

    private var tripOutsideListingRegion: Bool {
        MockDataService.isOutsideListingRegion(tripRegion: tripUseRegion, listingRegion: car.region)
    }

    private var outsideAccraSurcharge: Int {
        tripOutsideListingRegion ? max(car.outsideAccraFee, 0) : 0
    }

    private var total: Int {
        subtotal + platformFee + insuranceFee + deliveryFee + outsideAccraSurcharge + max(car.depositAmount, 0)
    }

    private var galleryImages: [String] {
        car.imageNames.isEmpty ? [""] : car.imageNames
    }

    private var displayTitle: String {
        let titleLower = car.title.lowercased()
        if titleLower.contains(String(car.year)) {
            return car.title
        }
        return "\(car.title) \(car.year)"
    }

    private var addedDateLabel: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, yyyy"
        return formatter.string(from: car.createdAt)
    }

    private var carBrand: String {
        let trimmed = car.brand.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmed.isEmpty {
            return trimmed
        }
        return car.title.split(separator: " ").first.map(String.init) ?? "—"
    }

    private var carModel: String {
        let trimmed = car.model.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmed.isEmpty {
            return trimmed
        }
        let brandPart = carBrand
        if car.title.hasPrefix(brandPart) {
            return car.title.replacingOccurrences(of: brandPart, with: "").trimmingCharacters(in: .whitespacesAndNewlines)
        }
        return "—"
    }

    private var normalizedFeatures: [String] {
        var values = car.features.filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        if values.isEmpty {
            if car.airConditioning {
                values.append("Air Conditioning")
            }
            if car.instantBook {
                values.append("Instant Book")
            }
            if car.deliveryAvailable {
                values.append("Delivery Available")
            }
        }
        return Array(Set(values)).sorted()
    }

    private var cityOptions: [String] {
        MockDataService.cities(for: tripUseRegion, preferred: tripUseCity)
    }

    private var quickPrompts: [String] {
        [
            "Hi! Is this car available this week?",
            "Can I pick up the car in the morning?",
            "Do you offer delivery or pickup?",
            "What documents do you require?"
        ]
    }

    private var completedReviewBooking: Booking? {
        appState.renterBookings.first { $0.carID == car.id && $0.status == .completed }
    }

    private var canSubmitReview: Bool {
        appState.isAuthenticated && completedReviewBooking != nil
    }

    private var listingReviews: [Review] {
        let local = appState.listingReviewsByCarID[car.id] ?? []
        let hostScoped = appState.hostReviews.filter { $0.carID == car.id }
        return Array(Set(local + hostScoped)).sorted { $0.createdAt > $1.createdAt }
    }

    private var hostCars: [Car] {
        if !car.ownerID.isEmpty {
            return appState.cars.filter { $0.ownerID == car.ownerID }
        }
        return appState.cars.filter { $0.hostName == car.hostName }
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 8) {
                        Text("Car in \(car.city)")
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                            .foregroundStyle(HayameTheme.brandBlue)

                        Text(car.type)
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(HayameTheme.brandLight)
                            .clipShape(Capsule())

                        Text("Added \(addedDateLabel)")
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.black.opacity(0.04))
                            .clipShape(Capsule())
                    }

                    HStack(alignment: .top, spacing: 10) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(displayTitle)
                                .font(.system(size: 26, weight: .bold, design: .rounded))
                                .foregroundStyle(HayameTheme.brandNavy)
                            Text("\(car.city), \(car.region)")
                                .hayameCaptionStyle()
                            HStack(spacing: 8) {
                                Label(String(format: "%.1f", car.rating), systemImage: "star.fill")
                                    .font(.system(size: 12, weight: .bold, design: .rounded))
                                    .foregroundStyle(.orange)
                                Text("\(car.reviewsCount) reviews")
                                    .hayameCaptionStyle()
                            }
                        }

                        Spacer()

                        Button {
                            appState.toggleFavorite(carID: car.id)
                        } label: {
                            VStack(spacing: 4) {
                                Image(systemName: isFavorite ? "heart.fill" : "heart")
                                    .font(.system(size: 18, weight: .bold))
                                    .foregroundStyle(isFavorite ? .red : HayameTheme.brandNavy)
                                Text("Save to favorites")
                                    .font(.system(size: 10, weight: .semibold, design: .rounded))
                                    .foregroundStyle(HayameTheme.mutedText)
                            }
                            .padding(10)
                            .background(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(Color.black.opacity(0.08), lineWidth: 1)
                            )
                        }
                    }
                }
                .hayameCard()

                SectionHeader(title: "Car photo")
                VStack(spacing: 8) {
                    TabView(selection: $selectedImageIndex) {
                        ForEach(Array(galleryImages.enumerated()), id: \.offset) { idx, image in
                            NetworkOrFallbackImage(
                                urlString: image,
                                targetSize: CGSize(width: 900, height: 620)
                            )
                                .frame(height: 250)
                                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                                .tag(idx)
                        }
                    }
                    .tabViewStyle(.page(indexDisplayMode: .automatic))
                    .frame(height: 250)
                    .onTapGesture {
                        showGallery = true
                    }

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            ForEach(Array(galleryImages.enumerated()), id: \.offset) { idx, image in
                                Button {
                                    selectedImageIndex = idx
                                } label: {
                                    NetworkOrFallbackImage(
                                        urlString: image,
                                        targetSize: CGSize(width: 156, height: 112)
                                    )
                                    .frame(width: 78, height: 56)
                                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                                            .stroke(
                                                selectedImageIndex == idx ? HayameTheme.brandBlue : Color.black.opacity(0.08),
                                                lineWidth: selectedImageIndex == idx ? 2 : 1
                                            )
                                    )
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
                .hayameCard()

                SectionHeader(title: "Details")
                VStack(spacing: 8) {
                    CarDetailLine(label: "LOCATION", value: "\(car.city), \(car.region)")
                    CarDetailLine(label: "BRAND", value: carBrand)
                    CarDetailLine(label: "MODEL", value: carModel.isEmpty ? "—" : carModel)
                    CarDetailLine(label: "CAR TYPE", value: car.type)
                    CarDetailLine(label: "SEATS", value: "\(car.seats) seats")
                    CarDetailLine(label: "TRANSMISSION", value: car.transmission.lowercased())
                    CarDetailLine(label: "FUEL", value: car.fuelType.lowercased())
                    CarDetailLine(label: "REGION", value: car.region)
                }
                .hayameCard()

                SectionHeader(title: "Description")
                VStack(alignment: .leading, spacing: 8) {
                    Text(car.description)
                        .font(.system(size: 14, weight: .medium, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)
                }
                .hayameCard()

                SectionHeader(title: "Features")
                VStack(alignment: .leading, spacing: 8) {
                    if normalizedFeatures.isEmpty {
                        Text("No features listed.")
                            .font(.system(size: 13, weight: .semibold, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                    } else {
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 130), spacing: 8)], spacing: 8) {
                            ForEach(normalizedFeatures, id: \.self) { feature in
                                Text(feature)
                                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                                    .foregroundStyle(HayameTheme.brandNavy)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 8)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(HayameTheme.brandLight)
                                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                            }
                        }
                    }
                }
                .hayameCard()

                SectionHeader(title: "Latest reviews")
                VStack(alignment: .leading, spacing: 10) {
                    if listingReviews.isEmpty {
                        Text("No reviews yet. Be the first to share your experience.")
                            .font(.system(size: 13, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                    } else {
                        ForEach(listingReviews.prefix(3)) { review in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(review.guestName)
                                    .font(.system(size: 13, weight: .bold, design: .rounded))
                                    .foregroundStyle(HayameTheme.brandNavy)
                                Text(String(repeating: "★", count: max(1, min(5, review.rating))))
                                    .font(.system(size: 12, weight: .bold, design: .rounded))
                                    .foregroundStyle(.orange)
                                Text(review.comment.isEmpty ? "No comment provided." : review.comment)
                                    .font(.system(size: 12, weight: .medium, design: .rounded))
                                    .foregroundStyle(HayameTheme.mutedText)
                            }
                            .padding(10)
                            .background(Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .stroke(Color.black.opacity(0.05), lineWidth: 1)
                            )
                        }
                    }
                }
                .hayameCard()

                SectionHeader(title: "Leave a review")
                VStack(alignment: .leading, spacing: 10) {
                    InfoLine(label: "Trip", value: completedReviewBooking?.id ?? "No eligible completed trip")
                    HStack(spacing: 6) {
                        Text("Rating")
                            .font(.system(size: 13, weight: .bold, design: .rounded))
                            .foregroundStyle(HayameTheme.brandNavy)
                        Spacer()
                        ForEach(1...5, id: \.self) { star in
                            Button {
                                reviewRating = star
                            } label: {
                                Image(systemName: star <= reviewRating ? "star.fill" : "star")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundStyle(star <= reviewRating ? .orange : HayameTheme.mutedText)
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    TextEditor(text: $reviewComment)
                        .frame(minHeight: 90)
                        .padding(6)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .stroke(Color.black.opacity(0.08), lineWidth: 1)
                        )

                    Text(canSubmitReview
                        ? "Submit your review for a completed trip."
                        : "Only guests with completed trips can review this listing.")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(canSubmitReview ? HayameTheme.brandBlue : HayameTheme.mutedText)

                    Button("Submit review") {
                        Task {
                            guard let booking = completedReviewBooking else { return }
                            let ok = await appState.submitReview(
                                bookingID: booking.id,
                                rating: reviewRating,
                                comment: reviewComment
                            )
                            if ok {
                                reviewStatusMessage = "Review submitted."
                                reviewComment = ""
                                reviewRating = 5
                            } else {
                                reviewStatusMessage = appState.syncErrorMessage
                            }
                        }
                    }
                    .buttonStyle(PrimaryPillButtonStyle())
                    .disabled(!canSubmitReview || reviewComment.trimmingCharacters(in: .whitespacesAndNewlines).count < 3)

                    if let reviewStatusMessage, !reviewStatusMessage.isEmpty {
                        Text(reviewStatusMessage)
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                }
                .hayameCard()

                SectionHeader(title: "Availability")
                VStack(alignment: .leading, spacing: 10) {
                    InfoLine(label: "Status", value: car.isAvailable ? "Available" : "Unavailable")
                    Text("AVAILABILITY PREVIEW")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)

                    DatePicker("Start", selection: $startDate, displayedComponents: .date)
                    DatePicker("End", selection: $endDate, in: startDate..., displayedComponents: .date)

                    Button(isCheckingAvailability ? "Checking..." : "Check availability") {
                        Task { await checkAvailabilityNow() }
                    }
                    .disabled(isCheckingAvailability)
                        .buttonStyle(SecondaryPillButtonStyle())

                    if let availabilityMessage, !availabilityMessage.isEmpty {
                        Text(availabilityMessage)
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(availabilityMessage.localizedCaseInsensitiveContains("available")
                                ? HayameTheme.success
                                : HayameTheme.warning)
                    }
                }
                .hayameCard()

                SectionHeader(title: "Trip")
                VStack(alignment: .leading, spacing: 10) {
                    Text("GH₵\(car.dailyPrice) / day")
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text("Pay now with Paystack; host approval required before pickup.")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)
                    Text("Refunded if host rejects")
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.success)

                    Text("HOST VERIFICATION")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)
                    Label("ID Verified", systemImage: car.hostVerified ? "checkmark.seal.fill" : "xmark.seal")
                    Label("Phone Verified", systemImage: car.hostPhoneVerified ? "phone.badge.checkmark" : "phone.badge.xmark")
                    Label("Email Verified", systemImage: car.hostEmailVerified ? "envelope.badge.shield.half.filled" : "envelope.badge")

                    InfoLine(label: "Cancellation", value: car.cancellationPolicy)

                    Text("Quick select:")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandNavy)
                    HStack(spacing: 8) {
                        quickDateButton(title: "2 days", days: 2)
                        quickDateButton(title: "5 days", days: 5)
                        quickDateButton(title: "7 days", days: 7)
                    }

                    Text("TRIP USE LOCATION")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)
                    Text("Listing region: \(car.region)")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)

                    Picker("Region", selection: $tripUseRegion) {
                        ForEach(MockDataService.regionsIncluding(tripUseRegion), id: \.self) { region in
                            Text(region).tag(region)
                        }
                    }
                    .pickerStyle(.menu)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .stroke(Color.black.opacity(0.08), lineWidth: 1)
                    )
                    .onChange(of: tripUseRegion) { _, _ in
                        if !cityOptions.contains(tripUseCity) {
                            tripUseCity = cityOptions.first ?? car.city
                        }
                    }

                    Picker("City / district", selection: $tripUseCity) {
                        ForEach(cityOptions, id: \.self) { city in
                            Text(city).tag(city)
                        }
                    }
                    .pickerStyle(.menu)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .stroke(Color.black.opacity(0.08), lineWidth: 1)
                    )

                    TextField("Exact area / destination", text: $tripUseAddress)
                        .textFieldStyle(.plain)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .stroke(Color.black.opacity(0.08), lineWidth: 1)
                        )

                    Text(
                        tripOutsideListingRegion
                            ? (car.outsideAccraFee > 0
                                ? "Outside listing region trip (+GH₵\(max(car.outsideAccraFee, 0)))"
                                : "Outside listing region trip")
                            : "Within listing region (no outside-region surcharge)"
                    )
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(tripOutsideListingRegion ? HayameTheme.warning : HayameTheme.success)

                    if tripOutsideListingRegion {
                        Text("Trip use region differs from listing region (\(car.region)).")
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                    if tripOutsideAccra {
                        Text("Trip use location is also outside Accra.")
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                    }

                    InfoLine(label: "Daily rate x \(daysCount) day(s)", value: "GH₵\(subtotal)")
                    InfoLine(label: "Insurance fee", value: "GH₵\(insuranceFee)")
                    InfoLine(label: "Delivery fee", value: "GH₵\(deliveryFee)")
                    InfoLine(
                        label: outsideAccraSurcharge == 0 ? "Outside listing region surcharge (not applied)" : "Outside listing region surcharge",
                        value: "GH₵\(outsideAccraSurcharge)"
                    )
                    InfoLine(label: "Deposit", value: "GH₵\(car.depositAmount)")
                    Text("Final payable total is calculated by the server at checkout.")
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)

                    Button("View protection details") {
                        appState.renterTab = .profile
                    }
                    .buttonStyle(SecondaryPillButtonStyle())

                    Button(appState.isAuthenticated ? "Book Now" : "Log in to Book") {
                        if appState.isAuthenticated {
                            showBookingSheet = true
                        } else {
                            authGateMessage = "Create an account or log in to book this car."
                            showAuthGateAlert = true
                        }
                    }
                    .buttonStyle(PrimaryPillButtonStyle())
                }
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)
                .hayameCard()

                SectionHeader(title: "Host")
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 12) {
                        hostAvatar

                        VStack(alignment: .leading, spacing: 2) {
                            Text(car.hostName)
                                .font(.system(size: 16, weight: .bold, design: .rounded))
                                .foregroundStyle(HayameTheme.brandNavy)
                            Text(car.hostLevel.isEmpty ? "Verified Host" : car.hostLevel)
                                .font(.system(size: 12, weight: .bold, design: .rounded))
                                .foregroundStyle(HayameTheme.brandBlue)
                            Text(car.hostCity ?? car.city)
                                .font(.system(size: 12, weight: .medium, design: .rounded))
                                .foregroundStyle(HayameTheme.mutedText)
                        }
                    }

                    Label("ID Verified", systemImage: car.hostVerified ? "checkmark.seal.fill" : "xmark.seal")
                    Label("Phone Verified", systemImage: car.hostPhoneVerified ? "phone.badge.checkmark" : "phone.badge.xmark")
                    Label("Email Verified", systemImage: car.hostEmailVerified ? "envelope.badge.shield.half.filled" : "envelope.badge")
                    Text("Host level updates as verification and trip performance grow.")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)

                    NavigationLink("View host") {
                        HostPublicProfileScreen(hostName: car.hostName, hostAvatar: car.hostAvatar, hostCars: hostCars)
                    }
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandBlue)

                    Button("Message \(car.hostName)") {
                        openChatAndSend(message: quickPrompts.first)
                    }
                    .buttonStyle(SecondaryPillButtonStyle())

                    Text("Use a quick prompt to start the chat.")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)

                    ForEach(quickPrompts, id: \.self) { prompt in
                        Button(prompt) {
                            openChatAndSend(message: prompt)
                        }
                        .buttonStyle(SecondaryPillButtonStyle())
                    }

                    Button("Chat without message") {
                        openChatAndSend(message: nil)
                    }
                    .buttonStyle(SecondaryPillButtonStyle())
                }
                .hayameCard()
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Car Detail")
        .sheet(isPresented: $showBookingSheet) {
            BookingSheet(
                car: car,
                startDate: startDate,
                endDate: endDate,
                region: tripUseRegion,
                city: tripUseCity,
                address: tripUseAddress
            )
                .environmentObject(appState)
        }
        .fullScreenCover(isPresented: $showGallery) {
            CarImageGalleryFullScreen(images: galleryImages, selectedIndex: $selectedImageIndex)
        }
        .task(id: seedCar.id) {
            await appState.refreshCarDetail(carID: seedCar.id)
            let latest = appState.cars.first(where: { $0.id == seedCar.id }) ??
                appState.ownedCars.first(where: { $0.id == seedCar.id }) ??
                seedCar
            let urls = latest.imageNames.compactMap(RemoteImageURLResolver.resolve)
            await RemoteImagePipeline.shared.prefetch(
                urls: urls,
                limit: 40,
                targetPixelSize: CGSize(width: 1300, height: 900),
                maxConcurrent: 8
            )
        }
        .alert("Log in required", isPresented: $showAuthGateAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Log in") {
                appState.returnToAuth()
            }
        } message: {
            Text(authGateMessage)
        }
    }

    @ViewBuilder
    private var hostAvatar: some View {
        if let url = RemoteImageURLResolver.resolve(car.hostAvatar) {
            CachedRemoteImage(url: url, targetSize: CGSize(width: 54, height: 54)) {
                Circle().fill(HayameTheme.brandLight)
            } failure: {
                fallbackHostAvatar
            }
            .frame(width: 54, height: 54)
            .clipShape(Circle())
            .overlay(Circle().stroke(Color.black.opacity(0.08), lineWidth: 1))
        } else {
            fallbackHostAvatar
                .frame(width: 54, height: 54)
                .overlay(Circle().stroke(Color.black.opacity(0.08), lineWidth: 1))
        }
    }

    private var fallbackHostAvatar: some View {
        let initials = car.hostName
            .split(separator: " ")
            .prefix(2)
            .compactMap { $0.first.map(String.init) }
            .joined()
            .uppercased()
        return Circle()
            .fill(HayameTheme.brandLight)
            .overlay(
                Text(initials.isEmpty ? "H" : initials)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)
            )
    }

    private func quickDateButton(title: String, days: Int) -> some View {
        Button(title) {
            endDate = Calendar.current.date(byAdding: .day, value: days, to: startDate) ?? startDate
        }
        .buttonStyle(SecondaryPillButtonStyle())
    }

    @MainActor
    private func checkAvailabilityNow() async {
        guard !isCheckingAvailability else { return }
        isCheckingAvailability = true
        defer { isCheckingAvailability = false }

        if endDate <= startDate {
            availabilityMessage = "End date must be after start date."
            return
        }

        if let snapshot = await appState.checkAvailability(carID: car.id, start: startDate, end: endDate) {
            if snapshot.available {
                availabilityMessage = "Dates are available."
            } else {
                let reason = snapshot.reason?.trimmingCharacters(in: .whitespacesAndNewlines)
                availabilityMessage = reason?.isEmpty == false ? reason : "Selected dates are unavailable."
            }
        }
    }

    private func openChatAndSend(message: String?) {
        Task {
            guard appState.isAuthenticated else {
                authGateMessage = "Log in to send messages."
                showAuthGateAlert = true
                return
            }

            guard !car.ownerID.isEmpty else {
                appState.syncErrorMessage = "Host details are not available for this listing."
                return
            }

            guard let conversationID = await appState.ensureConversation(
                hostID: car.ownerID,
                carID: car.id,
                participantName: car.hostName
            ) else {
                return
            }

            appState.openConversationInInbox(
                conversationID: conversationID,
                participantName: car.hostName,
                draft: message
            )
        }
    }
}

private struct CarDetailLine: View {
    let label: String
    let value: String

    var body: some View {
        HStack(alignment: .top) {
            Text(label)
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.mutedText)
            Spacer()
            Text(value)
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)
                .multilineTextAlignment(.trailing)
        }
    }
}

private struct CarImageGalleryFullScreen: View {
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
                                    .font(.system(size: 42, weight: .bold))
                                    .foregroundStyle(.white.opacity(0.7))
                            }
                        } else {
                            Image(systemName: "photo")
                                .font(.system(size: 42, weight: .bold))
                                .foregroundStyle(.white.opacity(0.7))
                        }
                    }
                    .tag(idx)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .always))

            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 14, weight: .bold))
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
                    .font(.system(size: 12, weight: .bold, design: .rounded))
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

private struct BookingSheet: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    let car: Car
    let startDate: Date
    let endDate: Date

    @State private var region: String
    @State private var city: String
    @State private var address: String
    @State private var isProcessingPayment = false
    @State private var paymentMessage: String?

    init(car: Car, startDate: Date, endDate: Date, region: String, city: String, address: String) {
        self.car = car
        self.startDate = startDate
        self.endDate = endDate
        _region = State(initialValue: MockDataService.normalizedRegion(region))
        _city = State(initialValue: city)
        _address = State(initialValue: address)
    }

    private var nights: Int {
        max(1, Calendar.current.dateComponents([.day], from: startDate, to: endDate).day ?? 1)
    }

    private var subtotal: Int {
        car.dailyPrice * nights
    }

    private var insuranceFee: Int {
        max(car.insuranceFee, 0)
    }

    private var deliveryFee: Int {
        max(car.deliveryFee, 0)
    }

    private var depositAmount: Int {
        max(car.depositAmount, 0)
    }

    private var outsideAccraFeeValue: Int {
        max(car.outsideAccraFee, 0)
    }

    private var tripOutsideAccra: Bool {
        MockDataService.isLocationOutsideAccra(region: region, city: city)
    }

    private var tripOutsideListingRegion: Bool {
        MockDataService.isOutsideListingRegion(tripRegion: region, listingRegion: car.region)
    }

    private var outsideAccraSurcharge: Int {
        tripOutsideListingRegion ? outsideAccraFeeValue : 0
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Trip use location") {
                    Picker("Region", selection: $region) {
                        ForEach(MockDataService.regionsIncluding(region), id: \.self) { region in
                            Text(region).tag(region)
                        }
                    }
                    Picker("City", selection: $city) {
                        ForEach(MockDataService.cities(for: region, preferred: city), id: \.self) { item in
                            Text(item).tag(item)
                        }
                    }
                    TextField("Exact area / destination", text: $address)

                    Text(
                        tripOutsideListingRegion
                            ? (outsideAccraFeeValue > 0
                                ? "Outside listing region trip (+GHS\(outsideAccraFeeValue))"
                                : "Outside listing region trip")
                            : "Within listing region (no outside-region surcharge)"
                    )
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(tripOutsideListingRegion ? HayameTheme.warning : HayameTheme.success)

                    if tripOutsideListingRegion {
                        Text("Trip use region differs from listing region (\(car.region)).")
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                    if tripOutsideAccra {
                        Text("Trip use location is also outside Accra.")
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                }

                Section("Summary") {
                    InfoLine(label: "Car", value: "\(car.title) \(car.year)")
                    InfoLine(label: "Dates", value: "\(startDate.hayameDateLabel()) - \(endDate.hayameDateLabel())")
                    InfoLine(label: "Daily x \(nights)", value: "GHS\(subtotal)")
                    InfoLine(label: "Insurance fee", value: "GHS\(insuranceFee)")
                    InfoLine(label: "Delivery fee", value: "GHS\(deliveryFee)")
                    if outsideAccraFeeValue > 0 || tripOutsideListingRegion {
                        InfoLine(
                            label: tripOutsideListingRegion ? "Outside listing region surcharge" : "Outside listing region surcharge (not applied)",
                            value: "GHS\(outsideAccraSurcharge)"
                        )
                    }
                    InfoLine(label: "Deposit", value: "GHS\(depositAmount)")
                    Text("Final payable amount is calculated by the server during checkout.")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)
                }

                if let paymentMessage, !paymentMessage.isEmpty {
                    Section {
                        Text(paymentMessage)
                            .font(.system(size: 13, weight: .semibold, design: .rounded))
                            .foregroundStyle(HayameTheme.danger)
                    }
                }
            }
            .navigationTitle("Checkout")
            .onChange(of: region) { _, newValue in
                let options = MockDataService.cities(for: newValue, preferred: city)
                if !options.contains(where: { $0.caseInsensitiveCompare(city) == .orderedSame }) {
                    city = options.first ?? city
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(isProcessingPayment ? "Processing..." : "Pay Paystack") {
                        Task { await payWithPaystack() }
                    }
                    .bold()
                    .disabled(isProcessingPayment)
                }
            }
        }
    }

    @MainActor
    private func payWithPaystack() async {
        guard !isProcessingPayment else { return }
        isProcessingPayment = true
        paymentMessage = nil
        defer { isProcessingPayment = false }

        do {
            let checkout = try await appState.beginBookingPayment(
                for: car,
                region: region,
                city: city,
                address: address,
                start: startDate,
                end: endDate
            )

            guard let checkoutURL = URL(string: checkout.authorizationURL) else {
                throw APIError(message: "Invalid Paystack checkout URL returned by server.")
            }

            let callbackURL = try await InAppBrowserAuthenticator.shared.open(
                url: checkoutURL,
                callbackScheme: "hayame"
            )
            _ = try await appState.completeBookingPayment(checkout: checkout, callbackURL: callbackURL)
            dismiss()
        } catch {
            let message = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            paymentMessage = message.isEmpty ? "Unable to complete payment." : message
        }
    }
}

struct RenterDashboardScreen: View {
    @EnvironmentObject private var appState: AppState

    private var upcomingCount: Int {
        appState.renterBookings.filter { $0.endDate >= Date() }.count
    }

    private var pastCount: Int {
        appState.renterBookings.filter { $0.endDate < Date() }.count
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Dashboard")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandBlue)
                    Text("Welcome back")
                        .font(.system(size: 26, weight: .bold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text("Manage your bookings, favorites, and profile.")
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)
                }
                .hayameCard()

                HStack(spacing: 10) {
                    StatTile(title: "Upcoming trips", value: "\(upcomingCount)")
                    StatTile(title: "Past trips", value: "\(pastCount)")
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
                    appState.renterTab = .profile
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
                            .font(.system(size: 12, weight: .medium, design: .rounded))
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
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.warning)
                        NavigationLink("View application") {
                            BecomeHostScreen()
                        }
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandBlue)
                    }
                    .hayameCard()
                } else {
                    SectionHeader(title: "Become a Host")
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Apply to list your cars. Applications are typically reviewed within 1-2 business days.")
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                        NavigationLink("Host application") {
                            BecomeHostScreen()
                        }
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandBlue)
                    }
                    .hayameCard()
                }

                if let message = appState.syncErrorMessage, !message.isEmpty {
                    Text(message)
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.danger)
                }
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Dashboard")
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
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(HayameTheme.brandBlue)
                    .frame(width: 28, height: 28)
                    .background(HayameTheme.brandLight)
                    .clipShape(Circle())

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text(subtitle)
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(HayameTheme.mutedText)
            }
            .padding(12)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(Color.black.opacity(0.05), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

struct TripsScreen: View {
    @EnvironmentObject private var appState: AppState
    @State private var activeChatTarget: TripChatTarget?
    @State private var disputeBooking: Booking?

    private var upcoming: [Booking] {
        appState.renterBookings
            .filter { $0.endDate >= Date() }
            .sorted { $0.createdAt > $1.createdAt }
    }

    private var past: [Booking] {
        appState.renterBookings
            .filter { $0.endDate < Date() }
            .sorted { $0.createdAt > $1.createdAt }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                if !appState.isAuthenticated {
                    EmptyStateView(
                        title: "Guest mode",
                        message: "Log in to view your actual trip history and active bookings.",
                        systemImage: "person.crop.circle.badge.exclamationmark"
                    )
                } else if case .loading = appState.bookingsLoadState {
                    LoadingStateCard(title: "Loading bookings", message: "Syncing your latest trips.")
                } else if case .error(let message) = appState.bookingsLoadState {
                    ErrorStateCard(
                        title: "Bookings unavailable",
                        message: message,
                        actionTitle: "Retry"
                    ) {
                        appState.retryBookings()
                    }
                }

                SectionHeader(title: "Upcoming bookings")
                if upcoming.isEmpty {
                    EmptyStateView(title: "No upcoming trips", message: "Book your next ride from Explore.", systemImage: "calendar.badge.exclamationmark")
                } else {
                    ForEach(upcoming) { booking in
                        TripBookingCard(
                            booking: booking,
                            onMessage: { openBookingChat(for: booking) },
                            onDispute: { disputeBooking = booking }
                        )
                    }
                }

                SectionHeader(title: "Past trips")
                if past.isEmpty {
                    EmptyStateView(title: "No past trips", message: "Completed trips appear here.", systemImage: "clock.arrow.circlepath")
                } else {
                    ForEach(past) { booking in
                        TripBookingCard(
                            booking: booking,
                            onMessage: { openBookingChat(for: booking) },
                            onDispute: { disputeBooking = booking }
                        )
                    }
                }
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Trips")
        .navigationDestination(item: $activeChatTarget) { target in
            ChatThreadScreen(conversationID: target.id, participantName: target.participantName)
                .environmentObject(appState)
        }
        .sheet(item: $disputeBooking) { booking in
            TripDisputeSheet(booking: booking) { reason in
                await appState.openDispute(bookingID: booking.id, reason: reason)
            }
            .environmentObject(appState)
        }
    }

    private func openBookingChat(for booking: Booking) {
        guard appState.isAuthenticated else {
            appState.syncErrorMessage = "Log in to use messages."
            return
        }

        Task {
            if let existingConversation = booking.conversationID, !existingConversation.isEmpty {
                appState.markConversationRead(existingConversation)
                activeChatTarget = TripChatTarget(id: existingConversation, participantName: booking.hostName)
                return
            }

            guard !booking.hostID.isEmpty else {
                appState.syncErrorMessage = "Host details are not available for this booking."
                return
            }

            guard let conversationID = await appState.ensureConversation(
                hostID: booking.hostID,
                carID: booking.carID,
                participantName: booking.hostName
            ) else {
                return
            }

            appState.markConversationRead(conversationID)
            activeChatTarget = TripChatTarget(id: conversationID, participantName: booking.hostName)
        }
    }
}

private struct TripChatTarget: Identifiable, Hashable {
    let id: String
    let participantName: String
}

private struct TripBookingCard: View {
    let booking: Booking
    let onMessage: () -> Void
    let onDispute: () -> Void

    private var isPaid: Bool {
        booking.paymentStatus == .paid
    }

    private var tripUseLocation: String {
        [booking.tripUseAddress, booking.tripUseCity, booking.tripUseRegion]
            .filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
            .joined(separator: ", ")
    }

    private var tripMode: String {
        booking.deliveryFee > 0 ? "Delivery" : "Pickup"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 10) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(booking.carTitle)
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text("\(booking.hostName) • \(booking.tripUseCity), \(booking.tripUseRegion)")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 6) {
                    BookingStatusBadge(status: booking.status)
                    PaymentStatusBadge(status: booking.paymentStatus)
                }
            }

            TripProgressTracker(status: booking.status, startDate: booking.startDate, endDate: booking.endDate)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                TripDetailChip(label: "Dates", value: "\(booking.startDate.hayameDateLabel()) - \(booking.endDate.hayameDateLabel())")
                TripDetailChip(label: "Duration", value: "\(booking.nights) night(s)")
                TripDetailChip(label: "Trip mode", value: tripMode)
                TripDetailChip(label: "Use", value: tripUseLocation.isEmpty ? "N/A" : tripUseLocation)
                TripDetailChip(label: "Daily rate", value: "GHS\(booking.dailyRate)")
                TripDetailChip(label: "Subtotal", value: "GHS\(booking.subtotal)")
                TripDetailChip(label: "Platform fee", value: "GHS\(booking.platformFee)")
                TripDetailChip(label: "Insurance", value: "GHS\(booking.insuranceFee)")
                TripDetailChip(label: "Delivery fee", value: "GHS\(booking.deliveryFee)")
                TripDetailChip(label: "Outside region fee", value: "GHS\(booking.outsideAccraSurcharge)")
                TripDetailChip(label: "Deposit", value: "GHS\(booking.depositAmount)")
                TripDetailChip(label: "Total", value: "GHS\(booking.totalPrice)")
            }

            if let paymentReference = booking.paymentReference, !paymentReference.isEmpty {
                Text("Payment ref: \(paymentReference)")
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)
            }

            if let rejectionReason = booking.rejectionReason, !rejectionReason.isEmpty {
                Text("Rejection reason: \(rejectionReason)")
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(HayameTheme.danger)
                    .padding(.top, 2)
            }

            HStack(spacing: 10) {
                Button("Message host", action: onMessage)
                    .buttonStyle(SecondaryPillButtonStyle())

                if isPaid {
                    Button("Open dispute", action: onDispute)
                        .buttonStyle(SecondaryPillButtonStyle())
                }
            }
        }
        .hayameCard()
    }
}

private struct TripDisputeSheet: View {
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
                        .frame(minHeight: 130)
                }
                if let error = appState.syncErrorMessage, !error.isEmpty {
                    Section {
                        Text(error)
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(HayameTheme.danger)
                    }
                }
            }
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

private struct TripDetailChip: View {
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label.uppercased())
                .font(.system(size: 9, weight: .semibold, design: .rounded))
                .foregroundStyle(HayameTheme.mutedText)
            Text(value)
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(8)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .stroke(Color.black.opacity(0.05), lineWidth: 1)
        )
    }
}

private struct PaymentStatusBadge: View {
    let status: PaymentStatus

    var body: some View {
        Text(status.rawValue.capitalized)
            .font(.system(size: 10, weight: .bold, design: .rounded))
            .foregroundStyle(foreground)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(background)
            .clipShape(Capsule())
    }

    private var background: Color {
        switch status {
        case .paid: return HayameTheme.success.opacity(0.15)
        case .pending: return HayameTheme.warning.opacity(0.15)
        case .refunded, .failed: return HayameTheme.danger.opacity(0.15)
        }
    }

    private var foreground: Color {
        switch status {
        case .paid: return HayameTheme.success
        case .pending: return HayameTheme.warning
        case .refunded, .failed: return HayameTheme.danger
        }
    }
}

private struct TripProgressTracker: View {
    let status: BookingStatus
    let startDate: Date
    let endDate: Date

    private var labels: [String] {
        ["Pending", "Confirmed", "Ongoing", "Completed"]
    }

    private var cancelled: Bool {
        status == .cancelled || status == .rejected || status == .refunded
    }

    private var activeIndex: Int {
        if status == .completed {
            return 3
        }
        if status == .confirmed {
            let now = Date()
            if now >= startDate && now < endDate {
                return 2
            }
            return 1
        }
        return 0
    }

    var body: some View {
        if cancelled {
            HStack {
                Text("Cancelled")
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.danger)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(HayameTheme.danger.opacity(0.12))
                    .clipShape(Capsule())
                Spacer()
            }
        } else {
            HStack(spacing: 4) {
                ForEach(Array(labels.enumerated()), id: \.offset) { index, label in
                    Text(label)
                        .font(.system(size: 9, weight: .bold, design: .rounded))
                        .foregroundStyle(foreground(for: index))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 4)
                        .background(background(for: index))
                        .clipShape(Capsule())
                }
            }
        }
    }

    private func background(for index: Int) -> Color {
        if index < activeIndex {
            return HayameTheme.success.opacity(0.16)
        }
        if index == activeIndex {
            return HayameTheme.brandBlue.opacity(0.16)
        }
        return Color.gray.opacity(0.15)
    }

    private func foreground(for index: Int) -> Color {
        if index < activeIndex {
            return HayameTheme.success
        }
        if index == activeIndex {
            return HayameTheme.brandBlue
        }
        return HayameTheme.mutedText
    }
}

struct FavoritesScreen: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                SectionHeader(title: "Favorites")

                if !appState.isAuthenticated {
                    EmptyStateView(
                        title: "Log in to save cars",
                        message: "Favorites sync to your account and show here after sign in.",
                        systemImage: "person.crop.circle.badge.exclamationmark"
                    )
                } else if case .loading = appState.favoritesLoadState {
                    LoadingStateCard(title: "Loading favorites", message: "Fetching your saved cars.")
                } else if case .error(let message) = appState.favoritesLoadState {
                    ErrorStateCard(
                        title: "Favorites unavailable",
                        message: message,
                        actionTitle: "Retry"
                    ) {
                        appState.retryFavorites()
                    }
                } else if appState.favoriteCars.isEmpty {
                    EmptyStateView(title: "No saved cars", message: "Tap the heart on any listing to save it.", systemImage: "heart.slash")
                } else {
                    ForEach(appState.favoriteCars) { car in
                        ZStack(alignment: .topTrailing) {
                            NavigationLink {
                                CarDetailScreen(car: car)
                            } label: {
                                HomeFeaturedCarRow(car: car, isFavorite: true, showsFavoriteButton: false) {
                                    appState.toggleFavorite(carID: car.id)
                                }
                            }
                            .buttonStyle(.plain)

                            FavoriteBadgeButton(isFavorite: true) {
                                appState.toggleFavorite(carID: car.id)
                            }
                            .padding(8)
                        }
                    }
                }

                if appState.isAuthenticated {
                    HStack(spacing: 10) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("TOTAL FAVORITES")
                                .font(.system(size: 10, weight: .semibold, design: .rounded))
                                .foregroundStyle(HayameTheme.mutedText)
                            Text("\(appState.favoriteCars.count)")
                                .font(.system(size: 24, weight: .bold, design: .rounded))
                                .foregroundStyle(HayameTheme.brandNavy)
                        }
                        Spacer()
                        Image(systemName: "heart.fill")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundStyle(.red)
                            .frame(width: 44, height: 44)
                            .background(HayameTheme.brandLight)
                            .clipShape(Circle())
                    }
                    .hayameCard()
                }
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Saved")
    }
}

struct InboxScreen: View {
    @EnvironmentObject private var appState: AppState
    @State private var search = ""
    @State private var inboxTimer = Timer.publish(every: 10, on: .main, in: .common).autoconnect()
    @State private var activeChatTarget: TripChatTarget?

    private var filtered: [Conversation] {
        if search.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return appState.conversations
        }
        return appState.conversations.filter {
            $0.participantName.localizedCaseInsensitiveContains(search) ||
            $0.lastMessagePreview.localizedCaseInsensitiveContains(search)
        }
    }

    var body: some View {
        VStack(spacing: 12) {
            if !appState.isAuthenticated {
                EmptyStateView(
                    title: "Log in to use messages",
                    message: "Conversation history and live chat are available after sign in.",
                    systemImage: "person.crop.circle.badge.exclamationmark"
                )
                .padding(.horizontal, 16)

                Spacer()
            } else if case .loading = appState.conversationsLoadState {
                LoadingStateCard(title: "Loading messages", message: "Syncing conversations.")
                    .padding(.horizontal, 16)
                Spacer()
            } else if case .error(let message) = appState.conversationsLoadState {
                ErrorStateCard(
                    title: "Messages unavailable",
                    message: message,
                    actionTitle: "Retry"
                ) {
                    appState.retryConversations()
                }
                .padding(.horizontal, 16)
                Spacer()
            } else {
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .foregroundStyle(HayameTheme.mutedText)
                    TextField("Search", text: $search)
                }
                .padding(12)
                .background(.white)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.black.opacity(0.06), lineWidth: 1))
                .padding(.horizontal, 16)

                if filtered.isEmpty {
                    EmptyStateView(title: "No conversations", message: "Start chatting from a car detail page.", systemImage: "bubble.left.and.bubble.right")
                        .padding(.horizontal, 16)
                    Spacer()
                } else {
                    ScrollView {
                        VStack(spacing: 10) {
                            ForEach(filtered) { conversation in
                                Button {
                                    openConversation(conversation)
                                } label: {
                                    ConversationRowView(conversation: conversation)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(16)
                    }
                }
            }
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Messages")
        .navigationDestination(item: $activeChatTarget) { target in
            ChatThreadScreen(conversationID: target.id, participantName: target.participantName)
                .environmentObject(appState)
        }
        .onAppear {
            appState.refreshConversationsNow()
            openPendingConversationIfNeeded()
        }
        .onReceive(inboxTimer) { _ in
            appState.refreshConversationsNow()
        }
        .onChange(of: appState.pendingConversationID) { _, _ in
            openPendingConversationIfNeeded()
        }
        .onChange(of: appState.conversations.count) { _, _ in
            openPendingConversationIfNeeded()
        }
    }

    private func openConversation(_ conversation: Conversation) {
        appState.markConversationRead(conversation.id)
        activeChatTarget = TripChatTarget(id: conversation.id, participantName: conversation.participantName)
    }

    private func openPendingConversationIfNeeded() {
        guard let pendingID = appState.pendingConversationID else { return }
        let participantName = appState.conversations.first(where: { $0.id == pendingID })?.participantName ??
            appState.pendingConversationParticipantName ??
            "Chat"
        activeChatTarget = TripChatTarget(id: pendingID, participantName: participantName)
        appState.pendingConversationID = nil
        appState.pendingConversationParticipantName = nil
    }
}

struct ChatThreadScreen: View {
    @EnvironmentObject private var appState: AppState
    let conversationID: String
    let participantName: String

    @State private var draft = ""

    private var messages: [ChatMessage] {
        appState.messagesByConversation[conversationID] ?? []
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(messages) { message in
                            ChatBubble(message: message)
                                .id(message.id)
                        }
                    }
                    .padding(16)
                }
                .onAppear {
                    appState.startRealtimeMessages(for: conversationID)
                    if draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
                       let queuedDraft = appState.consumePendingConversationDraft(for: conversationID) {
                        draft = queuedDraft
                    }
                    if let last = messages.last {
                        proxy.scrollTo(last.id, anchor: .bottom)
                    }
                }
                .onDisappear {
                    appState.stopRealtimeMessages()
                }
                .onChange(of: messages.count) { _, _ in
                    if let last = messages.last {
                        proxy.scrollTo(last.id, anchor: .bottom)
                    }
                }
            }

            HStack(spacing: 10) {
                TextField(appState.isAuthenticated ? "Type message" : "Log in to send a message", text: $draft)
                    .padding(12)
                    .background(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.black.opacity(0.06), lineWidth: 1))
                    .disabled(!appState.isAuthenticated)

                Button {
                    appState.addMessage(conversationID: conversationID, body: draft, mine: true)
                    draft = ""
                } label: {
                    Image(systemName: "paperplane.fill")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 42, height: 42)
                        .background(HayameTheme.brandBlue)
                        .clipShape(Circle())
                }
                .disabled(!appState.isAuthenticated)
            }
            .padding(12)
            .background(HayameTheme.pageBackground)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle(participantName)
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct GuestProfileScreen: View {
    @EnvironmentObject private var appState: AppState
    @State private var showEditProfile = false

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 12) {
                        profileAvatar

                        VStack(alignment: .leading, spacing: 3) {
                            Text(appState.isAuthenticated ? appState.currentUser.fullName : "Guest User")
                                .font(.system(size: 20, weight: .bold, design: .rounded))
                                .foregroundStyle(HayameTheme.brandNavy)
                            Text(
                                appState.isAuthenticated
                                    ? appState.currentUser.email
                                    : "Browsing in guest mode"
                            )
                            .font(.system(size: 13, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                        }
                        Spacer()
                    }

                    InfoLine(label: "Location", value: "\(appState.currentUser.city), \(appState.currentUser.region)")
                    if appState.isAuthenticated && !appState.currentUser.phone.isEmpty {
                        InfoLine(label: "Phone", value: appState.currentUser.phone)
                    }

                    if appState.isAuthenticated {
                        Button("Edit profile") {
                            showEditProfile = true
                        }
                        .buttonStyle(SecondaryPillButtonStyle())
                    }
                }
                .hayameCard()

                SectionHeader(title: "Profile settings")
                VStack(spacing: 10) {
                    profileActionButton(title: "Edit profile", systemImage: "pencil") {
                        showEditProfile = true
                    }
                    profileActionButton(title: "Trips", systemImage: "calendar") {
                        appState.renterTab = .trips
                    }
                    profileActionButton(title: "Messages", systemImage: "message") {
                        appState.renterTab = .inbox
                    }
                }
                .hayameCard()

                SectionHeader(title: "Hosting")
                VStack(alignment: .leading, spacing: 10) {
                    if appState.hostAccessState == .host {
                        Text("Host mode is enabled for this account.")
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                        Button("Open host dashboard") {
                            appState.switchToHostMode()
                        }
                        .buttonStyle(SecondaryPillButtonStyle())
                    } else if appState.hostAccessState == .pending {
                        if let hostApplication = appState.hostApplication {
                            InfoLine(label: "Application", value: hostApplication.status.rawValue.capitalized)
                        }
                        Text("Your host application is pending review.")
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(HayameTheme.warning)
                        NavigationLink("Review application", destination: BecomeHostScreen())
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                    } else {
                        NavigationLink("Become a Host", destination: BecomeHostScreen())
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                    }
                }
                .hayameCard()

                SectionHeader(title: "Support")
                VStack(alignment: .leading, spacing: 10) {
                    NavigationLink("Contact", destination: ContactScreen())
                    NavigationLink("Protection", destination: ProtectionScreen())
                    NavigationLink("Cancellation Policy", destination: CancellationPolicyScreen())
                    NavigationLink("Privacy", destination: PrivacyScreen())
                }
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)
                .hayameCard()

                if let message = appState.syncErrorMessage, !message.isEmpty {
                    Text(message)
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.danger)
                }

                if appState.isAuthenticated {
                    Button("Sign out", role: .destructive) {
                        appState.signOut()
                    }
                    .buttonStyle(SecondaryPillButtonStyle())
                } else {
                    Button("Log in / Sign up") {
                        appState.returnToAuth()
                    }
                    .buttonStyle(PrimaryPillButtonStyle())
                }
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Profile")
        .sheet(isPresented: $showEditProfile) {
            ProfileEditSheet()
                .environmentObject(appState)
        }
    }

    @ViewBuilder
    private var profileAvatar: some View {
        if let url = RemoteImageURLResolver.resolve(appState.currentUser.avatar) {
            CachedRemoteImage(url: url, targetSize: CGSize(width: 58, height: 58)) {
                Circle().fill(HayameTheme.brandLight)
            } failure: {
                fallbackAvatar
            }
            .frame(width: 58, height: 58)
            .clipShape(Circle())
        } else {
            fallbackAvatar
                .frame(width: 58, height: 58)
        }
    }

    private var fallbackAvatar: some View {
        let initials = appState.currentUser.fullName
            .split(separator: " ")
            .prefix(2)
            .compactMap { $0.first.map(String.init) }
            .joined()
            .uppercased()

        return Circle()
            .fill(HayameTheme.brandLight)
            .overlay(
                Text(initials.isEmpty ? "U" : initials)
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)
            )
    }

    private func profileActionButton(title: String, systemImage: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Label(title, systemImage: systemImage)
                Spacer()
                Image(systemName: "chevron.right")
            }
            .font(.system(size: 14, weight: .semibold, design: .rounded))
            .foregroundStyle(HayameTheme.brandNavy)
        }
        .buttonStyle(.plain)
    }
}

private struct ProfileEditSheet: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

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
                                .font(.system(size: 13, weight: .semibold, design: .rounded))
                                .foregroundStyle(HayameTheme.brandNavy)
                            Text("Upload a clear headshot (JPG/PNG).")
                                .font(.system(size: 12, weight: .medium, design: .rounded))
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
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(HayameTheme.danger)
                    }
                }

                Section("Personal details") {
                    TextField("Full name", text: $fullName)
                    TextField("Phone", text: $phone)
                    Picker("Region", selection: $region) {
                        ForEach(MockDataService.regionsIncluding(region), id: \.self) { item in
                            Text(item).tag(item)
                        }
                    }
                    Picker("City", selection: $city) {
                        ForEach(MockDataService.cities(for: region, preferred: city), id: \.self) { item in
                            Text(item).tag(item)
                        }
                    }
                }
            }
            .navigationTitle("Edit Profile")
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
                    .font(.system(size: 16, weight: .bold, design: .rounded))
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
            let message = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            avatarUploadError = message.isEmpty ? "Unable to upload profile photo." : message
        }
    }
}

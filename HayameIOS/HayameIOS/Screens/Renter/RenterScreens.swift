import SwiftUI
import PhotosUI
import UIKit
import CoreLocation

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
        VStack(spacing: 0) {
            activeContent
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .clipped()
            HayameBottomTabBar(selection: $appState.renterTab, items: renterTabItems)
        }
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

    @ViewBuilder
    private var activeContent: some View {
        switch appState.renterTab {
        case .home:
            NavigationStack { RenterHomeScreen() }
        case .explore:
            NavigationStack { ExploreScreen() }
        case .trips:
            NavigationStack { TripsScreen() }
        case .favorites:
            NavigationStack { FavoritesScreen() }
        case .more, .inbox, .profile, .dashboard:
            NavigationStack { GuestProfileScreen(requestedRoute: $moreRoute) }
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

struct RenterHomeScreen: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var locationManager = HomeLocationManager()
    @State private var selectedCategory = "All"
    @State private var homeSearchText = ""
    @State private var showHomeFilters = false

    private var availableCategories: [String] {
        let defaultTypes = ["SUV", "Sedan", "Electric", "Luxury", "Pickup", "Van", "Compact", "Convertible", "Minivan", "Crossover"]
        let types = appState.cars
            .map { $0.type.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        let unique = Array(Set(defaultTypes + types)).sorted()
        return ["All"] + unique
    }

    private var nearYouCars: [Car] {
        guard let coord = locationManager.coordinate else {
            let city = locationManager.cityName?.lowercased() ?? ""
            if city.isEmpty {
                return Array(appState.cars.prefix(5))
            }
            return appState.cars
                .map { car -> (Car, Double) in
                    (car, car.city.lowercased() == city ? 0.0 : 999.0)
                }
                .sorted { $0.1 < $1.1 }
                .prefix(5)
                .map { $0.0 }
        }

        let userLocation = CLLocation(latitude: coord.latitude, longitude: coord.longitude)
        return appState.cars
            .map { car -> (Car, Double) in
                guard let lat = car.latitude, let lng = car.longitude else {
                    let city = locationManager.cityName?.lowercased() ?? ""
                    let score = !city.isEmpty && car.city.lowercased() == city ? 0.0 : 999.0
                    return (car, score)
                }
                let carLocation = CLLocation(latitude: lat, longitude: lng)
                return (car, userLocation.distance(from: carLocation))
            }
            .sorted { $0.1 < $1.1 }
            .prefix(5)
            .map { $0.0 }
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 16) {
                HomeTopHeader(
                    user: appState.currentUser,
                    unreadCount: appState.unreadMessagesCount,
                    isAuthenticated: appState.isAuthenticated,
                    detectedCityName: locationManager.cityName,
                    onProfileTap: {
                        if appState.isAuthenticated {
                            appState.renterTab = .more
                        } else {
                            appState.returnToAuth()
                        }
                    },
                    onChatTap: {
                        appState.renterTab = .inbox
                    }
                )

                HStack(spacing: 10) {
                    HStack(spacing: 8) {
                        Image(systemName: "magnifyingglass")
                            .foregroundStyle(HayameTheme.mutedText)
                            .font(.system(size: 14))
                        TextField("Car, city, or host...", text: $homeSearchText)
                            .font(.system(size: 14, design: .rounded))
                            .autocorrectionDisabled()
                            .textInputAutocapitalization(.never)
                            .submitLabel(.search)
                            .onSubmit { applyHomeSearchToExplore() }
                        Spacer()
                        if !homeSearchText.isEmpty {
                            Button {
                                homeSearchText = ""
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundStyle(HayameTheme.mutedText)
                                    .font(.system(size: 14))
                            }
                            .buttonStyle(.plain)
                        }
                        Button {
                            showHomeFilters = true
                        } label: {
                            Image(systemName: "line.3.horizontal.decrease")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(.white)
                                .padding(10)
                                .background(HayameTheme.brandBlue)
                                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 12)
                    .background(HayameTheme.fieldBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

                    Button {
                        applyHomeSearchToExplore()
                    } label: {
                        Text("Search")
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 12)
                            .background(HayameTheme.brandBlue)
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }

                HomeCategoryPills(selected: $selectedCategory, categories: availableCategories)

                if case .loading = appState.publicCarsLoadState {
                    HomeNearYouPlaceholderSection()
                    HomePopularPicksPlaceholderSection()
                } else {
                    if !nearYouCars.isEmpty {
                        HomeNearYouSection(
                            cars: nearYouCars,
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
                        Button("See all") {
                            appState.renterTab = .explore
                        }
                        .font(.system(size: 13, weight: .medium, design: .rounded))
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
                    } else {
                        VStack(spacing: 12) {
                            ForEach(appState.cars.prefix(3), id: \.id) { car in
                                ZStack(alignment: .topTrailing) {
                                    NavigationLink {
                                        CarDetailScreen(car: car)
                                    } label: {
                                        HomeFeaturedCarRow(
                                            car: car,
                                            isFavorite: appState.favoriteCarIDs.contains(car.id),
                                            showsFavoriteButton: false,
                                            imageFrame: CGSize(width: 136, height: 104),
                                            targetImageSize: CGSize(width: 320, height: 240)
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
                    }
                }

                Button {
                    appState.renterTab = .explore
                } label: {
                    Text("Explore More")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryPillButtonStyle())

                if let message = appState.syncErrorMessage, !message.isEmpty {
                    Text(message)
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.danger)
                }
            }
            .padding(16)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(HayameTheme.pageBackground)
        .toolbar(.hidden, for: .navigationBar)
        .sheet(isPresented: $showHomeFilters) {
            NavigationStack {
                ExploreFilterSheet()
                    .environmentObject(appState)
            }
        }
        .onAppear {
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
}

private struct HomeTopHeader: View {
    let user: UserProfile
    let unreadCount: Int
    let isAuthenticated: Bool
    let detectedCityName: String?
    let onProfileTap: () -> Void
    let onChatTap: () -> Void

    private var displayName: String {
        let trimmed = user.fullName.trimmingCharacters(in: .whitespacesAndNewlines)
        if !isAuthenticated { return "Sign in or sign up" }
        return trimmed.isEmpty ? "Guest User" : trimmed
    }

    private var locationText: String {
        let city = user.city.trimmingCharacters(in: .whitespacesAndNewlines)
        let region = user.region.trimmingCharacters(in: .whitespacesAndNewlines)
        if !city.isEmpty { return city }
        if !region.isEmpty { return region }
        return detectedCityName?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
            ? detectedCityName!
            : "Ghana"
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
                            .font(.system(size: 16, weight: .bold, design: .rounded))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .lineLimit(1)
                        if isAuthenticated {
                            HStack(spacing: 4) {
                                Image(systemName: "mappin.circle.fill")
                                    .font(.system(size: 11))
                                    .foregroundStyle(HayameTheme.mutedText)
                                Text(locationText)
                                    .font(.system(size: 13, weight: .medium, design: .rounded))
                                    .foregroundStyle(HayameTheme.mutedText)
                                Image(systemName: "chevron.down")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundStyle(HayameTheme.brandBlue)
                            }
                        }
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
                    Button(cat) { selected = cat }
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(selected == cat ? HayameTheme.brandBlue : HayameTheme.chipBackground)
                        .foregroundStyle(selected == cat ? .white : HayameTheme.brandNavy)
                        .clipShape(Capsule())
                        .overlay(Capsule().stroke(HayameTheme.controlStroke, lineWidth: selected == cat ? 0 : 1))
                }
            }
        }
    }
}

private struct HomeNearYouSection: View {
    let cars: [Car]
    let favoriteIDs: Set<String>
    let onOpen: (Car) -> Void
    let onToggleFavorite: (String) -> Void
    let onSeeAll: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Near you")
                    .font(.system(size: 18, weight: .semibold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)
                Spacer()
                Button("See all", action: onSeeAll)
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(HayameTheme.brandBlue)
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 14) {
                    ForEach(cars.prefix(5), id: \.id) { car in
                        HomeNearYouCard(
                            car: car,
                            isFavorite: favoriteIDs.contains(car.id),
                            onOpen: { onOpen(car) },
                            onToggle: { onToggleFavorite(car.id) }
                        )
                    }
                }
            }
        }
    }
}

private struct HomeNearYouCard: View {
    let car: Car
    let isFavorite: Bool
    let onOpen: () -> Void
    let onToggle: () -> Void

    var body: some View {
        NavigationLink {
            CarDetailScreen(car: car)
        } label: {
            VStack(alignment: .leading, spacing: 0) {
                ZStack(alignment: .topTrailing) {
                    NetworkOrFallbackImage(urlString: car.imageNames.first, targetSize: CGSize(width: 520, height: 320))
                        .frame(width: 260, height: 160)
                        .clipped()
                    Button(action: onToggle) {
                        Image(systemName: isFavorite ? "heart.fill" : "heart")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(isFavorite ? .red : HayameTheme.brandNavy)
                            .padding(8)
                            .background(HayameTheme.floatingControlBackground)
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)
                    .padding(10)
                    if car.instantBook {
                        HStack(spacing: 4) {
                            Image(systemName: "bolt.fill")
                                .font(.system(size: 10, weight: .bold))
                            Text("Instant")
                                .font(.system(size: 11, weight: .semibold, design: .rounded))
                        }
                        .foregroundStyle(HayameTheme.success)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(HayameTheme.floatingControlBackground)
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                        .padding([.leading, .top], 10)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                    }
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text(car.displayTitle)
                        .font(.system(size: 15, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .lineLimit(1)
                    HStack {
                        Text("📍 \(car.city)")
                            .font(.system(size: 12, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                        Spacer()
                        if car.reviewsCount > 0 || car.isNewListing {
                            Label(car.reviewsCount > 0 ? String(format: "%.1f", car.rating) : "New", systemImage: "star.fill")
                                .font(.system(size: 12, weight: .semibold, design: .rounded))
                                .foregroundStyle(.orange)
                        }
                    }
                    Text("GHS \(car.dailyPrice)/day")
                        .font(.system(size: 15, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandBlue)
                }
                .padding(12)
            }
            .frame(width: 260)
            .background(HayameTheme.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(HayameTheme.cardStroke, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}

private struct HomeFeaturedCarRow: View {
    let car: Car
    let isFavorite: Bool
    var showsFavoriteButton: Bool = true
    var imageFrame: CGSize = CGSize(width: 94, height: 72)
    var targetImageSize: CGSize = CGSize(width: 188, height: 144)
    let favoriteAction: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            NetworkOrFallbackImage(
                urlString: car.imageNames.first,
                targetSize: targetImageSize
            )
                .frame(width: imageFrame.width, height: imageFrame.height)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

            VStack(alignment: .leading, spacing: 6) {
                Text(car.displayTitle)
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .lineLimit(2)
                Text("\(car.city), \(car.region)")
                    .hayameCaptionStyle()
                    .lineLimit(1)

                HStack(spacing: 8) {
                    if car.reviewsCount > 0 || car.isNewListing {
                        Label(car.reviewsCount > 0 ? String(format: "%.1f", car.rating) : "New", systemImage: "star.fill")
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                            .foregroundStyle(.orange)
                    }

                    if car.instantBook {
                        Text("Instant")
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                            .foregroundStyle(HayameTheme.success)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(HayameTheme.success.opacity(0.14))
                            .clipShape(Capsule())
                    }
                }

                Text("GHS\(car.dailyPrice)/day")
                    .font(.system(size: 15, weight: .bold, design: .rounded))
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
        .padding(12)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(HayameTheme.cardStroke, lineWidth: 1))
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
    @FocusState private var isSearchFieldFocused: Bool

    private let columns = [GridItem(.flexible(), spacing: 14), GridItem(.flexible(), spacing: 14)]
    private let popularVehicleBrands = ["Toyota", "Honda", "Kia", "Hyundai", "Range Rover", "Mercedes-Benz", "BMW", "Nissan", "Ford", "Mitsubishi"]

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
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 14) {
                PageTitle("Explore")

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

                    ExploreLayoutToggle(selectedLayout: appState.exploreLayoutMode) { layout in
                        appState.setExploreLayoutMode(layout)
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
                        LazyVGrid(columns: columns, spacing: 14) {
                            ForEach(0..<6, id: \.self) { _ in
                                ListingGridPlaceholderCard()
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
                        LazyVGrid(columns: columns, spacing: 14) {
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
                        .allowsHitTesting(!isSearchFieldFocused)
                    } else {
                        LazyVStack(spacing: 12) {
                            ForEach(appState.filteredCars) { car in
                                NavigationLink {
                                    CarDetailScreen(car: car)
                                } label: {
                                    ExploreListRow(
                                        car: car,
                                        isFavorite: appState.favoriteCarIDs.contains(car.id)
                                    ) {
                                        appState.toggleFavorite(carID: car.id)
                                    }
                                }
                                .buttonStyle(.plain)
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
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .toolbar(.hidden, for: .navigationBar)
        .scrollDismissesKeyboard(.interactively)
        .refreshable {
            await appState.refreshAllRemoteData()
        }
        .sheet(isPresented: $showFilters) {
            NavigationStack {
                ExploreFilterSheet()
            }
        }
    }
}

private struct PageTitle: View {
    let title: String

    init(_ title: String) {
        self.title = title
    }

    var body: some View {
        Text(title)
            .font(.system(size: 34, weight: .bold, design: .rounded))
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
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
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

private struct VehicleBrandLogo: View {
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
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(isSelected ? HayameTheme.brandBlue : HayameTheme.mutedText)
            } else {
                Text(monogram)
                    .font(.system(size: 14, weight: .black, design: .rounded))
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

private struct ExploreLayoutToggle: View {
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
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(isSelected ? HayameTheme.brandBlue : HayameTheme.brandNavy)
                .frame(width: 30, height: 30)
                .background(isSelected ? HayameTheme.brandBlue.opacity(0.14) : Color.clear)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(accessibilityLabel)
    }
}

private struct ExploreListRow: View {
    let car: Car
    let isFavorite: Bool
    let favoriteAction: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            NetworkOrFallbackImage(
                urlString: car.imageNames.first,
                targetSize: CGSize(width: 320, height: 240)
            )
                .frame(width: 136, height: 104)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

            VStack(alignment: .leading, spacing: 6) {
                Text(car.displayTitle)
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .lineLimit(2)

                Text("\(car.city), \(car.region)")
                    .hayameCaptionStyle()
                    .lineLimit(1)

                HStack(spacing: 8) {
                    Label(String(format: "%.1f", car.rating), systemImage: "star.fill")
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundStyle(.orange)

                    if car.instantBook {
                        Text("Instant")
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                            .foregroundStyle(HayameTheme.success)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(HayameTheme.success.opacity(0.14))
                            .clipShape(Capsule())
                    }
                }

                Text("GHS\(car.dailyPrice)/day")
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandBlue)
                    .lineLimit(1)
            }

            Spacer()

            FavoriteBadgeButton(isFavorite: isFavorite, action: favoriteAction)
        }
        .padding(12)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(HayameTheme.cardStroke, lineWidth: 1)
        )
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
            .listRowBackground(HayameTheme.cardBackground)

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
            .listRowBackground(HayameTheme.cardBackground)

            Section("Price") {
                Stepper("Min price: GHS\(appState.exploreFilters.minPrice)", value: $appState.exploreFilters.minPrice, in: 50...5000, step: 50)
                Stepper("Max price: GHS\(appState.exploreFilters.maxPrice)", value: $appState.exploreFilters.maxPrice, in: 100...8000, step: 50)
            }
            .listRowBackground(HayameTheme.cardBackground)

            Section("Options") {
                Toggle("Instant Book", isOn: $appState.exploreFilters.instantBookOnly)
                Toggle("Delivery available", isOn: $appState.exploreFilters.deliveryOnly)
                Toggle("Air conditioning", isOn: $appState.exploreFilters.acOnly)
            }
            .listRowBackground(HayameTheme.cardBackground)
        }
        .scrollContentBackground(.hidden)
        .background(HayameTheme.pageBackground)
        .foregroundStyle(HayameTheme.brandNavy)
        .tint(HayameTheme.brandBlue)
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
    @State private var blockedBookingDates: Set<Date> = []
    @State private var selectedQuickDuration: Int?
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
    @State private var showFloatingBookingBar = false
    @State private var isLoadingBookingAvailability = false
    @State private var activeDateField: BookingDateSelectionTarget?

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

    private var minimumEndDate: Date {
        Calendar.current.date(byAdding: .day, value: 1, to: startDate) ?? startDate
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

    private func openBookingFlow() {
        if appState.isAuthenticated {
            showBookingSheet = true
        } else {
            authGateMessage = "Create an account or log in to book this car."
            showAuthGateAlert = true
        }
    }

    var body: some View {
        ZStack(alignment: .bottom) {
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
                                .background(HayameTheme.subtleFill)
                                .clipShape(Capsule())
                        }

                        HStack(alignment: .top, spacing: 10) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(car.displayTitle)
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
                                .background(HayameTheme.elevatedBackground)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                                        .stroke(HayameTheme.controlStroke, lineWidth: 1)
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
                                                    selectedImageIndex == idx ? HayameTheme.brandBlue : HayameTheme.controlStroke,
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
                                .background(HayameTheme.elevatedBackground)
                                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                                        .stroke(HayameTheme.cardStroke, lineWidth: 1)
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
                            .scrollContentBackground(.hidden)
                            .foregroundStyle(HayameTheme.brandNavy)
                            .frame(minHeight: 90)
                            .padding(6)
                            .background(HayameTheme.fieldBackground)
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .stroke(HayameTheme.controlStroke, lineWidth: 1)
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
                        InfoLine(label: "Selected dates", value: "\(startDate.hayameDateLabel()) - \(endDate.hayameDateLabel())")

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

                        Text("TRIP DATES")
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                        BookingDateField(
                            title: "Start date",
                            date: startDate,
                            isLoadingAvailability: isLoadingBookingAvailability
                        ) {
                            activeDateField = .start
                        }
                        BookingDateField(
                            title: "End date",
                            date: endDate,
                            isLoadingAvailability: isLoadingBookingAvailability
                        ) {
                            activeDateField = .end
                        }
                        Text("Unavailable dates are crossed out. The first available trip day is selected automatically.")
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)

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
                        .background(HayameTheme.fieldBackground)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .stroke(HayameTheme.controlStroke, lineWidth: 1)
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
                        .background(HayameTheme.fieldBackground)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .stroke(HayameTheme.controlStroke, lineWidth: 1)
                        )

                        TextField("Exact area / destination", text: $tripUseAddress)
                            .textFieldStyle(.plain)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 10)
                            .background(HayameTheme.fieldBackground)
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .stroke(HayameTheme.controlStroke, lineWidth: 1)
                            )
                        Text("Minimum 3 characters.")
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)

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
                            appState.renterTab = .more
                        }
                        .buttonStyle(SecondaryPillButtonStyle())
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
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Car Detail")
        .safeAreaInset(edge: .bottom, spacing: 0) {
            if showFloatingBookingBar {
                FloatingBookingBar(pricePerDay: car.dailyPrice, action: openBookingFlow)
                    .padding(.horizontal, 16)
                    .padding(.top, 4)
                    .padding(.bottom, 8)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .sheet(isPresented: $showBookingSheet) {
            BookingSheet(
                car: car,
                startDate: startDate,
                endDate: endDate,
                region: tripUseRegion,
                city: tripUseCity,
                address: tripUseAddress,
                blockedDates: blockedBookingDates
            )
                .environmentObject(appState)
        }
        .sheet(item: $activeDateField) { target in
            BookingAvailabilityCalendarSheet(
                title: target.calendarTitle,
                selectedDate: target == .start ? startDate : endDate,
                selectionRange: startDate...endDate,
                blockedDates: blockedBookingDates,
                minimumDate: target == .start ? bookingDay(Date()) : bookingDay(minimumEndDate),
                canSelectDate: { date in
                    switch target {
                    case .start:
                        return isBookableStartDate(date, blockedDates: blockedBookingDates)
                    case .end:
                        return isBookableEndDate(date, startDate: startDate, blockedDates: blockedBookingDates)
                    }
                },
                onSelect: { selectedDate in
                    applyDateSelection(selectedDate, target: target)
                }
            )
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
        .task(id: "availability-\(seedCar.id)") {
            await loadBookingAvailabilityWindow()
        }
        .task(id: "floating-bar-\(seedCar.id)") {
            showFloatingBookingBar = false
            try? await Task.sleep(nanoseconds: 90_000_000)
            withAnimation(.spring(response: 0.42, dampingFraction: 0.88)) {
                showFloatingBookingBar = true
            }
        }
        .alert("Log in required", isPresented: $showAuthGateAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Log in") {
                appState.returnToAuth()
            }
        } message: {
            Text(authGateMessage)
        }
        .onChange(of: startDate) { _, newValue in
            if let adjustedEnd = preferredBookingEndDate(
                currentEnd: endDate,
                startDate: newValue,
                blockedDates: blockedBookingDates
            ) {
                endDate = adjustedEnd
            }
            if let selectedQuickDuration,
               endDate != bookingAddingDays(selectedQuickDuration, to: newValue) {
                self.selectedQuickDuration = nil
            }
        }
        .onChange(of: endDate) { _, newValue in
            if let selectedQuickDuration,
               newValue != bookingAddingDays(selectedQuickDuration, to: startDate) {
                self.selectedQuickDuration = nil
            }
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
            .overlay(Circle().stroke(HayameTheme.controlStroke, lineWidth: 1))
        } else {
            fallbackHostAvatar
                .frame(width: 54, height: 54)
                .overlay(Circle().stroke(HayameTheme.controlStroke, lineWidth: 1))
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
            applyQuickTripDuration(days)
        }
        .font(.system(size: 15, weight: .semibold, design: .rounded))
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(
            selectedQuickDuration == days ? HayameTheme.brandBlue : HayameTheme.brandLight,
            in: Capsule()
        )
        .foregroundStyle(selectedQuickDuration == days ? .white : HayameTheme.brandNavy)
        .overlay(
            Capsule()
                .stroke(
                    selectedQuickDuration == days ? HayameTheme.brandBlue : HayameTheme.brandBlue.opacity(0.25),
                    lineWidth: 1
                )
        )
        .buttonStyle(.plain)
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
            blockedBookingDates.formUnion(bookingDateSet(from: snapshot.blockedDates))
            if snapshot.available {
                availabilityMessage = "Dates are available."
            } else {
                let reason = snapshot.reason?.trimmingCharacters(in: .whitespacesAndNewlines)
                availabilityMessage = reason?.isEmpty == false ? reason : "Selected dates are unavailable."
            }
        }
    }

    @MainActor
    private func loadBookingAvailabilityWindow() async {
        guard !isLoadingBookingAvailability else { return }
        isLoadingBookingAvailability = true
        defer { isLoadingBookingAvailability = false }

        let today = bookingDay(Date())
        let searchEnd = bookingAddingDays(180, to: today)

        guard let snapshot = await appState.checkAvailability(carID: car.id, start: today, end: searchEnd) else {
            return
        }

        let blocked = bookingDateSet(from: snapshot.blockedDates)
        blockedBookingDates = blocked
        selectedQuickDuration = nil

        guard let nextStart = nextBookableStartDate(from: today, duration: 1, blockedDates: blocked) else {
            availabilityMessage = "No upcoming available dates in the next 6 months."
            return
        }

        let normalizedStart = bookingDay(startDate)
        let adjustedStart = isBookableStartDate(normalizedStart, blockedDates: blocked) ? normalizedStart : nextStart
        startDate = adjustedStart

        if let adjustedEnd = preferredBookingEndDate(
            currentEnd: endDate,
            startDate: adjustedStart,
            blockedDates: blocked
        ) {
            endDate = adjustedEnd
        }
    }

    private func applyQuickTripDuration(_ days: Int) {
        if let adjustedStart = nextBookableStartDate(from: startDate, duration: days, blockedDates: blockedBookingDates) {
            startDate = adjustedStart
            endDate = bookingAddingDays(days, to: adjustedStart)
            selectedQuickDuration = days
            availabilityMessage = nil
        } else {
            selectedQuickDuration = nil
            availabilityMessage = "No \(days)-day slot is available in the next 6 months."
        }
    }

    private func applyDateSelection(_ selectedDate: Date, target: BookingDateSelectionTarget) {
        switch target {
        case .start:
            let normalized = bookingDay(selectedDate)
            guard isBookableStartDate(normalized, blockedDates: blockedBookingDates) else { return }
            startDate = normalized
            if let adjustedEnd = preferredBookingEndDate(
                currentEnd: endDate,
                startDate: normalized,
                blockedDates: blockedBookingDates
            ) {
                endDate = adjustedEnd
            }
        case .end:
            let normalized = bookingDay(selectedDate)
            guard isBookableEndDate(normalized, startDate: startDate, blockedDates: blockedBookingDates) else { return }
            endDate = normalized
        }

        selectedQuickDuration = nil
        availabilityMessage = nil
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

private struct FloatingBookingBar: View {
    @Environment(\.colorScheme) private var colorScheme

    let pricePerDay: Int
    let action: () -> Void

    var body: some View {
        HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Price per day")
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .foregroundStyle(secondaryTextColor)

                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text("GHS \(pricePerDay)")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                        .foregroundStyle(primaryTextColor)
                    Text("/ day")
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                        .foregroundStyle(secondaryTextColor)
                }
            }

            Spacer(minLength: 12)

            Button(action: action) {
                Text("Book now")
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
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

private struct BookingSheet: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    let car: Car
    @State private var startDate: Date
    @State private var endDate: Date
    @State private var blockedDates: Set<Date>

    @State private var region: String
    @State private var city: String
    @State private var address: String
    @State private var tripMode: BookingTripMode?
    @State private var deliveryDetails = BookingDeliveryDetails()
    @State private var deliveryTimeSelection: Date
    @State private var isProcessingPayment = false
    @State private var paymentMessage: String?
    @State private var currentStep: BookingCheckoutStep = .tripDetails
    @State private var isMovingForward = true
    @State private var isLoadingAvailability = false
    @State private var activeDateField: BookingDateSelectionTarget?
    @State private var selectedQuickDuration: Int?

    init(car: Car, startDate: Date, endDate: Date, region: String, city: String, address: String, blockedDates: Set<Date> = []) {
        self.car = car
        _startDate = State(initialValue: startDate)
        _endDate = State(initialValue: endDate > startDate ? endDate : (Calendar.current.date(byAdding: .day, value: 1, to: startDate) ?? startDate))
        _blockedDates = State(initialValue: blockedDates)
        _region = State(initialValue: MockDataService.normalizedRegion(region))
        _city = State(initialValue: city)
        _address = State(initialValue: address)
        _tripMode = State(initialValue: car.deliveryAvailable ? nil : .pickup)
        _deliveryTimeSelection = State(initialValue: Self.defaultDeliveryTime())
    }

    private static func defaultDeliveryTime() -> Date {
        let calendar = Calendar.current
        let roundedHour = calendar.dateInterval(of: .hour, for: Date())?.start ?? Date()
        return calendar.date(byAdding: .hour, value: 1, to: roundedHour) ?? roundedHour
    }

    private static let deliveryTimeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter
    }()

    private static let deliveryTimeLabelFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return formatter
    }()

    private var minimumEndDate: Date {
        Calendar.current.date(byAdding: .day, value: 1, to: startDate) ?? startDate
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

    private var selectedTripMode: BookingTripMode {
        tripMode ?? .pickup
    }

    private var deliveryFee: Int {
        selectedTripMode == .delivery ? max(car.deliveryFee, 0) : 0
    }

    private var depositAmount: Int {
        max(car.depositAmount, 0)
    }

    private var outsideAccraFeeValue: Int {
        max(car.outsideAccraFee, 0)
    }

    private var tripOutsideListingRegion: Bool {
        MockDataService.isOutsideListingRegion(tripRegion: region, listingRegion: car.region)
    }

    private var outsideAccraSurcharge: Int {
        tripOutsideListingRegion ? outsideAccraFeeValue : 0
    }

    private var totalAmount: Int {
        subtotal + insuranceFee + deliveryFee + outsideAccraSurcharge + depositAmount
    }

    private var deliveryDetailsPayload: BookingDeliveryDetails {
        BookingDeliveryDetails(
            address: deliveryDetails.address,
            time: Self.deliveryTimeFormatter.string(from: deliveryTimeSelection),
            contactPhone: deliveryDetails.contactPhone,
            notes: deliveryDetails.notes
        )
    }

    private var deliveryTimeLabel: String {
        Self.deliveryTimeLabelFormatter.string(from: deliveryTimeSelection)
    }

    private var listingImageURL: URL? {
        car.imageNames.compactMap(RemoteImageURLResolver.resolve).first
    }

    private var locationHelperText: String {
        if tripOutsideListingRegion {
            return outsideAccraFeeValue > 0
                ? "Outside listing region (+GHS \(outsideAccraFeeValue))"
                : "Outside listing region"
        }
        return "Within listing region (no extra charges)"
    }

    private var resolvedDestination: String {
        let trimmedAddress = address.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmedAddress.isEmpty ? city : trimmedAddress
    }

    private var primaryButtonTitle: String {
        currentStep == .payment
            ? (isProcessingPayment ? "Processing..." : "Make payment")
            : "Next"
    }

    private var stepTransition: AnyTransition {
        let insertionEdge: Edge = isMovingForward ? .trailing : .leading
        let removalEdge: Edge = isMovingForward ? .leading : .trailing
        return .asymmetric(
            insertion: .move(edge: insertionEdge).combined(with: .opacity),
            removal: .move(edge: removalEdge).combined(with: .opacity)
        )
    }

    var body: some View {
        NavigationStack {
            ZStack {
                HayameTheme.pageBackground.ignoresSafeArea()

                VStack(spacing: 0) {
                    BookingProgressHeader(currentStep: currentStep)
                        .padding(.horizontal, 16)
                        .padding(.top, 8)
                        .padding(.bottom, 10)

                    ZStack {
                        currentStepContent
                            .id(currentStep)
                            .transition(stepTransition)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                }
            }
            .navigationTitle(currentStep.navigationTitle)
            .navigationBarTitleDisplayMode(.inline)
            .safeAreaInset(edge: .bottom, spacing: 0) {
                VStack(spacing: 10) {
                    if let paymentMessage, !paymentMessage.isEmpty {
                        Text(paymentMessage)
                            .font(.system(size: 13, weight: .semibold, design: .rounded))
                            .foregroundStyle(HayameTheme.danger)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Button(action: handlePrimaryAction) {
                        HStack(spacing: 10) {
                            if isProcessingPayment && currentStep == .payment {
                                ProgressView().tint(.white)
                            }
                            Text(primaryButtonTitle)
                        }
                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(
                            LinearGradient(
                                colors: [HayameTheme.brandBlue, HayameTheme.primaryButtonEnd],
                                startPoint: .leading,
                                endPoint: .trailing
                            ),
                            in: RoundedRectangle(cornerRadius: 18, style: .continuous)
                        )
                        .foregroundStyle(.white)
                        .contentShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .shadow(color: HayameTheme.brandBlue.opacity(0.24), radius: 10, x: 0, y: 6)
                    .disabled(isProcessingPayment)

                    Text(currentStep.footerNote)
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(.horizontal, 16)
                .padding(.top, 12)
                .padding(.bottom, 8)
                .background(.ultraThinMaterial)
                .overlay(alignment: .top) {
                    Rectangle()
                        .fill(HayameTheme.bottomBarSeparator)
                        .frame(height: 1)
                }
            }
            .onChange(of: startDate) { _, newValue in
                if let adjustedEnd = preferredBookingEndDate(
                    currentEnd: endDate,
                    startDate: newValue,
                    blockedDates: blockedDates
                ) {
                    endDate = adjustedEnd
                }
                if let selectedQuickDuration,
                   endDate != bookingAddingDays(selectedQuickDuration, to: newValue) {
                    self.selectedQuickDuration = nil
                }
            }
            .onChange(of: endDate) { _, newValue in
                if let selectedQuickDuration,
                   newValue != bookingAddingDays(selectedQuickDuration, to: startDate) {
                    self.selectedQuickDuration = nil
                }
            }
            .onChange(of: region) { _, newValue in
                let options = MockDataService.cities(for: newValue, preferred: city)
                if !options.contains(where: { $0.caseInsensitiveCompare(city) == .orderedSame }) {
                    city = options.first ?? city
                }
            }
            .onChange(of: tripMode) { _, newValue in
                guard newValue == .delivery else { return }
                if deliveryDetails.contactPhone.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    deliveryDetails.contactPhone = appState.currentUser.phone
                }
            }
            .task(id: "booking-availability-\(car.id)") {
                await loadBookingAvailabilityWindow()
            }
            .sheet(item: $activeDateField) { target in
                BookingAvailabilityCalendarSheet(
                    title: target.calendarTitle,
                    selectedDate: target == .start ? startDate : endDate,
                    selectionRange: startDate...endDate,
                    blockedDates: blockedDates,
                    minimumDate: target == .start ? bookingDay(Date()) : bookingDay(minimumEndDate),
                    canSelectDate: { date in
                        switch target {
                        case .start:
                            return isBookableStartDate(date, blockedDates: blockedDates)
                        case .end:
                            return isBookableEndDate(date, startDate: startDate, blockedDates: blockedDates)
                        }
                    },
                    onSelect: { selectedDate in
                        applyDateSelection(selectedDate, target: target)
                    }
                )
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        if currentStep == .tripDetails {
                            dismiss()
                        } else {
                            goBack()
                        }
                    } label: {
                        Text(currentStep == .tripDetails ? "Cancel" : "Back")
                    }
                }
            }
            .overlay {
                if isProcessingPayment {
                    PaymentProcessingOverlay()
                }
            }
            .animation(.easeInOut(duration: 0.2), value: isProcessingPayment)
        }
    }

    private func quickDateButton(title: String, days: Int) -> some View {
        Button {
            applyQuickTripDuration(days)
        } label: {
            Text(title)
                .font(.system(size: 15, weight: .semibold, design: .rounded))
                .foregroundStyle(selectedQuickDuration == days ? .white : HayameTheme.brandNavy)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(
                    selectedQuickDuration == days ? HayameTheme.brandBlue : HayameTheme.brandLight,
                    in: RoundedRectangle(cornerRadius: 16, style: .continuous)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(
                            selectedQuickDuration == days ? HayameTheme.brandBlue : HayameTheme.brandBlue.opacity(0.18),
                            lineWidth: 1
                        )
                )
        }
        .buttonStyle(.plain)
    }

    @MainActor
    private func loadBookingAvailabilityWindow() async {
        guard !isLoadingAvailability else { return }
        isLoadingAvailability = true
        defer { isLoadingAvailability = false }

        let today = bookingDay(Date())
        let searchEnd = bookingAddingDays(180, to: today)

        guard let snapshot = await appState.checkAvailability(carID: car.id, start: today, end: searchEnd) else {
            return
        }

        let normalizedBlockedDates = bookingDateSet(from: snapshot.blockedDates)
        blockedDates = normalizedBlockedDates
        selectedQuickDuration = nil

        guard let nextStart = nextBookableStartDate(from: today, duration: 1, blockedDates: normalizedBlockedDates) else {
            paymentMessage = "No upcoming available dates in the next 6 months."
            return
        }

        let normalizedStart = bookingDay(startDate)
        let adjustedStart = isBookableStartDate(normalizedStart, blockedDates: normalizedBlockedDates) ? normalizedStart : nextStart
        startDate = adjustedStart

        if let adjustedEnd = preferredBookingEndDate(
            currentEnd: endDate,
            startDate: adjustedStart,
            blockedDates: normalizedBlockedDates
        ) {
            endDate = adjustedEnd
        }
    }

    private func applyQuickTripDuration(_ days: Int) {
        if let adjustedStart = nextBookableStartDate(from: startDate, duration: days, blockedDates: blockedDates) {
            startDate = adjustedStart
            endDate = bookingAddingDays(days, to: adjustedStart)
            selectedQuickDuration = days
            paymentMessage = nil
        } else {
            selectedQuickDuration = nil
            paymentMessage = "No \(days)-day slot is available in the next 6 months."
        }
    }

    private func applyDateSelection(_ selectedDate: Date, target: BookingDateSelectionTarget) {
        switch target {
        case .start:
            let normalized = bookingDay(selectedDate)
            guard isBookableStartDate(normalized, blockedDates: blockedDates) else { return }
            startDate = normalized
            if let adjustedEnd = preferredBookingEndDate(
                currentEnd: endDate,
                startDate: normalized,
                blockedDates: blockedDates
            ) {
                endDate = adjustedEnd
            }
        case .end:
            let normalized = bookingDay(selectedDate)
            guard isBookableEndDate(normalized, startDate: startDate, blockedDates: blockedDates) else { return }
            endDate = normalized
        }

        selectedQuickDuration = nil
        paymentMessage = nil
    }

    @ViewBuilder
    private var currentStepContent: some View {
        switch currentStep {
	        case .tripDetails:
	            ScrollView {
	                VStack(alignment: .leading, spacing: 18) {
	                    BookingSheetCard {
	                        VStack(alignment: .leading, spacing: 8) {
	                            Text("Your trip")
	                                .font(.system(size: 14, weight: .bold, design: .rounded))
	                                .foregroundStyle(HayameTheme.brandNavy)
	                            Text("\(nights) day\(nights == 1 ? "" : "s")")
	                                .font(.system(size: 26, weight: .bold, design: .rounded))
	                                .foregroundStyle(HayameTheme.brandBlue)
	                            Text("Choose dates below. Unavailable and booked days are blocked automatically.")
	                                .font(.system(size: 13, weight: .medium, design: .rounded))
	                                .foregroundStyle(HayameTheme.mutedText)
	                        }
	                    }

	                    BookingSheetCard {
	                        VStack(alignment: .leading, spacing: 18) {
                            BookingDateField(
                                title: "Start date",
                                date: startDate,
                                isLoadingAvailability: isLoadingAvailability
                            ) {
                                activeDateField = .start
                            }
                            BookingDateField(
                                title: "End date",
                                date: endDate,
                                isLoadingAvailability: isLoadingAvailability
                            ) {
                                activeDateField = .end
                            }

                            Text("Unavailable dates are crossed out. The first bookable day is selected for you automatically.")
                                .font(.system(size: 12, weight: .medium, design: .rounded))
                                .foregroundStyle(HayameTheme.mutedText)

                            VStack(alignment: .leading, spacing: 10) {
                                Text("Quick select")
                                    .font(.system(size: 14, weight: .bold, design: .rounded))
                                    .foregroundStyle(HayameTheme.brandNavy)

                                VStack(spacing: 10) {
                                    quickDateButton(title: "2 days", days: 2)
                                    quickDateButton(title: "5 days", days: 5)
                                    quickDateButton(title: "7 days", days: 7)
                                }
                            }
                        }
                    }

	                    Color.clear.frame(height: 24)
                }
                .padding(.horizontal, 16)
                .padding(.top, 6)
            }

        case .location:
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    BookingSheetCard {
                        VStack(alignment: .leading, spacing: 16) {
                            BookingSectionHeader(
                                title: "Trip mode",
                                helpTitle: "Pickup or delivery",
                                helpMessage: "Pickup means you meet at the listing area and avoid any delivery fee. Delivery means the host brings the car to your preferred handoff point."
                            )

                            if car.deliveryAvailable {
                                VStack(spacing: 10) {
                                    BookingTripModeButton(
                                        title: BookingTripMode.pickup.label,
                                        subtitle: BookingTripMode.pickup.subtitle,
                                        trailingText: "No delivery fee",
                                        isSelected: tripMode == .pickup
                                    ) {
                                        tripMode = .pickup
                                        paymentMessage = nil
                                    }

                                    BookingTripModeButton(
                                        title: BookingTripMode.delivery.label,
                                        subtitle: BookingTripMode.delivery.subtitle,
                                        trailingText: max(car.deliveryFee, 0) > 0 ? "GHS \(max(car.deliveryFee, 0))" : "Free",
                                        isSelected: tripMode == .delivery
                                    ) {
                                        tripMode = .delivery
                                        if deliveryDetails.contactPhone.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                                            deliveryDetails.contactPhone = appState.currentUser.phone
                                        }
                                        paymentMessage = nil
                                    }
                                }

                                if tripMode == nil {
                                    Text("Choose pickup or delivery to continue.")
                                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                                        .foregroundStyle(HayameTheme.warning)
                                }
                            } else {
                                BookingModeSummaryRow(
                                    title: BookingTripMode.pickup.label,
                                    message: "This listing is pickup only."
                                )
                            }
                        }
                    }

                    if tripMode == .delivery {
                        BookingSheetCard {
                            VStack(alignment: .leading, spacing: 16) {
                                BookingSectionHeader(
                                    title: "Delivery details",
                                    helpTitle: "Delivery details",
                                    helpMessage: "These details are shared with the host so they know where and when to bring the car."
                                )

                                BookingTextField(
                                    title: "Delivery address",
                                    text: $deliveryDetails.address,
                                    placeholder: "House number, street, landmark"
                                )

                                VStack(alignment: .leading, spacing: 8) {
                                    Text("Preferred delivery time")
                                        .font(.system(size: 14, weight: .bold, design: .rounded))
                                        .foregroundStyle(HayameTheme.brandNavy)

                                    DatePicker(
                                        "",
                                        selection: $deliveryTimeSelection,
                                        displayedComponents: .hourAndMinute
                                    )
                                    .labelsHidden()
                                    .datePickerStyle(.wheel)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 120)
                                    .clipped()
                                    .background(
                                        HayameTheme.brandLight,
                                        in: RoundedRectangle(cornerRadius: 16, style: .continuous)
                                    )
                                }

                                BookingTextField(
                                    title: "Contact phone",
                                    text: $deliveryDetails.contactPhone,
                                    placeholder: "+233 24 123 4567",
                                    keyboardType: .phonePad,
                                    capitalization: .never
                                )

                                BookingTextArea(
                                    title: "Delivery notes (optional)",
                                    text: $deliveryDetails.notes,
                                    placeholder: "Gate code, landmark, or anything helpful for handoff."
                                )

                                Text(
                                    deliveryFee > 0
                                        ? "Delivery fee: GHS \(deliveryFee)"
                                        : "This listing offers free delivery."
                                )
                                .font(.system(size: 12, weight: .semibold, design: .rounded))
                                .foregroundStyle(HayameTheme.brandBlue)
                            }
                        }
                    }

                    BookingSheetCard {
                        VStack(alignment: .leading, spacing: 16) {
                            BookingSelectionField(
                                title: "Region",
                                selected: region,
                                options: MockDataService.regionsIncluding(region)
                            ) { region = $0 }

                            BookingSelectionField(
                                title: "City",
                                selected: city,
                                options: MockDataService.cities(for: region, preferred: city)
                            ) { city = $0 }

                            VStack(alignment: .leading, spacing: 8) {
                                Text("Exact destination (optional)")
                                    .font(.system(size: 14, weight: .bold, design: .rounded))
                                    .foregroundStyle(HayameTheme.brandNavy)

                                TextField("Area, landmark, or pickup point", text: $address)
                                    .textInputAutocapitalization(.words)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 14)
                                    .background(HayameTheme.brandLight, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                                            .stroke(HayameTheme.cardStroke, lineWidth: 1)
                                    )
                            }

                            Text(locationHelperText)
                                .font(.system(size: 13, weight: .semibold, design: .rounded))
                                .foregroundStyle(tripOutsideListingRegion ? HayameTheme.warning : HayameTheme.success)
                        }
                    }

                    BookingSheetCard {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Smart defaults")
                                .font(.system(size: 14, weight: .bold, design: .rounded))
                                .foregroundStyle(HayameTheme.brandNavy)
                            Text("Trip use location stays separate from pickup or delivery so pricing and host handoff stay accurate.")
                                .font(.system(size: 13, weight: .medium, design: .rounded))
                                .foregroundStyle(HayameTheme.mutedText)
                        }
                    }

                    Color.clear.frame(height: 24)
                }
                .padding(.horizontal, 16)
                .padding(.top, 6)
            }

        case .review:
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    BookingSheetCard {
                        HStack(alignment: .top, spacing: 14) {
                            Group {
                                if let listingImageURL {
                                    CachedRemoteImage(url: listingImageURL, targetSize: CGSize(width: 180, height: 140)) {
                                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                                            .fill(HayameTheme.brandLight)
                                    } failure: {
                                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                                            .fill(HayameTheme.brandLight)
                                            .overlay(
                                                Image(systemName: "car.fill")
                                                    .font(.system(size: 18, weight: .bold))
                                                    .foregroundStyle(HayameTheme.brandBlue)
                                            )
                                    }
                                } else {
                                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                                        .fill(HayameTheme.brandLight)
                                        .overlay(
                                            Image(systemName: "car.fill")
                                                .font(.system(size: 18, weight: .bold))
                                                .foregroundStyle(HayameTheme.brandBlue)
                                        )
                                }
                            }
                            .frame(width: 86, height: 72)
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

                            VStack(alignment: .leading, spacing: 6) {
                                Text(car.displayTitle)
                                    .font(.system(size: 18, weight: .bold, design: .rounded))
                                    .foregroundStyle(HayameTheme.brandNavy)
                                    .lineLimit(2)
                                Text("\(startDate.hayameDateLabel()) - \(endDate.hayameDateLabel())")
                                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                                    .foregroundStyle(HayameTheme.brandBlue)
                                Text("\(nights) day\(nights == 1 ? "" : "s") • \(selectedTripMode.label)")
                                    .font(.system(size: 13, weight: .medium, design: .rounded))
                                    .foregroundStyle(HayameTheme.mutedText)
                                    .lineLimit(2)
                                Text(resolvedDestination)
                                    .font(.system(size: 13, weight: .medium, design: .rounded))
                                    .foregroundStyle(HayameTheme.mutedText)
                                    .lineLimit(2)
                            }
                        }
                    }

                    BookingSheetCard {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Trip summary")
                                .font(.system(size: 15, weight: .bold, design: .rounded))
                                .foregroundStyle(HayameTheme.brandNavy)

                            InfoLine(label: "Trip mode", value: selectedTripMode.label)
                            InfoLine(label: "Trip use area", value: resolvedDestination)

                            if selectedTripMode == .delivery {
                                InfoLine(
                                    label: "Delivery address",
                                    value: deliveryDetails.address.trimmingCharacters(in: .whitespacesAndNewlines)
                                )
                                InfoLine(label: "Delivery time", value: deliveryTimeLabel)
                                InfoLine(
                                    label: "Contact phone",
                                    value: deliveryDetails.contactPhone.trimmingCharacters(in: .whitespacesAndNewlines)
                                )
                                let trimmedNotes = deliveryDetails.notes.trimmingCharacters(in: .whitespacesAndNewlines)
                                if !trimmedNotes.isEmpty {
                                    InfoLine(label: "Delivery notes", value: trimmedNotes)
                                }
                            }
                        }
                    }

                    BookingSheetCard {
                        VStack(alignment: .leading, spacing: 14) {
                            Text("Price breakdown")
                                .font(.system(size: 15, weight: .bold, design: .rounded))
                                .foregroundStyle(HayameTheme.brandNavy)

                            InfoLine(label: "Daily rate × \(nights)", value: "GHS \(subtotal)")
                            InfoLine(label: "Insurance", value: "GHS \(insuranceFee)")
                            if selectedTripMode == .delivery {
                                InfoLine(label: "Delivery", value: "GHS \(deliveryFee)")
                            }
                            if tripOutsideListingRegion || outsideAccraSurcharge > 0 {
                                InfoLine(label: "Outside region fee", value: "GHS \(outsideAccraSurcharge)")
                            }
                            InfoLine(label: "Deposit", value: "GHS \(depositAmount)")

                            Divider()

                            HStack(alignment: .firstTextBaseline) {
                                Text("Total")
                                    .font(.system(size: 16, weight: .bold, design: .rounded))
                                    .foregroundStyle(HayameTheme.brandNavy)
                                Spacer()
                                Text("GHS \(totalAmount)")
                                    .font(.system(size: 28, weight: .bold, design: .rounded))
                                    .foregroundStyle(HayameTheme.brandBlue)
                            }

                            Text("No hidden fees. This is the amount shown before payment.")
                                .font(.system(size: 12, weight: .medium, design: .rounded))
                                .foregroundStyle(HayameTheme.mutedText)
                        }
                    }

                    Color.clear.frame(height: 24)
                }
                .padding(.horizontal, 16)
                .padding(.top, 6)
            }

        case .payment:
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    BookingSheetCard {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Total amount")
                                .font(.system(size: 14, weight: .bold, design: .rounded))
                                .foregroundStyle(HayameTheme.mutedText)
                            Text("GHS \(totalAmount)")
                                .font(.system(size: 34, weight: .bold, design: .rounded))
                                .foregroundStyle(HayameTheme.brandNavy)
                            Text("Secure payment with no hidden fees.")
                                .font(.system(size: 13, weight: .medium, design: .rounded))
                                .foregroundStyle(HayameTheme.mutedText)
                        }
                    }

                    BookingSheetCard {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Payment methods")
                                .font(.system(size: 15, weight: .bold, design: .rounded))
                                .foregroundStyle(HayameTheme.brandNavy)

                            BookingPaymentMethodRow(
                                title: "Mobile Money",
                                subtitle: "Fast checkout from your phone",
                                systemImage: "iphone.gen3.radiowaves.left.and.right"
                            )
                            BookingPaymentMethodRow(
                                title: "Card",
                                subtitle: "Visa and Mastercard supported",
                                systemImage: "creditcard.fill"
                            )
                            BookingPaymentMethodRow(
                                title: "Bank transfer",
                                subtitle: "Available in secure checkout",
                                systemImage: "building.columns.fill"
                            )
                        }
                    }

                    BookingSheetCard {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("What happens next")
                                .font(.system(size: 14, weight: .bold, design: .rounded))
                                .foregroundStyle(HayameTheme.brandNavy)
                            Text("Tap Make payment and we'll open the secure checkout sheet to finish your booking.")
                                .font(.system(size: 13, weight: .medium, design: .rounded))
                                .foregroundStyle(HayameTheme.mutedText)
                        }
                    }

                    Color.clear.frame(height: 24)
                }
                .padding(.horizontal, 16)
                .padding(.top, 6)
            }
        }
    }

    private func goBack() {
        guard let previousStep = currentStep.previous else { return }
        isMovingForward = false
        paymentMessage = nil
        withAnimation(.spring(response: 0.42, dampingFraction: 0.88)) {
            currentStep = previousStep
        }
    }

    private func moveTo(_ step: BookingCheckoutStep) {
        isMovingForward = step.rawValue > currentStep.rawValue
        paymentMessage = nil
        withAnimation(.spring(response: 0.42, dampingFraction: 0.88)) {
            currentStep = step
        }
    }

    private func handlePrimaryAction() {
        switch currentStep {
        case .tripDetails:
            guard endDate > startDate else {
                paymentMessage = "Choose an end date after your start date."
                return
            }
            moveTo(.location)

        case .location:
            if car.deliveryAvailable, tripMode == nil {
                paymentMessage = "Choose pickup or delivery to continue."
                return
            }
            let normalizedRegion = region.trimmingCharacters(in: .whitespacesAndNewlines)
            let normalizedCity = city.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !normalizedRegion.isEmpty else {
                paymentMessage = "Select your trip region to continue."
                return
            }
            guard !normalizedCity.isEmpty else {
                paymentMessage = "Select your trip city to continue."
                return
            }
            if tripMode == .delivery {
                let trimmedAddress = deliveryDetails.address.trimmingCharacters(in: .whitespacesAndNewlines)
                let trimmedPhone = deliveryDetails.contactPhone.trimmingCharacters(in: .whitespacesAndNewlines)
                guard trimmedAddress.count >= 6 else {
                    paymentMessage = "Enter the exact delivery address."
                    return
                }
                guard trimmedPhone.deliveryPhoneDigitsCount >= 7 else {
                    paymentMessage = "Enter a valid contact phone number."
                    return
                }
            }
            moveTo(.review)

        case .review:
            moveTo(.payment)

        case .payment:
            Task { await payWithPaystack() }
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
                tripMode: tripMode ?? .pickup,
                region: region,
                city: city,
                address: address,
                deliveryDetails: tripMode == .delivery ? deliveryDetailsPayload : BookingDeliveryDetails(),
                start: startDate,
                end: endDate
            )

            guard let checkoutURL = URL(string: checkout.authorizationURL) else {
                throw APIError(message: "Invalid Paystack checkout URL returned by server.")
            }

            do {
                let callbackURL = try await InAppBrowserAuthenticator.shared.open(
                    url: checkoutURL,
                    callbackScheme: "hayame"
                )
                _ = try await appState.completeBookingPayment(checkout: checkout, callbackURL: callbackURL)
                appState.renterTab = .trips
                dismiss()
                return
            } catch {
                if let browserError = error as? InAppBrowserAuthenticatorError,
                   browserError.shouldAttemptPaymentVerificationFallback {
                    do {
                        _ = try await appState.completeBookingPayment(checkout: checkout)
                        appState.renterTab = .trips
                        dismiss()
                        return
                    } catch let verificationError {
                        throw verificationError
                    }
                }
                throw error
            }
        } catch {
            let message = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            paymentMessage = message.isEmpty ? "Unable to complete payment." : message
            appState.paymentFlowNotice = paymentMessage
            appState.paymentFlowNoticeIsError = true
        }
    }
}

private enum BookingCheckoutStep: Int, CaseIterable, Identifiable {
    case tripDetails
    case location
    case review
    case payment

    var id: Int { rawValue }

    var stepNumber: Int { rawValue + 1 }

    var title: String {
        switch self {
        case .tripDetails: return "Trip details"
        case .location: return "Location"
        case .review: return "Review & price"
        case .payment: return "Checkout"
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

private struct BookingProgressHeader: View {
    let currentStep: BookingCheckoutStep

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Step \(currentStep.stepNumber) of \(BookingCheckoutStep.allCases.count)")
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandBlue)

            VStack(alignment: .leading, spacing: 4) {
                Text(currentStep.title)
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)
                Text(currentStep.subtitle)
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)
            }

            HStack(spacing: 8) {
                ForEach(BookingCheckoutStep.allCases) { step in
                    BookingProgressItem(
                        step: step,
                        isActive: step == currentStep,
                        isCompleted: step.rawValue < currentStep.rawValue
                    )
                }
            }
        }
    }
}

private struct BookingProgressItem: View {
    let step: BookingCheckoutStep
    let isActive: Bool
    let isCompleted: Bool

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .fill(isActive || isCompleted ? HayameTheme.brandBlue : HayameTheme.fieldBackground)
                    .frame(width: 28, height: 28)
                    .overlay(
                        Circle()
                            .stroke((isActive || isCompleted) ? HayameTheme.brandBlue : HayameTheme.controlStroke, lineWidth: 1)
                    )

                if isCompleted {
                    Image(systemName: "checkmark")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.white)
                } else {
                    Text("\(step.stepNumber)")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundStyle(isActive ? .white : HayameTheme.mutedText)
                }
            }

            Text(step.progressLabel)
                .font(.system(size: 11, weight: .semibold, design: .rounded))
                .foregroundStyle(isActive || isCompleted ? HayameTheme.brandNavy : HayameTheme.mutedText)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity)
    }
}

private struct BookingSheetCard<Content: View>: View {
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

private struct BookingDateField: View {
    let title: String
    let date: Date
    let isLoadingAvailability: Bool
    let action: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)

            Button(action: action) {
                HStack(spacing: 12) {
                    Text(date.hayameDateLabel())
                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Spacer()
                    if isLoadingAvailability {
                        ProgressView()
                            .tint(HayameTheme.brandBlue)
                    } else {
                        Image(systemName: "calendar")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(HayameTheme.brandBlue)
                    }
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 14)
                .background(HayameTheme.brandLight, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(HayameTheme.cardStroke, lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
        }
    }
}

private enum BookingDateSelectionTarget: String, Identifiable {
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

private struct BookingAvailabilityCalendarSheet: View {
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
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)

                    ForEach(months) { month in
                        VStack(alignment: .leading, spacing: 12) {
                            Text(month.title)
                                .font(.system(size: 18, weight: .bold, design: .rounded))
                                .foregroundStyle(HayameTheme.brandNavy)

                            LazyVGrid(columns: columns, spacing: 10) {
                                ForEach(weekdayLabels, id: \.self) { label in
                                    Text(label)
                                        .font(.system(size: 11, weight: .bold, design: .rounded))
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
                .font(.system(size: 14, weight: .semibold, design: .rounded))
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

private func bookingDay(_ date: Date) -> Date {
    Calendar.current.startOfDay(for: date)
}

private func bookingAddingDays(_ days: Int, to date: Date) -> Date {
    Calendar.current.date(byAdding: .day, value: days, to: bookingDay(date)) ?? bookingDay(date)
}

private func bookingDateSet(from rawValues: [String]) -> Set<Date> {
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

private func isBookableStartDate(_ date: Date, blockedDates: Set<Date>) -> Bool {
    let normalizedDate = bookingDay(date)
    return normalizedDate >= bookingDay(Date()) &&
        isContinuousBookingRangeAvailable(
            startDate: normalizedDate,
            endDate: bookingAddingDays(1, to: normalizedDate),
            blockedDates: blockedDates
        )
}

private func isBookableEndDate(_ date: Date, startDate: Date, blockedDates: Set<Date>) -> Bool {
    let normalizedDate = bookingDay(date)
    return normalizedDate > bookingDay(startDate) &&
        isContinuousBookingRangeAvailable(
            startDate: startDate,
            endDate: normalizedDate,
            blockedDates: blockedDates
        )
}

private func preferredBookingEndDate(currentEnd: Date, startDate: Date, blockedDates: Set<Date>) -> Date? {
    let normalizedStart = bookingDay(startDate)
    let normalizedEnd = bookingDay(currentEnd)

    if isBookableEndDate(normalizedEnd, startDate: normalizedStart, blockedDates: blockedDates) {
        return normalizedEnd
    }

    let fallback = bookingAddingDays(1, to: normalizedStart)
    return isContinuousBookingRangeAvailable(startDate: normalizedStart, endDate: fallback, blockedDates: blockedDates)
        ? fallback
        : nil
}

private func nextBookableStartDate(from earliestDate: Date, duration: Int, blockedDates: Set<Date>) -> Date? {
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

private struct BookingSelectionField: View {
    let title: String
    let selected: String
    let options: [String]
    let onSelected: (String) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 14, weight: .bold, design: .rounded))
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
                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Spacer()
                    Image(systemName: "chevron.down")
                        .font(.system(size: 12, weight: .bold))
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

private struct BookingSectionHeader: View {
    let title: String
    var helpTitle: String? = nil
    var helpMessage: String? = nil

    var body: some View {
        HStack(spacing: 6) {
            Text(title)
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)

            if let helpTitle, let helpMessage {
                BookingInfoButton(title: helpTitle, message: helpMessage)
            }
        }
    }
}

private struct BookingInfoButton: View {
    let title: String
    let message: String

    @State private var isShowing = false

    var body: some View {
        Button {
            isShowing = true
        } label: {
            Image(systemName: "info.circle")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(HayameTheme.brandBlue)
        }
        .buttonStyle(.plain)
        .alert(title, isPresented: $isShowing) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(message)
        }
    }
}

private struct BookingTripModeButton: View {
    let title: String
    let subtitle: String
    let trailingText: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text(subtitle)
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)
                        .multilineTextAlignment(.leading)
                }

                Spacer(minLength: 8)

                VStack(alignment: .trailing, spacing: 8) {
                    Text(trailingText)
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandBlue)

                    Circle()
                        .fill(isSelected ? HayameTheme.brandBlue : Color.clear)
                        .frame(width: 18, height: 18)
                        .overlay(
                            Circle()
                                .stroke(
                                    isSelected ? HayameTheme.brandBlue : HayameTheme.controlStroke,
                                    lineWidth: 2
                                )
                        )
                }
            }
            .padding(14)
            .background(
                isSelected ? HayameTheme.brandBlue.opacity(0.1) : HayameTheme.brandLight,
                in: RoundedRectangle(cornerRadius: 16, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(
                        isSelected ? HayameTheme.brandBlue : HayameTheme.cardStroke,
                        lineWidth: 1
                    )
            )
        }
        .buttonStyle(.plain)
    }
}

private struct BookingModeSummaryRow: View {
    let title: String
    let message: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(HayameTheme.success)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)
                Text(message)
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)
            }

            Spacer()
        }
        .padding(14)
        .background(HayameTheme.brandLight, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

private struct BookingTextField: View {
    let title: String
    @Binding var text: String
    let placeholder: String
    var keyboardType: UIKeyboardType = .default
    var capitalization: TextInputAutocapitalization = .words

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)

            TextField(placeholder, text: $text)
                .keyboardType(keyboardType)
                .textInputAutocapitalization(capitalization)
                .disableAutocorrection(true)
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

private struct BookingTextArea: View {
    let title: String
    @Binding var text: String
    let placeholder: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)

            ZStack(alignment: .topLeading) {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(HayameTheme.brandLight)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(HayameTheme.cardStroke, lineWidth: 1)
                    )

                if text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    Text(placeholder)
                        .font(.system(size: 15, weight: .medium, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 16)
                }

                TextEditor(text: $text)
                    .scrollContentBackground(.hidden)
                    .foregroundStyle(HayameTheme.brandNavy)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .frame(minHeight: 110)
                    .background(Color.clear)
            }
        }
    }
}

private extension String {
    var deliveryPhoneDigitsCount: Int {
        filter(\.isNumber).count
    }
}

private struct BookingPaymentMethodRow: View {
    let title: String
    let subtitle: String
    let systemImage: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: systemImage)
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(HayameTheme.brandBlue)
                .frame(width: 34, height: 34)
                .background(HayameTheme.brandLight, in: Circle())

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)
                Text(subtitle)
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)
            }

            Spacer()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(HayameTheme.brandLight, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

private struct PaymentProcessingOverlay: View {
    var body: some View {
        ZStack {
            Color.black.opacity(0.2).ignoresSafeArea()
            VStack(spacing: 12) {
                SmilingWheelSpinner(size: 72)
                Text("Processing payment")
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)
                Text("Please wait while we confirm your payment.")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 18)
            .frame(maxWidth: 280)
            .background(HayameTheme.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(HayameTheme.cardStroke, lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(0.12), radius: 14, x: 0, y: 6)
        }
    }
}

private struct SmilingWheelSpinner: View {
    let size: CGFloat
    @State private var spinning = false

    var body: some View {
        ZStack {
            Circle()
                .stroke(HayameTheme.brandBlue.opacity(0.2), lineWidth: 6)
            Circle()
                .trim(from: 0.12, to: 0.9)
                .stroke(
                    AngularGradient(
                        colors: [HayameTheme.brandBlue, HayameTheme.brandNavy, HayameTheme.brandBlue],
                        center: .center
                    ),
                    style: StrokeStyle(lineWidth: 6, lineCap: .round)
                )
                .rotationEffect(.degrees(spinning ? 360 : 0))
                .animation(.linear(duration: 1.0).repeatForever(autoreverses: false), value: spinning)
            Image(systemName: "face.smiling")
                .font(.system(size: size * 0.34, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
        }
        .frame(width: size, height: size)
        .onAppear {
            spinning = true
        }
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
	        .toolbar(.hidden, for: .navigationBar)
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

struct TripsScreen: View {
    @EnvironmentObject private var appState: AppState
    @State private var activeChatTarget: TripChatTarget?
    @State private var activeVehicle: Car?
    @State private var disputeBooking: Booking?
    @State private var highlightedBookingID: String?

    private var visibleBookings: [Booking] {
        appState.renterBookings.filter { $0.paymentStatus == .paid }
    }

    private var upcoming: [Booking] {
        visibleBookings
            .filter { $0.endDate >= Date() }
            .sorted { $0.createdAt > $1.createdAt }
    }

    private var past: [Booking] {
        visibleBookings
            .filter { $0.endDate < Date() }
            .sorted { $0.createdAt > $1.createdAt }
    }

	    var body: some View {
	        ScrollViewReader { proxy in
	            ScrollView {
	                VStack(alignment: .leading, spacing: 14) {
	                    PageTitle("Trips")

	                    if let paymentNotice = appState.paymentFlowNotice, !paymentNotice.isEmpty {
                        PaymentNoticeCard(
                            message: paymentNotice,
                            isError: appState.paymentFlowNoticeIsError
                        ) {
                            appState.paymentFlowNotice = nil
                            appState.paymentFlowNoticeIsError = false
                        }
                    }

                    if !appState.isAuthenticated {
                        EmptyStateView(
                            title: "Guest mode",
                            message: "Log in to view your actual trip history and active bookings.",
                            systemImage: "person.crop.circle.badge.exclamationmark"
                        )
                    } else if case .loading = appState.bookingsLoadState {
                        SectionHeader(title: "Upcoming bookings")
                        ForEach(0..<2, id: \.self) { _ in
                            BookingPlaceholderCard()
                        }
                        SectionHeader(title: "Past trips", actionTitle: "Vehicles") {
                            openHostVehicles()
                        }
                        ForEach(0..<2, id: \.self) { _ in
                            BookingPlaceholderCard()
                        }
                    } else if case .error(let message) = appState.bookingsLoadState {
                        ErrorStateCard(
                            title: "Bookings unavailable",
                            message: message,
                            actionTitle: "Refresh"
                        ) {
                            appState.retryBookings()
                        }
                    } else {
                        SectionHeader(title: "Upcoming bookings")
                        if upcoming.isEmpty {
                            EmptyStateView(
                                title: "No upcoming trips",
                                message: "Book your next ride from Explore.",
                                systemImage: "calendar.badge.exclamationmark"
                            )
                        } else {
                            ForEach(upcoming) { booking in
                                TripBookingCard(
                                    booking: booking,
                                    car: car(for: booking),
                                    onOpenVehicle: { activeVehicle = $0 },
                                    onMessage: { openBookingChat(for: booking) },
                                    onDispute: { disputeBooking = booking },
                                    isHighlighted: highlightedBookingID == booking.id
                                )
                                .id(booking.id)
                            }
                        }

                        SectionHeader(title: "Past trips", actionTitle: "Vehicles") {
                            openHostVehicles()
                        }
                        if past.isEmpty {
                            EmptyStateView(
                                title: "No past trips",
                                message: "Completed trips appear here.",
                                systemImage: "clock.arrow.circlepath"
                            )
                        } else {
                            ForEach(past) { booking in
                                TripBookingCard(
                                    booking: booking,
                                    car: car(for: booking),
                                    onOpenVehicle: { activeVehicle = $0 },
                                    onMessage: { openBookingChat(for: booking) },
                                    onDispute: { disputeBooking = booking },
                                    isHighlighted: highlightedBookingID == booking.id
                                )
                                .id(booking.id)
                            }
                        }
                    }
                }
                .padding(16)
	            }
	            .background(HayameTheme.pageBackground)
	            .toolbar(.hidden, for: .navigationBar)
	            .refreshable {
                await appState.refreshAllRemoteData()
            }
            .navigationDestination(item: $activeChatTarget) { target in
                ChatThreadScreen(conversationID: target.id, participantName: target.participantName)
                    .environmentObject(appState)
            }
            .navigationDestination(item: $activeVehicle) { car in
                CarDetailScreen(car: car)
            }
            .sheet(item: $disputeBooking) { booking in
                TripDisputeSheet(booking: booking) { reason in
                    await appState.openDispute(bookingID: booking.id, reason: reason)
                }
                .environmentObject(appState)
            }
            .onAppear {
                focusPendingBookingIfNeeded(proxy: proxy)
            }
            .onChange(of: appState.pendingBookingID) { _, _ in
                focusPendingBookingIfNeeded(proxy: proxy)
            }
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

    private func car(for booking: Booking) -> Car? {
        appState.cars.first { $0.id == booking.carID }
    }

    private func openBookingChat(for booking: Booking) {
        guard appState.isAuthenticated else {
            appState.syncErrorMessage = "Log in to use messages."
            return
        }

        Task {
            let summary = tripMessageSummary(for: booking)
            if let existingConversation = booking.conversationID, !existingConversation.isEmpty {
                appState.markConversationRead(existingConversation)
                await appState.addMessageIfMissing(conversationID: existingConversation, body: summary)
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
            await appState.addMessageIfMissing(conversationID: conversationID, body: summary)
            activeChatTarget = TripChatTarget(id: conversationID, participantName: booking.hostName)
        }
    }

    private func tripMessageSummary(for booking: Booking) -> String {
        let location = [booking.tripUseAddress, booking.tripUseCity, booking.tripUseRegion]
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: ", ")
        let deliveryAddress = booking.deliveryAddress.trimmingCharacters(in: .whitespacesAndNewlines)
        let mode = !deliveryAddress.isEmpty || booking.deliveryFee > 0 ? "Delivery" : "Pickup"
        let handoffLocation = deliveryAddress.isEmpty ? (location.isEmpty ? "Not provided" : location) : deliveryAddress
        let deliveryTime = booking.deliveryTime.trimmingCharacters(in: .whitespacesAndNewlines)
        let contactPhone = booking.contactPhone.trimmingCharacters(in: .whitespacesAndNewlines)
        let deliveryNotes = booking.deliveryNotes.trimmingCharacters(in: .whitespacesAndNewlines)
        let paymentReference = booking.paymentReference?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        var lines = [
            "Trip details",
            "Car: \(booking.carTitle)",
            "Guest: \(appState.currentUser.fullName)",
            "Dates: \(booking.startDate.hayameDateLabel()) - \(booking.endDate.hayameDateLabel())",
            "Duration: \(booking.nights) day\(booking.nights == 1 ? "" : "s")",
            "Time: \(deliveryTime.isEmpty ? "Not set" : deliveryTime)",
            "\(mode) location: \(handoffLocation)",
            "Trip use area: \(location.isEmpty ? "Not provided" : location)",
            "Price: GHS \(booking.totalPrice)",
            "Daily rate: GHS \(booking.dailyRate)",
            "Subtotal: GHS \(booking.subtotal)",
            "Insurance: GHS \(booking.insuranceFee)",
            "Delivery fee: GHS \(booking.deliveryFee)",
            "Outside region fee: GHS \(booking.outsideAccraSurcharge)",
            "Deposit: GHS \(booking.depositAmount)",
            "Payment ref: \(paymentReference.isEmpty ? "N/A" : paymentReference)",
            "Booking ID: \(booking.id)"
        ]
        if !contactPhone.isEmpty {
            lines.append("Contact phone: \(contactPhone)")
        }
        if !deliveryNotes.isEmpty {
            lines.append("Notes: \(deliveryNotes)")
        }
        return lines.joined(separator: "\n")
    }

    private func focusPendingBookingIfNeeded(proxy: ScrollViewProxy) {
        guard let pendingID = appState.pendingBookingID else { return }
        guard visibleBookings.contains(where: { $0.id == pendingID }) else { return }
        highlightedBookingID = pendingID
        withAnimation(.easeInOut(duration: 0.25)) {
            proxy.scrollTo(pendingID, anchor: .top)
        }
        appState.consumePendingBookingFocus(ifMatches: pendingID)
    }
}

private struct TripChatTarget: Identifiable, Hashable {
    let id: String
    let participantName: String
}

private struct PaymentNoticeCard: View {
    let message: String
    let isError: Bool
    let dismiss: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: isError ? "xmark.octagon.fill" : "checkmark.circle.fill")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(isError ? HayameTheme.danger : HayameTheme.success)

            Text(message)
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundStyle(isError ? HayameTheme.danger : HayameTheme.success)
                .multilineTextAlignment(.leading)

            Spacer(minLength: 8)

            Button("Dismiss", action: dismiss)
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandBlue)
        }
        .padding(12)
        .hayameCard()
    }
}

private struct TripBookingCard: View {
    let booking: Booking
    let car: Car?
    let onOpenVehicle: (Car) -> Void
    let onMessage: () -> Void
    let onDispute: () -> Void
    var isHighlighted = false

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

    private var headerSubtitle: String? {
        let location = [booking.tripUseCity, booking.tripUseRegion]
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: ", ")
        let host = booking.hostName.trimmingCharacters(in: .whitespacesAndNewlines)
        let parts = [host, location].filter { !$0.isEmpty }
        return parts.isEmpty ? nil : parts.joined(separator: " • ")
    }

    private var datesLabel: String {
        "\(booking.startDate.hayameDateLabel()) - \(booking.endDate.hayameDateLabel())"
    }

    private var vehicleImageURL: URL? {
        let imageNames = car?.imageNames.isEmpty == false ? car?.imageNames ?? [] : booking.carImageNames
        return imageNames.compactMap(RemoteImageURLResolver.resolve).first
    }

    private var brandTitle: String {
        let brand = car?.brand.trimmingCharacters(in: .whitespacesAndNewlines)
            ?? booking.carBrand.trimmingCharacters(in: .whitespacesAndNewlines)
        return brand.isEmpty ? booking.carTitle : brand
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                Group {
                    if let vehicleImageURL {
                        CachedRemoteImage(url: vehicleImageURL, targetSize: CGSize(width: 180, height: 140)) {
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .fill(HayameTheme.brandLight)
                        } failure: {
                            vehicleImageFallback
                        }
                    } else {
                        vehicleImageFallback
                    }
                }
                .frame(width: 86, height: 70)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

                VStack(alignment: .leading, spacing: 8) {
                    HStack(alignment: .top, spacing: 8) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(booking.carTitle)
                                .font(.system(size: 17, weight: .bold, design: .rounded))
                                .foregroundStyle(HayameTheme.brandNavy)
                                .lineLimit(2)
                            if let headerSubtitle {
                                Text(headerSubtitle)
                                    .font(.system(size: 12, weight: .medium, design: .rounded))
                                    .foregroundStyle(HayameTheme.mutedText)
                                    .lineLimit(2)
                            }
                        }

                        Spacer(minLength: 8)

                        VehicleBrandLogo(title: brandTitle, isSelected: false)
                            .frame(width: 38, height: 28)
                    }

                    HStack(spacing: 8) {
                        BookingStatusBadge(status: booking.displayStatus)
                        if booking.shouldShowCompletedPaidBadge {
                            BookingPaymentBadge(label: "Paid")
                        }
                    }
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                InfoLine(label: "Dates", value: datesLabel)
                InfoLine(label: "Duration", value: "\(booking.nights) night(s)")
                InfoLine(label: "Trip mode", value: tripMode)
                InfoLine(label: "Use", value: tripUseLocation.isEmpty ? "N/A" : tripUseLocation)
                InfoLine(label: "Total", value: "GHS\(booking.totalPrice)")
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
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(isHighlighted ? HayameTheme.brandBlue : .clear, lineWidth: 2)
        )
        .shadow(
            color: isHighlighted ? HayameTheme.brandBlue.opacity(0.18) : .clear,
            radius: 14,
            x: 0,
            y: 6
        )
        .contentShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .onTapGesture {
            if let car {
                onOpenVehicle(car)
            }
        }
    }

    private var vehicleImageFallback: some View {
        RoundedRectangle(cornerRadius: 14, style: .continuous)
            .fill(HayameTheme.brandLight)
            .overlay(
                Image(systemName: "car.fill")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(HayameTheme.brandBlue)
            )
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
                        .scrollContentBackground(.hidden)
                        .foregroundStyle(HayameTheme.brandNavy)
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

struct FavoritesScreen: View {
    @EnvironmentObject private var appState: AppState

	    var body: some View {
	        ScrollView {
	            VStack(alignment: .leading, spacing: 14) {
	                PageTitle("Saved")

	                if !appState.isAuthenticated {
                    EmptyStateView(
                        title: "Log in to save cars",
                        message: "Favorites sync to your account and show here after sign in.",
                        systemImage: "person.crop.circle.badge.exclamationmark"
                    )
                } else if case .loading = appState.favoritesLoadState {
                    ForEach(0..<3, id: \.self) { _ in
                        ListingRowPlaceholderCard()
                    }
                } else if case .error(let message) = appState.favoritesLoadState {
                    ErrorStateCard(
                        title: "Favorites unavailable",
                        message: message,
                        actionTitle: "Refresh"
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
	        .toolbar(.hidden, for: .navigationBar)
	        .refreshable {
            await appState.refreshAllRemoteData()
        }
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
        ScrollView {
            VStack(spacing: 12) {
                if !appState.isAuthenticated {
                    EmptyStateView(
                        title: "Log in to use messages",
                        message: "Conversation history and live chat are available after sign in.",
                        systemImage: "person.crop.circle.badge.exclamationmark"
                    )
                } else if case .loading = appState.conversationsLoadState {
                    ForEach(0..<6, id: \.self) { _ in
                        ConversationPlaceholderRow()
                    }
                } else if case .error(let message) = appState.conversationsLoadState {
                    ErrorStateCard(
                        title: "Messages unavailable",
                        message: message,
                        actionTitle: "Refresh"
                    ) {
                        appState.retryConversations()
                    }
                } else {
                    HStack(spacing: 8) {
                        Image(systemName: "magnifyingglass")
                            .foregroundStyle(HayameTheme.mutedText)
                        TextField("Search", text: $search)
                    }
                    .padding(12)
                    .background(HayameTheme.cardBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(HayameTheme.cardStroke, lineWidth: 1))

                    if filtered.isEmpty {
                        EmptyStateView(
                            title: "No conversations",
                            message: "Start chatting from a car detail page.",
                            systemImage: "bubble.left.and.bubble.right"
                        )
                    } else {
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
                    }
                }
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Messages")
        .refreshable {
            await appState.refreshAllRemoteData()
        }
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

    private var messageIDs: [String] {
        messages.map(\.id)
    }

    private var canSend: Bool {
        appState.isAuthenticated &&
            !draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 8) {
                    ForEach(messages) { message in
                        ChatBubble(message: message)
                            .id(message.id)
                            .transition(.move(edge: .bottom).combined(with: .opacity))
                    }
                }
                .animation(.spring(response: 0.3, dampingFraction: 0.85), value: messageIDs)
                .padding(16)
            }
            .scrollDismissesKeyboard(.interactively)
            .safeAreaInset(edge: .bottom, spacing: 0) {
                chatInputBar
            }
            .onAppear {
                appState.startRealtimeMessages(for: conversationID)
                if draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
                   let queuedDraft = appState.consumePendingConversationDraft(for: conversationID) {
                    draft = queuedDraft
                }
                if let last = messages.last {
                    withAnimation(.easeOut(duration: 0.2)) {
                        proxy.scrollTo(last.id, anchor: .bottom)
                    }
                }
            }
            .onDisappear {
                appState.stopRealtimeMessages()
            }
            .onChange(of: messageIDs) { _, _ in
                if let last = messages.last {
                    withAnimation(.easeOut(duration: 0.2)) {
                        proxy.scrollTo(last.id, anchor: .bottom)
                    }
                }
            }
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle(participantName)
        .navigationBarTitleDisplayMode(.inline)
    }

    private var chatInputBar: some View {
        HStack(spacing: 10) {
            TextField(appState.isAuthenticated ? "Type message" : "Log in to send a message", text: $draft)
                .padding(12)
                .background(HayameTheme.fieldBackground)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(HayameTheme.cardStroke, lineWidth: 1))
                .disabled(!appState.isAuthenticated)

            Button {
                let outgoing = draft.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !outgoing.isEmpty else { return }
                appState.addMessage(conversationID: conversationID, body: outgoing, mine: true)
                draft = ""
            } label: {
                Image(systemName: "paperplane.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 42, height: 42)
                    .background(HayameTheme.brandBlue)
                    .clipShape(Circle())
            }
            .disabled(!canSend)
            .opacity(canSend ? 1 : 0.5)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(HayameTheme.pageBackground.ignoresSafeArea(edges: .bottom))
        .overlay(alignment: .top) {
            Rectangle()
                .fill(HayameTheme.cardStroke)
                .frame(height: 1)
        }
    }
}

struct GuestProfileScreen: View {
    @EnvironmentObject private var appState: AppState
    @Binding var requestedRoute: MoreRoute?
    @State private var showEditProfile = false
    @State private var activeMoreRoute: MoreRoute?
    @State private var glowAppearanceSettings = false

    init(requestedRoute: Binding<MoreRoute?> = .constant(nil)) {
        _requestedRoute = requestedRoute
    }

	    var body: some View {
        ScrollViewReader { proxy in
	        ScrollView(showsIndicators: false) {
	            VStack(alignment: .leading, spacing: 14) {
	                PageTitle("More")

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

                    let profileCity = appState.currentUser.city.trimmingCharacters(in: .whitespacesAndNewlines)
                    let profileRegion = appState.currentUser.region.trimmingCharacters(in: .whitespacesAndNewlines)
                    if !profileCity.isEmpty || !profileRegion.isEmpty {
                        let location = [profileCity, profileRegion].filter { !$0.isEmpty }.joined(separator: ", ")
                        InfoLine(label: "Location", value: location)
                    }
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
                        activeMoreRoute = .messages
                    }
                    profileActionButton(title: "Dashboard", systemImage: "rectangle.grid.2x2.fill") {
                        activeMoreRoute = .dashboard
                    }
                }
                .hayameCard()

                SectionHeader(title: "Appearance")
                VStack(alignment: .leading, spacing: 10) {
                    Toggle(
                        isOn: Binding(
                            get: { appState.darkModeEnabled },
                            set: { appState.setDarkMode($0) }
                        )
                    ) {
                        Label(
                            appState.darkModeEnabled ? "Dark mode" : "Light mode",
                            systemImage: appState.darkModeEnabled ? "moon.stars.fill" : "sun.max.fill"
                        )
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandNavy)
                    }
                    .toggleStyle(SwitchToggleStyle(tint: HayameTheme.brandBlue))

                    Text("Switch between light and dark appearance.")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)
                }
                .hayameCard()
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(HayameTheme.brandBlue.opacity(glowAppearanceSettings ? 0.95 : 0), lineWidth: 2)
                )
                .shadow(
                    color: HayameTheme.brandBlue.opacity(glowAppearanceSettings ? 0.34 : 0),
                    radius: glowAppearanceSettings ? 18 : 0,
                    x: 0,
                    y: 0
                )
                .id("appearance-settings")

                SectionHeader(title: "Hosting")
                VStack(alignment: .leading, spacing: 10) {
                    if appState.hostAccessState == .host {
                        Toggle(
                            isOn: Binding(
                                get: { appState.hostModeEnabled },
                                set: { enabled in
                                    if enabled {
                                        withAnimation(.easeInOut(duration: 0.18)) {
                                            appState.hostModeEnabled = true
                                        }
                                        appState.switchToHostMode()
                                    } else {
                                        withAnimation(.easeInOut(duration: 0.18)) {
                                            appState.hostModeEnabled = false
                                        }
                                        appState.switchToGuestMode()
                                    }
                                }
                            )
                        ) {
                            Text("Host mode")
                                .font(.system(size: 14, weight: .semibold, design: .rounded))
                        }
                        .toggleStyle(SwitchToggleStyle(tint: HayameTheme.brandBlue))

                        Text("Turn on Host mode to access host dashboard, listings, bookings, and earnings. Turn it off anytime.")
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
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

                if appState.isAuthenticated {
                    SectionHeader(title: "Notifications")
                    VStack(alignment: .leading, spacing: 12) {
                        notificationPreferenceToggle(
                            title: "Trips & bookings",
                            subtitle: "Booking approvals, changes, and trip reminders.",
                            isOn: Binding(
                                get: { appState.notificationPreferences.bookingUpdates },
                                set: { appState.updateNotificationPreference(bookingUpdates: $0) }
                            )
                        )
                        notificationPreferenceToggle(
                            title: "Messages",
                            subtitle: "New chats and replies from renters or hosts.",
                            isOn: Binding(
                                get: { appState.notificationPreferences.messages },
                                set: { appState.updateNotificationPreference(messages: $0) }
                            )
                        )
                        notificationPreferenceToggle(
                            title: "Account & security",
                            subtitle: "Verification, login, and account notices.",
                            isOn: Binding(
                                get: { appState.notificationPreferences.accountSecurity },
                                set: { appState.updateNotificationPreference(accountSecurity: $0) }
                            )
                        )
                        notificationPreferenceToggle(
                            title: "News & announcements",
                            subtitle: "Optional product updates, releases, and notices.",
                            isOn: Binding(
                                get: { appState.notificationPreferences.newsAnnouncements },
                                set: { appState.updateNotificationPreference(newsAnnouncements: $0) }
                            )
                        )

                        Text("Operational alerts stay on by default. News & announcements are optional.")
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                    .hayameCard()
                }

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
	        .toolbar(.hidden, for: .navigationBar)
	        .navigationDestination(item: $activeMoreRoute) { route in
            switch route {
            case .messages:
                InboxScreen()
                    .environmentObject(appState)
            case .dashboard:
                RenterDashboardScreen()
                    .environmentObject(appState)
            }
        }
        .sheet(isPresented: $showEditProfile) {
            ProfileEditSheet()
                .environmentObject(appState)
        }
        .onAppear {
            consumeRequestedRouteIfNeeded()
        }
        .onChange(of: requestedRoute) { _, _ in
            consumeRequestedRouteIfNeeded()
        }
        .onChange(of: appState.appearanceSettingsHighlightToken) { _, token in
            guard token > 0 else { return }
            withAnimation(.spring(response: 0.48, dampingFraction: 0.84)) {
                proxy.scrollTo("appearance-settings", anchor: .center)
                glowAppearanceSettings = true
            }
            Task { @MainActor in
                try? await Task.sleep(nanoseconds: 2_800_000_000)
                withAnimation(.easeOut(duration: 0.45)) {
                    glowAppearanceSettings = false
                }
            }
        }
        }
    }

    @ViewBuilder
    private func notificationPreferenceToggle(
        title: String,
        subtitle: String,
        isOn: Binding<Bool>
    ) -> some View {
        Toggle(isOn: isOn) {
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.system(size: 14, weight: .semibold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)
                Text(subtitle)
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)
            }
        }
        .toggleStyle(SwitchToggleStyle(tint: HayameTheme.brandBlue))
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

    private func consumeRequestedRouteIfNeeded() {
        guard let requestedRoute else { return }
        activeMoreRoute = requestedRoute
        self.requestedRoute = nil
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

import SwiftUI

private enum AdminTab: Hashable {
    case home
    case messages
    case profile
}

struct AdminShellScreen: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.colorScheme) private var colorScheme
    @State private var selectedTab: AdminTab = .home

    var body: some View {
        activeContent
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(HayameTheme.pageBackground.ignoresSafeArea())
            .safeAreaInset(edge: .bottom, spacing: 0) {
                HayameBottomTabBar(selection: $selectedTab, items: adminTabItems)
            }
        .tint(HayameTheme.brandBlue)
        .hayameNavigationChrome(colorScheme: colorScheme)
    }

    private var adminTabItems: [HayameBottomTabItem<AdminTab>] {
        [
            HayameBottomTabItem(id: .home, title: "Admin", systemImage: "shield.lefthalf.filled"),
            HayameBottomTabItem(id: .messages, title: "Messages", systemImage: "message"),
            HayameBottomTabItem(id: .profile, title: "Profile", systemImage: "person")
        ]
    }

    @ViewBuilder
    private var activeContent: some View {
        switch selectedTab {
        case .home:
            NavigationStack {
                AdminHomeScreen()
            }
        case .messages:
            NavigationStack {
                AdminMessagesScreen()
            }
        case .profile:
            NavigationStack {
                List {
                    Section("Role") {
                        Button("Switch to Guest App") {
                            appState.switchToGuestMode()
                        }
                        Button("Switch to Host App") {
                            appState.switchToHostMode()
                        }
                        Button("Sign out", role: .destructive) {
                            appState.signOut()
                        }
                    }
                }
                .scrollContentBackground(.hidden)
                .background(HayameTheme.pageBackground)
                .navigationTitle("Admin Profile")
            }
        }
    }
}

struct AdminHomeScreen: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        List {
            Section("Admin overview") {
                NavigationLink("Platform controls", destination: AdminPlatformScreen())
                NavigationLink("Office messages", destination: AdminMessagesScreen())
                NavigationLink("Filter catalog", destination: AdminFiltersScreen())
                NavigationLink("User details", destination: AdminUserDetailScreen(user: appState.currentUser))
            }

            Section("Listing moderation") {
                ForEach(appState.cars.prefix(5)) { car in
                    NavigationLink(car.displayTitle) {
                        AdminCarPreviewScreen(car: car)
                    }
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(HayameTheme.pageBackground)
        .navigationTitle("Admin")
    }
}

struct AdminPlatformScreen: View {
    @EnvironmentObject private var appState: AppState

    var pendingListings: [Car] {
        appState.cars.filter { $0.approvalStatus.lowercased() != "approved" }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                SectionHeader(title: "Platform Controls")

                SectionHeader(title: "Listing approvals")
                if pendingListings.isEmpty {
                    EmptyStateView(title: "No pending listings", message: "All listings are approved.", systemImage: "checkmark.seal")
                } else {
                    ForEach(pendingListings) { car in
                        VStack(alignment: .leading, spacing: 8) {
                            Text(car.displayTitle)
                                .font(.system(size: 15, weight: .bold, design: .rounded))
                            Text("\(car.city), \(car.region)")
                                .hayameCaptionStyle()
                            HStack(spacing: 8) {
                                Button("Approve") {
                                    if let idx = appState.cars.firstIndex(where: { $0.id == car.id }) {
                                        appState.cars[idx].approvalStatus = "approved"
                                    }
                                }
                                .buttonStyle(PrimaryPillButtonStyle())

                                Button("Reject") {
                                    if let idx = appState.cars.firstIndex(where: { $0.id == car.id }) {
                                        appState.cars[idx].approvalStatus = "rejected"
                                    }
                                }
                                .buttonStyle(SecondaryPillButtonStyle())
                            }
                        }
                        .hayameCard()
                    }
                }
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Admin Platform")
    }
}

struct AdminMessagesScreen: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        List {
            ForEach(appState.conversations) { conversation in
                NavigationLink {
                    ChatThreadScreen(conversationID: conversation.id, participantName: conversation.participantName)
                } label: {
                    ConversationRowView(conversation: conversation)
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(HayameTheme.pageBackground)
        .navigationTitle("Admin Messages")
    }
}

struct AdminFiltersScreen: View {
    private var allModels: [String] {
        Array(Set(MockDataService.carModelsByMake.values.flatMap { $0 }))
            .sorted { $0.caseInsensitiveCompare($1) == .orderedAscending }
    }

    var body: some View {
        List {
            Section("Car makes") {
                ForEach(MockDataService.carMakes, id: \.self) { make in
                    Text(make)
                }
            }

            Section("Models") {
                ForEach(allModels, id: \.self) { model in
                    Text(model)
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(HayameTheme.pageBackground)
        .navigationTitle("Filter Catalog")
    }
}

struct AdminUserDetailScreen: View {
    let user: UserProfile

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: user.fullName)
                InfoLine(label: "Email", value: user.email)
                InfoLine(label: "Phone", value: user.phone)
                InfoLine(label: "City", value: user.city)
                InfoLine(label: "Region", value: user.region)
                InfoLine(label: "Role", value: user.role.rawValue.capitalized)
            }
            .padding(16)
            .hayameCard()
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("User Details")
    }
}

struct AdminCarPreviewScreen: View {
    let car: Car

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                NetworkOrFallbackImage(
                    urlString: car.imageNames.first,
                    targetSize: CGSize(width: 1000, height: 620)
                )
                    .frame(height: 220)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

                Text(car.displayTitle)
                    .font(.system(size: 24, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)

                Text(car.description)
                    .hayameCaptionStyle()

                InfoLine(label: "Status", value: car.approvalStatus.capitalized)
                InfoLine(label: "Price", value: "GHS\(car.dailyPrice)/day")
                InfoLine(label: "Host", value: car.hostName)

                NavigationLink("Edit Listing") {
                    ListingEditorScreen(mode: .edit(car))
                }
                .buttonStyle(PrimaryPillButtonStyle())
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Listing Preview")
    }
}

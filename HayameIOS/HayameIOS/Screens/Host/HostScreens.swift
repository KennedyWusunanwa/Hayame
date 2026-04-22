import SwiftUI
import PhotosUI
import UIKit
import UniformTypeIdentifiers
import UniformTypeIdentifiers

struct HostApplicationPendingScreen: View {
    @EnvironmentObject private var appState: AppState
    let onLeave: () -> Void

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Button {
                        onLeave()
                    } label: {
                        Label("Back", systemImage: "chevron.left")
                    }
                    .buttonStyle(SecondaryPillButtonStyle())

                    EmptyStateView(
                        title: "Host Application Pending",
                        message: "Your host application is still under review. You can continue browsing as a renter while we process it.",
                        systemImage: "hourglass.circle"
                    )

                    if let hostApplication = appState.hostApplication {
                        VStack(alignment: .leading, spacing: 8) {
                            InfoLine(label: "Applicant", value: hostApplication.fullName)
                            InfoLine(label: "Status", value: hostApplication.status.rawValue.capitalized)
                            if let rejectionReason = hostApplication.rejectionReason, !rejectionReason.isEmpty {
                                InfoLine(label: "Review note", value: rejectionReason)
                            }
                        }
                        .hayameCard()
                    }

                    Button("Refresh status") {
                        Task { await appState.refreshAllRemoteData() }
                    }
                    .buttonStyle(SecondaryPillButtonStyle())

                    Button("Continue browsing as renter") {
                        onLeave()
                    }
                    .buttonStyle(PrimaryPillButtonStyle())
                }
                .padding(16)
            }
            .background(HayameTheme.pageBackground)
            .navigationTitle("Host Review")
            .navigationBarTitleDisplayMode(.inline)
            .refreshable {
                await appState.refreshAllRemoteData()
            }
            .task {
                try? await Task.sleep(nanoseconds: 10_000_000_000)
                guard !Task.isCancelled else { return }
                onLeave()
            }
        }
    }
}

struct HostTabShell: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        TabView(selection: $appState.hostTab) {
            NavigationStack {
                HostDashboardScreen()
            }
            .tabItem {
                Label("Dashboard", systemImage: "house")
            }
            .tag(HostTab.dashboard)

            NavigationStack {
                HostCarsScreen()
            }
            .tabItem {
                Label("Cars", systemImage: "car")
            }
            .tag(HostTab.cars)

            NavigationStack {
                HostBookingsScreen()
            }
            .tabItem {
                Label("Bookings", systemImage: "calendar.badge.clock")
            }
            .tag(HostTab.bookings)

            NavigationStack {
                HostEarningsScreen()
            }
            .tabItem {
                Label("Earnings", systemImage: "cedisign.circle")
            }
            .tag(HostTab.earnings)

            NavigationStack {
                InboxScreen()
            }
            .tabItem {
                Label("Inbox", systemImage: "message")
            }
            .badge(appState.unreadMessagesCount > 0 ? appState.unreadMessagesCount : 0)
            .tag(HostTab.inbox)

            NavigationStack {
                HostProfileScreen()
            }
            .tabItem {
                Label("Profile", systemImage: "person")
            }
            .tag(HostTab.profile)
        }
        .tint(HayameTheme.brandBlue)
        .toolbarBackground(.visible, for: .tabBar)
    }
}

struct HostDashboardScreen: View {
    @EnvironmentObject private var appState: AppState

    private var urgentBookings: [Booking] {
        appState.hostBookings.filter { $0.status == .awaitingHost && $0.paymentStatus == .paid }
    }

    private var totalEarnings: Int {
        appState.hostBookings
            .filter { $0.status == .confirmed || $0.status == .completed || $0.status == .awaitingHost }
            .reduce(0) { $0 + $1.totalPrice }
    }

    private var monthlyEarnings: Int {
        let currentMonth = Calendar.current.component(.month, from: .now)
        return appState.hostBookings
            .filter { Calendar.current.component(.month, from: $0.createdAt) == currentMonth }
            .reduce(0) { $0 + $1.totalPrice }
    }

    private var averageRating: Double {
        guard !appState.hostReviews.isEmpty else { return 0 }
        let sum = appState.hostReviews.reduce(0) { $0 + $1.rating }
        return Double(sum) / Double(appState.hostReviews.count)
    }

    private var hostModeBinding: Binding<Bool> {
        Binding(
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
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text("Host Dashboard")
                    .font(.system(size: 24, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)

                VStack(alignment: .leading, spacing: 8) {
                    Toggle(isOn: hostModeBinding) {
                        Text("Host mode")
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                    }
                    .toggleStyle(SwitchToggleStyle(tint: HayameTheme.brandBlue))

                    Text("Turn off Host mode to move back to User mode.")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)
                }
                .hayameCard()

                HStack(spacing: 12) {
                    hostAvatar

                    VStack(alignment: .leading, spacing: 2) {
                        Text(appState.currentUser.fullName)
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .lineLimit(1)
                        Text("Manage host settings")
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                    Spacer()
                    Button("Open") {
                        appState.hostTab = .profile
                    }
                    .buttonStyle(SecondaryPillButtonStyle())
                }
                .hayameCard()

                if !urgentBookings.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Urgent booking requests")
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                            .foregroundStyle(HayameTheme.danger)
                        Text("You have \(urgentBookings.count) request(s) waiting for approval.")
                            .font(.system(size: 13, weight: .semibold, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)

                        Button("Review now") {
                            appState.hostTab = .bookings
                        }
                        .buttonStyle(SecondaryPillButtonStyle())
                    }
                    .hayameCard()
                }

                HStack(spacing: 10) {
                    StatTile(title: "Total earnings", value: "GHS\(totalEarnings)")
                    StatTile(title: "This month", value: "GHS\(monthlyEarnings)")
                }

                HStack(spacing: 10) {
                    StatTile(title: "My cars", value: "\(appState.hostCars.count)")
                    StatTile(title: "Reviews", value: String(format: "%.1f/5", averageRating))
                }

                SectionHeader(title: "Quick nav")

                HostDashboardRow(
                    title: "Overview",
                    subtitle: "Snapshot of host performance",
                    systemImage: "rectangle.grid.2x2.fill"
                ) {}

                HostDashboardRow(
                    title: "Vehicles",
                    subtitle: "Create and manage car listings",
                    systemImage: "car"
                ) {
                    appState.hostTab = .cars
                }

                HostDashboardRow(
                    title: "Add car",
                    subtitle: "Create a new listing",
                    systemImage: "plus.circle"
                ) {
                    appState.hostTab = .cars
                }

                HostDashboardRow(
                    title: "Bookings",
                    subtitle: "Review requests and trip history",
                    systemImage: "calendar.badge.clock"
                ) {
                    appState.hostTab = .bookings
                }

                HostDashboardRow(
                    title: "Earnings",
                    subtitle: "Track payout performance",
                    systemImage: "cedisign.circle"
                ) {
                    appState.hostTab = .earnings
                }

                HostDashboardRow(
                    title: "Unread messages",
                    subtitle: appState.unreadMessagesCount > 0
                        ? "\(appState.unreadMessagesCount) unread chat message(s)."
                        : "No unread messages.",
                    systemImage: "envelope.badge"
                ) {
                    appState.hostTab = .inbox
                }

                HostDashboardRow(
                    title: appState.unreadMessagesCount > 0 ? "Chats \(appState.unreadMessagesCount)" : "Chats",
                    subtitle: "Open and respond to guest conversations.",
                    systemImage: "message"
                ) {
                    appState.hostTab = .inbox
                }

                HostDashboardRow(
                    title: "Reviews",
                    subtitle: "Read guest feedback",
                    systemImage: "star.bubble"
                ) {
                    appState.hostTab = .profile
                }

                HostDashboardRow(
                    title: "Favorites insights",
                    subtitle: "See most-saved listings",
                    systemImage: "heart.text.square"
                ) {
                    appState.hostTab = .profile
                }

                HostDashboardRow(
                    title: "Settings",
                    subtitle: "Manage host settings",
                    systemImage: "person"
                ) {
                    appState.hostTab = .profile
                }
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Dashboard")
        .refreshable {
            await appState.refreshAllRemoteData()
        }
    }

    @ViewBuilder
    private var hostAvatar: some View {
        if let url = RemoteImageURLResolver.resolve(appState.currentUser.avatar) {
            CachedRemoteImage(url: url, targetSize: CGSize(width: 48, height: 48)) {
                Circle().fill(HayameTheme.brandLight)
            } failure: {
                fallbackAvatar
            }
            .frame(width: 48, height: 48)
            .clipShape(Circle())
            .overlay(Circle().stroke(Color.black.opacity(0.08), lineWidth: 1))
        } else {
            fallbackAvatar
                .frame(width: 48, height: 48)
                .overlay(Circle().stroke(Color.black.opacity(0.08), lineWidth: 1))
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
                Text(initials.isEmpty ? "H" : initials)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)
            )
    }
}

private struct HostDashboardRow: View {
    let title: String
    let subtitle: String
    let systemImage: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HostDashboardRowLabel(title: title, subtitle: subtitle, systemImage: systemImage)
        }
        .buttonStyle(.plain)
    }
}

private struct HostDashboardRowLabel: View {
    let title: String
    let subtitle: String
    let systemImage: String

    var body: some View {
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
}

struct HostCarsScreen: View {
    @EnvironmentObject private var appState: AppState
    @State private var deleteTarget: Car?
    @State private var isDeleting = false

    var body: some View {
        List {
            Section {
                NavigationLink {
                    ListingEditorScreen(mode: .create)
                } label: {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                            .foregroundStyle(HayameTheme.brandBlue)
                        Text("Create Listing")
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                    }
                }
            }

            Section("My car listing") {
                if case .loading = appState.publicCarsLoadState, appState.hostCars.isEmpty {
                    ForEach(0..<4, id: \.self) { _ in
                        HostListingPlaceholderRow()
                    }
                } else if case .error(let message) = appState.publicCarsLoadState, appState.hostCars.isEmpty {
                    ErrorStateCard(
                        title: "Listings unavailable",
                        message: message,
                        actionTitle: "Refresh"
                    ) {
                        appState.retryCars()
                    }
                } else if appState.hostCars.isEmpty {
                    Text("No listings yet")
                } else {
                    ForEach(appState.hostCars) { car in
                        let status = listingStatusStyle(for: car.approvalStatus)
                        NavigationLink {
                            ListingEditorScreen(mode: .edit(car))
                        } label: {
                            HStack(alignment: .top, spacing: 12) {
                                HostListingThumbnailView(
                                    url: car.imageNames.compactMap(RemoteImageURLResolver.resolve).first
                                )

                                VStack(alignment: .leading, spacing: 8) {
                                    HStack(alignment: .top, spacing: 10) {
                                        Text(car.displayTitle)
                                            .font(.system(size: 15, weight: .bold, design: .rounded))
                                            .foregroundStyle(HayameTheme.brandNavy)
                                            .lineLimit(2)
                                        Spacer(minLength: 8)
                                        Text(status.label)
                                            .font(.system(size: 10, weight: .bold, design: .rounded))
                                            .foregroundStyle(status.color)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 4)
                                            .background(status.color.opacity(0.14))
                                            .clipShape(Capsule())
                                    }

                                    Text("\(car.city), \(car.region)")
                                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                                        .foregroundStyle(HayameTheme.mutedText)
                                        .lineLimit(2)

                                    Text("GHS\(car.dailyPrice)/day")
                                        .font(.system(size: 13, weight: .bold, design: .rounded))
                                        .foregroundStyle(HayameTheme.brandBlue)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                        .swipeActions(edge: .trailing) {
                            Button(role: .destructive) {
                                deleteTarget = car
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                            .disabled(isDeleting)
                        }
                    }
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(HayameTheme.pageBackground)
        .navigationTitle("My Cars")
        .refreshable {
            await appState.refreshAllRemoteData()
        }
        .confirmationDialog(
            "Delete this listing?",
            isPresented: Binding(
                get: { deleteTarget != nil },
                set: { presented in
                    if !presented { deleteTarget = nil }
                }
            ),
            titleVisibility: .visible
        ) {
            Button("Delete Listing", role: .destructive) {
                guard let target = deleteTarget else { return }
                isDeleting = true
                Task {
                    defer { isDeleting = false }
                    do {
                        try await appState.deleteListingNow(target)
                    } catch {
                        appState.syncErrorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
                    }
                    deleteTarget = nil
                }
            }
            Button("Cancel", role: .cancel) {
                deleteTarget = nil
            }
        } message: {
            if let target = deleteTarget {
                Text("This will permanently remove \(target.displayTitle) and its photos.")
            }
        }
    }

    private func listingStatusStyle(for rawStatus: String) -> (label: String, color: Color) {
        switch rawStatus.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {
        case "approved":
            return ("Approved", HayameTheme.success)
        default:
            return ("Pending", HayameTheme.warning)
        }
    }
}

enum ListingEditorMode {
    case create
    case edit(Car)
}

struct ListingEditorScreen: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    let mode: ListingEditorMode

    @State private var draft = ListingDraft()
    @State private var isSaving = false
    @State private var editorNotice: String?
    @State private var editorError: String?
    @State private var pendingPickerItems: [PhotosPickerItem] = []
    @State private var pendingUploads: [PendingListingUpload] = []
    @State private var showFileImporter = false
    @State private var currentStep: ListingEditorStep = .basicInfo
    @State private var isMovingForward = true
    @State private var showInsuranceField = false
    @State private var showDepositField = false
    @State private var showOutsideRegionFeeField = false
    @State private var draggedPendingUploadID: PendingListingUpload.ID?
    @State private var hasCustomTitleOverride = false
    @State private var lastAutoGeneratedTitle = ""

    private let maxPhotos = 7
    private let maxPhotoBytes = 4 * 1024 * 1024
    private let createDraftStorageKey = "hayame.host.create_listing_draft.v1"
    private let minListingYear = 2000

    private var maxListingYear: Int {
        Calendar.current.component(.year, from: Date()) + 1
    }

    private var listingYearRangeLabel: String {
        "Valid range: " + String(minListingYear) + "-" + String(maxListingYear)
    }

    struct PendingListingUpload: Identifiable, Equatable {
        let id = UUID()
        let name: String
        let data: Data
        let preview: UIImage?

        static func == (lhs: PendingListingUpload, rhs: PendingListingUpload) -> Bool {
            lhs.id == rhs.id
        }
    }

    private var modelOptions: [String] {
        MockDataService.models(for: draft.brand, preferred: draft.model)
    }

    private var strictModelOptions: [String] {
        MockDataService.models(for: draft.brand)
    }

    private var yearOptions: [Int] {
        Array((minListingYear...maxListingYear).reversed())
    }

    private var cityOptions: [String] {
        MockDataService.cities(for: draft.region, preferred: draft.city).filter { !$0.isEmpty }
    }

    private var strictCityOptions: [String] {
        MockDataService.cities(for: draft.region).filter { !$0.isEmpty }
    }

    private var modeTitle: String {
        switch mode {
        case .create: return "Create Listing"
        case .edit: return "Edit Listing"
        }
    }

    private var isCreate: Bool {
        if case .create = mode {
            return true
        }
        return false
    }

    private var primaryButtonTitle: String {
        if currentStep == .review {
            return isSaving ? "Publishing..." : (isCreate ? "Publish Listing" : "Save Listing")
        }
        return "Next"
    }

    private var pricingSuggestion: ClosedRange<Int> {
        let base: Int
        switch draft.carType.lowercased() {
        case "luxury":
            base = 520
        case "van":
            base = 360
        case "pickup":
            base = 340
        case "suv":
            base = 310
        case "coupe":
            base = 290
        case "hatchback":
            base = 220
        default:
            base = 250
        }

        let ageOffset = (draft.year - 2018) * 8
        let lower = max(120, base + ageOffset)
        return lower...(lower + 70)
    }

    private var pricingHintText: String {
        "Suggested: GHS \(pricingSuggestion.lowerBound)–\(pricingSuggestion.upperBound)/day"
    }

    private var currentCoverPreview: UIImage? {
        pendingUploads.first?.preview
    }

    private var generatedListingTitle: String? {
        buildListingTitle(
            brand: draft.brand,
            model: draft.model,
            carYear: draft.year
        )
    }

    private var generatedListingTitlePreview: String {
        buildListingTitlePreview(
            brand: draft.brand,
            model: draft.model,
            carYear: draft.year
        )
    }

    private var existingCoverURL: URL? {
        guard case .edit(let car) = mode else { return nil }
        return car.imageNames.compactMap(RemoteImageURLResolver.resolve).first
    }

    private var selectedPhotosSummary: String {
        if isCreate {
            return pendingUploads.isEmpty ? "No photos added yet" : "\(pendingUploads.count) photo\(pendingUploads.count == 1 ? "" : "s") ready"
        }
        if case .edit(let car) = mode {
            let count = car.imageNames.count
            return count == 0 ? "No photos uploaded yet" : "\(count) current photo\(count == 1 ? "" : "s")"
        }
        return "No photos"
    }

    private var stepTransition: AnyTransition {
        let insertionEdge: Edge = isMovingForward ? .trailing : .leading
        let removalEdge: Edge = isMovingForward ? .leading : .trailing
        return .asymmetric(
            insertion: .move(edge: insertionEdge).combined(with: .opacity),
            removal: .move(edge: removalEdge).combined(with: .opacity)
        )
    }

    private var titleBinding: Binding<String> {
        Binding(
            get: { draft.title },
            set: { newValue in
                draft.title = newValue
                updateTitleOverrideState(using: newValue)
            }
        )
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 18) {
                ListingEditorProgressHeader(currentStep: currentStep)

                if let editorNotice, !editorNotice.isEmpty {
                    ListingEditorStatusBanner(text: editorNotice, color: HayameTheme.success)
                }

                if let editorError, !editorError.isEmpty {
                    ListingEditorStatusBanner(text: editorError, color: HayameTheme.danger)
                }

                ZStack {
                    currentStepContent
                        .id(currentStep)
                        .transition(stepTransition)
                }

                if currentStep != .review, !isCreate {
                    ListingEditorSectionCard {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Availability")
                                .font(.system(size: 18, weight: .bold, design: .rounded))
                                .foregroundStyle(HayameTheme.brandNavy)
                            Text("Blocked dates stay in the existing availability editor after you save changes.")
                                .font(.system(size: 13, weight: .medium, design: .rounded))
                                .foregroundStyle(HayameTheme.mutedText)

                            if case .edit(let car) = mode {
                                NavigationLink("Edit blocked dates and weekly blocks") {
                                    HostAvailabilityEditorScreen(carID: car.id, carTitle: car.displayTitle)
                                }
                                .buttonStyle(SecondaryPillButtonStyle())
                            }
                        }
                    }
                }

                Color.clear.frame(height: 140)
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle(modeTitle)
        .navigationBarTitleDisplayMode(.inline)
        .scrollDismissesKeyboard(.interactively)
        .dismissKeyboardOnNonInputTap()
        .safeAreaInset(edge: .bottom, spacing: 0) {
            ListingEditorBottomBar(
                backTitle: currentStep == .basicInfo ? "Cancel" : "Back",
                primaryTitle: primaryButtonTitle,
                isPrimaryDisabled: isSaving,
                onBack: handleBackAction,
                onPrimary: handlePrimaryAction
            )
        }
        .toolbar {
            if isCreate {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Save Draft") {
                        persistCreateDraftIfNeeded()
                        editorNotice = "Draft saved on this device."
                        editorError = nil
                    }
                    .disabled(isSaving)
                }
            }
        }
        .onChange(of: draft.region) { _, newValue in
            draft.region = MockDataService.normalizedRegion(newValue)
            let options = strictCityOptions
            if !containsOption(draft.city, in: options) {
                draft.city = options.first ?? ""
            }
        }
        .onChange(of: draft.brand) { _, newValue in
            draft.brand = MockDataService.normalizedMake(newValue)
            let options = strictModelOptions
            if !containsOption(draft.model, in: options) {
                draft.model = ""
            }
            syncGeneratedListingTitleIfNeeded()
        }
        .onChange(of: draft.model) { _, _ in
            syncGeneratedListingTitleIfNeeded()
        }
        .onChange(of: draft.year) { _, _ in
            syncGeneratedListingTitleIfNeeded()
        }
        .onChange(of: draft.deliveryAvailable) { _, isAvailable in
            if !isAvailable {
                draft.deliveryFee = 0
            }
        }
        .onChange(of: pendingPickerItems) { _, newItems in
            guard !newItems.isEmpty else { return }
            Task {
                await queuePickerImages(newItems)
                pendingPickerItems = []
            }
        }
        .onChange(of: draft) { _, _ in
            persistCreateDraftIfNeeded()
        }
        .fileImporter(
            isPresented: $showFileImporter,
            allowedContentTypes: [.image],
            allowsMultipleSelection: true
        ) { result in
            Task { await queueFileImporterImages(result) }
        }
        .onAppear {
            switch mode {
            case .create:
                restoreCreateDraftIfAvailable()
            case .edit(let car):
                draft = ListingDraft(
                    id: car.id,
                    title: car.title,
                    brand: MockDataService.normalizedMake(car.brand),
                    model: car.model.trimmingCharacters(in: .whitespacesAndNewlines),
                    year: car.year,
                    price: car.dailyPrice,
                    region: MockDataService.normalizedRegion(car.region),
                    city: car.city,
                    carType: car.type,
                    transmission: car.transmission,
                    fuelType: car.fuelType,
                    seats: car.seats,
                    description: car.description,
                    instantBook: car.instantBook,
                    deliveryAvailable: car.deliveryAvailable,
                    airConditioning: car.airConditioning,
                    deliveryFee: car.deliveryAvailable ? car.deliveryFee : 0,
                    insuranceFee: car.insuranceFee,
                    depositAmount: car.depositAmount,
                    outsideAccraFee: car.outsideAccraFee,
                    cancellationPolicy: car.cancellationPolicy.isEmpty ? "Moderate" : car.cancellationPolicy
                )
            }
            showInsuranceField = draft.insuranceFee > 0
            showDepositField = draft.depositAmount > 0
            showOutsideRegionFeeField = draft.outsideAccraFee > 0
            configureGeneratedTitleState()
        }
        .onDisappear {
            persistCreateDraftIfNeeded()
        }
        .animation(.easeInOut(duration: 0.2), value: currentStep)
    }

    @ViewBuilder
    private var currentStepContent: some View {
        switch currentStep {
        case .basicInfo:
            VStack(alignment: .leading, spacing: 16) {
                ListingEditorStepIntro(
                    title: "Basic Info",
                    subtitle: "Keep it clear and searchable. Guests should understand the car at a glance."
                )
                ListingEditorSectionCard {
                    VStack(alignment: .leading, spacing: 16) {
                        ListingEditorInputField(
                            title: "Listing title",
                            text: titleBinding,
                            placeholder: "e.g. Honda Civic 2019",
                            helpTitle: "Listing title",
                            helpMessage: "We auto-generate the default title from the brand, model, and year so listings stay clean and consistent. You can still edit it if you need a custom title."
                        )
                        Text(
                            hasCustomTitleOverride
                                ? "Custom title active. Clear it to return to the default format: \(generatedListingTitlePreview)"
                                : "Default format: \(generatedListingTitlePreview)"
                        )
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)

                        ListingEditorSelectionField(
                            title: "Brand",
                            selected: draft.brand.isEmpty ? "Select brand" : draft.brand,
                            options: MockDataService.makesIncluding(draft.brand)
                        ) { selection in
                            let normalized = MockDataService.normalizedMake(selection)
                            if draft.brand.caseInsensitiveCompare(normalized) != .orderedSame {
                                draft.brand = normalized
                                if !containsOption(draft.model, in: MockDataService.models(for: normalized)) {
                                    draft.model = ""
                                }
                            } else {
                                draft.brand = normalized
                            }
                        }

                        ListingEditorSelectionField(
                            title: "Model",
                            selected: draft.model.isEmpty ? "Select model" : draft.model,
                            options: modelOptions
                        ) { selection in
                            draft.model = selection
                        }

                        ListingEditorSelectionField(
                            title: "Year",
                            selected: String(draft.year),
                            options: yearOptions.map(String.init)
                        ) { selection in
                            draft.year = Int(selection) ?? draft.year
                        }

                        Text(listingYearRangeLabel)
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                }
            }

        case .vehicleDetails:
            VStack(alignment: .leading, spacing: 16) {
                ListingEditorStepIntro(
                    title: "Vehicle Details",
                    subtitle: "Help guests picture the experience before they ever open the photos."
                )
                ListingEditorSectionCard {
                    VStack(alignment: .leading, spacing: 16) {
                        ListingEditorSelectionField(
                            title: "Car type",
                            selected: draft.carType.isEmpty ? "Select car type" : draft.carType,
                            options: MockDataService.carTypes
                        ) { draft.carType = $0 }

                        ListingEditorSelectionField(
                            title: "Transmission",
                            selected: draft.transmission,
                            options: MockDataService.transmissions
                        ) { draft.transmission = $0 }

                        ListingEditorSelectionField(
                            title: "Fuel type",
                            selected: draft.fuelType,
                            options: MockDataService.fuels
                        ) { draft.fuelType = $0 }

                        ListingEditorStepperField(
                            title: "Seats",
                            value: $draft.seats,
                            range: 2...8
                        )

                        ListingEditorTextArea(
                            title: "Description",
                            text: $draft.description,
                            placeholder: "Tell guests about condition, comfort, pickup ease, and anything useful before booking."
                        )

                        Text("Aim for at least 10 characters so the listing feels complete and trustworthy.")
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                }
            }

        case .pricing:
            VStack(alignment: .leading, spacing: 16) {
                ListingEditorStepIntro(
                    title: "Pricing",
                    subtitle: "Set the daily rate first, then add optional charges only if you need them."
                )

                ListingEditorSectionCard {
                    VStack(alignment: .leading, spacing: 16) {
                        ListingEditorHeroPriceField(value: $draft.price, suggestionText: pricingHintText)

                        VStack(alignment: .leading, spacing: 10) {
                            Text("Optional add-ons")
                                .font(.system(size: 15, weight: .bold, design: .rounded))
                                .foregroundStyle(HayameTheme.brandNavy)

                            if showInsuranceField || draft.insuranceFee > 0 {
                                CurrencyInput(
                                    label: "Insurance (per trip)",
                                    value: $draft.insuranceFee,
                                    range: 0...2_000,
                                    step: 10,
                                    zeroRendersAsEmpty: true
                                )
                                Button("Remove insurance") {
                                    showInsuranceField = false
                                    draft.insuranceFee = 0
                                }
                                .buttonStyle(SecondaryPillButtonStyle())
                            } else {
                                ListingEditorAddFieldButton(title: "Add insurance") {
                                    showInsuranceField = true
                                }
                            }

                            if showDepositField || draft.depositAmount > 0 {
                                CurrencyInput(
                                    label: "Security deposit",
                                    value: $draft.depositAmount,
                                    range: 0...5_000,
                                    step: 50,
                                    zeroRendersAsEmpty: true
                                )
                                Button("Remove security deposit") {
                                    showDepositField = false
                                    draft.depositAmount = 0
                                }
                                .buttonStyle(SecondaryPillButtonStyle())
                            } else {
                                ListingEditorAddFieldButton(title: "Add security deposit") {
                                    showDepositField = true
                                }
                            }
                        }
                    }
                }
            }

        case .location:
            VStack(alignment: .leading, spacing: 16) {
                ListingEditorStepIntro(
                    title: "Location",
                    subtitle: "Guests search by region and city first, so keep both accurate."
                )
                ListingEditorSectionCard {
                    VStack(alignment: .leading, spacing: 16) {
                        ListingEditorSelectionField(
                            title: "Region",
                            selected: draft.region.isEmpty ? "Select region" : draft.region,
                            options: MockDataService.regionsIncluding(draft.region)
                        ) { selection in
                            let normalized = MockDataService.normalizedRegion(selection)
                            if draft.region.caseInsensitiveCompare(normalized) != .orderedSame {
                                draft.region = normalized
                                let options = MockDataService.cities(for: normalized).filter { !$0.isEmpty }
                                if !containsOption(draft.city, in: options) {
                                    draft.city = options.first ?? ""
                                }
                            } else {
                                draft.region = normalized
                            }
                        }

                        ListingEditorSelectionField(
                            title: "City",
                            selected: draft.city.isEmpty ? "Select city" : draft.city,
                            options: cityOptions
                        ) { draft.city = $0 }

                        Text("We’ll use this to place the listing where guests browse nearby cars.")
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                }
            }

        case .featuresAndRules:
            VStack(alignment: .leading, spacing: 16) {
                ListingEditorStepIntro(
                    title: "Features & Rules",
                    subtitle: "Choose the booking settings that define how the listing behaves."
                )
                ListingEditorSectionCard {
                    VStack(alignment: .leading, spacing: 14) {
                        ListingEditorToggleRow(
                            title: "Instant Book",
                            subtitle: "Let qualified guests book faster.",
                            helpTitle: "Instant Book",
                            helpMessage: "When Instant Book is on, guests can confirm the trip immediately after payment instead of waiting for you to manually approve the request.",
                            isOn: $draft.instantBook
                        )
                        ListingEditorToggleRow(
                            title: "Delivery",
                            subtitle: "Offer drop-off or pickup service.",
                            helpTitle: "Delivery",
                            helpMessage: "Turn this on if you want guests to choose delivery during checkout. Add a delivery fee only if you charge for bringing the car to them.",
                            isOn: $draft.deliveryAvailable
                        )
                        ListingEditorToggleRow(title: "Air conditioning", subtitle: "Highlight comfort as a visible feature.", isOn: $draft.airConditioning)

                        ListingEditorSelectionField(
                            title: "Cancellation policy",
                            selected: draft.cancellationPolicy,
                            options: ["Flexible", "Moderate", "Strict"]
                        ) { draft.cancellationPolicy = $0 }
                    }
                }

                if draft.deliveryAvailable || draft.deliveryFee > 0 {
                    ListingEditorSectionCard {
                        VStack(alignment: .leading, spacing: 16) {
                            CurrencyInput(
                                label: "Delivery fee",
                                value: $draft.deliveryFee,
                                range: 0...2_000,
                                step: 10,
                                zeroRendersAsEmpty: true
                            )
                            Text("Only applied when delivery is enabled.")
                                .font(.system(size: 12, weight: .medium, design: .rounded))
                                .foregroundStyle(HayameTheme.mutedText)
                        }
                    }
                }

                ListingEditorSectionCard {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Extra trip rule")
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                            .foregroundStyle(HayameTheme.brandNavy)

                        if showOutsideRegionFeeField || draft.outsideAccraFee > 0 {
                            CurrencyInput(
                                label: "Outside listing region fee",
                                value: $draft.outsideAccraFee,
                                range: 0...3_000,
                                step: 20,
                                zeroRendersAsEmpty: true
                            )
                            Button("Remove outside-region fee") {
                                showOutsideRegionFeeField = false
                                draft.outsideAccraFee = 0
                            }
                            .buttonStyle(SecondaryPillButtonStyle())
                        } else {
                            ListingEditorAddFieldButton(title: "Add outside listing region fee") {
                                showOutsideRegionFeeField = true
                            }
                        }
                    }
                }
            }

        case .photos:
            VStack(alignment: .leading, spacing: 16) {
                ListingEditorStepIntro(
                    title: "Photos",
                    subtitle: "Lead with the strongest image. The first photo becomes the cover guests see everywhere."
                )

                ListingEditorSectionCard {
                    VStack(alignment: .leading, spacing: 14) {
                        Text("Upload clean exterior and interior shots. Maximum \(maxPhotos) photos, up to 4MB each.")
                            .font(.system(size: 13, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)

                        if isCreate {
                            if pendingUploads.isEmpty {
                                RoundedRectangle(cornerRadius: 20, style: .continuous)
                                    .fill(HayameTheme.brandLight)
                                    .frame(height: 180)
                                    .overlay(
                                        VStack(spacing: 10) {
                                            Image(systemName: "photo.on.rectangle.angled")
                                                .font(.system(size: 28, weight: .bold))
                                                .foregroundStyle(HayameTheme.brandBlue)
                                            Text("No photos selected yet")
                                                .font(.system(size: 15, weight: .bold, design: .rounded))
                                                .foregroundStyle(HayameTheme.brandNavy)
                                        }
                                    )
                            } else {
                                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                                    ForEach(Array(pendingUploads.enumerated()), id: \.element.id) { index, pending in
                                        ListingEditorPendingPhotoTile(
                                            upload: pending,
                                            isCover: index == 0,
                                            onRemove: {
                                                removePendingUpload(id: pending.id)
                                            }
                                        )
                                        .onDrag {
                                            draggedPendingUploadID = pending.id
                                            return NSItemProvider(object: pending.id.uuidString as NSString)
                                        }
                                        .onDrop(
                                            of: [UTType.text],
                                            delegate: PendingUploadDropDelegate(
                                                target: pending,
                                                items: $pendingUploads,
                                                draggedID: $draggedPendingUploadID
                                            )
                                        )
                                    }
                                }

                                Text("Drag to reorder. The first photo is always the cover.")
                                    .font(.system(size: 12, weight: .medium, design: .rounded))
                                    .foregroundStyle(HayameTheme.mutedText)
                            }

                            PhotosPicker(
                                selection: $pendingPickerItems,
                                maxSelectionCount: max(0, maxPhotos - pendingUploads.count),
                                matching: .images
                            ) {
                                Text(pendingUploads.count >= maxPhotos ? "Photo limit reached" : "Add from Photos")
                            }
                            .buttonStyle(SecondaryPillButtonStyle())
                            .disabled(isSaving || pendingUploads.count >= maxPhotos)

                            Button("Add from Files") {
                                showFileImporter = true
                            }
                            .buttonStyle(SecondaryPillButtonStyle())
                            .disabled(isSaving || pendingUploads.count >= maxPhotos)
                        } else {
                            if let existingCoverURL {
                                CachedRemoteImage(url: existingCoverURL, targetSize: CGSize(width: 760, height: 540)) {
                                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                                        .fill(HayameTheme.brandLight)
                                } failure: {
                                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                                        .fill(HayameTheme.brandLight)
                                }
                                .frame(height: 200)
                                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                                .overlay(alignment: .topLeading) {
                                    Text("Current cover")
                                        .font(.system(size: 11, weight: .bold, design: .rounded))
                                        .foregroundStyle(.white)
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 6)
                                        .background(HayameTheme.brandBlue)
                                        .clipShape(Capsule())
                                        .padding(12)
                                }
                            }

                            if case .edit(let car) = mode {
                                NavigationLink("Manage listing photos") {
                                    HostListingPhotosScreen(carID: car.id, carTitle: car.displayTitle)
                                }
                                .buttonStyle(SecondaryPillButtonStyle())
                            }
                        }
                    }
                }
            }

        case .review:
            VStack(alignment: .leading, spacing: 16) {
                ListingEditorStepIntro(
                    title: "Review & Publish",
                    subtitle: "Check the full listing once, then publish with confidence."
                )

                reviewSummaryCard(
                    title: "Basic info",
                    step: .basicInfo,
                    lines: [
                        draft.title.isEmpty ? "Title pending" : draft.title,
                        [draft.brand, draft.model, String(draft.year)].filter { !$0.isEmpty }.joined(separator: " • ")
                    ]
                )

                reviewSummaryCard(
                    title: "Vehicle details",
                    step: .vehicleDetails,
                    lines: [
                        [draft.carType, draft.transmission, draft.fuelType].filter { !$0.isEmpty }.joined(separator: " • "),
                        "\(draft.seats) seats",
                        draft.description.isEmpty ? "Description pending" : draft.description
                    ]
                )

                reviewSummaryCard(
                    title: "Pricing",
                    step: .pricing,
                    lines: [
                        "GHS \(draft.price) / day",
                        draft.insuranceFee > 0 ? "Insurance: GHS \(draft.insuranceFee)" : "Insurance not added",
                        draft.depositAmount > 0 ? "Deposit: GHS \(draft.depositAmount)" : "Deposit not added"
                    ]
                )

                reviewSummaryCard(
                    title: "Location",
                    step: .location,
                    lines: [
                        draft.region.isEmpty ? "Region pending" : draft.region,
                        draft.city.isEmpty ? "City pending" : draft.city
                    ]
                )

                reviewSummaryCard(
                    title: "Features & rules",
                    step: .featuresAndRules,
                    lines: [
                        draft.instantBook ? "Instant Book enabled" : "Instant Book off",
                        draft.deliveryAvailable ? "Delivery enabled" : "Delivery off",
                        draft.airConditioning ? "Air conditioning included" : "Air conditioning off",
                        draft.cancellationPolicy
                    ]
                )

                ListingEditorSectionCard {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Photos")
                                .font(.system(size: 16, weight: .bold, design: .rounded))
                                .foregroundStyle(HayameTheme.brandNavy)
                            Spacer()
                            Button("Edit") {
                                jump(to: .photos)
                            }
                            .font(.system(size: 13, weight: .bold, design: .rounded))
                        }

                        Text(selectedPhotosSummary)
                            .font(.system(size: 13, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)

                        if let currentCoverPreview {
                            Image(uiImage: currentCoverPreview)
                                .resizable()
                                .scaledToFill()
                                .frame(height: 180)
                                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                        } else if let existingCoverURL {
                            CachedRemoteImage(url: existingCoverURL, targetSize: CGSize(width: 760, height: 540)) {
                                RoundedRectangle(cornerRadius: 16, style: .continuous)
                                    .fill(HayameTheme.brandLight)
                            } failure: {
                                RoundedRectangle(cornerRadius: 16, style: .continuous)
                                    .fill(HayameTheme.brandLight)
                            }
                            .frame(height: 180)
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                        }
                    }
                }
            }
        }
    }

    private func reviewSummaryCard(title: String, step: ListingEditorStep, lines: [String]) -> some View {
        ListingEditorSectionCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text(title)
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Spacer()
                    Button("Edit") {
                        jump(to: step)
                    }
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                }

                ForEach(lines.filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }, id: \.self) { line in
                    Text(line)
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)
                }
            }
        }
    }

    private func handleBackAction() {
        if currentStep == .basicInfo {
            dismiss()
            return
        }
        guard let previous = currentStep.previous else { return }
        jump(to: previous)
    }

    private func handlePrimaryAction() {
        editorNotice = nil
        if currentStep == .review {
            Task { await saveListing() }
            return
        }

        if let error = validationError(for: currentStep) {
            editorError = error
            return
        }

        editorError = nil
        if let next = currentStep.next {
            jump(to: next)
        }
    }

    private func jump(to step: ListingEditorStep) {
        isMovingForward = step.rawValue > currentStep.rawValue
        withAnimation(.easeInOut(duration: 0.22)) {
            currentStep = step
        }
    }

    @MainActor
    private func saveListing() async {
        guard !isSaving else { return }
        if let invalidStep = firstInvalidStep(), let error = validationError(for: invalidStep) {
            editorError = error
            jump(to: invalidStep)
            return
        }
        isSaving = true
        editorError = nil
        editorNotice = nil
        defer { isSaving = false }

        do {
            switch mode {
            case .create:
                let created = try await appState.createListingNow(from: draft)
                let uploadsToProcess = Array(pendingUploads.prefix(maxPhotos))
                clearCreateDraft()
                pendingUploads = []
                draft = ListingDraft()
                if !uploadsToProcess.isEmpty {
                    Task {
                        await uploadPendingPhotosAfterCreation(
                            carID: created.id,
                            uploads: uploadsToProcess
                        )
                    }
                }
                appState.hostTab = .cars
                dismiss()
            case .edit(let car):
                _ = try await appState.updateListingNow(car, from: draft)
                appState.hostTab = .cars
                dismiss()
            }
        } catch {
            editorError = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    @MainActor
    private func uploadPendingPhotosAfterCreation(
        carID: String,
        uploads: [PendingListingUpload]
    ) async {
        var uploadFailures: [String] = []

        for pending in uploads {
            do {
                _ = try await appState.uploadListingPhoto(
                    carID: carID,
                    fileData: pending.data,
                    fileName: "car-photo-\(UUID().uuidString).jpg",
                    mimeType: "image/jpeg",
                    replacePhotoID: nil
                )
            } catch {
                uploadFailures.append((error as? LocalizedError)?.errorDescription ?? error.localizedDescription)
            }
        }

        if !uploadFailures.isEmpty {
            appState.syncErrorMessage = "Listing created, but some photos failed to upload. Open the listing and add the remaining photos."
        }
    }

    @MainActor
    private func queuePickerImages(_ items: [PhotosPickerItem]) async {
        guard case .create = mode else { return }
        var imported = 0

        for item in items {
            guard pendingUploads.count < maxPhotos else { break }
            do {
                guard let rawData = try await item.loadTransferable(type: Data.self) else { continue }
                let prepared = try prepareImageForListingUpload(rawData)
                appendPendingUpload(data: prepared, name: "photo-\(pendingUploads.count + 1).jpg")
                imported += 1
            } catch {
                editorError = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            }
        }

        if imported > 0 {
            editorNotice = "\(pendingUploads.count) photo(s) ready."
        }
    }

    @MainActor
    private func queueFileImporterImages(_ result: Result<[URL], Error>) async {
        guard case .create = mode else { return }
        switch result {
        case .failure(let error):
            editorError = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        case .success(let urls):
            var imported = 0
            for url in urls {
                guard pendingUploads.count < maxPhotos else { break }
                let secured = url.startAccessingSecurityScopedResource()
                do {
                    let data = try Data(contentsOf: url)
                    let prepared = try prepareImageForListingUpload(data)
                    appendPendingUpload(data: prepared, name: url.lastPathComponent)
                    imported += 1
                } catch {
                    editorError = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
                }
                if secured {
                    url.stopAccessingSecurityScopedResource()
                }
            }
            if imported > 0 {
                editorNotice = "\(pendingUploads.count) photo(s) ready."
            }
        }
    }

    private func appendPendingUpload(data: Data, name: String) {
        guard pendingUploads.count < maxPhotos else { return }
        pendingUploads.append(
            PendingListingUpload(
                name: name,
                data: data,
                preview: UIImage(data: data)
            )
        )
    }

    private func removePendingUpload(id: PendingListingUpload.ID) {
        pendingUploads.removeAll { $0.id == id }
        editorNotice = pendingUploads.isEmpty ? nil : "\(pendingUploads.count) photo(s) ready."
    }

    private func prepareImageForListingUpload(_ data: Data) throws -> Data {
        try prepareListingImageForUpload(data: data, maxBytes: maxPhotoBytes)
    }

    private func persistCreateDraftIfNeeded() {
        guard case .create = mode else { return }
        let defaults = UserDefaults.standard
        if draft == ListingDraft() {
            defaults.removeObject(forKey: createDraftStorageKey)
            return
        }
        if let encoded = try? JSONEncoder().encode(draft) {
            defaults.set(encoded, forKey: createDraftStorageKey)
        }
    }

    private func restoreCreateDraftIfAvailable() {
        guard case .create = mode else { return }
        let defaults = UserDefaults.standard
        guard let data = defaults.data(forKey: createDraftStorageKey) else { return }
        guard let decoded = try? JSONDecoder().decode(ListingDraft.self, from: data) else { return }
        draft = decoded
        editorNotice = "Draft restored."
    }

    private func clearCreateDraft() {
        UserDefaults.standard.removeObject(forKey: createDraftStorageKey)
    }

    private func containsOption(_ value: String, in options: [String]) -> Bool {
        let trimmedValue = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedValue.isEmpty else { return false }
        return options.contains(where: { $0.caseInsensitiveCompare(trimmedValue) == .orderedSame })
    }

    private func normalizedTitle(_ value: String) -> String {
        value
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: #"\s+"#, with: " ", options: .regularExpression)
    }

    private func configureGeneratedTitleState() {
        let generated = normalizedTitle(generatedListingTitle ?? "")
        let current = normalizedTitle(draft.title)
        lastAutoGeneratedTitle = generated
        hasCustomTitleOverride = !current.isEmpty &&
            (generated.isEmpty || current.caseInsensitiveCompare(generated) != .orderedSame)

        if current.isEmpty, !generated.isEmpty {
            draft.title = generated
            hasCustomTitleOverride = false
        }
    }

    private func updateTitleOverrideState(using rawValue: String) {
        let current = normalizedTitle(rawValue)
        let generated = normalizedTitle(generatedListingTitle ?? "")
        hasCustomTitleOverride = !current.isEmpty &&
            (generated.isEmpty || current.caseInsensitiveCompare(generated) != .orderedSame)

        if current.isEmpty {
            syncGeneratedListingTitleIfNeeded(force: true)
        }
    }

    private func syncGeneratedListingTitleIfNeeded(force: Bool = false) {
        let generated = normalizedTitle(generatedListingTitle ?? "")
        let current = normalizedTitle(draft.title)
        let previousGenerated = normalizedTitle(lastAutoGeneratedTitle)
        let matchesPreviousGenerated = !previousGenerated.isEmpty &&
            current.caseInsensitiveCompare(previousGenerated) == .orderedSame
        let shouldApply = force || current.isEmpty || !hasCustomTitleOverride || matchesPreviousGenerated

        lastAutoGeneratedTitle = generated

        if generated.isEmpty, !force, !current.isEmpty {
            return
        }

        guard shouldApply else { return }
        if draft.title != generated {
            draft.title = generated
        }
        hasCustomTitleOverride = false
    }

    private func firstInvalidStep() -> ListingEditorStep? {
        ListingEditorStep.allCases.first { validationError(for: $0) != nil }
    }

    private func validationError(for step: ListingEditorStep) -> String? {
        switch step {
        case .basicInfo:
            if draft.title.trimmingCharacters(in: .whitespacesAndNewlines).count < 3 {
                return "Add a listing title before continuing."
            }
            if draft.brand.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                return "Select a brand to continue."
            }
            if draft.model.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                return "Select a model to continue."
            }
            if !(minListingYear...maxListingYear).contains(draft.year) {
                return "Choose a valid year."
            }
        case .vehicleDetails:
            if draft.carType.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                return "Select a car type to continue."
            }
            if !(2...8).contains(draft.seats) {
                return "Seats must be between 2 and 8."
            }
            if draft.description.trimmingCharacters(in: .whitespacesAndNewlines).count < 10 {
                return "Description must be at least 10 characters."
            }
        case .pricing:
            if !(50...10_000).contains(draft.price) {
                return "Daily price must be between GHS 50 and GHS 10,000."
            }
        case .location:
            if draft.region.trimmingCharacters(in: .whitespacesAndNewlines).count < 2 {
                return "Select a region to continue."
            }
            if draft.city.trimmingCharacters(in: .whitespacesAndNewlines).count < 2 {
                return "Select a city to continue."
            }
        case .featuresAndRules:
            if !["Flexible", "Moderate", "Strict"].contains(draft.cancellationPolicy) {
                return "Choose a valid cancellation policy."
            }
        case .photos:
            if isCreate && pendingUploads.isEmpty {
                return "Add at least one photo before publishing."
            }
        case .review:
            return nil
        }
        return nil
    }
}

private enum ListingEditorStep: Int, CaseIterable, Identifiable {
    case basicInfo
    case vehicleDetails
    case pricing
    case location
    case featuresAndRules
    case photos
    case review

    var id: Int { rawValue }

    var number: Int { rawValue + 1 }

    var title: String {
        switch self {
        case .basicInfo: return "Basic Info"
        case .vehicleDetails: return "Vehicle Details"
        case .pricing: return "Pricing"
        case .location: return "Location"
        case .featuresAndRules: return "Features & Rules"
        case .photos: return "Photos"
        case .review: return "Review & Publish"
        }
    }

    var shortTitle: String {
        switch self {
        case .basicInfo: return "Info"
        case .vehicleDetails: return "Details"
        case .pricing: return "Pricing"
        case .location: return "Place"
        case .featuresAndRules: return "Rules"
        case .photos: return "Photos"
        case .review: return "Review"
        }
    }

    var next: ListingEditorStep? {
        ListingEditorStep(rawValue: rawValue + 1)
    }

    var previous: ListingEditorStep? {
        ListingEditorStep(rawValue: rawValue - 1)
    }
}

private struct ListingEditorProgressHeader: View {
    let currentStep: ListingEditorStep

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Step \(currentStep.number) of \(ListingEditorStep.allCases.count)")
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandBlue)

            Text(currentStep.title)
                .font(.system(size: 30, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)

            HStack(spacing: 8) {
                ForEach(ListingEditorStep.allCases) { step in
                    VStack(spacing: 6) {
                        Capsule()
                            .fill(step.rawValue <= currentStep.rawValue ? HayameTheme.brandBlue : Color.white)
                            .frame(height: 8)
                            .overlay(
                                Capsule()
                                    .stroke(
                                        step.rawValue <= currentStep.rawValue ? HayameTheme.brandBlue : Color.black.opacity(0.08),
                                        lineWidth: 1
                                    )
                            )
                        Text(step.shortTitle)
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                            .foregroundStyle(step == currentStep ? HayameTheme.brandBlue : HayameTheme.mutedText)
                            .lineLimit(1)
                            .minimumScaleFactor(0.72)
                            .multilineTextAlignment(.center)
                            .frame(maxWidth: .infinity)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .padding(18)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(Color.black.opacity(0.05), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.05), radius: 12, x: 0, y: 6)
    }
}

private struct ListingEditorStepIntro: View {
    let title: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 24, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)
            Text(subtitle)
                .font(.system(size: 13, weight: .medium, design: .rounded))
                .foregroundStyle(HayameTheme.mutedText)
        }
    }
}

private struct ListingEditorSectionCard<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            content
        }
        .padding(18)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(Color.black.opacity(0.05), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.05), radius: 12, x: 0, y: 6)
    }
}

private struct ListingEditorStatusBanner: View {
    let text: String
    let color: Color

    var body: some View {
        HStack(spacing: 10) {
            Circle()
                .fill(color)
                .frame(width: 10, height: 10)
            Text(text)
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundStyle(color)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(color.opacity(0.08), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

private struct ListingEditorInputField: View {
    let title: String
    @Binding var text: String
    let placeholder: String
    var helpTitle: String? = nil
    var helpMessage: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ListingEditorFieldLabel(
                title: title,
                helpTitle: helpTitle,
                helpMessage: helpMessage
            )

            TextField(placeholder, text: $text)
                .textInputAutocapitalization(.words)
                .disableAutocorrection(true)
                .padding(.horizontal, 14)
                .padding(.vertical, 14)
                .background(HayameTheme.brandLight, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color.black.opacity(0.05), lineWidth: 1)
                )
        }
    }
}

private struct ListingEditorSelectionField: View {
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
                ForEach(options.filter { !$0.isEmpty }, id: \.self) { option in
                    Button(option) {
                        onSelected(option)
                    }
                }
            } label: {
                HStack(spacing: 12) {
                    Text(selected)
                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                        .foregroundStyle(selected.localizedCaseInsensitiveContains("select") ? HayameTheme.mutedText : HayameTheme.brandNavy)
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
                        .stroke(Color.black.opacity(0.05), lineWidth: 1)
                )
            }
        }
    }
}

private struct ListingEditorTextArea: View {
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
                            .stroke(Color.black.opacity(0.05), lineWidth: 1)
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
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .frame(minHeight: 160)
                    .background(Color.clear)
            }
        }
    }
}

private struct ListingEditorStepperField: View {
    let title: String
    @Binding var value: Int
    let range: ClosedRange<Int>

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)

            HStack(spacing: 12) {
                Button {
                    value = max(range.lowerBound, value - 1)
                } label: {
                    Image(systemName: "minus")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .frame(width: 44, height: 44)
                        .background(HayameTheme.brandLight)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .buttonStyle(.plain)

                Text("\(value) seats")
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandBlue)
                    .frame(maxWidth: .infinity)

                Button {
                    value = min(range.upperBound, value + 1)
                } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .frame(width: 44, height: 44)
                        .background(HayameTheme.brandLight)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .buttonStyle(.plain)
            }
            .padding(14)
            .background(Color.white, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(Color.black.opacity(0.05), lineWidth: 1)
            )
        }
    }
}

private struct ListingEditorHeroPriceField: View {
    @Binding var value: Int
    let suggestionText: String

    @State private var textValue = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Daily price")
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)

            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text("GHS")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandBlue)

                TextField("300", text: Binding(
                    get: { textValue },
                    set: { updateValue($0) }
                ))
                .keyboardType(.numberPad)
                .font(.system(size: 34, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)

                Spacer()

                Text("/ day")
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)
            }
            .padding(18)
            .background(HayameTheme.brandLight, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .stroke(HayameTheme.brandBlue.opacity(0.14), lineWidth: 1)
            )

            Text(suggestionText)
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundStyle(HayameTheme.brandBlue)

            Text("This is the main number guests notice first, so keep it competitive and easy to justify.")
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(HayameTheme.mutedText)
        }
        .onAppear {
            textValue = String(value)
        }
        .onChange(of: value) { _, newValue in
            let normalized = String(newValue)
            if textValue != normalized {
                textValue = normalized
            }
        }
    }

    private func updateValue(_ rawValue: String) {
        let digitsOnly = rawValue.filter(\.isNumber)
        textValue = digitsOnly
        guard let parsed = Int(digitsOnly) else { return }
        value = min(max(parsed, 50), 10_000)
    }
}

private struct ListingEditorAddFieldButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: "plus.circle.fill")
                Text(title)
            }
        }
        .buttonStyle(SecondaryPillButtonStyle())
    }
}

private struct ListingEditorToggleRow: View {
    let title: String
    let subtitle: String
    var helpTitle: String? = nil
    var helpMessage: String? = nil
    @Binding var isOn: Bool

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                ListingEditorFieldLabel(
                    title: title,
                    helpTitle: helpTitle,
                    helpMessage: helpMessage
                )
                Text(subtitle)
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)
            }
            Spacer()
            Toggle("", isOn: $isOn)
                .labelsHidden()
                .tint(HayameTheme.brandBlue)
        }
    }
}

private struct ListingEditorFieldLabel: View {
    let title: String
    var helpTitle: String? = nil
    var helpMessage: String? = nil

    var body: some View {
        HStack(spacing: 6) {
            Text(title)
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)

            if let helpTitle, let helpMessage {
                ContextInfoButton(
                    title: helpTitle,
                    message: helpMessage
                )
            }
        }
    }
}

private struct ContextInfoButton: View {
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

private struct HostListingThumbnailView: View {
    let url: URL?

    var body: some View {
        Group {
            if let url {
                CachedRemoteImage(url: url, targetSize: CGSize(width: 160, height: 120)) {
                    thumbnailFallback
                } failure: {
                    thumbnailFallback
                }
            } else {
                thumbnailFallback
            }
        }
        .frame(width: 92, height: 76)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color.black.opacity(0.05), lineWidth: 1)
        )
    }

    private var thumbnailFallback: some View {
        RoundedRectangle(cornerRadius: 16, style: .continuous)
            .fill(HayameTheme.brandLight)
            .overlay(
                Image(systemName: "car.fill")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(HayameTheme.brandBlue)
            )
    }
}

private struct ListingEditorPendingPhotoTile: View {
    let upload: ListingEditorScreen.PendingListingUpload
    let isCover: Bool
    let onRemove: () -> Void

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Group {
                if let preview = upload.preview {
                    Image(uiImage: preview)
                        .resizable()
                        .scaledToFill()
                } else {
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(HayameTheme.brandLight)
                }
            }
            .frame(height: 140)
            .frame(maxWidth: .infinity)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(alignment: .bottomLeading) {
                Text(isCover ? "Cover" : "Drag to reorder")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(isCover ? HayameTheme.brandBlue : Color.black.opacity(0.55))
                    .clipShape(Capsule())
                    .padding(10)
            }

            Button(role: .destructive, action: onRemove) {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(.white, HayameTheme.danger)
            }
            .offset(x: 4, y: -4)
        }
    }
}

private struct ListingEditorBottomBar: View {
    let backTitle: String
    let primaryTitle: String
    let isPrimaryDisabled: Bool
    let onBack: () -> Void
    let onPrimary: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Button(backTitle, action: onBack)
                .buttonStyle(SecondaryPillButtonStyle())

            Button(action: onPrimary) {
                Text(primaryTitle)
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(
                        LinearGradient(
                            colors: [HayameTheme.brandBlue, HayameTheme.brandNavy],
                            startPoint: .leading,
                            endPoint: .trailing
                        ),
                        in: RoundedRectangle(cornerRadius: 18, style: .continuous)
                    )
            }
            .buttonStyle(.plain)
            .disabled(isPrimaryDisabled)
            .opacity(isPrimaryDisabled ? 0.7 : 1)
        }
        .padding(.horizontal, 16)
        .padding(.top, 12)
        .padding(.bottom, 8)
        .background(.ultraThinMaterial)
        .overlay(alignment: .top) {
            Rectangle()
                .fill(Color.white.opacity(0.75))
                .frame(height: 1)
        }
    }
}

private struct PendingUploadDropDelegate: DropDelegate {
    let target: ListingEditorScreen.PendingListingUpload
    @Binding var items: [ListingEditorScreen.PendingListingUpload]
    @Binding var draggedID: ListingEditorScreen.PendingListingUpload.ID?

    func dropEntered(info: DropInfo) {
        guard let draggedID, draggedID != target.id else { return }
        guard
            let fromIndex = items.firstIndex(where: { $0.id == draggedID }),
            let toIndex = items.firstIndex(of: target)
        else {
            return
        }

        withAnimation(.easeInOut(duration: 0.16)) {
            items.move(
                fromOffsets: IndexSet(integer: fromIndex),
                toOffset: toIndex > fromIndex ? toIndex + 1 : toIndex
            )
        }
    }

    func dropUpdated(info: DropInfo) -> DropProposal? {
        DropProposal(operation: .move)
    }

    func performDrop(info: DropInfo) -> Bool {
        draggedID = nil
        return true
    }
}

private struct CurrencyInput: View {
    let label: String
    @Binding var value: Int
    let range: ClosedRange<Int>
    let step: Int
    var placeholder: String = "Enter amount"
    var suffix: String? = nil
    var showsQuickAdjustButtons: Bool = true
    var zeroRendersAsEmpty: Bool = false

    @State private var textValue: String = ""

    private static let formatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 0
        formatter.minimumFractionDigits = 0
        return formatter
    }()

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .center, spacing: 8) {
                Text(label)
                    .font(.system(size: 16, weight: .semibold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)
                Spacer()
                Text(formattedValueLabel)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandBlue)
            }

            TextField(placeholder, text: Binding(
                get: { textValue },
                set: { updateFromInput($0) }
            ))
            .keyboardType(.numberPad)
            .textInputAutocapitalization(.never)
            .disableAutocorrection(true)
            .padding(.horizontal, 12)
            .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(Color.white)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(Color.black.opacity(0.08), lineWidth: 1)
            )

            if showsQuickAdjustButtons {
                HStack(spacing: 8) {
                    Spacer()
                    Button {
                        adjust(by: -step)
                    } label: {
                        Image(systemName: "minus")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .frame(width: 44, height: 44)
                            .background(HayameTheme.brandLight)
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .disabled(value <= range.lowerBound)

                    Button {
                        adjust(by: step)
                    } label: {
                        Image(systemName: "plus")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .frame(width: 44, height: 44)
                            .background(HayameTheme.brandLight)
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .disabled(value >= range.upperBound)
                }
            }
        }
        .padding(.vertical, 4)
        .onAppear {
            syncTextValue(with: value)
        }
        .onChange(of: value) { _, newValue in
            syncTextValue(with: newValue)
        }
    }

    private var formattedValueLabel: String {
        let base = Self.formatter.string(from: NSNumber(value: value)) ?? String(value)
        let suffixText = suffix?.isEmpty == false ? suffix! : ""
        return "₵\(base)\(suffixText)"
    }

    private func adjust(by delta: Int) {
        let next = min(max(value + delta, range.lowerBound), range.upperBound)
        value = next
        syncTextValue(with: next)
    }

    private func updateFromInput(_ rawValue: String) {
        let digitsOnly = rawValue.filter(\.isNumber)
        textValue = digitsOnly
        guard !digitsOnly.isEmpty else {
            if zeroRendersAsEmpty && range.lowerBound == 0 {
                value = 0
            }
            return
        }
        guard let parsed = Int(digitsOnly) else { return }
        let clamped = min(max(parsed, range.lowerBound), range.upperBound)
        value = clamped
        if clamped != parsed {
            textValue = String(clamped)
        }
    }

    private func syncTextValue(with newValue: Int) {
        let normalized = zeroRendersAsEmpty && newValue == 0 ? "" : String(newValue)
        if textValue != normalized {
            textValue = normalized
        }
    }
}

private extension View {
    func dismissKeyboardOnNonInputTap() -> some View {
        modifier(KeyboardDismissOnTapModifier())
    }
}

private struct KeyboardDismissOnTapModifier: ViewModifier {
    func body(content: Content) -> some View {
        content.background(KeyboardDismissTapView())
    }
}

private struct KeyboardDismissTapView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: .zero)
        view.backgroundColor = .clear

        let recognizer = UITapGestureRecognizer(
            target: context.coordinator,
            action: #selector(Coordinator.handleTap)
        )
        recognizer.cancelsTouchesInView = false
        recognizer.delegate = context.coordinator
        view.addGestureRecognizer(recognizer)
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {}

    final class Coordinator: NSObject, UIGestureRecognizerDelegate {
        @objc
        func handleTap() {
            UIApplication.shared.sendAction(
                #selector(UIResponder.resignFirstResponder),
                to: nil,
                from: nil,
                for: nil
            )
        }

        func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
            var current: UIView? = touch.view
            while let view = current {
                if view is UITextField || view is UITextView {
                    return false
                }
                current = view.superview
            }
            return true
        }
    }
}

struct HostBookingsScreen: View {
    @EnvironmentObject private var appState: AppState
    @State private var highlightedBookingID: String?

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    if case .loading = appState.bookingsLoadState {
                        ForEach(0..<4, id: \.self) { _ in
                            BookingPlaceholderCard()
                        }
                    } else if case .error(let message) = appState.bookingsLoadState, appState.hostBookings.isEmpty {
                        ErrorStateCard(
                            title: "Bookings unavailable",
                            message: message,
                            actionTitle: "Refresh"
                        ) {
                            appState.retryBookings()
                        }
                    } else if appState.hostBookings.isEmpty {
                        EmptyStateView(title: "No host bookings", message: "Requests will show here when guests book your cars.", systemImage: "calendar.badge.plus")
                    } else {
                        ForEach(appState.hostBookings) { booking in
                            let canAct = booking.status == .awaitingHost && booking.paymentStatus == .paid

                            VStack(alignment: .leading, spacing: 10) {
                                BookingStatusHeader(
                                    title: booking.carTitle,
                                    subtitle: booking.renterName.isEmpty ? nil : "Renter: \(booking.renterName)",
                                    helperText: booking.displayStatus.helperText(
                                        for: .host,
                                        paymentStatus: booking.paymentStatus
                                    ),
                                    status: booking.displayStatus,
                                    showPaidBadge: booking.shouldShowCompletedPaidBadge
                                )

                                InfoLine(label: "Trip", value: "\(booking.startDate.hayameDateLabel()) - \(booking.endDate.hayameDateLabel())")
                                InfoLine(label: "Trip use", value: booking.tripUseAddress)
                                InfoLine(label: "Payment", value: booking.paymentStatus.rawValue.capitalized)
                                InfoLine(label: "Total", value: "GHS\(booking.totalPrice)")

                                HStack(spacing: 10) {
                                    Button("Message") {
                                        Task {
                                            guard let id = await appState.ensureConversation(
                                                hostID: appState.currentUser.id,
                                                participantID: booking.renterID,
                                                carID: booking.carID,
                                                participantName: booking.renterName
                                            ) else {
                                                return
                                            }
                                            appState.addMessage(
                                                conversationID: id,
                                                body: "Hi \(booking.renterName), your booking update is available.",
                                                mine: true
                                            )
                                            appState.hostTab = .inbox
                                        }
                                    }
                                    .buttonStyle(SecondaryPillButtonStyle())

                                    if canAct {
                                        Button("Reject") {
                                            appState.rejectBooking(booking)
                                        }
                                        .buttonStyle(SecondaryPillButtonStyle())

                                        Button("Approve") {
                                            appState.approveBooking(booking)
                                        }
                                        .buttonStyle(PrimaryPillButtonStyle())
                                    }
                                }

                            }
                            .hayameCard()
                            .overlay(
                                RoundedRectangle(cornerRadius: 16, style: .continuous)
                                    .stroke(
                                        highlightedBookingID == booking.id ? HayameTheme.brandBlue : .clear,
                                        lineWidth: 2
                                    )
                            )
                            .shadow(
                                color: highlightedBookingID == booking.id ? HayameTheme.brandBlue.opacity(0.18) : .clear,
                                radius: 14,
                                x: 0,
                                y: 6
                            )
                            .id(booking.id)
                        }
                    }
                }
                .padding(16)
            }
            .background(HayameTheme.pageBackground)
            .navigationTitle("Host Bookings")
            .refreshable {
                await appState.refreshAllRemoteData()
            }
            .onAppear {
                focusPendingBookingIfNeeded(proxy: proxy)
            }
            .onChange(of: appState.pendingBookingID) { _, _ in
                focusPendingBookingIfNeeded(proxy: proxy)
            }
        }
    }

    private func focusPendingBookingIfNeeded(proxy: ScrollViewProxy) {
        guard let pendingID = appState.pendingBookingID else { return }
        guard appState.hostBookings.contains(where: { $0.id == pendingID }) else { return }
        highlightedBookingID = pendingID
        withAnimation(.easeInOut(duration: 0.25)) {
            proxy.scrollTo(pendingID, anchor: .top)
        }
        appState.consumePendingBookingFocus(ifMatches: pendingID)
    }
}

struct HostEarningsScreen: View {
    @EnvironmentObject private var appState: AppState

    private let earningStatuses: Set<BookingStatus> = [.awaitingHost, .confirmed, .completed]

    private var earningBookings: [Booking] {
        appState.hostBookings.filter { earningStatuses.contains($0.status) }
    }

    private var totalEarned: Int {
        earningBookings.reduce(0) { $0 + $1.totalPrice }
    }

    private var pendingPayout: Int {
        appState.hostBookings
            .filter { $0.status == .awaitingHost }
            .reduce(0) { $0 + $1.totalPrice }
    }

    private var completedTrips: Int {
        appState.hostBookings.filter { $0.status == .completed }.count
    }

    private var monthlySeries: [(month: String, amount: Int, isPending: Bool)] {
        let calendar = Calendar.current
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM"
        let now = Date()

        let monthStarts = (0..<6).compactMap { offset -> Date? in
            guard let monthDate = calendar.date(byAdding: .month, value: -(5 - offset), to: now),
                  let interval = calendar.dateInterval(of: .month, for: monthDate) else {
                return nil
            }
            return interval.start
        }

        return monthStarts.map { monthStart in
            guard let monthRange = calendar.dateInterval(of: .month, for: monthStart) else {
                return (month: formatter.string(from: monthStart), amount: 0, isPending: false)
            }

            let monthlyBookings = appState.hostBookings.filter {
                $0.createdAt >= monthRange.start && $0.createdAt < monthRange.end && earningStatuses.contains($0.status)
            }

            let amount = monthlyBookings.reduce(0) { $0 + $1.totalPrice }
            let isPending = monthlyBookings.contains(where: { $0.status == .awaitingHost })
            return (month: formatter.string(from: monthStart), amount: amount, isPending: isPending)
        }
    }

    private var maxSeriesAmount: Int {
        max(monthlySeries.map { $0.amount }.max() ?? 0, 1)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                SectionHeader(title: "Payouts overview")

                HStack(spacing: 10) {
                    StatTile(title: "Total earned", value: "GHS\(totalEarned)")
                    StatTile(title: "Pending", value: "GHS\(pendingPayout)")
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("Revenue trend")
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandNavy)

                    if monthlySeries.allSatisfy({ $0.amount == 0 }) {
                        EmptyStateView(
                            title: "No payouts yet",
                            message: "Completed or confirmed bookings will appear as earnings here.",
                            systemImage: "cedisign.circle"
                        )
                    } else {
                        HStack(alignment: .bottom, spacing: 8) {
                            ForEach(Array(monthlySeries.enumerated()), id: \.offset) { _, bucket in
                                let ratio = Double(bucket.amount) / Double(maxSeriesAmount)
                                let barHeight = CGFloat(max(20, Int(ratio * 160)))
                                VStack(spacing: 4) {
                                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                                        .fill(
                                            LinearGradient(
                                                colors: [HayameTheme.brandBlue, HayameTheme.brandNavy],
                                                startPoint: .top,
                                                endPoint: .bottom
                                            )
                                        )
                                        .frame(width: 28, height: barHeight)
                                    Text(bucket.month)
                                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                                        .foregroundStyle(HayameTheme.mutedText)
                                }
                                .frame(maxWidth: .infinity)
                            }
                        }
                    }
                }
                .hayameCard()

                SectionHeader(title: "Payout history")
                HStack(spacing: 10) {
                    StatTile(title: "Completed trips", value: "\(completedTrips)")
                    StatTile(title: "Tracked months", value: "\(monthlySeries.count)")
                }

                ForEach(Array(monthlySeries.enumerated()), id: \.offset) { _, bucket in
                    HStack {
                        Text(bucket.month)
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                        Text(bucket.isPending ? "pending" : "paid")
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                            .foregroundStyle(bucket.isPending ? HayameTheme.warning : HayameTheme.success)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background((bucket.isPending ? HayameTheme.warning : HayameTheme.success).opacity(0.14))
                            .clipShape(Capsule())
                        Spacer()
                        Text("GHS\(bucket.amount)")
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                            .foregroundStyle(HayameTheme.brandBlue)
                    }
                    .hayameCard()
                }
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Earnings")
        .refreshable {
            await appState.refreshAllRemoteData()
        }
    }
}

struct HostFavoritesScreen: View {
    @EnvironmentObject private var appState: AppState

    private var rankedCars: [Car] {
        appState.hostCars.sorted { $0.favoritesCount > $1.favoritesCount }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                SectionHeader(title: "Host Favorites")

                if rankedCars.isEmpty {
                    EmptyStateView(
                        title: "No host listings",
                        message: "Create listings to track favorite performance.",
                        systemImage: "heart.slash"
                    )
                } else {
                    ForEach(rankedCars) { car in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(car.displayTitle)
                                    .font(.system(size: 15, weight: .bold, design: .rounded))
                                    .foregroundStyle(HayameTheme.brandNavy)
                                Spacer()
                                Label("\(car.favoritesCount)", systemImage: "heart.fill")
                                    .font(.system(size: 12, weight: .bold, design: .rounded))
                                    .foregroundStyle(.red)
                            }

                            Text("\(car.city), \(car.region)")
                                .hayameCaptionStyle()

                            Text("GHS\(car.dailyPrice)/day")
                                .font(.system(size: 13, weight: .bold, design: .rounded))
                                .foregroundStyle(HayameTheme.brandBlue)
                        }
                        .hayameCard()
                    }
                }
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Favorites")
    }
}

struct HostReviewsScreen: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                ForEach(appState.hostReviews) { review in
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text(review.carTitle)
                                .font(.system(size: 15, weight: .bold, design: .rounded))
                            Spacer()
                            Text("\(review.rating)/5")
                                .font(.system(size: 12, weight: .bold, design: .rounded))
                                .foregroundStyle(.orange)
                        }

                        Text("By \(review.guestName)")
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(HayameTheme.brandBlue)

                        Text(review.comment)
                            .font(.system(size: 13, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)

                        Text(review.createdAt.hayameDateLabel())
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                    .hayameCard()
                }
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Host Reviews")
    }
}

struct HostProfileScreen: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        List {
            Section {
                HStack(spacing: 12) {
                    profileAvatar

                    VStack(alignment: .leading, spacing: 4) {
                        Text(appState.currentUser.fullName)
                            .font(.system(size: 20, weight: .bold, design: .rounded))
                        Text(appState.currentUser.email)
                            .font(.system(size: 13, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                }
                Label("\(appState.currentUser.city), \(appState.currentUser.region)", systemImage: "mappin.and.ellipse")
                Label("Host level: Verified Host", systemImage: "checkmark.seal.fill")
            }

            Section("Notifications") {
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

            Section("Host") {
                NavigationLink("Guest feedback") {
                    HostReviewsScreen()
                }
                NavigationLink("Favorites analytics") {
                    HostFavoritesScreen()
                }
                NavigationLink("Contact") { ContactScreen() }
                NavigationLink("Protection") { ProtectionScreen() }
                NavigationLink("Cancellation") { CancellationPolicyViewWrapper() }
            }

            Section {
                Button("Turn off Host mode") {
                    appState.switchToGuestMode()
                }
                Button("Sign out", role: .destructive) {
                    appState.signOut()
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(HayameTheme.pageBackground)
        .navigationTitle("Profile")
    }

    @ViewBuilder
    private var profileAvatar: some View {
        if let url = RemoteImageURLResolver.resolve(appState.currentUser.avatar) {
            CachedRemoteImage(url: url, targetSize: CGSize(width: 56, height: 56)) {
                Circle().fill(HayameTheme.brandLight)
            } failure: {
                fallbackAvatar
            }
            .frame(width: 56, height: 56)
            .clipShape(Circle())
            .overlay(Circle().stroke(Color.black.opacity(0.08), lineWidth: 1))
        } else {
            fallbackAvatar
                .frame(width: 56, height: 56)
                .overlay(Circle().stroke(Color.black.opacity(0.08), lineWidth: 1))
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
                Text(initials.isEmpty ? "H" : initials)
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)
            )
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
                Text(subtitle)
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)
            }
            .padding(.vertical, 2)
        }
        .toggleStyle(SwitchToggleStyle(tint: HayameTheme.brandBlue))
    }
}

struct HostListingPhotosScreen: View {
    @EnvironmentObject private var appState: AppState

    let carID: String
    let carTitle: String

    @State private var photos: [CarListingPhoto] = []
    @State private var maxPhotos = 7
    @State private var isLoading = false
    @State private var isMutating = false
    @State private var errorMessage: String?
    @State private var successMessage: String?
    @State private var addPhotoItem: PhotosPickerItem?
    @State private var showFileImporter = false

    var body: some View {
        List {
            Section("Listing") {
                InfoLine(label: "Car", value: carTitle)
                InfoLine(label: "Photos", value: "\(photos.count) / \(maxPhotos)")
            }

            Section("Manage photos") {
                if isLoading {
                    LoadingStateCard(title: "Loading photos", message: "Fetching current listing photos.")
                } else if photos.isEmpty {
                    EmptyStateView(
                        title: "No photos uploaded",
                        message: "Upload high-quality exterior and interior angles.",
                        systemImage: "photo.on.rectangle"
                    )
                } else {
                    ForEach(photos) { photo in
                        VStack(alignment: .leading, spacing: 8) {
                            if let url = RemoteImageURLResolver.resolve(photo.url) {
                                CachedRemoteImage(url: url, targetSize: CGSize(width: 860, height: 520)) {
                                    RoundedRectangle(cornerRadius: 10, style: .continuous).fill(HayameTheme.brandLight)
                                } failure: {
                                    RoundedRectangle(cornerRadius: 10, style: .continuous).fill(HayameTheme.brandLight)
                                }
                                .frame(height: 170)
                                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                            }

                            HStack(spacing: 10) {
                                PhotosPicker(
                                    selection: Binding(
                                        get: { nil },
                                        set: { newValue in
                                            guard let newValue else { return }
                                            Task { await replacePhoto(photoID: photo.id, item: newValue) }
                                        }
                                    ),
                                    matching: .images
                                ) {
                                    Text("Replace")
                                }
                                .buttonStyle(SecondaryPillButtonStyle())
                                .disabled(isMutating)

                                Button("Delete", role: .destructive) {
                                    Task { await deletePhoto(photoID: photo.id) }
                                }
                                .buttonStyle(SecondaryPillButtonStyle())
                                .disabled(isMutating)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }

                PhotosPicker(selection: $addPhotoItem, matching: .images) {
                    Text(isMutating ? "Uploading..." : "Add photo")
                }
                .buttonStyle(PrimaryPillButtonStyle())
                .disabled(isMutating || photos.count >= maxPhotos)

                Button("Add from Files") {
                    showFileImporter = true
                }
                .buttonStyle(SecondaryPillButtonStyle())
                .disabled(isMutating || photos.count >= maxPhotos)

                Text("Maximum \(maxPhotos) photos, 4MB each. iOS will request photo-library permission when needed.")
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)

                if let errorMessage, !errorMessage.isEmpty {
                    Text(errorMessage)
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.danger)
                }
                if let successMessage, !successMessage.isEmpty {
                    Text(successMessage)
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.success)
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(HayameTheme.pageBackground)
        .navigationTitle("Listing Photos")
        .onAppear {
            Task { await loadPhotos() }
        }
        .onChange(of: addPhotoItem) { _, newValue in
            guard let newValue else { return }
            Task {
                await uploadPhoto(item: newValue, replacePhotoID: nil)
                addPhotoItem = nil
            }
        }
        .fileImporter(
            isPresented: $showFileImporter,
            allowedContentTypes: [.image],
            allowsMultipleSelection: true
        ) { result in
            Task { await handleFileImport(result) }
        }
    }

    @MainActor
    private func loadPhotos() async {
        guard !isLoading else { return }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            let result = try await appState.loadListingPhotos(carID: carID)
            photos = result.0
            maxPhotos = result.1
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    @MainActor
    private func uploadPhoto(item: PhotosPickerItem, replacePhotoID: String?) async {
        guard !isMutating else { return }
        isMutating = true
        errorMessage = nil
        successMessage = nil
        defer { isMutating = false }

        if replacePhotoID == nil, photos.count >= maxPhotos {
            errorMessage = "You already have the maximum number of photos."
            return
        }

        do {
            guard let data = try await item.loadTransferable(type: Data.self) else {
                throw APIError(message: "Unable to read selected image.")
            }
            try await uploadPhotoData(data: data, fileName: "car-photo-\(UUID().uuidString).jpg", replacePhotoID: replacePhotoID)
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    @MainActor
    private func handleFileImport(_ result: Result<[URL], Error>) async {
        guard !isMutating else { return }
        guard photos.count < maxPhotos else {
            errorMessage = "You already have the maximum number of photos."
            return
        }
        isMutating = true
        errorMessage = nil
        successMessage = nil
        defer { isMutating = false }

        switch result {
        case .failure(let error):
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        case .success(let urls):
            var uploadedCount = 0
            for url in urls {
                guard photos.count < maxPhotos else { break }
                let secured = url.startAccessingSecurityScopedResource()
                do {
                    let rawData = try Data(contentsOf: url)
                    try await uploadPhotoData(
                        data: rawData,
                        fileName: url.lastPathComponent.isEmpty ? "car-photo-\(UUID().uuidString).jpg" : url.lastPathComponent,
                        replacePhotoID: nil
                    )
                    uploadedCount += 1
                } catch {
                    errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
                }
                if secured {
                    url.stopAccessingSecurityScopedResource()
                }
            }
            if uploadedCount > 0 {
                successMessage = uploadedCount == 1 ? "Photo uploaded." : "\(uploadedCount) photos uploaded."
            }
        }
    }

    @MainActor
    private func uploadPhotoData(data: Data, fileName: String, replacePhotoID: String?) async throws {
        let prepared = try prepareListingImageForUpload(data: data, maxBytes: 4 * 1024 * 1024)
        let uploaded = try await appState.uploadListingPhoto(
            carID: carID,
            fileData: prepared,
            fileName: fileName.hasSuffix(".jpg") || fileName.hasSuffix(".jpeg") ? fileName : "car-photo-\(UUID().uuidString).jpg",
            mimeType: "image/jpeg",
            replacePhotoID: replacePhotoID
        )
        if let replacePhotoID, let idx = photos.firstIndex(where: { $0.id == replacePhotoID }) {
            photos[idx] = uploaded
            successMessage = "Photo replaced."
        } else {
            photos.append(uploaded)
            successMessage = "Photo uploaded."
        }
    }

    @MainActor
    private func replacePhoto(photoID: String, item: PhotosPickerItem) async {
        await uploadPhoto(item: item, replacePhotoID: photoID)
    }

    @MainActor
    private func deletePhoto(photoID: String) async {
        guard !isMutating else { return }
        isMutating = true
        errorMessage = nil
        successMessage = nil
        defer { isMutating = false }

        do {
            try await appState.deleteListingPhoto(carID: carID, photoID: photoID)
            photos.removeAll { $0.id == photoID }
            successMessage = "Photo deleted."
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }
}

private func prepareListingImageForUpload(data: Data, maxBytes: Int = 4 * 1024 * 1024) throws -> Data {
    if data.count <= maxBytes,
       let image = UIImage(data: data),
       let jpeg = image.jpegData(compressionQuality: 0.9),
       jpeg.count <= maxBytes {
        return jpeg
    }

    guard let sourceImage = UIImage(data: data) else {
        throw APIError(message: "Unable to process selected image.")
    }

    var targetDimension = max(sourceImage.size.width, sourceImage.size.height)
    if targetDimension > 2048 {
        targetDimension = 2048
    }
    var quality: CGFloat = 0.82

    func renderImage(maxDimension: CGFloat) -> UIImage {
        let currentMax = max(sourceImage.size.width, sourceImage.size.height)
        let scale = currentMax > maxDimension ? (maxDimension / currentMax) : 1
        let outputSize = CGSize(
            width: max(1, floor(sourceImage.size.width * scale)),
            height: max(1, floor(sourceImage.size.height * scale))
        )
        let renderer = UIGraphicsImageRenderer(size: outputSize)
        return renderer.image { _ in
            sourceImage.draw(in: CGRect(origin: .zero, size: outputSize))
        }
    }

    var preparedImage = renderImage(maxDimension: targetDimension)
    var jpegData = preparedImage.jpegData(compressionQuality: quality)

    while let bytes = jpegData?.count, bytes > maxBytes, quality > 0.25 {
        quality -= 0.1
        jpegData = preparedImage.jpegData(compressionQuality: quality)
    }

    while let bytes = jpegData?.count, bytes > maxBytes, targetDimension > 720 {
        targetDimension *= 0.85
        quality = 0.76
        preparedImage = renderImage(maxDimension: targetDimension)
        jpegData = preparedImage.jpegData(compressionQuality: quality)

        while let currentBytes = jpegData?.count, currentBytes > maxBytes, quality > 0.25 {
            quality -= 0.1
            jpegData = preparedImage.jpegData(compressionQuality: quality)
        }
    }

    guard let finalData = jpegData, finalData.count <= maxBytes else {
        throw APIError(message: "Photo is too large after compression. Choose a smaller image under 4MB.")
    }
    return finalData
}

struct HostAvailabilityEditorScreen: View {
    @EnvironmentObject private var appState: AppState

    let carID: String
    let carTitle: String

    @State private var startDate = Date()
    @State private var endDate = Calendar.current.date(byAdding: .day, value: 1, to: Date()) ?? Date()
    @State private var markAvailable = false
    @State private var repeatDays: Set<String> = []
    @State private var isSaving = false
    @State private var message: String?
    @State private var errorMessage: String?

    private let weekdays: [(key: String, label: String)] = [
        ("mon", "Mon"),
        ("tue", "Tue"),
        ("wed", "Wed"),
        ("thu", "Thu"),
        ("fri", "Fri"),
        ("sat", "Sat"),
        ("sun", "Sun"),
    ]

    var body: some View {
        Form {
            Section("Listing") {
                InfoLine(label: "Car", value: carTitle)
            }

            Section("Block date range") {
                DatePicker("Start", selection: $startDate, displayedComponents: .date)
                DatePicker("End", selection: $endDate, in: startDate..., displayedComponents: .date)
                Toggle("Mark as available (uncheck to block)", isOn: $markAvailable)
                Button(isSaving ? "Saving..." : "Save date range") {
                    Task { await saveRange() }
                }
                .buttonStyle(PrimaryPillButtonStyle())
                .disabled(isSaving)
            }

            Section("Recurring weekday blocks") {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 72))], spacing: 8) {
                    ForEach(weekdays, id: \.key) { day in
                        Button(day.label) {
                            if repeatDays.contains(day.key) {
                                repeatDays.remove(day.key)
                            } else {
                                repeatDays.insert(day.key)
                            }
                        }
                        .buttonStyle(SecondaryPillButtonStyle())
                        .tint(repeatDays.contains(day.key) ? HayameTheme.brandBlue : HayameTheme.mutedText)
                    }
                }

                Button(isSaving ? "Saving..." : "Save recurring blocks") {
                    Task { await saveRecurring() }
                }
                .buttonStyle(SecondaryPillButtonStyle())
                .disabled(isSaving || repeatDays.isEmpty)
            }

            if let message, !message.isEmpty {
                Section {
                    Text(message)
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.success)
                }
            }

            if let errorMessage, !errorMessage.isEmpty {
                Section {
                    Text(errorMessage)
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.danger)
                }
            }
        }
        .navigationTitle("Availability")
    }

    @MainActor
    private func saveRange() async {
        guard !isSaving else { return }
        isSaving = true
        errorMessage = nil
        message = nil
        defer { isSaving = false }

        if endDate <= startDate {
            errorMessage = "End date must be after start date."
            return
        }

        do {
            try await appState.saveAvailabilityWindow(
                carID: carID,
                startDate: AppState.dateOnlyFormatter.string(from: startDate),
                endDate: AppState.dateOnlyFormatter.string(from: endDate),
                available: markAvailable
            )
            message = markAvailable ? "Availability window saved." : "Blocked date range saved."
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    @MainActor
    private func saveRecurring() async {
        guard !isSaving else { return }
        isSaving = true
        errorMessage = nil
        message = nil
        defer { isSaving = false }

        do {
            try await appState.saveRecurringAvailabilityBlocks(
                carID: carID,
                startDate: AppState.dateOnlyFormatter.string(from: Date()),
                endDate: AppState.dateOnlyFormatter.string(from: Calendar.current.date(byAdding: .day, value: 90, to: Date()) ?? Date()),
                repeatDays: Array(repeatDays)
            )
            message = "Recurring weekday blocks saved."
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }
}

private struct CancellationPolicyViewWrapper: View {
    var body: some View {
        CancellationPolicyScreen()
    }
}

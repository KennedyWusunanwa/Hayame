import SwiftUI
import PhotosUI

struct HostApplicationPendingScreen: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
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
                }
                .padding(16)
            }
            .background(HayameTheme.pageBackground)
            .navigationTitle("Host Review")
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

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text("Host Dashboard")
                    .font(.system(size: 24, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandNavy)

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
                if appState.hostCars.isEmpty {
                    Text("No listings yet")
                } else {
                    ForEach(appState.hostCars) { car in
                        NavigationLink {
                            ListingEditorScreen(mode: .edit(car))
                        } label: {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Text("\(car.title) \(car.year)")
                                        .font(.system(size: 15, weight: .bold, design: .rounded))
                                    Spacer()
                                    Text(car.approvalStatus.capitalized)
                                        .font(.system(size: 10, weight: .bold, design: .rounded))
                                        .foregroundStyle(car.approvalStatus == "approved" ? HayameTheme.success : HayameTheme.warning)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background((car.approvalStatus == "approved" ? HayameTheme.success : HayameTheme.warning).opacity(0.14))
                                        .clipShape(Capsule())
                                }

                                HStack {
                                    Text("\(car.city), \(car.region)")
                                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                                        .foregroundStyle(HayameTheme.mutedText)
                                    Spacer()
                                    Text("GHS\(car.dailyPrice)/day")
                                        .font(.system(size: 12, weight: .bold, design: .rounded))
                                        .foregroundStyle(HayameTheme.brandBlue)
                                }
                            }
                        }
                        .swipeActions(edge: .trailing) {
                            Button(role: .destructive) {
                                appState.deleteListing(car)
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(HayameTheme.pageBackground)
        .navigationTitle("My Cars")
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

    private var modelOptions: [String] {
        MockDataService.models(for: draft.brand, preferred: draft.model)
    }

    var body: some View {
        Form {
            Section("Listing") {
                TextField("Listing title", text: $draft.title)
                Picker("Brand", selection: $draft.brand) {
                    Text("Select").tag("")
                    ForEach(MockDataService.makesIncluding(draft.brand), id: \.self) { value in
                        Text(value).tag(value)
                    }
                }
                Picker("Model", selection: $draft.model) {
                    Text("Select").tag("")
                    ForEach(modelOptions + [""], id: \.self) { value in
                        if !value.isEmpty {
                            Text(value).tag(value)
                        }
                    }
                }
                Stepper("Year: \(draft.year)", value: $draft.year, in: 2000...(Calendar.current.component(.year, from: Date()) + 1))
                Stepper("Price (GHS): \(draft.price)", value: $draft.price, in: 50...10000, step: 50)
            }

            Section("Location") {
                Picker("Region", selection: $draft.region) {
                    Text("Select").tag("")
                    ForEach(MockDataService.regionsIncluding(draft.region), id: \.self) { region in
                        Text(region).tag(region)
                    }
                }
                Picker("City", selection: $draft.city) {
                    Text("Select").tag("")
                    ForEach(MockDataService.cities(for: draft.region, preferred: draft.city), id: \.self) { city in
                        if !city.isEmpty {
                            Text(city).tag(city)
                        }
                    }
                }
            }

            Section("Vehicle info") {
                Picker("Car Type", selection: $draft.carType) {
                    Text("Select").tag("")
                    ForEach(MockDataService.carTypes, id: \.self) { value in
                        Text(value).tag(value)
                    }
                }
                Picker("Transmission", selection: $draft.transmission) {
                    ForEach(MockDataService.transmissions, id: \.self) { value in
                        Text(value).tag(value)
                    }
                }
                Picker("Fuel", selection: $draft.fuelType) {
                    ForEach(MockDataService.fuels, id: \.self) { value in
                        Text(value).tag(value)
                    }
                }
                Stepper("Seats: \(draft.seats)", value: $draft.seats, in: 2...8)
                TextField("Description", text: $draft.description, axis: .vertical)
                    .lineLimit(3...8)
            }

            Section("Booking options") {
                Toggle("Instant Book", isOn: $draft.instantBook)
                Toggle("Delivery available", isOn: $draft.deliveryAvailable)
                Toggle("Air conditioning", isOn: $draft.airConditioning)
                Stepper("Delivery fee: GHS\(draft.deliveryFee)", value: $draft.deliveryFee, in: 0...2000, step: 10)
                Stepper("Insurance fee: GHS\(draft.insuranceFee)", value: $draft.insuranceFee, in: 0...2000, step: 10)
                Stepper("Deposit: GHS\(draft.depositAmount)", value: $draft.depositAmount, in: 0...5000, step: 50)
                Stepper("Outside listing region fee: GHS\(draft.outsideAccraFee)", value: $draft.outsideAccraFee, in: 0...3000, step: 20)
                Picker("Cancellation", selection: $draft.cancellationPolicy) {
                    Text("Flexible").tag("Flexible")
                    Text("Moderate").tag("Moderate")
                    Text("Strict").tag("Strict")
                }
            }

            Section("Photos") {
                Text("Use Xcode simulator photo picker or device photo library to upload listing photos. Max: 7 photos, 4MB each.")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)
                if case .edit(let car) = mode {
                    NavigationLink("Manage listing photos") {
                        HostListingPhotosScreen(carID: car.id, carTitle: "\(car.title) \(car.year)")
                    }
                } else {
                    Text("Create the listing first, then upload and reorder photos.")
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.warning)
                }
            }

            Section("Availability") {
                if case .edit(let car) = mode {
                    NavigationLink("Edit blocked dates and weekly blocks") {
                        HostAvailabilityEditorScreen(carID: car.id, carTitle: "\(car.title) \(car.year)")
                    }
                } else {
                    Text("Create the listing first, then configure availability windows.")
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.warning)
                }
            }
        }
        .navigationTitle(modeTitle)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button(modeSaveTitle) {
                    switch mode {
                    case .create:
                        appState.createListing(from: draft)
                    case .edit(let car):
                        appState.updateListing(car, from: draft)
                    }
                    dismiss()
                }
                .bold()
            }
        }
        .onChange(of: draft.region) { _, newValue in
            draft.region = MockDataService.normalizedRegion(newValue)
            let options = MockDataService.cities(for: draft.region, preferred: draft.city)
            if !options.contains(where: { $0.caseInsensitiveCompare(draft.city) == .orderedSame }) {
                draft.city = options.first ?? draft.city
            }
        }
        .onChange(of: draft.brand) { _, newValue in
            draft.brand = MockDataService.normalizedMake(newValue)
            let options = MockDataService.models(for: draft.brand, preferred: draft.model)
            if !options.contains(where: { $0.caseInsensitiveCompare(draft.model) == .orderedSame }) {
                draft.model = options.first ?? ""
            }
        }
        .onAppear {
            guard case .edit(let car) = mode else { return }
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
                deliveryFee: car.deliveryFee,
                insuranceFee: car.insuranceFee,
                depositAmount: car.depositAmount,
                outsideAccraFee: car.outsideAccraFee,
                cancellationPolicy: car.cancellationPolicy.isEmpty ? "Moderate" : car.cancellationPolicy
            )
        }
    }

    private var modeTitle: String {
        switch mode {
        case .create: return "Create Listing"
        case .edit: return "Edit Listing"
        }
    }

    private var modeSaveTitle: String {
        switch mode {
        case .create: return "Create"
        case .edit: return "Save"
        }
    }
}

struct HostBookingsScreen: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                ForEach(appState.hostBookings) { booking in
                    let canAct = booking.status == .awaitingHost && booking.paymentStatus == .paid

                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Booking Request")
                                    .font(.system(size: 11, weight: .bold, design: .rounded))
                                    .foregroundStyle(HayameTheme.mutedText)
                                Text(booking.renterName)
                                    .font(.system(size: 16, weight: .bold, design: .rounded))
                                    .foregroundStyle(HayameTheme.brandNavy)
                                Text(booking.carTitle)
                                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                                    .foregroundStyle(HayameTheme.brandBlue)
                            }
                            Spacer()
                            BookingStatusBadge(status: booking.status)
                        }

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

                        if booking.status == .awaitingHost && booking.paymentStatus != .paid {
                            Text("Waiting for renter payment before approval.")
                                .font(.system(size: 12, weight: .semibold, design: .rounded))
                                .foregroundStyle(HayameTheme.warning)
                        }
                    }
                    .hayameCard()
                }

                if appState.hostBookings.isEmpty {
                    EmptyStateView(title: "No host bookings", message: "Requests will show here when guests book your cars.", systemImage: "calendar.badge.plus")
                }
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Host Bookings")
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
                                Text("\(car.title) \(car.year)")
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

            Section("Admin") {
                NavigationLink("Admin Console") {
                    AdminHomeScreen()
                }
                Button("Switch to Admin Mode") {
                    appState.switchToAdminMode()
                }
            }

            Section {
                Button("Switch to Guest App") {
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

                Text("Maximum \(maxPhotos) photos.")
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
            let uploaded = try await appState.uploadListingPhoto(
                carID: carID,
                fileData: data,
                fileName: "car-photo-\(UUID().uuidString).jpg",
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
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
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

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
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        // Each tab is its own page; keying on the tab lets the outgoing page fade
        // while the incoming one rises in, with no spring on the swap.
        ZStack {
            activeContent
                .id(appState.hostTab)
                .transition(HayameTabSwitch.transition)
        }
        .animation(HayameTabSwitch.animation, value: appState.hostTab)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(HayameTheme.pageBackground.ignoresSafeArea())
        .tint(HayameTheme.brandBlue)
        .hayameNavigationChrome(colorScheme: colorScheme)
    }

    private var hostTabItems: [HayameBottomTabItem<HostTab>] {
        [
            HayameBottomTabItem(id: .dashboard, title: "Home", systemImage: "house"),
            HayameBottomTabItem(id: .cars, title: "Cars", systemImage: "car"),
            HayameBottomTabItem(id: .bookings, title: "Bookings", systemImage: "calendar.badge.clock"),
            HayameBottomTabItem(id: .earnings, title: "Earnings", systemImage: "cedisign.circle"),
            HayameBottomTabItem(
                id: .inbox,
                title: "Inbox",
                systemImage: "message",
                badgeCount: appState.unreadMessagesCount
            ),
            HayameBottomTabItem(id: .profile, title: "Profile", systemImage: "person")
        ]
    }

    @ViewBuilder
    private var activeContent: some View {
        switch appState.hostTab {
        case .dashboard:
            hostStack { HostDashboardScreen() }
        case .cars:
            hostStack { HostCarsScreen() }
        case .bookings:
            hostStack { HostBookingsScreen() }
        case .earnings:
            hostStack { HostEarningsScreen() }
        case .inbox:
            hostStack { InboxScreen(isTabRoot: true) }
        case .profile:
            hostStack { HostProfileScreen() }
        }
    }

    // Hosts the floating tab bar as a bottom safe-area inset *inside* the
    // navigation stack so each root screen reserves space for it (nothing hides
    // behind the bar) while content still scrolls under the glass. The bar is
    // suppressed while the listing editor is active.
    private func hostStack<Content: View>(@ViewBuilder _ content: () -> Content) -> some View {
        NavigationStack {
            content()
                .safeAreaInset(edge: .bottom, spacing: 0) {
                    if !appState.listingEditorActive && !HayameScreenshotMode.hidesTabBar {
                        HayameBottomTabBar(selection: $appState.hostTab, items: hostTabItems)
                    }
                }
        }
    }
}

struct HostCarsScreen: View {
    @EnvironmentObject private var appState: AppState
    @State private var deleteTarget: Car?
    @State private var isDeleting = false
    @State private var showCreateEditor = false
    @State private var editTarget: Car?
    @State private var toolTarget: HostCarTool?

    private var listings: [Car] { appState.hostCars }

    private var liveCount: Int {
        listings.filter { $0.approvalStatus.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() == "approved" }.count
    }

    private var isLoading: Bool {
        if case .loading = appState.publicCarsLoadState, listings.isEmpty { return true }
        return false
    }

    private var subtitle: String {
        if isLoading { return "Loading your listings..." }
        if listings.isEmpty { return "Add your first car to start earning." }
        let listingWord = listings.count == 1 ? "listing" : "listings"
        return "\(listings.count) \(listingWord) • \(liveCount) live"
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 16) {
                header
                    .hayameAppear(index: 0)

                addListingButton
                    .coachMark("hostCars.add")
                    .coachTour(.hostCars)
                    .hayameAppear(index: 1)

                if isLoading {
                    VStack(spacing: 0) {
                        ForEach(0..<3, id: \.self) { index in
                            HostCarRowSkeleton()
                                .hayameAppear(index: index + 2)
                            if index < 2 { HostThinDivider() }
                        }
                    }
                } else if case .error(let message) = appState.publicCarsLoadState, listings.isEmpty {
                    ErrorStateCard(
                        title: "Listings unavailable",
                        message: message,
                        actionTitle: "Refresh"
                    ) {
                        appState.retryCars()
                    }
                    .hayameAppear(index: 2)
                } else if listings.isEmpty {
                    HostEmptyState(
                        title: "No listings yet",
                        message: "Add a car with a few photos and a daily price. Approved listings go live for renters right away.",
                        systemImage: "car.2.fill",
                        actionTitle: "Add your first car"
                    ) {
                        openCreateEditor()
                    }
                    .hayameAppear(index: 2)
                } else {
                    VStack(spacing: 0) {
                        ForEach(Array(listings.enumerated()), id: \.element.id) { index, car in
                            HostCarRow(
                                car: car,
                                isDeleting: isDeleting && deleteTarget?.id == car.id,
                                onOpen: { openEditor(for: car) },
                                onPhotos: { toolTarget = .photos(car) },
                                onAvailability: { toolTarget = .availability(car) },
                                onDelete: { deleteTarget = car }
                            )
                            .coachMark(index == 0 ? "hostCars.row" : "hostCars.row-\(car.id)")
                            .hayameAppear(index: index + 2)
                            if index < listings.count - 1 { HostThinDivider() }
                        }
                    }
                    .animation(HayameMotion.settle, value: listings.map(\.id))
                }

                Color.clear.frame(height: 8)
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .toolbar(.hidden, for: .navigationBar)
        .refreshable {
            await appState.refreshAllRemoteData()
        }
        .navigationDestination(item: $toolTarget) { target in
            switch target {
            case .photos(let car):
                HostListingPhotosScreen(carID: car.id, carTitle: car.displayTitle)
                    .environmentObject(appState)
            case .availability(let car):
                HostAvailabilityEditorScreen(carID: car.id, carTitle: car.displayTitle)
                    .environmentObject(appState)
            }
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
                        if !appState.isCancellation(error) {
                            appState.syncErrorMessage = AppState.userFacingMessage(error, fallback: "Something went wrong. Please try again.")
                        }
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
        .fullScreenCover(isPresented: $showCreateEditor, onDismiss: {
            appState.listingEditorActive = false
        }) {
            NavigationStack {
                ListingEditorScreen(mode: .create)
            }
            .background(HayameTheme.pageBackground.ignoresSafeArea())
            .environmentObject(appState)
        }
        .fullScreenCover(item: $editTarget, onDismiss: {
            appState.listingEditorActive = false
        }) { car in
            NavigationStack {
                ListingEditorScreen(mode: .edit(car))
            }
            .background(HayameTheme.pageBackground.ignoresSafeArea())
            .environmentObject(appState)
        }
    }

    // MARK: Sections

    private var header: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text("My cars")
                    .font(.hayame(size: 30, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Text(subtitle)
                    .font(.hayame(size: 13, weight: .semibold))
                    .foregroundStyle(HayameTheme.mutedText)
                    .contentTransition(.numericText())
            }
            Spacer()
            if appState.isSyncingRemote {
                HayameStatusPill(text: "Syncing", tone: .info, isLive: true)
                    .transition(.scale.combined(with: .opacity))
            }
        }
        .animation(HayameMotion.snappy, value: appState.isSyncingRemote)
    }

    private var addListingButton: some View {
        Button {
            openCreateEditor()
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "plus")
                    .font(.hayame(size: 15, weight: .bold))
                Text("Add a listing")
                    .font(.hayame(size: 16, weight: .semibold))
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.hayame(size: 12, weight: .bold))
                    .opacity(0.8)
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 18)
            .padding(.vertical, 15)
            .background(HayameTheme.brandBlue, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .buttonStyle(HayamePressableStyle(scale: 0.98))
    }

    // MARK: Actions

    private func openCreateEditor() {
        HayameHaptics.light()
        appState.listingEditorActive = true
        showCreateEditor = true
    }

    private func openEditor(for car: Car) {
        appState.listingEditorActive = true
        editTarget = car
    }
}

/// Where a listing row can send the host besides the editor.
private enum HostCarTool: Identifiable, Hashable {
    case photos(Car)
    case availability(Car)

    var id: String {
        switch self {
        case .photos(let car): return "photos-\(car.id)"
        case .availability(let car): return "availability-\(car.id)"
        }
    }
}

/// Image-first listing row: photo with a live/pending pill, the facts a host
/// scans for, and the three things they do most (edit, photos, availability).
private struct HostCarRow: View {
    let car: Car
    var isDeleting = false
    let onOpen: () -> Void
    let onPhotos: () -> Void
    let onAvailability: () -> Void
    let onDelete: () -> Void

    private var isApproved: Bool {
        car.approvalStatus.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() == "approved"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Button(action: onOpen) {
                HStack(alignment: .top, spacing: 14) {
                    ZStack(alignment: .bottomLeading) {
                        NetworkOrFallbackImage(urlString: car.imageNames.first, targetSize: CGSize(width: 260, height: 200))
                            .frame(width: 118, height: 90)
                            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                        Text(isApproved ? "Live" : "Pending review")
                            .font(.hayame(size: 10, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(isApproved ? HayameTheme.success : HayameTheme.warning, in: Capsule())
                            .padding(7)
                    }

                    VStack(alignment: .leading, spacing: 5) {
                        Text(car.displayTitle)
                            .font(.hayame(size: 16, weight: .bold))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .lineLimit(2)
                            .multilineTextAlignment(.leading)
                        Label("\(car.city), \(car.region)", systemImage: "mappin.and.ellipse")
                            .font(.hayame(size: 12, weight: .medium))
                            .foregroundStyle(HayameTheme.mutedText)
                            .lineLimit(1)
                        HStack(alignment: .firstTextBaseline, spacing: 3) {
                            Text(HostMoney.format(car.dailyPrice))
                                .font(.hayame(size: 15, weight: .bold))
                                .foregroundStyle(HayameTheme.brandNavy)
                            Text("/day")
                                .font(.hayame(size: 11, weight: .semibold))
                                .foregroundStyle(HayameTheme.mutedText)
                            Spacer(minLength: 6)
                            Label("\(car.favoritesCount)", systemImage: "heart.fill")
                                .font(.hayame(size: 11, weight: .bold))
                                .foregroundStyle(HayameTheme.danger)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(HayamePressableStyle(scale: 0.985))

            HStack(spacing: 8) {
                HostActionChip(title: "Edit", systemImage: "pencil", action: onOpen)
                HostActionChip(title: "Photos", systemImage: "photo.on.rectangle", action: onPhotos)
                HostActionChip(title: "Availability", systemImage: "calendar", action: onAvailability)
                Spacer(minLength: 0)
                Button(action: onDelete) {
                    Group {
                        if isDeleting {
                            ProgressView().tint(HayameTheme.danger)
                        } else {
                            Image(systemName: "trash")
                                .font(.hayame(size: 13, weight: .bold))
                        }
                    }
                    .foregroundStyle(HayameTheme.danger)
                    .frame(width: 36, height: 36)
                    .background(HayameTheme.danger.opacity(0.1), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .buttonStyle(HayamePressableStyle(scale: 0.9))
                .disabled(isDeleting)
                .accessibilityLabel("Delete listing")
            }
        }
        .padding(.vertical, 14)
    }
}

/// Light grey chip with an outline icon, for the quick actions under a row.
private struct HostActionChip: View {
    let title: String
    let systemImage: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: systemImage)
                    .font(.hayame(size: 12, weight: .semibold))
                Text(title)
                    .font(.hayame(size: 12, weight: .bold))
            }
            .foregroundStyle(HayameTheme.brandNavy)
            .padding(.horizontal, 12)
            .padding(.vertical, 9)
            .background(HayameTheme.fieldBackground, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .buttonStyle(HayamePressableStyle(scale: 0.95))
    }
}

private struct HostThinDivider: View {
    var body: some View {
        Rectangle()
            .fill(HayameTheme.cardStroke)
            .frame(height: 1)
    }
}

private struct HostCarRowSkeleton: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 14) {
                SkeletonBlock(width: 118, height: 90, cornerRadius: 18)
                VStack(alignment: .leading, spacing: 8) {
                    SkeletonBlock(width: 170, height: 15, cornerRadius: 6)
                    SkeletonBlock(width: 130, height: 11, cornerRadius: 6)
                    SkeletonBlock(width: 90, height: 13, cornerRadius: 6)
                }
            }
            HStack(spacing: 8) {
                SkeletonBlock(width: 64, height: 32, cornerRadius: 12)
                SkeletonBlock(width: 78, height: 32, cornerRadius: 12)
                SkeletonBlock(width: 104, height: 32, cornerRadius: 12)
            }
        }
        .padding(.vertical, 14)
    }
}

/// Shared empty state for host pages: icon in a brand disc, copy, a flat CTA.
private struct HostEmptyState: View {
    let title: String
    let message: String
    let systemImage: String
    var actionTitle: String? = nil
    var action: (() -> Void)? = nil

    var body: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(HayameTheme.brandLight)
                    .frame(width: 92, height: 92)
                Image(systemName: systemImage)
                    .font(.hayame(size: 32, weight: .bold))
                    .foregroundStyle(HayameTheme.brandBlue)
            }
            Text(title)
                .font(.hayame(size: 18, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
            Text(message)
                .font(.hayame(size: 13, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, 12)
            if let actionTitle, let action {
                Button(action: action) {
                    Text(actionTitle)
                        .font(.hayame(size: 15, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 13)
                        .background(HayameTheme.brandBlue, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .buttonStyle(HayamePressableStyle(scale: 0.98))
                .padding(.top, 2)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(22)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 24, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
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
                                .font(.hayame(size: 18, weight: .bold))
                                .foregroundStyle(HayameTheme.brandNavy)
                            Text("Blocked dates stay in the existing availability editor after you save changes.")
                                .font(.hayame(size: 13, weight: .medium))
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
        .background(HayameTheme.pageBackground.ignoresSafeArea())
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
            appState.listingEditorActive = true
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
                    allowOneDayBooking: car.allowOneDayBooking,
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
            appState.listingEditorActive = false
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
                            .font(.hayame(size: 12, weight: .medium))
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
                            .font(.hayame(size: 12, weight: .medium))
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
                            .font(.hayame(size: 12, weight: .medium))
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
                                .font(.hayame(size: 15, weight: .bold))
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
                            .font(.hayame(size: 12, weight: .medium))
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
                        ListingEditorToggleRow(
                            title: "1-day bookings",
                            subtitle: "Let guests book a single day.",
                            helpTitle: "1-day bookings",
                            helpMessage: "When this is on, guests can book this car for one day: pick-up at the 10:00 AM hand-off and return at the same time the next day. When it's off, every trip must be at least 2 days. The listing shows which one applies.",
                            isOn: $draft.allowOneDayBooking
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
                                .font(.hayame(size: 12, weight: .medium))
                                .foregroundStyle(HayameTheme.mutedText)
                        }
                    }
                }

                ListingEditorSectionCard {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Extra trip rule")
                            .font(.hayame(size: 15, weight: .bold))
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
                            .font(.hayame(size: 13, weight: .medium))
                            .foregroundStyle(HayameTheme.mutedText)

                        if isCreate {
                            if pendingUploads.isEmpty {
                                RoundedRectangle(cornerRadius: 20, style: .continuous)
                                    .fill(HayameTheme.brandLight)
                                    .frame(height: 180)
                                    .overlay(
                                        VStack(spacing: 10) {
                                            Image(systemName: "photo.on.rectangle.angled")
                                                .font(.hayame(size: 28, weight: .bold))
                                                .foregroundStyle(HayameTheme.brandBlue)
                                            Text("No photos selected yet")
                                                .font(.hayame(size: 15, weight: .bold))
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
                                    .font(.hayame(size: 12, weight: .medium))
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
                                        .font(.hayame(size: 11, weight: .bold))
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
                        draft.allowOneDayBooking ? "1-day bookings allowed" : "2-day minimum trip",
                        draft.airConditioning ? "Air conditioning included" : "Air conditioning off",
                        draft.cancellationPolicy
                    ]
                )

                ListingEditorSectionCard {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Photos")
                                .font(.hayame(size: 16, weight: .bold))
                                .foregroundStyle(HayameTheme.brandNavy)
                            Spacer()
                            Button("Edit") {
                                jump(to: .photos)
                            }
                            .font(.hayame(size: 13, weight: .bold))
                        }

                        Text(selectedPhotosSummary)
                            .font(.hayame(size: 13, weight: .medium))
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
                        .font(.hayame(size: 16, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Spacer()
                    Button("Edit") {
                        jump(to: step)
                    }
                    .font(.hayame(size: 13, weight: .bold))
                }

                ForEach(lines.filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }, id: \.self) { line in
                    Text(line)
                        .font(.hayame(size: 13, weight: .medium))
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
            editorError = AppState.userFacingMessage(error, fallback: "Something went wrong. Please try again.")
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
                uploadFailures.append(AppState.userFacingMessage(error, fallback: "Something went wrong. Please try again."))
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
                editorError = AppState.userFacingMessage(error, fallback: "Something went wrong. Please try again.")
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
            editorError = AppState.userFacingMessage(error, fallback: "Something went wrong. Please try again.")
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
                    editorError = AppState.userFacingMessage(error, fallback: "Something went wrong. Please try again.")
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
                .font(.hayame(size: 12, weight: .bold))
                .foregroundStyle(HayameTheme.brandBlue)

            Text(currentStep.title)
                .font(.hayame(size: 30, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)

            HStack(spacing: 8) {
                ForEach(ListingEditorStep.allCases) { step in
                    VStack(spacing: 6) {
                        Capsule()
                            .fill(step.rawValue <= currentStep.rawValue ? HayameTheme.brandBlue : HayameTheme.fieldBackground)
                            .frame(height: 8)
                            .overlay(
                                Capsule()
                                    .stroke(
                                        step.rawValue <= currentStep.rawValue ? HayameTheme.brandBlue : HayameTheme.controlStroke,
                                        lineWidth: 1
                                    )
                            )
                        Text(step.shortTitle)
                            .font(.hayame(size: 10, weight: .bold))
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
        .background(HayameTheme.cardBackground, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(HayameTheme.cardStroke, lineWidth: 1)
        )
        .shadow(color: HayameTheme.cardShadow, radius: 12, x: 0, y: 6)
    }
}

private struct ListingEditorStepIntro: View {
    let title: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.hayame(size: 24, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
            Text(subtitle)
                .font(.hayame(size: 13, weight: .medium))
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
        .background(HayameTheme.cardBackground, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(HayameTheme.cardStroke, lineWidth: 1)
        )
        .shadow(color: HayameTheme.cardShadow, radius: 12, x: 0, y: 6)
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
                .font(.hayame(size: 13, weight: .semibold))
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
                        .stroke(HayameTheme.cardStroke, lineWidth: 1)
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
                .font(.hayame(size: 14, weight: .bold))
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
                        .font(.hayame(size: 16, weight: .semibold))
                        .foregroundStyle(selected.localizedCaseInsensitiveContains("select") ? HayameTheme.mutedText : HayameTheme.brandNavy)
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

private struct ListingEditorTextArea: View {
    let title: String
    @Binding var text: String
    let placeholder: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.hayame(size: 14, weight: .bold))
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
                        .font(.hayame(size: 15, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 16)
                }

                TextEditor(text: $text)
                    .scrollContentBackground(.hidden)
                    .foregroundStyle(HayameTheme.brandNavy)
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
                .font(.hayame(size: 14, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)

            HStack(spacing: 12) {
                Button {
                    value = max(range.lowerBound, value - 1)
                } label: {
                    Image(systemName: "minus")
                        .font(.hayame(size: 14, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .frame(width: 44, height: 44)
                        .background(HayameTheme.brandLight)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .buttonStyle(.plain)

                Text("\(value) seats")
                    .font(.hayame(size: 16, weight: .bold))
                    .foregroundStyle(HayameTheme.brandBlue)
                    .frame(maxWidth: .infinity)

                Button {
                    value = min(range.upperBound, value + 1)
                } label: {
                    Image(systemName: "plus")
                        .font(.hayame(size: 14, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .frame(width: 44, height: 44)
                        .background(HayameTheme.brandLight)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .buttonStyle(.plain)
            }
            .padding(14)
            .background(HayameTheme.fieldBackground, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(HayameTheme.cardStroke, lineWidth: 1)
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
                .font(.hayame(size: 14, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)

            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text("GHS")
                    .font(.hayame(size: 18, weight: .bold))
                    .foregroundStyle(HayameTheme.brandBlue)

                TextField("300", text: Binding(
                    get: { textValue },
                    set: { updateValue($0) }
                ))
                .keyboardType(.numberPad)
                .font(.hayame(size: 34, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)

                Spacer()

                Text("/ day")
                    .font(.hayame(size: 15, weight: .bold))
                    .foregroundStyle(HayameTheme.mutedText)
            }
            .padding(18)
            .background(HayameTheme.brandLight, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .stroke(HayameTheme.brandBlue.opacity(0.14), lineWidth: 1)
            )

            Text(suggestionText)
                .font(.hayame(size: 12, weight: .semibold))
                .foregroundStyle(HayameTheme.brandBlue)

            Text("This is the main number guests notice first, so keep it competitive and easy to justify.")
                .font(.hayame(size: 12, weight: .medium))
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
                    .font(.hayame(size: 12, weight: .medium))
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
                .font(.hayame(size: 14, weight: .bold))
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
                .font(.hayame(size: 13, weight: .semibold))
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
                .stroke(HayameTheme.cardStroke, lineWidth: 1)
        )
    }

    private var thumbnailFallback: some View {
        RoundedRectangle(cornerRadius: 16, style: .continuous)
            .fill(HayameTheme.brandLight)
            .overlay(
                Image(systemName: "car.fill")
                    .font(.hayame(size: 20, weight: .bold))
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
                    .font(.hayame(size: 11, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(isCover ? HayameTheme.brandBlue : Color.black.opacity(0.55))
                    .clipShape(Capsule())
                    .padding(10)
            }

            Button(role: .destructive, action: onRemove) {
                Image(systemName: "xmark.circle.fill")
                    .font(.hayame(size: 18, weight: .bold))
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
                    .font(.hayame(size: 16, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(HayameTheme.brandBlue, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            }
            .buttonStyle(.plain)
            .disabled(isPrimaryDisabled)
            .opacity(isPrimaryDisabled ? 0.7 : 1)
        }
        .padding(.horizontal, 16)
        .padding(.top, 12)
        .padding(.bottom, 8)
        .background {
            Rectangle()
                .fill(.ultraThinMaterial)
                .ignoresSafeArea(edges: .bottom)
        }
        .overlay(alignment: .top) {
            Rectangle()
                .fill(HayameTheme.bottomBarSeparator)
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
                    .font(.hayame(size: 16, weight: .semibold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Spacer()
                Text(formattedValueLabel)
                    .font(.hayame(size: 14, weight: .bold))
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
                    .fill(HayameTheme.fieldBackground)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(HayameTheme.controlStroke, lineWidth: 1)
            )

            if showsQuickAdjustButtons {
                HStack(spacing: 8) {
                    Spacer()
                    Button {
                        adjust(by: -step)
                    } label: {
                        Image(systemName: "minus")
                            .font(.hayame(size: 14, weight: .bold))
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
                            .font(.hayame(size: 14, weight: .bold))
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
    @State private var segment: HostBookingsSegment = .requests
    @State private var highlightedBookingID: String?
    /// bookingID → approve? while a decision request is in flight.
    @State private var decisionsInFlight: [String: Bool] = [:]
    /// bookingID → approved? for a short confirmation stamp after the server accepts it.
    @State private var recentDecisions: [String: Bool] = [:]

    private var requests: [Booking] {
        appState.hostBookings
            .filter { $0.status == .awaitingHost || $0.status == .pending }
            .sorted { $0.createdAt > $1.createdAt }
    }

    private var upcoming: [Booking] {
        appState.hostBookings
            .filter { $0.status == .confirmed && $0.endDate >= Date() }
            .sorted { $0.startDate < $1.startDate }
    }

    private var past: [Booking] {
        appState.hostBookings
            .filter { booking in
                switch booking.status {
                case .completed, .cancelled, .rejected, .refunded: return true
                case .confirmed: return booking.endDate < Date()
                case .pending, .awaitingHost: return false
                }
            }
            .sorted { $0.createdAt > $1.createdAt }
    }

    private var actionableCount: Int {
        requests.filter { $0.status == .awaitingHost && $0.paymentStatus == .paid }.count
    }

    private var isLoading: Bool {
        if case .loading = appState.bookingsLoadState { return true }
        return false
    }

    private var subtitle: String {
        if isLoading { return "Loading requests and trips..." }
        if appState.hostBookings.isEmpty { return "Requests show here when guests book your cars." }
        if actionableCount > 0 {
            return "\(actionableCount) waiting for your decision • \(upcoming.count) upcoming"
        }
        return "\(upcoming.count) upcoming • \(past.count) past"
    }

    private func bookings(for segment: HostBookingsSegment) -> [Booking] {
        switch segment {
        case .requests: return requests
        case .upcoming: return upcoming
        case .past: return past
        }
    }

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 16) {
                    header
                        .hayameAppear(index: 0)

                    if isLoading {
                        HostBookingCardSkeleton()
                            .hayameAppear(index: 1)
                        HostBookingCardSkeleton()
                            .hayameAppear(index: 2)
                    } else if case .error(let message) = appState.bookingsLoadState, appState.hostBookings.isEmpty {
                        ErrorStateCard(
                            title: "Bookings unavailable",
                            message: message,
                            actionTitle: "Refresh"
                        ) {
                            appState.retryBookings()
                        }
                        .hayameAppear(index: 1)
                    } else {
                        HostBookingsSegmentControl(
                            selection: $segment,
                            counts: [
                                .requests: requests.count,
                                .upcoming: upcoming.count,
                                .past: past.count,
                            ],
                            attention: actionableCount
                        )
                        .coachMark("hostBookings.segment")
                        .coachTour(.hostBookings)
                        .hayameAppear(index: 1)

                        ZStack(alignment: .top) {
                            segmentContent
                                .id(segment)
                                .transition(HayameTabSwitch.transition)
                        }
                        .animation(HayameTabSwitch.animation, value: segment)
                    }

                    Color.clear.frame(height: 8)
                }
                .padding(16)
            }
            .background(HayameTheme.pageBackground)
            .toolbar(.hidden, for: .navigationBar)
            .refreshable {
                await appState.refreshAllRemoteData()
            }
            .onAppear {
                focusPendingBookingIfNeeded(proxy: proxy)
            }
            .onChange(of: appState.pendingBookingID) { _, _ in
                focusPendingBookingIfNeeded(proxy: proxy)
            }
            .onChange(of: appState.bookingsLoadState) { _, _ in
                focusPendingBookingIfNeeded(proxy: proxy)
            }
        }
    }

    // MARK: Sections

    private var header: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text("Bookings")
                    .font(.hayame(size: 30, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Text(subtitle)
                    .font(.hayame(size: 13, weight: .semibold))
                    .foregroundStyle(HayameTheme.mutedText)
                    .contentTransition(.numericText())
            }
            Spacer()
            if actionableCount > 0 {
                HayameStatusPill(text: "\(actionableCount) waiting", tone: .warning, isLive: true)
                    .transition(.scale.combined(with: .opacity))
            }
        }
        .animation(HayameMotion.snappy, value: actionableCount)
    }

    @ViewBuilder
    private var segmentContent: some View {
        let list = bookings(for: segment)
        VStack(alignment: .leading, spacing: 14) {
            if list.isEmpty {
                HostEmptyState(
                    title: emptyTitle,
                    message: emptyMessage,
                    systemImage: emptyIcon
                )
                .hayameAppear(index: 0)
            } else {
                ForEach(Array(list.enumerated()), id: \.element.id) { index, booking in
                    let canAct = booking.status == .awaitingHost && booking.paymentStatus == .paid
                    HostBookingCard(
                        booking: booking,
                        car: appState.hostCars.first { $0.id == booking.carID },
                        canAct: canAct,
                        inFlight: decisionsInFlight[booking.id],
                        decided: recentDecisions[booking.id],
                        isHighlighted: highlightedBookingID == booking.id,
                        onMessage: { message(booking) },
                        onApprove: { decide(booking, approve: true) },
                        onReject: { decide(booking, approve: false) }
                    )
                    .hayameAppear(index: index)
                    .id(booking.id)
                }
            }
        }
    }

    private var emptyTitle: String {
        switch segment {
        case .requests: return "No requests right now"
        case .upcoming: return "No upcoming trips"
        case .past: return "No past trips yet"
        }
    }

    private var emptyMessage: String {
        switch segment {
        case .requests: return "New booking requests land here with Approve and Reject at hand."
        case .upcoming: return "Approved trips that haven't started show here with their pickup dates."
        case .past: return "Completed and closed trips are kept here for your records."
        }
    }

    private var emptyIcon: String {
        switch segment {
        case .requests: return "bell.badge"
        case .upcoming: return "calendar"
        case .past: return "clock.arrow.circlepath"
        }
    }

    // MARK: Actions

    private func message(_ booking: Booking) {
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

    /// Sends the decision, keeping the buttons busy until the server answers,
    /// then stamps the card so the host sees it landed.
    private func decide(_ booking: Booking, approve: Bool) {
        guard decisionsInFlight[booking.id] == nil else { return }
        HayameHaptics.medium()
        withAnimation(HayameMotion.snappy) {
            decisionsInFlight[booking.id] = approve
        }

        Task {
            let accepted = await appState.decideBooking(booking, approve: approve)
            withAnimation(HayameMotion.settle) {
                decisionsInFlight[booking.id] = nil
                if accepted {
                    recentDecisions[booking.id] = approve
                }
            }
            if accepted {
                if approve { HayameHaptics.success() } else { HayameHaptics.warning() }
            } else {
                HayameHaptics.error()
            }
            try? await Task.sleep(nanoseconds: 2_200_000_000)
            withAnimation(HayameMotion.fade) {
                recentDecisions[booking.id] = nil
            }
        }
    }

    private func focusPendingBookingIfNeeded(proxy: ScrollViewProxy) {
        guard let pendingID = appState.pendingBookingID else { return }
        guard appState.hostBookings.contains(where: { $0.id == pendingID }) else { return }
        for candidate in HostBookingsSegment.allCases where bookings(for: candidate).contains(where: { $0.id == pendingID }) {
            if segment != candidate { segment = candidate }
            break
        }
        highlightedBookingID = pendingID
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
            withAnimation(.easeInOut(duration: 0.25)) {
                proxy.scrollTo(pendingID, anchor: .top)
            }
        }
        appState.consumePendingBookingFocus(ifMatches: pendingID)
    }
}

private enum HostBookingsSegment: String, CaseIterable, Identifiable {
    case requests
    case upcoming
    case past

    var id: String { rawValue }

    var title: String {
        switch self {
        case .requests: return "Requests"
        case .upcoming: return "Upcoming"
        case .past: return "Past"
        }
    }
}

/// Requests / Upcoming / Past switch with a sliding flat pill and counts.
private struct HostBookingsSegmentControl: View {
    @Binding var selection: HostBookingsSegment
    let counts: [HostBookingsSegment: Int]
    var attention = 0

    @Namespace private var pillNamespace

    var body: some View {
        HStack(spacing: 4) {
            ForEach(HostBookingsSegment.allCases) { segment in
                let selected = segment == selection
                Button {
                    guard !selected else { return }
                    HayameHaptics.select()
                    selection = segment
                } label: {
                    HStack(spacing: 6) {
                        Text(segment.title)
                            .font(.hayame(size: 13, weight: .bold))
                            .lineLimit(1)
                            .minimumScaleFactor(0.85)
                        let count = counts[segment] ?? 0
                        if count > 0 {
                            Text("\(count)")
                                .font(.hayame(size: 11, weight: .bold))
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(
                                    selected
                                        ? Color.white.opacity(0.22)
                                        : (segment == .requests && attention > 0 ? HayameTheme.warning.opacity(0.18) : HayameTheme.subtleFill),
                                    in: Capsule()
                                )
                                .contentTransition(.numericText())
                        }
                    }
                    .foregroundStyle(selected ? .white : HayameTheme.brandNavy)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background {
                        if selected {
                            Capsule()
                                .fill(HayameTheme.brandBlue)
                                .matchedGeometryEffect(id: "host-bookings-pill", in: pillNamespace)
                        }
                    }
                    .contentShape(Capsule())
                }
                .buttonStyle(.plain)
            }
        }
        .padding(4)
        .background(HayameTheme.cardBackground, in: Capsule())
        .overlay(Capsule().strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
        .animation(HayameMotion.respecting(HayameMotion.snappy), value: selection)
    }
}

/// A booking for one of the host's cars: who, which car, when, how much, and
/// the decision buttons when it is waiting on the host.
private struct HostBookingCard: View {
    let booking: Booking
    let car: Car?
    let canAct: Bool
    let inFlight: Bool?
    let decided: Bool?
    var isHighlighted = false
    let onMessage: () -> Void
    let onApprove: () -> Void
    let onReject: () -> Void

    @State private var showDetails = false

    private var renterName: String {
        let name = booking.renterName.trimmingCharacters(in: .whitespacesAndNewlines)
        return name.isEmpty ? "Guest" : name
    }

    private var initials: String {
        let parts = renterName.split(separator: " ").prefix(2)
        let letters = parts.compactMap { $0.first }.map(String.init).joined()
        return letters.isEmpty ? "G" : letters.uppercased()
    }

    private var imageURLString: String? {
        car?.imageNames.first ?? booking.carImageNames.first
    }

    private var tripMode: String {
        !booking.deliveryAddress.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || booking.deliveryFee > 0 ? "Delivery" : "Pickup"
    }

    private var tripUse: String {
        let value = [booking.tripUseAddress, booking.tripUseCity, booking.tripUseRegion]
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: ", ")
        return value.isEmpty ? "Not provided" : value
    }

    private var helperText: String {
        booking.displayStatus.helperText(for: .host, paymentStatus: booking.paymentStatus)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 12) {
                ZStack {
                    Circle().fill(HayameTheme.brandLight)
                    Text(initials)
                        .font(.hayame(size: 14, weight: .bold))
                        .foregroundStyle(HayameTheme.brandBlue)
                }
                .frame(width: 42, height: 42)

                VStack(alignment: .leading, spacing: 2) {
                    Text(renterName)
                        .font(.hayame(size: 16, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .lineLimit(1)
                    Text(helperText)
                        .font(.hayame(size: 12, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                        .lineLimit(2)
                }

                Spacer(minLength: 8)

                if canAct {
                    HayameStatusPill(text: "Decide", tone: .warning, isLive: true)
                } else {
                    BookingStatusBadge(status: booking.displayStatus)
                }
            }

            HStack(alignment: .top, spacing: 12) {
                NetworkOrFallbackImage(urlString: imageURLString, targetSize: CGSize(width: 200, height: 160))
                    .frame(width: 84, height: 66)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

                VStack(alignment: .leading, spacing: 5) {
                    Text(booking.carTitle)
                        .font(.hayame(size: 15, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .lineLimit(2)
                    Label(
                        "\(booking.startDate.hayameDateLabel()) – \(booking.endDate.hayameDateLabel())",
                        systemImage: "calendar"
                    )
                    .font(.hayame(size: 12, weight: .bold))
                    .foregroundStyle(HayameTheme.brandBlue)
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)
                    Label(tripUse, systemImage: "mappin.and.ellipse")
                        .font(.hayame(size: 12, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
            }

            HStack(spacing: 14) {
                HostBookingMetric(value: "\(booking.nights)", unit: booking.nights == 1 ? "night" : "nights")
                HostBookingMetric(value: tripMode, unit: "handoff")
                HostBookingMetric(value: booking.paymentStatus.rawValue.capitalized, unit: "payment")
                Spacer()
                VStack(alignment: .trailing, spacing: 1) {
                    Text("TOTAL")
                        .font(.hayame(size: 9, weight: .bold))
                        .foregroundStyle(HayameTheme.mutedText)
                    Text(HostMoney.format(booking.totalPrice))
                        .font(.hayame(size: 17, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                }
            }

            if showDetails {
                VStack(alignment: .leading, spacing: 6) {
                    HostDetailLine(label: "Trip use area", value: tripUse)
                    if tripMode == "Delivery" {
                        HostDetailLine(label: "Delivery address", value: booking.deliveryAddress)
                        if !booking.deliveryTime.isEmpty {
                            HostDetailLine(label: "Delivery time", value: booking.deliveryTime)
                        }
                    }
                    if !booking.contactPhone.isEmpty {
                        HostDetailLine(label: "Contact phone", value: booking.contactPhone)
                    }
                    if !booking.deliveryNotes.isEmpty {
                        HostDetailLine(label: "Notes", value: booking.deliveryNotes)
                    }
                    if let reference = booking.paymentReference, !reference.isEmpty {
                        HostDetailLine(label: "Payment ref", value: reference)
                    }
                    if let reason = booking.rejectionReason, !reason.isEmpty {
                        Text("Reason: \(reason)")
                            .font(.hayame(size: 12, weight: .semibold))
                            .foregroundStyle(HayameTheme.danger)
                    }
                }
                .padding(12)
                .background(HayameTheme.fieldBackground, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .transition(.opacity.combined(with: .move(edge: .top)))
            }

            HStack(spacing: 8) {
                if canAct {
                    Button(action: onReject) {
                        HostDecisionLabel(title: "Reject", isBusy: inFlight == false, tint: HayameTheme.danger)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 11)
                            .background(HayameTheme.danger.opacity(0.1), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    .buttonStyle(HayamePressableStyle(scale: 0.97))
                    .disabled(inFlight != nil)

                    Button(action: onApprove) {
                        HostDecisionLabel(title: "Approve", isBusy: inFlight == true, tint: .white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 11)
                            .background(HayameTheme.brandBlue, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    .buttonStyle(HayamePressableStyle(scale: 0.97))
                    .disabled(inFlight != nil)
                } else {
                    Button(action: onMessage) {
                        Label("Message \(renterName)", systemImage: "bubble.left.fill")
                            .font(.hayame(size: 13, weight: .bold))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .lineLimit(1)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 11)
                            .background(HayameTheme.brandLight, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    .buttonStyle(HayamePressableStyle(scale: 0.97))
                }

                if canAct {
                    Button(action: onMessage) {
                        Image(systemName: "bubble.left.fill")
                            .font(.hayame(size: 14, weight: .bold))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .frame(width: 42, height: 42)
                            .background(HayameTheme.brandLight, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    .buttonStyle(HayamePressableStyle(scale: 0.92))
                    .accessibilityLabel("Message \(renterName)")
                }

                Spacer(minLength: 0)

                Button {
                    HayameHaptics.select()
                    withAnimation(HayameMotion.settle) { showDetails.toggle() }
                } label: {
                    Image(systemName: "chevron.down")
                        .font(.hayame(size: 12, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .rotationEffect(.degrees(showDetails ? 180 : 0))
                        .frame(width: 36, height: 36)
                        .background(HayameTheme.fieldBackground, in: Circle())
                }
                .buttonStyle(HayamePressableStyle(scale: 0.9))
                .accessibilityLabel(showDetails ? "Hide details" : "Show details")
            }
        }
        .padding(14)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .strokeBorder(
                    isHighlighted ? HayameTheme.brandBlue : (canAct ? HayameTheme.warning.opacity(0.45) : HayameTheme.cardStroke),
                    lineWidth: isHighlighted ? 2 : 1
                )
        )
        .shadow(color: isHighlighted ? HayameTheme.brandBlue.opacity(0.18) : .clear, radius: 14, x: 0, y: 6)
        .overlay {
            if let decided {
                HostDecisionStamp(approved: decided)
                    .transition(.scale(scale: 0.6).combined(with: .opacity))
            }
        }
        .animation(HayameMotion.settle, value: canAct)
        .animation(HayameMotion.settle, value: decided)
        .animation(HayameMotion.settle, value: isHighlighted)
    }
}

private struct HostBookingMetric: View {
    let value: String
    let unit: String

    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(value)
                .font(.hayame(size: 14, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
                .lineLimit(1)
            Text(unit.uppercased())
                .font(.hayame(size: 9, weight: .bold))
                .tracking(0.4)
                .foregroundStyle(HayameTheme.mutedText)
        }
    }
}

private struct HostDetailLine: View {
    let label: String
    let value: String

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Text(label)
                .font(.hayame(size: 12, weight: .semibold))
                .foregroundStyle(HayameTheme.mutedText)
                .frame(width: 108, alignment: .leading)
            Text(value)
                .font(.hayame(size: 12, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
    }
}

private struct HostBookingCardSkeleton: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 12) {
                SkeletonBlock(width: 42, height: 42, cornerRadius: 21)
                VStack(alignment: .leading, spacing: 6) {
                    SkeletonBlock(width: 140, height: 15, cornerRadius: 6)
                    SkeletonBlock(width: 190, height: 11, cornerRadius: 6)
                }
                Spacer()
                SkeletonBlock(width: 70, height: 24, cornerRadius: 12)
            }
            HStack(spacing: 12) {
                SkeletonBlock(width: 84, height: 66, cornerRadius: 16)
                VStack(alignment: .leading, spacing: 7) {
                    SkeletonBlock(width: 150, height: 14, cornerRadius: 6)
                    SkeletonBlock(width: 120, height: 11, cornerRadius: 6)
                    SkeletonBlock(width: 100, height: 11, cornerRadius: 6)
                }
            }
            HStack(spacing: 8) {
                SkeletonBlock(height: 40, cornerRadius: 14)
                SkeletonBlock(height: 40, cornerRadius: 14)
                SkeletonBlock(width: 42, height: 40, cornerRadius: 14)
            }
        }
        .padding(14)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
    }
}

private struct HostDecisionLabel: View {
    let title: String
    let isBusy: Bool
    let tint: Color

    var body: some View {
        HStack(spacing: 8) {
            if isBusy {
                ProgressView()
                    .controlSize(.small)
                    .tint(tint)
                    .transition(.scale.combined(with: .opacity))
            }
            Text(isBusy ? "Sending…" : title)
                .font(.hayame(size: 14, weight: .bold))
                .contentTransition(.opacity)
        }
        .foregroundStyle(tint)
        .animation(HayameMotion.snappy, value: isBusy)
    }
}

/// Short-lived confirmation laid over a card after a decision is accepted.
private struct HostDecisionStamp: View {
    let approved: Bool

    var body: some View {
        HStack(spacing: 10) {
            if approved {
                HayameSuccessCheck(size: 30)
            } else {
                ZStack {
                    Circle().fill(HayameTheme.danger)
                    Image(systemName: "xmark")
                        .font(.hayame(size: 13, weight: .black))
                        .foregroundStyle(.white)
                }
                .frame(width: 30, height: 30)
            }
            Text(approved ? "Approved" : "Declined")
                .font(.hayame(size: 15, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.ultraThinMaterial, in: Capsule())
        .background(HayameTheme.floatingControlBackground, in: Capsule())
        .overlay(Capsule().strokeBorder(HayameTheme.controlStroke, lineWidth: 1))
        .shadow(color: HayameTheme.cardShadow, radius: 14, x: 0, y: 8)
    }
}

struct HostEarningsScreen: View {
    @EnvironmentObject private var appState: AppState
    @State private var revealed = false

    private let earningStatuses: Set<BookingStatus> = [.awaitingHost, .confirmed, .completed]

    private var earningBookings: [Booking] {
        appState.hostBookings.filter { earningStatuses.contains($0.status) }
    }

    private var totalEarned: Int {
        earningBookings.reduce(0) { $0 + $1.totalPrice }
    }

    private var thisMonth: Int {
        guard let range = Calendar.current.dateInterval(of: .month, for: Date()) else { return 0 }
        return earningBookings
            .filter { $0.createdAt >= range.start && $0.createdAt < range.end }
            .reduce(0) { $0 + $1.totalPrice }
    }

    private var pendingPayout: Int {
        appState.hostBookings
            .filter { $0.status == .awaitingHost }
            .reduce(0) { $0 + $1.totalPrice }
    }

    private var completedTrips: Int {
        appState.hostBookings.filter { $0.status == .completed }.count
    }

    private var monthlySeries: [HostMonthBucket] {
        HostMonthBucket.lastSixMonths(from: appState.hostBookings, counting: earningStatuses)
    }

    private var bestMonth: HostMonthBucket? {
        monthlySeries.max { $0.amount < $1.amount }
    }

    private var isLoading: Bool {
        if case .loading = appState.bookingsLoadState, appState.hostBookings.isEmpty { return true }
        return false
    }

    private var hasEarnings: Bool {
        monthlySeries.contains { $0.amount > 0 }
    }

    private var subtitle: String {
        if isLoading { return "Adding up your trips..." }
        if !hasEarnings { return "Earnings from your cars will show here." }
        let tripWord = earningBookings.count == 1 ? "trip" : "trips"
        return "\(HostMoney.format(totalEarned)) across \(earningBookings.count) \(tripWord)"
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 16) {
                header
                    .hayameAppear(index: 0)

                if isLoading {
                    HostEarningsSkeleton()
                        .hayameAppear(index: 1)
                } else if case .error(let message) = appState.bookingsLoadState, appState.hostBookings.isEmpty {
                    ErrorStateCard(
                        title: "Earnings unavailable",
                        message: message,
                        actionTitle: "Refresh"
                    ) {
                        appState.retryBookings()
                    }
                    .hayameAppear(index: 1)
                } else {
                    statTiles
                        .coachTour(.hostEarnings)
                        .hayameAppear(index: 1)

                    trendCard
                        .coachMark("hostEarnings.trend")
                        .hayameAppear(index: 2)

                    payoutHistory
                        .hayameAppear(index: 3)
                }

                Color.clear.frame(height: 8)
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .toolbar(.hidden, for: .navigationBar)
        .refreshable {
            await appState.refreshAllRemoteData()
        }
        .onAppear {
            withAnimation(HayameMotion.respecting(HayameMotion.gentle).delay(0.3)) {
                revealed = true
            }
        }
    }

    // MARK: Sections

    private var header: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text("Earnings")
                    .font(.hayame(size: 30, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Text(subtitle)
                    .font(.hayame(size: 13, weight: .semibold))
                    .foregroundStyle(HayameTheme.mutedText)
                    .contentTransition(.numericText())
            }
            Spacer()
            if appState.isSyncingRemote {
                HayameStatusPill(text: "Syncing", tone: .info, isLive: true)
                    .transition(.scale.combined(with: .opacity))
            }
        }
        .animation(HayameMotion.snappy, value: appState.isSyncingRemote)
    }

    private var statTiles: some View {
        VStack(spacing: 10) {
            HostEarningTile(
                title: "This month",
                value: HostMoney.format(thisMonth),
                placeholder: "GHS 0",
                systemImage: "calendar",
                tint: .white,
                prominent: true,
                revealed: revealed
            )
            .coachMark("hostEarnings.month")
            HStack(spacing: 10) {
                HostEarningTile(
                    title: "Total earned",
                    value: HostMoney.format(totalEarned),
                    placeholder: "GHS 0",
                    systemImage: "cedisign.circle.fill",
                    tint: HayameTheme.brandBlue,
                    revealed: revealed
                )
                HostEarningTile(
                    title: "Pending approval",
                    value: HostMoney.format(pendingPayout),
                    placeholder: "GHS 0",
                    systemImage: "hourglass",
                    tint: HayameTheme.warning,
                    revealed: revealed
                )
            }
        }
    }

    private var trendCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Revenue trend")
                        .font(.hayame(size: 17, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text("Last six months")
                        .font(.hayame(size: 12, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                }
                Spacer()
                if let bestMonth, bestMonth.amount > 0 {
                    Text("Best: \(bestMonth.month)")
                        .font(.hayame(size: 11, weight: .bold))
                        .foregroundStyle(HayameTheme.brandBlue)
                        .padding(.horizontal, 9)
                        .padding(.vertical, 5)
                        .background(HayameTheme.brandBlue.opacity(0.12), in: Capsule())
                }
            }

            if hasEarnings {
                HostEarningsChart(series: monthlySeries, revealed: revealed)
                    .frame(height: 176)
                HStack(spacing: 14) {
                    HostLegendDot(color: HayameTheme.brandBlue, label: "Paid")
                    HostLegendDot(color: HayameTheme.warning, label: "Awaiting approval")
                    Spacer()
                }
            } else {
                HostEmptyState(
                    title: "No payouts yet",
                    message: "Completed or confirmed bookings will appear here as earnings, month by month.",
                    systemImage: "chart.bar.xaxis"
                )
            }
        }
        .padding(16)
        .background(HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
    }

    private var payoutHistory: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                Text("Payout history")
                    .font(.hayame(size: 17, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Spacer()
                Text("\(completedTrips) completed trip\(completedTrips == 1 ? "" : "s")")
                    .font(.hayame(size: 12, weight: .semibold))
                    .foregroundStyle(HayameTheme.mutedText)
            }

            VStack(spacing: 0) {
                ForEach(Array(monthlySeries.reversed().enumerated()), id: \.offset) { index, bucket in
                    HostPayoutRow(bucket: bucket, revealed: revealed)
                        .hayameAppear(index: index, step: 0.04)
                    if index < monthlySeries.count - 1 { HostThinDivider() }
                }
            }
        }
    }
}

/// Flat stat tile. The prominent variant is the brand-blue "this month" card.
private struct HostEarningTile: View {
    let title: String
    let value: String
    let placeholder: String
    let systemImage: String
    let tint: Color
    var prominent = false
    let revealed: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: systemImage)
                    .font(.hayame(size: 14, weight: .bold))
                    .foregroundStyle(prominent ? .white : tint)
                    .frame(width: 30, height: 30)
                    .background(
                        prominent ? Color.white.opacity(0.18) : tint.opacity(0.13),
                        in: RoundedRectangle(cornerRadius: 9, style: .continuous)
                    )
                Spacer()
            }
            Text(revealed ? value : placeholder)
                .font(.hayame(size: prominent ? 32 : 22, weight: .bold))
                .foregroundStyle(prominent ? .white : HayameTheme.brandNavy)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .contentTransition(.numericText())
                .animation(HayameMotion.gentle, value: revealed)
            Text(title)
                .font(.hayame(size: 12, weight: .semibold))
                .foregroundStyle(prominent ? .white.opacity(0.82) : HayameTheme.mutedText)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(prominent ? HayameTheme.heroStart : HayameTheme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .strokeBorder(prominent ? .clear : HayameTheme.cardStroke, lineWidth: 1)
        )
    }
}

/// Six flat bars, pending months tinted amber, growing in on first appearance.
private struct HostEarningsChart: View {
    let series: [HostMonthBucket]
    let revealed: Bool

    private var maxAmount: Int { max(series.map(\.amount).max() ?? 0, 1) }

    var body: some View {
        GeometryReader { geometry in
            let chartHeight = geometry.size.height - 38
            HStack(alignment: .bottom, spacing: 10) {
                ForEach(Array(series.enumerated()), id: \.offset) { index, bucket in
                    let ratio = Double(bucket.amount) / Double(maxAmount)
                    let target = max(6, chartHeight * ratio)
                    VStack(spacing: 6) {
                        Spacer(minLength: 0)
                        if bucket.amount > 0 {
                            Text(HostMoney.format(bucket.amount).replacingOccurrences(of: "GHS ", with: ""))
                                .font(.hayame(size: 9, weight: .bold))
                                .foregroundStyle(HayameTheme.mutedText)
                                .lineLimit(1)
                                .minimumScaleFactor(0.6)
                                .opacity(revealed ? 1 : 0)
                        }
                        RoundedRectangle(cornerRadius: 7, style: .continuous)
                            .fill(
                                bucket.amount == 0
                                    ? HayameTheme.subtleFill
                                    : (bucket.isPending ? HayameTheme.warning : HayameTheme.brandBlue)
                            )
                            .frame(height: revealed ? target : 6)
                            .animation(HayameMotion.respecting(HayameMotion.gentle).delay(Double(index) * 0.05), value: revealed)
                        Text(bucket.month)
                            .font(.hayame(size: 11, weight: .semibold))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
    }
}

private struct HostLegendDot: View {
    let color: Color
    let label: String

    var body: some View {
        HStack(spacing: 6) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label)
                .font(.hayame(size: 11, weight: .semibold))
                .foregroundStyle(HayameTheme.mutedText)
        }
    }
}

private struct HostPayoutRow: View {
    let bucket: HostMonthBucket
    let revealed: Bool

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: bucket.amount == 0 ? "minus" : (bucket.isPending ? "hourglass" : "checkmark"))
                .font(.hayame(size: 13, weight: .bold))
                .foregroundStyle(bucket.amount == 0 ? HayameTheme.mutedText : (bucket.isPending ? HayameTheme.warning : HayameTheme.success))
                .frame(width: 34, height: 34)
                .background(
                    (bucket.amount == 0 ? HayameTheme.mutedText : (bucket.isPending ? HayameTheme.warning : HayameTheme.success)).opacity(0.12),
                    in: RoundedRectangle(cornerRadius: 10, style: .continuous)
                )
            VStack(alignment: .leading, spacing: 2) {
                Text(bucket.month)
                    .font(.hayame(size: 15, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Text(bucket.amount == 0 ? "No trips" : (bucket.isPending ? "Includes trips awaiting approval" : "Paid out"))
                    .font(.hayame(size: 12, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
            }
            Spacer()
            Text(revealed ? HostMoney.format(bucket.amount) : "GHS 0")
                .font(.hayame(size: 15, weight: .bold))
                .foregroundStyle(bucket.amount == 0 ? HayameTheme.mutedText : HayameTheme.brandNavy)
                .contentTransition(.numericText())
                .animation(HayameMotion.gentle, value: revealed)
        }
        .padding(.vertical, 12)
    }
}

private struct HostEarningsSkeleton: View {
    var body: some View {
        VStack(spacing: 10) {
            SkeletonBlock(height: 118, cornerRadius: 20)
            HStack(spacing: 10) {
                SkeletonBlock(height: 104, cornerRadius: 20)
                SkeletonBlock(height: 104, cornerRadius: 20)
            }
            SkeletonBlock(height: 250, cornerRadius: 22)
            ForEach(0..<3, id: \.self) { _ in
                HStack(spacing: 12) {
                    SkeletonBlock(width: 34, height: 34, cornerRadius: 10)
                    VStack(alignment: .leading, spacing: 6) {
                        SkeletonBlock(width: 60, height: 14, cornerRadius: 6)
                        SkeletonBlock(width: 130, height: 10, cornerRadius: 5)
                    }
                    Spacer()
                    SkeletonBlock(width: 70, height: 14, cornerRadius: 6)
                }
                .padding(.vertical, 8)
            }
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
                                    .font(.hayame(size: 15, weight: .bold))
                                    .foregroundStyle(HayameTheme.brandNavy)
                                Spacer()
                                Label("\(car.favoritesCount)", systemImage: "heart.fill")
                                    .font(.hayame(size: 12, weight: .bold))
                                    .foregroundStyle(.red)
                            }

                            Text("\(car.city), \(car.region)")
                                .hayameCaptionStyle()

                            Text("GHS\(car.dailyPrice)/day")
                                .font(.hayame(size: 13, weight: .bold))
                                .foregroundStyle(HayameTheme.brandBlue)
                        }
                        .hayameCard()
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(HayameTheme.pageBackground.ignoresSafeArea())
        .refreshable {
            await appState.refreshAllRemoteData()
        }
        .navigationTitle("Favorites")
    }
}

/// Guest feedback: a rating summary with the star spread, then each review as
/// a quiet row. An explicit empty state keeps the page full-width when there
/// is nothing to show yet.
struct HostReviewsScreen: View {
    @EnvironmentObject private var appState: AppState
    @State private var revealed = false

    private var reviews: [Review] {
        appState.hostReviews.sorted { $0.createdAt > $1.createdAt }
    }

    private var averageRating: Double {
        guard !reviews.isEmpty else { return 0 }
        return Double(reviews.reduce(0) { $0 + $1.rating }) / Double(reviews.count)
    }

    private func count(for stars: Int) -> Int {
        reviews.filter { $0.rating == stars }.count
    }

    private var subtitle: String {
        if reviews.isEmpty { return "Reviews from completed trips show up here." }
        return "\(String(format: "%.1f", averageRating)) average across \(reviews.count) \(reviews.count == 1 ? "review" : "reviews")"
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 18) {
                VStack(alignment: .leading, spacing: 3) {
                    Text("Guest feedback")
                        .font(.hayame(size: 30, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text(subtitle)
                        .font(.hayame(size: 13, weight: .semibold))
                        .foregroundStyle(HayameTheme.mutedText)
                }
                .hayameAppear(index: 0)

                if reviews.isEmpty {
                    emptyState
                        .hayameAppear(index: 1)
                } else {
                    summaryCard
                        .hayameAppear(index: 1)

                    VStack(spacing: 0) {
                        ForEach(Array(reviews.enumerated()), id: \.element.id) { index, review in
                            HostReviewRow(review: review)
                                .hayameAppear(index: min(index, 8) + 2)
                            if index < reviews.count - 1 {
                                Rectangle()
                                    .fill(HayameTheme.cardStroke)
                                    .frame(height: 1)
                                    .padding(.leading, 58)
                            }
                        }
                    }
                }

                Color.clear.frame(height: 8)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(HayameTheme.pageBackground.ignoresSafeArea())
        .refreshable {
            await appState.refreshAllRemoteData()
        }
        .navigationTitle("Host Reviews")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            withAnimation(HayameMotion.respecting(HayameMotion.gentle).delay(0.25)) {
                revealed = true
            }
        }
    }

    private var summaryCard: some View {
        HStack(alignment: .center, spacing: 18) {
            VStack(alignment: .leading, spacing: 6) {
                Text(String(format: "%.1f", averageRating))
                    .font(.hayame(size: 44, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .contentTransition(.numericText())
                HostStarRow(rating: averageRating, size: 14)
                Text("\(reviews.count) \(reviews.count == 1 ? "review" : "reviews")")
                    .font(.hayame(size: 12, weight: .semibold))
                    .foregroundStyle(HayameTheme.mutedText)
            }

            VStack(spacing: 7) {
                ForEach((1...5).reversed(), id: \.self) { stars in
                    let value = count(for: stars)
                    HStack(spacing: 8) {
                        Text("\(stars)")
                            .font(.hayame(size: 11, weight: .bold))
                            .foregroundStyle(HayameTheme.mutedText)
                            .frame(width: 10, alignment: .trailing)
                        GeometryReader { proxy in
                            ZStack(alignment: .leading) {
                                Capsule().fill(HayameTheme.fieldBackground)
                                Capsule()
                                    .fill(HayameTheme.brandBlue)
                                    .frame(width: revealed ? proxy.size.width * CGFloat(value) / CGFloat(max(reviews.count, 1)) : 0)
                            }
                        }
                        .frame(height: 7)
                        Text("\(value)")
                            .font(.hayame(size: 11, weight: .bold))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .frame(width: 18, alignment: .trailing)
                    }
                }
            }
        }
        .padding(16)
        .background(HayameTheme.cardBackground, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
    }

    private var emptyState: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(HayameTheme.warning.opacity(0.14))
                    .frame(width: 84, height: 84)
                Image(systemName: "star.bubble")
                    .font(.hayame(size: 32, weight: .bold))
                    .foregroundStyle(HayameTheme.warning)
            }
            Text("No reviews yet")
                .font(.hayame(size: 19, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
            Text("Guests can leave a rating after a completed trip. Clear handoffs and a clean car earn the best ones.")
                .font(.hayame(size: 14, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
            Button("View bookings") {
                HayameHaptics.select()
                appState.hostTab = .bookings
            }
            .buttonStyle(SolidPillButtonStyle())
            .frame(maxWidth: 220)
            .padding(.top, 4)
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 24)
        .padding(.vertical, 36)
        .background(HayameTheme.cardBackground, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
    }
}

private struct HostReviewRow: View {
    let review: Review

    private var initials: String {
        let value = review.guestName
            .split(separator: " ")
            .prefix(2)
            .compactMap { $0.first.map(String.init) }
            .joined()
            .uppercased()
        return value.isEmpty ? "G" : value
    }

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            Circle()
                .fill(HayameTheme.brandLight)
                .frame(width: 44, height: 44)
                .overlay(
                    Text(initials)
                        .font(.hayame(size: 14, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                )

            VStack(alignment: .leading, spacing: 6) {
                HStack(alignment: .firstTextBaseline) {
                    Text(review.guestName)
                        .font(.hayame(size: 15, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .lineLimit(1)
                    Spacer(minLength: 8)
                    Text(HayameRelativeTime.inboxLabel(review.createdAt))
                        .font(.hayame(size: 12, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                }
                HStack(spacing: 8) {
                    HostStarRow(rating: Double(review.rating), size: 11)
                    HStack(spacing: 4) {
                        Image(systemName: "car.fill")
                            .font(.hayame(size: 10, weight: .bold))
                        Text(review.carTitle)
                            .font(.hayame(size: 12, weight: .semibold))
                            .lineLimit(1)
                    }
                    .foregroundStyle(HayameTheme.mutedText)
                }
                if !review.comment.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    Text(review.comment)
                        .font(.hayame(size: 14, weight: .medium))
                        .foregroundStyle(HayameTheme.brandNavy.opacity(0.88))
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .padding(.vertical, 14)
    }
}

/// Five stars, filled to the rating, brand blue on a muted track.
private struct HostStarRow: View {
    let rating: Double
    var size: CGFloat = 12

    var body: some View {
        HStack(spacing: 2) {
            ForEach(1...5, id: \.self) { star in
                let fill = min(max(rating - Double(star - 1), 0), 1)
                Image(systemName: fill >= 0.75 ? "star.fill" : (fill >= 0.25 ? "star.leadinghalf.filled" : "star"))
                    .font(.hayame(size: size, weight: .bold))
                    .foregroundStyle(fill >= 0.25 ? HayameTheme.brandBlue : HayameTheme.mutedText.opacity(0.45))
            }
        }
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
                    .font(.hayame(size: 11, weight: .semibold))
                    .foregroundStyle(HayameTheme.mutedText)

                if let errorMessage, !errorMessage.isEmpty {
                    Text(errorMessage)
                        .font(.hayame(size: 12, weight: .semibold))
                        .foregroundStyle(HayameTheme.danger)
                }
                if let successMessage, !successMessage.isEmpty {
                    Text(successMessage)
                        .font(.hayame(size: 12, weight: .semibold))
                        .foregroundStyle(HayameTheme.success)
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(HayameTheme.pageBackground)
        .refreshable {
            await loadPhotos()
        }
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
            errorMessage = AppState.userFacingMessage(error, fallback: "Something went wrong. Please try again.")
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
            errorMessage = AppState.userFacingMessage(error, fallback: "Something went wrong. Please try again.")
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
            errorMessage = AppState.userFacingMessage(error, fallback: "Something went wrong. Please try again.")
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
                    errorMessage = AppState.userFacingMessage(error, fallback: "Something went wrong. Please try again.")
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
            errorMessage = AppState.userFacingMessage(error, fallback: "Something went wrong. Please try again.")
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
                        .font(.hayame(size: 12, weight: .semibold))
                        .foregroundStyle(HayameTheme.success)
                }
            }

            if let errorMessage, !errorMessage.isEmpty {
                Section {
                    Text(errorMessage)
                        .font(.hayame(size: 12, weight: .semibold))
                        .foregroundStyle(HayameTheme.danger)
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(HayameTheme.pageBackground)
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
            errorMessage = AppState.userFacingMessage(error, fallback: "Something went wrong. Please try again.")
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
            errorMessage = AppState.userFacingMessage(error, fallback: "Something went wrong. Please try again.")
        }
    }
}

private struct CancellationPolicyViewWrapper: View {
    var body: some View {
        CancellationPolicyScreen()
    }
}

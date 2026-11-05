import SwiftUI

// MARK: - Car detail
//
// The listing page leads with the photos, edge to edge, with the back, share
// and save controls floating over them. Below: the title block, spec chips,
// then sections separated by soft bands: "Your trip" (dates and trip location
// as editable rows), price details, the host, description, features, reviews
// and policies. A sticky bar carries the price and the flat Book now button.

struct CarDetailScreen: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss
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
    @State private var showReviewComposer = false
    @State private var showBookingSheet = false
    @State private var showGallery = false
    @State private var showLocationEditor = false
    @State private var authGateMessage = ""
    @State private var showAuthGateAlert = false
    @State private var isCheckingAvailability = false
    @State private var availabilityMessage: String?
    @State private var showFloatingBookingBar = false
    @State private var isLoadingBookingAvailability = false
    @State private var activeDateField: BookingDateSelectionTarget?
    @State private var sharePayload: ListingSharePayload?
    @State private var isPreparingShare = false
    @State private var resumeTarget: ResumableCheckout?
    @State private var bookingSheetDraft: CheckoutDraft?
    @State private var showFullDescription = false

    init(car: Car) {
        self.seedCar = car
        _tripUseRegion = State(initialValue: MockDataService.normalizedRegion(car.region))
        _tripUseCity = State(initialValue: car.city)
    }

    private let heroHeight: CGFloat = 400

    // MARK: Derived

    private var car: Car {
        appState.cars.first(where: { $0.id == seedCar.id }) ??
            appState.ownedCars.first(where: { $0.id == seedCar.id }) ??
            seedCar
    }

    private var isFavorite: Bool { appState.favoriteCarIDs.contains(car.id) }

    private var shareURL: URL {
        URL(string: "\(AppState.productionBaseURL)/cars/\(car.id)") ?? URL(string: AppState.productionBaseURL)!
    }

    private var shareMessage: String { "Check out \(car.displayTitle) on Hayame" }

    private var daysCount: Int {
        max(1, Calendar.current.dateComponents([.day], from: startDate, to: endDate).day ?? 1)
    }

    private var minimumEndDate: Date {
        Calendar.current.date(byAdding: .day, value: car.minimumTripDays, to: startDate) ?? startDate
    }

    /// Quick-pick lengths; a single day is offered only where the host allows it.
    private var quickTripDurations: [Int] {
        car.allowOneDayBooking ? [1, 2, 5, 7] : [2, 5, 7]
    }

    private var subtotal: Int { car.dailyPrice * daysCount }
    private var platformFee: Int { Int(Double(subtotal) * 0.10) }
    private var insuranceFee: Int { max(car.insuranceFee, 0) }
    private var deliveryFee: Int { car.deliveryAvailable ? max(car.deliveryFee, 0) : 0 }

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

    private var normalizedFeatures: [String] {
        var values = car.features.filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        if values.isEmpty {
            if car.airConditioning { values.append("Air Conditioning") }
            if car.instantBook { values.append("Instant Book") }
            if car.deliveryAvailable { values.append("Delivery Available") }
        }
        return Array(Set(values)).sorted()
    }

    private var cityOptions: [String] {
        MockDataService.cities(for: tripUseRegion, preferred: tripUseCity)
    }

    private var quickPrompts: [String] {
        [
            "Is this car available this week?",
            "Can I pick up in the morning?",
            "Do you offer delivery?",
            "What documents do you need?"
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

    private var ratingSummary: String {
        car.reviewsCount > 0 ? String(format: "%.1f", car.rating) : "New"
    }

    private var tripLocationLine: String {
        "\(MockDataService.cityDisplayName(tripUseCity)), \(tripUseRegion)"
    }

    private var tripAddressLine: String {
        let trimmed = tripUseAddress.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? "Add the exact area or destination" : trimmed
    }

    // MARK: Body

    /// True once the hero photo has scrolled away; the floating controls then sit on a solid bar.
    @State private var heroScrolledAway = false

    /// "Superhost", "Top host", or "Verified host"; never "Host host".
    private var hostBadgeTitle: String {
        let level = car.hostLevel.trimmingCharacters(in: .whitespaces)
        if level.isEmpty { return "Verified host" }
        return level.lowercased().contains("host") ? level : "\(level) host"
    }

    var body: some View {
        ZStack(alignment: .top) {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 0) {
                    heroGallery
                        .coachMark("detail.photos")
                        .coachTour(.carDetail)
                        .background(
                            GeometryReader { proxy in
                                Color.clear.preference(
                                    key: DetailHeroBottomKey.self,
                                    value: proxy.frame(in: .named("carDetailScroll")).maxY
                                )
                            }
                        )

                    titleBlock
                        .padding(.horizontal, 16)
                        .padding(.top, 18)
                        .padding(.bottom, 14)
                        .hayameAppear(index: 0)

                    specChips
                        .padding(.bottom, 18)
                        .hayameAppear(index: 1)

                    sectionBand

                    tripSection
                        .padding(16)
                        .hayameAppear(index: 2)

                    sectionBand

                    priceSection
                        .padding(16)
                        .hayameAppear(index: 3)

                    sectionBand

                    hostSection
                        .padding(16)
                        .hayameAppear(index: 4)

                    sectionBand

                    descriptionSection
                        .padding(16)
                    featuresSection
                        .padding(.horizontal, 16)
                        .padding(.bottom, 16)

                    sectionBand

                    reviewsSection
                        .padding(16)

                    sectionBand

                    policySection
                        .padding(16)

                    Color.clear.frame(height: 24)
                }
            }
            .ignoresSafeArea(edges: .top)
            .coordinateSpace(name: "carDetailScroll")
            .refreshable {
                await appState.refreshCarDetail(carID: seedCar.id)
                await loadBookingAvailabilityWindow()
            }
            .onPreferenceChange(DetailHeroBottomKey.self) { heroBottom in
                let scrolled = heroBottom < 140
                guard scrolled != heroScrolledAway else { return }
                withAnimation(.easeInOut(duration: 0.2)) { heroScrolledAway = scrolled }
            }

            floatingControls
                .padding(.horizontal, 16)
                .padding(.top, 6)
                .padding(.bottom, 6)
                .background(alignment: .top) {
                    (heroScrolledAway ? HayameTheme.cardBackground : Color.clear)
                        .ignoresSafeArea(edges: .top)
                }
                .overlay(alignment: .bottom) {
                    Rectangle()
                        .fill(HayameTheme.cardStroke)
                        .frame(height: 1)
                        .opacity(heroScrolledAway ? 1 : 0)
                }
        }
        .background(HayameTheme.pageBackground.ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .navigationBarBackButtonHidden(true)
        .safeAreaInset(edge: .bottom, spacing: 0) {
            VStack(spacing: 8) {
                if showFloatingBookingBar, let resumable = appState.resumableCheckout(forCar: car.id) {
                    ResumeCheckoutStrip(resumable: resumable) {
                        resumeTarget = resumable
                    }
                    .padding(.horizontal, 16)
                }
                if showFloatingBookingBar {
                    bottomBar
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .animation(HayameMotion.settle, value: appState.resumableCheckout)
        }
        .resumeCheckoutPresenter(target: $resumeTarget)
        .sheet(isPresented: $showBookingSheet) {
            if let bookingSheetDraft {
                BookingSheet(car: car, draft: bookingSheetDraft, blockedDates: blockedBookingDates)
                    .environmentObject(appState)
            } else {
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
                        return isBookableStartDate(date, blockedDates: blockedBookingDates, minimumNights: car.minimumTripDays)
                    case .end:
                        return isBookableEndDate(date, startDate: startDate, blockedDates: blockedBookingDates, minimumNights: car.minimumTripDays)
                    }
                },
                onSelect: { selectedDate in
                    applyDateSelection(selectedDate, target: target)
                }
            )
        }
        .sheet(isPresented: $showLocationEditor) {
            TripLocationSheet(
                region: $tripUseRegion,
                city: $tripUseCity,
                address: $tripUseAddress,
                listingRegion: car.region,
                outsideRegionFee: max(car.outsideAccraFee, 0)
            )
            .presentationDetents([.medium, .large])
        }
        .sheet(item: $sharePayload) { payload in
            ListingShareSheet(payload: payload)
                .presentationDetents([.medium, .large])
        }
        .fullScreenCover(isPresented: $showGallery) {
            CarImageGalleryFullScreen(images: galleryImages, selectedIndex: $selectedImageIndex)
        }
        .task(id: seedCar.id) {
            AnalyticsService.shared.track(AnalyticsEvent.carView, [
                "car_id": seedCar.id,
                "region": seedCar.region,
                "price_bucket": AppState.analyticsPriceBucket(Double(seedCar.dailyPrice)),
            ])
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
            withAnimation(HayameMotion.settle) {
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
        .onAppear {
            // The default range is a single day; stretch it to the host's minimum.
            if let adjustedEnd = preferredBookingEndDate(
                currentEnd: endDate,
                startDate: startDate,
                blockedDates: blockedBookingDates,
                minimumNights: car.minimumTripDays
            ), adjustedEnd != endDate {
                endDate = adjustedEnd
            }
        }
        .onChange(of: startDate) { _, newValue in
            if let adjustedEnd = preferredBookingEndDate(
                currentEnd: endDate,
                startDate: newValue,
                blockedDates: blockedBookingDates,
                minimumNights: car.minimumTripDays
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
        .onChange(of: tripUseRegion) { _, newValue in
            let options = MockDataService.cities(for: newValue, preferred: tripUseCity)
            if !options.contains(where: { $0.caseInsensitiveCompare(tripUseCity) == .orderedSame }) {
                tripUseCity = options.first ?? tripUseCity
            }
        }
    }

    // MARK: Hero

    private var heroGallery: some View {
        ZStack(alignment: .bottomLeading) {
            TabView(selection: $selectedImageIndex) {
                ForEach(Array(galleryImages.enumerated()), id: \.offset) { idx, image in
                    NetworkOrFallbackImage(urlString: image, targetSize: CGSize(width: 1300, height: 900))
                        .frame(height: heroHeight)
                        .frame(maxWidth: .infinity)
                        .clipped()
                        .tag(idx)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .frame(height: heroHeight)
            .onTapGesture { showGallery = true }

            // Keeps the floating controls legible over bright photos.
            LinearGradient(colors: [.black.opacity(0.38), .clear], startPoint: .top, endPoint: .center)
                .frame(height: heroHeight)
                .allowsHitTesting(false)

            if galleryImages.count > 1 {
                Text("\(selectedImageIndex + 1) of \(galleryImages.count)")
                    .font(.hayame(size: 12, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                    .padding(16)
                    .contentTransition(.numericText())
                    .animation(HayameMotion.snappy, value: selectedImageIndex)
            }
        }
        .frame(height: heroHeight)
        .clipped()
    }

    private var floatingControls: some View {
        HStack {
            Button {
                dismiss()
            } label: {
                Image(systemName: "arrow.left")
                    .font(.hayame(size: 17, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .frame(width: 44, height: 44)
                    .background(.ultraThinMaterial, in: Circle())
            }
            .buttonStyle(HayamePressableStyle(scale: 0.9))
            .accessibilityLabel("Back")

            Text(car.displayTitle)
                .font(.hayame(size: 16, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
                .lineLimit(1)
                .frame(maxWidth: .infinity)
                .padding(.horizontal, 12)
                .opacity(heroScrolledAway ? 1 : 0)
                .accessibilityHidden(!heroScrolledAway)

            HStack(spacing: 0) {
                Button {
                    prepareListingShare()
                } label: {
                    Group {
                        if isPreparingShare {
                            ProgressView().tint(HayameTheme.brandNavy)
                        } else {
                            Image(systemName: "square.and.arrow.up")
                                .font(.hayame(size: 17, weight: .semibold))
                        }
                    }
                    .foregroundStyle(HayameTheme.brandNavy)
                    .frame(width: 48, height: 44)
                }
                .buttonStyle(.plain)
                .disabled(isPreparingShare)
                .accessibilityLabel("Share \(car.displayTitle)")

                Button {
                    HayameHaptics.light()
                    appState.toggleFavorite(carID: car.id)
                } label: {
                    Image(systemName: isFavorite ? "heart.fill" : "heart")
                        .font(.hayame(size: 17, weight: .semibold))
                        .foregroundStyle(isFavorite ? HayameTheme.danger : HayameTheme.brandNavy)
                        .frame(width: 48, height: 44)
                        .contentTransition(.symbolEffect(.replace))
                }
                .buttonStyle(.plain)
                .accessibilityLabel(isFavorite ? "Remove from saved" : "Save")
            }
            .background(.ultraThinMaterial, in: Capsule())
        }
    }

    // MARK: Title and specs

    private var titleBlock: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(car.displayTitle)
                .font(.hayame(size: 26, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: 6) {
                Text("\(String(car.year)) \(car.type)")
                    .font(.hayame(size: 14, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
                Circle().fill(HayameTheme.mutedText.opacity(0.5)).frame(width: 3, height: 3)
                HStack(spacing: 3) {
                    Text(ratingSummary)
                        .font(.hayame(size: 14, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Image(systemName: "star.fill")
                        .font(.hayame(size: 12, weight: .bold))
                        .foregroundStyle(HayameTheme.brandBlue)
                    Text(car.reviewsCount == 1 ? "(1 review)" : "(\(car.reviewsCount) reviews)")
                        .font(.hayame(size: 14, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                }
            }

            HStack(spacing: 14) {
                Label(hostBadgeTitle, systemImage: "rosette")
                    .font(.hayame(size: 14, weight: .semibold))
                    .foregroundStyle(HayameTheme.brandBlue)
                Label("\(MockDataService.cityDisplayName(car.city)), \(car.region)", systemImage: "mappin.and.ellipse")
                    .font(.hayame(size: 14, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
                    .lineLimit(1)
            }
        }
    }

    private var specChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                SpecChip(systemImage: "person.2", text: "\(car.seats) seats")
                SpecChip(systemImage: "fuelpump", text: car.fuelType)
                SpecChip(systemImage: "gearshape.2", text: car.transmission)
                SpecChip(carType: car.type)
                if car.airConditioning {
                    SpecChip(systemImage: "snowflake", text: "A/C")
                }
                if car.deliveryAvailable {
                    SpecChip(systemImage: "shippingbox", text: "Delivery")
                }
                if car.withDriver {
                    SpecChip(systemImage: "person.fill", text: "With driver", tint: HayameTheme.brandNavy)
                }
                if car.allowOneDayBooking {
                    SpecChip(systemImage: "calendar", text: "1-day bookings", tint: HayameTheme.brandBlue)
                }
                if car.instantBook {
                    SpecChip(systemImage: "bolt.fill", text: "Instant book", tint: HayameTheme.success)
                }
            }
            .padding(.horizontal, 16)
        }
    }

    private var sectionBand: some View {
        Rectangle()
            .fill(HayameTheme.fieldBackground)
            .frame(height: 8)
    }

    // MARK: Your trip

    private var tripSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Your trip")
                .font(.hayame(size: 20, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)

            TripEditRow(
                systemImage: "calendar",
                title: "Trip dates",
                lines: [
                    "\(tripDateLabel(startDate)) at 10:00 AM",
                    "\(tripDateLabel(endDate)) at 10:00 AM",
                ],
                isLoading: isLoadingBookingAvailability
            ) {
                activeDateField = .start
            }
            .coachMark("detail.trip")

            HStack(spacing: 8) {
                ForEach(quickTripDurations, id: \.self) { days in
                    let selected = selectedQuickDuration == days
                    Button {
                        HayameHaptics.select()
                        withAnimation(HayameMotion.snappy) { applyQuickTripDuration(days) }
                    } label: {
                        Text(days == 1 ? "1 day" : "\(days) days")
                            .font(.hayame(size: 13, weight: .bold))
                            .foregroundStyle(selected ? .white : HayameTheme.brandNavy)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 9)
                            .background(selected ? HayameTheme.brandBlue : HayameTheme.fieldBackground, in: Capsule())
                    }
                    .buttonStyle(HayamePressableStyle(scale: 0.95, haptic: false))
                }
                Spacer()
                Button {
                    activeDateField = .end
                } label: {
                    Label("Return", systemImage: "calendar.badge.clock")
                        .font(.hayame(size: 13, weight: .bold))
                        .foregroundStyle(HayameTheme.brandBlue)
                }
                .buttonStyle(.plain)
            }

            Divider().overlay(HayameTheme.cardStroke)

            TripEditRow(
                systemImage: "mappin.and.ellipse",
                title: "Trip location",
                lines: [tripLocationLine, tripAddressLine]
            ) {
                showLocationEditor = true
            }

            HStack(spacing: 6) {
                Image(systemName: tripOutsideListingRegion ? "exclamationmark.triangle.fill" : "checkmark.circle.fill")
                    .font(.hayame(size: 12, weight: .bold))
                Text(
                    tripOutsideListingRegion
                        ? (car.outsideAccraFee > 0
                            ? "Outside the listing region (+GHS \(max(car.outsideAccraFee, 0)) surcharge)"
                            : "Outside the listing region")
                        : "Within the listing region, no surcharge"
                )
                .font(.hayame(size: 12, weight: .semibold))
            }
            .foregroundStyle(tripOutsideListingRegion ? HayameTheme.warning : HayameTheme.success)

            Divider().overlay(HayameTheme.cardStroke)

            HStack(alignment: .top, spacing: 12) {
                RowIconChip(systemImage: car.isAvailable ? "checkmark.seal" : "xmark.seal", tint: car.isAvailable ? HayameTheme.success : HayameTheme.danger)
                VStack(alignment: .leading, spacing: 3) {
                    Text("Availability")
                        .font(.hayame(size: 15, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text(availabilityMessage ?? (car.isAvailable ? "Unavailable dates are crossed out in the calendar." : "The host has paused this listing."))
                        .font(.hayame(size: 13, weight: .medium))
                        .foregroundStyle(availabilityTone)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 8)
                Button {
                    Task { await checkAvailabilityNow() }
                } label: {
                    Group {
                        if isCheckingAvailability {
                            ProgressView().tint(HayameTheme.brandBlue)
                        } else {
                            Text("Check")
                                .font(.hayame(size: 13, weight: .bold))
                        }
                    }
                    .foregroundStyle(HayameTheme.brandBlue)
                    .frame(minWidth: 56)
                    .padding(.vertical, 9)
                    .background(HayameTheme.brandLight, in: Capsule())
                }
                .buttonStyle(HayamePressableStyle(scale: 0.95))
                .disabled(isCheckingAvailability)
            }
        }
    }

    private var availabilityTone: Color {
        guard let availabilityMessage else { return HayameTheme.mutedText }
        return availabilityMessage.localizedCaseInsensitiveContains("available") && !availabilityMessage.localizedCaseInsensitiveContains("unavailable")
            ? HayameTheme.success
            : HayameTheme.warning
    }

    // MARK: Price

    private var priceSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Price details")
                .font(.hayame(size: 20, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)

            PriceLine(label: "GHS \(car.dailyPrice) × \(daysCount) day\(daysCount == 1 ? "" : "s")", value: subtotal)
            PriceLine(label: "Service fee", value: platformFee)
            PriceLine(label: "Insurance", value: insuranceFee)
            if car.deliveryAvailable {
                PriceLine(label: "Delivery (if chosen)", value: deliveryFee)
            }
            if tripOutsideListingRegion {
                PriceLine(label: "Outside region surcharge", value: outsideAccraSurcharge)
            }
            PriceLine(label: "Refundable deposit", value: max(car.depositAmount, 0))

            Divider().overlay(HayameTheme.cardStroke)

            HStack(alignment: .firstTextBaseline) {
                Text("Estimated total")
                    .font(.hayame(size: 16, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Spacer()
                Text("GHS \(total)")
                    .font(.hayame(size: 22, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .contentTransition(.numericText())
            }
            .animation(HayameMotion.snappy, value: total)

            Text("The final total is confirmed at checkout. Pay now; the host approves before pickup and you are refunded in full if they decline.")
                .font(.hayame(size: 12, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .fixedSize(horizontal: false, vertical: true)

            Button {
                appState.renterTab = .more
            } label: {
                Label("Protection and cancellation details", systemImage: "shield.lefthalf.filled")
                    .font(.hayame(size: 13, weight: .bold))
                    .foregroundStyle(HayameTheme.brandBlue)
            }
            .buttonStyle(.plain)
        }
    }

    // MARK: Host

    private var hostSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Hosted by")
                .font(.hayame(size: 20, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)

            HStack(spacing: 14) {
                hostAvatar
                VStack(alignment: .leading, spacing: 3) {
                    Text(car.hostName)
                        .font(.hayame(size: 17, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text(car.hostLevel.isEmpty ? "Verified host" : car.hostLevel)
                        .font(.hayame(size: 13, weight: .bold))
                        .foregroundStyle(HayameTheme.brandBlue)
                    Text(car.hostCity ?? car.city)
                        .font(.hayame(size: 13, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                }
                Spacer()
                NavigationLink {
                    HostPublicProfileScreen(hostName: car.hostName, hostAvatar: car.hostAvatar, hostCars: hostCars)
                } label: {
                    Image(systemName: "chevron.right")
                        .font(.hayame(size: 13, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .frame(width: 36, height: 36)
                        .background(HayameTheme.fieldBackground, in: Circle())
                }
                .buttonStyle(HayamePressableStyle(scale: 0.9))
                .accessibilityLabel("View host profile")
            }

            HStack(spacing: 8) {
                VerificationChip(label: "ID", verified: car.hostVerified)
                VerificationChip(label: "Phone", verified: car.hostPhoneVerified)
                VerificationChip(label: "Email", verified: car.hostEmailVerified)
            }

            Button {
                openChatAndSend(message: nil)
            } label: {
                Label("Message \(car.hostName)", systemImage: "bubble.left.and.bubble.right")
                    .font(.hayame(size: 15, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 13)
                    .background(HayameTheme.brandLight, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .coachMark("detail.host")
            }
            .buttonStyle(HayamePressableStyle(scale: 0.98))

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(quickPrompts, id: \.self) { prompt in
                        Button {
                            openChatAndSend(message: prompt)
                        } label: {
                            Text(prompt)
                                .font(.hayame(size: 12, weight: .semibold))
                                .foregroundStyle(HayameTheme.brandNavy)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(HayameTheme.fieldBackground, in: Capsule())
                        }
                        .buttonStyle(HayamePressableStyle(scale: 0.95))
                    }
                }
            }
        }
    }

    // MARK: Description, features

    private var descriptionSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("About this car")
                .font(.hayame(size: 20, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
            Text(car.description)
                .font(.hayame(size: 14, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .lineLimit(showFullDescription ? nil : 4)
                .fixedSize(horizontal: false, vertical: true)
            if car.description.count > 180 {
                Button(showFullDescription ? "Show less" : "Read more") {
                    withAnimation(HayameMotion.settle) { showFullDescription.toggle() }
                }
                .font(.hayame(size: 13, weight: .bold))
                .foregroundStyle(HayameTheme.brandBlue)
            }
        }
    }

    private var featuresSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Features")
                .font(.hayame(size: 16, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
            if normalizedFeatures.isEmpty {
                Text("No features listed.")
                    .font(.hayame(size: 13, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
            } else {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 140), spacing: 8)], alignment: .leading, spacing: 8) {
                    ForEach(normalizedFeatures, id: \.self) { feature in
                        Label(feature, systemImage: "checkmark")
                            .font(.hayame(size: 13, weight: .semibold))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 9)
                            .background(HayameTheme.fieldBackground, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                }
            }
        }
    }

    // MARK: Reviews

    private var reviewsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text("Reviews")
                    .font(.hayame(size: 20, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Spacer()
                Image(systemName: "star.fill")
                    .font(.hayame(size: 13, weight: .bold))
                    .foregroundStyle(HayameTheme.brandBlue)
                Text(car.reviewsCount > 0 ? "\(ratingSummary) • \(car.reviewsCount)" : "No reviews yet")
                    .font(.hayame(size: 14, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
            }

            if listingReviews.isEmpty {
                Text("Be the first to share how the trip went.")
                    .font(.hayame(size: 13, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
            } else {
                ForEach(listingReviews.prefix(3)) { review in
                    HStack(alignment: .top, spacing: 12) {
                        Text(initials(of: review.guestName))
                            .font(.hayame(size: 12, weight: .bold))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .frame(width: 36, height: 36)
                            .background(HayameTheme.brandLight, in: Circle())
                        VStack(alignment: .leading, spacing: 4) {
                            HStack(spacing: 8) {
                                Text(review.guestName)
                                    .font(.hayame(size: 14, weight: .bold))
                                    .foregroundStyle(HayameTheme.brandNavy)
                                HStack(spacing: 2) {
                                    ForEach(0..<max(1, min(5, review.rating)), id: \.self) { _ in
                                        Image(systemName: "star.fill")
                                            .font(.hayame(size: 10, weight: .bold))
                                    }
                                }
                                .foregroundStyle(HayameTheme.brandBlue)
                            }
                            Text(review.comment.isEmpty ? "No comment provided." : review.comment)
                                .font(.hayame(size: 13, weight: .medium))
                                .foregroundStyle(HayameTheme.mutedText)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    .padding(.vertical, 4)
                }
            }

            if canSubmitReview {
                if showReviewComposer {
                    reviewComposer
                        .transition(.opacity.combined(with: .move(edge: .top)))
                } else {
                    Button {
                        withAnimation(HayameMotion.settle) { showReviewComposer = true }
                    } label: {
                        Label("Write a review", systemImage: "square.and.pencil")
                            .font(.hayame(size: 14, weight: .bold))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 11)
                            .background(HayameTheme.brandLight, in: Capsule())
                    }
                    .buttonStyle(HayamePressableStyle(scale: 0.96))
                }
            } else {
                Text("Guests can review after a completed trip.")
                    .font(.hayame(size: 12, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
            }

            if let reviewStatusMessage, !reviewStatusMessage.isEmpty {
                Text(reviewStatusMessage)
                    .font(.hayame(size: 12, weight: .semibold))
                    .foregroundStyle(HayameTheme.mutedText)
            }
        }
    }

    private var reviewComposer: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Text("Your rating")
                    .font(.hayame(size: 13, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Spacer()
                ForEach(1...5, id: \.self) { star in
                    Button {
                        HayameHaptics.select()
                        reviewRating = star
                    } label: {
                        Image(systemName: star <= reviewRating ? "star.fill" : "star")
                            .font(.hayame(size: 20, weight: .bold))
                            .foregroundStyle(star <= reviewRating ? HayameTheme.brandBlue : HayameTheme.mutedText)
                    }
                    .buttonStyle(.plain)
                }
            }

            TextEditor(text: $reviewComment)
                .font(.hayame(size: 14))
                .scrollContentBackground(.hidden)
                .foregroundStyle(HayameTheme.brandNavy)
                .frame(minHeight: 90)
                .padding(8)
                .background(HayameTheme.fieldBackground, in: RoundedRectangle(cornerRadius: 12, style: .continuous))

            Button("Submit review") {
                Task {
                    guard let booking = completedReviewBooking else { return }
                    let ok = await appState.submitReview(bookingID: booking.id, rating: reviewRating, comment: reviewComment)
                    if ok {
                        reviewStatusMessage = "Thanks, your review is live."
                        reviewComment = ""
                        reviewRating = 5
                        withAnimation(HayameMotion.settle) { showReviewComposer = false }
                    } else {
                        reviewStatusMessage = appState.syncErrorMessage
                    }
                }
            }
            .buttonStyle(PrimaryPillButtonStyle())
            .disabled(reviewComment.trimmingCharacters(in: .whitespacesAndNewlines).count < 3)
        }
        .padding(14)
        .background(HayameTheme.cardBackground, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
    }

    // MARK: Policies

    private var policySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Good to know")
                .font(.hayame(size: 20, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
            PolicyRow(systemImage: "arrow.uturn.backward.circle", title: "Cancellation", value: car.cancellationPolicy)
            PolicyRow(systemImage: "creditcard", title: "Payment", value: "Paystack, card or mobile money")
            PolicyRow(systemImage: "checkmark.shield", title: "Host approval", value: car.instantBook ? "Instant book" : "Confirmed before pickup")
            PolicyRow(systemImage: "calendar", title: "Minimum trip", value: car.allowOneDayBooking ? "1 day" : "2 days")
            PolicyRow(systemImage: "person.crop.circle", title: "Driver", value: car.withDriver ? "Comes with a driver" : "Self-drive")
            PolicyRow(systemImage: "calendar.badge.plus", title: "Listed", value: addedDateLabel)
        }
    }

    private var addedDateLabel: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, yyyy"
        return formatter.string(from: car.createdAt)
    }

    // MARK: Bottom bar

    private var bottomBar: some View {
        HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(alignment: .firstTextBaseline, spacing: 3) {
                    Text("GHS \(car.dailyPrice)")
                        .font(.hayame(size: 22, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text("/day")
                        .font(.hayame(size: 13, weight: .semibold))
                        .foregroundStyle(HayameTheme.mutedText)
                }
                Text("GHS \(total) est. for \(daysCount) day\(daysCount == 1 ? "" : "s")")
                    .font(.hayame(size: 12, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
                    .contentTransition(.numericText())
            }
            .animation(HayameMotion.snappy, value: total)

            Spacer(minLength: 8)

            Button(action: openBookingFlow) {
                Text("Book now")
                    .font(.hayame(size: 16, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 26)
                    .padding(.vertical, 14)
                    .background(HayameTheme.brandBlue, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .coachMark("detail.book")
            }
            .buttonStyle(HayamePressableStyle(scale: 0.96))
        }
        .padding(.horizontal, 16)
        .padding(.top, 12)
        .padding(.bottom, 8)
        .background(.ultraThinMaterial)
        .overlay(alignment: .top) {
            Rectangle().fill(HayameTheme.bottomBarSeparator).frame(height: 1)
        }
    }

    // MARK: Pieces

    @ViewBuilder
    private var hostAvatar: some View {
        if let url = RemoteImageURLResolver.resolve(car.hostAvatar) {
            CachedRemoteImage(url: url, targetSize: CGSize(width: 120, height: 120)) {
                Circle().fill(HayameTheme.brandLight)
            } failure: {
                fallbackHostAvatar
            }
            .frame(width: 56, height: 56)
            .clipShape(Circle())
        } else {
            fallbackHostAvatar
                .frame(width: 56, height: 56)
        }
    }

    private var fallbackHostAvatar: some View {
        Circle()
            .fill(HayameTheme.brandLight)
            .overlay(
                Text(initials(of: car.hostName))
                    .font(.hayame(size: 15, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
            )
    }

    private func initials(of name: String) -> String {
        let value = name
            .split(separator: " ")
            .prefix(2)
            .compactMap { $0.first.map(String.init) }
            .joined()
            .uppercased()
        return value.isEmpty ? "H" : value
    }

    private func tripDateLabel(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_GH")
        formatter.dateFormat = "EEE, d MMM"
        return formatter.string(from: date)
    }

    // MARK: Actions

    private func openBookingFlow() {
        if appState.isAuthenticated {
            // Pick up saved choices for this car so "Book now" never starts over.
            if let resumable = appState.resumableCheckout(forCar: car.id) {
                switch resumable {
                case .held(let checkout):
                    var draft = checkout.asDraft(userID: appState.currentUser.id)
                    draft.step = BookingCheckoutStep.tripDetails.rawValue
                    bookingSheetDraft = draft
                case .draft(let draft):
                    bookingSheetDraft = draft
                }
            } else {
                bookingSheetDraft = nil
            }
            showBookingSheet = true
        } else {
            authGateMessage = "Create an account or log in to book this car."
            showAuthGateAlert = true
        }
    }

    private func prepareListingShare() {
        guard !isPreparingShare else { return }
        isPreparingShare = true

        Task {
            let coverURL = car.imageNames.compactMap(RemoteImageURLResolver.resolve).first
            let coverImage: UIImage?
            if let coverURL {
                coverImage = await RemoteImagePipeline.shared.loadImage(
                    from: coverURL,
                    targetPixelSize: CGSize(width: 1200, height: 630)
                )
            } else {
                coverImage = nil
            }

            let thumbnail = ListingShareThumbnailRenderer.render(
                carImage: coverImage,
                listingTitle: car.displayTitle
            )
            sharePayload = ListingSharePayload(
                title: car.displayTitle,
                message: shareMessage,
                url: shareURL,
                thumbnail: thumbnail
            )
            isPreparingShare = false
        }
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
                availabilityMessage = "Your dates are available."
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

        guard let nextStart = nextBookableStartDate(from: today, duration: car.minimumTripDays, blockedDates: blocked) else {
            availabilityMessage = "No upcoming available dates in the next 6 months."
            return
        }

        let normalizedStart = bookingDay(startDate)
        let adjustedStart = isBookableStartDate(normalizedStart, blockedDates: blocked, minimumNights: car.minimumTripDays) ? normalizedStart : nextStart
        startDate = adjustedStart

        if let adjustedEnd = preferredBookingEndDate(
            currentEnd: endDate,
            startDate: adjustedStart,
            blockedDates: blocked,
            minimumNights: car.minimumTripDays
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
            guard isBookableStartDate(normalized, blockedDates: blockedBookingDates, minimumNights: car.minimumTripDays) else { return }
            startDate = normalized
            if let adjustedEnd = preferredBookingEndDate(
                currentEnd: endDate,
                startDate: normalized,
                blockedDates: blockedBookingDates,
                minimumNights: car.minimumTripDays
            ) {
                endDate = adjustedEnd
            }
        case .end:
            let normalized = bookingDay(selectedDate)
            guard isBookableEndDate(normalized, startDate: startDate, blockedDates: blockedBookingDates, minimumNights: car.minimumTripDays) else { return }
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

// MARK: - Pieces

private struct SpecChip: View {
    enum Icon {
        case symbol(String)
        case carType(String)
    }

    let icon: Icon
    let text: String
    var tint: Color = HayameTheme.brandNavy

    init(systemImage: String, text: String, tint: Color = HayameTheme.brandNavy) {
        self.icon = .symbol(systemImage)
        self.text = text
        self.tint = tint
    }

    init(carType: String) {
        self.icon = .carType(carType)
        self.text = carType
    }

    var body: some View {
        HStack(spacing: 7) {
            switch icon {
            case .symbol(let name):
                Image(systemName: name)
                    .font(.hayame(size: 13, weight: .semibold))
            case .carType(let type):
                CarTypeIcon(type: type)
                    .frame(width: 18, height: 13)
            }
            Text(text)
                .font(.hayame(size: 13, weight: .semibold))
        }
        .foregroundStyle(tint)
        .padding(.horizontal, 12)
        .padding(.vertical, 9)
        .background(HayameTheme.fieldBackground, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

private struct RowIconChip: View {
    let systemImage: String
    var tint: Color = HayameTheme.brandNavy

    var body: some View {
        Image(systemName: systemImage)
            .font(.hayame(size: 17, weight: .semibold))
            .foregroundStyle(tint)
            .frame(width: 40, height: 40)
            .background(HayameTheme.fieldBackground, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

/// A row in "Your trip": icon, title, one or two lines, and a pencil to edit.
private struct TripEditRow: View {
    let systemImage: String
    let title: String
    let lines: [String]
    var isLoading = false
    let onEdit: () -> Void

    var body: some View {
        Button(action: onEdit) {
            HStack(alignment: .top, spacing: 12) {
                RowIconChip(systemImage: systemImage)
                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.hayame(size: 15, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    ForEach(lines, id: \.self) { line in
                        Text(line)
                            .font(.hayame(size: 14, weight: .medium))
                            .foregroundStyle(HayameTheme.brandNavy.opacity(0.85))
                            .lineLimit(2)
                            .multilineTextAlignment(.leading)
                    }
                    .redacted(reason: isLoading ? .placeholder : [])
                }
                Spacer(minLength: 8)
                Image(systemName: "pencil")
                    .font(.hayame(size: 15, weight: .semibold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .frame(width: 42, height: 42)
                    .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(HayameTheme.controlStroke, lineWidth: 1))
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(HayamePressableStyle(scale: 0.985))
        .accessibilityLabel("Edit \(title.lowercased())")
    }
}

private struct PriceLine: View {
    let label: String
    let value: Int

    var body: some View {
        HStack {
            Text(label)
                .font(.hayame(size: 14, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
            Spacer()
            Text("GHS \(value)")
                .font(.hayame(size: 14, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
                .contentTransition(.numericText())
        }
        .animation(HayameMotion.snappy, value: value)
    }
}

private struct VerificationChip: View {
    let label: String
    let verified: Bool

    var body: some View {
        Label(label, systemImage: verified ? "checkmark.seal.fill" : "seal")
            .font(.hayame(size: 12, weight: .bold))
            .foregroundStyle(verified ? HayameTheme.success : HayameTheme.mutedText)
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background((verified ? HayameTheme.success : HayameTheme.mutedText).opacity(0.12), in: Capsule())
    }
}

private struct PolicyRow: View {
    let systemImage: String
    let title: String
    let value: String

    var body: some View {
        HStack(spacing: 12) {
            RowIconChip(systemImage: systemImage)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.hayame(size: 14, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Text(value)
                    .font(.hayame(size: 13, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
            }
            Spacer()
        }
    }
}

/// Region, city and exact area for the trip, edited from the "Trip location" row.
private struct TripLocationSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var region: String
    @Binding var city: String
    @Binding var address: String
    let listingRegion: String
    let outsideRegionFee: Int

    private var outsideRegion: Bool {
        MockDataService.isOutsideListingRegion(tripRegion: region, listingRegion: listingRegion)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Where will you use the car? Pricing and the host handoff depend on it.")
                        .font(.hayame(size: 13, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)

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
                        Text("Exact area (optional)")
                            .font(.hayame(size: 14, weight: .bold))
                            .foregroundStyle(HayameTheme.brandNavy)
                        TextField("Area, landmark, or pickup point", text: $address)
                            .font(.hayame(size: 15))
                            .textInputAutocapitalization(.words)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 14)
                            .background(HayameTheme.fieldBackground, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }

                    Label(
                        outsideRegion
                            ? (outsideRegionFee > 0 ? "Outside \(listingRegion): +GHS \(outsideRegionFee) surcharge" : "Outside \(listingRegion)")
                            : "Within \(listingRegion), no surcharge",
                        systemImage: outsideRegion ? "exclamationmark.triangle.fill" : "checkmark.circle.fill"
                    )
                    .font(.hayame(size: 13, weight: .semibold))
                    .foregroundStyle(outsideRegion ? HayameTheme.warning : HayameTheme.success)
                }
                .padding(16)
            }
            .background(HayameTheme.pageBackground)
            .navigationTitle("Trip location")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .font(.hayame(size: 16, weight: .bold))
                }
            }
        }
    }
}

/// Bottom edge of the hero photo in the car page's scroll space.
private struct DetailHeroBottomKey: PreferenceKey {
    static var defaultValue: CGFloat = .infinity
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = nextValue() }
}

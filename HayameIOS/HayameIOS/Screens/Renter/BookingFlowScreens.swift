import SwiftUI

// MARK: - Booking flow
//
// Four short steps after "Book now": dates, handoff, review, pay. A slim
// header carries the step, a segmented progress bar and the car; the bottom
// bar always shows what the trip costs so far. Steps slide in the direction
// of travel, sections stagger in, numbers roll, and a failed check shakes the
// bar instead of hiding an error at the top of a long form.

struct BookingSheet: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    let car: Car
    /// Set when the sheet was opened from a saved checkout; keeps the draft
    /// alive across the session so nothing the renter chose is lost.
    private var resumedDraft: CheckoutDraft? = nil
    @State private var didCompleteCheckout = false
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
    /// Set once payment is verified; drives the success stage over the checkout.
    @State private var successBookingID: String?
    /// Bumped on a failed check so the bottom bar shakes.
    @State private var shakeCount = 0

    init(car: Car, startDate: Date, endDate: Date, region: String, city: String, address: String, blockedDates: Set<Date> = []) {
        self.car = car
        _startDate = State(initialValue: startDate)
        let earliestEnd = Calendar.current.date(byAdding: .day, value: car.minimumTripDays, to: startDate) ?? startDate
        _endDate = State(initialValue: endDate >= earliestEnd ? endDate : earliestEnd)
        _blockedDates = State(initialValue: blockedDates)
        _region = State(initialValue: MockDataService.normalizedRegion(region))
        _city = State(initialValue: city)
        _address = State(initialValue: address)
        _tripMode = State(initialValue: car.deliveryAvailable ? nil : .pickup)
        _deliveryTimeSelection = State(initialValue: Self.defaultDeliveryTime())
    }

    /// Reopens the checkout exactly where a saved draft or held checkout left
    /// it: same dates, trip mode, area and delivery details, same step.
    init(car: Car, draft: CheckoutDraft, blockedDates: Set<Date> = []) {
        self.car = car
        let today = Calendar.current.startOfDay(for: Date())
        let savedStart = AppState.dateOnlyFormatter.date(from: draft.startDate) ?? today
        let start = max(savedStart, today)
        let savedEnd = AppState.dateOnlyFormatter.date(from: draft.endDate) ?? start
        let nights = max(car.minimumTripDays, Calendar.current.dateComponents([.day], from: savedStart, to: savedEnd).day ?? 1)
        let end = savedEnd > start ? savedEnd : (Calendar.current.date(byAdding: .day, value: nights, to: start) ?? start)
        _startDate = State(initialValue: start)
        _endDate = State(initialValue: end)
        _blockedDates = State(initialValue: blockedDates)
        _region = State(initialValue: MockDataService.normalizedRegion(draft.region.isEmpty ? car.region : draft.region))
        _city = State(initialValue: draft.city.isEmpty ? car.city : draft.city)
        _address = State(initialValue: draft.address)
        _tripMode = State(initialValue: draft.tripMode ?? (car.deliveryAvailable ? nil : .pickup))
        _deliveryDetails = State(initialValue: draft.delivery)
        _deliveryTimeSelection = State(initialValue: Self.deliveryTime(from: draft.delivery.time) ?? Self.defaultDeliveryTime())
        _currentStep = State(initialValue: BookingCheckoutStep(rawValue: draft.step) ?? .tripDetails)
        resumedDraft = draft
    }

    #if DEBUG
    init(
        car: Car,
        startDate: Date,
        endDate: Date,
        region: String,
        city: String,
        address: String,
        blockedDates: Set<Date> = [],
        screenshotStep: BookingCheckoutStep,
        screenshotTripMode: BookingTripMode? = .delivery,
        screenshotProcessing: Bool = false
    ) {
        self.car = car
        _startDate = State(initialValue: startDate)
        let earliestEnd = Calendar.current.date(byAdding: .day, value: car.minimumTripDays, to: startDate) ?? startDate
        _endDate = State(initialValue: endDate >= earliestEnd ? endDate : earliestEnd)
        _blockedDates = State(initialValue: blockedDates)
        _region = State(initialValue: MockDataService.normalizedRegion(region))
        _city = State(initialValue: city)
        _address = State(initialValue: address)
        _tripMode = State(initialValue: screenshotTripMode)
        _deliveryDetails = State(initialValue: BookingDeliveryDetails(
            address: "22 Airport Bypass, Accra",
            time: "10:00",
            contactPhone: "+233 24 555 0001",
            notes: "Meet at the main gate."
        ))
        _deliveryTimeSelection = State(initialValue: Self.defaultDeliveryTime())
        _isProcessingPayment = State(initialValue: screenshotProcessing)
        _currentStep = State(initialValue: screenshotStep)
        _selectedQuickDuration = State(initialValue: 2)
    }
    #endif

    // MARK: Formatting

    private static func defaultDeliveryTime() -> Date {
        let calendar = Calendar.current
        let roundedHour = calendar.dateInterval(of: .hour, for: Date())?.start ?? Date()
        return calendar.date(byAdding: .hour, value: 1, to: roundedHour) ?? roundedHour
    }

    private static func deliveryTime(from raw: String) -> Date? {
        let parts = raw.trimmingCharacters(in: .whitespacesAndNewlines).split(separator: ":")
        guard parts.count == 2, let hour = Int(parts[0]), let minute = Int(parts[1]),
              (0...23).contains(hour), (0...59).contains(minute) else { return nil }
        return Calendar.current.date(bySettingHour: hour, minute: minute, second: 0, of: Date())
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

    private static let weekdayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE"
        return formatter
    }()

    private static let dayMonthFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "d MMM"
        return formatter
    }()

    private static let shortDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE, d MMM"
        return formatter
    }()

    private static let moneyFormatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 0
        return formatter
    }()

    fileprivate static func money(_ value: Int) -> String {
        "GHS " + (moneyFormatter.string(from: NSNumber(value: value)) ?? "\(value)")
    }

    /// Listings hand over at 10 AM unless the host arranges otherwise.
    private let handoffTimeLabel = "10:00 AM"

    // MARK: Pricing

    private var minimumEndDate: Date {
        Calendar.current.date(byAdding: .day, value: car.minimumTripDays, to: startDate) ?? startDate
    }

    /// Quick-pick lengths; a single day is offered only where the host allows it.
    private var quickTripOptions: [(Int, String)] {
        let base = [(2, "2 days"), (3, "3 days"), (5, "5 days"), (7, "1 week")]
        return car.allowOneDayBooking ? [(1, "1 day")] + base : base
    }

    private var nights: Int {
        max(1, Calendar.current.dateComponents([.day], from: startDate, to: endDate).day ?? 1)
    }

    private var dayWord: String { nights == 1 ? "day" : "days" }

    private var subtotal: Int {
        car.dailyPrice * nights
    }

    private var insuranceFee: Int {
        max(car.insuranceFee, 0)
    }

    // Service fee at the platform fee the admin set (sent with every car list).
    // The server is authoritative; this keeps the displayed total honest.
    private var platformFee: Int {
        appState.platformFee(forSubtotal: subtotal)
    }

    /// The mode that will actually be booked: a pickup-only listing is always
    /// pickup, even if an older draft said delivery.
    private var selectedTripMode: BookingTripMode {
        car.deliveryAvailable ? (tripMode ?? .pickup) : .pickup
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
        subtotal + platformFee + insuranceFee + deliveryFee + outsideAccraSurcharge + depositAmount
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

    private var resolvedDestination: String {
        let trimmedAddress = address.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmedAddress.isEmpty ? city : trimmedAddress
    }

    private var datesAreFree: Bool {
        isBookableStartDate(startDate, blockedDates: blockedDates, minimumNights: car.minimumTripDays)
            && isBookableEndDate(endDate, startDate: startDate, blockedDates: blockedDates, minimumNights: car.minimumTripDays)
    }

    private var handoffPlace: String {
        if selectedTripMode == .delivery {
            let trimmed = deliveryDetails.address.trimmingCharacters(in: .whitespacesAndNewlines)
            return trimmed.isEmpty ? "Your delivery address" : trimmed
        }
        return "\(car.city), \(car.region)"
    }

    // MARK: Bottom bar copy

    private var barAmount: Int {
        currentStep.rawValue >= BookingCheckoutStep.review.rawValue ? totalAmount : subtotal
    }

    private var barCaption: String {
        currentStep.rawValue >= BookingCheckoutStep.review.rawValue
            ? "Total incl. refundable deposit"
            : "\(nights) \(dayWord) · before fees"
    }

    private var primaryButtonTitle: String {
        switch currentStep {
        case .tripDetails, .location, .review: return "Continue"
        case .payment: return isProcessingPayment ? "Paying" : "Pay \(Self.money(totalAmount))"
        }
    }

    private var stepTransition: AnyTransition {
        let insertionEdge: Edge = isMovingForward ? .trailing : .leading
        let removalEdge: Edge = isMovingForward ? .leading : .trailing
        return .asymmetric(
            insertion: .move(edge: insertionEdge).combined(with: .opacity),
            removal: .move(edge: removalEdge).combined(with: .opacity)
        )
    }

    // MARK: Body

    var body: some View {
        ZStack {
            HayameTheme.pageBackground.ignoresSafeArea()

            VStack(spacing: 0) {
                header

                ZStack {
                    currentStepContent
                        .id(currentStep)
                        .transition(stepTransition)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                .clipped()
            }
            .safeAreaInset(edge: .bottom, spacing: 0) {
                if successBookingID == nil {
                    bottomBar
                }
            }

            if let successBookingID {
                BookingSuccessStage(
                    car: car,
                    bookingID: successBookingID,
                    startDate: startDate,
                    endDate: endDate,
                    onDone: {
                        appState.renterTab = .trips
                        dismiss()
                    }
                )
                .transition(.opacity.combined(with: .scale(scale: 1.04)))
                .zIndex(5)
            }

            if isProcessingPayment {
                PaymentProcessingOverlay()
                    .transition(.opacity)
                    .zIndex(10)
            }
        }
        .interactiveDismissDisabled(successBookingID != nil || isProcessingPayment)
        .coachMarkHost(scope: "booking")
        .animation(.easeInOut(duration: 0.25), value: isProcessingPayment)
        .onChange(of: startDate) { _, newValue in
            if let adjustedEnd = preferredBookingEndDate(
                currentEnd: endDate,
                startDate: newValue,
                blockedDates: blockedDates,
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
                        return isBookableStartDate(date, blockedDates: blockedDates, minimumNights: car.minimumTripDays)
                    case .end:
                        return isBookableEndDate(date, startDate: startDate, blockedDates: blockedDates, minimumNights: car.minimumTripDays)
                    }
                },
                onSelect: { selectedDate in
                    withAnimation(HayameMotion.snappy) {
                        applyDateSelection(selectedDate, target: target)
                    }
                }
            )
        }
        .onDisappear {
            persistDraftIfNeeded()
        }
    }

    // MARK: Header

    private var header: some View {
        VStack(spacing: 12) {
            ZStack {
                HStack {
                    Button {
                        if currentStep == .tripDetails {
                            dismiss()
                        } else {
                            goBack()
                        }
                    } label: {
                        Image(systemName: currentStep == .tripDetails ? "xmark" : "chevron.left")
                            .font(.hayame(size: 15, weight: .bold))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .contentTransition(.symbolEffect(.replace))
                            .frame(width: 40, height: 40)
                            .background(HayameTheme.fieldBackground, in: Circle())
                    }
                    .buttonStyle(HayamePressableStyle(scale: 0.9))
                    .accessibilityLabel(currentStep == .tripDetails ? "Close" : "Back")

                    Spacer()

                    Text("\(currentStep.stepNumber) of \(BookingCheckoutStep.allCases.count)")
                        .font(.hayame(size: 12, weight: .bold))
                        .foregroundStyle(HayameTheme.brandBlue)
                        .contentTransition(.numericText())
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(HayameTheme.brandBlue.opacity(0.12), in: Capsule())
                }

                ZStack {
                    Text(currentStep.title)
                        .font(.hayame(size: 17, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .id(currentStep)
                        .transition(.asymmetric(
                            insertion: .offset(y: 8).combined(with: .opacity),
                            removal: .offset(y: -8).combined(with: .opacity)
                        ))
                }
            }

            BookingSegmentedProgress(currentIndex: currentStep.rawValue, count: BookingCheckoutStep.allCases.count)
                .coachMark("booking.progress")

            BookingCarStrip(car: car)
        }
        .padding(.horizontal, 16)
        .padding(.top, 16)
        .padding(.bottom, 10)
        .animation(HayameMotion.settle, value: currentStep)
    }

    // MARK: Steps

    @ViewBuilder
    private var currentStepContent: some View {
        switch currentStep {
        case .tripDetails: datesStep
        case .location: handoffStep
        case .review: reviewStep
        case .payment: paymentStep
        }
    }

    private func stepScroll<Content: View>(@ViewBuilder _ content: () -> Content) -> some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 18) {
                content()
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 28)
        }
        .scrollDismissesKeyboard(.interactively)
    }

    private func stepHeading(_ title: String, _ subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title)
                .font(.hayame(size: 26, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
                .fixedSize(horizontal: false, vertical: true)
            Text(subtitle)
                .font(.hayame(size: 14, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    // Step 1 — dates

    private var datesStep: some View {
        stepScroll {
            stepHeading(
                "When do you need it?",
                car.allowOneDayBooking
                    ? "Pick your dates. Single-day trips are welcome on this car."
                    : "Pick your dates. This car needs at least 2 days."
            )
                .hayameAppear(index: 0)

            dateRangeCard
                .coachMark("booking.dates")
                .coachTour(.booking)
                .hayameAppear(index: 1)

            availabilityRow
                .hayameAppear(index: 2)

            VStack(alignment: .leading, spacing: 10) {
                BookingSectionLabel(title: "Quick picks")
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(quickTripOptions, id: \.0) { days, title in
                            BookingChip(title: title, isSelected: selectedQuickDuration == days) {
                                HayameHaptics.select()
                                withAnimation(HayameMotion.snappy) {
                                    applyQuickTripDuration(days)
                                }
                            }
                        }
                    }
                    .padding(.vertical, 2)
                    .padding(.horizontal, 1)
                }
            }
            .hayameAppear(index: 3)

            pricePreview
                .hayameAppear(index: 4)
        }
    }

    private var dateRangeCard: some View {
        HStack(spacing: 0) {
            dateHalf(caption: "Pick-up", date: startDate, target: .start)
            Rectangle()
                .fill(HayameTheme.cardStroke)
                .frame(width: 1)
                .padding(.vertical, 14)
            dateHalf(caption: "Return", date: endDate, target: .end)
        }
        .background(HayameTheme.cardBackground, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
        .overlay {
            Text("\(nights) \(dayWord)")
                .font(.hayame(size: 12, weight: .bold))
                .foregroundStyle(.white)
                .contentTransition(.numericText(value: Double(nights)))
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(HayameTheme.brandBlue, in: Capsule())
                .shadow(color: HayameTheme.brandBlue.opacity(0.25), radius: 8, x: 0, y: 4)
                .animation(HayameMotion.bouncy, value: nights)
        }
        .shadow(color: HayameTheme.cardShadow, radius: 14, x: 0, y: 6)
    }

    private func dateHalf(caption: String, date: Date, target: BookingDateSelectionTarget) -> some View {
        Button {
            HayameHaptics.light()
            activeDateField = target
        } label: {
            VStack(alignment: target == .start ? .leading : .trailing, spacing: 4) {
                HStack(spacing: 5) {
                    Image(systemName: target == .start ? "arrow.up.right" : "arrow.down.left")
                        .font(.hayame(size: 10, weight: .bold))
                    Text(caption.uppercased())
                        .font(.hayame(size: 11, weight: .bold))
                        .tracking(0.6)
                }
                .foregroundStyle(HayameTheme.brandBlue)

                Text(Self.dayMonthFormatter.string(from: date))
                    .font(.hayame(size: 26, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .contentTransition(.numericText())
                    .redacted(reason: isLoadingAvailability ? .placeholder : [])

                Text(Self.weekdayFormatter.string(from: date))
                    .font(.hayame(size: 13, weight: .semibold))
                    .foregroundStyle(HayameTheme.brandNavy.opacity(0.8))
                    .contentTransition(.opacity)

                Text(handoffTimeLabel)
                    .font(.hayame(size: 12, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
            }
            .frame(maxWidth: .infinity, alignment: target == .start ? .leading : .trailing)
            .padding(.horizontal, 18)
            .padding(.vertical, 18)
            .contentShape(Rectangle())
        }
        .buttonStyle(HayamePressableStyle(scale: 0.97, haptic: false))
        .accessibilityLabel("\(caption) \(Self.shortDateFormatter.string(from: date)). Change")
    }

    private var availabilityRow: some View {
        let isFree = datesAreFree
        let tint = isLoadingAvailability ? HayameTheme.brandBlue : (isFree ? HayameTheme.success : HayameTheme.warning)
        let text: String = {
            if isLoadingAvailability { return "Checking availability..." }
            if let paymentMessage, currentStep == .tripDetails, !isFree { return paymentMessage }
            return isFree ? "These dates are free to book" : "Some of these days are taken. Pick other dates."
        }()

        return HStack(spacing: 10) {
            ZStack {
                if isLoadingAvailability {
                    ProgressView()
                        .controlSize(.small)
                        .tint(tint)
                        .transition(.opacity)
                } else {
                    Image(systemName: isFree ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                        .font(.hayame(size: 17, weight: .bold))
                        .foregroundStyle(tint)
                        .transition(.scale(scale: 0.4).combined(with: .opacity))
                        .id(isFree)
                }
            }
            .frame(width: 22, height: 22)

            Text(text)
                .font(.hayame(size: 13, weight: .semibold))
                .foregroundStyle(isLoadingAvailability ? HayameTheme.mutedText : tint)
                .fixedSize(horizontal: false, vertical: true)
                .contentTransition(.opacity)

            Spacer(minLength: 0)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(tint.opacity(0.1), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .animation(HayameMotion.snappy, value: isLoadingAvailability)
        .animation(HayameMotion.snappy, value: isFree)
    }

    private var pricePreview: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text("\(Self.money(car.dailyPrice)) × \(nights) \(dayWord)")
                    .font(.hayame(size: 15, weight: .semibold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .contentTransition(.numericText())
                Text("Fees and the refundable deposit are shown before you pay.")
                    .font(.hayame(size: 12, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 8)
            Text(Self.money(subtotal))
                .font(.hayame(size: 22, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
                .contentTransition(.numericText(value: Double(subtotal)))
        }
        .padding(16)
        .background(HayameTheme.cardBackground, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
        .animation(HayameMotion.snappy, value: subtotal)
    }

    // Step 2 — handoff

    private var handoffStep: some View {
        stepScroll {
            stepHeading(
                "How do you want the car?",
                car.deliveryAvailable
                    ? "Meet the host to pick it up, or have it brought to you."
                    : "This host hands the car over in person."
            )
            .hayameAppear(index: 0)

            if car.deliveryAvailable {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 12) {
                        BookingHandoffTile(
                            systemImage: "figure.walk",
                            title: "Pickup",
                            detail: "Meet the host in \(car.city)",
                            price: "Free",
                            isSelected: tripMode == .pickup
                        ) {
                            chooseTripMode(.pickup)
                        }
                        BookingHandoffTile(
                            systemImage: "shippingbox.fill",
                            title: "Delivery",
                            detail: "Brought to your door",
                            price: max(car.deliveryFee, 0) > 0 ? Self.money(max(car.deliveryFee, 0)) : "Free",
                            isSelected: tripMode == .delivery
                        ) {
                            chooseTripMode(.delivery)
                        }
                    }
                    if tripMode == nil {
                        Label("Choose pickup or delivery to continue.", systemImage: "hand.tap.fill")
                            .font(.hayame(size: 12, weight: .semibold))
                            .foregroundStyle(HayameTheme.warning)
                            .transition(.opacity)
                    }
                }
                .hayameAppear(index: 1)
            } else {
                BookingHandoffTile(
                    systemImage: "figure.walk",
                    title: "Pickup",
                    detail: "This listing is pickup only",
                    price: "Free",
                    isSelected: true
                ) {}
                .hayameAppear(index: 1)
            }

            if car.deliveryAvailable && tripMode == .delivery {
                deliveryDetailsCard
                    .transition(.asymmetric(
                        insertion: .move(edge: .top).combined(with: .opacity),
                        removal: .opacity
                    ))
            } else if selectedTripMode == .pickup {
                BookingInfoRow(
                    systemImage: "mappin.circle.fill",
                    tint: HayameTheme.brandBlue,
                    title: "Pick up in \(car.city), \(car.region)",
                    message: "The exact spot is shared once the host confirms."
                )
                .transition(.opacity)
                .hayameAppear(index: 2)
            }

            tripAreaCard
                .hayameAppear(index: 3)
        }
        .animation(HayameMotion.settle, value: tripMode)
    }

    private var deliveryDetailsCard: some View {
        BookingCard {
            VStack(alignment: .leading, spacing: 14) {
                BookingSectionLabel(title: "Delivery details", systemImage: "shippingbox.fill")

                BookingInputField(
                    title: "Delivery address",
                    systemImage: "mappin.and.ellipse",
                    text: $deliveryDetails.address,
                    placeholder: "House number, street, landmark"
                )

                HStack(spacing: 12) {
                    Image(systemName: "clock.fill")
                        .font(.hayame(size: 14, weight: .bold))
                        .foregroundStyle(HayameTheme.brandBlue)
                        .frame(width: 18)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Delivery time")
                            .font(.hayame(size: 13, weight: .bold))
                            .foregroundStyle(HayameTheme.brandNavy)
                        Text("On \(Self.shortDateFormatter.string(from: startDate))")
                            .font(.hayame(size: 12, weight: .medium))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                    Spacer()
                    DatePicker("", selection: $deliveryTimeSelection, displayedComponents: .hourAndMinute)
                        .labelsHidden()
                        .datePickerStyle(.compact)
                        .tint(HayameTheme.brandBlue)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(HayameTheme.fieldBackground, in: RoundedRectangle(cornerRadius: 14, style: .continuous))

                BookingInputField(
                    title: "Contact phone",
                    systemImage: "phone.fill",
                    text: $deliveryDetails.contactPhone,
                    placeholder: "+233 24 123 4567",
                    keyboardType: .phonePad,
                    capitalization: .never
                )

                BookingInputField(
                    title: "Notes for the host (optional)",
                    systemImage: "text.bubble.fill",
                    text: $deliveryDetails.notes,
                    placeholder: "Gate code, landmark, anything helpful",
                    axis: .vertical
                )

                HStack(spacing: 6) {
                    Image(systemName: "info.circle.fill")
                        .font(.hayame(size: 12, weight: .bold))
                    Text(deliveryFee > 0 ? "Delivery adds \(Self.money(deliveryFee)) to your total." : "Delivery is free with this host.")
                        .font(.hayame(size: 12, weight: .semibold))
                }
                .foregroundStyle(HayameTheme.brandBlue)
            }
        }
    }

    private var tripAreaCard: some View {
        BookingCard {
            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 3) {
                    BookingSectionLabel(title: "Where will you drive?", systemImage: "map.fill")
                    Text("Used for pricing. Trips outside the listing region may carry a surcharge.")
                        .font(.hayame(size: 12, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                        .fixedSize(horizontal: false, vertical: true)
                }

                VStack(spacing: 14) {
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
                }

                BookingInputField(
                    title: "Destination (optional)",
                    systemImage: "flag.fill",
                    text: $address,
                    placeholder: "Area, landmark or event"
                )

                BookingRegionStatusChip(
                    isOutside: tripOutsideListingRegion,
                    surcharge: outsideAccraFeeValue,
                    listingRegion: car.region
                )
            }
        }
    }

    // Step 3 — review

    private var reviewStep: some View {
        stepScroll {
            stepHeading("Check the details", "This is what the host sees. Tap Edit to change anything.")
                .hayameAppear(index: 0)

            carHero
                .hayameAppear(index: 1)

            BookingCard {
                VStack(alignment: .leading, spacing: 14) {
                    BookingCardHeader(title: "Trip", actionTitle: "Edit") { moveTo(.tripDetails) }
                    BookingTimeline(
                        start: (Self.shortDateFormatter.string(from: startDate), handoffTimeLabel, handoffPlace),
                        end: (Self.shortDateFormatter.string(from: endDate), handoffTimeLabel, handoffPlace),
                        durationLabel: "\(nights) \(dayWord)"
                    )
                }
            }
            .hayameAppear(index: 2)

            BookingCard {
                VStack(alignment: .leading, spacing: 12) {
                    BookingCardHeader(title: "Handoff", actionTitle: "Edit") { moveTo(.location) }
                    BookingDetailLine(
                        systemImage: selectedTripMode == .delivery ? "shippingbox.fill" : "figure.walk",
                        title: selectedTripMode == .delivery ? "Delivery" : "Pickup",
                        value: selectedTripMode == .delivery ? handoffPlace : "\(car.city), \(car.region)"
                    )
                    if selectedTripMode == .delivery {
                        BookingDetailLine(systemImage: "clock.fill", title: "Delivery time", value: deliveryTimeLabel)
                        BookingDetailLine(
                            systemImage: "phone.fill",
                            title: "Contact",
                            value: deliveryDetails.contactPhone.trimmingCharacters(in: .whitespacesAndNewlines)
                        )
                        let notes = deliveryDetails.notes.trimmingCharacters(in: .whitespacesAndNewlines)
                        if !notes.isEmpty {
                            BookingDetailLine(systemImage: "text.bubble.fill", title: "Notes", value: notes)
                        }
                    }
                    BookingDetailLine(systemImage: "map.fill", title: "Driving in", value: "\(resolvedDestination), \(region)")
                }
            }
            .hayameAppear(index: 3)

            priceCard
                .hayameAppear(index: 4)

            BookingCard {
                VStack(alignment: .leading, spacing: 12) {
                    BookingSectionLabel(title: "Good to know")
                    BookingInfoRow(
                        systemImage: "checkmark.shield.fill",
                        tint: HayameTheme.success,
                        title: car.instantBook ? "Instant book" : "Host confirms first",
                        message: car.instantBook
                            ? "This trip is confirmed as soon as you pay."
                            : "You're refunded in full if \(hostFirstName) declines."
                    )
                    BookingInfoRow(
                        systemImage: "calendar.badge.clock",
                        tint: HayameTheme.brandBlue,
                        title: "\(car.cancellationPolicy.capitalized) cancellation",
                        message: "Refund tiers depend on how close to pickup you cancel."
                    )
                }
            }
            .hayameAppear(index: 5)
        }
    }

    private var hostFirstName: String {
        let name = car.hostName.trimmingCharacters(in: .whitespacesAndNewlines)
        return name.split(separator: " ").first.map(String.init) ?? "the host"
    }

    private var carHero: some View {
        VStack(alignment: .leading, spacing: 12) {
            NetworkOrFallbackImage(urlString: car.imageNames.first, targetSize: CGSize(width: 900, height: 520))
                .frame(height: 170)
                .frame(maxWidth: .infinity)
                .clipped()
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                .overlay(alignment: .bottomLeading) {
                    if car.instantBook {
                        Label("Instant book", systemImage: "bolt.fill")
                            .font(.hayame(size: 11, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 9)
                            .padding(.vertical, 5)
                            .background(.black.opacity(0.45), in: Capsule())
                            .padding(10)
                    }
                }
            VStack(alignment: .leading, spacing: 4) {
                Text(car.displayTitle)
                    .font(.hayame(size: 20, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                HStack(spacing: 6) {
                    Text("Hosted by \(car.hostName.isEmpty ? "Hayame host" : car.hostName)")
                    Circle().fill(HayameTheme.mutedText.opacity(0.5)).frame(width: 3, height: 3)
                    if car.reviewsCount > 0 {
                        Image(systemName: "star.fill")
                            .font(.hayame(size: 10, weight: .bold))
                            .foregroundStyle(HayameTheme.brandBlue)
                        Text(String(format: "%.1f (%d)", car.rating, car.reviewsCount))
                    } else {
                        Text("New listing")
                    }
                }
                .font(.hayame(size: 13, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .lineLimit(1)
            }
        }
    }

    private var priceCard: some View {
        BookingCard {
            VStack(alignment: .leading, spacing: 12) {
                BookingSectionLabel(title: "Price")

                Group {
                    BookingPriceRow(label: "\(Self.money(car.dailyPrice)) × \(nights) \(dayWord)", amount: subtotal, index: 0)
                    BookingPriceRow(label: "Service fee", amount: platformFee, index: 1)
                    BookingPriceRow(label: "Insurance", amount: insuranceFee, index: 2)
                    if selectedTripMode == .delivery {
                        BookingPriceRow(label: "Delivery", amount: deliveryFee, index: 3)
                    }
                    if tripOutsideListingRegion || outsideAccraSurcharge > 0 {
                        BookingPriceRow(label: "Outside region", amount: outsideAccraSurcharge, index: 4)
                    }
                }

                HStack(alignment: .center, spacing: 10) {
                    Image(systemName: "arrow.uturn.backward.circle.fill")
                        .font(.hayame(size: 16, weight: .bold))
                        .foregroundStyle(HayameTheme.success)
                    VStack(alignment: .leading, spacing: 1) {
                        Text("Refundable deposit")
                            .font(.hayame(size: 14, weight: .bold))
                            .foregroundStyle(HayameTheme.brandNavy)
                        Text("Returned after the trip")
                            .font(.hayame(size: 11, weight: .medium))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                    Spacer()
                    Text(Self.money(depositAmount))
                        .font(.hayame(size: 14, weight: .bold))
                        .foregroundStyle(HayameTheme.success)
                }
                .padding(12)
                .background(HayameTheme.success.opacity(0.1), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .hayameAppear(index: 6)

                Rectangle()
                    .fill(HayameTheme.cardStroke)
                    .frame(height: 1)

                HStack(alignment: .firstTextBaseline) {
                    Text("Total")
                        .font(.hayame(size: 16, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Spacer()
                    Text(Self.money(totalAmount))
                        .font(.hayame(size: 26, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .contentTransition(.numericText(value: Double(totalAmount)))
                }
            }
        }
    }

    // Step 4 — pay

    private var paymentStep: some View {
        stepScroll {
            stepHeading("Confirm and pay", "You'll finish on Paystack's secure page, then come straight back here.")
                .hayameAppear(index: 0)

            VStack(alignment: .leading, spacing: 8) {
                Text("You'll pay")
                    .font(.hayame(size: 13, weight: .bold))
                    .foregroundStyle(HayameTheme.mutedText)
                BookingRollingAmount(value: totalAmount)
                if depositAmount > 0 {
                    Label("Includes \(Self.money(depositAmount)) refundable deposit", systemImage: "arrow.uturn.backward.circle.fill")
                        .font(.hayame(size: 12, weight: .semibold))
                        .foregroundStyle(HayameTheme.success)
                }
                HStack(spacing: 8) {
                    BookingMiniTag(systemImage: "calendar", text: "\(nights) \(dayWord)")
                    BookingMiniTag(systemImage: selectedTripMode == .delivery ? "shippingbox.fill" : "figure.walk", text: selectedTripMode.label)
                    BookingMiniTag(systemImage: "mappin", text: city)
                }
                .padding(.top, 4)
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(HayameTheme.cardBackground, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
            .shadow(color: HayameTheme.cardShadow, radius: 14, x: 0, y: 6)
            .hayameAppear(index: 1)

            BookingCard {
                VStack(alignment: .leading, spacing: 12) {
                    BookingSectionLabel(title: "Pay with")
                    BookingPaymentMethodRow(title: "Mobile Money", subtitle: "MTN, Telecel and AirtelTigo", systemImage: "iphone.gen3.radiowaves.left.and.right")
                    BookingPaymentMethodRow(title: "Card", subtitle: "Visa and Mastercard", systemImage: "creditcard.fill")
                    BookingPaymentMethodRow(title: "Bank transfer", subtitle: "Shown on the secure page", systemImage: "building.columns.fill")
                    HStack(spacing: 6) {
                        Image(systemName: "lock.fill")
                            .font(.hayame(size: 11, weight: .bold))
                        Text("Secured by Paystack. Hayame never sees your card details.")
                            .font(.hayame(size: 12, weight: .medium))
                    }
                    .foregroundStyle(HayameTheme.mutedText)
                    .padding(.top, 2)
                }
            }
            .hayameAppear(index: 2)

            BookingCard {
                VStack(alignment: .leading, spacing: 14) {
                    BookingSectionLabel(title: "What happens next")
                    BookingNextSteps(steps: [
                        ("lock.fill", "Pay securely", "Your money is held until the trip goes ahead."),
                        (car.instantBook ? "bolt.fill" : "person.crop.circle.badge.checkmark",
                         car.instantBook ? "Instantly confirmed" : "\(hostFirstName.capitalized) confirms",
                         car.instantBook ? "No waiting on this listing." : "Usually within a few hours. Declines are refunded in full."),
                        ("key.fill", "Pick up your car", "\(Self.shortDateFormatter.string(from: startDate)) at \(handoffTimeLabel).")
                    ])
                }
            }
            .hayameAppear(index: 3)
        }
    }

    // MARK: Bottom bar

    private var bottomBar: some View {
        VStack(spacing: 10) {
            if let paymentMessage, !paymentMessage.isEmpty, currentStep != .tripDetails || datesAreFree {
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "exclamationmark.circle.fill")
                        .font(.hayame(size: 14, weight: .bold))
                    Text(paymentMessage)
                        .font(.hayame(size: 13, weight: .semibold))
                        .fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: 0)
                }
                .foregroundStyle(HayameTheme.danger)
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .background(HayameTheme.danger.opacity(0.1), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }

            HStack(spacing: 14) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(Self.money(barAmount))
                        .font(.hayame(size: 21, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .contentTransition(.numericText(value: Double(barAmount)))
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                    Text(barCaption)
                        .font(.hayame(size: 12, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                        .contentTransition(.opacity)
                        .lineLimit(1)
                }
                .coachMark("booking.total")

                Spacer(minLength: 8)

                Button(action: handlePrimaryAction) {
                    HStack(spacing: 8) {
                        if isProcessingPayment && currentStep == .payment {
                            ProgressView()
                                .tint(.white)
                                .controlSize(.small)
                        }
                        Text(primaryButtonTitle)
                            .contentTransition(.opacity)
                            .lineLimit(1)
                            .minimumScaleFactor(0.75)
                        if !isProcessingPayment {
                            Image(systemName: currentStep == .payment ? "lock.fill" : "arrow.right")
                                .font(.hayame(size: 14, weight: .bold))
                        }
                    }
                    .font(.hayame(size: 16, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 22)
                    .frame(height: 52)
                    .background(HayameTheme.brandBlue, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .contentShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .buttonStyle(HayamePressableStyle(scale: 0.96))
                .disabled(isProcessingPayment)
                .layoutPriority(1)
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 12)
        .padding(.bottom, 8)
        .background(HayameTheme.cardBackground.ignoresSafeArea(edges: .bottom))
        .overlay(alignment: .top) {
            Rectangle()
                .fill(HayameTheme.cardStroke)
                .frame(height: 1)
        }
        .modifier(BookingShakeEffect(animatableData: CGFloat(shakeCount)))
        .animation(HayameMotion.snappy, value: paymentMessage)
        .animation(HayameMotion.snappy, value: barAmount)
        .animation(HayameMotion.snappy, value: currentStep)
    }

    // MARK: Actions

    /// Snapshot of everything chosen so far, for the device-side draft.
    private func currentDraft() -> CheckoutDraft {
        CheckoutDraft(
            userID: appState.currentUser.id,
            carID: car.id,
            carTitle: car.displayTitle,
            carImageURL: car.imageNames.first,
            dailyPrice: car.dailyPrice,
            startDate: AppState.dateOnlyFormatter.string(from: startDate),
            endDate: AppState.dateOnlyFormatter.string(from: endDate),
            region: region,
            city: city,
            address: address,
            tripMode: tripMode,
            delivery: tripMode == .delivery ? deliveryDetailsPayload : BookingDeliveryDetails(),
            step: currentStep.rawValue,
            updatedAt: Date()
        )
    }

    /// Closing the sheet never throws work away: once the renter has gone past
    /// the dates step (or came back to a saved checkout) the choices are kept.
    private func persistDraftIfNeeded() {
        guard !didCompleteCheckout, appState.isAuthenticated else { return }
        let progressed = currentStep != .tripDetails || resumedDraft != nil || selectedQuickDuration != nil
        guard progressed else { return }
        // A server-held checkout for this car already carries these choices.
        if let held = appState.pendingCheckout, held.carID == car.id { return }
        appState.saveCheckoutDraft(currentDraft())
    }

    private func chooseTripMode(_ mode: BookingTripMode) {
        guard tripMode != mode else { return }
        HayameHaptics.select()
        withAnimation(HayameMotion.settle) {
            tripMode = mode
            paymentMessage = nil
        }
        if mode == .delivery, deliveryDetails.contactPhone.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            deliveryDetails.contactPhone = appState.currentUser.phone
        }
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

        guard let nextStart = nextBookableStartDate(from: today, duration: car.minimumTripDays, blockedDates: normalizedBlockedDates) else {
            paymentMessage = "No upcoming available dates in the next 6 months."
            return
        }

        let normalizedStart = bookingDay(startDate)
        let adjustedStart = isBookableStartDate(normalizedStart, blockedDates: normalizedBlockedDates, minimumNights: car.minimumTripDays) ? normalizedStart : nextStart
        withAnimation(HayameMotion.snappy) {
            startDate = adjustedStart
            if let adjustedEnd = preferredBookingEndDate(
                currentEnd: endDate,
                startDate: adjustedStart,
                blockedDates: normalizedBlockedDates,
                minimumNights: car.minimumTripDays
            ) {
                endDate = adjustedEnd
            }
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
            guard isBookableStartDate(normalized, blockedDates: blockedDates, minimumNights: car.minimumTripDays) else { return }
            startDate = normalized
            if let adjustedEnd = preferredBookingEndDate(
                currentEnd: endDate,
                startDate: normalized,
                blockedDates: blockedDates,
                minimumNights: car.minimumTripDays
            ) {
                endDate = adjustedEnd
            }
        case .end:
            let normalized = bookingDay(selectedDate)
            guard isBookableEndDate(normalized, startDate: startDate, blockedDates: blockedDates, minimumNights: car.minimumTripDays) else { return }
            endDate = normalized
        }

        selectedQuickDuration = nil
        paymentMessage = nil
    }

    private func goBack() {
        guard let previousStep = currentStep.previous else { return }
        isMovingForward = false
        paymentMessage = nil
        HayameHaptics.select()
        withAnimation(HayameMotion.settle) {
            currentStep = previousStep
        }
    }

    private func moveTo(_ step: BookingCheckoutStep) {
        isMovingForward = step.rawValue > currentStep.rawValue
        paymentMessage = nil
        HayameHaptics.select()
        withAnimation(HayameMotion.settle) {
            currentStep = step
        }
    }

    /// Shows why the step can't continue and shakes the bar.
    private func fail(_ message: String) {
        HayameHaptics.error()
        withAnimation(HayameMotion.snappy) {
            paymentMessage = message
        }
        withAnimation(.linear(duration: 0.42)) {
            shakeCount += 1
        }
    }

    private func handlePrimaryAction() {
        switch currentStep {
        case .tripDetails:
            guard endDate > startDate else {
                fail("Choose a return date after your pick-up date.")
                return
            }
            guard datesAreFree || isLoadingAvailability else {
                fail("Some of these days are taken. Pick other dates.")
                return
            }
            moveTo(.location)

        case .location:
            if car.deliveryAvailable, tripMode == nil {
                fail("Choose pickup or delivery to continue.")
                return
            }
            let normalizedRegion = region.trimmingCharacters(in: .whitespacesAndNewlines)
            let normalizedCity = city.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !normalizedRegion.isEmpty else {
                fail("Select your trip region to continue.")
                return
            }
            guard !normalizedCity.isEmpty else {
                fail("Select your trip city to continue.")
                return
            }
            if selectedTripMode == .delivery {
                let trimmedAddress = deliveryDetails.address.trimmingCharacters(in: .whitespacesAndNewlines)
                let trimmedPhone = deliveryDetails.contactPhone.trimmingCharacters(in: .whitespacesAndNewlines)
                guard trimmedAddress.count >= 6 else {
                    fail("Enter the exact delivery address.")
                    return
                }
                guard trimmedPhone.bookingPhoneDigitsCount >= 7 else {
                    fail("Enter a valid contact phone number.")
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
                tripMode: selectedTripMode,
                region: region,
                city: city,
                address: address,
                deliveryDetails: selectedTripMode == .delivery ? deliveryDetailsPayload : BookingDeliveryDetails(),
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
                presentSuccess(bookingID: checkout.bookingID)
                return
            } catch {
                if let browserError = error as? InAppBrowserAuthenticatorError,
                   browserError.shouldAttemptPaymentVerificationFallback {
                    do {
                        _ = try await appState.completeBookingPayment(checkout: checkout)
                        presentSuccess(bookingID: checkout.bookingID)
                        return
                    } catch let verificationError {
                        throw verificationError
                    }
                }
                throw error
            }
        } catch {
            let message = AppState.userFacingMessage(error, fallback: "Something went wrong. Please try again.")
            let base = message.isEmpty ? "Unable to complete payment." : message
            fail("\(base) Your selections are saved, so you can finish anytime from Home or Trips.")
            appState.paymentFlowNotice = base
            appState.paymentFlowNoticeIsError = true
            // The hold (if one was created) now shows as a resumable checkout on
            // Home and Trips; keep a local copy too in case the hold never happened.
            appState.saveCheckoutDraft(currentDraft())
            Task { await appState.refreshPendingCheckout(force: true) }
        }
    }

    /// Swaps the checkout for the celebration and "waiting for host" stage.
    /// The sheet stays up until the renter chooses to view the trip.
    @MainActor
    private func presentSuccess(bookingID: String) {
        didCompleteCheckout = true
        HayameHaptics.success()
        withAnimation(HayameMotion.settle) {
            successBookingID = bookingID
        }
    }
}

// MARK: - Pieces

private extension String {
    var bookingPhoneDigitsCount: Int {
        filter(\.isNumber).count
    }
}

/// Four capsules; finished steps are full, the current one fills as you arrive.
private struct BookingSegmentedProgress: View {
    let currentIndex: Int
    let count: Int

    @State private var arrived = false

    var body: some View {
        HStack(spacing: 6) {
            ForEach(0..<count, id: \.self) { index in
                GeometryReader { proxy in
                    ZStack(alignment: .leading) {
                        Capsule().fill(HayameTheme.fieldBackground)
                        Capsule()
                            .fill(HayameTheme.brandBlue)
                            .frame(width: fill(for: index) * proxy.size.width)
                    }
                }
                .frame(height: 4)
            }
        }
        .animation(HayameMotion.gentle, value: currentIndex)
        .animation(HayameMotion.gentle, value: arrived)
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { arrived = true }
        }
        .accessibilityElement()
        .accessibilityLabel("Step \(currentIndex + 1) of \(count)")
    }

    private func fill(for index: Int) -> CGFloat {
        if index < currentIndex { return 1 }
        if index == currentIndex { return arrived ? 1 : 0.15 }
        return 0
    }
}

/// The car you are booking, always in view.
private struct BookingCarStrip: View {
    let car: Car

    var body: some View {
        HStack(spacing: 12) {
            NetworkOrFallbackImage(urlString: car.imageNames.first, targetSize: CGSize(width: 140, height: 110))
                .frame(width: 58, height: 46)
                .clipped()
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            VStack(alignment: .leading, spacing: 3) {
                Text(car.displayTitle)
                    .font(.hayame(size: 15, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .lineLimit(1)
                Text("\(BookingSheet.money(car.dailyPrice))/day · \(car.city)")
                    .font(.hayame(size: 12, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
                    .lineLimit(1)
            }
            Spacer(minLength: 8)
            if car.reviewsCount > 0 {
                HStack(spacing: 3) {
                    Image(systemName: "star.fill")
                        .font(.hayame(size: 10, weight: .bold))
                        .foregroundStyle(HayameTheme.brandBlue)
                    Text(String(format: "%.1f", car.rating))
                        .font(.hayame(size: 12, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                }
            } else if car.instantBook {
                Image(systemName: "bolt.fill")
                    .font(.hayame(size: 12, weight: .bold))
                    .foregroundStyle(HayameTheme.warning)
            }
        }
        .padding(10)
        .background(HayameTheme.fieldBackground, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

/// White card with the shared border used by every step.
private struct BookingCard<Content: View>: View {
    @ViewBuilder let content: () -> Content

    var body: some View {
        content()
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(HayameTheme.cardBackground, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
    }
}

private struct BookingSectionLabel: View {
    let title: String
    var systemImage: String? = nil

    var body: some View {
        HStack(spacing: 7) {
            if let systemImage {
                Image(systemName: systemImage)
                    .font(.hayame(size: 13, weight: .bold))
                    .foregroundStyle(HayameTheme.brandBlue)
            }
            Text(title)
                .font(.hayame(size: 16, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
        }
    }
}

private struct BookingCardHeader: View {
    let title: String
    let actionTitle: String
    let action: () -> Void

    var body: some View {
        HStack {
            BookingSectionLabel(title: title)
            Spacer()
            Button(action: action) {
                HStack(spacing: 4) {
                    Image(systemName: "pencil")
                        .font(.hayame(size: 11, weight: .bold))
                    Text(actionTitle)
                        .font(.hayame(size: 13, weight: .bold))
                }
                .foregroundStyle(HayameTheme.brandBlue)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(HayameTheme.brandBlue.opacity(0.1), in: Capsule())
            }
            .buttonStyle(HayamePressableStyle(scale: 0.92))
        }
    }
}

private struct BookingChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.hayame(size: 14, weight: .bold))
                .foregroundStyle(isSelected ? .white : HayameTheme.brandNavy)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(isSelected ? HayameTheme.brandBlue : HayameTheme.chipBackground, in: Capsule())
                .overlay(Capsule().strokeBorder(isSelected ? Color.clear : HayameTheme.controlStroke, lineWidth: 1))
                .scaleEffect(isSelected ? 1.04 : 1)
        }
        .buttonStyle(HayamePressableStyle(scale: 0.94, haptic: false))
        .animation(HayameMotion.bouncy, value: isSelected)
    }
}

/// Pickup or delivery. The chosen tile lifts, gains a blue ring and a check.
private struct BookingHandoffTile: View {
    let systemImage: String
    let title: String
    let detail: String
    let price: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .top) {
                    Image(systemName: systemImage)
                        .font(.hayame(size: 18, weight: .bold))
                        .foregroundStyle(isSelected ? .white : HayameTheme.brandBlue)
                        .frame(width: 42, height: 42)
                        .background(isSelected ? HayameTheme.brandBlue : HayameTheme.brandBlue.opacity(0.12), in: RoundedRectangle(cornerRadius: 13, style: .continuous))
                    Spacer()
                    ZStack {
                        Circle()
                            .strokeBorder(isSelected ? HayameTheme.brandBlue : HayameTheme.controlStroke, lineWidth: 2)
                        if isSelected {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.hayame(size: 22, weight: .bold))
                                .foregroundStyle(HayameTheme.brandBlue)
                                .transition(.scale(scale: 0.3).combined(with: .opacity))
                        }
                    }
                    .frame(width: 22, height: 22)
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.hayame(size: 16, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text(detail)
                        .font(.hayame(size: 12, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Text(price)
                    .font(.hayame(size: 13, weight: .bold))
                    .foregroundStyle(price == "Free" ? HayameTheme.success : HayameTheme.brandBlue)
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                isSelected ? HayameTheme.brandBlue.opacity(0.08) : HayameTheme.cardBackground,
                in: RoundedRectangle(cornerRadius: 20, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .strokeBorder(isSelected ? HayameTheme.brandBlue : HayameTheme.cardStroke, lineWidth: isSelected ? 2 : 1)
            )
            .scaleEffect(isSelected ? 1 : 0.98)
            .contentShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        }
        .buttonStyle(HayamePressableStyle(scale: 0.96, haptic: false))
        .animation(HayameMotion.bouncy, value: isSelected)
        .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : .isButton)
    }
}

private struct BookingInputField: View {
    let title: String
    let systemImage: String
    @Binding var text: String
    let placeholder: String
    var keyboardType: UIKeyboardType = .default
    var capitalization: TextInputAutocapitalization = .words
    var axis: Axis = .horizontal

    @FocusState private var focused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(title)
                .font(.hayame(size: 13, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
            HStack(alignment: axis == .vertical ? .top : .center, spacing: 10) {
                Image(systemName: systemImage)
                    .font(.hayame(size: 14, weight: .bold))
                    .foregroundStyle(focused ? HayameTheme.brandBlue : HayameTheme.mutedText)
                    .frame(width: 18)
                    .padding(.top, axis == .vertical ? 2 : 0)
                TextField(placeholder, text: $text, axis: axis)
                    .lineLimit(axis == .vertical ? 2...5 : 1...1)
                    .font(.hayame(size: 15, weight: .medium))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .keyboardType(keyboardType)
                    .textInputAutocapitalization(capitalization)
                    .autocorrectionDisabled()
                    .focused($focused)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            .background(HayameTheme.fieldBackground, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(focused ? HayameTheme.brandBlue : HayameTheme.cardStroke, lineWidth: focused ? 1.5 : 1)
            )
            .animation(HayameMotion.snappy, value: focused)
        }
    }
}

private struct BookingRegionStatusChip: View {
    let isOutside: Bool
    let surcharge: Int
    let listingRegion: String

    var body: some View {
        let tint = isOutside ? HayameTheme.warning : HayameTheme.success
        HStack(spacing: 8) {
            Image(systemName: isOutside ? "exclamationmark.triangle.fill" : "checkmark.seal.fill")
                .font(.hayame(size: 13, weight: .bold))
                .contentTransition(.symbolEffect(.replace))
            Text(isOutside
                 ? (surcharge > 0 ? "Outside \(listingRegion): +\(BookingSheet.money(surcharge))" : "Outside \(listingRegion)")
                 : "Within \(listingRegion), no surcharge")
                .font(.hayame(size: 13, weight: .semibold))
                .contentTransition(.opacity)
            Spacer(minLength: 0)
        }
        .foregroundStyle(tint)
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(tint.opacity(0.1), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .animation(HayameMotion.snappy, value: isOutside)
    }
}

private struct BookingInfoRow: View {
    let systemImage: String
    let tint: Color
    let title: String
    let message: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: systemImage)
                .font(.hayame(size: 16, weight: .bold))
                .foregroundStyle(tint)
                .frame(width: 36, height: 36)
                .background(tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.hayame(size: 14, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Text(message)
                    .font(.hayame(size: 12, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
    }
}

private struct BookingDetailLine: View {
    let systemImage: String
    let title: String
    let value: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: systemImage)
                .font(.hayame(size: 13, weight: .bold))
                .foregroundStyle(HayameTheme.brandBlue)
                .frame(width: 18)
                .padding(.top, 1)
            Text(title)
                .font(.hayame(size: 13, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
            Spacer(minLength: 12)
            Text(value.isEmpty ? "Not set" : value)
                .font(.hayame(size: 13, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
                .multilineTextAlignment(.trailing)
        }
    }
}

/// Pick-up and return as two connected stops with the trip length between.
private struct BookingTimeline: View {
    let start: (date: String, time: String, place: String)
    let end: (date: String, time: String, place: String)
    let durationLabel: String

    @State private var drawn = false

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            VStack(spacing: 0) {
                Circle()
                    .fill(HayameTheme.brandBlue)
                    .frame(width: 12, height: 12)
                    .padding(.top, 4)
                GeometryReader { proxy in
                    Capsule()
                        .fill(HayameTheme.brandBlue.opacity(0.35))
                        .frame(width: 2, height: drawn ? proxy.size.height : 0)
                        .frame(maxWidth: .infinity)
                }
                Circle()
                    .strokeBorder(HayameTheme.brandBlue, lineWidth: 2.5)
                    .frame(width: 12, height: 12)
                    .padding(.bottom, 26)
            }
            .frame(width: 12)

            VStack(alignment: .leading, spacing: 14) {
                stop(title: "Pick-up", value: start)
                Text(durationLabel)
                    .font(.hayame(size: 11, weight: .bold))
                    .foregroundStyle(HayameTheme.brandBlue)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(HayameTheme.brandBlue.opacity(0.1), in: Capsule())
                stop(title: "Return", value: end)
            }
        }
        .onAppear {
            withAnimation(HayameMotion.respecting(.easeOut(duration: 0.6)).delay(0.2)) { drawn = true }
        }
    }

    private func stop(title: String, value: (date: String, time: String, place: String)) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title.uppercased())
                .font(.hayame(size: 11, weight: .bold))
                .tracking(0.5)
                .foregroundStyle(HayameTheme.mutedText)
            Text("\(value.date) · \(value.time)")
                .font(.hayame(size: 16, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
            Text(value.place)
                .font(.hayame(size: 13, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .lineLimit(2)
        }
    }
}

private struct BookingPriceRow: View {
    let label: String
    let amount: Int
    let index: Int

    var body: some View {
        HStack {
            Text(label)
                .font(.hayame(size: 14, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
            Spacer()
            Text(BookingSheet.money(amount))
                .font(.hayame(size: 14, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
                .contentTransition(.numericText(value: Double(amount)))
        }
        .hayameAppear(index: index + 1, step: 0.05)
    }
}

/// The total counts up from zero the first time it appears.
private struct BookingRollingAmount: View {
    let value: Int
    @State private var shown = 0

    var body: some View {
        Text(BookingSheet.money(shown))
            .font(.hayame(size: 40, weight: .bold))
            .foregroundStyle(HayameTheme.brandNavy)
            .contentTransition(.numericText(value: Double(shown)))
            .lineLimit(1)
            .minimumScaleFactor(0.7)
            .onAppear {
                withAnimation(HayameMotion.respecting(.easeOut(duration: 0.8)).delay(0.15)) { shown = value }
            }
            .onChange(of: value) { _, newValue in
                withAnimation(HayameMotion.snappy) { shown = newValue }
            }
    }
}

private struct BookingMiniTag: View {
    let systemImage: String
    let text: String

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: systemImage)
                .font(.hayame(size: 10, weight: .bold))
            Text(text)
                .font(.hayame(size: 12, weight: .semibold))
                .lineLimit(1)
        }
        .foregroundStyle(HayameTheme.brandNavy)
        .padding(.horizontal, 9)
        .padding(.vertical, 5)
        .background(HayameTheme.fieldBackground, in: Capsule())
    }
}

private struct BookingPaymentMethodRow: View {
    let title: String
    let subtitle: String
    let systemImage: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: systemImage)
                .font(.hayame(size: 15, weight: .bold))
                .foregroundStyle(HayameTheme.brandBlue)
                .frame(width: 38, height: 38)
                .background(HayameTheme.brandBlue.opacity(0.12), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.hayame(size: 15, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Text(subtitle)
                    .font(.hayame(size: 12, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
            }
            Spacer()
            Image(systemName: "checkmark")
                .font(.hayame(size: 12, weight: .bold))
                .foregroundStyle(HayameTheme.success)
        }
    }
}

/// Numbered steps with a line between, appearing one after another.
private struct BookingNextSteps: View {
    let steps: [(icon: String, title: String, message: String)]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                HStack(alignment: .top, spacing: 12) {
                    VStack(spacing: 0) {
                        Image(systemName: step.icon)
                            .font(.hayame(size: 13, weight: .bold))
                            .foregroundStyle(index == 0 ? .white : HayameTheme.brandBlue)
                            .frame(width: 34, height: 34)
                            .background(index == 0 ? HayameTheme.brandBlue : HayameTheme.brandBlue.opacity(0.12), in: Circle())
                        if index < steps.count - 1 {
                            Rectangle()
                                .fill(HayameTheme.brandBlue.opacity(0.25))
                                .frame(width: 2, height: 22)
                        }
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text(step.title)
                            .font(.hayame(size: 14, weight: .bold))
                            .foregroundStyle(HayameTheme.brandNavy)
                        Text(step.message)
                            .font(.hayame(size: 12, weight: .medium))
                            .foregroundStyle(HayameTheme.mutedText)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.top, 2)
                    Spacer(minLength: 0)
                }
                .hayameAppear(index: index + 1, step: 0.09)
            }
        }
    }
}

/// Side-to-side nudge for a failed check.
private struct BookingShakeEffect: GeometryEffect {
    var animatableData: CGFloat

    func effectValue(size: CGSize) -> ProjectionTransform {
        let offset = 7 * sin(animatableData * .pi * 4)
        return ProjectionTransform(CGAffineTransform(translationX: offset, y: 0))
    }
}

// MARK: - Payment processing

/// Covers the checkout while Paystack is opened and the payment is verified:
/// a pulsing lock and three dots that step along.
struct PaymentProcessingOverlay: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var pulse = false
    @State private var dot = 0
    @State private var appeared = false

    var body: some View {
        ZStack {
            Color.black.opacity(0.35).ignoresSafeArea()

            VStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(HayameTheme.brandBlue.opacity(0.16))
                        .frame(width: 98, height: 98)
                        .scaleEffect(pulse ? 1.12 : 0.88)
                        .opacity(pulse ? 0.5 : 1)
                    Circle()
                        .fill(HayameTheme.brandBlue)
                        .frame(width: 64, height: 64)
                    Image(systemName: "lock.fill")
                        .font(.hayame(size: 24, weight: .bold))
                        .foregroundStyle(.white)
                }

                Text("Confirming your payment")
                    .font(.hayame(size: 18, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Text("Keep the app open. This only takes a few seconds.")
                    .font(.hayame(size: 13, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
                    .multilineTextAlignment(.center)

                HStack(spacing: 7) {
                    ForEach(0..<3, id: \.self) { index in
                        Circle()
                            .fill(HayameTheme.brandBlue)
                            .frame(width: 7, height: 7)
                            .opacity(dot == index ? 1 : 0.28)
                            .scaleEffect(dot == index ? 1.25 : 1)
                    }
                }
                .padding(.top, 2)
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 26)
            .frame(maxWidth: 300)
            .background(HayameTheme.cardBackground, in: RoundedRectangle(cornerRadius: 26, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 26, style: .continuous).strokeBorder(HayameTheme.cardStroke, lineWidth: 1))
            .shadow(color: .black.opacity(0.2), radius: 24, x: 0, y: 12)
            .scaleEffect(appeared ? 1 : 0.9)
            .opacity(appeared ? 1 : 0)
        }
        .onAppear {
            withAnimation(HayameMotion.bouncy) { appeared = true }
            guard !reduceMotion else { return }
            withAnimation(.easeInOut(duration: 1.1).repeatForever(autoreverses: true)) { pulse = true }
        }
        .task {
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 380_000_000)
                withAnimation(HayameMotion.snappy) { dot = (dot + 1) % 3 }
            }
        }
    }
}

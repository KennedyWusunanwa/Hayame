import SwiftUI

// MARK: - Resumable checkout
//
// A renter who starts paying and drops out (closed the Paystack sheet, card
// declined, app killed, MoMo prompt ignored) keeps their work: the server holds
// the booking row with every option they chose, and this device keeps a draft
// of anything they picked before paying. These views surface that as a
// "Finish your booking" card on Home and Trips, a strip on the listing, and a
// resume sheet that re-checks every condition (car still bookable, dates still
// free, price unchanged) before Paystack is opened again.

// MARK: - Card (Home / Trips)

struct ResumeCheckoutCard: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.colorScheme) private var colorScheme

    let resumable: ResumableCheckout
    var index: Int = 0
    let onResume: () -> Void

    @State private var showAbandonConfirm = false
    @State private var isAbandoning = false
    @State private var shine = false

    private var held: PendingCheckout? { resumable.heldCheckout }

    private var totalText: String? {
        if let held { return "GHS \(held.pricing.total)" }
        if let draft = resumable.draft {
            let start = AppState.dateOnlyFormatter.date(from: draft.startDate) ?? Date()
            let end = AppState.dateOnlyFormatter.date(from: draft.endDate) ?? start
            let nights = max(1, Calendar.current.dateComponents([.day], from: start, to: end).day ?? 1)
            return "GHS \(draft.dailyPrice * nights)+"
        }
        return nil
    }

    private var datesText: String {
        switch resumable {
        case .held(let checkout):
            return checkoutDateRangeLabel(start: checkout.startDate, end: checkout.endDate)
        case .draft(let draft):
            let start = AppState.dateOnlyFormatter.date(from: draft.startDate) ?? Date()
            let end = AppState.dateOnlyFormatter.date(from: draft.endDate) ?? start
            return checkoutDateRangeLabel(start: start, end: end)
        }
    }

    private var nightsText: String {
        let nights: Int
        switch resumable {
        case .held(let checkout):
            nights = checkout.nights
        case .draft(let draft):
            let start = AppState.dateOnlyFormatter.date(from: draft.startDate) ?? Date()
            let end = AppState.dateOnlyFormatter.date(from: draft.endDate) ?? start
            nights = max(1, Calendar.current.dateComponents([.day], from: start, to: end).day ?? 1)
        }
        return "\(nights) day\(nights == 1 ? "" : "s") • \(resumable.tripMode.label)"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .center, spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(
                            colorScheme == .dark
                                ? AnyShapeStyle(HayameTheme.brandBlue.opacity(0.16))
                                : AnyShapeStyle(LinearGradient(
                                    colors: [HayameTheme.brandBlue, HayameTheme.primaryButtonEnd],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ))
                        )
                    Image(systemName: held == nil ? "bookmark.fill" : "cart.badge.clock")
                        .font(.hayame(size: 15, weight: .bold))
                        .foregroundStyle(colorScheme == .dark ? HayameTheme.brandBlue : .white)
                }
                .frame(width: 36, height: 36)
                .shadow(color: colorScheme == .dark ? .clear : HayameTheme.brandBlue.opacity(0.3), radius: 8, x: 0, y: 4)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Finish your booking")
                        .font(.hayame(size: 15, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text(held == nil ? "Your selections are saved on this phone." : "Everything you chose is saved. Pick up where you left off.")
                        .font(.hayame(size: 12, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                        .lineLimit(2)
                }

                Spacer(minLength: 0)

                CheckoutStatusChip(resumable: resumable)
            }

            HStack(spacing: 12) {
                NetworkOrFallbackImage(urlString: resumable.carImageURL, targetSize: CGSize(width: 200, height: 150))
                    .frame(width: 92, height: 70)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

                VStack(alignment: .leading, spacing: 4) {
                    Text(resumable.carTitle)
                        .font(.hayame(size: 16, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .lineLimit(1)
                    Text(datesText)
                        .font(.hayame(size: 13, weight: .semibold))
                        .foregroundStyle(HayameTheme.brandBlue)
                    Text(nightsText)
                        .font(.hayame(size: 12, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                }

                Spacer(minLength: 0)

                if let totalText {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(held == nil ? "From" : "Total")
                            .font(.hayame(size: 10, weight: .bold))
                            .foregroundStyle(HayameTheme.mutedText)
                        Text(totalText)
                            .font(.hayame(size: 16, weight: .bold))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                    }
                }
            }

            HStack(spacing: 10) {
                Button {
                    HayameHaptics.tap()
                    onResume()
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "arrow.right.circle.fill")
                        Text(held == nil ? "Continue" : "Resume")
                    }
                    .font(.hayame(size: 15, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 13)
                    .background(HayameTheme.brandBlue, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .buttonStyle(HayamePressableStyle(scale: 0.97, haptic: false))
                .shadow(color: HayameTheme.brandBlue.opacity(0.22), radius: 10, x: 0, y: 6)

                Button {
                    showAbandonConfirm = true
                } label: {
                    Group {
                        if isAbandoning {
                            ProgressView().tint(HayameTheme.mutedText)
                        } else {
                            Text("Abandon")
                        }
                    }
                    .font(.hayame(size: 15, weight: .semibold))
                    .foregroundStyle(HayameTheme.mutedText)
                    .frame(minWidth: 96)
                    .padding(.vertical, 13)
                    .background(HayameTheme.fieldBackground, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .buttonStyle(HayamePressableStyle(scale: 0.97))
                .disabled(isAbandoning)
            }
        }
        .padding(16)
        .background(HayameTheme.cardBackground, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .strokeBorder(
                    LinearGradient(
                        colors: [HayameTheme.brandBlue.opacity(0.55), HayameTheme.cardStroke, HayameTheme.brandBlue.opacity(0.25)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1.2
                )
        }
        .overlay {
            // A soft light sweep when the card first appears, so it reads as "new".
            GeometryReader { geometry in
                LinearGradient(
                    colors: [.clear, .white.opacity(colorScheme == .dark ? 0.08 : 0.32), .clear],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .frame(width: geometry.size.width * 0.45)
                .rotationEffect(.degrees(16))
                .offset(x: shine ? geometry.size.width * 1.3 : -geometry.size.width * 0.6)
                .allowsHitTesting(false)
            }
            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        }
        .shadow(color: HayameTheme.brandBlue.opacity(colorScheme == .dark ? 0.16 : 0.10), radius: 18, x: 0, y: 10)
        .hayameAppear(index: index)
        .onAppear {
            guard !HayameMotion.reduceMotion else { return }
            withAnimation(.easeInOut(duration: 1.1).delay(0.35)) { shine = true }
        }
        .confirmationDialog(
            "Abandon this booking?",
            isPresented: $showAbandonConfirm,
            titleVisibility: .visible
        ) {
            Button("Abandon booking", role: .destructive) {
                isAbandoning = true
                Task {
                    _ = await appState.abandonResumableCheckout(resumable)
                    isAbandoning = false
                }
            }
            Button("Keep it", role: .cancel) {}
        } message: {
            Text(held == nil
                 ? "Your saved selections for \(resumable.carTitle) will be cleared."
                 : "The dates held for you will be released and the saved checkout cleared.")
        }
    }
}

/// Small pill on the card: live countdown while the hold is active, otherwise
/// what state the saved checkout is in.
private struct CheckoutStatusChip: View {
    let resumable: ResumableCheckout

    var body: some View {
        switch resumable {
        case .held(let checkout):
            if let expiry = checkout.holdExpiresAt, checkout.state == .held {
                TimelineView(.periodic(from: .now, by: 1)) { context in
                    let remaining = max(0, Int(expiry.timeIntervalSince(context.date).rounded(.down)))
                    if remaining > 0 {
                        HayameStatusPill(
                            text: "Held \(formatCountdown(remaining))",
                            tone: remaining < 120 ? .warning : .info,
                            isLive: true,
                            systemImage: "timer"
                        )
                    } else {
                        HayameStatusPill(text: "Hold ended", tone: .neutral, systemImage: "clock.arrow.circlepath")
                    }
                }
            } else {
                HayameStatusPill(text: "Saved", tone: .neutral, systemImage: "clock.arrow.circlepath")
            }
        case .draft:
            HayameStatusPill(text: "Draft", tone: .neutral, systemImage: "bookmark")
        }
    }
}

// MARK: - Strip (listing)

/// Compact reminder above the booking bar on the listing the checkout is for.
struct ResumeCheckoutStrip: View {
    let resumable: ResumableCheckout
    let onResume: () -> Void

    var body: some View {
        Button(action: onResume) {
            HStack(spacing: 10) {
                Image(systemName: resumable.heldCheckout == nil ? "bookmark.fill" : "cart.badge.clock")
                    .font(.hayame(size: 14, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 30, height: 30)
                    .background(HayameTheme.brandBlue, in: RoundedRectangle(cornerRadius: 10, style: .continuous))

                VStack(alignment: .leading, spacing: 1) {
                    Text("You have an unfinished booking for this car")
                        .font(.hayame(size: 13, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .lineLimit(1)
                    Text(stripDetail)
                        .font(.hayame(size: 12, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                        .lineLimit(1)
                }

                Spacer(minLength: 6)

                Text("Resume")
                    .font(.hayame(size: 13, weight: .bold))
                    .foregroundStyle(HayameTheme.brandBlue)
                Image(systemName: "chevron.right")
                    .font(.hayame(size: 12, weight: .bold))
                    .foregroundStyle(HayameTheme.brandBlue)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(HayameTheme.brandLight, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(HayameTheme.brandBlue.opacity(0.22), lineWidth: 1)
            )
        }
        .buttonStyle(HayamePressableStyle(scale: 0.98))
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }

    private var stripDetail: String {
        switch resumable {
        case .held(let checkout):
            return "\(checkoutDateRangeLabel(start: checkout.startDate, end: checkout.endDate)) • GHS \(checkout.pricing.total)"
        case .draft(let draft):
            let start = AppState.dateOnlyFormatter.date(from: draft.startDate) ?? Date()
            let end = AppState.dateOnlyFormatter.date(from: draft.endDate) ?? start
            return "\(checkoutDateRangeLabel(start: start, end: end)) • draft saved"
        }
    }
}

// MARK: - Presenter

/// Owns the sheets a "Resume" tap can open: the server-held checkout gets the
/// verification sheet; a local draft opens the checkout sheet pre-filled.
struct ResumeCheckoutPresenter: ViewModifier {
    @EnvironmentObject private var appState: AppState
    @Binding var target: ResumableCheckout?

    @State private var heldTarget: PendingCheckout?
    @State private var draftTarget: DraftResumeTarget?

    func body(content: Content) -> some View {
        content
            .onChange(of: target) { _, newValue in
                guard let newValue else { return }
                open(newValue)
                target = nil
            }
            .sheet(item: $heldTarget) { checkout in
                CheckoutResumeSheet(initial: checkout)
                    .environmentObject(appState)
            }
            .sheet(item: $draftTarget) { item in
                BookingSheet(car: item.car, draft: item.draft)
                    .environmentObject(appState)
            }
    }

    private func open(_ resumable: ResumableCheckout) {
        switch resumable {
        case .held(let checkout):
            heldTarget = checkout
        case .draft(let draft):
            Task { @MainActor in
                if appState.cars.first(where: { $0.id == draft.carID }) == nil {
                    await appState.refreshCarDetail(carID: draft.carID)
                }
                guard let car = appState.cars.first(where: { $0.id == draft.carID }) else {
                    appState.syncErrorMessage = "That listing is no longer available."
                    appState.clearCheckoutDraft()
                    return
                }
                draftTarget = DraftResumeTarget(car: car, draft: draft)
            }
        }
    }
}

private struct DraftResumeTarget: Identifiable {
    let car: Car
    let draft: CheckoutDraft
    var id: String { "\(car.id)-\(draft.updatedAt.timeIntervalSince1970)" }
}

extension View {
    func resumeCheckoutPresenter(target: Binding<ResumableCheckout?>) -> some View {
        modifier(ResumeCheckoutPresenter(target: target))
    }
}

// MARK: - Resume sheet

/// Re-verifies a held checkout with the server, then offers to pay, edit the
/// details, or abandon. Every condition is checked again before Paystack opens.
struct CheckoutResumeSheet: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    let initial: PendingCheckout

    private enum Phase: Equatable {
        case verifying
        case ready(PendingCheckout)
        case blocked(PendingCheckout)
        case failed(String)
    }

    @State private var phase: Phase = .verifying
    @State private var checksCompleted = 0
    @State private var failedCheckIndex: Int?
    @State private var isPaying = false
    @State private var paymentMessage: String?
    @State private var editTarget: DraftResumeTarget?
    @State private var showAbandonConfirm = false
    @State private var isAbandoning = false
    @State private var successBookingID: String?
    @State private var didFinish = false

    private let checkTitles = ["Listing still available", "Dates still free", "Price confirmed"]

    private var checkout: PendingCheckout {
        switch phase {
        case .ready(let value), .blocked(let value): return value
        case .verifying, .failed: return initial
        }
    }

    private var resolvedCar: Car {
        appState.cars.first(where: { $0.id == checkout.carID }) ?? checkout.placeholderCar()
    }

    var body: some View {
        NavigationStack {
            ZStack {
                HayameTheme.pageBackground.ignoresSafeArea()

                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 16) {
                        verificationCard

                        if case .ready = phase {
                            summaryCards
                                .transition(.move(edge: .bottom).combined(with: .opacity))
                        } else if case .blocked = phase {
                            listingCard
                                .opacity(0.72)
                                .transition(.move(edge: .bottom).combined(with: .opacity))
                        } else if case .failed(let message) = phase {
                            ErrorStateCard(
                                title: "Couldn't check this booking",
                                message: message,
                                actionTitle: "Try again"
                            ) {
                                Task { await verify() }
                            }
                            .transition(.opacity)
                        }

                        Color.clear.frame(height: 12)
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                    .animation(HayameMotion.settle, value: phase)
                }

                if let successBookingID {
                    BookingSuccessStage(
                        car: resolvedCar,
                        bookingID: successBookingID,
                        startDate: checkout.startDate,
                        endDate: checkout.endDate,
                        onDone: {
                            appState.renterTab = .trips
                            dismiss()
                        }
                    )
                    .transition(.opacity.combined(with: .scale(scale: 1.04)))
                    .zIndex(5)
                }
            }
            .navigationTitle(successBookingID == nil ? "Finish your booking" : "")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(successBookingID == nil ? .visible : .hidden, for: .navigationBar)
            .interactiveDismissDisabled(successBookingID != nil || isPaying)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }
                        .disabled(isPaying)
                }
            }
            .safeAreaInset(edge: .bottom, spacing: 0) {
                if successBookingID == nil {
                    bottomBar
                }
            }
            .overlay {
                if isPaying {
                    PaymentProcessingOverlay()
                }
            }
            .animation(.easeInOut(duration: 0.2), value: isPaying)
        }
        .task {
            if appState.cars.first(where: { $0.id == initial.carID }) == nil {
                Task { await appState.refreshCarDetail(carID: initial.carID) }
            }
            await verify()
        }
        .sheet(item: $editTarget, onDismiss: handleEditDismissed) { item in
            BookingSheet(car: item.car, draft: item.draft)
                .environmentObject(appState)
        }
        .confirmationDialog("Abandon this booking?", isPresented: $showAbandonConfirm, titleVisibility: .visible) {
            Button("Abandon booking", role: .destructive) { Task { await abandon() } }
            Button("Keep it", role: .cancel) {}
        } message: {
            Text("The dates held for you will be released and the saved checkout cleared.")
        }
    }

    // MARK: Sections

    private var verificationCard: some View {
        BookingSheetCard {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(HayameTheme.brandLight)
                        Group {
                            switch phase {
                            case .verifying:
                                ProgressView().tint(HayameTheme.brandBlue)
                            case .ready:
                                Image(systemName: "checkmark.shield.fill")
                                    .foregroundStyle(HayameTheme.success)
                            case .blocked:
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .foregroundStyle(HayameTheme.warning)
                            case .failed:
                                Image(systemName: "wifi.exclamationmark")
                                    .foregroundStyle(HayameTheme.danger)
                            }
                        }
                        .font(.hayame(size: 17, weight: .bold))
                    }
                    .frame(width: 38, height: 38)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(verificationTitle)
                            .font(.hayame(size: 16, weight: .bold))
                            .foregroundStyle(HayameTheme.brandNavy)
                            .contentTransition(.opacity)
                        Text(verificationSubtitle)
                            .font(.hayame(size: 12, weight: .medium))
                            .foregroundStyle(HayameTheme.mutedText)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    Spacer(minLength: 0)
                }

                VStack(spacing: 10) {
                    ForEach(Array(checkTitles.enumerated()), id: \.offset) { index, title in
                        CheckoutVerificationRow(
                            title: title,
                            state: rowState(index),
                            detail: rowDetail(index)
                        )
                    }
                }
            }
        }
    }

    private var listingCard: some View {
        BookingSheetCard {
            HStack(alignment: .top, spacing: 14) {
                NetworkOrFallbackImage(urlString: checkout.carImageURL, targetSize: CGSize(width: 180, height: 140))
                    .frame(width: 86, height: 72)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

                VStack(alignment: .leading, spacing: 6) {
                    Text(checkout.carTitle)
                        .font(.hayame(size: 18, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .lineLimit(2)
                    Text(checkoutDateRangeLabel(start: checkout.startDate, end: checkout.endDate))
                        .font(.hayame(size: 13, weight: .semibold))
                        .foregroundStyle(HayameTheme.brandBlue)
                    Text("\(checkout.nights) day\(checkout.nights == 1 ? "" : "s") • \(checkout.tripMode.label)")
                        .font(.hayame(size: 13, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                    if case .ready(let value) = phase, let expiry = value.holdExpiresAt, value.state == .held {
                        TimelineView(.periodic(from: .now, by: 1)) { context in
                            let remaining = max(0, Int(expiry.timeIntervalSince(context.date).rounded(.down)))
                            HayameStatusPill(
                                text: remaining > 0 ? "Held for you \(formatCountdown(remaining))" : "Hold ended",
                                tone: remaining > 0 ? (remaining < 120 ? .warning : .success) : .neutral,
                                isLive: remaining > 0,
                                systemImage: "timer"
                            )
                        }
                    }
                }
                Spacer(minLength: 0)
            }
        }
    }

    @ViewBuilder
    private var summaryCards: some View {
        listingCard

        BookingSheetCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("Trip summary")
                    .font(.hayame(size: 15, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                InfoLine(label: "Trip mode", value: checkout.tripMode.label)
                InfoLine(label: "Trip use area", value: tripUseLine)
                if checkout.tripMode == .delivery {
                    InfoLine(label: "Delivery address", value: checkout.delivery.address)
                    if !checkout.delivery.time.isEmpty {
                        InfoLine(label: "Delivery time", value: checkout.delivery.time)
                    }
                    if !checkout.delivery.contactPhone.isEmpty {
                        InfoLine(label: "Contact phone", value: checkout.delivery.contactPhone)
                    }
                }
            }
        }

        BookingSheetCard {
            VStack(alignment: .leading, spacing: 14) {
                Text("Price breakdown")
                    .font(.hayame(size: 15, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                let pricing = checkout.pricing
                InfoLine(label: "Daily rate × \(pricing.nights)", value: "GHS \(pricing.subtotal)")
                InfoLine(label: "Insurance", value: "GHS \(pricing.insuranceFee)")
                InfoLine(label: "Service fee", value: "GHS \(pricing.platformFee)")
                if checkout.tripMode == .delivery {
                    InfoLine(label: "Delivery", value: "GHS \(pricing.deliveryFee)")
                }
                if pricing.outsideAccraSurcharge > 0 {
                    InfoLine(label: "Outside region fee", value: "GHS \(pricing.outsideAccraSurcharge)")
                }
                InfoLine(label: "Deposit", value: "GHS \(pricing.depositAmount)")
                Divider()
                HStack(alignment: .firstTextBaseline) {
                    Text("Total")
                        .font(.hayame(size: 16, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Spacer()
                    Text("GHS \(pricing.total)")
                        .font(.hayame(size: 28, weight: .bold))
                        .foregroundStyle(HayameTheme.brandBlue)
                        .contentTransition(.numericText())
                }
                Text("Confirmed by the server just now. This is the exact amount Paystack will charge.")
                    .font(.hayame(size: 12, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
            }
        }
    }

    private var bottomBar: some View {
        VStack(spacing: 10) {
            if let paymentMessage, !paymentMessage.isEmpty {
                Text(paymentMessage)
                    .font(.hayame(size: 13, weight: .semibold))
                    .foregroundStyle(HayameTheme.danger)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            switch phase {
            case .ready(let value):
                Button {
                    Task { await pay(value) }
                } label: {
                    HStack(spacing: 10) {
                        if isPaying { ProgressView().tint(.white) }
                        Text(verbatim: isPaying ? "Processing..." : "Pay GHS \(value.pricing.total)")
                    }
                    .font(.hayame(size: 16, weight: .semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(HayameTheme.brandBlue, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .foregroundStyle(.white)
                }
                .buttonStyle(.plain)
                .disabled(isPaying)

                HStack(spacing: 10) {
                    Button("Edit details") { openEditor(step: .review) }
                        .buttonStyle(SecondaryPillButtonStyle())
                    Button {
                        showAbandonConfirm = true
                    } label: {
                        Group {
                            if isAbandoning { ProgressView() } else { Text("Abandon") }
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(SecondaryPillButtonStyle())
                    .foregroundStyle(HayameTheme.danger)
                }
                .disabled(isPaying || isAbandoning)

            case .blocked:
                Button {
                    openEditor(step: .tripDetails)
                } label: {
                    Text("Choose new dates")
                        .font(.hayame(size: 16, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(HayameTheme.brandBlue, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                        .foregroundStyle(.white)
                }
                .buttonStyle(.plain)

                Button {
                    showAbandonConfirm = true
                } label: {
                    Group {
                        if isAbandoning { ProgressView() } else { Text("Abandon booking") }
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(SecondaryPillButtonStyle())
                .foregroundStyle(HayameTheme.danger)
                .disabled(isAbandoning)

            case .verifying:
                Text("Checking that everything still lines up...")
                    .font(.hayame(size: 13, weight: .semibold))
                    .foregroundStyle(HayameTheme.mutedText)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)

            case .failed:
                Button("Close") { dismiss() }
                    .buttonStyle(SecondaryPillButtonStyle())
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 12)
        .padding(.bottom, 8)
        .background(.ultraThinMaterial)
        .overlay(alignment: .top) {
            Rectangle().fill(HayameTheme.bottomBarSeparator).frame(height: 1)
        }
    }

    // MARK: Derived copy

    private var verificationTitle: String {
        switch phase {
        case .verifying: return "Re-checking your booking"
        case .ready: return "All good — ready to pay"
        case .blocked: return "Something changed"
        case .failed: return "Couldn't reach Hayame"
        }
    }

    private var verificationSubtitle: String {
        switch phase {
        case .verifying: return "We make sure the car, dates and price are still exactly as you left them."
        case .ready: return "Your hold was refreshed and the price confirmed. Nothing was charged yet."
        case .blocked(let value): return value.issues.first?.message ?? "Pick new dates to continue."
        case .failed(let message): return message
        }
    }

    private var tripUseLine: String {
        [checkout.tripUseAddress, checkout.tripUseCity, checkout.tripUseRegion]
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: ", ")
    }

    private func rowState(_ index: Int) -> CheckoutVerificationRow.RowState {
        if let failedCheckIndex {
            if index == failedCheckIndex { return .failed }
            return index < failedCheckIndex ? .passed : .skipped
        }
        if case .failed = phase { return index < checksCompleted ? .passed : .skipped }
        return index < checksCompleted ? .passed : .pending
    }

    private func rowDetail(_ index: Int) -> String? {
        guard let failedCheckIndex, index == failedCheckIndex, case .blocked(let value) = phase else { return nil }
        return value.issues.first?.message
    }

    private static func checkIndex(for issue: CheckoutIssue?) -> Int {
        switch issue?.code {
        case "car_not_found", "car_unavailable", "listing_not_approved", "own_car", "delivery_unavailable":
            return 0
        case "dates_invalid", "dates_past", "dates_taken", "dates_blocked", "hold_failed":
            return 1
        default:
            return 2
        }
    }

    // MARK: Actions

    @MainActor
    private func verify() async {
        withAnimation(HayameMotion.settle) {
            phase = .verifying
            checksCompleted = 0
            failedCheckIndex = nil
            paymentMessage = nil
        }

        // Tick the first checks while the request is in flight so the wait
        // reads as progress rather than a spinner.
        let ticker = Task { @MainActor in
            for step in 1...2 {
                try? await Task.sleep(nanoseconds: 380_000_000)
                guard !Task.isCancelled else { return }
                withAnimation(HayameMotion.snappy) { checksCompleted = max(checksCompleted, step) }
            }
        }

        do {
            let outcome = try await appState.resumePendingCheckout(initial)
            ticker.cancel()
            switch outcome {
            case .ready(let value):
                await revealChecks(upTo: 3)
                HayameHaptics.success()
                withAnimation(HayameMotion.settle) { phase = .ready(value) }
            case .blocked(let value):
                let index = Self.checkIndex(for: value.issues.first)
                await revealChecks(upTo: index)
                HayameHaptics.warning()
                withAnimation(HayameMotion.settle) {
                    failedCheckIndex = index
                    phase = .blocked(value)
                }
            case .completed(let bookingID, _):
                await revealChecks(upTo: 3)
                didFinish = true
                presentSuccess(bookingID: bookingID)
            }
        } catch {
            ticker.cancel()
            let message = AppState.userFacingMessage(error, fallback: "We couldn't resume your booking. Please try again.")
            if let apiError = error as? APIError, apiError.statusCode == 404 {
                // Nothing to resume anymore: close quietly, the card is gone too.
                appState.syncErrorMessage = message
                dismiss()
                return
            }
            withAnimation(HayameMotion.settle) { phase = .failed(message) }
        }
    }

    @MainActor
    private func revealChecks(upTo target: Int) async {
        while checksCompleted < target {
            withAnimation(HayameMotion.snappy) { checksCompleted += 1 }
            try? await Task.sleep(nanoseconds: 220_000_000)
        }
    }

    @MainActor
    private func pay(_ value: PendingCheckout) async {
        guard !isPaying else { return }
        isPaying = true
        paymentMessage = nil
        defer { isPaying = false }

        do {
            let session = try await appState.beginResumedCheckoutPayment(value)
            guard let checkoutURL = URL(string: session.authorizationURL) else {
                throw APIError(message: "Invalid Paystack checkout URL returned by server.")
            }
            do {
                let callbackURL = try await InAppBrowserAuthenticator.shared.open(url: checkoutURL, callbackScheme: "hayame")
                _ = try await appState.completeBookingPayment(checkout: session, callbackURL: callbackURL)
                didFinish = true
                presentSuccess(bookingID: session.bookingID)
                return
            } catch {
                if let browserError = error as? InAppBrowserAuthenticatorError,
                   browserError.shouldAttemptPaymentVerificationFallback {
                    _ = try await appState.completeBookingPayment(checkout: session)
                    didFinish = true
                    presentSuccess(bookingID: session.bookingID)
                    return
                }
                throw error
            }
        } catch {
            let message = AppState.userFacingMessage(error, fallback: "Unable to complete payment.")
            paymentMessage = message.isEmpty
                ? "Payment wasn't completed. Your booking is still saved — try again when you're ready."
                : "\(message) Your booking is still saved — try again when you're ready."
            HayameHaptics.error()
            // The hold may have expired or been superseded: re-run the checks so
            // the next tap starts from a fresh, valid state.
            if let apiError = error as? APIError, [400, 404, 409].contains(apiError.statusCode ?? 0) {
                await appState.refreshPendingCheckout(force: true)
                if let refreshed = appState.pendingCheckout {
                    withAnimation(HayameMotion.settle) { phase = .ready(refreshed) }
                }
            }
        }
    }

    @MainActor
    private func abandon() async {
        isAbandoning = true
        let ok = await appState.abandonResumableCheckout(.held(checkout))
        isAbandoning = false
        if ok {
            HayameHaptics.select()
            dismiss()
        }
    }

    private func openEditor(step: BookingCheckoutStep) {
        var draft = checkout.asDraft(userID: appState.currentUser.id)
        draft.step = step.rawValue
        editTarget = DraftResumeTarget(car: resolvedCar, draft: draft)
    }

    private func handleEditDismissed() {
        // The checkout sheet either paid (close this one too) or saved a draft /
        // refreshed the hold (re-check so this sheet reflects the new state).
        if appState.lastCompletedCheckoutBookingID != nil, appState.pendingCheckout == nil, appState.checkoutDraft == nil {
            dismiss()
            return
        }
        Task { await verify() }
    }

    @MainActor
    private func presentSuccess(bookingID: String) {
        HayameHaptics.success()
        withAnimation(HayameMotion.settle) {
            successBookingID = bookingID
        }
    }
}

/// One line of the re-check list: ticks, fails, or waits.
private struct CheckoutVerificationRow: View {
    enum RowState: Equatable { case pending, passed, failed, skipped }

    let title: String
    let state: RowState
    var detail: String? = nil

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack {
                Circle()
                    .fill(badgeFill)
                    .frame(width: 26, height: 26)
                switch state {
                case .pending:
                    Circle()
                        .stroke(HayameTheme.controlStroke, lineWidth: 1.5)
                        .frame(width: 26, height: 26)
                case .passed:
                    Image(systemName: "checkmark")
                        .font(.hayame(size: 12, weight: .heavy))
                        .foregroundStyle(.white)
                        .transition(.scale(scale: 0.4).combined(with: .opacity))
                case .failed:
                    Image(systemName: "xmark")
                        .font(.hayame(size: 12, weight: .heavy))
                        .foregroundStyle(.white)
                        .transition(.scale(scale: 0.4).combined(with: .opacity))
                case .skipped:
                    Image(systemName: "minus")
                        .font(.hayame(size: 12, weight: .heavy))
                        .foregroundStyle(HayameTheme.mutedText)
                }
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.hayame(size: 14, weight: .semibold))
                    .foregroundStyle(state == .skipped ? HayameTheme.mutedText : HayameTheme.brandNavy)
                if let detail, !detail.isEmpty {
                    Text(detail)
                        .font(.hayame(size: 12, weight: .medium))
                        .foregroundStyle(HayameTheme.danger)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            Spacer(minLength: 0)
        }
        .animation(HayameMotion.snappy, value: state)
    }

    private var badgeFill: Color {
        switch state {
        case .pending, .skipped: return HayameTheme.fieldBackground
        case .passed: return HayameTheme.success
        case .failed: return HayameTheme.danger
        }
    }
}

// MARK: - Helpers

func checkoutDateRangeLabel(start: Date, end: Date) -> String {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_GH")
    formatter.dateFormat = "d MMM"
    let sameYear = Calendar.current.isDate(start, equalTo: end, toGranularity: .year)
    let endFormatter = DateFormatter()
    endFormatter.locale = formatter.locale
    endFormatter.dateFormat = sameYear ? "d MMM" : "d MMM yyyy"
    return "\(formatter.string(from: start)) – \(endFormatter.string(from: end))"
}

func formatCountdown(_ seconds: Int) -> String {
    let minutes = seconds / 60
    let remainder = seconds % 60
    return String(format: "%d:%02d", minutes, remainder)
}

extension PendingCheckout {
    /// The saved choices as a checkout-sheet draft, for "Edit details".
    func asDraft(userID: String) -> CheckoutDraft {
        CheckoutDraft(
            userID: userID,
            carID: carID,
            carTitle: carTitle,
            carImageURL: carImageURL,
            dailyPrice: carDailyPrice,
            startDate: startDateString,
            endDate: endDateString,
            region: tripUseRegion,
            city: tripUseCity,
            address: tripUseAddress,
            tripMode: tripMode,
            delivery: delivery,
            step: BookingCheckoutStep.review.rawValue,
            updatedAt: Date()
        )
    }
}

import AVFoundation
import ImageIO
import PhotosUI
import SwiftUI
import UIKit

// MARK: - Renter verification
//
// Before a first booking every renter sends three photos: their face and both
// sides of their driving licence. The Hayame team reviews them and the server
// only accepts a booking once they are approved. These views make that a short
// guided step instead of a refused payment: the form, the "under review" and
// "verified" states, the Home prompt and the More row.

// MARK: - Screen

struct RenterVerificationScreen: View {
    enum Context: Equatable {
        /// Opened from More, Profile, Home or a notification.
        case standalone
        /// Opened from the checkout; the booking for this car has been saved.
        case booking(carTitle: String)
    }

    @EnvironmentObject private var appState: AppState

    var context: Context = .standalone
    /// Set when the screen is shown in a sheet: adds Close and a closing button.
    var onClose: (() -> Void)? = nil

    @State private var photos: [RenterVerificationPhotoKind: UIImage] = [:]
    /// Storage paths of photos already uploaded, so a retry only sends the rest.
    @State private var uploadedPaths: [RenterVerificationPhotoKind: String] = [:]
    @State private var cameraKind: RenterVerificationPhotoKind?
    @State private var loadingKind: RenterVerificationPhotoKind?
    @State private var isSubmitting = false
    @State private var uploadStep = 0
    @State private var errorMessage: String?
    @State private var showCameraAccessAlert = false

    private var verification: RenterVerification? { appState.renterVerification }

    private var showsForm: Bool {
        guard let verification else { return false }
        return verification.status == .unverified || verification.status == .rejected
    }

    private var allPhotosChosen: Bool {
        RenterVerificationPhotoKind.allCases.allSatisfy { photos[$0] != nil }
    }

    private var cameraAvailable: Bool {
        UIImagePickerController.isSourceTypeAvailable(.camera)
    }

    /// The car whose booking is waiting on this check, if there is one.
    private var savedBookingCarTitle: String? {
        if case .booking(let carTitle) = context { return carTitle }
        return appState.resumableCheckout?.carTitle
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 16) {
                content
            }
            .padding(16)
            .animation(HayameMotion.settle, value: verification)
            .animation(HayameMotion.settle, value: appState.renterVerificationLoadState)
        }
        .background(HayameTheme.pageBackground.ignoresSafeArea())
        .navigationTitle("Verify identity")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(HayameTheme.pageBackground, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .toolbar {
            if let onClose {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close", action: onClose)
                        .font(.hayame(size: 15, weight: .semibold))
                        .disabled(isSubmitting)
                }
            }
        }
        .interactiveDismissDisabled(isSubmitting)
        .safeAreaInset(edge: .bottom, spacing: 0) {
            if showsForm {
                submitBar
            } else if let onClose, let verification, !showsForm {
                closingBar(for: verification, onClose: onClose)
            }
        }
        .refreshable {
            await appState.refreshRenterVerification(force: true)
        }
        .task {
            await appState.refreshRenterVerification(force: true)
        }
        .fullScreenCover(item: $cameraKind) { kind in
            VerificationCameraPicker(
                prefersFrontCamera: kind == .face,
                onCapture: { image in
                    cameraKind = nil
                    acceptCameraImage(image, for: kind)
                },
                onCancel: { cameraKind = nil }
            )
            .ignoresSafeArea()
            .background(Color.black.ignoresSafeArea())
        }
        .alert("Camera access is off", isPresented: $showCameraAccessAlert) {
            Button("Open Settings") {
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            }
            Button("Not now", role: .cancel) {}
        } message: {
            Text("Allow camera access for Hayame in Settings, or choose a photo from your library instead.")
        }
    }

    // MARK: States

    @ViewBuilder
    private var content: some View {
        if let verification {
            switch verification.status {
            case .unverified, .rejected:
                formContent(verification)
            case .pending:
                pendingContent(verification)
            case .approved:
                approvedContent
            }
        } else if case .error(let message) = appState.renterVerificationLoadState {
            ErrorStateCard(
                title: "Couldn't load your status",
                message: message,
                actionTitle: "Try again"
            ) {
                Task { await appState.refreshRenterVerification(force: true) }
            }
        } else {
            LoadingStateCard(
                title: "Checking your status",
                message: "This only takes a moment."
            )
        }
    }

    @ViewBuilder
    private func formContent(_ verification: RenterVerification) -> some View {
        introCard
            .hayameAppear(index: 0)

        if verification.status == .rejected {
            rejectionCard(reason: verification.rejectionReason)
                .hayameAppear(index: 1)
        }

        if case .booking(let carTitle) = context {
            VerificationNoteCard(
                systemImage: "bookmark.fill",
                tint: HayameTheme.brandBlue,
                title: "Your booking is saved",
                message: "Once you're approved you can finish booking the \(carTitle) from Home or Trips. Your dates and choices are kept."
            )
            .hayameAppear(index: 1)
        }

        ForEach(Array(RenterVerificationPhotoKind.allCases.enumerated()), id: \.element) { index, kind in
            VerificationPhotoCard(
                kind: kind,
                stepNumber: index + 1,
                stepCount: RenterVerificationPhotoKind.allCases.count,
                image: photos[kind],
                isLoading: loadingKind == kind,
                isDisabled: isSubmitting,
                cameraAvailable: cameraAvailable,
                onCamera: { openCamera(for: kind) },
                onLibraryItem: { item in loadLibraryItem(item, for: kind) }
            )
            .hayameAppear(index: index + 2)
        }

        Color.clear.frame(height: 4)
    }

    private var introCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                VerificationIconChip(systemImage: "checkmark.shield.fill", tint: HayameTheme.brandBlue)
                VStack(alignment: .leading, spacing: 4) {
                    Text("Verify your identity")
                        .font(.hayame(size: 19, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text("Hayame checks every driver's licence to keep hosts' cars safe. You only do this once.")
                        .font(.hayame(size: 13, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            privacyLine
        }
        .verificationCard()
    }

    private var privacyLine: some View {
        HStack(spacing: 8) {
            Image(systemName: "lock.fill")
                .font(.hayame(size: 11, weight: .bold))
                .foregroundStyle(HayameTheme.success)
            Text("Your photos are only seen by the Hayame team.")
                .font(.hayame(size: 12, weight: .semibold))
                .foregroundStyle(HayameTheme.brandNavy)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 9)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(HayameTheme.success.opacity(0.1), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private func rejectionCard(reason: String?) -> some View {
        let trimmed = reason?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 10) {
                Image(systemName: "exclamationmark.circle.fill")
                    .font(.hayame(size: 18, weight: .bold))
                    .foregroundStyle(HayameTheme.danger)
                Text("We couldn't approve your photos")
                    .font(.hayame(size: 16, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
            }
            if !trimmed.isEmpty {
                Text(trimmed)
                    .font(.hayame(size: 14, weight: .semibold))
                    .foregroundStyle(HayameTheme.brandNavy)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Text("Take new photos below and send them again. We'll take another look.")
                .font(.hayame(size: 13, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(HayameTheme.danger.opacity(0.08), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .strokeBorder(HayameTheme.danger.opacity(0.35), lineWidth: 1)
        )
        .accessibilityElement(children: .combine)
    }

    @ViewBuilder
    private func pendingContent(_ verification: RenterVerification) -> some View {
        VStack(spacing: 14) {
            ZStack {
                HayameRadarPulse(color: HayameTheme.warning, maxScale: 2.6)
                    .frame(width: 56, height: 56)
                Image(systemName: "hourglass")
                    .font(.hayame(size: 24, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 64, height: 64)
                    .background(HayameTheme.warning, in: Circle())
            }
            .frame(height: 150)

            HayameStatusPill(text: "Under review", tone: .warning, isLive: true)

            Text("We're checking your photos")
                .font(.hayame(size: 22, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)
                .multilineTextAlignment(.center)

            Text("This is usually done within a few hours. We'll send you a notification as soon as there's a decision.")
                .font(.hayame(size: 14, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)

            if let submittedAt = verification.submittedAt {
                Text("Sent \(submittedAt.formatted(date: .abbreviated, time: .shortened))")
                    .font(.hayame(size: 12, weight: .semibold))
                    .foregroundStyle(HayameTheme.mutedText)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 8)
        .hayameAppear(index: 0)

        if let carTitle = savedBookingCarTitle {
            VerificationNoteCard(
                systemImage: "bookmark.fill",
                tint: HayameTheme.brandBlue,
                title: "Your booking is saved",
                message: "Once you're approved, finish booking the \(carTitle) from Home or Trips. Your dates and choices are kept."
            )
            .hayameAppear(index: 1)
        } else {
            VerificationNoteCard(
                systemImage: "car.fill",
                tint: HayameTheme.brandBlue,
                title: "Keep browsing",
                message: "You can look around and save cars while you wait. Booking opens as soon as you're approved."
            )
            .hayameAppear(index: 1)
        }

        privacyLine
            .hayameAppear(index: 2)
    }

    @ViewBuilder
    private var approvedContent: some View {
        VStack(spacing: 14) {
            HayameSuccessCheck(size: 84)
                .padding(.top, 28)
                .padding(.bottom, 6)

            Text("You're verified")
                .font(.hayame(size: 22, weight: .bold))
                .foregroundStyle(HayameTheme.brandNavy)

            Text("Your licence has been checked. You can book any car on Hayame.")
                .font(.hayame(size: 14, weight: .medium))
                .foregroundStyle(HayameTheme.mutedText)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity)
        .hayameAppear(index: 0)

        if case .standalone = context, let carTitle = appState.resumableCheckout?.carTitle {
            VerificationNoteCard(
                systemImage: "bookmark.fill",
                tint: HayameTheme.brandBlue,
                title: "Your saved booking is ready",
                message: "Finish booking the \(carTitle) from Home or Trips."
            )
            .hayameAppear(index: 1)
        }
    }

    // MARK: Bottom bars

    private var photosAddedCount: Int {
        RenterVerificationPhotoKind.allCases.filter { photos[$0] != nil }.count
    }

    private var progressLabel: String {
        let total = RenterVerificationPhotoKind.allCases.count
        if uploadStep >= total { return "Sending for review" }
        return "Uploading photo \(uploadStep + 1) of \(total)"
    }

    private var submitBar: some View {
        VStack(spacing: 10) {
            if let errorMessage, !errorMessage.isEmpty {
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "exclamationmark.circle.fill")
                        .font(.hayame(size: 13, weight: .bold))
                    Text(errorMessage)
                        .font(.hayame(size: 13, weight: .semibold))
                        .fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: 0)
                }
                .foregroundStyle(HayameTheme.danger)
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }

            if isSubmitting {
                HayameProgressBar(
                    fraction: Double(uploadStep + 1) / Double(RenterVerificationPhotoKind.allCases.count + 1),
                    height: 5
                )
                .transition(.opacity)
            } else if !allPhotosChosen {
                Text("\(photosAddedCount) of \(RenterVerificationPhotoKind.allCases.count) photos added")
                    .font(.hayame(size: 12, weight: .semibold))
                    .foregroundStyle(HayameTheme.mutedText)
                    .contentTransition(.numericText())
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            Button {
                Task { await submit() }
            } label: {
                HStack(spacing: 8) {
                    if isSubmitting {
                        ProgressView()
                            .tint(.white)
                            .controlSize(.small)
                    }
                    Text(isSubmitting ? progressLabel : "Submit for review")
                        .contentTransition(.opacity)
                        .lineLimit(1)
                        .minimumScaleFactor(0.75)
                }
                .font(.hayame(size: 16, weight: .bold))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 52)
                .background(
                    HayameTheme.brandBlue.opacity(allPhotosChosen ? 1 : 0.4),
                    in: RoundedRectangle(cornerRadius: 16, style: .continuous)
                )
                .contentShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
            .buttonStyle(HayamePressableStyle(scale: 0.97))
            .disabled(!allPhotosChosen || isSubmitting)
            .accessibilityHint(allPhotosChosen ? "" : "Add all three photos first")
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
        .animation(HayameMotion.snappy, value: errorMessage)
        .animation(HayameMotion.snappy, value: isSubmitting)
        .animation(HayameMotion.snappy, value: photosAddedCount)
    }

    private func closingBar(for verification: RenterVerification, onClose: @escaping () -> Void) -> some View {
        let title: String
        switch (verification.status, context) {
        case (.approved, .booking): title = "Continue booking"
        case (.approved, .standalone): title = "Done"
        default: title = "Got it"
        }
        return Button {
            HayameHaptics.tap()
            onClose()
        } label: {
            Text(title)
                .font(.hayame(size: 16, weight: .bold))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 52)
                .background(HayameTheme.brandBlue, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .contentShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .buttonStyle(HayamePressableStyle(scale: 0.97, haptic: false))
        .padding(.horizontal, 16)
        .padding(.top, 12)
        .padding(.bottom, 8)
        .background(HayameTheme.cardBackground.ignoresSafeArea(edges: .bottom))
        .overlay(alignment: .top) {
            Rectangle()
                .fill(HayameTheme.cardStroke)
                .frame(height: 1)
        }
    }

    // MARK: Actions

    private func openCamera(for kind: RenterVerificationPhotoKind) {
        guard cameraAvailable else { return }
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            cameraKind = kind
        case .notDetermined:
            Task { @MainActor in
                if await AVCaptureDevice.requestAccess(for: .video) {
                    cameraKind = kind
                } else {
                    showCameraAccessAlert = true
                }
            }
        default:
            showCameraAccessAlert = true
        }
    }

    private func acceptCameraImage(_ image: UIImage, for kind: RenterVerificationPhotoKind) {
        loadingKind = kind
        Task { @MainActor in
            let prepared = await Task.detached(priority: .userInitiated) {
                RenterVerificationImagePrep.scaled(image)
            }.value
            if loadingKind == kind { loadingKind = nil }
            setPhoto(prepared, for: kind)
        }
    }

    private func loadLibraryItem(_ item: PhotosPickerItem, for kind: RenterVerificationPhotoKind) {
        loadingKind = kind
        Task { @MainActor in
            defer { if loadingKind == kind { loadingKind = nil } }
            let unreadable = "We couldn't read that photo. Please choose another one."
            do {
                guard let data = try await item.loadTransferable(type: Data.self) else {
                    throw APIError(message: unreadable)
                }
                let prepared = await Task.detached(priority: .userInitiated) {
                    RenterVerificationImagePrep.image(from: data)
                }.value
                guard let prepared else { throw APIError(message: unreadable) }
                setPhoto(prepared, for: kind)
            } catch {
                let message = AppState.userFacingMessage(error, fallback: unreadable)
                if !message.isEmpty {
                    HayameHaptics.error()
                    errorMessage = message
                }
            }
        }
    }

    private func setPhoto(_ image: UIImage, for kind: RenterVerificationPhotoKind) {
        HayameHaptics.select()
        withAnimation(HayameMotion.settle) {
            photos[kind] = image
            // A new photo replaces whatever was uploaded for this step before.
            uploadedPaths[kind] = nil
            errorMessage = nil
        }
    }

    @MainActor
    private func submit() async {
        guard !isSubmitting, allPhotosChosen else { return }
        isSubmitting = true
        errorMessage = nil
        uploadStep = 0
        defer { isSubmitting = false }

        do {
            for (index, kind) in RenterVerificationPhotoKind.allCases.enumerated() {
                uploadStep = index
                if uploadedPaths[kind] != nil { continue }
                guard let image = photos[kind] else {
                    throw APIError(message: "Add all three photos to continue.")
                }
                let data = await Task.detached(priority: .userInitiated) {
                    RenterVerificationImagePrep.jpegData(image)
                }.value
                guard let data else {
                    throw APIError(message: "We couldn't read one of your photos. Please retake it.")
                }
                uploadedPaths[kind] = try await appState.uploadRenterVerificationPhoto(kind: kind, fileData: data)
            }

            uploadStep = RenterVerificationPhotoKind.allCases.count
            guard let facePath = uploadedPaths[.face],
                  let frontPath = uploadedPaths[.licenceFront],
                  let backPath = uploadedPaths[.licenceBack] else {
                throw APIError(message: "We couldn't upload your photos. Please try again.")
            }
            try await appState.submitRenterVerification(
                facePath: facePath,
                licenceFrontPath: frontPath,
                licenceBackPath: backPath
            )
            HayameHaptics.success()
            if let status = appState.renterVerification?.status, status == .pending || status == .approved {
                photos = [:]
                uploadedPaths = [:]
            }
        } catch {
            let message = AppState.userFacingMessage(error, fallback: "Something went wrong. Please try again.")
            if !message.isEmpty {
                HayameHaptics.error()
                errorMessage = message
            }
            if let apiError = error as? APIError {
                if apiError.statusCode == 400 {
                    // The server did not accept these files: send fresh copies next time.
                    uploadedPaths = [:]
                } else if apiError.statusCode == 409 {
                    // The status moved on (for example already under review).
                    await appState.refreshRenterVerification(force: true)
                }
            }
        }
    }
}

// MARK: - Sheet

/// The verification screen in its own sheet, for the checkout and for
/// notifications. Pushed uses (More, Profile, Home) use the screen directly.
struct RenterVerificationSheet: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    var context: RenterVerificationScreen.Context = .standalone

    var body: some View {
        NavigationStack {
            RenterVerificationScreen(context: context, onClose: { dismiss() })
                .environmentObject(appState)
        }
        .tint(HayameTheme.brandBlue)
    }
}

// MARK: - Entry points

/// Compact prompt on Home for signed-in renters who still have photos to send.
struct RenterVerificationPromptCard: View {
    @EnvironmentObject private var appState: AppState

    let verification: RenterVerification

    private var isRejected: Bool { verification.status == .rejected }
    private var tint: Color { isRejected ? HayameTheme.danger : HayameTheme.brandBlue }

    var body: some View {
        NavigationLink {
            RenterVerificationScreen()
                .environmentObject(appState)
        } label: {
            HStack(spacing: 12) {
                VerificationIconChip(
                    systemImage: isRejected ? "exclamationmark.shield.fill" : "checkmark.shield.fill",
                    tint: tint,
                    size: 36
                )

                VStack(alignment: .leading, spacing: 2) {
                    Text(isRejected ? "Your verification needs another try" : "Verify your identity to book")
                        .font(.hayame(size: 15, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .lineLimit(2)
                    Text(isRejected
                         ? "See what went wrong and send new photos."
                         : "Add a selfie and your driving licence. It takes about two minutes.")
                        .font(.hayame(size: 12, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                }

                Spacer(minLength: 4)

                Image(systemName: "chevron.right")
                    .font(.hayame(size: 13, weight: .bold))
                    .foregroundStyle(tint)
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(HayameTheme.cardBackground, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .strokeBorder(tint.opacity(0.4), lineWidth: 1.2)
            )
            .shadow(color: HayameTheme.cardShadow, radius: 12, x: 0, y: 6)
            .contentShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        }
        .buttonStyle(HayamePressableStyle())
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isButton)
    }
}

/// "Verify identity" row for More and Profile, showing where the check stands.
struct RenterVerificationRow: View {
    @EnvironmentObject private var appState: AppState

    private var status: RenterVerificationStatus? { appState.renterVerification?.status }

    private var icon: String {
        switch status {
        case .approved: return "checkmark.shield.fill"
        case .pending: return "hourglass"
        case .rejected: return "exclamationmark.shield.fill"
        default: return "person.text.rectangle.fill"
        }
    }

    private var tint: Color {
        switch status {
        case .approved: return HayameTheme.success
        case .pending: return HayameTheme.warning
        case .rejected: return HayameTheme.danger
        default: return HayameTheme.brandBlue
        }
    }

    private var subtitle: String {
        switch status {
        case .approved: return "Verified. You can book any car"
        case .pending: return "Under review, usually within a few hours"
        case .rejected: return "Needs another try. Tap to see why"
        case .unverified: return "Not verified yet. Needed before you can book"
        case nil: return "Selfie and driving licence, needed to book"
        }
    }

    var body: some View {
        HayameNavRow(icon: icon, tint: tint, title: "Verify identity", subtitle: subtitle) {
            RenterVerificationScreen()
                .environmentObject(appState)
        }
    }
}

// MARK: - Pieces

private extension RenterVerificationPhotoKind {
    var title: String {
        switch self {
        case .face: return "Photo of your face"
        case .licenceFront: return "Driving licence, front"
        case .licenceBack: return "Driving licence, back"
        }
    }

    var guidance: String {
        switch self {
        case .face: return "Use good light and look at the camera. Your whole face should be clearly visible. No sunglasses or hats."
        case .licenceFront: return "Lay it flat with all four corners in view. The text and photo should be easy to read."
        case .licenceBack: return "Turn it over. Keep it flat with all four corners in view and no glare."
        }
    }

    var placeholderSymbol: String {
        switch self {
        case .face: return "person.crop.circle"
        case .licenceFront: return "person.text.rectangle"
        case .licenceBack: return "creditcard"
        }
    }
}

private extension View {
    func verificationCard() -> some View {
        padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(HayameTheme.cardBackground, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .strokeBorder(HayameTheme.cardStroke, lineWidth: 1)
            )
    }
}

private struct VerificationIconChip: View {
    let systemImage: String
    let tint: Color
    var size: CGFloat = 40

    var body: some View {
        Image(systemName: systemImage)
            .font(.hayame(size: size * 0.42, weight: .bold))
            .foregroundStyle(tint)
            .frame(width: size, height: size)
            .background(tint.opacity(0.14), in: RoundedRectangle(cornerRadius: size * 0.3, style: .continuous))
    }
}

private struct VerificationNoteCard: View {
    let systemImage: String
    let tint: Color
    let title: String
    let message: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VerificationIconChip(systemImage: systemImage, tint: tint, size: 36)
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.hayame(size: 15, weight: .bold))
                    .foregroundStyle(HayameTheme.brandNavy)
                Text(message)
                    .font(.hayame(size: 13, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .verificationCard()
        .accessibilityElement(children: .combine)
    }
}

/// One of the three photo steps: guidance, a thumbnail once chosen, and the
/// camera / library buttons (which become "retake" once a photo is in).
private struct VerificationPhotoCard: View {
    let kind: RenterVerificationPhotoKind
    let stepNumber: Int
    let stepCount: Int
    let image: UIImage?
    let isLoading: Bool
    let isDisabled: Bool
    let cameraAvailable: Bool
    let onCamera: () -> Void
    let onLibraryItem: (PhotosPickerItem) -> Void

    private var hasPhoto: Bool { image != nil }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top, spacing: 12) {
                thumbnail

                VStack(alignment: .leading, spacing: 5) {
                    HStack(spacing: 6) {
                        Text("Step \(stepNumber) of \(stepCount)")
                            .font(.hayame(size: 11, weight: .bold))
                            .foregroundStyle(HayameTheme.brandBlue)
                        Spacer(minLength: 0)
                        if hasPhoto {
                            HStack(spacing: 4) {
                                Image(systemName: "checkmark.circle.fill")
                                Text("Added")
                            }
                            .font(.hayame(size: 11, weight: .bold))
                            .foregroundStyle(HayameTheme.success)
                            .transition(.scale.combined(with: .opacity))
                        }
                    }
                    Text(kind.title)
                        .font(.hayame(size: 16, weight: .bold))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Text(kind.guidance)
                        .font(.hayame(size: 12, weight: .medium))
                        .foregroundStyle(HayameTheme.mutedText)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            HStack(spacing: 10) {
                if cameraAvailable {
                    Button(action: onCamera) {
                        actionLabel(
                            title: hasPhoto ? "Retake" : "Take photo",
                            systemImage: "camera.fill",
                            prominent: !hasPhoto
                        )
                    }
                    .buttonStyle(HayamePressableStyle(scale: 0.97))
                }

                PhotosPicker(
                    selection: Binding<PhotosPickerItem?>(
                        get: { nil },
                        set: { item in
                            if let item { onLibraryItem(item) }
                        }
                    ),
                    matching: .images
                ) {
                    actionLabel(
                        title: hasPhoto ? "Choose another" : "Choose photo",
                        systemImage: "photo.on.rectangle",
                        prominent: !hasPhoto && !cameraAvailable
                    )
                }
                .buttonStyle(HayamePressableStyle(scale: 0.97))
            }
            .disabled(isDisabled || isLoading)
            .opacity(isDisabled ? 0.6 : 1)
        }
        .verificationCard()
        .animation(HayameMotion.settle, value: hasPhoto)
    }

    private var thumbnail: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(HayameTheme.fieldBackground)

            if let image {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 84, height: 84)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .transition(.opacity.combined(with: .scale(scale: 0.94)))
            } else {
                Image(systemName: kind.placeholderSymbol)
                    .font(.hayame(size: 28, weight: .medium))
                    .foregroundStyle(HayameTheme.mutedText.opacity(0.7))
            }

            if isLoading {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(Color.black.opacity(0.35))
                ProgressView()
                    .tint(.white)
            }
        }
        .frame(width: 84, height: 84)
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(
                    hasPhoto ? HayameTheme.success.opacity(0.6) : HayameTheme.controlStroke,
                    style: StrokeStyle(lineWidth: 1.2, dash: hasPhoto ? [] : [5, 4])
                )
        )
        .accessibilityLabel(hasPhoto ? "\(kind.title), added" : "\(kind.title), not added yet")
    }

    private func actionLabel(title: String, systemImage: String, prominent: Bool) -> some View {
        HStack(spacing: 7) {
            Image(systemName: systemImage)
                .font(.hayame(size: 13, weight: .bold))
            Text(title)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .font(.hayame(size: 14, weight: .semibold))
        .foregroundStyle(prominent ? Color.white : HayameTheme.brandNavy)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(
            prominent ? HayameTheme.brandBlue : HayameTheme.fieldBackground,
            in: RoundedRectangle(cornerRadius: 14, style: .continuous)
        )
        .contentShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

// MARK: - Camera

/// The system camera, opened on the front lens for the face photo.
private struct VerificationCameraPicker: UIViewControllerRepresentable {
    let prefersFrontCamera: Bool
    let onCapture: (UIImage) -> Void
    let onCancel: () -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(onCapture: onCapture, onCancel: onCancel)
    }

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.cameraCaptureMode = .photo
        picker.allowsEditing = false
        if prefersFrontCamera, UIImagePickerController.isCameraDeviceAvailable(.front) {
            picker.cameraDevice = .front
        } else if UIImagePickerController.isCameraDeviceAvailable(.rear) {
            picker.cameraDevice = .rear
        }
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    final class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        private let onCapture: (UIImage) -> Void
        private let onCancel: () -> Void

        init(onCapture: @escaping (UIImage) -> Void, onCancel: @escaping () -> Void) {
            self.onCapture = onCapture
            self.onCancel = onCancel
        }

        func imagePickerController(
            _ picker: UIImagePickerController,
            didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
        ) {
            if let image = info[.originalImage] as? UIImage {
                onCapture(image)
            } else {
                onCancel()
            }
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            onCancel()
        }
    }
}

// MARK: - Image preparation

/// Photos go up as JPEG, longest side at most 2000 px, quality 0.8: sharp
/// enough to read a licence, small enough for a mobile connection.
enum RenterVerificationImagePrep {
    static let maxPixelDimension: CGFloat = 2000
    static let jpegQuality: CGFloat = 0.8

    /// Decodes library data straight to the upload size (upright), without
    /// holding the full-resolution photo in memory.
    static func image(from data: Data) -> UIImage? {
        let sourceOptions = [kCGImageSourceShouldCache: false] as CFDictionary
        guard let source = CGImageSourceCreateWithData(data as CFData, sourceOptions) else { return nil }
        let thumbnailOptions: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceShouldCacheImmediately: true,
            kCGImageSourceThumbnailMaxPixelSize: maxPixelDimension
        ]
        guard let cgImage = CGImageSourceCreateThumbnailAtIndex(source, 0, thumbnailOptions as CFDictionary) else {
            return nil
        }
        return UIImage(cgImage: cgImage)
    }

    /// Scales a camera photo down to the upload size and bakes in its orientation.
    static func scaled(_ image: UIImage) -> UIImage {
        let pixelWidth = image.size.width * image.scale
        let pixelHeight = image.size.height * image.scale
        let longest = max(pixelWidth, pixelHeight)
        guard longest > 0 else { return image }
        let ratio = min(1, maxPixelDimension / longest)
        if ratio >= 1, image.imageOrientation == .up { return image }

        let target = CGSize(
            width: max(1, (pixelWidth * ratio).rounded(.down)),
            height: max(1, (pixelHeight * ratio).rounded(.down))
        )
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        format.opaque = true
        return UIGraphicsImageRenderer(size: target, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: target))
        }
    }

    static func jpegData(_ image: UIImage) -> Data? {
        scaled(image).jpegData(compressionQuality: jpegQuality)
    }
}

import SwiftUI
import SafariServices
import PhotosUI
import UIKit

struct ContactScreen: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                SectionHeader(title: "Contact")

                Text("We are here to help with bookings, hosting and trip issues.")
                    .hayameCaptionStyle()

                VStack(alignment: .leading, spacing: 10) {
                    Label("support@hayamegh.com", systemImage: "envelope.fill")
                    Label("Accra Digital Centre, Ring Road West", systemImage: "mappin.and.ellipse")
                }
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)
                .hayameCard()
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Contact")
    }
}

struct PrivacyScreen: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                SectionHeader(title: "Privacy")
                Text("We store only the information required to operate bookings, payments, messages and listings. For account/data requests, contact support@hayamegh.com.")
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)
                    .hayameCard()
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Privacy")
    }
}

struct ProtectionScreen: View {
    private let sections: [(title: String, body: String)] = [
        (
            title: "Damage and incident reporting",
            body: "Hayame does not advertise bundled insurance on the platform today. Hosts should only list cars they are authorized to rent out and insure, and guests should report any new damage or trip issue promptly in Messages or Support."
        ),
        (
            title: "Trip records and support review",
            body: "Trip dates, pricing, messages, uploaded photos, and booking status are retained in the trip record so support can review cancellations, disputes, and post-trip issues consistently."
        ),
        (
            title: "Host and guest accountability",
            body: "Identity, phone, and email verification states are shown where available. When a policy breach or misuse report is raised, Hayame may review listing details, trip history, and conversation records before taking action."
        ),
        (
            title: "Deposits and extra fees",
            body: "If a listing includes a security deposit or trip fee, the amount is shown before checkout and recorded on the booking. Any deduction should be backed by trip evidence or an open dispute."
        ),
        (
            title: "Disputes and emergency support",
            body: "For accidents or immediate safety issues, contact local emergency services first. Then notify the other party and reach Hayame via Messages, the dispute flow, or support@hayamegh.com."
        )
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                SectionHeader(title: "Protection")
                Text("This page describes the support, evidence, and dispute process currently available on Hayame.")
                    .hayameCaptionStyle()

                Text("Hayame does not publish bundled insurance coverage on this page. Any third-party cover must be confirmed directly with the vehicle owner.")
                    .hayameCaptionStyle()
                    .hayameCard()

                ForEach(sections, id: \.title) { section in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(section.title)
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                            .foregroundStyle(HayameTheme.brandNavy)
                        Text(section.body)
                            .font(.system(size: 13, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                    .hayameCard()
                }
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Protection")
    }
}

struct CancellationPolicyScreen: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                SectionHeader(title: "Cancellation")

                VStack(alignment: .leading, spacing: 8) {
                    Text("Flexible")
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                    Text("Best for last-minute changes and quick rebooking.")
                        .hayameCaptionStyle()
                }
                .hayameCard()

                VStack(alignment: .leading, spacing: 8) {
                    Text("Moderate")
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                    Text("Balanced terms for guests and hosts. Default on new listings.")
                        .hayameCaptionStyle()
                }
                .hayameCard()

                VStack(alignment: .leading, spacing: 8) {
                    Text("Strict")
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                    Text("For high-demand inventory with higher late-cancel risk.")
                        .hayameCaptionStyle()
                }
                .hayameCard()
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Cancellation")
    }
}

struct HostPublicProfileScreen: View {
    let hostName: String
    let hostAvatar: String?
    let hostCars: [Car]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 12) {
                    hostAvatarView
                    VStack(alignment: .leading, spacing: 3) {
                        Text(hostName)
                            .font(.system(size: 24, weight: .bold, design: .rounded))
                            .foregroundStyle(HayameTheme.brandNavy)
                        Text("Verified host profile")
                            .hayameCaptionStyle()
                    }
                    Spacer()
                }

                VStack(alignment: .leading, spacing: 10) {
                    Label("ID Verified", systemImage: "checkmark.seal.fill")
                    Label("Phone Verified", systemImage: "phone.fill")
                    Label("Email Verified", systemImage: "envelope.fill")
                }
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundStyle(HayameTheme.brandNavy)
                .hayameCard()

                SectionHeader(title: "Listings")

                ForEach(hostCars) { car in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(car.displayTitle)
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                            .foregroundStyle(HayameTheme.brandNavy)
                        Text("\(car.city), \(car.region)")
                            .hayameCaptionStyle()
                        Text("GHS\(car.dailyPrice)/day")
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                            .foregroundStyle(HayameTheme.brandBlue)
                    }
                    .hayameCard()
                }
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Host")
    }

    @ViewBuilder
    private var hostAvatarView: some View {
        if let url = RemoteImageURLResolver.resolve(hostAvatar) {
            CachedRemoteImage(url: url, targetSize: CGSize(width: 54, height: 54)) {
                Circle().fill(HayameTheme.brandLight)
            } failure: {
                fallbackAvatar
            }
            .frame(width: 54, height: 54)
            .clipShape(Circle())
            .overlay(Circle().stroke(HayameTheme.controlStroke, lineWidth: 1))
        } else {
            fallbackAvatar
                .frame(width: 54, height: 54)
                .overlay(Circle().stroke(HayameTheme.controlStroke, lineWidth: 1))
        }
    }

    private var fallbackAvatar: some View {
        let initials = hostName
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

struct MarketingPagesListScreen: View {
    private struct MarketingPage: Identifiable {
        let id = UUID()
        let title: String
        let path: String
        let isFlagged: Bool
    }

    private let pages = [
        MarketingPage(title: "Airport Car Rental Accra", path: "/airport-car-rental-accra", isFlagged: false),
        MarketingPage(title: "Cheap Car Rental Ghana", path: "/cheap-car-rental-ghana", isFlagged: false),
        MarketingPage(title: "List Your Car Ghana", path: "/list-your-car-ghana", isFlagged: false),
        MarketingPage(title: "Peer-to-Peer Car Rental Ghana", path: "/peer-to-peer-car-rental-ghana", isFlagged: false),
        MarketingPage(title: "Rent a Car Accra", path: "/rent-a-car-accra", isFlagged: false),
        MarketingPage(title: "SUV Rental Ghana", path: "/suv-rental-ghana", isFlagged: false),
        MarketingPage(title: "Prices", path: "/prices", isFlagged: true),
        MarketingPage(title: "Blog", path: "/blog", isFlagged: true)
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                SectionHeader(title: "Marketing Pages")
                Text("SEO landing pages are best served as web content. These routes can be deep-linked to in-app webviews.")
                    .hayameCaptionStyle()

                ForEach(pages) { page in
                    NavigationLink {
                        MarketingWebPageScreen(
                            title: page.title,
                            url: URL(string: "https://www.hayame.com\(page.path)")
                        )
                    } label: {
                        HStack(spacing: 10) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(page.title)
                                    .font(.system(size: 14, weight: .semibold, design: .rounded))
                                    .foregroundStyle(HayameTheme.brandNavy)
                                if page.isFlagged {
                                    Text("Feature flagged off")
                                        .font(.system(size: 11, weight: .bold, design: .rounded))
                                        .foregroundStyle(HayameTheme.warning)
                                }
                            }
                            Spacer()
                            Image(systemName: "arrow.up.right.square")
                                .foregroundStyle(HayameTheme.brandBlue)
                        }
                        .hayameCard()
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Marketing")
    }
}

struct MarketingWebPageScreen: View {
    let title: String
    let url: URL?

    var body: some View {
        Group {
            if let url {
                SafariView(url: url)
                    .ignoresSafeArea(edges: .bottom)
            } else {
                EmptyStateView(
                    title: "URL unavailable",
                    message: "This page URL is not configured yet.",
                    systemImage: "network.slash"
                )
            }
        }
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct SafariView: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> SFSafariViewController {
        SFSafariViewController(url: url)
    }

    func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {}
}

struct BecomeHostScreen: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    @State private var fullName = ""
    @State private var phone = ""
    @State private var region = MockDataService.defaultRegion
    @State private var city = "Accra"
    @State private var idType = "Ghana Card"
    @State private var idNumber = ""
    @State private var idFrontPath = ""
    @State private var idBackPath = ""
    @State private var experience = ""
    @State private var fleetSize = 1
    @State private var note = ""
    @State private var facePhotoURL: String?

    @State private var idFrontPhotoItem: PhotosPickerItem?
    @State private var idBackPhotoItem: PhotosPickerItem?
    @State private var facePhotoItem: PhotosPickerItem?
    @State private var uploadErrorMessage: String?
    @State private var isUploadingIDFront = false
    @State private var isUploadingIDBack = false
    @State private var isUploadingFace = false
    @State private var isSubmittingApplication = false
    @State private var showSubmissionAlert = false
    @State private var submissionAlertMessage = ""
    @State private var showSubmissionErrorAlert = false
    @State private var submissionErrorMessage = ""

    private let idTypes = ["Ghana Card", "NHIS", "Voters ID", "Driving Licence"]
    private var isUploading: Bool { isUploadingIDFront || isUploadingIDBack || isUploadingFace }
    private var isApplicationUnderReview: Bool {
        appState.hostAccessState == .pending || appState.hostApplication?.status == .pending
    }

    private var submitBlockingReason: String? {
        if !appState.isAuthenticated {
            return "Sign in to submit your host application."
        }
        if isApplicationUnderReview {
            return "Your application is under review."
        }
        if isUploading {
            return "Please wait for uploads to finish."
        }
        if fullName.trimmingCharacters(in: .whitespacesAndNewlines).count < 2 {
            return "Enter your full name (at least 2 characters)."
        }
        if phone.trimmingCharacters(in: .whitespacesAndNewlines).count < 6 {
            return "Enter a valid phone number (at least 6 digits)."
        }
        if region.trimmingCharacters(in: .whitespacesAndNewlines).count < 2 ||
            city.trimmingCharacters(in: .whitespacesAndNewlines).count < 2 {
            return "Select your region and city."
        }
        if idType.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return "Select an ID type."
        }
        if idNumber.trimmingCharacters(in: .whitespacesAndNewlines).count < 4 {
            return "Enter your ID number (at least 4 characters)."
        }
        if idFrontPath.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return "Upload your ID front image."
        }
        if idBackPath.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return "Upload your ID back image."
        }
        if experience.trimmingCharacters(in: .whitespacesAndNewlines).count < 3 {
            return "Add a short hosting experience (at least 3 characters)."
        }
        return nil
    }

    private var canSubmit: Bool {
        submitBlockingReason == nil
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                SectionHeader(title: "Become Host")
                Text("Apply to list your cars")
                    .hayameCaptionStyle()
                Text("We verify every host to keep the marketplace safe. Applications are typically reviewed within 1-2 business days.")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)

                if let hostApplication = appState.hostApplication {
                    HStack {
                        Text("Status")
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                        Spacer()
                        Text(hostApplication.status.rawValue.capitalized)
                            .font(.system(size: 13, weight: .bold, design: .rounded))
                            .foregroundStyle(hostApplication.status == .approved ? HayameTheme.success : HayameTheme.warning)
                    }
                    .hayameCard()

                    if appState.hostAccessState == .host {
                        Button("Open Host Dashboard") {
                            appState.switchToHostMode()
                            dismiss()
                        }
                        .buttonStyle(PrimaryPillButtonStyle())
                    } else if appState.hostAccessState == .pending {
                        Text("Your application is pending review. You will get host access once approved.")
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(HayameTheme.warning)
                    }
                }

                if !appState.isAuthenticated {
                    EmptyStateView(
                        title: "Log in required",
                        message: "Sign in to submit your host application.",
                        systemImage: "person.crop.circle.badge.exclamationmark"
                    )
                    Button("Log in") {
                        appState.returnToAuth()
                    }
                    .buttonStyle(PrimaryPillButtonStyle())
                } else {
                    Group {
                        TextField("Full name", text: $fullName)
                        TextField("Phone", text: $phone)

                        MenuField(title: "Region", selection: $region, items: MockDataService.regionsIncluding(region))
                        MenuField(title: "City", selection: $city, items: MockDataService.cities(for: region, preferred: city))
                        MenuField(title: "ID type", selection: $idType, items: idTypes)

                        TextField("ID number", text: $idNumber)
                        TextField("Hosting experience", text: $experience, axis: .vertical)
                            .lineLimit(3...6)
                        Stepper("Fleet size: \(fleetSize)", value: $fleetSize, in: 1...50)
                        TextField("Notes (optional)", text: $note, axis: .vertical)
                            .lineLimit(2...5)
                    }
                    .textFieldStyle(.roundedBorder)

                    VStack(alignment: .leading, spacing: 8) {
                        Text("ID front image")
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                        PhotosPicker(selection: $idFrontPhotoItem, matching: .images) {
                            Text(isUploadingIDFront ? "Uploading..." : (idFrontPath.isEmpty ? "Upload ID front" : "Replace ID front"))
                        }
                        .buttonStyle(SecondaryPillButtonStyle())
                        .disabled(isUploading)
                        if !idFrontPath.isEmpty {
                            Label("ID front uploaded", systemImage: "checkmark.circle.fill")
                                .font(.system(size: 12, weight: .semibold, design: .rounded))
                                .foregroundStyle(HayameTheme.success)
                        }
                    }
                    .hayameCard()

                    VStack(alignment: .leading, spacing: 8) {
                        Text("ID back image")
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                        PhotosPicker(selection: $idBackPhotoItem, matching: .images) {
                            Text(isUploadingIDBack ? "Uploading..." : (idBackPath.isEmpty ? "Upload ID back" : "Replace ID back"))
                        }
                        .buttonStyle(SecondaryPillButtonStyle())
                        .disabled(isUploading)
                        if !idBackPath.isEmpty {
                            Label("ID back uploaded", systemImage: "checkmark.circle.fill")
                                .font(.system(size: 12, weight: .semibold, design: .rounded))
                                .foregroundStyle(HayameTheme.success)
                        }
                    }
                    .hayameCard()

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Face photo")
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)

                        HStack(spacing: 12) {
                            facePhotoPreview
                            VStack(alignment: .leading, spacing: 6) {
                                Text("Use a clear selfie that matches your ID.")
                                    .font(.system(size: 12, weight: .medium, design: .rounded))
                                    .foregroundStyle(HayameTheme.mutedText)
                                PhotosPicker(selection: $facePhotoItem, matching: .images) {
                                    Text(isUploadingFace ? "Uploading..." : "Upload face photo")
                                }
                                .buttonStyle(SecondaryPillButtonStyle())
                                .disabled(isUploading)
                            }
                        }
                    }
                    .hayameCard()

                    if let uploadErrorMessage, !uploadErrorMessage.isEmpty {
                        Text(uploadErrorMessage)
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(HayameTheme.danger)
                    }

                    if let syncMessage = appState.syncErrorMessage, !syncMessage.isEmpty {
                        Text(syncMessage)
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(HayameTheme.danger)
                    }

                    if let submitBlockingReason, !submitBlockingReason.isEmpty {
                        Text(submitBlockingReason)
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(HayameTheme.warning)
                    }

                    Button(
                        isUploading
                            ? "Uploading..."
                            : (isSubmittingApplication ? "Submitting..." : "Submit application")
                    ) {
                        let application = HostApplication(
                            id: UUID().uuidString,
                            fullName: fullName,
                            phone: phone,
                            region: region,
                            city: city,
                            idType: idType,
                            idNumber: idNumber,
                            experience: experience,
                            fleetSize: fleetSize,
                            note: note,
                            status: .pending,
                            rejectionReason: nil,
                            idFrontPath: idFrontPath,
                            idBackPath: idBackPath,
                            facePhotoURL: facePhotoURL
                        )
                        Task {
                            guard !isSubmittingApplication else { return }
                            isSubmittingApplication = true
                            let submitted = await appState.submitHostApplicationNow(application)
                            isSubmittingApplication = false
                            if submitted {
                                submissionAlertMessage = "Your host request is being reviewed. We will email you once there is an update."
                                showSubmissionAlert = true
                            } else {
                                submissionErrorMessage = appState.syncErrorMessage?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
                                    ? appState.syncErrorMessage!
                                    : "Unable to submit application. Please check your details and try again."
                                showSubmissionErrorAlert = true
                            }
                        }
                    }
                    .buttonStyle(PrimaryPillButtonStyle())
                    .disabled(!canSubmit || isSubmittingApplication)
                    .opacity((canSubmit && !isSubmittingApplication) ? 1 : 0.55)
                }
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Become Host")
        .alert("Application submitted", isPresented: $showSubmissionAlert) {
            Button("Go to dashboard") {
                appState.renterTab = .dashboard
                dismiss()
            }
        } message: {
            Text(submissionAlertMessage)
        }
        .alert("Unable to submit", isPresented: $showSubmissionErrorAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(submissionErrorMessage)
        }
        .onChange(of: region) { _, newValue in
            let options = MockDataService.cities(for: newValue, preferred: city)
            if !options.contains(where: { $0.caseInsensitiveCompare(city) == .orderedSame }) {
                city = options.first ?? city
            }
        }
        .onChange(of: idFrontPhotoItem) { _, newValue in
            guard let newValue else { return }
            Task {
                await uploadHostID(item: newValue, side: "front")
                idFrontPhotoItem = nil
            }
        }
        .onChange(of: idBackPhotoItem) { _, newValue in
            guard let newValue else { return }
            Task {
                await uploadHostID(item: newValue, side: "back")
                idBackPhotoItem = nil
            }
        }
        .onChange(of: facePhotoItem) { _, newValue in
            guard let newValue else { return }
            Task {
                await uploadFacePhoto(item: newValue)
                facePhotoItem = nil
            }
        }
        .onAppear {
            fullName = appState.hostApplication?.fullName ?? appState.currentUser.fullName
            phone = appState.hostApplication?.phone ?? appState.currentUser.phone
            region = appState.hostApplication?.region ?? MockDataService.normalizedRegion(appState.currentUser.region)
            city = appState.hostApplication?.city ?? appState.currentUser.city
            idType = appState.hostApplication?.idType ?? "Ghana Card"
            idNumber = appState.hostApplication?.idNumber ?? ""
            experience = appState.hostApplication?.experience ?? ""
            fleetSize = appState.hostApplication?.fleetSize ?? 1
            note = appState.hostApplication?.note ?? ""
            idFrontPath = appState.hostApplication?.idFrontPath ?? ""
            idBackPath = appState.hostApplication?.idBackPath ?? ""
            facePhotoURL = appState.hostApplication?.facePhotoURL ?? appState.currentUser.avatar
            uploadErrorMessage = nil
        }
    }

    @ViewBuilder
    private var facePhotoPreview: some View {
        if let url = RemoteImageURLResolver.resolve(facePhotoURL) {
            CachedRemoteImage(url: url, targetSize: CGSize(width: 120, height: 120)) {
                Circle().fill(HayameTheme.brandLight)
            } failure: {
                fallbackFacePhoto
            }
            .frame(width: 64, height: 64)
            .clipShape(Circle())
            .overlay(Circle().stroke(HayameTheme.controlStroke, lineWidth: 1))
        } else {
            fallbackFacePhoto
                .frame(width: 64, height: 64)
                .overlay(Circle().stroke(HayameTheme.controlStroke, lineWidth: 1))
        }
    }

    private var fallbackFacePhoto: some View {
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
    private func uploadHostID(item: PhotosPickerItem, side: String) async {
        if side == "front" {
            guard !isUploadingIDFront else { return }
            isUploadingIDFront = true
        } else {
            guard !isUploadingIDBack else { return }
            isUploadingIDBack = true
        }
        uploadErrorMessage = nil
        defer {
            if side == "front" {
                isUploadingIDFront = false
            } else {
                isUploadingIDBack = false
            }
        }

        do {
            guard let sourceData = try await item.loadTransferable(type: Data.self),
                  let image = UIImage(data: sourceData),
                  let jpegData = image.jpegData(compressionQuality: 0.86) else {
                throw APIError(message: "Unable to read selected image.")
            }
            let storagePath = try await appState.uploadHostIdentityDocument(
                side: side,
                fileData: jpegData,
                fileExtension: "jpg",
                mimeType: "image/jpeg"
            )
            if side == "front" {
                idFrontPath = storagePath
            } else {
                idBackPath = storagePath
            }
        } catch {
            let message = AppState.userFacingMessage(error, fallback: "Something went wrong. Please try again.")
            uploadErrorMessage = message.isEmpty ? "Unable to upload ID image." : message
        }
    }

    @MainActor
    private func uploadFacePhoto(item: PhotosPickerItem) async {
        guard !isUploadingFace else { return }
        isUploadingFace = true
        uploadErrorMessage = nil
        defer { isUploadingFace = false }

        do {
            guard let sourceData = try await item.loadTransferable(type: Data.self),
                  let image = UIImage(data: sourceData),
                  let jpegData = image.jpegData(compressionQuality: 0.86) else {
                throw APIError(message: "Unable to read selected image.")
            }
            let uploadedURL = try await appState.uploadProfileAvatar(
                fileData: jpegData,
                fileExtension: "jpg",
                mimeType: "image/jpeg"
            )
            facePhotoURL = uploadedURL
        } catch {
            let message = AppState.userFacingMessage(error, fallback: "Something went wrong. Please try again.")
            uploadErrorMessage = message.isEmpty ? "Unable to upload face photo." : message
        }
    }
}

private struct MenuField: View {
    let title: String
    @Binding var selection: String
    let items: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundStyle(HayameTheme.mutedText)

            Menu {
                ForEach(items, id: \.self) { item in
                    Button(item) {
                        selection = item
                    }
                }
            } label: {
                HStack {
                    Text(selection)
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Spacer()
                    Image(systemName: "chevron.down")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(HayameTheme.mutedText)
                }
                .padding(12)
                .background(HayameTheme.fieldBackground)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(HayameTheme.controlStroke, lineWidth: 1))
            }
        }
    }
}

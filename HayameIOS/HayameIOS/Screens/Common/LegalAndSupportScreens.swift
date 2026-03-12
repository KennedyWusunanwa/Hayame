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
                    Label("+233 (0) 55 555 5555", systemImage: "phone.fill")
                    Label("support@hayame.com", systemImage: "envelope.fill")
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
                Text("We store only the information required to operate bookings, payments, messages and listings. For account/data requests, contact support@hayame.com.")
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
    private let sections = [
        "Damage protection",
        "Host protection",
        "Trip coverage",
        "Deposit protection",
        "Disputes and emergency support"
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                SectionHeader(title: "Protection")
                Text("Coverage details are informational and may vary by policy rollout.")
                    .hayameCaptionStyle()

                ForEach(sections, id: \.self) { section in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(section)
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                            .foregroundStyle(HayameTheme.brandNavy)
                        Text("Coming soon. Final terms and claim workflow will appear here.")
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
            .overlay(Circle().stroke(Color.black.opacity(0.08), lineWidth: 1))
        } else {
            fallbackAvatar
                .frame(width: 54, height: 54)
                .overlay(Circle().stroke(Color.black.opacity(0.08), lineWidth: 1))
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

    private let idTypes = ["Ghana Card", "NHIS", "Voters ID", "Driving Licence"]
    private var isUploading: Bool { isUploadingIDFront || isUploadingIDBack || isUploadingFace }
    private var canSubmit: Bool {
        appState.isAuthenticated &&
        !isUploading &&
        !fullName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !phone.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !region.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !city.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !idType.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !idNumber.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !idFrontPath.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !idBackPath.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        experience.trimmingCharacters(in: .whitespacesAndNewlines).count >= 10
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

                    Button(isUploading ? "Uploading..." : "Submit application") {
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
                        appState.submitHostApplication(application)
                    }
                    .buttonStyle(PrimaryPillButtonStyle())
                    .disabled(!canSubmit)
                }
            }
            .padding(16)
        }
        .background(HayameTheme.pageBackground)
        .navigationTitle("Become Host")
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
            .overlay(Circle().stroke(Color.black.opacity(0.08), lineWidth: 1))
        } else {
            fallbackFacePhoto
                .frame(width: 64, height: 64)
                .overlay(Circle().stroke(Color.black.opacity(0.08), lineWidth: 1))
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
            let message = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
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
            let message = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
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
                .background(.white)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.black.opacity(0.08), lineWidth: 1))
            }
        }
    }
}

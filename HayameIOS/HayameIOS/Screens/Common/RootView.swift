import SwiftUI
import UIKit

struct RootView: View {
    @EnvironmentObject private var appState: AppState
    @AppStorage("hayame.host_status.last_user_id") private var lastHostStatusUserID = ""
    @AppStorage("hayame.host_status.last_value") private var lastHostStatusValue = ""
    @State private var showHostApprovedAlert = false
    @State private var deepLinkedCar: Car?

    var body: some View {
        ZStack {
            Group {
                if appState.hasAppAccess {
                    if appState.isAuthenticated && appState.hostAccessState == .host && appState.hostModeEnabled {
                        HostTabShell()
                    } else {
                        RenterTabShell()
                    }
                } else {
                    AuthFlowScreen()
                }
            }

            if let announcement = appState.activeAnnouncement, appState.canPresentActiveAnnouncement {
                Color.black.opacity(0.36)
                    .ignoresSafeArea()
                    .onTapGesture {
                        appState.dismissActiveAnnouncement()
                    }

                AppAnnouncementOverlay(announcement: announcement) {
                    appState.dismissActiveAnnouncement()
                }
                .padding(20)
            }
        }
        .background(HayameTheme.pageBackground.ignoresSafeArea())
        .simultaneousGesture(TapGesture().onEnded { dismissKeyboard() })
        .dismissKeyboardOnBackgroundTap()
        .onAppear {
            syncHostStatusCache()
        }
        .onChange(of: appState.hostApplicationStatus) { _, _ in
            syncHostStatusCache()
        }
        .onChange(of: appState.currentUser.id) { _, _ in
            syncHostStatusCache()
        }
        .onChange(of: appState.isAuthenticated) { _, _ in
            syncHostStatusCache()
        }
        .alert("Host Application Approved", isPresented: $showHostApprovedAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("Your host application has been approved. You can now switch to host mode.")
        }
        .animation(.easeInOut(duration: 0.2), value: appState.activeAnnouncement?.id)
        .onChange(of: appState.pendingCarDeepLinkID) { _, id in
            resolveDeepLinkedCar(id: id)
        }
        .onAppear {
            resolveDeepLinkedCar(id: appState.pendingCarDeepLinkID)
        }
        .fullScreenCover(item: $deepLinkedCar, onDismiss: {
            appState.pendingCarDeepLinkID = nil
        }) { car in
            NavigationStack {
                CarDetailScreen(car: car)
                    .toolbar {
                        ToolbarItem(placement: .topBarLeading) {
                            Button {
                                deepLinkedCar = nil
                            } label: {
                                Image(systemName: "xmark")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(HayameTheme.mutedText)
                                    .frame(width: 30, height: 30)
                                    .background(HayameTheme.subtleFill)
                                    .clipShape(Circle())
                            }
                        }
                    }
            }
        }
    }

    // A Universal Link (hayamegh.com/cars/{id}) may arrive before that car
    // is in appState.cars — fetch it directly rather than waiting on the
    // general listings sync.
    private func resolveDeepLinkedCar(id: String?) {
        guard let id else {
            deepLinkedCar = nil
            return
        }
        if let existing = appState.cars.first(where: { $0.id == id }) {
            deepLinkedCar = existing
            return
        }
        Task {
            await appState.refreshCarDetail(carID: id)
            guard appState.pendingCarDeepLinkID == id else { return }
            if let fetched = appState.cars.first(where: { $0.id == id }) {
                deepLinkedCar = fetched
            } else {
                appState.pendingCarDeepLinkID = nil
            }
        }
    }

    private func syncHostStatusCache() {
        guard appState.isAuthenticated, appState.currentUser.id != UserProfile.anonymousGuest.id else {
            return
        }

        let currentUserID = appState.currentUser.id
        let currentStatus = (appState.hostApplicationStatus ?? "").lowercased()

        if lastHostStatusUserID != currentUserID {
            lastHostStatusUserID = currentUserID
            lastHostStatusValue = currentStatus
            return
        }

        if currentStatus == "approved" && lastHostStatusValue == "pending" {
            showHostApprovedAlert = true
        }

        lastHostStatusValue = currentStatus
    }
}

private func dismissKeyboard() {
    UIApplication.shared.sendAction(
        #selector(UIResponder.resignFirstResponder),
        to: nil,
        from: nil,
        for: nil
    )
}

private extension View {
    func dismissKeyboardOnBackgroundTap() -> some View {
        background(KeyboardDismissBackgroundTapView())
    }
}

private struct KeyboardDismissBackgroundTapView: UIViewRepresentable {
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

private struct AppAnnouncementOverlay: View {
    let announcement: AppAnnouncement
    let onDismiss: () -> Void

    @Environment(\.openURL) private var openURL

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .top, spacing: 14) {
                ZStack {
                    Circle()
                        .fill(HayameTheme.brandBlue.opacity(0.12))
                        .frame(width: 48, height: 48)
                    Image(systemName: announcement.category.lowercased() == "news" ? "megaphone.fill" : "bell.badge.fill")
                        .font(.system(size: 19, weight: .semibold))
                        .foregroundStyle(HayameTheme.brandBlue)
                }

                VStack(alignment: .leading, spacing: 7) {
                    Text(badgeTitle)
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .tracking(0.6)
                        .textCase(.uppercase)
                        .foregroundStyle(HayameTheme.brandBlue)

                    Text(announcement.title)
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandNavy)
                        .fixedSize(horizontal: false, vertical: true)
                }

                Spacer(minLength: 8)

                Button(action: onDismiss) {
                    Image(systemName: "xmark")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(HayameTheme.mutedText)
                        .frame(width: 38, height: 38)
                        .background(Circle().fill(HayameTheme.fieldBackground))
                }
                .buttonStyle(.plain)
            }

            Text(announcement.body)
                .font(.system(size: 16, weight: .medium, design: .rounded))
                .lineSpacing(3)
                .foregroundStyle(HayameTheme.brandNavy.opacity(0.88))
                .fixedSize(horizontal: false, vertical: true)
                .lineLimit(8)

            if announcement.showOnce {
                Text("This notice is shown once on this device.")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)
            }

            HStack(spacing: 10) {
                if let ctaLabel = announcement.ctaLabel, let ctaURL = announcement.ctaURL, let url = URL(string: ctaURL) {
                    Button(ctaLabel) {
                        openURL(url)
                        onDismiss()
                    }
                    .buttonStyle(PrimaryPillButtonStyle())
                }

                Button(announcement.ctaURL == nil ? "Got it" : "Not now") {
                    onDismiss()
                }
                .buttonStyle(SecondaryPillButtonStyle())
            }
        }
        .padding(24)
        .frame(maxWidth: 390)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(HayameTheme.cardBackground)
                .shadow(color: Color.black.opacity(0.18), radius: 28, x: 0, y: 16)
        )
    }

    private var badgeTitle: String {
        announcement.category.lowercased() == "news" ? "News & announcements" : "App notice"
    }
}

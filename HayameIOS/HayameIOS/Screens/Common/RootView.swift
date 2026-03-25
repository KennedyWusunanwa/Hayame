import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appState: AppState
    @AppStorage("hayame.host_status.last_user_id") private var lastHostStatusUserID = ""
    @AppStorage("hayame.host_status.last_value") private var lastHostStatusValue = ""
    @State private var showHostApprovedAlert = false

    var body: some View {
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
        .background(HayameTheme.pageBackground.ignoresSafeArea())
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

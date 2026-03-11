import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Group {
            if appState.hasAppAccess {
                if appState.currentUser.role == .admin {
                    AdminShellScreen()
                } else if appState.isAuthenticated && appState.hostAccessState == .host {
                    HostTabShell()
                } else if appState.isAuthenticated && appState.hostAccessState == .pending {
                    HostApplicationPendingScreen()
                } else {
                    RenterTabShell()
                }
            } else {
                AuthFlowScreen()
            }
        }
        .background(HayameTheme.pageBackground.ignoresSafeArea())
    }
}

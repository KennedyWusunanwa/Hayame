import SwiftUI
import LocalAuthentication
import Security

struct AuthFlowScreen: View {
    @EnvironmentObject private var appState: AppState
    @State private var selectedTab: AuthTab = .login

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if selectedTab == .login {
                    LoginScreenView(
                        goToSignup: { selectedTab = .signup },
                        onContinueAsGuest: { appState.continueAsGuest() }
                    )
                } else {
                    SignupScreenView(
                        goToLogin: { selectedTab = .login },
                        onContinueAsGuest: { appState.continueAsGuest() }
                    )
                }
            }
            .background(Color(red: 0.969, green: 0.980, blue: 1.0).ignoresSafeArea())
            .toolbar(.hidden, for: .navigationBar)
        }
    }
}

private struct LoginScreenView: View {
    @EnvironmentObject private var appState: AppState

    @State private var email = ""
    @State private var password = ""
    @State private var passwordVisible = false
    @State private var biometricTitle = "Log in with Face ID"
    @State private var biometricsAvailable = false
    @State private var hasSavedBiometricLogin = false
    @State private var saveLoginWithBiometrics = true
    @State private var biometricMessage: String?

    let goToSignup: () -> Void
    let onContinueAsGuest: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            AuthScaffold(
                title: "Welcome back.",
                subtitle: "Log in to continue",
                selectedTab: .login,
                onTabChange: { if $0 == .signup { goToSignup() } }
            ) {
                AuthField(label: "Email", placeholder: "you@example.com", text: $email, keyboardType: .emailAddress)
                    .textContentType(.username)

                AuthSecureField(label: "Password", text: $password, isVisible: $passwordVisible)
                    .textContentType(.password)

                AuthPrimaryButton(
                    title: appState.isSyncingRemote ? "Logging in..." : "Log in",
                    action: {
                        appState.signIn(email: email, password: password) {
                            saveCurrentLoginForBiometricsIfNeeded()
                        }
                    },
                    isLoading: appState.isSyncingRemote,
                    isDisabled: appState.isSyncingRemote
                )

                if biometricsAvailable {
                    Toggle(isOn: $saveLoginWithBiometrics) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Save login for \(biometricName)")
                                .font(.system(size: 13, weight: .semibold, design: .rounded))
                                .foregroundStyle(Color(red: 0.039, green: 0.169, blue: 0.329))
                            Text("Use it for quick login after signing out.")
                                .font(.system(size: 11, weight: .medium, design: .rounded))
                                .foregroundStyle(Color(red: 0.451, green: 0.490, blue: 0.569))
                        }
                    }
                    .toggleStyle(.switch)
                    .tint(Color(red: 0.078, green: 0.518, blue: 0.851))
                }

                if hasSavedBiometricLogin {
                    AuthBiometricButton(title: biometricTitle) {
                        authenticateWithBiometrics()
                    }
                }

                VStack(spacing: 10) {
                    Button("Forgot password?") {
                        appState.requestPasswordReset(email: email)
                    }
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundStyle(Color(red: 0.078, green: 0.518, blue: 0.851))
                    .disabled(appState.isSyncingRemote)

                    if !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        Button("Resend verification email") {
                            appState.resendSignupConfirmation(email: email)
                        }
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                        .foregroundStyle(Color(red: 0.078, green: 0.518, blue: 0.851))
                        .disabled(appState.isSyncingRemote)
                    }

                    HStack(spacing: 4) {
                        Text("No account?")
                            .font(.system(size: 13, design: .rounded))
                            .foregroundStyle(Color(red: 0.451, green: 0.490, blue: 0.569))
                        Button("Sign up", action: goToSignup)
                            .font(.system(size: 13, weight: .semibold, design: .rounded))
                            .foregroundStyle(Color(red: 0.078, green: 0.518, blue: 0.851))
                    }
                }
                .frame(maxWidth: .infinity)

                AuthMessages(error: appState.syncErrorMessage, info: appState.authInfoMessage ?? biometricMessage)
            }

            AuthGuestButton(action: onContinueAsGuest)
        }
        .onAppear(perform: refreshBiometricState)
    }

    private var biometricName: String {
        biometricTitle.replacingOccurrences(of: "Log in with ", with: "")
    }

    private func refreshBiometricState() {
        let context = LAContext()
        var error: NSError?
        let canEvaluate = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
        biometricsAvailable = canEvaluate
        hasSavedBiometricLogin = canEvaluate && BiometricCredentialStore.hasCredentials
        biometricTitle = context.biometryType == .touchID ? "Log in with Touch ID" : "Log in with Face ID"
    }

    private func saveCurrentLoginForBiometricsIfNeeded() {
        guard saveLoginWithBiometrics, biometricsAvailable else { return }
        BiometricCredentialStore.save(email: email, password: password)
        biometricMessage = "\(biometricName) login saved for next time."
        refreshBiometricState()
    }

    private func authenticateWithBiometrics() {
        let context = LAContext()
        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            biometricMessage = "Biometric login is not available on this device."
            return
        }

        let reason = "Use biometrics to log in to Hayame."
        context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason) { success, authError in
            DispatchQueue.main.async {
                guard success else {
                    biometricMessage = authError?.localizedDescription ?? "Biometric login was cancelled."
                    return
                }
                guard let credentials = BiometricCredentialStore.load() else {
                    biometricMessage = "Log in once with email and password to enable biometric login."
                    refreshBiometricState()
                    return
                }
                email = credentials.email
                password = credentials.password
                appState.signIn(email: credentials.email, password: credentials.password)
            }
        }
    }
}

private struct SignupScreenView: View {
    @EnvironmentObject private var appState: AppState

    @State private var firstName = ""
    @State private var lastName = ""
    @State private var email = ""
    @State private var password = ""
    @State private var passwordVisible = false
    @State private var region = MockDataService.defaultRegion
    @State private var city = "Accra"
    @State private var showSignupConfirmationAlert = false

    let goToLogin: () -> Void
    let onContinueAsGuest: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            AuthScaffold(
                title: "Create your account.",
                subtitle: "Start renting in minutes",
                selectedTab: .signup,
                onTabChange: { if $0 == .login { goToLogin() } }
            ) {
                HStack(spacing: 12) {
                    AuthField(label: "First name", placeholder: "Ama", text: $firstName)
                    AuthField(label: "Last name", placeholder: "Owusu", text: $lastName)
                }

                AuthField(label: "Email", placeholder: "you@example.com", text: $email, keyboardType: .emailAddress)
                    .textContentType(.username)

                HStack(spacing: 12) {
                    AuthSelectField(label: "Region", selected: $region, options: MockDataService.regionsIncluding(region))
                    AuthSelectField(label: "City", selected: $city, options: MockDataService.cities(for: region, preferred: city))
                }

                AuthSecureField(label: "Password", text: $password, isVisible: $passwordVisible)
                    .textContentType(.newPassword)

                AuthPrimaryButton(
                    title: appState.isSyncingRemote ? "Creating account..." : "Create account",
                    action: {
                        appState.signUp(
                            firstName: firstName,
                            lastName: lastName,
                            email: email,
                            city: city,
                            region: region,
                            password: password
                        )
                    },
                    isLoading: appState.isSyncingRemote,
                    isDisabled: appState.isSyncingRemote
                )

                HStack(spacing: 4) {
                    Text("Already registered?")
                        .font(.system(size: 13, design: .rounded))
                        .foregroundStyle(Color(red: 0.451, green: 0.490, blue: 0.569))
                    Button("Log in", action: goToLogin)
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                        .foregroundStyle(Color(red: 0.078, green: 0.518, blue: 0.851))
                }
                .frame(maxWidth: .infinity)

                AuthMessages(error: appState.syncErrorMessage, info: appState.authInfoMessage)

                if !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    Button("Resend verification email") {
                        appState.resendSignupConfirmation(email: email)
                    }
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundStyle(Color(red: 0.078, green: 0.518, blue: 0.851))
                    .frame(maxWidth: .infinity)
                    .disabled(appState.isSyncingRemote)
                }
            }

            AuthGuestButton(action: onContinueAsGuest)
        }
        .onChange(of: region) { _, newValue in
            let options = MockDataService.cities(for: newValue, preferred: city)
            if !options.contains(where: { $0.caseInsensitiveCompare(city) == .orderedSame }) {
                city = options.first ?? city
            }
        }
        .onChange(of: appState.signupConfirmationPromptMessage) { _, newValue in
            guard newValue != nil else { return }
            showSignupConfirmationAlert = true
        }
        .alert("Confirm your email", isPresented: $showSignupConfirmationAlert) {
            Button("Go to log in") {
                appState.consumeSignupConfirmationPrompt()
                goToLogin()
            }
        } message: {
            Text(appState.signupConfirmationPromptMessage ?? "Account created. Check your inbox/spam for verification email, then log in.")
        }
    }
}

private struct AuthMessages: View {
    let error: String?
    let info: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let error, !error.isEmpty {
                Text(error)
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(HayameTheme.danger)
            }
            if let info, !info.isEmpty {
                Text(info)
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(HayameTheme.success)
            }
        }
    }
}

private enum BiometricCredentialStore {
    private static let service = "com.hayame.app.biometric-login"
    private static let account = "primary"

    static var hasCredentials: Bool {
        load() != nil
    }

    static func save(email: String, password: String) {
        let payload = ["email": email.trimmingCharacters(in: .whitespacesAndNewlines), "password": password]
        guard let data = try? JSONEncoder().encode(payload) else { return }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        SecItemDelete(query as CFDictionary)
        var attributes = query
        attributes[kSecValueData as String] = data
        attributes[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        SecItemAdd(attributes as CFDictionary, nil)
    }

    static func load() -> (email: String, password: String)? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var result: AnyObject?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data,
              let payload = try? JSONDecoder().decode([String: String].self, from: data),
              let email = payload["email"],
              let password = payload["password"],
              !email.isEmpty,
              !password.isEmpty else {
            return nil
        }
        return (email, password)
    }
}

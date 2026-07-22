import SwiftUI
import LocalAuthentication
import Security

struct AuthFlowScreen: View {
    @EnvironmentObject private var appState: AppState
    @State private var selectedTab: AuthTab

    init(initialTab: AuthTab = .login) {
        _selectedTab = State(initialValue: initialTab)
    }

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
            .background(HayameTheme.pageBackground.ignoresSafeArea())
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
    @State private var showLoginErrorAlert = false

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
                                .foregroundStyle(HayameTheme.brandNavy)
                            Text("Use it for quick login after signing out.")
                                .font(.system(size: 11, weight: .medium, design: .rounded))
                                .foregroundStyle(HayameTheme.mutedText)
                        }
                    }
                    .toggleStyle(.switch)
                    .tint(HayameTheme.brandBlue)
                }

                if hasSavedBiometricLogin {
                    AuthBiometricButton(title: biometricTitle) {
                        authenticateWithBiometrics()
                    }
                }

                // When the only thing wrong is an unverified address, the fix is
                // one tap away — so make it a real button rather than a link
                // buried under "Forgot password?".
                if appState.loginNeedsEmailVerification,
                   !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    Button {
                        appState.resendSignupConfirmation(email: email)
                    } label: {
                        Text("Resend verification email")
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(HayameTheme.brandBlue, lineWidth: 1.5)
                            )
                            .foregroundStyle(HayameTheme.brandBlue)
                    }
                    .disabled(appState.isSyncingRemote)
                }

                VStack(spacing: 10) {
                    Button("Forgot password?") {
                        appState.requestPasswordReset(email: email)
                    }
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandBlue)
                    .disabled(appState.isSyncingRemote)

                    if !appState.loginNeedsEmailVerification,
                       !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        Button("Resend verification email") {
                            appState.resendSignupConfirmation(email: email)
                        }
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandBlue)
                        .disabled(appState.isSyncingRemote)
                    }

                    HStack(spacing: 4) {
                        Text("No account?")
                            .font(.system(size: 13, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                        Button("Sign up", action: goToSignup)
                            .font(.system(size: 13, weight: .semibold, design: .rounded))
                            .foregroundStyle(HayameTheme.brandBlue)
                    }
                }
                .frame(maxWidth: .infinity)

                AuthMessages(error: nil, info: appState.authInfoMessage ?? biometricMessage)
            }

            AuthGuestButton(action: onContinueAsGuest)
        }
        .onAppear {
            refreshBiometricState()
            showLoginErrorAlert = appState.loginErrorAlertMessage != nil
        }
        .onChange(of: appState.loginErrorAlertMessage) { _, newValue in
            showLoginErrorAlert = newValue != nil
        }
        .alert("Unable to log in", isPresented: $showLoginErrorAlert) {
            Button("OK") {
                appState.consumeLoginErrorAlert()
            }
        } message: {
            Text(appState.loginErrorAlertMessage ?? "Wrong email or password.")
        }
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
                    // Never surface the raw LAError text (e.g. "Biometry is locked out…").
                    biometricMessage = authError == nil
                        ? "Biometric login was cancelled."
                        : "Couldn't sign in with biometrics. Please use your email and password."
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
    @State private var confirmPassword = ""
    @State private var passwordVisible = false
    @State private var confirmPasswordVisible = false
    @State private var region = MockDataService.defaultRegion
    @State private var city = "Accra"
    @State private var showSignupConfirmationAlert = false

    let goToLogin: () -> Void
    let onContinueAsGuest: () -> Void

    private var passwordStrength: PasswordPolicy.Strength {
        PasswordPolicy.grade(password)
    }

    private var passwordsMatch: Bool {
        !confirmPassword.isEmpty && confirmPassword == password
    }

    private var mismatchMessage: String? {
        guard !confirmPassword.isEmpty, confirmPassword != password else { return nil }
        return "Those passwords don't match."
    }

    private var canSubmit: Bool {
        !firstName.trimmingCharacters(in: .whitespaces).isEmpty
            && !lastName.trimmingCharacters(in: .whitespaces).isEmpty
            && !email.trimmingCharacters(in: .whitespaces).isEmpty
            && passwordStrength.meetsPolicy
            && passwordsMatch
    }

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

                VStack(alignment: .leading, spacing: 10) {
                    AuthSecureField(label: "Password", text: $password, isVisible: $passwordVisible)
                        .textContentType(.newPassword)
                    PasswordStrengthView(password: password)
                }

                VStack(alignment: .leading, spacing: 6) {
                    AuthSecureField(
                        label: "Confirm password",
                        text: $confirmPassword,
                        isVisible: $confirmPasswordVisible
                    )
                    .textContentType(.newPassword)

                    if let mismatchMessage {
                        Text(mismatchMessage)
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                            .foregroundStyle(HayameTheme.danger)
                    }
                }

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
                    isDisabled: appState.isSyncingRemote || !canSubmit
                )

                HStack(spacing: 4) {
                    Text("Already registered?")
                        .font(.system(size: 13, design: .rounded))
                        .foregroundStyle(HayameTheme.mutedText)
                    Button("Log in", action: goToLogin)
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                        .foregroundStyle(HayameTheme.brandBlue)
                }
                .frame(maxWidth: .infinity)

                AuthMessages(error: appState.syncErrorMessage, info: appState.authInfoMessage)

                if !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    Button("Resend verification email") {
                        appState.resendSignupConfirmation(email: email)
                    }
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandBlue)
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

/// Password rules for signup.
///
/// Mirrors `src/lib/password.ts` on the web — the API validates against that
/// module, so any drift here shows up as a form that looks satisfied but is
/// rejected on submit. Keep the two in step.
enum PasswordPolicy {
    struct Rule: Identifiable {
        let id: String
        let label: String
        let test: (String) -> Bool
    }

    static let rules: [Rule] = [
        Rule(id: "length", label: "At least 8 characters") { $0.count >= 8 },
        Rule(id: "letter", label: "One letter") {
            $0.range(of: "[A-Za-z]", options: .regularExpression) != nil
        },
        Rule(id: "number", label: "One number") {
            $0.range(of: "[0-9]", options: .regularExpression) != nil
        },
        Rule(id: "symbol", label: "One symbol (!?@#$…)") {
            $0.range(of: "[^A-Za-z0-9]", options: .regularExpression) != nil
        }
    ]

    struct Strength {
        let score: Int          // 0...4
        let label: String
        let meetsPolicy: Bool
        let passedRuleIDs: Set<String>
    }

    static func grade(_ password: String) -> Strength {
        let passed = rules.filter { $0.test(password) }
        let passedIDs = Set(passed.map(\.id))
        let meetsPolicy = passed.count == rules.count

        var score = passed.count
        // Length beats character-class gymnastics, but only once the basics are
        // met — otherwise "aaaaaaaaaaaa" would read as Strong.
        if meetsPolicy && password.count >= 12 { score += 1 }
        if !meetsPolicy { score = min(score, 3) }
        score = password.isEmpty ? 0 : max(0, min(4, score))

        let labels = ["Too weak", "Weak", "Fair", "Good", "Strong"]
        return Strength(
            score: score,
            label: labels[score],
            meetsPolicy: meetsPolicy,
            passedRuleIDs: passedIDs
        )
    }

    static func color(for score: Int) -> Color {
        switch score {
        case 0: return Color.gray.opacity(0.35)
        case 1: return Color.red
        case 2: return Color.orange
        case 3: return Color.yellow
        default: return Color.green
        }
    }
}

/// Segmented strength bar plus the live rule checklist.
struct PasswordStrengthView: View {
    let password: String

    private var strength: PasswordPolicy.Strength {
        PasswordPolicy.grade(password)
    }

    var body: some View {
        if !password.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) {
                    HStack(spacing: 5) {
                        ForEach(1...4, id: \.self) { step in
                            Capsule()
                                .fill(
                                    strength.score >= step
                                        ? PasswordPolicy.color(for: strength.score)
                                        : Color.gray.opacity(0.2)
                                )
                                .frame(height: 5)
                        }
                    }
                    Text(strength.label)
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundStyle(PasswordPolicy.color(for: strength.score))
                }

                VStack(alignment: .leading, spacing: 4) {
                    ForEach(PasswordPolicy.rules) { rule in
                        let met = strength.passedRuleIDs.contains(rule.id)
                        HStack(spacing: 6) {
                            Image(systemName: met ? "checkmark.circle.fill" : "circle")
                                .font(.system(size: 11))
                                .foregroundStyle(met ? Color.green : HayameTheme.mutedText)
                            Text(rule.label)
                                .font(.system(size: 11, weight: .medium, design: .rounded))
                                .foregroundStyle(met ? Color.green : HayameTheme.mutedText)
                        }
                    }
                }
            }
            .animation(.easeOut(duration: 0.15), value: strength.score)
        }
    }
}

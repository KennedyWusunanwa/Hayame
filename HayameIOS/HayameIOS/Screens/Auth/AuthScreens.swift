import SwiftUI

struct AuthFlowScreen: View {
    @EnvironmentObject private var appState: AppState
    @State private var isLogin = true

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    VStack(spacing: 12) {
                        Image("Logo")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 86, height: 86)

                        Text("Rent a car, anytime, anywhere in Ghana.")
                            .font(.system(size: 14, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                    }
                    .padding(.top, 30)

                    Picker("Auth Mode", selection: $isLogin) {
                        Text("Log in").tag(true)
                        Text("Sign up").tag(false)
                    }
                    .pickerStyle(.segmented)

                    if isLogin {
                        LoginScreenView {
                            isLogin = false
                        }
                    } else {
                        SignupScreenView {
                            isLogin = true
                        }
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        Label("Native Paystack integration", systemImage: "checkmark.seal.fill")
                            .font(.system(size: 13, weight: .semibold, design: .rounded))
                            .foregroundStyle(HayameTheme.brandBlue)

                        Button {
                            // Placeholder for native paystack launch
                        } label: {
                            HStack {
                                Spacer()
                                Text("Pay Paystack")
                                Spacer()
                            }
                        }
                        .buttonStyle(PrimaryPillButtonStyle())

                        Text("with paystack")
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundStyle(HayameTheme.mutedText)
                            .frame(maxWidth: .infinity, alignment: .center)
                    }
                    .hayameCard()

                    Button("Continue as guest") {
                        appState.continueAsGuest()
                    }
                    .buttonStyle(SecondaryPillButtonStyle())
                    .padding(.bottom, 30)
                }
                .padding(.horizontal, 20)
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
    @State private var showPassword = false

    let goToSignup: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Welcome back.")
                .font(.system(size: 15, weight: .medium, design: .rounded))
                .foregroundStyle(HayameTheme.mutedText)

            VStack(alignment: .leading, spacing: 6) {
                Text("Email")
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                TextField("you@example.com", text: $email)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .keyboardType(.emailAddress)
                    .textContentType(.username)
                    .padding(12)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.black.opacity(0.08), lineWidth: 1))
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("Password")
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                HStack {
                    Group {
                        if showPassword {
                            TextField("••••••••", text: $password)
                        } else {
                            SecureField("••••••••", text: $password)
                        }
                    }
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .textContentType(.password)

                    Button(showPassword ? "Hide" : "Show") {
                        showPassword.toggle()
                    }
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandBlue)
                }
                .padding(12)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.black.opacity(0.08), lineWidth: 1))
            }

            Button("Log in") {
                appState.signIn(email: email, password: password)
            }
            .buttonStyle(PrimaryPillButtonStyle())
            .disabled(appState.isSyncingRemote)

            if let message = appState.syncErrorMessage {
                Text(message)
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(HayameTheme.danger)
            }

            HStack(spacing: 4) {
                Text("No account?")
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)
                Button("Sign up", action: goToSignup)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandBlue)
            }
        }
        .padding(16)
        .hayameCard()
    }
}

private struct SignupScreenView: View {
    @EnvironmentObject private var appState: AppState

    @State private var firstName = ""
    @State private var lastName = ""
    @State private var email = ""
    @State private var region = MockDataService.defaultRegion
    @State private var city = "Accra"
    @State private var password = ""
    @State private var showPassword = false

    let goToLogin: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Create your account")
                .font(.system(size: 15, weight: .medium, design: .rounded))
                .foregroundStyle(HayameTheme.mutedText)

            HStack(spacing: 10) {
                inputField(title: "First name", placeholder: "Ama", text: $firstName)
                inputField(title: "Last name", placeholder: "Owusu", text: $lastName)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("Email")
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                TextField("you@example.com", text: $email)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .keyboardType(.emailAddress)
                    .textContentType(.username)
                    .padding(12)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.black.opacity(0.08), lineWidth: 1))
            }

            HStack(spacing: 10) {
                menuField(title: "Region", selection: $region, items: MockDataService.regionsIncluding(region))
                menuField(title: "City", selection: $city, items: MockDataService.cities(for: region, preferred: city))
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("Password")
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                HStack {
                    Group {
                        if showPassword {
                            TextField("••••••••", text: $password)
                        } else {
                            SecureField("••••••••", text: $password)
                        }
                    }
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .textContentType(.newPassword)

                    Button(showPassword ? "Hide" : "Show") {
                        showPassword.toggle()
                    }
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandBlue)
                }
                .padding(12)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.black.opacity(0.08), lineWidth: 1))
            }

            Button("Sign up") {
                appState.signUp(
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    city: city,
                    region: region,
                    password: password
                )
            }
            .buttonStyle(PrimaryPillButtonStyle())
            .disabled(appState.isSyncingRemote)

            if let message = appState.syncErrorMessage {
                Text(message)
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(HayameTheme.danger)
            }

            HStack(spacing: 4) {
                Text("Already registered?")
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(HayameTheme.mutedText)
                Button("Log in", action: goToLogin)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(HayameTheme.brandBlue)
            }
        }
        .padding(16)
        .hayameCard()
        .onChange(of: region) { _, newValue in
            let options = MockDataService.cities(for: newValue, preferred: city)
            if !options.contains(where: { $0.caseInsensitiveCompare(city) == .orderedSame }) {
                city = options.first ?? city
            }
        }
    }

    private func inputField(title: String, placeholder: String, text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 13, weight: .semibold, design: .rounded))
            TextField(placeholder, text: text)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .padding(12)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.black.opacity(0.08), lineWidth: 1))
        }
    }

    private func menuField(title: String, selection: Binding<String>, items: [String]) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 13, weight: .semibold, design: .rounded))

            Menu {
                ForEach(items, id: \.self) { item in
                    Button(item) {
                        selection.wrappedValue = item
                    }
                }
            } label: {
                HStack {
                    Text(selection.wrappedValue)
                        .font(.system(size: 14, weight: .medium, design: .rounded))
                        .foregroundStyle(HayameTheme.brandNavy)
                    Spacer()
                    Image(systemName: "chevron.down")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(HayameTheme.mutedText)
                }
                .padding(12)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.black.opacity(0.08), lineWidth: 1))
            }
        }
    }
}

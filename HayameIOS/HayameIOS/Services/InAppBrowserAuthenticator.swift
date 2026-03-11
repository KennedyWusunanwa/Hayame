import AuthenticationServices
import UIKit

@MainActor
final class InAppBrowserAuthenticator: NSObject {
    static let shared = InAppBrowserAuthenticator()

    private var authSession: ASWebAuthenticationSession?

    func open(url: URL, callbackScheme: String) async throws -> URL {
        try await withCheckedThrowingContinuation { continuation in
            let session = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: callbackScheme
            ) { callbackURL, error in
                defer { self.authSession = nil }

                if let error {
                    if let authError = error as? ASWebAuthenticationSessionError,
                       authError.code == .canceledLogin {
                        continuation.resume(throwing: APIError(message: "Payment was cancelled before completion."))
                        return
                    }
                    continuation.resume(throwing: APIError(message: error.localizedDescription.isEmpty ? "Unable to complete payment authentication." : error.localizedDescription))
                    return
                }

                guard let callbackURL else {
                    continuation.resume(throwing: APIError(message: "No callback URL returned from Paystack."))
                    return
                }
                continuation.resume(returning: callbackURL)
            }

            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = true
            self.authSession = session

            if !session.start() {
                self.authSession = nil
                continuation.resume(throwing: APIError(message: "Unable to open in-app browser checkout."))
            }
        }
    }
}

extension InAppBrowserAuthenticator: ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared
            .connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first(where: \.isKeyWindow) ?? ASPresentationAnchor()
    }
}

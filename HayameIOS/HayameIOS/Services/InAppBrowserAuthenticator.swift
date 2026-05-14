import AuthenticationServices
import UIKit

enum InAppBrowserAuthenticatorError: LocalizedError {
    case cancelled
    case missingCallback
    case unableToOpen
    case message(String)

    var errorDescription: String? {
        switch self {
        case .cancelled:
            return "Payment was cancelled before completion."
        case .missingCallback:
            return "No callback URL returned from Paystack."
        case .unableToOpen:
            return "Unable to open in-app browser checkout."
        case .message(let message):
            return message
        }
    }

    var shouldAttemptPaymentVerificationFallback: Bool {
        switch self {
        case .missingCallback:
            return true
        case .cancelled, .unableToOpen, .message:
            return false
        }
    }
}

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
                        continuation.resume(throwing: InAppBrowserAuthenticatorError.cancelled)
                        return
                    }
                    continuation.resume(
                        throwing: InAppBrowserAuthenticatorError.message(
                            error.localizedDescription.isEmpty ? "Unable to complete payment authentication." : error.localizedDescription
                        )
                    )
                    return
                }

                guard let callbackURL else {
                    continuation.resume(throwing: InAppBrowserAuthenticatorError.missingCallback)
                    return
                }
                continuation.resume(returning: callbackURL)
            }

            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = false
            self.authSession = session

            if !session.start() {
                self.authSession = nil
                continuation.resume(throwing: InAppBrowserAuthenticatorError.unableToOpen)
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

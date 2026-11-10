package com.hayame.app.core.repo

import com.hayame.app.core.network.BookingDecisionRequest
import com.hayame.app.core.network.BookingHoldRequest
import com.hayame.app.core.network.BookingHoldResponse
import com.hayame.app.core.network.BookingsEnvelope
import com.hayame.app.core.network.CheckoutAbandonDto
import com.hayame.app.core.network.CheckoutBookingIdRequest
import com.hayame.app.core.network.CheckoutResumeDto
import com.hayame.app.core.network.PendingCheckoutEnvelope
import com.hayame.app.core.network.DisputeCreateRequest
import com.hayame.app.core.network.DisputeMutationEnvelope
import com.hayame.app.core.network.DisputesEnvelope
import com.hayame.app.core.network.HayameApi
import com.hayame.app.core.network.LegalDocumentDto
import com.hayame.app.core.network.NetworkClient
import com.hayame.app.core.network.PaystackFinalizeEnvelope
import com.hayame.app.core.network.PaystackFinalizeRequest
import com.hayame.app.core.network.PaystackInitEnvelope
import com.hayame.app.core.network.PaystackInitiateRequest
import com.hayame.app.core.network.RenterVerificationDto
import com.hayame.app.core.network.RenterVerificationSubmitRequest
import com.hayame.app.core.network.ReviewCreateRequest
import com.hayame.app.core.network.ReviewMutationEnvelope
import com.hayame.app.core.network.ReviewsEnvelope
import com.hayame.app.core.network.TermsAcceptDto
import com.hayame.app.core.network.TermsAcceptRequest
import com.hayame.app.core.network.TermsDto
import com.hayame.app.core.session.SessionStore

class BookingRepository(
    api: HayameApi,
    sessionStore: SessionStore,
) : RepositorySupport(api, sessionStore) {

    suspend fun getBookings(): BookingsEnvelope = authedCall { auth -> api.getBookings(auth) }

    suspend fun createHold(
        carId: String,
        startDate: String,
        endDate: String,
        tripMode: String?,
        tripUseRegion: String,
        tripUseCity: String,
        tripUseAddress: String,
        deliveryAddress: String?,
        deliveryTime: String?,
        contactPhone: String?,
        deliveryNotes: String?,
    ): BookingHoldResponse {
        return authedCall { auth ->
            api.createBookingHold(
                auth = auth,
                body = BookingHoldRequest(
                    carId = carId,
                    startDate = startDate,
                    endDate = endDate,
                    tripMode = tripMode,
                    tripUseRegion = tripUseRegion,
                    tripUseCity = tripUseCity,
                    tripUseAddress = tripUseAddress,
                    deliveryAddress = deliveryAddress,
                    deliveryTime = deliveryTime,
                    contactPhone = contactPhone,
                    deliveryNotes = deliveryNotes,
                ),
            )
        }
    }

    suspend fun initiatePaystack(bookingId: String, callbackUrl: String): PaystackInitEnvelope {
        return authedCall { auth ->
            api.initiatePaystack(auth = auth, body = PaystackInitiateRequest(bookingId, callbackUrl))
        }
    }

    suspend fun finalizePaystack(request: PaystackFinalizeRequest): PaystackFinalizeEnvelope {
        return authedCall { auth ->
            api.finalizePaystack(auth = auth, body = request)
        }
    }

    suspend fun pendingCheckout(): PendingCheckoutEnvelope {
        return authedCall { auth -> api.pendingCheckout(auth) }
    }

    suspend fun resumeCheckout(bookingId: String): CheckoutResumeDto {
        return authedCall { auth -> api.resumeCheckout(auth, CheckoutBookingIdRequest(bookingId)) }.data
    }

    suspend fun abandonCheckout(bookingId: String): CheckoutAbandonDto? {
        return authedCall { auth -> api.abandonCheckout(auth, CheckoutBookingIdRequest(bookingId)) }.data
    }

    /** The renter's identity check; null when the server sent no data. */
    suspend fun getRenterVerification(): RenterVerificationDto? {
        return authedCall { auth -> api.getRenterVerification(auth) }.data
    }

    suspend fun submitRenterVerification(
        facePath: String,
        licenceFrontPath: String,
        licenceBackPath: String,
    ): RenterVerificationDto? {
        return authedCall { auth ->
            api.submitRenterVerification(
                auth = auth,
                body = RenterVerificationSubmitRequest(
                    face_path = facePath,
                    licence_front_path = licenceFrontPath,
                    licence_back_path = licenceBackPath,
                ),
            )
        }.data
    }

    /**
     * The Terms of Service; null when the server sent no data. Signed in, the answer also says
     * whether this user has accepted the current version. Signed out it is the text only.
     */
    suspend fun getTerms(): TermsDto? {
        return if (sessionStore.authHeader() != null) {
            authedCall { auth -> api.getTerms(auth) }.data
        } else {
            api.getTerms(auth = null).data
        }
    }

    suspend fun acceptTerms(version: String): TermsAcceptDto? {
        return authedCall { auth ->
            api.acceptTerms(auth = auth, body = TermsAcceptRequest(version = version))
        }.data
    }

    /** A policy document from the server; null when it sent no data. Public, no token. */
    suspend fun getLegalDocument(slug: String): LegalDocumentDto? {
        return api.getLegalDocument(slug).data
    }

    /** The copy of a policy document kept on this device from the last successful load. */
    suspend fun cachedLegalDocument(slug: String): LegalDocumentDto? {
        val raw = sessionStore.legalDocumentJson(slug) ?: return null
        return runCatching { NetworkClient.json.decodeFromString(LegalDocumentDto.serializer(), raw) }.getOrNull()
    }

    suspend fun cacheLegalDocument(slug: String, document: LegalDocumentDto) {
        runCatching { NetworkClient.json.encodeToString(LegalDocumentDto.serializer(), document) }
            .onSuccess { sessionStore.setLegalDocumentJson(slug, it) }
    }

    suspend fun approveBooking(bookingId: String) {
        authedCall { auth -> api.bookingDecision(bookingId = bookingId, auth = auth, body = BookingDecisionRequest(action = "approve")) }
    }

    suspend fun rejectBooking(bookingId: String, reason: String?) {
        authedCall {
            auth -> api.bookingDecision(
                bookingId = bookingId,
                auth = auth,
                body = BookingDecisionRequest(action = "reject", reason = reason),
            )
        }
    }

    suspend fun getDisputes(): DisputesEnvelope {
        return authedCall { auth -> api.getDisputes(auth) }
    }

    suspend fun createDispute(bookingId: String, reason: String): DisputeMutationEnvelope {
        return authedCall { auth ->
            api.createDispute(auth, DisputeCreateRequest(bookingId = bookingId, reason = reason))
        }
    }

    suspend fun submitReview(bookingId: String, rating: Int, comment: String): ReviewMutationEnvelope {
        return authedCall { auth ->
            api.submitReview(auth, ReviewCreateRequest(bookingId = bookingId, rating = rating, comment = comment))
        }
    }

    suspend fun getHostReviews(): ReviewsEnvelope {
        return authedCall { auth -> api.getReviews(auth = auth, scope = "host") }
    }

    suspend fun getMyReviews(): ReviewsEnvelope {
        return authedCall { auth -> api.getReviews(auth = auth, scope = "mine") }
    }

    suspend fun getCarReviews(carId: String): ReviewsEnvelope {
        return api.getReviews(auth = null, scope = "public", carId = carId)
    }
}

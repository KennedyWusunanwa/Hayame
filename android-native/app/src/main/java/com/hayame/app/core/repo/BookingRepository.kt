package com.hayame.app.core.repo

import com.hayame.app.core.network.BookingDecisionRequest
import com.hayame.app.core.network.BookingHoldRequest
import com.hayame.app.core.network.BookingHoldResponse
import com.hayame.app.core.network.BookingsEnvelope
import com.hayame.app.core.network.DisputeCreateRequest
import com.hayame.app.core.network.DisputeMutationEnvelope
import com.hayame.app.core.network.DisputesEnvelope
import com.hayame.app.core.network.HayameApi
import com.hayame.app.core.network.PaystackFinalizeEnvelope
import com.hayame.app.core.network.PaystackFinalizeRequest
import com.hayame.app.core.network.PaystackInitEnvelope
import com.hayame.app.core.network.PaystackInitiateRequest
import com.hayame.app.core.network.ReviewCreateRequest
import com.hayame.app.core.network.ReviewMutationEnvelope
import com.hayame.app.core.network.ReviewsEnvelope
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
        tripUseRegion: String,
        tripUseCity: String,
        tripUseAddress: String,
    ): BookingHoldResponse {
        return authedCall { auth ->
            api.createBookingHold(
                auth = auth,
                body = BookingHoldRequest(
                    carId = carId,
                    startDate = startDate,
                    endDate = endDate,
                    tripUseRegion = tripUseRegion,
                    tripUseCity = tripUseCity,
                    tripUseAddress = tripUseAddress,
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

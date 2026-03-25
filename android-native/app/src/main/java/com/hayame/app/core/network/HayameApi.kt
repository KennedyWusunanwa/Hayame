package com.hayame.app.core.network

import kotlinx.serialization.json.JsonObject
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Multipart
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Part
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.QueryMap

interface HayameApi {
    @POST("api/mobile/auth/login")
    suspend fun login(@Body body: LoginRequest): AuthSessionDto

    @POST("api/mobile/auth/signup")
    suspend fun signup(@Body body: SignupRequest): AuthSessionDto

    @POST("api/mobile/auth/refresh")
    suspend fun refresh(@Body body: RefreshRequest): AuthSessionDto

    @POST("api/mobile/auth/forgot-password")
    suspend fun forgotPassword(@Body body: EmailRequest): ApiMessageResponse

    @POST("api/mobile/auth/resend-confirmation")
    suspend fun resendConfirmation(@Body body: EmailRequest): ApiMessageResponse

    @GET("api/mobile/me")
    suspend fun me(@Header("Authorization") auth: String): MobileMeDto

    @GET("api/cars")
    suspend fun getCars(
        @Header("Authorization") auth: String? = null,
        @QueryMap params: Map<String, String> = emptyMap(),
    ): CarsEnvelope

    @GET("api/cars/{id}")
    suspend fun getCarDetail(
        @Path("id") id: String,
        @Header("Authorization") auth: String? = null,
    ): CarDetailEnvelope

    @POST("api/cars")
    suspend fun createCar(
        @Header("Authorization") auth: String,
        @Body body: JsonObject,
    ): CarMutationEnvelope

    @PUT("api/cars/{id}")
    suspend fun updateCar(
        @Path("id") id: String,
        @Header("Authorization") auth: String,
        @Body body: JsonObject,
    ): CarMutationEnvelope

    @DELETE("api/cars/{id}")
    suspend fun deleteCar(
        @Path("id") id: String,
        @Header("Authorization") auth: String,
    ): ApiMessageResponse

    @GET("api/cars/{id}/photos")
    suspend fun getCarPhotos(
        @Path("id") id: String,
        @Header("Authorization") auth: String,
    ): CarPhotosEnvelope

    @Multipart
    @POST("api/cars/{id}/photos")
    suspend fun uploadCarPhoto(
        @Path("id") id: String,
        @Header("Authorization") auth: String,
        @Part file: MultipartBody.Part,
        @Part("replacePhotoId") replacePhotoId: RequestBody? = null,
    ): CarPhotoMutationEnvelope

    @DELETE("api/cars/{id}/photos")
    suspend fun deleteCarPhoto(
        @Path("id") id: String,
        @Header("Authorization") auth: String,
        @Body body: JsonObject,
    ): ApiMessageResponse

    @GET("api/locations")
    suspend fun getLocations(): LocationsEnvelope

    @GET("api/car-catalog")
    suspend fun getCarCatalog(): CarCatalogEnvelope

    @GET("api/favorites")
    suspend fun getFavorites(@Header("Authorization") auth: String): FavoritesEnvelope

    @POST("api/favorites")
    suspend fun setFavorite(
        @Header("Authorization") auth: String,
        @Body body: FavoriteMutationRequest,
    ): ApiMessageResponse

    @POST("api/profiles/upsert")
    suspend fun upsertProfile(
        @Header("Authorization") auth: String,
        @Body body: ProfileUpsertRequest,
    ): ApiMessageResponse

    @GET("api/bookings")
    suspend fun getBookings(@Header("Authorization") auth: String): BookingsEnvelope

    @POST("api/mobile/bookings/hold")
    suspend fun createBookingHold(
        @Header("Authorization") auth: String,
        @Body body: BookingHoldRequest,
    ): BookingHoldResponse

    @POST("api/mobile/bookings/paystack/initiate")
    suspend fun initiatePaystack(
        @Header("Authorization") auth: String,
        @Body body: PaystackInitiateRequest,
    ): PaystackInitEnvelope

    @POST("api/mobile/bookings/paystack/finalize")
    suspend fun finalizePaystack(
        @Header("Authorization") auth: String,
        @Body body: PaystackFinalizeRequest,
    ): PaystackFinalizeEnvelope

    @PATCH("api/bookings/{id}")
    suspend fun bookingDecision(
        @Path("id") bookingId: String,
        @Header("Authorization") auth: String,
        @Body body: BookingDecisionRequest,
    ): ApiMessageResponse

    @GET("api/disputes")
    suspend fun getDisputes(@Header("Authorization") auth: String): DisputesEnvelope

    @POST("api/disputes")
    suspend fun createDispute(
        @Header("Authorization") auth: String,
        @Body body: DisputeCreateRequest,
    ): DisputeMutationEnvelope

    @GET("api/reviews")
    suspend fun getReviews(
        @Header("Authorization") auth: String? = null,
        @Query("scope") scope: String,
        @Query("carId") carId: String? = null,
    ): ReviewsEnvelope

    @POST("api/reviews")
    suspend fun submitReview(
        @Header("Authorization") auth: String,
        @Body body: ReviewCreateRequest,
    ): ReviewMutationEnvelope

    @GET("api/host-status")
    suspend fun hostStatus(@Header("Authorization") auth: String): HostStatusDto

    @GET("api/host-applications")
    suspend fun hostApplication(@Header("Authorization") auth: String): HostApplicationEnvelope

    @POST("api/host-applications")
    suspend fun submitHostApplication(
        @Header("Authorization") auth: String,
        @Body body: HostApplicationRequest,
    ): HostApplicationEnvelope

    @POST("api/host-activate")
    suspend fun activateHost(@Header("Authorization") auth: String): HostStatusDto

    @GET("api/availability")
    suspend fun getAvailability(
        @Query("carId") carId: String,
        @Query("startDate") startDate: String,
        @Query("endDate") endDate: String,
    ): AvailabilityEnvelope

    @POST("api/availability")
    suspend fun saveAvailabilityWindow(
        @Header("Authorization") auth: String,
        @Body body: AvailabilitySaveRequest,
    ): AvailabilityMutationEnvelope

    @POST("api/availability")
    suspend fun saveAvailabilityRecurring(
        @Header("Authorization") auth: String,
        @Body body: AvailabilityRecurringRequest,
    ): AvailabilityMutationEnvelope

    @GET("api/conversations")
    suspend fun getConversations(@Header("Authorization") auth: String): ConversationsEnvelope

    @POST("api/conversations")
    suspend fun createConversation(
        @Header("Authorization") auth: String,
        @Body body: ConversationCreateRequest,
    ): ConversationCreateDto

    @GET("api/messages")
    suspend fun getMessages(
        @Header("Authorization") auth: String,
        @Query("conversationId") conversationId: String,
        @Query("markRead") markRead: Int = 1,
        @Query("limit") limit: Int = 200,
        @Query("since") since: String? = null,
    ): MessagesEnvelope

    @POST("api/messages")
    suspend fun sendMessage(
        @Header("Authorization") auth: String,
        @Body body: MessageSendRequest,
    ): MessageEnvelope

    @POST("api/mobile/push/register")
    suspend fun registerPush(
        @Header("Authorization") auth: String,
        @Body body: PushRegisterRequest,
    ): PushRegisterResponse

    @GET("api/mobile/push/status")
    suspend fun pushStatus(@Header("Authorization") auth: String): PushStatusEnvelope
}

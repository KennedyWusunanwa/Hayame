@file:OptIn(kotlinx.serialization.ExperimentalSerializationApi::class)

package com.hayame.app.core.network

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull

object FlexibleDoubleSerializer : KSerializer<Double?> {
    override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("FlexibleDouble", PrimitiveKind.DOUBLE)

    override fun deserialize(decoder: Decoder): Double? {
        val jsonDecoder = decoder as? JsonDecoder ?: return runCatching { decoder.decodeDouble() }.getOrNull()
        val element = jsonDecoder.decodeJsonElement()
        return when (element) {
            JsonNull -> null
            is JsonPrimitive -> {
                if (element.isString) element.content.toDoubleOrNull() else element.doubleOrNull
            }
            else -> null
        }
    }

    override fun serialize(encoder: Encoder, value: Double?) {
        if (value == null) {
            encoder.encodeNull()
        } else {
            encoder.encodeDouble(value)
        }
    }
}

@Serializable
data class ApiMessageResponse(
    val message: String? = null,
)

@Serializable
data class AuthUserDto(
    val id: String,
    val email: String? = null,
    val user_metadata: JsonObject? = null,
)

@Serializable
data class AuthSessionDto(
    val access_token: String? = null,
    val refresh_token: String? = null,
    val expires_at: Long? = null,
    val user: AuthUserDto? = null,
    val requires_email_confirmation: Boolean? = null,
)

@Serializable
data class ProfileDto(
    val id: String? = null,
    val first_name: String? = null,
    val last_name: String? = null,
    val full_name: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val city: String? = null,
    val region: String? = null,
    val avatar_url: String? = null,
    val avatar: String? = null,
    val is_host: Boolean? = null,
    val id_verified: Boolean? = null,
    val phone_verified: Boolean? = null,
    val email_verified: Boolean? = null,
    val host_level: String? = null,
)

@Serializable
data class HostApplicationDto(
    val id: String? = null,
    val status: String? = null,
    val full_name: String? = null,
    val phone: String? = null,
    val region: String? = null,
    val city: String? = null,
    val id_type: String? = null,
    val id_number: String? = null,
    val id_front_path: String? = null,
    val id_back_path: String? = null,
    val experience: String? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val fleet_size: Double? = null,
    val note: String? = null,
    val rejection_reason: String? = null,
)

@Serializable
data class MobileMeDto(
    val user: AuthUserDto,
    val profile: ProfileDto? = null,
    val is_host: Boolean? = null,
    val host_status: String? = null,
    val host_application_status: String? = null,
    val host_application: HostApplicationDto? = null,
)

@Serializable
data class CarPhotoDto(
    val url: String? = null,
)

@Serializable
data class OwnerDto(
    val id: String? = null,
    val full_name: String? = null,
    val avatar_url: String? = null,
    val city: String? = null,
    val phone: String? = null,
    val id_verified: Boolean? = null,
    val phone_verified: Boolean? = null,
    val email_verified: Boolean? = null,
    val host_level: String? = null,
)

@Serializable
data class CarDto(
    val id: String,
    val owner_id: String? = null,
    val title: String? = null,
    val description: String? = null,
    val brand: String? = null,
    val model: String? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val daily_price: Double? = null,
    val city: String? = null,
    val region: String? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val latitude: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val longitude: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val lat: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val lng: Double? = null,
    val car_type: String? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val seats: Double? = null,
    val transmission: String? = null,
    val fuel_type: String? = null,
    val features: List<String>? = null,
    @SerialName("year")
    @Serializable(with = FlexibleDoubleSerializer::class)
    val year: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val car_year: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val delivery_fee: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val insurance_fee: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val deposit_amount: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val outside_accra_fee: Double? = null,
    val cancellation_policy: String? = null,
    val is_available: Boolean? = null,
    val instant_book: Boolean? = null,
    val delivery_available: Boolean? = null,
    /** Hosts opt in to single-day trips; off means a 2-day minimum. */
    val allow_one_day_booking: Boolean? = null,
    /** The host or their chauffeur drives; guests do not self-drive. */
    val with_driver: Boolean? = null,
    val air_conditioning: Boolean? = null,
    val approval_status: String? = null,
    val created_at: String? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val avg_rating: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val reviews_count: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val favorites_count: Double? = null,
    val host_name: String? = null,
    val host_avatar: String? = null,
    val host_level: String? = null,
    val id_verified: Boolean? = null,
    val phone_verified: Boolean? = null,
    val email_verified: Boolean? = null,
    val image_url: String? = null,
    val car_photos: List<CarPhotoDto>? = null,
    val owner: OwnerDto? = null,
) {
    /** Shortest trip this listing accepts, in days. Mirrors the server rule. */
    val minimumTripDays: Int get() = if (allow_one_day_booking == true) 1 else 2
}

@Serializable
data class CarsEnvelope(
    val data: List<CarDto> = emptyList(),
    val meta: CarsMetaDto? = null,
)

@Serializable
data class CarsMetaDto(
    /** Platform fee the server charges on top of the daily rate, as a percent. */
    @Serializable(with = FlexibleDoubleSerializer::class)
    val platform_fee_percent: Double? = null,
)

@Serializable
data class CarDetailEnvelope(
    val data: CarDto,
)

@Serializable
data class FavoriteDto(
    val car_id: String,
)

@Serializable
data class FavoritesEnvelope(
    val data: List<FavoriteDto> = emptyList(),
)

@Serializable
data class BookingCarDto(
    val id: String? = null,
    val title: String? = null,
    val brand: String? = null,
    val model: String? = null,
    val image_url: String? = null,
    val car_photos: List<CarPhotoDto>? = null,
    val owner_id: String? = null,
    val owner: OwnerDto? = null,
)

@Serializable
data class BookingRenterDto(
    val id: String? = null,
    val full_name: String? = null,
)

@Serializable
data class BookingDto(
    val id: String,
    val car_id: String? = null,
    val renter_id: String? = null,
    val start_date: String? = null,
    val end_date: String? = null,
    val status: String? = null,
    val payment_status: String? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val total_price: Double? = null,
    val delivery_address: String? = null,
    val delivery_time: String? = null,
    val contact_phone: String? = null,
    val delivery_notes: String? = null,
    val trip_use_region: String? = null,
    val trip_use_city: String? = null,
    val trip_use_address: String? = null,
    val trip_outside_accra: Boolean? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val daily_rate: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val subtotal: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val platform_fee: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val insurance_fee: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val delivery_fee: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val outside_accra_surcharge: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val deposit_amount: Double? = null,
    val payment_reference: String? = null,
    val rejection_reason: String? = null,
    val created_at: String? = null,
    val conversation_id: String? = null,
    val cars: BookingCarDto? = null,
    val renter: BookingRenterDto? = null,
    val role: String? = null,
)

@Serializable
data class BookingsEnvelope(
    val data: List<BookingDto> = emptyList(),
)

@Serializable
data class BookingHoldResponse(
    val bookingId: String,
    val hold_expires_at: String? = null,
)

@Serializable
data class PaystackInitDto(
    val bookingId: String,
    val reference: String,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val amount: Double? = null,
    val authorization_url: String,
    val payment_url: String? = null,
    val access_code: String? = null,
    val callback_url: String? = null,
)

@Serializable
data class PaystackInitEnvelope(
    val data: PaystackInitDto,
)

@Serializable
data class PaystackFinalizeEnvelope(
    val data: BookingDto? = null,
    val conversationId: String? = null,
)

@Serializable
data class HostStatusDto(
    val is_host: Boolean = false,
    val host_application_status: String? = null,
    val status: String? = null,
)

@Serializable
data class HostApplicationEnvelope(
    val data: HostApplicationDto? = null,
)

@Serializable
data class ReviewCarDto(
    val title: String? = null,
)

@Serializable
data class ReviewUserDto(
    val full_name: String? = null,
)

@Serializable
data class ReviewDto(
    val id: String,
    val car_id: String? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val rating: Double? = null,
    val comment: String? = null,
    val created_at: String? = null,
    val cars: ReviewCarDto? = null,
    val reviewer: ReviewUserDto? = null,
)

@Serializable
data class ReviewsEnvelope(
    val data: List<ReviewDto> = emptyList(),
)

@Serializable
data class ReviewMutationEnvelope(
    val data: ReviewDto? = null,
)

@Serializable
data class AvailabilityEnvelope(
    val blockedDates: List<String>? = null,
    val available: Boolean? = null,
    val reason: String? = null,
)

@Serializable
data class AvailabilityRowDto(
    val id: String? = null,
    val car_id: String? = null,
    val start_date: String? = null,
    val end_date: String? = null,
    val available: Boolean? = null,
)

@Serializable
data class AvailabilityMutationEnvelope(
    val data: List<AvailabilityRowDto>? = null,
)

@Serializable
data class LocationsEnvelope(
    val data: Map<String, List<String>>? = null,
    val message: String? = null,
)

@Serializable
data class CarModelDto(
    val id: String,
    val name: String,
)

@Serializable
data class CarMakeDto(
    val id: String,
    val name: String,
    val models: List<CarModelDto> = emptyList(),
)

@Serializable
data class CarCatalogEnvelope(
    val makes: List<CarMakeDto> = emptyList(),
)

@Serializable
data class ConversationUserDto(
    val id: String? = null,
    val name: String? = null,
    val avatar: String? = null,
)

@Serializable
data class ConversationDto(
    val id: String,
    val host_id: String,
    val user_id: String,
    val car_id: String? = null,
    val booking_id: String? = null,
    val created_at: String? = null,
    val last_message_at: String? = null,
    val last_message_preview: String? = null,
    val unread_count: Int? = null,
    val other_user: ConversationUserDto? = null,
    val car_title: String? = null,
    val car_location: String? = null,
)

@Serializable
data class ConversationsEnvelope(
    val data: List<ConversationDto> = emptyList(),
)

@Serializable
data class ConversationCreateDto(
    val id: String,
)

@Serializable
data class MessageDto(
    val id: String,
    val conversation_id: String,
    val sender_id: String,
    val body: String,
    val created_at: String,
    val read_at: String? = null,
)

@Serializable
data class MessagesEnvelope(
    val data: List<MessageDto> = emptyList(),
)

@Serializable
data class MessageEnvelope(
    val data: MessageDto,
)

@Serializable
data class PushRegisterResponse(
    val registered: Boolean? = null,
    val warning: String? = null,
    val message: String? = null,
)

@Serializable
data class PushUnregisterResponse(
    val unregistered: Boolean? = null,
    val removed: Int? = null,
    val warning: String? = null,
    val message: String? = null,
)

@Serializable
data class PushStatusEnvelope(
    val push: PushStatusDto? = null,
)

@Serializable
data class PushStatusDto(
    val configured: Boolean? = null,
    val reason: String? = null,
)

@Serializable
data class NotificationPreferencesDto(
    val booking_updates: Boolean? = null,
    val messages: Boolean? = null,
    val account_security: Boolean? = null,
    val news_announcements: Boolean? = null,
)

@Serializable
data class NotificationPreferencesEnvelope(
    val data: NotificationPreferencesDto? = null,
    val message: String? = null,
)

@Serializable
data class AppAnnouncementDto(
    val id: String,
    val title: String? = null,
    val body: String? = null,
    val category: String? = null,
    val delivery: String? = null,
    val audience: String? = null,
    val show_once: Boolean? = null,
    val cta_label: String? = null,
    val cta_url: String? = null,
    val starts_at: String? = null,
    val ends_at: String? = null,
    val published_at: String? = null,
    val seen: Boolean? = null,
)

@Serializable
data class AppAnnouncementsEnvelope(
    val data: List<AppAnnouncementDto> = emptyList(),
    val message: String? = null,
)

@Serializable
data class AnnouncementSeenResponse(
    val seen: Boolean? = null,
    val message: String? = null,
)

@Serializable
data class CarPhotoItemDto(
    val id: String,
    val url: String,
)

@Serializable
data class CarPhotoMetaDto(
    val max_photos: Int? = null,
)

@Serializable
data class CarPhotosEnvelope(
    val data: List<CarPhotoItemDto> = emptyList(),
    val meta: CarPhotoMetaDto? = null,
)

@Serializable
data class CarPhotoMutationEnvelope(
    val data: CarPhotoItemDto? = null,
)

@Serializable
data class CarMutationEnvelope(
    val data: CarDto,
)

@Serializable
data class DisputeDto(
    val id: String,
    val booking_id: String? = null,
    val car_id: String? = null,
    val reason: String? = null,
    val status: String? = null,
    val resolution_note: String? = null,
    val created_at: String? = null,
    val updated_at: String? = null,
)

@Serializable
data class DisputesEnvelope(
    val data: List<DisputeDto> = emptyList(),
)

@Serializable
data class DisputeMutationEnvelope(
    val data: DisputeDto? = null,
    val message: String? = null,
)

@Serializable
data class FavoriteMutationRequest(
    val carId: String,
    val isFavorite: Boolean,
)

@Serializable
data class BookingHoldRequest(
    val carId: String,
    val startDate: String,
    val endDate: String,
    val tripMode: String? = null,
    val tripUseRegion: String,
    val tripUseCity: String,
    val tripUseAddress: String,
    val deliveryAddress: String? = null,
    val deliveryTime: String? = null,
    val contactPhone: String? = null,
    val deliveryNotes: String? = null,
)

@Serializable
data class PaystackInitiateRequest(
    val bookingId: String,
    val callbackUrl: String,
)

@Serializable
data class PaystackFinalizeRequest(
    val bookingId: String,
    val carId: String,
    val startDate: String,
    val endDate: String,
    val tripUseRegion: String,
    val tripUseCity: String,
    val tripUseAddress: String,
    val reference: String,
    val amount: Int,
)

@Serializable
data class BookingDecisionRequest(
    val action: String,
    val reason: String? = null,
)

@Serializable
data class DisputeCreateRequest(
    val bookingId: String,
    val reason: String,
)

@Serializable
data class ReviewCreateRequest(
    val bookingId: String,
    val rating: Int,
    val comment: String,
)

@Serializable
data class ProfileUpsertRequest(
    val id: String,
    val first_name: String,
    val last_name: String,
    val full_name: String,
    val city: String,
    val region: String,
    val phone: String,
    val avatar_url: String? = null,
)

@Serializable
data class HostApplicationRequest(
    val full_name: String,
    val phone: String,
    val region: String,
    val city: String,
    val id_type: String,
    val id_number: String,
    val id_front_path: String? = null,
    val id_back_path: String? = null,
    val note: String? = null,
    val experience: String,
    val fleet_size: Int? = null,
)

@Serializable
data class AvailabilitySaveRequest(
    val carId: String,
    val startDate: String,
    val endDate: String,
    val available: Boolean,
)

@Serializable
data class AvailabilityRecurringRequest(
    val carId: String,
    val startDate: String,
    val endDate: String,
    val available: Boolean = false,
    val repeatDays: List<String>,
)

@Serializable
data class ConversationCreateRequest(
    val hostId: String? = null,
    val participantId: String? = null,
    val carId: String? = null,
)

@Serializable
data class MessageSendRequest(
    val conversationId: String,
    val body: String,
)

@Serializable
data class PushRegisterRequest(
    val deviceToken: String,
    val platform: String,
    val previousDeviceToken: String? = null,
)

@Serializable
data class NotificationPreferencesUpdateRequest(
    val booking_updates: Boolean,
    val messages: Boolean,
    val account_security: Boolean,
    val news_announcements: Boolean,
)

@Serializable
data class RefreshRequest(
    val refresh_token: String,
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
)

@Serializable
data class SignupRequest(
    val first_name: String,
    val last_name: String,
    val email: String,
    val password: String,
    val city: String,
    val region: String,
)

@Serializable
data class EmailRequest(
    val email: String,
)

fun MobileMeDto?.preferredAvatarRaw(): String? {
    val me = this ?: return null
    return preferredNonBlankValue(
        me.profile?.avatar_url,
        me.profile?.avatar,
        me.user.metadataString("avatar_url"),
        me.user.metadataString("avatar"),
        me.user.metadataString("picture"),
        me.user.metadataString("photo_url"),
    )
}

fun MobileMeDto.withAvatarFallback(fallbackAvatarUrl: String?): MobileMeDto {
    val normalizedFallback = preferredNonBlankValue(fallbackAvatarUrl) ?: return this
    if (!preferredAvatarRaw().isNullOrBlank()) return this
    return copy(
        profile = (profile ?: ProfileDto(id = user.id)).copy(
            avatar_url = normalizedFallback,
        ),
    )
}

fun MobileMeDto?.preferredFullName(): String? {
    val me = this ?: return null
    val joinedProfileName = listOfNotNull(me.profile?.first_name, me.profile?.last_name)
        .map { it.trim() }
        .filter { it.isNotBlank() }
        .joinToString(" ")
        .takeIf { it.isNotBlank() }
    val joinedMetadataName = listOfNotNull(
        me.user.metadataString("first_name"),
        me.user.metadataString("last_name"),
    ).joinToString(" ").trim().takeIf { !it.isNullOrBlank() }

    return preferredNonBlankValue(
        me.profile?.full_name,
        me.user.metadataString("full_name"),
        joinedProfileName,
        joinedMetadataName,
        me.user.email,
    )
}

fun MobileMeDto?.preferredFirstName(): String? {
    val me = this ?: return null
    return preferredNonBlankValue(
        me.profile?.first_name,
        me.user.metadataString("first_name"),
        me.preferredFullName()?.split(" ")?.firstOrNull(),
    )
}

fun MobileMeDto?.preferredLastName(): String? {
    val me = this ?: return null
    return preferredNonBlankValue(
        me.profile?.last_name,
        me.user.metadataString("last_name"),
    )
}

fun MobileMeDto?.preferredPhone(): String? {
    val me = this ?: return null
    return preferredNonBlankValue(
        me.profile?.phone,
        me.user.metadataString("phone"),
    )
}

fun MobileMeDto?.preferredCity(): String? {
    val me = this ?: return null
    return preferredNonBlankValue(
        me.profile?.city,
        me.user.metadataString("city"),
    )
}

fun MobileMeDto?.preferredRegion(): String? {
    val me = this ?: return null
    return preferredNonBlankValue(
        me.profile?.region,
        me.user.metadataString("region"),
    )
}

fun MobileMeDto?.preferredEmail(): String? {
    val me = this ?: return null
    return preferredNonBlankValue(
        me.profile?.email,
        me.user.email,
    )
}

fun MobileMeDto?.preferredRole(): String? {
    val raw = (this?.user?.user_metadata?.get("role") as? JsonPrimitive)?.contentOrNull?.trim()
    return if (raw.isNullOrBlank()) null else raw
}

fun MobileMeDto?.isAdmin(): Boolean =
    this.preferredRole()?.equals("admin", ignoreCase = true) == true

private fun AuthUserDto?.metadataString(key: String): String? {
    val value = this?.user_metadata?.get(key) as? JsonPrimitive ?: return null
    return value.contentOrNull?.trim()?.takeIf { it.isNotBlank() }
}

private fun preferredNonBlankValue(vararg candidates: String?): String? {
    candidates.forEach { candidate ->
        val normalized = candidate?.trim().takeIf { !it.isNullOrBlank() } ?: return@forEach
        val lowered = normalized.lowercase()
        if (lowered.endsWith("/favicon.ico") || lowered.contains("/favicon.ico?")) {
            return@forEach
        }
        return normalized
    }
    return null
}

// MARK: Resumable checkout ----------------------------------------------------------------------

@Serializable
data class PendingCheckoutEnvelope(
    val data: PendingCheckoutDto? = null,
    val completed: PendingCheckoutCompletedDto? = null,
)

@Serializable
data class PendingCheckoutCompletedDto(
    val bookingId: String? = null,
    val status: String? = null,
    val conversationId: String? = null,
)

/** A checkout the renter started paying for and did not finish, held server-side. */
@Serializable
data class PendingCheckoutDto(
    val bookingId: String,
    val carId: String,
    val state: String? = null,
    val holdExpiresAt: String? = null,
    val createdAt: String? = null,
    val startDate: String,
    val endDate: String,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val nights: Double? = null,
    val tripMode: String? = null,
    val tripUseRegion: String? = null,
    val tripUseCity: String? = null,
    val tripUseAddress: String? = null,
    val deliveryAddress: String? = null,
    val deliveryTime: String? = null,
    val contactPhone: String? = null,
    val deliveryNotes: String? = null,
    val car: PendingCheckoutCarDto? = null,
    val pricing: CheckoutPricingDto? = null,
    val issues: List<CheckoutIssueDto> = emptyList(),
    val canResume: Boolean? = null,
    val paymentReference: String? = null,
    val paymentStatus: String? = null,
) {
    val isHeld: Boolean get() = state == "held" && !holdExpiresAt.isNullOrBlank()
    val isDelivery: Boolean get() = tripMode == "delivery"
    val nightCount: Int get() = (pricing?.nights ?: nights ?: 1.0).toInt().coerceAtLeast(1)
    val totalAmount: Int get() = (pricing?.total ?: 0.0).toInt().coerceAtLeast(0)
}

@Serializable
data class PendingCheckoutCarDto(
    val id: String? = null,
    val title: String? = null,
    val imageUrl: String? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val dailyPrice: Double? = null,
    val city: String? = null,
    val region: String? = null,
    val instantBook: Boolean? = null,
    val deliveryAvailable: Boolean? = null,
    val hostName: String? = null,
)

@Serializable
data class CheckoutPricingDto(
    @Serializable(with = FlexibleDoubleSerializer::class)
    val nights: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val dailyRate: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val subtotal: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val platformFee: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val insuranceFee: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val deliveryFee: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val outsideAccraSurcharge: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val depositAmount: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val total: Double? = null,
    @Serializable(with = FlexibleDoubleSerializer::class)
    val amountMinor: Double? = null,
)

@Serializable
data class CheckoutIssueDto(
    val code: String? = null,
    val message: String? = null,
)

@Serializable
data class CheckoutResumeEnvelope(
    val data: CheckoutResumeDto,
)

@Serializable
data class CheckoutResumeDto(
    val outcome: String,
    val checkout: PendingCheckoutDto? = null,
    val bookingId: String? = null,
    val conversationId: String? = null,
)

@Serializable
data class CheckoutAbandonEnvelope(
    val data: CheckoutAbandonDto? = null,
    val message: String? = null,
)

@Serializable
data class CheckoutAbandonDto(
    val outcome: String? = null,
    val bookingId: String? = null,
    val conversationId: String? = null,
)

@Serializable
data class CheckoutBookingIdRequest(
    val bookingId: String,
)

// MARK: Renter identity verification ---------------------------------------------------------------

@Serializable
data class RenterVerificationEnvelope(
    val data: RenterVerificationDto? = null,
    val message: String? = null,
)

/**
 * Where the signed-in renter stands with the identity check. Every field is optional so an
 * older or partial server response never fails to parse; [canBook] is the one booking looks at.
 */
@Serializable
data class RenterVerificationDto(
    val status: String? = null,
    val required: Boolean? = null,
    val canBook: Boolean? = null,
    val submittedAt: String? = null,
    val reviewedAt: String? = null,
    val rejectionReason: String? = null,
)

@Serializable
data class RenterVerificationSubmitRequest(
    val face_path: String,
    val licence_front_path: String,
    val licence_back_path: String,
)

// MARK: Terms of Service -------------------------------------------------------------------------

@Serializable
data class TermsEnvelope(
    val data: TermsDto? = null,
    val message: String? = null,
)

/**
 * The agreement text (one copy on the server for web, iOS and Android) plus where this user
 * stands. Every field is optional so a partial response never fails to parse; [accepted] is
 * null when the request was made signed out.
 */
@Serializable
data class TermsDto(
    val version: String? = null,
    val title: String? = null,
    val lastUpdated: String? = null,
    val sections: List<TermsSectionDto>? = null,
    val required: Boolean? = null,
    val accepted: Boolean? = null,
    val acceptedAt: String? = null,
)

@Serializable
data class TermsSectionDto(
    val title: String? = null,
    val paragraphs: List<String>? = null,
)

@Serializable
data class TermsAcceptRequest(
    val version: String,
    val platform: String = "android",
)

@Serializable
data class TermsAcceptEnvelope(
    val data: TermsAcceptDto? = null,
    val message: String? = null,
)

@Serializable
data class TermsAcceptDto(
    val accepted: Boolean? = null,
    val version: String? = null,
    val acceptedAt: String? = null,
)

// MARK: Policy documents (Protection, Cancellation, Privacy) ---------------------------------------

@Serializable
data class LegalDocumentEnvelope(
    val data: LegalDocumentDto? = null,
    val message: String? = null,
)

/**
 * One policy document written as questions and answers (one copy on the server for web, iOS
 * and Android). Every field is optional so a partial response never fails to parse.
 */
@Serializable
data class LegalDocumentDto(
    val slug: String? = null,
    val eyebrow: String? = null,
    val title: String? = null,
    /** Already formatted for display, e.g. "10 November 2026". */
    val lastUpdated: String? = null,
    val summary: String? = null,
    val highlights: List<LegalHighlightDto>? = null,
    /** Only the cancellation policy has one. */
    val table: LegalTableDto? = null,
    val groups: List<LegalGroupDto>? = null,
    val contact: String? = null,
)

@Serializable
data class LegalHighlightDto(
    val title: String? = null,
    val body: String? = null,
)

/** The first column of every row is the row's label. */
@Serializable
data class LegalTableDto(
    val title: String? = null,
    val caption: String? = null,
    val columns: List<String>? = null,
    val rows: List<List<String>>? = null,
)

@Serializable
data class LegalGroupDto(
    val title: String? = null,
    val questions: List<LegalQuestionDto>? = null,
)

@Serializable
data class LegalQuestionDto(
    val q: String? = null,
    /** The answer, one entry per paragraph. */
    val a: List<String>? = null,
)

// MARK: Account deletion ---------------------------------------------------------------------------

@Serializable
data class AccountDeletionRequest(
    val platform: String = "android",
)

@Serializable
data class AccountDeletionEnvelope(
    val data: AccountDeletionDto? = null,
    val message: String? = null,
)

@Serializable
data class AccountDeletionDto(
    val requested: Boolean? = null,
    val openTrips: Int? = null,
    val message: String? = null,
)

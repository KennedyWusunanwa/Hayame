package com.hayame.app.core.repo

import com.hayame.app.core.network.AvailabilityEnvelope
import com.hayame.app.core.network.AvailabilityMutationEnvelope
import com.hayame.app.core.network.AvailabilityRecurringRequest
import com.hayame.app.core.network.AvailabilitySaveRequest
import com.hayame.app.core.network.CarCatalogEnvelope
import com.hayame.app.core.network.CarDetailEnvelope
import com.hayame.app.core.network.CarMutationEnvelope
import com.hayame.app.core.network.CarPhotosEnvelope
import com.hayame.app.core.network.CarsEnvelope
import com.hayame.app.core.network.FavoriteMutationRequest
import com.hayame.app.core.network.FavoritesEnvelope
import com.hayame.app.core.network.HayameApi
import com.hayame.app.core.network.LocationsEnvelope
import com.hayame.app.core.network.ProfileUpsertRequest
import com.hayame.app.core.session.SessionStore
import kotlinx.serialization.json.JsonObject
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

class CarsRepository(
    api: HayameApi,
    sessionStore: SessionStore,
) : RepositorySupport(api, sessionStore) {

    suspend fun getCars(params: Map<String, String> = emptyMap()): CarsEnvelope {
        val auth = sessionStore.authHeader()
        return api.getCars(auth = auth, params = params)
    }

    suspend fun getCarDetail(carId: String): CarDetailEnvelope {
        val auth = sessionStore.authHeader()
        return api.getCarDetail(id = carId, auth = auth)
    }

    suspend fun getMyCars(): CarsEnvelope {
        return authedCall { auth ->
            api.getCars(auth = auth, params = mapOf("mine" to "1", "limit" to "200"))
        }
    }

    suspend fun createCar(payload: JsonObject): CarMutationEnvelope {
        return authedCall { auth -> api.createCar(auth = auth, body = payload) }
    }

    suspend fun updateCar(carId: String, payload: JsonObject): CarMutationEnvelope {
        return authedCall { auth -> api.updateCar(id = carId, auth = auth, body = payload) }
    }

    suspend fun deleteCar(carId: String) {
        authedCall { auth -> api.deleteCar(id = carId, auth = auth) }
    }

    suspend fun getCarPhotos(carId: String): CarPhotosEnvelope {
        return authedCall { auth -> api.getCarPhotos(id = carId, auth = auth) }
    }

    suspend fun uploadCarPhoto(carId: String, file: File, replacePhotoId: String? = null) {
        authedCall { auth ->
            val media = guessMimeType(file.name).toMediaType()
            val part = MultipartBody.Part.createFormData(
                "file",
                file.name,
                file.asRequestBody(media),
            )
            val replaceBody = replacePhotoId?.toRequestBody("text/plain".toMediaType())
            api.uploadCarPhoto(id = carId, auth = auth, file = part, replacePhotoId = replaceBody)
        }
    }

    suspend fun deleteCarPhoto(carId: String, photoId: String) {
        authedCall { auth ->
            api.deleteCarPhoto(
                id = carId,
                auth = auth,
                body = JsonObject(mapOf("photoId" to kotlinx.serialization.json.JsonPrimitive(photoId))),
            )
        }
    }

    suspend fun getLocations(): LocationsEnvelope = api.getLocations()

    suspend fun getCarCatalog(): CarCatalogEnvelope = api.getCarCatalog()

    suspend fun getFavorites(): FavoritesEnvelope {
        return authedCall { auth -> api.getFavorites(auth = auth) }
    }

    suspend fun setFavorite(carId: String, isFavorite: Boolean) {
        authedCall { auth -> api.setFavorite(auth = auth, body = FavoriteMutationRequest(carId, isFavorite)) }
    }

    suspend fun upsertProfile(request: ProfileUpsertRequest) {
        authedCall { auth -> api.upsertProfile(auth = auth, body = request) }
    }

    suspend fun getAvailability(carId: String, startDate: String, endDate: String): AvailabilityEnvelope {
        return api.getAvailability(carId = carId, startDate = startDate, endDate = endDate)
    }

    suspend fun saveAvailabilityWindow(carId: String, startDate: String, endDate: String, available: Boolean): AvailabilityMutationEnvelope {
        return authedCall { auth ->
            api.saveAvailabilityWindow(
                auth = auth,
                body = AvailabilitySaveRequest(
                    carId = carId,
                    startDate = startDate,
                    endDate = endDate,
                    available = available,
                ),
            )
        }
    }

    suspend fun saveAvailabilityRecurring(carId: String, startDate: String, endDate: String, repeatDays: List<String>): AvailabilityMutationEnvelope {
        return authedCall { auth ->
            api.saveAvailabilityRecurring(
                auth = auth,
                body = AvailabilityRecurringRequest(
                    carId = carId,
                    startDate = startDate,
                    endDate = endDate,
                    repeatDays = repeatDays,
                ),
            )
        }
    }

    private fun guessMimeType(fileName: String): String {
        val lower = fileName.lowercase()
        return when {
            lower.endsWith(".png") -> "image/png"
            lower.endsWith(".webp") -> "image/webp"
            else -> "image/jpeg"
        }
    }
}

package com.hayame.app.core.repo

import com.hayame.app.BuildConfig
import com.hayame.app.core.network.NetworkClient
import com.hayame.app.core.session.SessionStore
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.util.UUID

class StorageRepository(
    private val sessionStore: SessionStore,
) {
    @Serializable
    private data class StorageListRequest(
        val prefix: String,
        val limit: Int = 30,
        val offset: Int = 0,
        val sortBy: StorageSortBy = StorageSortBy(),
    )

    @Serializable
    private data class StorageSortBy(
        val column: String = "name",
        val order: String = "desc",
    )

    @Serializable
    private data class StorageObjectItem(
        val name: String? = null,
    )

    private val httpClient = OkHttpClient.Builder().build()

    suspend fun uploadAvatar(userId: String, file: File): String {
        val auth = sessionStore.authHeader() ?: throw IllegalStateException("Unauthorized")
        val path = "$userId/avatar-${System.currentTimeMillis()}-${UUID.randomUUID()}.${file.extension.ifBlank { "jpg" }}"
        val buckets = buildList {
            addIfMissing(BuildConfig.SUPABASE_AVATAR_BUCKET)
            addIfMissing(BuildConfig.SUPABASE_STORAGE_BUCKET)
            addIfMissing("car-photos")
            addIfMissing("avatars")
        }
        var lastError: Throwable? = null

        for (bucket in buckets) {
            try {
                uploadObject(
                    authHeader = auth,
                    bucket = bucket,
                    objectPath = path,
                    file = file,
                    isPublic = true,
                )
                val baseUrl = BuildConfig.SUPABASE_URL.trimEnd('/')
                return "$baseUrl/storage/v1/object/public/$bucket/$path"
            } catch (error: Throwable) {
                lastError = error
                if (isBucketNotFound(error)) {
                    continue
                }
                throw error
            }
        }

        throw IllegalStateException("Unable to upload avatar")
    }

    suspend fun findLatestAvatarUrl(userId: String): String? {
        val auth = sessionStore.authHeader() ?: return null
        val normalizedUserId = userId.trim()
        if (normalizedUserId.isBlank()) return null

        val buckets = buildList {
            addIfMissing(BuildConfig.SUPABASE_AVATAR_BUCKET)
            addIfMissing(BuildConfig.SUPABASE_STORAGE_BUCKET)
            addIfMissing("avatars")
            addIfMissing("car-photos")
        }

        for (bucket in buckets) {
            val objectName = runCatching {
                listObjects(authHeader = auth, bucket = bucket, prefix = normalizedUserId)
                    .firstOrNull { item ->
                        item.name
                            ?.trim()
                            ?.lowercase()
                            ?.startsWith("avatar-") == true
                    }?.name
            }.getOrNull() ?: continue

            return publicObjectUrl(bucket = bucket, objectPath = "$normalizedUserId/$objectName")
        }

        return null
    }

    suspend fun uploadHostId(userId: String, side: String, file: File): String {
        val auth = sessionStore.authHeader() ?: throw IllegalStateException("Unauthorized")
        val normalizedSide = if (side.lowercase() == "back") "back" else "front"
        val path = "$userId/$normalizedSide-${System.currentTimeMillis()}-${UUID.randomUUID()}.${file.extension.ifBlank { "jpg" }}"
        uploadObject(
            authHeader = auth,
            bucket = BuildConfig.SUPABASE_HOST_ID_BUCKET.ifBlank { "host-ids" },
            objectPath = path,
            file = file,
            isPublic = false,
        )
        return path
    }

    private fun uploadObject(
        authHeader: String,
        bucket: String,
        objectPath: String,
        file: File,
        isPublic: Boolean,
    ) {
        val baseUrl = BuildConfig.SUPABASE_URL.trimEnd('/')
        require(baseUrl.isNotBlank()) { "SUPABASE_URL is missing" }
        require(BuildConfig.SUPABASE_ANON_KEY.isNotBlank()) { "SUPABASE_ANON_KEY is missing" }

        val encodedPath = objectPath.split("/").joinToString("/") { part -> java.net.URLEncoder.encode(part, "UTF-8").replace("+", "%20") }
        val url = "$baseUrl/storage/v1/object/$bucket/$encodedPath"

        val mime = when {
            file.name.lowercase().endsWith(".png") -> "image/png"
            file.name.lowercase().endsWith(".webp") -> "image/webp"
            else -> "image/jpeg"
        }
        val body = file.readBytes().toRequestBody(mime.toMediaType())

        val request = Request.Builder()
            .url(url)
            .header("Authorization", authHeader)
            .header("apikey", BuildConfig.SUPABASE_ANON_KEY)
            .header("x-upsert", "false")
            .header("Cache-Control", if (isPublic) "3600" else "0")
            .put(body)
            .build()

        val response = httpClient.newCall(request).execute()
        if (!response.isSuccessful) {
            val raw = response.body?.string().orEmpty()
            // Preserve bucket-fallback detection, but never let the raw Supabase body
            // (a direct-to-Supabase response, not sanitized by our backend) reach the UI.
            if (isBucketNotFound(raw)) throw IllegalStateException("bucket not found")
            throw IllegalStateException("Storage upload failed (${response.code})")
        }
    }

    private fun listObjects(
        authHeader: String,
        bucket: String,
        prefix: String,
    ): List<StorageObjectItem> {
        val baseUrl = BuildConfig.SUPABASE_URL.trimEnd('/')
        require(baseUrl.isNotBlank()) { "SUPABASE_URL is missing" }
        require(BuildConfig.SUPABASE_ANON_KEY.isNotBlank()) { "SUPABASE_ANON_KEY is missing" }

        val payload = NetworkClient.json.encodeToString(
            StorageListRequest(
                prefix = prefix,
                limit = 30,
                offset = 0,
                sortBy = StorageSortBy(column = "name", order = "desc"),
            ),
        )
        val request = Request.Builder()
            .url("$baseUrl/storage/v1/object/list/$bucket")
            .header("Authorization", authHeader)
            .header("apikey", BuildConfig.SUPABASE_ANON_KEY)
            .post(payload.toRequestBody("application/json".toMediaType()))
            .build()

        val response = httpClient.newCall(request).execute()
        val raw = response.body?.string().orEmpty()
        if (!response.isSuccessful) {
            if (isBucketNotFound(raw)) return emptyList()
            throw IllegalStateException("Storage list failed (${response.code})")
        }
        if (raw.isBlank()) return emptyList()
        return NetworkClient.json.decodeFromString(raw)
    }

    private fun publicObjectUrl(bucket: String, objectPath: String): String {
        val baseUrl = BuildConfig.SUPABASE_URL.trimEnd('/')
        val encodedPath = objectPath
            .split("/")
            .joinToString("/") { part -> java.net.URLEncoder.encode(part, "UTF-8").replace("+", "%20") }
        return "$baseUrl/storage/v1/object/public/$bucket/$encodedPath"
    }

    private fun MutableList<String>.addIfMissing(raw: String) {
        val trimmed = raw.trim()
        if (trimmed.isBlank() || contains(trimmed)) return
        add(trimmed)
    }

    private fun isBucketNotFound(error: Throwable): Boolean {
        val message = error.message.orEmpty().lowercase()
        return "bucket" in message && ("not found" in message || "does not exist" in message)
    }

    private fun isBucketNotFound(message: String): Boolean {
        val normalized = message.lowercase()
        return "bucket" in normalized && ("not found" in normalized || "does not exist" in normalized)
    }
}

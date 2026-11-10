package com.hayame.app.core.session

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.hayame.app.core.network.HayameApi
import com.hayame.app.core.network.RefreshRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import java.io.File

private val Context.dataStore by preferencesDataStore(name = "hayame_session")

data class SessionState(
    val accessToken: String? = null,
    val refreshToken: String? = null,
    val userId: String? = null,
)

class SessionStore(private val context: Context) {
    private object Keys {
        val access = stringPreferencesKey("access_token")
        val refresh = stringPreferencesKey("refresh_token")
        val userId = stringPreferencesKey("user_id")
        val seenAnnouncements = stringSetPreferencesKey("seen_announcement_ids")
        val firstLaunchAtMillis = longPreferencesKey("first_launch_at_millis")
        val darkMode = booleanPreferencesKey("dark_mode_enabled")
        // "system", "light" or "dark"; older builds only stored the boolean above.
        val appearanceMode = stringPreferencesKey("appearance_mode")
        // Home browse location — deliberately separate from the profile city.
        val browseCity = stringPreferencesKey("browse_city")
        val browseRegion = stringPreferencesKey("browse_region")
        // Checkout selections saved on this device before payment (JSON).
        val checkoutDraft = stringPreferencesKey("checkout_draft_json")
    }

    val sessionFlow: Flow<SessionState> = context.dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { prefs ->
            SessionState(
                accessToken = prefs[Keys.access],
                refreshToken = prefs[Keys.refresh],
                userId = prefs[Keys.userId],
            )
        }

    suspend fun current(): SessionState = sessionFlow.first()

    suspend fun saveSession(accessToken: String?, refreshToken: String?, userId: String?) {
        context.dataStore.edit { prefs ->
            putOrRemove(prefs, Keys.access, accessToken)
            putOrRemove(prefs, Keys.refresh, refreshToken)
            putOrRemove(prefs, Keys.userId, userId)
        }
    }

    suspend fun clear() {
        context.dataStore.edit { prefs ->
            val firstLaunchAtMillis = prefs[Keys.firstLaunchAtMillis]
            prefs.clear()
            if (firstLaunchAtMillis != null && firstLaunchAtMillis > 0L) {
                prefs[Keys.firstLaunchAtMillis] = firstLaunchAtMillis
            }
        }
    }

    suspend fun seenAnnouncementIds(): Set<String> {
        return context.dataStore.data
            .catch { emit(emptyPreferences()) }
            .map { prefs -> prefs[Keys.seenAnnouncements] ?: emptySet() }
            .first()
    }

    suspend fun markAnnouncementSeen(announcementId: String) {
        val normalized = announcementId.trim()
        if (normalized.isEmpty()) return
        context.dataStore.edit { prefs ->
            val current = prefs[Keys.seenAnnouncements] ?: emptySet()
            prefs[Keys.seenAnnouncements] = current + normalized
        }
    }

    suspend fun firstLaunchAtMillis(): Long {
        val existing = context.dataStore.data
            .catch { emit(emptyPreferences()) }
            .map { prefs -> prefs[Keys.firstLaunchAtMillis] }
            .first()
        if (existing != null && existing > 0L) return existing

        val now = System.currentTimeMillis()
        context.dataStore.edit { prefs ->
            if ((prefs[Keys.firstLaunchAtMillis] ?: 0L) <= 0L) {
                prefs[Keys.firstLaunchAtMillis] = now
            }
        }
        return now
    }

    suspend fun darkMode(): Boolean {
        return context.dataStore.data
            .catch { emit(emptyPreferences()) }
            .map { prefs -> prefs[Keys.darkMode] ?: false }
            .first()
    }

    suspend fun setDarkMode(enabled: Boolean) {
        context.dataStore.edit { prefs -> prefs[Keys.darkMode] = enabled }
    }

    /** "system", "light" or "dark". Falls back to the legacy on/off switch, then to "system". */
    suspend fun appearanceMode(): String {
        return context.dataStore.data
            .catch { emit(emptyPreferences()) }
            .map { prefs ->
                prefs[Keys.appearanceMode] ?: when (prefs[Keys.darkMode]) {
                    true -> "dark"
                    false -> "light"
                    null -> "system"
                }
            }
            .first()
    }

    suspend fun setAppearanceMode(mode: String) {
        context.dataStore.edit { prefs -> prefs[Keys.appearanceMode] = mode }
    }

    suspend fun browseLocation(): Pair<String, String> {
        return context.dataStore.data
            .catch { emit(emptyPreferences()) }
            .map { prefs -> (prefs[Keys.browseCity] ?: "") to (prefs[Keys.browseRegion] ?: "") }
            .first()
    }

    suspend fun setBrowseLocation(city: String, region: String) {
        context.dataStore.edit { prefs ->
            putOrRemove(prefs, Keys.browseCity, city)
            putOrRemove(prefs, Keys.browseRegion, region)
        }
    }

    suspend fun checkoutDraftJson(): String? {
        return context.dataStore.data
            .catch { emit(emptyPreferences()) }
            .map { prefs -> prefs[Keys.checkoutDraft] }
            .first()
    }

    suspend fun setCheckoutDraftJson(json: String?) {
        context.dataStore.edit { prefs -> putOrRemove(prefs, Keys.checkoutDraft, json) }
    }

    /**
     * Last copy of a policy document ("protection", "cancellation", "privacy") that loaded,
     * kept as a small JSON file in the cache directory so the page opens at once and offline.
     * The text is public and the same for everyone, so signing out leaves it in place.
     */
    suspend fun legalDocumentJson(slug: String): String? = withContext(Dispatchers.IO) {
        runCatching { legalDocumentFile(slug)?.takeIf { it.isFile }?.readText() }
            .getOrNull()
            ?.takeIf { it.isNotBlank() }
    }

    suspend fun setLegalDocumentJson(slug: String, json: String) {
        withContext(Dispatchers.IO) {
            runCatching {
                val file = legalDocumentFile(slug) ?: return@runCatching
                file.parentFile?.mkdirs()
                // Written beside the file and renamed, so a half-written copy is never read.
                val pending = File(file.parentFile, file.name + ".tmp")
                pending.writeText(json)
                if (!pending.renameTo(file)) {
                    file.writeText(json)
                    pending.delete()
                }
            }
        }
    }

    private fun legalDocumentFile(slug: String): File? {
        val safe = slug.trim().lowercase().filter { it in 'a'..'z' || it == '-' }
        if (safe.isEmpty()) return null
        return File(File(context.cacheDir, "legal-documents"), "$safe.json")
    }

    suspend fun authHeader(): String? = current().accessToken?.let { "Bearer $it" }

    suspend fun refreshIfNeeded(api: HayameApi): Boolean {
        val session = current()
        val refreshToken = session.refreshToken ?: return false
        return runCatching {
            val refreshed = api.refresh(RefreshRequest(refresh_token = refreshToken))
            val nextAccess = refreshed.access_token
            val nextRefresh = refreshed.refresh_token ?: refreshToken
            if (nextAccess.isNullOrBlank()) return false
            saveSession(nextAccess, nextRefresh, refreshed.user?.id ?: session.userId)
            true
        }.getOrDefault(false)
    }

    private fun putOrRemove(prefs: androidx.datastore.preferences.core.MutablePreferences, key: Preferences.Key<String>, value: String?) {
        if (value.isNullOrBlank()) {
            prefs.remove(key)
        } else {
            prefs[key] = value
        }
    }
}

package com.hayame.app.core.session

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.hayame.app.core.network.HayameApi
import com.hayame.app.core.network.RefreshRequest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

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
        context.dataStore.edit { it.clear() }
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

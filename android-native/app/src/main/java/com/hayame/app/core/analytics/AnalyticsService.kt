package com.hayame.app.core.analytics

import android.content.Context
import com.hayame.app.BuildConfig
import com.hayame.app.core.session.SessionStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.TimeUnit

/** First-party, consent-gated product analytics matching the iOS client. */
object AnalyticsService {
    private const val PolicyVersion = "2026-07-17"
    private const val ConsentKey = "analytics_consent"
    private const val ConsentVersionKey = "analytics_consent_version"
    private const val SessionKey = "analytics_session_key"

    private val allowedEvents = setOf(
        "search", "car_view", "car_favorited", "car_unfavorited",
        "booking_started", "booking_payment_started", "booking_completed",
        "signup_completed", "login_completed", "host_application_started",
        "host_application_submitted", "message_sent", "review_submitted",
    )
    private val allowedProps = setOf(
        "car_id", "q", "region", "city", "results", "filters", "days",
        "price_bucket", "step", "reason", "source", "position",
    )

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val client = OkHttpClient.Builder()
        .connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .build()
    private val pending = mutableListOf<Pair<String, Map<String, Any?>>>()

    private lateinit var appContext: Context
    private lateinit var sessionStore: SessionStore

    fun initialize(context: Context, sessions: SessionStore) {
        appContext = context.applicationContext
        sessionStore = sessions
    }

    fun needsConsentDecision(): Boolean {
        if (!::appContext.isInitialized) return false
        val prefs = preferences()
        return prefs.getString(ConsentVersionKey, null) != PolicyVersion ||
            prefs.getString(ConsentKey, null) !in setOf("granted", "denied")
    }

    fun hasConsent(): Boolean = !needsConsentDecision() &&
        preferences().getString(ConsentKey, null) == "granted"

    fun setConsent(granted: Boolean) {
        preferences().edit()
            .putString(ConsentKey, if (granted) "granted" else "denied")
            .putString(ConsentVersionKey, PolicyVersion)
            .apply()

        val queued = synchronized(pending) {
            val result = if (granted) pending.toList() else emptyList()
            pending.clear()
            result
        }
        if (!granted) preferences().edit().remove(SessionKey).apply()
        recordConsent(granted)
        if (granted) queued.forEach { (name, props) -> track(name, props) }
    }

    fun track(name: String, props: Map<String, Any?> = emptyMap()) {
        if (name !in allowedEvents || !::appContext.isInitialized) return
        if (needsConsentDecision()) {
            synchronized(pending) {
                if (pending.size < 30) pending += name to sanitize(props)
            }
            return
        }
        if (!hasConsent()) return

        scope.launch {
            val event = JSONObject().put("name", name).put("props", JSONObject(sanitize(props)))
            val body = JSONObject()
                .put("events", JSONArray().put(event))
                .put("platform", "android")
                .put("appVersion", BuildConfig.VERSION_NAME)
                .put("sessionKey", sessionKey())
            post("/api/analytics", body)
        }
    }

    private fun recordConsent(granted: Boolean) {
        scope.launch {
            val body = JSONObject()
                .put("analytics", granted)
                .put("platform", "android")
            if (granted) body.put("sessionKey", sessionKey())
            post("/api/consent", body)
        }
    }

    private suspend fun post(path: String, json: JSONObject) {
        runCatching {
            val request = Request.Builder()
                .url(BuildConfig.API_BASE_URL.trimEnd('/') + path)
                .header("Content-Type", "application/json")
                .apply { sessionStore.authHeader()?.let { header("Authorization", it) } }
                .post(json.toString().toRequestBody("application/json".toMediaType()))
                .build()
            client.newCall(request).execute().close()
        }
    }

    private fun sanitize(input: Map<String, Any?>): Map<String, Any?> = buildMap {
        input.forEach { (key, value) ->
            if (key !in allowedProps) return@forEach
            when (value) {
                null, is Boolean, is Int, is Long, is Float, is Double -> put(key, value)
                is String -> put(key, value.take(200))
            }
        }
    }

    private fun sessionKey(): String {
        val prefs = preferences()
        prefs.getString(SessionKey, null)?.let { return it }
        val random = UUID.randomUUID().toString().replace("-", "").take(12).lowercase()
        return "sess_${random}_${System.currentTimeMillis()}".also {
            prefs.edit().putString(SessionKey, it).apply()
        }
    }

    private fun preferences() = appContext.getSharedPreferences("hayame_analytics", Context.MODE_PRIVATE)
}

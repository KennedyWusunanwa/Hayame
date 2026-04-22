package com.hayame.app.push

import android.content.Context

object PushTokenStore {
    private const val PREFS_NAME = "hayame_push"
    private const val KEY_CURRENT_TOKEN = "current_token"
    private const val KEY_LAST_UPLOADED_TOKEN = "last_uploaded_token"

    @Volatile
    private var appContext: Context? = null

    fun initialize(context: Context) {
        appContext = context.applicationContext
    }

    fun saveCurrentToken(token: String?) {
        edit(KEY_CURRENT_TOKEN, token)
    }

    fun currentToken(): String? = read(KEY_CURRENT_TOKEN)

    fun markUploadedToken(token: String?) {
        edit(KEY_LAST_UPLOADED_TOKEN, token)
    }

    fun lastUploadedToken(): String? = read(KEY_LAST_UPLOADED_TOKEN)

    fun clearUploadedToken() {
        edit(KEY_LAST_UPLOADED_TOKEN, null)
    }

    private fun read(key: String): String? {
        val prefs = appContext?.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE) ?: return null
        return prefs.getString(key, null)?.trim()?.takeIf { it.isNotEmpty() }
    }

    private fun edit(key: String, value: String?) {
        val prefs = appContext?.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE) ?: return
        prefs.edit().apply {
            if (value.isNullOrBlank()) {
                remove(key)
            } else {
                putString(key, value.trim())
            }
        }.apply()
    }
}

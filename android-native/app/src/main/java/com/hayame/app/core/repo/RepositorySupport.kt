package com.hayame.app.core.repo

import com.hayame.app.core.network.HayameApi
import com.hayame.app.core.session.SessionStore
import retrofit2.HttpException

open class RepositorySupport(
    protected val api: HayameApi,
    protected val sessionStore: SessionStore,
) {
    protected suspend fun requireAuthHeader(): String {
        return sessionStore.authHeader() ?: throw IllegalStateException("You need to sign in first.")
    }

    protected suspend fun <T> authedCall(block: suspend (authHeader: String) -> T): T {
        val auth = requireAuthHeader()
        return try {
            block(auth)
        } catch (error: Throwable) {
            if (error is HttpException && error.code() == 401) {
                val refreshed = sessionStore.refreshIfNeeded(api)
                if (refreshed) {
                    val retriedAuth = requireAuthHeader()
                    return block(retriedAuth)
                }
            }
            throw error
        }
    }
}

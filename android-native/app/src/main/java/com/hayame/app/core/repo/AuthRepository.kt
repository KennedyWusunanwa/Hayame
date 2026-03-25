package com.hayame.app.core.repo

import com.hayame.app.core.network.AuthSessionDto
import com.hayame.app.core.network.EmailRequest
import com.hayame.app.core.network.HayameApi
import com.hayame.app.core.network.LoginRequest
import com.hayame.app.core.network.MobileMeDto
import com.hayame.app.core.network.SignupRequest
import com.hayame.app.core.session.SessionStore

class AuthRepository(
    api: HayameApi,
    sessionStore: SessionStore,
) : RepositorySupport(api, sessionStore) {

    suspend fun login(email: String, password: String): AuthSessionDto {
        val response = api.login(LoginRequest(email = email.trim(), password = password))
        persistSession(response)
        return response
    }

    suspend fun signup(
        firstName: String,
        lastName: String,
        email: String,
        password: String,
        city: String,
        region: String,
    ): AuthSessionDto {
        val response = api.signup(
            SignupRequest(
                first_name = firstName.trim(),
                last_name = lastName.trim(),
                email = email.trim(),
                password = password,
                city = city.trim(),
                region = region.trim(),
            ),
        )
        persistSession(response)
        return response
    }

    suspend fun getMe(): MobileMeDto {
        return authedCall { auth ->
            val me = api.me(auth)
            val current = sessionStore.current()
            sessionStore.saveSession(current.accessToken, current.refreshToken, me.user.id)
            me
        }
    }

    suspend fun resendConfirmation(email: String) {
        api.resendConfirmation(EmailRequest(email.trim()))
    }

    suspend fun forgotPassword(email: String) {
        api.forgotPassword(EmailRequest(email.trim()))
    }

    suspend fun logout() {
        sessionStore.clear()
    }

    suspend fun isLoggedIn(): Boolean = !sessionStore.current().accessToken.isNullOrBlank()

    private suspend fun persistSession(session: AuthSessionDto) {
        sessionStore.saveSession(
            accessToken = session.access_token,
            refreshToken = session.refresh_token,
            userId = session.user?.id,
        )
    }
}

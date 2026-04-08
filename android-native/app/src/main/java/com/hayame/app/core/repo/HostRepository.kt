package com.hayame.app.core.repo

import com.hayame.app.core.network.HayameApi
import com.hayame.app.core.network.HostApplicationEnvelope
import com.hayame.app.core.network.HostApplicationRequest
import com.hayame.app.core.network.HostStatusDto
import com.hayame.app.core.network.AppAnnouncementsEnvelope
import com.hayame.app.core.network.NotificationPreferencesDto
import com.hayame.app.core.network.NotificationPreferencesEnvelope
import com.hayame.app.core.network.NotificationPreferencesUpdateRequest
import com.hayame.app.core.network.PushRegisterRequest
import com.hayame.app.core.network.PushRegisterResponse
import com.hayame.app.core.network.PushStatusEnvelope
import com.hayame.app.core.session.SessionStore

class HostRepository(
    api: HayameApi,
    sessionStore: SessionStore,
) : RepositorySupport(api, sessionStore) {

    suspend fun hostStatus(): HostStatusDto {
        return authedCall { auth -> api.hostStatus(auth) }
    }

    suspend fun hostApplication(): HostApplicationEnvelope {
        return authedCall { auth -> api.hostApplication(auth) }
    }

    suspend fun submitHostApplication(request: HostApplicationRequest): HostApplicationEnvelope {
        return authedCall { auth -> api.submitHostApplication(auth, request) }
    }

    suspend fun activateHost(): HostStatusDto {
        return authedCall { auth -> api.activateHost(auth) }
    }

    suspend fun registerAndroidPushToken(token: String): PushRegisterResponse {
        return authedCall { auth ->
            api.registerPush(auth = auth, body = PushRegisterRequest(deviceToken = token, platform = "android"))
        }
    }

    suspend fun pushStatus(): PushStatusEnvelope {
        return authedCall { auth -> api.pushStatus(auth) }
    }

    suspend fun notificationPreferences(): NotificationPreferencesEnvelope {
        return authedCall { auth -> api.notificationPreferences(auth) }
    }

    suspend fun updateNotificationPreferences(
        preferences: NotificationPreferencesDto,
    ): NotificationPreferencesEnvelope {
        val body = NotificationPreferencesUpdateRequest(
            booking_updates = preferences.booking_updates ?: true,
            messages = preferences.messages ?: true,
            account_security = preferences.account_security ?: true,
            news_announcements = preferences.news_announcements ?: false,
        )
        return authedCall { auth -> api.updateNotificationPreferences(auth, body) }
    }

    suspend fun announcements(): AppAnnouncementsEnvelope {
        val auth = sessionStore.authHeader()
        return api.announcements(auth)
    }

    suspend fun markAnnouncementSeen(announcementId: String) {
        authedCall { auth ->
            api.markAnnouncementSeen(auth, announcementId)
        }
    }
}

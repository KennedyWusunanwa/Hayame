package com.hayame.app.core.repo

import com.hayame.app.core.network.HayameApi
import com.hayame.app.core.network.HostApplicationEnvelope
import com.hayame.app.core.network.HostApplicationRequest
import com.hayame.app.core.network.HostStatusDto
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
}

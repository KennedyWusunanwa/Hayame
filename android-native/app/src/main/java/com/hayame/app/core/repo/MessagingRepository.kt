package com.hayame.app.core.repo

import com.hayame.app.core.network.ConversationCreateDto
import com.hayame.app.core.network.ConversationCreateRequest
import com.hayame.app.core.network.ConversationsEnvelope
import com.hayame.app.core.network.HayameApi
import com.hayame.app.core.network.MessageEnvelope
import com.hayame.app.core.network.MessageSendRequest
import com.hayame.app.core.network.MessagesEnvelope
import com.hayame.app.core.session.SessionStore

class MessagingRepository(
    api: HayameApi,
    sessionStore: SessionStore,
) : RepositorySupport(api, sessionStore) {

    suspend fun conversations(): ConversationsEnvelope {
        return authedCall { auth -> api.getConversations(auth) }
    }

    suspend fun createConversation(
        hostId: String? = null,
        participantId: String? = null,
        carId: String? = null,
    ): ConversationCreateDto {
        return authedCall { auth ->
            api.createConversation(
                auth = auth,
                body = ConversationCreateRequest(
                    hostId = hostId,
                    participantId = participantId,
                    carId = carId,
                ),
            )
        }
    }

    suspend fun messages(
        conversationId: String,
        markRead: Boolean = true,
        since: String? = null,
        limit: Int = 200,
    ): MessagesEnvelope {
        val safeLimit = limit.coerceIn(1, 500)
        return authedCall { auth ->
            api.getMessages(
                auth = auth,
                conversationId = conversationId,
                markRead = if (markRead) 1 else 0,
                since = since,
                limit = safeLimit,
            )
        }
    }

    suspend fun sendMessage(conversationId: String, body: String): MessageEnvelope {
        return authedCall { auth ->
            api.sendMessage(auth = auth, body = MessageSendRequest(conversationId = conversationId, body = body))
        }
    }
}

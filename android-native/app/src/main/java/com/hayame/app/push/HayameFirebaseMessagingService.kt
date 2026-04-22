package com.hayame.app.push

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.hayame.app.HayameApplication
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.hayame.app.MainActivity
import com.hayame.app.R
import com.hayame.app.ui.viewmodel.AppViewModel
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class HayameFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        AppViewModel.cachePushToken(token)
        val previousToken = PushTokenStore.lastUploadedToken()?.takeIf { it != token }
        val container = (application as? HayameApplication)?.container ?: return
        CoroutineScope(Dispatchers.IO).launch {
            runCatching { container.hostRepository.registerAndroidPushToken(token, previousToken) }
                .onSuccess { response ->
                    if (response.registered != false) {
                        PushTokenStore.markUploadedToken(token)
                    }
                }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        val category = message.data["notificationCategory"].orEmpty()
        val channelId = ensureChannel(category)

        val title = message.notification?.title ?: message.data["title"] ?: "Hayame"
        val body = message.notification?.body ?: message.data["body"] ?: "You have a new update."

        val conversationId = message.data["conversationId"]
        val bookingId = message.data["bookingId"]
        val recipientRole = message.data["recipientRole"]

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("conversationId", conversationId)
            putExtra("bookingId", bookingId)
            putExtra("recipientRole", recipientRole)
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            (System.currentTimeMillis() % Int.MAX_VALUE).toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        NotificationManagerCompat.from(this)
            .notify((System.currentTimeMillis() % Int.MAX_VALUE).toInt(), notification)
    }

    private fun ensureChannel(category: String): String {
        val channelId = channelIdFor(category)
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return channelId
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (manager.getNotificationChannel(channelId) == null) {
            manager.createNotificationChannel(
                NotificationChannel(
                    channelId,
                    channelNameFor(category),
                    NotificationManager.IMPORTANCE_HIGH,
                ).apply {
                    description = channelDescriptionFor(category)
                },
            )
        }
        return channelId
    }

    companion object {
        const val CHANNEL_ID = "hayame_updates"

        private fun channelIdFor(category: String): String {
            return when (category.trim().lowercase()) {
                "messages" -> "hayame_messages"
                "booking_updates" -> "hayame_bookings"
                "news_announcements" -> "hayame_news"
                "account_security" -> "hayame_account"
                else -> CHANNEL_ID
            }
        }

        private fun channelNameFor(category: String): String {
            return when (category.trim().lowercase()) {
                "messages" -> "Messages"
                "booking_updates" -> "Trips & bookings"
                "news_announcements" -> "News & announcements"
                "account_security" -> "Account & security"
                else -> "Hayame updates"
            }
        }

        private fun channelDescriptionFor(category: String): String {
            return when (category.trim().lowercase()) {
                "messages" -> "New messages and conversation replies"
                "booking_updates" -> "Trip approvals, confirmations, and booking changes"
                "news_announcements" -> "Optional Hayame news and announcement updates"
                "account_security" -> "Identity, host application, and critical account notices"
                else -> "General Hayame updates"
            }
        }
    }
}

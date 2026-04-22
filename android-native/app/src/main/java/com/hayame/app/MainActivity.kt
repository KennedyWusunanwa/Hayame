package com.hayame.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import com.hayame.app.ui.navigation.HayameNavApp
import com.hayame.app.ui.theme.HayameTheme
import com.hayame.app.ui.viewmodel.AppViewModel
import com.hayame.app.ui.viewmodel.AppViewModelFactory

class MainActivity : ComponentActivity() {
    private lateinit var viewModelFactory: AppViewModelFactory
    private val viewModel: AppViewModel by viewModels { viewModelFactory }

    private var pendingConversationId by mutableStateOf<String?>(null)
    private var pendingBookingId by mutableStateOf<String?>(null)
    private var pendingBookingRecipientRole by mutableStateOf<String?>(null)
    private var pendingPaystackCallbackUri by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        val container = (application as HayameApplication).container
        viewModelFactory = AppViewModelFactory(container)
        super.onCreate(savedInstanceState)

        ingestIntent(intent)
        val firebaseApp = FirebaseApp.initializeApp(this)
        if (firebaseApp != null) {
            FirebaseMessaging.getInstance().token
                .addOnSuccessListener { token ->
                    AppViewModel.cachePushToken(token)
                    viewModel.registerPushIfAvailable(token)
                }
        }

        setContent {
            HayameTheme {
                HayameNavApp(
                    viewModel = viewModel,
                    pendingConversationId = pendingConversationId,
                    pendingBookingId = pendingBookingId,
                    pendingBookingRecipientRole = pendingBookingRecipientRole,
                    pendingPaystackCallbackUri = pendingPaystackCallbackUri,
                    onConversationConsumed = { pendingConversationId = null },
                    onBookingConsumed = {
                        pendingBookingId = null
                        pendingBookingRecipientRole = null
                    },
                    onPaystackCallbackConsumed = { pendingPaystackCallbackUri = null },
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        ingestIntent(intent)
    }

    private fun ingestIntent(intent: Intent?) {
        val fromExtra = intent?.getStringExtra("conversationId")
        val fromData = intent?.data?.getQueryParameter("conversationId")
        val resolved = if (!fromExtra.isNullOrBlank()) fromExtra else fromData
        if (!resolved.isNullOrBlank()) {
            pendingConversationId = resolved
            return
        }

        val bookingFromExtra = intent?.getStringExtra("bookingId")
        val bookingFromData = intent?.data?.getQueryParameter("bookingId")
        val resolvedBooking = if (!bookingFromExtra.isNullOrBlank()) bookingFromExtra else bookingFromData
        if (!resolvedBooking.isNullOrBlank()) {
            pendingBookingId = resolvedBooking
            pendingBookingRecipientRole =
                intent?.getStringExtra("recipientRole")
                    ?: intent?.data?.getQueryParameter("recipientRole")
            return
        }

        val data = intent?.data
        val scheme = data?.scheme?.lowercase()
        if ((scheme == "hayameandroid" || scheme == "hayame") && data != null) {
            pendingPaystackCallbackUri = data.toString()
        }
    }
}

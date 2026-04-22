package com.hayame.app

import android.app.Application
import com.hayame.app.core.network.NetworkClient
import com.hayame.app.core.repo.AuthRepository
import com.hayame.app.core.repo.BookingRepository
import com.hayame.app.core.repo.CarsRepository
import com.hayame.app.core.repo.HostRepository
import com.hayame.app.core.repo.MessagingRepository
import com.hayame.app.core.repo.StorageRepository
import com.hayame.app.core.session.SessionStore
import com.hayame.app.push.PushTokenStore

class HayameApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        PushTokenStore.initialize(this)
        container = AppContainer(this)
    }
}

class AppContainer(application: Application) {
    private val sessionStore = SessionStore(application.applicationContext)
    private val api = NetworkClient.api

    val authRepository = AuthRepository(api, sessionStore)
    val carsRepository = CarsRepository(api, sessionStore)
    val bookingRepository = BookingRepository(api, sessionStore)
    val messagingRepository = MessagingRepository(api, sessionStore)
    val hostRepository = HostRepository(api, sessionStore)
    val storageRepository = StorageRepository(sessionStore)
    val session = sessionStore
}

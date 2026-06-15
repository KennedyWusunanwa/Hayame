package com.hayame.app

import android.app.Application
import coil.ImageLoader
import coil.ImageLoaderFactory
import coil.disk.DiskCache
import coil.memory.MemoryCache
import com.hayame.app.core.network.NetworkClient
import com.hayame.app.core.repo.AuthRepository
import com.hayame.app.core.repo.BookingRepository
import com.hayame.app.core.repo.CarsRepository
import com.hayame.app.core.repo.HostRepository
import com.hayame.app.core.repo.MessagingRepository
import com.hayame.app.core.repo.StorageRepository
import com.hayame.app.core.session.SessionStore
import com.hayame.app.push.PushTokenStore

class HayameApplication : Application(), ImageLoaderFactory {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        PushTokenStore.initialize(this)
        NetworkClient.initialize(this)
        container = AppContainer(this)
    }

    override fun newImageLoader(): ImageLoader {
        return ImageLoader.Builder(this)
            .memoryCache {
                MemoryCache.Builder(this)
                    .maxSizePercent(0.25)
                    .build()
            }
            .diskCache {
                DiskCache.Builder()
                    .directory(cacheDir.resolve("image-cache"))
                    .maxSizeBytes(300L * 1024L * 1024L)
                    .build()
            }
            .okHttpClient { NetworkClient.imageOkHttpClient(this) }
            .respectCacheHeaders(false)
            .crossfade(false)
            .build()
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

package com.hayame.app.core.network

import android.content.Context
import com.hayame.app.BuildConfig
import kotlinx.serialization.json.Json
import okhttp3.Cache
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import okhttp3.MediaType.Companion.toMediaType
import java.io.File
import java.util.concurrent.TimeUnit

object NetworkClient {
    val json: Json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        coerceInputValues = true
        encodeDefaults = true
    }

    private val baseUrl: String = BuildConfig.API_BASE_URL.trimEnd('/') + "/"
    @Volatile private var appContext: Context? = null

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BASIC
    }

    fun initialize(context: Context) {
        appContext = context.applicationContext
    }

    private fun cache(name: String, maxSizeBytes: Long): Cache? {
        val context = appContext ?: return null
        return Cache(File(context.cacheDir, name), maxSizeBytes)
    }

    private val okHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .writeTimeout(20, TimeUnit.SECONDS)
            .callTimeout(30, TimeUnit.SECONDS)
            .cache(cache("http-cache", 50L * 1024L * 1024L))
            .apply {
                if (BuildConfig.DEBUG) {
                    addInterceptor(loggingInterceptor)
                }
            }
            .build()
    }

    fun imageOkHttpClient(context: Context): OkHttpClient {
        initialize(context)
        return OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(25, TimeUnit.SECONDS)
            .writeTimeout(20, TimeUnit.SECONDS)
            .callTimeout(35, TimeUnit.SECONDS)
            .cache(cache("image-http-cache", 200L * 1024L * 1024L))
            .build()
    }

    val api: HayameApi by lazy {
        Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(HayameApi::class.java)
    }
}

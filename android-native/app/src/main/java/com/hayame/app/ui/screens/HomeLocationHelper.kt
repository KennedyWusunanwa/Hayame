package com.hayame.app.ui.screens

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Geocoder
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import com.hayame.app.ui.reference.AndroidReferenceData
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import java.util.Locale

data class HomeLocation(
    val lat: Double,
    val lng: Double,
    val cityName: String?,
    val regionName: String? = null,
)

fun hasHomeLocationPermission(context: Context): Boolean =
    ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.ACCESS_COARSE_LOCATION,
    ) == PackageManager.PERMISSION_GRANTED

@SuppressLint("MissingPermission")
suspend fun fetchHomeLocation(context: Context): HomeLocation? = withContext(Dispatchers.IO) {
    if (!hasHomeLocationPermission(context)) return@withContext null

    try {
        val client = LocationServices.getFusedLocationProviderClient(context)
        val cts = CancellationTokenSource()
        val loc = try {
            withTimeoutOrNull(2_500) {
                client.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, cts.token).await()
            } ?: withTimeoutOrNull(750) { client.lastLocation.await() }
        } finally {
            cts.cancel()
        } ?: return@withContext null
        val geocoder = Geocoder(context, Locale.getDefault())
        @Suppress("DEPRECATION")
        val addresses = geocoder.getFromLocation(loc.latitude, loc.longitude, 1)
        val address = addresses?.firstOrNull()
        val countryCode = address?.countryCode?.trim()?.uppercase(Locale.US)
        if (!countryCode.isNullOrBlank() && countryCode != "GH") return@withContext null

        val rawRegion = address?.adminArea?.trim().orEmpty()
        val strippedRegion = rawRegion.removeSuffix(" Region").trim()
        val region = AndroidReferenceData.regions.firstOrNull { known ->
            known.equals(rawRegion, ignoreCase = true) ||
                known.removeSuffix(" Region").equals(strippedRegion, ignoreCase = true)
        }
        val city = listOf(address?.locality, address?.subAdminArea)
            .mapNotNull { it?.trim()?.takeIf(String::isNotBlank) }
            .firstNotNullOfOrNull { candidate ->
                AndroidReferenceData.canonicalCity(candidate, region)
            }
        if (countryCode != "GH" && city == null && region == null) return@withContext null
        HomeLocation(loc.latitude, loc.longitude, city, region)
    } catch (_: Exception) {
        null
    }
}

fun distanceKm(lat1: Double, lng1: Double, lat2: Double, lng2: Double): Double {
    val radiusKm = 6371.0
    val dLat = Math.toRadians(lat2 - lat1)
    val dLng = Math.toRadians(lng2 - lng1)
    val a = Math.sin(dLat / 2).let { it * it } +
        Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
        Math.sin(dLng / 2).let { it * it }
    return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

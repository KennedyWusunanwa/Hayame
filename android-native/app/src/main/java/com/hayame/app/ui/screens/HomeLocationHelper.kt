package com.hayame.app.ui.screens

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Geocoder
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.tasks.await
import java.util.Locale

data class HomeLocation(val lat: Double, val lng: Double, val cityName: String?)

suspend fun fetchHomeLocation(context: Context): HomeLocation? {
    val hasPermission = ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.ACCESS_COARSE_LOCATION,
    ) == PackageManager.PERMISSION_GRANTED
    if (!hasPermission) return null

    return try {
        val client = LocationServices.getFusedLocationProviderClient(context)
        val cts = CancellationTokenSource()
        val loc = client.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, cts.token).await()
            ?: return null
        val geocoder = Geocoder(context, Locale.getDefault())
        @Suppress("DEPRECATION")
        val addresses = geocoder.getFromLocation(loc.latitude, loc.longitude, 1)
        val city = addresses?.firstOrNull()?.locality ?: addresses?.firstOrNull()?.adminArea
        HomeLocation(loc.latitude, loc.longitude, city)
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

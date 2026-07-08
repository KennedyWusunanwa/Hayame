package com.hayame.app.ui.components

import android.net.Uri
import com.hayame.app.BuildConfig

object RemoteImageUrlResolver {
    private const val defaultBaseUrl = "https://www.hayamegh.com"
    private const val urlEncodingAllowlist = ":/?#[]@!$&'()*+,;=%-._~"

    const val OBJECT_PUBLIC = "/storage/v1/object/public/"
    const val WESERV_BASE = "https://images.weserv.nl/"

    /** Master switch for the image resizer (weserv CDN). ON: fetch small WebP variants
     *  sized per view; if a variant fails, [SupabaseTransformFallbackInterceptor] refetches
     *  the original, so images can't break. (We use weserv because Supabase's own render
     *  endpoint was unreliable + distorted aspect ratios.) */
    private const val enableImageTransforms = true
    /** Default variant width for cards/thumbnails; big enough for full-width cards on 3x screens. */
    private const val defaultImageWidth = 900
    private const val defaultImageQuality = 68

    fun resolve(raw: String?): String? = resolve(raw, defaultImageWidth, defaultImageQuality)

    fun resolve(raw: String?, width: Int, quality: Int = defaultImageQuality): String? {
        val canonical = canonicalString(raw) ?: return null
        val sanitized = sanitizeAbsoluteUrl(canonical) ?: return null
        return transformed(sanitized, width, quality)
    }

    /**
     * Builds a right-sized WebP URL via the weserv image CDN for a Supabase public object,
     * so we download a small variant sized to [width] instead of the multi-MB original.
     * Non-Supabase URLs (and already-proxied URLs) pass through unchanged. weserv preserves
     * aspect ratio (width only). If it ever fails, the fallback interceptor refetches the
     * original, so there is no regression.
     */
    fun transformed(absoluteUrl: String?, width: Int, quality: Int = defaultImageQuality): String? {
        val url = absoluteUrl ?: return null
        if (!enableImageTransforms) return url
        if (!url.contains(OBJECT_PUBLIC) || url.startsWith(WESERV_BASE)) return url
        val cappedWidth = width.coerceIn(1, 2000)
        val encoded = java.net.URLEncoder.encode(url, "UTF-8")
        return "$WESERV_BASE?url=$encoded&w=$cappedWidth&output=webp&q=$quality"
    }

    /** Reverses [transformed] to recover the original object URL for fallback fetches. */
    fun originalUrl(transformedUrl: String): String {
        if (!transformedUrl.startsWith(WESERV_BASE)) return transformedUrl
        val marker = "url="
        val start = transformedUrl.indexOf(marker)
        if (start < 0) return transformedUrl
        val encoded = transformedUrl.substring(start + marker.length).substringBefore("&")
        return try {
            java.net.URLDecoder.decode(encoded, "UTF-8")
        } catch (_: Exception) {
            transformedUrl
        }
    }

    fun canonicalString(raw: String?): String? {
        var candidate = raw?.trim().orEmpty()
        if (candidate.isBlank()) return null

        candidate = candidate.replace("&amp;", "&")

        if (candidate.startsWith("data:", ignoreCase = true) || isPlaceholder(candidate) || isNullish(candidate)) {
            return null
        }

        val absolute = when {
            hasScheme(candidate) -> candidate
            candidate.startsWith("//") -> "https:$candidate"
            candidate.startsWith("/") -> {
                val base = if (isSupabaseStoragePath(candidate)) supabaseBaseUrl() else apiBaseUrl()
                "$base$candidate"
            }
            else -> {
                val base = if (isSupabaseStoragePath(candidate)) supabaseBaseUrl() else apiBaseUrl()
                "$base/$candidate"
            }
        }

        return absolute
    }

    private fun isPlaceholder(value: String): Boolean {
        val lowered = value.lowercase()
        return lowered == "/car-placeholder.jpg" || lowered.endsWith("/car-placeholder.jpg")
    }

    private fun isNullish(value: String): Boolean {
        return when (value.trim().lowercase()) {
            "null", "(null)", "undefined" -> true
            else -> false
        }
    }

    private fun hasScheme(value: String): Boolean {
        val uri = Uri.parse(value)
        return !uri.scheme.isNullOrBlank()
    }

    private fun isSupabaseStoragePath(value: String): Boolean {
        val normalized = value.trim().lowercase()
        return normalized.startsWith("/storage/v1/object/") || normalized.startsWith("storage/v1/object/")
    }

    private fun apiBaseUrl(): String {
        val configured = BuildConfig.API_BASE_URL.trim().ifBlank { defaultBaseUrl }
        return normalizeBase(configured)
    }

    private fun supabaseBaseUrl(): String {
        val configured = BuildConfig.SUPABASE_URL.trim().ifBlank { apiBaseUrl() }
        return normalizeBase(configured)
    }

    private fun normalizeBase(value: String): String {
        var base = value.trim()
        if (!base.contains("://")) {
            base = "https://$base"
        }
        while (base.endsWith("/")) {
            base = base.dropLast(1)
        }
        return base
    }

    private fun sanitizeAbsoluteUrl(raw: String): String? {
        val trimmed = raw.trim()
        if (trimmed.isBlank()) return null

        return normalizeParsedUrl(trimmed)?.toString()
            ?: normalizeParsedUrl(percentEncodeUrl(trimmed))?.toString()
    }

    private fun normalizeParsedUrl(raw: String): Uri? {
        return try {
            val uri = Uri.parse(raw)
            if (uri.scheme.isNullOrBlank() || uri.host.isNullOrBlank()) {
                return null
            }
            val host = uri.host?.lowercase()
            when {
                host == "localhost" || host == "127.0.0.1" || host == "::1" -> {
                    val api = Uri.parse(apiBaseUrl())
                    uri.buildUpon()
                        .scheme(api.scheme)
                        .authority(api.encodedAuthority)
                        .build()
                }
                uri.scheme.equals("http", ignoreCase = true) && host != null && shouldUpgradeHttpToHttps(host) -> {
                    val builder = uri.buildUpon().scheme("https")
                    if (uri.port == 80) {
                        builder.encodedAuthority(host)
                    }
                    builder.build()
                }
                else -> uri
            }
        } catch (_: Throwable) {
            null
        }
    }

    private fun percentEncodeUrl(raw: String): String {
        return Uri.encode(raw, urlEncodingAllowlist)
    }

    private fun shouldUpgradeHttpToHttps(host: String): Boolean {
        val lowered = host.lowercase()
        if (lowered == "localhost" || lowered == "127.0.0.1" || lowered == "::1" || lowered.endsWith(".local")) {
            return false
        }
        return !isPrivateIPv4Address(lowered)
    }

    private fun isPrivateIPv4Address(host: String): Boolean {
        val octets = host.split(".")
        if (octets.size != 4) return false
        val parsed = octets.map { it.toIntOrNull() ?: return false }
        val a = parsed[0]
        val b = parsed[1]
        val c = parsed[2]
        val d = parsed[3]
        if (a !in 0..255 || b !in 0..255 || c !in 0..255 || d !in 0..255) return false
        if (a == 10 || a == 127) return true
        if (a == 192 && b == 168) return true
        if (a == 172 && b in 16..31) return true
        if (a == 169 && b == 254) return true
        return false
    }
}

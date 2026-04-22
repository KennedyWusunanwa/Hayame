package com.hayame.app.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.hayame.app.ui.theme.BrandBlue
import com.hayame.app.ui.theme.Danger
import com.hayame.app.ui.theme.MutedText
import com.hayame.app.ui.theme.Success
import com.hayame.app.ui.theme.Warning
import java.time.LocalDate

internal enum class BookingDisplayStatus(val label: String) {
    Pending("Pending"),
    Confirmed("Confirmed"),
    Ongoing("Ongoing"),
    Completed("Completed"),
    Cancelled("Cancelled"),
    Rejected("Rejected"),
    Refunded("Refunded"),
}

internal enum class BookingDisplayRole {
    Renter,
    Host,
}

internal fun resolveBookingDisplayStatus(
    status: String?,
    startDate: String?,
    endDate: String?,
): BookingDisplayStatus {
    return when (status.orEmpty().trim().lowercase()) {
        "completed" -> BookingDisplayStatus.Completed
        "cancelled" -> BookingDisplayStatus.Cancelled
        "rejected" -> BookingDisplayStatus.Rejected
        "refunded" -> BookingDisplayStatus.Refunded
        "confirmed" -> {
            val today = LocalDate.now().toString()
            val start = normalizedBookingDate(startDate)
            val end = normalizedBookingDate(endDate)
            when {
                end != null && today >= end -> BookingDisplayStatus.Completed
                start != null && end != null && today >= start && today < end -> BookingDisplayStatus.Ongoing
                else -> BookingDisplayStatus.Confirmed
            }
        }
        else -> BookingDisplayStatus.Pending
    }
}

internal fun bookingHelperText(
    status: BookingDisplayStatus,
    role: BookingDisplayRole,
    paymentStatus: String? = null,
): String {
    return when (status) {
        BookingDisplayStatus.Pending -> when (role) {
            BookingDisplayRole.Renter -> "Waiting for host confirmation."
            BookingDisplayRole.Host -> {
                if (paymentStatus.equals("paid", ignoreCase = true)) {
                    "Review this request and decide what happens next."
                } else {
                    "Waiting for renter payment before approval."
                }
            }
        }
        BookingDisplayStatus.Confirmed -> when (role) {
            BookingDisplayRole.Renter -> "Your trip is confirmed. Get ready."
            BookingDisplayRole.Host -> "Booking confirmed. Prepare for handoff."
        }
        BookingDisplayStatus.Ongoing -> when (role) {
            BookingDisplayRole.Renter -> "Your trip is in progress."
            BookingDisplayRole.Host -> "Trip is in progress."
        }
        BookingDisplayStatus.Completed -> "Trip completed successfully."
        BookingDisplayStatus.Cancelled -> "This booking was cancelled."
        BookingDisplayStatus.Rejected -> "This booking was rejected."
        BookingDisplayStatus.Refunded -> "This booking was refunded."
    }
}

internal fun shouldShowCompletedPaidBadge(
    status: BookingDisplayStatus,
    paymentStatus: String?,
): Boolean {
    return status == BookingDisplayStatus.Completed &&
        paymentStatus.equals("paid", ignoreCase = true)
}

@Composable
internal fun BookingStatusBadge(
    status: BookingDisplayStatus,
    modifier: Modifier = Modifier,
) {
    val (background, foreground) = when (status) {
        BookingDisplayStatus.Pending -> Warning.copy(alpha = 0.14f) to Warning
        BookingDisplayStatus.Confirmed -> BrandBlue.copy(alpha = 0.14f) to BrandBlue
        BookingDisplayStatus.Ongoing -> Success.copy(alpha = 0.14f) to Success
        BookingDisplayStatus.Completed -> Color.Black.copy(alpha = 0.06f) to MutedText
        BookingDisplayStatus.Cancelled,
        BookingDisplayStatus.Rejected,
        BookingDisplayStatus.Refunded,
        -> Danger.copy(alpha = 0.14f) to Danger
    }

    Surface(
        modifier = modifier,
        color = background,
        shape = RoundedCornerShape(999.dp),
    ) {
        Text(
            text = status.label,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = foreground,
        )
    }
}

@Composable
internal fun BookingPaidBadge(modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        color = Success.copy(alpha = 0.14f),
        shape = RoundedCornerShape(999.dp),
    ) {
        Text(
            text = "Paid",
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = Success,
        )
    }
}

@Composable
internal fun BookingStatusBadgeStack(
    status: BookingDisplayStatus,
    showPaidBadge: Boolean,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier) {
        BookingStatusBadge(status = status)
        if (showPaidBadge) {
            BookingPaidBadge(modifier = Modifier.padding(top = 6.dp))
        }
    }
}

private fun normalizedBookingDate(value: String?): String? {
    val normalized = value?.trim().orEmpty()
    if (normalized.length < 10) return null
    return normalized.substring(0, 10)
}

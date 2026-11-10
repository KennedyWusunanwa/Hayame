package com.hayame.app.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.DirectionsCar
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material.icons.outlined.EventAvailable
import androidx.compose.material.icons.outlined.ReceiptLong
import androidx.compose.material.icons.outlined.WarningAmber
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hayame.app.ui.theme.LocalHayameColors
import com.hayame.app.ui.theme.ManropeFamily
import com.hayame.app.ui.viewmodel.AppViewModel

/** White text stays readable on this red in light and dark, which the theme's own red does not. */
private val DeleteButtonRed = Color(0xFFC93030)

/**
 * Asks Hayame to delete the signed-in account. Says in plain words what will happen, takes an
 * explicit confirmation, then shows the server's answer. Nothing is signed out until the
 * user has read that answer and taps Done ([onFinished]).
 */
@Composable
fun DeleteAccountScreen(
    viewModel: AppViewModel,
    onBack: () -> Unit,
    onFinished: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val state by viewModel.accountDeletion.collectAsState()
    val received = state.receivedMessage

    // Once the request is in, every way out of this screen is "Done". While it is on its way, stay.
    val leave: () -> Unit = when {
        received != null -> onFinished
        state.inProgress -> ({})
        else -> onBack
    }
    BackHandler(enabled = received != null || state.inProgress, onBack = leave)
    // A failed attempt is not kept for the next visit.
    DisposableEffect(Unit) { onDispose { viewModel.dismissAccountDeletionError() } }

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = { ScreenTopBar(title = "Delete account", onBack = leave) },
    ) { inner ->
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxSize()
                // Runs on under the gesture bar, like the other long pages.
                .padding(top = inner.calculateTopPadding()),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    // At least as tall as the screen, so the answer can sit in the middle of it.
                    .heightIn(min = maxHeight)
                    .padding(start = 20.dp, end = 20.dp, top = 8.dp, bottom = inner.calculateBottomPadding() + 24.dp),
            ) {
                if (received != null) {
                    DeleteAccountReceived(message = received, onDone = onFinished)
                } else {
                    DeleteAccountConfirm(
                        inProgress = state.inProgress,
                        error = state.error,
                        onConfirm = viewModel::requestAccountDeletion,
                        onCancel = onBack,
                    )
                }
            }
        }
    }
}

@Composable
private fun DeleteAccountConfirm(
    inProgress: Boolean,
    error: String?,
    onConfirm: () -> Unit,
    onCancel: () -> Unit,
) {
    val colors = LocalHayameColors.current
    DeleteAccountBadge(icon = Icons.Outlined.DeleteOutline, tint = colors.danger)
    Spacer(modifier = Modifier.height(14.dp))
    Text(
        "Delete your Hayame account?",
        style = DeleteTitleStyle,
        color = colors.brandNavy,
        modifier = Modifier.semantics { heading() },
    )
    Spacer(modifier = Modifier.height(8.dp))
    Text(
        "Please read this before you decide. Here is what happens when you ask us to delete your account.",
        style = DeleteBodyStyle,
        color = colors.brandNavy.copy(alpha = 0.78f),
    )
    Spacer(modifier = Modifier.height(16.dp))

    Surface(
        shape = RoundedCornerShape(20.dp),
        color = colors.cardBackground,
        border = BorderStroke(1.dp, colors.border),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column {
            DeleteAccountPoint(
                icon = Icons.Outlined.EventAvailable,
                tint = colors.brandBlue,
                title = "Deleted within 30 days",
                body = "Your account and your personal information are deleted within 30 days of your request.",
            )
            DeleteAccountDivider()
            DeleteAccountPoint(
                icon = Icons.Outlined.ReceiptLong,
                tint = colors.brandBlue,
                title = "Payment records are kept",
                body = "Records of past payments are kept for as long as the law requires.",
            )
            DeleteAccountDivider()
            DeleteAccountPoint(
                icon = Icons.Outlined.DirectionsCar,
                tint = colors.warning,
                title = "Open trips are settled first",
                body = "If you have a trip in progress or money owing, your account is closed after that is settled.",
            )
            DeleteAccountDivider()
            DeleteAccountPoint(
                icon = Icons.Outlined.WarningAmber,
                tint = colors.danger,
                title = "This cannot be undone",
                body = "Once your account is deleted, we cannot bring it back.",
            )
        }
    }

    if (error != null) {
        Spacer(modifier = Modifier.height(16.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(colors.danger.copy(alpha = 0.1f), RoundedCornerShape(14.dp))
                .padding(horizontal = 14.dp, vertical = 12.dp)
                .semantics { liveRegion = LiveRegionMode.Polite },
            verticalAlignment = Alignment.Top,
        ) {
            Icon(Icons.Outlined.ErrorOutline, contentDescription = null, tint = colors.danger, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(error, style = DeleteBodyStyle.copy(fontSize = 14.sp, lineHeight = 21.sp, fontWeight = FontWeight.SemiBold), color = colors.brandNavy)
                Text(
                    "Nothing has changed. You are still signed in and can try again.",
                    style = DeleteNoteStyle,
                    color = colors.brandNavy.copy(alpha = 0.72f),
                    modifier = Modifier.padding(top = 2.dp),
                )
            }
        }
    }

    Spacer(modifier = Modifier.height(20.dp))
    Button(
        onClick = onConfirm,
        enabled = !inProgress,
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 52.dp),
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = DeleteButtonRed,
            contentColor = Color.White,
            disabledContainerColor = DeleteButtonRed.copy(alpha = 0.6f),
            disabledContentColor = Color.White,
        ),
        elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp, pressedElevation = 0.dp),
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
    ) {
        if (inProgress) {
            CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
            Spacer(modifier = Modifier.width(10.dp))
        }
        Text(
            if (inProgress) "Sending your request..." else "Delete my account",
            style = DeleteButtonStyle,
            color = Color.White,
        )
    }
    Spacer(modifier = Modifier.height(10.dp))
    OutlinedButton(
        onClick = onCancel,
        enabled = !inProgress,
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 52.dp),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, colors.brandNavy.copy(alpha = if (inProgress) 0.12f else 0.24f)),
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = colors.brandNavy,
            disabledContentColor = colors.brandNavy.copy(alpha = 0.4f),
        ),
    ) {
        Text("Cancel", style = DeleteButtonStyle)
    }
    Spacer(modifier = Modifier.height(14.dp))
    Text(
        "Only want a break? You can sign out instead and keep your account.",
        style = DeleteNoteStyle,
        color = colors.mutedText,
        modifier = Modifier.fillMaxWidth(),
    )
}

/** The server's answer in the middle of the screen, Done at the foot of it. */
@Composable
private fun ColumnScope.DeleteAccountReceived(message: String, onDone: () -> Unit) {
    val colors = LocalHayameColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .weight(1f)
            .padding(vertical = 24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        DeleteAccountBadge(icon = Icons.Outlined.CheckCircle, tint = colors.success, size = 76.dp)
        Spacer(modifier = Modifier.height(22.dp))
        Text(
            "Request received",
            style = DeleteTitleStyle,
            color = colors.brandNavy,
            textAlign = TextAlign.Center,
            modifier = Modifier.semantics {
                heading()
                liveRegion = LiveRegionMode.Polite
            },
        )
        Spacer(modifier = Modifier.height(10.dp))
        Text(
            message,
            style = DeleteBodyStyle,
            color = colors.brandNavy.copy(alpha = 0.84f),
            textAlign = TextAlign.Center,
        )
    }
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = colors.brandLight,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Text(
            "When you tap Done you will be signed out of Hayame on this phone.",
            style = DeleteBodyStyle.copy(fontSize = 14.sp, lineHeight = 22.sp),
            color = colors.brandNavy.copy(alpha = 0.84f),
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(16.dp),
        )
    }
    Spacer(modifier = Modifier.height(14.dp))
    SolidPillButton(text = "Done", modifier = Modifier.fillMaxWidth(), onClick = onDone)
}

@Composable
private fun DeleteAccountBadge(icon: ImageVector, tint: Color, size: Dp = 48.dp) {
    Box(
        modifier = Modifier
            .size(size)
            .background(tint.copy(alpha = 0.13f), CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(size / 2))
    }
}

@Composable
private fun DeleteAccountPoint(icon: ImageVector, tint: Color, title: String, body: String) {
    val colors = LocalHayameColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp)
            .semantics(mergeDescendants = true) {},
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        RowIconChip(icon = icon, tint = tint)
        Column(modifier = Modifier.weight(1f)) {
            Text(
                title,
                style = TextStyle(fontFamily = ManropeFamily, fontSize = 15.sp, lineHeight = 22.sp, fontWeight = FontWeight.Bold),
                color = colors.brandNavy,
            )
            Text(
                body,
                style = DeleteBodyStyle.copy(fontSize = 14.sp, lineHeight = 22.sp),
                color = colors.brandNavy.copy(alpha = 0.74f),
                modifier = Modifier.padding(top = 2.dp),
            )
        }
    }
}

@Composable
private fun DeleteAccountDivider() {
    HorizontalDivider(modifier = Modifier.padding(start = 62.dp), color = LocalHayameColors.current.border)
}

private val DeleteTitleStyle = TextStyle(
    fontFamily = ManropeFamily,
    fontSize = 26.sp,
    lineHeight = 32.sp,
    fontWeight = FontWeight.ExtraBold,
    letterSpacing = (-0.3).sp,
)

private val DeleteBodyStyle = TextStyle(
    fontFamily = ManropeFamily,
    fontSize = 15.sp,
    lineHeight = 24.sp,
    fontWeight = FontWeight.Medium,
)

private val DeleteNoteStyle = TextStyle(
    fontFamily = ManropeFamily,
    fontSize = 13.sp,
    lineHeight = 19.sp,
    fontWeight = FontWeight.Medium,
)

private val DeleteButtonStyle = TextStyle(
    fontFamily = ManropeFamily,
    fontSize = 15.sp,
    fontWeight = FontWeight.Bold,
)

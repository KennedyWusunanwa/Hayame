package com.hayame.app.ui.screens

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import android.net.Uri
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Badge
import androidx.compose.material.icons.outlined.Bookmark
import androidx.compose.material.icons.outlined.CameraAlt
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material.icons.outlined.Face
import androidx.compose.material.icons.outlined.HourglassTop
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.PhotoLibrary
import androidx.compose.material.icons.outlined.VerifiedUser
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import coil.compose.AsyncImage
import com.hayame.app.ui.components.ErrorBlock
import com.hayame.app.ui.components.HayameRefreshBox
import com.hayame.app.ui.components.LoadingBlock
import com.hayame.app.ui.navigation.NavRoutes
import com.hayame.app.ui.theme.LocalHayameColors
import com.hayame.app.ui.viewmodel.AppViewModel
import com.hayame.app.ui.viewmodel.RenterVerificationStatus
import com.hayame.app.ui.viewmodel.RenterVerificationUiState
import java.io.File
import kotlin.math.max
import kotlin.math.min
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

// MARK: Renter identity verification ---------------------------------------------------------------
//
// Before anyone can book, Hayame checks a photo of their face and both sides of their driving
// licence. The server enforces it; this screen makes it a guided step instead of an error. It is
// opened from More, a prompt on Home, the checkout (Review to Pay), a refused hold and a
// "not approved" push. Photos are scaled down on the phone, uploaded to the private ID bucket and
// then sent for review; the view model owns the upload so it survives rotation.

/** The three photos a renter sends. [key] names the temp file; the view model maps the upload name. */
private enum class VerificationPhotoSlot(
    val key: String,
    val title: String,
    val guidance: String,
    val icon: ImageVector,
) {
    FACE(
        key = "face",
        title = "Photo of your face",
        guidance = "Face the camera in good light, with your whole face clearly visible. No sunglasses or hats.",
        icon = Icons.Outlined.Face,
    ),
    LICENCE_FRONT(
        key = "licence-front",
        title = "Driving licence, front",
        guidance = "Lay it flat with all four corners in the photo. The text must be easy to read.",
        icon = Icons.Outlined.Badge,
    ),
    LICENCE_BACK(
        key = "licence-back",
        title = "Driving licence, back",
        guidance = "Turn it over and keep it flat, with all four corners in the photo and no glare.",
        icon = Icons.Outlined.CreditCard,
    ),
    ;

    companion object {
        fun fromName(name: String?): VerificationPhotoSlot? = entries.firstOrNull { it.name == name }
    }
}

private const val VerificationPhotoDir = "renter-verification"
private const val VerificationPhotoMaxSide = 2000
private const val VerificationPhotoQuality = 80

/**
 * Opens the phone's camera app to save a full-size photo. For the selfie it also asks for the
 * front camera; camera apps that do not know these hints simply ignore them.
 */
private class CaptureVerificationPhoto(private val preferFrontCamera: Boolean) : ActivityResultContracts.TakePicture() {
    override fun createIntent(context: Context, input: Uri): Intent {
        return super.createIntent(context, input).apply {
            if (preferFrontCamera) {
                putExtra("android.intent.extras.CAMERA_FACING", 1)
                putExtra("android.intent.extras.LENS_FACING_FRONT", 1)
                putExtra("android.intent.extra.USE_FRONT_CAMERA", true)
            }
        }
    }
}

@Composable
fun RenterVerificationScreen(
    viewModel: AppViewModel,
    onBack: () -> Unit,
    onContinueBooking: (ResumableCheckoutUi) -> Unit,
) {
    val colors = LocalHayameColors.current
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val state by viewModel.renterVerification.collectAsState()
    val submit by viewModel.renterVerificationSubmit.collectAsState()
    val resumable = rememberResumableCheckout(viewModel)

    LaunchedEffect(isAuthenticated) {
        if (isAuthenticated) viewModel.refreshRenterVerification(force = true)
    }

    // Paths of the prepared photos (in the app's cache) and of a capture in progress. Saved so
    // rotation, or Android closing the app while the camera is open, does not lose them.
    var facePath by rememberSaveable { mutableStateOf<String?>(null) }
    var licenceFrontPath by rememberSaveable { mutableStateOf<String?>(null) }
    var licenceBackPath by rememberSaveable { mutableStateOf<String?>(null) }
    var pendingSlotName by rememberSaveable { mutableStateOf<String?>(null) }
    var pendingCapturePath by rememberSaveable { mutableStateOf<String?>(null) }
    var photoError by rememberSaveable { mutableStateOf<String?>(null) }
    var processingSlotName by remember { mutableStateOf<String?>(null) }

    fun pathFor(slot: VerificationPhotoSlot): String? = when (slot) {
        VerificationPhotoSlot.FACE -> facePath
        VerificationPhotoSlot.LICENCE_FRONT -> licenceFrontPath
        VerificationPhotoSlot.LICENCE_BACK -> licenceBackPath
    }

    fun setPath(slot: VerificationPhotoSlot, path: String?) {
        when (slot) {
            VerificationPhotoSlot.FACE -> facePath = path
            VerificationPhotoSlot.LICENCE_FRONT -> licenceFrontPath = path
            VerificationPhotoSlot.LICENCE_BACK -> licenceBackPath = path
        }
    }

    /** Scales and rotates the chosen photo off the main thread, then shows it in its card. */
    fun adoptPhoto(slot: VerificationPhotoSlot, source: Uri, rawCapture: File?) {
        processingSlotName = slot.name
        photoError = null
        val appContext = context.applicationContext
        scope.launch {
            val prepared = withContext(Dispatchers.IO) {
                val file = runCatching { prepareVerificationPhoto(appContext, source, slot) }
                    .onFailure { Log.w("RenterVerification", "Could not prepare ${slot.key} photo", it) }
                    .getOrNull()
                runCatching { rawCapture?.delete() }
                file
            }
            if (processingSlotName == slot.name) processingSlotName = null
            if (prepared == null) {
                photoError = "We couldn't read that photo. Please try another one."
            } else {
                val previous = pathFor(slot)
                setPath(slot, prepared.absolutePath)
                if (previous != null && previous != prepared.absolutePath) runCatching { File(previous).delete() }
                viewModel.dismissRenterVerificationError()
            }
        }
    }

    val galleryLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        val slot = VerificationPhotoSlot.fromName(pendingSlotName)
        pendingSlotName = null
        if (uri != null && slot != null) adoptPhoto(slot, uri, rawCapture = null)
    }

    val onCaptureFinished: (Boolean) -> Unit = { _ ->
        val slot = VerificationPhotoSlot.fromName(pendingSlotName)
        val raw = pendingCapturePath?.let(::File)
        pendingSlotName = null
        pendingCapturePath = null
        // Trust the file rather than the result flag: some camera apps report it wrongly.
        if (slot != null && raw != null && raw.exists() && raw.length() > 0L) {
            adoptPhoto(slot, Uri.fromFile(raw), rawCapture = raw)
        } else {
            runCatching { raw?.delete() }
        }
    }
    val selfieLauncher = rememberLauncherForActivityResult(
        remember { CaptureVerificationPhoto(preferFrontCamera = true) },
        onCaptureFinished,
    )
    val cameraLauncher = rememberLauncherForActivityResult(
        remember { CaptureVerificationPhoto(preferFrontCamera = false) },
        onCaptureFinished,
    )

    fun openGallery(slot: VerificationPhotoSlot) {
        pendingSlotName = slot.name
        val launched = runCatching { galleryLauncher.launch("image/*") }.isSuccess
        if (!launched) {
            pendingSlotName = null
            photoError = "We couldn't open your photos on this phone."
        }
    }

    fun openCamera(slot: VerificationPhotoSlot) {
        // The app does not hold the camera permission, so the phone's own camera app takes the
        // photo into a private file shared through the FileProvider. No camera app (or one that
        // refuses) falls back to choosing an existing photo.
        val launched = runCatching {
            val dir = File(context.cacheDir, VerificationPhotoDir).apply { mkdirs() }
            val raw = File(dir, "capture-${slot.key}-${System.currentTimeMillis()}.jpg")
            val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", raw)
            pendingSlotName = slot.name
            pendingCapturePath = raw.absolutePath
            (if (slot == VerificationPhotoSlot.FACE) selfieLauncher else cameraLauncher).launch(uri)
        }.isSuccess
        if (!launched) {
            pendingCapturePath = null
            viewModel.showMessage("No camera app was found. Choose a photo from your gallery instead.")
            openGallery(slot)
        }
    }

    // Once the photos are with the team the local copies are gone; forget their paths.
    LaunchedEffect(state.status) {
        if (state.status == RenterVerificationStatus.PENDING || state.status == RenterVerificationStatus.APPROVED) {
            facePath = null
            licenceFrontPath = null
            licenceBackPath = null
            photoError = null
        }
    }

    val faceFile = remember(facePath, state.status, submit.inProgress) { existingPhotoFile(facePath) }
    val licenceFrontFile = remember(licenceFrontPath, state.status, submit.inProgress) { existingPhotoFile(licenceFrontPath) }
    val licenceBackFile = remember(licenceBackPath, state.status, submit.inProgress) { existingPhotoFile(licenceBackPath) }

    fun fileFor(slot: VerificationPhotoSlot): File? = when (slot) {
        VerificationPhotoSlot.FACE -> faceFile
        VerificationPhotoSlot.LICENCE_FRONT -> licenceFrontFile
        VerificationPhotoSlot.LICENCE_BACK -> licenceBackFile
    }

    val showsStatusPanel = !isAuthenticated ||
        state.status == RenterVerificationStatus.PENDING ||
        state.status == RenterVerificationStatus.APPROVED

    Scaffold(
        containerColor = colors.pageBackground,
        topBar = { ScreenTopBar(title = "Verify identity", onBack = onBack) },
    ) { inner ->
        HayameRefreshBox(
            onRefresh = { viewModel.refreshRenterVerification(force = true) },
            modifier = Modifier.fillMaxSize(),
            indicatorTopPadding = inner.calculateTopPadding(),
            isBusy = { state.isLoading },
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(inner)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp)
                    .padding(top = 8.dp, bottom = if (showsStatusPanel) 88.dp else 28.dp),
                // A single status card sits in the middle of the screen; the photo form starts at the top.
                verticalArrangement = Arrangement.spacedBy(
                    14.dp,
                    if (showsStatusPanel) Alignment.CenterVertically else Alignment.Top,
                ),
            ) {
                when {
                    !isAuthenticated -> VerificationStatusPanel(
                        icon = Icons.Outlined.VerifiedUser,
                        tint = colors.brandBlue,
                        title = "Sign in to verify your identity",
                        body = "Hayame checks every driver's licence to keep hosts' cars safe. Sign in to send your photos.",
                        note = null,
                        buttonText = "Sign in or sign up",
                        onButton = {
                            viewModel.requireAuthentication(
                                message = "Sign in or sign up to verify your identity.",
                                destination = NavRoutes.RenterVerification,
                            )
                        },
                    )

                    state.status == RenterVerificationStatus.UNKNOWN -> {
                        if (state.isLoading) {
                            LoadingBlock(label = "Checking your verification...")
                        } else {
                            ErrorBlock(
                                message = "We couldn't check your verification. Check your connection and try again.",
                                onRetry = { viewModel.refreshRenterVerification(force = true) },
                            )
                        }
                    }

                    state.status == RenterVerificationStatus.PENDING -> VerificationStatusPanel(
                        icon = Icons.Outlined.HourglassTop,
                        tint = colors.warning,
                        title = "Under review",
                        body = "Thanks, we have your photos. The Hayame team checks them by hand, usually within a few hours. " +
                            "We'll send you a notification as soon as it's done.",
                        note = if (resumable != null) {
                            "Your booking selections are saved. Once you're approved, finish the booking from Home or Trips."
                        } else {
                            null
                        },
                        buttonText = "Done",
                        onButton = onBack,
                    )

                    state.status == RenterVerificationStatus.APPROVED -> VerificationStatusPanel(
                        icon = Icons.Outlined.VerifiedUser,
                        tint = colors.success,
                        title = "You're verified",
                        body = "Your identity check is approved. You can book any car on Hayame.",
                        note = if (resumable != null) "Your booking selections are still saved and ready to finish." else null,
                        buttonText = if (resumable != null) "Continue booking" else "Done",
                        onButton = { if (resumable != null) onContinueBooking(resumable) else onBack() },
                    )

                    else -> {
                        val allChosen = faceFile != null && licenceFrontFile != null && licenceBackFile != null
                        val busy = submit.inProgress

                        VerificationIntroCard()

                        if (state.status == RenterVerificationStatus.REJECTED) {
                            VerificationNotice(
                                icon = Icons.Outlined.ErrorOutline,
                                tint = colors.danger,
                                title = "Your photos were not approved",
                                body = state.rejectionReason
                                    ?: "Please send new, clear photos and we'll take another look.",
                            )
                        }

                        if (resumable != null) {
                            VerificationNotice(
                                icon = Icons.Outlined.Bookmark,
                                tint = colors.brandBlue,
                                title = "Your booking is saved",
                                body = "Send your photos now. Once you're approved, finish the booking from Home or Trips.",
                            )
                        }

                        VerificationPhotoSlot.entries.forEach { slot ->
                            VerificationPhotoCard(
                                slot = slot,
                                file = fileFor(slot),
                                isProcessing = processingSlotName == slot.name,
                                enabled = !busy && processingSlotName == null,
                                onTakePhoto = { openCamera(slot) },
                                onChooseFromGallery = { openGallery(slot) },
                            )
                        }

                        val errorText = submit.error ?: photoError
                        if (errorText != null) {
                            VerificationNotice(
                                icon = Icons.Outlined.ErrorOutline,
                                tint = colors.danger,
                                title = if (submit.error != null) "That didn't go through" else "Photo problem",
                                body = errorText,
                            )
                        }

                        Button(
                            onClick = {
                                val face = faceFile
                                val front = licenceFrontFile
                                val back = licenceBackFile
                                if (face != null && front != null && back != null) {
                                    viewModel.submitRenterVerification(face = face, licenceFront = front, licenceBack = back)
                                }
                            },
                            enabled = allChosen && !busy && processingSlotName == null,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = colors.brandBlue,
                                contentColor = Color.White,
                                disabledContainerColor = colors.brandBlue.copy(alpha = if (busy) 0.75f else 0.35f),
                                disabledContentColor = Color.White,
                            ),
                            elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp, pressedElevation = 0.dp),
                        ) {
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                if (busy) {
                                    CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp, color = Color.White)
                                }
                                Text(
                                    text = when {
                                        !busy && submit.error != null -> "Try again"
                                        !busy -> "Submit for review"
                                        submit.step in 1..3 -> "Uploading photo ${submit.step} of 3"
                                        else -> "Sending for review"
                                    },
                                    style = MaterialTheme.typography.bodyLarge,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color.White,
                                )
                            }
                        }

                        Text(
                            text = when {
                                busy -> "Keep the app open while your photos upload."
                                !allChosen -> "Add all three photos to submit."
                                else -> "We usually review within a few hours."
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.mutedText,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                }
            }
        }
    }
}

private fun existingPhotoFile(path: String?): File? {
    return path?.let(::File)?.takeIf { it.exists() && it.length() > 0L }
}

// MARK: Building blocks ----------------------------------------------------------------------------

@Composable
private fun VerificationIntroCard() {
    val colors = LocalHayameColors.current
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = colors.cardBackground,
        border = BorderStroke(1.dp, colors.border),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                VerificationIconChip(icon = Icons.Outlined.VerifiedUser, tint = colors.brandBlue)
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        "Three quick photos",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = colors.brandNavy,
                    )
                    Text(
                        "Hayame checks every driver's licence to keep hosts' cars safe.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = colors.mutedText,
                    )
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.Lock, contentDescription = null, tint = colors.success, modifier = Modifier.size(16.dp))
                Text(
                    "Your photos are only seen by the Hayame team.",
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.brandNavy,
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}

@Composable
private fun VerificationIconChip(icon: ImageVector, tint: Color) {
    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .size(44.dp)
            .background(tint.copy(alpha = 0.14f), RoundedCornerShape(14.dp)),
    ) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(22.dp))
    }
}

/** Tinted inline message: a rejection reason, the saved-booking reminder or an error. */
@Composable
private fun VerificationNotice(icon: ImageVector, tint: Color, title: String, body: String) {
    val colors = LocalHayameColors.current
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = tint.copy(alpha = 0.10f),
        border = BorderStroke(1.dp, tint.copy(alpha = 0.30f)),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(20.dp))
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(title, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = colors.brandNavy)
                Text(body, style = MaterialTheme.typography.bodyMedium, color = colors.brandNavy)
            }
        }
    }
}

@Composable
private fun VerificationPhotoCard(
    slot: VerificationPhotoSlot,
    file: File?,
    isProcessing: Boolean,
    enabled: Boolean,
    onTakePhoto: () -> Unit,
    onChooseFromGallery: () -> Unit,
) {
    val colors = LocalHayameColors.current
    val chosen = file != null
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = colors.cardBackground,
        border = BorderStroke(1.dp, if (chosen) colors.success.copy(alpha = 0.45f) else colors.border),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(width = 84.dp, height = 64.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(colors.fieldBackground),
                ) {
                    when {
                        isProcessing -> CircularProgressIndicator(
                            modifier = Modifier.size(22.dp),
                            strokeWidth = 2.dp,
                            color = colors.brandBlue,
                        )
                        file != null -> AsyncImage(
                            model = file,
                            contentDescription = "${slot.title}, chosen photo",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize(),
                        )
                        else -> Icon(slot.icon, contentDescription = null, tint = colors.brandBlue, modifier = Modifier.size(26.dp))
                    }
                }
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            slot.title,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = colors.brandNavy,
                            modifier = Modifier.weight(1f, fill = false),
                        )
                        if (chosen && !isProcessing) {
                            Icon(
                                Icons.Outlined.CheckCircle,
                                contentDescription = "Added",
                                tint = colors.success,
                                modifier = Modifier.size(18.dp),
                            )
                        }
                    }
                    Text(slot.guidance, style = MaterialTheme.typography.bodySmall, color = colors.mutedText)
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(
                    onClick = onTakePhoto,
                    enabled = enabled,
                    modifier = Modifier
                        .weight(1f)
                        .height(46.dp),
                    shape = RoundedCornerShape(14.dp),
                    contentPadding = PaddingValues(horizontal = 10.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colors.brandBlue,
                        contentColor = Color.White,
                        disabledContainerColor = colors.brandBlue.copy(alpha = 0.35f),
                        disabledContentColor = Color.White,
                    ),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp, pressedElevation = 0.dp),
                ) {
                    Icon(Icons.Outlined.CameraAlt, contentDescription = null, modifier = Modifier.size(18.dp))
                    Text(
                        if (chosen) "Retake" else "Take photo",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.padding(start = 8.dp),
                    )
                }
                OutlinedButton(
                    onClick = onChooseFromGallery,
                    enabled = enabled,
                    modifier = Modifier
                        .weight(1f)
                        .height(46.dp),
                    shape = RoundedCornerShape(14.dp),
                    contentPadding = PaddingValues(horizontal = 10.dp),
                    border = BorderStroke(1.dp, colors.controlStroke),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = colors.fieldBackground,
                        contentColor = colors.brandNavy,
                        disabledContentColor = colors.mutedText,
                    ),
                ) {
                    Icon(Icons.Outlined.PhotoLibrary, contentDescription = null, modifier = Modifier.size(18.dp))
                    Text(
                        if (chosen) "Choose another" else "From gallery",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.padding(start = 8.dp),
                    )
                }
            }
        }
    }
}

/** Full-card state: under review, verified, or the sign-in prompt. */
@Composable
private fun VerificationStatusPanel(
    icon: ImageVector,
    tint: Color,
    title: String,
    body: String,
    note: String?,
    buttonText: String,
    onButton: () -> Unit,
) {
    val colors = LocalHayameColors.current
    Surface(
        shape = RoundedCornerShape(24.dp),
        color = colors.cardBackground,
        border = BorderStroke(1.dp, colors.border),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 28.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(72.dp)
                    .background(tint.copy(alpha = 0.14f), CircleShape),
            ) {
                Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(34.dp))
            }
            Text(
                title,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = colors.brandNavy,
                textAlign = TextAlign.Center,
            )
            Text(
                body,
                style = MaterialTheme.typography.bodyMedium,
                color = colors.mutedText,
                textAlign = TextAlign.Center,
            )
            if (note != null) {
                VerificationNotice(
                    icon = Icons.Outlined.Bookmark,
                    tint = colors.brandBlue,
                    title = "Your booking is saved",
                    body = note,
                )
            }
            SolidPillButton(text = buttonText, modifier = Modifier.fillMaxWidth(), onClick = onButton)
        }
    }
}

// MARK: Entry points -------------------------------------------------------------------------------

/** Compact Home prompt for signed-in renters who still need to send (or resend) their photos. */
@Composable
fun RenterVerificationPromptCard(status: RenterVerificationStatus, onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    val rejected = status == RenterVerificationStatus.REJECTED
    val tint = if (rejected) colors.danger else colors.brandBlue
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = colors.cardBackground,
        border = BorderStroke(1.dp, tint.copy(alpha = 0.35f)),
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .clickable(onClick = onClick),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(36.dp)
                    .background(tint.copy(alpha = 0.14f), RoundedCornerShape(12.dp)),
            ) {
                Icon(
                    if (rejected) Icons.Outlined.ErrorOutline else Icons.Outlined.VerifiedUser,
                    contentDescription = null,
                    tint = tint,
                    modifier = Modifier.size(18.dp),
                )
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    if (rejected) "Your verification needs new photos" else "Verify your identity to book",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = colors.brandNavy,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    if (rejected) "Send clear photos again so you can book." else "A selfie and your driving licence. It takes two minutes.",
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.mutedText,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Icon(
                Icons.Outlined.ChevronRight,
                contentDescription = null,
                tint = colors.mutedText.copy(alpha = 0.7f),
                modifier = Modifier.size(20.dp),
            )
        }
    }
}

/** "Verify identity" row for the More tab, showing where the renter stands. */
@Composable
internal fun RenterVerificationRow(state: RenterVerificationUiState, onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    when (state.status) {
        RenterVerificationStatus.APPROVED -> NavRow(
            icon = Icons.Outlined.VerifiedUser,
            tint = colors.success,
            title = "Verify identity",
            subtitle = "Verified. You can book any car.",
            onClick = onClick,
        )
        RenterVerificationStatus.PENDING -> NavRow(
            icon = Icons.Outlined.HourglassTop,
            tint = colors.warning,
            title = "Verify identity",
            subtitle = "Under review, usually within a few hours",
            onClick = onClick,
        )
        RenterVerificationStatus.REJECTED -> NavRow(
            icon = Icons.Outlined.ErrorOutline,
            tint = colors.danger,
            title = "Verify identity",
            subtitle = "Not approved. Send new photos to book.",
            onClick = onClick,
        )
        RenterVerificationStatus.UNVERIFIED -> NavRow(
            icon = Icons.Outlined.Badge,
            tint = colors.brandBlue,
            title = "Verify identity",
            subtitle = if (state.required) "Not verified yet. Needed before you book." else "Not verified yet",
            onClick = onClick,
        )
        RenterVerificationStatus.UNKNOWN -> NavRow(
            icon = Icons.Outlined.Badge,
            tint = colors.brandBlue,
            title = "Verify identity",
            subtitle = "A selfie and your driving licence",
            onClick = onClick,
        )
    }
}

// MARK: Photo preparation --------------------------------------------------------------------------

/**
 * Turns the chosen photo into the JPEG that gets uploaded: longest side at most
 * [VerificationPhotoMaxSide] px, quality [VerificationPhotoQuality], turned upright using the
 * photo's EXIF orientation (camera apps often store portrait shots sideways). Throws when the
 * source cannot be read or decoded. Call off the main thread.
 */
private fun prepareVerificationPhoto(context: Context, source: Uri, slot: VerificationPhotoSlot): File {
    val resolver = context.contentResolver

    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    // A bounds-only decode returns no bitmap by design; only the stream can be missing here.
    val input = resolver.openInputStream(source) ?: error("Unable to open photo")
    input.use { BitmapFactory.decodeStream(it, null, bounds) }
    val longestSide = max(bounds.outWidth, bounds.outHeight)
    if (longestSide <= 0) error("Not an image")

    // Decode at a reduced size first so a 50 MP photo never has to fit in memory whole.
    var sampleSize = 1
    while (longestSide / (sampleSize * 2) >= VerificationPhotoMaxSide) sampleSize *= 2
    val decoded = resolver.openInputStream(source)?.use {
        BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sampleSize })
    } ?: error("Unable to decode photo")

    val orientation = runCatching {
        resolver.openInputStream(source)?.use {
            ExifInterface(it).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
        }
    }.getOrNull() ?: ExifInterface.ORIENTATION_NORMAL

    val matrix = Matrix()
    when (orientation) {
        ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.postScale(-1f, 1f)
        ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
        ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.postScale(1f, -1f)
        ExifInterface.ORIENTATION_TRANSPOSE -> {
            matrix.postRotate(90f)
            matrix.postScale(-1f, 1f)
        }
        ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
        ExifInterface.ORIENTATION_TRANSVERSE -> {
            matrix.postRotate(270f)
            matrix.postScale(-1f, 1f)
        }
        ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
    }
    val scale = min(1f, VerificationPhotoMaxSide.toFloat() / max(decoded.width, decoded.height).toFloat())
    if (scale < 1f) matrix.postScale(scale, scale)

    val upright = if (matrix.isIdentity) {
        decoded
    } else {
        Bitmap.createBitmap(decoded, 0, 0, decoded.width, decoded.height, matrix, true)
    }
    try {
        val dir = File(context.cacheDir, VerificationPhotoDir).apply { mkdirs() }
        val target = File(dir, "${slot.key}-${System.currentTimeMillis()}.jpg")
        val written = target.outputStream().use { upright.compress(Bitmap.CompressFormat.JPEG, VerificationPhotoQuality, it) }
        if (!written || target.length() <= 0L) {
            target.delete()
            error("Unable to save photo")
        }
        return target
    } finally {
        if (upright !== decoded) upright.recycle()
        decoded.recycle()
    }
}

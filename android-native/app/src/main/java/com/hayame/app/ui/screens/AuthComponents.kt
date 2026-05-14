package com.hayame.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hayame.app.R
import com.hayame.app.ui.theme.LocalHayameColors

enum class AuthTab(val label: String) {
    LOGIN("Log in"), SIGNUP("Sign up")
}

@Composable
fun AuthScaffold(
    title: String,
    subtitle: String,
    selectedTab: AuthTab,
    onTabChange: (AuthTab) -> Unit,
    content: @Composable ColumnScope.() -> Unit,
    onContinueAsGuest: (() -> Unit)? = null,
) {
    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current
    val colors = LocalHayameColors.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.pageBackground)
            .pointerInput(Unit) {
                detectTapGestures {
                    focusManager.clearFocus()
                    keyboardController?.hide()
                }
            }
            .verticalScroll(rememberScrollState()),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(colors.brandBlue)
                .statusBarsPadding()
                .padding(bottom = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Spacer(modifier = Modifier.height(28.dp))
            androidx.compose.foundation.Image(
                painter = painterResource(id = R.drawable.hayame_logo_white),
                contentDescription = "Hayame",
                modifier = Modifier.width(118.dp),
                contentScale = ContentScale.Fit,
            )
            Row(
                modifier = Modifier
                    .padding(horizontal = 24.dp)
                    .fillMaxWidth()
                    .background(Color.White.copy(alpha = 0.18f), RoundedCornerShape(99.dp))
                    .padding(3.dp),
            ) {
                AuthTab.entries.forEach { tab ->
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(99.dp))
                            .background(if (selectedTab == tab) colors.cardBackground else Color.Transparent)
                            .clickable { onTabChange(tab) }
                            .padding(vertical = 9.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = tab.label,
                            style = MaterialTheme.typography.labelLarge.copy(fontSize = 14.sp),
                            fontWeight = FontWeight.SemiBold,
                            color = if (selectedTab == tab) colors.brandNavy else Color.White.copy(alpha = 0.70f),
                        )
                    }
                }
            }
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(colors.cardBackground)
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    title,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = colors.brandNavy,
                )
                Text(
                    subtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    color = colors.mutedText,
                )
            }
            content()
        }

        if (onContinueAsGuest != null) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(colors.pageBackground)
                    .padding(horizontal = 24.dp, vertical = 20.dp),
            ) {
                OutlinedButton(
                    onClick = onContinueAsGuest,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(99.dp),
                    border = BorderStroke(1.5.dp, colors.border),
                    colors = ButtonDefaults.outlinedButtonColors(containerColor = colors.cardBackground),
                ) {
                    Text(
                        "Continue as guest",
                        color = colors.brandNavy,
                        fontWeight = FontWeight.Medium,
                        fontSize = 14.sp,
                    )
                }
            }
        }
    }
}

@Composable
fun AuthTextField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    keyboardType: KeyboardType = KeyboardType.Text,
) {
    var focused by remember { mutableStateOf(false) }
    val colors = LocalHayameColors.current
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(
            label,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold,
            color = colors.brandNavy,
        )
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier
                .fillMaxWidth()
                .onFocusChanged { focused = it.isFocused }
                .background(if (focused) colors.cardBackground else colors.pageBackground, RoundedCornerShape(12.dp))
                .border(
                    1.5.dp,
                    if (focused) colors.brandBlue else colors.border,
                    RoundedCornerShape(12.dp),
                )
                .padding(horizontal = 14.dp, vertical = 13.dp),
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            singleLine = true,
            textStyle = MaterialTheme.typography.bodyMedium.copy(color = colors.brandNavy),
            decorationBox = { inner ->
                if (value.isEmpty()) {
                    Text(label, color = colors.mutedText, style = MaterialTheme.typography.bodyMedium)
                }
                inner()
            },
        )
    }
}

@Composable
fun AuthPasswordField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    visible: Boolean,
    onToggleVisibility: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var focused by remember { mutableStateOf(false) }
    val colors = LocalHayameColors.current
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(
            label,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold,
            color = colors.brandNavy,
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .onFocusChanged { focused = it.isFocused }
                .background(if (focused) colors.cardBackground else colors.pageBackground, RoundedCornerShape(12.dp))
                .border(
                    1.5.dp,
                    if (focused) colors.brandBlue else colors.border,
                    RoundedCornerShape(12.dp),
                )
                .padding(horizontal = 14.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier.weight(1f),
                singleLine = true,
                visualTransformation = if (visible) VisualTransformation.None else PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                textStyle = MaterialTheme.typography.bodyMedium.copy(color = colors.brandNavy),
                decorationBox = { inner ->
                    if (value.isEmpty()) Text("••••••••", color = colors.mutedText)
                    inner()
                },
            )
            TextButton(onClick = onToggleVisibility, contentPadding = PaddingValues(horizontal = 4.dp)) {
                Text(
                    if (visible) "Hide" else "Show",
                    color = colors.brandBlue,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 12.sp,
                )
            }
        }
    }
}

@Composable
fun AuthSelectField(
    label: String,
    selected: String,
    options: List<String>,
    onSelected: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var expanded by remember { mutableStateOf(false) }
    val colors = LocalHayameColors.current
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(
            label,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold,
            color = colors.brandNavy,
        )
        Box {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(colors.pageBackground, RoundedCornerShape(12.dp))
                    .border(1.5.dp, colors.border, RoundedCornerShape(12.dp))
                    .clickable { expanded = true }
                    .padding(horizontal = 14.dp, vertical = 13.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    selected.ifBlank { "Select" },
                    modifier = Modifier.weight(1f),
                    color = if (selected.isBlank()) colors.mutedText else colors.brandNavy,
                    style = MaterialTheme.typography.bodyMedium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Icon(
                    Icons.Outlined.ExpandMore,
                    contentDescription = null,
                    tint = colors.mutedText,
                    modifier = Modifier.size(16.dp),
                )
            }
            DropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false },
                containerColor = colors.cardBackground,
            ) {
                options.forEach { opt ->
                    DropdownMenuItem(
                        text = { Text(opt, color = colors.brandNavy) },
                        onClick = { onSelected(opt); expanded = false },
                    )
                }
            }
        }
    }
}

@Composable
fun AuthPrimaryButton(text: String, enabled: Boolean = true, onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = Modifier.fillMaxWidth().height(50.dp),
        shape = RoundedCornerShape(99.dp),
        colors = ButtonDefaults.buttonColors(containerColor = colors.brandBlue),
    ) {
        Text(text, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
    }
}

@Composable
fun AuthBiometricButton(text: String, onClick: () -> Unit) {
    val colors = LocalHayameColors.current
    OutlinedButton(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(48.dp),
        shape = RoundedCornerShape(99.dp),
        border = BorderStroke(1.5.dp, colors.border),
        colors = ButtonDefaults.outlinedButtonColors(containerColor = colors.cardBackground),
    ) {
        Text(text, color = colors.brandNavy, fontWeight = FontWeight.Medium, fontSize = 14.sp)
    }
}

package com.hayame.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.hayame.app.AppContainer

class AppViewModelFactory(
    private val container: AppContainer,
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(AppViewModel::class.java)) {
            return AppViewModel(
                authRepository = container.authRepository,
                carsRepository = container.carsRepository,
                bookingRepository = container.bookingRepository,
                messagingRepository = container.messagingRepository,
                hostRepository = container.hostRepository,
                storageRepository = container.storageRepository,
                sessionStore = container.session,
            ) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
    }
}

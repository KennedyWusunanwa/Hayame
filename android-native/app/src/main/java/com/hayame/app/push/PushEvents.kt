package com.hayame.app.push

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

/**
 * In-process feed of push payloads. The messaging service emits every push it
 * receives; the view model listens so an open screen refreshes right away (a
 * listing approved while the host is looking at "My cars", for example)
 * instead of waiting for a restart.
 */
object PushEvents {
    private val _events = MutableSharedFlow<Map<String, String>>(extraBufferCapacity = 16)
    val events: SharedFlow<Map<String, String>> = _events.asSharedFlow()

    fun emit(data: Map<String, String>) {
        _events.tryEmit(data)
    }
}

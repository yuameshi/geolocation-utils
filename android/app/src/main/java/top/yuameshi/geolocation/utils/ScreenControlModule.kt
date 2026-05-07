package top.yuameshi.geolocation.utils

import android.app.Activity
import android.content.pm.ActivityInfo
import android.view.Surface
import android.view.WindowManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = ScreenControlModule.NAME)
class ScreenControlModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        const val NAME = "ScreenControlModule"
    }

    private var originalBrightness: Float = -1f

    override fun getName(): String = NAME

    private fun getActivity(): Activity? = reactApplicationContext.currentActivity

    @ReactMethod
    fun lockLandscape(promise: Promise) {
        val activity = getActivity()
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity")
            return
        }
        activity.runOnUiThread {
            activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun unlockOrientation(promise: Promise) {
        val activity = getActivity()
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity")
            return
        }
        activity.runOnUiThread {
            activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun setMaxBrightness(promise: Promise) {
        val activity = getActivity()
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity")
            return
        }
        activity.runOnUiThread {
            val layoutParams = activity.window.attributes
            originalBrightness = layoutParams.screenBrightness
            layoutParams.screenBrightness = 1.0f
            activity.window.attributes = layoutParams
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun restoreBrightness(promise: Promise) {
        val activity = getActivity()
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity")
            return
        }
        activity.runOnUiThread {
            val layoutParams = activity.window.attributes
            layoutParams.screenBrightness = if (originalBrightness >= 0) originalBrightness else WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
            activity.window.attributes = layoutParams
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun getScreenOrientation(promise: Promise) {
        val activity = getActivity()
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity")
            return
        }
        @Suppress("DEPRECATION")
        val rotation = activity.windowManager.defaultDisplay.rotation
        val orientation = when (rotation) {
            Surface.ROTATION_0 -> "portrait"
            Surface.ROTATION_90 -> "landscape-left"
            Surface.ROTATION_180 -> "portrait-upside-down"
            Surface.ROTATION_270 -> "landscape-right"
            else -> "unknown"
        }
        promise.resolve(orientation)
    }
}

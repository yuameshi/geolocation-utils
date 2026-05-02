package top.yuameshi.geolocation.utils

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = BluetoothNmeaModule.NAME)
class BluetoothNmeaModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        const val NAME = "BluetoothNmeaModule"
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun startBluetoothServer(promise: Promise) {
        val context = reactApplicationContext

        // Check location permission (needed for NMEA listener)
        if (context.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            promise.reject("NO_PERMISSION", "Location permission required")
            return
        }

        // Check Bluetooth permission on Android 12+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (context.checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                promise.reject("NO_PERMISSION", "Bluetooth connect permission required")
                return
            }
        }

        val result = BluetoothNmeaService.start(context)
        result.fold(
            onSuccess = { promise.resolve(null) },
            onFailure = { promise.reject("BT_ERROR", it.message) }
        )
    }

    @ReactMethod
    fun stopBluetoothServer(promise: Promise) {
        BluetoothNmeaService.stop()
        promise.resolve(null)
    }

    @ReactMethod
    fun getServerStatus(promise: Promise) {
        val map = Arguments.createMap()
        map.putBoolean("isRunning", BluetoothNmeaService.isRunning)
        map.putInt("connectedClients", BluetoothNmeaService.connectedClientCount)
        promise.resolve(map)
    }
}

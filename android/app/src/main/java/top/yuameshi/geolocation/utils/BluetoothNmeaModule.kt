package top.yuameshi.geolocation.utils

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.content.Context
import android.content.Intent
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
        val devices = Arguments.createArray()
        for (dev in BluetoothNmeaService.getConnectedDevices()) {
            val devMap = Arguments.createMap()
            devMap.putString("name", dev["name"])
            devMap.putString("address", dev["address"])
            devices.pushMap(devMap)
        }
        map.putArray("devices", devices)
        promise.resolve(map)
    }

    @ReactMethod
    fun setDiscoverable(enabled: Boolean, promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            promise.reject("UNSUPPORTED", "Discoverable mode requires Android 12 (API 31) or above")
            return
        }

        if (enabled) {
            if (reactApplicationContext.checkSelfPermission(Manifest.permission.BLUETOOTH_ADVERTISE) != PackageManager.PERMISSION_GRANTED) {
                promise.reject("NO_PERMISSION", "Bluetooth advertise permission required")
                return
            }

            val activity = getCurrentActivity()
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "No active Activity")
                return
            }

            val intent = Intent(BluetoothAdapter.ACTION_REQUEST_DISCOVERABLE).apply {
                putExtra(BluetoothAdapter.EXTRA_DISCOVERABLE_DURATION, 300)
            }
            activity.startActivity(intent)
            promise.resolve(null)
        } else {
            // Android does not provide an API to programmatically disable discoverable mode;
            // it times out automatically. Resolve immediately.
            promise.resolve(null)
        }
    }
}

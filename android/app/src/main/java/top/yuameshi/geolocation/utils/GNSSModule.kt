package top.yuameshi.geolocation.utils

import android.annotation.SuppressLint
import android.location.GnssStatus
import android.location.LocationManager
import android.os.Looper
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = GNSSModule.NAME)
class GNSSModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        const val NAME = "GNSSModule"
    }

    private var locationManager: LocationManager? = null
    private var gnssStatus: GnssStatus? = null

    override fun getName(): String = NAME

    @ReactMethod
    fun getGNSSStatus(promise: Promise) {
        val context = reactApplicationContext
        locationManager = context.getSystemService(LocationManager::class.java)
        if (locationManager == null) {
            promise.reject("NO_LOCATION_MANAGER", "LocationManager not available")
            return
        }
        // Check location permission
        val hasPermission = context.checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED
        if (!hasPermission) {
            promise.reject("NO_PERMISSION", "No location permission")
            return
        }
        // Request GNSS status updates
        try {
            val provider = LocationManager.GPS_PROVIDER
            val locationListener = object : android.location.LocationListener {
                override fun onLocationChanged(location: android.location.Location) {}
                override fun onStatusChanged(provider: String?, status: Int, extras: android.os.Bundle?) {}
                override fun onProviderEnabled(provider: String) {}
                override fun onProviderDisabled(provider: String) {}
            }
            locationManager?.requestLocationUpdates(
                provider,
                1000L,
                0f,
                locationListener
            )
            locationManager?.registerGnssStatusCallback(
                reactApplicationContext.mainExecutor,
                object : GnssStatus.Callback() {
                    override fun onSatelliteStatusChanged(status: GnssStatus) {
                        gnssStatus = status
                        val satellites = Arguments.createArray()
                        for (i in 0 until status.satelliteCount) {
                            val sat = Arguments.createMap()
                            sat.putInt("svid", status.getSvid(i))
                            sat.putString("type", getConstellationType(status.getConstellationType(i)))
                            sat.putDouble("snr", status.getCn0DbHz(i).toDouble())
                            sat.putDouble("frequency", status.getCarrierFrequencyHz(i).toDouble())
                            sat.putDouble("azimuth", status.getAzimuthDegrees(i).toDouble())
                            sat.putDouble("elevation", status.getElevationDegrees(i).toDouble())
                            sat.putBoolean("used", status.usedInFix(i))
                            satellites.pushMap(sat)
                        }
                        val result = Arguments.createMap()
                        result.putArray("satellites", satellites)
                        promise.resolve(result)
                        locationManager?.unregisterGnssStatusCallback(this)
                    }
                }
            )
        } catch (e: Exception) {
            promise.reject("GNSS_ERROR", e.message)
        }
    }

    private fun getConstellationType(type: Int): String {
        return when (type) {
            GnssStatus.CONSTELLATION_BEIDOU -> "BEIDOU"
            GnssStatus.CONSTELLATION_GALILEO -> "GALILEO"
            GnssStatus.CONSTELLATION_GLONASS -> "GLONASS"
            GnssStatus.CONSTELLATION_GPS -> "GPS"
            GnssStatus.CONSTELLATION_IRNSS -> "IRNSS"
            GnssStatus.CONSTELLATION_QZSS -> "QZSS"
            GnssStatus.CONSTELLATION_SBAS -> "SBAS"
            else -> "UNKNOWN"
        }
    }
}
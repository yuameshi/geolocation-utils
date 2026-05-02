package top.yuameshi.geolocation.utils

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothServerSocket
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.location.LocationManager
import android.location.OnNmeaMessageListener
import android.os.HandlerThread
import android.os.Handler
import java.io.IOException
import java.io.OutputStream
import java.util.UUID
import java.util.concurrent.CopyOnWriteArrayList

object BluetoothNmeaService {

    private const val SERVICE_NAME = "GeolocationUtils NMEA"
    private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")

    @Volatile
    var isRunning: Boolean = false
        private set

    private var serverSocket: BluetoothServerSocket? = null
    private val connectedSockets = CopyOnWriteArrayList<BluetoothSocket>()
    private var acceptThread: Thread? = null
    private var handlerThread: HandlerThread? = null
    private var handler: Handler? = null
    private var nmeaListener: OnNmeaMessageListener? = null
    private var locationManager: LocationManager? = null

    val connectedClientCount: Int
        get() = connectedSockets.size

    @SuppressLint("MissingPermission")
    fun start(context: Context): Result<Unit> {
        if (isRunning) return Result.success(Unit)

        val bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
            ?: return Result.failure(Exception("Bluetooth not available"))
        val bluetoothAdapter = bluetoothManager.adapter
            ?: return Result.failure(Exception("Bluetooth adapter not available"))
        if (!bluetoothAdapter.isEnabled) {
            return Result.failure(Exception("Bluetooth is disabled"))
        }

        val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
            ?: return Result.failure(Exception("LocationManager not available"))
        locationManager = lm

        // Start handler thread for NMEA writing
        val ht = HandlerThread("BtNmeaHandler").apply { start() }
        handlerThread = ht
        handler = Handler(ht.looper)

        // Register NMEA listener
        val listener = OnNmeaMessageListener { message, _ ->
            if (!isRunning || message.isNullOrEmpty()) return@OnNmeaMessageListener
            val data = if (message.endsWith("\r\n")) {
                message.toByteArray(Charsets.US_ASCII)
            } else {
                (message.trimEnd('\r', '\n') + "\r\n").toByteArray(Charsets.US_ASCII)
            }
            handler?.post {
                writeToClients(data)
            }
        }
        nmeaListener = listener

        try {
            lm.addNmeaListener(context.mainExecutor, listener)
        } catch (e: SecurityException) {
            cleanup()
            return Result.failure(Exception("Location permission required"))
        }

        // Create SPP server socket
        try {
            serverSocket = bluetoothAdapter.listenUsingRfcommWithServiceRecord(SERVICE_NAME, SPP_UUID)
        } catch (e: IOException) {
            cleanup()
            return Result.failure(Exception("Failed to create Bluetooth server: ${e.message}"))
        }

        isRunning = true

        // Start accept thread
        acceptThread = Thread({
            while (isRunning) {
                try {
                    val socket = serverSocket?.accept() ?: break
                    connectedSockets.add(socket)
                } catch (e: IOException) {
                    // Server socket closed or error — stop accepting
                    break
                }
            }
        }, "BtNmeaAccept").apply {
            isDaemon = true
            start()
        }

        return Result.success(Unit)
    }

    fun stop() {
        isRunning = false

        // Close server socket to unblock accept()
        try { serverSocket?.close() } catch (_: IOException) {}
        serverSocket = null

        // Close all client connections
        for (socket in connectedSockets) {
            try { socket.close() } catch (_: IOException) {}
        }
        connectedSockets.clear()

        // Unregister NMEA listener
        nmeaListener?.let { locationManager?.removeNmeaListener(it) }
        nmeaListener = null
        locationManager = null

        // Stop handler thread
        handlerThread?.quitSafely()
        handlerThread = null
        handler = null

        // Wait for accept thread to finish
        try { acceptThread?.join(2000) } catch (_: InterruptedException) {}
        acceptThread = null
    }

    private fun writeToClients(data: ByteArray) {
        val deadSockets = mutableListOf<BluetoothSocket>()
        for (socket in connectedSockets) {
            try {
                socket.outputStream.write(data)
                socket.outputStream.flush()
            } catch (_: IOException) {
                deadSockets.add(socket)
            }
        }
        for (socket in deadSockets) {
            connectedSockets.remove(socket)
            try { socket.close() } catch (_: IOException) {}
        }
    }

    private fun cleanup() {
        nmeaListener?.let { locationManager?.removeNmeaListener(it) }
        nmeaListener = null
        locationManager = null
        handlerThread?.quitSafely()
        handlerThread = null
        handler = null
    }
}

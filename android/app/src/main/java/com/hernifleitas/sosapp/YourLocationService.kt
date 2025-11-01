package com.hernifleitas.sosapp

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat

class YourLocationService : Service() {

    private val CHANNEL_ID = "sos-channel"

    override fun onCreate() {
        super.onCreate()
        Log.d("YourLocationService", "Servicio creado")

        // Crear canal de notificación si es Android 8+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channelName = "SOS Channel"
            val channelDescription = "Canal para notificaciones de emergencia"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, channelName, importance).apply {
                description = channelDescription
                enableLights(true)
                lightColor = android.graphics.Color.RED
                enableVibration(true)
            }
            val notificationManager: NotificationManager =
                getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }

        // Notificación obligatoria para servicios en primer plano
        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SOS Activo")
            .setContentText("El seguimiento de ubicación está activo")
            .setSmallIcon(R.drawable.ic_notification) // Tu icono de notificación
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()

        startForeground(1, notification)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d("YourLocationService", "Servicio iniciado")

        // Aquí puedes iniciar tu lógica de ubicación o cualquier tarea en background
        // Por ejemplo, un hilo o corutina para actualizar ubicación cada X segundos

        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d("YourLocationService", "Servicio destruido")
    }

    override fun onBind(intent: Intent?): IBinder? {
        // Servicio no enlazado
        return null
    }
}

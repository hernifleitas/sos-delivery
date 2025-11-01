package com.hernifleitas.sosapp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d("BootReceiver", "Dispositivo reiniciado, verificando estado SOS...")

            val prefs = context.getSharedPreferences("SOS_PREFS", Context.MODE_PRIVATE)
            val sosActivo = prefs.getBoolean("sosActivo", false)

            if (sosActivo) {
                Log.d("BootReceiver", "SOS estaba activo, reiniciando servicio...")
                // Inicia tu servicio de ubicación
                val serviceIntent = Intent(context, YourLocationService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
            }
        }
    }
}

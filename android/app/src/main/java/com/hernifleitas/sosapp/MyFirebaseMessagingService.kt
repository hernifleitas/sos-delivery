package com.hernifleitas.sosapp

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MyFirebaseMessagingService : FirebaseMessagingService() {
    
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Aquí puedes manejar el nuevo token FCM
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        // Aquí manejas los mensajes recibidos
        if (remoteMessage.notification != null) {
            // Mostrar notificación
            val notification = remoteMessage.notification
            // Aquí puedes personalizar la notificación
        }
    }
}
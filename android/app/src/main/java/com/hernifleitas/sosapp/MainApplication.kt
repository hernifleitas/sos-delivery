package com.hernifleitas.sosapp

import android.app.Application
import android.content.res.Configuration
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
        this,
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                    // Packages that cannot be autolinked yet can be added manually here
                    // add(MyReactNativePackage())
                }

            override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        }
    )

    override val reactHost: ReactHost
        get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()

        // Release level (Expo)
        DefaultNewArchitectureEntryPoint.releaseLevel = try {
            ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
        } catch (e: IllegalArgumentException) {
            ReleaseLevel.STABLE
        }

        // Inicializa React Native
        loadReactNative(this)

        // Inicializa Expo Modules
        ApplicationLifecycleDispatcher.onApplicationCreate(this)

        // Canal de notificación para Android 8+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "SOS Channel"
            val descriptionText = "Canal para notificaciones de emergencia"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel("sos-channel", name, importance).apply {
                description = descriptionText
                enableLights(true)
                lightColor = android.graphics.Color.RED
                enableVibration(true)
            }

            val notificationManager: NotificationManager =
                getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
    }
}

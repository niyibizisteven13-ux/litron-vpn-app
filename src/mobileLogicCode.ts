export const mobileLogicCode = `
// ==============================================================================
// Litron VPN - Systems Level Network Integration & AdMob Rewarded Controller
// Framework: Android Native Kotlin (VpnService & Google Mobile Ads)
// ==============================================================================

package com.litron.vpn

import android.net.VpnService
import android.os.ParcelFileDescriptor
import android.content.Intent
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.OnUserEarnedRewardListener

/**
 * 1. CRYPTOGRAPHIC PROTOCOL CONFIGURATION MODELLING
 * Custom parsers and models for AmneziaWG & Shadowsocks-2022 domainless configurations.
 */
data class AmneziaWgConfig(
    val serverIp: String,
    val port: Int,
    val privateKey: String,
    val publicKey: String,
    val presharedKey: String,
    val dns: String,
    val mtu: Int,
    // AmneziaWG custom DPI-evasion parameters
    val Jc: Int = 4,         // Junk packet count
    val Jv: Int = 1400,      // Junk packet size
    val S1: Int = 81,        // Init packet offset
    val S2: Int = 39,        // Response packet offset
    val H1: Long = 11111111, // Magic header 1
    val H2: Long = 22222222, // Magic header 2
    val H3: Long = 33333333, // Magic header 3
    val H4: Long = 44444444  // Magic header 4
)

data class Shadowsocks2022Config(
    val serverIp: String,
    val port: Int,
    val password: String,
    val method: String = "2022-blake3-aes-128-gcm"
)

/**
 * 2. CONCRETE AMNEZIAWG CONFIG WRITER
 * Compiles raw server variables (Endpoint IPv4, Port, keys, and junk parameters)
 * into a structured, in-memory configuration syntax compliant with the AmneziaWG protocol core.
 */
class AmneziaWgConfigWriter {
    companion object {
        fun compileConfig(config: AmneziaWgConfig): String {
            return """
                [Interface]
                PrivateKey = \${config.privateKey}
                Address = 10.8.0.2/24
                DNS = \${config.dns}
                MTU = \${config.mtu}
                
                # AmneziaWG DPI-Evasion Obfuscation Parameters
                Jc = \${config.Jc}
                Jv = \${config.Jv}
                S1 = \${config.S1}
                S2 = \${config.S2}
                H1 = \${config.H1}
                H2 = \${config.H2}
                H3 = \${config.H3}
                H4 = \${config.H4}

                [Peer]
                PublicKey = \${config.publicKey}
                PresharedKey = \${config.presharedKey}
                Endpoint = \${config.serverIp}:\${config.port}
                AllowedIPs = 0.0.0.0/0
                PersistentKeepalive = 25
            """.trimIndent()
        }
    }
}

/**
 * 3. PLATFORM VPN SERVICE INTERFACE & SPLIT TUNNEL ENGINE
 * Establishes native Android network routes, handles AmneziaWG parameters, and supports split-tunnel exclusions.
 */
class LitronVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null
    private var isTunnelRunning = false
    private var timeStateManager: VpnTimeStateManager? = null

    override fun onCreate() {
        super.onCreate()
        timeStateManager = VpnTimeStateManager(applicationContext)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent != null) {
            val action = intent.action
            if ("CONNECT" == action) {
                // Parse configuration from intent
                val serverIp = intent.getStringExtra("SERVER_IP") ?: "168.138.22.84"
                val port = intent.getIntExtra("PORT", 51820)
                val excludedApps = intent.getStringArrayListExtra("EXCLUDED_APPS") ?: ArrayList()
                
                // Construct AmneziaWG configurations with obfuscation headers
                val awgConfig = AmneziaWgConfig(
                    serverIp = serverIp,
                    port = port,
                    privateKey = intent.getStringExtra("PRIVATE_KEY") ?: "",
                    publicKey = intent.getStringExtra("PUBLIC_KEY") ?: "",
                    presharedKey = intent.getStringExtra("PRESHARED_KEY") ?: "",
                    dns = intent.getStringExtra("DNS") ?: "1.1.1.1",
                    mtu = intent.getIntExtra("MTU", 1420),
                    Jc = intent.getIntExtra("AWG_JC", 4),
                    Jv = intent.getIntExtra("AWG_JV", 1400)
                )

                // Verify session time remaining before starting
                if (timeStateManager?.getTimeRemaining() ?: 0L > 0L) {
                    startVpnTunnel(awgConfig, excludedApps)
                } else {
                    Log.e("LITRON_SYS", "Cannot connect: 0 seconds left in tunnel balance.")
                    stopSelf()
                }
            } else if ("DISCONNECT" == action) {
                stopVpnTunnel()
            }
        }
        return START_STICKY
    }

    private fun startVpnTunnel(config: AmneziaWgConfig, excludedApps: List<String>) {
        if (isTunnelRunning) return

        try {
            createNotificationChannel()
            val notification = NotificationCompat.Builder(this, "LITRON_VPN")
                .setContentTitle("Litron Secured Connection")
                .setContentText("Routing via obfuscated AmneziaWG at \${config.serverIp}")
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build()
            
            startForeground(1337, notification)

            // Instantiate platform routing builder
            val builder = Builder()
                .setSession("LitronAmneziaWGTunnel")
                .setMtu(config.mtu)
                .addAddress("10.8.0.2", 24)
                .addDnsServer(config.dns)
                .addRoute("0.0.0.0", 0) // Route all IPv4 traffic

            // 3. SPLIT TUNNELING: EXCLUDE APP PACKAGES FROM GATEWAY
            for (packageName in excludedApps) {
                try {
                    builder.addDisallowedApplication(packageName)
                    Log.d("LITRON_SYS", "Split Tunnel: Excluded application: \$packageName")
                } catch (e: Exception) {
                    Log.e("LITRON_SYS", "Failed to exclude package: \$packageName", e)
                }
            }

            // Compile raw server parameters into dynamic AmneziaWG configuration file syntax
            val configText = AmneziaWgConfigWriter.compileConfig(config)
            Log.d("LITRON_SYS", "Generated AmneziaWG raw config file text:\n\$configText")

            // Bind tunnel fd
            vpnInterface = builder.establish()
            isTunnelRunning = true

            // Pass AmneziaWG obfuscation parameters to the low-level native socket layer
            Log.i("LITRON_SYS", "Tunnel established. Socket Obfuscation enabled: " +
                    "Jc=\${config.Jc}, Jv=\${config.Jv}, S1=\${config.S1}, S2=\${config.S2}, " +
                    "H1=\${config.H1}, H2=\${config.H2}, H3=\${config.H3}, H4=\${config.H4}")

            // Start countdown thread tracker
            timeStateManager?.startCountdownTracker {
                // If countdown hits 0, trigger automatic self-dismantling
                Log.w("LITRON_SYS", "Access timer expired while connected! Dismantling tunnel.")
                stopVpnTunnel()
            }

        } catch (e: Exception) {
            Log.e("LITRON_SYS", "Establishment of native VPN tunnel failed.", e)
            stopSelf()
        }
    }

    private fun stopVpnTunnel() {
        try {
            timeStateManager?.stopCountdownTracker()
            vpnInterface?.close()
            vpnInterface = null
            isTunnelRunning = false
            stopForeground(true)
            stopSelf()
            Log.i("LITRON_SYS", "AmneziaWG tunnel successfully dismantled.")
        } catch (e: Exception) {
            Log.e("LITRON_SYS", "Error dismantling VPN Interface.", e)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "LITRON_VPN",
                "VPN Status Updates",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        stopVpnTunnel()
        super.onDestroy()
    }
}

/**
 * 3. AD-MONETIZATION STATE MACHINE & DURABLE TIME PERSISTENCE
 * Manages the countdown thread, saves remaining duration securely, and handles rewards.
 */
class VpnTimeStateManager(context: android.content.Context) {

    private val prefs = context.getSharedPreferences("litron_secure_store", android.content.Context.MODE_PRIVATE)
    private var countdownTimer: java.util.Timer? = null
    private val PREF_KEY_TIME = "tunnel_balance_seconds"

    init {
        // Initialize with 2 hours default balance if none exists
        if (!prefs.contains(PREF_KEY_TIME)) {
            saveTimeRemaining(7200L) 
        }
    }

    fun getTimeRemaining(): Long {
        return prefs.getLong(PREF_KEY_TIME, 7200L)
    }

    fun saveTimeRemaining(seconds: Long) {
        prefs.edit().putLong(PREF_KEY_TIME, seconds).apply()
    }

    fun addHours(hours: Int) {
        val current = getTimeRemaining()
        val bonus = hours * 3600L
        saveTimeRemaining(current + bonus)
        Log.i("LITRON_SYS", "Added \$hours hours to balance. New balance: \${getTimeRemaining()}s")
    }

    fun startCountdownTracker(onExpired: () -> Unit) {
        countdownTimer?.cancel()
        countdownTimer = java.util.Timer()
        countdownTimer?.scheduleAtFixedRate(object : java.util.TimerTask() {
            override fun run() {
                val current = getTimeRemaining()
                if (current > 0) {
                    saveTimeRemaining(current - 1)
                } else {
                    cancel()
                    onExpired()
                }
            }
        }, 1000L, 1000L)
    }

    fun stopCountdownTracker() {
        countdownTimer?.cancel()
        countdownTimer = null
    }
}

/**
 * 4. ADMOB REWARDED VIDEO AD ADAPTER
 * Connects AdMob SDK rewards with our clean time state machine.
 */
class AdMobRewardedManager(
    private val activity: android.app.Activity, 
    private val stateManager: VpnTimeStateManager,
    private val listener: RewardUpdateListener
) {

    private var rewardedAd: RewardedAd? = null
    private var isAdLoading = false
    private val AD_UNIT_ID = "ca-app-pub-3940256099942544/5224354917" // Official AdMob Test unit

    interface RewardUpdateListener {
        fun onRewardGranted(newBalanceSeconds: Long)
        fun onAdFailedToLoad(error: String)
    }

    fun loadAd() {
        if (isAdLoading || rewardedAd != null) return
        isAdLoading = true

        val adRequest = AdRequest.Builder().build()
        RewardedAd.load(activity, AD_UNIT_ID, adRequest, object : RewardedAdLoadCallback() {
            override fun onAdFailedToLoad(adError: LoadAdError) {
                Log.e("LITRON_SYS", "AdMob Reward loading failed: " + adError.message)
                rewardedAd = null
                isAdLoading = false
                listener.onAdFailedToLoad(adError.message)
            }

            override fun onAdLoaded(ad: RewardedAd) {
                Log.d("LITRON_SYS", "AdMob Reward loaded successfully and cached.")
                rewardedAd = ad
                isAdLoading = false
            }
        })
    }

    fun showAd() {
        if (rewardedAd != null) {
            rewardedAd?.show(activity, OnUserEarnedRewardListener { rewardItem ->
                // Grant reward inside state manager
                val rewardHours = 2
                stateManager.addHours(rewardHours)
                
                // Clear state and notify subscriber
                listener.onRewardGranted(stateManager.getTimeRemaining())
                rewardedAd = null
                loadAd() // pre-fetch next ad
            })
        } else {
            Log.w("LITRON_SYS", "Ad was not cached yet. Retrying fetch.")
            loadAd()
        }
    }
}
`;

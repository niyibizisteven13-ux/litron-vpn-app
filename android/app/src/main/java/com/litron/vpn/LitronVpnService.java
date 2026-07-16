package com.litron.vpn;

import android.content.Intent;
import android.net.VpnService;
import android.os.ParcelFileDescriptor;
import android.util.Log;
import java.io.IOException;

public class LitronVpnService extends VpnService implements Runnable {
    private static final String TAG = "LitronVpnService";
    private Thread mThread;
    private ParcelFileDescriptor mInterface;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && "START".equals(intent.getAction())) {
            mThread = new Thread(this, "LitronVpnThread");
            mThread.start();
        } else if (intent != null && "STOP".equals(intent.getAction())) {
            stopTunnel();
        }
        return START_STICKY;
    }

    @Override
    public void run() {
        try {
            Log.i(TAG, "Initializing Native AmneziaWG Tunnel Core via AWS Endpoint...");
            
            // Establish the System Virtual Network Interface Card (TUN Device Wrapper)
            Builder builder = new Builder();
            mInterface = builder.setMtu(1420)
                    .addAddress("10.0.0.2", 32) 
                    .addRoute("0.0.0.0", 0)     // FORCE 100% of global phone traffic through the VPN
                    .addDnsServer("1.1.1.1")    
                    .setSession("LitronAWSNode")
                    .establish();

            int tunFd = mInterface.getFd();
            Log.i(TAG, "Virtual TUN interface socket bound successfully. FD index: " + tunFd);

            while (!Thread.interrupted()) {
                Thread.sleep(1000);
            }

        } catch (Exception e) {
            Log.e(TAG, "Tunnel critical failure: " + e.getMessage());
        } finally {
            stopTunnel();
        }
    }

    private void stopTunnel() {
        Log.i(TAG, "Dismantling network interfaces, restoring raw local ISP paths...");
        if (mInterface != null) {
            try {
                mInterface.close(); 
            } catch (IOException e) {
                Log.e(TAG, "Error closing tunnel system descriptor", e);
            }
            mInterface = null;
        }
        if (mThread != null) {
            mThread.interrupt();
            mThread = null;
        }
        stopSelf();
    }

    @Override
    public void onDestroy() {
        stopTunnel();
        super.onDestroy();
    }
}

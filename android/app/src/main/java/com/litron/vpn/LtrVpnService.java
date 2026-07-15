package com.litron.vpn;

import android.content.Intent;
import android.net.VpnService;
import android.os.ParcelFileDescriptor;
import java.io.IOException;

public class LtrVpnService extends VpnService {
    private ParcelFileDescriptor vpnInterface = null;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String ip = intent.getStringExtra("IP");

            Builder builder = new Builder();
            builder.setMtu(1420)
                   .addAddress("10.0.0.2", 32)
                   .addRoute("0.0.0.0", 0)
                   .addDnsServer("1.1.1.1")
                   .setSession("LitronAmneziaWGTunnel");

            try {
                vpnInterface = builder.establish();
                // Hand over the network socket descriptor to your compiled AmneziaWG Go/C backend layer here
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        if (vpnInterface != null) {
            try {
                vpnInterface.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        super.onDestroy();
    }
}

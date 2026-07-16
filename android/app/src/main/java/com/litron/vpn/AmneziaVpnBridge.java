package com.litron.vpn;

import android.content.Intent;
import android.net.VpnService;
import android.util.Log;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AmneziaVpnBridge")
public class AmneziaVpnBridge extends Plugin {
    private static final String TAG = "AmneziaVpnBridge";

    @PluginMethod
    public void startSystemTunnel(PluginCall call) {
        try {
            Intent intent = VpnService.prepare(getContext());
            if (intent != null) {
                // If the phone requires explicit authorization, fire the system pop-up window
                Log.i(TAG, "Requesting native OS VpnService configuration permissions...");
                getActivity().startActivity(intent);
                call.resolve();
            } else {
                // Permissions already approved from a previous install run, initialize immediately
                Log.i(TAG, "Permissions already valid. Activating network sockets...");
                Intent serviceIntent = new Intent(getContext(), LitronVpnService.class);
                serviceIntent.setAction("START");
                getContext().startService(serviceIntent);
                call.resolve();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error inside system tunnel launcher bridge module", e);
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void stopSystemTunnel(PluginCall call) {
        try {
            Log.i(TAG, "Deactivating system interfaces via control channel request...");
            Intent serviceIntent = new Intent(getContext(), LitronVpnService.class);
            serviceIntent.setAction("STOP");
            getContext().startService(serviceIntent);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
}

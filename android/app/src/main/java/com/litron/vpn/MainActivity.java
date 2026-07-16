package com.litron.vpn;

import android.content.Intent;
import android.net.VpnService;
import android.os.Bundle;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(AmneziaVpnBridge.class);
        super.onCreate(savedInstanceState);
        registerPlugin(AmneziaVpnBridge.class);
    }
}

@CapacitorPlugin(name = "AmneziaVpnBridge")
class AmneziaVpnBridge extends Plugin {
    private static final int VPN_REQUEST_CODE = 0x0F;
    private PluginCall activeCall;

    @PluginMethod
    public void startSystemTunnel(PluginCall call) {
        this.activeCall = call;
        Intent intent = VpnService.prepare(getContext());
        if (intent != null) {
            startActivityForResult(call, intent, VPN_REQUEST_CODE);
        } else {
            executeTunnelStartup(call);
        }
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        if (requestCode == VPN_REQUEST_CODE && activeCall != null) {
            if (resultCode == BridgeActivity.RESULT_OK) {
                executeTunnelStartup(activeCall);
            } else {
                activeCall.reject("User denied system network permissions.");
            }
        }
    }

    private void executeTunnelStartup(PluginCall call) {
        String endpointIp = call.getString("endpoint_ip");
        String serverPublicKey = call.getString("server_public_key");
        String clientPrivateKey = call.getString("client_private_key");
        int jc = call.getInt("jc", 4);
        int jv = call.getInt("jv", 40);

        try {
            Intent serviceIntent = new Intent(getContext(), LtrVpnService.class);
            serviceIntent.putExtra("IP", endpointIp);
            serviceIntent.putExtra("PUB_KEY", serverPublicKey);
            serviceIntent.putExtra("PRIV_KEY", clientPrivateKey);
            serviceIntent.putExtra("JC", jc);
            serviceIntent.putExtra("JV", jv);

            getContext().startService(serviceIntent);

            Toast.makeText(getContext(), "AmneziaWG Tunnel Activated via AWS!", Toast.LENGTH_LONG).show();
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to spin up native network socket: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopSystemTunnel(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), LtrVpnService.class);
        getContext().stopService(serviceIntent);
        Toast.makeText(getContext(), "VPN Disconnected", Toast.LENGTH_SHORT).show();
        call.resolve();
    }
}


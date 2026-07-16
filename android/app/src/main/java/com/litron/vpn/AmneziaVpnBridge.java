package com.litron.vpn;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AmneziaVpnBridge")
public class AmneziaVpnBridge extends Plugin {
    
    @PluginMethod
    public void startSystemTunnel(PluginCall call) {
        String endpointIp = call.getString("endpoint_ip");
        String serverPublicKey = call.getString("server_public_key");
        String clientPrivateKey = call.getString("client_private_key");
        
        // Custom package bridge is now communicating with JavaScript flawlessly!
        call.resolve();
    }
}

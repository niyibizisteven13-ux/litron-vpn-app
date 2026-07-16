package com.litron.vpn;

import android.app.Activity;
import android.content.Intent;
import android.net.VpnService;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.wireguard.android.backend.GoBackend;
import com.wireguard.android.backend.Tunnel;
import com.wireguard.config.Config;

import java.io.BufferedReader;
import java.io.StringReader;

@CapacitorPlugin(name = "Wireguard")
public class WireguardPlugin extends Plugin {

    private GoBackend backend;
    private Tunnel tunnel;
    private String pendingConfigText;

    @PluginMethod
    public void connect(PluginCall call) {
        String configText = call.getString("config");
        if (configText == null) {
            call.reject("Missing 'config' string (WireGuard .conf contents)");
            return;
        }

        pendingConfigText = configText;
        call.setKeepAlive(true);

        Intent prepareIntent = VpnService.prepare(getContext());
        if (prepareIntent != null) {
            startActivityForResult(call, prepareIntent, "vpnPermissionResult");
        } else {
            doConnect(call);
        }
    }

    @ActivityCallback
    private void vpnPermissionResult(PluginCall call, androidx.activity.result.ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() == Activity.RESULT_OK) {
            doConnect(call);
        } else {
            call.reject("VPN permission denied by user");
        }
    }

    private void doConnect(PluginCall call) {
        try {
            backend = new GoBackend(getContext());
            Config config = Config.parse(new BufferedReader(new StringReader(pendingConfigText)));

            tunnel = new Tunnel() {
                @Override
                public String getName() {
                    return "litron-tunnel";
                }

                @Override
                public void onStateChange(State newState) {
                }
            };

            getContext().startService(new Intent(getContext(), LitronVpnService.class));
            backend.setState(tunnel, Tunnel.State.UP, config);

            JSObject ret = new JSObject();
            ret.put("status", "connected");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to connect: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        try {
            if (backend != null && tunnel != null) {
                backend.setState(tunnel, Tunnel.State.DOWN, null);
            }
            getContext().stopService(new Intent(getContext(), LitronVpnService.class));

            JSObject ret = new JSObject();
            ret.put("status", "disconnected");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to disconnect: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            if (backend != null && tunnel != null) {
                ret.put("state", backend.getState(tunnel).toString());
            } else {
                ret.put("state", "DOWN");
            }
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to get status: " + e.getMessage(), e);
        }
    }
}

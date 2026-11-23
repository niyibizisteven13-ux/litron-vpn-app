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
import com.wireguard.android.backend.Statistics;
import com.wireguard.android.backend.Tunnel;
import com.wireguard.config.Config;
import com.wireguard.crypto.Key;

import java.io.BufferedReader;
import java.io.StringReader;

@CapacitorPlugin(name = "Wireguard")
public class WireguardPlugin extends Plugin {

    private static GoBackend backend;
    private static Tunnel tunnel;

    @PluginMethod
    public void connect(PluginCall call) {
        Intent prepareIntent = VpnService.prepare(getContext());
        if (prepareIntent != null) {
            startActivityForResult(call, prepareIntent, "vpnPermissionResult");
        } else {
            getBridge().execute(() -> doConnect(call));
        }
    }

    @ActivityCallback
    private void vpnPermissionResult(PluginCall call, androidx.activity.result.ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() == Activity.RESULT_OK) {
            getBridge().execute(() -> doConnect(call));
        } else {
            call.reject("VPN permission denied by user");
        }
    }

    private void doConnect(PluginCall call) {
        try {
            if (backend != null && tunnel != null && backend.getState(tunnel) == Tunnel.State.UP) {
                call.reject("A WireGuard tunnel is already running");
                return;
            }
            if (backend == null) {
                backend = new GoBackend(getContext().getApplicationContext());
            }
            String text = call.getString("config");
            if (text == null) {
                try {
                    text = DeviceProfile.enroll(getContext());
                } catch (Exception error) {
                    call.reject("Litron could not reach or register with its gateway. Check your internet connection and tap to retry.");
                    return;
                }
            }
            Config config = Config.parse(new BufferedReader(new StringReader(text)));

            tunnel = new Tunnel() {
                @Override
                public String getName() {
                    return "litron-tunnel";
                }

                @Override
                public void onStateChange(State newState) {
                }
            };

            if (backend.setState(tunnel, Tunnel.State.UP, config) != Tunnel.State.UP) {
                call.reject("WireGuard tunnel did not start");
                return;
            }

            JSObject ret = new JSObject();
            ret.put("status", "connected");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Could not start the WireGuard tunnel");
        }
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        try {
            if (backend != null && tunnel != null) {
                backend.setState(tunnel, Tunnel.State.DOWN, null);
            }

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
            boolean up = backend != null && tunnel != null && backend.getState(tunnel) == Tunnel.State.UP;
            ret.put("state", up ? "UP" : "DOWN");
            if (up) {
                Statistics statistics = backend.getStatistics(tunnel);
                long latestHandshake = 0;
                for (Key peer : statistics.peers()) {
                    Statistics.PeerStats stats = statistics.peer(peer);
                    if (stats != null) {
                        latestHandshake = Math.max(latestHandshake, stats.latestHandshakeEpochMillis());
                    }
                }
                ret.put("latestHandshake", latestHandshake);
                ret.put("receivedBytes", statistics.totalRx());
                ret.put("sentBytes", statistics.totalTx());
            }
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to get status: " + e.getMessage(), e);
        }
    }
}

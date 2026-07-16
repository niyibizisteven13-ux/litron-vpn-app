package com.litron.vpn;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Register the bridge plugin explicitly inside your custom package domain
        registerPlugin(AmneziaVpnBridge.class);
    }
}

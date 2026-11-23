package com.litron.vpn;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(WireguardPlugin.class);
        registerPlugin(RewardedAdsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

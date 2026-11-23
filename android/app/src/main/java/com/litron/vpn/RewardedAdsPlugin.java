package com.litron.vpn;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;

@CapacitorPlugin(name = "RewardedAds")
public class RewardedAdsPlugin extends Plugin {
    private static final String TEST_REWARDED_UNIT = "ca-app-pub-3940256099942544/5224354917";
    private boolean busy;

    @PluginMethod
    public void show(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (busy) {
                call.reject("A rewarded ad is already in progress");
                return;
            }
            busy = true;
            MobileAds.initialize(getContext(), status -> getActivity().runOnUiThread(() -> loadAd(call)));
        });
    }

    private void loadAd(PluginCall call) {
        RewardedAd.load(getActivity(), TEST_REWARDED_UNIT, new AdRequest.Builder().build(),
            new RewardedAdLoadCallback() {
                @Override
                public void onAdFailedToLoad(LoadAdError error) {
                    fail(call);
                }

                @Override
                public void onAdLoaded(RewardedAd ad) {
                    showAd(call, ad);
                }
            });
    }

    private void showAd(PluginCall call, RewardedAd ad) {
        if (getActivity().isFinishing() || getActivity().isDestroyed()) {
            fail(call);
            return;
        }
        final class AdResult extends FullScreenContentCallback {
            private boolean earned;

            @Override
            public void onAdDismissedFullScreenContent() {
                busy = false;
                JSObject result = new JSObject();
                result.put("earned", earned);
                call.resolve(result);
            }

            @Override
            public void onAdFailedToShowFullScreenContent(AdError error) {
                fail(call);
            }
        }
        AdResult result = new AdResult();
        ad.setFullScreenContentCallback(result);
        ad.show(getActivity(), reward -> result.earned = true);
    }

    private void fail(PluginCall call) {
        busy = false;
        call.reject("Rewarded ad unavailable");
    }
}

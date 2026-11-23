package com.litron.vpn;

import android.content.Context;
import android.util.AtomicFile;

import com.wireguard.crypto.Key;
import com.wireguard.crypto.KeyPair;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import javax.net.ssl.HttpsURLConnection;

final class DeviceProfile {
    private static synchronized KeyPair deviceKey(Context context) throws Exception {
        AtomicFile file = new AtomicFile(new File(context.getNoBackupFilesDir(), "litron-device-key"));
        try {
            return new KeyPair(Key.fromBytes(file.readFully()));
        } catch (java.io.FileNotFoundException missing) {
            // First connection on this installation.
        }
        KeyPair pair = new KeyPair();
        FileOutputStream output = file.startWrite();
        try {
            output.write(pair.getPrivateKey().getBytes());
            file.finishWrite(output);
        } catch (Exception error) {
            file.failWrite(output);
            throw error;
        }
        return pair;
    }

    static String enroll(Context context) throws Exception {
        KeyPair pair = deviceKey(context);
        URL url = new URL("https://bwenge.space/api/litron/peers");
        HttpsURLConnection request = (HttpsURLConnection) url.openConnection();
        try {
            request.setRequestMethod("POST");
            request.setInstanceFollowRedirects(false);
            request.setConnectTimeout(10000);
            request.setReadTimeout(15000);
            request.setDoOutput(true);
            request.setRequestProperty("Content-Type", "application/json");
            JSONObject body = new JSONObject().put("publicKey", pair.getPublicKey().toBase64());
            try (OutputStream output = request.getOutputStream()) {
                output.write(body.toString().getBytes(StandardCharsets.UTF_8));
            }
            if (request.getResponseCode() != 200) throw new java.io.IOException("Enrollment failed");
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(request.getInputStream(), StandardCharsets.UTF_8))) {
                JSONObject peer = new JSONObject(reader.readLine());
                String address = peer.getString("address");
                String endpoint = peer.getString("endpoint");
                String serverKey = Key.fromBase64(peer.getString("publicKey")).toBase64();
                if (!address.matches("10\\.77\\.77\\.[0-9]{1,3}/32") || !endpoint.matches("[a-zA-Z0-9.-]+:[0-9]{1,5}")) {
                    throw new java.io.IOException("Invalid gateway settings");
                }
                return "[Interface]\nPrivateKey = " + pair.getPrivateKey().toBase64() +
                    "\nAddress = " + address + "\nDNS = 1.1.1.1\n[Peer]\nPublicKey = " + serverKey +
                    "\nEndpoint = " + endpoint + "\nAllowedIPs = 0.0.0.0/0, ::/0\nPersistentKeepalive = 25\n";
            }
        } finally {
            request.disconnect();
        }
    }
}

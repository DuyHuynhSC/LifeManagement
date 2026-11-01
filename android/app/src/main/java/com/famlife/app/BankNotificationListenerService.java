package com.famlife.app;

import android.app.Notification;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class BankNotificationListenerService extends NotificationListenerService {
    private static final String TAG = "BankNotification";
    public static final String PREFS_NAME = "bank_tx_prefs";
    public static final String KEY_PENDING_TX = "pending_notifications";

    private static final Set<String> MONITORED_PACKAGES = new HashSet<>(Arrays.asList(
        "com.mservice.momotransfer",
        "com.mservice.momo",
        "vn.com.vng.zalopay",
        "com.VCB",
        "com.vcb.digibank",
        "vn.com.techcombank.bb.app",
        "com.techcombank.mobile",
        "com.mbmobile",
        "com.mbbank",
        "com.vnpay.bidv",
        "com.vnpay.vpbankonline",
        "com.vpbank.neo",
        "com.tpb.mb.gprsandroid",
        "mobile.acb.com.vn",
        "com.vietinbank.ipay",
        "com.google.android.apps.messaging",
        "com.samsung.android.messaging",
        "com.android.mms"
    ));

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || sbn.getNotification() == null) return;

        String packageName = sbn.getPackageName();
        if (packageName == null) return;

        Notification notification = sbn.getNotification();
        Bundle extras = notification.extras;
        if (extras == null) return;

        CharSequence titleCs = extras.getCharSequence(Notification.EXTRA_TITLE);
        CharSequence textCs = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
        if (textCs == null || textCs.length() == 0) {
            textCs = extras.getCharSequence(Notification.EXTRA_TEXT);
        }

        String title = titleCs != null ? titleCs.toString() : "";
        String text = textCs != null ? textCs.toString() : "";
        String combined = (title + " " + text).trim();

        if (combined.isEmpty()) return;

        boolean isMonitoredPackage = MONITORED_PACKAGES.contains(packageName);
        boolean containsMoneySignal = combined.contains("VND") || combined.contains("đ") ||
                combined.contains("dong") || combined.contains("-") || combined.contains("thanh toán") ||
                combined.contains("chuyển tiền") || combined.contains("SD TK");

        if (!isMonitoredPackage && !containsMoneySignal) {
            return;
        }

        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String raw = prefs.getString(KEY_PENDING_TX, "[]");
            JSONArray arr = new JSONArray(raw);

            JSONObject item = new JSONObject();
            item.put("packageName", packageName);
            item.put("text", combined);
            item.put("timestamp", System.currentTimeMillis());

            arr.put(item);

            // Keep max 30 items
            while (arr.length() > 30) {
                arr.remove(0);
            }

            prefs.edit().putString(KEY_PENDING_TX, arr.toString()).apply();
            Log.d(TAG, "Captured bank transaction notification from " + packageName + ": " + combined);
        } catch (Exception e) {
            Log.e(TAG, "Error saving notification", e);
        }
    }
}

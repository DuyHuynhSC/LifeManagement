package com.famlife.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.provider.Settings;
import android.text.TextUtils;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "BankTransactionPlugin")
public class BankTransactionPlugin extends Plugin {

    @PluginMethod
    public void checkNotificationPermission(PluginCall call) {
        Context context = getContext();
        String packageName = context.getPackageName();
        String flat = Settings.Secure.getString(context.getContentResolver(), "enabled_notification_listeners");
        boolean enabled = false;
        if (!TextUtils.isEmpty(flat)) {
            String[] names = flat.split(":");
            for (String name : names) {
                ComponentName cn = ComponentName.unflattenFromString(name);
                if (cn != null && TextUtils.equals(packageName, cn.getPackageName())) {
                    enabled = true;
                    break;
                }
            }
        }

        JSObject ret = new JSObject();
        ret.put("granted", enabled);
        call.resolve(ret);
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        Context context = getContext();
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void getPendingTransactions(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(BankNotificationListenerService.PREFS_NAME, Context.MODE_PRIVATE);
        String raw = prefs.getString(BankNotificationListenerService.KEY_PENDING_TX, "[]");

        try {
            JSONArray arr = new JSONArray(raw);
            JSArray jsArray = new JSArray();

            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                JSObject item = new JSObject();
                item.put("packageName", obj.optString("packageName"));
                item.put("text", obj.optString("text"));
                item.put("timestamp", obj.optLong("timestamp"));
                jsArray.put(item);
            }

            JSObject ret = new JSObject();
            ret.put("transactions", jsArray);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to parse pending notifications: " + e.getMessage());
        }
    }

    @PluginMethod
    public void clearPendingTransactions(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(BankNotificationListenerService.PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(BankNotificationListenerService.KEY_PENDING_TX, "[]").apply();

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
}

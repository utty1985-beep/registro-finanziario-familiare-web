package it.registrofamiliare.app;

import android.app.Notification;
import android.content.*;
import android.os.*;
import android.provider.Settings;
import android.service.notification.*;
import org.json.JSONObject;
import java.util.*;

/** Repair lifecycle and isolate malformed notifications without changing the payment queue protocol. */
public final class WalletRecovery {
    private static final Handler MAIN = new Handler(Looper.getMainLooper());
    private static PaymentNotificationListener connected;
    private static int generation;
    private static long lastRebind;
    private static SharedPreferences diag(Context c) { return c.getSharedPreferences("notification_diagnostics",0); }
    private static void error(Context c, String key, Exception e) {
        diag(c).edit().putString(key,e.getClass().getSimpleName()).putLong(key+"At",System.currentTimeMillis()).apply();
    }
    public static boolean accessEnabled(Context c) {
        String flat = Settings.Secure.getString(c.getContentResolver(),"enabled_notification_listeners");
        ComponentName expected = new ComponentName(c,PaymentNotificationListener.class);
        if (flat != null) for (String part : flat.split(":"))
            if (expected.equals(ComponentName.unflattenFromString(part))) return true;
        return false;
    }
    public static void onConnected(final PaymentNotificationListener s) {
        connected=s;
        final int ticket=++generation;
        diag(s).edit().putLong("lastConnectedAt",System.currentTimeMillis()).putString("lastRecoveryState","connected").apply();
        // Android may finish populating active notifications shortly after connection.
        for (long delay : new long[]{1000,4000,12000}) MAIN.postDelayed(new Runnable() {
            public void run() {
                if (ticket==generation && connected==s) {
                    scan(s);
                    PaymentNotificationListener.Companion.flushPending(s.getApplicationContext());
                }
            }
        },delay);
    }
    public static void onDisconnected(final PaymentNotificationListener s) {
        if (connected!=null && connected!=s) return;
        connected=null;
        final int ticket=++generation;
        final Context context=s.getApplicationContext();
        diag(context).edit().putLong("lastDisconnectedAt",System.currentTimeMillis()).putString("lastRecoveryState","reconnecting").apply();
        for (long delay : new long[]{500,3000,10000}) MAIN.postDelayed(new Runnable() {
            public void run() { if (ticket==generation && connected==null) rebind(context); }
        },delay);
    }
    public static void onDestroyed(PaymentNotificationListener s) {
        if (connected==s) onDisconnected(s);
    }
    private static void rebind(Context c) {
        if (!accessEnabled(c)) {
            diag(c).edit().putString("lastRecoveryState","access_disabled").apply(); return;
        }
        long now=SystemClock.elapsedRealtime();
        if (lastRebind>0 && now-lastRebind<400) return;
        lastRebind=now;
        try {
            NotificationListenerService.requestRebind(new ComponentName(c,PaymentNotificationListener.class));
            diag(c).edit().putLong("lastRebindAt",System.currentTimeMillis()).apply();
        } catch (Exception e) { error(c,"rebindError",e); }
    }
    public static void rescan(final Context c) {
        final Context context=c.getApplicationContext();
        MAIN.post(new Runnable() {
            public void run() {
                diag(context).edit().putLong("lastRecoveryRequestedAt",System.currentTimeMillis()).apply();
                if (connected!=null) scan(connected); else rebind(context);
                PaymentNotificationListener.Companion.flushPending(context);
                final int ticket=generation;
                for (long delay : new long[]{1000,4000,10000}) MAIN.postDelayed(new Runnable() {
                    public void run() {
                        if (ticket!=generation) return;
                        if (connected!=null) scan(connected); else rebind(context);
                        PaymentNotificationListener.Companion.flushPending(context);
                    }
                },delay);
            }
        });
    }
    private static void addText(Set<String> texts, Object value) {
        if (value instanceof CharSequence && value.toString().trim().length()>0) texts.add(value.toString());
    }
    public static void process(PaymentNotificationListener s, StatusBarNotification sbn) {
        if (sbn==null) return;
        try {
            Set<String> allowed=s.getSharedPreferences("payment_sources",0).getStringSet("allowed",Collections.<String>emptySet());
            if ("com.google.android.apps.walletnfcrel".equals(sbn.getPackageName())) {
                diag(s).edit().putLong("walletLastSeenAt",System.currentTimeMillis())
                    .putString("walletLastResult",allowed.contains(sbn.getPackageName())?"reading":"source_disabled").apply();
            }
            // Read only the payment apps the user already enabled.
            if (!allowed.contains(sbn.getPackageName())) return;
            Notification n=sbn.getNotification();
            if (n!=null && n.extras!=null) {
                LinkedHashSet<String> texts=new LinkedHashSet<String>();
                addText(texts,n.extras.getCharSequence(Notification.EXTRA_BIG_TEXT));
                addText(texts,n.extras.getCharSequence("android.title.big"));
                addText(texts,n.tickerText);
                Parcelable[] messages=n.extras.getParcelableArray("android.messages");
                if (messages!=null) for (Parcelable message:messages)
                    if (message instanceof Bundle) addText(texts,((Bundle)message).getCharSequence("text"));
                if (!texts.isEmpty()) {
                    StringBuilder joined=new StringBuilder();
                    for (String text:texts) { if(joined.length()>0) joined.append(" "); joined.append(text); }
                    n.extras.putCharSequence(Notification.EXTRA_BIG_TEXT,joined.toString());
                }
            }
            PaymentNotificationListener.accessProcess(s,sbn);
            diag(s).edit().putLong("lastProcessedAt",System.currentTimeMillis()).apply();
        } catch (Exception e) { error(s,"notificationReadError",e); }
    }
    public static void scan(final PaymentNotificationListener s) {
        int seen=0, enabled=0, wallet=0;
        try {
            StatusBarNotification[] all=s.getActiveNotifications();
            if (all==null) throw new IllegalStateException("Listener not connected");
            Set<String> allowed=s.getSharedPreferences("payment_sources",0).getStringSet("allowed",Collections.<String>emptySet());
            for (StatusBarNotification n:all) {
                if(n==null) continue;
                seen++;
                if ("com.google.android.apps.walletnfcrel".equals(n.getPackageName())) wallet++;
                if (allowed.contains(n.getPackageName())) enabled++;
                process(s,n); // process contains its own error boundary: continue with remaining notifications.
            }
            diag(s).edit().putLong("lastScanAt",System.currentTimeMillis()).putInt("activeNotifications",seen)
                .putInt("activePaymentNotifications",enabled).putInt("activeWalletNotifications",wallet)
                .putString("lastScanError","").putString("lastRecoveryState","scanned").apply();
        } catch (Exception e) {
            error(s,"lastScanError",e);
            // A stale Binder can leave a Java instance present while Android has disconnected it.
            if(connected==s) connected=null;
            try { s.requestUnbind(); } catch(Exception ignored) {}
            onDisconnected(s);
        }
    }
    public static String diagnostics(Context c,String legacy) {
        try {
            JSONObject result=new JSONObject(legacy);
            SharedPreferences d=diag(c);
            result.put("nativeVersion",129).put("accessEnabled",accessEnabled(c)).put("listenerConnected",connected!=null);
            for(String key:new String[]{"lastScanAt","lastDisconnectedAt","lastRecoveryRequestedAt","lastRebindAt","lastProcessedAt"}) result.put(key,d.getLong(key,0));
            for(String key:new String[]{"activeNotifications","activePaymentNotifications","activeWalletNotifications"}) result.put(key,d.getInt(key,0));
            for(String key:new String[]{"lastRecoveryState","lastScanError","notificationReadError","walletLastResult"}) result.put(key,d.getString(key,""));
            return result.toString();
        } catch(Exception e) { return legacy; }
    }
}

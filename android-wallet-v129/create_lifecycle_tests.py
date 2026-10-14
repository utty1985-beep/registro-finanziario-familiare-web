from pathlib import Path
files={
'android/os/Parcelable.java':'''package android.os; public interface Parcelable {}''',
'android/os/Bundle.java':'''package android.os; import java.util.*; public class Bundle implements Parcelable {
 public Map<String,Object> values=new HashMap<String,Object>();
 public CharSequence getCharSequence(String key){return (CharSequence)values.get(key);}
 public Parcelable[] getParcelableArray(String key){return (Parcelable[])values.get(key);}
 public void putCharSequence(String key,CharSequence val){values.put(key,val);}
}''',
'android/os/Looper.java':'''package android.os; public class Looper { public static Looper getMainLooper(){return new Looper();} }''',
'android/os/SystemClock.java':'''package android.os; public class SystemClock { public static long now=1000; public static long elapsedRealtime(){return now;} }''',
'android/os/Handler.java':'''package android.os; import java.util.*; public class Handler {
 static class Job {long at; Runnable r; Job(long at,Runnable r){this.at=at;this.r=r;}}
 static List<Job> jobs=new ArrayList<Job>(); public Handler(Looper l){}
 public boolean post(Runnable r){return postDelayed(r,0);}
 public boolean postDelayed(Runnable r,long delay){jobs.add(new Job(SystemClock.now+delay,r));return true;}
 public static void advance(long delta){long target=SystemClock.now+delta;int guard=0;
  while(true){Job first=null;for(Job j:jobs)if(j.at<=target&&(first==null||j.at<first.at))first=j;
   if(first==null)break;if(++guard>1000)throw new AssertionError("runaway retry");jobs.remove(first);SystemClock.now=first.at;first.r.run();}
  SystemClock.now=target;
 }
 public static void reset(){jobs.clear();SystemClock.now=1000;}
}''',
'android/content/SharedPreferences.java':'''package android.content; import java.util.*; public class SharedPreferences {
 Map<String,Object> values=new HashMap<String,Object>();
 public String getString(String k,String d){return values.containsKey(k)?(String)values.get(k):d;}
 public long getLong(String k,long d){return values.containsKey(k)?(Long)values.get(k):d;}
 public int getInt(String k,int d){return values.containsKey(k)?(Integer)values.get(k):d;}
 @SuppressWarnings("unchecked") public Set<String> getStringSet(String k,Set<String>d){return values.containsKey(k)?(Set<String>)values.get(k):d;}
 public Editor edit(){return new Editor();} public class Editor {
 public Editor putString(String k,String v){values.put(k,v);return this;}
 public Editor putLong(String k,long v){values.put(k,v);return this;}
 public Editor putInt(String k,int v){values.put(k,v);return this;}
 public Editor putStringSet(String k,Set<String>v){values.put(k,v);return this;}
 public void apply(){} }
}''',
'android/content/ContentResolver.java':'''package android.content; public class ContentResolver {}''',
'android/content/Context.java':'''package android.content; import java.util.*; public class Context {
 private Map<String,SharedPreferences> all=new HashMap<String,SharedPreferences>();
 public SharedPreferences getSharedPreferences(String k,int mode){if(!all.containsKey(k))all.put(k,new SharedPreferences());return all.get(k);}
 public Context getApplicationContext(){return this;} public ContentResolver getContentResolver(){return new ContentResolver();}
}''',
'android/content/ComponentName.java':'''package android.content; public class ComponentName {
 public ComponentName(Context c,Class<?> cls){} public static ComponentName unflattenFromString(String s){return "enabled".equals(s)?new ComponentName(null,null):null;}
 public boolean equals(Object o){return o instanceof ComponentName;} public int hashCode(){return 1;}
}''',
'android/provider/Settings.java':'''package android.provider; import android.content.*; public class Settings {public static class Secure {
 public static String value="enabled"; public static String getString(ContentResolver r,String k){return value;}
}}''',
'android/app/Notification.java':'''package android.app; import android.os.*; public class Notification {
 public static final String EXTRA_BIG_TEXT="android.bigText"; public Bundle extras=new Bundle();public CharSequence tickerText;
}''',
'android/service/notification/StatusBarNotification.java':'''package android.service.notification; import android.app.*;
 public class StatusBarNotification {String pkg;Notification n; public StatusBarNotification(String p,Notification x){pkg=p;n=x;}
 public String getPackageName(){return pkg;} public Notification getNotification(){return n;}}
''',
'android/service/notification/NotificationListenerService.java':'''package android.service.notification;import android.content.*;
 public class NotificationListenerService extends Context {public static int rebinds;public int unbinds;
 public StatusBarNotification[] active=new StatusBarNotification[0]; public boolean fail;
 public StatusBarNotification[] getActiveNotifications(){if(fail)throw new IllegalStateException("stale binder");return active;}
 public void requestUnbind(){unbinds++;} public static void requestRebind(ComponentName c){rebinds++;}
}''',
'it/registrofamiliare/app/PaymentNotificationListener.java':'''package it.registrofamiliare.app;
 import android.service.notification.*; import android.content.*;
 public class PaymentNotificationListener extends NotificationListenerService {
  public static Companion Companion=new Companion();public static int processed;
  public static void accessProcess(PaymentNotificationListener s,StatusBarNotification n){processed++;}
  public static class Companion {public int flushes;public void flushPending(Context c){flushes++;}}
}''',
'WalletRecoveryTest.java':'''import it.registrofamiliare.app.*;import android.app.*;import android.os.*;import android.content.*;
import android.provider.*;import android.service.notification.*;import java.util.*;
public class WalletRecoveryTest {
 static int tests;static final String WALLET="com.google.android.apps.walletnfcrel";
 static void check(boolean ok,String why){tests++;if(!ok)throw new AssertionError(why);}
 static PaymentNotificationListener service(){PaymentNotificationListener s=new PaymentNotificationListener();
  s.getSharedPreferences("payment_sources",0).edit().putStringSet("allowed",new HashSet<String>(Arrays.asList(WALLET))).apply();return s;}
 public static void main(String[] args){
  PaymentNotificationListener s=service();Notification bad=new Notification();bad.extras.values.put("android.bigText",Integer.valueOf(5));
  Notification good=new Notification();good.extras.putCharSequence("android.bigText","Pagamento 1,99 €");
  s.active=new StatusBarNotification[]{new StatusBarNotification(WALLET,bad),new StatusBarNotification(WALLET,good)};
  WalletRecovery.onConnected(s);WalletRecovery.scan(s);
  check(PaymentNotificationListener.processed==1,"malformed notification must not block following Wallet payment");
  check(s.getSharedPreferences("notification_diagnostics",0).getInt("activeWalletNotifications",0)==2,"scan counts all Wallet notifications");
  check(s.getSharedPreferences("notification_diagnostics",0).getString("notificationReadError","").equals("ClassCastException"),"per-notification failure recorded");
  Handler.advance(12000);check(PaymentNotificationListener.processed==4,"three delayed scans after connection");
  int before=NotificationListenerService.rebinds;
  WalletRecovery.onDisconnected(s);Handler.advance(11000);
  check(NotificationListenerService.rebinds==before+3,"three bounded automatic rebinds after disconnect");
  WalletRecovery.onConnected(s);before=NotificationListenerService.rebinds;Handler.advance(13000);
  check(NotificationListenerService.rebinds==before,"connection cancels stale reconnect attempts");
  Settings.Secure.value=null;WalletRecovery.onDisconnected(s);Handler.advance(11000);
  check(NotificationListenerService.rebinds==before,"revoked notification access is respected");
  Settings.Secure.value="enabled";WalletRecovery.onConnected(s);s.fail=true;WalletRecovery.scan(s);
  check(s.unbinds==1,"stale binder unbound");before=NotificationListenerService.rebinds;Handler.advance(11000);
  check(NotificationListenerService.rebinds==before+3,"stale binder gets bounded reconnect attempts");
  s.fail=false;s.active=new StatusBarNotification[]{new StatusBarNotification(WALLET,good)};WalletRecovery.onConnected(s);
  s.getSharedPreferences("payment_sources",0).edit().putStringSet("allowed",Collections.<String>emptySet()).apply();
  before=PaymentNotificationListener.processed;WalletRecovery.scan(s);
  check(PaymentNotificationListener.processed==before,"disabled payment source stays disabled");
  check(!WalletRecovery.accessEnabled(new Context())==false,"actual permission lookup enabled");
  String diagnostic=WalletRecovery.diagnostics(s,"{}");
  check(diagnostic.contains("nativeVersion")&&diagnostic.contains("129"),"diagnostics identify native version");
  System.out.println("PASS "+tests+" lifecycle/scan regressions");
 }
}'''
}
for name,content in files.items():
 p=Path('lifecycle-tests')/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(content)

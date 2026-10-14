from pathlib import Path
import re, shutil

root=Path('patched/smali/it/registrofamiliare/app')
listener=root/'PaymentNotificationListener.smali'
s=listener.read_text()
def replace_method(text,signature,body):
    pattern=r'(?m)^\.method '+re.escape(signature)+r'\n.*?^\.end method'
    text,n=re.subn(pattern,'.method '+signature+'\n'+body+'\n.end method',text,count=1,flags=re.S)
    assert n==1,signature
    return text
s=replace_method(s,'private final extractAmount(Ljava/lang/String;)Ljava/lang/Double;', '''    .locals 1
    invoke-static {p1}, Lit/registrofamiliare/app/WalletAmountParser;->parse(Ljava/lang/String;)Ljava/lang/Double;
    move-result-object v0
    return-object v0''')
s=replace_method(s,'private final scanActivePayments()V','''    .locals 0
    invoke-static {p0}, Lit/registrofamiliare/app/WalletRecovery;->scan(Lit/registrofamiliare/app/PaymentNotificationListener;)V
    return-void''')
s=replace_method(s,'public onNotificationPosted(Landroid/service/notification/StatusBarNotification;)V','''    .locals 0
    invoke-static {p0, p1}, Lit/registrofamiliare/app/WalletRecovery;->process(Lit/registrofamiliare/app/PaymentNotificationListener;Landroid/service/notification/StatusBarNotification;)V
    return-void''')
needle='    invoke-direct {p0}, Lit/registrofamiliare/app/PaymentNotificationListener;->scanActivePayments()V'
start=s.index('.method public onListenerConnected()V')
head,tail=s[:start],s[start:]
assert tail.count(needle)==1
s=head+tail.replace(needle,'    invoke-static {p0}, Lit/registrofamiliare/app/WalletRecovery;->onConnected(Lit/registrofamiliare/app/PaymentNotificationListener;)V\n\n'+needle,1)
needle='    invoke-super {p0}, Landroid/service/notification/NotificationListenerService;->onListenerDisconnected()V'
assert s.count(needle)==1
s=s.replace(needle,needle+'\n\n    invoke-static {p0}, Lit/registrofamiliare/app/WalletRecovery;->onDisconnected(Lit/registrofamiliare/app/PaymentNotificationListener;)V')
needle='    invoke-super {p0}, Landroid/service/notification/NotificationListenerService;->onDestroy()V'
assert s.count(needle)==1
s=s.replace(needle,'    invoke-static {p0}, Lit/registrofamiliare/app/WalletRecovery;->onDestroyed(Lit/registrofamiliare/app/PaymentNotificationListener;)V\n\n'+needle)
s+='''
.method public static accessProcess(Lit/registrofamiliare/app/PaymentNotificationListener;Landroid/service/notification/StatusBarNotification;)V
    .locals 0
    invoke-direct {p0, p1}, Lit/registrofamiliare/app/PaymentNotificationListener;->processNotification(Landroid/service/notification/StatusBarNotification;)V
    return-void
.end method
'''
listener.write_text(s)
companion=root/'PaymentNotificationListener$Companion.smali'
s=companion.read_text()
s=replace_method(s,'public final rescanActive(Landroid/content/Context;)V','''    .locals 0
    invoke-static {p1}, Lit/registrofamiliare/app/WalletRecovery;->rescan(Landroid/content/Context;)V
    return-void''')
s=s.replace('.method public final diagnostics(Landroid/content/Context;)Ljava/lang/String;', '.method private final diagnosticsLegacy(Landroid/content/Context;)Ljava/lang/String;')
s+='''
.method public final diagnostics(Landroid/content/Context;)Ljava/lang/String;
    .locals 1
    invoke-direct {p0, p1}, Lit/registrofamiliare/app/PaymentNotificationListener$Companion;->diagnosticsLegacy(Landroid/content/Context;)Ljava/lang/String;
    move-result-object v0
    invoke-static {p1, v0}, Lit/registrofamiliare/app/WalletRecovery;->diagnostics(Landroid/content/Context;Ljava/lang/String;)Ljava/lang/String;
    move-result-object v0
    return-object v0
.end method
'''
companion.write_text(s)
for p in Path('helper-decoded/smali/it/registrofamiliare/app').glob('*.smali'):
    assert p.name.startswith(('WalletRecovery','WalletAmountParser'))
    shutil.copy2(p,root/p.name)
config=Path('patched/apktool.yml')
s=config.read_text().replace('versionCode: 121','versionCode: 129').replace('versionName: 3.5.1','versionName: 3.5.9')
config.write_text(s)
print('Patched lifecycle, per-notification isolation, money parser, recovery and diagnostics; queue ABI preserved.')

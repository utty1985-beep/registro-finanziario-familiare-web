const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const source=html.slice(html.indexOf('async function recoverWalletNotices(){'),html.indexOf('\nasync function showPairingRequests()'));
function setup(overrides={}){
 let now=100000,scans=0,sends=0,inbox=0;const status={textContent:''},button={disabled:false};
 const diagnostic=()=>({nativeVersion:129,accessEnabled:true,listenerConnected:now>=104000,lastScanAt:now>=104000?now:0,walletEnabled:true,activeWalletNotifications:1,lastQueuedAt:now>=104000?104000:0,...overrides});
 const bridge={requestPaymentListenerRescan(){scans++},notificationDiagnostics:()=>JSON.stringify(diagnostic()),queuedPaymentCount:()=>0};
 const c={window:{RegistroAndroid:bridge},$:sel=>sel==='#sendStatus'?status:button,Date:{now:()=>now},setTimeout:r=>{now+=1000;r()},sendAndroidPayments:async()=>{sends++},fetchInbox:async()=>{inbox++},updateNotificationState(){}};
 vm.createContext(c);vm.runInContext(source,c);
 return {c,status,button,run:()=>vm.runInContext('recoverWalletNotices()',c),stats:()=>({now,scans,sends,inbox})};
}
test('waits for native reconnection and reports recovered payment despite empty sent queue',async()=>{
 const s=setup();await s.run();assert.equal(s.stats().sends,4);assert.equal(s.stats().scans,1);assert.equal(s.stats().inbox,1);
 assert.match(s.status.textContent,/Pagamento recuperato e inviato/);assert.equal(s.button.disabled,false);
});
test('old APK is distinguished from empty payment queue',async()=>{const s=setup({nativeVersion:121,lastScanAt:0});await s.run();assert.match(s.status.textContent,/APK V129/);assert.equal(s.button.disabled,false)});
test('disconnected reader does not report successful zero-item scan',async()=>{const s=setup({listenerConnected:false});await s.run();assert.equal(s.stats().sends,12);assert.match(s.status.textContent,/non si è ancora collegato/)});
test('visible Wallet notification with parse failure is distinguished from no Wallet notifications',async()=>{
 const s=setup({lastParseFailedAt:104000,lastQueuedAt:0});await s.run();assert.match(s.status.textContent,/importo non è stato riconosciuto/);
 const z=setup({activeWalletNotifications:0});await z.run();assert.match(z.status.textContent,/non ha restituito notifiche Wallet/);
});
test('manual recovery respects Android access and selected sources',async()=>{
 const s=setup({accessEnabled:false});await s.run();assert.match(s.status.textContent,/non concede/);
 const d=setup({walletEnabled:false});await d.run();assert.match(d.status.textContent,/non è selezionato/);
});
test('native exception restores recover button',async()=>{const s=setup();s.c.window.RegistroAndroid.requestPaymentListenerRescan=()=>{throw Error('binder')};await s.run();assert.match(s.status.textContent,/non completato/);assert.equal(s.button.disabled,false)});

const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const permissions=html.slice(html.indexOf('function applyPermissions(){'),html.indexOf('async function resolveFamily(){'));
test('viewer can recover Wallet after permissions refresh while financial inputs remain locked',()=>{
 const nodes={}; const get=id=>nodes[id]??=( {id,disabled:true,hidden:false,classList:{contains:()=>false},closest:()=>null});
 const ctx={familyRole:'viewer',window:{RegistroAndroid:{}},$:s=>get(s.slice(1)),document:{querySelectorAll:()=>['recoverWalletNotices','sendNotices','addIncome','foodBudget'].map(get)}};
 vm.createContext(ctx);vm.runInContext(permissions+';applyPermissions();applyPermissions()',ctx);
 assert.equal(get('recoverWalletNotices').disabled,false);assert.equal(get('sendNotices').disabled,false);assert.equal(get('addIncome').disabled,true);assert.equal(get('foodBudget').disabled,true);
 ctx.window.RegistroAndroid=null;vm.runInContext('applyPermissions()',ctx);assert.equal(get('recoverWalletNotices').disabled,true);
});
test('manual import explains empty queue; automatic import does not erase diagnostics',async()=>{
 const status={textContent:'diagnostic'},ctx={familyRole:'viewer',familyId:'family',RegistroAndroid:{peekPendingPayments:()=> '[]'},$:()=>status,updateNotificationState(){},console};ctx.window=ctx;
 vm.createContext(ctx);vm.runInContext(html.slice(html.indexOf('let androidSendBusy=false;'),html.indexOf('window.sendAndroidPayments=')),ctx);
 await vm.runInContext('sendAndroidPayments()',ctx);assert.equal(status.textContent,'diagnostic');
 await vm.runInContext('sendAndroidPayments(true)',ctx);assert.match(status.textContent,/Nessun pagamento in coda/);
 ctx.RegistroAndroid.peekPendingPayments=()=>'{';await vm.runInContext('sendAndroidPayments(true)',ctx);assert.match(status.textContent,/Impossibile leggere/);
});

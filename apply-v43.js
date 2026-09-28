function applyV43(text){
 const must=(cond,msg)=>{if(!cond)throw new Error('V43: '+msg)};

 text=text.replace('<title>Registro Finanziario Familiare V42</title>','<title>Registro Finanziario Familiare V43</title>');
 text=text.replace('Telefono secondario: puoi vedere il registro e inviare pagamenti. Sul telefono principale arriveranno da confermare.','Telefono secondario: puoi vedere il registro, inviare pagamenti e confermare o rifiutare le notifiche condivise. Le modifiche alle notifiche si sincronizzano su tutti i telefoni collegati.');

 const permissionsSource=(function applyPermissions(){
  const viewer=familyRole==='viewer';$('#viewerBanner').hidden=!viewer;
  $('#pairingCard').hidden=true;$('#sentinelBar').hidden=!(familyRole&&window.RegistroAndroid);
  document.querySelectorAll('#p1 input:not(#monthPick),#p2 input,#p1 button,#p2 button,#p2 select').forEach(el=>{
   if(['prevM','nextM','prevM2','nextM2','toDaily','toMonth','toBoard','toBoard2','authorizeNotices','sourcesButton','sendNotices'].includes(el.id))return;
   if(el.closest&&(el.closest('.entryForm')||el.closest('#pendingList .notice')))return;
   el.disabled=viewer;
  });
  if($('#boardText'))$('#boardText').disabled=false;if($('#boardAdd'))$('#boardAdd').disabled=false;
 }).toString();
 must(/function applyPermissions\(\)\{[\s\S]*?\n\}\nasync function resolveFamily/.test(text),'permessi telefono secondario');
 text=text.replace(/function applyPermissions\(\)\{[\s\S]*?\n\}\nasync function resolveFamily/,permissionsSource+'\nasync function resolveFamily');

 const pendingSource=(function renderPending(){
  let p=data().daily.pending,b=$('#badge'),h=$('#pendingList');b.hidden=!p.length;b.textContent=p.length;h.innerHTML=p.length?'':'<div class="hint">Nessuna notifica da confermare.</div>';
  p.forEach((n,i)=>{
   let x=document.createElement('div');x.className='notice';
   const opts=[['Mangiare','food'],...customCols().filter(c=>(c.name||'').trim()).map(c=>[c.name.trim(),colKey(c)]),['Varie','varie']].map(([name,key])=>`<option value="${escapeNotice(key)}">${escapeNotice(name)}</option>`).join('');
   const sgn=noticeSign(n);
   x.innerHTML=`<b>${sgn} € ${euro(n.amount)}</b> ${escapeNotice(cleanNoticeDesc(n.desc))}<br><select>${opts}</select> <input type="number" min="1" max="31" value="${validStart()}" style="width:65px"><div class="pendingActions"><button class="confirmPay">Conferma</button><button class="rejectPay">Non confermare</button></div>`;
   const suggested=customCols().find(c=>(c.name||'').toLowerCase()===(n.category||'').toLowerCase());x.querySelector('select').value=suggested?colKey(suggested):(n.category==='Mangiare'?'food':'varie');if(n.day)x.querySelector('input').value=n.day;
   x.querySelector('.confirmPay').onclick=async()=>{
    if(!['owner','viewer'].includes(familyRole))return;
    const cat=x.querySelector('select').value||'varie';const [yy,mm]=ymParts(),last=new Date(yy,mm,0).getDate();const day=+x.querySelector('input').value;if(!Number.isInteger(day)||day<1||day>last)return;
    const amount=Number(n.amount);if(!Number.isFinite(amount)||amount<=0)return;x.querySelectorAll('button').forEach(btn=>btn.disabled=true);
    if(!n.inboxId){
     if(familyRole!=='owner'){x.querySelectorAll('button').forEach(btn=>btn.disabled=false);return}
     const current=data();current.daily.entries||(current.daily.entries=[]);current.daily.entries.push({id:'n_'+(n.id||Date.now()+'_'+i),day,category:cat,amount:(sgn==='-'?-1:1)*amount,desc:cleanNoticeDesc(n.desc)||'Notifica'});p.splice(i,1);save();renderDaily();return;
    }
    try{
     if(familyRole==='owner'){
      clearTimeout(cloudTimer);
      if(!await saveCloud())throw new Error('Salvataggio del registro non riuscito');
     }
     const {error}=await sb.rpc('rff_confirm_payment_shared',{...deviceArgs(),p_inbox_id:n.inboxId,p_day:day,p_category:cat});
     if(error)throw error;
     await loadCloud();
     await fetchInbox(true);
     if($('#p2').classList.contains('active'))renderDaily();
    }catch(e){console.log('Conferma condivisa:',e);alert('Conferma non riuscita. Controlla Internet e riprova.');x.querySelectorAll('button').forEach(btn=>btn.disabled=false)}
   };
   x.querySelector('.rejectPay').onclick=async()=>{
    if(!['owner','viewer'].includes(familyRole))return;if(!confirm('Non confermare questa richiesta? Verrà eliminata senza inserirla nelle spese.'))return;x.querySelectorAll('button').forEach(btn=>btn.disabled=true);
    if(!n.inboxId){if(familyRole!=='owner'){x.querySelectorAll('button').forEach(btn=>btn.disabled=false);return}p.splice(i,1);save();renderPending();return}
    try{
     if(familyRole==='owner'){
      clearTimeout(cloudTimer);
      if(!await saveCloud())throw new Error('Salvataggio del registro non riuscito');
     }
     const {error}=await sb.rpc('rff_reject_payment_shared',{...deviceArgs(),p_inbox_id:n.inboxId});
     if(error)throw error;
     await loadCloud();
     await fetchInbox(true);
     if($('#p2').classList.contains('active'))renderDaily();
    }catch(e){console.log('Rifiuto condiviso:',e);alert('Rifiuto non riuscito. Controlla Internet e riprova.');x.querySelectorAll('button').forEach(btn=>btn.disabled=false)}
   };
   h.appendChild(x)
  });applyPermissions()
 }).toString();
 must(/function renderPending\(\)\{[\s\S]*?\n\}\n\$\('#monthPick'\)\.onchange/.test(text),'pannello notifiche');
 text=text.replace(/function renderPending\(\)\{[\s\S]*?\n\}\n\$\('#monthPick'\)\.onchange/,pendingSource+"\n$('#monthPick').onchange");

 const inboxSource=(async function fetchInbox(){
  if(inboxBusy||!['owner','viewer'].includes(familyRole)||!familyId)return;inboxBusy=true;
  try{
   const {data:rows,error}=await sb.rpc('rff_pending_payments_shared',deviceArgs());
   if(error)throw error;lastInboxSync=Date.now();
   const list=Array.isArray(rows)?rows:[];const remoteIds=new Set(list.map(r=>String(r.id)));let stale=false;
   for(const [k,m] of Object.entries(db)){
    if(!/^\d{4}-\d{2}$/.test(k)||!m?.daily||!Array.isArray(m.daily.pending))continue;
    if(m.daily.pending.some(n=>n?.inboxId&&!remoteIds.has(String(n.inboxId)))){stale=true;break}
   }
   if(stale)await loadCloud();
   let changed=false;
   for(const row of list){
    const dt=new Date(row.occurred_at);if(!Number.isFinite(dt.getTime()))continue;
    const key=dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0');
    const target=db[key]||(db[key]=defaultMonth());const daily=target.daily||(target.daily=defaultMonth().daily);
    if((daily.confirmedInboxIds||[]).includes(row.id))continue;
    if(!daily.pending.some(n=>String(n.inboxId||'')===String(row.id))){
     const rawDesc=String(row.description||'');const sign=rawDesc.startsWith('__RFF_SIGN_POS__')?'+':'-';
     daily.pending.push({inboxId:row.id,id:'i_'+row.id,amount:Number(row.amount),desc:rawDesc,sign,category:row.suggested_category,day:dt.getDate()});changed=true;
    }
   }
   if(changed){try{localStorage.setItem('rff_verified',JSON.stringify(db))}catch(e){};if($('#p2').classList.contains('active'))renderDaily();else renderPending()}
  }catch(e){console.log('Pagamenti in attesa condivisi:',e)}finally{inboxBusy=false}
 }).toString().replace(/^async\s+function/,'async function');
 must(/async function fetchInbox\(\)\{[\s\S]*?\n\}\nasync function sendAndroidPayments/.test(text),'sincronizzazione coda');
 text=text.replace(/async function fetchInbox\(\)\{[\s\S]*?\n\}\nasync function sendAndroidPayments/,inboxSource+'\nasync function sendAndroidPayments');

 text=text.replace("if(sent){$('#sendStatus').textContent=sent+' pagamento/i inviato/i. Compariranno tra le notifiche da confermare sul telefono principale.';if(familyRole==='owner')await fetchInbox(true)}",
                   "if(sent){$('#sendStatus').textContent=sent+' pagamento/i inviato/i. Compariranno tra le notifiche da confermare su tutti i telefoni collegati.';await fetchInbox(true)}");

 text=text.replace("btn.textContent='✓ Inviato al telefono principale';",
                   "await fetchInbox(true);\n     btn.textContent='✓ Inviato al registro condiviso';");

 const oldEnter="if(familyRole==='owner'){await sendAndroidPayments();await fetchInbox(true);await showPairingRequests()}else await sendAndroidPayments();";
 const newEnter="await sendAndroidPayments();await fetchInbox(true);if(familyRole==='owner')await showPairingRequests();";
 must(text.includes(oldEnter),'avvio sincronizzazione');
 text=text.replace(oldEnter,newEnter);

 const oldTimer="roleTimer=setInterval(()=>{if(document.hidden)return;if(familyRole==='owner'){sendAndroidPayments();fetchInbox();showPairingRequests();syncBoard(true)}else if(familyRole==='viewer'){loadCloud().catch(e=>console.log('Aggiornamento:',e));sendAndroidPayments();syncBoard(true)}},4000);";
 const newTimer="roleTimer=setInterval(()=>{if(document.hidden)return;if(familyRole==='owner'){sendAndroidPayments();fetchInbox();showPairingRequests();syncBoard(true)}else if(familyRole==='viewer'){loadCloud().catch(e=>console.log('Aggiornamento:',e));sendAndroidPayments();fetchInbox();syncBoard(true)}},4000);";
 must(text.includes(oldTimer),'timer sincronizzazione');
 text=text.replace(oldTimer,newTimer);

 text=text.replace("document.addEventListener('visibilitychange',()=>{if(!document.hidden&&familyRole==='owner')fetchInbox(true)},{passive:true});",
                   "document.addEventListener('visibilitychange',()=>{if(!document.hidden&&['owner','viewer'].includes(familyRole))fetchInbox(true)},{passive:true});");
 text=text.replace("window.addEventListener('focus',()=>{if(familyRole==='owner')fetchInbox(true)},{passive:true});",
                   "window.addEventListener('focus',()=>{if(['owner','viewer'].includes(familyRole))fetchInbox(true)},{passive:true});");
 text=text.replace("window.addEventListener('pageshow',()=>{if(familyRole==='owner')fetchInbox(true)},{passive:true});",
                   "window.addEventListener('pageshow',()=>{if(['owner','viewer'].includes(familyRole))fetchInbox(true)},{passive:true});");

 text=text.replace("service-worker.js?v=20260928-v42","service-worker.js?v=20260928-v43");
 text=text.replace('<!-- Registro Finanziario Familiare V42 - versione consolidata -->','<!-- Registro Finanziario Familiare V43 - notifiche condivise tra telefoni -->');
 return text;
}

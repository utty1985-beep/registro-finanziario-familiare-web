function applyV40(text){
 const must=(cond,msg)=>{if(!cond)throw new Error('V40: '+msg)};
 text=text.replace('<title>Registro Finanziario Familiare V36</title>','<title>Registro Finanziario Familiare V40</title>');

 const css=`.pendingDrop,.historyDrop{position:relative}
.pendingDrop>summary,.historyDrop>summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:900;color:var(--b);padding:2px 0}
.pendingDrop>summary::-webkit-details-marker,.historyDrop>summary::-webkit-details-marker{display:none}
.pendingDrop>summary::after,.historyDrop>summary::after{content:'▼';font-size:12px;transition:transform .2s}
.pendingDrop[open]>summary::after,.historyDrop[open]>summary::after{transform:rotate(180deg)}
.pendingDrop .badge{position:static;display:inline-grid;margin-left:auto}
.pendingActions{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.pendingActions button{flex:1;min-width:120px}
.pendingActions .rejectPay{background:#c62828;color:#fff;border-color:#c62828}
.historyDrop{margin-top:8px;border-top:1px solid #e2e8f0;padding-top:8px}.historyDrop #entryHistory{margin-top:8px}`;
 must(text.includes('</style>'),'CSS');
 text=text.replace('</style>',css+'\\n</style>');

 const oldPanels=` <button id="addEntry" class="primary">+ Aggiungi pagamento</button></div><div id="entryHistory"></div></div>
 <div class="card pending"><span class="badge" id="badge" hidden>0</span><h2>Notifiche da confermare</h2><div class="pendingList" id="pendingList"><div class="hint">Nessuna notifica da confermare.</div></div><button id="testNotice">+ Simula notifica</button></div>`;
 const newPanels=` <button id="addEntry" class="primary">+ Aggiungi pagamento</button></div>
 <details class="historyDrop"><summary>Pagamenti inseriti <span id="entryHistoryCount"></span></summary><div id="entryHistory"></div></details></div>
 <details class="card pending pendingDrop" id="pendingDrop"><summary><span>Pagamenti e richieste da confermare</span><span class="badge" id="badge" hidden>0</span></summary><div class="pendingList" id="pendingList"><div class="hint">Nessuna notifica da confermare.</div></div><button id="testNotice">+ Simula notifica</button></details>`;
 must(text.includes(oldPanels),'pannelli');
 text=text.replace(oldPanels,newPanels);

 const perm=`function applyPermissions(){
 const viewer=familyRole==='viewer';$('#viewerBanner').hidden=!viewer;
 $('#pairingCard').hidden=true;$('#sentinelBar').hidden=!(familyRole&&window.RegistroAndroid);
 document.querySelectorAll('#p1 input:not(#monthPick),#p2 input,#p1 button,#p2 button,#p2 select').forEach(el=>{
  if(['prevM','nextM','prevM2','nextM2','toDaily','toMonth','authorizeNotices','sendNotices'].includes(el.id))return;
  if(el.closest&&el.closest('.entryForm'))return;
  el.disabled=viewer;
 });
 if($('#boardText'))$('#boardText').disabled=false;if($('#boardAdd'))$('#boardAdd').disabled=false;
}
async function resolveFamily`;
 must(/function applyPermissions\(\)\{[\s\S]*?\n\}\nasync function resolveFamily/.test(text),'permessi');
 text=text.replace(/function applyPermissions\(\)\{[\s\S]*?\n\}\nasync function resolveFamily/,perm);

 text=text.replace("$('#balance').textContent=euro(signed(d.planned,'planned')+signed(d.moves,'moves')+signed(d.rates,'rates'))}",
                   "$('#balance').textContent=euro(inc+signed(d.planned,'planned')+signed(d.moves,'moves')+signed(d.rates,'rates'))}");

 text=text.replace("const desc='Inserito dal secondo telefono · '+category+' · '+new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});",
                   "const signMarker=sign==='-'?'__RFF_SIGN_NEG__':'__RFF_SIGN_POS__';\n     const desc=signMarker+' Inserito dal secondo telefono · '+categoryName(category)+' · '+new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});");

 const hist=`function renderEntryHistory(){
 const host=$('#entryHistory'),count=$('#entryHistoryCount');host.innerHTML='';
 const entries=data().daily.entries||[];if(count)count.textContent=entries.length?'('+entries.length+')':'';
 if(!entries.length){host.innerHTML='<p class="hint">Nessun pagamento inserito.</p>';return}
 entries.slice().reverse().forEach(entry=>{
  const line=document.createElement('div');line.className='entryLine';
  const span=document.createElement('span');span.textContent=\`${'${entry.day}'} ${'${title()}'} · ${'${categoryName(entry.category)}'} · ${"${entry.amount<0?'−':'+'}"} € ${'${euro(Math.abs(entry.amount))}'}\`;
  const btn=document.createElement('button');btn.textContent='−';btn.title='Rimuovi questo pagamento';btn.onclick=()=>{if(familyRole!=='owner')return;data().daily.entries=data().daily.entries.filter(x=>x.id!==entry.id);save();renderDaily()};
  line.append(span,btn);host.appendChild(line)
 });applyPermissions();
}
function escapeNotice`;
 must(/function renderEntryHistory\(\)\{[\s\S]*?\n\}\nfunction escapeNotice/.test(text),'storico');
 text=text.replace(/function renderEntryHistory\(\)\{[\s\S]*?\n\}\nfunction escapeNotice/,hist);

 const pending=`function noticeSign(n){if((n&&n.sign==='+')||(n&&n.sign==='-'))return n.sign;const d=String(n?.desc||'');return d.startsWith('__RFF_SIGN_POS__')?'+':'-'}
function cleanNoticeDesc(s){return String(s||'').replace(/^__RFF_SIGN_(?:NEG|POS)__\\s*/,'')}
function renderPending(){
 let p=data().daily.pending,b=$('#badge'),h=$('#pendingList');b.hidden=!p.length;b.textContent=p.length;h.innerHTML=p.length?'':'<div class="hint">Nessuna notifica da confermare.</div>';
 p.forEach((n,i)=>{
  let x=document.createElement('div');x.className='notice';
  const opts=[['Mangiare','food'],...customCols().filter(c=>(c.name||'').trim()).map(c=>[c.name.trim(),colKey(c)]),['Varie','varie']].map(([name,key])=>\`<option value="${'${escapeNotice(key)}'}">${'${escapeNotice(name)}'}</option>\`).join('');
  const sgn=noticeSign(n);
  x.innerHTML=\`<b>${'${sgn}'} € ${'${euro(n.amount)}'}</b> ${'${escapeNotice(cleanNoticeDesc(n.desc))}'}<br><select>${'${opts}'}</select> <input type="number" min="1" max="31" value="${'${validStart()}'}" style="width:65px"><div class="pendingActions"><button class="confirmPay">Conferma</button><button class="rejectPay">Non confermare</button></div>\`;
  const suggested=customCols().find(c=>(c.name||'').toLowerCase()===(n.category||'').toLowerCase());x.querySelector('select').value=suggested?colKey(suggested):(n.category==='Mangiare'?'food':'varie');if(n.day)x.querySelector('input').value=n.day;
  x.querySelector('.confirmPay').onclick=async()=>{
   if(familyRole!=='owner')return;const cat=x.querySelector('select').value||'varie';const [yy,mm]=ymParts(),last=new Date(yy,mm,0).getDate();const day=+x.querySelector('input').value;if(!Number.isInteger(day)||day<1||day>last)return;
   const amount=Number(n.amount);if(!Number.isFinite(amount)||amount<=0)return;x.querySelectorAll('button').forEach(btn=>btn.disabled=true);
   const current=data();current.daily.entries||(current.daily.entries=[]);const entry={id:'n_'+(n.id||Date.now()+'_'+i),day,category:cat,amount:(sgn==='-'?-1:1)*amount,desc:cleanNoticeDesc(n.desc)||'Notifica'};
   const confirmed=current.daily.confirmedInboxIds||(current.daily.confirmedInboxIds=[]);current.daily.entries.push(entry);p.splice(i,1);if(n.inboxId&&!confirmed.includes(n.inboxId))confirmed.push(n.inboxId);save();
   if(n.inboxId){clearTimeout(cloudTimer);const saved=await sb.rpc('rff_confirm_payment',{...deviceArgs(),p_inbox_id:n.inboxId,p_data:db});if(saved.error){current.daily.entries=current.daily.entries.filter(v=>v!==entry);p.splice(i,0,n);current.daily.confirmedInboxIds=confirmed.filter(id=>id!==n.inboxId);save();renderDaily();alert('Salvataggio online non riuscito. Riprova.');return}}
   renderDaily();
  };
  x.querySelector('.rejectPay').onclick=async()=>{
   if(familyRole!=='owner')return;if(!confirm('Non confermare questa richiesta? Verrà eliminata senza inserirla nelle spese.'))return;x.querySelectorAll('button').forEach(btn=>btn.disabled=true);
   if(n.inboxId){const {error}=await sb.rpc('rff_reject_payment',{...deviceArgs(),p_inbox_id:n.inboxId});if(error){alert('Rifiuto non riuscito. Riprova.');x.querySelectorAll('button').forEach(btn=>btn.disabled=false);return}}
   p.splice(i,1);save();renderPending();
  };
  h.appendChild(x)
 });applyPermissions()
}
$('#monthPick').onchange`;
 must(/function renderPending\(\)\{[\s\S]*?\}\n\$\('#monthPick'\)\.onchange/.test(text),'richieste');
 text=text.replace(/function renderPending\(\)\{[\s\S]*?\}\n\$\('#monthPick'\)\.onchange/,pending);

 text=text.replace("daily.pending.push({inboxId:row.id,id:'i_'+row.id,amount:Number(row.amount),desc:row.description,category:row.suggested_category,day:dt.getDate()});changed=true;",
                   "const rawDesc=String(row.description||'');const sign=rawDesc.startsWith('__RFF_SIGN_POS__')?'+':'-';\n    daily.pending.push({inboxId:row.id,id:'i_'+row.id,amount:Number(row.amount),desc:rawDesc,sign,category:row.suggested_category,day:dt.getDate()});changed=true;");

 const rejectDevice=`const reject=document.createElement('button');reject.textContent='Rifiuta';reject.style.marginLeft='8px';reject.style.background='#c62828';reject.style.color='#fff';reject.style.borderColor='#c62828';
  reject.onclick=async()=>{if(!confirm('Rifiutare questa richiesta di autorizzazione?'))return;button.disabled=true;reject.disabled=true;const {error}=await sb.rpc('rff_reject_device',{...deviceArgs(),p_candidate_id:request.id});if(error){alert('Rifiuto non riuscito. Riprova.');button.disabled=false;reject.disabled=false;return}showPairingRequests()};
  line.append(label,button,reject);list.appendChild(line);`;
 must(text.includes('line.append(label,button);list.appendChild(line);'),'rifiuto telefono');
 text=text.replace('line.append(label,button);list.appendChild(line);',rejectDevice);

 const board=`async function syncBoard(renderIfOpen=true){
 if(!sb||!familyId||!['owner','viewer'].includes(familyRole))return false;
 try{const {data:items,error}=await sb.rpc('rff_board_get',deviceArgs());if(error)throw error;db._board=Array.isArray(items)?items:[];try{localStorage.setItem('rff_verified',JSON.stringify(db))}catch(e){}if(renderIfOpen&&$('#p3').classList.contains('active'))renderBoard();return true}catch(e){console.log('Lavagna sync:',e);return false}
}
function renderBoard(){
 const host=$('#boardList');if(!host)return;host.innerHTML='';const items=boardData();if(!items.length){const e=document.createElement('div');e.className='hint';e.textContent='Nessun appunto. Aggiungi qui cose da comprare o promemoria.';host.appendChild(e);return}
 items.forEach((it,i)=>{const row=document.createElement('div');row.className='boardItem';const t=document.createElement('div');t.textContent=typeof it==='string'?it:(it.text||'');const b=document.createElement('button');b.textContent='✓ Fatto / elimina';
  b.onclick=async()=>{if(!sb||!familyId){alert('Sincronizzazione non disponibile. Riprova tra qualche secondo.');return}const itemId=(it&&typeof it==='object')?it.id:null;if(!itemId){if(familyRole==='owner'){boardData().splice(i,1);save();renderBoard()}return}b.disabled=true;const {error}=await sb.rpc('rff_board_delete',{...deviceArgs(),p_item_id:String(itemId)});if(error){alert('Eliminazione non riuscita. Controlla Internet e riprova.');b.disabled=false;return}await syncBoard(true)};
  row.append(t,b);host.appendChild(row)
 })
}
$('#boardAdd').onclick=async()=>{const inp=$('#boardText'),value=inp.value.trim();if(!value)return;if(!sb||!familyId){alert('Sincronizzazione non disponibile. Riprova tra qualche secondo.');return}const btn=$('#boardAdd');btn.disabled=true;const old=btn.textContent;btn.textContent='Invio…';const itemId='b_'+deviceId+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);const {error}=await sb.rpc('rff_board_add',{...deviceArgs(),p_item_id:itemId,p_text:value.slice(0,300),p_at:new Date().toISOString()});if(error){alert('Invio alla lavagna non riuscito. Controlla Internet e riprova.');btn.disabled=false;btn.textContent=old;return}inp.value='';await syncBoard(true);btn.disabled=false;btn.textContent=old};
$('#boardText').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#boardAdd').click()}});
$('#toBoard').onclick=async()=>{showPage('#p3');await syncBoard(true)};$('#toBoard2').onclick=async()=>{showPage('#p3');await syncBoard(true)};$('#boardBack').onclick=()=>showPage('#p1');$('#boardDaily').onclick=()=>showPage('#p2');

render();`;
 must(/function renderBoard\(\)\{[\s\S]*?\n\nrender\(\);/.test(text),'lavagna');
 text=text.replace(/function renderBoard\(\)\{[\s\S]*?\n\nrender\(\);/,board);

 text=text.replace("familyRole=(accountRole==='owner'||device.role==='primary')?'owner':'viewer';if(familyRole==='viewer')$('#addEntry').textContent='+ Invia pagamento';",
                   "familyRole=(device.role==='primary')?'owner':'viewer';if(familyRole==='viewer')$('#addEntry').textContent='+ Invia pagamento';else $('#addEntry').textContent='+ Aggiungi pagamento';");

 text=text.replace("await loadCloud();gate.classList.add('hidden');say('');\n  if(familyRole==='owner'){await sendAndroidPayments();await fetchInbox(true);await showPairingRequests()}else await sendAndroidPayments();\n  roleTimer=setInterval(()=>{if(document.hidden)return;if(familyRole==='owner'){sendAndroidPayments();fetchInbox();showPairingRequests()}else if(familyRole==='viewer'){loadCloud().catch(e=>console.log('Aggiornamento:',e));sendAndroidPayments()}},4000);",
                   "await loadCloud();await syncBoard(false);gate.classList.add('hidden');say('');\n  if(familyRole==='owner'){await sendAndroidPayments();await fetchInbox(true);await showPairingRequests()}else await sendAndroidPayments();\n  roleTimer=setInterval(()=>{if(document.hidden)return;if(familyRole==='owner'){sendAndroidPayments();fetchInbox();showPairingRequests();syncBoard(true)}else if(familyRole==='viewer'){loadCloud().catch(e=>console.log('Aggiornamento:',e));sendAndroidPayments();syncBoard(true)}},4000);");

 text=text.replace("service-worker.js?v=20260926-sync-notifiche-3","service-worker.js?v=20260927-v40");
 text=text.replace('</body></html>','<!-- Registro Finanziario Familiare V40 - versione consolidata --></body></html>');
 return text;
}


(()=>{
const $=s=>document.querySelector(s), euro=n=>(Number(n)||0).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2});
function printRegister(){buildPrintSheets();if(window.RegistroAndroid?.printRegister){RegistroAndroid.printRegister();return}window.print()}
$('#printRegister').onclick=printRegister;
let now=new Date(); const keyNow=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
let month=keyNow;
const defaultMonth=()=>({income:[['Stipendio Mario',0,true],['Stipendio Simona',0,true],['Assegno Unico',0,true]],planned:[],moves:[],rates:[],daily:{start:'',viewStart:'',food:0,sat:0,columns:[],spend:{},pending:[]}});
let db=JSON.parse(localStorage.getItem('rff_verified')||'{}');
function boardData(){if(!Array.isArray(db._board))db._board=[];return db._board}
function calendarData(){if(!Array.isArray(db._calendar))db._calendar=[];return db._calendar}
function rateMeta(row,create=false){
 let meta=row&&row[5];
 if(!meta||typeof meta!=='object'||Array.isArray(meta)){if(!create)return null;meta={id:'rate_'+crypto.randomUUID(),dueDay:'',dueMonth:'',dueYear:'',reminderDays:3,target:'both',googleSync:true,createdBy:deviceId};row[5]=meta}
 if(!meta.id&&create)meta.id='rate_'+crypto.randomUUID();
 if(!meta.target)meta.target='both';if(meta.googleSync===undefined)meta.googleSync=true;if(meta.reminderDays===undefined)meta.reminderDays=3;if(!meta.createdBy&&create)meta.createdBy=deviceId;
 return meta
}
function rateCalendarEvents(){
 const out=[];
 for(const [monthKey,mdata] of Object.entries(db)){
  if(!/^\d{4}-\d{2}$/.test(monthKey)||!mdata||!Array.isArray(mdata.rates))continue;
  const [baseY,baseM]=monthKey.split('-').map(Number);
  mdata.rates.forEach((row,index)=>{
   const meta=rateMeta(row,false),requested=Number(meta?.dueDay);if(!Number.isInteger(requested)||requested<1||requested>31)return;
   const yy=Number(meta?.dueYear)||baseY,mm=Number(meta?.dueMonth)||baseM;if(!Number.isInteger(yy)||yy<2000||yy>2100||!Number.isInteger(mm)||mm<1||mm>12)return;
   const last=new Date(yy,mm,0).getDate(),day=Math.min(requested,last),start=new Date(yy,mm-1,day,9,0,0),end=new Date(start.getTime()+30*60000),days=Math.max(0,Math.min(30,Number(meta.reminderDays)||0));
   out.push({id:'rate:'+String(meta.id||monthKey+'_'+index),title:'Scadenza · '+String(row[0]||'Rata'),startAt:start.toISOString(),endAt:end.toISOString(),note:'Rata € '+euro(Math.abs(Number(row[1])||0))+(requested!==day?' · scadenza adattata all’ultimo giorno del mese':''),target:String(meta.target||'both'),reminderMinutes:days*1440,googleSync:meta.googleSync!==false,createdBy:String(meta.createdBy||''),source:'rate',sourceMonth:monthKey,sourceIndex:index});
  })
 }
 return out
}
function allCalendarEvents(){return [...calendarData(),...rateCalendarEvents()]}
let calendarMonth=keyNow;
const SUPABASE_URL='https://dqtqwfvszrtndwipyluh.supabase.co';
const SUPABASE_KEY='sb_publishable_Qsbu5wHMUJ6ZJGuMNb16vA_gBx74NsB';
const sb=(window.supabase&&window.supabase.createClient)?window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY):null;
let localRevision=0,cloudDirty=false,cloudSaving=null,cloudRefreshing=false,lastRemoteSnapshot="",familySyncBusy=false,paymentActionBusy=false;
let familyId=null, familyRole=null, accountRole=null, cloudTimer=null, cloudLoading=false, roleTimer=null, inboxBusy=false, pendingTimer=null, lastInboxSync=0;
function syncStatus(message,error=false){const el=$('#syncStatus');el.textContent=message;el.classList.toggle('error',error);const mirror=$('#syncMirror');if(mirror){mirror.textContent=message;mirror.classList.toggle('error',error)}}
const deviceId=localStorage.getItem('rff_device_id')||crypto.randomUUID();
const deviceSecret=localStorage.getItem('rff_device_secret')||Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
localStorage.setItem('rff_device_id',deviceId);localStorage.setItem('rff_device_secret',deviceSecret);
const deviceArgs=()=>({p_family_id:familyId,p_device_id:deviceId,p_secret:deviceSecret});
function data(){return db[month]||(db[month]=defaultMonth())}
function save(){
 if(familyRole==='viewer')return;
 cloudDirty=true;localRevision++;
 localStorage.setItem('rff_verified',JSON.stringify(db));
 if(sb && familyId && familyRole==='owner' && !cloudLoading){syncStatus('Salvataggio…');clearTimeout(cloudTimer);cloudTimer=setTimeout(()=>{cloudTimer=null;saveCloud()},500)}
}
window.addEventListener('online',()=>{if(familyRole==='owner'&&familyId)saveCloud()});
function applyPermissions(){
 const viewer=familyRole==='viewer';$('#viewerBanner').hidden=!viewer;
 $('#pairingCard').hidden=true;$('#sentinelBar').hidden=!familyRole;const hasBridge=!!window.RegistroAndroid;['authorizeNotices','sourcesButton','sendNotices'].forEach(id=>$('#'+id).disabled=!hasBridge);
 const manualCard=$('#entryAmount')?.closest('.card');if(manualCard)manualCard.hidden=false;$('#sendForApproval').hidden=viewer;
 document.querySelectorAll('#p1 input:not(#monthPick),#p2 input,#p1 button,#p2 button,#p2 select').forEach(el=>{
  if(['prevM','nextM','prevM2','nextM2','toDaily','toMonth','toBoard','toBoard2','authorizeNotices','sourcesButton','sendNotices'].includes(el.id))return;
  if(el.closest('.entryForm')){el.disabled=false;return}
  el.disabled=viewer;
 });
 if($('#boardText'))$('#boardText').disabled=false;if($('#boardAdd'))$('#boardAdd').disabled=false;
}
async function resolveFamily(){
 if(!sb) return false;
 const {data:{session}}=await sb.auth.getSession();
 if(!session?.user) return false;
 const {data:member,error}=await sb.from('family_members').select('family_id,role').eq('user_id',session.user.id).limit(1).maybeSingle();
 if(error)return false;
 if(!member?.family_id){const {data:newFamily,error:createError}=await sb.rpc('rff_bootstrap_family');if(createError||!newFamily)return false;familyId=newFamily;return true}
 familyId=member.family_id;accountRole=member.role||null;return true;
}
async function loadCloud(){
 try{
  if(!await resolveFamily()) throw new Error('Account non collegato alla famiglia.');
  cloudLoading=true;
  const {data:row,error}=await sb.from('family_register').select('data').eq('family_id',familyId).limit(1).maybeSingle();
  if(error) throw error;
  if(!error && row?.data && typeof row.data==='object' && Object.keys(row.data).length){
   if(Object.keys(db).length && JSON.stringify(db)!==JSON.stringify(row.data)){
    try{if(!localStorage.getItem('rff_local_before_first_cloud'))localStorage.setItem('rff_local_before_first_cloud',JSON.stringify(db))}catch(e){console.log('Local backup:',e)}
   }
   lastRemoteSnapshot=JSON.stringify(row.data);cloudDirty=false;db=row.data;
   if(familyRole==='viewer')ensureMonth(month);
   localStorage.setItem('rff_verified',JSON.stringify(db)); render();
  } else if(familyRole==='viewer'){db={};localStorage.setItem('rff_verified','{}');render();}
  else if(!error && Object.keys(db).length && familyRole==='owner'){ if(!await saveCloud())throw new Error('Salvataggio online non disponibile. Riprova.'); }
  applyPermissions();
  syncStatus('Dati aggiornati');
  return true;
 }finally{cloudLoading=false}
}
async function saveCloud(){
 if(cloudSaving)return cloudSaving;
 let saved=false;
 cloudSaving=(async()=>{try{
  if(familyRole!=='owner')return false;
  if(!familyId&&!await resolveFamily())return false;
  const revision=localRevision,snapshot=JSON.parse(JSON.stringify(db));
  const {error}=await sb.rpc('rff_save_register',{...deviceArgs(),p_data:snapshot});
  if(error)throw error;
  if(localRevision===revision)cloudDirty=false;
  lastRemoteSnapshot=JSON.stringify(snapshot);syncStatus('Salvato online');saved=true;return true;
 }catch(e){console.log('Cloud save:',e);syncStatus('Salvataggio non riuscito · modifiche conservate sul telefono',true);return false}})();
 try{return await cloudSaving}finally{cloudSaving=null;if(saved&&cloudDirty){clearTimeout(cloudTimer);cloudTimer=setTimeout(()=>{cloudTimer=null;saveCloud()},500)}}
}
async function refreshRemote(){
 if(!sb||!familyId||cloudDirty||cloudSaving||cloudLoading||cloudRefreshing||paymentActionBusy||document.activeElement?.matches('input,select,textarea'))return;
 cloudRefreshing=true;const revision=localRevision;
 try{
  const {data:row,error}=await sb.from('family_register').select('data').eq('family_id',familyId).limit(1).maybeSingle();
  if(error)throw error;
  if(cloudDirty||cloudSaving||localRevision!==revision||document.activeElement?.matches('input,select,textarea'))return;
  if(row?.data){const serialized=JSON.stringify(row.data);if(serialized!==lastRemoteSnapshot){lastRemoteSnapshot=serialized;db=row.data;localStorage.setItem('rff_verified',JSON.stringify(db));render()}}
  syncStatus('Registro sincronizzato');
 }catch(e){console.log('Aggiornamento registro:',e);syncStatus('Sincronizzazione non riuscita · riprovo',true)}finally{cloudRefreshing=false}
}
async function syncFamily(){
 if(familySyncBusy||paymentActionBusy||document.hidden||!familyId||!familyRole)return;familySyncBusy=true;
 try{updateNotificationState();await refreshRemote();await sendAndroidPayments();await fetchInbox();if(familyRole==='owner')await showPairingRequests();await syncBoard(false);await syncCalendar(false);syncNativeFamilyTools();if($('#p3').classList.contains('active')){renderBoard();renderCalendar()}}
 catch(e){console.log('Sincronizzazione famiglia:',e)}finally{familySyncBusy=false}
}
function ymParts(){let [y,m]=month.split('-').map(Number);return [y,m]}
function title(){let [y,m]=ymParts();return new Date(y,m-1,1).toLocaleDateString('it-IT',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase())}
function ensureMonth(nm){
 let [y,m]=nm.split('-').map(Number),prev=new Date(y,m-2,1),prevKey=prev.getFullYear()+'-'+String(prev.getMonth()+1).padStart(2,'0');
 let old=db[prevKey],neu=db[nm]||defaultMonth(),alreadyExists=!!db[nm];
 if(neu._monthConfirmed){db[nm]=neu;return}
 if(old){
  for(const kind of ['income','planned','moves','rates']){
   const target=neu[kind]||(neu[kind]=[]);
   const seen=new Map();
   for(const r of old[kind]||[]){
    const name=String(r[0]||'').trim().toLowerCase();
    if(!name||name==='nuova voce')continue;
    const occurrence=seen.get(name)||0;seen.set(name,occurrence+1);
    const existing=target.filter(x=>String(x[0]||'').trim().toLowerCase()===name);
    if(existing.length<=occurrence){
     const nextRow=[r[0],r[1],r[2],r[3],true];
     if(kind==='rates'&&r[5]&&typeof r[5]==='object'&&!Array.isArray(r[5])){nextRow[5]={...r[5],id:'rate_'+crypto.randomUUID(),createdBy:r[5].createdBy||deviceId}}
     target.push(nextRow);
    }
    else if(!neu._carryInitializedFrom && kind==='income' && occurrence===0 &&
      ['stipendio mario','stipendio simona','assegno unico'].includes(name) &&
      Number(existing[occurrence][1])===0 && !existing[occurrence][4]){
      existing[occurrence][1]=r[1];existing[occurrence][4]=true;
    }
   }
  }
  if(old.daily){
   neu.daily||(neu.daily=defaultMonth().daily);
   if(!Array.isArray(neu.daily.columns)||!neu.daily.columns.length){
    const legacy=[];
    if(Number(old.daily.diesel||0)!==0)legacy.push({id:'diesel',name:'Diesel',budget:Number(old.daily.diesel)||0});
    if(Number(old.daily.benzina||0)!==0)legacy.push({id:'benzina',name:'Benzina',budget:Number(old.daily.benzina)||0});
    if(Number(old.daily.metano||0)!==0)legacy.push({id:'metano',name:'Metano',budget:Number(old.daily.metano)||0});
    neu.daily.columns=(old.daily.columns||legacy).map(c=>({id:c.id,name:c.name,budget:Number(c.budget)||0}));
   }
  }
  neu._carryInitializedFrom=prevKey;
 }
 db[nm]=neu;
}
function buildPrintSheets(){
 const host=$('#printSheets'),d=data(),label=title();
 const line=(name,value,pending=false)=>`<div class="printLine${pending?' printPending':''}"><span>${escapeNotice(name||'Nuova voce')}${pending?' · da confermare':''}</span><b>${escapeNotice(value)}</b></div>`;
 const block=(heading,rows,footer='',color='')=>`<div class="printBlock ${color}"><h2>${heading}</h2>${rows||'<div class="printLine">Nessuna voce</div>'}${footer?`<div class="printTotal">${footer}</div>`:''}</div>`;
 const entries=(kind)=>d[kind].map(r=>line(r[0],(kind==='income'?'':rowSign(r,kind)+' ')+'€ '+euro(Math.abs(Number(r[1])||0)),!!r[4])).join('');
 const daily=d.daily||{},[year,mon]=ymParts(),last=new Date(year,mon,0).getDate();
 const cols=(daily.columns||[]).filter(c=>(c.name||'').trim());
 const dailyHeads=['Giorno','Mangiare',...cols.map(c=>c.name.trim())];
 const first=Number((daily.start||'').slice(-2))||1;
 let carry=0;const spent={};cols.forEach(c=>spent[colKey(c)]=0);
 const rows=[];
 for(let day=first;day<=last;day++){
  const dt=new Date(year,mon-1,day),sp=(daily.spend||{})[day]||{},sat=dt.getDay()===6;
  const byCategory=k=>(daily.entries||[]).filter(x=>Number(x.day)===day&&x.category===k).reduce((sum,x)=>sum+Number(x.amount||0),0);
  carry+=(Number(daily.food)||0)+(sat?(Number(daily.sat)||0):0)-(Number(sp.food)||0)+byCategory('food');
  const cells=[`${dt.toLocaleDateString('it-IT',{weekday:'short'})} ${day}`,`€ ${euro(byCategory('food')-(Number(sp.food)||0))} · residuo € ${euro(carry)}`];
  cols.forEach(c=>{let k=colKey(c);spent[k]+=(Number(sp[k])||0)-byCategory(k);cells.push(`€ ${euro(byCategory(k)-(Number(sp[k])||0))} · residuo € ${euro((Number(c.budget)||0)-spent[k])}`)});
  rows.push('<tr>'+cells.map(v=>`<td>${escapeNotice(v)}</td>`).join('')+'</tr>');
 }
 host.innerHTML=`<div class="printSheet"><div class="printTitle">Registro Finanziario Familiare · ${escapeNotice(label)} — riepilogo</div><div class="printColumns"><div>${block('Ingressi del mese',entries('income'),'Totale ingressi: € '+$('#incomeTotal').textContent,'income')}${block('Spese preventivate mese',entries('planned'),'Totale: € '+$('#plannedTotal').textContent,'planned')}${block('Ingressi − spese preventivate','', 'Differenza: € '+$('#incomeAfterPlanned').textContent,'projection')}</div><div>${block('Situazione economica / movimenti',entries('moves'),'Parziale: € '+$('#moveTotal').textContent,'moves')}${block('Rate / scadenze',entries('rates'),'Parziale: € '+$('#rateTotal').textContent,'rates')}${block('Bilancio finale','', 'Totale delle tre sezioni: € '+$('#balance').textContent,'balance')}</div></div></div><div class="printSheet"><div class="printTitle">Registro Finanziario Familiare · ${escapeNotice(label)} — spese giornaliere</div><table class="printDaily"><thead><tr>${dailyHeads.map(h=>`<th>${escapeNotice(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}
function nextMonth(delta){let [y,m]=ymParts(),d=new Date(y,m-1+delta,1),nm=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
 ensureMonth(nm);month=nm;save();render()}
function monthSnapshot(d){return JSON.parse(JSON.stringify({income:d.income,planned:d.planned,moves:d.moves,rates:d.rates}))}
function rememberMonth(d,action){
 d._monthHistory||(d._monthHistory=[]);
 d._monthHistory.unshift({at:new Date().toISOString(),action,rows:monthSnapshot(d)});
 d._monthHistory.length=Math.min(d._monthHistory.length,12);
}
function renderMonthMode(){
 const notificationPanel=$('#sentinelBar');
 if(notificationPanel)$('#monthEditor>div:last-child').appendChild(notificationPanel);
 const d=data(),confirmed=!!d._monthConfirmed,viewer=familyRole==='viewer';
 $('#monthEditor').hidden=confirmed;$('#monthPreview').hidden=!confirmed;
 $('#confirmMonth').hidden=confirmed||viewer;$('#editMonth').hidden=!confirmed||viewer;
 $('#monthModeLabel').textContent=confirmed?'Mese confermato · riepilogo pronto per la stampa':'Mese in modifica';
 if(confirmed){buildPrintSheets();$('#monthPreview').innerHTML=$('#printSheets .printSheet').outerHTML;if(notificationPanel)$('#monthPreview .printColumns>div:last-child').appendChild(notificationPanel)}
 const history=d._monthHistory||[],details=$('#monthHistory');if(details.dataset.month!==month){details.open=false;details.dataset.month=month}details.hidden=!history.length;
 $('#monthHistoryList').innerHTML=history.map((h,i)=>`<div>${escapeNotice(new Date(h.at).toLocaleString('it-IT'))} · ${escapeNotice(h.action)} ${viewer?'':`<button type="button" data-version="${i}">Ripristina</button>`}</div>`).join('');
 $('#monthHistoryList').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(familyRole!=='owner'||!confirm('Ripristinare questa versione delle voci del mese?'))return;const rows=history[Number(b.dataset.version)].rows;rememberMonth(d,'Prima del ripristino');for(const k of ['income','planned','moves','rates'])d[k]=JSON.parse(JSON.stringify(rows[k]||[]));d._monthConfirmed=false;details.open=false;save();render()});
}
$('#confirmMonth').onclick=()=>{if(familyRole!=='owner')return;const d=data();rememberMonth(d,'Conferma');d._monthConfirmed=true;d._confirmedAt=new Date().toISOString();const h=$('#monthHistory');if(h)h.open=false;save();render();window.scrollTo(0,0)};
$('#editMonth').onclick=()=>{if(familyRole!=='owner')return;const d=data();rememberMonth(d,'Prima della modifica');d._monthConfirmed=false;const h=$('#monthHistory');if(h)h.open=false;save();render();window.scrollTo(0,0)};
function rowSign(r,kind){return r[3]==='+'||r[3]==='-'?r[3]:(kind==='moves'?(Number(r[1])<0?'-':'+'):'-')}
function bindProvisionalHold(row,r){
 if(r[4]||familyRole==='viewer')return;
 let timer=0,startX=0,startY=0,fired=false;
 const clearHold=()=>{if(timer){clearTimeout(timer);timer=0}};
 const mark=()=>{
  if(fired||r[4]||familyRole==='viewer')return;
  fired=true;clearHold();
  try{if(navigator.vibrate)navigator.vibrate(35)}catch(_){ }
  if(confirm('Segnare questa voce come provvisoria (rossa)?\nResterà comunque nel conteggio.')){r[4]=true;save();render()}
 };
 row.querySelectorAll('input[type="text"],input[type="number"]').forEach(el=>{
  el.title='Tieni premuto per segnare la voce come provvisoria (rossa)';
  el.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;fired=false;startX=e.clientX;startY=e.clientY;clearHold();timer=setTimeout(mark,650)});
  el.addEventListener('pointermove',e=>{if(Math.hypot(e.clientX-startX,e.clientY-startY)>12)clearHold()});
  ['pointerup','pointercancel','pointerleave'].forEach(type=>el.addEventListener(type,clearHold));
  el.addEventListener('contextmenu',e=>{if(r[4]||familyRole==='viewer')return;e.preventDefault();mark()});
 });
}
function rowEditor(arr,host,kind){
 host.innerHTML='';
 arr.forEach((r,i)=>{let d=document.createElement('div');d.className='row'+(kind==='planned'?' plannedRow':kind==='income'?'':' signedRow')+(r[4]?' pendingCarry':'');
 let sign=(kind==='income'||kind==='planned')?'':`<span class="signBox" data-sign="${rowSign(r,kind)}"><select aria-label="Aggiungi o sottrai"><option value="+" ${rowSign(r,kind)==='+'?'selected':''}>+</option><option value="-" ${rowSign(r,kind)==='-'?'selected':''}>−</option></select></span>`;
 d.innerHTML=`<input type="text" value="${String(r[0]).replace(/"/g,'&quot;')}" aria-label="Descrizione">${sign}<input type="number" min="0" step="0.01" value="${Math.abs(Number(r[1])||0)}" aria-label="Importo">${kind==='planned'?`<input class="keep" type="checkbox" title="Mostra in Varie" aria-label="Mostra in Varie" ${r[2]?'checked':''}>`:''}<button class="del" title="Elimina voce">−</button>${r[4]?'<button class="confirmCarry" type="button">✓ Conferma voce</button>':''}`;
 if(kind==='rates'){
  const meta=rateMeta(r,true),rem=document.createElement('div');rem.className='rateReminder';
  rem.innerHTML=`<div class="rateDateRow"><label>Giorno<input class="rateDueDay" type="number" min="1" max="31" inputmode="numeric" placeholder="gg" value="${meta.dueDay||''}"></label><label>Mese<select class="rateDueMonth"><option value="1">Gen</option><option value="2">Feb</option><option value="3">Mar</option><option value="4">Apr</option><option value="5">Mag</option><option value="6">Giu</option><option value="7">Lug</option><option value="8">Ago</option><option value="9">Set</option><option value="10">Ott</option><option value="11">Nov</option><option value="12">Dic</option></select></label><label>Anno<input class="rateDueYear" type="number" min="2000" max="2100" inputmode="numeric"></label></div><label>Avvisami<select class="rateReminderDays"><option value="0">il giorno stesso</option><option value="1">1 giorno prima</option><option value="2">2 giorni prima</option><option value="3">3 giorni prima</option><option value="5">5 giorni prima</option><option value="7">7 giorni prima</option></select></label><label>Notifica a<select class="rateReminderTarget"><option value="both">Entrambi i telefoni</option><option value="creator">Solo questo telefono</option><option value="other">Solo l'altro telefono</option></select></label><div class="rateCalendarHint">📅 Se imposti il giorno, la rata compare automaticamente nel Calendario familiare alle 09:00 e può essere sincronizzata con Google Calendar.</div>`;
  const [ratePageYear,ratePageMonth]=month.split('-').map(Number);rem.querySelector('.rateDueMonth').value=String(Number(meta.dueMonth)||ratePageMonth);rem.querySelector('.rateDueYear').value=String(Number(meta.dueYear)||ratePageYear);rem.querySelector('.rateReminderDays').value=String(meta.reminderDays??3);rem.querySelector('.rateReminderTarget').value=meta.target||'both';
  rem.querySelector('.rateDueDay').onchange=e=>{const n=Number(e.target.value);meta.dueDay=(Number.isInteger(n)&&n>=1&&n<=31)?n:'';if(!meta.createdBy)meta.createdBy=deviceId;save();renderCalendar();syncNativeFamilyTools()};
  rem.querySelector('.rateDueMonth').onchange=e=>{const n=Number(e.target.value);meta.dueMonth=(Number.isInteger(n)&&n>=1&&n<=12)?n:'';if(!meta.createdBy)meta.createdBy=deviceId;save();renderCalendar();syncNativeFamilyTools()};
  rem.querySelector('.rateDueYear').onchange=e=>{const n=Number(e.target.value);meta.dueYear=(Number.isInteger(n)&&n>=2000&&n<=2100)?n:'';if(!meta.createdBy)meta.createdBy=deviceId;save();renderCalendar();syncNativeFamilyTools()};
  rem.querySelector('.rateReminderDays').onchange=e=>{meta.reminderDays=Number(e.target.value)||0;if(!meta.createdBy)meta.createdBy=deviceId;save();renderCalendar();syncNativeFamilyTools()};
  rem.querySelector('.rateReminderTarget').onchange=e=>{meta.target=e.target.value||'both';if(!meta.createdBy)meta.createdBy=deviceId;save();renderCalendar();syncNativeFamilyTools()};
  d.appendChild(rem);
 }
 let ins=d.querySelectorAll(':scope > input');
 ins[0].onfocus=e=>{if(e.target.value.trim().toLowerCase()==='nuova voce')e.target.value=''};
 ins[0].onchange=e=>{r[0]=e.target.value.trim()||'Nuova voce';e.target.value=r[0];save();renderDaily()};
 ins[1].onchange=e=>{r[1]=Math.abs(Number(e.target.value)||0);if(kind==='planned')r[3]='-';else if(kind!=='income')r[3]=d.querySelector('select').value;save();calc()};
 if(kind!=='income'&&kind!=='planned')d.querySelector('select').onchange=e=>{r[1]=Math.abs(Number(r[1])||0);r[3]=e.target.value;d.querySelector('.signBox').dataset.sign=r[3];save();calc()};
 if(kind==='planned')ins[2].onchange=e=>{r[2]=e.target.checked;save();renderDaily()};d.querySelector('.del').onclick=()=>{arr.splice(i,1);save();render();if(kind==='rates')syncNativeFamilyTools()};
 if(r[4])d.querySelector('.confirmCarry').onclick=()=>{r[4]=false;save();render()};
 if(!r[4]&&familyRole!=='viewer'){const mark=document.createElement('button');mark.type='button';mark.className='markProvisional';mark.textContent='🔴';mark.title='Segna come provvisoria';mark.setAttribute('aria-label','Segna questa voce come provvisoria rossa');mark.style.cssText='position:absolute;right:4px;top:4px;z-index:6;width:30px;height:30px;min-width:30px;min-height:30px;padding:0;border:1px solid #fca5a5;border-radius:999px;background:#fff;display:grid;place-items:center;font-size:16px;line-height:1;box-shadow:0 1px 4px #0002';d.style.position='relative';const desc=d.querySelector(':scope > input[type=\"text\"]');if(desc)desc.style.paddingRight='40px';mark.onclick=e=>{e.preventDefault();e.stopPropagation();r[4]=true;save();render()};d.appendChild(mark)}
 /* V60_DIRECT_RED_BUTTON */ host.appendChild(d)})
}
function add(kind){let a=data()[kind],row=['Nuova voce',0,true,kind==='moves'?'+':'-'];if(kind==='rates')row[5]={id:'rate_'+crypto.randomUUID(),dueDay:'',reminderDays:3,target:'both',googleSync:true,createdBy:deviceId};a.push(row);save();render()}
function calc(){let d=data(),inc=d.income.reduce((s,x)=>s+(+x[1]||0),0);
 let signed=(rows,kind)=>rows.reduce((sum,r)=>sum+(kind==='planned'?-1:(rowSign(r,kind)==='+'?1:-1))*Math.abs(Number(r[1])||0),0);
 let plannedTotal=-signed(d.planned,'planned'),remaining=inc-plannedTotal;
 $('#incomeTotal').textContent=euro(inc);$('#plannedTotal').textContent=euro(plannedTotal);
 $('#incomeAfterPlanned').textContent=euro(remaining);$('#incomeAfterPlannedCard').classList.toggle('negative',remaining<0);
 const moveTotal=signed(d.moves,'moves'),rateTotal=signed(d.rates,'rates'),sectionsTotal=-plannedTotal+moveTotal+rateTotal;
 $('#moveTotal').textContent=(moveTotal<0?'− ':'+ ')+euro(Math.abs(moveTotal));$('#rateTotal').textContent=(rateTotal<0?'− ':'+ ')+euro(Math.abs(rateTotal));$('#sectionsTotal').textContent=(sectionsTotal<0?'− ':'+ ')+euro(Math.abs(sectionsTotal));
 $('#balance').textContent=euro(sectionsTotal)}
function render(){
 $('#monthPick').value=month;$('#monthTitle').textContent=title();$('#monthTitle2').textContent=title();
 let d=data();rowEditor(d.income,$('#incomeRows'),'income');rowEditor(d.planned,$('#plannedRows'),'planned');rowEditor(d.moves,$('#moveRows'),'moves');rowEditor(d.rates,$('#rateRows'),'rates');calc();renderDaily();renderMonthMode();applyPermissions()
 renderBoard();if($('#p3').classList.contains('active'))renderCalendar();}
function validStart(){
 let d=data().daily,[y,m]=ymParts(),last=new Date(y,m,0).getDate(),fallback=`${month}-01`;
 if(!d.start || !d.start.startsWith(month)) d.start=fallback;
 $('#startDate').min=`${month}-01`;$('#startDate').max=`${month}-${String(last).padStart(2,'0')}`;$('#startDate').value=d.start;
 return Number(d.start.slice(-2))
}
function entriesFor(day,k){return (data().daily.entries||[]).filter(x=>Number(x.day)===Number(day)&&x.category===k).reduce((sum,x)=>sum+Number(x.amount||0),0)}
function dayTotal(day,k){return (Number(spendObj(day)[k])||0)+entriesFor(day,k)}
function spendObj(day){let s=data().daily.spend;return s[day]||(s[day]={food:0,varie:0})}
function customCols(){const d=data().daily;d.columns||(d.columns=[]);return d.columns}
function colKey(c){return 'custom:'+c.id}
function renderCustomColumns(){
 const host=$('#customColumns');if(!host)return;host.innerHTML='';
 const cols=customCols();
 if(!cols.length)host.innerHTML='<div class="hint">Nessuna colonna creata. Premi “+ Crea colonna”.</div>';
 cols.forEach((c,i)=>{const row=document.createElement('div');row.className='row';row.innerHTML=`<input class="grow" type="text" placeholder="Nome colonna" value="${escapeNotice(c.name||'')}"><input type="number" step="0.01" min="0" inputmode="decimal" placeholder="Importo iniziale" value="${Number(c.budget)||0}"><button type="button" title="Elimina colonna">−</button>`;
  const [name,budget,del]=row.children;
  name.onchange=()=>{c.name=name.value.trim();save();renderDaily()};
  budget.onchange=()=>{c.budget=Number(budget.value)||0;save();renderDaily()};
  del.onclick=()=>{if(!confirm('Eliminare questa colonna?'))return;data().daily.columns.splice(i,1);save();renderDaily()};host.appendChild(row)
 });applyPermissions()
}
function refreshCategorySelect(){
 const sel=$('#entryCategory');if(!sel)return;const old=sel.value;sel.innerHTML='';
 [['Mangiare','food'],...customCols().filter(c=>(c.name||'').trim()).map(c=>[c.name.trim(),colKey(c)]),['Varie','varie']].forEach(([name,key])=>{const o=document.createElement('option');o.textContent=name;o.value=key;sel.appendChild(o)});
 if([...sel.options].some(o=>o.value===old))sel.value=old
}
function categoryName(key){if(key==='food')return'Mangiare';if(key==='varie')return'Varie';const c=customCols().find(c=>colKey(c)===key);return c?c.name:'Varie'}
function renderDaily(){
 let d=data().daily,start=validStart(),[y,m]=ymParts(),last=new Date(y,m,0).getDate();
 if(!d.viewStart || !d.viewStart.startsWith(month)) d.viewStart=d.start;
 const liveToday=new Date(),liveMonth=liveToday.getFullYear()+'-'+String(liveToday.getMonth()+1).padStart(2,'0');
 // V89/V90: il filtro di visualizzazione può tornare ai giorni precedenti senza cambiare i conteggi.
 const displayStart=Math.max(start,Number(d.viewStart.slice(-2))||start);
 if(!Array.isArray(d.columns)){d.columns=[];[['diesel','Diesel'],['benzina','Benzina'],['metano','Metano']].forEach(([k,n])=>{if(Number(d[k]||0)!==0)d.columns.push({id:k,name:n,budget:Number(d[k])||0})})}
 const todayKey=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
 const defaultEnd=month===todayKey.slice(0,7)?todayKey:(month<todayKey.slice(0,7)?month+'-'+String(last).padStart(2,'0'):month+'-01');
 const view=$('#viewDate');view.min=month+'-01';view.max=month+'-'+String(last).padStart(2,'0');view.value=d.viewStart;
 const entryDate=$('#entryDate');entryDate.min=month+'-01';entryDate.max=month+'-'+String(last).padStart(2,'0');if(!entryDate.value.startsWith(month))entryDate.value=defaultEnd;
 const end=month>todayKey.slice(0,7)?last:(month===todayKey.slice(0,7)?now.getDate():last);
 $('#foodBudget').value=d.food||0;$('#satExtra').value=d.sat||0;renderCustomColumns();refreshCategorySelect();
 const activeCols=customCols().filter(c=>(c.name||'').trim());
 const head=$('#dailyHead');head.innerHTML='<th>Giorno</th><th>Mangiare</th>'+activeCols.map(c=>`<th>${escapeNotice(c.name.trim())}</th>`).join('');
 const totalCols=2+activeCols.length;
 head.closest('table').style.minWidth=totalCols<=3?'0':Math.max(520,totalCols*145)+'px';
 head.querySelector('th:first-child').style.width=totalCols===2?'42%':(totalCols===3?'30%':'120px');
 let body=$('#dailyBody');body.innerHTML='';let foodCarry=0;const spent={};activeCols.forEach(c=>spent[colKey(c)]=0);
 for(let day=start;day<=end;day++){
  let dt=new Date(y,m-1,day),sp=spendObj(day),isSat=dt.getDay()===6;
  foodCarry+=(+d.food||0)+(isSat?(+d.sat||0):0);foodCarry-=(+sp.food||0);foodCarry+=entriesFor(day,'food');
  let cells=activeCols.map(c=>{const k=colKey(c);spent[k]+=(+sp[k]||0)-entriesFor(day,k);return cell(day,k,entriesFor(day,k)-(+sp[k]||0),(+c.budget||0)-spent[k],'residuo')}).join('');
  let tr=document.createElement('tr');if(y===now.getFullYear()&&m===now.getMonth()+1&&day===now.getDate())tr.className='today';
  tr.innerHTML=`<td class="day">${dt.toLocaleDateString('it-IT',{weekday:'short'})} ${day}</td>${cell(day,'food',entriesFor(day,'food')-(+sp.food||0),foodCarry,'residuo')}${cells}`;if(day>=displayStart)body.appendChild(tr)
 }
 renderVarieSingle();renderEntryHistory();renderPending()
}
function renderVarieSingle(){
 const host=$('#varieSingle'); if(!host) return;
 host.innerHTML='';
 const arr=data().planned;
 const hidden=data().daily.varieHidden||(data().daily.varieHidden={});
 const selected=arr.map((r,i)=>({r,i})).filter(x=>x.r[2]&&!x.r[4]&&!hidden[x.i]);
 selected.forEach(({r,i})=>{
   const adjustments=data().daily.varieAdjustments||(data().daily.varieAdjustments=[]);
   const matching=adjustments.filter(x=>x.row===i);
   const total=()=>Number(r[1]||0)+adjustments.filter(x=>x.row===i).reduce((n,x)=>n+Number(x.amount||0),0);
   const line=document.createElement('div');line.className='varieItem';
   const base=document.createElement('div');base.className='varieBase';
   const name=document.createElement('input');name.type='text';name.value=r[0];name.readOnly=true;
   const value=document.createElement('input');value.type='number';value.step='0.01';value.value=Number(r[1])||0;value.setAttribute('aria-label','Importo iniziale '+r[0]);
   value.onchange=()=>{const n=Number(value.value);if(!Number.isFinite(n)){value.value=r[1];return}r[1]=n;save();calc();renderVarieSingle()};const del=document.createElement('button');del.type='button';del.textContent='🗑️';del.title='Elimina solo da Varie';del.setAttribute('aria-label','Elimina '+r[0]+' solo da Varie');del.onclick=()=>{if(familyRole!=='owner')return;hidden[i]=true;save();renderVarieSingle()};base.append(name,value,del);
   const adjust=document.createElement('div');adjust.className='varieAdjust';
   const sign=document.createElement('select');sign.innerHTML='<option value="-">−</option><option value="+">+</option>';sign.setAttribute('aria-label','Segno variazione '+r[0]);
   const amount=document.createElement('input');amount.type='number';amount.min='0.01';amount.step='0.01';amount.placeholder='Importo';amount.setAttribute('aria-label','Importo variazione '+r[0]);
   const add=document.createElement('button');add.textContent='Applica';add.onclick=()=>{if(familyRole!=='owner')return;const n=Number(amount.value);if(!Number.isFinite(n)||n<=0)return;adjustments.push({id:Date.now()+'-'+Math.random().toString(36).slice(2),row:i,amount:(sign.value==='-'?-1:1)*n});save();renderVarieSingle()};adjust.append(sign,amount,add);
   const result=document.createElement('div');result.className='varieResult';result.textContent='Risultato: € '+euro(total());
   const history=document.createElement('div');history.className='varieAdjustments';
   matching.forEach(x=>{const item=document.createElement('div');item.textContent=(x.amount<0?'− ':'+ ')+'€ '+euro(Math.abs(x.amount))+' ';const remove=document.createElement('button');remove.textContent='Rimuovi';remove.onclick=()=>{if(familyRole!=='owner')return;data().daily.varieAdjustments=adjustments.filter(y=>y.id!==x.id);save();renderVarieSingle()};item.appendChild(remove);history.appendChild(item)});
   line.append(base,adjust,result,history);host.appendChild(line);
 });
 const extra=Object.entries(data().daily.spend||{}).filter(([day,sp])=>Number(sp.varie)>0||entriesFor(day,'varie')!==0).sort((a,b)=>Number(a[0])-Number(b[0]));
 extra.forEach(([day,sp])=>{const line=document.createElement('div');line.className='total';line.textContent=`Giorno ${day}: € ${euro(dayTotal(day,'varie'))}`;host.appendChild(line)});
 (data().daily.entries||[]).filter(x=>x.category==='varie'&&!extra.some(([day])=>Number(day)===Number(x.day))).forEach(x=>{const line=document.createElement('div');line.className='total';line.textContent=`Giorno ${x.day}: € ${euro(dayTotal(x.day,'varie'))}`;host.appendChild(line)});
 if(!selected.length&&!extra.length&&!(data().daily.entries||[]).some(x=>x.category==='varie'))host.innerHTML='<div class="hint">Nessuna voce in Varie.</div>';
 applyPermissions();
}
function cell(day,k,val,res,label){return `<td class="moneyCell"><strong>€ ${euro(val)}</strong><span class="res">${label}: <strong>€ ${euro(res)}</strong></span></td>`}
$('#viewDate').onchange=e=>{if(e.target.value.startsWith(month)){data().daily.viewStart=e.target.value;save();renderDaily()}};
$('#sendForApproval').onclick=()=>$('#addEntry').onclick({sendForApproval:true});
$('#addEntry').onclick=async(event)=>{
 const amount=Number($('#entryAmount').value),date=$('#entryDate').value;
 if(!Number.isFinite(amount)||amount<=0||!date.startsWith(month)){alert('Inserisci importo e giorno validi.');return}
 const day=Number(date.slice(-2)),[yy,mm]=ymParts();if(day<1||day>new Date(yy,mm,0).getDate())return;
 const sign=document.querySelector('input[name="entrySign"]:checked').value;
 const category=$('#entryCategory').value;
 if(familyRole==='viewer'||event?.sendForApproval){
  if(!sb||!familyId){alert('Sincronizzazione non disponibile. Riprova.');return}
  const btn=event?.sendForApproval?$('#sendForApproval'):$('#addEntry'),label=btn.textContent;btn.disabled=true;btn.textContent='Invio…';
  try{
   const occurred=new Date(Number(yy),Number(mm)-1,day,12);
   const nid='manual_'+deviceId+'_'+crypto.randomUUID();
   const desc=(sign==='-'?'__RFF_SIGN_NEG__':'__RFF_SIGN_POS__')+' Pagamento manuale · '+categoryName(category);
   const {error}=await sb.rpc('rff_send_payment',{...deviceArgs(),p_notification_id:nid,p_amount:amount,p_description:desc,p_occurred_at:occurred.toISOString(),p_category:categoryName(category)});
   if(error)throw error;
   $('#entryAmount').value='';$('#sendStatus').textContent='Richiesta inviata: resta rossa fino alla conferma nel registro condiviso.';
   await fetchInbox();$('#pendingDrop').open=true;
  }catch(e){console.log('Invio manuale:',e);alert('Invio non riuscito. Controlla Internet e riprova.')}finally{btn.textContent=label;btn.disabled=false}
  return;
 }
 if(familyRole!=='owner')return;
 const d=data().daily;d.entries||(d.entries=[]);
 d.entries.push({id:Date.now()+'-'+Math.random().toString(36).slice(2),day,category:category,amount:(sign==='-'?-1:1)*amount,desc:'Manuale'});
 $('#entryAmount').value='';save();renderDaily();
};
function renderEntryHistory(){
 const host=$('#entryHistory'),count=$('#entryHistoryCount');host.innerHTML='';
 const entries=data().daily.entries||[];if(count)count.textContent=entries.length?'('+entries.length+')':'';
 if(!entries.length){host.innerHTML='<p class="hint">Nessun pagamento inserito.</p>';return}
 entries.slice().reverse().forEach(entry=>{
  const line=document.createElement('div');line.className='entryLine';
  const span=document.createElement('span');span.textContent=`${entry.day} ${title()} · ${categoryName(entry.category)} · ${entry.amount<0?'−':'+'} € ${euro(Math.abs(entry.amount))}`;
  const btn=document.createElement('button');btn.textContent='−';btn.title='Rimuovi questo pagamento';btn.onclick=()=>{if(familyRole!=='owner')return;data().daily.entries=data().daily.entries.filter(x=>x.id!==entry.id);save();renderDaily()};
  line.append(span,btn);host.appendChild(line)
 });applyPermissions();
}
function escapeNotice(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function noticeSign(n){if((n&&n.sign==='+')||(n&&n.sign==='-'))return n.sign;const d=String(n?.desc||'');return d.startsWith('__RFF_SIGN_POS__')?'+':'-'}
function cleanNoticeDesc(s){return String(s||'').replace(/^__RFF_SIGN_(?:NEG|POS)__\s*/,'')}
function renderPending(){
 let p=data().daily.pending,b=$('#badge'),h=$('#pendingList');b.hidden=!p.length;b.textContent=p.length;h.innerHTML=p.length?'':'<div class="hint">Nessuna notifica da confermare.</div>';
 p.forEach((n,i)=>{
  let x=document.createElement('div');x.className='notice';
  const opts=[['Mangiare','food'],...((n.category||'').toLowerCase()==='diesel'&&!customCols().some(c=>(c.name||'').toLowerCase()==='diesel')?[['Diesel','diesel-proposed']]:[]),...customCols().filter(c=>(c.name||'').trim()).map(c=>[c.name.trim(),colKey(c)]),['Varie','varie']].map(([name,key])=>`<option value="${escapeNotice(key)}">${escapeNotice(name)}</option>`).join('');
  const sgn=noticeSign(n);
  x.innerHTML=`<b>${sgn} € ${euro(n.amount)}</b> ${escapeNotice(cleanNoticeDesc(n.desc))}<br><select>${opts}</select> <input type="number" min="1" max="31" value="${validStart()}" style="width:65px"><div class="pendingActions"><button class="confirmPay">Conferma</button><button class="rejectPay">Non confermare</button></div>`;
  const suggested=customCols().find(c=>(c.name||'').toLowerCase()===(n.category||'').toLowerCase());x.querySelector('select').value=suggested?colKey(suggested):(n.category==='Mangiare'?'food':(n.category==='Diesel'?'diesel-proposed':'varie'));if(n.day)x.querySelector('input').value=n.day;
  x.querySelector('.confirmPay').onclick=async()=>{
   if(familyRole!=='owner'||paymentActionBusy)return;
   if(cloudDirty&&!await saveCloud()){alert('Salva prima le modifiche del registro.');return}
   const [yy,mm]=ymParts(),day=Number(x.querySelector('input').value),amount=Number(n.amount);
   if(!Number.isInteger(day)||day<1||day>new Date(yy,mm,0).getDate()||!Number.isFinite(amount)||amount<=0)return;
   let cat=x.querySelector('select').value||'varie';
   if(cat==='diesel-proposed'){let col=customCols().find(c=>(c.name||'').toLowerCase()==='diesel');if(!col){col={id:'diesel',name:'Diesel',budget:0};customCols().push(col)}cat=colKey(col)}
   const current=data();current.daily.entries||(current.daily.entries=[]);
   const entry={id:'n_'+(n.id||crypto.randomUUID()),day,category:cat,amount:(sgn==='-'?-1:1)*amount,desc:cleanNoticeDesc(n.desc)||'Notifica'};
   if(!n.inboxId){current.daily.entries.push(entry);p.splice(i,1);save();renderDaily();return}
   paymentActionBusy=true;x.querySelectorAll('button').forEach(btn=>btn.disabled=true);
   const proposed=JSON.parse(JSON.stringify(db));proposed[month].daily.entries.push(entry);
   try{
    const {error}=await sb.rpc('rff_confirm_payment',{...deviceArgs(),p_inbox_id:n.inboxId,p_data:proposed});if(error)throw error;
    await loadCloud();
   }catch(e){console.log('Conferma:',e);alert('Conferma non completata. Riprova: il pagamento non verrà duplicato.');x.querySelectorAll('button').forEach(btn=>btn.disabled=false)}
   finally{paymentActionBusy=false;await fetchInbox()}
  };
  x.querySelector('.rejectPay').onclick=async()=>{
   if(familyRole!=='owner'||paymentActionBusy)return;if(!confirm('Non confermare questa richiesta? Verrà eliminata senza inserirla nelle spese.'))return;
   x.querySelectorAll('button').forEach(btn=>btn.disabled=true);
   if(n.inboxId){
    const {error}=await sb.rpc('rff_reject_payment',{...deviceArgs(),p_inbox_id:n.inboxId});
    if(error){alert('Rifiuto non riuscito. Riprova.');x.querySelectorAll('button').forEach(btn=>btn.disabled=false);return}
    { const list=data().daily.pending;data().daily.pending=list.filter(v=>v.inboxId!==n.inboxId);localStorage.setItem('rff_verified',JSON.stringify(db)); }
   }else{p.splice(i,1);save()}
   renderPending();
  };
  h.appendChild(x)
 });applyPermissions()
}
$('#monthPick').onchange=e=>{if(!e.target.value)return;ensureMonth(e.target.value);month=e.target.value;save();render()};$('#prevM').onclick=$('#prevM2').onclick=()=>nextMonth(-1);$('#nextM').onclick=$('#nextM2').onclick=()=>nextMonth(1);
$('#addIncome').onclick=()=>add('income');$('#addPlanned').onclick=()=>add('planned');$('#addMove').onclick=()=>add('moves');$('#addRate').onclick=()=>add('rates');
$('#toDaily').onclick=()=>{$('#p1').classList.remove('active');$('#p2').classList.add('active');renderDaily();scrollTo(0,0)};$('#toMonth').onclick=()=>{$('#p2').classList.remove('active');$('#p1').classList.add('active');scrollTo(0,0)};
$('#startDate').onchange=e=>{if(e.target.value.startsWith(month)){data().daily.start=e.target.value;if(!data().daily.viewStart||data().daily.viewStart<e.target.value)data().daily.viewStart=e.target.value;save();renderDaily()}};
[['foodBudget','food'],['satExtra','sat']].forEach(([id,k])=>$('#'+id).onchange=e=>{data().daily[k]=Number(e.target.value)||0;save();renderDaily()});
$('#addCustomColumn').onclick=()=>{const cols=customCols();cols.push({id:'c_'+Date.now()+'_'+Math.random().toString(36).slice(2),name:'',budget:0});save();renderDaily()};
$('#testNotice').onclick=()=>{data().daily.pending.push({amount:12.50,desc:'Pagamento da confermare'});save();renderPending()};
function guessCategory(s){s=String(s||'').toLowerCase();if(/\b(q8|eni|esso|tamoil|keropetrol|totalerg|ip|api)\b|carburant|benzina|gasolio|diesel|distributore|stazione di servizio|fuel/.test(s))return'Diesel';const c=customCols().find(c=>(c.name||'').toLowerCase()&&s.includes((c.name||'').toLowerCase()));if(c)return c.name;if(/supermerc|aliment|conad|coop|lidl|eurospin|esselunga|ristor|bar |pizzeria/.test(s))return'Mangiare';return'Varie'}
async function fetchInbox(){
 if(inboxBusy||!['owner','viewer'].includes(familyRole)||!familyId||paymentActionBusy||$('#pendingList').contains(document.activeElement))return;inboxBusy=true;
 try{
  const {data:rows,error}=await sb.rpc('rff_pending_payments',deviceArgs());if(error)throw error;
  lastInboxSync=Date.now();const byMonth={};
  for(const row of rows||[]){
   const dt=new Date(row.occurred_at);if(!Number.isFinite(dt.getTime()))continue;
   const key=dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'),rawDesc=String(row.description||'');
   (byMonth[key]||(byMonth[key]=[])).push({inboxId:row.id,id:'i_'+row.id,amount:Number(row.amount),desc:rawDesc,sign:rawDesc.startsWith('__RFF_SIGN_POS__')?'+':'-',category:row.suggested_category,day:dt.getDate()});
  }
  let changed=false;
  for(const key of new Set([...Object.keys(db).filter(k=>/^\d{4}-\d{2}$/.test(k)),...Object.keys(byMonth)])){
   const target=db[key]||(db[key]=defaultMonth()),daily=target.daily||(target.daily=defaultMonth().daily);
   const next=[...(daily.pending||[]).filter(n=>!n.inboxId),...(byMonth[key]||[])];
   if(JSON.stringify(daily.pending||[])!==JSON.stringify(next)){daily.pending=next;changed=true}
  }
  if(changed){localStorage.setItem('rff_verified',JSON.stringify(db));renderPending()}
 }catch(e){console.log('Pagamenti in attesa:',e);syncStatus('Pagamenti da confermare non sincronizzati · riprovo',true)}finally{inboxBusy=false}
}
async function sendAndroidPayments(){
 if(!['owner','viewer'].includes(familyRole)||!familyId||!window.RegistroAndroid)return;
 let items=[];try{items=JSON.parse(RegistroAndroid.peekPendingPayments()||'[]')}catch(e){return}
 if(!items.length)return;
 let sent=0;
 for(const x of items){
  const amount=Number(x.amount),dt=new Date(Number(x.timestamp));
  if(!x.id||!Number.isFinite(amount)||amount<=0||!Number.isFinite(dt.getTime()))continue;
  const desc=String(((x.title||'')+' '+(x.text||'')).trim()||'Pagamento rilevato').slice(0,180);
  const {error}=await sb.rpc('rff_send_payment',{...deviceArgs(),p_notification_id:String(x.id),p_amount:amount,p_description:desc,p_occurred_at:dt.toISOString(),p_category:guessCategory(desc)});
  if(error){console.log('Invio pagamento:',error);$('#sendStatus').textContent='Importazione non riuscita. I pagamenti restano sul telefono per riprovare.';continue}
  RegistroAndroid.acknowledgePendingPayments(JSON.stringify([x.id]));sent++;
 }
 if(sent){$('#sendStatus').textContent=sent+' pagamento/i inviato/i. Compariranno tra i pagamenti da confermare sui telefoni autorizzati.';if(familyRole==='owner')await fetchInbox(true)}updateNotificationState()
}
window.sendAndroidPayments=sendAndroidPayments;
function updateNotificationState(){const bridge=window.RegistroAndroid,el=$('#notificationState');if(!el)return;if(!bridge){el.textContent='Le notifiche dei pagamenti si attivano nell’app Android. Sul sito puoi vedere i pagamenti sincronizzati.';return}const enabled=bridge.notificationAccessEnabled?.();const pending=Number(bridge.queuedPaymentCount?.()||0);el.textContent=(enabled===true||enabled==='true'?'Accesso notifiche attivo.':'Accesso notifiche da attivare nelle impostazioni Android.')+' '+pending+' pagamento/i ancora sul telefono. Seleziona le app qui sotto: i pagamenti riconosciuti compariranno in rosso su tutti i telefoni autorizzati dopo la sincronizzazione.'}
$('#authorizeNotices').onclick=()=>window.RegistroAndroid?.openNotificationAccess();
function renderPaymentSources(){
 const host=$('#paymentSources'),bridge=window.RegistroAndroid;
 host.hidden=false;host.textContent='';updateNotificationState();
 if(!bridge?.availablePaymentSources){host.textContent='Questa versione Android non supporta la scelta delle app. Installa la versione Notifiche aggiornata.';return}
 let sources=[];try{sources=JSON.parse(bridge.availablePaymentSources()||'[]')}catch(e){}
 const intro=document.createElement('div');intro.textContent='App di pagamento disponibili sul telefono:';host.appendChild(intro);
 const selectedPackages=new Set(sources.filter(s=>s.enabled).map(s=>s.package));const chosen=()=>[...selectedPackages];
 const saveChosen=()=>{const selected=chosen();bridge.setAllowedPaymentSources(JSON.stringify(selected));$('#sendStatus').textContent=selected.length?'App selezionate. I pagamenti arriveranno in rosso per essere confermati.':'Nessuna app selezionata: nessun pagamento sarà inviato.';if(selected.length)sendAndroidPayments()};
 const addSource=(parent,source)=>{const label=document.createElement('label');label.style.cssText='display:flex;align-items:center;gap:8px;padding:7px 0';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=selectedPackages.has(source.package);checkbox.dataset.package=source.package;const name=document.createElement('span');name.textContent=source.label||source.package;label.append(checkbox,name);parent.appendChild(label);checkbox.onchange=()=>{if(checkbox.checked)selectedPackages.add(source.package);else selectedPackages.delete(source.package);saveChosen()}};
 if(sources.length)sources.forEach(source=>addSource(host,source));
 else{const none=document.createElement('div');none.className='hint';none.textContent='Nessuna delle app principali è installata o ancora rilevata.';host.appendChild(none)}
 if(!bridge?.discoverInstalledApps){const hint=document.createElement('div');hint.className='hint';hint.textContent='Se non trovi la tua app, effettua un pagamento e riapri questa lista: dopo la prima notifica potrà essere rilevata automaticamente.';host.appendChild(hint);return}
 const findBtn=document.createElement('button');findBtn.type='button';findBtn.textContent='🔎 Cerca altre banche o app di pagamento';findBtn.style.marginTop='8px';host.appendChild(findBtn);
 const search=document.createElement('input');search.type='search';search.placeholder='Nome banca o app (almeno 2 lettere)';search.style.cssText='width:100%;margin-top:8px';search.hidden=true;host.appendChild(search);
 const extra=document.createElement('div');extra.hidden=true;host.appendChild(extra);
 const likelyPaymentApp=s=>/wallet|pay|paga|banc|bank|poste|postepay|satispay|revolut|n26|hype|isybank|unicredit|intesa|fineco|bper|buddy|bancomat|sumup|curve|wise|credit|american express|amex|klarna|scalapay|sella|mediolanum|illimity|tinaba|mooney|nexi|bbva/.test((String(s.label||'')+' '+String(s.package||'')).toLowerCase());
 findBtn.onclick=()=>{
  let all=[];try{all=JSON.parse(bridge.discoverInstalledApps()||'[]')}catch(e){}
  all.filter(s=>s.enabled).forEach(s=>selectedPackages.add(s.package));
  const primary=new Set(sources.map(s=>s.package)),extras=all.filter(s=>!primary.has(s.package));
  search.hidden=false;extra.hidden=false;findBtn.hidden=true;
  const help=document.createElement('p');help.className='hint';help.textContent='Cerchiamo sul tuo telefono. Qui proponiamo banche e app di pagamento. Se manca la tua, scrivi almeno 2 lettere del nome per cercarla tra le app installate.';host.insertBefore(help,search);
  const draw=()=>{
   const q=search.value.trim().toLowerCase();extra.textContent='';
   const rows=extras.filter(s=>q.length>=2?(String(s.label||'')+' '+String(s.package||'')).toLowerCase().includes(q):(selectedPackages.has(s.package)||likelyPaymentApp(s))).slice(0,80);
   if(!rows.length){const none=document.createElement('p');none.className='hint';none.textContent='Nessun’altra app di pagamento riconosciuta. Cerca la tua banca per nome.';extra.appendChild(none);return}
   rows.forEach(source=>addSource(extra,source))
  };search.oninput=draw;draw();search.focus()
 };
}
$('#sourcesButton').onclick=renderPaymentSources;
$('#sendNotices').onclick=sendAndroidPayments;
async function showPairingRequests(){
 if(familyRole!=='owner'){ $('#pairingCard').hidden=true; return; }
 const {data:requests,error}=await sb.rpc('rff_pending_devices',deviceArgs());
 if(error){console.log('Abbinamento:',error);$('#pairingCard').hidden=true;return}
 const list=$('#pairingList');list.textContent='';
 if(!requests?.length){$('#pairingCard').hidden=true;return}
 $('#pairingCard').hidden=false;
 for(const request of requests){
  const line=document.createElement('div');line.className='notice';
  const label=document.createElement('span');label.textContent='Telefono in attesa · codice '+request.id.slice(-6)+' ';
  const button=document.createElement('button');button.textContent='Autorizza';
  button.onclick=async()=>{
   button.disabled=true;reject.disabled=true;
   const {error}=await sb.rpc('rff_approve_device',{...deviceArgs(),p_candidate_id:request.id});
   if(error){alert('Autorizzazione non riuscita. Riprova.');button.disabled=false;reject.disabled=false;return}
   showPairingRequests();
  };
  const reject=document.createElement('button');reject.textContent='Rifiuta';reject.style.marginLeft='8px';reject.style.background='#c62828';reject.style.color='#fff';reject.style.borderColor='#c62828';
  reject.onclick=async()=>{if(!confirm('Rifiutare questa richiesta di autorizzazione?'))return;button.disabled=true;reject.disabled=true;const {error}=await sb.rpc('rff_reject_device',{...deviceArgs(),p_candidate_id:request.id});if(error){alert('Rifiuto non riuscito. Riprova.');button.disabled=false;reject.disabled=false;return}showPairingRequests()};
  line.append(label,button,reject);list.appendChild(line);
 }
}
function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.querySelector(id).classList.add('active');window.scrollTo(0,0)}
async function syncBoard(renderIfOpen=true){
 if(!sb||!familyId||!['owner','viewer'].includes(familyRole))return false;
 try{const {data:items,error}=await sb.rpc('rff_board_get',deviceArgs());if(error)throw error;db._board=Array.isArray(items)?items:[];try{localStorage.setItem('rff_verified',JSON.stringify(db))}catch(e){}if(renderIfOpen&&$('#p3').classList.contains('active'))renderBoard();return true}catch(e){console.log('Lavagna sync:',e);return false}
}
async function syncCalendar(renderIfOpen=true){
 if(!sb||!familyId||!['owner','viewer'].includes(familyRole))return false;
 try{const {data:items,error}=await sb.rpc('rff_calendar_get',deviceArgs());if(error)throw error;db._calendar=Array.isArray(items)?items:[];try{localStorage.setItem('rff_verified',JSON.stringify(db))}catch(e){}if(renderIfOpen&&$('#p3').classList.contains('active'))renderCalendar();return true}catch(e){console.log('Calendario sync:',e);return false}
}
function targetApplies(it){
 const target=String(it?.target||'both'),creator=String(it?.createdBy||'');
 return target==='both'||(target==='creator'&&creator===deviceId)||(target==='other'&&creator!==deviceId)
}
function targetLabel(it){
 const target=String(it?.target||'both');return target==='creator'?'questo telefono':target==='other'?'altro telefono':'entrambi'
}
function syncNativeFamilyTools(){
 const bridge=window.FamilyAndroid;if(!bridge)return;
 const reminders=[];
 for(const it of boardData()){if(!it||typeof it!=='object'||!it.dueAt||!targetApplies(it))continue;const at=Date.parse(it.dueAt);if(Number.isFinite(at)&&at>Date.now()-60000)reminders.push({id:'board:'+it.id,title:'Lavagna familiare',text:String(it.text||'Promemoria'),atMillis:at})}
 const google=[];
 for(const it of allCalendarEvents()){if(!it||!targetApplies(it))continue;const start=Date.parse(it.startAt),end=Date.parse(it.endAt);if(!Number.isFinite(start))continue;const mins=Math.max(0,Number(it.reminderMinutes)||0),notifyAt=start-mins*60000;if(notifyAt>Date.now()-60000)reminders.push({id:'calendar:'+it.id,title:String(it.title||'Appuntamento'),text:String(it.note||'Calendario familiare'),atMillis:notifyAt});if(it.googleSync&&Number.isFinite(end))google.push({id:String(it.id),title:String(it.title||'Appuntamento'),description:String(it.note||'Calendario familiare'),startMillis:start,endMillis:end,reminderMinutes:mins})}
 try{bridge.syncFamilyReminders?.(JSON.stringify(reminders))}catch(e){console.log('Promemoria Android:',e)}
 try{bridge.syncGoogleCalendarEvents?.(JSON.stringify(google))}catch(e){console.log('Google Calendar:',e)}
}
function renderBoard(){
 const host=$('#boardList');if(!host)return;host.innerHTML='';const items=boardData();if(!items.length){const e=document.createElement('div');e.className='hint';e.textContent='Nessun appunto. Aggiungi qui cose da comprare o promemoria.';host.appendChild(e);return}
 items.forEach((it,i)=>{const row=document.createElement('div');row.className='boardItem';const wrap=document.createElement('div');const t=document.createElement('div');t.textContent=typeof it==='string'?it:(it.text||'');wrap.appendChild(t);if(it&&typeof it==='object'&&it.dueAt){const meta=document.createElement('div');meta.className='hint';const dt=new Date(it.dueAt);meta.textContent='⏰ '+(Number.isFinite(dt.getTime())?dt.toLocaleString('it-IT'):'')+' · '+targetLabel(it);wrap.appendChild(meta)}const b=document.createElement('button');b.textContent='✓ Fatto / elimina';
  b.onclick=async()=>{if(!sb||!familyId){alert('Sincronizzazione non disponibile. Riprova tra qualche secondo.');return}const itemId=(it&&typeof it==='object')?it.id:null;if(!itemId){if(familyRole==='owner'){boardData().splice(i,1);save();renderBoard()}return}b.disabled=true;const {error}=await sb.rpc('rff_board_delete',{...deviceArgs(),p_item_id:String(itemId)});if(error){alert('Eliminazione non riuscita. Controlla Internet e riprova.');b.disabled=false;return}await syncBoard(true);syncNativeFamilyTools()};
  row.append(wrap,b);host.appendChild(row)
 })
}
$('#boardAdd').onclick=async()=>{
 const inp=$('#boardText'),value=inp.value.trim();if(!value)return;if(!sb||!familyId){alert('Sincronizzazione non disponibile. Riprova tra qualche secondo.');return}
 const date=$('#boardReminderDate').value,time=$('#boardReminderTime').value,target=$('#boardReminderTarget').value||'both';
 let due=null;if(date&&time){const dt=new Date(date+'T'+time+':00');if(!Number.isFinite(dt.getTime())||dt.getTime()<=Date.now()){alert('Scegli un giorno e un orario futuri.');return}due=dt.toISOString()}else if(date||time){alert('Per la notifica inserisci sia il giorno sia l’orario.');return}
 const btn=$('#boardAdd');btn.disabled=true;const old=btn.textContent;btn.textContent='Invio…';const itemId='b_'+deviceId+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
 const {error}=await sb.rpc('rff_board_add_v2',{...deviceArgs(),p_item_id:itemId,p_text:value.slice(0,300),p_at:new Date().toISOString(),p_due_at:due,p_target:target});
 if(error){alert('Invio alla lavagna non riuscito. Controlla Internet e riprova.');btn.disabled=false;btn.textContent=old;return}
 inp.value='';$('#boardReminderDate').value='';$('#boardReminderTime').value='';await syncBoard(true);syncNativeFamilyTools();btn.disabled=false;btn.textContent=old
};
$('#boardText').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#boardAdd').click()}});

function calendarParts(){const [y,m]=calendarMonth.split('-').map(Number);return [y,m]}
function calendarTitleText(){const [y,m]=calendarParts();return new Date(y,m-1,1).toLocaleDateString('it-IT',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase())}
function calendarMove(delta){const [y,m]=calendarParts(),d=new Date(y,m-1+delta,1);calendarMonth=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');renderCalendar()}
function renderCalendar(){
 const grid=$('#calendarGrid');if(!grid)return;$('#calendarTitle').textContent=calendarTitleText();grid.innerHTML='';
 const [y,m]=calendarParts(),first=new Date(y,m-1,1),offset=(first.getDay()+6)%7,last=new Date(y,m,0).getDate(),prevLast=new Date(y,m-1,0).getDate();
 const allEvents=allCalendarEvents(),events=allEvents.filter(e=>String(e.startAt||'').slice(0,7)===calendarMonth).sort((a,b)=>Date.parse(a.startAt)-Date.parse(b.startAt));
 for(let cell=0;cell<42;cell++){
  let day=cell-offset+1,cy=y,cm=m,other=false;
  if(day<1){other=true;const pd=new Date(y,m-2,1);cy=pd.getFullYear();cm=pd.getMonth()+1;day=prevLast+day}
  else if(day>last){other=true;const nd=new Date(y,m,1);cy=nd.getFullYear();cm=nd.getMonth()+1;day-=last}
  const key=cy+'-'+String(cm).padStart(2,'0')+'-'+String(day).padStart(2,'0'),dayEvents=allEvents.filter(e=>String(e.startAt||'').slice(0,10)===key);
  const box=document.createElement('div');box.className='calendarDay'+(other?' other':'')+(dayEvents.length?' hasEvents':'');
  const today=new Date();if(cy===today.getFullYear()&&cm===today.getMonth()+1&&day===today.getDate())box.classList.add('today');
  box.innerHTML='<div class="dayNum">'+day+'</div>'+dayEvents.slice(0,2).map(e=>'<div class="eventMini">'+escapeNotice(e.title||'Appuntamento')+'</div>').join('')+'<button type="button" aria-label="Scegli '+key+'"></button>';
  box.querySelector('button').onclick=()=>{$('#calendarEventDate').value=key;$('#calendarAddPanel').open=true;$('#calendarEventTitle').focus()};grid.appendChild(box)
 }
 const list=$('#calendarEventList');list.innerHTML='';
 if(!events.length){list.innerHTML='<div class="hint">Nessun appuntamento in questo mese.</div>'}else events.forEach(it=>{
  const row=document.createElement('div');row.className='calendarEvent';const content=document.createElement('div'),start=new Date(it.startAt);
  content.innerHTML='<b>'+escapeNotice(it.title||'Appuntamento')+'</b><div class="when">'+escapeNotice(start.toLocaleString('it-IT',{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}))+'</div><div class="meta">'+escapeNotice(it.note||'')+' <span class="targetChip">'+escapeNotice(targetLabel(it))+'</span>'+(it.googleSync?' <span class="targetChip">Google</span>':'')+(it.source==='rate'?' <span class="targetChip">Rata</span>':'')+'</div>';
  const del=document.createElement('button');del.type='button';
  if(it.source==='rate'){del.textContent='Apri rata';del.style.background='#0b4f8a';del.style.borderColor='#0b4f8a';del.onclick=()=>{month=it.sourceMonth;ensureMonth(month);showPage('#p1');render();setTimeout(()=>document.getElementById('rateRows')?.scrollIntoView({behavior:'smooth',block:'center'}),50)}}
  else{del.textContent='Elimina';del.onclick=async()=>{const eventId=String(it.id||'');if(!eventId)return;del.disabled=true;del.textContent='Elimino…';const items=calendarData(),index=items.findIndex(x=>String(x?.id||'')===eventId),backup=index>=0?JSON.parse(JSON.stringify(items[index])):null;if(index>=0){items.splice(index,1);try{localStorage.setItem('rff_verified',JSON.stringify(db))}catch(_){}renderCalendar()}try{if(!sb||!familyId)throw new Error('sincronizzazione non disponibile');const {data:ok,error}=await sb.rpc('rff_calendar_delete',{...deviceArgs(),p_event_id:eventId});if(error)throw error;await syncCalendar(false);if(calendarData().some(x=>String(x?.id||'')===eventId))throw new Error('la voce risulta ancora presente sul server');try{window.FamilyAndroid?.cancelReminder?.('calendar:'+eventId)}catch(_){}syncNativeFamilyTools();renderCalendar()}catch(e){if(backup&&!calendarData().some(x=>String(x?.id||'')===eventId))calendarData().push(backup);try{localStorage.setItem('rff_verified',JSON.stringify(db))}catch(_){}renderCalendar();syncNativeFamilyTools();alert('Eliminazione non riuscita: '+(e?.message||'errore'))}}};
  row.append(content,del);list.appendChild(row)
 });
 renderCalendarNativeSettings()
}
$('#calendarPrev').onclick=()=>calendarMove(-1);$('#calendarNext').onclick=()=>calendarMove(1);
$('#calendarEventAdd').onclick=async()=>{
 const title=$('#calendarEventTitle').value.trim(),date=$('#calendarEventDate').value,time=$('#calendarEventTime').value||'09:00';if(!title||!date){alert('Inserisci titolo e giorno.');return}
 const start=new Date(date+'T'+time+':00'),duration=Number($('#calendarEventDuration').value)||60;if(!Number.isFinite(start.getTime()))return;
 const end=new Date(start.getTime()+duration*60000),reminder=Number($('#calendarEventReminder').value)||0,target=$('#calendarEventTarget').value||'both',google=$('#calendarEventGoogle').value==='yes',note=$('#calendarEventNote').value.trim();
 const id='c_'+deviceId+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8),btn=$('#calendarEventAdd');btn.disabled=true;
 const {error}=await sb.rpc('rff_calendar_add',{...deviceArgs(),p_event_id:id,p_title:title.slice(0,160),p_start_at:start.toISOString(),p_end_at:end.toISOString(),p_note:note.slice(0,500),p_target:target,p_reminder_minutes:reminder,p_google_sync:google});
 btn.disabled=false;if(error){alert('Salvataggio appuntamento non riuscito.');return}
 $('#calendarEventTitle').value='';$('#calendarEventNote').value='';$('#calendarAddPanel').open=false;calendarMonth=date.slice(0,7);await syncCalendar(true);syncNativeFamilyTools()
};
function renderCalendarNativeSettings(){
 const bridge=window.FamilyAndroid,status=$('#calendarNativeStatus'),sel=$('#androidCalendarSelect');if(!status||!sel)return;
 if(!bridge){status.textContent='Notifiche automatiche e Google Calendar sono disponibili nell’app Android aggiornata.';sel.hidden=true;return}
 let notify=false,cal=false;try{notify=bridge.reminderPermissionGranted?.()===true||bridge.reminderPermissionGranted?.()==='true'}catch(e){}try{cal=bridge.calendarPermissionGranted?.()===true||bridge.calendarPermissionGranted?.()==='true'}catch(e){}
 status.textContent='Notifiche: '+(notify?'attive':'da autorizzare')+' · Calendario: '+(cal?'autorizzato':'da autorizzare');
 if(!cal){sel.hidden=true;return}
 let rows=[];try{rows=JSON.parse(bridge.availableCalendars?.()||'[]')}catch(e){}const chosen=String(bridge.preferredCalendarId?.()||'');sel.innerHTML='';rows.forEach(c=>{const o=document.createElement('option');o.value=String(c.id);o.textContent=(c.name||'Calendario')+(c.accountName?' · '+c.accountName:'');sel.appendChild(o)});sel.hidden=!rows.length;if(chosen&&[...sel.options].some(o=>o.value===chosen))sel.value=chosen;else if(rows.length){sel.value=String(rows[0].id);bridge.setPreferredCalendar?.(sel.value)}
 if(!rows.length)status.textContent+=' · Nessun calendario scrivibile trovato sul telefono.';else syncNativeFamilyTools()
}
$('#calendarPermissions').onclick=()=>window.FamilyAndroid?.requestFamilyPermissions?.();
$('#calendarRefreshAccounts').onclick=renderCalendarNativeSettings;
$('#androidCalendarSelect').onchange=e=>{window.FamilyAndroid?.setPreferredCalendar?.(String(e.target.value));syncNativeFamilyTools()};
$('#toBoard').onclick=async()=>{showPage('#p3');await syncBoard(false);await syncCalendar(false);renderBoard();renderCalendar();syncNativeFamilyTools()};
$('#toBoard2').onclick=async()=>{showPage('#p3');await syncBoard(false);await syncCalendar(false);renderBoard();renderCalendar();syncNativeFamilyTools()};
$('#boardBack').onclick=()=>showPage('#p1');$('#boardDaily').onclick=()=>showPage('#p2');

render();
const gate=$('#authGate'),msg=$('#authMsg'),email=$('#authEmail'),pass=$('#authPassword'),newPass=$('#authNewPassword');
let recovering=false;
function say(message,ok=false){msg.textContent=message;msg.className='authMsg '+(ok?'ok':'err')}
function passwordMode(active){recovering=active;newPass.hidden=!active;$('#setPasswordBtn').hidden=!active;pass.hidden=active;$('#loginBtn').hidden=active;$('#signupBtn').hidden=active;$('#resetBtn').hidden=active}
function redirectUrl(){return location.protocol==='https:'?new URL('./',location.href).href:'https://coruscating-kitsune-2dab6d.netlify.app/'}
async function enter(session){
 if(recovering)return;
 if(!session?.user){gate.classList.remove('hidden');return}
 familyId=null;familyRole=null;clearInterval(roleTimer);clearInterval(pendingTimer);$('#userEmail').textContent=session.user.email||'';say('Collegamento al registro familiare…',true);
 try{
  if(!await resolveFamily())throw new Error('Account non collegato alla famiglia.');
  const {data:device,error:pairError}=await sb.rpc('rff_register_device',{...deviceArgs(),p_label:'Telefono '+deviceId.slice(-6)});
  if(pairError)throw pairError;
  familyRole=(device.status==='active'&&accountRole==='owner')?'owner':'viewer';if(familyRole==='viewer')$('#addEntry').textContent='Invia da confermare';else $('#addEntry').textContent='+ Aggiungi pagamento';
  if(device.status==='pending'){
   say('Questo telefono è in attesa. Sul principale autorizza il codice '+deviceId.slice(-6)+'.',true);
   pendingTimer=setInterval(async()=>{
    const {data:status,error}=await sb.rpc('rff_device_status',deviceArgs());
    if(!error&&status?.status==='active'){clearInterval(pendingTimer);await enter(session)}
   },15000);
   return;
  }
  if(window.RegistroAndroid?.configureBackgroundSync)RegistroAndroid.configureBackgroundSync(String(familyId),String(deviceId),String(deviceSecret));
  await loadCloud();await syncBoard(false);await syncCalendar(false);syncNativeFamilyTools();gate.classList.add('hidden');say('');updateNotificationState();
  if(familyRole==='owner'){await sendAndroidPayments();await fetchInbox(true);await showPairingRequests()}else await sendAndroidPayments();
  roleTimer=setInterval(syncFamily,4000);

 }
 catch(e){gate.classList.remove('hidden');say('Accesso al registro: '+(e?.message||'errore di connessione'))}
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncFamily()});
window.addEventListener('focus',syncFamily);window.addEventListener('pageshow',syncFamily);
$('#loginBtn').onclick=async()=>{
 if(!sb)return say('Connessione non disponibile. Riprova con Internet attivo.');
 say('Accesso…',true);
 const {data,error}=await sb.auth.signInWithPassword({email:email.value.trim(),password:pass.value});
 if(error)return say(error.message);pass.value='';await enter(data.session);
};
$('#signupBtn').onclick=async()=>{
 if(!sb)return say('Connessione non disponibile.');
 if(pass.value.length<6)return say('La password deve avere almeno 6 caratteri.');
 say('Registrazione…',true);
 const {data,error}=await sb.auth.signUp({email:email.value.trim(),password:pass.value,options:{emailRedirectTo:redirectUrl()}});
 if(error)return say(error.message);
 if(data.session)await enter(data.session);
 else say('Registrazione effettuata. Controlla la tua email per confermare l’account.',true);
};
$('#resetBtn').onclick=async()=>{
 if(!sb)return say('Connessione non disponibile.');
 if(!email.value.trim())return say('Inserisci prima la tua email.');
 const {error}=await sb.auth.resetPasswordForEmail(email.value.trim(),{redirectTo:redirectUrl()});
 if(error)return say(error.message);say('Email di recupero inviata. Controlla la posta.',true);
};
$('#setPasswordBtn').onclick=async()=>{
 if(newPass.value.length<6)return say('La nuova password deve avere almeno 6 caratteri.');
 const {error}=await sb.auth.updateUser({password:newPass.value});
 if(error)return say(error.message);
 newPass.value='';passwordMode(false);say('Password aggiornata.',true);
 const {data}=await sb.auth.getSession();await enter(data.session);
};
$('#logoutBtn').onclick=async()=>{
 clearTimeout(cloudTimer);clearInterval(roleTimer);clearInterval(pendingTimer);familyId=null;familyRole=null;gate.classList.remove('hidden');$('#userEmail').textContent='';
 const {error}=await sb.auth.signOut();if(error)return say(error.message);say('Disconnesso.',true);
};
// Aggiornamento automatico del giorno: mantiene anche valori negativi.
// Mangiare accumula ogni nuovo budget giornaliero; le colonne mensili trascinano solo la rimanenza.
let lastCalendarDay=now.toDateString();
setInterval(()=>{
 const fresh=new Date();
 if(fresh.toDateString()!==lastCalendarDay){
   now=fresh;lastCalendarDay=fresh.toDateString();
   const todayMonth=fresh.getFullYear()+'-'+String(fresh.getMonth()+1).padStart(2,'0');
   if(month===todayMonth){data().daily.viewStart=todayMonth+'-'+String(fresh.getDate()).padStart(2,'0');save()}
   if($('#p2').classList.contains('active')) renderDaily();
 } else now=fresh;
},30000);

if(sb){
 sb.auth.onAuthStateChange((event)=>{
  if(event==='PASSWORD_RECOVERY'){gate.classList.remove('hidden');passwordMode(true);say('Inserisci la nuova password.',true)}
  else if(event==='SIGNED_OUT'){clearTimeout(cloudTimer);clearInterval(roleTimer);clearInterval(pendingTimer);familyId=null;familyRole=null;gate.classList.remove('hidden')}
 });
 (async()=>{try{const {data,error}=await sb.auth.getSession();if(error)throw error;await enter(data.session)}catch(e){say('Accesso non disponibile: '+(e?.message||'errore'))}})();
}else say('Connessione non disponibile. Riprova con Internet attivo.');
})();

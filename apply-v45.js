function applyV45(text){
 const must=(cond,msg)=>{if(!cond)throw new Error('V45: '+msg)};
 if(typeof window.applyV43==='function') text=window.applyV43(text);
 else throw new Error('V45: patch V43 non disponibile');
 text=text.replace('<title>Registro Finanziario Familiare V43</title>','<title>Registro Finanziario Familiare V45</title>');
 const start=text.indexOf('function renderPaymentSources(){');
 const marker="\n$('#sourcesButton').onclick=renderPaymentSources;";
 const end=text.indexOf(marker,start);
 must(start>=0&&end>start,'selettore app pagamento non trovato');
 const replacement=`function renderPaymentSources(){
 const host=$('#paymentSources'),bridge=window.RegistroAndroid;
 host.hidden=false;host.textContent='';
 if(!bridge?.availablePaymentSources){host.textContent='Questa versione Android non supporta la scelta delle app. Installa la versione Notifiche aggiornata.';return}
 let sources=[];try{sources=JSON.parse(bridge.availablePaymentSources()||'[]')}catch(e){}
 const intro=document.createElement('div');intro.textContent='App di pagamento disponibili sul telefono:';host.appendChild(intro);
 const chosen=()=>[...host.querySelectorAll('input[type=checkbox][data-package]:checked')].map(el=>el.dataset.package);
 const saveChosen=()=>{const selected=chosen();bridge.setAllowedPaymentSources(JSON.stringify(selected));$('#sendStatus').textContent=selected.length?'App selezionate. I pagamenti arriveranno in rosso per essere confermati.':'Nessuna app selezionata: nessun pagamento sarà inviato.';if(selected.length)sendAndroidPayments()};
 const addSource=(parent,source)=>{const label=document.createElement('label');label.style.cssText='display:flex;align-items:center;gap:8px;padding:7px 0';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=!!source.enabled;checkbox.dataset.package=source.package;const name=document.createElement('span');name.textContent=source.label||source.package;label.append(checkbox,name);parent.appendChild(label);checkbox.onchange=saveChosen};
 if(sources.length)sources.forEach(source=>addSource(host,source));
 else{const none=document.createElement('div');none.className='hint';none.textContent='Nessuna delle app principali è installata o ancora rilevata.';host.appendChild(none)}
 if(!bridge?.discoverInstalledApps){const hint=document.createElement('div');hint.className='hint';hint.textContent='Se non trovi la tua app, effettua un pagamento e riapri questa lista: dopo la prima notifica potrà essere rilevata automaticamente.';host.appendChild(hint);return}
 const findBtn=document.createElement('button');findBtn.type='button';findBtn.textContent='🔎 Trova altre app installate';findBtn.style.marginTop='8px';host.appendChild(findBtn);
 const search=document.createElement('input');search.type='search';search.placeholder='Cerca nome app';search.style.cssText='width:100%;margin-top:8px';search.hidden=true;host.appendChild(search);
 const extra=document.createElement('div');extra.hidden=true;host.appendChild(extra);
 findBtn.onclick=()=>{let all=[];try{all=JSON.parse(bridge.discoverInstalledApps()||'[]')}catch(e){}const primary=new Set(sources.map(s=>s.package));const extras=all.filter(s=>!primary.has(s.package));search.hidden=false;extra.hidden=false;findBtn.hidden=true;const draw=()=>{const q=search.value.trim().toLowerCase();extra.textContent='';const rows=extras.filter(s=>!q||(s.label||s.package).toLowerCase().includes(q)).slice(0,120);if(!rows.length){extra.innerHTML='<div class="hint">Nessun’altra app trovata. Se manca la tua, dopo una sua notifica di pagamento riapri questa schermata.</div>';return}rows.forEach(source=>addSource(extra,source))};search.oninput=draw;draw();search.focus()};
}`;
 text=text.slice(0,start)+replacement+text.slice(end);
 text=text.replace('service-worker.js?v=20260928-v43b','service-worker.js?v=20260928-v45');
 text=text.replace('<!-- Registro Finanziario Familiare V43 - owner completo su ogni dispositivo approvato -->','<!-- Registro Finanziario Familiare V45 - selezione app pagamento estesa -->');
 return text;
}

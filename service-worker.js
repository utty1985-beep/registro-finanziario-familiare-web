const CACHE='rff-20261001-v85-calendar-cleanup';
const SW_VERSION='20261001-v85-calendar-cleanup';
const ASSETS=[
  './','./index.html','./manifest.json','./icon-192.png?v=80-icon','./icon-512.png?v=80-icon',
  './v56-ui.js','./v56-main.js','./v57-polish.js','./v58-red-button.js','./v61-longpress-toggle.js','./v63-month-stability.js','./v64-sentinel-role.js','./v65-varie-collapse.js','./v85-calendar-fix.js'
];

function patchHtml(html){
  let out=html.replace(/service-worker\.js\?v=[^'" ]+/g,'service-worker.js?v='+SW_VERSION);

  // V82: le spese preventivate entrano in Varie soltanto con la spunta.
  // Le rate possono essere aggiunte a Varie con una spunta dedicata salvata nel metadata della rata.
  out=out.replace(
    "const selected=arr.map((r,i)=>({r,i})).filter(x=>x.r[2]&&!x.r[4]&&!hidden[x.i]);",
    "const selected=[...arr.map((r,i)=>({r,i,kind:'planned'})),...data().rates.map((r,i)=>({r,i,kind:'rates'}))].filter(x=>x.kind==='planned'?!!x.r[2]:!!(x.r[5]&&x.r[5].varie));"
  );
  out=out.replace(
    "selected.forEach(({r,i})=>{",
    "selected.forEach(({r,i,kind})=>{"
  );
  out=out.replace(
    "const matching=adjustments.filter(x=>x.row===i);",
    "const match=x=>x.row===i&&(x.kind||'planned')===kind;const matching=adjustments.filter(match);"
  );
  out=out.replace(
    "const total=()=>Number(r[1]||0)+adjustments.filter(x=>x.row===i).reduce((n,x)=>n+Number(x.amount||0),0);",
    "const total=()=>Number(r[1]||0)+adjustments.filter(match).reduce((n,x)=>n+Number(x.amount||0),0);"
  );
  out=out.replace(
    "adjustments.push({id:Date.now()+'-'+Math.random().toString(36).slice(2),row:i,amount:(sign.value==='-'?-1:1)*n});",
    "adjustments.push({id:Date.now()+'-'+Math.random().toString(36).slice(2),row:i,kind,amount:(sign.value==='-'?-1:1)*n});"
  );

  // Checkbox nella riga Rate: usa meta.varie, così le rate esistenti non vengono selezionate automaticamente.
  out=out.replace(
    "${kind==='planned'?`<input class=\"keep\" type=\"checkbox\" title=\"Mostra in Varie\" aria-label=\"Mostra in Varie\" ${r[2]?'checked':''}>`:''}",
    "${kind==='planned'?`<input class=\"keep\" type=\"checkbox\" title=\"Mostra in Varie\" aria-label=\"Mostra in Varie\" ${r[2]?'checked':''}>`:kind==='rates'?`<input class=\"keep\" type=\"checkbox\" title=\"Mostra questa rata in Varie\" aria-label=\"Mostra questa rata in Varie\" ${(r[5]&&r[5].varie)?'checked':''}>`:''}"
  );
  out=out.replace(
    "d.className='row'+(kind==='planned'?' plannedRow':kind==='income'?'':' signedRow')+(r[4]?' pendingCarry':'');",
    "d.className='row'+(kind==='planned'?' plannedRow':kind==='rates'?' signedRow rateVarieRow':kind==='income'?'':' signedRow')+(r[4]?' pendingCarry':'');"
  );

  // La spunta delle preventivate continua a comandare Varie; per le rate salviamo meta.varie.
  out=out.replace(
    "if(kind==='planned')ins[2].onchange=e=>{r[2]=e.target.checked;save();renderDaily()}",
    "if(kind==='planned')ins[2].onchange=e=>{r[2]=e.target.checked;const hidden=data().daily.varieHidden||(data().daily.varieHidden={});delete hidden[i];save();renderDaily()};if(kind==='rates')ins[2].onchange=e=>{const meta=rateMeta(r,true);meta.varie=e.target.checked;save();renderDaily()}"
  );

  // Cancellare da Varie toglie la relativa spunta nella sezione di origine.
  out=out.replace(
    "del.onclick=()=>{if(familyRole!=='owner')return;hidden[i]=true;save();renderVarieSingle()}",
    "del.onclick=()=>{if(familyRole!=='owner')return;if(kind==='rates'){const meta=rateMeta(r,true);meta.varie=false}else r[2]=false;save();renderVarieSingle()}"
  );

  // V84: nella riga rossa di oggi mostra il residuo come valore principale
  // sia per Mangiare sia per Diesel/Metano/Benzina e tutte le colonne personalizzate.
  out=out.replace(
    "  let cells=activeCols.map(c=>{const k=colKey(c);spent[k]+=(+sp[k]||0)-entriesFor(day,k);return cell(day,k,entriesFor(day,k)-(+sp[k]||0),(+c.budget||0)-spent[k],'residuo')}).join('');",
    "  const isToday=y===now.getFullYear()&&m===now.getMonth()+1&&day===now.getDate();\n  let cells=activeCols.map(c=>{const k=colKey(c);spent[k]+=(+sp[k]||0)-entriesFor(day,k);const monthlyResidual=(+c.budget||0)-spent[k];return isToday ? `<td class=\"moneyCell\"><strong>€ ${euro(monthlyResidual)}</strong><span class=\"res\">Budget mensile: <strong>€ ${euro(+c.budget||0)}</strong></span></td>` : cell(day,k,entriesFor(day,k)-(+sp[k]||0),monthlyResidual,'residuo')}).join('');"
  );
  out=out.replace(
    "  let tr=document.createElement('tr');if(y===now.getFullYear()&&m===now.getMonth()+1&&day===now.getDate())tr.className='today';",
    "  const todayFoodBudget=(+d.food||0)+(isSat?(+d.sat||0):0);\n  const foodHtml=isToday ? `<td class=\"moneyCell\"><strong>€ ${euro(foodCarry)}</strong><span class=\"res\">Budget giornaliero: <strong>€ ${euro(todayFoodBudget)}</strong></span></td>` : cell(day,'food',entriesFor(day,'food')-(+sp.food||0),foodCarry,'residuo');\n  let tr=document.createElement('tr');if(isToday)tr.className='today';"
  );
  out=out.replace(
    "  tr.innerHTML=`<td class=\"day\">${dt.toLocaleDateString('it-IT',{weekday:'short'})} ${day}</td>${cell(day,'food',entriesFor(day,'food')-(+sp.food||0),foodCarry,'residuo')}${cells}`;if(day>=displayStart)body.appendChild(tr)",
    "  tr.innerHTML=`<td class=\"day\">${dt.toLocaleDateString('it-IT',{weekday:'short'})} ${day}</td>${foodHtml}${cells}`;if(day>=displayStart)body.appendChild(tr)"
  );

  if(!out.includes('rff-v82-rates-varie-style')){
    out=out.replace('</head>',`<style id="rff-v82-rates-varie-style">
.row.rateVarieRow{grid-template-columns:minmax(90px,1fr) 42px 100px 42px 42px}
@media(max-width:650px){
 .row.rateVarieRow{grid-template-columns:30px minmax(0,1fr) 25px 30px 30px}
 .row.rateVarieRow>input[type="text"]{grid-column:1/-1}
 .row.rateVarieRow>input[type="number"]{grid-column:2/4}
 .row.rateVarieRow>.keep{grid-column:4;width:20px;height:20px;margin:auto}
 .row.rateVarieRow>.del{grid-column:5}
 .row.rateVarieRow>.rateReminder{grid-column:1/-1}
}
</style></head>`);
  }

  if(!out.includes('v63-month-stability.js')){
    out=out.replace('</body>','<script src="./v63-month-stability.js?v='+SW_VERSION+'"></script>\n</body>');
  }
  if(!out.includes('v64-sentinel-role.js')){
    out=out.replace('</body>','<script src="./v64-sentinel-role.js?v='+SW_VERSION+'"></script>\n</body>');
  }
  if(!out.includes('v65-varie-collapse.js')){
    out=out.replace('</body>','<script src="./v65-varie-collapse.js?v='+SW_VERSION+'"></script>\n</body>');
  }
  if(!out.includes('v85-calendar-fix.js')){
    out=out.replace('</body>','<script src="./v85-calendar-fix.js?v='+SW_VERSION+'"></script>\n</body>');
  }
  return out;
}

async function patchedResponse(response){
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;
  const text=patchHtml(await response.text());
  const headers=new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control','no-store');
  return new Response(text,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(ASSETS))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith((async()=>{
    try{
      let response=await fetch(event.request,{cache:'no-store'});
      if(event.request.mode==='navigate')response=await patchedResponse(response);
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
      return response;
    }catch(_){
      let response=await caches.match(event.request,{ignoreSearch:true});
      if(!response&&event.request.mode==='navigate')response=await caches.match('./index.html');
      if(response&&event.request.mode==='navigate')response=await patchedResponse(response);
      return response;
    }
  })());
});

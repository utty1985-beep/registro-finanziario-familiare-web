const CACHE='rff-20260929-v54-register-fixes';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

const HOTFIX_STYLE=`<style id="rff-v54-hotfix">
#openCalculator{position:fixed!important;right:14px!important;bottom:82px!important;z-index:9998!important;width:58px!important;height:58px!important;border-radius:50%!important;padding:0!important;display:grid!important;place-items:center!important;background:rgba(255,255,255,.86)!important;backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);border:1px solid #ffffffcc!important;box-shadow:0 7px 24px #0f172a38!important;font-size:0!important;min-height:0!important}
#openCalculator::before{content:'🧮';font-size:28px;line-height:1}
#openCalculator:focus-visible{outline:3px solid #f59e0b;outline-offset:3px}
#monthHistory summary{cursor:pointer;display:inline-flex;align-items:center;gap:5px;font-weight:700;padding:4px 0}
#monthHistory summary::-webkit-details-marker{display:none}
#monthHistory summary::marker{content:''}
#monthHistory summary::before{content:'▶';font-size:10px;transition:transform .15s}
#monthHistory[open] summary::before{transform:rotate(90deg)}
#monthHistoryList{padding-top:5px}
@media print{#openCalculator{display:none!important}}
</style>`;

const HOTFIX_SCRIPT=`<script id="rff-v54-hotfix-script">
(function(){
  var holdTimer=0,holdFired=false,startX=0,startY=0;
  var hostMap={incomeRows:'income',plannedRows:'planned',moveRows:'moves',rateRows:'rates'};
  function clearHold(){if(holdTimer){clearTimeout(holdTimer);holdTimer=0}}
  function getInput(target){return target&&target.closest?target.closest('#incomeRows input[type="text"],#incomeRows input[type="number"],#plannedRows input[type="text"],#plannedRows input[type="number"],#moveRows input[type="text"],#moveRows input[type="number"],#rateRows input[type="text"],#rateRows input[type="number"]'):null}
  function markProvisional(input){
    if(holdFired||!input||typeof data!=='function'||typeof save!=='function'||typeof render!=='function')return;
    var row=input.closest('.row'),host=row&&row.parentElement,key=host&&hostMap[host.id];
    if(!row||!host||!key)return;
    var index=Array.prototype.indexOf.call(host.children,row),arr=data()[key],item=arr&&arr[index];
    if(!item||item[4]||window.familyRole==='viewer')return;
    holdFired=true;clearHold();
    try{if(navigator.vibrate)navigator.vibrate(35)}catch(e){}
    if(confirm('Segnare questa voce come provvisoria (rossa)?\nResterà comunque nel conteggio.')){item[4]=true;save();render()}
  }
  document.addEventListener('pointerdown',function(e){
    var input=getInput(e.target);if(!input)return;
    if(e.pointerType==='mouse'&&e.button!==0)return;
    holdFired=false;startX=e.clientX;startY=e.clientY;clearHold();
    holdTimer=setTimeout(function(){markProvisional(input)},650);
  },true);
  document.addEventListener('pointermove',function(e){if(holdTimer&&Math.hypot(e.clientX-startX,e.clientY-startY)>12)clearHold()},true);
  ['pointerup','pointercancel'].forEach(function(type){document.addEventListener(type,clearHold,true)});
  document.addEventListener('contextmenu',function(e){var input=getInput(e.target);if(!input)return;e.preventDefault();markProvisional(input)},true);

  function closeHistory(){var h=document.getElementById('monthHistory');if(h)h.open=false}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',closeHistory,{once:true});else closeHistory();
  document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#confirmMonth,#editMonth,#prevM,#nextM,#prevM2,#nextM2,#monthHistoryList button'))setTimeout(closeHistory,0)},true);
  document.addEventListener('change',function(e){if(e.target&&e.target.id==='monthPick')setTimeout(closeHistory,0)},true);
})();
<\/script>`;

function patchHtml(html){
  html=html.replace("d.income.reduce((s,x)=>s+(x[4]?0:(+x[1]||0)),0)","d.income.reduce((s,x)=>s+(+x[1]||0),0)");
  html=html.replace("rows.reduce((sum,r)=>sum+(r[4]?0:(kind==='planned'?-1:(rowSign(r,kind)==='+'?1:-1))*Math.abs(Number(r[1])||0)),0)","rows.reduce((sum,r)=>sum+(kind==='planned'?-1:(rowSign(r,kind)==='+'?1:-1))*Math.abs(Number(r[1])||0),0)");
  if(!html.includes('rff-v54-hotfix'))html=html.replace('</head>',HOTFIX_STYLE+'</head>');
  if(!html.includes('rff-v54-hotfix-script'))html=html.replace('</body>',HOTFIX_SCRIPT+'</body>');
  return html;
}

async function patchedResponse(response){
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;
  const text=patchHtml(await response.text());
  const headers=new Headers(response.headers);headers.delete('content-length');headers.set('cache-control','no-store');
  return new Response(text,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith((async()=>{
    try{
      let r=await fetch(e.request,{cache:'no-store'});
      if(e.request.mode==='navigate')r=await patchedResponse(r);
      const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;
    }catch(err){
      let r=await caches.match(e.request,{ignoreSearch:true});
      if(!r&&e.request.mode==='navigate')r=await caches.match('./index.html');
      if(r&&e.request.mode==='navigate')r=await patchedResponse(r);
      return r;
    }
  })());
});

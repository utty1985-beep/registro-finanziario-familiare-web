const CACHE='rff-20260929-v63-month-stability';
const SW_VERSION='20260929-v63-month-stability';
const ASSETS=[
  './','./index.html','./manifest.json','./icon-192.png','./icon-512.png',
  './v56-ui.js','./v56-main.js','./v57-polish.js','./v58-red-button.js','./v61-longpress-toggle.js','./v63-month-stability.js'
];

function patchHtml(html){
  let out=html.replace(/service-worker\.js\?v=[^'" ]+/g,'service-worker.js?v='+SW_VERSION);
  if(!out.includes('v63-month-stability.js')){
    out=out.replace('</body>','<script src="./v63-month-stability.js?v='+SW_VERSION+'"></script>\n</body>');
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

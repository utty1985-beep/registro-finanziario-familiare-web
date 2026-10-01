const CACHE='rff-20261001-v80-new-icon';
const SW_VERSION='20261001-v80-new-icon';
const ASSETS=[
  './','./index.html','./manifest.json','./icon-192.png?v=80-icon','./icon-512.png?v=80-icon',
  './v56-ui.js','./v56-main.js','./v57-polish.js','./v58-red-button.js','./v61-longpress-toggle.js','./v63-month-stability.js','./v64-sentinel-role.js','./v65-varie-collapse.js'
];

function patchHtml(html){
  let out=html.replace(/service-worker\.js\?v=[^'" ]+/g,'service-worker.js?v='+SW_VERSION);
  if(!out.includes('v63-month-stability.js')){
    out=out.replace('</body>','<script src="./v63-month-stability.js?v='+SW_VERSION+'"></script>\n</body>');
  }
  if(!out.includes('v64-sentinel-role.js')){
    out=out.replace('</body>','<script src="./v64-sentinel-role.js?v='+SW_VERSION+'"></script>\n</body>');
  }
  if(!out.includes('v65-varie-collapse.js')){
    out=out.replace('</body>','<script src="./v65-varie-collapse.js?v='+SW_VERSION+'"></script>\n</body>');
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

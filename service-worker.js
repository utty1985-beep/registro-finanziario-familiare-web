const CACHE='rff-20260929-v60-direct-red';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./v56-ui.js','./v56-main.js','./v57-polish.js','./v58-red-button.js'];

function patchHtml(html){
  return html.replace(/service-worker\.js\?v=[^'" ]+/g,'service-worker.js?v=20260929-v60-direct-red');
}
async function patchedResponse(response){
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;
  const text=patchHtml(await response.text());
  const headers=new Headers(response.headers);headers.delete('content-length');headers.set('cache-control','no-store');
  return new Response(text,{status:response.status,statusText:response.statusText,headers});
}
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
  const windows=await self.clients.matchAll({type:'window'});
  await Promise.all(windows.map(client=>{try{const u=new URL(client.url);if(!u.searchParams.has('rffv60')){u.searchParams.set('rffv60','1');return client.navigate(u.href)}}catch(err){}return Promise.resolve()}));
})()));
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

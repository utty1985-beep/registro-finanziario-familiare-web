const CACHE='rff-20260929-v56-calendar-rates';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./v56-ui.js','./v56-main.js'];

function patchHtml(html){
  if(!html.includes('v56-main.js')){
    const re=/(<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2"><\/script>\s*)<script>\s*\(\(\)=>\{[\s\S]*?\}\)\(\);\s*<\/script>/;
    html=html.replace(re,'$1<script src="./v56-ui.js?v=56"></script>\n<script src="./v56-main.js?v=56"></script>');
  }
  html=html.replace(/service-worker\.js\?v=[^'" ]+/g,'service-worker.js?v=20260929-v56-calendar-rates');
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
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
  const windows=await self.clients.matchAll({type:'window'});
  await Promise.all(windows.map(client=>{try{const u=new URL(client.url);if(!u.searchParams.has('rffv56')){u.searchParams.set('rffv56','1');return client.navigate(u.href)}}catch(err){}return Promise.resolve()}));
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

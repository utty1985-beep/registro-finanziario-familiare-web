const CACHE='rff-20260927-v37-rifiuta-1';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

function patchHtml(text){
  const rejectPatch=`const reject=document.createElement('button');reject.textContent='Rifiuta';reject.style.marginLeft='8px';reject.style.background='#c62828';reject.style.color='#fff';reject.style.borderColor='#c62828';
  reject.onclick=async()=>{
   if(!confirm('Rifiutare questa richiesta di autorizzazione?'))return;
   button.disabled=true;reject.disabled=true;
   const {error}=await sb.rpc('rff_reject_device',{...deviceArgs(),p_candidate_id:request.id});
   if(error){alert('Rifiuto non riuscito. Riprova.');button.disabled=false;reject.disabled=false;return}
   showPairingRequests();
  };
  line.append(label,button,reject);list.appendChild(line);`;
  return text
    .replace('<title>Registro Finanziario Familiare V36</title>','<title>Registro Finanziario Familiare V37</title>')
    .replace('line.append(label,button);list.appendChild(line);',rejectPatch);
}

async function maybePatch(response,request){
  if(!response)return response;
  const url=new URL(request.url);
  const ct=response.headers.get('content-type')||'';
  const isHtml=request.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/registro-finanziario-familiare-web/');
  if(!isHtml||!ct.includes('text/html'))return response;
  const text=patchHtml(await response.text());
  const headers=new Headers(response.headers);
  headers.delete('content-length');headers.delete('content-encoding');headers.delete('etag');
  headers.set('cache-control','no-store');
  return new Response(text,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith((async()=>{
    try{
      const network=await fetch(e.request,{cache:'no-store'});
      const patched=await maybePatch(network,e.request);
      const copy=patched.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));
      return patched;
    }catch(_){
      let cached=await caches.match(e.request);
      if(!cached)cached=await caches.match('./index.html');
      return maybePatch(cached,e.request);
    }
  })());
});

(()=>{
  const SUPABASE_URL='https://dqtqwfvszrtndwipyluh.supabase.co';
  const SUPABASE_KEY='sb_publishable_Qsbu5wHMUJ6ZJGuMNb16vA_gBx74NsB';
  let boundButton=null, observer=null, working=false;

  function forceEnabled(btn){
    if(!btn||btn.hidden)return;
    if(btn.disabled)btn.disabled=false;
    if(btn.hasAttribute('disabled'))btn.removeAttribute('disabled');
    btn.setAttribute('aria-disabled','false');
    btn.tabIndex=0;
    btn.style.opacity='1';
    btn.style.pointerEvents='auto';
    btn.style.cursor='pointer';
  }

  async function makeThisPrimary(btn){
    if(working)return;
    if(!confirm('Impostare questo come telefono principale? Gli altri telefoni resteranno sentinelle.'))return;
    working=true;
    const oldText=btn.textContent;
    forceEnabled(btn);
    btn.textContent='Impostazione telefono principale…';
    try{
      if(!window.supabase?.createClient)throw new Error('Connessione non pronta.');
      const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
      const {data:{session},error:sessionError}=await client.auth.getSession();
      if(sessionError||!session?.user)throw new Error('Sessione non disponibile. Esci e rientra nell’app.');
      const {data:member,error:memberError}=await client.from('family_members').select('family_id,role').eq('user_id',session.user.id).limit(1).maybeSingle();
      if(memberError||!member?.family_id)throw new Error('Registro familiare non trovato.');
      const deviceId=localStorage.getItem('rff_device_id');
      const deviceSecret=localStorage.getItem('rff_device_secret');
      if(!deviceId||!deviceSecret)throw new Error('Identità del telefono non trovata.');
      const {error}=await client.rpc('rff_make_primary',{p_family_id:member.family_id,p_device_id:deviceId,p_secret:deviceSecret});
      if(error)throw error;
      btn.textContent='✓ Telefono principale impostato';
      setTimeout(()=>location.reload(),500);
    }catch(e){
      console.error('Telefono principale:',e);
      alert('Impostazione non riuscita: '+(e?.message||'riprova con Internet attivo.'));
      btn.textContent=oldText;
      working=false;
      forceEnabled(btn);
    }
  }

  function bindButton(btn){
    if(boundButton===btn)return;
    if(observer)observer.disconnect();
    boundButton=btn;
    btn.onclick=e=>{e.preventDefault();e.stopPropagation();makeThisPrimary(btn)};
    observer=new MutationObserver(()=>forceEnabled(btn));
    observer.observe(btn,{attributes:true,attributeFilter:['disabled','style','class']});
  }

  function placePrimaryRecovery(){
    const btn=document.getElementById('makePrimaryPhone');
    const p1=document.getElementById('p1');
    if(!btn||!p1)return;

    let card=document.getElementById('primaryRecoveryCard');
    if(btn.hidden){if(card)card.remove();return;}

    if(!card){
      card=document.createElement('div');
      card.id='primaryRecoveryCard';
      card.className='card';
      card.style.cssText='border:2px solid #0b4f8a;background:#eef6ff;margin:18px 0 10px;position:relative;z-index:5';
      const title=document.createElement('h2');
      title.textContent='📱 Telefono principale';
      const text=document.createElement('div');
      text.className='hint';
      text.textContent='Questo telefono è ancora impostato come sentinella. Premi qui per renderlo principale e riattivare Conferma / Non confermare.';
      card.append(title,text);
    }

    const nav=p1.querySelector(':scope > .nav');
    if(card.parentElement!==p1){
      if(nav)p1.insertBefore(card,nav);else p1.appendChild(card);
    }else if(nav&&card.nextElementSibling!==nav){
      p1.insertBefore(card,nav);
    }

    if(btn.parentElement!==card)card.appendChild(btn);
    btn.classList.add('primary');
    btn.textContent='📱 Rendi questo il telefono principale';
    btn.style.cssText='width:100%;margin-top:10px;font-size:18px;font-weight:800;padding:14px;opacity:1;pointer-events:auto;cursor:pointer;position:relative;z-index:6';
    const hint=document.getElementById('makePrimaryHint');
    if(hint){hint.textContent='Da usare solo sul tuo telefono. Dopo il riavvio potrai confermare o rifiutare i pagamenti inviati dagli altri telefoni.';if(hint.parentElement!==card)card.appendChild(hint)}
    bindButton(btn);
    forceEnabled(btn);
  }

  const refresh=()=>setTimeout(placePrimaryRecovery,50);
  [100,400,900,1800,3500].forEach(ms=>setTimeout(placePrimaryRecovery,ms));
  setInterval(placePrimaryRecovery,1500);
  window.addEventListener('focus',refresh);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
})();

(()=>{
  let busy=false;
  let lastRoleKey='';

  function setSentinelUi(isSentinel){
    const banner=document.getElementById('viewerBanner');
    const addEntry=document.getElementById('addEntry');
    if(isSentinel){
      if(banner)banner.textContent='Telefono sentinella: puoi visualizzare il registro, usare la lavagna e inviare pagamenti da confermare al telefono principale.';
      if(addEntry)addEntry.textContent='Invia da confermare';
    }else{
      if(banner)banner.textContent='Profilo familiare in sola lettura.';
      if(addEntry)addEntry.textContent='+ Aggiungi pagamento';
    }
  }

  async function enforceDeviceRole(){
    if(busy)return;
    try{
      if(typeof sb==='undefined'||!sb||typeof familyId==='undefined'||!familyId||typeof deviceArgs!=='function')return;
      busy=true;
      const {data:status,error}=await sb.rpc('rff_device_status',deviceArgs());
      if(error||!status)return;
      const key=String(familyId)+':'+String(status.role)+':'+String(status.status);
      const sentinel=status.status==='active'&&status.role==='sentinel';
      const primaryOwner=status.status==='active'&&status.role==='primary'&&typeof accountRole!=='undefined'&&accountRole==='owner';
      const desired=primaryOwner?'owner':'viewer';
      const changed=typeof familyRole!=='undefined'&&familyRole!==desired;
      if(typeof familyRole!=='undefined')familyRole=desired;
      try{localStorage.setItem('rff_last_family_role',desired)}catch(_){ }
      setSentinelUi(sentinel);
      const greeting=document.getElementById('rffDashGreeting');
      if(greeting)greeting.textContent='Ciao '+(desired==='viewer'?'Simona':'Mario');
      const pill=document.querySelector('.rffReadOnlyPill');
      if(pill)pill.hidden=desired!=='viewer';
      try{if(typeof applyPermissions==='function')applyPermissions()}catch(_){ }
      if(changed||lastRoleKey!==key){
        lastRoleKey=key;
        try{if(typeof render==='function')render()}catch(_){ }
      }
      if(sentinel){
        try{if(typeof sendAndroidPayments==='function')await sendAndroidPayments()}catch(_){ }
      }
    }catch(e){console.log('Ruolo dispositivo:',e)}finally{busy=false}
  }

  window.RFF_ENFORCE_DEVICE_ROLE=enforceDeviceRole;
  setTimeout(enforceDeviceRole,400);
  setTimeout(enforceDeviceRole,1400);
  setTimeout(enforceDeviceRole,3500);
  setInterval(enforceDeviceRole,12000);
  window.addEventListener('focus',()=>setTimeout(enforceDeviceRole,150));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(enforceDeviceRole,150)});
})();

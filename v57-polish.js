(()=>{
  document.title='Registro Finanziario Familiare V57';
  const style=document.createElement('style');
  style.id='rff-v57-polish';
  style.textContent=`
#openCalculator{position:static!important;right:auto!important;bottom:auto!important;z-index:auto!important;width:auto!important;height:auto!important;border-radius:10px!important;padding:8px 10px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;background:#fff!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;border:1px solid #cbd5e1!important;box-shadow:none!important;font-size:14px!important;min-height:40px!important}
#openCalculator::before{content:none!important}
.rffQuickNav{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:0;position:fixed!important;left:0;right:0;top:var(--rffHeaderH,0px);z-index:20;background:#f4f7fb;padding:7px max(7px,calc((100vw - 1100px)/2 + 7px));border-bottom:1px solid #d8e1eb;box-shadow:0 3px 10px #0f172a18}
.rffQuickNav button{padding:9px 5px;font-size:12px;min-width:0;white-space:normal;line-height:1.15}
.rffQuickNavSpacer{height:var(--rffNavH,64px);display:block}
#p3 .boardReminder{display:block!important}
#p3 .boardReminder>summary{font-size:14px;padding:4px 0}
#p3 .calendarCard{display:block!important}
.permissionActive{border-color:#86efac!important;background:#f0fdf4!important;color:#166534!important}
@media(max-width:650px){.rffQuickNav{padding:6px 7px;gap:5px}.rffQuickNav button{font-size:11px;padding:8px 3px}}
@media print{.rffQuickNav,.rffQuickNavSpacer{display:none!important}}
`;
  document.head.appendChild(style);

  const main=document.querySelector('main');
  const p1=document.getElementById('p1');
  if(main&&p1&&!document.getElementById('rffQuickNav')){
    const nav=document.createElement('div');
    nav.id='rffQuickNav';nav.className='rffQuickNav';
    nav.innerHTML=`<button type="button" data-rff-page="register">🏠 Registro</button><button type="button" data-rff-page="daily">💳 Spese</button><button type="button" data-rff-page="board">📝 Lavagna</button><button type="button" data-rff-page="calendar">📅 Calendario</button>`;
    main.insertBefore(nav,p1);
    const spacer=document.createElement('div');spacer.className='rffQuickNavSpacer';spacer.setAttribute('aria-hidden','true');
    nav.after(spacer);
    const showDirect=id=>{document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.querySelector(id)?.classList.add('active');window.scrollTo(0,0)};
    nav.querySelector('[data-rff-page="register"]').onclick=()=>showDirect('#p1');
    nav.querySelector('[data-rff-page="daily"]').onclick=()=>{const b=document.getElementById('toDaily');if(b)b.click();else showDirect('#p2')};
    nav.querySelector('[data-rff-page="board"]').onclick=()=>{const b=document.getElementById('toBoard');if(b)b.click();else showDirect('#p3');setTimeout(()=>document.getElementById('boardText')?.scrollIntoView({block:'center'}),120)};
    nav.querySelector('[data-rff-page="calendar"]').onclick=()=>{const b=document.getElementById('toBoard');if(b)b.click();else showDirect('#p3');setTimeout(()=>document.querySelector('.calendarCard')?.scrollIntoView({block:'start'}),180)};
  }

  const header=document.querySelector('header');
  const nav=document.getElementById('rffQuickNav');
  const syncFixedOffsets=()=>{
    if(header)document.documentElement.style.setProperty('--rffHeaderH',Math.ceil(header.getBoundingClientRect().height)+'px');
    if(nav)document.documentElement.style.setProperty('--rffNavH',Math.ceil(nav.getBoundingClientRect().height)+'px');
  };
  syncFixedOffsets();
  requestAnimationFrame(syncFixedOffsets);
  setTimeout(syncFixedOffsets,250);
  window.addEventListener('resize',syncFixedOffsets,{passive:true});
  if(window.ResizeObserver){
    const ro=new ResizeObserver(syncFixedOffsets);if(header)ro.observe(header);if(nav)ro.observe(nav);
  }

  const boardReminder=document.querySelector('#p3 .boardReminder');
  if(boardReminder)boardReminder.open=true;
  const boardInput=document.getElementById('boardText');
  if(boardInput)boardInput.placeholder='Scrivi un appunto, una cosa da comprare o un promemoria';

  const bool=v=>v===true||v==='true';
  const syncPermissionLabels=()=>{
    const calBtn=document.getElementById('calendarPermissions');
    const fam=window.FamilyAndroid;
    if(calBtn&&fam){
      let notify=false,cal=false;
      try{notify=bool(fam.reminderPermissionGranted?.())}catch(_){}
      try{cal=bool(fam.calendarPermissionGranted?.())}catch(_){}
      const active=notify&&cal;
      calBtn.textContent=active?'✅ Permessi attivi':'🔔 Attiva permessi';
      calBtn.classList.toggle('permissionActive',active);
      calBtn.title=active?'Notifiche e calendario sono già autorizzati':'Autorizza notifiche e calendario';
    }
    const noticeBtn=document.getElementById('authorizeNotices');
    const bridge=window.RegistroAndroid;
    if(noticeBtn){
      let active=false;
      try{active=!!bridge&&bool(bridge.notificationAccessEnabled?.())}catch(_){}
      noticeBtn.textContent=active?'✅ Notifiche da app attive':'🔔 Attiva notifiche da app';
      noticeBtn.classList.toggle('permissionActive',active);
      noticeBtn.title=active?'Accesso notifiche attivo e pronto alla sincronizzazione':'Attiva l’accesso alle notifiche delle app di pagamento';
    }
  };
  syncPermissionLabels();
  setTimeout(syncPermissionLabels,500);
  setInterval(syncPermissionLabels,2500);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(syncPermissionLabels,150)});
  window.addEventListener('focus',()=>setTimeout(syncPermissionLabels,150));
})();

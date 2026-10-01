(()=>{
  if(window.RFF_V85_CALENDAR_FIX)return;
  window.RFF_V85_CALENDAR_FIX=true;

  const persistCalendar=()=>{
    try{localStorage.setItem('rff_verified',JSON.stringify(db))}catch(_){ }
  };

  // Mantiene i promemoria attivi fino alla fine dell'appuntamento.
  // Dopo la fine l'evento resta nel calendario/Google Calendar, ma non tra le notifiche attive.
  syncNativeFamilyTools=function(){
    const bridge=window.FamilyAndroid;if(!bridge)return;
    const nowMs=Date.now();
    const reminders=[];
    for(const it of boardData()){
      if(!it||typeof it!=='object'||!it.dueAt||!targetApplies(it))continue;
      const at=Date.parse(it.dueAt);
      if(Number.isFinite(at)&&at>nowMs-60000){
        reminders.push({id:'board:'+it.id,title:'Lavagna familiare',text:String(it.text||'Promemoria'),atMillis:at});
      }
    }
    const google=[];
    for(const it of allCalendarEvents()){
      if(!it||!targetApplies(it))continue;
      const start=Date.parse(it.startAt),end=Date.parse(it.endAt);
      if(!Number.isFinite(start))continue;
      const mins=Math.max(0,Number(it.reminderMinutes)||0);
      const notifyAt=start-mins*60000;
      const expiresAt=Number.isFinite(end)?end:start+3600000;
      if(expiresAt>nowMs){
        reminders.push({
          id:'calendar:'+it.id,
          title:String(it.title||'Appuntamento'),
          text:String(it.note||'Calendario familiare'),
          atMillis:notifyAt,
          expiresAtMillis:expiresAt
        });
      }
      if(it.googleSync&&Number.isFinite(end)){
        google.push({id:String(it.id),title:String(it.title||'Appuntamento'),description:String(it.note||'Calendario familiare'),startMillis:start,endMillis:end,reminderMinutes:mins});
      }
    }
    try{bridge.syncFamilyReminders?.(JSON.stringify(reminders))}catch(e){console.log('Promemoria Android V85:',e)}
    try{bridge.syncGoogleCalendarEvents?.(JSON.stringify(google))}catch(e){console.log('Google Calendar V85:',e)}
  };

  async function deleteCalendarEventV85(it,button){
    const id=String(it?.id||'');
    if(!id||it?.source==='rate')return;
    if(!confirm('Eliminare questo appuntamento?'))return;

    const oldText=button.textContent;
    button.disabled=true;
    button.textContent='Elimino…';

    const items=calendarData();
    const index=items.findIndex(x=>String(x?.id||'')===id);
    const backup=index>=0?JSON.parse(JSON.stringify(items[index])):null;

    // Rimozione immediata locale: sparisce subito dal calendario, dalle notifiche e da Google Calendar.
    if(index>=0){items.splice(index,1);persistCalendar()}
    try{syncNativeFamilyTools()}catch(_){ }
    try{renderCalendar()}catch(_){ }

    try{
      if(!sb||!familyId)throw new Error('sincronizzazione non disponibile');
      const {data:ok,error}=await sb.rpc('rff_calendar_delete',{...deviceArgs(),p_event_id:id});
      if(error)throw error;
      if(ok!==true)throw new Error('il server non ha confermato la cancellazione');
      await syncCalendar(false);
      persistCalendar();
      renderCalendar();
      syncNativeFamilyTools();
    }catch(e){
      // Se il server non ha cancellato davvero, ripristina la voce per evitare differenze tra telefoni.
      if(backup&&!calendarData().some(x=>String(x?.id||'')===id))calendarData().push(backup);
      persistCalendar();
      try{renderCalendar()}catch(_){ }
      try{syncNativeFamilyTools()}catch(_){ }
      alert('Eliminazione non riuscita: '+(e?.message||'errore di sincronizzazione')+'. Riprova con Internet attivo.');
      button.disabled=false;
      button.textContent=oldText;
    }
  }

  function bindCalendarDeleteButtonsV85(){
    const host=document.getElementById('calendarEventList');
    if(!host)return;
    const events=allCalendarEvents()
      .filter(e=>String(e.startAt||'').slice(0,7)===calendarMonth)
      .sort((a,b)=>Date.parse(a.startAt)-Date.parse(b.startAt));
    const rows=[...host.querySelectorAll('.calendarEvent')];
    rows.forEach((row,i)=>{
      const it=events[i],button=row.querySelector('button');
      if(!it||!button||it.source==='rate')return;
      button.textContent='Elimina';
      button.onclick=e=>{e.preventDefault();e.stopPropagation();deleteCalendarEventV85(it,button)};
    });
  }

  const originalRenderCalendar=renderCalendar;
  renderCalendar=function(){
    originalRenderCalendar();
    bindCalendarDeleteButtonsV85();
  };

  const host=document.getElementById('calendarEventList');
  if(host)new MutationObserver(()=>queueMicrotask(bindCalendarDeleteButtonsV85)).observe(host,{childList:true,subtree:true});
  bindCalendarDeleteButtonsV85();
  try{syncNativeFamilyTools()}catch(_){ }
})();

(()=>{
  if(window.RFF_V87_CALENDAR_FIX)return;
  window.RFF_V87_CALENDAR_FIX=true;

  const persistCalendar=()=>{
    try{localStorage.setItem('rff_verified',JSON.stringify(db))}catch(_){}
  };

  // V87: gli appuntamenti restano nello storico/calendario.
  // I promemoria scaduti vengono invece rimossi esplicitamente da Android.
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
      const reminderId='calendar:'+it.id;

      if(expiresAt>nowMs){
        reminders.push({
          id:reminderId,
          title:String(it.title||'Appuntamento'),
          text:String(it.note||'Calendario familiare'),
          atMillis:notifyAt,
          expiresAtMillis:expiresAt
        });
      }else{
        try{bridge.cancelReminder?.(reminderId)}catch(e){console.log('Rimozione promemoria scaduto:',e)}
      }

      // L'appuntamento resta in Google Calendar anche dopo la scadenza.
      if(it.googleSync&&Number.isFinite(end)){
        google.push({
          id:String(it.id),
          title:String(it.title||'Appuntamento'),
          description:String(it.note||'Calendario familiare'),
          startMillis:start,
          endMillis:end,
          reminderMinutes:mins
        });
      }
    }

    try{bridge.syncFamilyReminders?.(JSON.stringify(reminders))}catch(e){console.log('Promemoria Android V87:',e)}
    try{bridge.syncGoogleCalendarEvents?.(JSON.stringify(google))}catch(e){console.log('Google Calendar V87:',e)}
  };

  async function deleteCalendarEventV87(it,button){
    const id=String(it?.id||'');
    if(!id||it?.source==='rate')return;
    if(!confirm('Eliminare questo appuntamento?'))return;

    const oldText=button.textContent;
    button.disabled=true;
    button.textContent='Elimino…';

    const items=calendarData();
    const index=items.findIndex(x=>String(x?.id||'')===id);
    const backup=index>=0?JSON.parse(JSON.stringify(items[index])):null;

    // Sparisce subito dall'app e vengono cancellati i promemoria Android collegati.
    if(index>=0)items.splice(index,1);
    persistCalendar();
    try{window.FamilyAndroid?.cancelReminder?.('calendar:'+id)}catch(_){}
    try{syncNativeFamilyTools()}catch(_){}
    try{renderCalendar()}catch(_){}

    try{
      if(!sb||!familyId)throw new Error('sincronizzazione non disponibile');

      let result=await sb.rpc('rff_calendar_delete',{...deviceArgs(),p_event_id:id});
      if(result.error)throw result.error;

      await syncCalendar(false);

      // Una sola verifica/retry protegge da una risposta remota momentaneamente vecchia.
      if(calendarData().some(x=>String(x?.id||'')===id)){
        result=await sb.rpc('rff_calendar_delete',{...deviceArgs(),p_event_id:id});
        if(result.error)throw result.error;
        await new Promise(resolve=>setTimeout(resolve,250));
        await syncCalendar(false);
      }

      if(calendarData().some(x=>String(x?.id||'')===id)){
        throw new Error('il server ha restituito ancora l’appuntamento');
      }

      persistCalendar();
      renderCalendar();
      try{window.FamilyAndroid?.cancelReminder?.('calendar:'+id)}catch(_){}
      syncNativeFamilyTools();
    }catch(e){
      if(backup&&!calendarData().some(x=>String(x?.id||'')===id))calendarData().push(backup);
      persistCalendar();
      try{renderCalendar()}catch(_){}
      try{syncNativeFamilyTools()}catch(_){}
      alert('Eliminazione non riuscita: '+(e?.message||'errore di sincronizzazione')+'. Riprova con Internet attivo.');
      button.disabled=false;
      button.textContent=oldText;
    }
  }

  function bindCalendarDeleteButtonsV87(){
    const host=document.getElementById('calendarEventList');
    if(!host)return;

    const events=allCalendarEvents()
      .filter(e=>String(e.startAt||'').slice(0,7)===calendarMonth)
      .sort((a,b)=>Date.parse(a.startAt)-Date.parse(b.startAt));

    const rows=[...host.querySelectorAll('.calendarEvent')];
    rows.forEach((row,i)=>{
      const it=events[i],button=row.querySelector('button');
      if(!it||!button||it.source==='rate')return;
      const id=String(it.id||'');
      if(button.dataset.rffDeleteBound===id)return;

      if(button.textContent!=='Elimina')button.textContent='Elimina';
      button.dataset.rffDeleteBound=id;
      button.onclick=e=>{
        e.preventDefault();
        e.stopPropagation();
        deleteCalendarEventV87(it,button);
      };
    });
  }

  const originalRenderCalendar=renderCalendar;
  renderCalendar=function(){
    originalRenderCalendar();
    bindCalendarDeleteButtonsV87();
  };

  // Niente MutationObserver: evitato il ciclo continuo che interferiva con "Elimina".
  bindCalendarDeleteButtonsV87();

  const refreshNative=()=>{try{syncNativeFamilyTools()}catch(_){}};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshNative()});
  window.addEventListener('focus',refreshNative);
  setInterval(()=>{if(!document.hidden)refreshNative()},30000);
  refreshNative();
})();

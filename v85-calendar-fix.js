(()=>{
  if(window.RFF_V90_CALENDAR_REMINDERS)return;
  window.RFF_V90_CALENDAR_REMINDERS=true;

  // V90: la cancellazione è gestita direttamente dal codice principale.
  // Qui resta soltanto la sincronizzazione robusta dei promemoria Android/Google Calendar.
  syncNativeFamilyTools=function(){
    const bridge=window.FamilyAndroid;if(!bridge)return;
    const nowMs=Date.now();
    const reminders=[];
    for(const it of boardData()){
      if(!it||typeof it!=='object'||!it.dueAt||!targetApplies(it))continue;
      const at=Date.parse(it.dueAt);
      if(Number.isFinite(at)&&at>nowMs-60000)reminders.push({id:'board:'+it.id,title:'Lavagna familiare',text:String(it.text||'Promemoria'),atMillis:at});
    }
    const google=[];
    for(const it of allCalendarEvents()){
      if(!it||!targetApplies(it))continue;
      const start=Date.parse(it.startAt),end=Date.parse(it.endAt);
      if(!Number.isFinite(start))continue;
      const mins=Math.max(0,Number(it.reminderMinutes)||0);
      const expiresAt=Number.isFinite(end)?end:start+3600000;
      const reminderId='calendar:'+it.id;
      if(expiresAt>nowMs){
        reminders.push({id:reminderId,title:String(it.title||'Appuntamento'),text:String(it.note||'Calendario familiare'),atMillis:start-mins*60000,expiresAtMillis:expiresAt});
      }else{
        try{bridge.cancelReminder?.(reminderId)}catch(_){ }
      }
      if(it.googleSync&&Number.isFinite(end))google.push({id:String(it.id),title:String(it.title||'Appuntamento'),description:String(it.note||'Calendario familiare'),startMillis:start,endMillis:end,reminderMinutes:mins});
    }
    try{bridge.syncFamilyReminders?.(JSON.stringify(reminders))}catch(e){console.log('Promemoria Android V90:',e)}
    try{bridge.syncGoogleCalendarEvents?.(JSON.stringify(google))}catch(e){console.log('Google Calendar V90:',e)}
  };

  const refresh=()=>{try{syncNativeFamilyTools()}catch(_){}};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
  window.addEventListener('focus',refresh);
  setInterval(()=>{if(!document.hidden)refresh()},30000);
  refresh();
})();

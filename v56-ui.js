(()=>{
  document.title='Registro Finanziario Familiare V56';
  const style=document.createElement('style');
  style.id='rff-v56-style';
  style.textContent=`
#openCalculator{position:fixed!important;right:14px!important;bottom:82px!important;z-index:9998!important;width:58px!important;height:58px!important;border-radius:50%!important;padding:0!important;display:grid!important;place-items:center!important;background:rgba(255,255,255,.86)!important;backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);border:1px solid #ffffffcc!important;box-shadow:0 7px 24px #0f172a38!important;font-size:0!important;min-height:0!important}
#openCalculator::before{content:'🧮';font-size:28px;line-height:1}
#openCalculator:focus-visible{outline:3px solid #f59e0b;outline-offset:3px}
#monthHistory summary{cursor:pointer;display:inline-flex;align-items:center;gap:5px;font-weight:700;padding:4px 0}
#monthHistory summary::-webkit-details-marker{display:none}#monthHistory summary::marker{content:''}#monthHistory summary::before{content:'▶';font-size:10px;transition:transform .15s}#monthHistory[open] summary::before{transform:rotate(90deg)}#monthHistoryList{padding-top:5px}
.boardReminder{margin-top:10px;border-top:1px solid #dbe3ec;padding-top:8px}.boardReminder summary{cursor:pointer;font-weight:800;color:#0b5685}
.reminderGrid,.calendarForm{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.reminderGrid label,.calendarForm label{font-size:12px;font-weight:800}.reminderGrid input,.reminderGrid select,.calendarForm input,.calendarForm select,.calendarForm textarea{width:100%;margin-top:4px}
.calendarCard{border-left:5px solid #0b4f8a}.calendarToolbar{display:grid;grid-template-columns:44px minmax(0,1fr) 44px;gap:8px;align-items:center;margin-bottom:8px}.calendarToolbar button{height:44px;padding:0;font-size:24px}.calendarTitle{text-align:center;font-weight:900;color:#0b5685}
.calendarWeek,.calendarGrid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px}.calendarWeek div{text-align:center;font-size:11px;font-weight:900;color:#64748b;padding:4px 0}
.calendarDay{min-height:62px;border:1px solid #d8e1eb;border-radius:8px;padding:4px;background:#fff;text-align:left;position:relative;overflow:hidden}.calendarDay.other{opacity:.35}.calendarDay.today{border:2px solid #0b4f8a;background:#eef7ff}.calendarDay.hasEvents{background:#f1f8ff}.calendarDay .dayNum{font-weight:900;font-size:12px}.calendarDay .eventMini{font-size:9px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;color:#0b5685}.calendarDay button{all:unset;position:absolute;inset:0;cursor:pointer}
.calendarAdd{margin-top:12px}.calendarAdd summary{cursor:pointer;font-weight:900;color:#0b5685}.calendarForm .full{grid-column:1/-1}.calendarForm textarea{min-height:70px;resize:vertical}.calendarForm button{grid-column:1/-1}
.calendarEventList{display:grid;gap:8px;margin-top:10px}.calendarEvent{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;border:1px solid #d8e1eb;border-radius:10px;padding:9px;background:#fff}.calendarEvent .when{font-size:12px;color:#64748b}.calendarEvent .meta{font-size:11px;color:#64748b;margin-top:3px}.calendarEvent button{background:#d9534f;color:#fff;border-color:#d9534f}
.calendarNative{margin-top:12px;border-top:1px solid #dbe3ec;padding-top:10px}.calendarNative .toolbar{margin:6px 0}.calendarNative select{max-width:100%;width:100%}
.targetChip{display:inline-block;border-radius:999px;background:#eaf4ff;color:#0b5685;font-size:10px;font-weight:800;padding:2px 7px;margin-left:4px}
.rateReminder{grid-column:1/-1;border-top:1px dashed #cbd5e1;margin-top:3px;padding-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:5px;align-items:end}.rateDateRow{grid-column:1/-1;display:grid;grid-template-columns:62px minmax(82px,1fr) 82px;gap:5px}.rateReminder label{font-size:10px;font-weight:800;color:#64748b}.rateReminder input,.rateReminder select{width:100%;margin-top:2px;padding:5px;font-size:11px}.rateReminder .rateCalendarHint{grid-column:1/-1;font-size:10px;color:#0b5685}
@media(max-width:650px){.reminderGrid,.calendarForm{grid-template-columns:1fr}.calendarForm .full{grid-column:1}.calendarDay{min-height:52px;padding:3px}.calendarDay .eventMini{font-size:8px}.rateReminder{grid-template-columns:1fr 1fr}.rateDateRow{grid-template-columns:54px minmax(74px,1fr) 72px}.rateReminder .rateCalendarHint{grid-column:1/-1}}
@media print{#openCalculator{display:none!important}}
`;
  document.head.appendChild(style);

  const rateCard=document.querySelector('.ratesCard');
  if(rateCard&&!rateCard.querySelector('.rff-rate-hint')){
    const hint=document.createElement('div');hint.className='hint rff-rate-hint';
    hint.textContent='Per ogni rata puoi impostare giorno, mese e anno di scadenza: verrà mostrata automaticamente nel Calendario familiare e riceverai l’avviso in anticipo.';
    rateCard.insertBefore(hint,rateCard.querySelector('#rateRows'));
  }
  const balanceHint=document.querySelector('.balanceCard .hint');
  if(balanceHint)balanceHint.textContent='Il totale somma le tre sezioni con i segni + e −. La differenza tra ingressi e spese preventivate resta un calcolo separato nella colonna sinistra. Le voci rosse da confermare entrano comunque nel calcolo; il rosso indica solo che sono provvisorie finché non le confermi. Le voci ripetute sono contate ogni volta.';

  const p3=document.getElementById('p3');
  if(p3&&!document.getElementById('calendarGrid')){
    const boardCard=p3.querySelector('.card');
    const boardAdd=boardCard?.querySelector('.boardAdd');
    if(boardCard&&boardAdd){
      const reminder=document.createElement('details');reminder.className='boardReminder';
      reminder.innerHTML=`<summary>⏰ Aggiungi giorno e ora per una notifica</summary><div class="reminderGrid"><label>Giorno<input id="boardReminderDate" type="date"></label><label>Ora<input id="boardReminderTime" type="time"></label><label>Notifica a<select id="boardReminderTarget"><option value="both">Entrambi i telefoni</option><option value="creator">Solo questo telefono</option><option value="other">Solo l'altro telefono</option></select></label><div class="hint">Se lasci giorno e ora vuoti, l'appunto resta senza notifica.</div></div>`;
      boardAdd.after(reminder);
    }
    const calendar=document.createElement('div');calendar.className='card calendarCard';
    calendar.innerHTML=`<h2>📅 Calendario familiare</h2><div class="calendarToolbar"><button id="calendarPrev" type="button">‹</button><div id="calendarTitle" class="calendarTitle"></div><button id="calendarNext" type="button">›</button></div><div class="calendarWeek"><div>Lun</div><div>Mar</div><div>Mer</div><div>Gio</div><div>Ven</div><div>Sab</div><div>Dom</div></div><div id="calendarGrid" class="calendarGrid"></div><details id="calendarAddPanel" class="calendarAdd"><summary>＋ Nuovo appuntamento</summary><div class="calendarForm"><label class="full">Titolo<input id="calendarEventTitle" maxlength="160" placeholder="Es. Dentista, visita, riunione..."></label><label>Giorno<input id="calendarEventDate" type="date"></label><label>Ora<input id="calendarEventTime" type="time" value="09:00"></label><label>Durata<select id="calendarEventDuration"><option value="30">30 minuti</option><option value="60" selected>1 ora</option><option value="90">1 ora e 30</option><option value="120">2 ore</option><option value="1440">Tutto il giorno</option></select></label><label>Avviso<select id="calendarEventReminder"><option value="0">All'orario</option><option value="5">5 minuti prima</option><option value="15" selected>15 minuti prima</option><option value="30">30 minuti prima</option><option value="60">1 ora prima</option><option value="1440">1 giorno prima</option></select></label><label>Notifica a<select id="calendarEventTarget"><option value="both">Entrambi i telefoni</option><option value="creator">Solo questo telefono</option><option value="other">Solo l'altro telefono</option></select></label><label>Google Calendar<select id="calendarEventGoogle"><option value="yes" selected>Sincronizza</option><option value="no">Non sincronizzare</option></select></label><label class="full">Note<textarea id="calendarEventNote" maxlength="500" placeholder="Note facoltative"></textarea></label><button id="calendarEventAdd" type="button" class="primary">Salva appuntamento</button></div></details><div class="calendarNative"><b>Notifiche e Google Calendar del telefono</b><div class="toolbar"><button id="calendarPermissions" type="button">🔔 Attiva permessi</button><button id="calendarRefreshAccounts" type="button">↻ Calendari</button></div><select id="androidCalendarSelect" hidden aria-label="Calendario Google da usare"></select><div id="calendarNativeStatus" class="hint"></div></div><div id="calendarEventList" class="calendarEventList"></div>`;
    const nav=p3.querySelector('.nav');p3.insertBefore(calendar,nav||null);
  }
})();
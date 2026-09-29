(()=>{
  document.title='Registro Finanziario Familiare V57';
  const style=document.createElement('style');
  style.id='rff-v57-polish';
  style.textContent=`
#openCalculator{position:static!important;right:auto!important;bottom:auto!important;z-index:auto!important;width:auto!important;height:auto!important;border-radius:10px!important;padding:8px 10px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;background:#fff!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;border:1px solid #cbd5e1!important;box-shadow:none!important;font-size:14px!important;min-height:40px!important}
#openCalculator::before{content:none!important}
.rffQuickNav{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:0 0 10px;position:sticky;top:0;z-index:20;background:#f4f7fb;padding:6px 0;box-shadow:0 5px 12px #0f172a14}
.rffQuickNav button{padding:9px 5px;font-size:12px;min-width:0;white-space:normal;line-height:1.15}
#p3 .boardReminder{display:block!important}
#p3 .boardReminder>summary{font-size:14px;padding:4px 0}
#p3 .calendarCard{display:block!important}
@media(max-width:650px){.rffQuickNav{position:sticky;top:0;z-index:20;background:#f4f7fb;padding:5px 0}.rffQuickNav button{font-size:11px;padding:8px 3px}}
@media print{.rffQuickNav{display:none!important}}
`;
  document.head.appendChild(style);

  const main=document.querySelector('main');
  const p1=document.getElementById('p1');
  if(main&&p1&&!document.getElementById('rffQuickNav')){
    const nav=document.createElement('div');
    nav.id='rffQuickNav';nav.className='rffQuickNav';
    nav.innerHTML=`<button type="button" data-rff-page="register">🏠 Registro</button><button type="button" data-rff-page="daily">💳 Spese</button><button type="button" data-rff-page="board">📝 Lavagna</button><button type="button" data-rff-page="calendar">📅 Calendario</button>`;
    main.insertBefore(nav,p1);
    const showDirect=id=>{document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.querySelector(id)?.classList.add('active');window.scrollTo(0,0)};
    nav.querySelector('[data-rff-page="register"]').onclick=()=>showDirect('#p1');
    nav.querySelector('[data-rff-page="daily"]').onclick=()=>{const b=document.getElementById('toDaily');if(b)b.click();else showDirect('#p2')};
    nav.querySelector('[data-rff-page="board"]').onclick=()=>{const b=document.getElementById('toBoard');if(b)b.click();else showDirect('#p3');setTimeout(()=>document.getElementById('boardText')?.scrollIntoView({block:'center'}),120)};
    nav.querySelector('[data-rff-page="calendar"]').onclick=()=>{const b=document.getElementById('toBoard');if(b)b.click();else showDirect('#p3');setTimeout(()=>document.querySelector('.calendarCard')?.scrollIntoView({block:'start'}),180)};
  }

  const boardReminder=document.querySelector('#p3 .boardReminder');
  if(boardReminder)boardReminder.open=true;
  const boardInput=document.getElementById('boardText');
  if(boardInput)boardInput.placeholder='Scrivi un appunto, una cosa da comprare o un promemoria';
})();

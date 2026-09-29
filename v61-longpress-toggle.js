(()=>{
  const HOLD_MS=650;
  const style=document.createElement('style');
  style.id='rff-v61-longpress-style';
  style.textContent=`
#incomeRows .markProvisional,#plannedRows .markProvisional,#moveRows .markProvisional,#rateRows .markProvisional{display:none!important}
.provisionalDot{position:absolute;right:7px;top:7px;width:14px;height:14px;border-radius:50%;background:#dc2626;border:2px solid #fff;box-shadow:0 0 0 2px #dc2626,0 1px 4px #0003;z-index:8;pointer-events:none}
#incomeRows .row,#plannedRows .row,#moveRows .row,#rateRows .row{-webkit-touch-callout:none;touch-action:manipulation}
@media print{.provisionalDot{display:none!important}}
`;
  document.head.appendChild(style);

  const hosts=['incomeRows','plannedRows','moveRows','rateRows'];
  const cancelTimer=row=>{if(row._rffHoldTimer){clearTimeout(row._rffHoldTimer);row._rffHoldTimer=null}};

  function decorateRow(row){
    const pending=row.classList.contains('pendingCarry')||!!row.querySelector('.confirmCarry');
    let dot=row.querySelector('.provisionalDot');
    if(pending&&!dot){dot=document.createElement('span');dot.className='provisionalDot';dot.setAttribute('aria-hidden','true');row.style.position='relative';row.appendChild(dot)}
    if(!pending&&dot)dot.remove();
    if(row.dataset.rffLongpressBound==='1')return;
    row.dataset.rffLongpressBound='1';

    const start=e=>{
      if(e.pointerType==='mouse'&&e.button!==0)return;
      if(e.target.closest('.del,.confirmCarry,.markProvisional,.signBox,select,input[type=checkbox],button:not(.markProvisional)'))return;
      cancelTimer(row);
      row._rffHoldFired=false;
      row._rffHoldTimer=setTimeout(()=>{
        row._rffHoldTimer=null;
        row._rffHoldFired=true;
        const action=row.querySelector('.confirmCarry')||row.querySelector('.markProvisional');
        if(action){try{navigator.vibrate?.(35)}catch(_){} action.click()}
      },HOLD_MS);
    };
    const cancel=()=>cancelTimer(row);
    row.addEventListener('pointerdown',start,{passive:true});
    row.addEventListener('pointerup',cancel,{passive:true});
    row.addEventListener('pointercancel',cancel,{passive:true});
    row.addEventListener('pointerleave',cancel,{passive:true});
    row.addEventListener('contextmenu',e=>{
      if(e.target.closest('input[type=text],input[type=number]'))e.preventDefault();
    });
    row.addEventListener('click',e=>{
      if(row._rffHoldFired){e.preventDefault();e.stopImmediatePropagation();row._rffHoldFired=false}
    },true);
  }

  function refresh(){
    for(const id of hosts){const host=document.getElementById(id);if(!host)continue;host.querySelectorAll(':scope > .row').forEach(decorateRow)}
  }
  const observer=new MutationObserver(()=>queueMicrotask(refresh));
  hosts.forEach(id=>{const host=document.getElementById(id);if(host)observer.observe(host,{childList:true,subtree:true})});
  refresh();
  window.RFF_LONGPRESS_V61=true;
})();

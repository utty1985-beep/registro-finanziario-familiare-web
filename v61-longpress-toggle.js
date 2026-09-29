(()=>{
  const HOLD_MS=600;
  const style=document.createElement('style');
  style.id='rff-v61-longpress-style';
  style.textContent=`
#incomeRows .markProvisional,#plannedRows .markProvisional,#moveRows .markProvisional,#rateRows .markProvisional,
#incomeRows .confirmCarry,#plannedRows .confirmCarry,#moveRows .confirmCarry,#rateRows .confirmCarry{display:none!important}
.provisionalDot{position:absolute;right:7px;top:7px;width:14px;height:14px;border-radius:50%;background:#dc2626;border:2px solid #fff;box-shadow:0 0 0 2px #dc2626,0 1px 4px #0003;z-index:8;pointer-events:none}
#incomeRows .row,#plannedRows .row,#moveRows .row,#rateRows .row{-webkit-touch-callout:none;touch-action:manipulation}
#incomeRows .row input[type=text],#plannedRows .row input[type=text],#moveRows .row input[type=text],#rateRows .row input[type=text],
#incomeRows .row input[type=number],#plannedRows .row input[type=number],#moveRows .row input[type=number],#rateRows .row input[type=number]{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}
@media print{.provisionalDot{display:none!important}}
`;
  document.head.appendChild(style);

  const hosts=['incomeRows','plannedRows','moveRows','rateRows'];
  const cancelTimer=row=>{if(row._rffHoldTimer){clearTimeout(row._rffHoldTimer);row._rffHoldTimer=null}};

  function fireToggle(row){
    const action=row.querySelector('.confirmCarry')||row.querySelector('.markProvisional');
    if(!action)return;
    row._rffHoldFired=true;
    try{navigator.vibrate?.(40)}catch(_){}
    const active=document.activeElement;if(active&&row.contains(active)&&active.blur)active.blur();
    action.click();
  }

  function decorateRow(row){
    const pending=row.classList.contains('pendingCarry')||!!row.querySelector('.confirmCarry');
    let dot=row.querySelector('.provisionalDot');
    if(pending&&!dot){dot=document.createElement('span');dot.className='provisionalDot';dot.setAttribute('aria-hidden','true');row.style.position='relative';row.appendChild(dot)}
    if(!pending&&dot)dot.remove();
    if(row.dataset.rffLongpressBound==='2')return;
    row.dataset.rffLongpressBound='2';

    const canStart=target=>!target.closest('.del,.signBox,select,input[type=checkbox],button');
    const begin=target=>{
      if(!canStart(target))return;
      cancelTimer(row);row._rffHoldFired=false;
      row._rffHoldTimer=setTimeout(()=>{row._rffHoldTimer=null;fireToggle(row)},HOLD_MS);
    };
    const end=()=>cancelTimer(row);

    row.addEventListener('touchstart',e=>{if(e.touches.length===1)begin(e.target)},{passive:true});
    row.addEventListener('touchend',end,{passive:true});
    row.addEventListener('touchcancel',end,{passive:true});
    row.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0)begin(e.target)},{passive:true});
    row.addEventListener('pointerup',end,{passive:true});
    row.addEventListener('pointercancel',end,{passive:true});
    row.addEventListener('contextmenu',e=>{if(canStart(e.target))e.preventDefault()});
    row.addEventListener('click',e=>{if(row._rffHoldFired){e.preventDefault();e.stopImmediatePropagation();row._rffHoldFired=false}},true);
  }

  function refresh(){for(const id of hosts){const host=document.getElementById(id);if(!host)continue;host.querySelectorAll(':scope > .row').forEach(decorateRow)}}
  const observer=new MutationObserver(()=>queueMicrotask(refresh));
  hosts.forEach(id=>{const host=document.getElementById(id);if(host)observer.observe(host,{childList:true,subtree:true})});
  refresh();
  window.RFF_LONGPRESS_V61=true;
})();

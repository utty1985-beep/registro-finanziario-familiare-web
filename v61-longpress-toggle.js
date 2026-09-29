(()=>{
  const style=document.createElement('style');
  style.id='rff-v61-longpress-style';
  style.textContent=`
#incomeRows .markProvisional,#plannedRows .markProvisional,#moveRows .markProvisional,#rateRows .markProvisional,
#incomeRows .confirmCarry,#plannedRows .confirmCarry,#moveRows .confirmCarry,#rateRows .confirmCarry{display:none!important}
#incomeRows .row,#plannedRows .row,#moveRows .row,#rateRows .row{position:relative!important}
.provisionalDot{position:absolute;right:7px;top:7px;width:18px;height:18px;min-width:18px;min-height:18px;padding:0!important;border:2px solid #fff;border-radius:50%;background:#111;box-shadow:0 0 0 1px #111,0 1px 4px #0003;z-index:9;cursor:pointer}
.provisionalDot.pending{background:#dc2626;box-shadow:0 0 0 1px #dc2626,0 1px 4px #0003}
.provisionalDot:active{transform:scale(.9)}
.provisionalDot:disabled{opacity:.75;cursor:default}
@media print{.provisionalDot{display:none!important}}
`;
  document.head.appendChild(style);

  const hosts=['incomeRows','plannedRows','moveRows','rateRows'];

  function decorateRow(row){
    const pending=row.classList.contains('pendingCarry')||!!row.querySelector('.confirmCarry');
    let dot=row.querySelector('.provisionalDot');
    if(!dot){
      dot=document.createElement('button');
      dot.type='button';
      dot.className='provisionalDot';
      row.appendChild(dot);
    }
    dot.classList.toggle('pending',pending);
    dot.title=pending?'Da confermare · tocca per confermare':'Confermata · tocca per segnare da confermare';
    dot.setAttribute('aria-label',dot.title);
    const action=pending?row.querySelector('.confirmCarry'):row.querySelector('.markProvisional');
    dot.disabled=!action;
    dot.onclick=e=>{
      e.preventDefault();
      e.stopPropagation();
      const isPending=row.classList.contains('pendingCarry')||!!row.querySelector('.confirmCarry');
      const currentAction=isPending?row.querySelector('.confirmCarry'):row.querySelector('.markProvisional');
      if(currentAction)currentAction.click();
    };
  }

  function refresh(){
    for(const id of hosts){
      const host=document.getElementById(id);if(!host)continue;
      host.querySelectorAll(':scope > .row').forEach(decorateRow);
    }
  }

  const observer=new MutationObserver(()=>queueMicrotask(refresh));
  hosts.forEach(id=>{const host=document.getElementById(id);if(host)observer.observe(host,{childList:true,subtree:true})});
  refresh();
  window.RFF_LONGPRESS_V61=true;
})();

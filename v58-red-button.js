(()=>{
  const style=document.createElement('style');
  style.id='rff-v58-red-button-style';
  style.textContent=`
#incomeRows .row,#plannedRows .row,#moveRows .row,#rateRows .row{position:relative}
#incomeRows .row.hasMarkProvisional>input[type="text"],#plannedRows .row.hasMarkProvisional>input[type="text"],#moveRows .row.hasMarkProvisional>input[type="text"],#rateRows .row.hasMarkProvisional>input[type="text"]{padding-right:38px!important}
.markProvisional{position:absolute!important;right:4px!important;top:4px!important;z-index:3!important;width:28px!important;height:28px!important;min-width:28px!important;min-height:28px!important;padding:0!important;border:1px solid #fca5a5!important;border-radius:999px!important;background:#fff!important;display:grid!important;place-items:center!important;font-size:15px!important;line-height:1!important;box-shadow:0 1px 4px #0002!important}
.markProvisional:active{transform:scale(.94)}
@media print{.markProvisional{display:none!important}}
`;
  document.head.appendChild(style);

  const hosts=['incomeRows','plannedRows','moveRows','rateRows'];
  function addButtons(){
    for(const id of hosts){
      const host=document.getElementById(id);if(!host)continue;
      host.querySelectorAll(':scope > .row').forEach(row=>{
        const isPending=row.classList.contains('pendingCarry')||!!row.querySelector('.confirmCarry');
        const existing=row.querySelector('.markProvisional');
        if(isPending){existing?.remove();row.classList.remove('hasMarkProvisional');return}
        if(existing)return;
        const target=row.querySelector(':scope > input[type="text"]');
        if(!target)return;
        const btn=document.createElement('button');
        btn.type='button';btn.className='markProvisional';btn.textContent='🔴';
        btn.title='Segna come provvisoria';btn.setAttribute('aria-label','Segna questa voce come provvisoria rossa');
        btn.onclick=e=>{
          e.preventDefault();e.stopPropagation();
          target.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,view:window}));
        };
        row.classList.add('hasMarkProvisional');row.appendChild(btn);
      });
    }
  }
  const observer=new MutationObserver(()=>queueMicrotask(addButtons));
  hosts.forEach(id=>{const h=document.getElementById(id);if(h)observer.observe(h,{childList:true,subtree:true})});
  addButtons();
})();

(()=>{
  function placePrimaryRecovery(){
    const btn=document.getElementById('makePrimaryPhone');
    const p2=document.getElementById('p2');
    if(!btn||!p2||btn.hidden)return;
    let card=document.getElementById('primaryRecoveryCard');
    if(!card){
      card=document.createElement('div');
      card.id='primaryRecoveryCard';
      card.className='card';
      card.style.cssText='border:2px solid #0b4f8a;background:#eef6ff;margin:10px 0';
      const title=document.createElement('h2');
      title.textContent='📱 Telefono principale';
      const text=document.createElement('div');
      text.className='hint';
      text.textContent='Questo telefono è ancora impostato come sentinella. Rendilo principale per vedere e usare Conferma / Non confermare.';
      card.append(title,text);
      const toolbar=p2.querySelector('.toolbar');
      if(toolbar&&toolbar.nextSibling)p2.insertBefore(card,toolbar.nextSibling);else p2.prepend(card);
    }
    if(btn.parentElement!==card)card.appendChild(btn);
    btn.classList.add('primary');
    btn.style.cssText='width:100%;margin-top:8px;font-size:17px;padding:12px';
    const hint=document.getElementById('makePrimaryHint');
    if(hint&&hint.parentElement!==card)card.appendChild(hint);
  }
  setTimeout(placePrimaryRecovery,400);
  setTimeout(placePrimaryRecovery,1200);
  setTimeout(placePrimaryRecovery,3000);
  setInterval(placePrimaryRecovery,5000);
  window.addEventListener('focus',()=>setTimeout(placePrimaryRecovery,100));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(placePrimaryRecovery,100)});
})();

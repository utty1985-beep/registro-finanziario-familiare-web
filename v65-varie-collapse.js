(()=>{
  const STYLE_ID='rff-v65-varie-collapse-style';
  const OPEN_KEY='rff_varie_daily_open';

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      #varieSingle .varieDailyHistory{margin-top:12px;border-top:1px solid #d7dee6;padding-top:6px}
      #varieSingle .varieDailyHistory>summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 4px;font-weight:900;color:#0b5685;user-select:none}
      #varieSingle .varieDailyHistory>summary::-webkit-details-marker{display:none}
      #varieSingle .varieDailyHistory>summary::after{content:'▼';font-size:14px;transition:transform .18s ease}
      #varieSingle .varieDailyHistory:not([open])>summary::after{transform:rotate(-90deg)}
      #varieSingle .varieDailyHistory .varieDailyHistoryBody{padding:0 2px 2px}
      #varieSingle .varieDailyHistory .total{margin-top:0}
    `;
    document.head.appendChild(s);
  }

  function enhanceVarie(){
    ensureStyle();
    const host=document.getElementById('varieSingle');
    if(!host)return;
    if(host.querySelector(':scope > details.varieDailyHistory'))return;

    const rows=[...host.children].filter(el=>
      el.classList.contains('total') && /^\s*Giorno\s+\d+\s*:/i.test(el.textContent||'')
    );
    if(!rows.length)return;

    const details=document.createElement('details');
    details.className='varieDailyHistory';
    details.open=sessionStorage.getItem(OPEN_KEY)==='1';

    const summary=document.createElement('summary');
    summary.textContent=`Pagamenti giornalieri (${rows.length})`;
    const body=document.createElement('div');
    body.className='varieDailyHistoryBody';

    host.insertBefore(details,rows[0]);
    details.append(summary,body);
    rows.forEach(row=>body.appendChild(row));

    details.addEventListener('toggle',()=>{
      sessionStorage.setItem(OPEN_KEY,details.open?'1':'0');
    });
  }

  const original=window.renderVarieSingle;
  if(typeof original==='function'){
    window.renderVarieSingle=function(...args){
      const out=original.apply(this,args);
      queueMicrotask(enhanceVarie);
      return out;
    };
  }

  function watch(){
    enhanceVarie();
    const host=document.getElementById('varieSingle');
    if(!host)return;
    const obs=new MutationObserver(()=>queueMicrotask(enhanceVarie));
    obs.observe(host,{childList:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});
  else watch();
  setTimeout(enhanceVarie,500);
  setTimeout(enhanceVarie,1800);
})();

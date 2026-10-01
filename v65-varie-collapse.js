(()=>{
  const STYLE_ID='rff-v79-varie-summary-style';
  const OPEN_KEY='rff_varie_daily_open';

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      #varieSingle{width:100%}
      #varieSingle .varieCompactTable{width:min(100%,720px);margin-left:auto;border:1px solid #d7dee6;border-radius:12px;overflow:hidden;background:#fff}
      #varieSingle .varieCompactHead{display:grid;grid-template-columns:minmax(0,1fr) 132px 34px;gap:8px;align-items:center;padding:8px 10px;background:#eaf4ff;color:#0b5685;font-size:12px;font-weight:900;text-transform:uppercase;border-bottom:1px solid #d7dee6}
      #varieSingle .varieCompactHead span:nth-child(2){text-align:right}
      #varieSingle .varieItem{padding:0;border-bottom:1px solid #dce4ea;background:#fff}
      #varieSingle .varieItem:last-child{border-bottom:0}
      #varieSingle .varieCompact{margin:0}
      #varieSingle .varieCompact>summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:minmax(0,1fr) 132px 34px;gap:8px;align-items:center;padding:11px 10px;user-select:none}
      #varieSingle .varieCompact>summary::-webkit-details-marker{display:none}
      #varieSingle .varieCompactName{font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#172033}
      #varieSingle .varieCompactResult{justify-self:end;font-weight:950;font-size:17px;color:#0b5685;background:#eef6ff;border:1px solid #b9d8f1;border-radius:10px;padding:5px 9px;min-width:105px;text-align:right;font-variant-numeric:tabular-nums}
      #varieSingle .varieCompactArrow{justify-self:end;width:30px;height:30px;display:grid;place-items:center;border-radius:8px;background:#f7f9fb;border:1px solid #d7dee6;color:#0b5685;font-weight:900;transition:transform .18s ease}
      #varieSingle .varieCompact[open] .varieCompactArrow{transform:rotate(180deg)}
      #varieSingle .varieCompactBody{padding:4px 10px 12px;background:#fbfdff;border-top:1px solid #e5eaf0}
      #varieSingle .varieBaseCompact{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:end;margin:8px 0}
      #varieSingle .varieBaseCompact label{display:grid;gap:4px;font-size:12px;font-weight:800;color:#52606d}
      #varieSingle .varieBaseCompact input{width:100%;min-height:43px;font-size:17px}
      #varieSingle .varieDeleteCompact{min-height:43px;color:#b4232b;border:2px solid #b4232b;background:#fff}
      #varieSingle .varieAdjustLabel{display:block;margin-top:8px;font-size:12px;font-weight:900;color:#52606d}
      #varieSingle .varieAdjust{display:grid;grid-template-columns:88px minmax(0,1fr) auto;gap:8px;align-items:center;margin-top:5px}
      #varieSingle .varieAdjust select,#varieSingle .varieAdjust input{width:100%;font-size:18px;min-width:0;min-height:44px}
      #varieSingle .varieAdjust button{min-height:44px;background:#0b5685;color:#fff;border-color:#0b5685}
      #varieSingle .varieAdjustments{font-size:13px;color:#52606d;margin-top:8px}
      #varieSingle .varieAdjustments:empty{display:none}
      #varieSingle .varieAdjustments:not(:empty)::before{content:'Modifiche applicate';display:block;font-weight:900;color:#52606d;margin-bottom:5px}
      #varieSingle .varieAdjustments>div{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:5px 0;border-top:1px dashed #d7dee6}
      #varieSingle .varieAdjustments button{padding:5px 9px;font-size:12px;color:#b4232b}
      #varieSingle .varieResult{display:none!important}
      #varieSingle .varieDailyHistory{width:min(100%,720px);margin:12px 0 0 auto;border-top:1px solid #d7dee6;padding-top:6px}
      #varieSingle .varieDailyHistory>summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 4px;font-weight:900;color:#0b5685;user-select:none}
      #varieSingle .varieDailyHistory>summary::-webkit-details-marker{display:none}
      #varieSingle .varieDailyHistory>summary::after{content:'▼';font-size:14px;transition:transform .18s ease}
      #varieSingle .varieDailyHistory:not([open])>summary::after{transform:rotate(-90deg)}
      #varieSingle .varieDailyHistory .varieDailyHistoryBody{padding:0 2px 2px}
      #varieSingle .varieDailyHistory .total{margin-top:0}
      @media(max-width:650px){
        #varieSingle .varieCompactTable,#varieSingle .varieDailyHistory{width:100%;margin-left:0}
        #varieSingle .varieCompactHead,#varieSingle .varieCompact>summary{grid-template-columns:minmax(0,1fr) 112px 30px;gap:5px;padding-left:8px;padding-right:8px}
        #varieSingle .varieCompactResult{font-size:15px;min-width:94px;padding:5px 6px}
        #varieSingle .varieAdjust{grid-template-columns:78px minmax(0,1fr);}
        #varieSingle .varieAdjust button{grid-column:1/-1}
      }
    `;
    document.head.appendChild(s);
  }

  function resultText(item){
    const r=item.querySelector('.varieResult');
    if(!r)return '€ 0,00';
    const text=(r.textContent||'').replace(/^\s*Risultato\s*:\s*/i,'').trim();
    return text||'€ 0,00';
  }

  function compactSelectedRows(host){
    const items=[...host.querySelectorAll(':scope > .varieItem')];
    if(!items.length)return;

    let table=host.querySelector(':scope > .varieCompactTable');
    if(!table){
      table=document.createElement('div');
      table.className='varieCompactTable';
      const head=document.createElement('div');
      head.className='varieCompactHead';
      head.innerHTML='<span>Voce</span><span>Risultato finale</span><span></span>';
      table.appendChild(head);
      host.insertBefore(table,items[0]);
    }

    items.forEach(item=>{
      if(item.dataset.rffCompact==='1'){
        if(item.parentElement!==table)table.appendChild(item);
        return;
      }

      const base=item.querySelector('.varieBase');
      const adjust=item.querySelector('.varieAdjust');
      const result=item.querySelector('.varieResult');
      const history=item.querySelector('.varieAdjustments');
      if(!base||!adjust||!result)return;

      const nameInput=base.querySelector('input[type="text"]');
      const valueInput=base.querySelector('input[type="number"]');
      const deleteBtn=base.querySelector('button');
      const name=(nameInput?.value||'Voce').trim()||'Voce';
      const final=resultText(item);

      const details=document.createElement('details');
      details.className='varieCompact';

      const summary=document.createElement('summary');
      const nameEl=document.createElement('span');
      nameEl.className='varieCompactName';
      nameEl.textContent=name;
      const finalEl=document.createElement('strong');
      finalEl.className='varieCompactResult';
      finalEl.textContent=final;
      const arrow=document.createElement('span');
      arrow.className='varieCompactArrow';
      arrow.textContent='▼';
      arrow.setAttribute('aria-hidden','true');
      summary.append(nameEl,finalEl,arrow);

      const body=document.createElement('div');
      body.className='varieCompactBody';

      if(valueInput||deleteBtn){
        const baseLine=document.createElement('div');
        baseLine.className='varieBaseCompact';
        if(valueInput){
          const label=document.createElement('label');
          label.textContent='Importo iniziale';
          label.appendChild(valueInput);
          baseLine.appendChild(label);
        }
        if(deleteBtn){
          deleteBtn.classList.add('varieDeleteCompact');
          deleteBtn.textContent='🗑 Cancella';
          deleteBtn.title='Cancella questa voce da Varie';
          baseLine.appendChild(deleteBtn);
        }
        body.appendChild(baseLine);
      }

      const adjustLabel=document.createElement('span');
      adjustLabel.className='varieAdjustLabel';
      adjustLabel.textContent='Modifica il risultato';
      const sign=adjust.querySelector('select');
      if(sign){
        [...sign.options].forEach(opt=>{
          if(opt.value==='-')opt.textContent='− Sottrai';
          if(opt.value==='+')opt.textContent='+ Aggiungi';
        });
      }
      body.append(adjustLabel,adjust);
      if(history)body.appendChild(history);

      item.innerHTML='';
      details.append(summary,body);
      item.appendChild(details);
      item.dataset.rffCompact='1';
      table.appendChild(item);
    });
  }

  function collapseDailyHistory(host){
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
    details.addEventListener('toggle',()=>sessionStorage.setItem(OPEN_KEY,details.open?'1':'0'));
  }

  function enhanceVarie(){
    ensureStyle();
    const host=document.getElementById('varieSingle');
    if(!host)return;
    compactSelectedRows(host);
    collapseDailyHistory(host);
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
    let queued=false;
    const obs=new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      queueMicrotask(()=>{queued=false;enhanceVarie()});
    });
    obs.observe(host,{childList:true,subtree:false});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});
  else watch();
  setTimeout(enhanceVarie,500);
  setTimeout(enhanceVarie,1800);
})();

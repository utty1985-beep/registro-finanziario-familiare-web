(()=>{
  if(window.RFF_V63_MONTH_STABILITY)return;
  window.RFF_V63_MONTH_STABILITY=true;

  const STORAGE_KEY='rff_last_open_month';
  const q=s=>document.querySelector(s);
  const validMonth=v=>/^\d{4}-\d{2}$/.test(String(v||''));
  const addMonths=(ym,delta)=>{
    if(!validMonth(ym))return ym;
    const [y,m]=ym.split('-').map(Number),d=new Date(y,m-1+delta,1);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  };

  let desiredMonth=validMonth(localStorage.getItem(STORAGE_KEY))?localStorage.getItem(STORAGE_KEY):null;
  let restoring=false;
  let lastUserMonthAction=0;

  function rememberMonth(v){
    if(!validMonth(v))return;
    desiredMonth=v;
    localStorage.setItem(STORAGE_KEY,v);
  }

  function restoreDesiredMonth(force=false){
    const pick=q('#monthPick');
    if(!pick||!desiredMonth||restoring)return;
    if(pick.value===desiredMonth){return;}
    if(!force && Date.now()-lastUserMonthAction<900)return;
    restoring=true;
    pick.value=desiredMonth;
    pick.dispatchEvent(new Event('change',{bubbles:true}));
    setTimeout(()=>{restoring=false},120);
  }

  // Ricorda il mese scelto sia dal selettore sia dalle frecce.
  document.addEventListener('change',e=>{
    if(e.target?.id==='monthPick' && validMonth(e.target.value)){
      lastUserMonthAction=Date.now();
      rememberMonth(e.target.value);
    }
  },true);

  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#prevM,#nextM,#prevM2,#nextM2');
    if(!btn)return;
    const pick=q('#monthPick');
    const base=(pick&&validMonth(pick.value))?pick.value:(desiredMonth||'');
    if(validMonth(base)){
      lastUserMonthAction=Date.now();
      rememberMonth(addMonths(base,(btn.id==='prevM'||btn.id==='prevM2')?-1:1));
    }
  },true);

  // Il pallino deve cambiare stato senza far perdere mese e posizione verticale.
  document.addEventListener('click',e=>{
    const dot=e.target?.closest?.('.provisionalDot,.statusDot');
    if(!dot)return;
    const pick=q('#monthPick');
    const beforeMonth=(pick&&validMonth(pick.value))?pick.value:desiredMonth;
    const beforeY=window.scrollY;
    if(validMonth(beforeMonth))rememberMonth(beforeMonth);
    [0,40,120,300,650].forEach(ms=>setTimeout(()=>{
      restoreDesiredMonth(true);
      window.scrollTo({top:beforeY,left:0,behavior:'auto'});
    },ms));
  },true);

  // Se una sincronizzazione/ridisegno riporta il registro al mese corrente,
  // ripristina subito il mese che l'utente stava realmente guardando.
  setInterval(()=>restoreDesiredMonth(false),350);

  // Mantiene il comando Stampa sempre visibile nella pagina del mese.
  function ensurePrintButton(){
    const actions=q('#p1 .monthActions');
    const original=q('#printRegister');
    if(!actions||!original||q('#printMonthV63'))return;
    const b=document.createElement('button');
    b.id='printMonthV63';
    b.type='button';
    b.textContent='🖨️ Stampa';
    b.title='Stampa il mese visualizzato';
    b.onclick=()=>original.click();
    actions.appendChild(b);
  }

  function init(){
    ensurePrintButton();
    const pick=q('#monthPick');
    if(pick){
      if(!desiredMonth && validMonth(pick.value))rememberMonth(pick.value);
      else restoreDesiredMonth(true);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,50),{once:true});
  else setTimeout(init,50);
  setTimeout(init,500);
  setTimeout(init,1500);
})();

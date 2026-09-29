function applyV46(text) {
  if (typeof window.applyV45 !== 'function') throw new Error('V46: V45 mancante');
  text = window.applyV45(text);
  const replace = (from, to, label) => {
    if (!text.includes(from)) throw new Error('V46: ' + label + ' non trovato');
    text = text.replace(from, to);
  };
  replace('<title>Registro Finanziario Familiare V45</title>', '<title>Registro Finanziario Familiare V46</title>', 'titolo');
  replace("$('#printRegister').onclick=()=>{buildPrintSheets();window.print()};",
    "function printRegister(){buildPrintSheets();if(window.RegistroAndroid?.printRegister){RegistroAndroid.printRegister();return}window.print()}\n$('#printRegister').onclick=printRegister;",
    'stampa');
  replace('<div class=\"card movesCard\"><h2>Situazione economica / movimenti</h2><div id=\"moveRows\"></div><button id=\"addMove\">+ Movimento</button></div>',
    '<div class=\"card movesCard\"><h2>Situazione economica / movimenti</h2><div id=\"moveRows\"></div><button id=\"addMove\">+ Movimento</button><div class=\"total\">Parziale movimenti: € <span id=\"moveTotal\">0,00</span></div></div>',
    'movimenti');
  replace('<div class=\"card ratesCard\"><h2>Rate / scadenze</h2><div id=\"rateRows\"></div><button id=\"addRate\">+ Rata</button></div>',
    '<div class=\"card ratesCard\"><h2>Rate / scadenze</h2><div id=\"rateRows\"></div><button id=\"addRate\">+ Rata</button><div class=\"total\">Parziale rate: € <span id=\"rateTotal\">0,00</span></div></div>',
    'rate');
  replace('<div class=\"card balanceCard\"><h2>Bilancio finale</h2><div class=\"total\">Saldo: € <span id=\"balance\">0,00</span></div></div>',
    '<div class=\"card balanceCard\"><h2>Bilancio finale</h2><div class=\"total\">Saldo: € <span id=\"balance\">0,00</span></div><p class=\"hint\">Ingressi − spese preventivate + parziale movimenti + parziale rate. Le voci rosse da confermare non entrano nel calcolo. Se ripeti un ingresso anche nei movimenti, viene contato due volte.</p></div>',
    'saldo');
  replace("$('#balance').textContent=euro(inc+signed(d.planned,'planned')+signed(d.moves,'moves')+signed(d.rates,'rates'))}",
    "const moveTotal=signed(d.moves,'moves'),rateTotal=signed(d.rates,'rates');\n $('#moveTotal').textContent=(moveTotal<0?'− ':'+ ')+euro(Math.abs(moveTotal));$('#rateTotal').textContent=(rateTotal<0?'− ':'+ ')+euro(Math.abs(rateTotal));\n $('#balance').textContent=euro(remaining+moveTotal+rateTotal)}",
    'calcolo');
  replace("${block('Situazione economica / movimenti',entries('moves'),'','moves')}${block('Rate / scadenze',entries('rates'),'','rates')}",
    "${block('Situazione economica / movimenti',entries('moves'),'Parziale: € '+$('#moveTotal').textContent,'moves')}${block('Rate / scadenze',entries('rates'),'Parziale: € '+$('#rateTotal').textContent,'rates')}",
    'stampa parziali');
  replace('<button id=\"sendNotices\">Importa pagamenti</button><div id=\"paymentSources\"',
    '<button id=\"sendNotices\">Importa pagamenti</button><div id=\"notificationState\" class=\"hint\" role=\"status\"></div><div id=\"paymentSources\"',
    'stato notifiche');
  replace("$('#authorizeNotices').onclick=()=>window.RegistroAndroid?.openNotificationAccess();",
    "function updateNotificationState(){const bridge=window.RegistroAndroid,el=$('#notificationState');if(!el)return;if(!bridge){el.textContent='Le notifiche di pagamento si leggono solo nell’app Android.';return}const enabled=bridge.notificationAccessEnabled?.();const pending=Number(bridge.queuedPaymentCount?.()||0);el.textContent=(enabled===true||enabled==='true'?'Accesso notifiche attivo.':'Accesso notifiche da attivare nelle impostazioni Android.')+' '+pending+' pagamento/i ancora sul telefono. Seleziona le app qui sotto: i pagamenti riconosciuti compariranno in rosso su tutti i telefoni autorizzati dopo la sincronizzazione.'}\n$('#authorizeNotices').onclick=()=>window.RegistroAndroid?.openNotificationAccess();",
    'impostazioni notifiche');
  replace("host.hidden=false;host.textContent='';", "host.hidden=false;host.textContent='';updateNotificationState();", 'aggiornamento sorgenti');
  replace("if(sent){$('#sendStatus').textContent=sent+' pagamento/i inviato/i. Compariranno tra le notifiche da confermare sul telefono principale.';if(familyRole==='owner')await fetchInbox(true)}",
    "if(sent){$('#sendStatus').textContent=sent+' pagamento/i inviato/i. Compariranno tra i pagamenti da confermare sui telefoni autorizzati.';if(familyRole==='owner')await fetchInbox(true)}updateNotificationState()",
    'importazione notifiche');
  replace("function guessCategory(s){s=String(s||'').toLowerCase();const c=customCols()",
    "function guessCategory(s){s=String(s||'').toLowerCase();if(/\\b(q8|eni|esso|tamoil|keropetrol|totalerg|ip|api)\\b|carburant|benzina|gasolio|diesel|distributore|stazione di servizio|fuel/.test(s))return'Diesel';const c=customCols()",
    'categoria carburante');
  replace("const sgn=noticeSign(n);\n  x.innerHTML=",
    "const sgn=noticeSign(n);\n  x.innerHTML=",
    'notifica');
  replace("const cat=x.querySelector('select').value||'varie';const [yy,mm]=ymParts()",
    "let cat=x.querySelector('select').value||'varie';if(cat==='diesel-proposed'){let col=customCols().find(c=>(c.name||'').toLowerCase()==='diesel');if(!col){col={id:'diesel',name:'Diesel',budget:0};customCols().push(col)}cat=colKey(col)}const [yy,mm]=ymParts()",
    'conferma Diesel');
  replace("const opts=[['Mangiare','food'],...customCols()",
    "const opts=[['Mangiare','food'],...((n.category||'').toLowerCase()==='diesel'&&!customCols().some(c=>(c.name||'').toLowerCase()==='diesel')?[['Diesel','diesel-proposed']]:[]),...customCols()",
    'opzione Diesel');
  replace("x.querySelector('select').value=suggested?colKey(suggested):(n.category==='Mangiare'?'food':'varie')",
    "x.querySelector('select').value=suggested?colKey(suggested):(n.category==='Mangiare'?'food':(n.category==='Diesel'?'diesel-proposed':'varie'))",
    'proposta Diesel');
  replace("await loadCloud();await syncBoard(false);gate.classList.add('hidden');say('');",
    "await loadCloud();await syncBoard(false);gate.classList.add('hidden');say('');updateNotificationState();",
    'avvio notifiche');
  replace("if(!document.hidden&&familyRole==='owner')fetchInbox(true)", "if(!document.hidden){updateNotificationState();if(familyRole==='owner')fetchInbox(true)}", 'rientro');
  replace("service-worker.js?v=20260928-v45", "service-worker.js?v=20260929-v46", 'cache');
  return text;
}

function applyV43(text){
 const must=(cond,msg)=>{if(!cond)throw new Error('V43: '+msg)};
 text=text.replace('<title>Registro Finanziario Familiare V42</title>','<title>Registro Finanziario Familiare V43</title>');
 text=text.replace('Telefono secondario: puoi vedere il registro e inviare pagamenti. Sul telefono principale arriveranno da confermare.','Telefono secondario: sola lettura del registro. Questo telefono può solo raccogliere le notifiche delle app di pagamento selezionate e inviarle al telefono principale, che resta l’unico a poterle confermare, rifiutare o modificare.');

 const oldPerm=`function applyPermissions(){
 const viewer=familyRole==='viewer';$('#viewerBanner').hidden=!viewer;
 $('#pairingCard').hidden=true;$('#sentinelBar').hidden=!(familyRole&&window.RegistroAndroid);
 document.querySelectorAll('#p1 input:not(#monthPick),#p2 input,#p1 button,#p2 button,#p2 select').forEach(el=>{
  if(['prevM','nextM','prevM2','nextM2','toDaily','toMonth','toBoard','toBoard2','authorizeNotices','sourcesButton','sendNotices'].includes(el.id))return;
  if(el.closest&&el.closest('.entryForm'))return;
  el.disabled=viewer;
 });
 if($('#boardText'))$('#boardText').disabled=false;if($('#boardAdd'))$('#boardAdd').disabled=false;
}`;
 const newPerm=`function applyPermissions(){
 const viewer=familyRole==='viewer';$('#viewerBanner').hidden=!viewer;
 $('#pairingCard').hidden=true;$('#sentinelBar').hidden=!(familyRole&&window.RegistroAndroid);
 const manualCard=$('#entryAmount')?.closest('.card');if(manualCard)manualCard.hidden=viewer;
 document.querySelectorAll('#p1 input:not(#monthPick),#p2 input,#p1 button,#p2 button,#p2 select').forEach(el=>{
  if(['prevM','nextM','prevM2','nextM2','toDaily','toMonth','toBoard','toBoard2','authorizeNotices','sourcesButton','sendNotices'].includes(el.id))return;
  el.disabled=viewer;
 });
 if($('#boardText'))$('#boardText').disabled=false;if($('#boardAdd'))$('#boardAdd').disabled=false;
}`;
 must(text.includes(oldPerm),'permessi V42 non trovati');
 text=text.replace(oldPerm,newPerm);
 text=text.replace("service-worker.js?v=20260928-v42","service-worker.js?v=20260928-v43");
 text=text.replace('<!-- Registro Finanziario Familiare V42 - versione consolidata -->','<!-- Registro Finanziario Familiare V43 - secondari solo raccolta notifiche -->');
 return text;
}

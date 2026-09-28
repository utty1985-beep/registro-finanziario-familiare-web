function applyV43(text){
 const must=(cond,msg)=>{if(!cond)throw new Error('V43: '+msg)};
 text=text.replace('<title>Registro Finanziario Familiare V42</title>','<title>Registro Finanziario Familiare V43</title>');
 text=text.replace('Telefono secondario: puoi vedere il registro e inviare pagamenti. Sul telefono principale arriveranno da confermare.','Profilo familiare in sola lettura. I dispositivi approvati dello stesso account proprietario hanno accesso completo al registro.');

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

 const oldRole="familyRole=(device.role==='primary')?'owner':'viewer';if(familyRole==='viewer')$('#addEntry').textContent='+ Invia pagamento';else $('#addEntry').textContent='+ Aggiungi pagamento';";
 const newRole="familyRole=(device.status==='active'&&accountRole==='owner')?'owner':'viewer';if(familyRole==='viewer')$('#addEntry').textContent='+ Invia pagamento';else $('#addEntry').textContent='+ Aggiungi pagamento';";
 must(text.includes(oldRole),'assegnazione ruolo dispositivo non trovata');
 text=text.replace(oldRole,newRole);

 const activeStart="  await loadCloud();await syncBoard(false);gate.classList.add('hidden');say('');";
 const backgroundStart="  if(window.RegistroAndroid?.configureBackgroundSync)RegistroAndroid.configureBackgroundSync(String(familyId),String(deviceId),String(deviceSecret));\n  await loadCloud();await syncBoard(false);gate.classList.add('hidden');say('');";
 must(text.includes(activeStart),'avvio dispositivo attivo non trovato');
 text=text.replace(activeStart,backgroundStart);

 text=text.replace("service-worker.js?v=20260928-v42","service-worker.js?v=20260928-v43b");
 text=text.replace('<!-- Registro Finanziario Familiare V42 - versione consolidata -->','<!-- Registro Finanziario Familiare V43 - owner completo su ogni dispositivo approvato -->');
 return text;
}

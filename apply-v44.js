function applyV44(text){
 const must=(cond,msg)=>{if(!cond)throw new Error('V44: '+msg)};
 if(typeof window.applyV43==='function') text=window.applyV43(text);
 else throw new Error('V44: patch V43 non disponibile');
 text=text.replace('<title>Registro Finanziario Familiare V43</title>','<title>Registro Finanziario Familiare V44</title>');
 const oldRole="familyRole=(device.role==='primary')?'owner':'viewer';if(familyRole==='viewer')$('#addEntry').textContent='+ Invia pagamento';else $('#addEntry').textContent='+ Aggiungi pagamento';";
 const newRole="familyRole=(device.status==='active'&&accountRole==='owner')?'owner':'viewer';if(familyRole==='viewer')$('#addEntry').textContent='+ Invia pagamento';else $('#addEntry').textContent='+ Aggiungi pagamento';";
 must(text.includes(oldRole),'assegnazione ruolo dispositivo non trovata');
 text=text.replace(oldRole,newRole);
 text=text.replace('Telefono secondario: sola lettura del registro. Questo telefono può solo raccogliere le notifiche delle app di pagamento selezionate e inviarle al telefono principale, che resta l’unico a poterle confermare, rifiutare o modificare.','Profilo familiare in sola lettura. I dispositivi approvati dello stesso account proprietario hanno invece accesso completo al registro.');
 text=text.replace('service-worker.js?v=20260928-v43','service-worker.js?v=20260928-v44');
 text=text.replace('<!-- Registro Finanziario Familiare V43 - secondari solo raccolta notifiche -->','<!-- Registro Finanziario Familiare V44 - stesso account proprietario completo su ogni dispositivo approvato -->');
 return text;
}

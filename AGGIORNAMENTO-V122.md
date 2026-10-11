# Registro Finanziario Familiare — V122, 11 ottobre 2026

Requisiti concordati con Mario:

- Sotto Categoria, nella seconda pagina, mostrare il riquadro «Residuo [nome voce] · importo».
- Il riquadro vale per tutte le colonne personalizzate (Metano, Diesel, Benzina ecc.) e per tutte le voci visibili in Varie, anche con nomi liberi come «Residuo Mangiare».
- Cliccando, chiedere «Vuoi spostarla in Mangiare?» con conferma e annullamento; la destinazione è sempre Mangiare.
- Il trasferimento è una rettifica del budget: nessuna spesa o entrata nuova, nessuna variazione del saldo familiare; conservare lo storico e consentire l’annullamento.
- Un residuo negativo si copre prelevando da Mangiare, con indicazione esplicita del verso e controllo della disponibilità; non digitare segni manuali.
- Il residuo già presente in Mangiare non va trasferito nuovamente a se stesso.
- Cambiare mese nel Registro non deve cambiare «Mangiare oggi» della Home, che usa sempre mese e giorno attuali, incluso extra sabato e spese cumulate.
- Recuperare i pagamenti rilevati sul telefono di Simona: conservare la coda su errori, riprovare con la rete, registrare gli ID inviati e impedire doppioni.
- Simona conserva il profilo di sola lettura sul Registro; il trasferimento è riservato al proprietario.

La simulazione HTML separata usa dati di esempio. I sorgenti reali usano un registro `daily.budgetTransfers` di rettifiche in centesimi e non modificano `daily.entries` o le righe che concorrono al saldo finanziario.

Il trasferimento riguarda il mese consultato e il giorno selezionato. Lo storico è memorizzato nei dati del registro condiviso. Le voci Varie hanno un identificatore stabile per evitare di attribuire una rettifica a un’altra voce quando cambia l’ordine delle righe.

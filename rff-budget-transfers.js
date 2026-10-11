(function(root){
 'use strict';
 const cents=n=>Math.round((Number(n)||0)*100),money=n=>n/100;
 const list=d=>Array.isArray(d?.daily?.budgetTransfers)?d.daily.budgetTransfers:[];
 const delta=(d,key,day)=>list(d).filter(t=>Number(t.day)<=day).reduce((n,t)=>n+(key==='food'?Number(t.foodCents)||0:t.sourceKey===key?Number(t.sourceCents)||0:0),0);
 function remaining(d,key,day,month){
  const daily=d.daily||{},[y,m]=month.split('-').map(Number),start=Math.max(1,Number(String(daily.start||'').slice(-2))||1),entries=daily.entries||[];
  let total=key==='food'?0:cents((daily.columns||[]).find(c=>'custom:'+c.id===key)?.budget);
  for(let i=start;i<=day;i++){
   if(key==='food')total+=cents(daily.food)+(new Date(y,m-1,i).getDay()===6?cents(daily.sat):0);
   total-=cents(daily.spend?.[i]?.[key]);
   total+=entries.filter(e=>Number(e.day)===i&&e.category===key).reduce((n,e)=>n+cents(e.amount),0);
  }
  return total+delta(d,key,day);
 }
 function varieRemaining(d,row,kind){
  const base=cents(row[1]),adj=(d.daily?.varieAdjustments||[]).filter(a=>a.row===(d[kind]||[]).indexOf(row)&&(a.kind||'planned')===kind).reduce((n,a)=>n+cents(a.amount),0);
  const key='varie:'+kind+':'+row[6];return base+adj+delta(d,key,31);
 }
 function transfer(d,sourceKey,sourceName,amount,day,id){
  if(!Number.isSafeInteger(amount)||amount===0||!Number.isInteger(day)||day<1||day>31||sourceKey==='food')throw Error('Rettifica non valida');
  d.daily.budgetTransfers||=[];
  if(d.daily.budgetTransfers.some(t=>t.id===id))return;
  d.daily.budgetTransfers.push({id,sourceKey,sourceName,day,foodCents:amount,sourceCents:-amount,at:new Date().toISOString()});
 }
 const api={cents,money,delta,remaining,varieRemaining,transfer};root.RFFBudget=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);

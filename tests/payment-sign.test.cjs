const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),B=require('../rff-budget-transfers.js');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
function harness(sign){
 const daily={entries:[]},nodes={'#addEntry':{},'#entryAmount':{value:'38.27'},'#entryDate':{value:'2026-10-02'},'#entryCategory':{value:'food'},'#historyDrop':{}};
 const negative={checked:false};let saves=0,asks=0;
 const ctx={Number,Date,Math,console,$:s=>nodes[s],document:{querySelector:()=>({get value(){return sign},set checked(v){negative.checked=v}})},month:'2026-10',ymParts:()=>[2026,10],familyRole:'owner',data:()=>({daily}),save:()=>saves++,renderDaily:()=>{},categoryName:()=> 'Mangiare',euro:n=>n.toFixed(2),confirm:()=>{asks++;return ctx.accept},alert:()=>{},accept:true};
 vm.createContext(ctx);vm.runInContext(html.slice(html.indexOf("$('#addEntry').onclick=async(event)=>{"),html.indexOf('function renderEntryHistory(){')),ctx);
 return {ctx,daily,nodes,negative,get saves(){return saves},get asks(){return asks}};
}
test('new payment form defaults to expense',()=>{assert.match(html,/<input type="radio" name="entrySign" value="-" checked>/);assert.doesNotMatch(html,/<input[^>]*name="entrySign"[^>]*value="\+"[^>]*checked/)});
test('expense handler records negative amount and does not request an addition',async()=>{const h=harness('-');await h.nodes['#addEntry'].onclick({});assert.equal(h.daily.entries[0].amount,-38.27);assert.equal(h.saves,1);assert.equal(h.asks,0);assert.equal(h.negative.checked,true)});
test('positive addition requires confirmation and resets the next entry to expense',async()=>{const h=harness('+');h.ctx.accept=false;await h.nodes['#addEntry'].onclick({});assert.equal(h.daily.entries.length,0);assert.equal(h.saves,0);h.ctx.accept=true;await h.nodes['#addEntry'].onclick({});assert.equal(h.daily.entries[0].amount,38.27);assert.equal(h.negative.checked,true)});
test('breakdown separates mixed expenses and additions from budget transfers',()=>{const d={daily:{food:13,sat:50,spend:{2:{food:5}},entries:[{day:2,category:'food',amount:38.27},{day:2,category:'food',amount:-2}],budgetTransfers:[{day:2,foodCents:1000}]}};assert.deepEqual(B.dayBreakdown(d,'food',2),{expenses:700,additions:3827,net:3127});assert.equal(B.remaining(d,'food',2,'2026-10'),6727)});
test('negative carry and Saturday extra persist from first day',()=>{const d={daily:{food:13,sat:50,start:'2026-10-03',spend:{1:{food:43},2:{food:5}},entries:[]}};assert.equal(B.remaining(d,'food',1,'2026-10'),-3000);assert.equal(B.remaining(d,'food',2,'2026-10'),-2200);assert.equal(B.remaining(d,'food',3,'2026-10'),4100)});
test('all inline scripts parse',()=>{for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){if(m[1].trim())new vm.Script(m[1])}});

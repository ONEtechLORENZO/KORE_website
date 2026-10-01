/* Prova che il listino riproduca il sito attuale.
 * Sotto c'e' la trascrizione letterale di pcTariff/pcTargets da index.html. */
import assert from 'node:assert';
import { calcola, tariffa, euro, numero } from '../src/services/listino.js';

const tiers  = [500,1000,1500,2000,2500,3000,3500,4000,4500,5000];
const prices = [6,5,4.5,4.25,4,3.8,3.65,3.5,3.4,3.3];
function pcTariff(leads){
  if(leads<=tiers[0])return prices[0];
  if(leads>=tiers[tiers.length-1])return prices[prices.length-1];
  let k=0; while(leads>tiers[k+1])k++;
  const t=(leads-tiers[k])/(tiers[k+1]-tiers[k]);
  return prices[k]+(prices[k+1]-prices[k])*t;
}
const originale=(leads,level)=>{const base=pcTariff(leads),per=base*level/4;return {per,month:per*leads}};

/* il caso della schermata: 3.310 lead, 4 motori */
const c = calcola({lead:3310, livello:4});
console.log('  3.310 lead, 4 motori ->', euro(c.perLead), 'a lead ,', euro(c.imponibile), 'al mese');
assert.strictEqual(euro(c.perLead), '\u20ac3,71', 'il prezzo a lead non corrisponde al sito');
assert.strictEqual(numero(c.imponibile), '12.270', 'il mensile non corrisponde al sito');
console.log('  ok  combacia con quanto mostra index.html: 3,71 e 12.270');

let n=0;
for(const leads of [500,700,1000,1750,2500,3000,3310,3999,4500,5000]){
  for(const level of [1,2,3,4]){
    const mio=calcola({lead:leads,livello:level}), suo=originale(leads,level);
    assert.ok(Math.abs(mio.perLead-suo.per)<1e-9, `per lead diverso a ${leads}/${level}`);
    assert.ok(Math.abs(mio.imponibile-suo.month)<1e-9, `mensile diverso a ${leads}/${level}`);
    n++;
  }
}
console.log('  ok  '+n+' combinazioni di volume e livello identiche alla formula originale');

/* la tariffa deve calare al crescere del volume */
let prec=Infinity;
for(const l of tiers){ const t=tariffa(l); assert.ok(t<=prec,'la tariffa non puo salire'); prec=t; }
console.log('  ok  la tariffa cala sempre al crescere dei lead (6,00 -> 3,30)');

/* le migliaia anche sotto le cinque cifre */
assert.strictEqual(euro(2375.14),'\u20ac2.375,14');
assert.strictEqual(numero(3000),'3.000');
console.log('  ok  migliaia corrette anche a quattro cifre');

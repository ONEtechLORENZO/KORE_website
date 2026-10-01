/* Prova che il modulo React produca ESATTAMENTE gli stessi dati del sito attuale.
 * Sotto c'e' la trascrizione letterale della logica di index.html (blocco v134):
 * se le due uscite divergono, il CRM riceverebbe qualcosa di diverso. */
import assert from 'node:assert';
import { buildPayload, validate, emailOk, phoneOk } from '../src/shared/crm.js';

/* ---- originale, copiato riga per riga da index.html ---- */
const O_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const O_PHONE = /^(?:\+39|0039)?\d{9,11}$/;
const o_emailOk = (v) => O_EMAIL.test(v);
const o_phoneOk = (v) => O_PHONE.test(v.replace(/[\s.\-()]/g, ''));

function originale(f, p, adesso) {
  const val = (k) => (f[k] || '').trim();
  const consenso = 'Consenso privacy: accettato il ' + adesso.toLocaleString('it-IT');
  const problema = [
    'Ruolo: ' + (val('dm-role') || '-'),
    'Volume mensile di lead gestiti: ' + (val('dm-volume') || '-'),
    'Materiali richiesti: ' + (p.length ? p.join(', ') : '-'),
    consenso,
    '', 'Messaggio:', val('dm-msg') || '-',
  ].join('\n');
  return {
    nome: val('dm-name'), azienda: val('dm-company'),
    email: val('dm-email').toLowerCase(), telefono: val('dm-phone'),
    problema, website: val('dm-hp2'),
  };
}

const CASI = [
  {
    nome: 'compilato del tutto',
    f: { name: '  Mario Rossi ', company: 'Acme SpA', role: 'CEO',
         email: '  MARIO@Acme.IT ', phone: '+39 333 123 4567',
         volume: '1.000-5.000', msg: 'Vorrei una demo.', hp: '' },
    mat: ['Brochure', 'Case study'],
  },
  {
    nome: 'senza messaggio e senza materiali',
    f: { name: 'Anna', company: 'Beta', role: 'CTO',
         email: 'a@b.co', phone: '0039 3331234567', volume: '<500', msg: '', hp: '' },
    mat: [],
  },
  {
    nome: 'trappola compilata da un robot',
    f: { name: 'Bot', company: 'X', role: 'Altro', email: 'x@y.zz',
         phone: '3331234567', volume: '>5.000', msg: 'spam', hp: 'http://spam' },
    mat: ['Listino'],
  },
];

const ADESSO = new Date('2026-09-23T15:30:00');
let n = 0;

for (const c of CASI) {
  const mio = buildPayload(
    { role: c.f.role, volume: c.f.volume, msg: c.f.msg, name: c.f.name,
      company: c.f.company, email: c.f.email, phone: c.f.phone, hp: c.f.hp },
    c.mat, ADESSO
  );
  const suo = originale(
    { 'dm-name': c.f.name, 'dm-company': c.f.company, 'dm-role': c.f.role,
      'dm-email': c.f.email, 'dm-phone': c.f.phone, 'dm-volume': c.f.volume,
      'dm-msg': c.f.msg, 'dm-hp2': c.f.hp },
    c.mat, ADESSO
  );
  assert.deepStrictEqual(mio, suo, 'DIVERGENZA nel caso: ' + c.nome);
  assert.deepStrictEqual(Object.keys(mio), ['nome','azienda','email','telefono','problema','website'],
    'i nomi dei campi sono cambiati: il CRM non li riconoscerebbe');
  console.log('  ok  ' + c.nome);
  n++;
}

/* i due controlli di formato devono comportarsi identici */
const PROVE = ['a@b.co', 'senzachiocciola', 'a@b', 'mario.rossi@azienda.it', '', 'a b@c.dd'];
for (const v of PROVE) assert.strictEqual(emailOk(v), o_emailOk(v), 'email diversa: ' + v);
const TEL = ['+39 333 123 4567', '3331234567', '0039 333 123 4567', '123', '+1 555 000 0000', '333-123-4567'];
for (const v of TEL) assert.strictEqual(phoneOk(v), o_phoneOk(v), 'telefono diverso: ' + v);
console.log('  ok  controlli di email (' + PROVE.length + ') e telefono (' + TEL.length + ')');

/* il consenso mancante deve bloccare l'invio */
const senzaConsenso = validate(
  { name: 'A', company: 'B', role: 'C', email: 'a@b.co', phone: '3331234567', volume: 'x' }, false);
assert.ok(senzaConsenso.privacy, 'senza consenso il modulo deve fermarsi');
const conConsenso = validate(
  { name: 'A', company: 'B', role: 'C', email: 'a@b.co', phone: '3331234567', volume: 'x' }, true);
assert.deepStrictEqual(conConsenso, {}, 'con tutto valido non devono restare errori');
console.log('  ok  il consenso blocca e sblocca l invio');

console.log('\n' + n + ' payload identici all originale, campi e controlli inclusi.');

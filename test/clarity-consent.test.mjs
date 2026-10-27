import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../clarity-consent.js', import.meta.url), 'utf8');
const indexHtml = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const siteHtml = fs.readFileSync(new URL('../sito.html', import.meta.url), 'utf8');
const privacyHtml = fs.readFileSync(new URL('../privacy-marketing/index.html', import.meta.url), 'utf8');

assert.match(source, /href="\/privacy-marketing\/"/, 'Banner must link to the marketing-site notice');
assert.doesNotMatch(source, /trust\.kore-hub\.otech\.one/, 'Banner must not link to the Trust Center notice');
for (const [name, html] of [['index.html', indexHtml], ['sito.html', siteHtml]]) {
  assert.match(html, /<meta name="referrer" content="strict-origin">/, `${name} must limit outbound referrers`);
  assert.equal((html.match(/\/clarity-consent\.js/g) || []).length, 1, `${name} must load the controller once`);
  assert.equal((html.match(/\/clarity-consent\.css/g) || []).length, 1, `${name} must load the styles once`);
}
assert.doesNotMatch(privacyHtml, /clarity-consent\.(?:js|css)/, 'The privacy notice itself must remain untracked');
assert.match(privacyHtml, /Bozza — approvazione privacy richiesta/, 'Unapproved privacy wording must be visibly marked as draft');

function environment({ path = '/', hash = '', search = '', consent = null } = {}) {
  const nodes = new Map();
  const insertedScripts = [];
  const windowEvents = new Map();
  const storage = new Map();
  if (consent) storage.set('kore-clarity-consent-v1', consent);

  class Element {
    constructor(tagName, document) {
      this.tagName = tagName.toUpperCase();
      this.ownerDocument = document;
      this.attributes = new Map();
      this.listeners = new Map();
      this.childrenBySelector = new Map();
      this.parentNode = null;
      this.async = 0;
      this.src = '';
      this._id = '';
    }
    set id(value) { this._id = value; }
    get id() { return this._id; }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    addEventListener(type, handler) { this.listeners.set(type, handler); }
    focus() {}
    remove() { if (this.id) nodes.delete(this.id); }
    click() { const handler = this.listeners.get('click'); if (handler) handler({ target: this }); }
    set innerHTML(value) {
      this._innerHTML = value;
      const denied = new Element('button', this.ownerDocument);
      const granted = new Element('button', this.ownerDocument);
      this.childrenBySelector.set('[data-clarity-choice="denied"]', denied);
      this.childrenBySelector.set('[data-clarity-choice="granted"]', granted);
    }
    get innerHTML() { return this._innerHTML || ''; }
    querySelector(selector) { return this.childrenBySelector.get(selector) || null; }
  }

  const document = {
    readyState: 'complete',
    documentElement: null,
    body: null,
    createElement(tag) { return new Element(tag, document); },
    getElementById(id) { return nodes.get(id) || null; },
    querySelector(selector) {
      if (selector.startsWith('script[src*=')) {
        return insertedScripts.find((script) => script.src.includes('clarity.ms/tag/z3sy7q9gz9')) || null;
      }
      return null;
    },
    getElementsByTagName(tag) {
      if (tag !== 'script') return [];
      return [{ parentNode: { insertBefore(script) {
        insertedScripts.push(script);
        script.parentNode = this;
        if (script.id) nodes.set(script.id, script);
      } } }];
    },
    addEventListener() {}
  };
  document.documentElement = new Element('html', document);
  document.documentElement.lang = 'it';
  document.body = new Element('body', document);
  document.body.appendChild = (element) => {
    element.parentNode = document.body;
    if (element.id) nodes.set(element.id, element);
  };

  let reloads = 0;
  const location = {
    pathname: path,
    hash,
    search,
    reload() { reloads += 1; }
  };
  const window = {
    location,
    document,
    localStorage: {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { storage.set(key, String(value)); }
    },
    addEventListener(type, handler) { windowEvents.set(type, handler); }
  };
  window.window = window;

  vm.runInNewContext(source, {
    window, document, URLSearchParams, console
  }, { filename: 'clarity-consent.js' });

  return {
    window, document, nodes, storage, insertedScripts, windowEvents,
    get reloads() { return reloads; }
  };
}

function queuedConsent(env) {
  return (env.window.clarity?.q || []).filter((entry) => entry[0] === 'consentv2');
}

function assertConsent(actual, analytics) {
  assert.equal(actual.ad_Storage, 'denied');
  assert.equal(actual.analytics_Storage, analytics);
}

{
  const env = environment();
  assert.equal(env.insertedScripts.length, 0, 'Clarity must not load before a choice');
  assert.ok(env.nodes.has('kore-clarity-consent'), 'The consent banner should be shown');
}

{
  const env = environment({ consent: 'denied' });
  assert.equal(env.insertedScripts.length, 0, 'Rejected consent must not load Clarity');
  assert.ok(env.nodes.has('kore-clarity-manage'), 'Withdrawal/preferences must remain accessible');
}

{
  const env = environment({ consent: 'granted' });
  assert.equal(env.insertedScripts.length, 1, 'Stored consent should load one Clarity tag');
  assert.equal(env.insertedScripts[0].src, 'https://www.clarity.ms/tag/z3sy7q9gz9');
  assert.equal(env.insertedScripts[0].async, 1);
  assert.equal(env.document.documentElement.attributes.get('data-clarity-mask'), 'true');
  assertConsent(queuedConsent(env)[0][1], 'granted');
  env.windowEvents.get('popstate')();
  assert.equal(env.insertedScripts.length, 1, 'Client navigation must not duplicate the tag');
}

for (const route of [
  { path: '/acquista/' },
  { path: '/richiedi-demo/' },
  { path: '/trust/' },
  { path: '/privacy-marketing/' },
  { path: '/sito.html', hash: '#contatti' },
  { path: '/sito.html', hash: '#privacy' },
  { path: '/sito.html', hash: '#pricing' },
  { path: '/sito.html', hash: '#prezzi' },
  { path: '/sito.html', search: '?email=persona@example.com' }
]) {
  const env = environment({ ...route, consent: 'granted' });
  assert.equal(env.insertedScripts.length, 0, `Excluded route must not load Clarity: ${JSON.stringify(route)}`);
}

{
  const env = environment({ path: '/sito.html', hash: '#contatti', consent: 'granted' });
  env.window.location.hash = '#perche';
  env.windowEvents.get('hashchange')();
  assert.equal(env.insertedScripts.length, 1, 'Returning to a public client-side route should restore consented analytics');
}

{
  const env = environment();
  env.nodes.get('kore-clarity-consent').querySelector('[data-clarity-choice="granted"]').click();
  assert.equal(env.storage.get('kore-clarity-consent-v1'), 'granted');
  assert.equal(env.insertedScripts.length, 1, 'Accepting analytics should load Clarity');
  env.nodes.get('kore-clarity-manage').click();
  env.nodes.get('kore-clarity-consent').querySelector('[data-clarity-choice="denied"]').click();
  assert.equal(env.storage.get('kore-clarity-consent-v1'), 'denied');
  assertConsent(queuedConsent(env).at(-1)[1], 'denied');
  assert.equal(env.reloads, 1, 'Withdrawal should unload the Clarity runtime by reloading');
}

{
  const env = environment({ path: '/sito.html', consent: 'granted' });
  env.window.location.hash = '#contatti';
  env.windowEvents.get('hashchange')();
  assertConsent(queuedConsent(env).at(-1)[1], 'denied');
  assert.equal(env.reloads, 1, 'Entering a sensitive client-side route should unload Clarity');
}

console.log('Clarity consent tests passed');

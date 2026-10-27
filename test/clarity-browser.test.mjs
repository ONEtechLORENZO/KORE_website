import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const baseUrl = process.env.KORE_TEST_URL || 'http://127.0.0.1:4520';
const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9333;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kore-clarity-'));
const browser = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--disable-extensions', '--no-first-run',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore', windowsHide: true });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function retry(action, timeout = 10000) {
  const end = Date.now() + timeout;
  let lastError;
  while (Date.now() < end) {
    try { return await action(); } catch (error) { lastError = error; await delay(100); }
  }
  throw lastError || new Error('Timed out');
}

let socket;
try {
  const pages = await retry(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json`);
    if (!response.ok) throw new Error(`Chrome endpoint returned ${response.status}`);
    return response.json();
  });
  const page = pages.find((item) => item.type === 'page' && item.url === 'about:blank') ||
    pages.find((item) => item.type === 'page');
  if (!page) throw new Error('Chrome did not expose a page target');
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let id = 0;
  const pending = new Map();
  const requests = [];
  const exceptions = [];
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    } else if (message.method === 'Network.requestWillBeSent') {
      requests.push(message.params.request.url);
    } else if (message.method === 'Runtime.exceptionThrown') {
      exceptions.push(message.params.exceptionDetails.text);
    }
  });

  function command(method, params = {}) {
    return new Promise((resolve, reject) => {
      const callId = ++id;
      pending.set(callId, { resolve, reject });
      socket.send(JSON.stringify({ id: callId, method, params }));
    });
  }

  async function evaluate(expression) {
    const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  }

  async function navigate(url) {
    await command('Page.navigate', { url });
    await retry(async () => {
      const state = await evaluate('[location.href, document.readyState]');
      if (state[0] !== url || state[1] !== 'complete') throw new Error(`Page is ${state[0]} (${state[1]})`);
    });
    await delay(500);
  }

  async function clarityScripts() {
    return evaluate('[...document.scripts].filter(s => s.src.includes("clarity.ms/tag/")).map(s => s.src)');
  }

  await command('Page.enable');
  await command('Runtime.enable');
  await command('Network.enable');
  await command('Network.clearBrowserCookies');

  const jsResponse = await fetch(`${baseUrl}/clarity-consent.js`);
  const cssResponse = await fetch(`${baseUrl}/clarity-consent.css`);
  const privacyResponse = await fetch(`${baseUrl}/privacy-marketing/`);
  assert.match(jsResponse.headers.get('content-type') || '', /(?:application|text)\/javascript/i, 'JavaScript MIME type');
  assert.match(cssResponse.headers.get('content-type') || '', /text\/css/i, 'CSS MIME type');
  assert.match(privacyResponse.headers.get('content-type') || '', /text\/html/i, 'Privacy notice MIME type');

  await navigate(`${baseUrl}/`);
  await evaluate('localStorage.clear()');
  await navigate('about:blank');
  await navigate(`${baseUrl}/`);
  assert.equal(await evaluate('document.getElementById("kore-clarity-consent") !== null'), true, 'Banner should be visible');
  assert.deepEqual(await clarityScripts(), [], 'No tag may load before consent');
  assert.equal(await evaluate('document.querySelector(".kore-clarity-links a").getAttribute("href")'), '/privacy-marketing/', 'Banner should link to the marketing notice');

  await evaluate('document.querySelector("[data-clarity-choice=denied]").click()');
  assert.equal(await evaluate('localStorage.getItem("kore-clarity-consent-v1")'), 'denied', 'Reject should persist denial');
  assert.deepEqual(await clarityScripts(), [], 'Reject must not load the tag');
  await evaluate('localStorage.clear()');
  await navigate(`${baseUrl}/`);

  await evaluate('document.querySelector("[data-clarity-choice=granted]").click()');
  await retry(async () => {
    if ((await clarityScripts()).length !== 1) throw new Error('Clarity tag not ready');
  });
  assert.deepEqual(await clarityScripts(), ['https://www.clarity.ms/tag/z3sy7q9gz9']);
  assert.equal(await evaluate('document.documentElement.getAttribute("data-clarity-mask")'), 'true');
  assert.ok(requests.some((url) => url === 'https://www.clarity.ms/tag/z3sy7q9gz9'), 'Chrome should request the official tag');
  await evaluate('document.body.dispatchEvent(new MouseEvent("click", { bubbles: true })); window.scrollTo(0, document.body.scrollHeight)');
  await retry(async () => {
    if (!requests.some((url) => url.includes('clarity.ms/collect'))) throw new Error('Clarity collect request not observed');
  }, 15000);
  await evaluate('dispatchEvent(new PopStateEvent("popstate"))');
  assert.equal((await clarityScripts()).length, 1, 'Navigation must not duplicate the tag');

  await evaluate('document.getElementById("kore-clarity-manage").click()');
  await evaluate('document.querySelector("[data-clarity-choice=denied]").click()');
  await retry(async () => {
    const state = await evaluate('localStorage.getItem("kore-clarity-consent-v1")');
    const count = (await clarityScripts()).length;
    if (state !== 'denied' || count !== 0) throw new Error('Withdrawal reload not complete');
  });

  await evaluate('localStorage.setItem("kore-clarity-consent-v1", "granted")');
  await navigate(`${baseUrl}/sito.html#contatti`);
  assert.deepEqual(await clarityScripts(), [], 'Sensitive contact route must not load Clarity');
  await navigate(`${baseUrl}/sito.html#prezzi`);
  assert.deepEqual(await clarityScripts(), [], 'Custom-pricing form must not load Clarity');
  await evaluate('location.hash="#perche"');
  await retry(async () => {
    if ((await clarityScripts()).length !== 1) throw new Error('Public client-side route did not restore Clarity');
  });
  await navigate(`${baseUrl}/sito.html?email=persona@example.com`);
  assert.deepEqual(await clarityScripts(), [], 'Potentially sensitive query strings must not load Clarity');
  await navigate(`${baseUrl}/acquista/`);
  assert.deepEqual(await clarityScripts(), [], 'Checkout must not load Clarity');
  await navigate(`${baseUrl}/richiedi-demo/`);
  assert.deepEqual(await clarityScripts(), [], 'Demo request must not load Clarity');
  await navigate(`${baseUrl}/trust/`);
  assert.deepEqual(await clarityScripts(), [], 'Trust Center must not load Clarity');
  await navigate(`${baseUrl}/privacy-marketing/`);
  assert.deepEqual(await clarityScripts(), [], 'Marketing privacy notice must not load Clarity');

  await navigate(`${baseUrl}/sito.html`);
  assert.equal((await clarityScripts()).length, 1, 'Stored consent should load Clarity on the public site');
  await evaluate('location.hash="#contatti"');
  await retry(async () => {
    if (await evaluate('location.hash !== "#contatti" || [...document.scripts].some(s => s.src.includes("clarity.ms/tag/"))')) {
      throw new Error('Sensitive route reload not complete');
    }
  });

  assert.deepEqual(exceptions, [], `Browser JavaScript exceptions: ${exceptions.join(', ')}`);
  console.log('Clarity browser tests passed');
} finally {
  if (socket && socket.readyState < 2) socket.close();
  browser.kill();
  await Promise.race([
    new Promise((resolve) => browser.once('exit', resolve)),
    delay(3000)
  ]);
  const safePrefix = path.join(os.tmpdir(), 'kore-clarity-');
  if (profile.startsWith(safePrefix)) {
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); }
    catch (error) { console.warn(`Temporary Chrome profile could not be removed: ${profile}`); }
  }
}

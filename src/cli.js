#!/usr/bin/env node
'use strict';

/**
 * zhipu-bulk-apikey CLI — mint BigModel (open.bigmodel.cn) accounts, one API key
 * per account, and keep only the keys that survived a live chat call + tool call.
 *
 * The CN registration chain is fully protocol-side — no browser is needed:
 *   1. mailbox    a fresh inbox address
 *   2. captcha    a Tencent TCaptcha ticket for appid 196026326 (the panel's own
 *                 appid, read out of static.bigmodel.cn/wd-paas-front bundle);
 *                 pass `--token-cmd` — any solver that prints `{ticket,randstr}`
 *                 (or writes them to `--token-file`) — e.g. the fleet's
 *                 `captcha-kit --kind tencent-http` (pure HTTP + local ONNX)
 *   3. send code  `POST /api/biz/code/emailCode/TencentVerifyCaptcha`
 *                 {deviceToken,email,typeCode:"login",ticket,randstr}
 *   4. code       read the 6-digit code from the inbox
 *                 (subject: `你的Zhipu验证码: 262019`, from the panel's notification address)
 *   5. session    `POST /api/auth/login` {email,emailCode,loginType:"email",
 *                 grantType:"customer",userType:"PERSONAL"} → `newUserFlag:"YES"`
 *                 means the account was created on the spot (no password step)
 *   6. org/proj   `GET /api/biz/customer/getCustomerInfo` → organizations[0] /
 *                 projects[0] (the default org + project the console uses)
 *   7. key        `POST /api/biz/v1/organization/<oid>/projects/<pid>/api_keys`
 *                 {name} → `data.apiKey` + `data.secretKey` → `apiKey.secretKey`
 *   8. gate       two different prompts on a FREE model (both 200, non-empty,
 *                 different) and a `get_time` tool call (max_tokens ≥1024 — the
 *                 free GLMs are reasoning models and eat the budget otherwise)
 *
 * A key is appended to `keys.txt` only after step 8 passes.
 *
 * Options:
 *   --count N        accounts (= keys) to mint                            [5]
 *   --conc N         accounts in flight at once, max 8                    [1]
 *   --gap MS         pause between accounts                               [1200]
 *   --model <id>     free model used for the live gate         [glm-4.5-flash]
 *   --token-cmd CMD  TCaptcha solver command. Placeholders: {exit} {url} {tmp}.
 *                    It must print `{ticket,randstr}` JSON on stdout or write it
 *                    to the path in --token-file.  [optional; embedded solver is default]
 *   --token-file F   file the solver writes the ticket JSON to, when it does not
 *                    print it ({tmp} in --token-cmd expands to this path's dir)
 *   --appid ID       TCaptcha appid handed to the solver               [196026326]
 *   --mail <rail>    emailnator | broker | temptf                     [emailnator]
 *   --pool <file>    proxy list, one exit per line (env ZHIPU_PROXIES) [optional]
 *   --exits N        exits tried per account before giving up             [6]
 *   --timeout MS     per-request timeout                               [60000]
 *   --verify-only    re-run every key in keys.txt through the gate
 *   --screen         only test the proxy list against BigModel
 *   --help
 *
 * Zero dependencies. Node.js >= 18. Your proxy list is OPTIONAL: pass --pool
 * (or the ZHIPU_PROXIES env) and every request goes through an exit from it;
 * without a pool the tool connects directly.
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const tls = require('tls');
const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');

const ROOT = path.basename(__dirname) === 'src' ? path.resolve(__dirname, '..') : __dirname;
const KEYS_FILE = path.join(ROOT, 'keys.txt');
const DEAD_FILE = path.join(ROOT, 'keys-dead.txt');
const ACCOUNTS_FILE = path.join(ROOT, 'accounts.json');
const OUT_DIR = path.join(ROOT, 'out');

const BASE = 'https://open.bigmodel.cn';
const API4 = `${BASE}/api/paas/v4`;
const EMAILNATOR = 'https://www.emailnator.com';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36';

// Shared/disposable boxes carry other tenants' mail: only a message that names
// this panel may supply the code (measured 2026-10-24: dddai read a stranger's
// code from a shared box). Override: --brand / ZHIPU_BRAND_RE.
let BRAND = new RegExp(process.env.ZHIPU_BRAND_RE || 'zhipu|bigmodel', 'i');

// ------------------------------------------------------------------- options
const argv = process.argv.slice(2);
function arg(name, dflt) {
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  return dflt;
}
const has = (name) => argv.includes(`--${name}`) || argv.includes(`-${name}`);

if (has('help') || has('h')) {
  console.log(`zhipu-bulk-apikey — mint BigModel accounts, one key each, verified by a live chat + tool call.

  node src/cli.js --count 5                          mint (TCaptcha solved automatically)
  node src/cli.js --verify-only                      re-check every key in keys.txt
  node src/cli.js --screen                           test your proxy list against BigModel
  node src/cli.js --help

  --count N      accounts to mint                                         [5]
  --model <id>   free model used for the live gate           [glm-4.5-flash]
  --auto         solve the TCaptcha with the embedded solver (default)
  --no-auto      disable the embedded solver
  --dry          resolve the plan, write nothing (no network, no files)
  --appid ID     TCaptcha appid, used as the widget sitekey  [196026326]
  --brand RE     sender/subject fence for the code mail (env ZHIPU_BRAND_RE)
Advanced TCaptcha solver wiring (env-only) is described in ADVANCED.md; if Chrome
is not found, install it once or point CHROME_PATH at it. Requests go through
your proxy list when one is provided (--pool / env); without a pool the tool
connects directly.`);
  process.exit(0);
}

const COUNT = Math.max(1, parseInt(arg('count', '5'), 10) || 5);
const CONC = Math.min(8, Math.max(1, parseInt(arg('conc', '1'), 10) || 1));
const GAP_MS = Math.max(0, parseInt(arg('gap', '1200'), 10) || 0);
const EXITS = Math.max(1, parseInt(arg('exits', '6'), 10) || 6);
const TIMEOUT_MS = Math.max(5000, parseInt(arg('timeout', '60000'), 10) || 60000);
const MODEL = arg('model', 'glm-4.5-flash');
const APPID = arg('appid', process.env.ZHIPU_CAPTCHA_APPID || '196026326');
const TOKEN_CMD = arg('token-cmd', '');
const TOKEN_FILE = arg('token-file', '');
const MAIL = arg('mail', 'emailnator');
const VERIFY_ONLY = has('verify-only');
const SCREEN = has('screen');
const AUTO = !has('no-auto'); // the embedded solver is the default path (one command)
const DRY = has('dry'); // resolve the plan, write nothing, send nothing
if (arg('brand')) BRAND = new RegExp(arg('brand'), 'i'); // --brand overrides the mail fence
/** Lazy require: a checkout without src/solver.js still runs off --token-cmd. */
let _solver = null;
const solver = () => (_solver && _solver.solveCaptcha ? _solver : (_solver = require('./solver.js')));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
if (!DRY) fs.mkdirSync(OUT_DIR, { recursive: true });
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

// ------------------------------------------------------------------- proxy
function parseProxy(line) {
  const s = String(line || '').trim();
  if (!s || s.startsWith('#')) return null;
  let m = s.match(/^(https?|socks5h?|socks4):\/\/(?:([^:@/]+):([^@/]+)@)?([^:/]+):(\d+)/i);
  if (!m) m = s.match(/^(?:([^:@/]+):([^@/]+)@)?([^:/]+):(\d+)$/);
  if (!m) return null;
  if (m.length === 6) {
    const raw = m[1].toLowerCase();
    if (raw === 'socks4') return null;
    const protocol = raw.startsWith('socks') ? 'socks5' : 'http';
    return { protocol, host: m[4], port: Number(m[5]), auth: m[2] ? `${m[2]}:${m[3]}` : null, line: s };
  }
  return { protocol: 'http', host: m[3], port: Number(m[4]), auth: m[1] ? `${m[1]}:${m[2]}` : null, line: s };
}

function directConnect(host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const sock = net.connect({ host, port, family: 4 }); // CN hosts publish broken AAAA; happy-eyeballs ETIMEDOUTs
    const t = setTimeout(() => { sock.destroy(); reject(new Error(`connect timeout (${host}:${port})`)); }, timeoutMs);
    sock.once('error', (e) => { clearTimeout(t); try { sock.destroy(); } catch {} reject(new Error(`connect failed: ${e.message}`)); });
    sock.once('connect', () => { clearTimeout(t); resolve(sock); });
  });
}

function connectThrough(proxy, host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const sock = net.connect({ host: proxy.host, port: proxy.port });
    const t = setTimeout(() => { sock.destroy(); reject(new Error(`proxy timeout (${proxy.host}:${proxy.port})`)); }, timeoutMs);
    const done = (err, s) => { clearTimeout(t); if (err) { try { sock.destroy(); } catch {} reject(err); } else resolve(s); };
    sock.once('error', (e) => done(new Error(`proxy connect failed: ${e.message}`)));
    sock.once('connect', () => {
      if (proxy.protocol === 'socks5') {
        sock.write(proxy.auth ? Buffer.from([5, 2, 0, 2]) : Buffer.from([5, 1, 0]));
        let stage = 0;
        let buf = Buffer.alloc(0);
        const sendConnect = () => {
          const hb = Buffer.from(host);
          sock.write(Buffer.concat([Buffer.from([5, 1, 0, 3, hb.length]), hb, Buffer.from([port >> 8, port & 0xff])]));
        };
        const onData = (d) => {
          try {
            buf = Buffer.concat([buf, d]);
            for (;;) {
              if (stage === 0) {
                if (buf.length < 2) return;
                const v = buf; buf = buf.slice(2);
                if (v[0] !== 5) return done(new Error('SOCKS5 bad version'));
                if (v[1] === 2) {
                  if (!proxy.auth) return done(new Error('SOCKS5 auth required'));
                  const [u, p] = proxy.auth.split(':');
                  sock.write(Buffer.concat([Buffer.from([1, u.length]), Buffer.from(u), Buffer.from([p.length]), Buffer.from(p)]));
                  stage = 1;
                  continue;
                }
                if (v[1] !== 0) return done(new Error('SOCKS5 no acceptable method'));
                stage = 2; sendConnect(); continue;
              }
              if (stage === 1) {
                if (buf.length < 2) return;
                const v = buf; buf = buf.slice(2);
                if (v[1] !== 0) return done(new Error('SOCKS5 auth failed'));
                stage = 2; sendConnect(); continue;
              }
              if (stage === 2) {
                if (buf.length < 5) return;
                const atyp = buf[3];
                const need = 4 + (atyp === 1 ? 4 : atyp === 3 ? 1 + buf[4] : 16) + 2;
                if (buf.length < need) return;
                const rep = buf[1]; buf = buf.slice(need);
                if (rep !== 0) return done(new Error(`SOCKS5 connect failed (code ${rep})`));
                sock.off('data', onData);
                return done(null, sock);
              }
            }
          } catch (e) { done(e); }
        };
        sock.on('data', onData);
        return;
      }
      const auth = proxy.auth ? `Proxy-Authorization: Basic ${Buffer.from(proxy.auth).toString('base64')}\r\n` : '';
      sock.write(`CONNECT ${host}:${port} HTTP/1.1\r\nHost: ${host}:${port}\r\n${auth}\r\n`);
      let buf = '';
      const onData = (d) => {
        buf += d;
        if (!buf.includes('\r\n\r\n')) return;
        sock.off('data', onData);
        if (!/^HTTP\/\d(\.\d)? 200/.test(buf)) return done(new Error(`proxy CONNECT refused: ${buf.split('\r\n')[0]}`));
        done(null, sock);
      };
      sock.on('data', onData);
    });
  });
}

async function exitFetch(proxy, url, { method = 'GET', headers = {}, body = null, timeoutMs = TIMEOUT_MS } = {}) {
  const u = new URL(url);
  const raw = proxy ? await connectThrough(proxy, u.hostname, u.port || 443, timeoutMs) : await directConnect(u.hostname, u.port || 443, timeoutMs);
  const sock = tls.connect({ socket: raw, servername: u.hostname });
  await new Promise((res, rej) => { sock.once('secureConnect', res); sock.once('error', rej); });
  const chunks = [];
  let resolve, reject;
  const p = new Promise((res, rej) => { resolve = res; reject = rej; });
  const req = http.request({
    method,
    path: u.pathname + u.search,
    createConnection: () => sock,
    headers: { host: u.host, 'user-agent': UA, accept: '*/*', origin: BASE, referer: `${BASE}/login`, ...headers },
  });
  const t = setTimeout(() => { try { req.destroy(); } catch {} reject(new Error('request timeout')); }, timeoutMs);
  req.on('response', (res) => {
    res.on('data', (c) => chunks.push(c));
    res.on('end', () => {
      clearTimeout(t);
      resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') });
    });
  });
  req.on('error', (e) => { clearTimeout(t); reject(e); });
  if (body != null) req.write(Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)));
  req.end();
  return p;
}

async function exitJson(proxy, url, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  const body = opts.body;
  if (body != null && !Buffer.isBuffer(body)) headers['content-type'] = 'application/json';
  const r = await exitFetch(proxy, url, { ...opts, headers });
  let json = null;
  try { json = JSON.parse(r.body); } catch { /* not json */ }
  return { status: r.status, json, text: r.body };
}

// ------------------------------------------------------------------- pool
function loadExits() {
  const poolArg = arg('pool', process.env.ZHIPU_PROXIES || 'proxies.txt');
  const poolFile = fs.existsSync(path.resolve(poolArg)) ? path.resolve(poolArg) : path.resolve(ROOT, poolArg);
  if (!fs.existsSync(poolFile)) {
    console.log(`no proxy list at ${poolFile} — running WITHOUT a proxy (direct). Put exits there (or pass --pool) to route through them.`);
    return [null];
  }
  const exits = fs.readFileSync(poolFile, 'utf8').split(/\r?\n/).map(parseProxy).filter(Boolean);
  if (!exits.length) {
    console.log(`${poolFile} has no usable exits — running WITHOUT a proxy (direct).`);
    return [null];
  }
  return exits;
}
/** A dead exit, not a panel verdict — the flow rotates to the next candidate. */
const isExitError = (e) =>
  /proxy connect failed|proxy CONNECT refused|proxy timeout|connect timeout|connect failed|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ECONNABORTED|EPIPE|ENETUNREACH|EHOSTUNREACH|EAI_AGAIN|socket hang up|secureConnect|TLS|handshake/i.test(
    String((e && e.message) || e),
  );

/** `host:port` of the exit in play, or `direct` when the pool is empty. */
const exitLabel = (e) => (e ? `${e.host}:${e.port}` : 'direct');


async function screen(exits) {
  let ok = 0;
  for (const e of exits.slice(0, 64)) {
    try {
      const t0 = Date.now();
      const r = await exitFetch(e, `${API4}/models`, { headers: { authorization: 'Bearer bogus' }, timeoutMs: 20000 });
      // 401 is the healthy answer: the endpoint is reachable and checks auth.
      const good = r.status === 401 || r.status === 200;
      if (good) ok++;
      console.log(`  ${good ? '✔' : '✘'} ${e ? `${e.host}:${e.port}` : 'direct'} status=${r.status} ${Date.now() - t0}ms`);
    } catch (err) {
      console.log(`  ✘ ${e ? `${e.host}:${e.port}` : 'direct'} ${String(err.message).slice(0, 80)}`);
    }
  }
  console.log(`screened ${Math.min(exits.length, 64)} exit(s): ${ok} reach ${BASE}`);
  return ok;
}

// ------------------------------------------------------------------- mail
async function newMailbox(exit) {
  if (MAIL === 'broker') {
    const port = Number(arg('broker-port', '9700'));
    const r = await fetch(`http://127.0.0.1:${port}/create`, { method: 'POST' });
    const j = await r.json();
    if (!j || !j.address || !j.token) throw new Error('broker create: missing address/token');
    return { rail: 'broker', address: j.address, token: j.token };
  }
  if (MAIL === 'temptf') {
    // Vendored: src/vendor/{temptf,proxy,mailtrap}.js ship inside this repo.
    const { TempTf } = require(path.join(__dirname, 'vendor', 'temptf.js'));
    const tf = new TempTf({ log: () => {} });
    await tf.createAccount();
    return { rail: 'temptf', address: tf.address, tf };
  }
  const r = await exitJson(exit, `${EMAILNATOR}/api/generate-email`, {
    method: 'POST',
    body: { ids: [3] },
    headers: { origin: EMAILNATOR, referer: `${EMAILNATOR}/` },
  });
  const dotted = r.json && r.json.email;
  if (!dotted || !/@gmail\.com$/i.test(dotted)) throw new Error(`emailnator generate ${r.status}: ${String(r.text).slice(0, 120)}`);
  const [local, domain] = dotted.split('@');
  return { rail: 'emailnator', dotted, address: `${local.replace(/\./g, '')}@${domain}` };
}

const CODE_WINDOW_MS = 240000;

/**
 * Ids already in the box, taken BEFORE the code is requested: the emailnator
 * gmail pool is shared and recycled, so a mail that was already there belongs to
 * another tenant (its code comes back as "incorrect or expired"). A failed
 * snapshot is not an empty box — it throws.
 */
async function inboxIds(exit, address) {
  let last = null;
  for (let k = 0; k < 4; k++) {
    try {
      const r = await exitJson(exit, `${EMAILNATOR}/api/message-list`, { method: 'POST', body: { email: address, limit: 20 } });
      const msgs = r.json && r.json.messages;
      if (Array.isArray(msgs)) return new Set(msgs.map((m) => String((m && m.id) || '')).filter(Boolean));
      last = new Error(`message-list ${r.status}`);
    } catch (e) {
      last = e;
    }
    await sleep(4000);
  }
  throw new Error(`emailnator snapshot failed: ${String((last && last.message) || last).slice(0, 90)}`);
}

async function waitCode(exit, box, { timeoutMs = CODE_WINDOW_MS, pollMs = 5000, seenIds = [] } = {}) {
  const deadline = Date.now() + timeoutMs;
  const seen = new Set(seenIds.map(String));
  while (Date.now() < deadline) {
    let msgs = [];
    try {
      if (box.rail === 'broker') {
        const r = await fetch(`http://127.0.0.1:${arg('broker-port', '9700')}/list?token=${encodeURIComponent(box.token)}`);
        const j = await r.json();
        msgs = (j && j.messages) || [];
        for (const m of msgs) {
          if (seen.has(m.id)) continue;
          seen.add(m.id);
          const rd = await fetch(`http://127.0.0.1:${arg('broker-port', '9700')}/read?id=${encodeURIComponent(m.id)}&token=${encodeURIComponent(box.token)}`).then((x) => x.json()).catch(() => null);
          if (!BRAND.test(`${m.from || ''} ${(rd && rd.subject) || m.subject || ''}`)) continue; // the panel's own mail only
          const text = rd ? `${rd.subject || ''} ${rd.text || ''} ${rd.html || ''}` : '';
          const code = codeIn(text);
          if (code) return { code, subject: (rd && rd.subject) || m.subject || '' };
        }
      } else if (box.rail === 'temptf') {
        // waitForCode resolves the code **string** (not a message object), so it
        // is used directly: feeding it through codeIn() found nothing and the
        // loop burned its whole window while the mail was already in the inbox.
        const code = await box.tf.waitForCode({ timeoutMs: 60000, pollMs, log: () => {} }).catch(() => null);
        if (code) return { code, subject: 'zhipu verification mail' };
      } else {
        const r = await exitJson(exit, `${EMAILNATOR}/api/message-list`, { method: 'POST', body: { email: box.address, limit: 20 } });
        msgs = (r.json && r.json.messages) || [];
        for (const m of msgs) {
          if (seen.has(m.id)) continue;
          seen.add(m.id);
          if (!BRAND.test(`${m.from || ''} ${m.subject || ''}`)) continue; // the panel's own mail only
          const rd = await exitJson(exit, `${EMAILNATOR}/api/message/${encodeURIComponent(m.id)}`).catch(() => null);
          const code = rd ? codeIn(`${rd.content || rd.html || rd.text || ''} ${rd.subject || ''}`) : null;
          if (code) return { code, subject: m.subject || '' };
        }
      }
    } catch (e) { /* retry */ }
    await sleep(pollMs);
  }
  throw new Error('no verification code inside the window');
}

function codeIn(text) {
  const blob = String(text || '').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ');
  const m = blob.match(/验证码[^\d]{0,24}(\d{4,8})/) || blob.match(/(?:code|verification)[^\d]{0,24}(\d{4,8})/i) || blob.match(/\b(\d{6})\b/);
  return m ? m[1] : null;
}

// ------------------------------------------------------------------- captcha
/** The embedded TCaptcha rail (--auto): a ticket/randstr pair straight from the panel's appid. */
async function autoTicket(exit) {
  const r = await solver().solveCaptcha({ type: 'tencent', sitekey: APPID, url: `${BASE}/login`, proxy: exit ? exit.line : null });
  if (r && r.ticket && r.randstr) return { ticket: String(r.ticket), randstr: String(r.randstr) };
  throw new Error('the embedded TCaptcha solver (--auto) produced no ticket');
}
/** Runs the caller's TCaptcha solver for one account and returns { ticket, randstr }. */
function tencentTicket(exit) {
  if (!TOKEN_CMD) return autoTicket(exit);
  const tmp = path.join(OUT_DIR, `captcha-${Date.now().toString(36)}`);
  fs.mkdirSync(tmp, { recursive: true });
  const file = TOKEN_FILE ? TOKEN_FILE.replace(/\{tmp\}/g, tmp) : path.join(tmp, 'ticket.json');
  const cmd = TOKEN_CMD
    .replace(/\{exit\}/g, exit ? exit.line : '')
    .replace(/\{url\}/g, `${BASE}/login`)
    .replace(/\{tmp\}/g, tmp)
    .replace(/\{file\}/g, file);
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, { shell: true, windowsHide: true, env: { ...process.env, TCAPTCHA_PROXY: exit ? exit.line : '', TCAPTCHA_APPID: APPID } });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    const t = setTimeout(() => { try { child.kill(); } catch {} reject(new Error('captcha solver timed out (480s)')); }, 480000);
    child.on('error', (e) => { clearTimeout(t); reject(e); });
    child.on('close', () => {
      clearTimeout(t);
      const pick = (o) => {
        if (o && o.ticket && o.randstr) return { ticket: String(o.ticket), randstr: String(o.randstr) };
        return null;
      };
      // stdout JSON first, then the file the solver was told to write
      for (const line of out.split(/\r?\n/)) {
        const s = line.trim();
        if (!s.startsWith('{')) continue;
        let j; try { j = JSON.parse(s); } catch { continue; }
        const got = pick(j) || pick(j.data);
        if (got) return resolve(got);
      }
      try {
        const j = JSON.parse(fs.readFileSync(file, 'utf8'));
        const got = pick(j) || pick(j.data);
        if (got) return resolve(got);
      } catch (e) { /* fall through */ }
      reject(new Error(`captcha solver produced no ticket (cmd: ${cmd.slice(0, 120)}…)`));
    });
  });
}

// ------------------------------------------------------------------- flows
function readKeys() {
  try { return fs.readFileSync(KEYS_FILE, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean); } catch { return []; }
}
function appendKey(key) { fs.appendFileSync(KEYS_FILE, (fs.existsSync(KEYS_FILE) && fs.statSync(KEYS_FILE).size ? '\n' : '') + key + '\n'); }
function loadAccounts() { try { return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8')); } catch { return []; } }
function saveAccounts(list) { fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(list, null, 2) + '\n'); }

async function signUp(exit) {
  const box = await newMailbox(exit);
  log(`  box ${box.address} (${box.rail})`);
  // Snapshot BEFORE the code is requested: shared box, so only newer ids count.
  const seenIds = box.rail === 'emailnator' ? [...(await inboxIds(exit, box.address))] : [];
  const { ticket, randstr } = await tencentTicket(exit);
  log(`  tc-ticket ${ticket.length}c`);
  const send = await exitJson(exit, `${BASE}/api/biz/code/emailCode/TencentVerifyCaptcha`, {
    method: 'POST',
    body: { deviceToken: '', email: box.address, typeCode: 'login', ticket, randstr },
  });
  if (!(send.json && send.json.success)) throw new Error(`sendCode ${send.status}: ${String(send.text).slice(0, 160)}`);
  log(`  code sent → ${String(send.text).slice(0, 80)}`);
  const { code, subject } = await waitCode(exit, box, { seenIds });
  log(`  code ${code} «${String(subject).slice(0, 40)}»`);
  const login = await exitJson(exit, `${BASE}/api/auth/login`, {
    method: 'POST',
    body: { email: box.address, emailCode: code, loginType: 'email', grantType: 'customer', userType: 'PERSONAL' },
  });
  const jwt = login.json && login.json.data && login.json.data.access_token;
  if (!jwt) throw new Error(`login ${login.status}: ${String(login.text).slice(0, 160)}`);
  const auth = { authorization: `Bearer ${jwt}` };
  const who = await exitJson(exit, `${BASE}/api/biz/customer/getCustomerInfo`, { headers: auth });
  const d = (who.json && who.json.data) || {};
  let oid = d.organizationId;
  let pid = d.projectId;
  for (const o of d.organizations || []) {
    const proj = (o.projects || []).find((p) => p.isDefault) || (o.projects || [])[0];
    if (o.organizationId && proj && proj.projectId) { oid = o.organizationId; pid = proj.projectId; break; }
  }
  if (!oid || !pid) throw new Error(`no default org/project (customerinfo ${who.status}): ${String(who.text).slice(0, 140)}`);
  const name = `bulk-${crypto.randomBytes(3).toString('hex')}`;
  const created = await exitJson(exit, `${BASE}/api/biz/v1/organization/${oid}/projects/${pid}/api_keys`, { method: 'POST', headers: auth, body: { name } });
  const cdata = (created.json && created.json.data) || {};
  const apiKey = cdata.apiKey || cdata.api_key;
  const secret = cdata.secretKey || cdata.secret;
  const key = apiKey ? (secret ? `${apiKey}.${secret}` : apiKey) : null;
  return { address: box.address, rail: box.rail, subject, newUser: !!(login.json && login.json.data && login.json.data.newUserFlag === 'YES'), oid, pid, key, createStatus: created.status, createBody: String(created.text).slice(0, 160) };
}

const P1 = 'Reply with the single word: pong';
const P2 = 'Name three colours, comma separated.';
const TOOLS = [{ type: 'function', function: { name: 'get_time', description: 'Returns the current time', parameters: { type: 'object', properties: {} } } }];
const msgOf = (j) => (j && j.choices && j.choices[0] && j.choices[0].message) || {};
function textOf(j) { const m = msgOf(j); return String(m.content || m.reasoning_content || m.reasoning || '').trim(); }

async function chatGate(exit, key, model = MODEL) {
  const H = { authorization: `Bearer ${key}` };
  const call = (body) => exitJson(exit, `${API4}/chat/completions`, { method: 'POST', headers: H, body });
  const a = await call({ model, messages: [{ role: 'user', content: P1 }], max_tokens: 64, do_sample: false });
  const ta = textOf(a.json);
  await sleep(900);
  const b = await call({ model, messages: [{ role: 'user', content: P2 }], max_tokens: 64, do_sample: false });
  const tb = textOf(b.json);
  const sanity = a.status === 200 && b.status === 200 && !!ta && !!tb && ta !== tb;
  let tools = null;
  if (sanity) {
    // reasoning models spend the budget on thinking: max_tokens must be ≥1024.
    const c = await call({ model, messages: [{ role: 'user', content: 'What time is it right now? Use the get_time tool.' }], tools: TOOLS, tool_choice: 'auto', max_tokens: 1024 });
    const mc = msgOf(c.json);
    const calls = mc.tool_calls || [];
    tools = { status: c.status, present: calls.length > 0, names: calls.map((x) => x && x.function && x.function.name).filter(Boolean) };
  }
  return { ok: sanity, status: a.status || b.status, sanity, tools, sample: String(ta || a.text).slice(0, 120) };
}

async function mint() {
  const exits = loadExits();
  if (DRY) {
    console.log('dry run — nothing is written and no request is sent.');
    console.log(`  count ${COUNT} · conc ${CONC} · model ${MODEL} · exits ${exits.filter(Boolean).length || 'direct'} · solver ${AUTO ? 'embedded src/solver.js (--auto)' : 'off (--no-auto)'}`);
    return;
  }
  if (SCREEN) return void (await screen(exits));
  const accounts = loadAccounts();
  const routes = exits[0] === null ? 1 : EXITS;
  log(`zhipu · ${COUNT} key(s) · conc ${CONC} · mail ${MAIL} · exits ${exits.filter(Boolean).length || 'direct'} · up to ${routes} per account · keys land in keys.txt`);
  let made = 0;
  let transportDead = 0;
  for (let round = 0; round < COUNT; round += CONC) {
    const jobs = [];
    for (let k = 0; k < CONC && round + k < COUNT; k++) {
      const i = round + k;
      jobs.push((async () => {
        let lastErr = null;
        let lastWasExit = false;
        for (let a = 0; a < routes; a++) {
          const exit = exits[(i + a) % exits.length];
          lastWasExit = false;
          try {
            const rec = await signUp(exit);
            if (!rec.key) { lastErr = new Error(`no key material (create ${rec.createStatus}: ${rec.createBody})`); continue; }
            const g = await chatGate(exit, rec.key);
            if (!g.ok) {
              lastErr = new Error(`gate ${g.status}: ${g.sample}`);
              accounts.push({ at: new Date().toISOString(), email: rec.address, exit: exit ? `${exit.host}:${exit.port}` : 'direct', gate: g.status });
              saveAccounts(accounts);
              continue;
            }
            appendKey(rec.key);
            accounts.push({ at: new Date().toISOString(), email: rec.address, rail: rec.rail, newUser: rec.newUser, oid: rec.oid, pid: rec.pid, exit: exit ? `${exit.host}:${exit.port}` : 'direct', key_masked: `${rec.key.slice(0, 8)}…`, gate: 200, tools: g.tools ? g.tools.names.join('+') : null });
            saveAccounts(accounts);
            made++;
            log(`account ${i + 1} ✔ chat-200 ${MODEL} · tools=${g.tools ? (g.tools.present ? g.tools.names.join('+') : 'none') : '-'} · ${rec.key.slice(0, 8)}…`);
            return;
          } catch (e) {
            lastErr = e;
            lastWasExit = isExitError(e);
            if (lastWasExit) {
              const where = exit ? `exit ${a + 1}/${routes} ${exitLabel(exit)}` : `direct attempt ${a + 1}/${routes}`;
              log(`account ${i + 1}: ${where} dead (${String(e.message).slice(0, 70)})${exit ? ' → next exit' : ''}`);
            }
          }
        }
        if (lastWasExit) transportDead++;
        log(`account ${i + 1}: ${lastErr ? String(lastErr.message).slice(0, 160) : 'failed'}`);
      })());
    }
    await Promise.all(jobs);
    if (GAP_MS) await sleep(GAP_MS);
  }
  if (!made && transportDead === COUNT) {
    const route = exits[0] === null ? 'direct mode (no proxy list)' : `${exits.length}-exit pool`;
    console.error(`[fatal] no usable route — ${COUNT} account(s) × ${routes} candidate(s) over ${route}: every attempt died at the transport layer.`);
    process.exit(1);
  }
  log(`done — ${made}/${COUNT} key(s) written to ${KEYS_FILE}`);
  console.log(`__MINT_SUMMARY__ ${JSON.stringify({ requested: COUNT, live: made, keysFile: KEYS_FILE, deadFile: DEAD_FILE })}`);
}

async function verifyOnly() {
  const exits = loadExits();
  const keys = readKeys();
  if (!keys.length) { console.log(`no keys in ${KEYS_FILE}`); process.exit(0); }
  let live = 0;
  const dead = [];
  for (let i = 0; i < keys.length; i++) {
    const exit = exits[i % exits.length];
    try {
      const g = await chatGate(exit, keys[i]);
      if (g.ok) live++;
      else dead.push({ key: keys[i], why: `chat=${g.status}` });
      console.log(`  ${g.ok ? '✔' : '✘'} ${keys[i].slice(0, 8)}… chat=${g.status} tools=${g.tools ? (g.tools.present ? g.tools.names.join('+') : 'none') : '-'}`);
    } catch (e) {
      dead.push({ key: keys[i], why: String(e.message).slice(0, 60) });
      console.log(`  ✘ ${keys[i].slice(0, 8)}… ${String(e.message).slice(0, 90)}`);
    }
  }
  fs.writeFileSync(DEAD_FILE, dead.map((d) => `${d.key}\t# ${d.why}`).join('\n') + (dead.length ? '\n' : ''));
  console.log(`verify: ${live}/${keys.length} keys live — the ${dead.length} dead one(s) are in ${DEAD_FILE}`);
  process.exit(live === keys.length ? 0 : 1);
}

(VERIFY_ONLY ? verifyOnly() : mint()).catch((e) => { console.error('[fatal]', e.message); process.exit(1); });

<div align="center">

```
███████╗██╗  ██╗██╗██████╗ ██╗   ██╗
╚══███╔╝██║  ██║██║██╔══██╗██║   ██║
  ███╔╝ ███████║██║██████╔╝██║   ██║
 ███╔╝  ██╔══██║██║██╔═══╝ ██║   ██║
███████╗██║  ██║██║██║     ╚██████╔╝
╚══════╝╚═╝  ╚═╝╚═╝╚═╝      ╚═════╝
```

# zhipu-bulk-apikey

**Bulk-create BigModel (Zhipu) accounts with API keys — the registration chain is pure HTTP (TCaptcha ticket + e-mail code), OpenAI-compatible GLM inference, plus a 9Router connector.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-11%20served-412991?style=for-the-badge)](https://docs.bigmodel.cn/cn/guide/models/free/glm-4.5-flash)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Quick start](#-quick-start) · [🎁 Free tier](#-free-tier--how-much-you-get) · [🤖 Models](#-models--all-11-of-them) · [🧪 Use the API](#-how-to-use-the-api) · [✅ Verified](#-verified-working--every-key-is-tested) · [🧭 How it works](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Options](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Issues](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Why this exists

BigModel (`open.bigmodel.cn`, Zhipu's CN platform) serves the GLM family over an **OpenAI-compatible** `…/api/paas/v4` endpoint, and its free tier is real: `glm-4.5-flash`, `glm-4.7-flash` and `glm-4.6v-flash` answer live chats on an account whose console balance reads **0**. The interesting part is the door: the CN registration chain (TCaptcha → e-mail code → login) is **fully protocol-side** — no browser is needed for the flow itself — so one command turns a fresh inbox address into an account, a project key and a verified `keys.txt` line. Because the quota lives on the **account**, the tool mints **one account per key**, each one gated by two different prompts and a real `get_time` tool call before it is written down.

## 🎁 Free tier — how much you get

| What | Value |
| --- | --- |
| Free model ids | **`glm-4.5-flash`**, **`glm-4.7-flash`**, **`glm-4.6v-flash`** — the documented `models/free/` set (`glm-4.5-flash`: "完全免费开放使用"); all three answer this account
| Account balance | **0** — console report `balance 0 · giveAmount 0 · recharge 0 · creditStatus NOT_OPEN` (`providers/zhipu/out/12-cn-account-balance-zero.txt`) |
| Paid models on that account | `glm-4.5-air`, `glm-5-turbo`, `glm-5.3-flash` → `429 {"code":"1113","message":"余额不足或无可用资源包,请充值。"}` — so a 200 is *not* explained by credit: the free models really are free |
| Signup cost | none — **no card, no SMS**: e-mail code only; the account carries `acType: NOT_AC` (no 实名认证) and the API still works |
| What one account gets | its own org + default project, and a key minted on it (`POST …/organization/<oid>/projects/<pid>/api_keys`) |
| Rate limit | `glm-4.6v-flash` mostly answers `1305 该模型当前访问量过大` (busy, retry); `glm-4.7-flash` cleared on the second attempt |
| Key shape | 49 chars, the console pair `<apiKey>.<secretKey>` joined with a dot |
| The gate | two **different** prompts, both 200 and non-empty and different, plus a `get_time` tool call |

> 💡 The free tier is set by Zhipu BigModel and can change. Check the live numbers at [open.bigmodel.cn](https://open.bigmodel.cn) — and let the tool's own gate decide:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Models — all 11 of them

`GET /api/paas/v4/models` with a fresh key answers **11 ids** — that is the number on the badge (`providers/zhipu/out/01-models.json`):

| Model ID | Notes |
| --- | --- |
| `glm-4.5`, `glm-4.5-air` | 4.5 generation (`-air` is the cheap paid tier) |
| `glm-4.6`, `glm-4.7` | 4.6 / 4.7 generation |
| `glm-5`, `glm-5-turbo` | 5 generation |
| `glm-5.1`, `glm-5.2`, `glm-5.3` | 5.x generation |
| `glm-5.3-flash`, `glm-5.3-flashx` | flash variants |

**The free ids are not in that list** — they are documented separately under `models/free/` and verified live on this account: `glm-4.5-flash` (**the tool's gate model**: 200 with real content), `glm-4.7-flash` (200, `"OK"`), `glm-4.6v-flash` (reachable, usually busy). A paid id on a zero-balance account answers `1113` until the account is topped up, which is exactly why the tool gates on `glm-4.5-flash`.

The same key answers on `api.z.ai/api/paas/v4` with **the identical 11 ids** — BigModel and Z.AI share one key space, so the router can point at either host.

## 🧪 How to use the API

The base URL is **`https://open.bigmodel.cn/api/paas/v4`** — OpenAI-compatible, so anything that speaks OpenAI works (SDKs, Cursor, OpenCode, Kilo Code, …).

```bash
curl https://open.bigmodel.cn/api/paas/v4/chat/completions \
  -H "Authorization: Bearer <apiKey>.<secretKey>" \
  -H 'Content-Type: application/json' \
  -d '{"model":"glm-4.5-flash","messages":[{"role":"user","content":"say ok"}],"max_tokens":1024}'
```

Two things that bite:

* the key is the console's **`<apiKey>.<secretKey>`** pair — both halves, joined with a dot, go in the `Authorization: Bearer` header (the bare `apiKey` is not enough);
* `glm-4.5-flash` is a **reasoning** model (thinking on by default) and the thinking eats the token budget — for a `tool_calls` answer use `max_tokens ≥ 1024` (with `256` the call is sometimes silently empty; measured in `providers/zhipu/out/09-tools-check.txt`).

## 🛠 Quick start

```bash
cd zhipu-bulk-apikey

# 1) optional: your exit pool, one per line
printf 'http://host:port\n' > proxies.txt

# 2) mint, one account (one key) per iteration. The TCaptcha ticket comes from
#    any solver that prints {ticket,randstr} — the fleet uses captcha-kit:
node src/cli.js --count 1 --pool proxies.txt \
  --token-cmd "node ../proxy-lab/captcha-kit.js --kind tencent-http --appid 196026326 --url https://open.bigmodel.cn/register --exit {exit} --out {tmp}/kit" \
  --token-file "{tmp}/kit/tencent-http.json"

# 3) any time afterwards
node src/cli.js --verify-only     # re-test every key in keys.txt with a real chat + tool call
node src/cli.js --screen          # probe the pool exits against BigModel
node src/launcher.js              # interactive menu (mint / verify / screen / 9Router)
```

### Where the account comes from

No browser, no password: the CLI asks its mailbox rail for a fresh address, solves the panel's **Tencent TCaptcha** (appid `196026326`, read out of `static.bigmodel.cn/wd-paas-front`) through `--token-cmd`, sends the code with `POST /api/biz/code/emailCode/TencentVerifyCaptcha`, reads the 6-digit code the panel mails from its own notification address (`notifications [at] account.bigmodel.cn`), and posts `POST /api/auth/login` — `newUserFlag:"YES"` means the account was created on the spot. It then picks the default org/project from `GET /api/biz/customer/getCustomerInfo` and mints the key. Run `node src/cli.js --help` for the full flag list.

### 🖱️ The launcher

`src/launcher.js` (same banner as this README) asks for the count, the proxy list file and the verification model, remembers them in `launcher.config.json`, and runs the CLI with the right flags — then offers the 9Router and OmniRoute connectors. `src/connect-9router.js` registers the provider under prefix `zhipu` with `glm-4.5-flash` as the default model.

## 🚀 One command

The captcha is solved for you — one command mints N accounts and keeps only the keys a live chat call verified:

```bash
npm install                  # once: pulls puppeteer-core
npm start                    # menu → "1) Mint keys" → "How many keys?" (Enter = 10)
# or non-interactive:
node src/cli.js --count N
```

`--auto` is the default and nothing has to be passed: the embedded `src/solver.js` opens a headed Chrome over the account's own exit and returns the panel's Turnstile token automatically. `--dry` prints the resolved plan and exits with **no file written and no network call**.

> ⚠️ **Terms & account risk.** This is an automation tool, not an account vendor. Bulk sign-ups and key minting are entirely your responsibility: they may breach the provider's Terms of Service and can get addresses, exits or accounts blocked. Use it only on infrastructure you are allowed to automate, and keep the request rate low.

## 🔧 Advanced (optional)

Wiring your own solver, pasting a token by hand or pointing the tool at a specific Chrome are documented in **[ADVANCED.md](ADVANCED.md)**. The common path needs none of it.

## ✅ Verified working — every key is tested

All of it measured 2026-10-22 on two live keys (`providers/zhipu/keys.txt`, 2 lines — the z.ai account key and a key minted through the CN rail the same day):

| Check | Result |
| --- | --- |
| `GET /api/paas/v4/models` with a **bogus** key | **401** `1000 身份验证失败` — the auth check is real |
| `GET /api/paas/v4/models` with a lane key | **200**, the 11 ids above |
| `POST /chat/completions` `glm-4.5-flash`, prompt A (primes) | **200** — `content:"101,103,107"`, `reasoning_content` 946 → 3432 chars |
| same model, prompt B (a Turkish sentence) | **200** — `content:"Deniz mavidir."` ⇒ both non-empty and **different** (sanity ✓) |
| `glm-4.7-flash` (thinking off) | first try `1305 该模型当前访问量过大` → retry **200** `"OK"` |
| `glm-4.6v-flash` | `1305` (model exists, busy) — retryable class |
| paid ids (`glm-4.5-air`, `glm-5-turbo`, `glm-5.3-flash`) | `429 1113 余额不足或无可用资源包,请充值。` on an account with balance 0 ⇒ the free models' 200s are not credit |
| `GET api.z.ai/api/paas/v4/models` — **the same key** | **200**, byte-for-byte the same 11 ids (both directions) |
| tools | `get_time` `tool_calls` **200** with `max_tokens ≥ 1024` (`out/09-tools-check.txt`) |
| cross-exit | **8 live exits** across two screens all answered **200** with the same key ⇒ the key is not IP-bound; a 15-exit rescan also answered 200 everywhere |
| `preadd-gate --model glm-4.5-flash` | sanity=true · tools=get_time ✓ · 2842 ms; a fresh-exit rerun 9139 ms; the CN-rail key 6816 ms and a 300 s reverify 7373 ms |
| CN registration rail | TCaptcha ticket solved in pure HTTP (27 s, 1 attempt) → code sent → mailtrap code → `newUserFlag:"YES"` → org/project → `apiKey.secretKey`; the minted key then passed the full gate above |

Evidence: `providers/zhipu/out/verify-20261022063844.{txt,json}`, `verify-20261022073006.{txt,json}`, `01-models.json` + `.headers.txt`, `02-chat-p1.json`, `02-chat-p2.json`, `03-chat-p1-full.json` (and its headers), `04-cn-signup-gate.txt`, `07-exit-portability.txt`, `08-exit-rescan.txt`, `09-tools-check.txt`, `10-cn-tcaptcha-crack.txt`, `11-cn-lane-key-cross-exit.txt`, `12-cn-account-balance-zero.txt`, `13-cn-lane-key-paid-models-note.txt`; gate runs `proxy-lab/out/preadd-zhipu-1792651196.jsonl`, `preadd-zhipu-refresh.jsonl`, `preadd-zhipu-cn-1792654779.jsonl`; whole chain re-runnable with `proxy-lab/zhipu-verify.js`.

> **Quality gates.** Every key here passed a live `chat-200` before it was written to `keys.txt`
> (dead keys are never shipped). Router combos follow the same rule at the model level: an entry is
> added **only if the model answers `chat-200` and can call tools** — a model without tool support,
> a dead key or a dead provider is dropped instead of added. Re-run the verify step any time;
> failures are reported, never hidden.

## 🧭 How it works

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Zhipu BigModel page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://open.bigmodel.cn/api/paas/v4/chat/completions → real content = the key is live
```

Per account, all of it through one exit from your pool:

1. **mailbox** — a fresh inbox address from the configured rail (`--mail emailnator | broker | temptf`); the panel's code arrives from its notification address (`notifications [at] account.bigmodel.cn`) with the subject `你的Zhipu验证码: <6 digits>`.
2. **captcha** — a Tencent TCaptcha `{ticket,randstr}` for appid `196026326`. Pass `--token-cmd`; the solver may print the JSON on stdout or write it to `--token-file` (`{tmp}` is substituted). Pure HTTP works: the fleet's `captcha-kit --kind tencent-http` solved it in 27 s on the first attempt.
3. **send the code** — `POST /api/biz/code/emailCode/TencentVerifyCaptcha {deviceToken,email,typeCode:"login",ticket,randstr}` → `验证码已发送，请查收邮件`. A stale ticket or a missing request id is refused (probed in `out/04-cn-signup-gate.txt`).
4. **read the code** — 6 digits out of the inbox.
5. **session** — `POST /api/auth/login {email,emailCode,loginType:"email",grantType:"customer",userType:"PERSONAL"}`; `newUserFlag:"YES"` means the account was created right there — **no password step**.
6. **org/project** — `GET /api/biz/customer/getCustomerInfo` → `organizations[0]` / `projects[0]`, the default pair the console uses.
7. **key** — `POST /api/biz/v1/organization/<oid>/projects/<pid>/api_keys {name}` → `data.apiKey` + `data.secretKey`; joined with a dot that is the key.
8. **gate** — two different prompts on the free model (both 200, non-empty, different) **and** a `get_time` tool call with `max_tokens ≥ 1024`. Only then is the key appended to `keys.txt`.

## ⚙️ CLI options

```bash
node src/cli.js --count 5 --token-cmd "<solver>"   # mint
node src/cli.js --verify-only                      # re-check every key in keys.txt
node src/cli.js --screen                           # test your proxy list against BigModel
node src/cli.js --help
```

| Flag | Meaning |
| --- | --- |
| `--count N` | accounts (= keys) to mint (default `5`) |
| `--conc N` | accounts in flight at once, max `8` (default `1`) |
| `--gap MS` | pause between accounts (default `1200`) |
| `--model <id>` | free model used for the live gate (default `glm-4.5-flash`) |
| `--token-cmd CMD` | TCaptcha solver command; placeholders `{exit}`, `{url}`, `{tmp}` — **required to mint** |
| `--token-file F` | file the solver writes the ticket JSON to, when it does not print it |
| `--appid ID` | TCaptcha appid handed to the solver (default `196026326`) |
| `--mail <rail>` | `emailnator` · `broker` · `temptf` (default `emailnator`) |
| `--pool <file>` | proxy list, one exit per line (or env `ZHIPU_PROXIES`) — optional |
| `--tries N` | exits tried per account before giving up (default `2`) |
| `--timeout MS` | per-request timeout (default `60000`) |
| `--verify-only` | re-run every key in `keys.txt` through the gate |
| `--screen` | only test the proxy list against BigModel |

## 🛰️ Behind a proxy

**Optional — recommended at scale.** Pass `--pool <file>` (or set `ZHIPU_PROXIES`) and every request goes through an exit from that list (`http://host:port`, `socks5://host:port`, `host:port`, `user:pass@host:port`); without a pool the CLI prints `running WITHOUT a proxy (direct)` and connects directly.

* the key is **not exit-bound**: two screens' 8 live exits and a 15-exit rescan all returned 200 on the same key (`out/07-exit-portability.txt`, `out/08-exit-rescan.txt`, `out/11-cn-lane-key-cross-exit.txt`);
* a **saturated** exit is not a dead key — `--reverify` can stamp `dead 0ms` on an exhausted line while the same key answers 200 from a fresh one; pick exits from a live list;
* WARP is **not** used on this box (it cut the operator's remote access), so the harnesses take the pool exit explicitly.

## 📄 Files

| Path | Contents |
| --- | --- |
| `keys.txt` | one live-verified `<apiKey>.<secretKey>` per line — git-ignored |
| `proxies.txt` | your exits, one per line — git-ignored |
| `accounts.json` | account ↔ key ↔ gate record — git-ignored |
| `out/` | raw per-run material the CLI writes (models answer, chat bodies, logs) — git-ignored |
| `launcher.config.json` | remembered launcher settings — git-ignored |

Nothing else is written: no session token, no TCaptcha ticket and no mailbox password is stored on disk.

## 🔌 Connect to 9Router

[9Router](https://9router.com) is a self-hosted, OpenAI-compatible router. Register this provider once and every key in `keys.txt` becomes a connection under one provider-node:

```bash
node src/connect-9router.js
```

Defaults: `--base http://localhost:20128`, `--password 123456`, `--name "Zhipu BigModel"`, `--prefix zhipu`, `--base-url https://open.bigmodel.cn/api/paas/v4`, `--model glm-4.5-flash`. Models are served as `zhipu/<model id>` and load-balanced across every key.

> If a CN route is slow from your network, the same key works on `https://api.z.ai/api/paas/v4` — measured, same key, same 11 ids.

## 🔌 Connect to OmniRoute

[OmniRoute](https://omniroute.online) is a self-hosted, OpenAI-compatible router. Register this provider once and every key in `keys.txt` becomes a connection under one provider-node:

```bash
node src/connect-omniroute.js
```

Defaults: `--base http://localhost:20128`, `--password 123456`, `--name "Zhipu BigModel"`, `--prefix zhipu`, `--base-url https://open.bigmodel.cn/api/paas/v4`, `--model glm-4.5-flash`. Models are served as `zhipu/<model id>` and load-balanced across every key.

> If a CN route is slow from your network, the same key works on `https://api.z.ai/api/paas/v4` — measured, same key, same 11 ids.

## 🔑 What one key gets you

| | |
| --- | --- |
| 🏢 Provider | **Zhipu BigModel** — [open.bigmodel.cn](https://open.bigmodel.cn) |
| 🎁 What the provider gives | GLM free tier on a zero-balance account — the CN signup rail runs protocol-side, every key chat- and tool-verified |
| 🔑 What one key gets you | one API key scoped to its own account: the 11 model ids on the endpoint below, at your plan's limits. The quota lives on the **account**, which is exactly why this tool creates one account per key |
| 🌐 API shape | OpenAI-compatible: `POST https://open.bigmodel.cn/api/paas/v4/chat/completions` |
| 🔒 Your data | only open.bigmodel.cn and the inbox backend you configure are contacted; keys stay on your machine |

## 🐞 Issues

* **Free ids are invisible to `/models`.** `GET /models` returns the 11 paid ids only; `glm-4.5-flash` / `glm-4.7-flash` / `glm-4.6v-flash` are documented under `models/free/` and never appear in that list — do not read that as "the key has nothing".
* **There is no `/api/pricing` on this panel.** `/api/pricing`, `/api/paas/v4/pricing`, `/api/biz/pricing`, `/api/paas/pricing`, `/api/product/pricing` are all **404** — the only actionable price surface is the SPA price page plus the docs, so free-tier proof here is "balance 0 × free model 200" + the official `免费` page, never a panel ratio table.
* **Paid models answering is not free-tier proof.** A freshly created CN account currently returns 200 for `glm-4.5-air`, `glm-5-turbo` and `glm-4.6` while its spending record stays `0E-9` (`out/13-cn-lane-key-paid-models-note.txt`) — a new-account grace. On the older key the same models answer `429/1113`. Only `glm-4.5-flash` / `glm-4.7-flash` 200s are durable free-tier evidence.
* **`glm-4.5-flash` has a retirement note** (2026-01-30, requests steered to `glm-4.7-flash`). If it stops answering, switch `--model` and the gate to `glm-4.7-flash` (200 on both accounts).
* **Ticket freshness.** The TCaptcha ticket is single-use and short-lived: solve, send the code and log in back-to-back, or solve again. A request id is mandatory on the code endpoint.

If Zhipu changes the captcha appid, the code endpoint or the login shape, the tool stops at that step and prints the status and body it saw. **[Open an issue](../../issues)** with the command and the exact output; PRs are welcome.

## 📄 License

MIT © 2026 — see [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 zhipu-bulk-apikey contributors

</div>

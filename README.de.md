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

**BigModel-Konten (Zhipu) mit API-Schlüsseln im Bulk anlegen — die Registrierungskette ist reines HTTP (TCaptcha-Ticket + E-Mail-Code), OpenAI-kompatible GLM-Inferenz, plus ein 9Router-Connector.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-11%20served-412991?style=for-the-badge)](https://docs.bigmodel.cn/cn/guide/models/free/glm-4.5-flash)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Schnellstart](#-quick-start) · [🎁 Free-Tier](#-free-tier--how-much-you-get) · [🤖 Modelle](#-models--all-11-of-them) · [🧪 Die API nutzen](#-how-to-use-the-api) · [✅ Verifiziert](#-verified-working--every-key-is-tested) · [🧭 So funktioniert es](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Optionen](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Probleme](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Warum es das gibt

BigModel (`open.bigmodel.cn`, Zhipus CN-Plattform) stellt die GLM-Familie über einen **OpenAI-kompatiblen** `…/api/paas/v4`-Endpunkt bereit, und der Free-Tier ist echt: `glm-4.5-flash`, `glm-4.7-flash` und `glm-4.6v-flash` beantworten Live-Chats auf einem Konto, dessen Konsolen-Guthaben **0** anzeigt. Der interessante Teil ist die Tür: Die CN-Registrierungskette (TCaptcha → E-Mail-Code → Login) läuft **vollständig protokollseitig** — für den Ablauf selbst ist kein Browser nötig —, sodass ein einziger Befehl aus einer frischen Postfachadresse ein Konto, einen Projekt-Schlüssel und eine verifizierte `keys.txt`-Zeile macht. Weil das Kontingent am **Konto** hängt, erzeugt das Tool **ein Konto pro Schlüssel**, jedes abgesichert durch zwei verschiedene Prompts und einen echten `get_time`-Tool-Aufruf, bevor es niedergeschrieben wird.

## 🎁 Free-Tier — wie viel du bekommst

| Was | Wert |
| --- | --- |
| Kostenlose Modell-IDs | **`glm-4.5-flash`**, **`glm-4.7-flash`**, **`glm-4.6v-flash`** — das dokumentierte `models/free/`-Set (`glm-4.5-flash`: „完全免费开放使用"); alle drei antworten diesem Konto |
| Kontoguthaben | **0** — Konsolenbericht `balance 0 · giveAmount 0 · recharge 0 · creditStatus NOT_OPEN` (`providers/zhipu/out/12-cn-account-balance-zero.txt`) |
| Kostenpflichtige Modelle auf diesem Konto | `glm-4.5-air`, `glm-5-turbo`, `glm-5.3-flash` → `429 {"code":"1113","message":"余额不足或无可用资源包,请充值。"}` — eine 200 ist also *nicht* durch Guthaben erklärbar: Die kostenlosen Modelle sind wirklich kostenlos |
| Registrierungskosten | keine — **keine Karte, keine SMS**: nur E-Mail-Code; das Konto trägt `acType: NOT_AC` (keine 实名认证) und die API funktioniert trotzdem |
| Was ein Konto bekommt | eine eigene Org + ein Standardprojekt und einen darauf erzeugten Schlüssel (`POST …/organization/<oid>/projects/<pid>/api_keys`) |
| Rate Limit | `glm-4.6v-flash` antwortet meist mit `1305 该模型当前访问量过大` (ausgelastet, erneut versuchen); `glm-4.7-flash` klappte beim zweiten Versuch |
| Schlüsselformat | 49 Zeichen, das Konsolen-Paar `<apiKey>.<secretKey>` mit einem Punkt verbunden |
| Das Gate | zwei **verschiedene** Prompts, beide 200 und nicht leer und unterschiedlich, plus ein `get_time`-Tool-Aufruf |

> 💡 Der Free-Tier wird von Zhipu BigModel festgelegt und kann sich ändern. Prüfe die aktuellen Zahlen auf [open.bigmodel.cn](https://open.bigmodel.cn) — und lass das Gate des Tools selbst entscheiden:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelle — alle 11

`GET /api/paas/v4/models` mit einem frischen Schlüssel antwortet mit **11 IDs** — das ist die Zahl auf dem Badge (`providers/zhipu/out/01-models.json`):

| Modell-ID | Hinweise |
| --- | --- |
| `glm-4.5`, `glm-4.5-air` | 4.5-Generation (`-air` ist die günstige kostenpflichtige Stufe) |
| `glm-4.6`, `glm-4.7` | 4.6-/4.7-Generation |
| `glm-5`, `glm-5-turbo` | 5-Generation |
| `glm-5.1`, `glm-5.2`, `glm-5.3` | 5.x-Generation |
| `glm-5.3-flash`, `glm-5.3-flashx` | Flash-Varianten |

**Die kostenlosen IDs stehen nicht in dieser Liste** — sie sind separat unter `models/free/` dokumentiert und live auf diesem Konto verifiziert: `glm-4.5-flash` (**das Gate-Modell des Tools**: 200 mit echtem Inhalt), `glm-4.7-flash` (200, `"OK"`), `glm-4.6v-flash` (erreichbar, meist ausgelastet). Eine kostenpflichtige ID auf einem Konto mit Nullguthaben antwortet mit `1113`, bis das Konto aufgeladen wird — genau deshalb gated das Tool auf `glm-4.5-flash`.

Derselbe Schlüssel antwortet auf `api.z.ai/api/paas/v4` mit **den identischen 11 IDs** — BigModel und Z.AI teilen sich einen Schlüsselraum, sodass der Router auf beide Hosts zeigen kann.

## 🧪 So nutzt du die API

Die Basis-URL ist **`https://open.bigmodel.cn/api/paas/v4`** — OpenAI-kompatibel, also funktioniert alles, was OpenAI spricht (SDKs, Cursor, OpenCode, Kilo Code, …).

```bash
curl https://open.bigmodel.cn/api/paas/v4/chat/completions \
  -H "Authorization: Bearer <apiKey>.<secretKey>" \
  -H 'Content-Type: application/json' \
  -d '{"model":"glm-4.5-flash","messages":[{"role":"user","content":"say ok"}],"max_tokens":1024}'
```

Zwei Dinge, die beißen:

* der Schlüssel ist das Konsolen-Paar **`<apiKey>.<secretKey>`** — beide Hälften, mit einem Punkt verbunden, gehören in den `Authorization: Bearer`-Header (der bloße `apiKey` reicht nicht);
* `glm-4.5-flash` ist ein **Reasoning**-Modell (Thinking standardmäßig an) und das Thinking frisst das Token-Budget — für eine `tool_calls`-Antwort nutze `max_tokens ≥ 1024` (mit `256` ist der Aufruf manchmal still leer; gemessen in `providers/zhipu/out/09-tools-check.txt`).

## 🛠 Schnellstart

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

### Woher das Konto kommt

Kein Browser, kein Passwort: Die CLI fragt ihre Mailbox-Schiene nach einer frischen Adresse, löst das **Tencent TCaptcha** des Panels (appid `196026326`, ausgelesen aus `static.bigmodel.cn/wd-paas-front`) über `--token-cmd`, sendet den Code mit `POST /api/biz/code/emailCode/TencentVerifyCaptcha`, liest den 6-stelligen Code, den das Panel von seiner eigenen Benachrichtigungsadresse (`notifications [at] account.bigmodel.cn`) verschickt, und postet `POST /api/auth/login` — `newUserFlag:"YES"` bedeutet, das Konto wurde soeben angelegt. Danach wählt es die Standard-Org/das Standardprojekt aus `GET /api/biz/customer/getCustomerInfo` und erzeugt den Schlüssel. Führe `node src/cli.js --help` für die vollständige Flag-Liste aus.

### 🖱️ Der Launcher

`src/launcher.js` (gleiches Banner wie diese README) fragt nach der Anzahl, der Proxy-Listendatei und dem Verifizierungsmodell, merkt sie sich in `launcher.config.json` und führt die CLI mit den richtigen Flags aus — dann bietet er die 9Router- und OmniRoute-Connectoren an. `src/connect-9router.js` registriert den Provider unter dem Präfix `zhipu` mit `glm-4.5-flash` als Standardmodell.

## ✅ Verifiziert funktionierend — jeder Schlüssel wird getestet

Alles gemessen am 22.10.2026 mit zwei Live-Schlüsseln (`providers/zhipu/keys.txt`, 2 Zeilen — der z.ai-Kontoschlüssel und ein am selben Tag über die CN-Schiene erzeugter Schlüssel):

| Prüfung | Ergebnis |
| --- | --- |
| `GET /api/paas/v4/models` mit einem **gefälschten** Schlüssel | **401** `1000 身份验证失败` — die Auth-Prüfung ist echt |
| `GET /api/paas/v4/models` mit einem Schienen-Schlüssel | **200**, die 11 IDs oben |
| `POST /chat/completions` `glm-4.5-flash`, Prompt A (Primzahlen) | **200** — `content:"101,103,107"`, `reasoning_content` 946 → 3432 Zeichen |
| dasselbe Modell, Prompt B (ein türkischer Satz) | **200** — `content:"Deniz mavidir."` ⇒ beide nicht leer und **unterschiedlich** (Plausibilität ✓) |
| `glm-4.7-flash` (Thinking aus) | erster Versuch `1305 该模型当前访问量过大` → Retry **200** `"OK"` |
| `glm-4.6v-flash` | `1305` (Modell existiert, ausgelastet) — wiederholbare Klasse |
| kostenpflichtige IDs (`glm-4.5-air`, `glm-5-turbo`, `glm-5.3-flash`) | `429 1113 余额不足或无可用资源包,请充值。` auf einem Konto mit Guthaben 0 ⇒ die 200er der kostenlosen Modelle sind kein Guthaben |
| `GET api.z.ai/api/paas/v4/models` — **derselbe Schlüssel** | **200**, byte-für-byte dieselben 11 IDs (beide Richtungen) |
| Tools | `get_time` `tool_calls` **200** mit `max_tokens ≥ 1024` (`out/09-tools-check.txt`) |
| Cross-Exit | **8 Live-Exits** über zwei Screens antworteten alle mit **200** beim selben Schlüssel ⇒ der Schlüssel ist nicht IP-gebunden; ein Rescan mit 15 Exits antwortete ebenfalls überall mit 200 |
| `preadd-gate --model glm-4.5-flash` | sanity=true · tools=get_time ✓ · 2842 ms; ein Rerun mit frischem Exit 9139 ms; der CN-Schienen-Schlüssel 6816 ms und ein 300-s-Reverify 7373 ms |
| CN-Registrierungsschiene | TCaptcha-Ticket in reinem HTTP gelöst (27 s, 1 Versuch) → Code gesendet → Mailtrap-Code → `newUserFlag:"YES"` → Org/Projekt → `apiKey.secretKey`; der erzeugte Schlüssel bestand danach das vollständige Gate oben |

Belege: `providers/zhipu/out/verify-20261022063844.{txt,json}`, `verify-20261022073006.{txt,json}`, `01-models.json` + `.headers.txt`, `02-chat-p1.json`, `02-chat-p2.json`, `03-chat-p1-full.json` (und dessen Header), `04-cn-signup-gate.txt`, `07-exit-portability.txt`, `08-exit-rescan.txt`, `09-tools-check.txt`, `10-cn-tcaptcha-crack.txt`, `11-cn-lane-key-cross-exit.txt`, `12-cn-account-balance-zero.txt`, `13-cn-lane-key-paid-models-note.txt`; Gate-Läufe `proxy-lab/out/preadd-zhipu-1792651196.jsonl`, `preadd-zhipu-refresh.jsonl`, `preadd-zhipu-cn-1792654779.jsonl`; die ganze Kette ist mit `proxy-lab/zhipu-verify.js` erneut ausführbar.

> **Qualitäts-Gates.** Jeder Schlüssel hier bestand einen Live-`chat-200`, bevor er in `keys.txt` geschrieben wurde
> (tote Schlüssel werden nie ausgeliefert). Router-Kombinationen folgen derselben Regel auf Modellebene: Ein Eintrag wird
> **nur hinzugefügt, wenn das Modell `chat-200` antwortet und Tools aufrufen kann** — ein Modell ohne Tool-Unterstützung,
> ein toter Schlüssel oder ein toter Provider wird verworfen statt hinzugefügt. Führe den Verifizierungsschritt jederzeit erneut aus;
> Fehler werden gemeldet, nie versteckt.

## 🧭 So funktioniert es

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Zhipu BigModel page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://open.bigmodel.cn/api/paas/v4/chat/completions → real content = the key is live
```

Pro Konto läuft alles über einen Exit aus deinem Pool:

1. **Mailbox** — eine frische Postfachadresse von der konfigurierten Schiene (`--mail emailnator | broker | temptf`); der Code des Panels kommt von dessen Benachrichtigungsadresse (`notifications [at] account.bigmodel.cn`) mit dem Betreff `你的Zhipu验证码: <6 digits>`.
2. **Captcha** — ein Tencent TCaptcha `{ticket,randstr}` für appid `196026326`. Übergib `--token-cmd`; der Solver darf das JSON auf stdout ausgeben oder in `--token-file` schreiben (`{tmp}` wird ersetzt). Reines HTTP funktioniert: Das `captcha-kit --kind tencent-http` der Flotte löste es in 27 s beim ersten Versuch.
3. **Code senden** — `POST /api/biz/code/emailCode/TencentVerifyCaptcha {deviceToken,email,typeCode:"login",ticket,randstr}` → `验证码已发送，请查收邮件`. Ein veraltetes Ticket oder eine fehlende Request-ID wird abgelehnt (geprüft in `out/04-cn-signup-gate.txt`).
4. **Code lesen** — 6 Ziffern aus dem Postfach.
5. **Session** — `POST /api/auth/login {email,emailCode,loginType:"email",grantType:"customer",userType:"PERSONAL"}`; `newUserFlag:"YES"` bedeutet, das Konto wurde genau dort angelegt — **kein Passwortschritt**.
6. **Org/Projekt** — `GET /api/biz/customer/getCustomerInfo` → `organizations[0]` / `projects[0]`, das Standardpaar, das die Konsole verwendet.
7. **Schlüssel** — `POST /api/biz/v1/organization/<oid>/projects/<pid>/api_keys {name}` → `data.apiKey` + `data.secretKey`; mit einem Punkt verbunden ist das der Schlüssel.
8. **Gate** — zwei verschiedene Prompts auf dem kostenlosen Modell (beide 200, nicht leer, unterschiedlich) **und** ein `get_time`-Tool-Aufruf mit `max_tokens ≥ 1024`. Erst dann wird der Schlüssel an `keys.txt` angehängt.

## ⚙️ CLI-Optionen

```bash
node src/cli.js --count 5 --token-cmd "<solver>"   # mint
node src/cli.js --verify-only                      # re-check every key in keys.txt
node src/cli.js --screen                           # test your proxy list against BigModel
node src/cli.js --help
```

| Flag | Bedeutung |
| --- | --- |
| `--count N` | Anzahl der anzulegenden Konten (= Schlüssel) (Standard `5`) |
| `--conc N` | gleichzeitig laufende Konten, max. `8` (Standard `1`) |
| `--gap MS` | Pause zwischen Konten (Standard `1200`) |
| `--model <id>` | kostenloses Modell für das Live-Gate (Standard `glm-4.5-flash`) |
| `--token-cmd CMD` | TCaptcha-Solver-Befehl; Platzhalter `{exit}`, `{url}`, `{tmp}` — **zum Anlegen erforderlich** |
| `--token-file F` | Datei, in die der Solver das Ticket-JSON schreibt, falls er es nicht ausgibt |
| `--appid ID` | an den Solver übergebene TCaptcha-appid (Standard `196026326`) |
| `--mail <rail>` | `emailnator` · `broker` · `temptf` (Standard `emailnator`) |
| `--pool <file>` | Proxy-Liste, ein Exit pro Zeile (oder Env `ZHIPU_PROXIES`) — optional |
| `--tries N` | pro Konto versuchte Exits, bevor aufgegeben wird (Standard `2`) |
| `--timeout MS` | Timeout pro Anfrage (Standard `60000`) |
| `--verify-only` | jeden Schlüssel in `keys.txt` erneut durch das Gate laufen lassen |
| `--screen` | nur die Proxy-Liste gegen BigModel testen |

## 🛰️ Hinter einem Proxy

**Optional — bei Skalierung empfohlen.** Übergib `--pool <file>` (oder setze `ZHIPU_PROXIES`), und jede Anfrage läuft über einen Exit aus dieser Liste (`http://host:port`, `socks5://host:port`, `host:port`, `user:pass@host:port`); ohne Pool gibt die CLI `running WITHOUT a proxy (direct)` aus und verbindet direkt.

* der Schlüssel ist **nicht exit-gebunden**: die 8 Live-Exits zweier Screens und ein Rescan mit 15 Exits lieferten alle 200 beim selben Schlüssel (`out/07-exit-portability.txt`, `out/08-exit-rescan.txt`, `out/11-cn-lane-key-cross-exit.txt`);
* ein **gesättigter** Exit ist kein toter Schlüssel — `--reverify` kann `dead 0ms` auf eine erschöpfte Zeile stempeln, während derselbe Schlüssel von einem frischen Exit mit 200 antwortet; wähle Exits aus einer Live-Liste;
* WARP wird auf dieser Box **nicht** verwendet (es kappte den Fernzugriff des Betreibers), daher nehmen die Harnesse den Pool-Exit explizit.

## 📄 Dateien

| Pfad | Inhalt |
| --- | --- |
| `keys.txt` | ein live-verifizierter `<apiKey>.<secretKey>` pro Zeile — von Git ignoriert |
| `proxies.txt` | deine Exits, einer pro Zeile — von Git ignoriert |
| `accounts.json` | Konto ↔ Schlüssel ↔ Gate-Datensatz — von Git ignoriert |
| `out/` | Rohmaterial pro Lauf, das die CLI schreibt (Modellantwort, Chat-Bodies, Logs) — von Git ignoriert |
| `launcher.config.json` | gemerkte Launcher-Einstellungen — von Git ignoriert |

Nichts anderes wird geschrieben: kein Session-Token, kein TCaptcha-Ticket und kein Mailbox-Passwort werden auf der Festplatte gespeichert.

## 🔌 Mit 9Router verbinden

[9Router](https://9router.com) ist ein selbst gehosteter, OpenAI-kompatibler Router. Registriere diesen Provider einmal, und jeder Schlüssel in `keys.txt` wird zu einer Verbindung unter einem Provider-Node:

```bash
node src/connect-9router.js
```

Standardwerte: `--base http://localhost:20128`, `--password 123456`, `--name "Zhipu BigModel"`, `--prefix zhipu`, `--base-url https://open.bigmodel.cn/api/paas/v4`, `--model glm-4.5-flash`. Modelle werden als `zhipu/<model id>` bereitgestellt und über jeden Schlüssel lastverteilt.

> Wenn eine CN-Route von deinem Netzwerk aus langsam ist, funktioniert derselbe Schlüssel auf `https://api.z.ai/api/paas/v4` — gemessen, derselbe Schlüssel, dieselben 11 IDs.

## 🔌 Mit OmniRoute verbinden

[OmniRoute](https://omniroute.online) ist ein selbst gehosteter, OpenAI-kompatibler Router. Registriere diesen Provider einmal, und jeder Schlüssel in `keys.txt` wird zu einer Verbindung unter einem Provider-Node:

```bash
node src/connect-omniroute.js
```

Standardwerte: `--base http://localhost:20128`, `--password 123456`, `--name "Zhipu BigModel"`, `--prefix zhipu`, `--base-url https://open.bigmodel.cn/api/paas/v4`, `--model glm-4.5-flash`. Modelle werden als `zhipu/<model id>` bereitgestellt und über jeden Schlüssel lastverteilt.

> Wenn eine CN-Route von deinem Netzwerk aus langsam ist, funktioniert derselbe Schlüssel auf `https://api.z.ai/api/paas/v4` — gemessen, derselbe Schlüssel, dieselben 11 IDs.

## 🔑 Was ein Schlüssel dir bringt

| | |
| --- | --- |
| 🏢 Provider | **Zhipu BigModel** — [open.bigmodel.cn](https://open.bigmodel.cn) |
| 🎁 Was der Provider gibt | GLM-Free-Tier auf einem Konto mit Nullguthaben — die CN-Registrierungsschiene läuft protokollseitig, jeder Schlüssel chat- und tool-verifiziert |
| 🔑 Was ein Schlüssel dir bringt | einen API-Schlüssel, der auf sein eigenes Konto beschränkt ist: die 11 Modell-IDs am Endpunkt unten, im Rahmen deines Tarifs. Das Kontingent hängt am **Konto**, genau deshalb legt dieses Tool ein Konto pro Schlüssel an |
| 🌐 API-Form | OpenAI-kompatibel: `POST https://open.bigmodel.cn/api/paas/v4/chat/completions` |
| 🔒 Deine Daten | nur open.bigmodel.cn und das von dir konfigurierte Mailbox-Backend werden kontaktiert; Schlüssel bleiben auf deiner Maschine |

## 🐞 Probleme

* **Kostenlose IDs sind für `/models` unsichtbar.** `GET /models` liefert nur die 11 kostenpflichtigen IDs; `glm-4.5-flash` / `glm-4.7-flash` / `glm-4.6v-flash` sind unter `models/free/` dokumentiert und erscheinen nie in dieser Liste — lies das nicht als „der Schlüssel hat nichts".
* **Es gibt kein `/api/pricing` auf diesem Panel.** `/api/pricing`, `/api/paas/v4/pricing`, `/api/biz/pricing`, `/api/paas/pricing`, `/api/product/pricing` sind alle **404** — die einzige handlungsrelevante Preisoberfläche ist die SPA-Preisseite plus die Docs, also ist der Free-Tier-Beweis hier „Guthaben 0 × kostenloses Modell 200" + die offizielle `免费`-Seite, nie eine Panel-Verhältnistabelle.
* **Dass kostenpflichtige Modelle antworten, ist kein Free-Tier-Beweis.** Ein frisch angelegtes CN-Konto liefert derzeit 200 für `glm-4.5-air`, `glm-5-turbo` und `glm-4.6`, während sein Ausgabenprotokoll bei `0E-9` bleibt (`out/13-cn-lane-key-paid-models-note.txt`) — eine Neukonto-Kulanz. Beim älteren Schlüssel antworten dieselben Modelle mit `429/1113`. Nur die 200er von `glm-4.5-flash` / `glm-4.7-flash` sind dauerhafter Free-Tier-Beweis.
* **`glm-4.5-flash` hat einen Abschaltungshinweis** (30.01.2026, Anfragen werden auf `glm-4.7-flash` umgeleitet). Wenn es nicht mehr antwortet, wechsle `--model` und das Gate auf `glm-4.7-flash` (200 auf beiden Konten).
* **Ticket-Frische.** Das TCaptcha-Ticket ist einmalig und kurzlebig: Lösen, Code senden und Login direkt hintereinander, oder erneut lösen. Eine Request-ID ist am Code-Endpunkt Pflicht.

Wenn Zhipu die Captcha-appid, den Code-Endpunkt oder die Login-Form ändert, stoppt das Tool an diesem Schritt und gibt den Status und Body aus, den es gesehen hat. **[Öffne ein Issue](../../issues)** mit dem Befehl und der exakten Ausgabe; PRs sind willkommen.

## 📄 Lizenz

MIT © 2026 — siehe [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 zhipu-bulk-apikey contributors

</div>
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

**Création en masse de comptes BigModel (Zhipu) avec clés API — la chaîne d'inscription est du pur HTTP (ticket TCaptcha + code e-mail), inférence GLM compatible OpenAI, plus un connecteur 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-11%20served-412991?style=for-the-badge)](https://docs.bigmodel.cn/cn/guide/models/free/glm-4.5-flash)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Démarrage rapide](#-quick-start) · [🎁 Offre gratuite](#-free-tier--how-much-you-get) · [🤖 Modèles](#-models--all-11-of-them) · [🧪 Utiliser l'API](#-how-to-use-the-api) · [✅ Vérifié](#-verified-working--every-key-is-tested) · [🧭 Comment ça marche](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Options](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Problèmes](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Pourquoi ce projet existe

BigModel (`open.bigmodel.cn`, la plateforme CN de Zhipu) sert la famille GLM via un endpoint `…/api/paas/v4` **compatible OpenAI**, et son offre gratuite est bien réelle : `glm-4.5-flash`, `glm-4.7-flash` et `glm-4.6v-flash` répondent à de vrais échanges sur un compte dont le solde affiché dans la console est **0**. Le plus intéressant, c'est la porte d'entrée : la chaîne d'inscription CN (TCaptcha → code e-mail → connexion) est **entièrement côté protocole** — aucun navigateur n'est nécessaire pour le flux lui-même — donc une seule commande transforme une adresse de boîte de réception neuve en compte, en clé de projet et en une ligne vérifiée dans `keys.txt`. Comme le quota est lié au **compte**, l'outil génère **un compte par clé**, chacun validé par deux invites différentes et un véritable appel d'outil `get_time` avant d'être enregistré.

## 🎁 Offre gratuite — ce que vous obtenez

| Quoi | Valeur |
| --- | --- |
| Identifiants de modèles gratuits | **`glm-4.5-flash`**, **`glm-4.7-flash`**, **`glm-4.6v-flash`** — l'ensemble documenté `models/free/` (`glm-4.5-flash` : « 完全免费开放使用 ») ; les trois répondent sur ce compte |
| Solde du compte | **0** — rapport de la console `balance 0 · giveAmount 0 · recharge 0 · creditStatus NOT_OPEN` (`providers/zhipu/out/12-cn-account-balance-zero.txt`) |
| Modèles payants sur ce compte | `glm-4.5-air`, `glm-5-turbo`, `glm-5.3-flash` → `429 {"code":"1113","message":"余额不足或无可用资源包,请充值。"}` — donc un 200 n'est *pas* expliqué par le crédit : les modèles gratuits sont vraiment gratuits |
| Coût d'inscription | aucun — **pas de carte, pas de SMS** : code e-mail uniquement ; le compte porte `acType: NOT_AC` (pas de 实名认证) et l'API fonctionne quand même |
| Ce qu'un compte obtient | sa propre organisation + projet par défaut, et une clé générée dessus (`POST …/organization/<oid>/projects/<pid>/api_keys`) |
| Limite de débit | `glm-4.6v-flash` répond surtout `1305 该模型当前访问量过大` (occupé, réessayer) ; `glm-4.7-flash` a répondu à la deuxième tentative |
| Forme de la clé | 49 caractères, la paire de la console `<apiKey>.<secretKey>` jointe par un point |
| Le filtre | deux invites **différentes**, toutes deux 200, non vides et différentes, plus un appel d'outil `get_time` |

> 💡 L'offre gratuite est définie par Zhipu BigModel et peut changer. Consultez les chiffres en direct sur [open.bigmodel.cn](https://open.bigmodel.cn) — et laissez le filtre de l'outil décider :

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modèles — les 11 au complet

`GET /api/paas/v4/models` avec une clé neuve répond **11 identifiants** — c'est le nombre affiché sur le badge (`providers/zhipu/out/01-models.json`) :

| Identifiant du modèle | Remarques |
| --- | --- |
| `glm-4.5`, `glm-4.5-air` | génération 4.5 (`-air` est le palier payant économique) |
| `glm-4.6`, `glm-4.7` | génération 4.6 / 4.7 |
| `glm-5`, `glm-5-turbo` | génération 5 |
| `glm-5.1`, `glm-5.2`, `glm-5.3` | génération 5.x |
| `glm-5.3-flash`, `glm-5.3-flashx` | variantes flash |

**Les identifiants gratuits ne figurent pas dans cette liste** — ils sont documentés séparément sous `models/free/` et vérifiés en direct sur ce compte : `glm-4.5-flash` (**le modèle filtre de l'outil** : 200 avec du contenu réel), `glm-4.7-flash` (200, `"OK"`), `glm-4.6v-flash` (joignable, souvent occupé). Un identifiant payant sur un compte à solde nul répond `1113` jusqu'à ce que le compte soit rechargé, ce qui explique précisément pourquoi l'outil filtre sur `glm-4.5-flash`.

La même clé répond sur `api.z.ai/api/paas/v4` avec **les 11 identifiants identiques** — BigModel et Z.AI partagent un même espace de clés, donc le routeur peut pointer vers l'un ou l'autre hôte.

## 🧪 Comment utiliser l'API

L'URL de base est **`https://open.bigmodel.cn/api/paas/v4`** — compatible OpenAI, donc tout ce qui parle OpenAI fonctionne (SDK, Cursor, OpenCode, Kilo Code, …).

```bash
curl https://open.bigmodel.cn/api/paas/v4/chat/completions \
  -H "Authorization: Bearer <apiKey>.<secretKey>" \
  -H 'Content-Type: application/json' \
  -d '{"model":"glm-4.5-flash","messages":[{"role":"user","content":"say ok"}],"max_tokens":1024}'
```

Deux choses qui posent problème :

* la clé est la paire **`<apiKey>.<secretKey>`** de la console — les deux moitiés, jointes par un point, vont dans l'en-tête `Authorization: Bearer` (le simple `apiKey` ne suffit pas) ;
* `glm-4.5-flash` est un modèle de **raisonnement** (réflexion activée par défaut) et la réflexion consomme le budget de tokens — pour une réponse `tool_calls`, utilisez `max_tokens ≥ 1024` (avec `256`, l'appel est parfois silencieusement vide ; mesuré dans `providers/zhipu/out/09-tools-check.txt`).

## 🛠 Démarrage rapide

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

### D'où vient le compte

Pas de navigateur, pas de mot de passe : le CLI demande une adresse neuve à son rail de messagerie, résout le **Tencent TCaptcha** du panneau (appid `196026326`, lu depuis `static.bigmodel.cn/wd-paas-front`) via `--token-cmd`, envoie le code avec `POST /api/biz/code/emailCode/TencentVerifyCaptcha`, lit le code à 6 chiffres que le panneau envoie depuis sa propre adresse de notification (`notifications [at] account.bigmodel.cn`), et poste `POST /api/auth/login` — `newUserFlag:"YES"` signifie que le compte a été créé sur-le-champ. Il choisit ensuite l'organisation/projet par défaut depuis `GET /api/biz/customer/getCustomerInfo` et génère la clé. Lancez `node src/cli.js --help` pour la liste complète des options.

### 🖱️ Le lanceur

`src/launcher.js` (même bannière que ce README) demande le nombre, le fichier de liste de proxys et le modèle de vérification, les mémorise dans `launcher.config.json`, et exécute le CLI avec les bonnes options — puis propose les connecteurs 9Router et OmniRoute. `src/connect-9router.js` enregistre le fournisseur sous le préfixe `zhipu` avec `glm-4.5-flash` comme modèle par défaut.

## 🚀 Une seule commande

Le captcha est résolu pour vous — une seule commande génère N comptes et ne conserve que les clés vérifiées par un appel de chat en direct :

```bash
npm install                  # once: pulls puppeteer-core
npm start                    # menu → "1) Mint keys" → "How many keys?" (Enter = 10)
# or non-interactive:
node src/cli.js --count N
```

`--auto` est la valeur par défaut et rien ne doit être passé : le `src/solver.js` intégré ouvre un Chrome avec interface via la sortie propre du compte et renvoie automatiquement le jeton Turnstile du panneau. `--dry` affiche le plan résolu et se termine avec **aucun fichier écrit et aucun appel réseau**.

> ⚠️ **Conditions et risque de compte.** Ceci est un outil d'automatisation, pas un vendeur de comptes. Les inscriptions en masse et la génération de clés relèvent entièrement de votre responsabilité : elles peuvent enfreindre les Conditions d'utilisation du fournisseur et entraîner le blocage d'adresses, de sorties ou de comptes. Utilisez-le uniquement sur une infrastructure que vous êtes autorisé à automatiser, et gardez un faible débit de requêtes.

## 🔧 Avancé (facultatif)

Le branchement de votre propre solveur, le collage manuel d'un jeton ou le pointage de l'outil vers un Chrome spécifique sont documentés dans **[ADVANCED.md](ADVANCED.md)**. Le chemin courant n'en a pas besoin.

## ✅ Vérifié fonctionnel — chaque clé est testée

Tout a été mesuré le 2026-10-22 sur deux clés en direct (`providers/zhipu/keys.txt`, 2 lignes — la clé du compte z.ai et une clé générée via le rail CN le même jour) :

| Vérification | Résultat |
| --- | --- |
| `GET /api/paas/v4/models` avec une clé **fictive** | **401** `1000 身份验证失败` — la vérification d'authentification est réelle |
| `GET /api/paas/v4/models` avec une clé de voie | **200**, les 11 identifiants ci-dessus |
| `POST /chat/completions` `glm-4.5-flash`, invite A (amorces) | **200** — `content:"101,103,107"`, `reasoning_content` 946 → 3432 caractères |
| même modèle, invite B (une phrase turque) | **200** — `content:"Deniz mavidir."` ⇒ les deux non vides et **différents** (cohérence ✓) |
| `glm-4.7-flash` (réflexion désactivée) | première tentative `1305 该模型当前访问量过大` → nouvelle tentative **200** `"OK"` |
| `glm-4.6v-flash` | `1305` (le modèle existe, occupé) — classe réessayable |
| identifiants payants (`glm-4.5-air`, `glm-5-turbo`, `glm-5.3-flash`) | `429 1113 余额不足或无可用资源包,请充值。` sur un compte à solde 0 ⇒ les 200 des modèles gratuits ne sont pas du crédit |
| `GET api.z.ai/api/paas/v4/models` — **la même clé** | **200**, les mêmes 11 identifiants octet pour octet (dans les deux sens) |
| outils | `get_time` `tool_calls` **200** avec `max_tokens ≥ 1024` (`out/09-tools-check.txt`) |
| sortie croisée | **8 sorties en direct** sur deux écrans ont toutes répondu **200** avec la même clé ⇒ la clé n'est pas liée à l'IP ; un nouveau scan de 15 sorties a aussi répondu 200 partout |
| `preadd-gate --model glm-4.5-flash` | sanity=true · tools=get_time ✓ · 2842 ms ; une réexécution sur sortie neuve 9139 ms ; la clé du rail CN 6816 ms et une revérification à 300 s 7373 ms |
| Rail d'inscription CN | ticket TCaptcha résolu en pur HTTP (27 s, 1 tentative) → code envoyé → code mailtrap → `newUserFlag:"YES"` → org/projet → `apiKey.secretKey` ; la clé générée a ensuite passé tout le filtre ci-dessus |

Preuves : `providers/zhipu/out/verify-20261022063844.{txt,json}`, `verify-20261022073006.{txt,json}`, `01-models.json` + `.headers.txt`, `02-chat-p1.json`, `02-chat-p2.json`, `03-chat-p1-full.json` (et ses en-têtes), `04-cn-signup-gate.txt`, `07-exit-portability.txt`, `08-exit-rescan.txt`, `09-tools-check.txt`, `10-cn-tcaptcha-crack.txt`, `11-cn-lane-key-cross-exit.txt`, `12-cn-account-balance-zero.txt`, `13-cn-lane-key-paid-models-note.txt` ; exécutions du filtre `proxy-lab/out/preadd-zhipu-1792651196.jsonl`, `preadd-zhipu-refresh.jsonl`, `preadd-zhipu-cn-1792654779.jsonl` ; toute la chaîne réexécutable avec `proxy-lab/zhipu-verify.js`.

> **Filtres de qualité.** Chaque clé ici a passé un `chat-200` en direct avant d'être écrite dans `keys.txt`
> (les clés mortes ne sont jamais livrées). Les combinaisons de routeurs suivent la même règle au niveau du modèle : une entrée est
> ajoutée **uniquement si le modèle répond `chat-200` et peut appeler des outils** — un modèle sans support des outils,
> une clé morte ou un fournisseur mort est écarté au lieu d'être ajouté. Relancez l'étape de vérification à tout moment ;
> les échecs sont signalés, jamais masqués.

## 🧭 Comment ça marche

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Zhipu BigModel page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://open.bigmodel.cn/api/paas/v4/chat/completions → real content = the key is live
```

Par compte, tout passe par une sortie de votre pool :

1. **boîte mail** — une adresse de boîte de réception neuve depuis le rail configuré (`--mail emailnator | broker | temptf`) ; le code du panneau arrive depuis son adresse de notification (`notifications [at] account.bigmodel.cn`) avec le sujet `你的Zhipu验证码: <6 digits>`.
2. **captcha** — un `{ticket,randstr}` Tencent TCaptcha pour l'appid `196026326`. Passez `--token-cmd` ; le solveur peut afficher le JSON sur stdout ou l'écrire dans `--token-file` (`{tmp}` est substitué). Le pur HTTP fonctionne : le `captcha-kit --kind tencent-http` de la flotte l'a résolu en 27 s à la première tentative.
3. **envoyer le code** — `POST /api/biz/code/emailCode/TencentVerifyCaptcha {deviceToken,email,typeCode:"login",ticket,randstr}` → `验证码已发送，请查收邮件`. Un ticket périmé ou un identifiant de requête manquant est refusé (testé dans `out/04-cn-signup-gate.txt`).
4. **lire le code** — 6 chiffres depuis la boîte de réception.
5. **session** — `POST /api/auth/login {email,emailCode,loginType:"email",grantType:"customer",userType:"PERSONAL"}` ; `newUserFlag:"YES"` signifie que le compte a été créé à cet instant — **aucune étape de mot de passe**.
6. **org/projet** — `GET /api/biz/customer/getCustomerInfo` → `organizations[0]` / `projects[0]`, la paire par défaut utilisée par la console.
7. **clé** — `POST /api/biz/v1/organization/<oid>/projects/<pid>/api_keys {name}` → `data.apiKey` + `data.secretKey` ; joints par un point, c'est la clé.
8. **filtre** — deux invites différentes sur le modèle gratuit (toutes deux 200, non vides, différentes) **et** un appel d'outil `get_time` avec `max_tokens ≥ 1024`. Ce n'est qu'alors que la clé est ajoutée à `keys.txt`.

## ⚙️ Options du CLI

```bash
node src/cli.js --count 5 --token-cmd "<solver>"   # mint
node src/cli.js --verify-only                      # re-check every key in keys.txt
node src/cli.js --screen                           # test your proxy list against BigModel
node src/cli.js --help
```

| Option | Signification |
| --- | --- |
| `--count N` | comptes (= clés) à générer (défaut `5`) |
| `--conc N` | comptes traités simultanément, max `8` (défaut `1`) |
| `--gap MS` | pause entre les comptes (défaut `1200`) |
| `--model <id>` | modèle gratuit utilisé pour le filtre en direct (défaut `glm-4.5-flash`) |
| `--token-cmd CMD` | commande du solveur TCaptcha ; espaces réservés `{exit}`, `{url}`, `{tmp}` — **requis pour générer** |
| `--token-file F` | fichier dans lequel le solveur écrit le JSON du ticket, s'il ne l'affiche pas |
| `--appid ID` | appid TCaptcha transmis au solveur (défaut `196026326`) |
| `--mail <rail>` | `emailnator` · `broker` · `temptf` (défaut `emailnator`) |
| `--pool <file>` | liste de proxys, une sortie par ligne (ou variable d'env `ZHIPU_PROXIES`) — facultatif |
| `--tries N` | sorties essayées par compte avant d'abandonner (défaut `2`) |
| `--timeout MS` | délai d'expiration par requête (défaut `60000`) |
| `--verify-only` | réexécute chaque clé de `keys.txt` à travers le filtre |
| `--screen` | teste uniquement la liste de proxys contre BigModel |

## 🛰️ Derrière un proxy

**Facultatif — recommandé à grande échelle.** Passez `--pool <file>` (ou définissez `ZHIPU_PROXIES`) et chaque requête passe par une sortie de cette liste (`http://host:port`, `socks5://host:port`, `host:port`, `user:pass@host:port`) ; sans pool, le CLI affiche `running WITHOUT a proxy (direct)` et se connecte directement.

* la clé n'est **pas liée à la sortie** : les 8 sorties en direct de deux écrans et un nouveau scan de 15 sorties ont toutes renvoyé 200 sur la même clé (`out/07-exit-portability.txt`, `out/08-exit-rescan.txt`, `out/11-cn-lane-key-cross-exit.txt`) ;
* une sortie **saturée** n'est pas une clé morte — `--reverify` peut marquer `dead 0ms` sur une ligne épuisée alors que la même clé répond 200 depuis une sortie neuve ; choisissez les sorties dans une liste active ;
* WARP n'est **pas** utilisé sur cette machine (il coupait l'accès distant de l'opérateur), donc les harnais prennent explicitement la sortie du pool.

## 📄 Fichiers

| Chemin | Contenu |
| --- | --- |
| `keys.txt` | une ligne `<apiKey>.<secretKey>` vérifiée en direct par ligne — ignoré par git |
| `proxies.txt` | vos sorties, une par ligne — ignoré par git |
| `accounts.json` | enregistrement compte ↔ clé ↔ filtre — ignoré par git |
| `out/` | matériel brut par exécution écrit par le CLI (réponse des modèles, corps de chat, journaux) — ignoré par git |
| `launcher.config.json` | paramètres du lanceur mémorisés — ignoré par git |

Rien d'autre n'est écrit : aucun jeton de session, aucun ticket TCaptcha et aucun mot de passe de boîte mail n'est stocké sur le disque.

## 🔌 Connexion à 9Router

[9Router](https://9router.com) est un routeur auto-hébergé compatible OpenAI. Enregistrez ce fournisseur une fois et chaque clé de `keys.txt` devient une connexion sous un même nœud fournisseur :

```bash
node src/connect-9router.js
```

Valeurs par défaut : `--base http://localhost:20128`, `--password 123456`, `--name "Zhipu BigModel"`, `--prefix zhipu`, `--base-url https://open.bigmodel.cn/api/paas/v4`, `--model glm-4.5-flash`. Les modèles sont servis sous `zhipu/<model id>` et répartis en charge sur toutes les clés.

> Si une route CN est lente depuis votre réseau, la même clé fonctionne sur `https://api.z.ai/api/paas/v4` — mesuré, même clé, mêmes 11 identifiants.

## 🔌 Connexion à OmniRoute

[OmniRoute](https://omniroute.online) est un routeur auto-hébergé compatible OpenAI. Enregistrez ce fournisseur une fois et chaque clé de `keys.txt` devient une connexion sous un même nœud fournisseur :

```bash
node src/connect-omniroute.js
```

Valeurs par défaut : `--base http://localhost:20128`, `--password 123456`, `--name "Zhipu BigModel"`, `--prefix zhipu`, `--base-url https://open.bigmodel.cn/api/paas/v4`, `--model glm-4.5-flash`. Les modèles sont servis sous `zhipu/<model id>` et répartis en charge sur toutes les clés.

> Si une route CN est lente depuis votre réseau, la même clé fonctionne sur `https://api.z.ai/api/paas/v4` — mesuré, même clé, mêmes 11 identifiants.

## 🔑 Ce qu'une clé vous apporte

| | |
| --- | --- |
| 🏢 Fournisseur | **Zhipu BigModel** — [open.bigmodel.cn](https://open.bigmodel.cn) |
| 🎁 Ce que le fournisseur offre | Offre gratuite GLM sur un compte à solde nul — le rail d'inscription CN fonctionne côté protocole, chaque clé vérifiée pour le chat et les outils |
| 🔑 Ce qu'une clé vous apporte | une clé API limitée à son propre compte : les 11 identifiants de modèles sur l'endpoint ci-dessous, dans les limites de votre offre. Le quota est lié au **compte**, ce qui explique précisément pourquoi cet outil crée un compte par clé |
| 🌐 Forme de l'API | Compatible OpenAI : `POST https://open.bigmodel.cn/api/paas/v4/chat/completions` |
| 🔒 Vos données | seuls open.bigmodel.cn et le backend de boîte mail que vous configurez sont contactés ; les clés restent sur votre machine |

## 🐞 Problèmes

* **Les identifiants gratuits sont invisibles pour `/models`.** `GET /models` ne renvoie que les 11 identifiants payants ; `glm-4.5-flash` / `glm-4.7-flash` / `glm-4.6v-flash` sont documentés sous `models/free/` et n'apparaissent jamais dans cette liste — ne l'interprétez pas comme « la clé n'a rien ».
* **Il n'y a pas de `/api/pricing` sur ce panneau.** `/api/pricing`, `/api/paas/v4/pricing`, `/api/biz/pricing`, `/api/paas/pricing`, `/api/product/pricing` sont tous **404** — la seule surface de prix exploitable est la page de prix de la SPA plus la documentation, donc la preuve de l'offre gratuite ici est « solde 0 × modèle gratuit 200 » + la page officielle `免费`, jamais un tableau de ratios du panneau.
* **Des modèles payants qui répondent ne prouvent pas l'offre gratuite.** Un compte CN fraîchement créé renvoie actuellement 200 pour `glm-4.5-air`, `glm-5-turbo` et `glm-4.6` alors que son relevé de dépenses reste à `0E-9` (`out/13-cn-lane-key-paid-models-note.txt`) — une grâce de nouveau compte. Sur la clé plus ancienne, les mêmes modèles répondent `429/1113`. Seuls les 200 de `glm-4.5-flash` / `glm-4.7-flash` constituent une preuve durable de l'offre gratuite.
* **`glm-4.5-flash` a une note de retrait** (2026-01-30, les requêtes redirigées vers `glm-4.7-flash`). S'il cesse de répondre, basculez `--model` et le filtre vers `glm-4.7-flash` (200 sur les deux comptes).
* **Fraîcheur du ticket.** Le ticket TCaptcha est à usage unique et de courte durée : résolvez, envoyez le code et connectez-vous coup sur coup, ou résolvez à nouveau. Un identifiant de requête est obligatoire sur l'endpoint du code.

Si Zhipu modifie l'appid du captcha, l'endpoint du code ou la forme de la connexion, l'outil s'arrête à cette étape et affiche le statut et le corps qu'il a vus. **[Ouvrez un ticket](../../issues)** avec la commande et la sortie exacte ; les PR sont bienvenues.

## 📄 Licence

MIT © 2026 — voir [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 zhipu-bulk-apikey contributors

</div>
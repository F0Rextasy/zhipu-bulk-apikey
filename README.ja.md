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

**BigModel (Zhipu) アカウントを API キー付きで一括作成 — 登録チェーンは純粋な HTTP (TCaptcha チケット + メールコード)、OpenAI 互換の GLM 推論、さらに 9Router コネクタを備える。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-11%20served-412991?style=for-the-badge)](https://docs.bigmodel.cn/cn/guide/models/free/glm-4.5-flash)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 クイックスタート](#-quick-start) · [🎁 無料枠](#-free-tier--how-much-you-get) · [🤖 モデル](#-models--all-11-of-them) · [🧪 API の使い方](#-how-to-use-the-api) · [✅ 検証済み](#-verified-working--every-key-is-tested) · [🧭 仕組み](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ オプション](#️-cli-options) · [🛰️ プロキシ](#️-behind-a-proxy) · [🐞 問題](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ これが存在する理由

BigModel (`open.bigmodel.cn`、Zhipu の中国プラットフォーム) は GLM ファミリーを **OpenAI 互換**の `…/api/paas/v4` エンドポイント経由で提供しており、その無料枠は本物です。`glm-4.5-flash`、`glm-4.7-flash`、`glm-4.6v-flash` は、コンソールの残高が **0** と表示されるアカウントでもライブチャットに応答します。興味深いのはその入口です。中国の登録チェーン (TCaptcha → メールコード → ログイン) は**完全にプロトコル側**で完結しており、フロー自体にブラウザは不要です。そのため 1 つのコマンドで、新しい受信トレイのアドレスがアカウント、プロジェクトキー、そして検証済みの `keys.txt` の 1 行に変わります。クォータは**アカウント**に紐づくため、このツールは**キーごとに 1 アカウント**を作成し、それぞれが 2 つの異なるプロンプトと実際の `get_time` ツール呼び出しによるゲートを通過してから記録されます。

## 🎁 無料枠 — どれだけ得られるか

| 項目 | 値 |
| --- | --- |
| 無料モデル ID | **`glm-4.5-flash`**、**`glm-4.7-flash`**、**`glm-4.6v-flash`** — ドキュメント化された `models/free/` のセット (`glm-4.5-flash`: 「完全免费开放使用」); 3 つすべてがこのアカウントで応答 |
| アカウント残高 | **0** — コンソールの報告は `balance 0 · giveAmount 0 · recharge 0 · creditStatus NOT_OPEN` (`providers/zhipu/out/12-cn-account-balance-zero.txt`) |
| そのアカウントでの有料モデル | `glm-4.5-air`、`glm-5-turbo`、`glm-5.3-flash` → `429 {"code":"1113","message":"余额不足或无可用资源包,请充值。"}` — つまり 200 はクレジットでは説明できず、無料モデルは本当に無料 |
| 登録コスト | なし — **カードも SMS も不要**: メールコードのみ; アカウントは `acType: NOT_AC` (実名認証なし) を持ち、API はそれでも動作 |
| 1 アカウントで得られるもの | 専用の組織 + デフォルトプロジェクト、そしてそこで発行されるキー (`POST …/organization/<oid>/projects/<pid>/api_keys`) |
| レート制限 | `glm-4.6v-flash` はほとんど `1305 该模型当前访问量过大` (混雑、再試行) を返す; `glm-4.7-flash` は 2 回目の試行で通過 |
| キーの形式 | 49 文字、コンソールのペア `<apiKey>.<secretKey>` をドットで連結したもの |
| ゲート | 2 つの**異なる**プロンプト、どちらも 200 かつ非空かつ異なる、さらに `get_time` ツール呼び出し |

> 💡 無料枠は Zhipu BigModel が設定するもので、変更される可能性があります。最新の数値は [open.bigmodel.cn](https://open.bigmodel.cn) で確認してください — そしてツール自身のゲートに判断を委ねてください:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 モデル — 全 11 個

新しいキーで `GET /api/paas/v4/models` を呼ぶと **11 個の ID** が返ります — これがバッジの数字です (`providers/zhipu/out/01-models.json`):

| モデル ID | 備考 |
| --- | --- |
| `glm-4.5`, `glm-4.5-air` | 4.5 世代 (`-air` は安価な有料枠) |
| `glm-4.6`, `glm-4.7` | 4.6 / 4.7 世代 |
| `glm-5`, `glm-5-turbo` | 5 世代 |
| `glm-5.1`, `glm-5.2`, `glm-5.3` | 5.x 世代 |
| `glm-5.3-flash`, `glm-5.3-flashx` | flash バリアント |

**無料の ID はこのリストには含まれていません** — それらは `models/free/` の下に別途ドキュメント化されており、このアカウントでライブ検証済みです: `glm-4.5-flash` (**ツールのゲートモデル**: 実際のコンテンツ付きで 200)、`glm-4.7-flash` (200、`"OK"`)、`glm-4.6v-flash` (到達可能、通常は混雑)。残高 0 のアカウントでは有料 ID はチャージされるまで `1113` を返します。まさにそれが、ツールが `glm-4.5-flash` でゲートする理由です。

同じキーは `api.z.ai/api/paas/v4` でも**まったく同じ 11 個の ID** で応答します — BigModel と Z.AI は 1 つのキー空間を共有しているため、ルーターはどちらのホストを指すこともできます。

## 🧪 API の使い方

ベース URL は **`https://open.bigmodel.cn/api/paas/v4`** です — OpenAI 互換なので、OpenAI を話せるものなら何でも動作します (SDK、Cursor、OpenCode、Kilo Code など)。

```bash
curl https://open.bigmodel.cn/api/paas/v4/chat/completions \
  -H "Authorization: Bearer <apiKey>.<secretKey>" \
  -H 'Content-Type: application/json' \
  -d '{"model":"glm-4.5-flash","messages":[{"role":"user","content":"say ok"}],"max_tokens":1024}'
```

つまずきやすい 2 点:

* キーはコンソールの **`<apiKey>.<secretKey>`** ペアです — 両方の半分をドットで連結したものを `Authorization: Bearer` ヘッダーに入れます (裸の `apiKey` では不十分);
* `glm-4.5-flash` は**推論**モデル (デフォルトで思考オン) であり、思考がトークン予算を消費します — `tool_calls` の応答を得るには `max_tokens ≥ 1024` を使ってください (`256` だと呼び出しが黙って空になることがあります; `providers/zhipu/out/09-tools-check.txt` で測定済み)。

## 🛠 クイックスタート

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

### アカウントはどこから来るのか

ブラウザもパスワードも不要です: CLI はメールボックスレールに新しいアドレスを要求し、パネルの **Tencent TCaptcha** (appid `196026326`、`static.bigmodel.cn/wd-paas-front` から読み取り) を `--token-cmd` 経由で解き、`POST /api/biz/code/emailCode/TencentVerifyCaptcha` でコードを送信し、パネルが自身の通知アドレス (`notifications [at] account.bigmodel.cn`) から送る 6 桁のコードを読み取り、`POST /api/auth/login` を送信します — `newUserFlag:"YES"` はその場でアカウントが作成されたことを意味します。その後 `GET /api/biz/customer/getCustomerInfo` からデフォルトの組織/プロジェクトを選び、キーを発行します。フラグの完全なリストは `node src/cli.js --help` を実行してください。

### 🖱️ ランチャー

`src/launcher.js` (この README と同じバナー) は、件数、プロキシリストファイル、検証モデルを尋ね、それらを `launcher.config.json` に記憶し、正しいフラグで CLI を実行します — その後 9Router と OmniRoute のコネクタを提供します。`src/connect-9router.js` はプロバイダーをプレフィックス `zhipu` で登録し、デフォルトモデルとして `glm-4.5-flash` を使用します。

## 🚀 1 つのコマンド

キャプチャは自動で解かれます — 1 つのコマンドで N 個のアカウントを作成し、ライブチャット呼び出しで検証されたキーだけを保持します:

```bash
npm install                  # once: pulls puppeteer-core
npm start                    # menu → "1) Mint keys" → "How many keys?" (Enter = 10)
# or non-interactive:
node src/cli.js --count N
```

`--auto` がデフォルトで、何も渡す必要はありません: 組み込みの `src/solver.js` がアカウント自身の出口経由でヘッド付き Chrome を開き、パネルの Turnstile トークンを自動的に返します。`--dry` は解決されたプランを表示し、**ファイルも書き込まずネットワーク呼び出しも行わず**終了します。

> ⚠️ **利用規約とアカウントのリスク。** これは自動化ツールであり、アカウントの販売業者ではありません。一括登録とキー発行は完全にあなたの責任です: プロバイダーの利用規約に違反する可能性があり、アドレス、出口、アカウントがブロックされることがあります。自動化が許可されているインフラでのみ使用し、リクエストレートを低く保ってください。

## 🔧 上級 (オプション)

独自のソルバーの接続、トークンの手動貼り付け、特定の Chrome をツールに指定する方法は **[ADVANCED.md](ADVANCED.md)** に記載されています。一般的な使い方ではそのいずれも必要ありません。

## ✅ 動作検証済み — すべてのキーがテストされています

すべて 2026-10-22 に 2 つのライブキー (`providers/zhipu/keys.txt`、2 行 — z.ai アカウントキーと、同日に中国レール経由で発行されたキー) で測定されました:

| チェック | 結果 |
| --- | --- |
| **偽の**キーで `GET /api/paas/v4/models` | **401** `1000 身份验证失败` — 認証チェックは本物 |
| レーンキーで `GET /api/paas/v4/models` | **200**、上記の 11 個の ID |
| `POST /chat/completions` `glm-4.5-flash`、プロンプト A (プライミング) | **200** — `content:"101,103,107"`、`reasoning_content` 946 → 3432 文字 |
| 同じモデル、プロンプト B (トルコ語の文) | **200** — `content:"Deniz mavidir."` ⇒ どちらも非空かつ**異なる** (サニティ ✓) |
| `glm-4.7-flash` (思考オフ) | 初回 `1305 该模型当前访问量过大` → 再試行 **200** `"OK"` |
| `glm-4.6v-flash` | `1305` (モデルは存在、混雑) — 再試行可能なクラス |
| 有料 ID (`glm-4.5-air`、`glm-5-turbo`、`glm-5.3-flash`) | 残高 0 のアカウントで `429 1113 余额不足或无可用资源包,请充值。` ⇒ 無料モデルの 200 はクレジットではない |
| `GET api.z.ai/api/paas/v4/models` — **同じキー** | **200**、バイト単位で同じ 11 個の ID (双方向) |
| ツール | `get_time` `tool_calls` が `max_tokens ≥ 1024` で **200** (`out/09-tools-check.txt`) |
| クロス出口 | 2 回のスクリーンにわたる **8 つのライブ出口**がすべて同じキーで **200** を返す ⇒ キーは IP に紐づかない; 15 出口の再スキャンでもすべて 200 |
| `preadd-gate --model glm-4.5-flash` | sanity=true · tools=get_time ✓ · 2842 ms; 新しい出口での再実行 9139 ms; 中国レールキー 6816 ms、300 秒の再検証 7373 ms |
| 中国登録レール | TCaptcha チケットを純粋な HTTP で解決 (27 秒、1 回の試行) → コード送信 → mailtrap コード → `newUserFlag:"YES"` → 組織/プロジェクト → `apiKey.secretKey`; 発行されたキーはその後上記の完全なゲートを通過 |

証拠: `providers/zhipu/out/verify-20261022063844.{txt,json}`、`verify-20261022073006.{txt,json}`、`01-models.json` + `.headers.txt`、`02-chat-p1.json`、`02-chat-p2.json`、`03-chat-p1-full.json` (およびそのヘッダー)、`04-cn-signup-gate.txt`、`07-exit-portability.txt`、`08-exit-rescan.txt`、`09-tools-check.txt`、`10-cn-tcaptcha-crack.txt`、`11-cn-lane-key-cross-exit.txt`、`12-cn-account-balance-zero.txt`、`13-cn-lane-key-paid-models-note.txt`; ゲート実行 `proxy-lab/out/preadd-zhipu-1792651196.jsonl`、`preadd-zhipu-refresh.jsonl`、`preadd-zhipu-cn-1792654779.jsonl`; チェーン全体は `proxy-lab/zhipu-verify.js` で再実行可能。

> **品質ゲート。** ここにあるすべてのキーは、`keys.txt` に書き込まれる前にライブの `chat-200` を通過しています
> (死んだキーは決して出荷されません)。ルーターのコンボもモデルレベルで同じルールに従います: エントリは
> **モデルが `chat-200` を返し、ツールを呼び出せる場合にのみ**追加されます — ツールサポートのないモデル、
> 死んだキー、死んだプロバイダーは追加されずに除外されます。検証ステップはいつでも再実行できます;
> 失敗は報告され、決して隠されません。

## 🧭 仕組み

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Zhipu BigModel page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://open.bigmodel.cn/api/paas/v4/chat/completions → real content = the key is live
```

アカウントごとに、すべてがプールからの 1 つの出口を通ります:

1. **メールボックス** — 設定されたレール (`--mail emailnator | broker | temptf`) から新しい受信トレイアドレスを取得; パネルのコードは通知アドレス (`notifications [at] account.bigmodel.cn`) から件名 `你的Zhipu验证码: <6 digits>` で届きます。
2. **キャプチャ** — appid `196026326` 用の Tencent TCaptcha `{ticket,randstr}`。`--token-cmd` を渡します; ソルバーは JSON を stdout に出力するか、`--token-file` に書き込むことができます (`{tmp}` は置換されます)。純粋な HTTP で動作します: フリートの `captcha-kit --kind tencent-http` は初回試行で 27 秒で解決しました。
3. **コードを送信** — `POST /api/biz/code/emailCode/TencentVerifyCaptcha {deviceToken,email,typeCode:"login",ticket,randstr}` → `验证码已发送，请查收邮件`。古いチケットやリクエスト ID の欠落は拒否されます (`out/04-cn-signup-gate.txt` で検証済み)。
4. **コードを読む** — 受信トレイから 6 桁。
5. **セッション** — `POST /api/auth/login {email,emailCode,loginType:"email",grantType:"customer",userType:"PERSONAL"}`; `newUserFlag:"YES"` はその場でアカウントが作成されたことを意味します — **パスワードステップなし**。
6. **組織/プロジェクト** — `GET /api/biz/customer/getCustomerInfo` → `organizations[0]` / `projects[0]`、コンソールが使用するデフォルトのペア。
7. **キー** — `POST /api/biz/v1/organization/<oid>/projects/<pid>/api_keys {name}` → `data.apiKey` + `data.secretKey`; ドットで連結したものがキーです。
8. **ゲート** — 無料モデルでの 2 つの異なるプロンプト (どちらも 200、非空、異なる) **および** `max_tokens ≥ 1024` での `get_time` ツール呼び出し。その後にのみ、キーが `keys.txt` に追加されます。

## ⚙️ CLI オプション

```bash
node src/cli.js --count 5 --token-cmd "<solver>"   # mint
node src/cli.js --verify-only                      # re-check every key in keys.txt
node src/cli.js --screen                           # test your proxy list against BigModel
node src/cli.js --help
```

| フラグ | 意味 |
| --- | --- |
| `--count N` | 発行するアカウント (= キー) の数 (デフォルト `5`) |
| `--conc N` | 同時に処理するアカウント数、最大 `8` (デフォルト `1`) |
| `--gap MS` | アカウント間の一時停止 (デフォルト `1200`) |
| `--model <id>` | ライブゲートに使用する無料モデル (デフォルト `glm-4.5-flash`) |
| `--token-cmd CMD` | TCaptcha ソルバーコマンド; プレースホルダー `{exit}`、`{url}`、`{tmp}` — **発行には必須** |
| `--token-file F` | ソルバーがチケット JSON を出力しない場合に書き込むファイル |
| `--appid ID` | ソルバーに渡す TCaptcha appid (デフォルト `196026326`) |
| `--mail <rail>` | `emailnator` · `broker` · `temptf` (デフォルト `emailnator`) |
| `--pool <file>` | プロキシリスト、1 行に 1 つの出口 (または環境変数 `ZHIPU_PROXIES`) — オプション |
| `--exits N` | 諦める前にアカウントごとに試す出口の数 (デフォルト `6`) |
| `--timeout MS` | リクエストごとのタイムアウト (デフォルト `60000`) |
| `--verify-only` | `keys.txt` のすべてのキーをゲートで再実行 |
| `--screen` | プロキシリストを BigModel に対してのみテスト |

## 🛰️ プロキシの背後で

**オプション — 大規模な場合は推奨。** `--pool <file>` を渡す (または `ZHIPU_PROXIES` を設定する) と、すべてのリクエストがそのリストの出口を通ります (`http://host:port`、`socks5://host:port`、`host:port`、`user:pass@host:port`); プールなしの場合、CLI は `running WITHOUT a proxy (direct)` と表示して直接接続します。

* キーは**出口に紐づきません**: 2 回のスクリーンの 8 つのライブ出口と 15 出口の再スキャンがすべて同じキーで 200 を返しました (`out/07-exit-portability.txt`、`out/08-exit-rescan.txt`、`out/11-cn-lane-key-cross-exit.txt`);
* **飽和した**出口は死んだキーではありません — `--reverify` は枯渇した行に `dead 0ms` を刻印することがありますが、同じキーが新しい出口から 200 を返します; ライブリストから出口を選んでください;
* このボックスでは WARP は**使用されていません** (オペレーターのリモートアクセスを切断したため)、そのためハーネスはプールの出口を明示的に使用します。

## 📄 ファイル

| パス | 内容 |
| --- | --- |
| `keys.txt` | 1 行に 1 つのライブ検証済み `<apiKey>.<secretKey>` — git 管理外 |
| `proxies.txt` | あなたの出口、1 行に 1 つ — git 管理外 |
| `accounts.json` | アカウント ↔ キー ↔ ゲート記録 — git 管理外 |
| `out/` | CLI が書き込む実行ごとの生データ (モデルの応答、チャットボディ、ログ) — git 管理外 |
| `launcher.config.json` | 記憶されたランチャー設定 — git 管理外 |

これ以外は何も書き込まれません: セッショントークン、TCaptcha チケット、メールボックスパスワードのいずれもディスクに保存されません。

## 🔌 9Router に接続する

[9Router](https://9router.com) はセルフホスト型の OpenAI 互換ルーターです。このプロバイダーを一度登録すれば、`keys.txt` のすべてのキーが 1 つのプロバイダーノードの下の接続になります:

```bash
node src/connect-9router.js
```

デフォルト: `--base http://localhost:20128`、`--password 123456`、`--name "Zhipu BigModel"`、`--prefix zhipu`、`--base-url https://open.bigmodel.cn/api/paas/v4`、`--model glm-4.5-flash`。モデルは `zhipu/<model id>` として提供され、すべてのキーにわたってロードバランシングされます。

> あなたのネットワークから中国ルートが遅い場合、同じキーが `https://api.z.ai/api/paas/v4` で動作します — 測定済み、同じキー、同じ 11 個の ID。

## 🔌 OmniRoute に接続する

[OmniRoute](https://omniroute.online) はセルフホスト型の OpenAI 互換ルーターです。このプロバイダーを一度登録すれば、`keys.txt` のすべてのキーが 1 つのプロバイダーノードの下の接続になります:

```bash
node src/connect-omniroute.js
```

デフォルト: `--base http://localhost:20128`、`--password 123456`、`--name "Zhipu BigModel"`、`--prefix zhipu`、`--base-url https://open.bigmodel.cn/api/paas/v4`、`--model glm-4.5-flash`。モデルは `zhipu/<model id>` として提供され、すべてのキーにわたってロードバランシングされます。

> あなたのネットワークから中国ルートが遅い場合、同じキーが `https://api.z.ai/api/paas/v4` で動作します — 測定済み、同じキー、同じ 11 個の ID。

## 🔑 1 つのキーで得られるもの

| | |
| --- | --- |
| 🏢 プロバイダー | **Zhipu BigModel** — [open.bigmodel.cn](https://open.bigmodel.cn) |
| 🎁 プロバイダーが提供するもの | 残高 0 のアカウントでの GLM 無料枠 — 中国の登録レールはプロトコル側で動作し、すべてのキーがチャットとツールで検証済み |
| 🔑 1 つのキーで得られるもの | 専用アカウントにスコープされた 1 つの API キー: 下記エンドポイントの 11 個のモデル ID、あなたのプランの制限内で。クォータは**アカウント**に紐づくため、このツールがキーごとに 1 アカウントを作成するのです |
| 🌐 API の形式 | OpenAI 互換: `POST https://open.bigmodel.cn/api/paas/v4/chat/completions` |
| 🔒 あなたのデータ | 接続されるのは open.bigmodel.cn と設定した受信トレイバックエンドのみ; キーはあなたのマシンに留まります |

## 🐞 問題

* **無料 ID は `/models` には見えません。** `GET /models` は 11 個の有料 ID のみを返します; `glm-4.5-flash` / `glm-4.7-flash` / `glm-4.6v-flash` は `models/free/` の下にドキュメント化されており、そのリストには決して現れません — それを「キーには何もない」と読まないでください。
* **このパネルには `/api/pricing` がありません。** `/api/pricing`、`/api/paas/v4/pricing`、`/api/biz/pricing`、`/api/paas/pricing`、`/api/product/pricing` はすべて **404** です — 実行可能な価格情報は SPA の価格ページとドキュメントのみなので、ここでの無料枠の証明は「残高 0 × 無料モデル 200」+ 公式の `免费` ページであり、パネルの比率表ではありません。
* **有料モデルが応答することは無料枠の証明ではありません。** 新しく作成された中国アカウントは現在、支出記録が `0E-9` のまま `glm-4.5-air`、`glm-5-turbo`、`glm-4.6` に対して 200 を返します (`out/13-cn-lane-key-paid-models-note.txt`) — 新規アカウントの猶予です。古いキーでは同じモデルが `429/1113` を返します。`glm-4.5-flash` / `glm-4.7-flash` の 200 のみが永続的な無料枠の証拠です。
* **`glm-4.5-flash` には廃止の注記があります** (2026-01-30、リクエストは `glm-4.7-flash` に誘導)。応答しなくなった場合は、`--model` とゲートを `glm-4.7-flash` に切り替えてください (両方のアカウントで 200)。
* **チケットの鮮度。** TCaptcha チケットは単回使用で短命です: 解決、コード送信、ログインを連続して行うか、再度解決してください。コードエンドポイントではリクエスト ID が必須です。

Zhipu がキャプチャの appid、コードエンドポイント、またはログインの形式を変更した場合、ツールはそのステップで停止し、確認したステータスとボディを出力します。コマンドと正確な出力を添えて **[issue を開いてください](../../issues)**; PR も歓迎します。

## 📄 ライセンス

MIT © 2026 — [LICENSE](LICENSE) を参照。

<div align="center">

**[MIT](LICENSE)** © 2026 zhipu-bulk-apikey contributors

</div>
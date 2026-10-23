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

**批量创建带 API 密钥的 BigModel（智谱）账户——注册链路是纯 HTTP（TCaptcha 票据 + 邮箱验证码），兼容 OpenAI 的 GLM 推理，外加一个 9Router 连接器。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-11%20served-412991?style=for-the-badge)](https://docs.bigmodel.cn/cn/guide/models/free/glm-4.5-flash)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 快速开始](#-quick-start) · [🎁 免费额度](#-free-tier--how-much-you-get) · [🤖 模型](#-models--all-11-of-them) · [🧪 使用 API](#-how-to-use-the-api) · [✅ 已验证](#-verified-working--every-key-is-tested) · [🧭 工作原理](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ 选项](#️-cli-options) · [🛰️ 代理](#️-behind-a-proxy) · [🐞 问题](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 为什么会有这个项目

BigModel（`open.bigmodel.cn`，智谱的中国平台）通过一个**兼容 OpenAI** 的 `…/api/paas/v4` 端点提供 GLM 系列模型，而且它的免费额度是真实存在的：`glm-4.5-flash`、`glm-4.7-flash` 和 `glm-4.6v-flash` 可以在一个控制台余额显示为 **0** 的账户上进行实时对话。有趣的地方在于入口：中国区注册链路（TCaptcha → 邮箱验证码 → 登录）**完全在协议层完成**——流程本身不需要浏览器——所以一条命令就能把一个全新的收件箱地址变成一个账户、一个项目密钥和一行经过验证的 `keys.txt`。由于配额挂在**账户**上，该工具**每个密钥创建一个账户**，每个账户在写入之前都要通过两个不同的提示词和一次真实的 `get_time` 工具调用。

## 🎁 免费额度——你能得到多少

| 项目 | 值 |
| --- | --- |
| 免费模型 ID | **`glm-4.5-flash`**、**`glm-4.7-flash`**、**`glm-4.6v-flash`**——文档中 `models/free/` 的集合（`glm-4.5-flash`：“完全免费开放使用”）；这三个都能在此账户上应答 |
| 账户余额 | **0**——控制台报告 `balance 0 · giveAmount 0 · recharge 0 · creditStatus NOT_OPEN`（`providers/zhipu/out/12-cn-account-balance-zero.txt`） |
| 该账户上的付费模型 | `glm-4.5-air`、`glm-5-turbo`、`glm-5.3-flash` → `429 {"code":"1113","message":"余额不足或无可用资源包,请充值。"}`——所以 200 并*不是*由额度解释的：免费模型确实是免费的 |
| 注册成本 | 无——**不需要银行卡，不需要短信**：仅邮箱验证码；账户带有 `acType: NOT_AC`（无实名认证），API 依然可用 |
| 一个账户能得到什么 | 它自己的组织和默认项目，以及在其上铸造的一个密钥（`POST …/organization/<oid>/projects/<pid>/api_keys`） |
| 速率限制 | `glm-4.6v-flash` 大多返回 `1305 该模型当前访问量过大`（繁忙，重试）；`glm-4.7-flash` 在第二次尝试时通过 |
| 密钥形态 | 49 个字符，即控制台的 `<apiKey>.<secretKey>` 用点号连接 |
| 验证门槛 | 两个**不同的**提示词，都返回 200 且非空且不同，外加一次 `get_time` 工具调用 |

> 💡 免费额度由智谱 BigModel 设定，可能会变化。请在 [open.bigmodel.cn](https://open.bigmodel.cn) 查看实时数据——并让工具自身的门槛来判定：

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 模型——全部 11 个

用新密钥请求 `GET /api/paas/v4/models` 会返回 **11 个 ID**——这就是徽章上的数字（`providers/zhipu/out/01-models.json`）：

| 模型 ID | 备注 |
| --- | --- |
| `glm-4.5`、`glm-4.5-air` | 4.5 代（`-air` 是便宜的付费档） |
| `glm-4.6`、`glm-4.7` | 4.6 / 4.7 代 |
| `glm-5`、`glm-5-turbo` | 5 代 |
| `glm-5.1`、`glm-5.2`、`glm-5.3` | 5.x 代 |
| `glm-5.3-flash`、`glm-5.3-flashx` | flash 变体 |

**免费 ID 不在那个列表里**——它们单独记录在 `models/free/` 下，并已在此账户上实时验证：`glm-4.5-flash`（**该工具的门槛模型**：返回 200 且有真实内容）、`glm-4.7-flash`（200，`"OK"`）、`glm-4.6v-flash`（可达，通常繁忙）。零余额账户上的付费 ID 会返回 `1113`，直到账户充值为止，这正是该工具以 `glm-4.5-flash` 作为门槛的原因。

同一个密钥在 `api.z.ai/api/paas/v4` 上应答，返回**完全相同的 11 个 ID**——BigModel 和 Z.AI 共享同一个密钥空间，所以路由器可以指向任一主机。

## 🧪 如何使用 API

基础 URL 是 **`https://open.bigmodel.cn/api/paas/v4`**——兼容 OpenAI，所以任何支持 OpenAI 的东西都能用（SDK、Cursor、OpenCode、Kilo Code 等）。

```bash
curl https://open.bigmodel.cn/api/paas/v4/chat/completions \
  -H "Authorization: Bearer <apiKey>.<secretKey>" \
  -H 'Content-Type: application/json' \
  -d '{"model":"glm-4.5-flash","messages":[{"role":"user","content":"say ok"}],"max_tokens":1024}'
```

两个容易踩的坑：

* 密钥是控制台的 **`<apiKey>.<secretKey>`** 对——两半都要，用点号连接，放进 `Authorization: Bearer` 头（单独的 `apiKey` 不够）；
* `glm-4.5-flash` 是一个**推理**模型（默认开启思考），思考会消耗 token 预算——要得到 `tool_calls` 应答，请使用 `max_tokens ≥ 1024`（用 `256` 时调用有时会静默为空；在 `providers/zhipu/out/09-tools-check.txt` 中测量）。

## 🛠 快速开始

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

### 账户从何而来

不需要浏览器，不需要密码：CLI 向它的邮箱通道请求一个全新地址，通过 `--token-cmd` 解决面板的 **腾讯 TCaptcha**（appid `196026326`，从 `static.bigmodel.cn/wd-paas-front` 中读出），用 `POST /api/biz/code/emailCode/TencentVerifyCaptcha` 发送验证码，读取面板从其自身通知地址（`notifications [at] account.bigmodel.cn`）寄出的 6 位验证码，然后提交 `POST /api/auth/login`——`newUserFlag:"YES"` 意味着账户是当场创建的。接着它从 `GET /api/biz/customer/getCustomerInfo` 中选取默认组织/项目并铸造密钥。运行 `node src/cli.js --help` 查看完整参数列表。

### 🖱️ 启动器

`src/launcher.js`（与本 README 相同的横幅）会询问数量、代理列表文件和验证模型，将它们记在 `launcher.config.json` 中，并用正确的参数运行 CLI——然后提供 9Router 和 OmniRoute 连接器。`src/connect-9router.js` 在 `zhipu` 前缀下注册该提供商，默认模型为 `glm-4.5-flash`。

## ✅ 已验证可用——每个密钥都经过测试

以下全部于 2026-10-22 在两个实时密钥上测量（`providers/zhipu/keys.txt`，2 行——z.ai 账户密钥和当天通过中国区链路铸造的一个密钥）：

| 检查项 | 结果 |
| --- | --- |
| 用**伪造**密钥请求 `GET /api/paas/v4/models` | **401** `1000 身份验证失败`——认证检查是真实的 |
| 用通道密钥请求 `GET /api/paas/v4/models` | **200**，即上面的 11 个 ID |
| `POST /chat/completions` `glm-4.5-flash`，提示词 A（质数） | **200**——`content:"101,103,107"`，`reasoning_content` 946 → 3432 字符 |
| 同一模型，提示词 B（一句土耳其语） | **200**——`content:"Deniz mavidir."` ⇒ 两者都非空且**不同**（合理性 ✓） |
| `glm-4.7-flash`（关闭思考） | 首次 `1305 该模型当前访问量过大` → 重试 **200** `"OK"` |
| `glm-4.6v-flash` | `1305`（模型存在，繁忙）——可重试类别 |
| 付费 ID（`glm-4.5-air`、`glm-5-turbo`、`glm-5.3-flash`） | 在余额为 0 的账户上返回 `429 1113 余额不足或无可用资源包,请充值。` ⇒ 免费模型的 200 不是额度所致 |
| `GET api.z.ai/api/paas/v4/models`——**同一个密钥** | **200**，逐字节相同的 11 个 ID（双向） |
| 工具 | `get_time` `tool_calls` 在 `max_tokens ≥ 1024` 时返回 **200**（`out/09-tools-check.txt`） |
| 跨出口 | 两次筛查中的 **8 个实时出口**用同一密钥全部返回 **200** ⇒ 密钥不绑定 IP；一次 15 出口的重新扫描也在各处返回 200 |
| `preadd-gate --model glm-4.5-flash` | sanity=true · tools=get_time ✓ · 2842 ms；一次新出口重跑 9139 ms；中国区链路密钥 6816 ms，一次 300 秒复验 7373 ms |
| 中国区注册链路 | 纯 HTTP 解决 TCaptcha 票据（27 秒，1 次尝试）→ 发送验证码 → mailtrap 验证码 → `newUserFlag:"YES"` → 组织/项目 → `apiKey.secretKey`；铸造的密钥随后通过了上述完整门槛 |

证据：`providers/zhipu/out/verify-20261022063844.{txt,json}`、`verify-20261022073006.{txt,json}`、`01-models.json` + `.headers.txt`、`02-chat-p1.json`、`02-chat-p2.json`、`03-chat-p1-full.json`（及其 headers）、`04-cn-signup-gate.txt`、`07-exit-portability.txt`、`08-exit-rescan.txt`、`09-tools-check.txt`、`10-cn-tcaptcha-crack.txt`、`11-cn-lane-key-cross-exit.txt`、`12-cn-account-balance-zero.txt`、`13-cn-lane-key-paid-models-note.txt`；门槛运行 `proxy-lab/out/preadd-zhipu-1792651196.jsonl`、`preadd-zhipu-refresh.jsonl`、`preadd-zhipu-cn-1792654779.jsonl`；整条链路可用 `proxy-lab/zhipu-verify.js` 重新运行。

> **质量门槛。** 这里的每个密钥在写入 `keys.txt` 之前都通过了实时 `chat-200`
> （绝不发布失效密钥）。路由器组合在模型层面遵循同样的规则：一个条目**只有在模型能应答
> `chat-200` 且能调用工具时**才会被添加——不支持工具的模型、失效密钥或失效提供商会被丢弃
> 而不是添加。随时重新运行验证步骤；失败会被报告，绝不隐藏。

## 🧭 工作原理

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Zhipu BigModel page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://open.bigmodel.cn/api/paas/v4/chat/completions → real content = the key is live
```

每个账户，全部通过你代理池中的一个出口完成：

1. **邮箱**——从配置的通道（`--mail emailnator | broker | temptf`）获取一个全新收件箱地址；面板的验证码从其通知地址（`notifications [at] account.bigmodel.cn`）寄来，主题为 `你的Zhipu验证码: <6 digits>`。
2. **验证码**——为 appid `196026326` 获取一个腾讯 TCaptcha `{ticket,randstr}`。传入 `--token-cmd`；求解器可以把 JSON 打印到 stdout，或写入 `--token-file`（`{tmp}` 会被替换）。纯 HTTP 可行：机群的 `captcha-kit --kind tencent-http` 在第一次尝试时用 27 秒解决了它。
3. **发送验证码**——`POST /api/biz/code/emailCode/TencentVerifyCaptcha {deviceToken,email,typeCode:"login",ticket,randstr}` → `验证码已发送，请查收邮件`。过期的票据或缺失的请求 ID 会被拒绝（在 `out/04-cn-signup-gate.txt` 中探测）。
4. **读取验证码**——从收件箱中取出 6 位数字。
5. **会话**——`POST /api/auth/login {email,emailCode,loginType:"email",grantType:"customer",userType:"PERSONAL"}`；`newUserFlag:"YES"` 意味着账户就是在此处创建的——**没有密码步骤**。
6. **组织/项目**——`GET /api/biz/customer/getCustomerInfo` → `organizations[0]` / `projects[0]`，即控制台使用的默认组合。
7. **密钥**——`POST /api/biz/v1/organization/<oid>/projects/<pid>/api_keys {name}` → `data.apiKey` + `data.secretKey`；用点号连接起来就是密钥。
8. **门槛**——在免费模型上用两个不同的提示词（都返回 200、非空、不同）**并且**用 `max_tokens ≥ 1024` 进行一次 `get_time` 工具调用。只有到这时密钥才会被追加到 `keys.txt`。

## ⚙️ CLI 选项

```bash
node src/cli.js --count 5 --token-cmd "<solver>"   # mint
node src/cli.js --verify-only                      # re-check every key in keys.txt
node src/cli.js --screen                           # test your proxy list against BigModel
node src/cli.js --help
```

| 参数 | 含义 |
| --- | --- |
| `--count N` | 要铸造的账户（= 密钥）数量（默认 `5`） |
| `--conc N` | 同时进行的账户数，最大 `8`（默认 `1`） |
| `--gap MS` | 账户之间的暂停（默认 `1200`） |
| `--model <id>` | 用于实时门槛的免费模型（默认 `glm-4.5-flash`） |
| `--token-cmd CMD` | TCaptcha 求解器命令；占位符 `{exit}`、`{url}`、`{tmp}`——**铸造时必需** |
| `--token-file F` | 求解器写入票据 JSON 的文件，当它不打印时使用 |
| `--appid ID` | 传给求解器的 TCaptcha appid（默认 `196026326`） |
| `--mail <rail>` | `emailnator` · `broker` · `temptf`（默认 `emailnator`） |
| `--pool <file>` | 代理列表，每行一个出口（或环境变量 `ZHIPU_PROXIES`）——可选 |
| `--tries N` | 每个账户在放弃前尝试的出口数（默认 `2`） |
| `--timeout MS` | 每请求超时（默认 `60000`） |
| `--verify-only` | 让 `keys.txt` 中的每个密钥重新通过门槛 |
| `--screen` | 仅针对 BigModel 测试代理列表 |

## 🛰️ 使用代理

**可选——大规模使用时推荐。** 传入 `--pool <file>`（或设置 `ZHIPU_PROXIES`），每个请求都会经过该列表中的一个出口（`http://host:port`、`socks5://host:port`、`host:port`、`user:pass@host:port`）；没有代理池时，CLI 会打印 `running WITHOUT a proxy (direct)` 并直接连接。

* 密钥**不绑定出口**：两次筛查的 8 个实时出口和一次 15 出口的重新扫描都用同一密钥返回了 200（`out/07-exit-portability.txt`、`out/08-exit-rescan.txt`、`out/11-cn-lane-key-cross-exit.txt`）；
* **饱和**的出口不等于失效密钥——`--reverify` 可能会在一条耗尽的线路上标记 `dead 0ms`，而同一密钥从新出口应答 200；请从实时列表中选择出口；
* 此机器上**不使用** WARP（它会切断操作员的远程访问），所以测试装置显式采用代理池出口。

## 📄 文件

| 路径 | 内容 |
| --- | --- |
| `keys.txt` | 每行一个经过实时验证的 `<apiKey>.<secretKey>`——已被 git 忽略 |
| `proxies.txt` | 你的出口，每行一个——已被 git 忽略 |
| `accounts.json` | 账户 ↔ 密钥 ↔ 门槛记录——已被 git 忽略 |
| `out/` | CLI 写入的每次运行的原始材料（模型应答、聊天正文、日志）——已被 git 忽略 |
| `launcher.config.json` | 记住的启动器设置——已被 git 忽略 |

不写入其他任何东西：磁盘上不存储会话令牌、TCaptcha 票据或邮箱密码。

## 🔌 连接到 9Router

[9Router](https://9router.com) 是一个自托管、兼容 OpenAI 的路由器。注册一次该提供商，`keys.txt` 中的每个密钥都会成为一个提供商节点下的连接：

```bash
node src/connect-9router.js
```

默认值：`--base http://localhost:20128`、`--password 123456`、`--name "Zhipu BigModel"`、`--prefix zhipu`、`--base-url https://open.bigmodel.cn/api/paas/v4`、`--model glm-4.5-flash`。模型以 `zhipu/<model id>` 形式提供，并在所有密钥之间负载均衡。

> 如果从你的网络访问中国区线路较慢，同一个密钥在 `https://api.z.ai/api/paas/v4` 上也能用——已测量，同一密钥，同样的 11 个 ID。

## 🔌 连接到 OmniRoute

[OmniRoute](https://omniroute.online) 是一个自托管、兼容 OpenAI 的路由器。注册一次该提供商，`keys.txt` 中的每个密钥都会成为一个提供商节点下的连接：

```bash
node src/connect-omniroute.js
```

默认值：`--base http://localhost:20128`、`--password 123456`、`--name "Zhipu BigModel"`、`--prefix zhipu`、`--base-url https://open.bigmodel.cn/api/paas/v4`、`--model glm-4.5-flash`。模型以 `zhipu/<model id>` 形式提供，并在所有密钥之间负载均衡。

> 如果从你的网络访问中国区线路较慢，同一个密钥在 `https://api.z.ai/api/paas/v4` 上也能用——已测量，同一密钥，同样的 11 个 ID。

## 🔑 一个密钥能得到什么

| | |
| --- | --- |
| 🏢 提供商 | **智谱 BigModel**——[open.bigmodel.cn](https://open.bigmodel.cn) |
| 🎁 提供商提供什么 | 零余额账户上的 GLM 免费额度——中国区注册链路在协议层运行，每个密钥都经过聊天和工具验证 |
| 🔑 一个密钥能得到什么 | 一个作用域为其自身账户的 API 密钥：下方端点上的 11 个模型 ID，受你的套餐限制。配额挂在**账户**上，这正是该工具每个密钥创建一个账户的原因 |
| 🌐 API 形态 | 兼容 OpenAI：`POST https://open.bigmodel.cn/api/paas/v4/chat/completions` |
| 🔒 你的数据 | 只联系 open.bigmodel.cn 和你配置的收件箱后端；密钥留在你的机器上 |

## 🐞 问题

* **免费 ID 对 `/models` 不可见。** `GET /models` 只返回 11 个付费 ID；`glm-4.5-flash` / `glm-4.7-flash` / `glm-4.6v-flash` 记录在 `models/free/` 下，从不出现在该列表中——不要把这理解为“密钥什么都没有”。
* **此面板上没有 `/api/pricing`。** `/api/pricing`、`/api/paas/v4/pricing`、`/api/biz/pricing`、`/api/paas/pricing`、`/api/product/pricing` 全部是 **404**——唯一可操作的价格界面是 SPA 价格页面加上文档，所以这里的免费额度证据是“余额 0 × 免费模型 200”加上官方 `免费` 页面，绝不是面板的比率表。
* **付费模型能应答不是免费额度的证据。** 一个新创建的中国区账户目前对 `glm-4.5-air`、`glm-5-turbo` 和 `glm-4.6` 返回 200，而其消费记录保持 `0E-9`（`out/13-cn-lane-key-paid-models-note.txt`）——这是新账户的宽限期。在较旧的密钥上，同样的模型返回 `429/1113`。只有 `glm-4.5-flash` / `glm-4.7-flash` 的 200 才是持久的免费额度证据。
* **`glm-4.5-flash` 有一条退役说明**（2026-01-30，请求被引导至 `glm-4.7-flash`）。如果它停止应答，请把 `--model` 和门槛切换到 `glm-4.7-flash`（在两个账户上都返回 200）。
* **票据新鲜度。** TCaptcha 票据是一次性且短命的：连续地解决、发送验证码并登录，或者重新解决。验证码端点上请求 ID 是必需的。

如果智谱更改了验证码 appid、验证码端点或登录形态，工具会在该步骤停止并打印它看到的状态和正文。请带上命令和确切输出**[提交 issue](../../issues)**；欢迎 PR。

## 📄 许可证

MIT © 2026——见 [LICENSE](LICENSE)。

<div align="center">

**[MIT](LICENSE)** © 2026 zhipu-bulk-apikey contributors

</div>
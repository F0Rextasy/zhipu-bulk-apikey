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

**Массовое создание аккаунтов BigModel (Zhipu) с API-ключами — цепочка регистрации полностью на HTTP (тикет TCaptcha + код из письма), OpenAI-совместимый инференс GLM, плюс коннектор для 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-11%20served-412991?style=for-the-badge)](https://docs.bigmodel.cn/cn/guide/models/free/glm-4.5-flash)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Быстрый старт](#-quick-start) · [🎁 Бесплатный тариф](#-free-tier--how-much-you-get) · [🤖 Модели](#-models--all-11-of-them) · [🧪 Использование API](#-how-to-use-the-api) · [✅ Проверено](#-verified-working--every-key-is-tested) · [🧭 Как это работает](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Опции](#️-cli-options) · [🛰️ Прокси](#️-behind-a-proxy) · [🐞 Проблемы](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Зачем это нужно

BigModel (`open.bigmodel.cn`, китайская платформа Zhipu) предоставляет семейство GLM через **OpenAI-совместимую** конечную точку `…/api/paas/v4`, и его бесплатный тариф вполне реален: `glm-4.5-flash`, `glm-4.7-flash` и `glm-4.6v-flash` отвечают в живых чатах на аккаунте, баланс которого в консоли показывает **0**. Самое интересное — это входная дверь: китайская цепочка регистрации (TCaptcha → код из письма → вход) **полностью протокольная** — для самого процесса браузер не нужен — поэтому одна команда превращает свежий адрес почтового ящика в аккаунт, ключ проекта и проверенную строку в `keys.txt`. Поскольку квота привязана к **аккаунту**, инструмент создаёт **один аккаунт на ключ**, и каждый проходит проверку двумя разными запросами и реальным вызовом инструмента `get_time`, прежде чем будет записан.

## 🎁 Бесплатный тариф — сколько вы получаете

| Что | Значение |
| --- | --- |
| ID бесплатных моделей | **`glm-4.5-flash`**, **`glm-4.7-flash`**, **`glm-4.6v-flash`** — документированный набор `models/free/` (`glm-4.5-flash`: "完全免费开放使用"); все три отвечают на этом аккаунте
| Баланс аккаунта | **0** — отчёт консоли `balance 0 · giveAmount 0 · recharge 0 · creditStatus NOT_OPEN` (`providers/zhipu/out/12-cn-account-balance-zero.txt`) |
| Платные модели на этом аккаунте | `glm-4.5-air`, `glm-5-turbo`, `glm-5.3-flash` → `429 {"code":"1113","message":"余额不足或无可用资源包,请充值。"}` — значит, ответ 200 *не* объясняется кредитом: бесплатные модели действительно бесплатны |
| Стоимость регистрации | нет — **без карты, без SMS**: только код из письма; аккаунт имеет `acType: NOT_AC` (без 实名认证), и API всё равно работает |
| Что получает один аккаунт | свою организацию + проект по умолчанию и ключ, созданный на нём (`POST …/organization/<oid>/projects/<pid>/api_keys`) |
| Ограничение скорости | `glm-4.6v-flash` в основном отвечает `1305 该模型当前访问量过大` (занято, повторите); `glm-4.7-flash` прошёл со второй попытки |
| Формат ключа | 49 символов, пара из консоли `<apiKey>.<secretKey>`, соединённая точкой |
| Проверка | два **разных** запроса, оба 200, непустые и разные, плюс вызов инструмента `get_time` |

> 💡 Бесплатный тариф устанавливается Zhipu BigModel и может измениться. Проверяйте актуальные цифры на [open.bigmodel.cn](https://open.bigmodel.cn) — и пусть решение принимает собственная проверка инструмента:

```bash
node src/cli.js --verify-only     # каждый ключ в keys.txt повторно тестируется реальным вызовом чата
```

## 🤖 Модели — все 11

`GET /api/paas/v4/models` со свежим ключом возвращает **11 ID** — это число на бейдже (`providers/zhipu/out/01-models.json`):

| ID модели | Примечания |
| --- | --- |
| `glm-4.5`, `glm-4.5-air` | поколение 4.5 (`-air` — дешёвый платный тариф) |
| `glm-4.6`, `glm-4.7` | поколение 4.6 / 4.7 |
| `glm-5`, `glm-5-turbo` | поколение 5 |
| `glm-5.1`, `glm-5.2`, `glm-5.3` | поколение 5.x |
| `glm-5.3-flash`, `glm-5.3-flashx` | flash-варианты |

**Бесплатных ID в этом списке нет** — они документированы отдельно в `models/free/` и проверены вживую на этом аккаунте: `glm-4.5-flash` (**модель проверки инструмента**: 200 с реальным содержимым), `glm-4.7-flash` (200, `"OK"`), `glm-4.6v-flash` (доступна, обычно занята). Платный ID на аккаунте с нулевым балансом отвечает `1113`, пока аккаунт не пополнен, — именно поэтому инструмент проверяет через `glm-4.5-flash`.

Тот же ключ отвечает на `api.z.ai/api/paas/v4` с **теми же 11 ID** — BigModel и Z.AI используют одно пространство ключей, поэтому роутер может указывать на любой из хостов.

## 🧪 Как использовать API

Базовый URL — **`https://open.bigmodel.cn/api/paas/v4`** — OpenAI-совместимый, поэтому работает всё, что говорит на языке OpenAI (SDK, Cursor, OpenCode, Kilo Code, …).

```bash
curl https://open.bigmodel.cn/api/paas/v4/chat/completions \
  -H "Authorization: Bearer <apiKey>.<secretKey>" \
  -H 'Content-Type: application/json' \
  -d '{"model":"glm-4.5-flash","messages":[{"role":"user","content":"say ok"}],"max_tokens":1024}'
```

Две вещи, на которых легко споткнуться:

* ключ — это пара из консоли **`<apiKey>.<secretKey>`** — обе половины, соединённые точкой, идут в заголовок `Authorization: Bearer` (голого `apiKey` недостаточно);
* `glm-4.5-flash` — **reasoning**-модель (размышления включены по умолчанию), и размышления съедают бюджет токенов — для ответа `tool_calls` используйте `max_tokens ≥ 1024` (при `256` вызов иногда молча пустой; измерено в `providers/zhipu/out/09-tools-check.txt`).

## 🛠 Быстрый старт

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

### Откуда берётся аккаунт

Без браузера, без пароля: CLI запрашивает у своего почтового канала свежий адрес, решает **Tencent TCaptcha** панели (appid `196026326`, считанный из `static.bigmodel.cn/wd-paas-front`) через `--token-cmd`, отправляет код через `POST /api/biz/code/emailCode/TencentVerifyCaptcha`, читает 6-значный код, который панель присылает со своего адреса уведомлений (`notifications [at] account.bigmodel.cn`), и отправляет `POST /api/auth/login` — `newUserFlag:"YES"` означает, что аккаунт был создан на месте. Затем он выбирает организацию/проект по умолчанию из `GET /api/biz/customer/getCustomerInfo` и создаёт ключ. Запустите `node src/cli.js --help` для полного списка флагов.

### 🖱️ Лаунчер

`src/launcher.js` (тот же баннер, что и в этом README) спрашивает количество, файл списка прокси и модель проверки, запоминает их в `launcher.config.json` и запускает CLI с нужными флагами — затем предлагает коннекторы 9Router и OmniRoute. `src/connect-9router.js` регистрирует провайдера под префиксом `zhipu` с `glm-4.5-flash` в качестве модели по умолчанию.

## 🚀 Одна команда

Капча решается за вас — одна команда создаёт N аккаунтов и оставляет только те ключи, которые подтвердил живой вызов чата:

```bash
npm install                  # once: pulls puppeteer-core
npm start                    # menu → "1) Mint keys" → "How many keys?" (Enter = 10)
# or non-interactive:
node src/cli.js --count N
```

`--auto` включён по умолчанию, и передавать ничего не нужно: встроенный `src/solver.js` открывает Chrome с интерфейсом через собственный выход аккаунта и автоматически возвращает токен Turnstile панели. `--dry` выводит разрешённый план и завершается, **не записывая файл и не делая сетевых вызовов**.

> ⚠️ **Условия и риск для аккаунта.** Это инструмент автоматизации, а не продавец аккаунтов. Массовые регистрации и создание ключей — полностью ваша ответственность: они могут нарушать Условия обслуживания провайдера и привести к блокировке адресов, выходов или аккаунтов. Используйте его только на инфраструктуре, которую вам разрешено автоматизировать, и поддерживайте низкую частоту запросов.

## 🔧 Продвинутое (необязательно)

Подключение собственного решателя, ручная вставка токена или указание конкретного Chrome описаны в **[ADVANCED.md](ADVANCED.md)**. Обычному пути ничего из этого не нужно.

## ✅ Проверено в работе — каждый ключ протестирован

Всё измерено 2026-10-22 на двух живых ключах (`providers/zhipu/keys.txt`, 2 строки — ключ аккаунта z.ai и ключ, созданный через китайский канал в тот же день):

| Проверка | Результат |
| --- | --- |
| `GET /api/paas/v4/models` с **поддельным** ключом | **401** `1000 身份验证失败` — проверка аутентификации реальна |
| `GET /api/paas/v4/models` с ключом канала | **200**, 11 ID выше |
| `POST /chat/completions` `glm-4.5-flash`, запрос A (прайминг) | **200** — `content:"101,103,107"`, `reasoning_content` 946 → 3432 символов |
| та же модель, запрос B (турецкое предложение) | **200** — `content:"Deniz mavidir."` ⇒ оба непустые и **разные** (проверка ✓) |
| `glm-4.7-flash` (размышления выключены) | первая попытка `1305 该模型当前访问量过大` → повтор **200** `"OK"` |
| `glm-4.6v-flash` | `1305` (модель существует, занята) — класс с возможностью повтора |
| платные ID (`glm-4.5-air`, `glm-5-turbo`, `glm-5.3-flash`) | `429 1113 余额不足或无可用资源包,请充值。` на аккаунте с балансом 0 ⇒ ответы 200 бесплатных моделей не связаны с кредитом |
| `GET api.z.ai/api/paas/v4/models` — **тот же ключ** | **200**, побайтово те же 11 ID (в обе стороны) |
| инструменты | `get_time` `tool_calls` **200** при `max_tokens ≥ 1024` (`out/09-tools-check.txt`) |
| кросс-выход | **8 живых выходов** в двух проверках все ответили **200** с тем же ключом ⇒ ключ не привязан к IP; повторное сканирование 15 выходов также ответило 200 везде |
| `preadd-gate --model glm-4.5-flash` | sanity=true · tools=get_time ✓ · 2842 мс; повторный запуск на свежем выходе 9139 мс; ключ китайского канала 6816 мс и повторная проверка 300 с — 7373 мс |
| Китайский канал регистрации | тикет TCaptcha решён на чистом HTTP (27 с, 1 попытка) → код отправлен → код из mailtrap → `newUserFlag:"YES"` → организация/проект → `apiKey.secretKey`; созданный ключ затем прошёл полную проверку выше |

Доказательства: `providers/zhipu/out/verify-20261022063844.{txt,json}`, `verify-20261022073006.{txt,json}`, `01-models.json` + `.headers.txt`, `02-chat-p1.json`, `02-chat-p2.json`, `03-chat-p1-full.json` (и его заголовки), `04-cn-signup-gate.txt`, `07-exit-portability.txt`, `08-exit-rescan.txt`, `09-tools-check.txt`, `10-cn-tcaptcha-crack.txt`, `11-cn-lane-key-cross-exit.txt`, `12-cn-account-balance-zero.txt`, `13-cn-lane-key-paid-models-note.txt`; запуски проверки `proxy-lab/out/preadd-zhipu-1792651196.jsonl`, `preadd-zhipu-refresh.jsonl`, `preadd-zhipu-cn-1792654779.jsonl`; вся цепочка воспроизводима через `proxy-lab/zhipu-verify.js`.

> **Контроль качества.** Каждый ключ здесь прошёл живой `chat-200`, прежде чем был записан в `keys.txt`
> (мёртвые ключи никогда не поставляются). Комбинации роутера следуют тому же правилу на уровне модели: запись
> добавляется **только если модель отвечает `chat-200` и умеет вызывать инструменты** — модель без поддержки инструментов,
> мёртвый ключ или мёртвый провайдер отбрасывается, а не добавляется. Повторяйте шаг проверки в любое время;
> сбои сообщаются, но никогда не скрываются.

## 🧭 Как это работает

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Zhipu BigModel page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://open.bigmodel.cn/api/paas/v4/chat/completions → real content = the key is live
```

Для каждого аккаунта — всё через один выход из вашего пула:

1. **почтовый ящик** — свежий адрес ящика из настроенного канала (`--mail emailnator | broker | temptf`); код панели приходит с её адреса уведомлений (`notifications [at] account.bigmodel.cn`) с темой `你的Zhipu验证码: <6 digits>`.
2. **капча** — Tencent TCaptcha `{ticket,randstr}` для appid `196026326`. Передайте `--token-cmd`; решатель может вывести JSON в stdout или записать его в `--token-file` (`{tmp}` подставляется). Чистый HTTP работает: `captcha-kit --kind tencent-http` из флота решил её за 27 с с первой попытки.
3. **отправка кода** — `POST /api/biz/code/emailCode/TencentVerifyCaptcha {deviceToken,email,typeCode:"login",ticket,randstr}` → `验证码已发送，请查收邮件`. Устаревший тикет или отсутствующий request id отклоняются (проверено в `out/04-cn-signup-gate.txt`).
4. **чтение кода** — 6 цифр из ящика.
5. **сессия** — `POST /api/auth/login {email,emailCode,loginType:"email",grantType:"customer",userType:"PERSONAL"}`; `newUserFlag:"YES"` означает, что аккаунт был создан прямо здесь — **без шага с паролем**.
6. **организация/проект** — `GET /api/biz/customer/getCustomerInfo` → `organizations[0]` / `projects[0]`, пара по умолчанию, которую использует консоль.
7. **ключ** — `POST /api/biz/v1/organization/<oid>/projects/<pid>/api_keys {name}` → `data.apiKey` + `data.secretKey`; соединённые точкой — это и есть ключ.
8. **проверка** — два разных запроса к бесплатной модели (оба 200, непустые, разные) **и** вызов инструмента `get_time` при `max_tokens ≥ 1024`. Только после этого ключ добавляется в `keys.txt`.

## ⚙️ Опции CLI

```bash
node src/cli.js --count 5 --token-cmd "<solver>"   # mint
node src/cli.js --verify-only                      # re-check every key in keys.txt
node src/cli.js --screen                           # test your proxy list against BigModel
node src/cli.js --help
```

| Флаг | Значение |
| --- | --- |
| `--count N` | сколько аккаунтов (= ключей) создать (по умолчанию `5`) |
| `--conc N` | одновременных аккаунтов, максимум `8` (по умолчанию `1`) |
| `--gap MS` | пауза между аккаунтами (по умолчанию `1200`) |
| `--model <id>` | бесплатная модель, используемая для живой проверки (по умолчанию `glm-4.5-flash`) |
| `--token-cmd CMD` | команда решателя TCaptcha; плейсхолдеры `{exit}`, `{url}`, `{tmp}` — **обязательна для создания** |
| `--token-file F` | файл, в который решатель записывает JSON тикета, если он его не выводит |
| `--appid ID` | appid TCaptcha, передаваемый решателю (по умолчанию `196026326`) |
| `--mail <rail>` | `emailnator` · `broker` · `temptf` (по умолчанию `emailnator`) |
| `--pool <file>` | список прокси, один выход на строку (или переменная окружения `ZHIPU_PROXIES`) — необязательно |
| `--tries N` | выходов, испробованных на аккаунт до отказа (по умолчанию `2`) |
| `--timeout MS` | таймаут на запрос (по умолчанию `60000`) |
| `--verify-only` | повторно прогнать каждый ключ в `keys.txt` через проверку |
| `--screen` | только протестировать список прокси против BigModel |

## 🛰️ За прокси

**Необязательно — рекомендуется при масштабе.** Передайте `--pool <file>` (или задайте `ZHIPU_PROXIES`), и каждый запрос пойдёт через выход из этого списка (`http://host:port`, `socks5://host:port`, `host:port`, `user:pass@host:port`); без пула CLI выводит `running WITHOUT a proxy (direct)` и подключается напрямую.

* ключ **не привязан к выходу**: 8 живых выходов из двух проверок и повторное сканирование 15 выходов все вернули 200 на том же ключе (`out/07-exit-portability.txt`, `out/08-exit-rescan.txt`, `out/11-cn-lane-key-cross-exit.txt`);
* **насыщенный** выход — это не мёртвый ключ — `--reverify` может поставить `dead 0ms` на исчерпанной строке, тогда как тот же ключ отвечает 200 со свежего; выбирайте выходы из живого списка;
* WARP **не** используется на этой машине (он прервал удалённый доступ оператора), поэтому стенды берут выход из пула явно.

## 📄 Файлы

| Путь | Содержимое |
| --- | --- |
| `keys.txt` | одна живая проверенная строка `<apiKey>.<secretKey>` на строку — игнорируется git |
| `proxies.txt` | ваши выходы, по одному на строку — игнорируется git |
| `accounts.json` | запись аккаунт ↔ ключ ↔ проверка — игнорируется git |
| `out/` | сырой материал каждого запуска, который пишет CLI (ответ моделей, тела чатов, логи) — игнорируется git |
| `launcher.config.json` | сохранённые настройки лаунчера — игнорируется git |

Больше ничего не записывается: ни токен сессии, ни тикет TCaptcha, ни пароль почтового ящика не хранятся на диске.

## 🔌 Подключение к 9Router

[9Router](https://9router.com) — это самостоятельно размещаемый OpenAI-совместимый роутер. Зарегистрируйте этого провайдера один раз, и каждый ключ в `keys.txt` станет соединением под одним узлом провайдера:

```bash
node src/connect-9router.js
```

По умолчанию: `--base http://localhost:20128`, `--password 123456`, `--name "Zhipu BigModel"`, `--prefix zhipu`, `--base-url https://open.bigmodel.cn/api/paas/v4`, `--model glm-4.5-flash`. Модели предоставляются как `zhipu/<model id>` и балансируются между всеми ключами.

> Если китайский маршрут медленный из вашей сети, тот же ключ работает на `https://api.z.ai/api/paas/v4` — измерено, тот же ключ, те же 11 ID.

## 🔌 Подключение к OmniRoute

[OmniRoute](https://omniroute.online) — это самостоятельно размещаемый OpenAI-совместимый роутер. Зарегистрируйте этого провайдера один раз, и каждый ключ в `keys.txt` станет соединением под одним узлом провайдера:

```bash
node src/connect-omniroute.js
```

По умолчанию: `--base http://localhost:20128`, `--password 123456`, `--name "Zhipu BigModel"`, `--prefix zhipu`, `--base-url https://open.bigmodel.cn/api/paas/v4`, `--model glm-4.5-flash`. Модели предоставляются как `zhipu/<model id>` и балансируются между всеми ключами.

> Если китайский маршрут медленный из вашей сети, тот же ключ работает на `https://api.z.ai/api/paas/v4` — измерено, тот же ключ, те же 11 ID.

## 🔑 Что даёт один ключ

| | |
| --- | --- |
| 🏢 Провайдер | **Zhipu BigModel** — [open.bigmodel.cn](https://open.bigmodel.cn) |
| 🎁 Что даёт провайдер | бесплатный тариф GLM на аккаунте с нулевым балансом — китайский канал регистрации работает на уровне протокола, каждый ключ проверен чатом и инструментами |
| 🔑 Что даёт один ключ | один API-ключ, привязанный к своему аккаунту: 11 ID моделей на конечной точке ниже, в пределах лимитов вашего тарифа. Квота привязана к **аккаунту**, именно поэтому этот инструмент создаёт один аккаунт на ключ |
| 🌐 Форма API | OpenAI-совместимая: `POST https://open.bigmodel.cn/api/paas/v4/chat/completions` |
| 🔒 Ваши данные | связь только с open.bigmodel.cn и настроенным вами бэкендом почтового ящика; ключи остаются на вашей машине |

## 🐞 Проблемы

* **Бесплатные ID невидимы для `/models`.** `GET /models` возвращает только 11 платных ID; `glm-4.5-flash` / `glm-4.7-flash` / `glm-4.6v-flash` документированы в `models/free/` и никогда не появляются в этом списке — не воспринимайте это как «у ключа ничего нет».
* **На этой панели нет `/api/pricing`.** `/api/pricing`, `/api/paas/v4/pricing`, `/api/biz/pricing`, `/api/paas/pricing`, `/api/product/pricing` — все **404** — единственная действенная ценовая поверхность — это страница цен SPA плюс документация, поэтому доказательство бесплатного тарифа здесь — «баланс 0 × бесплатная модель 200» + официальная страница `免费`, а не таблица соотношений панели.
* **Ответ платных моделей — не доказательство бесплатного тарифа.** Свежесозданный китайский аккаунт сейчас возвращает 200 для `glm-4.5-air`, `glm-5-turbo` и `glm-4.6`, пока его запись расходов остаётся `0E-9` (`out/13-cn-lane-key-paid-models-note.txt`) — это льготный период для нового аккаунта. На старом ключе те же модели отвечают `429/1113`. Только 200 от `glm-4.5-flash` / `glm-4.7-flash` — долговечное доказательство бесплатного тарифа.
* **У `glm-4.5-flash` есть уведомление о выводе из эксплуатации** (2026-01-30, запросы перенаправляются на `glm-4.7-flash`). Если она перестанет отвечать, переключите `--model` и проверку на `glm-4.7-flash` (200 на обоих аккаунтах).
* **Свежесть тикета.** Тикет TCaptcha одноразовый и недолговечный: решайте, отправляйте код и входите подряд, либо решайте заново. Request id на конечной точке кода обязателен.

Если Zhipu изменит appid капчи, конечную точку кода или форму входа, инструмент остановится на этом шаге и выведет статус и тело, которые увидел. **[Откройте issue](../../issues)** с командой и точным выводом; PR приветствуются.

## 📄 Лицензия

MIT © 2026 — см. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 zhipu-bulk-apikey contributors

</div>
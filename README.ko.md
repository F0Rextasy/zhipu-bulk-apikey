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

**API 키와 함께 BigModel(Zhipu) 계정을 대량 생성 — 등록 체인은 순수 HTTP(TCaptcha 티켓 + 이메일 코드), OpenAI 호환 GLM 추론, 그리고 9Router 커넥터를 포함합니다.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-11%20served-412991?style=for-the-badge)](https://docs.bigmodel.cn/cn/guide/models/free/glm-4.5-flash)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 빠른 시작](#-quick-start) · [🎁 무료 티어](#-free-tier--how-much-you-get) · [🤖 모델](#-models--all-11-of-them) · [🧪 API 사용하기](#-how-to-use-the-api) · [✅ 검증됨](#-verified-working--every-key-is-tested) · [🧭 작동 방식](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ 옵션](#️-cli-options) · [🛰️ 프록시](#️-behind-a-proxy) · [🐞 이슈](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 이 도구가 존재하는 이유

BigModel(`open.bigmodel.cn`, Zhipu의 중국 플랫폼)은 GLM 제품군을 **OpenAI 호환** `…/api/paas/v4` 엔드포인트로 제공하며, 무료 티어는 실제로 존재합니다: `glm-4.5-flash`, `glm-4.7-flash`, `glm-4.6v-flash`는 콘솔 잔액이 **0**으로 표시되는 계정에서도 실시간 채팅에 응답합니다. 흥미로운 부분은 진입 경로입니다: 중국 등록 체인(TCaptcha → 이메일 코드 → 로그인)은 **완전히 프로토콜 측에서** 이루어지므로 — 흐름 자체에는 브라우저가 필요하지 않습니다 — 명령 하나로 새 받은편지함 주소를 계정, 프로젝트 키, 검증된 `keys.txt` 한 줄로 바꿉니다. 할당량은 **계정**에 있기 때문에, 이 도구는 **키당 하나의 계정**을 생성하며, 각 계정은 서로 다른 두 개의 프롬프트와 실제 `get_time` 도구 호출을 통과해야 기록됩니다.

## 🎁 무료 티어 — 얼마나 받을 수 있나

| 항목 | 값 |
| --- | --- |
| 무료 모델 id | **`glm-4.5-flash`**, **`glm-4.7-flash`**, **`glm-4.6v-flash`** — 문서화된 `models/free/` 세트 (`glm-4.5-flash`: "完全免费开放使用"); 세 모델 모두 이 계정에서 응답함 |
| 계정 잔액 | **0** — 콘솔 보고 `balance 0 · giveAmount 0 · recharge 0 · creditStatus NOT_OPEN` (`providers/zhipu/out/12-cn-account-balance-zero.txt`) |
| 해당 계정의 유료 모델 | `glm-4.5-air`, `glm-5-turbo`, `glm-5.3-flash` → `429 {"code":"1113","message":"余额不足或无可用资源包,请充值。"}` — 따라서 200 응답은 크레딧으로 설명되지 않습니다: 무료 모델은 정말로 무료입니다 |
| 가입 비용 | 없음 — **카드도, SMS도 없음**: 이메일 코드만; 계정은 `acType: NOT_AC`(실명인증 없음)를 가지며 API는 여전히 작동합니다 |
| 계정 하나가 받는 것 | 자체 조직 + 기본 프로젝트, 그리고 그 위에 발급된 키 (`POST …/organization/<oid>/projects/<pid>/api_keys`) |
| 속도 제한 | `glm-4.6v-flash`는 대부분 `1305 该模型当前访问量过大`(혼잡, 재시도) 응답; `glm-4.7-flash`는 두 번째 시도에서 통과 |
| 키 형태 | 49자, 콘솔의 `<apiKey>.<secretKey>` 쌍을 점으로 연결 |
| 게이트 | 서로 **다른** 두 개의 프롬프트, 둘 다 200이고 비어 있지 않으며 서로 다름, 그리고 `get_time` 도구 호출 |

> 💡 무료 티어는 Zhipu BigModel이 설정하며 변경될 수 있습니다. 실시간 수치는 [open.bigmodel.cn](https://open.bigmodel.cn)에서 확인하세요 — 그리고 도구 자체의 게이트가 판단하게 하세요:

```bash
node src/cli.js --verify-only     # keys.txt의 모든 키를 실제 채팅 호출로 재검증
```

## 🤖 모델 — 11개 전부

새 키로 `GET /api/paas/v4/models`를 호출하면 **11개의 id**가 응답됩니다 — 이것이 배지에 있는 숫자입니다 (`providers/zhipu/out/01-models.json`):

| 모델 ID | 비고 |
| --- | --- |
| `glm-4.5`, `glm-4.5-air` | 4.5 세대 (`-air`는 저렴한 유료 등급) |
| `glm-4.6`, `glm-4.7` | 4.6 / 4.7 세대 |
| `glm-5`, `glm-5-turbo` | 5 세대 |
| `glm-5.1`, `glm-5.2`, `glm-5.3` | 5.x 세대 |
| `glm-5.3-flash`, `glm-5.3-flashx` | flash 변형 |

**무료 id는 그 목록에 없습니다** — 이들은 `models/free/` 아래에 별도로 문서화되어 있으며 이 계정에서 실시간으로 검증되었습니다: `glm-4.5-flash` (**도구의 게이트 모델**: 실제 콘텐츠와 함께 200), `glm-4.7-flash` (200, `"OK"`), `glm-4.6v-flash` (도달 가능, 대개 혼잡). 잔액이 0인 계정에서 유료 id는 계정이 충전될 때까지 `1113`을 응답하며, 이것이 바로 도구가 `glm-4.5-flash`로 게이트하는 이유입니다.

동일한 키가 `api.z.ai/api/paas/v4`에서 **완전히 동일한 11개의 id**로 응답합니다 — BigModel과 Z.AI는 하나의 키 공간을 공유하므로, 라우터는 어느 호스트든 가리킬 수 있습니다.

## 🧪 API 사용 방법

기본 URL은 **`https://open.bigmodel.cn/api/paas/v4`** 입니다 — OpenAI 호환이므로 OpenAI를 지원하는 모든 것(SDK, Cursor, OpenCode, Kilo Code, …)이 작동합니다.

```bash
curl https://open.bigmodel.cn/api/paas/v4/chat/completions \
  -H "Authorization: Bearer <apiKey>.<secretKey>" \
  -H 'Content-Type: application/json' \
  -d '{"model":"glm-4.5-flash","messages":[{"role":"user","content":"say ok"}],"max_tokens":1024}'
```

주의해야 할 두 가지:

* 키는 콘솔의 **`<apiKey>.<secretKey>`** 쌍입니다 — 두 부분 모두 점으로 연결하여 `Authorization: Bearer` 헤더에 넣어야 합니다 (맨 `apiKey`만으로는 충분하지 않음);
* `glm-4.5-flash`는 **추론** 모델(기본적으로 사고 켜짐)이며 사고가 토큰 예산을 소모합니다 — `tool_calls` 응답을 받으려면 `max_tokens ≥ 1024`를 사용하세요 (`256`이면 호출이 때때로 조용히 비어 있음; `providers/zhipu/out/09-tools-check.txt`에서 측정됨).

## 🛠 빠른 시작

```bash
cd zhipu-bulk-apikey

# 1) 선택 사항: 사용할 출구 풀, 한 줄에 하나
printf 'http://host:port\n' > proxies.txt

# 2) 반복마다 계정 하나(키 하나)를 발급. TCaptcha 티켓은 {ticket,randstr}를

#    출력하는 아무 솔버에서나 얻을 수 있음 — 이 플릿은 captcha-kit을 사용:
node src/cli.js --count 1 --pool proxies.txt \
  --token-cmd "node ../proxy-lab/captcha-kit.js --kind tencent-http --appid 196026326 --url https://open.bigmodel.cn/register --exit {exit} --out {tmp}/kit" \
  --token-file "{tmp}/kit/tencent-http.json"

# 3) 이후 언제든지
node src/cli.js --verify-only     # keys.txt의 모든 키를 실제 채팅 + 도구 호출로 재검증
node src/cli.js --screen          # BigModel에 대해 풀 출구를 프로브
node src/launcher.js              # 대화형 메뉴 (발급 / 검증 / 스크린 / 9Router)
```

### 계정은 어디서 오는가

브라우저도, 비밀번호도 없습니다: CLI는 메일박스 레일에서 새 주소를 요청하고, 패널의 **Tencent TCaptcha**(appid `196026326`, `static.bigmodel.cn/wd-paas-front`에서 읽음)를 `--token-cmd`를 통해 해결하고, `POST /api/biz/code/emailCode/TencentVerifyCaptcha`로 코드를 전송하고, 패널이 자체 알림 주소(`notifications [at] account.bigmodel.cn`)에서 보낸 6자리 코드를 읽고, `POST /api/auth/login`을 전송합니다 — `newUserFlag:"YES"`는 계정이 즉석에서 생성되었음을 의미합니다. 그런 다음 `GET /api/biz/customer/getCustomerInfo`에서 기본 조직/프로젝트를 선택하고 키를 발급합니다. 전체 플래그 목록은 `node src/cli.js --help`를 실행하세요.

### 🖱️ 런처

`src/launcher.js`(이 README와 동일한 배너)는 개수, 프록시 목록 파일, 검증 모델을 묻고, 이를 `launcher.config.json`에 기억하고, 올바른 플래그로 CLI를 실행합니다 — 그런 다음 9Router와 OmniRoute 커넥터를 제공합니다. `src/connect-9router.js`는 `zhipu` 접두사 아래에 `glm-4.5-flash`를 기본 모델로 하여 프로바이더를 등록합니다.

## 🚀 명령 하나로

캡차는 자동으로 해결됩니다 — 명령 하나로 N개의 계정을 발급하고 실제 채팅 호출이 검증한 키만 보관합니다:

```bash
npm install                  # 한 번: puppeteer-core를 가져옴
npm start                    # 메뉴 → "1) Mint keys" → "How many keys?" (Enter = 10)
# 또는 비대화형:
node src/cli.js --count N
```

`--auto`가 기본이며 아무것도 전달할 필요가 없습니다: 내장된 `src/solver.js`가 계정 자체의 출구를 통해 헤드리스 Chrome을 열고 패널의 Turnstile 토큰을 자동으로 반환합니다. `--dry`는 해석된 계획을 출력하고 **파일 작성도 네트워크 호출도 없이** 종료합니다.

> ⚠️ **약관 및 계정 위험.** 이것은 자동화 도구이지 계정 판매자가 아닙니다. 대량 가입과 키 발급은 전적으로 귀하의 책임입니다: 프로바이더의 서비스 약관을 위반할 수 있으며 주소, 출구 또는 계정이 차단될 수 있습니다. 자동화가 허용된 인프라에서만 사용하고 요청 속도를 낮게 유지하세요.

## 🔧 고급 (선택 사항)

자체 솔버 연결, 토큰 수동 붙여넣기, 특정 Chrome 지정은 **[ADVANCED.md](ADVANCED.md)**에 문서화되어 있습니다. 일반적인 경로에는 이 중 어느 것도 필요하지 않습니다.

## ✅ 검증됨 — 모든 키가 테스트됨

모두 2026-10-22에 두 개의 실제 키(`providers/zhipu/keys.txt`, 2줄 — z.ai 계정 키와 같은 날 중국 레일을 통해 발급된 키)로 측정되었습니다:

| 검사 | 결과 |
| --- | --- |
| **가짜** 키로 `GET /api/paas/v4/models` | **401** `1000 身份验证失败` — 인증 검사는 실제임 |
| 레인 키로 `GET /api/paas/v4/models` | **200**, 위의 11개 id |
| `POST /chat/completions` `glm-4.5-flash`, 프롬프트 A (프라임) | **200** — `content:"101,103,107"`, `reasoning_content` 946 → 3432자 |
| 같은 모델, 프롬프트 B (터키어 문장) | **200** — `content:"Deniz mavidir."` ⇒ 둘 다 비어 있지 않고 **다름** (정상성 ✓) |
| `glm-4.7-flash` (사고 끔) | 첫 시도 `1305 该模型当前访问量过大` → 재시도 **200** `"OK"` |
| `glm-4.6v-flash` | `1305` (모델 존재, 혼잡) — 재시도 가능 클래스 |
| 유료 id (`glm-4.5-air`, `glm-5-turbo`, `glm-5.3-flash`) | 잔액 0인 계정에서 `429 1113 余额不足或无可用资源包,请充值。` ⇒ 무료 모델의 200은 크레딧이 아님 |
| `GET api.z.ai/api/paas/v4/models` — **동일한 키** | **200**, 바이트 단위로 동일한 11개 id (양방향) |
| 도구 | `get_time` `tool_calls` **200**, `max_tokens ≥ 1024` (`out/09-tools-check.txt`) |
| 교차 출구 | 두 번의 스크린에 걸친 **8개의 실제 출구** 모두 동일한 키로 **200** 응답 ⇒ 키는 IP에 묶이지 않음; 15개 출구 재스캔도 모든 곳에서 200 응답 |
| `preadd-gate --model glm-4.5-flash` | sanity=true · tools=get_time ✓ · 2842 ms; 새 출구 재실행 9139 ms; 중국 레일 키 6816 ms 및 300초 재검증 7373 ms |
| 중국 등록 레일 | 순수 HTTP로 TCaptcha 티켓 해결 (27초, 1회 시도) → 코드 전송 → mailtrap 코드 → `newUserFlag:"YES"` → 조직/프로젝트 → `apiKey.secretKey`; 발급된 키는 그 후 위의 전체 게이트를 통과 |

증거: `providers/zhipu/out/verify-20261022063844.{txt,json}`, `verify-20261022073006.{txt,json}`, `01-models.json` + `.headers.txt`, `02-chat-p1.json`, `02-chat-p2.json`, `03-chat-p1-full.json` (및 해당 헤더), `04-cn-signup-gate.txt`, `07-exit-portability.txt`, `08-exit-rescan.txt`, `09-tools-check.txt`, `10-cn-tcaptcha-crack.txt`, `11-cn-lane-key-cross-exit.txt`, `12-cn-account-balance-zero.txt`, `13-cn-lane-key-paid-models-note.txt`; 게이트 실행 `proxy-lab/out/preadd-zhipu-1792651196.jsonl`, `preadd-zhipu-refresh.jsonl`, `preadd-zhipu-cn-1792654779.jsonl`; 전체 체인은 `proxy-lab/zhipu-verify.js`로 재실행 가능.

> **품질 게이트.** 여기의 모든 키는 `keys.txt`에 기록되기 전에 실제 `chat-200`을 통과했습니다
> (죽은 키는 절대 배포되지 않음). 라우터 조합은 모델 수준에서도 같은 규칙을 따릅니다: 항목은
> **모델이 `chat-200`에 응답하고 도구를 호출할 수 있는 경우에만** 추가됩니다 — 도구 지원이 없는 모델,
> 죽은 키 또는 죽은 프로바이더는 추가되지 않고 제거됩니다. 언제든지 검증 단계를 재실행하세요;
> 실패는 보고되며 절대 숨겨지지 않습니다.

## 🧭 작동 방식

```
받은편지함 (계정당 하나의 주소)                                  계정당 새 주소
   │
   ├─▶ 가입: Zhipu BigModel 페이지 → 이메일 주소 → 받은편지함의 코드 / 링크
   ├─▶ 세션: 계정의 쿠키 또는 액세스 토큰 확보
   ├─▶ 키 발급: 계정의 키 엔드포인트 → 평문 키가 한 번 반환됨 (즉시 디스크에 기록)
   └─▶ 실시간 증명: POST https://open.bigmodel.cn/api/paas/v4/chat/completions → 실제 콘텐츠 = 키가 살아 있음
```

계정당, 모두 풀의 하나의 출구를 통해:

1. **메일박스** — 설정된 레일(`--mail emailnator | broker | temptf`)에서 새 받은편지함 주소; 패널의 코드는 자체 알림 주소(`notifications [at] account.bigmodel.cn`)에서 제목 `你的Zhipu验证码: <6 digits>`로 도착합니다.
2. **캡차** — appid `196026326`에 대한 Tencent TCaptcha `{ticket,randstr}`. `--token-cmd`를 전달하세요; 솔버는 JSON을 stdout에 출력하거나 `--token-file`에 쓸 수 있습니다 (`{tmp}`는 치환됨). 순수 HTTP가 작동합니다: 플릿의 `captcha-kit --kind tencent-http`가 첫 시도에서 27초 만에 해결했습니다.
3. **코드 전송** — `POST /api/biz/code/emailCode/TencentVerifyCaptcha {deviceToken,email,typeCode:"login",ticket,randstr}` → `验证码已发送，请查收邮件`. 오래된 티켓이나 누락된 요청 id는 거부됩니다 (`out/04-cn-signup-gate.txt`에서 프로브됨).
4. **코드 읽기** — 받은편지함에서 6자리.
5. **세션** — `POST /api/auth/login {email,emailCode,loginType:"email",grantType:"customer",userType:"PERSONAL"}`; `newUserFlag:"YES"`는 계정이 바로 거기서 생성되었음을 의미 — **비밀번호 단계 없음**.
6. **조직/프로젝트** — `GET /api/biz/customer/getCustomerInfo` → `organizations[0]` / `projects[0]`, 콘솔이 사용하는 기본 쌍.
7. **키** — `POST /api/biz/v1/organization/<oid>/projects/<pid>/api_keys {name}` → `data.apiKey` + `data.secretKey`; 점으로 연결한 것이 키입니다.
8. **게이트** — 무료 모델에 대한 서로 다른 두 프롬프트 (둘 다 200, 비어 있지 않음, 다름) **그리고** `max_tokens ≥ 1024`인 `get_time` 도구 호출. 그런 다음에야 키가 `keys.txt`에 추가됩니다.

## ⚙️ CLI 옵션

```bash
node src/cli.js --count 5 --token-cmd "<solver>"   # 발급
node src/cli.js --verify-only                      # keys.txt의 모든 키 재검사
node src/cli.js --screen                           # BigModel에 대해 프록시 목록 테스트
node src/cli.js --help
```

| 플래그 | 의미 |
| --- | --- |
| `--count N` | 발급할 계정(= 키) 수 (기본 `5`) |
| `--conc N` | 동시에 진행 중인 계정 수, 최대 `8` (기본 `1`) |
| `--gap MS` | 계정 간 일시 정지 (기본 `1200`) |
| `--model <id>` | 실시간 게이트에 사용되는 무료 모델 (기본 `glm-4.5-flash`) |
| `--token-cmd CMD` | TCaptcha 솔버 명령; 플레이스홀더 `{exit}`, `{url}`, `{tmp}` — **발급에 필수** |
| `--token-file F` | 솔버가 티켓 JSON을 출력하지 않을 때 쓰는 파일 |
| `--appid ID` | 솔버에 전달되는 TCaptcha appid (기본 `196026326`) |
| `--mail <rail>` | `emailnator` · `broker` · `temptf` (기본 `emailnator`) |
| `--pool <file>` | 프록시 목록, 한 줄에 하나의 출구 (또는 환경 변수 `ZHIPU_PROXIES`) — 선택 사항 |
| `--exits N` | 포기하기 전 계정당 시도하는 출구 수 (기본 `6`) |
| `--timeout MS` | 요청당 타임아웃 (기본 `60000`) |
| `--verify-only` | `keys.txt`의 모든 키를 게이트를 통해 재실행 |
| `--screen` | BigModel에 대해 프록시 목록만 테스트 |

## 🛰️ 프록시 뒤에서

**선택 사항 — 대규모에서는 권장.** `--pool <file>`을 전달하거나(또는 `ZHIPU_PROXIES` 설정) 모든 요청이 해당 목록의 출구를 통해 가도록 합니다 (`http://host:port`, `socks5://host:port`, `host:port`, `user:pass@host:port`); 풀이 없으면 CLI는 `running WITHOUT a proxy (direct)`를 출력하고 직접 연결합니다.

* 키는 **출구에 묶이지 않습니다**: 두 번의 스크린의 8개 실제 출구와 15개 출구 재스캔 모두 동일한 키로 200을 반환했습니다 (`out/07-exit-portability.txt`, `out/08-exit-rescan.txt`, `out/11-cn-lane-key-cross-exit.txt`);
* **포화된** 출구는 죽은 키가 아닙니다 — `--reverify`는 소진된 줄에 `dead 0ms`를 찍을 수 있지만 동일한 키가 새 출구에서는 200을 응답합니다; 실제 목록에서 출구를 선택하세요;
* 이 박스에서는 WARP가 **사용되지 않습니다** (운영자의 원격 액세스를 차단했기 때문), 따라서 하네스는 풀 출구를 명시적으로 사용합니다.

## 📄 파일

| 경로 | 내용 |
| --- | --- |
| `keys.txt` | 한 줄에 하나의 실제 검증된 `<apiKey>.<secretKey>` — git 무시됨 |
| `proxies.txt` | 사용자의 출구, 한 줄에 하나 — git 무시됨 |
| `accounts.json` | 계정 ↔ 키 ↔ 게이트 기록 — git 무시됨 |
| `out/` | CLI가 작성하는 실행별 원시 자료 (모델 응답, 채팅 본문, 로그) — git 무시됨 |
| `launcher.config.json` | 기억된 런처 설정 — git 무시됨 |

그 외에는 아무것도 작성되지 않습니다: 세션 토큰, TCaptcha 티켓, 메일박스 비밀번호는 디스크에 저장되지 않습니다.

## 🔌 9Router에 연결

[9Router](https://9router.com)는 자체 호스팅, OpenAI 호환 라우터입니다. 이 프로바이더를 한 번 등록하면 `keys.txt`의 모든 키가 하나의 프로바이더 노드 아래 연결이 됩니다:

```bash
node src/connect-9router.js
```

기본값: `--base http://localhost:20128`, `--password 123456`, `--name "Zhipu BigModel"`, `--prefix zhipu`, `--base-url https://open.bigmodel.cn/api/paas/v4`, `--model glm-4.5-flash`. 모델은 `zhipu/<model id>`로 제공되며 모든 키에 걸쳐 로드 밸런싱됩니다.

> 네트워크에서 중국 경로가 느리다면, 동일한 키가 `https://api.z.ai/api/paas/v4`에서 작동합니다 — 측정됨, 동일한 키, 동일한 11개 id.

## 🔌 OmniRoute에 연결

[OmniRoute](https://omniroute.online)는 자체 호스팅, OpenAI 호환 라우터입니다. 이 프로바이더를 한 번 등록하면 `keys.txt`의 모든 키가 하나의 프로바이더 노드 아래 연결이 됩니다:

```bash
node src/connect-omniroute.js
```

기본값: `--base http://localhost:20128`, `--password 123456`, `--name "Zhipu BigModel"`, `--prefix zhipu`, `--base-url https://open.bigmodel.cn/api/paas/v4`, `--model glm-4.5-flash`. 모델은 `zhipu/<model id>`로 제공되며 모든 키에 걸쳐 로드 밸런싱됩니다.

> 네트워크에서 중국 경로가 느리다면, 동일한 키가 `https://api.z.ai/api/paas/v4`에서 작동합니다 — 측정됨, 동일한 키, 동일한 11개 id.

## 🔑 키 하나로 얻는 것

| | |
| --- | --- |
| 🏢 프로바이더 | **Zhipu BigModel** — [open.bigmodel.cn](https://open.bigmodel.cn) |
| 🎁 프로바이더가 제공하는 것 | 잔액 0인 계정의 GLM 무료 티어 — 중국 가입 레일은 프로토콜 측에서 실행되며, 모든 키는 채팅 및 도구 검증됨 |
| 🔑 키 하나로 얻는 것 | 자체 계정에 범위가 지정된 하나의 API 키: 아래 엔드포인트의 11개 모델 id, 사용자 플랜의 한도 내에서. 할당량은 **계정**에 있으므로, 이 도구가 키당 하나의 계정을 생성하는 것입니다 |
| 🌐 API 형태 | OpenAI 호환: `POST https://open.bigmodel.cn/api/paas/v4/chat/completions` |
| 🔒 데이터 | open.bigmodel.cn과 설정한 받은편지함 백엔드만 접촉됩니다; 키는 사용자 머신에 남습니다 |

## 🐞 이슈

* **무료 id는 `/models`에 보이지 않습니다.** `GET /models`는 11개의 유료 id만 반환합니다; `glm-4.5-flash` / `glm-4.7-flash` / `glm-4.6v-flash`는 `models/free/` 아래에 문서화되어 있으며 그 목록에 절대 나타나지 않습니다 — 이를 "키에 아무것도 없다"로 읽지 마세요.
* **이 패널에는 `/api/pricing`이 없습니다.** `/api/pricing`, `/api/paas/v4/pricing`, `/api/biz/pricing`, `/api/paas/pricing`, `/api/product/pricing`은 모두 **404**입니다 — 유일하게 실행 가능한 가격 표면은 SPA 가격 페이지와 문서이므로, 여기서 무료 티어 증명은 "잔액 0 × 무료 모델 200" + 공식 `免费` 페이지이며, 결코 패널 비율 표가 아닙니다.
* **유료 모델의 응답은 무료 티어 증명이 아닙니다.** 새로 생성된 중국 계정은 현재 `glm-4.5-air`, `glm-5-turbo`, `glm-4.6`에 대해 200을 반환하면서 지출 기록은 `0E-9`로 유지됩니다 (`out/13-cn-lane-key-paid-models-note.txt`) — 신규 계정 유예입니다. 오래된 키에서는 동일한 모델이 `429/1113`을 응답합니다. `glm-4.5-flash` / `glm-4.7-flash`의 200만이 지속적인 무료 티어 증거입니다.
* **`glm-4.5-flash`에는 퇴역 안내가 있습니다** (2026-01-30, 요청은 `glm-4.7-flash`로 유도됨). 응답이 중단되면 `--model`과 게이트를 `glm-4.7-flash`로 전환하세요 (두 계정 모두에서 200).
* **티켓 신선도.** TCaptcha 티켓은 일회용이며 수명이 짧습니다: 해결하고, 코드를 전송하고, 연속으로 로그인하거나, 다시 해결하세요. 코드 엔드포인트에서는 요청 id가 필수입니다.

Zhipu가 캡차 appid, 코드 엔드포인트 또는 로그인 형태를 변경하면, 도구는 해당 단계에서 중지하고 본 상태와 본문을 출력합니다. 명령과 정확한 출력을 포함하여 **[이슈를 열어주세요](../../issues)**; PR을 환영합니다.

## 📄 라이선스

MIT © 2026 — [LICENSE](LICENSE) 참조.

<div align="center">

**[MIT](LICENSE)** © 2026 zhipu-bulk-apikey contributors

</div>
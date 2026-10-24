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

**Crea cuentas de BigModel (Zhipu) en masa con claves API — la cadena de registro es HTTP puro (ticket de TCaptcha + código de correo electrónico), inferencia GLM compatible con OpenAI, más un conector 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-11%20served-412991?style=for-the-badge)](https://docs.bigmodel.cn/cn/guide/models/free/glm-4.5-flash)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Inicio rápido](#-quick-start) · [🎁 Nivel gratuito](#-free-tier--how-much-you-get) · [🤖 Modelos](#-models--all-11-of-them) · [🧪 Usar la API](#-how-to-use-the-api) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Cómo funciona](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Opciones](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Por qué existe esto

BigModel (`open.bigmodel.cn`, la plataforma CN de Zhipu) sirve la familia GLM a través de un endpoint `…/api/paas/v4` **compatible con OpenAI**, y su nivel gratuito es real: `glm-4.5-flash`, `glm-4.7-flash` y `glm-4.6v-flash` responden chats en vivo en una cuenta cuyo saldo en la consola marca **0**. La parte interesante es la puerta: la cadena de registro CN (TCaptcha → código de correo → inicio de sesión) es **totalmente del lado del protocolo** — no se necesita un navegador para el flujo en sí — así que un solo comando convierte una dirección de bandeja de entrada nueva en una cuenta, una clave de proyecto y una línea verificada en `keys.txt`. Como la cuota vive en la **cuenta**, la herramienta crea **una cuenta por clave**, cada una validada por dos prompts diferentes y una llamada real a la herramienta `get_time` antes de ser registrada.

## 🎁 Nivel gratuito — cuánto obtienes

| Qué | Valor |
| --- | --- |
| IDs de modelos gratuitos | **`glm-4.5-flash`**, **`glm-4.7-flash`**, **`glm-4.6v-flash`** — el conjunto documentado en `models/free/` (`glm-4.5-flash`: "完全免费开放使用"); los tres responden en esta cuenta |
| Saldo de la cuenta | **0** — informe de consola `balance 0 · giveAmount 0 · recharge 0 · creditStatus NOT_OPEN` (`providers/zhipu/out/12-cn-account-balance-zero.txt`) |
| Modelos de pago en esa cuenta | `glm-4.5-air`, `glm-5-turbo`, `glm-5.3-flash` → `429 {"code":"1113","message":"余额不足或无可用资源包,请充值。"}` — así que un 200 *no* se explica por el crédito: los modelos gratuitos realmente son gratuitos |
| Coste de registro | ninguno — **sin tarjeta, sin SMS**: solo código de correo; la cuenta lleva `acType: NOT_AC` (sin 实名认证) y la API sigue funcionando |
| Qué obtiene una cuenta | su propia organización + proyecto predeterminado, y una clave creada en ella (`POST …/organization/<oid>/projects/<pid>/api_keys`) |
| Límite de velocidad | `glm-4.6v-flash` responde mayormente `1305 该模型当前访问量过大` (ocupado, reintentar); `glm-4.7-flash` se resolvió en el segundo intento |
| Forma de la clave | 49 caracteres, el par de consola `<apiKey>.<secretKey>` unido con un punto |
| La validación | dos prompts **diferentes**, ambos 200 y no vacíos y diferentes, más una llamada a la herramienta `get_time` |

> 💡 El nivel gratuito lo define Zhipu BigModel y puede cambiar. Consulta los números en vivo en [open.bigmodel.cn](https://open.bigmodel.cn) — y deja que la propia validación de la herramienta decida:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — los 11

`GET /api/paas/v4/models` con una clave nueva responde **11 ids** — ese es el número del badge (`providers/zhipu/out/01-models.json`):

| ID del modelo | Notas |
| --- | --- |
| `glm-4.5`, `glm-4.5-air` | generación 4.5 (`-air` es el nivel de pago económico) |
| `glm-4.6`, `glm-4.7` | generación 4.6 / 4.7 |
| `glm-5`, `glm-5-turbo` | generación 5 |
| `glm-5.1`, `glm-5.2`, `glm-5.3` | generación 5.x |
| `glm-5.3-flash`, `glm-5.3-flashx` | variantes flash |

**Los ids gratuitos no están en esa lista** — se documentan por separado en `models/free/` y se verifican en vivo en esta cuenta: `glm-4.5-flash` (**el modelo de validación de la herramienta**: 200 con contenido real), `glm-4.7-flash` (200, `"OK"`), `glm-4.6v-flash` (accesible, normalmente ocupado). Un id de pago en una cuenta con saldo cero responde `1113` hasta que se recargue la cuenta, que es exactamente por lo que la herramienta valida con `glm-4.5-flash`.

La misma clave responde en `api.z.ai/api/paas/v4` con **los mismos 11 ids** — BigModel y Z.AI comparten un espacio de claves, así que el router puede apuntar a cualquiera de los dos hosts.

## 🧪 Cómo usar la API

La URL base es **`https://open.bigmodel.cn/api/paas/v4`** — compatible con OpenAI, así que cualquier cosa que hable OpenAI funciona (SDKs, Cursor, OpenCode, Kilo Code, …).

```bash
curl https://open.bigmodel.cn/api/paas/v4/chat/completions \
  -H "Authorization: Bearer <apiKey>.<secretKey>" \
  -H 'Content-Type: application/json' \
  -d '{"model":"glm-4.5-flash","messages":[{"role":"user","content":"say ok"}],"max_tokens":1024}'
```

Dos cosas que muerden:

* la clave es el par **`<apiKey>.<secretKey>`** de la consola — ambas mitades, unidas con un punto, van en el encabezado `Authorization: Bearer` (el `apiKey` solo no es suficiente);
* `glm-4.5-flash` es un modelo de **razonamiento** (pensamiento activado por defecto) y el pensamiento consume el presupuesto de tokens — para una respuesta de `tool_calls` usa `max_tokens ≥ 1024` (con `256` la llamada a veces queda silenciosamente vacía; medido en `providers/zhipu/out/09-tools-check.txt`).

## 🛠 Inicio rápido

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

### De dónde viene la cuenta

Sin navegador, sin contraseña: el CLI pide a su riel de correo una dirección nueva, resuelve el **Tencent TCaptcha** del panel (appid `196026326`, leído de `static.bigmodel.cn/wd-paas-front`) mediante `--token-cmd`, envía el código con `POST /api/biz/code/emailCode/TencentVerifyCaptcha`, lee el código de 6 dígitos que el panel envía desde su propia dirección de notificación (`notifications [at] account.bigmodel.cn`), y publica `POST /api/auth/login` — `newUserFlag:"YES"` significa que la cuenta se creó en el momento. Luego elige la organización/proyecto predeterminados de `GET /api/biz/customer/getCustomerInfo` y crea la clave. Ejecuta `node src/cli.js --help` para la lista completa de opciones.

### 🖱️ El lanzador

`src/launcher.js` (mismo banner que este README) pregunta por la cantidad, el archivo de lista de proxies y el modelo de verificación, los recuerda en `launcher.config.json`, y ejecuta el CLI con las opciones correctas — luego ofrece los conectores 9Router y OmniRoute. `src/connect-9router.js` registra el proveedor bajo el prefijo `zhipu` con `glm-4.5-flash` como modelo predeterminado.

## 🚀 Un solo comando

El captcha se resuelve por ti — un solo comando crea N cuentas y conserva solo las claves que una llamada de chat en vivo verificó:

```bash
npm install                  # once: pulls puppeteer-core
npm start                    # menu → "1) Mint keys" → "How many keys?" (Enter = 10)
# or non-interactive:
node src/cli.js --count N
```

`--auto` es el valor predeterminado y no hay que pasar nada: el `src/solver.js` integrado abre un Chrome con interfaz sobre la propia salida de la cuenta y devuelve automáticamente el token Turnstile del panel. `--dry` imprime el plan resuelto y sale **sin escribir ningún archivo y sin ninguna llamada de red**.

> ⚠️ **Términos y riesgo de cuenta.** Esta es una herramienta de automatización, no un vendedor de cuentas. Los registros masivos y la creación de claves son enteramente tu responsabilidad: pueden infringir los Términos de Servicio del proveedor y provocar el bloqueo de direcciones, salidas o cuentas. Úsala solo en infraestructura que tengas permitido automatizar, y mantén baja la tasa de solicitudes.

## 🔧 Avanzado (opcional)

Conectar tu propio solucionador, pegar un token a mano o apuntar la herramienta a un Chrome específico se documenta en **[ADVANCED.md](ADVANCED.md)**. La ruta común no necesita nada de eso.

## ✅ Verificado funcionando — cada clave se prueba

Todo medido el 2026-10-22 en dos claves en vivo (`providers/zhipu/keys.txt`, 2 líneas — la clave de la cuenta z.ai y una clave creada a través del riel CN el mismo día):

| Comprobación | Resultado |
| --- | --- |
| `GET /api/paas/v4/models` con una clave **falsa** | **401** `1000 身份验证失败` — la comprobación de autenticación es real |
| `GET /api/paas/v4/models` con una clave del carril | **200**, los 11 ids anteriores |
| `POST /chat/completions` `glm-4.5-flash`, prompt A (primos) | **200** — `content:"101,103,107"`, `reasoning_content` 946 → 3432 caracteres |
| mismo modelo, prompt B (una frase en turco) | **200** — `content:"Deniz mavidir."` ⇒ ambos no vacíos y **diferentes** (sanity ✓) |
| `glm-4.7-flash` (pensamiento desactivado) | primer intento `1305 该模型当前访问量过大` → reintento **200** `"OK"` |
| `glm-4.6v-flash` | `1305` (el modelo existe, ocupado) — clase reintentable |
| ids de pago (`glm-4.5-air`, `glm-5-turbo`, `glm-5.3-flash`) | `429 1113 余额不足或无可用资源包,请充值。` en una cuenta con saldo 0 ⇒ los 200 de los modelos gratuitos no son crédito |
| `GET api.z.ai/api/paas/v4/models` — **la misma clave** | **200**, byte por byte los mismos 11 ids (ambas direcciones) |
| herramientas | `get_time` `tool_calls` **200** con `max_tokens ≥ 1024` (`out/09-tools-check.txt`) |
| salida cruzada | **8 salidas en vivo** en dos pantallas todas respondieron **200** con la misma clave ⇒ la clave no está ligada a IP; un reescaneo de 15 salidas también respondió 200 en todas partes |
| `preadd-gate --model glm-4.5-flash` | sanity=true · tools=get_time ✓ · 2842 ms; una reejecución con salida nueva 9139 ms; la clave del riel CN 6816 ms y una reverificación de 300 s 7373 ms |
| Riel de registro CN | Ticket TCaptcha resuelto en HTTP puro (27 s, 1 intento) → código enviado → código de mailtrap → `newUserFlag:"YES"` → org/proyecto → `apiKey.secretKey`; la clave creada luego pasó la validación completa anterior |

Evidencia: `providers/zhipu/out/verify-20261022063844.{txt,json}`, `verify-20261022073006.{txt,json}`, `01-models.json` + `.headers.txt`, `02-chat-p1.json`, `02-chat-p2.json`, `03-chat-p1-full.json` (y sus encabezados), `04-cn-signup-gate.txt`, `07-exit-portability.txt`, `08-exit-rescan.txt`, `09-tools-check.txt`, `10-cn-tcaptcha-crack.txt`, `11-cn-lane-key-cross-exit.txt`, `12-cn-account-balance-zero.txt`, `13-cn-lane-key-paid-models-note.txt`; ejecuciones de validación `proxy-lab/out/preadd-zhipu-1792651196.jsonl`, `preadd-zhipu-refresh.jsonl`, `preadd-zhipu-cn-1792654779.jsonl`; toda la cadena reejecutable con `proxy-lab/zhipu-verify.js`.

> **Controles de calidad.** Cada clave aquí pasó un `chat-200` en vivo antes de ser escrita en `keys.txt`
> (las claves muertas nunca se entregan). Las combinaciones del router siguen la misma regla a nivel de modelo: una entrada se
> añade **solo si el modelo responde `chat-200` y puede llamar herramientas** — un modelo sin soporte de herramientas,
> una clave muerta o un proveedor muerto se descarta en lugar de añadirse. Vuelve a ejecutar el paso de verificación en cualquier momento;
> los fallos se informan, nunca se ocultan.

## 🧭 Cómo funciona

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Zhipu BigModel page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://open.bigmodel.cn/api/paas/v4/chat/completions → real content = the key is live
```

Por cuenta, todo a través de una salida de tu pool:

1. **buzón** — una dirección de bandeja de entrada nueva del riel configurado (`--mail emailnator | broker | temptf`); el código del panel llega desde su dirección de notificación (`notifications [at] account.bigmodel.cn`) con el asunto `你的Zhipu验证码: <6 digits>`.
2. **captcha** — un `{ticket,randstr}` de Tencent TCaptcha para el appid `196026326`. Pasa `--token-cmd`; el solucionador puede imprimir el JSON en stdout o escribirlo en `--token-file` (`{tmp}` se sustituye). El HTTP puro funciona: el `captcha-kit --kind tencent-http` de la flota lo resolvió en 27 s al primer intento.
3. **enviar el código** — `POST /api/biz/code/emailCode/TencentVerifyCaptcha {deviceToken,email,typeCode:"login",ticket,randstr}` → `验证码已发送，请查收邮件`. Un ticket caducado o un request id ausente se rechaza (probado en `out/04-cn-signup-gate.txt`).
4. **leer el código** — 6 dígitos de la bandeja de entrada.
5. **sesión** — `POST /api/auth/login {email,emailCode,loginType:"email",grantType:"customer",userType:"PERSONAL"}`; `newUserFlag:"YES"` significa que la cuenta se creó ahí mismo — **sin paso de contraseña**.
6. **org/proyecto** — `GET /api/biz/customer/getCustomerInfo` → `organizations[0]` / `projects[0]`, el par predeterminado que usa la consola.
7. **clave** — `POST /api/biz/v1/organization/<oid>/projects/<pid>/api_keys {name}` → `data.apiKey` + `data.secretKey`; unidos con un punto, esa es la clave.
8. **validación** — dos prompts diferentes en el modelo gratuito (ambos 200, no vacíos, diferentes) **y** una llamada a la herramienta `get_time` con `max_tokens ≥ 1024`. Solo entonces se añade la clave a `keys.txt`.

## ⚙️ Opciones del CLI

```bash
node src/cli.js --count 5 --token-cmd "<solver>"   # mint
node src/cli.js --verify-only                      # re-check every key in keys.txt
node src/cli.js --screen                           # test your proxy list against BigModel
node src/cli.js --help
```

| Opción | Significado |
| --- | --- |
| `--count N` | cuentas (= claves) a crear (predeterminado `5`) |
| `--conc N` | cuentas en curso a la vez, máximo `8` (predeterminado `1`) |
| `--gap MS` | pausa entre cuentas (predeterminado `1200`) |
| `--model <id>` | modelo gratuito usado para la validación en vivo (predeterminado `glm-4.5-flash`) |
| `--token-cmd CMD` | comando solucionador de TCaptcha; marcadores `{exit}`, `{url}`, `{tmp}` — **obligatorio para crear** |
| `--token-file F` | archivo donde el solucionador escribe el JSON del ticket, cuando no lo imprime |
| `--appid ID` | appid de TCaptcha entregado al solucionador (predeterminado `196026326`) |
| `--mail <rail>` | `emailnator` · `broker` · `temptf` (predeterminado `emailnator`) |
| `--pool <file>` | lista de proxies, una salida por línea (o variable de entorno `ZHIPU_PROXIES`) — opcional |
| `--exits N` | salidas probadas por cuenta antes de rendirse (predeterminado `6`) |
| `--timeout MS` | tiempo de espera por solicitud (predeterminado `60000`) |
| `--verify-only` | reejecuta cada clave en `keys.txt` a través de la validación |
| `--screen` | solo prueba la lista de proxies contra BigModel |

## 🛰️ Detrás de un proxy

**Opcional — recomendado a escala.** Pasa `--pool <file>` (o define `ZHIPU_PROXIES`) y cada solicitud pasa por una salida de esa lista (`http://host:port`, `socks5://host:port`, `host:port`, `user:pass@host:port`); sin un pool, el CLI imprime `running WITHOUT a proxy (direct)` y se conecta directamente.

* la clave **no está ligada a la salida**: las 8 salidas en vivo de dos pantallas y un reescaneo de 15 salidas devolvieron todas 200 con la misma clave (`out/07-exit-portability.txt`, `out/08-exit-rescan.txt`, `out/11-cn-lane-key-cross-exit.txt`);
* una salida **saturada** no es una clave muerta — `--reverify` puede marcar `dead 0ms` en una línea agotada mientras la misma clave responde 200 desde una nueva; elige salidas de una lista en vivo;
* WARP **no** se usa en esta máquina (cortaba el acceso remoto del operador), así que los arneses toman la salida del pool explícitamente.

## 📄 Archivos

| Ruta | Contenido |
| --- | --- |
| `keys.txt` | una `<apiKey>.<secretKey>` verificada en vivo por línea — ignorada por git |
| `proxies.txt` | tus salidas, una por línea — ignorada por git |
| `accounts.json` | registro cuenta ↔ clave ↔ validación — ignorado por git |
| `out/` | material bruto por ejecución que escribe el CLI (respuesta de modelos, cuerpos de chat, registros) — ignorado por git |
| `launcher.config.json` | ajustes recordados del lanzador — ignorado por git |

No se escribe nada más: ni token de sesión, ni ticket de TCaptcha, ni contraseña de buzón se almacenan en disco.

## 🔌 Conectar con 9Router

[9Router](https://9router.com) es un router autoalojado compatible con OpenAI. Registra este proveedor una vez y cada clave en `keys.txt` se convierte en una conexión bajo un nodo de proveedor:

```bash
node src/connect-9router.js
```

Valores predeterminados: `--base http://localhost:20128`, `--password 123456`, `--name "Zhipu BigModel"`, `--prefix zhipu`, `--base-url https://open.bigmodel.cn/api/paas/v4`, `--model glm-4.5-flash`. Los modelos se sirven como `zhipu/<model id>` y se balancean entre todas las claves.

> Si una ruta CN es lenta desde tu red, la misma clave funciona en `https://api.z.ai/api/paas/v4` — medido, misma clave, mismos 11 ids.

## 🔌 Conectar con OmniRoute

[OmniRoute](https://omniroute.online) es un router autoalojado compatible con OpenAI. Registra este proveedor una vez y cada clave en `keys.txt` se convierte en una conexión bajo un nodo de proveedor:

```bash
node src/connect-omniroute.js
```

Valores predeterminados: `--base http://localhost:20128`, `--password 123456`, `--name "Zhipu BigModel"`, `--prefix zhipu`, `--base-url https://open.bigmodel.cn/api/paas/v4`, `--model glm-4.5-flash`. Los modelos se sirven como `zhipu/<model id>` y se balancean entre todas las claves.

> Si una ruta CN es lenta desde tu red, la misma clave funciona en `https://api.z.ai/api/paas/v4` — medido, misma clave, mismos 11 ids.

## 🔑 Qué te da una clave

| | |
| --- | --- |
| 🏢 Proveedor | **Zhipu BigModel** — [open.bigmodel.cn](https://open.bigmodel.cn) |
| 🎁 Qué da el proveedor | Nivel gratuito de GLM en una cuenta con saldo cero — el riel de registro CN funciona del lado del protocolo, cada clave verificada con chat y herramientas |
| 🔑 Qué te da una clave | una clave API con alcance a su propia cuenta: los 11 ids de modelo en el endpoint de abajo, con los límites de tu plan. La cuota vive en la **cuenta**, que es exactamente por lo que esta herramienta crea una cuenta por clave |
| 🌐 Forma de la API | Compatible con OpenAI: `POST https://open.bigmodel.cn/api/paas/v4/chat/completions` |
| 🔒 Tus datos | solo se contacta con open.bigmodel.cn y el backend de bandeja de entrada que configures; las claves permanecen en tu máquina |

## 🐞 Problemas

* **Los ids gratuitos son invisibles para `/models`.** `GET /models` devuelve solo los 11 ids de pago; `glm-4.5-flash` / `glm-4.7-flash` / `glm-4.6v-flash` se documentan en `models/free/` y nunca aparecen en esa lista — no lo interpretes como "la clave no tiene nada".
* **No hay `/api/pricing` en este panel.** `/api/pricing`, `/api/paas/v4/pricing`, `/api/biz/pricing`, `/api/paas/pricing`, `/api/product/pricing` son todos **404** — la única superficie de precios accionable es la página de precios de la SPA más la documentación, así que la prueba del nivel gratuito aquí es "saldo 0 × modelo gratuito 200" + la página oficial `免费`, nunca una tabla de ratios del panel.
* **Que los modelos de pago respondan no es prueba del nivel gratuito.** Una cuenta CN recién creada actualmente devuelve 200 para `glm-4.5-air`, `glm-5-turbo` y `glm-4.6` mientras su registro de gasto sigue en `0E-9` (`out/13-cn-lane-key-paid-models-note.txt`) — una gracia de cuenta nueva. En la clave más antigua los mismos modelos responden `429/1113`. Solo los 200 de `glm-4.5-flash` / `glm-4.7-flash` son evidencia duradera del nivel gratuito.
* **`glm-4.5-flash` tiene una nota de retirada** (2026-01-30, las solicitudes se dirigen a `glm-4.7-flash`). Si deja de responder, cambia `--model` y la validación a `glm-4.7-flash` (200 en ambas cuentas).
* **Frescura del ticket.** El ticket de TCaptcha es de un solo uso y de vida corta: resuelve, envía el código e inicia sesión seguidos, o vuelve a resolver. Un request id es obligatorio en el endpoint del código.

Si Zhipu cambia el appid del captcha, el endpoint del código o la forma del inicio de sesión, la herramienta se detiene en ese paso e imprime el estado y el cuerpo que vio. **[Abre un issue](../../issues)** con el comando y la salida exacta; los PR son bienvenidos.

## 📄 Licencia

MIT © 2026 — consulta [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 zhipu-bulk-apikey contributors

</div>
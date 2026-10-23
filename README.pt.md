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

**Crie contas BigModel (Zhipu) em massa com chaves de API — a cadeia de registro é HTTP puro (ticket TCaptcha + código por e-mail), inferência GLM compatível com OpenAI, além de um conector 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-11%20served-412991?style=for-the-badge)](https://docs.bigmodel.cn/cn/guide/models/free/glm-4.5-flash)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Início rápido](#-quick-start) · [🎁 Camada gratuita](#-free-tier--how-much-you-get) · [🤖 Modelos](#-models--all-11-of-them) · [🧪 Use a API](#-how-to-use-the-api) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Como funciona](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Opções](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Por que isto existe

O BigModel (`open.bigmodel.cn`, a plataforma CN da Zhipu) serve a família GLM por um endpoint `…/api/paas/v4` **compatível com OpenAI**, e sua camada gratuita é real: `glm-4.5-flash`, `glm-4.7-flash` e `glm-4.6v-flash` respondem a conversas ao vivo em uma conta cujo saldo no console mostra **0**. A parte interessante é a porta: a cadeia de registro CN (TCaptcha → código por e-mail → login) é **totalmente do lado do protocolo** — nenhum navegador é necessário para o fluxo em si — então um único comando transforma um endereço de caixa de entrada novo em uma conta, uma chave de projeto e uma linha verificada em `keys.txt`. Como a cota fica na **conta**, a ferramenta cria **uma conta por chave**, cada uma validada por dois prompts diferentes e uma chamada real de ferramenta `get_time` antes de ser registrada.

## 🎁 Camada gratuita — quanto você recebe

| O quê | Valor |
| --- | --- |
| IDs de modelos gratuitos | **`glm-4.5-flash`**, **`glm-4.7-flash`**, **`glm-4.6v-flash`** — o conjunto documentado em `models/free/` (`glm-4.5-flash`: "完全免费开放使用"); os três respondem nesta conta |
| Saldo da conta | **0** — relatório do console `balance 0 · giveAmount 0 · recharge 0 · creditStatus NOT_OPEN` (`providers/zhipu/out/12-cn-account-balance-zero.txt`) |
| Modelos pagos nessa conta | `glm-4.5-air`, `glm-5-turbo`, `glm-5.3-flash` → `429 {"code":"1113","message":"余额不足或无可用资源包,请充值。"}` — então um 200 *não* é explicado por crédito: os modelos gratuitos realmente são gratuitos |
| Custo de cadastro | nenhum — **sem cartão, sem SMS**: apenas código por e-mail; a conta carrega `acType: NOT_AC` (sem 实名认证) e a API continua funcionando |
| O que uma conta recebe | sua própria org + projeto padrão, e uma chave criada nela (`POST …/organization/<oid>/projects/<pid>/api_keys`) |
| Limite de taxa | `glm-4.6v-flash` geralmente responde `1305 该模型当前访问量过大` (ocupado, tente novamente); `glm-4.7-flash` passou na segunda tentativa |
| Formato da chave | 49 caracteres, o par do console `<apiKey>.<secretKey>` unido por um ponto |
| A validação | dois prompts **diferentes**, ambos 200 e não vazios e diferentes, mais uma chamada de ferramenta `get_time` |

> 💡 A camada gratuita é definida pela Zhipu BigModel e pode mudar. Confira os números ao vivo em [open.bigmodel.cn](https://open.bigmodel.cn) — e deixe a própria validação da ferramenta decidir:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — todos os 11

`GET /api/paas/v4/models` com uma chave nova responde **11 ids** — esse é o número no badge (`providers/zhipu/out/01-models.json`):

| ID do modelo | Observações |
| --- | --- |
| `glm-4.5`, `glm-4.5-air` | geração 4.5 (`-air` é a camada paga barata) |
| `glm-4.6`, `glm-4.7` | geração 4.6 / 4.7 |
| `glm-5`, `glm-5-turbo` | geração 5 |
| `glm-5.1`, `glm-5.2`, `glm-5.3` | geração 5.x |
| `glm-5.3-flash`, `glm-5.3-flashx` | variantes flash |

**Os ids gratuitos não estão nessa lista** — eles são documentados separadamente em `models/free/` e verificados ao vivo nesta conta: `glm-4.5-flash` (**o modelo de validação da ferramenta**: 200 com conteúdo real), `glm-4.7-flash` (200, `"OK"`), `glm-4.6v-flash` (acessível, geralmente ocupado). Um id pago em uma conta com saldo zero responde `1113` até a conta ser recarregada, e é exatamente por isso que a ferramenta valida com `glm-4.5-flash`.

A mesma chave responde em `api.z.ai/api/paas/v4` com **os mesmos 11 ids** — BigModel e Z.AI compartilham um único espaço de chaves, então o roteador pode apontar para qualquer um dos hosts.

## 🧪 Como usar a API

A URL base é **`https://open.bigmodel.cn/api/paas/v4`** — compatível com OpenAI, então qualquer coisa que fale OpenAI funciona (SDKs, Cursor, OpenCode, Kilo Code, …).

```bash
curl https://open.bigmodel.cn/api/paas/v4/chat/completions \
  -H "Authorization: Bearer <apiKey>.<secretKey>" \
  -H 'Content-Type: application/json' \
  -d '{"model":"glm-4.5-flash","messages":[{"role":"user","content":"say ok"}],"max_tokens":1024}'
```

Duas coisas que incomodam:

* a chave é o par **`<apiKey>.<secretKey>`** do console — as duas metades, unidas por um ponto, vão no cabeçalho `Authorization: Bearer` (a `apiKey` sozinha não basta);
* `glm-4.5-flash` é um modelo de **raciocínio** (pensamento ativado por padrão) e o pensamento consome o orçamento de tokens — para uma resposta de `tool_calls` use `max_tokens ≥ 1024` (com `256` a chamada às vezes fica silenciosamente vazia; medido em `providers/zhipu/out/09-tools-check.txt`).

## 🛠 Início rápido

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

### De onde vem a conta

Sem navegador, sem senha: a CLI pede ao seu trilho de caixa de correio um endereço novo, resolve o **Tencent TCaptcha** do painel (appid `196026326`, lido de `static.bigmodel.cn/wd-paas-front`) através de `--token-cmd`, envia o código com `POST /api/biz/code/emailCode/TencentVerifyCaptcha`, lê o código de 6 dígitos que o painel envia do seu próprio endereço de notificação (`notifications [at] account.bigmodel.cn`), e faz `POST /api/auth/login` — `newUserFlag:"YES"` significa que a conta foi criada na hora. Em seguida, escolhe a org/projeto padrão de `GET /api/biz/customer/getCustomerInfo` e cria a chave. Execute `node src/cli.js --help` para a lista completa de flags.

### 🖱️ O launcher

`src/launcher.js` (mesmo banner deste README) pergunta a quantidade, o arquivo da lista de proxies e o modelo de verificação, memoriza tudo em `launcher.config.json`, e executa a CLI com as flags corretas — depois oferece os conectores 9Router e OmniRoute. `src/connect-9router.js` registra o provedor sob o prefixo `zhipu` com `glm-4.5-flash` como modelo padrão.

## 🚀 Um comando

O captcha é resolvido para você — um comando cria N contas e mantém apenas as chaves que uma chamada de chat ao vivo verificou:

```bash
npm install                  # once: pulls puppeteer-core
npm start                    # menu → "1) Mint keys" → "How many keys?" (Enter = 10)
# or non-interactive:
node src/cli.js --count N
```

`--auto` é o padrão e nada precisa ser passado: o `src/solver.js` embutido abre um Chrome com interface sobre a própria saída da conta e retorna o token Turnstile do painel automaticamente. `--dry` imprime o plano resolvido e sai **sem gravar arquivo e sem chamada de rede**.

> ⚠️ **Termos e risco de conta.** Esta é uma ferramenta de automação, não um vendedor de contas. Cadastros em massa e criação de chaves são inteiramente de sua responsabilidade: podem violar os Termos de Serviço do provedor e podem bloquear endereços, saídas ou contas. Use apenas em infraestrutura que você tem permissão para automatizar, e mantenha a taxa de requisições baixa.

## 🔧 Avançado (opcional)

Conectar seu próprio solver, colar um token manualmente ou apontar a ferramenta para um Chrome específico estão documentados em **[ADVANCED.md](ADVANCED.md)**. O caminho comum não precisa de nada disso.

## ✅ Verificado e funcionando — toda chave é testada

Tudo medido em 2026-10-22 em duas chaves ao vivo (`providers/zhipu/keys.txt`, 2 linhas — a chave da conta z.ai e uma chave criada pelo trilho CN no mesmo dia):

| Verificação | Resultado |
| --- | --- |
| `GET /api/paas/v4/models` com uma chave **falsa** | **401** `1000 身份验证失败` — a verificação de autenticação é real |
| `GET /api/paas/v4/models` com uma chave do trilho | **200**, os 11 ids acima |
| `POST /chat/completions` `glm-4.5-flash`, prompt A (prepara) | **200** — `content:"101,103,107"`, `reasoning_content` 946 → 3432 caracteres |
| mesmo modelo, prompt B (uma frase em turco) | **200** — `content:"Deniz mavidir."` ⇒ ambos não vazios e **diferentes** (sanidade ✓) |
| `glm-4.7-flash` (pensamento desativado) | primeira tentativa `1305 该模型当前访问量过大` → nova tentativa **200** `"OK"` |
| `glm-4.6v-flash` | `1305` (modelo existe, ocupado) — classe de nova tentativa |
| ids pagos (`glm-4.5-air`, `glm-5-turbo`, `glm-5.3-flash`) | `429 1113 余额不足或无可用资源包,请充值。` em uma conta com saldo 0 ⇒ os 200 dos modelos gratuitos não são crédito |
| `GET api.z.ai/api/paas/v4/models` — **a mesma chave** | **200**, byte a byte os mesmos 11 ids (ambas as direções) |
| ferramentas | `get_time` `tool_calls` **200** com `max_tokens ≥ 1024` (`out/09-tools-check.txt`) |
| saída cruzada | **8 saídas ao vivo** em duas triagens todas responderam **200** com a mesma chave ⇒ a chave não está vinculada a IP; uma nova varredura de 15 saídas também respondeu 200 em todas |
| `preadd-gate --model glm-4.5-flash` | sanity=true · tools=get_time ✓ · 2842 ms; uma nova execução com saída nova 9139 ms; a chave do trilho CN 6816 ms e uma reverificação de 300 s 7373 ms |
| Trilho de registro CN | ticket TCaptcha resolvido em HTTP puro (27 s, 1 tentativa) → código enviado → código do mailtrap → `newUserFlag:"YES"` → org/projeto → `apiKey.secretKey`; a chave criada então passou pela validação completa acima |

Evidências: `providers/zhipu/out/verify-20261022063844.{txt,json}`, `verify-20261022073006.{txt,json}`, `01-models.json` + `.headers.txt`, `02-chat-p1.json`, `02-chat-p2.json`, `03-chat-p1-full.json` (e seus cabeçalhos), `04-cn-signup-gate.txt`, `07-exit-portability.txt`, `08-exit-rescan.txt`, `09-tools-check.txt`, `10-cn-tcaptcha-crack.txt`, `11-cn-lane-key-cross-exit.txt`, `12-cn-account-balance-zero.txt`, `13-cn-lane-key-paid-models-note.txt`; execuções de validação `proxy-lab/out/preadd-zhipu-1792651196.jsonl`, `preadd-zhipu-refresh.jsonl`, `preadd-zhipu-cn-1792654779.jsonl`; toda a cadeia pode ser reexecutada com `proxy-lab/zhipu-verify.js`.

> **Validações de qualidade.** Toda chave aqui passou por um `chat-200` ao vivo antes de ser gravada em `keys.txt`
> (chaves mortas nunca são entregues). As combinações do roteador seguem a mesma regra no nível do modelo: uma entrada é
> adicionada **somente se o modelo responder `chat-200` e puder chamar ferramentas** — um modelo sem suporte a ferramentas,
> uma chave morta ou um provedor morto é descartado em vez de adicionado. Reexecute a etapa de verificação a qualquer momento;
> as falhas são relatadas, nunca escondidas.

## 🧭 Como funciona

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Zhipu BigModel page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://open.bigmodel.cn/api/paas/v4/chat/completions → real content = the key is live
```

Por conta, tudo através de uma saída do seu pool:

1. **caixa de correio** — um endereço de caixa de entrada novo do trilho configurado (`--mail emailnator | broker | temptf`); o código do painel chega do seu endereço de notificação (`notifications [at] account.bigmodel.cn`) com o assunto `你的Zhipu验证码: <6 digits>`.
2. **captcha** — um `{ticket,randstr}` do Tencent TCaptcha para o appid `196026326`. Passe `--token-cmd`; o solver pode imprimir o JSON na stdout ou gravá-lo em `--token-file` (`{tmp}` é substituído). HTTP puro funciona: o `captcha-kit --kind tencent-http` da frota resolveu em 27 s na primeira tentativa.
3. **enviar o código** — `POST /api/biz/code/emailCode/TencentVerifyCaptcha {deviceToken,email,typeCode:"login",ticket,randstr}` → `验证码已发送，请查收邮件`. Um ticket expirado ou um request id ausente é recusado (testado em `out/04-cn-signup-gate.txt`).
4. **ler o código** — 6 dígitos da caixa de entrada.
5. **sessão** — `POST /api/auth/login {email,emailCode,loginType:"email",grantType:"customer",userType:"PERSONAL"}`; `newUserFlag:"YES"` significa que a conta foi criada ali mesmo — **sem etapa de senha**.
6. **org/projeto** — `GET /api/biz/customer/getCustomerInfo` → `organizations[0]` / `projects[0]`, o par padrão que o console usa.
7. **chave** — `POST /api/biz/v1/organization/<oid>/projects/<pid>/api_keys {name}` → `data.apiKey` + `data.secretKey`; unidos por um ponto, essa é a chave.
8. **validação** — dois prompts diferentes no modelo gratuito (ambos 200, não vazios, diferentes) **e** uma chamada de ferramenta `get_time` com `max_tokens ≥ 1024`. Só então a chave é anexada a `keys.txt`.

## ⚙️ Opções da CLI

```bash
node src/cli.js --count 5 --token-cmd "<solver>"   # mint
node src/cli.js --verify-only                      # re-check every key in keys.txt
node src/cli.js --screen                           # test your proxy list against BigModel
node src/cli.js --help
```

| Flag | Significado |
| --- | --- |
| `--count N` | contas (= chaves) a criar (padrão `5`) |
| `--conc N` | contas em andamento ao mesmo tempo, máx `8` (padrão `1`) |
| `--gap MS` | pausa entre contas (padrão `1200`) |
| `--model <id>` | modelo gratuito usado para a validação ao vivo (padrão `glm-4.5-flash`) |
| `--token-cmd CMD` | comando do solver TCaptcha; placeholders `{exit}`, `{url}`, `{tmp}` — **obrigatório para criar** |
| `--token-file F` | arquivo onde o solver grava o JSON do ticket, quando não o imprime |
| `--appid ID` | appid do TCaptcha passado ao solver (padrão `196026326`) |
| `--mail <rail>` | `emailnator` · `broker` · `temptf` (padrão `emailnator`) |
| `--pool <file>` | lista de proxies, uma saída por linha (ou env `ZHIPU_PROXIES`) — opcional |
| `--tries N` | saídas tentadas por conta antes de desistir (padrão `2`) |
| `--timeout MS` | timeout por requisição (padrão `60000`) |
| `--verify-only` | reexecuta toda chave em `keys.txt` pela validação |
| `--screen` | apenas testa a lista de proxies contra o BigModel |

## 🛰️ Atrás de um proxy

**Opcional — recomendado em escala.** Passe `--pool <file>` (ou defina `ZHIPU_PROXIES`) e toda requisição passa por uma saída dessa lista (`http://host:port`, `socks5://host:port`, `host:port`, `user:pass@host:port`); sem um pool, a CLI imprime `running WITHOUT a proxy (direct)` e conecta diretamente.

* a chave **não está vinculada à saída**: as 8 saídas ao vivo de duas triagens e uma nova varredura de 15 saídas retornaram 200 com a mesma chave (`out/07-exit-portability.txt`, `out/08-exit-rescan.txt`, `out/11-cn-lane-key-cross-exit.txt`);
* uma saída **saturada** não é uma chave morta — `--reverify` pode marcar `dead 0ms` em uma linha esgotada enquanto a mesma chave responde 200 de uma saída nova; escolha saídas de uma lista ao vivo;
* WARP **não** é usado nesta máquina (ele cortou o acesso remoto do operador), então os harnesses usam a saída do pool explicitamente.

## 📄 Arquivos

| Caminho | Conteúdo |
| --- | --- |
| `keys.txt` | uma `<apiKey>.<secretKey>` verificada ao vivo por linha — ignorado pelo git |
| `proxies.txt` | suas saídas, uma por linha — ignorado pelo git |
| `accounts.json` | registro conta ↔ chave ↔ validação — ignorado pelo git |
| `out/` | material bruto por execução que a CLI grava (resposta de modelos, corpos de chat, logs) — ignorado pelo git |
| `launcher.config.json` | configurações memorizadas do launcher — ignorado pelo git |

Nada mais é gravado: nenhum token de sessão, nenhum ticket TCaptcha e nenhuma senha de caixa de correio é armazenada em disco.

## 🔌 Conectar ao 9Router

[9Router](https://9router.com) é um roteador auto-hospedado e compatível com OpenAI. Registre este provedor uma vez e toda chave em `keys.txt` se torna uma conexão sob um único nó de provedor:

```bash
node src/connect-9router.js
```

Padrões: `--base http://localhost:20128`, `--password 123456`, `--name "Zhipu BigModel"`, `--prefix zhipu`, `--base-url https://open.bigmodel.cn/api/paas/v4`, `--model glm-4.5-flash`. Os modelos são servidos como `zhipu/<model id>` e balanceados entre todas as chaves.

> Se uma rota CN estiver lenta na sua rede, a mesma chave funciona em `https://api.z.ai/api/paas/v4` — medido, mesma chave, mesmos 11 ids.

## 🔌 Conectar ao OmniRoute

[OmniRoute](https://omniroute.online) é um roteador auto-hospedado e compatível com OpenAI. Registre este provedor uma vez e toda chave em `keys.txt` se torna uma conexão sob um único nó de provedor:

```bash
node src/connect-omniroute.js
```

Padrões: `--base http://localhost:20128`, `--password 123456`, `--name "Zhipu BigModel"`, `--prefix zhipu`, `--base-url https://open.bigmodel.cn/api/paas/v4`, `--model glm-4.5-flash`. Os modelos são servidos como `zhipu/<model id>` e balanceados entre todas as chaves.

> Se uma rota CN estiver lenta na sua rede, a mesma chave funciona em `https://api.z.ai/api/paas/v4` — medido, mesma chave, mesmos 11 ids.

## 🔑 O que uma chave oferece

| | |
| --- | --- |
| 🏢 Provedor | **Zhipu BigModel** — [open.bigmodel.cn](https://open.bigmodel.cn) |
| 🎁 O que o provedor oferece | Camada gratuita do GLM em uma conta com saldo zero — o trilho de cadastro CN roda do lado do protocolo, toda chave verificada por chat e ferramentas |
| 🔑 O que uma chave oferece | uma chave de API vinculada à sua própria conta: os 11 ids de modelo no endpoint abaixo, nos limites do seu plano. A cota fica na **conta**, e é exatamente por isso que esta ferramenta cria uma conta por chave |
| 🌐 Formato da API | Compatível com OpenAI: `POST https://open.bigmodel.cn/api/paas/v4/chat/completions` |
| 🔒 Seus dados | apenas open.bigmodel.cn e o backend de caixa de correio que você configurar são contatados; as chaves ficam na sua máquina |

## 🐞 Problemas

* **Os ids gratuitos são invisíveis para `/models`.** `GET /models` retorna apenas os 11 ids pagos; `glm-4.5-flash` / `glm-4.7-flash` / `glm-4.6v-flash` são documentados em `models/free/` e nunca aparecem nessa lista — não interprete isso como "a chave não tem nada".
* **Não existe `/api/pricing` neste painel.** `/api/pricing`, `/api/paas/v4/pricing`, `/api/biz/pricing`, `/api/paas/pricing`, `/api/product/pricing` são todos **404** — a única superfície de preços acionável é a página de preços da SPA mais a documentação, então a prova da camada gratuita aqui é "saldo 0 × modelo gratuito 200" + a página oficial `免费`, nunca uma tabela de proporções do painel.
* **Modelos pagos responderem não é prova da camada gratuita.** Uma conta CN recém-criada atualmente retorna 200 para `glm-4.5-air`, `glm-5-turbo` e `glm-4.6` enquanto seu registro de gastos permanece `0E-9` (`out/13-cn-lane-key-paid-models-note.txt`) — uma cortesia de conta nova. Na chave mais antiga, os mesmos modelos respondem `429/1113`. Apenas os 200 de `glm-4.5-flash` / `glm-4.7-flash` são evidência durável da camada gratuita.
* **`glm-4.5-flash` tem uma nota de descontinuação** (2026-01-30, requisições direcionadas para `glm-4.7-flash`). Se ele parar de responder, troque `--model` e a validação para `glm-4.7-flash` (200 em ambas as contas).
* **Frescor do ticket.** O ticket TCaptcha é de uso único e de curta duração: resolva, envie o código e faça login em sequência, ou resolva novamente. Um request id é obrigatório no endpoint do código.

Se a Zhipu mudar o appid do captcha, o endpoint do código ou o formato do login, a ferramenta para nessa etapa e imprime o status e o corpo que viu. **[Abra uma issue](../../issues)** com o comando e a saída exata; PRs são bem-vindos.

## 📄 Licença

MIT © 2026 — veja [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 zhipu-bulk-apikey contributors

</div>
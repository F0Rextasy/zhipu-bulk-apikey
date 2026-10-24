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

**API anahtarlarıyla toplu BigModel (Zhipu) hesabı oluşturun — kayıt zinciri saf HTTP'dir (TCaptcha bileti + e-posta kodu), OpenAI uyumlu GLM çıkarımı ve bir 9Router bağlayıcısı.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-11%20served-412991?style=for-the-badge)](https://docs.bigmodel.cn/cn/guide/models/free/glm-4.5-flash)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Hızlı başlangıç](#-quick-start) · [🎁 Ücretsiz katman](#-free-tier--how-much-you-get) · [🤖 Modeller](#-models--all-11-of-them) · [🧪 API'yi kullanın](#-how-to-use-the-api) · [✅ Doğrulandı](#-verified-working--every-key-is-tested) · [🧭 Nasıl çalışır](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Seçenekler](#️-cli-options) · [🛰️ Proxy'ler](#️-behind-a-proxy) · [🐞 Sorunlar](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Bu neden var

BigModel (`open.bigmodel.cn`, Zhipu'nun CN platformu) GLM ailesini **OpenAI uyumlu** bir `…/api/paas/v4` uç noktası üzerinden sunar ve ücretsiz katmanı gerçektir: `glm-4.5-flash`, `glm-4.7-flash` ve `glm-4.6v-flash`, konsol bakiyesi **0** gösteren bir hesapta canlı sohbetleri yanıtlar. İlginç olan kısım kapıdır: CN kayıt zinciri (TCaptcha → e-posta kodu → giriş) **tamamen protokol tarafındadır** — akışın kendisi için tarayıcıya gerek yoktur — böylece tek bir komut yeni bir gelen kutusu adresini bir hesaba, bir proje anahtarına ve doğrulanmış bir `keys.txt` satırına dönüştürür. Kota **hesapta** yaşadığı için araç **her anahtar için bir hesap** üretir; her biri yazılmadan önce iki farklı istem ve gerçek bir `get_time` araç çağrısıyla kapıdan geçirilir.

## 🎁 Ücretsiz katman — ne kadar alıyorsunuz

| Ne | Değer |
| --- | --- |
| Ücretsiz model kimlikleri | **`glm-4.5-flash`**, **`glm-4.7-flash`**, **`glm-4.6v-flash`** — belgelenen `models/free/` kümesi (`glm-4.5-flash`: "完全免费开放使用"); üçü de bu hesaba yanıt verir
| Hesap bakiyesi | **0** — konsol raporu `balance 0 · giveAmount 0 · recharge 0 · creditStatus NOT_OPEN` (`providers/zhipu/out/12-cn-account-balance-zero.txt`) |
| O hesaptaki ücretli modeller | `glm-4.5-air`, `glm-5-turbo`, `glm-5.3-flash` → `429 {"code":"1113","message":"余额不足或无可用资源包,请充值。"}` — yani bir 200, krediyle *açıklanamaz*: ücretsiz modeller gerçekten ücretsizdir |
| Kayıt maliyeti | yok — **kart yok, SMS yok**: yalnızca e-posta kodu; hesap `acType: NOT_AC` (实名认证 yok) taşır ve API yine de çalışır |
| Bir hesabın aldığı | kendi organizasyonu + varsayılan projesi ve üzerinde üretilen bir anahtar (`POST …/organization/<oid>/projects/<pid>/api_keys`) |
| Hız sınırı | `glm-4.6v-flash` çoğunlukla `1305 该模型当前访问量过大` (meşgul, yeniden dene) yanıtı verir; `glm-4.7-flash` ikinci denemede geçti |
| Anahtar biçimi | 49 karakter, konsolun `<apiKey>.<secretKey>` çiftinin noktayla birleştirilmiş hali |
| Kapı | iki **farklı** istem, her ikisi de 200 ve boş olmayan ve farklı, artı bir `get_time` araç çağrısı |

> 💡 Ücretsiz katman Zhipu BigModel tarafından belirlenir ve değişebilir. Güncel sayıları [open.bigmodel.cn](https://open.bigmodel.cn) adresinden kontrol edin — ve kararı aracın kendi kapısına bırakın:

```bash
node src/cli.js --verify-only     # keys.txt içindeki her anahtar gerçek bir sohbet çağrısıyla yeniden test edilir
```

## 🤖 Modeller — 11'inin tamamı

Yeni bir anahtarla `GET /api/paas/v4/models` **11 kimlik** yanıtlar — rozetteki sayı budur (`providers/zhipu/out/01-models.json`):

| Model Kimliği | Notlar |
| --- | --- |
| `glm-4.5`, `glm-4.5-air` | 4.5 nesli (`-air` ucuz ücretli katmandır) |
| `glm-4.6`, `glm-4.7` | 4.6 / 4.7 nesli |
| `glm-5`, `glm-5-turbo` | 5 nesli |
| `glm-5.1`, `glm-5.2`, `glm-5.3` | 5.x nesli |
| `glm-5.3-flash`, `glm-5.3-flashx` | flash varyantları |

**Ücretsiz kimlikler bu listede yoktur** — ayrıca `models/free/` altında belgelenirler ve bu hesapta canlı olarak doğrulanmışlardır: `glm-4.5-flash` (**aracın kapı modeli**: gerçek içerikle 200), `glm-4.7-flash` (200, `"OK"`), `glm-4.6v-flash` (erişilebilir, genellikle meşgul). Sıfır bakiyeli bir hesapta ücretli bir kimlik, hesap yüklenene kadar `1113` yanıtı verir; bu tam da aracın neden `glm-4.5-flash` üzerinden kapı kurduğunun sebebidir.

Aynı anahtar `api.z.ai/api/paas/v4` üzerinde **birebir aynı 11 kimlikle** yanıt verir — BigModel ve Z.AI tek bir anahtar alanını paylaşır, böylece yönlendirici her iki ana bilgisayarı da işaret edebilir.

## 🧪 API nasıl kullanılır

Temel URL **`https://open.bigmodel.cn/api/paas/v4`**'tür — OpenAI uyumlu, yani OpenAI konuşan her şey çalışır (SDK'lar, Cursor, OpenCode, Kilo Code, …).

```bash
curl https://open.bigmodel.cn/api/paas/v4/chat/completions \
  -H "Authorization: Bearer <apiKey>.<secretKey>" \
  -H 'Content-Type: application/json' \
  -d '{"model":"glm-4.5-flash","messages":[{"role":"user","content":"say ok"}],"max_tokens":1024}'
```

Sizi ısıracak iki şey:

* anahtar konsolun **`<apiKey>.<secretKey>`** çiftidir — her iki yarı, noktayla birleştirilmiş halde `Authorization: Bearer` başlığına gider (yalnızca `apiKey` yeterli değildir);
* `glm-4.5-flash` bir **akıl yürütme** modelidir (düşünme varsayılan olarak açık) ve düşünme token bütçesini yer — bir `tool_calls` yanıtı için `max_tokens ≥ 1024` kullanın (`256` ile çağrı bazen sessizce boş kalır; `providers/zhipu/out/09-tools-check.txt` içinde ölçülmüştür).

## 🛠 Hızlı başlangıç

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

### Hesap nereden geliyor

Tarayıcı yok, parola yok: CLI, posta kutusu hattından yeni bir adres ister, panelin **Tencent TCaptcha**'sını (`static.bigmodel.cn/wd-paas-front` içinden okunan appid `196026326`) `--token-cmd` aracılığıyla çözer, kodu `POST /api/biz/code/emailCode/TencentVerifyCaptcha` ile gönderir, panelin kendi bildirim adresinden (`notifications [at] account.bigmodel.cn`) postaladığı 6 haneli kodu okur ve `POST /api/auth/login` gönderir — `newUserFlag:"YES"` hesabın anında oluşturulduğu anlamına gelir. Ardından `GET /api/biz/customer/getCustomerInfo` üzerinden varsayılan organizasyonu/projeyi seçer ve anahtarı üretir. Tam bayrak listesi için `node src/cli.js --help` çalıştırın.

### 🖱️ Başlatıcı

`src/launcher.js` (bu README ile aynı banner) sayıyı, proxy listesi dosyasını ve doğrulama modelini sorar, bunları `launcher.config.json` içinde hatırlar ve CLI'yi doğru bayraklarla çalıştırır — ardından 9Router ve OmniRoute bağlayıcılarını sunar. `src/connect-9router.js`, sağlayıcıyı `zhipu` öneki altında varsayılan model olarak `glm-4.5-flash` ile kaydeder.

## 🚀 Tek komut

Captcha sizin için çözülür — tek bir komut N hesap üretir ve yalnızca canlı bir sohbet çağrısının doğruladığı anahtarları saklar:

```bash
npm install                  # once: pulls puppeteer-core
npm start                    # menu → "1) Mint keys" → "How many keys?" (Enter = 10)
# or non-interactive:
node src/cli.js --count N
```

`--auto` varsayılandır ve hiçbir şeyin geçirilmesi gerekmez: gömülü `src/solver.js`, hesabın kendi çıkışı üzerinden başsız olmayan bir Chrome açar ve panelin Turnstile token'ını otomatik olarak döndürür. `--dry`, çözümlenen planı yazdırır ve **hiçbir dosya yazmadan ve hiçbir ağ çağrısı yapmadan** çıkar.

> ⚠️ **Şartlar ve hesap riski.** Bu bir otomasyon aracıdır, hesap satıcısı değildir. Toplu kayıtlar ve anahtar üretimi tamamen sizin sorumluluğunuzdadır: sağlayıcının Hizmet Şartlarını ihlal edebilir ve adreslerin, çıkışların veya hesapların engellenmesine yol açabilir. Yalnızca otomatikleştirmeye izin verdiğiniz altyapıda kullanın ve istek hızını düşük tutun.

## 🔧 Gelişmiş (isteğe bağlı)

Kendi çözücünüzü bağlamak, bir token'ı elle yapıştırmak veya aracı belirli bir Chrome'a yönlendirmek **[ADVANCED.md](ADVANCED.md)** içinde belgelenmiştir. Yaygın yol bunların hiçbirine ihtiyaç duymaz.

## ✅ Çalıştığı doğrulandı — her anahtar test edilir

Tümü 2026-10-22 tarihinde iki canlı anahtar üzerinde ölçülmüştür (`providers/zhipu/keys.txt`, 2 satır — z.ai hesap anahtarı ve aynı gün CN hattı üzerinden üretilen bir anahtar):

| Kontrol | Sonuç |
| --- | --- |
| **Sahte** bir anahtarla `GET /api/paas/v4/models` | **401** `1000 身份验证失败` — kimlik doğrulama kontrolü gerçektir |
| Bir hat anahtarıyla `GET /api/paas/v4/models` | **200**, yukarıdaki 11 kimlik |
| `POST /chat/completions` `glm-4.5-flash`, istem A (asallar) | **200** — `content:"101,103,107"`, `reasoning_content` 946 → 3432 karakter |
| aynı model, istem B (Türkçe bir cümle) | **200** — `content:"Deniz mavidir."` ⇒ her ikisi de boş değil ve **farklı** (tutarlılık ✓) |
| `glm-4.7-flash` (düşünme kapalı) | ilk deneme `1305 该模型当前访问量过大` → yeniden deneme **200** `"OK"` |
| `glm-4.6v-flash` | `1305` (model var, meşgul) — yeniden denenebilir sınıf |
| ücretli kimlikler (`glm-4.5-air`, `glm-5-turbo`, `glm-5.3-flash`) | bakiyesi 0 olan bir hesapta `429 1113 余额不足或无可用资源包,请充值。` ⇒ ücretsiz modellerin 200'leri kredi değildir |
| `GET api.z.ai/api/paas/v4/models` — **aynı anahtar** | **200**, birebir aynı 11 kimlik (her iki yönde) |
| araçlar | `get_time` `tool_calls` **200**, `max_tokens ≥ 1024` ile (`out/09-tools-check.txt`) |
| çıkışlar arası | iki taramada **8 canlı çıkış** aynı anahtarla **200** yanıtladı ⇒ anahtar IP'ye bağlı değildir; 15 çıkışlık yeniden tarama da her yerde 200 yanıtladı |
| `preadd-gate --model glm-4.5-flash` | sanity=true · tools=get_time ✓ · 2842 ms; yeni çıkışla yeniden çalıştırma 9139 ms; CN hattı anahtarı 6816 ms ve 300 s yeniden doğrulama 7373 ms |
| CN kayıt hattı | TCaptcha bileti saf HTTP'de çözüldü (27 s, 1 deneme) → kod gönderildi → mailtrap kodu → `newUserFlag:"YES"` → organizasyon/proje → `apiKey.secretKey`; üretilen anahtar ardından yukarıdaki tam kapıyı geçti |

Kanıtlar: `providers/zhipu/out/verify-20261022063844.{txt,json}`, `verify-20261022073006.{txt,json}`, `01-models.json` + `.headers.txt`, `02-chat-p1.json`, `02-chat-p2.json`, `03-chat-p1-full.json` (ve başlıkları), `04-cn-signup-gate.txt`, `07-exit-portability.txt`, `08-exit-rescan.txt`, `09-tools-check.txt`, `10-cn-tcaptcha-crack.txt`, `11-cn-lane-key-cross-exit.txt`, `12-cn-account-balance-zero.txt`, `13-cn-lane-key-paid-models-note.txt`; kapı çalıştırmaları `proxy-lab/out/preadd-zhipu-1792651196.jsonl`, `preadd-zhipu-refresh.jsonl`, `preadd-zhipu-cn-1792654779.jsonl`; tüm zincir `proxy-lab/zhipu-verify.js` ile yeniden çalıştırılabilir.

> **Kalite kapıları.** Buradaki her anahtar `keys.txt` dosyasına yazılmadan önce canlı bir `chat-200` geçti
> (ölü anahtarlar asla gönderilmez). Yönlendirici kombinasyonları model düzeyinde aynı kuralı izler: bir giriş
> **yalnızca model `chat-200` yanıtlıyorsa ve araçları çağırabiliyorsa** eklenir — araç desteği olmayan bir model,
> ölü bir anahtar veya ölü bir sağlayıcı eklenmek yerine çıkarılır. Doğrulama adımını istediğiniz zaman yeniden çalıştırın;
> hatalar bildirilir, asla gizlenmez.

## 🧭 Nasıl çalışır

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Zhipu BigModel page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://open.bigmodel.cn/api/paas/v4/chat/completions → real content = the key is live
```

Hesap başına, tümü havuzunuzdan tek bir çıkış üzerinden:

1. **posta kutusu** — yapılandırılmış hattan yeni bir gelen kutusu adresi (`--mail emailnator | broker | temptf`); panelin kodu, kendi bildirim adresinden (`notifications [at] account.bigmodel.cn`) `你的Zhipu验证码: <6 digits>` konu satırıyla gelir.
2. **captcha** — appid `196026326` için bir Tencent TCaptcha `{ticket,randstr}`. `--token-cmd` geçirin; çözücü JSON'u stdout'a yazdırabilir veya `--token-file` dosyasına yazabilir (`{tmp}` yerine konur). Saf HTTP çalışır: filonun `captcha-kit --kind tencent-http` aracı ilk denemede 27 s'de çözdü.
3. **kodu gönder** — `POST /api/biz/code/emailCode/TencentVerifyCaptcha {deviceToken,email,typeCode:"login",ticket,randstr}` → `验证码已发送，请查收邮件`. Bayat bir bilet veya eksik bir istek kimliği reddedilir (`out/04-cn-signup-gate.txt` içinde incelenmiştir).
4. **kodu oku** — gelen kutusundan 6 hane.
5. **oturum** — `POST /api/auth/login {email,emailCode,loginType:"email",grantType:"customer",userType:"PERSONAL"}`; `newUserFlag:"YES"` hesabın tam orada oluşturulduğu anlamına gelir — **parola adımı yok**.
6. **organizasyon/proje** — `GET /api/biz/customer/getCustomerInfo` → `organizations[0]` / `projects[0]`, konsolun kullandığı varsayılan çift.
7. **anahtar** — `POST /api/biz/v1/organization/<oid>/projects/<pid>/api_keys {name}` → `data.apiKey` + `data.secretKey`; noktayla birleştirilmiş hali anahtardır.
8. **kapı** — ücretsiz modelde iki farklı istem (her ikisi de 200, boş olmayan, farklı) **ve** `max_tokens ≥ 1024` ile bir `get_time` araç çağrısı. Ancak o zaman anahtar `keys.txt` dosyasına eklenir.

## ⚙️ CLI seçenekleri

```bash
node src/cli.js --count 5 --token-cmd "<solver>"   # mint
node src/cli.js --verify-only                      # re-check every key in keys.txt
node src/cli.js --screen                           # test your proxy list against BigModel
node src/cli.js --help
```

| Bayrak | Anlamı |
| --- | --- |
| `--count N` | üretilecek hesap (= anahtar) sayısı (varsayılan `5`) |
| `--conc N` | aynı anda işlemdeki hesap sayısı, en fazla `8` (varsayılan `1`) |
| `--gap MS` | hesaplar arası bekleme (varsayılan `1200`) |
| `--model <id>` | canlı kapı için kullanılan ücretsiz model (varsayılan `glm-4.5-flash`) |
| `--token-cmd CMD` | TCaptcha çözücü komutu; yer tutucular `{exit}`, `{url}`, `{tmp}` — **üretim için gereklidir** |
| `--token-file F` | çözücünün bilet JSON'unu yazdığı dosya, yazdırmadığı durumda |
| `--appid ID` | çözücüye verilen TCaptcha appid'i (varsayılan `196026326`) |
| `--mail <rail>` | `emailnator` · `broker` · `temptf` (varsayılan `emailnator`) |
| `--pool <file>` | proxy listesi, satır başına bir çıkış (veya ortam değişkeni `ZHIPU_PROXIES`) — isteğe bağlı |
| `--exits N` | vazgeçmeden önce hesap başına denenen çıkış sayısı (varsayılan `6`) |
| `--timeout MS` | istek başına zaman aşımı (varsayılan `60000`) |
| `--verify-only` | `keys.txt` içindeki her anahtarı kapıdan yeniden geçir |
| `--screen` | yalnızca proxy listesini BigModel'e karşı test et |

## 🛰️ Proxy arkasında

**İsteğe bağlı — ölçekte önerilir.** `--pool <file>` geçirin (veya `ZHIPU_PROXIES` ayarlayın); her istek o listeden bir çıkış üzerinden gider (`http://host:port`, `socks5://host:port`, `host:port`, `user:pass@host:port`); havuz olmadan CLI `running WITHOUT a proxy (direct)` yazdırır ve doğrudan bağlanır.

* anahtar **çıkışa bağlı değildir**: iki taramanın 8 canlı çıkışı ve 15 çıkışlık bir yeniden tarama, aynı anahtarla hepsi 200 döndürdü (`out/07-exit-portability.txt`, `out/08-exit-rescan.txt`, `out/11-cn-lane-key-cross-exit.txt`);
* **doymuş** bir çıkış ölü anahtar değildir — `--reverify`, tükenmiş bir satıra `dead 0ms` damgası vurabilirken aynı anahtar yeni bir çıkıştan 200 yanıtlar; çıkışları canlı bir listeden seçin;
* bu kutuda WARP **kullanılmaz** (operatörün uzaktan erişimini kesti), bu yüzden test düzenekleri havuz çıkışını açıkça alır.

## 📄 Dosyalar

| Yol | İçerik |
| --- | --- |
| `keys.txt` | satır başına bir canlı doğrulanmış `<apiKey>.<secretKey>` — git tarafından yok sayılır |
| `proxies.txt` | çıkışlarınız, satır başına bir tane — git tarafından yok sayılır |
| `accounts.json` | hesap ↔ anahtar ↔ kapı kaydı — git tarafından yok sayılır |
| `out/` | CLI'nin yazdığı çalıştırma başına ham materyal (model yanıtı, sohbet gövdeleri, günlükler) — git tarafından yok sayılır |
| `launcher.config.json` | hatırlanan başlatıcı ayarları — git tarafından yok sayılır |

Başka hiçbir şey yazılmaz: diske hiçbir oturum token'ı, TCaptcha bileti veya posta kutusu parolası kaydedilmez.

## 🔌 9Router'a bağlanın

[9Router](https://9router.com) kendi kendine barındırılan, OpenAI uyumlu bir yönlendiricidir. Bu sağlayıcıyı bir kez kaydedin ve `keys.txt` içindeki her anahtar tek bir sağlayıcı düğümü altında bir bağlantı haline gelir:

```bash
node src/connect-9router.js
```

Varsayılanlar: `--base http://localhost:20128`, `--password 123456`, `--name "Zhipu BigModel"`, `--prefix zhipu`, `--base-url https://open.bigmodel.cn/api/paas/v4`, `--model glm-4.5-flash`. Modeller `zhipu/<model id>` olarak sunulur ve her anahtar arasında yük dengelenir.

> Ağınızdan bir CN rotası yavaşsa, aynı anahtar `https://api.z.ai/api/paas/v4` üzerinde çalışır — ölçüldü, aynı anahtar, aynı 11 kimlik.

## 🔌 OmniRoute'a bağlanın

[OmniRoute](https://omniroute.online) kendi kendine barındırılan, OpenAI uyumlu bir yönlendiricidir. Bu sağlayıcıyı bir kez kaydedin ve `keys.txt` içindeki her anahtar tek bir sağlayıcı düğümü altında bir bağlantı haline gelir:

```bash
node src/connect-omniroute.js
```

Varsayılanlar: `--base http://localhost:20128`, `--password 123456`, `--name "Zhipu BigModel"`, `--prefix zhipu`, `--base-url https://open.bigmodel.cn/api/paas/v4`, `--model glm-4.5-flash`. Modeller `zhipu/<model id>` olarak sunulur ve her anahtar arasında yük dengelenir.

> Ağınızdan bir CN rotası yavaşsa, aynı anahtar `https://api.z.ai/api/paas/v4` üzerinde çalışır — ölçüldü, aynı anahtar, aynı 11 kimlik.

## 🔑 Bir anahtar size ne kazandırır

| | |
| --- | --- |
| 🏢 Sağlayıcı | **Zhipu BigModel** — [open.bigmodel.cn](https://open.bigmodel.cn) |
| 🎁 Sağlayıcının verdiği | Sıfır bakiyeli bir hesapta GLM ücretsiz katmanı — CN kayıt hattı protokol tarafında çalışır, her anahtar sohbet ve araç doğrulamasından geçer |
| 🔑 Bir anahtarın size kazandırdığı | kendi hesabına kapsanmış bir API anahtarı: aşağıdaki uç noktadaki 11 model kimliği, planınızın sınırlarında. Kota **hesapta** yaşar; bu aracın neden anahtar başına bir hesap oluşturduğunun tam sebebi budur |
| 🌐 API biçimi | OpenAI uyumlu: `POST https://open.bigmodel.cn/api/paas/v4/chat/completions` |
| 🔒 Verileriniz | yalnızca open.bigmodel.cn ve yapılandırdığınız gelen kutusu arka ucuna bağlanılır; anahtarlar makinenizde kalır |

## 🐞 Sorunlar

* **Ücretsiz kimlikler `/models` için görünmezdir.** `GET /models` yalnızca 11 ücretli kimliği döndürür; `glm-4.5-flash` / `glm-4.7-flash` / `glm-4.6v-flash` `models/free/` altında belgelenir ve o listede asla görünmez — bunu "anahtarın hiçbir şeyi yok" olarak okumayın.
* **Bu panelde `/api/pricing` yoktur.** `/api/pricing`, `/api/paas/v4/pricing`, `/api/biz/pricing`, `/api/paas/pricing`, `/api/product/pricing` hepsi **404**'tür — tek eyleme geçirilebilir fiyat yüzeyi SPA fiyat sayfası artı belgelerdir, bu yüzden buradaki ücretsiz katman kanıtı "bakiye 0 × ücretsiz model 200" + resmi `免费` sayfasıdır, asla bir panel oran tablosu değildir.
* **Ücretli modellerin yanıt vermesi ücretsiz katman kanıtı değildir.** Yeni oluşturulmuş bir CN hesabı şu anda `glm-4.5-air`, `glm-5-turbo` ve `glm-4.6` için 200 döndürürken harcama kaydı `0E-9` kalır (`out/13-cn-lane-key-paid-models-note.txt`) — yeni hesap lütfu. Eski anahtarda aynı modeller `429/1113` yanıtlar. Yalnızca `glm-4.5-flash` / `glm-4.7-flash` 200'leri kalıcı ücretsiz katman kanıtıdır.
* **`glm-4.5-flash` için bir kullanımdan kaldırma notu var** (2026-01-30, istekler `glm-4.7-flash`'e yönlendiriliyor). Yanıt vermeyi bırakırsa, `--model` ve kapıyı `glm-4.7-flash`'e geçirin (her iki hesapta da 200).
* **Bilet tazeliği.** TCaptcha bileti tek kullanımlıktır ve kısa ömürlüdür: çözün, kodu gönderin ve art arda giriş yapın, yoksa yeniden çözün. Kod uç noktasında bir istek kimliği zorunludur.

Zhipu captcha appid'ini, kod uç noktasını veya giriş biçimini değiştirirse, araç o adımda durur ve gördüğü durumu ve gövdeyi yazdırır. Komut ve tam çıktıyla birlikte **[bir sorun açın](../../issues)**; PR'lar memnuniyetle karşılanır.

## 📄 Lisans

MIT © 2026 — bkz. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 zhipu-bulk-apikey contributors

</div>
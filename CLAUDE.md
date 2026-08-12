# CLAUDE.md

Інструкції для Claude Code у репозиторії `DnDCharacter` (`MythgateDND`, продукт — **Mythgate 5e Companion**).

> **Фаза: RELEASE HARDENING.** UX/UI спринти 1–6 завершені. Нових продуктових фіч до релізу не додаємо.
> **Виняток:** Campaign Management (GM Workspace, `docs/campaign-management-prompts.md`)
> свідомо додається паралельно з release hardening за рішенням власника
> продукту від 2026-08-01. Роботу з цієї пачки ізольовано від R1-R5;
> вона не звільняє від Definition of Done §9.
> **Реліз-модель:** Play Console вже створено, реліз `1.0.0 (4)` схвалено Google, 12 тестувальників набрано (обидва пункти чекліста «Робоча версія» виконані — перевірено 2026-08-12). Критичний шлях тепер — **14-денний безперервний закритий тест, старт 2026-08-12 → завершення 2026-08-26** (кнопка «Подати заявку» стане активною не раніше цієї дати, за умови безперервного opt-in усіх 12 тестувальників). Деталі й спринти — у `docs/release-plan-google-play.md`, поточні блокери — `docs/release-blockers.md`.
> **Ключовий продуктовий факт:** аркуш персонажа редагують **кілька людей одночасно** (owner + editors). Це змінює вимоги до синхронізації, правил Firestore і видалення акаунта. Модель і інваріанти — у `docs/collaborative-editing.md`.

---

## 1. Джерела істини

| Файл | Роль |
| --- | --- |
| `CLAUDE.md` | Робочі правила. Читати першим. |
| `docs/release-plan-google-play.md` | **Поточний план і спринти R1–R5.** Замінює `docs/archive/sprint-plan.md` і `docs/archive/ux-ui-roadmap.md`. |
| `docs/collaborative-editing.md` | Цільова модель спільного редагування + інваріанти, які не можна ламати. |
| `docs/audit-2026-07.md` | Реєстр знахідок (PLY / SEC / COL / PERF / REL) з файлами й рядками. Джерело задач, статуси оновлюються (востаннє 2026-08-12). |
| `docs/release-blockers.md` | Живий список реальних блокерів релізу й відкритих питань до власника продукту. |
| `docs/legal-terms-of-service.md` | Умови використання / Acceptable Use — єдиний правовий документ, якого бракувало. |
| `.github/instructions/mobile-rn-standards.instructions.md` | Код-стандарти RN/TS. Чинні. |
| `docs/ui-kit.md`, `docs/loading-states-and-skeleton.md`, `docs/dnd-product-guidelines.md` | Чинні. |
| `.agents/*` | Інструкції Codex. Технічні правила й роадмап синхронізовано з release hardening (див. §11). |
| `docs/archive/sprint-plan.md`, `docs/archive/ux-ui-roadmap.md`, `docs/archive/product-*-stage-*.md` | **Історія.** Не беклог. Перенесено з `docs/` у `docs/archive/` 2026-08-12. |

Пріоритет при конфлікті: `release-plan` → `collaborative-editing` → `CLAUDE.md` → `.github/instructions` → `.agents` → інші `docs`.

---

## 2. Факти про проєкт (перевірено 2026-07-26)

- Expo SDK `54.0.35`, RN `0.81.5`, React `19.1.0`, TS `5.9.2`, New Architecture **on**, Hermes **on**.
- **Фактичні Android-версії**: `minSdk 24`, `compileSdk 36`, `targetSdk 36`, buildTools `36.0.0` — з `react-native/gradle/libs.versions.toml` через `expoAutolinking.useExpoVersionCatalog()`. Тобто вимогу Google Play «target API 36 до 31 серпня 2026» проєкт **уже виконує**. Не «покращуй» це.
- Стан: Zustand (`src/stores`, реекспорти в `src/context`), AsyncStorage через `src/repositories/*`.
- Хмара: `@react-native-firebase/{app,auth,firestore}` + Google Sign-In, правила в `firestore.rules`.
- Спільне редагування вже частково реалізоване: `owners[]`/`editors[]`, `onSnapshot`-підписки, `changeHistory[]`, секційний merge, стани `conflict`/`pending-*`.
- 320 файлів `.ts/.tsx`, ~39 700 рядків у `src/`.
- **`android/` закомічений** — bare-проєкт, prebuild на EAS не запускається. Наслідки в §4.
- Пакетний менеджер — тільки `npm`, `legacy-peer-deps=true`.

### Базова лінія якості (реально запускалося, оновлено 2026-08-12)

```
npx tsc --noEmit      -> 0 помилок
npm run lint          -> 0 errors, 25 warnings (react-hooks/exhaustive-deps)
npm run test:unit     -> 61 файл / 328 тестів зелені (~2.3 с)
npm audit             -> 35 (0 critical / 15 high / 20 moderate), усі в build/dev-тулчейні
```

Зростання `npm audit` (було 23, потім 22 після `overrides` за SEC-7, тепер 35) —
наслідок додавання `expo-updates` (R4-1): ланцюжок `@expo/config-plugins →
xcode` того самого build-toolchain кластера. Не рантайм APK. Деталі —
`docs/audit-2026-07.md` SEC-7.

Твоя зміна не має погіршити цю лінію.

---

## 3. Робоча дисципліна

1. **Читай перед зміною**: екран → його `style.ts` → store/service → типи навігації.
2. **Мінімальний діф.** Не переписуй великі екрани без прямого запиту.
3. **Не вигадуй валідацію.** «Перевірено» — тільки про реально запущені команди, з переліком.
4. **Не приховуй невизначеність.** Якщо підтвердження можливе лише на пристрої / в Play Console / на двох клієнтах — так і кажи.
5. **Ніяких нових `any`** (зараз у не-тестовому коді 1 випадок).
6. **UI-токени обов'язкові**: `sp()`, `fs()`, `rd()`, `typography()`, примітиви `@/shared/ui`, кольори з теми.
7. **Firestore лише в** `src/services/`, `src/repositories/`, `src/dm/repositories/`.
8. **Локально-перший режим не ламати**: створення й редагування персонажа працює офлайн і без логіну.

```bash
npm run typecheck   npm run lint   npm run lint:ui   npm run lint:theme
npm run test:unit   npm run validate   npm run format
```

Мінімум перед завершенням: `typecheck` + `test:unit`. Чіпав UI — плюс `lint:ui`. Чіпав синк/правила — плюс сценарії з §5.

---

## 4. КРИТИЧНО: закомічений `android/`, версії та prebuild

EAS Build **не виконує prebuild**, бо `android/` існує. Тому:

- Зміни в `app.json` (`icon`, `splash`, `android.adaptiveIcon`, `android.permissions`, `userInterfaceStyle`) **самі по собі ні на що не впливають**.
- Кожну нативну зміну робимо **у двох місцях**: `app.json` (щоб конфіг був правдою) + `android/` (щоб потрапило в білд). Ручні правки позначай `// manual: <причина>`.
- **Не запускай `npx expo prebuild --clean` без прямої вказівки користувача.** Він затре правки в `AndroidManifest.xml`, `build.gradle`, `res/`. Якщо вважаєш, що prebuild потрібен — спершу перелічи, що буде втрачено, і чекай підтвердження.

### Правило версій (тут легко зламати OTA)

- `versionName` у bare-проєкті береться з **`android/app/build.gradle`**, а не з `app.json`. Зараз там `0.91.1`.
- Підйом до 1.0.0 робити **в обох файлах одночасно**: `app.json` → `"version": "1.0.0"`, `build.gradle` → `versionName "1.0.0"`.
- Чому це не косметика: якщо `runtimeVersion` буде з політикою `appVersion`, runtime рахується з `app.json`, а стор показує `versionName` із gradle. Розбіжність = OTA летять не в ту збірку.
- `versionCode` **не чіпай руками** — ним керує EAS через `appVersionSource: "remote"`. Після першого білда зафіксуй у плані фактичне значення.

### Правило локфайлу (не змінювати)

EAS-профілі на Node `20.19.4`. Не регенеруй `package-lock.json` під Node 24 / npm 11.

```bash
npx -p node@20.19.4 -p npm@10 npm install --package-lock-only --include=dev --include=optional --include=peer
npx -p node@20.19.4 -p npm@10 npm ci --include=dev
```

---

## 5. Інваріанти спільного редагування (порушувати не можна)

Аркуш персонажа має кілька редакторів. Повна модель — `docs/collaborative-editing.md`. Короткий звід, який тримати в голові при кожній правці синку:

1. **Ніяких read-modify-write на `characterSheets` без транзакції.** Поточний `upsertCharacterSheetFromLocal` робить `get()` → збирає **весь** документ → `set(merge:true)`. Це втрата чужих змін. Нові записи — через `runTransaction` або точкові `update()` по полях.
2. **`owners` і `editors` ніколи не пишуться зі stale-read.** Права змінює лише окрема операція (`addEditor`/`removeEditor` у транзакції). Звичайний upload персонажа **не має** торкатися цих полів.
3. **`changeHistory` не перезаписується масивом.** Додавання — через `arrayUnion` (уже експортований із `src/services/firebase.ts`) або окрему підколекцію. Інакше паралельний редактор стирає історію іншого, а на історії тримається все виявлення віддалених змін.
4. **Час подій — серверний.** `now()` = `serverTimestamp()` уже використовується для `updatedAt`, але `changeHistory[].atMs` і `lastSyncAt` — клієнтський `Date.now()`. Порівняння часу між двома девайсами з різними годинниками ламає визначення «що змінилось у хмарі». Нової логіки на клієнтському часі не додавай.
5. **Гранулярність merge — продуктове рішення, не деталь.** Секція `combat` містить hp, ac, initiative, speed, hitDice, deathSaves, weapons, conditions. Через це DM, що крутить HP, і гравець, що ставить condition, отримують конфлікт на всю секцію. Дроблення секцій — лише за планом із `docs/collaborative-editing.md`, з тестами.
6. **Спільне редагування тестується тільки на двох клієнтах.** Емулятор + фізичний девайс, два різні акаунти (owner і editor). Не пиши «синк перевірено», якщо запускав один клієнт.
7. **Видалення акаунта не видаляє чужі дані.** Є інші owners/editors — прибрати себе з масивів, за потреби передати ownership, документ видаляти лише коли не залишилось нікого.
8. **Кількість слухачів має значення.** `CharacterCard` підписується `subscribeCharacterSheet` **на кожну картку**, плюс `subscribeMySheets` і `subscribeSharedWithMe`. Нових підписок без потреби не додавай — це батарея й квота читань Firestore.

---

## 6. Заборонено до релізу (scope freeze)

- ❌ Підвищувати Expo SDK 54 → 57 / RN. `npm audit fix` пропонує `expo@57.0.8` — **не робити**, мажор за три тижні до релізу.
- ❌ Стартувати нові фічі поза Campaign Management (див. виняток вище) —
  Campaign Management це єдиний свідомо дозволений виняток.
- ❌ Переписувати архітектуру навігації, схему Firestore, модель даних персонажа. Точкові фікси синку — можна й потрібно, рерайт — ні.
- ❌ Змінювати `applicationId`/`package` (`com.vind.MythgateDND`) — після публікації незмінно.
- ❌ Комітити keystore, `credentials.json`, сервісні акаунти, `*.jks/*.p12/*.pem`.
- ❌ Косметичний рефакторинг у файлах поза поточною задачею.
- ❌ Розпилювати `useCharacterActions.tsx` (3494 рядки) — головний ігровий екран, ризик регресій. Після 1.0.

---

## 7. Пріоритети

Порядок — за спринтами у `docs/release-plan-google-play.md`:

1. **R1** Play Console + допуск (акаунт, перший AAB у closed testing, видалення акаунта, Privacy Policy, permissions, підпис, версії).
2. **R2** Спільне редагування + безпека (правила Firestore, транзакції, історія, мертвий код).
3. **R3** Продуктивність + спостережуваність (холодний старт, R8, Analytics, Crashlytics, ErrorBoundary).
4. **R4** EAS Update + store listing + бренд.
5. **R5** Production access + реліз зі staged rollout.

---

## 8. Правила по темах

### 8.1 Analytics / Crashlytics

- **Не створюй новий шар телеметрії.** Є фасад `src/shared/services/telemetry/productTelemetry.ts` (`trackProductEvent`, типізований union `ProductEventName`, локальний буфер 250 подій). Викликається з `src/screens/Home/Home.tsx` і `useCharacterActions.tsx`.
- Firebase Analytics підключати **всередині** цього модуля. Ніде більше не імпортувати `analytics()`.
- **Жодного PII у параметрах**: без email, `uid`, імен персонажів, текстів нотаток. Тільки типи/кількості.
- Для спільного редагування додати події: `sheet_shared`, `editor_added`, `editor_removed`, `remote_change_applied`, `conflict_shown`, `conflict_resolved_{local|cloud|later}`, `permission_denied_on_upload`. Це єдиний спосіб побачити, наскільки конфлікти дістають людей у реальних сесіях.
- Перемикач згоди в Settings + `setAnalyticsCollectionEnabled`.
- Ставити через `npx expo install`, версія з лінії `@react-native-firebase/app@23.8.8`.
- Crashlytics — тією ж задачею, разом із root `ErrorBoundary`.

### 8.2 EAS Update

Зараз `expo-updates` **немає** в `package.json`, а в манифесті `expo.modules.updates.ENABLED = false`. OTA не працює.

1. `npx expo install expo-updates`.
2. `app.json`: `updates.url`, `runtimeVersion` (обрати `appVersion` або `fingerprint` і **зафіксувати**), `fallbackToCacheTimeout`.
3. `eas.json`: `channel` у `preview` і `production`.
4. Вручну в `AndroidManifest.xml`: `ENABLED=true` + updates-метадані як їх генерує prebuild (звірити з докою, не вгадувати), позначити `// manual:`.
5. **Живий тест обов'язковий**: `eas update --branch preview` → встановлений preview-білд підхоплює апдейт після рестарту.
6. Межа: OTA = тільки JS/асети. Permissions, іконки в `res/`, нові нативні модулі = новий AAB.
7. У фазі closed testing OTA особливо цінний: правиш JS-баги без нового кола ревʼю і **не збиваєш 14-денний відлік**.

### 8.3 Логотип і бренд (чекаємо дизайнера)

`assets/icon.png`, `adaptive-icon.png`, `splash-icon.png` — три ідентичні файли по 497 КБ. Плюс уже згенеровані `android/.../res/mipmap-*` і `drawable-*/splashscreen_logo.png`.

- Не вигадуй логотип, не редагуй існуючі PNG. Чекай асети.
- Коли прийдуть: оновити `assets/*` **і** `res/mipmap-*` + `drawable-*`; стиснути PNG.
- Специфікація для дизайнера — R4 у плані релізу.
- `app.json` має `userInterfaceStyle: "light"` при наявній темній темі й білий `splash.backgroundColor` — узгодити з дизайном.
- **Реліз не залежить від дизайнера.** Немає асетів до дедлайну — виходимо на поточній іконці, бренд віддаємо наступним AAB (іконка нативна, через OTA не оновлюється).

### 8.4 Безпека

- `firestore.rules` — головна межа безпеки, і з кількома редакторами її ціна вища. Дірки — в `docs/audit-2026-07.md` (SEC-1…SEC-6). Найсерйозніша — **SEC-2, захоплення `emailIndex`**: саме через нього йде шаринг по email.
- Кожну зміну правил супроводжуй переліком дозволених/заборонених запитів. Правила не «перевіряються» читанням — потрібен `firebase emulators:exec`.
- Мертві модулі `src/shared/services/firestore/{firestore.ts,pdocs.ts,sharing.ts,loger.ts}` нікуди не імпортуються, але звертаються до колекцій без правил (`docs`, `docShares`, `sharedDocs`, `demoItems`) і роблять `addDoc` у `users`. **Видалити цілком.**
- Уразливості: 23 записи, **усі в build/dev-тулчейні** — ризик для машини розробника й CI, а не RCE у публічному APK. Формулюй так. Закривати через `overrides` ті, де фікс без мажора: `tar`, `shell-quote`, `undici`, `ws`, `js-yaml`, `fast-uri`, `protobufjs`, `brace-expansion`. Після кожного — `npm ci` + `validate` + `test:unit` + локальний Android-білд.
- Firebase Android API key обмежити в Google Cloud Console по package + SHA-1. **Після налаштування Play App Signing додати новий SHA-1 у Firebase і в OAuth client** — інакше Google Sign-In зламається саме в проді.
- **Локальний debug-білд (`npm run android`) підписується `android/app/debug.keystore`** (закомічений у репо), а **не** стандартним `~/.android/debug.keystore` — так налаштовано в `android/app/build.gradle:110,124` навмисно, щоб SHA-1 debug-збірки був однаковий у всієї команди. Якщо після нового `npm run android` Google Sign-In падає з помилкою 10 (DEVELOPER_ERROR) — бери SHA-1 саме з `android/app/debug.keystore` (`keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android`), не з домашнього. Перевірено 2026-08-12: реліз (`eas build`) цього не стосується — там окремі EAS-керовані credentials (`MYAPP_UPLOAD_*`), SHA-1 для Play App Signing вже зареєстрований окремо.
- 39 `console.*` у прод-коді (було 27 — зросло, регрес, перевірено 2026-08-12) — прибрати або за `__DEV__`. Частина в шляху синку й друкує дані документів.

### 8.5 Оптимізація

Головне — **холодний старт**. `AppNavigator.tsx`/`TabNavigator.tsx` статично тягнуть усі екрани, а через них на етапі evaluate бандла синхронно виконується:

- `src/data/srd/index.ts` — 12 статичних `import` JSON (`monsters.json` 698 КБ, `spells.json` 508 КБ);
- `src/domain/srd/srdRepository.ts:31-41` — **Zod-парсинг усіх колекцій на топ-левелі**;
- `src/domain/srd/localization.ts` — ще `uk/monsters.json` 843 КБ + `uk/spells.json` 628 КБ і побудова двох `Map`.

Разом ~2.7 МБ JSON + повна валідація до першого кадру. Мій замір у vitest на x86 — ~2.5 с, але це середовище з transform-оверхедом; **на телефон не переносити**.

Порядок: (1) зміряти на реальному mid-range Android у release-білді; (2) `require()` у мемоізованих геттерах; (3) `Map`-індекси ліниво; (4) Zod для статичного SRD → build-time (`npm run validate:srd`), у рантаймі типізований каст, тести `src/domain/srd/*.test.ts` лишити зеленими; (5) за потреби `React.lazy` для Bestiary/Spellbook/DM.

Інше:
- `minifyEnabled` і `shrinkResources` вимкнені (немає `android.enableProguardInReleaseBuilds` / `android.enableShrinkResourcesInReleaseBuilds` у `gradle.properties`). Увімкнути + ProGuard-правила для RN Firebase/Reanimated + **повний smoke-тест релізного білда** (R8 ламає рефлексію).
- Невикористані пакети (0 імпортів у `src`): `react-native-fs`, `react-native-vector-icons`, `react-navigation@^5.0.0`, `expo-media-library`, `expo-intent-launcher`, `react-native-uuid`. Знімати по одному, кожен раз `validate` + білд. **Не знімати** `react-native-pager-view` і `react-native-tab-view` — peer для `@react-navigation/material-top-tabs`.
- `App.tsx:7` — `import 'expo-dev-client'` безумовний. Обгорнути в `if (__DEV__)`.
- `App.tsx:31-33` — `return null` до готовності i18n → біла пауза. Використати `expo-splash-screen`.
- Немає root `ErrorBoundary` → біла сторінка без діагностики.
- `FlatList` у Bestiary/Spellbook без `initialNumToRender`/`maxToRenderPerBatch`/`windowSize`/`removeClippedSubviews`. Правильний приклад уже є в `CharacterModals.tsx:481-483`.
- **Edge-to-edge**: targetSdk = 36, а `expo.edgeToEdgeEnabled=false`. Для targetSdk 36 системний opt-out не працює — Android 15+ малює edge-to-edge незалежно від флага. Перевірити головні екрани, модалки й sticky-футери на Android 15/16 і полагодити інсети через `react-native-safe-area-context`.
- **Квота Firestore**: підписка на кожну картку в `CharacterCard` + дві колекційні підписки. З кількома редакторами читання множаться. Перед релізом порахувати очікувані читання на активного користувача за сесію.

---

## 9. Definition of Done

- [ ] `npx tsc --noEmit` — 0 помилок; `npm run lint` — 0 errors, ворнінги не зросли; `npm run test:unit` — зелено.
- [ ] Чіпав нативне/залежності → локальний `npm run android` або EAS-білд реально зібрався.
- [ ] Чіпав `firestore.rules` → перелічені дозволені/заборонені сценарії, є тести в емуляторі.
- [ ] Чіпав синк → перевірено **на двох клієнтах** із різними акаунтами (owner + editor).
- [ ] Чіпав `android/` → правка продубльована в `app.json` і позначена `// manual:`.
- [ ] Офлайн-сценарій: створення/редагування персонажа без мережі й без логіну.
- [ ] Немає нових `console.*`, `any`, сирих числових літералів у стилях.

---

## 10. Формат звіту

1. **Результат** — конкретно, одним абзацом.
2. **Змінені файли** — списком.
3. **Що перевірено** — команди й результат.
4. **Що НЕ перевірено** — прямо («на другому клієнті не тестував», «правила в емуляторі не гонив», «на Android 15 не дивився»).
5. **Залишковий ризик / наступний крок** — якщо є.

Спілкування — українською. Код, коментарі, імена подій, коміти — англійською.

---

## 11. Синхронізація з Codex (`.agents/`)

**Зроблено в комітах `804b8f7`/`5a9b392` (перевірено 2026-08-12):** `AGENT.md`,
`CODEX.md`, `MEMORY.md`, `TOOLS.md` уже вказують на release hardening і
`docs/release-plan-google-play.md` як джерело істини, спринти 1–6 позначені
завершеними, факт про кількох редакторів аркуша й правила про закомічений
`android/`/`versionName` у `build.gradle` присутні. Не переписуй ці чотири
файли мимохідь — вони актуальні.

`.agents/USER.md` лишався єдиним застарілим файлом (рядок про «поточний
запит» — Dice Roller → Character Sheet → …) — **виправлено 2026-08-12** на
посилання на release hardening фазу.

`.codex/` **не існує** в репозиторії (перевірено 2026-08-12) — попереднє
твердження, що це порожній каталог для видалення, було хибним, видаляти
нічого.

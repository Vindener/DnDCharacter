# Промти для Claude Code: спринти R1–R5

Куди покласти: `docs/claude-code-prompts.md`
Версія: 2026-07-26 · Узгоджено з `CLAUDE.md`, `docs/release-plan-google-play.md`, `docs/collaborative-editing.md`, `docs/audit-2026-07.md`

---

## Як цим користуватися

1. **Одна сесія — один промт.** Не склеюй два промти в одну сесію: у більшості з них треба тримати в контексті кілька великих файлів, а `useCharacterActions.tsx` сам по собі 3494 рядки.
2. **Спочатку встав промт P0.1** — він кладе документи в репо. Без нього всі решта промтів посилаються на файли, яких немає.
3. **Промти з міткою 🚧 GATE** — спочатку план, потім твоє «ок», і лише тоді код. Це місця, де помилка коштує даних користувачів.
4. **Промти з міткою 👤 HUMAN** Claude Code виконати не може — вони для тебе (Play Console, Firebase Console, девайс, два клієнти).
5. Якщо агент пише «перевірено», а команду не запускав — відкидай звіт і проси перезапустити. У промтах це вимога, але контролювати треба тобі.
6. Порядок промтів усередині спринту важливий: P2.1 перед P2.4, P2.3 після P2.1.

---

## Спринт 0 · Підготовка

### P0.1 · Встановити документи і синхронізувати агентські інструкції

```
Прочитай спочатку: README.md, package.json, .agents/AGENT.md, .agents/MEMORY.md,
.agents/TOOLS.md, .agents/CODEX.md, docs/archive/sprint-plan.md, docs/archive/ux-ui-roadmap.md.

Контекст: проєкт переходить із фази UX/UI-спринтів (усі 1-6 закриті) у фазу
release hardening перед публікацією в Google Play. Я додаю в репозиторій чотири
документи: CLAUDE.md у корені та docs/release-plan-google-play.md,
docs/collaborative-editing.md, docs/audit-2026-07.md. Файли я вже поклав сам —
перевір, що вони на місці, і прочитай їх повністю.

Задача:
1. Онови .agents/AGENT.md: блоки "Current Product Focus" і "Current Sprint Roadmap"
   замінити на короткий опис фази release hardening + посилання на
   docs/release-plan-google-play.md як на джерело істини. Технічні правила
   (no any, Pressable, токени, Firestore лише в сервісах, EAS/lockfile) НЕ ЧІПАЙ.
2. Онови .agents/MEMORY.md: спринти 1-6 позначити завершеними; додати факти —
   (а) аркуш персонажа редагують кілька людей одночасно (owners/editors),
   (б) android/ закомічений, тому prebuild на EAS не запускається,
   (в) versionName береться з android/app/build.gradle, не з app.json.
3. Онови .agents/TOOLS.md: додати розділ про закомічений android/, заборону
   `expo prebuild --clean` без узгодження і правило версій.
4. .agents/CODEX.md: у розділі "When Working On The Current Roadmap" замінити
   згадки Sprint 1 / Dice Roller на посилання на новий план.
5. Додай у docs/archive/sprint-plan.md і docs/archive/ux-ui-roadmap.md на початок файлу
   рядок-маркер: "Статус: історія. Поточний план — docs/release-plan-google-play.md".
   (Виконано; файли перенесено в docs/archive/ 2026-08-12.)
6. Видали порожній каталог .codex/.

Обмеження: жодних змін у src/, android/, package.json. Це документаційний таск.

Приймання: у .agents немає жодної згадки Sprint 1 як поточного пріоритету;
всі чотири нові документи згадані там, де це доречно.

Звіт: перелік змінених файлів + що саме змінилося в кожному.
```

---

### P0.2 · Видалити мертвий Firestore-код (SEC-6)

```
Прочитай спочатку: CLAUDE.md §8.4, docs/audit-2026-07.md розділ SEC-6,
src/shared/services/firestore/firestore.ts, pdocs.ts, sharing.ts, loger.ts.

Контекст: ці чотири модулі ніде не імпортуються (крім pdocs -> sharing), але
звертаються до колекцій docs, docShares, sharedDocs, demoItems, яких немає у
firestore.rules, і роблять addDoc(collection(fs,'users'), ...) — тобто створюють
сміттєві документи в users з випадковими id.

Задача:
1. Перевір сам, grep'ом по всьому репозиторію (включно з тестами і App.tsx), що ці
   файли справді ніде не використовуються. Якщо знайдеш живий імпорт — СТОП,
   не видаляй, доповідай.
2. Якщо імпортів немає — видали всі чотири файли.
3. Перевір, чи не лишилось після цього невикористаних експортів у
   src/services/firebase.ts та інших сусідніх модулях.

Обмеження: нічого іншого не рефакторимо, нових файлів не створюємо.

Приймання: npx tsc --noEmit = 0 помилок; npm run test:unit зелений;
grep по 'sharedDocs', 'docShares', 'demoItems' у src/ не дає результатів.

Звіт: які файли видалено, результати grep до і після, які команди запускав.
```

---

## Спринт R1 · Допуск до релізу

### P1.1 · Версії 1.0.0 (R1-3, PLY-6)

```
Прочитай спочатку: CLAUDE.md §4 (правило версій), app.json,
android/app/build.gradle, eas.json.

Контекст: піднімаємо версію до 1.0.0. Проєкт bare (android/ закомічений,
prebuild на EAS не запускається), тому versionName береться з
android/app/build.gradle, а НЕ з app.json. Якщо оновити лише app.json — стор
отримає 0.91.1.

Задача:
1. app.json: "version": "0.91.1" -> "1.0.0".
2. android/app/build.gradle: versionName "0.91.1" -> "1.0.0".
3. versionCode НЕ ЧІПАЙ — ним керує EAS через appVersionSource: "remote".
4. Перевір, чи версія не зашита ще десь (grep по '0.91.1' по всьому репо,
   включно з i18n, README, тестами). Якщо є — покажи мені список і запитай,
   перш ніж правити.
5. Додай у README.md короткий розділ "Versioning" із поясненням, чому
   versionName живе у двох місцях і чому versionCode не правиться руками.

Обмеження: нічого крім версій.

Приймання: grep '0.91.1' не дає результатів у app.json і build.gradle;
npx tsc --noEmit = 0 помилок.

Звіт: змінені файли; чи знайшлися інші місця з версією.
```

---

### P1.2 · Чистка permissions і невикористаних пакетів (R1-6, R1-7, PLY-3, PERF-3) 🚧 GATE

```
Прочитай спочатку: CLAUDE.md §4 і §8.5, docs/audit-2026-07.md PLY-3 і PERF-3,
android/app/src/main/AndroidManifest.xml, app.json, package.json,
src/screens/Support/Support.tsx.

Контекст: у манифесті висять RECORD_AUDIO, SYSTEM_ALERT_WINDOW,
READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE і requestLegacyExternalStorage.
Мікрофон приходить із expo-image-picker (запис відео), storage — з react-native-fs
і expo-media-library, які в коді не використовуються. Для Google Play кожен
чутливий дозвіл треба обґрунтувати; обґрунтувати мікрофон у D&D-компаньйоні нічим.
android/ закомічений, тому prebuild не запускається — правки в манифесті потрібні
руками, і паралельно app.json має відображати реальність.

ЕТАП 1 — ПЛАН, БЕЗ КОДУ. Зроби і покажи мені:
1. Grep-підтвердження, що react-native-fs, expo-media-library,
   expo-intent-launcher, react-native-vector-icons, react-navigation@5,
   react-native-uuid справді мають 0 імпортів у src/ і App.tsx.
2. Для кожного дозволу — звідки він приходить (який пакет / плагін) і що станеться
   після зняття.
3. Що саме зламається у файлових флоу: перевір src/shared/services/fileSerice.ts,
   імпорт бестіарію в Settings, експорт/шаринг персонажа, вибір аватарки.
   Чи достатньо expo-file-system + expo-document-picker + expo-sharing без
   react-native-fs і expo-media-library?
4. Список правок: манифест, app.json (android.permissions / blockedPermissions),
   package.json, конфіг плагіна expo-image-picker.
ЧЕКАЙ мого підтвердження.

ЕТАП 2 — після мого "ок":
- зняти дозволи в манифесті, кожну ручну правку позначити комент //
  manual: removed for Play policy (PLY-3);
- прибрати підтверджено невикористані пакети;
- синхронізувати app.json;
- у src/screens/Support/Support.tsx прибрати блок cryptoWallets і його UI
  (адреса USDT). Банківські посилання ПОКИ ЛИШИТИ — рішення по них ухвалюю я.

Обмеження: expo prebuild НЕ запускати. react-native-pager-view і
react-native-tab-view НЕ знімати — це peer-залежності
@react-navigation/material-top-tabs.

Приймання: npx tsc --noEmit = 0; npm run lint = 0 errors; npm run test:unit зелений;
у манифесті лишились тільки INTERNET і VIBRATE (+ те, що ти обґрунтував у плані).

Звіт: обов'язково окремо — що я мушу перевірити на девайсі власноруч
(імпорт файлу, експорт, аватарка) і чому ти цього перевірити не можеш.
```

---

### P1.3 · Видалення акаунта з коректним каскадом (R1-4, PLY-1, COL-10, SEC-5) 🚧 GATE

```
Прочитай спочатку: CLAUDE.md §5 (інваріанти спільного редагування),
docs/collaborative-editing.md розділ COL-10 і §3, docs/audit-2026-07.md PLY-1,
firestore.rules, src/screens/Settings/Settings.tsx,
src/shared/components/Firebase/Auth.tsx, src/services/users.ts,
src/repositories/characterCloudRepository.ts, src/dm/repositories/.

Контекст: Google Play вимагає видалення акаунта в застосунку + веб-URL для запиту.
Зараз такого флоу немає, а firestore.rules має allow delete: if false для users.
КРИТИЧНО: аркуші персонажів редагують кілька людей. Наївне "видалити всі мої
characterSheets" знищить дані інших людей.

ЕТАП 1 — ПЛАН, БЕЗ КОДУ:
1. Перелічи всі колекції й документи, де залишається слід користувача
   (users, emailIndex, connections, characterSheets, dmCampaigns, dmCampaignNotes,
   плюс будь-які, які знайдеш сам).
2. Для characterSheets і dmCampaigns* пропиши таблицю рішень:
   - я єдиний owner, редакторів немає -> видалити документ
   - я єдиний owner, є редактори -> передати ownership, себе прибрати з owners
   - я один із кількох owners -> прибрати себе з owners
   - я тільки editor -> прибрати себе з editors
3. Обґрунтуй, що з цього неможливо зробити з клієнта під правилами (після
   видалення users/{uid} і signOut прав добити решту немає) і запропонуй розподіл:
   що робить клієнт, що робить callable Cloud Function з адмін-правами.
4. Опиши UX: де в Settings, який re-auth (Google Sign-In потребує свіжої
   авторизації перед delete), які підтвердження, що показуємо при частковій
   помилці.
5. Перелічи, які тести напишеш.
ЧЕКАЙ мого підтвердження. Особливо узгодь зі мною, чи передаємо ownership
автоматично першому редактору, чи питаємо користувача.

ЕТАП 2 — після мого "ок":
- src/services/accountDeletion.ts — клієнтська частина + типи;
- callable Cloud Function із каскадом (окремий каталог functions/, якщо його
  ще немає — створи разом із мінімальним package.json і README, як розгортати);
- екран/діалог у Settings + i18n uk/en;
- firestore.rules: дозволити власнику delete на users/{userId} і на
  emailIndex/{email}, де uid == auth.uid;
- юніт-тести на всі чотири випадки з таблиці;
- у docs/release-plan-google-play.md познач R1-4 як зроблене і додай текст, який
  я маю опублікувати на веб-сторінці запиту на видалення.

Обмеження: нічого не видаляти "про запас". Локальні дані (AsyncStorage) — окреме
явне рішення, спитай мене, чи чистимо їх.

Приймання: npx tsc --noEmit = 0; npm run test:unit зелений з новими тестами.

Звіт: окремо і чітко — що я мушу перевірити на двох клієнтах із двома акаунтами
(owner видаляє акаунт -> у editor аркуш не зник, ownership передано) і що треба
зробити руками у Firebase Console для деплою функції.
```

---

### P1.4 · Privacy Policy (R1-5, PLY-2)

```
Прочитай спочатку: docs/audit-2026-07.md PLY-2, docs/collaborative-editing.md §1,
src/screens/LegalLicenses/LegalLicenses.tsx, src/screens/Settings/Settings.tsx,
src/i18n/locales/uk/settings.json, src/i18n/locales/en/settings.json,
src/i18n/locales/*/legal.json, src/services/users.ts,
src/repositories/characterCloudRepository.ts.

Контекст: Privacy Policy обов'язкова для Play Console. Текст має бути правдивим,
тому спершу з'ясуй по коду, які дані реально збираються й куди йдуть.

Задача:
1. Пройдись по коду і склади фактичний перелік: які поля користувача пишуться в
   Firestore (users, emailIndex), що містить characterSheets, що бачать
   співредактори, що бачить DM у changeHistory, які треті сторони задіяні
   (Firebase Auth, Firestore, Google Sign-In, у майбутньому Analytics/Crashlytics),
   що зберігається лише локально в AsyncStorage.
2. Напиши текст політики українською та англійською, у docs/privacy-policy.uk.md
   і docs/privacy-policy.en.md. Обов'язково окремими абзацами:
   - вміст аркуша персонажа стає видимим людям, яких запросили як співредакторів;
   - DM бачить журнал змін (хто і що змінив) у спільних аркушах;
   - як видалити акаунт і що саме видаляється (посилайся на флоу з P1.3);
   - що працює локально без акаунта.
   Без юридичного пафосу, простою мовою, без обіцянок, яких код не виконує.
3. Додай у Settings пункт "Політика конфіденційності" поряд із Legal & Licenses,
   через Linking на URL. URL винеси в одну константу з коментарем, що його
   підставляю я.
4. i18n-ключі для uk і en.

Обмеження: не вигадуй практик, яких у коді немає (наприклад, не пиши про
шифрування на спокої, якщо це просто дефолт Firestore — так і формулюй).

Приймання: npx tsc --noEmit = 0; npm run lint = 0 errors; пункт видно в Settings
в обох мовах.

Звіт: перелік даних, який ти вивів із коду (я звірю його з тим, що буду заповнювати
в Data Safety), + що лишилось за мною (захостити URL).
```

---

## Спринт R2 · Спільне редагування і безпека

### P2.1 · Кореневий фікс запису: COL-1 + COL-2 + COL-3 🚧 GATE ← найважливіший промт усього релізу

```
Прочитай спочатку: CLAUDE.md §5, docs/collaborative-editing.md ПОВНІСТЮ,
docs/audit-2026-07.md розділ 3, src/repositories/characterCloudRepository.ts,
src/services/characterSyncCoordinator.ts, src/shared/helpers/sync/conflictPolicy.ts,
src/services/firebase.ts, firestore.rules.

Контекст. Аркуш персонажа редагують кілька людей одночасно (owner + editors).
upsertCharacterSheetFromLocal робить get() -> будує ВЕСЬ документ із локального
стану -> set(payload, {merge:true}). merge:true не рятує, бо payload містить усі
поля. Наслідки:
- COL-1: паралельний редактор тихо перезаписує чужі зміни, без конфлікт-модалки;
- COL-2: changeHistory пишеться цілим масивом зі stale-read і стирає записи іншого
  редактора; а на changeHistory тримається remotePathsSinceLastSync
  (useCharacterActions.tsx:628-632), тому після стирання чужі зміни перестають
  виявлятися взагалі і reconcileRemoteSnapshot повертає noop;
- COL-3: owners/editors беруться зі stale-read і пишуться назад — owner відкатує
  щойно доданого редактора, а editor ловить PERMISSION_DENIED, бо правило вимагає
  request.resource.data.editors == resource.data.editors.

Це один кореневий дефект: запис усього документа зі застарілого читання.

ЕТАП 1 — ПЛАН, БЕЗ КОДУ. Покажи мені:
1. Точну поточну послідовність запису: хто викликає syncToCloud, що воно передає
   в characterCloudRepository.upsertFromLocal, звідки беруться historyPaths і
   pendingPaths.
2. Пропозицію: content write пише ТІЛЬКИ змінені шляхи. Для цього потрібна явна
   таблиця відповідності sync-path -> Firestore field path
   (наприклад 'combat.hp.current' -> 'hp.current'). Склади цю таблицю за фактичною
   формою документа з buildCloudDocFromLocal. Для шляхів, яких у таблиці немає,
   потрібен безпечний фолбек — транзакційний merge усього документа через
   runTransaction, а не сліпий set.
3. Як додаємо журнал: arrayUnion (він уже експортований у src/services/firebase.ts)
   замість запису цілим масивом. Що робимо з поточним лімітом 50 записів
   (mergeBoundedHistory) — обрізання не має відбуватися в шляху запису.
4. Як прибираємо ownerUid/owners/editors із payload звичайного upload повністю.
5. Що станеться зі створенням нового аркуша (там документа ще немає) — цей шлях
   лишається окремим.
6. Перелік тестів, які напишеш.
7. Ризики: що може зламатися в DM-флоу (DMQuickEdit, DMSharedUpdates),
   у CreateCharacter і в bulkUpsertFromLocal.
ЧЕКАЙ мого підтвердження. Не пиши код на цьому етапі.

ЕТАП 2 — після мого "ок", реалізація в такому порядку:
а) таблиця path-map + функція mapSyncPathsToFieldPaths із тестами;
б) новий метод у characterCloudRepository для content write по шляхах
   (update() з точковими полями або runTransaction для фолбеку);
в) журнал через arrayUnion;
г) payload без полів доступу;
д) syncToCloud передає pendingPaths у новий метод;
е) тести.

Обмеження:
- НЕ переписуй архітектуру синку, НЕ вводь CRDT/OT, НЕ чіпай гранулярність секцій
  (це окремий промт P2.5);
- НЕ додавай нових any;
- операції зі складом доступу (addEditor/removeEditor) у цьому промті не чіпаємо
  окрім видалення їх із payload upload — вони окремо в P2.2.

Приймання: npx tsc --noEmit = 0; npm run lint = 0 errors; npm run test:unit зелений;
є тест, який доводить, що payload content write НЕ містить owners/editors/ownerUid;
є тест, який доводить, що два послідовні записи різних uid не стирають історію
одне одного.

Звіт: обов'язково окремим блоком — сценарій, який я мушу перевірити на двох
клієнтах (DM тисне -7 HP, гравець одночасно ставить condition -> обидві зміни
збереглися), і пряма констатація, що ти цього перевірити не міг.
```

---

### P2.2 · Операції зі складом доступу окремою транзакцією (R2-2, COL-3)

```
Прочитай спочатку: результат P2.1, CLAUDE.md §5 п.2,
docs/collaborative-editing.md COL-3 і §3 п.1,
src/repositories/characterCloudRepository.ts (рядки ~485-515),
src/components/ShareCharacterSheetModal.tsx, firestore.rules.

Контекст: після P2.1 звичайний upload персонажа більше не торкається
ownerUid/owners/editors. Тепер склад доступу має змінюватися тільки явними
транзакційними операціями.

Задача:
1. Привести до одного стилю (runTransaction) операції: addEditor, removeEditor,
   transferOwnership. Частина вже є на рядках ~490-510 і використовує tx.update —
   доведи до кінця й покрий тестами.
2. Кожна операція: перечитує документ у транзакції, перевіряє права, змінює ТІЛЬКИ
   поля доступу і updatedAt. Вмісту персонажа не торкається.
3. transferOwnership потрібен для видалення акаунта (P1.3) — узгодь інтерфейс із
   тим, що там зроблено.
4. ShareCharacterSheetModal перевести на ці операції, якщо він досі щось пише
   інакше.
5. Тести: editor не може викликати addEditor; owner може; передача ownership
   лишає документ доступним для решти редакторів; паралельний content write не
   конфліктує з access write.

Обмеження: правила Firestore у цьому промті не змінюємо (це P2.3), але якщо
побачиш, що операція неможлива без зміни правил — СТОП, доповідай, не міняй.

Приймання: npx tsc --noEmit = 0; npm run test:unit зелений з новими тестами.

Звіт: перелік операцій і їхніх інваріантів; що треба перевірити на двох клієнтах.
```

---

### P2.3 · Правила Firestore + тести в емуляторі (R2-3, R2-4, SEC-1…SEC-4, COL-8) 🚧 GATE

```
Прочитай спочатку: firestore.rules, docs/audit-2026-07.md розділ 2 (SEC-1..SEC-6),
docs/collaborative-editing.md COL-8 і §4, src/services/users.ts,
src/shared/services/firestore/ (якщо ще існує), src/repositories/characterCloudRepository.ts
(запити subscribeMySheets / subscribeSharedWithMe), src/dm/repositories/.

Контекст, знайдені дірки:
- SEC-2 (найсерйозніша): emailIndex дозволяє create/update лише за умовою
  request.resource.data.uid == uid(), але НЕ перевіряє власника існуючого
  документа. Тобто будь-хто перезапише emailIndex/victim@example.com своїм uid і
  перехопить шаринг по email — а з правом редагування аркуша це прямий доступ до
  чужого персонажа.
- SEC-1: users має allow read: if isSignedIn(), тобто read = get + list =
  перелічення всієї бази користувачів.
- SEC-3 / COL-8: немає жодної валідації форми документів при create/update для
  characterSheets, dmCampaigns, dmCampaignNotes.
- SEC-4: connections дозволяє update будь-якому учаснику без immutability
  fromUid/toUid.
- SEC-5: users має allow delete: if false, що конфліктує з видаленням акаунта.

ЕТАП 1 — ПЛАН, БЕЗ КОДУ:
1. Для кожного правила покажи: поточний текст -> новий текст -> які саме запити
   з коду мають лишитися працездатними. Обов'язково звір із фактичними запитами:
   users where('emailLower','==',...), users where('uid','in',chunk),
   characterSheets where('owners','array-contains',me),
   characterSheets where('editors','array-contains',me), connections where...
   Якщо нове правило ламає якийсь із цих запитів — скажи це прямо в плані.
2. Для валідації форми (SEC-3) запропонуй МІНІМАЛЬНИЙ набір: обов'язкові ключі,
   типи критичних полів, обмеження довжини текстів і розмірів масивів. Не роби
   повну схему — вона застаріє і почне ламати клієнт.
3. Опиши, як налаштуємо емулятор: чи є вже firebase.json, які devDependencies
   потрібні, який npm-скрипт додамо (наприклад test:rules).
ЧЕКАЙ підтвердження.

ЕТАП 2 — після "ок":
- оновити firestore.rules;
- додати конфіг емулятора і скрипт npm run test:rules;
- написати тести за чеклістом із docs/collaborative-editing.md §4 (розділ
  "Правила"), мінімум: editor не змінює склад доступу; сторонній не читає аркуш;
  не можна перезаписати чужий emailIndex; list по users заборонений; owner може
  видалити свій users-документ; документ із невалідними полями відхиляється.

Обмеження: не вводь нових колекцій; не міняй форму документів у коді під правила —
правила підганяємо під наявну форму.

Приймання: npm run test:rules — тести падають на СТАРИХ правилах і проходять на
нових (покажи обидва прогони); npm run test:unit і npx tsc --noEmit не зламані.

Звіт: таблиця "правило -> що тепер дозволено -> що заборонено"; що я мушу зробити
руками (задеплоїти правила через firebase deploy --only firestore:rules).
```

---

### P2.4 · Серверний час у журналі та lastSyncAt (R2-5, COL-5)

```
Прочитай спочатку: результат P2.1, docs/collaborative-editing.md COL-5,
src/repositories/characterCloudRepository.ts (buildHistoryEntries, ~рядок 427),
src/services/characterSyncCoordinator.ts, src/services/firebase.ts,
src/screens/Character/hooks/useCharacterActions.tsx (рядки ~610-670),
src/types/Sync.ts.

Контекст: changeHistory[].atMs = Date.now() (годинник клієнта, що пише),
а syncState.lastSyncAt = Date.now() клієнта, що читає. Фільтр
entry.atMs > lastSyncAt порівнює час двох різних девайсів. Зсув годинника дає
два симетричні збої: зміни виглядають старими й ігноруються, або застосовуються
повторно нескінченно. now() у src/services/firebase.ts уже повертає
serverTimestamp() — він використовується для updatedAt, але не для журналу.

Задача:
1. Перевести час записів журналу на серверний. Врахуй, що serverTimestamp у
   масиві (arrayUnion) Firestore не підтримує — знайди рішення і опиши його в
   коментарі: варіанти — писати журнал у підколекцію з serverTimestamp, або
   тримати atMs як клієнтський, але додати серверне поле-курсор
   (наприклад lastChangeAt на документі) і порівнювати за ним. Обери одне,
   обґрунтуй, зроби.
2. lastSyncAt зберігати як серверний час останнього застосованого віддаленого
   запису, а не локальний Date.now().
3. Оновити фільтр remotePathsSinceLastSync відповідно.
4. Тести: девайс із годинником, зсунутим на +10 і -10 хвилин, отримує коректний
   набір remotePathsSinceLastSync (замокай час, не покладайся на реальний).

Обмеження: не переходь на підколекцію журналу "по дорозі", якщо це тягне більше
ніж один файл змін — тоді запропонуй це окремою задачею й зроби мінімальний
варіант із серверним курсором.

Приймання: npx tsc --noEmit = 0; npm run test:unit зелений; є тест на зсув часу.

Звіт: яке рішення обрав і чому; що треба перевірити на двох девайсах із різними
годинниками.
```

---

### P2.5 · Дрібніші секції синку (R2-6, COL-4)

```
Прочитай спочатку: результат P2.1, docs/collaborative-editing.md COL-4 і §3 п.4,
src/shared/helpers/sync/conflictPolicy.ts,
src/services/characterSyncCoordinator.ts (mergeCharacterBySections),
src/shared/helpers/sync/conflictPolicy.test.ts,
src/services/characterSyncCoordinator.test.ts, src/types/Character.ts.

Контекст: секція combat зараз містить hp, ac, initiative, speed, hitDice,
deathSaves, weapons, conditions, combatTemplates, sessionMode. collectConflictPaths
еквалює конфлікт на рівні СЕКЦІЇ, тому DM, що крутить HP, і гравець, що ставить
condition, отримують конфлікт-модалку — при тому що поля різні. Це найчастіший
сценарій живої сесії, і він або засипає людей конфліктами, або тихо губить правки.

Задача:
1. Розбити combat на під-секції: combat.vitals (hp, tempHp, deathSaves),
   combat.defense (ac, speed, initiative, hitDice), combat.conditions,
   combat.weapons. Аналогічно розбити homebrew за під-типами
   (resources / trackers / fields / sections).
2. Оновити pathToSyncSection, CRITICAL_PATH_PREFIXES, collectConflictPaths і
   mergeCharacterBySections узгоджено.
3. Перевір, що жоден реальний шлях не став 'unknown' — це тиха деградація.
   Зроби тест, який проходить по всіх шляхах, що фактично генеруються в
   useCharacterActions.tsx, і перевіряє, що кожен мапиться на відому секцію.
4. Тести: HP vs condition -> НЕ конфлікт; HP vs HP -> конфлікт; ac vs hp -> не
   конфлікт; merge правильно бере з хмари лише ті під-секції, де немає pending.

Обмеження: НЕ роби семантичний merge числових лічильників (increment) і
arrayUnion для conditions — це після 1.0. Тут лише гранулярність.

Приймання: npx tsc --noEmit = 0; npm run test:unit зелений; існуючі тести
conflictPolicy і characterSyncCoordinator оновлені, а не видалені.

Звіт: таблиця "шлях -> нова секція"; які тести додано; що перевірити на двох
клієнтах.
```

---

### P2.6 · Видимі помилки синку (R2-7, COL-7, REL-2)

```
Прочитай спочатку: docs/collaborative-editing.md COL-7, docs/audit-2026-07.md REL-2,
src/repositories/characterCloudRepository.ts (bulkUpsertFromLocal, ~449),
src/repositories/characterLocalRepository.ts (~48),
src/services/characterSyncCoordinator.ts (catch у syncToCloud),
src/shared/services/toast/, src/shared/services/telemetry/productTelemetry.ts.

Контекст: помилки шляху синку глушаться. bulkUpsertFromLocal має порожній catch на
кожному персонажі; saveCharacters має catch (_error) { /* intentionally ignored */ };
у useCharacterActions низка .catch(() => {}). Через це PERMISSION_DENIED і будь-яка
інша відмова запису невидимі — людина думає, що зміна збережена. Окремо: syncToCloud
визначає конфлікт через message.toLowerCase().includes('conflict') — крихке
порівняння рядків замість кодів помилок Firestore.

Задача:
1. Ввести класифікацію помилок: очікувані (offline / unavailable -> тиха черга,
   як зараз) і неочікувані (permission-denied, resource-exhausted, invalid-argument,
   not-found -> видимі). Використовуй коди помилок Firestore, не текст повідомлення.
2. Для неочікуваних: toast користувачу зрозумілою мовою (uk/en через i18n) +
   trackProductEvent. Додай у ProductEventName події sync_failed і
   permission_denied_on_upload.
3. saveCharacters (локальний запис): збій більше не тихий — toast + подія. Це
   втрата даних персонажа, її не можна ховати.
4. bulkUpsertFromLocal: збирати список неуспішних і повертати його, а не глушити.
5. Замінити перевірку конфлікту по рядку на перевірку по коду.

Обмеження: не додавай retry-логіку й backoff — це окрема тема. Тут тільки
видимість.

Приймання: npx tsc --noEmit = 0; npm run lint = 0 errors; npm run test:unit
зелений; є тест, який доводить, що permission-denied призводить до видимого
повідомлення, а offline — ні.

Звіт: як тепер класифікуються помилки (таблиця код -> поведінка); які i18n-ключі
додано.
```

---

## Спринт R3 · Продуктивність і спостережуваність

### P3.1 · Інструментація холодного старту (R3-1, PERF-1)

```
Прочитай спочатку: docs/audit-2026-07.md PERF-1, CLAUDE.md §8.5, index.js, App.tsx,
src/navigation/AppNavigator.tsx, src/navigation/TabNavigator.tsx,
src/data/srd/index.ts, src/domain/srd/srdRepository.ts, src/domain/srd/localization.ts.

Контекст: перед оптимізацією потрібна цифра. Навігація статично імпортує всі
екрани, через них на етапі evaluate бандла синхронно виконується ~2.7 МБ JSON
(monsters 698 КБ, spells 508 КБ, uk/monsters 843 КБ, uk/spells 628 КБ) + Zod-парсинг
усіх колекцій на топ-левелі srdRepository. Мій замір у vitest на x86 дав ~2.5 с,
але це середовище з transform-оверхедом — на телефон це число не переноситься.

Задача:
1. Додати легкі мітки часу, які працюють і в release-білді: точка входу (index.js),
   старт App, готовність i18n, перший рендер AppNavigator, момент завершення
   ініціалізації SRD-модулів. Реалізуй через простий модуль
   src/shared/services/telemetry/startupTrace.ts з масивом марок і одним викликом,
   що друкує зведення.
2. У DEV — виводити в консоль таблицею. У release — за замовчуванням вимкнено,
   з можливістю включити через змінну (наприклад EXPO_PUBLIC_STARTUP_TRACE=1),
   щоб я міг зміряти саме release-білд.
3. Додати в docs/release-plan-google-play.md короткий рецепт: як я запускаю замір
   на девайсі і які саме команди adb дивлю.
4. НЕ оптимізувати нічого в цьому промті. Тільки замір.

Обмеження: жодних змін у src/data/srd, src/domain/srd, навігації.
Ніяких нових залежностей.

Приймання: npx tsc --noEmit = 0; npm run lint = 0 errors; у DEV видно таблицю марок.

Звіт: як увімкнути трейс у release; які саме числа я маю тобі принести для
наступного промту.
```

---

### P3.2 · Ліниве SRD + Zod у build-time (R3-2, R3-3, PERF-1) 🚧 GATE

```
Прочитай спочатку: результат P3.1 і числа заміру, які я тобі дам,
docs/audit-2026-07.md PERF-1, CLAUDE.md §8.5, src/data/srd/index.ts,
src/domain/srd/srdRepository.ts, src/domain/srd/localization.ts,
src/domain/srd/schemas.ts, src/domain/srd/*.test.ts,
src/domain/spellbook/spellLocalRepository.ts,
src/services/storeEffects/dmStoreEffects.ts.

Контекст: srdRepository.ts на рядках ~31-41 виконує parseSrdArray для 11 колекцій
НА РІВНІ МОДУЛЯ, а localization.ts імпортує 1.5 МБ українських перекладів і будує
два Map теж на рівні модуля. Усе це відбувається до першого кадру, бо навігація
статично тягне екрани.

ЕТАП 1 — ПЛАН, БЕЗ КОДУ:
1. Побудуй граф: хто саме тягне srdRepository і localization на старті
   (через які екрани й компоненти). Підтверди або опровергни, що це відбувається
   до першого рендера.
2. Запропонуй схему лінивості: require() у мемоізованих геттерах, Map-індекси на
   першому доступі. Покажи, які публічні функції змінять контракт (getSrdMonsters
   тощо) і хто їх викликає.
3. Запропонуй перенесення Zod-валідації в build-time: скрипт
   scripts/validate-srd.mjs + npm-скрипт validate:srd, у рантаймі — типізований
   каст. ВАЖЛИВО: схеми не видаляти, тести src/domain/srd/*.test.ts мають
   лишитися зеленими й продовжувати валідувати дані.
4. Оціни, що з цього дасть найбільший виграш за найменший ризик, і запропонуй
   порядок.
ЧЕКАЙ підтвердження.

ЕТАП 2 — після "ок": реалізуй у погодженому порядку, покроково, з прогоном тестів
після кожного кроку.

Обмеження: НЕ винось JSON з бандла в асети/мережу (це окрема велика зміна);
НЕ вводь React.lazy у цьому промті; не змінюй форму даних.

Приймання: npx tsc --noEmit = 0; npm run lint = 0 errors; npm run test:unit
зелений; npm run validate:srd проходить і ловить штучно зіпсований JSON (покажи,
що ловить); Bestiary, Spellbook, Character, References, DM працюють.

Звіт: що стало лінивим; що я мушу перезміряти на девайсі; чи впав час старту в
vitest-замірі (як груба перевірка напрямку, не як істина).
```

---

### P3.3 · Firebase Analytics + згода (R3-4)

```
Прочитай спочатку: CLAUDE.md §8.1, docs/audit-2026-07.md розділ 6,
src/shared/services/telemetry/productTelemetry.ts, src/screens/Home/Home.tsx,
src/screens/Character/hooks/useCharacterActions.tsx (рядок ~37),
src/screens/Settings/Settings.tsx, src/stores/, package.json.

Контекст: у проєкті вже є фасад телеметрії з типізованим union ProductEventName
(8 подій) і локальним буфером на 250 подій в AsyncStorage. Firebase Analytics
підключаємо ВСЕРЕДИНІ цього фасаду, ніде більше analytics() не імпортуємо.

Задача:
1. npx expo install @react-native-firebase/analytics — версія має бути з тієї ж
   лінії, що @react-native-firebase/app@23.8.8. Якщо expo install тягне
   несумісну — СТОП, доповідай.
2. У productTelemetry.ts: відправка події в Analytics + збереження в локальний
   буфер (буфер лишається як дебаг-канал).
3. Розширити ProductEventName подіями: app_open, character_created, dice_rolled,
   spell_viewed, monster_viewed, sheet_shared, editor_added, editor_removed,
   remote_change_applied, conflict_shown, conflict_resolved_local,
   conflict_resolved_cloud, conflict_resolved_later, permission_denied_on_upload,
   sync_failed, account_deleted. Частина вже існує — не дублюй.
4. Розставити виклики в реальних місцях: конфлікти в useCharacterActions,
   шаринг у ShareCharacterSheetModal, помилки з P2.6, видалення акаунта з P1.3.
5. ЖОДНОГО PII у параметрах: без email, uid, імен персонажів, текстів нотаток.
   Тільки типи й кількості (character_class, spell_level, roll_type,
   conflict_section). Додай коментар-правило біля типу параметрів.
6. Перемикач згоди в Settings: стан у сторі + persist, виклик
   setAnalyticsCollectionEnabled, за замовчуванням ВИКЛЮЧЕНО. i18n uk/en.
7. Тест: при вимкненій згоді відправка в Analytics не викликається, локальний буфер
   теж не пишеться.

Обмеження: android/ не чіпай без потреби; якщо плагін вимагає нативної правки —
опиши її окремо і позначай // manual:. Crashlytics у цьому промті НЕ додаємо.

Приймання: npx tsc --noEmit = 0; npm run lint = 0 errors; npm run test:unit
зелений; локальний білд збирається.

Звіт: список подій і їхніх параметрів (я звірю з Data Safety); що я мушу
перевірити в Firebase DebugView.
```

---

### P3.4 · Crashlytics + root ErrorBoundary (R3-5, REL-1)

```
Прочитай спочатку: docs/audit-2026-07.md REL-1, App.tsx,
src/shared/services/telemetry/productTelemetry.ts, src/shared/ui/, package.json.

Контекст: немає root ErrorBoundary — будь-яка помилка рендера дає білий екран без
діагностики. І немає Crashlytics, тобто в проді причини падінь не буде видно
взагалі.

Задача:
1. npx expo install @react-native-firebase/crashlytics (версія з лінії app@23.8.8).
2. Root ErrorBoundary у App.tsx: екран відновлення з кнопкою "Перезапустити",
   а не білий екран. Стилі через токени sp/fs/rd і кольори теми, i18n uk/en.
   Врахуй, що помилка може статися ДО готовності i18n — передбач фолбек-текст.
3. ErrorBoundary логує в Crashlytics (recordError) і в телеметрію.
4. Прив'язати uid до Crashlytics (setUserId) ТІЛЬКИ якщо це не суперечить згоді
   з P3.3 — якщо згоди немає, не прив'язувати.
5. Тест на ErrorBoundary: компонент, що кидає помилку, показує екран відновлення.

Обмеження: не чіпай логіку синку й екранів; ErrorBoundary має бути тонким.

Приймання: npx tsc --noEmit = 0; npm run test:unit зелений; локальний білд
збирається.

Звіт: як я перевірю штучний крах на девайсі; чи були потрібні нативні правки.
```

---

### P3.5 · Закрити транзитивні CVE через overrides (R3-6, SEC-7)

```
Прочитай спочатку: CLAUDE.md §4 (правило локфайлу) і §8.4,
docs/audit-2026-07.md SEC-7, package.json, .npmrc.

Контекст: npm audit дає 23 записи, усі в build/dev-тулчейні (у бандл користувача
не потрапляють). Вісім із них закриваються БЕЗ мажорного апгрейду:
tar, shell-quote, undici, ws, js-yaml, fast-uri, protobufjs, brace-expansion.
Решта тягне expo@57 — це мажор, і його ми до релізу НЕ робимо.

Задача:
1. Запусти npm audit --json і покажи актуальну картину (вона могла змінитися).
2. Додай у package.json секцію overrides ТІЛЬКИ для тих восьми пакетів, де фікс
   без мажора. Версії обери мінімально достатні, не "остання мажорна".
3. Оновлюй локфайл ЛИШЕ через Node 20 / npm 10, як вимагає CLAUDE.md §4:
   npx -p node@20.19.4 -p npm@10 npm install --package-lock-only --include=dev --include=optional --include=peer
   Потім перевір: npx -p node@20.19.4 -p npm@10 npm ci --include=dev
4. Прогони npm run validate і npm run test:unit.
5. Зафіксуй у docs/audit-2026-07.md, які CVE закриті, а які лишились до апгрейду
   Expo SDK після 1.0.

Обмеження: НЕ роби npm audit fix і НЕ підіймай expo/expo-* до 57. Якщо якийсь
override ламає збірку — відкати саме його і напиши про це, не тягни далі.

Приймання: npm ci під Node 20/npm 10 проходить; npm run validate і
npm run test:unit зелені; npm audit більше не показує ті вісім.

Звіт: до/після по severity; що лишилось і чому; чи змінювався package-lock.json
і яким саме способом (це критично, помилка тут ламає EAS-білд).
```

---

### P3.6 · Увімкнути R8/ProGuard і shrinkResources (R3-7, PERF-2) 🚧 GATE

```
Прочитай спочатку: docs/audit-2026-07.md PERF-2, CLAUDE.md §4 і §8.5,
android/app/build.gradle, android/gradle.properties, android/app/proguard-rules.pro,
package.json (список нативних залежностей).

Контекст: build.gradle читає прапорці android.enableProguardInReleaseBuilds і
android.enableShrinkResourcesInReleaseBuilds, яких у gradle.properties немає, тому
обидва false. Реліз іде без обфускації й без вирізання ресурсів. R8 ламає
рефлексію — це найризикованіша зміна всього релізу.

ЕТАП 1 — ПЛАН, БЕЗ КОДУ:
1. Перелічи всі нативні/рефлексивні залежності проєкту і для кожної скажи, чи
   потрібні keep-правила: @react-native-firebase/*, react-native-reanimated
   (правила частково є), react-native-svg, react-native-screens,
   react-native-gesture-handler, @react-native-google-signin, expo-*, zustand, zod і тд.
2. Покажи, які саме правила додаєш у proguard-rules.pro і чому.
3. Опиши, що я мушу перевірити після цього (повний smoke-тест release-білда).
ЧЕКАЙ підтвердження.

ЕТАП 2 — після "ок":
- додати прапорці в gradle.properties;
- додати keep-правила з коментарем // manual: R8 keep for <пакет>;
- НЕ вмикати обидва прапорці одночасно наосліп: спочатку minify, окремим коміт —
  shrinkResources, щоб можна було відкатити половину.

Обмеження: не чіпай reactNativeArchitectures, newArchEnabled, hermesEnabled.
expo prebuild не запускати.

Приймання: локальний release-білд збирається (./gradlew :app:bundleRelease або
npm run android -- --variant=release, як вийде в цьому середовищі). Якщо ти не
можеш зібрати Android локально — скажи це прямо і не вигадуй, що збірка пройшла.

Звіт: які правила додано; ОКРЕМИМ БЛОКОМ — повний чекліст smoke-тесту з
docs/release-plan-google-play.md §4, який я мушу пройти на release-білді вручну,
із поясненням, що саме R8 може зламати (Firestore-серіалізація, Reanimated,
Google Sign-In).
```

---

### P3.7 · Edge-to-edge на Android 15/16 (R3-8, PLY-7)

```
Прочитай спочатку: docs/audit-2026-07.md PLY-7, CLAUDE.md §2 і §8.5,
android/gradle.properties, src/navigation/AppNavigator.tsx, src/shared/ui/Screen.tsx,
src/screens/CreateCharacter/CreateCharacter.tsx (sticky-футер),
src/screens/Character/components/CharacterModals.tsx, App.tsx.

Контекст (перевірений факт, не припущення): targetSdk = 36 і compileSdk = 36,
беруться з react-native/gradle/libs.versions.toml через
expoAutolinking.useExpoVersionCatalog(). Для targetSdk 36 системний opt-off від
edge-to-edge не діє, тобто Android 15+ малює контент під системними барами
незалежно від expo.edgeToEdgeEnabled=false у gradle.properties. Частковий захист
уже є: react-native-safe-area-context і useSafeAreaInsets у AppNavigator.

Задача:
1. Пройдись по всіх екранах і компонентах, які малюють щось біля краю: Screen,
   таб-бар, хедери, модалки, sticky-футер CreateCharacter, ScrollView без
   bottom padding, StatusBar в App.tsx.
2. Зроби інсети консистентними через safe-area-context. Не хардкодь висоти барів.
3. Розберись, чи треба вмикати expo.edgeToEdgeEnabled=true і/або підключати
   react-native-edge-to-edge — обґрунтуй рішення в звіті. Якщо це нативна зміна,
   позначай // manual: і продублюй у app.json.
4. Перевір, що зміни не ламають поточний вигляд на Android 13/14 (там edge-to-edge
   не форсується).

Обмеження: не роби редизайн; тільки інсети й безпечні зони. Токени й теми не
чіпай.

Приймання: npx tsc --noEmit = 0; npm run lint = 0 errors; npm run lint:ui без
нових сирих літералів; npm run test:unit зелений.

Звіт: список екранів, які змінив; ОКРЕМО — що я мушу подивитися на реальному
Android 15/16 (список екранів зі скріншотами), бо ти цього перевірити не можеш.
```

---

### P3.8 · Дрібні перфоманс-фікси пакетом (R3-9, PERF-4…PERF-6, SEC-9)

```
Прочитай спочатку: docs/audit-2026-07.md PERF-4, PERF-5, PERF-6, SEC-9,
App.tsx, src/screens/Bestiary/Bestiary.tsx (~297),
src/screens/Spellbook/Spellbook.tsx (~710),
src/screens/Character/components/CharacterModals.tsx (~477-483) як приклад
правильного тюнінгу.

Задача, чотири незалежні дрібниці — роби послідовно, кожну окремим коміт:
1. App.tsx:7 — import 'expo-dev-client' виконується безумовно. Зроби умовним:
   if (__DEV__) { require('expo-dev-client'); }. Перевір, що dev-client досі
   працює в дев-режимі.
2. App.tsx:31-33 — замість if (!isI18nReady) return null використай
   expo-splash-screen: preventAutoHideAsync() на старті, hideAsync() після
   готовності i18n. Пакет уже встановлений. Прибери білу паузу.
3. FlatList у Bestiary і Spellbook: додай initialNumToRender, maxToRenderPerBatch,
   windowSize, removeClippedSubviews. Значення бери за прикладом
   CharacterModals.tsx:481-483, скоригуй під розмір карток. Дебаунс пошуку 250 мс
   уже є — НЕ ЧІПАЙ.
4. 27 викликів console.* у не-тестовому коді: прибери або сховай за __DEV__.
   Особлива увага до тих, що друкують вміст документів у шляху синку
   (characterCloudRepository, services/connections, CharacterMenu, fileSerice).
   Замість видалення в критичних місцях краще прокинути в телеметрію, якщо
   інформація справді потрібна.

Обмеження: жодного рефакторингу поза цими чотирма пунктами. Не чіпай
useCharacterActions.tsx структурно.

Приймання: npx tsc --noEmit = 0; npm run lint = 0 errors; npm run test:unit
зелений; grep 'console\.' по src/ без тестів показує тільки те, що за __DEV__.

Звіт: по кожному з чотирьох пунктів окремо; що перевірити на девайсі (скрол
1500+ монстрів, відсутність білого екрана на старті).
```

---

## Спринт R4 · EAS Update, store listing, бренд

### P4.1 · EAS Update (R4-1…R4-3) 🚧 GATE

```
Прочитай спочатку: CLAUDE.md §4 і §8.2, docs/audit-2026-07.md розділ 6,
package.json, app.json, eas.json,
android/app/src/main/AndroidManifest.xml (мета-дані expo.modules.updates.*).

Контекст: пакета expo-updates у package.json немає, у манифесті стоїть
expo.modules.updates.ENABLED = false, в eas.json немає channel. OTA не працює
взагалі. android/ закомічений, тому prebuild не додасть потрібні мета-дані —
їх треба вписати руками.

ЕТАП 1 — ПЛАН, БЕЗ КОДУ:
1. Які саме мета-дані expo.modules.updates.* потрібні в манифесті і які значення —
   звір із офіційною документацією expo-updates для bare-проєкту, НЕ ВГАДУЙ.
   Якщо доступу до доки немає — скажи це прямо і не пиши значення напам'ять.
2. runtimeVersion: політика appVersion чи fingerprint? Дай рекомендацію з
   обґрунтуванням. Врахуй, що app.json version і build.gradle versionName мусять
   бути однакові (див. CLAUDE.md §4) — при appVersion розбіжність зламає доставку
   апдейтів.
3. Які channel додаємо в eas.json і як вони мапляться на branch.
4. Що станеться з уже встановленими closed-testing білдами після цієї зміни.
ЧЕКАЙ підтвердження.

ЕТАП 2 — після "ок":
- npx expo install expo-updates;
- app.json: updates.url, runtimeVersion, fallbackToCacheTimeout;
- eas.json: channel у preview і production;
- манифест: ENABLED=true + мета-дані, кожна правка з комент // manual: EAS Update;
- у README.md і docs/release-plan-google-play.md додати розділ: як я публікую
  апдейт, і чітку межу — OTA це тільки JS/асети, а permissions, іконки в res/ і
  нативні модулі вимагають нового AAB.

Обмеження: не міняй versionName/versionCode; не запускай prebuild.

Приймання: npx tsc --noEmit = 0; npm run test:unit зелений.
Живий тест OTA ти виконати не можеш — це моя частина.

Звіт: покрокова інструкція для мене: як зібрати preview-білд, встановити,
опублікувати eas update --branch preview і переконатися, що апдейт підхопився
після рестарту. Плюс що робити, якщо не підхопився (як дивитися логи).
```

---

### P4.2 · Тексти для Play Console (R4-4, R4-6, PLY-8)

```
Прочитай спочатку: README.md, app.json, src/i18n/locales/uk/ і en/ (усі файли),
src/screens/LegalLicenses/LegalLicenses.tsx, docs/dnd-product-guidelines.md,
docs/audit-2026-07.md PLY-8, docs/collaborative-editing.md §1.

Контекст: треба заповнити store listing. Тексти мають описувати те, що застосунок
реально вміє (пройдись по екранах і i18n, а не по моїх словах), і не порушувати
торгові марки: НЕ використовувати "Dungeons & Dragons", "D&D", логотипи Wizards.
Дозволено: "5e", "SRD", "OGL", посилання на SRD-атрибуцію.

Задача, створити docs/store-listing.md з розділами:
1. App name (до 30 символів) — кілька варіантів.
2. Short description (до 80 символів) — uk і en, кілька варіантів.
3. Full description (до 4000 символів) — uk і en. Структура: що це, для гравця,
   для DM, спільні аркуші й синхронізація, офлайн-режим, homebrew, SRD-атрибуція.
   Без маркетингового пафосу й без обіцянок фіч, яких немає.
4. Реліз-нотатки для 1.0.0 — uk і en.
5. Чернетка відповідей на анкету content rating (насильство у контексті fantasy
   RPG-статистик, відсутність рекламы, відсутність UGC-обміну між незнайомцями vs
   наявність шаринга між запрошеними людьми — тут будь точним, це впливає на
   рейтинг).
6. Чернетка Data Safety: перелік типів даних із прив'язкою до коду, включно з
   передачею даних між користувачами (спільні аркуші, журнал змін видимий DM).
7. Перелік того, що я мушу підготувати сам: скріншоти 4-8 шт 1080x1920,
   feature graphic 1024x500, іконка 512x512 без прозорості.

Обмеження: жодних змін у коді. Це контентний таск. Не вигадуй фіч — якщо не
знайшов підтвердження в коді, не пиши.

Приймання: усі тексти в межах лімітів символів (перелічи фактичну довжину
кожного); жодної згадки заборонених марок.

Звіт: на чому базував опис фіч (перелік екранів/файлів); що вважаєш ризикованим
формулюванням і чому.
```

---

### P4.3 · Заміна бренду (R4-8) — запускати ТІЛЬКИ коли дизайнер віддав асети

```
Прочитай спочатку: CLAUDE.md §4 і §8.3, docs/release-plan-google-play.md R4
(специфікація асетів), app.json, assets/,
android/app/src/main/res/ (mipmap-* і drawable-*).

Контекст: android/ закомічений, prebuild не запускається, тому оновлення лише
assets/ і app.json НЕ змінить іконку в білді. Треба замінити ще й згенеровані
ресурси в android/app/src/main/res/. Поточні assets/icon.png, adaptive-icon.png і
splash-icon.png — три ідентичні файли по 497 КБ.

Нові асети лежать у: <Я ВКАЖУ ШЛЯХ>

Задача:
1. Перевір, що надані асети відповідають специфікації (adaptive icon 432x432,
   safe zone 66%, monochrome-шар, Play icon 512x512 без прозорості). Якщо чогось
   бракує — СТОП, перелічи, чого не хватає, і не роби half-way.
2. Стисни PNG без втрати якості (pngquant/oxipng, якщо доступні; інакше скажи, що
   стиснути не зміг).
3. Онови assets/* і всі android/.../res/mipmap-* та drawable-*/splashscreen_logo.png
   у правильних щільностях.
4. Онови app.json: icon, adaptiveIcon (foreground/background/monochrome),
   splash.image і splash.backgroundColor. Узгодь userInterfaceStyle: зараз "light",
   хоча в застосунку є темна тема (Theme-store) — запропонуй "automatic" і скажи,
   що зміниться.
5. Перевір, чи не лишилось старих файлів-сиріт у res/.

Обмеження: prebuild не запускати. Не редагуй і не "домальовуй" асети сам —
якщо потрібного розміру немає, ресайз роби тільки зменшенням, ніколи збільшенням.

Приймання: локальний білд збирається; розміри файлів до/після зафіксовані.

Звіт: таблиця "файл -> розмір до -> після"; що я мушу перевірити візуально на
девайсі (лаунчер, themed icon на Android 13+, сплеш у світлій і темній темі).
```

---

## Спринт R5 · Реліз

### P5.1 · Підготувати регресійний прогін (R5-1)

```
Прочитай спочатку: docs/release-plan-google-play.md §4 (регресійний чекліст),
docs/collaborative-editing.md §4 (тест-план), package.json.

Задача:
1. Перетвори чеклісти з цих двох документів на один робочий файл
   docs/release-checklist-1.0.0.md із чекбоксами, згрупований за тим, ЧИМ
   перевіряється: (а) автоматично командами, (б) вручну на одному девайсі,
   (в) вручну на двох девайсах із двома акаунтами, (г) у Play Console / Firebase
   Console.
2. Для групи (а) додай npm-скрипт release:check, який послідовно запускає
   typecheck, lint, lint:theme, test:unit, validate:srd (якщо існує після P3.2),
   test:rules (якщо існує після P2.3) і друкує зведення. Скрипт має падати з
   ненульовим кодом, якщо хоч щось не пройшло.
3. Для кожного ручного пункту вкажи, який дефект він ловить (посилання на ID:
   COL-1, PERF-2, PLY-3 тощо) — щоб я розумів, що не можна пропускати.
4. Окремо винеси короткий блок "що перевіряти після кожного OTA-апдейту" —
   він коротший за повний прогін.

Обмеження: не вигадуй тестів, яких немає в документах; не додавай E2E-фреймворк.

Приймання: npm run release:check запускається і коректно падає, якщо штучно
зламати один тест (покажи, що падає).

Звіт: структура чеклісту; скільки пунктів у кожній групі.
```

---

## 👤 Що Claude Code зробити не може — тільки ти

Не витрачай на це промти:

| Дія                                                                        | Коли              | Чому не агент                    |
| -------------------------------------------------------------------------- | ----------------- | -------------------------------- |
| Створити Play Console, оплатити $25, пройти верифікацію                    | **сьогодні**      | Особиста верифікація             |
| З'ясувати тип акаунта (personal / organization) і чи діє вимога 12/14      | **сьогодні**      | Дані з твого Dashboard           |
| Набрати 12 реальних тестувальників, стартувати closed testing              | **цього тижня**   | Найдовший пункт, 14 днів відліку |
| Play App Signing: отримати SHA-1, додати у Firebase Console + OAuth client | після першого AAB | Доступ до консолей               |
| Обмежити Firebase API key по package + SHA-1                               | R1                | Google Cloud Console             |
| Задеплоїти firestore.rules і Cloud Function                                | після P2.3 і P1.3 | Твої креденшели                  |
| Захостити Privacy Policy і сторінку запиту на видалення                    | після P1.4        | Твій хостинг                     |
| Зміряти холодний старт на реальному девайсі                                | після P3.1        | Фізичний девайс                  |
| Smoke-тест release-білда з R8                                              | після P3.6        | Фізичний девайс                  |
| Тести спільного редагування на двох клієнтах                               | після P2.1, P2.5  | Два девайси, два акаунти         |
| Перевірка edge-to-edge на Android 15/16                                    | після P3.7        | Девайс із новою ОС               |
| Живий тест OTA                                                             | після P4.1        | Встановлений білд                |
| Скріншоти, feature graphic, іконка 512x512                                 | R4                | Дизайн                           |
| Заповнити Data Safety, App content, submit                                 | R4-R5             | Play Console                     |
| Staged rollout і спостереження за Crashlytics                              | R5                | Play Console                     |

---

## Універсальний хвіст для будь-якого промту

Якщо агент починає розповзатися, додай у кінець:

```
Додаткові правила цієї сесії:
- Роби тільки те, що в задачі. Побачив суміжну проблему — запиши в звіт окремим
  списком "знайдено, не чіпав", але не виправляй.
- Не додавай нових залежностей без явної згадки в задачі.
- Не створюй нових any. Не додавай сирих числових літералів у стилі.
- Не запускай expo prebuild.
- Не переписуй package-lock.json інакше, ніж через Node 20 / npm 10.
- У фіналі звіту чітко розділи: (1) що зробив, (2) які команди РЕАЛЬНО запускав і
  з яким результатом, (3) що НЕ перевірив і чому, (4) що мушу перевірити я вручну.
- Якщо якусь команду в цьому середовищі запустити неможливо — скажи це прямо,
  не пиши "перевірено".
```

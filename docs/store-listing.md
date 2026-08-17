# Store Listing — чернетка (Google Play)

Дата: 2026-07-31. Джерела фактів — розділ 8 унизу. Ліцензія SRD 5.1 — **Creative Commons Attribution 4.0** (CC-BY-4.0), не OGL 1.0a; див. `.agents/docs/SRD_CC_v5.1.pdf` і оновлений `src/screens/LegalLicenses`. Жодна фіча нижче не вигадана — усе звірено з `src/i18n/locales/*` та відповідними екранами/сервісами.

Заборонено: «Dungeons & Dragons», «D&D», логотипи/бренди Wizards of the Coast. Дозволено: «5e», «SRD», «CC-BY-4.0», «5E compatible» (останнє — прямо дозволено текстом ліцензії SRD 5.1).

---

## 1. App name (ліміт 30 символів)

| Варіант                                              | Довжина |
| ---------------------------------------------------- | ------- |
| `Mythgate 5e Companion` (поточна назва в `app.json`) | **21**  |
| `Mythgate: 5e Companion`                             | **22**  |
| `Mythgate 5e Toolkit`                                | **19**  |
| `Mythgate: 5e Toolkit`                               | **20**  |

Рекомендація: лишити поточну `Mythgate 5e Companion` — вона вже відповідає лімітам і не потребує зміни `app.json`/бренду.

---

## 2. Short description (ліміт 80 символів)

### UK

| Варіант                                                                       | Довжина |
| ----------------------------------------------------------------------------- | ------- |
| «Лист персонажа, кубики, заклинання й бестіарій для 5e — офлайн і в хмарі.»   | **73**  |
| «Персонаж, кубики, заклинання й бестіарій 5e. Спільні листи, офлайн-режим.»   | **73**  |
| «Лист персонажа для 5e: HP, заклинання, кубики, бестіарій, спільна гра з GM.» | **75**  |

### EN

| Варіант                                                                       | Довжина |
| ----------------------------------------------------------------------------- | ------- |
| «Character sheet, dice, spells & bestiary for 5e — offline and in the cloud.» | **75**  |
| «Character sheet, spells, bestiary, dice — shared sheets, offline mode.»      | **70**  |
| «5e character sheet, dice roller, spellbook, bestiary, and GM tools.»         | **67**  |

---

## 3. Full description (ліміт 4000 символів)

### UK — **3110 символів**

Mythgate 5e Companion — незалежний застосунок-компаньйон для п'ятої редакції найпопулярнішої настільної рольової системи («5E compatible»). Це не заміна паперового аркуша чи книги правил, а інструмент для столу: лист персонажа, кубики, заклинання, бестіарій і інструменти майстра гри в одному застосунку.

**Для гравця:**
Лист персонажа має режими «Гра» і «Редагування»: у грі — швидкий доступ до HP, тимчасового HP, класу захисту, ініціативи, швидкості, бонусу майстерності, рятівних кидків, навичок, атак, слотів заклять і активних станів; у редагуванні — повне налаштування персонажа. Створення персонажа — покроковий майстер: раса, клас, передісторія, характеристики (стандартний масив, купівля балів, вручну, кидок кубиків або випадково), бойова база, спорядження, магія, особистість і власний (homebrew) контент. Вбудований кидок кубиків рахує перевірки, атаки, рятівні кидки й шкоду, підтримує перевагу/перешкоду, довільні формули та історію кидків. Книга заклять дозволяє шукати, фільтрувати за рівнем/школою/класом, позначати улюблені й підготовлені закляття та створювати власні. Бестіарій — довідник монстрів із фільтрами (складність, тип, середовище, розмір), закладками та можливістю додати монстра власноруч. Розділ довідок містить короткі правила бою, відпочинку, перевірок, рятівних кидків і спорядження.

**Для майстра гри (GM):**
Окремий розділ інструментів GM: огляд групи гравців, підготовка сутички (склад із персонажів і бестіарію, оцінка складності й досвіду), трекер ініціативи, нотатки кампанії з хмарною синхронізацією, і швидке редагування спільних персонажів (HP, AC, ініціатива, стани, слоти заклять, інвентар) прямо із сесії. Бестіарій має режим швидкого огляду для столу, а Книга заклять — приватні нотатки майстра для кожного закляття.

**Спільні аркуші й синхронізація:**
Власник персонажа може запросити редактора за електронною поштою — гравця або майстра. Зміни від інших редакторів надходять у реальному часі, а журнал змін показує, хто і що редагував (ви, майстер, гравець або конкретний користувач). Якщо локальна й хмарна версії розійшлися в одній секції, застосунок показує конфлікт і дає обрати: залишити локальну версію, узяти хмарну або відкласти рішення вручну. Хмарна синхронізація й шерінг працюють через вхід за Google-акаунтом.

**Офлайн-режим:**
Створення й редагування персонажа працює повністю офлайн і без входу в акаунт — застосунок локально-першим: усі дані спершу зберігаються на пристрої. Хмарна синхронізація та спільний доступ — додаткова функція для тих, хто хоче ділитися аркушем або мати резервну копію.

**Homebrew і власний контент:**
Підтримка власних рас, класів, підкласів і передісторій; власні поля, ресурси й розділи на аркуші персонажа; власні заклинання й монстри з імпортом та експортом у форматі JSON; власні номінали монет для інвентарю.

Довідковий контент правил (раси, класи, стани, спорядження тощо) використовує System Reference Document 5.1 за ліцензією Creative Commons Attribution 4.0 International (CC-BY-4.0). Mythgate 5e Companion — незалежний застосунок, не пов'язаний із Wizards of the Coast, і не використовує їхні товарні знаки чи логотипи.

### EN — **2982 characters**

Mythgate 5e Companion is an independent companion app for the fifth edition of the world's most popular tabletop roleplaying system ("5E compatible"). It doesn't replace your paper sheet or rulebook — it's a table tool: character sheet, dice, spells, bestiary, and GM tools in one app.

**For players:**
The character sheet has "Play" and "Edit" modes: Play gives quick access to HP, temporary HP, armor class, initiative, speed, proficiency bonus, saving throws, skills, attacks, spell slots, and active conditions; Edit gives full configuration. Character creation is a step-by-step wizard: race, class, background, ability scores (standard array, point buy, manual entry, dice roll, or random), combat basics, equipment, spells, personality, and homebrew content. The built-in dice roller handles checks, attacks, saving throws, and damage, with advantage/disadvantage, custom formulas, and roll history. The spellbook lets you search and filter by level/school/class, mark favorites and prepared spells, and add your own. The bestiary is a monster reference with filters (challenge, type, environment, size), pinning, and the option to add your own monster. The reference section has quick rules for combat, resting, checks, saving throws, and equipment.

**For Game Masters:**
A dedicated GM tools section: a party overview, encounter prep (build an encounter from characters and the bestiary with difficulty/XP estimates), an initiative tracker, campaign notes with cloud sync, and quick editing of shared characters (HP, AC, initiative, conditions, spell slots, inventory) right from the table. The bestiary has a quick-view mode for the table, and the spellbook supports private GM notes per spell.

**Shared sheets and sync:**
A character's owner can invite an editor by email — a player or a GM. Changes from other editors arrive in real time, and a change log shows who edited what (you, the GM, a player, or a specific user). If the local and cloud versions diverge in the same section, the app surfaces a conflict and lets you keep the local version, take the cloud version, or resolve it manually later. Cloud sync and sharing work through Google sign-in.

**Offline mode:**
Creating and editing a character works fully offline and without signing in — the app is local-first, storing data on the device first. Cloud sync and sharing are an optional layer for anyone who wants to share a sheet or keep a backup.

**Homebrew and custom content:**
Support for custom races, classes, subclasses, and backgrounds; custom fields, resources, and sections on the character sheet; custom spells and monsters with JSON import/export; custom coin denominations for inventory.

Rules-reference content (races, classes, conditions, equipment, and more) uses the System Reference Document 5.1 under the Creative Commons Attribution 4.0 International License (CC-BY-4.0). Mythgate 5e Companion is an independent app, not affiliated with Wizards of the Coast, and does not use their trademarks or logos.

---

## 4. Реліз-нотатки для 1.0.0

Google Play обмежує поле «Recent changes» ~500 символами — обидва варіанти вкладаються з запасом.

### UK — **353 символи**

> Перший публічний реліз Mythgate 5e Companion. Лист персонажа (гра/редагування), кидок кубиків, книга заклять, бестіарій, покрокове створення персонажа, GM-інструменти (підготовка сутички, трекер ініціативи, нотатки кампанії), спільні аркуші з синхронізацією та власний (homebrew) контент. Працює офлайн; хмара й шерінг — за бажанням через Google-акаунт.

### EN — **323 characters**

> First public release of Mythgate 5e Companion. Character sheet (play/edit), dice roller, spellbook, bestiary, step-by-step character creation, GM tools (encounter prep, initiative tracker, campaign notes), shared sheets with sync, and homebrew content. Works offline; cloud sync and sharing are optional via Google sign-in.

---

## 5. Чернетка Content Rating (IARC-анкета)

✅ **Фактично подана відповідь (продиктовано власником продукту 2026-08-13):
вікова категорія / цільова аудиторія — 13+.** Форма в Play Console заповнена
й підтверджена (R4-6, `docs/release-plan-google-play.md`). Узгоджується з
чернеткою нижче: fantasy violence без графіки, без сексуального контенту,
лексики, азартних ігор — типовий профіль для 13+, не для «для всіх» через
бойову тематику й не старша категорія через відсутність графічного насильства.

| Категорія                                 | Чернетка відповіді                                  | Обґрунтування (код/i18n)                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Насильство**                            | Мінімальний рівень / «Fantasy Violence» без графіки | Бойові механіки — виключно текст і числа (HP, шкода, стани «непритомний», «паралізований», «отруєний» — `src/i18n/locales/uk/character.json: conditions`). Немає зображень, анімацій чи описів крові/травм — це калькулятор і довідник, не візуальна гра                                                                                                              |
| **Сексуальний контент**                   | Відсутній                                           | Не знайдено в жодному екрані/i18n                                                                                                                                                                                                                                                                                                                                     |
| **Лексика**                               | Відсутня ненормативна лексика                       | Не знайдено в i18n-рядках                                                                                                                                                                                                                                                                                                                                             |
| **Контрольовані речовини**                | Не згадуються                                       | —                                                                                                                                                                                                                                                                                                                                                                     |
| **Азартні ігри / симуляція казино**       | Не містить                                          | Кидки кубиків — ігровий механізм 5e (перевірки/атаки/шкода, `src/screens/DiceRoller`), без ставок і без реальних чи умовних грошей на кону                                                                                                                                                                                                                            |
| **Реклама**                               | Немає реклами                                       | В `package.json` немає жодного рекламного SDK (AdMob тощо)                                                                                                                                                                                                                                                                                                            |
| **Цифрові покупки (Google Play Billing)** | Немає                                               | В `package.json` немає `react-native-iap` чи іншого billing-пакета                                                                                                                                                                                                                                                                                                    |
| ⚠️ **Оплати поза Play Billing**           | Є — потребує окремої уваги в анкеті                 | Екран «Підтримка» (`src/i18n/locales/uk/support.json`) має посилання на банківську картку (ПриватБанк), Monobank-банку та криптогаманець — зовнішні лінки (`Linking.openURL`), не Play Billing. Це не «digital purchases» у сенсі анкети, але окреме поле Play-політики платежів — заповнюй уважно, не плутай два пункти                                              |
| **Обмін даними між користувачами**        | Так, але не з незнайомцями                          | Власник аркуша сам вводить email конкретної людини, щоб надати доступ редактора (`createCharacter.json: storage.inviteEmail`; модель — `docs/collaborative-editing.md` §1: `owners[]`/`editors[]`, `connections.ts` створює звʼязок лише між двома вже відомими uid). Немає публічного профілю, пошуку чи списку користувачів, немає анонімного обміну з незнайомцями |
| **Обмін місцезнаходженням**               | Немає                                               | Немає permission на геолокацію й відповідного коду                                                                                                                                                                                                                                                                                                                    |

**Ризикована фраза, яку варто перевірити перед публікацією:** `support.json` → `donation.warning`: «Зараз збираємо гроші для публікації в Google Play» — це твердження про конкретну поточну мету збору. Якщо на момент публікації застосунку в Google Play ця мета вже неактуальна (гроші зібрано/витрачено), текст стане недостовірним і його варто оновити — це контентний, не структурний ризик, я не змінював його в межах цього завдання (обмеження «жодних змін у коді»).

---

## 6. Чернетка Data Safety

| Тип даних                                                                     | Збирається?                                                                                                                                                                | Мета                                                                | Передається іншим користувачам?                                                                                                                                          | Джерело в коді                                                                                                    |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Email-адреса                                                                  | Так, при вході через Google                                                                                                                                                | Автентифікація; визначення, кого запросити редактором аркуша        | Так — лише в межах конкретного запрошення                                                                                                                                | `@react-native-google-signin/google-signin`, `characterCloudRepository.ts`                                        |
| User ID (Firebase UID)                                                        | Так                                                                                                                                                                        | `ownerUid`/`owners[]`/`editors[]`, атрибуція записів у журналі змін | Так — видимий власнику/редакторам/DM саме цього спільного аркуша                                                                                                         | `docs/collaborative-editing.md` §1 (`changeHistory[].uid`), `src/screens/DM/DMSharedUpdates.tsx`                  |
| Контент користувача (дані персонажа: статистика, нотатки, інвентар, homebrew) | Так, лише якщо увімкнено хмарну синхронізацію (за замовчуванням — тільки локально)                                                                                         | Основна функція: зберігання й синхронізація аркуша персонажа        | Так — із конкретними запрошеними редакторами/DM, не публічно                                                                                                             | `characterCloudRepository.ts`, колекція Firestore `characterSheets`                                               |
| Журнал дій (яку секцію хто редагував і коли)                                  | Так, при хмарній синхронізації                                                                                                                                             | Виявлення конфліктів, атрибуція «хто що змінив»                     | Так — видимий власнику/редакторам/DM цього аркуша                                                                                                                        | `changeHistory[]`, `mergeBoundedHistory`                                                                          |
| Аналітика (типи подій, лічильники)                                            | Опційно, вимкнено за замовчуванням                                                                                                                                         | Покращення застосунку                                               | Ні; без email/uid/імен персонажів/текстів нотаток                                                                                                                        | `src/shared/services/telemetry/productTelemetry.ts`, `settings.json: analytics.toggle`                            |
| Звіти про збої (Crashlytics)                                                  | Так; UID прив'язується лише якщо є згода на аналітику **і** користувач увійшов                                                                                             | Діагностика збоїв                                                   | Ні, окрім самого Firebase як обробника                                                                                                                                   | `App.tsx` (`CrashlyticsUserBinding`)                                                                              |
| ⚠️ Фото (портрет персонажа/монстра)                                           | Технічно так, але лише **локальний шлях до файлу** (`file://…`), не сам файл-зображення — реального завантаження на сервер немає (в `package.json` немає Firebase Storage) | Портрет у листі персонажа                                           | Ні — шлях пишеться в хмарний документ, але на іншому пристрої/для іншого редактора він не резолвиться в зображення (по суті нефункціональне поле поза власним пристроєм) | `characterCloudRepository.ts:268,346` (`photoUri`), `CreateCharacter.tsx` (`ImagePicker.launchImageLibraryAsync`) |
| Файли (імпорт/експорт JSON персонажів/монстрів)                               | Ні — локальна файлова операція, нічого не надсилається розробнику                                                                                                          | Імпорт/експорт власного контенту                                    | Ні                                                                                                                                                                       | `expo-document-picker`, `expo-file-system`, `expo-sharing`                                                        |
| Реклама/рекламний ідентифікатор                                               | Не збирається                                                                                                                                                              | —                                                                   | —                                                                                                                                                                        | Немає рекламного SDK                                                                                              |
| Місцезнаходження                                                              | Не збирається                                                                                                                                                              | —                                                                   | —                                                                                                                                                                        | Немає permission/коду геолокації                                                                                  |

**Видалення даних:** є механізм видалення акаунта (`Settings → dangerZone`), який попередньо показує, що саме буде видалено/передано (`settings.json: dangerZone.preview*`), і не видаляє дані інших власників/редакторів спільного аркуша — користувача лише прибирають зі списків `owners[]`/`editors[]`, а документ видаляється тільки якщо власників не лишилось.

**⚠️ Знахідка, варта уваги (не фіксував — поза межами цього завдання):** поле `photoUri` фактично не працює як «спільне фото» між пристроями/редакторами, бо зберігається лише локальний шлях без завантаження файлу. Для Data Safety це добре (менше реальних даних передається), але як продуктовий факт — варто знати, що портрети не синхронізуються по-справжньому.

---

## 7. Що підготувати самостійно (не текст, не код)

- **Скріншоти телефону:** 4–8 шт, 1080×1920 (портрет, 9:16), JPEG або 24-біт PNG без альфа-каналу. Мають показувати реальний інтерфейс застосунку (Google Play забороняє мокапи неіснуючих фіч). За фактом коду є що показати: Home (мої персонажі), Лист персонажа (режим «Гра»), покроковий візард створення персонажа, Кидок кубика, Книга заклять, Бестіарій, Інструменти GM (огляд групи / підготовка сутички), Трекер ініціативи.
- **Feature graphic:** 1024×500, PNG/JPEG без альфа-каналу. Без «Dungeons & Dragons», без логотипів чи інших захищених назв Wizards.
- **Іконка застосунку для стору:** 512×512, 32-біт PNG, **без прозорості** (Play вимагає непрозорий фон для store-іконки — це окрема вимога від адаптивної іконки самого застосунку). ⚠️ Поточні `assets/icon.png` / `adaptive-icon.png` / `splash-icon.png` — тимчасові плейсхолдери (три ідентичні файли, чекають дизайнера — `CLAUDE.md §8.3`). Store-іконку варто робити з фінального бренду, а не з поточного плейсхолдера.

---

## 8. Джерела фактів

Опис фіч побудований виключно на реальному коді й перекладах, без слів користувача:

- `src/i18n/locales/uk/{home,character,createCharacter,dice,dm,initiative,references,settings,spellbook,bestiary,support,dnd,navigation}.json` (і англійські пари) — перелік екранів, вкладок, дій.
- `docs/collaborative-editing.md` §1 — модель `owners[]`/`editors[]`, live-підписка, журнал змін, секційний merge, стани синку.
- `src/services/connections.ts` — підтвердження, що «спільний доступ» — це звʼязок між двома конкретними вже відомими uid, не публічний обмін.
- `src/repositories/characterCloudRepository.ts` — поле `photoUri` та що саме потрапляє в хмарний документ.
- `src/screens/LegalLicenses/LegalLicenses.tsx` + новий `SRD_CC_v5.1.pdf` — ліцензійна основа.
- `package.json` — відсутність рекламних SDK, billing-пакетів, Firebase Storage.
- `README.md`, `app.json` — назва, версія, загальний опис проєкту.
- `docs/audit-2026-07.md` (PLY-8) — попередня трактовка trademark-питання, оновлена в межах цього завдання.

Функції, які **навмисно не згадані** в описі, бо вони позначені як незавершені за фактом i18n: `dm.json → lootGenerator.placeholder: "Генератор добичі (в розробці)"`, `references.json → soon: "Скоро"` (розділ «Предмети»).

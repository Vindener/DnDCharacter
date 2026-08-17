# Промти для Claude Code: Campaign Management (GM Workspace)

Куди покласти: `docs/campaign-management-prompts.md` (окремий файл, не змішувати з `docs/claude-code-prompts.md`, бо той — про R1–R5)
Версія: 2026-08-01 · Узгоджено з `CLAUDE.md`, `docs/release-plan-google-play.md`, `docs/collaborative-editing.md`, `docs/audit-2026-07.md`

---

## ⚠️ Свідомий виняток із release freeze

`CLAUDE.md` зараз прямо забороняє нові фічі й окремо називає GM Desktop Workspace як заборонений до релізу 1.0
(`docs/release-plan-google-play.md`, §3). Ця пачка промтів **свідомо порушує цей freeze** — рішення власника продукту,
не Claude Code. Тому:

1. **Промт C0 обов'язково йде першим** — він фіксує виняток у документах, щоб наступні сесії Claude Code/Codex не
   плуталися між "не додавай фіч" і цим файлом.
2. Уся робота ізольована від release-critical шляхів R1–R5: нова навігаційна гілка, нові файли, мінімум правок у
   вже наявних sync-шляхах (`characterCloudRepository.ts`, `campaignRepository.ts` — тільки додавання функцій, без
   переписування наявних).
3. Жодна зміна цієї пачки не повинна знижувати базову лінію якості з `CLAUDE.md` §2
   (`tsc` 0 помилок, `lint` 0 errors, `test:unit` зелений, ворнінги не зростають).
4. **C5 і C8 додають нові Firestore-колекції.** Кожна нова колекція = нова точка в каскаді видалення акаунта
   (`functions/src/deleteMyAccount.ts`, `CASCADE_COLLECTIONS`) — це вже P0-пункт релізу (R1-4/COL-10/SEC-5).
   Якщо забути оновити каскад, видалення акаунта в проді почне залишати сирітські документи. Це не опція,
   а обов'язковий крок у відповідних промтах.

---

## Архітектурні рішення, ухвалені заздалегідь

Щоб Claude Code не винаходив їх заново під час виконання і щоб різні сесії не розійшлися в підході:

- **Жодного email-інвайту для кампаній.** Наявний `addEditorByEmail` для персонажів спирається на `emailIndex`,
  де є непофіксена критична вразливість SEC-2 (захоплення чужого запису — `docs/audit-2026-07.md`). Дублювати цей
  шлях на нову сутність — множити ту саму діру. Замість цього — інвайт-код (C8), який узагалі не торкається
  `emailIndex`.
- **Session log і loot log — це не нові колекції, а тег на нотатці.** `DMCampaignNote` отримує необов'язкове поле
  `kind: 'note' | 'session' | 'loot'`. Це найдешевший спосіб дати те, що просили ("нотатки… та інші можливі речі"),
  не примножуючи Firestore rules surface.
- **Історія енкаунтерів — окрема сутність**, бо в неї структуровані дані (список гравців/монстрів, розрахована
  складність), а не вільний текст. Репозиторій копіює вже перевірений патерн `campaignNotesRepository.ts`
  (локальний кеш, офлайн-черга, conflict-стани) — не винаходити нову синхронізацію.
- **Прив'язка персонажа до кампанії — явна, через `campaignId`.** Вільний текст `character.campaign` лишається
  тільки для зворотної сумісності й legacy-фолбека (`buildLegacyCampaignFallbackId`), новий UI ним більше не пише.
- **Реальний генератор лута за таблицями SRD — поза скоупом цієї пачки.** `LootGenerator.tsx` зараз — заглушка;
  побудова рандомних таблиць скарбів з `equipment.json` — окрема, велика задача. Тут лут — лише структурований
  запис у журналі кампанії.

---

## Як цим користуватися

1. **Один промт — одна сесія**, як і в `docs/claude-code-prompts.md`.
2. **C0 — обов'язково перший.** Без нього решта промтів працює всупереч чинному `CLAUDE.md`.
3. Порядок усередині пачки важливий: **C1 → C2 → C3 → C4**, потім **C5** і **C6** незалежно одне від одного,
   **C7 — опціонально**, **C8 — окремою сесією в кінці** (найбільший за ризиком).
4. Промти з міткою **🚧 GATE** — спочатку план, твоє «ок», лише тоді код.
5. Промти з міткою **👤 HUMAN** Claude Code не виконає — вони для тебе.
6. Якщо агент пише «перевірено» без реального запуску команди — не приймай звіт.

---

## Спринт C · Campaign Management (GM Workspace)

### C0 · Зафіксувати свідомий виняток у документах 🚧 GATE

```
Прочитай спочатку: CLAUDE.md (повністю), docs/release-plan-google-play.md §3,
docs/campaign-management-prompts.md (цей файл, розділ "Свідомий виняток" і
"Архітектурні рішення").

Контекст: власник продукту свідомо вирішив додати Campaign Management
(GM Workspace) під час фази release hardening, порушуючи власний freeze з
CLAUDE.md. Це задокументовано в docs/campaign-management-prompts.md. Потрібно,
щоб CLAUDE.md і release-plan більше не суперечили цьому рішенню мовчки.

Задача:
1. У CLAUDE.md, одразу під банером "Фаза: RELEASE HARDENING", додай рядок:
   "Виняток: Campaign Management (GM Workspace, docs/campaign-management-prompts.md)
   свідомо додається паралельно з release hardening за рішенням власника
   продукту від 2026-08-01. Роботу з цієї пачки ізольовано від R1-R5;
   вона не звільняє від Definition of Done §9."
2. У §6 "Заборонено до релізу" зміни пункт "Стартувати GM Desktop Workspace…"
   на: "Стартувати нові фічі поза Campaign Management (див. виняток вище) —
   Campaign Management це єдиний свідомо дозволений виняток."
3. У docs/release-plan-google-play.md §3 ("Що навмисно НЕ входить у 1.0") біля
   пункту "GM Desktop Workspace" додай примітку в дужках: "(окрім Campaign
   Management MVP+, див. docs/campaign-management-prompts.md — свідомий
   виняток від 2026-08-01)".
4. Нічого іншого в цих файлах НЕ чіпай — жодного косметичного редагування.

Обмеження: жодних змін у src/, functions/, firestore.rules у цьому промті.
Це суто документаційний крок.

Приймання: CLAUDE.md і release-plan більше не читаються як категорична
заборона на цю роботу; жодного іншого тексту в цих файлах не змінено
(перевір діфом).

Звіт: точний діф трьох правок.
```

---

### C1 · Розширення домену кампанії: rename/delete/summary + тести

```
Прочитай спочатку: src/dm/domain/types/campaign.ts, src/dm/domain/campaign/*,
src/dm/repositories/campaignRepository.ts, src/dm/repositories/campaignRepository.test.ts,
firestore.rules (блок dmCampaigns), CLAUDE.md §5 (інваріанти спільного редагування).

Контекст: DMCampaign зараз можна тільки створити (ensureCampaignForName) і
оновити через upsertCampaign. Немає rename/delete на рівні репозиторію (хоча
firestore.rules delete: if isCampaignOwner() вже дозволяє), і немає полів для
короткого опису кампанії та орієнтовного рівня партії.

Задача:
1. У src/dm/domain/types/campaign.ts додай до DMCampaign необов'язкові поля:
   `summary?: string` (до 500 символів), `partyLevelEstimate?: number` (1-20).
2. У src/dm/repositories/campaignRepository.ts додай:
   - `renameCampaign(campaignId: string, name: string): Promise<DMCampaign | null>`
     — оновлює name + nameNormalized, зберігає id незмінним (id похідний від
     старої назви — це нормально, вже так із заголовків нотаток).
   - `updateCampaignSummary(campaignId: string, patch: { summary?: string;
     partyLevelEstimate?: number }): Promise<DMCampaign | null>`.
   - `deleteCampaign(campaignId: string): Promise<void>` — видаляє з
     локального кешу; якщо canCloudSync() — виконує db.collection('dmCampaigns')
     .doc(id).delete(). НЕ видаляй пов'язані нотатки/енкаунтери в цьому кроці —
     каскад видалення кампанії окремим рішенням продукту (задокументуй TODO
     в коді з посиланням на цей факт), інакше є ризик тихо втратити чужі нотатки
     спільного редактора.
3. Усі нові функції — без full-document read-modify-write без потреби:
   sanitizeCampaign/mapCloudCampaign вже є, використовуй їх.
4. Тести в campaignRepository.test.ts: rename зберігає id, delete прибирає з
   локального списку, summary/partyLevelEstimate валідні межі (обрізати/
   відхиляти значення поза межами, не кидати виняток).

Обмеження: НЕ чіпай upsertCampaign, subscribeAccessibleCampaigns, ensureCampaignForName
логіку — тільки додавання нових функцій поруч.

Приймання: npx tsc --noEmit — 0 помилок; npm run test:unit — зелено, нові тести
включно.

Звіт: список нових функцій, короткий опис кожної, результати команд.
```

---

### C2 · Екран «Мої кампанії» (список / створення / перейменування / видалення)

```
Прочитай спочатку: src/screens/DM/DM.tsx, src/screens/DM/style.ts,
src/navigation/DMNavigator.tsx, src/dm/repositories/campaignRepository.ts
(включно з новими функціями з C1), src/i18n/locales/{uk,en}/dm.json,
docs/ui-kit.md, .github/instructions/mobile-rn-standards.instructions.md.

Контекст: зараз немає жодного екрана зі списком усіх кампаній. DM.tsx відкриває
DMCampaignNotes/DMEncounterPrep одразу з campaigns[0]?.id — перша кампанія в
списку, без вибору. Потрібен явний екран керування.

Задача:
1. Створи src/screens/DM/DMCampaigns.tsx:
   - підписка через subscribeAccessibleCampaigns (як в інших DM-екранах);
   - список карток кампанії: назва, summary (якщо є), кількість персонажів
     (порахувати через ту саму логіку групування, що в DMPartyOverview —
     винеси її як спільну утиліту, якщо буде дублювання коду);
   - кнопка "+ Нова кампанія" — інлайн-форма (назва, необов'язковий summary),
     виклик ensureCampaignForName (щоб не плодити дублікати за нормалізованою
     назвою) або нової createCampaign, якщо в C1 з'явиться явний конструктор —
     інакше просто ensureCampaignForName;
   - на кожній картці: "Перейменувати" (inline edit, renameCampaign),
     "Видалити" з підтвердженням (Alert.alert, не мовчки), "Відкрити" →
     перехід на деталі кампанії (буде в C3; поки що можна вести на
     DMPartyOverview або DMCampaignNotes з campaignId — постав TODO, якщо
     DMCampaignDetail з C3 ще не існує на момент цього промту, онови посилання
     в C3).
2. Додай екран у DMNavigator.tsx: 'DMCampaigns: undefined'.
3. У DM.tsx замінити прямий перехід на campaigns[0]?.id кнопкою "Мої кампанії"
   → navigation.navigate('DMCampaigns'). Кнопки швидкого доступу до
   Encounter Prep / Campaign Notes лишити як є, якщо кампанія рівно одна —
   інакше теж вести через DMCampaigns.
4. i18n: додай ключі під dm:campaignsList.* у uk/dm.json і en/dm.json
   (не забудь про паралельні переклади — не залишай тільки uk).
5. Стилі — тільки токени (sp/rd/fs/typography, кольори з теми), без сирих
   чисел — так само, як в інших DM-екранах.

Обмеження: НЕ переписуй DM.tsx поза заміною конкретного переходу. Не чіпай
DMPartyOverview/DMCampaignNotes логіку синку.

Приймання: npx tsc --noEmit — 0 помилок; npm run lint — 0 errors, ворнінги не
зросли; npm run lint:ui — без нових порушень; npm run test:unit — зелено;
ручна перевірка (опиши, що саме подивився): створення кампанії офлайн і без
логіну працює (локальний-first інваріант з CLAUDE.md §3.8).

Звіт: список нових/змінених файлів, скріншот або опис структури екрана,
результати команд, що НЕ перевірено (наприклад, поведінка на другому клієнті).
```

---

### C3 · Деталі кампанії: явний roster (прив'язка/відв'язка персонажів)

```
Прочитай спочатку: src/screens/DM/DMPartyOverview.tsx, src/screens/DM/adapters/*,
src/dm/repositories/campaignRepository.ts, src/context/Character-store.ts,
src/context/Sync-store.ts (markLocalDraftPaths), CLAUDE.md §5 п.1 і п.5
(без full-document read-modify-write, гранулярність merge).

Контекст: DMPartyOverview лише читає й групує персонажів по кампанії через
збіг назви/campaignId — нема дії "прикріпити цього персонажа до цієї кампанії"
чи "відкріпити". Потрібен явний контроль замість неявного текстового збігу.

Задача:
1. Створи src/screens/DM/DMCampaignDetail.tsx (route params: { campaignId }):
   - секція "Учасники": показує unifiedParty (local+mine+shared, як у
     DMPartyOverview), відфільтровану по isCharacterInCampaign(character,
     campaign);
   - кнопка "Додати персонажа" → список персонажів, ЯКІ ЩЕ НЕ в цій кампанії
     (з усіх джерел, до яких є доступ) → "Прикріпити" викликає
     updateCharacter(id, { ...character, campaignId: campaign.id }) і одразу
     markLocalDraftPaths(id, ['overview.identity']) — точно так само, як
     існуюча міграційна логіка в DM.tsx/DMPartyOverview.tsx;
   - на кожному учаснику — "Відкріпити": campaignId → undefined. Обговори з
     власником продукту (постав явний коментар у коді), чи очищати legacy
     character.campaign одночасно — за замовчуванням: так, очищай обидва
     поля, інакше персонаж одразу "повернеться" в цю ж кампанію через legacy
     fallback matching (buildLegacyCampaignFallbackId/resolveCampaignForLink);
   - секція "Швидкі дії": посилання на DMCampaignNotes({campaignId}),
     DMEncounterPrep({campaignId}) — вже готові екрани, просто прокинь
     campaignId;
   - якщо в C1 додані summary/partyLevelEstimate — показати їх зверху з
     можливістю редагувати inline (updateCampaignSummary).
2. Онови DMCampaigns.tsx (з C2) — кнопка "Відкрити" веде саме сюди.
3. Онови DMNavigator.tsx: додай DMCampaignDetail: { campaignId: string }.

Обмеження: жодних змін у форматі запису character (тільки campaignId/campaign
поля, точковий шлях через updateCharacter, БЕЗ переписування всього документа
персонажа). Не чіпай Firestore-структуру characterSheets.

Приймання: npx tsc --noEmit — 0 помилок; npm run test:unit — зелено; ручно
перевір: прикріплення/відкріплення персонажа на локальному (без логіну)
профілі працює й переживає перезапуск застосунку (AsyncStorage).

Звіт: змінені файли, опис поведінки прикріплення/відкріплення, що НЕ
перевірено (два клієнти з живим Firestore).
```

---

### C4 · Явний picker кампанії в майстрі персонажа

```
Прочитай спочатку: src/screens/CreateCharacter/CreateCharacter.tsx (рядки
з полем campaign), src/screens/CreateCharacter/createCharacterWizard.ts,
src/dm/repositories/campaignRepository.ts, CLAUDE.md §3 п.8
(локально-перший режим не ламати).

Контекст: зараз "Кампанія" в майстрі персонажа — звичайний TextInput
(CreateCharacter.tsx, поле campaign). Це і є джерело автостворення кампаній
через ensureCampaignForName у DM.tsx/DMPartyOverview.tsx. Тепер, коли є явний
список кампаній (C2), логічно дати вибір із наявних + "створити нову" замість
вільного тексту.

Задача:
1. У CreateCharacter.tsx замінити TextInput для campaign на компонент вибору:
   - підписка на subscribeAccessibleCampaigns;
   - список наявних кампаній (Pressable-чіпи, як у DMCampaignNotes.tsx);
   - пункт "+ Нова кампанія…" — розкриває текстове поле для назви;
   - жодних мережевих викликів наперед — вибір і створення повністю офлайн
     (ensureCampaignForName вже це вміє через AsyncStorage).
2. Обране значення пиши одразу в обидва поля драфта: `campaign` (текст, для
   зворотної сумісності) і, після збереження персонажа, `campaignId` (через
   ensureCampaignForName в момент сабміту форми — подивись, як це вже
   робиться в DM.tsx useEffect runMigration, і перевикористай той самий
   виклик, а не дублюй логіку).
3. createCharacterWizard.ts: переконайся, що campaignId прокидається в
   фінальний DTO персонажа поряд із campaign (рядок 726 — цей файл уже
   мапить campaign, додай campaignId туди ж).
4. i18n: онови ключі identity.campaign (uk/en createCharacter.json), якщо
   змінюється підпис поля.

Обмеження: не чіпай інші кроки майстра, не переписуй createCharacterWizard.ts
поза точковою правкою.

Приймання: npx tsc --noEmit — 0 помилок; npm run test:unit — зелено
(createCharacterWizard.test.ts і CreateCharacter.test.tsx далі проходять,
онови їх за потреби під новий UI); ручна перевірка: створення персонажа
офлайн і без логіну з новою кампанією або з обраної наявної — працює.

Звіт: змінені файли, скріншот/опис нового UI поля, результати команд.
```

---

### C5 · Історія енкаунтерів кампанії (нова синхронізована сутність) 🚧 GATE

```
Прочитай спочатку: src/dm/domain/types/encounter.ts, src/dm/domain/types/notes.ts,
src/dm/repositories/campaignNotesRepository.ts (ПОВНІСТЮ — це патерн для
копіювання), src/domain/schemas/campaignNote.schema.ts, firestore.rules
(блоки dmCampaignNotes і dmCampaigns), functions/src/deleteMyAccount.ts
(CASCADE_COLLECTIONS), src/screens/DM/DMEncounterPrep.tsx.

Контекст: DMEncounterPrep рахує складність енкаунтера, але нічого не
зберігає — після виходу з екрана підготовлений енкаунтер зникає. Потрібна
персистентна історія енкаунтерів прив'язана до кампанії, з тим самим рівнем
надійності (офлайн, конфлікти), що вже є в campaignNotesRepository.

Це найризикованіший промт пачки — тому спершу план, без коду:
1. Опиши план: нові файли, нові поля, зміни в firestore.rules, зміни в
   deleteMyAccount.ts. Дочекайся мого "ок".

Після підтвердження:
2. Додай тип `DMCampaignEncounter` у src/dm/domain/types/ (новий файл
   encounterHistory.ts або розширення encounter.ts):
   {
     schemaVersion?, id, campaignId, label: string,
     players: EncounterPrepPlayer[], monsters: EncounterPrepMonster[],
     difficulty: EncounterDifficultyResult | null,
     status: 'planned' | 'run' | 'archived',
     ownerUid, owners: string[], editors: string[],
     createdAtMs, updatedAtMs, baseUpdatedAtMs,
     syncStatus: DMNoteSyncDisplayStatus (перевикористай той самий union),
   }
3. Створи src/dm/repositories/campaignEncountersRepository.ts —
   СТРУКТУРНО СКОПІЮЙ campaignNotesRepository.ts (локальний кеш під новим
   ключем DM_CAMPAIGN_ENCOUNTERS_V1, офлайн-черга upsert/delete, subscribe
   по campaignId, conflict resolution keep-local/keep-cloud/merge-manual —
   merge для енкаунтера може означати "залишити обидва як окремі записи"
   замість текстового merge, вирішуй за аналогією).
4. Схема/валідація: новий файл src/domain/schemas/campaignEncounter.schema.ts
   за зразком campaignNote.schema.ts + міграція в src/domain/migrations/.
5. firestore.rules: додай блок dmCampaignEncounters, ДОСЛІВНО за структурою
   блоку dmCampaignNotes (isNoteOwner/isNoteEditor/isValidWrite — перейменуй
   під encounter, keys: ['id','ownerUid','owners','editors','campaignId','label']).
6. **Обов'язково**: у functions/src/deleteMyAccount.ts додай
   'dmCampaignEncounters' у CASCADE_COLLECTIONS. Без цього кроку видалення
   акаунта (R1-4, P0 релізу) почне залишати сирітські документи цієї нової
   колекції — приймання промту без цього пункту НЕ зараховується.
7. Wire UI:
   - DMEncounterPrep.tsx: кнопка "Зберегти в кампанію" — записує поточний
     драфт (players/monsters/difficulty) як новий DMCampaignEncounter зі
     статусом 'planned'.
   - DMCampaignDetail.tsx (з C3): секція "Історія енкаунтерів" — список
     збережених, "Відкрити" повертає в DMEncounterPrep з initialMonsters/
     players seed, "Позначити як проведений" → status: 'run'.
8. Тести: campaignEncountersRepository.test.ts за зразком
   campaignRepository.test.ts/campaignNotesRepository (якщо є) — офлайн-кеш,
   conflict-стани, sanitize невалідних даних.

Обмеження: НЕ чіпай наявну DMCampaignNote/campaignNotesRepository логіку —
тільки читай і копіюй патерн. Ліміт розміру документа — та сама межа, що в
campaignNote.schema.ts (title/content) — постав розумний кап на label
(≤200) і на кількість monsters/players у записі (наприклад ≤30 кожен), щоб
не впертися в 1 MiB ліміт документа (той самий ризик, що COL-9 в аудиті).

Приймання: npx tsc --noEmit — 0 помилок; npm run lint — 0 errors; npm run
test:unit — зелено, нові тести включно; grep 'dmCampaignEncounters' у
functions/src/deleteMyAccount.ts дає результат (доказ, що каскад оновлено);
опиши сценарії дозволених/заборонених запитів для нових firestore.rules
(REL-5-стиль, навіть без реального прогону в емуляторі, якщо емулятор не
піднятий — прямо напиши, що не запускав).

Звіт: нові файли, зміни в rules і в deleteMyAccount.ts явно виділені,
результати команд, що НЕ перевірено.
```

---

### C6 · Session log і loot log як теги нотаток кампанії

```
Прочитай спочатку: src/dm/domain/types/notes.ts, src/domain/schemas/campaignNote.schema.ts,
src/screens/DM/DMCampaignNotes.tsx, firestore.rules (блок dmCampaignNotes).

Контекст: замість нової колекції для "журналу сесій" і "логу лута" — додаємо
тег кампанійній нотатці. Це дешевше й безпечніше за нову колекцію.

Задача:
1. У DMCampaignNote (src/dm/domain/types/notes.ts) додай необов'язкове поле
   `kind?: 'note' | 'session' | 'loot'` (відсутнє значення = 'note', повна
   зворотна сумісність зі старими документами).
2. campaignNote.schema.ts: додай парсинг kind з дефолтом 'note', невалідне
   значення теж падає на 'note' (не кидати виняток).
3. DMCampaignNotes.tsx:
   - при створенні нотатки — вибір типу (3 чіпи: Нотатка/Сесія/Лут);
   - фільтр над списком "Останні зміни" — за kind (усі/нотатки/сесії/лут);
   - для kind: 'loot' — постав у плейсхолдер content підказку на кшталт
     "Приклад: 2x Potion of Healing, 15 gp, +1 Dagger" (це РУЧНИЙ запис, не
     генератор — LootGenerator.tsx лишається окремою майбутньою задачею, тут
     нічого не автогенерується).
4. i18n: нові ключі під dm:campaignNotes.kind.* (uk/en).
5. firestore.rules для dmCampaignNotes: kind — необов'язкове поле, не входить
   в hasAll(...) обов'язкового списку, тож існуюче правило isValidDmCampaignNoteWrite
   не ламається; за бажанням додай м'яку перевірку
   `(!('kind' in d) || d.kind in ['note','session','loot'])`.

Обмеження: не чіпай offline-чергу/conflict-логіку campaignNotesRepository —
kind проходить як звичайне поле контенту, без спеціальної обробки синку.

Приймання: npx tsc --noEmit — 0 помилок; npm run test:unit — зелено (старі
нотатки без kind далі парсяться як 'note' — додай на це тест); npm run
lint — 0 errors.

Звіт: змінені файли, приклад того, як стара нотатка (без kind у документі)
проходить через нову схему.
```

---

### C7 (P2, опційно) · Прикріплені монстри/заклинання per-кампанія

```
Прочитай спочатку: src/context/Monster-store.ts, src/context/Spellbook-store.ts,
src/dm/domain/types/campaign.ts, src/screens/Bestiary/Bestiary.tsx,
DM-екрани, де вже є pinnedMonsterIds/pinnedSpellIds (глобальні, DM.tsx).

Контекст: зараз "закріплені" монстри/заклинання — глобальні для юзера, не
прив'язані до конкретної кампанії. Це необов'язкове покращення — не блокуй
на ньому C1-C6.

Задача:
1. DMCampaign (типи + repository з C1): додай необов'язкові
   `pinnedMonsterIds?: string[]`, `pinnedSpellIds?: string[]` (кап ~20
   елементів кожен — не бездонний масив в одному документі).
2. У DMCampaignDetail.tsx (з C3) — секція "Закріплено для цієї кампанії" з
   тими самими картками, що зараз показує DM.tsx (переглянь, чи можна
   перевикористати наявний рендер-компонент замість дублювання JSX).
3. Точка додавання пінів — з Bestiary/Spellbook, ЛИШЕ коли є активний
   контекст кампанії (навігаційний параметр campaignId, не новий глобальний
   стан) — не додавай постійний "activeCampaignId" у стор, якщо вистачає
   параметра навігації.

Обмеження: не змінюй поведінку глобальних pinnedMonsterIds/pinnedSpellIds —
це доповнення, не заміна.

Приймання: npx tsc --noEmit — 0 помилок; npm run test:unit — зелено.

Звіт: змінені файли, короткий опис UX доповнення.
```

---

### C8 · Запрошення редактора в кампанію через код запрошення 🚧 GATE

```
Прочитай спочатку: docs/audit-2026-07.md розділ SEC-2 (ПОВНІСТЮ — це те, чого
уникаємо), src/components/ShareCharacterSheetModal.tsx, src/services/users.ts,
functions/src/deleteMyAccount.ts (стиль callable function), firestore.rules.

Контекст: наявний спосіб "поділитись" (по email, через emailIndex) несе
критичну вразливість SEC-2, ще не пофіксену. Для кампаній свідомо обрано
ІНШИЙ механізм — короткоживучий код запрошення, що взагалі не торкається
emailIndex.

Спершу план (без коду), дочекайся мого "ок":
1. Схема нової колекції `dmCampaignInvites`:
   { id (короткий код, напр. 8 символів), campaignId, role: 'editor',
     createdByUid, createdAtMs, expiresAtMs, maxUses, usedByUids: string[] }
2. Чому редагування ПОТРІБНО через Cloud Function, а не напряму з клієнта:
   новий запрошений користувач ще НЕ owner і НЕ editor кампанії — за чинними
   firestore.rules (dmCampaigns: allow update: if isCampaignOwner() ||
   isCampaignEditor()) він не має права дописати себе в editors. Тобто
   потрібен привілейований серверний запис після перевірки коду — так само,
   як deleteMyAccount.ts уже робить привілейовані каскадні операції.

Після підтвердження плану:
3. firestore.rules — блок dmCampaignInvites:
   - create: лише isCampaignOwner() відповідної кампанії (перевір
     get(/databases/$(database)/documents/dmCampaigns/$(campaignId)));
   - get: будь-який isSignedIn() (потрібен доступ по точному коду для
     редемпшена), list: заборонити (щоб не можна було перелічити всі коди);
   - update/delete: тільки через Cloud Function (client update: if false —
     усі мутації йдуть через адмінський SDK).
4. functions/src/redeemCampaignInvite.ts (новий callable, onCall + HttpsError,
   стиль як у deleteMyAccount.ts):
   - приймає { code };
   - читає dmCampaignInvites/{code}; якщо немає / expiresAtMs минув /
     usedByUids.length >= maxUses (коли maxUses задано) — HttpsError
     'failed-precondition';
   - якщо викликач уже в editors/owners цієї кампанії — no-op, повернути
     success (не плодити помилки на повторний редемпшн);
   - інакше в одній транзакції: dmCampaigns/{campaignId}.editors =
     arrayUnion(uid), dmCampaignInvites/{code}.usedByUids = arrayUnion(uid);
   - логувати подію (logger.info), без PII (лише uid і campaignId, без email/
     імені — узгоджено з CLAUDE.md §8.1 "жодного PII").
5. UI:
   - DMCampaignDetail.tsx: власник кампанії тисне "Запросити" → callable
     генерує код і expiresAtMs (типово +7 днів), показує нативний Share
     (react-native Share.share), НЕ email-форму;
   - новий легкий екран/модалка "Ввести код запрошення" (доступний з
     DMCampaigns.tsx або Settings) → викликає redeemCampaignInvite → після
     success підписка subscribeAccessibleCampaigns сама підхопить нову
     кампанію.
6. Оновити functions/src/deleteMyAccount.ts CASCADE_COLLECTIONS — вирішити
   свідомо: інвайт-коди належать кампанії, а не користувачу-запрошувачу,
   видаляти при видаленні акаунта власника не обов'язково (код і так згасне
   по expiresAtMs) — задокументуй це рішення коментарем, а не тихо пропусти.
7. Telemetry (за CLAUDE.md §8.1, без PII): campaign_invite_created,
   campaign_invite_redeemed, campaign_invite_expired_attempt.

Обмеження: НІЯКОГО перевикористання emailIndex/addEditorByEmail патерну.
Жодного client-side прямого запису в dmCampaigns.editors для чужого uid.

Приймання: npx tsc --noEmit — 0 помилок; npm run lint — 0 errors; npm run
test:unit — зелено; опиши явно дозволені/заборонені сценарії для нових
firestore.rules (спроба update/delete напряму з клієнта — заборонено; get
по невідомому коду — не існує документа, отже недоступно; list —
заборонено); якщо емулятор Firestore не запускав — прямо напиши це в звіті,
не видавай за перевірене.

Звіт: нові файли (rules, Cloud Function, UI), явний список
дозволених/заборонених запитів, результати команд, що НЕ перевірено
(насамперед: реальний редемпшн на двох різних акаунтах через живий Firestore
+ деплой Cloud Function — це вимагає `firebase deploy --only functions`,
тобто окремий 👤 HUMAN крок нижче).
```

---

## Що навмисно НЕ входить у цю пачку

- Реальний рандомний генератор лута за таблицями SRD (`equipment.json`) —
  `LootGenerator.tsx` лишається заглушкою; loot-нотатки з C6 — це ручний запис.
- Fix для SEC-2 (`emailIndex`) — окремий, уже задокументований P0-пункт
  релізу (`docs/audit-2026-07.md`); ця пачка свідомо його оминає, а не чекає.
- Каскадне видалення нотаток/енкаунтерів при видаленні самої кампанії
  (C1 `deleteCampaign` навмисно цього не робить) — окреме продуктове рішення.
- Presence / "хто зараз редагує кампанію" — той самий COL-6 з основного
  аудиту, стосується всієї моделі спільного редагування, не тільки кампаній.
- Календар сесій, розклад, чат кампанії — за межами запиту.
- Гранулярні ролі поза owner/editor (наприклад "read-only гравець") —
  модель лишається бінарною, як у персонажів.

---

## 👤 Що зробити тільки тобі

1. Ухвалити (чи делегувати) остаточне рішення: чи справді запускаємо це
   паралельно з R1–R5, чи чекаємо після production-релізу. C0 фіксує вибір
   "паралельно" — якщо передумаєш, відкати C0 і перенеси всю пачку в backlog.
2. Після C5 і C8 — `firebase deploy --only firestore:rules` і
   `firebase deploy --only functions` на реальному проєкті; жоден Claude Code
   не задеплоїть це сам.
3. Живий тест C8 (редемпшн коду) — два реальні акаунти, живий Firestore,
   як і решта тестів спільного редагування (CLAUDE.md §5 п.6).
4. Вирішити дефолтний термін дії інвайт-коду (у промті — 7 днів, це
   припущення) і maxUses (1 використання чи багато).
5. Переглянути тексти запрошення/loot-плейсхолдерів на відповідність
   тону продукту (docs/dnd-product-guidelines.md) — Claude Code писатиме
   технічно коректно, але фінальний voice-check краще зробити самому.

---

## Універсальний хвіст для будь-якого промту з цієї пачки

Якщо додаєш свій власний промт поверх цієї пачки — онови його тим самим
хвостом, що й в основному `docs/claude-code-prompts.md`:

```
Спілкування в звіті — українською. Код, коментарі, назви подій, коміти —
англійською. Мінімум перед завершенням: npm run typecheck + npm run test:unit.
Чіпав UI — плюс npm run lint:ui. Чіпав синк/правила — двоклієнтський сценарій
з CLAUDE.md §5 п.6. Формат звіту — як у CLAUDE.md §10 (Результат / Змінені
файли / Що перевірено / Що НЕ перевірено / Залишковий ризик).
```

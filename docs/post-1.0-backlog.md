# Бажаний беклог (пост-1.0)

Живий документ. Зведення ідей і відкладеної роботи, яка **свідомо не входить** у 1.0.0 —
не блокери релізу, не робити зараз. Раніше ці пункти були розкидані по
`docs/release-plan-google-play.md` §3 і `docs/audit-2026-07.md` §7 («Після 1.0») —
зведено сюди 2026-08-20, щоб не дублювати список у трьох місцях.

---

1. **Expo SDK 54 → 57.** Закриває решту CVE в build/dev-тулчейн-кластері
   (`@expo/config-plugins`, `metro`, `xcode`, `postcss` та ін. — див.
   `docs/audit-2026-07.md` SEC-7/SEC-11). Мажорний апгрейд, заборонений у CLAUDE.md
   §6 до релізу. Одразу після 1.0.

2. ~~**Семантичний merge лічильників (COL-4, повністю).**~~ — ✅ **Зроблено
   2026-09-02** (коміт `8a312c1`), перенесено в 1.0-scope 2026-09-01 (`CLAUDE.md`
   Виняток 3). `FieldValue.increment()` для HP/slots/ресурсів і `arrayUnion`/
   `arrayRemove` для conditions. Деталі — `docs/collaborative-editing.md` §3.1,
   `docs/release-plan-google-play.md` R5 (задача R5-0a).

3. ~~**Справжній presence (COL-6) + журнал змін у підколекцію (COL-9).**~~ — ⏳
   **Код зроблено 2026-09-05**, перенесено в 1.0-scope 2026-09-01 (`CLAUDE.md`
   Виняток 3). Правила `firestore.rules` уже задеплоєні в prod-проєкт; код ще не
   закомічено в git і не зібрано новим production-білдом. Presence з heartbeat
   (бейдж «DM тут»/«Гравець тут» у шапці аркуша) і винесення `changeHistory[]` з
   масиву в документі в окрему підколекцію `characterSheets/{id}/changes` — обидва
   підтверджені реальними даними через Firestore Console. Деталі й статус —
   `docs/collaborative-editing.md` §3.1, `docs/release-plan-google-play.md` R5
   (задача R5-0b).

4. **Розпил `useCharacterActions.tsx` (REL-3).** Файл — 3494 рядки, головний ігровий
   екран; CLAUDE.md §6 прямо забороняє його чіпати до релізу через ризик регресій.
   Разом із розпилом — закрити 25 warnings `react-hooks/exhaustive-deps`, які зараз
   є базовою лінією (`npm run lint`).

5. **CI workflow і E2E-автоматизація (REL-4) — закрите питання, не «колись».**
   Свідоме рішення власника продукту 2026-08-12: **не плануються**. Регресію проганяють
   вручну за чеклістом (`docs/release-plan-google-play.md` §4), не автоматизованими
   e2e-тестами. Записано тут лише для повноти зведення, не як активний беклог-пункт.

6. **GM Desktop Workspace** (окрім Campaign Management MVP+, який уже розробляється
   паралельно з release hardening — `docs/campaign-management-prompts.md`, свідомий
   виняток від 2026-08-01). Повноцінний десктопний воркспейс для ведучого — після 1.0.

7. **Picture-in-Picture.** Порада з Google Play pre-launch report 2026-08-20 щодо
   залучення користувачів (69,6% MAU в аналогів) — не вимога Play, нова фіча.
   Рішення власника продукту 2026-08-20: додати в беклог, не робити до 1.0 — release
   hardening зі scope freeze (CLAUDE.md, преамбула).

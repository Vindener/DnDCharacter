Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 29/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-29.json` (single-file mode) OR `batch-29-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):
```json
{
  "android/app/src/main/res/mipmap-mdpi/ic_launcher_round.webp": [],
  "android/app/src/main/res/mipmap-xhdpi/ic_launcher.webp": [],
  "android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.webp": [],
  "android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.webp": [],
  "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.webp": [],
  "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.webp": [],
  "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.webp": [],
  "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.webp": [],
  "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.webp": [],
  "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.webp": [],
  "android/app/src/main/res/values-night/colors.xml": [],
  "android/gradle/wrapper/gradle-wrapper.jar": [],
  "android/gradle/wrapper/gradle-wrapper.properties": [],
  "android/gradlew": [],
  "firestore-tests/rules.test.ts": [],
  "firestore.rules": [],
  "functions/src/createCampaignInvite.ts": [],
  "functions/src/index.ts": [],
  "functions/src/redeemCampaignInvite.ts": [],
  "functions/vitest.config.ts": [],
  "metro.config.js": [],
  "scripts/lint-theme.mjs": [],
  "scripts/lint-ui-tokens.mjs": [],
  "scripts/manual-dev-client-android.ps1": [],
  "scripts/release-check.mjs": []
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):
```json
{}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields — `path`, `language`, `sizeLines`, `fileCategory`):
1. `android/app/src/main/res/mipmap-mdpi/ic_launcher_round.webp` (2 lines, language: `webp`, fileCategory: `code`)
2. `android/app/src/main/res/mipmap-xhdpi/ic_launcher.webp` (3 lines, language: `webp`, fileCategory: `code`)
3. `android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.webp` (6 lines, language: `webp`, fileCategory: `code`)
4. `android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.webp` (6 lines, language: `webp`, fileCategory: `code`)
5. `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.webp` (8 lines, language: `webp`, fileCategory: `code`)
6. `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.webp` (22 lines, language: `webp`, fileCategory: `code`)
7. `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.webp` (4 lines, language: `webp`, fileCategory: `code`)
8. `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.webp` (8 lines, language: `webp`, fileCategory: `code`)
9. `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.webp` (28 lines, language: `webp`, fileCategory: `code`)
10. `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.webp` (9 lines, language: `webp`, fileCategory: `code`)
11. `android/app/src/main/res/values-night/colors.xml` (0 lines, language: `xml`, fileCategory: `config`)
12. `android/gradle/wrapper/gradle-wrapper.jar` (151 lines, language: `jar`, fileCategory: `code`)
13. `android/gradle/wrapper/gradle-wrapper.properties` (7 lines, language: `properties`, fileCategory: `config`)
14. `android/gradlew` (251 lines, language: `unknown`, fileCategory: `code`)
15. `firestore-tests/rules.test.ts` (456 lines, language: `typescript`, fileCategory: `code`)
16. `firestore.rules` (302 lines, language: `rules`, fileCategory: `code`)
17. `functions/src/createCampaignInvite.ts` (95 lines, language: `typescript`, fileCategory: `code`)
18. `functions/src/index.ts` (3 lines, language: `typescript`, fileCategory: `code`)
19. `functions/src/redeemCampaignInvite.ts` (90 lines, language: `typescript`, fileCategory: `code`)
20. `functions/vitest.config.ts` (9 lines, language: `typescript`, fileCategory: `code`)
21. `metro.config.js` (3 lines, language: `javascript`, fileCategory: `code`)
22. `scripts/lint-theme.mjs` (58 lines, language: `javascript`, fileCategory: `code`)
23. `scripts/lint-ui-tokens.mjs` (60 lines, language: `javascript`, fileCategory: `code`)
24. `scripts/manual-dev-client-android.ps1` (72 lines, language: `powershell`, fileCategory: `script`)
25. `scripts/release-check.mjs` (31 lines, language: `javascript`, fileCategory: `code`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").
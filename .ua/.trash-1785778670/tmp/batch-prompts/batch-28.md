Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 28/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-28.json` (single-file mode) OR `batch-28-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):
```json
{
  ".agents/skills/create-android-component/SKILL.md": [],
  ".claude/settings.json": [],
  ".firebaserc": [],
  ".github/instructions/mobile-rn-standards.instructions.md": [],
  ".npmrc": [],
  ".ua/.understandignore": [],
  ".ua/config.json": [],
  "android/app/build.gradle": [],
  "android/app/debug.keystore": [],
  "android/app/google-services.json": [],
  "android/app/proguard-rules.pro": [],
  "android/app/src/androidTest/AndroidManifest.xml": [],
  "android/app/src/debug/AndroidManifest.xml": [],
  "android/app/src/main/AndroidManifest.xml": [],
  "android/app/src/main/java/com/vind/MythgateDND/MainActivity.kt": [],
  "android/app/src/main/java/com/vind/MythgateDND/MainApplication.kt": [],
  "android/app/src/main/res/drawable/ic_launcher_background.xml": [],
  "android/app/src/main/res/drawable/rn_edit_text_material.xml": [],
  "android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml": [],
  "android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml": [],
  "android/app/src/main/res/mipmap-hdpi/ic_launcher.webp": [],
  "android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.webp": [],
  "android/app/src/main/res/mipmap-hdpi/ic_launcher_round.webp": [],
  "android/app/src/main/res/mipmap-mdpi/ic_launcher.webp": [],
  "android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.webp": []
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):
```json
{}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields — `path`, `language`, `sizeLines`, `fileCategory`):
1. `.agents/skills/create-android-component/SKILL.md` (40 lines, language: `markdown`, fileCategory: `docs`)
2. `.claude/settings.json` (5 lines, language: `json`, fileCategory: `config`)
3. `.firebaserc` (5 lines, language: `unknown`, fileCategory: `code`)
4. `.github/instructions/mobile-rn-standards.instructions.md` (60 lines, language: `markdown`, fileCategory: `docs`)
5. `.npmrc` (1 lines, language: `unknown`, fileCategory: `code`)
6. `.ua/.understandignore` (90 lines, language: `unknown`, fileCategory: `code`)
7. `.ua/config.json` (1 lines, language: `json`, fileCategory: `config`)
8. `android/app/build.gradle` (189 lines, language: `gradle`, fileCategory: `config`)
9. `android/app/debug.keystore` (8 lines, language: `keystore`, fileCategory: `code`)
10. `android/app/google-services.json` (70 lines, language: `json`, fileCategory: `config`)
11. `android/app/proguard-rules.pro` (14 lines, language: `pro`, fileCategory: `code`)
12. `android/app/src/androidTest/AndroidManifest.xml` (16 lines, language: `xml`, fileCategory: `config`)
13. `android/app/src/debug/AndroidManifest.xml` (7 lines, language: `xml`, fileCategory: `config`)
14. `android/app/src/main/AndroidManifest.xml` (32 lines, language: `xml`, fileCategory: `config`)
15. `android/app/src/main/java/com/vind/MythgateDND/MainActivity.kt` (61 lines, language: `kotlin`, fileCategory: `code`)
16. `android/app/src/main/java/com/vind/MythgateDND/MainApplication.kt` (57 lines, language: `kotlin`, fileCategory: `code`)
17. `android/app/src/main/res/drawable/ic_launcher_background.xml` (5 lines, language: `xml`, fileCategory: `config`)
18. `android/app/src/main/res/drawable/rn_edit_text_material.xml` (37 lines, language: `xml`, fileCategory: `config`)
19. `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` (4 lines, language: `xml`, fileCategory: `config`)
20. `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml` (4 lines, language: `xml`, fileCategory: `config`)
21. `android/app/src/main/res/mipmap-hdpi/ic_launcher.webp` (7 lines, language: `webp`, fileCategory: `code`)
22. `android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.webp` (7 lines, language: `webp`, fileCategory: `code`)
23. `android/app/src/main/res/mipmap-hdpi/ic_launcher_round.webp` (3 lines, language: `webp`, fileCategory: `code`)
24. `android/app/src/main/res/mipmap-mdpi/ic_launcher.webp` (2 lines, language: `webp`, fileCategory: `code`)
25. `android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.webp` (1 lines, language: `webp`, fileCategory: `code`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").
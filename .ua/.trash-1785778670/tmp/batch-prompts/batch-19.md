Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 19/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-19.json` (single-file mode) OR `batch-19-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):

```json
{
  ".env": [],
  "CLAUDE.md": [],
  "README.md": [],
  "app.json": [],
  "eas.json": [],
  "firebase.json": [],
  "google-services.json": [],
  "package.json": [],
  "tsconfig.json": []
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):

```json
{}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields — `path`, `language`, `sizeLines`, `fileCategory`):

1. `.env` (0 lines, language: `config`, fileCategory: `config`)
2. `CLAUDE.md` (240 lines, language: `markdown`, fileCategory: `docs`)
3. `README.md` (138 lines, language: `markdown`, fileCategory: `docs`)
4. `app.json` (54 lines, language: `json`, fileCategory: `config`)
5. `eas.json` (28 lines, language: `json`, fileCategory: `config`)
6. `firebase.json` (24 lines, language: `json`, fileCategory: `config`)
7. `google-services.json` (70 lines, language: `json`, fileCategory: `config`)
8. `package.json` (127 lines, language: `json`, fileCategory: `config`)
9. `tsconfig.json` (23 lines, language: `json`, fileCategory: `config`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").

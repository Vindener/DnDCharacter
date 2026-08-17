Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 30/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-30.json` (single-file mode) OR `batch-30-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):

```json
{
  "src/data/locales/uk/monsters.json": [],
  "src/data/locales/uk/spells.json": [],
  "src/dm/boundary.test.ts": [],
  "src/dm/domain/index.ts": [],
  "src/dm/domain/types/campaign.ts": [],
  "src/dm/domain/types/campaignInvite.ts": [],
  "src/dm/domain/types/initiative.ts": [],
  "src/dm/repositories/index.ts": [],
  "src/domain/spellbook/boundary.test.ts": [],
  "src/domain/types/dm.ts": [],
  "src/domain/types/spellbook.ts": [],
  "src/domain/types/sync.ts": [],
  "src/screens/Support/index.ts": [],
  "src/services/characterSheets.ts": [],
  "src/shared/components/Loader/style.ts": [],
  "src/shared/const/Backgrounds.ts": [],
  "src/shared/const/ClassStartingGear.ts": [],
  "src/shared/const/DiceOptions.ts": [],
  "src/shared/const/Races.ts": [],
  "src/shared/const/SubclassDetails.ts": [],
  "src/shared/const/encounter.ts": [],
  "src/shared/helpers/spellbook.ts": [],
  "src/shared/styles/index.ts": [],
  "src/test/mocks/expo-modules-core.ts": [],
  "src/test/mocks/react-native-firebase-analytics.ts": []
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):

```json
{
  "src/data/locales/uk/monsters.json": [
    {
      "path": "src/domain/srd/localization.ts",
      "batchIndex": 2,
      "symbols": [
        "getLocalizedSpellFields",
        "getLocalizedSpellSearchText",
        "getLocalizedSpellSchool",
        "getLocalizedSpellClass",
        "getLocalizedMonsterTerm",
        "getLocalizedMonster",
        "getLocalizedMonsterSearchText"
      ]
    }
  ],
  "src/data/locales/uk/spells.json": [
    {
      "path": "src/domain/srd/localization.ts",
      "batchIndex": 2,
      "symbols": [
        "getLocalizedSpellFields",
        "getLocalizedSpellSearchText",
        "getLocalizedSpellSchool",
        "getLocalizedSpellClass",
        "getLocalizedMonsterTerm",
        "getLocalizedMonster",
        "getLocalizedMonsterSearchText"
      ]
    }
  ]
}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields — `path`, `language`, `sizeLines`, `fileCategory`):

1. `src/data/locales/uk/monsters.json` (13402 lines, language: `json`, fileCategory: `config`)
2. `src/data/locales/uk/spells.json` (4927 lines, language: `json`, fileCategory: `config`)
3. `src/dm/boundary.test.ts` (82 lines, language: `typescript`, fileCategory: `code`)
4. `src/dm/domain/index.ts` (5 lines, language: `typescript`, fileCategory: `code`)
5. `src/dm/domain/types/campaign.ts` (20 lines, language: `typescript`, fileCategory: `code`)
6. `src/dm/domain/types/campaignInvite.ts` (10 lines, language: `typescript`, fileCategory: `code`)
7. `src/dm/domain/types/initiative.ts` (33 lines, language: `typescript`, fileCategory: `code`)
8. `src/dm/repositories/index.ts` (5 lines, language: `typescript`, fileCategory: `code`)
9. `src/domain/spellbook/boundary.test.ts` (68 lines, language: `typescript`, fileCategory: `code`)
10. `src/domain/types/dm.ts` (26 lines, language: `typescript`, fileCategory: `code`)
11. `src/domain/types/spellbook.ts` (9 lines, language: `typescript`, fileCategory: `code`)
12. `src/domain/types/sync.ts` (24 lines, language: `typescript`, fileCategory: `code`)
13. `src/screens/Support/index.ts` (1 lines, language: `typescript`, fileCategory: `code`)
14. `src/services/characterSheets.ts` (27 lines, language: `typescript`, fileCategory: `code`)
15. `src/shared/components/Loader/style.ts` (1 lines, language: `typescript`, fileCategory: `code`)
16. `src/shared/const/Backgrounds.ts` (54 lines, language: `typescript`, fileCategory: `code`)
17. `src/shared/const/ClassStartingGear.ts` (107 lines, language: `typescript`, fileCategory: `code`)
18. `src/shared/const/DiceOptions.ts` (1 lines, language: `typescript`, fileCategory: `code`)
19. `src/shared/const/Races.ts` (158 lines, language: `typescript`, fileCategory: `code`)
20. `src/shared/const/SubclassDetails.ts` (39 lines, language: `typescript`, fileCategory: `code`)
21. `src/shared/const/encounter.ts` (13 lines, language: `typescript`, fileCategory: `code`)
22. `src/shared/helpers/spellbook.ts` (7 lines, language: `typescript`, fileCategory: `code`)
23. `src/shared/styles/index.ts` (21 lines, language: `typescript`, fileCategory: `code`)
24. `src/test/mocks/expo-modules-core.ts` (5 lines, language: `typescript`, fileCategory: `code`)
25. `src/test/mocks/react-native-firebase-analytics.ts` (11 lines, language: `typescript`, fileCategory: `code`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").

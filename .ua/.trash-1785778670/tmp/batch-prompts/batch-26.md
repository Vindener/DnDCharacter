Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 26/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-26.json` (single-file mode) OR `batch-26-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):
```json
{
  "src/i18n/locales/uk/bestiary.json": [],
  "src/i18n/locales/uk/character.json": [],
  "src/i18n/locales/uk/common.json": [],
  "src/i18n/locales/uk/createCharacter.json": [],
  "src/i18n/locales/uk/dice.json": [],
  "src/i18n/locales/uk/dm.json": [],
  "src/i18n/locales/uk/dnd.json": [],
  "src/i18n/locales/uk/firstLaunch.json": [],
  "src/i18n/locales/uk/home.json": [],
  "src/i18n/locales/uk/initiative.json": [],
  "src/i18n/locales/uk/legal.json": [],
  "src/i18n/locales/uk/navigation.json": [],
  "src/i18n/locales/uk/references.json": [],
  "src/i18n/locales/uk/settings.json": [],
  "src/i18n/locales/uk/spellbook.json": [],
  "src/i18n/locales/uk/support.json": [],
  "src/i18n/locales/uk/whatsNew.json": []
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):
```json
{
  "src/i18n/locales/uk/bestiary.json": [
    {
      "path": "src/i18n/index.ts",
      "batchIndex": 10,
      "symbols": [
        "AppLanguage",
        "SUPPORTED_LANGUAGES",
        "resources",
        "getInitialLanguage",
        "initI18n",
        "changeAppLanguage",
        "getCurrentLanguage"
      ]
    }
  ],
  "src/i18n/locales/uk/character.json": [
    {
      "path": "src/i18n/index.ts",
      "batchIndex": 10,
      "symbols": [
        "AppLanguage",
        "SUPPORTED_LANGUAGES",
        "resources",
        "getInitialLanguage",
        "initI18n",
        "changeAppLanguage",
        "getCurrentLanguage"
      ]
    }
  ],
  "src/i18n/locales/uk/common.json": [
    {
      "path": "src/i18n/index.ts",
      "batchIndex": 10,
      "symbols": [
        "AppLanguage",
        "SUPPORTED_LANGUAGES",
        "resources",
        "getInitialLanguage",
        "initI18n",
        "changeAppLanguage",
        "getCurrentLanguage"
      ]
    }
  ],
  "src/i18n/locales/uk/createCharacter.json": [
    {
      "path": "src/i18n/index.ts",
      "batchIndex": 10,
      "symbols": [
        "AppLanguage",
        "SUPPORTED_LANGUAGES",
        "resources",
        "getInitialLanguage",
        "initI18n",
        "changeAppLanguage",
        "getCurrentLanguage"
      ]
    }
  ],
  "src/i18n/locales/uk/dice.json": [
    {
      "path": "src/i18n/index.ts",
      "batchIndex": 10,
      "symbols": [
        "AppLanguage",
        "SUPPORTED_LANGUAGES",
        "resources",
        "getInitialLanguage",
        "initI18n",
        "changeAppLanguage",
        "getCurrentLanguage"
      ]
    }
  ],
  "src/i18n/locales/uk/dm.json": [
    {
      "path": "src/i18n/index.ts",
      "batchIndex": 10,
      "symbols": [
        "AppLanguage",
        "SUPPORTED_LANGUAGES",
        "resources",
        "getInitialLanguage",
        "initI18n",
        "changeAppLanguage",
        "getCurrentLanguage"
      ]
    }
  ],
  "src/i18n/locales/uk/dnd.json": [
    {
      "path": "src/i18n/index.ts",
      "batchIndex": 10,
      "symbols": [
        "AppLanguage",
        "SUPPORTED_LANGUAGES",
        "resources",
        "getInitialLanguage",
        "initI18n",
        "changeAppLanguage",
        "getCurrentLanguage"
      ]
    }
  ],
  "src/i18n/locales/uk/firstLaunch.json": [
    {
      "path": "src/i18n/index.ts",
      "batchIndex": 10,
      "symbols": [
        "AppLanguage",
        "SUPPORTED_LANGUAGES",
        "resources",
        "getInitialLanguage",
        "initI18n",
        "changeAppLanguage",
        "getCurrentLanguage"
      ]
    }
  ],
  "src/i18n/locales/uk/home.json": [
    {
      "path": "src/i18n/index.ts",
      "batchIndex": 10,
      "symbols": [
        "AppLanguage",
        "SUPPORTED_LANGUAGES",
        "resources",
        "getInitialLanguage",
        "initI18n",
        "changeAppLanguage",
        "getCurrentLanguage"
      ]
    }
  ],
  "src/i18n/locales/uk/initiative.json": [
    {
      "path": "src/i18n/index.ts",
      "batchIndex": 10,
      "symbols": [
        "AppLanguage",
        "SUPPORTED_LANGUAGES",
        "resources",
        "getInitialLanguage",
        "initI18n",
        "changeAppLanguage",
        "getCurrentLanguage"
      ]
    }
  ],
  "src/i18n/locales/uk/legal.json": [
    {
      "path": "src/i18n/index.ts",
      "batchIndex": 10,
      "symbols": [
        "AppLanguage",
        "SUPPORTED_LANGUAGES",
        "resources",
        "getInitialLanguage",
        "initI18n",
        "changeAppLanguage",
        "getCurrentLanguage"
      ]
    }
  ],
  "src/i18n/locales/uk/navigation.json": [
    {
      "path": "src/i18n/index.ts",
      "batchIndex": 10,
      "symbols": [
        "AppLanguage",
        "SUPPORTED_LANGUAGES",
        "resources",
        "getInitialLanguage",
        "initI18n",
        "changeAppLanguage",
        "getCurrentLanguage"
      ]
    }
  ],
  "src/i18n/locales/uk/references.json": [
    {
      "path": "src/i18n/index.ts",
      "batchIndex": 10,
      "symbols": [
        "AppLanguage",
        "SUPPORTED_LANGUAGES",
        "resources",
        "getInitialLanguage",
        "initI18n",
        "changeAppLanguage",
        "getCurrentLanguage"
      ]
    }
  ],
  "src/i18n/locales/uk/settings.json": [
    {
      "path": "src/i18n/index.ts",
      "batchIndex": 10,
      "symbols": [
        "AppLanguage",
        "SUPPORTED_LANGUAGES",
        "resources",
        "getInitialLanguage",
        "initI18n",
        "changeAppLanguage",
        "getCurrentLanguage"
      ]
    }
  ],
  "src/i18n/locales/uk/spellbook.json": [
    {
      "path": "src/i18n/index.ts",
      "batchIndex": 10,
      "symbols": [
        "AppLanguage",
        "SUPPORTED_LANGUAGES",
        "resources",
        "getInitialLanguage",
        "initI18n",
        "changeAppLanguage",
        "getCurrentLanguage"
      ]
    }
  ],
  "src/i18n/locales/uk/support.json": [
    {
      "path": "src/i18n/index.ts",
      "batchIndex": 10,
      "symbols": [
        "AppLanguage",
        "SUPPORTED_LANGUAGES",
        "resources",
        "getInitialLanguage",
        "initI18n",
        "changeAppLanguage",
        "getCurrentLanguage"
      ]
    }
  ],
  "src/i18n/locales/uk/whatsNew.json": [
    {
      "path": "src/i18n/index.ts",
      "batchIndex": 10,
      "symbols": [
        "AppLanguage",
        "SUPPORTED_LANGUAGES",
        "resources",
        "getInitialLanguage",
        "initI18n",
        "changeAppLanguage",
        "getCurrentLanguage"
      ]
    }
  ]
}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields — `path`, `language`, `sizeLines`, `fileCategory`):
1. `src/i18n/locales/uk/bestiary.json` (148 lines, language: `json`, fileCategory: `config`)
2. `src/i18n/locales/uk/character.json` (616 lines, language: `json`, fileCategory: `config`)
3. `src/i18n/locales/uk/common.json` (86 lines, language: `json`, fileCategory: `config`)
4. `src/i18n/locales/uk/createCharacter.json` (204 lines, language: `json`, fileCategory: `config`)
5. `src/i18n/locales/uk/dice.json` (56 lines, language: `json`, fileCategory: `config`)
6. `src/i18n/locales/uk/dm.json` (373 lines, language: `json`, fileCategory: `config`)
7. `src/i18n/locales/uk/dnd.json` (85 lines, language: `json`, fileCategory: `config`)
8. `src/i18n/locales/uk/firstLaunch.json` (18 lines, language: `json`, fileCategory: `config`)
9. `src/i18n/locales/uk/home.json` (54 lines, language: `json`, fileCategory: `config`)
10. `src/i18n/locales/uk/initiative.json` (37 lines, language: `json`, fileCategory: `config`)
11. `src/i18n/locales/uk/legal.json` (24 lines, language: `json`, fileCategory: `config`)
12. `src/i18n/locales/uk/navigation.json` (28 lines, language: `json`, fileCategory: `config`)
13. `src/i18n/locales/uk/references.json` (100 lines, language: `json`, fileCategory: `config`)
14. `src/i18n/locales/uk/settings.json` (81 lines, language: `json`, fileCategory: `config`)
15. `src/i18n/locales/uk/spellbook.json` (145 lines, language: `json`, fileCategory: `config`)
16. `src/i18n/locales/uk/support.json` (28 lines, language: `json`, fileCategory: `config`)
17. `src/i18n/locales/uk/whatsNew.json` (9 lines, language: `json`, fileCategory: `config`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").
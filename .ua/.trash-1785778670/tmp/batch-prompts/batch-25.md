Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 25/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-25.json` (single-file mode) OR `batch-25-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):

```json
{
  "src/i18n/locales/en/bestiary.json": [],
  "src/i18n/locales/en/character.json": [],
  "src/i18n/locales/en/common.json": [],
  "src/i18n/locales/en/createCharacter.json": [],
  "src/i18n/locales/en/dice.json": [],
  "src/i18n/locales/en/dm.json": [],
  "src/i18n/locales/en/dnd.json": [],
  "src/i18n/locales/en/firstLaunch.json": [],
  "src/i18n/locales/en/home.json": [],
  "src/i18n/locales/en/initiative.json": [],
  "src/i18n/locales/en/legal.json": [],
  "src/i18n/locales/en/navigation.json": [],
  "src/i18n/locales/en/references.json": [],
  "src/i18n/locales/en/settings.json": [],
  "src/i18n/locales/en/spellbook.json": [],
  "src/i18n/locales/en/support.json": [],
  "src/i18n/locales/en/whatsNew.json": []
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):

```json
{
  "src/i18n/locales/en/bestiary.json": [
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
  "src/i18n/locales/en/character.json": [
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
  "src/i18n/locales/en/common.json": [
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
  "src/i18n/locales/en/createCharacter.json": [
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
  "src/i18n/locales/en/dice.json": [
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
  "src/i18n/locales/en/dm.json": [
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
  "src/i18n/locales/en/dnd.json": [
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
  "src/i18n/locales/en/firstLaunch.json": [
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
  "src/i18n/locales/en/home.json": [
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
  "src/i18n/locales/en/initiative.json": [
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
  "src/i18n/locales/en/legal.json": [
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
  "src/i18n/locales/en/navigation.json": [
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
  "src/i18n/locales/en/references.json": [
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
  "src/i18n/locales/en/settings.json": [
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
  "src/i18n/locales/en/spellbook.json": [
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
  "src/i18n/locales/en/support.json": [
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
  "src/i18n/locales/en/whatsNew.json": [
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

1. `src/i18n/locales/en/bestiary.json` (148 lines, language: `json`, fileCategory: `config`)
2. `src/i18n/locales/en/character.json` (616 lines, language: `json`, fileCategory: `config`)
3. `src/i18n/locales/en/common.json` (86 lines, language: `json`, fileCategory: `config`)
4. `src/i18n/locales/en/createCharacter.json` (204 lines, language: `json`, fileCategory: `config`)
5. `src/i18n/locales/en/dice.json` (56 lines, language: `json`, fileCategory: `config`)
6. `src/i18n/locales/en/dm.json` (373 lines, language: `json`, fileCategory: `config`)
7. `src/i18n/locales/en/dnd.json` (85 lines, language: `json`, fileCategory: `config`)
8. `src/i18n/locales/en/firstLaunch.json` (18 lines, language: `json`, fileCategory: `config`)
9. `src/i18n/locales/en/home.json` (54 lines, language: `json`, fileCategory: `config`)
10. `src/i18n/locales/en/initiative.json` (37 lines, language: `json`, fileCategory: `config`)
11. `src/i18n/locales/en/legal.json` (24 lines, language: `json`, fileCategory: `config`)
12. `src/i18n/locales/en/navigation.json` (28 lines, language: `json`, fileCategory: `config`)
13. `src/i18n/locales/en/references.json` (100 lines, language: `json`, fileCategory: `config`)
14. `src/i18n/locales/en/settings.json` (81 lines, language: `json`, fileCategory: `config`)
15. `src/i18n/locales/en/spellbook.json` (211 lines, language: `json`, fileCategory: `config`)
16. `src/i18n/locales/en/support.json` (28 lines, language: `json`, fileCategory: `config`)
17. `src/i18n/locales/en/whatsNew.json` (9 lines, language: `json`, fileCategory: `config`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").

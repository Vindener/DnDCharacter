Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 24/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-24.json` (single-file mode) OR `batch-24-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):
```json
{
  "src/data/srd/abilities.json": [],
  "src/data/srd/backgrounds.json": [],
  "src/data/srd/classProgression.json": [],
  "src/data/srd/classes.json": [],
  "src/data/srd/conditions.json": [],
  "src/data/srd/equipment.json": [],
  "src/data/srd/languages.json": [],
  "src/data/srd/monsters.json": [],
  "src/data/srd/races.json": [],
  "src/data/srd/references.json": [],
  "src/data/srd/skills.json": [],
  "src/data/srd/spells.json": []
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):
```json
{
  "src/data/srd/abilities.json": [
    {
      "path": "src/data/srd/index.ts",
      "batchIndex": 14,
      "symbols": [
        "loadAbilitiesJson",
        "loadBackgroundsJson",
        "loadClassesJson",
        "loadClassProgressionJson",
        "loadConditionsJson",
        "loadEquipmentJson",
        "loadLanguagesJson",
        "loadMonstersJson",
        "loadRacesJson",
        "loadReferencesJson",
        "loadSkillsJson",
        "loadSpellsJson",
        "SRD_METADATA"
      ]
    }
  ],
  "src/data/srd/backgrounds.json": [
    {
      "path": "src/data/srd/index.ts",
      "batchIndex": 14,
      "symbols": [
        "loadAbilitiesJson",
        "loadBackgroundsJson",
        "loadClassesJson",
        "loadClassProgressionJson",
        "loadConditionsJson",
        "loadEquipmentJson",
        "loadLanguagesJson",
        "loadMonstersJson",
        "loadRacesJson",
        "loadReferencesJson",
        "loadSkillsJson",
        "loadSpellsJson",
        "SRD_METADATA"
      ]
    }
  ],
  "src/data/srd/classProgression.json": [
    {
      "path": "src/data/srd/index.ts",
      "batchIndex": 14,
      "symbols": [
        "loadAbilitiesJson",
        "loadBackgroundsJson",
        "loadClassesJson",
        "loadClassProgressionJson",
        "loadConditionsJson",
        "loadEquipmentJson",
        "loadLanguagesJson",
        "loadMonstersJson",
        "loadRacesJson",
        "loadReferencesJson",
        "loadSkillsJson",
        "loadSpellsJson",
        "SRD_METADATA"
      ]
    }
  ],
  "src/data/srd/classes.json": [
    {
      "path": "src/data/srd/index.ts",
      "batchIndex": 14,
      "symbols": [
        "loadAbilitiesJson",
        "loadBackgroundsJson",
        "loadClassesJson",
        "loadClassProgressionJson",
        "loadConditionsJson",
        "loadEquipmentJson",
        "loadLanguagesJson",
        "loadMonstersJson",
        "loadRacesJson",
        "loadReferencesJson",
        "loadSkillsJson",
        "loadSpellsJson",
        "SRD_METADATA"
      ]
    }
  ],
  "src/data/srd/conditions.json": [
    {
      "path": "src/data/srd/index.ts",
      "batchIndex": 14,
      "symbols": [
        "loadAbilitiesJson",
        "loadBackgroundsJson",
        "loadClassesJson",
        "loadClassProgressionJson",
        "loadConditionsJson",
        "loadEquipmentJson",
        "loadLanguagesJson",
        "loadMonstersJson",
        "loadRacesJson",
        "loadReferencesJson",
        "loadSkillsJson",
        "loadSpellsJson",
        "SRD_METADATA"
      ]
    }
  ],
  "src/data/srd/equipment.json": [
    {
      "path": "src/data/srd/index.ts",
      "batchIndex": 14,
      "symbols": [
        "loadAbilitiesJson",
        "loadBackgroundsJson",
        "loadClassesJson",
        "loadClassProgressionJson",
        "loadConditionsJson",
        "loadEquipmentJson",
        "loadLanguagesJson",
        "loadMonstersJson",
        "loadRacesJson",
        "loadReferencesJson",
        "loadSkillsJson",
        "loadSpellsJson",
        "SRD_METADATA"
      ]
    }
  ],
  "src/data/srd/languages.json": [
    {
      "path": "src/data/srd/index.ts",
      "batchIndex": 14,
      "symbols": [
        "loadAbilitiesJson",
        "loadBackgroundsJson",
        "loadClassesJson",
        "loadClassProgressionJson",
        "loadConditionsJson",
        "loadEquipmentJson",
        "loadLanguagesJson",
        "loadMonstersJson",
        "loadRacesJson",
        "loadReferencesJson",
        "loadSkillsJson",
        "loadSpellsJson",
        "SRD_METADATA"
      ]
    }
  ],
  "src/data/srd/monsters.json": [
    {
      "path": "src/data/srd/index.ts",
      "batchIndex": 14,
      "symbols": [
        "loadAbilitiesJson",
        "loadBackgroundsJson",
        "loadClassesJson",
        "loadClassProgressionJson",
        "loadConditionsJson",
        "loadEquipmentJson",
        "loadLanguagesJson",
        "loadMonstersJson",
        "loadRacesJson",
        "loadReferencesJson",
        "loadSkillsJson",
        "loadSpellsJson",
        "SRD_METADATA"
      ]
    }
  ],
  "src/data/srd/races.json": [
    {
      "path": "src/data/srd/index.ts",
      "batchIndex": 14,
      "symbols": [
        "loadAbilitiesJson",
        "loadBackgroundsJson",
        "loadClassesJson",
        "loadClassProgressionJson",
        "loadConditionsJson",
        "loadEquipmentJson",
        "loadLanguagesJson",
        "loadMonstersJson",
        "loadRacesJson",
        "loadReferencesJson",
        "loadSkillsJson",
        "loadSpellsJson",
        "SRD_METADATA"
      ]
    }
  ],
  "src/data/srd/references.json": [
    {
      "path": "src/data/srd/index.ts",
      "batchIndex": 14,
      "symbols": [
        "loadAbilitiesJson",
        "loadBackgroundsJson",
        "loadClassesJson",
        "loadClassProgressionJson",
        "loadConditionsJson",
        "loadEquipmentJson",
        "loadLanguagesJson",
        "loadMonstersJson",
        "loadRacesJson",
        "loadReferencesJson",
        "loadSkillsJson",
        "loadSpellsJson",
        "SRD_METADATA"
      ]
    }
  ],
  "src/data/srd/skills.json": [
    {
      "path": "src/data/srd/index.ts",
      "batchIndex": 14,
      "symbols": [
        "loadAbilitiesJson",
        "loadBackgroundsJson",
        "loadClassesJson",
        "loadClassProgressionJson",
        "loadConditionsJson",
        "loadEquipmentJson",
        "loadLanguagesJson",
        "loadMonstersJson",
        "loadRacesJson",
        "loadReferencesJson",
        "loadSkillsJson",
        "loadSpellsJson",
        "SRD_METADATA"
      ]
    }
  ],
  "src/data/srd/spells.json": [
    {
      "path": "src/data/srd/index.ts",
      "batchIndex": 14,
      "symbols": [
        "loadAbilitiesJson",
        "loadBackgroundsJson",
        "loadClassesJson",
        "loadClassProgressionJson",
        "loadConditionsJson",
        "loadEquipmentJson",
        "loadLanguagesJson",
        "loadMonstersJson",
        "loadRacesJson",
        "loadReferencesJson",
        "loadSkillsJson",
        "loadSpellsJson",
        "SRD_METADATA"
      ]
    }
  ]
}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields — `path`, `language`, `sizeLines`, `fileCategory`):
1. `src/data/srd/abilities.json` (9 lines, language: `json`, fileCategory: `config`)
2. `src/data/srd/backgrounds.json` (23 lines, language: `json`, fileCategory: `config`)
3. `src/data/srd/classProgression.json` (19 lines, language: `json`, fileCategory: `config`)
4. `src/data/srd/classes.json` (14 lines, language: `json`, fileCategory: `config`)
5. `src/data/srd/conditions.json` (17 lines, language: `json`, fileCategory: `config`)
6. `src/data/srd/equipment.json` (25 lines, language: `json`, fileCategory: `config`)
7. `src/data/srd/languages.json` (19 lines, language: `json`, fileCategory: `config`)
8. `src/data/srd/monsters.json` (20059 lines, language: `json`, fileCategory: `config`)
9. `src/data/srd/races.json` (154 lines, language: `json`, fileCategory: `config`)
10. `src/data/srd/references.json` (128 lines, language: `json`, fileCategory: `config`)
11. `src/data/srd/skills.json` (21 lines, language: `json`, fileCategory: `config`)
12. `src/data/srd/spells.json` (10031 lines, language: `json`, fileCategory: `config`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").
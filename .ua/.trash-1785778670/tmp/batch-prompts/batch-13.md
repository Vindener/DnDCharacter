Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 13/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-13.json` (single-file mode) OR `batch-13-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):

```json
{
  "src/domain/types/character.ts": [
    "src/types/DeathSaves.ts",
    "src/types/HitPoints.ts",
    "src/types/SavingThrows.ts",
    "src/types/Skills.ts",
    "src/types/Spells.ts",
    "src/types/Stats.ts",
    "src/types/Traits.ts",
    "src/types/Weapon.ts"
  ],
  "src/screens/Character/hooks/levelChange.test.ts": ["src/screens/Character/hooks/levelChange.ts"],
  "src/screens/Character/hooks/levelChange.ts": ["src/shared/helpers/dice.ts", "src/types/HitPoints.ts", "src/types/Stats.ts"],
  "src/shared/const/WeaponsDb.ts": [],
  "src/shared/helpers/derived.test.ts": ["src/shared/helpers/derived.ts"],
  "src/shared/helpers/derived.ts": ["src/types/Character.ts", "src/types/Skills.ts", "src/types/Stats.ts"],
  "src/shared/helpers/dice.ts": [],
  "src/shared/helpers/gear.ts": [
    "src/domain/types/index.ts",
    "src/shared/const/WeaponsDb.ts",
    "src/shared/helpers/weapons.ts",
    "src/types/Weapon.ts"
  ],
  "src/shared/helpers/weapons.ts": ["src/shared/const/WeaponsDb.ts"],
  "src/stores/characterStore.ts": [
    "src/domain/types/index.ts",
    "src/services/storeEffects/characterStoreEffects.ts",
    "src/shared/const/attributes.ts",
    "src/types/Spells.ts",
    "src/types/Traits.ts",
    "src/types/Weapon.ts"
  ],
  "src/types/DeathSaves.ts": [],
  "src/types/HitPoints.ts": [],
  "src/types/SavingThrows.ts": [],
  "src/types/Skills.ts": [],
  "src/types/SpellSlots.ts": [],
  "src/types/Spells.ts": ["src/types/SpellSlots.ts"],
  "src/types/Stats.ts": [],
  "src/types/Traits.ts": [],
  "src/types/Weapon.ts": []
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):

```json
{
  "src/domain/types/character.ts": [
    {
      "path": "src/domain/spellbook/characterSpellAdapter.ts",
      "batchIndex": 12,
      "symbols": [
        "normalizeSpellName",
        "getPreparedSpellsLimit",
        "collectCharacterSpellNames",
        "getCharacterSpellStatus",
        "applySpellStatus"
      ]
    }
  ],
  "src/screens/Character/hooks/levelChange.ts": [
    {
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": ["useCharacterActions"]
    }
  ],
  "src/shared/const/WeaponsDb.ts": [
    {
      "path": "src/shared/components/CharacterStats/Tabs/Inventory/Inventory.tsx",
      "batchIndex": 11,
      "symbols": []
    }
  ],
  "src/shared/helpers/derived.ts": [
    {
      "path": "src/types/Character.ts",
      "batchIndex": 11,
      "symbols": [
        "CharacterCombatTemplates",
        "CharacterContentOrigin",
        "CharacterContentSourceRef",
        "CharacterContentSources",
        "CharacterCustomFeatureBlock",
        "CharacterCustomField",
        "CharacterCustomNotesGroup",
        "CharacterCustomResetRule",
        "CharacterCustomResource",
        "CharacterCustomSection",
        "CharacterCustomSpellList",
        "CharacterDraft",
        "CharacterDto",
        "CharacterEquipment",
        "CharacterEntity",
        "CharacterHomebrewEntry",
        "CharacterNotesBlocks",
        "CharacterTemplateId",
        "CharacterTracker",
        "CharacterViewModel",
        "CustomFieldType",
        "HomebrewEntryKind",
        "SkillProficiencyRank",
        "TrackerResetRule",
        "TrackerVisibility"
      ]
    },
    {
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": ["useCharacterActions"]
    }
  ],
  "src/shared/helpers/dice.ts": [
    {
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": ["useCharacterActions"]
    }
  ],
  "src/shared/helpers/gear.ts": [
    {
      "path": "src/domain/types/index.ts",
      "batchIndex": 5,
      "symbols": []
    }
  ],
  "src/stores/characterStore.ts": [
    {
      "path": "src/domain/types/index.ts",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/services/storeEffects/characterStoreEffects.ts",
      "batchIndex": 10,
      "symbols": ["createCharacterStoreEffects"]
    },
    {
      "path": "src/shared/const/attributes.ts",
      "batchIndex": 11,
      "symbols": ["attributes"]
    }
  ],
  "src/types/DeathSaves.ts": [
    {
      "path": "src/shared/components/CharacterStats/Tabs/Combat/Combat.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/types/HitPoints.ts": [
    {
      "path": "src/shared/components/CharacterStats/Tabs/Combat/Combat.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/types/Skills.ts": [
    {
      "path": "src/domain/srd/types.ts",
      "batchIndex": 12,
      "symbols": []
    }
  ],
  "src/types/Spells.ts": [
    {
      "path": "src/shared/components/CharacterStats/Tabs/Spells/Spells.tsx",
      "batchIndex": 11,
      "symbols": []
    }
  ],
  "src/types/Stats.ts": [
    {
      "path": "src/domain/srd/types.ts",
      "batchIndex": 12,
      "symbols": []
    }
  ],
  "src/types/Traits.ts": [
    {
      "path": "src/shared/components/CharacterStats/Tabs/Traits/Traits.tsx",
      "batchIndex": 11,
      "symbols": []
    }
  ],
  "src/types/Weapon.ts": [
    {
      "path": "src/shared/components/CharacterStats/Tabs/Weapons/Weapon.tsx",
      "batchIndex": 11,
      "symbols": []
    }
  ]
}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields — `path`, `language`, `sizeLines`, `fileCategory`):

1. `src/domain/types/character.ts` (205 lines, language: `typescript`, fileCategory: `code`)
2. `src/screens/Character/hooks/levelChange.test.ts` (105 lines, language: `typescript`, fileCategory: `code`)
3. `src/screens/Character/hooks/levelChange.ts` (87 lines, language: `typescript`, fileCategory: `code`)
4. `src/shared/const/WeaponsDb.ts` (25 lines, language: `typescript`, fileCategory: `code`)
5. `src/shared/helpers/derived.test.ts` (38 lines, language: `typescript`, fileCategory: `code`)
6. `src/shared/helpers/derived.ts` (156 lines, language: `typescript`, fileCategory: `code`)
7. `src/shared/helpers/dice.ts` (13 lines, language: `typescript`, fileCategory: `code`)
8. `src/shared/helpers/gear.ts` (21 lines, language: `typescript`, fileCategory: `code`)
9. `src/shared/helpers/weapons.ts` (11 lines, language: `typescript`, fileCategory: `code`)
10. `src/stores/characterStore.ts` (79 lines, language: `typescript`, fileCategory: `code`)
11. `src/types/DeathSaves.ts` (4 lines, language: `typescript`, fileCategory: `code`)
12. `src/types/HitPoints.ts` (5 lines, language: `typescript`, fileCategory: `code`)
13. `src/types/SavingThrows.ts` (9 lines, language: `typescript`, fileCategory: `code`)
14. `src/types/Skills.ts` (20 lines, language: `typescript`, fileCategory: `code`)
15. `src/types/SpellSlots.ts` (6 lines, language: `typescript`, fileCategory: `code`)
16. `src/types/Spells.ts` (11 lines, language: `typescript`, fileCategory: `code`)
17. `src/types/Stats.ts` (8 lines, language: `typescript`, fileCategory: `code`)
18. `src/types/Traits.ts` (6 lines, language: `typescript`, fileCategory: `code`)
19. `src/types/Weapon.ts` (5 lines, language: `typescript`, fileCategory: `code`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").

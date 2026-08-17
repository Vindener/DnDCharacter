Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 4/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-4.json` (single-file mode) OR `batch-4-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):

```json
{
  "src/dm/repositories/campaignNotesRepository.test.ts": [
    "src/dm/repositories/campaignNotesRepository.ts",
    "src/domain/migrations/index.ts"
  ],
  "src/dm/repositories/campaignRepository.test.ts": ["src/dm/repositories/campaignRepository.ts", "src/domain/migrations/index.ts"],
  "src/dm/repositories/dmSettingsRepository.ts": ["src/domain/migrations/index.ts"],
  "src/domain/mappers/character.mapper.test.ts": ["src/domain/mappers/character.mapper.ts", "src/domain/migrations/index.ts"],
  "src/domain/mappers/character.mapper.ts": ["src/domain/migrations/index.ts", "src/domain/schemas/index.ts", "src/domain/types/index.ts"],
  "src/domain/mappers/homebrew.mapper.test.ts": ["src/domain/mappers/homebrew.mapper.ts"],
  "src/domain/mappers/homebrew.mapper.ts": ["src/domain/schemas/index.ts", "src/domain/types/index.ts"],
  "src/domain/mappers/spell.mapper.ts": ["src/domain/schemas/index.ts", "src/domain/types/index.ts"],
  "src/domain/migrations/index.test.ts": ["src/domain/migrations/index.ts"],
  "src/domain/migrations/index.ts": [],
  "src/domain/schemas/campaignEncounter.schema.ts": [
    "src/domain/migrations/index.ts",
    "src/domain/schemas/campaignNote.schema.ts",
    "src/domain/schemas/utils.ts",
    "src/domain/types/index.ts"
  ],
  "src/domain/schemas/campaignInitiative.schema.test.ts": ["src/domain/migrations/index.ts", "src/domain/schemas/index.ts"],
  "src/domain/schemas/campaignInitiative.schema.ts": [
    "src/domain/migrations/index.ts",
    "src/domain/schemas/utils.ts",
    "src/domain/types/index.ts"
  ],
  "src/domain/schemas/campaignNote.schema.test.ts": ["src/domain/migrations/index.ts", "src/domain/schemas/index.ts"],
  "src/domain/schemas/campaignNote.schema.ts": [
    "src/domain/migrations/index.ts",
    "src/domain/schemas/utils.ts",
    "src/domain/types/index.ts"
  ],
  "src/domain/schemas/character.schema.test.ts": ["src/domain/migrations/index.ts", "src/domain/schemas/index.ts"],
  "src/domain/schemas/character.schema.ts": [
    "src/domain/migrations/index.ts",
    "src/domain/schemas/homebrew.schema.ts",
    "src/domain/schemas/spell.schema.ts",
    "src/domain/schemas/utils.ts",
    "src/domain/types/index.ts"
  ],
  "src/domain/schemas/createCharacterWizard.schema.test.ts": ["src/domain/schemas/index.ts"],
  "src/domain/schemas/createCharacterWizard.schema.ts": [
    "src/domain/schemas/utils.ts",
    "src/screens/CreateCharacter/createCharacterWizard.ts"
  ],
  "src/domain/schemas/homebrew.schema.test.ts": ["src/domain/schemas/index.ts"],
  "src/domain/schemas/homebrew.schema.ts": ["src/domain/schemas/utils.ts", "src/domain/types/index.ts"],
  "src/domain/schemas/index.ts": [],
  "src/domain/schemas/spell.schema.test.ts": ["src/domain/schemas/index.ts"],
  "src/domain/schemas/spell.schema.ts": ["src/domain/schemas/utils.ts", "src/domain/types/index.ts"],
  "src/domain/schemas/utils.ts": [],
  "src/domain/srd/index.ts": []
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):

```json
{
  "src/dm/repositories/campaignNotesRepository.test.ts": [
    {
      "path": "src/dm/repositories/campaignNotesRepository.ts",
      "batchIndex": 1,
      "symbols": [
        "loadLocalCampaignNotes",
        "subscribeCampaignNotes",
        "upsertCampaignNote",
        "deleteCampaignNote",
        "flushCampaignNotesQueue",
        "resolveCampaignNoteConflict"
      ]
    }
  ],
  "src/dm/repositories/campaignRepository.test.ts": [
    {
      "path": "src/dm/repositories/campaignRepository.ts",
      "batchIndex": 1,
      "symbols": [
        "loadLocalCampaigns",
        "upsertCampaign",
        "ensureCampaignForName",
        "renameCampaign",
        "updateCampaignSummary",
        "deleteCampaign",
        "togglePinnedMonsterForCampaign",
        "togglePinnedSpellForCampaign",
        "addCampaignEditorByEmail",
        "getCampaignForLink",
        "subscribeAccessibleCampaigns"
      ]
    }
  ],
  "src/dm/repositories/dmSettingsRepository.ts": [
    {
      "path": "src/stores/dmSettingsStore.ts",
      "batchIndex": 5,
      "symbols": []
    }
  ],
  "src/domain/mappers/character.mapper.ts": [
    {
      "path": "src/domain/types/index.ts",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/domain/mappers/index.ts",
      "batchIndex": 12,
      "symbols": ["characterMapper", "homebrewMapper", "spellMapper"]
    }
  ],
  "src/domain/mappers/homebrew.mapper.ts": [
    {
      "path": "src/domain/types/index.ts",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/domain/mappers/index.ts",
      "batchIndex": 12,
      "symbols": ["characterMapper", "homebrewMapper", "spellMapper"]
    }
  ],
  "src/domain/mappers/spell.mapper.ts": [
    {
      "path": "src/domain/types/index.ts",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/domain/mappers/index.ts",
      "batchIndex": 12,
      "symbols": ["characterMapper", "homebrewMapper", "spellMapper"]
    }
  ],
  "src/domain/migrations/index.ts": [
    {
      "path": "src/dm/repositories/appRoleRepository.ts",
      "batchIndex": 15,
      "symbols": ["loadAppRole", "persistAppRole"]
    },
    {
      "path": "src/dm/repositories/campaignEncountersRepository.test.ts",
      "batchIndex": 1,
      "symbols": []
    },
    {
      "path": "src/dm/repositories/campaignEncountersRepository.ts",
      "batchIndex": 1,
      "symbols": [
        "loadLocalCampaignEncounters",
        "subscribeCampaignEncounters",
        "upsertCampaignEncounter",
        "deleteCampaignEncounter",
        "flushCampaignEncountersQueue",
        "resolveCampaignEncounterConflict"
      ]
    },
    {
      "path": "src/dm/repositories/campaignInitiativeRepository.test.ts",
      "batchIndex": 1,
      "symbols": []
    },
    {
      "path": "src/dm/repositories/campaignInitiativeRepository.ts",
      "batchIndex": 1,
      "symbols": [
        "loadLocalCampaignInitiative",
        "startCampaignInitiative",
        "updateCampaignInitiative",
        "endCampaignInitiative",
        "subscribeCampaignInitiative"
      ]
    },
    {
      "path": "src/dm/repositories/campaignNotesRepository.ts",
      "batchIndex": 1,
      "symbols": [
        "loadLocalCampaignNotes",
        "subscribeCampaignNotes",
        "upsertCampaignNote",
        "deleteCampaignNote",
        "flushCampaignNotesQueue",
        "resolveCampaignNoteConflict"
      ]
    },
    {
      "path": "src/dm/repositories/campaignRepository.ts",
      "batchIndex": 1,
      "symbols": [
        "loadLocalCampaigns",
        "upsertCampaign",
        "ensureCampaignForName",
        "renameCampaign",
        "updateCampaignSummary",
        "deleteCampaign",
        "togglePinnedMonsterForCampaign",
        "togglePinnedSpellForCampaign",
        "addCampaignEditorByEmail",
        "getCampaignForLink",
        "subscribeAccessibleCampaigns"
      ]
    },
    {
      "path": "src/dm/repositories/monsterRepository.ts",
      "batchIndex": 2,
      "symbols": ["loadMonstersState", "persistMonstersState", "persistPinnedMonsterIds", "persistFavoriteMonsterIds"]
    },
    {
      "path": "src/dm/repositories/trackerTemplatesRepository.ts",
      "batchIndex": 15,
      "symbols": ["loadTrackerTemplates", "persistTrackerTemplates"]
    },
    {
      "path": "src/domain/spellbook/spellLocalRepository.ts",
      "batchIndex": 12,
      "symbols": ["createSpellLocalRepository"]
    },
    {
      "path": "src/domain/spellbook/spellRepository.test.ts",
      "batchIndex": 2,
      "symbols": []
    },
    {
      "path": "src/repositories/characterCloudRepository.ts",
      "batchIndex": 1,
      "symbols": [
        "upsertCharacterSheetFromLocal",
        "bulkUpsertFromLocal",
        "subscribeCharacterSheet",
        "updateCharacterSheet",
        "deleteCharacterSheet",
        "addEditorByEmail",
        "removeEditor",
        "transferOwnership",
        "saveCharacterSheetAsNew",
        "stripUndefinedDeep",
        "subscribeMySheets",
        "subscribeSharedWithMe",
        "fetchCharacterSheet",
        "autosaveCharacter",
        "getEditorsForSheet",
        "upsertFromLocal",
        "fetchById",
        "subscribeById",
        "subscribeMine",
        "subscribeShared",
        "updateById",
        "deleteById",
        "characterCloudRepository"
      ]
    },
    {
      "path": "src/repositories/characterLocalRepository.test.ts",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/repositories/characterLocalRepository.ts",
      "batchIndex": 5,
      "symbols": ["characterLocalRepository"]
    },
    {
      "path": "src/services/dmCampaignNotes.test.ts",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/services/dmCampaigns.test.ts",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/services/storeEffects/dmStoreEffects.ts",
      "batchIndex": 12,
      "symbols": ["createDmStoreEffects"]
    }
  ],
  "src/domain/schemas/campaignEncounter.schema.ts": [
    {
      "path": "src/domain/types/index.ts",
      "batchIndex": 5,
      "symbols": []
    }
  ],
  "src/domain/schemas/campaignInitiative.schema.ts": [
    {
      "path": "src/domain/types/index.ts",
      "batchIndex": 5,
      "symbols": []
    }
  ],
  "src/domain/schemas/campaignNote.schema.ts": [
    {
      "path": "src/domain/types/index.ts",
      "batchIndex": 5,
      "symbols": []
    }
  ],
  "src/domain/schemas/character.schema.ts": [
    {
      "path": "src/domain/types/index.ts",
      "batchIndex": 5,
      "symbols": []
    }
  ],
  "src/domain/schemas/createCharacterWizard.schema.ts": [
    {
      "path": "src/screens/CreateCharacter/createCharacterWizard.ts",
      "batchIndex": 5,
      "symbols": [
        "TOTAL_CREATE_CHARACTER_STEPS",
        "ABILITY_KEYS",
        "getSrdClassOptions",
        "getCreateClassOptions",
        "getSrdRaceOptions",
        "getSrdBackgroundOptions",
        "ABILITY_NAMES_UA",
        "ABILITY_SHORT",
        "STANDARD_ARRAY",
        "POINT_BUY_MIN",
        "POINT_BUY_MAX",
        "POINT_BUY_BUDGET",
        "POINT_BUY_COST",
        "getCreateClassById",
        "getCreateStartingEquipmentForClass",
        "createInitialDraft",
        "mergeDraftWithDefaults",
        "applyStartMethod",
        "applyDerivedDefaults",
        "deriveDraftDefaults",
        "getBaseStats",
        "formatAbilityModifier",
        "signedNumber",
        "pointBuySpent",
        "createSavingThrowDefaults",
        "buildBackgroundMechanics",
        "shouldShowMagicStep",
        "rollAbilityScore",
        "rollAllAbilityScores",
        "buildCharacterFromDraft"
      ]
    }
  ],
  "src/domain/schemas/homebrew.schema.ts": [
    {
      "path": "src/domain/types/index.ts",
      "batchIndex": 5,
      "symbols": []
    }
  ],
  "src/domain/schemas/index.ts": [
    {
      "path": "src/dm/repositories/campaignEncountersRepository.ts",
      "batchIndex": 1,
      "symbols": [
        "loadLocalCampaignEncounters",
        "subscribeCampaignEncounters",
        "upsertCampaignEncounter",
        "deleteCampaignEncounter",
        "flushCampaignEncountersQueue",
        "resolveCampaignEncounterConflict"
      ]
    },
    {
      "path": "src/dm/repositories/campaignInitiativeRepository.ts",
      "batchIndex": 1,
      "symbols": [
        "loadLocalCampaignInitiative",
        "startCampaignInitiative",
        "updateCampaignInitiative",
        "endCampaignInitiative",
        "subscribeCampaignInitiative"
      ]
    },
    {
      "path": "src/dm/repositories/campaignNotesRepository.ts",
      "batchIndex": 1,
      "symbols": [
        "loadLocalCampaignNotes",
        "subscribeCampaignNotes",
        "upsertCampaignNote",
        "deleteCampaignNote",
        "flushCampaignNotesQueue",
        "resolveCampaignNoteConflict"
      ]
    },
    {
      "path": "src/domain/spellbook/spellRepository.ts",
      "batchIndex": 12,
      "symbols": ["createSpellRepository"]
    },
    {
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": ["useCharacterActions"]
    },
    {
      "path": "src/screens/CreateCharacter/CreateCharacter.tsx",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMCampaignNotes.tsx",
      "batchIndex": 1,
      "symbols": []
    },
    {
      "path": "src/screens/Spellbook/Spellbook.tsx",
      "batchIndex": 2,
      "symbols": []
    },
    {
      "path": "src/services/storeEffects/characterStoreEffects.ts",
      "batchIndex": 10,
      "symbols": ["createCharacterStoreEffects"]
    },
    {
      "path": "src/shared/helpers/createEmptyCharacter.ts",
      "batchIndex": 5,
      "symbols": ["createEmptyCharacter"]
    }
  ],
  "src/domain/schemas/spell.schema.ts": [
    {
      "path": "src/domain/types/index.ts",
      "batchIndex": 5,
      "symbols": []
    }
  ],
  "src/domain/srd/index.ts": [
    {
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": ["useCharacterActions"]
    },
    {
      "path": "src/screens/CreateCharacter/CreateCharacter.tsx",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/screens/CreateCharacter/createCharacterWizard.ts",
      "batchIndex": 5,
      "symbols": [
        "TOTAL_CREATE_CHARACTER_STEPS",
        "ABILITY_KEYS",
        "getSrdClassOptions",
        "getCreateClassOptions",
        "getSrdRaceOptions",
        "getSrdBackgroundOptions",
        "ABILITY_NAMES_UA",
        "ABILITY_SHORT",
        "STANDARD_ARRAY",
        "POINT_BUY_MIN",
        "POINT_BUY_MAX",
        "POINT_BUY_BUDGET",
        "POINT_BUY_COST",
        "getCreateClassById",
        "getCreateStartingEquipmentForClass",
        "createInitialDraft",
        "mergeDraftWithDefaults",
        "applyStartMethod",
        "applyDerivedDefaults",
        "deriveDraftDefaults",
        "getBaseStats",
        "formatAbilityModifier",
        "signedNumber",
        "pointBuySpent",
        "createSavingThrowDefaults",
        "buildBackgroundMechanics",
        "shouldShowMagicStep",
        "rollAbilityScore",
        "rollAllAbilityScores",
        "buildCharacterFromDraft"
      ]
    }
  ]
}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields — `path`, `language`, `sizeLines`, `fileCategory`):

1. `src/dm/repositories/campaignNotesRepository.test.ts` (90 lines, language: `typescript`, fileCategory: `code`)
2. `src/dm/repositories/campaignRepository.test.ts` (406 lines, language: `typescript`, fileCategory: `code`)
3. `src/dm/repositories/dmSettingsRepository.ts` (24 lines, language: `typescript`, fileCategory: `code`)
4. `src/domain/mappers/character.mapper.test.ts` (58 lines, language: `typescript`, fileCategory: `code`)
5. `src/domain/mappers/character.mapper.ts` (56 lines, language: `typescript`, fileCategory: `code`)
6. `src/domain/mappers/homebrew.mapper.test.ts` (55 lines, language: `typescript`, fileCategory: `code`)
7. `src/domain/mappers/homebrew.mapper.ts` (29 lines, language: `typescript`, fileCategory: `code`)
8. `src/domain/mappers/spell.mapper.ts` (104 lines, language: `typescript`, fileCategory: `code`)
9. `src/domain/migrations/index.test.ts` (185 lines, language: `typescript`, fileCategory: `code`)
10. `src/domain/migrations/index.ts` (518 lines, language: `typescript`, fileCategory: `code`)
11. `src/domain/schemas/campaignEncounter.schema.ts` (179 lines, language: `typescript`, fileCategory: `code`)
12. `src/domain/schemas/campaignInitiative.schema.test.ts` (53 lines, language: `typescript`, fileCategory: `code`)
13. `src/domain/schemas/campaignInitiative.schema.ts` (91 lines, language: `typescript`, fileCategory: `code`)
14. `src/domain/schemas/campaignNote.schema.test.ts` (104 lines, language: `typescript`, fileCategory: `code`)
15. `src/domain/schemas/campaignNote.schema.ts` (145 lines, language: `typescript`, fileCategory: `code`)
16. `src/domain/schemas/character.schema.test.ts` (66 lines, language: `typescript`, fileCategory: `code`)
17. `src/domain/schemas/character.schema.ts` (269 lines, language: `typescript`, fileCategory: `code`)
18. `src/domain/schemas/createCharacterWizard.schema.test.ts` (104 lines, language: `typescript`, fileCategory: `code`)
19. `src/domain/schemas/createCharacterWizard.schema.ts` (220 lines, language: `typescript`, fileCategory: `code`)
20. `src/domain/schemas/homebrew.schema.test.ts` (33 lines, language: `typescript`, fileCategory: `code`)
21. `src/domain/schemas/homebrew.schema.ts` (372 lines, language: `typescript`, fileCategory: `code`)
22. `src/domain/schemas/index.ts` (54 lines, language: `typescript`, fileCategory: `code`)
23. `src/domain/schemas/spell.schema.test.ts` (31 lines, language: `typescript`, fileCategory: `code`)
24. `src/domain/schemas/spell.schema.ts` (314 lines, language: `typescript`, fileCategory: `code`)
25. `src/domain/schemas/utils.ts` (107 lines, language: `typescript`, fileCategory: `code`)
26. `src/domain/srd/index.ts` (5 lines, language: `typescript`, fileCategory: `code`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").

Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 12/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-12.json` (single-file mode) OR `batch-12-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):

```json
{
  "scripts/validate-srd.mjs": ["src/domain/srd/srdRepository.ts"],
  "src/domain/mappers/index.ts": [
    "src/domain/mappers/character.mapper.ts",
    "src/domain/mappers/homebrew.mapper.ts",
    "src/domain/mappers/spell.mapper.ts"
  ],
  "src/domain/spellbook/characterSpellAdapter.ts": [
    "src/domain/mappers/index.ts",
    "src/domain/spellbook/spellbookEntity.ts",
    "src/domain/types/character.ts",
    "src/shared/const/CharacterClass.ts",
    "src/shared/const/ClassPresets.ts",
    "src/shared/helpers/calculateModifier.ts"
  ],
  "src/domain/spellbook/spellCloudRepository.ts": ["src/domain/spellbook/spellRepository.ts"],
  "src/domain/spellbook/spellLocalRepository.ts": [
    "src/domain/mappers/index.ts",
    "src/domain/migrations/index.ts",
    "src/domain/spellbook/characterSpellAdapter.ts",
    "src/domain/spellbook/spellRepository.ts",
    "src/domain/spellbook/spellbookEntity.ts",
    "src/domain/srd/adapters.ts",
    "src/domain/srd/srdRepository.ts"
  ],
  "src/domain/spellbook/spellRepository.ts": [
    "src/domain/mappers/index.ts",
    "src/domain/schemas/index.ts",
    "src/domain/spellbook/characterSpellAdapter.ts",
    "src/domain/spellbook/spellCloudRepository.ts",
    "src/domain/spellbook/spellLocalRepository.ts",
    "src/domain/spellbook/spellbookEntity.ts"
  ],
  "src/domain/spellbook/spellbookEntity.ts": ["src/domain/types/sourceMetadata.ts"],
  "src/domain/srd/adapters.ts": ["src/domain/spellbook/spellbookEntity.ts", "src/domain/srd/types.ts", "src/types/Monster.ts"],
  "src/domain/srd/localization.test.ts": [
    "src/domain/srd/adapters.ts",
    "src/domain/srd/localization.ts",
    "src/domain/srd/srdRepository.ts"
  ],
  "src/domain/srd/schemas.ts": ["src/domain/srd/types.ts"],
  "src/domain/srd/srdRepository.test.ts": ["src/domain/srd/srdRepository.ts"],
  "src/domain/srd/srdRepository.ts": ["src/data/srd/index.ts", "src/domain/srd/schemas.ts", "src/domain/srd/types.ts"],
  "src/domain/srd/srdSelectors.ts": ["src/domain/srd/srdRepository.ts", "src/domain/srd/types.ts"],
  "src/domain/srd/types.ts": ["src/domain/types/sourceMetadata.ts", "src/types/Skills.ts", "src/types/Stats.ts"],
  "src/domain/types/sourceMetadata.ts": [],
  "src/services/storeEffects/dmStoreEffects.test.ts": ["src/services/storeEffects/dmStoreEffects.ts", "src/stores/dmStore.ts"],
  "src/services/storeEffects/dmStoreEffects.ts": [
    "src/dm/domain/types/index.ts",
    "src/domain/migrations/index.ts",
    "src/domain/srd/adapters.ts",
    "src/domain/srd/srdRepository.ts",
    "src/stores/dmStore.ts",
    "src/types/Character.ts",
    "src/types/Monster.ts"
  ],
  "src/shared/const/CharacterClass.ts": [],
  "src/stores/dmStore.ts": [
    "src/dm/domain/types/index.ts",
    "src/services/storeEffects/dmStoreEffects.ts",
    "src/types/Character.ts",
    "src/types/Monster.ts",
    "src/types/Product.ts"
  ]
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):

```json
{
  "src/domain/mappers/index.ts": [
    {
      "path": "src/domain/mappers/character.mapper.ts",
      "batchIndex": 4,
      "symbols": [
        "dtoToEntity",
        "entityToDto",
        "draftToEntity",
        "entityToViewModel",
        "viewModelToEntity",
        "cloudDocToDraft",
        "cloudDocToEntity",
        "mapCharacterDtoToEntity",
        "mapCharacterEntityToViewModel",
        "mapCharacterViewModelToDto",
        "mapCloudCharacterDocToDto"
      ]
    },
    {
      "path": "src/domain/mappers/homebrew.mapper.ts",
      "batchIndex": 4,
      "symbols": ["dtoToEntity", "entityToDto", "draftToEntity"]
    },
    {
      "path": "src/domain/mappers/spell.mapper.ts",
      "batchIndex": 4,
      "symbols": [
        "dtoToEntity",
        "entityToDto",
        "draftToEntity",
        "normalizeStoredSpellbookSpell",
        "spellbookInputToEntity",
        "spellbookMapper",
        "normalizeSpellbookDamageProfiles"
      ]
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
      "path": "src/repositories/characterLocalRepository.ts",
      "batchIndex": 5,
      "symbols": ["characterLocalRepository"]
    },
    {
      "path": "src/services/characterSyncCoordinator.ts",
      "batchIndex": 3,
      "symbols": [
        "buildDefaultSyncState",
        "normalizeSyncState",
        "normalizeSyncMap",
        "applySyncTransition",
        "buildUploadPlan",
        "reconcileRemoteSnapshot",
        "computeRemoteHistorySync",
        "computeSeenEntryIdsFromRawHistory",
        "syncToCloud",
        "resolveConflict"
      ]
    },
    {
      "path": "src/shared/helpers/homebrew.ts",
      "batchIndex": 3,
      "symbols": ["normalizeHomebrewV3", "isHomebrewCharacter", "appendQuickSessionNote"]
    },
    {
      "path": "src/shared/helpers/mapCloudCharacter.ts",
      "batchIndex": 3,
      "symbols": ["mapCloudCharacterToLocalDto"]
    },
    {
      "path": "src/shared/services/fileSerice.ts",
      "batchIndex": 2,
      "symbols": []
    }
  ],
  "src/domain/spellbook/characterSpellAdapter.ts": [
    {
      "path": "src/domain/types/character.ts",
      "batchIndex": 13,
      "symbols": []
    },
    {
      "path": "src/shared/const/ClassPresets.ts",
      "batchIndex": 5,
      "symbols": ["CLASS_PRESETS"]
    },
    {
      "path": "src/shared/helpers/calculateModifier.ts",
      "batchIndex": 6,
      "symbols": ["calculateModifier"]
    }
  ],
  "src/domain/spellbook/spellLocalRepository.ts": [
    {
      "path": "src/domain/migrations/index.ts",
      "batchIndex": 4,
      "symbols": [
        "LATEST_SCHEMA_VERSION",
        "migrateV1toV2",
        "migrateV2toV3",
        "migrateV3toV4",
        "migrateToLatest",
        "migratePayloadToLatest",
        "normalizeStorageEnvelope",
        "createStorageEnvelope"
      ]
    }
  ],
  "src/domain/spellbook/spellRepository.ts": [
    {
      "path": "src/domain/schemas/index.ts",
      "batchIndex": 4,
      "symbols": [
        "characterSchema",
        "parseCharacter",
        "parseCharacterDraft",
        "safeParseCharacter",
        "normalizeCharacter",
        "homebrewSchema",
        "parseHomebrew",
        "safeParseHomebrew",
        "normalizeHomebrew",
        "HomebrewEntitySlice",
        "spellSchema",
        "spellDamageProfileSchema",
        "characterSpellsSchema",
        "upsertSpellbookSpellInputSchema",
        "spellFormSchema",
        "parseSpell",
        "parseSpellbookStored",
        "parseSpellUpsertInput",
        "parseSpellFormInput",
        "safeParseSpell",
        "safeParseSpellFormInput",
        "normalizeSpell",
        "normalizeSpellbookDamageProfiles",
        "normalizeCharacterSpells",
        "SPELL_DAMAGE_TYPES",
        "campaignNoteSchema",
        "campaignNoteConflictRemoteSchema",
        "campaignNoteQueueItemSchema",
        "campaignNoteFormSchema",
        "parseCampaignNote",
        "parseCampaignNoteConflictRemote",
        "parseCampaignNoteQueueItem",
        "parseCampaignNoteFormInput",
        "safeParseCampaignNote",
        "safeParseCampaignNoteFormInput",
        "normalizeCampaignNote",
        "NOTE_SYNC_STATUS",
        "campaignEncounterSchema",
        "campaignEncounterConflictRemoteSchema",
        "campaignEncounterQueueItemSchema",
        "parseCampaignEncounter",
        "parseCampaignEncounterConflictRemote",
        "parseCampaignEncounterQueueItem",
        "safeParseCampaignEncounter",
        "campaignInitiativeSchema",
        "parseCampaignInitiative",
        "safeParseCampaignInitiative",
        "createCharacterWizardSchema",
        "parseCreateCharacterWizard",
        "safeParseCreateCharacterWizard",
        "safeParseCreateCharacterWizardStep",
        "normalizeCreateCharacterWizard",
        "CreateCharacterWizardPayload",
        "StorageMode",
        "StatMethod",
        "formatSchemaErrors",
        "safeParseWithIssues",
        "SchemaIssue",
        "SafeSchemaResult"
      ]
    }
  ],
  "src/domain/srd/adapters.ts": [
    {
      "path": "src/types/Monster.ts",
      "batchIndex": 2,
      "symbols": []
    },
    {
      "path": "src/screens/Bestiary/bestiaryFilters.test.ts",
      "batchIndex": 2,
      "symbols": []
    }
  ],
  "src/domain/srd/localization.test.ts": [
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
  "src/domain/srd/srdRepository.ts": [
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
    },
    {
      "path": "index.js",
      "batchIndex": 14,
      "symbols": []
    },
    {
      "path": "src/screens/Bestiary/bestiaryFilters.test.ts",
      "batchIndex": 2,
      "symbols": []
    },
    {
      "path": "src/screens/References/References.tsx",
      "batchIndex": 10,
      "symbols": ["References"]
    }
  ],
  "src/domain/srd/types.ts": [
    {
      "path": "src/types/Skills.ts",
      "batchIndex": 13,
      "symbols": []
    },
    {
      "path": "src/types/Stats.ts",
      "batchIndex": 13,
      "symbols": []
    }
  ],
  "src/domain/types/sourceMetadata.ts": [
    {
      "path": "src/types/Monster.ts",
      "batchIndex": 2,
      "symbols": []
    }
  ],
  "src/services/storeEffects/dmStoreEffects.ts": [
    {
      "path": "src/dm/domain/types/index.ts",
      "batchIndex": 1,
      "symbols": []
    },
    {
      "path": "src/domain/migrations/index.ts",
      "batchIndex": 4,
      "symbols": [
        "LATEST_SCHEMA_VERSION",
        "migrateV1toV2",
        "migrateV2toV3",
        "migrateV3toV4",
        "migrateToLatest",
        "migratePayloadToLatest",
        "normalizeStorageEnvelope",
        "createStorageEnvelope"
      ]
    },
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
      "path": "src/types/Monster.ts",
      "batchIndex": 2,
      "symbols": []
    }
  ],
  "src/stores/dmStore.ts": [
    {
      "path": "src/dm/domain/types/index.ts",
      "batchIndex": 1,
      "symbols": []
    },
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
      "path": "src/types/Monster.ts",
      "batchIndex": 2,
      "symbols": []
    },
    {
      "path": "src/types/Product.ts",
      "batchIndex": 15,
      "symbols": ["APP_ROLES"]
    }
  ]
}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields — `path`, `language`, `sizeLines`, `fileCategory`):

1. `scripts/validate-srd.mjs` (13 lines, language: `javascript`, fileCategory: `code`)
2. `src/domain/mappers/index.ts` (5 lines, language: `typescript`, fileCategory: `code`)
3. `src/domain/spellbook/characterSpellAdapter.ts` (201 lines, language: `typescript`, fileCategory: `code`)
4. `src/domain/spellbook/spellCloudRepository.ts` (8 lines, language: `typescript`, fileCategory: `code`)
5. `src/domain/spellbook/spellLocalRepository.ts` (197 lines, language: `typescript`, fileCategory: `code`)
6. `src/domain/spellbook/spellRepository.ts` (266 lines, language: `typescript`, fileCategory: `code`)
7. `src/domain/spellbook/spellbookEntity.ts` (75 lines, language: `typescript`, fileCategory: `code`)
8. `src/domain/srd/adapters.ts` (69 lines, language: `typescript`, fileCategory: `code`)
9. `src/domain/srd/localization.test.ts` (58 lines, language: `typescript`, fileCategory: `code`)
10. `src/domain/srd/schemas.ts` (190 lines, language: `typescript`, fileCategory: `code`)
11. `src/domain/srd/srdRepository.test.ts` (107 lines, language: `typescript`, fileCategory: `code`)
12. `src/domain/srd/srdRepository.ts` (215 lines, language: `typescript`, fileCategory: `code`)
13. `src/domain/srd/srdSelectors.ts` (103 lines, language: `typescript`, fileCategory: `code`)
14. `src/domain/srd/types.ts` (173 lines, language: `typescript`, fileCategory: `code`)
15. `src/domain/types/sourceMetadata.ts` (13 lines, language: `typescript`, fileCategory: `code`)
16. `src/services/storeEffects/dmStoreEffects.test.ts` (184 lines, language: `typescript`, fileCategory: `code`)
17. `src/services/storeEffects/dmStoreEffects.ts` (292 lines, language: `typescript`, fileCategory: `code`)
18. `src/shared/const/CharacterClass.ts` (32 lines, language: `typescript`, fileCategory: `code`)
19. `src/stores/dmStore.ts` (61 lines, language: `typescript`, fileCategory: `code`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").

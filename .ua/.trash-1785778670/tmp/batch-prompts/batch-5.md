Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 5/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-5.json` (single-file mode) OR `batch-5-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):

```json
{
  "src/domain/types/index.ts": [],
  "src/repositories/characterCloudRepository.test.ts": [
    "src/repositories/characterCloudRepository.ts",
    "src/shared/helpers/createEmptyCharacter.ts"
  ],
  "src/repositories/characterLocalRepository.test.ts": ["src/domain/migrations/index.ts", "src/repositories/characterLocalRepository.ts"],
  "src/repositories/characterLocalRepository.ts": [
    "src/domain/mappers/index.ts",
    "src/domain/migrations/index.ts",
    "src/domain/types/index.ts"
  ],
  "src/repositories/createCharacterDraftRepository.ts": ["src/screens/CreateCharacter/createCharacterWizard.ts"],
  "src/screens/CreateCharacter/CreateCharacter.test.tsx": [
    "src/dm/domain/types/index.ts",
    "src/domain/types/index.ts",
    "src/screens/CreateCharacter/CreateCharacter.tsx",
    "src/screens/CreateCharacter/createCharacterWizard.ts"
  ],
  "src/screens/CreateCharacter/CreateCharacter.tsx": [
    "src/context/Character-store.ts",
    "src/context/Sync-store.ts",
    "src/context/Theme-store.ts",
    "src/dm/domain/types/index.ts",
    "src/dm/repositories/campaignRepository.ts",
    "src/domain/schemas/index.ts",
    "src/domain/srd/index.ts",
    "src/navigation/TabNavigator.tsx",
    "src/repositories/characterCloudRepository.ts",
    "src/repositories/createCharacterDraftRepository.ts",
    "src/screens/CreateCharacter/createCharacterWizard.ts",
    "src/screens/CreateCharacter/style.ts",
    "src/services/characterSyncCoordinator.ts",
    "src/services/firebase.ts",
    "src/shared/const/CharacterTemplates.ts",
    "src/shared/const/Subclasses.ts",
    "src/shared/services/auth/index.ts",
    "src/shared/services/fileSerice.ts"
  ],
  "src/screens/CreateCharacter/createCharacterWizard.test.ts": ["src/screens/CreateCharacter/createCharacterWizard.ts"],
  "src/screens/CreateCharacter/createCharacterWizard.ts": [
    "src/domain/srd/index.ts",
    "src/domain/types/index.ts",
    "src/shared/const/CharacterTemplates.ts",
    "src/shared/helpers/combat.ts",
    "src/shared/helpers/createEmptyCharacter.ts",
    "src/shared/services/diceRoller.ts",
    "src/types/skillToStat.ts"
  ],
  "src/screens/Home/Home.test.tsx": [
    "src/screens/Home/Home.tsx",
    "src/shared/helpers/createEmptyCharacter.ts",
    "src/shared/services/auth/index.ts",
    "src/types/Character.ts"
  ],
  "src/services/dmCampaignNotes.test.ts": ["src/domain/migrations/index.ts", "src/services/dmCampaignNotes.ts"],
  "src/services/dmCampaignNotes.ts": [],
  "src/services/dmCampaigns.test.ts": ["src/domain/migrations/index.ts", "src/services/dmCampaigns.ts"],
  "src/services/dmCampaigns.ts": [],
  "src/shared/const/CharacterTemplates.ts": ["src/domain/types/index.ts"],
  "src/shared/const/ClassPresets.ts": [],
  "src/shared/const/Subclasses.ts": [],
  "src/shared/const/Weapons.ts": [],
  "src/shared/helpers/combat.ts": ["src/domain/types/index.ts", "src/shared/const/ClassPresets.ts", "src/shared/const/Weapons.ts"],
  "src/shared/helpers/createEmptyCharacter.ts": ["src/domain/schemas/index.ts", "src/domain/types/index.ts"],
  "src/stores/dmSettingsStore.ts": ["src/dm/repositories/dmSettingsRepository.ts"],
  "src/stores/selectors/characterStoreSelectors.ts": ["src/domain/types/index.ts"],
  "src/stores/selectors/syncStoreSelectors.ts": ["src/types/Sync.ts"],
  "src/stores/storeSelectors.test.ts": [
    "src/shared/helpers/createEmptyCharacter.ts",
    "src/stores/selectors/characterStoreSelectors.ts",
    "src/stores/selectors/syncStoreSelectors.ts"
  ],
  "src/types/skillToStat.ts": ["src/domain/types/index.ts"]
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):

```json
{
  "src/domain/types/index.ts": [
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
      "path": "src/domain/schemas/campaignEncounter.schema.ts",
      "batchIndex": 4,
      "symbols": [
        "campaignEncounterConflictRemoteSchema",
        "campaignEncounterSchema",
        "campaignEncounterQueueItemSchema",
        "parseCampaignEncounterConflictRemote",
        "parseCampaignEncounter",
        "parseCampaignEncounterQueueItem",
        "safeParseCampaignEncounter"
      ]
    },
    {
      "path": "src/domain/schemas/campaignInitiative.schema.ts",
      "batchIndex": 4,
      "symbols": ["campaignInitiativeSchema", "parseCampaignInitiative", "safeParseCampaignInitiative"]
    },
    {
      "path": "src/domain/schemas/campaignNote.schema.ts",
      "batchIndex": 4,
      "symbols": [
        "NOTE_SYNC_STATUS",
        "campaignNoteConflictRemoteSchema",
        "campaignNoteSchema",
        "campaignNoteQueueItemSchema",
        "campaignNoteFormSchema",
        "parseCampaignNoteConflictRemote",
        "parseCampaignNote",
        "parseCampaignNoteQueueItem",
        "parseCampaignNoteFormInput",
        "safeParseCampaignNote",
        "safeParseCampaignNoteFormInput",
        "normalizeCampaignNote"
      ]
    },
    {
      "path": "src/domain/schemas/character.schema.ts",
      "batchIndex": 4,
      "symbols": ["characterSchema", "parseCharacter", "parseCharacterDraft", "safeParseCharacter", "normalizeCharacter"]
    },
    {
      "path": "src/domain/schemas/homebrew.schema.ts",
      "batchIndex": 4,
      "symbols": ["homebrewSchema", "parseHomebrew", "safeParseHomebrew", "normalizeHomebrew"]
    },
    {
      "path": "src/domain/schemas/spell.schema.ts",
      "batchIndex": 4,
      "symbols": [
        "SPELL_DAMAGE_TYPES",
        "spellDamageProfileSchema",
        "spellSchema",
        "characterSpellsSchema",
        "upsertSpellbookSpellInputSchema",
        "spellFormSchema",
        "normalizeSpellbookDamageProfiles",
        "normalizeCharacterSpells",
        "normalizeSpell",
        "parseSpell",
        "parseSpellbookStored",
        "parseSpellUpsertInput",
        "parseSpellFormInput",
        "safeParseSpellFormInput",
        "safeParseSpell"
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
      "path": "src/services/storeEffects/characterStoreEffects.ts",
      "batchIndex": 10,
      "symbols": ["createCharacterStoreEffects"]
    },
    {
      "path": "src/shared/const/attributes.ts",
      "batchIndex": 11,
      "symbols": ["attributes"]
    },
    {
      "path": "src/shared/helpers/gear.ts",
      "batchIndex": 13,
      "symbols": ["mergeGearIntoCharacter"]
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
    },
    {
      "path": "src/stores/characterStore.ts",
      "batchIndex": 13,
      "symbols": ["selectActiveCharacter", "selectCharacterStoreActions", "selectCharacterStoreBasics"]
    },
    {
      "path": "src/stores/spellbookStore.ts",
      "batchIndex": 2,
      "symbols": []
    }
  ],
  "src/repositories/characterCloudRepository.test.ts": [
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
    }
  ],
  "src/repositories/characterLocalRepository.test.ts": [
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
  "src/repositories/characterLocalRepository.ts": [
    {
      "path": "src/domain/mappers/index.ts",
      "batchIndex": 12,
      "symbols": ["characterMapper", "homebrewMapper", "spellMapper"]
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
      "path": "src/screens/DM/DMSharedUpdates.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/services/storeEffects/characterStoreEffects.ts",
      "batchIndex": 10,
      "symbols": ["createCharacterStoreEffects"]
    }
  ],
  "src/screens/CreateCharacter/CreateCharacter.test.tsx": [
    {
      "path": "src/dm/domain/types/index.ts",
      "batchIndex": 1,
      "symbols": []
    }
  ],
  "src/screens/CreateCharacter/CreateCharacter.tsx": [
    {
      "path": "src/context/Character-store.ts",
      "batchIndex": 9,
      "symbols": ["default", "selectActiveCharacter", "selectCharacterStoreActions", "selectCharacterStoreBasics"]
    },
    {
      "path": "src/context/Sync-store.ts",
      "batchIndex": 1,
      "symbols": ["default", "selectSyncByCharacterId", "selectSyncStoreActions"]
    },
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    },
    {
      "path": "src/dm/domain/types/index.ts",
      "batchIndex": 1,
      "symbols": []
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
    },
    {
      "path": "src/domain/srd/index.ts",
      "batchIndex": 4,
      "symbols": []
    },
    {
      "path": "src/navigation/TabNavigator.tsx",
      "batchIndex": 2,
      "symbols": ["TabNavigator"]
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
      "path": "src/screens/CreateCharacter/style.ts",
      "batchIndex": 7,
      "symbols": ["getStyles"]
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
      "path": "src/services/firebase.ts",
      "batchIndex": 3,
      "symbols": ["fbAuth", "db", "fns", "now", "arrayUnion", "deleteField", "timestampToMillis", "hasDoc"]
    },
    {
      "path": "src/shared/services/auth/index.ts",
      "batchIndex": 10,
      "symbols": ["AuthProvider", "useAuth", "configureGoogleSignIn", "onGoogleButtonPress", "logout", "reauthenticateWithGoogle"]
    },
    {
      "path": "src/shared/services/fileSerice.ts",
      "batchIndex": 2,
      "symbols": []
    }
  ],
  "src/screens/CreateCharacter/createCharacterWizard.ts": [
    {
      "path": "src/domain/srd/index.ts",
      "batchIndex": 4,
      "symbols": []
    },
    {
      "path": "src/shared/services/diceRoller.ts",
      "batchIndex": 6,
      "symbols": ["rollDice", "rollFormula", "parseDiceType"]
    },
    {
      "path": "src/domain/schemas/createCharacterWizard.schema.ts",
      "batchIndex": 4,
      "symbols": [
        "StorageMode",
        "StatMethod",
        "createCharacterWizardSchema",
        "parseCreateCharacterWizard",
        "safeParseCreateCharacterWizard",
        "safeParseCreateCharacterWizardStep",
        "normalizeCreateCharacterWizard"
      ]
    }
  ],
  "src/screens/Home/Home.test.tsx": [
    {
      "path": "src/screens/Home/Home.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/shared/services/auth/index.ts",
      "batchIndex": 10,
      "symbols": ["AuthProvider", "useAuth", "configureGoogleSignIn", "onGoogleButtonPress", "logout", "reauthenticateWithGoogle"]
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
    }
  ],
  "src/services/dmCampaignNotes.test.ts": [
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
  "src/services/dmCampaigns.test.ts": [
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
  "src/shared/const/ClassPresets.ts": [
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
  "src/shared/helpers/combat.ts": [
    {
      "path": "src/screens/DM/DMEncounterPrep.tsx",
      "batchIndex": 3,
      "symbols": []
    }
  ],
  "src/shared/helpers/createEmptyCharacter.ts": [
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
    },
    {
      "path": "src/domain/spellbook/characterSpellAdapter.test.ts",
      "batchIndex": 2,
      "symbols": []
    },
    {
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": ["useCharacterActions"]
    },
    {
      "path": "src/screens/Home/homeViewModel.test.ts",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/Spellbook/spellbookFilters.test.ts",
      "batchIndex": 2,
      "symbols": []
    },
    {
      "path": "src/services/characterSyncCoordinator.test.ts",
      "batchIndex": 3,
      "symbols": []
    }
  ],
  "src/stores/dmSettingsStore.ts": [
    {
      "path": "src/dm/repositories/dmSettingsRepository.ts",
      "batchIndex": 4,
      "symbols": ["loadDefaultCampaignId", "persistDefaultCampaignId"]
    }
  ],
  "src/stores/selectors/syncStoreSelectors.ts": [
    {
      "path": "src/types/Sync.ts",
      "batchIndex": 3,
      "symbols": ["CharacterSyncMap", "CharacterSyncState", "SyncStatus", "SyncTransportState"]
    }
  ]
}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields — `path`, `language`, `sizeLines`, `fileCategory`):

1. `src/domain/types/index.ts` (5 lines, language: `typescript`, fileCategory: `code`)
2. `src/repositories/characterCloudRepository.test.ts` (375 lines, language: `typescript`, fileCategory: `code`)
3. `src/repositories/characterLocalRepository.test.ts` (119 lines, language: `typescript`, fileCategory: `code`)
4. `src/repositories/characterLocalRepository.ts` (103 lines, language: `typescript`, fileCategory: `code`)
5. `src/repositories/createCharacterDraftRepository.ts` (40 lines, language: `typescript`, fileCategory: `code`)
6. `src/screens/CreateCharacter/CreateCharacter.test.tsx` (400 lines, language: `typescript`, fileCategory: `code`)
7. `src/screens/CreateCharacter/CreateCharacter.tsx` (1361 lines, language: `typescript`, fileCategory: `code`)
8. `src/screens/CreateCharacter/createCharacterWizard.test.ts` (115 lines, language: `typescript`, fileCategory: `code`)
9. `src/screens/CreateCharacter/createCharacterWizard.ts` (977 lines, language: `typescript`, fileCategory: `code`)
10. `src/screens/Home/Home.test.tsx` (327 lines, language: `typescript`, fileCategory: `code`)
11. `src/services/dmCampaignNotes.test.ts` (77 lines, language: `typescript`, fileCategory: `code`)
12. `src/services/dmCampaignNotes.ts` (8 lines, language: `typescript`, fileCategory: `code`)
13. `src/services/dmCampaigns.test.ts` (80 lines, language: `typescript`, fileCategory: `code`)
14. `src/services/dmCampaigns.ts` (9 lines, language: `typescript`, fileCategory: `code`)
15. `src/shared/const/CharacterTemplates.ts` (126 lines, language: `typescript`, fileCategory: `code`)
16. `src/shared/const/ClassPresets.ts` (97 lines, language: `typescript`, fileCategory: `code`)
17. `src/shared/const/Subclasses.ts` (36 lines, language: `typescript`, fileCategory: `code`)
18. `src/shared/const/Weapons.ts` (38 lines, language: `typescript`, fileCategory: `code`)
19. `src/shared/helpers/combat.ts` (55 lines, language: `typescript`, fileCategory: `code`)
20. `src/shared/helpers/createEmptyCharacter.ts` (159 lines, language: `typescript`, fileCategory: `code`)
21. `src/stores/dmSettingsStore.ts` (32 lines, language: `typescript`, fileCategory: `code`)
22. `src/stores/selectors/characterStoreSelectors.ts` (33 lines, language: `typescript`, fileCategory: `code`)
23. `src/stores/selectors/syncStoreSelectors.ts` (37 lines, language: `typescript`, fileCategory: `code`)
24. `src/stores/storeSelectors.test.ts` (124 lines, language: `typescript`, fileCategory: `code`)
25. `src/types/skillToStat.ts` (37 lines, language: `typescript`, fileCategory: `code`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").

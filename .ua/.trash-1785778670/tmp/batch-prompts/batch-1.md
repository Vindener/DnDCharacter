Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 1/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-1.json` (single-file mode) OR `batch-1-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):

```json
{
  "src/context/AppRole-store.ts": [],
  "src/context/DmSettings-store.ts": [],
  "src/context/Spellbook-store.ts": [],
  "src/context/Sync-store.ts": [],
  "src/dm/domain/campaign/index.ts": [],
  "src/dm/domain/campaign/linking.test.ts": ["src/dm/domain/campaign/index.ts", "src/dm/domain/types/index.ts"],
  "src/dm/domain/campaign/linking.ts": ["src/dm/domain/campaign/utils.ts", "src/dm/domain/types/index.ts"],
  "src/dm/domain/campaign/utils.test.ts": ["src/dm/domain/campaign/index.ts", "src/dm/domain/types/index.ts"],
  "src/dm/domain/campaign/utils.ts": ["src/dm/domain/types/index.ts"],
  "src/dm/domain/encounter/calculator.ts": ["src/dm/domain/types/index.ts"],
  "src/dm/domain/initiative/index.ts": [],
  "src/dm/domain/initiative/roll.test.ts": ["src/dm/domain/initiative/index.ts", "src/dm/domain/types/index.ts"],
  "src/dm/domain/notes/conflict.test.ts": ["src/dm/domain/notes/index.ts", "src/dm/domain/types/index.ts"],
  "src/dm/domain/notes/conflict.ts": ["src/dm/domain/types/index.ts"],
  "src/dm/domain/notes/index.ts": [],
  "src/dm/domain/types/index.ts": [],
  "src/dm/hooks/useCampaignOwnership.ts": ["src/dm/domain/types/index.ts", "src/services/firebase.ts"],
  "src/dm/repositories/campaignEncountersRepository.test.ts": [
    "src/dm/domain/types/index.ts",
    "src/dm/repositories/campaignEncountersRepository.ts",
    "src/domain/migrations/index.ts"
  ],
  "src/dm/repositories/campaignEncountersRepository.ts": [
    "src/dm/domain/types/index.ts",
    "src/domain/migrations/index.ts",
    "src/domain/schemas/index.ts",
    "src/services/firebase.ts"
  ],
  "src/dm/repositories/campaignInitiativeRepository.test.ts": [
    "src/dm/domain/types/index.ts",
    "src/dm/repositories/campaignInitiativeRepository.ts",
    "src/domain/migrations/index.ts"
  ],
  "src/dm/repositories/campaignInitiativeRepository.ts": [
    "src/dm/domain/types/index.ts",
    "src/domain/migrations/index.ts",
    "src/domain/schemas/index.ts",
    "src/services/firebase.ts",
    "src/shared/helpers/stripUndefinedDeep.ts"
  ],
  "src/dm/repositories/campaignNotesRepository.ts": [
    "src/dm/domain/types/index.ts",
    "src/dm/repositories/campaignRepository.ts",
    "src/domain/migrations/index.ts",
    "src/domain/schemas/index.ts",
    "src/services/firebase.ts"
  ],
  "src/dm/repositories/campaignRepository.ts": [
    "src/dm/domain/campaign/index.ts",
    "src/dm/domain/types/index.ts",
    "src/domain/migrations/index.ts",
    "src/services/connections.ts",
    "src/services/firebase.ts",
    "src/services/users.ts"
  ],
  "src/navigation/DMNavigator.tsx": [
    "src/dm/domain/types/index.ts",
    "src/modules/Header/Header.tsx",
    "src/screens/DM/DM.tsx",
    "src/screens/DM/DMCampaignDetail.tsx",
    "src/screens/DM/DMCampaignNotes.tsx",
    "src/screens/DM/DMCampaigns.tsx",
    "src/screens/DM/DMEncounterPrep.tsx",
    "src/screens/DM/DMPartyOverview.tsx",
    "src/screens/DM/DMQuickEdit.tsx",
    "src/screens/DM/DMSharedUpdates.tsx",
    "src/screens/DM/EncounterCalculator/EncounterCalculator.tsx",
    "src/screens/DM/LootGenerator/LootGenerator.tsx"
  ],
  "src/repositories/characterCloudRepository.ts": [
    "src/domain/mappers/index.ts",
    "src/domain/migrations/index.ts",
    "src/domain/types/index.ts",
    "src/repositories/syncPathFieldMap.ts",
    "src/services/connections.ts",
    "src/services/firebase.ts",
    "src/services/users.ts",
    "src/shared/helpers/stripUndefinedDeep.ts",
    "src/shared/helpers/sync/syncErrorClassification.ts"
  ],
  "src/repositories/syncPathFieldMap.test.ts": ["src/repositories/syncPathFieldMap.ts"],
  "src/repositories/syncPathFieldMap.ts": [],
  "src/screens/DM/DM.tsx": [
    "src/context/AppRole-store.ts",
    "src/context/Character-store.ts",
    "src/context/Monster-store.ts",
    "src/context/Spellbook-store.ts",
    "src/context/Sync-store.ts",
    "src/context/Theme-store.ts",
    "src/dm/domain/types/index.ts",
    "src/dm/repositories/campaignNotesRepository.ts",
    "src/dm/repositories/campaignRepository.ts",
    "src/navigation/DMNavigator.tsx",
    "src/repositories/characterCloudRepository.ts",
    "src/screens/DM/PinnedReferencesList.tsx",
    "src/screens/DM/style.ts",
    "src/services/firebase.ts",
    "src/shared/helpers/collaboration/status.ts",
    "src/shared/helpers/mapCloudCharacter.ts",
    "src/shared/services/auth/index.ts",
    "src/types/Character.ts",
    "src/types/Product.ts"
  ],
  "src/screens/DM/DMCampaignDetail.tsx": [
    "src/context/Character-store.ts",
    "src/context/Monster-store.ts",
    "src/context/Spellbook-store.ts",
    "src/context/Sync-store.ts",
    "src/context/Theme-store.ts",
    "src/dm/domain/types/index.ts",
    "src/dm/hooks/useCampaignOwnership.ts",
    "src/dm/repositories/campaignEncountersRepository.ts",
    "src/dm/repositories/campaignRepository.ts",
    "src/navigation/DMNavigator.tsx",
    "src/repositories/characterCloudRepository.ts",
    "src/screens/DM/PinnedReferencesList.tsx",
    "src/screens/DM/adapters/index.ts",
    "src/screens/DM/style.ts",
    "src/services/campaignInvite.ts",
    "src/services/characterSyncCoordinator.ts",
    "src/services/firebase.ts",
    "src/shared/components/Modal/Modal.tsx",
    "src/shared/services/telemetry/productTelemetry.ts",
    "src/types/Character.ts"
  ],
  "src/screens/DM/DMCampaignNotes.tsx": [
    "src/context/AppRole-store.ts",
    "src/context/DmSettings-store.ts",
    "src/context/Theme-store.ts",
    "src/dm/domain/types/index.ts",
    "src/dm/repositories/campaignNotesRepository.ts",
    "src/dm/repositories/campaignRepository.ts",
    "src/domain/schemas/index.ts",
    "src/navigation/DMNavigator.tsx",
    "src/screens/DM/style.ts",
    "src/services/firebase.ts",
    "src/shared/helpers/collaboration/status.ts",
    "src/shared/styles/tokens.ts"
  ],
  "src/screens/DM/DMCampaigns.tsx": [
    "src/context/Character-store.ts",
    "src/context/Theme-store.ts",
    "src/dm/domain/types/index.ts",
    "src/dm/repositories/campaignRepository.ts",
    "src/navigation/DMNavigator.tsx",
    "src/repositories/characterCloudRepository.ts",
    "src/screens/DM/adapters/index.ts",
    "src/screens/DM/style.ts",
    "src/services/campaignInvite.ts",
    "src/services/firebase.ts",
    "src/shared/components/Modal/Modal.tsx"
  ]
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):

```json
{
  "src/context/AppRole-store.ts": [
    {
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": ["useCharacterActions"]
    },
    {
      "path": "src/screens/DM/DMPartyOverview.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMSharedUpdates.tsx",
      "batchIndex": 3,
      "symbols": []
    }
  ],
  "src/context/DmSettings-store.ts": [
    {
      "path": "src/screens/DM/DMEncounterPrep.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/Initiative/Initiative.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/Settings/Settings.tsx",
      "batchIndex": 10,
      "symbols": []
    }
  ],
  "src/context/Spellbook-store.ts": [
    {
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": ["useCharacterActions"]
    },
    {
      "path": "src/screens/Spellbook/Spellbook.tsx",
      "batchIndex": 2,
      "symbols": []
    }
  ],
  "src/context/Sync-store.ts": [
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
      "path": "src/screens/DM/DMPartyOverview.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMQuickEdit.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMSharedUpdates.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/Home/Home.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterMenu/CharacterMenu.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/dm/domain/campaign/index.ts": [
    {
      "path": "src/screens/DM/adapters/campaignLink.ts",
      "batchIndex": 3,
      "symbols": ["toCampaignLinkInput", "buildCampaignFallbackIdForCharacter", "isCharacterInCampaign", "getCharacterCampaignLabel"]
    }
  ],
  "src/dm/domain/initiative/index.ts": [
    {
      "path": "src/screens/DM/DMEncounterPrep.tsx",
      "batchIndex": 3,
      "symbols": []
    }
  ],
  "src/dm/domain/types/index.ts": [
    {
      "path": "src/dm/domain/initiative/roll.ts",
      "batchIndex": 6,
      "symbols": ["rollInitiativeFor", "sortByInitiative"]
    },
    {
      "path": "src/dm/repositories/trackerTemplatesRepository.ts",
      "batchIndex": 15,
      "symbols": ["loadTrackerTemplates", "persistTrackerTemplates"]
    },
    {
      "path": "src/screens/Bestiary/Bestiary.test.tsx",
      "batchIndex": 2,
      "symbols": []
    },
    {
      "path": "src/screens/Bestiary/Bestiary.tsx",
      "batchIndex": 2,
      "symbols": []
    },
    {
      "path": "src/screens/CreateCharacter/CreateCharacter.test.tsx",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/screens/CreateCharacter/CreateCharacter.tsx",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMEncounterPrep.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMPartyOverview.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/DM/adapters/campaignLink.ts",
      "batchIndex": 3,
      "symbols": ["toCampaignLinkInput", "buildCampaignFallbackIdForCharacter", "isCharacterInCampaign", "getCharacterCampaignLabel"]
    },
    {
      "path": "src/screens/Home/homeViewModel.ts",
      "batchIndex": 3,
      "symbols": [
        "ROLE_LABELS",
        "formatInitiative",
        "buildHomeCharacterPreviews",
        "selectContinueState",
        "countPendingSync",
        "countConflicts",
        "buildDmPreview",
        "buildSyncStrip"
      ]
    },
    {
      "path": "src/screens/Initiative/CampaignInitiativeBoard.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/Initiative/Initiative.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/Settings/Settings.tsx",
      "batchIndex": 10,
      "symbols": []
    },
    {
      "path": "src/screens/Spellbook/Spellbook.tsx",
      "batchIndex": 2,
      "symbols": []
    },
    {
      "path": "src/services/storeEffects/dmStoreEffects.ts",
      "batchIndex": 12,
      "symbols": ["createDmStoreEffects"]
    },
    {
      "path": "src/shared/const/TrackerTemplates.ts",
      "batchIndex": 3,
      "symbols": ["SYSTEM_RESOURCE_TEMPLATES"]
    },
    {
      "path": "src/stores/dmStore.ts",
      "batchIndex": 12,
      "symbols": []
    },
    {
      "path": "src/stores/trackerTemplatesStore.ts",
      "batchIndex": 15,
      "symbols": []
    }
  ],
  "src/dm/hooks/useCampaignOwnership.ts": [
    {
      "path": "src/services/firebase.ts",
      "batchIndex": 3,
      "symbols": ["fbAuth", "db", "fns", "now", "arrayUnion", "deleteField", "timestampToMillis", "hasDoc"]
    },
    {
      "path": "src/screens/Initiative/Initiative.tsx",
      "batchIndex": 3,
      "symbols": []
    }
  ],
  "src/dm/repositories/campaignEncountersRepository.test.ts": [
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
  "src/dm/repositories/campaignEncountersRepository.ts": [
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
      "path": "src/services/firebase.ts",
      "batchIndex": 3,
      "symbols": ["fbAuth", "db", "fns", "now", "arrayUnion", "deleteField", "timestampToMillis", "hasDoc"]
    },
    {
      "path": "src/screens/DM/DMEncounterPrep.tsx",
      "batchIndex": 3,
      "symbols": []
    }
  ],
  "src/dm/repositories/campaignInitiativeRepository.test.ts": [
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
  "src/dm/repositories/campaignInitiativeRepository.ts": [
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
      "path": "src/services/firebase.ts",
      "batchIndex": 3,
      "symbols": ["fbAuth", "db", "fns", "now", "arrayUnion", "deleteField", "timestampToMillis", "hasDoc"]
    },
    {
      "path": "src/shared/helpers/stripUndefinedDeep.ts",
      "batchIndex": 3,
      "symbols": ["stripUndefinedDeep"]
    },
    {
      "path": "src/screens/DM/DMEncounterPrep.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/Initiative/CampaignInitiativeBoard.tsx",
      "batchIndex": 3,
      "symbols": []
    }
  ],
  "src/dm/repositories/campaignNotesRepository.ts": [
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
      "path": "src/services/firebase.ts",
      "batchIndex": 3,
      "symbols": ["fbAuth", "db", "fns", "now", "arrayUnion", "deleteField", "timestampToMillis", "hasDoc"]
    },
    {
      "path": "src/dm/repositories/campaignNotesRepository.test.ts",
      "batchIndex": 4,
      "symbols": []
    }
  ],
  "src/dm/repositories/campaignRepository.ts": [
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
      "path": "src/services/connections.ts",
      "batchIndex": 3,
      "symbols": ["ensureConnection"]
    },
    {
      "path": "src/services/firebase.ts",
      "batchIndex": 3,
      "symbols": ["fbAuth", "db", "fns", "now", "arrayUnion", "deleteField", "timestampToMillis", "hasDoc"]
    },
    {
      "path": "src/services/users.ts",
      "batchIndex": 3,
      "symbols": ["ensureUserIndexOnLogin", "findUserByEmail"]
    },
    {
      "path": "src/dm/repositories/campaignRepository.test.ts",
      "batchIndex": 4,
      "symbols": []
    },
    {
      "path": "src/screens/Bestiary/Bestiary.tsx",
      "batchIndex": 2,
      "symbols": []
    },
    {
      "path": "src/screens/CreateCharacter/CreateCharacter.tsx",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMEncounterPrep.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMPartyOverview.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/Initiative/Initiative.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/Settings/Settings.tsx",
      "batchIndex": 10,
      "symbols": []
    },
    {
      "path": "src/screens/Spellbook/Spellbook.tsx",
      "batchIndex": 2,
      "symbols": []
    }
  ],
  "src/navigation/DMNavigator.tsx": [
    {
      "path": "src/modules/Header/Header.tsx",
      "batchIndex": 2,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMEncounterPrep.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMPartyOverview.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMQuickEdit.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMSharedUpdates.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/DM/EncounterCalculator/EncounterCalculator.tsx",
      "batchIndex": 9,
      "symbols": []
    },
    {
      "path": "src/screens/DM/LootGenerator/LootGenerator.tsx",
      "batchIndex": 7,
      "symbols": []
    },
    {
      "path": "src/navigation/AppNavigator.tsx",
      "batchIndex": 2,
      "symbols": ["AppNavigator"]
    }
  ],
  "src/repositories/characterCloudRepository.ts": [
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
      "path": "src/domain/types/index.ts",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/services/connections.ts",
      "batchIndex": 3,
      "symbols": ["ensureConnection"]
    },
    {
      "path": "src/services/firebase.ts",
      "batchIndex": 3,
      "symbols": ["fbAuth", "db", "fns", "now", "arrayUnion", "deleteField", "timestampToMillis", "hasDoc"]
    },
    {
      "path": "src/services/users.ts",
      "batchIndex": 3,
      "symbols": ["ensureUserIndexOnLogin", "findUserByEmail"]
    },
    {
      "path": "src/shared/helpers/stripUndefinedDeep.ts",
      "batchIndex": 3,
      "symbols": ["stripUndefinedDeep"]
    },
    {
      "path": "src/shared/helpers/sync/syncErrorClassification.ts",
      "batchIndex": 3,
      "symbols": ["getFirestoreErrorCode", "classifySyncError"]
    },
    {
      "path": "src/components/ShareCharacterSheetModal.tsx",
      "batchIndex": 9,
      "symbols": ["ShareCharacterSheetModal"]
    },
    {
      "path": "src/repositories/characterCloudRepository.test.ts",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/screens/Character/Character.tsx",
      "batchIndex": 6,
      "symbols": ["Character"]
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
      "path": "src/screens/DM/DMPartyOverview.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMSharedUpdates.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/Home/Home.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/services/accountDeletion.ts",
      "batchIndex": 10,
      "symbols": ["AccountDeletionError", "buildTransferKey", "previewAccountDeletion", "requestAccountDeletion"]
    },
    {
      "path": "src/services/characterSyncCoordinator.test.ts",
      "batchIndex": 3,
      "symbols": []
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
      "path": "src/shared/components/CharacterCard/CharacterCard.tsx",
      "batchIndex": 9,
      "symbols": ["CharacterCard"]
    },
    {
      "path": "src/shared/components/CharacterMenu/CharacterMenu.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/screens/DM/DM.tsx": [
    {
      "path": "src/context/Character-store.ts",
      "batchIndex": 9,
      "symbols": ["default", "selectActiveCharacter", "selectCharacterStoreActions", "selectCharacterStoreBasics"]
    },
    {
      "path": "src/context/Monster-store.ts",
      "batchIndex": 2,
      "symbols": ["default"]
    },
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    },
    {
      "path": "src/screens/DM/PinnedReferencesList.tsx",
      "batchIndex": 3,
      "symbols": ["PinnedReferencesList"]
    },
    {
      "path": "src/screens/DM/style.ts",
      "batchIndex": 3,
      "symbols": ["getStyles"]
    },
    {
      "path": "src/services/firebase.ts",
      "batchIndex": 3,
      "symbols": ["fbAuth", "db", "fns", "now", "arrayUnion", "deleteField", "timestampToMillis", "hasDoc"]
    },
    {
      "path": "src/shared/helpers/collaboration/status.ts",
      "batchIndex": 3,
      "symbols": [
        "isNetworkOnline",
        "getSyncDisplayStatus",
        "getSyncStatusKind",
        "getShareDisplayStatus",
        "mapRoleToHistoryActor",
        "getChangeSourceLabel",
        "summarizeHistoryPaths"
      ]
    },
    {
      "path": "src/shared/helpers/mapCloudCharacter.ts",
      "batchIndex": 3,
      "symbols": ["mapCloudCharacterToLocalDto"]
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
    },
    {
      "path": "src/types/Product.ts",
      "batchIndex": 15,
      "symbols": ["APP_ROLES"]
    }
  ],
  "src/screens/DM/DMCampaignDetail.tsx": [
    {
      "path": "src/context/Character-store.ts",
      "batchIndex": 9,
      "symbols": ["default", "selectActiveCharacter", "selectCharacterStoreActions", "selectCharacterStoreBasics"]
    },
    {
      "path": "src/context/Monster-store.ts",
      "batchIndex": 2,
      "symbols": ["default"]
    },
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    },
    {
      "path": "src/screens/DM/PinnedReferencesList.tsx",
      "batchIndex": 3,
      "symbols": ["PinnedReferencesList"]
    },
    {
      "path": "src/screens/DM/adapters/index.ts",
      "batchIndex": 3,
      "symbols": [
        "buildCampaignFallbackIdForCharacter",
        "getCharacterCampaignLabel",
        "isCharacterInCampaign",
        "toCampaignLinkInput",
        "buildUnifiedPartyList",
        "UnifiedPartyItem",
        "UnifiedPartySource"
      ]
    },
    {
      "path": "src/screens/DM/style.ts",
      "batchIndex": 3,
      "symbols": ["getStyles"]
    },
    {
      "path": "src/services/campaignInvite.ts",
      "batchIndex": 3,
      "symbols": ["CampaignInviteError", "createCampaignInvite", "redeemCampaignInvite"]
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
      "path": "src/shared/components/Modal/Modal.tsx",
      "batchIndex": 11,
      "symbols": ["Modal"]
    },
    {
      "path": "src/shared/services/telemetry/productTelemetry.ts",
      "batchIndex": 3,
      "symbols": ["setAnalyticsConsent", "isAnalyticsConsentEnabled", "trackProductEvent", "getProductEvents"]
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
  "src/screens/DM/DMCampaignNotes.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
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
      "path": "src/screens/DM/style.ts",
      "batchIndex": 3,
      "symbols": ["getStyles"]
    },
    {
      "path": "src/services/firebase.ts",
      "batchIndex": 3,
      "symbols": ["fbAuth", "db", "fns", "now", "arrayUnion", "deleteField", "timestampToMillis", "hasDoc"]
    },
    {
      "path": "src/shared/helpers/collaboration/status.ts",
      "batchIndex": 3,
      "symbols": [
        "isNetworkOnline",
        "getSyncDisplayStatus",
        "getSyncStatusKind",
        "getShareDisplayStatus",
        "mapRoleToHistoryActor",
        "getChangeSourceLabel",
        "summarizeHistoryPaths"
      ]
    },
    {
      "path": "src/shared/styles/tokens.ts",
      "batchIndex": 8,
      "symbols": ["space", "radius", "fontSize", "typography", "designTokens", "sp", "rd", "fs"]
    }
  ],
  "src/screens/DM/DMCampaigns.tsx": [
    {
      "path": "src/context/Character-store.ts",
      "batchIndex": 9,
      "symbols": ["default", "selectActiveCharacter", "selectCharacterStoreActions", "selectCharacterStoreBasics"]
    },
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    },
    {
      "path": "src/screens/DM/adapters/index.ts",
      "batchIndex": 3,
      "symbols": [
        "buildCampaignFallbackIdForCharacter",
        "getCharacterCampaignLabel",
        "isCharacterInCampaign",
        "toCampaignLinkInput",
        "buildUnifiedPartyList",
        "UnifiedPartyItem",
        "UnifiedPartySource"
      ]
    },
    {
      "path": "src/screens/DM/style.ts",
      "batchIndex": 3,
      "symbols": ["getStyles"]
    },
    {
      "path": "src/services/campaignInvite.ts",
      "batchIndex": 3,
      "symbols": ["CampaignInviteError", "createCampaignInvite", "redeemCampaignInvite"]
    },
    {
      "path": "src/services/firebase.ts",
      "batchIndex": 3,
      "symbols": ["fbAuth", "db", "fns", "now", "arrayUnion", "deleteField", "timestampToMillis", "hasDoc"]
    },
    {
      "path": "src/shared/components/Modal/Modal.tsx",
      "batchIndex": 11,
      "symbols": ["Modal"]
    }
  ]
}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields — `path`, `language`, `sizeLines`, `fileCategory`):

1. `src/context/AppRole-store.ts` (1 lines, language: `typescript`, fileCategory: `code`)
2. `src/context/DmSettings-store.ts` (1 lines, language: `typescript`, fileCategory: `code`)
3. `src/context/Spellbook-store.ts` (1 lines, language: `typescript`, fileCategory: `code`)
4. `src/context/Sync-store.ts` (2 lines, language: `typescript`, fileCategory: `code`)
5. `src/dm/domain/campaign/index.ts` (12 lines, language: `typescript`, fileCategory: `code`)
6. `src/dm/domain/campaign/linking.test.ts` (43 lines, language: `typescript`, fileCategory: `code`)
7. `src/dm/domain/campaign/linking.ts` (18 lines, language: `typescript`, fileCategory: `code`)
8. `src/dm/domain/campaign/utils.test.ts` (56 lines, language: `typescript`, fileCategory: `code`)
9. `src/dm/domain/campaign/utils.ts` (54 lines, language: `typescript`, fileCategory: `code`)
10. `src/dm/domain/encounter/calculator.ts` (149 lines, language: `typescript`, fileCategory: `code`)
11. `src/dm/domain/initiative/index.ts` (1 lines, language: `typescript`, fileCategory: `code`)
12. `src/dm/domain/initiative/roll.test.ts` (55 lines, language: `typescript`, fileCategory: `code`)
13. `src/dm/domain/notes/conflict.test.ts` (47 lines, language: `typescript`, fileCategory: `code`)
14. `src/dm/domain/notes/conflict.ts` (22 lines, language: `typescript`, fileCategory: `code`)
15. `src/dm/domain/notes/index.ts` (1 lines, language: `typescript`, fileCategory: `code`)
16. `src/dm/domain/types/index.ts` (6 lines, language: `typescript`, fileCategory: `code`)
17. `src/dm/hooks/useCampaignOwnership.ts` (7 lines, language: `typescript`, fileCategory: `code`)
18. `src/dm/repositories/campaignEncountersRepository.test.ts` (225 lines, language: `typescript`, fileCategory: `code`)
19. `src/dm/repositories/campaignEncountersRepository.ts` (492 lines, language: `typescript`, fileCategory: `code`)
20. `src/dm/repositories/campaignInitiativeRepository.test.ts` (213 lines, language: `typescript`, fileCategory: `code`)
21. `src/dm/repositories/campaignInitiativeRepository.ts` (230 lines, language: `typescript`, fileCategory: `code`)
22. `src/dm/repositories/campaignNotesRepository.ts` (518 lines, language: `typescript`, fileCategory: `code`)
23. `src/dm/repositories/campaignRepository.ts` (495 lines, language: `typescript`, fileCategory: `code`)
24. `src/navigation/DMNavigator.tsx` (66 lines, language: `typescript`, fileCategory: `code`)
25. `src/repositories/characterCloudRepository.ts` (777 lines, language: `typescript`, fileCategory: `code`)
26. `src/repositories/syncPathFieldMap.test.ts` (79 lines, language: `typescript`, fileCategory: `code`)
27. `src/repositories/syncPathFieldMap.ts` (59 lines, language: `typescript`, fileCategory: `code`)
28. `src/screens/DM/DM.tsx` (515 lines, language: `typescript`, fileCategory: `code`)
29. `src/screens/DM/DMCampaignDetail.tsx` (693 lines, language: `typescript`, fileCategory: `code`)
30. `src/screens/DM/DMCampaignNotes.tsx` (419 lines, language: `typescript`, fileCategory: `code`)
31. `src/screens/DM/DMCampaigns.tsx` (367 lines, language: `typescript`, fileCategory: `code`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").

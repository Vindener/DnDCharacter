Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 10/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-10.json` (single-file mode) OR `batch-10-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):

```json
{
  "src/context/CustomCoins-store.ts": [],
  "src/i18n/index.ts": [
    "src/i18n/languageStorage.ts",
    "src/i18n/locales/en/bestiary.json",
    "src/i18n/locales/en/character.json",
    "src/i18n/locales/en/common.json",
    "src/i18n/locales/en/createCharacter.json",
    "src/i18n/locales/en/dice.json",
    "src/i18n/locales/en/dm.json",
    "src/i18n/locales/en/dnd.json",
    "src/i18n/locales/en/firstLaunch.json",
    "src/i18n/locales/en/home.json",
    "src/i18n/locales/en/initiative.json",
    "src/i18n/locales/en/legal.json",
    "src/i18n/locales/en/navigation.json",
    "src/i18n/locales/en/references.json",
    "src/i18n/locales/en/settings.json",
    "src/i18n/locales/en/spellbook.json",
    "src/i18n/locales/en/support.json",
    "src/i18n/locales/en/whatsNew.json",
    "src/i18n/locales/uk/bestiary.json",
    "src/i18n/locales/uk/character.json",
    "src/i18n/locales/uk/common.json",
    "src/i18n/locales/uk/createCharacter.json",
    "src/i18n/locales/uk/dice.json",
    "src/i18n/locales/uk/dm.json",
    "src/i18n/locales/uk/dnd.json",
    "src/i18n/locales/uk/firstLaunch.json",
    "src/i18n/locales/uk/home.json",
    "src/i18n/locales/uk/initiative.json",
    "src/i18n/locales/uk/legal.json",
    "src/i18n/locales/uk/navigation.json",
    "src/i18n/locales/uk/references.json",
    "src/i18n/locales/uk/settings.json",
    "src/i18n/locales/uk/spellbook.json",
    "src/i18n/locales/uk/support.json",
    "src/i18n/locales/uk/whatsNew.json"
  ],
  "src/i18n/languageStorage.ts": [],
  "src/i18n/types.ts": ["src/i18n/index.ts", "src/i18n/languageStorage.ts"],
  "src/screens/References/References.test.tsx": ["src/i18n/index.ts", "src/screens/References/References.tsx"],
  "src/screens/References/References.tsx": [
    "src/context/Theme-store.ts",
    "src/domain/srd/srdRepository.ts",
    "src/navigation/ReferencesNavigator.tsx",
    "src/screens/References/styles.ts"
  ],
  "src/screens/Settings/DeleteAccountModal.tsx": [
    "src/context/Theme-store.ts",
    "src/screens/Settings/styles.ts",
    "src/services/accountDeletion.ts",
    "src/shared/services/auth/index.ts"
  ],
  "src/screens/Settings/Settings.tsx": [
    "src/context/CustomCoins-store.ts",
    "src/context/DmSettings-store.ts",
    "src/context/Monster-store.ts",
    "src/context/Theme-store.ts",
    "src/dm/domain/types/index.ts",
    "src/dm/repositories/campaignRepository.ts",
    "src/i18n/index.ts",
    "src/i18n/languageStorage.ts",
    "src/navigation/TabNavigator.tsx",
    "src/screens/Settings/DeleteAccountModal.tsx",
    "src/screens/Settings/styles.ts",
    "src/shared/components/Firebase/Auth.tsx",
    "src/shared/services/fileSerice.ts"
  ],
  "src/screens/Settings/styles.ts": ["src/shared/styles/theme.ts", "src/shared/styles/tokens.ts"],
  "src/services/accountDeletion.test.ts": ["src/services/accountDeletion.ts"],
  "src/services/accountDeletion.ts": [
    "src/repositories/characterCloudRepository.ts",
    "src/services/accountDeletionCascade.ts",
    "src/services/firebase.ts",
    "src/shared/services/auth/index.ts",
    "src/shared/services/telemetry/productTelemetry.ts"
  ],
  "src/services/accountDeletionCascade.test.ts": ["src/services/accountDeletionCascade.ts"],
  "src/services/accountDeletionCascade.ts": [],
  "src/services/storeEffects/characterStoreEffects.ts": [
    "src/domain/schemas/index.ts",
    "src/domain/types/index.ts",
    "src/i18n/index.ts",
    "src/repositories/characterLocalRepository.ts",
    "src/shared/services/telemetry/productTelemetry.ts",
    "src/shared/services/toast/index.ts",
    "src/stores/characterStore.ts",
    "src/stores/syncStore.ts"
  ],
  "src/services/storeEffects/syncStoreEffects.ts": ["src/services/characterSyncCoordinator.ts", "src/stores/syncStore.ts"],
  "src/shared/components/Firebase/Auth.tsx": [
    "src/context/Theme-store.ts",
    "src/screens/Settings/styles.ts",
    "src/services/users.ts",
    "src/shared/services/auth/index.ts"
  ],
  "src/shared/services/auth/google.ts": ["src/i18n/index.ts", "src/shared/services/toast/index.ts"],
  "src/shared/services/auth/index.ts": [],
  "src/shared/services/toast/index.ts": [],
  "src/stores/syncStore.ts": ["src/services/storeEffects/syncStoreEffects.ts", "src/types/Sync.ts"]
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):

```json
{
  "src/context/CustomCoins-store.ts": [
    {
      "path": "src/shared/components/CharacterStats/Tabs/Coins/Coins.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/i18n/index.ts": [
    {
      "path": "src/i18n/locales/en/bestiary.json",
      "batchIndex": 25,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/en/character.json",
      "batchIndex": 25,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/en/common.json",
      "batchIndex": 25,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/en/createCharacter.json",
      "batchIndex": 25,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/en/dice.json",
      "batchIndex": 25,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/en/dm.json",
      "batchIndex": 25,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/en/dnd.json",
      "batchIndex": 25,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/en/firstLaunch.json",
      "batchIndex": 25,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/en/home.json",
      "batchIndex": 25,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/en/initiative.json",
      "batchIndex": 25,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/en/legal.json",
      "batchIndex": 25,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/en/navigation.json",
      "batchIndex": 25,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/en/references.json",
      "batchIndex": 25,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/en/settings.json",
      "batchIndex": 25,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/en/spellbook.json",
      "batchIndex": 25,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/en/support.json",
      "batchIndex": 25,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/en/whatsNew.json",
      "batchIndex": 25,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/uk/bestiary.json",
      "batchIndex": 26,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/uk/character.json",
      "batchIndex": 26,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/uk/common.json",
      "batchIndex": 26,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/uk/createCharacter.json",
      "batchIndex": 26,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/uk/dice.json",
      "batchIndex": 26,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/uk/dm.json",
      "batchIndex": 26,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/uk/dnd.json",
      "batchIndex": 26,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/uk/firstLaunch.json",
      "batchIndex": 26,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/uk/home.json",
      "batchIndex": 26,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/uk/initiative.json",
      "batchIndex": 26,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/uk/legal.json",
      "batchIndex": 26,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/uk/navigation.json",
      "batchIndex": 26,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/uk/references.json",
      "batchIndex": 26,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/uk/settings.json",
      "batchIndex": 26,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/uk/spellbook.json",
      "batchIndex": 26,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/uk/support.json",
      "batchIndex": 26,
      "symbols": []
    },
    {
      "path": "src/i18n/locales/uk/whatsNew.json",
      "batchIndex": 26,
      "symbols": []
    },
    {
      "path": "App.tsx",
      "batchIndex": 14,
      "symbols": ["App"]
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
      "path": "src/shared/components/ErrorBoundary/ErrorBoundary.tsx",
      "batchIndex": 14,
      "symbols": ["ErrorBoundary"]
    }
  ],
  "src/screens/References/References.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    },
    {
      "path": "src/domain/srd/srdRepository.ts",
      "batchIndex": 12,
      "symbols": [
        "getSrdRaces",
        "getSrdRaceById",
        "getSrdClasses",
        "getSrdClassById",
        "getClassProgression",
        "getSrdClassProgressions",
        "getAvailableSkillsForClass",
        "getStartingEquipmentForClass",
        "getConditions",
        "getEquipment",
        "getSrdSpells",
        "getSrdSpellById",
        "getSrdMonsters",
        "getSrdMonsterById",
        "getSrdReferences",
        "getSrdReferenceById",
        "getSrdBackgrounds",
        "getSrdBackgroundById",
        "getSrdLanguages",
        "getSrdSkills",
        "validateAllSrdCollections"
      ]
    },
    {
      "path": "src/navigation/ReferencesNavigator.tsx",
      "batchIndex": 2,
      "symbols": ["ReferencesNavigator"]
    },
    {
      "path": "src/screens/References/styles.ts",
      "batchIndex": 7,
      "symbols": ["getStyles"]
    }
  ],
  "src/screens/Settings/DeleteAccountModal.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    }
  ],
  "src/screens/Settings/Settings.tsx": [
    {
      "path": "src/context/DmSettings-store.ts",
      "batchIndex": 1,
      "symbols": ["default"]
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
      "path": "src/navigation/TabNavigator.tsx",
      "batchIndex": 2,
      "symbols": ["TabNavigator"]
    },
    {
      "path": "src/shared/services/fileSerice.ts",
      "batchIndex": 2,
      "symbols": []
    }
  ],
  "src/screens/Settings/styles.ts": [
    {
      "path": "src/shared/styles/theme.ts",
      "batchIndex": 8,
      "symbols": ["darkColors", "lightColors"]
    },
    {
      "path": "src/shared/styles/tokens.ts",
      "batchIndex": 8,
      "symbols": ["space", "radius", "fontSize", "typography", "designTokens", "sp", "rd", "fs"]
    }
  ],
  "src/services/accountDeletion.ts": [
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
      "path": "src/services/firebase.ts",
      "batchIndex": 3,
      "symbols": ["fbAuth", "db", "fns", "now", "arrayUnion", "deleteField", "timestampToMillis", "hasDoc"]
    },
    {
      "path": "src/shared/services/telemetry/productTelemetry.ts",
      "batchIndex": 3,
      "symbols": ["setAnalyticsConsent", "isAnalyticsConsentEnabled", "trackProductEvent", "getProductEvents"]
    }
  ],
  "src/services/storeEffects/characterStoreEffects.ts": [
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
      "path": "src/domain/types/index.ts",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/repositories/characterLocalRepository.ts",
      "batchIndex": 5,
      "symbols": ["characterLocalRepository"]
    },
    {
      "path": "src/shared/services/telemetry/productTelemetry.ts",
      "batchIndex": 3,
      "symbols": ["setAnalyticsConsent", "isAnalyticsConsentEnabled", "trackProductEvent", "getProductEvents"]
    },
    {
      "path": "src/stores/characterStore.ts",
      "batchIndex": 13,
      "symbols": ["selectActiveCharacter", "selectCharacterStoreActions", "selectCharacterStoreBasics"]
    }
  ],
  "src/services/storeEffects/syncStoreEffects.ts": [
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
    }
  ],
  "src/shared/components/Firebase/Auth.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    },
    {
      "path": "src/services/users.ts",
      "batchIndex": 3,
      "symbols": ["ensureUserIndexOnLogin", "findUserByEmail"]
    }
  ],
  "src/shared/services/auth/index.ts": [
    {
      "path": "src/screens/CreateCharacter/CreateCharacter.tsx",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DM.tsx",
      "batchIndex": 1,
      "symbols": []
    },
    {
      "path": "src/screens/Home/Home.test.tsx",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/screens/Home/Home.tsx",
      "batchIndex": 3,
      "symbols": []
    }
  ],
  "src/shared/services/toast/index.ts": [
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
    }
  ],
  "src/stores/syncStore.ts": [
    {
      "path": "src/types/Sync.ts",
      "batchIndex": 3,
      "symbols": ["CharacterSyncMap", "CharacterSyncState", "SyncStatus", "SyncTransportState"]
    }
  ]
}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields — `path`, `language`, `sizeLines`, `fileCategory`):

1. `src/context/CustomCoins-store.ts` (1 lines, language: `typescript`, fileCategory: `code`)
2. `src/i18n/index.ts` (169 lines, language: `typescript`, fileCategory: `code`)
3. `src/i18n/languageStorage.ts` (25 lines, language: `typescript`, fileCategory: `code`)
4. `src/i18n/types.ts` (7 lines, language: `typescript`, fileCategory: `code`)
5. `src/screens/References/References.test.tsx` (140 lines, language: `typescript`, fileCategory: `code`)
6. `src/screens/References/References.tsx` (119 lines, language: `typescript`, fileCategory: `code`)
7. `src/screens/Settings/DeleteAccountModal.tsx` (231 lines, language: `typescript`, fileCategory: `code`)
8. `src/screens/Settings/Settings.tsx` (315 lines, language: `typescript`, fileCategory: `code`)
9. `src/screens/Settings/styles.ts` (325 lines, language: `typescript`, fileCategory: `code`)
10. `src/services/accountDeletion.test.ts` (171 lines, language: `typescript`, fileCategory: `code`)
11. `src/services/accountDeletion.ts` (117 lines, language: `typescript`, fileCategory: `code`)
12. `src/services/accountDeletionCascade.test.ts` (57 lines, language: `typescript`, fileCategory: `code`)
13. `src/services/accountDeletionCascade.ts` (46 lines, language: `typescript`, fileCategory: `code`)
14. `src/services/storeEffects/characterStoreEffects.ts` (205 lines, language: `typescript`, fileCategory: `code`)
15. `src/services/storeEffects/syncStoreEffects.ts` (108 lines, language: `typescript`, fileCategory: `code`)
16. `src/shared/components/Firebase/Auth.tsx` (70 lines, language: `typescript`, fileCategory: `code`)
17. `src/shared/services/auth/google.ts` (104 lines, language: `typescript`, fileCategory: `code`)
18. `src/shared/services/auth/index.ts` (3 lines, language: `typescript`, fileCategory: `code`)
19. `src/shared/services/toast/index.ts` (19 lines, language: `typescript`, fileCategory: `code`)
20. `src/stores/syncStore.ts` (45 lines, language: `typescript`, fileCategory: `code`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").

Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 6/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-6.json` (single-file mode) OR `batch-6-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):

```json
{
  "src/context/TrackerTemplates-store.ts": [],
  "src/dm/domain/initiative/roll.ts": ["src/dm/domain/types/index.ts", "src/shared/services/diceRoller.ts"],
  "src/screens/Character/Character.tsx": [
    "src/context/Character-store.ts",
    "src/repositories/characterCloudRepository.ts",
    "src/screens/Character/components/CharacterHeader.tsx",
    "src/screens/Character/components/CharacterModals.tsx",
    "src/screens/Character/components/CharacterTabs.tsx",
    "src/screens/Character/components/CombatSummaryCard.tsx",
    "src/screens/Character/components/QuickActionBar.tsx",
    "src/screens/Character/hooks/useCharacterActions.tsx",
    "src/screens/Character/tabs/CharacterTabContent.tsx",
    "src/shared/ui/skeleton/index.tsx",
    "src/types/Character.ts"
  ],
  "src/screens/Character/components/CharacterHeader.tsx": [
    "src/screens/Character/hooks/useCharacterActions.tsx",
    "src/shared/components/CharacterMenu/CharacterMenu.tsx"
  ],
  "src/screens/Character/components/CharacterModals.tsx": [
    "src/screens/Character/hooks/useCharacterActions.tsx",
    "src/screens/DiceRoller/DiceRoller.tsx",
    "src/shared/components/Modal/Modal.tsx",
    "src/shared/helpers/calculateModifier.ts",
    "src/shared/services/diceRoller.ts"
  ],
  "src/screens/Character/components/CharacterTabs.tsx": ["src/screens/Character/hooks/useCharacterActions.tsx"],
  "src/screens/Character/components/CombatSummaryCard.tsx": ["src/screens/Character/hooks/useCharacterActions.tsx"],
  "src/screens/Character/components/QuickActionBar.tsx": ["src/screens/Character/hooks/useCharacterActions.tsx"],
  "src/screens/Character/hooks/useCharacterActions.tsx": [
    "src/context/AppRole-store.ts",
    "src/context/Character-store.ts",
    "src/context/Spellbook-store.ts",
    "src/context/Sync-store.ts",
    "src/context/Theme-store.ts",
    "src/context/TrackerTemplates-store.ts",
    "src/domain/schemas/index.ts",
    "src/domain/spellbook/index.ts",
    "src/domain/srd/index.ts",
    "src/domain/srd/localization.ts",
    "src/navigation/TabNavigator.tsx",
    "src/repositories/characterCloudRepository.ts",
    "src/screens/Character/components/CharacterSourceBadge.tsx",
    "src/screens/Character/hooks/levelChange.ts",
    "src/screens/Character/hooks/useQuickActions.ts",
    "src/screens/Character/style.ts",
    "src/services/characterSyncCoordinator.ts",
    "src/services/firebase.ts",
    "src/shared/helpers/calculateModifier.ts",
    "src/shared/helpers/collaboration/status.ts",
    "src/shared/helpers/createEmptyCharacter.ts",
    "src/shared/helpers/derived.ts",
    "src/shared/helpers/dice.ts",
    "src/shared/helpers/homebrew.ts",
    "src/shared/helpers/mapCloudCharacter.ts",
    "src/shared/helpers/sourcePresentation.ts",
    "src/shared/services/diceRoller.ts",
    "src/shared/services/telemetry/productTelemetry.ts",
    "src/shared/styles/statusTones.ts",
    "src/types/Character.ts",
    "src/types/Spellbook.ts"
  ],
  "src/screens/Character/hooks/useQuickActions.ts": [],
  "src/screens/Character/tabs/CharacterTabContent.test.tsx": ["src/screens/Character/tabs/CharacterTabContent.tsx"],
  "src/screens/Character/tabs/CharacterTabContent.tsx": [
    "src/screens/Character/tabs/CombatTab.tsx",
    "src/screens/Character/tabs/HomebrewTab.tsx",
    "src/screens/Character/tabs/InventoryTab.tsx",
    "src/screens/Character/tabs/MagicTab.tsx",
    "src/screens/Character/tabs/NotesTab.tsx",
    "src/screens/Character/tabs/OverviewTab.tsx"
  ],
  "src/screens/Character/tabs/CombatTab.tsx": [],
  "src/screens/Character/tabs/HomebrewTab.tsx": [],
  "src/screens/Character/tabs/InventoryTab.tsx": [],
  "src/screens/Character/tabs/MagicTab.tsx": [],
  "src/screens/Character/tabs/NotesTab.tsx": [],
  "src/screens/Character/tabs/OverviewTab.tsx": [],
  "src/screens/Dice/Dice.tsx": ["src/context/Theme-store.ts", "src/screens/Dice/styles.ts", "src/shared/services/diceRoller.ts"],
  "src/screens/DiceRoller/DiceRoller.test.tsx": ["src/screens/DiceRoller/DiceRoller.tsx"],
  "src/screens/DiceRoller/DiceRoller.tsx": [
    "src/context/Theme-store.ts",
    "src/screens/DiceRoller/styles.ts",
    "src/shared/services/diceRoller.ts"
  ],
  "src/shared/helpers/calculateModifier.ts": [],
  "src/shared/services/diceRoller.test.ts": ["src/shared/services/diceRoller.ts"],
  "src/shared/services/diceRoller.ts": []
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):

```json
{
  "src/dm/domain/initiative/roll.ts": [
    {
      "path": "src/dm/domain/types/index.ts",
      "batchIndex": 1,
      "symbols": []
    }
  ],
  "src/screens/Character/Character.tsx": [
    {
      "path": "src/context/Character-store.ts",
      "batchIndex": 9,
      "symbols": ["default", "selectActiveCharacter", "selectCharacterStoreActions", "selectCharacterStoreBasics"]
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
      "path": "src/shared/ui/skeleton/index.tsx",
      "batchIndex": 8,
      "symbols": [
        "SkeletonBox",
        "SkeletonText",
        "SkeletonCircle",
        "SkeletonCard",
        "SkeletonList",
        "SkeletonCharacterCard",
        "SkeletonSpellCard",
        "SkeletonMonsterCard",
        "SkeletonHome",
        "SkeletonCharacterSheet",
        "SkeletonSpellbook",
        "SkeletonBestiary"
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
      "path": "src/navigation/TabNavigator.tsx",
      "batchIndex": 2,
      "symbols": ["TabNavigator"]
    }
  ],
  "src/screens/Character/components/CharacterHeader.tsx": [
    {
      "path": "src/shared/components/CharacterMenu/CharacterMenu.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/screens/Character/components/CharacterModals.tsx": [
    {
      "path": "src/shared/components/Modal/Modal.tsx",
      "batchIndex": 11,
      "symbols": ["Modal"]
    }
  ],
  "src/screens/Character/components/QuickActionBar.tsx": [
    {
      "path": "src/screens/Character/components/QuickActionBar.test.tsx",
      "batchIndex": 7,
      "symbols": []
    }
  ],
  "src/screens/Character/hooks/useCharacterActions.tsx": [
    {
      "path": "src/context/AppRole-store.ts",
      "batchIndex": 1,
      "symbols": ["default"]
    },
    {
      "path": "src/context/Character-store.ts",
      "batchIndex": 9,
      "symbols": ["default", "selectActiveCharacter", "selectCharacterStoreActions", "selectCharacterStoreBasics"]
    },
    {
      "path": "src/context/Spellbook-store.ts",
      "batchIndex": 1,
      "symbols": ["default"]
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
      "path": "src/domain/spellbook/index.ts",
      "batchIndex": 2,
      "symbols": []
    },
    {
      "path": "src/domain/srd/index.ts",
      "batchIndex": 4,
      "symbols": []
    },
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
      "path": "src/screens/Character/components/CharacterSourceBadge.tsx",
      "batchIndex": 9,
      "symbols": ["getCharacterSourceBadgeLabel", "CharacterSourceBadge"]
    },
    {
      "path": "src/screens/Character/hooks/levelChange.ts",
      "batchIndex": 13,
      "symbols": ["MIN_CHARACTER_LEVEL", "MAX_CHARACTER_LEVEL", "buildNextHitDice", "applyLevelChange"]
    },
    {
      "path": "src/screens/Character/style.ts",
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
      "path": "src/shared/helpers/createEmptyCharacter.ts",
      "batchIndex": 5,
      "symbols": ["createEmptyCharacter"]
    },
    {
      "path": "src/shared/helpers/derived.ts",
      "batchIndex": 13,
      "symbols": [
        "abilityMod",
        "skillAbilityMap",
        "skillKeys",
        "computeSkills",
        "getSkillProficiencyBonus",
        "computeSkillBonus",
        "computeAC",
        "getHitDieForClass",
        "computeHP",
        "computeSpeed"
      ]
    },
    {
      "path": "src/shared/helpers/dice.ts",
      "batchIndex": 13,
      "symbols": ["parseDice", "rollDice"]
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
      "path": "src/shared/helpers/sourcePresentation.ts",
      "batchIndex": 2,
      "symbols": ["isBuiltInRulesSource", "shouldDisplaySourceMetadata"]
    },
    {
      "path": "src/shared/services/telemetry/productTelemetry.ts",
      "batchIndex": 3,
      "symbols": ["setAnalyticsConsent", "isAnalyticsConsentEnabled", "trackProductEvent", "getProductEvents"]
    },
    {
      "path": "src/shared/styles/statusTones.ts",
      "batchIndex": 8,
      "symbols": ["getStatusToneColors"]
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
      "path": "src/types/Spellbook.ts",
      "batchIndex": 2,
      "symbols": [
        "CharacterSpellStatus",
        "Dnd5DamageType",
        "SpellbookSource",
        "SpellbookSpell",
        "SpellComponents",
        "SpellDamageProfile",
        "UpsertSpellbookSpellInput"
      ]
    }
  ],
  "src/screens/Dice/Dice.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    },
    {
      "path": "src/screens/Dice/styles.ts",
      "batchIndex": 7,
      "symbols": ["getStyles"]
    },
    {
      "path": "src/navigation/TabNavigator.tsx",
      "batchIndex": 2,
      "symbols": ["TabNavigator"]
    }
  ],
  "src/screens/DiceRoller/DiceRoller.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    },
    {
      "path": "src/screens/DiceRoller/styles.ts",
      "batchIndex": 7,
      "symbols": ["getStyles"]
    },
    {
      "path": "src/navigation/TabNavigator.tsx",
      "batchIndex": 2,
      "symbols": ["TabNavigator"]
    },
    {
      "path": "src/screens/Initiative/LocalInitiativeBoard.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/shared/helpers/calculateModifier.ts": [
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
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/AttributesItem.tsx",
      "batchIndex": 9,
      "symbols": ["AttributesItem"]
    }
  ],
  "src/shared/services/diceRoller.ts": [
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
    },
    {
      "path": "src/screens/Initiative/LocalInitiativeBoard.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ]
}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields — `path`, `language`, `sizeLines`, `fileCategory`):

1. `src/context/TrackerTemplates-store.ts` (2 lines, language: `typescript`, fileCategory: `code`)
2. `src/dm/domain/initiative/roll.ts` (16 lines, language: `typescript`, fileCategory: `code`)
3. `src/screens/Character/Character.tsx` (194 lines, language: `typescript`, fileCategory: `code`)
4. `src/screens/Character/components/CharacterHeader.tsx` (132 lines, language: `typescript`, fileCategory: `code`)
5. `src/screens/Character/components/CharacterModals.tsx` (622 lines, language: `typescript`, fileCategory: `code`)
6. `src/screens/Character/components/CharacterTabs.tsx` (71 lines, language: `typescript`, fileCategory: `code`)
7. `src/screens/Character/components/CombatSummaryCard.tsx` (87 lines, language: `typescript`, fileCategory: `code`)
8. `src/screens/Character/components/QuickActionBar.tsx` (55 lines, language: `typescript`, fileCategory: `code`)
9. `src/screens/Character/hooks/useCharacterActions.tsx` (3717 lines, language: `typescript`, fileCategory: `code`)
10. `src/screens/Character/hooks/useQuickActions.ts` (71 lines, language: `typescript`, fileCategory: `code`)
11. `src/screens/Character/tabs/CharacterTabContent.test.tsx` (83 lines, language: `typescript`, fileCategory: `code`)
12. `src/screens/Character/tabs/CharacterTabContent.tsx` (62 lines, language: `typescript`, fileCategory: `code`)
13. `src/screens/Character/tabs/CombatTab.tsx` (6 lines, language: `typescript`, fileCategory: `code`)
14. `src/screens/Character/tabs/HomebrewTab.tsx` (6 lines, language: `typescript`, fileCategory: `code`)
15. `src/screens/Character/tabs/InventoryTab.tsx` (6 lines, language: `typescript`, fileCategory: `code`)
16. `src/screens/Character/tabs/MagicTab.tsx` (6 lines, language: `typescript`, fileCategory: `code`)
17. `src/screens/Character/tabs/NotesTab.tsx` (6 lines, language: `typescript`, fileCategory: `code`)
18. `src/screens/Character/tabs/OverviewTab.tsx` (6 lines, language: `typescript`, fileCategory: `code`)
19. `src/screens/Dice/Dice.tsx` (51 lines, language: `typescript`, fileCategory: `code`)
20. `src/screens/DiceRoller/DiceRoller.test.tsx` (101 lines, language: `typescript`, fileCategory: `code`)
21. `src/screens/DiceRoller/DiceRoller.tsx` (438 lines, language: `typescript`, fileCategory: `code`)
22. `src/shared/helpers/calculateModifier.ts` (3 lines, language: `typescript`, fileCategory: `code`)
23. `src/shared/services/diceRoller.test.ts` (112 lines, language: `typescript`, fileCategory: `code`)
24. `src/shared/services/diceRoller.ts` (171 lines, language: `typescript`, fileCategory: `code`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").

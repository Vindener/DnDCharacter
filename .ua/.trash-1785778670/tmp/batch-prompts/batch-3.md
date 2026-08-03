Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 3/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-3.json` (single-file mode) OR `batch-3-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):
```json
{
  "src/screens/DM/DMEncounterPrep.tsx": [
    "src/context/Character-store.ts",
    "src/context/DmSettings-store.ts",
    "src/context/Monster-store.ts",
    "src/context/Theme-store.ts",
    "src/dm/domain/encounter/index.ts",
    "src/dm/domain/initiative/index.ts",
    "src/dm/domain/types/index.ts",
    "src/dm/repositories/campaignEncountersRepository.ts",
    "src/dm/repositories/campaignInitiativeRepository.ts",
    "src/dm/repositories/campaignRepository.ts",
    "src/domain/srd/localization.ts",
    "src/navigation/DMNavigator.tsx",
    "src/screens/DM/adapters/index.ts",
    "src/screens/DM/style.ts",
    "src/services/firebase.ts",
    "src/shared/helpers/combat.ts",
    "src/shared/styles/tokens.ts"
  ],
  "src/screens/DM/DMPartyOverview.tsx": [
    "src/context/AppRole-store.ts",
    "src/context/Character-store.ts",
    "src/context/Sync-store.ts",
    "src/context/Theme-store.ts",
    "src/dm/domain/types/index.ts",
    "src/dm/repositories/campaignRepository.ts",
    "src/navigation/DMNavigator.tsx",
    "src/repositories/characterCloudRepository.ts",
    "src/screens/DM/adapters/index.ts",
    "src/screens/DM/style.ts",
    "src/services/firebase.ts",
    "src/shared/helpers/collaboration/status.ts",
    "src/shared/helpers/mapCloudCharacter.ts",
    "src/types/Character.ts"
  ],
  "src/screens/DM/DMQuickEdit.tsx": [
    "src/context/Character-store.ts",
    "src/context/Sync-store.ts",
    "src/context/Theme-store.ts",
    "src/navigation/DMNavigator.tsx",
    "src/screens/DM/style.ts",
    "src/services/characterSyncCoordinator.ts",
    "src/services/firebase.ts",
    "src/shared/components/Modal/Modal.tsx",
    "src/shared/helpers/homebrew.ts",
    "src/shared/styles/tokens.ts",
    "src/types/Character.ts"
  ],
  "src/screens/DM/DMSharedUpdates.tsx": [
    "src/context/AppRole-store.ts",
    "src/context/Character-store.ts",
    "src/context/Sync-store.ts",
    "src/context/Theme-store.ts",
    "src/navigation/DMNavigator.tsx",
    "src/repositories/characterCloudRepository.ts",
    "src/repositories/characterLocalRepository.ts",
    "src/screens/DM/DMSharedUpdates.style.ts",
    "src/services/characterSyncCoordinator.ts",
    "src/services/firebase.ts",
    "src/shared/helpers/collaboration/status.ts",
    "src/shared/helpers/mapCloudCharacter.ts",
    "src/types/Character.ts"
  ],
  "src/screens/DM/PinnedReferencesList.tsx": [
    "src/domain/srd/localization.ts",
    "src/screens/DM/style.ts",
    "src/types/Monster.ts",
    "src/types/Spellbook.ts"
  ],
  "src/screens/DM/adapters/campaignLink.ts": [
    "src/dm/domain/campaign/index.ts",
    "src/dm/domain/types/index.ts",
    "src/types/Character.ts"
  ],
  "src/screens/DM/adapters/index.ts": [],
  "src/screens/DM/style.ts": [
    "src/shared/styles/theme.ts",
    "src/shared/styles/tokens.ts"
  ],
  "src/screens/Home/Home.tsx": [
    "src/context/Character-store.ts",
    "src/context/Sync-store.ts",
    "src/context/Theme-store.ts",
    "src/navigation/TabNavigator.tsx",
    "src/repositories/characterCloudRepository.ts",
    "src/screens/Home/homeViewModel.ts",
    "src/screens/Home/styles.ts",
    "src/services/users.ts",
    "src/shared/helpers/collaboration/status.ts",
    "src/shared/helpers/mapCloudCharacter.ts",
    "src/shared/services/auth/index.ts",
    "src/shared/services/telemetry/productTelemetry.ts",
    "src/shared/ui/skeleton/index.tsx"
  ],
  "src/screens/Home/homeViewModel.test.ts": [
    "src/screens/Home/homeViewModel.ts",
    "src/shared/helpers/createEmptyCharacter.ts",
    "src/types/Sync.ts"
  ],
  "src/screens/Home/homeViewModel.ts": [
    "src/dm/domain/types/index.ts",
    "src/shared/helpers/collaboration/status.ts",
    "src/shared/helpers/homebrew.ts",
    "src/types/Character.ts",
    "src/types/Product.ts",
    "src/types/Sync.ts"
  ],
  "src/screens/Initiative/CampaignInitiativeBoard.tsx": [
    "src/context/Theme-store.ts",
    "src/dm/domain/types/index.ts",
    "src/dm/repositories/campaignInitiativeRepository.ts",
    "src/screens/DM/style.ts",
    "src/screens/Initiative/style.ts",
    "src/shared/components/TextInput/TextInput.tsx",
    "src/shared/styles/tokens.ts"
  ],
  "src/screens/Initiative/Initiative.tsx": [
    "src/context/DmSettings-store.ts",
    "src/dm/domain/types/index.ts",
    "src/dm/hooks/useCampaignOwnership.ts",
    "src/dm/repositories/campaignRepository.ts",
    "src/navigation/AppNavigator.tsx",
    "src/screens/Initiative/CampaignInitiativeBoard.tsx",
    "src/screens/Initiative/LocalInitiativeBoard.tsx"
  ],
  "src/services/campaignInvite.ts": [
    "src/services/firebase.ts",
    "src/shared/services/telemetry/productTelemetry.ts"
  ],
  "src/services/characterSyncCoordinator.test.ts": [
    "src/repositories/characterCloudRepository.ts",
    "src/services/characterSyncCoordinator.ts",
    "src/shared/helpers/createEmptyCharacter.ts",
    "src/types/Sync.ts"
  ],
  "src/services/characterSyncCoordinator.ts": [
    "src/domain/mappers/index.ts",
    "src/i18n/index.ts",
    "src/repositories/characterCloudRepository.ts",
    "src/services/firebase.ts",
    "src/shared/helpers/mapCloudCharacter.ts",
    "src/shared/helpers/sync/conflictPolicy.ts",
    "src/shared/helpers/sync/syncErrorClassification.ts",
    "src/shared/services/telemetry/productTelemetry.ts",
    "src/shared/services/toast/index.ts",
    "src/types/Character.ts",
    "src/types/Sync.ts"
  ],
  "src/services/connections.ts": [
    "src/services/firebase.ts"
  ],
  "src/services/firebase.ts": [],
  "src/services/users.ts": [
    "src/services/firebase.ts"
  ],
  "src/shared/const/TrackerTemplates.ts": [
    "src/dm/domain/types/index.ts"
  ],
  "src/shared/helpers/collaboration/status.ts": [
    "src/types/Product.ts",
    "src/types/Sync.ts"
  ],
  "src/shared/helpers/homebrew.ts": [
    "src/domain/mappers/index.ts",
    "src/domain/types/index.ts"
  ],
  "src/shared/helpers/mapCloudCharacter.ts": [
    "src/domain/mappers/index.ts",
    "src/domain/types/index.ts"
  ],
  "src/shared/helpers/stripUndefinedDeep.ts": [],
  "src/shared/helpers/sync/conflictPolicy.test.ts": [
    "src/shared/helpers/sync/conflictPolicy.ts"
  ],
  "src/shared/helpers/sync/conflictPolicy.ts": [
    "src/types/Sync.ts"
  ],
  "src/shared/helpers/sync/syncErrorClassification.test.ts": [
    "src/shared/helpers/sync/syncErrorClassification.ts"
  ],
  "src/shared/helpers/sync/syncErrorClassification.ts": [],
  "src/shared/services/telemetry/productTelemetry.test.ts": [
    "src/shared/services/telemetry/productTelemetry.ts"
  ],
  "src/shared/services/telemetry/productTelemetry.ts": [],
  "src/types/Sync.ts": []
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):
```json
{
  "src/screens/DM/DMEncounterPrep.tsx": [
    {
      "path": "src/context/Character-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default",
        "selectActiveCharacter",
        "selectCharacterStoreActions",
        "selectCharacterStoreBasics"
      ]
    },
    {
      "path": "src/context/DmSettings-store.ts",
      "batchIndex": 1,
      "symbols": [
        "default"
      ]
    },
    {
      "path": "src/context/Monster-store.ts",
      "batchIndex": 2,
      "symbols": [
        "default"
      ]
    },
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default"
      ]
    },
    {
      "path": "src/dm/domain/encounter/index.ts",
      "batchIndex": 9,
      "symbols": [
        "DIFFICULTY_THRESHOLDS",
        "CHALLENGE_XP",
        "getMonsterMultiplier",
        "evaluateEncounterDifficulty"
      ]
    },
    {
      "path": "src/dm/domain/initiative/index.ts",
      "batchIndex": 1,
      "symbols": [
        "rollInitiativeFor",
        "sortByInitiative"
      ]
    },
    {
      "path": "src/dm/domain/types/index.ts",
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
      "path": "src/navigation/DMNavigator.tsx",
      "batchIndex": 1,
      "symbols": [
        "DMNavigator"
      ]
    },
    {
      "path": "src/shared/helpers/combat.ts",
      "batchIndex": 5,
      "symbols": [
        "abilityMod",
        "proficiencyBonus",
        "computeAttackBonus",
        "defaultDamageString",
        "damageAbilityMod"
      ]
    },
    {
      "path": "src/shared/styles/tokens.ts",
      "batchIndex": 8,
      "symbols": [
        "space",
        "radius",
        "fontSize",
        "typography",
        "designTokens",
        "sp",
        "rd",
        "fs"
      ]
    }
  ],
  "src/screens/DM/DMPartyOverview.tsx": [
    {
      "path": "src/context/AppRole-store.ts",
      "batchIndex": 1,
      "symbols": [
        "default"
      ]
    },
    {
      "path": "src/context/Character-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default",
        "selectActiveCharacter",
        "selectCharacterStoreActions",
        "selectCharacterStoreBasics"
      ]
    },
    {
      "path": "src/context/Sync-store.ts",
      "batchIndex": 1,
      "symbols": [
        "default",
        "selectSyncByCharacterId",
        "selectSyncStoreActions"
      ]
    },
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default"
      ]
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
      "path": "src/navigation/DMNavigator.tsx",
      "batchIndex": 1,
      "symbols": [
        "DMNavigator"
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
  "src/screens/DM/DMQuickEdit.tsx": [
    {
      "path": "src/context/Character-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default",
        "selectActiveCharacter",
        "selectCharacterStoreActions",
        "selectCharacterStoreBasics"
      ]
    },
    {
      "path": "src/context/Sync-store.ts",
      "batchIndex": 1,
      "symbols": [
        "default",
        "selectSyncByCharacterId",
        "selectSyncStoreActions"
      ]
    },
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default"
      ]
    },
    {
      "path": "src/navigation/DMNavigator.tsx",
      "batchIndex": 1,
      "symbols": [
        "DMNavigator"
      ]
    },
    {
      "path": "src/shared/components/Modal/Modal.tsx",
      "batchIndex": 11,
      "symbols": [
        "Modal"
      ]
    },
    {
      "path": "src/shared/styles/tokens.ts",
      "batchIndex": 8,
      "symbols": [
        "space",
        "radius",
        "fontSize",
        "typography",
        "designTokens",
        "sp",
        "rd",
        "fs"
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
    }
  ],
  "src/screens/DM/DMSharedUpdates.tsx": [
    {
      "path": "src/context/AppRole-store.ts",
      "batchIndex": 1,
      "symbols": [
        "default"
      ]
    },
    {
      "path": "src/context/Character-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default",
        "selectActiveCharacter",
        "selectCharacterStoreActions",
        "selectCharacterStoreBasics"
      ]
    },
    {
      "path": "src/context/Sync-store.ts",
      "batchIndex": 1,
      "symbols": [
        "default",
        "selectSyncByCharacterId",
        "selectSyncStoreActions"
      ]
    },
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default"
      ]
    },
    {
      "path": "src/navigation/DMNavigator.tsx",
      "batchIndex": 1,
      "symbols": [
        "DMNavigator"
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
      "symbols": [
        "characterLocalRepository"
      ]
    },
    {
      "path": "src/screens/DM/DMSharedUpdates.style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
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
    }
  ],
  "src/screens/DM/PinnedReferencesList.tsx": [
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
      "path": "src/types/Monster.ts",
      "batchIndex": 2,
      "symbols": []
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
    },
    {
      "path": "src/screens/DM/DM.tsx",
      "batchIndex": 1,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMCampaignDetail.tsx",
      "batchIndex": 1,
      "symbols": []
    }
  ],
  "src/screens/DM/adapters/campaignLink.ts": [
    {
      "path": "src/dm/domain/campaign/index.ts",
      "batchIndex": 1,
      "symbols": [
        "normalizeCampaignName",
        "slugifyCampaignName",
        "buildCampaignId",
        "sortCampaignsByRecency",
        "sanitizeCampaignSummary",
        "clampPartyLevelEstimate",
        "sanitizeCampaignPinnedIds",
        "CAMPAIGN_PINNED_ITEMS_CAP",
        "resolveCampaignForLink",
        "buildLegacyCampaignFallbackId"
      ]
    },
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
    }
  ],
  "src/screens/DM/adapters/index.ts": [
    {
      "path": "src/screens/DM/DMCampaignDetail.tsx",
      "batchIndex": 1,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMCampaigns.tsx",
      "batchIndex": 1,
      "symbols": []
    }
  ],
  "src/screens/DM/style.ts": [
    {
      "path": "src/shared/styles/theme.ts",
      "batchIndex": 8,
      "symbols": [
        "darkColors",
        "lightColors"
      ]
    },
    {
      "path": "src/shared/styles/tokens.ts",
      "batchIndex": 8,
      "symbols": [
        "space",
        "radius",
        "fontSize",
        "typography",
        "designTokens",
        "sp",
        "rd",
        "fs"
      ]
    },
    {
      "path": "src/screens/DM/DM.tsx",
      "batchIndex": 1,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMCampaignDetail.tsx",
      "batchIndex": 1,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMCampaignNotes.tsx",
      "batchIndex": 1,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMCampaigns.tsx",
      "batchIndex": 1,
      "symbols": []
    },
    {
      "path": "src/screens/Initiative/LocalInitiativeBoard.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/screens/Home/Home.tsx": [
    {
      "path": "src/context/Character-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default",
        "selectActiveCharacter",
        "selectCharacterStoreActions",
        "selectCharacterStoreBasics"
      ]
    },
    {
      "path": "src/context/Sync-store.ts",
      "batchIndex": 1,
      "symbols": [
        "default",
        "selectSyncByCharacterId",
        "selectSyncStoreActions"
      ]
    },
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default"
      ]
    },
    {
      "path": "src/navigation/TabNavigator.tsx",
      "batchIndex": 2,
      "symbols": [
        "TabNavigator"
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
      "path": "src/screens/Home/styles.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/shared/services/auth/index.ts",
      "batchIndex": 10,
      "symbols": [
        "AuthProvider",
        "useAuth",
        "configureGoogleSignIn",
        "onGoogleButtonPress",
        "logout",
        "reauthenticateWithGoogle"
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
      "path": "src/screens/Home/Home.test.tsx",
      "batchIndex": 5,
      "symbols": []
    }
  ],
  "src/screens/Home/homeViewModel.test.ts": [
    {
      "path": "src/shared/helpers/createEmptyCharacter.ts",
      "batchIndex": 5,
      "symbols": [
        "createEmptyCharacter"
      ]
    }
  ],
  "src/screens/Home/homeViewModel.ts": [
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
      "path": "src/types/Product.ts",
      "batchIndex": 15,
      "symbols": [
        "APP_ROLES"
      ]
    }
  ],
  "src/screens/Initiative/CampaignInitiativeBoard.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default"
      ]
    },
    {
      "path": "src/dm/domain/types/index.ts",
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
      "path": "src/screens/Initiative/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/shared/components/TextInput/TextInput.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/styles/tokens.ts",
      "batchIndex": 8,
      "symbols": [
        "space",
        "radius",
        "fontSize",
        "typography",
        "designTokens",
        "sp",
        "rd",
        "fs"
      ]
    }
  ],
  "src/screens/Initiative/Initiative.tsx": [
    {
      "path": "src/context/DmSettings-store.ts",
      "batchIndex": 1,
      "symbols": [
        "default"
      ]
    },
    {
      "path": "src/dm/domain/types/index.ts",
      "batchIndex": 1,
      "symbols": []
    },
    {
      "path": "src/dm/hooks/useCampaignOwnership.ts",
      "batchIndex": 1,
      "symbols": [
        "useCampaignOwnership"
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
      "path": "src/navigation/AppNavigator.tsx",
      "batchIndex": 2,
      "symbols": [
        "AppNavigator"
      ]
    },
    {
      "path": "src/screens/Initiative/LocalInitiativeBoard.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/services/campaignInvite.ts": [
    {
      "path": "src/screens/DM/DMCampaignDetail.tsx",
      "batchIndex": 1,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMCampaigns.tsx",
      "batchIndex": 1,
      "symbols": []
    }
  ],
  "src/services/characterSyncCoordinator.test.ts": [
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
      "path": "src/shared/helpers/createEmptyCharacter.ts",
      "batchIndex": 5,
      "symbols": [
        "createEmptyCharacter"
      ]
    }
  ],
  "src/services/characterSyncCoordinator.ts": [
    {
      "path": "src/domain/mappers/index.ts",
      "batchIndex": 12,
      "symbols": [
        "characterMapper",
        "homebrewMapper",
        "spellMapper"
      ]
    },
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
      "path": "src/shared/services/toast/index.ts",
      "batchIndex": 10,
      "symbols": [
        "showToast",
        "toast"
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
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": [
        "useCharacterActions"
      ]
    },
    {
      "path": "src/screens/CreateCharacter/CreateCharacter.tsx",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMCampaignDetail.tsx",
      "batchIndex": 1,
      "symbols": []
    },
    {
      "path": "src/services/storeEffects/syncStoreEffects.ts",
      "batchIndex": 10,
      "symbols": [
        "createSyncStoreEffects"
      ]
    },
    {
      "path": "src/shared/components/CharacterMenu/CharacterMenu.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/services/connections.ts": [
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
  "src/services/firebase.ts": [
    {
      "path": "src/dm/hooks/useCampaignOwnership.ts",
      "batchIndex": 1,
      "symbols": [
        "useCampaignOwnership"
      ]
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
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": [
        "useCharacterActions"
      ]
    },
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
      "path": "src/screens/DM/DMCampaignDetail.tsx",
      "batchIndex": 1,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMCampaignNotes.tsx",
      "batchIndex": 1,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMCampaigns.tsx",
      "batchIndex": 1,
      "symbols": []
    },
    {
      "path": "src/services/accountDeletion.ts",
      "batchIndex": 10,
      "symbols": [
        "AccountDeletionError",
        "buildTransferKey",
        "previewAccountDeletion",
        "requestAccountDeletion"
      ]
    }
  ],
  "src/services/users.ts": [
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
      "path": "src/shared/components/Firebase/Auth.tsx",
      "batchIndex": 10,
      "symbols": [
        "Auth"
      ]
    }
  ],
  "src/shared/const/TrackerTemplates.ts": [
    {
      "path": "src/dm/domain/types/index.ts",
      "batchIndex": 1,
      "symbols": []
    }
  ],
  "src/shared/helpers/collaboration/status.ts": [
    {
      "path": "src/types/Product.ts",
      "batchIndex": 15,
      "symbols": [
        "APP_ROLES"
      ]
    },
    {
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": [
        "useCharacterActions"
      ]
    },
    {
      "path": "src/screens/DM/DM.tsx",
      "batchIndex": 1,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMCampaignNotes.tsx",
      "batchIndex": 1,
      "symbols": []
    }
  ],
  "src/shared/helpers/homebrew.ts": [
    {
      "path": "src/domain/mappers/index.ts",
      "batchIndex": 12,
      "symbols": [
        "characterMapper",
        "homebrewMapper",
        "spellMapper"
      ]
    },
    {
      "path": "src/domain/types/index.ts",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": [
        "useCharacterActions"
      ]
    }
  ],
  "src/shared/helpers/mapCloudCharacter.ts": [
    {
      "path": "src/domain/mappers/index.ts",
      "batchIndex": 12,
      "symbols": [
        "characterMapper",
        "homebrewMapper",
        "spellMapper"
      ]
    },
    {
      "path": "src/domain/types/index.ts",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": [
        "useCharacterActions"
      ]
    },
    {
      "path": "src/screens/DM/DM.tsx",
      "batchIndex": 1,
      "symbols": []
    },
    {
      "path": "src/screens/DM/adapters/unifiedParty.ts",
      "batchIndex": 9,
      "symbols": [
        "buildUnifiedPartyList"
      ]
    }
  ],
  "src/shared/helpers/stripUndefinedDeep.ts": [
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
  "src/shared/helpers/sync/syncErrorClassification.ts": [
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
  "src/shared/services/telemetry/productTelemetry.ts": [
    {
      "path": "src/components/ShareCharacterSheetModal.tsx",
      "batchIndex": 9,
      "symbols": [
        "ShareCharacterSheetModal"
      ]
    },
    {
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": [
        "useCharacterActions"
      ]
    },
    {
      "path": "src/screens/DM/DMCampaignDetail.tsx",
      "batchIndex": 1,
      "symbols": []
    },
    {
      "path": "src/services/accountDeletion.ts",
      "batchIndex": 10,
      "symbols": [
        "AccountDeletionError",
        "buildTransferKey",
        "previewAccountDeletion",
        "requestAccountDeletion"
      ]
    },
    {
      "path": "src/services/storeEffects/characterStoreEffects.ts",
      "batchIndex": 10,
      "symbols": [
        "createCharacterStoreEffects"
      ]
    },
    {
      "path": "src/services/storeEffects/uiStoreEffects.ts",
      "batchIndex": 7,
      "symbols": [
        "createUiStoreEffects"
      ]
    },
    {
      "path": "src/shared/components/ErrorBoundary/ErrorBoundary.tsx",
      "batchIndex": 14,
      "symbols": [
        "ErrorBoundary"
      ]
    }
  ],
  "src/types/Sync.ts": [
    {
      "path": "src/stores/selectors/syncStoreSelectors.ts",
      "batchIndex": 5,
      "symbols": [
        "selectSyncByCharacterId",
        "selectSyncStoreActions"
      ]
    },
    {
      "path": "src/stores/syncStore.ts",
      "batchIndex": 10,
      "symbols": [
        "selectSyncByCharacterId",
        "selectSyncStoreActions"
      ]
    }
  ]
}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields — `path`, `language`, `sizeLines`, `fileCategory`):
1. `src/screens/DM/DMEncounterPrep.tsx` (511 lines, language: `typescript`, fileCategory: `code`)
2. `src/screens/DM/DMPartyOverview.tsx` (263 lines, language: `typescript`, fileCategory: `code`)
3. `src/screens/DM/DMQuickEdit.tsx` (536 lines, language: `typescript`, fileCategory: `code`)
4. `src/screens/DM/DMSharedUpdates.tsx` (427 lines, language: `typescript`, fileCategory: `code`)
5. `src/screens/DM/PinnedReferencesList.tsx` (52 lines, language: `typescript`, fileCategory: `code`)
6. `src/screens/DM/adapters/campaignLink.ts` (37 lines, language: `typescript`, fileCategory: `code`)
7. `src/screens/DM/adapters/index.ts` (4 lines, language: `typescript`, fileCategory: `code`)
8. `src/screens/DM/style.ts` (140 lines, language: `typescript`, fileCategory: `code`)
9. `src/screens/Home/Home.tsx` (465 lines, language: `typescript`, fileCategory: `code`)
10. `src/screens/Home/homeViewModel.test.ts` (194 lines, language: `typescript`, fileCategory: `code`)
11. `src/screens/Home/homeViewModel.ts` (264 lines, language: `typescript`, fileCategory: `code`)
12. `src/screens/Initiative/CampaignInitiativeBoard.tsx` (251 lines, language: `typescript`, fileCategory: `code`)
13. `src/screens/Initiative/Initiative.tsx` (62 lines, language: `typescript`, fileCategory: `code`)
14. `src/services/campaignInvite.ts` (50 lines, language: `typescript`, fileCategory: `code`)
15. `src/services/characterSyncCoordinator.test.ts` (556 lines, language: `typescript`, fileCategory: `code`)
16. `src/services/characterSyncCoordinator.ts` (764 lines, language: `typescript`, fileCategory: `code`)
17. `src/services/connections.ts` (70 lines, language: `typescript`, fileCategory: `code`)
18. `src/services/firebase.ts` (36 lines, language: `typescript`, fileCategory: `code`)
19. `src/services/users.ts` (29 lines, language: `typescript`, fileCategory: `code`)
20. `src/shared/const/TrackerTemplates.ts` (28 lines, language: `typescript`, fileCategory: `code`)
21. `src/shared/helpers/collaboration/status.ts` (85 lines, language: `typescript`, fileCategory: `code`)
22. `src/shared/helpers/homebrew.ts` (52 lines, language: `typescript`, fileCategory: `code`)
23. `src/shared/helpers/mapCloudCharacter.ts` (6 lines, language: `typescript`, fileCategory: `code`)
24. `src/shared/helpers/stripUndefinedDeep.ts` (16 lines, language: `typescript`, fileCategory: `code`)
25. `src/shared/helpers/sync/conflictPolicy.test.ts` (116 lines, language: `typescript`, fileCategory: `code`)
26. `src/shared/helpers/sync/conflictPolicy.ts` (109 lines, language: `typescript`, fileCategory: `code`)
27. `src/shared/helpers/sync/syncErrorClassification.test.ts` (53 lines, language: `typescript`, fileCategory: `code`)
28. `src/shared/helpers/sync/syncErrorClassification.ts` (36 lines, language: `typescript`, fileCategory: `code`)
29. `src/shared/services/telemetry/productTelemetry.test.ts` (77 lines, language: `typescript`, fileCategory: `code`)
30. `src/shared/services/telemetry/productTelemetry.ts` (102 lines, language: `typescript`, fileCategory: `code`)
31. `src/types/Sync.ts` (1 lines, language: `typescript`, fileCategory: `code`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").
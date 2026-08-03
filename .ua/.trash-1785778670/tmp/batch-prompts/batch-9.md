Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 9/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-9.json` (single-file mode) OR `batch-9-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):
```json
{
  "src/components/ShareCharacterSheetModal.tsx": [
    "src/context/Theme-store.ts",
    "src/repositories/characterCloudRepository.ts",
    "src/shared/services/telemetry/productTelemetry.ts",
    "src/shared/styles/tokens.ts"
  ],
  "src/context/Character-store.ts": [],
  "src/context/Theme-store.ts": [],
  "src/dm/domain/encounter/calculator.test.ts": [
    "src/dm/domain/encounter/index.ts"
  ],
  "src/dm/domain/encounter/index.ts": [],
  "src/screens/Character/components/CharacterSourceBadge.test.tsx": [
    "src/screens/Character/components/CharacterSourceBadge.tsx",
    "src/types/Character.ts"
  ],
  "src/screens/Character/components/CharacterSourceBadge.tsx": [
    "src/shared/helpers/sourcePresentation.ts",
    "src/types/Character.ts"
  ],
  "src/screens/DM/EncounterCalculator/EncounterCalculator.tsx": [
    "src/context/Character-store.ts",
    "src/context/Monster-store.ts",
    "src/context/Theme-store.ts",
    "src/dm/domain/encounter/index.ts",
    "src/domain/srd/localization.ts",
    "src/screens/DM/EncounterCalculator/style.ts",
    "src/shared/components/Modal/Modal.tsx",
    "src/shared/components/TextInput/TextInput.tsx",
    "src/shared/styles/tokens.ts"
  ],
  "src/screens/DM/adapters/unifiedParty.ts": [
    "src/shared/helpers/mapCloudCharacter.ts",
    "src/types/Character.ts"
  ],
  "src/screens/Initiative/LocalInitiativeBoard.tsx": [
    "src/context/Character-store.ts",
    "src/context/Theme-store.ts",
    "src/screens/DM/style.ts",
    "src/screens/DiceRoller/DiceRoller.tsx",
    "src/screens/Initiative/style.ts",
    "src/shared/components/Modal/Modal.tsx",
    "src/shared/components/TextInput/TextInput.tsx",
    "src/shared/services/diceRoller.ts",
    "src/shared/styles/tokens.ts"
  ],
  "src/services/characterDeletion.test.ts": [
    "src/services/characterDeletion.ts"
  ],
  "src/services/characterDeletion.ts": [],
  "src/shared/components/CharacterCard/CharacterCard.tsx": [
    "src/context/Character-store.ts",
    "src/context/Theme-store.ts",
    "src/navigation/TabNavigator.tsx",
    "src/repositories/characterCloudRepository.ts",
    "src/shared/components/CharacterCard/style.ts",
    "src/types/Character.ts"
  ],
  "src/shared/components/CharacterMenu/CharacterMenu.tsx": [
    "src/components/ShareCharacterSheetModal.tsx",
    "src/context/Character-store.ts",
    "src/context/Sync-store.ts",
    "src/context/Theme-store.ts",
    "src/navigation/TabNavigator.tsx",
    "src/repositories/characterCloudRepository.ts",
    "src/services/characterDeletion.ts",
    "src/services/characterSyncCoordinator.ts",
    "src/shared/components/CharacterMenu/style.ts",
    "src/shared/components/Modal/Modal.tsx",
    "src/shared/components/TextInput/TextInput.tsx",
    "src/shared/const/experience.ts",
    "src/shared/styles/tokens.ts",
    "src/types/Character.ts"
  ],
  "src/shared/components/CharacterOverview/CharacterOverview.tsx": [
    "src/context/Character-store.ts",
    "src/context/Theme-store.ts",
    "src/shared/components/CharacterOverview/style.ts"
  ],
  "src/shared/components/CharacterStats/CharacterStats.tsx": [
    "src/context/Theme-store.ts",
    "src/shared/components/CharacterOverview/CharacterOverview.tsx",
    "src/shared/components/CharacterStats/Tabs/Attributes/Attributes.tsx",
    "src/shared/components/CharacterStats/Tabs/BackStory/BackStory.tsx",
    "src/shared/components/CharacterStats/Tabs/Coins/Coins.tsx",
    "src/shared/components/CharacterStats/Tabs/Combat/Combat.tsx",
    "src/shared/components/CharacterStats/Tabs/Inventory/Inventory.tsx",
    "src/shared/components/CharacterStats/Tabs/Notes/Notes.tsx",
    "src/shared/components/CharacterStats/Tabs/Proficiencies/Proficiencies.tsx",
    "src/shared/components/CharacterStats/Tabs/Skills/Skills.tsx",
    "src/shared/components/CharacterStats/Tabs/Spells/Spells.tsx",
    "src/shared/components/CharacterStats/Tabs/Traits/Traits.tsx",
    "src/shared/components/CharacterStats/style.ts",
    "src/shared/const/CharacterTabs.ts",
    "src/types/Character.ts"
  ],
  "src/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/AttributesItem.tsx": [
    "src/context/Theme-store.ts",
    "src/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/style.ts",
    "src/shared/components/RollResultModal/RollResultModal.tsx",
    "src/shared/components/TextInput/TextInput.tsx",
    "src/shared/const/attributes.ts",
    "src/shared/helpers/calculateModifier.ts"
  ],
  "src/shared/components/CharacterStats/Tabs/Attributes/Attributes.tsx": [
    "src/context/Character-store.ts",
    "src/context/Theme-store.ts",
    "src/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/AttributesItem.tsx",
    "src/shared/components/CharacterStats/Tabs/style.ts",
    "src/shared/const/attributes.ts",
    "src/types/Character.ts"
  ],
  "src/shared/components/CharacterStats/Tabs/BackStory/BackStory.tsx": [
    "src/context/Character-store.ts",
    "src/context/Theme-store.ts",
    "src/shared/components/CharacterStats/Tabs/style.ts",
    "src/shared/components/TextInput/MultiTextInput.tsx",
    "src/types/Character.ts"
  ],
  "src/shared/components/CharacterStats/Tabs/Coins/Coins.tsx": [
    "src/context/Character-store.ts",
    "src/context/CustomCoins-store.ts",
    "src/context/Theme-store.ts",
    "src/shared/components/CharacterStats/Tabs/style.ts",
    "src/shared/styles/tokens.ts",
    "src/types/Character.ts"
  ],
  "src/shared/components/CharacterStats/Tabs/Combat/Combat.tsx": [
    "src/context/Character-store.ts",
    "src/context/Theme-store.ts",
    "src/shared/components/CharacterStats/Tabs/style.ts",
    "src/shared/components/RollResultModal/RollResultModal.tsx",
    "src/shared/components/TextInput/TextInput.tsx",
    "src/shared/styles/tokens.ts",
    "src/types/Character.ts",
    "src/types/DeathSaves.ts",
    "src/types/HitPoints.ts"
  ]
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):
```json
{
  "src/components/ShareCharacterSheetModal.tsx": [
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
      "path": "src/shared/services/telemetry/productTelemetry.ts",
      "batchIndex": 3,
      "symbols": [
        "setAnalyticsConsent",
        "isAnalyticsConsentEnabled",
        "trackProductEvent",
        "getProductEvents"
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
  "src/context/Character-store.ts": [
    {
      "path": "src/screens/Character/Character.tsx",
      "batchIndex": 6,
      "symbols": [
        "Character"
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
      "path": "src/screens/DM/DMCampaigns.tsx",
      "batchIndex": 1,
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
      "path": "src/screens/Home/Home.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/Spellbook/Spellbook.tsx",
      "batchIndex": 2,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Inventory/Inventory.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Notes/Notes.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Proficiencies/Proficiencies.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Skills/Skills.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Spells/Spells.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Traits/Traits.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Weapons/Weapon.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/services/fileSerice.ts",
      "batchIndex": 2,
      "symbols": []
    }
  ],
  "src/context/Theme-store.ts": [
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
      "path": "src/screens/DM/DMEncounterPrep.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/Spellbook/Spellbook.tsx",
      "batchIndex": 2,
      "symbols": []
    },
    {
      "path": "src/screens/Bestiary/Bestiary.tsx",
      "batchIndex": 2,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMPartyOverview.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/Home/Home.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMSharedUpdates.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/Settings/Settings.tsx",
      "batchIndex": 10,
      "symbols": []
    },
    {
      "path": "src/shared/components/Modal/Modal.tsx",
      "batchIndex": 11,
      "symbols": [
        "Modal"
      ]
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
      "path": "src/screens/DM/DMQuickEdit.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/Monster/Monster.tsx",
      "batchIndex": 2,
      "symbols": [
        "Monster"
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
      "path": "src/shared/components/TextInput/TextInput.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/modules/Header/Header.tsx",
      "batchIndex": 2,
      "symbols": []
    },
    {
      "path": "App.tsx",
      "batchIndex": 14,
      "symbols": [
        "App"
      ]
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Inventory/Inventory.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/screens/Initiative/CampaignInitiativeBoard.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Spells/Spells.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/components/MonsterCard/MonsterCard.tsx",
      "batchIndex": 2,
      "symbols": [
        "MonsterCard"
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
      "path": "src/screens/DiceRoller/DiceRoller.tsx",
      "batchIndex": 6,
      "symbols": [
        "DiceRollerPanel"
      ]
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Skills/Skills.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Traits/Traits.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/components/ErrorBoundary/ErrorBoundary.tsx",
      "batchIndex": 14,
      "symbols": [
        "ErrorBoundary"
      ]
    },
    {
      "path": "src/shared/components/RollResultModal/RollResultModal.tsx",
      "batchIndex": 11,
      "symbols": [
        "RollResultModal"
      ]
    },
    {
      "path": "src/shared/components/TextInput/MultiTextInput.tsx",
      "batchIndex": 11,
      "symbols": [
        "MultiTextInput"
      ]
    },
    {
      "path": "src/screens/References/References.tsx",
      "batchIndex": 10,
      "symbols": [
        "References"
      ]
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Notes/Notes.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Proficiencies/Proficiencies.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/components/FirstLaunchModals/FirstLaunchModals.tsx",
      "batchIndex": 14,
      "symbols": []
    },
    {
      "path": "src/shared/ui/Text.tsx",
      "batchIndex": 8,
      "symbols": [
        "resolveTextStyle",
        "Text"
      ]
    },
    {
      "path": "src/screens/LegalLicenses/LegalLicenses.tsx",
      "batchIndex": 7,
      "symbols": []
    },
    {
      "path": "src/screens/Settings/DeleteAccountModal.tsx",
      "batchIndex": 10,
      "symbols": [
        "DeleteAccountModal"
      ]
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Skills/SkillItem/SkillItem.tsx",
      "batchIndex": 11,
      "symbols": [
        "SkillItem"
      ]
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Weapons/Weapon.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/components/Firebase/Auth.tsx",
      "batchIndex": 10,
      "symbols": [
        "Auth"
      ]
    },
    {
      "path": "src/screens/Dice/Dice.tsx",
      "batchIndex": 6,
      "symbols": []
    },
    {
      "path": "src/shared/ui/Button.tsx",
      "batchIndex": 8,
      "symbols": [
        "resolveButtonVariant",
        "Button"
      ]
    },
    {
      "path": "src/screens/DM/LootGenerator/LootGenerator.tsx",
      "batchIndex": 7,
      "symbols": []
    },
    {
      "path": "src/screens/Support/Support.tsx",
      "batchIndex": 2,
      "symbols": [
        "Support"
      ]
    },
    {
      "path": "src/shared/ui/Card.tsx",
      "batchIndex": 8,
      "symbols": [
        "resolveCardVariant",
        "Card"
      ]
    },
    {
      "path": "src/shared/ui/Chip.tsx",
      "batchIndex": 8,
      "symbols": [
        "Chip"
      ]
    },
    {
      "path": "src/shared/components/EmptyPlaceholder.tsx",
      "batchIndex": 8,
      "symbols": []
    },
    {
      "path": "src/shared/components/Loader/Loader.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/styles/useDesignTokens.ts",
      "batchIndex": 8,
      "symbols": [
        "useDesignTokens"
      ]
    }
  ],
  "src/dm/domain/encounter/index.ts": [
    {
      "path": "src/screens/DM/DMEncounterPrep.tsx",
      "batchIndex": 3,
      "symbols": []
    }
  ],
  "src/screens/Character/components/CharacterSourceBadge.test.tsx": [
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
  "src/screens/Character/components/CharacterSourceBadge.tsx": [
    {
      "path": "src/shared/helpers/sourcePresentation.ts",
      "batchIndex": 2,
      "symbols": [
        "isBuiltInRulesSource",
        "shouldDisplaySourceMetadata"
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
    }
  ],
  "src/screens/DM/EncounterCalculator/EncounterCalculator.tsx": [
    {
      "path": "src/context/Monster-store.ts",
      "batchIndex": 2,
      "symbols": [
        "default"
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
      "path": "src/screens/DM/EncounterCalculator/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
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
    },
    {
      "path": "src/navigation/DMNavigator.tsx",
      "batchIndex": 1,
      "symbols": [
        "DMNavigator"
      ]
    }
  ],
  "src/screens/DM/adapters/unifiedParty.ts": [
    {
      "path": "src/shared/helpers/mapCloudCharacter.ts",
      "batchIndex": 3,
      "symbols": [
        "mapCloudCharacterToLocalDto"
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
  "src/screens/Initiative/LocalInitiativeBoard.tsx": [
    {
      "path": "src/screens/DM/style.ts",
      "batchIndex": 3,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/DiceRoller/DiceRoller.tsx",
      "batchIndex": 6,
      "symbols": [
        "DiceRollerPanel"
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
      "path": "src/shared/components/Modal/Modal.tsx",
      "batchIndex": 11,
      "symbols": [
        "Modal"
      ]
    },
    {
      "path": "src/shared/components/TextInput/TextInput.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/services/diceRoller.ts",
      "batchIndex": 6,
      "symbols": [
        "rollDice",
        "rollFormula",
        "parseDiceType"
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
      "path": "src/screens/Initiative/Initiative.tsx",
      "batchIndex": 3,
      "symbols": []
    }
  ],
  "src/shared/components/CharacterCard/CharacterCard.tsx": [
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
      "path": "src/shared/components/CharacterCard/style.ts",
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
  "src/shared/components/CharacterMenu/CharacterMenu.tsx": [
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
      "path": "src/shared/components/CharacterMenu/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
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
      "path": "src/shared/components/TextInput/TextInput.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/const/experience.ts",
      "batchIndex": 11,
      "symbols": [
        "EXPERIENCE_TABLE",
        "getLevelByExperience"
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
    },
    {
      "path": "src/screens/Character/components/CharacterHeader.tsx",
      "batchIndex": 6,
      "symbols": [
        "CharacterHeader"
      ]
    }
  ],
  "src/shared/components/CharacterOverview/CharacterOverview.tsx": [
    {
      "path": "src/shared/components/CharacterOverview/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    }
  ],
  "src/shared/components/CharacterStats/CharacterStats.tsx": [
    {
      "path": "src/shared/components/CharacterStats/Tabs/Inventory/Inventory.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Notes/Notes.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Proficiencies/Proficiencies.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Skills/Skills.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Spells/Spells.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Traits/Traits.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/shared/const/CharacterTabs.ts",
      "batchIndex": 11,
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
  "src/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/AttributesItem.tsx": [
    {
      "path": "src/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/shared/components/RollResultModal/RollResultModal.tsx",
      "batchIndex": 11,
      "symbols": [
        "RollResultModal"
      ]
    },
    {
      "path": "src/shared/components/TextInput/TextInput.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/const/attributes.ts",
      "batchIndex": 11,
      "symbols": [
        "attributes"
      ]
    },
    {
      "path": "src/shared/helpers/calculateModifier.ts",
      "batchIndex": 6,
      "symbols": [
        "calculateModifier"
      ]
    }
  ],
  "src/shared/components/CharacterStats/Tabs/Attributes/Attributes.tsx": [
    {
      "path": "src/shared/components/CharacterStats/Tabs/style.ts",
      "batchIndex": 11,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/shared/const/attributes.ts",
      "batchIndex": 11,
      "symbols": [
        "attributes"
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
  "src/shared/components/CharacterStats/Tabs/BackStory/BackStory.tsx": [
    {
      "path": "src/shared/components/CharacterStats/Tabs/style.ts",
      "batchIndex": 11,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/shared/components/TextInput/MultiTextInput.tsx",
      "batchIndex": 11,
      "symbols": [
        "MultiTextInput"
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
  "src/shared/components/CharacterStats/Tabs/Coins/Coins.tsx": [
    {
      "path": "src/context/CustomCoins-store.ts",
      "batchIndex": 10,
      "symbols": [
        "default"
      ]
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/style.ts",
      "batchIndex": 11,
      "symbols": [
        "getStyles"
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
  "src/shared/components/CharacterStats/Tabs/Combat/Combat.tsx": [
    {
      "path": "src/shared/components/CharacterStats/Tabs/style.ts",
      "batchIndex": 11,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/shared/components/RollResultModal/RollResultModal.tsx",
      "batchIndex": 11,
      "symbols": [
        "RollResultModal"
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
      "path": "src/types/DeathSaves.ts",
      "batchIndex": 13,
      "symbols": []
    },
    {
      "path": "src/types/HitPoints.ts",
      "batchIndex": 13,
      "symbols": []
    }
  ]
}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields — `path`, `language`, `sizeLines`, `fileCategory`):
1. `src/components/ShareCharacterSheetModal.tsx` (198 lines, language: `typescript`, fileCategory: `code`)
2. `src/context/Character-store.ts` (6 lines, language: `typescript`, fileCategory: `code`)
3. `src/context/Theme-store.ts` (1 lines, language: `typescript`, fileCategory: `code`)
4. `src/dm/domain/encounter/calculator.test.ts` (48 lines, language: `typescript`, fileCategory: `code`)
5. `src/dm/domain/encounter/index.ts` (6 lines, language: `typescript`, fileCategory: `code`)
6. `src/screens/Character/components/CharacterSourceBadge.test.tsx` (59 lines, language: `typescript`, fileCategory: `code`)
7. `src/screens/Character/components/CharacterSourceBadge.tsx` (39 lines, language: `typescript`, fileCategory: `code`)
8. `src/screens/DM/EncounterCalculator/EncounterCalculator.tsx` (268 lines, language: `typescript`, fileCategory: `code`)
9. `src/screens/DM/adapters/unifiedParty.ts` (34 lines, language: `typescript`, fileCategory: `code`)
10. `src/screens/Initiative/LocalInitiativeBoard.tsx` (299 lines, language: `typescript`, fileCategory: `code`)
11. `src/services/characterDeletion.test.ts` (56 lines, language: `typescript`, fileCategory: `code`)
12. `src/services/characterDeletion.ts` (19 lines, language: `typescript`, fileCategory: `code`)
13. `src/shared/components/CharacterCard/CharacterCard.tsx` (77 lines, language: `typescript`, fileCategory: `code`)
14. `src/shared/components/CharacterMenu/CharacterMenu.tsx` (608 lines, language: `typescript`, fileCategory: `code`)
15. `src/shared/components/CharacterOverview/CharacterOverview.tsx` (30 lines, language: `typescript`, fileCategory: `code`)
16. `src/shared/components/CharacterStats/CharacterStats.tsx` (66 lines, language: `typescript`, fileCategory: `code`)
17. `src/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/AttributesItem.tsx` (66 lines, language: `typescript`, fileCategory: `code`)
18. `src/shared/components/CharacterStats/Tabs/Attributes/Attributes.tsx` (36 lines, language: `typescript`, fileCategory: `code`)
19. `src/shared/components/CharacterStats/Tabs/BackStory/BackStory.tsx` (64 lines, language: `typescript`, fileCategory: `code`)
20. `src/shared/components/CharacterStats/Tabs/Coins/Coins.tsx` (165 lines, language: `typescript`, fileCategory: `code`)
21. `src/shared/components/CharacterStats/Tabs/Combat/Combat.tsx` (176 lines, language: `typescript`, fileCategory: `code`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").
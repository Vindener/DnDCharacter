Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 11/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-11.json` (single-file mode) OR `batch-11-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):

```json
{
  "src/shared/components/CharacterStats/Tabs/Inventory/Inventory.tsx": [
    "src/context/Character-store.ts",
    "src/context/Theme-store.ts",
    "src/shared/components/CharacterStats/Tabs/Weapons/Weapon.tsx",
    "src/shared/components/CharacterStats/Tabs/style.ts",
    "src/shared/components/TextInput/MultiTextInput.tsx",
    "src/shared/const/WeaponsDb.ts",
    "src/shared/styles/tokens.ts",
    "src/types/Character.ts"
  ],
  "src/shared/components/CharacterStats/Tabs/Notes/Notes.tsx": [
    "src/context/Character-store.ts",
    "src/context/Theme-store.ts",
    "src/shared/components/CharacterStats/Tabs/style.ts",
    "src/shared/components/TextInput/MultiTextInput.tsx",
    "src/types/Character.ts"
  ],
  "src/shared/components/CharacterStats/Tabs/Proficiencies/Proficiencies.tsx": [
    "src/context/Character-store.ts",
    "src/context/Theme-store.ts",
    "src/shared/components/CharacterStats/Tabs/style.ts",
    "src/shared/components/TextInput/MultiTextInput.tsx",
    "src/types/Character.ts"
  ],
  "src/shared/components/CharacterStats/Tabs/Skills/SkillItem/SkillItem.tsx": [
    "src/context/Theme-store.ts",
    "src/shared/components/CharacterStats/Tabs/Skills/SkillItem/style.ts",
    "src/shared/components/RollResultModal/RollResultModal.tsx",
    "src/shared/components/TextInput/TextInput.tsx"
  ],
  "src/shared/components/CharacterStats/Tabs/Skills/Skills.tsx": [
    "src/context/Character-store.ts",
    "src/context/Theme-store.ts",
    "src/shared/components/CharacterStats/Tabs/Skills/SkillItem/SkillItem.tsx",
    "src/shared/components/CharacterStats/Tabs/style.ts",
    "src/shared/const/SkillsTab.ts",
    "src/types/Character.ts"
  ],
  "src/shared/components/CharacterStats/Tabs/Spells/Spells.tsx": [
    "src/context/Character-store.ts",
    "src/context/Theme-store.ts",
    "src/shared/components/CharacterStats/Tabs/style.ts",
    "src/shared/components/TextInput/index.ts",
    "src/shared/styles/tokens.ts",
    "src/types/Character.ts",
    "src/types/Spells.ts"
  ],
  "src/shared/components/CharacterStats/Tabs/Traits/Traits.tsx": [
    "src/context/Character-store.ts",
    "src/context/Theme-store.ts",
    "src/shared/components/CharacterStats/Tabs/style.ts",
    "src/shared/components/TextInput/MultiTextInput.tsx",
    "src/types/Character.ts",
    "src/types/Traits.ts"
  ],
  "src/shared/components/CharacterStats/Tabs/Weapons/Weapon.tsx": [
    "src/context/Character-store.ts",
    "src/context/Theme-store.ts",
    "src/shared/styles/tokens.ts",
    "src/types/Weapon.ts"
  ],
  "src/shared/components/CharacterStats/Tabs/style.ts": ["src/shared/styles/theme.ts", "src/shared/styles/tokens.ts"],
  "src/shared/components/Loader/Loader.tsx": ["src/context/Theme-store.ts"],
  "src/shared/components/Modal/Modal.tsx": ["src/context/Theme-store.ts", "src/shared/components/Modal/style.ts", "src/shared/ui/index.ts"],
  "src/shared/components/RollResultModal/RollResultModal.tsx": [
    "src/context/Theme-store.ts",
    "src/shared/components/Loader/Loader.tsx",
    "src/shared/components/Modal/Modal.tsx",
    "src/shared/components/RollResultModal/style.ts"
  ],
  "src/shared/components/TextInput/MultiTextInput.tsx": ["src/context/Theme-store.ts", "src/shared/styles/tokens.ts"],
  "src/shared/components/TextInput/TextInput.tsx": ["src/context/Theme-store.ts", "src/shared/styles/tokens.ts", "src/shared/ui/index.ts"],
  "src/shared/components/TextInput/index.ts": [],
  "src/shared/const/CharacterTabs.ts": [],
  "src/shared/const/SkillsTab.ts": [],
  "src/shared/const/attributes.ts": ["src/domain/types/index.ts"],
  "src/shared/const/experience.ts": [],
  "src/types/Character.ts": []
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):

```json
{
  "src/shared/components/CharacterStats/Tabs/Inventory/Inventory.tsx": [
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
      "path": "src/shared/const/WeaponsDb.ts",
      "batchIndex": 13,
      "symbols": ["WEAPONS_DB", "findWeapon", "isWeaponName"]
    },
    {
      "path": "src/shared/styles/tokens.ts",
      "batchIndex": 8,
      "symbols": ["space", "radius", "fontSize", "typography", "designTokens", "sp", "rd", "fs"]
    },
    {
      "path": "src/shared/components/CharacterStats/CharacterStats.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/shared/components/CharacterStats/Tabs/Notes/Notes.tsx": [
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
      "path": "src/shared/components/CharacterStats/CharacterStats.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/shared/components/CharacterStats/Tabs/Proficiencies/Proficiencies.tsx": [
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
      "path": "src/shared/components/CharacterStats/CharacterStats.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/shared/components/CharacterStats/Tabs/Skills/SkillItem/SkillItem.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Skills/SkillItem/style.ts",
      "batchIndex": 7,
      "symbols": ["getStyles"]
    }
  ],
  "src/shared/components/CharacterStats/Tabs/Skills/Skills.tsx": [
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
      "path": "src/shared/components/CharacterStats/CharacterStats.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/shared/components/CharacterStats/Tabs/Spells/Spells.tsx": [
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
      "path": "src/shared/styles/tokens.ts",
      "batchIndex": 8,
      "symbols": ["space", "radius", "fontSize", "typography", "designTokens", "sp", "rd", "fs"]
    },
    {
      "path": "src/types/Spells.ts",
      "batchIndex": 13,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/CharacterStats.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/shared/components/CharacterStats/Tabs/Traits/Traits.tsx": [
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
      "path": "src/types/Traits.ts",
      "batchIndex": 13,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/CharacterStats.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/shared/components/CharacterStats/Tabs/Weapons/Weapon.tsx": [
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
      "path": "src/shared/styles/tokens.ts",
      "batchIndex": 8,
      "symbols": ["space", "radius", "fontSize", "typography", "designTokens", "sp", "rd", "fs"]
    },
    {
      "path": "src/types/Weapon.ts",
      "batchIndex": 13,
      "symbols": []
    }
  ],
  "src/shared/components/CharacterStats/Tabs/style.ts": [
    {
      "path": "src/shared/styles/theme.ts",
      "batchIndex": 8,
      "symbols": ["darkColors", "lightColors"]
    },
    {
      "path": "src/shared/styles/tokens.ts",
      "batchIndex": 8,
      "symbols": ["space", "radius", "fontSize", "typography", "designTokens", "sp", "rd", "fs"]
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Attributes/Attributes.tsx",
      "batchIndex": 9,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/BackStory/BackStory.tsx",
      "batchIndex": 9,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Coins/Coins.tsx",
      "batchIndex": 9,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Combat/Combat.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/shared/components/Loader/Loader.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    }
  ],
  "src/shared/components/Modal/Modal.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    },
    {
      "path": "src/shared/components/Modal/style.ts",
      "batchIndex": 8,
      "symbols": ["getStyles"]
    },
    {
      "path": "src/shared/ui/index.ts",
      "batchIndex": 14,
      "symbols": [
        "Text",
        "Button",
        "Card",
        "Input",
        "Chip",
        "Section",
        "Screen",
        "SkeletonBestiary",
        "SkeletonBox",
        "SkeletonCard",
        "SkeletonCharacterCard",
        "SkeletonCharacterSheet",
        "SkeletonCircle",
        "SkeletonHome",
        "SkeletonList",
        "SkeletonMonsterCard",
        "SkeletonSpellbook",
        "SkeletonSpellCard",
        "SkeletonText",
        "resolveButtonVariant",
        "resolveCardVariant",
        "resolveTextStyleVariant",
        "TextProps",
        "TextTone",
        "ButtonProps",
        "ButtonVariant",
        "ButtonSize",
        "CardProps",
        "CardVariant",
        "InputProps",
        "InputSize",
        "ChipProps",
        "ChipTone",
        "ChipSize",
        "SectionProps",
        "ScreenProps"
      ]
    },
    {
      "path": "src/screens/Character/components/CharacterModals.tsx",
      "batchIndex": 6,
      "symbols": ["CharacterModals"]
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
      "path": "src/screens/DM/DMQuickEdit.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/DM/EncounterCalculator/EncounterCalculator.tsx",
      "batchIndex": 9,
      "symbols": []
    },
    {
      "path": "src/screens/Initiative/LocalInitiativeBoard.tsx",
      "batchIndex": 9,
      "symbols": []
    },
    {
      "path": "src/screens/Spellbook/Spellbook.tsx",
      "batchIndex": 2,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterMenu/CharacterMenu.tsx",
      "batchIndex": 9,
      "symbols": []
    },
    {
      "path": "src/shared/components/FirstLaunchModals/FirstLaunchModals.tsx",
      "batchIndex": 14,
      "symbols": []
    },
    {
      "path": "src/shared/components/WhatsNewModal/WhatsNewModal.tsx",
      "batchIndex": 14,
      "symbols": []
    }
  ],
  "src/shared/components/RollResultModal/RollResultModal.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    },
    {
      "path": "src/shared/components/RollResultModal/style.ts",
      "batchIndex": 8,
      "symbols": ["getStyles"]
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/AttributesItem.tsx",
      "batchIndex": 9,
      "symbols": ["AttributesItem"]
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Combat/Combat.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/shared/components/TextInput/MultiTextInput.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    },
    {
      "path": "src/shared/styles/tokens.ts",
      "batchIndex": 8,
      "symbols": ["space", "radius", "fontSize", "typography", "designTokens", "sp", "rd", "fs"]
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/BackStory/BackStory.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/shared/components/TextInput/TextInput.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    },
    {
      "path": "src/shared/styles/tokens.ts",
      "batchIndex": 8,
      "symbols": ["space", "radius", "fontSize", "typography", "designTokens", "sp", "rd", "fs"]
    },
    {
      "path": "src/shared/ui/index.ts",
      "batchIndex": 14,
      "symbols": [
        "Text",
        "Button",
        "Card",
        "Input",
        "Chip",
        "Section",
        "Screen",
        "SkeletonBestiary",
        "SkeletonBox",
        "SkeletonCard",
        "SkeletonCharacterCard",
        "SkeletonCharacterSheet",
        "SkeletonCircle",
        "SkeletonHome",
        "SkeletonList",
        "SkeletonMonsterCard",
        "SkeletonSpellbook",
        "SkeletonSpellCard",
        "SkeletonText",
        "resolveButtonVariant",
        "resolveCardVariant",
        "resolveTextStyleVariant",
        "TextProps",
        "TextTone",
        "ButtonProps",
        "ButtonVariant",
        "ButtonSize",
        "CardProps",
        "CardVariant",
        "InputProps",
        "InputSize",
        "ChipProps",
        "ChipTone",
        "ChipSize",
        "SectionProps",
        "ScreenProps"
      ]
    },
    {
      "path": "src/screens/DM/EncounterCalculator/EncounterCalculator.tsx",
      "batchIndex": 9,
      "symbols": []
    },
    {
      "path": "src/screens/Initiative/CampaignInitiativeBoard.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/Initiative/LocalInitiativeBoard.tsx",
      "batchIndex": 9,
      "symbols": []
    },
    {
      "path": "src/screens/Monster/Monster.tsx",
      "batchIndex": 2,
      "symbols": ["Monster"]
    },
    {
      "path": "src/shared/components/CharacterMenu/CharacterMenu.tsx",
      "batchIndex": 9,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/AttributesItem.tsx",
      "batchIndex": 9,
      "symbols": ["AttributesItem"]
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Combat/Combat.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/shared/const/CharacterTabs.ts": [
    {
      "path": "src/shared/components/CharacterStats/CharacterStats.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/shared/const/attributes.ts": [
    {
      "path": "src/domain/types/index.ts",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/AttributesItem.tsx",
      "batchIndex": 9,
      "symbols": ["AttributesItem"]
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Attributes/Attributes.tsx",
      "batchIndex": 9,
      "symbols": []
    },
    {
      "path": "src/stores/characterStore.ts",
      "batchIndex": 13,
      "symbols": ["selectActiveCharacter", "selectCharacterStoreActions", "selectCharacterStoreBasics"]
    }
  ],
  "src/shared/const/experience.ts": [
    {
      "path": "src/shared/components/CharacterMenu/CharacterMenu.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/types/Character.ts": [
    {
      "path": "src/navigation/TabNavigator.tsx",
      "batchIndex": 2,
      "symbols": ["TabNavigator"]
    },
    {
      "path": "src/screens/Character/Character.tsx",
      "batchIndex": 6,
      "symbols": ["Character"]
    },
    {
      "path": "src/screens/Character/components/CharacterSourceBadge.test.tsx",
      "batchIndex": 9,
      "symbols": []
    },
    {
      "path": "src/screens/Character/components/CharacterSourceBadge.tsx",
      "batchIndex": 9,
      "symbols": ["getCharacterSourceBadgeLabel", "CharacterSourceBadge"]
    },
    {
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": ["useCharacterActions"]
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
      "path": "src/screens/DM/adapters/campaignLink.ts",
      "batchIndex": 3,
      "symbols": ["toCampaignLinkInput", "buildCampaignFallbackIdForCharacter", "isCharacterInCampaign", "getCharacterCampaignLabel"]
    },
    {
      "path": "src/screens/DM/adapters/unifiedParty.ts",
      "batchIndex": 9,
      "symbols": ["buildUnifiedPartyList"]
    },
    {
      "path": "src/screens/Home/Home.test.tsx",
      "batchIndex": 5,
      "symbols": []
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
      "path": "src/screens/Spellbook/Spellbook.tsx",
      "batchIndex": 2,
      "symbols": []
    },
    {
      "path": "src/screens/Spellbook/spellbookFilters.ts",
      "batchIndex": 2,
      "symbols": ["filterSpellbookSpells"]
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
      "path": "src/services/storeEffects/dmStoreEffects.ts",
      "batchIndex": 12,
      "symbols": ["createDmStoreEffects"]
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
    },
    {
      "path": "src/shared/components/CharacterStats/CharacterStats.tsx",
      "batchIndex": 9,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Attributes/Attributes.tsx",
      "batchIndex": 9,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/BackStory/BackStory.tsx",
      "batchIndex": 9,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Coins/Coins.tsx",
      "batchIndex": 9,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Combat/Combat.tsx",
      "batchIndex": 9,
      "symbols": []
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
      "path": "src/stores/dmStore.ts",
      "batchIndex": 12,
      "symbols": []
    },
    {
      "path": "src/stores/trackerTemplatesStore.ts",
      "batchIndex": 15,
      "symbols": []
    }
  ]
}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields — `path`, `language`, `sizeLines`, `fileCategory`):

1. `src/shared/components/CharacterStats/Tabs/Inventory/Inventory.tsx` (108 lines, language: `typescript`, fileCategory: `code`)
2. `src/shared/components/CharacterStats/Tabs/Notes/Notes.tsx` (41 lines, language: `typescript`, fileCategory: `code`)
3. `src/shared/components/CharacterStats/Tabs/Proficiencies/Proficiencies.tsx` (42 lines, language: `typescript`, fileCategory: `code`)
4. `src/shared/components/CharacterStats/Tabs/Skills/SkillItem/SkillItem.tsx` (58 lines, language: `typescript`, fileCategory: `code`)
5. `src/shared/components/CharacterStats/Tabs/Skills/Skills.tsx` (91 lines, language: `typescript`, fileCategory: `code`)
6. `src/shared/components/CharacterStats/Tabs/Spells/Spells.tsx` (174 lines, language: `typescript`, fileCategory: `code`)
7. `src/shared/components/CharacterStats/Tabs/Traits/Traits.tsx` (66 lines, language: `typescript`, fileCategory: `code`)
8. `src/shared/components/CharacterStats/Tabs/Weapons/Weapon.tsx` (338 lines, language: `typescript`, fileCategory: `code`)
9. `src/shared/components/CharacterStats/Tabs/style.ts` (36 lines, language: `typescript`, fileCategory: `code`)
10. `src/shared/components/Loader/Loader.tsx` (60 lines, language: `typescript`, fileCategory: `code`)
11. `src/shared/components/Modal/Modal.tsx` (59 lines, language: `typescript`, fileCategory: `code`)
12. `src/shared/components/RollResultModal/RollResultModal.tsx` (75 lines, language: `typescript`, fileCategory: `code`)
13. `src/shared/components/TextInput/MultiTextInput.tsx` (76 lines, language: `typescript`, fileCategory: `code`)
14. `src/shared/components/TextInput/TextInput.tsx` (35 lines, language: `typescript`, fileCategory: `code`)
15. `src/shared/components/TextInput/index.ts` (1 lines, language: `typescript`, fileCategory: `code`)
16. `src/shared/const/CharacterTabs.ts` (11 lines, language: `typescript`, fileCategory: `code`)
17. `src/shared/const/SkillsTab.ts` (20 lines, language: `typescript`, fileCategory: `code`)
18. `src/shared/const/attributes.ts` (18 lines, language: `typescript`, fileCategory: `code`)
19. `src/shared/const/experience.ts` (36 lines, language: `typescript`, fileCategory: `code`)
20. `src/types/Character.ts` (27 lines, language: `typescript`, fileCategory: `code`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").

Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 8/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-8.json` (single-file mode) OR `batch-8-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):
```json
{
  "src/shared/components/EmptyPlaceholder.tsx": [
    "src/context/Theme-store.ts",
    "src/shared/styles/tokens.ts"
  ],
  "src/shared/components/ErrorBoundary/style.ts": [
    "src/shared/styles/theme.ts",
    "src/shared/styles/tokens.ts"
  ],
  "src/shared/components/Modal/style.ts": [
    "src/shared/styles/theme.ts",
    "src/shared/styles/tokens.ts"
  ],
  "src/shared/components/MonsterCard/style.ts": [
    "src/shared/styles/theme.ts",
    "src/shared/styles/tokens.ts"
  ],
  "src/shared/components/RollResultModal/style.ts": [
    "src/shared/styles/theme.ts",
    "src/shared/styles/tokens.ts"
  ],
  "src/shared/styles/statusTones.ts": [
    "src/shared/styles/theme.ts"
  ],
  "src/shared/styles/theme.ts": [],
  "src/shared/styles/tokens.test.ts": [
    "src/shared/styles/tokens.ts"
  ],
  "src/shared/styles/tokens.ts": [],
  "src/shared/styles/useDesignTokens.ts": [
    "src/context/Theme-store.ts",
    "src/shared/styles/tokens.ts"
  ],
  "src/shared/ui/Button.tsx": [
    "src/context/Theme-store.ts",
    "src/shared/styles/tokens.ts",
    "src/shared/ui/Text.tsx",
    "src/shared/ui/variantResolvers.ts"
  ],
  "src/shared/ui/Card.tsx": [
    "src/context/Theme-store.ts",
    "src/shared/styles/tokens.ts",
    "src/shared/ui/variantResolvers.ts"
  ],
  "src/shared/ui/Chip.tsx": [
    "src/context/Theme-store.ts",
    "src/shared/styles/tokens.ts",
    "src/shared/ui/Text.tsx"
  ],
  "src/shared/ui/Input.tsx": [
    "src/context/Theme-store.ts",
    "src/shared/styles/tokens.ts"
  ],
  "src/shared/ui/Screen.tsx": [
    "src/context/Theme-store.ts",
    "src/shared/styles/tokens.ts"
  ],
  "src/shared/ui/Section.tsx": [
    "src/shared/styles/tokens.ts",
    "src/shared/ui/Text.tsx"
  ],
  "src/shared/ui/Text.tsx": [
    "src/context/Theme-store.ts",
    "src/shared/styles/tokens.ts",
    "src/shared/ui/variantResolvers.ts"
  ],
  "src/shared/ui/skeleton/index.tsx": [
    "src/context/Theme-store.ts",
    "src/shared/styles/theme.ts",
    "src/shared/styles/tokens.ts"
  ],
  "src/shared/ui/skeleton/skeleton.test.tsx": [
    "src/shared/ui/skeleton/index.tsx"
  ],
  "src/shared/ui/uiVariants.test.ts": [
    "src/shared/styles/theme.ts",
    "src/shared/ui/variantResolvers.ts"
  ],
  "src/shared/ui/variantResolvers.ts": [
    "src/shared/styles/theme.ts",
    "src/shared/styles/tokens.ts"
  ],
  "src/stores/uiStore.ts": [
    "src/services/storeEffects/uiStoreEffects.ts",
    "src/shared/styles/theme.ts",
    "src/types/CustomCoin.ts"
  ],
  "src/test/mocks/react-navigation-native.ts": [
    "src/shared/styles/theme.ts"
  ],
  "src/types/CustomCoin.ts": []
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):
```json
{
  "src/shared/components/EmptyPlaceholder.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default"
      ]
    }
  ],
  "src/shared/components/ErrorBoundary/style.ts": [
    {
      "path": "src/shared/components/ErrorBoundary/ErrorBoundary.tsx",
      "batchIndex": 14,
      "symbols": [
        "ErrorBoundary"
      ]
    }
  ],
  "src/shared/components/Modal/style.ts": [
    {
      "path": "src/shared/components/Modal/Modal.tsx",
      "batchIndex": 11,
      "symbols": [
        "Modal"
      ]
    }
  ],
  "src/shared/components/MonsterCard/style.ts": [
    {
      "path": "src/shared/components/MonsterCard/MonsterCard.tsx",
      "batchIndex": 2,
      "symbols": [
        "MonsterCard"
      ]
    }
  ],
  "src/shared/components/RollResultModal/style.ts": [
    {
      "path": "src/shared/components/RollResultModal/RollResultModal.tsx",
      "batchIndex": 11,
      "symbols": [
        "RollResultModal"
      ]
    }
  ],
  "src/shared/styles/statusTones.ts": [
    {
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": [
        "useCharacterActions"
      ]
    }
  ],
  "src/shared/styles/theme.ts": [
    {
      "path": "src/modules/Header/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/Bestiary/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/Character/components/QuickActionBar.test.tsx",
      "batchIndex": 7,
      "symbols": []
    },
    {
      "path": "src/screens/Character/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/CreateCharacter/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
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
      "path": "src/screens/DM/EncounterCalculator/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/DM/LootGenerator/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/DM/style.ts",
      "batchIndex": 3,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/Dice/styles.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/DiceRoller/styles.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
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
      "path": "src/screens/Initiative/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/LegalLicenses/LegalLicenses.tsx",
      "batchIndex": 7,
      "symbols": []
    },
    {
      "path": "src/screens/Monster/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/References/styles.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/Settings/styles.ts",
      "batchIndex": 10,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/Spellbook/styles.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
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
      "path": "src/shared/components/CharacterCard/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
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
      "path": "src/shared/components/CharacterOverview/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Skills/SkillItem/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
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
      "path": "src/shared/components/CharacterStats/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    }
  ],
  "src/shared/styles/tokens.ts": [
    {
      "path": "src/screens/DM/DMEncounterPrep.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/shared/components/CharacterMenu/CharacterMenu.tsx",
      "batchIndex": 9,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMCampaignNotes.tsx",
      "batchIndex": 1,
      "symbols": []
    },
    {
      "path": "src/screens/DM/DMQuickEdit.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/DM/style.ts",
      "batchIndex": 3,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/Monster/Monster.tsx",
      "batchIndex": 2,
      "symbols": [
        "Monster"
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
      "path": "src/shared/components/CharacterStats/Tabs/Combat/Combat.tsx",
      "batchIndex": 9,
      "symbols": []
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
      "path": "src/shared/components/CharacterStats/Tabs/Coins/Coins.tsx",
      "batchIndex": 9,
      "symbols": []
    },
    {
      "path": "src/shared/components/TextInput/MultiTextInput.tsx",
      "batchIndex": 11,
      "symbols": [
        "MultiTextInput"
      ]
    },
    {
      "path": "src/components/ShareCharacterSheetModal.tsx",
      "batchIndex": 9,
      "symbols": [
        "ShareCharacterSheetModal"
      ]
    },
    {
      "path": "src/screens/LegalLicenses/LegalLicenses.tsx",
      "batchIndex": 7,
      "symbols": []
    },
    {
      "path": "src/screens/Settings/styles.ts",
      "batchIndex": 10,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Weapons/Weapon.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/screens/Initiative/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/modules/Header/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/Bestiary/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/Character/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/CreateCharacter/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
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
      "path": "src/screens/DM/EncounterCalculator/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/DM/LootGenerator/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/Dice/styles.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/DiceRoller/styles.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
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
      "path": "src/screens/Monster/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/References/styles.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/Spellbook/styles.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/screens/Support/Support.tsx",
      "batchIndex": 2,
      "symbols": [
        "Support"
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
      "path": "src/shared/components/CharacterMenu/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/shared/components/CharacterOverview/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/shared/components/CharacterStats/Tabs/Skills/SkillItem/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/shared/components/CharacterStats/style.ts",
      "batchIndex": 7,
      "symbols": [
        "getStyles"
      ]
    },
    {
      "path": "src/shared/components/FirstLaunchModals/style.ts",
      "batchIndex": 14,
      "symbols": [
        "styles"
      ]
    },
    {
      "path": "src/shared/components/WhatsNewModal/style.ts",
      "batchIndex": 14,
      "symbols": [
        "styles"
      ]
    }
  ],
  "src/shared/styles/useDesignTokens.ts": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default"
      ]
    }
  ],
  "src/shared/ui/Button.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default"
      ]
    }
  ],
  "src/shared/ui/Card.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default"
      ]
    }
  ],
  "src/shared/ui/Chip.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default"
      ]
    }
  ],
  "src/shared/ui/Input.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default"
      ]
    }
  ],
  "src/shared/ui/Screen.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default"
      ]
    }
  ],
  "src/shared/ui/Text.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default"
      ]
    }
  ],
  "src/shared/ui/skeleton/index.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default"
      ]
    },
    {
      "path": "src/screens/Bestiary/Bestiary.tsx",
      "batchIndex": 2,
      "symbols": []
    },
    {
      "path": "src/screens/Character/Character.tsx",
      "batchIndex": 6,
      "symbols": [
        "Character"
      ]
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
    }
  ],
  "src/stores/uiStore.ts": [
    {
      "path": "src/services/storeEffects/uiStoreEffects.ts",
      "batchIndex": 7,
      "symbols": [
        "createUiStoreEffects"
      ]
    }
  ]
}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields — `path`, `language`, `sizeLines`, `fileCategory`):
1. `src/shared/components/EmptyPlaceholder.tsx` (35 lines, language: `typescript`, fileCategory: `code`)
2. `src/shared/components/ErrorBoundary/style.ts` (25 lines, language: `typescript`, fileCategory: `code`)
3. `src/shared/components/Modal/style.ts` (77 lines, language: `typescript`, fileCategory: `code`)
4. `src/shared/components/MonsterCard/style.ts` (150 lines, language: `typescript`, fileCategory: `code`)
5. `src/shared/components/RollResultModal/style.ts` (45 lines, language: `typescript`, fileCategory: `code`)
6. `src/shared/styles/statusTones.ts` (25 lines, language: `typescript`, fileCategory: `code`)
7. `src/shared/styles/theme.ts` (83 lines, language: `typescript`, fileCategory: `code`)
8. `src/shared/styles/tokens.test.ts` (33 lines, language: `typescript`, fileCategory: `code`)
9. `src/shared/styles/tokens.ts` (192 lines, language: `typescript`, fileCategory: `code`)
10. `src/shared/styles/useDesignTokens.ts` (15 lines, language: `typescript`, fileCategory: `code`)
11. `src/shared/ui/Button.tsx` (90 lines, language: `typescript`, fileCategory: `code`)
12. `src/shared/ui/Card.tsx` (49 lines, language: `typescript`, fileCategory: `code`)
13. `src/shared/ui/Chip.tsx` (72 lines, language: `typescript`, fileCategory: `code`)
14. `src/shared/ui/Input.tsx` (52 lines, language: `typescript`, fileCategory: `code`)
15. `src/shared/ui/Screen.tsx` (58 lines, language: `typescript`, fileCategory: `code`)
16. `src/shared/ui/Section.tsx` (50 lines, language: `typescript`, fileCategory: `code`)
17. `src/shared/ui/Text.tsx` (41 lines, language: `typescript`, fileCategory: `code`)
18. `src/shared/ui/skeleton/index.tsx` (293 lines, language: `typescript`, fileCategory: `code`)
19. `src/shared/ui/skeleton/skeleton.test.tsx` (92 lines, language: `typescript`, fileCategory: `code`)
20. `src/shared/ui/uiVariants.test.ts` (35 lines, language: `typescript`, fileCategory: `code`)
21. `src/shared/ui/variantResolvers.ts` (50 lines, language: `typescript`, fileCategory: `code`)
22. `src/stores/uiStore.ts` (44 lines, language: `typescript`, fileCategory: `code`)
23. `src/test/mocks/react-navigation-native.ts` (15 lines, language: `typescript`, fileCategory: `code`)
24. `src/types/CustomCoin.ts` (5 lines, language: `typescript`, fileCategory: `code`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").
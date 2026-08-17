Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 7/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-7.json` (single-file mode) OR `batch-7-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):

```json
{
  "src/modules/Header/style.ts": ["src/shared/styles/theme.ts", "src/shared/styles/tokens.ts"],
  "src/screens/Bestiary/style.ts": ["src/shared/styles/theme.ts", "src/shared/styles/tokens.ts"],
  "src/screens/Character/components/QuickActionBar.test.tsx": [
    "src/screens/Character/components/QuickActionBar.tsx",
    "src/shared/styles/theme.ts"
  ],
  "src/screens/Character/style.ts": ["src/shared/styles/theme.ts", "src/shared/styles/tokens.ts"],
  "src/screens/CreateCharacter/style.ts": ["src/shared/styles/theme.ts", "src/shared/styles/tokens.ts"],
  "src/screens/DM/DMSharedUpdates.style.ts": ["src/shared/styles/theme.ts", "src/shared/styles/tokens.ts"],
  "src/screens/DM/EncounterCalculator/style.ts": ["src/shared/styles/theme.ts", "src/shared/styles/tokens.ts"],
  "src/screens/DM/LootGenerator/LootGenerator.tsx": ["src/context/Theme-store.ts", "src/screens/DM/LootGenerator/style.ts"],
  "src/screens/DM/LootGenerator/style.ts": ["src/shared/styles/theme.ts", "src/shared/styles/tokens.ts"],
  "src/screens/Dice/styles.ts": ["src/shared/styles/theme.ts", "src/shared/styles/tokens.ts"],
  "src/screens/DiceRoller/styles.ts": ["src/shared/styles/theme.ts", "src/shared/styles/tokens.ts"],
  "src/screens/Home/styles.ts": ["src/shared/styles/theme.ts", "src/shared/styles/tokens.ts"],
  "src/screens/Initiative/style.ts": ["src/shared/styles/theme.ts", "src/shared/styles/tokens.ts"],
  "src/screens/LegalLicenses/LegalLicenses.tsx": [
    "src/context/Theme-store.ts",
    "src/shared/styles/theme.ts",
    "src/shared/styles/tokens.ts",
    "src/shared/ui/index.ts"
  ],
  "src/screens/Monster/style.ts": ["src/shared/styles/theme.ts", "src/shared/styles/tokens.ts"],
  "src/screens/References/styles.ts": ["src/shared/styles/theme.ts", "src/shared/styles/tokens.ts"],
  "src/screens/Spellbook/styles.ts": ["src/shared/styles/theme.ts", "src/shared/styles/tokens.ts"],
  "src/services/storeEffects/uiStoreEffects.ts": [
    "src/shared/services/telemetry/productTelemetry.ts",
    "src/shared/styles/theme.ts",
    "src/stores/uiStore.ts"
  ],
  "src/shared/components/CharacterCard/style.ts": ["src/shared/styles/theme.ts", "src/shared/styles/tokens.ts"],
  "src/shared/components/CharacterMenu/style.ts": ["src/shared/styles/theme.ts", "src/shared/styles/tokens.ts"],
  "src/shared/components/CharacterOverview/style.ts": ["src/shared/styles/theme.ts", "src/shared/styles/tokens.ts"],
  "src/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/style.ts": [
    "src/shared/styles/theme.ts",
    "src/shared/styles/tokens.ts"
  ],
  "src/shared/components/CharacterStats/Tabs/Skills/SkillItem/style.ts": ["src/shared/styles/theme.ts", "src/shared/styles/tokens.ts"],
  "src/shared/components/CharacterStats/style.ts": ["src/shared/styles/theme.ts", "src/shared/styles/tokens.ts"]
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):

```json
{
  "src/modules/Header/style.ts": [
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
      "path": "src/modules/Header/Header.tsx",
      "batchIndex": 2,
      "symbols": []
    }
  ],
  "src/screens/Bestiary/style.ts": [
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
      "path": "src/screens/Bestiary/Bestiary.tsx",
      "batchIndex": 2,
      "symbols": []
    }
  ],
  "src/screens/Character/components/QuickActionBar.test.tsx": [
    {
      "path": "src/screens/Character/components/QuickActionBar.tsx",
      "batchIndex": 6,
      "symbols": ["QuickActionBar"]
    },
    {
      "path": "src/shared/styles/theme.ts",
      "batchIndex": 8,
      "symbols": ["darkColors", "lightColors"]
    }
  ],
  "src/screens/Character/style.ts": [
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
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": ["useCharacterActions"]
    }
  ],
  "src/screens/CreateCharacter/style.ts": [
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
      "path": "src/screens/CreateCharacter/CreateCharacter.tsx",
      "batchIndex": 5,
      "symbols": []
    }
  ],
  "src/screens/DM/DMSharedUpdates.style.ts": [
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
      "path": "src/screens/DM/DMSharedUpdates.tsx",
      "batchIndex": 3,
      "symbols": []
    }
  ],
  "src/screens/DM/EncounterCalculator/style.ts": [
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
      "path": "src/screens/DM/EncounterCalculator/EncounterCalculator.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/screens/DM/LootGenerator/LootGenerator.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    },
    {
      "path": "src/navigation/DMNavigator.tsx",
      "batchIndex": 1,
      "symbols": ["DMNavigator"]
    }
  ],
  "src/screens/DM/LootGenerator/style.ts": [
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
  "src/screens/Dice/styles.ts": [
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
      "path": "src/screens/Dice/Dice.tsx",
      "batchIndex": 6,
      "symbols": []
    }
  ],
  "src/screens/DiceRoller/styles.ts": [
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
      "path": "src/screens/DiceRoller/DiceRoller.tsx",
      "batchIndex": 6,
      "symbols": ["DiceRollerPanel"]
    }
  ],
  "src/screens/Home/styles.ts": [
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
      "path": "src/screens/Home/Home.tsx",
      "batchIndex": 3,
      "symbols": []
    }
  ],
  "src/screens/Initiative/style.ts": [
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
      "path": "src/screens/Initiative/CampaignInitiativeBoard.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/Initiative/LocalInitiativeBoard.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/screens/LegalLicenses/LegalLicenses.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    },
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
      "path": "src/navigation/TabNavigator.tsx",
      "batchIndex": 2,
      "symbols": ["TabNavigator"]
    }
  ],
  "src/screens/Monster/style.ts": [
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
      "path": "src/screens/Monster/Monster.tsx",
      "batchIndex": 2,
      "symbols": ["Monster"]
    }
  ],
  "src/screens/References/styles.ts": [
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
      "path": "src/screens/References/References.tsx",
      "batchIndex": 10,
      "symbols": ["References"]
    }
  ],
  "src/screens/Spellbook/styles.ts": [
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
      "path": "src/screens/Spellbook/Spellbook.tsx",
      "batchIndex": 2,
      "symbols": []
    }
  ],
  "src/services/storeEffects/uiStoreEffects.ts": [
    {
      "path": "src/shared/services/telemetry/productTelemetry.ts",
      "batchIndex": 3,
      "symbols": ["setAnalyticsConsent", "isAnalyticsConsentEnabled", "trackProductEvent", "getProductEvents"]
    },
    {
      "path": "src/shared/styles/theme.ts",
      "batchIndex": 8,
      "symbols": ["darkColors", "lightColors"]
    },
    {
      "path": "src/stores/uiStore.ts",
      "batchIndex": 8,
      "symbols": []
    }
  ],
  "src/shared/components/CharacterCard/style.ts": [
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
      "path": "src/shared/components/CharacterCard/CharacterCard.tsx",
      "batchIndex": 9,
      "symbols": ["CharacterCard"]
    }
  ],
  "src/shared/components/CharacterMenu/style.ts": [
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
      "path": "src/shared/components/CharacterMenu/CharacterMenu.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/shared/components/CharacterOverview/style.ts": [
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
      "path": "src/shared/components/CharacterOverview/CharacterOverview.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ],
  "src/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/style.ts": [
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
      "path": "src/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/AttributesItem.tsx",
      "batchIndex": 9,
      "symbols": ["AttributesItem"]
    }
  ],
  "src/shared/components/CharacterStats/Tabs/Skills/SkillItem/style.ts": [
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
      "path": "src/shared/components/CharacterStats/Tabs/Skills/SkillItem/SkillItem.tsx",
      "batchIndex": 11,
      "symbols": ["SkillItem"]
    }
  ],
  "src/shared/components/CharacterStats/style.ts": [
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
      "path": "src/shared/components/CharacterStats/CharacterStats.tsx",
      "batchIndex": 9,
      "symbols": []
    }
  ]
}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields — `path`, `language`, `sizeLines`, `fileCategory`):

1. `src/modules/Header/style.ts` (50 lines, language: `typescript`, fileCategory: `code`)
2. `src/screens/Bestiary/style.ts` (244 lines, language: `typescript`, fileCategory: `code`)
3. `src/screens/Character/components/QuickActionBar.test.tsx` (73 lines, language: `typescript`, fileCategory: `code`)
4. `src/screens/Character/style.ts` (975 lines, language: `typescript`, fileCategory: `code`)
5. `src/screens/CreateCharacter/style.ts` (397 lines, language: `typescript`, fileCategory: `code`)
6. `src/screens/DM/DMSharedUpdates.style.ts` (130 lines, language: `typescript`, fileCategory: `code`)
7. `src/screens/DM/EncounterCalculator/style.ts` (28 lines, language: `typescript`, fileCategory: `code`)
8. `src/screens/DM/LootGenerator/LootGenerator.tsx` (19 lines, language: `typescript`, fileCategory: `code`)
9. `src/screens/DM/LootGenerator/style.ts` (11 lines, language: `typescript`, fileCategory: `code`)
10. `src/screens/Dice/styles.ts` (108 lines, language: `typescript`, fileCategory: `code`)
11. `src/screens/DiceRoller/styles.ts` (307 lines, language: `typescript`, fileCategory: `code`)
12. `src/screens/Home/styles.ts` (322 lines, language: `typescript`, fileCategory: `code`)
13. `src/screens/Initiative/style.ts` (72 lines, language: `typescript`, fileCategory: `code`)
14. `src/screens/LegalLicenses/LegalLicenses.tsx` (122 lines, language: `typescript`, fileCategory: `code`)
15. `src/screens/Monster/style.ts` (136 lines, language: `typescript`, fileCategory: `code`)
16. `src/screens/References/styles.ts` (101 lines, language: `typescript`, fileCategory: `code`)
17. `src/screens/Spellbook/styles.ts` (408 lines, language: `typescript`, fileCategory: `code`)
18. `src/services/storeEffects/uiStoreEffects.ts` (120 lines, language: `typescript`, fileCategory: `code`)
19. `src/shared/components/CharacterCard/style.ts` (45 lines, language: `typescript`, fileCategory: `code`)
20. `src/shared/components/CharacterMenu/style.ts` (34 lines, language: `typescript`, fileCategory: `code`)
21. `src/shared/components/CharacterOverview/style.ts` (18 lines, language: `typescript`, fileCategory: `code`)
22. `src/shared/components/CharacterStats/Tabs/Attributes/AttributeItem/style.ts` (27 lines, language: `typescript`, fileCategory: `code`)
23. `src/shared/components/CharacterStats/Tabs/Skills/SkillItem/style.ts` (26 lines, language: `typescript`, fileCategory: `code`)
24. `src/shared/components/CharacterStats/style.ts` (17 lines, language: `typescript`, fileCategory: `code`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").

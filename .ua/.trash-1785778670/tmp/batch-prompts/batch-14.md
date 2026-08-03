Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 14/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-14.json` (single-file mode) OR `batch-14-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):
```json
{
  "App.tsx": [
    "src/context/Theme-store.ts",
    "src/i18n/index.ts",
    "src/navigation/AppNavigator.tsx",
    "src/shared/components/ErrorBoundary/ErrorBoundary.tsx",
    "src/shared/components/FirstLaunchModals/FirstLaunchModals.tsx",
    "src/shared/components/WhatsNewModal/WhatsNewModal.tsx",
    "src/shared/services/auth/auth.tsx",
    "src/shared/services/telemetry/startupTrace.ts"
  ],
  "index.js": [
    "App.tsx",
    "src/data/srd/index.ts",
    "src/domain/srd/localization.ts",
    "src/domain/srd/srdRepository.ts",
    "src/shared/services/telemetry/startupTrace.ts"
  ],
  "src/data/srd/index.ts": [
    "src/data/srd/abilities.json",
    "src/data/srd/backgrounds.json",
    "src/data/srd/classProgression.json",
    "src/data/srd/classes.json",
    "src/data/srd/conditions.json",
    "src/data/srd/equipment.json",
    "src/data/srd/languages.json",
    "src/data/srd/metadata.ts",
    "src/data/srd/monsters.json",
    "src/data/srd/races.json",
    "src/data/srd/references.json",
    "src/data/srd/skills.json",
    "src/data/srd/spells.json"
  ],
  "src/data/srd/metadata.ts": [],
  "src/repositories/firstLaunchRepository.ts": [],
  "src/repositories/whatsNewRepository.ts": [],
  "src/shared/components/ErrorBoundary/ErrorBoundary.test.tsx": [
    "src/shared/components/ErrorBoundary/ErrorBoundary.tsx"
  ],
  "src/shared/components/ErrorBoundary/ErrorBoundary.tsx": [
    "src/context/Theme-store.ts",
    "src/i18n/index.ts",
    "src/shared/components/ErrorBoundary/style.ts",
    "src/shared/services/telemetry/productTelemetry.ts",
    "src/shared/ui/index.ts"
  ],
  "src/shared/components/FirstLaunchModals/FirstLaunchModals.tsx": [
    "src/context/Theme-store.ts",
    "src/repositories/firstLaunchRepository.ts",
    "src/shared/components/FirstLaunchModals/style.ts",
    "src/shared/components/Modal/Modal.tsx",
    "src/shared/ui/index.ts"
  ],
  "src/shared/components/FirstLaunchModals/style.ts": [
    "src/shared/styles/tokens.ts"
  ],
  "src/shared/components/WhatsNewModal/WhatsNewModal.tsx": [
    "src/repositories/whatsNewRepository.ts",
    "src/shared/components/Modal/Modal.tsx",
    "src/shared/components/WhatsNewModal/style.ts",
    "src/shared/ui/index.ts"
  ],
  "src/shared/components/WhatsNewModal/style.ts": [
    "src/shared/styles/tokens.ts"
  ],
  "src/shared/services/auth/auth.tsx": [],
  "src/shared/services/telemetry/startupTrace.test.ts": [
    "src/shared/services/telemetry/startupTrace.ts"
  ],
  "src/shared/services/telemetry/startupTrace.ts": [],
  "src/shared/ui/index.ts": []
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):
```json
{
  "App.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default"
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
      "path": "src/navigation/AppNavigator.tsx",
      "batchIndex": 2,
      "symbols": [
        "AppNavigator"
      ]
    }
  ],
  "index.js": [
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
    }
  ],
  "src/data/srd/index.ts": [
    {
      "path": "src/data/srd/abilities.json",
      "batchIndex": 24,
      "symbols": []
    },
    {
      "path": "src/data/srd/backgrounds.json",
      "batchIndex": 24,
      "symbols": []
    },
    {
      "path": "src/data/srd/classProgression.json",
      "batchIndex": 24,
      "symbols": []
    },
    {
      "path": "src/data/srd/classes.json",
      "batchIndex": 24,
      "symbols": []
    },
    {
      "path": "src/data/srd/conditions.json",
      "batchIndex": 24,
      "symbols": []
    },
    {
      "path": "src/data/srd/equipment.json",
      "batchIndex": 24,
      "symbols": []
    },
    {
      "path": "src/data/srd/languages.json",
      "batchIndex": 24,
      "symbols": []
    },
    {
      "path": "src/data/srd/monsters.json",
      "batchIndex": 24,
      "symbols": []
    },
    {
      "path": "src/data/srd/races.json",
      "batchIndex": 24,
      "symbols": []
    },
    {
      "path": "src/data/srd/references.json",
      "batchIndex": 24,
      "symbols": []
    },
    {
      "path": "src/data/srd/skills.json",
      "batchIndex": 24,
      "symbols": []
    },
    {
      "path": "src/data/srd/spells.json",
      "batchIndex": 24,
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
    }
  ],
  "src/shared/components/ErrorBoundary/ErrorBoundary.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default"
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
      "path": "src/shared/components/ErrorBoundary/style.ts",
      "batchIndex": 8,
      "symbols": [
        "getStyles"
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
    }
  ],
  "src/shared/components/FirstLaunchModals/FirstLaunchModals.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": [
        "default"
      ]
    },
    {
      "path": "src/shared/components/Modal/Modal.tsx",
      "batchIndex": 11,
      "symbols": [
        "Modal"
      ]
    }
  ],
  "src/shared/components/FirstLaunchModals/style.ts": [
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
  "src/shared/components/WhatsNewModal/WhatsNewModal.tsx": [
    {
      "path": "src/shared/components/Modal/Modal.tsx",
      "batchIndex": 11,
      "symbols": [
        "Modal"
      ]
    }
  ],
  "src/shared/components/WhatsNewModal/style.ts": [
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
  "src/shared/services/auth/auth.tsx": [
    {
      "path": "src/modules/Header/Header.tsx",
      "batchIndex": 2,
      "symbols": []
    }
  ],
  "src/shared/ui/index.ts": [
    {
      "path": "src/modules/Header/Header.tsx",
      "batchIndex": 2,
      "symbols": []
    },
    {
      "path": "src/screens/LegalLicenses/LegalLicenses.tsx",
      "batchIndex": 7,
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
      "path": "src/shared/components/TextInput/TextInput.tsx",
      "batchIndex": 11,
      "symbols": []
    }
  ]
}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields — `path`, `language`, `sizeLines`, `fileCategory`):
1. `App.tsx` (110 lines, language: `typescript`, fileCategory: `code`)
2. `index.js` (39 lines, language: `javascript`, fileCategory: `code`)
3. `src/data/srd/index.ts` (45 lines, language: `typescript`, fileCategory: `code`)
4. `src/data/srd/metadata.ts` (8 lines, language: `typescript`, fileCategory: `code`)
5. `src/repositories/firstLaunchRepository.ts` (19 lines, language: `typescript`, fileCategory: `code`)
6. `src/repositories/whatsNewRepository.ts` (19 lines, language: `typescript`, fileCategory: `code`)
7. `src/shared/components/ErrorBoundary/ErrorBoundary.test.tsx` (118 lines, language: `typescript`, fileCategory: `code`)
8. `src/shared/components/ErrorBoundary/ErrorBoundary.tsx` (83 lines, language: `typescript`, fileCategory: `code`)
9. `src/shared/components/FirstLaunchModals/FirstLaunchModals.tsx` (88 lines, language: `typescript`, fileCategory: `code`)
10. `src/shared/components/FirstLaunchModals/style.ts` (18 lines, language: `typescript`, fileCategory: `code`)
11. `src/shared/components/WhatsNewModal/WhatsNewModal.tsx` (68 lines, language: `typescript`, fileCategory: `code`)
12. `src/shared/components/WhatsNewModal/style.ts` (14 lines, language: `typescript`, fileCategory: `code`)
13. `src/shared/services/auth/auth.tsx` (29 lines, language: `typescript`, fileCategory: `code`)
14. `src/shared/services/telemetry/startupTrace.test.ts` (141 lines, language: `typescript`, fileCategory: `code`)
15. `src/shared/services/telemetry/startupTrace.ts` (77 lines, language: `typescript`, fileCategory: `code`)
16. `src/shared/ui/index.ts` (34 lines, language: `typescript`, fileCategory: `code`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").
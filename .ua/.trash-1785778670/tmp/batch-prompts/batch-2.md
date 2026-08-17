Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 2/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-2.json` (single-file mode) OR `batch-2-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):

```json
{
  "src/context/Monster-store.ts": [],
  "src/dm/repositories/monsterRepository.ts": ["src/domain/migrations/index.ts", "src/types/Monster.ts"],
  "src/domain/spellbook/characterSpellAdapter.test.ts": ["src/domain/spellbook/index.ts", "src/shared/helpers/createEmptyCharacter.ts"],
  "src/domain/spellbook/index.ts": [],
  "src/domain/spellbook/spellRepository.test.ts": ["src/domain/migrations/index.ts", "src/domain/spellbook/index.ts"],
  "src/domain/srd/localization.ts": [
    "src/data/locales/uk/monsters.json",
    "src/data/locales/uk/spells.json",
    "src/data/srd/index.ts",
    "src/types/Monster.ts",
    "src/types/Spellbook.ts"
  ],
  "src/modules/Header/Header.tsx": [
    "src/context/Theme-store.ts",
    "src/modules/Header/style.ts",
    "src/navigation/AppNavigator.tsx",
    "src/navigation/TabNavigator.tsx",
    "src/shared/services/auth/auth.tsx",
    "src/shared/ui/index.ts"
  ],
  "src/navigation/AppNavigator.tsx": [
    "src/context/Theme-store.ts",
    "src/modules/Header/Header.tsx",
    "src/navigation/DMNavigator.tsx",
    "src/navigation/ReferencesNavigator.tsx",
    "src/navigation/TabNavigator.tsx",
    "src/screens/Initiative/Initiative.tsx",
    "src/screens/Support/Support.tsx",
    "src/shared/styles/tokens.ts"
  ],
  "src/navigation/ReferencesNavigator.tsx": [
    "src/modules/Header/Header.tsx",
    "src/navigation/sharedTypes.ts",
    "src/screens/Bestiary/Bestiary.tsx",
    "src/screens/Monster/Monster.tsx",
    "src/screens/References/References.tsx",
    "src/screens/Spellbook/Spellbook.tsx",
    "src/types/Monster.ts"
  ],
  "src/navigation/TabNavigator.tsx": [
    "src/modules/Header/Header.tsx",
    "src/navigation/sharedTypes.ts",
    "src/screens/Character/Character.tsx",
    "src/screens/CreateCharacter/CreateCharacter.tsx",
    "src/screens/Dice/Dice.tsx",
    "src/screens/DiceRoller/DiceRoller.tsx",
    "src/screens/Home/Home.tsx",
    "src/screens/LegalLicenses/LegalLicenses.tsx",
    "src/screens/Settings/Settings.tsx",
    "src/screens/Spellbook/Spellbook.tsx",
    "src/types/Character.ts"
  ],
  "src/navigation/sharedTypes.ts": [],
  "src/screens/Bestiary/Bestiary.test.tsx": ["src/dm/domain/types/index.ts", "src/screens/Bestiary/Bestiary.tsx", "src/types/Monster.ts"],
  "src/screens/Bestiary/Bestiary.tsx": [
    "src/context/Monster-store.ts",
    "src/context/Theme-store.ts",
    "src/dm/domain/types/index.ts",
    "src/dm/repositories/campaignRepository.ts",
    "src/domain/srd/localization.ts",
    "src/navigation/ReferencesNavigator.tsx",
    "src/screens/Bestiary/bestiaryFilters.ts",
    "src/screens/Bestiary/style.ts",
    "src/shared/components/MonsterCard/MonsterCard.tsx",
    "src/shared/helpers/sourcePresentation.ts",
    "src/shared/services/fileSerice.ts",
    "src/shared/ui/skeleton/index.tsx",
    "src/types/Monster.ts"
  ],
  "src/screens/Bestiary/bestiaryFilters.test.ts": [
    "src/domain/srd/adapters.ts",
    "src/domain/srd/srdRepository.ts",
    "src/screens/Bestiary/bestiaryFilters.ts",
    "src/types/Monster.ts"
  ],
  "src/screens/Bestiary/bestiaryFilters.ts": ["src/domain/srd/localization.ts", "src/types/Monster.ts"],
  "src/screens/Monster/Monster.test.tsx": ["src/screens/Monster/Monster.tsx", "src/types/Monster.ts"],
  "src/screens/Monster/Monster.tsx": [
    "src/context/Monster-store.ts",
    "src/context/Theme-store.ts",
    "src/domain/srd/localization.ts",
    "src/navigation/ReferencesNavigator.tsx",
    "src/screens/Monster/style.ts",
    "src/shared/components/TextInput/TextInput.tsx",
    "src/shared/helpers/sourcePresentation.ts",
    "src/shared/services/fileSerice.ts",
    "src/shared/styles/tokens.ts",
    "src/types/Monster.ts"
  ],
  "src/screens/Spellbook/Spellbook.tsx": [
    "src/context/Character-store.ts",
    "src/context/Spellbook-store.ts",
    "src/context/Theme-store.ts",
    "src/dm/domain/types/index.ts",
    "src/dm/repositories/campaignRepository.ts",
    "src/domain/schemas/index.ts",
    "src/domain/spellbook/index.ts",
    "src/domain/srd/localization.ts",
    "src/navigation/sharedTypes.ts",
    "src/screens/Spellbook/spellbookFilters.ts",
    "src/screens/Spellbook/styles.ts",
    "src/shared/components/Modal/Modal.tsx",
    "src/shared/helpers/sourcePresentation.ts",
    "src/shared/ui/skeleton/index.tsx",
    "src/types/Character.ts",
    "src/types/Spellbook.ts"
  ],
  "src/screens/Spellbook/spellbookFilters.test.ts": [
    "src/screens/Spellbook/spellbookFilters.ts",
    "src/shared/helpers/createEmptyCharacter.ts",
    "src/types/Spellbook.ts"
  ],
  "src/screens/Spellbook/spellbookFilters.ts": [
    "src/domain/spellbook/index.ts",
    "src/domain/srd/localization.ts",
    "src/types/Character.ts",
    "src/types/Spellbook.ts"
  ],
  "src/screens/Support/Support.tsx": ["src/context/Theme-store.ts", "src/shared/styles/tokens.ts"],
  "src/services/storeEffects/spellbookStoreEffects.ts": ["src/domain/spellbook/index.ts", "src/stores/spellbookStore.ts"],
  "src/shared/components/MonsterCard/MonsterCard.tsx": [
    "src/context/Monster-store.ts",
    "src/context/Theme-store.ts",
    "src/domain/srd/localization.ts",
    "src/navigation/ReferencesNavigator.tsx",
    "src/shared/components/MonsterCard/style.ts",
    "src/shared/helpers/sourcePresentation.ts",
    "src/types/Monster.ts"
  ],
  "src/shared/const/SpellbookSeed.ts": ["src/types/Spellbook.ts"],
  "src/shared/helpers/sourcePresentation.test.ts": ["src/shared/helpers/sourcePresentation.ts"],
  "src/shared/helpers/sourcePresentation.ts": [],
  "src/shared/services/fileSerice.ts": [
    "src/context/Character-store.ts",
    "src/domain/mappers/index.ts",
    "src/domain/types/index.ts",
    "src/types/Monster.ts"
  ],
  "src/stores/monsterStore.ts": ["src/dm/repositories/monsterRepository.ts", "src/types/Monster.ts"],
  "src/stores/spellbookStore.ts": ["src/domain/types/index.ts", "src/services/storeEffects/spellbookStoreEffects.ts"],
  "src/types/Monster.ts": ["src/domain/types/sourceMetadata.ts"],
  "src/types/Spellbook.ts": []
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):

```json
{
  "src/context/Monster-store.ts": [
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
      "path": "src/screens/DM/DMEncounterPrep.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/DM/EncounterCalculator/EncounterCalculator.tsx",
      "batchIndex": 9,
      "symbols": []
    },
    {
      "path": "src/screens/Settings/Settings.tsx",
      "batchIndex": 10,
      "symbols": []
    }
  ],
  "src/dm/repositories/monsterRepository.ts": [
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
      "path": "src/dm/repositories/storageRepositories.test.ts",
      "batchIndex": 15,
      "symbols": []
    }
  ],
  "src/domain/spellbook/characterSpellAdapter.test.ts": [
    {
      "path": "src/shared/helpers/createEmptyCharacter.ts",
      "batchIndex": 5,
      "symbols": ["createEmptyCharacter"]
    }
  ],
  "src/domain/spellbook/index.ts": [
    {
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": ["useCharacterActions"]
    }
  ],
  "src/domain/spellbook/spellRepository.test.ts": [
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
  "src/domain/srd/localization.ts": [
    {
      "path": "src/data/locales/uk/monsters.json",
      "batchIndex": 30,
      "symbols": []
    },
    {
      "path": "src/data/locales/uk/spells.json",
      "batchIndex": 30,
      "symbols": []
    },
    {
      "path": "src/data/srd/index.ts",
      "batchIndex": 14,
      "symbols": [
        "loadAbilitiesJson",
        "loadBackgroundsJson",
        "loadClassesJson",
        "loadClassProgressionJson",
        "loadConditionsJson",
        "loadEquipmentJson",
        "loadLanguagesJson",
        "loadMonstersJson",
        "loadRacesJson",
        "loadReferencesJson",
        "loadSkillsJson",
        "loadSpellsJson",
        "SRD_METADATA"
      ]
    },
    {
      "path": "index.js",
      "batchIndex": 14,
      "symbols": []
    },
    {
      "path": "src/domain/srd/localization.test.ts",
      "batchIndex": 12,
      "symbols": []
    },
    {
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": ["useCharacterActions"]
    },
    {
      "path": "src/screens/DM/DMEncounterPrep.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/DM/EncounterCalculator/EncounterCalculator.tsx",
      "batchIndex": 9,
      "symbols": []
    },
    {
      "path": "src/screens/DM/PinnedReferencesList.tsx",
      "batchIndex": 3,
      "symbols": ["PinnedReferencesList"]
    }
  ],
  "src/modules/Header/Header.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    },
    {
      "path": "src/modules/Header/style.ts",
      "batchIndex": 7,
      "symbols": ["getStyles"]
    },
    {
      "path": "src/shared/services/auth/auth.tsx",
      "batchIndex": 14,
      "symbols": ["AuthProvider", "useAuth"]
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
      "path": "src/navigation/DMNavigator.tsx",
      "batchIndex": 1,
      "symbols": ["DMNavigator"]
    }
  ],
  "src/navigation/AppNavigator.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    },
    {
      "path": "src/navigation/DMNavigator.tsx",
      "batchIndex": 1,
      "symbols": ["DMNavigator"]
    },
    {
      "path": "src/screens/Initiative/Initiative.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/shared/styles/tokens.ts",
      "batchIndex": 8,
      "symbols": ["space", "radius", "fontSize", "typography", "designTokens", "sp", "rd", "fs"]
    },
    {
      "path": "App.tsx",
      "batchIndex": 14,
      "symbols": ["App"]
    }
  ],
  "src/navigation/ReferencesNavigator.tsx": [
    {
      "path": "src/screens/References/References.tsx",
      "batchIndex": 10,
      "symbols": ["References"]
    }
  ],
  "src/navigation/TabNavigator.tsx": [
    {
      "path": "src/screens/Character/Character.tsx",
      "batchIndex": 6,
      "symbols": ["Character"]
    },
    {
      "path": "src/screens/CreateCharacter/CreateCharacter.tsx",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/screens/Dice/Dice.tsx",
      "batchIndex": 6,
      "symbols": []
    },
    {
      "path": "src/screens/DiceRoller/DiceRoller.tsx",
      "batchIndex": 6,
      "symbols": ["DiceRollerPanel"]
    },
    {
      "path": "src/screens/Home/Home.tsx",
      "batchIndex": 3,
      "symbols": []
    },
    {
      "path": "src/screens/LegalLicenses/LegalLicenses.tsx",
      "batchIndex": 7,
      "symbols": []
    },
    {
      "path": "src/screens/Settings/Settings.tsx",
      "batchIndex": 10,
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
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": ["useCharacterActions"]
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
  "src/screens/Bestiary/Bestiary.test.tsx": [
    {
      "path": "src/dm/domain/types/index.ts",
      "batchIndex": 1,
      "symbols": []
    }
  ],
  "src/screens/Bestiary/Bestiary.tsx": [
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
      "path": "src/screens/Bestiary/style.ts",
      "batchIndex": 7,
      "symbols": ["getStyles"]
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
    }
  ],
  "src/screens/Bestiary/bestiaryFilters.test.ts": [
    {
      "path": "src/domain/srd/adapters.ts",
      "batchIndex": 12,
      "symbols": ["srdSpellToSpellbookSpell", "srdMonsterToMonsterDto"]
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
  "src/screens/Monster/Monster.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    },
    {
      "path": "src/screens/Monster/style.ts",
      "batchIndex": 7,
      "symbols": ["getStyles"]
    },
    {
      "path": "src/shared/components/TextInput/TextInput.tsx",
      "batchIndex": 11,
      "symbols": []
    },
    {
      "path": "src/shared/styles/tokens.ts",
      "batchIndex": 8,
      "symbols": ["space", "radius", "fontSize", "typography", "designTokens", "sp", "rd", "fs"]
    }
  ],
  "src/screens/Spellbook/Spellbook.tsx": [
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
      "path": "src/screens/Spellbook/styles.ts",
      "batchIndex": 7,
      "symbols": ["getStyles"]
    },
    {
      "path": "src/shared/components/Modal/Modal.tsx",
      "batchIndex": 11,
      "symbols": ["Modal"]
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
    }
  ],
  "src/screens/Spellbook/spellbookFilters.test.ts": [
    {
      "path": "src/shared/helpers/createEmptyCharacter.ts",
      "batchIndex": 5,
      "symbols": ["createEmptyCharacter"]
    }
  ],
  "src/screens/Spellbook/spellbookFilters.ts": [
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
  "src/screens/Support/Support.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    },
    {
      "path": "src/shared/styles/tokens.ts",
      "batchIndex": 8,
      "symbols": ["space", "radius", "fontSize", "typography", "designTokens", "sp", "rd", "fs"]
    }
  ],
  "src/shared/components/MonsterCard/MonsterCard.tsx": [
    {
      "path": "src/context/Theme-store.ts",
      "batchIndex": 9,
      "symbols": ["default"]
    },
    {
      "path": "src/shared/components/MonsterCard/style.ts",
      "batchIndex": 8,
      "symbols": ["getStyles"]
    }
  ],
  "src/shared/helpers/sourcePresentation.ts": [
    {
      "path": "src/screens/Character/components/CharacterSourceBadge.tsx",
      "batchIndex": 9,
      "symbols": ["getCharacterSourceBadgeLabel", "CharacterSourceBadge"]
    },
    {
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": ["useCharacterActions"]
    }
  ],
  "src/shared/services/fileSerice.ts": [
    {
      "path": "src/context/Character-store.ts",
      "batchIndex": 9,
      "symbols": ["default", "selectActiveCharacter", "selectCharacterStoreActions", "selectCharacterStoreBasics"]
    },
    {
      "path": "src/domain/mappers/index.ts",
      "batchIndex": 12,
      "symbols": ["characterMapper", "homebrewMapper", "spellMapper"]
    },
    {
      "path": "src/domain/types/index.ts",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/screens/CreateCharacter/CreateCharacter.tsx",
      "batchIndex": 5,
      "symbols": []
    },
    {
      "path": "src/screens/Settings/Settings.tsx",
      "batchIndex": 10,
      "symbols": []
    }
  ],
  "src/stores/spellbookStore.ts": [
    {
      "path": "src/domain/types/index.ts",
      "batchIndex": 5,
      "symbols": []
    }
  ],
  "src/types/Monster.ts": [
    {
      "path": "src/domain/types/sourceMetadata.ts",
      "batchIndex": 12,
      "symbols": []
    },
    {
      "path": "src/domain/srd/adapters.ts",
      "batchIndex": 12,
      "symbols": ["srdSpellToSpellbookSpell", "srdMonsterToMonsterDto"]
    },
    {
      "path": "src/screens/DM/PinnedReferencesList.tsx",
      "batchIndex": 3,
      "symbols": ["PinnedReferencesList"]
    },
    {
      "path": "src/services/storeEffects/dmStoreEffects.ts",
      "batchIndex": 12,
      "symbols": ["createDmStoreEffects"]
    },
    {
      "path": "src/stores/dmStore.ts",
      "batchIndex": 12,
      "symbols": []
    }
  ],
  "src/types/Spellbook.ts": [
    {
      "path": "src/screens/Character/hooks/useCharacterActions.tsx",
      "batchIndex": 6,
      "symbols": ["useCharacterActions"]
    },
    {
      "path": "src/screens/DM/PinnedReferencesList.tsx",
      "batchIndex": 3,
      "symbols": ["PinnedReferencesList"]
    }
  ]
}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields — `path`, `language`, `sizeLines`, `fileCategory`):

1. `src/context/Monster-store.ts` (1 lines, language: `typescript`, fileCategory: `code`)
2. `src/dm/repositories/monsterRepository.ts` (57 lines, language: `typescript`, fileCategory: `code`)
3. `src/domain/spellbook/characterSpellAdapter.test.ts` (101 lines, language: `typescript`, fileCategory: `code`)
4. `src/domain/spellbook/index.ts` (5 lines, language: `typescript`, fileCategory: `code`)
5. `src/domain/spellbook/spellRepository.test.ts` (206 lines, language: `typescript`, fileCategory: `code`)
6. `src/domain/srd/localization.ts` (213 lines, language: `typescript`, fileCategory: `code`)
7. `src/modules/Header/Header.tsx` (79 lines, language: `typescript`, fileCategory: `code`)
8. `src/navigation/AppNavigator.tsx` (116 lines, language: `typescript`, fileCategory: `code`)
9. `src/navigation/ReferencesNavigator.tsx` (42 lines, language: `typescript`, fileCategory: `code`)
10. `src/navigation/TabNavigator.tsx` (59 lines, language: `typescript`, fileCategory: `code`)
11. `src/navigation/sharedTypes.ts` (12 lines, language: `typescript`, fileCategory: `code`)
12. `src/screens/Bestiary/Bestiary.test.tsx` (365 lines, language: `typescript`, fileCategory: `code`)
13. `src/screens/Bestiary/Bestiary.tsx` (439 lines, language: `typescript`, fileCategory: `code`)
14. `src/screens/Bestiary/bestiaryFilters.test.ts` (74 lines, language: `typescript`, fileCategory: `code`)
15. `src/screens/Bestiary/bestiaryFilters.ts` (109 lines, language: `typescript`, fileCategory: `code`)
16. `src/screens/Monster/Monster.test.tsx` (139 lines, language: `typescript`, fileCategory: `code`)
17. `src/screens/Monster/Monster.tsx` (506 lines, language: `typescript`, fileCategory: `code`)
18. `src/screens/Spellbook/Spellbook.tsx` (1076 lines, language: `typescript`, fileCategory: `code`)
19. `src/screens/Spellbook/spellbookFilters.test.ts` (90 lines, language: `typescript`, fileCategory: `code`)
20. `src/screens/Spellbook/spellbookFilters.ts` (89 lines, language: `typescript`, fileCategory: `code`)
21. `src/screens/Support/Support.tsx` (97 lines, language: `typescript`, fileCategory: `code`)
22. `src/services/storeEffects/spellbookStoreEffects.ts` (133 lines, language: `typescript`, fileCategory: `code`)
23. `src/shared/components/MonsterCard/MonsterCard.tsx` (215 lines, language: `typescript`, fileCategory: `code`)
24. `src/shared/const/SpellbookSeed.ts` (699 lines, language: `typescript`, fileCategory: `code`)
25. `src/shared/helpers/sourcePresentation.test.ts` (19 lines, language: `typescript`, fileCategory: `code`)
26. `src/shared/helpers/sourcePresentation.ts` (7 lines, language: `typescript`, fileCategory: `code`)
27. `src/shared/services/fileSerice.ts` (186 lines, language: `typescript`, fileCategory: `code`)
28. `src/stores/monsterStore.ts` (120 lines, language: `typescript`, fileCategory: `code`)
29. `src/stores/spellbookStore.ts` (39 lines, language: `typescript`, fileCategory: `code`)
30. `src/types/Monster.ts` (55 lines, language: `typescript`, fileCategory: `code`)
31. `src/types/Spellbook.ts` (9 lines, language: `typescript`, fileCategory: `code`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").

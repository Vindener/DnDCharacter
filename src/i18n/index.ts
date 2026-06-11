import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { AppLanguage } from './languageStorage';
import { getSavedLanguage, isSupportedLanguage, saveLanguage } from './languageStorage';
export type { AppLanguage } from './languageStorage';
export { SUPPORTED_LANGUAGES } from './languageStorage';

import ukCommon from './locales/uk/common.json';
import ukNavigation from './locales/uk/navigation.json';
import ukHome from './locales/uk/home.json';
import ukCharacter from './locales/uk/character.json';
import ukCreateCharacter from './locales/uk/createCharacter.json';
import ukDice from './locales/uk/dice.json';
import ukSpellbook from './locales/uk/spellbook.json';
import ukBestiary from './locales/uk/bestiary.json';
import ukDm from './locales/uk/dm.json';
import ukSettings from './locales/uk/settings.json';
import ukSupport from './locales/uk/support.json';
import ukDnd from './locales/uk/dnd.json';
import ukReferences from './locales/uk/references.json';
import ukInitiative from './locales/uk/initiative.json';

import enCommon from './locales/en/common.json';
import enNavigation from './locales/en/navigation.json';
import enHome from './locales/en/home.json';
import enCharacter from './locales/en/character.json';
import enCreateCharacter from './locales/en/createCharacter.json';
import enDice from './locales/en/dice.json';
import enSpellbook from './locales/en/spellbook.json';
import enBestiary from './locales/en/bestiary.json';
import enDm from './locales/en/dm.json';
import enSettings from './locales/en/settings.json';
import enSupport from './locales/en/support.json';
import enDnd from './locales/en/dnd.json';
import enReferences from './locales/en/references.json';
import enInitiative from './locales/en/initiative.json';

export const resources = {
  uk: {
    common: ukCommon,
    navigation: ukNavigation,
    home: ukHome,
    character: ukCharacter,
    createCharacter: ukCreateCharacter,
    dice: ukDice,
    spellbook: ukSpellbook,
    bestiary: ukBestiary,
    dm: ukDm,
    settings: ukSettings,
    support: ukSupport,
    dnd: ukDnd,
    references: ukReferences,
    initiative: ukInitiative,
  },
  en: {
    common: enCommon,
    navigation: enNavigation,
    home: enHome,
    character: enCharacter,
    createCharacter: enCreateCharacter,
    dice: enDice,
    spellbook: enSpellbook,
    bestiary: enBestiary,
    dm: enDm,
    settings: enSettings,
    support: enSupport,
    dnd: enDnd,
    references: enReferences,
    initiative: enInitiative,
  },
} as const;

function getLanguageCodeFromLocale(locale: string | undefined): string | null {
  if (!locale) {
    return null;
  }

  return locale.split(/[-_]/)[0]?.toLowerCase() || null;
}

function getRuntimeLocaleCode(): string | null {
  try {
    return getLanguageCodeFromLocale(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch (_error) {
    return null;
  }
}

function getDeviceLanguage(): AppLanguage {
  const languageCode = getRuntimeLocaleCode();

  if (isSupportedLanguage(languageCode)) {
    return languageCode;
  }

  return 'en';
}

export async function getInitialLanguage(): Promise<AppLanguage> {
  const savedLanguage = await getSavedLanguage();

  if (savedLanguage) {
    return savedLanguage;
  }

  return getDeviceLanguage();
}

export async function initI18n(): Promise<void> {
  if (i18n.isInitialized) {
    return;
  }

  const language = await getInitialLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: [
      'common',
      'navigation',
      'home',
      'character',
      'createCharacter',
      'dice',
      'spellbook',
      'bestiary',
      'dm',
      'settings',
      'support',
      'dnd',
      'references',
      'initiative',
    ],
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });
}

export async function changeAppLanguage(language: AppLanguage): Promise<void> {
  await saveLanguage(language);
  await i18n.changeLanguage(language);
}

export function getCurrentLanguage(): AppLanguage {
  return i18n.language === 'uk' ? 'uk' : 'en';
}

export default i18n;

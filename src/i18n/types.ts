import type { resources } from './index';
import type { AppLanguage } from './languageStorage';

export type { AppLanguage };

export type AppResources = typeof resources;
export type AppNamespace = keyof AppResources['en'];

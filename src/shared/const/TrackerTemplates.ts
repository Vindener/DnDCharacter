import type { CharacterCustomResource } from '@/types/Character';

export type ResourceTemplate = {
  id: string;
  name: string;
  resource: Omit<CharacterCustomResource, 'id'>;
  source: 'system' | 'user';
};

export const SYSTEM_RESOURCE_TEMPLATES: ResourceTemplate[] = [
  {
    id: 'sys-arcane-charges',
    name: 'Arcane Charges',
    source: 'system',
    resource: { label: 'Arcane Charges', current: 3, max: 3, resetRule: 'long-rest' },
  },
  {
    id: 'sys-stamina',
    name: 'Stamina',
    source: 'system',
    resource: { label: 'Stamina', current: 4, max: 4, resetRule: 'short-rest' },
  },
  {
    id: 'sys-grit',
    name: 'Grit',
    source: 'system',
    resource: { label: 'Grit', current: 2, max: 2, resetRule: 'short-rest' },
  },
  {
    id: 'sys-session-clock',
    name: 'Session Clock',
    source: 'system',
    resource: { label: 'Session Clock', current: 0, max: 6, resetRule: 'session' },
  },
];

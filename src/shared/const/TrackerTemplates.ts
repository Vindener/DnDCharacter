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
    name: 'Арканні заряди',
    source: 'system',
    resource: { label: 'Арканні заряди', current: 3, max: 3, resetRule: 'long-rest' },
  },
  {
    id: 'sys-stamina',
    name: 'Витривалість',
    source: 'system',
    resource: { label: 'Витривалість', current: 4, max: 4, resetRule: 'short-rest' },
  },
  {
    id: 'sys-grit',
    name: 'Рішучість',
    source: 'system',
    resource: { label: 'Рішучість', current: 2, max: 2, resetRule: 'short-rest' },
  },
  {
    id: 'sys-session-clock',
    name: 'Лічильник сесії',
    source: 'system',
    resource: { label: 'Лічильник сесії', current: 0, max: 6, resetRule: 'session' },
  },
];

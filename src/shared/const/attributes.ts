import type { CharacterEntity } from '@/domain/types';

export type StatKey = keyof CharacterEntity['stats'];

interface Attribute {
  key: StatKey;
  label: string;
}

export const attributes: Attribute[] = [
  { key: 'strength', label: 'Сила' },
  { key: 'dexterity', label: 'Ловкість' },
  { key: 'constitution', label: 'Тілобудова' },
  { key: 'intelligence', label: 'Інтелект' },
  { key: 'wisdom', label: 'Мудрість' },
  { key: 'charisma', label: 'Харизма' },
];


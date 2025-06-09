import { CharacterDto } from '@/types/Character';

type StatKey = keyof CharacterDto['stats'];

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

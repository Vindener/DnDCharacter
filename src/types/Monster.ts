export interface MonsterDto {
  id: string;
  name: string;
  size?: string;
  type?: string;
  alignment?: string;
  challenge?: string;
  armorClass?: number;
  hitPoints?: number;
  speed?: string;
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  actions?: string;
  photoUri?: string;
  notes?: string;
}

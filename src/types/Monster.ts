export interface MonsterDto {
  id: string;
  name: string;
  size?: string;
  type?: string;
  alignment?: string;
  challenge?: string;
  environment?: string;
  source?: string;
  tags?: string[];
  armorClass?: number;
  hitPoints?: number;
  speed?: string;
  savingThrows?: string;
  skills?: string;
  senses?: string;
  languages?: string;
  traits?: string;
  reactions?: string;
  legendaryActions?: string;
  mainAttack?: string;
  attackBonus?: string;
  damage?: string;
  isCustom?: boolean;
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

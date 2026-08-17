export type AbilityKey = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

export interface FlexibleASI {
  count: number; // how many +1 picks
  exclude?: AbilityKey[]; // stats that cannot be chosen
  note?: string; // UI note
}

export interface RaceDefinition {
  name: string;
  speed: number;
  asi?: Partial<Record<AbilityKey, number>>; // Ability Score Increase
  flexible?: FlexibleASI; // e.g., Half-Elf +1/+1 to two different
  traits?: string[];
  description?: string; // long UA description (paraphrased)
  subraces?: Record<
    string,
    {
      asi?: Partial<Record<AbilityKey, number>>;
      flexible?: FlexibleASI;
      traits?: string[];
      description?: string;
    }
  >;
}

export const RACES: Record<string, RaceDefinition> = {
  human: {
    name: 'Людина',
    speed: 30,
    asi: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
    traits: ['Різнобічність'],
    description: 'Люди гнучкі та честолюбні. Їхня винахідливість і прагнення роблять їх майже універсальними.',
    subraces: {
      'Проста людина': {
        asi: {},
        flexible: { count: 2, note: '+1 до двох різних характеристик' },
        traits: ['Гнучкий талант'],
        description: 'Варіант людини обирає по +1 до двох різних характеристик, отримує додаткові вміння.',
      },
    },
  },
  elf: {
    name: 'Ельф',
    speed: 30,
    asi: { dexterity: 2 },
    traits: ['Темнозір', 'Чуття ельфів', 'Транс'],
    description: 'Ельфи — витончені та довговічні, їхні почуття загострені, а природа схильна до магії.',
    subraces: {
      'Вищий Ельф': {
        asi: { intelligence: 1 },
        traits: ['Ельфійська зброярська підготовка', 'Кантіп', 'Додаткова мова'],
        description: 'Високі ельфи — витончені інтелектуали, схильні до навчання та чар.',
      },
      'Лісовий Ельф': {
        asi: { wisdom: 1 },
        traits: ['Маскування в дикій місцевості', 'Швидкість 35 футів'],
        description: 'Лісові ельфи — вправні та невловимі мисливці, злиті з природою.',
      },
      Дроу: {
        asi: { charisma: 1 },
        traits: ['Сонячна чутливість', 'Феєричні чари'],
        description: 'Темні ельфи, що живуть під землею; сильні чари, але вразливі до сонця.',
      },
    },
  },
  dwarf: {
    name: 'Дварф',
    speed: 25,
    asi: { constitution: 2 },
    traits: ['Темнозір', 'Стійкість дварфів', 'Знаннє орків і гномів'],
    description: 'Витривалі та працьовиті, дварфи відомі своїми традиціями та ремеслами.',
    subraces: {
      'Дварф Пагорбів': {
        asi: { wisdom: 1 },
        traits: ['Дварфська витривалість'],
        description: 'Дварфи пагорбів міцні та зважені, з додатковою витривалістю.',
      },
      'Гірський Дварф': {
        asi: { strength: 1 },
        traits: ['Тренування броні'],
        description: 'Гірські дварфи — дисципліновані воїни, знайомі з бронею з дитинства.',
      },
    },
  },
  halfling: {
    name: 'Галфлінг',
    speed: 25,
    asi: { dexterity: 2 },
    traits: ['Вдача галфлінгів', 'Хоробрість', 'Малий зріст'],
    description: 'Дружні й відважні, галфлінги покладаються на щастя і спритність.',
    subraces: {
      Lightfoot: {
        asi: { charisma: 1 },
        traits: ['Природна потаємність'],
        description: 'Лайтфут — непомітні та товариські мандрівники.',
      },
      Stout: {
        asi: { constitution: 1 },
        traits: ['Стійкість до отрут'],
        description: 'Кремезні галфлінги — витривалі, здатні витримувати негаразди.',
      },
    },
  },
  halfelf: {
    name: 'Напівельф',
    speed: 30,
    asi: { charisma: 2 },
    flexible: { count: 2, exclude: ['charisma'], note: '+1 до двох різних (окрім Харизми)' },
    traits: ['Темнозір', 'Ельфійська спадщина'],
    description: 'Поєднання людської пристосовності та ельфійської витонченості.',
  },
  halforc: {
    name: 'Напіворк',
    speed: 30,
    asi: { strength: 2, constitution: 1 },
    traits: ['Лють напіворка', 'Невгасима витривалість'],
    description: 'Сильні та вперті, напіворки відомі своєю бойовою завзятістю.',
  },
  tiefling: {
    name: 'Тіфлінг',
    speed: 30,
    asi: { intelligence: 1, charisma: 2 },
    traits: ['Пекельний опір', 'Тайні чари'],
    description: 'Нащадки пекельних сил, з природною опірністю вогню та дарами чарів.',
  },
  gnome: {
    name: 'Гном',
    speed: 25,
    asi: { intelligence: 2 },
    traits: ['Темнозір', 'Гномяча кмітливість'],
    description: 'Дотепні та допитливі, гноми легко опановують техніку і магію.',
    subraces: {
      'Лісовий Гном': {
        asi: { dexterity: 1 },
        traits: ['Розмова з дрібними звірами', 'Маленька ілюзія'],
        description: 'Лісові гноми — тихі друзі природи та хитрі ілюзіоністи.',
      },
      'Кам’яний Гном': {
        asi: { constitution: 1 },
        traits: ['Реміснича кмітливість'],
        description: 'Кам’яні гноми — майстри механізмів і дрібних пристроїв.',
      },
    },
  },
  dragonborn: {
    name: 'Драконороджений',
    speed: 30,
    asi: { strength: 2, charisma: 1 },
    traits: ['Дихання дракона', 'Стійкість до відповідного елементу'],
    description: 'Горді нащадки драконів з подихом і стійкістю певного типу енергії.',
  },
};

export const RACE_OPTIONS = Object.keys(RACES);

export const SUBRACE_OPTIONS = (raceKey: string): string[] => {
  const r = RACES[raceKey];
  if (!r || !r.subraces) return [];
  return Object.keys(r.subraces);
};

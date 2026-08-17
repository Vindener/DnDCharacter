import type { Dnd5DamageType, SpellComponents, UpsertSpellbookSpellInput } from '@/types/Spellbook';

const d = (label: string, formula: string, damageType: Dnd5DamageType, condition?: string) => ({
  label,
  formula,
  damageType,
  condition,
});

const DEFAULT_COMPONENTS: SpellComponents = { verbal: true, somatic: true, material: '' };

const ARCANE_CLASSES = ['Wizard', 'Sorcerer'];
const DIVINE_CLASSES = ['Cleric', 'Paladin'];
const NATURE_CLASSES = ['Druid', 'Ranger'];

const SPELL_METADATA: Record<string, Partial<UpsertSpellbookSpellInput>> = {
  'Вогняна куля': {
    castingTime: '1 дія',
    range: '150 футів',
    components: { verbal: true, somatic: true, material: 'крихітна кулька гуано кажана та сірка' },
    duration: 'Миттєво',
    higherLevels: '+1d6 урону за кожен слот вище 3 рівня.',
    classes: ['Wizard', 'Sorcerer'],
  },
  Щит: {
    castingTime: '1 реакція',
    range: 'На себе',
    components: { verbal: true, somatic: true, material: '' },
    duration: '1 раунд',
    classes: ['Wizard', 'Sorcerer'],
  },
  'Броня мага': {
    castingTime: '1 дія',
    range: 'Дотик',
    components: { verbal: true, somatic: true, material: 'шматочок обробленої шкіри' },
    duration: '8 годин',
    classes: ['Wizard', 'Sorcerer'],
  },
  Поспіх: {
    castingTime: '1 дія',
    range: '30 футів',
    duration: 'До 1 хвилини',
    concentration: true,
    classes: ['Wizard', 'Sorcerer'],
  },
  Політ: {
    castingTime: '1 дія',
    range: 'Дотик',
    duration: 'До 10 хвилин',
    concentration: true,
    classes: ['Wizard', 'Sorcerer', 'Warlock'],
  },
  Невидимість: {
    castingTime: '1 дія',
    range: 'Дотик',
    duration: 'До 1 години',
    concentration: true,
    higherLevels: 'Додаткова ціль за кожен слот вище 2 рівня.',
    classes: ['Wizard', 'Sorcerer', 'Warlock', 'Bard'],
  },
  'Покращена невидимість': {
    castingTime: '1 дія',
    range: 'Дотик',
    duration: 'До 1 хвилини',
    concentration: true,
    classes: ['Wizard', 'Sorcerer', 'Bard'],
  },
  'Охоронці духу': {
    castingTime: '1 дія',
    range: 'На себе',
    duration: 'До 10 хвилин',
    concentration: true,
    classes: ['Cleric'],
  },
  'Місячний промінь': {
    castingTime: '1 дія',
    range: '120 футів',
    duration: 'До 1 хвилини',
    concentration: true,
    classes: ['Druid'],
  },
  Телекінез: {
    castingTime: '1 дія',
    range: '60 футів',
    duration: 'До 10 хвилин',
    concentration: true,
    classes: ['Wizard', 'Sorcerer'],
  },
  Поліморф: {
    castingTime: '1 дія',
    range: '60 футів',
    duration: 'До 1 години',
    concentration: true,
    classes: ['Wizard', 'Sorcerer', 'Druid', 'Bard'],
  },
  Вигнання: {
    castingTime: '1 дія',
    range: '60 футів',
    duration: 'До 1 хвилини',
    concentration: true,
    classes: ['Cleric', 'Paladin', 'Wizard', 'Sorcerer', 'Warlock'],
  },
  'Магічна рука': {
    castingTime: '1 дія',
    range: '30 футів',
    duration: '1 хвилина',
    classes: ['Wizard', 'Sorcerer', 'Warlock', 'Bard'],
  },
  'Мала ілюзія': {
    castingTime: '1 дія',
    range: '30 футів',
    duration: '1 хвилина',
    classes: ['Wizard', 'Sorcerer', 'Warlock', 'Bard'],
  },
};

function inferSpellClasses(spell: UpsertSpellbookSpellInput): string[] {
  const tags = new Set((spell.tags || []).map((tag) => tag.toLowerCase()));
  if (tags.has('healing') || spell.name.includes('Священне') || spell.name.includes('Воскресіння')) return [...DIVINE_CLASSES, 'Druid'];
  if (spell.name.includes('Місячний') || spell.name.includes('Землетрус')) return [...NATURE_CLASSES];
  if (tags.has('radiant')) return ['Cleric', 'Paladin'];
  if (tags.has('necrotic')) return ['Wizard', 'Warlock', 'Cleric'];
  return ARCANE_CLASSES;
}

function withMetadata(spell: UpsertSpellbookSpellInput): UpsertSpellbookSpellInput {
  const override = SPELL_METADATA[spell.name] || {};
  return {
    castingTime: '1 дія',
    range: spell.level === 0 ? '60 футів' : '90 футів',
    components: DEFAULT_COMPONENTS,
    duration: 'Миттєво',
    higherLevels: '',
    classes: inferSpellClasses(spell),
    ritual: false,
    concentration: false,
    ...spell,
    ...override,
  };
}

const RAW_SPELLBOOK_SEED: UpsertSpellbookSpellInput[] = [
  // Cantrips
  {
    name: 'Вогняний болт',
    level: 0,
    school: 'Втілення',
    description: 'Дальня spell-атака вогнем.',
    tags: ['cantrip', 'attack', 'fire'],
    damageProfiles: [d('Попадання', '1d10', 'fire')],
  },
  {
    name: 'Промінь морозу',
    level: 0,
    school: 'Втілення',
    description: 'Дальня spell-атака холодом, сповільнює ціль.',
    tags: ['cantrip', 'attack', 'cold'],
    damageProfiles: [d('Попадання', '1d8', 'cold')],
  },
  {
    name: 'Шоковий дотик',
    level: 0,
    school: 'Втілення',
    description: 'Ближня spell-атака блискавкою.',
    tags: ['cantrip', 'attack', 'lightning'],
    damageProfiles: [d('Попадання', '1d8', 'lightning')],
  },
  {
    name: 'Кислотний бриз',
    level: 0,
    school: 'Втілення',
    description: 'Ціль робить ряткидок DEX, інакше отримує кислоту.',
    tags: ['cantrip', 'save', 'acid'],
    damageProfiles: [d('Провал DEX', '1d6', 'acid')],
  },
  {
    name: 'Священне полум’я',
    level: 0,
    school: 'Втілення',
    description: 'Ціль робить ряткидок DEX проти променю світла.',
    tags: ['cantrip', 'save', 'radiant'],
    damageProfiles: [d('Провал DEX', '1d8', 'radiant')],
  },
  {
    name: 'Отруйний спрей',
    level: 0,
    school: 'Втілення',
    description: 'Ціль робить ряткидок CON проти отруйної хмари.',
    tags: ['cantrip', 'save', 'poison'],
    damageProfiles: [d('Провал CON', '1d12', 'poison')],
  },
  {
    name: 'Eldritch Blast',
    level: 0,
    school: 'Втілення',
    description: 'Промінь енергії, spell-атака на відстані.',
    tags: ['cantrip', 'attack', 'force'],
    damageProfiles: [d('За 1 промінь', '1d10', 'force')],
  },
  {
    name: 'Злий докір',
    level: 0,
    school: 'Зачарування',
    description: 'Ціль робить ряткидок WIS проти психічної образи.',
    tags: ['cantrip', 'save', 'psychic'],
    damageProfiles: [d('Провал WIS', '1d4', 'psychic')],
  },
  {
    name: 'Магічна рука',
    level: 0,
    school: 'Виклик',
    description: 'Спектральна рука для взаємодії з предметами.',
    tags: ['cantrip', 'utility'],
  },
  {
    name: 'Мала ілюзія',
    level: 0,
    school: 'Ілюзія',
    description: 'Створює просту візуальну або звукову ілюзію.',
    tags: ['cantrip', 'utility', 'control'],
  },

  // Level 1
  {
    name: 'Магічна стріла',
    level: 1,
    school: 'Втілення',
    description: 'Автоматичне влучання силовими дротиками.',
    tags: ['damage', 'force'],
    damageProfiles: [d('За 1 дротик', '1d4+1', 'force')],
  },
  {
    name: 'Щит',
    level: 1,
    school: 'Огородження',
    description: 'Реакція: +5 до AC до початку наступного ходу.',
    tags: ['defense', 'reaction'],
  },
  {
    name: 'Броня мага',
    level: 1,
    school: 'Огородження',
    description: 'Підвищує базовий AC неброньованої цілі.',
    tags: ['defense', 'buff'],
  },
  {
    name: 'Палаючі руки',
    level: 1,
    school: 'Втілення',
    description: 'Конус вогню, ряткидок DEX на половину.',
    tags: ['damage', 'aoe', 'fire'],
    damageProfiles: [d('Базово', '3d6', 'fire', 'DEX save, на успіх половина'), d('Апкаст', '+1d6/slot', 'fire', 'за слот вище 1')],
  },
  {
    name: 'Хроматична сфера',
    level: 1,
    school: 'Втілення',
    description: 'Spell-атака елементом на вибір.',
    tags: ['damage', 'attack', 'elemental'],
    damageProfiles: [d('Попадання', '3d8', 'fire', 'тип: acid/cold/fire/lightning/poison/thunder')],
  },
  {
    name: 'Спрямований болт',
    level: 1,
    school: 'Втілення',
    description: 'Spell-атака сяйвом, наступна атака по цілі з перевагою.',
    tags: ['damage', 'attack', 'radiant'],
    damageProfiles: [d('Попадання', '4d6', 'radiant')],
  },
  {
    name: 'Громова хвиля',
    level: 1,
    school: 'Втілення',
    description: 'Куб енергії, ряткидок CON на половину.',
    tags: ['damage', 'aoe', 'thunder'],
    damageProfiles: [d('Базово', '2d8', 'thunder', 'CON save, на успіх половина'), d('Апкаст', '+1d8/slot', 'thunder', 'за слот вище 1')],
  },
  {
    name: 'Гнильне торкання',
    level: 1,
    school: 'Некромантія',
    description: 'Ближня spell-атака некротичною енергією.',
    tags: ['damage', 'attack', 'necrotic'],
    damageProfiles: [d('Попадання', '3d10', 'necrotic')],
  },
  {
    name: 'Лікування ран',
    level: 1,
    school: 'Виклик',
    description: 'Відновлює HP дотиком.',
    tags: ['healing', 'support'],
  },
  {
    name: 'Слово зцілення',
    level: 1,
    school: 'Виклик',
    description: 'Швидке відновлення HP на дистанції.',
    tags: ['healing', 'support', 'bonus-action'],
  },

  // Level 2
  {
    name: 'Палючі промені',
    level: 2,
    school: 'Втілення',
    description: 'Три spell-атаки вогнем.',
    tags: ['damage', 'attack', 'fire'],
    damageProfiles: [d('За 1 промінь', '2d6', 'fire'), d('Апкаст', '+1 промінь/slot', 'fire', 'за слот вище 2')],
  },
  {
    name: 'Розкол',
    level: 2,
    school: 'Втілення',
    description: 'Гучний вибух, ряткидок CON на половину.',
    tags: ['damage', 'aoe', 'thunder'],
    damageProfiles: [d('Базово', '3d8', 'thunder', 'CON save, на успіх половина'), d('Апкаст', '+1d8/slot', 'thunder', 'за слот вище 2')],
  },
  {
    name: 'Кислотна стріла Мелфа',
    level: 2,
    school: 'Втілення',
    description: 'Кислота при попаданні та додатково на початку ходу.',
    tags: ['damage', 'attack', 'acid'],
    damageProfiles: [d('Попадання (миттєво)', '4d4', 'acid'), d('Кінець наступного ходу', '2d4', 'acid')],
  },
  {
    name: 'Духовна зброя',
    level: 2,
    school: 'Виклик',
    description: 'Бонусною дією атакує ціль силою.',
    tags: ['damage', 'attack', 'force', 'bonus-action'],
    damageProfiles: [d('Попадання', '1d8+mod', 'force')],
  },
  {
    name: 'Місячний промінь',
    level: 2,
    school: 'Втілення',
    description: 'Ціль у зоні робить ряткидок CON.',
    tags: ['damage', 'aoe', 'radiant'],
    damageProfiles: [d('Базово', '2d10', 'radiant', 'CON save, на успіх половина'), d('Апкаст', '+1d10/slot', 'radiant', 'за слот вище 2')],
  },
  {
    name: 'Туманний крок',
    level: 2,
    school: 'Виклик',
    description: 'Телепорт бонусною дією.',
    tags: ['mobility', 'bonus-action'],
  },
  {
    name: 'Невидимість',
    level: 2,
    school: 'Ілюзія',
    description: 'Робить ціль невидимою на час дії.',
    tags: ['utility', 'stealth'],
  },
  {
    name: 'Утримати особу',
    level: 2,
    school: 'Зачарування',
    description: 'Параліч гуманоїда при провалі ряткидка WIS.',
    tags: ['control', 'save'],
  },

  // Level 3
  {
    name: 'Вогняна куля',
    level: 3,
    school: 'Втілення',
    description: 'Класичний AoE-вибух вогню.',
    tags: ['damage', 'aoe', 'fire'],
    damageProfiles: [d('Базово', '8d6', 'fire', 'DEX save, на успіх половина'), d('Апкаст', '+1d6/slot', 'fire', 'за слот вище 3')],
  },
  {
    name: 'Блискавка',
    level: 3,
    school: 'Втілення',
    description: 'Лінійний розряд блискавки.',
    tags: ['damage', 'aoe', 'lightning'],
    damageProfiles: [
      d('Базово', '8d6', 'lightning', 'DEX save, на успіх половина'),
      d('Апкаст', '+1d6/slot', 'lightning', 'за слот вище 3'),
    ],
  },
  {
    name: 'Контрзакляття',
    level: 3,
    school: 'Огородження',
    description: 'Реакцією перериває чуже закляття.',
    tags: ['control', 'reaction'],
  },
  {
    name: 'Розсіювання магії',
    level: 3,
    school: 'Огородження',
    description: 'Скасовує активні магічні ефекти.',
    tags: ['utility', 'control'],
  },
  {
    name: 'Політ',
    level: 3,
    school: 'Перетворення',
    description: 'Дає швидкість польоту.',
    tags: ['buff', 'mobility'],
  },
  {
    name: 'Поспіх',
    level: 3,
    school: 'Перетворення',
    description: 'Сильний баф на швидкість і дії.',
    tags: ['buff', 'combat'],
  },
  {
    name: 'Охоронці духу',
    level: 3,
    school: 'Виклик',
    description: 'Зона навколо кастера, ряткидок WIS.',
    tags: ['damage', 'aoe', 'radiant', 'necrotic'],
    damageProfiles: [
      d('Базово', '3d8', 'radiant', 'WIS save, на успіх половина; тип може бути necrotic'),
      d('Апкаст', '+1d8/slot', 'radiant', 'за слот вище 3'),
    ],
  },
  {
    name: 'Вампіричний дотик',
    level: 3,
    school: 'Некромантія',
    description: 'Spell-атака, що лікує кастера на половину завданого урону.',
    tags: ['damage', 'attack', 'necrotic', 'self-heal'],
    damageProfiles: [d('Попадання', '3d6', 'necrotic')],
  },

  // Level 4
  {
    name: 'Виснаження',
    level: 4,
    school: 'Некромантія',
    description: 'Потужний некротичний урон по одній цілі.',
    tags: ['damage', 'necrotic', 'save'],
    damageProfiles: [d('Базово', '8d8', 'necrotic', 'CON save, на успіх половина')],
  },
  {
    name: 'Крижана буря',
    level: 4,
    school: 'Втілення',
    description: 'Зона льоду та уламків.',
    tags: ['damage', 'aoe', 'cold', 'bludgeoning'],
    damageProfiles: [d('Холод', '4d6', 'cold'), d('Дробильний', '2d8', 'bludgeoning')],
  },
  {
    name: 'Стіна вогню',
    level: 4,
    school: 'Втілення',
    description: 'Стіна, що завдає вогняний урон при контакті.',
    tags: ['damage', 'control', 'fire'],
    damageProfiles: [d('Контакт із гарячою стороною', '5d8', 'fire', 'DEX save, на успіх половина')],
  },
  {
    name: 'Покращена невидимість',
    level: 4,
    school: 'Ілюзія',
    description: 'Невидимість не спадає від атак/касту.',
    tags: ['buff', 'stealth'],
  },
  {
    name: 'Поліморф',
    level: 4,
    school: 'Перетворення',
    description: 'Перетворює ціль на звіра.',
    tags: ['control', 'utility'],
  },
  {
    name: 'Вигнання',
    level: 4,
    school: 'Огородження',
    description: 'Тимчасово прибирає ціль з поля бою.',
    tags: ['control', 'save'],
  },

  // Level 5
  {
    name: 'Конус холоду',
    level: 5,
    school: 'Втілення',
    description: 'Великий конус морозу.',
    tags: ['damage', 'aoe', 'cold'],
    damageProfiles: [d('Базово', '8d8', 'cold', 'CON save, на успіх половина'), d('Апкаст', '+1d8/slot', 'cold', 'за слот вище 5')],
  },
  {
    name: 'Удар полум’я',
    level: 5,
    school: 'Втілення',
    description: 'Колона божественного вогню.',
    tags: ['damage', 'aoe', 'fire', 'radiant'],
    damageProfiles: [
      d('Вогонь', '4d6', 'fire', 'DEX save, на успіх половина'),
      d('Сяйво', '4d6', 'radiant', 'DEX save, на успіх половина'),
    ],
  },
  {
    name: 'Хмара смерті',
    level: 5,
    school: 'Виклик',
    description: 'Рухома токсична хмара.',
    tags: ['damage', 'aoe', 'poison'],
    damageProfiles: [d('Базово', '5d8', 'poison', 'CON save, на успіх половина'), d('Апкаст', '+1d8/slot', 'poison', 'за слот вище 5')],
  },
  {
    name: 'Утримати монстра',
    level: 5,
    school: 'Зачарування',
    description: 'Паралізує будь-яку істоту на провалі WIS save.',
    tags: ['control', 'save'],
  },
  {
    name: 'Телекінез',
    level: 5,
    school: 'Перетворення',
    description: 'Керує предметами або істотою силою розуму.',
    tags: ['control', 'utility'],
  },
  {
    name: 'Стіна сили',
    level: 5,
    school: 'Втілення',
    description: 'Непроникний барєр без урону.',
    tags: ['control', 'defense'],
  },

  // Level 6
  {
    name: 'Ланцюгова блискавка',
    level: 6,
    school: 'Втілення',
    description: 'Б’є кілька цілей блискавкою.',
    tags: ['damage', 'aoe', 'lightning'],
    damageProfiles: [d('Базово', '10d8', 'lightning', 'DEX save, на успіх половина')],
  },
  {
    name: 'Дезінтеграція',
    level: 6,
    school: 'Перетворення',
    description: 'Надвисокий урон по проваленому DEX save.',
    tags: ['damage', 'force', 'save'],
    damageProfiles: [
      d('Базово', '10d6+40', 'force', 'на успішний DEX save урону немає'),
      d('Апкаст', '+3d6/slot', 'force', 'за слот вище 6'),
    ],
  },
  {
    name: 'Коло смерті',
    level: 6,
    school: 'Некромантія',
    description: 'Велика зона некротичного урону.',
    tags: ['damage', 'aoe', 'necrotic'],
    damageProfiles: [d('Базово', '8d6', 'necrotic', 'CON save, на успіх половина'), d('Апкаст', '+2d6/slot', 'necrotic', 'за слот вище 6')],
  },
  {
    name: 'Сонячний промінь',
    level: 6,
    school: 'Втілення',
    description: 'Промінь сяйва щораундово, ряткидок CON.',
    tags: ['damage', 'radiant', 'control'],
    damageProfiles: [d('Базово', '6d8', 'radiant', 'CON save, на успіх половина')],
  },
  {
    name: 'Велике лікування',
    level: 6,
    school: 'Виклик',
    description: 'Потужне гарантоване зцілення цілі.',
    tags: ['healing', 'support'],
  },

  // Level 7
  {
    name: 'Затримана вогняна куля',
    level: 7,
    school: 'Втілення',
    description: 'Накопичує заряд і вибухає.',
    tags: ['damage', 'aoe', 'fire'],
    damageProfiles: [d('Базово', '12d6', 'fire', 'DEX save, на успіх половина; може рости за затримку')],
  },
  {
    name: 'Палець смерті',
    level: 7,
    school: 'Некромантія',
    description: 'Смертельний некротичний заряд.',
    tags: ['damage', 'necrotic', 'save'],
    damageProfiles: [d('Базово', '7d8+30', 'necrotic', 'CON save, на успіх половина')],
  },
  {
    name: 'Вогняний шторм',
    level: 7,
    school: 'Втілення',
    description: 'Велика зона полум’я.',
    tags: ['damage', 'aoe', 'fire'],
    damageProfiles: [d('Базово', '7d10', 'fire', 'DEX save, на успіх половина')],
  },
  {
    name: 'Воскресіння',
    level: 7,
    school: 'Некромантія',
    description: 'Повертає померлого до життя.',
    tags: ['healing', 'support', 'resurrection'],
  },

  // Level 8
  {
    name: 'Сонячний спалах',
    level: 8,
    school: 'Втілення',
    description: 'Масивний спалах світла.',
    tags: ['damage', 'aoe', 'radiant'],
    damageProfiles: [d('Базово', '12d6', 'radiant', 'CON save, на успіх половина')],
  },
  {
    name: 'Запалювальна хмара',
    level: 8,
    school: 'Виклик',
    description: 'Палаюча хмара, що переміщується.',
    tags: ['damage', 'aoe', 'fire'],
    damageProfiles: [d('Базово', '10d8', 'fire', 'DEX save, на успіх половина')],
  },
  {
    name: 'Землетрус',
    level: 8,
    school: 'Втілення',
    description: 'Руйнує місцевість та створює складні умови.',
    tags: ['control', 'aoe'],
  },

  // Level 9
  {
    name: 'Метеоритний дощ',
    level: 9,
    school: 'Втілення',
    description: 'Найпотужніший AoE-вибух 5e.',
    tags: ['damage', 'aoe', 'fire', 'bludgeoning'],
    damageProfiles: [
      d('Вогонь', '20d6', 'fire', 'DEX save, на успіх половина'),
      d('Дробильний', '20d6', 'bludgeoning', 'DEX save, на успіх половина'),
    ],
  },
  {
    name: 'Слово сили: Вбити',
    level: 9,
    school: 'Зачарування',
    description: 'Миттєво вбиває ціль із низьким HP.',
    tags: ['control', 'finisher'],
  },
  {
    name: 'Зупинка часу',
    level: 9,
    school: 'Перетворення',
    description: 'Дає додаткові ходи лише для кастера.',
    tags: ['utility', 'tempo'],
  },
  {
    name: 'Бажання',
    level: 9,
    school: 'Виклик',
    description: 'Найгнучкіше закляття з майже необмеженим ефектом.',
    tags: ['utility', 'legendary'],
  },
];

export const SPELLBOOK_SEED: UpsertSpellbookSpellInput[] = RAW_SPELLBOOK_SEED.map(withMetadata);

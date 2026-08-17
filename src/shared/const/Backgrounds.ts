export interface BackgroundDef {
  key: string;
  name: string; // UA
  skills: string[];
  tools?: string[];
  languages?: number; // number of additional languages
  featureName: string;
  featureDescription: string; // long UA paraphrase
}

export const BACKGROUNDS: BackgroundDef[] = [
  {
    key: 'acolyte',
    name: 'Послушник',
    skills: ['Релігія', 'Проникливість'],
    languages: 2,
    featureName: 'Осередок віри',
    featureDescription:
      'Вас знають при святині або храмі. Ви можете розраховувати на підтримку одновірців: нічліг, лікування, ритуальна допомога, якщо не зловживаєте довірою.',
  },
  {
    key: 'criminal',
    name: 'Злочинець',
    skills: ['Обман', 'Скритність'],
    tools: ['Інструменти злодія', 'Ігровий набір (на вибір)'],
    featureName: 'Контакти у підпіллі',
    featureDescription:
      'У вас є надійний контакт у злочинному світі та мережа посередників, що допомагає передавати повідомлення та знаходити заборонені речі.',
  },
  {
    key: 'soldier',
    name: 'Солдат',
    skills: ['Атлетика', 'Залякування'],
    tools: ['Ігрові кості або карти', 'Транспорт (наземний)'],
    featureName: 'Військова репутація',
    featureDescription:
      'Завдяки службі вас поважають військові. Ви можете отримати доступ до військових об’єктів, знайти притулок у казармі або в таборі союзників.',
  },
  {
    key: 'sage',
    name: 'Вчений',
    skills: ['Аркана', 'Історія'],
    languages: 2,
    featureName: 'Дослідник знань',
    featureDescription:
      'Ви знаєте, де шукати інформацію: бібліотеки, університети, архіви. Якщо не маєте відповіді, зможете відшукати джерело.',
  },
  {
    key: 'folkhero',
    name: 'Народний герой',
    skills: ['Тваринництво', 'Виживання'],
    tools: ['Ремісничі інструменти (на вибір)', 'Транспорт (наземний)'],
    featureName: 'Серед простого люду',
    featureDescription: 'Прості люди надають притулок і допомогу. Вони приховають вас від ворогів, якщо їхня безпека не під загрозою.',
  },
];

export const BACKGROUND_OPTIONS = BACKGROUNDS.map((b) => b.key);

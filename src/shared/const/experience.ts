export interface LevelExperience {
  level: number;
  exp: number;
}

export const EXPERIENCE_TABLE: LevelExperience[] = [
  { level: 1, exp: 0 },
  { level: 2, exp: 300 },
  { level: 3, exp: 900 },
  { level: 4, exp: 2700 },
  { level: 5, exp: 6500 },
  { level: 6, exp: 14000 },
  { level: 7, exp: 23000 },
  { level: 8, exp: 34000 },
  { level: 9, exp: 48000 },
  { level: 10, exp: 64000 },
  { level: 11, exp: 85000 },
  { level: 12, exp: 100000 },
  { level: 13, exp: 120000 },
  { level: 14, exp: 140000 },
  { level: 15, exp: 165000 },
  { level: 16, exp: 195000 },
  { level: 17, exp: 225000 },
  { level: 18, exp: 265000 },
  { level: 19, exp: 305000 },
  { level: 20, exp: 355000 },
];

export const getLevelByExperience = (exp: number): number => {
  for (let i = EXPERIENCE_TABLE.length - 1; i >= 0; i--) {
    if (exp >= EXPERIENCE_TABLE[i].exp) {
      return EXPERIENCE_TABLE[i].level;
    }
  }
  return 1;
};

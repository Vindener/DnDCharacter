import { create } from 'zustand';
import type { AppRole } from '@/types/Product';
import type { MonsterDto } from '@/types/Monster';
import type { CharacterCustomResource } from '@/types/Character';
import type { ResourceTemplate } from '@/dm/domain/types';
import { createDmStoreEffects } from '@/services/storeEffects/dmStoreEffects';

export interface DmStore {
  monsters: MonsterDto[];
  pinnedMonsterIds: string[];
  favoriteMonsterIds: string[];
  isLoaded: boolean;
  loadError: string | null;
  role: AppRole;
  userTemplates: ResourceTemplate[];
  loadMonsters: () => Promise<void>;
  saveMonsters: (newMonsters: MonsterDto[]) => Promise<void>;
  addMonster: (monster: MonsterDto) => Promise<void>;
  addMonsters: (monsters: MonsterDto[]) => Promise<void>;
  updateMonster: (id: string, monster: MonsterDto) => Promise<void>;
  removeMonster: (id: string) => Promise<void>;
  togglePinnedMonster: (id: string) => Promise<void>;
  toggleFavoriteMonster: (id: string) => Promise<void>;
  clearPinnedMonsters: () => Promise<void>;
  setRole: (role: AppRole) => Promise<void>;
  loadRole: () => Promise<void>;
  loadUserTemplates: () => Promise<void>;
  addUserTemplateFromResource: (resource: CharacterCustomResource, name?: string) => Promise<void>;
  removeUserTemplate: (templateId: string) => Promise<void>;
}

const useDmStore = create<DmStore>((set, get) => {
  const effects = createDmStoreEffects({ set, get });

  return {
    monsters: [],
    pinnedMonsterIds: [],
    favoriteMonsterIds: [],
    isLoaded: false,
    loadError: null,
    role: 'Hybrid',
    userTemplates: [],
    loadMonsters: effects.loadMonsters,
    saveMonsters: effects.saveMonsters,
    addMonster: effects.addMonster,
    addMonsters: effects.addMonsters,
    updateMonster: effects.updateMonster,
    removeMonster: effects.removeMonster,
    togglePinnedMonster: effects.togglePinnedMonster,
    toggleFavoriteMonster: effects.toggleFavoriteMonster,
    clearPinnedMonsters: effects.clearPinnedMonsters,
    setRole: effects.setRole,
    loadRole: effects.loadRole,
    loadUserTemplates: effects.loadUserTemplates,
    addUserTemplateFromResource: effects.addUserTemplateFromResource,
    removeUserTemplate: effects.removeUserTemplate,
  };
});

export default useDmStore;

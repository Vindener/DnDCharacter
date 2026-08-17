import { create } from 'zustand';
import type { AppRole } from '@/types/Product';
import { loadAppRole, persistAppRole } from '@/dm/repositories/appRoleRepository';

export interface AppRoleStore {
  role: AppRole;
  setRole: (role: AppRole) => Promise<void>;
  loadRole: () => Promise<void>;
}

const useAppRoleStore = create<AppRoleStore>((set) => ({
  role: 'Hybrid',

  setRole: async (role) => {
    set({ role });
    try {
      await persistAppRole(role);
    } catch (_error) {
      /* intentionally ignored */
    }
  },

  loadRole: async () => {
    try {
      const role = await loadAppRole();
      set({ role });
    } catch (_error) {
      /* intentionally ignored */
    }
  },
}));

export default useAppRoleStore;

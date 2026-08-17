import { create } from 'zustand';
import type { CharacterCustomResource } from '@/types/Character';
import type { ResourceTemplate } from '@/dm/domain/types';
import { loadTrackerTemplates, persistTrackerTemplates } from '@/dm/repositories/trackerTemplatesRepository';

export interface TrackerTemplatesStore {
  userTemplates: ResourceTemplate[];
  loadUserTemplates: () => Promise<void>;
  addUserTemplateFromResource: (resource: CharacterCustomResource, name?: string) => Promise<void>;
  removeUserTemplate: (templateId: string) => Promise<void>;
}

const useTrackerTemplatesStore = create<TrackerTemplatesStore>((set, get) => ({
  userTemplates: [],

  loadUserTemplates: async () => {
    try {
      const templates = await loadTrackerTemplates();
      set({ userTemplates: templates });
    } catch {
      set({ userTemplates: [] });
    }
  },

  addUserTemplateFromResource: async (resource, name) => {
    const current = get().userTemplates;
    const next: ResourceTemplate = {
      id: `user-template-${Date.now()}`,
      name: (name || resource.label || 'Власний шаблон').trim(),
      source: 'user',
      resource: {
        label: resource.label || 'Ресурс',
        current: Math.max(0, Number(resource.current) || 0),
        max: typeof resource.max === 'number' ? Math.max(0, resource.max) : undefined,
        resetRule: resource.resetRule || 'none',
        visibility: resource.visibility,
        color: resource.color,
      },
    };

    const merged = [next, ...current].slice(0, 50);
    set({ userTemplates: merged });
    try {
      await persistTrackerTemplates(merged);
    } catch (_error) {
      /* intentionally ignored */
    }
  },

  removeUserTemplate: async (templateId) => {
    const merged = get().userTemplates.filter((template) => template.id !== templateId);
    set({ userTemplates: merged });
    try {
      await persistTrackerTemplates(merged);
    } catch (_error) {
      /* intentionally ignored */
    }
  },
}));

export default useTrackerTemplatesStore;

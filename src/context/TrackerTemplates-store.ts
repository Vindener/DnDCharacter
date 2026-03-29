import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { CharacterCustomResource } from '@/types/Character';
import type { ResourceTemplate } from '@/shared/const/TrackerTemplates';
import { SYSTEM_RESOURCE_TEMPLATES } from '@/shared/const/TrackerTemplates';

interface TrackerTemplateStore {
  userTemplates: ResourceTemplate[];
  loadUserTemplates: () => Promise<void>;
  addUserTemplateFromResource: (resource: CharacterCustomResource, name?: string) => Promise<void>;
  removeUserTemplate: (templateId: string) => Promise<void>;
}

const STORAGE_KEY = 'RESOURCE_USER_TEMPLATES_V1';

async function persistUserTemplates(templates: ResourceTemplate[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {}
}

const useTrackerTemplateStore = create<TrackerTemplateStore>((set, get) => ({
  userTemplates: [],

  loadUserTemplates: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(raw || '[]');
      if (!Array.isArray(parsed)) {
        set({ userTemplates: [] });
        return;
      }
      const normalized: ResourceTemplate[] = parsed
        .map((entry: any, index: number) => ({
          id: String(entry?.id || `user-template-${index}`),
          name: String(entry?.name || `Template ${index + 1}`),
          source: 'user' as const,
          resource: {
            label: String(entry?.resource?.label || 'Resource'),
            current: Math.max(0, Number(entry?.resource?.current) || 0),
            max: typeof entry?.resource?.max === 'number' ? Math.max(0, entry.resource.max) : undefined,
            resetRule: entry?.resource?.resetRule || 'none',
            visibility: entry?.resource?.visibility,
            color: entry?.resource?.color,
          },
        }))
        .slice(0, 50);
      set({ userTemplates: normalized });
    } catch {
      set({ userTemplates: [] });
    }
  },

  addUserTemplateFromResource: async (resource, name) => {
    const current = get().userTemplates;
    const next: ResourceTemplate = {
      id: `user-template-${Date.now()}`,
      name: (name || resource.label || 'Custom Template').trim(),
      source: 'user',
      resource: {
        label: resource.label || 'Resource',
        current: Math.max(0, Number(resource.current) || 0),
        max: typeof resource.max === 'number' ? Math.max(0, resource.max) : undefined,
        resetRule: resource.resetRule || 'none',
        visibility: resource.visibility,
        color: resource.color,
      },
    };
    const merged = [next, ...current].slice(0, 50);
    set({ userTemplates: merged });
    await persistUserTemplates(merged);
  },

  removeUserTemplate: async (templateId) => {
    const merged = get().userTemplates.filter((template) => template.id !== templateId);
    set({ userTemplates: merged });
    await persistUserTemplates(merged);
  },
}));

export { SYSTEM_RESOURCE_TEMPLATES };
export default useTrackerTemplateStore;

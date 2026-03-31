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
        .map((entry: unknown, index: number) => {
          const cast = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {};
          const resource = cast.resource && typeof cast.resource === 'object' ? (cast.resource as Record<string, unknown>) : {};
          return {
          id: String(cast.id || `user-template-${index}`),
          name: String(cast.name || `Шаблон ${index + 1}`),
          source: 'user' as const,
          resource: {
            label: String(resource.label || 'Ресурс'),
            current: Math.max(0, Number(resource.current) || 0),
            max: typeof resource.max === 'number' ? Math.max(0, resource.max) : undefined,
            resetRule: String(resource.resetRule || 'none') as CharacterCustomResource['resetRule'],
            visibility: resource.visibility as CharacterCustomResource['visibility'],
            color: typeof resource.color === 'string' ? resource.color : undefined,
          },
        };
      })
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

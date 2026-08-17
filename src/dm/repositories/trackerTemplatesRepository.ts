import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ResourceTemplate } from '@/dm/domain/types';
import { createStorageEnvelope, normalizeStorageEnvelope } from '@/domain/migrations';

const USER_TEMPLATES_STORAGE_KEY = 'RESOURCE_USER_TEMPLATES_V1';

function parseStoredValue(raw: string | null): unknown {
  if (raw === null || raw === undefined) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function loadTrackerTemplates(): Promise<ResourceTemplate[]> {
  const raw = await AsyncStorage.getItem(USER_TEMPLATES_STORAGE_KEY);
  const parsed = parseStoredValue(raw);
  const migrated = normalizeStorageEnvelope<unknown[]>('dmUserTemplates', parsed, []);
  if (!Array.isArray(migrated.data)) return [];

  return migrated.data
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
          resetRule: String(resource.resetRule || 'none') as ResourceTemplate['resource']['resetRule'],
          visibility: resource.visibility as ResourceTemplate['resource']['visibility'],
          color: typeof resource.color === 'string' ? resource.color : undefined,
        },
      } satisfies ResourceTemplate;
    })
    .slice(0, 50);
}

export async function persistTrackerTemplates(templates: ResourceTemplate[]): Promise<void> {
  await AsyncStorage.setItem(USER_TEMPLATES_STORAGE_KEY, JSON.stringify(createStorageEnvelope('dmUserTemplates', templates || [])));
}

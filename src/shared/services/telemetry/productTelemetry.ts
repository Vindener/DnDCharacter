import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProductEventName =
  | 'role_changed'
  | 'session_continue'
  | 'character_opened'
  | 'quick_action_used'
  | 'sync_conflict_detected'
  | 'sync_conflict_resolved_local'
  | 'sync_conflict_resolved_cloud'
  | 'sync_conflict_resolved_later'
  | 'sync_failed'
  | 'permission_denied_on_upload';

export interface ProductEvent {
  name: ProductEventName;
  at: number;
  payload?: Record<string, unknown>;
}

const STORAGE_KEY = 'PRODUCT_EVENTS_V1';
const MAX_EVENTS = 250;

let writeQueue: Promise<void> = Promise.resolve();

async function readEvents(): Promise<ProductEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? (parsed as ProductEvent[]) : [];
  } catch {
    return [];
  }
}

async function saveEvents(events: ProductEvent[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch (_error) {
    /* intentionally ignored */
  }
}

export function trackProductEvent(name: ProductEventName, payload?: Record<string, unknown>): void {
  writeQueue = writeQueue.then(async () => {
    const existing = await readEvents();
    const next: ProductEvent[] = [...existing, { name, at: Date.now(), payload }];
    await saveEvents(next);
  });
}

export async function getProductEvents(): Promise<ProductEvent[]> {
  return readEvents();
}

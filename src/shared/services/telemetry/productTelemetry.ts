import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';

export type ProductEventName =
  | 'role_changed'
  | 'session_continue'
  | 'character_opened'
  | 'quick_action_used'
  | 'app_open'
  | 'character_created'
  | 'dice_rolled'
  | 'spell_viewed'
  | 'monster_viewed'
  | 'sheet_shared'
  | 'editor_added'
  | 'editor_removed'
  | 'remote_change_applied'
  | 'conflict_shown'
  | 'conflict_resolved_local'
  | 'conflict_resolved_cloud'
  | 'conflict_resolved_later'
  | 'permission_denied_on_upload'
  | 'sync_failed'
  | 'account_deleted';

// PII RULE (CLAUDE.md §8.1): payload values are types/counts only — never email, uid,
// character/document ids, character names, or free-text (notes, backstory, etc.).
// Safe examples: character_class, spell_level, roll_type, conflict_section, action_id.
export type ProductEventPayload = Record<string, string | number | boolean>;

export interface ProductEvent {
  name: ProductEventName;
  at: number;
  payload?: ProductEventPayload;
}

const STORAGE_KEY = 'PRODUCT_EVENTS_V1';
const MAX_EVENTS = 250;

// Mirrors the Firebase Analytics collection state. Defaults to disabled (opt-in consent) —
// callers must call setAnalyticsConsent() once the persisted user choice loads, every app
// start, so the native SDK's own collection state (which defaults to ON) is explicitly
// brought in line with the user's actual choice rather than silently auto-collecting.
let analyticsConsentEnabled = false;

export function setAnalyticsConsent(enabled: boolean): void {
  analyticsConsentEnabled = enabled;
  void analytics()
    .setAnalyticsCollectionEnabled(enabled)
    .catch(() => {
      /* intentionally ignored */
    });
}

export function isAnalyticsConsentEnabled(): boolean {
  return analyticsConsentEnabled;
}

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

export function trackProductEvent(name: ProductEventName, payload?: ProductEventPayload): void {
  if (!analyticsConsentEnabled) return;

  void analytics()
    .logEvent(name, payload)
    .catch(() => {
      /* intentionally ignored */
    });

  writeQueue = writeQueue.then(async () => {
    const existing = await readEvents();
    const next: ProductEvent[] = [...existing, { name, at: Date.now(), payload }];
    await saveEvents(next);
  });
}

export async function getProductEvents(): Promise<ProductEvent[]> {
  return readEvents();
}

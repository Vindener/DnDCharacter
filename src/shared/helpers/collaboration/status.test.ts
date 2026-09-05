import { describe, expect, it } from 'vitest';
import { computePresenceStatus, type PresenceViewerEntry } from './status';

const NOW = 1_700_000_000_000;

describe('computePresenceStatus', () => {
  it('returns null when there are no other viewers', () => {
    expect(computePresenceStatus([], NOW)).toBeNull();
  });

  it('returns null when every viewer is older than the 90s staleness cutoff', () => {
    const others: PresenceViewerEntry[] = [{ uid: 'dm-1', actorRole: 'DM', lastActiveAtMs: NOW - 91_000 }];
    expect(computePresenceStatus(others, NOW)).toBeNull();
  });

  it('returns "here" for a viewer active within the last 20s', () => {
    const others: PresenceViewerEntry[] = [{ uid: 'dm-1', actorRole: 'DM', lastActiveAtMs: NOW - 5_000 }];
    expect(computePresenceStatus(others, NOW)).toEqual({ kind: 'here', actorRole: 'DM' });
  });

  it('returns "recent" with a rounded minutesAgo for a viewer between 20s and 90s old', () => {
    const others: PresenceViewerEntry[] = [{ uid: 'player-1', actorRole: 'Player', lastActiveAtMs: NOW - 65_000 }];
    expect(computePresenceStatus(others, NOW)).toEqual({ kind: 'recent', actorRole: 'Player', minutesAgo: 1 });
  });

  it('picks the freshest viewer among several others', () => {
    const others: PresenceViewerEntry[] = [
      { uid: 'dm-1', actorRole: 'DM', lastActiveAtMs: NOW - 80_000 },
      { uid: 'player-1', actorRole: 'Player', lastActiveAtMs: NOW - 3_000 },
    ];
    expect(computePresenceStatus(others, NOW)).toEqual({ kind: 'here', actorRole: 'Player' });
  });

  it('omits actorRole when it is missing or not a recognized value', () => {
    const others: PresenceViewerEntry[] = [{ uid: 'unknown-1', lastActiveAtMs: NOW - 1_000 }];
    expect(computePresenceStatus(others, NOW)).toEqual({ kind: 'here', actorRole: undefined });
  });
});

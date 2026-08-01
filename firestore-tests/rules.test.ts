import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

const PROJECT_ID = 'mythgatednd-rules-test';
const RULES_PATH = resolve(__dirname, '..', 'firestore.rules');

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(RULES_PATH, 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

type TestFirestore = ReturnType<RulesTestContext['firestore']>;

async function seed(fn: (db: TestFirestore) => Promise<unknown>) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await fn(ctx.firestore());
  });
}

function validCharacterSheet(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sheet-1',
    ownerUid: 'owner-1',
    owners: ['owner-1'],
    editors: ['editor-1'],
    name: 'Elandra',
    class: 'Wizard',
    race: 'Elf',
    level: 3,
    experience: 900,
    ...overrides,
  };
}

function validDmCampaign(overrides: Record<string, unknown> = {}) {
  return {
    id: 'campaign-1',
    ownerUid: 'dm-1',
    owners: ['dm-1'],
    editors: [],
    name: 'The Sunless Citadel',
    ...overrides,
  };
}

function validDmCampaignInvite(overrides: Record<string, unknown> = {}) {
  return {
    id: 'CODE1234',
    campaignId: 'campaign-1',
    role: 'editor',
    createdByUid: 'dm-1',
    createdAtMs: 1,
    expiresAtMs: 2,
    usedByUids: [],
    ...overrides,
  };
}

function validDmCampaignNote(overrides: Record<string, unknown> = {}) {
  return {
    id: 'note-1',
    campaignId: 'campaign-1',
    ownerUid: 'dm-1',
    owners: ['dm-1'],
    editors: [],
    title: 'Session 1 recap',
    ...overrides,
  };
}

describe('firestore.rules', () => {
  describe('characterSheets: access-field immutability (regression, already fixed before P2.3)', () => {
    it('an editor cannot add themselves/others to editors/owners/ownerUid', async () => {
      await seed((db) => db.collection('characterSheets').doc('sheet-1').set(validCharacterSheet()));

      const editor = testEnv.authenticatedContext('editor-1').firestore();
      await assertFails(
        editor
          .collection('characterSheets')
          .doc('sheet-1')
          .update({ editors: ['editor-1', 'intruder'] }),
      );
    });

    it('an owner can add an editor', async () => {
      await seed((db) => db.collection('characterSheets').doc('sheet-1').set(validCharacterSheet()));

      const owner = testEnv.authenticatedContext('owner-1').firestore();
      await assertSucceeds(
        owner
          .collection('characterSheets')
          .doc('sheet-1')
          .update({ editors: ['editor-1', 'new-editor'] }),
      );
    });
  });

  describe('characterSheets: stranger access (regression)', () => {
    it('a stranger cannot read a sheet they are not on', async () => {
      await seed((db) => db.collection('characterSheets').doc('sheet-1').set(validCharacterSheet()));

      const stranger = testEnv.authenticatedContext('stranger').firestore();
      await assertFails(stranger.collection('characterSheets').doc('sheet-1').get());
    });

    it('a stranger cannot write content fields on a sheet they are not on', async () => {
      await seed((db) => db.collection('characterSheets').doc('sheet-1').set(validCharacterSheet()));

      const stranger = testEnv.authenticatedContext('stranger').firestore();
      await assertFails(stranger.collection('characterSheets').doc('sheet-1').update({ name: 'Hijacked' }));
    });
  });

  describe('emailIndex hijack (SEC-2)', () => {
    it('a stranger cannot overwrite an existing emailIndex entry with their own uid', async () => {
      await seed((db) => db.collection('emailIndex').doc('victim@example.com').set({ uid: 'victim' }));

      const attacker = testEnv.authenticatedContext('attacker').firestore();
      await assertFails(attacker.collection('emailIndex').doc('victim@example.com').set({ uid: 'attacker' }, { merge: true }));
    });

    it('the rightful owner can still update their own emailIndex entry', async () => {
      await seed((db) => db.collection('emailIndex').doc('me@example.com').set({ uid: 'me' }));

      const me = testEnv.authenticatedContext('me').firestore();
      await assertSucceeds(me.collection('emailIndex').doc('me@example.com').set({ uid: 'me' }, { merge: true }));
    });

    it('anyone signed in can create a brand-new emailIndex entry for themselves', async () => {
      const me = testEnv.authenticatedContext('me').firestore();
      await assertSucceeds(me.collection('emailIndex').doc('me@example.com').set({ uid: 'me' }));
    });
  });

  describe('users list/read (SEC-1)', () => {
    it('an unbounded list of the users collection is rejected', async () => {
      await seed(async (db) => {
        await db.collection('users').doc('u1').set({ uid: 'u1', email: 'u1@example.com' });
        await db.collection('users').doc('u2').set({ uid: 'u2', email: 'u2@example.com' });
      });

      const anyUser = testEnv.authenticatedContext('someone').firestore();
      await assertFails(anyUser.collection('users').get());
    });

    it("getEditorsForSheet's actual query shape (where uid in [...], limit 10) still works", async () => {
      await seed(async (db) => {
        await db.collection('users').doc('u1').set({ uid: 'u1', email: 'u1@example.com' });
        await db.collection('users').doc('u2').set({ uid: 'u2', email: 'u2@example.com' });
      });

      const anyUser = testEnv.authenticatedContext('someone').firestore();
      const snap = await assertSucceeds(anyUser.collection('users').where('uid', 'in', ['u1', 'u2']).limit(10).get());
      expect(snap.size).toBe(2);
    });

    it('a where(uid in [...]) query WITHOUT an explicit limit is rejected (this is why the client query now sets .limit(10))', async () => {
      await seed((db) => db.collection('users').doc('u1').set({ uid: 'u1', email: 'u1@example.com' }));

      const anyUser = testEnv.authenticatedContext('someone').firestore();
      await assertFails(anyUser.collection('users').where('uid', 'in', ['u1']).get());
    });

    it('a user cannot get another single user profile by id directly', async () => {
      await seed((db) => db.collection('users').doc('u1').set({ uid: 'u1', email: 'u1@example.com' }));

      const someone = testEnv.authenticatedContext('someone').firestore();
      await assertFails(someone.collection('users').doc('u1').get());
    });
  });

  describe('users delete (SEC-5, already fixed before P2.3 — regression check)', () => {
    it('a user can delete their own profile document', async () => {
      await seed((db) => db.collection('users').doc('u1').set({ uid: 'u1', email: 'u1@example.com' }));

      const u1 = testEnv.authenticatedContext('u1').firestore();
      await assertSucceeds(u1.collection('users').doc('u1').delete());
    });
  });

  describe('connections immutability (SEC-4)', () => {
    it('a participant cannot change fromUid/toUid on an existing connection', async () => {
      await seed((db) => db.collection('connections').doc('conn-1').set({ fromUid: 'a', toUid: 'b', status: 'pending' }));

      const a = testEnv.authenticatedContext('a').firestore();
      await assertFails(a.collection('connections').doc('conn-1').update({ toUid: 'attacker-controlled' }));
    });

    it('a participant can still update other fields on a connection', async () => {
      await seed((db) => db.collection('connections').doc('conn-1').set({ fromUid: 'a', toUid: 'b', status: 'pending' }));

      const a = testEnv.authenticatedContext('a').firestore();
      await assertSucceeds(a.collection('connections').doc('conn-1').update({ status: 'accepted' }));
    });
  });

  describe('minimal document-shape validation (SEC-3 / COL-8)', () => {
    it('rejects a characterSheets create missing required keys', async () => {
      const owner = testEnv.authenticatedContext('owner-1').firestore();
      const malformed = { id: 'sheet-2', ownerUid: 'owner-1', owners: ['owner-1'], editors: [] };
      await assertFails(owner.collection('characterSheets').doc('sheet-2').set(malformed));
    });

    it('rejects a characterSheets create with an over-length name', async () => {
      const owner = testEnv.authenticatedContext('owner-1').firestore();
      const malformed = validCharacterSheet({ id: 'sheet-2', name: 'x'.repeat(500) });
      await assertFails(owner.collection('characterSheets').doc('sheet-2').set(malformed));
    });

    it('accepts a well-formed characterSheets create', async () => {
      const owner = testEnv.authenticatedContext('owner-1').firestore();
      await assertSucceeds(
        owner
          .collection('characterSheets')
          .doc('sheet-2')
          .set(validCharacterSheet({ id: 'sheet-2' })),
      );
    });

    it('rejects a dmCampaigns create missing required keys', async () => {
      const dm = testEnv.authenticatedContext('dm-1').firestore();
      const malformed = { id: 'campaign-2', ownerUid: 'dm-1', owners: ['dm-1'], editors: [] };
      await assertFails(dm.collection('dmCampaigns').doc('campaign-2').set(malformed));
    });

    it('accepts a well-formed dmCampaigns create', async () => {
      const dm = testEnv.authenticatedContext('dm-1').firestore();
      await assertSucceeds(
        dm
          .collection('dmCampaigns')
          .doc('campaign-2')
          .set(validDmCampaign({ id: 'campaign-2' })),
      );
    });

    it('rejects a dmCampaignNotes create missing required keys', async () => {
      const dm = testEnv.authenticatedContext('dm-1').firestore();
      const malformed = { id: 'note-2', campaignId: 'campaign-1', ownerUid: 'dm-1', owners: ['dm-1'], editors: [] };
      await assertFails(dm.collection('dmCampaignNotes').doc('note-2').set(malformed));
    });

    it('accepts a well-formed dmCampaignNotes create', async () => {
      const dm = testEnv.authenticatedContext('dm-1').firestore();
      await assertSucceeds(
        dm
          .collection('dmCampaignNotes')
          .doc('note-2')
          .set(validDmCampaignNote({ id: 'note-2' })),
      );
    });
  });

  describe('dmCampaignInvites (campaign invite codes, avoids the emailIndex/SEC-2 pattern)', () => {
    it('the campaign owner can create a well-formed invite for their own campaign', async () => {
      await seed((db) => db.collection('dmCampaigns').doc('campaign-1').set(validDmCampaign()));

      const dm = testEnv.authenticatedContext('dm-1').firestore();
      await assertSucceeds(dm.collection('dmCampaignInvites').doc('CODE1234').set(validDmCampaignInvite()));
    });

    it('a non-owner (editor or unrelated user) cannot create an invite for a campaign they do not own', async () => {
      await seed((db) =>
        db
          .collection('dmCampaigns')
          .doc('campaign-1')
          .set(validDmCampaign({ editors: ['editor-1'] })),
      );

      const editor = testEnv.authenticatedContext('editor-1').firestore();
      await assertFails(
        editor
          .collection('dmCampaignInvites')
          .doc('CODE1234')
          .set(validDmCampaignInvite({ createdByUid: 'editor-1' })),
      );

      const stranger = testEnv.authenticatedContext('stranger').firestore();
      await assertFails(
        stranger
          .collection('dmCampaignInvites')
          .doc('CODE1234')
          .set(validDmCampaignInvite({ createdByUid: 'stranger' })),
      );
    });

    it('rejects a malformed invite create (missing keys) even from the owner', async () => {
      await seed((db) => db.collection('dmCampaigns').doc('campaign-1').set(validDmCampaign()));

      const dm = testEnv.authenticatedContext('dm-1').firestore();
      const malformed = { id: 'CODE1234', campaignId: 'campaign-1', createdByUid: 'dm-1' };
      await assertFails(dm.collection('dmCampaignInvites').doc('CODE1234').set(malformed));
    });

    it('any signed-in user can get an invite by its exact known code', async () => {
      await seed(async (db) => {
        await db.collection('dmCampaigns').doc('campaign-1').set(validDmCampaign());
        await db.collection('dmCampaignInvites').doc('CODE1234').set(validDmCampaignInvite());
      });

      const someone = testEnv.authenticatedContext('someone').firestore();
      await assertSucceeds(someone.collection('dmCampaignInvites').doc('CODE1234').get());
    });

    it('listing/querying dmCampaignInvites is always rejected (no code enumeration)', async () => {
      await seed((db) => db.collection('dmCampaignInvites').doc('CODE1234').set(validDmCampaignInvite()));

      const someone = testEnv.authenticatedContext('someone').firestore();
      await assertFails(someone.collection('dmCampaignInvites').get());
    });

    it('a direct client update (e.g. self-appending to usedByUids) is rejected — must go through redeemCampaignInvite', async () => {
      await seed((db) => db.collection('dmCampaignInvites').doc('CODE1234').set(validDmCampaignInvite()));

      const someone = testEnv.authenticatedContext('someone').firestore();
      await assertFails(
        someone
          .collection('dmCampaignInvites')
          .doc('CODE1234')
          .update({ usedByUids: ['someone'] }),
      );

      const owner = testEnv.authenticatedContext('dm-1').firestore();
      await assertFails(
        owner
          .collection('dmCampaignInvites')
          .doc('CODE1234')
          .update({ usedByUids: ['dm-1'] }),
      );
    });

    it('a direct client delete is rejected, even by the invite creator', async () => {
      await seed((db) => db.collection('dmCampaignInvites').doc('CODE1234').set(validDmCampaignInvite()));

      const owner = testEnv.authenticatedContext('dm-1').firestore();
      await assertFails(owner.collection('dmCampaignInvites').doc('CODE1234').delete());
    });
  });
});

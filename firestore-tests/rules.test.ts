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
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

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

function validDmCampaignInitiative(overrides: Record<string, unknown> = {}) {
  return {
    id: 'campaign-1',
    campaignId: 'campaign-1',
    ownerUid: 'dm-1',
    round: 1,
    combatants: [],
    updatedAtMs: 1,
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

function validChangeEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: 'owner-1-Combat-1000',
    uid: 'owner-1',
    tab: 'Combat',
    paths: ['combat.hp.current'],
    atMs: 1000,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    ...overrides,
  };
}

function validPresenceDoc(overrides: Record<string, unknown> = {}) {
  return {
    uid: 'owner-1',
    tab: 'Combat',
    lastActiveAt: firebase.firestore.FieldValue.serverTimestamp(),
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

  describe('dmCampaignInitiative (live shared initiative tracker, owner-only write, cross-doc get())', () => {
    it('the campaign owner can create/update/delete their own tracker', async () => {
      await seed((db) => db.collection('dmCampaigns').doc('campaign-1').set(validDmCampaign()));

      const dm = testEnv.authenticatedContext('dm-1').firestore();
      await assertSucceeds(dm.collection('dmCampaignInitiative').doc('campaign-1').set(validDmCampaignInitiative()));
      await assertSucceeds(dm.collection('dmCampaignInitiative').doc('campaign-1').update({ round: 2, updatedAtMs: 2 }));
      await assertSucceeds(dm.collection('dmCampaignInitiative').doc('campaign-1').delete());
    });

    it('a non-owner editor of the campaign can read the tracker but cannot create/update/delete it', async () => {
      await seed(async (db) => {
        await db
          .collection('dmCampaigns')
          .doc('campaign-1')
          .set(validDmCampaign({ editors: ['editor-1'] }));
        await db.collection('dmCampaignInitiative').doc('campaign-1').set(validDmCampaignInitiative());
      });

      const editor = testEnv.authenticatedContext('editor-1').firestore();
      await assertSucceeds(editor.collection('dmCampaignInitiative').doc('campaign-1').get());
      await assertFails(
        editor
          .collection('dmCampaignInitiative')
          .doc('campaign-1')
          .set(validDmCampaignInitiative({ ownerUid: 'editor-1' })),
      );
      await assertFails(editor.collection('dmCampaignInitiative').doc('campaign-1').update({ round: 2 }));
      await assertFails(editor.collection('dmCampaignInitiative').doc('campaign-1').delete());
    });

    it('a stranger (not on the campaign at all) cannot even read the tracker', async () => {
      await seed(async (db) => {
        await db.collection('dmCampaigns').doc('campaign-1').set(validDmCampaign());
        await db.collection('dmCampaignInitiative').doc('campaign-1').set(validDmCampaignInitiative());
      });

      const stranger = testEnv.authenticatedContext('stranger').firestore();
      await assertFails(stranger.collection('dmCampaignInitiative').doc('campaign-1').get());
    });

    it('rejects a malformed tracker create (missing keys) even from the owner', async () => {
      await seed((db) => db.collection('dmCampaigns').doc('campaign-1').set(validDmCampaign()));

      const dm = testEnv.authenticatedContext('dm-1').firestore();
      const malformed = { id: 'campaign-1', campaignId: 'campaign-1', ownerUid: 'dm-1' };
      await assertFails(dm.collection('dmCampaignInitiative').doc('campaign-1').set(malformed));
    });

    it('listing/querying dmCampaignInitiative is always rejected', async () => {
      await seed(async (db) => {
        await db.collection('dmCampaigns').doc('campaign-1').set(validDmCampaign());
        await db.collection('dmCampaignInitiative').doc('campaign-1').set(validDmCampaignInitiative());
      });

      const dm = testEnv.authenticatedContext('dm-1').firestore();
      await assertFails(dm.collection('dmCampaignInitiative').get());
    });

    it('a player added to the campaign after the tracker was created gets read access immediately, with no write to the tracker itself', async () => {
      await seed(async (db) => {
        await db
          .collection('dmCampaigns')
          .doc('campaign-1')
          .set(validDmCampaign({ editors: [] }));
        await db.collection('dmCampaignInitiative').doc('campaign-1').set(validDmCampaignInitiative());
      });

      const newEditor = testEnv.authenticatedContext('new-editor').firestore();
      await assertFails(newEditor.collection('dmCampaignInitiative').doc('campaign-1').get());

      await seed((db) =>
        db
          .collection('dmCampaigns')
          .doc('campaign-1')
          .update({ editors: ['new-editor'] }),
      );

      await assertSucceeds(newEditor.collection('dmCampaignInitiative').doc('campaign-1').get());
    });
  });

  describe('characterSheets/{id}/changes (COL-9, append-only change log subcollection)', () => {
    it('the owner can create and read a valid change entry', async () => {
      await seed((db) => db.collection('characterSheets').doc('sheet-1').set(validCharacterSheet()));

      const owner = testEnv.authenticatedContext('owner-1').firestore();
      await assertSucceeds(
        owner.collection('characterSheets').doc('sheet-1').collection('changes').doc('owner-1-Combat-1000').set(validChangeEntry()),
      );
      await assertSucceeds(owner.collection('characterSheets').doc('sheet-1').collection('changes').get());
    });

    it('an editor can create and read a valid change entry', async () => {
      await seed((db) => db.collection('characterSheets').doc('sheet-1').set(validCharacterSheet()));

      const editor = testEnv.authenticatedContext('editor-1').firestore();
      await assertSucceeds(
        editor
          .collection('characterSheets')
          .doc('sheet-1')
          .collection('changes')
          .doc('editor-1-Combat-2000')
          .set(validChangeEntry({ id: 'editor-1-Combat-2000', uid: 'editor-1', atMs: 2000 })),
      );
    });

    it('a stranger cannot create, get, or list change entries', async () => {
      await seed((db) => db.collection('characterSheets').doc('sheet-1').set(validCharacterSheet()));

      const stranger = testEnv.authenticatedContext('stranger').firestore();
      await assertFails(
        stranger
          .collection('characterSheets')
          .doc('sheet-1')
          .collection('changes')
          .doc('stranger-Combat-3000')
          .set(validChangeEntry({ id: 'stranger-Combat-3000', uid: 'stranger', atMs: 3000 })),
      );
      await assertFails(stranger.collection('characterSheets').doc('sheet-1').collection('changes').get());
    });

    it('nobody, including the owner, can update or delete an existing change entry', async () => {
      await seed(async (db) => {
        await db.collection('characterSheets').doc('sheet-1').set(validCharacterSheet());
        await db.collection('characterSheets').doc('sheet-1').collection('changes').doc('owner-1-Combat-1000').set(validChangeEntry());
      });

      const owner = testEnv.authenticatedContext('owner-1').firestore();
      await assertFails(
        owner
          .collection('characterSheets')
          .doc('sheet-1')
          .collection('changes')
          .doc('owner-1-Combat-1000')
          .update({ summary: 'edited after the fact' }),
      );
      await assertFails(owner.collection('characterSheets').doc('sheet-1').collection('changes').doc('owner-1-Combat-1000').delete());
    });

    it('rejects a malformed entry (missing paths, bad tab, oversized paths) even from the owner', async () => {
      await seed((db) => db.collection('characterSheets').doc('sheet-1').set(validCharacterSheet()));

      const owner = testEnv.authenticatedContext('owner-1').firestore();
      const changesRef = owner.collection('characterSheets').doc('sheet-1').collection('changes');

      await assertFails(changesRef.doc('bad-1').set({ id: 'bad-1', uid: 'owner-1', tab: 'Combat', atMs: 1 }));
      await assertFails(changesRef.doc('bad-2').set(validChangeEntry({ id: 'bad-2', tab: 'NotARealTab' })));
      await assertFails(
        changesRef.doc('bad-3').set(
          validChangeEntry({
            id: 'bad-3',
            paths: Array.from({ length: 51 }, (_, i) => `path.${i}`),
          }),
        ),
      );
    });
  });

  describe('characterSheets/{id}/presence (COL-6, per-viewer heartbeat)', () => {
    it('the owner can create/update their own presence doc', async () => {
      await seed((db) => db.collection('characterSheets').doc('sheet-1').set(validCharacterSheet()));

      const owner = testEnv.authenticatedContext('owner-1').firestore();
      await assertSucceeds(
        owner.collection('characterSheets').doc('sheet-1').collection('presence').doc('owner-1').set(validPresenceDoc()),
      );
      await assertSucceeds(
        owner
          .collection('characterSheets')
          .doc('sheet-1')
          .collection('presence')
          .doc('owner-1')
          .update({ lastActiveAt: firebase.firestore.FieldValue.serverTimestamp() }),
      );
    });

    it("an editor cannot create/update another uid's presence doc (impersonation check)", async () => {
      await seed((db) => db.collection('characterSheets').doc('sheet-1').set(validCharacterSheet()));

      const editor = testEnv.authenticatedContext('editor-1').firestore();
      await assertFails(
        editor
          .collection('characterSheets')
          .doc('sheet-1')
          .collection('presence')
          .doc('owner-1')
          .set(validPresenceDoc({ uid: 'owner-1' })),
      );
    });

    it('owner/editor can get/list any presence doc under a sheet they have access to', async () => {
      await seed(async (db) => {
        await db.collection('characterSheets').doc('sheet-1').set(validCharacterSheet());
        await db.collection('characterSheets').doc('sheet-1').collection('presence').doc('owner-1').set(validPresenceDoc());
        await db
          .collection('characterSheets')
          .doc('sheet-1')
          .collection('presence')
          .doc('editor-1')
          .set(validPresenceDoc({ uid: 'editor-1' }));
      });

      const editor = testEnv.authenticatedContext('editor-1').firestore();
      await assertSucceeds(editor.collection('characterSheets').doc('sheet-1').collection('presence').doc('owner-1').get());
      await assertSucceeds(editor.collection('characterSheets').doc('sheet-1').collection('presence').get());
    });

    it('a stranger cannot get/list/create/update/delete any presence doc', async () => {
      await seed(async (db) => {
        await db.collection('characterSheets').doc('sheet-1').set(validCharacterSheet());
        await db.collection('characterSheets').doc('sheet-1').collection('presence').doc('owner-1').set(validPresenceDoc());
      });

      const stranger = testEnv.authenticatedContext('stranger').firestore();
      await assertFails(stranger.collection('characterSheets').doc('sheet-1').collection('presence').doc('owner-1').get());
      await assertFails(stranger.collection('characterSheets').doc('sheet-1').collection('presence').get());
      await assertFails(
        stranger
          .collection('characterSheets')
          .doc('sheet-1')
          .collection('presence')
          .doc('stranger')
          .set(validPresenceDoc({ uid: 'stranger' })),
      );
      await assertFails(stranger.collection('characterSheets').doc('sheet-1').collection('presence').doc('owner-1').delete());
    });

    it('a removed editor can still delete their own stale presence doc after losing sheet access', async () => {
      await seed(async (db) => {
        await db
          .collection('characterSheets')
          .doc('sheet-1')
          .set(validCharacterSheet({ editors: ['ex-editor'] }));
        await db
          .collection('characterSheets')
          .doc('sheet-1')
          .collection('presence')
          .doc('ex-editor')
          .set(validPresenceDoc({ uid: 'ex-editor' }));
        await db.collection('characterSheets').doc('sheet-1').update({ editors: [] });
      });

      const exEditor = testEnv.authenticatedContext('ex-editor').firestore();
      await assertSucceeds(exEditor.collection('characterSheets').doc('sheet-1').collection('presence').doc('ex-editor').delete());
    });

    it('rejects a malformed presence doc (missing lastActiveAt, bad tab)', async () => {
      await seed((db) => db.collection('characterSheets').doc('sheet-1').set(validCharacterSheet()));

      const owner = testEnv.authenticatedContext('owner-1').firestore();
      const presenceRef = owner.collection('characterSheets').doc('sheet-1').collection('presence');

      await assertFails(presenceRef.doc('owner-1').set({ uid: 'owner-1', tab: 'Combat' }));
      await assertFails(presenceRef.doc('owner-1').set(validPresenceDoc({ tab: 'NotARealTab' })));
    });
  });
});

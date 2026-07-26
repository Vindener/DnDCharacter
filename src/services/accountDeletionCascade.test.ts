import { describe, expect, it } from 'vitest';
import { decideCascadeAction } from './accountDeletionCascade';

describe('decideCascadeAction', () => {
  it('sole owner, no editors -> delete', () => {
    const action = decideCascadeAction({ ownerUid: 'me', owners: ['me'], editors: [] }, 'me');
    expect(action).toEqual({ type: 'delete' });
  });

  it('sole owner, one editor -> transferOwnership to that editor', () => {
    const action = decideCascadeAction({ ownerUid: 'me', owners: ['me'], editors: ['editorA'] }, 'me');
    expect(action).toEqual({ type: 'transferOwnership', newOwnerUid: 'editorA' });
  });

  it('sole owner, several editors, no explicit choice -> transferOwnership to the first editor', () => {
    const action = decideCascadeAction({ ownerUid: 'me', owners: ['me'], editors: ['editorA', 'editorB'] }, 'me');
    expect(action).toEqual({ type: 'transferOwnership', newOwnerUid: 'editorA' });
  });

  it('sole owner, several editors, explicit choice -> transferOwnership to the chosen editor', () => {
    const action = decideCascadeAction({ ownerUid: 'me', owners: ['me'], editors: ['editorA', 'editorB'] }, 'me', 'editorB');
    expect(action).toEqual({ type: 'transferOwnership', newOwnerUid: 'editorB' });
  });

  it('sole owner, chosen editor not actually an editor -> falls back to first editor', () => {
    const action = decideCascadeAction({ ownerUid: 'me', owners: ['me'], editors: ['editorA', 'editorB'] }, 'me', 'someoneElse');
    expect(action).toEqual({ type: 'transferOwnership', newOwnerUid: 'editorA' });
  });

  it('one of several owners -> removeFromOwners', () => {
    const action = decideCascadeAction({ ownerUid: 'me', owners: ['me', 'ownerB'], editors: ['editorA'] }, 'me');
    expect(action).toEqual({ type: 'removeFromOwners' });
  });

  it('editor only, not in owners -> removeFromEditors', () => {
    const action = decideCascadeAction({ ownerUid: 'ownerB', owners: ['ownerB'], editors: ['me', 'editorA'] }, 'me');
    expect(action).toEqual({ type: 'removeFromEditors' });
  });

  it('neither owner nor editor -> noop', () => {
    const action = decideCascadeAction({ ownerUid: 'ownerB', owners: ['ownerB'], editors: ['editorA'] }, 'me');
    expect(action).toEqual({ type: 'noop' });
  });

  it('missing owners/editors arrays -> treated as empty, sole-owner-via-ownerUid still deletes', () => {
    const action = decideCascadeAction(
      { ownerUid: 'me', owners: undefined as unknown as string[], editors: undefined as unknown as string[] },
      'me',
    );
    expect(action).toEqual({ type: 'delete' });
  });

  it('owner recognized via legacy ownerUid field even if owners array is missing me', () => {
    const action = decideCascadeAction({ ownerUid: 'me', owners: [], editors: ['editorA'] }, 'me');
    expect(action).toEqual({ type: 'transferOwnership', newOwnerUid: 'editorA' });
  });
});

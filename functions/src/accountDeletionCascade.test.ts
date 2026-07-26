import { describe, expect, it } from 'vitest';
import { decideCascadeAction } from './accountDeletionCascade';

describe('decideCascadeAction (functions mirror)', () => {
  it('sole owner, no editors -> delete', () => {
    expect(decideCascadeAction({ ownerUid: 'me', owners: ['me'], editors: [] }, 'me')).toEqual({ type: 'delete' });
  });

  it('sole owner, editors -> transferOwnership', () => {
    expect(decideCascadeAction({ ownerUid: 'me', owners: ['me'], editors: ['editorA'] }, 'me')).toEqual({
      type: 'transferOwnership',
      newOwnerUid: 'editorA',
    });
  });

  it('one of several owners -> removeFromOwners', () => {
    expect(
      decideCascadeAction({ ownerUid: 'me', owners: ['me', 'ownerB'], editors: [] }, 'me'),
    ).toEqual({ type: 'removeFromOwners' });
  });

  it('editor only -> removeFromEditors', () => {
    expect(
      decideCascadeAction({ ownerUid: 'ownerB', owners: ['ownerB'], editors: ['me'] }, 'me'),
    ).toEqual({ type: 'removeFromEditors' });
  });

  it('explicit chosen owner wins over first-editor default', () => {
    expect(
      decideCascadeAction({ ownerUid: 'me', owners: ['me'], editors: ['editorA', 'editorB'] }, 'me', 'editorB'),
    ).toEqual({ type: 'transferOwnership', newOwnerUid: 'editorB' });
  });

  it('neither owner nor editor -> noop', () => {
    expect(
      decideCascadeAction({ ownerUid: 'ownerB', owners: ['ownerB'], editors: [] }, 'me'),
    ).toEqual({ type: 'noop' });
  });
});

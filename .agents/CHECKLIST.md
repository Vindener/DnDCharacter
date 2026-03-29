# CHECKLIST.md

## Before editing
- Read the target file.
- Read the related types.
- Read the related store/service if data is involved.
- Check whether the change affects local data, cloud data, or both.

## Before finishing
- Confirm imports are correct.
- Confirm no new `any` was introduced.
- Confirm Android interaction feedback is acceptable.
- Confirm formatting is clean.
- If possible, run `npx tsc --noEmit`.
- If possible, run `npm run format`.

## In the final report
- List changed files.
- State what behavior changed.
- State what was not changed.
- Mention remaining technical debt if relevant.

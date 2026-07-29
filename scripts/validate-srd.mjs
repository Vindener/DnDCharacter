// Build-time Zod validation for SRD data (PERF-1 / P3.2). Runtime `getSrdX()` getters use a
// typed cast, not Zod, so this script is the only place that actually re-validates the JSON
// against the schemas in src/domain/srd/schemas.ts before it ships.
import { validateAllSrdCollections } from '../src/domain/srd/srdRepository.ts';

try {
  validateAllSrdCollections();
  console.log('[validate-srd] OK — усі 11 SRD-колекцій відповідають Zod-схемам.');
} catch (error) {
  console.error('[validate-srd] FAILED — SRD JSON не відповідає схемі:');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

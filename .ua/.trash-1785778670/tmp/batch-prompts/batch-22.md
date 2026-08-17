Analyze these files and produce GraphNode and GraphEdge objects.
Project root: `/home/vindener/Files/Projects/DnDCharacter`
Project: mythgate-5e-companion
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, batch, powershell, properties, pro, keystore, jar, rules, config, unknown, webp
Batch: 22/31
Skill directory (for bundled scripts): /home/vindener/.config/Claude/local-agent-mode-sessions/66266aa7-f57d-4a5d-9713-b32eeaf519d7/e4033696-df68-456f-8d5e-94472c73dd1b/rpm/plugin_015js5dByux9PcVqxkJKkg3J/skills/understand
Output: write to `/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/batch-22.json` (single-file mode) OR `batch-22-part-<k>.json` (split mode, per Step B of your output protocol).

Pre-resolved import data for this batch (use directly — do NOT re-resolve imports from source):

```json
{
  "docs/audit-2026-07.md": [],
  "docs/campaign-management-prompts.md": [],
  "docs/claude-code-prompts.md": [],
  "docs/collaborative-editing.md": [],
  "docs/dnd-product-guidelines.md": [],
  "docs/loading-states-and-skeleton.md": [],
  "docs/privacy-policy.en.md": [],
  "docs/privacy-policy.uk.md": [],
  "docs/product-collaboration-stage-4.md": [],
  "docs/product-dm-experience-stage-5.md": [],
  "docs/product-foundation-stage-1.md": [],
  "docs/product-homebrew-stage-3.md": [],
  "docs/product-redesign-stage-2.md": [],
  "docs/release-checklist-1.0.0.md": [],
  "docs/release-plan-google-play.md": [],
  "docs/sprint-plan.md": [],
  "docs/store-listing.md": [],
  "docs/ui-kit.md": [],
  "docs/ux-ui-roadmap.md": []
}
```

Cross-batch neighbors with their exported symbols (confidence boost for cross-batch edges):

```json
{}
```

Files to analyze in this batch (every entry MUST be passed through to `batchFiles` with all four fields — `path`, `language`, `sizeLines`, `fileCategory`):

1. `docs/audit-2026-07.md` (279 lines, language: `markdown`, fileCategory: `docs`)
2. `docs/campaign-management-prompts.md` (564 lines, language: `markdown`, fileCategory: `docs`)
3. `docs/claude-code-prompts.md` (1069 lines, language: `markdown`, fileCategory: `docs`)
4. `docs/collaborative-editing.md` (258 lines, language: `markdown`, fileCategory: `docs`)
5. `docs/dnd-product-guidelines.md` (81 lines, language: `markdown`, fileCategory: `docs`)
6. `docs/loading-states-and-skeleton.md` (53 lines, language: `markdown`, fileCategory: `docs`)
7. `docs/privacy-policy.en.md` (58 lines, language: `markdown`, fileCategory: `docs`)
8. `docs/privacy-policy.uk.md` (58 lines, language: `markdown`, fileCategory: `docs`)
9. `docs/product-collaboration-stage-4.md` (77 lines, language: `markdown`, fileCategory: `docs`)
10. `docs/product-dm-experience-stage-5.md` (111 lines, language: `markdown`, fileCategory: `docs`)
11. `docs/product-foundation-stage-1.md` (288 lines, language: `markdown`, fileCategory: `docs`)
12. `docs/product-homebrew-stage-3.md` (105 lines, language: `markdown`, fileCategory: `docs`)
13. `docs/product-redesign-stage-2.md` (168 lines, language: `markdown`, fileCategory: `docs`)
14. `docs/release-checklist-1.0.0.md` (125 lines, language: `markdown`, fileCategory: `docs`)
15. `docs/release-plan-google-play.md` (324 lines, language: `markdown`, fileCategory: `docs`)
16. `docs/sprint-plan.md` (155 lines, language: `markdown`, fileCategory: `docs`)
17. `docs/store-listing.md` (163 lines, language: `markdown`, fileCategory: `docs`)
18. `docs/ui-kit.md` (93 lines, language: `markdown`, fileCategory: `docs`)
19. `docs/ux-ui-roadmap.md` (82 lines, language: `markdown`, fileCategory: `docs`)

**Additional context from main session:**

Project: mythgate-5e-companion — D&D 5e companion app (React Native/Expo) with Firebase collaborative character sheets, bestiary, spellbook, campaign/DM tools.
Languages: typescript, javascript, json, markdown, yaml, kotlin, gradle, xml, and others (see above).

> **Language directive**: Generate all textual content (summaries, descriptions, tags, titles, languageNotes, languageLesson) in **Ukrainian**. Maintain technical accuracy while using natural, native-level phrasing in Ukrainian. Keep technical terms in English when no standard translation exists (e.g., "middleware", "hook", "barrel").

---
created: 2026-05-11
last_modified: 2026-05-11
revisions: 0
doc_type: [REFERENCE]
---

# tree-sitter-m — Documentation Index

> First-pass index generated 2026-05-11. Labels follow the shared vocabulary below; the same vocabulary is used across all m-dev-tools repos.

## Vocabulary

Each doc is labeled `[TYPE · type? · connection · connection?]`.

**Types** — `HISTORY` · `ARCHITECTURE` · `DESIGN` · `ADR` · `SPEC` · `REFERENCE` · `GUIDE` · `TUTORIAL` · `ROADMAP` · `PLAN` · `RESEARCH` · `SURVEY` · `GAP-ANALYSIS` · `STATUS` · `EXPLAINER` · `NOTES` · `WORKED-EXAMPLE` · `SETUP` · `INTEGRATION` · `PROPOSAL` · `BUILD-LOG` · `CHANGELOG` · `POSTMORTEM`

**Repo connections** — `history` · `function` · `design` · `architecture` · `planning` · `implementation`

## Top-level

- **`spec.md`** — `[SPEC · DESIGN · design · architecture]` Full v0.1 specification covering scope, architectural decisions, language structure, build pipeline, and v1.0 success criteria.
- **`build-log.md`** — `[BUILD-LOG · HISTORY · history · implementation]` Chronological per-milestone progression log capturing deliveries, decisions made mid-build, and drift from spec.
- **`discoveries.md`** — `[GAP-ANALYSIS · NOTES · implementation · function]` DISC-NNN findings from real-world parser use, covering upstream m-standard gaps and intentional parser-side limitations.
- **`tree-sitter-notes.md`** — `[REFERENCE · NOTES · implementation · design]` Tree-sitter lexer and parser gotchas with workaround patterns; mandatory reading before adding grammar rules.
- **`vista-parse-error-categories.md`** — `[GAP-ANALYSIS · PLAN · planning · implementation]` Living triage of remaining VistA-corpus parse errors bucketed into actionable categories.

## `adr/` — Architecture Decision Records for the grammar

- **`adr/README.md`** — `[REFERENCE · architecture]` Existing ADR index — see for full per-ADR detail.
- **`adr/AD-01-source-grammar-surface.md`** — `[ADR · design · architecture]` Source keyword tables from m-standard's union grammar-surface rather than any single M standard.
- **`adr/AD-02-hand-code-language-structure.md`** — `[ADR · design · architecture]` Hand-code invariant structural rules in `grammar.js`; data-drive the keyword tables from m-standard.
- **`adr/AD-03-standard-status-on-nodes.md`** — `[ADR · design · function]` Stamp every recognised keyword node with a `standard_status` tier attribute via sidecar metadata lookup.
- **`adr/AD-04-pin-mstandard-schema.md`** — `[ADR · architecture · planning]` Pin the consumed `m-standard` schema_version so breaking upstream changes require a deliberate major bump.
- **`adr/AD-05-real-source-corpus.md`** — `[ADR · design · implementation]` Validate against three test layers including the full 39,330-routine VistA corpus as the reality gate.
- **`adr/AD-06-tree-sitter-bindings.md`** — `[ADR · architecture · implementation]` Ship Node, Rust, Python, and Go bindings via tree-sitter's standard scaffold with no bespoke binding code.

# tree-sitter-m

A [tree-sitter](https://tree-sitter.github.io/) grammar for the
M (MUMPS) programming language.

> **Status:** v0.1 ready for first publish. Grammar at **99.06%
> clean on the full 39,330-routine VistA corpus**; 110 passing
> corpus tests; per-tier coverage gate green at 347/347; 10k-line
> synthetic routine parses in 78.6ms (under the 100ms spec budget);
> all four bindings (Node, Rust, Python, Go) scaffolded and passing
> on the Linux/macOS/Windows CI matrix. v1.0 blocked on first
> publish (#7) and at least one editor integration (#8 — VS Code
> targeted). See [`STATUS.md`](STATUS.md) for the v1.0 punch list,
> [`RELEASE.md`](RELEASE.md) for publish steps, and
> [`docs/build-log.md`](docs/build-log.md) for the per-feature
> progression history.

## Why this exists

No production-quality tree-sitter grammar for M exists today. M
development tooling — language servers, refactoring tools,
AST-based linters, code search, AI agents — has historically
lacked a shared parsing substrate. `tree-sitter-m` aims to be that
substrate.

The grammar:

- recognises tokens from **all** major M sources (AnnoStd 1995,
  YottaDB, InterSystems IRIS's M layer) — so it can read any real
  M codebase including VistA, OSEHRA, and YDB applications,
- stamps each recognised token with `standard_status` metadata so
  downstream tools can classify portability tier without re-parsing
  (see `lib/stamp.js`),
- is **generated mechanically** from
  [`m-standard`](https://github.com/m-dev-tools/m-standard)'s curated data
  (specifically `integrated/grammar-surface.json`) so it stays in sync
  with the source documentation,
- handles M's structural quirks via a small external scanner
  (`src/scanner.c`) — the two-space rule for argumentless commands,
  trailing-whitespace-before-EOL, and `?N` tab-to-column in WRITE
  format-control are all parser-state-aware tokens.

## Scope

tree-sitter-m covers **M and M dialects** — AnnoStd, YottaDB, IRIS's M
layer, plus the de-facto extensions VistA actually uses (case-
insensitive keywords, multi-letter pattern codes `?.ANP`, negated
operators `'?`/`'&`/`'!`, comparison shorthands `>=`/`<=`/`!=`,
numeric local-label calls `D 12(args)`, system globals `^$JOB`,
USE/OPEN parenthesised I/O parameters, and so on).

**Out of scope: InterSystems ObjectScript.** `##class(...)`,
`&sql(...)`, `obj.method()`, `obj.property=val`, `##super` etc.
are ObjectScript — a separate scripting language layered on top
of M's runtime, not a dialect of M. The right home for parsing
those is a sibling `tree-sitter-objectscript` grammar that can
compose with tree-sitter-m when a file mixes both. See
[`docs/spec.md`](docs/spec.md) §2 for the full scope decision.

## What it does NOT do

`tree-sitter-m` is a parser, not a compiler, formatter, or linter.

- **Standards enforcement** (pragmatic / SAC / operational) lives
  downstream in [`m-cli`](https://github.com/m-dev-tools/m-cli)'s
  `m lint`, which consumes both this grammar's AST and
  [`m-standard`](https://github.com/m-dev-tools/m-standard)'s tier
  classifications.
- **Cross-routine resolution**, **type inference**, and **semantic
  analysis** belong in tooling layers above the parser.
- **InterSystems ObjectScript** is permanently out of scope (see
  above).

## Relationship to the project family

```
m-standard      →   integrated/grammar-surface.json   →   tree-sitter-m
   (data)              (versioned data contract)         (this project)

tree-sitter-m   →   bindings: Node / Rust / Python / Go    →   m-cli (m fmt / m lint /
 (this project)     (npm, crates.io, go modules; Python:        m test / m coverage / m doc)
                     wheels attached to GitHub Releases)
                                                           →   tree-sitter-m-vscode
                                                           →   m-stdlib-vscode
                                                           →   AI agents / other tooling
```

`tree-sitter-m` is a strict downstream consumer of `m-standard` and
contributes nothing back upstream. See [`docs/spec.md`](docs/spec.md)
§17 for the full contract.

## Build

```bash
# regenerate keyword tables from m-standard's grammar-surface.json
npm run build-grammar

# regenerate parser.c from grammar.js
npm run generate

# run the corpus tests
npm test

# real-source smoke gate against any M corpus (default for the m-dev-tools
# org is m-modern-corpus; maintainers also run against a VistA checkout)
node tools/smoke-corpus.js ~/projects/m-modern-corpus

# bucket remaining ERROR nodes by syntactic shape (triage tool)
node tools/error-buckets.js ~/projects/m-modern-corpus --sample 1000
```

## Bindings

Once published (see [`RELEASE.md`](RELEASE.md)), the Node, Rust,
and Go bindings will be installable from their respective
ecosystems:

```bash
npm install tree-sitter-m tree-sitter            # Node
cargo add tree-sitter-m tree-sitter              # Rust
go get github.com/m-dev-tools/tree-sitter-m          # Go
```

The Python binding ships as **prebuilt wheels attached to each GitHub
Release** (cibuildwheel-built; cp310-abi3, so one wheel covers Python
3.10+). No PyPI publication. Install by URL:

```bash
pip install tree-sitter \
  https://github.com/m-dev-tools/tree-sitter-m/releases/download/v0.1.1/tree_sitter_m-0.1.1-cp310-abi3-manylinux_2_5_x86_64.manylinux1_x86_64.manylinux_2_17_x86_64.manylinux2014_x86_64.whl
```

Wheels for all four platforms (linux x64/arm64, macos arm64, windows x64)
are attached to each release; pick the one matching your platform.
For uv's `[tool.uv.sources]` per-platform-marker template see
[`RELEASE.md`](RELEASE.md) §5.5.

**Node version requirement.** The Node binding requires
**Node 22 LTS**. Upstream `tree-sitter@0.25.0` (the JS runtime)
fails to compile against Node 24's V8 headers — install on Node 24
errors during `npm install` with a `node_object_wrap.h` /
`v8-weak-callback-info.h` complaint about an incomplete type. Use
`nvm install 22 && nvm use 22` until upstream tree-sitter ships a
Node 24-compatible release. Other bindings (Rust, Python, Go) have
no equivalent host-version constraint.

**Prebuilt binaries.** `.github/workflows/prebuilds.yml` runs on
every `v*` tag push and produces N-API binaries for linux x64/arm64,
macos arm64, and windows x64 via `prebuildify`. Each release ships
with both the Node prebuild tarballs and Python wheels attached
(see [`RELEASE.md`](RELEASE.md) §3). `node-gyp-build` consumes the
prebuilds at npm-install time so end users don't need a C toolchain.

## Documentation

| File | What's in it |
|------|---|
| [`STATUS.md`](STATUS.md) | Progression vs spec, v1.0 punch list, prioritised TODOs |
| [`RELEASE.md`](RELEASE.md) | Step-by-step publish checklist (npm / crates.io / Go / GitHub) |
| [`docs/spec.md`](docs/spec.md) | Full design, milestones, success criteria |
| [`docs/adr/`](docs/adr/) | Architectural decisions (AD-01..06) — one file per decision |
| [`docs/build-log.md`](docs/build-log.md) | Chronological per-feature progression (every commit) |
| [`docs/discoveries.md`](docs/discoveries.md) | Findings surfaced by real-world use — upstream gaps and parser-side limitations (DISC-NNN) |
| [`docs/tree-sitter-notes.md`](docs/tree-sitter-notes.md) | Tree-sitter implementation notes — token precedence rules, regex limitations, recurring patterns. **Read before adding grammar rules.** |
| [`CLAUDE.md`](CLAUDE.md) | Hard rules and project conventions |

## License

AGPL-3.0. Matches `m-standard`. See [`LICENSE`](LICENSE).

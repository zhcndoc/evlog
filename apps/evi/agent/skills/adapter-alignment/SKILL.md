---
name: adapter-alignment
description: Twice-monthly check that evlog's drain adapters still send what each provider's own client sends. Rotates two adapters per run through the pins in .agents/skills/create-adapter/references/upstream-alignment.md, diffs endpoint, auth, payload shape, level mapping, batch limits, and retry behavior against the official client at its current version, opens ready pull requests for mechanical mismatches, files philosophy mismatches in Linear, and moves the pin forward. Load this when the adapter-alignment schedule fires, or when Hugo asks whether an adapter is still aligned with Sentry, Datadog, Axiom, PostHog, Loki, ClickHouse, Better Stack, HyperDX, or OTLP.
---

# Adapter alignment

evlog ships adapters for providers whose APIs and clients move on their own. The e2e suite proves a destination still accepts our payload; nothing proves the payload is what the provider's own client would have sent. This run closes that gap for two adapters at a time, so every third-party adapter is compared about every two months.

The question is always the same: given one wide event, would the official client and evlog produce the same request? Where they differ, is the difference a choice evlog made on purpose, or drift?

## 1. Pick the two adapters

Read `.agents/skills/create-adapter/references/upstream-alignment.md` in `/workspace/repo`. Take the two rows with the oldest `Aligned to`, treating `unset` as oldest. Break a tie by table order. Skip a row only when a run in the last two weeks already covered it and record why.

## 2. Read both sides

For each adapter:

- **Ours**: `packages/evlog/src/adapters/<name>.ts`, its unit test under `packages/evlog/test/adapters/`, its e2e under `packages/evlog/test/e2e/` when one exists, and its docs page under `apps/docs/content/4.integrate/adapters/`.
- **Theirs**: the ingest documentation URL and the `Start here` files in the official client at its latest published version. Read the version with `npm view <package> version` from the sandbox. Read source with `github__getFileContent` at the matching tag; a `Start here` path that no longer exists is a limitation to record, and the run locates the replacement with `github__searchCode` before continuing. Do not reason from memory of the client; read the lines.

Record the client version and the files read. They are the evidence for everything below.

## 3. Compare

Walk the list under "What a comparison covers" in the reference file. For each property, write one line: ours, theirs, same or different. A difference becomes one of:

- **Mismatch**: the provider stores or indexes the event differently because of it (wrong default site, a renamed field, a level the provider does not recognise, a limit we exceed, an endpoint the provider deprecated). Evidence is the upstream line and ours.
- **Choice**: evlog differs on purpose and the adapter or docs say so (we batch where they stream, we flatten where they nest). Record it; do not file it. If nothing says so, it is a question, not a choice.
- **Note**: evlog is stricter than the client with no effect on what the provider stores.

The e2e test is part of the comparison. An adapter with no e2e file (Datadog and HyperDX today) gets that gap recorded as a proposal unless one already exists in Linear.

## 4. Deliver

**Mechanical mismatch → ready PR.** A wrong default, a missing or renamed field, a stale endpoint, a limit to lower. Follow `contributing`: branch off `main` in `/workspace/repo`, write the failing regression test first, fix, run `pnpm run lint`, `pnpm run typecheck`, and `pnpm --filter evlog exec vitest run test/adapters/<name>.test.ts`, then the full suite. Add a changeset; an adapter change is user-facing. Update the adapter docs page when it states the old value. The PR body shows the upstream line and ours side by side, names the client version, and states what the provider will store differently after the change. Read CI, fix what fails, request `hugorcd` as reviewer. One mismatch per PR unless several are the same kind on one adapter; then one PR for that adapter. At most two PRs per run.

**Philosophy mismatch or question → Linear issue** via `linear__save_issue` on the evlog team. State what the client does, what evlog does, the upstream evidence, who would notice, and the decision to make. Search `linear__list_issues` first; a recurring mismatch updates its issue.

**Move the pin.** In a real run, once every mismatch on an adapter is either in a PR, in an issue, or recorded as a choice, update that row's `Aligned to` to `<package> <version> @ <short SHA of main>` in the same PR as the fixes, or in its own `docs:` PR when nothing needed fixing. A pin never moves past a mismatch that has no destination.

Then post one line per adapter to the thread: aligned, or the PR and issue links inline.

## When nothing is warranted

Both adapters match their client: move the two pins in one `docs:` PR and say so in one line. Never invent a mismatch, never file an issue to record that an adapter is aligned, and never open a PR that only touches the pin table alongside a code change.

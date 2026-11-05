# Orchestrator

This is a repo for orchestrator skills that orchestrate workflows with subagents.

It turns an expensive main agent into an executive orchestrator. Instead of doing the work itself, it plans, dispatches execution to cheap subagents, and concentrates its own reasoning on understanding, evaluation, and summarization.

## Purpose

This repository builds the orchestrator skill set; it does not execute it. `./skills/orchestrator/` is a distributable artifact installed into other projects, and the adapter and add-on directories under `./skills/` are independently installable. Do not orchestrate tasks, dispatch subagents, or run the skill's workflow inside this repository — exercise the skill in a separate scratch project. The local checkout is the source of truth; an installed copy (e.g. `~/.agents/skills/orchestrator/`) may be stale.

## Skill Layout

| Skill                                        | Kind    | Purpose                                                       |
| -------------------------------------------- | ------- | ------------------------------------------------------------- |
| `orchestrator`                               | core    | Host-agnostic planning, dispatch, review, and summary         |
| `orchestrator-adapter-opencode`              | adapter | OpenCode dispatch, config, permissions, resume, model control |
| `orchestrator-addon-test-driven-development` | addon   | Opt-in strict RED-GREEN-REFACTOR enforcement                  |

The bare `orchestrator` name is the core entry point. Satellite skills use `orchestrator-adapter-<host>` or `orchestrator-addon-<name>`; identifiers use `addon`, prose uses "add-on". The prefix is only a discovery aid; `orchestrator-kind` is authoritative, and the suffix identifies the instance.

The repository currently ships the OpenCode adapter. Other hosts use generic probing until an adapter is added.

## Skill Contracts

Every skill lives at `skills/<name>/SKILL.md`, and the frontmatter `name` matches the directory name.

### Role vocabulary

The role set is fixed at seven, in this order:

```text
explorer, researcher, implementer, tester, debugger, reviewer, verifier
```

Use these exact lowercase names in adapter dispatch tables and in add-on `####` headings. Do not add aliases or Title Case variants. Adapters must list all seven roles; add-ons list only the roles they modify.

### Frontmatter metadata

`name` and `description` are standard Agent Skills fields; `name` matches the directory. The orchestrator metadata contract is:

| Field                            | Required for | Type                 | Values / rule                                        |
| -------------------------------- | ------------ | -------------------- | ---------------------------------------------------- |
| `metadata`                       | all          | `map<string,string>` | flat; no nested maps or arrays                       |
| `metadata.orchestrator-kind`     | all          | string (closed)      | `core`, `adapter`, `addon`                           |
| `metadata.orchestrator-contract` | all          | string (closed)      | `"1"` (quoted)                                       |
| `metadata.orchestrator-host`     | adapters     | string (open)        | lowercase host slug, no version; example: `opencode` |

A skill declares exactly one kind; omit fields that do not apply. `orchestrator-kind` and `orchestrator-contract` are closed: an unknown value is invalid. `orchestrator-host` is an open identifier: lowercase, hyphenated, version-free, and matching the skill-name suffix. The add-on instance matches the skill-name suffix and the plan and ledger value. Adding a host or add-on does not change the metadata contract; adding a new kind requires a contract section and a version bump. Contract version `1` covers the core, adapter, and add-on contracts. After the first release, bump the affected contract and update every skill that implements it when a required heading or field changes.

### Core skill

`skills/orchestrator/` is host-agnostic. It must not name host-specific tools, config schemas, or resume mechanics outside its generic-probing section. It resolves an adapter before any dispatch and an add-on only after explicit user consent: a direct request or acceptance of a need-based offer. A plan header naming one records that request.

### Adapter contract

`SKILL.md` must contain these headings, in this order:

```text
## Detection
## Dispatch Mapping
## Resume
## Model Control
## Permissions
## Limits
## Gaps
```

- `Detection` identifies the host and version.
- `Dispatch Mapping` lists all seven roles and maps each to a concrete tool and target. Use version subsections when the host has more than one dispatch schema.
- `Resume` says how to continue a worker, or that no resume exists.
- `Model Control` says where the model is pinned or passed.
- `Permissions` maps the base permission tiers to recommended host enforcement and names gaps. The orchestrator never edits host configuration; the user applies recommendations.
- `Limits` records host concurrency, depth, and version constraints without restating the core caps.
- `Gaps` names every unsupported capability.
- Details belong in `references/`, linked one level deep. Command registration is a reference detail, not a contract section.

### Add-on contract

`SKILL.md` contains `## Orchestrator Integration` and `### Activation`. Include other sections only when they have content; omit empty sections and role headings instead of writing a placeholder such as `None.`

Within `## Orchestrator Integration`, use this order. Preamble and standalone-use sections may precede or follow it:

```text
## Orchestrator Integration
### Activation
### Planning
### Task Briefs
### Dispatch
#### <role>
### Evidence
### Ledger
```

- `Activation` defines the add-on's `Needed` test and the exact prompts used when the add-on is requested but not needed and when it is needed but not requested. It also says whether an override is possible when the add-on cannot apply.
- Activation requires explicit user consent: a direct request or acceptance of a need-based offer. It must never activate silently. The description must not auto-trigger on ordinary coding.
- `Planning` says how the plan's step profile and review focus change.
- `Task Briefs` says what every task brief must add.
- `Dispatch` contains one `#### <role>` heading per role the add-on modifies, using the exact lowercase role name, in canonical order. The body under each heading, excluding the heading, is copied verbatim into that role's `[ADDON_SECTION]` placeholder and rendered as `## Add-on Instructions`.
- `Evidence` defines what the implementer reports and what reviewers verify.
- `Ledger` defines the plan-header and execution-ledger lines.
- Add-ons never dispatch, never edit the core skill, and never weaken base permissions.

### Add-on selection

An add-on is optional. Installing one makes it available; it does not activate it. Activation requires explicit user consent: either the user requests the add-on, or the user accepts an offer the orchestrator makes because the add-on is needed.

- **Installed** — the add-on skill is discoverable in the current environment.
- **Requested** — the user has asked for the add-on in this session, including by accepting an offer, or the live plan header records that request.
- **Needed** — the add-on's own criteria say it would benefit this plan, and the base workflow does not already provide the same benefit. Installation and request do not make an add-on needed. Each add-on defines its `Needed` test in `### Activation`.
- **Not applicable** — the add-on cannot apply to this plan at all. This is a `Needed = no` case: explain why it does not apply and continue with the base workflow. The add-on's `### Activation` says whether an override is possible.

| Installed | Requested | Needed | Behavior                                                            |
| --------- | --------- | ------ | ------------------------------------------------------------------- |
| yes       | yes       | yes    | Activate the add-on.                                                |
| yes       | yes       | no     | Ask: skip (recommended) or use anyway. Honor the answer.            |
| yes       | no        | yes    | Offer it; ask whether to use it. Honor the answer.                  |
| yes       | no        | no     | Ignore it; continue with the base workflow.                         |
| no        | yes       | yes    | Ask to install it; keep continue-without and stop.                  |
| no        | no        | yes    | Ask whether to use it; if yes, ask to install it.                   |
| no        | yes       | no     | Ask: skip (recommended) or use anyway; only “use” leads to install. |
| no        | no        | no     | Ignore it; continue with the base workflow.                         |

Selection rules:

- Scan available add-ons at planning start. A requested add-on is always a candidate. If the environment exposes no add-on catalog, assess only requested or plan-named add-ons.
- Assess `Needed` during planning, before the plan is saved. Record the decision so execution does not re-ask.
- Decide `Needed` before installation. Do not ask a user to install an add-on you are about to recommend skipping.
- Reading an add-on's description or `### Activation` criteria to assess `Needed` is selection, not activation. Do not apply any add-on instructions until the user consents.
- A “use” answer with the add-on missing opens the install gate. Installation stops the session until the user installs the skill and restarts or resumes.
- A declined offer is final for the session. Follow the user and record a ruling; do not re-ask.
- Record every non-default outcome in the ledger: declined, skipped, overridden, or not applicable.
- The plan header records only `**Add-on:** none` or the active add-on. Use an optional `**Add-on rationale:**` line for a non-default selection: declined, skipped, overridden, or not applicable.

Assess `Needed` for the current plan's work, not for the repository as a whole. The table applies independently to each candidate add-on; the current contract still records one active add-on in the plan header. If several are needed, ask the user which one to activate.

When a candidate add-on is `Needed = no` because it cannot apply at all, replace the skip/use question with a plain explanation and continue with the base workflow. Do not offer an override that cannot work.

An add-on that predates this contract and does not define a `Needed` test is never offered proactively. When requested, it follows its existing activation rules as if `Needed = yes`.

An uninstalled add-on can be `Needed` only when it is identified by the user, the live plan, or a skill catalog. The orchestrator does not guess uninstalled capabilities.

These rules extend add-on contract version `1`: they add required content to `### Activation` but do not change its headings or metadata fields.

### Validation

The `skills` CLI validates the basic skill format and discovery; use `npx skills add . --list` as the discovery smoke test. Review contract headings and role names against this section when editing a skill. Add a validator only if contract drift becomes a real problem.

## Tooling and Workflow

The repository uses:

- Node.js
- pnpm
- just
- ls-lint
- typos-cli

`just` is the preferred task runner over the lower-level tools.

Before running a task, inspect the available commands:

```sh
just
```

## What NOT to Do

- invent APIs, files, modules, or behavior
- assume unsupported features exist
- violate dependency boundaries
- introduce circular dependencies
- add unnecessary dependencies
- refactor unrelated code during a focused change
- modify generated artifacts directly when a generation workflow exists
- migrate tooling without an explicit requirement
- introduce a second package manager
- introduce unnecessary mutation
- commit or push Git changes unless explicitly requested

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

`skills/orchestrator/` is host-agnostic. It must not name host-specific tools, config schemas, or resume mechanics outside its generic-probing section. It resolves an adapter before any dispatch and an add-on only when the user explicitly requests one; a plan header naming one records that request.

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

- `Activation` is explicit user request only. The description must not auto-trigger on ordinary coding.
- `Planning` says how the plan's step profile and review focus change.
- `Task Briefs` says what every task brief must add.
- `Dispatch` contains one `#### <role>` heading per role the add-on modifies, using the exact lowercase role name, in canonical order. The body under each heading, excluding the heading, is copied verbatim into that role's `[ADDON_SECTION]` placeholder and rendered as `## Add-on Instructions`.
- `Evidence` defines what the implementer reports and what reviewers verify.
- `Ledger` defines the plan-header and execution-ledger lines.
- Add-ons never dispatch, never edit the core skill, and never weaken base permissions.

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

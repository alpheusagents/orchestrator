---
name: orchestrator-adapter-opencode
description: Use when orchestrating subagent work on OpenCode and host-specific dispatch, agent configuration, permissions, resume, or model control is needed. Load with the orchestrator skill; this adapter does not orchestrate on its own.
metadata:
    orchestrator-kind: host-adapter
    orchestrator-contract: "1"
    orchestrator-host: opencode
---

# Orchestrator on OpenCode

Supplements `orchestrator` with OpenCode mechanics. It recommends host setup; the orchestrator never edits OpenCode configuration.

## Detection

OpenCode has two schemas in active use:

- **V1 (`1.x`):** the dispatch tool is `task`; agent configuration lives under `agent`.
- **V2 (`2.0.4+`):** the dispatch tool is `subagent`; agent configuration lives under `agents`.

Use the tool that is present. If both appear, prefer the tool the runtime documents; record the detected version in the `Adapter:` ledger line, for example `Adapter: orchestrator-adapter-opencode (V2)`. `explore` is built-in and read-oriented in both. `general` is built-in and can write and execute; V2 `general` cannot launch subagents.

## Dispatch Mapping

### V1 (`1.x`)

| Role        | Tool   | Target    |
| ----------- | ------ | --------- |
| explorer    | `task` | `explore` |
| researcher  | `task` | `explore` |
| implementer | `task` | `general` |
| tester      | `task` | `general` |
| debugger    | `task` | `explore` |
| reviewer    | `task` | `explore` |
| verifier    | `task` | `explore` |

V1 has no built-in `scout`. If research needs network access and `explore` does not provide it, use a configured read-only research agent. Using `general` for research requires recording `Permission gap: read-only not enforced`.

For a diagnosis that needs a writable disposable workspace, dispatch `general` with `[WORKDIR]` set to that workspace and record `Permission gap: debugger source read-only not host-enforced`.

### V2 (`2.0.4+`)

| Role        | Tool       | Target    |
| ----------- | ---------- | --------- |
| explorer    | `subagent` | `explore` |
| researcher  | `subagent` | `explore` |
| implementer | `subagent` | `general` |
| tester      | `subagent` | `general` |
| debugger    | `subagent` | `explore` |
| reviewer    | `subagent` | `explore` |
| verifier    | `subagent` | `explore` |

V2 `explore` reads code and web sources.

For a diagnosis that needs a writable disposable workspace, dispatch `general` with `[WORKDIR]` set to that workspace and record `Permission gap: debugger source read-only not host-enforced`.

## Resume

- V1: newer releases return a task/session ID; record it and pass it back as `task_id`.
- V2: `subagent` returns a `sessionID`; pass it back to resume the same worker.
- Older V1 releases have no resume handle. Dispatch a fresh implementer with the brief, report path, and findings.
- Record the handle in the ledger at dispatch and reuse it for fix rounds 1-3 and adjustments.

## Model Control

Recommended setup; the user applies it. Never edit host config.

- V1: no per-call model parameter. Recommend pinning `model` on the role agent under `agent`.
- V2: recommend pinning `model` on the role agent under `agents`. A per-call `model` override exists, but use it only when the user asks. An unconfigured subagent inherits the parent session's model.
- Use the least capable model that can handle the role; see the orchestrator's model discipline.
- Record `Model gap: unconfigured subagent` when a role inherits a model it should not.

## Permissions

Recommended setup; the user applies it. Never edit `opencode.json(c)` or agent files. If the actual configuration differs, record the gap and rely on the role prompt.

| Tier        | Recommended target | Recommended enforcement                                                                                                                          | Gap if unconfigured                          |
| ----------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| `read-only` | `explore`          | deny `edit` outside the session workspace; allow report writes under `.orchestrator/**`; narrow `bash`/`shell` to non-mutating commands or `ask` | shell may mutate; report write may be denied |
| `safe-edit` | `general`          | edits within the dispatch scope; destructive operations `ask` or `deny`                                                                          | prompt-only                                  |
| `execution` | `general`          | safe-edit plus the named test and build commands; destructive operations `ask` or `deny`                                                         | prompt-only                                  |

- V1: `permission.task` maps subagent types to `allow`, `ask`, or `deny`. It accepts glob patterns; rules are matched in order and the last matching rule wins. Recommend an allow for each role agent the orchestrator dispatches.
- V2: `permissions` is an ordered list of matching rules; the action `subagent` gates spawnable types and the last matching rule wins. Recommend an allow for each role agent ID. `external_directory` is allowed by default; recommend an `ask` or `deny` rule when the workspace boundary matters.
- Recommend denying `task` (V1) or `subagent` (V2) on every role agent so no worker spawns workers.
- Recommend that read-only roles deny `edit` outside the session workspace, allow report writes under `.orchestrator/**`, and narrow `bash`/`shell`; the role prompt still enforces read-only behavior.
- Recommend allowing `webfetch` / `websearch` only for `researcher`. With the built-in `explore` shared by explorer and researcher, host-level isolation is not possible; record `Permission gap: researcher/explorer network isolation` unless the user defines separate role agents.
- Recommend allowing each role to write only its report file under `.orchestrator/**`. If the target cannot, the worker returns the full report inline and the orchestrator writes it; record `Permission gap: report write`.
- Debugger: use a write-capable target only when a disposable workspace is needed; recommend writes only inside that workspace and the report file, with the source checkout denied.
- A blanket shell allow cannot enforce "non-mutating commands"; recommend a narrow allowlist or `ask`.

## Limits

- V1: `subagent_depth` bounds spawn depth; recommend 1. V2: `experimental.subagent_depth`; recommend 1.
- No host concurrency cap is documented; the orchestrator's cap binds.
- V1 resume support varies by release.
- Keep each agent definition in one schema format. V2 can read supported V1 top-level fields, but do not mix V1 and V2 fields inside one agent entry.

## Gaps

- V1: no built-in `scout`, no per-call model parameter, and resume support varies by release.
- V2: no built-in `scout`.
- Both: read-only shell access cannot be enforced by a blanket permission; narrow it or use `ask`.
- Both: report writes may be denied by the role target; use the inline report fallback.
- Both: a writable debugger workspace requires a write-capable target; source read-only is prompt-only.
- Both: researcher/explorer network isolation is not host-enforced when both use the built-in `explore`.

## References

- [OpenCode V1 reference](references/v1.md)
- [OpenCode V2 reference](references/v2.md)

The adapter's `Dispatch Mapping` is authoritative for host targets; the references cover recommended setup, permission syntax, resume caveats, and command registration.

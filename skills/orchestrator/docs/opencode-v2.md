# OpenCode V2

OpenCode V2 (`2.0.4+`) differs from V1 in the dispatch tool, agent configuration, and permission model.

## Dispatch

| Role class    | Tool       | Agent     | Resume      |
| ------------- | ---------- | --------- | ----------- |
| Read-only     | `subagent` | `explore` | `sessionID` |
| Write/execute | `subagent` | `general` | `sessionID` |

- `subagent` returns a `sessionID`; pass it back to resume the same worker.
- V2 has no `scout`. Use `explore` for repository inspection; a read-only role with network access uses `websearch` / `webfetch`.
- `explore` is built-in and read-only. `general` is built-in and can write and execute.

## Agent configuration

- Define role agents under `agents` in `opencode.jsonc` or `.opencode/agents/<name>.md`.
- Do not mix V2 `agents` with V1 `agent.*`; use one schema per config.
- Set `mode: "subagent"` on each role agent.
- Pin `model` on the role agent. The per-call `model` override exists, but host policy says do not set it unless the user asks.
- An unconfigured subagent inherits the primary model.

## Permissions

- Gate spawnable types with `permissions` action `subagent`.
- The orchestrator itself needs a `subagent` allow for the role agent IDs it dispatches.
- Read-only roles need a shell policy: the agent contract says "non-mutating commands", but the host cannot enforce that with a blanket allow. Prefer a narrow allowlist or `ask`.
- Deny `edit` and `subagent` for read-only roles.

## No config sample

This page intentionally contains no `opencode.jsonc` sample; the host schema changes. Use the official OpenCode documentation for the current syntax.

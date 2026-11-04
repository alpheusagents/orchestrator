# OpenCode V1

OpenCode V1 (`1.x`) uses the `task` tool and the singular `agent` config. It is not the V2 `subagent` / `agents` schema.

## Dispatch

| Role class    | Tool                        | Agent                                     | Resume                  |
| ------------- | --------------------------- | ----------------------------------------- | ----------------------- |
| Read-only     | `task` with `subagent_type` | `explore`; `scout` when network is needed | `task_id` when returned |
| Write/execute | `task` with `subagent_type` | `general`                                 | `task_id` when returned |

- `explore` is built-in and read-only. `scout` is the network-capable read-only subagent. `general` is built-in and can write and execute.
- Newer V1 releases return a task/session ID. Record it in the ledger and pass it back as `task_id` to continue the same worker.
- Older V1 releases have no resume handle. Dispatch a fresh implementer with the brief, report path, and findings.
- V1 has no per-call model parameter. Pin `model` on the role agent.

## Agent configuration

- Define role agents under `agent` in `opencode.json` or `opencode.jsonc`.
- Alternatively, use Markdown agents under `.opencode/agents/<name>.md` (project) or `~/.config/opencode/agents/<name>.md` (user).
- Set `mode: "subagent"` on each role agent. If omitted, the mode defaults to `all`, so the agent can appear as a primary.
- Pin `model` on the role agent.
- Do not mix V2 schema into a V1 config: V1 uses `agent` singular and `permission.task`; V2 uses `agents` plural and the `subagent` permission action.

## Permissions

- `permission.task` maps subagent types to `allow`, `ask`, or `deny`. It accepts glob patterns; the last matching rule wins.
- The orchestrator needs a `task` allow for each role agent it dispatches.
- Read-only roles: deny `edit`; narrow `bash` to non-mutating commands or set it to `ask`.
- Allow `webfetch` / `websearch` only for the researcher/scout role.

## Version caveat

Resume support varies across 1.x releases. Check `opencode --version` and the `task` tool schema in-host. If there is no `task_id`, use the fresh-worker fallback.

## No config sample

This page intentionally contains no `opencode.json` sample; the host schema varies by release. Use the official OpenCode documentation for the current syntax.

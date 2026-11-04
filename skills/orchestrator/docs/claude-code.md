# Claude Code

Claude Code dispatches through `Agent` (formerly `Task`) with `subagent_type`.

## Dispatch

| Role class    | Tool                                        | Agent              | Resume                                                       |
| ------------- | ------------------------------------------- | ------------------ | ------------------------------------------------------------ |
| Read-only     | `Agent` (alias `Task`) with `subagent_type` | `Explore` / `Plan` | `SendMessage` with the agent ID when agent teams are enabled |
| Write/execute | `Agent` (alias `Task`) with `subagent_type` | `general-purpose`  | `SendMessage` with the agent ID when agent teams are enabled |

- `Agent` was renamed from `Task` in v2.1.63; `Task(...)` remains an alias.
- `Explore` and `Plan` are built-in read-only agents. `general-purpose` can write and execute.
- Each subagent invocation starts with fresh context. To continue the same worker, use `SendMessage` with its agent ID. This requires agent teams (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`).
- If that resume path is unavailable, dispatch a fresh implementer carrying the brief, report path, and findings.
- Define role agents in `.claude/agents/<name>.md` (project) or `~/.claude/agents/<name>.md` (user).

## Model control

Claude Code resolves a subagent model in this order:

1. the per-invocation `model` parameter;
2. the agent definition's `model` frontmatter;
3. `CLAUDE_CODE_SUBAGENT_MODEL`;
4. the main conversation's model.

Pin `model` on the role agent. Use the per-invocation parameter only when the user asks or a deliberate escalation is the point.

## Agent configuration

- Agent files are Markdown with YAML frontmatter. Require `name` and `description`.
- Optional fields include `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, and `isolation`.
- `tools` is an allowlist; `disallowedTools` is a denylist. If both are set, `disallowedTools` is applied first.
- `Agent(type)` in the coordinator's `tools` field allowlists spawnable types. It applies only when the coordinator runs as the main thread via `claude --agent`. Inside a subagent definition, the type list in parentheses is ignored.
- A skill can fork a subagent with `context: fork` + `agent`.
- Use `permissions.deny` to block specific built-in agents.

## Permissions

- Read-only roles: allow `Read`, `Grep`, and `Glob`; deny `Edit` and `Write`.
- `Bash` remains a hole: tool restriction alone cannot enforce "non-mutating commands". Add Bash permission rules or use `ask`.
- The orchestrator needs an `Agent(...)` allowlist for the role agents it dispatches.

## Version caveat

Claude Code changes quickly. Check `claude --version` and the Agent tool schema in-host. This page records the mapping the skill was written against, not a guarantee for every release.

## No config sample

This page intentionally contains no agent-file or settings sample; the host schema changes. Use the official Claude Code documentation for the current syntax.

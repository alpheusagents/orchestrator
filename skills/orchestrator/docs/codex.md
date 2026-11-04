# Codex

Current Codex releases enable subagent workflows by default. The exact tool names and config schema move quickly; confirm them in-host before dispatching.

## Dispatch

| Role class    | Tool family                                              | Agent                                       | Resume                        |
| ------------- | -------------------------------------------------------- | ------------------------------------------- | ----------------------------- |
| Read-only     | `spawn_agent`, `send_input`, `wait_agent`, `close_agent` | a custom role with a read-only tool surface | `resume_agent` / `send_input` |
| Write/execute | `spawn_agent`, `send_input`, `wait_agent`, `close_agent` | a custom role with edit/shell access        | `resume_agent` / `send_input` |

- Codex only spawns a subagent when explicitly asked.
- Use `/agent` in the CLI to switch between active agent threads and inspect progress.
- `spawn_agents_on_csv` exists for batch work; the orchestrator does not need it for normal task dispatch.
- If the host does not expose this tool family, report the missing capability rather than executing the role inline.

## Agent configuration

- Global subagent defaults live under `[agents]` in `~/.codex/config.toml`.
- Useful keys: `agents.enabled`, `agents.default_subagent_model`, `agents.default_subagent_reasoning_effort`, `agents.max_concurrent_threads_per_session`, and `agents.max_depth`.
- `agents.max_depth` defaults to `1`, which matches the skill's no-worker-spawns-workers rule.
- Declare a role under `[agents.<name>]` with a `description` and optional `config_file`.
- A role config can set `name`, `description`, `model`, `model_reasoning_effort`, `developer_instructions`, and tool/MCP settings. Confirm the exact fields in-host.
- Explicit spawn values override `[agents]` defaults. A role config's `model` takes precedence over the default model.

## Model control

- Pin `model` in the role config where possible.
- Some releases accept an explicit spawn model. Confirm in-host; do not assume a per-invocation model parameter exists.
- An unconfigured subagent inherits the parent configuration.

## Permissions

- Subagents inherit the current sandbox policy, but they run with non-interactive approvals. An action that needs a new approval fails and surfaces to the parent.
- Read-only roles need a read-only sandbox/tool surface, not just a prompt instruction.
- Do not raise `agents.max_depth` for orchestrator work; the skill's depth limit is 1.

## Version caveat

Check `codex --version` and the available tools before dispatching. Keep the Host Dispatch row's "confirm the exact tool in-host" language until a live session verifies the names.

## No config sample

This page intentionally contains no `config.toml` sample; the schema changes. Use the official Codex documentation for the current syntax.

# Telarel

This is a repo for orchestrator skill that orchestrate workflows with subagents.

It turns an expensive main agent into an executive orchestrator. Instead of doing the work itself, it plans, dispatches execution to cheap subagents, and concentrates its own reasoning on understanding, evaluation, and summarization.

## Tooling and Workflow

The repository uses:

- Node.js
- pnpm
- just
- ls-lint
- typos-cli

`just` is the preferred task runner over the lower-level tools.

Before running an task, inspect the available commands:

```sh
just
```

## What NOT to Do

- invent APIs, files, modules, or behavior
- assume unsupported features exist
- violate dependency boundaries
- introduce circular dependencies
- add unnecessary dependencies
- refactor unrelated code during a focuesd change
- modify generated artifacts directly when a generation workflow exists
- migrate tooling without an explicit requirement
- intoruce a second package manager
- introduce unnecessary mutation
- commit or push Git changes unless explicitly requested

# Orchestrator

A skill to orchestrate workflows with subagents.

## Installation

Install the skills with the [`skills`](https://github.com/vercel-labs/skills) CLI:

```sh
skills add alpheusagents/orchestrator
```

## Usage

Trigger the skill by natural phrasing:

```md
work on it with sub-agents driven
```

```md
orchestrate an implementation for this project
```

Optionally, invoke it with `/orchestrate <task>`.

## Architecture

```mermaid
flowchart TD
    U[User] --> M[<b>Agent</b><br/>orchestrator]
    M -->|understand → decompose| D{Plan}
    D -->|dispatch| W[<b>Subagents</b><br/>explorer · researcher · implementer · tester · reviewer · verifier]
    W -->|structured results| E{Evaluate}
    E -->|incomplete / contradiction / failure| D
    E -->|sufficient| S[Summary]
    S --> U
```

## Workers

| Worker      | Capability                  | Permission         |
| ----------- | --------------------------- | ------------------ |
| explorer    | read-only inspection        | read-only          |
| researcher  | read-only, network research | read-only, network |
| implementer | code editing                | safe-edit          |
| tester      | test execution              | execution          |
| reviewer    | independent review          | read-only          |
| verifier    | fix verification            | read-only          |

## License

This project is licensed under the terms of the MIT license.

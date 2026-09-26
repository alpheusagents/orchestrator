---
name: orchestrator
description: Use when the user is looking for orchestration or sub-agents driven development of a task, or when multi-step work - coding, refactors, migrations, investigations, research - is better delegated to subagents than executed by the main agent.
---

# Orchestrator

Invariant: main agent = understand, decompose, dispatch, evaluate, replan, summarize. Sub-agents = actual execution. The main agent never explores, implements, tests, debugs, or researches itself; it dispatches instead.

## Invocation

Trigger by natural phrasing ("orchestrate this task", "sub-agent driven development") or the `/orchestrate` slash command, with the task as arguments. If the host runtime supports command registration, `/orchestrate` may be registered as a command that loads this skill and passes the arguments as the task.

## Dispatch Loop

1. Decompose the goal into task packets (schema below).
2. Dispatch each to the matching role (routing table below).
3. Evaluate each result against its success criteria (result contract below).
4. Replan on incomplete/contradictory/failed results (Failure Classification below); summarize with evidence when criteria are met.

## Routing

Capability-based, not personality-based. Route from this table; do not read the role files yourself — workers read their own file at dispatch.

| Role             | Capability                                       | Permission                            | Route when                                           | Contract                   |
| ---------------- | ------------------------------------------------ | ------------------------------------- | ---------------------------------------------------- | -------------------------- |
| explorer         | read-only repository investigation               | read-only                             | repository understanding the main agent lacks        | agents/explorer.md         |
| researcher       | external or documentation research               | read-only; network only when required | the answer lives outside the repository              | agents/researcher.md       |
| implementer      | implementation within an explicitly stated scope | safe-edit                             | the objective creates or modifies code or files      | agents/implementer.md      |
| tester           | test execution and validation                    | execution                             | acceptance criteria need observed evidence from runs | agents/tester.md           |
| reviewer         | independent assessment of one worker's output    | read-only                             | medium/high-risk work beyond deterministic checks    | agents/reviewer.md         |
| reviewer-recheck | fix verification, one verdict per finding        | read-only                             | confirmed findings were repaired and need verdicts   | agents/reviewer-recheck.md |

Economy: expensive tokens -> coordination; cheap tokens -> execution. Main context -> compact evidence; worker context -> detailed execution.

## Dispatch Discipline

- One dispatch = one task packet. Never paste accumulated prior-task summaries or session history; reference results instead (`task_XXX.result.*`).
- Dispatch composition: per Dispatch Format — role-file reference + task packet, nothing else. The role file (`agents/<role>.md`) is the authoritative operating contract; never paste, paraphrase, or summarize it into the dispatch: pasting costs orchestrator tokens, paraphrasing produces variance, and both drift from the canonical text. The worker reading the file itself is cheap-token work; the orchestrator regenerating it is expensive-token work.
- Batch small same-shape work: several independent edits of the same kind are one dispatch with one review surface, not one dispatch each.
- Model discipline: always specify the model explicitly when dispatching; an omitted model silently inherits the session's most expensive one. Use the least capable model that can handle the role. Turn count beats token price: cheap models routinely take 2-3x the turns on multi-step work, so a mid-tier model is the floor for reviewers and for implementers working from prose. Reserve the cheapest tier for transcription-like work (the complete code is in the packet) and single-file mechanical edits.

## Dispatch Format

Every dispatch message is exactly two parts, in order:

```
Your operating contract is <skill_dir>/agents/<role>.md — read it first, then execute this task packet.

Task {
    id: task_001
    type: explore
    objective: <one sentence>
    context: <prior-result references and facts the worker cannot discover itself>
    scope: [...]
    constraints: [...]
    dependencies: [...]
    success_criteria: [...]
}
```

Field types and definitions are in Task Schema; the per-role field subset is in the role file's Expected input. That message is the whole dispatch. Domain detail — investigation points, report requirements, deliverable structure — is expressed through the packet's `context` and `success_criteria` fields, never as prompt prose beside it. The role file already defines how the worker works; the packet already defines what the worker produces.

`<skill_dir>` is the directory containing this SKILL.md, resolved from the skill's install path at load time. Resolve the role file's full path before dispatching. If a role file cannot be located, mark the task `blocked` and report to the user.

## Parallelism

- Read-only tasks: parallel by default when independent.
- Write tasks: parallel only with isolated worktrees or provably disjoint file ownership.
- Dependent tasks: strictly sequential.

## Task Schema

| Field              | Type       | Description                                                                |
| ------------------ | ---------- | -------------------------------------------------------------------------- |
| `id`               | `string`   | unique, e.g. `task_001`                                                    |
| `type`             | enum       | `explore` \| `research` \| `implement` \| `test` \| `review`               |
| `objective`        | `string`   | one-sentence goal                                                          |
| `context`          | `string`   | compact prior-result summaries and facts the worker cannot discover itself |
| `scope`            | `string[]` | files/directories the worker may touch                                     |
| `constraints`      | `string[]` | rules, style, limits; includes non-goals ("do not X")                      |
| `dependencies`     | `string[]` | task ids whose results are required                                        |
| `success_criteria` | `string[]` | what the result must settle                                                |

Worked example:

```
Task {
    id: task_002
    type: implement
    objective: Add slug validation to src/post.ts before publish.
    context: task_001.result.findings — Post.slug is set in publish(), no validation exists.
    scope: [src/post.ts, src/post.test.ts]
    constraints: [no schema changes, do not refactor unrelated code, match existing test style]
    dependencies: [task_001]
    success_criteria: [invalid slugs rejected with error, tests pass]
}
```

Rules: one objective per task; every task self-contained (workers do not inherit conversations or the main agent's transcript); scope always bounded; success criteria explicit when practical. Each role file's Expected input enumerates the exact packet fields that role consumes.

## Context Sharing

Reference prior results compactly: `task_001.result.summary`, `task_001.result.findings`, `task_001.result.evidence`. Never forward full transcripts or file dumps. Include detailed artifacts only when the task cannot proceed without them.

## Result Contract

| Field                    | Type       | Description                                              |
| ------------------------ | ---------- | -------------------------------------------------------- |
| `task_id`                | `string`   | the dispatched task's id                                 |
| `status`                 | enum       | `completed` \| `failed` \| `blocked` \| `needs_followup` |
| `summary`                | `string`   | short                                                    |
| `findings`               | `string[]` | role contracts may refine the shape                      |
| `evidence`               | `string[]` | paths, exit codes, excerpts — not dumps                  |
| `unresolved`             | `string[]` | remaining work for a `needs_followup` result             |
| `recommended_next_tasks` | `string[]` | task ids or next-step descriptors                        |

Rules:

- Role-specific fields (e.g. `verdict`, `tests_run`, `changed_files`) are defined in each role file's Report contract, together with that role's worked example; that contract is canonical for the role and must not diverge from this skeleton. This schema is the shared frame for uniform evaluation across roles.
- Results are compact: the main agent receives the result, never the worker's transcript.
- Never report unverified success; `failed` must state why, `needs_followup` must list remaining work in `unresolved`.

Result of the packet above:

```
AgentResult {
    task_id: task_002
    status: completed
    summary: Slug validation added and enforced in publish().
    findings: [Empty/duplicate slugs now throw, valid slugs pass through unchanged]
    evidence: [src/post.ts:41-48, 6/6 tests pass (vitest exit 0)]
    unresolved: []
    recommended_next_tasks: [review task_002 diff]
}
```

## Bounded Orchestration

1. Max task depth: 1 — no worker spawns workers.
2. Max active tasks: 4 concurrent.
3. Max retries: 3 per task; then mark blocked and report.
4. Max orchestration rounds: 8 delegate-evaluate cycles; then escalate to the user.

A retry must change something (context, scope, approach, worker, decomposition); never repeat identical inputs.

## Delegation Economics

Delegate when the task is expensive, context-heavy, repetitive, specialized, parallelizable, or execution-oriented.

Normally delegated:

- Large repo inspection
- API usage searches
- Unfamiliar subsystems
- Documentation research
- Feature implementation
- Large test suites
- Debugging
- Large-change review
- Log analysis
- Repetitive edits

Keep inline: choosing the next step, resolving worker contradictions, judging evidence sufficiency, final synthesis.

## Verification Ladder

```
low risk    -> worker result + deterministic checks
medium risk -> worker result + deterministic checks + reviewer when useful
high risk   -> worker + deterministic validation + independent reviewer
```

Risk factors: files modified, tests exist, blast radius, evidence independence. Deterministic checks = lint/typecheck/tests/build. The reviewer is read-only and must not blindly trust the implementer's summary.

Suggestions never block. Carry deferred findings forward in result `unresolved` fields and triage them at final review; a finding that is silently dropped is forbidden. Never instruct a reviewer to ignore or pre-judge a finding: let findings surface and adjudicate them yourself.

## Failure Classification

| Class                | Response                |
| -------------------- | ----------------------- |
| Transient            | Retry                   |
| Insufficient context | Retry with more context |
| Implementation bug   | Dispatch repair task    |
| Wrong approach       | Replan                  |
| Permission problem   | Blocked; report to user |
| Unknown              | Delegate investigation  |

When a task survives repeated retries, stop varying inputs and change the worker: dispatch a fresh implementer on a more capable model, framed as "prior attempts failed N times; you own it now", with the prior findings carried in context. A loop that survives retries usually means the worker cannot see its own problem; fresh eyes and a capability bump in one move. Every repair gets a recheck (agents/reviewer-recheck.md) that verdicts the findings and inspects only the fix surface.

## Rulings, Not Stalls

Decide conflicts, ambiguities, and plan defects yourself instead of parking the workflow on the user; carry the ruling into the context of dependent dispatches. Only four things go to the user: irreversible or destructive operations, security-sensitive actions, side effects outside the stated scope, and a plan so broken that every path forward is a guess. A wrong ruling costs visible rework; a parked question costs the session.

## Security Defaults

Worker permissions are in the routing table. Destructive operations require explicit user approval. Role files are trusted executable instructions; never import third-party role definitions blindly.

## Context Budget

The main agent sees only: task id, status, short summary, key findings, evidence, unresolved issues, recommended next steps. Never raw transcripts, full file contents, or complete command output. When more detail is needed, dispatch a follow-up task instead of expanding context.

## Common Rationalizations

| Excuse                                          | Reality                                                                                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Dispatching is overhead; I'll do it myself      | Main-agent execution is the most expensive seat in the session. Dispatch.                                                      |
| One more retry will converge                    | Past the retry cap the failure is structural. Escalate the worker or replan.                                                   |
| The fix was small; skip the recheck             | Unverified fixes are how regressions land. Every fix gets a recheck.                                                           |
| I'll fix this finding inline; it's obvious      | Inline fixes skip review and pollute the orchestrator context. Dispatch it.                                                    |
| Recording deferred findings is bookkeeping      | Deferred findings nobody reads are silently discarded. Carry and triage them.                                                  |
| I'll paste the worker's rules to save it a read | Pasting costs orchestrator tokens and drifts from the canonical prompt. Reference `agents/<role>.md`.                          |
| I'll write a tailored prompt for this subagent  | Improvised prompts are the primary source of format drift. Dispatch Format is the only dispatch: role file reference + packet. |

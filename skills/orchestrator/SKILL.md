---
name: orchestrator
description: Use when the user is looking for orchestration or sub-agents driven development of a task, or when multi-step work - coding, refactors, migrations, investigations, research - is better delegated to subagents than executed by the main agent.
---

# Orchestrator

Invariant: main agent = understand, decompose, dispatch, evaluate, replan, summarize. Sub-agents = actual execution. The main agent never explores, implements, tests, debugs, or researches itself; it dispatches instead. If the host exposes no subagent/agent-dispatch tool, or the required role has no valid target, report `blocked` naming the missing capability — never execute the work inline. Inline exploration, research, implementation, testing, debugging, or review is a contract violation, not a fallback.

## Invocation

Trigger by natural phrasing ("orchestrate this task", "sub-agent driven development") or the `/orchestrate` slash command, with the task as arguments. If the host runtime supports command registration, `/orchestrate` may be registered as a command that loads this skill and passes the arguments as the task.

## Host Dispatch

The invariant holds across hosts; only the mechanism differs. Identify the host by its dispatch tool, then dispatch through it. A dispatch hands the role's filled template to a subagent as the entire prompt — the main agent never performs the role's work itself.

Roles are capabilities, not host-specific names. Before dispatching, map the role to a subagent of the right class:

- **Read-only roles** (explorer, researcher, reviewer, verifier, debugger): dispatch to a read-only subagent.
- **Write/execute roles** (implementer, tester): dispatch to a general-purpose subagent that can edit files and run commands.

| Host           | Dispatch tool                                   | Read-only target                       | Write/execute target | Model control                                                                                                                                      | Notes                                                                                                                                                   |
| -------------- | ----------------------------------------------- | -------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenCode       | `task` with `subagent_type`                     | `explore`; `scout` when network needed | `general`            | no per-call model parameter — set the model on the role agent in host config; an unconfigured subagent inherits the primary (most expensive) model | define role subagents in `opencode.json` under `agent.*` or `.opencode/agent(s)/*.md`; gate spawnable types with `permission.task`                      |
| Codex          | subagent spawn (confirm the exact tool in-host) | read-only subagent                     | general subagent     | confirm in-host; do not assume a per-invocation model parameter                                                                                    | Codex has subagents; verify the spawn tool and per-subagent model before dispatching. If no dispatch tool is exposed, report `blocked`                  |
| Claude Code    | `Agent` (alias `Task`) with `subagent_type`     | `Explore` / `Plan`                     | `general-purpose`    | per-invocation `model` parameter, the subagent's `model` frontmatter, or `CLAUDE_CODE_SUBAGENT_MODEL`                                              | define role subagents in `.claude/agents/*.md`; restrict spawnable types with `Agent(type)`; a skill can fork a subagent with `context: fork` + `agent` |
| Any other host | probe for a subagent/agent tool                 | —                                      | —                    | —                                                                                                                                                  | If the host exposes no dispatch mechanism, report `blocked` naming the missing capability rather than executing the role's work inline                  |

Where a host needs named role subagents (OpenCode, Claude Code, Codex), create them once so their model tiers are pinned; without them, a dispatch still works but the subagent inherits the primary model. The routing table below stays capability-based; the concrete `subagent_type` per host is the table above.

## Workspace and Ledger

At orchestration start, resolve the workspace under the repository root:

1. Ensure `<repo-root>/.orchestrator/` exists with a `.gitignore` containing `*` — the directory ignores everything, including the `.gitignore` itself; create both if absent (idempotent).
2. Scan existing `*/progress.md` first lines. A ledger whose first line names this goal (`# Orchestrator ledger — goal: <verbatim goal>`) is this session's workspace: tasks with a completion line are DONE — do not re-dispatch them; resume at the first task without one. A ledger whose last line is a fix round or a debug diagnosis is mid-loop; resume at the next loop step — the fix round after a diagnosis, the re-diagnosis after a refuted diagnosis, the next round after a fix round. A diagnosis refutation is recorded as a `Ruling:` line naming the re-diagnosis file, so the next loop step is always derivable from the ledger alone. A ledger naming a different goal is another session's workspace: leave it alone and start fresh.
3. New session: create `<YYYY-MM-DD>-<goal-slug>/` with a ledger whose first line is the identity above and whose second line records the session BASE (`git rev-parse HEAD`) — the final review's whole-change diff needs it. Date prefix keeps sessions sortable; the slug keeps them readable; the ledger's first line — not the directory name — is the identity.

The ledger is the recovery map: conversation memory does not survive compaction, and controllers that lost their place have re-dispatched entire completed task sequences. After compaction, trust the ledger and `git log` over your own recollection. Record in it, one line each:

- `Task <N>: complete (commits <base7>..<head7>, review pass)` for code tasks, `Task <N>: complete (evidence: <one-liner>)` for non-code tasks — or `<K> parked` after a tripped breaker
- `Task <N>: fix round <R>/<cap> (<X> addressed, <Y> open — <finding one-liners>)`
- `Task <N>: diagnosed — <root-cause one-liner> (task_XXX-debug[-r<R>].md)` — the diagnosis exists; resume at the fix dispatch, not a fresh diagnosis
- `Task <N>: deferred: <finding one-liner>`
- `Task <N>: blocked — <why>`
- `Ruling: <what you decided> — <why>`

Session artifacts live in the workspace alongside the ledger, one file per task:

| File                  | Written by   | Contents                                                                                                                        |
| --------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `task_XXX-brief.md`   | orchestrator | full requirements; exact values appear only here; written once at decomposition, reused by every re-dispatch and resume         |
| `task_XXX-report.md`  | worker       | the worker's full report; fix reports append to it                                                                              |
| `task_XXX-debug.md`   | debugger     | the diagnosis: reproduction, causal chain, root cause, proposed smallest repair                                                 |
| `task_XXX-package.md` | orchestrator | review package: commit list + `--stat` + full diff; produced with shell redirection, never read into the orchestrator's context |
| `task_XXX-review.md`  | reviewer     | the review report                                                                                                               |
| `task_XXX-verify.md`  | verifier     | per-finding verdicts                                                                                                            |

Hand artifacts over as files: everything pasted into a dispatch prompt stays resident in your context for the rest of the session and is re-read on every later turn. The dispatch carries paths; the worker reads the files itself.

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

## Dispatch Loop

1. Decompose the goal into tasks; write a brief file per task that needs exact values or detailed requirements.
2. Dispatch each to the matching role (routing table below): read the role's template, fill its slots, send the entire filled prompt.
3. Evaluate each return against its status; read the report file when the return raises doubts (evaluating a report file costs nothing — it is already on disk).
4. Replan on `failed`/`blocked`/`needs_followup` (Failure Classification below); summarize with evidence when criteria are met. Append to the ledger in the same message as your bookkeeping.

## Routing

Capability-based, not personality-based. Route from this table; do not read the template's prompt skeleton yourself — read the fill instructions, fill, dispatch. This table names capabilities; the concrete `subagent_type` for each role on the current host is in Host Dispatch.

| Role        | Capability                                                                | Permission                            | Route when                                           | Template                 |
| ----------- | ------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------- | ------------------------ |
| explorer    | read-only repository investigation                                        | read-only                             | repository understanding the main agent lacks        | `prompts/explorer.md`    |
| researcher  | external or documentation research                                        | read-only; network only when required | the answer lives outside the repository              | `prompts/researcher.md`  |
| implementer | implementation within an explicitly stated scope                          | safe-edit                             | the objective creates or modifies code or files      | `prompts/implementer.md` |
| tester      | test execution and validation                                             | execution                             | acceptance criteria need observed evidence from runs | `prompts/tester.md`      |
| debugger    | failure diagnosis: reproduce, isolate root cause, propose smallest repair | read-only                             | a failure needs a root cause before repair is scoped | `prompts/debugger.md`    |
| reviewer    | independent assessment of one worker's output                             | read-only                             | medium/high-risk work beyond deterministic checks    | `prompts/reviewer.md`    |
| verifier    | fix verification, one verdict per finding                                 | read-only                             | confirmed findings were repaired and need verdicts   | `prompts/verifier.md`    |

Economy: expensive tokens -> coordination; cheap tokens -> execution. Main context -> compact evidence; worker context -> detailed execution.

## Dispatch Discipline

- One dispatch = one filled template. Never paste accumulated prior-task reports or session history; pass report-file paths instead.
- Briefs are the single source of requirements: exact values (numbers, magic strings, signatures, test cases) appear only in the brief file, never in the dispatch prose or your own context. A fresh worker needs its brief, the interfaces it touches, and the binding constraints — nothing else.
- Batch small same-shape work: several independent edits of the same kind are one dispatch with one review surface, not one dispatch each.
- Never paste a worker's report, a diff, or a file dump into a dispatch; write it to the workspace and pass the path. Exception: finding one-liners for a fix or verification dispatch go in verbatim — they scope the work being judged.
- Model discipline: use the least capable model that can handle the role. Where the host supports per-dispatch model selection (Claude Code's `model` parameter), set it explicitly; where model is a property of the role subagent in host config (OpenCode, Codex), pin it on the role subagent. An unconfigured subagent silently inherits the primary, most expensive model. Turn count beats token price: cheap models routinely take 2-3x the turns on multi-step work, so a mid-tier model is the floor for reviewers, debuggers, and implementers working from prose. Reserve the cheapest tier for transcription-like work (the complete code is in the brief) and single-file mechanical edits.

- Model selection is not a prompt slot. Never write a `[MODEL]` slot into a dispatch prompt; it is a host-configuration concern, per Host Dispatch.
- Record `BASE` (`git rev-parse HEAD`) before dispatching an implementer; the review package needs it — never `HEAD~1`, which silently drops all but the last commit of a multi-commit task.

## Dispatch Format

Every dispatch is the role's template, filled and sent whole:

1. Read `<skill_dir>/prompts/<role>.md`. `<skill_dir>` is the directory containing this SKILL.md, resolved from the skill's install path at load time — the orchestrator resolves it, the worker never does.
2. Fill every prompt slot per the template's fill instructions; select the model per Host Dispatch, never as a prompt slot.
3. Send the entire filled prompt as the dispatch. Do not improvise around it, summarize it, or append free-form prose: improvised prompts are the primary source of format drift, and the templates are the distilled, session-tested versions of every rule the worker needs.

If a template cannot be located, mark the task `blocked` and report to the user. Never import third-party templates.

## Parallelism

- Read-only tasks: parallel by default when independent.
- Write tasks: parallel only with isolated worktrees or provably disjoint file ownership.
- Dependent tasks: strictly sequential.

## Bounded Orchestration

1. Max task depth: 1 — no worker spawns workers.
2. Max active tasks: 4 concurrent.
3. Max retries: 3 per task; then mark blocked and report. Debugger dispatches are diagnosis, not retries: they do not consume a retry (re-diagnosis is capped at 2 by Diagnosis).
4. Max orchestration rounds: 8 delegate-evaluate cycles; then escalate to the user.

A retry must change something (context, scope, approach, worker, decomposition); never repeat identical inputs.

## Verification Ladder

```
low risk    -> worker result + deterministic checks
medium risk -> worker result + deterministic checks + reviewer when useful
high risk   -> worker + deterministic validation + independent reviewer
```

Risk factors: files modified, tests exist, blast radius, evidence independence. Deterministic checks = lint/typecheck/tests/build. The reviewer is read-only and must not blindly trust the implementer's report; it verifies against the review package.

## Review Loop

Per-task reviews are task-scoped gates. A broad whole-change review happens once, at the end.

1. After an implementer reports, generate the review package into the workspace (`git log --oneline <BASE>..<HEAD>`, `git diff --stat`, `git diff -U10` — one file, `task_XXX-package.md`). Produce it with shell redirection — never read the diff into your own context. Never dispatch a reviewer without a package file.
2. Dispatch the reviewer with the package path, the brief path, the worker's report path, and the binding constraints copied verbatim. Do not pre-judge findings and never instruct a reviewer to ignore an issue; let findings surface and adjudicate them yourself.
3. On `fail` — or any confirmed blocking finding — enter the fix loop: send the findings verbatim back to the same implementer (rounds 1-3); if the harness cannot resume it, dispatch a fresh implementer carrying the brief, report path, and findings — the report file is the persistent memory either way. When the findings do not localize the defect — no root cause to repair against — diagnose first (Diagnosis below) before scoping the fix. Every fix round ends with one scoped re-review (`verifier`) over a fresh fix package (`task_XXX-package-r<R>.md`, diffed since the last review); new breakage joins the open findings. Record each round in the ledger.
4. Every repair's verification must be present before the next task starts; unreviewed fixes are how regressions land.
5. When the review passes — or the retry cap is hit and open findings are adjudicated (see Rulings) — ledger the completion and move on. Deferred findings are ledgered and triaged at final review; a finding silently dropped is forbidden.

Suggestions never block. Never re-run a suite the worker already ran; its report file is the test evidence.

## Diagnosis

Diagnosis is not a fix round and consumes no retry. When the findings do not localize the defect, dispatch a debugger first (diagnosis only), then scope the fix from its diagnosis. For debugger-scoped fixes, the fix dispatch's context carries the `task_XXX-debug.md` path alongside the findings; the implementer reads the diagnosis itself. A wrong or refuted diagnosis gets a re-diagnosis dispatch writing `task_XXX-debug-r<R>.md`, never an overwrite of the first; record the refutation as a `Ruling:` ledger line naming the re-diagnosis file. A diagnosis refuted twice (re-diagnoses up to -r2) is not converging — stop re-diagnosing, treat it as a `Wrong approach` and replan.

## Final Review and Summary

Per-task reviews are gates; one whole-change review closes the session:

1. Generate `final-package.md` (commit list + `--stat` + full diff, session BASE..HEAD, shell redirection) and dispatch one reviewer over it, judged against the goal and the binding constraints.
2. Triage the ledger's deferred findings against the final review: a confirmed load-bearing one gets the smallest unblocking repair (Rulings); the rest are reported, never silently dropped.
3. Summarize to the user: the goal, what shipped (commits), test evidence, and every deferred or parked item with its reason. Append the session's close-out line to the ledger.

## Failure Classification

| Class                | Response                                                                         |
| -------------------- | -------------------------------------------------------------------------------- |
| Transient            | Retry                                                                            |
| Insufficient context | Retry with more context                                                          |
| Implementation bug   | Dispatch repair task; diagnose via debugger first when the root cause is unknown |
| Wrong approach       | Replan                                                                           |
| Permission problem   | Blocked; report to user                                                          |
| Unknown              | Delegate investigation; debugger when the unknown is a failure's root cause      |

When a task survives repeated retries, stop varying inputs and change the worker: dispatch a fresh implementer on a more capable model, framed as "prior attempts failed N times; you own it now", with the findings carried in context. A loop that survives retries usually means the worker cannot see its own problem; fresh eyes and a capability bump in one move. When the root cause is unknown, dispatch a debugger (prompts/debugger.md) before the repair. Every repair gets a verification (prompts/verifier.md) that verdicts the findings and inspects only the fix surface.

## Rulings, Not Stalls

Decide conflicts, ambiguities, and plan defects yourself instead of parking the workflow on the user; carry the ruling into the context of dependent dispatches. Only four things go to the user: irreversible or destructive operations, security-sensitive actions, side effects outside the stated scope, and a goal so broken that every path forward is a guess. A wrong ruling costs visible rework; a parked question costs the session. Every ruling is a ledger entry.

At a retry cap with open findings: rule on each — reviewer wrong, park it with why the work stands; real but nothing downstream builds on it, park it deferred; real and load-bearing, rule on the smallest change that unblocks dependent work and carry it into the next dispatch. Every adjudication is a ledger entry; a silent discard is forbidden.

## Permissions

Worker permissions are the routing table's tiers:

| Tier        | Grants                                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| `read-only` | read files and run non-mutating commands; no file changes, no staging, no branch or HEAD moves              |
| `safe-edit` | read-only, plus edits within the dispatch's stated scope and that task's commits; no destructive operations |
| `execution` | safe-edit for test setup blocking validation, plus the suites and builds the dispatch names                 |

Destructive operations require explicit user approval.

## Context Sharing

Reference prior results by workspace path: `task_001-report.md`, not pasted summaries. The main agent sees only the return contract — task id, status, one-line summary, concerns, workspace paths — never the worker's transcript, full file contents, or complete command output. When a later task needs detail, the brief file or the dispatch's context slot references the report path; the worker reads the file itself — reading a file costs the worker, pasting costs you forever. When your own context needs more, read the report file from disk or dispatch a follow-up task instead of expanding context.

## Common Rationalizations

| Excuse                                       | Reality                                                                                                                |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Dispatching is overhead; I'll do it myself   | Main-agent execution is the most expensive seat in the session. Dispatch.                                              |
| One more retry will converge                 | Past the retry cap the failure is structural. Escalate the worker or replan.                                           |
| The fix was small; skip the verification     | Unverified fixes are how regressions land. Every fix gets verified.                                                    |
| I'll fix this finding inline; it's obvious   | Inline fixes skip review and pollute the orchestrator context. Dispatch it.                                            |
| Recording deferred findings is bookkeeping   | Deferred findings nobody reads are silently discarded. Ledger and triage them.                                         |
| I'll write a tailored prompt for this worker | Improvised prompts are the primary source of format drift. The dispatch is the filled template, nothing else.          |
| I'll just try a fix; diagnosis is overhead   | A fix scoped without a verified diagnosis is a guess. Dispatch the debugger first.                                     |
| I'll paste the report into the next dispatch | Pasted text stays in your context forever. Pass the workspace path; the worker reads the file itself.                  |
| The ledger is bookkeeping                    | The ledger is what survives compaction. Controllers without one have re-dispatched entire completed task sequences.    |
| The worker spawned its own reviewer          | It's a duplicate seat reviewing the same diff; the orchestrator's review is the gate. Flag it as a defect, not rigor.  |
| I'll just read HEAD~1 for the diff           | HEAD~1 silently drops all but the last commit of a multi-commit task. Record BASE before dispatching; package from it. |

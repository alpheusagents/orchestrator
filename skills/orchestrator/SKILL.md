---
name: orchestrator
description: Use when the user wants a subagent-ready implementation plan, orchestration, or sub-agent driven development of a multi-step task, including in Plan mode when the work will later be executed by subagents. Also use when the user says orchestrate this, plan this, or execute a saved plan.
metadata:
    orchestrator-kind: core
    orchestrator-contract: "1"
---

# Orchestrator

Main agent = understand, plan, decompose, dispatch, evaluate, replan, summarize. Sub-agents execute. Never explore, implement, test, debug, research, or review inline; dispatch instead. If no dispatch tool or role target exists, report `blocked` naming the missing capability — inline work is a contract violation, not a fallback. Delegate expensive or context-heavy work; keep planning, judging evidence, resolving contradictions, and synthesis inline. Expensive tokens coordinate; cheap tokens execute.

## Modes

| Mode        | Trigger                                                     | Behavior                                                                                 |
| ----------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Plan        | "plan this", `orchestrate plan <task>`, read-only Plan mode | Produce and self-review in conversation; save only on request; stop, ask before execute. |
| Execute     | "execute `<plan>`", `orchestrate execute <plan>`            | Load the live plan, validate, create or resume the ledger, dispatch.                     |
| Save        | "write the plan into file"                                  | Write the plan verbatim to the user's chosen path, stop, ask before execute.             |
| Orchestrate | `orchestrate <task>` in a writable session                  | Plan, stop, ask whether to save, adjust, or execute; never dispatch before the answer.   |
| Resume      | "resume `<plan>`"                                           | Continue at the first task without a completion line.                                    |

Planning is first-class. Every planning session produces a plan and, when the host is writable, creates the session workspace before dispatching exploration work. Do not write a plan file until the user asks; then use the user's chosen path. A read-only host returns the plan in conversation.

## Planning and Handoff

Every planning session gets a plan; read `references/writing-plans.md`. When the host is writable, create the session workspace before dispatching exploration work; it holds exploration reports and later artifacts. Planning and self-review are main-agent work. If the plan needs repository understanding you lack, dispatch explorer or researcher first; never inspect inline.

Before any dispatch, resolve the host adapter: locate `orchestrator-adapter-<host>`, load it, require contract version `1`, and record it in the plan header or workspace note; record it again in the execution ledger. If none is installed, ask whether to continue with generic probing, install it, or stop. Details: `references/execution.md`.

### Methodology

The default is `none`. Load `orchestrator-addon-<name>` only when the user explicitly requests it or the plan header records that request; if it is not installed, ask whether to install it, continue without it, or stop. Read its `## Orchestrator Integration`, require contract version `1`, and apply only the sections it defines. A missing section means no change for that phase. An incompatible contract is `blocked: incompatible <skill> methodology contract`. Record the choice in the plan header when saved and in the ledger.

Stop and ask whether to save, adjust, or execute. Execute only after an explicit yes or execute request. The header records `**Methodology:** none` or the active methodology; an execution session does not re-ask. Missing field = `none`; an uninstalled add-on -> ask whether to continue, install, or stop.

## Execution Setup

At execution start or resume, read `references/execution.md` and follow it. Resolve the live plan and adapter, create or resume the ledger, derive one brief per task, then dispatch. Before each task, re-read the live plan and reconcile changes; never rewrite a completed or in-flight brief. Evaluate each return; read the report file when in doubt. Replan on `failed`/`blocked`/`needs_followup`; append to the ledger in the same message.

The ledger is the recovery map: after compaction, trust it and `git log` over recollection. The adapter supplies host mechanics and recommended setup; never edit host configuration. Record a permission or model gap when the host differs. Permissions are the routing table's tiers, mapped by the adapter; definitions, report writes, and destructive-operation approval are in `references/execution.md`. If the guide is missing, report `blocked`.

## Routing

Capability-based, not personality-based. Route from this table; fill the role template and dispatch. The concrete target for each role is in the adapter's Dispatch Mapping.

| Role        | Capability                                            | Permission                            | Route when                                           | Template                 |
| ----------- | ----------------------------------------------------- | ------------------------------------- | ---------------------------------------------------- | ------------------------ |
| explorer    | repository investigation                              | read-only                             | repository understanding the main agent lacks        | `prompts/explorer.md`    |
| researcher  | external or documentation research                    | read-only; network only when required | the answer lives outside the repository              | `prompts/researcher.md`  |
| implementer | implementation within a stated scope                  | safe-edit                             | the objective creates or modifies code or files      | `prompts/implementer.md` |
| tester      | test execution and validation                         | execution                             | acceptance criteria need observed evidence from runs | `prompts/tester.md`      |
| debugger    | failure diagnosis: reproduce, isolate, propose repair | read-only                             | a failure needs a root cause before repair is scoped | `prompts/debugger.md`    |
| reviewer    | independent assessment of one worker's output         | read-only                             | medium/high-risk work beyond deterministic checks    | `prompts/reviewer.md`    |
| verifier    | fix verification, one verdict per finding             | read-only                             | confirmed findings were repaired and need verdicts   | `prompts/verifier.md`    |

## Dispatch Discipline

- One dispatch = one filled template. Pass report-file paths, never pasted reports or history. The main agent normally sees only the return contract — task id, status, one-line summary, concerns, workspace paths. Read the report file when it needs detail.
- The plan is the requirements source; the brief is the worker's single source. Copy the plan's task section verbatim, then append Global Constraints, the task's Review Focus lines, the methodology's `### Task Briefs` rules, and execution context. Never paraphrase exact values.
- Batch small same-shape work: several independent edits of the same kind are one dispatch with one review surface, not one dispatch each.
- Never paste a worker's report, a diff, or a file dump into a dispatch; write it to the workspace and pass the path. Exception: finding one-liners for a fix or verification dispatch go in verbatim — they scope the work being judged.
- Read-only roles may write only their report file under the session workspace and, for the debugger, a disposable worktree or copy; never modify the checkout. If the target cannot write, the worker returns the full report inline and the orchestrator writes it; record `Permission gap: report write`.
- Model discipline: use the least capable model that works. The adapter recommends where the model is pinned or passed; an unconfigured subagent may inherit the primary model. Turn count beats token price, so mid-tier is the floor for prose-driven roles; reserve the cheapest tier for transcription and single-file mechanical edits. Never put a `[MODEL]` slot in a prompt, and never edit host config.
- Record `BASE` (`git rev-parse HEAD`) before dispatching an implementer; the review package needs it — never `HEAD~1`, which drops all but the last commit of a multi-commit task.
- Methodology: if the active add-on has a `#### <role>` block under `### Dispatch`, include `## Methodology` and paste that block verbatim into the role's prompt. If it has no block for that role, omit the section.

## Dispatch Format

Read `<skill_dir>/prompts/<role>.md` (`<skill_dir>` is this skill's install directory; the orchestrator resolves it, never the worker), fill every slot, and send the entire filled prompt. `[METHODOLOGY_SECTION]` is the active role block rendered as `## Methodology`, or nothing; remove the placeholder. Never improvise around the template — format drift starts there. If a template is missing, mark the task `blocked`; never import third-party templates.

## Parallelism

- Read-only tasks: parallel by default when independent.
- Write tasks: parallel only with isolated worktrees or provably disjoint file ownership.
- Dependent tasks: strictly sequential.

## Bounded Orchestration

1. Max task depth: 1 — no worker spawns workers.
2. Max active tasks: 4 concurrent.
3. Retry budget: 3 failed attempts per task. Then a separate budget of 2 small in-scope adjustments. A small adjustment stays in scope, changes no architecture, public interface, dependency, data, or config schema, and is a localized edit. After two failed adjustments, mark blocked and report. A big or breaking change needs user approval. Debugger dispatches are diagnosis, not attempts; they consume no budget (re-diagnosis is capped at 2 in `references/execution.md`).
4. Max orchestration rounds: 8 delegate-evaluate cycles; then escalate to the user.

A retry must change something (context, scope, approach, worker, decomposition); never repeat identical inputs.

## Review Gates

Per-task reviews are gates for medium/high-risk tasks; one whole-change review closes every session.

- When the task's risk calls for review, after an implementer reports generate the review package with shell redirection and dispatch a reviewer with the package, brief, report, and binding constraints. Never dispatch a reviewer without a package, and never tell one to ignore an issue.
- On failure, send findings back to the same implementer session when resumable; otherwise dispatch a fresh implementer with the brief, report path, and findings. Diagnose first when the findings do not localize the defect. Re-review the fix surface with `verifier`; ledger every round.
- Verify every repair before the next task. Close with a whole-change review against the goal, live plan, inputs, constraints, and `Plan change:` lines. Triage deferred findings; the summary cites the plan, verdicts, test evidence from report files, and every deferred or parked finding; never claim "tests pass" from a worker summary.

Ladder: low risk -> worker + checks; medium -> add a reviewer when useful; high -> independent reviewer. The whole-change final review is mandatory at every risk level. Risk: blast radius, tests, evidence independence. Checks = lint/typecheck/tests/build. Full loop: `references/execution.md`.

## Failure and Diagnosis

Classify every failure before retrying; the classification table and worker-escalation rules are in `references/execution.md`. After three failed attempts, use the small-adjustment budget of two for in-scope, non-breaking repairs; after the second adjustment fails, mark blocked. Ask before any scope, architecture, interface, dependency, or data change. When the root cause is unknown, dispatch a debugger before the repair, and verify every repair. Diagnosis is not a fix round and consumes no budget; the protocol and re-diagnosis cap are in `references/execution.md`.

## Rulings, Not Stalls

Decide conflicts, ambiguities, and plan defects yourself instead of parking the workflow on the user; carry the ruling into dependent dispatches. Every ruling is a ledger entry.

Setup gates are asked once before work starts:

- plan handoff — stop, ask whether to save, adjust, or execute;
- missing host adapter — continue with generic probing, install it, or stop;
- requested methodology not installed — install it, continue without it, or stop;
- missing plan for a multi-task execution — ask the user to save one first;
- scope or architecture change to an approved plan — write a revision and ask.

Choosing install stops the session until the user installs the skill and restarts or resumes.

After execution starts, four things go to the user: irreversible or destructive operations, security-sensitive actions, side effects outside the stated scope, and a goal so broken that every path forward is a guess. A scope or architecture change to the approved plan is the one additional structural stop; mechanical plan changes stay inline and are ledgered. A wrong ruling costs visible rework; a parked question costs the session.

At an exhausted budget with open findings: rule on each — reviewer wrong, park it with why the work stands; real but nothing downstream builds on it, park it deferred; real and load-bearing, rule on the smallest change that unblocks dependent work and carry it into the next dispatch. Every adjudication is a ledger entry; a silent discard is forbidden.

## Common Rationalizations

| Excuse                                       | Reality                                                                                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dispatching is overhead; I'll do it myself   | Main-agent execution is the most expensive seat in the session. Dispatch.                                                                          |
| One more retry will converge                 | After the retry budget, only an in-scope small adjustment is allowed; a structural failure needs a worker change, plan revision, or user decision. |
| The fix was small; skip the verification     | Unverified fixes are how regressions land. Every fix gets verified.                                                                                |
| I'll paste the report into the next dispatch | Pasted text stays in your context forever. Pass the workspace path; the worker reads the file.                                                     |
| The ledger is bookkeeping                    | The ledger is what survives compaction. Controllers without one have re-dispatched completed task sequences.                                       |
| The plan is saved; I'll start without asking | The handoff gate is mandatory. Stop and ask whether to save, adjust, or execute.                                                                   |
| I'll edit the host config to enforce this    | Recommend the setting; never edit user configuration. Report a gap instead.                                                                        |
| The debugger can just modify the checkout    | Diagnose in a disposable worktree or copy. The source checkout stays read-only.                                                                    |

## References

- [Planning guide](references/writing-plans.md) — read before writing a plan.
- [Execution guide](references/execution.md) — read at execution start and on resume; contains adapter resolution, permission tiers, failure classification, diagnosis, and the review loop.

If a referenced guide cannot be located, report `blocked`; do not improvise.

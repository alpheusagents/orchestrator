# Execution Guide

Read this at execution start and on resume. It covers plan resolution, preflight, brief mapping, the ledger and its artifacts, plan changes, failure classification, the review loop, and close-out.

## Plan Resolution

1. Use the explicit plan path the user chose. It is the live plan; edit it in place.
2. If the plan sits inside an existing session directory (for example `.orchestrator/<session>/plan.md` or `.orchestrator/<session>/plans/<name>.md`), reuse that directory.
3. If the live plan is not writable, copy it to `.orchestrator/<YYYY-MM-DD>-<goal-slug>/plan.md`, record `Plan source: <original path>`, and treat the copy as live. Never modify the original in that case.
4. If the user says execute without a path, scan `.orchestrator/*/plan.md` and the `Plan:` lines in `.orchestrator/*/progress.md` for a matching goal. Use the single match; ask when several match or none does.
5. Ensure `<repo-root>/.orchestrator/` exists with a `.gitignore` containing `*` — the directory ignores everything, including the `.gitignore` itself; create both if absent (idempotent). If the live plan is outside `.orchestrator`, ensure a session workspace at `.orchestrator/<YYYY-MM-DD>-<goal-slug>/` exists for artifacts.

## Adapter

Resolve an adapter at execution setup, before the first dispatch:

1. Scan available skills for one named `orchestrator-adapter-<host>`. Confirm the candidate's `orchestrator-host` metadata, or its description when metadata is unavailable, names the current runtime and supplies host dispatch. If several match, ask which one describes the current runtime.
2. Load it and read its `Detection`, `Dispatch Mapping`, `Resume`, `Model Control`, `Permissions`, `Limits`, and `Gaps` sections. Require contract version `1`; if the adapter declares another version, report `blocked: incompatible <skill> contract <version>` and ask the user to update it. A missing `Detection` or `Dispatch Mapping` is `blocked`; treat any other missing required section as an unavailable capability. Record recommended settings the user has not applied as `Permission gap:` or `Model gap:`; never edit host configuration.
3. If none is installed, ask: "No adapter is installed for this runtime. Continue with generic probing, install `orchestrator-adapter-<host>`, or stop?"
4. Record `Adapter: <skill>` or `Adapter: generic (user-approved)` in the ledger.

Generic probing: find a tool that spawns a subagent/agent and identify a read-only target and a write/execute target. If only one general-purpose target exists, use it for every role but record `Permission gap: read-only not enforced`. If no dispatch tool exists, report `blocked` naming the missing capability.

## Preflight

Before the first dispatch:

- Check that tasks are numbered and each has a deliverable and verification.
- Check that the named inputs or spec path is reachable.
- Check that the live plan is readable; if it is not writable, use the copy fallback in Plan Resolution.
- Check that the named add-on is installed. If it is not, ask whether to continue without it, install it, or stop; record the ruling. If the plan has no add-on, treat it as `none`.
- Re-read the live plan, then derive one brief per task. Do not re-plan.
- If the plan has a small defect, rule and record it. If the defect changes scope or architecture, write a revision and ask.

## Brief Mapping

The plan is the human and audit artifact. The brief is the worker's contract. Build each `task_XXX-brief.md` mechanically:

1. Copy the plan's `### Task N` section.
2. Append `## Global Constraints`.
3. Append the plan's `## Review Focus` lines assigned to this task and its `**Review focus:**` field.
4. Append the active add-on's `### Task Briefs` rules, if any.
5. Append execution context: where the task fits, interfaces from earlier tasks, ambiguity resolutions, and parked findings in the touched area.

Do not paraphrase exact values. Do not ask the worker to read the whole plan. When a mechanical plan change renames a path or signature, update the briefs of tasks not yet dispatched; never rewrite a completed or in-flight task's brief.

## Permissions

Worker permissions are the routing table's tiers:

| Tier        | Grants                                                                                                                                                |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `read-only` | read files and run non-mutating commands; no checkout changes, no staging, no branch or HEAD moves; report file only (debugger: disposable workspace) |
| `safe-edit` | read-only, plus edits within the dispatch's stated scope and that task's commits; no destructive operations                                           |
| `execution` | safe-edit for test setup blocking validation, plus the suites and builds the dispatch names                                                           |

Read-only roles may write only their report file under the session workspace and, for the debugger, a disposable worktree or copy; they never modify the checkout. If the target cannot write the report, the worker returns the full report inline and the orchestrator writes it; if the orchestrator cannot write either, dispatch a write-capable worker to persist it. Record `Permission gap: report write`.

The adapter maps these tiers to recommended host enforcement and names any gap. Never edit host configuration. Destructive operations require explicit user approval.

## Workspace and Ledger

Scan existing `.orchestrator/*/progress.md` first lines:

- `# Orchestrator ledger — plan: <plan path>` is this session. A completion line means DONE — do not re-dispatch; resume at the first task without one. A last line that is a fix round, an adjustment, or a diagnosis resumes mid-loop.
- `# Orchestrator ledger — goal: <verbatim goal>` is a legacy session; apply the same rules.
- A ledger naming a different plan or goal belongs to another session: leave it alone.

New execution session: create the workspace if needed and write `progress.md` whose first line is the plan identity above. Record on following lines:

- `Goal: <verbatim goal>`
- `BASE: <git rev-parse HEAD>` — the final review's whole-change diff needs it.
- `Adapter: <skill>` or `Adapter: generic (user-approved)`
- `Add-on: <name>` or `Add-on: none`
- `Plan: <path>` — the live plan; update this line and the ledger's first line if the file moves.
- `Plan source: <path>` when the live plan is a copy fallback.

Record in the ledger, one line each:

- `Task <N>: complete (commits <base7>..<head7>, checks: pass)` for low-risk code tasks; `Task <N>: complete (commits <base7>..<head7>, review pass: spec+quality)` for reviewed code tasks; `Task <N>: complete (evidence: <one-liner>)` for non-code tasks — or `Task <N>: <count> findings parked` after a tripped breaker
- `Task <N>: session <id> (<role>)` — written at dispatch when the host returns a resume handle; omit it on hosts that do not
- `Task <N>: fix round <R>/<cap> (<X> addressed, <Y> open — <finding one-liners>)`
- `Task <N>: adjustment <A>/2 — <what changed> — <why>`
- `Task <N>: diagnosed — <root-cause one-liner> (task_XXX-debug[-r<R>].md)` — the diagnosis exists; resume at the fix dispatch, not a fresh diagnosis
- `Task <N>: deferred: <finding one-liner>`
- `Task <N>: blocked — <why>`
- `Plan change: <what> — <why>`
- `Plan revision: <path> — <why>`
- `Ruling: <what you decided> — <why>`
- `Session: complete (commits <base7>..<head7>, final review: pass|findings parked)` or `Session: stopped — <why>`

Session artifacts live in the workspace; the live plan may live elsewhere:

| File                  | Written by   | Contents                                                                                                                        |
| --------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `plan-r<R>.md`        | orchestrator | a scope or architecture revision; the live plan is at the path in the ledger                                                    |
| `task_XXX-brief.md`   | orchestrator | full requirements; exact values appear only here; copied from the plan task, reused by every re-dispatch and resume             |
| `task_XXX-report.md`  | worker       | the worker's full report; fix reports append to it; the orchestrator writes it only on the report-write fallback                |
| `task_XXX-debug.md`   | debugger     | the diagnosis: reproduction, causal chain, root cause, proposed smallest repair                                                 |
| `task_XXX-package.md` | orchestrator | review package: commit list + `--stat` + full diff; produced with shell redirection, never read into the orchestrator's context |
| `task_XXX-review.md`  | reviewer     | the review report                                                                                                               |
| `task_XXX-verify.md`  | verifier     | per-finding verdicts                                                                                                            |

Debugger workspaces are disposable and removed after the diagnosis; keep the diagnosis and test diff in the session workspace.

## Plan Changes

The live plan is a living document during execution.

- Before each task, re-read the live plan. If it changed since the last read, treat it as an external edit: reconcile it, update undispatched briefs, and ledger it. Never blind-overwrite a user edit.
- **Mechanical changes** — renames, paths, signatures, interface names, import paths, or changes caused by an earlier task's implementation — are applied in place without asking. Update the live plan and the briefs of undispatched tasks; record `Plan change: <what> — <why>`.
- **Scope or architecture changes** — new or removed requirements, a different approach, changed acceptance criteria — require a `plan-r<R>.md` revision in the session workspace, a short delta summary, and user approval before affected dispatches. After approval, update the live plan and record `Plan revision: <path> — <why>`.
- **Plan path changes** — if the user moves or renames the live plan, update the ledger's first line and `Plan:` line, then record `Plan change: path <old> -> <new>`.
- **Completed or in-flight tasks are never rewritten.** If a completed task's interface changes, add a follow-up task or a fix round instead of editing its brief.

The final review cites the live plan, the latest revision, and the ledger's `Plan change:` lines.

## Failure Classification

| Class                | Response                                                                         |
| -------------------- | -------------------------------------------------------------------------------- |
| Transient            | Retry                                                                            |
| Insufficient context | Retry with more context                                                          |
| Implementation bug   | Dispatch repair task; diagnose via debugger first when the root cause is unknown |
| Wrong approach       | Write `plan-r<R>.md`, summarize the delta, and ask before affected dispatches    |
| Permission problem   | Blocked; report to user                                                          |
| Unknown              | Delegate investigation; debugger when the unknown is a failure's root cause      |

When a task survives the retry budget, change the worker: dispatch a fresh implementer on a more capable model, framed as "prior attempts failed N times; you own it now", with the findings in context. If the repair is small, in-scope, and non-breaking, use the separate adjustment budget of two and ledger each; a scope, architecture, public-interface, dependency, data, or other breaking change needs user approval. When the root cause is unknown, dispatch a debugger (`<skill_dir>/prompts/debugger.md`) before the repair. Every repair gets a verification (`<skill_dir>/prompts/verifier.md`) that verdicts the findings and inspects only the fix surface.

## Diagnosis

Diagnosis is not a fix round and consumes no budget. When the findings do not localize the defect, dispatch a debugger first (diagnosis only), then scope the fix from its diagnosis. The fix dispatch's context carries the `task_XXX-debug.md` path; the implementer reads the diagnosis itself.

When the debugger needs to write a failing test or instrument the code, the orchestrator creates a disposable workspace before dispatch: a detached Git worktree when the failure reproduces from committed code, or a full copy when it depends on uncommitted or untracked files or the repo is not Git. Pass it as `[WORKDIR]`; the debugger may modify and run tests only there. The source checkout stays read-only. Remove the workspace after the diagnosis; keep the diagnosis and test diff.

A wrong or refuted diagnosis gets a re-diagnosis dispatch writing `task_XXX-debug-r<R>.md`, never an overwrite of the first; record the refutation as a `Ruling:` ledger line naming the re-diagnosis file. A diagnosis refuted twice (re-diagnoses up to -r2) is not converging — stop re-diagnosing, treat it as a `Wrong approach` and write a plan revision.

## Review Loop

Per-task reviews are task-scoped gates for medium/high-risk tasks; low-risk tasks close on worker evidence plus deterministic checks. A broad whole-change review happens once, at the end, for every session.

1. When a task requires review, after the implementer reports, generate `task_XXX-package.md` with shell redirection (`git log --oneline <BASE>..<HEAD>`, `git diff --stat`, `git diff -U10`) — never read the diff into your context. Never dispatch a reviewer without a package file.
2. Dispatch the reviewer with the package, brief, worker report, task objective, acceptance criteria, and the binding constraints copied verbatim: Global Constraints, the task's Review Focus lines, and the add-on's review requirements. Do not pre-judge findings and never tell a reviewer to ignore one.
3. On `fail` in either axis — or any confirmed blocking finding — send the findings verbatim back to the same implementer session when the host can resume it (fix rounds 1-3 and adjustments). Otherwise dispatch a fresh implementer with the brief, report path, and findings; the report file is the persistent memory. Diagnose first when the findings do not localize the defect. Each fix round ends with one `verifier` pass over a fresh `task_XXX-package-r<R>.md`, the prior findings, and what counts as addressed; new breakage joins the open findings. Ledger every round.
4. After the fix-round budget, up to two small in-scope adjustments are allowed; each gets a verifier pass and a ledger line. A big or breaking change needs user approval. After two failed adjustments, mark blocked.
5. Every repair's verification is present before the next task starts; unreviewed fixes are how regressions land.
6. Close a reviewed task when both axes pass; close a low-risk task when its checks pass. At an exhausted budget, adjudicate findings and ledger completion or mark blocked. Deferred findings are ledgered and triaged at final review; a finding silently dropped is forbidden.

Suggestions never block. Never re-run a suite the worker already ran; its report file is the test evidence.

## Final Review and Summary

The whole-change review closes every session, regardless of per-task risk:

1. Generate `final-package.md` (commit list + `--stat` + full diff, session BASE..HEAD, shell redirection). Dispatch one reviewer over it against the goal, the live plan (or latest revision), inputs/spec, Global Constraints, Review Focus, and the ledger's `Plan change:` lines, on both axes.
2. Triage deferred findings against the final review: a confirmed load-bearing one gets the smallest unblocking repair; the rest are reported, never silently dropped.
3. Summarize to the user: the goal, shipped commits, test evidence, and every deferred or parked item with its reason. Cite, for every claim:

    - the live plan path and any `plan-r<R>.md` revision;
    - the review verdict and the package path;
    - the test commands and results from the report files, not the worker's one-line summary;
    - every parked or deferred finding with its ledger line.

    Do not claim "tests pass" or "done" from a worker's summary alone. If the final review is a pass, say so; if findings are parked, name them.

4. Append the close-out line to the ledger: `Session: complete (commits <base7>..<head7>, final review: pass|findings parked)` or `Session: stopped — <why>`.

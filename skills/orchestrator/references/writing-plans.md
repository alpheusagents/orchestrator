# Planning Guide

## What a Plan Is For

A plan turns a goal into a sequence of reviewable deliverables. It is the contract between planning and execution, the source of every worker brief, and the audit artifact the final review cites. It records the choices a worker cannot infer: paths, names, contracts, values, proof, and task order. It is not a design essay or a code dump.

## Planning Workspace

At planning start, create `<repo-root>/.orchestrator/<YYYY-MM-DD>-<goal-slug>/` with a `.gitignore` containing `*`. Use it for explorer and researcher reports, planning notes, and later artifacts. Create it only when the host is writable.

## Plan File and Lifecycle

Keep the plan in conversation until the user asks to save it. On save, use the path the user chooses. Any path works, including `.orchestrator/<session>/plan.md`, `./plan.md`, or `./plans/<name>.md`; suggest the session `plan.md` when the user has no preference.

The lifecycle is:

1. Write the plan.
2. Run the self-review gate.
3. Keep it in conversation unless the user asks to save.
4. On save, write it verbatim to the chosen path.
5. Stop and ask whether to save, adjust, or execute.
6. Execute only after an explicit yes or explicit execute request.

Never overwrite an existing plan silently: ask, or write a revision. A save request writes the existing plan verbatim; do not re-plan.

## Plan Header

Start every plan with this header:

```markdown
# <Goal> Plan

**Goal:** <one sentence describing the outcome>

**Architecture:** <2-3 sentences on the approach>

**Tech Stack:** <languages, frameworks, and tools that constrain the work>

**Inputs:** <spec or design paths, or "none">

**Add-on:** <none or the active add-on>

**Add-on rationale:** <why this add-on is active or why none; omit unless the selection was declined, skipped, overridden, or not applicable>

**Execution:** Orchestrator dispatch loop; this plan is the source of briefs

## Global Constraints

<Project-wide requirements: version floors, dependency limits, naming rules,
platform requirements, compatibility. One line each, with exact values.
Every task inherits this section.>

## Review Focus

<The input classes, failure modes, or edge conditions most likely to bite a
user and least likely to be covered by a task's own tests. One line each.
Name the condition and the expected behavior. Add the test that pins each
line to the task that owns the code.>

## Tasks

<One task section per deliverable.>
```

If there are no separate inputs, write `**Inputs:** none` and argue from the goal. The plan is still the binding implementation argument.

## Task Design

A task is the smallest deliverable worth reviewing on its own:

- Keep setup, configuration, scaffolding, and documentation with the deliverable that requires them.
- Create a separate task only where a reviewer could reject one deliverable while accepting another.
- Order tasks by dependency; a task that consumes an interface comes after the task that defines it.
- Mark tasks that can run in parallel and name what they depend on.
- Keep each task small enough for one worker context and one review package.
- If a task owns a `Review Focus` line, add the test that covers it.

Do not create catch-all tasks such as "refactor everything" or "add tests later." A task needs an observable deliverable.

## Task Template

Use this shape, adapting the step order to the active add-on:

```markdown
### Task N: <Name>

**Deliverable:** <one sentence observable outcome>

**Files:**

- Create: `exact/path`
- Modify: `exact/path:lines`
- Test: `exact/path`

**Interfaces:**

- Consumes: <exact signatures from earlier tasks>
- Produces: <exact names, parameters, return types, and side effects later tasks rely on>

**Steps:**

1. <One action with a checkable result.>
2. <Next action.>

**Verification:**

- Command: `<exact command>`
- Expected: <pass/fail text, counts, exit code, or output shape>

**Commit:** `<commit message>`

**Review focus:** <The Review Focus lines this task owns, or "none".>

**Parallel:** <yes/no; name dependencies>

**Brief notes:** <Context the worker needs that the task text cannot know: where the task fits, decisions from earlier tasks, parked findings in the touched area.>
```

The default profile usually runs:

1. Add the tests named in the task.
2. Implement the exact interface.
3. Run the focused check.
4. Run the project suite.
5. Commit.

Code tasks require tests; non-code tasks require the verification named in the task. A strict test-first ritual is not required unless the active add-on requires it.

## Step Quality

Each step must let the implementer do exactly one reasonable thing.

- **Test step:** exact test file, test name, and assertions, with the values the plan pins.
- **Code step:** exact signature, file, and scope. Include a body only when the algorithm is not determined by the signature and tests.
- **Verification step:** exact command and the result that proves the step succeeded.
- **Commit step:** the files to stage and the commit message.

Do not write "handle edge cases," "add validation," "wire it up," or "TBD." Those are decisions, and the plan exists to record them. Do not paste large implementation bodies; if most of the plan is code, the plan has become a transcript.

## Add-on Profiles

The plan header names the add-on and records the selection rationale when the selection was declined, skipped, overridden, or not applicable. The default profile names tests and verification without enforcing a test-first ritual; the active add-on's `### Planning` section replaces the step sequence. Do not hardcode one add-on into this guide.

## Self-Review Gate

Run this before saving. It is the orchestrator's own checklist, not a subagent dispatch.

1. **Coverage:** every requirement in the goal or spec maps to a task.
2. **Deliverables:** every task has an observable outcome and a verification step.
3. **Interfaces:** names, parameters, return types, and side effects agree across tasks.
4. **Briefs:** each task contains enough exact values for its brief to stand alone.
5. **Review Focus:** every listed condition has a test in the task that owns it.
6. **Dependencies:** task order and parallel flags match the interfaces.
7. **Add-on:** the step profile matches the plan header, the selection rationale is recorded when the selection was declined, skipped, overridden, or not applicable, and every add-on-specific requirement appears in the task or brief.
8. **Proportion:** the plan is not a code transcript, and no task is too large for one review.
9. **Decisions:** no `TBD`, "appropriate," "as needed," or other undecided lines remain.
10. **Host neutrality:** the plan describes outcomes and interfaces, not one host's tools or command syntax.

Fix gaps inline, then save only if the user asked.

## Anti-Patterns

- **The transcript:** the plan contains the implementation instead of the decisions.
- **The mega-task:** one task covers several reviewable deliverables.
- **The hidden interface:** later tasks depend on names or types the plan never defines.
- **The missing gate:** a task has no verification command or expected result.

## Final Gate

A good plan gives a worker everything needed to start and nothing that replaces their judgment. If a line does not decide a path, a name, a contract, a value, a proof, or an order, it does not belong in the plan.

---
name: orchestrator-addon-test-driven-development
description: Use only after explicit user consent. The user asks for test-driven development, or accepts an offer made because the current plan needs it. Never activate without consent. Adds strict red-green-refactor enforcement to implementer, tester, debugger, reviewer, and verifier dispatches.
metadata:
    orchestrator-kind: addon
    orchestrator-contract: "1"
---

# Test-Driven Development Add-on

An opt-in methodology for orchestrator sessions. It changes the plan steps, task briefs, and role dispatches. It is never activated without explicit user consent and is not a general coding style.

## When to Use

Use it only after explicit user consent: either the user requests test-driven development, or the user accepts an offer the orchestrator makes because TDD is needed.

A workflow is **applicable** when it changes runtime behavior, a test can observe that behavior through a public interface, and the project has a test runner or the task can add one within scope.

TDD is **needed** when the expected behavior is not already pinned by existing tests or a complete specification, so test-first adds discovery or regression value. It is **not needed** when tests already exist (for example, copied from another repository) or the behavior is fully known and only implementation remains; recommend skipping it in those cases.

Do not activate it for documentation, comments, configuration-only changes, generated code, throwaway prototypes, pure exploration, or work with no observable behavior and no reasonable test seam. That is **not applicable**; explain why it does not fit and continue with the base workflow. Do not offer an override that cannot produce a meaningful failing test.

If the user asks for TDD on an applicable but not-needed workflow, ask once: skip it (recommended) or use it anyway. If the user asks on a not-applicable workflow, explain why it does not fit; do not offer a meaningless override.

## The Core Rule

A production change is valid only after a test has failed for the right reason.

If code was written before the test, discard that code and rebuild from the test. Do not keep it as a reference, do not adapt it while writing the test, and do not partially reuse it.

## The Cycle

### 1. Choose one behavior

Pick one observable behavior for the next test. If the behavior has an "and" in its name, it is probably two behaviors.

### 2. Write the test

Name the behavior clearly. Use the exact values the plan or spec pins. Assert on the result the caller sees, not on internal structure.

```ts
test("rejects an empty email", async (): Promise<void> => {
    const result = await submitForm({ email: "" });
    expect(result.error).toBe("Email required");
});
```

### 3. Observe the failure

Run the focused test before changing production code. Confirm:

- it fails rather than errors;
- the failure is the one you expected;
- it fails because the behavior is missing, not because of a typo or a broken fixture.

If it passes immediately, the test does not cover a new behavior. Rewrite it.

### 4. Make it pass

Write the smallest production change that satisfies the test. Do not add options, abstractions, or behavior the test does not require.

### 5. Verify the suite

Run the focused test again, then the project's suite, not only the file you touched. The focused test must pass, the suite must pass, and the output must be clean enough that a reviewer can read it.

### 6. Refactor

Only after green: remove duplication, improve names, or extract a helper. Keep the suite green. Do not add behavior during refactor.

### 7. Commit

Commit the test and the production change together, with a message that names the behavior.

## Test Quality

Before writing assertions, identify which production edit should make the test fail. If the answer is a rename or a constant change, the test is checking a decision, not a behavior.

- Test one behavior per test.
- Derive expected values independently; do not compute them with the code under test.
- Assert on real behavior. A mock assertion proves the mock exists, not that the component works.
- Mock the slow or external boundary, not the logic the test depends on.
- Keep test-only helpers in test utilities, not on production classes.
- Cover the error, empty, boundary, and unauthorized cases the plan names.
- Run a mental mutation check: if a branch, argument, or return value changed, would at least one test fail?

## Common Shortcuts

| Shortcut                               | Why it fails                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| "This is too small to matter."         | Small code still breaks, and the test is cheap.                                                              |
| "I will add the test after it works."  | A test written after the code passes immediately; it proves the current behavior, not the intended behavior. |
| "I already checked it by hand."        | Manual checks are not repeatable and leave no evidence for the reviewer.                                     |
| "I will keep the code as a reference." | You will adapt it, and the next test will be shaped by the code instead of the behavior.                     |

## Stop Signals

Stop and rebuild from the test when you notice:

- production code changed before a test failed;
- a test was written after the implementation;
- a new test passed on its first run;
- the failure message does not match the expected behavior;
- the test asserts on a mock or a private implementation detail;
- the focused test passes but the project suite has not been run;
- the exception is "just this once."

## Orchestrator Integration

**Contract version:** 1
**Add-on:** test-driven-development

### Activation

- The orchestrator applies the add-on selection table in the core skill. TDD is activated only after explicit user consent: a direct request or acceptance of a need-based offer.
- `Needed`: the expected behavior is not already pinned by existing tests or a complete specification, and test-first adds discovery or regression value.
- `Not needed`: tests already exist or the behavior is fully known and only implementation remains. Recommend skipping.
- `Not applicable`: documentation, comments, configuration-only changes, generated code, throwaway prototypes, pure exploration, or no observable behavior and no reasonable test seam. Explain why it does not fit; no override unless a meaningful failing test can still be written.
- Requested and needed: activate.
- Requested but not needed: ask once, “TDD is applicable here but not needed because <reason>. Skip it (recommended) or use it anyway?”
- Needed but not requested: offer, “This work would benefit from TDD because <reason>. Use it?”
- Neither requested nor needed: ignore.
- If the user chooses to use TDD and the skill is not installed, ask whether to install it, continue without it, or stop. Installing stops the session until the skill is installed and the session restarts or resumes.
- If the user declines a needed offer or chooses skip, follow the user; record a ruling and do not re-ask in the session.
- The plan header records `**Add-on:** test-driven-development` or `**Add-on:** none`, with an `**Add-on rationale:**` line for a non-default selection: declined, skipped, overridden, or not applicable. The execution ledger records `Add-on: test-driven-development` or `Add-on: none` and the ruling.
- The orchestrator must not activate silently or apply TDD without consent. A not-applicable workflow is not activated unless the user explicitly approves an exception and a meaningful failing test can still be written; record the ruling.

### Planning

Replace the default task step sequence with this profile:

1. Write the failing test with exact file, name, and assertions.
2. Run the focused test and record the expected failure.
3. Implement the minimal production change.
4. Run the focused test and record the expected pass.
5. Run the project suite and record the result.
6. Refactor while keeping the suite green.
7. Commit the test and production change together.

Every behavior-changing task gets a test step before its production step. A task that cannot have a test needs an exception in the plan and the ledger. A copied or pre-existing test can serve as the red evidence only if it fails for the intended reason before the production change; a test that already passes is not red evidence.

### Task Briefs

Add to each behavior-changing task's brief:

- the exact test file, test name, and assertions;
- for a copied or pre-existing test, the exact test and the failure it must produce before the production change; a test that already passes cannot serve as red evidence;
- the focused command and the failure it must produce;
- the focused command and the pass it must produce;
- the project suite command;
- the requirement to report the observed red and green output;
- the exception and ruling for any behavior that cannot be tested.

### Dispatch

#### implementer

Start from a failing test. Do not change production code until you have observed the failure for the intended reason. Discard any code written before the test and rebuild from the test. Write the smallest change that passes, then run the focused test and the project suite. Report the red and green evidence for every behavior. Refactor only while green.

#### tester

Run the project suite, not only the focused test. Confirm the output is clean. Check the implementer's report for red and green evidence for every behavior it claims. Do not modify a test to make it pass; a failing test is evidence, not an obstacle. Report missing red evidence as a failure.

#### debugger

The diagnosis must include a failing test that reproduces the defect, or state why no test can reproduce it and propose the smallest testable reproduction. Write and run the test only in the provided disposable workspace; report the test diff and do not modify the source checkout. A root-cause claim without a reproduction is provisional. Do not propose a repair that cannot be pinned by a test unless the exception is explicit.

#### reviewer

Missing red evidence is a confirmed quality issue. Also flag a test that passed immediately, asserts on a mock instead of real behavior, or checks a private implementation detail. Judge spec compliance and quality independently. A stated reason for skipping the test does not lower the finding.

#### verifier

A code fix without failing-test-first evidence is an open finding. Check that the fix includes a regression test that failed before the repair and passes after it. Do not re-run the full suite to confirm the report; run one focused test only when reading the fix raises a specific doubt no existing run answers.

### Evidence

The implementer report includes, per behavior:

```text
TDD: <test name> — red: <command> -> <observed failure>; green: <command> -> <observed pass>
```

It also includes the project suite command and result. "Tests pass" is a summary, not evidence. A test that already passes is not red evidence; if no failing test can be produced, record an exception instead of claiming TDD. The tester and reviewer check the evidence against the reported changes. A behavior that cannot be tested is recorded as an exception with the user's approval.

### Ledger

- Plan header: `**Add-on:** test-driven-development` or `**Add-on:** none`, plus `**Add-on rationale:**` for a non-default selection: declined, skipped, overridden, or not applicable.
- Execution ledger: `Add-on: test-driven-development` or `Add-on: none`.
- Task completion: include `tdd evidence` when every behavior has red and green evidence.
- Exception: `Ruling: TDD exception — <behavior> — <why no test> — user approved`.
- Skip: `Ruling: TDD skipped — not needed, user chose skip`.
- Override: `Ruling: TDD override — not needed, user chose use`.
- Decline: `Ruling: TDD declined — needed, user chose default`.
- Not applicable: `Ruling: TDD not applicable — <why>`.
- Fix round or adjustment: record the regression test that failed before the repair.

## Standalone Use

When the user invokes this skill directly without an active orchestrator session, apply the same cycle to the work in front of you. Do not dispatch subagents unless the orchestrator skill is active.

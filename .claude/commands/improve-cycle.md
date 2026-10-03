---
description: One improvement cycle. Measure → choose → build → review → verify → PR → log. Run repeatedly (scheduled).
---

# Improve cycle

Read CLAUDE.md and every file it lists first. Today's date matters: use it to judge what is stale.

## 0. Preconditions
- If CLAUDE.md "Stack and deploy" still says UNKNOWN, run bootstrap instead and stop.
- If there are open loop PRs older than 7 days with no human response, do NOT start new class B/C work. Only do class A work and add one line to the PR asking for review. (Don't pile up unreviewed work.)
- Until 2026-11-08, backlog item B32 (COP31 readiness) outranks every other class B/C item.
- Pull `main`. Create branch `loop/YYYY-MM-DD`.

## 1. Apply answers
- For every question in docs/QUESTIONS.md with a non-empty `Answer:`, update facts.yaml / site-map.md / BACKLOG.md accordingly, unblock related backlog items, and move the question to "Resolved" with today's date.

## 2. Measure
- Copy `reports/audit-latest.json` to `reports/audit-previous.json`.
- Use the `auditor` subagent against the live site. Merge its findings into docs/BACKLOG.md (new IDs for new findings; don't duplicate).

## 3. Choose
- Re-score the backlog (severity × visibility ÷ effort).
- Take ALL unblocked class A items (max 25 files changed).
- Take at most ONE unblocked class B or C item: the highest score. If the design brief is not yet approved (merged), do not take class C items other than the brief itself.

## 4. Build
- Screenshot every page you'll touch into `reports/screens/before/` (local preview).
- Make the changes. Copy changes go through the `editor` subagent. Facts come only from facts.yaml.
- Screenshot into `reports/screens/after/`.

## 5. Review (all must PASS)
- `guardian` on the full diff.
- `editor` if any visible text changed.
- `design-critic` if any markup/CSS changed.
- On FAIL: fix and re-review, max 2 rounds per item. Still failing → revert that item, mark it `needs-human` in BACKLOG with the reviewer's reasons.

## 6. Verify
- `node scripts/audit.mjs --base <local preview> --fail-on-regression`. If it fails, fix or revert until it passes.

## 7. Ship
- Class A only → one PR labelled `safe-auto`.
- Class B/C item → separate PR labelled `needs-review` or `design-review`.
- PR body: summary in 3 lines; each item with backlog ID, what/why; before/after screenshots (mobile first); reviewer verdicts; new questions.
- Never merge class B/C yourself.

## 8. Log
- Add an entry to the top of docs/LOOP_LOG.md: date, branch, PR links, items done, items reverted and why, audit error/warning counts before → after, new questions, one design pattern that worked (from design-critic).
- Commit BACKLOG, LOOP_LOG, QUESTIONS on the same branch as the class A PR.

## Stop conditions
- Nothing unblocked to do → only update LOOP_LOG ("no-op cycle") and exit.
- Any action would touch deploy, DNS, secrets or hosting → stop and add a question.

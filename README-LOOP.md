# GYC website improvement loop — setup

## What this is
A Claude Code setup that improves theglobalyouth.co on its own, every week: it audits the live site, picks the most valuable fixes, makes them on a branch, has four reviewer subagents check them (facts/privacy, copy, design), and opens pull requests with before/after screenshots.

## Files
- `CLAUDE.md` — the rules Claude Code follows in this repo.
- `docs/brand/facts.yaml` — the only source of facts. Update this, not the pages.
- `docs/brand/voice.md`, `docs/brand/references.md` — voice and visual direction.
- `docs/site-map.md`, `docs/BACKLOG.md`, `docs/QUESTIONS.md`, `docs/LOOP_LOG.md`, `docs/fix-pack.md` — the loop's working memory.
- `.claude/agents/` — auditor, guardian, editor, design-critic.
- `.claude/commands/` — bootstrap (first run) and improve-cycle (every run).
- `scripts/audit.mjs` — crawler + link checker + pattern scan, with a regression gate.
- `scripts/screens.mjs` — desktop/mobile screenshots.
- `.github/workflows/improve-loop.yml` — weekly schedule on GitHub.
- `scripts/loop-local.sh` — the same loop from your own terminal.

## Setup (once, about 30 minutes)
1. Make sure the website's code is in a GitHub repo and that this repo is what's actually deployed.
2. Copy everything in this folder into the root of that repo. Commit to `main`.
3. In VS Code, open the repo, start Claude Code, and paste the kickoff prompt below.
4. When bootstrap has opened its PRs: in GitHub → Settings → Secrets and variables → Actions, add `ANTHROPIC_API_KEY`. Optionally add the variable `AUTO_MERGE_SAFE=true` to let class A fixes merge without a human.
5. Enable auto-merge in the repo settings if you set `AUTO_MERGE_SAFE`.

## Kickoff prompt (paste into Claude Code in VS Code)

```
You are taking over the continuous improvement of theglobalyouth.co.

1. Read CLAUDE.md and every file it lists. Then read .claude/commands/bootstrap.md and follow it step by step.
2. Before changing anything, tell me in 10 lines or less: the stack, how the site is deployed, whether this repo matches the live site, and anything that would stop you. Wait for my "go".
3. After "go", complete bootstrap without asking me further questions. Anything you're unsure about goes into docs/QUESTIONS.md, not to me.
4. Finish by showing me the PR links and the first LOOP_LOG entry.
```

That is the only time you need to be in the loop for setup. After that the schedule runs it.

## Your weekly 5 minutes (or delegate this)
- Answer any new questions in `docs/QUESTIONS.md` (write under `Answer:`).
- Merge or comment on PRs labelled `needs-review` / `design-review`.
Under the GYC handbook this sits with the Communications Director and the Chair, not the Founder.

#!/usr/bin/env bash
# Run improvement cycles locally from the VS Code terminal, without GitHub Actions.
# Usage: ./scripts/loop-local.sh [cycles=1] [hours_between=168]
set -euo pipefail
CYCLES="${1:-1}"; GAP_HOURS="${2:-168}"
for ((i=1; i<=CYCLES; i++)); do
  echo "=== Cycle $i/$CYCLES — $(date -u +%F' '%H:%M) UTC ==="
  git checkout main && git pull --ff-only
  [ -f reports/audit-latest.json ] && cp reports/audit-latest.json reports/audit-previous.json || true
  node scripts/audit.mjs --base https://theglobalyouth.co
  claude -p "Today is $(date -u +%F). Read CLAUDE.md, then follow .claude/commands/improve-cycle.md exactly (bootstrap.md instead if Stack and deploy says UNKNOWN). Open PRs with gh. Never push to main." \
    --permission-mode acceptEdits \
    --allowedTools "Read Edit Write Glob Grep WebFetch Bash(git:*) Bash(gh:*) Bash(node:*) Bash(npm:*) Bash(npx:*) Bash(php:*) Bash(python3:*) Bash(cp:*) Bash(mkdir:*) Bash(ls:*) Bash(cat:*)" \
    --max-turns 120 \
    | tee "reports/cycle-$(date -u +%F-%H%M).log"
  if (( i < CYCLES )); then echo "Sleeping ${GAP_HOURS}h"; sleep $((GAP_HOURS*3600)); fi
done

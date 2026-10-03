# Local improvement loop for theglobalyouth.co (Windows, no GitHub).
# One run = one improve cycle: audit live -> Claude Code (headless) follows .claude/commands/improve-cycle.md
# on loop/<date> branches -> class A (safe-auto) branches auto-merge into main -> upload list written.
# Nothing is ever uploaded: a human uploads the files listed in reports/UPLOAD-<date>.md.
#
# Usage:    powershell -ExecutionPolicy Bypass -File scripts\loop-local.ps1 [-NoAutoMerge] [-MaxTurns 150]
# Schedule: powershell -ExecutionPolicy Bypass -File scripts\schedule-loop.ps1

param(
  [switch]$NoAutoMerge,
  [int]$MaxTurns = 150,
  [int]$Port = 8090
)

# Native tools write progress to stderr; never let that abort the run. Exit codes are checked by hand.
$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
$Stamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd-HHmm")
$Today = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd")
New-Item -ItemType Directory -Force reports | Out-Null
$Log = Join-Path $Root "reports\cycle-$Stamp.log"
$Utf8 = New-Object System.Text.UTF8Encoding($false)

function Log($msg) {
  $line = "[$((Get-Date).ToString('HH:mm:ss'))] $msg"
  Write-Host $line
  [System.IO.File]::AppendAllText($Log, "$line`r`n", $Utf8)
}
# Run a command line through cmd so stdout+stderr land in the UTF-8 log untouched. Returns the exit code.
function Run($cmdline) {
  cmd /c "$cmdline >> `"$Log`" 2>&1"
  return $LASTEXITCODE
}
function FactCount {
  $out = (cmd /c "node scripts/check-facts.mjs 2>&1") -join "`n"
  if ($out -match "(\d+) contradiction") { return [int]$Matches[1] }
  if ($out -match "check-facts: OK") { return 0 }
  return 9999
}

# --- Claude Code CLI: PATH first, else the binary bundled with the newest VS Code extension ---
$Claude = (Get-Command claude -ErrorAction SilentlyContinue).Source
if (-not $Claude) {
  $Claude = Get-ChildItem "$env:USERPROFILE\.vscode\extensions" -Directory -Filter "anthropic.claude-code-*" -ErrorAction SilentlyContinue |
    Sort-Object { [version](($_.Name -replace '^anthropic\.claude-code-', '') -replace '-.*$', '') } -Descending |
    ForEach-Object { Join-Path $_.FullName "resources\native-binary\claude.exe" } | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $Claude) { Log "STOP: Claude Code CLI not found (install it, or the VS Code extension)."; exit 2 }
Log "Claude: $Claude"

# --- Preconditions: clean tree on main ---
$dirty = git status --porcelain
if ($dirty) { Log "STOP: working tree has uncommitted changes. Commit or stash them, then rerun."; Log ($dirty -join "`n"); exit 3 }
git checkout -q main 2>$null
if ($LASTEXITCODE -ne 0) { Log "STOP: cannot check out main."; exit 3 }

# --- Local preview (the cycle verifies against it) ---
$preview = Start-Process -FilePath "node" -ArgumentList "scripts/preview.mjs", "--port", "$Port" -WorkingDirectory $Root -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 2

try {
  # --- Measure live (the cycle's baseline) ---
  if (Test-Path reports\audit-latest.json) { Copy-Item reports\audit-latest.json reports\audit-previous.json -Force }
  Log "Auditing live site..."
  Run "node scripts/audit.mjs --base https://theglobalyouth.co" | Out-Null

  # --- One cycle, headless. Prompt goes in on stdin. ---
  $promptFile = Join-Path $env:TEMP "gyc-loop-prompt-$Stamp.txt"
  $prompt = @"
Today is $Today. You are running unattended from scripts/loop-local.ps1 (local mode, no GitHub).
Read CLAUDE.md (including "Local mode"), then follow .claude/commands/improve-cycle.md exactly.
The local preview is already running at http://localhost:$Port (use that as <local preview>). Use the auditor, guardian, editor and design-critic subagents as the command says.
Do not run gh, git push or git pull. "Open a PR" = commit on the loop/ branch and write reports/PR-<branch with / replaced by ->.md containing a line "Label: <label>".
Class A work goes on branch loop/$Today; one class B/C item goes on its own branch loop/$Today-<short-name>, created from main.
Never merge into main yourself. Never upload anything. When done, commit everything and leave the working tree clean.
If you need a human decision, add it to docs/QUESTIONS.md and carry on with other work.
"@
  [System.IO.File]::WriteAllText($promptFile, $prompt, $Utf8)
  Log "Running improve cycle (max $MaxTurns turns)..."
  $allowed = '"Read" "Edit" "Write" "Glob" "Grep" "WebFetch" "Agent" "Bash(git:*)" "Bash(node:*)" "Bash(npm:*)" "Bash(npx:*)" "Bash(cp:*)" "Bash(mv:*)" "Bash(mkdir:*)" "Bash(ls:*)" "Bash(cat:*)" "Bash(curl:*)" "Bash(sed:*)" "Bash(grep:*)" "Bash(head:*)" "Bash(tail:*)" "Bash(diff:*)" "Bash(wc:*)"'
  $code = Run "type `"$promptFile`" | `"$Claude`" -p --permission-mode acceptEdits --max-turns $MaxTurns --allowedTools $allowed"
  Log "Claude exited with code $code"
  Remove-Item $promptFile -ErrorAction SilentlyContinue

  # --- Leave main checked out and clean ---
  if (git status --porcelain) { Log "WARN: cycle left uncommitted changes; stashed as 'loop-leftovers-$Stamp'."; git stash push -u -m "loop-leftovers-$Stamp" 2>$null | Out-Null }
  git checkout -q main 2>$null

  # --- Auto-merge class A (safe-auto) branches; undo any merge that adds fact contradictions ---
  if (-not $NoAutoMerge) {
    $merged = git branch --merged main --format "%(refname:short)"
    foreach ($b in (git branch --list "loop/*" --format "%(refname:short)")) {
      if ($merged -contains $b) { continue }
      $pr = (git show "${b}:reports/PR-$($b -replace '/', '-').md" 2>$null) -join "`n"
      if ($pr -notmatch "Label:\s*safe-auto") { Log "Waiting for human review: $b"; continue }
      $before = FactCount
      git merge --no-ff -q -m "Merge $b (safe-auto)" $b 2>$null | Out-Null
      if ($LASTEXITCODE -ne 0) { git merge --abort 2>$null; Log "Merge conflict, left for human: $b"; continue }
      $after = FactCount
      if ($after -gt $before) { git reset -q --hard HEAD~1; Log "Refused $b : facts check got worse ($before -> $after)"; continue }
      Log "Merged into main: $b (facts check $before -> $after)"
    }
  }

  # --- What a human must upload ---
  Run "node scripts/upload-list.mjs main --write" | Out-Null
  # Commit it so the next scheduled run starts from a clean tree.
  git add reports/UPLOAD-*.md 2>$null
  git -c core.autocrlf=false commit -q -m "Upload list $Today" 2>$null | Out-Null
  Log "Upload list: reports\UPLOAD-$Today.md"
}
finally {
  if ($preview -and -not $preview.HasExited) { Stop-Process -Id $preview.Id -Force -ErrorAction SilentlyContinue }
  Log "Done. Log: $Log"
}

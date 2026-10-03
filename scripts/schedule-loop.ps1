# Registers (or removes) the weekly local improvement loop in Windows Task Scheduler for the current user.
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\schedule-loop.ps1 [-Day Monday] [-At 10:00] [-Remove]
# Runs only while you are logged on; if the PC was off at the time, it runs at the next logon (StartWhenAvailable).

param(
  [string]$Day = "Monday",
  [string]$At = "10:00",
  [switch]$Remove
)

$Name = "GYC website improve loop"
if ($Remove) { Unregister-ScheduledTask -TaskName $Name -Confirm:$false; Write-Host "Removed '$Name'."; exit 0 }

$Root = Split-Path -Parent $PSScriptRoot
$Script = Join-Path $PSScriptRoot "loop-local.ps1"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Script`"" -WorkingDirectory $Root
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Day -At $At
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 3) -MultipleInstances IgnoreNew -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName $Name -Action $action -Trigger $trigger -Settings $settings -Description "Weekly improve cycle for theglobalyouth.co (local, never uploads). Logs in reports\cycle-*.log" -Force | Out-Null
Get-ScheduledTask -TaskName $Name | Get-ScheduledTaskInfo | Select-Object TaskName, NextRunTime | Format-List

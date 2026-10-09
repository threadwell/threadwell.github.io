# Copies only the publishable site files into a staging folder, so a preview server never exposes
# .git, .claude (skills), tools or notes. Usage: .\tools\stage.ps1 -Dest <folder>
param([Parameter(Mandatory = $true)][string]$Dest)
$src = Split-Path -Parent $PSScriptRoot
robocopy $src $Dest /MIR /XD .git .claude tools node_modules /XF CLAUDE.md HANDOFF.md /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed ($LASTEXITCODE)" }
Get-ChildItem $Dest -Recurse -File | ForEach-Object { $_.FullName.Substring($Dest.Length + 1) }

# Regenerates assets/og-image.png and assets/apple-touch-icon.png from tools/og.html and tools/icon.html.
# Uses the Edge that ships with Windows. Everything is rendered locally; nothing is fetched.
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$root = Split-Path -Parent $PSScriptRoot
function Shot($html, $png, $w, $h) {
  $src = "file:///" + ((Join-Path $root $html) -replace '\\', '/')
  & $edge --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 "--window-size=$w,$h" "--screenshot=$(Join-Path $root $png)" $src | Out-Null
}
Shot "tools\og.html" "assets\og-image.png" 1200 630
Shot "tools\icon.html" "assets\apple-touch-icon.png" 180 180
Get-Item (Join-Path $root "assets\og-image.png"), (Join-Path $root "assets\apple-touch-icon.png") | Select-Object Name, Length

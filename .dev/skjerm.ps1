param([string]$sc, [int]$w = 1024, [int]$h = 768, [string]$extra = "", [string]$name = "")
$out = "C:\Users\vegar\AppData\Local\Temp\claude\C--Vegard-Claude-pwa-poengtavle\0b03e832-efde-4b97-a966-4c4db66d4ddb\scratchpad"
if (-not $name) { $name = "$sc-$w" + "x$h" }
$prof = Join-Path $env:TEMP ("chp_" + [guid]::NewGuid().ToString("N"))
$url = "http://localhost:8126/.dev/ui.html?s=$sc$extra"
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --user-data-dir=$prof --window-size=$w,$h --virtual-time-budget=3000 --screenshot="$out\$name.png" $url | Out-Null
"$out\$name.png"

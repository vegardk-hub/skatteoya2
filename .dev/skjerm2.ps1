param([string]$sc, [int]$w = 390, [int]$h = 844, [string]$extra = "", [string]$name = "")
$out = "C:\Users\vegar\AppData\Local\Temp\claude\C--Vegard-Claude-pwa-poengtavle\0b03e832-efde-4b97-a966-4c4db66d4ddb\scratchpad"
if (-not $name) { $name = "m-$sc-$w" + "x$h" }
$prof = Join-Path $env:TEMP ("chp_" + [guid]::NewGuid().ToString("N"))
$url = "http://localhost:8126/.dev/ramme.html?s=$sc&w=$w&h=$h$extra"
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --user-data-dir=$prof --window-size=$($w+20),$($h+20) --virtual-time-budget=3000 --screenshot="$out\$name.png" $url 2>$null | Out-Null
"$out\$name.png"

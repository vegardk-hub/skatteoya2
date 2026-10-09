import re
p = 'js/main.js'
s = open(p, encoding='utf8').read()

def bytt(gammel, ny, antall=1):
    global s
    assert s.count(gammel) >= 1, gammel
    s = s.replace(gammel, ny, antall)

bytt("    rist($('matte'));\n    L.tomt();", "    rist($('matte'));\n    L.feil();")
bytt("  L.INSTRUMENT.xylofon(523.25);\n  setTimeout(() => L.INSTRUMENT.xylofon(783.99), 120);\n  flyTil({ mynter: sum }",
     "  L.mynt(Math.min(4, Math.ceil(sum / 25)));\n  flyTil({ mynter: sum }")
bytt("  L.fanfare(2);\n  melding(`${BYGG_ETTER_ID[id].navn} står ferdig!`", "  L.byggSatt();\n  melding(`${BYGG_ETTER_ID[id].navn} står ferdig!`")
bytt("    sprutNaer(n, x, y, 14, 1.2, ['#ffd23f', '#e0393e', '#3a74d8', '#25b86a', '#ffffff']);\n    L.fanfare(1);",
     "    sprutNaer(n, x, y, 14, 1.2, ['#ffd23f', '#e0393e', '#3a74d8', '#25b86a', '#ffffff']);\n    L.rakett();")
bytt("  L.solnedgang();\n  t.natt.full", "  L.solnedgang();\n  L.stemning.sett('natt');\n  t.natt.full")
bytt("  L.vekk();\n  L.morgen();", "  L.vekk();\n  L.morgen();\n  L.stemning.sett('dag');")

# stemning inne/ute og globale lyder i start()
bytt("function start() {\n  visVersjon();\n",
"""function start() {
  visVersjon();
  // Lyd: stemningen starter ved første trykk (krav på iPad), alle knapper får en myk lyd,
  // og dialoger åpner og lukker seg med et sveip.
  document.addEventListener('pointerdown', (e) => {
    L.stemning.start();
    const k = e.target.closest?.('button');
    if (k && !k.closest('#matte-tast, #port-tast')) L.knapp();
  }, true);
  for (const [metode, lyd] of [['showModal', L.aapne], ['close', L.lukk]]) {
    const orig = HTMLDialogElement.prototype[metode];
    HTMLDialogElement.prototype[metode] = function (...a) {
      const var_ = this.open;
      orig.apply(this, a);
      if (var_ !== this.open) lyd();
    };
  }
""")
open(p, 'w', encoding='utf8').write(s)
print('ok')

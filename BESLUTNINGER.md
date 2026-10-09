# Beslutninger – Skatteøya II

Hver beslutning er tatt selvstendig, med begrunnelse.

## 2026-10-09 · Oppsett
- **Mappe og repo:** `C:\Vegard\Claude\skatteoya2`, repo `vegardk-hub/skatteoya2`, gren `main`. Startet som kopi av Skatteøya 1.45 (uten git-historikk). Det gamle spillet er ikke rørt.
- **Teknikk: Canvas 2D, ES-moduler, ingen byggesteg, alt tegnet og syntetisert i kode.** Begrunnelse: det gamle spillet er 13 000 linjer som virker og er testet; WebGL ville krevd omskriving av alt og gir risiko på iPad uten at jeg kan teste der. Canvas 2D med lag for lys, skygge, gradienter, partikler og forhåndstegnede (cachede) lag gir stort sprang i utseende og holder 60 b/s.
- **Lagringsnøkler:** `oya2-profiler`, `oya2-spill-<id>`, `oya2-lyd`, `oya2-foreldrekode`. Det gamle spillets nøkler leses aldri automatisk og skrives aldri.
- **Versjon:** starter på 2.0.0 og økes ved hver publisering.
- **Lyd: ren syntese (ingen lydfiler)**, men med ordentlige instrumentmodeller (additiv/FM/Karplus-Strong, ADSR, filter), felles miksebuss med kompressor/begrenser, og romklang laget av en prosedyrelaget impulsrespons. Begrunnelse: ingen lisensrisiko, ingen nedlasting, små filer, og vi kan måle lyden i en OfflineAudioContext.
- **Neonøya:** beholder konseptet (øy 2), men får samme kvalitetsløft og et lettere rutenett på seilturen.

## Melodikontroll (9. okt 2026)
Alle 44 melodier ble sjekket av fire hjelpeagenter mot nettkilder (Mutopia, ABC-arkiver, Wikipedia, IMSLP). 19 ble rettet i `js/data/melodier.js`
(bl.a. Donau, Skjebnesymfonien forkortet til åpningsmotivet, Vuggesang-pauser, Våren, Cancan, Toreador). Flettingen er gjort av `.dev/flettmelodier.py`; rådata ligger i `.dev/melodikontroll/*.json`.
**Ukontrollert** (fant ingen lesbar notekilde): sym40, sonate, jesus, largo, brudekoret, bjornen, javielsker, morgen, sukkerfe, tell.
Mange «ok» er vurdert ut fra kjent notebilde, ikke tone for tone mot partitur. Ingen er hørt av et menneske med øre.

## Seiltur (2.0.3)
Neon-rutenettet brukte shadowBlur på mange streker hver ramme (tungt på iPad). Erstattet med to streker (bred svak + skarp). Seilturen har egen lyd `L.seil()`.

## Lydfeil rettet (2.0.6)
Stemmeteller i motor.js lyttet på «ended» på en gain-node, som aldri sender den. Telleren bare økte, og etter 56 lyder ble alle nye lyder kuttet; bare hav, vind og fugler hørtes. Nå lytter den på kildenoden. Målt: lyd nr. 151 spilles fortsatt.

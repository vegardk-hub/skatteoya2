# Beslutninger – Skatteøya II

Hver beslutning er tatt selvstendig, med begrunnelse.

## 2026-10-09 · Oppsett
- **Mappe og repo:** `C:\Vegard\Claude\skatteoya2`, repo `vegardk-hub/skatteoya2`, gren `main`. Startet som kopi av Skatteøya 1.45 (uten git-historikk). Det gamle spillet er ikke rørt.
- **Teknikk: Canvas 2D, ES-moduler, ingen byggesteg, alt tegnet og syntetisert i kode.** Begrunnelse: det gamle spillet er 13 000 linjer som virker og er testet; WebGL ville krevd omskriving av alt og gir risiko på iPad uten at jeg kan teste der. Canvas 2D med lag for lys, skygge, gradienter, partikler og forhåndstegnede (cachede) lag gir stort sprang i utseende og holder 60 b/s.
- **Lagringsnøkler:** `oya2-profiler`, `oya2-spill-<id>`, `oya2-lyd`, `oya2-foreldrekode`. Det gamle spillets nøkler leses aldri automatisk og skrives aldri.
- **Versjon:** starter på 2.0.0 og økes ved hver publisering.
- **Lyd: ren syntese (ingen lydfiler)**, men med ordentlige instrumentmodeller (additiv/FM/Karplus-Strong, ADSR, filter), felles miksebuss med kompressor/begrenser, og romklang laget av en prosedyrelaget impulsrespons. Begrunnelse: ingen lisensrisiko, ingen nedlasting, små filer, og vi kan måle lyden i en OfflineAudioContext.
- **Neonøya:** beholder konseptet (øy 2), men får samme kvalitetsløft og et lettere rutenett på seilturen.

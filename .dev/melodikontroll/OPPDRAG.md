# Oppdrag: kontroller melodier mot kilder

Prosjekt: `C:\Vegard\Claude\skatteoya2` (barnespill). Filen `js/data/melodier.js` har 44 melodier skrevet fra hukommelsen. De er aldri kontrollert. Du får en liste med id-er. For hver id skal du:

1. Les oppføringen i `js/data/melodier.js` (les også forklaringen i toppen om notasjonen: tone+oktav, `,` halvt slag, `;` kvart slag, `-` ett slag til, `.` halvannen gang, `r` pause, `tempo` = slag per minutt, `deler` = antall toner den lille og mellomste tingen spiller).
2. Finn en pålitelig kilde til melodien uten opphavsrett: Mutopia Project (mutopiaproject.org, .ly/.mid), IMSLP (imslp.org, public domain-utgaver), Wikipedia/Wikimedia Commons-noter (PD), abcnotation.com, thesession.org, Hymnary.org, Cantorion, eller norske folketoner/salmer i public domain. Bruk WebSearch/WebFetch. Ikke bruk kilder med opphavsrett som grunnlag for å kopiere notebilder; du leser bare tonehøyder og rytme (fakta om en gammel melodi).
3. Sammenlign tone for tone og rytme for rytme. Melodien skal være det folk kjenner igjen som **den gjenkjennelige hovedtemaet/første frasen(e)**, i en grei toneart for en enkel leketøysinstrumentering (oktav 3–6). Behold gjerne dagens toneart hvis den er riktig. Lengden: ca. 12–40 toner, slik at den er kort men komplett (ender på en naturlig frasetone).
4. Rett feil. Sjekk også at `deler: [liten, middels]` gir naturlige frasegrenser (liten = første frase, middels = to frasers lengde; tell kun toner, ikke pauser). Sjekk at tittel og komponist er korrekte, og at melodien faktisk er uten opphavsrett (komponist død for over 70 år siden eller folketone/salme).
5. Skriv resultat til `.dev/melodikontroll/<ditt-navn>.json` som en liste av objekter:
   `{ "id": "...", "status": "ok" | "rettet", "endringer": "kort norsk beskrivelse av hva som var feil", "kilde": "URL(er) du leste", "navn": "...", "av": "...", "gruppe": "...", "tempo": N, "deler": [a,b], "noter": "samme notasjon som i filen" }`
   Skriv alltid hele den endelige `noter`-strengen, også når status er ok.
   Hvis du ikke finner pålitelig kilde for en melodi, sett `"status": "ukontrollert"` og forklar, men gjør beste forsøk med flere kilder først.
6. **Ikke rediger `js/data/melodier.js` eller andre filer i prosjektet.** Bare skriv JSON-filen din.

Rapporter til slutt (kort, norsk): antall ok / rettet / ukontrollert, og de mest alvorlige feilene.
Verifiser at JSON-filen din er gyldig (`node -e "JSON.parse(require('fs').readFileSync('<fil>','utf8'))"`) og at notasjonen kan tolkes (regex per ord: `^(r|[A-G][#b]?\d)([-.,;]*)$`).

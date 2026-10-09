// Melodiene (toner og rytme) og det som skjermen bruker av lyd. Selve lyden lages i js/lyd/.
// Hvert trykk på en
// ting spiller neste tone i en kjent melodi (klassisk musikk og sanger, se data/melodier.js).
// Den lille utgaven av en ting spiller starten av melodien, den mellomste litt mer, og den store hele.

import { MELODIER } from '../data/melodier.js';
import { spillMelodi as spillS, stoppMelodi } from '../lyd/hendelser.js';

// ---------------------------------------------------------------------------
// Noter og melodier
// ---------------------------------------------------------------------------
const HALVTONE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Frekvensen til en tone, f.eks. «C4» (261,63 Hz), «F#4» eller «Bb3». */
export function hertz(navn) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(navn);
  if (!m) throw new Error(`Ukjent tone: ${navn}`);
  const midi = 12 * (Number(m[3]) + 1) + HALVTONE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return Math.round(440 * 2 ** ((midi - 69) / 12) * 100) / 100;
}

/** Tolker en melodi (se skrivemåten i data/melodier.js) til [{ f, v }]: frekvens (null = pause) og lengde i slag. */
export function tolk(tekst) {
  return tekst.replace(/\|/g, ' ').trim().split(/\s+/).map((ord) => {
    const m = /^(r|[A-G][#b]?\d)([-.,;]*)$/.exec(ord);
    if (!m) throw new Error(`Kan ikke tolke «${ord}»`);
    let v = m[2].includes(';') ? 0.25 : m[2].includes(',') ? 0.5 : 1;
    v += (m[2].match(/-/g) ?? []).length;
    if (m[2].includes('.')) v *= 1.5;
    return { f: m[1] === 'r' ? null : hertz(m[1]), v };
  });
}

/**
 * Alle melodiene: { navn, av, gruppe, tempo, deler, noter: [{ f, v }], toner: [frekvens …] }.
 * deler = antall toner for liten og middels utgave; den store spiller hele melodien.
 */
export const SANG = {};
for (const [id, m] of Object.entries(MELODIER)) {
  const noter = tolk(m.noter);
  SANG[id] = { ...m, noter, toner: noter.filter((n) => n.f).map((n) => n.f) };
}
/** Melodiene i den rekkefølgen de står i sangboka. */
export const SANGER = Object.keys(MELODIER);
// Tåka har sine egne tre toner (ikke i sangboka).
SANG.take = { navn: '', deler: [3, 3], noter: tolk('C5 E5 G5'), toner: tolk('C5 E5 G5').map((n) => n.f) };

/** Tonene for en melodi i en gitt størrelse (0 = liten, 1 = middels, 2 = stor). */
export function tonerFor(sang, str) {
  const s = SANG[sang];
  return str >= 2 ? s.toner : s.toner.slice(0, s.deler[str]);
}

// ---------------------------------------------------------------------------
// Lyden (js/lyd/)
// ---------------------------------------------------------------------------
export { lydPaa, settLyd, vekk } from '../lyd/motor.js';
export { INSTR as INSTRUMENT } from '../lyd/instrumenter.js';
export { knapp, aapne, lukk, mynt, riktig, feil, tomt, vend, kisteAapne, byggSatt, rakett, fanfare, stjerne,
  solnedgang, morgen, tidssprang, idé, seil, strok, stoppMelodi } from '../lyd/hendelser.js';
export * as stemning from '../lyd/stemning.js';

/** Spiller de første `antall` tonene av en melodi (hele hvis ikke annet er sagt), med riktig rytme. */
export function spillMelodi(sang, antall = Infinity, valg = {}) {
  return spillS(SANG[sang], antall, valg);
}

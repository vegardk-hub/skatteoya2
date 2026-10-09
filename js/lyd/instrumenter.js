// Instrumentene. Hver er bygget som en liten fysisk modell: slagtone med riktige overtoner,
// et anslag (støy) og passe romklang. Alle tar frekvensen f og en styrke v (0–1).

import { tone, sus } from './motor.js';

/** Overtoner: [forhold, volum, lengde i s]. Lengden er tid til tonen er borte (eksponentielt forfall). */
function overtoner(f, liste, { start = 0, volum = 1, send = 0.25, pan = 0, type = 'sine', anslag = 0.002, utgang = null } = {}) {
  for (const [r, v, l] of liste) {
    if (f * r > 14000) continue;
    tone(f * r, { start, lengde: l, volum: v * volum, a: anslag, eksp: true, type, send, pan, utgang });
  }
}

const rnd = (a, b) => a + Math.random() * (b - a);

export const INSTR = {
  // Kister: marimba/xylofon. Treplate med 1 : 3,9 : 9,2 i overtoner, myk køllelyd.
  xylofon(f, v = 1) {
    const p = rnd(-0.12, 0.12);
    overtoner(f * 2, [[1, 0.5, 0.9], [3.9, 0.17, 0.28], [9.2, 0.05, 0.08]], { volum: 0.8 * v, send: 0.35, pan: p });
    sus(3200, 2400, { lengde: 0.018, volum: 0.07 * v, q: 1.5, send: 0.1, pan: p });
  },

  // Tre: øksehogg – lav dunk, flisknekk og en tonet trebit som gir melodien.
  hogg(f, v = 1) {
    tone(150, { lengde: 0.16, volum: 0.42 * v, glid: [1.7, 0.06], eksp: true, send: 0.1 });
    sus(2600, 700, { lengde: 0.09, volum: 0.26 * v, q: 1.6, send: 0.12 });
    sus(900, 300, { lengde: 0.2, volum: 0.14 * v, q: 0.7, send: 0.25 });
    overtoner(f, [[1, 0.34, 0.75], [4, 0.1, 0.22], [10, 0.025, 0.06]], { volum: v, start: 0.012, type: 'triangle', send: 0.3 });
  },

  // Stein: treblokk/stein mot stein – tørr, tydelig tone med to resonanser.
  treblokk(f, v = 1) {
    overtoner(f * 2, [[1, 0.42, 0.13], [2.4, 0.16, 0.07], [4.1, 0.06, 0.04]], { volum: 1.7 * v, send: 0.2 });
    sus(3400, 2200, { lengde: 0.03, volum: 0.2 * v, q: 3.5, send: 0.1 });
    sus(1400, 900, { lengde: 0.05, volum: 0.1 * v, q: 5, send: 0.1 });
  },

  // Jern: ambolt/klokkestav med skjeve overtoner som ringer lenge.
  ambolt(f, v = 1) {
    const g = f * 2;
    overtoner(g, [[1, 0.26, 1.5], [2.756, 0.15, 0.9], [5.404, 0.08, 0.5], [8.933, 0.04, 0.28], [1.003, 0.14, 1.3]], { volum: v, send: 0.4 });
    tone(110, { lengde: 0.1, volum: 0.18 * v, glid: [1.5, 0.05], eksp: true, send: 0.05 });
    sus(6200, 3800, { lengde: 0.035, volum: 0.14 * v, q: 4, send: 0.15 });
  },

  // Fisk: vanndråpe (boble som stiger i tonehøyde) og en rund tone.
  plask(f, v = 1) {
    tone(f * 2.4, { lengde: 0.13, volum: 0.17 * v, glid: [0.55, 0.07], eksp: true, send: 0.45 });
    sus(1400, 500, { lengde: 0.14, volum: 0.1 * v, q: 0.9, send: 0.4 });
    sus(5200, 2800, { lengde: 0.05, volum: 0.04 * v, q: 1.2, send: 0.3 });
    overtoner(f, [[1, 0.22, 0.6], [2, 0.07, 0.3]], { volum: v, start: 0.03, type: 'triangle', send: 0.45 });
  },

  // Korn: tverrfløyte – sakte anslag, utsatt vibrato og pust i tonen.
  floyte(f, v = 1) {
    const g = f * 2;
    tone(g, { lengde: 0.5, volum: 0.18 * v, a: 0.05, s: 0.8, r: 0.18, vibrato: { dybde: 0.005, fart: 5.4, forsinkelse: 0.12 }, send: 0.4 });
    tone(g * 2, { lengde: 0.45, volum: 0.04 * v, a: 0.06, r: 0.15, send: 0.4 });
    tone(g * 3, { lengde: 0.4, volum: 0.015 * v, a: 0.07, r: 0.12, send: 0.4 });
    sus(g * 2, g * 1.8, { lengde: 0.5, volum: 0.04 * v, q: 4, a: 0.05, send: 0.3, kurve: 'lin' });
    sus(6000, 5000, { lengde: 0.06, volum: 0.03 * v, q: 1, send: 0.2 });
  },

  // Ull: spilledåse – stemte tinder med 1 : 6,27 og et lite mekanisk tikk.
  spilledaase(f, v = 1) {
    const g = f * 4;
    overtoner(g, [[1, 0.17, 1.6], [6.27, 0.035, 0.34], [2, 0.03, 0.5]], { volum: v, send: 0.55 });
    sus(7000, 6000, { lengde: 0.012, volum: 0.04 * v, q: 3, send: 0.2 });
  },

  // Tåka: bare en søt, lys plingetone (ingen brus).
  sus(f, v = 1) {
    overtoner(f, [[1, 0.17, 1.1], [2.76, 0.04, 0.4]], { volum: v * 1.3, send: 0.6 });
  },
};

/** Klaver til sangboka: additiv med hammeranslag. Høye overtoner dør raskere, og dype toner ringer lenger. */
export function klaver(f, lengde, v = 0.9, { pan = 0, start = 0, utgang = null } = {}) {
  const lang = Math.min(3.2, 0.9 + 420 / f + lengde * 0.5);
  const lys = Math.min(1, 700 / f);
  const deler = [[1, 0.5, lang], [2.0, 0.32, lang * 0.7], [3.01, 0.17 * lys + 0.05, lang * 0.5], [4.03, 0.09 * lys, lang * 0.34], [5.06, 0.05 * lys, lang * 0.22], [6.1, 0.025 * lys, lang * 0.15]];
  overtoner(f, deler, { volum: v * 0.55, send: 0.32, pan, anslag: 0.003, start, utgang });
  tone(f * 1.002, { start, lengde: lang, volum: 0.07 * v, eksp: true, send: 0.3, pan, a: 0.004, utgang });   // kordetoner: litt uren, som ekte strenger
  sus(1800, 900, { start, lengde: 0.03, volum: 0.035 * v * lys, q: 1.2, send: 0.1, pan, utgang });
}

/** Myk strykepute som dobler melodien en oktav ned. */
export function pute(f, lengde, v = 0.5, { pan = 0, start = 0, utgang = null } = {}) {
  for (const detune of [-6, 6]) {
    tone(f, { start, lengde, volum: 0.07 * v, type: 'sawtooth', a: 0.12, s: 0.8, r: 0.35, filter: { type: 'lowpass', f: Math.min(1800, f * 3), q: 0.5 }, send: 0.6, pan, detune, utgang });
  }
}

/** Klokkespill (ekstra glitter, for kister og seier). */
export function klokke(f, v = 1, start = 0, utgang = null) {
  overtoner(f, [[1, 0.22, 1.4], [2.76, 0.09, 0.7], [5.4, 0.04, 0.35], [8.9, 0.015, 0.18]], { volum: v, send: 0.55, start, utgang });
}

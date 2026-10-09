// Lyder for hendelser og grensesnitt: knapper, paneler, mynter, kister, bygg, natt og morgen,
// og avspilling av hele melodier (sangboka). Alt er syntese; ingen lydfiler.

import { tone, sus, kontekst, lydPaa, spor } from './motor.js';
import { klaver, pute, klokke } from './instrumenter.js';

const pent = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.7, 1318.5, 1568, 1760, 2093];   // pentatonisk (C-dur), klinger alltid fint
const rnd = (a, b) => a + Math.random() * (b - a);
const velg = (l) => l[Math.floor(Math.random() * l.length)];

// ---------------------------------------------------------------------------
// Grensesnitt
// ---------------------------------------------------------------------------
/** Vanlig knapp: myk «pop» med litt variasjon så det aldri blir likt to ganger. */
export function knapp() {
  const f = rnd(1050, 1250);
  tone(f, { lengde: 0.08, volum: 0.14, eksp: true, glid: [1.35, 0.03], send: 0.2 });
  tone(f * 2.01, { lengde: 0.04, volum: 0.02, eksp: true, send: 0.2 });
  sus(4200, 3000, { lengde: 0.015, volum: 0.02, q: 1.5, send: 0.05 });
}

/** Et panel/vindu åpner seg: oppadgående sveip. */
export function aapne() {
  sus(500, 2600, { lengde: 0.26, volum: 0.06, q: 0.9, a: 0.1, kurve: 'lin', send: 0.4 });
  tone(784, { start: 0.08, lengde: 0.28, volum: 0.07, eksp: true, send: 0.5 });
  tone(1175, { start: 0.14, lengde: 0.3, volum: 0.045, eksp: true, send: 0.5 });
}

/** Et panel lukkes: nedadgående sveip. */
export function lukk() {
  sus(2200, 450, { lengde: 0.2, volum: 0.08, q: 0.9, a: 0.04, kurve: 'lin', send: 0.3 });
  tone(659.25, { lengde: 0.18, volum: 0.09, eksp: true, glid: [1.2, 0.15], send: 0.4 });
}

/** Myntene klirrer: to-tre metalliske slag. */
export function mynt(antall = 1) {
  for (let k = 0; k < Math.min(5, 1 + antall); k++) {
    const f = rnd(2300, 3100);
    const s = k * rnd(0.045, 0.08);
    tone(f, { start: s, lengde: 0.22, volum: 0.11, eksp: true, send: 0.35, pan: rnd(-0.3, 0.3) });
    tone(f * 1.504, { start: s, lengde: 0.16, volum: 0.04, eksp: true, send: 0.35 });
    sus(8000, 6000, { start: s, lengde: 0.012, volum: 0.03, q: 3 });
  }
}

/** Riktig svar: to stigende klokketoner. */
export function riktig() {
  klokke(783.99, 0.9, 0);
  klokke(1046.5, 1, 0.09);
  klokke(1568, 0.55, 0.18);
}

/** Feil svar: skånsomt «uuh» som svinger nedover. Aldri skarpt. */
export function feil() {
  tone(330, { lengde: 0.28, volum: 0.09, type: 'triangle', glid: [1.12, 0.26], a: 0.02, r: 0.12, filter: { f: 900 }, send: 0.35 });
  tone(262, { start: 0.14, lengde: 0.32, volum: 0.08, type: 'triangle', glid: [1.06, 0.3], a: 0.02, r: 0.14, filter: { f: 800 }, send: 0.35 });
}

/** Tomt/ikke mulig: lav mykt dunk. */
export function tomt() {
  tone(196, { lengde: 0.14, volum: 0.18, glid: [1.25, 0.1], eksp: true, send: 0.2 });
  sus(700, 300, { lengde: 0.06, volum: 0.04, q: 0.8 });
}

/** Kort sveip (vending av kort, sal). */
export function vend() {
  sus(900, 3600, { lengde: 0.11, volum: 0.1, q: 1.2, a: 0.04, kurve: 'lin', send: 0.25 });
}

/** Kista åpnes: knirk, klikk, og en funkling. */
export function kisteAapne() {
  tone(180, { lengde: 0.22, volum: 0.05, type: 'sawtooth', glid: [0.7, 0.2], a: 0.03, r: 0.05, filter: { f: 700, q: 6 }, send: 0.15 });
  sus(1500, 2400, { start: 0.2, lengde: 0.03, volum: 0.08, q: 4 });
  for (let k = 0; k < 7; k++) klokke(velg(pent) * (k > 3 ? 2 : 1), 0.45, 0.25 + k * 0.055);
}

/** Bygg settes ned: tre hammerslag og en klokke. */
export function byggSatt() {
  for (let k = 0; k < 3; k++) {
    tone(120, { start: k * 0.13, lengde: 0.1, volum: 0.28, glid: [1.8, 0.04], eksp: true, send: 0.15 });
    sus(2800, 1200, { start: k * 0.13, lengde: 0.05, volum: 0.14, q: 2 });
  }
  klokke(783.99, 0.8, 0.46);
  klokke(1046.5, 0.9, 0.56);
  klokke(1318.5, 0.9, 0.66);
}

/** Rakett: pust, brus som stiger, og et lite smell øverst. */
export function rakett() {
  sus(180, 2600, { lengde: 0.9, volum: 0.14, q: 0.7, a: 0.1, send: 0.5 });
  tone(130, { lengde: 0.9, volum: 0.07, type: 'sawtooth', glid: [0.6, 0.9], a: 0.1, filter: { f: 600 }, send: 0.3 });
  setTimeout(() => { sus(5000, 2500, { lengde: 0.25, volum: 0.07, q: 0.5, send: 0.7 }); for (let k = 0; k < 4; k++) klokke(velg(pent) * 2, 0.35, k * 0.05); }, 850);
}

/** Fanfare ved nytt funn/kiste ferdig. */
export function fanfare(stor = 1) {
  const a = kontekst();
  if (!a || !lydPaa()) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, k) => {
    tone(f, { start: k * 0.075, lengde: 0.5, volum: 0.07, type: 'triangle', a: 0.01, r: 0.3, send: 0.5 });
    tone(f * 2, { start: k * 0.075, lengde: 0.4, volum: 0.03, send: 0.5, eksp: true });
  });
  tone(261.63, { lengde: 0.9, volum: 0.07, type: 'triangle', a: 0.02, r: 0.5, send: 0.4 });
  for (let k = 0; k < 2 + stor * 3; k++) klokke(velg(pent) * 2, 0.4, 0.34 + k * 0.06);
}

/** Stjerneskudd: høy klokketone med glitter. */
export function stjerne() {
  const f = velg([1318.5, 1568, 1760, 2093, 2349]);
  klokke(f, 0.9);
  sus(7000, 9000, { lengde: 0.4, volum: 0.015, q: 3, a: 0.05, send: 0.7, kurve: 'lin' });
}

export function solnedgang() {
  [784, 659.25, 523.25, 392].forEach((f, k) => {
    tone(f, { start: k * 0.28, lengde: 1.1, volum: 0.07, type: 'triangle', a: 0.04, r: 0.5, send: 0.6 });
    tone(f / 2, { start: k * 0.28, lengde: 1.1, volum: 0.04, a: 0.06, r: 0.5, send: 0.6 });
  });
}

export function morgen() {
  [392, 523.25, 659.25, 784, 1046.5].forEach((f, k) => {
    tone(f, { start: k * 0.11, lengde: 0.7, volum: 0.07, type: 'triangle', a: 0.02, r: 0.4, send: 0.6 });
    klokke(f * 2, 0.35, k * 0.11 + 0.03);
  });
  // en liten fugl
  for (let k = 0; k < 3; k++) tone(3300 + k * 180, { start: 0.7 + k * 0.1, lengde: 0.07, volum: 0.02, glid: [0.8, 0.06], send: 0.6 });
}

export function tidssprang() {
  tone(180, { lengde: 1.8, volum: 0.08, glid: [0.15, 1.7], a: 0.4, send: 0.5 });
  sus(300, 3000, { lengde: 1.6, volum: 0.08, q: 0.6, a: 0.3, kurve: 'lin', send: 0.5 });
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, k) => klokke(f, 0.8, 1.7 + k * 0.09));
}

/** Ny hjelper/oppfinnelse: «ding-dong-ding». */
export function idé() {
  klokke(1318.5, 0.7, 0);
  klokke(1760, 0.7, 0.11);
  klokke(2093, 0.7, 0.22);
}

/** Seilturen: bølger, vind og en myk akkord. */
export function seil() {
  sus(300, 900, { lengde: 3.8, volum: 0.07, q: 0.5, a: 0.8, kurve: 'lin', send: 0.6, type: 'lowpass' });
  [261.63, 329.63, 392, 523.25].forEach((f, k) => tone(f, { start: 0.2 + k * 0.15, lengde: 3.2, volum: 0.045, type: 'triangle', a: 0.7, r: 1.0, send: 0.7, pan: (k - 1.5) * 0.3 }));
}

/** Tåke børstes: lett strøk. */
export function strok() {
  sus(700, 3000, { lengde: 0.28, volum: 0.12, q: 0.7, a: 0.06, kurve: 'lin', send: 0.45, pan: rnd(-0.2, 0.2) });
}

// ---------------------------------------------------------------------------
// Avspilling av hel melodi (sangboka)
// ---------------------------------------------------------------------------
let spiller = null;

export function stoppMelodi() {
  if (!spiller) return;
  spiller.tider.forEach(clearTimeout);
  const ut = spiller.ut;
  spiller = null;
  try {
    const a = kontekst();
    ut.gain.cancelScheduledValues(a.currentTime);
    ut.gain.setTargetAtTime(0.0001, a.currentTime, 0.04);
  } catch { /* ignorer */ }
}

/**
 * Spiller de første `antall` tonene av en melodi med klaver og en myk strykepute under.
 * vedTone(k) kalles når tone nr. k begynner, vedSlutt(helt) når melodien er ferdig. Gir lengden i sekunder.
 */
export function spillMelodi(s, antall, { vedTone = null, vedSlutt = null } = {}) {
  stoppMelodi();
  const a = kontekst();
  if (!a || !lydPaa() || !s) { vedSlutt?.(false); return 0; }
  const slag = 60 / s.tempo;
  const ut = a.createGain();
  ut.gain.value = 1;
  ut.connect(spor({ send: 0.25 }));
  const tider = [];
  let t = 0.1, nr = 0;
  const noter = s.noter;
  for (let i = 0; i < noter.length; i++) {
    const n = noter[i];
    const lengde = n.v * slag;
    if (n.f) {
      if (nr >= antall) break;
      const k = nr++;
      // litt mykere på korte toner, litt mer trykk på lange
      const v = 0.82 + (n.v >= 1 ? 0.12 : 0) - (n.v < 0.5 ? 0.08 : 0);
      klaver(n.f, lengde, v, { start: t, utgang: ut });
      if (lengde >= slag * 1.5 || noter[i + 1]?.f == null) pute(n.f / 2, lengde * 0.95, 0.55, { start: t, utgang: ut });
      tider.push(setTimeout(() => vedTone?.(k), t * 1000));
    }
    t += lengde;
  }
  const denne = { ut, tider };
  tider.push(setTimeout(() => { if (spiller === denne) { spiller = null; vedSlutt?.(true); } }, (t + 0.5) * 1000));
  spiller = denne;
  return t;
}

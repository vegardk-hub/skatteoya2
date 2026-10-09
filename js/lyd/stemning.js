// Stemningslyder: hav, vind, fugler om dagen og siriss og ugle om natta.
// Alt ligger på sin egen buss, lavt i miksen, så telling og tale alltid er tydelige.

import { kontekst, buss, stoyBuffer, tone, lydPaa } from './motor.js';

let lag = null;
let modus = 'av';
let tid = null;

const NIVAA = {
  //            hav   vind  (nivå 0–1 av full styrke)
  dag:   { hav: 0.55, vind: 0.35, master: 1.0 },
  natt:  { hav: 0.42, vind: 0.2, master: 0.9 },
  inne:  { hav: 0.12, vind: 0.05, master: 0.5 },     // i nærbildet, museet og butikken
  av:    { hav: 0, vind: 0, master: 0 },
};

function stoyLag(a, ut, { type, f, q, lfoFart, lfoDybde, niva, fLfo = 0, fDybde = 0 }) {
  const k = a.createBufferSource();
  k.buffer = stoyBuffer();
  k.loop = true;
  const fl = a.createBiquadFilter();
  fl.type = type;
  fl.frequency.value = f;
  fl.Q.value = q;
  const g = a.createGain();
  g.gain.value = 0;
  const m = a.createGain();            // bølgebevegelsen
  m.gain.value = niva;
  const lfo = a.createOscillator();
  lfo.frequency.value = lfoFart;
  const lg = a.createGain();
  lg.gain.value = niva * lfoDybde;
  lfo.connect(lg);
  lg.connect(m.gain);
  if (fLfo) {
    const l2 = a.createOscillator();
    l2.frequency.value = fLfo;
    const g2 = a.createGain();
    g2.gain.value = fDybde;
    l2.connect(g2);
    g2.connect(fl.frequency);
    l2.start();
  }
  k.connect(fl);
  fl.connect(m);
  m.connect(g);
  g.connect(ut);
  k.start(0, Math.random() * 1.5);
  lfo.start();
  return g;
}

function bygg() {
  const a = kontekst();
  const b = buss();
  const ut = a.createGain();
  ut.gain.value = 0;
  ut.connect(b.stemning);
  // havet: dype bølger + skum, ulik rytme så det aldri går i takt
  const hav1 = stoyLag(a, ut, { type: 'lowpass', f: 520, q: 0.4, lfoFart: 0.11, lfoDybde: 0.8, niva: 0.28 });
  const hav2 = stoyLag(a, ut, { type: 'bandpass', f: 1900, q: 0.5, lfoFart: 0.085, lfoDybde: 0.9, niva: 0.07 });
  const hav3 = stoyLag(a, ut, { type: 'lowpass', f: 300, q: 0.3, lfoFart: 0.16, lfoDybde: 0.5, niva: 0.14 });
  // vinden: smalt bånd som vandrer
  const vind = stoyLag(a, ut, { type: 'bandpass', f: 480, q: 1.6, lfoFart: 0.06, lfoDybde: 0.8, niva: 0.1, fLfo: 0.05, fDybde: 260 });
  lag = { a, ut, hav: [hav1, hav2, hav3], vind };
}

function fugl() {
  const bruk = lydPaa() && modus === 'dag';
  if (bruk) {
    const grunn = 2300 + Math.random() * 2400;
    const n = 2 + Math.floor(Math.random() * 4);
    const pan = (Math.random() - 0.5) * 1.2;
    const art = Math.random();
    for (let k = 0; k < n; k++) {
      const f = grunn * (art < 0.5 ? 1 + k * 0.06 : 1 - k * 0.05);
      tone(f, { start: k * (art < 0.5 ? 0.11 : 0.15), lengde: 0.08, volum: 0.016, glid: [art < 0.5 ? 0.75 : 1.3, 0.07], a: 0.01, r: 0.03, send: 0.5, pan });
    }
  }
  if (modus === 'natt' && lydPaa()) {
    if (Math.random() < 0.55) {
      // siriss: korte pulser i en gruppe
      const f = 4100 + Math.random() * 500;
      const pan = (Math.random() - 0.5) * 1.4;
      for (let k = 0; k < 6; k++) tone(f, { start: k * 0.055, lengde: 0.03, volum: 0.0095, a: 0.006, r: 0.02, send: 0.3, pan });
    } else if (Math.random() < 0.25) {
      // ugle: hu-huu
      tone(390, { lengde: 0.2, volum: 0.03, a: 0.04, r: 0.12, glid: [1.08, 0.12], send: 0.7, pan: -0.4 });
      tone(340, { start: 0.38, lengde: 0.5, volum: 0.036, a: 0.05, r: 0.3, glid: [1.06, 0.2], send: 0.7, pan: -0.4 });
    }
  }
  tid = setTimeout(fugl, modus === 'natt' ? 900 + Math.random() * 2800 : 2200 + Math.random() * 5500);
}

/** Start stemningen (må kalles fra et trykk første gang). */
export function start() {
  if (!kontekst()) return;
  if (!lag) bygg();
  if (!tid) tid = setTimeout(fugl, 1500);
  sett(modus === 'av' ? 'dag' : modus);
}

/** 'dag' | 'natt' | 'inne' | 'av' */
export function sett(m) {
  modus = m;
  if (!lag) return;
  const n = NIVAA[m] ?? NIVAA.dag;
  const t = lag.a.currentTime;
  lag.ut.gain.setTargetAtTime(0.9 * n.master, t, 0.8);
  lag.hav.forEach((g) => g.gain.setTargetAtTime(n.hav, t, 0.8));
  lag.vind.gain.setTargetAtTime(n.vind, t, 1.2);
}

export const gjeldende = () => modus;

// Lydmotoren: én AudioContext, en gjennomtenkt miksebuss og byggesteiner for stemmer.
//
//   stemmer ─┬─ tørr ──────────────┐
//            └─ send ─ romklang ───┼─ kompressor ─ mykt tak (tanh) ─ master ─ ut
//   stemning ──────────────────────┘ (egen buss, lavere nivå)
//
// Romklangen er en impulsrespons laget i koden (ingen filer). Det myke taket gjør at toppene
// aldri klipper hardt selv om mange stemmer ligger oppå hverandre.

let ac = null;
let paa = true;
let bus = null;
let stoyBuf = null;
let aktive = 0;
const MAKS_STEMMER = 56;
const MASTER = 0.85;

export const lydPaa = () => paa;
export function settLyd(v) {
  paa = v;
  if (bus) bus.master.gain.setTargetAtTime(v ? MASTER : 0, ac.currentTime, 0.03);
}

/** Bruk en annen kontekst (OfflineAudioContext i målingene). */
export function brukKontekst(ctx) {
  ac = ctx; bus = null; stoyBuf = null; aktive = 0;
  bygg();
  return ac;
}

export function kontekst() {
  if (!ac) {
    const K = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!K) return null;
    ac = new K({ latencyHint: 'interactive' });
    bygg();
  }
  if (ac.state === 'suspended' && ac.resume && !ac.startRendering) ac.resume().catch(() => {});
  return ac;
}

// Skjult side = stille: lydmotoren pauses når fanen/appen skjules og fortsetter når den vises igjen.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ac || ac.startRendering) return;
    if (document.hidden) ac.suspend?.().catch(() => {});
    else ac.resume?.().catch(() => {});
  });
}

export const buss = () => { kontekst(); return bus; };
export const na = () => (ac ? ac.currentTime : 0);

/** Låser opp lyden på iPad: må kalles fra et trykk. */
export function vekk() { kontekst(); }

function romklangImpuls(a, sek = 2.0, forfall = 0.55) {
  const n = Math.floor(a.sampleRate * sek);
  const buf = a.createBuffer(2, n, a.sampleRate);
  for (let k = 0; k < 2; k++) {
    const d = buf.getChannelData(k);
    let lp = 0;
    // enkel pseudo-tilfeldighet med fast frø, så romklangen er lik hver gang
    let s = 1234567 + k * 7919;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 * 2 - 1; };
    for (let i = 0; i < n; i++) {
      const t = i / a.sampleRate;
      const fall = Math.exp(-t / forfall);
      // høyfrekvensene dør raskere enn bassen, som i et ekte rom
      const a1 = 0.15 + 0.8 * Math.min(1, t / 1.2);
      lp += (rnd() - lp) * (1 - a1);
      d[i] = lp * fall * (i < 200 ? i / 200 : 1) * 3;
    }
  }
  return buf;
}

function mykTak(n = 1024) {
  const kurve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    kurve[i] = Math.tanh(x * 1.25) / Math.tanh(1.25);
  }
  return kurve;
}

function bygg() {
  const a = ac;
  const master = a.createGain();
  master.gain.value = paa ? MASTER : 0;
  const tak = a.createWaveShaper();
  tak.curve = mykTak();
  tak.oversample = '2x';
  const komp = a.createDynamicsCompressor();
  komp.threshold.value = -16;
  komp.knee.value = 14;
  komp.ratio.value = 4;
  komp.attack.value = 0.004;
  komp.release.value = 0.22;
  komp.connect(tak);
  tak.connect(master);
  master.connect(a.destination);

  const tor = a.createGain();             // tørt signal fra stemmene
  tor.connect(komp);
  const sendIn = a.createGain();          // inn til romklangen
  const rom = a.createConvolver();
  rom.buffer = romklangImpuls(a);
  const romUt = a.createGain();
  romUt.gain.value = 0.5;
  sendIn.connect(rom);
  rom.connect(romUt);
  romUt.connect(komp);

  const stemning = a.createGain();        // hav, vind, fugler …
  stemning.gain.value = 1;
  stemning.connect(komp);
  const stemningSend = a.createGain();
  stemningSend.gain.value = 0.15;
  stemning.connect(stemningSend);
  stemningSend.connect(sendIn);

  bus = { master, tor, send: sendIn, stemning, komp };
}

/** En inngang for én stemme: pan og romklangsnivå. Gir noden man kobler stemmen til. */
export function spor({ pan = 0, send = 0.2, volum = 1 } = {}) {
  const a = kontekst();
  const inn = a.createGain();
  inn.gain.value = volum;
  let ut = inn;
  if (pan && a.createStereoPanner) {
    const p = a.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    inn.connect(p);
    ut = p;
  }
  ut.connect(bus.tor);
  if (send > 0) {
    const s = a.createGain();
    s.gain.value = send;
    ut.connect(s);
    s.connect(bus.send);
  }
  return inn;
}

export function stoyBuffer() {
  const a = kontekst();
  if (stoyBuf && stoyBuf.sampleRate === a.sampleRate) return stoyBuf;
  stoyBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
  const d = stoyBuf.getChannelData(0);
  let s = 424242;
  for (let i = 0; i < d.length; i++) { s = (s * 1664525 + 1013904223) >>> 0; d[i] = s / 4294967296 * 2 - 1; }
  return stoyBuf;
}

function frigi(noder) {
  aktive++;
  const siste = noder[noder.length - 1];
  siste.onended = () => { aktive--; for (const n of noder) { try { n.disconnect(); } catch { /* alt ok */ } } };
}

/**
 * En tone: oscillator med ADSR, valgfritt filter, glid og vibrato.
 *  f frekvens · start (s fra nå) · lengde (s) · volum · a/d/s/r (anslag, forfall, hold-nivå 0–1, utklang)
 *  glid = [fraFaktor, tidSek] · filter = { type, f, q, til, tid } · vibrato = { dybde, fart, forsinkelse }
 *  eksp = naturlig utdøende (slag, plukk) i stedet for hold og utklang.
 */
export function tone(f, o = {}) {
  const a = kontekst();
  if (!a || !paa) return null;
  const {
    start = 0, lengde = 0.4, type = 'sine', volum = 0.2, a: atk = 0.005, d: forfall = 0, s: hold = 1,
    r: ut = 0.06, glid = null, filter = null, vibrato = null, pan = 0, send = 0.2, detune = 0, utgang = null, eksp = false,
  } = o;
  if (start < 0.25 && aktive > MAKS_STEMMER) return null;   // taket gjelder bare lyd som skal høres nå
  const t = a.currentTime + start;
  const slutt = t + lengde + (eksp ? 0 : ut);
  const osc = a.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(glid ? f * glid[0] : f, t);
  if (glid) osc.frequency.exponentialRampToValueAtTime(f, t + glid[1]);
  if (detune) osc.detune.value = detune;
  const g = a.createGain();
  const topp = Math.max(0.0002, volum);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(topp, t + Math.max(0.002, atk));
  if (eksp) {
    g.gain.exponentialRampToValueAtTime(0.0001, t + lengde);
  } else {
    const holdNiva = Math.max(0.0002, topp * hold);
    if (forfall > 0) g.gain.exponentialRampToValueAtTime(holdNiva, t + atk + forfall);
    g.gain.setValueAtTime(holdNiva, t + Math.max(atk + forfall, lengde));
    g.gain.exponentialRampToValueAtTime(0.0001, slutt);
  }
  const noder = [osc, g];
  let node = osc;
  if (vibrato) {
    const lfo = a.createOscillator();
    const lg = a.createGain();
    lfo.frequency.value = vibrato.fart ?? 5.2;
    lg.gain.setValueAtTime(0, t);
    lg.gain.setValueAtTime(0, t + (vibrato.forsinkelse ?? 0.15));
    lg.gain.linearRampToValueAtTime(f * (vibrato.dybde ?? 0.006), t + (vibrato.forsinkelse ?? 0.15) + 0.25);
    lfo.connect(lg);
    lg.connect(osc.frequency);
    lfo.start(t);
    lfo.stop(slutt + 0.02);
  }
  if (filter) {
    const fl = a.createBiquadFilter();
    fl.type = filter.type ?? 'lowpass';
    fl.Q.value = filter.q ?? 0.7;
    fl.frequency.setValueAtTime(filter.f, t);
    if (filter.til) fl.frequency.exponentialRampToValueAtTime(filter.til, t + (filter.tid ?? lengde));
    node.connect(fl);
    node = fl;
  }
  node.connect(g);
  g.connect(utgang ?? spor({ pan, send }));
  osc.start(t);
  osc.stop(slutt + 0.02);
  frigi(noder);
  return osc;
}

/** Filtrert støy: klikk, hogg, plask, sus, vind. */
export function sus(fra, til, o = {}) {
  const a = kontekst();
  if (!a || !paa) return null;
  const { start = 0, lengde = 0.2, volum = 0.2, q = 1.2, type = 'bandpass', a: atk = 0.008, pan = 0, send = 0.15, kurve = 'eksp', utgang = null } = o;
  if (start < 0.25 && aktive > MAKS_STEMMER) return null;
  const t = a.currentTime + start;
  const k = a.createBufferSource();
  k.buffer = stoyBuffer();
  k.loop = true;
  const f = a.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(fra, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(20, til), t + lengde);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(volum, t + atk);
  if (kurve === 'eksp') g.gain.exponentialRampToValueAtTime(0.0001, t + lengde);
  else { g.gain.setValueAtTime(volum, t + lengde * 0.55); g.gain.linearRampToValueAtTime(0.0001, t + lengde); }
  k.connect(f);
  f.connect(g);
  g.connect(utgang ?? spor({ pan, send }));
  k.start(t, Math.random() * 1.5);
  k.stop(t + lengde + 0.05);
  frigi([k, f, g]);
  return k;
}

export const hertzFraMidi = (m) => 440 * 2 ** ((m - 69) / 12);

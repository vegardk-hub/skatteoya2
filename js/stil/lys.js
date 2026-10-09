// Lys og materiale: det som gjør de flate kortene til fysiske flis med dybde.
//  - ferdigKort: lys fra øvre venstre, kornet overflate, kant som fanger lyset (skråkant)
//  - medSkygge: tegner en figur/et bygg på et eget lag og kaster en myk skygge + gir den volum
//  - tåke- og skytekstur som kan gli over brettet uten å lages på nytt
// Alt er tegnet i kode. Teksturene lages én gang (fast frø) og gjenbrukes.

import { neonKontekst, neonPaa } from './neon.js';

function lcg(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

const lag = (w, h = w) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
};

let korn = null;
/** Gråtone-støy som legges med «overlay» for et levende, kornet materiale. */
function kornBilde() {
  if (korn) return korn;
  korn = lag(128);
  const ctx = korn.getContext('2d');
  const im = ctx.createImageData(128, 128);
  const r = lcg(99);
  for (let i = 0; i < 128 * 128; i++) {
    // litt grovere korn: bland to oppløsninger
    const v = 128 + (r() - 0.5) * 150;
    im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v;
    im.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(im, 0, 0);
  return korn;
}

function rundRekt(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Siste strøk på et ferdig kort. Alt klippes til kortets rundede hjørner.
 * styrke 1 = vanlig; tåkekort bruker lavere.
 */
export function ferdigKort(ctx, S, { styrke = 1, korn: kornStyrke = 1, vann = false } = {}) {
  ctx.save();
  rundRekt(ctx, 0, 0, S, S, S * 0.03);
  ctx.clip();
  // 1. Sollys: varmt fra øvre venstre, kjølig skygge nede til høyre
  const sol = ctx.createLinearGradient(0, 0, S, S);
  sol.addColorStop(0, `rgba(255, 238, 190, ${0.26 * styrke})`);
  sol.addColorStop(0.45, 'rgba(255, 255, 255, 0)');
  sol.addColorStop(1, `rgba(24, 22, 70, ${0.30 * styrke})`);
  ctx.fillStyle = sol;
  ctx.fillRect(0, 0, S, S);
  // 2. Korn (overlay holder lysheten, men gir tekstur)
  if (kornStyrke > 0) {
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.22 * kornStyrke;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(kornBilde(), 0, 0, S, S);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
  // 3. Vann: lysere og klarere i midten, dypere mot kantene
  if (vann) {
    const g = ctx.createRadialGradient(S * 0.4, S * 0.38, S * 0.05, S * 0.5, S * 0.5, S * 0.75);
    g.addColorStop(0, 'rgba(170, 235, 255, 0.28)');
    g.addColorStop(1, 'rgba(8, 40, 90, 0.34)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
  }
  // 4. Skråkant: lys øverst/venstre, mørk nederst/høyre, og en mørk kant ytterst
  const b = S * 0.035;
  const kant = ctx.createLinearGradient(0, 0, S, S);
  kant.addColorStop(0, `rgba(255, 252, 235, ${0.55 * styrke})`);
  kant.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  kant.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  kant.addColorStop(1, `rgba(0, 0, 20, ${0.5 * styrke})`);
  ctx.strokeStyle = kant;
  ctx.lineWidth = b;
  rundRekt(ctx, b / 2, b / 2, S - b, S - b, S * 0.03);
  ctx.stroke();
  ctx.strokeStyle = `rgba(10, 14, 24, ${0.45 * styrke})`;
  ctx.lineWidth = S * 0.012;
  rundRekt(ctx, S * 0.006, S * 0.006, S * 0.988, S * 0.988, S * 0.03);
  ctx.stroke();
  ctx.restore();
}

/**
 * Tegner `tegn` på et eget lag og legger det på kortet med en myk, kastet skygge.
 * Figuren får lys fra øvre venstre og skygge nede til høyre, så den får volum.
 */
export function medSkygge(ctx, S, tegn, { skygge = 1 } = {}) {
  const t = lag(S);
  const tc = t.getContext('2d');
  if (neonPaa()) neonKontekst(tc);
  tegn(tc);
  // volum: gradient bare der figuren finnes
  tc.globalCompositeOperation = 'source-atop';
  const g = tc.createLinearGradient(S * 0.15, S * 0.1, S * 0.85, S * 0.9);
  g.addColorStop(0, 'rgba(255, 244, 205, 0.20)');
  g.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  g.addColorStop(1, 'rgba(25, 20, 70, 0.26)');
  tc.fillStyle = g;
  tc.fillRect(0, 0, S, S);
  tc.globalCompositeOperation = 'source-over';
  ctx.save();
  if (skygge) {
    ctx.shadowColor = `rgba(14, 18, 8, ${0.5 * skygge})`;
    ctx.shadowBlur = S * 0.045;
    ctx.shadowOffsetX = S * 0.03;
    ctx.shadowOffsetY = S * 0.04;
  }
  ctx.drawImage(t, 0, 0);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Teksturer som glir: tåke og skyskygger. Begge kan flises sømløst (bølger rundt kanten).
// ---------------------------------------------------------------------------
function blob(ctx, x, y, r, rgb, a, N) {
  for (const dx of [-N, 0, N]) {
    for (const dy of [-N, 0, N]) {
      const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      g.addColorStop(0, `rgba(${rgb}, ${a})`);
      g.addColorStop(0.55, `rgba(${rgb}, ${a * 0.45})`);
      g.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
    }
  }
}

const teksturer = {};
/** Tåkedotter: lyse, myke skyer på gjennomsiktig bunn. */
export function takeTekstur() {
  if (teksturer.take) return teksturer.take;
  const N = 256, c = lag(N), ctx = c.getContext('2d'), r = lcg(7);
  for (let i = 0; i < 46; i++) {
    const lys = 205 + Math.floor(r() * 45);
    blob(ctx, r() * N, r() * N, N * (0.09 + r() * 0.15), `${lys + 5}, ${lys + 8}, 255`, 0.2 + r() * 0.16, N);
  }
  return (teksturer.take = c);
}

/** Mørkere, kjølig tåke til tåkens bakside. */
export function takeBunn() {
  if (teksturer.bunn) return teksturer.bunn;
  const N = 256, c = lag(N), ctx = c.getContext('2d'), r = lcg(21);
  for (let i = 0; i < 40; i++) blob(ctx, r() * N, r() * N, N * (0.1 + r() * 0.16), '36, 52, 88', 0.28 + r() * 0.16, N);
  return (teksturer.bunn = c);
}

/** Skyskygger: store, svake, mørke flekker. */
export function skyTekstur() {
  if (teksturer.sky) return teksturer.sky;
  const N = 512, c = lag(N), ctx = c.getContext('2d'), r = lcg(1234);
  for (let i = 0; i < 16; i++) blob(ctx, r() * N, r() * N, N * (0.1 + r() * 0.14), '10, 22, 52', 0.55 + r() * 0.25, N);
  return (teksturer.sky = c);
}

/** Sjøens bunn utenfor kartet: mørk, med svake lysbånd (kaustikk) som vandrer. */
export function sjoTekstur() {
  if (teksturer.sjo) return teksturer.sjo;
  const N = 256, c = lag(N), ctx = c.getContext('2d'), r = lcg(555);
  for (let i = 0; i < 26; i++) blob(ctx, r() * N, r() * N, N * (0.05 + r() * 0.08), '70, 170, 235', 0.07 + r() * 0.08, N);
  return (teksturer.sjo = c);
}

/** Tegner `bilde` flislagt over (x,y,b,h) med forskyvning (ox,oy) og skala. */
export function flis(ctx, bilde, x, y, b, h, ox, oy, skala = 1) {
  const N = bilde.width * skala;
  const sx = ((ox % N) + N) % N, sy = ((oy % N) + N) % N;
  for (let yy = y - sy; yy < y + h; yy += N) {
    for (let xx = x - sx; xx < x + b; xx += N) {
      const x0 = Math.max(xx, x), y0 = Math.max(yy, y);
      const x1 = Math.min(xx + N, x + b), y1 = Math.min(yy + N, y + h);
      if (x1 <= x0 || y1 <= y0) continue;
      ctx.drawImage(bilde, (x0 - xx) / skala, (y0 - yy) / skala, (x1 - x0) / skala, (y1 - y0) / skala, x0, y0, x1 - x0, y1 - y0);
    }
  }
}

// ---------------------------------------------------------------------------
// Levende bakgrunn og helhetlig lys
// ---------------------------------------------------------------------------
/** Havet rundt øya: dyp blå med lysbånd som vandrer i to lag (parallakse). */
export function tegnSjo(ctx, W, H, kamera, tsek) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0c3a6b');
  g.addColorStop(1, '#06223f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const tex = sjoTekstur();
  const dpr = kamera.dpr || 1;
  ctx.globalAlpha = 0.55;
  flis(ctx, tex, 0, 0, W, H, kamera.x * kamera.skala * 0.35 + tsek * 9 * dpr, kamera.y * kamera.skala * 0.35 + tsek * 4 * dpr, 2.4 * dpr);
  ctx.globalAlpha = 0.35;
  flis(ctx, tex, 0, 0, W, H, kamera.x * kamera.skala * 0.6 - tsek * 14 * dpr, kamera.y * kamera.skala * 0.6 + tsek * 7 * dpr, 3.8 * dpr);
  ctx.globalAlpha = 1;
}

/** Vignett og dagslys over hele skjermen: varmt og lavt lys om kvelden, kjølig om morgenen. */
export function tegnLysOverSkjerm(ctx, W, H, f) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const kveld = Math.max(0, Math.min(1, (f - 0.62) / 0.38));
  const morgen = Math.max(0, 1 - f / 0.22);
  if (kveld > 0) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(255, ${Math.round(205 - 70 * kveld)}, ${Math.round(160 - 60 * kveld)}, ${0.35 + 0.35 * kveld})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  } else if (morgen > 0) {
    ctx.fillStyle = `rgba(255, 214, 170, ${0.14 * morgen})`;
    ctx.fillRect(0, 0, W, H);
  }
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.78);
  v.addColorStop(0, 'rgba(0, 0, 0, 0)');
  v.addColorStop(1, `rgba(2, 6, 18, ${0.42 + 0.2 * kveld})`);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

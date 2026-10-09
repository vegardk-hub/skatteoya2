// Stemning i nærbildet: lysstråler, svevende støv og pollen, og gress som svaier foran tingen.
// Tegnes hver gang nærbildet tegnes (tsek = sekunder), derfor rimelig billig.

const frac = (x) => x - Math.floor(x);
const hash = (n) => frac(Math.sin(n * 127.1 + 311.7) * 43758.5453);

/** Lysstråler fra øvre venstre og små lysflekker som driver i lufta. */
export function ambient(ctx, S, tsek, { natt = false, neon = false, farge = null } = {}) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, S, S);
  ctx.clip();
  ctx.globalCompositeOperation = 'lighter';
  if (!natt) {
    for (let k = 0; k < 3; k++) {
      const puls = 0.55 + 0.45 * Math.sin(tsek * (0.35 + k * 0.17) + k * 2);
      const x0 = S * (0.05 + k * 0.2), b = S * (0.07 + k * 0.03);
      const g = ctx.createLinearGradient(x0, 0, x0 + S * 0.45, S * 0.8);
      g.addColorStop(0, `rgba(255, 236, 170, ${0.2 * puls})`);
      g.addColorStop(1, 'rgba(255, 236, 170, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x0, -S * 0.05);
      ctx.lineTo(x0 + b, -S * 0.05);
      ctx.lineTo(x0 + S * 0.55 + b, S * 0.9);
      ctx.lineTo(x0 + S * 0.45, S * 0.9);
      ctx.closePath();
      ctx.fill();
    }
  }
  const n = 14;
  for (let i = 0; i < n; i++) {
    const hast = 0.04 + hash(i * 3.1) * 0.07;
    const x = S * frac(hash(i) + Math.sin(tsek * 0.4 + i) * 0.03 + tsek * hast * 0.5);
    const y = S * frac(hash(i + 50) - tsek * hast * 0.7);
    const r = S * (0.004 + hash(i + 9) * 0.007);
    const a = 0.35 + 0.35 * Math.sin(tsek * (1 + hash(i + 20)) * 1.6 + i * 3);
    ctx.fillStyle = farge ?? (natt ? `rgba(190, 240, 140, ${a})` : `rgba(255, 244, 200, ${a * 0.8})`);
    ctx.beginPath();
    ctx.arc(x, y, r * (natt ? 1.6 : 1), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Gresstrå som svaier foran tingen langs nedre kant. */
export function gress(ctx, S, tsek, hoved = '#4f7a33', lys = '#7fae4b') {
  ctx.save();
  ctx.lineCap = 'round';
  const n = 26;
  for (let i = 0; i < n; i++) {
    const x = S * (0.03 + 0.94 * hash(i + 400));
    const y0 = S * (0.93 + hash(i + 500) * 0.07);
    const h = S * (0.05 + hash(i + 600) * 0.07);
    const sving = Math.sin(tsek * 1.7 + x * 0.04 + i) * h * 0.35 + Math.sin(tsek * 0.6 + i * 0.3) * h * 0.2;
    ctx.strokeStyle = i % 3 ? hoved : lys;
    ctx.lineWidth = S * 0.011;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.quadraticCurveTo(x + sving * 0.3, y0 - h * 0.6, x + sving, y0 - h);
    ctx.stroke();
  }
  ctx.restore();
}

/** Vind: liten sideveis forskyvning (skjæring) rundt foten av tingen. Gir svaiende trær og korn. */
export function vind(ctx, S, tsek, styrke = 1, fotY = 0.86) {
  const k = (0.018 + 0.012 * Math.sin(tsek * 1.1) + 0.008 * Math.sin(tsek * 2.7 + 1)) * styrke;
  ctx.transform(1, 0, -k, 1, k * S * fotY, 0);
}

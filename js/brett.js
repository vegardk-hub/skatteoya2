// Brettet: hver rute er et kort (tegnet med js/stil/ruter.js) på svart bakgrunn.
// Ruter med en ting viser tingen (fra figurer.js) på et tomt kort. Tåke som kan
// børstes bort, blir tynnere for hvert strøk og viser et hint av det som er under.
// Kortene tegnes én gang per innhold og zoomtrinn og gjenbrukes.

import { tegnKort, tegnUkjent, tegnTomtKort } from './stil/ruter.js';
import { BAKGRUNN } from './stil/palett.js';
import { blandSeed, lagTilfeldig } from './rng.js';
import { tegnFigur, tegnHjort, tegnKryss } from './figurer.js';
import { PYNT, LIV } from './stil/pynt.js';
import { TAKE_TRYKK, GRAV_TRYKK } from './data/ting.js';
import { TERRENGNAVN, tingVed, kanBorstes, pyntVed } from './regler.js';
import { neonKontekst, neonPaa, glod } from './stil/neon.js';
import { takeTekstur, takeBunn, skyTekstur, flis } from './stil/lys.js';

export const RUTE = 100;     // verdensenheter per rute
export const FUGE = 1.5;     // ca. 1,5 % av ruta (målt i forbildet)
export const KORT = RUTE - FUGE;

/** Hva kortet viser når ruta er avdekket. */
function avdekketInnhold(spill, verden, i) {
  const terreng = TERRENGNAVN[verden.terreng[i]];
  if (i === verden.startIndeks) return { terreng, bygg: 'leir', farge: spill.takfarge };
  if (spill.kryss.has(i)) return { terreng, kryss: spill.kryss.get(i) };
  const pynt = pyntVed(spill, i);
  if (pynt) return { terreng: terreng === 'skog' ? 'eng' : terreng, pynt };
  const o = verden.overlegg.get(i);
  if (o?.type === 'landsby') return { terreng, bygg: 'landsby', nivaa: 2, farge: spill.takfarge };
  const ting = tingVed(spill, verden, i);
  if (ting) return { terreng, ting };
  if (o?.type === 'dyr' && o.art === 'hjort') return { terreng, overlegg: 'hjort' };
  return { terreng };
}

/** Hva skal ruta vise? null = ingenting (mørke). */
export function innholdFor(spill, verden, i) {
  if (spill.avdekket[i]) return avdekketInnhold(spill, verden, i);
  if (!kanBorstes(spill, verden, i)) return null;
  return { ukjent: true, take: spill.take.get(i) ?? TAKE_TRYKK };
}

const andel = (ting) => Math.floor((1 - ting.igjen / ting.antall) * 8) / 8;

/** Dyr som lever: kortet tegnes uten dyret, og dyret tegnes på nytt hver gang skjermen tegnes. */
const LEVENDE_TING = new Set(['ull', 'fisk']);
const harLiv = (inn) => !inn.ukjent && ((inn.ting && LEVENDE_TING.has(inn.ting.type)) || (inn.pynt && LIV[inn.pynt]) || inn.overlegg === 'hjort' || inn.kryss);
const signatur = (inn) => {
  if (inn.ukjent) return '?';
  if (inn.pynt) return `${inn.terreng}|pynt:${inn.pynt}`;
  if (inn.kryss) return `${inn.terreng}|kryss`;
  if (inn.ting) return LEVENDE_TING.has(inn.ting.type) ? `${inn.terreng}|bak` : `${inn.terreng}|${inn.ting.type}${inn.ting.str}|${inn.ting.seed}|${andel(inn.ting)}`;
  return `${inn.terreng}|${inn.bygg ?? ''}|${inn.nivaa ?? ''}|${inn.overlegg ?? ''}|${inn.farge ?? ''}`;
};

const STORRELSER = [48, 64, 96, 128, 192, 256, 384];
const passendeStorrelse = (px) => STORRELSER.find((s) => s >= px) ?? STORRELSER.at(-1);

export class Brett {
  constructor(verden) {
    this.verden = verden;
    this.kort = new Map();   // nøkkel → { sig, str, lerret }
    this.ko = new Map();     // nøkkel → { innhold, str } som venter på skarpere versjon
    this.royk = null;
    this.roykNokkel = '';
  }

  #lagKort(nokkel, i, innhold, str) {
    const lerret = document.createElement('canvas');
    lerret.width = lerret.height = str;
    const ctx = lerret.getContext('2d');
    if (neonPaa()) neonKontekst(ctx);
    const tilf = lagTilfeldig(blandSeed(this.verden.seed, this.verden.forsok, 'kort', i));
    if (innhold.ukjent) tegnUkjent(ctx, str, tilf);
    else if (innhold.pynt) {
      tegnTomtKort(ctx, str, tilf, innhold.terreng, (c) => PYNT[innhold.pynt](c, str, lagTilfeldig(blandSeed(this.verden.seed, 'pynt', i))), { skygge: true });
    } else if (innhold.ting) {
      const levende = LEVENDE_TING.has(innhold.ting.type);
      tegnTomtKort(ctx, str, tilf, innhold.terreng, levende ? null : (c) => tegnFigur(c, str, innhold.ting, { p: andel(innhold.ting) }), { skygge: true });
    } else if (innhold.overlegg === 'hjort' || innhold.kryss) {
      tegnKort(ctx, str, tilf, { terreng: innhold.terreng, lysning: true });
    } else tegnKort(ctx, str, tilf, innhold);
    glod(lerret, 0.5);   // bare på neonøya
    const k = { sig: signatur(innhold), str, lerret };
    this.kort.set(nokkel, k);
    return k;
  }

  /** Kortet i ønsket størrelse. Endret innhold tegnes straks; ny zoom tegnes etter hvert. */
  hent(nokkel, i, innhold, str) {
    const sig = signatur(innhold);
    const k = this.kort.get(nokkel);
    if (k && k.sig === sig) {
      if (k.str !== str) this.ko.set(nokkel, { i, innhold, str });
      return k.lerret;
    }
    this.ko.delete(nokkel);
    return this.#lagKort(nokkel, i, innhold, str).lerret;
  }

  /** Tegner opp til `maks` kort fra køen. Returnerer true hvis det gjenstår noe. */
  jobb(maks = 10) {
    for (const [nokkel, { i, innhold, str }] of this.ko) {
      if (maks-- <= 0) break;
      this.ko.delete(nokkel);
      this.#lagKort(nokkel, i, innhold, str);
    }
    return this.ko.size > 0;
  }

  /** Myk røyk rundt kanten av det kjente (et lite bilde forstørret med utjevning). */
  #roykBilde(spill) {
    const { bredde: B, hoyde: H } = this.verden;
    const nokkel = `${spill.stat.avdekket}`;
    if (this.royk && this.roykNokkel === nokkel) return this.royk;
    const P = 6, M = 2;
    const c = this.royk ?? document.createElement('canvas');
    c.width = (B + 2 * M) * P;
    c.height = (H + 2 * M) * P;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    for (let i = 0; i < B * H; i++) {
      if (!kanBorstes(spill, this.verden, i)) continue;
      const tilf = lagTilfeldig(blandSeed(this.verden.seed, 'royk', i));
      const cx = ((i % B) + M + 0.5) * P, cy = (Math.floor(i / B) + M + 0.5) * P;
      for (let k = 0; k < 2; k++) {
        const r = P * (0.8 + tilf.tall() * 0.7);
        const ox = (tilf.tall() - 0.5) * P * 1.2, oy = (tilf.tall() - 0.5) * P * 1.2;
        const g = ctx.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r);
        g.addColorStop(0, 'rgba(120, 125, 140, 0.16)');
        g.addColorStop(1, 'rgba(120, 125, 140, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(cx + ox - r, cy + oy - r, r * 2, r * 2);
      }
    }
    this.royk = c;
    this.roykNokkel = nokkel;
    this.roykMarg = M;
    return c;
  }


  /** Levende tåke over en rute: tre lag som glir i ulik fart og retning (verdenskoordinater, så den henger sammen mellom ruter). */
  #take(ctx, px, py, tsek, alfa = 1) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, KORT, KORT);
    ctx.clip();
    ctx.globalAlpha = 0.8 * alfa;
    flis(ctx, takeBunn(), px, py, KORT, KORT, px - tsek * 6, py + tsek * 3, 0.9);
    ctx.globalAlpha = 0.62 * alfa;
    flis(ctx, takeTekstur(), px, py, KORT, KORT, px + tsek * 13, py - tsek * 5, 0.7);
    ctx.globalAlpha = 0.42 * alfa;
    flis(ctx, takeTekstur(), px, py, KORT, KORT, px * 1.3 - tsek * 8 + 90, py * 1.3 + tsek * 6 + 40, 1.3);
    ctx.restore();
  }

  /** Vann som lever: glimt av sollys og skum langs kysten. */
  #vann(ctx, i, px, py, tsek, spill) {
    const { bredde: B, hoyde: H } = this.verden;
    const x = i % B, y = Math.floor(i / B);
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, KORT, KORT);
    ctx.clip();
    for (let k = 0; k < 4; k++) {
      const sd = i * 31 + k * 17;
      const fx = px + KORT * (0.12 + 0.76 * (0.5 + 0.5 * Math.sin(tsek * 0.33 + sd)));
      const fy = py + KORT * (0.12 + 0.76 * (0.5 + 0.5 * Math.cos(tsek * 0.27 + sd * 1.3)));
      const a = Math.max(0, Math.sin(tsek * 1.6 + sd)) * 0.55;
      if (a < 0.03) continue;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#eaffff';
      ctx.beginPath();
      ctx.ellipse(fx, fy, KORT * 0.07, KORT * 0.014, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= B || ny >= H) continue;
      const nb = ny * B + nx;
      if (!spill.avdekket[nb] || TERRENGNAVN[this.verden.terreng[nb]] === 'vann') continue;
      const bolge = 0.5 + 0.5 * Math.sin(tsek * 1.5 + i * 0.7 + (dx + dy) * 2);
      const w = KORT * (0.07 + 0.09 * bolge);
      const x0 = dx > 0 ? px + KORT - w : dx < 0 ? px : px, y0 = dy > 0 ? py + KORT - w : dy < 0 ? py : py;
      const bw = dx ? w : KORT, bh = dy ? w : KORT;
      const g = ctx.createLinearGradient(dx > 0 ? x0 : dx < 0 ? x0 + bw : 0, dy > 0 ? y0 : dy < 0 ? y0 + bh : 0, dx > 0 ? x0 + bw : dx < 0 ? x0 : 0, dy > 0 ? y0 + bh : dy < 0 ? y0 : 0);
      g.addColorStop(0, 'rgba(255, 255, 255, 0)');
      g.addColorStop(1, `rgba(255, 255, 255, ${0.35 + 0.35 * bolge})`);
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(x0, y0, bw, bh);
    }
    ctx.restore();
  }

  /**
   * Tegner brettet. ctx har kameraets transformasjon. utsnitt = synlige ruter.
   * avdekkAnim: rute → starttid for kort som snus fram. borstAnim: rute → tid for siste strøk.
   * hint: ruter som skal ha en pulserende ring (de første trykkene).
   */
  tegn(ctx, spill, { utsnitt, skala, avdekkAnim, borstAnim, byggAnim, naa, hint }) {
    const { bredde: B, hoyde: H } = this.verden;
    const str = passendeStorrelse(KORT * skala);
    this.harLiv = false;

    const royk = this.#roykBilde(spill);
    const M = this.roykMarg;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(royk, -M * RUTE, -M * RUTE, (B + 2 * M) * RUTE, (H + 2 * M) * RUTE);

    const { x0, y0, x1, y1 } = utsnitt;
    for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) {
      for (let x = Math.max(0, x0); x <= Math.min(B - 1, x1); x++) {
        const i = y * B + x;
        const innhold = innholdFor(spill, this.verden, i);
        if (!innhold) continue;
        const px = x * RUTE + FUGE / 2, py = y * RUTE + FUGE / 2;
        const start = avdekkAnim.get(i);
        if (start !== undefined) {
          // Tåka letter: kortet under kommer til syne mens tåka sprer seg, blekner og stiger.
          const p = Math.min(1, (naa - start) / 750);
          const jevn = p * p * (3 - 2 * p);
          ctx.drawImage(this.hent(i, i, innhold, str), px, py, KORT, KORT);
          ctx.save();
          ctx.globalAlpha = 1 - jevn;
          const sk = 1 + 0.35 * jevn;
          ctx.translate(px + KORT / 2, py + KORT / 2 - KORT * 0.08 * jevn);
          ctx.scale(sk, sk);
          ctx.rotate(0.06 * jevn);
          ctx.drawImage(this.hent(-1 - i, i, { ukjent: true }, str), -KORT / 2, -KORT / 2, KORT, KORT);
          this.#take(ctx, -KORT / 2, -KORT / 2, naa / 1000, 1);
          ctx.restore();
          this.harLiv = true;
          if (p >= 1) avdekkAnim.delete(i);
          continue;
        }
        const bygd = byggAnim?.get(i);
        if (bygd !== undefined) {
          // Nytt bygg: kortet spretter fram.
          const p = Math.min(1, (naa - bygd) / 600);
          const c = 1.70158, u = p - 1;
          const sk = 0.3 + 0.7 * (1 + (c + 1) * u ** 3 + c * u ** 2);
          ctx.drawImage(this.hent(i, i, innhold, str), px + KORT * (1 - sk) / 2, py + KORT * (1 - sk) / 2, KORT * sk, KORT * sk);
          if (p >= 1) byggAnim.delete(i);
          continue;
        }
        if (innhold.ukjent && innhold.take < TAKE_TRYKK) {
          // Tåka er tynnere: et hint av det som er under skinner gjennom.
          ctx.drawImage(this.hent(i, i, avdekketInnhold(spill, this.verden, i), str), px, py, KORT, KORT);
          const t = borstAnim.get(i);
          const rist = t ? Math.max(0, 1 - (naa - t) / 250) : 0;
          ctx.globalAlpha = innhold.take === 2 ? 0.78 : 0.5;
          ctx.drawImage(this.hent(-1 - i, i, { ukjent: true }, str), px + Math.sin(naa / 20) * rist * 4, py, KORT, KORT);
          this.#take(ctx, px, py, naa / 1000, innhold.take === 2 ? 0.7 : 0.4);
          ctx.globalAlpha = 1;
          this.harLiv = true;
          continue;
        }
        ctx.drawImage(this.hent(innhold.ukjent ? -1 - i : i, i, innhold, str), px, py, KORT, KORT);
        if (innhold.ukjent) { this.#take(ctx, px, py, naa / 1000); this.harLiv = true; }
        else if (innhold.terreng === 'vann') { this.#vann(ctx, i, px, py, naa / 1000, spill); this.harLiv = true; }
        if (harLiv(innhold)) {
          // Det som beveger seg tegnes oppå kortet, i kortets egne mål.
          this.harLiv = true;
          ctx.save();
          ctx.beginPath();
          ctx.rect(px, py, KORT, KORT);
          ctx.clip();
          ctx.translate(px, py);
          const tsek = naa / 1000;
          if (innhold.pynt) LIV[innhold.pynt](ctx, KORT, tsek, Infinity);
          else if (innhold.ting) tegnFigur(ctx, KORT, innhold.ting, { p: 1 - innhold.ting.igjen / innhold.ting.antall, t: tsek });
          else if (innhold.kryss) {
            const sist = borstAnim.get(i);
            tegnKryss(ctx, KORT, tsek, innhold.kryss, GRAV_TRYKK, sist ? Math.max(0, 1 - (naa - sist) / 250) : 0);
          } else tegnHjort(ctx, KORT, tsek, i % 17);
          ctx.restore();
        }
      }
    }

    // Skyskygger glir langsomt over øya
    {
      const tsek = naa / 1000;
      const bx0 = Math.max(0, x0) * RUTE, by0 = Math.max(0, y0) * RUTE;
      const bx1 = (Math.min(B - 1, x1) + 1) * RUTE, by1 = (Math.min(H - 1, y1) + 1) * RUTE;
      if (bx1 > bx0 && by1 > by0) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.2;
        flis(ctx, skyTekstur(), bx0, by0, bx1 - bx0, by1 - by0, bx0 - tsek * 11, by0 - tsek * 4, 1.8);
        ctx.restore();
        this.harLiv = true;
      }
    }

    // Pulserende ringer som viser hva man kan trykke på (bare helt i starten)
    if (hint?.length) {
      const puls = 0.5 + 0.5 * Math.sin(naa / 250);
      ctx.lineWidth = 5;
      ctx.strokeStyle = `rgba(255, 228, 120, ${0.35 + 0.5 * puls})`;
      for (const i of hint) {
        const x = (i % B) * RUTE + RUTE / 2, y = Math.floor(i / B) * RUTE + RUTE / 2;
        ctx.beginPath();
        ctx.arc(x, y, RUTE * (0.36 + 0.06 * puls), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
}

export { BAKGRUNN };

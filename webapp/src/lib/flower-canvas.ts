// Neon flower visualization — standalone canvas renderer, no React dependency.
// Flowers grow while a note plays, then fade out over 3 seconds on release.
// Five species: sunflower, daisy, rose, tulip, lily — all line-only.

const NEON_COLORS = [
  "#ff0055", "#ff3300", "#ff6600", "#ffaa00",
  "#ffee00", "#aaff00", "#00ff55", "#00ffaa",
  "#00ffee", "#00aaff", "#0055ff", "#3300ff",
  "#7700ff", "#aa00ff", "#ff00ee", "#ff0088",
];

type Species = "sunflower" | "daisy" | "rose" | "tulip" | "lily";
const SPECIES_LIST: Species[] = ["sunflower", "daisy", "rose", "tulip", "lily"];

const enum FlowerState {
  GROWING,
  FADING,
  DEAD,
}

interface Flower {
  cx: number;
  cy: number;
  baseRadius: number;
  scale: number;
  opacity: number;
  rotation: number;
  noteIndex: number;
  color: string;
  species: Species;
  state: FlowerState;
  birthTime: number;
  releaseTime: number;
  rotSpeed: number;
}

const GROW_RATE = 0.12;
const FADE_GROW_RATE = 0.25;
const FADE_DURATION = 3000;
const GLOW_BLUR = 18;

export class FlowerCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private flowers: Flower[] = [];
  private raf = 0;
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.resize();
    this.lastTime = performance.now();
    this.tick = this.tick.bind(this);
    this.raf = requestAnimationFrame(this.tick);

    this._onResize = this._onResize.bind(this);
    window.addEventListener("resize", this._onResize);
  }

  private _onResize() {
    this.resize();
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  spawnFlower(noteIndex: number): void {
    const margin = 60;
    const cx = margin + Math.random() * (window.innerWidth - margin * 2);
    const cy = margin + Math.random() * (window.innerHeight - margin * 2);
    const baseRadius = 30 + Math.random() * 50;

    this.flowers.push({
      cx,
      cy,
      baseRadius,
      scale: 1.0,
      opacity: 1.0,
      rotation: Math.random() * Math.PI * 2,
      noteIndex,
      color: NEON_COLORS[noteIndex] || "#ffffff",
      species: SPECIES_LIST[Math.floor(Math.random() * SPECIES_LIST.length)],
      state: FlowerState.GROWING,
      birthTime: performance.now(),
      releaseTime: 0,
      rotSpeed: (Math.random() - 0.5) * 0.4,
    });
  }

  releaseAll(): void {
    const now = performance.now();
    for (const f of this.flowers) {
      if (f.state === FlowerState.GROWING) {
        f.state = FlowerState.FADING;
        f.releaseTime = now;
      }
    }
  }

  private tick(time: number) {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);

    let alive = 0;
    for (let i = 0; i < this.flowers.length; i++) {
      const f = this.flowers[i];

      f.rotation += f.rotSpeed * dt;

      if (f.state === FlowerState.GROWING) {
        f.scale += GROW_RATE * dt;
        if (f.scale > 1.5) f.scale = 1.5;
      } else if (f.state === FlowerState.FADING) {
        f.scale += FADE_GROW_RATE * dt;
        if (f.scale > 2.5) f.scale = 2.5;
        const elapsed = time - f.releaseTime;
        f.opacity = Math.max(0, 1 - elapsed / FADE_DURATION);
        if (f.opacity <= 0) {
          f.state = FlowerState.DEAD;
          continue;
        }
      } else {
        continue;
      }

      this.drawFlower(f);
      alive++;
    }

    if (this.flowers.length > alive + 20) {
      this.flowers = this.flowers.filter((f) => f.state !== FlowerState.DEAD);
    }

    this.raf = requestAnimationFrame(this.tick);
  }

  private drawFlower(f: Flower) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = f.opacity;
    ctx.strokeStyle = f.color;
    ctx.lineWidth = 1.8;
    ctx.shadowColor = f.color;
    ctx.shadowBlur = GLOW_BLUR * f.opacity;

    switch (f.species) {
      case "sunflower":
        this.drawSunflower(f);
        break;
      case "daisy":
        this.drawDaisy(f);
        break;
      case "rose":
        this.drawRose(f);
        break;
      case "tulip":
        this.drawTulip(f);
        break;
      case "lily":
        this.drawLily(f);
        break;
    }

    ctx.restore();
  }

  // Sunflower: many narrow pointed petals radiating from a large seed disk
  private drawSunflower(f: Flower) {
    const ctx = this.ctx;
    const r = f.baseRadius * f.scale;
    const n = 14;
    const centerR = r * 0.32;

    // Petals start at edge of center disk, extend outward
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 / n) * i + f.rotation;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      // Petal as a pointed leaf shape via quadratic curves
      const baseX = f.cx + cos * centerR;
      const baseY = f.cy + sin * centerR;
      const tipX = f.cx + cos * r;
      const tipY = f.cy + sin * r;
      const perpX = -sin;
      const perpY = cos;
      const width = r * 0.09;

      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.quadraticCurveTo(
        (baseX + tipX) / 2 + perpX * width,
        (baseY + tipY) / 2 + perpY * width,
        tipX, tipY
      );
      ctx.quadraticCurveTo(
        (baseX + tipX) / 2 - perpX * width,
        (baseY + tipY) / 2 - perpY * width,
        baseX, baseY
      );
      ctx.stroke();
    }

    // Large center seed disk
    ctx.beginPath();
    ctx.arc(f.cx, f.cy, centerR, 0, Math.PI * 2);
    ctx.stroke();

    // Cross-hatch pattern inside disk to suggest seeds
    const gridN = 4;
    for (let i = -gridN; i <= gridN; i++) {
      const offset = (i / gridN) * centerR * 0.8;
      const halfLen = Math.sqrt(Math.max(0, (centerR * 0.8) ** 2 - offset ** 2));
      if (halfLen < 2) continue;

      ctx.beginPath();
      ctx.moveTo(f.cx + offset, f.cy - halfLen);
      ctx.lineTo(f.cx + offset, f.cy + halfLen);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(f.cx - halfLen, f.cy + offset);
      ctx.lineTo(f.cx + halfLen, f.cy + offset);
      ctx.stroke();
    }
  }

  // Daisy: 8 elongated teardrop petals, small round center
  private drawDaisy(f: Flower) {
    const ctx = this.ctx;
    const r = f.baseRadius * f.scale;
    const n = 8;
    const centerR = r * 0.14;

    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 / n) * i + f.rotation;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const perpX = -sin;
      const perpY = cos;

      const baseX = f.cx + cos * centerR;
      const baseY = f.cy + sin * centerR;
      const tipX = f.cx + cos * r * 0.85;
      const tipY = f.cy + sin * r * 0.85;
      // Widest point at ~40% from base
      const midX = baseX + (tipX - baseX) * 0.4;
      const midY = baseY + (tipY - baseY) * 0.4;
      const width = r * 0.14;

      // Teardrop: wide near base, pointed at tip
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.quadraticCurveTo(midX + perpX * width, midY + perpY * width, tipX, tipY);
      ctx.quadraticCurveTo(midX - perpX * width, midY - perpY * width, baseX, baseY);
      ctx.stroke();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(f.cx, f.cy, centerR, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Rose: concentric petal arcs all centered on the flower, with a tight spiral core
  private drawRose(f: Flower) {
    const ctx = this.ctx;
    const r = f.baseRadius * f.scale;

    // Outer petals: 5 arcs at the same radius, evenly spaced, each ~100° sweep
    // This creates the outer "ring" of petals seen from above
    const outerN = 5;
    for (let i = 0; i < outerN; i++) {
      const angle = (Math.PI * 2 / outerN) * i + f.rotation;
      const sweep = Math.PI * 0.55;
      ctx.beginPath();
      ctx.arc(f.cx, f.cy, r * 0.82, angle - sweep / 2, angle + sweep / 2);
      ctx.stroke();
    }

    // Middle petals: 4 arcs, smaller radius, offset rotation
    const midN = 4;
    for (let i = 0; i < midN; i++) {
      const angle = (Math.PI * 2 / midN) * i + f.rotation + 0.4;
      const sweep = Math.PI * 0.6;
      ctx.beginPath();
      ctx.arc(f.cx, f.cy, r * 0.55, angle - sweep / 2, angle + sweep / 2);
      ctx.stroke();
    }

    // Inner petals: 3 arcs, smaller still
    const innerN = 3;
    for (let i = 0; i < innerN; i++) {
      const angle = (Math.PI * 2 / innerN) * i + f.rotation + 0.9;
      const sweep = Math.PI * 0.65;
      ctx.beginPath();
      ctx.arc(f.cx, f.cy, r * 0.33, angle - sweep / 2, angle + sweep / 2);
      ctx.stroke();
    }

    // Tight spiral at center
    ctx.beginPath();
    const spiralSteps = 30;
    for (let i = 0; i <= spiralSteps; i++) {
      const t = i / spiralSteps;
      const angle = f.rotation + t * Math.PI * 2 * 1.5;
      const sr = r * 0.03 + r * 0.1 * t;
      const x = f.cx + Math.cos(angle) * sr;
      const y = f.cy + Math.sin(angle) * sr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Tulip: top-down view — two rows of 3 petals (outer + inner), overlapping to form a cup
  private drawTulip(f: Flower) {
    const ctx = this.ctx;
    const r = f.baseRadius * f.scale;

    // Outer 3 petals — wider, rounded teardrop shapes
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 / 3) * i + f.rotation;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const perpX = -sin;
      const perpY = cos;

      const baseX = f.cx + cos * r * 0.1;
      const baseY = f.cy + sin * r * 0.1;
      const tipX = f.cx + cos * r * 0.85;
      const tipY = f.cy + sin * r * 0.85;
      const width = r * 0.22;

      // Wide petal with rounded tip (bulge control points past tip)
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.bezierCurveTo(
        baseX + cos * r * 0.3 + perpX * width,
        baseY + sin * r * 0.3 + perpY * width,
        tipX + perpX * width * 0.4,
        tipY + perpY * width * 0.4,
        tipX, tipY
      );
      ctx.bezierCurveTo(
        tipX - perpX * width * 0.4,
        tipY - perpY * width * 0.4,
        baseX + cos * r * 0.3 - perpX * width,
        baseY + sin * r * 0.3 - perpY * width,
        baseX, baseY
      );
      ctx.stroke();
    }

    // Inner 3 petals — slightly shorter and narrower, rotated 60°
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 / 3) * i + f.rotation + Math.PI / 3;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const perpX = -sin;
      const perpY = cos;

      const baseX = f.cx + cos * r * 0.08;
      const baseY = f.cy + sin * r * 0.08;
      const tipX = f.cx + cos * r * 0.65;
      const tipY = f.cy + sin * r * 0.65;
      const width = r * 0.16;

      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.bezierCurveTo(
        baseX + cos * r * 0.25 + perpX * width,
        baseY + sin * r * 0.25 + perpY * width,
        tipX + perpX * width * 0.3,
        tipY + perpY * width * 0.3,
        tipX, tipY
      );
      ctx.bezierCurveTo(
        tipX - perpX * width * 0.3,
        tipY - perpY * width * 0.3,
        baseX + cos * r * 0.25 - perpX * width,
        baseY + sin * r * 0.25 - perpY * width,
        baseX, baseY
      );
      ctx.stroke();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(f.cx, f.cy, r * 0.07, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Lily: 6 recurving petals with prominent long stamens
  private drawLily(f: Flower) {
    const ctx = this.ctx;
    const r = f.baseRadius * f.scale;
    const n = 6;
    const centerR = r * 0.08;

    // Petals that curve backward (recurve at tips)
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 / n) * i + f.rotation;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const perpX = -sin;
      const perpY = cos;

      const tipDist = r * 0.9;
      const width = r * 0.12;

      // Bezier control points that flare outward at tip (recurve)
      const cp1Lx = f.cx + cos * tipDist * 0.5 + perpX * width;
      const cp1Ly = f.cy + sin * tipDist * 0.5 + perpY * width;
      // Tip recurves — control point bends backward
      const tipX = f.cx + cos * tipDist;
      const tipY = f.cy + sin * tipDist;
      const recurveX = tipX + perpX * width * 1.2 - cos * r * 0.15;
      const recurveY = tipY + perpY * width * 1.2 - sin * r * 0.15;

      const cp1Rx = f.cx + cos * tipDist * 0.5 - perpX * width;
      const cp1Ry = f.cy + sin * tipDist * 0.5 - perpY * width;
      const recurveRx = tipX - perpX * width * 1.2 - cos * r * 0.15;
      const recurveRy = tipY - perpY * width * 1.2 - sin * r * 0.15;

      ctx.beginPath();
      ctx.moveTo(f.cx + cos * centerR, f.cy + sin * centerR);
      ctx.bezierCurveTo(cp1Lx, cp1Ly, recurveX, recurveY, tipX, tipY);
      ctx.bezierCurveTo(recurveRx, recurveRy, cp1Rx, cp1Ry, f.cx + cos * centerR, f.cy + sin * centerR);
      ctx.stroke();

      // Center vein line on each petal
      ctx.beginPath();
      ctx.moveTo(f.cx + cos * centerR, f.cy + sin * centerR);
      ctx.lineTo(f.cx + cos * tipDist * 0.7, f.cy + sin * tipDist * 0.7);
      ctx.stroke();
    }

    // Long stamens extending between petals
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i + f.rotation + Math.PI / 6;
      const len = r * 0.55;
      const tipX = f.cx + Math.cos(angle) * len;
      const tipY = f.cy + Math.sin(angle) * len;

      // Slightly curved stamen
      const cpX = f.cx + Math.cos(angle) * len * 0.6 + Math.cos(angle + 0.3) * r * 0.05;
      const cpY = f.cy + Math.sin(angle) * len * 0.6 + Math.sin(angle + 0.3) * r * 0.05;

      ctx.beginPath();
      ctx.moveTo(f.cx, f.cy);
      ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
      ctx.stroke();

      // Anther (small oval at stamen tip)
      ctx.beginPath();
      ctx.ellipse(tipX, tipY, r * 0.04, r * 0.02, angle, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(f.cx, f.cy, centerR, 0, Math.PI * 2);
    ctx.stroke();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this._onResize);
  }
}

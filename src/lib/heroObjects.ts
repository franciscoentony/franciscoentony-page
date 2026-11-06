/*
 * Objetos do hero: satélite, astronauta e meteoro (docs/redesign/
 * SPEC-HERO-OBJETOS.md). Arte do mesmo motor do planeta: mesma grade de
 * células, mesma rampa, mesma luz e a mesma fórmula de brilho com a borda
 * iridescente. Cada objeto é uma cena de SDFs 2D (círculo, caixa, cápsula,
 * elipse) com um material por região.
 *
 * Este arquivo não usa DOM: roda no Web Worker do planeta (A8) e, sem
 * worker, na página. Quem chama manda os eventos de ponteiro (grab/move/
 * release), chama step() e draw() a cada quadro e lê snapshot() para
 * posicionar as áreas de pegar.
 */
import {
  drawGlyph,
  getAsciiAtlas,
  type AsciiAtlas,
  type Canvas2D,
} from "./asciiAtlas";
import { ASCII_RAMP, clamp, lerp, smoothstep } from "./motion";
import type { PlanetScene } from "./planet";

// ---------- Formas (SDF 2D: < 0 dentro, > 0 fora) ----------

const sdCircle = (x: number, y: number, r: number) => Math.hypot(x, y) - r;

/** Caixa com meia-largura bx, meia-altura by e cantos de raio r. */
function sdBox(x: number, y: number, bx: number, by: number, r = 0) {
  const qx = Math.abs(x) - bx + r;
  const qy = Math.abs(y) - by + r;
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    r
  );
}

/** Cápsula de (ax, ay) a (bx, by) com raio r. */
function sdCapsule(
  x: number,
  y: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  r: number,
) {
  const px = x - ax;
  const py = y - ay;
  const dx = bx - ax;
  const dy = by - ay;
  const h = clamp((px * dx + py * dy) / (dx * dx + dy * dy));
  return Math.hypot(px - dx * h, py - dy * h) - r;
}

const sdEllipse = (x: number, y: number, rx: number, ry: number) =>
  (Math.hypot(x / rx, y / ry) - 1) * Math.min(rx, ry);

/** Ruído de senos (o mesmo do planeta): crateras do meteoro. */
function noise3(x: number, y: number, z: number) {
  return (
    Math.sin(x * 1.7 + Math.sin(y * 2.3 + z)) * 0.5 +
    Math.sin(y * 3.1 + Math.cos(z * 1.3 + x * 0.7)) * 0.3 +
    Math.sin(z * 4.7 + x * 2.1) * 0.2
  );
}

/** Materiais: casca, visor/ouro, painel solar, luz que pisca, rocha. */
const SHELL = 0;
const VISOR = 1;
const PANEL = 2;
const BLINK = 3;
const ROCK = 4;

/** Resultado de uma cena (reaproveitado para não criar objetos por célula). */
const hit = { d: 0, material: 0 };

function astronaut(x: number, y: number, time: number) {
  const wave = Math.sin(time * 0.002) * 0.08; // um braço acena
  let d = sdCircle(x, y + 0.55, 0.32); // capacete
  d = Math.min(d, sdBox(x, y - 0.05, 0.3, 0.33, 0.12)); // tronco
  d = Math.min(d, sdBox(x + 0.3, y, 0.12, 0.28, 0.06)); // mochila
  d = Math.min(d, sdCapsule(x, y, -0.28, -0.1, -0.55, 0.2, 0.1)); // braços
  d = Math.min(d, sdCapsule(x, y, 0.28, -0.1, 0.5, -0.3 - wave, 0.1));
  d = Math.min(d, sdCapsule(x, y, -0.13, 0.35, -0.2, 0.8, 0.12)); // pernas
  d = Math.min(d, sdCapsule(x, y, 0.13, 0.35, 0.26, 0.76, 0.12));
  let material = SHELL;
  if (d < 0 && sdEllipse(x - 0.05, y + 0.55, 0.21, 0.15) < 0) material = VISOR;
  if (d < 0 && sdBox(x - 0.04, y - 0.02, 0.11, 0.06, 0.02) < 0)
    material = BLINK; // painel do peito
  hit.d = d;
  hit.material = material;
}

function satellite(x: number, y: number) {
  let d = sdBox(x, y, 0.22, 0.42, 0.05); // corpo
  let material = SHELL;
  const panels = Math.min(
    sdBox(x + 0.86, y, 0.46, 0.26),
    sdBox(x - 0.86, y, 0.46, 0.26),
  );
  if (panels < d) {
    d = panels;
    material = PANEL;
  }
  const shell = Math.min(
    sdBox(x, y, 0.42, 0.045), // hastes
    sdCapsule(x, y, 0, -0.42, 0, -0.58, 0.06), // pescoço do prato
    Math.max(sdCircle(x, y + 0.72, 0.2), -sdCircle(x, y + 0.64, 0.17)), // prato
    sdCapsule(x, y, 0, -0.72, 0, -0.92, 0.035), // antena
  );
  if (shell < d) {
    d = shell;
    material = SHELL;
  }
  const tip = sdCircle(x, y + 0.96, 0.07); // luz da antena
  if (tip < d) {
    d = tip;
    material = BLINK;
  }
  hit.d = d;
  hit.material = material;
}

function meteor(x: number, y: number, seed: number) {
  const angle = Math.atan2(y, x);
  const radius =
    0.5 *
    (1 +
      0.16 * noise3(Math.cos(angle) * 1.6 + seed, Math.sin(angle) * 1.6, 0.4));
  hit.d = Math.hypot(x, y) - radius;
  hit.material = ROCK;
}

// ---------- Estado ----------

type ObjectId = "satellite" | "astronaut" | "meteor";

interface HeroObject {
  id: ObjectId;
  /** Escala base em px (largura ≥ 1280). */
  size: number;
  /** Alcance de pegar/colidir: r = s × reach. */
  reach: number;
  /** Repouso em fração da tela: desktop, tablet (640–859) e celular. */
  home: {
    desktop: [number, number];
    tablet: [number, number];
    mobile: [number, number];
  };
  orbit: boolean;
  seed: number;
  // calculados
  s: number;
  r: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  /** ms desde o último arremesso ou choque (voo livre até 1.4s). */
  free: number;
  held: boolean;
  overText: boolean;
  trail: [number, number][];
}

function createObject(
  id: ObjectId,
  size: number,
  reach: number,
  home: HeroObject["home"],
  extra: Partial<HeroObject> = {},
): HeroObject {
  return {
    id,
    size,
    reach,
    home,
    orbit: false,
    seed: 0,
    s: size,
    r: size * reach,
    x: NaN,
    y: NaN,
    vx: 0,
    vy: 0,
    angle: 0,
    spin: 0,
    free: 0,
    held: false,
    overText: false,
    trail: [],
    ...extra,
  };
}

/** Retângulo do texto do hero (h1 + CTAs + assinatura), já com a folga. */
export interface TextBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** O que muda a cada quadro e vem de quem desenha. */
export interface HeroObjectsFrame {
  width: number;
  height: number;
  time: number;
  /** Progresso do Universe: os objetos somem entre 0 e 0.12. */
  progress: number;
  /** Baixo e reduced motion: 1 quadro parado, sem física nem arrasto. */
  isStatic: boolean;
  /** Tamanho do rastro do meteoro (26 no Alto, 14 no Médio). */
  trailLength: number;
  textBox: TextBox | null;
  hueBands: number;
  dpr?: number;
}

/** Mensagens de ponteiro (coordenadas no canvas, tempo da página). */
export type HeroObjectsInput =
  | { op: "grab"; index: number; x: number; y: number; t: number }
  | { op: "move"; x: number; y: number; t: number }
  | { op: "release"; t: number }
  | { op: "nudge" };

/** 4 números por objeto: x, y, raio e 1 se dá para pegar (senão 0). */
export const SNAPSHOT_SIZE = 12;

/** Ponteiro parado há mais que isto (ms): a velocidade do arremesso zera (I-6). */
const STILL_MS = 60;

/** Faixa do atlas dourado (visor, luzes, cabeça do rastro). */
const GOLD_HUES: [number, number] = [36, 54];

export class HeroObjects {
  private objects: HeroObject[] = [
    createObject("satellite", 95, 1.25, {
      desktop: [0.13, 0.3],
      tablet: [0.17, 0.56],
      mobile: [0.24, 0.6],
    }),
    createObject(
      "astronaut",
      90,
      0.95,
      { desktop: [0.85, 0.4], tablet: [0.83, 0.52], mobile: [0.78, 0.64] },
      { angle: -0.3 },
    ),
    createObject(
      "meteor",
      46,
      0.7,
      { desktop: [0, 0], tablet: [0, 0], mobile: [0, 0] },
      { orbit: true, seed: 3.1 },
    ),
  ];

  private width = 0;
  private height = 0;
  private alpha = 1;
  private lastStep = 0;
  private meteorPlaced = false;
  private held: HeroObject | null = null;
  // Ponteiro de quem está sendo segurado
  private grabOffset = { x: 0, y: 0 };
  private target = { x: 0, y: 0 };
  private pointerVelocity = { x: 0, y: 0 };
  private lastPointer = { x: 0, y: 0, t: 0 };
  private snapshotData = new Array<number>(SNAPSHOT_SIZE).fill(0);

  /** Escala por largura (≥1280 = 1; 860 = .92; 640 = .8; celular .55/.75). */
  private scaleFor(object: HeroObject) {
    if (this.width >= 1280) return 1;
    if (this.width >= 860) return 0.92;
    if (this.width >= 640) return 0.8;
    return object.id === "astronaut" ? 0.75 : 0.55;
  }

  /** No celular (< 640) o satélite não aparece: 3 linhas viravam borrão. */
  private isHidden(object: HeroObject) {
    return this.width < 640 && object.id === "satellite";
  }

  /** Ajusta tamanhos ao canvas (no 1º quadro e quando a tela muda). */
  private fit(width: number, height: number, isStatic: boolean) {
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    for (const object of this.objects) {
      object.s = object.size * this.scaleFor(object);
      object.r = object.s * object.reach;
      object.trail = [];
      object.spin = 0;
      object.free = 0;
      if (isStatic || Number.isNaN(object.x)) {
        object.x = NaN; // reposiciona no repouso no próximo step/draw
      }
    }
    this.meteorPlaced = false;
  }

  /** Posição de repouso: [x, y, atrás do planeta?]. */
  private homeOf(
    object: HeroObject,
    time: number,
    scene: PlanetScene,
    textBox: TextBox | null,
    isStatic: boolean,
  ): [number, number, boolean] {
    const W = this.width;
    const H = this.height;

    if (object.orbit) {
      // Elipse em volta do planeta: a metade de trás arqueia no céu e some
      // atrás do disco; a da frente é curta (não estaciona embaixo)
      const angle = isStatic ? -2.2 : time * 0.00022 + 1.2;
      const sin = Math.sin(angle);
      const x = scene.cx + Math.cos(angle) * scene.radius * 2.4;
      const y = Math.min(
        H - 70,
        scene.cy + sin * scene.radius * (sin < 0 ? 1.25 : 0.45),
      );
      return [x, y, sin < 0];
    }

    // Flutua de leve em volta do repouso
    const bobX = Math.sin(time * 0.0007 + object.size) * 6;
    const bobY = Math.cos(time * 0.0009 + object.size) * 8;

    // Desktop: no centro da margem livre ao lado do texto
    if (W >= 860 && textBox) {
      const isLeft = object.id === "satellite";
      const gutter = isLeft ? textBox.x0 : W - textBox.x1;
      if (gutter > object.r * 2 * 1.05) {
        const x = isLeft ? gutter / 2 : (textBox.x1 + W) / 2;
        return [x + bobX, H * object.home.desktop[1] + bobY, false];
      }
    }
    const fraction =
      W >= 860
        ? object.home.desktop
        : W >= 640
          ? object.home.tablet
          : object.home.mobile;
    return [W * fraction[0] + bobX, H * fraction[1] + bobY, false];
  }

  // ---------- Ponteiro ----------

  input(message: HeroObjectsInput) {
    if (message.op === "grab") {
      const object = this.objects[message.index];
      if (!object || this.isHidden(object)) return;
      this.held = object;
      object.held = true;
      this.grabOffset = { x: message.x - object.x, y: message.y - object.y };
      this.target = { x: object.x, y: object.y };
      this.pointerVelocity = { x: 0, y: 0 };
      this.lastPointer = { x: message.x, y: message.y, t: message.t };
      return;
    }

    if (message.op === "move") {
      const object = this.held;
      if (!object) return;
      const dt = Math.max(1, message.t - this.lastPointer.t) / 16.7;
      this.target = {
        x: message.x - this.grabOffset.x,
        y: message.y - this.grabOffset.y,
      };
      // Velocidade do ponteiro com média móvel (EMA de .5)
      this.pointerVelocity.x = lerp(
        this.pointerVelocity.x,
        (message.x - this.lastPointer.x) / dt,
        0.5,
      );
      this.pointerVelocity.y = lerp(
        this.pointerVelocity.y,
        (message.y - this.lastPointer.y) / dt,
        0.5,
      );
      this.lastPointer = { x: message.x, y: message.y, t: message.t };
      return;
    }

    if (message.op === "release") {
      const object = this.held;
      if (!object) return;
      // Segurou parado antes de soltar: não arremessa (I-6)
      if (message.t - this.lastPointer.t > STILL_MS) {
        this.pointerVelocity = { x: 0, y: 0 };
      }
      // Solta com a velocidade do ponteiro, limitada a 30px/quadro
      const speed = Math.hypot(this.pointerVelocity.x, this.pointerVelocity.y);
      const cap = speed > 30 ? 30 / speed : 1;
      object.vx = this.pointerVelocity.x * cap;
      object.vy = this.pointerVelocity.y * cap;
      object.spin += object.vx * 0.002;
      object.held = false;
      object.free = 0;
      this.held = null;
      return;
    }

    // "nudge": dica no toque, um empurrãozinho único no astronauta
    const astronautObject = this.objects[1];
    if (!astronautObject.held && this.alpha > 0.5) {
      astronautObject.spin += 0.06;
      astronautObject.vy -= 2.5;
      astronautObject.free = 0;
    }
  }

  // ---------- Física ----------

  step(frame: HeroObjectsFrame, scene: PlanetScene) {
    this.fit(frame.width, frame.height, frame.isStatic);
    const { time, textBox, isStatic } = frame;
    this.alpha = 1 - smoothstep(clamp(frame.progress / 0.12));

    // Repouso inicial (e sempre, no quadro parado)
    for (const object of this.objects) {
      if (Number.isNaN(object.x) || isStatic) {
        const [x, y] = this.homeOf(object, time, scene, textBox, isStatic);
        object.x = x;
        object.y = y;
        object.vx = 0;
        object.vy = 0;
        if (object.orbit) object.free = 2000;
      }
    }

    // Parado (Baixo/RM) ou já fora do hero: nada se move
    if (isStatic || this.alpha <= 0.01) {
      this.lastStep = time;
      return;
    }

    const k = Math.min(3, (time - this.lastStep) / 16.7 || 1);
    this.lastStep = time;

    if (!this.meteorPlaced) {
      const meteorObject = this.objects[2];
      const [x, y] = this.homeOf(meteorObject, time, scene, textBox, false);
      meteorObject.x = x;
      meteorObject.y = y;
      meteorObject.free = 2000;
      this.meteorPlaced = true;
    }

    for (const object of this.objects) {
      if (this.isHidden(object)) continue;

      if (object.held) {
        // Ponteiro parado: a velocidade zera (não colide como se andasse)
        if (time - this.lastPointer.t > STILL_MS) {
          this.pointerVelocity = { x: 0, y: 0 };
        }
        object.x += (this.target.x - object.x) * 0.5;
        object.y += (this.target.y - object.y) * 0.5;
        object.vx = this.pointerVelocity.x;
        object.vy = this.pointerVelocity.y;
        continue;
      }

      const [homeX, homeY] = this.homeOf(object, time, scene, textBox, false);
      object.free += k * 16.7;
      if (object.free > 1400 || Math.hypot(object.vx, object.vy) < 0.4) {
        // Depois do voo livre: mola de volta ao repouso (ou à órbita)
        object.vx += (homeX - object.x) * 0.0016 * k;
        object.vy += (homeY - object.y) * 0.0016 * k;
        object.vx *= Math.pow(0.95, k);
        object.vy *= Math.pow(0.95, k);
      } else {
        // Vácuo: quase sem atrito
        object.vx *= Math.pow(0.997, k);
        object.vy *= Math.pow(0.997, k);
      }
      object.x += object.vx * k;
      object.y += object.vy * k;

      // Bordas do hero (abaixo da nav, 44px): quica com 72% da energia
      const { r } = object;
      if (object.x < r) {
        object.x = r;
        object.vx = Math.abs(object.vx) * 0.72;
      }
      if (object.x > this.width - r) {
        object.x = this.width - r;
        object.vx = -Math.abs(object.vx) * 0.72;
      }
      if (object.y < r + 44) {
        object.y = r + 44;
        object.vy = Math.abs(object.vy) * 0.72;
      }
      if (object.y > this.height - r) {
        object.y = this.height - r;
        object.vy = -Math.abs(object.vy) * 0.72;
      }

      // O texto é uma parede macia: empurra para fora, nada descansa ali
      object.overText = Boolean(
        textBox &&
        object.x > textBox.x0 &&
        object.x < textBox.x1 &&
        object.y > textBox.y0 &&
        object.y < textBox.y1,
      );
      if (object.overText && textBox) {
        const centerX = (textBox.x0 + textBox.x1) / 2;
        const push = object.free > 1400 ? 0.35 : 0.9;
        object.vx += Math.sign(object.x - centerX || 1) * push * k;
        object.vy *= Math.pow(0.9, k);
      }

      // Planeta: corpo rígido. O meteoro em órbita passa por trás dele;
      // arremessado, colide
      if (!(object.orbit && object.free > 1400)) {
        const dx = object.x - scene.cx;
        const dy = object.y - scene.cy;
        const distance = Math.hypot(dx, dy);
        const min = scene.radius * 1.02 + object.r * 0.8;
        if (distance < min && distance > 0) {
          const nx = dx / distance;
          const ny = dy / distance;
          const vn = object.vx * nx + object.vy * ny;
          object.x = scene.cx + nx * min;
          object.y = scene.cy + ny * min;
          if (vn < 0) {
            object.vx -= 1.75 * vn * nx;
            object.vy -= 1.75 * vn * ny;
            object.spin += vn * 0.004;
          }
        }
      }

      // Giro com amortecimento; em repouso, o astronauta balança e o
      // satélite volta à inclinação de 0.35 rad pelo caminho mais curto
      object.angle += object.spin * k;
      object.spin *= Math.pow(0.985, k);
      if (Math.abs(object.spin) < 0.01) {
        const turns = Math.PI * 2 * Math.round(object.angle / (Math.PI * 2));
        if (object.id === "astronaut") {
          object.angle +=
            (Math.sin(time * 0.0005) * 0.35 - (object.angle - turns)) *
            0.02 *
            k;
        }
        if (object.id === "satellite") {
          object.angle -= turns;
          object.angle +=
            (0.35 + Math.sin(time * 0.0006) * 0.12 - object.angle) * 0.03 * k;
        }
      }
    }

    this.collide();

    // Rastro do meteoro: amostrado pela distância percorrida (a cauda se
    // estende mesmo devagar)
    const meteorObject = this.objects[2];
    const last = meteorObject.trail[0];
    if (
      !last ||
      Math.hypot(meteorObject.x - last[0], meteorObject.y - last[1]) >
        meteorObject.s * 0.35
    ) {
      meteorObject.trail.unshift([meteorObject.x, meteorObject.y]);
      if (meteorObject.trail.length > frame.trailLength)
        meteorObject.trail.length = frame.trailLength;
    }
  }

  /** Choques elásticos entre os objetos (massa ∝ s²; segurado = infinita). */
  private collide() {
    const list = this.objects;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if ((a.held && b.held) || this.isHidden(a) || this.isHidden(b))
          continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);
        const min = (a.r + b.r) * 0.8;
        if (distance >= min || distance === 0) continue;

        const nx = dx / distance;
        const ny = dy / distance;
        const massA = a.held ? 1e6 : a.s * a.s;
        const massB = b.held ? 1e6 : b.s * b.s;
        const push = min - distance;
        a.x -= (nx * push * massB) / (massA + massB);
        a.y -= (ny * push * massB) / (massA + massB);
        b.x += (nx * push * massA) / (massA + massB);
        b.y += (ny * push * massA) / (massA + massB);

        const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (relative > 0) continue;
        const impulse = (-1.8 * relative) / (1 / massA + 1 / massB);
        a.vx -= (impulse * nx) / massA;
        a.vy -= (impulse * ny) / massA;
        b.vx += (impulse * nx) / massB;
        b.vy += (impulse * ny) / massB;
        a.free = 0;
        b.free = 0;
        a.spin += relative * 0.003;
        b.spin -= relative * 0.003;
      }
    }
  }

  // ---------- Desenho ----------

  draw(ctx: Canvas2D, frame: HeroObjectsFrame, scene: PlanetScene) {
    if (this.alpha <= 0.01) return;
    const { time, isStatic } = frame;
    const t = isStatic ? 0 : time;
    const cw = scene.cellWidth;
    const ch = scene.cellHeight;
    const L = scene.light;
    const hueBase = scene.hueBase;

    // O atlas do planeta (as mesmas cores) + um dourado para visor e luzes
    const planetAtlas = getAsciiAtlas({
      font: scene.font,
      fontSize: scene.fontSize,
      hueBands: frame.hueBands,
      saturations: [75, 100],
      lightness: (bright) => 50 + bright * 40,
      dpr: frame.dpr,
    });
    const goldAtlas = getAsciiAtlas({
      font: scene.font,
      fontSize: scene.fontSize,
      hueBands: 1,
      saturations: [90],
      lightness: (bright) => 50 + bright * 40,
      dpr: frame.dpr,
      hueRange: GOLD_HUES,
    });

    const put = (
      level: number,
      x: number,
      y: number,
      hue: number,
      saturation: number,
      alpha: number,
    ) => {
      // Matiz normalizado: 20°–100° é ouro; o resto cai na faixa do planeta
      let h = ((hue % 360) + 360) % 360;
      let atlas: AsciiAtlas = planetAtlas;
      if (h >= 20 && h <= 100) atlas = goldAtlas;
      else if (h < 230) h += 360;
      drawGlyph(
        ctx,
        atlas,
        level,
        h,
        atlas === goldAtlas ? 0 : saturation >= 85 ? 1 : 0,
        x,
        y,
        alpha,
      );
    };

    // Rastro do meteoro primeiro (fica atrás): ouro na cabeça → lavanda na
    // cauda. Nunca sobre o planeta nem sobre a própria rocha
    const meteorObject = this.objects[2];
    if (!isStatic) {
      const trail = meteorObject.trail;
      trail.forEach(([x, y], i) => {
        const q = 1 - i / trail.length;
        const count = Math.round(1 + q * 2.5);
        for (let n = 0; n < count; n++) {
          const jx =
            Math.sin(i * 12.9 + n * 78.2) * 0.5 * meteorObject.s * 0.6 * q;
          const jy =
            Math.cos(i * 4.1 + n * 9.7) * 0.5 * meteorObject.s * 0.6 * q;
          const gx = Math.round((x + jx) / cw) * cw;
          const gy = Math.round((y + jy) / ch) * ch;
          if (
            Math.hypot(gx - scene.cx, gy - scene.cy) < scene.radius * 1.02 ||
            Math.hypot(gx - meteorObject.x, gy - meteorObject.y) <
              meteorObject.r * 1.1
          )
            continue;
          put(
            Math.max(1, Math.round(q * (ASCII_RAMP.length - 2))),
            gx,
            gy,
            lerp(45, -90, 1 - q),
            90,
            q * 0.85 * this.alpha,
          );
        }
      });
    }

    for (const object of this.objects) {
      if (this.isHidden(object)) continue;

      // Meteoro na metade de trás da órbita: some atrás do disco
      const behind =
        object.orbit && object.free > 1400 && !isStatic
          ? this.homeOf(object, t, scene, frame.textBox, false)[2]
          : false;

      const cos = Math.cos(-object.angle);
      const sin = Math.sin(-object.angle);
      const cosWorld = Math.cos(object.angle);
      const sinWorld = Math.sin(object.angle);
      const e = 0.02;
      const reach = object.r * 1.25;
      const i0 = Math.floor((object.x - reach) / cw);
      const i1 = Math.ceil((object.x + reach) / cw);
      const j0 = Math.floor((object.y - reach) / ch);
      const j1 = Math.ceil((object.y + reach) / ch);

      const scene2d = (x: number, y: number) => {
        if (object.id === "astronaut") astronaut(x, y, t);
        else if (object.id === "satellite") satellite(x, y);
        else meteor(x, y, object.seed);
        return hit.d;
      };

      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const px = i * cw + cw / 2;
          const py = j * ch + ch / 2;
          if (behind && Math.hypot(px - scene.cx, py - scene.cy) < scene.radius)
            continue;

          const dx = (px - object.x) / object.s;
          const dy = (py - object.y) / object.s;
          const x = dx * cos - dy * sin;
          const y = dx * sin + dy * cos;
          const d = scene2d(x, y);
          if (d > 0) continue;
          const material = hit.material;

          // Normal: gradiente do SDF no plano + profundidade pelo bisel
          const gx = scene2d(x + e, y) - d;
          const gy = scene2d(x, y + e) - d;
          const nz = clamp(-d / 0.07);
          let nx = (gx / e) * (1 - nz);
          let ny = (gy / e) * (1 - nz);
          const length = Math.hypot(nx, ny, nz) || 1;
          nx /= length;
          ny /= length;
          const nzz = nz / length;
          // A normal volta para o mundo (o objeto pode estar girado)
          const wx = nx * cosWorld - ny * sinWorld;
          const wy = nx * sinWorld + ny * cosWorld;
          const diffuse = Math.max(0, wx * L.x + wy * L.y + nzz * L.z);
          const rim = Math.pow(1 - nzz, 2.5);

          // A fórmula do planeta, com base maior (objetos são finos)
          let bright = clamp(
            diffuse * 0.9 + 0.2 + rim * 0.4 * (0.6 + diffuse * 0.4),
          );
          let hue = hueBase + rim * 110 + dx * 12;
          let saturation = 70 + rim * 30;

          if (material === VISOR) {
            hue = 42;
            saturation = 90;
            bright = clamp(0.35 + Math.pow(diffuse, 6) * 0.9 + rim * 0.2);
          } else if (material === PANEL) {
            const cell =
              (Math.abs(Math.round(x * 4)) + Math.abs(Math.round(y * 3))) % 2;
            hue = hueBase - 15;
            bright = clamp(bright * (cell ? 0.85 : 1.1));
            if (Math.abs((x * 4) % 1) < 0.08) bright *= 0.6;
          } else if (material === BLINK) {
            // Acesa ~30% do tempo; no quadro parado, acesa
            const on = isStatic
              ? 1
              : Math.sin(t * 0.004 + object.size) > 0.6
                ? 1
                : 0.15;
            hue = 45;
            saturation = 95;
            bright = 0.3 + on * 0.7;
          } else if (material === ROCK) {
            const crater = noise3(x * 4 + object.seed, y * 4, 1.3);
            bright = clamp(bright * (0.7 + crater * 0.35));
            hue = hueBase + rim * 80 - 30;
          }

          let alpha = (0.25 + bright * 0.75) * this.alpha;
          if (object.overText) alpha *= 0.35;
          put(
            Math.max(1, Math.round(bright * (ASCII_RAMP.length - 1))),
            i * cw,
            j * ch,
            hue,
            saturation,
            alpha,
          );
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  /** [x, y, r, dá para pegar] × 3, para a página posicionar as áreas. */
  snapshot(isStatic: boolean): number[] {
    this.objects.forEach((object, index) => {
      const canGrab =
        !isStatic &&
        !this.isHidden(object) &&
        this.alpha >= 0.5 &&
        !(object.overText && !object.held);
      this.snapshotData[index * 4] = object.x;
      this.snapshotData[index * 4 + 1] = object.y;
      this.snapshotData[index * 4 + 2] = this.isHidden(object) ? 0 : object.r;
      this.snapshotData[index * 4 + 3] = canGrab ? 1 : 0;
    });
    return this.snapshotData;
  }
}

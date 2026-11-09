/**
 * Geometria e shaders do campo de partículas "magic dust" (puro, sem React).
 * Gera as posições-alvo (texto, toro, esfera, cubo) e o par de shaders do ponto.
 */

export type SequenceItem =
  | { type: "text"; text: string; offset?: [number, number, number] }
  | {
      type: "shape";
      shape: "torus" | "sphere" | "box";
      offset?: [number, number, number];
    };

export interface MagicDustProps {
  /** Sequência de textos e formas a percorrer em ciclo. */
  sequence?: SequenceItem[];
  /** Número de partículas no sistema. */
  particleCount?: number;
  /** Cor base das partículas em HEX. */
  particleColor?: string;
  /** Tamanho base das partículas. */
  particleSize?: number;
  /** Família de fonte do texto. */
  fontFamily?: string;
  /** Tempo que a forma fica visível antes de se desfazer, em segundos. */
  holdDuration?: number;
  /** Multiplicador da velocidade de construção/desconstrução. */
  animationSpeed?: number;
  /** Raio da nuvem dispersa quando as partículas estão totalmente desconstruídas. */
  scatterRadius?: number;
}

export const DEFAULT_SEQUENCE: SequenceItem[] = [
  { type: "text", text: "MAGIC", offset: [0, 0, 0] },
  { type: "shape", shape: "torus", offset: [0, 0, 0] },
  { type: "text", text: "DUST", offset: [0, 0, 0] },
  { type: "shape", shape: "sphere", offset: [0, 0, 0] },
  { type: "text", text: "UI FACTORY", offset: [0, 0, 0] },
  { type: "shape", shape: "box", offset: [0, 0, 0] },
];

export function getScatteredPositions(count: number, radius: number) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = Math.cbrt(Math.random()) * radius;

    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
  }
  return pos;
}

export function getTextPositions(
  text: string,
  count: number,
  size: number,
  fontFamily: string,
) {
  if (typeof window === "undefined") return new Float32Array(count * 3);

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return new Float32Array(count * 3);

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 1024, 1024);
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let fontSize = 220;
  ctx.font = `900 ${fontSize}px ${fontFamily}`;
  const textWidth = ctx.measureText(text).width;

  if (textWidth > 900) {
    fontSize = Math.floor(fontSize * (900 / textWidth));
    ctx.font = `900 ${fontSize}px ${fontFamily}`;
  }

  ctx.fillText(text, 512, 512);

  const imgData = ctx.getImageData(0, 0, 1024, 1024).data;
  const points = [];

  for (let i = 0; i < 1024 * 1024; i++) {
    const r = imgData[i * 4];
    if (r > 128) {
      const x = i % 1024;
      const y = Math.floor(i / 1024);
      points.push({ x: (x / 1024 - 0.5) * size, y: -(y / 1024 - 0.5) * size });
    }
  }

  const positions = new Float32Array(count * 3);
  if (points.length === 0) return positions;

  for (let i = 0; i < count; i++) {
    const p = points[Math.floor(Math.random() * points.length)];
    positions[i * 3] = p.x + (Math.random() - 0.5) * 0.15;
    positions[i * 3 + 1] = p.y + (Math.random() - 0.5) * 0.15;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
  }
  return positions;
}

export function getTorusPositions(count: number, scale: number) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    const radius = 2.5;
    const tube = 1.0;
    const x = (radius + tube * Math.cos(v)) * Math.cos(u);
    const y = (radius + tube * Math.cos(v)) * Math.sin(u);
    const z = tube * Math.sin(v);
    pos[i * 3] = x * scale + (Math.random() - 0.5) * 0.3;
    pos[i * 3 + 1] = y * scale + (Math.random() - 0.5) * 0.3;
    pos[i * 3 + 2] = z * scale + (Math.random() - 0.5) * 0.3;
  }
  return pos;
}

export function getSphereDestinations(count: number, radius: number) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    pos[i * 3] =
      radius * Math.sin(phi) * Math.cos(theta) + (Math.random() - 0.5) * 0.2;
    pos[i * 3 + 1] =
      radius * Math.sin(phi) * Math.sin(theta) + (Math.random() - 0.5) * 0.2;
    pos[i * 3 + 2] = radius * Math.cos(phi) + (Math.random() - 0.5) * 0.2;
  }
  return pos;
}

export function getBoxPositions(count: number, size: number) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const face = Math.floor(Math.random() * 6);
    let x = 0,
      y = 0,
      z = 0;
    const u = (Math.random() - 0.5) * size;
    const v = (Math.random() - 0.5) * size;
    const s = size / 2;
    if (face === 0) {
      x = s;
      y = u;
      z = v;
    } else if (face === 1) {
      x = -s;
      y = u;
      z = v;
    } else if (face === 2) {
      x = u;
      y = s;
      z = v;
    } else if (face === 3) {
      x = u;
      y = -s;
      z = v;
    } else if (face === 4) {
      x = u;
      y = v;
      z = s;
    } else {
      x = u;
      y = v;
      z = -s;
    }

    pos[i * 3] = x + (Math.random() - 0.5) * 0.2;
    pos[i * 3 + 1] = y + (Math.random() - 0.5) * 0.2;
    pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.2;
  }
  return pos;
}

export function applyOffset(
  dest: Float32Array,
  dx: number,
  dy: number,
  dz: number = 0,
) {
  const out = new Float32Array(dest.length);
  for (let i = 0; i < dest.length; i += 3) {
    out[i] = dest[i] + dx;
    out[i + 1] = dest[i + 1] + dy;
    out[i + 2] = dest[i + 2] + dz;
  }
  return out;
}

export function getOrderedDelays(targetPositions: Float32Array, count: number) {
  const delays = new Float32Array(count);
  let minX = Infinity;
  let maxX = -Infinity;

  for (let i = 0; i < count; i++) {
    const x = targetPositions[i * 3];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  }
  const range = maxX - minX === 0 ? 1 : maxX - minX;

  for (let i = 0; i < count; i++) {
    const x = targetPositions[i * 3];
    const normalizedX = (x - minX) / range;
    delays[i] = normalizedX * 0.7 + Math.random() * 0.3;
  }
  return delays;
}

export const vertexShader = `
attribute vec3 aTarget;
attribute float aDelay;
attribute float aSize;
uniform float uProgress;
uniform float uSize;
varying float vAlpha;

void main() {
    float p = clamp((uProgress - aDelay) * 3.0, 0.0, 1.0);

    float ease = p < 0.5 ? 4.0 * p * p * p : 1.0 - pow(-2.0 * p + 2.0, 3.0) / 2.0;

    vec3 finalPos = mix(position, aTarget, ease);

    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_PointSize = uSize * aSize * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    vAlpha = smoothstep(0.0, 0.2, p);
}
`;

export const fragmentShader = `
uniform vec3 uColor;
varying float vAlpha;

void main() {
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    float r = dot(cxy, cxy);
    if (r > 1.0) discard;

    float alpha = 1.0 - smoothstep(0.7, 1.0, r);
    gl_FragColor = vec4(uColor, alpha * vAlpha * 0.5);
}
`;

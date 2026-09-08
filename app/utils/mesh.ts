// Low-poly geometry generator. Deterministic from a seed (mulberry32), so the
// same seed always yields the same crystal — that's what lets the server's seed
// travel to the client via useState('meshSeed') and produce a matching mesh.
//
// Only MeshCanvas.client.vue consumes this; there is no server-rendered mesh.
// SSR / no-JS gets the flat CSS plane (`.mesh` in main.css) instead.
//
// Output is a packed vertex buffer for WebGL rather than facet objects: every
// vertex carries all three corners of its triangle (so the vertex shader can
// compute the facet normal itself, at any relief) plus its own corner index.
//
// Tuning dials live in ./mesh-constants.mjs, shared with the OG card generator.
import {MESH} from './mesh-constants.mjs'

export interface Mesh {
  W: number
  H: number
  /** Triangle count. */
  count: number
  /** count*3 vertices × FLOATS_PER_VERTEX: [x0,y0,z0, x1,y1,z1, x2,y2,z2, corner]. */
  data: Float32Array
}

export const FLOATS_PER_VERTEX = 10

function prng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function generateMesh(seed: number): Mesh {
  const rnd = prng(seed)
  const rand = (min: number, max: number) => min + rnd() * (max - min)

  const {
    PHI, COLS, ROWS, CELL, FU, FV, SIGMA, FLOOR, RELIEF_START, RELIEF_SPAN,
    AMP_SWELL, AMP_FOLD, AMP_JITTER, FOLD_U_FREQ, FOLD_U_PHASE, FOLD_V_FREQ, FOLD_V_PHASE,
  } = MESH

  const W = COLS * CELL, H = ROWS * CELL, J = CELL / (PHI * PHI)

  const relief = (u: number, v: number) => {
    const t = (u + (1 - v)) / 2
    const s = Math.min(1, Math.max(0, (t - RELIEF_START) / RELIEF_SPAN))
    const sm = s * s * (3 - 2 * s)
    return FLOOR + (1 - FLOOR) * sm
  }

  type Pt = {x: number; y: number; z: number}
  const pts: Pt[][] = []
  for (let r = 0; r <= ROWS; r++) {
    const row: Pt[] = []
    for (let c = 0; c <= COLS; c++) {
      const edge = r === 0 || c === 0 || r === ROWS || c === COLS
      const x = c * CELL + (edge ? 0 : rand(-J, J))
      const y = r * CELL + (edge ? 0 : rand(-J, J))
      const u = x / W, v = y / H, rel = relief(u, v)
      const swell = AMP_SWELL * Math.exp(-(((u - FU) ** 2) + ((v - FV) ** 2)) / (2 * SIGMA * SIGMA))
      const fold = AMP_FOLD * Math.sin(u * Math.PI * FOLD_U_FREQ + FOLD_U_PHASE) * Math.cos(v * Math.PI * FOLD_V_FREQ + FOLD_V_PHASE)
      row.push({x, y, z: swell + rel * fold + rel * rand(-AMP_JITTER, AMP_JITTER)})
    }
    pts.push(row)
  }

  const cross2 = (p: Pt, q: Pt, r: Pt) =>
    (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)

  const count = COLS * ROWS * 2
  const data = new Float32Array(count * 3 * FLOATS_PER_VERTEX)
  let o = 0
  const emit = (a: Pt, b: Pt, c: Pt) => {
    for (let k = 0; k < 3; k++) {
      data[o++] = a.x; data[o++] = a.y; data[o++] = a.z
      data[o++] = b.x; data[o++] = b.y; data[o++] = b.z
      data[o++] = c.x; data[o++] = c.y; data[o++] = c.z
      data[o++] = k
    }
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tl = pts[r][c], tr = pts[r][c + 1], bl = pts[r + 1][c], br = pts[r + 1][c + 1]
      const acOk = cross2(tl, br, tr) * cross2(tl, br, bl) < 0
      const bdOk = cross2(tr, bl, tl) * cross2(tr, bl, br) < 0
      const useAC = acOk && bdOk ? rnd() > 0.5 : acOk
      if (useAC) {emit(tl, tr, br); emit(tl, br, bl)}
      else {emit(tl, tr, bl); emit(tr, br, bl)}
    }
  }

  return {W, H, count, data}
}

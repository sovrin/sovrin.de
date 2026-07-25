// Shared low-poly geometry generator. Deterministic from a seed (mulberry32) so
// the server island and the client canvas produce the IDENTICAL crystal — the
// server bakes a static SVG (SSR / no-JS), the client relights the same facets.
export interface Facet {
  pts: number[] // [x1,y1, x2,y2, x3,y3] in geometry units
  cx: number
  cy: number
  nx: number
  ny: number
  nz: number
  dist: number // normalised distance of centroid from the focal point
}

export interface Mesh {
  W: number
  H: number
  facets: Facet[]
}

const PHI = 1.618

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

  const COLS = 44, ROWS = 28, CELL = 10
  const W = COLS * CELL, H = ROWS * CELL, J = CELL / (PHI * PHI)
  const FU = 0.74, FV = 0.3, SIGMA = 0.34, FLOOR = 0.12
  const AMP_SWELL = 11, AMP_FOLD = 5.5, AMP_JITTER = 4.5
  const HALF_DIAG = Math.hypot(0.5, 0.5)

  const relief = (u: number, v: number) => {
    const t = (u + (1 - v)) / 2
    const s = Math.min(1, Math.max(0, (t - 0.12) / 0.7))
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
      const fold = AMP_FOLD * Math.sin(u * Math.PI * 2.4 + 0.6) * Math.cos(v * Math.PI * 1.8 + 0.3)
      row.push({x, y, z: swell + rel * fold + rel * rand(-AMP_JITTER, AMP_JITTER)})
    }
    pts.push(row)
  }

  const cross2 = (p: Pt, q: Pt, r: Pt) =>
    (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)
  const r1 = (n: number) => Math.round(n * 10) / 10

  const facets: Facet[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tl = pts[r][c], tr = pts[r][c + 1], bl = pts[r + 1][c], br = pts[r + 1][c + 1]
      const acOk = cross2(tl, br, tr) * cross2(tl, br, bl) < 0
      const bdOk = cross2(tr, bl, tl) * cross2(tr, bl, br) < 0
      const useAC = acOk && bdOk ? rnd() > 0.5 : acOk
      const tris = useAC
        ? [[tl, tr, br], [tl, br, bl]]
        : [[tl, tr, bl], [tr, br, bl]]
      for (const [a, b, cc] of tris) {
        const ux = b.x - a.x, uy = b.y - a.y, uz = b.z - a.z
        const vx = cc.x - a.x, vy = cc.y - a.y, vz = cc.z - a.z
        let nx = uy * vz - uz * vy
        let ny = uz * vx - ux * vz
        let nz = ux * vy - uy * vx
        const nl = Math.hypot(nx, ny, nz) || 1
        nx /= nl; ny /= nl; nz /= nl
        if (nz < 0) {nx = -nx; ny = -ny; nz = -nz}
        const cx = (a.x + b.x + cc.x) / 3
        const cy = (a.y + b.y + cc.y) / 3
        const dist = Math.hypot((cx - FU * W) / W, (cy - FV * H) / H) / HALF_DIAG
        facets.push({
          pts: [r1(a.x), r1(a.y), r1(b.x), r1(b.y), r1(cc.x), r1(cc.y)],
          cx, cy, nx, ny, nz, dist,
        })
      }
    }
  }

  return {W, H, facets}
}

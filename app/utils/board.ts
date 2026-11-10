// How the Score's board is laid out and drawn on its canvas. A gutter on the
// left for the pitch names, a band over each line for the chord names; wide,
// the four bars run in one line, narrow they wrap into two lines of two, like
// a lead sheet, so the steps stay big enough to tap.
export interface BoardLayout {
  w: number
  h: number
  lines: number
  per: number
  cell: number
}

const gutter = 22
const band = 18
const gap = 14

export function boardLayout(w: number): BoardLayout {
  const lines = w < 700 ? 2 : 1, per = COLS / lines, cell = (w - gutter) / per
  return {w, lines, per, cell, h: lines * (band + ROWS * cell) + (lines - 1) * gap}
}

// Keeps the canvas as wide as it's laid out and as tall as the board needs,
// at the screen's pixel density, laying the board out again on every resize.
export function fitBoard(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, laid: (L: BoardLayout) => void) {
  // Only a new width lays it out again, a frame later: setting the height in
  // the observer itself would set the observer off again within the frame.
  let width = -1
  const resize = new ResizeObserver(() => requestAnimationFrame(() => {
    if (canvas.clientWidth === width) return
    width = canvas.clientWidth
    const L = boardLayout(width)
    canvas.style.blockSize = `${L.h}px`
    canvas.width = L.w * devicePixelRatio
    canvas.height = L.h * devicePixelRatio
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    laid(L)
  }))
  resize.observe(canvas)
  return resize
}

const lineTop = (L: BoardLayout, line: number) => line * (band + ROWS * L.cell + gap) + band
const at = (L: BoardLayout, x: number, y: number) => [gutter + (x % L.per) * L.cell, lineTop(L, Math.floor(x / L.per)) + y * L.cell] as const

// The cell under a point on the canvas, or null between lines and off the grid.
export function boardCell(L: BoardLayout, px: number, py: number) {
  const line = Math.floor(py / (band + ROWS * L.cell + gap)), col = Math.floor((px - gutter) / L.cell)
  const y = Math.floor((py - lineTop(L, line)) / L.cell)
  if (line < 0 || line >= L.lines || col < 0 || col >= L.per || y < 0 || y >= ROWS) return null
  return y * COLS + line * L.per + col
}

export interface BoardFrame {
  key: ScoreKey
  score: Uint8Array
  // how much of each automaton cell shows, easing in and out between bars
  seen: Float32Array
  flash: Float32Array
  step: number | null
  hover: number | null
  // notes someone else just put down, and how far (0 to 1) their ring has spread
  rings: {i: number, age: number}[]
  wall: string
  ink: string
}

export function drawBoard(ctx: CanvasRenderingContext2D, L: BoardLayout, f: BoardFrame) {
  const {cell} = L, s = cell - 2
  const fill = (alpha: number, color = f.wall) => {
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
  }
  const box = (cx: number, cy: number, size: number) => {
    ctx.beginPath()
    ctx.roundRect(cx - size / 2, cy - size / 2, size, size, Math.min(3, size / 2))
    ctx.fill()
  }
  // a bent note sits a quarter of a step off its row, toward its pitch
  const lift = (v: number) => -decodeAlt(v) * cell * 0.25
  ctx.clearRect(0, 0, L.w, L.h)
  ctx.textBaseline = 'middle'
  const bar = f.step === null ? -1 : Math.floor(f.step / BAR)
  for (let line = 0; line < L.lines; line++) {
    const top = lineTop(L, line)
    ctx.font = '500 9px "Geist Mono Variable", ui-monospace, monospace'
    fill(0.5)
    for (let y = 0; y < ROWS; y++) ctx.fillText(noteName(rowPitch(f.key, y)), 2, top + y * cell + cell / 2)
    for (let b = 0; b < L.per / BAR; b++) {
      const k = line * (L.per / BAR) + b, x = gutter + b * BAR * cell
      if (b > 0) {
        fill(0.16)
        ctx.fillRect(x - 0.5, top, 1, ROWS * cell)
      }
      ctx.font = '500 11px "Geist Mono Variable", ui-monospace, monospace'
      fill(k === bar ? 1 : 0.55)
      ctx.fillText(f.key.chords[k]!.name, x + 3, top - band / 2)
    }
  }
  // the playhead steps through a column at a time, the last two fading behind it
  if (f.step !== null) {
    for (const [back, alpha] of [[2, 0.03], [1, 0.06], [0, 0.13]] as const) {
      const [hx, hy] = at(L, (f.step - back + COLS) % COLS, 0)
      fill(alpha)
      ctx.beginPath()
      ctx.roundRect(hx, hy, cell, ROWS * cell, 3)
      ctx.fill()
    }
  }
  // the melody as a line through the score's notes, step by step
  ctx.strokeStyle = f.wall
  ctx.globalAlpha = 0.28
  ctx.lineWidth = 1.5
  ctx.lineJoin = 'round'
  for (let line = 0; line < L.lines; line++) {
    ctx.beginPath()
    let started = false
    for (let col = 0; col < L.per; col++) {
      const x = line * L.per + col
      for (let y = 0; y < ROWS; y++) {
        const v = f.score[y * COLS + x]!
        if (!v) continue
        const [x0, y0] = at(L, x, y), px = x0 + cell / 2, py = y0 + cell / 2 + lift(v)
        if (started) ctx.lineTo(px, py)
        else ctx.moveTo(px, py)
        started = true
      }
    }
    ctx.stroke()
  }
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const i = y * COLS + x, [x0, y0] = at(L, x, y), cx = x0 + cell / 2, cy = y0 + cell / 2, lit = f.flash[i]!, v = f.score[i]!
    if (v) {
      fill(i === f.hover ? 0.55 : 1)
      box(cx, cy + lift(v), s + lit * 3)
      // a bent note carries its direction: a small notch, up for sharp, down for flat
      if (decodeAlt(v)) {
        const d = decodeAlt(v), t = Math.max(2.5, s * 0.18), ny = cy + lift(v)
        fill(0.85, f.ink)
        ctx.beginPath()
        ctx.moveTo(cx - t, ny + d * t * 0.5)
        ctx.lineTo(cx + t, ny + d * t * 0.5)
        ctx.lineTo(cx, ny - d * t * 0.7)
        ctx.fill()
      }
    } else if (f.seen[i]! > 0.03) {
      fill((0.3 + 0.5 * lit) * f.seen[i]!)
      box(cx, cy, (s * 0.55 + lit * 3) * (0.5 + 0.5 * f.seen[i]!))
    } else {
      fill(x % 4 === 0 ? 0.12 : 0.06)
      box(cx, cy, 3)
    }
  }
  // someone else's new note: a ring spreading out from it and fading
  ctx.strokeStyle = f.wall
  ctx.lineWidth = 1.5
  for (const {i, age} of f.rings) {
    const [x0, y0] = at(L, i % COLS, Math.floor(i / COLS)), size = s * (1 + age * 2.2)
    ctx.globalAlpha = 0.85 * (1 - age) ** 1.5
    ctx.beginPath()
    ctx.roundRect(x0 + cell / 2 - size / 2, y0 + cell / 2 + lift(f.score[i]!) - size / 2, size, size, Math.min(6, size / 4))
    ctx.stroke()
  }
  // where a click would put a note: a ghost of it
  if (f.hover !== null && !f.score[f.hover]) {
    const [x0, y0] = at(L, f.hover % COLS, Math.floor(f.hover / COLS))
    ctx.strokeStyle = f.wall
    ctx.globalAlpha = 0.7
    ctx.beginPath()
    ctx.roundRect(x0 + 1.75, y0 + 1.75, s - 1.5, s - 1.5, 3)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

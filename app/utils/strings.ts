// What Strings draws: each string as a line of box-drawing characters, rebuilt
// every frame from the notes ringing on it.

// A strum across one string, `pos` characters along it (-1 is the nut, a dead note).
export type Note = {pos: number, at: number, vel: number}
export type Line = {text: string[], color: string[], nut: string, nutColor: string}

export const life = 2600

export const dim = (p: number) => `color-mix(in oklch, var(--ae-text-muted) ${p}%, transparent)`

// A string at rest: a solid line, faint.
export const strand = '─'
export const idle = dim(20)

// A ripple running far out from each note along the string and dying away:
// harder strums swing wider, the wound strings (lower) slower and longer.
export function wave(s: number, i: number, live: Note[], now: number): [string, string] {
  let d = 0
  for (const n of live) {
    if (n.pos < 0) continue
    const t = (now - n.at) / 1000
    const x = Math.abs(i - n.pos)
    if (x > t * 140) continue
    d += n.vel * Math.exp(-t / (0.7 + s * 0.12) - x / (35 + s * 8)) * Math.sin(t * (30 - s * 3) - x * 2 * Math.PI / (6 + s * 2))
  }
  const a = Math.abs(d)
  if (a <= 0.15) return [strand, idle]
  // Bent through five heights of horizontal line, taking more of the accent the harder it swings.
  const bent = d > 0.6 ? '⎺' : d > 0.25 ? '⎻' : d < -0.6 ? '⎽' : d < -0.25 ? '⎼' : strand
  return [bent, `color-mix(in oklch, var(--ae-accent) ${Math.round(Math.min(1, a) * 85)}%, ${dim(30)})`]
}

// A dead note crosses out the nut (│ → ×), in the accent fading with `left`, the
// share of the note's life still to go. Anywhere else, the ripple is the mark.
export function notate(line: Line, n: Note, left: number, still: boolean) {
  if (n.pos >= 0) return
  line.nut = '×'
  line.nutColor = `color-mix(in oklch, var(--ae-accent) ${still ? 70 : Math.round(left * 0.7)}%, ${dim(30)})`
}

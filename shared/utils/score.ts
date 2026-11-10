// The footer's Score, the parts the server and the page share: the grid and
// the clock, the day's scale and chords, the tune it starts with, the
// automaton's rules, and which notes sound on a step.

// Four bars of sixteenths across, ten pitches up. A step is a sixteenth at
// 100 BPM; step s sounds at s * STEP ms since the epoch, everywhere.
export const COLS = 64
export const ROWS = 10
export const BAR = 16
export const STEP = 60000 / 100 / 4

// Each visitor may make EDITS edits in any EDIT_SPAN ms; a drag is one edit.
export const EDITS = 5
export const EDIT_SPAN = 5000

export const stepAt = (t: number) => Math.floor(t / STEP)
export const dayAt = (t: number) => Math.floor(t / 864e5)

// A score note: its row, and a half-step up (1) or down (-1) if it's bent.
export type ScoreAlt = -1 | 0 | 1
export interface ScoreNote {
  i: number
  alt: ScoreAlt
}

export interface ScoreChord {
  name: string
  root: number
  tones: number[]
}

export interface ScoreKey {
  name: string
  tonic: number
  steps: number[]
  chords: ScoreChord[]
}

const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
export const pitchClass = (m: number) => ((m % 12) + 12) % 12
export const noteName = (m: number) => NAMES[pitchClass(m)]!

type Quality = 'M' | 'm' | 'sus' | 'aug' | 'dim'
const QUALITY: Record<Quality, [number[], string]> = {
  M: [[0, 4, 7], ''],
  m: [[0, 3, 7], 'm'],
  sus: [[0, 5, 7], 'sus4'],
  aug: [[0, 4, 8], '+'],
  dim: [[0, 3, 6], '°'],
}

// Every scale with a four-bar progression that suits it: each chord is
// [semitones above the tonic, quality].
const SCALES: [string, number[], [number, Quality][]][] = [
  ['minor pentatonic', [0, 3, 5, 7, 10], [[0, 'm'], [8, 'M'], [3, 'M'], [10, 'M']]],
  ['major pentatonic', [0, 2, 4, 7, 9], [[0, 'M'], [9, 'm'], [5, 'M'], [7, 'M']]],
  ['major', [0, 2, 4, 5, 7, 9, 11], [[0, 'M'], [7, 'M'], [9, 'm'], [5, 'M']]],
  ['natural minor', [0, 2, 3, 5, 7, 8, 10], [[0, 'm'], [5, 'm'], [10, 'M'], [3, 'M']]],
  ['dorian', [0, 2, 3, 5, 7, 9, 10], [[0, 'm'], [5, 'M'], [0, 'm'], [10, 'M']]],
  ['phrygian', [0, 1, 3, 5, 7, 8, 10], [[0, 'm'], [1, 'M'], [3, 'M'], [1, 'M']]],
  ['lydian', [0, 2, 4, 6, 7, 9, 11], [[0, 'M'], [2, 'M'], [7, 'M'], [0, 'M']]],
  ['mixolydian', [0, 2, 4, 5, 7, 9, 10], [[0, 'M'], [10, 'M'], [5, 'M'], [0, 'M']]],
  ['locrian', [0, 1, 3, 5, 6, 8, 10], [[0, 'dim'], [1, 'M'], [10, 'm'], [0, 'dim']]],
  ['harmonic minor', [0, 2, 3, 5, 7, 8, 11], [[0, 'm'], [5, 'm'], [7, 'M'], [0, 'm']]],
  ['melodic minor', [0, 2, 3, 5, 7, 9, 11], [[0, 'm'], [5, 'M'], [7, 'M'], [0, 'm']]],
  ['phrygian dominant', [0, 1, 4, 5, 7, 8, 10], [[0, 'M'], [1, 'M'], [10, 'm'], [0, 'M']]],
  ['lydian dominant', [0, 2, 4, 6, 7, 9, 10], [[0, 'M'], [2, 'M'], [10, 'M'], [0, 'M']]],
  ['hungarian minor', [0, 2, 3, 6, 7, 8, 11], [[0, 'm'], [8, 'M'], [7, 'M'], [0, 'm']]],
  ['double harmonic', [0, 1, 4, 5, 7, 8, 11], [[0, 'M'], [1, 'M'], [7, 'sus'], [0, 'M']]],
  ['blues', [0, 3, 5, 6, 7, 10], [[0, 'm'], [5, 'm'], [0, 'm'], [7, 'M']]],
  ['major blues', [0, 2, 3, 4, 7, 9], [[0, 'M'], [5, 'M'], [0, 'M'], [7, 'M']]],
  ['hirajoshi', [0, 2, 3, 7, 8], [[0, 'm'], [8, 'M'], [0, 'm'], [7, 'sus']]],
  ['in-sen', [0, 1, 5, 7, 10], [[0, 'sus'], [1, 'M'], [10, 'm'], [0, 'sus']]],
  ['yo', [0, 2, 5, 7, 9], [[0, 'sus'], [5, 'M'], [9, 'm'], [0, 'sus']]],
  ['egyptian', [0, 2, 5, 7, 10], [[0, 'sus'], [10, 'M'], [5, 'sus'], [0, 'sus']]],
  ['pelog', [0, 1, 3, 7, 8], [[0, 'm'], [1, 'M'], [8, 'M'], [0, 'm']]],
  ['whole tone', [0, 2, 4, 6, 8, 10], [[0, 'aug'], [2, 'aug'], [4, 'aug'], [2, 'aug']]],
]

// A scale by name, dashes for spaces ('harmonic-minor'), or a tonic spelt
// with a sharp or a flat ('F#', 'Bb'); null when there's no such thing.
const slug = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '-')
const scaleNamed = (name?: string) => {
  const i = SCALES.findIndex(([n]) => slug(n) === slug(name ?? ''))
  return i < 0 ? null : i
}
const SPELLINGS = [...NAMES, 'Db', 'D#', 'E#', 'Gb', 'G#', 'A#', 'Cb', 'B#']
const SPELT = [...NAMES.keys(), 1, 3, 5, 6, 8, 10, 11, 0]
const tonicNamed = (name?: string) => {
  const i = SPELLINGS.findIndex((n) => n.toLowerCase() === name?.trim().toLowerCase())
  return i < 0 ? null : SPELT[i]!
}

// One a day: day n plays scale n mod 23, and since 23 and 12 share no factor
// the tonic walks round the circle of fifths every 23 days, so every scale
// meets every tonic once in 276 days. `pick` overrides either by name, for
// one page's listening (?scale=dorian&tonic=D); the shared score stays as it is.
export function keyOf(day: number, pick: {scale?: string, tonic?: string} = {}): ScoreKey {
  const n = SCALES.length * 12, k = ((day % n) + n) % n
  const [name, steps, prog] = SCALES[scaleNamed(pick.scale) ?? k % SCALES.length]!
  const tonic = tonicNamed(pick.tonic) ?? (Math.floor(k / SCALES.length) * 7) % 12
  return {
    name: `${NAMES[tonic]} ${name}`,
    tonic: 48 + tonic,
    steps,
    chords: prog.map(([off, q]) => {
      const root = (tonic + off) % 12
      return {name: NAMES[root] + QUALITY[q][1], root, tones: QUALITY[q][0].map((d) => (root + d) % 12)}
    }),
  }
}

// The pitch of a row in the day's scale, low at the bottom.
export const rowPitch = (key: ScoreKey, row: number) => {
  const k = ROWS - 1 - row
  return key.tonic + 12 * Math.floor(k / key.steps.length) + key.steps[k % key.steps.length]!
}

// The tune it starts with: the opening of Ode to Joy (Beethoven, 1824), as
// it stands in D major, F# F# G A | A G F# E | D D E F# | F#. E E, written as
// [step, scale degree above the low tonic]. So the board always opens on this
// shape: exact on a major day, the same contour read in any other scale.
const TUNE = [
  [0, 2], [4, 2], [8, 3], [12, 4],
  [16, 4], [20, 3], [24, 2], [28, 1],
  [32, 0], [36, 0], [40, 1], [44, 2],
  [48, 2], [54, 1], [56, 1],
]
export const tune = (): ScoreNote[] => TUNE.map(([x, degree]) => ({i: (ROWS - 1 - degree!) * COLS + x!, alt: 0}))

// The automaton: Conway's rules on a torus, stepped once a bar. Score notes
// count as live neighbours that never die, so they bend what passes them,
// but it only ever writes its own layer. Left alone it settles at about a
// quarter of the board, so it's kept sparse: a cell retires after LIFESPAN
// bars, and new ones are born only while it's under CAP: those near the
// melody first, so it answers the tune, the rest in random order. Its
// chances come from a generator seeded with the bar, so the same bar makes
// the same choices.
//
// A melody alone, one note a step, almost never gives a cell the three
// neighbours a birth needs, so a new note also sprouts a small form beside it
// (sprout): measured over 300 bars, nine new notes in ten get an answer
// within two bars, against six without.
const LIFESPAN = 8
const CAP = 48
const FLOOR = 24

const seeded = (n: number) => () => {
  n = (n + 0x6d2b79f5) | 0
  let t = Math.imul(n ^ (n >>> 15), 1 | n)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export function evolve(life: Uint8Array, age: Uint8Array, score: Uint8Array, bar: number) {
  const random = seeded(bar)
  const next = new Uint8Array(COLS * ROWS), older = new Uint8Array(COLS * ROWS), births: number[] = []
  let pop = 0
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    let n = 0
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const j = ((y + dy + ROWS) % ROWS) * COLS + (x + dx + COLS) % COLS
      if (dx || dy) n += life[j]! | (score[j] ? 1 : 0)
    }
    const i = y * COLS + x
    if (score[i]) continue
    if (life[i] && (n === 2 || n === 3) && age[i]! + 1 < LIFESPAN) {
      next[i] = 1
      older[i] = age[i]! + 1
      pop++
    } else if (!life[i] && n === 3) births.push(i)
  }
  for (let k = births.length - 1; k > 0; k--) {
    const j = Math.floor(random() * (k + 1));
    [births[k], births[j]] = [births[j]!, births[k]!]
  }
  const nearMelody = (i: number) => {
    const x = i % COLS, y = Math.floor(i / COLS)
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      if (score[((y + dy + ROWS) % ROWS) * COLS + (x + dx + COLS) % COLS]) return true
    }
    return false
  }
  births.sort((a, b) => Number(nearMelody(b)) - Number(nearMelody(a)))
  for (const i of births) if (pop < CAP) {
    next[i] = 1
    pop++
  }
  // Never thin for long: below FLOOR it sprouts a form every bar, beside a
  // note (so it stays with the melody), or on an empty board an r-pentomino,
  // which bursts, anywhere.
  if (pop < FLOOR) {
    const notes = [...score.keys()].filter((i) => score[i])
    if (notes.length) sprout(next, score, notes[Math.floor(random() * notes.length)]!)
    else sprout(next, score, Math.floor(random() * ROWS) * COLS + Math.floor(random() * COLS), 2)
  }
  return {life: next, age: older}
}

// How hard a step is played: downbeats strongest, then beats, then eighths,
// the sixteenths between soft.
export const accent = (step: number) => step % BAR === 0 ? 1 : step % 4 === 0 ? 0.82 : step % 2 === 0 ? 0.66 : 0.52

// The forms a new note sets going just right of it, picked by where it lands:
// a glider heading down and right, one heading up and right, an r-pentomino
// (a burst), a blinker. Written into the automaton's layer, never the score.
const SPROUTS = [
  [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]],
  [[1, 2], [2, 1], [0, 0], [1, 0], [2, 0]],
  [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]],
  [[0, 1], [1, 1], [2, 1]],
]
export function sprout(life: Uint8Array, score: Uint8Array, i: number, form?: number) {
  const x = i % COLS, y = Math.floor(i / COLS)
  for (const [dx, dy] of SPROUTS[form ?? (x + y) % SPROUTS.length]!) {
    const j = ((y - 1 + dy! + ROWS) % ROWS) * COLS + (x + 1 + dx!) % COLS
    if (!score[j]) life[j] = 1
  }
}

// What sounds on a step. The score plays as written (a bent note a half-step
// off its row); the automaton's notes move to the bar's chord, step out of the
// melody's way (no unison, no semitone against it), drop into the octave
// under it, and at most two sound.
export function voicing(key: ScoreKey, score: Uint8Array, life: Uint8Array, step: number) {
  const bar = Math.floor(step / BAR), {tones, root} = key.chords[bar]!
  let melody: number | null = null
  for (let y = 0; y < ROWS; y++) {
    const v = score[y * COLS + step]!
    if (v) melody = rowPitch(key, y) + decodeAlt(v)
  }
  const clash = (m: number) => melody !== null && [0, 1, 11].includes(pitchClass(m - melody))
  const near = (note: number) => {
    for (let d = 0; d < 7; d++) for (const m of [note - d, note + d]) if (tones.includes(pitchClass(m))) return m
    return note
  }
  const clear = (note: number) => {
    for (let m = note; m > note - 12; m--) if (tones.includes(pitchClass(m)) && !clash(m)) return m
    return null
  }
  const fold = (m: number) => {
    while (m >= key.tonic) m -= 12
    while (m < key.tonic - 12) m += 12
    return m
  }
  const set = new Set<number>()
  for (let y = 0; y < ROWS; y++) {
    if (!life[y * COLS + step]) continue
    const m = clear(near(rowPitch(key, y)))
    if (m !== null) set.add(fold(m))
  }
  const centre = melody ?? key.tonic
  const auto = [...set].sort((a, b) => Math.abs(a - centre) - Math.abs(b - centre)).slice(0, 2)
  return {melody, auto, bass: step % BAR === 0 ? 33 + pitchClass(root - 9) : null}
}

// How a score note is kept in the grid: 1 natural, 2 a half-step up, 3 down.
export const encodeAlt = (alt: ScoreAlt) => alt === 1 ? 2 : alt === -1 ? 3 : 1
export const decodeAlt = (v: number): ScoreAlt => v === 2 ? 1 : v === 3 ? -1 : 0

<script setup lang="ts">
// A long, low strip of six box-drawn strings in the footer, a gimmick you
// strum silently by moving across it: each string the pointer crosses ripples
// out in ASCII from where it crossed; crossing over the nut is a dead note.
// Without JS it stays static; the markup matches on server and client, and
// frames write characters straight into it (utils/strings.ts says what).
const strings = 6

// As many characters as the footer has room for, once it's measured.
const width = ref(36)

const notes: Note[][] = Array.from({length: strings}, () => [])
const chars: HTMLElement[][] = Array.from({length: strings}, () => [])
const nuts: HTMLElement[] = []
const rows: HTMLElement[] = []
const neck = ref<HTMLElement>()
let lastY: number | null = null
let lastT = 0
let frame = 0
let still = false
let resize: ResizeObserver | undefined
let wandering: ReturnType<typeof setTimeout> | undefined

function fit() {
  const ch = chars[0]![0]!.getBoundingClientRect().width
  width.value = Math.max(12, Math.floor(neck.value!.clientWidth / ch) - 1)
}

// What the strings play to themselves now and then, as plucks: which string,
// how far along from where the hand is (characters), when (in steps), how hard.
type Pluck = {s: number, dx: number, step: number, vel: number}

// A downstroke sweeps all six from the low E up, landing hard; an upstroke is
// lighter and catches only the top four, high e first. A rhythm is a step per
// character: D down, U up, - a rest.
const stroke = (up: boolean, step: number): Pluck[] => (up ? [0, 1, 2, 3] : [5, 4, 3, 2, 1, 0])
  .map((s, k) => ({s, dx: 0, step: step + k * 0.08, vel: up ? 0.55 : 0.85}))
const strum = (rhythm: string) => [...rhythm].flatMap((c, step) => c === '-' ? [] : stroke(c === 'U', step))

// Single notes, a string a step: climbing from the low E, descending from the
// high e, or climbing while walking along the strings, a diagonal.
const low = [5, 4, 3, 2, 1, 0]
const pick = (order: number[], walk = 0) => order.map((s, step) => ({s, dx: step * walk, step, vel: 0.7}))

const patterns: Pluck[][] = [
  ...['D', 'DU', 'D-DU', 'DDUUDU', 'D-DU-UDU'].map(strum),
  pick(low),
  pick([...low].reverse()),
  pick(low, 14),
]

// Slowly, somewhere along the strings, a little different in pace and force
// each time. Not while a pointer is on them, not in a background tab, and never
// with reduced motion.
function wander() {
  wandering = setTimeout(wander, 10000 + Math.random() * 14000)
  if (document.hidden || lastY !== null) return
  const now = performance.now()
  const pattern = patterns[Math.floor(Math.random() * patterns.length)]!
  const step = 450 + Math.random() * 200
  const from = Math.floor(Math.random() * Math.max(1, width.value - Math.max(...pattern.map((p) => p.dx))))
  for (const p of pattern) {
    notes[p.s]!.push({pos: Math.min(width.value - 1, from + p.dx), at: now + p.step * step, vel: p.vel * (0.85 + Math.random() * 0.3)})
  }
  kick()
}

onMounted(() => {
  still = matchMedia('(prefers-reduced-motion: reduce)').matches
  resize = new ResizeObserver(fit)
  resize.observe(neck.value!)
  if (!still) wandering = setTimeout(wander, 3000 + Math.random() * 5000)
})

function draw() {
  frame = 0
  const now = performance.now()
  let busy = false
  notes.forEach((_, s) => {
    const live = notes[s] = notes[s]!.filter((n) => now - n.at < life)
    busy ||= live.length > 0
    const line: Line = {text: [], color: [], nut: '│', nutColor: ''}
    for (let i = 0; i < width.value; i++) {
      [line.text[i], line.color[i]] = still ? [strand, idle] : wave(s, i, live, now)
    }
    for (const n of live) notate(line, n, Math.round(100 * (1 - (now - n.at) / life)), still)
    nuts[s]!.textContent = line.nut
    nuts[s]!.style.color = line.nutColor
    chars[s]!.slice(0, width.value).forEach((el, i) => {
      if (el.textContent !== line.text[i]) el.textContent = line.text[i]!
      el.style.color = line.color[i]!
    })
  })
  if (busy) frame = requestAnimationFrame(draw)
}

const kick = () => {
  frame ||= requestAnimationFrame(draw)
}

const middle = (s: number) => {
  const r = rows[s]!.getBoundingClientRect()
  return r.top + r.height / 2
}

// The character under x along a string; -1 is the nut (a dead note).
function posAt(s: number, x: number) {
  const first = chars[s]![0]!.getBoundingClientRect().left
  if (x < first) return -1
  const last = chars[s]![width.value - 1]!.getBoundingClientRect().right
  return Math.min(width.value - 1, Math.floor((x - first) / (last - first) * width.value))
}

// Every string the pointer crosses is plucked where it crossed, harder the faster it went.
function move(e: PointerEvent) {
  const now = performance.now()
  if (lastY !== null) {
    const from = lastY
    const vel = Math.min(1.4, 0.35 + Math.abs(e.clientY - from) / Math.max(1, now - lastT) * 0.5)
    notes.forEach((_, s) => {
      const m = middle(s)
      if ((from - m) * (e.clientY - m) < 0) notes[s]!.push({pos: posAt(s, e.clientX), at: now, vel})
    })
  }
  lastY = e.clientY
  lastT = now
  kick()
}

function leave() {
  lastY = null
  kick()
}

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  clearTimeout(wandering)
  resize?.disconnect()
})
</script>

<template>
  <pre ref="neck" class="neck" aria-hidden="true" @pointermove="move" @pointerleave="leave"><span v-for="s in strings" :key="s" :ref="(el) => { if (el) rows[s - 1] = el as HTMLElement }" class="line"><span :ref="(el) => { if (el) nuts[s - 1] = el as HTMLElement }" class="nut">│</span><span v-for="i in width" :key="i" :ref="(el) => { if (el) chars[s - 1]![i - 1] = el as HTMLElement }" :style="{color: idle}">─</span></span></pre>
</template>

<style scoped>
.neck {
  flex: 1;
  min-inline-size: 0;
  /* Takes the width the footer leaves it; its own long lines mustn't widen the column. */
  contain: inline-size;
  margin: 0;
  padding: 0;
  background: none;
  /* The system's mono, not Geist's Latin subset: it has the box-drawing and scan-line glyphs. */
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: var(--ae-text-xs);
  /* Low enough to sit in the footer line: the strings nearly touch. */
  line-height: 0.8;
  color: var(--ae-text-muted);
  user-select: none;
  touch-action: pan-y;
  overflow: hidden;
}

.line {
  display: block;
}

.nut {
  color: color-mix(in oklch, var(--ae-text-muted) 70%, transparent);
}
</style>

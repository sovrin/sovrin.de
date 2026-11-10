<script setup lang="ts">
import type {ScoreState} from '~~/server/utils/score'

// The footer's Score: one melody everyone writes together, a Game of Life
// improvising around it. The server keeps score and time, so every page hears
// the same thing; sound and mix are each visitor's own. No JS: a still picture.
const {data} = await useFetch<ScoreState>('/api/score', {key: 'score'})

const SWING = 0.16

const live = ref(false)
const playing = ref(false)
// The guide over the board, brought back from the deck.
const help = ref(false)
const sound = shallowRef<Sound>()
const mix = reactive<Mix>({vol: 0.8, bal: 0.5, rev: 0.4, bass: true})
// ?scale=dorian&tonic=D plays this page in another scale than the day's.
const query = useRoute().query
const pick = {scale: String([query.scale].flat()[0] ?? ''), tonic: String([query.tonic].flat()[0] ?? '')}
const key = shallowRef(keyOf(dayAt(data.value?.now ?? 0), pick))

const score = new Uint8Array(COLS * ROWS)
const flash = new Float32Array(COLS * ROWS)
const seen = new Float32Array(COLS * ROWS)
// The automaton's generations by bar: the server sends each a moment before it plays.
let lives: {bar: number, life: Uint8Array}[] = []
// How far this page's clock is behind the server's.
let offset = 0
const now = () => Date.now() + offset
const lifeFor = (bar: number) => (lives.filter((l) => l.bar <= bar).at(-1) ?? lives[0])?.life ?? new Uint8Array(COLS * ROWS)

// Notes someone else just put down ring out from where they landed (not with reduced motion).
let rings: {i: number, at: number}[] = [], still = false

function take(state: ScoreState, live = false) {
  if (live) offset = state.now - Date.now()
  const before = score.slice()
  score.fill(0)
  for (const {i, alt} of state.notes) score[i] = encodeAlt(alt)
  // Yours are already on the board, so only someone else's show as new: a
  // ring and a flash, and if you're listening, its pitch, softly.
  if (live) for (const {i, alt} of state.notes.filter(({i}) => before[i] !== score[i])) {
    flash[i] = 1
    if (!still) rings.push({i, at: performance.now()})
    if (playing.value) sound.value?.pluck(rowPitch(key.value, Math.floor(i / COLS)) + alt, 0.4, {ring: 0.8})
  }
  const life = new Uint8Array(COLS * ROWS)
  for (const i of state.life) life[i] = 1
  lives = [...lives.filter((l) => l.bar < state.bar), {bar: state.bar, life}].slice(-2)
}
if (data.value) take(data.value)

// Step s (sixteenths since the epoch, server clock) sounds on every page at
// once; `ahead` is how far off that is, in seconds.
function tick(s: number, ahead: number) {
  const step = s % COLS, life = lifeFor(Math.floor(s / BAR))
  if (dayAt(s * STEP) !== dayAt((s - 1) * STEP)) key.value = keyOf(dayAt(s * STEP), pick)
  if (!playing.value) return
  const at = ahead + (s % 2 ? SWING * STEP / 1000 : 0), vel = accent(step)
  const {melody, auto, bass} = voicing(key.value, score, life, step)
  const pluck = sound.value!.pluck
  if (bass !== null) pluck(bass, 0.28, {ring: 1.8, at: ahead, bus: 'bass'})
  if (melody !== null) pluck(melody, vel, {at})
  for (const m of auto) pluck(m, vel * 0.7, {ring: 0.6, at, bus: 'auto', pan: Math.max(-0.6, Math.min(0.6, (m - key.value.tonic + 6) / 10))})
  const lit = [...Array(ROWS).keys()].map((y) => y * COLS + step).filter((i) => score[i] || life[i])
  setTimeout(() => lit.forEach((i) => { flash[i] = 1 }), at * 1000)
}

// The first play is the guide's listen click, the gesture browsers want before any
// sound. Pause stops the piece, not the sound: notes you place still play.
function play(on: boolean) {
  sound.value ??= createSound()
  sound.value.mix(mix)
  void sound.value.audio.resume()
  playing.value = on
}

// Edits left before the server says no: it reports with every answer when
// each used one frees up; out of edits, the board refuses and nudges the counter.
const busy = ref<number[]>([])
const clock = ref(0)
const left = computed(() => EDITS - busy.value.filter((t) => t > clock.value).length)
const wait = computed(() => Math.ceil(Math.max(0, (busy.value.find((t) => t > clock.value) ?? 0) - clock.value) / 1000))
const nudge = ref(0)

// Edits show at once and go to the server as one batch per gesture; its
// answer, or the live stream, settles them.
async function send(edits: {i: number, alt: ScoreAlt | null}[]) {
  if (!edits.length) return
  const res = await $fetch.raw<ScoreState>('/api/score', {method: 'POST', body: {edits}, ignoreResponseError: true}).catch(() => null)
  const reported = res?.headers.get('x-edits-busy')
  if (reported != null) busy.value = reported ? reported.split(',').map((ms) => Date.now() + Number(ms)) : []
  clock.value = Date.now()
  if (res?.ok && res._data) return take(res._data)
  if (res?.status === 429) nudge.value++
  take(await $fetch<ScoreState>('/api/score'))
}
function put(i: number, alt: ScoreAlt | null) {
  if (alt !== null) for (let y = 0; y < ROWS; y++) score[y * COLS + i % COLS] = 0
  score[i] = alt === null ? 0 : encodeAlt(alt)
  flash[i] = 1
  if (alt !== null) sound.value?.pluck(rowPitch(key.value, Math.floor(i / COLS)) + alt, 0.9)
}

const board = ref<HTMLElement>()
const canvas = ref<HTMLCanvasElement>()
let L = boardLayout(1000)
const hover = ref<number | null>(null)
// Click an empty step to add a note, drag to draw a line of them. Press a
// note and drag it up or down to bend it a half-step; just click it to take it out.
let gesture: {kind: 'draw', edits: Map<number, ScoreAlt>} | {kind: 'bend', i: number, y: number, alt: ScoreAlt, moved: boolean} | null = null
const cellOf = (e: PointerEvent) => {
  const r = canvas.value!.getBoundingClientRect()
  return boardCell(L, e.clientX - r.left, e.clientY - r.top)
}
function start(i: number, y: number, pointer?: number) {
  if (!left.value) return nudge.value++
  if (pointer !== undefined) canvas.value!.setPointerCapture(pointer)
  if (score[i]) gesture = {kind: 'bend', i, y, alt: decodeAlt(score[i]!), moved: false}
  else {
    gesture = {kind: 'draw', edits: new Map([[i, 0]])}
    put(i, 0)
  }
}
// A finger on the board may only be scrolling past: a note goes down on a
// tap, a sideways drag or a short hold, and a scroll leaves the score alone.
let pending: {i: number, x: number, y: number, hold: ReturnType<typeof setTimeout>} | null = null
const settle = () => {
  const p = pending
  if (p) clearTimeout(p.hold)
  pending = null
  return p
}
function down(e: PointerEvent) {
  const i = cellOf(e)
  if (i === null) return
  if (e.pointerType === 'mouse') return start(i, e.clientY, e.pointerId)
  const {pointerId} = e
  pending = {i, x: e.clientX, y: e.clientY, hold: setTimeout(() => {
    const p = settle()
    if (p) start(p.i, p.y, pointerId)
  }, 250)}
}
let previewed = 0
function move(e: PointerEvent) {
  if (pending) {
    const dx = Math.abs(e.clientX - pending.x), dy = Math.abs(e.clientY - pending.y)
    if (dx > 6 && dx > dy) {
      const p = settle()!
      start(p.i, p.y, e.pointerId)
    } else if (dy > 6) settle()
    return
  }
  const g = gesture
  if (g?.kind === 'draw') {
    const i = cellOf(e)
    if (i === null || score[i] || g.edits.size >= BAR) return
    for (const j of g.edits.keys()) if (j % COLS === i % COLS) g.edits.delete(j)
    g.edits.set(i, 0)
    put(i, 0)
  } else if (g?.kind === 'bend') {
    const dy = g.y - e.clientY, alt: ScoreAlt = dy > L.cell * 0.35 ? 1 : dy < -L.cell * 0.35 ? -1 : 0
    g.moved ||= Math.abs(dy) > 4
    if (alt !== decodeAlt(score[g.i]!)) put(g.i, alt)
  } else if (e.pointerType === 'mouse') {
    const i = cellOf(e)
    // hovering an empty step plays its pitch, quietly, at most every 90 ms
    if (i !== hover.value && i !== null && !score[i] && performance.now() - previewed > 90) {
      sound.value?.pluck(rowPitch(key.value, Math.floor(i / COLS)), 0.25, {ring: 0.5})
      previewed = performance.now()
    }
    hover.value = i
  }
}
function up() {
  const p = settle()
  if (p) start(p.i, p.y)
  const g = gesture
  gesture = null
  if (g?.kind === 'draw') void send([...g.edits].map(([i, alt]) => ({i, alt})))
  else if (g?.kind === 'bend') {
    const alt = g.moved ? decodeAlt(score[g.i]!) : null
    if (!g.moved) put(g.i, null)
    if (alt !== g.alt) void send([{i: g.i, alt}])
  }
}
// The page took the touch over for a scroll: nothing was meant.
function cancel() {
  settle()
  up()
}

// The keys play it too: the arrows move a cursor over the steps, Enter or
// Space puts a note there or takes it out, Shift with up or down bends it.
const said = ref('')
const accidental = (alt: ScoreAlt) => alt === 1 ? ', sharp' : alt === -1 ? ', flat' : ''
const describe = (i: number) => `step ${i % COLS + 1}, ${noteName(rowPitch(key.value, Math.floor(i / COLS)))}`
function press(e: KeyboardEvent) {
  const i = hover.value ?? 4 * COLS, x = i % COLS, y = Math.floor(i / COLS)
  const step = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[e.key]
  if (step && !(e.shiftKey && step[1])) {
    const to = Math.min(ROWS - 1, Math.max(0, y + step[1]!)) * COLS + (x + step[0]! + COLS) % COLS
    hover.value = to
    said.value = describe(to) + (score[to] ? `, a note${accidental(decodeAlt(score[to]!))}` : '')
  } else if (e.key === 'Enter' || e.key === ' ') {
    if (!left.value) {
      nudge.value++
      said.value = `out of edits, next in ${wait.value}s`
    } else {
      const alt = score[i] ? null : 0
      put(i, alt)
      void send([{i, alt}])
      said.value = `${describe(i)}, ${alt === null ? 'taken out' : 'added'}`
    }
  } else if (step && score[i]) {
    const alt = Math.max(-1, Math.min(1, decodeAlt(score[i]!) - step[1]!)) as ScoreAlt
    if (alt === decodeAlt(score[i]!)) return e.preventDefault()
    if (!left.value) return nudge.value++
    put(i, alt)
    void send([{i, alt}])
    said.value = `${describe(i)}${accidental(alt) || ', natural'}`
  } else return
  e.preventDefault()
}
// Only a keyboard visit puts the cursor down; a click or a tap has its own.
function focus() {
  if (hover.value === null && canvas.value?.matches(':focus-visible')) hover.value = 4 * COLS
}
// Out of the guide, straight to the board.
async function go() {
  if (sound.value) help.value = false
  else play(true)
  await nextTick()
  canvas.value?.focus({preventScroll: true})
}

let stream: EventSource | undefined, timer: ReturnType<typeof setInterval> | undefined, frame = 0, resize: ResizeObserver | undefined
onMounted(async () => {
  try { Object.assign(mix, JSON.parse(localStorage.getItem('score-mix') ?? '{}')) } catch {}
  live.value = true
  still = matchMedia('(prefers-reduced-motion: reduce)').matches
  clock.value = Date.now()
  stream = new EventSource('/api/score/live')
  stream.onmessage = (m) => take(JSON.parse(m.data), true)
  // a little ahead, on the audio clock, so timing doesn't hang on when the timer fires
  let next = 0
  timer = setInterval(() => {
    const t = now()
    if (next < stepAt(t) - 8) next = stepAt(t)
    for (; next * STEP < t + 100; next++) tick(next, (next * STEP - t) / 1000)
    // the edit counter's clock, in quarter seconds, only while an edit is still busy
    if (busy.value.some((b) => b > clock.value)) clock.value = Math.floor(Date.now() / 250) * 250
  }, 25)
  await nextTick()
  const ctx = canvas.value!.getContext('2d')!, css = getComputedStyle(board.value!)
  const colors = {wall: css.getPropertyValue('--wall'), ink: css.getPropertyValue('--wall-ink')}
  // A finger held on the board is drawing, so it no longer scrolls the page.
  canvas.value!.addEventListener('touchmove', (e) => {
    if (gesture) e.preventDefault()
  }, {passive: false})
  resize = fitBoard(canvas.value!, ctx, (layout) => {
    L = layout
  })
  const loop = () => {
    const t = now(), life = lifeFor(Math.floor(stepAt(t) / BAR))
    for (let i = 0; i < seen.length; i++) {
      seen[i]! += (life[i]! - seen[i]!) * (still ? 1 : 0.12)
      flash[i]! *= 0.82
    }
    // under the guide the playhead runs on to show the board is alive, but not with reduced motion
    const step = playing.value || (!sound.value && !still) ? stepAt(t) % COLS : null, at = performance.now()
    rings = rings.filter((r) => at - r.at < 900)
    drawBoard(ctx, L, {key: key.value, score, seen, flash, step, hover: hover.value, rings: rings.map((r) => ({i: r.i, age: (at - r.at) / 900})), ...colors})
    frame = requestAnimationFrame(loop)
  }
  loop()
})

watch(mix, () => {
  sound.value?.mix(mix)
  try { localStorage.setItem('score-mix', JSON.stringify(mix)) } catch {}
})

onBeforeUnmount(() => {
  stream?.close()
  clearInterval(timer)
  cancelAnimationFrame(frame)
  resize?.disconnect()
  void sound.value?.audio.close()
})
</script>

<template>
  <div v-if="data" ref="board" class="player">
    <canvas v-if="live" ref="canvas" tabindex="0" role="application" aria-roledescription="melody board" aria-label="A shared melody. Arrow keys move, Enter adds or takes out a note, Shift with up or down bends it." @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="cancel" @pointerleave="hover = null" @keydown="press" @focus="focus" @blur="hover = null"/>
    <p v-if="live" class="sr-only" aria-live="polite">{{ said }}</p>
    <svg v-else class="still" :viewBox="`0 0 ${COLS} ${ROWS}`" preserveAspectRatio="none" aria-hidden="true">
      <rect v-for="i in data.life" :key="`l${i}`" class="cell" :x="i % COLS + 0.25" :y="Math.floor(i / COLS) + 0.25" width="0.5" height="0.5" rx="0.1"/>
      <rect v-for="n in data.notes" :key="n.i" :x="n.i % COLS + 0.1" :y="Math.floor(n.i / COLS) + 0.1" width="0.8" height="0.8" rx="0.15"/>
    </svg>
    <ScoreDeck v-if="sound" v-model:mix="mix" :playing :name="key.name" :left :wait :nudge @play="play(!playing)" @help="help = true"/>
    <ScoreGuide v-if="!sound || help" :first="!sound" :ready="live" @go="go"/>
  </div>
</template>

<style scoped>
/* An ink player like the project cards, its controls along the bottom. */
.player {
  position: relative;
  display: grid;
  overflow: hidden;
  padding: var(--ae-space-4) var(--ae-space-4) 0 var(--ae-space-3);
  border-radius: var(--ae-radius-l);
  background: var(--wall-ink);
  color: var(--wall);
  box-shadow: 0 1.5rem 3rem -1.5rem rgb(0 0 0 / 0.55);
}

canvas {
  display: block;
  inline-size: 100%;
  touch-action: pan-y;
  cursor: pointer;
  border-radius: var(--ae-radius-s);
  transition: filter 400ms ease-out;
}

canvas:focus-visible {
  outline: 2px solid var(--wall);
  outline-offset: 2px;
}

/* The still picture takes the canvas's place at its size: the gutter and the
   chord band around a 64 by 10 grid, so nothing moves when the canvas comes. */
.still {
  display: block;
  inline-size: calc(100% - 22px);
  aspect-ratio: 64 / 10;
  padding: 18px 0 0 22px;
  fill: var(--wall);
}

.still .cell {
  opacity: 0.4;
}

/* The guide lies over the board and the deck in one cell, out to the
   player's edges, so the player is as tall as whichever needs more. */
.player > :is(canvas, .still) {
  grid-area: 1 / 1;
}

.player > .deck {
  grid-row: 2;
}

.player > .guide {
  grid-area: 1 / 1 / span 2;
  margin: calc(-1 * var(--ae-space-4)) calc(-1 * var(--ae-space-4)) 0 calc(-1 * var(--ae-space-3));
}

/* Under the guide (ScoreGuide) the board keeps moving, blurred. The drawing
   itself is blurred, so no yellow leaks in at the edges. */
.player:has(.guide) :is(canvas, .still) {
  filter: blur(7px) saturate(1.2);
}

@media (prefers-reduced-motion: reduce) {
  canvas {
    transition: none;
  }
}
</style>

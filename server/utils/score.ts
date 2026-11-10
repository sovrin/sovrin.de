// The footer's Score as the server keeps it: one score shared by everyone, in
// memory only (a restart starts it over from the day's tune), and the
// automaton, stepped here on the server's clock so every page hears the same
// generation. Only people change the score, a few edits at a time each.
import type {H3Event} from 'h3'

export interface ScoreState {
    now: number
    bar: number
    notes: ScoreNote[]
    life: number[]
}

const barMs = STEP * BAR
// How long before a bar starts its generation is made and sent, so it's on
// every page by the time the bar plays.
const lead = 400

const score = new Uint8Array(COLS * ROWS)
for (const {i} of tune()) score[i] = 1
let life = new Uint8Array(COLS * ROWS)
let age = new Uint8Array(COLS * ROWS)
// Something already moving: a glider and an r-pentomino.
for (const [x, y] of [[3, 1], [4, 2], [2, 3], [3, 3], [4, 3], [33, 1], [34, 1], [32, 2], [33, 2], [33, 3]]) life[y! * COLS + x!] = 1
// The bar `life` is the generation for.
let bar = Math.floor(Date.now() / barMs)

const edits = new Map<string, number[]>()
const listeners = new Set<(state: ScoreState) => void>()
let timer: ReturnType<typeof setTimeout> | undefined

export const scoreState = (): ScoreState => ({
    now: Date.now(),
    bar,
    notes: [...score.keys()].filter((i) => score[i]).map((i) => ({i, alt: decodeAlt(score[i]!)})),
    life: [...life.keys()].filter((i) => life[i]),
})

const broadcast = () => {
    const state = scoreState()
    listeners.forEach((send) => send(state))
}

// Runs only while someone is listening. After a quiet spell it carries on
// from where it stopped rather than replaying the bars nobody heard.
function schedule() {
    clearTimeout(timer)
    timer = undefined
    if (!listeners.size) return
    const next = Math.max(bar, Math.floor(Date.now() / barMs)) + 1
    timer = setTimeout(() => {
        ({life, age} = evolve(life, age, score, next))
        bar = next
        broadcast()
        schedule()
    }, Math.max(0, next * barMs - lead - Date.now()))
}

export function onScore(send: (state: ScoreState) => void) {
    listeners.add(send)
    if (!timer) schedule()
    return () => {
        listeners.delete(send)
        if (!listeners.size) schedule()
    }
}

// Apply a visitor's edits: each puts a note on step i % COLS at row
// i / COLS (bent by `alt`), or takes it out with alt null. One note per step:
// putting one in a step moves the note already there. A drag arrives as one
// batch of at most a bar's worth and counts as one edit.
export function setNotes(batch: unknown, who: string): 'ok' | 'invalid' | 'limited' {
    if (!Array.isArray(batch) || !batch.length || batch.length > BAR) return 'invalid'
    const valid = batch.every((e) => typeof e === 'object' && e !== null && Number.isInteger(e.i) && e.i >= 0 && e.i < COLS * ROWS && [null, -1, 0, 1].includes(e.alt))
    if (!valid) return 'invalid'
    const now = Date.now()
    const recent = (edits.get(who) ?? []).filter((t) => now - t < EDIT_SPAN)
    if (recent.length >= EDITS) return 'limited'
    edits.set(who, [...recent, now])
    for (const {i, alt} of batch as {i: number, alt: ScoreAlt | null}[]) {
        if (alt === null) score[i] = 0
        else {
            // a note put down (not just bent where it is) sets a small form going beside it
            if (!score[i]) {
                life[i] = 0
                sprout(life, score, i)
            }
            for (let y = 0; y < ROWS; y++) score[y * COLS + i % COLS] = 0
            score[i] = encodeAlt(alt)
        }
    }
    broadcast()
    return 'ok'
}

// How many ms until each of a visitor's used edits frees up again, soonest
// first; EDITS minus its length is how many they have left.
export function quota(who: string) {
    const now = Date.now()
    return (edits.get(who) ?? []).map((t) => t + EDIT_SPAN - now).filter((ms) => ms > 0).sort((a, b) => a - b)
}

// Who's editing, for the limit. X-Forwarded-For is written by whoever sends
// the request, so it's believed only from a proxy (a private or loopback
// address: the reverse proxy, or Docker's gateway in front of the
// container), and then only its last entry, the one that proxy added. Anyone
// reaching the server directly is who their connection says. No address ever
// leaves the server.
const privateAddress = /^(::1$|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|f[cd]|::ffff:(127|10|192\.168|172\.(1[6-9]|2\d|3[01]))\.)/
export function visitor(event: H3Event) {
    const peer = event.node.req.socket.remoteAddress ?? 'unknown'
    const forwarded = getRequestHeader(event, 'x-forwarded-for')?.split(',').at(-1)?.trim()
    return privateAddress.test(peer) && forwarded ? forwarded : peer
}

// How many pages may listen live at once; past that, new ones wait (503).
const MAX_LISTENERS = 500
export const listenersFull = () => listeners.size >= MAX_LISTENERS

// Forget visitors who haven't edited lately.
setInterval(() => {
    const now = Date.now()
    for (const [who, times] of edits) {
        if (times.every((t) => now - t >= EDIT_SPAN)) edits.delete(who)
    }
}, 60_000).unref()

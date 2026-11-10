// The Score's sound, in the browser only: plucked strings in a small room,
// with the melody, the automaton and the bass on their own buses so a visitor
// can set their own mix. Nothing here reaches anyone else.
export interface Mix {
  vol: number
  bal: number
  rev: number
  bass: boolean
}

export type Bus = 'melody' | 'auto' | 'bass'

export function createSound() {
  const audio = new AudioContext()
  const out = audio.createGain()
  out.connect(audio.destination)

  // A small room: a generated impulse, two seconds of noise dying away, a
  // little different per side.
  const len = audio.sampleRate * 2, ir = audio.createBuffer(2, len, audio.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3.5
  }
  const verb = audio.createConvolver()
  verb.buffer = ir
  const room = audio.createGain()
  room.connect(verb).connect(out)

  const buses = Object.fromEntries((['melody', 'auto', 'bass'] as Bus[]).map((name) => {
    const bus = audio.createGain()
    bus.connect(out)
    bus.connect(room)
    return [name, bus]
  })) as Record<Bus, GainNode>

  // A plucked string (Karplus-Strong): a burst of noise circulating through a
  // delay one period long, averaged a little each pass, so it rings at the
  // note's pitch and dulls as it dies. One buffer per pitch, made on first use.
  const strings = new Map<number, AudioBuffer>()
  function string(note: number) {
    const made = strings.get(note)
    if (made) return made
    const sr = audio.sampleRate, n = Math.round(sr / (440 * 2 ** ((note - 69) / 12))), size = Math.floor(sr * 2.6)
    const buf = audio.createBuffer(1, size, sr), data = buf.getChannelData(0), loop = new Float32Array(n)
    for (let i = 0; i < n; i++) loop[i] = Math.random() * 2 - 1
    // a pick, not a hammer: the burst is smoothed so the attack is round
    for (let pass = 0; pass < 2; pass++) for (let i = 1; i < n; i++) loop[i] = (loop[i]! + loop[i - 1]!) / 2
    const keep = 0.4985 + Math.min(0.0012, 30 / n * 0.0004)
    for (let i = 0, p = 0; i < size; i++, p = (p + 1) % n) {
      const v = loop[p]!
      data[i] = v
      loop[p] = keep * (v + loop[(p + 1) % n]!)
    }
    strings.set(note, buf)
    return buf
  }

  return {
    audio,
    // `at` in seconds from now; `ring` how long it may sound; `pan` -1 to 1.
    pluck(note: number, vel: number, {ring = 1.6, at = 0, pan = 0, bus = 'melody' as Bus} = {}) {
      if (audio.state !== 'running') return
      const t = audio.currentTime + Math.max(0, at)
      const src = audio.createBufferSource()
      src.buffer = string(note)
      const gain = audio.createGain()
      gain.gain.setValueAtTime(0.5 * vel, t)
      gain.gain.setValueAtTime(0.5 * vel, t + ring * 0.7)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + ring)
      const panner = audio.createStereoPanner()
      panner.pan.value = pan
      src.connect(gain).connect(panner).connect(buses[bus])
      src.start(t)
      src.stop(t + ring + 0.05)
    },
    // The middle of the balance is the full mix; either way the other side fades out.
    mix({vol, bal, rev, bass}: Mix) {
      const t = audio.currentTime
      out.gain.setTargetAtTime(vol * 1.1, t, 0.03)
      buses.melody.gain.setTargetAtTime(Math.min(1, 2 * (1 - bal)), t, 0.03)
      buses.auto.gain.setTargetAtTime(Math.min(1, 2 * bal), t, 0.03)
      buses.bass.gain.setTargetAtTime(bass ? 1 : 0, t, 0.03)
      room.gain.setTargetAtTime(rev * 0.8, t, 0.03)
    },
  }
}

export type Sound = ReturnType<typeof createSound>

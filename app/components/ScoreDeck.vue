<script setup lang="ts">
// The Score's controls, along the bottom of its board. Left, what's playing:
// play and pause, the day's key, and how many edits are left before the
// server says no (a square per edit, like the notes). Right, folded away
// until asked for, this visitor's own mix, which reaches no one else.
const props = defineProps<{playing: boolean, name: string, left: number, wait: number, nudge: number}>()
const emit = defineEmits<{play: [], help: []}>()
const mix = defineModel<Mix>('mix', {required: true})

// Refused: the squares shake once.
const shake = ref(false)
const open = ref(false)
watch(() => props.nudge, () => {
  shake.value = false
  requestAnimationFrame(() => {
    shake.value = true
  })
})
</script>

<template>
  <div class="deck">
    <button class="play" type="button" :aria-pressed="playing" :aria-label="playing ? 'Pause' : 'Play'" @click="emit('play')">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path v-if="playing" d="M4 3h3v10H4zM9 3h3v10H9z"/><path v-else d="M5 2.5l8.5 5.5L5 13.5z"/></svg>
    </button>
    <div class="now">
      <span class="key">{{ name }}</span>
      <span class="quota" :class="{shake, out: !left}" @animationend="shake = false">
        <span class="pips" aria-hidden="true"><i v-for="n in EDITS" :key="n" :class="{on: n <= left}"/></span>
        <span><span aria-live="polite">{{ left ? `${left} ${left === 1 ? 'edit' : 'edits'} left` : 'out of edits' }}</span><span v-if="!left" aria-hidden="true">, next in {{ wait }}s</span></span>
      </span>
    </div>
    <div v-if="open" id="score-mix" class="mixer">
      <label><span>vol</span><input v-model.number="mix.vol" type="range" min="0" max="1" step="0.01" :style="{'--v': mix.vol}"></label>
      <label class="balance">
        <span>melody</span>
        <input v-model.number="mix.bal" type="range" min="0" max="1" step="0.01" :style="{'--v': mix.bal}" aria-label="Balance between melody and automaton">
        <span>auto</span>
      </label>
      <label><span>room</span><input v-model.number="mix.rev" type="range" min="0" max="1" step="0.01" :style="{'--v': mix.rev}"></label>
      <button class="switch" type="button" role="switch" :aria-checked="mix.bass" @click="mix.bass = !mix.bass">
        bass<i aria-hidden="true"/>
      </button>
    </div>
    <button class="more" type="button" :aria-expanded="open" aria-controls="score-mix" @click="open = !open">mix</button>
    <button class="help" type="button" aria-label="How the Score works" @click="emit('help')">?</button>
  </div>
</template>

<style scoped>
.deck {
  --dim: color-mix(in oklch, var(--wall) 22%, transparent);
  --mute: color-mix(in oklch, var(--wall) 62%, transparent);
  display: grid;
  grid-template-columns: auto 1fr;
  grid-auto-columns: auto;
  grid-auto-flow: column;
  align-items: center;
  gap: var(--ae-space-3) var(--ae-space-5);
  margin-block-start: var(--ae-space-3);
  padding: var(--ae-space-3) var(--ae-space-1) var(--ae-space-4) var(--ae-space-2);
  border-block-start: 1px solid color-mix(in oklch, var(--wall) 14%, transparent);
  font-family: var(--ae-font-mono);
  font-size: var(--ae-text-xs);
  color: var(--mute);
}

:where(.deck button) {
  all: unset;
  cursor: pointer;
}

.deck :focus-visible {
  outline: 2px solid var(--wall);
  outline-offset: 3px;
}

.play {
  display: grid;
  place-items: center;
  inline-size: 2.25rem;
  block-size: 2.25rem;
  border-radius: 50%;
  background: var(--wall);
  color: var(--wall-ink);
  transition: scale 160ms ease-out;
}

.play svg {
  inline-size: 0.85rem;
  fill: currentColor;
}

.now {
  display: grid;
  gap: 0.3rem;
  min-inline-size: 0;
}

.key {
  font-size: var(--ae-text-s);
  color: var(--wall);
}

.quota {
  display: flex;
  align-items: center;
  gap: 0.6em;
  white-space: nowrap;
}

.quota.out {
  color: var(--wall);
}

.pips {
  display: flex;
  gap: 3px;
}

/* A square per edit, like a note on the board: filled while it's free. */
.pips i {
  inline-size: 7px;
  block-size: 7px;
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px var(--dim);
  transition: background-color 200ms ease-out, box-shadow 200ms ease-out;
}

.pips i.on {
  background: var(--wall);
  box-shadow: none;
}

.mixer {
  display: flex;
  align-items: center;
  gap: var(--ae-space-5);
  padding-inline-start: var(--ae-space-5);
  border-inline-start: 1px solid color-mix(in oklch, var(--wall) 14%, transparent);
}

.mixer label {
  display: inline-flex;
  align-items: center;
  gap: 0.6em;
}

/* A thin track, filled in the yellow up to the value (the balance from its
   middle out), with an ink-ringed yellow thumb. */
.mixer input {
  --fill: linear-gradient(to right, var(--wall) calc(var(--v) * 100%), var(--dim) 0);
  appearance: none;
  inline-size: 4.75rem;
  block-size: 1.25rem;
  margin: 0;
  background: transparent;
  cursor: pointer;
}

.balance input {
  --lo: calc(min(var(--v), 0.5) * 100%);
  --hi: calc(max(var(--v), 0.5) * 100%);
  --fill: linear-gradient(to right, var(--dim) var(--lo), var(--wall) var(--lo) var(--hi), var(--dim) var(--hi));
}

.mixer input::-webkit-slider-runnable-track {
  block-size: 3px;
  border-radius: 2px;
  background: var(--fill);
}

.mixer input::-moz-range-track {
  block-size: 3px;
  border-radius: 2px;
  background: var(--fill);
}

.mixer input::-webkit-slider-thumb {
  appearance: none;
  inline-size: 12px;
  block-size: 12px;
  margin-block-start: -4.5px;
  border-radius: 50%;
  background: var(--wall);
  box-shadow: 0 0 0 3px var(--wall-ink);
  transition: scale 160ms ease-out;
}

.mixer input::-moz-range-thumb {
  inline-size: 12px;
  block-size: 12px;
  border: 0;
  border-radius: 50%;
  background: var(--wall);
  box-shadow: 0 0 0 3px var(--wall-ink);
  transition: scale 160ms ease-out;
}

/* The mix, folded away until asked for: a word, ringed while it's open. */
.more {
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1.5px var(--dim);
  transition: color 160ms ease-out, box-shadow 160ms ease-out;
}

.more[aria-expanded='true'] {
  color: var(--wall);
  box-shadow: inset 0 0 0 1.5px var(--wall);
}

/* The guide again: a ringed question mark. */
.help {
  display: grid;
  place-items: center;
  inline-size: 2.25rem;
  block-size: 2.25rem;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1.5px var(--dim);
  color: var(--wall);
}

/* On and off, a knob that slides across a small track. */
.switch {
  display: inline-flex;
  align-items: center;
  gap: 0.6em;
  padding-block: 0.6rem;
}

.switch i {
  position: relative;
  inline-size: 1.75rem;
  block-size: 1rem;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1.5px var(--dim);
  transition: background-color 200ms ease-out, box-shadow 200ms ease-out;
}

.switch i::after {
  content: '';
  position: absolute;
  inset-block-start: 3px;
  inset-inline-start: 3px;
  inline-size: 10px;
  block-size: 10px;
  border-radius: 50%;
  background: var(--mute);
  transition: translate 200ms var(--ae-ease), background-color 200ms ease-out;
}

.switch[aria-checked='true'] {
  color: var(--wall);
}

.switch[aria-checked='true'] i {
  background: var(--wall);
  box-shadow: none;
}

.switch[aria-checked='true'] i::after {
  translate: 0.75rem 0;
  background: var(--wall-ink);
}

@media (prefers-reduced-motion: no-preference) {
  .play:active {
    scale: 0.94;
  }

  .mixer input:active::-webkit-slider-thumb {
    scale: 1.2;
  }

  .mixer input:active::-moz-range-thumb {
    scale: 1.2;
  }

  .quota.shake .pips {
    animation: shake 320ms var(--ae-ease);
  }

  @keyframes shake {
    25% { translate: -3px 0; }
    50% { translate: 3px 0; }
    75% { translate: -1.5px 0; }
  }
}

@media (prefers-reduced-motion: reduce) {
  .more,
  .pips i,
  .switch i,
  .switch i::after {
    transition: none;
  }
}

/* Narrow: play, what's on and the two buttons on top; the mixer its own row under them. */
@media (width < 52rem) {
  .deck {
    grid-template-columns: auto 1fr auto auto;
    grid-auto-flow: row;
  }

  .mixer {
    grid-column: 1 / -1;
    grid-row: 2;
    flex-wrap: wrap;
    gap: var(--ae-space-3) var(--ae-space-5);
    padding: var(--ae-space-3) 0 0;
    border-inline-start: 0;
    border-block-start: 1px solid color-mix(in oklch, var(--wall) 14%, transparent);
  }
}
</style>

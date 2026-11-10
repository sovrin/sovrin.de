<script setup lang="ts">
// The Score's guide, laid over its blurred board: what it is, how to play it,
// and what plays along. At first it's the way in, its button the gesture
// browsers want before any sound; later the deck's "?" brings it back. It's
// there from the first paint; its button shows once the page is live, so
// without JS it's a picture of the board with no dead button on it.
const props = defineProps<{first: boolean, ready: boolean}>()
const emit = defineEmits<{go: []}>()
const {score} = useAppConfig().portfolio
const button = ref<HTMLButtonElement>()
// Brought back on purpose, it takes the focus, and Escape puts it away.
onMounted(() => {
  if (!props.first) button.value?.focus()
})
</script>

<template>
  <section class="guide" aria-labelledby="score-title" @keydown.esc="!first && emit('go')">
    <div class="intro">
      <h2 id="score-title">Score</h2>
      <p>{{ score.lead }}</p>
      <button ref="button" class="go" type="button" :class="{wait: !ready}" :disabled="!ready" @click="emit('go')">{{ first ? '▶ listen' : 'back to the board' }}</button>
    </div>
    <ul class="how" data-variant="plain">
      <li><i class="glyph" aria-hidden="true"/>{{ score.add }}</li>
      <li><i class="glyph bend" aria-hidden="true"/>{{ score.bend }}</li>
      <li><i class="glyph remove" aria-hidden="true"/>{{ score.remove }}</li>
      <li><i class="glyph life" aria-hidden="true"/>{{ score.life }}</li>
      <li class="keys"><i class="glyph key" aria-hidden="true"/>{{ score.keys }}</li>
    </ul>
  </section>
</template>

<style scoped>
.guide {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  align-items: center;
  gap: var(--ae-space-5) var(--ae-space-7);
  padding: var(--ae-space-5) var(--ae-space-7);
  background: color-mix(in oklch, var(--wall-ink) 72%, transparent);
  color: var(--wall);
}

.intro {
  display: grid;
  justify-items: start;
  gap: var(--ae-space-3);
}

h2 {
  margin: 0;
  font-size: var(--ae-text-2xl);
  font-weight: 650;
  letter-spacing: -0.035em;
  line-height: 1;
}

.intro p {
  margin: 0;
  max-inline-size: 34ch;
  font-size: var(--ae-text-m);
  text-wrap: pretty;
  color: color-mix(in oklch, var(--wall) 85%, transparent);
}

.go {
  all: unset;
  margin-block-start: var(--ae-space-2);
  padding: 0.65em 1.3em;
  border-radius: 999px;
  background: var(--wall);
  color: var(--wall-ink);
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 0.75rem 2rem -0.5rem rgb(0 0 0 / 0.6);
  transition: scale 200ms ease-out;
}

.go.wait {
  visibility: hidden;
}

.go:focus-visible {
  outline: 2px solid var(--wall);
  outline-offset: 3px;
}

.how {
  display: grid;
  gap: var(--ae-space-3);
  margin: 0;
  padding: 0;
  font-family: var(--ae-font-mono);
  font-size: var(--ae-text-xs);
  color: color-mix(in oklch, var(--wall) 80%, transparent);
}

.how li {
  display: grid;
  grid-template-columns: 1.25rem 1fr;
  align-items: center;
  gap: var(--ae-space-3);
}

/* Each gesture drawn the way the board draws it: a note, a bent note, a note
   taken out, a few of the automaton's small cells. */
.glyph {
  position: relative;
  justify-self: center;
  inline-size: 11px;
  block-size: 11px;
  border-radius: 3px;
  background: var(--wall);
}

.bend::before,
.bend::after {
  content: '';
  position: absolute;
  inset-inline-start: 2px;
  border: 3.5px solid transparent;
}

.bend::before {
  inset-block-start: -9px;
  border-block-end-color: var(--wall);
}

.bend::after {
  inset-block-end: -9px;
  border-block-start-color: var(--wall);
}

/* The keys: a key cap, outlined. */
.key {
  inline-size: 13px;
  block-size: 9px;
  background: none;
  box-shadow: inset 0 0 0 1.5px color-mix(in oklch, var(--wall) 60%, transparent), inset 0 -2.5px 0 color-mix(in oklch, var(--wall) 60%, transparent);
}

/* Only someone with a keyboard needs the keys. */
@media (pointer: coarse) {
  .keys {
    display: none;
  }
}

.remove {
  background: none;
  box-shadow: inset 0 0 0 1.5px color-mix(in oklch, var(--wall) 45%, transparent);
}

.life {
  inline-size: 5px;
  block-size: 5px;
  border-radius: 1.5px;
  background: color-mix(in oklch, var(--wall) 60%, transparent);
  box-shadow:
    6px 0 color-mix(in oklch, var(--wall) 60%, transparent),
    0 6px color-mix(in oklch, var(--wall) 60%, transparent),
    -6px 6px color-mix(in oklch, var(--wall) 40%, transparent);
  translate: 2px -3px;
}

@media (hover: hover) and (pointer: fine) {
  .go:not(:disabled):hover {
    scale: 1.04;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .guide {
    animation: in 300ms ease-out;
  }

  @keyframes in {
    from { opacity: 0; }
  }
}

@media (prefers-reduced-motion: reduce) {
  .go {
    transition: none;
  }
}

@media (prefers-reduced-transparency: reduce) {
  .guide {
    background: var(--wall-ink);
  }
}

/* Narrow: one column, the way in last. */
@media (width < 52rem) {
  .guide {
    grid-template-columns: 1fr;
    align-content: center;
    gap: var(--ae-space-4);
    padding: var(--ae-space-4) var(--ae-space-5);
  }

  .intro {
    display: contents;
  }

  h2,
  .intro p {
    grid-row: auto;
  }

  .how {
    gap: var(--ae-space-2);
  }

  .go {
    order: 1;
    justify-self: start;
    margin: 0;
  }
}
</style>

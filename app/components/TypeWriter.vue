<script setup lang="ts">
// Types out its text with a caret. Full text is server-rendered (crawlers /
// no-JS / reduced-motion get it instantly); JS animates the reveal. `start`
// gates when typing begins and `done` fires after, so instances can chain;
// `final` keeps the blinking cursor on the last line only.
const props = withDefaults(
    defineProps<{
      text: string
      start?: boolean
      final?: boolean
    }>(),
    {start: true, final: true},
)

const emit = defineEmits<{ done: [] }>()

// SSR / pre-hydration: full text in the "done" state, matching the client's
// first render (no hydration mismatch); the animation kicks in from onMounted.
const shown = ref(props.text)
const phase = ref<'idle' | 'typing' | 'done'>('done')

let started = false

const typeOut = () => {
  if (started) return
  started = true

  // No motion: reveal instantly and let the chain advance immediately.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    shown.value = props.text
    phase.value = 'done'
    emit('done')
    return
  }

  shown.value = ''
  phase.value = 'typing'

  let i = 0
  const tick = () => {
    shown.value = props.text.slice(0, ++i)
    if (i < props.text.length) {
      setTimeout(tick, 30 + Math.random() * 60)
    } else {
      phase.value = 'done'
      emit('done')
    }
  }
  setTimeout(tick, 220)
}

onMounted(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    typeOut() // short-circuits to full text + done
    return
  }
  if (props.start) {
    typeOut()
  } else {
    // Wait for our turn: hide until `start` flips true.
    shown.value = ''
    phase.value = 'idle'
  }
})

watch(
    () => props.start,
    (v) => {
      if (v) typeOut()
    },
)

const showCursor = computed(
    () => phase.value === 'typing' || (phase.value === 'done' && props.final),
)
</script>

<template>
  <span class="tw">{{ shown }}<span
      v-if="showCursor"
      class="tw-cursor"
      :class="{blink: phase === 'done'}"
      aria-hidden="true"
  >_</span></span>
</template>

<style scoped>
.tw {
  white-space: pre-wrap;
}

.tw-cursor {
  margin-left: 0.02em;
  font-weight: 400;
  color: var(--color-cursor, currentColor);
}

.tw-cursor.blink {
  animation: blink 1.1s step-end infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tw-cursor.blink {
    animation: none;
  }
}
</style>

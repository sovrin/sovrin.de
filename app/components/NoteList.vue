<script setup lang="ts">
import type {NoteMeta} from '~~/server/utils/notes'

// Published notes, newest first, SSR-fetched from the live content endpoint the
// way Projects is. `limit` marks the home page's block: that many notes beside a
// "Notes" head with the way to the full index. The index groups them by year
// instead. While there are no notes the home block leaves no trace; the full
// index says so instead.
const props = defineProps<{limit?: number}>()

const {data: notes} = await useFetch<NoteMeta[]>('/api/notes', {key: 'notes', default: () => []})
const groups = computed(() => {
  if (props.limit) return [{label: 'Notes', notes: notes.value.slice(0, props.limit)}]
  const years = [...new Set(notes.value.map((n) => n.date.slice(0, 4)))]
  return years.map((y) => ({label: y, notes: notes.value.filter((n) => n.date.startsWith(y))}))
})
</script>

<template>
  <section v-if="notes.length" class="ledger" :class="{archive: !props.limit}" :aria-labelledby="props.limit ? 'notes' : undefined">
    <div v-for="g in groups" :key="g.label" class="group">
      <div class="side">
        <h2 :id="props.limit ? 'notes' : undefined">{{ g.label }}</h2>
        <NuxtLink v-if="props.limit" to="/notes">All notes</NuxtLink>
      </div>
      <ul class="entries" data-variant="plain">
        <li v-for="n in g.notes" :key="n.slug" class="entry">
          <time :datetime="n.date">{{ day(n.date) }}</time>
          <NuxtLink class="title" :to="`/notes/${n.slug}`">{{ n.title }}<span aria-hidden="true">→</span></NuxtLink>
          <p v-if="n.description">{{ n.description }}</p>
        </li>
      </ul>
    </div>
  </section>
  <p v-else-if="!props.limit" class="none">No notes yet.</p>
</template>

<style scoped>
/* Split 5:7 like the hero's standfirst and the project cards: the head (or the
   year) on the left, held while its notes pass, the notes over the pictures'
   column. One hairline a group, none between notes. */
.group {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: var(--ae-space-5) var(--ae-space-6);
  padding-block-start: var(--ae-space-5);
  border-block-start: 1px solid var(--ae-border);
}

.ledger.archive .group + .group {
  margin-block-start: var(--ae-space-7);
}

.side {
  position: sticky;
  top: var(--ae-space-6);
  align-self: start;
  display: grid;
  justify-items: start;
  gap: var(--ae-space-4);
}

.side h2 {
  margin: 0;
  font-size: clamp(2.75rem, 6vw, 5.5rem);
  font-weight: 650;
  letter-spacing: -0.05em;
  line-height: 0.9;
}

/* Under the page's own h1 the years step down, so two giants don't stack. */
.archive .side h2 {
  font-family: var(--ae-font-mono);
  font-size: var(--ae-text-l);
  font-weight: 450;
  letter-spacing: 0;
  color: var(--ae-text-muted);
}

.side a {
  font-family: var(--ae-font-mono);
  font-size: var(--ae-text-s);
  color: var(--ae-text-muted);
  transition: color 160ms ease-out;
}

.entries {
  display: grid;
  gap: var(--ae-space-7);
  margin: 0;
}

/* The title link is stretched over the note (::before), so it's one target. */
.entry {
  position: relative;
  display: grid;
  gap: var(--ae-space-3);
}

.entry time {
  font-family: var(--ae-font-mono);
  font-size: var(--ae-text-s);
  color: var(--ae-text-muted);
}

.title {
  max-inline-size: 22ch;
  font-size: clamp(var(--ae-text-2xl), 3.2vw, var(--ae-text-4xl));
  font-weight: 650;
  letter-spacing: -0.045em;
  line-height: 1;
  color: var(--ae-text);
  text-decoration: none;
  text-wrap: balance;
  transition: color 200ms ease-out;
}

.title span {
  display: inline-block;
  margin-inline-start: 0.3em;
  color: var(--wall);
  opacity: 0;
  translate: -0.3em 0;
  transition: opacity 200ms ease-out, translate 400ms var(--ae-ease);
}

.title::before {
  content: '';
  position: absolute;
  inset: calc(var(--ae-space-3) * -1);
}

.title:focus-visible {
  outline: none;
}

.title:focus-visible::before {
  outline: 2px solid var(--wall);
  border-radius: var(--ae-radius-m);
}

.entry p {
  margin: 0;
  max-inline-size: 48ch;
  font-size: var(--ae-text-l);
  line-height: 1.4;
  color: var(--ae-text-muted);
  text-wrap: pretty;
}

/* Real pointers only: a tap on touch would leave the note stuck 'hovered'. */
@media (hover: hover) and (pointer: fine) {
  .entry:hover .title {
    color: var(--wall);
  }

  .entry:hover .title span {
    opacity: 1;
    translate: 0 0;
  }

  .side a:hover {
    color: var(--ae-text);
  }
}

/* As notes come up their words lift in, like the project cards'; tied to the
   scroll, so it runs back too. */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .entry {
      view-timeline: --note block;
    }

    .entry > * {
      animation: lift linear both;
      animation-timeline: --note;
      animation-range: entry 10% entry 90%;
    }
  }
}

@keyframes lift {
  from {
    opacity: 0;
    transform: translateY(1.25rem);
  }
}

@media (width < 52rem) {
  .group {
    grid-template-columns: 1fr;
  }

  .side {
    position: static;
    grid-auto-flow: column;
    justify-content: space-between;
    align-items: baseline;
  }
}

.none {
  margin: 0;
  padding-block: var(--ae-space-4);
  color: var(--ae-text-muted);
}
</style>

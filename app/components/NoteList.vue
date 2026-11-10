<script setup lang="ts">
import type {NoteMeta} from '~~/server/utils/notes'

// Published notes, newest first, SSR-fetched from the live content endpoint the
// way Projects is. `limit` marks the home page's compact variant: that many
// cards under a "Notes" head with the way to the full index. While there are no
// notes the home block leaves no trace; the full index says so instead.
const props = defineProps<{limit?: number}>()

const {data: notes} = await useFetch<NoteMeta[]>('/api/notes', {key: 'notes', default: () => []})
const shown = computed(() => props.limit ? notes.value.slice(0, props.limit) : notes.value)
</script>

<template>
  <section v-if="shown.length" :aria-labelledby="props.limit ? 'notes' : undefined">
    <template v-if="props.limit">
      <div class="sheet-head">
        <h2 id="notes">Notes</h2>
        <NuxtLink to="/notes">all notes →</NuxtLink>
      </div>
      <ul class="latest" data-variant="plain">
        <li v-for="(n, i) in shown" :key="n.slug" :style="{'--i': i}">
          <time :datetime="n.date">{{ n.date }}</time>
          <NuxtLink :to="`/notes/${n.slug}`">{{ n.title }}</NuxtLink>
        </li>
      </ul>
    </template>

    <ul v-else class="entries" data-variant="plain">
      <li v-for="n in shown" :key="n.slug" class="entry">
        <NuxtLink class="title" :to="`/notes/${n.slug}`">{{ n.title }}</NuxtLink>
        <span v-if="n.description" class="desc">{{ n.description }}</span>
        <time class="meta" :datetime="n.date">{{ n.date }}</time>
      </li>
    </ul>
  </section>
  <p v-else-if="!props.limit" class="none">No notes yet.</p>
</template>

<style scoped>
.latest {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: var(--ae-space-3);
  margin: var(--ae-space-6) 0 0;
}

/* The title link is stretched over the card (::before), so the card is one target. */
.latest li {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--ae-space-6);
  min-block-size: 10rem;
  box-sizing: border-box;
  padding: var(--ae-space-5);
  border-radius: var(--ae-radius-l);
  background: color-mix(in oklch, var(--ae-text) 5%, var(--ae-bg));
  transition: background-color 300ms ease-out, color 300ms ease-out;
}

.latest time {
  font-family: var(--ae-font-mono);
  font-size: var(--ae-text-s);
  opacity: 0.65;
}

.latest a {
  font-size: var(--ae-text-xl);
  font-weight: 550;
  letter-spacing: -0.025em;
  line-height: 1.15;
  color: inherit;
  text-decoration: none;
  text-wrap: balance;
}

.latest a::before {
  content: '';
  position: absolute;
  inset: 0;
}

.latest a:focus-visible {
  outline: none;
}

.latest a:focus-visible::before {
  outline: 2px solid var(--wall);
  outline-offset: 2px;
  border-radius: inherit;
}

@media (hover: hover) and (pointer: fine) {
  .latest li:hover {
    background: var(--wall);
    color: var(--wall-ink);
  }
}

/* As the cards come up, their words lift in like the project cards', each
   card a little after the one before it; tied to the scroll, so it runs back
   too. The card itself stays put, so it's what the scroll is measured on. */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .latest li {
      view-timeline: --note block;
    }

    .latest li > * {
      animation: lift linear both;
      animation-timeline: --note;
      animation-range: entry calc(15% + var(--i) * 12%) entry 100%;
    }
  }
}

@keyframes lift {
  from {
    opacity: 0;
    transform: translateY(1.5rem);
  }
}

.none {
  margin: 0;
  padding-block: var(--ae-space-4);
  color: var(--ae-text-muted);
}
</style>

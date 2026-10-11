<script setup lang="ts">
import type {NoteMeta} from '~~/server/utils/notes'

// Published notes, newest first, SSR-fetched from the live content endpoint the
// way Projects is. `limit` marks the home page's compact variant: trimmed to that
// many title-and-date rows, no descriptions, plus the way to the full index.
// Renders nothing at all while there are no notes, so an empty blog leaves no
// trace on the page.
const props = defineProps<{limit?: number; prompt?: string}>()

const {data: notes} = await useFetch<NoteMeta[]>('/api/notes', {key: 'notes', default: () => []})
const shown = computed(() => props.limit ? notes.value.slice(0, props.limit) : notes.value)
</script>

<template>
  <section v-if="shown.length" class="notes" aria-label="Notes">
    <Prompt v-if="props.prompt" class="head">{{ props.prompt }}</Prompt>

    <ul class="list">
      <li v-for="n in shown" :key="n.slug">
        <NuxtLink class="note" :to="`/notes/${n.slug}`">
          <span class="row">
            <span class="title">{{ n.title }}</span>
            <span class="leader" aria-hidden="true"/>
            <time class="when" :datetime="n.date">{{ n.date }}</time>
          </span>
          <span v-if="n.description && !props.limit" class="desc">{{ n.description }}</span>
        </NuxtLink>
      </li>
    </ul>

    <LinkPill v-if="props.limit" class="more" label="all notes" sigil="→" href="/notes"/>
  </section>
</template>

<style scoped>
.notes {
  margin-top: var(--space-md);
}

.head {
  margin-bottom: var(--space-2xs);
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.note {
  display: block;
  padding: var(--space-3xs) 0;
  transform-origin: left center;
  transition: transform var(--dur-press) var(--ease-out);
}

/* Press feedback for the whole row — kept tiny, since the row is wide. */
.note:active {
  transform: scale(0.99);
}

.row {
  display: flex;
  align-items: baseline;
  gap: var(--space-2xs);
}

.title {
  position: relative;
  font-size: var(--fs-body);
  font-weight: 500;
  letter-spacing: -0.01em;
  color: rgba(245, 245, 245, 0.86);
  transition: color var(--dur-out) ease;
}

/* Accent underline wipes in on hover, as on the project names and link pills. */
.title::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.2em;
  height: 1px;
  background: var(--mesh-color, rgba(245, 245, 245, 0.7));
  transform: scaleX(0);
  transform-origin: right;
  transition: transform var(--dur-out) var(--ease-out);
}

/* Real pointers only — a tap on touch would leave the row stuck "hovered". */
@media (hover: hover) and (pointer: fine) {
  .note:hover .title {
    color: #f5f5f5;
    transition-duration: var(--dur-in);
  }

  .note:hover .title::after {
    transform: scaleX(1);
    transform-origin: left;
    transition-duration: var(--dur-in);
  }

  .note:hover .leader {
    border-bottom-color: color-mix(in oklab, var(--mesh-color, #b5842a) 55%, transparent);
    transition-duration: var(--dur-in);
  }
}

/* Keyboard focus lands instantly — tabbing never waits on an animation. */
.note:focus-visible .title {
  color: #f5f5f5;
  transition: none;
}

.note:focus-visible .title::after {
  transform: scaleX(1);
  transition: none;
}

.note:focus-visible .leader {
  border-bottom-color: color-mix(in oklab, var(--mesh-color, #b5842a) 55%, transparent);
  transition: none;
}

.note:focus-visible {
  outline: 2px solid rgba(245, 245, 245, 0.5);
  outline-offset: 3px;
  border-radius: 2px;
}

.leader {
  flex: 1 1 auto;
  align-self: baseline;
  height: 0;
  transform: translateY(-0.28em);
  border-bottom: 1px dotted rgba(245, 245, 245, 0.16);
  transition: border-color var(--dur-out) ease;
}

.when {
  flex: 0 0 auto;
  font-family: var(--font-mono);
  font-size: var(--fs-micro);
  letter-spacing: 0.06em;
  color: rgba(245, 245, 245, 0.3);
  font-variant-numeric: tabular-nums;
}

.desc {
  display: block;
  margin-top: var(--space-3xs);
  max-width: 52ch;
  font-size: var(--fs-pill);
  line-height: 1.5;
  color: rgba(245, 245, 245, 0.5);
  text-wrap: pretty;
}

.more {
  margin-top: var(--space-xs);
}

@media (prefers-reduced-motion: reduce) {
  .title::after {
    transition: none;
  }

  .note:active {
    transform: none;
  }
}
</style>

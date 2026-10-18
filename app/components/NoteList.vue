<script setup lang="ts">
import type {NoteMeta} from '~~/server/utils/notes'

// Published notes, newest first, SSR-fetched from the live content endpoint the
// way Projects is. `limit` marks the home page's compact variant: that many rows
// under a "Notes" head with the way to the full index. While there are no notes
// the home block leaves no trace; the full index says so instead.
const props = defineProps<{limit?: number}>()

const {data: notes} = await useFetch<NoteMeta[]>('/api/notes', {key: 'notes', default: () => []})
const shown = computed(() => props.limit ? notes.value.slice(0, props.limit) : notes.value)
</script>

<template>
  <section v-if="shown.length" aria-label="Notes">
    <div v-if="props.limit" class="sheet-head">
      <h2>Notes</h2>
      <NuxtLink to="/notes">all notes →</NuxtLink>
    </div>

    <ul class="entries" data-variant="plain">
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
.none {
  margin: 0;
  padding-block: var(--ae-space-4);
  color: var(--ae-text-muted);
}
</style>


<script setup lang="ts">
import type {Note} from '~~/server/utils/notes'

const route = useRoute()
const {portfolio} = useAppConfig()
const {name, user, url} = portfolio

const slug = String(route.params.slug)
const {data: note, error} = await useFetch<Note>(`/api/notes/${encodeURIComponent(slug)}`, {key: `note:${slug}`})
if (!note.value) {
  throw createError({
    status: error.value?.status ?? 404,
    statusText: error.value?.statusText ?? 'no such note',
    fatal: true,
  })
}

const current = note.value
const canonical = `${url}/notes/${current.slug}`
const description = current.description ?? current.title

useHead({
  title: `${current.title} · ${name}`,
  link: [{rel: 'canonical', href: canonical}],
  meta: [
    // A draft is reachable by its URL but must not be indexed or previewed.
    ...(current.draft ? [{name: 'robots', content: 'noindex, nofollow'}] : []),
    {name: 'description', content: description},
    {property: 'og:type', content: 'article'},
    {property: 'og:site_name', content: user},
    {property: 'og:title', content: current.title},
    {property: 'og:description', content: description},
    {property: 'og:url', content: canonical},
    {property: 'og:image', content: `${url}/og.png`},
    {property: 'article:published_time', content: current.date},
    {property: 'article:author', content: name},
    {name: 'twitter:card', content: 'summary_large_image'},
  ],
})
</script>

<template>
  <article v-if="note" class="rise" style="--i: 3">
    <header class="sheet-head">
      <NuxtLink to="/notes">← Notes</NuxtLink>
      <span>
        <time :datetime="note.date">{{ note.date }}</time>
        <span v-if="note.draft" class="badge" data-tone="warning">draft</span>
      </span>
    </header>
    <h1 class="note-title">{{ note.title }}</h1>
    <p v-if="note.tags.length" class="tags">{{ note.tags.join(', ') }}</p>
    <div class="prose" v-html="note.html"/>
  </article>
</template>

<style scoped>
.note-title {
  margin-block: var(--ae-space-6) var(--ae-space-2);
  text-wrap: balance;
}

.tags {
  margin: 0;
  font-family: var(--ae-font-mono);
  font-size: var(--ae-text-s);
  color: var(--ae-text-muted);
}

.badge {
  margin-inline-start: var(--ae-space-3);
}

.prose {
  margin-block-start: var(--ae-space-6);
}
</style>

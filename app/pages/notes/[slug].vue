<script setup lang="ts">
import type {Note} from '~~/server/utils/notes'

const route = useRoute()
const {portfolio} = useAppConfig()
const {name, user} = portfolio
const url = useRequestURL({xForwardedHost: true}).origin

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
  <article v-if="note">
    <h1 class="note-title">{{ note.title }}</h1>
    <p class="meta">
      <NuxtLink to="/" rel="author">{{ name }}</NuxtLink>
      <time :datetime="note.date">{{ note.date }}</time>
      <span v-if="note.tags.length">{{ note.tags.join(', ') }}</span>
      <span v-if="note.draft" class="badge" data-tone="warning">{{ note.slug.startsWith('_') ? 'unlisted' : 'draft' }}</span>
    </p>
    <div class="prose" v-html="note.html"/>
  </article>
</template>

<style scoped>
/* Set in the wall name's voice, a step below it, so the two don't compete. */
.note-title {
  margin-block: 0 var(--ae-space-3);
  font-size: var(--ae-text-3xl);
  font-weight: 700;
  letter-spacing: -0.045em;
  text-wrap: balance;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ae-space-1) var(--ae-space-4);
  margin: 0;
  font-family: var(--ae-font-mono);
  font-size: var(--ae-text-s);
  color: var(--ae-text-muted);
}

/* The byline: shared notes are where people arrive without the wall's name. */
.meta a {
  color: var(--ae-text);
  text-decoration: none;
  transition: color 160ms ease-out;
}

@media (hover: hover) and (pointer: fine) {
  .meta a:hover {
    color: var(--ae-accent-ink);
  }
}

.prose {
  margin-block-start: var(--ae-space-6);
}
</style>

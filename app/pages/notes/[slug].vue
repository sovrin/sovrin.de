<script setup lang="ts">
import type {Note} from '~~/server/utils/notes'

// One note: `cat` the file and read it on the glass, in the dock's fill mode. A
// long post makes the panel taller than the viewport; the crystal stays fixed
// behind it.
definePageMeta({dock: 'fill'})

const route = useRoute()
const year = new Date().getFullYear()
const {portfolio} = useAppConfig()
const {user, url} = portfolio

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
  title: `${current.title} · ${user}`,
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
    {property: 'article:author', content: user},
    {name: 'twitter:card', content: 'summary_large_image'},
  ],
})
</script>

<template>
  <article v-if="note" class="note">
    <div class="who rise" style="--d: 0s">
      <Avatar :user="user" :size="40"/>
      <Prompt class="status">cat ~/notes/{{ note.slug }}.md</Prompt>
    </div>

    <h1 class="title rise" style="--d: 0.08s">{{ note.title }}</h1>

    <p class="stamp rise" style="--d: 0.14s">
      <time :datetime="note.date">{{ note.date }}</time>
      <template v-if="note.tags.length"> · {{ note.tags.join(' · ') }}</template>
      <span v-if="note.draft" class="draft"> · draft</span>
    </p>

    <div class="prose rise" style="--d: 0.2s" v-html="note.html"/>

    <div class="meta rise" style="--d: 0.26s">
      <LinkPill label="all notes" sigil="←" href="/notes"/>
      <span class="sep" aria-hidden="true"/>
      <span class="year">{{ year }}</span>
    </div>
  </article>
</template>

<style scoped>
.note {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
}

.status {
  word-break: break-all;
}

.title {
  margin: 0;
  font-size: var(--fs-title);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
  text-wrap: balance;
}

/* Date · tags, in the footer's small caps voice. */
.stamp {
  margin: var(--space-2xs) 0 0;
  font-size: var(--fs-micro);
  letter-spacing: 0.18em;
  color: rgba(245, 245, 245, 0.42);
  font-variant-numeric: tabular-nums;
}

/* The draft stamp glows in the accent, so it can't be mistaken for a tag. */
.draft {
  color: var(--mesh-color, rgba(245, 245, 245, 0.7));
}

.prose {
  margin-top: var(--space-md);
}

.meta {
  margin-top: auto;
  padding-top: var(--space-md);
}
</style>

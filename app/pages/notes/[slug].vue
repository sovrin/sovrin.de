<script setup lang="ts">
import type {Note, NoteMeta} from '~~/server/utils/notes'

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

// The next note to read: the one before this, or, from the oldest (or a
// draft), the newest. Same key as NoteList, so it's one request.
const {data: notes} = await useFetch<NoteMeta[]>('/api/notes', {key: 'notes', default: () => []})
const next = computed(() => {
  const others = notes.value.filter((n) => n.slug !== slug)
  return others.find((n) => n.date < note.value!.date) ?? others[0]
})

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
  <article v-if="note" class="sheet note">
    <header class="head">
      <NuxtLink class="back" to="/notes"><span aria-hidden="true">←</span> Notes</NuxtLink>
      <h1>{{ note.title }}</h1>
      <p v-if="note.description" class="dek">{{ note.description }}</p>
    </header>

    <div class="body">
      <dl class="facts">
        <div>
          <dt>By</dt>
          <dd><NuxtLink to="/" rel="author">{{ name }}</NuxtLink></dd>
        </div>
        <div>
          <dt>Published</dt>
          <dd><time :datetime="note.date">{{ day(note.date) }}</time></dd>
        </div>
        <div v-if="note.tags.length">
          <dt>About</dt>
          <dd>{{ note.tags.join(', ') }}</dd>
        </div>
        <div v-if="note.draft">
          <dt>Status</dt>
          <dd><span class="badge" data-tone="warning">{{ note.slug.startsWith('_') ? 'unlisted' : 'draft' }}</span></dd>
        </div>
      </dl>
      <div class="prose" v-html="note.html"/>
    </div>

    <nav v-if="next" class="next" aria-label="Next note">
      <span>Read next</span>
      <NuxtLink :to="`/notes/${next.slug}`">{{ next.title }}<span aria-hidden="true">→</span></NuxtLink>
    </nav>
  </article>
</template>

<style scoped>
/* The title at the section heads' size, across the page; the note itself
   split 5:7 below it like the rest of the site: the facts held on the left,
   the prose over the pictures' column. */
.head {
  display: grid;
  justify-items: start;
  gap: var(--ae-space-5);
  padding-block-end: var(--ae-space-7);
}

h1 {
  margin: 0;
  max-inline-size: 16ch;
  font-size: clamp(2.75rem, 6vw, 5.5rem);
  font-weight: 650;
  letter-spacing: -0.05em;
  line-height: 0.95;
  text-wrap: balance;
}

.dek {
  margin: 0;
  max-inline-size: 36ch;
  font-size: clamp(1.15rem, 1.5vw, 1.4rem);
  letter-spacing: -0.015em;
  line-height: 1.35;
  color: color-mix(in oklch, var(--ae-text) 82%, transparent);
  text-wrap: pretty;
}

.body,
.next {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: var(--ae-space-5) var(--ae-space-6);
  padding-block-start: var(--ae-space-5);
  border-block-start: 1px solid var(--ae-border);
}

.facts {
  position: sticky;
  top: var(--ae-space-6);
  align-self: start;
  display: grid;
  grid-template-columns: none;
  gap: var(--ae-space-4);
  margin: 0;
  font-family: var(--ae-font-mono);
  font-size: var(--ae-text-s);
}

.facts div {
  display: grid;
  gap: var(--ae-space-1);
}

.facts dt {
  font-weight: 400;
  color: var(--ae-text-muted);
}

.facts dd {
  margin: 0;
}

.facts a {
  color: var(--ae-text);
  text-decoration: none;
  transition: color 160ms ease-out;
}

.prose {
  max-inline-size: var(--ae-measure);
}

.prose > :first-child {
  margin-block-start: 0;
}

/* The way on, set like a note in the list: one target, its arrow in yellow. */
.next {
  position: relative;
  margin-block-start: var(--ae-space-8);
  align-items: baseline;
}

.next > span {
  font-family: var(--ae-font-mono);
  font-size: var(--ae-text-s);
  color: var(--ae-text-muted);
}

.next a {
  max-inline-size: 20ch;
  font-size: clamp(var(--ae-text-2xl), 3.2vw, var(--ae-text-4xl));
  font-weight: 650;
  letter-spacing: -0.045em;
  line-height: 1;
  color: var(--ae-text);
  text-decoration: none;
  text-wrap: balance;
  transition: color 200ms ease-out;
}

.next a span {
  margin-inline-start: 0.3em;
  color: var(--wall);
}

.next a::before {
  content: '';
  position: absolute;
  inset: 0;
}

.next a:focus-visible {
  outline: none;
}

.next a:focus-visible::before {
  outline: 2px solid var(--wall);
  outline-offset: 4px;
}

@media (hover: hover) and (pointer: fine) {
  .facts a:hover,
  .next:hover a {
    color: var(--wall);
  }
}

@media (width < 52rem) {
  .body,
  .next {
    grid-template-columns: 1fr;
  }

  /* Narrow: the facts a line above the prose, not a column beside it. */
  .facts {
    position: static;
    display: flex;
    flex-wrap: wrap;
    gap: var(--ae-space-3) var(--ae-space-5);
  }
}
</style>

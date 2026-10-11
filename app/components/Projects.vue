<script setup lang="ts">
import type {Project} from '~~/server/api/projects.get'

// SSR-fetched from our own cached endpoint, so the list is in the initial HTML
// but the GitHub call itself lives server-side (cached), never in the bundle.
const {data: projects} = await useFetch<Project[]>('/api/projects', {
  default: () => [],
})

// Screenshots of deployed projects, app/assets/work/<repo>.jpg. A project with
// one leads the section as a feature; the rest are rows. Resolved at build time,
// so there is never a broken image for a repo without a shot.
const shots = Object.fromEntries(
  Object.entries(import.meta.glob<string>('~/assets/work/*.jpg', {eager: true, import: 'default'}))
    .map(([path, src]) => [path.split('/').pop()!.replace(/\.jpg$/, ''), src]),
)
const featured = computed(() => projects.value.filter((p) => p.homepage && shots[p.name]))
const rest = computed(() => projects.value.filter((p) => !featured.value.includes(p)))

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`

// Coarse "last touched" stamp; day granularity keeps SSR and client in sync.
function relTime(iso: string): string {
  const then = Date.parse(iso)
  if (!then) return ''
  const days = Math.floor((Date.now() - then) / 86_400_000)
  if (days <= 0) return 'today'
  if (days < 7) return plural(days, 'day')
  if (days < 30) return plural(Math.floor(days / 7), 'week')
  if (days < 365) return plural(Math.floor(days / 30), 'month')
  return plural(Math.floor(days / 365), 'year')
}
</script>

<template>
  <section v-if="projects.length" aria-labelledby="work">
    <div class="sheet-head">
      <h2 id="work">Work</h2>
      <span>latest pushes on GitHub</span>
    </div>

    <ul v-if="featured.length" class="showcase">
      <li v-for="p in featured" :key="p.name" class="feature">
        <a :href="p.homepage!" target="_blank" rel="noreferrer">
          <img :src="shots[p.name]" :alt="`${p.name}, the live site`" width="1200" height="750" loading="lazy">
          <strong>{{ p.name }}</strong>
          <span class="sr-only"> (live site, opens in a new tab)</span>
        </a>
        <span v-if="p.description" class="desc">{{ p.description }}</span>
        <span class="meta">
          <a :href="p.url" target="_blank" rel="noreferrer">source<span class="sr-only"> on GitHub (opens in a new tab)</span></a>, {{ relTime(p.pushedAt) }}
        </span>
      </li>
    </ul>

    <ul class="entries" data-cols="2">
      <li v-for="p in rest" :key="p.name" class="entry">
        <a class="title" :href="p.url" target="_blank" rel="noreferrer">
          {{ p.name }}<span class="sr-only"> (opens in a new tab)</span>
        </a>
        <span v-if="p.description" class="desc">{{ p.description }}</span>
        <span class="meta">
          <a v-if="p.homepage" class="live" :href="p.homepage" target="_blank" rel="noreferrer">
            live ↗<span class="sr-only"> {{ p.name }} site (opens in a new tab)</span>
          </a>
          <span v-else-if="p.language">{{ p.language }}</span>
          <span>{{ relTime(p.pushedAt) }}</span>
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.showcase {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: var(--ae-space-6) var(--ae-space-5);
  margin: var(--ae-space-5) 0 var(--ae-space-6);
  padding: 0;
  list-style: none;
}

.feature {
  display: grid;
  align-content: start;
  gap: var(--ae-space-2);
}

.feature > a {
  display: grid;
  gap: var(--ae-space-3);
  color: var(--ae-text);
  text-decoration: none;
}

.feature img {
  display: block;
  inline-size: 100%;
  block-size: auto;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  object-position: top left;
  border-radius: var(--ae-radius-m);
  box-shadow: var(--ae-shadow-m);
  /* Dark screenshots on a dark page need an edge of their own. */
  outline: 1px solid var(--ae-border);
  outline-offset: -1px;
  transition: transform 600ms cubic-bezier(0.16, 1, 0.3, 1);
}

.feature strong {
  font-size: var(--ae-text-xl);
  font-weight: 600;
  letter-spacing: -0.03em;
  transition: color 160ms ease-out;
}

@media (hover: hover) and (pointer: fine) {
  .feature > a:hover img {
    transform: scale(1.02);
  }

  .feature > a:hover strong {
    color: var(--ae-accent-ink);
  }
}

@media (prefers-reduced-motion: reduce) {
  .feature img {
    transition: none;
  }
}

.feature .desc {
  color: var(--ae-text-muted);
}

.feature .meta {
  font-family: var(--ae-font-mono);
  font-size: var(--ae-text-s);
  color: var(--ae-text-muted);
}

.feature .meta a {
  color: inherit;
}

/* Raised above the row's stretched repo link (links can't nest). */
.live {
  position: relative;
  z-index: 1;
  color: var(--ae-accent-ink);
  text-decoration: none;
}

.live:hover {
  text-decoration: underline;
}
</style>

<script setup lang="ts">
import type {Project} from '~~/server/api/projects.get'

// SSR-fetched from our own cached endpoint, so the list is in the initial HTML
// but the GitHub call itself lives server-side (cached), never in the bundle.
const {data: projects} = await useFetch<Project[]>('/api/projects', {
  default: () => [],
})

// Coarse "last touched" stamp — day granularity keeps SSR and client in sync.
function relTime(iso: string): string {
  const then = Date.parse(iso)
  if (!then) return ''
  const days = Math.floor((Date.now() - then) / 86_400_000)
  if (days <= 0) return 'today'
  if (days < 7) return `${days}d`
  if (days < 30) return `${Math.floor(days / 7)}w`
  if (days < 365) return `${Math.floor(days / 30)}mo`
  return `${Math.floor(days / 365)}y`
}

// Display form of a deployed URL: bare host + path, no scheme or trailing slash.
function bareUrl(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}
</script>

<template>
  <section v-if="projects.length" class="projects" aria-label="Latest projects">
    <Prompt class="head">ls ~/projects</Prompt>

    <ul class="list">
      <li v-for="p in projects" :key="p.name" class="project">
        <span class="row">
          <a class="repo" :href="p.url" target="_blank" rel="noreferrer">
            <span class="name">{{ p.name }}</span>
            <span class="sr-only"> (opens in a new tab)</span>
          </a>
          <span class="leader" aria-hidden="true"/>
          <span class="stats">
            <span v-if="p.language" class="lang">{{ p.language }}</span>
            <span v-if="p.stars" class="stars">★ {{ p.stars }}</span>
            <span class="when">{{ relTime(p.pushedAt) }}</span>
          </span>
        </span>
        <span v-if="p.description || p.homepage" class="sub">
          <span v-if="p.description" class="desc">{{ p.description }}</span>
          <a v-if="p.homepage" class="live" :href="p.homepage" target="_blank" rel="noreferrer">
            <svg class="sigil" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>{{ bareUrl(p.homepage) }}
            <span class="sr-only"> (live site, opens in a new tab)</span>
          </a>
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.projects {
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

/* The repo link is stretched over the whole item (::before), so the row stays
   one click target while the live link can sit on top of it — links can't nest. */
.project {
  position: relative;
  padding: var(--space-3xs) 0;
}

.repo::before {
  content: '';
  position: absolute;
  inset: 0;
}

.row {
  display: flex;
  align-items: baseline;
  gap: var(--space-2xs);
}

.name {
  position: relative;
  font-family: var(--font-sans);
  font-size: var(--fs-body);
  font-weight: 500;
  letter-spacing: -0.01em;
  color: rgba(245, 245, 245, 0.86);
  transition: color 0.2s ease;
}

/* Accent underline wipes in on hover, mirroring the link pills. */
.name::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.2em;
  height: 1px;
  background: var(--mesh-color, rgba(245, 245, 245, 0.7));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.24s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.project:hover:not(:has(.live:hover)) .name,
.project:has(.repo:focus-visible) .name {
  color: #f5f5f5;
}

.project:hover:not(:has(.live:hover)) .name::after,
.project:has(.repo:focus-visible) .name::after {
  transform: scaleX(1);
}

/* Ring the whole item rather than just the name the link wraps. */
.repo:focus-visible {
  outline: none;
}

.project:has(.repo:focus-visible) {
  outline: 2px solid rgba(245, 245, 245, 0.5);
  outline-offset: 3px;
  border-radius: 2px;
}

/* Dotted index leader bridging name → metadata; warms to the accent on hover. */
.leader {
  flex: 1 1 auto;
  align-self: baseline;
  height: 0;
  transform: translateY(-0.28em);
  border-bottom: 1px dotted rgba(245, 245, 245, 0.16);
  transition: border-color 0.24s ease;
}

.project:hover:not(:has(.live:hover)) .leader,
.project:has(.repo:focus-visible) .leader {
  border-bottom-color: color-mix(in oklab, var(--mesh-color, #b5842a) 55%, transparent);
}

.stats {
  flex: 0 0 auto;
  display: flex;
  align-items: baseline;
  gap: var(--space-2xs);
  font-family: var(--font-mono);
  font-size: var(--fs-micro);
  letter-spacing: 0.06em;
  color: rgba(245, 245, 245, 0.42);
}

.stars {
  color: var(--mesh-color, rgba(245, 245, 245, 0.5));
}

/* Right-most, dimmest column — a quiet "last touched" signal. */
.when {
  color: rgba(245, 245, 245, 0.3);
  font-variant-numeric: tabular-nums;
}

/* Description left, live link right under the stats column. space-between
   (not margin-left: auto) so a link that wraps onto its own line sits left. */
.sub {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-3xs) var(--space-sm);
  margin-top: var(--space-3xs);
}

.desc {
  flex: 0 1 auto;
  max-width: 52ch;
  font-size: var(--fs-pill);
  line-height: 1.5;
  color: rgba(245, 245, 245, 0.5);
  text-wrap: pretty;
}

/* Deployed site — raised above the stretched repo link. */
.live {
  position: relative;
  z-index: 1;
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
  font-family: var(--font-mono);
  font-size: var(--fs-micro);
  letter-spacing: 0.06em;
  color: rgba(245, 245, 245, 0.5);
  transition: color 0.2s ease;
}

/* Chain glyph as inline SVG — Liberation Mono has none, and the Unicode ones
   fall back to colour emoji. */
.live .sigil {
  flex: none;
  width: 1.1em;
  height: 1.1em;
  fill: none;
  stroke: var(--mesh-color, rgba(245, 245, 245, 0.5));
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.live:hover,
.live:focus-visible {
  color: #f5f5f5;
}

.live:focus-visible {
  outline: 2px solid rgba(245, 245, 245, 0.5);
  outline-offset: 3px;
  border-radius: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .live,
  .name::after,
  .leader {
    transition: none;
  }
}
</style>

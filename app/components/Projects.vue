<script setup lang="ts">
import type {Project} from '~~/server/api/projects.get'

// SSR-fetched from our own cached endpoint, so the list is in the initial HTML
// but the GitHub call itself lives server-side (cached), never in the bundle.
const {data: projects} = await useFetch<Project[]>('/api/projects', {
  default: () => [],
})
</script>

<template>
  <section v-if="projects.length" class="projects" aria-label="Latest projects">
    <div class="head">
      <span class="sigil" aria-hidden="true">$</span>
      <span class="cmd">ls ~/projects</span>
    </div>

    <ul class="list">
      <li v-for="p in projects" :key="p.name">
        <a class="project" :href="p.url" target="_blank" rel="noreferrer">
          <span class="row">
            <span class="name">{{ p.name }}</span>
            <span class="stats">
              <span v-if="p.language" class="lang">{{ p.language }}</span>
              <span v-if="p.stars" class="stars">★ {{ p.stars }}</span>
            </span>
          </span>
          <span v-if="p.description" class="desc">{{ p.description }}</span>
          <span class="sr-only"> (opens in a new tab)</span>
        </a>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.projects {
  margin-top: var(--space-md);
}

/* Machine-layer eyebrow, matching the `$ whoami` status line. */
.head {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  color: rgba(245, 245, 245, 0.5);
  margin-bottom: var(--space-2xs);
}

.head .sigil {
  margin-right: 0.4em;
  color: var(--mesh-color, rgba(245, 245, 245, 0.4));
  transition: color 0.8s ease;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.project {
  display: block;
  padding: var(--space-3xs) 0;
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

.project:hover .name,
.project:focus-visible .name {
  color: #f5f5f5;
}

.project:hover .name::after,
.project:focus-visible .name::after {
  transform: scaleX(1);
}

.project:focus-visible {
  outline: 2px solid rgba(245, 245, 245, 0.5);
  outline-offset: 3px;
  border-radius: 2px;
}

/* Thin rule keeps the name and its stats visually joined across the row. */
.stats {
  flex: 1;
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: var(--space-2xs);
  font-family: var(--font-mono);
  font-size: var(--fs-micro);
  letter-spacing: 0.06em;
  color: rgba(245, 245, 245, 0.42);
  min-width: 0;
}

.stars {
  color: var(--mesh-color, rgba(245, 245, 245, 0.5));
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

@media (prefers-reduced-motion: reduce) {
  .name::after {
    transition: none;
  }
}
</style>

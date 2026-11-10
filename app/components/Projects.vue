<script setup lang="ts">
import type {Project} from '~~/server/api/projects.get'

// SSR-fetched from our own cached endpoint, so the list is in the initial HTML
// but the GitHub call itself lives server-side (cached), never in the bundle.
const {data: projects} = await useFetch<Project[]>('/api/projects', {
  default: () => [],
})
// GitHub down or rate-limited with nothing cached: the section still points at the work.
const {github} = useAppConfig().portfolio

// Screenshots of deployed projects, app/assets/work/<repo>.jpg. Resolved at
// build time, so there is never a broken image for a repo without a shot.
const shots = Object.fromEntries(
  Object.entries(import.meta.glob<string>('~/assets/work/*.jpg', {eager: true, import: 'default'}))
    .map(([path, src]) => [path.split('/').pop()!.replace(/\.jpg$/, ''), src]),
)
const live = (p: Project) => Boolean(p.homepage && shots[p.name])

// A repo described as "<what> module for <repo>" belongs to that repo's card,
// as one family, instead of a row of near-twins.
const parentOf = (p: Project) => p.description?.match(/^(.+?) module for (\S+)$/)
const modules = (name: string) => projects.value.filter((p) => !live(p) && parentOf(p)?.[2] === name)
const listed = computed(() => projects.value.filter((p) => live(p) || !projects.value.some((q) => q.name === parentOf(p)?.[2])))

// Live sites and families get a card each, stacking as the page scrolls; the rest a directory of names.
const cards = computed(() => listed.value.filter((p) => live(p) || modules(p.name).length))
const rest = computed(() => listed.value.filter((p) => !cards.value.includes(p)))
const host = (url: string) => new URL(url).host
</script>

<template>
  <section aria-labelledby="work">
    <div class="sheet-head">
      <h2 id="work">Work</h2>
    </div>

    <p v-if="!projects.length" class="none">
      The list didn’t load just now. <a :href="github" target="_blank" rel="noreferrer">Everything is on GitHub</a>.
    </p>

    <ul v-if="cards.length" class="deck" data-variant="plain" :style="{'--n': cards.length}">
      <li v-for="(p, i) in cards" :key="p.name" class="proj" :style="{'--i': i}">
        <div class="text">
          <span class="lang">{{ [p.language, modules(p.name).length && `${modules(p.name).length} modules`].filter(Boolean).join(' · ') }}</span>
          <div>
            <h3>{{ p.name }}</h3>
            <p v-if="p.description">{{ p.description }}</p>
          </div>
          <a class="go" :href="live(p) ? p.homepage! : p.url" target="_blank" rel="noreferrer">
            {{ live(p) ? host(p.homepage!) : 'GitHub' }}<span aria-hidden="true">→</span><span class="sr-only"> {{ p.name }} (opens in a new tab)</span>
          </a>
        </div>
        <div v-if="live(p)" class="shot">
          <img :src="shots[p.name]" :alt="`The ${p.name} homepage`" width="1200" height="750" loading="lazy">
        </div>
        <ul v-else class="mods" data-variant="plain">
          <li v-for="m in modules(p.name)" :key="m.name">
            <a :href="m.url" target="_blank" rel="noreferrer">{{ m.name }}<span class="sr-only"> (opens in a new tab)</span></a>
            <span>{{ parentOf(m)![1] }}</span>
          </li>
        </ul>
      </li>
    </ul>

    <ul v-if="rest.length" class="rest" data-variant="plain">
      <li v-for="p in rest" :key="p.name">
        <a :href="p.url" target="_blank" rel="noreferrer">{{ p.name }}<span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>
        <p v-if="p.description">{{ p.description }}</p>
        <span class="meta">{{ [p.language, month(p.pushedAt)].filter(Boolean).join(' · ') }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.deck {
  display: grid;
  gap: var(--ae-space-5);
  margin: var(--ae-space-7) 0 0;
}

/* Each card sticks a little lower than the last, so as the page scrolls they
   pile up with an edge of each showing. Their own list ends before the row
   below, so the last card lets go before it reaches it. The link is stretched
   over the card (::before); the module links are raised above it. */
.proj {
  position: sticky;
  top: calc(var(--ae-space-6) + var(--i) * var(--ae-space-5));
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: var(--ae-space-6);
  min-block-size: min(32rem, 80svh);
  box-sizing: border-box;
  padding: clamp(var(--ae-space-5), 3vw, var(--ae-space-7));
  overflow: hidden;
  border-radius: var(--ae-radius-l);
  background: color-mix(in oklch, var(--ae-text) 5%, var(--ae-bg));
  box-shadow: 0 -1.5rem 3rem -1.5rem rgb(0 0 0 / 0.7), inset 0 0 0 1px var(--ae-border);
}

/* The first card in the yellow. */
.proj:first-child {
  --ae-text: var(--wall-ink);
  --ae-text-muted: color-mix(in oklch, var(--wall-ink) 65%, transparent);
  background: var(--wall);
  color: var(--wall-ink);
  box-shadow: 0 -1.5rem 3rem -1.5rem rgb(0 0 0 / 0.7);
}

.text {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--ae-space-6);
}

.lang {
  font-family: var(--ae-font-mono);
  font-size: var(--ae-text-s);
  color: var(--ae-text-muted);
}

h3 {
  margin: 0 0 var(--ae-space-3);
  font-size: clamp(2.5rem, 5vw, 4.75rem);
  font-weight: 650;
  letter-spacing: -0.055em;
  line-height: 0.9;
  color: var(--ae-text);
}

.text p {
  margin: 0;
  max-inline-size: 26ch;
  font-size: var(--ae-text-m);
  text-wrap: pretty;
}

.go {
  align-self: start;
  font-weight: 550;
  color: var(--ae-text);
  text-decoration: none;
}

.go::before {
  content: '';
  position: absolute;
  inset: 0;
}

.go:focus-visible {
  outline: none;
}

.go:focus-visible::before {
  outline: 2px solid var(--wall);
  outline-offset: -4px;
  border-radius: inherit;
}

.go span[aria-hidden] {
  display: inline-block;
  margin-inline-start: 0.4em;
  transition: translate 400ms var(--ae-ease);
}

.shot {
  align-self: center;
  overflow: hidden;
  border-radius: var(--ae-radius-m);
  box-shadow: 0 2rem 4rem -1.5rem rgb(0 0 0 / 0.6);
}

.shot img {
  display: block;
  inline-size: 100%;
  block-size: auto;
  transition: scale 1s var(--ae-ease);
}

.mods {
  align-self: center;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--ae-space-2);
  margin: 0;
}

.mods li {
  display: grid;
  gap: var(--ae-space-1);
  padding: var(--ae-space-4);
  border-radius: var(--ae-radius-m);
  background: color-mix(in oklch, var(--ae-text) 6%, transparent);
}

.mods a {
  position: relative;
  z-index: 1;
  justify-self: start;
  font-size: var(--ae-text-m);
  font-weight: 550;
  color: var(--wall);
  text-decoration: none;
}

.proj:first-child .mods a {
  color: var(--wall-ink);
}

.mods span {
  font-size: var(--ae-text-s);
  color: var(--ae-text-muted);
}

/* The rest as a directory: three across, each a name, what it is and when it
   last moved, under one hairline a row. Names in the cards' voice, smaller. */
.rest {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
  gap: var(--ae-space-7) var(--ae-space-6);
  margin: var(--ae-space-8) 0 0;
}

.rest li {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--ae-space-2);
  padding-block-start: var(--ae-space-4);
  border-block-start: 1px solid var(--ae-border);
}

.rest a {
  align-self: start;
  font-size: var(--ae-text-2xl);
  font-weight: 650;
  letter-spacing: -0.045em;
  line-height: 1.05;
  color: var(--ae-text);
  text-decoration: none;
  transition: color 200ms ease-out;
}

.rest a span[aria-hidden] {
  display: inline-block;
  margin-inline-start: 0.2em;
  font-size: 0.7em;
  color: var(--wall);
  opacity: 0;
  translate: -0.2em 0.2em;
  transition: opacity 200ms ease-out, translate 400ms var(--ae-ease);
}

.rest a::before {
  content: '';
  position: absolute;
  inset: 0;
}

.rest a:focus-visible {
  outline: none;
}

.rest a:focus-visible::before {
  outline: 2px solid var(--wall);
  outline-offset: 4px;
}

.rest p {
  margin: 0;
  max-inline-size: 34ch;
  color: var(--ae-text-muted);
  text-wrap: pretty;
}

/* The language and month last, at the foot, so a row's metas line up. */
.rest .meta {
  margin-block-start: auto;
  padding-block-start: var(--ae-space-3);
  font-family: var(--ae-font-mono);
  font-size: var(--ae-text-s);
  color: var(--ae-text-muted);
}

@media (hover: hover) and (pointer: fine) {
  .rest li:hover a,
  .mods a:hover {
    color: var(--wall);
  }

  .rest li:hover a span[aria-hidden] {
    opacity: 1;
    translate: 0 0;
  }

  .mods a:hover {
    text-decoration: underline;
  }
}

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .proj:hover .shot img {
    scale: 1.04;
  }

  .proj:hover .go span[aria-hidden] {
    translate: 0.35rem 0;
  }
}

/* Covered cards recede, one step per card on top, so the pile reads as depth:
   card i narrows from when it sticks until the last one does. Scroll-linked, so
   it runs off the main thread and simply stays flat where unsupported. */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .deck {
      view-timeline: --deck block;
    }

    .proj {
      --to: calc(1 - (var(--n) - 1 - var(--i)) * 0.03);
      transform-origin: 50% 0;
      animation: recede linear both;
      animation-timeline: --deck;
      animation-range: exit-crossing calc(var(--i) / var(--n) * 100%) exit-crossing calc((var(--n) - 1) / var(--n) * 100%);
    }

    .proj:last-child {
      animation: none;
    }

    /* As a card comes up, its picture settles in its frame the way his head
       does in the greeting, and its words lift in: tied to the scroll, so it
       runs back too. The picture uses transform, the hover zoom scale, so the
       two add up instead of the hover being held off. */
    .proj {
      view-timeline: --card block;
    }

    .shot img {
      animation: settle linear both;
      animation-timeline: --card;
      animation-range: entry 0% entry 100%;
    }

    .text > *,
    .mods {
      animation: lift linear both;
      animation-timeline: --card;
      animation-range: entry 25% entry 100%;
    }
  }
}

@keyframes settle {
  from {
    transform: scale(1.12);
  }
}

@keyframes lift {
  from {
    opacity: 0;
    transform: translateY(1.5rem);
  }
}

@keyframes recede {
  to {
    scale: var(--to);
  }
}

@media (width < 52rem) {
  .proj {
    grid-template-columns: 1fr;
    min-block-size: 0;
  }

  .mods {
    grid-template-columns: 1fr;
  }
}

.none {
  margin: var(--ae-space-5) 0 0;
  color: var(--ae-text-muted);
}
</style>

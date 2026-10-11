<script setup lang="ts">
// The frame every page sits in: the "wall", a sticky column in the photo's own
// yellow with the photo set into it as a duotone, the name and how to reach him;
// beside it the dark main column the pages fill. Mounted once by app.vue and
// again by error.vue, which replaces the shell. The name is the home page's h1;
// elsewhere it links home and the page brings its own h1. Only home shows the
// photo: elsewhere the wall is just the name and how to reach him.
import photo from '~/assets/me.jpg'

const {portfolio} = useAppConfig()
const {name, about, email, github, linkedin} = portfolio
const year = new Date().getFullYear()
const home = computed(() => useRoute().path === '/')
</script>

<template>
  <div class="site">
    <aside class="wall" aria-label="About">
      <img v-if="home" class="photo" :src="photo" :alt="name" width="1600" height="1344" fetchpriority="high">
      <div class="intro">
        <h1 v-if="home" class="name rise">{{ name }}</h1>
        <p v-else class="name rise">
          <NuxtLink to="/">{{ name }}</NuxtLink>
        </p>
        <p class="about rise" style="--i: 1">{{ about }}</p>
        <div class="reach rise" style="--i: 2">
          <a :href="`mailto:${email}`">Email me</a>
          <a :href="github" target="_blank" rel="noreferrer">GitHub</a>
          <a :href="linkedin" target="_blank" rel="noreferrer">LinkedIn</a>
        </div>
      </div>
    </aside>

    <main class="content">
      <slot/>
      <footer class="foot">
        <a :href="`mailto:${email}`">{{ email }}</a>
        <span>{{ year }}</span>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.site {
  display: grid;
  grid-template-columns: minmax(24rem, 1fr) 1.618fr;
  min-block-size: 100dvh;
}

.wall {
  position: sticky;
  top: 0;
  block-size: 100dvh;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  overflow: hidden;
  background: var(--wall);
  color: var(--wall-ink);
}

/* Set into the wall as a duotone: greyscale, multiplied onto the yellow. */
.photo {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  min-block-size: 0;
  object-fit: cover;
  object-position: 45% 65%;
  filter: grayscale(1) contrast(1.15);
  mix-blend-mode: multiply;
}

.intro {
  align-self: end;
  display: grid;
  gap: var(--ae-space-4);
  padding: var(--ae-space-5) var(--ae-space-6) var(--ae-space-6);
}

.name {
  margin: 0;
  font-size: clamp(2.75rem, 4.6vw, 4.5rem);
  font-weight: 700;
  letter-spacing: -0.055em;
  line-height: 0.92;
  text-wrap: balance;
  color: var(--wall-ink);
}

.name a {
  color: inherit;
  text-decoration: underline;
  text-decoration-thickness: 0.05em;
  text-underline-offset: 0.12em;
}

.name a:hover {
  text-decoration-thickness: 0.1em;
}

.about {
  margin: 0;
  max-inline-size: 34ch;
  font-size: var(--ae-text-m);
  color: color-mix(in oklch, var(--wall-ink) 80%, transparent);
}

.reach {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ae-space-2);
}

/* Ink on yellow: the first action solid, the rest outlined; hover fills. */
.reach a {
  padding: var(--ae-space-2) var(--ae-space-4);
  font-weight: 500;
  color: var(--wall-ink);
  text-decoration: none;
  box-shadow: inset 0 0 0 1.5px var(--wall-ink);
  transition: background-color 160ms ease-out, color 160ms ease-out;
}

.reach a:first-child,
.reach a:hover {
  background: var(--wall-ink);
  color: var(--wall);
}

/* aequitas' ring and selection are the accent, which is the wall itself. */
.wall a:focus-visible {
  outline: 2px solid var(--wall-ink);
  outline-offset: 2px;
}

.wall ::selection {
  background: var(--wall-ink);
  color: var(--wall);
}

.content {
  display: grid;
  align-content: start;
  gap: var(--ae-space-8);
  padding: var(--ae-space-7) var(--ae-space-7) var(--ae-space-6);
}

.foot {
  display: flex;
  justify-content: space-between;
  padding-block-start: var(--ae-space-5);
  border-block-start: 1px solid var(--ae-border);
  font-family: var(--ae-font-mono);
  font-size: var(--ae-text-s);
  color: var(--ae-text-muted);
}

.foot a {
  color: inherit;
  text-decoration: none;
  transition: color 160ms ease-out;
}

.foot a:hover {
  color: var(--ae-text);
}

/* The wall becomes a band on top and the page scrolls as one column. */
@media (max-width: 56rem) {
  .site {
    grid-template-columns: 1fr;
    align-content: start;
  }

  .wall {
    position: static;
    block-size: auto;
    grid-template-rows: none;
  }

  .photo {
    block-size: 18rem;
  }

  .intro {
    padding: var(--ae-space-5);
  }

  .content {
    padding: var(--ae-space-6) var(--ae-space-5);
    gap: var(--ae-space-7);
  }
}
</style>

<script setup lang="ts">
// The frame every page sits in: a slim nav (the mark leads home), the dark
// column the pages fill, and the yellow footer that opens on the one place to
// write to him, large, before the Score. Mounted once by app.vue and again by error.vue, which
// replaces the shell. Each page brings its own h1.
import geist from 'aequitas/fonts/geist-latin-wght-normal.woff2?url'
import geistMono from 'aequitas/fonts/geist-mono-latin-wght-normal.woff2?url'

// aequitas only uses its fonts if they're in by first paint (font-display:
// optional), and the stylesheet alone finds them too late: fetch them with it.
useHead({
  link: [geist, geistMono].map((href) => ({rel: 'preload', as: 'font', type: 'font/woff2', href, crossorigin: ''})),
})

const {name} = useAppConfig().portfolio
const email = useEmail()
const year = new Date().getFullYear()
</script>

<template>
  <div class="site arrive">
    <a class="skip-link" href="#content">Skip to content</a>
    <nav class="bar" aria-label="Site">
      <NuxtLink to="/" class="mark" aria-label="Home"><img src="/favicon.svg" alt="" width="36" height="36"></NuxtLink>
    </nav>

    <main id="content" class="content">
      <slot/>
    </main>

    <footer class="foot">
      <div class="foot-in">
        <a class="mail" :href="`mailto:${email}`">{{ email }}</a>
        <Score/>
        <p class="small">© {{ year }} {{ name }}</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.site {
  position: relative;
  display: flex;
  flex-direction: column;
  min-block-size: 100dvh;
  /* A leaving page keeps its width (app.vue) while it fades over the next. */
  overflow-x: clip;
}

.bar {
  box-sizing: border-box;
  inline-size: 100%;
  max-inline-size: var(--page);
  margin-inline: auto;
  padding: var(--ae-space-5) var(--gutter);
}

.mark {
  display: inline-block;
}

.mark img {
  display: block;
  border-radius: var(--ae-radius-s);
}

/* Pages crossfade in one cell: the leaving page out of flow, so the column
   takes the arriving page's height at once instead of jumping when it goes. */
.content {
  flex: 1;
  position: relative;
  display: grid;
  align-content: start;
}

.content > :deep(*) {
  grid-area: 1 / 1;
}

.content > :deep(.page-leave-active) {
  position: absolute;
}

/* Yellow at the bottom of every page: the one place to write to him, as loud
   as the headline, then the Score (a melody every visitor writes together),
   then the small print. */
.foot {
  margin-block-start: calc(var(--ae-space-8) * 1.618);
  background: var(--wall);
  color: var(--wall-ink);
}

.foot-in {
  display: grid;
  gap: var(--ae-space-5);
  max-inline-size: var(--page);
  margin-inline: auto;
  padding: clamp(var(--ae-space-7), 7vw, 6rem) var(--gutter) var(--ae-space-6);
}

.foot a {
  color: inherit;
}

.mail {
  justify-self: start;
  margin-block-end: var(--ae-space-4);
  font-size: clamp(2rem, 7.5vw, 5.5rem);
  font-weight: 650;
  letter-spacing: -0.045em;
  line-height: 1;
  overflow-wrap: anywhere;
  text-decoration: underline;
  text-decoration-thickness: 0.06em;
  text-decoration-color: color-mix(in oklch, currentColor 30%, transparent);
  text-underline-offset: 0.12em;
  transition: text-decoration-color 160ms ease-out;
}

.small {
  margin: 0;
  font-family: var(--ae-font-mono);
  font-size: var(--ae-text-s);
}

.foot a:focus-visible {
  outline: 2px solid var(--wall-ink);
  outline-offset: 4px;
}

.foot ::selection {
  background: var(--wall-ink);
  color: var(--wall);
}

@media (hover: hover) and (pointer: fine) {
  .mail:hover {
    text-decoration-color: currentColor;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mail {
    transition: none;
  }
}
</style>

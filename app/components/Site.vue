<script setup lang="ts">
// The frame every page sits in: the "wall", a sticky column of yellow with the
// photo set into it as a duotone, the name and how to reach him;
// beside it the dark main column the pages fill. Mounted once by app.vue and
// again by error.vue, which replaces the shell. The name is the home page's h1.
// Only home introduces him: elsewhere the wall narrows to a rail holding a way
// back, so a reader gets the width, and the page brings its own h1.
import photo from '~/assets/me.jpg'

const {portfolio} = useAppConfig()
const {name, about, mailbox, github, linkedin} = portfolio
// The address follows whichever domain serves the site, so one build works on all of them.
const email = `${mailbox}@${useRequestURL({xForwardedHost: true}).hostname.replace(/^www\./, '')}`
const year = new Date().getFullYear()
const route = useRoute()
const home = computed(() => route.path === '/')
const up = computed(() => route.path.startsWith('/notes/') ? '/notes' : '/')
// .home remounts on every return, and would replay the load-in each time.
const intro = ref(true)
watch(home, () => {
  intro.value = false
}, {once: true})
</script>

<template>
  <div class="site" :class="{rail: !home}">
    <a class="skip-link" href="#content">Skip to content</a>
    <header class="wall">
      <Transition name="slide">
        <div v-if="home" class="home">
          <div class="portrait">
            <img class="photo" :src="photo" :alt="name" width="2000" height="1533" fetchpriority="high">
          </div>
          <div class="intro">
            <h1 class="name" :class="{rise: intro}">{{ name }}</h1>
            <p class="about" :class="{rise: intro}" style="--i: 1">{{ about }}</p>
            <div class="reach" :class="{rise: intro}" style="--i: 2">
              <a :href="`mailto:${email}`">Email me</a>
              <a :href="github" target="_blank" rel="noreferrer">GitHub</a>
              <a :href="linkedin" target="_blank" rel="noreferrer">LinkedIn</a>
            </div>
          </div>
        </div>
      </Transition>
      <Transition name="up">
        <nav v-if="!home" class="up" aria-label="Back">
          <NuxtLink :to="up" :class="{deep: up !== '/'}" :aria-label="up === '/' ? 'Home' : 'Notes'">
            <span class="plate" aria-hidden="true">
              <span>←</span>
              <span class="word"><span class="strip"><span>Home</span><span>Notes</span></span></span>
            </span>
          </NuxtLink>
        </nav>
      </Transition>
    </header>

    <main id="content" class="content rise" :style="{'--i': home ? 3 : 0}">
      <div class="pages">
        <slot/>
      </div>
      <footer class="foot">
        <a :href="`mailto:${email}`">{{ email }}</a>
        <span>{{ year }}</span>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.site {
  /* 1 : φ, as a length so the rail's track can ease from it and the home
     content can keep this width while the track narrows under it. */
  --home: max(24rem, 38.2vw);
  --rail: 14rem;
  /* For the main column to size itself to the whole site (cqi). */
  container-type: inline-size;
  display: grid;
  grid-template-columns: var(--home) 1fr;
  min-block-size: 100dvh;
  /* A leaving page keeps its width (app.vue), so a note fading out over home's
     narrower column runs past the window. Clip, not hidden: no scroll container,
     so the wall stays sticky. */
  overflow-x: clip;
}

.wall {
  position: sticky;
  top: 0;
  block-size: 100dvh;
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  overflow: hidden;
  background: var(--wall);
  color: var(--wall-ink);
}

/* Home and rail content share one cell, so one can leave while the other comes. */
.wall > * {
  grid-area: 1 / 1;
}

/* Pinned to the wall's right edge at its home width: as the track narrows,
   it slides out to the left instead of squeezing. */
.home {
  inline-size: var(--home);
  /* justify-self: end would fall back to the start once it overflows. */
  margin-inline-start: calc(100% - var(--home));
  /* The slide's translate isolates this box, and the photo can only multiply
     with what's inside it: without its own yellow, it turns grey mid-slide. */
  background: var(--wall);
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
}

/* The whole rail is the way back: the link is stretched over it (::before),
   so the yellow is one target and the plate only labels it. */
.up {
  position: relative;
  display: flex;
  align-items: end;
  /* The home intro's inset, so the plate sits where its buttons did. */
  padding: var(--ae-space-6);
  transition: background-color 160ms ease-out;
}

.up a {
  color: var(--wall-ink);
  text-decoration: none;
}

.up a::before {
  content: '';
  position: absolute;
  inset: 0;
}

/* Real pointers only: a tap on touch would leave the rail stuck 'hovered'. */
@media (hover: hover) and (pointer: fine) {
  .up:hover {
    background: color-mix(in oklch, var(--wall-ink) 6%, transparent);
  }
}

.plate {
  display: flex;
  gap: 0.4em;
}

/* Both words sit in a one-line window, stacked: going deeper rolls the next
   one up into view, going back rolls it down. Pure CSS, so it holds without JS,
   and the plate keeps one width. */
.word {
  block-size: 1lh;
  overflow: hidden;
}

.strip {
  display: grid;
  justify-items: center;
}

.deep .strip {
  translate: 0 -50%;
}

/* Set into the wall as a duotone: greyscale, multiplied onto the yellow. */
.photo {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  min-block-size: 0;
  object-fit: cover;
  /* He stands from 31% to 94% down the frame: anchored here, a box down to
     2:1 keeps him whole, losing the top of the wall rather than his feet. */
  object-position: 50% 84%;
  filter: grayscale(1) contrast(1.15);
  mix-blend-mode: multiply;
}

/* Sized by the wall, so the photo can ask how much of it there is. Containment
   isolates this box like the slide does .home, hence its own yellow. */
.portrait {
  position: relative;
  container-type: size;
  min-block-size: 0;
  background: var(--wall);
}

/* Multiply can only darken, so the photo's blacks land below the page's own.
   Lighten lifts them to exactly --ae-bg, where they run on into the dark
   column, and leaves the yellow, lighter in every channel, as it is. */
.portrait::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--ae-bg);
  mix-blend-mode: lighten;
}

/* Wider than 2:1, cover can't keep him whole: rather than a cut-off figure,
   the photo fades out and leaves the wall. */
@container (aspect-ratio > 2) {
  .photo {
    opacity: 0;
  }
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

.about {
  margin: 0;
  max-inline-size: 34ch;
  text-wrap: pretty;
  font-size: var(--ae-text-m);
  color: color-mix(in oklch, var(--wall-ink) 80%, transparent);
}

.reach {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ae-space-2);
}

/* Ink on yellow: the first action and the way back solid, the rest outlined;
   hover fills. */
.reach a,
.up .plate {
  padding: var(--ae-space-2) var(--ae-space-4);
  font-weight: 500;
  color: var(--wall-ink);
  text-decoration: none;
  box-shadow: inset 0 0 0 1.5px var(--wall-ink);
  transition: background-color 160ms ease-out, color 160ms ease-out, scale 160ms ease-out;
}

.reach a:first-child,
.up .plate {
  background: var(--wall-ink);
  color: var(--wall);
}

@media (hover: hover) and (pointer: fine) {
  .reach a:hover {
    background: var(--wall-ink);
    color: var(--wall);
  }
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

.rail {
  grid-template-columns: var(--rail) 1fr;
}

/* Leaving home the wall narrows and its content slides out left, the photo
   fading as it goes, while the way back comes in from the right; returning
   reverses it. The pages crossfade in the same time (main.css), so every part
   moves on one duration and one curve. */
@media (prefers-reduced-motion: no-preference) {
  .site {
    transition: grid-template-columns var(--ae-duration-slow) var(--ae-ease);
  }

  /* The narrowing track carries the home content only as far as the rail's
     width short of gone, so it travels that last rail width on its own and
     clears the wall as the track settles; then it is hidden. */
  .slide-enter-active,
  .slide-leave-active {
    transition: visibility var(--ae-duration-slow), translate var(--ae-duration-slow) var(--ae-ease);
  }

  .slide-enter-from,
  .slide-leave-to {
    translate: calc(-1 * var(--rail)) 0;
  }

  .slide-leave-to {
    visibility: hidden;
  }

  .photo {
    transition: opacity var(--ae-duration-slow) var(--ae-ease);
  }

  .slide-enter-from .photo,
  .slide-leave-to .photo {
    opacity: 0;
  }

  .up-enter-active,
  .up-leave-active {
    transition: translate var(--ae-duration-slow) var(--ae-ease);
  }

  .up-enter-from,
  .up-leave-to {
    translate: 100% 0;
  }

  .strip {
    transition: translate var(--ae-duration-slow) var(--ae-ease);
  }

  /* The back link presses its plate, not itself: scaling the link would shrink
     the stretched target under the pointer mid-click. */
  .reach a:active,
  .up a:active .plate {
    scale: 0.97;
  }
}

/* Off home every page is reading: one column at the prose measure, footer
   included. Set here, not per child, since the measure is in ch of each font. */
.rail .content {
  max-inline-size: calc(var(--ae-measure) + 2 * var(--ae-space-7));
}

.content {
  /* Home's width at rest, from the first frame: arriving there the track is
     still wide, and the page would lay itself out twice as it narrows. */
  max-inline-size: calc(100cqi - var(--home));
  display: grid;
  align-content: start;
  gap: var(--ae-space-8);
  padding: var(--ae-space-7) var(--ae-space-7) var(--ae-space-6);
}

/* The leaving and the arriving page share one cell while they crossfade. */
.pages {
  position: relative;
  display: grid;
}

.pages > :deep(*) {
  grid-area: 1 / 1;
}

/* Out of flow, so the column takes the arriving page's height at once instead
   of jumping when the leaving one is removed. */
.pages > :deep(.page-leave-active) {
  position: absolute;
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
  text-decoration: underline;
  text-decoration-color: color-mix(in oklch, currentColor 40%, transparent);
  text-underline-offset: 0.25em;
  transition: color 160ms ease-out, text-decoration-color 160ms ease-out;
}

@media (hover: hover) and (pointer: fine) {
  .foot a:hover {
    color: var(--ae-text);
    text-decoration-color: currentColor;
  }
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

  /* No track to slide along in the band: home content goes, and the way back
     comes, at once. */
  .home {
    inline-size: auto;
    margin: 0;
  }

  .slide-leave-active,
  .up-enter-active,
  .up-leave-active {
    transition: none;
  }

  .slide-enter-from {
    translate: none;
  }

  .portrait {
    block-size: 18rem;
  }

  .intro,
  .up {
    padding: var(--ae-space-5);
  }

  .content {
    max-inline-size: none;
    padding: var(--ae-space-6) var(--ae-space-5);
    gap: var(--ae-space-7);
  }
}
</style>

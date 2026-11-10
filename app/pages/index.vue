<script setup lang="ts">
import face from '~/assets/face.jpg'

const {portfolio} = useAppConfig()
const {name, user, greeting, headline, about, role, github, linkedin} = portfolio
const url = useRequestURL({xForwardedHost: true}).origin
// Shared links get the headline too: on the page it's the h1, not part of about.
const description = `${headline.join(' ')} ${about}`
// The headline's last two words never part, so no single word is left on a line of its own.
const lastTwo = (s: string) => s.replace(/ (?=\S+$)/, ' ')

// The hero comes into focus on the first load only, not on every way back home.
const intro = useState('intro', () => true)
onBeforeUnmount(() => {
  intro.value = false
})

const ogImage = `${url}/og.png`

useHead({
  title: name,
  link: [{rel: 'canonical', href: url}],
  meta: [
    {name: 'description', content: description},
    {property: 'og:type', content: 'website'},
    {property: 'og:site_name', content: user},
    {property: 'og:title', content: name},
    {property: 'og:description', content: description},
    {property: 'og:url', content: url},
    {property: 'og:image', content: ogImage},
    {property: 'og:image:width', content: '1200'},
    {property: 'og:image:height', content: '630'},
    {property: 'og:image:alt', content: name},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: name},
    {name: 'twitter:description', content: description},
    {name: 'twitter:image', content: ogImage},
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name,
        alternateName: user,
        jobTitle: role,
        description,
        url,
        sameAs: [github, linkedin],
      }),
    },
  ],
})
</script>

<template>
  <div>
    <header class="front" :class="{intro}">
      <h1 class="greet">
        <span class="line nowrap" style="--n: 0">{{ greeting }} <span class="face"><img :src="face" alt="" width="1200" height="1200" fetchpriority="high"></span></span>
        <span class="line" style="--n: 1">{{ headline[0] }} <em>{{ lastTwo(headline[1]) }}</em></span>
      </h1>
      <div class="side">
        <p class="about">{{ about }}</p>
        <div class="reach">
          <a :href="github" target="_blank" rel="noreferrer">GitHub</a>
          <a :href="linkedin" target="_blank" rel="noreferrer">LinkedIn</a>
        </div>
      </div>
    </header>

    <div class="sheet sections">
      <Projects/>
      <NoteList :limit="3"/>
    </div>
  </div>
</template>

<style scoped>
.front {
  box-sizing: border-box;
  display: grid;
  gap: clamp(var(--ae-space-6), 5vw, var(--ae-space-8));
  max-inline-size: var(--page);
  margin-inline: auto;
  padding: clamp(var(--ae-space-7), 9vw, 9rem) var(--gutter) clamp(var(--ae-space-6), 8vw, 8rem);
}

.greet {
  margin: 0;
  font-size: clamp(3rem, 6.6vw, 7.25rem);
  font-weight: 600;
  letter-spacing: -0.055em;
  line-height: 0.95;
}

.line {
  display: block;
}

.greet em {
  font-style: normal;
  color: var(--wall);
}

/* His head, the size of a word, set in the greeting as a pill. */
.face {
  display: inline-block;
  vertical-align: middle;
  inline-size: 1.9em;
  block-size: 0.82em;
  margin-inline-start: 0.08em;
  translate: 0 -0.06em;
  position: relative;
  overflow: hidden;
  border-radius: 999px;
  background: #000;
}

/* A hairline so the pill keeps its edge on the near-black page; a positioned
   layer, since an outline would sit under the absolutely placed photo. */
.face::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px color-mix(in oklch, currentColor 22%, transparent);
  pointer-events: none;
}

/* Zoomed out: his whole head and shoulders, small in the middle, the photo's
   black backdrop running on into the pill's, like a spotlight. */
.face img {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: auto;
  max-inline-size: none;
  block-size: 125%;
  translate: -50% -44%;
  filter: grayscale(1) contrast(1.15);
}

/* The standfirst under the headline: a hairline row split like the project
   cards below: the about on the headline's edge, the profiles over the pictures. */
.side {
  display: grid;
  grid-template-columns: 5fr 7fr;
  align-items: end;
  gap: var(--ae-space-5) var(--ae-space-6);
  position: relative;
  padding-block-start: var(--ae-space-5);
}

/* The hairline on its own layer, so the intro can draw it. */
.side::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  block-size: 1px;
  background: var(--ae-border);
  transform-origin: 0 50%;
}

.about {
  margin: 0;
  max-inline-size: 30ch;
  font-size: clamp(1.15rem, 1.5vw, 1.4rem);
  font-weight: 450;
  letter-spacing: -0.015em;
  line-height: 1.35;
  text-wrap: pretty;
  color: color-mix(in oklch, var(--ae-text) 82%, transparent);
}

.reach {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ae-space-3);
}

/* The first solid yellow, the second outlined; both pills. */
.reach a {
  padding: 0.85em 1.5em;
  border-radius: 999px;
  font-weight: 550;
  color: var(--ae-text);
  text-decoration: none;
  box-shadow: inset 0 0 0 1.5px currentColor;
  transition: background-color 160ms ease-out, color 160ms ease-out, scale 160ms ease-out;
}

.reach a:first-child {
  background: var(--wall);
  box-shadow: none;
  color: var(--wall-ink);
}

.reach a:focus-visible {
  outline: 2px solid var(--wall);
  outline-offset: 3px;
}

@media (hover: hover) and (pointer: fine) {
  .reach a:hover {
    background: var(--wall);
    color: var(--wall-ink);
    box-shadow: none;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .reach a:active {
    scale: 0.97;
  }
}

/* The first load: the headline comes into focus line by line, his head
   settles in its pill as a lens would, the hairline draws across, and the
   standfirst lifts in last. Inside the frame's own fade (main.css). */
@media (prefers-reduced-motion: no-preference) {
  .intro .line {
    animation: focus 900ms var(--ae-ease) backwards;
    animation-delay: calc(80ms + var(--n) * 90ms);
  }

  .intro .face img {
    animation: settle 1400ms var(--ae-ease) 60ms backwards;
  }

  .intro .side::before {
    animation: draw 900ms var(--ae-ease) 300ms backwards;
  }

  .intro .side > * {
    animation: lift 800ms var(--ae-ease) 420ms backwards;
  }

  @keyframes focus {
    from {
      opacity: 0;
      transform: translateY(0.18em);
      filter: blur(8px);
    }
  }

  @keyframes settle {
    from {
      scale: 1.14;
    }
  }

  @keyframes draw {
    from {
      transform: scaleX(0);
    }
  }

  @keyframes lift {
    from {
      opacity: 0;
      transform: translateY(0.5rem);
    }
  }
}

@media (width < 52rem) {
  .side {
    grid-template-columns: 1fr;
  }
}
</style>

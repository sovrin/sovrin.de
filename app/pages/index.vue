<script setup lang="ts">
const year = new Date().getFullYear()
const {portfolio} = useAppConfig()
const {user, phrase, role, url, github, linkedin} = portfolio

// One seed shared by the flat SSR plane and the client canvas (via the payload).
// canvasActive hides the flat plane once the canvas crystal is up.
const meshSeed = useState('meshSeed', () => Math.floor(Math.random() * 2 ** 31))
const canvasActive = ref(false)

const ogImage = `${url}/og.png`

useHead({
  title: user,
  htmlAttrs: {lang: 'en'},
  link: [
    {rel: 'canonical', href: url},
    {rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg'},
    {rel: 'icon', type: 'image/x-icon', href: '/favicon.ico'},
    {rel: 'apple-touch-icon', href: '/apple-touch-icon.png'},
  ],
  meta: [
    {name: 'description', content: phrase},
    {name: 'theme-color', content: '#060606'},
    {property: 'og:type', content: 'website'},
    {property: 'og:site_name', content: user},
    {property: 'og:title', content: user},
    {property: 'og:description', content: phrase},
    {property: 'og:url', content: url},
    {property: 'og:image', content: ogImage},
    {property: 'og:image:width', content: '1200'},
    {property: 'og:image:height', content: '630'},
    {property: 'og:image:alt', content: `${user} — ${phrase}`},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: user},
    {name: 'twitter:description', content: phrase},
    {name: 'twitter:image', content: ogImage},
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: user,
        jobTitle: role,
        description: phrase,
        url,
        sameAs: [github, linkedin],
      }),
    },
  ],
})

// Time-of-day mood for the mesh, from the visitor's LOCAL hour: dim & slightly
// desaturated at night, full and vivid around midday. Applied as CSS vars the
// mesh reads via filter(); no-JS just gets the daylight look.
onMounted(() => {
  const apply = () => {
    const now = new Date()
    const hour = now.getHours() + now.getMinutes() / 60
    const t = Math.min(1, Math.max(0, (hour - 6) / 14)) // dawn 6 → dusk 20
    const day = Math.sin(Math.PI * t) // 0 at dawn/dusk, 1 mid-day
    const root = document.documentElement.style
    root.setProperty('--tod-bright', (0.6 + 0.4 * day).toFixed(3))
    root.setProperty('--tod-sat', (0.82 + 0.18 * day).toFixed(3))
  }
  apply()
  const id = window.setInterval(apply, 5 * 60 * 1000) // drift with the clock
  onBeforeUnmount(() => clearInterval(id))
})
</script>

<template>
  <div class="shell" :class="{'canvas-active': canvasActive}">
    <div class="mesh" aria-hidden="true"/>
    <MeshCanvas :seed="meshSeed" @ready="canvasActive = true"/>
    <div class="edge-blur" aria-hidden="true"/>

    <main class="content">
      <div class="who rise" style="--d: 0s">
        <Avatar :user="user" :size="40"/>
        <div class="status">
          <span class="sigil" aria-hidden="true">$</span>
          <TypeWriter text="whoami"/>
        </div>
      </div>

      <h1 class="heading rise" style="--d: 0.08s">{{ user }}</h1>

      <p class="bio rise" style="--d: 0.14s">
        {{ phrase }}
      </p>

      <Projects class="rise" style="--d: 0.2s"/>

      <section class="contact rise" style="--d: 0.26s" aria-label="Contact and social links">
        <div class="contact-head">
          <span class="sigil" aria-hidden="true">$</span>
          <span>cat ~/contact</span>
        </div>
        <div class="meta">
          <SocialLinks/>
          <span class="sep" aria-hidden="true"/>
          <span class="year">{{ year }}</span>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.shell {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* Frost that climbs the whole left column, flattening the mesh gradually toward
   the copy and fading back to the sharp crystal on the right. A faint scrim in
   the same footprint deepens contrast so the text seats. */
.edge-blur {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
  background: radial-gradient(88% 142% at 0% 100%, rgba(6, 6, 6, 0.5) 0%, rgba(6, 6, 6, 0.16) 46%, transparent 82%);
  -webkit-mask-image: radial-gradient(88% 142% at 0% 100%, #000 0%, #000 44%, transparent 86%);
  mask-image: radial-gradient(88% 142% at 0% 100%, #000 0%, #000 44%, transparent 86%);
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .edge-blur {
    background: rgba(6, 6, 6, 0.72);
  }
}

@media (prefers-reduced-transparency: reduce) {
  .edge-blur {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: rgba(6, 6, 6, 0.72);
  }
}

@media (max-width: 640px) {
  .edge-blur {
    background: radial-gradient(150% 96% at 40% 112%, rgba(6, 6, 6, 0.5) 0%, rgba(6, 6, 6, 0.16) 48%, transparent 84%);
    -webkit-mask-image: radial-gradient(150% 96% at 40% 112%, #000 0%, #000 46%, transparent 90%);
    mask-image: radial-gradient(150% 96% at 40% 112%, #000 0%, #000 46%, transparent 90%);
  }
}

.content {
  position: relative;
  z-index: 2;
  margin-top: auto; /* dock to the bottom */
  width: 100%;
  max-width: 640px;
  padding: 0 clamp(var(--space-md), 6vw, var(--space-xl)) clamp(var(--space-lg), 9vh, var(--space-xl));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

@supports (height: 100svh) {
  .shell {
    min-height: 100svh;
  }

  .content {
    padding-bottom: clamp(var(--space-lg), 9svh, var(--space-xl));
  }
}

.who {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  margin: 0 0 var(--space-sm);
}

/* Machine layer. Caret glows in the avatar-sampled colour. */
.status {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  color: rgba(245, 245, 245, 0.5);
  --color-cursor: var(--mesh-color, rgba(245, 245, 245, 0.7));
}

.sigil {
  margin-right: 0.4em;
  color: var(--mesh-color, rgba(245, 245, 245, 0.4));
  transition: color 0.8s ease;
}

.heading {
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--fs-display);
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 0.9;
}

.bio {
  margin: var(--space-2xs) 0 0;
  max-width: 42ch;
  font-size: var(--fs-body);
  line-height: 1.6;
  color: rgba(245, 245, 245, 0.58);
  text-wrap: pretty;
}

.contact {
  margin-top: var(--space-md);
}

/* Machine-layer eyebrow, matching `$ whoami` and `$ ls ~/projects`. */
.contact-head {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  color: rgba(245, 245, 245, 0.5);
  margin-bottom: var(--space-2xs);
}

/* Footer line: links · separator · year, clustered left. */
.meta {
  display: flex;
  align-items: center;
  gap: var(--space-xs) var(--space-sm);
  flex-wrap: wrap;
}

.sep {
  width: 1px;
  height: 0.9em;
  background: rgba(245, 245, 245, 0.18);
}

.year {
  font-family: var(--font-mono);
  font-size: var(--fs-micro);
  letter-spacing: 0.18em;
  color: rgba(245, 245, 245, 0.42);
}

@media (max-width: 400px) {
  .sep {
    display: none;
  }
}
</style>

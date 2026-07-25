<script setup lang="ts">
// Error page (404 and friends), in the same language as the home page: the mesh
// crystal + a terminal voice — you `cat` a path that isn't there.
const props = defineProps<{error: {statusCode?: number; statusMessage?: string; url?: string}}>()
const {portfolio} = useAppConfig()
const {user} = portfolio
const year = new Date().getFullYear()

const meshSeed = useState('meshSeed', () => Math.floor(Math.random() * 2 ** 31))
const canvasActive = ref(false)

const route = useRoute()
const code = computed(() => props.error?.statusCode || 404)
// Vue's {{ }} already HTML-escapes this (no XSS), but restrict it to a URL-ish
// charset and cap the length so a crafted path can't render arbitrary text
// (content-spoofing) or blow out the layout.
const path = computed(() => {
  const raw = route.fullPath || props.error?.url || '/'
  return raw.replace(/[^\w\-./~%]/g, '').slice(0, 42) || '/'
})

useHead({
  title: `${code.value} · ${user}`,
  htmlAttrs: {lang: 'en'},
  meta: [{name: 'theme-color', content: '#060606'}],
  link: [
    {rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg'},
    {rel: 'icon', type: 'image/x-icon', href: '/favicon.ico'},
    {rel: 'apple-touch-icon', href: '/apple-touch-icon.png'},
  ],
})

// Same time-of-day mood as the home page.
onMounted(() => {
  const apply = () => {
    const now = new Date()
    const hour = now.getHours() + now.getMinutes() / 60
    const t = Math.min(1, Math.max(0, (hour - 6) / 14))
    const day = Math.sin(Math.PI * t)
    const root = document.documentElement.style
    root.setProperty('--tod-bright', (0.6 + 0.4 * day).toFixed(3))
    root.setProperty('--tod-sat', (0.82 + 0.18 * day).toFixed(3))
  }
  apply()
  const id = window.setInterval(apply, 5 * 60 * 1000)
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
          <span class="sigil" aria-hidden="true">$</span> cat {{ path }}
        </div>
      </div>

      <h1 class="heading rise" style="--d: 0.08s">{{ code }}</h1>

      <p class="bio rise" style="--d: 0.14s">
        no such file or directory
      </p>

      <div class="meta rise" style="--d: 0.2s">
        <LinkPill label="back home" sigil="←" href="/"/>
        <span class="sep" aria-hidden="true"/>
        <span class="year">{{ year }}</span>
      </div>
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

/* Frost pooled bottom-left, seating the copy over the mesh. */
.edge-blur {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
  -webkit-mask-image: radial-gradient(86% 86% at 0% 108%, #000 0%, #000 40%, transparent 86%);
  mask-image: radial-gradient(86% 86% at 0% 108%, #000 0%, #000 40%, transparent 86%);
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
    -webkit-mask-image: radial-gradient(150% 50% at 40% 109%, #000 0%, #000 46%, transparent 88%);
    mask-image: radial-gradient(150% 50% at 40% 109%, #000 0%, #000 46%, transparent 88%);
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

/* Machine layer. */
.status {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  color: rgba(245, 245, 245, 0.5);
  word-break: break-all;
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

.meta {
  margin-top: var(--space-md);
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

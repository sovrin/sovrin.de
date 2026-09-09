<script setup lang="ts">
// The scene every page sits in: the crystal mesh, the frost that seats the copy
// over it, and the bottom-left content dock. Pages only supply what goes in the
// dock, so the two routes can't drift apart.

// Seed for the client canvas, created here so SSR and the client agree on it
// (useState serialises it into the payload). `?seed=N` pins it, for comparable
// screenshots. The flat `.mesh` plane below is a pure CSS gradient and uses no
// seed; canvasActive retires it once the crystal has drawn.
const route = useRoute()
const meshSeed = useState('meshSeed', () => {
  const pinned = Number(route.query.seed)
  return Number.isFinite(pinned) && pinned > 0 ? Math.floor(pinned) : Math.floor(Math.random() * 2 ** 31)
})
const canvasActive = ref(false)

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
      <slot/>
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
</style>

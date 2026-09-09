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
  background: radial-gradient(88% 142% at 0% 100%, rgba(6, 6, 6, 0.5) 0%, rgba(6, 6, 6, 0.16) 46%, transparent 82%);
  -webkit-mask-image: radial-gradient(88% 142% at 0% 100%, #000 0%, #000 44%, transparent 86%);
  mask-image: radial-gradient(88% 142% at 0% 100%, #000 0%, #000 44%, transparent 86%);
}

@supports not (backdrop-filter: blur(1px)) {
  .edge-blur {
    background: rgba(6, 6, 6, 0.72);
  }
}

@media (prefers-reduced-transparency: reduce) {
  .edge-blur {
    backdrop-filter: none;
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

/* Glass panel the copy sits on — cut like one facet of the crystal, the
   corner nearest the light chamfered. The sheen and the brighter edge both come
   from the mesh's upper-right light, so the panel reads as part of the scene. */
.content {
  --gutter: clamp(var(--space-xs), 4vw, var(--space-lg));
  --cut: var(--space-md);
  position: relative;
  z-index: 2;
  margin: auto var(--gutter) var(--gutter); /* dock to the bottom */
  max-width: 640px;
  padding: var(--space-md);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background:
    linear-gradient(225deg, rgba(245, 245, 245, 0.07), transparent 42%),
    rgba(6, 6, 6, 0.42);
  backdrop-filter: blur(18px);
  clip-path: polygon(0 0, calc(100% - var(--cut)) 0, 100% var(--cut), 100% 100%, 0 100%);
}

/* Hairline traced around the cut shape: the outer facet minus a 1px inset. */
.content::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(225deg, rgba(245, 245, 245, 0.26), rgba(245, 245, 245, 0.06) 55%);
  clip-path: polygon(
      evenodd,
      0 0, calc(100% - var(--cut)) 0, 100% var(--cut), 100% 100%, 0 100%,
      1px 1px, 1px calc(100% - 1px), calc(100% - 1px) calc(100% - 1px),
      calc(100% - 1px) calc(var(--cut) + 0.41px), calc(100% - var(--cut) - 0.41px) 1px
  );
}

@supports not (backdrop-filter: blur(1px)) {
  .content {
    background: rgba(6, 6, 6, 0.86);
  }
}

@media (prefers-reduced-transparency: reduce) {
  .content {
    backdrop-filter: none;
    background: rgba(6, 6, 6, 0.86);
  }
}

@media (max-width: 640px) {
  .content {
    padding: var(--space-sm);
  }
}

@supports (height: 100svh) {
  .shell {
    min-height: 100svh;
  }
}
</style>

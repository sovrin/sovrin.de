<script setup lang="ts">
// The scene every page sits in: the crystal mesh, the frost that seats the copy
// over it, and the bottom-left content dock. Mounted once by app.vue (and again
// by error.vue, which replaces the shell); pages only supply what goes in the
// dock, so routes can't drift apart and navigation leaves the crystal in place.

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

// Pages declare `definePageMeta({dock: 'fill'})` to run the panel top-to-bottom
// (the notes); the home dock stays a caption in the corner.
const fill = computed(() => route.meta.dock === 'fill')

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

// A client-side navigation swaps the dock's content in one frame, so the panel
// would jump between sizes. Its height is content-driven and can't be
// transitioned in CSS, so: lock the panel's box when the next page starts
// loading, measure the settled layout once it has rendered, ease between the
// two, then hand the box back to the layout. Width rides along (fill mode is
// wider) and the shell's fill gutter is restarted from its locked value so all
// three tween together.
const panel = ref<HTMLElement | null>(null)
const TWEEN_MS = 500 // matches the 0.5s transitions below

interface Box {
  height: number
  width: number
  gutter: number
}

onMounted(() => {
  const nuxtApp = useNuxtApp()
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')
  let locked: Box | null = null

  const measure = (el: HTMLElement, shell: HTMLElement): Box => ({
    height: el.offsetHeight,
    width: el.offsetWidth,
    gutter: parseFloat(getComputedStyle(shell).paddingTop),
  })
  const freeze = (el: HTMLElement, box: Box) => {
    el.style.height = `${box.height}px`
    el.style.width = `${box.width}px`
    el.style.maxWidth = 'none'
    el.style.flex = 'none' // fill mode would otherwise stretch past the lock
  }
  const thaw = (el: HTMLElement) => {
    el.style.height = ''
    el.style.width = ''
    el.style.maxWidth = ''
    el.style.flex = ''
  }

  const lock = () => {
    const el = panel.value
    if (!el?.parentElement || reduceMotion.matches) return
    locked = measure(el, el.parentElement)
    freeze(el, locked)
  }

  const release = async () => {
    const el = panel.value
    const shell = el?.parentElement
    if (!el || !shell || !locked) return
    const from = locked
    locked = null
    await nextTick()

    // Measure where the layout settles, with nothing in flight.
    el.style.transition = 'none'
    shell.style.transition = 'none'
    thaw(el)
    shell.style.paddingTop = ''
    const to = measure(el, shell)
    if (to.height === from.height && to.width === from.width && to.gutter === from.gutter) return

    // Back to the locked box, commit it, then let the transitions run to the target.
    freeze(el, from)
    shell.style.paddingTop = `${from.gutter}px`
    void el.offsetHeight
    el.style.transition = ''
    shell.style.transition = ''
    el.classList.add('resizing')
    freeze(el, to)
    shell.style.paddingTop = ''

    // Hand the box back when the tween ends — or on a timer, since a change of
    // gutter alone fires no transitionend on the panel.
    const finish = () => {
      clearTimeout(timer)
      el.removeEventListener('transitionend', done)
      el.classList.remove('resizing')
      thaw(el)
    }
    const done = (e: TransitionEvent) => {
      if (e.target === el && (e.propertyName === 'height' || e.propertyName === 'width')) finish()
    }
    const timer = window.setTimeout(finish, TWEEN_MS + 50)
    el.addEventListener('transitionend', done)
  }

  const offStart = nuxtApp.hook('page:start', lock)
  const offFinish = nuxtApp.hook('page:finish', release)
  onBeforeUnmount(() => {
    offStart()
    offFinish()
  })
})
</script>

<template>
  <div class="shell" :class="{'canvas-active': canvasActive, fill}">
    <div class="mesh" aria-hidden="true"/>
    <MeshCanvas :seed="meshSeed" @ready="canvasActive = true"/>
    <div class="edge-blur" aria-hidden="true"/>

    <main ref="panel" class="content">
      <slot/>
    </main>
  </div>
</template>

<style scoped>
.shell {
  --gutter: clamp(var(--space-xs), 4vw, var(--space-lg));
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

/* Fill mode: the panel runs from the top gutter to the bottom one and widens to
   ~75ch of the mono, so a list or a long note reads as a page, not a caption. The
   home dock keeps its geometry: no top gutter, so it still fits a 900px viewport. */
.shell.fill {
  padding-top: var(--gutter);
}

.shell.fill .content {
  flex: 1 1 auto;
  max-width: 760px;
}

/* Between pages the shell's gutter and the panel's box tween together; the box
   is driven from script (see `release`) and only transitions while .resizing. */
.shell {
  transition: padding-top 0.5s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.content.resizing {
  transition: height 0.5s cubic-bezier(0.2, 0.7, 0.2, 1), width 0.5s cubic-bezier(0.2, 0.7, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  .shell,
  .content.resizing {
    transition: none;
  }
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

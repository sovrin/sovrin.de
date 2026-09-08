<script setup lang="ts">
// The one crystal. Generates the mesh from the shared seed and draws it on a
// canvas. Entrance: starts FLAT (relief 0) and, once the page has colorized,
// snaps the relief flat→full (easeOutExpo) so the facets pop "out of the ground".
// After that it's static, lit by a fixed base light.
import {generateMesh} from '~/utils/mesh'

const props = defineProps<{seed: number}>()
const emit = defineEmits<{ready: []}>()
const PHI = 1.618

onMounted(() => {
  const host = document.querySelector('.shell') || document.body
  const canvas = document.createElement('canvas')
  canvas.className = 'mesh-canvas'
  canvas.setAttribute('aria-hidden', 'true')
  host.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  if (!ctx) {canvas.remove(); return}

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const {W, H, facets} = generateMesh(props.seed)
  const N = facets.length
  const NX = new Float32Array(N), NY = new Float32Array(N), NZ = new Float32Array(N)
  const FALL = new Float32Array(N)
  const PX = new Float32Array(N * 6)
  for (let i = 0; i < N; i++) {
    const f = facets[i]
    NX[i] = f.nx; NY[i] = f.ny; NZ[i] = f.nz
    FALL[i] = 0.34 + 0.66 * Math.pow(1 / PHI, f.dist * 2.2)
    for (let k = 0; k < 6; k++) PX[i * 6 + k] = f.pts[k]
  }

  let Lbx = 0.42, Lby = -0.56, Lbz = 0.72
  const bl = Math.hypot(Lbx, Lby, Lbz); Lbx /= bl; Lby /= bl; Lbz /= bl

  let vw = 0, vh = 0, scale = 1, offX = 0, offY = 0
  const resize = () => {
    vw = innerWidth; vh = innerHeight
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(vw * dpr)
    canvas.height = Math.round(vh * dpr)
    canvas.style.width = vw + 'px'
    canvas.style.height = vh + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    scale = Math.max(vw / W, vh / H) // "slice" cover
    offX = (vw - W * scale) / 2
    offY = 0 // xMidYMin — top aligned
  }
  resize()

  let cr = 181, cg = 132, cb = 42
  const readColor = () => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--mesh-color')
    const m = v.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/)
    if (m) {cr = +m[1]; cg = +m[2]; cb = +m[3]}
    return v.trim() !== ''
  }
  readColor()

  let growth = 0 // relief: 0 flat → 1 full
  const draw = () => {
    ctx.clearRect(0, 0, vw, vh)
    const fx = 0.74 * vw, fy = 0.3 * vh, pr = Math.max(vw, vh) * 0.95
    const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, pr)
    g.addColorStop(0, `rgba(${cr},${cg},${cb},0.16)`)
    g.addColorStop(0.45, `rgba(${cr},${cg},${cb},0.05)`)
    g.addColorStop(0.72, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, vw, vh)

    const col = `${cr},${cg},${cb}`
    for (let i = 0; i < N; i++) {
      const o = i * 6
      const x1 = PX[o] * scale + offX, y1 = PX[o + 1] * scale + offY
      const x2 = PX[o + 2] * scale + offX, y2 = PX[o + 3] * scale + offY
      const x3 = PX[o + 4] * scale + offX, y3 = PX[o + 5] * scale + offY

      // Flatten the crystal toward the left, where the copy sits: per-facet relief
      // ramps from 0 at the left edge to full past ~62% of the viewport width, so
      // the facets dissolve into a smooth plane behind the text and only re-emerge
      // as the true crystal on the right. Screen-space (not geometry) so it tracks
      // the content column regardless of the cover crop.
      const su = ((x1 + x2 + x3) / 3) / vw
      const e = Math.min(1, Math.max(0, (su - 0.08) / 0.54))
      const relief = e * e * (3 - 2 * e) // smoothstep
      const gf = growth * relief

      // Effective normal blends from flat (0,0,1) to the full facet normal.
      let nx = NX[i] * gf
      let ny = NY[i] * gf
      let nz = (1 - gf) + NZ[i] * gf
      const nl = Math.hypot(nx, ny, nz) || 1
      nx /= nl; ny /= nl; nz /= nl

      const lamB = Math.max(0, nx * Lbx + ny * Lby + nz * Lbz)
      let op = (0.12 + 0.7 * lamB) * FALL[i]
      if (op > 0.95) op = 0.95
      ctx.beginPath()
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath()
      ctx.fillStyle = `rgba(${col},${op})`
      ctx.fill()
      if (lamB > 0.82 && FALL[i] > 0.7) {
        const hi = (lamB - 0.82) * 0.62 * FALL[i] * Math.min(1, gf)
        if (hi > 0) {ctx.fillStyle = `rgba(245,245,245,${hi})`; ctx.fill()}
      }
    }
  }

  // Drastic, non-linear pop: fast rise decelerating hard into place (easeOutExpo).
  const easeOutExpo = (e: number) => (e >= 1 ? 1 : 1 - Math.pow(2, -10 * e))
  const pop = () => {
    if (reduce) {growth = 1; draw(); return}
    const DUR = 760, t0 = performance.now()
    const anim = () => {
      const e = Math.min(1, (performance.now() - t0) / DUR)
      growth = easeOutExpo(e)
      draw()
      if (e < 1) requestAnimationFrame(anim)
      else {growth = 1; draw()}
    }
    requestAnimationFrame(anim)
  }

  draw() // flat
  emit('ready') // parent retires the flat SSR plane

  const forced = new URLSearchParams(location.search).get('grow')
  if (forced !== null) {
    growth = Math.max(0, Math.min(1, parseFloat(forced) || 0))
    draw()
  } else {
    let waited = 0
    const poll = () => {
      const ready = readColor()
      draw()
      if (ready || waited >= 1500) window.setTimeout(pop, 140)
      else {waited += 80; window.setTimeout(poll, 80)}
    }
    window.setTimeout(poll, 120)
  }

  const onResize = () => {resize(); draw()}
  window.addEventListener('resize', onResize)
  const colId = window.setInterval(() => {
    const before = `${cr},${cg},${cb}`
    readColor()
    if (`${cr},${cg},${cb}` !== before) draw()
  }, 800)

  onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize)
    clearInterval(colId)
    canvas.remove()
  })
})
</script>

<template>
  <span aria-hidden="true" style="display: none"/>
</template>

<script setup lang="ts">
// GitHub avatar; on load, samples its dominant colour to tint the mesh
// (--mesh-color). Loaded from the avatar host directly — it serves ACAO *, so
// the canvas read isn't CORS-blocked (github.com/<user>.png would 302 without it).
const props = defineProps<{ user: string; size: number }>()

const base = `https://avatars.githubusercontent.com/${props.user}`
const displaySrc = `${base}?size=${props.size * 2}` // 2× for retina

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h = (h * 60 + 360) % 360
  }
  const l = (max + min) / 2
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  return {h, s, l}
}

const hslToCss = (h: number, s: number, l: number) => {
  l = Math.min(1, Math.max(0, l))
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
      : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return `rgb(${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)})`
}

// Retint the gem favicon to the sampled hue (four facets lit from the upper-
// right, matching public/favicon.svg). The static SVG is the SSR/no-JS default;
// this swaps in a data-URI copy in the live colour.
const setFavicon = (h: number, s: number, l: number) => {
  const facet = (dl: number) => hslToCss(h, s, l + dl)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
    `<rect width="32" height="32" rx="7" fill="#0a0a0b"/>` +
    `<polygon points="16,3.5 28.5,16 16,16" fill="${facet(0.14)}"/>` +
    `<polygon points="16,3.5 16,16 3.5,16" fill="${facet(0.02)}"/>` +
    `<polygon points="28.5,16 16,28.5 16,16" fill="${facet(-0.12)}"/>` +
    `<polygon points="3.5,16 16,16 16,28.5" fill="${facet(-0.24)}"/></svg>`
  document.querySelector('link[rel="icon"][type="image/svg+xml"]')?.remove()
  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/svg+xml'
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`
  document.head.appendChild(link)
}

// Set --mesh-color to the avatar's dominant colour. Any failure leaves the
// CSS fallback in place.
const tintMeshFromAvatar = () => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    try {
      const s = 32
      const canvas = document.createElement('canvas')
      canvas.width = s
      canvas.height = s
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0, s, s)
      const {data} = ctx.getImageData(0, 0, s, s)

      // Averaged colour of the most-populated coarse RGB bucket.
      const buckets = new Map<string, { n: number; r: number; g: number; b: number }>()
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 125) continue
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const key = `${r >> 5}-${g >> 5}-${b >> 5}`
        const bucket = buckets.get(key) ?? {n: 0, r: 0, g: 0, b: 0}
        bucket.n++
        bucket.r += r
        bucket.g += g
        bucket.b += b
        buckets.set(key, bucket)
      }

      let best: { n: number; r: number; g: number; b: number } | null = null
      for (const bucket of buckets.values()) {
        if (!best || bucket.n > best.n) best = bucket
      }
      if (!best) return

      // Keep the avatar's hue, but clamp lightness/saturation into a fixed band
      // so the mesh (and favicon) have consistent energy for any avatar — a dark
      // colour is lifted (never black), a pale one deepened, a grey gets a floor
      // of tint.
      const {h, s: rawS, l: rawL} = rgbToHsl(best.r / best.n, best.g / best.n, best.b / best.n)
      const sat = Math.min(0.85, Math.max(0.34, rawS))
      const lit = Math.min(0.52, Math.max(0.40, rawL))
      document.documentElement.style.setProperty('--mesh-color', hslToCss(h, sat, lit))
      setFavicon(h, sat, lit)
    } catch {
      // Canvas tainted or unreadable — keep the fallback mesh colour.
    }
  }
  img.src = `${base}?size=120`
}

onMounted(tintMeshFromAvatar)
</script>

<template>
  <img
      class="avatar"
      :src="displaySrc"
      :alt="`${user}’s GitHub avatar`"
      :width="size"
      :height="size"
      :style="{width: `${size}px`, height: `${size}px`}"
      decoding="async"
  />
</template>

<style scoped>
.avatar {
  display: block;
  border-radius: 50%;
  border: 1px solid rgba(245, 245, 245, 0.16);
  object-fit: cover;
}
</style>

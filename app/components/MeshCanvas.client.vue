<script setup lang="ts">
// The one crystal, drawn with WebGL. Geometry comes from utils/mesh.ts (seeded,
// so SSR and client agree on it). The vertex shader drifts every vertex (slow
// sway + per-vertex rise and fall), computes each facet's normal from its three
// drifted corners, shades it with the fixed base light, and adds the
// reflections: a few soft lights wander the sky and each facet glints when its
// mirror direction points at one.
//
// Entrance: starts FLAT (relief 0) and, once the page has colorized (or after
// 1.5s), pops the relief flat→full (easeOutExpo) so the facets rise "out of the
// ground". prefers-reduced-motion: full relief at once, everything frozen, no loop.
//
// Client-only: there is no server-rendered mesh. SSR / no-JS shows the flat CSS
// plane (`.mesh` in main.css), which this retires via `ready` once it has drawn.
// No WebGL → the flat plane simply stays.
//
// Shading dials come from utils/mesh-constants.mjs, shared with the OG card, and
// are baked into the shader source as constants.
import {LIVE, MESH} from '~/utils/mesh-constants.mjs'
import {FLOATS_PER_VERTEX, generateMesh} from '~/utils/mesh'

const props = defineProps<{seed: number}>()
const emit = defineEmits<{ready: []}>()

// GLSL float literal ("44" → "44.0"). Never put backticks in the shader source.
const f = (n: number) => {
  const s = String(n)
  return /[.e]/i.test(s) ? s : s + '.0'
}

const W = MESH.COLS * MESH.CELL, H = MESH.ROWS * MESH.CELL

const CRYSTAL_VERT = /* glsl */ `
precision highp float;
attribute vec3 a0;      // corner 0 (x, y, z) in geometry units
attribute vec3 a1;      // corner 1
attribute vec3 a2;      // corner 2
attribute float aCorner;// which corner this vertex is: 0, 1, 2
uniform vec2 uView;     // viewport in CSS px
uniform float uScale;   // geometry units → CSS px ("slice" cover)
uniform vec2 uOff;      // cover offset in CSS px
uniform float uGrowth;  // relief: 0 flat → 1 full
uniform vec3 uLight;    // normalised base light
uniform vec3 uColor;    // mesh colour, 0..1
uniform float uTime;    // seconds
varying vec4 vColor;    // premultiplied facet colour (flat per triangle)

const float W = ${f(W)};
const float H = ${f(H)};
const float CELL = ${f(MESH.CELL)};
const float HALF_DIAG = ${f(Math.hypot(0.5, 0.5))};
const float TAU = 6.283185307179586;

// Per-vertex random in 0..1 from the ORIGINAL position, so the copies of a
// shared vertex in neighbouring triangles agree and the mesh stays watertight.
float hash(vec2 p) {
  return fract(sin(dot(p / vec2(W, H), vec2(127.1, 311.7))) * 43758.5453);
}

// The movement. Sideways: two long waves crossing the plane, damped to zero at
// the outer edge. Height: a slow shared swell plus a per-vertex twinkle.
vec3 drift(vec3 p) {
  float t = uTime * ${f(LIVE.MOVE_SPEED)};
  vec2 uv = p.xy / vec2(W, H);
  float edge = min(min(p.x, W - p.x), min(p.y, H - p.y));
  float damp = clamp(edge / CELL, 0.0, 1.0);
  vec2 sway = vec2(
    sin(uv.x * 4.2 + uv.y * 2.6 + t * 0.53) + 0.6 * sin(uv.y * 5.1 - uv.x * 1.7 - t * 0.37),
    cos(uv.y * 3.8 - uv.x * 2.2 - t * 0.47) + 0.6 * cos(uv.x * 4.6 + uv.y * 1.9 + t * 0.41)
  ) / 1.6;
  float swell = sin(uv.x * 3.1 + uv.y * 4.4 + t * 0.60) * cos(uv.y * 2.7 - uv.x * 1.3 - t * 0.44);
  float h = hash(p.xy);
  float twinkle = sin(t * (0.7 + 0.7 * h) + h * TAU);
  return vec3(
    p.xy + ${f(LIVE.MOVE_XY)} * damp * sway,
    p.z + ${f(LIVE.MOVE_Z)} * swell + ${f(LIVE.MOVE_ZV)} * twinkle
  );
}

// One drifting sky light: an ellipse around the zenith, wobbled by a second
// frequency so the path never quite repeats. y is DOWN in geometry space, so
// negative y is high in the sky.
vec3 skyLight(float t, vec2 centre, vec2 radius, vec2 freq, float phase, float height) {
  vec2 xy = centre + radius * vec2(sin(t * freq.x + phase), cos(t * freq.y + phase * 1.7));
  return normalize(vec3(xy, height));
}

// Specular glint of one light in the facet's mirror direction.
float glint(vec3 R, vec3 L) {
  return pow(max(0.0, dot(R, L)), ${f(LIVE.REFLECT_SHINE)});
}

void main() {
  vec3 p0 = drift(a0), p1 = drift(a1), p2 = drift(a2);
  vec2 own = aCorner < 0.5 ? p0.xy : (aCorner < 1.5 ? p1.xy : p2.xy);
  vec2 c = (p0.xy + p1.xy + p2.xy) / 3.0;

  // Flatten the crystal toward the left, where the copy sits: per-facet relief
  // ramps from 0 at the left edge to full past ~62% of the viewport width, so
  // the facets dissolve into a smooth plane behind the text and only re-emerge
  // as the true crystal on the right. Screen-space (not geometry) so it tracks
  // the content column regardless of the cover crop.
  float su = (c.x * uScale + uOff.x) / uView.x;
  float e = clamp((su - 0.08) / 0.54, 0.0, 1.0);
  float gf = uGrowth * e * e * (3.0 - 2.0 * e);

  // Relief scales the heights; the normal follows from the flattened triangle.
  p0.z *= gf; p1.z *= gf; p2.z *= gf;
  vec3 n = cross(p1 - p0, p2 - p0);
  if (n.z < 0.0) n = -n;
  n = normalize(n);

  float lam = max(0.0, dot(n, uLight));
  float dist = length(vec2((c.x - ${f(MESH.FU)} * W) / W, (c.y - ${f(MESH.FV)} * H) / H)) / HALF_DIAG;
  float fall = ${f(MESH.FALL_BASE)} + ${f(MESH.FALL_RANGE)} * pow(1.0 / ${f(MESH.PHI)}, dist * ${f(MESH.FALL_EXP)});
  float op = min(${f(MESH.OP_CAP)}, (${f(MESH.OP_BASE)} + ${f(MESH.OP_LAMBERT)} * lam) * fall);

  // Near-white highlight on the brightest facets nearest the focus. Fades out
  // with gf, so the flattened left never glints.
  float hi = 0.0;
  if (lam > ${f(MESH.HI_LAMBERT_MIN)} && fall > ${f(MESH.HI_FALL_MIN)}) {
    hi = max(0.0, (lam - ${f(MESH.HI_LAMBERT_MIN)}) * ${f(MESH.HI_SCALE)} * fall * min(1.0, gf));
  }

  // Facet fill, then highlight composited over it — premultiplied.
  vec3 rgb = uColor * op;
  float a = op;
  rgb = vec3(${f(245 / 255)}) * hi + rgb * (1.0 - hi);
  a = hi + a * (1.0 - hi);

  // Reflections. The viewer looks straight down the z axis, so the mirror
  // direction of a facet is reflect(-Z, n). Three lights of different size and
  // pace wander the sky; their glints are summed, then gated by relief and
  // falloff so the flat ground behind the copy never flashes.
  vec3 R = 2.0 * n.z * n - vec3(0.0, 0.0, 1.0);
  float t = uTime * ${f(LIVE.REFLECT_SPEED)};
  float g = 0.0;
  g += 1.00 * glint(R, skyLight(t, vec2( 0.25, -0.30), vec2(0.45, 0.35), vec2(0.110, 0.073), 0.0, 0.80));
  g += 0.70 * glint(R, skyLight(t, vec2(-0.20, -0.10), vec2(0.40, 0.45), vec2(0.067, 0.095), 2.1, 0.70));
  g += 0.45 * glint(R, skyLight(t, vec2( 0.05,  0.20), vec2(0.55, 0.30), vec2(0.083, 0.051), 4.2, 0.60));
  float k = min(1.0, ${f(LIVE.REFLECT_STRENGTH)} * g) * gf * fall;
  vec3 glintColor = mix(uColor, vec3(${f(245 / 255)}), ${f(LIVE.REFLECT_WHITE)});
  rgb = glintColor * k + rgb * (1.0 - k);
  a = k + a * (1.0 - k);
  vColor = vec4(rgb, a);

  vec2 sc = own * uScale + uOff;
  gl_Position = vec4(sc.x / uView.x * 2.0 - 1.0, 1.0 - sc.y / uView.y * 2.0, 0.0, 1.0);
}`

const CRYSTAL_FRAG = /* glsl */ `
precision mediump float;
varying vec4 vColor;
void main() { gl_FragColor = vColor; }`

// One warm ambient pool the facets sit on, sharing the shading's focal point.
// (mediump in both stages: a uniform shared across stages must agree on
// precision, and the pool only needs ~1px accuracy.)
const POOL_VERT = /* glsl */ `
precision mediump float;
attribute vec2 aPos;
uniform vec2 uView;
varying vec2 vPx;
void main() {
  vPx = vec2((aPos.x + 1.0) * 0.5 * uView.x, (1.0 - aPos.y) * 0.5 * uView.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const POOL_FRAG = /* glsl */ `
precision mediump float;
varying vec2 vPx;
uniform vec2 uView;
uniform vec3 uColor;
void main() {
  vec2 focus = vec2(${f(MESH.FU)}, ${f(MESH.FV)}) * uView;
  float r = distance(vPx, focus) / (max(uView.x, uView.y) * 0.95);
  float a = r < 0.45 ? mix(0.16, 0.05, r / 0.45)
          : r < 0.72 ? mix(0.05, 0.0, (r - 0.45) / 0.27)
          : 0.0;
  gl_FragColor = vec4(uColor * a, a);
}`

onMounted(() => {
  const host = document.querySelector('.shell') || document.body
  const canvas = document.createElement('canvas')
  canvas.className = 'mesh-canvas'
  canvas.setAttribute('aria-hidden', 'true')
  host.appendChild(canvas)
  const gl = canvas.getContext('webgl', {alpha: true, antialias: true, premultipliedAlpha: true, depth: false, stencil: false})
  if (!gl) {canvas.remove(); return}

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const mesh = generateMesh(props.seed)

  // --- GL resources (rebuilt on context restore) ---------------------------
  type Prog = {p: WebGLProgram; u: Record<string, WebGLUniformLocation | null>; a: Record<string, number>}
  let crystal: Prog, pool: Prog
  let meshBuf: WebGLBuffer, quadBuf: WebGLBuffer
  let alive = false

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader')
    return s
  }
  const program = (vs: string, fs: string, uniforms: string[], attribs: string[]): Prog => {
    const p = gl.createProgram()!
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs))
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(p)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link')
    const u: Prog['u'] = {}, a: Prog['a'] = {}
    for (const n of uniforms) u[n] = gl.getUniformLocation(p, n)
    for (const n of attribs) a[n] = gl.getAttribLocation(p, n)
    return {p, u, a}
  }
  const init = () => {
    crystal = program(CRYSTAL_VERT, CRYSTAL_FRAG,
      ['uView', 'uScale', 'uOff', 'uGrowth', 'uLight', 'uColor', 'uTime'],
      ['a0', 'a1', 'a2', 'aCorner'])
    pool = program(POOL_VERT, POOL_FRAG, ['uView', 'uColor'], ['aPos'])
    meshBuf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, meshBuf)
    gl.bufferData(gl.ARRAY_BUFFER, mesh.data, gl.STATIC_DRAW)
    quadBuf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0, 0, 0, 0)
    alive = true
  }
  try {init()} catch (err) {console.warn('[mesh] webgl init failed', err); canvas.remove(); return}

  // --- viewport --------------------------------------------------------------
  let vw = 0, vh = 0, scale = 1, offX = 0, offY = 0
  const resize = () => {
    vw = innerWidth; vh = innerHeight
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(vw * dpr)
    canvas.height = Math.round(vh * dpr)
    canvas.style.width = vw + 'px'
    canvas.style.height = vh + 'px'
    gl.viewport(0, 0, canvas.width, canvas.height)
    scale = Math.max(vw / W, vh / H) // "slice" cover
    offX = (vw - W * scale) / 2
    offY = 0 // xMidYMin — top aligned
  }
  resize()

  // --- colour ----------------------------------------------------------------
  let cr = 181, cg = 132, cb = 42
  const readColor = () => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--mesh-color')
    const m = v.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/)
    if (m) {cr = +m[1]; cg = +m[2]; cb = +m[3]}
    return v.trim() !== ''
  }
  readColor()

  let [Lx, Ly, Lz] = MESH.LIGHT
  const ll = Math.hypot(Lx, Ly, Lz); Lx /= ll; Ly /= ll; Lz /= ll

  // --- draw ------------------------------------------------------------------
  let growth = 0 // relief: 0 flat → 1 full
  let time = 0   // animation time, seconds
  const draw = () => {
    if (!alive) return
    gl.clear(gl.COLOR_BUFFER_BIT)
    const r = cr / 255, g = cg / 255, b = cb / 255

    gl.useProgram(pool.p)
    gl.uniform2f(pool.u.uView, vw, vh)
    gl.uniform3f(pool.u.uColor, r, g, b)
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
    gl.enableVertexAttribArray(pool.a.aPos)
    gl.vertexAttribPointer(pool.a.aPos, 2, gl.FLOAT, false, 0, 0)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    gl.useProgram(crystal.p)
    gl.uniform2f(crystal.u.uView, vw, vh)
    gl.uniform1f(crystal.u.uScale, scale)
    gl.uniform2f(crystal.u.uOff, offX, offY)
    gl.uniform1f(crystal.u.uGrowth, growth)
    gl.uniform3f(crystal.u.uLight, Lx, Ly, Lz)
    gl.uniform3f(crystal.u.uColor, r, g, b)
    gl.uniform1f(crystal.u.uTime, time)
    gl.bindBuffer(gl.ARRAY_BUFFER, meshBuf)
    const stride = FLOATS_PER_VERTEX * 4
    gl.enableVertexAttribArray(crystal.a.a0)
    gl.vertexAttribPointer(crystal.a.a0, 3, gl.FLOAT, false, stride, 0)
    gl.enableVertexAttribArray(crystal.a.a1)
    gl.vertexAttribPointer(crystal.a.a1, 3, gl.FLOAT, false, stride, 12)
    gl.enableVertexAttribArray(crystal.a.a2)
    gl.vertexAttribPointer(crystal.a.a2, 3, gl.FLOAT, false, stride, 24)
    gl.enableVertexAttribArray(crystal.a.aCorner)
    gl.vertexAttribPointer(crystal.a.aCorner, 1, gl.FLOAT, false, stride, 36)
    gl.drawArrays(gl.TRIANGLES, 0, mesh.count * 3)
  }

  // --- entrance + live loop ----------------------------------------------------
  // Drastic, non-linear pop: fast rise decelerating hard into place (easeOutExpo).
  const easeOutExpo = (e: number) => (e >= 1 ? 1 : 1 - Math.pow(2, -10 * e))
  let popStart = -1 // -1: waiting for colour; then the timestamp the pop began
  let waitStart = performance.now()

  let raf = 0
  const frame = (now: number) => {
    raf = 0
    if (!alive) return
    time = now / 1000
    if (popStart < 0) {
      // Flat until the page has colorized (or 1.5s), then a short beat, then pop.
      if (readColor() || now - waitStart >= 1500) popStart = now + 140
    } else if (growth < 1) {
      const e = (now - popStart) / LIVE.POP_MS
      growth = e <= 0 ? 0 : easeOutExpo(Math.min(1, e))
    }
    draw()
    raf = requestAnimationFrame(frame)
  }
  const start = () => {if (!raf && alive) raf = requestAnimationFrame(frame)}
  const stop = () => {if (raf) cancelAnimationFrame(raf); raf = 0}

  draw() // flat
  emit('ready') // parent retires the flat SSR plane

  const params = new URLSearchParams(location.search)
  const forced = params.get('grow')
  let animate = !reduce && forced === null
  if (forced !== null) {
    // Static, for screenshots: `?grow=0..1` pins the relief, `?t=` the
    // animation time in seconds; no loop.
    growth = Math.max(0, Math.min(1, parseFloat(forced) || 0))
    time = parseFloat(params.get('t') || '0') || 0
    draw()
  } else if (reduce) {
    growth = 1
    draw()
  } else {
    start()
  }

  // --- housekeeping ----------------------------------------------------------
  const onResize = () => {resize(); if (!raf) draw()}
  window.addEventListener('resize', onResize)
  const colId = window.setInterval(() => {
    const before = `${cr},${cg},${cb}`
    readColor()
    if (`${cr},${cg},${cb}` !== before && !raf) draw()
  }, 800)

  const onLost = (e: Event) => {e.preventDefault(); alive = false; stop()}
  const onRestored = () => {
    try {init(); resize(); if (animate) start(); else draw()}
    catch (err) {console.warn('[mesh] webgl restore failed', err)}
  }
  canvas.addEventListener('webglcontextlost', onLost)
  canvas.addEventListener('webglcontextrestored', onRestored)

  onBeforeUnmount(() => {
    stop()
    animate = false
    window.removeEventListener('resize', onResize)
    clearInterval(colId)
    canvas.removeEventListener('webglcontextlost', onLost)
    canvas.removeEventListener('webglcontextrestored', onRestored)
    canvas.remove()
  })
})
</script>

<template>
  <span aria-hidden="true" style="display: none"/>
</template>

// Single source of truth for the crystal's tuning dials.
//
// Three consumers read this file:
//   app/utils/mesh.ts                    geometry, for the site's canvas
//   app/components/MeshCanvas.client.vue shading, for the site's canvas
//   scripts/og.sh                        injects these values into og.template.html
//                                        so the share card cannot drift from the site
//
// Plain .mjs rather than .ts on purpose: scripts/og.sh imports it directly with
// node during OG generation, and og.template.html is rendered from a file:// URL
// where module imports are blocked — so the values are injected as a global
// instead. Keep this file free of types and side effects.
export const MESH = Object.freeze({
  // Golden ratio. Sets vertex jitter and the shading falloff curve.
  PHI: 1.618,

  // Grid. W = COLS*CELL and H = ROWS*CELL are the abstract geometry units
  // everything else is expressed in; consumers derive them.
  COLS: 44,
  ROWS: 28,
  CELL: 10,

  // Focal point in normalised (u, v): where the swell peaks and the light pools.
  // Also hardcoded in the CSS ambient gradient and both mask gradients
  // (main.css, og.template.html) as 74% / 30% — move all of them together.
  FU: 0.74,
  FV: 0.30,

  // Relief: a smoothstep ramp from the lower-left floor toward the focal side,
  // so detail concentrates upper-right and the copy sits on calm ground.
  RELIEF_START: 0.12,
  RELIEF_SPAN: 0.70,
  FLOOR: 0.12,

  // Height field: a Gaussian swell at the focal point, plus low-frequency
  // folds, plus per-vertex jitter scaled by the relief.
  SIGMA: 0.34,
  AMP_SWELL: 11,
  AMP_FOLD: 5.5,
  AMP_JITTER: 4.5,
  FOLD_U_FREQ: 2.4,
  FOLD_U_PHASE: 0.6,
  FOLD_V_FREQ: 1.8,
  FOLD_V_PHASE: 0.3,

  // Fixed base light, normalised at the point of use. Rakes from the upper
  // right. Deliberately static — pointer-reactive relighting was built, tried,
  // and rejected.
  LIGHT: [0.42, -0.56, 0.72],

  // falloff = FALL_BASE + FALL_RANGE * (1/PHI)^(dist * FALL_EXP)
  // Too steep here and the crystal goes cold and grey; too shallow and the
  // lower-left stops being calm enough to seat the copy.
  FALL_BASE: 0.34,
  FALL_RANGE: 0.66,
  FALL_EXP: 2.2,

  // Facet opacity = (OP_BASE + OP_LAMBERT * lambert) * falloff.
  // OP_CAP is defensive only: the formula tops out at 0.82.
  OP_BASE: 0.12,
  OP_LAMBERT: 0.70,
  OP_CAP: 0.95,

  // Near-white highlight pass on the brightest facets nearest the focus.
  // Fills only, never strokes — strokes read as a wireframe net.
  HI_LAMBERT_MIN: 0.82,
  HI_FALL_MIN: 0.7,
  HI_SCALE: 0.62,
})

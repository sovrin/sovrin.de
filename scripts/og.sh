#!/usr/bin/env bash
# Render scripts/og.template.html into public/og.png (1200x630) with headless Chromium.
#
# Usage:
#   scripts/og.sh                  # write public/og.png
#   npm run build:og
#   scripts/og.sh --out /tmp/a.png # write somewhere else
#   scripts/og.sh --no-config      # keep the template's own text
#   scripts/og.sh --keep-html      # leave the rendered HTML around for debugging
#
# Text (name / about / domain) is read from app/app.config.ts by default, the
# photo from app/assets/me.jpg and the Geist faces from aequitas' dist (the same
# AEQUITAS_DIST nuxt.config.ts uses), so the card cannot drift from the site.
# Env: CHROME_BIN=/path/to/chrome to pick a browser (see scripts/chrome.sh).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="$ROOT/scripts/og.template.html"
CONFIG="$ROOT/app/app.config.ts"
AEQUITAS="$(cd "$ROOT" && cd "${AEQUITAS_DIST:-../aequitas/dist}" 2>/dev/null && pwd || true)"
OUT="$ROOT/public/og.png"
WIDTH=1200
HEIGHT=630
BUDGET=3000
USE_CONFIG=1
KEEP_HTML=0

while [ $# -gt 0 ]; do
  case "$1" in
    --out)       OUT="${2:?--out needs a path}"; shift 2 ;;
    --size)      WIDTH="${2%%x*}"; HEIGHT="${2##*x}"; shift 2 ;;
    --budget)    BUDGET="${2:?--budget needs ms}"; shift 2 ;;
    --no-config) USE_CONFIG=0; shift ;;
    --keep-html) KEEP_HTML=1; shift ;;
    -h|--help)   sed -n '2,14p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)           echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

[ -f "$TEMPLATE" ] || { echo "template not found: $TEMPLATE" >&2; exit 1; }
[ -f "$AEQUITAS/fonts/geist-latin-wght-normal.woff2" ] || {
  echo "aequitas fonts not found in ${AEQUITAS_DIST:-../aequitas/dist} — build aequitas or set AEQUITAS_DIST" >&2; exit 1; }

# --- locate a Chromium ------------------------------------------------------
. "$ROOT/scripts/chrome.sh"

# --- build the page to render ----------------------------------------------
WORK="$(mktemp -d "${TMPDIR:-/tmp}/og.XXXXXX")"
PAGE="$WORK/og.html"
cleanup() { if [ "$KEEP_HTML" != 1 ]; then rm -rf "$WORK"; fi; }
trap cleanup EXIT

TEMPLATE="$TEMPLATE" PAGE="$PAGE" CONFIG="$CONFIG" ROOT="$ROOT" AEQUITAS="$AEQUITAS" USE_CONFIG="$USE_CONFIG" \
node --input-type=module <<'NODE'
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const { TEMPLATE, PAGE, CONFIG, ROOT, AEQUITAS, USE_CONFIG } = process.env
let html = readFileSync(TEMPLATE, 'utf8')

// The page renders from a temp dir: a <base> at the repo root resolves the
// template's relative photo path, and the faces get absolute file:// URLs.
const face = (family, file) =>
  `@font-face{font-family:'${family}';font-weight:100 900;font-style:normal;`
  + `src:url('${pathToFileURL(`${AEQUITAS}/fonts/${file}`).href}') format('woff2')}`
html = html.replace(
  '</head>',
  `<base href="${pathToFileURL(ROOT).href}/">\n`
  + `<style>${face('Geist', 'geist-latin-wght-normal.woff2')}${face('Geist Mono', 'geist-mono-latin-wght-normal.woff2')}</style>\n</head>`,
)

// Keep the card's text in sync with the site's app config. The regex reads one
// quoted value per key, so a value must not itself contain a quote character.
if (USE_CONFIG === '1') {
  let src = ''
  try { src = readFileSync(CONFIG, 'utf8') } catch { /* no config, keep template text */ }
  const field = (key) => src.match(new RegExp(`\\b${key}\\s*:\\s*['"\`]([^'"\`]*)['"\`]`))?.[1]
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const set = (cls, value) => {
    if (!value) return
    html = html.replace(
      new RegExp(`(<div class="${cls}">)[\\s\\S]*?(</div>)`),
      (_m, open, close) => open + esc(value) + close,
    )
  }
  set('name', field('name'))
  set('about', field('about'))
  set('domain', field('url')?.replace(/^https?:\/\//, '').replace(/\/$/, ''))
}

writeFileSync(PAGE, html)
NODE

# --- render ----------------------------------------------------------------
mkdir -p "$(dirname "$OUT")"
TMP_PNG="$WORK/out.png"

"$CHROME" \
  --headless \
  --disable-gpu \
  --hide-scrollbars \
  --allow-file-access-from-files \
  --force-device-scale-factor=1 \
  --force-color-profile=srgb \
  --window-size="$WIDTH,$HEIGHT" \
  --virtual-time-budget="$BUDGET" \
  --screenshot="$TMP_PNG" \
  "file://$PAGE" >/dev/null 2>&1

[ -s "$TMP_PNG" ] || { echo "render produced no image" >&2; exit 1; }
mv "$TMP_PNG" "$OUT"

DIM=""
if command -v sips >/dev/null 2>&1; then
  DIM="$(sips -g pixelWidth -g pixelHeight "$OUT" | awk '/pixelWidth/{w=$2} /pixelHeight/{h=$2} END{printf "%sx%s ", w, h}')"
fi
echo "wrote $OUT (${DIM}$(du -h "$OUT" | cut -f1))"
if [ "$KEEP_HTML" = 1 ]; then echo "html kept at $PAGE"; fi

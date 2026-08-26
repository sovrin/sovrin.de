#!/usr/bin/env bash
# Render scripts/og.template.html into public/og.png (1200x630) with headless Chromium.
#
# Usage:
#   scripts/og.sh                  # write public/og.png
#   npm run og
#   scripts/og.sh --seed 1234      # reproducible mesh (same seed -> same pixels)
#   scripts/og.sh --out /tmp/a.png # write somewhere else
#   scripts/og.sh --no-config      # keep the template's own text
#   scripts/og.sh --keep-html      # leave the rendered HTML around for debugging
#
# Text (name / phrase / domain) is read from app/app.config.ts by default, so the
# card cannot drift from the site. Env: CHROME_BIN=/path/to/chrome to pick a browser.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="$ROOT/scripts/og.template.html"
CONFIG="$ROOT/app/app.config.ts"
OUT="$ROOT/public/og.png"
WIDTH=1200
HEIGHT=630
BUDGET=6000
SEED=""
USE_CONFIG=1
KEEP_HTML=0

while [ $# -gt 0 ]; do
  case "$1" in
    --seed)      SEED="${2:?--seed needs a value}"; shift 2 ;;
    --out)       OUT="${2:?--out needs a path}"; shift 2 ;;
    --size)      WIDTH="${2%%x*}"; HEIGHT="${2##*x}"; shift 2 ;;
    --budget)    BUDGET="${2:?--budget needs ms}"; shift 2 ;;
    --no-config) USE_CONFIG=0; shift ;;
    --keep-html) KEEP_HTML=1; shift ;;
    -h|--help)   sed -n '2,15p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)           echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

[ -f "$TEMPLATE" ] || { echo "template not found: $TEMPLATE" >&2; exit 1; }

# --- locate a Chromium ------------------------------------------------------
find_chrome() {
  if [ -n "${CHROME_BIN:-}" ]; then echo "$CHROME_BIN"; return 0; fi
  local c
  for c in \
    "$HOME/Library/Caches/ms-playwright"/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell \
    "$HOME/.cache/ms-playwright"/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell \
    "$HOME/Library/Caches/ms-playwright"/chromium-*/chrome-*/Chromium.app/Contents/MacOS/Chromium \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "$(command -v google-chrome || true)" \
    "$(command -v chromium || true)"
  do
    if [ -n "$c" ] && [ -x "$c" ]; then echo "$c"; fi
  done | tail -n 1
}

CHROME="$(find_chrome || true)"
if [ -z "$CHROME" ] || [ ! -x "$CHROME" ]; then
  echo "No Chromium found. Install one:" >&2
  echo "  npx playwright install chromium-headless-shell" >&2
  echo "or set CHROME_BIN=/path/to/chrome." >&2
  exit 1
fi

# --- build the page to render ----------------------------------------------
WORK="$(mktemp -d "${TMPDIR:-/tmp}/og.XXXXXX")"
PAGE="$WORK/og.html"
cleanup() { if [ "$KEEP_HTML" != 1 ]; then rm -rf "$WORK"; fi; }
trap cleanup EXIT

TEMPLATE="$TEMPLATE" PAGE="$PAGE" CONFIG="$CONFIG" SEED="$SEED" USE_CONFIG="$USE_CONFIG" \
node --input-type=module <<'NODE'
import { readFileSync, writeFileSync } from 'node:fs'

const { TEMPLATE, PAGE, CONFIG, SEED, USE_CONFIG } = process.env
let html = readFileSync(TEMPLATE, 'utf8')

// Deterministic mesh: seed Math.random before the template's own script runs.
// The template file itself is never modified.
if (SEED) {
  const shim = `<script>(function(){var s=(${Number(SEED) >>> 0})>>>0;`
    + `Math.random=function(){s=(s+0x6D2B79F5)>>>0;var t=s;`
    + `t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);`
    + `return((t^(t>>>14))>>>0)/4294967296;};})();</script>`
  html = html.replace('</head>', `${shim}\n</head>`)
}

// Keep the card's text in sync with the site's app config.
if (USE_CONFIG === '1') {
  let src = ''
  try { src = readFileSync(CONFIG, 'utf8') } catch { /* no config, keep template text */ }
  const field = (key) => src.match(new RegExp(`${key}\\s*:\\s*['"\`]([^'"\`]*)['"\`]`))?.[1]
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const set = (cls, value) => {
    if (!value) return
    html = html.replace(
      new RegExp(`(<div class="${cls}">)[\\s\\S]*?(</div>)`),
      (_m, open, close) => open + esc(value) + close,
    )
  }
  set('name', field('user'))
  set('phrase', field('phrase'))
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
echo "wrote $OUT (${DIM}${SEED:+seed=$SEED }$(du -h "$OUT" | cut -f1))"
if [ "$KEEP_HTML" = 1 ]; then echo "html kept at $PAGE"; fi

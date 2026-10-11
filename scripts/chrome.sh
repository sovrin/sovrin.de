# Sourced by og.sh and shots.sh: sets CHROME to a headless-capable Chromium or exits.
#
# First match wins, so Playwright's headless shell beats a full Chrome: Chrome's
# headless --screenshot counts window chrome in --window-size and leaves the
# bottom ~90px of the capture black.
# Env: CHROME_BIN=/path/to/chrome to pick a browser.

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
  done | head -n 1
}

CHROME="$(find_chrome || true)"
if [ -z "$CHROME" ] || [ ! -x "$CHROME" ]; then
  echo "No Chromium found. Install one:" >&2
  echo "  npx playwright install chromium-headless-shell" >&2
  echo "or set CHROME_BIN=/path/to/chrome." >&2
  exit 1
fi

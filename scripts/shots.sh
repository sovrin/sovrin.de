#!/usr/bin/env bash
# Capture each deployed project's homepage into app/assets/work/<repo>.jpg, the
# screenshots Projects.vue features. Needs macOS (sips) and a Chromium.
#
# Usage:
#   scripts/shots.sh                  # every repo with a homepage
#   npm run build:shots
#   scripts/shots.sh sonotas aequitas # only these repos
#   scripts/shots.sh --out /tmp/shots # write somewhere else to compare first
#
# The repos come from the GitHub API with the same filter as
# server/api/projects.get.ts (no forks, archived or private repos; homepage must
# be an http(s) URL). Each page is shot at 1440x900 in dark mode and saved as a
# 1200px wide JPEG. It captures the first load as-is: a cookie banner or splash
# screen ends up in the picture.
# Env: NUXT_GITHUB_TOKEN lifts the API rate limit; NUXT_PUBLIC_GITHUB_USER picks
# the account; CHROME_BIN picks a browser (see scripts/chrome.sh).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/app/assets/work"
GITHUB_USER="${NUXT_PUBLIC_GITHUB_USER:-$(sed -n "s/.*githubUser: '\([^']*\)'.*/\1/p" "$ROOT/nuxt.config.ts")}"
BUDGET=6000
ONLY=()

while [ $# -gt 0 ]; do
  case "$1" in
    --out)    OUT="${2:?--out needs a path}"; shift 2 ;;
    --budget) BUDGET="${2:?--budget needs ms}"; shift 2 ;;
    -h|--help) sed -n '2,18p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*)       echo "unknown option: $1" >&2; exit 2 ;;
    *)        ONLY+=("$1"); shift ;;
  esac
done

command -v sips >/dev/null 2>&1 || { echo "sips not found (macOS only)" >&2; exit 1; }
. "$ROOT/scripts/chrome.sh"

# --- which repos ------------------------------------------------------------
LIST="$(GITHUB_USER="$GITHUB_USER" TOKEN="${NUXT_GITHUB_TOKEN:-}" node --input-type=module <<'NODE'
const { GITHUB_USER, TOKEN } = process.env
const headers = { accept: 'application/vnd.github+json', 'user-agent': 'sovrin.de', 'x-github-api-version': '2022-11-28' }
if (TOKEN) headers.authorization = `Bearer ${TOKEN}`
const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=pushed&per_page=100&type=owner`, { headers })
if (!res.ok) { console.error(`GitHub API: ${res.status} ${res.statusText}`); process.exit(1) }
for (const r of await res.json()) {
  if (r.fork || r.archived || r.private || r.name === GITHUB_USER) continue
  if (/^https?:\/\//i.test(r.homepage ?? '')) console.log(`${r.name} ${r.homepage}`)
}
NODE
)"

mkdir -p "$OUT"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/shots.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT

done_any=0
failed=0
while read -r name url; do
  [ -n "$name" ] || continue
  if [ ${#ONLY[@]} -gt 0 ] && [[ ! " ${ONLY[*]} " =~ " $name " ]]; then continue; fi
  done_any=1
  png="$WORK/$name.png"
  "$CHROME" \
    --headless \
    --disable-gpu \
    --hide-scrollbars \
    --force-device-scale-factor=1 \
    --force-color-profile=srgb \
    --blink-settings=preferredColorScheme=0 \
    --window-size=1440,900 \
    --virtual-time-budget="$BUDGET" \
    --screenshot="$png" \
    "$url" >/dev/null 2>&1 || true
  if [ -s "$png" ] && sips -s format jpeg -s formatOptions 82 --resampleWidth 1200 "$png" --out "$OUT/$name.jpg" >/dev/null 2>&1; then
    echo "wrote $OUT/$name.jpg  ($url, $(du -h "$OUT/$name.jpg" | cut -f1))"
  else
    echo "failed $name ($url)" >&2
    failed=1
  fi
done <<< "$LIST"

if [ "$done_any" = 0 ]; then
  echo "no matching repos with a homepage${ONLY:+ among: ${ONLY[*]}}" >&2
  exit 1
fi
exit "$failed"

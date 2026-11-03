#!/usr/bin/env bash
# Build Retirement Map and push it live.
#   ./deploy.sh
#
# Shares a deploy target with the sibling project in dev/finance/monteCarlo/claude: same
# apps.eloquentix.com/radu/mc/ folder, same radu-deploy host. This repo owns all.html,
# angels.html and artist.html there (plan.html belongs to the sibling project and is
# never touched by this script).
#
# Uses the `radu-deploy` host from ~/.ssh/config (key: id_ed25519_eloquentix),
# so it does not depend on ssh-agent state.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOST="radu-deploy"
REMOTE="/var/www/apps/radu/mc"

cd "$ROOT"

echo "▸ building pages…"
node build.mjs

# Live set only. one-salary-two-homes.html is built locally but not published
# here — add it below once it's meant to go public.
PAGES=(all.html angels.html artist.html)

echo "▸ ensuring remote dir…"
ssh "$HOST" "mkdir -p $REMOTE"

echo "▸ pushing pages…"
scp "${PAGES[@]}" "$HOST:$REMOTE/"

echo "▸ fixing ownership…"
ssh "$HOST" "chown -R www-data:www-data $REMOTE"

echo "▸ verifying…"
base="https://apps.eloquentix.com/radu/mc"
for p in "${PAGES[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$base/$p")
  printf "  %s  %s/%s\n" "$code" "$base" "$p"
done

echo "✓ deployed."

#!/usr/bin/env bash
set -euo pipefail

START_PORT="${1:-8000}"
END_PORT="${2:-9000}"

for ((port=START_PORT; port<=END_PORT; port++)); do
  if ! ss -tuln | awk '{print $5}' | grep -q ":${port}$"; then
    echo "$port"
    exit 0
  fi
done

echo "No free port found in range ${START_PORT}-${END_PORT}" >&2
exit 1


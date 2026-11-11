#!/usr/bin/env bash
# Frontend only: free port 3000, then run Next.js on exactly :3000.
# Usage (from frontend/):  ./dev.sh
set -u
cd "$(dirname "$0")"
PORT=3000

pids="$(lsof -ti tcp:${PORT} 2>/dev/null || true)"
if [ -n "$pids" ]; then
  echo "Port ${PORT} busy (PIDs: $(echo $pids | tr '\n' ' ')). Killing..."
  kill -9 $pids 2>/dev/null || true
  sleep 1
else
  echo "Port ${PORT} is free."
fi

echo "Starting frontend on http://localhost:${PORT}/ ..."
exec npm run dev -- -p "${PORT}"

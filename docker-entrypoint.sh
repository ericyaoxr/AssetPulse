#!/bin/sh
set -e

DATA_DIR="${DATA_DIR:-/app/data}"

if [ ! -d "$DATA_DIR" ]; then
  mkdir -p "$DATA_DIR"
fi

chown -R appuser:appgroup "$DATA_DIR" 2>/dev/null || true

exec su-exec appuser node index.js

#!/bin/sh
set -e

DATA_DIR="${DATA_DIR:-/app/data}"

if [ ! -d "$DATA_DIR" ]; then
  mkdir -p "$DATA_DIR"
fi

chown -R appuser:appgroup "$DATA_DIR" 2>/dev/null || true

DB_FILE="$DATA_DIR/assetpulse.db"
if [ -f "$DB_FILE" ]; then
  chown appuser:appgroup "$DB_FILE" 2>/dev/null || true
  chmod 664 "$DB_FILE" 2>/dev/null || true
fi

for ext in wal shm; do
  if [ -f "$DB_FILE-$ext" ]; then
    chown appuser:appgroup "$DB_FILE-$ext" 2>/dev/null || true
    chmod 664 "$DB_FILE-$ext" 2>/dev/null || true
  fi
done

if [ "$(id -u)" = "0" ]; then
  exec su-exec appuser node index.js
else
  exec node index.js
fi

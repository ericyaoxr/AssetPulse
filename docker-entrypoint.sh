#!/bin/sh
set -e

DATA_DIR="${DATA_DIR:-/app/data}"

mkdir -p "$DATA_DIR"
chmod 777 "$DATA_DIR"

DB_FILE="$DATA_DIR/assetpulse.db"
if [ -f "$DB_FILE" ]; then
  chmod 666 "$DB_FILE" 2>/dev/null || true
fi

for ext in wal shm; do
  if [ -f "$DB_FILE-$ext" ]; then
    chmod 666 "$DB_FILE-$ext" 2>/dev/null || true
  fi
done

exec node index.js

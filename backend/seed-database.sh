#!/bin/sh

set -e
set -u

ENV="${1:-development}"

TABLE_EXISTS=$(npx tsx ./check-table.ts)

if [ "$TABLE_EXISTS" -eq 0 ]; then
  echo "Table 'currencies' does not exist. Running 'npm run db:push'..."
  npm run db:push
else
  echo "Table 'currencies' already exists. Skipping 'npm run db:push'."
fi

case "$ENV" in
"development")
  echo "Running in development mode ('npm run dev')..."
  npm run dev
  ;;
"production")
  echo "Running in production mode ('npm run start')..."
  npm run start
  ;;
*)
  echo "Warning: Unknown environment '$ENV'. No specific npm run command executed." >&2
  exit 1
  ;;
esac

echo "Script finished."

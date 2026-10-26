#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../local-sensor" && pwd)"
cd "$ROOT"
if [[ ! -f .env ]]; then
  cp .env.example .env
  TOKEN="$(python3 -c 'import secrets; print(secrets.token_urlsafe(48))')"
  python3 - "$TOKEN" <<'PY'
from pathlib import Path
import sys
p = Path('.env')
s = p.read_text()
s = s.replace('REPLACE_WITH_RANDOM_32_PLUS_CHARACTER_SECRET', sys.argv[1])
p.write_text(s)
print('LOCAL SENSOR TOKEN (paste into CyberAmour; keep private): ' + sys.argv[1])
PY
else
  grep '^CYBERAMOUR_SENSOR_TOKEN=' .env | sed 's/^CYBERAMOUR_SENSOR_TOKEN=/LOCAL SENSOR TOKEN (paste into CyberAmour; keep private): /'
fi
python3 -m pip install --user -r requirements.txt
exec python3 -m uvicorn sensor:app --host 127.0.0.1 --port 8765

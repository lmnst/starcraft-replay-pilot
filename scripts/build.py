"""Validate CMS content and produce a static GitHub Pages artifact. No dependencies."""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
OUT = ROOT / 'dist'
records = []
ids = set()
for entry in sorted((ROOT / 'content' / 'matches').glob('*.json')):
    record = json.loads(entry.read_text(encoding='utf-8'))
    for key in ('id', 'title_en', 'title_zh', 'player1', 'player2', 'map', 'replay'):
        if not isinstance(record.get(key), str) or not record[key].strip():
            raise ValueError(f'{entry.name}: missing {key}')
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]*', record['id']) or record['id'] in ids:
        raise ValueError(f'{entry.name}: invalid or duplicate id')
    ids.add(record['id'])
    relative = record['replay'].lstrip('/')
    replay = (SITE / relative).resolve()
    if not replay.is_relative_to((SITE / 'replays').resolve()) or replay.suffix.lower() != '.rep':
        raise ValueError(f'{entry.name}: replay must be in /replays/')
    data = replay.read_bytes()
    if len(data) < 32:
        raise ValueError(f'{entry.name}: replay is empty or truncated')
    record['sha256'] = hashlib.sha256(data).hexdigest()
    record['replay_bytes'] = len(data)
    if record.get('visible', False):
        records.append(record)
shutil.copytree(SITE, OUT, dirs_exist_ok=True)
catalog = {'matches': records, 'revision': os.environ.get('GITHUB_SHA', 'local'),
           'built_at': datetime.now(timezone.utc).isoformat()}
(OUT / 'catalog.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding='utf-8')
(OUT / '.nojekyll').touch()
print(f'Validated {len(records)} published match(es). Output: {OUT}')

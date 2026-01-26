import json
from pathlib import Path
from typing import Dict, Any

from config.constants import CACHE_FILE as CACHE_FILENAME


CACHE_FILE = Path(__file__).parent.parent / CACHE_FILENAME


def load_cache() -> Dict[str, Any]:
    if CACHE_FILE.exists():
        with open(CACHE_FILE, 'r') as f:
            return json.load(f)
    return {}


def save_cache(cache: Dict[str, Any]) -> None:
    with open(CACHE_FILE, 'w') as f:
        json.dump(cache, f)

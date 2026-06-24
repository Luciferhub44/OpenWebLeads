import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from alembic.config import Config
from alembic import command

try:
    cfg = Config(os.path.join(os.path.dirname(os.path.abspath(__file__)), "alembic.ini"))
    command.upgrade(cfg, "head")
except Exception as e:
    print(f"Migration warning: {e}")

import uvicorn
uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 7989)))

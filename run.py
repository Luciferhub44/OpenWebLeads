import os
import subprocess

subprocess.run(["alembic", "upgrade", "head"], check=False)

import uvicorn
uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 7989)))

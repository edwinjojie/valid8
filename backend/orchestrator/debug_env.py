from dotenv import load_dotenv, find_dotenv
import os
from pathlib import Path

print(f"CWD: {os.getcwd()}")
print(f"find_dotenv: {find_dotenv()}")

env_path = Path(__file__).parent / ".env"
print(f"Explicit path: {env_path}")
print(f"Explicit path exists: {env_path.exists()}")

loaded = load_dotenv(dotenv_path=env_path)
print(f"Loaded: {loaded}")
print(f"INGESTION_BASE_URL in env: {'INGESTION_BASE_URL' in os.environ}")

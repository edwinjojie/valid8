import os

# Orchestrator Config
# STRICT: Must be provided by environment (Render or .env)
INGESTION_BASE_URL = os.environ["INGESTION_BASE_URL"]
VALIDATION_BASE_URL = os.environ["VALIDATION_BASE_URL"]

# Helper to join paths safely
def get_service_url(base, path):
    return f"{base.rstrip('/')}/{path.lstrip('/')}"

"""
Valid8 Validation Microservice
- Uses llm_client for generation
- LLM agnostic (Gemini / Ollama via env vars)
"""

import os
from dotenv import load_dotenv

# Force load .env from the same directory as this file
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

import json
import re
import asyncio
from typing import List, Dict, Any

from dotenv import load_dotenv

# Force load .env from the same directory as this file
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- REFACTOR: Import generate from local llm_client ---
from llm_client import generate
from npi_lookup_api import fetch_npi

<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------
RETRY_ATTEMPTS = int(os.getenv("LLM_RETRY_ATTEMPTS", "3"))
LLM_TIMEOUT_SECONDS = float(os.getenv("LLM_TIMEOUT_SECONDS", "120.0"))

# -----------------------------------------------------------------------------
# Pydantic Models
# -----------------------------------------------------------------------------
class ValidationResult(BaseModel):
    updated_fields: dict
    discrepancies: list
    confidence_scores: dict
    validation_notes: list
    requires_manual_review: bool


class ValidationResponse(BaseModel):
    status: str
    validated: List[ValidationResult]


# -----------------------------------------------------------------------------
# FastAPI App
# -----------------------------------------------------------------------------
app = FastAPI(
    title="Valid8 Validation",
    description="Validates provider data using agnostic LLM interface.",
    version="1.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)


# -----------------------------------------------------------------------------
# Prompt Template
# -----------------------------------------------------------------------------
VALIDATION_PROMPT = """
You are a Provider Validation Agent.

Your tasks:
- Compare INPUT_PROVIDER_DATA against EXTERNAL_REFERENCE_DATA.
- Identify discrepancies.
- Suggest corrected fields in updated_fields.
- Assign confidence_scores for every field.
- Add validation_notes explaining changes.
- Decide requires_manual_review = true/false.

CRITICAL RULES:
1. If INPUT_PROVIDER_DATA has NO 'npi_number', you MUST:
   - add "Missing NPI Number" to discrepancies
   - set requires_manual_review = true
   - set confidence_scores.npi_number = 0.0

2. If EXTERNAL_REFERENCE_DATA is empty or contains "error", but an NPI was provided:
   - add "Invalid NPI - No match found in registry" to discrepancies
   - set requires_manual_review = true

3. If data matches the external reference, confidence should be high (0.9-1.0).

Output JSON only:
{
  "updated_fields": {...},
  "discrepancies": [...],
  "confidence_scores": {...},
  "validation_notes": [...],
  "requires_manual_review": true/false
}

NO markdown. 
NO explanations.
Return ONLY JSON.
"""


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def robust_extract_json(content: str):
    content = content.replace("```json", "").replace("```", "")
    try:
        return json.loads(content)
    except:
        pass
    match = re.search(r"\{.*\}", content, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except:
            pass
    raise HTTPException(500, "LLM returned invalid JSON.")


async def call_llm_with_retries(prompt: str) -> Dict[str, Any]:
    """
    Calls configured LLM via llm_client.
    """
    async def _call_once():
        def blocking():
            return generate(prompt)
        return await asyncio.to_thread(blocking)

    backoff = 1
    last_error = None

    for attempt in range(RETRY_ATTEMPTS):
        try:
            raw = await asyncio.wait_for(_call_once(), timeout=LLM_TIMEOUT_SECONDS)
            return robust_extract_json(raw)
        except Exception as e:
            last_error = e
            if attempt < RETRY_ATTEMPTS - 1:
                await asyncio.sleep(backoff)
                backoff *= 2
    
    raise HTTPException(500, f"LLM failed after retries: {last_error}")


# -----------------------------------------------------------------------------
# Validation Logic
# -----------------------------------------------------------------------------
async def validate_single_provider(provider: dict) -> ValidationResult:
    # Step 1 — Fetch NPI reference data
    npi_data = {}
    if provider.get("npi_number"):
        try:
            npi_data = fetch_npi(provider["npi_number"])
        except Exception as e:
            npi_data = {"error": str(e)}

    # Step 2 — Construct prompt
    prompt = f"""
{VALIDATION_PROMPT}

INPUT_PROVIDER_DATA:
{json.dumps(provider)}

EXTERNAL_REFERENCE_DATA:
{json.dumps(npi_data)}
"""

    # Step 3 — LLM Validation
    result = await call_llm_with_retries(prompt)
    return ValidationResult(**result)


# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------
@app.post("/validate", response_model=ValidationResponse)
async def validate_providers(providers: List[dict]):
    tasks = [validate_single_provider(p) for p in providers]
    results = await asyncio.gather(*tasks)
    return ValidationResponse(
        status="success",
        validated=results
    )


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "llm_provider": os.getenv("LLM_PROVIDER", "gemini")
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main_v:app", host="0.0.0.0", port=8002, reload=True)

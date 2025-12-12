"""
Valid8 Validation Microservice (Gemini SDK version)
- Uses google.generativeai SDK with gemini-2.5-flash by default.
- Performs provider validation against external NPI reference data.
- Independent microservice (does NOT depend on ingestion service internals).
"""

import os
import json
import re
import asyncio
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv


# Gemini SDK
import google.generativeai as genai

# External NPI lookup (separate file)
from npi_lookup_api import fetch_npi

load_dotenv()

# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_VALIDATION_MODEL", "gemini-2.5-flash")
RETRY_ATTEMPTS = int(os.getenv("LLM_RETRY_ATTEMPTS", "3"))
LLM_TIMEOUT_SECONDS = float(os.getenv("LLM_TIMEOUT_SECONDS", "120.0"))

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


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
    title="Valid8 Validation (Gemini SDK)",
    description="Validates cleaned provider data using NPI reference + Gemini LLM.",
    version="1.0.0"
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
# Helper: Extract valid JSON
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

    raise HTTPException(500, "Gemini returned invalid JSON.")


# -----------------------------------------------------------------------------
# Helper: Call Gemini with retries
# -----------------------------------------------------------------------------
async def call_gemini(prompt: str) -> Dict[str, Any]:

    async def call_once():
        def blocking():
            model = genai.GenerativeModel(GEMINI_MODEL)
            resp = model.generate_content(prompt)
            return resp.text
        return await asyncio.to_thread(blocking)

    backoff = 1
    last_error = None

    for attempt in range(RETRY_ATTEMPTS):
        try:
            raw = await asyncio.wait_for(call_once(), timeout=LLM_TIMEOUT_SECONDS)
            return robust_extract_json(raw)

        except Exception as e:
            last_error = e
            if attempt < RETRY_ATTEMPTS - 1:
                await asyncio.sleep(backoff)
                backoff *= 2

    raise HTTPException(500, f"Gemini API failed after retries: {last_error}")


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
    result = await call_gemini(prompt)

    return ValidationResult(**result)


# -----------------------------------------------------------------------------
# API Endpoint: Validate list of providers
# -----------------------------------------------------------------------------
@app.post("/validate", response_model=ValidationResponse)
async def validate_providers(providers: List[dict]):

    tasks = [validate_single_provider(p) for p in providers]
    results = await asyncio.gather(*tasks)

    return ValidationResponse(
        status="success",
        validated=results
    )


# -----------------------------------------------------------------------------
# Health Check
# -----------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model": GEMINI_MODEL,
        "key_configured": bool(GEMINI_API_KEY)
    }


# -----------------------------------------------------------------------------
# Run
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main_v:app", host="0.0.0.0", port=8002, reload=True)

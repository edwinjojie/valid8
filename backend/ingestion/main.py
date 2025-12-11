"""
Valid8 Ingestion Microservice (Gemini SDK version)
- Uses google.generativeai SDK with gemini-2.5-flash by default.
- Safer: retries, robust JSON extraction, runs blocking SDK calls off the event loop.
"""

import os
import json
import re
import secrets
import asyncio
from typing import List, Dict, Any, Optional
from io import StringIO

import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Gemini SDK
import google.generativeai as genai

load_dotenv()

# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------
STANDARD_FIELDS = [
    "provider_id",
    "name",
    "specialty",
    "phone",
    "email",
    "address",
    "npi_number",
    "license_number",
]

# Environment-configurable
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
MAX_ROWS_TO_SAMPLE = int(os.getenv("MAX_ROWS_TO_SAMPLE", "50"))
LLM_TIMEOUT_SECONDS = float(os.getenv("LLM_TIMEOUT_SECONDS", "120.0"))
RETRY_ATTEMPTS = int(os.getenv("LLM_RETRY_ATTEMPTS", "3"))

# Configure SDK if key present
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# -----------------------------------------------------------------------------
# Pydantic models
# -----------------------------------------------------------------------------
class ProviderConfidence(BaseModel):
    provider_id: float = Field(ge=0.0, le=1.0)
    name: float = Field(ge=0.0, le=1.0)
    specialty: float = Field(ge=0.0, le=1.0)
    phone: float = Field(ge=0.0, le=1.0)
    email: float = Field(ge=0.0, le=1.0)
    address: float = Field(ge=0.0, le=1.0)
    npi_number: float = Field(ge=0.0, le=1.0)
    license_number: float = Field(ge=0.0, le=1.0)

#for the validation module because validation expects these fields
class ProviderValidation(BaseModel):
    updated_fields: dict
    discrepancies: list
    confidence_scores: dict
    validation_notes: list
    requires_manual_review: bool


class CleanedProvider(BaseModel):
    provider_id: Optional[str] = None
    name: Optional[str] = None
    specialty: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    npi_number: Optional[str] = None
    license_number: Optional[str] = None
    confidence: ProviderConfidence
    ai_notes: List[str] = []
    source_row: int
    validation: Optional[ProviderValidation] = None



class IngestionResponse(BaseModel):
    status: str
    total_providers: int
    providers: List[CleanedProvider]
    processing_notes: List[str] = []


# -----------------------------------------------------------------------------
# FastAPI app
# -----------------------------------------------------------------------------
app = FastAPI(
    title="Valid8 Ingestion (Gemini SDK)",
    description="AI-powered healthcare provider data cleaning and normalization using Gemini SDK",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def generate_temp_id() -> str:
    return f"TEMP-{secrets.token_hex(3)}"


def prepare_prompt_from_csv(df: pd.DataFrame) -> str:
    csv_sample = df.head(MAX_ROWS_TO_SAMPLE).to_csv(index=False)
    prompt = f"""You are a healthcare data cleaning AI. Your task is to clean, normalize, and structure messy provider data.

INPUT DATA (CSV):
{csv_sample}

INSTRUCTIONS:
1. Parse the CSV and extract provider information
2. Map data to: provider_id, name, specialty, phone, email, address, npi_number, license_number
3. Clean data:
   - Names: Title Case
   - Emails: lowercase
   - Phones: digits only with optional + prefix
   - Addresses: single normalized string
   - Fix specialty typos
4. Extract fields from free text (e.g., 'NPI 1234' or 'CA license 9999')
5. For each field, provide a confidence score (0.0-1.0)
6. Document all changes in ai_notes array
7. Use null for missing values (not empty strings)
8. ALWAYS return valid JSON only. NO explanations or markdown.

OUTPUT FORMAT:
{{
  "providers": [
    {{
      "provider_id": "string or null",
      "name": "string or null",
      "specialty": "string or null",
      "phone": "string or null",
      "email": "string or null",
      "address": "string or null",
      "npi_number": "string or null",
      "license_number": "string or null",
      "confidence": {{
        "provider_id": 0.90,
        "name": 0.95,
        "specialty": 0.85,
        "phone": 0.90,
        "email": 0.92,
        "address": 0.88,
        "npi_number": 0.99,
        "license_number": 0.87
      }},
      "ai_notes": ["sample note"],
      "source_row": 0
    }}
  ]
}}
"""
    return prompt


def robust_extract_json(content: str) -> Dict[str, Any]:
    """
    Robustly extract the first JSON object from content, clean common issues,
    and return parsed JSON or raise HTTPException.
    """
    # Direct attempt
    try:
        return json.loads(content)
    except Exception:
        pass

    # Remove common fences and lead text
    content_clean = content.replace("```json", "").replace("```", "")
    # Attempt to find first balanced JSON object using a stack approach
    start = None
    brace_count = 0
    for i, ch in enumerate(content_clean):
        if ch == "{":
            if start is None:
                start = i
            brace_count += 1
        elif ch == "}":
            brace_count -= 1
            if brace_count == 0 and start is not None:
                candidate = content_clean[start : i + 1]
                # quick cleanup
                candidate = candidate.strip()
                candidate = re.sub(r",\s*}", "}", candidate)
                candidate = re.sub(r",\s*\]", "]", candidate)
                # try to parse
                try:
                    return json.loads(candidate)
                except Exception:
                    # continue looking further if parsing fails
                    start = None
                    brace_count = 0
                    continue

    # fallback: try to find with regex (less reliable)
    regex_match = re.search(r'\{(?:[^{}]|\n|\r)*\}', content_clean)
    if regex_match:
        candidate = regex_match.group(0)
        candidate = re.sub(r",\s*}", "}", candidate)
        candidate = re.sub(r",\s*\]", "]", candidate)
        try:
            return json.loads(candidate)
        except Exception:
            pass

    # give helpful debug in error
    raise HTTPException(status_code=500, detail="Gemini did not return valid JSON. Raw (truncated): " + content[:400])


async def call_gemini_with_retries(prompt: str, model_name: str = GEMINI_MODEL) -> Dict[str, Any]:
    """
    Calls the Gemini SDK model in a thread (so it doesn't block the event loop),
    with simple retries for transient failures (e.g., 429/503).
    """
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured.")

    async def _call_once():
        # Use to_thread to run blocking SDK call off the event loop
        def blocking_call():
            model = genai.GenerativeModel(model_name)
            # generate_content returns an object with .text typically
            # The SDK interface may vary by version; using generate_content like your working snippet
            response = model.generate_content(prompt)
            # prefer .text, but fallback if structure differs
            if hasattr(response, "text") and response.text:
                return response.text
            # Some SDK versions have .candidates or choices - handle gracefully
            try:
                data = response.to_dict() if hasattr(response, "to_dict") else response
                # try to dig out text
                # This is defensive: adapt to your SDK version if needed
                if isinstance(data, dict):
                    # try multiple known paths
                    if "candidates" in data and data["candidates"]:
                        parts = data["candidates"][0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
                    if "output" in data:
                        return data.get("output", "")
                return str(data)
            except Exception:
                return str(response)

        # run blocking call
        return await asyncio.to_thread(blocking_call)

    backoff = 1.0
    for attempt in range(RETRY_ATTEMPTS):
        try:
            raw_text = await asyncio.wait_for(_call_once(), timeout=LLM_TIMEOUT_SECONDS)
            parsed = robust_extract_json(raw_text)
            return parsed
        except HTTPException:
            # extractor-specific failure (invalid JSON) - do not retry many times
            raise
        except Exception as e:
            # transient-ish errors: sleep and retry on certain exceptions
            last_exc = e
            if attempt < RETRY_ATTEMPTS - 1:
                await asyncio.sleep(backoff)
                backoff *= 2
                continue
            # final failure
            raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

    # unreachable
    raise HTTPException(status_code=500, detail="Gemini API unknown error")


def post_process_providers(providers: List[Dict[str, Any]]) -> List[CleanedProvider]:
    processed = []
    for provider_data in providers:
        if not provider_data.get("provider_id"):
            provider_data["provider_id"] = generate_temp_id()

        if "confidence" not in provider_data:
            provider_data["confidence"] = {field: 0.5 for field in STANDARD_FIELDS}

        for field in STANDARD_FIELDS:
            if field not in provider_data or provider_data[field] == "":
                provider_data[field] = None

        if "ai_notes" not in provider_data:
            provider_data["ai_notes"] = []

        if "source_row" not in provider_data:
            provider_data["source_row"] = 0

        try:
            processed.append(CleanedProvider(**provider_data))
        except Exception as e:
            # Print for debugging but continue
            print(f"Warning: provider validation failed: {e}")
            continue
    return processed


# -----------------------------------------------------------------------------
# API endpoints
# -----------------------------------------------------------------------------
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "valid8-ingestion",
        "version": "1.0.0",
        "llm_provider": "gemini",
        "llm_model": GEMINI_MODEL,
        "llm_configured": bool(GEMINI_API_KEY),
    }


@app.post("/ingest/csv", response_model=IngestionResponse)
async def ingest_csv(file: UploadFile = File(...)):
    # Validate extension
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    # Read CSV
    try:
        content = await file.read()
        csv_string = content.decode("utf-8")
        df = pd.read_csv(StringIO(csv_string))
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="CSV encoding error; ensure UTF-8.")
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty.")
    except pd.errors.ParserError as e:
        raise HTTPException(status_code=400, detail=f"CSV parsing error: {e}")

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file contains no rows.")

    # Build prompt & call LLM
    prompt = prepare_prompt_from_csv(df)
    llm_response = await call_gemini_with_retries(prompt, GEMINI_MODEL)

    if "providers" not in llm_response or not isinstance(llm_response["providers"], list):
        raise HTTPException(status_code=500, detail="Gemini output missing 'providers' list.")

    providers = post_process_providers(llm_response["providers"])

    return IngestionResponse(
        status="success",
        total_providers=len(providers),
        providers=providers,
        processing_notes=[
            f"Processed {len(df)} rows from CSV",
            f"Extracted {len(providers)} provider records",
            f"Used LLM model: {GEMINI_MODEL}",
        ],
    )


# -----------------------------------------------------------------------------
# Run
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)

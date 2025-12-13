"""
Valid8 Ingestion Microservice
- Uses llm_client for generation
- LLM agnostic (Gemini / Ollama via env vars)
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

# --- REFACTOR: Import generate from local llm_client ---
from llm_client import generate

load_dotenv()

# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------
STANDARD_FIELDS = [
    "provider_id", "name", "specialty", "phone", "email", "address", "npi_number", "license_number",
]

MAX_ROWS_TO_SAMPLE = int(os.getenv("MAX_ROWS_TO_SAMPLE", "50"))
LLM_TIMEOUT_SECONDS = float(os.getenv("LLM_TIMEOUT_SECONDS", "120.0"))
RETRY_ATTEMPTS = int(os.getenv("LLM_RETRY_ATTEMPTS", "3"))

# -----------------------------------------------------------------------------
# Pydantic models
# -----------------------------------------------------------------------------
class ProviderConfidence(BaseModel):
    provider_id: float = Field(default=0.0, ge=0.0, le=1.0)
    name: float = Field(default=0.0, ge=0.0, le=1.0)
    specialty: float = Field(default=0.0, ge=0.0, le=1.0)
    phone: float = Field(default=0.0, ge=0.0, le=1.0)
    email: float = Field(default=0.0, ge=0.0, le=1.0)
    address: float = Field(default=0.0, ge=0.0, le=1.0)
    npi_number: float = Field(default=0.0, ge=0.0, le=1.0)
    license_number: float = Field(default=0.0, ge=0.0, le=1.0)

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
    title="Valid8 Ingestion",
    description="AI-powered healthcare provider data cleaning using agnostic LLM",
    version="1.2.0",
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
    # Simplify the prompt structure to reduce hallucinations
    prompt = f"""You are a strict data extraction system. Convert the following CSV data into a clean JSON object.

INPUT DATA:
{csv_sample}

INSTRUCTIONS:
1. Extract every row from the CSV into a provider record.
2. Standardize fields:
   - Names: Title Case (e.g., "John Smith")
   - Email: Lowercase
   - Phone: Standard format
3. Extract hidden values like NPI or License from text fields.
4. Calculate a confidence score (0.0-1.0) for each field.
5. Identify any "ai_notes" for corrections made.

REQUIRED OUTPUT JSON STRUCTURE:
{{
  "providers": [
    {{
      "provider_id": "temp-1",
      "name": "Extracted Name",
      "specialty": "Specialty",
      "phone": "555-123-4567",
      "email": "email@example.com",
      "address": "123 St, City",
      "npi_number": "1234567890",
      "license_number": "AB12345",
      "confidence": {{
         "name": 1.0,
         "npi_number": 0.95,
         ...
      }},
      "ai_notes": ["Fixed typo in specialty"]
    }}
  ]
}}

IMPORTANT:
- Return ONLY the valid JSON object.
- The root key MUST be "providers".
- Do not include markdown formatting like ```json.
"""
    return prompt


def robust_extract_json(content: str) -> Dict[str, Any]:
    try:
        return json.loads(content)
    except Exception:
        pass

    content_clean = content.replace("```json", "").replace("```", "")
    
    # Simple regex fallback
    regex_match = re.search(r'\{(?:[^{}]|\n|\r)*\}', content_clean)
    if regex_match:
        candidate = regex_match.group(0)
        # basic cleanup for common trailing comma issues
        candidate = re.sub(r",\s*}", "}", candidate)
        candidate = re.sub(r",\s*\]", "]", candidate)
        try:
            return json.loads(candidate)
        except Exception:
            pass

    # If simple regex fails, try the iterative approach or just error out
    raise HTTPException(status_code=500, detail="LLM did not return valid JSON. Response truncated: " + content[:200])


async def call_llm_with_retries(prompt: str) -> Dict[str, Any]:
    """
    Calls the configured LLM provider using the llm_client.
    Manages retries and event loop blocking.
    """
    
    async def _call_once():
        def blocking_call():
            return generate(prompt)
        
        # Run blocking wrapper in thread
        return await asyncio.to_thread(blocking_call)

    backoff = 1.0
    for attempt in range(RETRY_ATTEMPTS):
        try:
            raw_text = await asyncio.wait_for(_call_once(), timeout=LLM_TIMEOUT_SECONDS)
            if not raw_text:
                raise ValueError("Empty response from LLM")
                
            parsed = robust_extract_json(raw_text)
            return parsed
        except HTTPException:
            raise
        except Exception as e:
            if attempt < RETRY_ATTEMPTS - 1:
                await asyncio.sleep(backoff)
                backoff *= 2
                continue
            raise HTTPException(status_code=500, detail=f"LLM Provider error: {str(e)}")

    raise HTTPException(status_code=500, detail="LLM error unknown")


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
        "version": "1.2.0",
        "llm_provider": os.getenv("LLM_PROVIDER", "gemini")
    }


@app.post("/ingest/csv", response_model=IngestionResponse)
async def ingest_csv(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    try:
        content = await file.read()
        csv_string = content.decode("utf-8")
        df = pd.read_csv(StringIO(csv_string))
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="CSV encoding error; ensure UTF-8.")
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV parsing error: {e}")

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file contains no rows.")

    prompt = prepare_prompt_from_csv(df)
    llm_response = await call_llm_with_retries(prompt)

    # Handle case where LLM returns just a list
    if isinstance(llm_response, list):
        llm_response = {"providers": llm_response}

    # Handle case where LLM used a different key (e.g., "data", "results")
    if "providers" not in llm_response:
        # Search for any list value in the dictionary
        for key, value in llm_response.items():
            if isinstance(value, list):
                llm_response["providers"] = value
                break

    if "providers" not in llm_response or not isinstance(llm_response["providers"], list):
        raise HTTPException(status_code=500, detail=f"LLM output missing 'providers' list. Got: {str(llm_response)[:200]}")

    providers = post_process_providers(llm_response["providers"])

    return IngestionResponse(
        status="success",
        total_providers=len(providers),
        providers=providers,
        processing_notes=[
            f"Processed {len(df)} rows from CSV",
            f"Extracted {len(providers)} provider records",
            f"Using LLM Provider: {os.getenv('LLM_PROVIDER', 'gemini')}"
        ],
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)

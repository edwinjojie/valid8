"""
AI-Powered Ingestion Microservice for Valid8
Cleans, normalizes, and structures messy healthcare provider data using LLMs.
"""

import os
import json
import re
import secrets
from typing import List, Dict, Any, Optional
from io import StringIO

import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx

# ============================================================================
# CONFIGURATION
# ============================================================================

# Standard provider fields expected in output
STANDARD_FIELDS = [
    "provider_id",
    "name",
    "specialty",
    "phone",
    "email",
    "address",
    "npi_number",
    "license_number"
]

# LLM Configuration - supports multiple providers
LLM_API_KEY = os.getenv("LLM_API_KEY") or os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq").lower()  # groq, openai, anthropic

# Provider-specific endpoints and models
LLM_CONFIGS = {
    "groq": {
        "endpoint": "https://api.groq.com/openai/v1/chat/completions",
        "model": "llama-3.1-70b-versatile",
        "api_key_header": "Authorization"
    },
    "openai": {
        "endpoint": "https://api.openai.com/v1/chat/completions",
        "model": "gpt-4o-mini",
        "api_key_header": "Authorization"
    },
    "anthropic": {
        "endpoint": "https://api.anthropic.com/v1/messages",
        "model": "claude-3-5-sonnet-20241022",
        "api_key_header": "x-api-key"
    }
}

MAX_ROWS_TO_SAMPLE = 50  # Send first N rows to LLM for processing

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ProviderConfidence(BaseModel):
    """Per-field confidence scores from AI"""
    provider_id: float = Field(ge=0.0, le=1.0)
    name: float = Field(ge=0.0, le=1.0)
    specialty: float = Field(ge=0.0, le=1.0)
    phone: float = Field(ge=0.0, le=1.0)
    email: float = Field(ge=0.0, le=1.0)
    address: float = Field(ge=0.0, le=1.0)
    npi_number: float = Field(ge=0.0, le=1.0)
    license_number: float = Field(ge=0.0, le=1.0)


class CleanedProvider(BaseModel):
    """Single cleaned provider record"""
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


class IngestionResponse(BaseModel):
    """Response from CSV ingestion"""
    status: str
    total_providers: int
    providers: List[CleanedProvider]
    processing_notes: List[str] = []


# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(
    title="Valid8 Ingestion Microservice",
    description="AI-powered healthcare provider data cleaning and normalization",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def generate_temp_id() -> str:
    """Generate temporary provider ID if missing"""
    return f"TEMP-{secrets.token_hex(3)}"


def prepare_prompt_from_csv(df: pd.DataFrame) -> str:
    """
    Build a comprehensive prompt for the LLM to clean and structure provider data.
    
    Args:
        df: Pandas DataFrame containing raw CSV data
        
    Returns:
        Formatted prompt string for LLM
    """
    # Convert DataFrame to a readable format for the LLM
    csv_sample = df.head(MAX_ROWS_TO_SAMPLE).to_csv(index=False)
    
    prompt = f"""You are a healthcare data cleaning AI. Your task is to clean, normalize, and structure messy provider data.

INPUT DATA (CSV):
{csv_sample}

INSTRUCTIONS:
1. Parse the CSV and extract provider information
2. Map data to these standard fields: provider_id, name, specialty, phone, email, address, npi_number, license_number
3. Clean and normalize:
   - Names: Title Case (e.g., "john doe" → "John Doe")
   - Emails: lowercase
   - Phones: digits only with optional + prefix (e.g., "(555) 123-4567" → "+15551234567")
   - Addresses: single normalized string
   - Specialties: Fix typos (e.g., "cardiolgy" → "cardiology")
4. Extract data from free text (e.g., "John MD – NPI 7782 – CA license 1234")
5. Infer missing headers or handle combined fields
6. For each field, provide a confidence score (0.0-1.0)
7. Document all changes in ai_notes array
8. If provider_id is missing, leave it null (will auto-generate)
9. Use null for missing values, not empty strings

OUTPUT FORMAT:
Return a valid JSON object with this exact structure:
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
        "provider_id": 0.95,
        "name": 0.98,
        "specialty": 0.85,
        "phone": 0.90,
        "email": 0.92,
        "address": 0.88,
        "npi_number": 0.99,
        "license_number": 0.87
      }},
      "ai_notes": [
        "Corrected spelling of specialty from 'cardiolgy' to 'cardiology'",
        "Extracted NPI from combined text field"
      ],
      "source_row": 0
    }}
  ]
}}

CRITICAL: Return ONLY valid JSON. No markdown, no explanations, no code blocks - just the raw JSON object.
"""
    return prompt


async def call_llm_for_cleaning(prompt: str) -> Dict[str, Any]:
    """
    Call the configured LLM provider to clean and structure data.
    
    Args:
        prompt: Formatted prompt with CSV data and instructions
        
    Returns:
        Parsed JSON response from LLM
        
    Raises:
        HTTPException: If LLM call fails or returns invalid data
    """
    if not LLM_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="LLM API key not configured. Set LLM_API_KEY environment variable."
        )
    
    config = LLM_CONFIGS.get(LLM_PROVIDER)
    if not config:
        raise HTTPException(
            status_code=500,
            detail=f"Unsupported LLM provider: {LLM_PROVIDER}"
        )
    
    # Prepare request based on provider
    headers = {
        "Content-Type": "application/json",
    }
    
    # Set API key in appropriate header
    if config["api_key_header"] == "Authorization":
        headers["Authorization"] = f"Bearer {LLM_API_KEY}"
    else:
        headers[config["api_key_header"]] = LLM_API_KEY
    
    # Build request payload based on provider
    if LLM_PROVIDER == "anthropic":
        payload = {
            "model": config["model"],
            "max_tokens": 4096,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
    else:  # OpenAI-compatible (Groq, OpenAI)
        payload = {
            "model": config["model"],
            "messages": [
                {
                    "role": "system",
                    "content": "You are a healthcare data cleaning AI. Always return valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.1,
            "max_tokens": 4096
        }
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                config["endpoint"],
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            
            # Extract content based on provider response format
            if LLM_PROVIDER == "anthropic":
                content = result["content"][0]["text"]
            else:  # OpenAI-compatible
                content = result["choices"][0]["message"]["content"]
            
            # Parse JSON from response
            return extract_json_from_response(content)
            
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"LLM API error: {e.response.text}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calling LLM: {str(e)}"
        )


def extract_json_from_response(content: str) -> Dict[str, Any]:
    """
    Extract and parse JSON from LLM response with fallback logic.
    
    Args:
        content: Raw text response from LLM
        
    Returns:
        Parsed JSON object
        
    Raises:
        HTTPException: If JSON cannot be extracted or parsed
    """
    # Try direct parsing first
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass
    
    # Try to extract JSON from markdown code blocks
    json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', content, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass
    
    # Try to find JSON object in text
    json_match = re.search(r'\{.*\}', content, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            pass
    
    raise HTTPException(
        status_code=500,
        detail="LLM did not return valid JSON. Response: " + content[:200]
    )


def post_process_providers(providers: List[Dict[str, Any]]) -> List[CleanedProvider]:
    """
    Post-process LLM output to ensure quality and consistency.
    
    Args:
        providers: Raw provider data from LLM
        
    Returns:
        List of validated CleanedProvider objects
    """
    processed = []
    
    for provider_data in providers:
        # Auto-generate provider_id if missing
        if not provider_data.get("provider_id"):
            provider_data["provider_id"] = generate_temp_id()
        
        # Ensure confidence scores exist with defaults
        if "confidence" not in provider_data:
            provider_data["confidence"] = {field: 0.5 for field in STANDARD_FIELDS}
        
        # Ensure all standard fields exist (set to None if missing)
        for field in STANDARD_FIELDS:
            if field not in provider_data:
                provider_data[field] = None
            # Convert empty strings to None
            if provider_data[field] == "":
                provider_data[field] = None
        
        # Ensure ai_notes exists
        if "ai_notes" not in provider_data:
            provider_data["ai_notes"] = []
        
        # Ensure source_row exists
        if "source_row" not in provider_data:
            provider_data["source_row"] = 0
        
        try:
            processed.append(CleanedProvider(**provider_data))
        except Exception as e:
            # Log validation error but continue processing
            print(f"Warning: Failed to validate provider: {e}")
            continue
    
    return processed


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "valid8-ingestion",
        "version": "1.0.0",
        "llm_provider": LLM_PROVIDER,
        "llm_configured": bool(LLM_API_KEY)
    }


@app.post("/ingest/csv", response_model=IngestionResponse)
async def ingest_csv(file: UploadFile = File(...)):
    """
    Ingest and clean provider data from CSV file.
    
    Args:
        file: Uploaded CSV file
        
    Returns:
        IngestionResponse with cleaned provider data
    """
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported"
        )
    
    try:
        # Read CSV file
        content = await file.read()
        csv_string = content.decode('utf-8')
        df = pd.read_csv(StringIO(csv_string))
        
        if df.empty:
            raise HTTPException(
                status_code=400,
                detail="CSV file is empty"
            )
        
        # Prepare prompt and call LLM
        prompt = prepare_prompt_from_csv(df)
        llm_response = await call_llm_for_cleaning(prompt)
        
        # Extract providers from response
        if "providers" not in llm_response:
            raise HTTPException(
                status_code=500,
                detail="LLM response missing 'providers' field"
            )
        
        # Post-process and validate
        providers = post_process_providers(llm_response["providers"])
        
        return IngestionResponse(
            status="success",
            total_providers=len(providers),
            providers=providers,
            processing_notes=[
                f"Processed {len(df)} rows from CSV",
                f"Extracted {len(providers)} valid provider records",
                f"Used LLM provider: {LLM_PROVIDER}"
            ]
        )
        
    except pd.errors.EmptyDataError:
        raise HTTPException(
            status_code=400,
            detail="CSV file is empty or invalid"
        )
    except pd.errors.ParserError as e:
        raise HTTPException(
            status_code=400,
            detail=f"CSV parsing error: {str(e)}"
        )
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="CSV file encoding error. Please ensure UTF-8 encoding."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ingestion error: {str(e)}"
        )


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

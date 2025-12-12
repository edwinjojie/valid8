from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import uvicorn
import os

# -----------------------------------------------------------------------------
# Config / Constants
# -----------------------------------------------------------------------------
INGESTION_URL = os.getenv("INGESTION_URL", "http://localhost:8001/ingest/csv")
VALIDATION_URL = os.getenv("VALIDATION_URL", "http://localhost:8002/validate")

# -----------------------------------------------------------------------------
# FastAPI App
# -----------------------------------------------------------------------------
app = FastAPI(
    title="Valid8 Orchestrator",
    description="Orchestrates the flow: CSV Upload -> Ingestion (Cleaning) -> Validation (NPI Check) -> Response",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------
@app.get("/health")
def health_check():
    """Basic health check."""
    return {"status": "ok"}


@app.post("/process-file")
async def process_file(file: UploadFile = File(...)):
    """
    Direct synchronous flow:
    1. Send CSV to Ingestion Service (8001)
    2. Extract 'providers' from response
    3. Send providers to Validation Service (8002)
    4. Return combined results
    """
    
    # ---------------------------------------------------------
    # Step A: Forward file to Ingestion Service
    # ---------------------------------------------------------
    try:
        # We must reset file pointer effectively or read content to send it
        file_content = await file.read()
        
        # Prepare multipart upload
        # 'file' key matches Ingestion service expectation: file: UploadFile
        files_payload = {
            "file": (file.filename, file_content, file.content_type)
        }
        
        ingest_resp = requests.post(
            INGESTION_URL,
            files=files_payload,
            timeout=120
        )
        
        if ingest_resp.status_code != 200:
            raise HTTPException(
                status_code=ingest_resp.status_code, 
                detail=f"Ingestion service failed: {ingest_resp.text}"
            )
            
        cleaned_data = ingest_resp.json()
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Failed to connect to ingestion service: {str(e)}")
    except Exception as e:
        # Catch JSON errors or other unexpecteds
        raise HTTPException(status_code=500, detail=f"Error processing ingestion response: {str(e)}")


    # ---------------------------------------------------------
    # Step B: Extract cleaned providers
    # ---------------------------------------------------------
    providers = cleaned_data.get("providers", [])
    
    if not providers:
        # If no providers found, we can return early or attempt validation on empty list 
        # (usually early return is safer/faster)
        return {
            "status": "success",
            "cleaned_count": 0,
            "validated_count": 0,
            "results": []
        }


    # ---------------------------------------------------------
    # Step C: Forward to Validation Service
    # ---------------------------------------------------------
    # Validation expects a LIST of provider objects
    try:
        # Ingestion response: { "providers": [ ... ] }
        # Validation request body: [ ... ]  <-- Wait, checking schema
        # In `validation/main_v.py`: async def validate_providers(providers: List[dict]):
        # So it expects a raw LIST in the body, not a JSON object with key "providers"
        
        validate_resp = requests.post(
            VALIDATION_URL,
            json=providers,  # Passing the list directly
            timeout=120      # Increased timeout for NPI lookups + LLM
        )
        
        if validate_resp.status_code != 200:
            raise HTTPException(
                status_code=validate_resp.status_code, 
                detail=f"Validation service failed: {validate_resp.text}"
            )
            
        validated_data = validate_resp.json()
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Failed to connect to validation service: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing validation response: {str(e)}")


    # ---------------------------------------------------------
    # Step D: Return final result
    # ---------------------------------------------------------
    # Validation response: { "status": "success", "validated": [ ...results... ] }
    validated_results = validated_data.get("validated", [])
    
    return {
        "status": "success",
        "cleaned_count": len(providers),
        "validated_count": len(validated_results),
        "results": validated_results
    }


# -----------------------------------------------------------------------------
# Run Entrypoint
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

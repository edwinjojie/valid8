from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import uvicorn
import os
import secrets
import typing

# -----------------------------------------------------------------------------
# Config / Constants
# -----------------------------------------------------------------------------
INGESTION_URL = os.getenv("INGESTION_URL", "http://localhost:8001/ingest/csv")
VALIDATION_URL = os.getenv("VALIDATION_URL", "http://localhost:8002/validate")

# Simple in-memory job store
# Structure: { job_id: { "status": str, "stage": str, "progress": int, "result": dict | None, "error": str | None } }
JOBS = {}

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
# Models
# -----------------------------------------------------------------------------
class JobResponse(BaseModel):
    job_id: str
    status: str
    message: str

class JobStatus(BaseModel):
    job_id: str
    status: str      # "processing", "completed", "failed"
    stage: str       # "ingestion", "validation", "finalizing"
    progress: int    # 0-100
    error: typing.Optional[str] = None
    result: typing.Optional[dict] = None


# -----------------------------------------------------------------------------
# Background Task Logic
# -----------------------------------------------------------------------------
def process_pipeline_task(job_id: str, file_name: str, file_content: bytes, content_type: str):
    try:
        # --- Update: Starting Ingestion ---
        JOBS[job_id].update({"status": "processing", "stage": "ingestion", "progress": 10})
        
        # 1. Ingestion
        try:
            files_payload = {
                "file": (file_name, file_content, content_type)
            }
            ingest_resp = requests.post(
                INGESTION_URL,
                files=files_payload,
                timeout=120
            )
            if ingest_resp.status_code != 200:
                raise Exception(f"Ingestion failed: {ingest_resp.text}")
            
            cleaned_data = ingest_resp.json()
            
        except Exception as e:
            JOBS[job_id].update({"status": "failed", "error": str(e), "progress": 0})
            return

        # --- Update: Cleaning Done, Starting Validation ---
        JOBS[job_id].update({"status": "processing", "stage": "validation", "progress": 50})

        # 2. Extract providers
        providers = cleaned_data.get("providers", [])
        
        if not providers:
            result = {
                "status": "success",
                "cleaned_count": 0,
                "validated_count": 0,
                "cleaned_providers": [],
                "validated_providers": [],
                "results": []
            }
            JOBS[job_id].update({"status": "completed", "stage": "finished", "progress": 100, "result": result})
            return

        # 3. Validation
        try:
            validate_resp = requests.post(
                VALIDATION_URL,
                json=providers,
                timeout=120
            )
            if validate_resp.status_code != 200:
                raise Exception(f"Validation failed: {validate_resp.text}")
            
            validated_data = validate_resp.json()
            
        except Exception as e:
            JOBS[job_id].update({"status": "failed", "error": str(e), "progress": 0})
            return

        # --- Update: Finalizing ---
        JOBS[job_id].update({"status": "processing", "stage": "finalizing", "progress": 90})

        validated_results = validated_data.get("validated", [])
        
        final_result = {
            "status": "success",
            "cleaned_count": len(providers),
            "validated_count": len(validated_results),
            "cleaned_providers": providers,
            "validated_providers": validated_results,
            "results": validated_results
        }

        # --- Done ---
        JOBS[job_id].update({"status": "completed", "stage": "finished", "progress": 100, "result": final_result})

    except Exception as e:
        # Catch-all
        JOBS[job_id].update({"status": "failed", "error": str(e), "progress": 0})


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------
@app.get("/health")
def health_check():
    """Basic health check."""
    return {"status": "ok"}


@app.post("/start-job", response_model=JobResponse)
async def start_job(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Async flow:
    1. Receives file.
    2. Spawns background task.
    3. Returns job_id immediately.
    """
    job_id = secrets.token_hex(4)
    file_content = await file.read()
    
    # Initialize job state
    JOBS[job_id] = {
        "status": "pending",
        "stage": "upload",
        "progress": 0,
        "result": None,
        "error": None
    }
    
    # Start task
    background_tasks.add_task(
        process_pipeline_task, 
        job_id, 
        file.filename, 
        file_content, 
        file.content_type
    )
    
    return JobResponse(job_id=job_id, status="started", message="Pipeline started in background.")


@app.get("/status/{job_id}", response_model=JobStatus)
def get_job_status(job_id: str):
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = JOBS[job_id]
    return JobStatus(
        job_id=job_id,
        status=job["status"],
        stage=job["stage"],
        progress=job["progress"],
        error=job.get("error"),
        result=job.get("result")
    )


<<<<<<< Updated upstream
<<<<<<< Updated upstream
# Keep the old sync endpoint for backward compat if needed, or remove it.
# We will simplify and remove it to force usage of the new async flow.
# But for safety, I'll alias it or just leave it out to keep code clean.

=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

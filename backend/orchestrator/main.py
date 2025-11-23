from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uuid
import time

app = FastAPI()

# Temporary in-memory store (later replaced with DB)
BATCH_STATUS = {}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/start-validation")
async def start_validation(file: UploadFile = File(...)):
    # Generate a fake batch ID
    batch_id = str(uuid.uuid4())

    # Store initial fake progress
    BATCH_STATUS[batch_id] = {
        "step": "received",
        "progress": 5,
        "created_at": time.time(),
    }

    # Return batchId to frontend
    return {"batchId": batch_id}

@app.get("/status/{batch_id}")
async def get_status(batch_id: str):
    if batch_id not in BATCH_STATUS:
        return {"error": "Invalid batchId"}

    # Simulate progress over time
    created_at = BATCH_STATUS[batch_id]["created_at"]
    elapsed = time.time() - created_at

    if elapsed < 3:
        step = "ingestion"
        progress = 20
    elif elapsed < 6:
        step = "ocr"
        progress = 40
    elif elapsed < 9:
        step = "validation"
        progress = 60
    elif elapsed < 12:
        step = "enrichment"
        progress = 80
    else:
        step = "completed"
        progress = 100

    BATCH_STATUS[batch_id]["step"] = step
    BATCH_STATUS[batch_id]["progress"] = progress

    return BATCH_STATUS[batch_id]

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from io import StringIO

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/ingest")
async def ingest_file(file: UploadFile = File(...)):
    filename = file.filename.lower()

    # Validate file type
    if not filename.endswith(".csv"):
        return {"error": "Only CSV supported in this version"}

    # Read CSV
    content = await file.read()
    csv_data = content.decode("utf-8")

    df = pd.read_csv(StringIO(csv_data))

    # Normalize columns (basic)
    df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]

    # Convert to list of provider dicts
    providers = df.to_dict(orient="records")

    return {
        "count": len(providers),
        "providers": providers
    }

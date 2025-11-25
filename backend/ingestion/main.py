# # backend/ingestion/main.py
# import os
# import json
# import pandas as pd
# from io import StringIO
# from fastapi import FastAPI, UploadFile, File, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import List, Dict, Any, Optional
# import time
# from groq import Groq

# # OpenAI import: use the official python package. We'll use the chat completion interface.
# import openai

# # ========== Configuration ==========
# GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# if not GROQ_API_KEY:
#     raise RuntimeError("GROQ_API_KEY environment variable is not set. Set it in Render / .env")

# # Initialize OpenAI Client (v1.x)
# client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# # Model choice - pick one you have access to (change if necessary)
# LLM_MODEL = "llama3-70b-8192"  # change to the model you want / have access to

# # Target standardized schema for Valid8 Care
# STANDARD_FIELDS = [
#     "provider_id",
#     "name",
#     "specialty",
#     "phone",
#     "email",
#     "address",
#     "npi_number",
#     "license_number"
# ]

# # System prompt instructing the LLM how to clean and structure data
# SYSTEM_PROMPT = f"""
# You are a high-precision data cleaning and structuring agent.

# Goal:
# Given a messy CSV (may have incorrect column names, missing headers, messy rows, or free-text),
# produce a CLEAN JSON array of provider records that match EXACTLY the following schema:

# {json.dumps(STANDARD_FIELDS, indent=2)}

# For each returned provider object:
# - Provide each field (use null if unknown).
# - Provide a "confidence" object with per-field scores 0.0-1.0.
# - Provide an "ai_notes" list explaining any corrections, guesses, or ambiguity.
# - Provider_id: if no ID present, generate a temporary deterministic id (e.g. TEMP-<6hex>).

# Rules:
# 1. Only return valid JSON (no commentary) and nothing else.
# 2. Normalize names (Title Case), emails -> lower, phone -> digits with optional leading +.
# 3. Try to infer fields from free text (e.g., "Dr John - Cardiolgy - NPI: 1234 - 555-12" -> structured).
# 4. If input is large, process in batches and return combined JSON.
# 5. Add "source_row" index for traceability back to the original CSV row (0-based).
# """

# # FastAPI setup
# app = FastAPI(title="Valid8 Ingestion (AI)")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ----------------------
# # Helper: call LLM
# # ----------------------
# def call_llm_for_cleaning(prompt_text: str, timeout_s: int = 60) -> str:
#     """
#     Call the LLM with system prompt + user text.
#     Returns the raw text response (expected to be JSON).
#     """
#     # You can add streaming / retry logic here. Keep simple for now.
#     response = client.chat.completions.create(
#         model=LLM_MODEL,
#         messages=[
#             {"role": "system", "content": SYSTEM_PROMPT},
#             {"role": "user", "content": prompt_text}
#         ],
#         temperature=0.0,
#         max_tokens=2000,
#         timeout=timeout_s
#     )
#     return response.choices[0].message.content


# # ----------------------
# # Helper: prepare a representative prompt from CSV content
# # ----------------------
# def prepare_prompt_from_csv(csv_text: str, max_rows: int = 80) -> str:
#     """
#     Builds a prompt body for the LLM. We give it:
#      - a small sample of the CSV (up to max_rows)
#      - short instructions (we already have system prompt)
#     """
#     # Show the CSV header (if present) and sample rows
#     lines = csv_text.strip().splitlines()
#     sample = "\n".join(lines[:max_rows + 1])  # include header + rows
#     prompt = (
#         "The following is the CSV data (possibly messy). Clean and convert it to the target JSON schema.\n\n"
#         "CSV_DATA:\n"
#         "```csv\n"
#         f"{sample}\n"
#         "```\n\n"
#         "Return the JSON array as described in the system instructions."
#     )
#     return prompt


# # ----------------------
# # Endpoint: basic health
# # ----------------------
# @app.get("/health")
# def health():
#     return {"status": "ok", "time": time.time()}


# # ----------------------
# # Endpoint: /ingest/csv - AI cleaning
# # ----------------------
# @app.post("/ingest/csv")
# async def ingest_csv(file: UploadFile = File(...)):
#     """
#     Accepts a CSV file (raw, messy). Sends a representative chunk to the LLM which returns
#     a clean JSON array that maps to the STANDARD_FIELDS. Returns parsed JSON to the caller.
#     """
#     fname = file.filename.lower()
#     if not fname.endswith(".csv"):
#         raise HTTPException(status_code=400, detail="Only CSV supported in this endpoint")

#     raw_bytes = await file.read()
#     try:
#         raw_text = raw_bytes.decode("utf-8")
#     except UnicodeDecodeError:
#         # fallback to latin-1
#         raw_text = raw_bytes.decode("latin-1")

#     # quick sanity: if the CSV is huge, we won't send everything; we send a sample and also
#     # include a note to LLM that it can expect a multi-pass workflow
#     prompt_body = prepare_prompt_from_csv(raw_text, max_rows=120)

#     # CALL LLM
#     try:
#         llm_output = call_llm_for_cleaning(prompt_body)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"LLM call failed: {str(e)}")

#     # The LLM should return JSON; parse it safely
#     try:
#         cleaned = json.loads(llm_output)
#     except Exception as e:
#         # If the LLM returned non-json (rare), try to extract JSON substring
#         # naive fallback: find first '[' and last ']' and attempt parse
#         try:
#             start = llm_output.find("[")
#             end = llm_output.rfind("]") + 1
#             cleaned = json.loads(llm_output[start:end])
#         except Exception as e2:
#             raise HTTPException(status_code=502, detail=f"LLM returned non-JSON: {e2} | raw: {llm_output[:1000]}")

#     # Basic post-processing & validation:
#     # - Ensure each record has standard fields (add missing keys with null)
#     processed = []
#     for rec in cleaned:
#         out = {k: rec.get(k, None) for k in STANDARD_FIELDS}
#         out["confidence"] = rec.get("confidence", {k: 0.0 for k in STANDARD_FIELDS})
#         out["ai_notes"] = rec.get("ai_notes", [])
#         out["source_row"] = rec.get("source_row", None)
#         processed.append(out)

#     return {"status": "ok", "count": len(processed), "providers": processed}
# backend/ingestion/main.py
import os
import json
import pandas as pd
from io import StringIO
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import time
from groq import Groq

# ============================
# CONFIGURATION
# ============================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("Missing GROQ_API_KEY. Set it in Render > Environment.")

client = Groq(api_key=GROQ_API_KEY)
LLM_MODEL = "llama3-70b-8192"

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

SYSTEM_PROMPT = f"""
You are an expert provider-data cleaning and transformation agent.

You ALWAYS output valid JSON (never explanations, never markdown).

Target fields:
{json.dumps(STANDARD_FIELDS, indent=2)}

For each provider:
- Include a "confidence" dict mapping each field → 0.0–1.0.
- Include an "ai_notes" list describing corrections or assumptions.
- Include "source_row" (0-based index from the CSV).
- Missing or uncertain values must be null.
- Normalize names (Title Case), emails (lowercase), and phone numbers (digits + optional +).

Return ONLY JSON. No comments. No markdown.
"""


# ============================
# LLM CALL
# ============================
def call_llm_for_cleaning(prompt_text: str):
    try:
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt_text}
            ],
            temperature=0.0,
            max_tokens=3000,
        )
        return response.choices[0].message.content
    except Exception as e:
        raise RuntimeError(f"LLM call failed: {e}")


# ============================
# PROMPT BUILDER
# ============================
def prepare_prompt_from_csv(csv_text: str, max_rows: int = 80):
    lines = csv_text.strip().splitlines()
    sample = "\n".join(lines[: max_rows + 1])

    return f"""
Clean and transform the following CSV rows into the target JSON schema.

CSV_DATA:
```csv
{sample}
```
"""

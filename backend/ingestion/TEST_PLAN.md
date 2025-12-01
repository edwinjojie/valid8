# 5-Step Test Plan for Ingestion Microservice

## Step 1: Health Check Verification

**Objective**: Verify service is running and properly configured

**Actions**:
```bash
curl http://localhost:8001/health
```

**Expected Result**:
```json
{
  "status": "healthy",
  "service": "valid8-ingestion",
  "version": "1.0.0",
  "llm_provider": "groq",
  "llm_configured": true
}
```

**Success Criteria**: 
- Status code 200
- `llm_configured` is `true`
- Correct LLM provider shown

---

## Step 2: Clean CSV Ingestion

**Objective**: Test with well-formatted CSV data

**Actions**:
1. Create `test_clean.csv`:
```csv
provider_id,name,specialty,phone,email,npi_number
P001,John Smith,Cardiology,(555) 123-4567,john@example.com,1234567890
P002,Jane Doe,Pediatrics,555-987-6543,jane@example.com,9876543210
```

2. Upload via API:
```bash
curl -X POST http://localhost:8001/ingest/csv \
  -F "file=@test_clean.csv"
```

**Expected Result**:
- Status: "success"
- 2 providers returned
- All fields properly normalized (email lowercase, phone cleaned)
- Confidence scores > 0.9 for most fields

**Success Criteria**:
- Valid JSON response
- Correct number of providers
- Data normalized correctly

---

## Step 3: Messy CSV Ingestion (AI Cleaning)

**Objective**: Test AI's ability to clean and normalize messy data

**Actions**:
1. Use `sample_messy_providers.csv` (provided separately)
2. Upload via API:
```bash
curl -X POST http://localhost:8001/ingest/csv \
  -F "file=@sample_messy_providers.csv"
```

**Expected Result**:
- All providers extracted despite messy format
- Typos corrected (e.g., "cardiolgy" → "cardiology")
- Data extracted from free text fields
- AI notes document all changes made
- Confidence scores vary based on data quality
- Missing provider_ids auto-generated (TEMP-xxx format)

**Success Criteria**:
- All rows processed
- Specialties corrected
- Free text parsed correctly
- ai_notes field populated with explanations

---

## Step 4: Edge Cases & Error Handling

**Objective**: Verify robustness with invalid inputs

**Test Cases**:

### 4.1: Empty CSV
```bash
echo "" > empty.csv
curl -X POST http://localhost:8001/ingest/csv -F "file=@empty.csv"
```
**Expected**: 400 error, message about empty file

### 4.2: Invalid File Type
```bash
curl -X POST http://localhost:8001/ingest/csv -F "file=@test.txt"
```
**Expected**: 400 error, message about CSV requirement

### 4.3: Malformed CSV
Create `malformed.csv`:
```csv
name,email
"John,Smith",john@test.com
Bad"Quotes,test
```
```bash
curl -X POST http://localhost:8001/ingest/csv -F "file=@malformed.csv"
```
**Expected**: Either parses successfully or returns 400 with clear error

### 4.4: Missing Headers CSV
```csv
John Smith,Cardiology,555-1234
Jane Doe,Pediatrics,555-5678
```
**Expected**: AI infers structure and processes successfully

**Success Criteria**:
- Appropriate error codes (400/500)
- Clear error messages
- No service crashes

---

## Step 5: Load & Performance Testing

**Objective**: Verify performance with realistic data volume

**Actions**:
1. Create CSV with 50 rows (maximum processed at once)
2. Measure response time
3. Verify all data processed correctly

**Script**:
```bash
# Create large CSV
python -c "
import csv
with open('large_test.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['name', 'specialty', 'phone', 'email'])
    for i in range(50):
        writer.writerow([f'Provider {i}', 'Cardiology', f'555-{i:04d}', f'p{i}@test.com'])
"

# Time the request
time curl -X POST http://localhost:8001/ingest/csv \
  -F "file=@large_test.csv" \
  -o response.json

# Check response
cat response.json | python -m json.tool
```

**Expected Result**:
- Response time < 60 seconds
- All 50 providers processed
- Valid JSON response
- No memory errors

**Success Criteria**:
- Completes successfully
- Reasonable response time
- All data present
- Service remains responsive after

---

## Validation Checklist

After completing all tests, verify:

- ✅ Service starts without errors
- ✅ Health endpoint returns correct status
- ✅ Clean CSV data processed correctly
- ✅ Messy data cleaned by AI
- ✅ Typos corrected automatically
- ✅ Free text parsed successfully
- ✅ Confidence scores calculated
- ✅ AI notes explain changes
- ✅ Auto-generated IDs for missing provider_id
- ✅ Error handling works correctly
- ✅ Invalid inputs rejected gracefully
- ✅ Large files processed within timeout
- ✅ All responses are valid JSON
- ✅ Service logs errors appropriately

## Automated Test Script

```bash
#!/bin/bash
# run_all_tests.sh

echo "Test 1: Health Check"
curl -s http://localhost:8001/health | python -m json.tool

echo -e "\n\nTest 2: Clean CSV"
curl -s -X POST http://localhost:8001/ingest/csv \
  -F "file=@test_clean.csv" | python -m json.tool

echo -e "\n\nTest 3: Messy CSV"
curl -s -X POST http://localhost:8001/ingest/csv \
  -F "file=@sample_messy_providers.csv" | python -m json.tool

echo -e "\n\nTest 4: Error Cases"
echo "" > empty.csv
curl -s -X POST http://localhost:8001/ingest/csv -F "file=@empty.csv"

echo -e "\n\nAll tests completed!"
```

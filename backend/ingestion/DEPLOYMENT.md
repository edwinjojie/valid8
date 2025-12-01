# Deployment Instructions for Render

## Prerequisites
- Python 3.11+
- Render account ([render.com](https://render.com))
- API key for your chosen LLM provider (Groq, OpenAI, or Anthropic)

## Local Development

### 1. Install Dependencies
```bash
cd backend/ingestion
pip install -r requirements.txt
```

### 2. Set Environment Variables
Create a `.env` file:
```bash
# Choose one LLM provider
LLM_PROVIDER=groq  # or openai, anthropic

# Set the corresponding API key
GROQ_API_KEY=your_groq_api_key_here
# or
OPENAI_API_KEY=your_openai_api_key_here
# or
LLM_API_KEY=your_api_key_here  # generic fallback
```

### 3. Run Locally
```bash
python main.py
```

Service will be available at `http://localhost:8001`

### 4. Test Health Endpoint
```bash
curl http://localhost:8001/health
```

## Deployment on Render

### Method 1: Web Service (Recommended)

1. **Create New Web Service**
   - Log in to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - Name: `valid8-ingestion`
   - Environment: `Python 3`
   - Region: Choose closest to your users
   - Branch: `main` (or your default branch)
   - Root Directory: `backend/ingestion`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Set Environment Variables**
   Go to "Environment" tab and add:
   ```
   LLM_PROVIDER=groq
   GROQ_API_KEY=your_actual_api_key
   PYTHON_VERSION=3.11.0
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - Wait for deployment to complete (~2-5 minutes)

5. **Get Your Service URL**
   - Format: `https://valid8-ingestion.onrender.com`
   - Save this URL for use in your orchestrator

### Method 2: Using render.yaml

Create `render.yaml` in repository root:
```yaml
services:
  - type: web
    name: valid8-ingestion
    env: python
    region: oregon
    plan: starter
    buildCommand: pip install -r backend/ingestion/requirements.txt
    startCommand: cd backend/ingestion && uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: LLM_PROVIDER
        value: groq
      - key: GROQ_API_KEY
        sync: false  # Set manually in dashboard
```

Then push to GitHub and Render will auto-deploy.

## Post-Deployment

### Verify Deployment
```bash
curl https://valid8-ingestion.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "valid8-ingestion",
  "version": "1.0.0",
  "llm_provider": "groq",
  "llm_configured": true
}
```

### Test CSV Ingestion
```bash
curl -X POST https://valid8-ingestion.onrender.com/ingest/csv \
  -F "file=@sample_providers.csv"
```

## Monitoring & Logs

- **Logs**: Available in Render Dashboard → Logs tab
- **Metrics**: View CPU, Memory usage in Dashboard
- **Health Checks**: Render automatically monitors `/health` endpoint

## Scaling

- **Free Tier**: Sleeps after 15 min inactivity (50-60s cold start)
- **Starter/Standard**: Always-on, auto-scaling
- Upgrade in Render Dashboard → Settings → Instance Type

## Troubleshooting

### Service won't start
- Check logs for missing dependencies
- Verify Python version (3.11+)
- Ensure all environment variables are set

### LLM API errors
- Verify API key is correct
- Check API key has sufficient credits
- Ensure LLM_PROVIDER matches your API key

### CSV parsing errors
- Verify file is valid UTF-8
- Check CSV has headers
- Ensure file size < 10MB for optimal performance

## Security Notes

- Never commit API keys to repository
- Use Render's environment variables for secrets
- Consider adding authentication to endpoints in production
- Configure CORS appropriately for your frontend domain

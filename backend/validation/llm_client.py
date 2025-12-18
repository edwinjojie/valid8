import os
import requests
import google.generativeai as genai

def generate(prompt: str) -> str:
    provider = os.getenv("LLM_PROVIDER", "gemini").lower()

    if provider == "gemini":
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set")
        
        genai.configure(api_key=api_key)
        
        # Validation service uses gemini-1.5-pro by default
        model_name = os.getenv("GEMINI_VALIDATION_MODEL", "gemini-1.5-pro")
        model = genai.GenerativeModel(model_name)
        
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            raise RuntimeError(f"Gemini generation failed: {str(e)}")

    elif provider == "ollama":
        base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        model_name = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
        
        url = f"{base_url}/api/generate"
        payload = {
            "model": model_name,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }
        
        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")
        except Exception as e:
             raise RuntimeError(f"Ollama generation failed: {str(e)}")

    else:
        raise ValueError(f"Unsupported LLM_PROVIDER: {provider}")

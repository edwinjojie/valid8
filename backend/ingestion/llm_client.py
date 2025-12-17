import os
import requests
import google.generativeai as genai

from typing import Any, Optional
import json

def generate(prompt: str, response_model: Any = None) -> str:
    provider = os.getenv("LLM_PROVIDER", "gemini").lower()

    if provider == "gemini":
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set")
        
        genai.configure(api_key=api_key)
        
        model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        model = genai.GenerativeModel(model_name)
        
        generation_config = {}
        if response_model:
            generation_config["response_mime_type"] = "application/json"
            if hasattr(response_model, "model_json_schema"):
                schema = response_model.model_json_schema()
                
                # Recursively remove 'default' and 'title' from schema
                def clean_schema(s):
                    if isinstance(s, dict):
                        return {k: clean_schema(v) for k, v in s.items() if k not in ["default", "title"]}
                    if isinstance(s, list):
                        return [clean_schema(i) for i in s]
                    return s
                
                generation_config["response_schema"] = clean_schema(schema)
            
        try:
            response = model.generate_content(prompt, generation_config=generation_config)
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
            "stream": False
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

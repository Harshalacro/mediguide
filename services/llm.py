import requests
import json

API_KEY = "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"


def simplify_report(text):
    try:
        url = "https://openrouter.ai/api/v1/chat/completions"

        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }

        prompt = f"""
You are an expert medical AI assistant.

Analyze the given medical report and return ONLY valid JSON (no extra text).

Output format:

{{
  "summary_en": "Simple explanation in English",
  "summary_hi": "Simple explanation in Hindi",
  "key_values": {{
    "hemoglobin": "value + status (Low/Normal/High)",
    "wbc": "value + status",
    "platelets": "value + status"
  }},
  "chart_data": [
    {{
      "name": "Metric Name",
      "value": 0.0,
      "min_normal": 0.0,
      "max_normal": 0.0,
      "unit": "measurement unit"
    }}
  ],
  "abnormal_findings": ["list of abnormal values"],
  "risk_level": "Low / Medium / High",
  "advice_en": "Detailed dietary recommendations, lifestyle changes, and critical precautions based specifically on the abnormal findings in English.",
  "advice_hi": "Detailed dietary recommendations, lifestyle changes, and critical precautions based specifically on the abnormal findings in Hindi."
}}

Rules:
- Keep language very simple
- Do not add extra text outside JSON
- If value not found, write "Not available"

Medical Report:
{text[:1500]}
"""

        data = {
            "model": "openai/gpt-3.5-turbo",
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }

        response = requests.post(url, headers=headers, json=data)

        result = response.json()

        # 🔥 Debug (optional)
        print("API RESPONSE:", result)

        if "choices" in result:
            content = result["choices"][0]["message"]["content"]

            # Try to clean JSON if model adds formatting
            try:
                if content.strip().startswith("```json"):
                    content = content.replace("```json", "").replace("```", "").strip()
                return json.loads(content)
            except:
                return {
                    "raw_output": content,
                    "error": "JSON parsing failed"
                }

        else:
            return {
                "error": "API failed",
                "details": result
            }

    except Exception as e:
        return {
            "error": "Exception occurred",
            "details": str(e)
        }

def analyze_xray(base64_image):
    try:
        url = "https://openrouter.ai/api/v1/chat/completions"

        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }

        prompt = """
You are an expert medical AI specializing in radiology. 
Analyze the given X-ray image and return ONLY valid JSON (no extra text).

Output format:
{
  "summary_en": "Simple explanation of the X-ray findings in English",
  "summary_hi": "Simple explanation in Hindi",
  "abnormal_findings": ["list of issues or abnormalities observed"],
  "risk_level": "Low / Medium / High",
  "advice_en": "Detailed dietary recommendations, lifestyle changes, and critical precautions based specifically on the abnormal findings in English.",
  "advice_hi": "Detailed dietary recommendations, lifestyle changes, and critical precautions based specifically on the abnormal findings in Hindi."
}

Rules:
- Keep language very simple.
- Do not add extra text outside JSON.
"""

        data = {
            "model": "openai/gpt-4o-mini",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]
                }
            ]
        }

        response = requests.post(url, headers=headers, json=data)
        result = response.json()

        print("API RESPONSE (X-RAY):", result)

        if "choices" in result:
            content = result["choices"][0]["message"]["content"]
            try:
                if content.strip().startswith("```json"):
                    content = content.replace("```json", "").replace("```", "").strip()
                return json.loads(content)
            except:
                return {
                    "raw_output": content,
                    "error": "JSON parsing failed"
                }

        else:
            return {
                "error": "API failed",
                "details": result
            }

    except Exception as e:
        return {
            "error": "Exception occurred",
            "details": str(e)
        }
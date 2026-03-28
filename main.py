from fastapi import FastAPI, UploadFile, File, Form, Request
from email.message import EmailMessage
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

from services.ocr import extract_text_from_image
from services.llm import simplify_report

app = FastAPI(title="MediGuide AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure temp folder exists
TEMP_DIR = "temp"
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)




# ✅ Upload test API
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()

        return {
            "filename": file.filename,
            "size": len(contents)
        }

    except Exception as e:
        return {"error": str(e)}


# ✅ Main AI pipeline
@app.post("/analyze")
async def analyze(file: UploadFile = File(...), report_type: str = Form("document")):
    try:
        file_path = os.path.join(TEMP_DIR, file.filename)

        # Save file
        with open(file_path, "wb") as f:
            f.write(await file.read())

        if report_type == "xray":
            from services.llm import analyze_xray
            import base64
            with open(file_path, "rb") as image_file:
                base64_image = base64.b64encode(image_file.read()).decode('utf-8')
            analysis_result = analyze_xray(base64_image)
            return {
                "filename": file.filename,
                "original_text": "X-Ray Image Analyzed",
                "simplified_text": analysis_result
            }
        else:
            # Step 1: OCR
            extracted_text = extract_text_from_image(file_path)

            # Step 2: Simplify
            simplified_text = simplify_report(extracted_text)

            return {
                "filename": file.filename,
                "original_text": extracted_text,
                "simplified_text": simplified_text
            }

    except Exception as e:
        return {"error": str(e)}

# Mount static files (must be at the bottom so it doesn't override API routes)
app.mount("/", StaticFiles(directory="public", html=True), name="public")
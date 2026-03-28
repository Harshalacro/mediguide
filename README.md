# 🩺 MediGuide AI

MediGuide AI is an intelligent medical laboratory right in your browser. Powered by cutting-edge Vision models and advanced OCR, MediGuide AI instantly analyzes medical documents (prescriptions, lab reports) and X-Rays, providing detailed clinical insights, risk assessments, and targeted dietary precautions.

## ✨ Key Features
- **Intelligent Parsing**: Upload PDFs or images of medical reports. Powered by Tesseract and massive language models to extract key metrics.
- **X-Ray Vision Diagnostics**: Upload X-Rays for deep clinical observation using GPT-4 Vision.
- **Bilingual Interface**: Read clinical summaries and precautions dynamically securely in both English and Hindi.
- **Dynamic Interactive Charts**: Visualizes patient metrics against "Normal Ranges", automatically highlighting severe abnormalities.
- **Supabase Authentication**: Securely create an account and log your medical history forever in the cloud.
- **Direct Google Drive Integration**: One-click "Save to Drive" securely pushes high-quality PDF renders of the clinic reports directly to the user's personal Google Drive via OAuth 2.0.

## 🚀 Built With
- **Frontend Core**: Vanilla HTML / CSS / JS, fully responsive split-screen SaaS layout.
- **Backend Infrastructure**: Python `FastAPI`
- **Database & Identity**: Supabase
- **AI Integration**: OpenRouter API (`openai/gpt-3.5-turbo`, `openai/gpt-4o-mini`)
- **Libraries**: `html2pdf.js`, `Chart.js`, `pytesseract`, `pdf2image`

## ⚙️ Local Setup

### 1. OS Requirements
Ensure you have the following installed on your system:
- Python 3.10+
- Tesseract-OCR (added to your system PATH)
- Poppler (for handling PDF extractions)

### 2. Installation
Clone the repository and install the backend dependencies in a virtual environment:
```bash
git clone https://github.com/Harshalacro/mediguide.git
cd mediguide
python -m venv venv
venv\Scripts\activate   # For Windows
# source venv/bin/activate  # For macOS/Linux
pip install fastapi uvicorn python-multipart pytesseract pdf2image pydantic openai httpx
```

### 3. Environment Configuration
Create a `.env` file in the root directory and add your AI credentials:
```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 4. Frontend Integrations
Open `public/script.js` and fill in the active cloud keys:
- **Supabase credentials** (Around Lines 7 & 8)
- **Google OAuth Client ID** (Around Line 346)

### 5. Run the Server
Launch the FastAPI application via `uvicorn`:
```bash
uvicorn main:app --port 8000 --reload
```
Navigate to `http://localhost:8000` to log in and start analyzing!

---
*Developed by [Harshal](https://github.com/Harshalacro)*

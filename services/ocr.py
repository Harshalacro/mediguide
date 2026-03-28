from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import os

# Tesseract path (adjust if needed)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# ✅ YOUR REAL POPPLER PATH (update if you move folder)
POPPLER_PATH = r"C:\Users\SAHIL\Downloads\Release-25.12.0-0\poppler-25.12.0\Library\bin"


def extract_text_from_image(file_path):
    try:
        print("Using Poppler Path:", POPPLER_PATH)

        # ✅ Handle PDF
        if file_path.lower().endswith(".pdf"):
            images = convert_from_path(file_path, poppler_path=POPPLER_PATH)
            text = ""

            for i, img in enumerate(images):
                temp_img_path = f"temp/page_{i}.png"
                img.save(temp_img_path, "PNG")
                text += pytesseract.image_to_string(Image.open(temp_img_path))

            return text

        # ✅ Handle Image
        else:
            img = Image.open(file_path)
            return pytesseract.image_to_string(img)

    except Exception as e:
        return f"OCR Error: {str(e)}"
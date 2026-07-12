from PIL import Image, ImageEnhance
import pytesseract

from app.config import get_settings


settings = get_settings()
if settings.tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd


def extract_text(image: Image.Image) -> str:
    grayscale = image.convert("L")
    enhanced = ImageEnhance.Contrast(grayscale).enhance(1.5)
    try:
        return pytesseract.image_to_string(enhanced)
    finally:
        enhanced.close()
        if grayscale is not image:
            grayscale.close()

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import Response
from PIL import Image, ImageEnhance, ImageFilter
import io
import numpy as np
from typing import Optional
from pydantic import BaseModel

router = APIRouter(prefix="/api/image", tags=["image"])


class CropParams(BaseModel):
    x: int
    y: int
    width: int
    height: int


class FilterParams(BaseModel):
    filter_type: Optional[str] = None
    brightness: Optional[float] = 100.0
    contrast: Optional[float] = 100.0
    saturation: Optional[float] = 100.0


def decode_base64_image(base64_string: str) -> Image.Image:
    """Decode base64 image string to PIL Image"""
    import base64
    # Remove data URL prefix if present
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    image_data = base64.b64decode(base64_string)
    return Image.open(io.BytesIO(image_data))


def encode_image_to_base64(image: Image.Image, format: str = "PNG") -> str:
    """Encode PIL Image to base64 string"""
    import base64
    output = io.BytesIO()
    image.save(output, format=format)
    output.seek(0)
    return base64.b64encode(output.read()).decode('utf-8')


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image file"""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    contents = await file.read()
    img = Image.open(io.BytesIO(contents))
    
    # Return image as base64
    base64_image = encode_image_to_base64(img)
    
    return {
        "filename": file.filename,
        "size": len(contents),
        "width": img.width,
        "height": img.height,
        "image": f"data:image/png;base64,{base64_image}"
    }


@router.post("/crop")
async def crop_image(
    image_data: str = Form(...),
    x: int = Form(...),
    y: int = Form(...),
    width: int = Form(...),
    height: int = Form(...)
):
    """Crop an image"""
    try:
        img = decode_base64_image(image_data)
        
        # Validate crop parameters
        if x < 0 or y < 0 or width <= 0 or height <= 0:
            raise HTTPException(status_code=400, detail="Invalid crop parameters")
        if x + width > img.width or y + height > img.height:
            raise HTTPException(status_code=400, detail="Crop area exceeds image dimensions")
        
        # Crop the image
        cropped = img.crop((x, y, x + width, y + height))
        
        # Return as base64
        base64_image = encode_image_to_base64(cropped)
        return {"image": f"data:image/png;base64,{base64_image}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/rotate")
async def rotate_image(
    image_data: str = Form(...),
    degrees: float = Form(...)
):
    """Rotate an image"""
    try:
        img = decode_base64_image(image_data)
        
        # Rotate the image (expand=True to show full rotated image)
        rotated = img.rotate(-degrees, expand=True, fillcolor=(255, 255, 255, 0))
        
        # Return as base64
        base64_image = encode_image_to_base64(rotated)
        return {"image": f"data:image/png;base64,{base64_image}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/flip")
async def flip_image(
    image_data: str = Form(...),
    direction: str = Form(...)  # "horizontal" or "vertical"
):
    """Flip an image horizontally or vertically"""
    try:
        img = decode_base64_image(image_data)
        
        if direction == "horizontal":
            flipped = img.transpose(Image.FLIP_LEFT_RIGHT)
        elif direction == "vertical":
            flipped = img.transpose(Image.FLIP_TOP_BOTTOM)
        else:
            raise HTTPException(status_code=400, detail="Direction must be 'horizontal' or 'vertical'")
        
        # Return as base64
        base64_image = encode_image_to_base64(flipped)
        return {"image": f"data:image/png;base64,{base64_image}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/apply-filters")
async def apply_filters(
    image_data: str = Form(...),
    filter_type: Optional[str] = Form(None),
    brightness: Optional[float] = Form(100.0),
    contrast: Optional[float] = Form(100.0),
    saturation: Optional[float] = Form(100.0)
):
    """Apply filters and adjustments to an image"""
    try:
        img = decode_base64_image(image_data)
        
        # Convert to RGB if necessary (for filters)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Apply filter type
        if filter_type == "grayscale":
            img = img.convert('L').convert('RGB')
        elif filter_type == "sepia":
            # Convert to numpy array for sepia effect
            img_array = np.array(img)
            sepia_matrix = np.array([
                [0.393, 0.769, 0.189],
                [0.349, 0.686, 0.168],
                [0.272, 0.534, 0.131]
            ])
            img_array = np.dot(img_array, sepia_matrix.T)
            img_array = np.clip(img_array, 0, 255).astype(np.uint8)
            img = Image.fromarray(img_array)
        elif filter_type == "blur":
            img = img.filter(ImageFilter.BLUR)
        elif filter_type == "invert":
            img_array = np.array(img)
            img_array = 255 - img_array
            img = Image.fromarray(img_array)
        
        # Apply brightness
        if brightness != 100.0:
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(brightness / 100.0)
        
        # Apply contrast
        if contrast != 100.0:
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(contrast / 100.0)
        
        # Apply saturation
        if saturation != 100.0:
            enhancer = ImageEnhance.Color(img)
            img = enhancer.enhance(saturation / 100.0)
        
        # Return as base64
        base64_image = encode_image_to_base64(img)
        return {"image": f"data:image/png;base64,{base64_image}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/resize")
async def resize_image(
    image_data: str = Form(...),
    width: Optional[int] = Form(None),
    height: Optional[int] = Form(None)
):
    """Resize an image"""
    try:
        img = decode_base64_image(image_data)
        
        if width or height:
            if width and height:
                img = img.resize((width, height), Image.Resampling.LANCZOS)
            elif width:
                ratio = width / img.width
                new_height = int(img.height * ratio)
                img = img.resize((width, new_height), Image.Resampling.LANCZOS)
            elif height:
                ratio = height / img.height
                new_width = int(img.width * ratio)
                img = img.resize((new_width, height), Image.Resampling.LANCZOS)
        
        # Return as base64
        base64_image = encode_image_to_base64(img)
        return {"image": f"data:image/png;base64,{base64_image}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/convert")
async def convert_image(
    file: UploadFile = File(...),
    format: str = "PNG"
):
    """Convert image format"""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    contents = await file.read()
    img = Image.open(io.BytesIO(contents))
    
    output = io.BytesIO()
    img.save(output, format=format)
    output.seek(0)
    
    media_type = f"image/{format.lower()}"
    return Response(content=output.read(), media_type=media_type)

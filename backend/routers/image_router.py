from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import Response
from PIL import Image, ImageEnhance, ImageFilter
import io
import numpy as np
import cv2
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
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    image_data = base64.b64decode(base64_string)
    return Image.open(io.BytesIO(image_data))


def encode_image_to_base64(image: Image.Image, format: str = "PNG") -> str:
    """Encode PIL Image to base64 string"""
    import base64

    output = io.BytesIO()
    image.save(output, format=format)
    output.seek(0)
    return base64.b64encode(output.read()).decode("utf-8")


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
        "image": f"data:image/png;base64,{base64_image}",
    }


@router.post("/crop")
async def crop_image(
    image_data: str = Form(...),
    x: int = Form(...),
    y: int = Form(...),
    width: int = Form(...),
    height: int = Form(...),
):
    """Crop an image"""
    try:
        img = decode_base64_image(image_data)

        # Validate crop parameters
        if x < 0 or y < 0 or width <= 0 or height <= 0:
            raise HTTPException(status_code=400, detail="Invalid crop parameters")
        if x + width > img.width or y + height > img.height:
            raise HTTPException(
                status_code=400, detail="Crop area exceeds image dimensions"
            )

        # Crop the image
        cropped = img.crop((x, y, x + width, y + height))

        # Return as base64
        base64_image = encode_image_to_base64(cropped)
        return {"image": f"data:image/png;base64,{base64_image}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/rotate")
async def rotate_image(image_data: str = Form(...), degrees: float = Form(...)):
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
    direction: str = Form(...),  # "horizontal" or "vertical"
):
    """Flip an image horizontally or vertically"""
    try:
        img = decode_base64_image(image_data)

        if direction == "horizontal":
            flipped = img.transpose(Image.FLIP_LEFT_RIGHT)
        elif direction == "vertical":
            flipped = img.transpose(Image.FLIP_TOP_BOTTOM)
        else:
            raise HTTPException(
                status_code=400, detail="Direction must be 'horizontal' or 'vertical'"
            )

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
    saturation: Optional[float] = Form(100.0),
):
    """Apply filters and adjustments to an image"""
    try:
        img = decode_base64_image(image_data)

        # Convert to RGB if necessary (for filters)
        if img.mode != "RGB":
            img = img.convert("RGB")

        # Apply filter type
        if filter_type == "grayscale":
            img = img.convert("L").convert("RGB")
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
    height: Optional[int] = Form(None),
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
async def convert_image(file: UploadFile = File(...), format: str = "PNG"):
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


@router.post("/adjust")
async def adjust_image(
    image_url: str = Form(...),
    operation: str = Form(...),
    threshold: Optional[int] = Form(128),
    kernel_size: Optional[int] = Form(3),
    sigma: Optional[float] = Form(1.0),
):
    """Apply various image adjustments and processing operations"""
    try:
        # Decode the image
        img = decode_base64_image(image_url)

        # Convert to numpy array for OpenCV processing
        img_array = np.array(img)

        # Convert RGB to BGR for OpenCV (if needed)
        if len(img_array.shape) == 3 and img_array.shape[2] == 3:
            img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        else:
            img_cv = img_array

        # Apply the selected operation
        result = None

        if operation == "equalization":
            # Histogram equalization
            if len(img_cv.shape) == 3:
                # Color image - equalize each channel separately
                channels = cv2.split(img_cv)
                equalized_channels = []
                for channel in channels:
                    equalized_channels.append(cv2.equalizeHist(channel))
                result = cv2.merge(equalized_channels)
            else:
                # Grayscale image
                result = cv2.equalizeHist(img_cv)

        elif operation == "stretching":
            # Contrast stretching
            if len(img_cv.shape) == 3:
                # Color image - stretch each channel
                channels = cv2.split(img_cv)
                stretched_channels = []
                for channel in channels:
                    min_val = np.min(channel)
                    max_val = np.max(channel)
                    if max_val > min_val:
                        stretched = (
                            (channel - min_val) / (max_val - min_val) * 255
                        ).astype(np.uint8)
                    else:
                        stretched = channel
                    stretched_channels.append(stretched)
                result = cv2.merge(stretched_channels)
            else:
                # Grayscale
                min_val = np.min(img_cv)
                max_val = np.max(img_cv)
                if max_val > min_val:
                    result = ((img_cv - min_val) / (max_val - min_val) * 255).astype(
                        np.uint8
                    )
                else:
                    result = img_cv

        elif operation == "thresholding":
            # Binary thresholding
            _, result = cv2.threshold(img_cv, threshold, 255, cv2.THRESH_BINARY)
            if len(result.shape) == 2:  # Convert grayscale back to RGB
                result = cv2.cvtColor(result, cv2.COLOR_GRAY2RGB)
                result = cv2.cvtColor(result, cv2.COLOR_GRAY2RGB)

        elif operation == "mean":
            # Mean/Average filter
            result = cv2.blur(img_cv, (kernel_size, kernel_size))

        elif operation == "gaussian":
            # Gaussian filter
            result = cv2.GaussianBlur(img_cv, (kernel_size, kernel_size), sigma)

        elif operation == "median":
            # Median filter
            result = cv2.medianBlur(img_cv, kernel_size)

        elif operation == "sobel":
            # Sobel edge detection
            gray = (
                cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
                if len(img_cv.shape) == 3
                else img_cv
            )
            sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=kernel_size)
            sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=kernel_size)
            magnitude = np.sqrt(sobelx**2 + sobely**2)
            magnitude = np.uint8(magnitude / np.max(magnitude) * 255)
            result = cv2.cvtColor(magnitude, cv2.COLOR_GRAY2RGB)

        elif operation == "laplacian":
            # Laplacian filter
            gray = (
                cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
                if len(img_cv.shape) == 3
                else img_cv
            )
            laplacian = cv2.Laplacian(gray, cv2.CV_64F, ksize=kernel_size)
            laplacian = cv2.convertScaleAbs(laplacian)
            result = cv2.cvtColor(laplacian, cv2.COLOR_GRAY2RGB)

        elif operation == "prewitt":
            # Prewitt edge detection
            gray = (
                cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
                if len(img_cv.shape) == 3
                else img_cv
            )
            kernelx = np.array([[1, 1, 1], [0, 0, 0], [-1, -1, -1]])
            kernely = np.array([[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]])
            prewittx = cv2.filter2D(gray, -1, kernelx)
            prewitty = cv2.filter2D(gray, -1, kernely)
            magnitude = np.sqrt(prewittx**2 + prewitty**2)
            magnitude = np.uint8(magnitude / np.max(magnitude) * 255)
            result = cv2.cvtColor(magnitude, cv2.COLOR_GRAY2RGB)

        elif operation == "canny":
            # Canny edge detection
            gray = (
                cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
                if len(img_cv.shape) == 3
                else img_cv
            )
            edges = cv2.Canny(gray, threshold, threshold * 2)
            result = cv2.cvtColor(edges, cv2.COLOR_GRAY2RGB)

        else:
            raise HTTPException(
                status_code=400, detail=f"Unknown operation: {operation}"
            )

        if result is None:
            raise HTTPException(status_code=500, detail="Failed to process image")

        # Convert back to PIL Image
        if len(result.shape) == 3:
            result_rgb = cv2.cvtColor(result, cv2.COLOR_BGR2RGB)
        else:
            result_rgb = result

        result_img = Image.fromarray(result_rgb)

        # Return as base64
        base64_image = encode_image_to_base64(result_img)
        return {"image_url": f"data:image/png;base64,{base64_image}"}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

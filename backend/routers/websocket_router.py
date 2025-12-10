from fastapi import WebSocket, WebSocketDisconnect
from PIL import Image, ImageEnhance, ImageFilter
import io
import numpy as np
import json
import base64
import asyncio
from typing import Optional


def decode_base64_image(base64_string: str) -> Image.Image:
    """Decode base64 image string to PIL Image"""
    # Remove data URL prefix if present
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    image_data = base64.b64decode(base64_string)
    return Image.open(io.BytesIO(image_data))


def encode_image_to_base64(image: Image.Image, format: str = "PNG") -> str:
    """Encode PIL Image to base64 string"""
    output = io.BytesIO()
    image.save(output, format=format)
    output.seek(0)
    return base64.b64encode(output.read()).decode('utf-8')


def apply_filters_to_image(
    img: Image.Image,
    filter_type: Optional[str] = None,
    brightness: Optional[float] = 100.0,
    contrast: Optional[float] = 100.0,
    saturation: Optional[float] = 100.0
) -> Image.Image:
    """Apply filters and adjustments to an image"""
    # Convert to RGB if necessary
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Apply filter type
    if filter_type and filter_type != "none":
        if filter_type == "grayscale":
            img = img.convert('L').convert('RGB')
        elif filter_type == "sepia":
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
    if brightness is not None and brightness != 100.0:
        enhancer = ImageEnhance.Brightness(img)
        img = enhancer.enhance(brightness / 100.0)
    
    # Apply contrast
    if contrast is not None and contrast != 100.0:
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(contrast / 100.0)
    
    # Apply saturation
    if saturation is not None and saturation != 100.0:
        enhancer = ImageEnhance.Color(img)
        img = enhancer.enhance(saturation / 100.0)
    
    return img


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)


manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    original_image: Optional[Image.Image] = None
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            message_type = message.get("type")
            
            if message_type == "init":
                # Initialize with original image
                image_data = message.get("image_data")
                if image_data:
                    original_image = decode_base64_image(image_data)
                    await manager.send_personal_message({
                        "type": "initialized",
                        "status": "ready"
                    }, websocket)
            
            elif message_type == "apply_filters":
                if original_image is None:
                    await manager.send_personal_message({
                        "type": "error",
                        "message": "Image not initialized"
                    }, websocket)
                    continue
                
                # Get filter parameters
                filter_type = message.get("filter_type")
                brightness = message.get("brightness", 100.0)
                contrast = message.get("contrast", 100.0)
                saturation = message.get("saturation", 100.0)
                
                # Apply filters
                processed_image = apply_filters_to_image(
                    original_image.copy(),
                    filter_type,
                    brightness,
                    contrast,
                    saturation
                )
                
                # Encode and send back
                base64_image = encode_image_to_base64(processed_image)
                await manager.send_personal_message({
                    "type": "filter_result",
                    "image": f"data:image/png;base64,{base64_image}"
                }, websocket)
            
            elif message_type == "reset":
                if original_image:
                    base64_image = encode_image_to_base64(original_image)
                    await manager.send_personal_message({
                        "type": "reset_result",
                        "image": f"data:image/png;base64,{base64_image}"
                    }, websocket)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        await manager.send_personal_message({
            "type": "error",
            "message": str(e)
        }, websocket)
        manager.disconnect(websocket)


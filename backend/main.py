from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from routers import image_router
from routers.websocket_router import websocket_endpoint

app = FastAPI(title="FastAPI Backend", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(image_router.router)

# WebSocket endpoint
@app.websocket("/ws/image-processor")
async def websocket_route(websocket: WebSocket):
    await websocket_endpoint(websocket)


@app.get("/")
async def root():
    return {"message": "Hello from FastAPI!"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/api/items")
async def get_items():
    return {"items": ["item1", "item2", "item3"]}


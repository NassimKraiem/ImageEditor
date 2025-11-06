# Full Stack Application

This project contains a Next.js frontend (TypeScript + Tailwind CSS) and a FastAPI backend, both containerized with Docker.

## Project Structure

```
.
├── frontend/          # Next.js application with TypeScript and Tailwind CSS
├── backend/           # FastAPI application
└── docker-compose.yml # Docker Compose configuration
```

## Prerequisites

- Docker and Docker Compose installed on your system
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)

## Getting Started

### Using Docker Compose (Recommended)

1. Build and start all services:
```bash
docker-compose up --build
```

2. Access the applications:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Backend API Docs: http://localhost:8000/docs

### Local Development

#### Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:3000

#### Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (optional but recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the development server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at http://localhost:8000

## Docker Commands

- Build images: `docker-compose build`
- Start services: `docker-compose up`
- Start in background: `docker-compose up -d`
- Stop services: `docker-compose down`
- View logs: `docker-compose logs -f`
- Rebuild and restart: `docker-compose up --build`

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /api/items` - Get items list
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation

## Technologies

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- React 18

### Backend
- FastAPI
- Python 3.11
- Uvicorn


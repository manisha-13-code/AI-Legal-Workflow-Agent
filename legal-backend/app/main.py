from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app.routers import auth, dashboard, cases, documents, copilot, settings
import os

# Create all tables
Base.metadata.create_all(bind=engine)

# Ensure uploads dir exists
os.makedirs("uploads", exist_ok=True)

app = FastAPI(
    title="AI Legal Workflow API",
    description="Backend API for AI Legal Workflow platform with Groq LLM integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS - Allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(cases.router)
app.include_router(documents.router)
app.include_router(copilot.router)
app.include_router(settings.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "AI Legal Workflow API is running",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "AI Legal Workflow API"}

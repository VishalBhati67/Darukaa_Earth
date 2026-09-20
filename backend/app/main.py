from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, projects, sites, analytics

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")
origins = [
    origin.strip()
    for origin in settings.CORS_ORIGINS.split(",")
    if origin.strip()
]
# Configure CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(sites.router)
app.include_router(analytics.router)

@app.get("/")
def root():
    return {"message": "Welcome to Darukaa.Earth API"}


@app.get("/health")
def health():
    return {"status": "ok"}
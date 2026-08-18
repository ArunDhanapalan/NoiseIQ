import os
from typing import Optional, List
from fastapi import FastAPI, Depends, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
from models import NoiseReading
from schemas import (
    NoiseReadingCreate,
    NoiseReadingResponse,
    GeoJSONFeatureCollection,
    AnalyticsSummary,
    HourlyTrendItem
)
import crud
from seed import seed_database

# Initialize DB tables and seed data automatically on startup
Base.metadata.create_all(bind=engine)
try:
    seed_database()
except Exception as e:
    print(f"[WARN] Startup seed skipped: {e}")

app = FastAPI(
    title="NoiseIQ – Urban Noise Analytics API",
    description="High-density municipal acoustic telemetry & crowdsourced noise mapping API",
    version="1.0.0"
)

# Enable CORS for frontend cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/health", summary="Health Check")
def health_check():
    return {
        "status": "healthy",
        "service": "NoiseIQ Urban Analytics Engine",
        "version": "1.0.0",
        "database": "online"
    }

@app.get("/api/v1/noise/live", response_model=GeoJSONFeatureCollection, summary="Fetch Live Spatial GeoJSON FeatureCollection")
def get_live_noise_geojson(
    city: Optional[str] = Query(None, description="City identifier slug (e.g. chennai, mumbai)"),
    category: Optional[str] = Query(None, description="Filter by category: traffic, construction, loudspeakers, industrial, ambient"),
    source_type: Optional[str] = Query(None, description="Filter by source: crowdsourced, iot_sensor"),
    min_db: Optional[float] = Query(None, description="Filter by minimum decibel level"),
    max_db: Optional[float] = Query(None, description="Filter by maximum decibel level"),
    db: Session = Depends(get_db)
):
    readings = crud.get_readings(db, city=city, category=category, source_type=source_type, min_db=min_db, max_db=max_db)
    return crud.to_geojson_collection(readings)

@app.get("/api/v1/noise/raw", response_model=List[NoiseReadingResponse], summary="Fetch Raw Noise Readings List")
def get_raw_noise_readings(
    city: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    source_type: Optional[str] = Query(None),
    min_db: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    readings = crud.get_readings(db, city=city, category=category, source_type=source_type, min_db=min_db)
    return [r.to_dict() for r in readings]

@app.get("/api/v1/analytics/stats", response_model=AnalyticsSummary, summary="Fetch Aggregate City Stats")
def get_analytics_summary(
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return crud.get_analytics_summary(db, city=city)

@app.get("/api/v1/analytics/trends", response_model=List[HourlyTrendItem], summary="Fetch Hourly 24-Hour Trend Series")
def get_hourly_trends(
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return crud.get_hourly_trends(db, city=city)

@app.post("/api/v1/noise/submit", response_model=NoiseReadingResponse, status_code=status.HTTP_201_CREATED, summary="Ingest Citizen Noise Reading")
def submit_noise_reading(reading: NoiseReadingCreate, db: Session = Depends(get_db)):
    try:
        created = crud.create_reading(db, reading)
        return created.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest noise reading: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

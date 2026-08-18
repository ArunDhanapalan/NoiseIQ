from typing import List, Optional
from pydantic import BaseModel, Field

class NoiseReadingCreate(BaseModel):
    city: Optional[str] = Field(default="chennai", description="City identifier slug")
    latitude: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude coordinate")
    decibel_level: float = Field(..., ge=20, le=140, description="Decibel reading (dB SPL)")
    source_type: str = Field(default="crowdsourced", description="crowdsourced or iot_sensor")
    category: str = Field(default="ambient", description="traffic, construction, loudspeakers, industrial, ambient")
    location_name: Optional[str] = Field(default="Submitted Location", description="Descriptive address or area")
    notes: Optional[str] = Field(default="", description="User notes or observation details")

class NoiseReadingResponse(BaseModel):
    id: str
    city: Optional[str] = "chennai"
    latitude: float
    longitude: float
    decibel_level: float
    source_type: str
    category: str
    location_name: str
    notes: Optional[str] = ""
    timestamp: str
    severity: str

    class Config:
        from_attributes = True

class GeoJSONGeometry(BaseModel):
    type: str = "Point"
    coordinates: List[float] # [longitude, latitude]

class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: GeoJSONGeometry
    properties: dict

class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]

class AnalyticsSummary(BaseModel):
    city_avg_db: float
    active_sensors: int
    violations_today: int
    peak_noise_zone: str
    quietest_zone: str
    total_readings: int
    crowdsourced_count: int
    iot_count: int

class HourlyTrendItem(BaseModel):
    hour: str
    avg_db: float
    max_db: float
    min_db: float
    violations: int

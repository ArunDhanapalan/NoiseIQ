import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Text
from database import Base

class NoiseReading(Base):
    __tablename__ = "noise_readings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    city = Column(String(32), nullable=False, default="chennai", index=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    decibel_level = Column(Float, nullable=False, index=True)
    source_type = Column(String(32), nullable=False, default="crowdsourced") # crowdsourced | iot_sensor
    category = Column(String(32), nullable=False, default="ambient") # traffic, construction, loudspeakers, industrial, ambient
    location_name = Column(String(128), nullable=False, default="Urban Area")
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "city": self.city,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "decibel_level": self.decibel_level,
            "source_type": self.source_type,
            "category": self.category,
            "location_name": self.location_name,
            "notes": self.notes or "",
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "severity": "violation" if self.decibel_level > 70 else ("moderate" if self.decibel_level >= 55 else "safe")
        }

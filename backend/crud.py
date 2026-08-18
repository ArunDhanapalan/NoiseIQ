from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from models import NoiseReading
from schemas import NoiseReadingCreate, GeoJSONFeature, GeoJSONFeatureCollection, GeoJSONGeometry

def get_readings(
    db: Session,
    city: str = None,
    category: str = None,
    source_type: str = None,
    min_db: float = None,
    max_db: float = None,
    limit: int = 200
):
    query = db.query(NoiseReading)
    if city:
        query = query.filter(NoiseReading.city == city)
    if category and category.lower() != "all":
        query = query.filter(NoiseReading.category == category)
    if source_type and source_type.lower() != "all":
        query = query.filter(NoiseReading.source_type == source_type)
    if min_db is not None:
        query = query.filter(NoiseReading.decibel_level >= min_db)
    if max_db is not None:
        query = query.filter(NoiseReading.decibel_level <= max_db)
    
    return query.order_by(NoiseReading.timestamp.desc()).limit(limit).all()

def to_geojson_collection(readings) -> GeoJSONFeatureCollection:
    features = []
    for r in readings:
        data = r.to_dict()
        feature = GeoJSONFeature(
            geometry=GeoJSONGeometry(coordinates=[r.longitude, r.latitude]),
            properties=data
        )
        features.append(feature)
    return GeoJSONFeatureCollection(features=features)

def create_reading(db: Session, reading_in: NoiseReadingCreate) -> NoiseReading:
    db_obj = NoiseReading(
        city=reading_in.city or "chennai",
        latitude=reading_in.latitude,
        longitude=reading_in.longitude,
        decibel_level=round(reading_in.decibel_level, 1),
        source_type=reading_in.source_type,
        category=reading_in.category,
        location_name=reading_in.location_name or "Citizen Submitted",
        notes=reading_in.notes or "",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_analytics_summary(db: Session, city: str = None):
    query = db.query(NoiseReading)
    if city:
        query = query.filter(NoiseReading.city == city)
    
    total_count = query.count()
    if total_count == 0:
        return {
            "city_avg_db": 0.0,
            "active_sensors": 0,
            "violations_today": 0,
            "peak_noise_zone": "N/A",
            "quietest_zone": "N/A",
            "total_readings": 0,
            "crowdsourced_count": 0,
            "iot_count": 0
        }

    avg_db = query.with_entities(func.avg(NoiseReading.decibel_level)).scalar() or 0.0
    violations_today = query.filter(NoiseReading.decibel_level > 70.0).count()
    iot_count = query.filter(NoiseReading.source_type == "iot_sensor").count()
    crowdsourced_count = query.filter(NoiseReading.source_type == "crowdsourced").count()

    # Peak noise zone query
    peak_reading = query.order_by(NoiseReading.decibel_level.desc()).first()
    quietest_reading = query.order_by(NoiseReading.decibel_level.asc()).first()

    return {
        "city_avg_db": round(float(avg_db), 1),
        "active_sensors": iot_count,
        "violations_today": violations_today,
        "peak_noise_zone": peak_reading.location_name if peak_reading else "Municipal Zone",
        "quietest_zone": quietest_reading.location_name if quietest_reading else "Eco Sanctuary",
        "total_readings": total_count,
        "crowdsourced_count": crowdsourced_count,
        "iot_count": iot_count
    }

def get_hourly_trends(db: Session, city: str = None):
    query = db.query(NoiseReading)
    if city:
        query = query.filter(NoiseReading.city == city)
    readings = query.order_by(NoiseReading.timestamp.asc()).all()
    if not readings:
        return []

    # Group by 2-hour windows or hours
    hourly_buckets = {}
    for i in range(0, 24, 2):
        label = f"{i:02d}:00"
        hourly_buckets[label] = []

    for r in readings:
        if r.timestamp:
            hour_val = r.timestamp.hour
            bucket_key = f"{(hour_val // 2) * 2:02d}:00"
            if bucket_key in hourly_buckets:
                hourly_buckets[bucket_key].append(r.decibel_level)

    result = []
    for hour_str, vals in hourly_buckets.items():
        if vals:
            avg_v = round(sum(vals) / len(vals), 1)
            max_v = round(max(vals), 1)
            min_v = round(min(vals), 1)
            viol_v = sum(1 for v in vals if v > 70.0)
        else:
            avg_v = 52.0
            max_v = 64.0
            min_v = 42.0
            viol_v = 0
        result.append({
            "hour": hour_str,
            "avg_db": avg_v,
            "max_db": max_v,
            "min_db": min_v,
            "violations": viol_v
        })
    return result

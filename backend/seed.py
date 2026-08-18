import random
from datetime import datetime, timezone, timedelta
from database import Base, engine, SessionLocal
from models import NoiseReading

SAMPLE_LOCATIONS = [
    {"city": "chennai", "name": "T. Nagar Ranganathan St", "lat": 13.0405, "lng": 80.2337, "category": "traffic", "base_db": 78.4},
    {"city": "chennai", "name": "Anna Nagar Roundtana Metro", "lat": 13.0878, "lng": 80.2170, "category": "construction", "base_db": 82.6},
    {"city": "chennai", "name": "Velachery Bypass Flyover", "lat": 12.9780, "lng": 80.2412, "category": "traffic", "base_db": 74.2},
    {"city": "chennai", "name": "Guindy Kathipara Junction", "lat": 13.0102, "lng": 80.2156, "category": "traffic", "base_db": 84.8},
    {"city": "coimbatore", "name": "Gandhipuram Bus Stand", "lat": 11.0183, "lng": 76.9644, "category": "traffic", "base_db": 76.5},
    {"city": "coimbatore", "name": "RS Puram DB Road", "lat": 11.0085, "lng": 76.9512, "category": "traffic", "base_db": 62.4},
    {"city": "bangalore", "name": "Silk Board Flyover", "lat": 12.9172, "lng": 77.6228, "category": "traffic", "base_db": 87.5},
    {"city": "bangalore", "name": "MG Road Metro Corridor", "lat": 12.9756, "lng": 77.6066, "category": "construction", "base_db": 81.2},
    {"city": "mumbai", "name": "Dadar TT Circle", "lat": 19.0178, "lng": 72.8478, "category": "traffic", "base_db": 89.4},
    {"city": "mumbai", "name": "Bandra Kurla Complex", "lat": 19.0657, "lng": 72.8686, "category": "traffic", "base_db": 77.8},
    {"city": "pune", "name": "FC Road Deccan", "lat": 18.5204, "lng": 73.8431, "category": "traffic", "base_db": 74.8},
    {"city": "delhi", "name": "Connaught Place Inner Circle", "lat": 28.6315, "lng": 77.2167, "category": "traffic", "base_db": 83.4},
    {"city": "hyderabad", "name": "HITEC Cyber Towers", "lat": 17.4435, "lng": 78.3772, "category": "traffic", "base_db": 77.2},
    {"city": "kolkata", "name": "Park Street Crossing", "lat": 22.5530, "lng": 88.3530, "category": "traffic", "base_db": 81.8},
    {"city": "ahmedabad", "name": "SG Highway Iscon", "lat": 23.0300, "lng": 72.5180, "category": "traffic", "base_db": 76.8},
    {"city": "jaipur", "name": "MI Road Ajmeri Gate", "lat": 26.9180, "lng": 75.8150, "category": "traffic", "base_db": 75.2},
]

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing old data if untagged
    db.query(NoiseReading).delete()
    db.commit()

    print("[INFO] Seeding database with strict Indian cities acoustic telemetry...")
    now = datetime.now(timezone.utc)

    readings = []
    for location in SAMPLE_LOCATIONS:
        for sensor_idx in range(2):
            sensor_lat = location["lat"] + (random.random() - 0.5) * 0.004
            sensor_lng = location["lng"] + (random.random() - 0.5) * 0.004
            sensor_name = f"{location['name']} (IoT #{sensor_idx+1})"

            for hours_ago in range(0, 24, 2):
                ts = now - timedelta(hours=hours_ago)
                time_factor = 1.15 if (7 <= ts.hour <= 19) else 0.85
                fluctuation = (random.random() - 0.5) * 8.0
                decibel = round(max(30.0, min(115.0, location["base_db"] * time_factor + fluctuation)), 1)

                reading = NoiseReading(
                    city=location["city"],
                    latitude=sensor_lat,
                    longitude=sensor_lng,
                    decibel_level=decibel,
                    source_type="iot_sensor",
                    category=location["category"],
                    location_name=sensor_name,
                    notes=f"Automated sensor report for {location['city'].capitalize()}",
                    timestamp=ts
                )
                readings.append(reading)

        for _ in range(3):
            sub_lat = location["lat"] + (random.random() - 0.5) * 0.008
            sub_lng = location["lng"] + (random.random() - 0.5) * 0.008
            ts = now - timedelta(hours=random.randint(0, 18), minutes=random.randint(0, 59))
            decibel = round(max(35.0, min(110.0, location["base_db"] + (random.random() - 0.5) * 12.0)), 1)

            reading = NoiseReading(
                city=location["city"],
                latitude=sub_lat,
                longitude=sub_lng,
                decibel_level=decibel,
                source_type="crowdsourced",
                category=location["category"],
                location_name=f"{location['name']} Citizen Report",
                notes=f"Citizen report in {location['city'].capitalize()}",
                timestamp=ts
            )
            readings.append(reading)

    db.add_all(readings)
    db.commit()
    print(f"[SUCCESS] Successfully seeded {len(readings)} noise readings into the database!")
    db.close()

if __name__ == "__main__":
    seed_database()

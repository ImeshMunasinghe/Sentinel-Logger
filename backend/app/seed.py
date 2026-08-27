import os
import csv
from sqlalchemy.orm import Session
from .database import engine, Base
from .models import User, Location
from .auth import get_password_hash

def seed_db(db: Session):
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    
    # Seed Users
    if db.query(User).count() == 0:
        csv_path = os.path.join(os.path.dirname(__file__), "Users.csv")
        if os.path.exists(csv_path):
            with open(csv_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # hash the plaintext password
                    password_hash = get_password_hash(row["password"])
                    user = User(
                        username=row["username"],
                        password_hash=password_hash,
                        full_name=row.get("full_name"),
                        role=row["role"],
                        badge_id=row.get("badge_id")
                    )
                    db.add(user)
            db.commit()
            print("Database seeding: Added default users.")
        else:
            print("Database seeding warning: Users.csv database file not found")
            
    # Seed Locations
    if db.query(Location).count() == 0:
        csv_path = os.path.join(os.path.dirname(__file__), "Locations.csv")
        if os.path.exists(csv_path):
            with open(csv_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    location = Location(
                        name=row["name"],
                        nfc_tag_id=row["nfc_tag_id"],
                        latitude=float(row["latitude"]),
                        longitude=float(row["longitude"]),
                        description=row.get("description")
                    )
                    db.add(location)
            db.commit()
            print("Database seeding: Added default checkpoints.")
        else:
            print("Database seeding warning: Locations.csv database file not found")

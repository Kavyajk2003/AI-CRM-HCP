import os
import sys

# This magic line ensures Python can find the 'app' folder from the terminal
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import engine, Base, SessionLocal
from app.models import HCP

def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    if db.query(HCP).first() is None:
        print("Seeding dummy HCP data...")
        dummy_hcps = [
            HCP(name="Dr. Smith", specialization="Cardiology", hospital="City General"),
            HCP(name="Dr. John", specialization="Neurology", hospital="Metro Health"),
            HCP(name="Dr. Emily Chen", specialization="Endocrinology", hospital="Westside Clinic")
        ]
        db.add_all(dummy_hcps)
        db.commit()
        print("Successfully seeded 3 HCPs.")
    else:
        print("Database already contains data. Skipping seed.")
        
    db.close()
    print("Database initialization complete.")

if __name__ == "__main__":
    init_db()
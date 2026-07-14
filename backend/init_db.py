import os
import sys

# This magic line ensures Python can find the 'app' folder from the terminal
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import engine, Base, SessionLocal
from app.models import HCP, Product  # <-- Imported Product here

def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # --- SEED HCP DATA ---
    if db.query(HCP).first() is None:
        print("Seeding dummy HCP data...")
        dummy_hcps = [
            HCP(name="Smith", profession="Doctor", specialization="Cardiology", hospital="City General"),
            HCP(name="John", profession="Doctor", specialization="Neurology", hospital="Metro Health"),
            HCP(name="Emily Chen", profession="Doctor", specialization="Endocrinology", hospital="Westside Clinic")
        ]
        db.add_all(dummy_hcps)
        db.commit()
        print("Successfully seeded HCPs.")
    else:
        print("HCP data already exists. Skipping HCP seed.")
        
    # --- SEED PRODUCT DATA ---
    if db.query(Product).first() is None:
        print("Seeding dummy Product data...")
        dummy_products = [
            Product(
                name="Product X",
                details="A next-generation beta-blocker designed for sustained release.",
                indications="Hypertension, Angina pectoris.",
                benefits="Reduces heart rate effectively with minimal side effects. 24-hour coverage.",
                dosage="50mg once daily in the morning.",
                clinical_evidence="Phase 3 trials showed a 22% greater reduction in systolic BP compared to standard care."
            ),
            Product(
                name="Product Y",
                details="An advanced statin therapy for lipid management.",
                indications="Hypercholesterolemia, prevention of cardiovascular disease.",
                benefits="Lowers LDL-C by up to 55%. High tolerability in elderly patients.",
                dosage="20mg taken in the evening.",
                clinical_evidence="The LUSTER trial demonstrated a 30% reduction in major adverse cardiovascular events over 5 years."
            ),
            Product(
                name="Sample C",
                details="Topical anti-inflammatory cream.",
                indications="Mild to moderate osteoarthritis.",
                benefits="Fast acting localized pain relief without systemic side effects.",
                dosage="Apply a thin layer to affected area 3-4 times daily.",
                clinical_evidence="Proven superior to placebo in reducing joint stiffness within 7 days."
            )
        ]
        db.add_all(dummy_products)
        db.commit()
        print("Successfully seeded Products.")
    else:
        print("Product data already exists. Skipping Product seed.")
        
    db.close()
    print("Database initialization complete.")

if __name__ == "__main__":
    init_db()
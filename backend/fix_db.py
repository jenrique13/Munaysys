from app.database import engine, SessionLocal
from sqlalchemy import text
from app import models

# Add missing branch_id to expenses in a way that handles if it already exists
with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE expenses ADD COLUMN branch_id INTEGER REFERENCES branches(id) DEFAULT 1;"))
    except Exception as e:
        print("Column may already exist:", e)

# Now, clone the products, services and consumables from branch 1 to branch 2 and 3
db = SessionLocal()

for target_branch_id in [2, 3]:
    # Products
    for p in db.query(models.Product).filter(models.Product.branch_id == 1).all():
        if not db.query(models.Product).filter(models.Product.branch_id == target_branch_id, models.Product.name == p.name).first():
            new_p = models.Product(
                name=p.name, description=p.description, price=p.price, stock=p.stock,
                is_active=p.is_active, branch_id=target_branch_id
            )
            db.add(new_p)

    # Services
    for s in db.query(models.Service).filter(models.Service.branch_id == 1).all():
        if not db.query(models.Service).filter(models.Service.branch_id == target_branch_id, models.Service.name == s.name).first():
            new_s = models.Service(
                name=s.name, description=s.description, price=s.price, is_active=s.is_active,
                is_amenity=s.is_amenity, branch_id=target_branch_id
            )
            db.add(new_s)

    # Consumables
    for c in db.query(models.Consumable).filter(models.Consumable.branch_id == 1).all():
        if not db.query(models.Consumable).filter(models.Consumable.branch_id == target_branch_id, models.Consumable.name == c.name).first():
            new_c = models.Consumable(
                name=c.name, description=c.description, cost=c.cost, stock=c.stock,
                unit=c.unit, is_active=c.is_active, branch_id=target_branch_id
            )
            db.add(new_c)

try:
    db.commit()
    print("Successfully cloned products, services, consumables and added branch_id to expenses.")
except Exception as e:
    db.rollback()
    print("Error:", e)
finally:
    db.close()

from app.database import SessionLocal
from app.models import User, Branch, Client, Service, Product, SpaceCategory, Room, Role, Provider, CashCategory
from app.core.security import get_password_hash

def seed_data():
    db = SessionLocal()
    
    # 1. Create or Update Super Admin
    admin_email = "admin3@munaysys.com"
    admin_pwd = "C4r4c4s2026**"
    
    admin_user = db.query(User).filter(User.email == admin_email).first()
    if admin_user:
        admin_user.password_hash = get_password_hash(admin_pwd)
        admin_user.is_superuser = True
        admin_user.access_permissions = {"crm": True, "operative": True, "financial": True, "configuration": True}
        print(f"Updated user {admin_email}")
    else:
        admin_user = User(
            email=admin_email,
            password_hash=get_password_hash(admin_pwd),
            is_active=True,
            is_superuser=True,
            access_permissions={"crm": True, "operative": True, "financial": True, "configuration": True}
        )
        db.add(admin_user)
        print(f"Created user {admin_email}")
        
    db.commit()

    # 2. Branch
    branch = db.query(Branch).first()
    if not branch:
        branch = Branch(name="Sede Principal", address="Av. Central 123", email="sede1@munaysys.com")
        db.add(branch)
        db.commit()
        db.refresh(branch)
        
    # 3. Roles
    role = db.query(Role).first()
    if not role:
        role = Role(name="Administrador", permissions_json={"all": True})
        db.add(role)
        db.commit()

    # 4. CashCategories
    cash_categories = ["Ingresos Operativos", "Gastos Administrativos", "Mantenimiento"]
    for cat_name in cash_categories:
        if not db.query(CashCategory).filter_by(name=cat_name).first():
            db.add(CashCategory(name=cat_name, type="IN" if "Ingreso" in cat_name else "OUT"))
    db.commit()
        
    # 5. Clients
    client_names = [
        ("Juan Perez", "juan.perez@example.com", "V-12345678"),
        ("Maria Gomez", "maria.gomez@example.com", "V-87654321"),
        ("Corporacion ABC", "contacto@abc.com", "J-300000001"),
        ("StartUp XYZ", "hello@startupxyz.com", "J-400000002")
    ]
    
    for name, email, doc in client_names:
        if not db.query(Client).filter_by(email=email).first():
            db.add(Client(name=name, email=email, phone="0414-0000000", ci_rif=doc, branch_id=branch.id))
            
    db.commit()

    # 6. Providers
    provider_names = ["Distribuidora Papelera CA", "Servicios de Limpieza XYZ", "Internet Provider SA"]
    for p_name in provider_names:
        if not db.query(Provider).filter_by(name=p_name).first():
            db.add(Provider(name=p_name, email=f"{p_name.replace(' ', '').lower()}@example.com", phone="0212-0000000"))
    db.commit()
            
    # 7. Services & Products
    services = [
        ("Membresia Coworking", 50.0, "Suscripcion mensual a area compartida"),
        ("Alquiler Sala de Juntas", 15.0, "Precio por hora"),
        ("Oficina Privada", 300.0, "Alquiler mensual oficina privada")
    ]
    for name, price, desc in services:
        if not db.query(Service).filter_by(name=name).first():
            db.add(Service(name=name, price=price, description=desc, branch_id=branch.id))
            
    products = [
        ("Cafe", 2.0, "Taza de cafe", 100),
        ("Impresion B/N", 0.5, "Hoja carta", 5000),
        ("Snack", 3.0, "Snack variado", 50)
    ]
    for name, price, desc, stock in products:
        if not db.query(Product).filter_by(name=name).first():
            db.add(Product(name=name, price=price, description=desc, branch_id=branch.id, stock=stock))
            
    db.commit()

    # 8. Rooms
    if not db.query(Room).filter_by(name="Sala A").first():
        db.add(Room(name="Sala A", type="Sala de Juntas", branch_id=branch.id, capacity=6, hourly_rate=15.0, status="available"))
        db.add(Room(name="Sala B", type="Sala de Juntas", branch_id=branch.id, capacity=10, hourly_rate=25.0, status="available"))
        db.add(Room(name="Oficina 1", type="Oficina Privada", branch_id=branch.id, capacity=3, hourly_rate=10.0, status="available"))

    db.commit()
    print("Database seeded with random data successfully!")

if __name__ == "__main__":
    seed_data()

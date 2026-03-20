import sys, os
sys.path.append(os.getcwd())
from app.database import SessionLocal
from app.models import Client, User, Branch

db = SessionLocal()
print('--- USERS ---')
for u in db.query(User).all():
    print(f'User: {u.email}, Role ID: {u.role_id}, Branch ID: {u.branch_id}')

print('\n--- CLIENTS ---')
for c in db.query(Client).all():
    print(f'Client: {c.name}, Branch ID: {c.branch_id}')

print('\n--- BRANCHES ---')
for b in db.query(Branch).all():
    print(f'Branch: {b.name}, ID: {b.id}')

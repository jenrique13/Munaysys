from sqlalchemy import create_engine, text

engine = create_engine('postgresql+psycopg://postgres:postgres@localhost:5432/munaysys_dev')

with engine.connect() as conn:
    try:
        conn.execute(text('ALTER TABLE consumables DROP COLUMN IF EXISTS category;'))
        print("Dropped category column.")
    except Exception as e:
        print("Error dropping:", e)
    
    try:
        conn.execute(text('ALTER TABLE consumables ADD COLUMN category_id INTEGER REFERENCES consumable_categories(id);'))
        print("Added category_id column.")
    except Exception as e:
        print("Error adding:", e)

    conn.commit()
    print("Migration successful.")

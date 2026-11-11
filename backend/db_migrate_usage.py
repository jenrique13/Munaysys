from sqlalchemy import create_engine, text

engine = create_engine('postgresql+psycopg://postgres:postgres@localhost:5432/munaysys_dev')

with engine.connect() as conn:
    try:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS consumable_usage (
                id SERIAL PRIMARY KEY,
                consumable_id INTEGER NOT NULL REFERENCES consumables(id),
                quantity INTEGER NOT NULL,
                reason VARCHAR,
                user_email VARCHAR,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                branch_id INTEGER NOT NULL REFERENCES branches(id)
            );
            CREATE INDEX IF NOT EXISTS ix_consumable_usage_id ON consumable_usage (id);
        """))
        conn.commit()
    except Exception as e:
        print("Error:", e)
        conn.rollback()

print("Created consumable_usage table.")

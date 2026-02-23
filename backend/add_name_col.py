from sqlalchemy import text
from app.db.session import engine

def add_name_column():
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN name VARCHAR;"))
            conn.commit()
            print("Column added successfully.")
    except Exception as e:
        print("Error or already exists:", e)

if __name__ == "__main__":
    add_name_column()

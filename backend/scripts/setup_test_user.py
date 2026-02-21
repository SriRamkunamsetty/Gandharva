from app.db.session import SessionLocal, engine
from app.models.domain import User, Base
from app.core import security
from app.core.config import settings
from datetime import timedelta

def create_test_user():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    email = "test@example.com"
    password = "testpassword"
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        hashed_password = security.get_password_hash(password)
        user = User(email=email, hashed_password=hashed_password)
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Created test user: {email}")
    else:
        print(f"User {email} already exists")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = security.create_access_token(user.id, expires_delta=access_token_expires)
    print(f"TOKEN:{token}")
    with open("scripts/token.txt", "w") as f:
        f.write(token)
    db.close()

if __name__ == "__main__":
    create_test_user()

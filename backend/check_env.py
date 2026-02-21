import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ENV_CHECK")

def check_imports():
    modules = ["fastapi", "librosa", "numpy", "scipy", "celery", "sqlalchemy"]
    for mod in modules:
        try:
            __import__(mod)
            logger.info(f"✅ {mod} is available.")
        except ImportError:
            logger.error(f"❌ {mod} is NOT available.")

    try:
        import basic_pitch
        logger.info("✅ basic-pitch is available.")
    except ImportError:
        logger.warning("⚠️ basic-pitch is NOT available (TensorFlow likely missing on Python 3.14).")

if __name__ == "__main__":
    logger.info(f"Python Version: {sys.version}")
    check_imports()

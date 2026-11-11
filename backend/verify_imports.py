import sys
import os

# Add the current directory to sys.path to allow importing 'app'
sys.path.append(os.getcwd())

try:
    from app.main import app
    print("SUCCESS: App imported successfully.")
except ImportError as e:
    print(f"IMPORT ERROR: {str(e)}")
    sys.exit(1)
except Exception as e:
    print(f"CRITICAL ERROR during import: {str(e)}")
    sys.exit(1)

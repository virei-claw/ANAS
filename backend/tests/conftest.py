import pytest
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

# Import all models to ensure Base.metadata has all tables registered
from app.models import *  # noqa: F401, F403

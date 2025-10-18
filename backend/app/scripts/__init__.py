"""
Scripts package for initialization and setup utilities.

This package contains:
- init_data: Database initialization with default data
- pre_start: Database connectivity check for application startup
- test_pre_start: Database connectivity check for test runs
"""

# Import all scripts for easy access
from .init_data import init as init_data
from .init_data import main as init_data_main
from .pre_start import init as pre_start_init
from .pre_start import main as pre_start_main
from .test_pre_start import init as test_pre_start_init
from .test_pre_start import main as test_pre_start_main

# Export all scripts
__all__ = [
    # Data initialization
    "init_data",
    "init_data_main",
    # Pre-start checks
    "pre_start_init",
    "pre_start_main",
    # Test pre-start checks
    "test_pre_start_init",
    "test_pre_start_main",
]

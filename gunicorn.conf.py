"""Gunicorn configuration file for the Hex Game application"""

# Bind to this socket
bind = "0.0.0.0:8000"

# Worker configuration
workers = 1  # Must be 1 for WebSocket to work properly with eventlet
worker_class = "eventlet"  # Use eventlet worker for WebSocket support

# Process naming
proc_name = "hex_game"

# Logging
accesslog = "-"  # Log to stdout
errorlog = "-"   # Log to stderr
loglevel = "info"

# Timeout configuration
timeout = 120  # 2 minutes
keepalive = 5   # 5 seconds
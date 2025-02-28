#!/usr/bin/env python
from app import app, socketio

if __name__ == '__main__':
    # Use host='0.0.0.0' to make the server accessible from other devices
    # on the network using the Raspberry Pi's IP address
    socketio.run(app, host='0.0.0.0', debug=True)
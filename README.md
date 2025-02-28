# Hex Game - Collaborative Hexagonal Game Board

A real-time collaborative application featuring a hexagonal game board where multiple users can interact with draggable tokens and chat in real-time.

## Features

- Hexagonal grid game board
- Drag-and-drop token movement
- Real-time multiplayer interaction
- Chat functionality
- Room-based gameplay
- Built with Flask, SocketIO, and Gunicorn

## Project Structure

```
hex_game/
├── app.py             # Main Flask application
├── config.py          # Configuration settings
├── requirements.txt   # Project dependencies
├── run.py             # Application entry point
├── gunicorn.conf.py   # Gunicorn configuration
├── static/            # Static files
│   ├── css/
│   │   ├── main.css
│   │   └── game.css
│   ├── js/
│   │   ├── board.js   # Hexagonal grid handling
│   │   ├── socket.js  # Socket.IO client-side handling
│   │   ├── game.js    # Game logic
│   │   └── chat.js    # Chat functionality
│   └── images/
├── templates/         # Jinja2 templates
│   ├── base.html      # Base template
│   ├── index.html     # Landing page
│   └── game.html      # Game room
└── utils/             # Utility functions
    ├── __init__.py
    ├── game_state.py  # Game state management
    └── room.py        # Room management
```

## Prerequisites

- Python 3.7+
- pip

## Installation

1. Clone the repository (or create the files as shown in the project structure)

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

### Development Mode

To run the application in development mode:

```bash
python run.py
```

The application will be available at http://127.0.0.1:5000/

### Production Mode with Gunicorn

To run the application in production mode with Gunicorn:

```bash
gunicorn --config gunicorn.conf.py --worker-class eventlet -w 1 'app:app'
```

The application will be available at http://0.0.0.0:8000/

## How to Use

1. **Creating a Game Room**:
   - Visit the homepage
   - Enter your name and click "Create Game"
   - Share the room code with others

2. **Joining a Game Room**:
   - Visit the homepage
   - Enter your name and the room code
   - Click "Join Game"

3. **Game Board Interaction**:
   - Click "Add Token" to place a token on the board
   - Drag tokens to move them
   - All changes are synchronized in real-time with other users

4. **Chat**:
   - Type a message in the chat box
   - Press Enter or click "Send" to share it with others in the room

## License

This project is open-source and available under the MIT License.

## Acknowledgements

- [Flask](https://flask.palletsprojects.com/)
- [Flask-SocketIO](https://flask-socketio.readthedocs.io/)
- [Gunicorn](https://gunicorn.org/)
- [Eventlet](https://eventlet.net/)
- [interact.js](https://interactjs.io/)
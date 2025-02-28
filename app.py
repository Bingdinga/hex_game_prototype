from flask import Flask, render_template, request, session, redirect, url_for, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
import os
import uuid
import logging
from datetime import datetime
from utils.room import Room
from utils.game_state import GameState

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_key_for_prototype')

# Initialize Socket.IO with CORS allowed for any origin
socketio = SocketIO(app, cors_allowed_origins="*")

# In-memory storage for rooms and game states
rooms = {}  # room_id -> Room
game_states = {}  # room_id -> GameState

@app.route('/')
def index():
    """Render the homepage for creating/joining a game"""
    return render_template('index.html')

@app.route('/create_room', methods=['POST'])
def create_room():
    """Create a new game room"""
    username = request.form.get('username', '').strip()
    if not username:
        return redirect(url_for('index'))
    
    room_id = str(uuid.uuid4())[:8]  # Generate a short unique room ID
    logger.info(f"Creating room {room_id} for user {username}")
    
    rooms[room_id] = Room(room_id, creator=username)
    game_states[room_id] = GameState(room_id)
    
    session['username'] = username
    session['room_id'] = room_id
    
    return redirect(url_for('game', room_id=room_id))

@app.route('/join_room', methods=['POST'])
def join_existing_room():
    """Join an existing game room"""
    username = request.form.get('username', '').strip()
    room_id = request.form.get('room_id', '').strip()
    
    if not username or not room_id:
        return redirect(url_for('index'))
    
    if room_id not in rooms:
        logger.warning(f"Attempt to join non-existent room: {room_id}")
        return redirect(url_for('index'))
    
    logger.info(f"User {username} joining room {room_id}")
    session['username'] = username
    session['room_id'] = room_id
    
    return redirect(url_for('game', room_id=room_id))

@app.route('/game/<room_id>')
def game(room_id):
    """Render the game page for a specific room"""
    if 'username' not in session:
        logger.warning(f"Attempt to access room {room_id} without a username")
        return redirect(url_for('index'))
    
    if room_id not in rooms:
        logger.warning(f"Attempt to access non-existent room: {room_id}")
        return redirect(url_for('index'))
    
    return render_template('game.html', 
                           username=session['username'], 
                           room_id=room_id,
                           room=rooms[room_id])

@app.route('/status')
def status():
    """Return the current status of all rooms (for debugging)"""
    if not app.debug:
        return jsonify({"error": "Status endpoint only available in debug mode"})
    
    return jsonify({
        "rooms": {room_id: {"users": room.get_users(), "created_at": room.created_at} 
                 for room_id, room in rooms.items()},
        "game_states": {room_id: state.get_state() for room_id, state in game_states.items()}
    })

# Socket.IO event handlers
@socketio.on('connect')
def handle_connect():
    """Handle client connection to Socket.IO"""
    logger.info(f"Client connected: {request.sid}")
    
    if 'username' in session and 'room_id' in session:
        room_id = session['room_id']
        username = session['username']
        
        if room_id in rooms:
            logger.info(f"User {username} joining room {room_id}")
            join_room(room_id)
            rooms[room_id].add_user(username)
            
            # Notify room about new user
            emit('update_users', rooms[room_id].get_users(), to=room_id)
            
            # Send current game state to the new user
            emit('game_state_update', game_states[room_id].get_state())
            
            # Send welcome message
            timestamp = datetime.now().strftime("%H:%M:%S")
            emit('chat_message', {
                'username': 'System',
                'message': f'{username} has joined the room',
                'timestamp': timestamp
            }, to=room_id)

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection from Socket.IO"""
    logger.info(f"Client disconnected: {request.sid}")
    
    if 'username' in session and 'room_id' in session:
        room_id = session['room_id']
        username = session['username']
        
        if room_id in rooms:
            logger.info(f"User {username} leaving room {room_id}")
            rooms[room_id].remove_user(username)
            leave_room(room_id)
            
            # Notify room about user leaving
            emit('update_users', rooms[room_id].get_users(), to=room_id)
            
            # Send leave message
            timestamp = datetime.now().strftime("%H:%M:%S")
            emit('chat_message', {
                'username': 'System',
                'message': f'{username} has left the room',
                'timestamp': timestamp
            }, to=room_id)
            
            # If room is empty, clean up after a while
            if not rooms[room_id].get_users():
                logger.info(f"Room {room_id} is empty, scheduling cleanup")
                # In a real app, you'd schedule deletion after some time
                # For now, we'll keep it for ease of testing

@socketio.on('chat_message')
def handle_chat_message(data):
    """Handle chat messages from clients"""
    room_id = session.get('room_id')
    username = session.get('username')
    message = data.get('message', '').strip()
    
    if room_id and username and message and room_id in rooms:
        logger.info(f"Chat message in room {room_id} from {username}: {message[:50]}...")
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        emit('chat_message', {
            'username': username,
            'message': message,
            'timestamp': timestamp
        }, to=room_id)

@socketio.on('move_token')
def handle_move_token(data):
    """Handle token movement events"""
    room_id = session.get('room_id')
    username = session.get('username')
    token_id = data.get('token_id')
    position = data.get('position')
    
    if not room_id or not username or token_id is None or not position:
        logger.warning(f"Invalid move_token request: {data}")
        return
    
    if room_id not in game_states:
        logger.warning(f"Attempt to move token in non-existent room: {room_id}")
        return
    
    # Validate position
    try:
        col = int(position.get('col', 0))
        row = int(position.get('row', 0))
        
        # Make sure coordinates are within board limits
        board_size = game_states[room_id].board_size
        if not (0 <= col < board_size['cols'] and 0 <= row < board_size['rows']):
            logger.warning(f"Invalid position for token: {position}")
            return
        
        position = {'col': col, 'row': row}
    except (ValueError, TypeError, AttributeError) as e:
        logger.warning(f"Position validation error: {e}")
        return
    
    logger.info(f"Moving token {token_id} to {position} in room {room_id} by {username}")
    
    if game_states[room_id].move_token(token_id, position):
        emit('token_moved', {
            'token_id': token_id,
            'position': position,
            'moved_by': username
        }, to=room_id)

@socketio.on('add_token')
def handle_add_token(data):
    """Handle adding new tokens to the board"""
    room_id = session.get('room_id')
    username = session.get('username')
    token_type = data.get('token_type', 'default')
    position = data.get('position')
    
    if not room_id or not username or not position:
        logger.warning(f"Invalid add_token request: {data}")
        return
    
    if room_id not in game_states:
        logger.warning(f"Attempt to add token to non-existent room: {room_id}")
        return
    
    # Validate position
    try:
        col = int(position.get('col', 0))
        row = int(position.get('row', 0))
        
        # Make sure coordinates are within board limits
        board_size = game_states[room_id].board_size
        if not (0 <= col < board_size['cols'] and 0 <= row < board_size['rows']):
            logger.warning(f"Invalid position for new token: {position}")
            return
        
        position = {'col': col, 'row': row}
    except (ValueError, TypeError, AttributeError) as e:
        logger.warning(f"Position validation error: {e}")
        return
    
    logger.info(f"Adding token of type {token_type} at {position} in room {room_id}")
    
    token_id = game_states[room_id].add_token(token_type, position)
    emit('token_added', {
        'token_id': token_id,
        'token_type': token_type,
        'position': position,
        'added_by': username
    }, to=room_id)

@socketio.on('remove_token')
def handle_remove_token(data):
    """Handle removing tokens from the board"""
    room_id = session.get('room_id')
    username = session.get('username')
    token_id = data.get('token_id')
    
    if not room_id or not username or token_id is None:
        logger.warning(f"Invalid remove_token request: {data}")
        return
    
    if room_id not in game_states:
        logger.warning(f"Attempt to remove token from non-existent room: {room_id}")
        return
    
    logger.info(f"Removing token {token_id} from room {room_id}")
    
    if game_states[room_id].remove_token(token_id):
        emit('token_removed', {
            'token_id': token_id,
            'removed_by': username
        }, to=room_id)

if __name__ == '__main__':
    socketio.run(app, debug=True)
from flask import Flask, render_template, request, session, redirect, url_for
from flask_socketio import SocketIO, emit, join_room, leave_room
import os
import uuid
from utils.room import Room
from utils.game_state import GameState

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_key_for_prototype')

# Initialize Socket.IO
socketio = SocketIO(app, cors_allowed_origins="*")

# In-memory storage for rooms and game states
rooms = {}  # room_id -> Room
game_states = {}  # room_id -> GameState

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/create_room', methods=['POST'])
def create_room():
    username = request.form.get('username', '')
    if not username:
        return redirect(url_for('index'))
    
    room_id = str(uuid.uuid4())[:8]  # Generate a short unique room ID
    rooms[room_id] = Room(room_id, creator=username)
    game_states[room_id] = GameState(room_id)
    
    session['username'] = username
    session['room_id'] = room_id
    
    return redirect(url_for('game', room_id=room_id))

@app.route('/join_room', methods=['POST'])
def join_existing_room():
    username = request.form.get('username', '')
    room_id = request.form.get('room_id', '')
    
    if not username or not room_id or room_id not in rooms:
        return redirect(url_for('index'))
    
    session['username'] = username
    session['room_id'] = room_id
    
    return redirect(url_for('game', room_id=room_id))

@app.route('/game/<room_id>')
def game(room_id):
    if 'username' not in session or room_id not in rooms:
        return redirect(url_for('index'))
    
    return render_template('game.html', 
                          username=session['username'], 
                          room_id=room_id,
                          room=rooms[room_id])

# Socket.IO event handlers
@socketio.on('connect')
def handle_connect():
    if 'username' in session and 'room_id' in session:
        room_id = session['room_id']
        if room_id in rooms:
            join_room(room_id)
            rooms[room_id].add_user(session['username'])
            emit('update_users', rooms[room_id].get_users(), to=room_id)
            emit('game_state_update', game_states[room_id].get_state(), to=room_id)

@socketio.on('disconnect')
def handle_disconnect():
    if 'username' in session and 'room_id' in session:
        room_id = session['room_id']
        if room_id in rooms:
            rooms[room_id].remove_user(session['username'])
            leave_room(room_id)
            emit('update_users', rooms[room_id].get_users(), to=room_id)
            
            # If room is empty, clean up
            if not rooms[room_id].get_users():
                del rooms[room_id]
                del game_states[room_id]

@socketio.on('chat_message')
def handle_chat_message(data):
    room_id = session.get('room_id')
    username = session.get('username')
    message = data.get('message', '')
    
    if room_id and username and message and room_id in rooms:
        emit('chat_message', {
            'username': username,
            'message': message,
            'timestamp': rooms[room_id].get_timestamp()
        }, to=room_id)

@socketio.on('move_token')
def handle_move_token(data):
    room_id = session.get('room_id')
    username = session.get('username')
    token_id = data.get('token_id')
    position = data.get('position')
    
    if room_id and username and token_id is not None and position and room_id in game_states:
        game_states[room_id].move_token(token_id, position)
        emit('token_moved', {
            'token_id': token_id,
            'position': position,
            'moved_by': username
        }, to=room_id)

@socketio.on('add_token')
def handle_add_token(data):
    room_id = session.get('room_id')
    username = session.get('username')
    token_type = data.get('token_type', 'default')
    position = data.get('position')
    
    if room_id and username and position and room_id in game_states:
        token_id = game_states[room_id].add_token(token_type, position)
        emit('token_added', {
            'token_id': token_id,
            'token_type': token_type,
            'position': position,
            'added_by': username
        }, to=room_id)

@socketio.on('remove_token')
def handle_remove_token(data):
    room_id = session.get('room_id')
    username = session.get('username')
    token_id = data.get('token_id')
    
    if room_id and username and token_id is not None and room_id in game_states:
        game_states[room_id].remove_token(token_id)
        emit('token_removed', {
            'token_id': token_id,
            'removed_by': username
        }, to=room_id)

if __name__ == '__main__':
    socketio.run(app, debug=True)
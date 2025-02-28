import uuid

class GameState:
    def __init__(self, room_id):
        self.room_id = room_id
        self.tokens = {}  # token_id -> {type, position}
        self.board_size = {
            'cols': 10,  # Number of hexagon columns
            'rows': 10   # Number of hexagon rows
        }
        
    def add_token(self, token_type, position):
        """Add a token to the game state and return its ID"""
        token_id = str(uuid.uuid4())
        self.tokens[token_id] = {
            'type': token_type,
            'position': position
        }
        return token_id
    
    def move_token(self, token_id, new_position):
        """Update the position of an existing token"""
        if token_id in self.tokens:
            self.tokens[token_id]['position'] = new_position
            return True
        return False
    
    def remove_token(self, token_id):
        """Remove a token from the game state"""
        if token_id in self.tokens:
            del self.tokens[token_id]
            return True
        return False
    
    def get_state(self):
        """Return the current game state"""
        return {
            'tokens': self.tokens,
            'board_size': self.board_size
        }
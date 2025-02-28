import uuid
import logging

logger = logging.getLogger(__name__)

class GameState:
    def __init__(self, room_id, cols=10, rows=10):
        self.room_id = room_id
        self.tokens = {}  # token_id -> {type, position}
        self.board_size = {
            'cols': cols,  # Number of hexagon columns
            'rows': rows   # Number of hexagon rows
        }
        logger.info(f"Created new game state for room {room_id} with {cols}x{rows} board")
        
    def add_token(self, token_type, position):
        """
        Add a token to the game state and return its ID
        
        Args:
            token_type (str): Type of token to add ('red', 'blue', etc.)
            position (dict): Position on the board with col and row keys
            
        Returns:
            str: The ID of the newly added token
        """
        # Validate position
        if not self._is_valid_position(position):
            logger.warning(f"Invalid position for new token: {position}")
            return None
            
        # Check if there's already a token at this position
        for existing_id, token_data in self.tokens.items():
            if (token_data['position']['col'] == position['col'] and 
                token_data['position']['row'] == position['row']):
                # There's already a token here, so remove it first
                logger.info(f"Replacing token at position {position}")
                self.remove_token(existing_id)
                break
        
        # Generate a unique ID for the token
        token_id = str(uuid.uuid4())
        
        # Add the token to the game state
        self.tokens[token_id] = {
            'type': token_type,
            'position': position
        }
        
        logger.info(f"Added token {token_id} of type {token_type} at position {position}")
        return token_id
    
    def move_token(self, token_id, new_position):
        """
        Update the position of an existing token
        
        Args:
            token_id (str): ID of the token to move
            new_position (dict): New position with col and row keys
            
        Returns:
            bool: Whether the move was successful
        """
        # Validate token_id
        if token_id not in self.tokens:
            logger.warning(f"Attempted to move non-existent token: {token_id}")
            return False
            
        # Validate position
        if not self._is_valid_position(new_position):
            logger.warning(f"Invalid new position for token {token_id}: {new_position}")
            return False
            
        # Check if there's already a token at the new position
        for existing_id, token_data in self.tokens.items():
            if (existing_id != token_id and
                token_data['position']['col'] == new_position['col'] and 
                token_data['position']['row'] == new_position['row']):
                # There's already a different token here, so remove it
                logger.info(f"Removing token {existing_id} at position {new_position} to make way for {token_id}")
                self.remove_token(existing_id)
                break
        
        # Update the token's position
        old_position = self.tokens[token_id]['position']
        self.tokens[token_id]['position'] = new_position
        
        logger.info(f"Moved token {token_id} from {old_position} to {new_position}")
        return True
    
    def remove_token(self, token_id):
        """
        Remove a token from the game state
        
        Args:
            token_id (str): ID of the token to remove
            
        Returns:
            bool: Whether the removal was successful
        """
        if token_id in self.tokens:
            position = self.tokens[token_id]['position']
            del self.tokens[token_id]
            logger.info(f"Removed token {token_id} from position {position}")
            return True
        
        logger.warning(f"Attempted to remove non-existent token: {token_id}")
        return False
    
    def get_state(self):
        """
        Return the current game state
        
        Returns:
            dict: The complete game state
        """
        return {
            'tokens': self.tokens,
            'board_size': self.board_size
        }
    
    def _is_valid_position(self, position):
        """
        Check if a position is valid for the current board
        
        Args:
            position (dict): Position to check with col and row keys
            
        Returns:
            bool: Whether the position is valid
        """
        try:
            col = int(position.get('col', -1))
            row = int(position.get('row', -1))
            
            return (0 <= col < self.board_size['cols'] and 
                   0 <= row < self.board_size['rows'])
        except (ValueError, TypeError):
            return False
import time
from datetime import datetime

class Room:
    def __init__(self, room_id, creator=None):
        self.room_id = room_id
        self.creator = creator
        self.users = []
        if creator:
            self.users.append(creator)
        self.created_at = time.time()
        
    def add_user(self, username):
        if username not in self.users:
            self.users.append(username)
    
    def remove_user(self, username):
        if username in self.users:
            self.users.remove(username)
    
    def get_users(self):
        return self.users
    
    def get_timestamp(self):
        return datetime.now().strftime("%H:%M:%S")
    
    def is_empty(self):
        return len(self.users) == 0
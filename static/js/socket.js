/**
 * Socket.IO connection manager
 */
class SocketManager {
    constructor(roomId, username) {
        this.socket = io();
        this.roomId = roomId;
        this.username = username;
        this.eventCallbacks = {};
        
        this.init();
    }
    
    init() {
        // Setup default socket event handlers
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });
        
        this.socket.on('update_users', (users) => {
            this.triggerEvent('updateUsers', users);
        });
        
        this.socket.on('chat_message', (message) => {
            this.triggerEvent('chatMessage', message);
        });
        
        this.socket.on('game_state_update', (state) => {
            this.triggerEvent('gameStateUpdate', state);
        });
        
        this.socket.on('token_moved', (data) => {
            this.triggerEvent('tokenMoved', data);
        });
        
        this.socket.on('token_added', (data) => {
            this.triggerEvent('tokenAdded', data);
        });
        
        this.socket.on('token_removed', (data) => {
            this.triggerEvent('tokenRemoved', data);
        });
    }
    
    // Register event callbacks
    on(event, callback) {
        if (!this.eventCallbacks[event]) {
            this.eventCallbacks[event] = [];
        }
        this.eventCallbacks[event].push(callback);
    }
    
    // Trigger registered callbacks for an event
    triggerEvent(event, data) {
        if (this.eventCallbacks[event]) {
            this.eventCallbacks[event].forEach(callback => callback(data));
        }
    }
    
    // Send chat message
    sendChatMessage(message) {
        this.socket.emit('chat_message', { message });
    }
    
    // Send token move
    moveToken(tokenId, position) {
        this.socket.emit('move_token', { token_id: tokenId, position });
    }
    
    // Add new token
    addToken(tokenType, position) {
        this.socket.emit('add_token', { token_type: tokenType, position });
    }
    
    // Remove a token
    removeToken(tokenId) {
        this.socket.emit('remove_token', { token_id: tokenId });
    }
}
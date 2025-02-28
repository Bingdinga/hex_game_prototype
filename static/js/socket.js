/**
 * Socket.IO connection manager with improved debugging
 */
class SocketManager {
    constructor(roomId, username) {
        this.socket = io();
        this.roomId = roomId;
        this.username = username;
        this.eventCallbacks = {};
        this.debug = true; // Set to true for console logging
        
        this.init();
    }
    
    log(...args) {
        if (this.debug) {
            console.log('[SocketManager]', ...args);
        }
    }
    
    init() {
        this.log('Initializing socket connection');
        
        // Setup default socket event handlers
        this.socket.on('connect', () => {
            this.log('Connected to server');
        });
        
        this.socket.on('disconnect', () => {
            this.log('Disconnected from server');
        });
        
        this.socket.on('connect_error', (error) => {
            this.log('Connection error:', error);
        });
        
        this.socket.on('update_users', (users) => {
            this.log('Received update_users event:', users);
            this.triggerEvent('updateUsers', users);
        });
        
        this.socket.on('chat_message', (message) => {
            this.log('Received chat_message event:', message);
            this.triggerEvent('chatMessage', message);
        });
        
        this.socket.on('game_state_update', (state) => {
            this.log('Received game_state_update event:', state);
            this.triggerEvent('gameStateUpdate', state);
        });
        
        this.socket.on('token_moved', (data) => {
            this.log('Received token_moved event:', data);
            this.triggerEvent('tokenMoved', data);
        });
        
        this.socket.on('token_added', (data) => {
            this.log('Received token_added event:', data);
            this.triggerEvent('tokenAdded', data);
        });
        
        this.socket.on('token_removed', (data) => {
            this.log('Received token_removed event:', data);
            this.triggerEvent('tokenRemoved', data);
        });
    }
    
    // Register event callbacks
    on(event, callback) {
        this.log(`Registering callback for event: ${event}`);
        if (!this.eventCallbacks[event]) {
            this.eventCallbacks[event] = [];
        }
        this.eventCallbacks[event].push(callback);
    }
    
    // Trigger registered callbacks for an event
    triggerEvent(event, data) {
        this.log(`Triggering event: ${event}`, data);
        if (this.eventCallbacks[event]) {
            this.eventCallbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in callback for event ${event}:`, error);
                }
            });
        }
    }
    
    // Send chat message
    sendChatMessage(message) {
        this.log(`Sending chat message: ${message}`);
        this.socket.emit('chat_message', { message });
    }
    
    // Send token move
    moveToken(tokenId, position) {
        this.log(`Sending move_token: tokenId=${tokenId}, position=`, position);
        this.socket.emit('move_token', { token_id: tokenId, position });
    }
    
    // Add new token
    addToken(tokenType, position) {
        this.log(`Sending add_token: type=${tokenType}, position=`, position);
        this.socket.emit('add_token', { token_type: tokenType, position });
    }
    
    // Remove a token
    removeToken(tokenId) {
        this.log(`Sending remove_token: tokenId=${tokenId}`);
        this.socket.emit('remove_token', { token_id: tokenId });
    }
}
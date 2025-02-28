/**
 * Chat manager
 */
class ChatManager {
    constructor(socketManager, username) {
        this.socketManager = socketManager;
        this.username = username;
        this.chatContainer = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-message-btn');
        
        this.init();
    }
    
    init() {
        // Setup send button event listener
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Setup enter key to send message
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Setup socketManager event handler for incoming chat messages
        this.socketManager.on('chatMessage', (message) => this.displayMessage(message));
    }
    
    sendMessage() {
        const messageText = this.chatInput.value.trim();
        if (messageText) {
            this.socketManager.sendChatMessage(messageText);
            this.chatInput.value = '';
        }
    }
    
    displayMessage(message) {
        const isOwnMessage = message.username === this.username;
        
        // Create message container
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${isOwnMessage ? 'own' : 'other'}`;
        
        // Add username for other's messages
        if (!isOwnMessage) {
            const usernameElement = document.createElement('div');
            usernameElement.className = 'chat-user';
            usernameElement.textContent = message.username;
            messageElement.appendChild(usernameElement);
        }
        
        // Add message content
        const contentElement = document.createElement('div');
        contentElement.className = 'chat-content';
        contentElement.textContent = message.message;
        messageElement.appendChild(contentElement);
        
        // Add timestamp
        const timeElement = document.createElement('div');
        timeElement.className = 'chat-time';
        timeElement.textContent = message.timestamp;
        messageElement.appendChild(timeElement);
        
        // Add to chat container
        this.chatContainer.appendChild(messageElement);
        
        // Scroll to bottom
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get socketManager from GameManager instance
    const game = window.gameInstance;
    if (game && game.socketManager) {
        const chat = new ChatManager(game.socketManager, USERNAME);
    } else {
        // If GameManager is not available yet, create direct connection
        const socketManager = new SocketManager(ROOM_ID, USERNAME);
        const chat = new ChatManager(socketManager, USERNAME);
    }
});
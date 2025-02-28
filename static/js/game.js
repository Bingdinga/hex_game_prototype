/**
 * Game manager - coordinates board and socket interactions
 */
class GameManager {
    constructor(roomId, username) {
        this.roomId = roomId;
        this.username = username;
        this.tokens = new Map(); // Map of token_id -> token DOM element
        
        // Initialize board
        this.boardElement = document.getElementById('game-board');
        this.board = new HexBoard(this.boardElement);
        
        // Initialize socket connection
        this.socketManager = new SocketManager(roomId, username);
        
        // Token templates
        this.tokenTemplates = document.getElementById('token-templates');
        
        this.init();
    }
    
    init() {
        // Button event listeners
        document.getElementById('add-token-btn').addEventListener('click', () => this.startAddToken());
        document.getElementById('clear-board-btn').addEventListener('click', () => this.confirmClearBoard());
        
        // Override HexBoard click handler
        this.board.onHexClick = (hex, col, row, event) => {
            if (this.addingToken) {
                const position = { col, row };
                this.socketManager.addToken(this.addingTokenType, position);
                this.addingToken = false;
            }
        };
        
        // Setup Socket.IO event handlers
        this.socketManager.on('updateUsers', (users) => this.updateUsersList(users));
        this.socketManager.on('gameStateUpdate', (state) => this.updateGameState(state));
        this.socketManager.on('tokenAdded', (data) => this.handleTokenAdded(data));
        this.socketManager.on('tokenMoved', (data) => this.handleTokenMoved(data));
        this.socketManager.on('tokenRemoved', (data) => this.handleTokenRemoved(data));
        
        // Setup drag and drop for tokens
        this.setupDragAndDrop();
    }
    
    updateUsersList(users) {
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = '';
        
        users.forEach(user => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            
            if (user === this.username) {
                listItem.classList.add('active');
                listItem.textContent = `${user} (You)`;
            } else {
                listItem.textContent = user;
            }
            
            usersList.appendChild(listItem);
        });
    }
    
    updateGameState(state) {
        // Clear existing tokens
        this.tokens.forEach((token) => {
            token.remove();
        });
        this.tokens.clear();
        
        // Update board size if needed
        if (state.board_size) {
            this.board.cols = state.board_size.cols;
            this.board.rows = state.board_size.rows;
            this.board.init(); // Reinitialize board with new size
        }
        
        // Add tokens from game state
        if (state.tokens) {
            Object.entries(state.tokens).forEach(([tokenId, tokenData]) => {
                this.createToken(tokenId, tokenData.type, tokenData.position);
            });
        }
    }
    
    startAddToken() {
        // Show token selection or use default
        this.addingToken = true;
        this.addingTokenType = this.getRandomTokenType();
        alert(`Click on a hexagon to place a ${this.addingTokenType} token`);
    }
    
    getRandomTokenType() {
        const types = ['red', 'blue', 'green', 'yellow'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    createToken(tokenId, tokenType, position) {
        // Find the hex at the position
        const hex = this.board.getHexAt(position.col, position.row);
        if (!hex) return null;
        
        // Create token element
        const token = document.createElement('div');
        token.className = `token token-${tokenType}`;
        token.dataset.id = tokenId;
        token.dataset.type = tokenType;
        
        // Position the token at the center of the hex
        const hexCenter = this.board.getHexCenter(position.col, position.row);
        if (hexCenter) {
            token.style.left = `${hexCenter.x - 20}px`; // 20px is half of token width
            token.style.top = `${hexCenter.y - 20}px`; // 20px is half of token height
        }
        
        // Add to board and store reference
        this.boardElement.appendChild(token);
        this.tokens.set(tokenId, token);
        
        return token;
    }
    
    handleTokenAdded(data) {
        this.createToken(data.token_id, data.token_type, data.position);
    }
    
    handleTokenMoved(data) {
        const token = this.tokens.get(data.token_id);
        if (!token) return;
        
        const hexCenter = this.board.getHexCenter(data.position.col, data.position.row);
        if (!hexCenter) return;
        
        token.style.left = `${hexCenter.x - 20}px`;
        token.style.top = `${hexCenter.y - 20}px`;
    }
    
    handleTokenRemoved(data) {
        const token = this.tokens.get(data.token_id);
        if (!token) return;
        
        token.remove();
        this.tokens.delete(data.token_id);
    }
    
    confirmClearBoard() {
        if (confirm('Are you sure you want to clear the board? This will remove all tokens.')) {
            this.tokens.forEach((token, tokenId) => {
                this.socketManager.removeToken(tokenId);
            });
        }
    }
    
    setupDragAndDrop() {
        // Use interact.js for drag and drop
        interact('.token').draggable({
            inertia: true,
            modifiers: [
                interact.modifiers.restrictRect({
                    restriction: 'parent',
                    endOnly: true
                })
            ],
            autoScroll: true,
            
            listeners: {
                move: event => {
                    const target = event.target;
                    
                    // Keep track of the position in data attributes
                    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                    const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                    
                    // Update element's position
                    target.style.transform = `translate(${x}px, ${y}px)`;
                    
                    // Store the position
                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);
                },
                end: event => {
                    const target = event.target;
                    const tokenId = target.dataset.id;
                    
                    // Get the token's center position
                    const rect = target.getBoundingClientRect();
                    const tokenCenterX = rect.left + rect.width / 2;
                    const tokenCenterY = rect.top + rect.height / 2;
                    
                    // Convert to board-relative coordinates
                    const boardRect = this.boardElement.getBoundingClientRect();
                    const boardX = tokenCenterX - boardRect.left;
                    const boardY = tokenCenterY - boardRect.top;
                    
                    // Find the hex at this position
                    const hexCoord = this.board.pixelToHex(boardX, boardY);
                    
                    // Reset transform to avoid accumulation
                    target.style.transform = '';
                    target.removeAttribute('data-x');
                    target.removeAttribute('data-y');
                    
                    // Send the move to the server
                    this.socketManager.moveToken(tokenId, hexCoord);
                }
            }
        });
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // ROOM_ID and USERNAME are set in the template
    const game = new GameManager(ROOM_ID, USERNAME);
    
    // Make the game instance globally available for other components
    window.gameInstance = game;
});
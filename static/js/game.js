/**
 * Game manager - coordinates board and socket interactions
 * Fixed version with improved token movement
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
        
        // Debug mode
        this.debug = true; // Set to true to enable console logging
        
        this.init();
    }
    
    log(...args) {
        if (this.debug) {
            console.log(...args);
        }
    }
    
    init() {
        this.log('Initializing game manager');
        
        // Button event listeners
        document.getElementById('add-token-btn').addEventListener('click', () => {
            this.log('Add token button clicked');
            this.startAddToken();
        });
        
        document.getElementById('clear-board-btn').addEventListener('click', () => {
            this.log('Clear board button clicked');
            this.confirmClearBoard();
        });
        
        // Override HexBoard click handler
        this.board.onHexClick = (hex, col, row, event) => {
            this.log(`Hex clicked at ${col},${row}`);
            if (this.addingToken) {
                const position = { col, row };
                this.log(`Adding token at position: ${JSON.stringify(position)}`);
                this.socketManager.addToken(this.addingTokenType, position);
                this.addingToken = false;
            }
        };
        
        // Setup Socket.IO event handlers
        this.socketManager.on('updateUsers', (users) => {
            this.log('Received updateUsers event', users);
            this.updateUsersList(users);
        });
        
        this.socketManager.on('gameStateUpdate', (state) => {
            this.log('Received gameStateUpdate event', state);
            this.updateGameState(state);
        });
        
        this.socketManager.on('tokenAdded', (data) => {
            this.log('Received tokenAdded event', data);
            this.handleTokenAdded(data);
        });
        
        this.socketManager.on('tokenMoved', (data) => {
            this.log('Received tokenMoved event', data);
            this.handleTokenMoved(data);
        });
        
        this.socketManager.on('tokenRemoved', (data) => {
            this.log('Received tokenRemoved event', data);
            this.handleTokenRemoved(data);
        });
        
        // Setup drag and drop for tokens
        this.setupDragAndDrop();
        
        this.log('Game manager initialized');
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
        this.log('Updating game state', state);
        
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
                this.log(`Creating token: ${tokenId} at position ${JSON.stringify(tokenData.position)}`);
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
        this.log(`Creating token ${tokenId} of type ${tokenType} at position ${JSON.stringify(position)}`);
        
        // Find the hex at the position
        const hex = this.board.getHexAt(position.col, position.row);
        if (!hex) {
            this.log(`No hex found at position ${JSON.stringify(position)}`);
            return null;
        }
        
        // Create token element
        const token = document.createElement('div');
        token.className = `token token-${tokenType}`;
        token.dataset.id = tokenId;
        token.dataset.type = tokenType;
        
        // Position the token at the center of the hex
        const hexCenter = this.board.getHexCenter(position.col, position.row);
        if (hexCenter) {
            this.log(`Placing token at coordinates: x=${hexCenter.x}, y=${hexCenter.y}`);
            token.style.left = `${hexCenter.x - 20}px`; // 20px is half of token width
            token.style.top = `${hexCenter.y - 20}px`; // 20px is half of token height
        } else {
            this.log('Could not get hex center');
        }
        
        // Store current position
        token.dataset.currentCol = position.col;
        token.dataset.currentRow = position.row;
        
        // Add to board and store reference
        this.boardElement.appendChild(token);
        this.tokens.set(tokenId, token);
        
        return token;
    }
    
    handleTokenAdded(data) {
        this.log(`Handling token added: ${JSON.stringify(data)}`);
        this.createToken(data.token_id, data.token_type, data.position);
    }
    
    handleTokenMoved(data) {
        this.log(`Handling token moved: ${JSON.stringify(data)}`);
        const token = this.tokens.get(data.token_id);
        if (!token) {
            this.log(`Token ${data.token_id} not found`);
            return;
        }
        
        const hexCenter = this.board.getHexCenter(data.position.col, data.position.row);
        if (!hexCenter) {
            this.log(`Could not get hex center for position ${JSON.stringify(data.position)}`);
            return;
        }
        
        // Update token position on screen
        token.style.left = `${hexCenter.x - 20}px`;
        token.style.top = `${hexCenter.y - 20}px`;
        
        // Update data attributes
        token.dataset.currentCol = data.position.col;
        token.dataset.currentRow = data.position.row;
        
        // Clear any transform that might be applied
        token.style.transform = '';
        token.removeAttribute('data-x');
        token.removeAttribute('data-y');
    }
    
    handleTokenRemoved(data) {
        this.log(`Handling token removed: ${JSON.stringify(data)}`);
        const token = this.tokens.get(data.token_id);
        if (!token) {
            this.log(`Token ${data.token_id} not found for removal`);
            return;
        }
        
        token.remove();
        this.tokens.delete(data.token_id);
    }
    
    confirmClearBoard() {
        if (confirm('Are you sure you want to clear the board? This will remove all tokens.')) {
            this.log('Clearing board');
            this.tokens.forEach((token, tokenId) => {
                this.socketManager.removeToken(tokenId);
            });
        }
    }
    
    setupDragAndDrop() {
        this.log('Setting up drag and drop');
        
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
                start: event => {
                    this.log('Drag started', event.target.dataset.id);
                },
                
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
                    this.log(`Drag ended for token ${tokenId}`);
                    
                    // Get the token's center position
                    const rect = target.getBoundingClientRect();
                    const tokenCenterX = rect.left + rect.width / 2;
                    const tokenCenterY = rect.top + rect.height / 2;
                    
                    // Convert to board-relative coordinates
                    const boardRect = this.boardElement.getBoundingClientRect();
                    const boardX = tokenCenterX - boardRect.left;
                    const boardY = tokenCenterY - boardRect.top;
                    this.log(`Token dropped at board coordinates: x=${boardX}, y=${boardY}`);
                    
                    // Find the hex at this position
                    const hexCoord = this.board.pixelToHex(boardX, boardY);
                    this.log(`Mapped to hex coordinates: ${JSON.stringify(hexCoord)}`);
                    
                    // Reset transform to avoid accumulation
                    target.style.transform = '';
                    target.removeAttribute('data-x');
                    target.removeAttribute('data-y');
                    
                    // Only send the move if the position actually changed
                    if (parseInt(target.dataset.currentCol) !== hexCoord.col || 
                        parseInt(target.dataset.currentRow) !== hexCoord.row) {
                        this.log(`Sending move for token ${tokenId} to ${JSON.stringify(hexCoord)}`);
                        // Send the move to the server
                        this.socketManager.moveToken(tokenId, hexCoord);
                    } else {
                        this.log('Token position unchanged, not sending update');
                    }
                }
            }
        });
        
        this.log('Drag and drop setup complete');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game');
    // ROOM_ID and USERNAME are set in the template
    const game = new GameManager(ROOM_ID, USERNAME);
    
    // Make the game instance globally available for other components
    window.gameInstance = game;
});
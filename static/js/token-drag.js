/**
 * Pure DOM-based token dragging system - no external libraries needed
 */
function TokenDragManager(gameManager) {
    this.gameManager = gameManager;
    this.board = gameManager.board;
    this.boardElement = gameManager.boardElement;
    
    // Track dragging state
    this.draggingToken = null;
    this.offsetX = 0;
    this.offsetY = 0;
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Add debug button
    this.addDebugButton();
    
    console.log('TokenDragManager initialized - pure DOM implementation');
}

// Apply draggable behavior to a token - no setup needed with DOM events
TokenDragManager.prototype.applyDraggable = function(token) {
    token.classList.add('draggable');
};

// Add debug button
TokenDragManager.prototype.addDebugButton = function() {
    const debugBtn = document.createElement('button');
    debugBtn.textContent = 'Toggle Debug';
    debugBtn.style.position = 'fixed';
    debugBtn.style.bottom = '10px';
    debugBtn.style.right = '10px';
    debugBtn.style.zIndex = '999';
    debugBtn.addEventListener('click', function() {
        if (window.debugHelper) {
            window.debugHelper.toggle();
        } else {
            console.log('Debug helper not available');
        }
    });
    document.body.appendChild(debugBtn);
};

TokenDragManager.prototype.setupEventListeners = function() {
    // Token click/mousedown to start dragging
    this.boardElement.addEventListener('mousedown', this.handleMouseDown.bind(this));
    
    // Mouse move for dragging
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    
    // Mouse up to release
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Touch events for mobile
    this.boardElement.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    
    console.log('[TokenDragManager] Event listeners set up');
};

TokenDragManager.prototype.handleMouseDown = function(e) {
    const token = e.target.closest('.token');
    if (!token) return;
    
    e.preventDefault(); // Prevent text selection, etc.
    this.startDragging(token, e.clientX, e.clientY);
};

TokenDragManager.prototype.handleTouchStart = function(e) {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;
    
    const token = element.closest('.token');
    if (!token) return;
    
    e.preventDefault(); // Prevent scrolling
    this.startDragging(token, touch.clientX, touch.clientY);
};

TokenDragManager.prototype.startDragging = function(token, clientX, clientY) {
    // Get token's current position
    const rect = token.getBoundingClientRect();
    
    // Calculate offset from cursor to token's top-left corner
    this.offsetX = clientX - rect.left;
    this.offsetY = clientY - rect.top;
    
    // Set dragging state
    this.draggingToken = token;
    
    // Add visual feedback
    token.classList.add('dragging');
    token.style.zIndex = '100';
    
    console.log(`[TokenDragManager] Started dragging token ${token.dataset.id}`);
};

TokenDragManager.prototype.handleMouseMove = function(e) {
    if (!this.draggingToken) return;
    
    e.preventDefault();
    this.moveToken(e.clientX, e.clientY);
};

TokenDragManager.prototype.handleTouchMove = function(e) {
    if (!this.draggingToken || e.touches.length !== 1) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    this.moveToken(touch.clientX, touch.clientY);
};

TokenDragManager.prototype.moveToken = function(clientX, clientY) {
    // Calculate new position relative to board
    const boardRect = this.boardElement.getBoundingClientRect();
    const x = clientX - boardRect.left - this.offsetX;
    const y = clientY - boardRect.top - this.offsetY;
    
    // Update token position
    this.draggingToken.style.left = `${x}px`;
    this.draggingToken.style.top = `${y}px`;
};

TokenDragManager.prototype.handleMouseUp = function() {
    this.stopDragging();
};

TokenDragManager.prototype.handleTouchEnd = function() {
    this.stopDragging();
};

TokenDragManager.prototype.stopDragging = function() {
    if (!this.draggingToken) return;
    
    const token = this.draggingToken;
    const tokenId = token.dataset.id;
    
    // Remove visual feedback
    token.classList.remove('dragging');
    token.style.zIndex = '10';
    
    // Get token's current center position
    const rect = token.getBoundingClientRect();
    const tokenCenterX = rect.left + rect.width / 2;
    const tokenCenterY = rect.top + rect.height / 2;
    
    // Convert to board-relative coordinates
    const boardRect = this.boardElement.getBoundingClientRect();
    const boardX = tokenCenterX - boardRect.left;
    const boardY = tokenCenterY - boardRect.top;
    
    console.log(`[TokenDragManager] Token dropped at board coordinates: x=${boardX}, y=${boardY}`);
    
    // Find the hex at this position
    const hexCoord = this.board.pixelToHex(boardX, boardY);
    console.log(`[TokenDragManager] Mapped to hex coordinates: ${JSON.stringify(hexCoord)}`);
    
    // Ensure coordinates are within bounds
    const boundedHexCoord = {
        col: Math.max(0, Math.min(hexCoord.col, this.board.cols - 1)),
        row: Math.max(0, Math.min(hexCoord.row, this.board.rows - 1))
    };
    
    const currentCol = parseInt(token.dataset.currentCol);
    const currentRow = parseInt(token.dataset.currentRow);
    
    // Only send the move if the position actually changed
    if (currentCol !== boundedHexCoord.col || currentRow !== boundedHexCoord.row) {
        console.log(`[TokenDragManager] Sending move for token ${tokenId} to ${JSON.stringify(boundedHexCoord)}`);
        
        // Immediately update the visual position for responsive feedback
        this.snapTokenToHex(token, boundedHexCoord);
        
        // Send the move to the server
        this.gameManager.socketManager.moveToken(tokenId, boundedHexCoord);
    } else {
        console.log('[TokenDragManager] Token position unchanged, snapping back');
        // Reset token to its original position
        this.snapTokenToHex(token, { col: currentCol, row: currentRow });
    }
    
    // Clear dragging state
    this.draggingToken = null;
};

TokenDragManager.prototype.snapTokenToHex = function(token, hexCoord) {
    // Update data attributes to reflect the new position
    token.dataset.currentCol = hexCoord.col;
    token.dataset.currentRow = hexCoord.row;
    
    // Get hex center and position token
    const hexCenter = this.board.getHexCenter(hexCoord.col, hexCoord.row);
    if (hexCenter) {
        // Add a simple animation for smooth snapping
        token.classList.add('token-snapping');
        token.style.left = `${hexCenter.x - 20}px`; // 20px is half of token width
        token.style.top = `${hexCenter.y - 20}px`; // 20px is half of token height
        
        // Remove transition after animation completes
        setTimeout(() => {
            token.classList.remove('token-snapping');
        }, 200);
    }
};
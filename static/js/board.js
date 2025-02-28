/**
 * Hexagonal board manager - Fixed positioning
 */
class HexBoard {
    constructor(element, cols = 10, rows = 10) {
        this.element = element;
        this.cols = cols;
        this.rows = rows;
        this.hexSize = 60; // Size of hexagon in pixels
        this.hexagons = new Map(); // Map of coordinates to hexagon elements
        
        this.init();
    }
    
    init() {
        this.element.innerHTML = '';
        this.createGrid();
    }
    
    createGrid() {
        // Calculate hex dimensions for proper positioning
        const hexWidth = this.hexSize; // Width of hex
        const hexHeight = this.hexSize; // Height of hex
        
        // For a proper hexagonal grid:
        const horizontalDistance = hexWidth * 0.75; // Distance between columns
        const verticalDistance = hexHeight * 0.87; // Distance between rows
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const hex = document.createElement('div');
                hex.className = 'hexagon';
                
                // Offset every other row for proper hexagonal packing
                const xOffset = (row % 2 === 0) ? 0 : (horizontalDistance / 2);
                
                // Calculate position
                const xPos = col * horizontalDistance + xOffset;
                const yPos = row * verticalDistance;
                
                hex.style.left = `${xPos}px`;
                hex.style.top = `${yPos}px`;
                
                // Add coordinate display for reference
                const coordSpan = document.createElement('span');
                coordSpan.className = 'hexagon-coordinate';
                coordSpan.textContent = `${col},${row}`;
                hex.appendChild(coordSpan);
                
                // Store coordinate data on the element for easy access
                hex.dataset.col = col;
                hex.dataset.row = row;
                
                // Add click handler
                hex.addEventListener('click', (e) => {
                    this.onHexClick(hex, col, row, e);
                });
                
                this.element.appendChild(hex);
                this.hexagons.set(`${col},${row}`, hex);
            }
        }
    }
    
    onHexClick(hex, col, row, event) {
        // This will be overridden or extended in game.js
        console.log(`Hex clicked at ${col},${row}`);
    }
    
    // Convert pixel position to nearest hex coordinates
    pixelToHex(x, y) {
        // Calculate hex dimensions
        const hexWidth = this.hexSize;
        const hexHeight = this.hexSize;
        const horizontalDistance = hexWidth * 0.75;
        const verticalDistance = hexHeight * 0.87;
        
        // Calculate approximate row index
        let row = Math.round(y / verticalDistance);
        
        // Adjust x based on whether we're in an odd or even row
        const adjustedX = (row % 2 === 0) ? x : x - (horizontalDistance / 2);
        
        // Calculate approximate column index
        let col = Math.round(adjustedX / horizontalDistance);
        
        // Ensure coordinates are within bounds
        row = Math.max(0, Math.min(row, this.rows - 1));
        col = Math.max(0, Math.min(col, this.cols - 1));
        
        return { col, row };
    }
    
    // Get hexagon element at specific coordinates
    getHexAt(col, row) {
        return this.hexagons.get(`${col},${row}`);
    }
    
    // Get pixel position at center of hex
    getHexCenter(col, row) {
        const hex = this.getHexAt(col, row);
        if (!hex) return null;
        
        const rect = hex.getBoundingClientRect();
        const boardRect = this.element.getBoundingClientRect();
        
        return {
            x: rect.left + rect.width / 2 - boardRect.left,
            y: rect.top + rect.height / 2 - boardRect.top
        };
    }
}
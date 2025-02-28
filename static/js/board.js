/**
 * Hexagonal board manager
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
        const hexHeight = this.hexSize;
        const hexWidth = this.hexSize;
        const verticalSpace = hexHeight * 0.75;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const hex = document.createElement('div');
                hex.className = 'hexagon';
                
                // Offset every other row to create a hexagonal grid pattern
                const xPos = col * hexWidth * 0.75;
                const yPos = row * verticalSpace;
                const offset = (row % 2 === 0) ? 0 : (hexWidth * 0.375);
                
                hex.style.left = `${xPos + offset}px`;
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
        const hexHeight = this.hexSize;
        const hexWidth = this.hexSize;
        const verticalSpace = hexHeight * 0.75;
        
        // Approximate row based on y position
        let row = Math.floor(y / verticalSpace);
        
        // Adjust for offset in odd rows
        const offset = (row % 2 === 0) ? 0 : (hexWidth * 0.375);
        let col = Math.floor((x - offset) / (hexWidth * 0.75));
        
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
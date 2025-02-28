/**
 * Hexagonal board manager - Improved positioning for proper hexagonal tiling
 */
class HexBoard {
    constructor(element, cols = 10, rows = 10) {
        this.element = element;
        this.cols = cols;
        this.rows = rows;
        this.hexSize = 60; // Size of hexagon in pixels
        this.hexHeight = Math.sqrt(3) * this.hexSize / 2; // Correct height for a hexagon
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
        
        // For a proper hexagonal grid with pointy-top hexes:
        const horizontalDistance = hexWidth * 3/4; // Width * 3/4 gives proper horizontal spacing
        const verticalDistance = this.hexHeight; // Height of hex for proper vertical spacing
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const hex = document.createElement('div');
                hex.className = 'hexagon';
                
                // Offset every other row for proper hexagonal packing
                const xOffset = (row % 2 === 0) ? 0 : horizontalDistance;
                
                // Calculate position
                const xPos = col * horizontalDistance * 2 + xOffset;
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
        const hexHeight = this.hexHeight;
        const horizontalDistance = hexWidth * 3/4 * 2;
        const verticalDistance = hexHeight;
        
        // Rough estimation of row
        let row = Math.floor(y / verticalDistance);
        
        // Determine if we're in an odd or even row
        const isOddRow = row % 2 !== 0;
        
        // Adjust x based on whether we're in an odd or even row
        const rowOffset = isOddRow ? horizontalDistance / 2 : 0;
        
        // Calculate approximate column index
        let col = Math.floor((x - rowOffset) / horizontalDistance);
        
        // Now do a more precise check by finding the closest hex center
        const closestHex = this.findClosestHex(x, y, row, col);
        col = closestHex.col;
        row = closestHex.row;
        
        // Ensure coordinates are within bounds
        row = Math.max(0, Math.min(row, this.rows - 1));
        col = Math.max(0, Math.min(col, this.cols - 1));
        
        return { col, row };
    }
    
    // Find the closest hex to given pixel coordinates
    findClosestHex(x, y, estimatedRow, estimatedCol) {
        // Search area - look at estimated position and surrounding hexes
        const searchRadius = 1;
        let minDistance = Infinity;
        let closestHex = { col: estimatedCol, row: estimatedRow };
        
        for (let r = Math.max(0, estimatedRow - searchRadius); r <= Math.min(this.rows - 1, estimatedRow + searchRadius); r++) {
            for (let c = Math.max(0, estimatedCol - searchRadius); c <= Math.min(this.cols - 1, estimatedCol + searchRadius); c++) {
                const center = this.getHexCenter(c, r);
                if (center) {
                    const dist = Math.sqrt(Math.pow(center.x - x, 2) + Math.pow(center.y - y, 2));
                    if (dist < minDistance) {
                        minDistance = dist;
                        closestHex = { col: c, row: r };
                    }
                }
            }
        }
        
        return closestHex;
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
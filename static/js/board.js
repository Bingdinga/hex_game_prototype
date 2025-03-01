/**
 * Hexagonal board manager - Fixed positioning for pointy-top hexes
 */
class HexBoard {
    constructor(element, cols = 10, rows = 10) {
        this.element = element;
        this.cols = cols;
        this.rows = rows;
        this.hexSize = 60; // Base size of hexagon in pixels (height for pointy-top)
        
        // For pointy-top hexagons, the correct proportions are important:
        this.hexHeight = this.hexSize; // Full height
        this.hexWidth = Math.sqrt(3) * this.hexSize / 2; // Width = √3/2 * height
        
        this.hexagons = new Map(); // Map of coordinates to hexagon elements
        
        this.init();
    }
    
    init() {
        console.log('Initializing hex board');
        this.element.innerHTML = '';
        this.createGrid();
    }
    
    createGrid() {
        console.log(`Creating hex grid: ${this.cols}x${this.rows}`);
        // For a perfect pointy-top hex tiling pattern:
        // - Horizontal spacing: 100% of hex width (perfect tight fit) 
        // - Vertical spacing: 75% of hex height (25% overlap for tight fit)
        // - Every other row is offset by half a hex width
        
        // Calculate actual spacing
        const horizontalSpacing = this.hexWidth;
        const verticalSpacing = this.hexHeight * 0.75;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const hex = document.createElement('div');
                hex.className = 'hexagon';
                
                // Calculate position
                // Offset every other row horizontally by half a hexWidth
                const rowOffset = (row % 2 === 0) ? 0 : this.hexWidth / 2;
                const x = col * horizontalSpacing + rowOffset;
                const y = row * verticalSpacing;
                
                hex.style.left = `${x}px`;
                hex.style.top = `${y}px`;
                
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
        
        console.log(`Created ${this.hexagons.size} hexagons`);
    }
    
    onHexClick(hex, col, row, event) {
        // This will be overridden or extended in game.js
        console.log(`Hex clicked at ${col},${row}`);
    }
    
    // Convert pixel position to nearest hex coordinates
    pixelToHex(x, y) {
        // Get the inverse of our hex spacing
        const horizontalSpacing = this.hexWidth;
        const verticalSpacing = this.hexHeight * 0.75;
        
        // First estimate the row - this will help determine the horizontal offset
        let row = Math.floor(y / verticalSpacing);
        
        // Apply the row offset when calculating column
        const rowOffset = (row % 2 === 0) ? 0 : this.hexWidth / 2;
        let col = Math.floor((x - rowOffset) / horizontalSpacing);
        
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
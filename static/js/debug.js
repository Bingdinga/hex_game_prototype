/**
 * Debug helper for the Hex Game
 * Add this to game.html before the closing body tag
 */
class DebugHelper {
    constructor() {
        this.enabled = false;
        this.container = null;
        this.logBuffer = [];
        this.maxLogEntries = 20;
        this.init();
    }
    
    init() {
        // Create debug container
        this.container = document.createElement('div');
        this.container.className = 'debug-info';
        this.container.style.display = 'none';
        document.body.appendChild(this.container);
        
        // Add toggle keyboard shortcut (Ctrl+Shift+D)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                this.toggle();
                e.preventDefault();
            }
        });
        
        // Override console.log
        const originalLog = console.log;
        console.log = (...args) => {
            // Call the original console.log
            originalLog.apply(console, args);
            
            // Add to our debug display
            this.logToDisplay(args);
        };
        
        console.log('Debug helper initialized. Press Ctrl+Shift+D to toggle debug display.');
    }
    
    logToDisplay(args) {
        if (!this.enabled) return;
        
        // Convert all arguments to strings
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
        
        // Add timestamp
        const time = new Date().toLocaleTimeString();
        const logEntry = `[${time}] ${message}`;
        
        // Add to buffer
        this.logBuffer.push(logEntry);
        
        // Limit buffer size
        while (this.logBuffer.length > this.maxLogEntries) {
            this.logBuffer.shift();
        }
        
        // Update display
        this.updateDisplay();
    }
    
    updateDisplay() {
        if (!this.enabled) return;
        
        this.container.innerHTML = this.logBuffer.join('<br>');
        this.container.scrollTop = this.container.scrollHeight;
    }
    
    toggle() {
        this.enabled = !this.enabled;
        this.container.style.display = this.enabled ? 'block' : 'none';
        console.log(`Debug display ${this.enabled ? 'enabled' : 'disabled'}`);
        if (this.enabled) {
            this.updateDisplay();
        }
    }
}

// Initialize debug helper when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.debugHelper = new DebugHelper();
});
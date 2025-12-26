/**
 * Timer Classes
 */
export class MeditationTimer {
    constructor() {
        this.duration = 900; // 15 minutes
        this.remaining = this.loadState() || this.duration;
        this.isRunning = false;
        this.interval = null;
        this.callbacks = [];
    }
    
    loadState() {
        const saved = localStorage.getItem('meditationTimer');
        if (saved) {
            const data = JSON.parse(saved);
            const elapsed = Math.floor((Date.now() - data.timestamp) / 1000);
            return Math.max(0, data.remaining - elapsed);
        }
        return null;
    }
    
    saveState() {
        localStorage.setItem('meditationTimer', JSON.stringify({
            remaining: this.remaining,
            timestamp: Date.now()
        }));
    }
    
    onUpdate(callback) {
        this.callbacks.push(callback);
        callback(this.remaining);
    }
    
    notify() {
        this.callbacks.forEach(cb => cb(this.remaining));
    }
    
    getFormattedTime() {
        const mins = Math.floor(this.remaining / 60);
        const secs = this.remaining % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.interval = setInterval(() => {
            this.remaining--;
            this.notify();
            this.saveState();
            
            if (this.remaining <= 0) {
                this.complete();
            }
        }, 1000);
    }
    
    pause() {
        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.saveState();
    }
    
    reset() {
        this.pause();
        this.remaining = this.duration;
        this.notify();
        localStorage.removeItem('meditationTimer');
    }
    
    complete() {
        this.pause();
        this.remaining = 0;
        this.notify();
        
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Meditation Complete', {
                body: 'Your 15-minute meditation session is complete.',
                icon: '/icon-192.png'
            });
        }
        
        localStorage.removeItem('meditationTimer');
    }
}

export class GamingTimer {
    constructor() {
        this.duration = 1800; // 30 minutes
        this.remaining = this.loadState() || this.duration;
        this.isRunning = false;
        this.interval = null;
        this.callbacks = [];
    }
    
    loadState() {
        const saved = localStorage.getItem('gamingTimer');
        if (saved) {
            const data = JSON.parse(saved);
            const elapsed = Math.floor((Date.now() - data.timestamp) / 1000);
            return Math.max(0, data.remaining - elapsed);
        }
        return null;
    }
    
    saveState() {
        localStorage.setItem('gamingTimer', JSON.stringify({
            remaining: this.remaining,
            timestamp: Date.now()
        }));
    }
    
    onUpdate(callback) {
        this.callbacks.push(callback);
        callback(this.remaining);
    }
    
    notify() {
        this.callbacks.forEach(cb => cb(this.remaining));
    }
    
    getFormattedTime() {
        const mins = Math.floor(this.remaining / 60);
        const secs = this.remaining % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.interval = setInterval(() => {
            this.remaining--;
            this.notify();
            this.saveState();
            
            if (this.remaining <= 0) {
                this.complete();
            }
        }, 1000);
    }
    
    pause() {
        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.saveState();
    }
    
    reset() {
        this.pause();
        this.remaining = this.duration;
        this.notify();
        localStorage.removeItem('gamingTimer');
    }
    
    complete() {
        this.pause();
        this.remaining = 0;
        this.notify();
        
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Gaming time up! 🎮', {
                body: 'Your 30-minute gaming session is complete.',
                icon: '/icon-192.png'
            });
        }
        
        localStorage.removeItem('gamingTimer');
    }
}


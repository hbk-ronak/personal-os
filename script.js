/**
 * PersonalOS - Main Script Loader
 * Loads all widget modules in the correct order
 */

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        const swCode = `
            const CACHE_NAME = 'personalos-v1';
            self.addEventListener('install', (e) => {
                e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(['/'])));
            });
            self.addEventListener('fetch', (e) => {
                e.respondWith(
                    caches.match(e.request).then(response => response || fetch(e.request))
                );
            });
        `;
        const blob = new Blob([swCode], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);
        navigator.serviceWorker.register(swUrl);
    });
}

// Load widget files in dependency order
const widgetFiles = [
    'widgets/db.js',
    'widgets/timers.js',
    'app.js'
];

/**
 * Dynamically loads a script file
 * @param {string} src - Script source path
 * @returns {Promise} Promise that resolves when script is loaded
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Loads all widget files sequentially
 */
async function loadWidgets() {
    console.log('🚀 Loading PersonalOS modules...');
    
    try {
        for (const file of widgetFiles) {
            console.log(`📦 Loading: ${file}`);
            await loadScript(file);
        }
        console.log('✅ All modules loaded successfully!');
        
        // Initialize app after all modules are loaded
        if (typeof App !== 'undefined') {
            window.app = new App();
        }
    } catch (error) {
        console.error('❌ Error loading modules:', error);
    }
}

// Load widgets when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadWidgets);
} else {
    loadWidgets();
}


import { writable, derived } from 'svelte/store';
import { DB } from './db.js';
import { MeditationTimer, GamingTimer } from './timers.js';

// Initialize DB instance
export const db = new DB();

// App state stores
export const currentPhase = writable(null);
export const isManualOverride = writable(false);
export const viewAllData = writable(false);
export const isRestMode = writable(false);
export const schedule = writable([]);
export const selectedMood = writable(null);

// Data stores
export const tasks = writable([]);
export const notes = writable([]);
export const moods = writable([]);
export const readingList = writable([]);
export const watchList = writable([]);
export const workNotes = writable([]);
export const dailyLogs = writable([]);

// Timer stores
export const meditationTimer = writable(new MeditationTimer());
export const gamingTimer = writable(new GamingTimer());

// Current time store
export const currentTime = writable(new Date());
export const currentDate = writable(new Date());

// Initialize time updates
if (typeof window !== 'undefined') {
    setInterval(() => {
        const now = new Date();
        currentTime.set(now);
        currentDate.set(now);
    }, 1000);
}

// Phase widgets mapping
export const phaseWidgets = {
    MORNING_PLAN: ['time', 'tasks-widget', 'mood'],
    RUN: ['time', 'tasks-widget', 'mood'],
    WORK: ['time', 'meditation', 'tasks-widget', 'notes-work'],
    SHUTDOWN: ['time', 'shutdown-form', 'mood'],
    DECOMPRESS: ['time', 'watchlist', 'gaming-timer'],
    COOK_TV: ['time', 'watchlist'],
    DEEP_WORK: ['time', 'readinglist'],
    CHECK_IN: ['time', 'mood'],
    FREE_TIME: ['time']
};

// Derived store for widget visibility
export const visibleWidgets = derived(
    [currentPhase, viewAllData],
    ([$currentPhase, $viewAllData]) => {
        if ($viewAllData) return true;
        if (!$currentPhase) return false;
        return phaseWidgets[$currentPhase] || [];
    }
);

// Helper function to check if widget should be shown
export function shouldShowWidget(widgetId) {
    let show = false;
    viewAllData.subscribe(val => {
        if (val) {
            show = true;
            return;
        }
    });
    if (show) return true;
    
    let phase = null;
    currentPhase.subscribe(val => phase = val);
    if (!phase) return false;
    
    const allowed = phaseWidgets[phase]?.includes(widgetId) ?? false;
    return allowed;
}


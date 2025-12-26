import { db, currentPhase, isManualOverride, schedule, viewAllData, dailyLogs } from './stores.js';
import { exportData as exportDataFunction } from './export.js';

export async function initApp() {
    // Initialize database
    await db.init();
    await db.initDefaultSchedule();
    
    // Load schedule
    const scheduleData = await db.getAll('schedule');
    schedule.set(scheduleData);
    
    // Load persisted state
    const savedPhase = localStorage.getItem('currentPhase');
    const savedManualOverride = localStorage.getItem('isManualOverride') === 'true';
    const savedViewAllData = localStorage.getItem('viewAllData') === 'true';
    
    viewAllData.set(savedViewAllData);
    
    if (savedManualOverride && savedPhase) {
        currentPhase.set(savedPhase);
        isManualOverride.set(true);
    } else {
        const detectedPhase = detectCurrentPhase(scheduleData);
        // Ensure we always have a phase set (default to FREE_TIME)
        currentPhase.set(detectedPhase || 'FREE_TIME');
        isManualOverride.set(false);
    }
    
    
    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Phase checking will be handled in App.svelte component
}

export function detectCurrentPhase(scheduleData) {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const currentDay = now.getDay();
    
    const todayBlocks = scheduleData
        .filter(block => block.activeDays.includes(currentDay))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    for (const block of todayBlocks) {
        if (currentTime >= block.startTime && currentTime < block.endTime) {
            return block.phase;
        }
    }
    
    return 'FREE_TIME';
}

export function checkPhase() {
    // This will be called from a component context where stores are reactive
    // For now, we'll handle this in the component
}

export function setPhase(phaseName, manual = false) {
    currentPhase.set(phaseName);
    isManualOverride.set(manual);
    
    if (manual) {
        localStorage.setItem('currentPhase', phaseName);
        localStorage.setItem('isManualOverride', 'true');
    } else {
        localStorage.removeItem('currentPhase');
        localStorage.removeItem('isManualOverride');
    }
}

export function syncToSchedule() {
    isManualOverride.set(false);
    localStorage.removeItem('currentPhase');
    localStorage.removeItem('isManualOverride');
    
    // Get current schedule value
    let scheduleData = [];
    const unsubscribe = schedule.subscribe(value => {
        scheduleData = value;
    });
    unsubscribe();
    
    const detectedPhase = detectCurrentPhase(scheduleData);
    currentPhase.set(detectedPhase);
}


export function exportData() {
    return exportDataFunction();
}


import { db } from './stores.js';

export async function exportData() {
    const data = {
        export_date: new Date().toISOString(),
        tasks: await db.getAll('tasks'),
        notes: await db.getAll('notes'),
        moods: await db.getAll('moods'),
        daily_logs: await db.getAll('daily_logs'),
        work_notes: await db.getAll('work_notes'),
        readinglist: await db.getAll('readinglist'),
        watchlist: await db.getAll('watchlist'),
        schedule: await db.getAll('schedule')
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personalos_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}


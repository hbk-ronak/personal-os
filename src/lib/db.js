/**
 * IndexedDB Manager
 */
export class DB {
    constructor() {
        this.db = null;
        this.dbName = 'PersonalOS';
        this.version = 6; // v4: schedule, v5: daily_logs/work_notes, v6: readinglist/watchlist
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                const oldVersion = e.oldVersion;
                const transaction = e.target.transaction;
                
                try {
                    // Existing stores
                    if (!db.objectStoreNames.contains('tasks')) {
                        db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
                    }
                    if (!db.objectStoreNames.contains('notes')) {
                        db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
                    }
                    if (!db.objectStoreNames.contains('events')) {
                        db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
                    }
                    if (!db.objectStoreNames.contains('moods')) {
                        db.createObjectStore('moods', { keyPath: 'id', autoIncrement: true });
                    }
                    if (!db.objectStoreNames.contains('list')) {
                        db.createObjectStore('list', { keyPath: 'id', autoIncrement: true });
                    }
                    
                    // v4: Schedule store
                    if (oldVersion < 4) {
                        if (!db.objectStoreNames.contains('schedule')) {
                            const scheduleStore = db.createObjectStore('schedule', { keyPath: 'id', autoIncrement: true });
                            scheduleStore.createIndex('startTime', 'startTime', { unique: false });
                            scheduleStore.createIndex('phase', 'phase', { unique: false });
                        }
                    }
                    
                    // v5: Daily logs and work notes
                    if (oldVersion < 5) {
                        if (!db.objectStoreNames.contains('daily_logs')) {
                            db.createObjectStore('daily_logs', { keyPath: 'id', autoIncrement: true });
                        }
                        if (!db.objectStoreNames.contains('work_notes')) {
                            db.createObjectStore('work_notes', { keyPath: 'id', autoIncrement: true });
                        }
                    }
                    
                    // v6: Split list into readinglist and watchlist
                    if (oldVersion < 6) {
                        if (!db.objectStoreNames.contains('readinglist')) {
                            db.createObjectStore('readinglist', { keyPath: 'id', autoIncrement: true });
                        }
                        if (!db.objectStoreNames.contains('watchlist')) {
                            db.createObjectStore('watchlist', { keyPath: 'id', autoIncrement: true });
                        }
                        
                        // Migrate existing list data
                        if (db.objectStoreNames.contains('list')) {
                            const listStore = transaction.objectStore('list');
                            const readingStore = transaction.objectStore('readinglist');
                            const watchStore = transaction.objectStore('watchlist');
                            
                            listStore.getAll().onsuccess = (e) => {
                                const items = e.target.result;
                                items.forEach(item => {
                                    const newItem = {
                                        title: item.title,
                                        notes: item.notes || '',
                                        completed: item.completed || false
                                    };
                                    
                                    if (item.type === 'book') {
                                        newItem.category = item.category || 'technical';
                                        readingStore.add(newItem);
                                    } else {
                                        watchStore.add(newItem);
                                    }
                                });
                            };
                        }
                    }
                } catch (error) {
                    console.error('Migration failed:', error);
                    throw error;
                }
            };
        });
    }
    
    async initDefaultSchedule() {
        const existing = await this.getAll('schedule');
        if (existing.length > 0) return;
        
        const defaultSchedule = [
            { startTime: '06:45', endTime: '07:00', phase: 'MORNING_PLAN', label: 'Morning Planning', description: 'Review personal tasks & goals', activeDays: [0,1,2,3,4,5,6], order: 0 },
            { startTime: '07:00', endTime: '08:00', phase: 'RUN', label: 'Running', description: 'Training session', activeDays: [1,2,4,6], order: 1 },
            { startTime: '08:30', endTime: '17:00', phase: 'WORK', label: 'Work Hours', description: 'Focus + meditation breaks', activeDays: [1,2,3,4,5], order: 2 },
            { startTime: '17:00', endTime: '17:15', phase: 'SHUTDOWN', label: 'Work Shutdown', description: 'Document progress & tomorrow\'s plan', activeDays: [1,2,3,4,5], order: 3 },
            { startTime: '17:15', endTime: '17:45', phase: 'DECOMPRESS', label: 'Gaming', description: '30m decompression session', activeDays: [1,2,3,4,5], order: 4 },
            { startTime: '19:00', endTime: '20:00', phase: 'COOK_TV', label: 'Dinner Time', description: 'Cook + entertainment', activeDays: [0,1,2,3,4,5,6], order: 5 },
            { startTime: '21:00', endTime: '23:45', phase: 'DEEP_WORK', label: 'Deep Work', description: 'Learning, reading, interview prep', activeDays: [0,1,2,3,4,5,6], order: 6 },
            { startTime: '23:45', endTime: '23:50', phase: 'CHECK_IN', label: 'EOD Check-in', description: 'Log fatigue & mood', activeDays: [0,1,2,3,4,5,6], order: 7 }
        ];
        
        for (const block of defaultSchedule) {
            await this.add('schedule', block);
        }
    }

    async getAll(storeName) {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async add(storeName, data) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, data) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}


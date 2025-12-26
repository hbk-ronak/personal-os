/**
 * Main App Class
 */
class App {
    constructor() {
        this.db = new DB();
        this.currentDate = new Date();
        this.selectedMood = null;
        this.currentPhase = localStorage.getItem('currentPhase') || null;
        this.isManualOverride = localStorage.getItem('isManualOverride') === 'true';
        this.viewAllData = localStorage.getItem('viewAllData') === 'true';
        this.isRestMode = localStorage.getItem('isRestMode') === 'true';
        this.lastPhaseCheck = null;
        this.schedule = [];
        this.meditationTimer = new MeditationTimer(this);
        this.gamingTimer = new GamingTimer(this);
        
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        this.init();
    }

    async init() {
        await this.db.init();
        await this.db.initDefaultSchedule();
        this.schedule = await this.db.getAll('schedule');
        
        // Load persisted state
        if (this.isManualOverride && this.currentPhase) {
            // Keep manual override
        } else {
            this.currentPhase = this.detectCurrentPhase();
        }
        
        // Set rest mode state
        await this.checkFatigueLevel();
        if (this.isRestMode) {
            document.body.classList.add('rest-mode');
        }
        
        this.updateTime();
        
        // Load shutdown form if in SHUTDOWN phase
        if (this.currentPhase === 'SHUTDOWN') {
            await this.loadShutdown();
        }
        
        // Render everything - this will show/hide widgets based on phase
        this.renderAll();
        
        setInterval(() => this.updateTime(), 1000);
        setInterval(() => this.checkPhase(), 60000);
        
        // Restore timer states
        this.meditationTimer.updateDisplay();
        this.gamingTimer.updateDisplay();
        
        // Close menus on ESC or outside click
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const settingsModal = document.getElementById('settingsModal');
                if (settingsModal && !settingsModal.classList.contains('hidden')) {
                    this.closeSettings();
                }
                const phaseMenu = document.getElementById('phaseMenu');
                if (phaseMenu && !phaseMenu.classList.contains('hidden')) {
                    this.toggleMenu();
                }
            }
        });
        
        // Close menu on outside click
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('phaseMenu');
            const button = document.getElementById('menuButton');
            if (menu && button && !menu.contains(e.target) && !button.contains(e.target)) {
                menu.classList.add('hidden');
            }
        });
    }
    
    phaseWidgets = {
        MORNING_PLAN: ['time', 'tasks-widget', 'mood'],
        RUN: ['time', 'tasks-widget', 'mood'],
        WORK: ['time', 'meditation', 'tasks-widget', 'notes-work'],
        SHUTDOWN: ['time', 'shutdown-form', 'mood'],
        DECOMPRESS: ['time', 'watchlist', 'gaming-timer'],
        COOK_TV: ['time', 'watchlist'],
        DEEP_WORK: ['time', 'readinglist'],
        CHECK_IN: ['time', 'mood'],
        FREE_TIME: ['time']
    }
    
    shouldShowWidget(widgetId) {
        if (this.viewAllData) return true;
        if (!this.currentPhase) return false; // Hide everything if no phase
        const allowed = this.phaseWidgets[this.currentPhase]?.includes(widgetId) ?? false;
        return allowed;
    }
    
    getWidgetNamesForPhase(phase) {
        const widgetMap = {
            'time': 'Time',
            'tasks-widget': 'Tasks',
            'notes-work': 'Notes',
            'mood': 'Mood',
            'mood-expanded': 'Mood',
            'meditation': 'Meditation Timer',
            'shutdown-form': 'Shutdown Form',
            'gaming-timer': 'Gaming Timer',
            'watchlist': 'Watch List',
            'readinglist': 'Reading List',
            'reading-protocol': 'Reading Protocol',
            'export': 'Export'
        };
        
        const widgets = this.phaseWidgets[phase] || [];
        return widgets.map(w => widgetMap[w] || w).filter(Boolean);
    }
    
    toggleMenu() {
        const menu = document.getElementById('phaseMenu');
        if (menu) {
            menu.classList.toggle('hidden');
            if (!menu.classList.contains('hidden')) {
                this.renderPhaseMenu();
            }
        }
    }
    
    renderPhaseMenu() {
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const todayBlocks = this.schedule
            .filter(block => block.activeDays.includes(currentDay))
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        const currentBlock = todayBlocks.find(b => 
            currentTime >= b.startTime && currentTime < b.endTime
        );
        
        // Update current phase label
        const currentPhaseLabel = document.getElementById('currentPhaseLabel');
        const menuCurrentPhase = document.getElementById('menuCurrentPhase');
        const menuCurrentTime = document.getElementById('menuCurrentTime');
        
        if (currentBlock) {
            const label = currentBlock.label;
            if (currentPhaseLabel) currentPhaseLabel.textContent = label;
            if (menuCurrentPhase) menuCurrentPhase.textContent = label;
            if (menuCurrentTime) menuCurrentTime.textContent = `${currentBlock.startTime} - ${currentBlock.endTime}`;
        } else {
            if (currentPhaseLabel) currentPhaseLabel.textContent = 'Free Time';
            if (menuCurrentPhase) menuCurrentPhase.textContent = 'Free Time';
            if (menuCurrentTime) menuCurrentTime.textContent = '';
        }
        
        // Render phase items
        const container = document.getElementById('phaseMenuItems');
        if (!container) return;
        
        container.innerHTML = todayBlocks.map(block => {
            const isCurrent = this.currentPhase === block.phase;
            const isPast = currentTime >= block.endTime;
            
            let classes = 'w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#2a2a2a] transition-colors flex items-center justify-between';
            if (isCurrent) {
                classes += ' bg-primary/10 text-primary font-medium';
            } else if (isPast) {
                classes += ' text-gray-500';
            } else {
                classes += ' text-gray-300';
            }
            
            const widgetNames = this.getWidgetNamesForPhase(block.phase);
            
            return `
                <button onclick="app.setPhase('${block.phase}', true); app.toggleMenu();" 
                        class="${classes}">
                    <div class="flex-1">
                        <div class="font-medium">${block.label}</div>
                        <div class="text-xs text-gray-500">${block.startTime} - ${block.endTime}</div>
                        ${widgetNames.length > 0 ? `<div class="text-xs text-gray-600 mt-1">${widgetNames.join(', ')}</div>` : ''}
                    </div>
                    ${isCurrent ? '<span class="text-primary ml-2">●</span>' : ''}
                </button>
            `;
        }).join('');
        
        // Add sync button if manual override
        if (this.isManualOverride) {
            const syncBtn = document.createElement('button');
            syncBtn.onclick = () => {
                this.syncToSchedule();
                this.toggleMenu();
            };
            syncBtn.className = 'w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#2a2a2a] transition-colors flex items-center gap-2 text-amber-400 mt-2 border-t border-[#2a2a2a] pt-2';
            syncBtn.innerHTML = '<span>Sync to Schedule</span>';
            container.appendChild(syncBtn);
        }
    }
    
    dismissRestBanner() {
        localStorage.setItem('restBannerDismissed', 'true');
        const banner = document.getElementById('restModeBanner');
        if (banner) {
            banner.classList.add('hidden');
        }
    }
    
    detectCurrentPhase() {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const currentDay = now.getDay();
        
        const todayBlocks = this.schedule
            .filter(block => block.activeDays.includes(currentDay))
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        for (const block of todayBlocks) {
            if (currentTime >= block.startTime && currentTime < block.endTime) {
                return block.phase;
            }
        }
        
        return 'FREE_TIME';
    }
    
    checkPhase() {
        if (this.isManualOverride) return;
        
        const newPhase = this.detectCurrentPhase();
        if (newPhase !== this.currentPhase) {
            this.setPhase(newPhase, false);
        }
    }
    
    setPhase(phaseName, manual = false) {
        this.currentPhase = phaseName;
        this.isManualOverride = manual;
        
        if (manual) {
            localStorage.setItem('currentPhase', phaseName);
            localStorage.setItem('isManualOverride', 'true');
        } else {
            localStorage.removeItem('currentPhase');
            localStorage.removeItem('isManualOverride');
        }
        
        // Load shutdown form when entering SHUTDOWN phase
        if (phaseName === 'SHUTDOWN') {
            this.loadShutdown();
        }
        
        this.renderAll();
    }
    
    syncToSchedule() {
        this.isManualOverride = false;
        localStorage.removeItem('currentPhase');
        localStorage.removeItem('isManualOverride');
        this.currentPhase = this.detectCurrentPhase();
        this.renderAll();
    }
    
    renderAll() {
        // Force hide ALL widgets first, then show only what's needed
        const allWidgetIds = [
            'time-widget', 'mood-widget', 'tasks-widget', 
            'notes-work', 'meditation', 'shutdown-form', 'gaming-timer', 
            'watchlist', 'readinglist', 'reading-protocol', 'export', 'list-widget'
        ];
        
        allWidgetIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = 'none';
            }
        });
        
        // Now show only widgets for current phase
        const widgets = {
            'time-widget': 'time',
            'mood-widget': 'mood',
            'tasks-widget': 'tasks-widget',
            'notes-work': 'notes-work',
            'meditation': 'meditation',
            'shutdown-form': 'shutdown-form',
            'gaming-timer': 'gaming-timer',
            'watchlist': 'watchlist',
            'readinglist': 'readinglist',
            'reading-protocol': 'reading-protocol',
            'export': 'export'
        };
        
        Object.entries(widgets).forEach(([id, widgetId]) => {
            const el = document.getElementById(id);
            if (el && this.shouldShowWidget(widgetId)) {
                el.style.display = 'block';
            }
        });
        
        this.renderTasks();
        this.renderNotes();
        this.renderMoodHistory();
        this.renderList();
        this.updateReadingProtocol();
        this.renderPhaseMenu();
        
        // Show/hide rest mode banner
        const banner = document.getElementById('restModeBanner');
        if (banner) {
            const dismissed = localStorage.getItem('restBannerDismissed') === 'true';
            if (this.isRestMode && !dismissed) {
                banner.classList.remove('hidden');
            } else {
                banner.classList.add('hidden');
            }
        }
    }
    
    updateReadingProtocol() {
        const protocolWidget = document.getElementById('reading-protocol');
        if (!protocolWidget || !this.shouldShowWidget('reading-protocol')) return;
        
        const now = new Date();
        const day = now.getDay();
        const readingTypeEl = document.getElementById('readingType');
        const restNoteEl = document.getElementById('restModeNote');
        
        if (this.isRestMode) {
            readingTypeEl.textContent = 'Fiction 📚 (Rest Mode)';
            restNoteEl.classList.remove('hidden');
        } else {
            if ([1,3,5].includes(day)) {
                readingTypeEl.textContent = 'Technical Reading 📖';
            } else if ([2,4,6].includes(day)) {
                readingTypeEl.textContent = 'Fiction Reading 📚';
            } else {
                readingTypeEl.textContent = 'Rest or catch-up 📖📚';
            }
            restNoteEl.classList.add('hidden');
        }
    }
    
    async saveShutdown() {
        const shipped = document.getElementById('shutdownShipped').value.trim();
        const tomorrow = document.getElementById('shutdownTomorrow').value.trim();
        
        if (!shipped && !tomorrow) return;
        
        const today = new Date().toISOString().split('T')[0];
        const existing = await this.db.getAll('work_notes');
        const todayNote = existing.find(n => n.date === today);
        
        const noteData = {
            date: today,
            shipped: shipped,
            tomorrow: tomorrow,
            timestamp: new Date().toISOString()
        };
        
        if (todayNote) {
            noteData.id = todayNote.id;
            await this.db.update('work_notes', noteData);
        } else {
            await this.db.add('work_notes', noteData);
        }
        
        document.getElementById('shutdownShipped').value = '';
        document.getElementById('shutdownTomorrow').value = '';
    }
    
    async loadShutdown() {
        const today = new Date().toISOString().split('T')[0];
        const existing = await this.db.getAll('work_notes');
        const todayNote = existing.find(n => n.date === today);
        
        if (todayNote) {
            document.getElementById('shutdownShipped').value = todayNote.shipped || '';
            document.getElementById('shutdownTomorrow').value = todayNote.tomorrow || '';
        }
    }
    
    async exportData() {
        const data = {
            export_date: new Date().toISOString(),
            tasks: await this.db.getAll('tasks'),
            notes: await this.db.getAll('notes'),
            moods: await this.db.getAll('moods'),
            daily_logs: await this.db.getAll('daily_logs'),
            work_notes: await this.db.getAll('work_notes'),
            readinglist: await this.db.getAll('readinglist'),
            watchlist: await this.db.getAll('watchlist'),
            schedule: await this.db.getAll('schedule')
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `personalos_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    openSettings() {
        document.getElementById('settingsModal').classList.remove('hidden');
        this.showSettingsTab('schedule');
    }
    
    closeSettings() {
        document.getElementById('settingsModal').classList.add('hidden');
    }
    
    showSettingsTab(tabName) {
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.classList.remove('border-primary', 'text-white');
            btn.classList.add('text-gray-400');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('border-primary', 'text-white');
        document.querySelector(`[data-tab="${tabName}"]`).classList.remove('text-gray-400');
        
        const content = document.getElementById('settingsContent');
        if (tabName === 'schedule') {
            this.renderScheduleEditor(content);
        } else if (tabName === 'preferences') {
            this.renderPreferences(content);
        } else if (tabName === 'about') {
            this.renderAbout(content);
        }
    }
    
    async renderScheduleEditor(container) {
        const blocks = await this.db.getAll('schedule');
        container.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-semibold">Schedule Blocks</h3>
                    <button onclick="app.addScheduleBlock()" class="bg-primary hover:bg-primary/80 px-4 py-2 rounded-lg text-sm transition-colors">Add Block</button>
                </div>
                <div id="scheduleBlocks" class="space-y-3">
                    ${blocks.map(block => this.renderScheduleBlock(block)).join('')}
                </div>
                <button onclick="app.resetSchedule()" class="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm transition-colors">Reset to Default</button>
            </div>
        `;
    }
    
    renderScheduleBlock(block) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return `
            <div class="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-4">
                <div class="grid md:grid-cols-2 gap-4 mb-3">
                    <div>
                        <label class="text-xs text-gray-400 mb-1 block">Time</label>
                        <input type="time" value="${block.startTime}" onchange="app.updateScheduleBlock(${block.id}, 'startTime', this.value)" class="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors">
                        <span class="mx-2 text-gray-400">-</span>
                        <input type="time" value="${block.endTime}" onchange="app.updateScheduleBlock(${block.id}, 'endTime', this.value)" class="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors">
                    </div>
                    <div>
                        <label class="text-xs text-gray-400 mb-1 block">Label</label>
                        <input type="text" value="${block.label}" onchange="app.updateScheduleBlock(${block.id}, 'label', this.value)" class="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="text-xs text-gray-400 mb-1 block">Active Days</label>
                    <div class="flex gap-2">
                        ${days.map((day, idx) => `
                            <label class="flex items-center gap-1 text-xs">
                                <input type="checkbox" ${block.activeDays.includes(idx) ? 'checked' : ''} 
                                       onchange="app.toggleScheduleDay(${block.id}, ${idx})">
                                ${day}
                            </label>
                        `).join('')}
                    </div>
                </div>
                <button onclick="app.deleteScheduleBlock(${block.id})" class="text-red-400 hover:text-red-300 text-sm">Delete</button>
            </div>
        `;
    }
    
    async updateScheduleBlock(id, field, value) {
        const blocks = await this.db.getAll('schedule');
        const block = blocks.find(b => b.id === id);
        if (block) {
            block[field] = value;
            await this.db.update('schedule', block);
            this.schedule = await this.db.getAll('schedule');
        }
    }
    
    async toggleScheduleDay(blockId, dayIndex) {
        const blocks = await this.db.getAll('schedule');
        const block = blocks.find(b => b.id === blockId);
        if (block) {
            const idx = block.activeDays.indexOf(dayIndex);
            if (idx > -1) {
                block.activeDays.splice(idx, 1);
            } else {
                block.activeDays.push(dayIndex);
            }
            await this.db.update('schedule', block);
            this.schedule = await this.db.getAll('schedule');
            this.showSettingsTab('schedule');
        }
    }
    
    async deleteScheduleBlock(id) {
        if (!confirm('Delete this schedule block?')) return;
        await this.db.delete('schedule', id);
        this.schedule = await this.db.getAll('schedule');
        this.showSettingsTab('schedule');
    }
    
    async resetSchedule() {
        if (!confirm('Reset schedule to default? This will delete all custom blocks.')) return;
        const blocks = await this.db.getAll('schedule');
        for (const block of blocks) {
            await this.db.delete('schedule', block.id);
        }
        await this.db.initDefaultSchedule();
        this.schedule = await this.db.getAll('schedule');
        this.showSettingsTab('schedule');
    }
    
    async addScheduleBlock() {
        const modal = document.getElementById('modal');
        const title = document.getElementById('modalTitle');
        const content = document.getElementById('modalContent');
        const submit = document.getElementById('modalSubmit');
        
        title.textContent = 'Add Schedule Block';
        content.innerHTML = `
            <input id="blockStartTime" type="time" placeholder="Start Time" class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:border-primary transition-colors">
            <input id="blockEndTime" type="time" placeholder="End Time" class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:border-primary transition-colors">
            <input id="blockPhase" type="text" placeholder="Phase (e.g., WORK)" class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:border-primary transition-colors">
            <input id="blockLabel" type="text" placeholder="Label" class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:border-primary transition-colors">
        `;
        
        modal.classList.remove('hidden');
        
        submit.onclick = async () => {
            const startTime = document.getElementById('blockStartTime').value;
            const endTime = document.getElementById('blockEndTime').value;
            const phase = document.getElementById('blockPhase').value.trim();
            const label = document.getElementById('blockLabel').value.trim();
            
            if (startTime && endTime && phase && label) {
                await this.db.add('schedule', {
                    startTime,
                    endTime,
                    phase,
                    label,
                    description: '',
                    activeDays: [1,2,3,4,5],
                    order: 999
                });
                this.schedule = await this.db.getAll('schedule');
                this.closeModal();
                this.showSettingsTab('schedule');
            }
        };
    }
    
    renderPreferences(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div>
                    <h3 class="text-lg font-semibold mb-4">Notifications</h3>
                    <label class="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg cursor-pointer hover:border-primary transition-colors">
                        <input type="checkbox" id="notificationsEnabled" onchange="localStorage.setItem('notificationsEnabled', this.checked)" class="w-4 h-4 accent-primary">
                        <span>Enable browser notifications</span>
                    </label>
                </div>
                <div>
                    <h3 class="text-lg font-semibold mb-4">View Options</h3>
                    <label class="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg cursor-pointer hover:border-primary transition-colors">
                        <input type="checkbox" id="viewAllDataSetting" onchange="app.toggleViewAllSetting(this.checked)" class="w-4 h-4 accent-primary">
                        <span>Show all widgets regardless of phase</span>
                    </label>
                </div>
            </div>
        `;
        const notificationsCheckbox = document.getElementById('notificationsEnabled');
        const viewAllCheckbox = document.getElementById('viewAllDataSetting');
        if (notificationsCheckbox) {
            notificationsCheckbox.checked = localStorage.getItem('notificationsEnabled') === 'true';
        }
        if (viewAllCheckbox) {
            viewAllCheckbox.checked = localStorage.getItem('viewAllData') === 'true';
        }
    }
    
    toggleViewAllSetting(enabled) {
        this.viewAllData = enabled;
        localStorage.setItem('viewAllData', enabled.toString());
        this.renderAll();
    }
    
    renderAbout(container) {
        container.innerHTML = `
            <div class="space-y-4">
                <div>
                    <h3 class="text-lg font-semibold mb-2">PersonalOS</h3>
                    <p class="text-gray-400 text-sm">Version 2.0</p>
                    <p class="text-gray-400 text-sm mt-2">Database Version: ${this.db.version}</p>
                </div>
                <div>
                    <button onclick="app.exportData()" class="bg-primary hover:bg-primary/80 px-4 py-2 rounded">Export Data</button>
                </div>
            </div>
        `;
    }

    updateTime() {
        const now = new Date();
        const timeEl = document.getElementById('time');
        const dateEl = document.getElementById('date');
        
        if (timeEl) {
            timeEl.textContent = now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
        }
        
        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
            });
        }
    }

    selectMood(emoji) {
        this.selectedMood = emoji;
        // Update UI to show selection
        document.querySelectorAll('.mood-btn').forEach(btn => {
            if (btn.dataset.mood === emoji) {
                btn.style.backgroundColor = '#008080';
                btn.style.transform = 'scale(1.1)';
            } else {
                btn.style.backgroundColor = '';
                btn.style.transform = '';
            }
        });
    }

    async saveMood() {
        const physical = document.getElementById('physicalSlider').value;
        const mental = document.getElementById('mentalSlider').value;
        const mood = this.selectedMood;
        
        if (!mood) {
            return;
        }
        
        const today = new Date().toISOString().split('T')[0];
        const timestamp = new Date().toISOString();
        
        // Save to moods (backwards compatibility)
        await this.db.add('moods', {
            date: today,
            physical: parseInt(physical),
            mental: parseInt(mental),
            mood: mood,
            timestamp: timestamp
        });
        
        // Also save to daily_logs
        await this.db.add('daily_logs', {
            date: today,
            physical: parseInt(physical),
            mental: parseInt(mental),
            mood: mood,
            timestamp: timestamp
        });
        
        // Check fatigue level
        await this.checkFatigueLevel();
        
        // Reset form
        document.getElementById('physicalSlider').value = 3;
        document.getElementById('mentalSlider').value = 3;
        document.getElementById('physicalValue').textContent = 3;
        document.getElementById('mentalValue').textContent = 3;
        this.selectedMood = null;
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.style.backgroundColor = '';
            btn.style.transform = '';
        });
        
        await this.renderMoodHistory();
    }
    
    async checkFatigueLevel() {
        const logs = await this.db.getAll('daily_logs');
        if (logs.length === 0) {
            this.isRestMode = false;
            return;
        }
        
        const latest = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        const wasRestMode = this.isRestMode;
        this.isRestMode = latest.mental >= 4;
        
        if (this.isRestMode !== wasRestMode) {
            localStorage.setItem('isRestMode', this.isRestMode.toString());
            if (this.isRestMode) {
                document.body.classList.add('rest-mode');
            } else {
                document.body.classList.remove('rest-mode');
                localStorage.removeItem('restBannerDismissed');
            }
        }
    }

    async renderMoodHistory() {
        const allMoods = await this.db.getAll('moods');
        const moods = allMoods
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 7);
        
        const container = document.getElementById('moodHistory');
        if (!container) return;
        
        if (moods.length === 0) {
            container.innerHTML = '<div class="text-gray-500 text-xs">No mood entries yet</div>';
            return;
        }
        
        container.innerHTML = moods.map(m => {
            const date = new Date(m.timestamp);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            
            return `
                <div class="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-2 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">${m.mood}</span>
                        <div class="text-xs">
                            <div class="text-gray-400">${dateStr} ${timeStr}</div>
                            <div class="text-gray-500">P:${m.physical} M:${m.mental}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async renderTasks() {
        const allTasks = await this.db.getAll('tasks');
        
        const container = document.getElementById('tasks');
        if (container && this.shouldShowWidget('tasks-widget')) {
            if (allTasks.length === 0) {
                container.innerHTML = '<div class="text-gray-500 text-sm">No tasks yet</div>';
            } else {
                container.innerHTML = allTasks.map(task => `
                    <div class="flex items-center gap-3 group">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} 
                               onchange="app.toggleTask(${task.id})"
                               class="w-4 h-4 accent-primary cursor-pointer">
                        <span class="text-gray-300 flex-1 ${task.completed ? 'line-through opacity-50' : ''}">${task.text}</span>
                        <button onclick="app.deleteTask(${task.id})" 
                                class="text-red-500 opacity-0 group-hover:opacity-100 text-sm">×</button>
                    </div>
                `).join('');
            }
        }
    }

    async toggleTask(id) {
        const tasks = await this.db.getAll('tasks');
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            await this.db.update('tasks', task);
            await this.renderTasks();
        }
    }

    async deleteTask(id) {
        await this.db.delete('tasks', id);
        await this.renderTasks();
    }

    addTask() {
        const modal = document.getElementById('modal');
        const title = document.getElementById('modalTitle');
        const content = document.getElementById('modalContent');
        const submit = document.getElementById('modalSubmit');
        
        title.textContent = 'Add Task';
        content.innerHTML = '<input id="taskInput" type="text" placeholder="Task description" class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors">';
        
        modal.classList.remove('hidden');
        setTimeout(() => document.getElementById('taskInput').focus(), 100);
        
        submit.onclick = async () => {
            const input = document.getElementById('taskInput').value.trim();
            if (input) {
                await this.db.add('tasks', { 
                    text: input, 
                    completed: false
                });
                await this.renderTasks();
                this.closeModal();
            }
        };
    }

    async renderNotes() {
        const allNotes = await this.db.getAll('notes');
        const container = document.getElementById('notes-work-list');
        
        if (container && this.shouldShowWidget('notes-work')) {
            if (allNotes.length === 0) {
                container.innerHTML = '<div class="text-gray-500 text-sm">No notes yet</div>';
            } else {
                container.innerHTML = allNotes.map(note => `
                    <div class="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-3 group relative">
                        <button onclick="app.deleteNote(${note.id})" 
                                class="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 text-sm">×</button>
                        <div class="font-medium text-sm mb-1">${note.title}</div>
                        <div class="text-gray-400 text-xs">${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</div>
                    </div>
                `).join('');
            }
        }
    }

    async deleteNote(id) {
        await this.db.delete('notes', id);
        await this.renderNotes();
    }
    
    addNote() {
        const modal = document.getElementById('modal');
        const title = document.getElementById('modalTitle');
        const content = document.getElementById('modalContent');
        const submit = document.getElementById('modalSubmit');
        
        title.textContent = 'Add Note';
        content.innerHTML = `
            <input id="noteTitle" type="text" placeholder="Note title" class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:border-primary transition-colors">
            <textarea id="noteContent" placeholder="Note content" rows="4" class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors"></textarea>
        `;
        
        modal.classList.remove('hidden');
        setTimeout(() => document.getElementById('noteTitle').focus(), 100);
        
        submit.onclick = async () => {
            const noteTitle = document.getElementById('noteTitle').value.trim();
            const noteContent = document.getElementById('noteContent').value.trim();
            if (noteTitle && noteContent) {
                await this.db.add('notes', { 
                    title: noteTitle, 
                    content: noteContent
                });
                await this.renderNotes();
                this.closeModal();
            }
        };
    }

    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async renderReadingList() {
        if (!this.shouldShowWidget('readinglist')) return;
        
        const allBooks = await this.db.getAll('readinglist');
        
        // Rest mode filtering during DEEP_WORK
        let filteredBooks = allBooks;
        if (this.isRestMode && this.currentPhase === 'DEEP_WORK') {
            filteredBooks = allBooks.filter(b => b.category === 'fiction');
        }
        
        const container = document.getElementById('readingList');
        if (!container) return;
        
        if (filteredBooks.length === 0) {
            container.innerHTML = '<div class="text-gray-500 text-sm">No books yet</div>';
            return;
        }
        
        const pending = filteredBooks.filter(b => !b.completed);
        const completed = filteredBooks.filter(b => b.completed);
        
        container.innerHTML = [...pending, ...completed].map(book => `
            <div class="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-3 group relative ${book.completed ? 'opacity-50' : ''}">
                <div class="flex items-start gap-3">
                    <input type="checkbox" ${book.completed ? 'checked' : ''} 
                           onchange="app.toggleBook(${book.id})"
                           class="w-4 h-4 mt-1 accent-primary cursor-pointer">
                    <div class="flex-1 cursor-pointer" onclick="app.editBook(${book.id})">
                        <div class="font-medium text-sm mb-1 ${book.completed ? 'line-through' : ''}">${book.title}</div>
                        <div class="text-xs text-gray-500 flex items-center gap-1">
                            <span class="material-symbols-outlined" style="font-size: 16px;">menu_book</span>
                            ${book.category === 'fiction' ? 'Fiction 📚' : 'Technical 📖'}
                        </div>
                        ${book.notes ? `<div class="text-xs text-gray-400 mt-1">${book.notes}</div>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    async renderWatchList() {
        if (!this.shouldShowWidget('watchlist')) return;
        
        const allShows = await this.db.getAll('watchlist');
        const container = document.getElementById('watchList');
        if (!container) return;
        
        if (allShows.length === 0) {
            container.innerHTML = '<div class="text-gray-500 text-sm">No shows yet</div>';
            return;
        }
        
        const pending = allShows.filter(s => !s.completed);
        const completed = allShows.filter(s => s.completed);
        
        container.innerHTML = [...pending, ...completed].map(show => `
            <div class="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-3 group relative ${show.completed ? 'opacity-50' : ''}">
                <div class="flex items-start gap-3">
                    <input type="checkbox" ${show.completed ? 'checked' : ''} 
                           onchange="app.toggleShow(${show.id})"
                           class="w-4 h-4 mt-1 accent-primary cursor-pointer">
                    <div class="flex-1 cursor-pointer" onclick="app.editShow(${show.id})">
                        <div class="font-medium text-sm mb-1 ${show.completed ? 'line-through' : ''}">${show.title}</div>
                        <div class="text-xs text-gray-500 flex items-center gap-1">
                            <span class="material-symbols-outlined" style="font-size: 16px;">movie</span>
                            Show/Movie 🎬
                        </div>
                        ${show.notes ? `<div class="text-xs text-gray-400 mt-1">${show.notes}</div>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    async renderList() {
        // Legacy support - try to render old list if containers don't exist
        const oldContainer = document.getElementById('list');
        if (oldContainer) {
            const allItems = await this.db.getAll('list');
            
            if (allItems.length === 0) {
                oldContainer.innerHTML = '<div class="text-gray-500 text-sm md:col-span-2">No items yet</div>';
                return;
            }
            
            const pending = allItems.filter(i => !i.completed);
            const completed = allItems.filter(i => i.completed);
            
            oldContainer.innerHTML = [...pending, ...completed].map(item => `
                <div class="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-3 group relative ${item.completed ? 'opacity-50' : ''}">
                    <div class="flex items-start gap-3">
                        <input type="checkbox" ${item.completed ? 'checked' : ''} 
                               onchange="app.toggleListItem(${item.id})"
                               class="w-4 h-4 mt-1 accent-primary cursor-pointer">
                        <div class="flex-1 cursor-pointer" onclick="app.editListItem(${item.id})">
                            <div class="font-medium text-sm mb-1 ${item.completed ? 'line-through' : ''}">${item.title}</div>
                            <div class="text-xs text-gray-500 flex items-center gap-1">
                                <span class="material-symbols-outlined" style="font-size: 16px;">${item.type === 'book' ? 'menu_book' : 'movie'}</span>
                                ${item.type === 'book' ? 'Book' : 'Show/Movie'}
                            </div>
                            ${item.notes ? `<div class="text-xs text-gray-400 mt-1">${item.notes}</div>` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            await this.renderReadingList();
            await this.renderWatchList();
        }
    }

    async toggleListItem(id) {
        const items = await this.db.getAll('list');
        const item = items.find(i => i.id === id);
        if (item) {
            item.completed = !item.completed;
            await this.db.update('list', item);
            await this.renderList();
        }
    }
    
    async toggleBook(id) {
        const books = await this.db.getAll('readinglist');
        const book = books.find(b => b.id === id);
        if (book) {
            book.completed = !book.completed;
            await this.db.update('readinglist', book);
            await this.renderReadingList();
        }
    }
    
    async toggleShow(id) {
        const shows = await this.db.getAll('watchlist');
        const show = shows.find(s => s.id === id);
        if (show) {
            show.completed = !show.completed;
            await this.db.update('watchlist', show);
            await this.renderWatchList();
        }
    }

    addBook() {
        const modal = document.getElementById('modal');
        const title = document.getElementById('modalTitle');
        const content = document.getElementById('modalContent');
        const submit = document.getElementById('modalSubmit');
        
        title.textContent = 'Add Book';
        content.innerHTML = `
            <input id="bookTitle" type="text" placeholder="Book title" class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:border-primary transition-colors">
            <div class="mb-3">
                <label class="text-sm text-gray-400 mb-2 block">Category</label>
                <div class="flex gap-3">
                    <label class="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 cursor-pointer hover:border-primary transition-colors">
                        <input type="radio" name="bookCategory" value="technical" checked class="mr-2">
                        <span>Technical 📖</span>
                    </label>
                    <label class="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 cursor-pointer hover:border-primary transition-colors">
                        <input type="radio" name="bookCategory" value="fiction" class="mr-2">
                        <span>Fiction 📚</span>
                    </label>
                </div>
            </div>
            <textarea id="bookNotes" placeholder="Notes (optional)" rows="3" class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors"></textarea>
        `;
        
        modal.classList.remove('hidden');
        setTimeout(() => document.getElementById('bookTitle').focus(), 100);
        
        submit.onclick = async () => {
            const bookTitle = document.getElementById('bookTitle').value.trim();
            const bookCategory = document.querySelector('input[name="bookCategory"]:checked').value;
            const bookNotes = document.getElementById('bookNotes').value.trim();
            
            if (bookTitle) {
                await this.db.add('readinglist', { 
                    title: bookTitle,
                    category: bookCategory,
                    notes: bookNotes,
                    completed: false
                });
                await this.renderReadingList();
                this.closeModal();
            }
        };
    }
    
    async editBook(id) {
        const books = await this.db.getAll('readinglist');
        const book = books.find(b => b.id === id);
        if (!book) return;
        
        const modal = document.getElementById('modal');
        const title = document.getElementById('modalTitle');
        const content = document.getElementById('modalContent');
        const submit = document.getElementById('modalSubmit');
        
        title.textContent = 'Edit Book';
        content.innerHTML = `
            <input id="bookTitle" type="text" value="${book.title}" class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:border-primary transition-colors">
            <div class="mb-3">
                <label class="text-sm text-gray-400 mb-2 block">Category</label>
                <div class="flex gap-3">
                    <label class="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 cursor-pointer hover:border-primary transition-colors">
                        <input type="radio" name="bookCategory" value="technical" ${book.category === 'technical' ? 'checked' : ''} class="mr-2">
                        <span>Technical 📖</span>
                    </label>
                    <label class="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 cursor-pointer hover:border-primary transition-colors">
                        <input type="radio" name="bookCategory" value="fiction" ${book.category === 'fiction' ? 'checked' : ''} class="mr-2">
                        <span>Fiction 📚</span>
                    </label>
                </div>
            </div>
            <textarea id="bookNotes" placeholder="Notes (optional)" rows="3" class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors">${book.notes || ''}</textarea>
        `;
        
        modal.classList.remove('hidden');
        setTimeout(() => document.getElementById('bookTitle').focus(), 100);
        
        submit.onclick = async () => {
            const bookTitle = document.getElementById('bookTitle').value.trim();
            const bookCategory = document.querySelector('input[name="bookCategory"]:checked').value;
            const bookNotes = document.getElementById('bookNotes').value.trim();
            
            if (bookTitle) {
                book.title = bookTitle;
                book.category = bookCategory;
                book.notes = bookNotes;
                await this.db.update('readinglist', book);
                await this.renderReadingList();
                this.closeModal();
            }
        };
    }
    
    addShow() {
        const modal = document.getElementById('modal');
        const title = document.getElementById('modalTitle');
        const content = document.getElementById('modalContent');
        const submit = document.getElementById('modalSubmit');
        
        title.textContent = 'Add Show/Movie';
        content.innerHTML = `
            <input id="showTitle" type="text" placeholder="Title" class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:border-primary transition-colors">
            <textarea id="showNotes" placeholder="Notes (optional)" rows="3" class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors"></textarea>
        `;
        
        modal.classList.remove('hidden');
        setTimeout(() => document.getElementById('showTitle').focus(), 100);
        
        submit.onclick = async () => {
            const showTitle = document.getElementById('showTitle').value.trim();
            const showNotes = document.getElementById('showNotes').value.trim();
            
            if (showTitle) {
                await this.db.add('watchlist', { 
                    title: showTitle,
                    notes: showNotes,
                    completed: false
                });
                await this.renderWatchList();
                this.closeModal();
            }
        };
    }
    
    async editShow(id) {
        const shows = await this.db.getAll('watchlist');
        const show = shows.find(s => s.id === id);
        if (!show) return;
        
        const modal = document.getElementById('modal');
        const title = document.getElementById('modalTitle');
        const content = document.getElementById('modalContent');
        const submit = document.getElementById('modalSubmit');
        
        title.textContent = 'Edit Show/Movie';
        content.innerHTML = `
            <input id="showTitle" type="text" value="${show.title}" class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:border-primary transition-colors">
            <textarea id="showNotes" placeholder="Notes (optional)" rows="3" class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors">${show.notes || ''}</textarea>
        `;
        
        modal.classList.remove('hidden');
        setTimeout(() => document.getElementById('showTitle').focus(), 100);
        
        submit.onclick = async () => {
            const showTitle = document.getElementById('showTitle').value.trim();
            const showNotes = document.getElementById('showNotes').value.trim();
            
            if (showTitle) {
                show.title = showTitle;
                show.notes = showNotes;
                await this.db.update('watchlist', show);
                await this.renderWatchList();
                this.closeModal();
            }
        };
    }

    addListItem() {
        // Legacy support - redirect to appropriate method
        const container = document.getElementById('list');
        if (container) {
            // Old combined list - keep old behavior
            const modal = document.getElementById('modal');
            const title = document.getElementById('modalTitle');
            const content = document.getElementById('modalContent');
            const submit = document.getElementById('modalSubmit');
            
            title.textContent = 'Add to List';
            content.innerHTML = `
                <input id="itemTitle" type="text" placeholder="Title" class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:border-primary transition-colors">
                <div class="mb-3">
                    <label class="text-sm text-gray-400 mb-2 block">Type</label>
                    <div class="flex gap-3">
                        <label class="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 cursor-pointer hover:border-primary transition-colors">
                            <input type="radio" name="itemType" value="book" checked class="mr-2">
                            <span class="material-symbols-outlined align-middle" style="font-size: 18px;">menu_book</span>
                            <span class="align-middle">Book</span>
                        </label>
                        <label class="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 cursor-pointer hover:border-primary transition-colors">
                            <input type="radio" name="itemType" value="show" class="mr-2">
                            <span class="material-symbols-outlined align-middle" style="font-size: 18px;">movie</span>
                            <span class="align-middle">Show/Movie</span>
                        </label>
                    </div>
                </div>
                <textarea id="itemNotes" placeholder="Notes (optional)" rows="3" class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors"></textarea>
            `;
            
            modal.classList.remove('hidden');
            setTimeout(() => document.getElementById('itemTitle').focus(), 100);
            
            submit.onclick = async () => {
                const itemTitle = document.getElementById('itemTitle').value.trim();
                const itemType = document.querySelector('input[name="itemType"]:checked').value;
                const itemNotes = document.getElementById('itemNotes').value.trim();
                
                if (itemTitle) {
                    await this.db.add('list', { 
                        title: itemTitle,
                        type: itemType,
                        notes: itemNotes,
                        completed: false
                    });
                    await this.renderList();
                    this.closeModal();
                }
            };
        }
    }

    async editListItem(id) {
        const items = await this.db.getAll('list');
        const item = items.find(i => i.id === id);
        if (!item) return;
        
        const modal = document.getElementById('modal');
        const title = document.getElementById('modalTitle');
        const content = document.getElementById('modalContent');
        const submit = document.getElementById('modalSubmit');
        
        title.textContent = 'Edit Item';
        content.innerHTML = `
            <input id="itemTitle" type="text" value="${item.title}" class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:border-primary transition-colors">
            <div class="mb-3">
                <label class="text-sm text-gray-400 mb-2 block">Type</label>
                <div class="flex gap-3">
                    <label class="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 cursor-pointer hover:border-primary transition-colors">
                        <input type="radio" name="itemType" value="book" ${item.type === 'book' ? 'checked' : ''} class="mr-2">
                        <span class="material-symbols-outlined align-middle" style="font-size: 18px;">menu_book</span>
                        <span class="align-middle">Book</span>
                    </label>
                    <label class="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 cursor-pointer hover:border-primary transition-colors">
                        <input type="radio" name="itemType" value="show" ${item.type === 'show' ? 'checked' : ''} class="mr-2">
                        <span class="material-symbols-outlined align-middle" style="font-size: 18px;">movie</span>
                        <span class="align-middle">Show/Movie</span>
                    </label>
                </div>
            </div>
            <textarea id="itemNotes" placeholder="Notes (optional)" rows="3" class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors">${item.notes || ''}</textarea>
        `;
        
        modal.classList.remove('hidden');
        setTimeout(() => document.getElementById('itemTitle').focus(), 100);
        
        submit.onclick = async () => {
            const itemTitle = document.getElementById('itemTitle').value.trim();
            const itemType = document.querySelector('input[name="itemType"]:checked').value;
            const itemNotes = document.getElementById('itemNotes').value.trim();
            
            if (itemTitle) {
                item.title = itemTitle;
                item.type = itemType;
                item.notes = itemNotes;
                await this.db.update('list', item);
                await this.renderList();
                this.closeModal();
            }
        };
    }
}


<script>
    import { onMount } from 'svelte';
    import { db, schedule, viewAllData } from '../lib/stores.js';
    import { exportData } from '../lib/export.js';
    
    let showModal = false;
    let activeTab = 'schedule';
    let scheduleBlocks = [];
    let showAddBlockModal = false;
    let newBlock = {
        startTime: '',
        endTime: '',
        phase: '',
        label: '',
        activeDays: [1,2,3,4,5]
    };
    let notificationsEnabled = false;
    
    onMount(async () => {
        await loadSchedule();
        notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    });
    
    async function loadSchedule() {
        const blocks = await db.getAll('schedule');
        scheduleBlocks = blocks;
        schedule.set(blocks);
    }
    
    function openSettings() {
        showModal = true;
        activeTab = 'schedule';
    }
    
    export function open() {
        openSettings();
    }
    
    function closeSettings() {
        showModal = false;
    }
    
    async function updateScheduleBlock(id, field, value) {
        const blocks = await db.getAll('schedule');
        const block = blocks.find(b => b.id === id);
        if (block) {
            block[field] = value;
            await db.update('schedule', block);
            await loadSchedule();
        }
    }
    
    async function toggleScheduleDay(blockId, dayIndex) {
        const blocks = await db.getAll('schedule');
        const block = blocks.find(b => b.id === blockId);
        if (block) {
            const idx = block.activeDays.indexOf(dayIndex);
            if (idx > -1) {
                block.activeDays.splice(idx, 1);
            } else {
                block.activeDays.push(dayIndex);
            }
            await db.update('schedule', block);
            await loadSchedule();
        }
    }
    
    async function deleteScheduleBlock(id) {
        if (!confirm('Delete this schedule block?')) return;
        await db.delete('schedule', id);
        await loadSchedule();
    }
    
    async function resetSchedule() {
        if (!confirm('Reset schedule to default? This will delete all custom blocks.')) return;
        const blocks = await db.getAll('schedule');
        for (const block of blocks) {
            await db.delete('schedule', block.id);
        }
        await db.initDefaultSchedule();
        await loadSchedule();
    }
    
    async function addScheduleBlock() {
        if (!newBlock.startTime || !newBlock.endTime || !newBlock.phase || !newBlock.label) return;
        
        await db.add('schedule', {
            startTime: newBlock.startTime,
            endTime: newBlock.endTime,
            phase: newBlock.phase,
            label: newBlock.label,
            description: '',
            activeDays: newBlock.activeDays,
            order: 999
        });
        
        newBlock = {
            startTime: '',
            endTime: '',
            phase: '',
            label: '',
            activeDays: [1,2,3,4,5]
        };
        showAddBlockModal = false;
        await loadSchedule();
    }
    
    function toggleViewAllSetting(enabled) {
        viewAllData.set(enabled);
        localStorage.setItem('viewAllData', enabled.toString());
    }
    
    function toggleNotifications(enabled) {
        localStorage.setItem('notificationsEnabled', enabled.toString());
        notificationsEnabled = enabled;
    }
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
</script>

{#if showModal}
    <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" on:click={closeSettings}>
        <div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" on:click|stopPropagation>
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-semibold">Settings</h2>
                <button on:click={closeSettings} class="text-gray-400 hover:text-white">✕</button>
            </div>
            <div class="flex gap-4 border-b border-[#2a2a2a] mb-4">
                <button 
                    on:click={() => activeTab = 'schedule'}
                    class="px-4 py-2 border-b-2 transition-colors {activeTab === 'schedule' ? 'border-primary text-white' : 'text-gray-400 border-transparent'}"
                >
                    Schedule
                </button>
                <button 
                    on:click={() => activeTab = 'preferences'}
                    class="px-4 py-2 border-b-2 transition-colors {activeTab === 'preferences' ? 'border-primary text-white' : 'text-gray-400 border-transparent'}"
                >
                    Preferences
                </button>
                <button 
                    on:click={() => activeTab = 'about'}
                    class="px-4 py-2 border-b-2 transition-colors {activeTab === 'about' ? 'border-primary text-white' : 'text-gray-400 border-transparent'}"
                >
                    About
                </button>
            </div>
            <div class="mt-4">
                {#if activeTab === 'schedule'}
                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <h3 class="text-lg font-semibold">Schedule Blocks</h3>
                            <button 
                                on:click={() => showAddBlockModal = true}
                                class="bg-primary hover:bg-primary/80 px-4 py-2 rounded-lg text-sm transition-colors"
                            >
                                Add Block
                            </button>
                        </div>
                        <div class="space-y-3">
                            {#each scheduleBlocks as block}
                                <div class="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-4">
                                    <div class="grid md:grid-cols-2 gap-4 mb-3">
                                        <div>
                                            <label class="text-xs text-gray-400 mb-1 block">Time</label>
                                            <input 
                                                type="time" 
                                                value={block.startTime} 
                                                on:change={(e) => updateScheduleBlock(block.id, 'startTime', e.target.value)}
                                                class="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                                            />
                                            <span class="mx-2 text-gray-400">-</span>
                                            <input 
                                                type="time" 
                                                value={block.endTime} 
                                                on:change={(e) => updateScheduleBlock(block.id, 'endTime', e.target.value)}
                                                class="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label class="text-xs text-gray-400 mb-1 block">Label</label>
                                            <input 
                                                type="text" 
                                                value={block.label} 
                                                on:change={(e) => updateScheduleBlock(block.id, 'label', e.target.value)}
                                                class="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="text-xs text-gray-400 mb-1 block">Active Days</label>
                                        <div class="flex gap-2">
                                            {#each days as day, idx}
                                                <label class="flex items-center gap-1 text-xs">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={block.activeDays.includes(idx)}
                                                        on:change={() => toggleScheduleDay(block.id, idx)}
                                                    />
                                                    {day}
                                                </label>
                                            {/each}
                                        </div>
                                    </div>
                                    <button 
                                        on:click={() => deleteScheduleBlock(block.id)}
                                        class="text-red-400 hover:text-red-300 text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            {/each}
                        </div>
                        <button 
                            on:click={resetSchedule}
                            class="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                            Reset to Default
                        </button>
                    </div>
                {:else if activeTab === 'preferences'}
                    <div class="space-y-6">
                        <div>
                            <h3 class="text-lg font-semibold mb-4">Notifications</h3>
                            <label class="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg cursor-pointer hover:border-primary transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={notificationsEnabled}
                                    on:change={(e) => toggleNotifications(e.target.checked)}
                                    class="w-4 h-4 accent-primary"
                                />
                                <span>Enable browser notifications</span>
                            </label>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold mb-4">View Options</h3>
                            <label class="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg cursor-pointer hover:border-primary transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={$viewAllData}
                                    on:change={(e) => toggleViewAllSetting(e.target.checked)}
                                    class="w-4 h-4 accent-primary"
                                />
                                <span>Show all widgets regardless of phase</span>
                            </label>
                        </div>
                    </div>
                {:else if activeTab === 'about'}
                    <div class="space-y-4">
                        <div>
                            <h3 class="text-lg font-semibold mb-2">PersonalOS</h3>
                            <p class="text-gray-400 text-sm">Version 2.0</p>
                            <p class="text-gray-400 text-sm mt-2">Database Version: {db.version}</p>
                        </div>
                        <div>
                            <button 
                                on:click={exportData}
                                class="bg-primary hover:bg-primary/80 px-4 py-2 rounded"
                            >
                                Export Data
                            </button>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

{#if showAddBlockModal}
    <div class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" on:click={() => showAddBlockModal = false}>
        <div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 max-w-md w-full" on:click|stopPropagation>
            <h3 class="text-xl font-semibold mb-4">Add Schedule Block</h3>
            <input 
                type="time" 
                placeholder="Start Time" 
                bind:value={newBlock.startTime}
                class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:border-primary transition-colors"
            />
            <input 
                type="time" 
                placeholder="End Time" 
                bind:value={newBlock.endTime}
                class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:border-primary transition-colors"
            />
            <input 
                type="text" 
                placeholder="Phase (e.g., WORK)" 
                bind:value={newBlock.phase}
                class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:border-primary transition-colors"
            />
            <input 
                type="text" 
                placeholder="Label" 
                bind:value={newBlock.label}
                class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:border-primary transition-colors"
            />
            <div class="flex gap-3">
                <button 
                    on:click={() => showAddBlockModal = false}
                    class="flex-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg px-4 py-2 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    on:click={addScheduleBlock}
                    class="flex-1 bg-primary hover:bg-primary/80 rounded-lg px-4 py-2 transition-colors"
                >
                    Save
                </button>
            </div>
        </div>
    </div>
{/if}


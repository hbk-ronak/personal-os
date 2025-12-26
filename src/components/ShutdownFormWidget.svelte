<script>
    import { onMount } from 'svelte';
    import { db, currentPhase } from '../lib/stores.js';
    
    let shutdownShipped = '';
    let shutdownTomorrow = '';
    
    onMount(async () => {
        if ($currentPhase === 'SHUTDOWN') {
            await loadShutdown();
        }
    });
    
    $: if ($currentPhase === 'SHUTDOWN') {
        loadShutdown();
    }
    
    async function loadShutdown() {
        const today = new Date().toISOString().split('T')[0];
        const existing = await db.getAll('work_notes');
        const todayNote = existing.find(n => n.date === today);
        
        if (todayNote) {
            shutdownShipped = todayNote.shipped || '';
            shutdownTomorrow = todayNote.tomorrow || '';
        }
    }
    
    async function saveShutdown() {
        const shipped = shutdownShipped.trim();
        const tomorrow = shutdownTomorrow.trim();
        
        if (!shipped && !tomorrow) return;
        
        const today = new Date().toISOString().split('T')[0];
        const existing = await db.getAll('work_notes');
        const todayNote = existing.find(n => n.date === today);
        
        const noteData = {
            date: today,
            shipped: shipped,
            tomorrow: tomorrow,
            timestamp: new Date().toISOString()
        };
        
        if (todayNote) {
            noteData.id = todayNote.id;
            await db.update('work_notes', noteData);
        } else {
            await db.add('work_notes', noteData);
        }
        
        shutdownShipped = '';
        shutdownTomorrow = '';
    }
</script>

<div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 min-h-[200px] md:col-span-2">
    <h2 class="text-xl font-semibold mb-4">Work Shutdown</h2>
    <div class="grid md:grid-cols-2 gap-4">
        <div>
            <label class="text-sm text-gray-400 mb-2 block">What did you ship today?</label>
            <textarea 
                bind:value={shutdownShipped}
                rows="4" 
                class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors"
            ></textarea>
        </div>
        <div>
            <label class="text-sm text-gray-400 mb-2 block">Tomorrow's #1 Priority</label>
            <input 
                type="text" 
                bind:value={shutdownTomorrow}
                class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors"
            />
        </div>
    </div>
    <button 
        on:click={saveShutdown}
        class="mt-4 bg-primary hover:bg-primary/80 px-4 py-2 rounded-lg transition-colors"
    >
        Save
    </button>
</div>


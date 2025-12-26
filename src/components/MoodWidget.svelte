<script>
    import { onMount } from 'svelte';
    import { db, moods, selectedMood, dailyLogs } from '../lib/stores.js';
    
    let physicalValue = 3;
    let mentalValue = 3;
    let moodHistory = [];
    
    onMount(async () => {
        await loadMoodHistory();
    });
    
    async function loadMoodHistory() {
        const allMoods = await db.getAll('moods');
        moodHistory = allMoods
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 7);
    }
    
    function selectMood(emoji) {
        selectedMood.set(emoji);
    }
    
    async function saveMood() {
        const mood = $selectedMood;
        if (!mood) return;
        
        const today = new Date().toISOString().split('T')[0];
        const timestamp = new Date().toISOString();
        
        // Save to moods (backwards compatibility)
        await db.add('moods', {
            date: today,
            physical: parseInt(physicalValue),
            mental: parseInt(mentalValue),
            mood: mood,
            timestamp: timestamp
        });
        
        // Also save to daily_logs
        await db.add('daily_logs', {
            date: today,
            physical: parseInt(physicalValue),
            mental: parseInt(mentalValue),
            mood: mood,
            timestamp: timestamp
        });
        
        // Reset form
        physicalValue = 3;
        mentalValue = 3;
        selectedMood.set(null);
        
        await loadMoodHistory();
    }
    
    $: selectedMoodValue = $selectedMood;
</script>

<div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 min-h-[200px]">
    <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Mood Tracker</h2>
        <button 
            on:click={saveMood} 
            class="px-4 py-2 bg-primary hover:bg-primary/80 text-sm rounded-lg transition-colors"
        >
            Save
        </button>
    </div>
    
    <div class="space-y-6">
        <!-- Input Section -->
        <div class="space-y-4">
            <!-- Physical Level -->
            <div>
                <label class="text-sm text-gray-400 mb-2 block">
                    Physical: <span class="text-primary">{physicalValue}</span>
                </label>
                <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    bind:value={physicalValue}
                    class="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-primary"
                />
            </div>
            
            <!-- Mental Level -->
            <div>
                <label class="text-sm text-gray-400 mb-2 block">
                    Mental: <span class="text-primary">{mentalValue}</span>
                </label>
                <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    bind:value={mentalValue}
                    class="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-primary"
                />
            </div>
            
            <!-- Mood Emoji -->
            <div>
                <label class="text-sm text-gray-400 mb-2 block">Mood</label>
                <div class="flex gap-2 justify-between">
                    {#each ['😢', '😕', '😐', '🙂', '😄'] as emoji}
                        <button 
                            on:click={() => selectMood(emoji)}
                            class="text-3xl p-3 rounded-lg hover:bg-[#2a2a2a] transition-colors"
                            class:bg-primary={selectedMoodValue === emoji}
                            style:transform={selectedMoodValue === emoji ? 'scale(1.1)' : ''}
                        >
                            {emoji}
                        </button>
                    {/each}
                </div>
            </div>
        </div>
        
        <!-- Analytics Section -->
        <div>
            <h3 class="text-sm font-medium text-gray-400 mb-3">Recent History</h3>
            <div class="space-y-2 max-h-[180px] overflow-y-auto">
                {#if moodHistory.length === 0}
                    <div class="text-gray-500 text-xs">No mood entries yet</div>
                {:else}
                    {#each moodHistory as m}
                        {@const date = new Date(m.timestamp)}
                        {@const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {@const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        <div class="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-2 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <span class="text-2xl">{m.mood}</span>
                                <div class="text-xs">
                                    <div class="text-gray-400">{dateStr} {timeStr}</div>
                                    <div class="text-gray-500">P:{m.physical} M:{m.mental}</div>
                                </div>
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
</div>


<script>
    import { onMount } from 'svelte';
    import { db, watchList } from '../lib/stores.js';
    
    let showModal = false;
    let showTitle = '';
    let showNotes = '';
    let editingShow = null;
    
    onMount(async () => {
        await loadShows();
    });
    
    async function loadShows() {
        const allShows = await db.getAll('watchlist');
        watchList.set(allShows);
    }
    
    async function toggleShow(id) {
        const allShows = await db.getAll('watchlist');
        const show = allShows.find(s => s.id === id);
        if (show) {
            show.completed = !show.completed;
            await db.update('watchlist', show);
            await loadShows();
        }
    }
    
    function editShow(id) {
        const allShows = $watchList;
        const show = allShows.find(s => s.id === id);
        if (show) {
            editingShow = show;
            showTitle = show.title;
            showNotes = show.notes || '';
            showModal = true;
        }
    }
    
    async function saveShow() {
        if (!showTitle.trim()) return;
        
        if (editingShow) {
            editingShow.title = showTitle.trim();
            editingShow.notes = showNotes.trim();
            await db.update('watchlist', editingShow);
        } else {
            await db.add('watchlist', { 
                title: showTitle.trim(),
                notes: showNotes.trim(),
                completed: false
            });
        }
        
        showTitle = '';
        showNotes = '';
        editingShow = null;
        showModal = false;
        await loadShows();
    }
    
    function addShow() {
        editingShow = null;
        showTitle = '';
        showNotes = '';
        showModal = true;
    }
    
    $: {
        const allShows = $watchList;
        const pending = allShows.filter(s => !s.completed);
        const completed = allShows.filter(s => s.completed);
        displayedShows = [...pending, ...completed];
    }
    
    let displayedShows = [];
</script>

<div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 min-h-[200px]">
    <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Watch List</h2>
        <button 
            on:click={addShow}
            class="w-8 h-8 flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors font-semibold"
        >
            +
        </button>
    </div>
    <div class="space-y-3">
        {#if displayedShows.length === 0}
            <div class="text-gray-500 text-sm">No shows yet</div>
        {:else}
            {#each displayedShows as show}
                <div class="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-3 group relative {show.completed ? 'opacity-50' : ''}">
                    <div class="flex items-start gap-3">
                        <input 
                            type="checkbox" 
                            checked={show.completed}
                            on:change={() => toggleShow(show.id)}
                            class="w-4 h-4 mt-1 accent-primary cursor-pointer"
                        />
                        <div class="flex-1 cursor-pointer" on:click={() => editShow(show.id)}>
                            <div class="font-medium text-sm mb-1 {show.completed ? 'line-through' : ''}">
                                {show.title}
                            </div>
                            <div class="text-xs text-gray-500 flex items-center gap-1">
                                <span class="material-symbols-outlined" style="font-size: 16px;">movie</span>
                                Show/Movie 🎬
                            </div>
                            {#if show.notes}
                                <div class="text-xs text-gray-400 mt-1">{show.notes}</div>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>

{#if showModal}
    <div class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" on:click={() => showModal = false}>
        <div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 max-w-md w-full" on:click|stopPropagation>
            <h3 class="text-xl font-semibold mb-4">{editingShow ? 'Edit Show/Movie' : 'Add Show/Movie'}</h3>
            <input 
                type="text" 
                placeholder="Title" 
                bind:value={showTitle}
                class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:border-primary transition-colors"
                autofocus
            />
            <textarea 
                placeholder="Notes (optional)" 
                rows="3"
                bind:value={showNotes}
                class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors mb-4"
            ></textarea>
            <div class="flex gap-3">
                <button 
                    on:click={() => showModal = false}
                    class="flex-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg px-4 py-2 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    on:click={saveShow}
                    class="flex-1 bg-primary hover:bg-primary/80 rounded-lg px-4 py-2 transition-colors"
                >
                    Save
                </button>
            </div>
        </div>
    </div>
{/if}


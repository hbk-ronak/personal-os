<script>
    import { onMount } from 'svelte';
    import { db, notes } from '../lib/stores.js';
    
    let showModal = false;
    let noteTitle = '';
    let noteContent = '';
    
    onMount(async () => {
        await loadNotes();
    });
    
    async function loadNotes() {
        const allNotes = await db.getAll('notes');
        notes.set(allNotes);
    }
    
    async function deleteNote(id) {
        await db.delete('notes', id);
        await loadNotes();
    }
    
    async function addNote() {
        if (!noteTitle.trim() || !noteContent.trim()) return;
        await db.add('notes', { 
            title: noteTitle.trim(), 
            content: noteContent.trim()
        });
        noteTitle = '';
        noteContent = '';
        showModal = false;
        await loadNotes();
    }
    
    $: noteList = $notes;
</script>

<div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 min-h-[200px]">
    <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Notes</h2>
        <button 
            on:click={() => showModal = true}
            class="w-8 h-8 flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors font-semibold"
        >
            +
        </button>
    </div>
    <div class="space-y-3">
        {#if noteList.length === 0}
            <div class="text-gray-500 text-sm">No notes yet</div>
        {:else}
            {#each noteList as note}
                <div class="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-3 group relative">
                    <button 
                        on:click={() => deleteNote(note.id)}
                        class="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 text-sm"
                    >
                        ×
                    </button>
                    <div class="font-medium text-sm mb-1">{note.title}</div>
                    <div class="text-gray-400 text-xs">
                        {note.content.substring(0, 100)}{note.content.length > 100 ? '...' : ''}
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>

{#if showModal}
    <div class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" on:click={() => showModal = false}>
        <div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 max-w-md w-full" on:click|stopPropagation>
            <h3 class="text-xl font-semibold mb-4">Add Note</h3>
            <input 
                type="text" 
                placeholder="Note title" 
                bind:value={noteTitle}
                class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:border-primary transition-colors"
                autofocus
            />
            <textarea 
                placeholder="Note content" 
                rows="4"
                bind:value={noteContent}
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
                    on:click={addNote}
                    class="flex-1 bg-primary hover:bg-primary/80 rounded-lg px-4 py-2 transition-colors"
                >
                    Save
                </button>
            </div>
        </div>
    </div>
{/if}


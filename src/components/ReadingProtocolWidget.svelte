<script>
    import { currentDate, currentPhase, isRestMode } from '../lib/stores.js';
    
    $: {
        const now = $currentDate;
        const day = now.getDay();
        
        if ($isRestMode) {
            readingType = 'Fiction 📚 (Rest Mode)';
            showRestNote = true;
        } else {
            if ([1,3,5].includes(day)) {
                readingType = 'Technical Reading 📖';
            } else if ([2,4,6].includes(day)) {
                readingType = 'Fiction Reading 📚';
            } else {
                readingType = 'Rest or catch-up 📖📚';
            }
            showRestNote = false;
        }
    }
    
    let readingType = '';
    let showRestNote = false;
</script>

<div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 min-h-[200px]">
    <h3 class="text-lg font-semibold mb-3">Tonight's Reading</h3>
    <div class="text-xl flex items-center gap-2">
        <span class="material-symbols-outlined">menu_book</span>
        <span>{readingType}</span>
    </div>
    {#if showRestNote}
        <div class="text-sm text-amber-500 mt-2">
            Rest Mode Active
        </div>
    {/if}
</div>


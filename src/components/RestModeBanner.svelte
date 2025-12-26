<script>
    import { isRestMode } from '../lib/stores.js';
    
    let dismissed = false;
    
    function dismiss() {
        dismissed = true;
        localStorage.setItem('restBannerDismissed', 'true');
    }
    
    $: {
        if (typeof window !== 'undefined') {
            const wasDismissed = localStorage.getItem('restBannerDismissed') === 'true';
            dismissed = wasDismissed;
        }
    }
</script>

{#if $isRestMode && !dismissed}
    <div class="fixed top-0 left-0 right-0 bg-amber-500/20 border-b border-amber-500 p-3 text-center z-30">
        <div class="max-w-6xl mx-auto flex items-center justify-between">
            <span class="text-sm">Rest Mode Active - Light activities recommended</span>
            <button on:click={dismiss} class="text-amber-500 hover:text-amber-400 text-sm">✕</button>
        </div>
    </div>
{/if}


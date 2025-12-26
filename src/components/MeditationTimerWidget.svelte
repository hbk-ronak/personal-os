<script>
    import { onMount, onDestroy } from 'svelte';
    import { meditationTimer } from '../lib/stores.js';
    
    let timer = null;
    let remaining = 0;
    
    onMount(() => {
        timer = $meditationTimer;
        timer.onUpdate((val) => {
            remaining = val;
        });
        remaining = timer.remaining;
    });
    
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    
    function start() {
        timer.start();
    }
    
    function pause() {
        timer.pause();
    }
    
    function reset() {
        timer.reset();
    }
</script>

<div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 min-h-[200px]">
    <h2 class="text-xl font-semibold mb-4">Meditation Break</h2>
    <div class="text-4xl font-bold text-primary mb-4 text-center">{formatTime(remaining)}</div>
    <div class="flex gap-3 justify-center">
        <button 
            on:click={start}
            class="bg-primary hover:bg-primary/80 px-4 py-2 rounded-lg transition-colors"
        >
            Start
        </button>
        <button 
            on:click={pause}
            class="bg-[#2a2a2a] hover:bg-[#3a3a3a] px-4 py-2 rounded-lg transition-colors"
        >
            Pause
        </button>
        <button 
            on:click={reset}
            class="bg-[#2a2a2a] hover:bg-[#3a3a3a] px-4 py-2 rounded-lg transition-colors"
        >
            Reset
        </button>
    </div>
</div>


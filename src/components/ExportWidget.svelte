<script>
    import { exportData } from '../lib/export.js';
</script>

<div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 min-h-[200px] md:col-span-2">
    <h2 class="text-xl font-semibold mb-4">Export Data</h2>
    <button 
        on:click={exportData}
        class="bg-primary hover:bg-primary/80 px-4 py-2 rounded-lg transition-colors"
    >
        Export All Data
    </button>
</div>


<script>
    import { currentTime, currentDate } from '../lib/stores.js';
    
    let timeStr = '';
    let dateStr = '';
    
    $: {
        const time = $currentTime;
        timeStr = time.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
        
        dateStr = time.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
        });
    }
</script>

<div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg flex flex-col items-center justify-center min-h-[200px] h-full">
    <div class="flex flex-col items-center justify-center w-full h-full">
        <div class="text-6xl font-bold text-primary mb-2 text-center w-full">{timeStr}</div>
        <div class="text-gray-400 text-center">{dateStr}</div>
    </div>
</div>


<script>
    import { onMount } from 'svelte';
    import { schedule, currentPhase, isManualOverride } from '../lib/stores.js';
    import { setPhase, syncToSchedule, detectCurrentPhase } from '../lib/app.js';
    
    export let onSettingsClick = null;
    
    let showMenu = false;
    let currentPhaseLabel = 'Loading...';
    let currentTimeRange = '';
    let phaseMenuItems = [];
    
    const phaseWidgets = {
        MORNING_PLAN: ['time', 'tasks-widget', 'mood'],
        RUN: ['time', 'tasks-widget', 'mood'],
        WORK: ['time', 'meditation', 'tasks-widget', 'notes-work'],
        SHUTDOWN: ['time', 'shutdown-form', 'mood'],
        DECOMPRESS: ['time', 'watchlist', 'gaming-timer'],
        COOK_TV: ['time', 'watchlist'],
        DEEP_WORK: ['time', 'readinglist'],
        CHECK_IN: ['time', 'mood'],
        FREE_TIME: ['time']
    };
    
    function getWidgetNamesForPhase(phase) {
        const widgetMap = {
            'time': 'Time',
            'tasks-widget': 'Tasks',
            'notes-work': 'Notes',
            'mood': 'Mood',
            'meditation': 'Meditation Timer',
            'shutdown-form': 'Shutdown Form',
            'gaming-timer': 'Gaming Timer',
            'watchlist': 'Watch List',
            'readinglist': 'Reading List',
            'reading-protocol': 'Reading Protocol',
            'export': 'Export'
        };
        
        const widgets = phaseWidgets[phase] || [];
        return widgets.map(w => widgetMap[w] || w).filter(Boolean);
    }
    
    function toggleMenu() {
        showMenu = !showMenu;
        if (showMenu) {
            renderPhaseMenu();
        }
    }
    
    function renderPhaseMenu() {
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const todayBlocks = $schedule
            .filter(block => block.activeDays.includes(currentDay))
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        const currentBlock = todayBlocks.find(b => 
            currentTime >= b.startTime && currentTime < b.endTime
        );
        
        if (currentBlock) {
            currentPhaseLabel = currentBlock.label;
            currentTimeRange = `${currentBlock.startTime} - ${currentBlock.endTime}`;
        } else {
            currentPhaseLabel = 'Free Time';
            currentTimeRange = '';
        }
        
        phaseMenuItems = todayBlocks.map(block => {
            const isCurrent = $currentPhase === block.phase;
            const isPast = currentTime >= block.endTime;
            const widgetNames = getWidgetNamesForPhase(block.phase);
            
            return {
                ...block,
                isCurrent,
                isPast,
                widgetNames
            };
        });
    }
    
    function handleSetPhase(phase, manual) {
        setPhase(phase, manual);
        showMenu = false;
    }
    
    function handleSync() {
        syncToSchedule();
        showMenu = false;
    }
    
    $: if (showMenu) {
        renderPhaseMenu();
    }
    
    $: {
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const todayBlocks = $schedule
            .filter(block => block.activeDays.includes(currentDay))
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        const currentBlock = todayBlocks.find(b => 
            currentTime >= b.startTime && currentTime < b.endTime
        );
        currentPhaseLabel = currentBlock ? currentBlock.label : 'Free Time';
    }
</script>

<div class="relative">
    <button 
        on:click={toggleMenu}
        class="w-9 h-9 flex items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-primary transition-colors"
    >
        <span class="material-symbols-outlined text-lg">menu</span>
    </button>
    {#if showMenu}
        <div class="absolute right-0 top-full mt-2 w-64 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-lg z-50">
            <div class="p-3 border-b border-[#2a2a2a]">
                <div class="text-xs text-gray-400 mb-1">Current Phase</div>
                <div class="font-semibold">{currentPhaseLabel}</div>
                <div class="text-xs text-gray-500 mt-1">{currentTimeRange}</div>
            </div>
            <div class="max-h-64 overflow-y-auto">
                <div class="p-2">
                    {#each phaseMenuItems as block}
                        <button 
                            on:click={() => handleSetPhase(block.phase, true)}
                            class="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#2a2a2a] transition-colors flex items-center justify-between mb-1 {block.isCurrent ? 'bg-primary/10 text-primary font-medium' : block.isPast ? 'text-gray-500' : 'text-gray-300'}"
                        >
                            <div class="flex-1">
                                <div class="font-medium">{block.label}</div>
                                <div class="text-xs text-gray-500">{block.startTime} - {block.endTime}</div>
                                {#if block.widgetNames.length > 0}
                                    <div class="text-xs text-gray-600 mt-1">{block.widgetNames.join(', ')}</div>
                                {/if}
                            </div>
                            {#if block.isCurrent}
                                <span class="text-primary ml-2">●</span>
                            {/if}
                        </button>
                    {/each}
                    {#if $isManualOverride}
                        <button 
                            on:click={handleSync}
                            class="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#2a2a2a] transition-colors flex items-center gap-2 text-amber-400 mt-2 border-t border-[#2a2a2a] pt-2"
                        >
                            <span>Sync to Schedule</span>
                        </button>
                    {/if}
                </div>
            </div>
            <div class="p-2 border-t border-[#2a2a2a]">
                <button 
                    on:click={() => {
                        showMenu = false;
                        if (onSettingsClick) {
                            onSettingsClick();
                        }
                    }}
                    class="w-full text-left px-3 py-2 text-sm hover:bg-[#2a2a2a] rounded-lg transition-colors flex items-center gap-2"
                >
                    <span class="material-symbols-outlined text-sm">settings</span>
                    <span>Settings</span>
                </button>
            </div>
        </div>
    {/if}
</div>


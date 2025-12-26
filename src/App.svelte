<script>
    import { onMount, onDestroy } from 'svelte';
    import { currentPhase, viewAllData, phaseWidgets, schedule, isManualOverride } from './lib/stores.js';
    import { initApp, detectCurrentPhase } from './lib/app.js';
    
    import TimeWidget from './components/TimeWidget.svelte';
    import MoodWidget from './components/MoodWidget.svelte';
    import TasksWidget from './components/TasksWidget.svelte';
    import NotesWidget from './components/NotesWidget.svelte';
    import MeditationTimerWidget from './components/MeditationTimerWidget.svelte';
    import GamingTimerWidget from './components/GamingTimerWidget.svelte';
    import ShutdownFormWidget from './components/ShutdownFormWidget.svelte';
    import ReadingListWidget from './components/ReadingListWidget.svelte';
    import WatchListWidget from './components/WatchListWidget.svelte';
    import ReadingProtocolWidget from './components/ReadingProtocolWidget.svelte';
    import ExportWidget from './components/ExportWidget.svelte';
    import PhaseMenu from './components/PhaseMenu.svelte';
    import SettingsModal from './components/SettingsModal.svelte';
    import MotivationWidget from './components/MotivationWidget.svelte';
    
    let settingsModal;
    let currentPhaseLabel = 'Loading...';
    let phaseCheckInterval;
    
    onMount(async () => {
        await initApp();
        
        // Update phase label when phase or schedule changes
        currentPhase.subscribe(() => {
            updatePhaseLabel();
        });
        schedule.subscribe(() => {
            updatePhaseLabel();
        });
        
        // Initial label update
        updatePhaseLabel();
        
        // Check phase every minute
        phaseCheckInterval = setInterval(() => {
            if (!$isManualOverride) {
                const scheduleData = $schedule;
                const newPhase = detectCurrentPhase(scheduleData);
                if (newPhase !== $currentPhase) {
                    import('./lib/app.js').then(({ setPhase }) => {
                        setPhase(newPhase, false);
                    });
                }
            }
        }, 60000);
    });
    
    onDestroy(() => {
        if (phaseCheckInterval) {
            clearInterval(phaseCheckInterval);
        }
    });
    
    function updatePhaseLabel() {
        const scheduleData = $schedule;
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const todayBlocks = scheduleData
            .filter(block => block.activeDays.includes(currentDay))
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        const currentBlock = todayBlocks.find(b => 
            currentTime >= b.startTime && currentTime < b.endTime
        );
        
        currentPhaseLabel = currentBlock ? currentBlock.label : 'Free Time';
    }
    
    function openSettings() {
        if (settingsModal) {
            settingsModal.open();
        }
    }
    
    // Reactive statement to determine widget visibility
    // Show widgets based on current phase, or show all if viewAllData is true
    // Default to showing time widget if phase is not set yet (during initialization)
    $: showTime = $viewAllData || !$currentPhase || phaseWidgets[$currentPhase]?.includes('time') || false;
    $: showMood = $viewAllData || ($currentPhase && phaseWidgets[$currentPhase]?.includes('mood')) || false;
    $: showTasks = $viewAllData || ($currentPhase && phaseWidgets[$currentPhase]?.includes('tasks-widget')) || false;
    $: showNotes = $viewAllData || ($currentPhase && phaseWidgets[$currentPhase]?.includes('notes-work')) || false;
    $: showMeditation = $viewAllData || ($currentPhase && phaseWidgets[$currentPhase]?.includes('meditation')) || false;
    $: showShutdown = $viewAllData || ($currentPhase && phaseWidgets[$currentPhase]?.includes('shutdown-form')) || false;
    $: showGaming = $viewAllData || ($currentPhase && phaseWidgets[$currentPhase]?.includes('gaming-timer')) || false;
    $: showWatchlist = $viewAllData || ($currentPhase && phaseWidgets[$currentPhase]?.includes('watchlist')) || false;
    $: showReadingProtocol = $viewAllData || ($currentPhase && phaseWidgets[$currentPhase]?.includes('reading-protocol')) || false;
    $: showReadingList = $viewAllData || ($currentPhase && phaseWidgets[$currentPhase]?.includes('readinglist')) || false;
    $: showExport = $viewAllData || ($currentPhase && phaseWidgets[$currentPhase]?.includes('export')) || false;
</script>

<div class="bg-black text-white min-h-screen p-4 w-full">
    <!-- Top Navigation -->
    <div class="max-w-2xl mx-auto mb-8">
        <div class="flex items-center justify-between mb-6">
            <div>
                <h1 class="text-3xl md:text-4xl font-bold text-primary mb-1">PersonalOS</h1>
                <p class="text-xl md:text-2xl font-semibold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary mb-1">
                    PERSEVERANCE AND FAITH
                </p>
                <p class="text-sm text-gray-400">{currentPhaseLabel}</p>
            </div>
            <div class="flex items-center gap-3">
                <PhaseMenu onSettingsClick={openSettings} />
            </div>
        </div>
    </div>
    
    <!-- Grid Container - Single column for all screen sizes -->
    <div class="grid grid-cols-1 gap-4 max-w-2xl mx-auto mb-8 items-stretch">
        
        <!-- Motivation Widget - Always visible -->
        <div>
            <MotivationWidget />
        </div>
        
        <!-- Time Widget -->
        {#if showTime}
            <TimeWidget />
        {/if}
        
        <!-- Mood Tracker Widget -->
        {#if showMood}
            <MoodWidget />
        {/if}
        
        <!-- Tasks Widget -->
        {#if showTasks}
            <TasksWidget />
        {/if}
        
        <!-- Notes Widget -->
        {#if showNotes}
            <NotesWidget />
        {/if}
        
        <!-- Meditation Timer Widget -->
        {#if showMeditation}
            <MeditationTimerWidget />
        {/if}
        
        <!-- Shutdown Form Widget -->
        {#if showShutdown}
            <ShutdownFormWidget />
        {/if}
        
        <!-- Gaming Timer Widget -->
        {#if showGaming}
            <GamingTimerWidget />
        {/if}
        
        <!-- Watch List Widget -->
        {#if showWatchlist}
            <WatchListWidget />
        {/if}
        
        <!-- Reading Protocol Widget -->
        {#if showReadingProtocol}
            <ReadingProtocolWidget />
        {/if}
        
        <!-- Reading List Widget -->
        {#if showReadingList}
            <ReadingListWidget />
        {/if}
        
        <!-- Export Widget -->
        {#if showExport}
            <ExportWidget />
        {/if}
        
    </div>
    
    <!-- Settings Modal -->
    <SettingsModal bind:this={settingsModal} />
</div>


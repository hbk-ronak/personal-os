<script>
    import { onMount } from 'svelte';
    
    const affirmations = [
        "I'm going to get into Google no matter what",
        "Nothing will stop me from joining Google",
        "I will get into Google, period",
        "Google is happening, no excuses",
        "I'm getting into Google, that's final",
        "I'm determined to get into Google",
        "I will make it into Google, no matter what it takes",
        "Getting into Google is non-negotiable",
        "I'm going to Google, and that's that",
        "I will get into Google, end of story"
    ];
    
    let currentAffirmation = '';
    let affirmationIndex = 0;
    
    onMount(() => {
        // Set initial affirmation
        affirmationIndex = Math.floor(Math.random() * affirmations.length);
        currentAffirmation = affirmations[affirmationIndex];
        
        // Rotate affirmations every 30 seconds
        const interval = setInterval(() => {
            affirmationIndex = (affirmationIndex + 1) % affirmations.length;
            currentAffirmation = affirmations[affirmationIndex];
        }, 30000);
        
        return () => clearInterval(interval);
    });
</script>

<div class="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 rounded-lg p-4 mb-4 text-center">
    <p class="text-lg font-medium text-white/90 italic transition-opacity duration-500">
        {currentAffirmation}
    </p>
</div>

<style>
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    p {
        animation: fadeIn 0.5s ease-in-out;
    }
</style>


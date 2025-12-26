<script>
    import { onMount } from 'svelte';
    import { db, tasks } from '../lib/stores.js';
    
    let showModal = false;
    let taskInput = '';
    
    onMount(async () => {
        await loadTasks();
    });
    
    async function loadTasks() {
        const allTasks = await db.getAll('tasks');
        tasks.set(allTasks);
    }
    
    async function toggleTask(id) {
        const allTasks = await db.getAll('tasks');
        const task = allTasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            await db.update('tasks', task);
            await loadTasks();
        }
    }
    
    async function deleteTask(id) {
        await db.delete('tasks', id);
        await loadTasks();
    }
    
    async function addTask() {
        if (!taskInput.trim()) return;
        await db.add('tasks', { 
            text: taskInput.trim(), 
            completed: false
        });
        taskInput = '';
        showModal = false;
        await loadTasks();
    }
    
    $: taskList = $tasks;
</script>

<div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 min-h-[200px]">
    <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Tasks</h2>
        <button 
            on:click={() => showModal = true}
            class="w-8 h-8 flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors font-semibold"
        >
            +
        </button>
    </div>
    <div class="space-y-3">
        {#if taskList.length === 0}
            <div class="text-gray-500 text-sm">No tasks yet</div>
        {:else}
            {#each taskList as task}
                <div class="flex items-center gap-3 group">
                    <input 
                        type="checkbox" 
                        checked={task.completed}
                        on:change={() => toggleTask(task.id)}
                        class="w-4 h-4 accent-primary cursor-pointer"
                    />
                    <span class="text-gray-300 flex-1 {task.completed ? 'line-through opacity-50' : ''}">
                        {task.text}
                    </span>
                    <button 
                        on:click={() => deleteTask(task.id)}
                        class="text-red-500 opacity-0 group-hover:opacity-100 text-sm"
                    >
                        ×
                    </button>
                </div>
            {/each}
        {/if}
    </div>
</div>

{#if showModal}
    <div class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" on:click={() => showModal = false}>
        <div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 max-w-md w-full" on:click|stopPropagation>
            <h3 class="text-xl font-semibold mb-4">Add Task</h3>
            <input 
                type="text" 
                placeholder="Task description" 
                bind:value={taskInput}
                class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors mb-4"
                on:keydown={(e) => e.key === 'Enter' && addTask()}
                autofocus
            />
            <div class="flex gap-3">
                <button 
                    on:click={() => showModal = false}
                    class="flex-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg px-4 py-2 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    on:click={addTask}
                    class="flex-1 bg-primary hover:bg-primary/80 rounded-lg px-4 py-2 transition-colors"
                >
                    Save
                </button>
            </div>
        </div>
    </div>
{/if}


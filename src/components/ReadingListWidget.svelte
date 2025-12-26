<script>
    import { onMount } from 'svelte';
    import { db, readingList } from '../lib/stores.js';
    
    let showModal = false;
    let bookTitle = '';
    let bookCategory = 'technical';
    let bookNotes = '';
    let editingBook = null;
    
    onMount(async () => {
        await loadBooks();
    });
    
    async function loadBooks() {
        const allBooks = await db.getAll('readinglist');
        readingList.set(allBooks);
    }
    
    async function toggleBook(id) {
        const allBooks = await db.getAll('readinglist');
        const book = allBooks.find(b => b.id === id);
        if (book) {
            book.completed = !book.completed;
            await db.update('readinglist', book);
            await loadBooks();
        }
    }
    
    function editBook(id) {
        const allBooks = $readingList;
        const book = allBooks.find(b => b.id === id);
        if (book) {
            editingBook = book;
            bookTitle = book.title;
            bookCategory = book.category || 'technical';
            bookNotes = book.notes || '';
            showModal = true;
        }
    }
    
    async function saveBook() {
        if (!bookTitle.trim()) return;
        
        if (editingBook) {
            editingBook.title = bookTitle.trim();
            editingBook.category = bookCategory;
            editingBook.notes = bookNotes.trim();
            await db.update('readinglist', editingBook);
        } else {
            await db.add('readinglist', { 
                title: bookTitle.trim(),
                category: bookCategory,
                notes: bookNotes.trim(),
                completed: false
            });
        }
        
        bookTitle = '';
        bookCategory = 'technical';
        bookNotes = '';
        editingBook = null;
        showModal = false;
        await loadBooks();
    }
    
    function addBook() {
        editingBook = null;
        bookTitle = '';
        bookCategory = 'technical';
        bookNotes = '';
        showModal = true;
    }
    
    $: displayedBooks = $readingList;
</script>

<div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 min-h-[200px]">
    <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Reading List</h2>
        <button 
            on:click={addBook}
            class="w-8 h-8 flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors font-semibold"
        >
            +
        </button>
    </div>
    <div class="space-y-3">
        {#if displayedBooks.length === 0}
            <div class="text-gray-500 text-sm">No books yet</div>
        {:else}
            {@const pending = displayedBooks.filter(b => !b.completed)}
            {@const completed = displayedBooks.filter(b => b.completed)}
            {#each [...pending, ...completed] as book}
                <div class="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-3 group relative {book.completed ? 'opacity-50' : ''}">
                    <div class="flex items-start gap-3">
                        <input 
                            type="checkbox" 
                            checked={book.completed}
                            on:change={() => toggleBook(book.id)}
                            class="w-4 h-4 mt-1 accent-primary cursor-pointer"
                        />
                        <div class="flex-1 cursor-pointer" on:click={() => editBook(book.id)}>
                            <div class="font-medium text-sm mb-1 {book.completed ? 'line-through' : ''}">
                                {book.title}
                            </div>
                            <div class="text-xs text-gray-500 flex items-center gap-1">
                                <span class="material-symbols-outlined" style="font-size: 16px;">menu_book</span>
                                {book.category === 'fiction' ? 'Fiction 📚' : 'Technical 📖'}
                            </div>
                            {#if book.notes}
                                <div class="text-xs text-gray-400 mt-1">{book.notes}</div>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>

{#if showModal}
    <div class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" on:click={() => showModal = false}>
        <div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 max-w-md w-full" on:click|stopPropagation>
            <h3 class="text-xl font-semibold mb-4">{editingBook ? 'Edit Book' : 'Add Book'}</h3>
            <input 
                type="text" 
                placeholder="Book title" 
                bind:value={bookTitle}
                class="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:border-primary transition-colors"
                autofocus
            />
            <div class="mb-3">
                <label class="text-sm text-gray-400 mb-2 block">Category</label>
                <div class="flex gap-3">
                    <label class="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 cursor-pointer hover:border-primary transition-colors">
                        <input type="radio" bind:group={bookCategory} value="technical" class="mr-2">
                        <span>Technical 📖</span>
                    </label>
                    <label class="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 cursor-pointer hover:border-primary transition-colors">
                        <input type="radio" bind:group={bookCategory} value="fiction" class="mr-2">
                        <span>Fiction 📚</span>
                    </label>
                </div>
            </div>
            <textarea 
                placeholder="Notes (optional)" 
                rows="3"
                bind:value={bookNotes}
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
                    on:click={saveBook}
                    class="flex-1 bg-primary hover:bg-primary/80 rounded-lg px-4 py-2 transition-colors"
                >
                    Save
                </button>
            </div>
        </div>
    </div>
{/if}


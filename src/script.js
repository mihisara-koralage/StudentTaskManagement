// Initial sample books
let books = JSON.parse(localStorage.getItem('simple_books')) || [
    { id: 1, title: 'To Kill a Mockingbird', author: 'Harper Lee', status: 'Available', borrower: '-' },
    { id: 2, title: '1984', author: 'George Orwell', status: 'Available', borrower: '-' }
];

const bookListEl = document.getElementById('book-list');
const selectBookEl = document.getElementById('select-book');
const addBookForm = document.getElementById('add-book-form');
const lendForm = document.getElementById('lend-form');

// Save to LocalStorage
function saveAndRender() {
    localStorage.setItem('simple_books', JSON.stringify(books));
    render();
}

// Render Table & Dropdowns
function render() {
    bookListEl.innerHTML = '';
    selectBookEl.innerHTML = '<option value="">Select Available Book</option>';

    if (books.length === 0) {
        bookListEl.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#777;">No books found.</td></tr>`;
        return;
    }

    books.forEach((book, index) => {
        // Populate main table
        const statusClass = book.status === 'Available' ? 'badge-available' : 'badge-borrowed';
        bookListEl.innerHTML += `
            <tr>
                <td>#${book.id}</td>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td><span class="${statusClass}">${book.status}</span> ${book.borrower !== '-' ? '(' + book.borrower + ')' : ''}</td>
                <td>
                    ${book.status === 'Available' 
                        ? `<button class="btn btn-danger" onclick="removeBook(${index})">Remove</button>`
                        : `<button class="btn btn-warning" onclick="returnBook(${index})">Return</button>`
                    }
                </td>
            </tr>
        `;

        // Populate lend dropdown with only available books
        if (book.status === 'Available') {
            selectBookEl.innerHTML += `<option value="${index}">${book.title}</option>`;
        }
    });
}

// 1. Add Book
addBookForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;

    const newBook = {
        id: books.length > 0 ? books[books.length - 1].id + 1 : 1,
        title,
        author,
        status: 'Available',
        borrower: '-'
    };

    books.push(newBook);
    addBookForm.reset();
    saveAndRender();
});

// 2. Remove Book
function removeBook(index) {
    if (confirm("Delete this book?")) {
        books.splice(index, 1);
        saveAndRender();
    }
}

// 3. Lend Book
lendForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const bookIndex = document.getElementById('select-book').value;
    const borrower = document.getElementById('borrower-name').value;

    if (bookIndex === "") {
        alert("Please select an available book.");
        return;
    }

    books[bookIndex].status = 'Borrowed';
    books[bookIndex].borrower = borrower;

    lendForm.reset();
    saveAndRender();
});

// 4. Return Book
function returnBook(index) {
    books[index].status = 'Available';
    books[index].borrower = '-';
    saveAndRender();
}

// Initial Load
render();
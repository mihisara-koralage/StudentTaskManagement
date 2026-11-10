
let books = JSON.parse(localStorage.getItem("folioBooks")) || [];

let currentFilter = "All";

const addForm = document.getElementById("add-book-form");
const lendForm = document.getElementById("lend-form");
const bookList = document.getElementById("book-list");

function saveBooks() {
    localStorage.setItem("folioBooks", JSON.stringify(books));
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// ADD BOOK

addForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    const author = document.getElementById("author").value.trim();

    if (!title || !author) return;

    const book = {
        id: Date.now(),
        title: title,
        author: author,
        status: "Available",
        borrower: "",
        borrowDate: "",
        returnDate: ""
    };

    books.push(book);

    saveBooks();
    addForm.reset();

    renderBooks();
    showToast("Book added successfully!");
});

// LEND BOOK

lendForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const borrower = document.getElementById("borrower-name").value;
    const bookId = Number(document.getElementById("select-book").value);

    const book = books.find(b => b.id === bookId);

    if (!book || book.status !== "Available") {
        showToast("Please select an available book.");
        return;
    }

    const today = new Date();
    const returnDate = new Date();
    returnDate.setDate(today.getDate() + 14);

    book.status = "Borrowed";
    book.borrower = borrower;
    book.borrowDate = today.toISOString().split("T")[0];
    book.returnDate = returnDate.toISOString().split("T")[0];

    saveBooks();
    lendForm.reset();

    renderBooks();
    showToast("Book lent successfully!");
});

// RETURN BOOK

function returnBook(id) {
    const book = books.find(b => b.id === id);

    if (!book) return;

    book.status = "Available";
    book.borrower = "";
    book.borrowDate = "";
    book.returnDate = "";

    saveBooks();
    renderBooks();

    showToast("Book returned successfully!");
}

// DELETE BOOK

function deleteBook(id) {
    const confirmDelete = confirm("Are you sure you want to delete this book?");

    if (!confirmDelete) return;

    books = books.filter(b => b.id !== id);

    saveBooks();
    renderBooks();

    showToast("Book deleted successfully!");
}

// UPDATE STATISTICS

function updateStats() {
    const total = books.length;

    const available = books.filter(b =>
        b.status === "Available"
    ).length;

    const borrowed = books.filter(b =>
        b.status === "Borrowed"
    ).length;

    const today = new Date().toISOString().split("T")[0];

    const overdue = books.filter(b =>
        b.status === "Borrowed" &&
        b.returnDate &&
        b.returnDate < today
    ).length;

    document.getElementById("stat-total").textContent = total;
    document.getElementById("stat-available").textContent = available;
    document.getElementById("stat-borrowed").textContent = borrowed;
    document.getElementById("stat-overdue").textContent = overdue;

    document.getElementById("catalog-count").textContent =
        total + (total === 1 ? " book" : " books");
}

// UPDATE BOOK DROPDOWN

function updateDropdown() {
    const select = document.getElementById("select-book");

    select.innerHTML = '<option value="">Select an available book</option>';

    books.filter(b => b.status === "Available").forEach(book => {
        const option = document.createElement("option");

        option.value = book.id;
        option.textContent = book.title;

        select.appendChild(option);
    });
}

// RENDER BOOKS

function renderBooks() {
    const search = document.getElementById("catalog-search")
        .value.toLowerCase();

    let filteredBooks = books.filter(book => {
        const matchesSearch =
            book.title.toLowerCase().includes(search) ||
            book.author.toLowerCase().includes(search);

        const matchesFilter =
            currentFilter === "All" ||
            book.status === currentFilter;

        return matchesSearch && matchesFilter;
    });

    if (document.getElementById("sort-books").value === "title") {
        filteredBooks.sort((a, b) =>
            a.title.localeCompare(b.title)
        );
    } else {
        filteredBooks.sort((a, b) => b.id - a.id);
    }

    bookList.innerHTML = "";

    filteredBooks.forEach(book => {
        const row = document.createElement("tr");

        const statusClass = book.status.toLowerCase();

        const statusText = book.status === "Available"
            ? "Available"
            : `Borrowed by ${book.borrower}`;

        row.innerHTML = `
            <td>${book.id.toString().slice(-6)}</td>
            <td><strong></strong></td>
            <td></td>
            <td>
                <span class="status ${statusClass}">
                    ${statusText}
                </span>
            </td>
            <td>
                ${book.status === "Borrowed"
                    ? `<button class="action-btn return-btn">Return</button>`
                    : ""}
                <button class="action-btn delete-btn">Delete</button>
            </td>
        `;

        row.children[1].querySelector("strong").textContent = book.title;
        row.children[2].textContent = book.author;

        const returnButton = row.querySelector(".return-btn");
        const deleteButton = row.querySelector(".delete-btn");

        if (returnButton) {
            returnButton.addEventListener("click", () => returnBook(book.id));
        }

        deleteButton.addEventListener("click", () => deleteBook(book.id));

        bookList.appendChild(row);
    });

    document.getElementById("catalog-empty").hidden =
        filteredBooks.length !== 0;

    updateStats();
    updateDropdown();
    saveBooks();
}

// SEARCH

document.getElementById("catalog-search")
    .addEventListener("input", renderBooks);

// FILTER

document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", function() {
        document.querySelectorAll(".filter-btn").forEach(btn =>
            btn.classList.remove("active")
        );

        this.classList.add("active");
        currentFilter = this.dataset.filter;

        renderBooks();
    });
});

// SORT

document.getElementById("sort-books")
    .addEventListener("change", renderBooks);

// DARK MODE

function toggleTheme() {
    document.body.classList.toggle("dark");

    localStorage.setItem(
        "folioTheme",
        document.body.classList.contains("dark") ? "dark" : "light"
    );
}

// MOBILE SIDEBAR

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("show");
}

// INITIALIZE

if (localStorage.getItem("folioTheme") === "dark") {
    document.body.classList.add("dark");
}

renderBooks();

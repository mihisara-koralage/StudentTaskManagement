
document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'simple_books';

  const sampleBooks = [
    { id: 1, title: 'To Kill a Mockingbird', author: 'Harper Lee', status: 'Available', borrower: '-' },
    { id: 2, title: '1984', author: 'George Orwell', status: 'Available', borrower: '-' }
  ];

  const bookList = document.getElementById('book-list');
  const bookSelect = document.getElementById('select-book');
  const borrowerSelect = document.getElementById('borrower-name');
  const addBookForm = document.getElementById('add-book-form');
  const lendForm = document.getElementById('lend-form');
  const searchInput = document.getElementById('catalog-search');
  const emptyState = document.getElementById('catalog-empty');
  const totalStat = document.getElementById('stat-total');
  const availableStat = document.getElementById('stat-available');
  const borrowedStat = document.getElementById('stat-borrowed');
  const catalogCount = document.getElementById('catalog-count');

  if (!bookList || !bookSelect || !addBookForm || !lendForm) {
    console.error('Required library elements are missing.');
    return;
  }

  function readBooks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return sampleBooks;

      const saved = JSON.parse(raw);
      if (!Array.isArray(saved)) return sampleBooks;

      const usedIds = new Set();
      let nextId = Math.max(0, ...saved.map(b => Number(b?.id) || 0)) + 1;

      return saved.filter(b => b && typeof b === 'object').map(b => {
        let id = Number(b.id);
        if (!Number.isSafeInteger(id) || id <= 0 || usedIds.has(id)) {
          id = nextId++;
        }

        usedIds.add(id);
        const borrowed = b.status === 'Borrowed';

        return {
          id,
          title: String(b.title ?? ''),
          author: String(b.author ?? ''),
          status: borrowed ? 'Borrowed' : 'Available',
          borrower: borrowed ? String(b.borrower ?? '-') : '-'
        };
      });
    } catch (error) {
      console.warn('Could not read saved books:', error);
      return sampleBooks;
    }
  }

  let books = readBooks();
  let toastTimeout;

  const toast = document.createElement('div');
  toast.className = 'app-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);

  // Modern notifications
  function notify(message) {
    toast.textContent = message;
    toast.classList.add('app-toast--visible');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('app-toast--visible');
    }, 2800);
  }

  // Save books and refresh dashboard
  function saveAndRender() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (error) {
      console.warn('Could not save books:', error);
      notify('Changes could not be saved to this browser.');
    }

    render();
  }

  function makeCell(value) {
    const cell = document.createElement('td');
    cell.textContent = String(value);
    return cell;
  }

  // Render catalog, dropdown and statistics
  function render() {
    const availableBooks = books.filter(book => book.status === 'Available');
    const query = (searchInput?.value || '').trim().toLocaleLowerCase();

    const matchingBooks = books.filter(book =>
      [String(book.id), book.title, book.author, book.status, book.borrower]
        .some(value => value.toLocaleLowerCase().includes(query))
    );

    // Dashboard statistics
    if (totalStat) totalStat.textContent = String(books.length);
    if (availableStat) availableStat.textContent = String(availableBooks.length);
    if (borrowedStat) borrowedStat.textContent = String(books.length - availableBooks.length);

    if (catalogCount) {
      const totalLabel = `${books.length} ${books.length === 1 ? 'book' : 'books'}`;
      catalogCount.textContent = query
        ? `${matchingBooks.length} of ${totalLabel}`
        : totalLabel;
    }

    // Populate available book dropdown
    const previousSelection = bookSelect.value;
    bookSelect.replaceChildren(new Option('Select an available book', ''));

    availableBooks.forEach(book => {
      bookSelect.add(new Option(book.title, String(book.id)));
    });

    if (availableBooks.some(book => String(book.id) === previousSelection)) {
      bookSelect.value = previousSelection;
    }

    bookSelect.disabled = availableBooks.length === 0;

    const lendButton = lendForm.querySelector('button[type="submit"]');
    if (lendButton) {
      lendButton.disabled = availableBooks.length === 0;
    }

    // Render table rows
    const fragment = document.createDocumentFragment();

    matchingBooks.forEach(book => {
      const row = document.createElement('tr');

      row.append(
        makeCell(`#${book.id}`),
        makeCell(book.title),
        makeCell(book.author)
      );

      // Book status
      const statusCell = document.createElement('td');
      const badge = document.createElement('span');

      badge.className = book.status === 'Available'
        ? 'badge-available'
        : 'badge-borrowed';

      badge.textContent = book.status;
      statusCell.appendChild(badge);

      if (book.status === 'Borrowed' && book.borrower !== '-') {
        const borrower = document.createElement('span');
        borrower.className = 'borrower-detail';
        borrower.textContent = ` ${book.borrower}`;
        statusCell.appendChild(borrower);
      }

      row.appendChild(statusCell);

      // Action button
      const actionCell = document.createElement('td');
      const actionButton = document.createElement('button');
      const isAvailable = book.status === 'Available';

      actionButton.type = 'button';
      actionButton.className = `btn ${isAvailable ? 'btn-danger' : 'btn-warning'}`;
      actionButton.textContent = isAvailable ? 'Remove' : 'Return';
      actionButton.dataset.action = isAvailable ? 'remove' : 'return';
      actionButton.dataset.id = String(book.id);

      actionButton.setAttribute(
        'aria-label',
        `${isAvailable ? 'Remove' : 'Return'} ${book.title}`
      );

      actionCell.appendChild(actionButton);
      row.appendChild(actionCell);
      fragment.appendChild(row);
    });

    bookList.replaceChildren(fragment);

    // Empty state
    if (emptyState) {
      emptyState.hidden = matchingBooks.length > 0;

      const heading = emptyState.querySelector('strong');
      const message = emptyState.querySelector('span');

      if (heading) {
        heading.textContent = books.length === 0
          ? 'Your library is empty'
          : 'No matching books';
      }

      if (message) {
        message.textContent = books.length === 0
          ? 'Add your first book using the form above.'
          : 'Try another title, author, member, or book ID.';
      }
    }
  }

  // 1. Add a book
  addBookForm.addEventListener('submit', event => {
    event.preventDefault();

    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();

    if (!title || !author) {
      return notify('Enter both a book title and author.');
    }

    const nextId = books.reduce(
      (highest, book) => Math.max(highest, book.id),
      0
    ) + 1;

    books.push({
      id: nextId,
      title,
      author,
      status: 'Available',
      borrower: '-'
    });

    addBookForm.reset();
    saveAndRender();

    notify(`“${title}” was added to your library.`);
  });

  // 2. Lend a book
  lendForm.addEventListener('submit', event => {
    event.preventDefault();

    const id = Number(bookSelect.value);
    const borrower = borrowerSelect.value;
    const book = books.find(item => item.id === id);

    if (!borrower || !book || book.status !== 'Available') {
      return notify('Choose a member and an available book.');
    }

    book.status = 'Borrowed';
    book.borrower = borrower;

    lendForm.reset();
    saveAndRender();

    notify(`“${book.title}” was lent to ${borrower}.`);
  });

  // 3. Return or remove a book
  bookList.addEventListener('click', event => {
    const button = event.target.closest('button[data-action][data-id]');

    if (!button || !bookList.contains(button)) return;

    const id = Number(button.dataset.id);
    const book = books.find(item => item.id === id);

    if (!book) return;

    if (button.dataset.action === 'return' && book.status === 'Borrowed') {
      book.status = 'Available';
      book.borrower = '-';

      saveAndRender();
      notify(`“${book.title}” was returned.`);
    } else if (button.dataset.action === 'remove' && book.status === 'Available') {
      if (!window.confirm(`Remove “${book.title}” from your library?`)) return;

      books = books.filter(item => item.id !== id);

      saveAndRender();
      notify(`“${book.title}” was removed.`);
    }
  });

  // 4. Real-time catalog search
  searchInput?.addEventListener('input', render);

  // 5. Sidebar navigation
  function updateNavigation() {
    const hash = window.location.hash || '#overview';
    const links = document.querySelectorAll('.side-nav .nav-link');
    let activeLabel = 'Overview';

    links.forEach(link => {
      const active = link.getAttribute('href') === hash;

      link.classList.toggle('nav-link--active', active);

      if (active) {
        link.setAttribute('aria-current', 'page');
        activeLabel = link.textContent.trim();
      } else {
        link.removeAttribute('aria-current');
      }
    });

    const breadcrumb = document.querySelector('.breadcrumbs strong');

    if (breadcrumb) {
      breadcrumb.textContent = activeLabel;
    }
  }

  window.addEventListener('hashchange', updateNavigation);
  updateNavigation();

  // 6. Synchronize changes between browser tabs
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) {
      books = readBooks();
      render();
    }
  });

  // Initialize application
  render();
});

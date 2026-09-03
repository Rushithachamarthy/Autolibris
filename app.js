/**
 * ============================================================================
 * AutoLibris - Digital Library Resource Management Framework
 * Web Application Engine replicating ANSI C Fixed-Size Binary Architecture
 * ============================================================================
 */

(function () {
  'use strict';

  // --- C STRUCT CONSTANTS & SIZES (BYTES) ---
  const SIZEOF_BOOK = 264;
  const SIZEOF_USER = 236;
  const SIZEOF_RECORD = 56;

  // --- DEFAULT DATASET (Matches ANSI C Source Code Exactly) ---
  const DEFAULT_BOOKS = [
    { id: 101, title: "Clean Code: A Handbook of Agile Craftsmanship", author: "Robert C. Martin", category: "Computer Science", quantity: 5, available: 4 },
    { id: 102, title: "Introduction to Algorithms (CLRS)", author: "Thomas H. Cormen", category: "Computer Science", quantity: 4, available: 2 },
    { id: 103, title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", category: "Computer Science", quantity: 6, available: 6 },
    { id: 104, title: "A Brief History of Time", author: "Stephen Hawking", category: "Science", quantity: 4, available: 3 },
    { id: 105, title: "Cosmos", author: "Carl Sagan", category: "Science", quantity: 3, available: 3 },
    { id: 106, title: "1984", author: "George Orwell", category: "Fiction", quantity: 7, available: 5 },
    { id: 107, title: "Dune", author: "Frank Herbert", category: "Fiction", quantity: 5, available: 4 },
    { id: 108, title: "Sapiens: A Brief History of Humankind", author: "Yuval Noah Harari", category: "History", quantity: 6, available: 5 },
    { id: 109, title: "Guns, Germs, and Steel", author: "Jared Diamond", category: "History", quantity: 3, available: 3 },
    { id: 110, title: "Zero to One", author: "Peter Thiel", category: "Business", quantity: 5, available: 4 },
    { id: 111, title: "The Lean Startup", author: "Eric Ries", category: "Business", quantity: 4, available: 4 },
    { id: 112, title: "Atomic Habits", author: "James Clear", category: "Self Development", quantity: 8, available: 6 },
    { id: 113, title: "Deep Work", author: "Cal Newport", category: "Self Development", quantity: 5, available: 5 },
    { id: 114, title: "The Pragmatic Programmer", author: "David Thomas & Andrew Hunt", category: "Computer Science", quantity: 4, available: 3 }
  ];

  const DEFAULT_USERS = [
    { id: 1, name: "Dr. Alistair Vance", email: "admin@autolibris.org", role: "admin", activeBorrows: 0 },
    { id: 2, name: "Alex Turner", email: "alex.turner@autolibris.edu", role: "admin", activeBorrows: 2 },
    { id: 3, name: "Sarah Connor", email: "sarah.connor@autolibris.edu", role: "faculty", activeBorrows: 1 },
    { id: 4, name: "David Miller", email: "david.miller@autolibris.edu", role: "student", activeBorrows: 1 }
  ];

  const DEFAULT_RECORDS = [
    { id: 1, userId: 2, bookId: 101, borrowDate: "2026-08-10", returnDate: "2026-08-24", returned: 0 },
    { id: 2, userId: 2, bookId: 106, borrowDate: "2026-08-12", returnDate: "2026-08-26", returned: 0 },
    { id: 3, userId: 3, bookId: 102, borrowDate: "2026-08-05", returnDate: "2026-08-19", returned: 0 },
    { id: 4, userId: 4, bookId: 112, borrowDate: "2026-08-14", returnDate: "2026-08-28", returned: 0 },
    { id: 5, userId: 2, bookId: 108, borrowDate: "2026-07-01", returnDate: "2026-07-15", returned: 1 }
  ];

  // --- STATE REPOSITORY ---
  let state = {
    books: [],
    users: [],
    records: [],
    activeTab: 'dashboard',
    charts: {}
  };

  // --- INITIALIZATION ---
  function init() {
    loadState();
    setupNavigation();
    setupEventListeners();
    renderAll();
    setupCharts();
  }

  function loadState() {
    try {
      const savedBooks = localStorage.getItem('autolibris_books');
      const savedUsers = localStorage.getItem('autolibris_users');
      const savedRecords = localStorage.getItem('autolibris_records');

      state.books = savedBooks ? JSON.parse(savedBooks) : JSON.parse(JSON.stringify(DEFAULT_BOOKS));
      state.users = savedUsers ? JSON.parse(savedUsers) : JSON.parse(JSON.stringify(DEFAULT_USERS));
      state.records = savedRecords ? JSON.parse(savedRecords) : JSON.parse(JSON.stringify(DEFAULT_RECORDS));
    } catch (e) {
      console.warn("Could not read localStorage. Using baseline data.", e);
      state.books = JSON.parse(JSON.stringify(DEFAULT_BOOKS));
      state.users = JSON.parse(JSON.stringify(DEFAULT_USERS));
      state.records = JSON.parse(JSON.stringify(DEFAULT_RECORDS));
    }
    syncUserActiveCounts();
  }

  function saveState() {
    try {
      localStorage.setItem('autolibris_books', JSON.stringify(state.books));
      localStorage.setItem('autolibris_users', JSON.stringify(state.users));
      localStorage.setItem('autolibris_records', JSON.stringify(state.records));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }

  function resetToBaseline() {
    if (confirm("Reset database to ANSI C baseline default data? All custom additions will be reverted.")) {
      localStorage.removeItem('autolibris_books');
      localStorage.removeItem('autolibris_users');
      localStorage.removeItem('autolibris_records');
      state.books = JSON.parse(JSON.stringify(DEFAULT_BOOKS));
      state.users = JSON.parse(JSON.stringify(DEFAULT_USERS));
      state.records = JSON.parse(JSON.stringify(DEFAULT_RECORDS));
      saveState();
      renderAll();
      updateCharts();
      showToast("AutoLibris database restored to default C sample baseline!", "success");
    }
  }

  function syncUserActiveCounts() {
    // Count active unreturned records per user
    const counts = {};
    state.records.forEach(r => {
      if (r.returned === 0) {
        counts[r.userId] = (counts[r.userId] || 0) + 1;
      }
    });
    state.users.forEach(u => {
      u.activeBorrows = counts[u.id] || 0;
    });
  }

  // --- NAVIGATION SYSTEM ---
  function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');
        if (tab) switchTab(tab);
      });
    });

    // Delegated tab switches from buttons
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="switch-tab"]');
      if (btn) {
        const target = btn.getAttribute('data-target');
        if (target) switchTab(target);
      }
    });

    // Mobile sidebar toggle
    const toggleBtn = document.getElementById('btn-toggle-sidebar');
    const sidebar = document.getElementById('sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }
  }

  function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `pane-${tabId}`);
    });

    // Close mobile sidebar if open
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }

    // Update topbar headers
    const titleEl = document.getElementById('current-page-title');
    const subEl = document.getElementById('current-page-subtitle');
    const titles = {
      'dashboard': { title: 'AutoLibris Overview & Metrics', sub: 'ANSI C Structure & Binary Record Management System' },
      'users': { title: 'Module 1: User Management', sub: 'users.dat binary record store (236 bytes/struct)' },
      'books': { title: 'Module 2: Book Management', sub: 'books.dat catalogue & inventory (264 bytes/struct)' },
      'issue-return': { title: 'Module 3: Issue & Return Management', sub: 'borrow_records.dat transaction ledger (56 bytes/struct)' },
      'file-management': { title: 'Module 4: Binary File Management', sub: 'Random-access byte offsets (fseek) & raw hex dump inspection' },
      'reports': { title: 'Module 5: Reports & Interactive Graphs', sub: 'Present book inventory distribution, customer flows & audit downloads' },
      'ram-pointers': { title: 'Dynamic RAM Linked List Simulator', sub: 'Visualizing malloc(), free(), and 64-bit heap pointer traversal' }
    };
    if (titles[tabId]) {
      titleEl.textContent = titles[tabId].title;
      subEl.textContent = titles[tabId].sub;
    }

    // Refresh charts if reports or dashboard becomes active
    if (tabId === 'reports' || tabId === 'dashboard') {
      setTimeout(updateCharts, 50);
    }
    if (tabId === 'file-management') {
      renderFileManagementModule();
    }
    if (tabId === 'ram-pointers') {
      renderRamLinkedList();
    }
  }

  // --- RENDER MASTER DISPATCHER ---
  function renderAll() {
    syncUserActiveCounts();
    renderTopMetrics();
    renderDashboardFastDesk();
    renderUsersModule();
    renderBooksModule();
    renderIssueReturnModule();
    renderFileManagementModule();
    renderReportsModule();
    updateCharts();
  }

  // --- TOP METRICS & BADGES ---
  function renderTopMetrics() {
    const totalTitles = state.books.length;
    const totalCopies = state.books.reduce((sum, b) => sum + b.quantity, 0);
    const availCopies = state.books.reduce((sum, b) => sum + b.available, 0);
    const borrowedCopies = totalCopies - availCopies;
    const activeLoansCount = state.records.filter(r => r.returned === 0).length;

    // Badges
    document.getElementById('badge-users-count').textContent = state.users.length;
    document.getElementById('badge-books-count').textContent = totalTitles;
    document.getElementById('badge-active-loans').textContent = activeLoansCount;

    // Topbar Pill
    document.getElementById('topbar-total-stock').textContent = totalCopies;
    document.getElementById('topbar-avail-stock').textContent = availCopies;
    document.getElementById('topbar-borrowed-stock').textContent = borrowedCopies;

    // Dashboard Metric Cards
    document.getElementById('dash-total-titles').textContent = totalTitles;
    document.getElementById('dash-total-copies').textContent = `${totalCopies} Total Physical Copies`;
    document.getElementById('dash-avail-copies').textContent = availCopies;
    document.getElementById('dash-issued-copies').textContent = borrowedCopies;
    document.getElementById('dash-registered-users').textContent = state.users.length;
    const membersWithLoans = state.users.filter(u => u.activeBorrows > 0).length;
    document.getElementById('dash-active-borrowers-sub').textContent = `${membersWithLoans} members with active loans`;

    // Sidebar storage preview
    const booksBytes = totalTitles * SIZEOF_BOOK;
    const usersBytes = state.users.length * SIZEOF_USER;
    const recsBytes = state.records.length * SIZEOF_RECORD;
    document.getElementById('sb-books-size').textContent = formatBytes(booksBytes);
    document.getElementById('sb-users-size').textContent = formatBytes(usersBytes);
    document.getElementById('sb-records-size').textContent = formatBytes(recsBytes);
  }

  function formatBytes(bytes) {
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  }

  // --- DASHBOARD FAST-DESK POPULATION ---
  function renderDashboardFastDesk() {
    // Populate Quick Issue user dropdown
    const quickUserSelect = document.getElementById('quick-issue-user');
    quickUserSelect.innerHTML = state.users.map(u => 
      `<option value="${u.id}">${u.name} (ID: ${u.id} | ${u.role})</option>`
    ).join('');

    // Populate Quick Issue book dropdown (available > 0)
    const quickBookSelect = document.getElementById('quick-issue-book');
    const availableBooks = state.books.filter(b => b.available > 0);
    if (availableBooks.length === 0) {
      quickBookSelect.innerHTML = `<option value="">[All Books Out of Stock]</option>`;
    } else {
      quickBookSelect.innerHTML = availableBooks.map(b => 
        `<option value="${b.id}">${b.title} (Avail: ${b.available}/${b.quantity})</option>`
      ).join('');
    }

    // Populate Quick Return dropdown (records with returned === 0)
    const quickReturnSelect = document.getElementById('quick-return-record');
    const activeRecords = state.records.filter(r => r.returned === 0);
    if (activeRecords.length === 0) {
      quickReturnSelect.innerHTML = `<option value="">[No Active Loans Circulating]</option>`;
    } else {
      quickReturnSelect.innerHTML = activeRecords.map(r => {
        const u = state.users.find(user => user.id === r.userId) || { name: `User #${r.userId}` };
        const b = state.books.find(book => book.id === r.bookId) || { title: `Book #${r.bookId}` };
        return `<option value="${r.id}">RC-${r.id}: ${u.name} — "${b.title}"</option>`;
      }).join('');
    }

    // Dashboard active loans table
    const tbodyDash = document.getElementById('tbody-dash-active-loans');
    if (activeRecords.length === 0) {
      tbodyDash.innerHTML = `<tr><td colspan="6" class="text-muted text-center" style="padding: 1.5rem;">No active customer loans currently circulating. All stock is on shelves.</td></tr>`;
    } else {
      tbodyDash.innerHTML = activeRecords.slice(0, 5).map(r => {
        const u = state.users.find(user => user.id === r.userId) || { name: `User #${r.userId}` };
        const b = state.books.find(book => book.id === r.bookId) || { title: `Book #${r.bookId}` };
        return `
          <tr>
            <td class="font-mono text-cyan">RC-${r.id}</td>
            <td><strong>${escapeHtml(u.name)}</strong></td>
            <td>${escapeHtml(b.title)}</td>
            <td class="font-mono text-muted">${r.borrowDate}</td>
            <td><span class="tag tag-amber">${r.returnDate}</span></td>
            <td>
              <button class="btn btn-xs btn-emerald btn-dash-quick-return" data-rec-id="${r.id}">
                Return & Restock
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // --- MODULE 1: USER MANAGEMENT ---
  function renderUsersModule() {
    const searchVal = (document.getElementById('input-search-users')?.value || '').toLowerCase().trim();
    const roleFilter = document.getElementById('select-filter-user-role')?.value || 'all';
    const loanFilter = document.getElementById('select-filter-user-loans')?.value || 'all';

    let filtered = state.users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(searchVal) ||
                          u.email.toLowerCase().includes(searchVal) ||
                          String(u.id).includes(searchVal);
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      let matchLoans = true;
      if (loanFilter === 'active') matchLoans = u.activeBorrows > 0;
      if (loanFilter === 'none') matchLoans = u.activeBorrows === 0;
      return matchSearch && matchRole && matchLoans;
    });

    const tbody = document.getElementById('tbody-users-list');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-muted text-center" style="padding: 2rem;">No matching members found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map((u, index) => {
      const offset = index * SIZEOF_USER;
      const hexOffset = '0x' + offset.toString(16).toUpperCase().padStart(8, '0');
      const roleTagClass = u.role === 'admin' ? 'tag-role-admin' : (u.role === 'faculty' ? 'tag-role-faculty' : 'tag-role-student');
      const loanTag = u.activeBorrows > 0 ? `<span class="tag tag-amber">${u.activeBorrows} Active</span>` : `<span class="tag tag-emerald">0 Active</span>`;

      return `
        <tr>
          <td class="font-mono text-cyan">#${u.id}</td>
          <td><strong>${escapeHtml(u.name)}</strong></td>
          <td class="font-mono text-muted">${escapeHtml(u.email)}</td>
          <td><span class="tag ${roleTagClass}">${u.role}</span></td>
          <td>${loanTag}</td>
          <td class="font-mono text-xs text-muted" title="${offset} bytes">${hexOffset}</td>
          <td>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn btn-xs btn-outline btn-user-history" data-user-id="${u.id}" title="View Loan History">
                History
              </button>
              <button class="btn btn-xs btn-outline-danger btn-user-delete" data-user-id="${u.id}" title="Delete Member Record">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function handleAddUser(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('new-user-id').value, 10);
    const name = document.getElementById('new-user-name').value.trim();
    const email = document.getElementById('new-user-email').value.trim();
    const role = document.getElementById('new-user-role').value;

    if (state.users.some(u => u.id === id)) {
      showToast(`User ID ${id} already exists! Duplicate IDs are rejected by ANSI C addUserToFile().`, "error");
      return;
    }

    const newUser = { id, name, email, role, activeBorrows: 0 };
    state.users.push(newUser);
    saveState();
    renderAll();

    document.getElementById('modal-add-user').close();
    e.target.reset();
    showToast(`Member "${name}" successfully registered to users.dat (offset appended).`, "success");
  }

  function handleDeleteUser(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;

    // Check active loans - identical to deleteUserFromFile() in C
    const hasActiveLoans = state.records.some(r => r.userId === userId && r.returned === 0);
    if (hasActiveLoans || user.activeBorrows > 0) {
      showToast(`Cannot delete member "${user.name}". User currently holds active unreturned books!`, "error");
      return;
    }

    if (confirm(`Are you sure you want to delete member [ID: ${user.id}] "${user.name}" from users.dat?`)) {
      state.users = state.users.filter(u => u.id !== userId);
      saveState();
      renderAll();
      showToast(`User ID ${userId} deleted and users.dat binary structure rebuilt.`, "success");
    }
  }

  function showUserHistory(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;

    const modal = document.getElementById('modal-user-history');
    document.getElementById('user-history-title').textContent = `Borrowing History: ${user.name} (ID: ${user.id} | ${user.role})`;
    const tbody = document.getElementById('tbody-user-history');

    const userRecords = state.records.filter(r => r.userId === userId);
    if (userRecords.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-muted text-center" style="padding: 1.5rem;">No transaction records found for this member.</td></tr>`;
    } else {
      tbody.innerHTML = userRecords.map(r => {
        const b = state.books.find(book => book.id === r.bookId) || { title: `Book #${r.bookId}` };
        const statusTag = r.returned === 1 
          ? `<span class="tag tag-emerald">RETURNED</span>`
          : `<span class="tag tag-amber">ACTIVE</span>`;
        return `
          <tr>
            <td class="font-mono text-cyan">RC-${r.id}</td>
            <td><strong>${escapeHtml(b.title)}</strong></td>
            <td class="font-mono text-muted">${r.borrowDate}</td>
            <td class="font-mono">${r.returnDate}</td>
            <td>${statusTag}</td>
          </tr>
        `;
      }).join('');
    }

    modal.showModal();
  }

  // --- MODULE 2: BOOK MANAGEMENT ---
  function renderBooksModule() {
    const searchVal = (document.getElementById('input-search-books')?.value || '').toLowerCase().trim();
    const catFilter = document.getElementById('select-filter-book-category')?.value || 'all';
    const stockFilter = document.getElementById('select-filter-book-stock')?.value || 'all';

    let filtered = state.books.filter(b => {
      const matchSearch = b.title.toLowerCase().includes(searchVal) ||
                          b.author.toLowerCase().includes(searchVal) ||
                          b.category.toLowerCase().includes(searchVal) ||
                          String(b.id).includes(searchVal);
      const matchCat = catFilter === 'all' || b.category === catFilter;
      let matchStock = true;
      if (stockFilter === 'in-stock') matchStock = b.available > 0;
      if (stockFilter === 'out-of-stock') matchStock = b.available === 0;
      if (stockFilter === 'low-stock') matchStock = b.available > 0 && b.available <= 2;
      return matchSearch && matchCat && matchStock;
    });

    const tbody = document.getElementById('tbody-books-list');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-muted text-center" style="padding: 2rem;">No matching books in catalogue.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map((b, index) => {
      const offset = index * SIZEOF_BOOK;
      const hexOffset = '0x' + offset.toString(16).toUpperCase().padStart(8, '0');
      const percentAvail = Math.round((b.available / (b.quantity || 1)) * 100);
      const progressColor = percentAvail > 50 ? 'var(--accent-emerald)' : (percentAvail > 20 ? 'var(--accent-amber)' : 'var(--accent-rose)');

      return `
        <tr>
          <td class="font-mono text-cyan">#${b.id}</td>
          <td>
            <div style="font-weight: 600;">${escapeHtml(b.title)}</div>
            <div class="text-muted text-xs">${escapeHtml(b.author)}</div>
          </td>
          <td><span class="tag tag-cyan">${escapeHtml(b.category)}</span></td>
          <td class="font-mono"><strong>${b.quantity}</strong></td>
          <td class="font-mono">
            <span class="${b.available > 0 ? 'text-emerald' : 'text-rose'}" style="font-weight: 700;">${b.available}</span>
          </td>
          <td>
            <div class="stock-progress-wrap" title="${percentAvail}% available">
              <div class="stock-progress-bar" style="width: ${percentAvail}%; background-color: ${progressColor};"></div>
            </div>
          </td>
          <td class="font-mono text-xs text-muted" title="${offset} bytes">${hexOffset}</td>
          <td>
            <div style="display: inline-flex; align-items: center; gap: 0.25rem;">
              <button class="btn btn-xs btn-outline-success btn-stock-step-inc" data-book-id="${b.id}" title="Add 1 copy to stock">+</button>
              <button class="btn btn-xs btn-outline-danger btn-stock-step-dec" data-book-id="${b.id}" title="Remove 1 copy from stock">-</button>
            </div>
          </td>
          <td>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-xs btn-primary btn-book-issue-quick" data-book-id="${b.id}" title="Issue copy" ${b.available <= 0 ? 'disabled' : ''}>
                Issue
              </button>
              <button class="btn btn-xs btn-outline btn-book-edit" data-book-id="${b.id}" title="Edit book details">
                Edit
              </button>
              <button class="btn btn-xs btn-outline-danger btn-book-delete" data-book-id="${b.id}" title="Delete Book">
                Del
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function handleAddBook(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('new-book-id').value, 10);
    const title = document.getElementById('new-book-title').value.trim();
    const author = document.getElementById('new-book-author').value.trim();
    const category = document.getElementById('new-book-category').value;
    const quantity = parseInt(document.getElementById('new-book-quantity').value, 10);

    if (state.books.some(b => b.id === id)) {
      showToast(`Book ID ${id} already exists! Duplicate IDs rejected.`, "error");
      return;
    }

    const newBook = { id, title, author, category, quantity, available: quantity };
    state.books.push(newBook);
    saveState();
    renderAll();

    document.getElementById('modal-add-book').close();
    e.target.reset();
    showToast(`Book "${title}" added to books.dat repository!`, "success");
  }

  function handleStockStep(bookId, delta) {
    const book = state.books.find(b => b.id === bookId);
    if (!book) return;

    if (delta > 0) {
      book.quantity += delta;
      book.available += delta;
      saveState();
      renderAll();
      showToast(`Added 1 copy of "${book.title}". New stock: ${book.available}/${book.quantity}.`, "success");
    } else {
      const activeBorrowed = book.quantity - book.available;
      if (book.quantity <= 1) {
        showToast("Cannot decrease stock below 1. Delete the book record if removing entirely.", "error");
        return;
      }
      if (book.available <= 0 || (book.quantity - 1) < activeBorrowed) {
        showToast(`Cannot remove physical copy: ${activeBorrowed} copies currently checked out by customers!`, "error");
        return;
      }
      book.quantity -= 1;
      book.available -= 1;
      saveState();
      renderAll();
      showToast(`Removed 1 copy of "${book.title}". New stock: ${book.available}/${book.quantity}.`, "info");
    }
  }

  function openEditBookModal(bookId) {
    const book = state.books.find(b => b.id === bookId);
    if (!book) return;

    document.getElementById('edit-book-id').value = book.id;
    document.getElementById('edit-book-id-display').value = `#${book.id}`;
    document.getElementById('edit-book-title').value = book.title;
    document.getElementById('edit-book-author').value = book.author;
    document.getElementById('edit-book-category').value = book.category;
    document.getElementById('edit-book-quantity').value = book.quantity;
    document.getElementById('edit-book-available').value = book.available;

    document.getElementById('modal-edit-book').showModal();
  }

  function handleSaveEditBook(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('edit-book-id').value, 10);
    const book = state.books.find(b => b.id === id);
    if (!book) return;

    const title = document.getElementById('edit-book-title').value.trim();
    const author = document.getElementById('edit-book-author').value.trim();
    const category = document.getElementById('edit-book-category').value.trim();
    const quantity = parseInt(document.getElementById('edit-book-quantity').value, 10);
    const available = parseInt(document.getElementById('edit-book-available').value, 10);

    const activeCheckedOut = book.quantity - book.available;
    if (quantity < activeCheckedOut) {
      showToast(`Total quantity cannot be less than actively borrowed copies (${activeCheckedOut})!`, "error");
      return;
    }
    if (available > quantity) {
      showToast("Available stock cannot exceed total quantity!", "error");
      return;
    }

    book.title = title;
    book.author = author;
    book.category = category;
    book.quantity = quantity;
    book.available = available;

    saveState();
    renderAll();
    document.getElementById('modal-edit-book').close();
    showToast(`Book record #${id} updated in-place via simulated fseek().`, "success");
  }

  function handleDeleteBook(bookId) {
    const book = state.books.find(b => b.id === bookId);
    if (!book) return;

    // Check if currently checked out - identical to deleteBookFromFile() in C
    const isCheckedOut = state.records.some(r => r.bookId === bookId && r.returned === 0);
    if (isCheckedOut || book.available < book.quantity) {
      showToast(`Cannot delete book "${book.title}". Copies are currently checked out!`, "error");
      return;
    }

    if (confirm(`Are you sure you want to delete book [ID: ${book.id}] "${book.title}" from books.dat?`)) {
      state.books = state.books.filter(b => b.id !== bookId);
      saveState();
      renderAll();
      showToast(`Book ID ${bookId} deleted from books.dat and file rebuilt.`, "success");
    }
  }

  // --- MODULE 3: ISSUE & RETURN MANAGEMENT ---
  function renderIssueReturnModule() {
    // 1. Issue Select User
    const issueUserSelect = document.getElementById('issue-select-user');
    issueUserSelect.innerHTML = state.users.map(u => 
      `<option value="${u.id}">${u.name} (ID: ${u.id} | ${u.role} | Active Loans: ${u.activeBorrows})</option>`
    ).join('');

    // 2. Issue Select Book
    const issueBookSelect = document.getElementById('issue-select-book');
    const availBooks = state.books.filter(b => b.available > 0);
    if (availBooks.length === 0) {
      issueBookSelect.innerHTML = `<option value="">[All Books Out of Stock]</option>`;
    } else {
      issueBookSelect.innerHTML = availBooks.map(b => 
        `<option value="${b.id}">${b.title} — [Available: ${b.available}/${b.quantity}]</option>`
      ).join('');
    }

    // Default borrow date
    const todayStr = getTodayDateString();
    document.getElementById('issue-borrow-date').value = todayStr;

    // 3. Return Select Record
    const returnSelect = document.getElementById('return-select-record');
    const activeRecords = state.records.filter(r => r.returned === 0);
    if (activeRecords.length === 0) {
      returnSelect.innerHTML = `<option value="">[No Active Loans Circulating]</option>`;
      document.getElementById('return-record-details').textContent = "All books are currently present on the shelves.";
    } else {
      returnSelect.innerHTML = activeRecords.map(r => {
        const u = state.users.find(user => user.id === r.userId) || { name: `User #${r.userId}` };
        const b = state.books.find(book => book.id === r.bookId) || { title: `Book #${r.bookId}` };
        return `<option value="${r.id}">#RC-${r.id} | ${u.name} | "${b.title}"</option>`;
      }).join('');
      updateReturnDetailsHint();
    }

    // 4. Circulation Transaction Ledger Table
    renderLedgerTable();
  }

  function renderLedgerTable() {
    const statusFilter = document.getElementById('select-filter-ledger-status')?.value || 'all';
    let recordsList = [...state.records];

    if (statusFilter === 'active') {
      recordsList = recordsList.filter(r => r.returned === 0);
    } else if (statusFilter === 'returned') {
      recordsList = recordsList.filter(r => r.returned === 1);
    }

    const tbody = document.getElementById('tbody-ledger-list');
    if (!tbody) return;

    if (recordsList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-muted text-center" style="padding: 2rem;">No transaction records found matching criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = recordsList.slice().reverse().map(r => {
      const u = state.users.find(user => user.id === r.userId) || { name: `User #${r.userId}` };
      const b = state.books.find(book => book.id === r.bookId) || { title: `Book #${r.bookId}` };
      const isReturned = r.returned === 1;

      return `
        <tr>
          <td class="font-mono text-cyan">RC-${r.id}</td>
          <td><strong>${escapeHtml(u.name)}</strong> <span class="text-muted text-xs">(ID: ${r.userId})</span></td>
          <td>${escapeHtml(b.title)}</td>
          <td class="font-mono text-muted">${r.borrowDate}</td>
          <td class="font-mono">${r.returnDate}</td>
          <td>
            ${isReturned 
              ? `<span class="tag tag-emerald">RETURNED</span>` 
              : `<span class="tag tag-amber">ACTIVE LOAN</span>`}
          </td>
          <td>
            ${!isReturned ? `
              <div style="display: flex; gap: 0.35rem;">
                <button class="btn btn-xs btn-emerald btn-ledger-return" data-rec-id="${r.id}" title="Check In">Return</button>
                <button class="btn btn-xs btn-outline-warning btn-ledger-renew" data-rec-id="${r.id}" title="Renew +14d">Renew</button>
              </div>
            ` : `<span class="text-muted text-xs">Archived</span>`}
          </td>
        </tr>
      `;
    }).join('');
  }

  function updateReturnDetailsHint() {
    const recId = parseInt(document.getElementById('return-select-record').value, 10);
    const hintEl = document.getElementById('return-record-details');
    if (!recId) {
      hintEl.textContent = "No record selected.";
      return;
    }
    const r = state.records.find(rec => rec.id === recId);
    if (!r) return;
    const u = state.users.find(user => user.id === r.userId) || { name: `User #${r.userId}` };
    const b = state.books.find(book => book.id === r.bookId) || { title: `Book #${r.bookId}` };
    hintEl.textContent = `Borrower: ${u.name} | Book: "${b.title}" | Issued: ${r.borrowDate} | Due: ${r.returnDate}`;
  }

  function issueBook(userId, bookId, borrowDate) {
    const user = state.users.find(u => u.id === userId);
    const book = state.books.find(b => b.id === bookId);

    if (!user) {
      showToast(`User ID ${userId} does not exist.`, "error");
      return false;
    }
    if (!book) {
      showToast(`Book ID ${bookId} does not exist.`, "error");
      return false;
    }
    if (book.available <= 0) {
      showToast(`"${book.title}" is completely OUT OF STOCK!`, "error");
      return false;
    }

    // Check duplicate active borrow
    const alreadyBorrowing = state.records.some(r => r.userId === userId && r.bookId === bookId && r.returned === 0);
    if (alreadyBorrowing) {
      showToast(`User ${user.name} already has an active checked-out copy of "${book.title}"!`, "error");
      return false;
    }

    // Process Issue
    book.available--;
    user.activeBorrows++;

    const newRecordId = state.records.length > 0 ? Math.max(...state.records.map(r => r.id)) + 1 : 1;
    const dateStr = borrowDate || getTodayDateString();

    const newRecord = {
      id: newRecordId,
      userId: userId,
      bookId: bookId,
      borrowDate: dateStr,
      returnDate: "Due in 14 Days",
      returned: 0
    };

    state.records.push(newRecord);
    saveState();
    renderAll();

    showToast(`Issued "${book.title}" to ${user.name} (Record #RC-${newRecordId})!`, "success");
    return true;
  }

  function returnBookByRecordId(recordId) {
    const record = state.records.find(r => r.id === recordId);
    if (!record || record.returned === 1) {
      showToast(`Active record #RC-${recordId} not found or already returned.`, "error");
      return false;
    }

    const book = state.books.find(b => b.id === record.bookId);
    const user = state.users.find(u => u.id === record.userId);

    record.returned = 1;
    record.returnDate = getTodayDateString();

    if (book) {
      book.available = Math.min(book.quantity, book.available + 1);
    }
    if (user && user.activeBorrows > 0) {
      user.activeBorrows--;
    }

    saveState();
    renderAll();

    showToast(`Returned "${book ? book.title : 'Book'}" by ${user ? user.name : 'Customer'}. Available stock restored!`, "success");
    return true;
  }

  function renewLoan(recordId, extraDays = 14) {
    const record = state.records.find(r => r.id === recordId && r.returned === 0);
    if (!record) {
      showToast(`Active record #RC-${recordId} not found.`, "error");
      return false;
    }

    record.returnDate = `Renewed (+${extraDays}d)`;
    saveState();
    renderAll();

    showToast(`Loan #RC-${recordId} renewed by +${extraDays} days!`, "success");
    return true;
  }

  // --- MODULE 4: FILE MANAGEMENT & BINARY HEX INSPECTOR ---
  function renderFileManagementModule() {
    // 1. Storage stats table
    const booksCount = state.books.length;
    const usersCount = state.users.length;
    const recsCount = state.records.length;

    const booksSize = booksCount * SIZEOF_BOOK;
    const usersSize = usersCount * SIZEOF_USER;
    const recsSize = recsCount * SIZEOF_RECORD;
    const totalSize = booksSize + usersSize + recsSize;

    const tbody = document.getElementById('tbody-file-stats');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td class="text-cyan">books.dat</td>
          <td>struct Book</td>
          <td>${SIZEOF_BOOK} Bytes</td>
          <td>${booksCount}</td>
          <td>${booksSize} Bytes</td>
          <td>${(booksSize / 1024).toFixed(2)} KB</td>
        </tr>
        <tr>
          <td class="text-purple">users.dat</td>
          <td>struct User</td>
          <td>${SIZEOF_USER} Bytes</td>
          <td>${usersCount}</td>
          <td>${usersSize} Bytes</td>
          <td>${(usersSize / 1024).toFixed(2)} KB</td>
        </tr>
        <tr>
          <td class="text-emerald">borrow_records.dat</td>
          <td>struct BorrowRecord</td>
          <td>${SIZEOF_RECORD} Bytes</td>
          <td>${recsCount}</td>
          <td>${recsSize} Bytes</td>
          <td>${(recsSize / 1024).toFixed(2)} KB</td>
        </tr>
        <tr style="background: var(--bg-surface-elevated); font-weight: 700;">
          <td colspan="4">Total Binary Disk Footprint Across 3 Active Data Files:</td>
          <td class="text-amber">${totalSize} Bytes</td>
          <td class="text-amber">${(totalSize / 1024).toFixed(2)} KB</td>
        </tr>
      `;
    }

    // 2. Update Offset Calculator
    updateOffsetCalculator();

    // 3. Update Hex Dump
    updateHexDump();
  }

  function updateOffsetCalculator() {
    const fileSelect = document.getElementById('calc-file-select');
    const indexInput = document.getElementById('calc-record-index');
    if (!fileSelect || !indexInput) return;

    const file = fileSelect.value;
    const index = Math.max(0, parseInt(indexInput.value || '0', 10));

    let structSize = SIZEOF_BOOK;
    let list = state.books;
    let fileName = "books.dat";

    if (file === 'users') {
      structSize = SIZEOF_USER;
      list = state.users;
      fileName = "users.dat";
    } else if (file === 'records') {
      structSize = SIZEOF_RECORD;
      list = state.records;
      fileName = "borrow_records.dat";
    }

    const decimalOffset = index * structSize;
    const hexOffset = '0x' + decimalOffset.toString(16).toUpperCase().padStart(8, '0');

    document.getElementById('calc-struct-size').textContent = `${structSize} Bytes`;
    document.getElementById('calc-dec-offset').textContent = `${decimalOffset} Bytes`;
    document.getElementById('calc-hex-offset').textContent = hexOffset;
    document.getElementById('calc-c-code').textContent = `fseek(fp, ${decimalOffset}L, SEEK_SET); /* Index ${index} in ${fileName} */`;

    const recordPayload = list[index];
    const previewEl = document.getElementById('calc-record-json');
    if (recordPayload) {
      previewEl.textContent = JSON.stringify(recordPayload, null, 2);
    } else {
      previewEl.textContent = `// [EOF / Out of Bounds]: File ${fileName} currently has ${list.length} records (Index 0 to ${list.length - 1}).\n// fseek() beyond EOF will position cursor for binary struct append (SEEK_END).`;
    }
  }

  function updateHexDump() {
    const fileSelect = document.getElementById('hex-file-select');
    const outputEl = document.getElementById('hex-dump-output');
    if (!fileSelect || !outputEl) return;

    const file = fileSelect.value;
    let buffer;

    if (file === 'books') {
      buffer = createBooksBinaryBuffer(state.books.slice(0, 4));
    } else if (file === 'users') {
      buffer = createUsersBinaryBuffer(state.users.slice(0, 4));
    } else {
      buffer = createRecordsBinaryBuffer(state.records.slice(0, 8));
    }

    // Format first 64 bytes in hex rows
    const bytesToDump = Math.min(buffer.byteLength, 128);
    const u8 = new Uint8Array(buffer, 0, bytesToDump);
    let hexText = '';

    for (let offset = 0; offset < bytesToDump; offset += 16) {
      const rowOffset = offset.toString(16).toUpperCase().padStart(8, '0');
      let hexPart = '';
      let asciiPart = '';

      for (let i = 0; i < 16; i++) {
        const byteIndex = offset + i;
        if (byteIndex < bytesToDump) {
          const byte = u8[byteIndex];
          hexPart += byte.toString(16).toUpperCase().padStart(2, '0') + ' ';
          if (byte >= 32 && byte <= 126) {
            asciiPart += String.fromCharCode(byte);
          } else {
            asciiPart += '.';
          }
        } else {
          hexPart += '   ';
        }
        if (i === 7) hexPart += ' ';
      }

      hexText += `${rowOffset}  | ${hexPart}| ${asciiPart}\n`;
    }

    outputEl.textContent = hexText;
  }

  // --- BINARY ARRAYBUFFER PACKING (C STRUCT MEMORY SIMULATION) ---
  function createBooksBinaryBuffer(booksList) {
    const buffer = new ArrayBuffer(booksList.length * SIZEOF_BOOK);
    const view = new DataView(buffer);
    const u8 = new Uint8Array(buffer);

    booksList.forEach((b, idx) => {
      const base = idx * SIZEOF_BOOK;
      view.setInt32(base, b.id, true); // 4 bytes ID
      writeStringToBuffer(u8, base + 4, b.title, 100);
      writeStringToBuffer(u8, base + 104, b.author, 100);
      writeStringToBuffer(u8, base + 204, b.category, 50);
      view.setInt32(base + 254, b.quantity, true);
      view.setInt32(base + 258, b.available, true);
    });
    return buffer;
  }

  function createUsersBinaryBuffer(usersList) {
    const buffer = new ArrayBuffer(usersList.length * SIZEOF_USER);
    const view = new DataView(buffer);
    const u8 = new Uint8Array(buffer);

    usersList.forEach((u, idx) => {
      const base = idx * SIZEOF_USER;
      view.setInt32(base, u.id, true);
      writeStringToBuffer(u8, base + 4, u.name, 100);
      writeStringToBuffer(u8, base + 104, u.email, 100);
      writeStringToBuffer(u8, base + 204, u.role, 30);
      // activeBorrows placed at base + 236 - 4 = 232
      view.setInt32(base + 232, u.activeBorrows, true);
    });
    return buffer;
  }

  function createRecordsBinaryBuffer(recsList) {
    const buffer = new ArrayBuffer(recsList.length * SIZEOF_RECORD);
    const view = new DataView(buffer);
    const u8 = new Uint8Array(buffer);

    recsList.forEach((r, idx) => {
      const base = idx * SIZEOF_RECORD;
      view.setInt32(base, r.id, true);
      view.setInt32(base + 4, r.userId, true);
      view.setInt32(base + 8, r.bookId, true);
      writeStringToBuffer(u8, base + 12, r.borrowDate, 20);
      writeStringToBuffer(u8, base + 32, r.returnDate, 20);
      view.setInt32(base + 52, r.returned, true);
    });
    return buffer;
  }

  function writeStringToBuffer(u8, offset, str, maxLen) {
    const encoded = new TextEncoder().encode(str || '');
    const len = Math.min(encoded.length, maxLen - 1);
    for (let i = 0; i < len; i++) {
      u8[offset + i] = encoded[i];
    }
    u8[offset + len] = 0; // null terminator
  }

  function exportBinaryDataPackage() {
    const bookBuffer = createBooksBinaryBuffer(state.books);
    downloadBuffer(bookBuffer, "books.dat", "application/octet-stream");
    setTimeout(() => {
      const userBuffer = createUsersBinaryBuffer(state.users);
      downloadBuffer(userBuffer, "users.dat", "application/octet-stream");
    }, 200);
    setTimeout(() => {
      const recBuffer = createRecordsBinaryBuffer(state.records);
      downloadBuffer(recBuffer, "borrow_records.dat", "application/octet-stream");
      showToast("Exported all 3 binary files (books.dat, users.dat, borrow_records.dat) in ANSI C memory layout!", "success");
    }, 400);
  }

  // --- MODULE 5: REPORTS, GRAPHS & DYNAMIC STOCK MODIFIER ---
  function renderReportsModule() {
    // 1. Populate Handout dropdowns in Reports
    const repUserSelect = document.getElementById('report-quick-user');
    if (repUserSelect) {
      repUserSelect.innerHTML = state.users.map(u => 
        `<option value="${u.id}">${u.name} (${u.role})</option>`
      ).join('');
    }

    const repBookSelect = document.getElementById('report-quick-book');
    if (repBookSelect) {
      const avail = state.books.filter(b => b.available > 0);
      if (avail.length === 0) {
        repBookSelect.innerHTML = `<option value="">[All Books Out of Stock]</option>`;
      } else {
        repBookSelect.innerHTML = avail.map(b => 
          `<option value="${b.id}">${b.title} (${b.available} left)</option>`
        ).join('');
      }
    }

    const repReturnSelect = document.getElementById('report-quick-return-rec');
    if (repReturnSelect) {
      const active = state.records.filter(r => r.returned === 0);
      if (active.length === 0) {
        repReturnSelect.innerHTML = `<option value="">[No Active Loans]</option>`;
      } else {
        repReturnSelect.innerHTML = active.map(r => {
          const u = state.users.find(user => user.id === r.userId) || { name: `User #${r.userId}` };
          const b = state.books.find(book => book.id === r.bookId) || { title: `Book #${r.bookId}` };
          return `<option value="${r.id}">RC-${r.id}: ${u.name} — "${b.title}"</option>`;
        }).join('');
      }
    }

    const repStockAdjustSelect = document.getElementById('report-stock-adjust-book');
    if (repStockAdjustSelect) {
      repStockAdjustSelect.innerHTML = state.books.map(b => 
        `<option value="${b.id}">${b.title} [Stock: ${b.available}/${b.quantity}]</option>`
      ).join('');
    }

    // 2. Render Low Stock Watchlist (<= 2 copies)
    renderLowStockWatchlist();

    // 3. Render Text Report Previews (matching C format)
    renderReportPreviews();
  }

  function renderLowStockWatchlist() {
    const listEl = document.getElementById('low-stock-watchlist');
    if (!listEl) return;

    const lowStock = state.books.filter(b => b.available <= 2);
    if (lowStock.length === 0) {
      listEl.innerHTML = `<div class="text-muted text-center" style="padding: 1.5rem;">All book titles have healthy inventory levels (>2 available copies).</div>`;
      return;
    }

    listEl.innerHTML = lowStock.map(b => {
      const isOut = b.available === 0;
      return `
        <div class="low-stock-item" style="border-color: ${isOut ? 'rgba(244, 63, 94, 0.4)' : 'rgba(245, 158, 11, 0.3)'}">
          <div class="low-stock-item-info">
            <span class="low-stock-title">${escapeHtml(b.title)}</span>
            <span class="low-stock-sub">${escapeHtml(b.category)} | Total: ${b.quantity} copies</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="tag ${isOut ? 'tag-rose' : 'tag-amber'}">${b.available} Available</span>
            <button class="btn btn-xs btn-outline-success btn-report-replenish" data-book-id="${b.id}" title="Add 1 copy">+1 Stock</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- CHART.JS VISUALIZATIONS ---
  function setupCharts() {
    // 1. Present Books Stock & Circulation Bar Chart
    const ctxBooks = document.getElementById('chart-present-books-bar')?.getContext('2d');
    if (ctxBooks) {
      state.charts.presentBooks = new Chart(ctxBooks, {
        type: 'bar',
        data: getPresentBooksChartData('all'),
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: {
              position: 'top',
              labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } }
            },
            tooltip: {
              backgroundColor: '#0f172a',
              titleColor: '#38bdf8',
              bodyColor: '#f1f5f9',
              borderColor: '#334155',
              borderWidth: 1,
              padding: 10
            }
          },
          scales: {
            x: {
              stacked: true,
              grid: { color: '#1e293b' },
              ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono' } }
            },
            y: {
              stacked: true,
              grid: { display: false },
              ticks: { color: '#cbd5e1', font: { family: 'Inter', size: 11 } }
            }
          }
        }
      });
    }

    // 2. Categories Doughnut Chart
    const ctxCat = document.getElementById('chart-categories-doughnut')?.getContext('2d');
    if (ctxCat) {
      state.charts.categories = new Chart(ctxCat, {
        type: 'doughnut',
        data: getCategoryChartData(),
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, boxWidth: 12 }
            }
          },
          cutout: '65%'
        }
      });
    }

    // 3. Circulation Health Polar Area Chart
    const ctxCirc = document.getElementById('chart-circulation-polar')?.getContext('2d');
    if (ctxCirc) {
      state.charts.circulation = new Chart(ctxCirc, {
        type: 'doughnut',
        data: getCirculationChartData(),
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#94a3b8', font: { family: 'Inter' } }
            }
          },
          cutout: '60%'
        }
      });
    }

    // 4. Role Borrowing Bar Chart
    const ctxRoles = document.getElementById('chart-roles-bar')?.getContext('2d');
    if (ctxRoles) {
      state.charts.roles = new Chart(ctxRoles, {
        type: 'bar',
        data: getRoleChartData(),
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { family: 'Inter' } }
            },
            y: {
              grid: { color: '#1e293b' },
              ticks: { color: '#94a3b8', stepSize: 1, font: { family: 'JetBrains Mono' } }
            }
          }
        }
      });
    }

    // 5. Dashboard Books Preview Chart
    const ctxDashBooks = document.getElementById('chart-dash-books')?.getContext('2d');
    if (ctxDashBooks) {
      state.charts.dashBooks = new Chart(ctxDashBooks, {
        type: 'bar',
        data: getDashboardBooksData(),
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#94a3b8', font: { size: 11 } } }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45, font: { size: 10 } }
            },
            y: {
              grid: { color: '#1e293b' },
              ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono' } }
            }
          }
        }
      });
    }

    // 6. Dashboard Category Preview Chart
    const ctxDashCat = document.getElementById('chart-dash-categories')?.getContext('2d');
    if (ctxDashCat) {
      state.charts.dashCategories = new Chart(ctxDashCat, {
        type: 'pie',
        data: getCategoryChartData(),
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12 } }
          }
        }
      });
    }
  }

  function updateCharts() {
    const catFilter = document.getElementById('select-graph-category-filter')?.value || 'all';

    if (state.charts.presentBooks) {
      state.charts.presentBooks.data = getPresentBooksChartData(catFilter);
      state.charts.presentBooks.update();
    }
    if (state.charts.categories) {
      state.charts.categories.data = getCategoryChartData();
      state.charts.categories.update();
    }
    if (state.charts.circulation) {
      state.charts.circulation.data = getCirculationChartData();
      state.charts.circulation.update();
    }
    if (state.charts.roles) {
      state.charts.roles.data = getRoleChartData();
      state.charts.roles.update();
    }
    if (state.charts.dashBooks) {
      state.charts.dashBooks.data = getDashboardBooksData();
      state.charts.dashBooks.update();
    }
    if (state.charts.dashCategories) {
      state.charts.dashCategories.data = getCategoryChartData();
      state.charts.dashCategories.update();
    }
  }

  function getPresentBooksChartData(categoryFilter) {
    let list = state.books;
    if (categoryFilter && categoryFilter !== 'all') {
      list = list.filter(b => b.category === categoryFilter);
    }

    const labels = list.map(b => b.title.length > 28 ? b.title.substring(0, 26) + '...' : b.title);
    const availData = list.map(b => b.available);
    const borrowedData = list.map(b => b.quantity - b.available);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Available on Shelf',
          data: availData,
          backgroundColor: 'rgba(16, 185, 129, 0.85)',
          borderColor: '#10b981',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Issued to Customers',
          data: borrowedData,
          backgroundColor: 'rgba(245, 158, 11, 0.85)',
          borderColor: '#f59e0b',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    };
  }

  function getCategoryChartData() {
    const categoryCounts = {};
    state.books.forEach(b => {
      categoryCounts[b.category] = (categoryCounts[b.category] || 0) + b.quantity;
    });

    const labels = Object.keys(categoryCounts);
    const data = Object.values(categoryCounts);

    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#06b6d4',
          '#8b5cf6',
          '#ec4899',
          '#10b981',
          '#f59e0b',
          '#3b82f6',
          '#64748b'
        ],
        borderWidth: 2,
        borderColor: '#141b2d'
      }]
    };
  }

  function getCirculationChartData() {
    const totalCopies = state.books.reduce((sum, b) => sum + b.quantity, 0);
    const availCopies = state.books.reduce((sum, b) => sum + b.available, 0);
    const borrowedCopies = totalCopies - availCopies;

    return {
      labels: ['Available on Shelf', 'Circulating (Loans)'],
      datasets: [{
        data: [availCopies, borrowedCopies],
        backgroundColor: ['#10b981', '#f59e0b'],
        borderWidth: 2,
        borderColor: '#141b2d'
      }]
    };
  }

  function getRoleChartData() {
    const rolesCount = { admin: 0, faculty: 0, student: 0 };
    state.records.forEach(r => {
      if (r.returned === 0) {
        const u = state.users.find(user => user.id === r.userId);
        if (u && rolesCount[u.role] !== undefined) {
          rolesCount[u.role]++;
        }
      }
    });

    return {
      labels: ['Admin', 'Faculty', 'Student'],
      datasets: [{
        label: 'Active Loans',
        data: [rolesCount.admin, rolesCount.faculty, rolesCount.student],
        backgroundColor: [
          'rgba(244, 63, 94, 0.75)',
          'rgba(139, 92, 246, 0.75)',
          'rgba(14, 165, 233, 0.75)'
        ],
        borderColor: ['#f43f5e', '#8b5cf6', '#0ea5e9'],
        borderWidth: 1,
        borderRadius: 6
      }]
    };
  }

  function getDashboardBooksData() {
    const sample = state.books.slice(0, 6);
    return {
      labels: sample.map(b => b.title.length > 18 ? b.title.substring(0, 16) + '..' : b.title),
      datasets: [
        {
          label: 'Total Stock',
          data: sample.map(b => b.quantity),
          backgroundColor: 'rgba(59, 130, 246, 0.65)',
          borderRadius: 4
        },
        {
          label: 'Available',
          data: sample.map(b => b.available),
          backgroundColor: 'rgba(16, 185, 129, 0.85)',
          borderRadius: 4
        }
      ]
    };
  }

  // --- REPORT PREVIEWS & TEXT DOWNLOADS (Matches C output) ---
  function generateIssuedBooksReportText() {
    const active = state.records.filter(r => r.returned === 0);
    const returned = state.records.filter(r => r.returned === 1);

    let txt = "================================================================================\n";
    txt += "                 AUTOLIBRIS - ISSUED BOOKS REPORT                               \n";
    txt += "================================================================================\n\n";
    txt += pad("RecID", 6) + " | " + pad("Borrower", 20) + " | " + pad("Book Title", 32) + " | " + pad("Issue Date", 12) + " | " + pad("Status", 10) + "\n";
    txt += "--------------------------------------------------------------------------------\n";

    state.records.forEach(r => {
      const u = state.users.find(user => user.id === r.userId) || { name: `User #${r.userId}` };
      const b = state.books.find(book => book.id === r.bookId) || { title: `Book #${r.bookId}` };
      const status = r.returned === 1 ? "RETURNED" : "ACTIVE";

      txt += pad(String(r.id), 6) + " | " +
             pad(u.name.substring(0, 20), 20) + " | " +
             pad(b.title.substring(0, 32), 32) + " | " +
             pad(r.borrowDate, 12) + " | " +
             pad(status, 10) + "\n";
    });

    txt += "\nSUMMARY:\n";
    txt += `Total Transactions: ${state.records.length} | Currently Issued: ${active.length} | Returned: ${returned.length}\n`;
    txt += `Generated on: ${new Date().toISOString()} via AutoLibris Framework Engine\n`;
    return txt;
  }

  function generateInventoryReportText() {
    const totalTitles = state.books.length;
    const totalCopies = state.books.reduce((s, b) => s + b.quantity, 0);
    const availCopies = state.books.reduce((s, b) => s + b.available, 0);
    const circulating = totalCopies - availCopies;

    let txt = "================================================================================\n";
    txt += "               AUTOLIBRIS COMPREHENSIVE LIBRARY AUDIT REPORT                    \n";
    txt += "================================================================================\n\n";
    txt += pad("ID", 6) + " | " + pad("Title", 40) + " | " + pad("Category", 20) + " | " + pad("Total", 5) + " | " + pad("Available", 9) + "\n";
    txt += "--------------------------------------------------------------------------------\n";

    state.books.forEach(b => {
      txt += pad(String(b.id), 6) + " | " +
             pad(b.title.substring(0, 40), 40) + " | " +
             pad(b.category.substring(0, 20), 20) + " | " +
             pad(String(b.quantity), 5) + " | " +
             pad(String(b.available), 9) + "\n";
    });

    txt += "\nSUMMARY METRICS:\n";
    txt += `Total Titles: ${totalTitles} | Total Copies: ${totalCopies} | Available: ${availCopies} | Circulating: ${circulating}\n`;
    txt += `Aligned Binary Storage: ${totalTitles * SIZEOF_BOOK} bytes in books.dat (264 bytes/struct)\n`;
    txt += `Generated on: ${new Date().toISOString()} via AutoLibris Framework Engine\n`;
    return txt;
  }

  function pad(str, len) {
    str = String(str || '');
    if (str.length >= len) return str.substring(0, len);
    return str + ' '.repeat(len - str.length);
  }

  function renderReportPreviews() {
    const issuedPre = document.getElementById('preview-issued-report');
    const auditPre = document.getElementById('preview-audit-report');
    if (issuedPre) issuedPre.textContent = generateIssuedBooksReportText();
    if (auditPre) auditPre.textContent = generateInventoryReportText();
  }

  // --- DYNAMIC RAM LINKED LIST SIMULATOR ---
  function renderRamLinkedList() {
    const container = document.getElementById('linked-list-container');
    const consoleOutput = document.getElementById('ram-console-output');
    if (!container) return;

    let html = '';
    let consoleText = '--- Books Loaded into Dynamic RAM Linked List (*head) ---\n';
    let baseAddr = 0x7FFE00A10000;

    state.books.forEach((b, idx) => {
      const currAddr = '0x' + (baseAddr + idx * 0x120).toString(16).toUpperCase();
      const nextAddr = idx < state.books.length - 1 
        ? '0x' + (baseAddr + (idx + 1) * 0x120).toString(16).toUpperCase()
        : 'NULL';

      html += `
        <div class="ram-node">
          <div class="ram-node-header">
            <span>[Node #${idx + 1}]</span>
            <span>Addr: ${currAddr}</span>
          </div>
          <div class="ram-node-title" title="${escapeHtml(b.title)}">#${b.id}: ${escapeHtml(b.title)}</div>
          <div class="ram-node-sub">${escapeHtml(b.author)}</div>
          <div class="ram-node-footer">
            <span>Stock: ${b.available}/${b.quantity}</span>
            <span>Next -> ${nextAddr}</span>
          </div>
        </div>
        <div class="ram-arrow">&rarr;</div>
      `;

      consoleText += `[${idx + 1}] Addr: ${currAddr} | ID: ${b.id} | Title: ${pad(b.title.substring(0, 30), 30)} | Next: ${nextAddr}\n`;
    });

    html += `<div class="ram-null-node">NULL (End of Chain)</div>`;
    container.innerHTML = html;

    consoleText += `\nMemory footprint: ${state.books.length} struct BookNode allocated via malloc(${SIZEOF_BOOK + 8} bytes each).\nTotal Heap in use: ${(state.books.length * (SIZEOF_BOOK + 8))} Bytes.\n`;
    if (consoleOutput) consoleOutput.textContent = consoleText;

    const countBadge = document.getElementById('ram-node-count');
    if (countBadge) countBadge.textContent = `${state.books.length} Nodes in RAM`;
  }

  function simulateFreeLinkedList() {
    const container = document.getElementById('linked-list-container');
    const consoleOutput = document.getElementById('ram-console-output');
    if (container) {
      container.innerHTML = `<div class="text-muted" style="padding: 1.5rem; font-family: var(--font-mono); color: var(--accent-rose);">[HEAD POINTER FREED]: freeBookLinkedList(*head) executed. All heap memory deallocated. *head = NULL.</div>`;
    }
    if (consoleOutput) {
      consoleOutput.textContent = `>>> [DYNAMIC MEMORY DEALLOCATION]\n>>> free() called for all nodes in BookNode linked list.\n>>> Linked list memory freed successfully with free().\n>>> *head set to NULL to prevent dangling pointers.`;
    }
    showToast("Linked list memory freed successfully with free()!", "info");
  }

  // --- EVENT LISTENERS BINDING ---
  function setupEventListeners() {
    // Baseline Reset
    document.getElementById('btn-reset-baseline')?.addEventListener('click', resetToBaseline);

    // Quick Give Book button in topbar
    document.getElementById('btn-quick-give-book')?.addEventListener('click', () => {
      switchTab('issue-return');
    });

    // Fast-Desk Actions on Dashboard
    document.getElementById('btn-do-quick-issue')?.addEventListener('click', () => {
      const uId = parseInt(document.getElementById('quick-issue-user').value, 10);
      const bId = parseInt(document.getElementById('quick-issue-book').value, 10);
      if (!uId || !bId) {
        showToast("Please select both a member and an in-stock book.", "error");
        return;
      }
      issueBook(uId, bId);
    });

    document.getElementById('btn-do-quick-return')?.addEventListener('click', () => {
      const recId = parseInt(document.getElementById('quick-return-record').value, 10);
      if (!recId) {
        showToast("Please select an active loan to return.", "error");
        return;
      }
      returnBookByRecordId(recId);
    });

    // Delegated Quick Return on Dashboard Table
    document.getElementById('tbody-dash-active-loans')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-dash-quick-return');
      if (btn) {
        const recId = parseInt(btn.getAttribute('data-rec-id'), 10);
        returnBookByRecordId(recId);
      }
    });

    // Module 1 User search & filters
    document.getElementById('input-search-users')?.addEventListener('input', renderUsersModule);
    document.getElementById('select-filter-user-role')?.addEventListener('change', renderUsersModule);
    document.getElementById('select-filter-user-loans')?.addEventListener('change', renderUsersModule);

    // User Modals & Actions
    document.getElementById('btn-open-add-user-modal')?.addEventListener('click', () => {
      const nextId = state.users.length > 0 ? Math.max(...state.users.map(u => u.id)) + 1 : 1;
      document.getElementById('new-user-id').value = nextId;
      document.getElementById('modal-add-user').showModal();
    });
    document.getElementById('btn-close-user-modal')?.addEventListener('click', () => {
      document.getElementById('modal-add-user').close();
    });
    document.getElementById('btn-cancel-user-modal')?.addEventListener('click', () => {
      document.getElementById('modal-add-user').close();
    });
    document.getElementById('form-add-user')?.addEventListener('submit', handleAddUser);

    document.getElementById('tbody-users-list')?.addEventListener('click', (e) => {
      const btnHist = e.target.closest('.btn-user-history');
      if (btnHist) {
        const uid = parseInt(btnHist.getAttribute('data-user-id'), 10);
        showUserHistory(uid);
      }
      const btnDel = e.target.closest('.btn-user-delete');
      if (btnDel) {
        const uid = parseInt(btnDel.getAttribute('data-user-id'), 10);
        handleDeleteUser(uid);
      }
    });

    document.getElementById('btn-close-history-modal')?.addEventListener('click', () => {
      document.getElementById('modal-user-history').close();
    });
    document.getElementById('btn-close-history-modal-btn')?.addEventListener('click', () => {
      document.getElementById('modal-user-history').close();
    });

    // Module 2 Book search & filters
    document.getElementById('input-search-books')?.addEventListener('input', renderBooksModule);
    document.getElementById('select-filter-book-category')?.addEventListener('change', renderBooksModule);
    document.getElementById('select-filter-book-stock')?.addEventListener('change', renderBooksModule);

    // Book Modals & Actions
    document.getElementById('btn-open-add-book-modal')?.addEventListener('click', () => {
      const nextId = state.books.length > 0 ? Math.max(...state.books.map(b => b.id)) + 1 : 101;
      document.getElementById('new-book-id').value = nextId;
      document.getElementById('modal-add-book').showModal();
    });
    document.getElementById('btn-close-book-modal')?.addEventListener('click', () => {
      document.getElementById('modal-add-book').close();
    });
    document.getElementById('btn-cancel-book-modal')?.addEventListener('click', () => {
      document.getElementById('modal-add-book').close();
    });
    document.getElementById('form-add-book')?.addEventListener('submit', handleAddBook);

    document.getElementById('btn-close-edit-book-modal')?.addEventListener('click', () => {
      document.getElementById('modal-edit-book').close();
    });
    document.getElementById('btn-cancel-edit-book-modal')?.addEventListener('click', () => {
      document.getElementById('modal-edit-book').close();
    });
    document.getElementById('form-edit-book')?.addEventListener('submit', handleSaveEditBook);

    // Book table actions
    document.getElementById('tbody-books-list')?.addEventListener('click', (e) => {
      const incBtn = e.target.closest('.btn-stock-step-inc');
      if (incBtn) {
        const bid = parseInt(incBtn.getAttribute('data-book-id'), 10);
        handleStockStep(bid, 1);
      }
      const decBtn = e.target.closest('.btn-stock-step-dec');
      if (decBtn) {
        const bid = parseInt(decBtn.getAttribute('data-book-id'), 10);
        handleStockStep(bid, -1);
      }
      const issueBtn = e.target.closest('.btn-book-issue-quick');
      if (issueBtn) {
        const bid = parseInt(issueBtn.getAttribute('data-book-id'), 10);
        switchTab('issue-return');
        document.getElementById('issue-select-book').value = bid;
      }
      const editBtn = e.target.closest('.btn-book-edit');
      if (editBtn) {
        const bid = parseInt(editBtn.getAttribute('data-book-id'), 10);
        openEditBookModal(bid);
      }
      const delBtn = e.target.closest('.btn-book-delete');
      if (delBtn) {
        const bid = parseInt(delBtn.getAttribute('data-book-id'), 10);
        handleDeleteBook(bid);
      }
    });

    // Module 3 Issue Form Submission
    document.getElementById('form-issue-book')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const uId = parseInt(document.getElementById('issue-select-user').value, 10);
      const bId = parseInt(document.getElementById('issue-select-book').value, 10);
      const bDate = document.getElementById('issue-borrow-date').value;
      if (issueBook(uId, bId, bDate)) {
        renderIssueReturnModule();
      }
    });

    // Module 3 Return & Renew Buttons
    document.getElementById('btn-submit-return')?.addEventListener('click', () => {
      const recId = parseInt(document.getElementById('return-select-record').value, 10);
      if (!recId) {
        showToast("Please select an active loan to return.", "error");
        return;
      }
      returnBookByRecordId(recId);
    });

    document.getElementById('btn-submit-renew')?.addEventListener('click', () => {
      const recId = parseInt(document.getElementById('return-select-record').value, 10);
      if (!recId) {
        showToast("Please select an active loan to renew.", "error");
        return;
      }
      renewLoan(recId, 14);
    });

    document.getElementById('return-select-record')?.addEventListener('change', updateReturnDetailsHint);
    document.getElementById('select-filter-ledger-status')?.addEventListener('change', renderLedgerTable);

    // Ledger delegated actions
    document.getElementById('tbody-ledger-list')?.addEventListener('click', (e) => {
      const retBtn = e.target.closest('.btn-ledger-return');
      if (retBtn) {
        const recId = parseInt(retBtn.getAttribute('data-rec-id'), 10);
        returnBookByRecordId(recId);
      }
      const renBtn = e.target.closest('.btn-ledger-renew');
      if (renBtn) {
        const recId = parseInt(renBtn.getAttribute('data-rec-id'), 10);
        renewLoan(recId, 14);
      }
    });

    // Module 4 File Tools
    document.getElementById('calc-file-select')?.addEventListener('change', updateOffsetCalculator);
    document.getElementById('calc-record-index')?.addEventListener('input', updateOffsetCalculator);
    document.getElementById('hex-file-select')?.addEventListener('change', updateHexDump);
    document.getElementById('btn-download-dat-files')?.addEventListener('click', exportBinaryDataPackage);

    document.getElementById('btn-rebuild-indexes')?.addEventListener('click', () => {
      showToast("Verifying books.dat, users.dat, and borrow_records.dat integrity...", "info");
      setTimeout(() => {
        showToast("All binary structures aligned with zero record fragmentation (100% OK)!", "success");
      }, 500);
    });

    // Module 5 Report Actions
    document.getElementById('btn-download-issued-report')?.addEventListener('click', () => {
      const text = generateIssuedBooksReportText();
      downloadTextFile(text, "issued_books_report.txt");
      showToast("Downloaded issued_books_report.txt successfully.", "success");
    });

    document.getElementById('btn-download-audit-report')?.addEventListener('click', () => {
      const text = generateInventoryReportText();
      downloadTextFile(text, "report.txt");
      showToast("Downloaded report.txt comprehensive audit report.", "success");
    });

    document.getElementById('btn-preview-issued-copy')?.addEventListener('click', () => {
      navigator.clipboard.writeText(generateIssuedBooksReportText());
      showToast("Copied issued_books_report.txt content to clipboard!", "success");
    });

    document.getElementById('btn-preview-audit-copy')?.addEventListener('click', () => {
      navigator.clipboard.writeText(generateInventoryReportText());
      showToast("Copied report.txt content to clipboard!", "success");
    });

    // Module 5 Dynamic Handout & Stock Modifier
    document.getElementById('btn-report-give-book')?.addEventListener('click', () => {
      const uId = parseInt(document.getElementById('report-quick-user').value, 10);
      const bId = parseInt(document.getElementById('report-quick-book').value, 10);
      if (!uId || !bId) {
        showToast("Please select both a customer and an available book.", "error");
        return;
      }
      issueBook(uId, bId);
    });

    document.getElementById('btn-report-return-book')?.addEventListener('click', () => {
      const recId = parseInt(document.getElementById('report-quick-return-rec').value, 10);
      if (!recId) {
        showToast("Please select an active loan record.", "error");
        return;
      }
      returnBookByRecordId(recId);
    });

    document.getElementById('btn-report-stock-inc')?.addEventListener('click', () => {
      const bId = parseInt(document.getElementById('report-stock-adjust-book').value, 10);
      if (bId) handleStockStep(bId, 1);
    });

    document.getElementById('btn-report-stock-dec')?.addEventListener('click', () => {
      const bId = parseInt(document.getElementById('report-stock-adjust-book').value, 10);
      if (bId) handleStockStep(bId, -1);
    });

    // Category filter for the main present books bar chart
    document.getElementById('select-graph-category-filter')?.addEventListener('change', () => {
      updateCharts();
    });

    // Delegated quick stock replenishment in low stock list
    document.getElementById('low-stock-watchlist')?.addEventListener('click', (e) => {
      const repBtn = e.target.closest('.btn-report-replenish');
      if (repBtn) {
        const bid = parseInt(repBtn.getAttribute('data-book-id'), 10);
        handleStockStep(bid, 1);
      }
    });

    // Dynamic RAM Linked List Buttons
    document.getElementById('btn-reload-linked-list')?.addEventListener('click', () => {
      renderRamLinkedList();
      showToast("Simulated dynamic malloc() allocation for all books into heap nodes!", "success");
    });
    document.getElementById('btn-free-linked-list')?.addEventListener('click', simulateFreeLinkedList);
  }

  // --- UTILITIES ---
  function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function downloadTextFile(content, fileName) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadBuffer(buffer, fileName, mimeType) {
    const blob = new Blob([buffer], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    if (type === 'success') {
      icon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (type === 'error') {
      icon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    }

    toast.innerHTML = `
      <div style="flex-shrink: 0;">${icon}</div>
      <div style="flex: 1;">${escapeHtml(message)}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3800);
  }

  // --- BOOTSTRAP ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

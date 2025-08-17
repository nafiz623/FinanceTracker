document.addEventListener('DOMContentLoaded', () => {
    // ======== HARDCODED CREDENTIALS ========
    const VALID_EMAIL = "nafiz@gmail.com";
    const VALID_PASSWORD = "nafiz623";

    // ======== STATE MANAGEMENT ========
    let state = {
        balance: 0,
        deposited: 0,
        spent: 0,
        transactions: [],
        lastMonthDeposited: 0,
        lastMonthSpent: 0,
    };

    // ======== DOM ELEMENT SELECTORS ========
    // Screens
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');

    // Login Form
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const loginError = document.getElementById('login-error');

    // App Header
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const logoutButton = document.getElementById('logout-button');

    // Summary Cards
    const totalBalanceEl = document.getElementById('total-balance');
    const totalDepositedEl = document.getElementById('total-deposited');
    const totalSpentEl = document.getElementById('total-spent');
    const depositChangeEl = document.getElementById('deposit-change');
    const spentChangeEl = document.getElementById('spent-change');

    // Transaction Form
    const transactionForm = document.getElementById('transaction-form');
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const categorySelect = document.getElementById('category-select');
    const selectedCategoryOption = categorySelect.querySelector('.selected-option');
    const categoryOptions = categorySelect.querySelector('.options');
    const formError = document.getElementById('form-error');
    const depositBtn = document.getElementById('deposit-btn');
    const withdrawBtn = document.getElementById('withdraw-btn');

    // Transaction History
    const transactionList = document.getElementById('transaction-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    // ======== LOCALSTORAGE FUNCTIONS ========
    const saveState = () => {
        localStorage.setItem('financeData', JSON.stringify(state));
    };

    const loadState = () => {
        const storedState = JSON.parse(localStorage.getItem('financeData'));
        if (storedState) {
            state = { ...state, ...storedState };
        }
        calculateMonthlyStats();
    };

    const saveSession = () => {
        if (rememberMeCheckbox.checked) {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('userEmail', emailInput.value);
        } else {
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('userEmail');
        }
        sessionStorage.setItem('isLoggedIn', 'true');
    };

    const clearSession = () => {
        sessionStorage.removeItem('isLoggedIn');
    };

    // ======== UI UPDATE FUNCTIONS ========
    const updateUI = () => {
        // Update summary cards
        totalBalanceEl.textContent = formatCurrency(state.balance);
        totalDepositedEl.textContent = formatCurrency(state.deposited);
        totalSpentEl.textContent = formatCurrency(state.spent);

        // Update percentage changes
        calculateMonthlyChange();

        // Render transaction history
        renderTransactions();
    };

    const renderTransactions = () => {
        transactionList.innerHTML = '';
        if (state.transactions.length === 0) {
            transactionList.innerHTML = `<div class="empty-state">No transactions yet.</div>`;
            clearHistoryBtn.style.display = 'none';
            return;
        }

        clearHistoryBtn.style.display = 'block';
        const sortedTransactions = [...state.transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        sortedTransactions.forEach(tx => {
            const card = document.createElement('div');
            card.className = `transaction-card`;
            card.innerHTML = `
                <div class="transaction-icon ${tx.type}">
                    <i class="${tx.category.icon}"></i>
                </div>
                <div class="transaction-details">
                    <p>${tx.description}</p>
                    <span class="timestamp">${new Date(tx.timestamp).toLocaleString()}</span>
                </div>
                <div class="transaction-amount ${tx.type}">
                    ${tx.type === 'deposit' ? '+' : '-'}${formatCurrency(tx.amount)}
                </div>
                <button class="delete-btn" data-id="${tx.id}"><i class="fas fa-trash-alt"></i></button>
            `;
            transactionList.appendChild(card);
        });
    };

    const showScreen = (screen) => {
        loginScreen.classList.add('hidden');
        appScreen.classList.add('hidden');
        screen.classList.remove('hidden');
    };

    // ======== LOGIC & CALCULATIONS ========
    const formatCurrency = (value) => {
        return `$${Math.abs(value).toFixed(2)}`;
    };

    const calculateMonthlyStats = () => {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthYear = lastMonth.getFullYear();
        const lastMonthMonth = lastMonth.getMonth();

        state.lastMonthDeposited = 0;
        state.lastMonthSpent = 0;

        state.transactions.forEach(tx => {
            const txDate = new Date(tx.timestamp);
            if(txDate.getFullYear() === lastMonthYear && txDate.getMonth() === lastMonthMonth) {
                if (tx.type === 'deposit') state.lastMonthDeposited += tx.amount;
                if (tx.type === 'withdraw') state.lastMonthSpent += tx.amount;
            }
        });
    };

    const calculateMonthlyChange = () => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        let currentMonthDeposited = 0;
        let currentMonthSpent = 0;

        state.transactions.forEach(tx => {
            const txDate = new Date(tx.timestamp);
            if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
                if (tx.type === 'deposit') currentMonthDeposited += tx.amount;
                if (tx.type === 'withdraw') currentMonthSpent += tx.amount;
            }
        });

        // Calculate and display deposit change
        updatePercentageEl(depositChangeEl, currentMonthDeposited, state.lastMonthDeposited, 'deposit');
        // Calculate and display spent change
        updatePercentageEl(spentChangeEl, currentMonthSpent, state.lastMonthSpent, 'spent');
    };

    const updatePercentageEl = (element, current, previous, type) => {
        if (previous === 0) {
            element.innerHTML = current > 0 ? `<i class="fas fa-arrow-up"></i> New Activity` : `--% vs last month`;
            element.style.color = current > 0 ? (type === 'deposit' ? 'var(--green-color)' : 'var(--red-color)') : 'var(--text-light)';
            return;
        }

        const change = ((current - previous) / previous) * 100;
        const icon = change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        let color;

        if (type === 'deposit') {
            color = change >= 0 ? 'var(--green-color)' : 'var(--red-color)';
        } else { // spent
            color = change >= 0 ? 'var(--red-color)' : 'var(--green-color)';
        }
        
        element.innerHTML = `<i class="fas ${icon}"></i> ${Math.abs(change).toFixed(1)}% vs last month`;
        element.style.color = color;
    };
    
    const addTransaction = (type) => {
        const amount = parseFloat(amountInput.value);
        const description = descriptionInput.value.trim();
        const categoryValue = selectedCategoryOption.dataset.value;
        const categoryIcon = selectedCategoryOption.dataset.icon;
        
        // Validation
        if (isNaN(amount) || amount <= 0) {
            formError.textContent = "Please enter a valid, positive amount.";
            return;
        }
        if (description === '') {
            formError.textContent = "Please enter a description.";
            return;
        }
        formError.textContent = '';
        
        const transaction = {
            id: Date.now(),
            type,
            amount,
            description,
            category: { value: categoryValue, icon: categoryIcon },
            timestamp: new Date().toISOString(),
        };

        state.transactions.push(transaction);

        if (type === 'deposit') {
            state.balance += amount;
            state.deposited += amount;
        } else {
            state.balance -= amount;
            state.spent += amount;
        }

        saveState();
        updateUI();

        // Clear form
        amountInput.value = '';
        descriptionInput.value = '';
        selectedCategoryOption.innerHTML = `<i class="fas fa-tag"></i> <span>Select Category</span> <i class="fas fa-chevron-down dropdown-arrow"></i>`;
        selectedCategoryOption.dataset.value = 'other';
        selectedCategoryOption.dataset.icon = 'fas fa-tag';
    };
    
    const deleteTransaction = (id) => {
        const txIndex = state.transactions.findIndex(tx => tx.id === id);
        if (txIndex === -1) return;

        const tx = state.transactions[txIndex];
        
        if (tx.type === 'deposit') {
            state.balance -= tx.amount;
            state.deposited -= tx.amount;
        } else {
            state.balance += tx.amount;
            state.spent -= tx.amount;
        }

        state.transactions.splice(txIndex, 1);
        saveState();
        updateUI();
    };

    // ======== EVENT LISTENERS ========
    // Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (emailInput.value === VALID_EMAIL && passwordInput.value === VALID_PASSWORD) {
            loginError.textContent = '';
            saveSession();
            showScreen(appScreen);
            initApp();
        } else {
            loginError.textContent = "Invalid email or password.";
        }
    });

    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.classList.toggle('fa-eye');
        togglePassword.classList.toggle('fa-eye-slash');
    });

    // App controls
    logoutButton.addEventListener('click', () => {
        if (!rememberMeCheckbox.checked) {
            localStorage.removeItem('userEmail');
        }
        clearSession();
        showScreen(login-screen);
    });

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        darkModeToggle.innerHTML = isDarkMode ? `<i class="fas fa-sun"></i>` : `<i class="fas fa-moon"></i>`;
    });

    // Transaction Form
    depositBtn.addEventListener('click', () => addTransaction('deposit'));
    withdrawBtn.addEventListener('click', () => addTransaction('withdraw'));
    
    // Custom Category Select
    selectedCategoryOption.addEventListener('click', () => categorySelect.classList.toggle('open'));
    
    categoryOptions.addEventListener('click', (e) => {
        if (e.target.classList.contains('option')) {
            selectedCategoryOption.innerHTML = `${e.target.innerHTML} <i class="fas fa-chevron-down dropdown-arrow"></i>`;
            selectedCategoryOption.dataset.value = e.target.dataset.value;
            selectedCategoryOption.dataset.icon = e.target.dataset.icon;
            categorySelect.classList.remove('open');
        }
    });

    document.addEventListener('click', (e) => {
        if (!categorySelect.contains(e.target)) {
            categorySelect.classList.remove('open');
        }
    });

    // Transaction History
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to delete ALL transaction history? This cannot be undone.")) {
            state.balance = 0;
            state.deposited = 0;
            state.spent = 0;
            state.transactions = [];
            saveState();
            calculateMonthlyStats();
            updateUI();
        }
    });
    
    transactionList.addEventListener('click', (e) => {
        if (e.target.closest('.delete-btn')) {
            const id = parseInt(e.target.closest('.delete-btn').dataset.id);
            deleteTransaction(id);
        }
    });

    // ======== INITIALIZATION ========
    const initApp = () => {
        loadState();
        updateUI();
    };

    const init = () => {
        // Dark Mode
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.innerHTML = `<i class="fas fa-sun"></i>`;
        }
        
        // Session Handling
        const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        const rememberMe = localStorage.getItem('rememberMe') === 'true';
        if(rememberMe) {
            emailInput.value = localStorage.getItem('userEmail') || '';
            rememberMeCheckbox.checked = true;
        }

        if (isLoggedIn || rememberMe) {
            showScreen(appScreen);
            initApp();
        } else {
            showScreen(loginScreen);
        }
    };

    init();
});

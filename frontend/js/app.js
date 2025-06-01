// Configuration
const API_BASE = 'http://localhost:5000/api';
let authToken = localStorage.getItem('authToken');
let currentPasswords = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    if (authToken) {
        checkTokenAndLoadDashboard();
    } else {
        showAuthForms();
    }

    // Event listeners
    document.getElementById('login-form-element').addEventListener('submit', handleLogin);
    document.getElementById('register-form-element').addEventListener('submit', handleRegister);
    document.getElementById('search-input').addEventListener('input', handleSearch);
});

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    setLoadingState('login', true);
    hideAlert('login-alert');

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            await loadDashboard();
        } else {
            showAlert('login-alert', data.error, 'error');
        }
    } catch (error) {
        showAlert('login-alert', 'Connection error. Please try again.', 'error');
    } finally {
        setLoadingState('login', false);
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    setLoadingState('register', true);
    hideAlert('register-alert');

    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
                confirm_password: confirmPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('register-alert', data.message, 'success');
            setTimeout(() => {
                showLogin();
                document.getElementById('login-email').value = email;
            }, 1500);
        } else {
            showAlert('register-alert', data.error, 'error');
        }
    } catch (error) {
        showAlert('register-alert', 'Connection error. Please try again.', 'error');
    } finally {
        setLoadingState('register', false);
    }
}

function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentPasswords = [];
    showAuthForms();
}

// Dashboard Functions
async function checkTokenAndLoadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/passwords`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            await loadDashboard();
        } else {
            logout();
        }
    } catch (error) {
        logout();
    }
}

async function loadDashboard() {
    // Extract email from token for display
    try {
        const tokenData = JSON.parse(atob(authToken.split('.')[1]));
        document.getElementById('user-email').textContent = tokenData.email;
    } catch (error) {
        console.error('Error parsing token:', error);
    }

    showDashboard();
    await loadPasswords();
}

async function loadPasswords() {
    try {
        const response = await fetch(`${API_BASE}/passwords`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            currentPasswords = await response.json();
            renderPasswords(currentPasswords);
        } else {
            throw new Error('Failed to load passwords');
        }
    } catch (error) {
        document.getElementById('password-list').innerHTML = `
                    <div class="text-center" style="padding: var(--space-16);">
                        <p style="color: var(--error-500);">Failed to load passwords. Please try again.</p>
                        <button class="btn btn-primary" onclick="loadPasswords()">Retry</button>
                    </div>
                `;
    }
}

function renderPasswords(passwords) {
    const passwordList = document.getElementById('password-list');

    if (passwords.length === 0) {
        passwordList.innerHTML = `
                    <div class="text-center" style="padding: var(--space-16);">
                        <div style="font-size: 4rem; margin-bottom: var(--space-4);">🔐</div>
                        <h3 style="margin-bottom: var(--space-2);">No passwords yet</h3>
                        <p style="color: var(--secondary-600); margin-bottom: var(--space-6);">Add your first password to get started</p>
                        <button class="btn btn-primary" onclick="showAddPasswordForm()">Add Password</button>
                    </div>
                `;
        return;
    }

    passwordList.innerHTML = passwords.map(password => `
                <div class="password-item">
                    <div class="password-item-header">
                        <div class="password-item-info">
                            <h3>${escapeHtml(password.site)}</h3>
                            <p>${escapeHtml(password.login)}</p>
                        </div>
                        <div class="password-item-actions">
                            <button class="btn btn-secondary btn-small" onclick="copyPassword('${escapeHtml(password.password)}')">
                                📋 Copy
                            </button>
                            <button class="btn btn-secondary btn-small" onclick="editPassword(${password.id})">
                                ✏️ Edit
                            </button>
                            <button class="btn btn-danger btn-small" onclick="deletePassword(${password.id})">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                    <div class="password-field">
                        <input type="password" value="${escapeHtml(password.password)}" readonly>
                        <button type="button" class="password-toggle" onclick="togglePasswordVisibility(this)">👁️</button>
                    </div>
                </div>
            `).join('');
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const filtered = currentPasswords.filter(password =>
        password.site.toLowerCase().includes(query) ||
        password.login.toLowerCase().includes(query)
    );
    renderPasswords(filtered);
}

// Password Management Functions
function showAddPasswordForm() {
    const modal = createPasswordModal();
    document.body.appendChild(modal);
}

function editPassword(id) {
    const password = currentPasswords.find(p => p.id === id);
    if (password) {
        const modal = createPasswordModal(password);
        document.body.appendChild(modal);
    }
}

async function deletePassword(id) {
    if (!confirm('Are you sure you want to delete this password?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/passwords/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            await loadPasswords();
        } else {
            alert('Failed to delete password');
        }
    } catch (error) {
        alert('Error deleting password');
    }
}

function createPasswordModal(existingPassword = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                padding: var(--space-4);
            `;

    const isEdit = !!existingPassword;

    modal.innerHTML = `
                <div class="card" style="width: 100%; max-width: 500px; margin: 0;">
                    <div class="card-header">
                        <h2 class="card-title">${isEdit ? 'Edit Password' : 'Add New Password'}</h2>
                        <p class="card-subtitle">Enter the details for this password entry</p>
                    </div>

                    <form id="password-modal-form">
                        <div class="form-group">
                            <label for="modal-site" class="form-label">Website/Service</label>
                            <input type="text" id="modal-site" class="form-input" value="${isEdit ? escapeHtml(existingPassword.site) : ''}" required>
                        </div>

                        <div class="form-group">
                            <label for="modal-login" class="form-label">Username/Email</label>
                            <input type="text" id="modal-login" class="form-input" value="${isEdit ? escapeHtml(existingPassword.login) : ''}" required>
                        </div>

                        <div class="form-group">
                            <label for="modal-password" class="form-label">Password</label>
                            <div class="password-input-wrapper">
                                <input type="password" id="modal-password" class="form-input" value="${isEdit ? escapeHtml(existingPassword.password) : ''}" required>
                                <button type="button" class="password-toggle" onclick="togglePassword('modal-password')">👁️</button>
                            </div>
                            <div style="margin-top: var(--space-2);">
                                <button type="button" class="btn btn-secondary btn-small" onclick="generatePassword()">
                                    🎲 Generate Strong Password
                                </button>
                            </div>
                        </div>

                        <div class="flex gap-4" style="margin-top: var(--space-6);">
                            <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="closeModal()">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary" style="flex: 1;">
                                <span id="modal-btn-text">${isEdit ? 'Update' : 'Save'} Password</span>
                                <div id="modal-spinner" class="spinner hidden"></div>
                            </button>
                        </div>
                    </form>
                </div>
            `;

    // Add event listener for form submission
    modal.querySelector('#password-modal-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const site = document.getElementById('modal-site').value;
        const login = document.getElementById('modal-login').value;
        const password = document.getElementById('modal-password').value;

        setLoadingState('modal', true);

        try {
            const url = isEdit ? `${API_BASE}/passwords/${existingPassword.id}` : `${API_BASE}/passwords`;
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ site, login, password })
            });

            if (response.ok) {
                closeModal();
                await loadPasswords();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to save password');
            }
        } catch (error) {
            alert('Error saving password');
        } finally {
            setLoadingState('modal', false);
        }
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    return modal;
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

function generatePassword() {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    let password = "";

    // Ensure at least one character from each required category
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    document.getElementById('modal-password').value = password;
}

async function copyPassword(password) {
    try {
        await navigator.clipboard.writeText(password);

        // Show temporary success feedback
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '✅ Copied!';
        button.style.background = 'var(--success-500)';
        button.style.color = 'white';

        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
            button.style.color = '';
        }, 2000);
    } catch (error) {
        alert('Failed to copy password to clipboard');
    }
}

// UI Helper Functions
function showAuthForms() {
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('dashboard-container').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('dashboard-container').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
    clearForm('login-form-element');
    hideAlert('login-alert');
}

function showRegister() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
    clearForm('register-form-element');
    hideAlert('register-alert');
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;

    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

function togglePasswordVisibility(button) {
    const input = button.previousElementSibling;

    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

function setLoadingState(formType, isLoading) {
    let btnText, spinner, form;

    if (formType === 'modal') {
        // Handle modal form specifically
        btnText = document.getElementById('modal-btn-text');
        spinner = document.getElementById('modal-spinner');
        form = document.getElementById('password-modal-form');
    } else {
        // Handle regular forms (login/register)
        btnText = document.getElementById(`${formType}-btn-text`);
        spinner = document.getElementById(`${formType}-spinner`);
        form = document.getElementById(`${formType}-form-element`);
    }

    // Check if elements exist before manipulating them
    if (!btnText || !spinner || !form) {
        console.warn(`Loading state elements not found for ${formType}`);
        return;
    }

    if (isLoading) {
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');
        form.querySelectorAll('input, button').forEach(el => el.disabled = true);
    } else {
        btnText.classList.remove('hidden');
        spinner.classList.add('hidden');
        form.querySelectorAll('input, button').forEach(el => el.disabled = false);
    }
}

function showAlert(alertId, message, type) {
    const alert = document.getElementById(alertId);
    const messageElement = alert.querySelector('span');

    messageElement.textContent = message;
    alert.className = `alert alert-${type}`;
    alert.classList.remove('hidden');
}

function hideAlert(alertId) {
    const alert = document.getElementById(alertId);
    alert.classList.add('hidden');
}

function clearForm(formId) {
    const form = document.getElementById(formId);
    form.reset();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Escape key to close modals
    if (e.key === 'Escape') {
        closeModal();
    }

    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput && !searchInput.closest('.hidden')) {
            searchInput.focus();
        }
    }
});

// Auto-logout after token expiration
function setupAutoLogout() {
    if (!authToken) return;

    try {
        const tokenData = JSON.parse(atob(authToken.split('.')[1]));
        const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiration = expirationTime - currentTime;

        if (timeUntilExpiration > 0) {
            setTimeout(() => {
                alert('Your session has expired. Please log in again.');
                logout();
            }, timeUntilExpiration);
        } else {
            logout();
        }
    } catch (error) {
        console.error('Error setting up auto-logout:', error);
        logout();
    }
}

// Set up auto-logout when token is available
if (authToken) {
    setupAutoLogout();
}
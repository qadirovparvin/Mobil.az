window.API_URL = window.API_URL || 'http://localhost:5000/api';

// ============================================
// HELPERS
// ============================================

/** Returns the active token from localStorage or sessionStorage (whichever has it). */
function getActiveToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
}

/**
 * Returns the active user object. Checks both storage keys:
 *   - 'mobilaz_current_user'  (written by the new login.js / auth-otp.js)
 *   - 'user'                  (written by the legacy auth.js login form)
 */
function getActiveUser() {
    try {
        const u = localStorage.getItem('mobilaz_current_user') || localStorage.getItem('user');
        return u ? JSON.parse(u) : null;
    } catch {
        return null;
    }
}

/** Clears all auth data from both storages. */
function clearAuth() {
    ['token', 'user', 'mobilaz_current_user'].forEach(k => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
    });
}

// Show notification/alert
function showMessage(msg, isError = false) {
    alert(msg);
}

// ============================================
// NAVBAR AUTH STATE — runs on every page
// ============================================
/**
 * Reads the current auth state from localStorage/sessionStorage and updates
 * the `.button-container` in the header accordingly.
 * Exposed on window so other scripts can call window.updateNavbar() after
 * a login or logout without triggering a full page reload.
 */
window.updateNavbar = function updateNavbar() {
    const token = getActiveToken();
    const user  = getActiveUser();
    const btnContainer = document.querySelector('.button-container');

    if (!btnContainer) return; // page has no standard header — skip

    if (token && user) {
        // ── Logged-in state ──
        const displayName = user.name || user.firstName || user.email || 'Hesab';
        btnContainer.innerHTML = `
            <a href="cabinet.html" class="login-btn nav-account-btn" id="nav-cabinet-btn"
               style="display:inline-flex;align-items:center;gap:6px;">
                <i class="fas fa-user-circle"></i>
                <span>${displayName}</span>
            </a>
            <button class="register-btn nav-logout-btn" id="nav-logout-btn"
                    style="cursor:pointer;" data-translate="cab-logout">
                <i class="fas fa-sign-out-alt"></i> Çıxış
            </button>
        `;

        document.getElementById('nav-logout-btn').addEventListener('click', () => {
            clearAuth();
            // Redirect to home; if already on index just refresh
            if (window.location.pathname.endsWith('index.html') ||
                window.location.pathname === '/' ||
                window.location.pathname.endsWith('/')) {
                window.location.reload();
            } else {
                window.location.href = 'index.html';
            }
        });
    } else {
        // ── Logged-out state (restore default buttons) ──
        btnContainer.innerHTML = `
            <a href="login.html" class="login-btn" data-translate="login-btn">
                <i class="fas fa-sign-in-alt"></i> Giriş
            </a>
            <a href="signup.html" class="register-btn" data-translate="register-btn">
                <i class="fas fa-user-plus"></i> Qeydiyyat
            </a>
        `;
    }
};

document.addEventListener('DOMContentLoaded', window.updateNavbar);
window.updateNavbar(); // Run immediately as well

// ============================================
// LEGACY LOGIN FORM (login-form id)
// ============================================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email    = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch(`${window.API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                showMessage(data.message || 'Giriş uğursuz oldu', true);
                return;
            }

            // Save with the canonical key so updateNavbar() can always find it
            localStorage.setItem('token', data.token);
            localStorage.setItem('mobilaz_current_user', JSON.stringify(data));
            if (window.updateNavbar) window.updateNavbar();

            showMessage('Uğurla daxil oldunuz! Ana səhifəyə yönləndirilirsiniz...');
            window.location.href = 'index.html';

        } catch (error) {
            console.error('Login error:', error);
            showMessage('Serverlə əlaqə yaradılmadı. Zəhmət olmasa biraz sonra cəhd edin.', true);
        }
    });
}

// ============================================
// LEGACY SIGNUP FORM (signup-form id)
// ============================================
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (typeof _phoneVerified !== 'undefined' && !_phoneVerified) {
            showMessage('Telefon nömrənizi təsdiqləmədən qeydiyyatdan keçə bilməzsiniz.', true);
            return;
        }

        const name            = document.getElementById('signup-name').value;
        const lastName        = document.getElementById('signup-lastName').value;
        const email           = document.getElementById('signup-email').value;
        const phone           = document.getElementById('signup-phone').value;
        const password        = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (password !== confirmPassword) {
            showMessage('Şifrələr eyni deyil!', true);
            return;
        }

        try {
            const res = await fetch(`${window.API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, lastName, email, phone, password })
            });

            const data = await res.json();

            if (!res.ok) {
                showMessage(data.message || 'Qeydiyyat uğursuz oldu', true);
                return;
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('mobilaz_current_user', JSON.stringify(data));
            if (window.updateNavbar) window.updateNavbar();

            showMessage('Hesab uğurla yaradıldı! Ana səhifəyə yönləndirilirsiniz...');
            window.location.href = 'index.html';

        } catch (error) {
            console.error('Signup error:', error);
            showMessage('Serverlə əlaqə yaradılmadı.', true);
        }
    });
}

"use strict";

function getToken() {
    if (typeof window.getToken === 'function' && window.getToken !== getToken) {
        return window.getToken();
    }
    const tryGet = (store, key) => {
        try { 
            let t = store.getItem(key);
            if (!t || t === 'null' || t === 'undefined' || t === '""' || t === "''") return null;
            t = t.trim().replace(/^["']+|["']+$/g, '');
            if (t.length < 30) return null;
            if (t.split('.').length !== 3) return null;
            return t;
        } catch(e) { return null; }
    };
    const remember = localStorage.getItem('rememberMe') === 'true';
    const sources = remember ? 
        [() => [localStorage, 'token'], () => [sessionStorage, 'token'], () => [localStorage, 'accessToken'], () => [localStorage, 'authToken']] :
        [() => [sessionStorage, 'token'], () => [localStorage, 'token'], () => [sessionStorage, 'accessToken'], () => [sessionStorage, 'authToken']];
    for (let fn of sources) {
        const [store, key] = fn();
        let t = tryGet(store, key);
        if (t) return t;
    }
    const fallbackKeys = ['adminToken', 'jwt'];
    for (let k of fallbackKeys) {
        let t = tryGet(localStorage, k) || tryGet(sessionStorage, k);
        if (t) return t;
    }
    return '';
}
window.getToken = getToken;
window.getAuthToken = getToken;

function getUser() {
    const raw = localStorage.getItem('user') ||
                localStorage.getItem('mobilaz_current_user') ||
                localStorage.getItem('mobilaz_user') ||
                sessionStorage.getItem('user') ||
                sessionStorage.getItem('mobilaz_current_user') ||
                localStorage.getItem('adminUser') ||
                sessionStorage.getItem('adminUser');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}
window.getUser = getUser;
window.getCurrentUser = getUser;

function isAuthenticated() {
    return Boolean(getToken() && getUser());
}
window.isAuthenticated = isAuthenticated;
window.isLoggedIn = isAuthenticated;

// Immediate auth guard for protected pages
(function checkImmediateAuthGuard() {
    const user = getUser();
    const token = getToken();
    const authed = Boolean(user && token);

    const path = window.location.pathname;
    if (!authed) {
        if (path.includes("cabinet.html")) {
            window.location.href = "login.html";
        } else if (path.includes("elan-yerlesdir.html")) {
            const search = (window.location && window.location.search) ? window.location.search : "";
            const target = search ? `elan-yerlesdir.html${search}` : "elan-yerlesdir.html";
            window.location.href = `login.html?redirect=${encodeURIComponent(target)}`;
        }
    }
})();

// Header & Auth UI updater
function updateHeader() {
    const currentUser = getUser();
    const token = getToken();
    const loggedIn = Boolean(token && currentUser);

    const buttonContainers = document.querySelectorAll(".button-container");
    if (!buttonContainers.length) return;

    buttonContainers.forEach((buttonContainer) => {
        if (loggedIn) {
            const displayName = [currentUser.name || currentUser.firstName || '', currentUser.lastName || ''].filter(Boolean).join(' ') || currentUser.email || 'Kabinet';
            const isAdmin = currentUser.role === 'admin';

            buttonContainer.innerHTML = `
                <a href="cabinet.html#panel-notifications" style="position:relative; margin-right: 12px; color: var(--text-primary); text-decoration: none; display: flex; align-items: center;" id="headerNotificationBell" title="Bildirişlər">
                    <i class="fas fa-bell" style="font-size: 18px;"></i>
                    <span id="unreadBadge" style="display:none; position:absolute; top:-6px; right:-8px; background:#dc3545; color:white; font-size:10px; font-weight:bold; padding:2px 5px; border-radius:10px;">0</span>
                </a>
                ${isAdmin ? `
                <a href="admin.html" class="admin-panel-btn-header" style="background: linear-gradient(135deg, #e53935, #d32f2f); color: white; border: none; padding: 8px 14px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; font-size: 14px; margin-right: 8px; box-shadow: 0 2px 6px rgba(229,57,53,0.3);">
                    <i class="fas fa-shield-alt"></i> Admin Panel
                </a>
                ` : ''}
                <a href="cabinet.html" class="cabinet-btn-header" style="background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: white; border: none; padding: 8px 14px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; font-size: 14px; box-shadow: 0 2px 6px rgba(108,92,231,0.3);">
                    <i class="fas fa-user-circle"></i> <span>${displayName}</span>
                </a>
                <a href="#" class="header-logout-btn" style="color: var(--text-secondary); text-decoration: none; display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 8px; margin-left: 8px; font-size: 15px; cursor: pointer; transition: all 0.2s;" title="Çıxış" aria-label="Çıxış">
                    <i class="fas fa-sign-out-alt"></i>
                </a>
            `;

            const logoutBtn = buttonContainer.querySelector('.header-logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    if (typeof window.clearAuthSession === 'function') {
                        window.clearAuthSession();
                    } else if (typeof clearSession === 'function') {
                        clearSession();
                    } else {
                        ['token', 'accessToken', 'authToken', 'adminToken'].forEach(k => { sessionStorage.removeItem(k); localStorage.removeItem(k); });
                        ['user', 'mobilaz_current_user', 'adminUser', 'mobilaz_user', 'userRole', 'userEmail'].forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
                    }
                    window.location.href = "index.html";
                });
            }
        } else {
            buttonContainer.innerHTML = `
                <a href="login.html" class="login-btn" data-translate="login-btn">
                    <i class="fas fa-sign-in-alt"></i> Giriş
                </a>
                <a href="signup.html" class="register-btn" data-translate="register-btn">
                    <i class="fas fa-user-plus"></i> Qeydiyyat
                </a>
            `;
        }
    });

    if (loggedIn && token) {
        fetch((window.API_URL || 'http://localhost:5000/api') + '/notifications/unread-count', {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
            if (data && data.count > 0) {
                document.querySelectorAll('#unreadBadge').forEach(badge => {
                    badge.textContent = data.count > 99 ? '99+' : data.count;
                    badge.style.display = 'block';
                });
            }
        })
        .catch(() => {});
    }
}
window.updateHeader = updateHeader;
window.updateAuthUI = updateHeader;

// DOMContentLoaded Handler
document.addEventListener("DOMContentLoaded", function () {
    updateHeader();

    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
        const idInput = document.getElementById('loginIdentifier') || document.getElementById('email');
        if (idInput && !idInput.value) {
            idInput.value = savedEmail;
        }
    }

    const currentUser = getUser();
    const token = getToken();
    const loggedIn = Boolean(currentUser && token);

    if (loggedIn) {
        // If on cabinet page, populate real data
        if (window.location.pathname.includes("cabinet.html")) {
            const userNameDisplay = document.querySelector(".user-snippet h3");
            const userEmailDisplay = document.querySelector(".user-snippet p");
            const welcomeDisplay = document.querySelector(".cabinet-header p");
            if (userNameDisplay) {
                userNameDisplay.textContent = `${currentUser.name || currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email;
            }
            if (userEmailDisplay) {
                userEmailDisplay.textContent = currentUser.email || '';
            }
            if (welcomeDisplay) {
                const welcomeSpan = welcomeDisplay.querySelector("span");
                if (welcomeSpan) {
                    welcomeDisplay.innerHTML = `<span data-translate="cab-welcome">${welcomeSpan.textContent}</span> ${currentUser.name || currentUser.firstName || ''} ${currentUser.lastName || ''}!`;
                }
            }

            const infoItems = document.querySelectorAll(".info-item p");
            if (infoItems.length >= 4) {
                infoItems[0].textContent = currentUser.name || currentUser.firstName || "-";
                infoItems[1].textContent = currentUser.lastName || "-";
                infoItems[2].textContent = currentUser.phone || "-";
                infoItems[3].textContent = currentUser.email || "-";
            }

            const logoutBtn = document.querySelector(".logout-link");
            if (logoutBtn) {
                logoutBtn.addEventListener("click", function (e) {
                    e.preventDefault();
                    if (window.clearAuthSession) {
                        window.clearAuthSession();
                    } else {
                        ['token', 'adminToken'].forEach(k => { sessionStorage.removeItem(k); localStorage.removeItem(k); });
                        ['user', 'mobilaz_current_user', 'adminUser'].forEach(k => localStorage.removeItem(k));
                    }
                    window.location.href = "index.html";
                });
            }
        }

        // If logged in and on login/signup page, redirect them away
        if (window.location.pathname.includes("login.html") || window.location.pathname.includes("signup.html")) {
            const isManualLogin = Boolean(window.loginFormSubmitted || sessionStorage.getItem('manualLoginInProgress'));
            if (!isManualLogin && (window.location.search.includes('expired') || window.location.search.includes('reason='))) {
                ['token','accessToken','authToken','adminToken','jwt','user','mobilaz_current_user','adminUser'].forEach(k => {
                    try { localStorage.removeItem(k); } catch(e){}
                    try { sessionStorage.removeItem(k); } catch(e){}
                });
                return;
            }
            if (window.location.pathname.includes("login.html")) {
                // Let login.html verified pre-check script or onLoginSuccess handle redirect safely
                return;
            }
            window.location.href = currentUser.role === 'admin' ? "admin.html" : "index.html";
        }
    } else {
        // If not logged in and trying to access cabinet, redirect to login
        if (window.location.pathname.includes("cabinet.html")) {
            window.location.href = "login.html";
        }
        if (window.location.pathname.includes("elan-yerlesdir.html")) {
            const search = (window.location && window.location.search) ? window.location.search : "";
            const target = search ? `elan-yerlesdir.html${search}` : "elan-yerlesdir.html";
            window.location.href = `login.html?redirect=${encodeURIComponent(target)}`;
        }
    }
});

// Re-run header update whenever components finish loading or auth changes
document.addEventListener("componentsLoaded", updateHeader);
window.addEventListener("authChanged", updateHeader);

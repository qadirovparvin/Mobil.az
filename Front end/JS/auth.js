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
        } catch (e) { return null; }
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

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
if (typeof window !== 'undefined') {
    window.escapeHtml = escapeHtml;
}

let _fetchingUnreadCount = false;
let _lastUnreadCountFetch = 0;
function fetchUnreadCount(token) {
    if (!token || !getToken()) return;
    const now = Date.now();
    if (_fetchingUnreadCount || (now - _lastUnreadCountFetch < 5000)) return;
    _fetchingUnreadCount = true;
    _lastUnreadCountFetch = now;
    fetch((window.API_URL || 'http://localhost:5000/api') + '/notifications/unread-count', {
        headers: { 'Authorization': 'Bearer ' + token }
    })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
            if (data && data.count > 0) {
                document.querySelectorAll('#notifCount').forEach(badge => {
                    badge.textContent = data.count > 99 ? '99+' : data.count;
                    badge.style.display = 'inline-block';
                });
            }
        })
        .catch(() => { })
        .finally(() => {
            _fetchingUnreadCount = false;
        });
}

// Header & Auth UI updater
function updateHeader() {
    const currentUser = getUser();
    const token = getToken();
    const loggedIn = Boolean(token && currentUser);

    const buttonContainers = document.querySelectorAll(".button-container");
    if (!buttonContainers.length) return;

    buttonContainers.forEach((buttonContainer) => {
        if (loggedIn) {
            const rawDisplayName = [currentUser.name || currentUser.firstName || '', currentUser.lastName || ''].filter(Boolean).join(' ') || currentUser.email || 'Kabinet';
            const safeDisplayName = escapeHtml(rawDisplayName);
            const safeEmail = escapeHtml(currentUser.email || '');
            const isAdmin = currentUser.role === 'admin';

            buttonContainer.innerHTML = `
                <!-- BİLDİRİŞ - AYRI DROPDOWN -->
                <div class="notif-wrapper" style="position:relative;">
                    <button id="notifBell" class="icon-btn notif-bell-btn" type="button" aria-label="Bildirişlər" title="Bildirişlər">
                        <i class="fas fa-bell"></i>
                        <span class="badge" id="notifCount" style="display:none;">0</span>
                    </button>
                    <div id="notifDropdown" class="dropdown-panel notif-panel hidden">
                        <div class="dropdown-header">
                            <span class="dropdown-title">Bildirişlər</span>
                            <button type="button" id="markAllRead" class="btn-mark-all-read">Hamısını oxu</button>
                        </div>
                        <div id="notifList" class="notif-list-container">
                            <div class="notif-empty-state">Yüklənir...</div>
                        </div>
                    </div>
                </div>

                ${isAdmin ? `
                <a href="admin.html" class="admin-panel-btn-header" style="background: linear-gradient(135deg, #e53935, #d32f2f); color: white; border: none; padding: 8px 14px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; font-size: 14px; margin-right: 4px; box-shadow: 0 2px 6px rgba(229,57,53,0.3);">
                    <i class="fas fa-shield-alt"></i> Admin Panel
                </a>
                ` : ''}

                <!-- PROFİL - AYRI DROPDOWN -->
                <div class="profile-wrapper" style="position:relative;">
                    <button id="profileBtn" class="cabinet-btn-header" type="button" style="background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: white; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; font-size: 14px; box-shadow: 0 2px 6px rgba(108,92,231,0.3); cursor: pointer;">
                        <i class="fas fa-user-circle"></i> <span>${safeDisplayName}</span>
                        <i class="fas fa-chevron-down" style="font-size: 10px; margin-left: 2px; opacity: 0.8;"></i>
                    </button>
                    <div id="profileDropdown" class="dropdown-panel profile-panel hidden">
                        <div class="profile-card-top">
                            <div class="avatar"><i class="fas fa-user"></i></div>
                            <div class="profile-user-details">
                                <div class="profile-name">${safeDisplayName}</div>
                                <div class="profile-email">${safeEmail}</div>
                                <span class="role-badge">${isAdmin ? 'ADMİN HESAB' : 'STANDART HESAB'}</span>
                            </div>
                        </div>
                        <div class="profile-menu-links">
                            <a href="cabinet.html#tab-profile"><i class="fas fa-chart-pie"></i> İdarə Paneli</a>
                            <a href="cabinet.html#tab-ads"><i class="fas fa-list-alt"></i> Mənim elanlarım</a>
                            <a href="cabinet.html#tab-messages"><i class="fas fa-envelope"></i> Mesajlar</a>
                            <a href="cabinet.html#tab-settings"><i class="fas fa-cog"></i> Tənzimləmələr</a>
                            ${isAdmin ? '<a href="admin.html" class="admin-link"><i class="fas fa-shield-alt"></i> Adminliyə keç</a>' : ''}
                            <a href="#" class="header-logout-btn text-danger"><i class="fas fa-sign-out-alt"></i> Çıxış</a>
                        </div>
                    </div>
                </div>
            `;

            // Ensure profile textContent is safely bound
            const profileBtnSpan = buttonContainer.querySelector('#profileBtn span');
            if (profileBtnSpan) profileBtnSpan.textContent = rawDisplayName;
            const profileNameEl = buttonContainer.querySelector('.profile-name');
            if (profileNameEl) profileNameEl.textContent = rawDisplayName;
            const profileEmailEl = buttonContainer.querySelector('.profile-email');
            if (profileEmailEl) profileEmailEl.textContent = currentUser.email || '';

            // Separate event listeners
            const notifBell = buttonContainer.querySelector('#notifBell');
            const notifDropdown = buttonContainer.querySelector('#notifDropdown');
            const profileBtn = buttonContainer.querySelector('#profileBtn');
            const profileDropdown = buttonContainer.querySelector('#profileDropdown');

            notifBell?.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown?.classList.add('hidden');
                notifDropdown?.classList.toggle('hidden');
                if (!notifDropdown?.classList.contains('hidden')) {
                    loadNotifications();
                }
            });

            profileBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                notifDropdown?.classList.add('hidden');
                profileDropdown?.classList.toggle('hidden');
            });

            notifDropdown?.addEventListener('click', (e) => e.stopPropagation());
            profileDropdown?.addEventListener('click', (e) => e.stopPropagation());

            const markAllReadBtn = buttonContainer.querySelector('#markAllRead');
            markAllReadBtn?.addEventListener('click', async (e) => {
                e.stopPropagation();
                const curToken = getToken();
                if (!curToken) return;
                try {
                    await fetch((window.API_URL || 'http://localhost:5000/api') + '/notifications/read-all', {
                        method: 'PUT',
                        headers: { 'Authorization': 'Bearer ' + curToken }
                    });
                    const badge = buttonContainer.querySelector('#notifCount');
                    if (badge) badge.style.display = 'none';
                    loadNotifications();
                } catch (err) { }
            });

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
                        ['user', 'mobilaz_current_user', 'adminUser', 'mobilaz_user', 'userRole', 'userEmail'].forEach(k => { sessionStorage.removeItem(k); localStorage.removeItem(k); });
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
        fetchUnreadCount(token);
    }
}

// Global outside click handler to close dropdowns
document.addEventListener('click', () => {
    document.querySelectorAll('#notifDropdown').forEach(d => d.classList.add('hidden'));
    document.querySelectorAll('#profileDropdown').forEach(d => d.classList.add('hidden'));
});

async function loadNotifications() {
    const listEl = document.getElementById('notifList');
    if (!listEl) return;
    const token = getToken();
    if (!token) {
        listEl.innerHTML = '<div class="notif-empty-state">Daxil olmamısınız</div>';
        return;
    }

    try {
        const res = await fetch((window.API_URL || 'http://localhost:5000/api') + '/notifications', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.notifications || []);
        if (items.length === 0) {
            listEl.innerHTML = '<div class="notif-empty-state">Bildiriş yoxdur</div>';
            return;
        }
        listEl.replaceChildren();
        items.forEach(n => {
            const timeStr = n.createdAt ? new Date(n.createdAt).toLocaleDateString('az-AZ', { hour: '2-digit', minute: '2-digit' }) : '';
            const title = (n.title || '').replace(/AiryPhone/gi, 'Mobil.az');
            const content = (n.body || n.message || '').replace(/AiryPhone/gi, 'Mobil.az');

            const itemDiv = document.createElement('div');
            itemDiv.className = `notif-item ${n.isRead || n.read ? '' : 'unread'}`;

            const textDiv = document.createElement('div');
            if (title) {
                const strong = document.createElement('strong');
                strong.textContent = title;
                textDiv.appendChild(strong);
                textDiv.appendChild(document.createElement('br'));
            }
            if (content) {
                textDiv.appendChild(document.createTextNode(content));
            }
            itemDiv.appendChild(textDiv);

            if (timeStr) {
                const timeSpan = document.createElement('span');
                timeSpan.className = 'notif-item-time';
                timeSpan.textContent = timeStr;
                itemDiv.appendChild(timeSpan);
            }

            listEl.appendChild(itemDiv);
        });
    } catch (err) {
        listEl.innerHTML = '<div class="notif-empty-state">Bildirişlər yüklənə bilmədi</div>';
    }
}
window.loadNotifications = loadNotifications;
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
                    const welcomeText = welcomeSpan.textContent;
                    welcomeDisplay.replaceChildren();
                    const newSpan = document.createElement('span');
                    newSpan.setAttribute('data-translate', 'cab-welcome');
                    newSpan.textContent = welcomeText;
                    welcomeDisplay.appendChild(newSpan);
                    const userFullName = `${currentUser.name || currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
                    welcomeDisplay.appendChild(document.createTextNode(` ${userFullName || currentUser.email || ''}!`));
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
                ['token', 'accessToken', 'authToken', 'adminToken', 'jwt', 'user', 'mobilaz_current_user', 'adminUser'].forEach(k => {
                    try { localStorage.removeItem(k); } catch (e) { }
                    try { sessionStorage.removeItem(k); } catch (e) { }
                });
                return;
            }
            if (window.location.pathname.includes("login.html")) {
                return;
            }
            window.location.href = currentUser.role === 'admin' ? "admin.html" : "index.html";
        }
    } else {
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

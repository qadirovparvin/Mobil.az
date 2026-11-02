"use strict";

/* ================================================================
   admin.js  —  Mobilim.az Admin Dashboard
   All API calls go to /api/admin/* with Bearer token from localStorage.
   Routes are protected server-side by protect + adminOnly middleware.
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const API   = window.API_URL || 'http://localhost:5000/api';
    const TOKEN = () => {
        if (typeof window.getAuthToken === 'function') {
            const t = window.getAuthToken();
            if (t) return t;
        }
        if (typeof window.getToken === 'function') {
            const t = window.getToken();
            if (t) return t;
        }
        const isRemember = localStorage.getItem('rememberMe') === 'true';
        const primaryStore = isRemember ? localStorage : sessionStorage;
        const fallbackStore = isRemember ? sessionStorage : localStorage;
        return primaryStore.getItem('adminToken') ||
               primaryStore.getItem('token') ||
               primaryStore.getItem('accessToken') ||
               fallbackStore.getItem('adminToken') ||
               fallbackStore.getItem('token') ||
               fallbackStore.getItem('accessToken') ||
               '';
    };

    /* ── DOM refs ──────────────────────────────────────────────── */
    const accessCheckEl   = document.getElementById('admin-access-check');
    const dashboardEl     = document.getElementById('admin-dashboard-screen');
    const logoutBtn       = document.getElementById('logoutBtn');
    const sidebarToggle   = document.getElementById('sidebarToggle');
    const sidebar         = document.getElementById('adminSidebar');
    const pageTitle       = document.getElementById('pageTitle');
    const adminName       = document.getElementById('adminName');
    const adminAvatar     = document.getElementById('adminAvatar');

    const statUsers   = document.getElementById('statUsers');
    const statAds     = document.getElementById('statAds');
    const statPending = document.getElementById('statPending');
    const statStores  = document.getElementById('statStores');
    const statRevenue = document.getElementById('statRevenue');

    const recentAdsTable      = document.getElementById('recentAdsTable');
    const recentUsersTable    = document.getElementById('recentUsersTable');
    const allUsersTable       = document.getElementById('allUsersTable');
    const allAdsTable         = document.getElementById('allAdsTable');
    const allTransactionsTable= document.getElementById('allTransactionsTable');

    const navCountUsers = document.getElementById('navCountUsers');
    const navCountAds   = document.getElementById('navCountAds');

    /* ── Theme Toggle Logic ────────────────────────────────────── */
    const adminThemeToggle = document.getElementById('adminThemeToggle');
    if (adminThemeToggle) {
        adminThemeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            if (next === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
            localStorage.setItem('mobilaz_theme', next);
            adminThemeToggle.querySelector('i').className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        });

        // Set initial icon
        const initialTheme = localStorage.getItem('mobilaz_theme');
        if (initialTheme === 'dark') {
            adminThemeToggle.querySelector('i').className = 'fas fa-sun';
        }
    }

    /* ── Profile Dropdown Toggle ──────────────────────────────── */
    const profileDropdown = document.getElementById('profileDropdownTrigger');
    if (profileDropdown) {
        profileDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('open');
        });
        document.addEventListener('click', () => profileDropdown.classList.remove('open'));
    }

    const menuLogoutBtn = document.getElementById('menuLogoutBtn');
    if (menuLogoutBtn) {
        menuLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearSession();
            window.location.replace('login.html');
        });
    }

    /* ── In-memory caches for client-side search ───────────────── */
    let cachedUsers = [];
    let cachedAds   = [];
    let cachedTx    = [];

    /* ── Global Search Filter ──────────────────────────────────── */
    window.handleGlobalSearch = function(val) {
        const q = String(val || '').trim().toLowerCase();
        if (!q) return;

        // If user is searching on dashboard, automatically show closest match on current or ads view
        if (document.getElementById('adSearch')) {
            document.getElementById('adSearch').value = q;
            window.filterAds();
        }
        if (document.getElementById('userSearch')) {
            document.getElementById('userSearch').value = q;
            window.filterUsers();
        }
    };

    /* ── Toast ─────────────────────────────────────────────────── */
    function toast(msg, type = 'info') {
        const el   = document.getElementById('adminToast');
        const icon = document.getElementById('toastIcon');
        const msgEl= document.getElementById('toastMsg');
        if (!el) return;
        icon.className = type === 'success' ? 'fas fa-circle-check'
                       : type === 'error'   ? 'fas fa-circle-xmark'
                       : 'fas fa-circle-info';
        el.className = `admin-toast show ${type}`;
        msgEl.textContent = msg;
        clearTimeout(el._t);
        el._t = setTimeout(() => el.classList.remove('show'), 3500);
    }

    /* ── Confirm modal ─────────────────────────────────────────── */
    function confirm(title, body) {
        return new Promise(resolve => {
            const prevFocus = document.activeElement;
            const modal  = document.getElementById('confirmModal');
            const mTitle = document.getElementById('modalTitle');
            const mBody  = document.getElementById('modalBody');
            const mOk    = document.getElementById('modalConfirm');
            const mCan   = document.getElementById('modalCancel');
            mTitle.textContent = title;
            mBody.textContent  = body;
            modal.classList.remove('hidden');

            const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];

            const trapFocus = (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstFocusable) {
                            lastFocusable.focus();
                            e.preventDefault();
                        }
                    } else {
                        if (document.activeElement === lastFocusable) {
                            firstFocusable.focus();
                            e.preventDefault();
                        }
                    }
                }
            };

            document.addEventListener('keydown', trapFocus);
            if (mCan) mCan.focus();

            const cleanup = (val) => {
                modal.classList.add('hidden');
                mOk.removeEventListener('click', onOk);
                mCan.removeEventListener('click', onCan);
                document.removeEventListener('keydown', trapFocus);
                if (prevFocus) prevFocus.focus();
                resolve(val);
            };
            const onOk  = () => cleanup(true);
            const onCan = () => cleanup(false);
            mOk.addEventListener('click', onOk);
            mCan.addEventListener('click', onCan);
        });
    }

    /* ── Escape HTML ───────────────────────────────────────────── */
    function esc(v) {
        return String(v ?? '')
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function fmtDate(v) {
        if (!v) return '—';
        const d = new Date(v);
        return isNaN(d) ? '—' : d.toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function emptyRow(cols, msg) {
        return `<tr><td colspan="${cols}" class="text-muted" style="text-align:center;padding:2rem;">${esc(msg)}</td></tr>`;
    }

    /* ── Auth helpers ──────────────────────────────────────────── */
    function clearSession() {
        if (window.clearAuthSession) window.clearAuthSession();
        else ['token','user','mobilaz_current_user','adminToken','adminUser'].forEach(k => localStorage.removeItem(k));
    }

    /* ── Token Refresh Queue & Logic ────────────────────────────── */
    let isRefreshing = false;
    let refreshQueue = [];

    function processRefreshQueue(err, token) {
        refreshQueue.forEach(prom => {
            if (err) prom.reject(err);
            else prom.resolve(token);
        });
        refreshQueue = [];
    }

    async function refreshToken() {
        if (typeof window.refreshAccessToken === 'function') {
            return await window.refreshAccessToken();
        }

        const res = await (window.originalFetch || window.fetch)(`${API}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const err = new Error(errData.message || 'Sessiya yenilənmədi');
            err.status = res.status;
            throw err;
        }

        const data = await res.json();
        const newToken = data.accessToken || data.token;
        if (!newToken) throw new Error('Yeni access token tapılmadı');

        const isRemember = localStorage.getItem('rememberMe') === 'true';
        const primaryStore = isRemember ? localStorage : sessionStorage;
        const fallbackStore = isRemember ? sessionStorage : localStorage;

        ['adminToken', 'token', 'accessToken'].forEach(k => {
            try { primaryStore.setItem(k, newToken); } catch(e) {}
            try { fallbackStore.setItem(k, newToken); } catch(e) {}
        });

        if (data.user) {
            const userStr = typeof data.user === 'string' ? data.user : JSON.stringify(data.user);
            try { primaryStore.setItem('user', userStr); } catch(e) {}
            try { fallbackStore.setItem('user', userStr); } catch(e) {}
            try { primaryStore.setItem('adminUser', userStr); } catch(e) {}
        }

        if (typeof window.saveAccessToken === 'function') {
            window.saveAccessToken(newToken, data.user);
        }

        return newToken;
    }

    /* ── Fetch wrapper with auth header & 401 transparent refresh ── */
    async function apiFetch(url, opts = {}) {
        const fetchFn = window.fetch;
        const token = TOKEN();
        const csrf = window.CSRF_TOKEN || localStorage.getItem('csrfToken') || sessionStorage.getItem('csrfToken');
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
            ...(opts.headers || {})
        };

        const fetchOpts = { ...opts };
        if (fetchOpts.body && typeof fetchOpts.body === 'object' && !(fetchOpts.body instanceof FormData)) {
            fetchOpts.body = JSON.stringify(fetchOpts.body);
        }

        let res;
        try {
            res = await fetchFn(url, {
                ...fetchOpts,
                credentials: 'include',
                headers
            });
        } catch (netErr) {
            throw netErr;
        }

        const isRefreshCall = url.includes('/auth/refresh') || url.includes('/auth/login');
        if (res.status === 401 && !opts._retry && !isRefreshCall) {
            opts._retry = true;
            try {
                let newToken;
                if (isRefreshing) {
                    newToken = await new Promise((resolve, reject) => {
                        refreshQueue.push({ resolve, reject });
                    });
                } else {
                    isRefreshing = true;
                    try {
                        newToken = await refreshToken();
                        processRefreshQueue(null, newToken);
                    } catch (refErr) {
                        processRefreshQueue(refErr, null);
                        throw refErr;
                    } finally {
                        isRefreshing = false;
                    }
                }

                // Retry with new token
                return await apiFetch(url, {
                    ...opts,
                    headers: {
                        ...(opts.headers || {}),
                        'Authorization': `Bearer ${newToken}`
                    }
                });
            } catch (refErr) {
                console.warn('Admin token refresh failed:', refErr);
                clearSession();
                window.location.replace('login.html?expired=1');
                return { res, data: null };
            }
        }

        let data = null;
        try { data = await res.json(); } catch {}
        return { res, data };
    }

    /* ── Admin API shorthand ────────────────────────────────────── */
    async function adminApi(endpoint, opts = {}) {
        const cleanEndpoint = String(endpoint).startsWith('/') ? endpoint.slice(1) : endpoint;

        // If window.api with axios is available, use it when appropriate
        const api = window.api || window.apiClient;
        if (api && typeof api.get === 'function' && (!opts.method || opts.method.toUpperCase() === 'GET') && !opts.body) {
            try {
                const response = await api.get(`/admin/${cleanEndpoint}`);
                return response.data;
            } catch (err) {
                if (err.response?.status === 401) {
                    clearSession();
                    window.location.replace('login.html?expired=1');
                    return null;
                }
                if (err.response?.status === 403) {
                    window.location.replace('index.html');
                    return null;
                }
                throw new Error(err.response?.data?.message || err.message || `Error ${err.response?.status}`);
            }
        }

        const { res, data } = await apiFetch(`${API}/admin/${cleanEndpoint}`, opts);
        if (res.status === 401) { clearSession(); window.location.replace('login.html'); return null; }
        if (res.status === 403) { window.location.replace('index.html'); return null; }
        if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
        return data;
    }

    /* ── Reveal page after access confirmed ─────────────────────── */
    function showDashboard() {
        if (accessCheckEl)  accessCheckEl.classList.add('hidden');
        if (dashboardEl)    dashboardEl.classList.remove('hidden');
        document.body.classList.add('admin-ready');
    }

    /* ── Populate admin avatar / name ───────────────────────────── */
    function renderProfile(user) {
        if (!user) return;
        const name = [user.name, user.lastName].filter(Boolean).join(' ') || user.email || 'Admin';
        if (adminName)   adminName.textContent = name;
        if (adminAvatar) adminAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563EB&color=fff`;

        const menuName  = document.getElementById('menuAdminName');
        const menuEmail = document.getElementById('menuAdminEmail');
        if (menuName)  menuName.textContent = name;
        if (menuEmail) menuEmail.textContent = user.email || 'admin@mobilim.az';
    }

    /* ── Verify admin on server ─────────────────────────────────── */
    async function ensureAdminAccess() {
        const token = TOKEN();
        if (!token) { window.location.replace('login.html'); return false; }

        let res, data;
        if (window.__adminVerified && window.__adminVerifyData) {
            data = window.__adminVerifyData;
            res = { ok: true, status: 200 };
        } else {
            try {
                ({ res, data } = await apiFetch(`${API}/admin/verify`));
            } catch (networkErr) {
                console.error('Admin verification network error:', networkErr);
                alert('Serverlə əlaqə yaradılmadı. Serverin işlədiyindən əmin olun (start_app.bat).');
                return false;
            }
        }

        if (res && res.status === 401) {
            clearSession();
            window.location.replace('login.html?expired=1');
            return false;
        }

        if (res && res.status === 403) {
            window.location.replace('index.html');
            return false;
        }

        if (!res.ok || !data || !data.authorized || data.role !== 'admin') {
            if (res && res.status >= 500) {
                console.error('Server error during admin verification:', res.status);
                alert('Serverdə daxili xəta baş verdi (HTTP ' + res.status + '). Yenidən cəhd edin.');
                return false;
            }
            clearSession();
            window.location.replace('login.html');
            return false;
        }

        // Refresh stored admin data
        const isRemember = localStorage.getItem('rememberMe') === 'true';
        if (isRemember) {
            localStorage.setItem('adminToken', token);
            localStorage.setItem('token', token);
        } else {
            sessionStorage.setItem('adminToken', token);
            sessionStorage.setItem('token', token);
            localStorage.removeItem('adminToken');
        }
        
        // Fetch profile data for visual rendering of name and avatar
        try {
            const profileRes = await apiFetch(`${API}/auth/me`);
            if (profileRes.res.ok) {
                localStorage.setItem('adminUser', JSON.stringify(profileRes.data));
                renderProfile(profileRes.data);
            }
        } catch (e) {
            console.warn('Failed to load admin profile info for UI rendering:', e);
        }

        return true;
    }

    /* ── Tab navigation ─────────────────────────────────────────── */
    const navItems     = document.querySelectorAll('.nav-item[data-target]');
    const viewSections = document.querySelectorAll('.view-section');

    window.switchTab = function(targetId) {
        navItems.forEach(nav => {
            const active = nav.dataset.target === targetId;
            nav.classList.toggle('active', active);
        });
        viewSections.forEach(v => v.classList.toggle('active', v.id === targetId));
    };

    navItems.forEach(item => item.addEventListener('click', e => {
        e.preventDefault();
        window.switchTab(item.dataset.target);
    }));

    /* ── Sidebar mobile toggle ──────────────────────────────────── */
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
    }

    /* ── Logout ─────────────────────────────────────────────────── */
    if (logoutBtn) {
        logoutBtn.addEventListener('click', e => {
            e.preventDefault();
            clearSession();
            window.location.replace('login.html');
        });
    }

    /* ══════════════════════════════════════════════════════════════
       RENDER: Stats
       ═══════════════════════════════════════════════════════════ */
    function renderStats(d) {
        if (!d) return;
        if (statUsers)   statUsers.textContent   = d.totalUsers   ?? 0;
        if (statAds)     statAds.textContent     = d.totalAds     ?? 0;
        if (statStores)  statStores.textContent  = d.totalStores  ?? 0;
        if (statRevenue) statRevenue.textContent = `${d.totalRevenue ?? 0} ₼`;

        const pendingCount = cachedAds.filter(a => (a.status || '').toLowerCase() === 'pending').length;
        if (statPending) statPending.textContent = pendingCount;

        if (navCountUsers) navCountUsers.textContent = d.totalUsers ?? 0;
        if (navCountAds)   navCountAds.textContent   = d.totalAds   ?? 0;
    }

    /* ══════════════════════════════════════════════════════════════
       RENDER: Recent Ads (Dashboard widget)
       ═══════════════════════════════════════════════════════════ */
    function renderRecentAds(ads) {
        if (!recentAdsTable) return;
        if (!ads.length) { recentAdsTable.innerHTML = emptyRow(5, 'Elan tapılmadı.'); return; }
        recentAdsTable.innerHTML = ads.slice(0, 5).map(a => {
            const title  = esc([a.brand, a.modelName].filter(Boolean).join(' ') || a.title || '—');
            const status = esc(a.status || '—');
            const stLower = (a.status || '').toLowerCase();
            const statusBadge = stLower === 'active' ? 'badge-success'
                              : stLower === 'rejected' ? 'badge-danger'
                              : stLower === 'pending'  ? 'badge-warning' : 'badge-primary';
            return `
            <tr>
                <td><strong>${title}</strong></td>
                <td>${esc(a.price??'—')} ₼</td>
                <td><span class="badge ${statusBadge}">${status}</span></td>
                <td>${fmtDate(a.createdAt)}</td>
                <td>
                    <button class="btn-sm" onclick="window.switchTab('ads-view')">Bax</button>
                </td>
            </tr>`;
        }).join('');
    }

    /* ══════════════════════════════════════════════════════════════
       RENDER: Recent users (dashboard widget, top 5)
       ═══════════════════════════════════════════════════════════ */
    function renderRecentUsers(users) {
        if (!recentUsersTable) return;
        if (!users.length) { recentUsersTable.innerHTML = emptyRow(4, 'İstifadəçi tapılmadı.'); return; }
        recentUsersTable.innerHTML = users.slice(0,5).map(u => `
            <tr>
                <td><div class="user-cell">
                    <div class="user-avatar">${esc((u.name||'?')[0].toUpperCase())}</div>
                    <span>${esc([u.name,u.lastName].filter(Boolean).join(' ')||'—')}</span>
                </div></td>
                <td>${esc(u.email||'—')}</td>
                <td><span class="badge ${u.role==='admin'?'badge-primary':'badge-success'}">${esc(u.role||'user')}</span></td>
                <td>${fmtDate(u.createdAt)}</td>
            </tr>`).join('');
    }

    /* ══════════════════════════════════════════════════════════════
       RENDER: All Users (with freeze + delete)
       ═══════════════════════════════════════════════════════════ */
    function renderUsers(users) {
        if (!allUsersTable) return;
        if (!users.length) { allUsersTable.innerHTML = emptyRow(10, 'İstifadəçi tapılmadı.'); return; }
        allUsersTable.innerHTML = users.map(u => {
            const name      = esc([u.name, u.lastName].filter(Boolean).join(' ') || '—');
            const isFroz    = u.status === 'frozen';
            const isBanned  = u.status === 'banned';
            const isAdm     = u.role   === 'admin';
            const adsCount  = u.adsCount || 0;
            const balance   = Number(u.balance ?? u.walletBalance ?? 0).toFixed(2);
            const refCount  = u.referralCount || 0;

            const statusBadge = isBanned
                ? '<span class="badge badge-danger">Ban</span>'
                : isFroz
                    ? '<span class="badge badge-warning">Dondurulmuş</span>'
                    : '<span class="badge badge-success">Aktiv</span>';

            return `
            <tr data-uid="${esc(u._id)}" data-name="${name}">
                <td><div class="user-cell" style="cursor:pointer;" onclick="window.openUserDetailModal('${esc(u._id)}')" title="Detallara baxmaq üçün klikləyin">
                    <div class="user-avatar" style="background:${isAdm?'rgba(239, 68, 68, 0.15)':''}; color:${isAdm?'#EF4444':''}">${esc((u.name||'?')[0].toUpperCase())}</div>
                    <span><strong>${name}</strong></span>
                </div></td>
                <td>${esc(u.email||'—')}</td>
                <td>${esc(u.phone||'—')}</td>
                <td><span class="badge ${isAdm?'badge-primary':'badge-success'}">${esc(u.role||'user')}</span></td>
                <td><strong>${adsCount}</strong></td>
                <td><strong style="color:#10b981;">${balance} ₼</strong></td>
                <td><span class="badge badge-info" style="background:rgba(99, 102, 241, 0.12);color:#6366f1;font-weight:600;">${refCount}</span></td>
                <td>${statusBadge}</td>
                <td>${fmtDate(u.createdAt)}</td>
                <td>
                    <div class="action-btns" style="display:flex;align-items:center;gap:6px;">
                        <button class="btn-icon" title="Detallı bax" onclick="window.openUserDetailModal('${esc(u._id)}')" style="color:var(--primary);">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon freeze" title="${isFroz?'Aktivləşdir':'Dondur'}"
                            data-action="${isFroz?'unfreeze':'freeze'}" data-id="${esc(u._id)}"
                            ${isAdm?'disabled title="Admin silinmir"':''}>
                            <i class="fas ${isFroz?'fa-play':'fa-snowflake'}"></i>
                        </button>
                        ${!isBanned ? `
                            <button onclick="banUser('${esc(u._id)}')" class="btn btn-danger btn-sm" ${isAdm ? 'disabled title="Admin ban edilmir"' : 'title="İstifadəçini banla"'}>
                                <i class="fas fa-ban"></i> Ban
                            </button>
                        ` : `
                            <button onclick="unbanUser('${esc(u._id)}')" class="btn btn-success btn-sm" ${isAdm ? 'disabled' : 'title="Banı qaldır"'}>
                                <i class="fas fa-check"></i> Unban
                            </button>
                        `}
                        <button class="btn-icon delete" title="Sil"
                            data-action="delete-user" data-id="${esc(u._id)}"
                            ${isAdm?'disabled title="Admin silinmir"':''}>
                            <i class="fas fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    async function banUser(id) {
        const ok = await confirm('İstifadəçini banla', 'Bu user-i banlamaq istəyirsiniz?');
        if (!ok) return;
        try {
            await adminApi(`users/${id}/ban`, { method: 'PUT', body: { status: 'banned' } });
            toast('İstifadəçi ban edildi.', 'success');
            await window.loadUsers(currentUserPage, currentUsersSearch);
        } catch (err) {
            toast('Xəta baş verdi: ' + (err.message || err), 'error');
        }
    }
    window.banUser = banUser;

    async function unbanUser(id) {
        const ok = await confirm('Banı qaldır', 'Bu istifadəçinin banını qaldırmaq istəyirsiniz?');
        if (!ok) return;
        try {
            await adminApi(`users/${id}/ban`, { method: 'PUT', body: { status: 'active' } });
            toast('İstifadəçinin banı qaldırıldı.', 'success');
            await window.loadUsers(currentUserPage, currentUsersSearch);
        } catch (err) {
            toast('Xəta baş verdi: ' + (err.message || err), 'error');
        }
    }
    window.unbanUser = unbanUser;

    /* ══════════════════════════════════════════════════════════════
       USERS PAGINATION & SEARCH
       ═══════════════════════════════════════════════════════════ */
    let currentUserPage = 1;
    const usersPerPage = 20;
    let currentUsersSearch = '';
    let userSearchTimer = null;

    window.loadUsers = async function(page = 1, search = currentUsersSearch) {
        currentUserPage = page;
        currentUsersSearch = search;
        const tbody = document.getElementById('allUsersTable');
        if (tbody) tbody.innerHTML = '<tr><td colspan="10" class="text-muted loading-cell">Yüklənir…</td></tr>';

        try {
            const queryParam = search ? `&search=${encodeURIComponent(search)}` : '';
            const data = await adminApi(`users?page=${page}&limit=${usersPerPage}${queryParam}`);
            const users = data?.users || data?.data || [];
            const totalPages = data?.totalPages || data?.pagination?.totalPages || 1;
            const currentPage = data?.currentPage || data?.pagination?.page || page;

            cachedUsers = users;
            renderUsers(users);
            if (page === 1 && !search) {
                renderRecentUsers(users);
            }
            window.renderUsersPagination(totalPages, currentPage);
            return data;
        } catch (err) {
            console.error('Failed to load users:', err);
            if (tbody) tbody.innerHTML = `<tr><td colspan="10" class="text-danger" style="text-align:center;padding:16px;">Xəta: ${esc(err.message)}</td></tr>`;
        }
    };

    window.renderUsersPagination = function(totalPages, currentPage) {
        const container = document.getElementById('usersPagination');
        if (!container) return;

        totalPages = Math.max(1, parseInt(totalPages, 10) || 1);
        currentPage = Math.max(1, Math.min(parseInt(currentPage, 10) || 1, totalPages));

        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }

        let html = '';
        html += `<button type="button" class="btn-page btn-prev" ${currentPage <= 1 ? 'disabled' : ''} onclick="window.loadUsers(${currentPage - 1})"><i class="fas fa-chevron-left"></i> Əvvəlki</button>`;

        pages.forEach(p => {
            if (p === '...') {
                html += `<span class="pagination-dots">…</span>`;
            } else {
                const active = p === currentPage ? 'active' : '';
                html += `<button type="button" class="btn-page ${active}" onclick="window.loadUsers(${p})">${p}</button>`;
            }
        });

        html += `<button type="button" class="btn-page btn-next" ${currentPage >= totalPages ? 'disabled' : ''} onclick="window.loadUsers(${currentPage + 1})">Növbəti <i class="fas fa-chevron-right"></i></button>`;

        container.innerHTML = html;
    };

    /* ── Debounced user search ──────────────────────────────────── */
    window.filterUsers = function() {
        clearTimeout(userSearchTimer);
        userSearchTimer = setTimeout(() => {
            const searchValue = document.getElementById('userSearch')?.value.trim() || '';
            currentUserPage = 1;
            window.loadUsers(1, searchValue);
        }, 300);
    };

    const userSearchInput = document.getElementById('userSearch');
    if (userSearchInput) {
        userSearchInput.addEventListener('keyup', () => {
            clearTimeout(userSearchTimer);
            userSearchTimer = setTimeout(() => {
                const searchValue = userSearchInput.value.trim();
                currentUserPage = 1;
                window.loadUsers(1, searchValue);
            }, 300);
        });
    }

    /* ── User actions handler ───────────────────────────────────── */
    if (allUsersTable) {
        allUsersTable.addEventListener('click', async e => {
            const btn = e.target.closest('[data-action]');
            if (!btn || btn.disabled) return;
            const action = btn.dataset.action;
            const id     = btn.dataset.id;
            const row    = btn.closest('tr');
            const name   = row?.dataset.name || 'İstifadəçi';

            if (action === 'delete-user') {
                const ok = await confirm('İstifadəçini sil', `"${name}" silinsin? Bu əməliyyat geri alına bilməz.`);
                if (!ok) return;
                try {
                    await adminApi(`users/${id}`, { method: 'DELETE' });
                    toast(`${name} silindi.`, 'success');
                    await window.loadUsers(currentUserPage, currentUsersSearch);
                } catch(err) { toast(err.message, 'error'); }
            }

            if (action === 'freeze' || action === 'unfreeze') {
                const newStatus = action === 'freeze' ? 'frozen' : 'active';
                const label     = action === 'freeze' ? 'donduruldu' : 'aktivləşdirildi';
                try {
                    await adminApi(`users/${id}/status`, {
                        method: 'PATCH',
                        body: JSON.stringify({ status: newStatus })
                    });
                    const u = cachedUsers.find(u => u._id === id);
                    if (u) u.status = newStatus;
                    renderUsers(cachedUsers);
                    toast(`${name} ${label}.`, 'success');
                } catch(err) { toast(err.message, 'error'); }
            }
        });
    }

    /* ══════════════════════════════════════════════════════════════
       USER DETAIL MODAL (ADS, TRANSACTIONS, REFERRALS)
       ═══════════════════════════════════════════════════════════ */
    let currentDetailUserId = null;

    window.openUserDetailModal = async function(userId) {
        currentDetailUserId = userId;
        const modal = document.getElementById('userDetailModal');
        if (!modal) return;

        modal.classList.remove('hidden');

        const nameEl = document.getElementById('udmUserName');
        const subEl  = document.getElementById('udmUserSub');
        const balEl  = document.getElementById('udmBalance');
        const adsEl  = document.getElementById('udmAdsCount');
        const refEl  = document.getElementById('udmReferralCount');

        const adsTabCount = document.getElementById('udmAdsTabCount');
        const txTabCount  = document.getElementById('udmTxTabCount');
        const refTabCount = document.getElementById('udmRefTabCount');

        const adsTbody = document.getElementById('udmAdsTableBody');
        const txTbody  = document.getElementById('udmTxTableBody');
        const refTbody = document.getElementById('udmRefTableBody');

        if (nameEl) nameEl.textContent = 'İstifadəçi Yüklənir…';
        if (subEl)  subEl.textContent  = '';
        if (balEl)  balEl.textContent  = '—';
        if (adsEl)  adsEl.textContent  = '—';
        if (refEl)  refEl.textContent  = '—';

        if (adsTbody) adsTbody.innerHTML = '<tr><td colspan="4" class="text-muted" style="text-align:center;padding:1rem;">Yüklənir…</td></tr>';
        if (txTbody)  txTbody.innerHTML  = '<tr><td colspan="4" class="text-muted" style="text-align:center;padding:1rem;">Yüklənir…</td></tr>';
        if (refTbody) refTbody.innerHTML = '<tr><td colspan="4" class="text-muted" style="text-align:center;padding:1rem;">Yüklənir…</td></tr>';

        window.switchUserDetailTab('ads');

        try {
            const data = await adminApi(`users/${encodeURIComponent(userId)}`);
            const u = data?.user || {};
            const ads = data?.ads || [];
            const txs = data?.transactions || [];
            const refs = data?.referrals || [];

            const fullName = [u.name, u.lastName].filter(Boolean).join(' ') || u.email || 'İstifadəçi';
            if (nameEl) nameEl.textContent = fullName;
            if (subEl)  subEl.textContent  = `${u.email || 'Email yoxdur'} • ${u.phone || 'Telefon yoxdur'} • Rol: ${u.role || 'user'}`;
            const totalAds = u.adsCount ?? (data?.counts?.ads ?? ads.length);
            const totalTxs = data?.counts?.transactions ?? txs.length;
            const totalRefs = u.referralCount ?? (data?.counts?.referrals ?? refs.length);

            if (balEl)  balEl.textContent  = `${Number(u.balance ?? u.walletBalance ?? 0).toFixed(2)} ₼`;
            if (adsEl)  adsEl.textContent  = String(totalAds);
            if (refEl)  refEl.textContent  = String(totalRefs);

            if (adsTabCount) adsTabCount.textContent = String(totalAds);
            if (txTabCount)  txTabCount.textContent  = String(totalTxs);
            if (refTabCount) refTabCount.textContent = String(totalRefs);

            // Render Ads Tab
            if (adsTbody) {
                if (!ads.length) {
                    adsTbody.innerHTML = '<tr><td colspan="4" class="text-muted" style="text-align:center;padding:1rem;">Bu istifadəçinin heç bir elanı yoxdur.</td></tr>';
                } else {
                    adsTbody.innerHTML = ads.map(a => {
                        const title = esc([a.brand, a.modelName].filter(Boolean).join(' ') || a.title || '—');
                        const stLower = (a.status || '').toLowerCase();
                        const statusBadge = stLower === 'active' ? 'badge-success'
                                          : stLower === 'rejected' ? 'badge-danger'
                                          : stLower === 'pending' ? 'badge-warning' : 'badge-primary';
                        return `
                            <tr>
                                <td><strong>${title}</strong></td>
                                <td>${esc(a.price ?? '—')} ₼</td>
                                <td><span class="badge ${statusBadge}">${esc(a.status || '—')}</span></td>
                                <td>${fmtDate(a.createdAt)}</td>
                            </tr>
                        `;
                    }).join('');
                }
            }

            // Render Transactions Tab
            if (txTbody) {
                if (!txs.length) {
                    txTbody.innerHTML = '<tr><td colspan="4" class="text-muted" style="text-align:center;padding:1rem;">Heç bir əməliyyat tapılmadı.</td></tr>';
                } else {
                    txTbody.innerHTML = txs.map(t => {
                        const isPlus = (t.amount || 0) > 0;
                        const color = isPlus ? '#10b981' : '#ef4444';
                        return `
                            <tr>
                                <td><span class="badge badge-secondary">${esc(t.type || 'transaction')}</span></td>
                                <td style="color:${color};font-weight:600;">${isPlus ? '+' : ''}${Number(t.amount || 0).toFixed(2)} ₼</td>
                                <td>${esc(t.description || '—')}</td>
                                <td>${fmtDate(t.createdAt)}</td>
                            </tr>
                        `;
                    }).join('');
                }
            }

            // Render Referrals Tab
            if (refTbody) {
                if (!refs.length) {
                    refTbody.innerHTML = '<tr><td colspan="4" class="text-muted" style="text-align:center;padding:1rem;">Bu istifadəçi heç kimi dəvət etməyib.</td></tr>';
                } else {
                    refTbody.innerHTML = refs.map(r => {
                        const rName = esc([r.name, r.lastName].filter(Boolean).join(' ') || '—');
                        return `
                            <tr>
                                <td><strong>${rName}</strong></td>
                                <td>${esc(r.email || '—')}</td>
                                <td>${esc(r.phone || '—')}</td>
                                <td>${fmtDate(r.createdAt)}</td>
                            </tr>
                        `;
                    }).join('');
                }
            }

        } catch (err) {
            console.error('Failed to load user details:', err);
            toast('İstifadəçi detalları yüklənə bilmədi: ' + (err.message || 'Xəta'), 'error');
            if (nameEl) nameEl.textContent = 'Xəta baş verdi';
        }
    };

    window.closeUserDetailModal = function() {
        const modal = document.getElementById('userDetailModal');
        if (modal) modal.classList.add('hidden');
    };

    window.switchUserDetailTab = function(tabName) {
        const tabs = ['ads', 'tx', 'ref'];
        tabs.forEach(t => {
            const btn = document.getElementById(`udmTabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
            const pane = document.getElementById(`udmTabContent${t.charAt(0).toUpperCase() + t.slice(1)}`);
            if (t === tabName) {
                if (btn) {
                    btn.classList.add('active');
                    btn.style.color = 'var(--primary)';
                    btn.style.borderBottom = '2px solid var(--primary)';
                }
                if (pane) pane.classList.remove('hidden');
            } else {
                if (btn) {
                    btn.classList.remove('active');
                    btn.style.color = 'var(--text-muted)';
                    btn.style.borderBottom = 'none';
                }
                if (pane) pane.classList.add('hidden');
            }
        });
    };

    // Close user detail modal on click outside or Escape
    const udModal = document.getElementById('userDetailModal');
    if (udModal) {
        udModal.addEventListener('click', (e) => {
            if (e.target === udModal) window.closeUserDetailModal();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.closeUserDetailModal();
        }
    });

    /* ══════════════════════════════════════════════════════════════
       RENDER: Ads (with approve / reject / delete)
       ═══════════════════════════════════════════════════════════ */
    function renderAds(ads) {
        if (!allAdsTable) return;
        if (!ads.length) { allAdsTable.innerHTML = emptyRow(7, 'Elan tapılmadı.'); return; }
        allAdsTable.innerHTML = ads.map(a => {
            const title  = esc([a.brand, a.modelName].filter(Boolean).join(' ') || a.title || '—');
            const author = esc(a.author?.name || a.author?.email || '—');
            const status = esc(a.status || '—');
            const promo  = esc(a.promotionType || 'yoxdur');
            const stLower = (a.status || '').toLowerCase();
            const statusBadge = stLower === 'active' ? 'badge-success'
                              : stLower === 'rejected' ? 'badge-danger'
                              : stLower === 'pending'  ? 'badge-warning' : 'badge-primary';
            return `
            <tr data-adid="${esc(a._id)}" data-title="${title}">
                <td><strong>${title}</strong></td>
                <td>${esc(a.price??'—')} ₼</td>
                <td>${author}</td>
                <td><span class="badge ${statusBadge}">${status}</span></td>
                <td><span class="badge ${promo!=='yoxdur'?'badge-primary':'badge-success'}">${promo}</span></td>
                <td>${fmtDate(a.createdAt)}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon approve" title="Təsdiqlə" data-action="approve-ad" data-id="${esc(a._id)}">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-icon reject" title="Rədd et" data-action="reject-ad" data-id="${esc(a._id)}">
                            <i class="fas fa-xmark"></i>
                        </button>
                        <button class="btn-icon delete" title="Sil" data-action="delete-ad" data-id="${esc(a._id)}">
                            <i class="fas fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    window.filterAds = function() {
        const q = document.getElementById('adSearch')?.value.toLowerCase() || '';
        renderAds(cachedAds.filter(a =>
            ([a.brand,a.modelName,a.title].filter(Boolean).join(' ')).toLowerCase().includes(q)
        ));
    };

    if (allAdsTable) {
        allAdsTable.addEventListener('click', async e => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const id     = btn.dataset.id;
            const row    = btn.closest('tr');
            const title  = row?.dataset.title || 'Elan';

            if (action === 'approve-ad') {
                try {
                    await adminApi(`ads/${id}/status`, { method:'PUT', body: JSON.stringify({ status:'active' }) });
                    const a = cachedAds.find(a => a._id === id);
                    if (a) a.status = 'active';
                    renderAds(cachedAds);
                    renderRecentAds(cachedAds);
                    toast(`"${title}" təsdiqləndi.`, 'success');
                } catch(err) { toast(err.message, 'error'); }
            }

            if (action === 'reject-ad') {
                try {
                    await adminApi(`ads/${id}/status`, { method:'PUT', body: JSON.stringify({ status:'rejected' }) });
                    const a = cachedAds.find(a => a._id === id);
                    if (a) a.status = 'rejected';
                    renderAds(cachedAds);
                    renderRecentAds(cachedAds);
                    toast(`"${title}" rədd edildi.`, 'info');
                } catch(err) { toast(err.message, 'error'); }
            }

            if (action === 'delete-ad') {
                const ok = await confirm('Elanı sil', `"${title}" silinsin? Bu əməliyyat geri alına bilməz.`);
                if (!ok) return;
                try {
                    await adminApi(`ads/${id}`, { method: 'DELETE' });
                    cachedAds = cachedAds.filter(a => a._id !== id);
                    renderAds(cachedAds);
                    renderRecentAds(cachedAds);
                    toast(`"${title}" silindi.`, 'success');
                } catch(err) { toast(err.message, 'error'); }
            }
        });
    }

    /* ══════════════════════════════════════════════════════════════
       RENDER: Transactions
       ═══════════════════════════════════════════════════════════ */
    function renderTransactions(txs) {
        if (!allTransactionsTable) return;
        if (!txs.length) { allTransactionsTable.innerHTML = emptyRow(5, 'Əməliyyat tapılmadı.'); return; }
        allTransactionsTable.innerHTML = txs.map(t => {
            const amt = Number(t.amount || 0);
            return `
            <tr>
                <td>${esc(t.user?.name || t.user?.email || 'Sistem')}</td>
                <td><span class="badge badge-primary">${esc(t.type||'—')}</span></td>
                <td class="${amt<0?'text-danger':'text-success'}">${amt>0?'+':''}${amt} ₼</td>
                <td>${esc(t.description||'—')}</td>
                <td>${fmtDate(t.createdAt)}</td>
            </tr>`;
        }).join('');
    }

    /* ══════════════════════════════════════════════════════════════
       CSV EXPORT UTILITIES
       ═══════════════════════════════════════════════════════════ */
    function exportCSV(headers, rows, filename) {
        const escCell = v => {
            const s = String(v ?? '');
            return (s.includes(',') || s.includes('"') || s.includes('\n'))
                ? `"${s.replace(/"/g, '""')}"`
                : s;
        };

        const lines = [
            headers.map(escCell).join(','),
            ...rows.map(row => row.map(escCell).join(','))
        ].join('\r\n');

        const blob = new Blob(['\uFEFF' + lines], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast(`"${filename}" yükləndi.`, 'success');
    }

    window.exportUsersCSV = function() {
        if (!cachedUsers.length) { toast('Export ediləcək məlumat yoxdur.', 'info'); return; }
        const headers = ['Ad', 'Soyad', 'Email', 'Telefon', 'Rol', 'Elan sayı', 'Balans (₼)', 'Dəvət', 'Status', 'Qeydiyyat tarixi'];
        const rows = cachedUsers.map(u => [
            u.name     || '',
            u.lastName || '',
            u.email    || '',
            u.phone    || '',
            u.role     || 'user',
            u.adsCount || 0,
            Number(u.balance ?? u.walletBalance ?? 0).toFixed(2),
            u.referralCount || 0,
            u.status   || 'active',
            u.createdAt ? new Date(u.createdAt).toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
        ]);
        const date = new Date().toISOString().slice(0,10);
        exportCSV(headers, rows, `mobilaz_users_${date}.csv`);
    };

    window.exportAdsCSV = function() {
        if (!cachedAds.length) { toast('Export ediləcək məlumat yoxdur.', 'info'); return; }
        const headers = ['Başlıq', 'Marka', 'Model', 'Qiymət (₼)', 'Status', 'Promo', 'Müəllif', 'Tarix'];
        const rows = cachedAds.map(a => [
            a.title        || [a.brand, a.modelName].filter(Boolean).join(' ') || '',
            a.brand        || '',
            a.modelName    || '',
            a.price        ?? '',
            a.status       || '',
            a.promotionType || 'yoxdur',
            a.author?.name || a.author?.email || '',
            a.createdAt ? new Date(a.createdAt).toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
        ]);
        const date = new Date().toISOString().slice(0,10);
        exportCSV(headers, rows, `mobilaz_ads_${date}.csv`);
    };

    window.exportTransactionsCSV = function() {
        if (!cachedTx.length) { toast('Export ediləcək məlumat yoxdur.', 'info'); return; }
        const headers = ['İstifadəçi', 'Növ', 'Məbləğ (₼)', 'Açıqlama', 'Tarix'];
        const rows = cachedTx.map(t => [
            t.user?.name || t.user?.email || 'Sistem',
            t.type        || '',
            t.amount      ?? 0,
            t.description || '',
            t.createdAt ? new Date(t.createdAt).toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
        ]);
        const date = new Date().toISOString().slice(0,10);
        exportCSV(headers, rows, `mobilaz_transactions_${date}.csv`);
    };

    /* ══════════════════════════════════════════════════════════════
       PAYMENT SESSIONS MONITORING & RECONCILIATION
       ═══════════════════════════════════════════════════════════ */
    let currentPaymentSessionsPage = 1;
    let currentPaymentSessionsStatus = 'pending';
    const escapeHtml = esc;

    // GET /api/admin/payment-sessions?status=pending
    window.loadPaymentSessions = async function(status = currentPaymentSessionsStatus, page = 1) {
        currentPaymentSessionsStatus = status;
        currentPaymentSessionsPage = page;
        const tbody = document.getElementById('allPaymentSessionsTable');
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-muted loading-cell">Yüklənir…</td></tr>';

        try {
            const queryStatus = (status && status !== 'all') ? `status=${encodeURIComponent(status)}&` : '';
            const data = await adminApi(`/payment-sessions?${queryStatus}page=${page}&limit=20`);
            const sessions = data?.sessions || (Array.isArray(data) ? data : []);
            const total = data?.total || sessions.length;
            window.renderPaymentSessions(sessions, total, page, 20);
        } catch (err) {
            console.error('Failed to load payment sessions:', err);
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-danger" style="text-align:center;padding:16px;">Xəta: ${esc(err.message)}</td></tr>`;
        }
    };

    window.renderPaymentSessions = function(sessions, total = 0, page = 1, limit = 20) {
        const tbody = document.getElementById('allPaymentSessionsTable');
        if (!tbody) return;

        if (!sessions || !sessions.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-muted text-center" style="padding:24px;">Heç bir ödəniş sessiyası tapılmadı.</td></tr>';
            updatePaymentSessionsPagination(0, 1, limit);
            return;
        }

        const statusBadges = {
            'completed': '<span class="badge badge-success" style="background:#10b981;color:#fff;padding:3px 8px;border-radius:6px;font-size:12px;">completed</span>',
            'paid': '<span class="badge badge-success" style="background:#10b981;color:#fff;padding:3px 8px;border-radius:6px;font-size:12px;">paid</span>',
            'pending': '<span class="badge badge-warning" style="background:#f59e0b;color:#fff;padding:3px 8px;border-radius:6px;font-size:12px;">pending</span>',
            'processing': '<span class="badge badge-info" style="background:#3b82f6;color:#fff;padding:3px 8px;border-radius:6px;font-size:12px;">processing</span>',
            'failed': '<span class="badge badge-danger" style="background:#ef4444;color:#fff;padding:3px 8px;border-radius:6px;font-size:12px;">failed</span>',
            'expired': '<span class="badge badge-secondary" style="background:#64748b;color:#fff;padding:3px 8px;border-radius:6px;font-size:12px;">expired</span>'
        };

        tbody.innerHTML = sessions.map(s => {
            const sid = s.paymentId || s._id || '';
            const userPhone = s.user?.phone || s.user?.email || '—';
            const amount = `${Number(s.expectedAmount || s.amount || 0).toFixed(2)} ${s.currency || 'AZN'}`;
            const providerOrderId = s.providerOrderId || '—';
            const statusHtml = statusBadges[s.status] || `<span class="badge">${esc(s.status || '')}</span>`;
            const dateStr = s.createdAt ? new Date(s.createdAt).toLocaleString('az-AZ') : '—';
            const canReconcile = s.status === 'pending' || s.status === 'processing';
            const actionBtn = canReconcile
                ? `<button class="btn btn-sm btn-primary" onclick="reconcileSession('${s._id || s.paymentId}')" style="padding:4px 10px;font-size:12px;border-radius:6px;background:var(--primary);color:#fff;border:none;cursor:pointer;">
                    <i class="fas fa-arrows-rotate"></i> Reconcile
                   </button>`
                : `<span style="font-size:12px;color:var(--text-muted);"><i class="fas fa-check"></i> Hazırdır</span>`;

            return `
                <tr>
                    <td style="font-family:monospace;font-size:12px;"><strong>${esc(String(sid).substring(0, 16))}</strong></td>
                    <td>${esc(userPhone)}</td>
                    <td><strong style="color:#10b981;">${amount}</strong></td>
                    <td style="font-family:monospace;font-size:12px;">${esc(providerOrderId)}</td>
                    <td>${statusHtml}</td>
                    <td style="font-size:12px;">${dateStr}</td>
                    <td>${actionBtn}</td>
                </tr>
            `;
        }).join('');

        updatePaymentSessionsPagination(total, page, limit);
    };

    function updatePaymentSessionsPagination(total, page, limit) {
        const info = document.getElementById('paymentSessionsPageInfo');
        const prevBtn = document.getElementById('prevPaymentSessionsBtn');
        const nextBtn = document.getElementById('nextPaymentSessionsBtn');
        const totalPages = Math.max(1, Math.ceil(total / limit));

        if (info) info.textContent = `Səhifə ${page} / ${totalPages} (Ümumi: ${total})`;
        if (prevBtn) prevBtn.disabled = page <= 1;
        if (nextBtn) nextBtn.disabled = page >= totalPages;
    }

    // POST /api/admin/payment-sessions/:id/reconcile -> toast + reload
    window.reconcileSession = async function(id) {
        const ok = await confirm('Uzlaşdırma', 'Bu sessiyanı provayder (Payriff) ilə uzlaşdırmaq istəyirsiniz?');
        if (!ok) return;
        try {
            const result = await adminApi(`/payment-sessions/${encodeURIComponent(id)}/reconcile`, { method: 'POST' });
            toast(result?.message || 'Uzlaşdırma sorğusu tamamlandı', result?.reconciled ? 'success' : 'info');
            await window.loadPaymentSessions(currentPaymentSessionsStatus, currentPaymentSessionsPage);
        } catch (err) {
            toast(err.message || 'Uzlaşdırma xətası baş verdi', 'error');
        }
    };

    const psFilter = document.getElementById('paymentSessionStatusFilter');
    if (psFilter) {
        psFilter.addEventListener('change', () => {
            window.loadPaymentSessions(psFilter.value, 1);
        });
    }
    const psRefresh = document.getElementById('refreshPaymentSessionsBtn');
    if (psRefresh) {
        psRefresh.addEventListener('click', () => {
            window.loadPaymentSessions(psFilter ? psFilter.value : 'pending', currentPaymentSessionsPage);
        });
    }
    const psPrev = document.getElementById('prevPaymentSessionsBtn');
    if (psPrev) {
        psPrev.addEventListener('click', () => {
            if (currentPaymentSessionsPage > 1) {
                window.loadPaymentSessions(currentPaymentSessionsStatus, currentPaymentSessionsPage - 1);
            }
        });
    }
    const psNext = document.getElementById('nextPaymentSessionsBtn');
    if (psNext) {
        psNext.addEventListener('click', () => {
            window.loadPaymentSessions(currentPaymentSessionsStatus, currentPaymentSessionsPage + 1);
        });
    }

    /* ══════════════════════════════════════════════════════════════
       LOAD ALL DATA
       ═══════════════════════════════════════════════════════════ */
    window.loadAllData = async function loadAll() {
        const [statsR, usersR, adsR, txR] = await Promise.allSettled([
            adminApi('stats'),
            window.loadUsers(1, ''),
            adminApi('ads?limit=100'),
            adminApi('transactions?limit=100')
        ]);

        if (usersR.status === 'fulfilled' && usersR.value) {
            const data = usersR.value;
            const users = data.users || data.data || [];
            if (users.length && !cachedUsers.length) {
                cachedUsers = users;
                renderUsers(cachedUsers);
                renderRecentUsers(cachedUsers);
            }
        }
        if (adsR.status === 'fulfilled' && adsR.value?.data) {
            cachedAds = Array.isArray(adsR.value.data) ? adsR.value.data : [];
            renderAds(cachedAds);
            renderRecentAds(cachedAds);
        }
        if (statsR.status === 'fulfilled' && statsR.value?.data) {
            renderStats(statsR.value.data);
        }
        if (txR.status === 'fulfilled' && txR.value?.data) {
            cachedTx = Array.isArray(txR.value.data) ? txR.value.data : [];
            renderTransactions(cachedTx);
        }

        window.loadPaymentSessions('pending', 1).catch(() => {});

        [statsR,usersR,adsR,txR].filter(r=>r.status==='rejected')
            .forEach(r => console.error('Admin load error:', r.reason));
    };

    /* ══════════════════════════════════════════════════════════════
       INIT
       ═══════════════════════════════════════════════════════════ */
    async function init() {
        try {
            const ok = await ensureAdminAccess();
            if (!ok) return;
            showDashboard();
            await window.loadAllData();
        } catch(err) {
            console.error('Admin init error:', err);
            const msg = String(err.message || '');
            if (msg.includes('401') || msg.includes('403') || msg.includes('Unauthorized')) {
                clearSession();
                window.location.replace('login.html');
            }
        }
    }

    init();
});

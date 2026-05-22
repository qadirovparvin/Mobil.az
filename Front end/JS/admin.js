"use strict";

/* ================================================================
   admin.js  —  AiryPhone Admin Dashboard
   All API calls go to /api/admin/* with Bearer token from localStorage.
   Routes are protected server-side by protect + adminOnly middleware.
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const API   = window.API_URL || 'http://localhost:5000/api';
    const TOKEN = () => localStorage.getItem('adminToken') || localStorage.getItem('token') || '';

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
    const statStores  = document.getElementById('statStores');
    const statRevenue = document.getElementById('statRevenue');

    const recentUsersTable    = document.getElementById('recentUsersTable');
    const allUsersTable       = document.getElementById('allUsersTable');
    const allAdsTable         = document.getElementById('allAdsTable');
    const allTransactionsTable= document.getElementById('allTransactionsTable');

    const navCountUsers = document.getElementById('navCountUsers');
    const navCountAds   = document.getElementById('navCountAds');

    /* ── In-memory caches for client-side search ───────────────── */
    let cachedUsers = [];
    let cachedAds   = [];
    let cachedTx    = [];

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
            const modal  = document.getElementById('confirmModal');
            const mTitle = document.getElementById('modalTitle');
            const mBody  = document.getElementById('modalBody');
            const mOk    = document.getElementById('modalConfirm');
            const mCan   = document.getElementById('modalCancel');
            mTitle.textContent = title;
            mBody.textContent  = body;
            modal.classList.remove('hidden');
            const cleanup = (val) => {
                modal.classList.add('hidden');
                mOk.removeEventListener('click', onOk);
                mCan.removeEventListener('click', onCan);
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
        return isNaN(d) ? '—' : d.toLocaleDateString('az-AZ');
    }

    function emptyRow(cols, msg) {
        return `<tr><td colspan="${cols}" class="text-muted" style="text-align:center;padding:2rem;">${esc(msg)}</td></tr>`;
    }

    /* ── Auth helpers ──────────────────────────────────────────── */
    function clearSession() {
        ['token','user','mobilaz_current_user','adminToken','adminUser'].forEach(k => localStorage.removeItem(k));
    }

    /* ── Fetch wrapper with auth header ────────────────────────── */
    async function apiFetch(url, opts = {}) {
        const res = await fetch(url, {
            ...opts,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN()}`,
                ...(opts.headers || {})
            }
        });
        let data = null;
        try { data = await res.json(); } catch {}
        return { res, data };
    }

    /* ── Admin API shorthand ────────────────────────────────────── */
    async function adminApi(endpoint, opts = {}) {
        const { res, data } = await apiFetch(`${API}/admin/${endpoint}`, opts);
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
        if (adminAvatar) adminAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`;
    }

    /* ── Verify admin on server ─────────────────────────────────── */
    async function ensureAdminAccess() {
        const token = TOKEN();
        if (!token) { window.location.replace('login.html'); return false; }

        let res, data;
        try {
            ({ res, data } = await apiFetch(`${API}/auth/me`));
        } catch (networkErr) {
            // Server unreachable — do NOT wipe session.
            // Fall back to cached user if it confirms admin role.
            console.warn('Admin: server unreachable, trying cached session.', networkErr);
            const cached = JSON.parse(
                localStorage.getItem('adminUser') ||
                localStorage.getItem('user') ||
                'null'
            );
            if (cached && cached.role === 'admin' && cached.status === 'active') {
                renderProfile(cached);
                return true;
            }
            alert('Serverlə əlaqə yaradılmadı. Serverin işlədiyindən əmin olun (start_app.bat).');
            return false;
        }

        // 401/403 = invalid/expired token — safe to clear session
        if (res.status === 401 || res.status === 403) {
            clearSession();
            window.location.replace('login.html');
            return false;
        }

        if (!res.ok) {
            // 500 or other server error — don't wipe valid session
            console.error('Admin: /auth/me returned', res.status);
            return false;
        }

        if (data?.role !== 'admin')    { window.location.replace('index.html'); return false; }
        if (data?.status !== 'active') { clearSession(); window.location.replace('login.html'); return false; }

        // Refresh stored admin data
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUser', JSON.stringify(data));
        renderProfile(data);
        return true;
    }


    /* ── Tab navigation ─────────────────────────────────────────── */
    const navItems     = document.querySelectorAll('.nav-item[data-target]');
    const viewSections = document.querySelectorAll('.view-section');

    window.switchTab = function(targetId) {
        navItems.forEach(nav => {
            const active = nav.dataset.target === targetId;
            nav.classList.toggle('active', active);
            if (active && pageTitle) pageTitle.textContent = nav.querySelector('span')?.textContent || '';
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
        if (navCountUsers) navCountUsers.textContent = d.totalUsers ?? 0;
        if (navCountAds)   navCountAds.textContent   = d.totalAds   ?? 0;
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
        if (!users.length) { allUsersTable.innerHTML = emptyRow(7, 'İstifadəçi tapılmadı.'); return; }
        allUsersTable.innerHTML = users.map(u => {
            const name   = esc([u.name,u.lastName].filter(Boolean).join(' ')||'—');
            const isFroz = u.status === 'frozen';
            const isAdm  = u.role   === 'admin';
            return `
            <tr data-uid="${esc(u._id)}" data-name="${name}">
                <td><div class="user-cell">
                    <div class="user-avatar" style="background:${isAdm?'#FEE2E2':''}; color:${isAdm?'#EF4444':''}">${esc((u.name||'?')[0].toUpperCase())}</div>
                    <span>${name}</span>
                </div></td>
                <td>${esc(u.email||'—')}</td>
                <td>${esc(u.phone||'—')}</td>
                <td><span class="badge ${isAdm?'badge-primary':'badge-success'}">${esc(u.role||'user')}</span></td>
                <td><span class="badge ${isFroz?'badge-warning':'badge-success'}">${isFroz?'Dondurulmuş':'Aktiv'}</span></td>
                <td>${fmtDate(u.createdAt)}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon freeze" title="${isFroz?'Aktivləşdir':'Dondur'}"
                            data-action="${isFroz?'unfreeze':'freeze'}" data-id="${esc(u._id)}"
                            ${isAdm?'disabled title="Admin silinmir"':''}>
                            <i class="fas ${isFroz?'fa-play':'fa-snowflake'}"></i>
                        </button>
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

    /* ── Client-side user search ────────────────────────────────── */
    window.filterUsers = function() {
        const q = document.getElementById('userSearch')?.value.toLowerCase() || '';
        renderUsers(cachedUsers.filter(u =>
            (u.name||'').toLowerCase().includes(q) ||
            (u.email||'').toLowerCase().includes(q)
        ));
    };

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
                    cachedUsers = cachedUsers.filter(u => u._id !== id);
                    renderUsers(cachedUsers);
                    renderRecentUsers(cachedUsers);
                    toast(`${name} silindi.`, 'success');
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
            const statusBadge = status === 'Active' ? 'badge-success'
                              : status === 'Rejected' ? 'badge-danger'
                              : status === 'Pending'  ? 'badge-warning' : 'badge-primary';
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
                    await adminApi(`ads/${id}/status`, { method:'PUT', body: JSON.stringify({ status:'Active' }) });
                    const a = cachedAds.find(a => a._id === id);
                    if (a) a.status = 'Active';
                    renderAds(cachedAds);
                    toast(`"${title}" təsdiqləndi.`, 'success');
                } catch(err) { toast(err.message, 'error'); }
            }

            if (action === 'reject-ad') {
                try {
                    await adminApi(`ads/${id}/status`, { method:'PUT', body: JSON.stringify({ status:'Rejected' }) });
                    const a = cachedAds.find(a => a._id === id);
                    if (a) a.status = 'Rejected';
                    renderAds(cachedAds);
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

    /**
     * Generic CSV exporter.
     * @param {string[]}   headers  - Column header names
     * @param {string[][]} rows     - Array of value arrays (one per row)
     * @param {string}     filename - Desired .csv filename
     */
    function exportCSV(headers, rows, filename) {
        const escCell = v => {
            const s = String(v ?? '');
            // Wrap in quotes if value contains comma, quote, or newline
            return (s.includes(',') || s.includes('"') || s.includes('\n'))
                ? `"${s.replace(/"/g, '""')}"`
                : s;
        };

        const lines = [
            headers.map(escCell).join(','),
            ...rows.map(row => row.map(escCell).join(','))
        ].join('\r\n');

        // UTF-8 BOM ensures Excel correctly renders special characters (ə, ş, ı, etc.)
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

    /* ── Export: Users ──────────────────────────────────────────── */
    window.exportUsersCSV = function() {
        if (!cachedUsers.length) { toast('Export ediləcək məlumat yoxdur.', 'info'); return; }
        const headers = ['Ad', 'Soyad', 'Email', 'Telefon', 'Rol', 'Status', 'Qeydiyyat tarixi'];
        const rows = cachedUsers.map(u => [
            u.name     || '',
            u.lastName || '',
            u.email    || '',
            u.phone    || '',
            u.role     || 'user',
            u.status   || 'active',
            u.createdAt ? new Date(u.createdAt).toLocaleDateString('az-AZ') : ''
        ]);
        const date = new Date().toISOString().slice(0,10);
        exportCSV(headers, rows, `airyphone_users_${date}.csv`);
    };

    /* ── Export: Ads ────────────────────────────────────────────── */
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
            a.createdAt ? new Date(a.createdAt).toLocaleDateString('az-AZ') : ''
        ]);
        const date = new Date().toISOString().slice(0,10);
        exportCSV(headers, rows, `airyphone_ads_${date}.csv`);
    };

    /* ── Export: Transactions ───────────────────────────────────── */
    window.exportTransactionsCSV = function() {
        if (!cachedTx.length) { toast('Export ediləcək məlumat yoxdur.', 'info'); return; }
        const headers = ['İstifadəçi', 'Növ', 'Məbləğ (₼)', 'Açıqlama', 'Tarix'];
        const rows = cachedTx.map(t => [
            t.user?.name || t.user?.email || 'Sistem',
            t.type        || '',
            t.amount      ?? 0,
            t.description || '',
            t.createdAt ? new Date(t.createdAt).toLocaleDateString('az-AZ') : ''
        ]);
        const date = new Date().toISOString().slice(0,10);
        exportCSV(headers, rows, `airyphone_transactions_${date}.csv`);
    };

    /* ══════════════════════════════════════════════════════════════
       LOAD ALL DATA
       ═══════════════════════════════════════════════════════════ */
    async function loadAll() {
        const [statsR, usersR, adsR, txR] = await Promise.allSettled([
            adminApi('stats'),
            adminApi('users?limit=100'),
            adminApi('ads?limit=100'),
            adminApi('transactions?limit=100')
        ]);

        if (statsR.status === 'fulfilled' && statsR.value?.data)  renderStats(statsR.value.data);
        if (usersR.status === 'fulfilled' && usersR.value?.data)  {
            cachedUsers = Array.isArray(usersR.value.data) ? usersR.value.data : [];
            renderUsers(cachedUsers);
            renderRecentUsers(cachedUsers);
        }
        if (adsR.status === 'fulfilled' && adsR.value?.data) {
            cachedAds = Array.isArray(adsR.value.data) ? adsR.value.data : [];
            renderAds(cachedAds);
        }
        if (txR.status === 'fulfilled' && txR.value?.data) {
            cachedTx = Array.isArray(txR.value.data) ? txR.value.data : [];
            renderTransactions(cachedTx);
        }

        [statsR,usersR,adsR,txR].filter(r=>r.status==='rejected')
            .forEach(r => console.error('Admin load error:', r.reason));
    }

    /* ══════════════════════════════════════════════════════════════
       INIT
       ═══════════════════════════════════════════════════════════ */
    async function init() {
        try {
            const ok = await ensureAdminAccess();
            if (!ok) return;
            showDashboard();
            await loadAll();
        } catch(err) {
            console.error('Admin init error:', err);
            // Only clear session for auth errors, not generic JS errors
            const msg = String(err.message || '');
            if (msg.includes('401') || msg.includes('403') || msg.includes('Unauthorized')) {
                clearSession();
                window.location.replace('login.html');
            }
            // Otherwise just log — don't wipe a valid session
        }
    }

    init();
});

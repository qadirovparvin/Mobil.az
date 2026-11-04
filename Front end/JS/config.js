/**
 * Mobilim.az — Centralized API Configuration
 * 
 * This file sets the global API base URL used by all frontend scripts.
 * Update this value when deploying to staging or production.
 */
function resolveDefaultApiUrl() {
    if (typeof window === 'undefined') return 'http://localhost:5000/api';
    var hostname = window.location.hostname || '';
    var isLocal = ['localhost', '127.0.0.1', '::1', '[::1]', '', '0.0.0.0'].includes(hostname) || hostname.startsWith('192.168.') || hostname.startsWith('10.') || window.location.protocol === 'file:';
    if (!isLocal) {
        // Production: frontend and backend are hosted on same origin
        return (window.location.origin ? window.location.origin : '') + '/api';
    }
    // Local development
    return 'http://localhost:5000/api';
}

var resolvedApi = resolveDefaultApiUrl();
var backendHost = resolvedApi.replace(/\/api\/?$/, '');
var isLocal = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

if (typeof window !== 'undefined') {
    window.BASE_URL = backendHost;
    window.API_URL = resolvedApi;
    window.API_BASE = resolvedApi;
    window.API_BASE_URL = resolvedApi;
    window.resolveDefaultApiUrl = resolveDefaultApiUrl;
}
if (typeof globalThis !== 'undefined') {
    globalThis.BASE_URL = backendHost;
    globalThis.API_URL = resolvedApi;
    globalThis.API_BASE = resolvedApi;
    globalThis.API_BASE_URL = resolvedApi;
    globalThis.resolveDefaultApiUrl = resolveDefaultApiUrl;
}

if (typeof window !== 'undefined' && typeof fetch === 'function') {
    const healthUrl = `${backendHost}/api/health`;
    fetch(healthUrl, { method: 'GET' })
        .then(r => {
            if (!r.ok) console.warn('Backend health check returned status:', r.status);
        })
        .catch(err => {
            if (isLocal) {
                console.warn('Backend server is down or unreachable (http://localhost:5000). Run "node Backend/ensure_backend.js" to start it.', err);
            }
        });
}

// Global password visibility toggler (safe against strict CSP and works immediately)
window.togglePwd = function (inputId, iconId) {
    let inp = inputId ? document.getElementById(inputId) : null;
    let icon = iconId ? document.getElementById(iconId) : null;
    if (!inp && icon) {
        const group = icon.closest('.input-group') || icon.parentElement;
        if (group) inp = group.querySelector('input[type="password"], input[type="text"]');
    }
    if (!inp) return;

    const now = Date.now();
    if (inp._lastToggle && (now - inp._lastToggle < 250)) {
        return;
    }
    inp._lastToggle = now;

    if (inp.type === 'password') {
        inp.type = 'text';
        if (icon) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    } else {
        inp.type = 'password';
        if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
};

if (typeof document !== 'undefined') {
    document.addEventListener('click', function (e) {
        const icon = e.target && e.target.closest ? e.target.closest('.toggle-password, #toggleLoginPwd, #toggleSignupPwd, #toggleSignupConfirm, #toggleResetPwd, #toggleConfirmResetPwd') : null;
        if (!icon) return;
        const group = icon.closest('.input-group') || icon.parentElement;
        const inp = group ? group.querySelector('input[type="password"], input[type="text"]') : null;
        window.togglePwd(inp ? inp.id : null, icon.id);
    });
}


window.getToken = function () {
    const tryGet = (store, key) => {
        try {
            let t = store.getItem(key);
            if (!t || t === 'null' || t === 'undefined' || t === '""' || t === "''") return null;
            t = t.trim().replace(/^["']+|["']+$/g, '');
            if (t.startsWith('{')) {
                try { const o = JSON.parse(t); t = o.token || o.accessToken || ''; } catch (e) { }
            }
            if (t.length < 30) return null;
            // JWT format check: 3 parts with dots
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
};
window.getAuthToken = window.getToken;

window.getUser = window.getUser || function getUser() {
    const raw = localStorage.getItem('user') ||
        localStorage.getItem('mobilaz_current_user') ||
        localStorage.getItem('mobilaz_user') ||
        sessionStorage.getItem('user') ||
        sessionStorage.getItem('mobilaz_current_user') ||
        localStorage.getItem('adminUser') ||
        sessionStorage.getItem('adminUser');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
};
window.getCurrentUser = window.getUser;

window.isLoggedIn = window.isLoggedIn || function isLoggedIn() {
    return Boolean(window.getToken() && window.getUser());
};
window.isAuthenticated = window.isLoggedIn;

window.persistAuthSession = function persistAuthSession(data, token, rememberMeParam) {
    if (typeof window.persistSession === 'function') {
        return window.persistSession(data || { token }, rememberMeParam);
    }
    const accessToken = token || data?.accessToken || data?.token || data?.authToken || '';
    const userPayload = data?.user || data || {};
    let rememberMe = rememberMeParam;
    if (rememberMe === undefined) {
        rememberMe = data?.rememberMe !== undefined ? Boolean(data.rememberMe) : (localStorage.getItem('rememberMe') === 'true');
    }

    const tokenKeys = ['token', 'accessToken', 'authToken', 'adminToken', 'jwt'];
    tokenKeys.forEach(k => {
        try { localStorage.removeItem(k); } catch (e) { }
        try { sessionStorage.removeItem(k); } catch (e) { }
    });

    const userStr = JSON.stringify(userPayload);
    const userKeys = ['user', 'mobilaz_current_user', 'mobilaz_user'];

    if (rememberMe) {
        if (accessToken) try { localStorage.setItem('token', accessToken); } catch (e) { }
        try { localStorage.setItem('rememberMe', 'true'); } catch (e) { }
        userKeys.forEach((key) => { try { localStorage.setItem(key, userStr); } catch (e) { } });
        if (userPayload?.email) {
            try { localStorage.setItem('savedEmail', userPayload.email); } catch (e) { }
            try { localStorage.setItem('userEmail', userPayload.email); } catch (e) { }
        }
        if (userPayload?.role) try { localStorage.setItem('userRole', userPayload.role); } catch (e) { }
        if (userPayload?.role === 'admin' && accessToken) {
            try { localStorage.setItem('adminToken', accessToken); } catch (e) { }
            try { localStorage.setItem('adminUser', userStr); } catch (e) { }
        }
    } else {
        if (accessToken) try { sessionStorage.setItem('token', accessToken); } catch (e) { }
        try { localStorage.removeItem('rememberMe'); } catch (e) { }
        userKeys.forEach((key) => { try { sessionStorage.setItem(key, userStr); } catch (e) { } });
        if (userPayload?.email) {
            try { localStorage.setItem('savedEmail', userPayload.email); } catch (e) { }
            try { sessionStorage.setItem('userEmail', userPayload.email); } catch (e) { }
        }
        if (userPayload?.role) try { sessionStorage.setItem('userRole', userPayload.role); } catch (e) { }
        if (userPayload?.role === 'admin' && accessToken) {
            try { sessionStorage.setItem('adminToken', accessToken); } catch (e) { }
            try { sessionStorage.setItem('adminUser', userStr); } catch (e) { }
        }
    }

    if (typeof window.updateHeader === 'function') {
        try { window.updateHeader(); } catch (e) { }
    }
    if (typeof window.updateAuthUI === 'function') {
        try { window.updateAuthUI(); } catch (e) { }
    }
    try { window.dispatchEvent(new Event('authChanged')); } catch (e) { }
};

window.clearAuthSession = window.clearAuthSession || function clearAuthSession() {
    const keys = ['token', 'accessToken', 'authToken', 'adminToken', 'user', 'mobilaz_current_user', 'mobilaz_user', 'adminUser', 'userRole', 'userEmail'];
    keys.forEach((key) => {
        try { sessionStorage.removeItem(key); } catch (e) { }
        try { localStorage.removeItem(key); } catch (e) { }
    });
    if (typeof window.updateHeader === 'function') {
        try { window.updateHeader(); } catch (e) { }
    }
    if (typeof window.updateAuthUI === 'function') {
        try { window.updateAuthUI(); } catch (e) { }
    }
    try { window.dispatchEvent(new Event('authChanged')); } catch (e) { }
};

var ToastNotifier = window.ToastNotifier || class ToastNotifier {
    constructor() {
        this.container = null;
        this.lastToastMessage = null;
        this.lastToastTime = 0;
    }

    getContainer() {
        if (!this.container && typeof document !== 'undefined') {
            this.container = document.querySelector('.cab-toast-container');
            if (!this.container && document.body) {
                this.container = document.createElement('div');
                this.container.className = 'cab-toast-container';
                document.body.appendChild(this.container);
            }
        }
        return this.container;
    }

    show(message, type = 'info') {
        const now = Date.now();
        if (this.lastToastMessage === message && (now - this.lastToastTime < 2000)) {
            return;
        }
        this.lastToastMessage = message;
        this.lastToastTime = now;

        const container = this.getContainer();
        if (!container) return;

        const iconClass = type === 'success' ? 'fas fa-check-circle' :
            type === 'error' ? 'fas fa-times-circle' :
                type === 'warning' ? 'fas fa-exclamation-triangle' :
                    'fas fa-info-circle';

        const toast = document.createElement('div');
        toast.className = `cab-toast cab-toast-${type}`;
        toast.innerHTML = `
            <div class="cab-toast-icon"><i class="${iconClass}"></i></div>
            <div class="cab-toast-content"></div>
        `;
        toast.querySelector('.cab-toast-content').textContent = message;
        this.container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }
}

if (!window.toast) {
    window.toast = new ToastNotifier();
}

function handleGenericApiError(status) {
    if (status === 400) window.toast?.show('Məlumatlar yanlışdır.', 'error');
    else if (status === 401) window.toast?.show('İcazə yoxdur. Zəhmət olmasa daxil olun.', 'error');
    else if (status === 403) window.toast?.show('Bu əməliyyat üçün hüququnuz yoxdur.', 'error');
    else if (status === 404) window.toast?.show('Məlumat tapılmadı.', 'error');
    else if (status === 409) window.toast?.show('Konflikt baş verdi. Belə məlumat artıq mövcuddur.', 'error');
    else if (status === 413) window.toast?.show('Sorğu ölçüsü çox böyükdür.', 'error');
    else if (status === 429) window.toast?.show('Çox sayda sorğu göndərdiniz. Bir az sonra cəhd edin.', 'error');
    else window.toast?.show('Sistem xətası baş verdi.', 'error');
}

(function installSecureApiFetch() {
    if (window.__mobileAzSecureFetchInstalled) return;
    window.__mobileAzSecureFetchInstalled = true;

    const originalFetch = window.fetch.bind(window);
    const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
    let csrfTokenPromise = null;

    function isApiRequest(input) {
        const url = typeof input === 'string' ? input : input?.url;
        return Boolean(url && window.API_URL && url.startsWith(window.API_URL));
    }

    function getMethod(input, init = {}) {
        return String(init.method || (typeof input !== 'string' ? input?.method : '') || 'GET').toUpperCase();
    }

    async function getCsrfToken() {
        if (window.CSRF_TOKEN) return window.CSRF_TOKEN;
        const stored = localStorage.getItem('csrfToken') || sessionStorage.getItem('csrfToken');
        if (stored) {
            window.CSRF_TOKEN = stored;
            return stored;
        }

        if (!csrfTokenPromise) {
            csrfTokenPromise = originalFetch(`${window.API_URL}/auth/csrf-token`, {
                method: 'GET',
                credentials: 'include'
            })
                .then(async (res) => {
                    if (!res.ok) throw new Error('CSRF token request failed');
                    const data = await res.json();
                    const token = data.csrfToken || data.token;
                    const signed = data.signedToken;
                    if (token) {
                        window.CSRF_TOKEN = token;
                        localStorage.setItem('csrfToken', token);
                        sessionStorage.setItem('csrfToken', token);
                    }
                    if (signed) {
                        window.CSRF_SIGNED_TOKEN = signed;
                        localStorage.setItem('csrfSignedToken', signed);
                        sessionStorage.setItem('csrfSignedToken', signed);
                    }
                    return token;
                })
                .catch((error) => {
                    csrfTokenPromise = null;
                    throw error;
                });
        }
        return csrfTokenPromise;
    }
    window.fetchCsrfToken = getCsrfToken;

    window.fetch = async function secureFetch(input, init = {}) {
        if (!isApiRequest(input)) {
            return originalFetch(input, init);
        }

        const method = getMethod(input, init);
        const nextInit = {
            ...init,
            credentials: init.credentials || 'include'
        };

        if (unsafeMethods.has(method) && !String(input?.url || input).includes('/auth/csrf-token')) {
            const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined) || {});
            try {
                const token = await getCsrfToken();
                if (token && !headers.has('X-CSRF-Token')) {
                    headers.set('X-CSRF-Token', token);
                }
                const signed = window.CSRF_SIGNED_TOKEN || localStorage.getItem('csrfSignedToken') || sessionStorage.getItem('csrfSignedToken');
                if (signed && !headers.has('X-CSRF-Signed-Token')) {
                    headers.set('X-CSRF-Signed-Token', signed);
                }
            } catch (csrfErr) {
                console.warn('Could not attach CSRF token:', csrfErr);
            }
            nextInit.headers = headers;
        }

        return originalFetch(input, nextInit).then(async (res) => {
            if (!res.ok && !init.silent) {
                // Prevent duplicate or unwanted toasts - caller handles /auth/login, /boost, background polls and refresh
                const reqUrl = String(input?.url || input || '');
                const isLoginRequest = reqUrl.includes('/auth/login');
                const isBoostRequest = reqUrl.includes('/boost');
                const isNotifUnread = reqUrl.includes('/notifications/unread-count');
                const isRefreshCall = reqUrl.includes('/auth/refresh');
                const isAdsCall = reqUrl.includes('/ads');

                if ((res.status === 401 || res.status === 403) && !isLoginRequest && !isBoostRequest && !isNotifUnread && !isRefreshCall && !isAdsCall) {
                    try {
                        const clone = res.clone();
                        const data = await clone.json();
                        if (data.message) {
                            window.toast?.show(data.message, 'error');
                        } else {
                            handleGenericApiError(res.status);
                        }
                    } catch (e) {
                        handleGenericApiError(res.status);
                    }
                }
            }
            return res;
        }).catch(err => {
            console.error('API Fetch Network Error:', err);
            const reqUrl = String(input?.url || input || '');
            const isBackgroundCall = reqUrl.includes('/notifications') || 
                                     reqUrl.includes('/health') || 
                                     reqUrl.includes('/auth/csrf-token') || 
                                     reqUrl.includes('/ads/favorites') ||
                                     reqUrl.includes('/auth/refresh');
            if (!init.silent && !isBackgroundCall && err?.name !== 'AbortError') {
                window.toast?.show('Şəbəkə xətası baş verdi. İnternet bağlantınızı yoxlayın.', 'error');
            }
            throw err;
        });
    };
    window.secureFetch = window.fetch;
})();

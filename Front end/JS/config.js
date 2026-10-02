/**
 * Mobil.az — Centralized API Configuration
 * 
 * This file sets the global API base URL used by all frontend scripts.
 * Update this value when deploying to staging or production.
 */
const isLocal = ['localhost', '127.0.0.1', '', '0.0.0.0'].includes(window.location.hostname) ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    Boolean(window.location.port) ||
    window.location.protocol === 'file:';

window.API_URL = window.API_URL || (isLocal ? 'http://localhost:5000/api' : 'https://api.mobil.az/api');
window.API_BASE = window.API_URL;
window.API_BASE_URL = window.API_URL;
if (typeof globalThis !== 'undefined') {
    globalThis.API_URL = window.API_URL;
    globalThis.API_BASE = window.API_URL;
    globalThis.API_BASE_URL = window.API_URL;
}

if (isLocal && typeof window !== 'undefined' && typeof fetch === 'function') {
    const healthUrl = (window.API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '') + '/api/health';
    fetch(healthUrl, { method: 'GET' })
        .then(r => {
            if (!r.ok) console.warn('Backend health check returned status:', r.status);
        })
        .catch(err => {
            console.warn('Backend server is down or unreachable (http://localhost:5000). Run "node Backend/ensure_backend.js" to start it.', err);
        });
}


window.getToken = function() {
    const keys = ['token', 'accessToken', 'authToken', 'adminToken', 'jwt'];
    for (let k of keys) {
        let t = localStorage.getItem(k) || sessionStorage.getItem(k);
        if (!t) continue;
        t = t.trim().replace(/^["']+|["']+$/g, '');
        if (t.startsWith('{')) {
            try { const o = JSON.parse(t); t = o.token || o.accessToken || ''; } catch(e) {}
        }
        if (t && t.length > 30 && t !== 'null' && t !== 'undefined') return t;
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

window.persistAuthSession = function persistAuthSession(data, token) {
    const accessToken = token || data?.accessToken || data?.token || data?.authToken || '';
    const userPayload = data?.user || data || {};

    const tokenKeys = ['token', 'accessToken', 'authToken', 'adminToken', 'jwt'];
    tokenKeys.forEach(k => {
        try { localStorage.removeItem(k); } catch(e) {}
        try { sessionStorage.removeItem(k); } catch(e) {}
    });

    if (accessToken) {
        try { localStorage.setItem('token', accessToken); } catch(e) {}
        try { sessionStorage.setItem('token', accessToken); } catch(e) {}
    }

    const userStr = JSON.stringify(userPayload);
    const userKeys = ['user', 'mobilaz_current_user', 'mobilaz_user'];
    userKeys.forEach((key) => {
        try { localStorage.setItem(key, userStr); } catch (e) {}
        try { sessionStorage.setItem(key, userStr); } catch (e) {}
    });

    if (userPayload?.role) {
        try { localStorage.setItem('userRole', userPayload.role); } catch (e) {}
        try { sessionStorage.setItem('userRole', userPayload.role); } catch (e) {}
    }
    if (userPayload?.email) {
        try { localStorage.setItem('userEmail', userPayload.email); } catch (e) {}
        try { sessionStorage.setItem('userEmail', userPayload.email); } catch (e) {}
    }

    if (userPayload?.role === 'admin' && accessToken) {
        try { sessionStorage.setItem('adminToken', accessToken); } catch (e) {}
        try { localStorage.setItem('adminToken', accessToken); } catch (e) {}
        try { sessionStorage.setItem('adminUser', userStr); } catch (e) {}
        try { localStorage.setItem('adminUser', userStr); } catch (e) {}
    }

    if (typeof window.updateHeader === 'function') {
        try { window.updateHeader(); } catch (e) {}
    }
    if (typeof window.updateAuthUI === 'function') {
        try { window.updateAuthUI(); } catch (e) {}
    }
    try { window.dispatchEvent(new Event('authChanged')); } catch (e) {}
};

window.clearAuthSession = window.clearAuthSession || function clearAuthSession() {
    const keys = ['token', 'accessToken', 'authToken', 'adminToken', 'user', 'mobilaz_current_user', 'mobilaz_user', 'adminUser', 'userRole', 'userEmail'];
    keys.forEach((key) => {
        try { sessionStorage.removeItem(key); } catch (e) {}
        try { localStorage.removeItem(key); } catch (e) {}
    });
    if (typeof window.updateHeader === 'function') {
        try { window.updateHeader(); } catch (e) {}
    }
    if (typeof window.updateAuthUI === 'function') {
        try { window.updateAuthUI(); } catch (e) {}
    }
    try { window.dispatchEvent(new Event('authChanged')); } catch (e) {}
};

class ToastNotifier {
    constructor() {
        this.container = document.querySelector('.cab-toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'cab-toast-container';
            document.body.appendChild(this.container);
        }
        this.lastToastMessage = null;
        this.lastToastTime = 0;
    }

    show(message, type = 'info') {
        const now = Date.now();
        if (this.lastToastMessage === message && (now - this.lastToastTime < 2000)) {
            return;
        }
        this.lastToastMessage = message;
        this.lastToastTime = now;

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
                // Prevent duplicate toast - caller handles /auth/login and /boost errors
                const isLoginRequest = String(input?.url || input).includes('/auth/login');
                const isBoostRequest = String(input?.url || input).includes('/boost');
                if ((res.status === 401 || res.status === 403) && !isLoginRequest && !isBoostRequest) {
                    try {
                        const clone = res.clone();
                        const data = await clone.json();
                        if (data.message) {
                            window.toast?.show(data.message, 'error');
                        } else {
                            handleGenericApiError(res.status);
                        }
                    } catch(e) {
                        handleGenericApiError(res.status);
                    }
                }
            }
            return res;
        }).catch(err => {
            console.error('API Fetch Network Error:', err);
            if (!init.silent) {
                window.toast?.show('Şəbəkə xətası baş verdi. İnternet bağlantınızı yoxlayın.', 'error');
            }
            throw err;
        });
    };
    window.secureFetch = window.fetch;
})();

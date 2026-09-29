/**
 * Mobil.az — Centralized API Configuration
 * 
 * This file sets the global API base URL used by all frontend scripts.
 * Update this value when deploying to staging or production.
 */
window.API_URL = window.API_URL || (
    ['localhost', '127.0.0.1', ''].includes(window.location.hostname) ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname === '0.0.0.0'
        ? 'http://localhost:5000/api'
        : 'https://api.mobil.az/api'
);

// Backward compatibility - legacy code uses API_BASE or API_BASE_URL
window.API_BASE = window.API_URL;
window.API_BASE_URL = window.API_URL;
var API_URL = window.API_URL;
var API_BASE = window.API_URL;
var API_BASE_URL = window.API_URL;

if (typeof globalThis !== 'undefined') {
    globalThis.API_URL = window.API_URL;
    globalThis.API_BASE = window.API_URL;
    globalThis.API_BASE_URL = window.API_URL;
}

window.getAuthToken = window.getAuthToken || function getAuthToken() {
    return sessionStorage.getItem('token') || sessionStorage.getItem('adminToken') || '';
};

window.persistAuthSession = window.persistAuthSession || function persistAuthSession(data, token) {
    const accessToken = token || data?.accessToken || data?.token || '';
    if (accessToken) {
        sessionStorage.setItem('token', accessToken);
        localStorage.removeItem('token');
    }
    localStorage.setItem('user', JSON.stringify(data));
    localStorage.setItem('mobilaz_current_user', JSON.stringify(data));
    if (data?.role === 'admin' && accessToken) {
        sessionStorage.setItem('adminToken', accessToken);
        localStorage.removeItem('adminToken');
        localStorage.setItem('adminUser', JSON.stringify(data));
    }
};

window.clearAuthSession = window.clearAuthSession || function clearAuthSession() {
    ['token', 'adminToken'].forEach((key) => {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
    });
    ['user', 'mobilaz_current_user', 'adminUser'].forEach((key) => localStorage.removeItem(key));
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
        if (!csrfTokenPromise) {
            csrfTokenPromise = originalFetch(`${window.API_URL}/auth/csrf-token`, {
                method: 'GET',
                credentials: 'include'
            })
                .then(async (res) => {
                    if (!res.ok) throw new Error('CSRF token request failed');
                    const data = await res.json();
                    return data.csrfToken;
                })
                .catch((error) => {
                    csrfTokenPromise = null;
                    throw error;
                });
        }
        return csrfTokenPromise;
    }

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
            if (!headers.has('X-CSRF-Token')) {
                headers.set('X-CSRF-Token', await getCsrfToken());
            }
            nextInit.headers = headers;
        }

        return originalFetch(input, nextInit).then(async (res) => {
            if (!res.ok && !init.silent) {
                // FIX BUG #2: Prevent duplicate toast - global interceptor should NOT auto-show toast for validation errors
                // Local handlers (ad-details.js etc) already show toast. Global only for 401/403 auth expiry.
                if ((res.status === 401 || res.status === 403) && !String(input?.url || input).includes('/auth/login')) {
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
                // For other errors, let caller handle toast to avoid duplication
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
})();

// Auto-check backend availability on page load
async function ensureBackend() {
    try {
        const rootUrl = (window.API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
        await fetch(`${rootUrl}/`, { signal: AbortSignal.timeout(1500) });
    } catch (err) {
        console.warn('Backend down - istifadəçiyə bildiriş göstər:', err);
        if (window.toast) {
            window.toast.show('Backend qoşulur...', 'info');
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureBackend);
} else {
    ensureBackend();
}

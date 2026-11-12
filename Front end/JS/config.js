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
        // Production: frontend and backend are hosted on same origin, ALWAYS use HTTPS to prevent 301 redirect drops in fetch()
        var protocol = (window.location.protocol === 'http:' || !window.location.protocol) ? 'https:' : window.location.protocol;
        return protocol + '//' + (window.location.host || hostname) + '/api';
    }
    // Local development
    return 'http://localhost:5000/api';
}

var isLocal = (typeof window !== 'undefined' && ['localhost', '127.0.0.1', '::1', '[::1]', '', '0.0.0.0'].includes(window.location.hostname || ''));

// Automatically upgrade HTTP to HTTPS on production to prevent 301 CORS drop in fetch
if (typeof window !== 'undefined' && window.location && window.location.protocol === 'http:' && !isLocal && window.location.hostname) {
    try {
        window.location.replace('https://' + window.location.host + window.location.pathname + window.location.search + window.location.hash);
    } catch (_) {}
}

var resolvedApi = resolveDefaultApiUrl();
var backendHost = resolvedApi.replace(/\/api\/?$/, '');

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

/* ── Centralized Phone Configuration & Masking Engine ── */
var COUNTRY_PHONE_CONFIGS = {
    '+994': {
        name: 'Azərbaycan',
        code: '+994',
        digits: 9,
        placeholder: '(50) 000-00-00',
        allowedPrefixes: ['10', '50', '51', '55', '60', '70', '77', '99'],
        format: function(digits) {
            if (!digits) return '';
            var res = '(' + digits.slice(0, 2);
            if (digits.length < 2) return res;
            res += ') ';
            if (digits.length <= 5) return res + digits.slice(2);
            res += digits.slice(2, 5) + '-' + digits.slice(5, 7);
            if (digits.length <= 7) return res;
            return res + '-' + digits.slice(7, 9);
        },
        clean: function(raw) {
            var digits = String(raw || '').replace(/\D/g, '');
            if (digits.startsWith('994') && digits.length > 9) digits = digits.slice(3);
            if (digits.startsWith('0')) digits = digits.slice(1);
            return digits.slice(0, 9);
        }
    },
    '+90': {
        name: 'Türkiyə',
        code: '+90',
        digits: 10,
        placeholder: '(500) 000-00-00',
        format: function(digits) {
            if (!digits) return '';
            var res = '(' + digits.slice(0, 3);
            if (digits.length < 3) return res;
            res += ') ';
            if (digits.length <= 6) return res + digits.slice(3);
            res += digits.slice(3, 6) + '-' + digits.slice(6, 8);
            if (digits.length <= 8) return res;
            return res + '-' + digits.slice(8, 10);
        },
        clean: function(raw) {
            var digits = String(raw || '').replace(/\D/g, '');
            if (digits.startsWith('90') && digits.length > 10) digits = digits.slice(2);
            if (digits.startsWith('0')) digits = digits.slice(1);
            return digits.slice(0, 10);
        }
    },
    '+7': {
        name: 'Rusiya / Qazaxıstan',
        code: '+7',
        digits: 10,
        placeholder: '(900) 000-00-00',
        format: function(digits) {
            if (!digits) return '';
            var res = '(' + digits.slice(0, 3);
            if (digits.length < 3) return res;
            res += ') ';
            if (digits.length <= 6) return res + digits.slice(3);
            res += digits.slice(3, 6) + '-' + digits.slice(6, 8);
            if (digits.length <= 8) return res;
            return res + '-' + digits.slice(8, 10);
        },
        clean: function(raw) {
            var digits = String(raw || '').replace(/\D/g, '');
            if ((digits.startsWith('7') || digits.startsWith('8')) && digits.length > 10) digits = digits.slice(1);
            return digits.slice(0, 10);
        }
    },
    '+1': {
        name: 'ABŞ / Kanada',
        code: '+1',
        digits: 10,
        placeholder: '(555) 000-0000',
        format: function(digits) {
            if (!digits) return '';
            var res = '(' + digits.slice(0, 3);
            if (digits.length < 3) return res;
            res += ') ';
            if (digits.length <= 6) return res + digits.slice(3);
            return res + digits.slice(3, 6) + '-' + digits.slice(6, 10);
        },
        clean: function(raw) {
            var digits = String(raw || '').replace(/\D/g, '');
            if (digits.startsWith('1') && digits.length > 10) digits = digits.slice(1);
            return digits.slice(0, 10);
        }
    },
    '+44': {
        name: 'Böyük Britaniya',
        code: '+44',
        digits: 10,
        placeholder: '7911 123456',
        format: function(digits) {
            if (!digits) return '';
            if (digits.length <= 4) return digits;
            return digits.slice(0, 4) + ' ' + digits.slice(4, 10);
        },
        clean: function(raw) {
            var digits = String(raw || '').replace(/\D/g, '');
            if (digits.startsWith('44') && digits.length > 10) digits = digits.slice(2);
            if (digits.startsWith('0')) digits = digits.slice(1);
            return digits.slice(0, 10);
        }
    },
    '+49': {
        name: 'Almaniya',
        code: '+49',
        digits: 11,
        placeholder: '151 12345678',
        format: function(digits) {
            if (!digits) return '';
            if (digits.length <= 3) return digits;
            return digits.slice(0, 3) + ' ' + digits.slice(3, 11);
        },
        clean: function(raw) {
            var digits = String(raw || '').replace(/\D/g, '');
            if (digits.startsWith('49') && digits.length > 11) digits = digits.slice(2);
            if (digits.startsWith('0')) digits = digits.slice(1);
            return digits.slice(0, 11);
        }
    },
    '+995': {
        name: 'Gürcüstan',
        code: '+995',
        digits: 9,
        placeholder: '599 12-34-56',
        format: function(digits) {
            if (!digits) return '';
            var res = digits.slice(0, 3);
            if (digits.length <= 3) return res;
            res += ' ' + digits.slice(3, 5);
            if (digits.length <= 5) return res;
            res += '-' + digits.slice(5, 7);
            if (digits.length <= 7) return res;
            return res + '-' + digits.slice(7, 9);
        },
        clean: function(raw) {
            var digits = String(raw || '').replace(/\D/g, '');
            if (digits.startsWith('995') && digits.length > 9) digits = digits.slice(3);
            return digits.slice(0, 9);
        }
    },
    '+971': {
        name: 'BƏƏ',
        code: '+971',
        digits: 9,
        placeholder: '50 123-4567',
        format: function(digits) {
            if (!digits) return '';
            var res = digits.slice(0, 2);
            if (digits.length <= 2) return res;
            res += ' ' + digits.slice(2, 5);
            if (digits.length <= 5) return res;
            return res + '-' + digits.slice(5, 9);
        },
        clean: function(raw) {
            var digits = String(raw || '').replace(/\D/g, '');
            if (digits.startsWith('971') && digits.length > 9) digits = digits.slice(3);
            return digits.slice(0, 9);
        }
    },
    'other': {
        name: 'Digər ölkə',
        code: '+',
        digits: 15,
        placeholder: '7-15 rəqəmli beynəlxalq nömrə',
        format: function(digits) { return digits.slice(0, 15); },
        clean: function(raw) { return String(raw || '').replace(/\D/g, '').slice(0, 15); }
    }
};

function setupPhoneInputMask(inputId, prefixId) {
    var input = typeof inputId === 'string' ? document.getElementById(inputId) : inputId;
    var prefixEl = typeof prefixId === 'string' ? document.getElementById(prefixId) : prefixId;
    if (!input) return;

    function applyFormat() {
        var prefix = prefixEl ? prefixEl.value : '+994';
        var cfg = COUNTRY_PHONE_CONFIGS[prefix] || COUNTRY_PHONE_CONFIGS['+994'];
        input.placeholder = cfg.placeholder;

        var rawVal = input.value;
        var cleaned = cfg.clean(rawVal);
        var formatted = cfg.format(cleaned);
        input.value = formatted;

        if (prefix === '+994') {
            input.maxLength = 15;
        } else if (prefix === 'other') {
            input.maxLength = 18;
        } else {
            input.maxLength = 16;
        }
    }

    input.addEventListener('input', applyFormat);
    input.addEventListener('paste', function() { setTimeout(applyFormat, 0); });
    if (prefixEl) {
        prefixEl.addEventListener('change', function() {
            applyFormat();
            input.focus();
        });
    }

    applyFormat();
}

function validatePhoneNumber(inputId, prefixId) {
    var input = typeof inputId === 'string' ? document.getElementById(inputId) : inputId;
    var prefixEl = typeof prefixId === 'string' ? document.getElementById(prefixId) : prefixId;
    if (!input) return { valid: false, message: 'Telefon sahəsi tapılmadı' };
    var prefix = prefixEl ? prefixEl.value : '+994';
    var cfg = COUNTRY_PHONE_CONFIGS[prefix] || COUNTRY_PHONE_CONFIGS['+994'];
    var digits = cfg.clean(input.value);

    if (!digits) {
        return { valid: false, message: 'Telefon nömrəsini daxil edin' };
    }

    if (prefix === '+994') {
        if (digits.length !== 9) {
            return { valid: false, message: 'Azərbaycan nömrəsi 9 rəqəmdən ibarət olmalıdır. Nümunə: (50) 123-45-67' };
        }
        var op = digits.slice(0, 2);
        if (!cfg.allowedPrefixes.includes(op)) {
            return { valid: false, message: 'Mobil operator prefiksi dəstəklənmir (10, 50, 51, 55, 60, 70, 77, 99)' };
        }
        return { valid: true, fullPhone: '+994' + digits, digits: digits, prefix: prefix };
    }

    if (prefix === 'other') {
        if (digits.length < 7 || digits.length > 15) {
            return { valid: false, message: 'Beynəlxalq telefon nömrəsi 7 ilə 15 rəqəm arasında olmalıdır' };
        }
        return { valid: true, fullPhone: '+' + digits, digits: digits, prefix: prefix };
    }

    if (digits.length !== cfg.digits) {
        return { valid: false, message: cfg.name + ' nömrəsi tam ' + cfg.digits + ' rəqəmdən ibarət olmalıdır' };
    }

    return { valid: true, fullPhone: prefix + digits, digits: digits, prefix: prefix };
}

function setPhoneValue(inputId, prefixId, fullPhone) {
    var input = typeof inputId === 'string' ? document.getElementById(inputId) : inputId;
    var prefixEl = typeof prefixId === 'string' ? document.getElementById(prefixId) : prefixId;
    if (!input || !fullPhone) return;

    var raw = String(fullPhone).trim();
    var matchedPrefix = '+994';
    var prefixes = ['+994', '+90', '+7', '+1', '+44', '+49', '+995', '+971'];
    for (var i = 0; i < prefixes.length; i++) {
        var p = prefixes[i];
        if (raw.startsWith(p)) {
            matchedPrefix = p;
            raw = raw.substring(p.length);
            break;
        }
    }
    if (prefixEl) {
        prefixEl.value = matchedPrefix;
    }
    var cfg = COUNTRY_PHONE_CONFIGS[matchedPrefix] || COUNTRY_PHONE_CONFIGS['+994'];
    var cleaned = cfg.clean(raw);
    input.value = cfg.format(cleaned);
}

if (typeof window !== 'undefined') {
    window.COUNTRY_PHONE_CONFIGS = COUNTRY_PHONE_CONFIGS;
    window.setupPhoneInputMask = setupPhoneInputMask;
    window.validatePhoneNumber = validatePhoneNumber;
    window.setPhoneValue = setPhoneValue;
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
    const keys = ['token', 'accessToken', 'authToken', 'adminToken', 'user', 'mobilaz_current_user', 'mobilaz_user', 'adminUser', 'userRole', 'userEmail', 'savedEmail'];
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
                                     reqUrl.includes('/favorites') ||
                                     reqUrl.includes('/categories') ||
                                     reqUrl.includes('/auth/refresh');
                if (!init.silent && !isBackgroundCall && err?.name !== 'AbortError') {
                window.toast?.show('Şəbəkə xətası baş verdi. İnternet bağlantınızı yoxlayın.', 'error');
            }
            throw err;
        });
    };
    window.secureFetch = window.fetch;
})();

// === MOBILAZ SHARED I18N HELPER ===
(function() {
    function getLang() {
        try {
            var raw = (localStorage.getItem('lang') || 'AZ').trim().toUpperCase();
            if (raw === 'RU' || raw === 'РУС') return 'RUS';
            if (raw === 'EN') return 'ENG';
            if (raw === 'RUS' || raw === 'ENG' || raw === 'AZ') return raw;
        } catch (e) {}
        return 'AZ';
    }

    var CITIES = {
        'bakı': { AZ: 'Bakı', RUS: 'Баку', ENG: 'Baku' },
        'baki': { AZ: 'Bakı', RUS: 'Баку', ENG: 'Baku' },
        'baku': { AZ: 'Bakı', RUS: 'Баку', ENG: 'Baku' },
        'sumqayıt': { AZ: 'Sumqayıt', RUS: 'Сумгайыт', ENG: 'Sumgayit' },
        'sumqayit': { AZ: 'Sumqayıt', RUS: 'Сумгайыт', ENG: 'Sumgayit' },
        'gəncə': { AZ: 'Gəncə', RUS: 'Гянджа', ENG: 'Ganja' },
        'gence': { AZ: 'Gəncə', RUS: 'Гянджа', ENG: 'Ganja' },
        'ganja': { AZ: 'Gəncə', RUS: 'Гянджа', ENG: 'Ganja' },
        'abşeron': { AZ: 'Abşeron', RUS: 'Апшерон', ENG: 'Absheron' },
        'abşəron': { AZ: 'Abşeron', RUS: 'Апшерон', ENG: 'Absheron' },
        'abseron': { AZ: 'Abşeron', RUS: 'Апшерон', ENG: 'Absheron' },
        'absheron': { AZ: 'Abşeron', RUS: 'Апшерон', ENG: 'Absheron' },
        'ağcabədi': { AZ: 'Ağcabədi', RUS: 'Агджабеди', ENG: 'Aghjabadi' },
        'agcabedi': { AZ: 'Ağcabədi', RUS: 'Агджабеди', ENG: 'Aghjabadi' },
        'ağdam': { AZ: 'Ağdam', RUS: 'Агдам', ENG: 'Aghdam' },
        'agdam': { AZ: 'Ağdam', RUS: 'Агдам', ENG: 'Aghdam' },
        'ağdaş': { AZ: 'Ağdaş', RUS: 'Агдаш', ENG: 'Aghdash' },
        'agdash': { AZ: 'Ağdaş', RUS: 'Агдаш', ENG: 'Aghdash' },
        'ağstafa': { AZ: 'Ağstafa', RUS: 'Агстафа', ENG: 'Aghstafa' },
        'agstafa': { AZ: 'Ağstafa', RUS: 'Агстафа', ENG: 'Aghstafa' },
        'ağsu': { AZ: 'Ağsu', RUS: 'Агсу', ENG: 'Aghsu' },
        'agsu': { AZ: 'Ağsu', RUS: 'Агсу', ENG: 'Aghsu' },
        'astara': { AZ: 'Astara', RUS: 'Астара', ENG: 'Astara' },
        'balakən': { AZ: 'Balakən', RUS: 'Балакен', ENG: 'Balakan' },
        'balakan': { AZ: 'Balakən', RUS: 'Балакен', ENG: 'Balakan' },
        'beyləqan': { AZ: 'Beyləqan', RUS: 'Бейляган', ENG: 'Beylagan' },
        'beylagan': { AZ: 'Beyləqan', RUS: 'Бейляган', ENG: 'Beylagan' },
        'bərdə': { AZ: 'Bərdə', RUS: 'Барда', ENG: 'Barda' },
        'barda': { AZ: 'Bərdə', RUS: 'Барда', ENG: 'Barda' },
        'biləsuvar': { AZ: 'Biləsuvar', RUS: 'Билясувар', ENG: 'Bilasuvar' },
        'bilasuvar': { AZ: 'Biləsuvar', RUS: 'Билясувар', ENG: 'Bilasuvar' },
        'daşkəsən': { AZ: 'Daşkəsən', RUS: 'Дашкесан', ENG: 'Dashkasan' },
        'dashkasan': { AZ: 'Daşkəsən', RUS: 'Дашкесан', ENG: 'Dashkasan' },
        'füzuli': { AZ: 'Füzuli', RUS: 'Физули', ENG: 'Fuzuli' },
        'fuzuli': { AZ: 'Füzuli', RUS: 'Физули', ENG: 'Fuzuli' },
        'gədəbəy': { AZ: 'Gədəbəy', RUS: 'Гедабек', ENG: 'Gadabay' },
        'gadabay': { AZ: 'Gədəbəy', RUS: 'Гедабек', ENG: 'Gadabay' },
        'goranboy': { AZ: 'Goranboy', RUS: 'Горанбой', ENG: 'Goranboy' },
        'göyçay': { AZ: 'Göyçay', RUS: 'Гейчай', ENG: 'Goychay' },
        'goychay': { AZ: 'Göyçay', RUS: 'Гейчай', ENG: 'Goychay' },
        'göygöl': { AZ: 'Göygöl', RUS: 'Гейгёль', ENG: 'Goygol' },
        'goygol': { AZ: 'Göygöl', RUS: 'Гейгёль', ENG: 'Goygol' },
        'hacıqabul': { AZ: 'Hacıqabul', RUS: 'Хаджигабул', ENG: 'Hajigabul' },
        'hajigabul': { AZ: 'Hacıqabul', RUS: 'Хаджигабул', ENG: 'Hajigabul' },
        'imişli': { AZ: 'İmişli', RUS: 'Имишли', ENG: 'Imishli' },
        'imishli': { AZ: 'İmişli', RUS: 'Имишли', ENG: 'Imishli' },
        'ismayıllı': { AZ: 'İsmayıllı', RUS: 'Исмаиллы', ENG: 'Ismayilli' },
        'ismayilli': { AZ: 'İsmayıllı', RUS: 'Исмаиллы', ENG: 'Ismayilli' },
        'cəbrayıl': { AZ: 'Cəbrayıl', RUS: 'Джабраил', ENG: 'Jabrayil' },
        'jabrayil': { AZ: 'Cəbrayıl', RUS: 'Джабраил', ENG: 'Jabrayil' },
        'cəlilabad': { AZ: 'Cəlilabad', RUS: 'Джалилабад', ENG: 'Jalilabad' },
        'jalilabad': { AZ: 'Cəlilabad', RUS: 'Джалилабад', ENG: 'Jalilabad' },
        'kəlbəcər': { AZ: 'Kəlbəcər', RUS: 'Кельбаджар', ENG: 'Kalbajar' },
        'kalbajar': { AZ: 'Kəlbəcər', RUS: 'Кельбаджар', ENG: 'Kalbajar' },
        'kürdəmir': { AZ: 'Kürdəmir', RUS: 'Кюрдамир', ENG: 'Kurdamir' },
        'kurdamir': { AZ: 'Kürdəmir', RUS: 'Кюрдамир', ENG: 'Kurdamir' },
        'laçın': { AZ: 'Laçın', RUS: 'Лачин', ENG: 'Lachin' },
        'lachin': { AZ: 'Laçın', RUS: 'Лачин', ENG: 'Lachin' },
        'lənkəran': { AZ: 'Lənkəran', RUS: 'Ленкорань', ENG: 'Lankaran' },
        'lankaran': { AZ: 'Lənkəran', RUS: 'Ленкорань', ENG: 'Lankaran' },
        'lerik': { AZ: 'Lerik', RUS: 'Лерик', ENG: 'Lerik' },
        'masallı': { AZ: 'Masallı', RUS: 'Масаллы', ENG: 'Masalli' },
        'masalli': { AZ: 'Masallı', RUS: 'Масаллы', ENG: 'Masalli' },
        'mingəçevir': { AZ: 'Mingəçevir', RUS: 'Мингячевир', ENG: 'Mingachevir' },
        'mingachevir': { AZ: 'Mingəçevir', RUS: 'Мингячевир', ENG: 'Mingachevir' },
        'naftalan': { AZ: 'Naftalan', RUS: 'Нафталан', ENG: 'Naftalan' },
        'naxçıvan': { AZ: 'Naxçıvan', RUS: 'Нахчыван', ENG: 'Nakhchivan' },
        'nakhchivan': { AZ: 'Naxçıvan', RUS: 'Нахчыван', ENG: 'Nakhchivan' },
        'neftçala': { AZ: 'Neftçala', RUS: 'Нефтчала', ENG: 'Neftchala' },
        'neftchala': { AZ: 'Neftçala', RUS: 'Нефтчала', ENG: 'Neftchala' },
        'oğuz': { AZ: 'Oğuz', RUS: 'Огуз', ENG: 'Oguz' },
        'oguz': { AZ: 'Oğuz', RUS: 'Огуз', ENG: 'Oguz' },
        'qəbələ': { AZ: 'Qəbələ', RUS: 'Габала', ENG: 'Qabala' },
        'qabala': { AZ: 'Qəbələ', RUS: 'Габала', ENG: 'Qabala' },
        'qax': { AZ: 'Qax', RUS: 'Гах', ENG: 'Qakh' },
        'qakh': { AZ: 'Qax', RUS: 'Гах', ENG: 'Qakh' },
        'qazax': { AZ: 'Qazax', RUS: 'Казах', ENG: 'Qazakh' },
        'qazakh': { AZ: 'Qazax', RUS: 'Казах', ENG: 'Qazakh' },
        'quba': { AZ: 'Quba', RUS: 'Губа', ENG: 'Quba' },
        'qubadlı': { AZ: 'Qubadlı', RUS: 'Губадлы', ENG: 'Qubadli' },
        'qubadli': { AZ: 'Qubadlı', RUS: 'Губадлы', ENG: 'Qubadli' },
        'qusar': { AZ: 'Qusar', RUS: 'Гусар', ENG: 'Qusar' },
        'saatlı': { AZ: 'Saatlı', RUS: 'Саатлы', ENG: 'Saatli' },
        'saatli': { AZ: 'Saatlı', RUS: 'Саатлы', ENG: 'Saatli' },
        'sabirabad': { AZ: 'Sabirabad', RUS: 'Сабирабад', ENG: 'Sabirabad' },
        'salyan': { AZ: 'Salyan', RUS: 'Сальян', ENG: 'Salyan' },
        'şabran': { AZ: 'Şabran', RUS: 'Шабран', ENG: 'Shabran' },
        'shabran': { AZ: 'Şabran', RUS: 'Шабран', ENG: 'Shabran' },
        'şəki': { AZ: 'Şəki', RUS: 'Шеки', ENG: 'Shaki' },
        'shaki': { AZ: 'Şəki', RUS: 'Шеки', ENG: 'Shaki' },
        'şamaxı': { AZ: 'Şamaxı', RUS: 'Шемаха', ENG: 'Shamakhi' },
        'shamakhi': { AZ: 'Şamaxı', RUS: 'Шемаха', ENG: 'Shamakhi' },
        'şirvan': { AZ: 'Şirvan', RUS: 'Ширван', ENG: 'Shirvan' },
        'shirvan': { AZ: 'Şirvan', RUS: 'Ширван', ENG: 'Shirvan' },
        'şuşa': { AZ: 'Şuşa', RUS: 'Шуша', ENG: 'Shusha' },
        'shusha': { AZ: 'Şuşa', RUS: 'Шуша', ENG: 'Shusha' },
        'siyəzən': { AZ: 'Siyəzən', RUS: 'Сиязань', ENG: 'Siazan' },
        'siazan': { AZ: 'Siyəzən', RUS: 'Сиязань', ENG: 'Siazan' },
        'tərtər': { AZ: 'Tərtər', RUS: 'Тертер', ENG: 'Tartar' },
        'tartar': { AZ: 'Tərtər', RUS: 'Тертер', ENG: 'Tartar' },
        'tovuz': { AZ: 'Tovuz', RUS: 'Товуз', ENG: 'Tovuz' },
        'ucar': { AZ: 'Ucar', RUS: 'Уджар', ENG: 'Ujar' },
        'ujar': { AZ: 'Ucar', RUS: 'Уджар', ENG: 'Ujar' },
        'xırdalan': { AZ: 'Xırdalan', RUS: 'Хырдалан', ENG: 'Khirdalan' },
        'xırdalan (abşeron)': { AZ: 'Xırdalan', RUS: 'Хырдалан', ENG: 'Khirdalan' },
        'xudat': { AZ: 'Xudat', RUS: 'Худат', ENG: 'Khudat' },
        'xaçmaz': { AZ: 'Xaçmaz', RUS: 'Хачмаз', ENG: 'Khachmaz' },
        'khachmaz': { AZ: 'Xaçmaz', RUS: 'Хачмаз', ENG: 'Khachmaz' },
        'yardımlı': { AZ: 'Yardımlı', RUS: 'Ярдымлы', ENG: 'Yardimli' },
        'yardimli': { AZ: 'Yardımlı', RUS: 'Ярдымлы', ENG: 'Yardimli' },
        'yevlax': { AZ: 'Yevlax', RUS: 'Евлах', ENG: 'Yevlakh' },
        'yevlakh': { AZ: 'Yevlax', RUS: 'Евлах', ENG: 'Yevlakh' },
        'zəngilan': { AZ: 'Zəngilan', RUS: 'Зангилан', ENG: 'Zangilan' },
        'zangilan': { AZ: 'Zəngilan', RUS: 'Зангилан', ENG: 'Zangilan' },
        'zaqatala': { AZ: 'Zaqatala', RUS: 'Закаталы', ENG: 'Zaqatala' },
        'zərdab': { AZ: 'Zərdab', RUS: 'Зардаб', ENG: 'Zardab' },
        'zardab': { AZ: 'Zərdab', RUS: 'Зардаб', ENG: 'Zardab' },
        // Baku districts (rayons)
        'nərimanov': { AZ: 'Nərimanov', RUS: 'Наримановский р-н', ENG: 'Narimanov' },
        'nəsimi': { AZ: 'Nəsimi', RUS: 'Насиминский р-н', ENG: 'Nasimi' },
        'yasamal': { AZ: 'Yasamal', RUS: 'Ясамальский р-н', ENG: 'Yasamal' },
        'səbail': { AZ: 'Səbail', RUS: 'Сабаильский р-н', ENG: 'Sabail' },
        'xətai': { AZ: 'Xətai', RUS: 'Хатаинский р-н', ENG: 'Khatai' },
        'binəqədi': { AZ: 'Binəqədi', RUS: 'Бинагадинский р-н', ENG: 'Binagadi' },
        'nizami': { AZ: 'Nizami', RUS: 'Низаминский р-н', ENG: 'Nizami' },
        'sabunçu': { AZ: 'Sabunçu', RUS: 'Сабунчинский р-н', ENG: 'Sabunchu' },
        'suraxanı': { AZ: 'Suraxanı', RUS: 'Сураханский р-н', ENG: 'Surakhani' },
        'xəzər': { AZ: 'Xəzər', RUS: 'Хазарский р-н', ENG: 'Khazar' },
        'qaradağ': { AZ: 'Qaradağ', RUS: 'Гарадагский р-н', ENG: 'Garadagh' },
        'pirallahı': { AZ: 'Pirallahı', RUS: 'Пираллахинский р-н', ENG: 'Pirallahi' },
        'nərimanov r.': { AZ: 'Nərimanov r.', RUS: 'Наримановский р-н', ENG: 'Narimanov' },
        'yasamal r.': { AZ: 'Yasamal r.', RUS: 'Ясамальский р-н', ENG: 'Yasamal' },
        'bakı şəhəri': { AZ: 'Bakı şəhəri', RUS: 'г. Баку', ENG: 'Baku city' },
        'digər': { AZ: 'Digər', RUS: 'Другой', ENG: 'Other' },
        'other': { AZ: 'Digər', RUS: 'Другой', ENG: 'Other' }
    };

    var CATEGORIES = {
        'telefon': { AZ: 'Telefon', RUS: 'Телефон', ENG: 'Phone' },
        'phone': { AZ: 'Telefon', RUS: 'Телефон', ENG: 'Phone' },
        'telefonlar': { AZ: 'Telefonlar', RUS: 'Телефоны', ENG: 'Phones' },
        'planşet': { AZ: 'Planşet', RUS: 'Планшет', ENG: 'Tablet' },
        'planset': { AZ: 'Planşet', RUS: 'Планшет', ENG: 'Tablet' },
        'tablet': { AZ: 'Planşet', RUS: 'Планшет', ENG: 'Tablet' },
        'aksesuar': { AZ: 'Aksesuar', RUS: 'Аксессуар', ENG: 'Accessory' },
        'aksessuar': { AZ: 'Aksesuar', RUS: 'Аксессуар', ENG: 'Accessory' },
        'accessory': { AZ: 'Aksesuar', RUS: 'Аксессуар', ENG: 'Accessory' },
        'qulaqlıq': { AZ: 'Qulaqlıq', RUS: 'Наушники', ENG: 'Headphones' },
        'qulaqliq': { AZ: 'Qulaqlıq', RUS: 'Наушники', ENG: 'Headphones' },
        'headphone': { AZ: 'Qulaqlıq', RUS: 'Наушники', ENG: 'Headphones' },
        'smart saat': { AZ: 'Smart Saat', RUS: 'Смарт-часы', ENG: 'Smartwatch' },
        'watch': { AZ: 'Smart Saat', RUS: 'Смарт-часы', ENG: 'Smartwatch' }
    };

    var CONDITIONS = {
        'yeni': { AZ: 'Yeni', RUS: 'Новый', ENG: 'New' },
        'new': { AZ: 'Yeni', RUS: 'Новый', ENG: 'New' },
        'işlənmiş': { AZ: 'İşlənmiş', RUS: 'Б/у', ENG: 'Used' },
        'islenmis': { AZ: 'İşlənmiş', RUS: 'Б/у', ENG: 'Used' },
        'used': { AZ: 'İşlənmiş', RUS: 'Б/у', ENG: 'Used' },
        'təmir olunub': { AZ: 'Təmir olunub', RUS: 'После ремонта', ENG: 'Refurbished' },
        'temir-olunub': { AZ: 'Təmir olunub', RUS: 'После ремонта', ENG: 'Refurbished' },
        'refurbished': { AZ: 'Təmir olunub', RUS: 'После ремонта', ENG: 'Refurbished' }
    };

    var COLORS = {
        'black': { AZ: 'Qara', RUS: 'Чёрный', ENG: 'Black' },
        'qara': { AZ: 'Qara', RUS: 'Чёрный', ENG: 'Black' },
        'silky black': { AZ: 'Qara (Silky Black)', RUS: 'Чёрный (Silky Black)', ENG: 'Silky Black' },
        'white': { AZ: 'Ağ', RUS: 'Белый', ENG: 'White' },
        'ağ': { AZ: 'Ağ', RUS: 'Белый', ENG: 'White' },
        'ag': { AZ: 'Ağ', RUS: 'Белый', ENG: 'White' },
        'gold': { AZ: 'Qızılı', RUS: 'Золотой', ENG: 'Gold' },
        'qızılı': { AZ: 'Qızılı', RUS: 'Золотой', ENG: 'Gold' },
        'qizili': { AZ: 'Qızılı', RUS: 'Золотой', ENG: 'Gold' },
        'silver': { AZ: 'Gümüşü', RUS: 'Серебристый', ENG: 'Silver' },
        'gümüşü': { AZ: 'Gümüşü', RUS: 'Серебристый', ENG: 'Silver' },
        'gumusu': { AZ: 'Gümüşü', RUS: 'Серебристый', ENG: 'Silver' },
        'grey': { AZ: 'Boz', RUS: 'Серый', ENG: 'Grey' },
        'gray': { AZ: 'Boz', RUS: 'Серый', ENG: 'Grey' },
        'boz': { AZ: 'Boz', RUS: 'Серый', ENG: 'Grey' },
        'graphite': { AZ: 'Qrafit', RUS: 'Графитовый', ENG: 'Graphite' },
        'qrafit': { AZ: 'Qrafit', RUS: 'Графитовый', ENG: 'Graphite' },
        'blue': { AZ: 'Mavi', RUS: 'Голубой', ENG: 'Blue' },
        'mavi': { AZ: 'Mavi', RUS: 'Голубой', ENG: 'Blue' },
        'darkblue': { AZ: 'Göy (Tünd Mavi)', RUS: 'Тёмно-синий', ENG: 'Dark Blue' },
        'göy': { AZ: 'Göy (Tünd Mavi)', RUS: 'Тёмно-синий', ENG: 'Dark Blue' },
        'goy': { AZ: 'Göy (Tünd Mavi)', RUS: 'Тёмно-синий', ENG: 'Dark Blue' },
        'green': { AZ: 'Yaşıl', RUS: 'Зелёный', ENG: 'Green' },
        'yaşıl': { AZ: 'Yaşıl', RUS: 'Зелёный', ENG: 'Green' },
        'yasil': { AZ: 'Yaşıl', RUS: 'Зелёный', ENG: 'Green' },
        'emerald': { AZ: 'Zümrüd Yaşılı', RUS: 'Изумрудный', ENG: 'Emerald Green' },
        'zümrüd yaşılı': { AZ: 'Zümrüd Yaşılı', RUS: 'Изумрудный', ENG: 'Emerald Green' },
        'yellow': { AZ: 'Sarı', RUS: 'Жёлтый', ENG: 'Yellow' },
        'sarı': { AZ: 'Sarı', RUS: 'Жёлтый', ENG: 'Yellow' },
        'sari': { AZ: 'Sarı', RUS: 'Жёлтый', ENG: 'Yellow' },
        'red': { AZ: 'Qırmızı', RUS: 'Красный', ENG: 'Red' },
        'qırmızı': { AZ: 'Qırmızı', RUS: 'Красный', ENG: 'Red' },
        'qirmizi': { AZ: 'Qırmızı', RUS: 'Красный', ENG: 'Red' },
        'pink': { AZ: 'Çəhrayı', RUS: 'Розовый', ENG: 'Pink' },
        'çəhrayı': { AZ: 'Çəhrayı', RUS: 'Розовый', ENG: 'Pink' },
        'cehrayi': { AZ: 'Çəhrayı', RUS: 'Розовый', ENG: 'Pink' },
        'purple': { AZ: 'Bənövşəyi', RUS: 'Фиолетовый', ENG: 'Purple' },
        'bənövşəyi': { AZ: 'Bənövşəyi', RUS: 'Фиолетовый', ENG: 'Purple' },
        'benovseyi': { AZ: 'Bənövşəyi', RUS: 'Фиолетовый', ENG: 'Purple' },
        'cobalt violet': { AZ: 'Bənövşəyi (Cobalt Violet)', RUS: 'Фиолетовый (Cobalt Violet)', ENG: 'Cobalt Violet' },
        'deeppurple': { AZ: 'Dərin Bənövşəyi', RUS: 'Тёмно-фиолетовый', ENG: 'Deep Purple' },
        'dərin bənövşəyi': { AZ: 'Dərin Bənövşəyi', RUS: 'Тёмно-фиолетовый', ENG: 'Deep Purple' },
        'derin benovseyi': { AZ: 'Dərin Bənövşəyi', RUS: 'Тёмно-фиолетовый', ENG: 'Deep Purple' },
        'orange': { AZ: 'Narıncı', RUS: 'Оранжевый', ENG: 'Orange' },
        'narıncı': { AZ: 'Narıncı', RUS: 'Оранжевый', ENG: 'Orange' },
        'narinci': { AZ: 'Narıncı', RUS: 'Оранжевый', ENG: 'Orange' },
        'titanium-black': { AZ: 'Titan Qara', RUS: 'Чёрный титан', ENG: 'Black Titanium' },
        'titan qara': { AZ: 'Titan Qara', RUS: 'Чёрный титан', ENG: 'Black Titanium' },
        'titanium-natural': { AZ: 'Titan Təbii', RUS: 'Натуральный титан', ENG: 'Natural Titanium' },
        'titan təbii': { AZ: 'Titan Təbii', RUS: 'Натуральный титан', ENG: 'Natural Titanium' },
        'titan tebii': { AZ: 'Titan Təbii', RUS: 'Натуральный титан', ENG: 'Natural Titanium' },
        'titanium-white': { AZ: 'Titan Ağ', RUS: 'Белый титан', ENG: 'White Titanium' },
        'titan ağ': { AZ: 'Titan Ağ', RUS: 'Белый титан', ENG: 'White Titanium' },
        'titan ag': { AZ: 'Titan Ağ', RUS: 'Белый титан', ENG: 'White Titanium' },
        'titanium-blue': { AZ: 'Titan Göy', RUS: 'Синий титан', ENG: 'Blue Titanium' },
        'titan göy': { AZ: 'Titan Göy', RUS: 'Синий титан', ENG: 'Blue Titanium' },
        'titan mavi': { AZ: 'Titan Mavi', RUS: 'Синий титан', ENG: 'Blue Titanium' },
        'titanium-desert': { AZ: 'Titan Çöl', RUS: 'Пустынный титан', ENG: 'Desert Titanium' },
        'titan çöl': { AZ: 'Titan Çöl', RUS: 'Пустынный титан', ENG: 'Desert Titanium' },
        'bronze': { AZ: 'Bürünc', RUS: 'Бронзовый', ENG: 'Bronze' },
        'bürünc': { AZ: 'Bürünc', RUS: 'Бронзовый', ENG: 'Bronze' },
        'beige': { AZ: 'Bej', RUS: 'Бежевый', ENG: 'Beige' },
        'bej': { AZ: 'Bej', RUS: 'Бежевый', ENG: 'Beige' },
        'brown': { AZ: 'Qəhvəyi', RUS: 'Коричневый', ENG: 'Brown' },
        'qəhvəyi': { AZ: 'Qəhvəyi', RUS: 'Коричневый', ENG: 'Brown' },
        'mint': { AZ: 'Nanə yaşılı', RUS: 'Мятный', ENG: 'Mint' },
        'nanə yaşılı': { AZ: 'Nanə yaşılı', RUS: 'Мятный', ENG: 'Mint' },
        'lavender': { AZ: 'Lavanda', RUS: 'Лавандовый', ENG: 'Lavender' },
        'lavanda': { AZ: 'Lavanda', RUS: 'Лавандовый', ENG: 'Lavender' },
        'transparent': { AZ: 'Şəffaf', RUS: 'Прозрачный', ENG: 'Transparent' },
        'şəffaf': { AZ: 'Şəffaf', RUS: 'Прозрачный', ENG: 'Transparent' },
        'other': { AZ: 'Digər', RUS: 'Другой', ENG: 'Other' },
        'digər': { AZ: 'Digər', RUS: 'Другой', ENG: 'Other' }
    };

    var SPEC_VALUES = {
        'silikon': { AZ: 'Silikon', RUS: 'Силикон', ENG: 'Silicone' },
        'şəffaf plastik': { AZ: 'Şəffaf plastik', RUS: 'Прозрачный пластик', ENG: 'Clear plastic' },
        'dəri': { AZ: 'Dəri', RUS: 'Кожа', ENG: 'Leather' },
        'karbon': { AZ: 'Karbon', RUS: 'Карбон', ENG: 'Carbon' },
        'zərbəyə davamlı': { AZ: 'Zərbəyə davamlı', RUS: 'Ударопрочный', ENG: 'Shockproof' },
        'alcantara': { AZ: 'Alcantara', RUS: 'Алькантара', ENG: 'Alcantara' },
        'digər': { AZ: 'Digər', RUS: 'Другое', ENG: 'Other' },
        'tam örtən şüşə': { AZ: 'Tam örtən şüşə', RUS: 'Полноэкранное стекло', ENG: 'Full cover glass' },
        'anti-spy': { AZ: 'Anti-Spy', RUS: 'Антишпион (Anti-Spy)', ENG: 'Anti-Spy Privacy' },
        'keramika': { AZ: 'Keramika', RUS: 'Керамика', ENG: 'Ceramic' },
        'hidrogel': { AZ: 'Hidrogel', RUS: 'Гидрогель', ENG: 'Hydrogel' },
        'mat': { AZ: 'Mat', RUS: 'Матовое', ENG: 'Matte' },
        'şəffaf sadə': { AZ: 'Şəffaf sadə', RUS: 'Обычное прозрачное', ENG: 'Clear standard' },
        'simsiz (bluetooth / tws)': { AZ: 'Simsiz (Bluetooth / TWS)', RUS: 'Беспроводные (Bluetooth / TWS)', ENG: 'Wireless (Bluetooth / TWS)' },
        'naqilli (3.5 mm)': { AZ: 'Naqilli (3.5 mm)', RUS: 'Проводные (3.5 мм)', ENG: 'Wired (3.5 mm)' },
        'type-c / lightning': { AZ: 'Type-C / Lightning', RUS: 'Type-C / Lightning', ENG: 'Type-C / Lightning' },
        'qulaqdaxili (in-ear)': { AZ: 'Qulaqdaxili (In-Ear)', RUS: 'Внутриканальные (In-Ear)', ENG: 'In-Ear' },
        'qulaqüstü (over-ear)': { AZ: 'Qulaqüstü (Over-Ear)', RUS: 'Полноразмерные (Over-Ear)', ENG: 'Over-Ear' },
        'açıq tipli (earbuds)': { AZ: 'Açıq tipli (Earbuds)', RUS: 'Вкладыши (Earbuds)', ENG: 'Earbuds' },
        'ikili port (type-c + usb-a)': { AZ: 'İkili port (Type-C + USB-A)', RUS: 'Двойной порт (Type-C + USB-A)', ENG: 'Dual port (Type-C + USB-A)' },
        'simsiz / magsafe': { AZ: 'Simsiz / MagSafe', RUS: 'Беспроводная / MagSafe', ENG: 'Wireless / MagSafe' },
        '3-ü 1-də universal': { AZ: '3-ü 1-də Universal', RUS: 'Универсальный 3-в-1', ENG: '3-in-1 Universal' },
        '1 metr': { AZ: '1 metr', RUS: '1 метр', ENG: '1 meter' },
        '1.5 metr': { AZ: '1.5 metr', RUS: '1.5 метра', ENG: '1.5 meters' },
        '2 metr': { AZ: '2 metr', RUS: '2 метра', ENG: '2 meters' },
        '3 metr': { AZ: '3 metr', RUS: '3 метра', ENG: '3 meters' }
    };

    var MONTHS = {
        AZ: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'],
        RUS: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
        ENG: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };

    var UI_STRINGS = {
        views: { AZ: 'baxış', RUS: 'просм.', ENG: 'views' },
        noDescription: { AZ: 'Açıqlama yoxdur.', RUS: 'Описание отсутствует.', ENG: 'No description.' },
        storageChip: { AZ: 'Yaddaş', RUS: 'Память', ENG: 'Storage' },
        ramChip: { AZ: 'RAM', RUS: 'ОЗУ', ENG: 'RAM' },
        gb: { AZ: 'GB', RUS: 'ГБ', ENG: 'GB' },
        mah: { AZ: 'mAh', RUS: 'мАч', ENG: 'mAh' },
        var: { AZ: 'Var', RUS: 'Есть', ENG: 'Available' },
        yoxdur: { AZ: 'Yoxdur', RUS: 'Нет', ENG: 'None' },
        yesVar: { AZ: '✓ Var', RUS: '✓ Есть', ENG: '✓ Yes' },
        personalAccount: { AZ: 'Şəxsi hesab', RUS: 'Частное лицо', ENG: 'Personal account' },
        store: { AZ: 'Mağaza', RUS: 'Магазин', ENG: 'Store' },
        private: { AZ: 'Şəxsi', RUS: 'Частное', ENG: 'Private' },
        urgent: { AZ: 'Təcili', RUS: 'Срочно', ENG: 'Urgent' },
        officialStore: { AZ: 'Rəsmi Mağaza', RUS: 'Официальный магазин', ENG: 'Official Store' },
        viewStore: { AZ: 'Mağazaya bax', RUS: 'Перейти в магазин', ENG: 'View store' },
        deletedUser: { AZ: 'Silinmiş istifadəçi', RUS: 'Удалённый пользователь', ENG: 'Deleted user' },
        user: { AZ: 'İstifadəçi', RUS: 'Пользователь', ENG: 'User' },
        rating: { AZ: '★ Reytinq', RUS: '★ Рейтинг', ENG: '★ Rating' },
        review: { AZ: 'Rəy', RUS: 'Отзывов', ENG: 'Reviews' },
        basedOnReviews: { AZ: 'rəy əsasında', RUS: 'на основе отзывов', ENG: 'based on reviews' },
        noReviews: { AZ: 'Bu satıcı üçün hələ rəy yoxdur. İlk rəyi siz yazın!', RUS: 'Отзывов об этом продавце пока нет. Будьте первым!', ENG: 'No reviews for this seller yet. Be the first to review!' },
        editBtn: { AZ: 'Düzəliş Et', RUS: 'Редактировать', ENG: 'Edit' },
        deleteBtn: { AZ: 'Elanı Sil', RUS: 'Удалить объявление', ENG: 'Delete Ad' },
        deleteConfirm: { AZ: 'Bu elanı silmək istədiyinizə əminsiniz?', RUS: 'Вы уверены, что хотите удалить это объявление?', ENG: 'Are you sure you want to delete this ad?' },
        adDeleted: { AZ: 'Elan silindi!', RUS: 'Объявление удалено!', ENG: 'Ad deleted!' },
        deleteErr: { AZ: 'Silinmə zamanı xəta oldu.', RUS: 'Ошибка при удалении.', ENG: 'Error deleting ad.' },
        networkErr: { AZ: 'Şəbəkə xətası baş verdi.', RUS: 'Произошла ошибка сети.', ENG: 'Network error occurred.' },
        loginToMessage: { AZ: 'Mesaj yazmaq üçün sistemə daxil olun!', RUS: 'Войдите в систему, чтобы написать сообщение!', ENG: 'Please log in to send a message!' },
        loginToReview: { AZ: 'Rəy yazmaq üçün daxil olun!', RUS: 'Войдите, чтобы оставить отзыв!', ENG: 'Please log in to write a review!' },
        selectRating: { AZ: 'Zəhmət olmasa reytinq seçin (ulduz)', RUS: 'Пожалуйста, выберите оценку (звёзды)', ENG: 'Please select a star rating' },
        sending: { AZ: 'Göndərilir...', RUS: 'Отправка...', ENG: 'Sending...' },
        reviewAdded: { AZ: 'Rəy uğurla əlavə edildi!', RUS: 'Отзыв успешно добавлен!', ENG: 'Review added successfully!' },
        errOccurred: { AZ: 'Xəta baş verdi', RUS: 'Произошла ошибка', ENG: 'An error occurred' },
        toastFavAdd: { AZ: 'Seçilmişlərə əlavə edildi!', RUS: 'Добавлено в избранное!', ENG: 'Added to favorites!' },
        toastFavRemove: { AZ: 'Seçilmişlərdən çıxarıldı!', RUS: 'Удалено из избранного!', ENG: 'Removed from favorites!' },
        toastLinkCopied: { AZ: 'Link kopyalandı!', RUS: 'Ссылка скопирована!', ENG: 'Link copied!' },
        toastReportAccepted: { AZ: 'Şikayətiniz qəbul edildi. Moderatorlarımız yoxlayacaq.', RUS: 'Жалоба принята. Модераторы проверят её.', ENG: 'Report received. Our moderators will review it.' },
        adFallback: { AZ: 'Elan', RUS: 'Объявление', ENG: 'Ad' },
        noImageAlt: { AZ: 'Elan şəkli yoxdur', RUS: 'Нет фото', ENG: 'No photo' },
        untitledAd: { AZ: 'Adsız Elan', RUS: 'Объявление без названия', ENG: 'Untitled Ad' },
        noStoresTitle: { AZ: 'Hələ mağaza yoxdur', RUS: 'Магазинов пока нет', ENG: 'No stores yet' },
        noStoresDesc: { AZ: 'Hal-hazırda aktiv mağaza mövcud deyil.', RUS: 'В настоящее время активных магазинов нет.', ENG: 'No active stores currently.' },
        // Spec row labels
        lblCategory: { AZ: 'Kateqoriya', RUS: 'Категория', ENG: 'Category' },
        lblBrand: { AZ: 'Marka', RUS: 'Марка', ENG: 'Brand' },
        lblModel: { AZ: 'Model', RUS: 'Модель', ENG: 'Model' },
        lblMemory: { AZ: 'Yaddaş', RUS: 'Память', ENG: 'Storage' },
        lblRam: { AZ: 'RAM', RUS: 'ОЗУ', ENG: 'RAM' },
        lblScreen: { AZ: 'Ekran ölçüsü', RUS: 'Размер экрана', ENG: 'Screen size' },
        lblBattery: { AZ: 'Batareya', RUS: 'Аккумулятор', ENG: 'Battery' },
        lblMaterial: { AZ: 'Material', RUS: 'Материал', ENG: 'Material' },
        lblGlassType: { AZ: 'Qoruyucu növü', RUS: 'Тип защиты', ENG: 'Protector type' },
        lblConnType: { AZ: 'Qoşulma növü', RUS: 'Тип подключения', ENG: 'Connection type' },
        lblHeadphoneType: { AZ: 'Qulaqlıq forması', RUS: 'Тип наушников', ENG: 'Headphone type' },
        lblPower: { AZ: 'Çıxış gücü', RUS: 'Выходная мощность', ENG: 'Output power' },
        lblPortType: { AZ: 'Port növü', RUS: 'Тип порта', ENG: 'Port type' },
        lblCableType: { AZ: 'Kabel növü', RUS: 'Тип кабеля', ENG: 'Cable type' },
        lblCableLength: { AZ: 'Uzunluq', RUS: 'Длина', ENG: 'Length' },
        lblColor: { AZ: 'Rəng', RUS: 'Цвет', ENG: 'Color' },
        lblCondition: { AZ: 'Vəziyyəti', RUS: 'Состояние', ENG: 'Condition' },
        lblInfo: { AZ: 'Məlumat', RUS: 'Информация', ENG: 'Info' },
        // Feature names
        featNfc: { AZ: 'NFC', RUS: 'NFC', ENG: 'NFC' },
        featWaterproofChip: { AZ: 'Suya davamlı', RUS: 'Влагозащита', ENG: 'Waterproof' },
        featWaterproofRow: { AZ: 'Suya davamlılıq', RUS: 'Влагозащита', ENG: 'Water resistance' },
        featFingerprint: { AZ: 'Barmaq izi', RUS: 'Отпечаток пальца', ENG: 'Fingerprint' },
        featExpandableChip: { AZ: 'Yaddaş kartı dəstəyi', RUS: 'Слот для карты памяти', ENG: 'Memory card slot' },
        featExpandableRow: { AZ: 'Əlavə yaddaş kartı', RUS: 'Карта памяти', ENG: 'Expandable storage' },
        featMagsafe: { AZ: 'MagSafe', RUS: 'MagSafe', ENG: 'MagSafe' },
        featMagsafeRow: { AZ: 'MagSafe dəstəyi', RUS: 'Поддержка MagSafe', ENG: 'MagSafe support' },
        featAnc: { AZ: 'ANC (Küyboğma)', RUS: 'Шумоподавление (ANC)', ENG: 'Active Noise Cancelling' },
        featFastCharge: { AZ: 'Sürətli şarj', RUS: 'Быстрая зарядка', ENG: 'Fast charging' },
        featWirelessCharge: { AZ: 'Simsiz şarj', RUS: 'Беспроводная зарядка', ENG: 'Wireless charging' },
        featMicrophone: { AZ: 'Mikrofon', RUS: 'Микрофон', ENG: 'Microphone' },
        featOleophobic: { AZ: 'Oleofobik örtük', RUS: 'Олеофобное покрытие', ENG: 'Oleophobic coating' },
        featStylus: { AZ: 'Stylus / Qələm', RUS: 'Стилус', ENG: 'Stylus' },
        featSimCard: { AZ: 'SIM kart', RUS: 'SIM-карта', ENG: 'SIM card' },
        featSimCardRow: { AZ: 'SIM kart (4G/5G)', RUS: 'SIM-карта (4G/5G)', ENG: 'SIM card (4G/5G)' },
        featDelivery: { AZ: 'Çatdırılma', RUS: 'Доставка', ENG: 'Delivery' }
    };

    function t(key, langOverride) {
        var lang = langOverride || getLang();
        var entry = UI_STRINGS[key];
        if (!entry) return key;
        return entry[lang] || entry.AZ || key;
    }

    function normalizeKey(str) {
        return String(str || '').trim().toLowerCase().replace(/\u0307/g, '');
    }

    function lookupMap(map, val, langOverride) {
        if (!val) return '';
        var lang = langOverride || getLang();
        var key = normalizeKey(val);
        if (map[key]) return map[key][lang] || map[key].AZ;
        return String(val).trim();
    }

    function translateCity(val, langOverride) {
        if (!val) return '';
        var lang = langOverride || getLang();
        var raw = String(val).trim();
        var direct = CITIES[normalizeKey(raw)];
        if (direct) return direct[lang] || direct.AZ;
        if (raw.indexOf(',') !== -1) {
            return raw.split(',').map(function(part) {
                var trimmed = part.trim();
                var hit = CITIES[normalizeKey(trimmed)];
                return hit ? (hit[lang] || hit.AZ) : trimmed;
            }).join(', ');
        }
        return raw;
    }

    function translateCategory(val, langOverride) {
        return lookupMap(CATEGORIES, val, langOverride);
    }

    function translateCondition(val, langOverride) {
        return lookupMap(CONDITIONS, val, langOverride);
    }

    function translateColor(val, langOverride) {
        return lookupMap(COLORS, val, langOverride);
    }

    function translateSpecValue(val, langOverride) {
        return lookupMap(SPEC_VALUES, val, langOverride);
    }

    function formatMemory(val, langOverride) {
        if (!val) return '';
        var lang = langOverride || getLang();
        var gbUnit = t('gb', lang);
        var s = String(val).trim();
        if (s === '64-dan-az' || s === 'below-64' || s.toLowerCase() === '< 64' || s.toLowerCase() === '<64') {
            return '< 64 ' + gbUnit;
        }
        if (s === '512-den-cox' || s === '512+' || s === '512-plus') {
            return '512+ ' + gbUnit;
        }
        if (/^\d+$/.test(s)) return s + ' ' + gbUnit;
        var m = s.match(/^(\d+)\s*gb$/i);
        if (m) return m[1] + ' ' + gbUnit;
        return s;
    }

    function formatRam(val, langOverride) {
        if (!val) return '';
        var lang = langOverride || getLang();
        var gbUnit = t('gb', lang);
        var s = String(val).trim();
        if (s === '16-dan-cox' || s === '16+' || s === '16-plus') {
            return '16+ ' + gbUnit;
        }
        if (/^\d+$/.test(s)) return s + ' ' + gbUnit;
        var m = s.match(/^(\d+)\s*gb$/i);
        if (m) return m[1] + ' ' + gbUnit;
        return s;
    }

    function formatScreen(val) {
        if (!val) return '';
        return String(val).trim().replace(/"/g, '') + '"';
    }

    function formatBattery(val, langOverride) {
        if (!val) return '';
        var lang = langOverride || getLang();
        var mahUnit = t('mah', lang);
        var s = String(val).trim();
        if (/^\d+$/.test(s) || /^\d+\s*-\s*\d+$/.test(s) || /^\d+\+$/.test(s)) {
            return s + ' ' + mahUnit;
        }
        var m = s.match(/^(.+?)\s*mah$/i);
        if (m) return m[1].trim() + ' ' + mahUnit;
        return s;
    }

    function formatMonthYear(dateVal, langOverride) {
        if (!dateVal) return '';
        var d = new Date(dateVal);
        if (isNaN(d.getTime())) return '';
        var lang = langOverride || getLang();
        var months = MONTHS[lang] || MONTHS.AZ;
        return months[d.getMonth()] + ' ' + d.getFullYear();
    }

    function formatDate(dateVal, withTime, langOverride) {
        if (!dateVal) return '';
        var d = new Date(dateVal);
        if (isNaN(d.getTime())) return '';
        var dd = String(d.getDate()).padStart(2, '0');
        var mm = String(d.getMonth() + 1).padStart(2, '0');
        var yyyy = d.getFullYear();
        var dateStr = dd + '.' + mm + '.' + yyyy;
        if (withTime) {
            var hh = String(d.getHours()).padStart(2, '0');
            var min = String(d.getMinutes()).padStart(2, '0');
            return dateStr + ', ' + hh + ':' + min;
        }
        return dateStr;
    }

    window.MobilazI18n = {
        getLang: getLang,
        t: t,
        translateCity: translateCity,
        translateCategory: translateCategory,
        translateCondition: translateCondition,
        translateColor: translateColor,
        translateSpecValue: translateSpecValue,
        formatMemory: formatMemory,
        formatRam: formatRam,
        formatScreen: formatScreen,
        formatBattery: formatBattery,
        formatMonthYear: formatMonthYear,
        formatDate: formatDate
    };
})();

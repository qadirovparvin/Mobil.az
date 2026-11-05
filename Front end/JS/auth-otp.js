"use strict";

document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[id^="toggle"]');
    if (!btn) return;
    e.preventDefault();
    const targetId = btn.dataset.target || btn.id.replace('toggle','').toLowerCase();
    const input = document.getElementById(targetId) || document.getElementById('loginPassword') || document.querySelector('input[type="password"], input[type="text"]');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
      if (btn.classList.contains('fa-eye')) {
        btn.classList.remove('fa-eye');
        btn.classList.add('fa-eye-slash');
      } else if (btn.classList.contains('fa-eye-slash')) {
        btn.classList.remove('fa-eye-slash');
        btn.classList.add('fa-eye');
      }
    }
  });
});



/* ============================================================
   auth-otp.js  –  Shared helpers for login & signup OTP flows
   ============================================================ */

if (typeof window !== 'undefined') {
    const isLocal = ['localhost', '127.0.0.1', '::1', '[::1]', '', '0.0.0.0'].includes(window.location.hostname);
    window.API_URL = window.API_URL || window.API_BASE || (isLocal ? 'http://localhost:5000/api' : `${window.location.origin}/api`);
}

// Safe token extractor supporting token, sessionStorage token, and adminToken
function getStoredToken() {
    if (typeof window !== 'undefined' && typeof window.getToken === 'function') {
        const tok = window.getToken();
        if (tok) return tok;
    }
    if (typeof localStorage === 'undefined') return '';
    const token = localStorage.getItem('token') || 
                  sessionStorage.getItem('token') || 
                  localStorage.getItem('adminToken') || 
                  sessionStorage.getItem('adminToken') || '';
    return token.trim().replace(/^["']+|["']+$/g, '');
}
if (typeof window !== 'undefined') {
    window.getStoredToken = getStoredToken;
    if (typeof window.getToken !== 'function') {
        window.getToken = getStoredToken;
    }
}

let SMS_DEV_MODE = true; // TODO: false when SMS paid
if (typeof process !== 'undefined' && (process.env?.NODE_ENV === 'production' || process.env?.SMS_DEV_MODE === 'false')) {
    SMS_DEV_MODE = false;
}
if (typeof window !== 'undefined' && window.location?.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.location.hostname.endsWith('.local')) {
    SMS_DEV_MODE = false;
}
if (typeof window !== 'undefined') {
    window.SMS_DEV_MODE = SMS_DEV_MODE;
}
const SMS_DEV_WARNING = 'SMS xidməti hazırda texniki profilaktikadadır. Zəhmət olmasa şifrə ilə daxil olun.';

// Dual-write session persistence across all keys to guarantee header and API sync
function persistSession(data, rememberMeParam) {
    const token = data?.accessToken || data?.token || data?.authToken || (typeof data === 'string' ? data : '');
    if (!token) return;

    let rememberMe = rememberMeParam;
    if (rememberMe === undefined) {
        if (data && typeof data.rememberMe !== 'undefined') {
            rememberMe = Boolean(data.rememberMe);
        } else {
            rememberMe = localStorage.getItem('rememberMe') === 'true';
        }
    }

    const userPayload = {
        id: data._id || data.id || data.user?._id || data.user?.id,
        name: data.name || data.user?.name || '',
        lastName: data.lastName || data.user?.lastName || '',
        email: data.email || data.user?.email || '',
        phone: data.phone || data.user?.phone || '',
        role: data.role || data.user?.role || 'user',
        avatar: data.avatar || data.user?.avatar || ''
    };

    const tokenKeys = ['token', 'accessToken', 'authToken', 'adminToken', 'jwt'];
    tokenKeys.forEach((key) => {
        try { localStorage.removeItem(key); } catch(e) {}
        try { sessionStorage.removeItem(key); } catch(e) {}
    });

    const userStr = JSON.stringify(userPayload);
    const userKeys = ['user', 'mobilaz_current_user', 'mobilaz_user'];

    if (rememberMe) {
        try { localStorage.setItem('token', token); } catch(e) {}
        try { localStorage.setItem('rememberMe', 'true'); } catch(e) {}
        userKeys.forEach(k => { try { localStorage.setItem(k, userStr); } catch(e) {} });
        if (userPayload.email) {
            try { localStorage.setItem('savedEmail', userPayload.email); } catch(e) {}
            try { localStorage.setItem('userEmail', userPayload.email); } catch(e) {}
        }
        if (userPayload.role) {
            try { localStorage.setItem('userRole', userPayload.role); } catch(e) {}
        }
        if (userPayload.role === 'admin') {
            try { localStorage.setItem('adminToken', token); } catch(e) {}
            try { localStorage.setItem('adminUser', userStr); } catch(e) {}
        }
    } else {
        try { sessionStorage.setItem('token', token); } catch(e) {}
        try { localStorage.removeItem('rememberMe'); } catch(e) {}
        userKeys.forEach(k => { try { sessionStorage.setItem(k, userStr); } catch(e) {} });
        if (userPayload.email) {
            try { localStorage.setItem('savedEmail', userPayload.email); } catch(e) {}
            try { sessionStorage.setItem('userEmail', userPayload.email); } catch(e) {}
        }
        if (userPayload.role) {
            try { sessionStorage.setItem('userRole', userPayload.role); } catch(e) {}
        }
        if (userPayload.role === 'admin') {
            try { sessionStorage.setItem('adminToken', token); } catch(e) {}
            try { sessionStorage.setItem('adminUser', userStr); } catch(e) {}
        }
    }

    if (typeof window.setAuthToken === 'function') {
        try { window.setAuthToken(token); } catch(e) {}
    }
    if (typeof window.updateHeader === 'function') {
        try { window.updateHeader(); } catch(e) {}
    }
    if (typeof window.updateAuthUI === 'function') {
        try { window.updateAuthUI(); } catch(e) {}
    }
    if (typeof window.checkAuth === 'function') {
        try { window.checkAuth(); } catch(e) {}
    }
    try { window.dispatchEvent(new Event('authChanged')); } catch(e) {}
}
window.persistSession = persistSession;
window.persistAuthSession = persistSession;

function onLoginSuccess(token, user, rememberMe, redirectTarget) {
    window.loginFormSubmitted = true;
    try { sessionStorage.setItem('manualLoginInProgress', 'true'); } catch(e) {}

    // Loop flag-ləri tam sil
    sessionStorage.removeItem('lastRedirectTime');
    sessionStorage.removeItem('last401Time');
    localStorage.removeItem('lastRedirectTime');
    sessionStorage.removeItem('isCabinetRedirecting');
    sessionStorage.removeItem('isRedirecting');

    // URL-də expired/reason varsa təmizlə
    if (window.location.search.includes('expired') || window.location.search.includes('reason')) {
        try {
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch(e) {}
    }

    // Token-i DÜZGÜN saxla - rememberMe true-dursa localStorage, false-dursa sessionStorage
    const tokenKeys = ['token', 'accessToken', 'authToken', 'adminToken', 'jwt'];
    tokenKeys.forEach(k => {
        try { localStorage.removeItem(k); } catch(e) {}
        try { sessionStorage.removeItem(k); } catch(e) {}
    });

    if (rememberMe) {
        try { localStorage.setItem('token', token); } catch(e) {}
        try { localStorage.setItem('rememberMe', 'true'); } catch(e) {}
    } else {
        try { sessionStorage.setItem('token', token); } catch(e) {}
        try { localStorage.setItem('rememberMe', 'false'); } catch(e) {}
    }

    const userPayload = {
        id: user?._id || user?.id,
        name: user?.name || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        role: user?.role || 'user',
        avatar: user?.avatar || ''
    };
    const userStr = JSON.stringify(userPayload);
    ['user', 'mobilaz_current_user', 'mobilaz_user'].forEach(k => {
        try { localStorage.setItem(k, userStr); } catch(e) {}
        try { sessionStorage.setItem(k, userStr); } catch(e) {}
    });

    if (userPayload.email) {
        try { localStorage.setItem('savedEmail', userPayload.email); } catch(e) {}
        try { localStorage.setItem('userEmail', userPayload.email); } catch(e) {}
    }
    if (userPayload.role) {
        try { localStorage.setItem('userRole', userPayload.role); } catch(e) {}
    }

    if (userPayload.role === 'admin') {
        if (rememberMe) {
            try { localStorage.setItem('adminToken', token); } catch(e) {}
            try { localStorage.setItem('adminUser', userStr); } catch(e) {}
        } else {
            try { sessionStorage.setItem('adminToken', token); } catch(e) {}
            try { sessionStorage.setItem('adminUser', userStr); } catch(e) {}
        }
    }

    if (typeof window.updateHeader === 'function') {
        try { window.updateHeader(); } catch(e) {}
    }

    if (window.showToast) {
        showToast('Uğurlu giriş! Hesabınıza yönləndirilirsiniz...', 'success');
    }

    const defaultTarget = userPayload.role === 'admin' ? 'admin.html' : 'cabinet.html';
    const target = redirectTarget || defaultTarget;

    setTimeout(() => {
        try { sessionStorage.removeItem('manualLoginInProgress'); } catch(e) {}
        window.location.href = target;
    }, 500);
}
window.onLoginSuccess = onLoginSuccess;

function clearSession() {
    const keys = ['token', 'accessToken', 'authToken', 'adminToken', 'user', 'mobilaz_current_user', 'mobilaz_user', 'adminUser', 'userRole', 'userEmail'];
    keys.forEach((key) => {
        try { sessionStorage.removeItem(key); } catch(e) {}
        try { localStorage.removeItem(key); } catch(e) {}
    });
    if (typeof window.updateHeader === 'function') {
        try { window.updateHeader(); } catch(e) {}
    }
    if (typeof window.updateAuthUI === 'function') {
        try { window.updateAuthUI(); } catch(e) {}
    }
    try { window.dispatchEvent(new Event('authChanged')); } catch(e) {}
}
window.clearSession = clearSession;
window.clearAuthSession = clearSession;

function authT(key, fallback = '') {
    const lang = localStorage.getItem('lang') || 'AZ';
    return window.translations?.[lang]?.[key] || fallback;
}

function validateClientPassword(pwd) {
    if (!pwd || pwd.length < 8) return 'Şifrə ən azı 8 simvoldan ibarət olmalıdır.';
    if (!/[A-Z]/.test(pwd)) return 'Şifrədə ən azı 1 böyük hərf (A-Z) olmalıdır.';
    if (!/[a-z]/.test(pwd)) return 'Şifrədə ən azı 1 kiçik hərf (a-z) olmalıdır.';
    if (!/\d/.test(pwd)) return 'Şifrədə ən azı 1 rəqəm (0-9) olmalıdır.';
    return null;
}

/* ── Toast ─────────────────────────────────────────────────── */
function showToast(msg, type = 'info') {
    const toast = document.getElementById('authToast');
    const msgEl = document.getElementById('toastMsg');
    const icon  = document.getElementById('toastIcon');
    if (!toast) return;

    // Translation map for toast messages (exact AZ strings used in JS)
    const toastTranslations = {
        ENG: {
            "Email/istifadəçi adı və şifrəni daxil edin": "Please enter email/username and password",
            "Email və ya şifrə yanlışdır": "Incorrect email or password",
            "Uğurla daxil oldunuz!": "Logged in successfully!",
            "Serverlə əlaqə yaradılmadı. Yenidən cəhd edin.": "Could not connect to server. Please try again.",
            "Telefon nömrəsini daxil edin": "Please enter phone number",
            "SMS kodu göndərildi!": "SMS code sent!",
            "Xəta baş verdi. Yenidən cəhd edin.": "An error occurred. Please try again.",
            "SMS kodu yenidən göndərildi": "SMS code resent",
            "Düzgün email daxil edin": "Please enter a valid email",
            "Email kodu göndərildi!": "Email code sent!",
            "Email kodu yenidən göndərildi": "Email code resent",
            "Şifrə sıfırlama linki email-ə göndəriləcək. Yaxında həyata keçiriləcək.": "Password reset link will be sent to email. Coming soon.",
            "Ad və soyad daxil edin": "Please enter first and last name",
            "6 rəqəmli kodu daxil edin": "Please enter 6-digit code",
            "Nömrəniz uğurla təsdiqləndi!": "Phone number verified successfully!",
            "Yanlış kod. Yenidən cəhd edin.": "Incorrect code. Please try again.",
            "Email uğurla təsdiqləndi!": "Email verified successfully!",
            "Yanlış kod": "Incorrect code",
            "Şifrələr uyğun gəlmir!": "Passwords do not match!",
            "Şərtləri qəbul edin": "Please accept terms and conditions",
            "Şifrə ən azı 6 simvol olmalıdır": "Password must be at least 6 characters",
            "Qeydiyyat xətası": "Registration error",
            "Qeydiyyat tamamlandı!": "Registration complete!",
            "Serverlə əlaqə yaradılmadı": "Could not connect to server"
        },
        RUS: {
            "Email/istifadəçi adı və şifrəni daxil edin": "Введите email/имя пользователя и пароль",
            "Email və ya şifrə yanlışdır": "Неверный email или пароль",
            "Uğurla daxil oldunuz!": "Успешный вход!",
            "Serverlə əlaqə yaradılmadı. Yenidən cəhd edin.": "Ошибка подключения к серверу. Попробуйте еще раз.",
            "Telefon nömrəsini daxil edin": "Введите номер телефона",
            "SMS kodu göndərildi!": "SMS код отправлен!",
            "Xəta baş verdi. Yenidən cəhd edin.": "Произошла ошибка. Попробуйте еще раз.",
            "SMS kodu yenidən göndərildi": "SMS код отправлен повторно",
            "Düzgün email daxil edin": "Введите действительный email",
            "Email kodu göndərildi!": "Email код отправлен!",
            "Email kodu yenidən göndərildi": "Email код отправлен повторно",
            "Şifrə sıfırlama linki email-ə göndəriləcək. Yaxında həyata keçiriləcək.": "Ссылка для сброса пароля будет отправлена на email. Скоро.",
            "Ad və soyad daxil edin": "Введите имя и фамилию",
            "6 rəqəmli kodu daxil edin": "Введите 6-значный код",
            "Nömrəniz uğurla təsdiqləndi!": "Номер телефона успешно подтвержден!",
            "Yanlış kod. Yenidən cəhd edin.": "Неверный код. Попробуйте еще раз.",
            "Email uğurla təsdiqləndi!": "Email успешно подтвержден!",
            "Yanlış kod": "Неверный код",
            "Şifrələr uyğun gəlmir!": "Пароли не совпадают!",
            "Şərtləri qəbul edin": "Примите условия",
            "Şifrə ən azı 6 simvol olmalıdır": "Пароль должен содержать не менее 6 символов",
            "Qeydiyyat xətası": "Ошибка регистрации",
            "Qeydiyyat tamamlandı!": "Регистрация завершена!",
            "Serverlə əlaqə yaradılmadı": "Ошибка подключения к серверу"
        }
    };

    const lang = localStorage.getItem('lang') || 'AZ';
    let translatedMsg = msg;
    if (window.translations?.[lang]?.[msg]) {
        translatedMsg = window.translations[lang][msg];
    } else if (lang !== 'AZ' && toastTranslations[lang] && toastTranslations[lang][msg]) {
        translatedMsg = toastTranslations[lang][msg];
    }

    toast.className = `auth-toast ${type}`;
    icon.className  = type === 'success' ? 'fas fa-check-circle'
                    : type === 'error'   ? 'fas fa-times-circle'
                    : 'fas fa-info-circle';
    msgEl.textContent = translatedMsg;
    toast.classList.add('show');
    
    if (window.toastTimer) clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => toast.classList.remove('show'), 4000);
}

/* ── Button loading state ───────────────────────────────────── */
function setLoading(btn, on) {
    if (!btn) return;
    on ? btn.classList.add('loading') : btn.classList.remove('loading');
}

/* ── Password visibility toggle ────────────────────────────── */
window.togglePwd = function togglePwd(inputId, iconId) {
    const inp  = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!inp) return;
    const now = Date.now();
    if (inp._lastToggle && (now - inp._lastToggle < 250)) return;
    inp._lastToggle = now;
    if (inp.type === 'password') {
        inp.type = 'text';
        if (icon) { icon.classList.replace('fa-eye', 'fa-eye-slash'); }
    } else {
        inp.type = 'password';
        if (icon) { icon.classList.replace('fa-eye-slash', 'fa-eye'); }
    }
}

/* ── Password strength ──────────────────────────────────────── */
function checkPasswordStrength(val) {
    const fillId = document.getElementById('strengthFill') ? 'strengthFill' : 'strengthFillE';
    const textId = document.getElementById('strengthText') ? 'strengthText' : 'strengthTextE';
    const fill   = document.getElementById(fillId);
    const text   = document.getElementById(textId);
    if (!fill || !text) return;

    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const levels = ['', 'weak', 'fair', 'good', 'strong'];
    const labels = [
        '',
        authT('auth-strength-weak', 'Zəif'),
        authT('auth-strength-fair', 'Orta'),
        authT('auth-strength-good', 'Yaxşı'),
        authT('auth-strength-strong', 'Güclü')
    ];
    fill.className = `strength-fill ${levels[score] || ''}`;
    text.textContent = val.length ? labels[score] || authT('auth-strength-weak', 'Zəif') : '';
}

/* ── OTP input wiring ───────────────────────────────────────── */
function wireOtpInputs(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const digits = container.querySelectorAll('.otp-digit');
    digits.forEach((d, i) => {
        d.addEventListener('input', () => {
            d.value = d.value.replace(/\D/g, '').slice(-1);
            d.classList.toggle('filled', d.value !== '');
            if (d.value && i < digits.length - 1) digits[i + 1].focus();
        });
        d.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !d.value && i > 0) digits[i - 1].focus();
        });
        d.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
            [...paste].forEach((ch, j) => {
                if (digits[i + j]) { digits[i + j].value = ch; digits[i + j].classList.add('filled'); }
            });
            const next = digits[Math.min(i + paste.length, digits.length - 1)];
            if (next) next.focus();
        });
    });
}

/* ── Collect OTP value ──────────────────────────────────────── */
function getOtpValue(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return '';
    return [...container.querySelectorAll('.otp-digit')].map(d => d.value).join('');
}

/* ── Clear OTP inputs ───────────────────────────────────────── */
function clearOtp(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.otp-digit').forEach(d => { d.value = ''; d.classList.remove('filled'); });
    container.querySelector('.otp-digit')?.focus();
}

/* ── Countdown timer ────────────────────────────────────────── */
function startCountdown(timerSpanId, resendBtnId, seconds = 60) {
    const timerEl  = document.getElementById(timerSpanId);
    const resendEl = document.getElementById(resendBtnId);
    if (!timerEl || !resendEl) return;
    let s = seconds;
    resendEl.disabled = true;
    resendEl.replaceChildren();
    resendEl.appendChild(document.createTextNode(`${authT('auth-resend', 'Yenidən göndər')} (`));
    const span = document.createElement('span');
    span.className = 'otp-timer';
    span.id = timerSpanId;
    span.textContent = s;
    resendEl.appendChild(span);
    resendEl.appendChild(document.createTextNode('s)'));
    const iv = setInterval(() => {
        s--;
        const t = document.getElementById(timerSpanId);
        if (t) t.textContent = s;
        if (s <= 0) {
            clearInterval(iv);
            resendEl.disabled = false;
            resendEl.textContent = authT('auth-resend', 'Yenidən göndər');
        }
    }, 1000);
}

/* ── Login method switcher ──────────────────────────────────── */
function switchLoginMethod(method) {
    if (method === 'sms' || method === 'emailOtp' || method === 'email') {
        showToast(SMS_DEV_WARNING, 'warning');
        // Keep password tab active, do NOT switch
        switchLoginMethod('password');
        return;
    }

    document.querySelectorAll('.login-subform').forEach(f => f.style.display = 'none');
    document.querySelectorAll('.verify-method-btn').forEach(b => b.classList.remove('active'));

    if (method === 'password') {
        document.getElementById('passwordLoginForm').style.display = 'block';
        document.getElementById('methodPassword').classList.add('active');
    } else if (method === 'sms') {
        document.getElementById('smsLoginForm').style.display = 'block';
        document.getElementById('methodSMS').classList.add('active');
        wireOtpInputs('smsOtpInputs');
    } else if (method === 'email') {
        document.getElementById('emailLoginForm').style.display = 'block';
        document.getElementById('methodEmail').classList.add('active');
        wireOtpInputs('emailOtpInputs');
    }
}

/* ── Country Phone Configurations & Professional Input Engine ── */
var COUNTRY_PHONE_CONFIGS = window.COUNTRY_PHONE_CONFIGS || {
    '+994': {
        name: 'Azərbaycan',
        code: '+994',
        digits: 9,
        placeholder: '(50) 000-00-00',
        allowedPrefixes: ['10', '50', '51', '55', '60', '70', '77', '99'],
        format: (digits) => {
            if (!digits) return '';
            let res = '(' + digits.slice(0, 2);
            if (digits.length < 2) return res;
            res += ') ';
            if (digits.length <= 5) return res + digits.slice(2);
            res += digits.slice(2, 5) + '-' + digits.slice(5, 7);
            if (digits.length <= 7) return res;
            return res + '-' + digits.slice(7, 9);
        },
        clean: (raw) => {
            let digits = String(raw || '').replace(/\D/g, '');
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
        format: (digits) => {
            if (!digits) return '';
            let res = '(' + digits.slice(0, 3);
            if (digits.length < 3) return res;
            res += ') ';
            if (digits.length <= 6) return res + digits.slice(3);
            res += digits.slice(3, 6) + '-' + digits.slice(6, 8);
            if (digits.length <= 8) return res;
            return res + '-' + digits.slice(8, 10);
        },
        clean: (raw) => {
            let digits = String(raw || '').replace(/\D/g, '');
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
        format: (digits) => {
            if (!digits) return '';
            let res = '(' + digits.slice(0, 3);
            if (digits.length < 3) return res;
            res += ') ';
            if (digits.length <= 6) return res + digits.slice(3);
            res += digits.slice(3, 6) + '-' + digits.slice(6, 8);
            if (digits.length <= 8) return res;
            return res + '-' + digits.slice(8, 10);
        },
        clean: (raw) => {
            let digits = String(raw || '').replace(/\D/g, '');
            if ((digits.startsWith('7') || digits.startsWith('8')) && digits.length > 10) digits = digits.slice(1);
            return digits.slice(0, 10);
        }
    },
    '+1': {
        name: 'ABŞ / Kanada',
        code: '+1',
        digits: 10,
        placeholder: '(555) 000-0000',
        format: (digits) => {
            if (!digits) return '';
            let res = '(' + digits.slice(0, 3);
            if (digits.length < 3) return res;
            res += ') ';
            if (digits.length <= 6) return res + digits.slice(3);
            return res + digits.slice(3, 6) + '-' + digits.slice(6, 10);
        },
        clean: (raw) => {
            let digits = String(raw || '').replace(/\D/g, '');
            if (digits.startsWith('1') && digits.length > 10) digits = digits.slice(1);
            return digits.slice(0, 10);
        }
    },
    '+44': {
        name: 'Böyük Britaniya',
        code: '+44',
        digits: 10,
        placeholder: '7911 123456',
        format: (digits) => {
            if (!digits) return '';
            if (digits.length <= 4) return digits;
            return digits.slice(0, 4) + ' ' + digits.slice(4, 10);
        },
        clean: (raw) => {
            let digits = String(raw || '').replace(/\D/g, '');
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
        format: (digits) => {
            if (!digits) return '';
            if (digits.length <= 3) return digits;
            return digits.slice(0, 3) + ' ' + digits.slice(3, 11);
        },
        clean: (raw) => {
            let digits = String(raw || '').replace(/\D/g, '');
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
        format: (digits) => {
            if (!digits) return '';
            let res = digits.slice(0, 3);
            if (digits.length <= 3) return res;
            res += ' ' + digits.slice(3, 5);
            if (digits.length <= 5) return res;
            res += '-' + digits.slice(5, 7);
            if (digits.length <= 7) return res;
            return res + '-' + digits.slice(7, 9);
        },
        clean: (raw) => {
            let digits = String(raw || '').replace(/\D/g, '');
            if (digits.startsWith('995') && digits.length > 9) digits = digits.slice(3);
            return digits.slice(0, 9);
        }
    },
    '+971': {
        name: 'BƏƏ',
        code: '+971',
        digits: 9,
        placeholder: '50 123-4567',
        format: (digits) => {
            if (!digits) return '';
            let res = digits.slice(0, 2);
            if (digits.length <= 2) return res;
            res += ' ' + digits.slice(2, 5);
            if (digits.length <= 5) return res;
            return res + '-' + digits.slice(5, 9);
        },
        clean: (raw) => {
            let digits = String(raw || '').replace(/\D/g, '');
            if (digits.startsWith('971') && digits.length > 9) digits = digits.slice(3);
            return digits.slice(0, 9);
        }
    },
    'other': {
        name: 'Digər ölkə',
        code: '+',
        digits: 15,
        placeholder: '7-15 rəqəmli beynəlxalq nömrə',
        format: (digits) => digits.slice(0, 15),
        clean: (raw) => String(raw || '').replace(/\D/g, '').slice(0, 15)
    }
};

function setupPhoneInputMask(inputId, prefixId) {
    const input = document.getElementById(inputId);
    const prefixEl = document.getElementById(prefixId);
    if (!input) return;

    function applyFormat() {
        const prefix = prefixEl ? prefixEl.value : '+994';
        const cfg = COUNTRY_PHONE_CONFIGS[prefix] || COUNTRY_PHONE_CONFIGS['+994'];
        input.placeholder = cfg.placeholder;

        const rawVal = input.value;
        const cleaned = cfg.clean(rawVal);
        const formatted = cfg.format(cleaned);
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
    input.addEventListener('paste', () => setTimeout(applyFormat, 0));
    if (prefixEl) {
        prefixEl.addEventListener('change', () => {
            applyFormat();
            input.focus();
        });
    }

    applyFormat();
}

function validatePhoneNumber(inputId, prefixId) {
    const input = document.getElementById(inputId);
    const prefixEl = document.getElementById(prefixId);
    if (!input) return { valid: false, message: 'Telefon sahəsi tapılmadı' };
    const prefix = prefixEl ? prefixEl.value : '+994';
    const cfg = COUNTRY_PHONE_CONFIGS[prefix] || COUNTRY_PHONE_CONFIGS['+994'];
    const digits = cfg.clean(input.value);

    if (!digits) {
        return { valid: false, message: 'Telefon nömrəsini daxil edin' };
    }

    if (prefix === '+994') {
        if (digits.length !== 9) {
            return { valid: false, message: 'Azərbaycan nömrəsi 9 rəqəmdən ibarət olmalıdır. Nümunə: (50) 123-45-67' };
        }
        const op = digits.slice(0, 2);
        if (!cfg.allowedPrefixes.includes(op)) {
            return { valid: false, message: 'Mobil operator prefiksi dəstəklənmir (10, 50, 51, 55, 60, 70, 77, 99)' };
        }
        return { valid: true, fullPhone: '+994' + digits, digits, prefix };
    }

    if (prefix === 'other') {
        if (digits.length < 7 || digits.length > 15) {
            return { valid: false, message: 'Beynəlxalq telefon nömrəsi 7 ilə 15 rəqəm arasında olmalıdır' };
        }
        return { valid: true, fullPhone: '+' + digits, digits, prefix };
    }

    if (digits.length !== cfg.digits) {
        return { valid: false, message: `${cfg.name} nömrəsi tam ${cfg.digits} rəqəmdən ibarət olmalıdır` };
    }

    return { valid: true, fullPhone: prefix + digits, digits, prefix };
}

/* ── Social Login Engine (Google & Facebook) ────────────────── */
let oauthConfigCache = null;
async function fetchOAuthConfig() {
    if (oauthConfigCache) return oauthConfigCache;
    try {
        const apiBase = (window.API_URL || window.API_BASE || `${window.location.origin}/api`).replace(/\/+$/, '');
        const res = await fetch(`${apiBase}/auth/oauth-config`);
        if (res.ok) {
            oauthConfigCache = await res.json();
            return oauthConfigCache;
        }
    } catch (e) {
        console.warn('OAuth config fetch warning:', e);
    }
    return { googleClientId: '', facebookAppId: '' };
}

async function handleGoogleAuthCredential(response) {
    if (!response || !response.credential) {
        showToast('Google məlumatı alına bilmədi', 'error');
        return;
    }
    const apiBase = (window.API_URL || window.API_BASE || `${window.location.origin}/api`).replace(/\/+$/, '');
    try {
        const res = await fetch(`${apiBase}/auth/google`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential, rememberMe: true })
        });
        const data = await res.json();
        if (!res.ok) {
            showToast(data.message || 'Google ilə giriş xətası', 'error');
            return;
        }
        onLoginSuccess(data.accessToken || data.token, data.user || data, true, 'cabinet.html');
    } catch (err) {
        console.error('Google auth error:', err);
        showToast('Serverlə əlaqə yaradılmadı', 'error');
    }
}

async function handleSocialLoginClick(provider) {
    const isGoogle = provider === 'google';
    const cfg = await fetchOAuthConfig();

    if (isGoogle && cfg.googleClientId && window.google?.accounts?.id) {
        try {
            window.google.accounts.id.initialize({
                client_id: cfg.googleClientId,
                callback: handleGoogleAuthCredential,
                auto_select: false
            });
            window.google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    openSocialLoginModal(provider);
                }
            });
            return;
        } catch (e) {
            console.warn('Google prompt fallback:', e);
        }
    }

    openSocialLoginModal(provider);
}

function openSocialLoginModal(provider) {
    const isGoogle = provider === 'google';
    const title = isGoogle ? 'Google ilə Giriş' : 'Facebook ilə Giriş';
    const iconClass = isGoogle ? 'fab fa-google' : 'fab fa-facebook-f';
    const iconColor = isGoogle ? '#EA4335' : '#1877F2';
    const btnText = isGoogle ? 'Google ilə Daxil Ol' : 'Facebook ilə Daxil Ol';
    const defaultEmail = localStorage.getItem('savedEmail') || localStorage.getItem('userEmail') || '';

    let modal = document.getElementById('socialOAuthModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'socialOAuthModal';
        modal.className = 'auth-modal';
        modal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); backdrop-filter:blur(5px); z-index:99999; justify-content:center; align-items:center; padding:16px; box-sizing:border-box;';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div style="background:var(--card-bg, #fff); color:var(--text-color, #111); border-radius:16px; padding:2rem; width:100%; max-width:420px; box-shadow:0 20px 40px rgba(0,0,0,0.25); text-align:center; position:relative;">
            <div style="width:58px; height:58px; border-radius:50%; background:rgba(124,58,237,0.08); display:flex; align-items:center; justify-content:center; margin:0 auto 1rem auto;">
                <i class="${iconClass}" style="font-size:1.9rem; color:${iconColor};"></i>
            </div>
            <h3 style="margin:0 0 0.5rem 0; font-size:1.25rem; font-weight:700;">${title}</h3>
            <p style="margin:0 0 1.25rem 0; font-size:0.88rem; color:var(--text-secondary, #666); line-height:1.45;">
                Hesabınızı təsdiqləmək və birbaşa daxil olmaq üçün məlumatlarınızı daxil edin.
            </p>
            <form id="socialOAuthForm" style="display:flex; flex-direction:column; gap:12px; text-align:left;">
                <div>
                    <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px; color:var(--text-secondary, #555);">Email ünvanı</label>
                    <input type="email" id="socialOAuthEmail" placeholder="hesabiniz@gmail.com" required value="${defaultEmail}"
                           style="width:100%; padding:10px 14px; border:1px solid var(--border-color, #ddd); border-radius:8px; font-size:0.95rem; background:var(--input-bg, #fff); color:var(--text-color, #111); box-sizing:border-box; outline:none;">
                </div>
                <div>
                    <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px; color:var(--text-secondary, #555);">Ad və Soyad</label>
                    <input type="text" id="socialOAuthName" placeholder="Adınız Soyadınız"
                           style="width:100%; padding:10px 14px; border:1px solid var(--border-color, #ddd); border-radius:8px; font-size:0.95rem; background:var(--input-bg, #fff); color:var(--text-color, #111); box-sizing:border-box; outline:none;">
                </div>
                <button type="submit" id="socialOAuthSubmitBtn" class="auth-submit-btn" style="margin-top:8px; width:100%; height:44px;">
                    <span class="btn-text">${btnText}</span>
                    <span class="btn-spinner"></span>
                </button>
                <button type="button" onclick="document.getElementById('socialOAuthModal').style.display='none';"
                        style="background:none; border:none; color:var(--text-secondary, #777); font-size:0.88rem; padding:8px; cursor:pointer; text-align:center;">
                    Bağla
                </button>
            </form>
        </div>
    `;

    modal.style.display = 'flex';
    const form = document.getElementById('socialOAuthForm');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('socialOAuthEmail')?.value.trim();
        const name = document.getElementById('socialOAuthName')?.value.trim() || email.split('@')[0];
        if (!email || !email.includes('@')) {
            showToast('Düzgün email daxil edin', 'error');
            return;
        }

        const submitBtn = document.getElementById('socialOAuthSubmitBtn');
        setLoading(submitBtn, true);
        try {
            const apiBase = (window.API_URL || window.API_BASE || `${window.location.origin}/api`).replace(/\/+$/, '');
            const endpoint = isGoogle ? `${apiBase}/auth/google` : `${apiBase}/auth/facebook`;
            const payload = isGoogle
                ? { email, name, googleId: 'g_' + Math.random().toString(36).slice(2, 12), rememberMe: true }
                : { email, name, userID: 'fb_' + Math.random().toString(36).slice(2, 12), rememberMe: true };

            const res = await fetch(endpoint, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.message || 'Xəta baş verdi', 'error');
                return;
            }
            modal.style.display = 'none';
            showToast(`${isGoogle ? 'Google' : 'Facebook'} ilə uğurlu giriş!`, 'success');
            onLoginSuccess(data.accessToken || data.token, data.user || data, true, 'cabinet.html');
        } catch (err) {
            console.error('Social auth submit error:', err);
            showToast('Serverlə əlaqə yaradılmadı. Yenidən cəhd edin.', 'error');
        } finally {
            setLoading(submitBtn, false);
        }
    };
}

if (typeof window !== 'undefined') {
    window.COUNTRY_PHONE_CONFIGS = COUNTRY_PHONE_CONFIGS;
    window.setupPhoneInputMask = setupPhoneInputMask;
    window.validatePhoneNumber = validatePhoneNumber;
    window.handleSocialLoginClick = handleSocialLoginClick;
    window.openSocialLoginModal = openSocialLoginModal;
}

/* ── Login: Send SMS ────────────────────────────────────────── */
async function sendLoginSMS() {
    const phoneCheck = validatePhoneNumber('loginPhone', 'loginPhonePrefix');
    if (!phoneCheck.valid) {
        showToast(phoneCheck.message, 'error');
        return;
    }
    const phone = phoneCheck.fullPhone;

    const btn = document.getElementById('sendSmsLoginBtn');
    setLoading(btn, true);

    try {
        // Simulate sending (replace with real API call)
        await new Promise(r => setTimeout(r, 1200));
        document.getElementById('smsPhoneDisplay').textContent = phone;
        document.getElementById('smsStep1').style.display = 'none';
        document.getElementById('smsStep2').classList.add('visible');
        wireOtpInputs('smsOtpInputs');
        startCountdown('smsTimer', 'smsResendBtn');
        showToast('SMS kodu göndərildi!', 'success');
    } catch(e) {
        showToast('Xəta baş verdi. Yenidən cəhd edin.', 'error');
    } finally {
        setLoading(btn, false);
    }
}

function resendLoginSMS() {
    clearOtp('smsOtpInputs');
    startCountdown('smsTimer', 'smsResendBtn');
    showToast('SMS kodu yenidən göndərildi', 'info');
}

function backToSmsStep1() {
    document.getElementById('smsStep1').style.display = 'block';
    document.getElementById('smsStep2').classList.remove('visible');
    clearOtp('smsOtpInputs');
}

/* ── Login: Send Email code ─────────────────────────────────── */
async function sendLoginEmail() {
    const email = document.getElementById('loginEmailCode')?.value.trim();
    if (!email || !email.includes('@')) { showToast('Düzgün email daxil edin', 'error'); return; }

    const btn = document.getElementById('sendEmailLoginBtn');
    setLoading(btn, true);

    try {
        await new Promise(r => setTimeout(r, 1200));
        document.getElementById('emailAddressDisplay').textContent = email;
        document.getElementById('emailStep1').style.display = 'none';
        document.getElementById('emailStep2').classList.add('visible');
        wireOtpInputs('emailOtpInputs');
        startCountdown('emailTimer', 'emailResendBtn');
        showToast('Email kodu göndərildi!', 'success');
    } catch(e) {
        showToast('Xəta baş verdi. Yenidən cəhd edin.', 'error');
    } finally {
        setLoading(btn, false);
    }
}

function resendLoginEmail() {
    clearOtp('emailOtpInputs');
    startCountdown('emailTimer', 'emailResendBtn');
    showToast('Email kodu yenidən göndərildi', 'info');
}

function backToEmailStep1() {
    document.getElementById('emailStep1').style.display = 'block';
    document.getElementById('emailStep2').classList.remove('visible');
    clearOtp('emailOtpInputs');
}

/* ── Forgot password flow ───────────────────────────────────── */
// FIX AUTH-005: Redirect to existing forgot-password.html instead of fake toast
function openForgotFlow(e) {
    if (e && e.preventDefault) e.preventDefault();
    window.location.href = 'forgot-password.html';
}

/* ── Signup method switcher ─────────────────────────────────── */
function switchSignupMethod(method) {
    document.querySelectorAll('#signupMethodTabs .verify-method-btn').forEach(b => b.classList.remove('active'));

    if (method === 'phone') {
        document.getElementById('phoneSignupForm').style.display = 'block';
        document.getElementById('emailSignupForm').style.display = 'none';
        document.getElementById('smethodPhone').classList.add('active');
    } else {
        document.getElementById('emailSignupForm').style.display = 'block';
        document.getElementById('phoneSignupForm').style.display = 'none';
        document.getElementById('smethodEmail').classList.add('active');
        wireOtpInputs('signupEmailOtpInputs');
    }
    updateStepDots(1);
}

/* ── Step dots ──────────────────────────────────────────────── */
function updateStepDots(step) {
    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById('stepDot' + i);
        if (!dot) continue;
        dot.className = 'step-dot';
        if (i < step)  dot.classList.add('done');
        if (i === step) dot.classList.add('active');
    }
}

/* ── Signup: Send SMS ───────────────────────────────────────── */
async function sendSignupSMS() {
    const fn  = document.getElementById('signupFirstName')?.value.trim();
    const ln  = document.getElementById('signupLastName')?.value.trim();
    if (!fn || !ln) { showToast('Ad və soyad daxil edin', 'error'); return; }

    const phoneCheck = validatePhoneNumber('signupPhone', 'signupPhonePrefix');
    if (!phoneCheck.valid) {
        showToast(phoneCheck.message, 'error');
        return;
    }
    const phone = phoneCheck.fullPhone;
    const btn   = document.getElementById('sendPhoneSignupBtn');
    setLoading(btn, true);

    try {
        if (SMS_DEV_MODE) {
            showToast('Dev rejim: SMS bypass edildi, birbaşa şifrə təyininə keçid edilir', 'info');
            const s1 = document.getElementById('phoneSignupStep1');
            if (s1) s1.style.display = 'none';
            const s2 = document.getElementById('phoneSignupStep2');
            if (s2) {
                s2.style.display = 'none';
                s2.classList.remove('visible');
            }
            const s3 = document.getElementById('phoneSignupStep3');
            if (s3) {
                s3.style.display = 'block';
                s3.classList.add('visible');
            }
            const pvs = document.getElementById('phoneVerifyStep');
            if (pvs) pvs.style.display = 'none';
            const pps = document.getElementById('phonePasswordStep');
            if (pps) pps.style.display = 'block';
            updateStepDots(3);
            return;
        }

        await new Promise(r => setTimeout(r, 1200));
        document.getElementById('signupPhoneDisplay').textContent = phone;
        document.getElementById('phoneSignupStep1').style.display = 'none';
        document.getElementById('phoneSignupStep2').classList.add('visible');
        wireOtpInputs('signupSmsOtpInputs');
        startCountdown('signupSmsTimer', 'signupSmsResendBtn');
        showToast('SMS kodu göndərildi!', 'success');
        updateStepDots(2);
    } catch(e) {
        showToast('Xəta baş verdi. Yenidən cəhd edin.', 'error');
    } finally {
        setLoading(btn, false);
    }
}

function resendSignupSMS() {
    clearOtp('signupSmsOtpInputs');
    startCountdown('signupSmsTimer', 'signupSmsResendBtn');
    showToast('SMS kodu yenidən göndərildi', 'info');
}

function backToPhoneStep1() {
    document.getElementById('phoneSignupStep1').style.display = 'block';
    document.getElementById('phoneSignupStep2').classList.remove('visible');
    clearOtp('signupSmsOtpInputs');
    updateStepDots(1);
}

async function verifySignupSMS() {
    const otp = getOtpValue('signupSmsOtpInputs');
    if (otp.length < 6) { showToast('6 rəqəmli kodu daxil edin', 'error'); return; }

    const btn = document.getElementById('verifyPhoneSignupBtn');
    setLoading(btn, true);

    try {
        await new Promise(r => setTimeout(r, 1000));
        // In production, verify with API: POST /api/auth/verify-phone { phone, otp }
        document.getElementById('phoneSignupStep2').classList.remove('visible');
        document.getElementById('phoneSignupStep3').classList.add('visible');
        showToast('Nömrəniz uğurla təsdiqləndi!', 'success');
        updateStepDots(3);
    } catch(e) {
        showToast('Yanlış kod. Yenidən cəhd edin.', 'error');
    } finally {
        setLoading(btn, false);
    }
}

/* ── Signup: Send Email code ────────────────────────────────── */
async function sendSignupEmail() {
    const fn    = document.getElementById('signupFirstNameE')?.value.trim();
    const ln    = document.getElementById('signupLastNameE')?.value.trim();
    const email = document.getElementById('signupEmailVerify')?.value.trim();

    if (!fn || !ln)                        { showToast('Ad və soyad daxil edin', 'error'); return; }
    if (!email || !email.includes('@'))    { showToast('Düzgün email daxil edin', 'error'); return; }

    const btn = document.getElementById('sendEmailSignupBtn');
    setLoading(btn, true);

    try {
        await new Promise(r => setTimeout(r, 1200));
        document.getElementById('signupEmailDisplay').textContent = email;
        document.getElementById('emailSignupStep1').style.display = 'none';
        document.getElementById('emailSignupStep2').classList.add('visible');
        wireOtpInputs('signupEmailOtpInputs');
        startCountdown('signupEmailTimer', 'signupEmailResendBtn');
        showToast('Email kodu göndərildi!', 'success');
        updateStepDots(2);
    } catch(e) {
        showToast('Xəta baş verdi. Yenidən cəhd edin.', 'error');
    } finally {
        setLoading(btn, false);
    }
}

function resendSignupEmail() {
    clearOtp('signupEmailOtpInputs');
    startCountdown('signupEmailTimer', 'signupEmailResendBtn');
    showToast('Email kodu yenidən göndərildi', 'info');
}

function backToEmailSignupStep1() {
    document.getElementById('emailSignupStep1').style.display = 'block';
    document.getElementById('emailSignupStep2').classList.remove('visible');
    clearOtp('signupEmailOtpInputs');
    updateStepDots(1);
}

async function verifySignupEmail() {
    const otp = getOtpValue('signupEmailOtpInputs');
    if (otp.length < 6) { showToast('6 rəqəmli kodu daxil edin', 'error'); return; }

    const btn = document.getElementById('verifyEmailSignupBtn');
    setLoading(btn, true);

    try {
        await new Promise(r => setTimeout(r, 1000));
        document.getElementById('emailSignupStep2').classList.remove('visible');
        document.getElementById('emailSignupStep3').classList.add('visible');
        showToast('Email uğurla təsdiqləndi!', 'success');
        updateStepDots(3);
    } catch(e) {
        showToast('Yanlış kod. Yenidən cəhd edin.', 'error');
    } finally {
        setLoading(btn, false);
    }
}

/* ── Init on DOM ready ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    // Wire all OTP input groups that exist on current page
    // Setup professional phone masking
    setupPhoneInputMask('loginPhone', 'loginPhonePrefix');
    setupPhoneInputMask('signupPhone', 'signupPhonePrefix');
    setupPhoneInputMask('signupPhoneOptional', 'signupPhoneOptionalPrefix');

    // Setup social login click handlers
    document.getElementById('loginGoogleBtn')?.addEventListener('click', (e) => { e.preventDefault(); handleSocialLoginClick('google'); });
    document.getElementById('signupGoogleBtn')?.addEventListener('click', (e) => { e.preventDefault(); handleSocialLoginClick('google'); });
    document.getElementById('loginFacebookBtn')?.addEventListener('click', (e) => { e.preventDefault(); handleSocialLoginClick('facebook'); });
    document.getElementById('signupFacebookBtn')?.addEventListener('click', (e) => { e.preventDefault(); handleSocialLoginClick('facebook'); });

    // Pre-fetch OAuth config
    fetchOAuthConfig();

    ['smsOtpInputs','emailOtpInputs','signupSmsOtpInputs','signupEmailOtpInputs'].forEach(id => {
        if (document.getElementById(id)) wireOtpInputs(id);
    });

    const passwordLoginForm = document.getElementById('passwordLoginForm');
    if (passwordLoginForm) {
        passwordLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const identifier = document.getElementById('loginIdentifier')?.value.trim();
            const password = document.getElementById('loginPassword')?.value || '';
            const rememberMe = document.getElementById('rememberMe') ? document.getElementById('rememberMe').checked : true;
            if (!identifier || !password) {
                showToast('Email/istifadəçi adı və şifrəni daxil edin', 'error');
                return;
            }

            const btn = document.getElementById('passwordLoginBtn');
            setLoading(btn, true);

            try {
                const loginPayload = { email: identifier, password, rememberMe };
                const apiBase = (window.API_URL || window.API_BASE || (window.location && window.location.origin ? `${window.location.origin}/api` : 'http://localhost:5000/api')).replace(/\/+$/, '');
                const res = await fetch(`${apiBase}/auth/login`, {
                    credentials: 'include',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(loginPayload)
                });

                const data = await res.json();
                if (!res.ok) {
                    if (data.requiresOtp || data.requiresTwoFactor) {
                        const msgEl = document.getElementById('twoFactorMessage');
                        if (msgEl) {
                            msgEl.textContent = data.message || 'Kodu daxil edin';
                            if (data.devCode) {
                                msgEl.innerHTML = (data.message || 'Kodu daxil edin') +
                                    '<br><div style="margin-top:8px;padding:6px 12px;background:rgba(124,58,237,0.1);color:#7c3aed;border-radius:6px;font-weight:600;font-size:0.95rem;">Giriş kodu: <strong>' + data.devCode + '</strong></div>';
                            }
                        }
                        const codeInput = document.getElementById('twoFactorCode');
                        if (codeInput) {
                            codeInput.value = data.devCode || '';
                            setTimeout(() => codeInput.focus(), 100);
                        }
                        document.getElementById('twoFactorModal').style.display = 'flex';
                        
                        const twoFactorForm = document.getElementById('twoFactorForm');
                        twoFactorForm.onsubmit = async (e2) => {
                            e2.preventDefault();
                            const otpCode = document.getElementById('twoFactorCode').value.trim();
                            if (!otpCode) {
                                showToast('Kodu daxil edin', 'error');
                                return;
                            }
                            const verifyBtn = document.getElementById('twoFactorVerifyBtn');
                            setLoading(verifyBtn, true);
                            try {
                                const apiBase = (window.API_URL || window.API_BASE || (window.location && window.location.origin ? `${window.location.origin}/api` : 'http://localhost:5000/api')).replace(/\/+$/, '');
                                const secondRes = await fetch(`${apiBase}/auth/login`, {
                                    credentials: 'include',
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ ...loginPayload, otpCode, rememberMe })
                                });
                                const secondData = await secondRes.json();
                                if (!secondRes.ok) {
                                    showToast(secondData.message || 'Yanlış kod', 'error');
                                    return;
                                }
                                function getSafeRedirectTarget(fallback = 'cabinet.html') {
                                    try {
                                        const redirect = new URLSearchParams(window.location.search).get('redirect');
                                        if (redirect
                                            && /^[a-zA-Z0-9_\-\/]+\.html(\?[a-zA-Z0-9_\-=&%~.+]*)*$/.test(redirect)
                                            && !/^(\/\/|https?:)/i.test(redirect)
                                            && !/^(javascript|data|vbscript):/i.test(redirect)
                                            && !/\\/.test(redirect)) {
                                            return redirect;
                                        }
                                    } catch (e) {}
                                    return fallback;
                                }

                                document.getElementById('twoFactorModal').style.display = 'none';
                                const redirectTarget = secondData.role === 'admin' || secondData.user?.role === 'admin' ? 'admin.html' : getSafeRedirectTarget('cabinet.html');
                                onLoginSuccess(secondData.accessToken || secondData.token, secondData.user || secondData, rememberMe, redirectTarget);
                            } catch (err) {
                                console.error('Login 2FA fetch error:', err);
                                showToast('Serverlə əlaqə yaradılmadı. Yenidən cəhd edin.', 'error');
                            } finally {
                                setLoading(verifyBtn, false);
                            }
                        };
                        return;
                    }
                    if (data.requiresTwoFactorEnrollment) {
                        showToast(data.message || 'Bu hesab üçün 2FA aktiv edilməlidir', 'error');
                        return;
                    }
                    showToast(data.message || 'Email və ya şifrə yanlışdır', 'error');
                    return;
                }

                function getSafeRedirectTarget(fallback = 'cabinet.html') {
                    try {
                        const redirect = new URLSearchParams(window.location.search).get('redirect');
                        if (redirect
                            && /^[a-zA-Z0-9_\-\/]+\.html(\?[a-zA-Z0-9_\-=&%~.+]*)*$/.test(redirect)
                            && !/^(\/\/|https?:)/i.test(redirect)
                            && !/^(javascript|data|vbscript):/i.test(redirect)
                            && !/\\/.test(redirect)) {
                            return redirect;
                        }
                    } catch (e) {}
                    return fallback;
                }

                const redirectTarget = data.role === 'admin' || data.user?.role === 'admin' ? 'admin.html' : getSafeRedirectTarget('cabinet.html');
                onLoginSuccess(data.accessToken || data.token, data.user || data, rememberMe, redirectTarget);
            } catch (err) {
                console.error('Login fetch error:', err);
                showToast('Serverlə əlaqə yaradılmadı. Yenidən cəhd edin.', 'error');
            } finally {
                setLoading(btn, false);
            }
        });
    }

    // SMS login form submit (OTP verify)
    const smsForm = document.getElementById('smsLoginForm');
    if (smsForm) {
        smsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otp = getOtpValue('smsOtpInputs');
            if (otp.length < 6) { showToast('6 rəqəmli kodu daxil edin', 'error'); return; }
            showToast('SMS ilə giriş hələ backend-ə qoşulmayıb. Şifrə ilə giriş edin.', 'info');
        });
    }

    // Email login form submit (OTP verify)
    const emailForm = document.getElementById('emailLoginForm');
    if (emailForm) {
        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otp = getOtpValue('emailOtpInputs');
            if (otp.length < 6) { showToast('6 rəqəmli kodu daxil edin', 'error'); return; }
            showToast('Email kodu ilə giriş hələ backend-ə qoşulmayıb. Şifrə ilə giriş edin.', 'info');
        });
    }

    // Phone signup finalize
    const phoneSignupForm = document.getElementById('phoneSignupForm');
    if (phoneSignupForm) {
        phoneSignupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pwd  = document.getElementById('signupPassword')?.value;
            const conf = document.getElementById('signupConfirm')?.value;
            const terms = document.getElementById('signupTermsPhone')?.checked;

            if (pwd !== conf)  { showToast('Şifrələr uyğun gəlmir!', 'error'); return; }
            if (!terms)        { showToast('Şərtləri qəbul edin', 'error'); return; }
            const pwdError = validateClientPassword(pwd);
            if (pwdError)      { showToast(pwdError, 'error'); return; }

            const btn = document.getElementById('finalPhoneSignupBtn');
            setLoading(btn, true);
            try {
                const phoneCheck = validatePhoneNumber('signupPhone', 'signupPhonePrefix');
            if (!phoneCheck.valid) {
                showToast(phoneCheck.message, 'error');
                setLoading(btn, false);
                return;
            }
            const body   = {
                name:     document.getElementById('signupFirstName')?.value.trim(),
                lastName: document.getElementById('signupLastName')?.value.trim(),
                phone:    phoneCheck.fullPhone,
                    email:    document.getElementById('signupEmailOptional')?.value.trim() || undefined,
                    password: pwd
                };
                const res  = await fetch(`${window.API_URL}/auth/register`, { method:'POST', credentials: 'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
                const data = await res.json();
                if (!res.ok) {
                    const errorText = Array.isArray(data.errors) && data.errors.length > 0 ? data.errors.join('. ') : (data.message || 'Qeydiyyat xətası');
                    showToast(errorText, 'error');
                    return;
                }
                persistSession(data);
                showToast('Qeydiyyat tamamlandı!', 'success');
                setTimeout(() => window.location.href = 'cabinet.html', 1200);
            } catch(err) {
                console.error('Phone signup fetch error:', err);
                showToast('Serverlə əlaqə yaradılmadı', 'error');
            } finally { setLoading(btn, false); }
        });
    }

    // Email signup finalize
    const emailSignupForm = document.getElementById('emailSignupForm');
    if (emailSignupForm) {
        emailSignupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pwd   = document.getElementById('signupPasswordE')?.value;
            const conf  = document.getElementById('signupConfirmE')?.value;
            const terms = document.getElementById('signupTermsEmail')?.checked;

            if (pwd !== conf)  { showToast('Şifrələr uyğun gəlmir!', 'error'); return; }
            if (!terms)        { showToast('Şərtləri qəbul edin', 'error'); return; }
            const pwdError = validateClientPassword(pwd);
            if (pwdError)      { showToast(pwdError, 'error'); return; }

            const btn = document.getElementById('finalEmailSignupBtn');
            setLoading(btn, true);
            try {
                const body = {
                    name:     document.getElementById('signupFirstNameE')?.value.trim(),
                    lastName: document.getElementById('signupLastNameE')?.value.trim(),
                    email:    document.getElementById('signupEmailVerify')?.value.trim(),
                phone:    (() => {
                    const el = document.getElementById('signupPhoneOptional');
                    if (!el || !el.value.trim()) return undefined;
                    const chk = validatePhoneNumber('signupPhoneOptional', 'signupPhoneOptionalPrefix');
                    return chk.valid ? chk.fullPhone : undefined;
                })(),
                password: pwd
                };
                const res  = await fetch(`${window.API_URL}/auth/register`, { method:'POST', credentials: 'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
                const data = await res.json();
                if (!res.ok) {
                    const errorText = Array.isArray(data.errors) && data.errors.length > 0 ? data.errors.join('. ') : (data.message || 'Qeydiyyat xətası');
                    showToast(errorText, 'error');
                    return;
                }
                persistSession(data);
                showToast('Qeydiyyat tamamlandı!', 'success');
                setTimeout(() => window.location.href = 'cabinet.html', 1200);
            } catch(err) {
                console.error('Email signup fetch error:', err);
                showToast('Serverlə əlaqə yaradılmadı', 'error');
            } finally { setLoading(btn, false); }
        });
    }

    // Forgot password form submit
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgotEmail')?.value.trim();
            if (!email || !email.includes('@')) {
                showToast('Düzgün email daxil edin', 'error');
                return;
            }

            const btn = document.getElementById('forgotSubmitBtn');
            setLoading(btn, true);

            try {
                const res = await fetch(`${window.API_URL}/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();
                if (!res.ok) {
                    showToast(data.message || 'Xəta baş verdi', 'error');
                    return;
                }
                showToast(data.message || 'Sıfırlama linki göndərildi', 'success');
                forgotPasswordForm.reset();
            } catch (err) {
                console.error('Forgot password fetch error:', err);
                showToast('Serverlə əlaqə yaradılmadı', 'error');
            } finally {
                setLoading(btn, false);
            }
        });
    }

    // Reset password form submit
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            if (!token) {
                showToast('Keçərsiz və ya vaxtı keçmiş token', 'error');
                return;
            }

            const newPassword = document.getElementById('resetPassword')?.value;
            const confirmResetPassword = document.getElementById('confirmResetPassword')?.value;

            if (!newPassword || !confirmResetPassword) {
                showToast('Şifrələri daxil edin', 'error');
                return;
            }
            if (newPassword !== confirmResetPassword) {
                showToast('Şifrələr uyğun gəlmir!', 'error');
                return;
            }
            const pwdError = validateClientPassword(newPassword);
            if (pwdError) {
                showToast(pwdError, 'error');
                return;
            }

            const btn = document.getElementById('resetSubmitBtn');
            setLoading(btn, true);

            try {
                const res = await fetch(`${window.API_URL}/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, newPassword })
                });
                const data = await res.json();
                if (!res.ok) {
                    const errorText = Array.isArray(data.errors) && data.errors.length > 0 ? data.errors.join('. ') : (data.message || 'Keçərsiz və ya vaxtı keçmiş token');
                    showToast(errorText, 'error');
                    return;
                }
                showToast(data.message || 'Şifrə uğurla yeniləndi', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } catch (err) {
                console.error('Reset password fetch error:', err);
                showToast('Serverlə əlaqə yaradılmadı', 'error');
            } finally {
                setLoading(btn, false);
            }
        });
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SMS_DEV_MODE,
        getStoredToken,
        persistSession
    };
}

"use strict";

/* ============================================================
   auth-otp.js  –  Shared helpers for login & signup OTP flows
   ============================================================ */

window.API_URL = window.API_URL || localStorage.getItem('apiUrl') || 'http://localhost:5000/api';

const SMS_DEV_MODE = true; // TODO: false when SMS paid
const SMS_DEV_WARNING = 'SMS xidməti hazırda texniki profilaktikadadır. Zəhmət olmasa şifrə ilə daxil olun.';

// FIX AUTH-006: Dual-write session persistence to prevent redirect loops
function persistSession(data) {
    const token = data?.token || data?.accessToken;
    if (!token) return;
    
    const userPayload = {
        id: data._id || data.id || data.user?._id || data.user?.id,
        name: data.name || data.user?.name || '',
        lastName: data.lastName || data.user?.lastName || '',
        email: data.email || data.user?.email || '',
        phone: data.phone || data.user?.phone || '',
        role: data.role || data.user?.role || 'user',
        avatar: data.avatar || data.user?.avatar || ''
    };
    
    const isRemember = document.getElementById('rememberMe')?.checked;
    
    // Always write to sessionStorage (current tab session, fixes pages that check sessionStorage)
    try {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(userPayload));
        sessionStorage.setItem('authToken', token); // compat for old code
    } catch(e) {}
    
    // Write to localStorage if rememberMe checked or checkbox doesn't exist (default remember per AUTH-004)
    if (isRemember || isRemember === undefined) {
        try {
            localStorage.setItem('token', token);
            localStorage.setItem('authToken', token); // compat
            localStorage.setItem('user', JSON.stringify(userPayload));
            localStorage.setItem('mobilaz_current_user', JSON.stringify(userPayload)); // compat for cabinet.js
            localStorage.setItem('mobilaz_user', JSON.stringify(userPayload));
        } catch(e) {}
    }
    
    // Also set via centralized helper if exists
    if (typeof window.setAuthToken === 'function') {
        try { window.setAuthToken(token); } catch(e) {}
    }
}
window.persistSession = persistSession;
window.persistAuthSession = persistSession;

function clearSession() {
    try {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminUser');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('mobilaz_current_user');
        localStorage.removeItem('mobilaz_user');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
    } catch(e) {}
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
function togglePwd(inputId, iconId) {
    const inp  = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!inp) return;
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
    resendEl.innerHTML = `${authT('auth-resend', 'Yenidən göndər')} (<span class="otp-timer" id="${timerSpanId}">${s}</span>s)`;
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

/* ── Login: Send SMS ────────────────────────────────────────── */
async function sendLoginSMS() {
    const prefix = document.getElementById('loginPhonePrefix')?.value || '+994';
    const number = document.getElementById('loginPhone')?.value.trim();
    if (!number) { showToast('Telefon nömrəsini daxil edin', 'error'); return; }
    const phone = prefix + number.replace(/\s/g, '');

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
    const pre = document.getElementById('signupPhonePrefix')?.value || '+994';
    const num = document.getElementById('signupPhone')?.value.trim();

    if (!fn || !ln) { showToast('Ad və soyad daxil edin', 'error'); return; }
    if (!num)       { showToast('Telefon nömrəsini daxil edin', 'error'); return; }

    const phone = pre + num.replace(/\s/g, '');
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
    ['smsOtpInputs','emailOtpInputs','signupSmsOtpInputs','signupEmailOtpInputs'].forEach(id => {
        if (document.getElementById(id)) wireOtpInputs(id);
    });

    const passwordLoginForm = document.getElementById('passwordLoginForm');
    if (passwordLoginForm) {
        passwordLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const identifier = document.getElementById('loginIdentifier')?.value.trim();
            const password = document.getElementById('loginPassword')?.value || '';
            if (!identifier || !password) {
                showToast('Email/istifadəçi adı və şifrəni daxil edin', 'error');
                return;
            }

            const btn = document.getElementById('passwordLoginBtn');
            setLoading(btn, true);

            try {
                const loginPayload = { email: identifier, password };
                const res = await fetch(`${window.API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(loginPayload)
                });

                const data = await res.json();
                if (!res.ok) {
                    if (data.requiresOtp || data.requiresTwoFactor) {
                        document.getElementById('twoFactorMessage').textContent = data.message || 'Kodu daxil edin';
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
                                const secondRes = await fetch(`${window.API_URL}/auth/login`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ ...loginPayload, otpCode })
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
                                persistSession(secondData);
                                showToast('Uğurla daxil oldunuz!', 'success');
                                const redirectTarget = secondData.role === 'admin' ? 'admin.html' : getSafeRedirectTarget('cabinet.html');
                                setTimeout(() => window.location.href = redirectTarget, 900);
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

                persistSession(data);
                showToast('Uğurla daxil oldunuz!', 'success');
                // Redirect admin users to the admin panel, others to cabinet or safe redirect target
                const redirectTarget = data.role === 'admin' ? 'admin.html' : getSafeRedirectTarget('cabinet.html');
                setTimeout(() => window.location.href = redirectTarget, 900);
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
                const prefix = document.getElementById('signupPhonePrefix')?.value || '+994';
                const num    = document.getElementById('signupPhone')?.value.trim().replace(/\s/g,'');
                const body   = {
                    name:     document.getElementById('signupFirstName')?.value.trim(),
                    lastName: document.getElementById('signupLastName')?.value.trim(),
                    phone:    prefix + num,
                    email:    document.getElementById('signupEmailOptional')?.value.trim() || undefined,
                    password: pwd
                };
                const res  = await fetch(`${window.API_URL}/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
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
                    phone:    document.getElementById('signupPhoneOptional')?.value.trim() || undefined,
                    password: pwd
                };
                const res  = await fetch(`${window.API_URL}/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
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
            if (!setLoading(btn, true)) return;

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
            if (!setLoading(btn, true)) return;

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

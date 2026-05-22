"use strict";

/* ============================================================
   auth-otp.js  –  Shared helpers for login & signup OTP flows
   ============================================================ */



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
    if (lang !== 'AZ' && toastTranslations[lang] && toastTranslations[lang][msg]) {
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
    const labels = ['', 'Zəif', 'Orta', 'Yaxşı', 'Güclü'];
    fill.className = `strength-fill ${levels[score] || ''}`;
    text.textContent = val.length ? labels[score] || 'Zəif' : '';
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
    resendEl.innerHTML = `Yenidən göndər (<span class="otp-timer" id="${timerSpanId}">${s}</span>s)`;
    const iv = setInterval(() => {
        s--;
        const t = document.getElementById(timerSpanId);
        if (t) t.textContent = s;
        if (s <= 0) {
            clearInterval(iv);
            resendEl.disabled = false;
            resendEl.textContent = 'Yenidən göndər';
        }
    }, 1000);
}

/* ── Login method switcher ──────────────────────────────────── */
function switchLoginMethod(method) {
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
function openForgotFlow(e) {
    e.preventDefault();
    showToast('Şifrə sıfırlama linki email-ə göndəriləcək. Yaxında həyata keçiriləcək.', 'info');
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

    // SMS login form submit (OTP verify)
    const smsForm = document.getElementById('smsLoginForm');
    if (smsForm) {
        smsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otp = getOtpValue('smsOtpInputs');
            if (otp.length < 6) { showToast('6 rəqəmli kodu daxil edin', 'error'); return; }
            const btn = document.getElementById('verifySmsLoginBtn');
            setLoading(btn, true);
            try {
                const phone = (document.getElementById('loginPhonePrefix')?.value || '+994')
                            + (document.getElementById('loginPhone')?.value.trim().replace(/\s/g,'') || '');
                // Production: POST /api/auth/verify-otp { phone, otp }
                await new Promise(r => setTimeout(r, 1000));
                showToast('Uğurla daxil oldunuz!', 'success');
                setTimeout(() => window.location.href = 'cabinet.html', 1200);
            } catch(err) {
                showToast('Yanlış kod', 'error');
            } finally { setLoading(btn, false); }
        });
    }

    // Email login form submit (OTP verify)
    const emailForm = document.getElementById('emailLoginForm');
    if (emailForm) {
        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otp = getOtpValue('emailOtpInputs');
            if (otp.length < 6) { showToast('6 rəqəmli kodu daxil edin', 'error'); return; }
            const btn = document.getElementById('verifyEmailLoginBtn');
            setLoading(btn, true);
            try {
                await new Promise(r => setTimeout(r, 1000));
                showToast('Uğurla daxil oldunuz!', 'success');
                setTimeout(() => window.location.href = 'cabinet.html', 1200);
            } catch(err) {
                showToast('Yanlış kod', 'error');
            } finally { setLoading(btn, false); }
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
            if (pwd.length < 6){ showToast('Şifrə ən azı 6 simvol olmalıdır', 'error'); return; }

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
                if (!res.ok) { showToast(data.message || 'Qeydiyyat xətası', 'error'); return; }
                localStorage.setItem('token', data.token);
                localStorage.setItem('mobilaz_current_user', JSON.stringify(data));
                if (window.updateNavbar) window.updateNavbar();
                showToast('Qeydiyyat tamamlandı!', 'success');
                setTimeout(() => window.location.href = 'cabinet.html', 1200);
            } catch(err) {
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
            if (pwd.length < 6){ showToast('Şifrə ən azı 6 simvol olmalıdır', 'error'); return; }

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
                if (!res.ok) { showToast(data.message || 'Qeydiyyat xətası', 'error'); return; }
                localStorage.setItem('token', data.token);
                localStorage.setItem('mobilaz_current_user', JSON.stringify(data));
                if (window.updateNavbar) window.updateNavbar();
                showToast('Qeydiyyat tamamlandı!', 'success');
                setTimeout(() => window.location.href = 'cabinet.html', 1200);
            } catch(err) {
                showToast('Serverlə əlaqə yaradılmadı', 'error');
            } finally { setLoading(btn, false); }
        });
    }
});

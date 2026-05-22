const fs = require('fs');

const baseDir = 'c:/Users/Gadirov/Desktop/AiryPhone - COPY/Front end/';

// 1. Add data-translate attributes to login.html
let loginHtml = fs.readFileSync(baseDir + 'login.html', 'utf8');

const loginReplacements = [
    ['<h1 class="auth-brand-title">Xoş gəldiniz!</h1>', '<h1 class="auth-brand-title" data-translate="auth-welcome">Xoş gəldiniz!</h1>'],
    ['<p class="auth-brand-sub">Azərbaycanın ən böyük telefon bazarına daxil olun.</p>', '<p class="auth-brand-sub" data-translate="auth-brand-sub">Azərbaycanın ən böyük telefon bazarına daxil olun.</p>'],
    ['<span>SSL ilə qorunan giriş</span>', '<span data-translate="auth-feat-1">SSL ilə qorunan giriş</span>'],
    ['<span>Sürətli və etibarlı</span>', '<span data-translate="auth-feat-2">Sürətli və etibarlı</span>'],
    ['<span>50,000+ telefon elanı</span>', '<span data-translate="auth-feat-3">50,000+ telefon elanı</span>'],
    ['<span>24/7 dəstək xidməti</span>', '<span data-translate="auth-feat-4">24/7 dəstək xidməti</span>'],
    ['<button class="auth-tab-btn active" role="tab" onclick="window.location.href=\'login.html\'">Giriş</button>', '<button class="auth-tab-btn active" role="tab" onclick="window.location.href=\'login.html\'" data-translate="auth-tab-login">Giriş</button>'],
    ['<button class="auth-tab-btn" role="tab" onclick="window.location.href=\'signup.html\'">Qeydiyyat</button>', '<button class="auth-tab-btn" role="tab" onclick="window.location.href=\'signup.html\'" data-translate="auth-tab-signup">Qeydiyyat</button>'],
    ['<h2 class="auth-heading">Hesaba Giriş</h2>', '<h2 class="auth-heading" data-translate="auth-heading-login">Hesaba Giriş</h2>'],
    ['<p class="auth-subheading">Hesabınıza daxil olmaq üçün üsul seçin</p>', '<p class="auth-subheading" data-translate="auth-subheading-login">Hesabınıza daxil olmaq üçün üsul seçin</p>'],
    ['<p class="verify-method-label">Giriş üsulu</p>', '<p class="verify-method-label" data-translate="auth-method-label">Giriş üsulu</p>'],
    ['<i class="fas fa-lock"></i> Şifrə', '<i class="fas fa-lock"></i> <span data-translate="auth-method-pwd">Şifrə</span>'],
    ['<i class="fas fa-mobile-alt"></i> SMS Kodu', '<i class="fas fa-mobile-alt"></i> <span data-translate="auth-method-sms">SMS Kodu</span>'],
    ['<i class="fas fa-envelope"></i> Email Kodu', '<i class="fas fa-envelope"></i> <span data-translate="auth-method-email">Email Kodu</span>'],
    ['<div class="auth-divider">və ya</div>', '<div class="auth-divider" data-translate="auth-or">və ya</div>'],
    ['<label for="loginIdentifier">Email və ya istifadəçi adı</label>', '<label for="loginIdentifier" data-translate="auth-login-id">Email və ya istifadəçi adı</label>'],
    ['<label for="loginPassword">Şifrə</label>', '<label for="loginPassword" data-translate="auth-pwd">Şifrə</label>'],
    ['<span>Məni xatırla</span>', '<span data-translate="auth-remember">Məni xatırla</span>'],
    ['>Şifrəni unutmusunuz?</a>', ' data-translate="auth-forgot">Şifrəni unutmusunuz?</a>'],
    ['<span class="btn-text">Daxil Ol</span>', '<span class="btn-text" data-translate="auth-btn-login">Daxil Ol</span>'],
    ['<label for="loginPhone">Telefon nömrəsi</label>', '<label for="loginPhone" data-translate="auth-phone">Telefon nömrəsi</label>'],
    ['<span class="btn-text">SMS Kodu Göndər</span>', '<span class="btn-text" data-translate="auth-btn-send-sms">SMS Kodu Göndər</span>'],
    ['<span class="btn-text">Email Kodu Göndər</span>', '<span class="btn-text" data-translate="auth-btn-send-email">Email Kodu Göndər</span>'],
    ['Kodu almadınız?', '<span data-translate="auth-no-code">Kodu almadınız?</span>'],
    ['Yenidən göndər (', '<span data-translate="auth-resend">Yenidən göndər</span> ('],
    ['<span class="btn-text">Kodu Təsdiqlə</span>', '<span class="btn-text" data-translate="auth-btn-verify">Kodu Təsdiqlə</span>'],
    ['← Nömrəni dəyiş', '<span data-translate="auth-change-num">← Nömrəni dəyiş</span>'],
    ['← Email-i dəyiş', '<span data-translate="auth-change-email">← Email-i dəyiş</span>'],
    ['<label for="loginEmailCode">Email ünvanı</label>', '<label for="loginEmailCode" data-translate="auth-email">Email ünvanı</label>'],
    ['Hesabınız yoxdur?', '<span data-translate="auth-no-account">Hesabınız yoxdur?</span>'],
    ['>Qeydiyyatdan keçin</a>', ' data-translate="auth-go-signup">Qeydiyyatdan keçin</a>'],
    ['<p class="otp-hint">SMS kodu <strong id="smsPhoneDisplay"></strong> nömrəsinə göndərildi.</p>', '<p class="otp-hint"><span data-translate="auth-sms-sent-1">SMS kodu</span> <strong id="smsPhoneDisplay"></strong> <span data-translate="auth-sms-sent-2">nömrəsinə göndərildi.</span></p>'],
    ['<p class="otp-hint">6 rəqəmli kod <strong id="emailAddressDisplay"></strong> ünvanına göndərildi.</p>', '<p class="otp-hint"><span data-translate="auth-email-sent-1">6 rəqəmli kod</span> <strong id="emailAddressDisplay"></strong> <span data-translate="auth-email-sent-2">ünvanına göndərildi.</span></p>'],
    // Placeholders
    ['placeholder="example@email.com"', 'placeholder="example@email.com" data-translate-placeholder="auth-ph-email"'],
    ['placeholder="55 123 45 67"', 'placeholder="55 123 45 67" data-translate-placeholder="auth-ph-phone"']
];

loginReplacements.forEach(([oldStr, newStr]) => {
    loginHtml = loginHtml.split(oldStr).join(newStr);
});
fs.writeFileSync(baseDir + 'login.html', loginHtml);


// 2. Add data-translate attributes to signup.html
let signupHtml = fs.readFileSync(baseDir + 'signup.html', 'utf8');

const signupReplacements = [
    ['<h1 class="auth-brand-title">Xoş gəldiniz!</h1>', '<h1 class="auth-brand-title" data-translate="auth-welcome">Xoş gəldiniz!</h1>'],
    ['<p class="auth-brand-sub">Azərbaycanın ən böyük telefon bazarına daxil olun.</p>', '<p class="auth-brand-sub" data-translate="auth-brand-sub">Azərbaycanın ən böyük telefon bazarına daxil olun.</p>'],
    ['<span>SSL ilə qorunan giriş</span>', '<span data-translate="auth-feat-1">SSL ilə qorunan giriş</span>'],
    ['<span>Sürətli və etibarlı</span>', '<span data-translate="auth-feat-2">Sürətli və etibarlı</span>'],
    ['<span>50,000+ telefon elanı</span>', '<span data-translate="auth-feat-3">50,000+ telefon elanı</span>'],
    ['<span>24/7 dəstək xidməti</span>', '<span data-translate="auth-feat-4">24/7 dəstək xidməti</span>'],
    ['<button class="auth-tab-btn" role="tab" onclick="window.location.href=\'login.html\'">Giriş</button>', '<button class="auth-tab-btn" role="tab" onclick="window.location.href=\'login.html\'" data-translate="auth-tab-login">Giriş</button>'],
    ['<button class="auth-tab-btn active" role="tab" onclick="window.location.href=\'signup.html\'">Qeydiyyat</button>', '<button class="auth-tab-btn active" role="tab" onclick="window.location.href=\'signup.html\'" data-translate="auth-tab-signup">Qeydiyyat</button>'],
    ['<h2 class="auth-heading">Yeni Hesab</h2>', '<h2 class="auth-heading" data-translate="auth-heading-signup">Yeni Hesab</h2>'],
    ['<p class="auth-subheading">Mobil.az-da hesab yaradaraq alqı-satqıya başlayın</p>', '<p class="auth-subheading" data-translate="auth-subheading-signup">Mobil.az-da hesab yaradaraq alqı-satqıya başlayın</p>'],
    ['<div class="auth-divider">və ya</div>', '<div class="auth-divider" data-translate="auth-or">və ya</div>'],
    ['<label for="signupName">Adınız</label>', '<label for="signupName" data-translate="auth-name">Adınız</label>'],
    ['<label for="signupSurname">Soyadınız</label>', '<label for="signupSurname" data-translate="auth-surname">Soyadınız</label>'],
    ['<label for="signupEmail">Email ünvanı</label>', '<label for="signupEmail" data-translate="auth-email">Email ünvanı</label>'],
    ['<label for="signupPhone">Telefon nömrəsi</label>', '<label for="signupPhone" data-translate="auth-phone">Telefon nömrəsi</label>'],
    ['<label for="signupPassword">Şifrə</label>', '<label for="signupPassword" data-translate="auth-pwd">Şifrə</label>'],
    ['<label for="signupConfirmPwd">Şifrənin təkrarı</label>', '<label for="signupConfirmPwd" data-translate="auth-pwd-confirm">Şifrənin təkrarı</label>'],
    ['<span class="btn-text">Qeydiyyatdan Keç</span>', '<span class="btn-text" data-translate="auth-btn-signup">Qeydiyyatdan Keç</span>'],
    ['Qaydalar və Şərtləri', '<span data-translate="auth-terms">Qaydalar və Şərtləri</span>'],
    ['qəbul edirəm', '<span data-translate="auth-accept">qəbul edirəm</span>'],
    ['Artıq hesabınız var?', '<span data-translate="auth-has-account">Artıq hesabınız var?</span>'],
    ['>Daxil olun</a>', ' data-translate="auth-go-login">Daxil olun</a>'],
    // Placeholders
    ['placeholder="Əli"', 'placeholder="Əli" data-translate-placeholder="auth-ph-name"'],
    ['placeholder="Məmmədov"', 'placeholder="Məmmədov" data-translate-placeholder="auth-ph-surname"']
];

signupReplacements.forEach(([oldStr, newStr]) => {
    signupHtml = signupHtml.split(oldStr).join(newStr);
});
fs.writeFileSync(baseDir + 'signup.html', signupHtml);

// 3. Inject new keys into script.js translations object
const newKeys = {
    AZ: {
        "auth-welcome": "Xoş gəldiniz!",
        "auth-brand-sub": "Azərbaycanın ən böyük telefon bazarına daxil olun.",
        "auth-feat-1": "SSL ilə qorunan giriş",
        "auth-feat-2": "Sürətli və etibarlı",
        "auth-feat-3": "50,000+ telefon elanı",
        "auth-feat-4": "24/7 dəstək xidməti",
        "auth-tab-login": "Giriş",
        "auth-tab-signup": "Qeydiyyat",
        "auth-heading-login": "Hesaba Giriş",
        "auth-subheading-login": "Hesabınıza daxil olmaq üçün üsul seçin",
        "auth-heading-signup": "Yeni Hesab",
        "auth-subheading-signup": "Mobil.az-da hesab yaradaraq alqı-satqıya başlayın",
        "auth-method-label": "Giriş üsulu",
        "auth-method-pwd": "Şifrə",
        "auth-method-sms": "SMS Kodu",
        "auth-method-email": "Email Kodu",
        "auth-or": "və ya",
        "auth-login-id": "Email və ya istifadəçi adı",
        "auth-pwd": "Şifrə",
        "auth-pwd-confirm": "Şifrənin təkrarı",
        "auth-remember": "Məni xatırla",
        "auth-forgot": "Şifrəni unutmusunuz?",
        "auth-btn-login": "Daxil Ol",
        "auth-btn-signup": "Qeydiyyatdan Keç",
        "auth-phone": "Telefon nömrəsi",
        "auth-email": "Email ünvanı",
        "auth-name": "Adınız",
        "auth-surname": "Soyadınız",
        "auth-btn-send-sms": "SMS Kodu Göndər",
        "auth-btn-send-email": "Email Kodu Göndər",
        "auth-btn-verify": "Kodu Təsdiqlə",
        "auth-no-code": "Kodu almadınız?",
        "auth-resend": "Yenidən göndər",
        "auth-change-num": "← Nömrəni dəyiş",
        "auth-change-email": "← Email-i dəyiş",
        "auth-no-account": "Hesabınız yoxdur?",
        "auth-go-signup": "Qeydiyyatdan keçin",
        "auth-has-account": "Artıq hesabınız var?",
        "auth-go-login": "Daxil olun",
        "auth-terms": "Qaydalar və Şərtləri",
        "auth-accept": "qəbul edirəm",
        "auth-sms-sent-1": "SMS kodu",
        "auth-sms-sent-2": "nömrəsinə göndərildi.",
        "auth-email-sent-1": "6 rəqəmli kod",
        "auth-email-sent-2": "ünvanına göndərildi.",
        "auth-ph-email": "example@email.com",
        "auth-ph-phone": "55 123 45 67",
        "auth-ph-name": "Əli",
        "auth-ph-surname": "Məmmədov"
    },
    ENG: {
        "auth-welcome": "Welcome!",
        "auth-brand-sub": "Join Azerbaijan's largest mobile marketplace.",
        "auth-feat-1": "SSL Secured Login",
        "auth-feat-2": "Fast and Reliable",
        "auth-feat-3": "50,000+ phone listings",
        "auth-feat-4": "24/7 Support",
        "auth-tab-login": "Log In",
        "auth-tab-signup": "Sign Up",
        "auth-heading-login": "Account Login",
        "auth-subheading-login": "Choose a method to log into your account",
        "auth-heading-signup": "New Account",
        "auth-subheading-signup": "Create an account on Mobil.az to start buying and selling",
        "auth-method-label": "Login Method",
        "auth-method-pwd": "Password",
        "auth-method-sms": "SMS Code",
        "auth-method-email": "Email Code",
        "auth-or": "or",
        "auth-login-id": "Email or Username",
        "auth-pwd": "Password",
        "auth-pwd-confirm": "Confirm Password",
        "auth-remember": "Remember me",
        "auth-forgot": "Forgot Password?",
        "auth-btn-login": "Log In",
        "auth-btn-signup": "Sign Up",
        "auth-phone": "Phone Number",
        "auth-email": "Email Address",
        "auth-name": "First Name",
        "auth-surname": "Last Name",
        "auth-btn-send-sms": "Send SMS Code",
        "auth-btn-send-email": "Send Email Code",
        "auth-btn-verify": "Verify Code",
        "auth-no-code": "Didn't receive the code?",
        "auth-resend": "Resend",
        "auth-change-num": "← Change number",
        "auth-change-email": "← Change email",
        "auth-no-account": "Don't have an account?",
        "auth-go-signup": "Sign up",
        "auth-has-account": "Already have an account?",
        "auth-go-login": "Log in",
        "auth-terms": "Terms and Conditions",
        "auth-accept": "I accept",
        "auth-sms-sent-1": "SMS code was sent to",
        "auth-sms-sent-2": ".",
        "auth-email-sent-1": "6-digit code was sent to",
        "auth-email-sent-2": ".",
        "auth-ph-email": "example@email.com",
        "auth-ph-phone": "55 123 45 67",
        "auth-ph-name": "Ali",
        "auth-ph-surname": "Mammadov"
    },
    RUS: {
        "auth-welcome": "Добро пожаловать!",
        "auth-brand-sub": "Войдите на крупнейший рынок телефонов Азербайджана.",
        "auth-feat-1": "Вход защищен SSL",
        "auth-feat-2": "Быстро и надежно",
        "auth-feat-3": "50,000+ объявлений о телефонах",
        "auth-feat-4": "Круглосуточная поддержка",
        "auth-tab-login": "Вход",
        "auth-tab-signup": "Регистрация",
        "auth-heading-login": "Вход в аккаунт",
        "auth-subheading-login": "Выберите способ входа в свой аккаунт",
        "auth-heading-signup": "Новый аккаунт",
        "auth-subheading-signup": "Создайте аккаунт на Mobil.az, чтобы начать покупки и продажи",
        "auth-method-label": "Способ входа",
        "auth-method-pwd": "Пароль",
        "auth-method-sms": "SMS Код",
        "auth-method-email": "Email Код",
        "auth-or": "или",
        "auth-login-id": "Email или Имя пользователя",
        "auth-pwd": "Пароль",
        "auth-pwd-confirm": "Подтвердите пароль",
        "auth-remember": "Запомнить меня",
        "auth-forgot": "Забыли пароль?",
        "auth-btn-login": "Войти",
        "auth-btn-signup": "Зарегистрироваться",
        "auth-phone": "Номер телефона",
        "auth-email": "Email адрес",
        "auth-name": "Имя",
        "auth-surname": "Фамилия",
        "auth-btn-send-sms": "Отправить SMS код",
        "auth-btn-send-email": "Отправить Email код",
        "auth-btn-verify": "Подтвердить код",
        "auth-no-code": "Не получили код?",
        "auth-resend": "Отправить снова",
        "auth-change-num": "← Изменить номер",
        "auth-change-email": "← Изменить email",
        "auth-no-account": "Нет аккаунта?",
        "auth-go-signup": "Зарегистрируйтесь",
        "auth-has-account": "Уже есть аккаунт?",
        "auth-go-login": "Войти",
        "auth-terms": "Условия использования",
        "auth-accept": "принимаю",
        "auth-sms-sent-1": "SMS код отправлен на",
        "auth-sms-sent-2": ".",
        "auth-email-sent-1": "6-значный код отправлен на",
        "auth-email-sent-2": ".",
        "auth-ph-email": "example@email.com",
        "auth-ph-phone": "55 123 45 67",
        "auth-ph-name": "Али",
        "auth-ph-surname": "Мамедов"
    }
};

let scriptJs = fs.readFileSync(baseDir + 'JS/script.js', 'utf8');

for (const lang of ['AZ', 'ENG', 'RUS']) {
    let lines = [];
    for (const [k, v] of Object.entries(newKeys[lang])) {
        lines.push(`            "${k}": "${v}"`);
    }
    const injectStr = lines.join(',\n') + ',\n';
    
    // Inject at the end of each language block. Let's find "det-breadcrumb-phones": "..."
    let searchStr = "";
    if (lang === 'AZ') searchStr = '"det-breadcrumb-phones": "Telefonlar",\n';
    if (lang === 'ENG') searchStr = '"det-breadcrumb-phones": "Phones",\n';
    if (lang === 'RUS') searchStr = '"det-breadcrumb-phones": "Телефоны",\n';
    
    scriptJs = scriptJs.replace(searchStr, searchStr + injectStr);
}

fs.writeFileSync(baseDir + 'JS/script.js', scriptJs);
console.log('Translations updated successfully.');

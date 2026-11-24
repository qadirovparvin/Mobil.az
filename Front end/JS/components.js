const currentYear = new Date().getFullYear();

const headerTemplate = `
<header>
    <div class="container">
      <a href="index.html" class="logo">
        <span class="mobil-logo">Mobilim<span>.az</span></span>
      </a>

      <button class="hamburger" id="hamburgerBtn" aria-label="Menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>

      <div class="header-right">
        <nav class="menu">
          <ul>
            <li class="contact-dropdown" data-translate="Contact">
              <a href="#footer-contact"><i class="fa-solid fa-phone"></i> Əlaqə</a>
              <div class="contact-menu">
                <a href="https://instagram.com" target="_blank"><i class="fab fa-instagram"></i> Instagram</a>
                <a href="https://facebook.com" target="_blank"><i class="fab fa-facebook"></i> Facebook</a>
                <a href="https://wa.me/994703638808" target="_blank"><i class="fab fa-whatsapp"></i> WhatsApp</a>
                <a href="mailto:info@mobilim.az"><i class="fas fa-envelope"></i> Email</a>
              </div>
            </li>
            <li class="About" data-translate="About">
              <a href="about.html"><i class="fas fa-info-circle"></i> Haqqımızda</a>
            </li>
            <li class="Stores" data-translate="Stores">
              <!-- MVP: <a href="stores.html">Mağazalar</a> -->
              <!-- MVP: <a href="stores.html"><i class="fas fa-store"></i> Mağazalar</a> -->
              <span><i class="fas fa-store"></i> Mağazalar (tezliklə)</span>
            </li>
            <li class="Favorite" data-translate="Favorite">
              <a href="favorite.html"><i class="fas fa-heart"></i> Seçimlər</a>
            </li>
          </ul>
        </nav>
        <div class="button-container">
          <a href="login.html" class="login-btn" data-translate="login-btn">
            <i class="fas fa-sign-in-alt"></i> Giriş
          </a>
          <a href="signup.html" class="register-btn" data-translate="register-btn">
            <i class="fas fa-user-plus"></i> Qeydiyyat
          </a>
        </div>
        <div class="theme-lang-container">
          <button class="theme-toggle" id="themeToggle" aria-label="Toggle Dark Mode">
            <i class="fas fa-moon"></i>
          </button>
          <button class="language-selector">
            <i class="fas fa-globe"></i>
            <span id="current-lang" data-translate="language-selector">AZ</span>
          </button>
        </div>
      </div>
    </div>
  </header>
`;

const footerTemplate = `
<footer class="site-footer">
    <div class="footer-container">
      <div class="footer-column">
        <h3><span class="useful-links" data-translate="useful-links">Faydalı Linklər</span></h3>
        <ul>
          <li><a href="faq.html"><span class="faq" data-translate="faq">Tez-tez verilən suallar</span></a></li>
          <li><a href="rules.html"><span class="rules-safety" data-translate="rules-safety">Qaydalar və
                Təhlükəsizlik</span></a>
          </li>
          <li><a href="rules.html#posting-rules"><span class="posting-rules" data-translate="posting-rules">Elan
                yerləşdirmə
                qaydaları</span></a></li>
          <li><a href="privacy.html"><span class="privacy-policy" data-translate="privacy-policy">Məxfilik
                siyasəti</span></a></li>
        </ul>
      </div>
      <div class="footer-column" id="footer-contact">
        <h3 class="contact" data-translate="contact">Əlaqə</h3>
        <ul>
          <li><a href="tel:+994703638808"><i class="fas fa-phone"></i> +994 70 363 88 08</a></li>
          <li><a href="mailto:info@mobilim.az"><i class="fas fa-envelope"></i> info@mobilim.az</a></li>
        </ul>
        <div class="social-icons">
          <a href="https://wa.me/994703638808" target="_blank" rel="noopener noreferrer" class="social whatsapp" title="WhatsApp" aria-label="WhatsApp">
            <i class="fab fa-whatsapp"></i>
          </a>
          <a href="https://instagram.com/mobilim.az" target="_blank" rel="noopener noreferrer" class="social instagram" title="Instagram" aria-label="Instagram">
            <i class="fab fa-instagram"></i>
          </a>
          <a href="https://tiktok.com/@mobilim.az" target="_blank" rel="noopener noreferrer" class="social tiktok" title="TikTok" aria-label="TikTok">
            <i class="fab fa-tiktok"></i>
          </a>
          <a href="https://youtube.com/@mobilim.az" target="_blank" rel="noopener noreferrer" class="social youtube" title="YouTube" aria-label="YouTube">
            <i class="fab fa-youtube"></i>
          </a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; ${currentYear} Mobilim.az. Bütün hüquqlar qorunur.</p>
    </div>
  </footer>
`;

function setupContactNavigation() {
  document.querySelectorAll('.contact-dropdown > a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href === '' || href === '#') {
      link.setAttribute('href', '#footer-contact');
    }
    if (!link.dataset.contactNavAttached) {
      link.dataset.contactNavAttached = 'true';
      link.addEventListener('click', (e) => {
        const target = document.getElementById('footer-contact');
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, null, '#footer-contact');
          }
        } else {
          window.location.href = 'index.html#footer-contact';
        }
      });
    }
  });
}

function initHamburgerMenu() {
  const hamburger = document.getElementById('hamburgerBtn') || document.querySelector('.hamburger');
  const headerRight = document.querySelector('.header-right');
  if (!hamburger || !headerRight) return;
  if (hamburger.dataset.bound === 'true') return;
  hamburger.dataset.bound = 'true';

  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = headerRight.classList.toggle('open');
    headerRight.classList.toggle('active', isOpen);
    headerRight.classList.remove('hidden');
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && !headerRight.contains(e.target) && !hamburger.contains(e.target)) {
      headerRight.classList.remove('open', 'active');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });

  // Close mobile menu when a nav link is clicked
  headerRight.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        headerRight.classList.remove('open', 'active');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      headerRight.classList.remove('hidden', 'open', 'active');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
}
window.initHamburgerMenu = initHamburgerMenu;

/* ═══════════════════════════════════════════════
   Universal External Link & Contact Confirmation Modal
═══════════════════════════════════════════════ */
const EXT_I18N = {
  az: {
    phoneTitle: "Zəng etmək istəyirsiniz?",
    phoneDesc: (num) => `<strong>${num}</strong> nömrəsinə birbaşa zəng etmək istədiyinizdən əminsiniz?`,
    phoneConfirm: '<i class="fa-solid fa-phone"></i> Zəng et',
    copyNumber: '<i class="fa-regular fa-copy"></i> Nömrəni kopyala',
    copiedNumber: '<i class="fa-solid fa-check"></i> Kopyalandı!',

    instagramTitle: "Instagram səhifəsinə keçid",
    instagramDesc: "Mobilim.az saytından ayrılaraq rəsmi <strong>Instagram</strong> səhifəsinə keçmək istəyirsiniz?",
    instagramConfirm: '<i class="fa-solid fa-arrow-up-right-from-square"></i> Instagram-a keç',

    tiktokTitle: "TikTok səhifəsinə keçid",
    tiktokDesc: "Mobilim.az saytından ayrılaraq rəsmi <strong>TikTok</strong> səhifəsinə keçmək istəyirsiniz?",
    tiktokConfirm: '<i class="fa-solid fa-arrow-up-right-from-square"></i> TikTok-a keç',

    whatsappTitle: "WhatsApp ilə əlaqə",
    whatsappDesc: "Mobilim.az-dan <strong>WhatsApp</strong> tətbiqinə keçib çat başlatmaq istəyirsiniz?",
    whatsappConfirm: '<i class="fa-brands fa-whatsapp"></i> WhatsApp-a keç',

    facebookTitle: "Facebook səhifəsinə keçid",
    facebookDesc: "Mobilim.az saytından ayrılaraq <strong>Facebook</strong> səhifəsinə keçmək istəyirsiniz?",
    facebookConfirm: '<i class="fa-solid fa-arrow-up-right-from-square"></i> Facebook-a keç',

    youtubeTitle: "YouTube kanalına keçid",
    youtubeDesc: "Mobilim.az saytından ayrılaraq rəsmi <strong>YouTube</strong> kanalına keçmək istəyirsiniz?",
    youtubeConfirm: '<i class="fa-solid fa-arrow-up-right-from-square"></i> YouTube-a keç',

    emailTitle: "E-poçt göndərmək",
    emailDesc: (em) => `<strong>${em}</strong> ünvanına məktub yazmaq üçün e-poçt proqramını açmaq istəyirsiniz?`,
    emailConfirm: '<i class="fa-solid fa-envelope"></i> Poçt proqramını aç',

    generalTitle: "Xarici keçid",
    generalDesc: (url) => `Siz bu linkə keçid etmək üzrəsiniz:<br><strong style="word-break:break-all;">${url}</strong>`,
    generalConfirm: '<i class="fa-solid fa-arrow-up-right-from-square"></i> Keçid et',

    cancel: "Ləğv et"
  },
  ru: {
    phoneTitle: "Совершить звонок?",
    phoneDesc: (num) => `Вы уверены, что хотите позвонить на номер <strong>${num}</strong>?`,
    phoneConfirm: '<i class="fa-solid fa-phone"></i> Позвонить',
    copyNumber: '<i class="fa-regular fa-copy"></i> Скопировать номер',
    copiedNumber: '<i class="fa-solid fa-check"></i> Скопировано!',

    instagramTitle: "Переход в Instagram",
    instagramDesc: "Вы хотите покинуть Mobilim.az и перейти на страницу <strong>Instagram</strong>?",
    instagramConfirm: '<i class="fa-solid fa-arrow-up-right-from-square"></i> Перейти в Instagram',

    tiktokTitle: "Переход в TikTok",
    tiktokDesc: "Вы хотите покинуть Mobilim.az и перейти на страницу <strong>TikTok</strong>?",
    tiktokConfirm: '<i class="fa-solid fa-arrow-up-right-from-square"></i> Перейти в TikTok',

    whatsappTitle: "Связаться в WhatsApp",
    whatsappDesc: "Вы хотите перейти в <strong>WhatsApp</strong> и начать диалог?",
    whatsappConfirm: '<i class="fa-brands fa-whatsapp"></i> Открыть WhatsApp',

    facebookTitle: "Переход в Facebook",
    facebookDesc: "Вы хотите покинуть Mobilim.az и перейти в <strong>Facebook</strong>?",
    facebookConfirm: '<i class="fa-solid fa-arrow-up-right-from-square"></i> Перейти в Facebook',

    youtubeTitle: "Переход на YouTube",
    youtubeDesc: "Вы хотите покинуть Mobilim.az и перейти на канал <strong>YouTube</strong>?",
    youtubeConfirm: '<i class="fa-solid fa-arrow-up-right-from-square"></i> Перейти на YouTube',

    emailTitle: "Отправить письмо",
    emailDesc: (em) => `Открыть почтовую программу для отправки письма на <strong>${em}</strong>?`,
    emailConfirm: '<i class="fa-solid fa-envelope"></i> Открыть почту',

    generalTitle: "Внешняя ссылка",
    generalDesc: (url) => `Вы переходите по внешней ссылке:<br><strong style="word-break:break-all;">${url}</strong>`,
    generalConfirm: '<i class="fa-solid fa-arrow-up-right-from-square"></i> Перейти',

    cancel: "Отмена"
  },
  en: {
    phoneTitle: "Make a call?",
    phoneDesc: (num) => `Are you sure you want to call <strong>${num}</strong>?`,
    phoneConfirm: '<i class="fa-solid fa-phone"></i> Call',
    copyNumber: '<i class="fa-regular fa-copy"></i> Copy number',
    copiedNumber: '<i class="fa-solid fa-check"></i> Copied!',

    instagramTitle: "Open Instagram",
    instagramDesc: "Do you want to leave Mobilim.az and open <strong>Instagram</strong>?",
    instagramConfirm: '<i class="fa-solid fa-arrow-up-right-from-square"></i> Go to Instagram',

    tiktokTitle: "Open TikTok",
    tiktokDesc: "Do you want to leave Mobilim.az and open <strong>TikTok</strong>?",
    tiktokConfirm: '<i class="fa-solid fa-arrow-up-right-from-square"></i> Go to TikTok',

    whatsappTitle: "Contact via WhatsApp",
    whatsappDesc: "Do you want to open <strong>WhatsApp</strong> to start a chat?",
    whatsappConfirm: '<i class="fa-brands fa-whatsapp"></i> Open WhatsApp',

    facebookTitle: "Open Facebook",
    facebookDesc: "Do you want to leave Mobilim.az and open <strong>Facebook</strong>?",
    facebookConfirm: '<i class="fa-solid fa-arrow-up-right-from-square"></i> Go to Facebook',

    youtubeTitle: "Open YouTube",
    youtubeDesc: "Do you want to leave Mobilim.az and open <strong>YouTube</strong>?",
    youtubeConfirm: '<i class="fa-solid fa-arrow-up-right-from-square"></i> Go to YouTube',

    emailTitle: "Send an Email",
    emailDesc: (em) => `Do you want to open your mail client to send an email to <strong>${em}</strong>?`,
    emailConfirm: '<i class="fa-solid fa-envelope"></i> Open Mail Client',

    generalTitle: "External link",
    generalDesc: (url) => `You are about to navigate to:<br><strong style="word-break:break-all;">${url}</strong>`,
    generalConfirm: '<i class="fa-solid fa-arrow-up-right-from-square"></i> Continue',

    cancel: "Cancel"
  }
};

function escapeHtmlExt(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getLinkPlatform(targetUrl) {
  if (!targetUrl || typeof targetUrl !== 'string') return null;
  const urlLower = targetUrl.toLowerCase().trim();
  if (urlLower.startsWith('tel:')) return 'phone';
  if (urlLower.startsWith('mailto:')) return 'email';
  if (urlLower.includes('instagram.com')) return 'instagram';
  if (urlLower.includes('tiktok.com')) return 'tiktok';
  if (urlLower.includes('wa.me') || urlLower.includes('whatsapp.com')) return 'whatsapp';
  if (urlLower.includes('facebook.com') || urlLower.includes('fb.com')) return 'facebook';
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'youtube';

  if (urlLower.startsWith('http://') || urlLower.startsWith('https://')) {
    try {
      const urlObj = new URL(targetUrl, window.location.origin);
      if (urlObj.origin !== window.location.origin && !urlObj.origin.includes('localhost') && !urlObj.origin.includes('127.0.0.1')) {
        return 'general';
      }
    } catch (e) {}
  }
  return null;
}

function ensureExternalConfirmModal() {
  let modal = document.getElementById('extConfirmModal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'extConfirmModal';
  modal.className = 'ext-modal-backdrop';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-hidden', 'true');

  modal.innerHTML = `
    <div class="ext-modal-card">
      <button type="button" class="ext-modal-close" id="extModalCloseBtn" aria-label="Bağla">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <div class="ext-modal-icon-wrap" id="extModalIconWrap">
        <i class="fa-solid fa-globe" id="extModalIcon"></i>
      </div>
      <h3 class="ext-modal-title" id="extModalTitle"></h3>
      <p class="ext-modal-desc" id="extModalDesc"></p>
      <div class="ext-modal-actions">
        <button type="button" class="ext-modal-btn-confirm" id="extModalConfirmBtn"></button>
        <button type="button" class="ext-modal-btn-copy" id="extModalCopyBtn" style="display: none;"></button>
        <button type="button" class="ext-modal-btn-cancel" id="extModalCancelBtn"></button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const closeModal = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  };

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  const closeBtn = modal.querySelector('#extModalCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  const cancelBtn = modal.querySelector('#extModalCancelBtn');
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  return modal;
}

function openExternalConfirmModal(targetUrl, meta = {}) {
  if (!targetUrl) return;
  const modal = ensureExternalConfirmModal();
  const rawLang = (localStorage.getItem('lang') || document.documentElement.lang || 'az').toLowerCase().slice(0, 2);
  const langKey = EXT_I18N[rawLang] ? rawLang : 'az';
  const t = EXT_I18N[langKey];

  const platform = getLinkPlatform(targetUrl) || 'general';

  const iconWrap = modal.querySelector('#extModalIconWrap');
  const icon = modal.querySelector('#extModalIcon');
  const title = modal.querySelector('#extModalTitle');
  const desc = modal.querySelector('#extModalDesc');
  const confirmBtn = modal.querySelector('#extModalConfirmBtn');
  const copyBtn = modal.querySelector('#extModalCopyBtn');
  const cancelBtn = modal.querySelector('#extModalCancelBtn');

  iconWrap.className = 'ext-modal-icon-wrap platform-' + platform;

  if (platform === 'phone') {
    const rawNum = targetUrl.replace(/^tel:/i, '');
    const displayNum = meta.formattedNumber || rawNum;
    icon.className = 'fa-solid fa-phone';
    title.textContent = t.phoneTitle;
    desc.innerHTML = t.phoneDesc(escapeHtmlExt(displayNum));
    confirmBtn.innerHTML = t.phoneConfirm;

    copyBtn.style.display = 'inline-flex';
    copyBtn.innerHTML = t.copyNumber;
    copyBtn.onclick = () => {
      const copyVal = meta.formattedNumber || rawNum;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyVal).then(() => {
          copyBtn.innerHTML = t.copiedNumber;
          setTimeout(() => {
            copyBtn.innerHTML = t.copyNumber;
          }, 2000);
        }).catch(() => {});
      }
    };
  } else if (platform === 'instagram') {
    copyBtn.style.display = 'none';
    icon.className = 'fa-brands fa-instagram';
    title.textContent = t.instagramTitle;
    desc.innerHTML = t.instagramDesc;
    confirmBtn.innerHTML = t.instagramConfirm;
  } else if (platform === 'tiktok') {
    copyBtn.style.display = 'none';
    icon.className = 'fa-brands fa-tiktok';
    title.textContent = t.tiktokTitle;
    desc.innerHTML = t.tiktokDesc;
    confirmBtn.innerHTML = t.tiktokConfirm;
  } else if (platform === 'whatsapp') {
    copyBtn.style.display = 'none';
    icon.className = 'fa-brands fa-whatsapp';
    title.textContent = t.whatsappTitle;
    desc.innerHTML = t.whatsappDesc;
    confirmBtn.innerHTML = t.whatsappConfirm;
  } else if (platform === 'facebook') {
    copyBtn.style.display = 'none';
    icon.className = 'fa-brands fa-facebook';
    title.textContent = t.facebookTitle;
    desc.innerHTML = t.facebookDesc;
    confirmBtn.innerHTML = t.facebookConfirm;
  } else if (platform === 'youtube') {
    copyBtn.style.display = 'none';
    icon.className = 'fa-brands fa-youtube';
    title.textContent = t.youtubeTitle;
    desc.innerHTML = t.youtubeDesc;
    confirmBtn.innerHTML = t.youtubeConfirm;
  } else if (platform === 'email') {
    copyBtn.style.display = 'none';
    const emailTarget = targetUrl.replace(/^mailto:/i, '').split('?')[0];
    icon.className = 'fa-solid fa-envelope';
    title.textContent = t.emailTitle;
    desc.innerHTML = t.emailDesc(escapeHtmlExt(emailTarget));
    confirmBtn.innerHTML = t.emailConfirm;
  } else {
    copyBtn.style.display = 'none';
    icon.className = 'fa-solid fa-arrow-up-right-from-square';
    title.textContent = t.generalTitle;
    desc.innerHTML = t.generalDesc(escapeHtmlExt(targetUrl));
    confirmBtn.innerHTML = t.generalConfirm;
  }

  cancelBtn.textContent = t.cancel;

  confirmBtn.onclick = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    if (targetUrl.startsWith('tel:') || targetUrl.startsWith('mailto:')) {
      window.location.href = targetUrl;
    } else {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
}

function initExternalLinkConfirmations() {
  if (window._extLinkConfirmationsInitialized) return;
  window._extLinkConfirmationsInitialized = true;

  document.addEventListener('click', (e) => {
    if (e.target.closest('#extConfirmModal')) return;

    const link = e.target.closest('a');
    if (!link) return;

    if (link.dataset.noExtConfirm === 'true') return;

    const href = link.getAttribute('href');
    if (!href || href === '#' || href.startsWith('javascript:')) return;

    const platform = getLinkPlatform(href);
    if (platform) {
      e.preventDefault();
      e.stopPropagation();
      const meta = {};
      if (platform === 'phone') {
        const textNum = link.textContent.trim();
        if (textNum && !textNum.includes('<') && textNum.length < 30) {
          meta.formattedNumber = textNum;
        }
      }
      openExternalConfirmModal(href, meta);
    }
  }, true);
}

window.openExternalConfirmModal = openExternalConfirmModal;
window.initExternalLinkConfirmations = initExternalLinkConfirmations;

function loadHeader() {
  const placeholder = document.getElementById('header-placeholder');
  if (placeholder) {
    placeholder.outerHTML = headerTemplate;
  }
  if (typeof window.updateHeader === 'function') {
    window.updateHeader();
  }
  setupContactNavigation();
  initHamburgerMenu();
}

function loadFooter() {
  const currentYr = new Date().getFullYear();
  const placeholder = document.getElementById('footer-placeholder');
  if (placeholder) {
    placeholder.outerHTML = footerTemplate;
  }
  // Ensure any existing static footer without id gets footer-contact
  document.querySelectorAll('.footer-column').forEach(col => {
    if (!col.id && (col.querySelector('h3.contact') || col.querySelector('[data-translate="contact"]'))) {
      col.id = 'footer-contact';
    }
  });
  // Ensure any static footer with hardcoded 2025 is updated to current year
  document.querySelectorAll('.footer-bottom p').forEach(p => {
    if (p.textContent.includes('2025')) {
      p.innerHTML = p.innerHTML.replace(/2025/g, currentYr);
    }
  });

  // Fallback if FontAwesome icons are not loaded
  setTimeout(() => {
    const testIcon = document.querySelector('.social.whatsapp i');
    if (testIcon) {
      const beforeContent = window.getComputedStyle(testIcon, ':before').content;
      if (!beforeContent || beforeContent === 'none' || beforeContent === '""') {
        const fallbacks = { whatsapp: 'WA', instagram: 'IG', tiktok: 'TT', youtube: 'YT' };
        document.querySelectorAll('.social').forEach(link => {
          Object.keys(fallbacks).forEach(key => {
            if (link.classList.contains(key) && !link.textContent.trim()) {
              link.innerHTML = `<span style="font-size:12px;font-weight:700;letter-spacing:-0.5px;">${fallbacks[key]}</span>`;
            }
          });
        });
      }
    }
  }, 500);
}

document.addEventListener('DOMContentLoaded', () => {
  loadHeader();
  loadFooter();
  setupContactNavigation();
  initExternalLinkConfirmations();
  if (typeof window.updateHeader === 'function') {
    window.updateHeader();
  }
  
  // Dispatch a custom event indicating components are loaded
  document.dispatchEvent(new Event('componentsLoaded'));
});

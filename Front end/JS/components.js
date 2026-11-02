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
          <a href="#"><i class="fab fa-facebook-f"></i></a>
          <a href="#"><i class="fab fa-instagram"></i></a>
          <a href="#"><i class="fab fa-twitter"></i></a>
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

function loadHeader() {
  const placeholder = document.getElementById('header-placeholder');
  if (placeholder) {
    placeholder.outerHTML = headerTemplate;
    if (typeof window.updateHeader === 'function') {
      window.updateHeader();
    }
    setupContactNavigation();

    // Hamburger toggle
    const hamburger = document.getElementById('hamburgerBtn');
    const headerRight = document.querySelector('.header-right');
    if (hamburger && headerRight) {
      hamburger.addEventListener('click', () => {
        const isOpen = headerRight.classList.toggle('open');
        hamburger.classList.toggle('active', isOpen);
        hamburger.setAttribute('aria-expanded', isOpen);
      });
      // Close mobile menu when a nav link is clicked
      headerRight.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          headerRight.classList.remove('open');
          hamburger.classList.remove('active');
          hamburger.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }
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
}

document.addEventListener('DOMContentLoaded', () => {
  loadHeader();
  loadFooter();
  setupContactNavigation();
  if (typeof window.updateHeader === 'function') {
    window.updateHeader();
  }
  
  // Dispatch a custom event indicating components are loaded
  document.dispatchEvent(new Event('componentsLoaded'));
});

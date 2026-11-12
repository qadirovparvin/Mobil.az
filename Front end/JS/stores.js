"use strict";

async function loadStores() {
  const grid = document.getElementById('storesGrid');
  const loading = document.getElementById('storesLoading');
  const empty = document.getElementById('storesEmpty');
  if (!grid) return;

  function escapeHtml(val) {
    return String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getImageUrl(image, fallback) {
    if (!image) return fallback;
    if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:')) {
      return image;
    }
    const safeApi = window.API_URL || (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.origin ? `${window.location.origin}/api` : 'http://localhost:5000/api');
    const origin = safeApi.replace(/\/api\/?$/, '');
    return `${origin}${image.startsWith('/') ? '' : '/'}${image}`;
  }

  try {
    if (loading) loading.style.display = 'block';
    if (empty) empty.style.display = 'none';

    const safeApi = window.API_URL || (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.origin ? `${window.location.origin}/api` : 'http://localhost:5000/api');
    const res = await fetch(`${safeApi}/stores`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const stores = data.stores || data.data || (Array.isArray(data) ? data : []);

    if (loading) loading.style.display = 'none';

    if (!stores.length) {
      if (empty) {
        const i18n = window.MobilazI18n;
        const emptyTitle = i18n ? i18n.t('noStoresTitle') : 'Hələ mağaza yoxdur';
        const emptyDesc = i18n ? i18n.t('noStoresDesc') : 'Hal-hazırda aktiv mağaza mövcud deyil. İlk mağazanı siz açın!';
        empty.style.display = 'block';
        empty.innerHTML = `
          <div class="empty-state" style="text-align:center;padding:60px 20px;grid-column:1/-1;">
            <div style="font-size:48px;margin-bottom:12px;">🏪</div>
            <h3 style="font-size:20px;font-weight:600;margin-bottom:8px;color:var(--text-primary);" data-translate="noStoresTitle">${escapeHtml(emptyTitle)}</h3>
            <p style="color:var(--text-secondary);font-size:14px;" data-translate="noStoresDesc">${escapeHtml(emptyDesc)}</p>
          </div>
        `;
      }
      return;
    }

    grid.innerHTML = stores.map(store => {
      const storeId = store._id || store.id;
      const i18n = window.MobilazI18n;
      const name = escapeHtml(store.name || store.storeName || (i18n ? i18n.t('store') : 'Mağaza'));
      const desc = escapeHtml(store.description || '');
      const rawCity = store.city || 'Bakı';
      const city = escapeHtml(i18n ? i18n.translateCity(rawCity) : rawCity);
      const address = escapeHtml(store.address || '');
      const location = address ? `${city}, ${address}` : city;
      const phone = escapeHtml(store.phone || store.contactNumber || '+994 50 123 45 67');
      const rawPhone = String(store.phone || store.contactNumber || '').replace(/[^0-9]/g, '');
      const rating = (store.rating && !isNaN(store.rating)) ? Number(store.rating).toFixed(1) : '5.0';
      const reviews = store.reviewCount || 0;
      const cover = getImageUrl(store.coverUrl || store.cover, 'assets/images/default-cover.svg');
      const logo = getImageUrl(store.logo || store.logoUrl || store.image, 'assets/images/default-avatar.svg');
      const isVerified = Boolean(store.isVerified);
      const count = store.adCount ?? (store.adCount === 0 ? store.adCount : (store.adsCount ?? (store.ads ? store.ads.length : 0)));

      return `
        <div class="list-store-card">
          <div class="list-store-image" style="background-image: url('${cover}');">
            <img src="${logo}" alt="${name}" class="store-logo-overlay" onerror="this.src='assets/images/default-avatar.svg'">
          </div>
          <div class="list-store-content">
            <div class="store-header-row">
              <h3 class="store-title">${name} ${isVerified ? '<i class="fas fa-check-circle verified-badge" title="Təsdiqlənmiş"></i>' : ''}</h3>
              <div class="store-rating-large">
                <i class="fas fa-star"></i> ${rating} <span>(${reviews} <span data-translate="stores-review">rəy</span>)</span>
              </div>
            </div>
            <p class="store-description">${desc}</p>
            <div class="store-meta">
              <span class="ad-count">📦 ${store.adCount ?? store.adsCount ?? count} Aktiv Elan</span>
              ${location ? `<span class="location store-meta-loc" data-raw-city="${escapeHtml(rawCity)}" data-raw-addr="${address}">📍 ${location}</span>` : ''}
            </div>
            <div class="store-details-grid">
              <div class="detail-item">
                <i class="fas fa-box-open"></i> <span>${count} <span data-translate="stores-active-ads">Aktiv Elan</span></span>
              </div>
              <div class="detail-item">
                <i class="fas fa-map-marker-alt"></i> <span class="store-city-label" data-raw-city="${escapeHtml(rawCity)}" data-raw-addr="${address}">${location}</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-phone-alt"></i> <span>${phone}</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-truck"></i> <span data-translate="stores-nationwide-delivery">Çatdırılma</span>
              </div>
            </div>
            <div class="store-actions">
              <a href="store-detail.html?id=${storeId}" class="btn" style="text-decoration:none"><button class="btn-view-store"><i class="fas fa-store"></i> <span data-translate="stores-view-btn">Mağazaya bax</span></button></a>
              <a href="${rawPhone ? `https://wa.me/${rawPhone}` : '#'}" ${rawPhone ? 'target="_blank" rel="noopener noreferrer"' : ''} style="text-decoration:none"><button class="btn-contact-store"><i class="fab fa-whatsapp"></i> <span data-translate="stores-contact-btn">Whatsapp</span></button></a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch(e) {
    console.error("loadStores error:", e);
    if (loading) loading.style.display = 'none';
    if (empty) {
      empty.style.display = 'block';
      empty.innerHTML = `
        <div class="empty-state" style="text-align:center;padding:60px 20px;grid-column:1/-1;">
          <div style="font-size:48px;margin-bottom:12px;">🏪</div>
          <h3 style="font-size:20px;font-weight:600;margin-bottom:8px;color:var(--text-primary);">Hələ mağaza yoxdur</h3>
          <p style="color:var(--text-secondary);font-size:14px;">Hal-hazırda aktiv mağaza mövcud deyil.</p>
        </div>
      `;
    }
  }
}

// ── Search & Filter ────────────────────────────────────
function initStoreSearch() {
  const searchInput = document.querySelector('.search-stores input');
  const searchBtn = document.querySelector('.search-stores button[type="submit"]');
  const grid = document.getElementById('storesGrid');

  function filterCards(query) {
    if (!grid) return;
    const q = (query || '').toLowerCase().trim();
    const cards = grid.querySelectorAll('.list-store-card');
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = !q || text.includes(q) ? '' : 'none';
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => filterCards(e.target.value));
  }
  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      filterCards(searchInput ? searchInput.value : '');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadStores();
  initStoreSearch();
});

document.addEventListener('mobilaz:languagechange', () => {
  const i18n = window.MobilazI18n;
  if (!i18n) return;
  document.querySelectorAll('.store-city-label').forEach(el => {
    const c = i18n.translateCity(el.dataset.rawCity || 'Bakı');
    const a = el.dataset.rawAddr || '';
    el.textContent = a ? (c + ', ' + a) : c;
  });
  document.querySelectorAll('.store-meta-loc').forEach(el => {
    const c = i18n.translateCity(el.dataset.rawCity || 'Bakı');
    const a = el.dataset.rawAddr || '';
    el.textContent = '📍 ' + (a ? (c + ', ' + a) : c);
  });
});

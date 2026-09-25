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
    const origin = (window.API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    return `${origin}${image.startsWith('/') ? '' : '/'}${image}`;
  }

  try {
    if (loading) loading.style.display = 'block';
    if (empty) empty.style.display = 'none';

    const res = await fetch(`${window.API_URL || 'http://localhost:5000/api'}/stores`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const stores = data.stores || data.data || (Array.isArray(data) ? data : []);

    if (loading) loading.style.display = 'none';

    if (!stores.length) {
      if (empty) empty.style.display = 'block';
      return;
    }

    grid.innerHTML = stores.map(store => {
      const storeId = store._id || store.id;
      const name = escapeHtml(store.name || store.storeName || 'Mağaza');
      const desc = escapeHtml(store.description || 'Mobil telefonlar və aksesuarların satışı.');
      const city = escapeHtml(store.city || 'Bakı');
      const address = escapeHtml(store.address || '');
      const location = address ? `${city}, ${address}` : city;
      const phone = escapeHtml(store.phone || store.contactNumber || '+994 50 123 45 67');
      const rawPhone = String(store.phone || store.contactNumber || '').replace(/[^0-9]/g, '');
      const rating = (store.rating && !isNaN(store.rating)) ? Number(store.rating).toFixed(1) : '5.0';
      const reviews = store.reviewCount || 0;
      const cover = getImageUrl(store.coverUrl || store.cover, 'https://images.unsplash.com/photo-1541560052-5e137f229371?q=80&w=600');
      const logo = getImageUrl(store.logo || store.logoUrl || store.image, 'https://i.pinimg.com/736x/e7/85/29/e78529fcd6194bae5fd828b46a5a501b.jpg');
      const isVerified = Boolean(store.isVerified);
      const count = store.adCount ?? (store.adCount === 0 ? store.adCount : (store.adsCount ?? (store.ads ? store.ads.length : 0)));

      return `
        <div class="list-store-card">
          <div class="list-store-image" style="background-image: url('${cover}');">
            <img src="${logo}" alt="${name}" class="store-logo-overlay">
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
              ${location ? `<span class="location">📍 ${location}</span>` : ''}
            </div>
            <div class="store-details-grid">
              <div class="detail-item">
                <i class="fas fa-box-open"></i> <span>${count} <span data-translate="stores-active-ads">Aktiv Elan</span></span>
              </div>
              <div class="detail-item">
                <i class="fas fa-map-marker-alt"></i> <span>${location}</span>
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
    if (loading) {
      loading.style.display = 'block';
      loading.textContent = 'Mağazalar yüklənmədi: ' + e.message;
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

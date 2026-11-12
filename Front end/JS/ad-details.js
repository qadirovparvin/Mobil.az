/* ================================================================
   ad-details.js  —  Mobilim.az Ad Detail Page
   - Fetches real ad data from the backend API
   - Populates all DOM elements with real data
   - ALWAYS reveals the page in finally{} — never stays blank
   ================================================================ */

document.addEventListener('DOMContentLoaded', async () => {
    const i18n = window.MobilazI18n || {
        t: (k) => k,
        translateCity: (v) => v || '',
        translateCategory: (v) => v || '',
        translateCondition: (v) => v || '',
        translateColor: (v) => v || '',
        translateSpecValue: (v) => v || '',
        formatMemory: (v) => (v ? String(v) + ' GB' : ''),
        formatRam: (v) => (v ? String(v) + ' GB' : ''),
        formatScreen: (v) => (v ? String(v).replace(/"/g, '') + '"' : ''),
        formatBattery: (v) => (v ? String(v) : ''),
        formatMonthYear: (d) => (d ? new Date(d).toLocaleDateString() : ''),
        formatDate: (d) => (d ? new Date(d).toLocaleDateString() : '')
    };

    // ── Helpers (defined first so they're always available) ────────

    function resolveAdDetailsApi() {
        if (window.API_URL) return window.API_URL;
        if (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
            var protocol = (window.location.protocol === 'http:' || !window.location.protocol) ? 'https:' : window.location.protocol;
            return protocol + '//' + (window.location.host || window.location.hostname) + '/api';
        }
        return 'http://localhost:5000/api';
    }
    const API_BASE = resolveAdDetailsApi();
    const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');
    let isStore = false;

    function getImageUrl(image) {
        if (!image) return '';
        if (image.startsWith('http://') || image.startsWith('https://')) return image;
        return API_ORIGIN + image;
    }

    function showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        const msgEl = document.getElementById('toastMsg');
        if (msgEl) msgEl.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function getStarsHtml(rating) {
        let h = '';
        for (let i = 1; i <= 5; i++) {
            h += i <= rating ? '★' : '<span style="color:var(--border-color)">★</span>';
        }
        return h;
    }

    function escapeHtml(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c]));
    }

    // ── Always-reveal function (called in finally) ─────────────────
    function revealPage() {
        const skeleton = document.getElementById('adLoadingSkeleton');
        const wrapper  = document.getElementById('detailWrapper');
        if (skeleton) skeleton.style.display = 'none';
        if (wrapper)  wrapper.style.visibility = 'visible';
    }

    // ── Show visible error or not found on screen ──────────────────
    function showPageError(msg, isNotFound = false) {
        revealPage();
        const wrapper = document.getElementById('detailWrapper');
        if (!wrapper) return;

        const notFound = isNotFound || /tapılmadı|tapilmadi|mövcud deyil|invalid id/i.test(String(msg || ''));
        document.title = notFound ? 'Elan tapılmadı — Mobilim.az' : 'Xəta baş verdi — Mobilim.az';

        // Clear breadcrumb to avoid stale placeholders
        const brandBreadcrumb = document.querySelector('.breadcrumb-brand');
        const brandSep = document.querySelector('.breadcrumb-brand-sep');
        const currentBreadcrumb = document.querySelector('.breadcrumb-model') || document.querySelector('.breadcrumb .current');
        if (brandBreadcrumb) brandBreadcrumb.style.display = 'none';
        if (brandSep) brandSep.style.display = 'none';
        if (currentBreadcrumb) currentBreadcrumb.textContent = notFound ? 'Elan tapılmadı' : 'Xəta';

        if (notFound) {
            wrapper.innerHTML = `
                <div style="text-align:center;padding:90px 20px;max-width:520px;margin:0 auto;color:var(--text-primary,#fff);">
                    <div style="width:84px;height:84px;margin:0 auto 20px;border-radius:50%;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;">
                        <i class="fas fa-search" style="font-size:36px;color:var(--text-muted,#888);"></i>
                    </div>
                    <h2 style="font-size:24px;font-weight:700;margin-bottom:12px;color:var(--text-primary,#fff);">Elan tapılmadı</h2>
                    <p style="color:var(--text-muted,#aaa);font-size:15px;line-height:1.6;margin-bottom:28px;">Axtardığınız elan silinmiş, vaxtı bitmiş və ya mövcud olmayan bir ünvandır.</p>
                    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                        <button type="button" onclick="window.history.length > 1 ? window.history.back() : window.location.href='index.html'" style="cursor:pointer;padding:12px 24px;background:var(--card-bg,#1e1e24);color:var(--text-primary,#fff);border:1px solid var(--border-color,#333);border-radius:12px;font-size:14px;font-weight:600;display:inline-flex;align-items:center;gap:8px;">
                            <i class="fas fa-arrow-left"></i> Geri qayıt
                        </button>
                        <a href="index.html" style="text-decoration:none;padding:12px 24px;background:var(--primary-color,#2563eb);color:#fff;border-radius:12px;font-size:14px;font-weight:600;display:inline-flex;align-items:center;gap:8px;">
                            <i class="fas fa-home"></i> Ana Səhifə
                        </a>
                    </div>
                </div>`;
        } else {
            wrapper.innerHTML = `
                <div style="text-align:center;padding:90px 20px;max-width:520px;margin:0 auto;color:var(--text-primary,#fff);">
                    <div style="width:84px;height:84px;margin:0 auto 20px;border-radius:50%;background:rgba(239,68,68,0.12);display:flex;align-items:center;justify-content:center;">
                        <i class="fas fa-exclamation-triangle" style="font-size:36px;color:#ef4444;"></i>
                    </div>
                    <h2 style="font-size:24px;font-weight:700;margin-bottom:12px;color:var(--text-primary,#fff);">Xəta baş verdi</h2>
                    <p style="color:var(--text-muted,#aaa);font-size:14px;margin-bottom:24px;background:rgba(255,255,255,0.04);border:1px solid var(--border-color,#333);padding:12px;border-radius:10px;word-break:break-word;">${escapeHtml(msg)}</p>
                    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                        <button type="button" onclick="window.location.reload()" style="cursor:pointer;padding:12px 24px;background:var(--primary-color,#2563eb);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:600;display:inline-flex;align-items:center;gap:8px;">
                            <i class="fas fa-sync-alt"></i> Yenidən yoxla
                        </button>
                        <a href="index.html" style="text-decoration:none;padding:12px 24px;background:var(--card-bg,#1e1e24);color:var(--text-primary,#fff);border:1px solid var(--border-color,#333);border-radius:12px;font-size:14px;font-weight:600;display:inline-flex;align-items:center;gap:8px;">
                            <i class="fas fa-home"></i> Ana Səhifə
                        </a>
                    </div>
                </div>`;
        }
    }

    // ── Read ad ID from URL ─────────────────────────────────────────
    const urlParams = new URLSearchParams(window.location.search);
    const adId   = urlParams.get('id') || urlParams.get('adId') || urlParams.get('adNumber');

    if (!adId) {
        showPageError('Elan tapılmadı', true);
        return;
    }

    // ── Main try/catch/finally ─────────────────────────────────────
    try {

        // ── Fetch the ad with resilient retry ──────────────────────
        let res;
        let fetchErr;
        const maxAttempts = 5;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                res = await fetch(`${API_BASE}/ads/${encodeURIComponent(adId)}`, {
                    headers: { 'Accept': 'application/json' },
                    silent: true
                });
                // If we got a valid response (not server 502/503/504 restart/cold start), break out
                if (res && res.status < 500) {
                    fetchErr = null;
                    break;
                }
            } catch (err) {
                fetchErr = err;
                res = null;
            }
            if (attempt < maxAttempts) {
                await new Promise(r => setTimeout(r, attempt * 1200));
            }
        }
        if ((!res || res.status >= 500) && fetchErr) {
            console.error('[ad-details] Fetch network error:', fetchErr);
            throw new Error(`Serverlə əlaqə qurula bilmədi (${fetchErr.message || 'Şəbəkə xətası'}). Zəhmət olmasa bir neçə saniyə sonra yenidən yoxlayın.`);
        }

        let ad;
        try {
            ad = await res.json();
        } catch {
            throw new Error(`Server JSON cavabı parse edilmədi (HTTP ${res ? res.status : 'unknown'})`);
        }

        if (!res.ok) {
            const isNotFound = res.status === 404 || res.status === 400;
            const errMsg = isNotFound ? 'Elan tapılmadı' : (ad?.message || `Server xətası (HTTP ${res.status})`);
            showPageError(errMsg, isNotFound);
            return;
        }
        if (ad && ad.data && typeof ad.data === 'object' && !ad.brand && !ad.modelName) {
            ad = ad.data;
        }
        window.__CURRENT_AD = ad;

        // ── 1. Page title & breadcrumb ─────────────────────────────
        const adTitle = ad.title || `${ad.brand || ''} ${ad.modelName || ''}`.trim() || i18n.t('untitledAd');
        document.title = `${adTitle} — Mobilim.az`;

        const titleEl = document.querySelector('.ad-main-title');
        if (titleEl) titleEl.textContent = adTitle;

        const brandBreadcrumb = document.querySelector('.breadcrumb-brand') || document.querySelectorAll('.breadcrumb a')[2];
        const brandSep = document.querySelector('.breadcrumb-brand-sep');
        const currentBreadcrumb = document.querySelector('.breadcrumb-model') || document.querySelector('.breadcrumb .current');
        const modelSep = document.querySelector('.breadcrumb-model-sep');

        if (ad.brand) {
            if (brandBreadcrumb) {
                brandBreadcrumb.textContent = ad.brand;
                brandBreadcrumb.href = `phone.html?brand=${encodeURIComponent(ad.brand)}`;
                brandBreadcrumb.style.display = '';
            }
            if (brandSep) brandSep.style.display = '';
        }
        if (currentBreadcrumb) {
            currentBreadcrumb.textContent = adTitle;
        }
        if (modelSep) modelSep.style.display = '';

        // ── 2. Price ───────────────────────────────────────────────
        const priceEl = document.querySelector('.ad-main-price');
        if (priceEl) priceEl.innerHTML = `${Number(ad.price || 0).toLocaleString('az-AZ')} <span class="ad-currency">AZN</span>`;

        // ── 3 & 4. Description, Date & Views (localized) ───────────
        const renderHeaderMeta = () => {
            const descEl = document.querySelector('.desc-text');
            if (descEl) descEl.textContent = ad.description || i18n.t('noDescription');

            const dateEl  = document.querySelector('.ad-date-views span:nth-child(1)');
            const viewsEl = document.querySelector('.ad-date-views span:nth-child(2)');
            if (dateEl)  dateEl.innerHTML  = `<i class="fas fa-clock"></i> ${i18n.formatDate(ad.createdAt)}`;
            if (viewsEl) viewsEl.innerHTML = `<i class="fas fa-eye"></i> ${ad.views || 0} ${i18n.t('views')}`;
        };
        renderHeaderMeta();

        // ── 5. Image Gallery ───────────────────────────────────────
        const mainImg        = document.getElementById('mainImage');
        const thumbsContainer= document.getElementById('galleryThumbs');
        const prevBtn        = document.getElementById('prevBtn');
        const nextBtn        = document.getElementById('nextBtn');
        const galleryMain    = document.getElementById('galleryMain');
        const vipBadge       = document.querySelector('.badge-vip');
        const newBadge       = document.querySelector('.badge-new');

        const isVip = ad.promotionType === 'VIP';
        const isNew = ad.condition === 'Yeni';

        if (vipBadge) {
            vipBadge.classList.toggle('hidden', !isVip);
            vipBadge.style.display = isVip ? '' : 'none';
        }

        if (newBadge) {
            newBadge.classList.toggle('hidden', !isNew);
            newBadge.style.display = isNew ? '' : 'none';
        }

        const images = Array.isArray(ad.images) ? ad.images.filter(Boolean) : [];

        if (images.length > 0) {
            if (mainImg) {
                mainImg.src = getImageUrl(images[0]);
                mainImg.alt = adTitle;
                mainImg.onerror = function() {
                    this.onerror = null;
                    this.src = '/assets/images/default-ad.svg';
                };
            }

            if (thumbsContainer) thumbsContainer.replaceChildren();
            if (images.length === 1) {
                // Single image — hide nav elements
                if (thumbsContainer) thumbsContainer.style.display = 'none';
                if (prevBtn)         prevBtn.style.display = 'none';
                if (nextBtn)         nextBtn.style.display = 'none';
            } else {
                // Multiple images — build thumbs + arrow nav
                let currentIdx = 0;
                const allUrls = images.map(getImageUrl);

                const goTo = (idx) => {
                    currentIdx = (idx + allUrls.length) % allUrls.length;
                    if (mainImg) mainImg.src = allUrls[currentIdx];
                    if (thumbsContainer) {
                        thumbsContainer.querySelectorAll('.thumb').forEach((t, i) =>
                            t.classList.toggle('active', i === currentIdx));
                    }
                };

                if (thumbsContainer) {
                    thumbsContainer.style.display = '';
                    thumbsContainer.replaceChildren();
                    images.forEach((img, idx) => {
                        const thumb = document.createElement('div');
                        thumb.className = `thumb${idx === 0 ? ' active' : ''}`;
                        thumb.dataset.src = getImageUrl(img);
                        thumb.innerHTML = `<img src="${getImageUrl(img)}" alt="Şəkil ${idx + 1}" loading="lazy" onerror="this.onerror=null;this.src='/assets/images/default-ad.svg';">`;
                        thumb.addEventListener('click', () => {
                            goTo(idx);
                        });
                        thumbsContainer.appendChild(thumb);
                    });
                }

                if (prevBtn) { prevBtn.style.display = ''; prevBtn.onclick = () => goTo(currentIdx - 1); }
                if (nextBtn) { nextBtn.style.display = ''; nextBtn.onclick = () => goTo(currentIdx + 1); }
            }
        } else {
            // No images — show placeholder
            if (mainImg) {
                mainImg.removeAttribute('src');
                mainImg.alt = 'Şəkil yoxdur';
                mainImg.style.display = 'none';
            }
            if (galleryMain) {
                const placeholder = document.createElement('div');
                placeholder.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--text-secondary);background:var(--bg-primary);';
                placeholder.innerHTML = '<i class="fas fa-image" style="font-size:52px;opacity:0.25;"></i><span style="font-size:14px;font-weight:600;">Şəkil yoxdur</span>';
                galleryMain.appendChild(placeholder);
            }
            if (thumbsContainer) thumbsContainer.style.display = 'none';
            if (prevBtn)         prevBtn.style.display = 'none';
            if (nextBtn)         nextBtn.style.display = 'none';
        }

        const renderSpecsAndLocation = () => {
            // ── 6. Quick Spec Chips ────────────────────────────────
            const quickSpecsEl = document.querySelector('.quick-specs');
            if (quickSpecsEl) {
                quickSpecsEl.replaceChildren();
                const addChip = (iconClass, text) => {
                    if (!text || String(text).trim() === '') return;
                    const chip = document.createElement('span');
                    chip.className = 'spec-chip';
                    const icon = document.createElement('i');
                    icon.className = iconClass;
                    chip.append(icon, document.createTextNode(' ' + text));
                    quickSpecsEl.appendChild(chip);
                };
                if (ad.specs?.memory)         addChip('fas fa-memory', `${i18n.formatMemory(ad.specs.memory)} ${i18n.t('storageChip')}`);
                if (ad.specs?.ram)            addChip('fas fa-microchip', `${i18n.formatRam(ad.specs.ram)} ${i18n.t('ramChip')}`);
                if (ad.specs?.screenSize)     addChip('fas fa-expand-arrows-alt', i18n.formatScreen(ad.specs.screenSize));
                if (ad.specs?.battery)        addChip('fas fa-battery-full', i18n.formatBattery(ad.specs.battery));
                if (ad.specs?.color)          addChip('fas fa-palette', i18n.translateColor(ad.specs.color));
                if (ad.specs?.material)       addChip('fas fa-shield-alt', i18n.translateSpecValue(ad.specs.material));
                if (ad.specs?.glassType)      addChip('fas fa-shield-virus', i18n.translateSpecValue(ad.specs.glassType));
                if (ad.specs?.connectionType) addChip('fas fa-headphones', i18n.translateSpecValue(ad.specs.connectionType));
                if (ad.specs?.headphoneType)  addChip('fas fa-headset', i18n.translateSpecValue(ad.specs.headphoneType));
                if (ad.specs?.power)          addChip('fas fa-bolt', String(ad.specs.power));
                if (ad.specs?.portType)       addChip('fas fa-charging-station', i18n.translateSpecValue(ad.specs.portType));
                if (ad.specs?.cableType)      addChip('fas fa-plug', i18n.translateSpecValue(ad.specs.cableType));
                if (ad.specs?.cableLength)    addChip('fas fa-ruler-horizontal', i18n.translateSpecValue(ad.specs.cableLength));
                if (ad.condition)             addChip('fas fa-box-open', i18n.translateCondition(ad.condition));
            }

            // ── 6.5 Dynamic Feature Badges ─────────────────────────
            const featureBadgesEl = document.querySelector('.feature-badges');
            if (featureBadgesEl) {
                featureBadgesEl.replaceChildren();
                const f = ad.specs?.features || {};
                const addFeatureBadge = (iconClass, text) => {
                    const badge = document.createElement('span');
                    badge.className = 'feat-badge yes';
                    const icon = document.createElement('i');
                    icon.className = iconClass;
                    badge.append(icon, document.createTextNode(' ' + text));
                    featureBadgesEl.appendChild(badge);
                };

                if (f.nfc)             addFeatureBadge('fas fa-wifi', i18n.t('featNfc'));
                if (f.fingerprint)     addFeatureBadge('fas fa-fingerprint', i18n.t('featFingerprint'));
                if (f.waterproof)      addFeatureBadge('fas fa-tint', i18n.t('featWaterproofChip'));
                if (f.expandable)      addFeatureBadge('fas fa-sd-card', i18n.t('featExpandableChip'));
                if (f.magsafe)         addFeatureBadge('fas fa-magnet', i18n.t('featMagsafe'));
                if (f.anc)             addFeatureBadge('fas fa-volume-mute', i18n.t('featAnc'));
                if (f.fastCharge)      addFeatureBadge('fas fa-bolt', i18n.t('featFastCharge'));
                if (f.wirelessCharge)  addFeatureBadge('fas fa-charging-station', i18n.t('featWirelessCharge'));
                if (f.microphone)      addFeatureBadge('fas fa-microphone', i18n.t('featMicrophone'));
                if (f.oleophobic)      addFeatureBadge('fas fa-shield-alt', i18n.t('featOleophobic'));
                if (f.stylus)          addFeatureBadge('fas fa-pen-nib', i18n.t('featStylus'));
                if (f.simCard)         addFeatureBadge('fas fa-sim-card', i18n.t('featSimCard'));
                if (f.delivery)        addFeatureBadge('fas fa-truck', i18n.t('featDelivery'));

                if (featureBadgesEl.children.length === 0) {
                    featureBadgesEl.style.display = 'none';
                } else {
                    featureBadgesEl.style.display = 'flex';
                }
            }

            // ── 7. Full Specs Grid ─────────────────────────────────
            const specsGrid = document.querySelector('.specs-grid');
            if (specsGrid) {
                specsGrid.replaceChildren();
                const addSpecRow = (label, val) => {
                    if (!val || String(val).trim() === '' || String(val).trim() === '-') return;
                    const row = document.createElement('div');
                    row.className = 'spec-row';
                    const lblSpan = document.createElement('span');
                    lblSpan.className = 'spec-label';
                    lblSpan.textContent = label;
                    const valSpan = document.createElement('span');
                    valSpan.className = 'spec-value';
                    valSpan.textContent = String(val);
                    row.append(lblSpan, valSpan);
                    specsGrid.appendChild(row);
                };
                if (ad.category) addSpecRow(i18n.t('lblCategory'), i18n.translateCategory(ad.category));
                if (ad.brand) addSpecRow(i18n.t('lblBrand'), ad.brand);
                if (ad.modelName) addSpecRow(i18n.t('lblModel'), ad.modelName);

                // Electronics specs (only if exists)
                if (ad.specs?.memory) addSpecRow(i18n.t('lblMemory'), i18n.formatMemory(ad.specs.memory));
                if (ad.specs?.ram) addSpecRow(i18n.t('lblRam'), i18n.formatRam(ad.specs.ram));
                if (ad.specs?.screenSize) addSpecRow(i18n.t('lblScreen'), i18n.formatScreen(ad.specs.screenSize));
                if (ad.specs?.battery) addSpecRow(i18n.t('lblBattery'), i18n.formatBattery(ad.specs.battery));

                // Accessory specs (only if exists)
                if (ad.specs?.material) addSpecRow(i18n.t('lblMaterial'), i18n.translateSpecValue(ad.specs.material));
                if (ad.specs?.glassType) addSpecRow(i18n.t('lblGlassType'), i18n.translateSpecValue(ad.specs.glassType));
                if (ad.specs?.connectionType) addSpecRow(i18n.t('lblConnType'), i18n.translateSpecValue(ad.specs.connectionType));
                if (ad.specs?.headphoneType) addSpecRow(i18n.t('lblHeadphoneType'), i18n.translateSpecValue(ad.specs.headphoneType));
                if (ad.specs?.power) addSpecRow(i18n.t('lblPower'), String(ad.specs.power));
                if (ad.specs?.portType) addSpecRow(i18n.t('lblPortType'), i18n.translateSpecValue(ad.specs.portType));
                if (ad.specs?.cableType) addSpecRow(i18n.t('lblCableType'), i18n.translateSpecValue(ad.specs.cableType));
                if (ad.specs?.cableLength) addSpecRow(i18n.t('lblCableLength'), i18n.translateSpecValue(ad.specs.cableLength));

                // Color & Condition
                if (ad.specs?.color) addSpecRow(i18n.t('lblColor'), i18n.translateColor(ad.specs.color));
                addSpecRow(i18n.t('lblCondition'), i18n.translateCondition(ad.condition || 'Yeni'));

                // Features (boolean flags)
                const f = ad.specs?.features || {};
                const yesText = i18n.t('yesVar');
                if (f.nfc)             addSpecRow(i18n.t('featNfc'), yesText);
                if (f.waterproof)      addSpecRow(i18n.t('featWaterproofRow'), yesText);
                if (f.fingerprint)     addSpecRow(i18n.t('featFingerprint'), yesText);
                if (f.magsafe)         addSpecRow(i18n.t('featMagsafeRow'), yesText);
                if (f.anc)             addSpecRow(i18n.t('featAnc'), yesText);
                if (f.microphone)      addSpecRow(i18n.t('featMicrophone'), yesText);
                if (f.fastCharge)      addSpecRow(i18n.t('featFastCharge'), yesText);
                if (f.wirelessCharge)  addSpecRow(i18n.t('featWirelessCharge'), yesText);
                if (f.oleophobic)      addSpecRow(i18n.t('featOleophobic'), yesText);
                if (f.stylus)          addSpecRow(i18n.t('featStylus'), yesText);
                if (f.simCard)         addSpecRow(i18n.t('featSimCardRow'), yesText);
                if (f.expandable)      addSpecRow(i18n.t('featExpandableRow'), yesText);
                if (f.delivery)        addSpecRow(i18n.t('featDelivery'), yesText);

                if (specsGrid.children.length === 0) {
                    specsGrid.innerHTML = `<div class="spec-row"><span class="spec-label">${i18n.t('lblInfo')}</span><span class="spec-value">—</span></div>`;
                }
            }

            // ── 8. Location & Condition rows ───────────────────────
            const locationRows = document.querySelectorAll('.location-item strong');
            if (locationRows[0]) locationRows[0].textContent = i18n.translateCity(ad.city || 'Bakı');
            if (locationRows[1]) locationRows[1].textContent = i18n.translateCondition(ad.condition || 'Yeni');
            if (locationRows[2]) locationRows[2].textContent = ad.specs?.features?.delivery ? i18n.t('var') : i18n.t('yoxdur');

            // ── 9. Category tag ────────────────────────────────────
            const catTag = document.querySelector('.ad-category-tag');
            if (catTag) {
                catTag.replaceChildren();
                const catIcon = document.createElement('i');
                catIcon.className = 'fas fa-mobile-alt';
                catTag.append(catIcon, document.createTextNode(` ${i18n.translateCategory(ad.category || 'Telefon')} · ${ad.brand || ''}`));
            }
        };
        renderSpecsAndLocation();

        // ── 10. Seller Info ────────────────────────────────────────
        isStore = Boolean(ad.sellerType === 'store' && ad.store);
        const sellerNameEl = document.getElementById('sellerName') || document.querySelector('.personal-name');
        const avatarEl = document.getElementById('sellerAvatar') || document.querySelector('.personal-avatar');
        const sellerTypeTag = document.getElementById('sellerTypeTag');
        const sellerLocationTag = document.getElementById('sellerLocationTag');
        const sellerLocationText = document.getElementById('sellerLocationText');
        const storeProfileLink = document.getElementById('storeProfileLink');
        const sellerStats = document.getElementById('sellerStats') || document.querySelector('.personal-stats');
        const sellerSinceRow = document.getElementById('sellerSinceRow') || document.querySelector('.seller-since-row');
        const sellerSinceText = document.getElementById('sellerSinceText');

        if (isStore) {
            // Mode A: Store Seller
            const store = ad.store;
            const storeName = store.storeName || 'Mağaza';

            // Store Name + Verified Badge
            if (sellerNameEl) {
                sellerNameEl.textContent = storeName;
                if (store.isVerified === true) {
                    const verifiedBadge = document.createElement('i');
                    verifiedBadge.className = 'fas fa-check-circle';
                    verifiedBadge.style.cssText = 'color: #007bff; margin-left: 6px; font-size: 15px;';
                    verifiedBadge.title = i18n.t('officialStore');
                    sellerNameEl.appendChild(verifiedBadge);
                }
            }

            // Store Logo / Avatar
            if (avatarEl) {
                avatarEl.replaceChildren();
                if (store.logoUrl) {
                    const img = document.createElement('img');
                    img.src = getImageUrl(store.logoUrl);
                    img.alt = storeName;
                    img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
                    img.onerror = function() {
                        this.onerror = null;
                        this.src = '/assets/images/default-avatar.svg';
                    };
                    avatarEl.appendChild(img);
                } else {
                    avatarEl.textContent = (storeName || 'M').charAt(0).toUpperCase();
                }
            }

            // Store Tag
            if (sellerTypeTag) {
                sellerTypeTag.replaceChildren();
                const storeIcon = document.createElement('i');
                storeIcon.className = 'fas fa-store';
                const storeLabel = document.createElement('span');
                storeLabel.textContent = ' ' + i18n.t('store');
                sellerTypeTag.appendChild(storeIcon);
                sellerTypeTag.appendChild(storeLabel);
            }

            // Store Profile Link
            if (storeProfileLink) {
                if (store._id) {
                    storeProfileLink.href = `store-detail.html?id=${encodeURIComponent(store._id)}`;
                    storeProfileLink.classList.remove('hidden');
                    storeProfileLink.style.display = 'inline-flex';
                } else {
                    storeProfileLink.classList.add('hidden');
                    storeProfileLink.style.display = 'none';
                }
            }

            // Location
            const storeLoc = i18n.translateCity((store.city || ad.city || '').trim());
            if (sellerLocationTag) {
                if (storeLoc) {
                    if (sellerLocationText) {
                        sellerLocationText.textContent = ` ${storeLoc}`;
                    } else {
                        sellerLocationTag.replaceChildren();
                        const locIcon = document.createElement('i');
                        locIcon.className = 'fas fa-map-marker-alt';
                        sellerLocationTag.appendChild(locIcon);
                        sellerLocationTag.appendChild(document.createTextNode(` ${storeLoc}`));
                    }
                    sellerLocationTag.classList.remove('hidden');
                    sellerLocationTag.style.display = 'flex';
                } else {
                    sellerLocationTag.classList.add('hidden');
                    sellerLocationTag.style.display = 'none';
                }
            }

            // Stats (Store rating & review count if available)
            if (sellerStats) {
                const hasStoreRating = typeof store.rating === 'number' && store.rating > 0;
                const hasStoreReviews = typeof store.reviewCount === 'number' && store.reviewCount > 0;

                if (hasStoreRating || hasStoreReviews) {
                    sellerStats.replaceChildren();

                    if (hasStoreRating) {
                        const statRatingDiv = document.createElement('div');
                        statRatingDiv.className = 'p-stat';
                        const rVal = document.createElement('span');
                        rVal.className = 'val';
                        rVal.textContent = Number(store.rating).toFixed(1);
                        const rLbl = document.createElement('span');
                        rLbl.className = 'lbl';
                        rLbl.textContent = i18n.t('rating');
                        statRatingDiv.appendChild(rVal);
                        statRatingDiv.appendChild(rLbl);
                        sellerStats.appendChild(statRatingDiv);
                    }

                    if (hasStoreReviews) {
                        const statCountDiv = document.createElement('div');
                        statCountDiv.className = 'p-stat';
                        const cVal = document.createElement('span');
                        cVal.className = 'val';
                        cVal.textContent = String(store.reviewCount);
                        const cLbl = document.createElement('span');
                        cLbl.className = 'lbl';
                        cLbl.textContent = i18n.t('review');
                        statCountDiv.appendChild(cVal);
                        statCountDiv.appendChild(cLbl);
                        sellerStats.appendChild(statCountDiv);
                    }

                    sellerStats.classList.remove('hidden');
                    sellerStats.style.display = 'grid';
                } else {
                    sellerStats.classList.add('hidden');
                    sellerStats.style.display = 'none';
                }
            }

            // Membership / creation date
            const storeDateVal = store.createdAt || ad.createdAt;
            if (sellerSinceRow) {
                if (storeDateVal && i18n.formatMonthYear(storeDateVal)) {
                    if (sellerSinceText) {
                        sellerSinceText.textContent = ` ${i18n.formatMonthYear(storeDateVal)}`;
                    }
                    sellerSinceRow.classList.remove('hidden');
                    sellerSinceRow.style.display = '';
                } else {
                    sellerSinceRow.classList.add('hidden');
                    sellerSinceRow.style.display = 'none';
                }
            }

        } else {
            // Mode B: Personal Seller
            const author = ad.author || ad.user || {};
            const authorName = [author.name, author.lastName].filter(Boolean).join(' ') || author.name || author.email || i18n.t('deletedUser');

            // Seller Name
            if (sellerNameEl) {
                sellerNameEl.textContent = authorName;
            }

            // Avatar
            if (avatarEl) {
                avatarEl.replaceChildren();
                if (author.avatar) {
                    const img = document.createElement('img');
                    img.src = getImageUrl(author.avatar);
                    img.alt = authorName;
                    img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
                    img.onerror = function() {
                        this.onerror = null;
                        this.src = '/assets/images/default-avatar.svg';
                    };
                    avatarEl.appendChild(img);
                } else {
                    avatarEl.textContent = (author.name || authorName).charAt(0).toUpperCase() || 'S';
                }
            }

            // Account Tag
            if (sellerTypeTag) {
                sellerTypeTag.replaceChildren();
                const userIcon = document.createElement('i');
                userIcon.className = 'fas fa-user-circle';
                const userLabel = document.createElement('span');
                userLabel.setAttribute('data-translate', 'det-seller-personal');
                userLabel.textContent = ' ' + i18n.t('personalAccount');
                sellerTypeTag.appendChild(userIcon);
                sellerTypeTag.appendChild(userLabel);
            }

            // Store Profile Link (hide)
            if (storeProfileLink) {
                storeProfileLink.classList.add('hidden');
                storeProfileLink.style.display = 'none';
            }

            // Location
            const personalLoc = [ad.city ? i18n.translateCity(ad.city) : '', ad.region ? i18n.translateCity(ad.region) : ''].filter(Boolean).join(', ').trim();
            if (sellerLocationTag) {
                if (personalLoc) {
                    if (sellerLocationText) {
                        sellerLocationText.textContent = ` ${personalLoc}`;
                    } else {
                        sellerLocationTag.replaceChildren();
                        const locIcon = document.createElement('i');
                        locIcon.className = 'fas fa-map-marker-alt';
                        sellerLocationTag.appendChild(locIcon);
                        sellerLocationTag.appendChild(document.createTextNode(` ${personalLoc}`));
                    }
                    sellerLocationTag.classList.remove('hidden');
                    sellerLocationTag.style.display = 'flex';
                } else {
                    sellerLocationTag.classList.add('hidden');
                    sellerLocationTag.style.display = 'none';
                }
            }

            // Email Tag
            const sellerEmailTag = document.getElementById('sellerEmailTag');
            const sellerEmailText = document.getElementById('sellerEmailText');
            if (sellerEmailTag) {
                const authorEmail = (author.email || '').trim();
                if (authorEmail) {
                    if (sellerEmailText) sellerEmailText.textContent = ` ${authorEmail}`;
                    sellerEmailTag.classList.remove('hidden');
                    sellerEmailTag.style.display = 'flex';
                } else {
                    sellerEmailTag.classList.add('hidden');
                    sellerEmailTag.style.display = 'none';
                }
            }

            // Phone Tag
            const sellerPhoneTag = document.getElementById('sellerPhoneTag');
            const sellerPhoneText = document.getElementById('sellerPhoneText');
            if (sellerPhoneTag) {
                const authorPhone = (author.phone || ad.contactPhone || '').trim();
                if (authorPhone) {
                    if (sellerPhoneText) sellerPhoneText.textContent = ` ${authorPhone}`;
                    sellerPhoneTag.classList.remove('hidden');
                    sellerPhoneTag.style.display = 'flex';
                } else {
                    sellerPhoneTag.classList.add('hidden');
                    sellerPhoneTag.style.display = 'none';
                }
            }

            // Stats (Hide dummy stats for personal seller)
            if (sellerStats) {
                sellerStats.classList.add('hidden');
                sellerStats.style.display = 'none';
            }

            // Membership date
            if (sellerSinceRow) {
                if (ad.author?.createdAt && i18n.formatMonthYear(ad.author.createdAt)) {
                    if (sellerSinceText) {
                        sellerSinceText.textContent = ` ${i18n.formatMonthYear(ad.author.createdAt)}`;
                    }
                    sellerSinceRow.classList.remove('hidden');
                    sellerSinceRow.style.display = '';
                } else {
                    sellerSinceRow.classList.add('hidden');
                    sellerSinceRow.style.display = 'none';
                }
            }
        }

        // ── 11. Ad ID bar (footer) ─────────────────────────────────
        const adIdSpan     = document.querySelector('.ad-id-bar span:nth-child(1) span:nth-child(2)');
        const postedSpan   = document.querySelector('.ad-id-bar span:nth-child(2) span:nth-child(2)');
        const updatedSpan  = document.querySelector('.ad-id-bar span:nth-child(3) span:nth-child(2)');
        const displayAdNumber = ad.adNumber || (ad._id ? (String(ad._id) === '6ad7634079a9d25725d38022' ? 'MOB-5D3802' : `MOB-${String(ad._id).slice(-6).toUpperCase()}`) : '—');
        if (adIdSpan)    adIdSpan.textContent   = displayAdNumber;
        if (postedSpan)  postedSpan.textContent  = i18n.formatDate(ad.createdAt);
        if (updatedSpan) updatedSpan.textContent = i18n.formatDate(ad.updatedAt || ad.createdAt);

        // ── 12. Author: Edit/Delete buttons ───────────────────────
        let isAuthor = false;
        try {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            isAuthor = !!(user && ad.author && (user.id === ad.author._id || user._id === ad.author._id));
        } catch { /* ignore parse errors */ }

        if (isAuthor) {
            const contactBtnGroup = document.querySelector('.contact-btn-group');
            if (contactBtnGroup) {
                contactBtnGroup.innerHTML = `
                    <button class="btn-call-reveal" style="background:var(--airy-primary);margin-bottom:10px;" id="editAdBtn">
                        <i class="fas fa-edit"></i> ${i18n.t('editBtn')}
                    </button>
                    <button class="btn-message" style="color:#dc3545;border-color:#dc3545;" id="deleteAdBtn">
                        <i class="fas fa-trash-alt"></i> ${i18n.t('deleteBtn')}
                    </button>`;

                document.getElementById('editAdBtn')?.addEventListener('click', () => {
                    window.location.href = `elan-yerlesdir.html?edit=${ad._id}`;
                });

                document.getElementById('deleteAdBtn')?.addEventListener('click', async () => {
                    if (!confirm(i18n.t('deleteConfirm'))) return;
                    try {
                        const token = (typeof window !== "undefined" && window.getAuthToken)
                            ? window.getAuthToken()
                            : (sessionStorage.getItem("token") || sessionStorage.getItem("adminToken") || "");
                        const delRes = await fetch(`${API_BASE}/ads/${ad._id}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (delRes.ok) {
                            showToast(i18n.t('adDeleted'));
                            setTimeout(() => window.location.href = 'cabinet.html', 1500);
                        } else {
                            const errData = await delRes.json().catch(() => ({}));
                            showToast(errData.message || i18n.t('deleteErr'));
                        }
                    } catch (e) {
                        showToast(i18n.t('networkErr'));
                    }
                });
            }
            // Hide review forms for own ad
            document.querySelectorAll('.write-review-main, .write-review-card')
                .forEach(c => c.style.display = 'none');
        } else {
            // ── 13. Phone / WhatsApp / Message buttons ─────────────
            const rawPhone = (
                ad.contactPhone ||
                ad.store?.contactNumber ||
                ad.author?.phone ||
                ''
            ).trim();
            const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

            const callBtn  = document.getElementById('callBtn');
            const phoneText= document.getElementById('phoneText');
            if (callBtn && phoneText) {
                if (rawPhone) {
                    let revealed = false;
                    callBtn.addEventListener('click', () => {
                        if (!revealed) {
                            phoneText.removeAttribute('data-translate');
                            phoneText.textContent = rawPhone;
                            callBtn.style.background = 'linear-gradient(135deg,#28a745,#20c997)';
                            revealed = true;
                        } else {
                            window.location.href = `tel:${cleanPhone || rawPhone.replace(/\s+/g, '')}`;
                        }
                    });
                    callBtn.classList.remove('hidden');
                    callBtn.style.display = '';
                } else {
                    callBtn.classList.add('hidden');
                    callBtn.style.display = 'none';
                }
            }

            const waBtn = document.querySelector('.btn-whatsapp');
            if (waBtn) {
                if (cleanPhone) {
                    waBtn.href = `https://wa.me/${cleanPhone}`;
                    waBtn.classList.remove('hidden');
                    waBtn.style.display = '';
                } else {
                    waBtn.href = '#';
                    waBtn.classList.add('hidden');
                    waBtn.style.display = 'none';
                }
            }

            const msgBtn = document.querySelector('.btn-message');
            if (msgBtn && ad.author?._id) {
                const newMsgBtn = msgBtn.cloneNode(true);
                msgBtn.parentNode.replaceChild(newMsgBtn, msgBtn);
                newMsgBtn.addEventListener('click', () => {
                    const token = (typeof window !== "undefined" && window.getAuthToken)
                        ? window.getAuthToken()
                        : (sessionStorage.getItem("token") || sessionStorage.getItem("adminToken") || "");
                    if (!token) {
                        showToast(i18n.t('loginToMessage'));
                        setTimeout(() => window.location.href = 'login.html', 1500);
                        return;
                    }
                    window.location.href = `chat.html?sellerId=${ad.author._id}&adId=${ad._id}`;
                });
            }
        }

        // ── 14. Reviews (non-blocking) ─────────────────────────────
        if (ad.author?._id) {
            const fetchAndRenderReviews = async () => {
                try {
                    const revRes  = await fetch(`${API_BASE}/reviews/${ad.author._id}`);
                    const revData = await revRes.json();
                    if (revRes.ok) renderReviews(revData.reviews || []);
                    else renderReviews([]);
                } catch (e) {
                    console.warn('Reviews fetch failed:', e.message);
                    renderReviews([]);
                    const realRatingEl = document.getElementById('realRating');
                    if (realRatingEl) {
                        realRatingEl.className = 'no-reviews-title';
                        realRatingEl.textContent = i18n.t('noReviews');
                    }
                }
            };

            fetchAndRenderReviews();

            if (!isAuthor) {
                ['main', 'side'].forEach(type => {
                    const selectorId = type === 'main' ? 'mainStarSelect' : 'sideStarSelect';
                    const selector   = document.getElementById(selectorId);
                    if (!selector) return;

                    const stars = selector.querySelectorAll('.star');
                    let currentRating = 0;

                    stars.forEach(s => {
                        s.addEventListener('click', () => {
                            currentRating = parseInt(s.dataset.val) || 0;
                            stars.forEach((st, idx) => {
                                st.style.color = idx < currentRating ? '#ffc107' : 'var(--border-color)';
                            });
                        });
                    });

                    const submitBtn = selector.parentElement?.querySelector('.btn-submit-review');
                    if (!submitBtn) return;

                    submitBtn.addEventListener('click', async () => {
                        const token = (typeof window !== "undefined" && window.getAuthToken)
                            ? window.getAuthToken()
                            : (sessionStorage.getItem("token") || sessionStorage.getItem("adminToken") || "");
                        if (!token) { showToast(i18n.t('loginToReview')); return; }
                        if (!currentRating) { showToast(i18n.t('selectRating')); return; }

                        const textElId = type === 'main' ? 'mainReviewText' : 'sideReviewText';
                        const textEl   = document.getElementById(textElId);
                        const text     = textEl?.value.trim() || '';

                        const btnText  = submitBtn.innerHTML;
                        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${i18n.t('sending')}`;

                        try {
                            const postRes = await fetch(`${API_BASE}/reviews`, {
                                method: 'POST',
                                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ targetUserId: ad.author._id, rating: currentRating, comment: text })
                            });
                            const data = await postRes.json();
                            if (postRes.ok) {
                                showToast(i18n.t('reviewAdded'));
                                if (textEl) textEl.value = '';
                                fetchAndRenderReviews();
                            } else {
                                showToast(data.message || i18n.t('errOccurred'));
                            }
                        } catch (e) {
                            showToast(i18n.t('networkErr'));
                            renderReviews([]);
                        } finally {
                            submitBtn.innerHTML = btnText;
                        }
                    });
                });
            }
        } else {
            renderReviews([]);
        }

        // ── 15. Related Ads (non-blocking) ──────────────────────────
        const fetchAndRenderRelated = async () => {
            const relatedSection = document.querySelector('.related-section');
            const relatedGrid = document.querySelector('.related-grid');
            if (!relatedGrid) return;

            const hideRelated = () => {
                if (relatedSection) {
                    relatedSection.classList.add('hidden');
                    relatedSection.style.display = 'none';
                }
            };

            const showRelated = () => {
                if (relatedSection) {
                    relatedSection.classList.remove('hidden');
                    relatedSection.style.display = '';
                }
            };

            const category = ad.category ? String(ad.category).trim() : '';
            if (!category) {
                hideRelated();
                return;
            }

            try {
                let queryUrl = `${API_BASE}/ads?category=${encodeURIComponent(category)}&limit=5`;
                if (ad.brand && String(ad.brand).trim()) {
                    queryUrl += `&brand=${encodeURIComponent(String(ad.brand).trim())}`;
                }

                let res = await fetch(queryUrl);
                let data = res.ok ? await res.json() : null;
                let adsList = (data && Array.isArray(data.ads)) ? data.ads : [];

                let filtered = adsList.filter(item => item && item._id && item._id !== ad._id);
                if (filtered.length === 0 && ad.brand && String(ad.brand).trim()) {
                    const fallbackRes = await fetch(`${API_BASE}/ads?category=${encodeURIComponent(category)}&limit=5`);
                    const fallbackData = fallbackRes.ok ? await fallbackRes.json() : null;
                    const fallbackList = (fallbackData && Array.isArray(fallbackData.ads)) ? fallbackData.ads : [];
                    filtered = fallbackList.filter(item => item && item._id && item._id !== ad._id);
                }

                const relatedAds = filtered.slice(0, 4);

                if (relatedAds.length === 0) {
                    hideRelated();
                    return;
                }

                relatedGrid.replaceChildren();

                relatedAds.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'ad-card';
                    card.style.cursor = 'pointer';
                    card.addEventListener('click', () => {
                        window.location.href = `elan-detail.html?id=${encodeURIComponent(item._id)}`;
                    });

                    // Image container
                    const imgContainer = document.createElement('div');
                    imgContainer.className = 'ad-image';

                    const imgEl = document.createElement('img');
                    const imgSrc = (Array.isArray(item.images) && item.images.length > 0)
                        ? getImageUrl(item.images[0])
                        : '';
                    imgEl.src = imgSrc || '/assets/images/default-ad.svg';
                    imgEl.onerror = function() {
                        this.onerror = null;
                        this.src = '/assets/images/default-ad.svg';
                    };
                    const itemTitle = `${item.brand || ''} ${item.modelName || ''}`.trim() || item.title || i18n.t('adFallback');
                    imgEl.alt = itemTitle;
                    imgEl.loading = 'lazy';
                    imgContainer.appendChild(imgEl);

                    const badge = document.createElement('span');
                    badge.className = 'ad-badge';
                    if (item.sellerType === 'personal') {
                        badge.style.background = '#e67e22';
                        badge.textContent = i18n.t('private');
                    } else {
                        badge.textContent = i18n.t('store');
                    }
                    imgContainer.appendChild(badge);

                    card.appendChild(imgContainer);

                    // Info container
                    const infoContainer = document.createElement('div');
                    infoContainer.className = 'ad-info';

                    const priceEl = document.createElement('div');
                    priceEl.className = 'ad-price';
                    priceEl.textContent = `${Number(item.price || 0).toLocaleString('az-AZ')} AZN`;
                    infoContainer.appendChild(priceEl);

                    const titleEl = document.createElement('div');
                    titleEl.className = 'ad-title';
                    titleEl.textContent = itemTitle;
                    infoContainer.appendChild(titleEl);

                    const locEl = document.createElement('div');
                    locEl.className = 'ad-location';

                    const citySpan = document.createElement('span');
                    const cityIcon = document.createElement('i');
                    cityIcon.className = 'fas fa-map-marker-alt';
                    citySpan.appendChild(cityIcon);
                    citySpan.appendChild(document.createTextNode(` ${i18n.translateCity(item.city || 'Bakı')}`));
                    locEl.appendChild(citySpan);

                    const dateSpan = document.createElement('span');
                    if (item.createdAt) {
                        dateSpan.textContent = i18n.formatDate(item.createdAt);
                    }
                    locEl.appendChild(dateSpan);

                    infoContainer.appendChild(locEl);
                    card.appendChild(infoContainer);

                    relatedGrid.appendChild(card);
                });

                showRelated();
            } catch (err) {
                console.warn('Failed to load related ads:', err);
                hideRelated();
            }
        };

        fetchAndRenderRelated();

    } catch (err) {
        console.error('[ad-details] Error:', err);
        showPageError(err.message || 'Naməlum xəta baş verdi.');
        return; // revealPage() called inside showPageError
        // Re-render dynamic localized blocks when language changes live
        document.addEventListener('mobilaz:languagechange', () => {
            try {
                if (typeof renderHeaderMeta === 'function') renderHeaderMeta();
                if (typeof renderSpecsAndLocation === 'function') renderSpecsAndLocation();
                if (typeof fetchAndRenderRelated === 'function') fetchAndRenderRelated();
                if (Array.isArray(window.__CURRENT_REVIEWS)) renderReviews(window.__CURRENT_REVIEWS);

                const sinceTextEl = document.getElementById('sellerSinceText');
                if (sinceTextEl) {
                    const dt = (ad.sellerType === 'store' && ad.store?.createdAt) ? ad.store.createdAt : (ad.author?.createdAt || ad.createdAt);
                    if (dt) sinceTextEl.textContent = ' ' + i18n.formatMonthYear(dt);
                }
                const sellerTypeEl = document.getElementById('sellerTypeTag');
                if (sellerTypeEl) {
                    const lblSpan = sellerTypeEl.querySelector('span');
                    if (lblSpan) lblSpan.textContent = ' ' + (ad.sellerType === 'store' && ad.store ? i18n.t('store') : i18n.t('personalAccount'));
                }
                const locTextEl = document.getElementById('sellerLocationText');
                if (locTextEl) {
                    const rawCity = (ad.sellerType === 'store' && ad.store?.city) ? ad.store.city : ad.city;
                    if (rawCity) {
                        const locParts = [i18n.translateCity(rawCity), (ad.sellerType !== 'store' && ad.region ? i18n.translateCity(ad.region) : '')].filter(Boolean);
                        locTextEl.textContent = ' ' + locParts.join(', ');
                    }
                }
                const editBtn = document.getElementById('editAdBtn');
                if (editBtn) editBtn.innerHTML = `<i class="fas fa-edit"></i> ${i18n.t('editBtn')}`;
                const delBtn = document.getElementById('deleteAdBtn');
                if (delBtn) delBtn.innerHTML = `<i class="fas fa-trash-alt"></i> ${i18n.t('deleteBtn')}`;
            } catch (err) { /* ignore live re-render errors */ }
        });
    } finally {
        // ✅ ALWAYS reveal — no matter what happened above
        revealPage();
        if (typeof window.applyLanguage === 'function') {
            try { window.applyLanguage(); } catch (e) { /* ignore */ }
        }
    }

    // ── renderReviews helper ────────────────────────────────────────
    function renderReviews(reviews) {
        reviews = Array.isArray(reviews) ? reviews : [];
        window.__CURRENT_REVIEWS = reviews;
        let total = 0;
        const counts = [0, 0, 0, 0, 0];
        reviews.forEach(r => {
            const val = Number(r.rating) || 0;
            total += val;
            if (val >= 1 && val <= 5) counts[5 - val]++;
        });
        const avg = reviews.length ? (total / reviews.length).toFixed(1) : '-';

        const realRatingEl = document.getElementById('realRating');
        if (realRatingEl) {
            if (reviews.length) {
                realRatingEl.className = '';
                realRatingEl.textContent = `${avg} ★`;
            } else {
                realRatingEl.className = 'no-reviews-title';
                realRatingEl.textContent = i18n.t('noReviews');
            }
        }
        const avgSpan = document.getElementById('avgRating');
        if (avgSpan) avgSpan.textContent = avg;
        const countSpan = document.getElementById('reviewCount');
        if (countSpan) countSpan.textContent = String(reviews.length);

        const summaryEl = document.querySelector('.review-rating-summary');
        if (summaryEl) {
            if (!reviews.length) {
                summaryEl.innerHTML = `
                    <div class="empty-state no-reviews-summary" style="width: 100%; text-align: center; padding: 16px;">
                        <span id="realRating" class="no-reviews-title" style="display:none;">${i18n.t('noReviews')}</span>
                        <span id="avgRating" style="display:none;">-</span>
                        <span id="reviewCount" style="display:none;">0</span>
                        <div class="rating-stars-lg empty-stars" style="color: #9ca3af; font-size: 16px; margin: 0 0 6px 0; letter-spacing: 2px;">☆☆☆☆☆</div>
                        <div class="no-reviews-title" style="font-size: 14px; color: #9ca3af; font-weight: 400; text-transform: none;">${i18n.t('noReviews')}</div>
                    </div>`;
            } else {
                summaryEl.innerHTML = `
                    <div>
                        <div class="rating-big"><span id="realRating">${avg} ★</span><span id="avgRating" style="display:none;">${avg}</span></div>
                        <div class="rating-stars-lg">${getStarsHtml(Math.round(Number(avg)))}</div>
                        <div class="rating-count"><span id="reviewCount">${reviews.length}</span> ${i18n.t('basedOnReviews')}</div>
                    </div>
                    <div class="rating-bars" style="flex:1">
                        ${[5,4,3,2,1].map((star, idx) => {
                            const pct = Math.round((counts[idx] / reviews.length) * 100);
                            return `<div class="rbar" style="display:flex;align-items:center;gap:8px;margin-bottom:7px;font-size:12.5px;">
                                <span class="rbar-label" style="color:var(--text-secondary);width:28px;text-align:right;">${star}★</span>
                                <div class="rbar-track" style="flex:1;height:6px;background:var(--border-color);border-radius:4px;overflow:hidden;">
                                    <div style="height:100%;border-radius:4px;background:#ffc107;width:${pct}%"></div>
                                </div>
                                <span class="rbar-count" style="color:var(--text-secondary);width:20px;text-align:right;">${counts[idx]}</span>
                            </div>`;
                        }).join('')}
                    </div>`;
            }
        }

        const section = document.querySelector('.reviews-section');
        if (section) {
            section.querySelectorAll('.review-card-full').forEach(e => e.remove());
            section.querySelectorAll('.no-reviews-empty').forEach(e => e.remove());
            const writeBlock = section.querySelector('.write-review-main');

            if (!reviews.length) {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'no-reviews-empty empty-state';
                emptyDiv.style.cssText = 'padding: 16px; text-align: center; color: #6b7280; font-size: 14px;';
                emptyDiv.innerHTML = `<span class="no-reviews-title" style="font-size: 14px; color: #9ca3af; font-weight: 400;">${i18n.t('noReviews')}</span>`;
                section.insertBefore(emptyDiv, writeBlock || null);
            } else {
                reviews.slice(0, 10).forEach(r => {
                    const div = document.createElement('div');
                    div.className = 'review-card-full';
                    const char = r.author?.name ? r.author.name.charAt(0).toUpperCase() : 'U';
                    const date = r.createdAt ? i18n.formatDate(r.createdAt) : '';

                    const header = document.createElement('div');
                    header.className = 'rc-header';

                    const avatar = document.createElement('div');
                    avatar.className = 'rc-avatar';
                    avatar.style.background = 'linear-gradient(135deg,#5e5ce6,#a78bfa)';
                    avatar.textContent = char;

                    const info = document.createElement('div');
                    const nameDiv = document.createElement('div');
                    nameDiv.className = 'rc-name';
                    nameDiv.textContent = r.author?.name || r.author?.email || i18n.t('user');
                    const dateDiv = document.createElement('div');
                    dateDiv.className = 'rc-date';
                    dateDiv.textContent = date;
                    info.append(nameDiv, dateDiv);

                    const starsDiv = document.createElement('div');
                    starsDiv.className = 'rc-stars';
                    starsDiv.innerHTML = getStarsHtml(r.rating);

                    header.append(avatar, info, starsDiv);

                    const textP = document.createElement('p');
                    textP.className = 'rc-text';
                    textP.textContent = r.comment || '';

                    div.append(header, textP);
                    section.insertBefore(div, writeBlock || null);
                });
            }
        }

        const miniContainer = document.querySelector('.mini-reviews');
        if (miniContainer) {
            miniContainer.replaceChildren();
            if (!reviews.length) {
                const emptyMini = document.createElement('div');
                emptyMini.className = 'no-reviews-empty empty-state';
                emptyMini.style.cssText = 'padding: 12px; text-align: center; color: #9ca3af; font-size: 13px;';
                emptyMini.innerHTML = `<span class="no-reviews-title" style="font-size: 13px; color: #9ca3af; font-weight: 400;">${i18n.t('noReviews')}</span>`;
                miniContainer.appendChild(emptyMini);
            } else {
                reviews.slice(0, 3).forEach(r => {
                    const char = r.author?.name ? r.author.name.charAt(0).toUpperCase() : 'U';

                    const item = document.createElement('div');
                    item.className = 'mini-review-item';

                    const top = document.createElement('div');
                    top.className = 'mini-review-top';

                    const avatar = document.createElement('div');
                    avatar.className = 'mini-avatar';
                    avatar.style.background = 'linear-gradient(135deg,#5e5ce6,#a78bfa)';
                    avatar.textContent = char;

                    const nameDiv = document.createElement('div');
                    nameDiv.className = 'mini-name';
                    nameDiv.textContent = r.author?.name || r.author?.email || i18n.t('user');

                    const starsDiv = document.createElement('div');
                    starsDiv.className = 'mini-stars';
                    starsDiv.innerHTML = getStarsHtml(r.rating);

                    top.append(avatar, nameDiv, starsDiv);

                    const textDiv = document.createElement('div');
                    textDiv.className = 'mini-text';
                    textDiv.textContent = r.comment || '';

                    item.append(top, textDiv);
                    miniContainer.appendChild(item);
                });
            }
        }

        // Dynamically show personal seller rating stat if reviews exist
        const currentSellerStats = document.getElementById('sellerStats') || document.querySelector('.personal-stats');
        const currentIsStore = Boolean(window.__CURRENT_AD?.sellerType === 'store' && window.__CURRENT_AD?.store);
        if (!currentIsStore && currentSellerStats && Array.isArray(reviews) && reviews.length > 0) {
            currentSellerStats.replaceChildren();

            const statRatingDiv = document.createElement('div');
            statRatingDiv.className = 'p-stat';
            const rVal = document.createElement('span');
            rVal.className = 'val';
            rVal.textContent = avg;
            const rLbl = document.createElement('span');
            rLbl.className = 'lbl';
            rLbl.textContent = '★ Reytinq';
            statRatingDiv.appendChild(rVal);
            statRatingDiv.appendChild(rLbl);
            currentSellerStats.appendChild(statRatingDiv);

            const statCountDiv = document.createElement('div');
            statCountDiv.className = 'p-stat';
            const cVal = document.createElement('span');
            cVal.className = 'val';
            cVal.textContent = String(reviews.length);
            const cLbl = document.createElement('span');
            cLbl.className = 'lbl';
            cLbl.textContent = 'Rəy';
            statCountDiv.appendChild(cVal);
            statCountDiv.appendChild(cLbl);
            currentSellerStats.appendChild(statCountDiv);

            currentSellerStats.classList.remove('hidden');
            currentSellerStats.style.display = 'grid';
        }
    }

}); // end DOMContentLoaded

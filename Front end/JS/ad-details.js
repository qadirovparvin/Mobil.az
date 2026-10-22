/* ================================================================
   ad-details.js  —  Mobil.az Ad Detail Page
   - Fetches real ad data from the backend API
   - Populates all DOM elements with real data
   - ALWAYS reveals the page in finally{} — never stays blank
   ================================================================ */

document.addEventListener('DOMContentLoaded', async () => {

    // ── Helpers (defined first so they're always available) ────────

    const API_BASE = window.API_URL || window.API_BASE || 'http://localhost:5000/api';
    const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

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

    // ── Show visible error on screen ───────────────────────────────
    function showPageError(msg) {
        revealPage();
        const wrapper = document.getElementById('detailWrapper');
        if (wrapper) {
            wrapper.innerHTML = `
                <div style="text-align:center;padding:80px 20px;font-size:17px;color:var(--text-secondary,#888);max-width:500px;margin:0 auto;">
                    <i class="fas fa-exclamation-triangle" style="font-size:52px;color:#dc3545;display:block;margin-bottom:18px;"></i>
                    <strong style="color:var(--text-primary,#111);font-size:20px;display:block;margin-bottom:10px;">Xəta baş verdi</strong>
                    <p class="error-msg-box" style="background:#fff3cd;border:1px solid #ffc107;border-radius:10px;padding:12px 16px;font-family:monospace;font-size:13px;text-align:left;word-break:break-word;"></p>
                    <a href="index.html" style="display:inline-block;margin-top:20px;padding:12px 28px;background:var(--airy-primary,#5e5ce6);color:#fff;border-radius:12px;text-decoration:none;font-weight:700;">← Ana Səhifəyə Qayıt</a>
                </div>`;
            const errP = wrapper.querySelector('.error-msg-box');
            if (errP) errP.textContent = String(msg ?? '');
        }
    }

    // ── Read ad ID from URL ─────────────────────────────────────────
    const params = new URLSearchParams(window.location.search);
    const adId   = params.get('id');

    if (!adId) {
        showPageError('URL-də elan ID-si tapılmadı. Ana səhifəyə qayıdıb bir elana klikləyin.');
        return;
    }

    // ── Main try/catch/finally ─────────────────────────────────────
    try {

        // ── Fetch the ad ───────────────────────────────────────────
        const res = await fetch(`${API_BASE}/ads/${adId}`);
        let ad;
        try {
            ad = await res.json();
        } catch {
            throw new Error(`Server JSON cavabı parse edilmədi (HTTP ${res.status})`);
        }

        if (!res.ok) {
            throw new Error(ad?.message || `Elan tapılmadı (HTTP ${res.status})`);
        }

        // ── 1. Page title & breadcrumb ─────────────────────────────
        const adTitle = `${ad.brand || ''} ${ad.modelName || ''}`.trim() || 'Adsız Elan';
        document.title = `${adTitle} — Mobil.az`;

        const titleEl = document.querySelector('.ad-main-title');
        if (titleEl) titleEl.textContent = adTitle;

        const currentBreadcrumb = document.querySelector('.breadcrumb .current');
        if (currentBreadcrumb) currentBreadcrumb.textContent = adTitle;

        const brandBreadcrumb = document.querySelectorAll('.breadcrumb a')[2];
        if (brandBreadcrumb) brandBreadcrumb.textContent = ad.brand || '';

        // ── 2. Price ───────────────────────────────────────────────
        const priceEl = document.querySelector('.ad-main-price');
        if (priceEl) priceEl.innerHTML = `${Number(ad.price || 0).toLocaleString('az-AZ')} <span class="ad-currency">AZN</span>`;

        // ── 3. Description ─────────────────────────────────────────
        const descEl = document.querySelector('.desc-text');
        if (descEl) descEl.textContent = ad.description || 'Açıqlama yoxdur.';

        // ── 4. Date & Views ────────────────────────────────────────
        const dateEl  = document.querySelector('.ad-date-views span:nth-child(1)');
        const viewsEl = document.querySelector('.ad-date-views span:nth-child(2)');
        if (dateEl)  dateEl.innerHTML  = `<i class="fas fa-clock"></i> ${new Date(ad.createdAt).toLocaleDateString('az-AZ')}`;
        if (viewsEl) viewsEl.innerHTML = `<i class="fas fa-eye"></i> ${ad.views || 0} baxış`;

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
            }

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
                        thumb.innerHTML = `<img src="${getImageUrl(img)}" alt="Şəkil ${idx + 1}" loading="lazy">`;
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

        // ── 6. Quick Spec Chips ────────────────────────────────────
        const quickSpecsEl = document.querySelector('.quick-specs');
        if (quickSpecsEl) {
            quickSpecsEl.replaceChildren();
            const addChip = (iconClass, text) => {
                const chip = document.createElement('span');
                chip.className = 'spec-chip';
                const icon = document.createElement('i');
                icon.className = iconClass;
                chip.append(icon, document.createTextNode(' ' + text));
                quickSpecsEl.appendChild(chip);
            };
            if (ad.specs?.memory)     addChip('fas fa-memory', `${ad.specs.memory} Yaddaş`);
            if (ad.specs?.ram)        addChip('fas fa-microchip', `${ad.specs.ram} RAM`);
            if (ad.specs?.color)      addChip('fas fa-palette', String(ad.specs.color));
            if (ad.specs?.screenSize) addChip('fas fa-expand-arrows-alt', `${ad.specs.screenSize}"`);
            if (ad.condition)         addChip('fas fa-box-open', String(ad.condition));
        }

        // ── 7. Full Specs Grid ─────────────────────────────────────
        const specsGrid = document.querySelector('.specs-grid');
        if (specsGrid) {
            specsGrid.replaceChildren();
            const addSpecRow = (label, val) => {
                const row = document.createElement('div');
                row.className = 'spec-row';
                const lblSpan = document.createElement('span');
                lblSpan.className = 'spec-label';
                lblSpan.textContent = label;
                const valSpan = document.createElement('span');
                valSpan.className = 'spec-value';
                valSpan.textContent = String(val || '-');
                row.append(lblSpan, valSpan);
                specsGrid.appendChild(row);
            };
            addSpecRow('Marka', ad.brand);
            addSpecRow('Model', ad.modelName);
            addSpecRow('Yaddaş', ad.specs?.memory);
            addSpecRow('RAM', ad.specs?.ram);
            addSpecRow('Rəng', ad.specs?.color);
            addSpecRow('Vəziyyəti', ad.condition);

            if (ad.specs?.features?.nfc)         addSpecRow('NFC', '✓ Var');
            if (ad.specs?.features?.waterproof)  addSpecRow('Suya davamlılıq', '✓ Var');
            if (ad.specs?.features?.fingerprint) addSpecRow('Barmaq izi', '✓ Var');
        }

        // ── 8. Location & Condition rows ───────────────────────────
        const locationRows = document.querySelectorAll('.location-item strong');
        if (locationRows[0]) locationRows[0].textContent = ad.city || 'Bakı';
        if (locationRows[1]) locationRows[1].textContent = ad.condition || 'Yeni';
        if (locationRows[2]) locationRows[2].textContent = ad.specs?.features?.delivery ? 'Var' : 'Yoxdur';

        // ── 9. Category tag ────────────────────────────────────────
        const catTag = document.querySelector('.ad-category-tag');
        if (catTag) {
            catTag.replaceChildren();
            const catIcon = document.createElement('i');
            catIcon.className = 'fas fa-mobile-alt';
            catTag.append(catIcon, document.createTextNode(` ${ad.category || 'Telefon'} · ${ad.brand || ''}`));
        }

        // ── 10. Seller Info ────────────────────────────────────────
        const isStore = ad.sellerType === 'store' && !!ad.store;
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
                    verifiedBadge.title = 'Rəsmi Mağaza';
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
                storeLabel.textContent = ' Mağaza';
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
            const storeLoc = (store.city || ad.city || '').trim();
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
                        rLbl.textContent = '★ Reytinq';
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
                        cLbl.textContent = 'Rəy';
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
                if (storeDateVal) {
                    const d = new Date(storeDateVal);
                    if (!isNaN(d.getTime())) {
                        const monthYear = d.toLocaleDateString('az-AZ', { month: 'long', year: 'numeric' });
                        if (sellerSinceText) {
                            sellerSinceText.textContent = ` ${monthYear}`;
                        }
                        sellerSinceRow.classList.remove('hidden');
                        sellerSinceRow.style.display = '';
                    } else {
                        sellerSinceRow.classList.add('hidden');
                        sellerSinceRow.style.display = 'none';
                    }
                } else {
                    sellerSinceRow.classList.add('hidden');
                    sellerSinceRow.style.display = 'none';
                }
            }

        } else {
            // Mode B: Personal Seller
            const authorName = ad.author?.name || ad.author?.email || 'Satıcı';

            // Seller Name
            if (sellerNameEl) {
                sellerNameEl.textContent = authorName;
            }

            // Avatar
            if (avatarEl) {
                avatarEl.replaceChildren();
                if (ad.author?.avatar) {
                    const img = document.createElement('img');
                    img.src = getImageUrl(ad.author.avatar);
                    img.alt = authorName;
                    img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
                    avatarEl.appendChild(img);
                } else {
                    avatarEl.textContent = (ad.author?.name || authorName).charAt(0).toUpperCase() || 'S';
                }
            }

            // Account Tag
            if (sellerTypeTag) {
                sellerTypeTag.replaceChildren();
                const userIcon = document.createElement('i');
                userIcon.className = 'fas fa-user-circle';
                const userLabel = document.createElement('span');
                userLabel.textContent = ' Şəxsi hesab';
                sellerTypeTag.appendChild(userIcon);
                sellerTypeTag.appendChild(userLabel);
            }

            // Store Profile Link (hide)
            if (storeProfileLink) {
                storeProfileLink.classList.add('hidden');
                storeProfileLink.style.display = 'none';
            }

            // Location
            const personalLoc = [ad.city, ad.region].filter(Boolean).join(', ').trim();
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

            // Stats (Hide dummy stats for personal seller)
            if (sellerStats) {
                sellerStats.classList.add('hidden');
                sellerStats.style.display = 'none';
            }

            // Membership date
            if (sellerSinceRow) {
                if (ad.author?.createdAt) {
                    const d = new Date(ad.author.createdAt);
                    if (!isNaN(d.getTime())) {
                        const monthYear = d.toLocaleDateString('az-AZ', { month: 'long', year: 'numeric' });
                        if (sellerSinceText) {
                            sellerSinceText.textContent = ` ${monthYear}`;
                        }
                        sellerSinceRow.classList.remove('hidden');
                        sellerSinceRow.style.display = '';
                    } else {
                        sellerSinceRow.classList.add('hidden');
                        sellerSinceRow.style.display = 'none';
                    }
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
        if (adIdSpan)    adIdSpan.textContent   = ad._id;
        if (postedSpan)  postedSpan.textContent  = new Date(ad.createdAt).toLocaleDateString('az-AZ');
        if (updatedSpan) updatedSpan.textContent = new Date(ad.updatedAt || ad.createdAt).toLocaleDateString('az-AZ');

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
                        <i class="fas fa-edit"></i> Düzəliş Et
                    </button>
                    <button class="btn-message" style="color:#dc3545;border-color:#dc3545;" id="deleteAdBtn">
                        <i class="fas fa-trash-alt"></i> Elanı Sil
                    </button>`;

                document.getElementById('editAdBtn')?.addEventListener('click', () => {
                    window.location.href = `elan-yerlesdir.html?edit=${ad._id}`;
                });

                document.getElementById('deleteAdBtn')?.addEventListener('click', async () => {
                    if (!confirm('Bu elanı silmək istədiyinizə əminsiniz?')) return;
                    try {
                        const token = (typeof window !== "undefined" && window.getAuthToken)
                            ? window.getAuthToken()
                            : (sessionStorage.getItem("token") || sessionStorage.getItem("adminToken") || "");
                        const delRes = await fetch(`${API_BASE}/ads/${ad._id}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (delRes.ok) {
                            showToast('Elan silindi!');
                            setTimeout(() => window.location.href = 'cabinet.html', 1500);
                        } else {
                            const errData = await delRes.json().catch(() => ({}));
                            showToast(errData.message || 'Silinmə zamanı xəta oldu.');
                        }
                    } catch (e) {
                        showToast('Şəbəkə xətası baş verdi.');
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
                        showToast('Mesaj yazmaq üçün sistemə daxil olun!');
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
                    if (realRatingEl) realRatingEl.textContent = 'Hələ rəy yoxdur';
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
                        if (!token) { showToast('Rəy yazmaq üçün daxil olun!'); return; }
                        if (!currentRating) { showToast('Zəhmət olmasa reytinq seçin (ulduz)'); return; }

                        const textElId = type === 'main' ? 'mainReviewText' : 'sideReviewText';
                        const textEl   = document.getElementById(textElId);
                        const text     = textEl?.value.trim() || '';

                        const btnText  = submitBtn.innerHTML;
                        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Göndərilir...';

                        try {
                            const postRes = await fetch(`${API_BASE}/reviews`, {
                                method: 'POST',
                                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ targetUserId: ad.author._id, rating: currentRating, comment: text })
                            });
                            const data = await postRes.json();
                            if (postRes.ok) {
                                showToast('Rəy uğurla əlavə edildi!');
                                if (textEl) textEl.value = '';
                                fetchAndRenderReviews();
                            } else {
                                showToast(data.message || 'Xəta baş verdi');
                            }
                        } catch (e) {
                            showToast('Şəbəkə xətası baş verdi.');
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
                    imgEl.src = imgSrc || 'Photo/logo.png';
                    const itemTitle = `${item.brand || ''} ${item.modelName || ''}`.trim() || item.title || 'Elan';
                    imgEl.alt = itemTitle;
                    imgEl.loading = 'lazy';
                    imgContainer.appendChild(imgEl);

                    const badge = document.createElement('span');
                    badge.className = 'ad-badge';
                    if (item.sellerType === 'personal') {
                        badge.style.background = '#e67e22';
                        badge.textContent = 'Şəxsi';
                    } else {
                        badge.textContent = 'Mağaza';
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
                    citySpan.appendChild(document.createTextNode(` ${item.city || 'Bakı'}`));
                    locEl.appendChild(citySpan);

                    const dateSpan = document.createElement('span');
                    if (item.createdAt) {
                        const d = new Date(item.createdAt);
                        dateSpan.textContent = !isNaN(d.getTime()) ? d.toLocaleDateString('az-AZ') : '';
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
    } finally {
        // ✅ ALWAYS reveal — no matter what happened above
        revealPage();
    }

    // ── renderReviews helper ────────────────────────────────────────
    function renderReviews(reviews) {
        reviews = Array.isArray(reviews) ? reviews : [];
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
            realRatingEl.textContent = reviews.length ? `${avg} ★` : 'Hələ rəy yoxdur';
        }
        const avgSpan = document.getElementById('avgRating');
        if (avgSpan) avgSpan.textContent = avg;
        const countSpan = document.getElementById('reviewCount');
        if (countSpan) countSpan.textContent = String(reviews.length);

        const summaryEl = document.querySelector('.review-rating-summary');
        if (summaryEl) {
            summaryEl.innerHTML = `
                <div>
                    <div class="rating-big"><span id="realRating">${reviews.length ? `${avg} ★` : 'Hələ rəy yoxdur'}</span><span id="avgRating" style="display:none;">${avg}</span></div>
                    <div class="rating-stars-lg">${reviews.length ? getStarsHtml(Math.round(Number(avg))) : '☆☆☆☆☆'}</div>
                    <div class="rating-count"><span id="reviewCount">${reviews.length}</span> rəy əsasında</div>
                </div>
                <div class="rating-bars" style="flex:1">
                    ${[5,4,3,2,1].map((star, idx) => {
                        const pct = reviews.length ? Math.round((counts[idx] / reviews.length) * 100) : 0;
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

        const section = document.querySelector('.reviews-section');
        if (section) {
            section.querySelectorAll('.review-card-full').forEach(e => e.remove());
            section.querySelectorAll('.no-reviews-empty').forEach(e => e.remove());
            const writeBlock = section.querySelector('.write-review-main');

            if (!reviews.length) {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'no-reviews-empty';
                emptyDiv.style.cssText = 'padding: 24px; text-align: center; color: var(--text-secondary, #8e8e93); font-size: 14px;';
                emptyDiv.textContent = 'Hələ rəy yoxdur';
                section.insertBefore(emptyDiv, writeBlock || null);
            } else {
                reviews.slice(0, 10).forEach(r => {
                    const div = document.createElement('div');
                    div.className = 'review-card-full';
                    const char = r.author?.name ? r.author.name.charAt(0).toUpperCase() : 'U';
                    const date = r.createdAt ? new Date(r.createdAt).toLocaleDateString('az-AZ') : '';

                    const header = document.createElement('div');
                    header.className = 'rc-header';

                    const avatar = document.createElement('div');
                    avatar.className = 'rc-avatar';
                    avatar.style.background = 'linear-gradient(135deg,#5e5ce6,#a78bfa)';
                    avatar.textContent = char;

                    const info = document.createElement('div');
                    const nameDiv = document.createElement('div');
                    nameDiv.className = 'rc-name';
                    nameDiv.textContent = r.author?.name || r.author?.email || 'İstifadəçi';
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
                emptyMini.className = 'no-reviews-empty';
                emptyMini.style.cssText = 'padding: 12px; text-align: center; color: var(--text-secondary, #8e8e93); font-size: 13px;';
                emptyMini.textContent = 'Hələ rəy yoxdur';
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
                    nameDiv.textContent = r.author?.name || r.author?.email || 'İstifadəçi';

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
        if (!isStore && sellerStats && Array.isArray(reviews) && reviews.length > 0) {
            sellerStats.replaceChildren();

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
            sellerStats.appendChild(statRatingDiv);

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
            sellerStats.appendChild(statCountDiv);

            sellerStats.classList.remove('hidden');
            sellerStats.style.display = 'grid';
        }
    }

}); // end DOMContentLoaded

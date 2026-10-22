"use strict";

const params = new URLSearchParams(location.search);
const cat = params.get('category') || 'phone';
const urlCat = cat;

let page = 1;
let hasMore = true;
let isLoadingMore = false;

document.addEventListener("DOMContentLoaded", async function () {
    const container = document.getElementById("phone-ads-container") || document.querySelector(".all-ads-container");
    if (!container) return;

    const API_BASE = window.API_URL || window.API_BASE || (['localhost', '127.0.0.1', ''].includes(window.location.hostname) ? 'http://localhost:5000/api' : 'https://api.mobil.az/api');
    const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");
    const DEFAULT_AD_IMAGE = "assets/images/default-ad.svg";

    // Update title according to category
    const titleEl = document.querySelector(".all-ads-title");
    if (titleEl) {
        if (urlCat === 'tablet') {
            titleEl.textContent = 'Planşet modelləri';
        } else if (urlCat === 'headphone') {
            titleEl.textContent = 'Qulaqlıq modelləri';
        } else if (urlCat === 'accessory') {
            titleEl.textContent = 'Telefon aksessuarları';
        }
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function getImageUrl(image) {
        if (!image) return DEFAULT_AD_IMAGE;
        const value = String(image).trim().replace(/\\/g, "/");
        if (!value) return DEFAULT_AD_IMAGE;
        if (/^(https?:)?\/\//i.test(value) || /^(data:image\/|blob:)/i.test(value)) return value;
        const frontendPath = value.match(/(?:^|\/)Front[- ]end\/(.*)$/i);
        const normalized = (frontendPath ? frontendPath[1] : value).replace(/^\/+/, "");
        if (!normalized) return DEFAULT_AD_IMAGE;
        if (/^(assets|Photo)\//i.test(normalized)) return normalized;
        if (/^(uploads|images)\//i.test(normalized)) return `${API_ORIGIN}/${normalized}`;
        return `${API_ORIGIN}/${normalized}`;
    }

    function formatPrice(price) {
        return `${Number(price || 0).toLocaleString("az-AZ")} AZN`;
    }

    function formatDateLabel(value) {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return date.toLocaleString("az-AZ", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function mapCondition(condition) {
        if (condition === "new" || condition === "Yeni") return "new";
        if (condition === "used" || condition === "İşlənmiş") return "used";
        return condition || "used";
    }

    function getBadgeHtml(ad) {
        const sellerType = ad.sellerType === "store" ? "Mağaza" : "Şəxsi";
        const badgeStyle = ad.sellerType === "store" ? "" : ' style="background:var(--accent-hover);"';
        let badges = `<span class="ad-badge"${badgeStyle}>${sellerType}</span>`;
        const now = new Date();
        const isPromoActive = ad.promotionExpiresAt && new Date(ad.promotionExpiresAt) > now;
        if (isPromoActive) {
            if (ad.promotionType === "VIP") {
                badges += ` <span class="ad-badge vip"><i class="fas fa-crown"></i> VIP</span>`;
            } else if (ad.promotionType === "Premium" || ad.promotionType === "PRO") {
                badges += ` <span class="ad-badge premium"><i class="fas fa-bolt"></i> Premium</span>`;
            } else if (ad.promotionType === "Urgent" || ad.promotionType === "BumpUp") {
                badges += ` <span class="ad-badge urgent"><i class="fas fa-fire"></i> Təcili</span>`;
            }
        }
        return badges;
    }

    function createCardMarkup(ad) {
        const hasRealImage = Boolean(ad.images && ad.images.length && ad.images[0]);
        const imageUrl = getImageUrl(ad.images?.[0]);
        const city = escapeHtml(ad.city || "");
        const title = escapeHtml([ad.brand, ad.modelName].filter(Boolean).join(" "));
        const altText = hasRealImage ? title : "Elan şəkli yoxdur";
        const detailUrl = `elan-detail.html?id=${encodeURIComponent(ad._id)}`;

        return `
            <a href="${detailUrl}" style="text-decoration:none;color:inherit">
                <div class="ad-card"
                    data-id="${escapeHtml(ad._id)}"
                    data-date="${escapeHtml(ad.createdAt || "")}"
                    data-brand="${escapeHtml(ad.brand || "")}"
                    data-category="${escapeHtml(ad.category || urlCat)}"
                    data-price="${escapeHtml(ad.price || 0)}"
                    data-city="${city}"
                    data-memory="${escapeHtml(ad.specs?.memory || ad.yaddas || "")}"
                    data-condition="${escapeHtml(mapCondition(ad.condition))}"
                    data-seller="${ad.sellerType === "store" ? "store" : "private"}"
                    data-color="${escapeHtml(ad.specs?.color || "")}"
                    data-ram="${escapeHtml(ad.specs?.ram || ad.ram || "")}"
                    data-screen="${escapeHtml(ad.specs?.screenSize || "")}"
                    data-battery="${escapeHtml(ad.specs?.battery || "")}"
                    data-nfc="${ad.specs?.features?.nfc ? "yes" : "no"}"
                    data-fingerprint="${ad.specs?.features?.fingerprint ? "yes" : "no"}"
                    data-waterproof="${ad.specs?.features?.waterproof ? "yes" : "no"}"
                    data-expandable="${ad.specs?.features?.expandable ? "yes" : "no"}"
                    data-delivery="${ad.specs?.features?.delivery ? "yes" : "no"}">
                    <div class="ad-image">
                        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(altText)}" onerror="this.onerror=null;this.src='${DEFAULT_AD_IMAGE}';">
                        ${getBadgeHtml(ad)}
                        <button class="favorite-btn" aria-label="Sevimlilərə əlavə et"><i class="far fa-heart"></i></button>
                    </div>
                    <div class="ad-info">
                        <div class="ad-price">${formatPrice(ad.price)}</div>
                        <div class="ad-title">${title}</div>
                        <div class="ad-location">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${city}</span>
                            <span class="ad-date">${escapeHtml(formatDateLabel(ad.createdAt))}</span>
                        </div>
                    </div>
                </div>
            </a>
        `;
    }

    // Load More container setup
    let loadMoreContainer = document.getElementById("load-more-container");
    if (!loadMoreContainer) {
        loadMoreContainer = document.createElement("div");
        loadMoreContainer.id = "load-more-container";
        loadMoreContainer.className = "load-more-container";
        loadMoreContainer.style.cssText = "text-align: center; margin: 32px 0; display: none;";
        loadMoreContainer.innerHTML = `
            <button id="loadMoreBtn" class="load-more-btn" style="padding: 12px 32px; font-size: 15px; font-weight: 600; border-radius: 12px; background: var(--accent, #6366f1); color: #fff; border: none; cursor: pointer; transition: all 0.2s ease;">
                <i class="fas fa-spinner fa-spin" style="display:none; margin-right: 8px;"></i>
                <span>Daha çox göstər</span>
            </button>
        `;
        container.insertAdjacentElement("afterend", loadMoreContainer);
    }

    const loadMoreBtn = document.getElementById("loadMoreBtn");

    async function loadMore() {
        if (isLoadingMore || !hasMore) return;
        isLoadingMore = true;
        const spinner = loadMoreBtn?.querySelector(".fa-spinner");
        const btnText = loadMoreBtn?.querySelector("span");
        if (spinner) spinner.style.display = "inline-block";
        if (btnText) btnText.textContent = "Yüklənir...";
        if (loadMoreBtn) loadMoreBtn.disabled = true;

        page++;
        try {
            let nextAds = [];
            let totalPages = 1;
            if (window.api && typeof window.api.get === 'function') {
                const res = await window.api.get(`/ads?category=${cat}&page=${page}&limit=20`);
                nextAds = res.data && Array.isArray(res.data.ads) ? res.data.ads : (Array.isArray(res.data) ? res.data : []);
                totalPages = res.data?.totalPages || 1;
            } else {
                const res = await fetch(`${API_BASE}/ads?category=${cat}&page=${page}&limit=20`);
                const data = await res.json();
                nextAds = Array.isArray(data.ads) ? data.ads : (Array.isArray(data) ? data : []);
                totalPages = data?.totalPages || 1;
            }

            if (nextAds.length > 0) {
                const newHtml = nextAds.map(createCardMarkup).join('');
                container.insertAdjacentHTML('beforeend', newHtml);

                if (typeof window.syncFavoritesUI === 'function') {
                    window.syncFavoritesUI();
                } else if (typeof window.initFavorites === 'function') {
                    window.initFavorites();
                }
            }

            if (nextAds.length < 20 || page >= totalPages) {
                hasMore = false;
                if (loadMoreContainer) loadMoreContainer.style.display = "none";
            }
        } catch (err) {
            console.error("Daha çox elan yüklənərkən xəta:", err);
            page--;
        } finally {
            isLoadingMore = false;
            if (spinner) spinner.style.display = "none";
            if (btnText) btnText.textContent = "Daha çox göstər";
            if (loadMoreBtn) loadMoreBtn.disabled = false;
        }
    }

    window.loadMore = loadMore;
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", loadMore);
    }

    try {
        if (window.renderSkeletons) {
            window.renderSkeletons(container, 6);
        } else {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Yüklənir...</div>';
        }

        let ads = [];
        let totalPages = 1;
        if (window.api && typeof window.api.get === 'function') {
            const res = await window.api.get(`/ads?category=${cat}&page=1&limit=20`);
            ads = res.data && Array.isArray(res.data.ads) ? res.data.ads : (Array.isArray(res.data) ? res.data : []);
            totalPages = res.data?.totalPages || 1;
        } else {
            const res = await fetch(`${API_BASE}/ads?category=${cat}&page=1&limit=20`);
            const data = await res.json();
            ads = Array.isArray(data.ads) ? data.ads : (Array.isArray(data) ? data : []);
            totalPages = data?.totalPages || 1;
        }

        if (window.removeSkeletons) window.removeSkeletons(container);

        if (!ads || ads.length === 0) {
            const catLabel = urlCat === 'tablet' ? 'planşet' : (urlCat === 'headphone' ? 'qulaqlıq' : (urlCat === 'accessory' ? 'aksesuar' : 'telefon'));
            container.innerHTML = `<div class="cab-glass" style="grid-column: 1/-1; padding: 32px; text-align: center; color: var(--text-muted); border-radius: 16px;">Heç bir ${catLabel} elanı tapılmadı.</div>`;
            if (loadMoreContainer) loadMoreContainer.style.display = "none";
            return;
        }

        container.innerHTML = ads.map(createCardMarkup).join('');

        if (ads.length >= 20 && totalPages > 1) {
            hasMore = true;
            if (loadMoreContainer) loadMoreContainer.style.display = "block";
        } else {
            hasMore = false;
            if (loadMoreContainer) loadMoreContainer.style.display = "none";
        }

        // Sync favorite buttons
        if (typeof window.syncFavoritesUI === 'function') {
            window.syncFavoritesUI();
        } else if (typeof window.initFavorites === 'function') {
            window.initFavorites();
        }
    } catch (err) {
        console.error("Elanlar yüklənərkən xəta:", err);
        container.innerHTML = '<div class="cab-glass" style="grid-column: 1/-1; padding: 32px; text-align: center; color: var(--text-danger, #e74c3c); border-radius: 16px;">Elanlar yüklənərkən xəta baş verdi.</div>';
        if (loadMoreContainer) loadMoreContainer.style.display = "none";
    }
});

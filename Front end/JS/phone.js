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

    const API_BASE = window.API_URL || window.API_BASE || (['localhost', '127.0.0.1', ''].includes(window.location.hostname) ? 'http://localhost:5000/api' : (window.location.origin ? window.location.origin + '/api' : 'https://mobilim-az.onrender.com/api'));
    const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");
    const DEFAULT_AD_IMAGE = "/assets/images/default-ad.svg";

    function updateCategoryHeading() {
        const titleEl = document.querySelector(".all-ads-title");
        if (!titleEl) return;
        const lang = (window.MobilazI18n && window.MobilazI18n.getLang()) || (localStorage.getItem('lang') || 'AZ').toUpperCase();
        const isRu = lang === 'RUS' || lang === 'RU';
        const isEng = lang === 'ENG' || lang === 'EN';
        const key = String(urlCat || 'phone').toLowerCase();
        const titles = {
            tablet: { AZ: 'Planşet modelləri', RUS: 'Планшеты', ENG: 'Tablets' },
            'planşet': { AZ: 'Planşet modelləri', RUS: 'Планшеты', ENG: 'Tablets' },
            headphone: { AZ: 'Qulaqlıq modelləri', RUS: 'Наушники', ENG: 'Headphones' },
            'qulaqlıq': { AZ: 'Qulaqlıq modelləri', RUS: 'Наушники', ENG: 'Headphones' },
            accessory: { AZ: 'Telefon aksessuarları', RUS: 'Аксессуары для телефонов', ENG: 'Phone Accessories' },
            aksesuar: { AZ: 'Telefon aksessuarları', RUS: 'Аксессуары для телефонов', ENG: 'Phone Accessories' },
            phone: { AZ: 'Telefon modelləri', RUS: 'Телефоны', ENG: 'Phones' },
            telefon: { AZ: 'Telefon modelləri', RUS: 'Телефоны', ENG: 'Phones' },
            all: { AZ: 'Bütün elanlar', RUS: 'Все объявления', ENG: 'All ads' }
        };
        const entry = titles[key] || titles.phone;
        titleEl.textContent = isRu ? entry.RUS : (isEng ? entry.ENG : entry.AZ);
    }
    updateCategoryHeading();

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
        if (window.MobilazI18n && typeof window.MobilazI18n.formatDate === "function") {
            return window.MobilazI18n.formatDate(value, true);
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return date.toLocaleString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    }

    function mapCondition(condition) {
        if (condition === "new" || condition === "Yeni") return "new";
        if (condition === "used" || condition === "İşlənmiş") return "used";
        return condition || "used";
    }

    function getBadgeHtml(ad) {
        const i18n = window.MobilazI18n;
        const badgeType = ad.sellerType === "store" ? "store" : "private";
        const sellerType = i18n ? i18n.t(badgeType) : (badgeType === "store" ? "Mağaza" : "Şəxsi");
        const urgentText = i18n ? i18n.t("urgent") : "Təcili";
        const badgeStyle = ad.sellerType === "store" ? "" : ' style="background:var(--accent-hover);"';
        let badges = `<span class="ad-badge" data-badge-type="${badgeType}"${badgeStyle}>${sellerType}</span>`;
        const now = new Date();
        const isPromoActive = ad.promotionExpiresAt && new Date(ad.promotionExpiresAt) > now;
        if (isPromoActive) {
            if (ad.promotionType === "VIP") {
                badges += ` <span class="ad-badge vip"><i class="fas fa-crown"></i> VIP</span>`;
            } else if (ad.promotionType === "PRO") {
                badges += ` <span class="ad-badge pro"><i class="fas fa-bolt"></i> PRO</span>`;
            } else if (ad.promotionType === "Premium") {
                badges += ` <span class="ad-badge premium"><i class="fas fa-bolt"></i> Premium</span>`;
            } else if (ad.promotionType === "Urgent" || ad.promotionType === "BumpUp") {
                badges += ` <span class="ad-badge urgent"><i class="fas fa-fire"></i> ${urgentText}</span>`;
            }
        }
        return badges;
    }

    function createCardMarkup(ad) {
        const hasRealImage = Boolean(ad.images && ad.images.length && ad.images[0]);
        const imageUrl = getImageUrl(ad.images?.[0]);
        const i18n = window.MobilazI18n;
        const city = escapeHtml(ad.city || "");
        const displayCity = escapeHtml(i18n ? i18n.translateCity(ad.city || "") : (ad.city || ""));
        const title = escapeHtml([ad.brand, ad.modelName].filter(Boolean).join(" "));
        const altText = hasRealImage ? title : (i18n ? i18n.t("noImageAlt") : "Elan şəkli yoxdur");
        const detailUrl = `elan-detail.html?id=${encodeURIComponent(ad._id)}`;
        const nowTime = new Date();
        const isPromoActive = ad.promotionExpiresAt && new Date(ad.promotionExpiresAt) > nowTime;
        const isVip = ad.promotionType === "VIP" && isPromoActive;
        const isPro = (ad.promotionType === "PRO" || ad.promotionType === "Premium") && isPromoActive;
        const promoClass = isVip ? " is-vip" : (isPro ? " is-pro" : "");

        return `
            <a href="${detailUrl}" style="text-decoration:none;color:inherit">
                <div class="ad-card elan-card product-card${promoClass}"
                    data-id="${escapeHtml(ad._id)}"
                    data-date="${escapeHtml(ad.createdAt || "")}"
                    data-brand="${escapeHtml(ad.brand || "")}"
                    data-model="${escapeHtml(ad.modelName || "")}"
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
                            <span class="ad-city-label">${displayCity}</span>
                            <span class="ad-date">${escapeHtml(formatDateLabel(ad.createdAt))}</span>
                        </div>
                    </div>
                </div>
            </a>
        `;
    }

    function sortAds(adsArray, sortType) {
        if (!Array.isArray(adsArray)) return [];
        return adsArray.sort((a, b) => {
            if (sortType === "price_desc" || sortType === "price-high") {
                return Number(b.price || 0) - Number(a.price || 0);
            } else if (sortType === "price_asc" || sortType === "price-low") {
                return Number(a.price || 0) - Number(b.price || 0);
            } else if (sortType === "date_asc" || sortType === "oldest") {
                return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            } else {
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            }
        });
    }

    let loadMoreContainer = document.getElementById("loadMoreContainer");
    if (!loadMoreContainer && container) {
        loadMoreContainer = document.createElement("div");
        loadMoreContainer.id = "loadMoreContainer";
        loadMoreContainer.className = "load-more-container";
        loadMoreContainer.style.cssText = "text-align: center; margin: 30px auto; width: 100%; display: none;";
        loadMoreContainer.innerHTML = `
            <button id="loadMoreBtn" class="btn-load-more" style="background: var(--primary-color, #4f46e5); color: white; border: none; padding: 12px 32px; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25); transition: all 0.2s;">
                <i class="fas fa-spinner fa-spin" style="display:none; margin-right: 8px;"></i>
                <span>Daha çox göstər</span>
            </button>
        `;
        container.insertAdjacentElement("afterend", loadMoreContainer);
    }

    const loadMoreBtn = document.getElementById("loadMoreBtn");
    let activeExtraFilters = {};

    function buildQueryParams(targetPage) {
        const liveParams = new URLSearchParams(window.location.search);
        const query = new URLSearchParams();
        const activeSort = activeExtraFilters.sort || activeExtraFilters.sortBy || liveParams.get('sort') || liveParams.get('sortBy') || 'newest';
        const effectiveCat = activeExtraFilters.category || liveParams.get('category') || cat || 'phone';

        query.set('page', String(targetPage));
        query.set('limit', '20');
        query.set('sort', activeSort);
        query.set('sortBy', activeSort);
        if (effectiveCat && effectiveCat !== 'all') {
            query.set('category', effectiveCat);
        }

        const filterKeys = [
            'q', 'brand', 'model', 'city', 'condition',
            'minPrice', 'maxPrice', 'storage', 'memory', 'ram',
            'color', 'screen', 'battery', 'nfc', 'waterproof',
            'fingerprint', 'expandable', 'delivery', 'seller',
            'sellerType', 'promotionType'
        ];
        filterKeys.forEach((key) => {
            let val = (activeExtraFilters[key] !== undefined && activeExtraFilters[key] !== '' && activeExtraFilters[key] !== null)
                ? activeExtraFilters[key]
                : liveParams.get(key);
            if (key === 'color' && (!val || val === '') && Array.isArray(activeExtraFilters.colors) && activeExtraFilters.colors.length) {
                val = activeExtraFilters.colors.join(',');
            }
            if (val === null || val === undefined || val === '') return;
            if (typeof val === 'number' && (!Number.isFinite(val) || val === 0)) return;
            const strVal = String(val).trim();
            if (!strVal || strVal === 'any' || strVal === 'both' || strVal === 'Infinity' || strVal === 'NaN' || strVal === 'null' || strVal === 'undefined' || strVal === '0') return;
            query.set(key, strVal);
        });
        return { query, activeSort };
    }

    async function fetchCatalogAds(isInitial = true, filterOverrides = null) {
        if (filterOverrides && typeof filterOverrides === 'object') {
            activeExtraFilters = Object.assign({}, filterOverrides);
        }
        if (isInitial) {
            page = 1;
            if (window.renderSkeletons) {
                window.renderSkeletons(container, 6);
            } else {
                container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Yüklənir...</div>';
            }
        }

        const { query, activeSort } = buildQueryParams(page);
        let ads = [];
        let totalPages = 1;

        if (window.api && typeof window.api.get === 'function') {
            const res = await window.api.get(`/ads?${query.toString()}`);
            ads = res.data && Array.isArray(res.data.ads) ? res.data.ads : (Array.isArray(res.data) ? res.data : []);
            totalPages = res.data?.totalPages || 1;
        } else {
            const res = await fetch(`${API_BASE}/ads?${query.toString()}`);
            const data = await res.json();
            ads = Array.isArray(data.ads) ? data.ads : (Array.isArray(data) ? data : []);
            totalPages = data?.totalPages || 1;
        }

        if (window.removeSkeletons) window.removeSkeletons(container);

        if (isInitial) {
            if (!ads || ads.length === 0) {
                const lang = (localStorage.getItem('lang') || 'AZ').toUpperCase();
                const emptyText = (lang === 'RUS' || lang === 'RU') ? 'Объявлений не найдено.' : ((lang === 'ENG' || lang === 'EN') ? 'No ads found.' : 'Heç bir elan tapılmadı.');
                container.innerHTML = `<div class="cab-glass" style="grid-column: 1/-1; padding: 32px; text-align: center; color: var(--text-muted); border-radius: 16px;">${emptyText}</div>`;
                if (loadMoreContainer) loadMoreContainer.style.display = "none";
                hasMore = false;
                return { count: 0, ads: [] };
            }
            ads = sortAds(ads, activeSort);
            container.style.display = 'grid';
            container.innerHTML = ads.map(createCardMarkup).join('');
        } else if (ads.length > 0) {
            container.insertAdjacentHTML('beforeend', ads.map(createCardMarkup).join(''));
        }

        if (ads.length >= 20 && totalPages > page) {
            hasMore = true;
            if (loadMoreContainer) loadMoreContainer.style.display = "block";
        } else {
            hasMore = false;
            if (loadMoreContainer) loadMoreContainer.style.display = "none";
        }

        if (typeof window.syncFavoritesUI === 'function') {
            window.syncFavoritesUI();
        } else if (typeof window.initFavorites === 'function') {
            window.initFavorites();
        }
        return { count: ads.length, ads };
    }

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
            await fetchCatalogAds(false);
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
    window.searchAdsFromAPI = async function (filterArg) {
        let overrides = {};
        if (typeof filterArg === 'string') {
            overrides = { q: filterArg.trim() };
        } else if (filterArg && typeof filterArg === 'object') {
            overrides = Object.assign({}, filterArg);
        }
        return await fetchCatalogAds(true, overrides);
    };
    window.reloadAllAds = async function () {
        activeExtraFilters = {};
        return await fetchCatalogAds(true, {});
    };

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", loadMore);
    }

    try {
        await fetchCatalogAds(true);

        const activeSort = params.get('sort') || params.get('sortBy') || 'newest';
        const sortingSelect = document.getElementById("sortingOptions");
        if (sortingSelect) {
            if (activeSort === "price_desc" || activeSort === "price-high") sortingSelect.value = "price-high";
            else if (activeSort === "price_asc" || activeSort === "price-low") sortingSelect.value = "price-low";
            else if (activeSort === "date" || activeSort === "date_desc" || activeSort === "newest") sortingSelect.value = "date";

            sortingSelect.addEventListener("change", function () {
                const chosen = sortingSelect.value;
                try {
                    const url = new URL(window.location.href);
                    url.searchParams.set("sort", chosen);
                    url.searchParams.set("sortBy", chosen);
                    window.history.replaceState({}, "", url.toString());
                } catch (e) {}

                if (typeof window.sortAds === "function") {
                    window.sortAds(chosen);
                } else {
                    fetchCatalogAds(true, Object.assign({}, activeExtraFilters, { sort: chosen, sortBy: chosen }));
                }
            });
        }
    } catch (err) {
        console.error("Elanlar yüklənərkən xəta:", err);
        container.innerHTML = '<div class="cab-glass" style="grid-column: 1/-1; padding: 32px; text-align: center; color: var(--text-danger, #e74c3c); border-radius: 16px;">Elanlar yüklənərkən xəta baş verdi.</div>';
        if (loadMoreContainer) loadMoreContainer.style.display = "none";
    }

    document.addEventListener("mobilaz:languagechange", () => {
        updateCategoryHeading();
        const i18n = window.MobilazI18n;
        if (!i18n) return;
        document.querySelectorAll(".ad-card").forEach((card) => {
            const rawCity = card.dataset.city;
            const cityEl = card.querySelector(".ad-city-label");
            if (cityEl && rawCity) cityEl.textContent = i18n.translateCity(rawCity);

            const sellerBadge = card.querySelector(".ad-badge[data-badge-type]");
            if (sellerBadge) sellerBadge.textContent = i18n.t(sellerBadge.dataset.badgeType);

            const urgentBadge = card.querySelector(".ad-badge.urgent");
            if (urgentBadge) urgentBadge.innerHTML = `<i class="fas fa-fire"></i> ${i18n.t("urgent")}`;
        });
    });
});

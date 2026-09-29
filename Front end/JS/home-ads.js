"use strict";

document.addEventListener("DOMContentLoaded", function () {
    const API_BASE = window.API_URL || window.API_BASE || (['localhost', '127.0.0.1', ''].includes(window.location.hostname) ? 'http://localhost:5000/api' : 'https://api.mobil.az/api');
    const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

    const vipContainer = document.querySelector(".vip-ads-container");
    const allAdsContainer = document.querySelector(".all-ads-container");

    if (!vipContainer || !allAdsContainer) {
        return;
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
        if (!image) {
            return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800";
        }

        if (image.startsWith("http://") || image.startsWith("https://")) {
            return image;
        }

        if (image.includes("Front end/") || image.includes("Front-end/")) {
            return image.replace(/.*?\/Front[- ]end\//gi, "");
        }

        if (image.includes("Photo/")) {
            return image.substring(image.indexOf("Photo/"));
        }

        const origin = (window.API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
        const cleanPath = image.startsWith('/') ? image : '/' + image;
        return origin + cleanPath;
    }

    function formatPrice(price) {
        return `${Number(price || 0).toLocaleString("az-AZ")} AZN`;
    }

    function formatDateLabel(value) {
        if (!value) {
            return "";
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleString("az-AZ", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function mapCardCategory(category) {
        const map = {
            phone: "Telefon",
            tablet: "Planşet",
            headphone: "Qulaqlıq",
            accessory: "Aksesuar"
        };

        return map[category] || category || "Telefon";
    }

    function mapCondition(condition) {
        if (condition === "new") return "Yeni";
        if (condition === "used") return "İşlənmiş";
        return condition || "Yeni";
    }

    function getBadgeHtml(ad) {
        const sellerType = ad.sellerType === "store" ? "Mağaza" : "Şəxsi";
        const badgeStyle = ad.sellerType === "store"
            ? ""
            : ' style="background:var(--accent-hover);"';

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
        const imageUrl = getImageUrl(ad.images?.[0]);
        const city = escapeHtml(ad.city || "");
        const title = escapeHtml([ad.brand, ad.modelName].filter(Boolean).join(" "));
        const detailUrl = `elan-detail.html?id=${encodeURIComponent(ad._id)}`;

        return `
            <a href="${detailUrl}" style="text-decoration:none;color:inherit">
                <div class="ad-card"
                    data-id="${escapeHtml(ad._id)}"
                    data-date="${escapeHtml(ad.createdAt || "")}"
                    data-brand="${escapeHtml(ad.brand || "")}"
                    data-category="${mapCardCategory(ad.category)}"
                    data-price="${escapeHtml(ad.price || 0)}"
                    data-city="${city}"
                    data-memory="${escapeHtml(ad.specs?.memory || "")}"
                    data-condition="${mapCondition(ad.condition)}"
                    data-seller="${ad.sellerType === "store" ? "store" : "private"}"
                    data-color="${escapeHtml(ad.specs?.color || "")}"
                    data-ram="${escapeHtml(ad.specs?.ram || "")}"
                    data-screen="${escapeHtml(ad.specs?.screenSize || "")}"
                    data-battery="${escapeHtml(ad.specs?.battery || "")}"
                    data-nfc="${ad.specs?.features?.nfc ? "yes" : "no"}"
                    data-fingerprint="${ad.specs?.features?.fingerprint ? "yes" : "no"}"
                    data-waterproof="${ad.specs?.features?.waterproof ? "yes" : "no"}"
                    data-expandable="${ad.specs?.features?.expandable ? "yes" : "no"}"
                    data-delivery="${ad.specs?.features?.delivery ? "yes" : "no"}">
                    <div class="ad-image">
                        <img src="${escapeHtml(imageUrl)}" alt="${title}">
                        ${getBadgeHtml(ad)}
                        <button class="favorite-btn"><i class="far fa-heart"></i></button>
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

    function renderEmpty(container, message) {
        container.innerHTML = `
            <div class="cab-glass" style="padding:24px;text-align:center;color:var(--text-muted);border-radius:18px;">
                ${escapeHtml(message)}
            </div>
        `;
    }

    let currentPage = 1;
    const limit = 20;
    let currentQuery = '';
    
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadMoreContainer = document.getElementById('loadMoreContainer');

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', async () => {
            currentPage++;
            await fetchAndAppendAds(false);
        });
    }

    let isLoadingAds = false;

    async function fetchAndAppendAds(isInitial = true) {
        if (isLoadingAds) return;
        isLoadingAds = true;
        
        if (isInitial && window.renderSkeletons) {
            window.renderSkeletons(allAdsContainer, 8);
            if (vipContainer) window.renderSkeletons(vipContainer, 4);
        }
        
        try {
            const params = new URLSearchParams(window.location.search);
            const sellerId = params.get('seller');
            const searchQ = params.get('q') || params.get('search'); // Fallback if old link
            
            let apiUrl = new URL(`${API_BASE}/ads`);
            apiUrl.searchParams.set('limit', limit);
            apiUrl.searchParams.set('page', currentPage);
            apiUrl.searchParams.set('sortBy', 'newest');
            
            if (sellerId) apiUrl.searchParams.set('author', sellerId);
            if (currentQuery || searchQ) apiUrl.searchParams.set('q', currentQuery || searchQ);
            
            // Forward existing URL filters to the backend
            const filterKeys = ['category', 'brand', 'city', 'condition', 'minPrice', 'maxPrice', 'nfc', 'waterproof', 'fingerprint', 'memory', 'ram', 'color'];
            filterKeys.forEach(key => {
                const val = params.get(key);
                if (val && val !== 'any' && val !== 'both') {
                    apiUrl.searchParams.set(key, val);
                }
            });
            
            const response = await fetch(apiUrl.toString());
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Elanlar yüklənmədi");

            const ads = Array.isArray(data.ads) ? data.ads : [];
            
            // Only update VIP on initial load
            if (isInitial) {
                if (window.removeSkeletons) window.removeSkeletons(vipContainer);
                const now = new Date();
                const vipAds = ads.filter((ad) => 
                    (ad.promotionType === "VIP" || ad.promotionType === "PRO" || ad.promotionType === "Premium") &&
                    ad.promotionExpiresAt && new Date(ad.promotionExpiresAt) > now
                ).slice(0, 8);
                vipContainer.innerHTML = vipAds.length ? vipAds.map(createCardMarkup).join("") : "";
                if (!vipAds.length) renderEmpty(vipContainer, "Hazırda VIP elan yoxdur.");
                
                if (window.removeSkeletons) window.removeSkeletons(allAdsContainer);
                allAdsContainer.innerHTML = "";
            }

            const newAdsHtml = ads.map(createCardMarkup).join("");
            
            if (isInitial && ads.length === 0) {
                renderEmpty(allAdsContainer, currentQuery ? `"${currentQuery}" üçün nəticə tapılmadı.` : "Hazırda aktiv elan yoxdur.");
            } else {
                allAdsContainer.insertAdjacentHTML('beforeend', newAdsHtml);
            }

            // Show/hide load more button
            if (loadMoreContainer) {
                if (!data.pagination || data.pagination.hasNextPage === false || ads.length < limit) {
                    loadMoreContainer.style.display = 'none';
                } else {
                    loadMoreContainer.style.display = 'block';
                }
            }

            if (window.initializeFavoriteButtons) window.initializeFavoriteButtons();

            if (window.restoreAndApplyFilters) {
                window.restoreAndApplyFilters();
            }
        } catch (error) {
            if (isInitial) {
                renderEmpty(vipContainer, "VIP elanlar yüklənmədi.");
                renderEmpty(allAdsContainer, "Elanlar yüklənmədi.");
            }
            console.error("Home ads load error:", error);
        } finally {
            isLoadingAds = false;
        }
    }

    async function loadAds() {
        currentPage = 1;
        currentQuery = '';
        if (loadMoreContainer) loadMoreContainer.style.display = 'none';
        
        await fetchAndAppendAds(true);
    }

    window.searchAdsFromAPI = async function (query) {
        if (!query || !query.trim()) {
            loadAds();
            return;
        }
        currentPage = 1;
        currentQuery = query.trim();
        if (loadMoreContainer) loadMoreContainer.style.display = 'none';
        
        await fetchAndAppendAds(true);
    };


    // Expose reload for reset scenario
    window.reloadAllAds = loadAds;

    // ✅ Immediately wipe hardcoded dummy cards so fake ?id=1 links are never clickable
    vipContainer.innerHTML = ``;
    allAdsContainer.innerHTML = ``;
    loadAds();
});


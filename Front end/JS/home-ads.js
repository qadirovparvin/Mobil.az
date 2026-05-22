"use strict";

document.addEventListener("DOMContentLoaded", function () {
    const API_BASE = window.API_URL || "http://localhost:5000/api";
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

        return `${API_ORIGIN}${image}`;
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

        return date.toLocaleDateString("az-AZ", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function mapCardCategory(category) {
        const map = {
            Telefon: "phone",
            Planşet: "tablet",
            Qulaqlıq: "headphone",
            Aksesuar: "accessory"
        };

        return map[category] || "phone";
    }

    function mapCondition(condition) {
        return condition === "Yeni" ? "new" : "used";
    }

    function getBadgeHtml(ad) {
        const sellerType = ad.sellerType === "store" ? "Mağaza" : "Şəxsi";
        const badgeStyle = ad.sellerType === "store"
            ? ""
            : ' style="background:var(--accent-hover);"';

        return `<span class="ad-badge"${badgeStyle}>${sellerType}</span>`;
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

    async function loadAds() {
        try {
            const response = await fetch(`${API_BASE}/ads?limit=100&sortBy=newest`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Elanlar yüklənmədi");
            }

            const ads = Array.isArray(data.ads) ? data.ads : [];
            const vipAds = ads
                .filter((ad) => ad.promotionType === "VIP" || ad.promotionType === "PRO")
                .slice(0, 8);
            const regularAds = ads.slice(0, 24);

            vipContainer.innerHTML = vipAds.length
                ? vipAds.map(createCardMarkup).join("")
                : "";

            allAdsContainer.innerHTML = regularAds.length
                ? regularAds.map(createCardMarkup).join("")
                : "";

            if (!vipAds.length) {
                renderEmpty(vipContainer, "Hazırda VIP elan yoxdur.");
            }

            if (!regularAds.length) {
                renderEmpty(allAdsContainer, "Hazırda aktiv elan yoxdur.");
            }

            if (window.initializeFavoriteButtons) {
                window.initializeFavoriteButtons();
            }
        }
        catch (error) {
            renderEmpty(vipContainer, "VIP elanlar yüklənmədi.");
            renderEmpty(allAdsContainer, "Elanlar yüklənmədi.");
            console.error("Home ads load error:", error);
        }
    }

    // ✅ Immediately wipe hardcoded dummy cards so fake ?id=1 links are never clickable
    vipContainer.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-secondary);font-size:14px;"><i class="fas fa-spinner fa-spin"></i> VIP elanlar yüklənir...</div>`;
    allAdsContainer.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-secondary);font-size:14px;"><i class="fas fa-spinner fa-spin"></i> Elanlar yüklənir...</div>`;
    loadAds();
});

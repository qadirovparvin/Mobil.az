"use strict";

document.addEventListener("DOMContentLoaded", async function () {
    const API_BASE = window.API_URL || window.API_BASE || localStorage.getItem('apiUrl') || 'http://localhost:5000/api';
    const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

    // ── 1. Retrieve Store ID from URL ──────────────────────
    const urlParams = new URLSearchParams(window.location.search);
    const storeId = urlParams.get('id');

    if (!storeId) {
        alert("Mağaza ID-si tapılmadı!");
        window.location.href = "stores.html";
        return;
    }

    // ── 2. Utility Helpers ──────────────────────────────────
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
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return date.toLocaleDateString("az-AZ", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function getStarsHtml(rating) {
        const rounded = Math.round(rating || 0);
        return '★'.repeat(rounded) + '☆'.repeat(Math.max(0, 5 - rounded));
    }

    // ── 3. Fetch Store Profile and Listings Data ────────────
    try {
        const response = await fetch(`${API_BASE}/stores/${storeId}`);
        if (!response.ok) {
            throw new Error("Mağaza məlumatları yüklənə bilmədi.");
        }
        const data = await response.json();
        const store = data.store;
        const ads = data.ads || [];

        // ── 4. Render Store Identity ────────────────────────
        const storeLogoEl = document.getElementById("storeLogo");
        if (storeLogoEl) {
            storeLogoEl.src = getImageUrl(store.logoUrl);
            storeLogoEl.alt = `${store.storeName} Logo`;
        }

        const storeCoverEl = document.getElementById("storeCover");
        if (storeCoverEl) {
            storeCoverEl.src = store.coverUrl 
                ? getImageUrl(store.coverUrl) 
                : "https://images.unsplash.com/photo-1541560052-5e137f229371?q=80&w=1400";
        }

        const storeNameEl = document.getElementById("storeNameTitle");
        if (storeNameEl) {
            let nameHtml = escapeHtml(store.storeName);
            if (store.isVerified) {
                nameHtml += ` <i class="fas fa-check-circle badge-verified" title="Rəsmi Mağaza"></i>`;
            }
            if (store.packageType) {
                const pkg = store.packageType.toLowerCase();
                if (pkg === "pro") {
                    nameHtml += ` <span class="store-pkg-badge pro"><i class="fas fa-star"></i> Pro Mağaza</span>`;
                } else if (pkg === "premium") {
                    nameHtml += ` <span class="store-pkg-badge premium"><i class="fas fa-crown"></i> Premium Mağaza</span>`;
                } else {
                    nameHtml += ` <span class="store-pkg-badge starter" style="background:rgba(128,128,128,0.12);color:var(--text-secondary);"><i class="fas fa-store"></i> Standart</span>`;
                }
            }
            storeNameEl.innerHTML = nameHtml;
        }

        // Subline metadata
        const storeSubLineEl = document.getElementById("storeSubLine");
        if (storeSubLineEl) {
            const city = store.city || "Bakı";
            const address = store.address ? `, ${store.address}` : "";
            const createdYear = store.createdAt ? new Date(store.createdAt).getFullYear() : "2025";
            
            storeSubLineEl.innerHTML = `
                <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(city)}${escapeHtml(address)}</span>
                <span><i class="fas fa-clock"></i> 09:00 – 21:00</span>
                <span><i class="fas fa-calendar-alt"></i> ${createdYear}-ci ildən bəri</span>
            `;
        }

        // ── 5. Render Stats Strip ───────────────────────────
        const ratingValEl = document.getElementById("statRating");
        if (ratingValEl) {
            ratingValEl.textContent = (store.rating || 0).toFixed(1);
        }

        const activeAdsValEl = document.getElementById("statActiveAds");
        if (activeAdsValEl) {
            activeAdsValEl.textContent = ads.length;
        }

        const salesValEl = document.getElementById("statSales");
        if (salesValEl) {
            // Mock dynamic sales count based on store age & ads
            const mockSales = ads.length * 6 + 24;
            salesValEl.textContent = mockSales;
        }

        const followersValEl = document.getElementById("statFollowers");
        if (followersValEl) {
            // Mock followers count
            const mockFollowers = ads.length * 15 + 115;
            followersValEl.textContent = mockFollowers;
        }

        // ── 6. Render Active Listings (Ads) ─────────────────
        const adsHeadingEl = document.getElementById("adsSectionHeading");
        if (adsHeadingEl) {
            adsHeadingEl.innerHTML = `<i class="fas fa-th-large"></i> Aktiv Elanlar (${ads.length})`;
        }

        const adsGridEl = document.getElementById("storeAdsGrid");
        if (adsGridEl) {
            if (ads.length === 0) {
                adsGridEl.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
                        Hazırda bu mağazanın aktiv elanı yoxdur.
                    </div>
                `;
            } else {
                adsGridEl.innerHTML = ads.map(ad => {
                    const imageUrl = getImageUrl(ad.images?.[0]);
                    const adCity = escapeHtml(ad.city || store.city || "Bakı");
                    const title = escapeHtml([ad.brand, ad.modelName].filter(Boolean).join(" "));
                    const detailUrl = `elan-detail.html?id=${encodeURIComponent(ad._id)}`;
                    const conditionText = ad.condition || "Yeni";
                    const badgeStyle = conditionText === "Yeni" ? "" : ' style="background:#e67e22;"';
                    
                    return `
                        <a href="${detailUrl}" class="ad-card">
                            <div class="ad-image">
                                <img src="${escapeHtml(imageUrl)}" alt="${title}">
                                <span class="ad-badge"${badgeStyle}>${escapeHtml(conditionText)}</span>
                            </div>
                            <div class="ad-info">
                                <div class="ad-price">${formatPrice(ad.price)}</div>
                                <div class="ad-title">${title}</div>
                                <div class="ad-location">
                                    <span><i class="fas fa-map-marker-alt"></i> ${adCity}</span>
                                    <span>${escapeHtml(formatDateLabel(ad.createdAt))}</span>
                                </div>
                            </div>
                        </a>
                    `;
                }).join("");
            }
        }

        // ── 7. Render About Card Description ────────────────
        const descTextEl = document.getElementById("storeDescriptionText");
        if (descTextEl) {
            descTextEl.textContent = store.description || "Mağaza haqqında ətraflı məlumat əlavə edilməyib.";
        }

        // ── 8. Render Contact Sidebar & Navigation ──────────
        const contactPhoneRow = document.getElementById("contactPhoneRow");
        const contactPhoneLink = document.getElementById("contactPhoneLink");
        if (store.contactNumber) {
            contactPhoneLink.href = `tel:${store.contactNumber}`;
            contactPhoneLink.textContent = store.contactNumber;
            contactPhoneRow.style.display = "flex";
        }

        const contactInstagramRow = document.getElementById("contactInstagramRow");
        const contactInstagramLink = document.getElementById("contactInstagramLink");
        if (store.socialLinks?.instagram) {
            const igHandle = store.socialLinks.instagram.replace(/^@/, "");
            contactInstagramLink.href = `https://instagram.com/${igHandle}`;
            contactInstagramLink.textContent = `@${igHandle}`;
            contactInstagramRow.style.display = "flex";
        }

        const contactAddressRow = document.getElementById("contactAddressRow");
        const contactAddressText = document.getElementById("contactAddressText");
        const fullAddress = [store.city, store.address].filter(Boolean).join(", ");
        if (fullAddress) {
            contactAddressText.textContent = fullAddress;
            contactAddressRow.style.display = "flex";
        }

        // Call CTA logic
        let callRevealed = false;
        const callBtn = document.getElementById('callBtn');
        if (callBtn) {
            if (store.contactNumber) {
                callBtn.addEventListener('click', () => {
                    if (!callRevealed) {
                        callBtn.innerHTML = `<i class="fas fa-phone-alt"></i> ${store.contactNumber}`;
                        callBtn.style.background = 'linear-gradient(135deg,#28a745,#20c997)';
                        callRevealed = true;
                    } else {
                        window.location.href = `tel:${store.contactNumber}`;
                    }
                });
            } else {
                callBtn.style.display = "none";
            }
        }

        // WhatsApp link logic
        const whatsappNumber = store.socialLinks?.whatsapp || store.contactNumber || '';
        const waDigits = whatsappNumber.replace(/\D/g, '');
        const waUrl = waDigits ? `https://wa.me/${waDigits}` : '';
        
        const waProfileLink = document.getElementById('waProfileLink');
        if (waProfileLink) {
            if (waUrl) {
                waProfileLink.href = waUrl;
            } else {
                waProfileLink.style.display = "none";
            }
        }

        const sidebarWaLink = document.getElementById('sidebarWaLink');
        if (sidebarWaLink) {
            if (waUrl) {
                sidebarWaLink.href = waUrl;
            } else {
                sidebarWaLink.style.display = "none";
            }
        }

        // Map integration
        const mapAddressTextEl = document.getElementById("mapAddressText");
        if (mapAddressTextEl && fullAddress) {
            mapAddressTextEl.textContent = fullAddress;
        }

        const mapPlaceholder = document.getElementById("mapPlaceholder");
        if (mapPlaceholder) {
            const queryAddress = fullAddress || "Baku, Azerbaijan";
            mapPlaceholder.onclick = () => {
                window.open(`https://maps.google.com/?q=${encodeURIComponent(queryAddress)}`, '_blank');
            };
        }

        // ── 9. Fetch and Render Reviews ─────────────────────
        await loadReviews(storeId, store.rating);

    } catch (error) {
        console.error("Error loading store details:", error);
        alert("Mağaza profili yüklənərkən xəta baş verdi.");
    }

    async function loadReviews(storeId, defaultRating) {
        try {
            const res = await fetch(`${API_BASE}/stores/${storeId}/reviews`);
            if (!res.ok) throw new Error("Rəylər yüklənə bilmədi.");
            
            const reviews = await res.json();
            const count = reviews.length;

            // Update reviews tab count badge
            const badge = document.getElementById("reviewsCountBadge");
            if (badge) badge.textContent = count;

            // Rating stats calculation
            let avgRating = defaultRating || 0;
            const ratingDistribution = [0, 0, 0, 0, 0]; // Index 0=1★, 1=2★, 2=3★, 3=4★, 4=5★

            if (count > 0) {
                let sum = 0;
                reviews.forEach(r => {
                    sum += r.rating;
                    const index = Math.min(4, Math.max(0, Math.round(r.rating) - 1));
                    ratingDistribution[index]++;
                });
                avgRating = sum / count;
            }

            // Render reviews summary
            const bigNum = document.getElementById("reviewsBigNum");
            if (bigNum) bigNum.textContent = avgRating.toFixed(1);

            const stars = document.getElementById("reviewsStars");
            if (stars) stars.textContent = getStarsHtml(avgRating);

            const totalCount = document.getElementById("reviewsTotalCount");
            if (totalCount) totalCount.textContent = `${count} rəy əsasında`;

            // Render stats strip positive review percent
            const statPositiveReviews = document.getElementById("statPositiveReviews");
            if (statPositiveReviews && count > 0) {
                const positiveReviewsCount = ratingDistribution[3] + ratingDistribution[4]; // 4★ and 5★
                const percent = Math.round((positiveReviewsCount / count) * 100);
                statPositiveReviews.textContent = `${percent}%`;
            }

            // Render distribution bars
            const barsContainer = document.getElementById("reviewsBars");
            if (barsContainer) {
                let barsHtml = "";
                for (let i = 4; i >= 0; i--) {
                    const starsLabel = `${i + 1}★`;
                    const barCount = ratingDistribution[i];
                    const percent = count > 0 ? Math.round((barCount / count) * 100) : 0;
                    barsHtml += `
                        <div class="rbar">
                            <span class="rbar-label">${starsLabel}</span>
                            <div class="rbar-track">
                                <div class="rbar-fill" style="width:${percent}%"></div>
                            </div>
                            <span class="rbar-count">${barCount}</span>
                        </div>
                    `;
                }
                barsContainer.innerHTML = barsHtml;
            }

            // Render reviews list
            const listContainer = document.getElementById("reviewsList");
            if (listContainer) {
                if (count === 0) {
                    listContainer.innerHTML = `
                        <div style="text-align: center; padding: 30px; color: var(--text-secondary);">
                            Hazırda heç bir rəy yazılmayıb.
                        </div>
                    `;
                } else {
                    listContainer.innerHTML = reviews.map(rev => {
                        const name = rev.author ? `${rev.author.name || ''} ${rev.author.lastName || ''}`.trim() : 'Anonim';
                        const firstLetter = name.charAt(0).toUpperCase();
                        const dateStr = formatDateLabel(rev.createdAt);
                        const starsText = getStarsHtml(rev.rating);
                        
                        // Give each reviewer a nice dynamic gradient background for their avatar
                        const colors = [
                            'linear-gradient(135deg,#5e5ce6,#7d7aff)',
                            'linear-gradient(135deg,#34c759,#28a745)',
                            'linear-gradient(135deg,#ff9f0a,#e67e22)',
                            'linear-gradient(135deg,#ff2d55,#c62828)'
                        ];
                        const randomColor = colors[Math.floor((name.charCodeAt(0) || 0) % colors.length)];

                        return `
                            <div class="review-card">
                                <div class="review-header">
                                    <div class="reviewer-avatar" style="background:${randomColor}">${firstLetter}</div>
                                    <div>
                                        <div class="reviewer-name">${escapeHtml(name)}</div>
                                        <div class="reviewer-date">${escapeHtml(dateStr)}</div>
                                    </div>
                                    <div class="review-stars-sm" style="margin-left:auto">${starsText}</div>
                                </div>
                                <p class="review-text">${escapeHtml(rev.comment)}</p>
                            </div>
                        `;
                    }).join("");
                }
            }

        } catch (err) {
            console.error("Error loading reviews:", err);
            const listContainer = document.getElementById("reviewsList");
            if (listContainer) {
                listContainer.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                        Rəylər yüklənərkən xəta baş verdi.
                    </div>
                `;
            }
        }
    }
});

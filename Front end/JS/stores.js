"use strict";

document.addEventListener("DOMContentLoaded", async function () {
    const API_BASE = window.API_URL || localStorage.getItem('apiUrl') || 'http://localhost:5000/api';
    const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");
    const storesGrid = document.getElementById("storesGrid") || document.querySelector(".stores-list-view");

    if (!storesGrid) return;

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function getImageUrl(image, fallback) {
        if (!image) return fallback;
        if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("data:")) {
            return image;
        }
        return `${API_ORIGIN}${image.startsWith("/") ? "" : "/"}${image}`;
    }

    // ── Search & Filter ────────────────────────────────────
    const searchInput = document.querySelector(".search-stores input");
    const searchBtn = document.querySelector(".search-stores button[type='submit']");
    function filterCards(query) {
        const q = (query || "").toLowerCase().trim();
        const cards = storesGrid.querySelectorAll(".list-store-card");
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = !q || text.includes(q) ? "" : "none";
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", (e) => filterCards(e.target.value));
    }
    if (searchBtn) {
        searchBtn.addEventListener("click", (e) => {
            e.preventDefault();
            filterCards(searchInput ? searchInput.value : "");
        });
    }

    // ── Fetch and render stores ────────────────────────────
    try {
        const res = await fetch(`${API_BASE}/stores`);
        if (!res.ok) return;
        const data = await res.json();
        const stores = data?.stores || (Array.isArray(data) ? data : []);

        if (stores && stores.length > 0) {
            storesGrid.innerHTML = "";
            stores.forEach(store => {
                const storeId = store._id || store.id;
                const name = escapeHtml(store.storeName || store.name || "Mağaza");
                const desc = escapeHtml(store.description || "Mobil telefonlar və aksesuarların satışı.");
                const city = escapeHtml(store.city || "Bakı");
                const address = escapeHtml(store.address || "");
                const location = address ? `${city}, ${address}` : city;
                const phone = escapeHtml(store.contactNumber || "+994 50 123 45 67");
                const rawPhone = String(store.contactNumber || "").replace(/[^0-9]/g, "");
                const rating = (store.rating && !isNaN(store.rating)) ? Number(store.rating).toFixed(1) : "5.0";
                const reviews = store.reviewCount || 0;
                const cover = getImageUrl(store.coverUrl, "https://images.unsplash.com/photo-1541560052-5e137f229371?q=80&w=600");
                const logo = getImageUrl(store.logoUrl, "https://i.pinimg.com/736x/e7/85/29/e78529fcd6194bae5fd828b46a5a501b.jpg");
                const isVerified = Boolean(store.isVerified);

                const card = document.createElement("div");
                card.className = "list-store-card";
                card.innerHTML = `
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
                        <div class="store-details-grid">
                            <div class="detail-item">
                                <i class="fas fa-map-marker-alt"></i> <span>${location}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-phone-alt"></i> <span>${phone}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-shield-alt"></i> <span data-translate="stores-warranty">Rəsmi Zəmanət</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-truck"></i> <span data-translate="stores-nationwide-delivery">Çatdırılma</span>
                            </div>
                        </div>
                        <div class="store-actions">
                            <a href="store-detail.html?id=${storeId}" style="text-decoration:none"><button class="btn-view-store"><i class="fas fa-store"></i> <span data-translate="stores-view-btn">Mağazaya bax</span></button></a>
                            <a href="${rawPhone ? `https://wa.me/${rawPhone}` : '#'}" ${rawPhone ? 'target="_blank" rel="noopener noreferrer"' : ''} style="text-decoration:none"><button class="btn-contact-store"><i class="fab fa-whatsapp"></i> <span data-translate="stores-contact-btn">Whatsapp</span></button></a>
                        </div>
                    </div>
                `;
                storesGrid.appendChild(card);
            });
        }
    } catch (err) {
        console.warn("Stores fetch failed, keeping fallback:", err);
    }
});

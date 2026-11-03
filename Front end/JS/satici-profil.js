"use strict";

document.addEventListener("DOMContentLoaded", async function () {
    const API_BASE = window.API_URL || window.API_BASE || (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.origin ? `${window.location.origin}/api` : 'http://localhost:5000/api');
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    if (!userId) {
        alert("İstifadəçi tapılmadı");
        window.location.href = "index.html";
        return;
    }

    // Elements
    const userNameEl = document.getElementById('userName');
    const userLocationEl = document.getElementById('userLocation');
    const userJoinedEl = document.getElementById('userJoined');
    const chatBtn = document.getElementById('chatBtn');
    const container = document.querySelector('.magaza-ads-grid');

    // Fetch User Details
    try {
        const res = await fetch(`${API_BASE}/user/${userId}`);
        if (!res.ok) throw new Error("İstifadəçi tapılmadı");
        
        const user = await res.json();
        
        userNameEl.textContent = user.name + (user.lastName ? ` ${user.lastName}` : '');
        const joinDate = new Date(user.createdAt).toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        userJoinedEl.innerHTML = `<i class="fas fa-calendar-alt"></i> Qeydiyyat: ${joinDate}`;
        
        // Hide unused elements for private sellers
        document.getElementById('userDescription').style.display = 'none';
        document.getElementById('userPhone').style.display = 'none';
        
    } catch (err) {
        console.error(err);
        userNameEl.textContent = "İstifadəçi Tapılmadı";
    }

    // Set Chat button
    if (chatBtn) {
        chatBtn.href = `chat.html?sellerId=${userId}`;
    }

    // Fetch User Ads
    try {
        const resAds = await fetch(`${API_BASE}/ads?author=${userId}&limit=50&sortBy=newest`);
        const dataAds = await resAds.json();
        
        const ads = dataAds.ads || [];
        if (!ads.length) {
            container.replaceChildren();
            const emptyDiv = document.createElement('div');
            emptyDiv.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);';
            emptyDiv.textContent = 'Bu istifadəçinin aktiv elanı yoxdur.';
            container.appendChild(emptyDiv);
            return;
        }

        container.replaceChildren();
        ads.forEach(ad => {
            const imageUrl = ad.images?.[0] ? `${API_BASE.replace('/api', '')}/uploads/${encodeURIComponent(ad.images[0].split('/').pop())}` : "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800";
            const title = `${ad.brand || ''} ${ad.modelName || ''}`.trim() || 'Elan';

            const a = document.createElement('a');
            a.href = `elan-detail.html?id=${encodeURIComponent(ad._id)}`;
            a.style.textDecoration = 'none';
            a.style.color = 'inherit';

            const card = document.createElement('div');
            card.className = 'ad-card';
            card.setAttribute('data-seller', 'private');

            const adImage = document.createElement('div');
            adImage.className = 'ad-image';

            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = title;

            const badge = document.createElement('span');
            badge.className = 'ad-badge';
            badge.style.background = 'var(--accent-hover)';
            badge.textContent = 'Şəxsi';

            adImage.appendChild(img);
            adImage.appendChild(badge);

            const adInfo = document.createElement('div');
            adInfo.className = 'ad-info';

            const priceDiv = document.createElement('div');
            priceDiv.className = 'ad-price';
            priceDiv.textContent = `${Number(ad.price || 0).toLocaleString()} AZN`;

            const titleDiv = document.createElement('div');
            titleDiv.className = 'ad-title';
            titleDiv.textContent = title;

            const locDiv = document.createElement('div');
            locDiv.className = 'ad-location';

            const marker = document.createElement('i');
            marker.className = 'fas fa-map-marker-alt';

            const citySpan = document.createElement('span');
            citySpan.textContent = ad.city || '';

            const dateSpan = document.createElement('span');
            dateSpan.className = 'ad-date';
            dateSpan.textContent = new Date(ad.createdAt).toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

            locDiv.appendChild(marker);
            locDiv.appendChild(citySpan);
            locDiv.appendChild(dateSpan);

            adInfo.appendChild(priceDiv);
            adInfo.appendChild(titleDiv);
            adInfo.appendChild(locDiv);

            card.appendChild(adImage);
            card.appendChild(adInfo);
            a.appendChild(card);
            container.appendChild(a);
        });

    } catch (err) {
        console.error("Ads error:", err);
        container.replaceChildren();
        const errDiv = document.createElement('div');
        errDiv.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 40px;';
        errDiv.textContent = 'Elanlar yüklənmədi';
        container.appendChild(errDiv);
    }
});

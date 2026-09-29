"use strict";

document.addEventListener("DOMContentLoaded", async function () {
    const API_BASE = window.API_URL || window.API_BASE || 'http://localhost:5000/api';
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
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Bu istifadəçinin aktiv elanı yoxdur.</div>`;
            return;
        }

        container.innerHTML = ads.map(ad => {
            const imageUrl = ad.images?.[0] ? `${API_BASE.replace('/api', '')}/uploads/${ad.images[0].split('/').pop()}` : "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800";
            const title = `${ad.brand || ''} ${ad.modelName || ''}`;
            
            return `
                <a href="elan-detail.html?id=${ad._id}" style="text-decoration:none;color:inherit">
                    <div class="ad-card" data-seller="private">
                        <div class="ad-image">
                            <img src="${imageUrl}" alt="${title}">
                            <span class="ad-badge" style="background:var(--accent-hover);">Şəxsi</span>
                        </div>
                        <div class="ad-info">
                            <div class="ad-price">${Number(ad.price || 0).toLocaleString()} AZN</div>
                            <div class="ad-title">${title}</div>
                            <div class="ad-location">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${ad.city || ''}</span>
                                <span class="ad-date">${new Date(ad.createdAt).toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>
                </a>
            `;
        }).join('');

    } catch (err) {
        console.error("Ads error:", err);
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Elanlar yüklənmədi</div>`;
    }
});

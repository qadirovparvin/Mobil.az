document.addEventListener("DOMContentLoaded", () => {
    const API_URL = window.API_URL;
    let userFavorites = []; // Array of ad IDs from MongoDB
    
    function getToken() {
        return window.getAuthToken ? window.getAuthToken() : (sessionStorage.getItem('token') || '');
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

    async function fetchUserFavorites() {
        const token = getToken();
        if (!token) return [];
        
        try {
            const res = await fetch(`${API_URL}/ads/favorites`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.ads) {
                return data.ads.map(ad => ad._id);
            }
            return [];
        } catch (e) {
            console.error('Error fetching favorites:', e);
            return [];
        }
    }

    async function toggleFavoriteAPI(adId) {
        const token = getToken();
        if (!token) {
            if(window.toast) window.toast.show('Seçilmişlərə əlavə etmək üçün daxil olun', 'error');
            else alert('Seçilmişlərə əlavə etmək üçün daxil olun');
            return null;
        }

        try {
            const res = await fetch(`${API_URL}/ads/${adId}/favorite`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                return data.favorites; // Returns updated array of favorite IDs
            }
            if(window.toast) window.toast.show(data.message || 'Xəta baş verdi', 'error');
            return null;
        } catch (e) {
            console.error('Error toggling favorite:', e);
            if(window.toast) window.toast.show('Serverlə əlaqə yaradılmadı', 'error');
            return null;
        }
    }

    function initFavoriteButtons() {
        document.querySelectorAll('.ad-card').forEach(card => {
            const btn = card.querySelector('.favorite-btn');
            if (!btn) return;
            
            let id = card.getAttribute('data-id');
            if (!id) return;
            
            const icon = btn.querySelector('i');
            const isFavorited = userFavorites.includes(id);
            
            if (isFavorited) {
                icon.className = 'fas fa-heart';
                icon.style.color = '#e74c3c';
                btn.classList.add('favorited');
            } else {
                icon.className = 'far fa-heart';
                icon.style.color = '';
                btn.classList.remove('favorited');
            }
            
            // Remove existing listeners by replacing the button
            const newBtn = btn.cloneNode(true);
            btn.replaceWith(newBtn);
            
            newBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (!getToken()) {
                    if(window.toast) window.toast.show('Seçilmişlərə əlavə etmək üçün daxil olun', 'error');
                    else alert('Seçilmişlərə əlavə etmək üçün daxil olun');
                    return;
                }
                
                const currentIsFavorited = newBtn.classList.contains('favorited');
                const newFavorites = await toggleFavoriteAPI(id);
                
                if (newFavorites !== null) {
                    userFavorites = newFavorites; // Update local state
                    const updatedIcon = newBtn.querySelector('i');
                    
                    if (!currentIsFavorited) {
                        newBtn.classList.add('favorited'); 
                        updatedIcon.className = 'fas fa-heart';
                        updatedIcon.style.color = '#e74c3c';
                        if(window.toast) window.toast.show('Seçilmişlərə əlavə edildi!', 'success');
                    } else {
                        newBtn.classList.remove('favorited');
                        updatedIcon.className = 'far fa-heart';
                        updatedIcon.style.color = '';
                        if(window.toast) window.toast.show('Seçilmişlərdən çıxarıldı!', 'info');
                        
                        // If we are on the favorites page, remove the card dynamically
                        if (document.getElementById('favorites-grid')) {
                            card.closest('a') ? card.closest('a').remove() : card.remove();
                            updateFavoritesPageCount(userFavorites.length);
                            if (userFavorites.length === 0) {
                                showEmptyFavorites();
                            }
                        }
                    }
                }
            });
        });
    }

    // Detail page logic
    function initDetailPageFavorite() {
        const detailFavBtn = document.getElementById('galleryFavBtn');
        if (!detailFavBtn) return;

        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (!id) return;

        let isFaved = userFavorites.includes(id);

        const icon = detailFavBtn.querySelector('i');
        if(icon) {
            icon.className = isFaved ? 'fas fa-heart' : 'far fa-heart';
            icon.style.color = isFaved ? '#e74c3c' : '';
        }
        detailFavBtn.classList.toggle('active', isFaved);

        // Remove old event listeners
        const newDetailFavBtn = detailFavBtn.cloneNode(true);
        detailFavBtn.replaceWith(newDetailFavBtn);

        newDetailFavBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (!getToken()) {
                if(window.toast) window.toast.show('Seçilmişlərə əlavə etmək üçün daxil olun', 'error');
                else alert('Seçilmişlərə əlavə etmək üçün daxil olun');
                return;
            }

            const newFavorites = await toggleFavoriteAPI(id);
            if (newFavorites !== null) {
                userFavorites = newFavorites;
                isFaved = !isFaved;
                
                const newIcon = newDetailFavBtn.querySelector('i');
                if(newIcon) {
                    newIcon.className = isFaved ? 'fas fa-heart' : 'far fa-heart';
                    newIcon.style.color = isFaved ? '#e74c3c' : '';
                }
                newDetailFavBtn.classList.toggle('active', isFaved);
                newDetailFavBtn.style.transform = 'scale(1.3)';
                setTimeout(() => newDetailFavBtn.style.transform = '', 200);

                if(window.toast) {
                    window.toast.show(isFaved ? 'Seçilmişlərə əlavə edildi!' : 'Seçilmişlərdən çıxarıldı!', isFaved ? 'success' : 'info');
                }
            }
        });
    }

    // Render Favorites Page
    async function renderFavoritesPage() {
        const grid = document.getElementById('favorites-grid');
        if (!grid) return; 
        
        grid.innerHTML = '<div style="text-align:center; padding: 40px; width:100%;"><i class="fas fa-spinner fa-spin" style="font-size:24px; color:var(--accent);"></i> Yüklənir...</div>';
        
        const token = getToken();
        if (!token) {
            showEmptyFavorites("Seçilmiş elanları görmək üçün sistemə daxil olun.");
            updateFavoritesPageCount(0);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/ads/favorites`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            grid.innerHTML = '';
            
            if (!res.ok || !data.ads || data.ads.length === 0) {
                showEmptyFavorites();
                updateFavoritesPageCount(0);
            } else {
                data.ads.forEach(ad => {
                    const imageUrl = getImageUrl(ad.images?.[0]);
                    const city = ad.city || "";
                    const title = [ad.brand, ad.modelName].filter(Boolean).join(" ");
                    const price = `${Number(ad.price || 0).toLocaleString("az-AZ")} AZN`;
                    const date = new Date(ad.createdAt).toLocaleString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
                    
                    const sellerType = ad.sellerType === "store" ? "Mağaza" : "Şəxsi";
                    const detailUrl = `elan-detail.html?id=${encodeURIComponent(ad._id)}`;
                    
                    const aTag = document.createElement('a');
                    aTag.href = detailUrl;
                    aTag.style.cssText = "text-decoration:none;color:inherit;position:relative;display:block;";
                    
                    const card = document.createElement('div');
                    card.className = 'ad-card';
                    card.setAttribute('data-id', ad._id);
                    card.style.position = 'relative';

                    const adImage = document.createElement('div');
                    adImage.className = 'ad-image';

                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = title;

                    const badge = document.createElement('span');
                    badge.className = 'ad-badge';
                    if (ad.sellerType !== 'store') {
                        badge.style.background = 'var(--accent-hover)';
                    }
                    badge.textContent = sellerType;

                    const favBtn = document.createElement('button');
                    favBtn.className = 'favorite-btn favorited';
                    const favIcon = document.createElement('i');
                    favIcon.className = 'fas fa-heart';
                    favIcon.style.color = '#e74c3c';
                    favBtn.appendChild(favIcon);

                    adImage.appendChild(img);
                    adImage.appendChild(badge);
                    adImage.appendChild(favBtn);

                    const adInfo = document.createElement('div');
                    adInfo.className = 'ad-info';

                    const priceDiv = document.createElement('div');
                    priceDiv.className = 'ad-price';
                    priceDiv.textContent = price;

                    const titleDiv = document.createElement('div');
                    titleDiv.className = 'ad-title';
                    titleDiv.textContent = title;

                    const locDiv = document.createElement('div');
                    locDiv.className = 'ad-location';

                    const marker = document.createElement('i');
                    marker.className = 'fas fa-map-marker-alt';

                    const citySpan = document.createElement('span');
                    citySpan.textContent = city;

                    const dateSpan = document.createElement('span');
                    dateSpan.className = 'ad-date';
                    dateSpan.textContent = date;

                    locDiv.appendChild(marker);
                    locDiv.appendChild(citySpan);
                    locDiv.appendChild(dateSpan);

                    adInfo.appendChild(priceDiv);
                    adInfo.appendChild(titleDiv);
                    adInfo.appendChild(locDiv);

                    // Selection checkbox for bulk edit
                    const cbLabel = document.createElement('label');
                    cbLabel.className = 'fav-card-checkbox';
                    cbLabel.style.cssText = 'position:absolute; top:12px; left:12px; z-index:10; background:rgba(255,255,255,0.9); padding:6px; border-radius:6px; cursor:pointer; display:flex; box-shadow: 0 2px 5px rgba(0,0,0,0.2);';
                    cbLabel.onclick = (e) => { e.stopPropagation(); e.preventDefault(); };

                    const cbInput = document.createElement('input');
                    cbInput.type = 'checkbox';
                    cbInput.className = 'card-select-cb';
                    cbInput.setAttribute('data-id', ad._id);
                    cbInput.style.cssText = 'width:20px;height:20px;cursor:pointer;';
                    cbInput.onclick = (e) => { e.stopPropagation(); };

                    cbLabel.appendChild(cbInput);

                    card.appendChild(adImage);
                    card.appendChild(adInfo);
                    card.appendChild(cbLabel);

                    aTag.appendChild(card);
                    grid.appendChild(aTag);
                });
                
                initFavoriteButtons(); 
                updateFavoritesPageCount(data.ads.length);
            }
        } catch (e) {
            console.error(e);
            showEmptyFavorites("Yükləmə xətası baş verdi.");
            updateFavoritesPageCount(0);
        }
    }
    
    function showEmptyFavorites(customMessage) {
        const grid = document.getElementById('favorites-grid');
        const msg = customMessage || "Hələ heç bir elan seçilmişlərə əlavə edilməyib.";
        grid.innerHTML = `
        <div class="empty-favorites" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <i class="far fa-heart" style="font-size: 48px; color: var(--text-muted); margin-bottom: 16px;"></i>
            <p data-translate="fav-empty-desc">${msg}</p>
            <a href="index.html" class="btn btn-primary" style="margin-top:16px; display:inline-block; padding:10px 20px; border-radius:8px; background:var(--accent); color:white; text-decoration:none;" data-translate="fav-empty-link">Elanlara baxın</a>
        </div>`;
    }
    
    function updateFavoritesPageCount(count) {
        const countEl = document.getElementById('fav-count');
        const actionsBar = document.getElementById('fav-actions');
        if (!countEl) return;
        
        if (count === 0) {
            countEl.style.display = 'none';
            if (actionsBar) actionsBar.style.display = 'none';
        } else {
            countEl.style.display = 'block';
            if (actionsBar) actionsBar.style.display = 'flex';
            let lang = localStorage.getItem('site_lang') || 'AZ';
            let suffix = " elan seçilmişlərə əlavə edilib"; 
            if(window.translations && window.translations[lang]) {
                suffix = window.translations[lang]['fav-count-text'] || suffix;
            }
            countEl.innerHTML = `<span id="fav-count-num">${count}</span> <span data-translate="fav-count-text">${suffix}</span>`;
        }
    }

    // Bulk Management Bindings
    const selectAllCb = document.getElementById('fav-select-all');
    const deleteSelectedBtn = document.getElementById('btn-delete-selected');
    const deleteAllBtn = document.getElementById('btn-delete-all');

    if (selectAllCb) {
        selectAllCb.addEventListener('change', (e) => {
            const cbs = document.querySelectorAll('.card-select-cb');
            cbs.forEach(cb => cb.checked = e.target.checked);
        });
    }
    
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', async () => {
            const checked = document.querySelectorAll('.card-select-cb:checked');
            if (checked.length === 0) return;
            
            const btnOriginalText = deleteSelectedBtn.innerHTML;
            deleteSelectedBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Silinir...';
            deleteSelectedBtn.disabled = true;

            const idsToRemove = Array.from(checked).map(cb => cb.getAttribute('data-id'));
            
            for (let id of idsToRemove) {
                // Remove one by one
                await toggleFavoriteAPI(id);
            }
            
            if(selectAllCb) selectAllCb.checked = false;
            
            // Re-fetch and render
            const favs = await fetchUserFavorites();
            userFavorites = favs;
            renderFavoritesPage();
            
            deleteSelectedBtn.innerHTML = btnOriginalText;
            deleteSelectedBtn.disabled = false;
        });
    }
    
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', async () => {
            let confirmMsg = 'Bütün seçilmiş elanları silmək istədiyinizə əminsiniz?'; 
            if (confirm(confirmMsg)) {
                const btnOriginalText = deleteAllBtn.innerHTML;
                deleteAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Silinir...';
                deleteAllBtn.disabled = true;
                
                // Get all current favorite IDs
                for (let id of userFavorites) {
                    await toggleFavoriteAPI(id);
                }
                
                if(selectAllCb) selectAllCb.checked = false;
                
                // Re-fetch and render
                userFavorites = [];
                renderFavoritesPage();
                
                deleteAllBtn.innerHTML = btnOriginalText;
                deleteAllBtn.disabled = false;
            }
        });
    }

    // Expose init function globally so dynamically loaded ads can re-bind
    window.initializeFavoriteButtons = initFavoriteButtons;

    // Initial load: fetch favorites, then init buttons and render page
    fetchUserFavorites().then(favs => {
        userFavorites = favs;
        initFavoriteButtons();
        initDetailPageFavorite();
        renderFavoritesPage();
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = 'mobilaz_favorites';
    
    function getFavorites() {
        try { 
            let data = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!Array.isArray(data)) return [];
            data = data.filter(item => item !== null && typeof item === 'object' && item.outerHTML);
            return data;
        }
        catch { return []; }
    }
    
    function saveFavorites(favs) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
    }

    function getAdId(card) {
        let id = card.getAttribute('data-id');
        if (!id) {
            const title = card.querySelector('.ad-title')?.textContent.trim() || '';
            const price = card.querySelector('.ad-price')?.textContent.trim() || '';
            id = (title + '_' + price).replace(/[^a-zA-Z0-9_]/g, ''); // safe ID string
            card.setAttribute('data-id', id);
        }
        return id;
    }

    function initFavoriteButtons() {
        const favs = getFavorites();
        const existingIds = favs.map(f => f.id);
        
        document.querySelectorAll('.ad-card').forEach(card => {
            const btn = card.querySelector('.favorite-btn');
            if (!btn) return;
            
            const id = getAdId(card);
            const icon = btn.querySelector('i');
            
            if (existingIds.includes(id)) {
                icon.className = 'fas fa-heart';
                icon.style.color = '#e74c3c';
                btn.classList.add('favorited');
            } else {
                icon.className = 'far fa-heart';
                icon.style.color = '';
                btn.classList.remove('favorited');
            }
            
            const newBtn = btn.cloneNode(true);
            btn.replaceWith(newBtn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                let currentFavs = getFavorites();
                const iconElem = newBtn.querySelector('i');
                const isFavorited = newBtn.classList.contains('favorited');
                
                if (isFavorited) {
                    currentFavs = currentFavs.filter(f => f.id !== id);
                    saveFavorites(currentFavs);
                    newBtn.classList.remove('favorited');
                    iconElem.className = 'far fa-heart';
                    iconElem.style.color = '';
                    
                    if (document.getElementById('favorites-grid')) {
                        card.remove();
                        updateFavoritesPageCount();
                    }
                } else {
                    if (!currentFavs.find(f => f.id === id)) {
                        newBtn.classList.add('favorited'); 
                        iconElem.className = 'fas fa-heart';
                        iconElem.style.color = '#e74c3c';
                        
                        // Clean outerHTML dynamically so it saves clean structure
                        const clone = card.cloneNode(true);
                        const cloneIcon = clone.querySelector('.favorite-btn i');
                        if (cloneIcon) {
                            cloneIcon.className = 'fas fa-heart';
                            cloneIcon.style.color = '#e74c3c';
                            clone.querySelector('.favorite-btn').classList.add('favorited');
                        }
                        
                        currentFavs.push({ id: id, outerHTML: clone.outerHTML });
                        saveFavorites(currentFavs);
                    }
                }
            });
        });
    }

    function renderFavoritesPage() {
        const grid = document.getElementById('favorites-grid');
        if (!grid) return; 
        
        const favs = getFavorites();
        grid.innerHTML = '';
        
        if (favs.length === 0) {
            showEmptyFavorites();
        } else {
            favs.forEach(ad => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = ad.outerHTML;
                const card = tempDiv.firstElementChild;
                
                // Inject selection checkbox
                const checkboxContainer = document.createElement('label');
                checkboxContainer.className = 'fav-card-checkbox';
                checkboxContainer.style.cssText = 'position:absolute; top:12px; left:12px; z-index:10; background:rgba(255,255,255,0.9); padding:6px; border-radius:6px; cursor:pointer; display:flex; box-shadow: 0 2px 5px rgba(0,0,0,0.2);';
                checkboxContainer.innerHTML = `<input type="checkbox" class="card-select-cb" data-id="${ad.id}" style="width:20px;height:20px;cursor:pointer;">`;
                
                // Prevent inner button propagating click
                checkboxContainer.addEventListener('click', e => e.stopPropagation());
                
                card.style.position = 'relative'; 
                card.appendChild(checkboxContainer);
                
                grid.appendChild(card);
            });
            initFavoriteButtons(); 
        }
        updateFavoritesPageCount();
        
        // Trigger translation manually if on favorite page and elements injected
        if (window.updateTranslations) {
            window.updateTranslations();
        } else {
            // Give script.js a moment to register if they race condition
            setTimeout(() => {
                const langEvent = new Event('change');
                document.querySelector('.language-selector')?.dispatchEvent(langEvent);
            }, 100);
        }
    }
    
    function showEmptyFavorites() {
        const grid = document.getElementById('favorites-grid');
        grid.innerHTML = `
        <div class="empty-favorites">
            <i class="far fa-heart"></i>
            <p data-translate="fav-empty-desc">Hələ heç bir elan seçilmişlərə əlavə edilməyib.</p>
            <a href="index.html" data-translate="fav-empty-link">Elanlara baxın</a>
        </div>`;
    }
    
    function updateFavoritesPageCount() {
        const countEl = document.getElementById('fav-count');
        const grid = document.getElementById('favorites-grid');
        const actionsBar = document.getElementById('fav-actions');
        if (!countEl || !grid) return;
        
        const currentFavs = getFavorites();
        if (currentFavs.length === 0) {
            showEmptyFavorites();
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
            countEl.innerHTML = `<span id="fav-count-num">${currentFavs.length}</span> <span data-translate="fav-count-text">${suffix}</span>`;
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
        deleteSelectedBtn.addEventListener('click', () => {
            const checked = document.querySelectorAll('.card-select-cb:checked');
            if (checked.length === 0) return;
            
            const idsToRemove = Array.from(checked).map(cb => cb.getAttribute('data-id'));
            let currentFavs = getFavorites();
            currentFavs = currentFavs.filter(f => !idsToRemove.includes(f.id));
            saveFavorites(currentFavs);
            
            if(selectAllCb) selectAllCb.checked = false;
            renderFavoritesPage(); 
        });
    }
    
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', () => {
            let lang = localStorage.getItem('site_lang') || 'AZ';
            let confirmMsg = 'Bütün seçilmiş elanları silmək istədiyinizə əminsiniz?'; 
            if (window.translations && window.translations[lang]) {
                confirmMsg = window.translations[lang]['fav-delete-confirm'] || confirmMsg;
            }
            if (confirm(confirmMsg)) {
                saveFavorites([]);
                if(selectAllCb) selectAllCb.checked = false;
                renderFavoritesPage();
            }
        });
    }

    function initDetailPageFavorite() {
        const detailFavBtn = document.getElementById('galleryFavBtn');
        if (!detailFavBtn) return;

        let titleStr = document.querySelector('.ad-main-title')?.textContent.trim() || '';
        let priceNum = document.querySelector('.ad-main-price')?.textContent.trim() || '';
        let curr = document.querySelector('.ad-currency')?.textContent.trim() || '';
        if (curr && priceNum && !priceNum.includes(curr)) {
            priceNum = priceNum.replace(curr, '').trim() + ' ' + curr;
        }
        
        let id = (titleStr + '_' + priceNum).replace(/[^a-zA-Z0-9_]/g, '');
        if(!id) return;

        let currentFavs = getFavorites();
        let isFaved = currentFavs.some(f => f.id === id);

        const icon = detailFavBtn.querySelector('i');
        if(icon) {
            icon.className = isFaved ? 'fas fa-heart' : 'far fa-heart';
            icon.style.color = isFaved ? '#e74c3c' : '';
        }
        detailFavBtn.classList.toggle('active', isFaved);

        detailFavBtn.addEventListener('click', (e) => {
            e.preventDefault();
            let favs = getFavorites();
            isFaved = !isFaved;
            
            if(icon) {
                icon.className = isFaved ? 'fas fa-heart' : 'far fa-heart';
                icon.style.color = isFaved ? '#e74c3c' : '';
            }
            detailFavBtn.classList.toggle('active', isFaved);
            detailFavBtn.style.transform = 'scale(1.3)';
            setTimeout(() => detailFavBtn.style.transform = '', 200);

            if (isFaved) {
                if (!favs.find(f => f.id === id)) {
                    let imgUrl = document.getElementById('mainImage')?.src || '';
                    let locationText = 'Bakı';
                    let dateText = 'Bugün';

                    let locItems = document.querySelectorAll('.location-item span strong');
                    if(locItems.length > 0) locationText = locItems[0].textContent.trim();
                    
                    let dateEl = document.querySelector('.ad-date-views span');
                    if(dateEl) dateText = dateEl.textContent.trim().replace('Bugün, ', '') || 'Bugün';

                    let mockCard = document.createElement('a');
                    mockCard.className = 'ad-card';
                    mockCard.href = window.location.href;
                    mockCard.setAttribute('data-id', id);
                    mockCard.innerHTML = `
                        <div class="ad-image">
                            <img src="${imgUrl}">
                            <span class="ad-badge">Seçilmiş</span>
                        </div>
                        <div class="ad-info">
                            <div class="ad-price">${priceNum}</div>
                            <div class="ad-title">${titleStr}</div>
                            <div class="ad-location">
                                <span><i class="fas fa-map-marker-alt"></i> ${locationText}</span>
                                <span>${dateText}</span>
                            </div>
                        </div>
                        <button class="favorite-btn favorited" style="position: absolute; top: 10px; right: 10px; z-index: 5; background: rgba(255,255,255,0.9); border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                            <i class="fas fa-heart" style="color: #e74c3c; font-size: 16px;"></i>
                        </button>
                    `;
                    favs.push({ id: id, outerHTML: mockCard.outerHTML });
                    saveFavorites(favs);
                }
            } else {
                favs = favs.filter(f => f.id !== id);
                saveFavorites(favs);
            }
            
            if(typeof showToast === 'function') {
                showToast(isFaved ? 'Seçilmişlərə əlavə edildi!' : 'Seçilmişlərdən çıxarıldı!');
            }
        });
    }

    initFavoriteButtons();
    initDetailPageFavorite();
    renderFavoritesPage();
});

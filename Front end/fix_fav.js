const fs = require('fs');
let content = fs.readFileSync('JS/favorites.js', 'utf8');

const detailLogic = \
    // Detail Page Favorite Logic
    function initDetailPageFavorite() {
        const detailFavBtn = document.getElementById('galleryFavBtn');
        if (!detailFavBtn) return;

        let titleStr = document.querySelector('.ad-main-title')?.textContent.trim() || '';
        let priceNum = document.querySelector('.ad-main-price')?.textContent.trim() || '';
        let curr = document.querySelector('.ad-currency')?.textContent.trim() || '';
        if (curr && priceNum && !priceNum.includes(curr)) {
            // Price might already have AZN due to HTML markup
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
                    // We must construct a mock ad-card outerHTML
                    let imgUrl = document.getElementById('mainImage')?.src || '';
                    let locationText = 'Baki';
                    let dateText = 'Bugün';

                    let locItems = document.querySelectorAll('.location-item span strong');
                    if(locItems.length > 0) locationText = locItems[0].textContent.trim();
                    
                    let dateEl = document.querySelector('.ad-date-views span');
                    if(dateEl) dateText = dateEl.textContent.trim().replace('Bugün, ', '') || 'Bugün';

                    let mockCard = document.createElement('a');
                    mockCard.className = 'ad-card';
                    mockCard.href = window.location.href;
                    mockCard.setAttribute('data-id', id);
                    mockCard.innerHTML = \\\
                        <div class="ad-image">
                            <img src="\\\">
                            <span class="ad-badge">Seçilmis</span>
                        </div>
                        <div class="ad-info">
                            <div class="ad-price">\\\</div>
                            <div class="ad-title">\\\</div>
                            <div class="ad-location">
                                <span><i class="fas fa-map-marker-alt"></i> \\\</span>
                                <span>\\\</span>
                            </div>
                        </div>
                        <button class="favorite-btn favorited" style="position: absolute; top: 10px; right: 10px; z-index: 5; background: rgba(255,255,255,0.9); border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                            <i class="fas fa-heart" style="color: #e74c3c; font-size: 16px;"></i>
                        </button>
                    \\\;
                    favs.push({ id: id, outerHTML: mockCard.outerHTML });
                    saveFavorites(favs);
                }
            } else {
                favs = favs.filter(f => f.id !== id);
                saveFavorites(favs);
            }
            
            if(typeof showToast === 'function') {
                showToast(isFaved ? 'Seçilmisl?r? ?lav? edildi!' : 'Seçilmisl?rd?n çixarildi!');
            }
        });
    }
\;

content = content.replace('initFavoriteButtons();', 'initFavoriteButtons();\\n' + detailLogic + '\\n    initDetailPageFavorite();');
fs.writeFileSync('JS/favorites.js', content);
console.log('Fixed favorites for detail page.');

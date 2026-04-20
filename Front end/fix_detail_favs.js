const fs = require('fs');

function fixHtml(fileName, linkPage) {
    let content = fs.readFileSync(fileName, 'utf8');
    
    const favLogicRegex = /\/\/\s*[--]+\s*Favorite[\s\S]*?showToast[^\n]*\n\s*\}\);/g;
    const replacement = \// -- Favorite Button ------------------------------
    const favBtn = document.getElementById('galleryFavBtn');
    
    // Determine Ad ID
    const urlParams = new URLSearchParams(window.location.search);
    let adId = parseInt(urlParams.get('id')) || 1;
    const titleEl = document.querySelector('.ad-main-title')?.textContent.trim() || '';
    const priceText = document.querySelector('.ad-main-price')?.textContent.trim() || '';
    const uniqueId = (titleEl + '_' + priceText).replace(/[^a-zA-Z0-9_]/g, '');

    // Restore state
    let favs = [];
    try { 
        favs = JSON.parse(localStorage.getItem('mobilaz_favorites')) || []; 
        if (!Array.isArray(favs)) favs = [];
    } catch(e) {}
    
    let isFaved = favs.some(f => f.id === uniqueId);
    if (isFaved) {
        favBtn.querySelector('i').className = 'fas fa-heart';
        favBtn.querySelector('i').style.color = '#e74c3c';
        favBtn.classList.add('active');
    } else {
        favBtn.querySelector('i').className = 'far fa-heart';
        favBtn.querySelector('i').style.color = '';
    }

    favBtn.addEventListener('click', () => {
      isFaved = !isFaved;
      const icon = favBtn.querySelector('i');
      
      try { favs = JSON.parse(localStorage.getItem('mobilaz_favorites')) || []; if(!Array.isArray(favs)) favs=[]; } catch(e){}
      
      if (isFaved) {
          icon.className = 'fas fa-heart';
          icon.style.color = '#e74c3c';
          favBtn.classList.add('active');
          
          // Construct Ad Card outerHTML for favorites.js
          const mainImg = document.getElementById('mainImage')?.src || '';
          const locationText = document.querySelector('.location-item strong')?.textContent || 'Baki';
          const conditionText = document.querySelectorAll('.location-item strong')[1]?.textContent || 'Yeni';
          const badgeHtml = conditionText === 'Yeni' ? '<span class="ad-badge">Yeni</span>' : '<span class="ad-badge" style="background:#e67e22">Isl?nmis</span>';
          
          const cardHtml = '<div class="ad-card" data-id="' + uniqueId + '">' +
            '<a href="?id=' + adId + '" style="text-decoration:none;color:inherit;display:block">' +
              '<div class="ad-image">' +
                '<img src="' + mainImg + '" alt="'+titleEl+'">' +
                badgeHtml +
              '</div>' +
              '<div class="ad-info">' +
                '<div class="ad-price">' + priceText + '</div>' +
                '<div class="ad-title">' + titleEl + '</div>' +
                '<div class="ad-location">' +
                  '<span><i class="fas fa-map-marker-alt"></i> ' + locationText + '</span>' +
                  '<span>Bugün</span>' +
                '</div>' +
              '</div>' +
            '</a>' +
            '<button class="favorite-btn favorited" aria-label="Seçilmisl?r? ?lav? et"><i class="fas fa-heart" style="color:#e74c3c"></i></button>' +
          '</div>';

          if (!favs.some(f => f.id === uniqueId)) {
              favs.push({ id: uniqueId, outerHTML: cardHtml });
              localStorage.setItem('mobilaz_favorites', JSON.stringify(favs));
          }
          showToast('Seçilmisl?r? ?lav? edildi!');
      } else {
          icon.className = 'far fa-heart';
          icon.style.color = '';
          favBtn.classList.remove('active');
          favs = favs.filter(f => f.id !== uniqueId);
          localStorage.setItem('mobilaz_favorites', JSON.stringify(favs));
          showToast('Seçilmisl?rd?n çixarildi!');
      }
      
      favBtn.style.transform = 'scale(1.3)';
      setTimeout(() => favBtn.style.transform = '', 200);
    });\;
    
    content = content.replace(favLogicRegex, replacement);
    fs.writeFileSync(fileName, content);
}

fixHtml('elan-detail.html', 'elan-detail.html');
fixHtml('elan-detail-magaza.html', 'elan-detail-magaza.html');
console.log('Fixed favorite inline scripts');

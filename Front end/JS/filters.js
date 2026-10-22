document.addEventListener('DOMContentLoaded', () => {
    // 1. Toggle active state on filter pills
    const filterGroups = document.querySelectorAll('.filter-btn-group');
    
    filterGroups.forEach(group => {
        const isMulti = group.classList.contains('color-multi');
        const pills = group.querySelectorAll('.filter-pill');
        
        pills.forEach(pill => {
            pill.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (isMulti) {
                    pill.classList.toggle('active');
                } else {
                    // Single select logic - toggle if active, otherwise switch
                    if (pill.classList.contains('active')) {
                        pill.classList.remove('active');
                    } else {
                        pills.forEach(p => p.classList.remove('active'));
                        pill.classList.add('active');
                    }
                }
            });
        });
    });

    // 2. Filter Application Logic
    const applyBtn = document.querySelector('.btn-apply');
    const searchBtn = document.getElementById('searchBtn') || document.querySelector('.search-btn');
    const resetBtn = document.querySelector('.btn-reset');
    const searchInput = document.getElementById('searchInput') || document.querySelector('.search-options > input[type="text"]');
    
    // Read current active filters
    function getActiveFilters() {
        const filters = {
            q: searchInput ? searchInput.value.trim() : '',
            category: (document.querySelector('.filter-btn-group[data-group="category"] .filter-pill.active')?.getAttribute('data-value')) ?? (new URLSearchParams(window.location.search).get('category') || ''),
            brand: document.getElementById('brandSelect')?.value || '',
            model: document.getElementById('modelSelect')?.value || '',
            minPrice: parseFloat(document.getElementById('priceMin')?.value) || 0,
            maxPrice: parseFloat(document.getElementById('priceMax')?.value) || Infinity,
            city: document.querySelector('select[data-filter="city"]')?.value || '',
            storage: document.querySelector('.filter-btn-group[data-group="memory"] .filter-pill.active')?.getAttribute('data-value') || '',
            memory: document.querySelector('.filter-btn-group[data-group="memory"] .filter-pill.active')?.getAttribute('data-value') || '',
            ram: document.querySelector('.filter-btn-group[data-group="ram"] .filter-pill.active')?.getAttribute('data-value') || '',
            screen: document.querySelector('.filter-btn-group[data-group="screen"] .filter-pill.active')?.getAttribute('data-value') || '',
            battery: document.querySelector('.filter-btn-group[data-group="battery"] .filter-pill.active')?.getAttribute('data-value') || '',
            fingerprint: document.querySelector('.filter-btn-group[data-group="fingerprint"] .filter-pill.active')?.getAttribute('data-value') || 'any',
            nfc: document.querySelector('.filter-btn-group[data-group="nfc"] .filter-pill.active')?.getAttribute('data-value') || 'any',
            waterproof: document.querySelector('.filter-btn-group[data-group="waterproof"] .filter-pill.active')?.getAttribute('data-value') || 'any',
            expandable: document.querySelector('.filter-btn-group[data-group="expandable"] .filter-pill.active')?.getAttribute('data-value') || 'any',
            condition: document.querySelector('.filter-btn-group[data-group="condition"] .filter-pill.active')?.getAttribute('data-value') || 'both',
            delivery: document.querySelector('.filter-btn-group[data-group="delivery"] .filter-pill.active')?.getAttribute('data-value') || 'any',
            seller: document.querySelector('.filter-btn-group[data-group="seller"] .filter-pill.active')?.getAttribute('data-value') || 'any',
            colors: Array.from(document.querySelectorAll('.filter-btn-group[data-group="color"] .filter-pill.active')).map(btn => btn.getAttribute('data-value')).filter(Boolean)
        };
        return filters;
    }

    // Apply Filter Function
    function applyFilters() {
        const filters = getActiveFilters();
        const urlParams = new URLSearchParams();

        if (filters.q) urlParams.set('q', filters.q);
        Object.keys(filters).forEach(key => {
            if (key === 'q' || key === 'colors') return;
            let val = filters[key];
            if (val && val !== 'any' && val !== 'both' && val !== '0' && val !== 'Infinity') {
                urlParams.set(key, val);
            }
        });
        if (filters.colors && filters.colors.length) {
            urlParams.set('color', filters.colors.join(','));
        }
        
        const paramStr = urlParams.toString();
        window.history.pushState({}, '', `${window.location.pathname}${paramStr ? '?' + paramStr : ''}`);

        // If there's an API search function available, fetch from API first; fallback to client-side only on failure
        if (typeof window.searchAdsFromAPI === 'function') {
            window.searchAdsFromAPI(filters).then(() => {
                // Server-side filtering succeeded, DOM already updated with server data
            }).catch((err) => {
                console.warn('Server search failed, applying client-side fallback:', err);
                applyClientFilters(filters);
            });
            return;
        }

        applyClientFilters(filters);
    }

    // Client-side filtering of rendered cards
    function applyClientFilters(filters) {
        const adCards = document.querySelectorAll('.ad-card');
        
        let visibleCount = 0;
        
        adCards.forEach(card => {
            let matches = true;
            
            // Category check
            if (matches && filters.category && filters.category !== 'any' && filters.category !== 'both') {
                const cardCat = (card.getAttribute('data-category') || '').toLowerCase().trim();
                const filterCat = filters.category.toLowerCase().trim();
                const catAliases = {
                    phone: ['phone', 'telefon'],
                    telefon: ['phone', 'telefon'],
                    tablet: ['tablet', 'planşet', 'planset'],
                    'planşet': ['tablet', 'planşet', 'planset'],
                    planset: ['tablet', 'planşet', 'planset'],
                    headphone: ['headphone', 'qulaqlıq', 'qulaqliq'],
                    'qulaqlıq': ['headphone', 'qulaqlıq', 'qulaqliq'],
                    qulaqliq: ['headphone', 'qulaqlıq', 'qulaqliq'],
                    accessory: ['accessory', 'aksesuar'],
                    aksesuar: ['accessory', 'aksesuar']
                };
                const allowed = catAliases[filterCat] || [filterCat];
                if (!allowed.includes(cardCat) && cardCat !== filterCat) matches = false;
            }
            
            // Keyword search check against full card content
            const q = (filters.q || '').toLowerCase().trim();
            if (q) {
                const searchText = card.textContent.toLowerCase();
                if (!searchText.includes(q)) {
                    card.style.display = 'none';
                    const targetItem = card.closest('a') || card;
                    targetItem.style.display = 'none';
                    return;
                }
            }
            
            // Helper function to check equality if filter is provided
            const exactCheck = (filterVal, attrVal) => {
                if (!filterVal || filterVal === 'any' || filterVal === 'both') return true;
                return filterVal.toLowerCase() === (attrVal || '').toLowerCase();
            };
            
            // Basic checks
            if (matches && !exactCheck(filters.brand, card.getAttribute('data-brand'))) matches = false;
            if (matches && !exactCheck(filters.city, card.getAttribute('data-city'))) matches = false;
            if (matches && !exactCheck(filters.memory, card.getAttribute('data-memory'))) matches = false;
            if (matches && !exactCheck(filters.ram, card.getAttribute('data-ram'))) matches = false;
            if (matches && !exactCheck(filters.screen, card.getAttribute('data-screen'))) matches = false;
            if (matches && !exactCheck(filters.battery, card.getAttribute('data-battery'))) matches = false;
            if (matches && !exactCheck(filters.fingerprint, card.getAttribute('data-fingerprint'))) matches = false;
            if (matches && !exactCheck(filters.nfc, card.getAttribute('data-nfc'))) matches = false;
            if (matches && !exactCheck(filters.waterproof, card.getAttribute('data-waterproof'))) matches = false;
            if (matches && !exactCheck(filters.expandable, card.getAttribute('data-expandable'))) matches = false;
            if (matches && !exactCheck(filters.condition, card.getAttribute('data-condition'))) matches = false;
            if (matches && !exactCheck(filters.delivery, card.getAttribute('data-delivery'))) matches = false;
            if (matches && !exactCheck(filters.seller, card.getAttribute('data-seller'))) matches = false;
            
            // Pricing Check
            if (matches) {
                const priceMatch = (card.getAttribute('data-price') || '').replace(/[^0-9]/g, '');
                if (priceMatch) {
                    const price = parseFloat(priceMatch);
                    if (price < filters.minPrice || price > filters.maxPrice) {
                        matches = false;
                    }
                }
            }
            
            // Color Array Check
            if (matches && filters.colors.length > 0) {
                const cardColor = card.getAttribute('data-color');
                if (!filters.colors.includes(cardColor)) {
                    matches = false;
                }
            }
            
            // Display toggle
            const targetItem = card.closest('a') || card;
            if (matches) {
                targetItem.style.display = ''; 
                visibleCount++;
            } else {
                targetItem.style.display = 'none';
            }
        });
        
        console.log(`Matched ads: ${visibleCount}`);
        
        // Update Filter Badge
        updateActiveBadge();
    }

    function updateActiveBadge() {
        const badge = document.getElementById('filterBadge');
        if (!badge) return;
        
        const filters = getActiveFilters();
        let count = 0;
        if (filters.category) count++;
        if (filters.brand) count++;
        if (filters.city) count++;
        if (filters.minPrice > 0 || filters.maxPrice < Infinity) count++;
        if (filters.memory) count++;
        if (filters.ram) count++;
        if (filters.screen) count++;
        if (filters.battery) count++;
        if (filters.fingerprint !== 'any') count++;
        if (filters.nfc !== 'any') count++;
        if (filters.waterproof !== 'any') count++;
        if (filters.expandable !== 'any') count++;
        if (filters.condition !== 'both') count++;
        if (filters.delivery !== 'any') count++;
        if (filters.seller !== 'any') count++;
        count += filters.colors.length;
        
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
        
        // Let's populate filter chips as well
        const chipsContainer = document.getElementById('filterChips');
        const activeFiltersWrapper = document.getElementById('activeFiltersContainer');
        if (chipsContainer && activeFiltersWrapper) {
            chipsContainer.innerHTML = '';
            // Basic representation
            if (count > 0) {
                activeFiltersWrapper.style.display = 'block';
                const chip = document.createElement('span');
                chip.className = 'active-chip';
                chip.innerHTML = `${count} filter <i class="fas fa-times clear-all-btn" style="cursor:pointer;margin-left:5px;"></i>`;
                chip.querySelector('.clear-all-btn').onclick = resetFilters;
                chipsContainer.appendChild(chip);
            } else {
                activeFiltersWrapper.style.display = 'none';
            }
        }
    }

    function resetFilters() {
        if (searchInput) searchInput.value = '';
        const brandSelect = document.getElementById('brandSelect');
        if (brandSelect) { brandSelect.value = ''; brandSelect.dispatchEvent(new Event('change')); }
        const citySelect = document.querySelector('select[data-filter="city"]');
        if (citySelect) { citySelect.value = ''; }
        if (document.getElementById('priceMin')) document.getElementById('priceMin').value = '';
        if (document.getElementById('priceMax')) document.getElementById('priceMax').value = '';
        
        document.querySelectorAll('.filter-pill').forEach(pill => pill.classList.remove('active'));
        
        // Reset defaults for "any/both" toggle buttons
        document.querySelectorAll('.filter-pill[data-value="any"], .filter-pill[data-value="both"]').forEach(p => p.classList.add('active'));
        // Re-activate the 'All categories' button (data-value="" so not caught above)
        const allCatBtn = document.querySelector('.filter-btn-group[data-group="category"] .filter-pill[data-value=""]');
        if (allCatBtn) allCatBtn.classList.add('active');
        
        // Reload all ads from API and reset client-side filters
        if (window.reloadAllAds) {
            window.reloadAllAds();
        } else {
            applyFilters();
        }
    }

    function debounce(fn, ms) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), ms);
        };
    }

    const debouncedApply = debounce(() => { applyFilters(); }, 400);

    // Attach events
    if (applyBtn) applyBtn.addEventListener('click', (e) => { e.preventDefault(); applyFilters(); });
    if (searchBtn) searchBtn.addEventListener('click', (e) => { e.preventDefault(); applyFilters(); });
    if (resetBtn) resetBtn.addEventListener('click', (e) => { e.preventDefault(); resetFilters(); });
    if (searchInput) {
        searchInput.addEventListener('input', debouncedApply);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyFilters();
            }
        });
    }

    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    const brandSelect = document.getElementById('brandSelect');
    const modelSelect = document.getElementById('modelSelect');

    if (priceMin) priceMin.addEventListener('input', debouncedApply);
    if (priceMax) priceMax.addEventListener('input', debouncedApply);
    if (brandSelect) brandSelect.addEventListener('change', debouncedApply);
    if (modelSelect) modelSelect.addEventListener('change', debouncedApply);

    // Catalog helpers
    window.loadCatalog = async function() {
        const dd = document.getElementById('catalogDropdown');
        if (!dd) return;
        try {
            const API_BASE = window.API_URL || (['localhost', '127.0.0.1', ''].includes(window.location.hostname) ? 'http://localhost:5000/api' : '/api');
            const res = await fetch(`${API_BASE}/categories`);
            const json = await res.json();
            const cats = json.data || json;
            if (Array.isArray(cats) && cats.length > 0) {
                dd.innerHTML = cats.map(cat => `<div class="cat-item" onclick="filterByCat('${cat._id || cat.name}')">${cat.name}</div>`).join('');
            }
        } catch(e) {
            console.warn('loadCatalog fallback error:', e);
        }
    };

    window.filterByCat = function(catId) {
        const map = {
            'phone': 'Telefon',
            'tablet': 'Planşet',
            'headphone': 'Qulaqlıq',
            'accessory': 'Aksesuar'
        };
        const catName = map[catId] || catId;
        window.location.href = `phone.html?category=${encodeURIComponent(catName)}`;
    };

    window.restoreAndApplyFilters = function(shouldFilterClient = false) {
        const params = new URLSearchParams(window.location.search);
        
        if (params.has('q') && searchInput) searchInput.value = params.get('q');
        if (params.has('search') && searchInput && !params.has('q')) searchInput.value = params.get('search');
        if (params.has('brand') && document.getElementById('brandSelect')) document.getElementById('brandSelect').value = params.get('brand');
        if (params.has('model') && document.getElementById('modelSelect')) document.getElementById('modelSelect').value = params.get('model');
        if (params.has('minPrice') && document.getElementById('priceMin')) document.getElementById('priceMin').value = params.get('minPrice');
        if (params.has('maxPrice') && document.getElementById('priceMax')) document.getElementById('priceMax').value = params.get('maxPrice');
        if (params.has('city') && document.querySelector('select[data-filter="city"]')) document.querySelector('select[data-filter="city"]').value = params.get('city');

        ['category', 'memory', 'ram', 'screen', 'battery', 'fingerprint', 'nfc', 'waterproof', 'expandable', 'condition', 'delivery', 'seller'].forEach(group => {
            if (params.has(group)) {
                const val = params.get(group);
                const pills = document.querySelectorAll(`.filter-btn-group[data-group="${group}"] .filter-pill`);
                pills.forEach(p => {
                    if (p.getAttribute('data-value') === val) p.classList.add('active');
                    else p.classList.remove('active');
                });
            }
        });

        if (params.has('colors') || params.has('color')) {
            const rawColors = params.get('colors') || params.get('color') || '';
            const colors = rawColors.split(',');
            const pills = document.querySelectorAll('.filter-btn-group[data-group="color"] .filter-pill');
            pills.forEach(p => {
                if (colors.includes(p.getAttribute('data-value'))) p.classList.add('active');
                else p.classList.remove('active');
            });
        }
        
        if (shouldFilterClient) {
            applyClientFilters(getActiveFilters());
        }
    };
});

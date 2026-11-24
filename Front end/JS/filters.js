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
                } else if (group.getAttribute('data-group') === 'category') {
                    pills.forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                } else {
                    // Single select logic - toggle if active, otherwise switch
                    if (pill.classList.contains('active')) {
                        pill.classList.remove('active');
                        // If group has an 'any' or 'both' default pill, re-activate it
                        const defaultPill = group.querySelector('.filter-pill[data-value="any"], .filter-pill[data-value="both"]');
                        if (defaultPill && defaultPill !== pill) {
                            defaultPill.classList.add('active');
                        }
                    } else {
                        pills.forEach(p => p.classList.remove('active'));
                        pill.classList.add('active');
                    }
                }

                // If this pill is a category button, immediately update visible sections, brands, models, and filter
                if (group.getAttribute('data-group') === 'category') {
                    const activeVal = pill.getAttribute('data-value') || '';
                    if (typeof updateVisibleFilterSections === 'function') updateVisibleFilterSections(activeVal);
                    if (typeof updateBrandOptions === 'function') updateBrandOptions(activeVal);
                    if (typeof window.filterAds === 'function') {
                        window.filterAds(activeVal || 'all');
                    }
                }

                updateActiveBadge();
                debouncedApply();
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
            minPrice: (document.getElementById('priceMin')?.value && !isNaN(parseFloat(document.getElementById('priceMin').value))) ? parseFloat(document.getElementById('priceMin').value) : null,
            maxPrice: (document.getElementById('priceMax')?.value && !isNaN(parseFloat(document.getElementById('priceMax').value))) ? parseFloat(document.getElementById('priceMax').value) : null,
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
            sort: document.getElementById('sortingOptions')?.value || (new URLSearchParams(window.location.search).get('sort') || new URLSearchParams(window.location.search).get('sortBy') || ''),
            colors: Array.from(document.querySelectorAll('.filter-btn-group[data-group="color"] .filter-pill.active')).map(btn => btn.getAttribute('data-value')).filter(Boolean)
        };
        return filters;
    }


    function escapeHtml(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c]));
    }

    function triggerSearchLoading() {
        const btn = document.getElementById('searchBtn') || document.querySelector('.search-btn');
        if (btn) {
            const orig = btn.textContent;
            const lang = (localStorage.getItem('lang') || 'AZ').toUpperCase();
            const searchingText = (window.translations?.[lang]?.['searching']) || (lang.includes('RU') ? 'Поиск...' : (lang.includes('EN') ? 'Searching...' : 'Axtarılır...'));
            btn.textContent = searchingText;
            btn.disabled = true;
            setTimeout(() => {
                btn.textContent = orig;
                btn.disabled = false;
            }, 500);
        }
    }

    function showSearchFeedback(query, count) {
        let infoEl = document.getElementById('search-results-info');
        if (!infoEl) {
            infoEl = document.createElement('div');
            infoEl.id = 'search-results-info';
            infoEl.style.cssText = 'padding:12px; background:#f3f4f6; border-radius:8px; margin:16px 0; display:none;';
            const target = document.querySelector('.catalog-section') || 
                           document.querySelector('.all-ads-section') || 
                           document.querySelector('.all-ads-container');
            if (target) {
                target.parentNode.insertBefore(infoEl, target);
            }
        }
        if (!infoEl) return;

        const cleanQ = (query || '').trim();
        if (!cleanQ) {
            infoEl.style.display = 'none';
            infoEl.innerHTML = '';
            return;
        }

        const lang = (localStorage.getItem('lang') || 'AZ').toUpperCase();
        const isRu = lang === 'RUS' || lang === 'RU';
        const isEng = lang === 'ENG' || lang === 'EN';

        const clearBtnText = isRu ? '✕ Очистить' : (isEng ? '✕ Clear' : '✕ Təmizlə');
        const clearBtnTitle = isRu ? 'Очистить поиск' : (isEng ? 'Clear search' : 'Axtarışı təmizlə');

        if (count > 0) {
            const foundText = isRu 
                ? `✓ Найдено ${count} объявлений по запросу "${escapeHtml(cleanQ)}"`
                : (isEng ? `✓ Found ${count} ads for "${escapeHtml(cleanQ)}"` : `✓ ${count} elan tapıldı "${escapeHtml(cleanQ)}" üçün`);

            infoEl.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                    <span style="font-weight:600; color:var(--text-primary, #111827);">${foundText}</span>
                    <button type="button" class="btn-clear-search" id="clearSearchFeedbackBtn" style="background:#e5e7eb; border:none; border-radius:6px; padding:4px 10px; font-size:13px; font-weight:600; color:#374151; cursor:pointer; display:inline-flex; align-items:center; gap:4px;" title="${clearBtnTitle}">
                        ${clearBtnText}
                    </button>
                </div>
            `;
            infoEl.style.display = 'block';
        } else {
            const notFoundText = isRu 
                ? 'Ничего не найдено, попробуйте другое ключевое слово' 
                : (isEng ? 'Nothing found, try another keyword' : 'Heç nə tapılmadı, başqa açar söz yoxlayın');

            infoEl.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                    <span style="font-weight:500; color:#dc2626;">${notFoundText}</span>
                    <button type="button" class="btn-clear-search" id="clearSearchFeedbackBtn" style="background:#e5e7eb; border:none; border-radius:6px; padding:4px 10px; font-size:13px; font-weight:600; color:#374151; cursor:pointer; display:inline-flex; align-items:center; gap:4px;" title="${clearBtnTitle}">
                        ${clearBtnText}
                    </button>
                </div>
            `;
            infoEl.style.display = 'block';
        }

        const clearBtn = infoEl.querySelector('#clearSearchFeedbackBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                clearSearchAndShowAll();
            });
        }

        const catalogTarget = document.querySelector('.catalog-section') || 
                              document.querySelector('.all-ads-section') || 
                              infoEl;
        if (catalogTarget) {
            catalogTarget.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function clearSearchAndShowAll() {
        if (searchInput) searchInput.value = '';
        const otherInputs = document.querySelectorAll('#searchInput, .search-options > input[type="text"]');
        otherInputs.forEach(i => { i.value = ''; });

        const infoEl = document.getElementById('search-results-info');
        if (infoEl) {
            infoEl.style.display = 'none';
            infoEl.innerHTML = '';
        }

        const url = new URL(window.location.href);
        url.searchParams.delete('q');
        url.searchParams.delete('search');
        window.history.pushState({}, '', url.toString());

        if (typeof window.reloadAllAds === 'function') {
            window.reloadAllAds();
        } else if (typeof window.searchAdsFromAPI === 'function') {
            window.searchAdsFromAPI('');
        } else {
            applyFilters();
        }
    }

    window.showSearchFeedback = showSearchFeedback;
    window.clearSearchAndShowAll = clearSearchAndShowAll;

    // Apply Filter Function
    function applyFilters() {
        const filters = getActiveFilters();
        const urlParams = new URLSearchParams();

        if (filters.q) urlParams.set('q', filters.q);
        Object.keys(filters).forEach(key => {
            if (key === 'q' || key === 'colors') return;
            let val = filters[key];
            if (val !== null && val !== undefined && val !== '' && val !== 'any' && val !== 'both' && val !== '0' && val !== 0 && val !== 'Infinity' && val !== Infinity && (!Number.isNaN(val)) && isFinite(val) !== false) {
                urlParams.set(key, val);
            }
        });
        if (filters.colors && filters.colors.length) {
            urlParams.set('color', filters.colors.join(','));
        }
        if (filters.sort) {
            urlParams.set('sort', filters.sort);
            urlParams.set('sortBy', filters.sort);
        }
        
        const paramStr = urlParams.toString();
        window.history.pushState({}, '', `${window.location.pathname}${paramStr ? '?' + paramStr : ''}`);

        // If there's an API search function available, fetch from API first; fallback to client-side only on failure
        if (typeof window.searchAdsFromAPI === 'function') {
            window.searchAdsFromAPI(filters).then((res) => {
                // Server-side filtering succeeded, DOM already updated with server data
                const count = (res && typeof res.count === 'number') ? res.count : document.querySelectorAll('.all-ads-container .elan-card, .all-ads-container .product-card, .all-ads-container .item-card, .all-ads-container .ad-card').length;
                showSearchFeedback(filters.q, count);
            }).catch((err) => {
                console.warn('Server search failed, applying client-side fallback:', err);
                applyClientFilters(filters);
            });
            return;
        }

        applyClientFilters(filters);
    }

    // Client-side filtering of rendered cards (catalog only, never VIP)
    function applyClientFilters(filters) {
        filters = filters || getActiveFilters();
        const adCards = document.querySelectorAll('#catalog .elan-card, #catalog .product-card, #catalog .item-card, #catalog .ad-card, .all-ads-container .elan-card, .all-ads-container .product-card, .all-ads-container .item-card, .all-ads-container .ad-card, #phone-ads-container .elan-card, #phone-ads-container .product-card, #phone-ads-container .item-card, #phone-ads-container .ad-card');
        
        let visibleCount = 0;
        
        adCards.forEach(card => {
            let matches = true;
            
            // Category check
            const isAllCat = !filters.category || filters.category === 'all' || filters.category === 'any' || filters.category === 'both' || filters.category.toLowerCase() === 'hamısı' || filters.category.toLowerCase() === 'hamisi';
            if (matches && !isAllCat) {
                const cardCat = (card.getAttribute('data-category') || '').toLowerCase().trim();
                const filterCat = filters.category.toLowerCase().trim();
                const catAliases = {
                    phone: ['phone', 'telefon', 'telefonlar'],
                    telefon: ['phone', 'telefon', 'telefonlar'],
                    tablet: ['tablet', 'planşet', 'planset', 'planşetlər'],
                    'planşet': ['tablet', 'planşet', 'planset', 'planşetlər'],
                    planset: ['tablet', 'planşet', 'planset', 'planşetlər'],
                    headphone: ['headphone', 'qulaqlıq', 'qulaqliq', 'qulaqcıqlar'],
                    'qulaqlıq': ['headphone', 'qulaqlıq', 'qulaqliq', 'qulaqcıqlar'],
                    qulaqliq: ['headphone', 'qulaqlıq', 'qulaqliq', 'qulaqcıqlar'],
                    accessory: ['accessory', 'aksesuar', 'aksessuar', 'saat', 'watch', 'aksesuarlar', 'telefon aksessuarları'],
                    aksesuar: ['accessory', 'aksesuar', 'aksessuar', 'saat', 'watch', 'aksesuarlar', 'telefon aksessuarları']
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

            const memoryCheck = (filterVal, attrVal) => {
                if (!filterVal || filterVal === 'any' || filterVal === 'both') return true;
                const attr = (attrVal || '').toLowerCase();
                const num = parseInt(attr.replace(/[^0-9]/g, ''), 10);
                if (filterVal === 'below-64') {
                    return !isNaN(num) && num < 64;
                }
                if (filterVal === '512+') {
                    return (!isNaN(num) && num >= 512) || attr.includes('1 tb') || attr.includes('1tb');
                }
                const filterNum = parseInt(filterVal.replace(/[^0-9]/g, ''), 10);
                if (!isNaN(filterNum) && !isNaN(num)) {
                    return num === filterNum;
                }
                return attr.includes(filterVal.toLowerCase());
            };

            const ramCheck = (filterVal, attrVal) => {
                if (!filterVal || filterVal === 'any' || filterVal === 'both') return true;
                const attr = (attrVal || '').toLowerCase();
                const num = parseInt(attr.replace(/[^0-9]/g, ''), 10);
                const filterNum = parseInt(filterVal.replace(/[^0-9]/g, ''), 10);
                if (!isNaN(filterNum) && !isNaN(num)) {
                    return num === filterNum;
                }
                return attr.includes(filterVal.toLowerCase());
            };
            
            // Basic checks
            if (matches && !exactCheck(filters.brand, card.getAttribute('data-brand'))) matches = false;
            if (matches && filters.model && filters.model !== 'other') {
                const cardModel = (card.getAttribute('data-model') || '').toLowerCase();
                const filterModel = filters.model.toLowerCase();
                const cardTitle = (card.querySelector('.product-title, .elan-title')?.textContent || '').toLowerCase();
                if (!cardModel.includes(filterModel) && !cardTitle.includes(filterModel)) {
                    matches = false;
                }
            }
            if (matches && !exactCheck(filters.city, card.getAttribute('data-city'))) matches = false;
            if (matches && !memoryCheck(filters.memory, card.getAttribute('data-memory'))) matches = false;
            if (matches && !ramCheck(filters.ram, card.getAttribute('data-ram'))) matches = false;
            if (matches && !exactCheck(filters.screen, card.getAttribute('data-screen'))) matches = false;
            if (matches && !exactCheck(filters.battery, card.getAttribute('data-battery'))) matches = false;
            if (matches && !exactCheck(filters.fingerprint, card.getAttribute('data-fingerprint'))) matches = false;
            if (matches && !exactCheck(filters.nfc, card.getAttribute('data-nfc'))) matches = false;
            if (matches && !exactCheck(filters.waterproof, card.getAttribute('data-waterproof'))) matches = false;
            if (matches && !exactCheck(filters.expandable, card.getAttribute('data-expandable'))) matches = false;
            if (matches && !exactCheck(filters.condition, card.getAttribute('data-condition'))) matches = false;
            if (matches && !exactCheck(filters.delivery, card.getAttribute('data-delivery'))) matches = false;
            if (matches && !exactCheck(filters.seller, card.getAttribute('data-seller'))) matches = false;
            
            // Pricing Check (strict numeric check to avoid '' > 0 comparison bug)
            if (matches) {
                const priceMatch = (card.getAttribute('data-price') || '').replace(/[^0-9]/g, '');
                if (priceMatch) {
                    const price = parseFloat(priceMatch);
                    if (typeof filters.minPrice === 'number' && !isNaN(filters.minPrice) && price < filters.minPrice) {
                        matches = false;
                    }
                    if (typeof filters.maxPrice === 'number' && !isNaN(filters.maxPrice) && price > filters.maxPrice) {
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

        // Ensure catalog container display is grid, not none
        const catalogContainer = document.getElementById('catalog') || 
                                 document.querySelector('.phone-grid') || 
                                 document.getElementById('phone-ads-container') || 
                                 document.querySelector('.all-ads-container');
        if (catalogContainer) catalogContainer.style.display = 'grid';

        // Ensure Kataloq button remains visible
        const catalogBtns = document.querySelectorAll('#catalogBtn, .catalog-btn, .catalog-button, .btn-katalog');
        catalogBtns.forEach(btn => {
            btn.style.display = 'inline-flex';
            btn.style.visibility = 'visible';
            btn.style.opacity = '1';
            const wrapper = btn.closest('.catalog-wrapper, .catalog-dropdown');
            if (wrapper) {
                wrapper.style.display = 'inline-block';
                wrapper.style.visibility = 'visible';
                wrapper.style.opacity = '1';
            }
        });

        console.log(`Matched ads: ${visibleCount}`);
        if (filters.sort && typeof window.sortAds === 'function') {
            window.sortAds(filters.sort);
        }
        showSearchFeedback(filters.q, visibleCount);
        
        // Update Filter Badge
        updateActiveBadge();
    }

    const FILTER_TRANSLATIONS = {
        AZ: {
            allModels: 'Bütün modellər',
            selectBrand: 'Əvvəlcə marka seçin',
            otherModel: 'Digər model',
            allBrands: 'Bütün markalar',
            otherBrand: 'Digər',
            filterWord: 'filtr'
        },
        ENG: {
            allModels: 'All models',
            selectBrand: 'Select brand first',
            otherModel: 'Other model',
            allBrands: 'All brands',
            otherBrand: 'Other',
            filterWord: 'filters'
        },
        RUS: {
            allModels: 'Все модели',
            selectBrand: 'Сначала выберите марку',
            otherModel: 'Другая модель',
            allBrands: 'Все марки',
            otherBrand: 'Другие',
            filterWord: 'фильтра'
        }
    };

    function getFilterLang() {
        let lang = (localStorage.getItem('lang') || 'AZ').trim().toUpperCase();
        if (lang === 'RU') lang = 'RUS';
        if (lang === 'EN') lang = 'ENG';
        return lang;
    }

    function getFilterI18n() {
        const lang = getFilterLang();
        return FILTER_TRANSLATIONS[lang] || FILTER_TRANSLATIONS.AZ;
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
                const t = getFilterI18n();
                const lang = getFilterLang();
                const filterWord = (lang === 'ENG' && count === 1) ? 'filter' : t.filterWord;
                chip.innerHTML = `${count} ${filterWord} <i class="fas fa-times clear-all-btn" style="cursor:pointer;margin-left:5px;"></i>`;
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
        const modelSelect = document.getElementById('modelSelect');
        if (brandSelect) { 
            brandSelect.value = ''; 
            if (typeof updateModelOptions === 'function') updateModelOptions('');
        }
        if (modelSelect) {
            modelSelect.value = '';
        }
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
        if (typeof updateVisibleFilterSections === 'function') updateVisibleFilterSections('');
        if (typeof updateBrandOptions === 'function') updateBrandOptions('');

        // Reset badge counter
        const badge = document.getElementById('filterBadge');
        if (badge) {
            badge.style.display = 'none';
            badge.textContent = '0';
        }

        // Clean URL query parameters completely
        window.history.pushState({}, '', window.location.pathname);
        
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
    if (applyBtn) applyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        applyFilters();
        if (window.innerWidth <= 768) {
            const fb = document.getElementById('filterBody') || document.querySelector('.filter-panel');
            if (fb) {
                fb.classList.remove('active');
                fb.classList.remove('open');
            }
        }
    });
    if (searchBtn) searchBtn.addEventListener('click', (e) => { e.preventDefault(); triggerSearchLoading(); applyFilters(); });
    if (resetBtn) resetBtn.addEventListener('click', (e) => { e.preventDefault(); resetFilters(); });
    if (searchInput) {
        searchInput.addEventListener('input', debouncedApply);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                triggerSearchLoading();
                applyFilters();
            }
        });
    }

    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    const brandSelect = document.getElementById('brandSelect');
    const modelSelect = document.getElementById('modelSelect');

    const CATEGORY_CATALOG = {
        Telefon: {
            brands: ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'OPPO', 'Vivo', 'Honor', 'Realme', 'Nokia', 'other'],
            models: {
                Apple: [
                    'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
                    'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
                    'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
                    'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 mini',
                    'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 mini',
                    'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
                    'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X',
                    'iPhone SE (3rd gen)', 'iPhone SE (2nd gen)',
                    'iPhone 8 Plus', 'iPhone 8', 'iPhone 7 Plus', 'iPhone 7'
                ],
                Samsung: [
                    'Galaxy S25 Ultra', 'Galaxy S25+', 'Galaxy S25',
                    'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S24 FE',
                    'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23', 'Galaxy S23 FE',
                    'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22',
                    'Galaxy S21 Ultra', 'Galaxy S21+', 'Galaxy S21',
                    'Galaxy Z Fold 6', 'Galaxy Z Fold 5', 'Galaxy Z Fold 4',
                    'Galaxy Z Flip 6', 'Galaxy Z Flip 5', 'Galaxy Z Flip 4',
                    'Galaxy A55', 'Galaxy A54', 'Galaxy A53', 'Galaxy A52',
                    'Galaxy A35', 'Galaxy A34', 'Galaxy A33',
                    'Galaxy A15', 'Galaxy A14', 'Galaxy A13',
                    'Galaxy M55', 'Galaxy M54', 'Galaxy M34',
                    'Galaxy Note 20 Ultra', 'Galaxy Note 20'
                ],
                Xiaomi: [
                    'Xiaomi 14 Ultra', 'Xiaomi 14 Pro', 'Xiaomi 14',
                    'Xiaomi 13 Ultra', 'Xiaomi 13 Pro', 'Xiaomi 13',
                    'Xiaomi 12 Pro', 'Xiaomi 12', 'Xiaomi 12 Lite',
                    'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13',
                    'Redmi Note 12 Pro+', 'Redmi Note 12 Pro', 'Redmi Note 12',
                    'Redmi 13C', 'Redmi 12', 'Redmi 10C',
                    'POCO X6 Pro', 'POCO X6', 'POCO X5 Pro', 'POCO X5',
                    'POCO M6 Pro', 'POCO M5', 'POCO F5 Pro', 'POCO F5'
                ],
                Huawei: [
                    'Pura 70 Ultra', 'Pura 70 Pro+', 'Pura 70 Pro', 'Pura 70',
                    'Mate 60 Pro+', 'Mate 60 Pro', 'Mate 60',
                    'P60 Pro', 'P60 Art', 'P60', 'P50 Pro', 'P50',
                    'Nova 12 Pro', 'Nova 12 Ultra', 'Nova 12',
                    'Nova 11 Pro', 'Nova 11 Ultra', 'Nova 11',
                    'Nova 10 Pro', 'Nova 10 SE', 'Y90', 'Y72', 'Y62'
                ],
                OPPO: [
                    'Find X8 Pro', 'Find X8', 'Find X7 Ultra', 'Find X7',
                    'Find X6 Pro', 'Find X6',
                    'Reno 12 Pro', 'Reno 12 F', 'Reno 12',
                    'Reno 11 Pro', 'Reno 11 F', 'Reno 11',
                    'Reno 10 Pro+', 'Reno 10 Pro', 'Reno 10',
                    'A3 Pro', 'A3', 'A78', 'A77', 'A55'
                ],
                Vivo: [
                    'X100 Ultra', 'X100 Pro', 'X100',
                    'X90 Pro', 'X90',
                    'V30 Pro', 'V30 Lite', 'V30',
                    'V29 Pro', 'V29 Lite', 'V29',
                    'V27 Pro', 'V27 Lite', 'V27',
                    'Y200 Pro', 'Y200', 'Y100', 'Y78', 'Y55', 'Y36'
                ],
                Honor: [
                    'Magic 6 Pro', 'Magic 6 Ultimate', 'Magic 6',
                    'Magic 5 Pro', 'Magic 5 Ultimate', 'Magic 5',
                    '90 Smart', '90', '90 Pro',
                    'X9b', 'X8b', 'X7b',
                    'Play 8T', 'Play 7T', 'Play 6T'
                ],
                Realme: [
                    'GT 6T', 'GT 6', 'GT 5 Pro', 'GT 5',
                    '12 Pro+ 5G', '12 Pro 5G', '12 5G',
                    '11 Pro+ 5G', '11 Pro 5G', '11 5G',
                    'C67', 'C55', 'C53', 'C35', 'C33',
                    'Narzo 70 Pro', 'Narzo 60 Pro', 'Narzo 50'
                ],
                Nokia: [
                    'Nokia G42', 'Nokia G22', 'Nokia G21', 'Nokia G11',
                    'Nokia C32', 'Nokia C22', 'Nokia C12', 'Nokia C12+',
                    'Nokia XR21', 'Nokia XR20', 'Nokia 5710 XpressAudio'
                ]
            },
            hiddenSections: []
        },

        Planşet: {
            brands: ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Lenovo', 'OPPO', 'other'],
            models: {
                Apple: [
                    'iPad Pro 13" (M4)', 'iPad Pro 11" (M4)',
                    'iPad Pro 13" (M2)', 'iPad Pro 11" (M2)',
                    'iPad Air 13" (M2)', 'iPad Air 11" (M2)',
                    'iPad Air (M1)', 'iPad Air (5th gen)',
                    'iPad mini 7', 'iPad mini 6',
                    'iPad (10th gen)', 'iPad (9th gen)', 'iPad (8th gen)'
                ],
                Samsung: [
                    'Galaxy Tab S9 Ultra', 'Galaxy Tab S9+', 'Galaxy Tab S9', 'Galaxy Tab S9 FE',
                    'Galaxy Tab S8 Ultra', 'Galaxy Tab S8+', 'Galaxy Tab S8',
                    'Galaxy Tab S7 FE', 'Galaxy Tab S7+', 'Galaxy Tab S7',
                    'Galaxy Tab A9+', 'Galaxy Tab A9', 'Galaxy Tab A8', 'Galaxy Tab A7 Lite'
                ],
                Xiaomi: [
                    'Xiaomi Pad 6S Pro', 'Xiaomi Pad 6 Pro', 'Xiaomi Pad 6',
                    'Xiaomi Pad 5 Pro', 'Xiaomi Pad 5',
                    'Redmi Pad SE', 'Redmi Pad Pro', 'Redmi Pad'
                ],
                Huawei: [
                    'MatePad Pro 13.2"', 'MatePad Pro 11"',
                    'MatePad 11.5" S', 'MatePad 11.5"', 'MatePad 11"',
                    'MatePad SE 11"', 'MatePad SE 10.4"',
                    'MatePad T10s', 'MatePad T10'
                ],
                Lenovo: [
                    'Tab P12 Pro', 'Tab P12', 'Tab P11 Pro Gen 2',
                    'Tab P11 Gen 2', 'Tab P11', 'Tab M10 Plus Gen 3',
                    'Tab M10 HD Gen 2', 'Tab M8 Gen 3'
                ],
                OPPO: [
                    'Pad 2', 'Pad Air 2', 'Pad Air'
                ]
            },
            hiddenSections: ['fingerprint']
        },

        Qulaqlıq: {
            brands: ['Apple', 'Samsung', 'Sony', 'JBL', 'Xiaomi', 'Huawei', 'Baseus', 'other'],
            models: {
                Apple: [
                    'AirPods Pro 2', 'AirPods 4', 'AirPods 3', 'AirPods Max (USB-C)', 'AirPods Max', 'AirPods Pro', 'AirPods 2'
                ],
                Samsung: [
                    'Galaxy Buds3 Pro', 'Galaxy Buds3', 'Galaxy Buds2 Pro', 'Galaxy Buds2',
                    'Galaxy Buds FE', 'Galaxy Buds Live'
                ],
                Sony: [
                    'WH-1000XM5', 'WH-1000XM4', 'WH-CH720N', 'WH-CH520',
                    'WF-1000XM5', 'WF-1000XM4', 'LinkBuds S', 'LinkBuds Open'
                ],
                JBL: [
                    'Tune 770NC', 'Tune 760NC', 'Tune 670NC', 'Tune 520BT',
                    'Live Pro 2', 'Live Flex', 'Vibe Beam', 'Free NC+'
                ],
                Xiaomi: [
                    'Buds 5 Pro', 'Buds 5', 'Buds 4 Pro', 'Buds 4',
                    'Redmi Buds 6 Pro', 'Redmi Buds 6', 'Redmi Buds 5 Pro'
                ],
                Huawei: [
                    'FreeBuds Pro 3', 'FreeBuds Pro 2', 'FreeBuds 6i',
                    'FreeBuds 5i', 'FreeBuds SE 2', 'FreeLace Pro 2'
                ],
                Baseus: [
                    'Bowie EZ10', 'Bowie MA10', 'Bowie WM02',
                    'Encok W04', 'Encok H04'
                ]
            },
            hiddenSections: ['memory', 'ram', 'screen', 'fingerprint', 'expandable']
        },

        Aksesuar: {
            brands: ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Anker', 'Baseus', 'JBL', 'Sony', 'other'],
            models: {
                Apple: [
                    'Apple 20W USB-C', 'Apple 30W MagSafe', 'Apple 35W Dual', 'MagSafe Charger', 'MagSafe Battery Pack', 'iPhone Case'
                ],
                Samsung: [
                    'Samsung 25W Super Fast', 'Samsung 45W Power Adapter', 'Samsung Wireless Trio', 'Samsung Power Bank 10000mAh'
                ],
                Xiaomi: [
                    'Xiaomi 67W Turbo', 'Xiaomi 120W HyperCharge', 'Xiaomi Power Bank 10000mAh', 'Xiaomi Power Bank 20000mAh'
                ],
                Huawei: [
                    'Huawei 66W SuperCharge', 'Huawei 88W SuperCharge', 'Huawei SuperCharge Wireless'
                ],
                Anker: [
                    'Anker 65W GaN', 'Anker 30W Nano', 'Anker PowerCore 10000', 'Anker PowerCore 20000', 'Anker MagGo'
                ],
                Baseus: [
                    'Baseus 65W GaN', 'Baseus 20000mAh', 'Baseus 30000mAh', 'Baseus Blade 100W'
                ],
                JBL: [
                    'JBL Go 3', 'JBL Clip 4', 'JBL Flip 6', 'JBL Charge 5'
                ],
                Sony: [
                    'Sony SRS-XB13', 'Sony SRS-XB23', 'Sony SRS-XE200'
                ]
            },
            hiddenSections: ['memory', 'ram', 'screen', 'battery', 'fingerprint', 'nfc', 'expandable']
        }
    };

    function normalizeCategoryKey(raw) {
        if (!raw) return '';
        const s = String(raw).toLowerCase().trim();
        if (['phone', 'telefon', 'telefonlar'].includes(s)) return 'Telefon';
        if (['tablet', 'planşet', 'planset', 'planşetlər', 'plansetler'].includes(s)) return 'Planşet';
        if (['headphone', 'headphones', 'qulaqlıq', 'qulaqliq', 'qulaqcıqlar', 'qulaqciqlar'].includes(s)) return 'Qulaqlıq';
        if (['accessory', 'accessories', 'aksesuar', 'aksessuar', 'aksesuarlar'].includes(s)) return 'Aksesuar';
        return '';
    }

    function getActiveCategory() {
        const pillCat = document.querySelector('.filter-btn-group[data-group="category"] .filter-pill.active')?.getAttribute('data-value');
        if (pillCat !== undefined && pillCat !== null && pillCat !== '') return pillCat;
        return new URLSearchParams(window.location.search).get('category') || '';
    }

    function getAllBrands() {
        const brandSet = new Set();
        Object.values(CATEGORY_CATALOG).forEach(cat => {
            cat.brands.forEach(b => {
                if (b !== 'other') brandSet.add(b);
            });
        });
        return [...brandSet, 'other'];
    }

    function updateVisibleFilterSections(activeCategory) {
        const norm = normalizeCategoryKey(activeCategory || getActiveCategory());
        const hiddenGroups = (norm && CATEGORY_CATALOG[norm]) ? CATEGORY_CATALOG[norm].hiddenSections : [];

        ['memory', 'ram', 'screen', 'battery', 'fingerprint', 'nfc', 'waterproof', 'expandable'].forEach(groupName => {
            const btnGroup = document.querySelector(`.filter-btn-group[data-group="${groupName}"]`);
            const sectionWrapper = btnGroup ? btnGroup.closest('.filter-group') : null;
            if (!sectionWrapper) return;

            if (hiddenGroups.includes(groupName)) {
                sectionWrapper.style.display = 'none';
                const activePills = btnGroup.querySelectorAll('.filter-pill.active');
                activePills.forEach(p => {
                    const val = p.getAttribute('data-value');
                    if (val !== 'any' && val !== 'both' && val !== '') {
                        p.classList.remove('active');
                    }
                });
                const anyPill = btnGroup.querySelector('.filter-pill[data-value="any"], .filter-pill[data-value="both"]');
                if (anyPill) anyPill.classList.add('active');
            } else {
                sectionWrapper.style.display = 'block';
            }
        });
    }

    function updateBrandOptions(activeCategory, preferredBrand = '') {
        if (!brandSelect) return;
        const norm = normalizeCategoryKey(activeCategory || getActiveCategory());
        const brands = (norm && CATEGORY_CATALOG[norm]) ? CATEGORY_CATALOG[norm].brands : getAllBrands();
        const currentVal = preferredBrand || brandSelect.value;
        const t = getFilterI18n();

        brandSelect.innerHTML = '';
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.className = 'all-brand';
        defaultOpt.setAttribute('data-translate', 'all-brand');
        defaultOpt.textContent = t.allBrands;
        brandSelect.appendChild(defaultOpt);

        let selectedStillExists = false;
        brands.forEach(b => {
            const opt = document.createElement('option');
            if (b === 'other') {
                opt.value = 'other';
                opt.setAttribute('data-translate', 'other');
                opt.textContent = t.otherBrand;
            } else {
                opt.value = b;
                opt.textContent = b;
            }
            if (currentVal && (currentVal.toLowerCase() === b.toLowerCase())) {
                opt.selected = true;
                selectedStillExists = true;
            }
            brandSelect.appendChild(opt);
        });

        if (!selectedStillExists && currentVal && currentVal !== 'other') {
            brandSelect.value = '';
        }

        const currentModel = modelSelect ? modelSelect.value : '';
        updateModelOptions(brandSelect.value, currentModel, norm);
    }

    function updateModelOptions(selectedBrand, currentSelectedModel = '', activeCategory = '') {
        if (!modelSelect) return;
        const t = getFilterI18n();
        modelSelect.innerHTML = '';
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = selectedBrand ? t.allModels : t.selectBrand;
        defaultOpt.setAttribute('data-translate', selectedBrand ? 'all-models' : 'select-brand');
        modelSelect.appendChild(defaultOpt);

        if (!selectedBrand) return;

        const norm = normalizeCategoryKey(activeCategory || getActiveCategory());
        let models = [];

        if (norm && CATEGORY_CATALOG[norm] && CATEGORY_CATALOG[norm].models[selectedBrand]) {
            models = CATEGORY_CATALOG[norm].models[selectedBrand];
        } else {
            Object.keys(CATEGORY_CATALOG).forEach(catKey => {
                const catModels = CATEGORY_CATALOG[catKey].models[selectedBrand];
                if (Array.isArray(catModels)) {
                    models = models.concat(catModels);
                }
            });
            models = [...new Set(models)];
        }

        if (models.length > 0) {
            models.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m;
                opt.textContent = m;
                if (currentSelectedModel && m.toLowerCase() === currentSelectedModel.toLowerCase()) {
                    opt.selected = true;
                }
                modelSelect.appendChild(opt);
            });
        }

        const otherOpt = document.createElement('option');
        otherOpt.value = 'other';
        otherOpt.textContent = t.otherModel;
        otherOpt.setAttribute('data-translate', 'other-model');
        if (currentSelectedModel === 'other' || currentSelectedModel.toLowerCase() === 'digər model' || currentSelectedModel.toLowerCase() === 'other model' || currentSelectedModel.toLowerCase() === 'другая модель') {
            otherOpt.selected = true;
        }
        modelSelect.appendChild(otherOpt);
    }

    if (priceMin) priceMin.addEventListener('input', debouncedApply);
    if (priceMax) priceMax.addEventListener('input', debouncedApply);
    if (brandSelect) {
        brandSelect.addEventListener('change', () => {
            const curCat = getActiveCategory();
            updateModelOptions(brandSelect.value, '', curCat);
            debouncedApply();
        });
    }
    if (modelSelect) modelSelect.addEventListener('change', debouncedApply);

    // Listen for language changes and refresh models + filter badge/chips immediately
    document.addEventListener('mobilaz:languagechange', () => {
        const curCat = getActiveCategory();
        const curBrand = brandSelect ? brandSelect.value : '';
        const curModel = modelSelect ? modelSelect.value : '';
        updateBrandOptions(curCat, curBrand);
        updateModelOptions(curBrand, curModel, curCat);
        updateVisibleFilterSections(curCat);
        updateActiveBadge();
    });

    window.addEventListener('storage', (e) => {
        if (e.key === 'lang') {
            const curCat = getActiveCategory();
            const curBrand = brandSelect ? brandSelect.value : '';
            const curModel = modelSelect ? modelSelect.value : '';
            updateBrandOptions(curCat, curBrand);
            updateModelOptions(curBrand, curModel, curCat);
            updateVisibleFilterSections(curCat);
            updateActiveBadge();
        }
    });

    // Make helpers accessible globally
    window.updateModelOptions = updateModelOptions;
    window.updateBrandOptions = updateBrandOptions;
    window.updateVisibleFilterSections = updateVisibleFilterSections;

    // Initialize based on current category
    const curCatInit = getActiveCategory();
    updateVisibleFilterSections(curCatInit);
    updateBrandOptions(curCatInit, brandSelect ? brandSelect.value : '');
    const curBrandInit = brandSelect ? brandSelect.value : '';
    const curModelInit = modelSelect ? modelSelect.value : '';
    updateModelOptions(curBrandInit, curModelInit, curCatInit);

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
                const curLang = (localStorage.getItem('lang') || 'AZ').toUpperCase();
                const isRu = curLang === 'RUS' || curLang === 'RU';
                const isEng = curLang === 'ENG' || curLang === 'EN';
                const catMeta = {
                    'accessory': { icon: 'fa-plug', key: 'phone-accessories', label: isRu ? 'Аксессуары для телефонов' : (isEng ? 'Phone Accessories' : 'Telefon aksessuarları'), slug: 'accessory' },
                    'aksesuar': { icon: 'fa-plug', key: 'phone-accessories', label: isRu ? 'Аксессуары для телефонов' : (isEng ? 'Phone Accessories' : 'Telefon aksessuarları'), slug: 'accessory' },
                    'headphone': { icon: 'fa-headphones', key: 'headphone', label: isRu ? 'Наушники' : (isEng ? 'Headphones' : 'Qulaqcıqlar'), slug: 'headphone' },
                    'qulaqlıq': { icon: 'fa-headphones', key: 'headphone', label: isRu ? 'Наушники' : (isEng ? 'Headphones' : 'Qulaqcıqlar'), slug: 'headphone' },
                    'qulaqcıq': { icon: 'fa-headphones', key: 'headphone', label: isRu ? 'Наушники' : (isEng ? 'Headphones' : 'Qulaqcıqlar'), slug: 'headphone' },
                    'tablet': { icon: 'fa-tablet-alt', key: 'tablet', label: isRu ? 'Планшеты' : (isEng ? 'Tablets' : 'Planşetlər'), slug: 'tablet' },
                    'planşet': { icon: 'fa-tablet-alt', key: 'tablet', label: isRu ? 'Планшеты' : (isEng ? 'Tablets' : 'Planşetlər'), slug: 'tablet' },
                    'phone': { icon: 'fa-mobile-alt', key: 'phone', label: isRu ? 'Телефоны' : (isEng ? 'Phones' : 'Telefonlar'), slug: 'phone' },
                    'telefon': { icon: 'fa-mobile-alt', key: 'phone', label: isRu ? 'Телефоны' : (isEng ? 'Phones' : 'Telefonlar'), slug: 'phone' }
                };

                dd.innerHTML = cats.map(cat => {
                    const rawId = String(cat._id || cat.slug || '').toLowerCase();
                    const normName = String(cat.name || '').toLowerCase();
                    const matchedKey = catMeta[rawId] ? rawId : Object.keys(catMeta).find(k => rawId.includes(k) || normName.includes(k));
                    const meta = matchedKey ? catMeta[matchedKey] : { icon: 'fa-tag', key: rawId || normName, label: cat.name, slug: cat.slug || cat.name };
                    const catSlug = meta.slug || cat.slug || meta.key;
                    return `<a href="phone.html?category=${encodeURIComponent(catSlug)}"><i class="fas ${meta.icon}"></i> <span data-translate="${meta.key}">${meta.label}</span></a>`;
                }).join('');

                if (typeof window.applyLanguage === 'function') {
                    window.applyLanguage();
                } else if (typeof window.changeLanguage === 'function') {
                    window.changeLanguage(localStorage.getItem('lang') || 'AZ');
                }
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

        const activeCat = params.get('category') || getActiveCategory();
        if (typeof updateVisibleFilterSections === 'function') updateVisibleFilterSections(activeCat);
        if (typeof updateBrandOptions === 'function') updateBrandOptions(activeCat, params.get('brand') || '');

        if (params.has('q') && searchInput) searchInput.value = params.get('q');
        if (params.has('search') && searchInput && !params.has('q')) searchInput.value = params.get('search');
        if (params.has('brand') && document.getElementById('brandSelect')) {
            const bVal = params.get('brand');
            document.getElementById('brandSelect').value = bVal;
            if (typeof updateModelOptions === 'function') updateModelOptions(bVal, params.get('model') || '', activeCat);
        } else if (params.has('model') && document.getElementById('modelSelect')) {
            document.getElementById('modelSelect').value = params.get('model');
        }
        if (params.has('minPrice') && document.getElementById('priceMin')) document.getElementById('priceMin').value = params.get('minPrice');
        if (params.has('maxPrice') && document.getElementById('priceMax') && params.get('maxPrice') !== 'Infinity') document.getElementById('priceMax').value = params.get('maxPrice');
        if (params.has('city') && document.querySelector('select[data-filter="city"]')) document.querySelector('select[data-filter="city"]').value = params.get('city');

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

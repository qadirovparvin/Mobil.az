document.addEventListener('DOMContentLoaded', () => {
    const FILTER_CATALOG = {
        Telefon: {
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
            ],
            OnePlus: [
                'OnePlus 13', 'OnePlus 12', 'OnePlus 12R', 'OnePlus 11',
                'OnePlus Nord 4', 'OnePlus Nord CE 4'
            ],
            Google: [
                'Pixel 9 Pro XL', 'Pixel 9 Pro', 'Pixel 9',
                'Pixel 8 Pro', 'Pixel 8', 'Pixel 8a',
                'Pixel 7 Pro', 'Pixel 7'
            ]
        },
        'Planşet': {
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
        'Qulaqlıq': {
            Apple: [
                'AirPods Pro 2', 'AirPods 4', 'AirPods 3', 'AirPods Max (USB-C)', 'AirPods Max'
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
        Aksesuar: {
            'Qulaqlıq': [
                'AirPods Pro 2', 'AirPods 4', 'AirPods 3', 'AirPods Max',
                'Samsung Galaxy Buds3 Pro', 'Samsung Galaxy Buds3', 'Samsung Galaxy Buds2 Pro', 'Samsung Galaxy Buds2',
                'Sony WH-1000XM5', 'Sony WH-1000XM4', 'Sony WF-1000XM5',
                'JBL Tune 770NC', 'JBL Tune 760NC', 'JBL Live Pro 2',
                'Xiaomi Buds 4 Pro', 'Xiaomi Buds 4',
                'Huawei FreeBuds 6i', 'Huawei FreeBuds Pro 3',
                'Baseus qulaqlıq'
            ],
            'Şarj cihazı': [
                'Apple 20W USB-C', 'Apple 30W MagSafe', 'Apple 35W Dual',
                'Samsung 25W Super Fast', 'Samsung 45W',
                'Xiaomi 67W Turbo', 'Xiaomi 120W HyperCharge',
                'Huawei 66W SuperCharge', 'Anker 65W GaN'
            ],
            'Kabellər': [
                'Lightning kabel', 'USB-C kabel', 'MicroUSB kabel',
                'MagSafe kabel', 'Type-C to Lightning', 'HDMI kabel'
            ],
            'Qoruyucu örtük': [
                'iPhone üçün keys', 'Samsung üçün keys',
                'Xiaomi üçün keys', 'Huawei üçün keys',
                'Universal keys', 'Flip keys', 'Şüşə keys'
            ],
            'Ekran qoruyucu': [
                'iPhone tempered glass', 'Samsung tempered glass',
                'Xiaomi tempered glass', 'Universal ekran qoruyucu'
            ],
            'Power Bank': [
                'Xiaomi Power Bank 10000mAh', 'Xiaomi Power Bank 20000mAh',
                'Anker PowerCore 10000', 'Anker PowerCore 20000',
                'Samsung Power Bank 10000mAh',
                'Baseus 20000mAh', 'Baseus 30000mAh'
            ]
        }
    };

    const PHONE_ONLY_GROUPS = ['memory', 'ram', 'screen', 'battery', 'fingerprint', 'nfc', 'waterproof', 'expandable'];

    const brandSelect = document.getElementById('brandSelect');
    const modelSelect = document.getElementById('modelSelect');
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    const applyBtn = document.querySelector('.btn-apply');
    const searchBtn = document.getElementById('searchBtn') || document.querySelector('.search-btn');
    const resetBtn = document.querySelector('.btn-reset');
    const searchInput = document.getElementById('searchInput') || document.querySelector('.search-options > input[type="text"]');

    function getUiLang() {
        const raw = (localStorage.getItem('lang') || 'AZ').trim().toUpperCase();
        if (raw === 'RU' || raw === 'РУС') return 'RUS';
        if (raw === 'EN') return 'ENG';
        return (raw === 'RUS' || raw === 'ENG') ? raw : 'AZ';
    }

    function getFilterText(key) {
        const lang = getUiLang();
        const dict = {
            allBrands: { AZ: 'Bütün markalar', RUS: 'Все марки', ENG: 'All brands' },
            otherBrand: { AZ: 'Digər', RUS: 'Другие', ENG: 'Other' },
            allModels: { AZ: 'Bütün modellər', RUS: 'Все модели', ENG: 'All models' },
            selectBrandFirst: { AZ: 'Əvvəlcə marka seçin', RUS: 'Сначала выберите марку', ENG: 'Select brand first' },
            otherModel: { AZ: 'Digər model', RUS: 'Другая модель', ENG: 'Other model' }
        };
        return (dict[key] && (dict[key][lang] || dict[key].AZ)) || '';
    }

    function normalizeCategoryKey(rawCat) {
        const val = String(rawCat || '').trim().toLowerCase().replace(/\u0307/g, '');
        if (!val || val === 'all' || val === 'any' || val === 'both' || val === 'hamısı' || val === 'hamisi') return '';
        if (val === 'phone' || val === 'telefon' || val === 'telefonlar') return 'Telefon';
        if (val === 'tablet' || val === 'planşet' || val === 'planset' || val === 'planşetlər') return 'Planşet';
        if (val === 'headphone' || val === 'qulaqlıq' || val === 'qulaqliq' || val === 'qulaqcıqlar') return 'Qulaqlıq';
        if (val === 'accessory' || val === 'aksesuar' || val === 'aksessuar' || val === 'aksesuarlar' || val === 'telefon aksessuarları') return 'Aksesuar';
        return '';
    }

    function getCurrentFilterCategory() {
        const activePill = document.querySelector('.filter-btn-group[data-group="category"] .filter-pill.active');
        if (activePill) {
            return normalizeCategoryKey(activePill.getAttribute('data-value'));
        }
        const urlCat = new URLSearchParams(window.location.search).get('category') || '';
        return normalizeCategoryKey(urlCat);
    }

    function updateFilterGroupVisibility(catKey) {
        const hidePhoneSpecs = (catKey === 'Qulaqlıq' || catKey === 'Aksesuar');
        PHONE_ONLY_GROUPS.forEach((groupName) => {
            const groupEl = document.querySelector(`.filter-btn-group[data-group="${groupName}"]`)?.closest('.filter-group');
            if (!groupEl) return;
            groupEl.style.display = hidePhoneSpecs ? 'none' : '';
            if (hidePhoneSpecs) {
                const pills = groupEl.querySelectorAll('.filter-pill');
                pills.forEach(p => {
                    const dv = p.getAttribute('data-value');
                    p.classList.toggle('active', dv === 'any');
                });
            }
        });
    }

    function getBrandsForCategory(catKey) {
        if (catKey && FILTER_CATALOG[catKey]) {
            return Object.keys(FILTER_CATALOG[catKey]);
        }
        const seen = new Set();
        const combined = [];
        Object.values(FILTER_CATALOG).forEach((catBrands) => {
            Object.keys(catBrands).forEach((b) => {
                if (!seen.has(b)) {
                    seen.add(b);
                    combined.push(b);
                }
            });
        });
        return combined;
    }

    function getModelsForCategoryAndBrand(catKey, selectedBrand) {
        if (!selectedBrand) return [];
        if (catKey && FILTER_CATALOG[catKey]) {
            return FILTER_CATALOG[catKey][selectedBrand] || [];
        }
        const seen = new Set();
        const combined = [];
        Object.values(FILTER_CATALOG).forEach((catBrands) => {
            const list = catBrands[selectedBrand];
            if (Array.isArray(list)) {
                list.forEach((m) => {
                    if (!seen.has(m)) {
                        seen.add(m);
                        combined.push(m);
                    }
                });
            }
        });
        return combined;
    }

    function updateBrandOptions(catKey, currentSelectedBrand = '') {
        if (!brandSelect) return;
        const normalizedCat = normalizeCategoryKey(catKey);
        const brands = getBrandsForCategory(normalizedCat);
        const prevVal = currentSelectedBrand || brandSelect.value || '';

        brandSelect.innerHTML = '';

        const allOpt = document.createElement('option');
        allOpt.value = '';
        allOpt.textContent = getFilterText('allBrands');
        brandSelect.appendChild(allOpt);

        let matched = false;
        brands.forEach((b) => {
            const opt = document.createElement('option');
            opt.value = b;
            opt.textContent = b;
            if (prevVal && b.toLowerCase() === prevVal.toLowerCase()) {
                opt.selected = true;
                matched = true;
            }
            brandSelect.appendChild(opt);
        });

        const otherOpt = document.createElement('option');
        otherOpt.value = 'other';
        otherOpt.textContent = getFilterText('otherBrand');
        if (prevVal && prevVal.toLowerCase() === 'other') {
            otherOpt.selected = true;
            matched = true;
        }
        brandSelect.appendChild(otherOpt);

        if (!matched) brandSelect.value = '';
    }

    function updateModelOptions(selectedBrand, currentSelectedModel = '', explicitCatKey = null) {
        if (!modelSelect) return;
        const catKey = explicitCatKey !== null ? normalizeCategoryKey(explicitCatKey) : getCurrentFilterCategory();
        const models = getModelsForCategoryAndBrand(catKey, selectedBrand);

        modelSelect.innerHTML = '';
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = selectedBrand ? getFilterText('allModels') : getFilterText('selectBrandFirst');
        modelSelect.appendChild(defaultOpt);

        if (selectedBrand) {
            models.forEach((m) => {
                const opt = document.createElement('option');
                opt.value = m;
                opt.textContent = m;
                if (currentSelectedModel && m.toLowerCase() === currentSelectedModel.toLowerCase()) {
                    opt.selected = true;
                }
                modelSelect.appendChild(opt);
            });
            const otherOpt = document.createElement('option');
            otherOpt.value = 'other';
            otherOpt.textContent = getFilterText('otherModel');
            if (currentSelectedModel === 'other') otherOpt.selected = true;
            modelSelect.appendChild(otherOpt);
        }
    }

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
                    if (pill.classList.contains('active')) {
                        pill.classList.remove('active');
                    } else {
                        pills.forEach(p => p.classList.remove('active'));
                        pill.classList.add('active');
                    }
                }

                // If this pill is a category button, update Brand/Model dropdowns, hide irrelevant filters & apply search
                if (group.getAttribute('data-group') === 'category') {
                    const activeVal = pill.getAttribute('data-value') || '';
                    const catKey = normalizeCategoryKey(activeVal);
                    const curBrand = brandSelect ? brandSelect.value : '';
                    updateBrandOptions(catKey, curBrand);
                    updateModelOptions(brandSelect ? brandSelect.value : '', '', catKey);
                    updateFilterGroupVisibility(catKey);
                    applyFilters();
                }
            });
        });
    });

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
            const lang = getUiLang();
            const searchingText = (window.translations?.[lang]?.['searching']) || (lang === 'RUS' ? 'Поиск...' : (lang === 'ENG' ? 'Searching...' : 'Axtarılır...'));
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

        const lang = getUiLang();
        const isRu = lang === 'RUS';
        const isEng = lang === 'ENG';

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
        document.querySelectorAll('#searchInput, .search-options > input[type="text"]').forEach(i => { i.value = ''; });

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

    function applyFilters() {
        const filters = getActiveFilters();
        const urlParams = new URLSearchParams();

        if (filters.q) urlParams.set('q', filters.q);
        Object.keys(filters).forEach(key => {
            if (key === 'q' || key === 'colors') return;
            const val = filters[key];
            if (val !== null && val !== undefined && val !== '' && val !== 'any' && val !== 'both' && val !== '0' && val !== 0 && val !== 'Infinity' && val !== Infinity && (!Number.isNaN(val))) {
                if (typeof val === 'number' && !Number.isFinite(val)) return;
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
        updateActiveBadge();

        if (typeof window.searchAdsFromAPI === 'function') {
            window.searchAdsFromAPI(filters).then((res) => {
                const count = (res && typeof res.count === 'number') ? res.count : document.querySelectorAll('.all-ads-container .elan-card, .all-ads-container .ad-card').length;
                showSearchFeedback(filters.q, count);
            }).catch((err) => {
                console.warn('Server search failed, applying client-side fallback:', err);
                applyClientFilters(filters);
            });
            return;
        }

        applyClientFilters(filters);
    }

    function applyClientFilters(filters) {
        filters = filters || getActiveFilters();
        const adCards = document.querySelectorAll('#catalog .elan-card, #catalog .ad-card, .all-ads-container .elan-card, .all-ads-container .ad-card, #phone-ads-container .elan-card, #phone-ads-container .ad-card');
        let visibleCount = 0;

        const cityAliases = {
            baku: ['bakı', 'baki', 'baku'], bakı: ['bakı', 'baki', 'baku'],
            ganja: ['gəncə', 'gence', 'ganja'], gəncə: ['gəncə', 'gence', 'ganja'],
            sumqayit: ['sumqayıt', 'sumqayit'], sumqayıt: ['sumqayıt', 'sumqayit'],
            absheron: ['abşeron', 'abşəron', 'abseron', 'absheron'],
            abşeron: ['abşeron', 'abşəron', 'abseron', 'absheron'],
            abşəron: ['abşeron', 'abşəron', 'abseron', 'absheron'],
            ujar: ['ucar', 'ujar'], ucar: ['ucar', 'ujar']
        };

        const normVal = (v) => String(v || '').trim().toLowerCase().replace(/\u0307/g, '');

        adCards.forEach(card => {
            let matches = true;

            const isAllCat = !filters.category || filters.category === 'all' || filters.category === 'any' || filters.category === 'both' || normVal(filters.category) === 'hamısı' || normVal(filters.category) === 'hamisi';
            if (matches && !isAllCat) {
                const cardCat = normVal(card.getAttribute('data-category'));
                const filterCat = normVal(filters.category);
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

            const q = normVal(filters.q);
            if (q) {
                const searchText = normVal(card.textContent);
                if (!searchText.includes(q)) matches = false;
            }

            if (matches && filters.brand) {
                const cardBrand = normVal(card.getAttribute('data-brand'));
                const filterBrand = normVal(filters.brand);
                if (filterBrand === 'other') {
                    if (cardBrand !== 'digər' && cardBrand !== 'other' && cardBrand !== 'digər aksesuar') matches = false;
                } else if (cardBrand !== filterBrand) {
                    matches = false;
                }
            }

            if (matches && filters.model) {
                const cardModel = normVal(card.getAttribute('data-model') || card.querySelector('.ad-title')?.textContent);
                const filterModel = normVal(filters.model);
                if (filterModel === 'other') {
                    if (!cardModel.includes('digər')) matches = false;
                } else if (!cardModel.includes(filterModel)) {
                    matches = false;
                }
            }

            if (matches && filters.city) {
                const cardCity = normVal(card.getAttribute('data-city'));
                const filterCity = normVal(filters.city);
                const allowedCities = cityAliases[filterCity] || [filterCity];
                if (!allowedCities.includes(cardCity) && cardCity !== filterCity) matches = false;
            }

            if (matches && filters.memory) {
                const cardMem = normVal(card.getAttribute('data-memory')).replace(/\s*gb$/i, '').trim();
                const filterMem = normVal(filters.memory);
                if (filterMem === 'below-64') {
                    if (!['64-dan-az', 'below-64', '32', '16', '8'].includes(cardMem)) matches = false;
                } else if (filterMem === '512+') {
                    if (!['512-den-cox', '512+', '1024'].includes(cardMem)) matches = false;
                } else if (cardMem !== filterMem) {
                    matches = false;
                }
            }

            if (matches && filters.ram) {
                const cardRam = normVal(card.getAttribute('data-ram')).replace(/\s*gb$/i, '').trim();
                const filterRam = normVal(filters.ram);
                if (filterRam === '16+') {
                    if (!['16-dan-cox', '16+', '16', '24', '32'].includes(cardRam)) matches = false;
                } else if (cardRam !== filterRam) {
                    matches = false;
                }
            }

            if (matches && filters.screen) {
                if (normVal(card.getAttribute('data-screen')) !== normVal(filters.screen)) matches = false;
            }

            if (matches && filters.battery) {
                const cardBat = normVal(card.getAttribute('data-battery'));
                const filterBat = normVal(filters.battery);
                if (filterBat === '3000-4500') {
                    if (!['3000-4000', '3000-4500', '4000-5000'].includes(cardBat)) matches = false;
                } else if (filterBat === '>4500') {
                    if (!['4000-5000', '5000+', '>4500'].includes(cardBat) && !cardBat.startsWith('5000')) matches = false;
                } else if (cardBat !== filterBat) {
                    matches = false;
                }
            }

            const exactCheck = (filterVal, attrVal) => {
                if (!filterVal || filterVal === 'any' || filterVal === 'both') return true;
                return normVal(filterVal) === normVal(attrVal);
            };

            if (matches && !exactCheck(filters.fingerprint, card.getAttribute('data-fingerprint'))) matches = false;
            if (matches && !exactCheck(filters.nfc, card.getAttribute('data-nfc'))) matches = false;
            if (matches && !exactCheck(filters.waterproof, card.getAttribute('data-waterproof'))) matches = false;
            if (matches && !exactCheck(filters.expandable, card.getAttribute('data-expandable'))) matches = false;
            if (matches && !exactCheck(filters.delivery, card.getAttribute('data-delivery'))) matches = false;
            if (matches && !exactCheck(filters.seller, card.getAttribute('data-seller'))) matches = false;

            if (matches && filters.condition && filters.condition !== 'both') {
                const cc = normVal(card.getAttribute('data-condition'));
                const fc = normVal(filters.condition);
                const isNew = (v) => v === 'new' || v === 'yeni';
                const isUsed = (v) => v === 'used' || v === 'islenmis' || v === 'işlənmiş';
                if (!((isNew(fc) && isNew(cc)) || (isUsed(fc) && isUsed(cc)) || cc === fc)) matches = false;
            }

            if (matches) {
                const priceMatch = (card.getAttribute('data-price') || '').replace(/[^0-9]/g, '');
                if (priceMatch) {
                    const price = parseFloat(priceMatch);
                    if (typeof filters.minPrice === 'number' && !isNaN(filters.minPrice) && price < filters.minPrice) matches = false;
                    if (typeof filters.maxPrice === 'number' && !isNaN(filters.maxPrice) && price > filters.maxPrice) matches = false;
                }
            }

            if (matches && filters.colors.length > 0) {
                const cardColor = normVal(card.getAttribute('data-color'));
                const colorMap = {
                    black: ['black', 'qara', 'titan qara', 'titanium-black', 'silky black'],
                    white: ['white', 'ağ', 'ag', 'titan ağ', 'titan ag', 'titanium-white'],
                    grey: ['grey', 'gray', 'boz', 'graphite', 'qrafit', 'titan təbii', 'titanium-natural'],
                    blue: ['blue', 'mavi', 'göy', 'goy', 'darkblue', 'titan mavi', 'titan göy', 'titanium-blue'],
                    red: ['red', 'qırmızı', 'qirmizi'],
                    green: ['green', 'yaşıl', 'yasil', 'emerald', 'zümrüd yaşılı', 'mint'],
                    yellow: ['yellow', 'sarı', 'sari'],
                    orange: ['orange', 'narıncı', 'narinci'],
                    pink: ['pink', 'çəhrayı', 'cehrayi'],
                    purple: ['purple', 'bənövşəyi', 'benovseyi', 'deeppurple', 'dərin bənövşəyi', 'cobalt violet', 'lavender'],
                    brown: ['brown', 'qəhvəyi', 'qehveyi', 'bronze', 'bürünc', 'beige', 'bej'],
                    gold: ['gold', 'qızılı', 'qizili', 'titanium-desert', 'titan çöl'],
                    silver: ['silver', 'gümüşü', 'gumusu']
                };
                const anyColorMatched = filters.colors.some(fc => {
                    const aliases = colorMap[normVal(fc)] || [normVal(fc)];
                    return aliases.some(a => cardColor.includes(a));
                });
                if (!anyColorMatched) matches = false;
            }

            const targetItem = card.closest('a') || card;
            if (matches) {
                targetItem.style.display = '';
                visibleCount++;
            } else {
                targetItem.style.display = 'none';
            }
        });

        const catalogContainer = document.getElementById('catalog') ||
                                 document.querySelector('.phone-grid') ||
                                 document.getElementById('phone-ads-container') ||
                                 document.querySelector('.all-ads-container');
        if (catalogContainer) catalogContainer.style.display = 'grid';

        if (filters.sort && typeof window.sortAds === 'function') {
            window.sortAds(filters.sort);
        }
        showSearchFeedback(filters.q, visibleCount);
        updateActiveBadge();
    }

    function updateActiveBadge() {
        const badge = document.getElementById('filterBadge');
        if (!badge) return;

        const filters = getActiveFilters();
        let count = 0;
        if (filters.category && normalizeCategoryKey(filters.category)) count++;
        if (filters.brand) count++;
        if (filters.model) count++;
        if (filters.city) count++;
        if (filters.minPrice > 0 || (filters.maxPrice !== null && filters.maxPrice < Infinity)) count++;
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

        const chipsContainer = document.getElementById('filterChips');
        const activeFiltersWrapper = document.getElementById('activeFiltersContainer');
        if (chipsContainer && activeFiltersWrapper) {
            chipsContainer.innerHTML = '';
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
        if (document.getElementById('priceMin')) document.getElementById('priceMin').value = '';
        if (document.getElementById('priceMax')) document.getElementById('priceMax').value = '';

        const citySelect = document.querySelector('select[data-filter="city"]');
        if (citySelect) citySelect.value = '';

        document.querySelectorAll('.filter-pill').forEach(pill => pill.classList.remove('active'));
        document.querySelectorAll('.filter-pill[data-value="any"], .filter-pill[data-value="both"]').forEach(p => p.classList.add('active'));
        const allCatBtn = document.querySelector('.filter-btn-group[data-group="category"] .filter-pill[data-value=""]');
        if (allCatBtn) allCatBtn.classList.add('active');

        const urlCat = normalizeCategoryKey(new URLSearchParams(window.location.search).get('category'));
        const hasCatGroup = Boolean(document.querySelector('.filter-btn-group[data-group="category"]'));
        const effectiveCat = hasCatGroup ? '' : urlCat;

        updateBrandOptions(effectiveCat, '');
        updateModelOptions('', '', effectiveCat);
        updateFilterGroupVisibility(effectiveCat);

        const badge = document.getElementById('filterBadge');
        if (badge) {
            badge.style.display = 'none';
            badge.textContent = '0';
        }

        if (hasCatGroup) {
            window.history.pushState({}, '', window.location.pathname);
        } else {
            const keepCat = new URLSearchParams(window.location.search).get('category');
            window.history.pushState({}, '', keepCat ? `${window.location.pathname}?category=${encodeURIComponent(keepCat)}` : window.location.pathname);
        }

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

    if (priceMin) priceMin.addEventListener('input', debouncedApply);
    if (priceMax) priceMax.addEventListener('input', debouncedApply);
    if (brandSelect) {
        brandSelect.addEventListener('change', () => {
            updateModelOptions(brandSelect.value, '', getCurrentFilterCategory());
            debouncedApply();
        });
    }
    if (modelSelect) modelSelect.addEventListener('change', debouncedApply);

    // Initialize brand/model options immediately on DOM load (critical for phone.html?category=headphone|tablet|accessory)
    const initialCatKey = getCurrentFilterCategory();
    updateBrandOptions(initialCatKey, brandSelect ? brandSelect.value : '');
    updateModelOptions(brandSelect ? brandSelect.value : '', modelSelect ? modelSelect.value : '', initialCatKey);
    updateFilterGroupVisibility(initialCatKey);

    document.addEventListener('mobilaz:languagechange', () => {
        const curCat = getCurrentFilterCategory();
        const curBrand = brandSelect ? brandSelect.value : '';
        const curModel = modelSelect ? modelSelect.value : '';
        updateBrandOptions(curCat, curBrand);
        updateModelOptions(brandSelect ? brandSelect.value : '', curModel, curCat);
    });

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
                const curLang = getUiLang();
                const isRu = curLang === 'RUS';
                const isEng = curLang === 'ENG';
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

        if (params.has('q') && searchInput) searchInput.value = params.get('q');
        if (params.has('search') && searchInput && !params.has('q')) searchInput.value = params.get('search');

        ['category', 'memory', 'ram', 'screen', 'battery', 'fingerprint', 'nfc', 'waterproof', 'expandable', 'condition', 'delivery', 'seller'].forEach(group => {
            if (params.has(group)) {
                const val = params.get(group);
                const pills = document.querySelectorAll(`.filter-btn-group[data-group="${group}"] .filter-pill`);
                pills.forEach(p => {
                    const pVal = p.getAttribute('data-value');
                    if (group === 'category') {
                        p.classList.toggle('active', normalizeCategoryKey(pVal) === normalizeCategoryKey(val));
                    } else {
                        p.classList.toggle('active', pVal === val);
                    }
                });
            }
        });

        const activeCatKey = getCurrentFilterCategory();
        updateBrandOptions(activeCatKey, params.get('brand') || '');
        updateModelOptions(params.get('brand') || '', params.get('model') || '', activeCatKey);
        updateFilterGroupVisibility(activeCatKey);

        if (params.has('minPrice') && document.getElementById('priceMin')) document.getElementById('priceMin').value = params.get('minPrice');
        if (params.has('maxPrice') && document.getElementById('priceMax') && params.get('maxPrice') !== 'Infinity') document.getElementById('priceMax').value = params.get('maxPrice');
        if (params.has('city') && document.querySelector('select[data-filter="city"]')) document.querySelector('select[data-filter="city"]').value = params.get('city');

        if (params.has('colors') || params.has('color')) {
            const rawColors = params.get('colors') || params.get('color') || '';
            const colors = rawColors.split(',');
            const pills = document.querySelectorAll('.filter-btn-group[data-group="color"] .filter-pill');
            pills.forEach(p => {
                p.classList.toggle('active', colors.includes(p.getAttribute('data-value')));
            });
        }

        if (shouldFilterClient) {
            applyClientFilters(getActiveFilters());
        }
        updateActiveBadge();
    };
});

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
    const searchBtn = document.querySelector('.search-btn');
    const resetBtn = document.querySelector('.btn-reset');
    const searchInput = document.querySelector('.search-options > input[type="text"]');
    
    // Read current active filters
    function getActiveFilters() {
        const filters = {
            search: searchInput ? searchInput.value.toLowerCase().trim() : '',
            category: document.querySelector('.filter-btn-group[data-group="category"] .filter-pill.active')?.getAttribute('data-value') || '',
            brand: document.getElementById('brandSelect')?.value || '',
            model: document.getElementById('modelSelect')?.value || '',
            minPrice: parseFloat(document.getElementById('priceMin')?.value) || 0,
            maxPrice: parseFloat(document.getElementById('priceMax')?.value) || Infinity,
            city: document.querySelector('select[data-filter="city"]')?.value || '',
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
            colors: Array.from(document.querySelectorAll('.filter-btn-group[data-group="color"] .filter-pill.active')).map(btn => btn.getAttribute('data-value'))
        };
        return filters;
    }

    // Apply Filter Function
    function applyFilters() {
        const filters = getActiveFilters();
        const adCards = document.querySelectorAll('.ad-card');
        
        let visibleCount = 0;
        
        adCards.forEach(card => {
            let matches = true;
            
            // Category check
            if (matches && filters.category) {
                const cardCategory = card.getAttribute('data-category') || '';
                if (cardCategory.toLowerCase() !== filters.category.toLowerCase()) matches = false;
            }
            
            // Keyword search check against title
            const titleElem = card.querySelector('.ad-title');
            if (filters.search && titleElem && !titleElem.textContent.toLowerCase().includes(filters.search)) {
                matches = false;
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
            if (matches) {
                card.style.display = ''; 
                visibleCount++;
            } else {
                card.style.display = 'none';
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
        
        applyFilters();
    }

    // Attach events
    if (applyBtn) applyBtn.addEventListener('click', applyFilters);
    if (searchBtn) searchBtn.addEventListener('click', applyFilters);
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
    if (searchInput) searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') applyFilters();
    });
});

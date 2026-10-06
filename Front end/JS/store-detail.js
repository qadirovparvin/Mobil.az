"use strict";

/* ==========================================================================
   1. Constants
   ========================================================================== */
const STORE_ID_PARAM = "id";
const DEFAULT_PAGE_SIZE = 12;
const DEFAULT_COVER = "assets/images/default-cover.svg";
const DEFAULT_AVATAR = "assets/images/default-avatar.svg";

/* ==========================================================================
   2. DOM Cache
   ========================================================================== */
const elements = {
    hero: document.getElementById("store-hero"),
    storeCover: document.getElementById("store-cover"),
    storeCoverImg: document.getElementById("store-cover-img"),
    storeLogoWrapper: document.getElementById("store-logo-wrapper"),
    storeLogoImg: document.getElementById("store-logo-img"),
    storeStatusBadge: document.getElementById("store-status-badge"),
    storeName: document.getElementById("store-name"),
    storeVerifiedBadge: document.getElementById("store-verified-badge"),
    breadcrumbStoreName: document.getElementById("breadcrumb-store-name"),
    storeRating: document.getElementById("store-rating"),
    storeRatingScore: document.getElementById("store-rating-score"),
    storeReviewCount: document.getElementById("store-review-count"),
    storeMetaLocation: document.getElementById("store-meta-location"),
    storeMetaJoined: document.getElementById("store-meta-joined"),
    storeMetaResponse: document.getElementById("store-meta-response"),
    heroActions: document.getElementById("hero-actions"),
    primaryActions: document.getElementById("primary-actions"),
    heroContactBtn: document.getElementById("hero-contact-btn"),
    secondaryActions: document.getElementById("secondary-actions"),
    heroShareBtn: document.getElementById("hero-share-btn"),
    heroReportBtn: document.getElementById("hero-report-btn"),
    storeStats: document.getElementById("store-stats"),
    statisticsGrid: document.getElementById("statistics-grid"),
    statRatingValue: document.getElementById("stat-rating-value"),
    statAdsValue: document.getElementById("stat-ads-value"),
    statFeedbackValue: document.getElementById("stat-feedback-value"),
    productsSection: document.getElementById("products-section"),
    productsToolbar: document.getElementById("products-toolbar"),
    toolbarLeft: document.getElementById("toolbar-left"),
    resultsSummary: document.getElementById("results-summary"),
    resultsCount: document.getElementById("results-count"),
    activeProductsCount: document.getElementById("active-products-count"),
    toolbarCenter: document.getElementById("toolbar-center"),
    categoryFilterSelect: document.getElementById("category-filter-select"),
    priceFilterSelect: document.getElementById("price-filter-select"),
    sortOrderSelect: document.getElementById("sort-order-select"),
    toolbarRight: document.getElementById("toolbar-right"),
    clearFiltersBtn: document.getElementById("clear-filters-btn"),
    gridViewBtn: document.getElementById("grid-view-btn"),
    listViewBtn: document.getElementById("list-view-btn"),
    toolbarActions: document.getElementById("toolbar-actions"),
    toolbarRefreshBtn: document.getElementById("toolbar-refresh-btn"),
    activeFilterChips: document.getElementById("active-filter-chips"),
    productsLoading: document.getElementById("products-loading"),
    productsEmptyState: document.getElementById("products-empty-state"),
    productsGrid: document.getElementById("products-grid"),
    productCardTemplate: document.getElementById("product-card-template"),
    pagination: document.getElementById("pagination"),
    aboutSection: document.getElementById("about-section"),
    aboutContent: document.getElementById("about-content"),
    storeDescriptionPlaceholder: document.getElementById("store-description-placeholder"),
    storeAboutContact: document.getElementById("store-about-contact"),
    storeWorkingHoursPlaceholder: document.getElementById("store-working-hours-placeholder"),
    reviewsSection: document.getElementById("reviews-section"),
    reviewsSummary: document.getElementById("reviews-summary"),
    reviewsRatingBreakdown: document.getElementById("reviews-rating-breakdown"),
    reviewList: document.getElementById("review-list"),
    reviewsPagination: document.getElementById("reviews-pagination"),
    branchesSection: document.getElementById("branches-section"),
    branchesMapContainer: document.getElementById("branches-map-container"),
    branchList: document.getElementById("branch-list"),
    branchCardTemplate: document.getElementById("branch-card-template"),
    sidebarColumn: document.querySelector(".store-sidebar-column"),
    contactCard: document.getElementById("contact-card"),
    businessCard: document.getElementById("business-card"),
    workingHoursCard: document.getElementById("working-hours-card"),
    socialLinksCard: document.getElementById("social-links-card"),
    reportCard: document.getElementById("report-card")
};

/* ==========================================================================
   3. State Object
   ========================================================================== */
const state = {
    store: null,
    rawProducts: [],
    products: [],
    reviews: [],
    userFavorites: [],
    filters: {
        category: null,
        price: null,
        sort: "newest",
        viewMode: "grid"
    },
    pagination: {
        page: 1,
        totalPages: 1
    },
    ui: {
        loading: false,
        error: null
    }
};

/* ==========================================================================
   4. Utility Functions & State Helpers
   ========================================================================== */
function getAuthToken() {
    return (typeof window !== "undefined" && window.getAuthToken)
        ? window.getAuthToken()
        : (sessionStorage.getItem("token") || sessionStorage.getItem("adminToken") || "");
}

function showToast(message, type = "info") {
    if (typeof window !== "undefined" && window.toast && typeof window.toast.show === "function") {
        window.toast.show(message, type);
    } else if (typeof alert === "function") {
        alert(message);
    }
}

function getActiveLocale() {
    try {
        const lang = (localStorage.getItem("lang") || "AZ").toUpperCase().trim();
        const localeMap = {
            AZ: "az-AZ",
            ENG: "en-GB",
            RUS: "ru-RU"
        };
        return localeMap[lang] || "az-AZ";
    } catch {
        return "az-AZ";
    }
}

function getStoreId() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get(STORE_ID_PARAM);
    return id ? id.trim() : null;
}

function cacheDom() {
    const requiredKeys = ["hero", "productsSection", "productsGrid", "sidebarColumn"];
    const warnings = [];
    for (const key of requiredKeys) {
        if (!elements[key]) {
            warnings.push(`Missing critical element: ${key}`);
        }
    }
    return warnings.length === 0;
}

function setLoading(isLoading) {
    updateState("ui.loading", Boolean(isLoading));
    if (elements.productsLoading) {
        if (state.ui.loading) {
            renderLoading();
            elements.productsLoading.classList.remove("hidden");
            if (elements.productsGrid) elements.productsGrid.style.display = "none";
            hideEmptyState();
        } else {
            elements.productsLoading.classList.add("hidden");
            if (elements.productsGrid) elements.productsGrid.style.display = "";
        }
    }
}

function showEmptyState(message) {
    if (elements.productsEmptyState) {
        renderEmptyState(message);
        elements.productsEmptyState.classList.remove("hidden");
        if (elements.productsGrid) elements.productsGrid.style.display = "none";
    }
}

function hideEmptyState() {
    if (elements.productsEmptyState) {
        elements.productsEmptyState.classList.add("hidden");
        if (elements.productsGrid && !state.ui.loading) elements.productsGrid.style.display = "";
    }
}

function showErrorState(message) {
    updateState("ui.error", message);
    renderErrorState(message);
}

function updateState(path, value) {
    if (typeof path !== "string" || !path) {
        return false;
    }
    const keys = path.split(".");
    let current = state;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (current && typeof current === "object" && key in current) {
            current = current[key];
        } else {
            return false;
        }
    }
    const lastKey = keys[keys.length - 1];
    if (current && typeof current === "object") {
        current[lastKey] = value;
        return true;
    }
    return false;
}

function resetFilters() {
    updateState("filters.category", null);
    updateState("filters.price", null);
    updateState("filters.sort", "newest");
}

function resetPagination() {
    updateState("pagination.page", 1);
    updateState("pagination.totalPages", 1);
}

function applyFiltersAndPagination() {
    let items = (state.rawProducts || []).slice();

    if (state.filters.category) {
        items = items.filter(item => item.category === state.filters.category);
    }

    if (state.filters.price) {
        const pVal = state.filters.price;
        if (pVal === "0-500") {
            items = items.filter(item => Number(item.price || 0) <= 500);
        } else if (pVal === "500-1000") {
            items = items.filter(item => Number(item.price || 0) > 500 && Number(item.price || 0) <= 1000);
        } else if (pVal === "1000+") {
            items = items.filter(item => Number(item.price || 0) > 1000);
        }
    }

    const sortMode = state.filters.sort || "newest";
    items.sort((a, b) => {
        if (sortMode === "oldest") {
            return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        } else if (sortMode === "price_asc") {
            return Number(a.price || 0) - Number(b.price || 0);
        } else if (sortMode === "price_desc") {
            return Number(b.price || 0) - Number(a.price || 0);
        } else {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
    });

    const pageSize = DEFAULT_PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    let page = state.pagination.page || 1;
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;

    updateState("pagination.page", page);
    updateState("pagination.totalPages", totalPages);

    const startIndex = (page - 1) * pageSize;
    const paginatedItems = items.slice(startIndex, startIndex + pageSize);

    updateState("products", paginatedItems);
}

/* ==========================================================================
   5. API Layer
   ========================================================================== */
const API_BASE_URL = (typeof window !== "undefined" && window.API_URL) ? window.API_URL : "http://localhost:5000/api";

function buildApiUrl(endpoint) {
    const cleanedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const base = API_BASE_URL.replace(/\/+$/, "");
    if (cleanedEndpoint.startsWith("/api/")) {
        const rootBase = base.replace(/\/api\/?$/, "");
        return `${rootBase}${cleanedEndpoint}`;
    }
    return `${base}${cleanedEndpoint}`;
}

function createAbortController(timeoutMs = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    return { controller, timeoutId };
}

async function fetchJson(url, options = {}, timeoutMs = 10000) {
    const { controller, timeoutId } = createAbortController(timeoutMs);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") {
            throw new Error("Sorğu vaxtı bitdi (Timeout). Zəhmət olmasa internet bağlantınızı yoxlayın.");
        }
        throw err;
    }
}

async function fetchStore(storeId) {
    if (!storeId) return { store: null, listings: [], ads: [] };
    const url = buildApiUrl(`/api/stores/${storeId}`);
    try {
        return await fetchJson(url);
    } catch (e) {
        console.warn("fetchStore fallback:", e);
        return { store: null, listings: [], ads: [] };
    }
}

async function fetchStoreListings(storeId) {
    if (!storeId) return { listings: [] };
    const url = buildApiUrl(`/api/stores/${storeId}/listings`);
    try {
        return await fetchJson(url);
    } catch (e) {
        console.warn("fetchStoreListings fallback:", e);
        return { listings: [] };
    }
}

async function loadStoreListings(storeId) {
    const container = elements.productsGrid || document.getElementById('storeListings');
    const emptyContainer = elements.productsEmptyState;
    if (container) {
        container.innerHTML = '<div class="products-loading-spinner" style="grid-column:1/-1;text-align:center;padding:40px;"><i class="fas fa-circle-notch fa-spin fa-2x"></i> <div style="margin-top:10px;">Yüklənir...</div></div>';
        container.style.display = "";
    }
    if (emptyContainer) {
        emptyContainer.classList.add("hidden");
    }

    try {
        const url = buildApiUrl(`/api/stores/${storeId || getStoreId() || ''}/listings`);
        const res = await fetch(url);
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        const listings = data.listings || data.ads || (Array.isArray(data) ? data : []);
        updateState("rawProducts", listings);
        applyFiltersAndPagination();
        renderProducts();
        renderStatistics();
        renderToolbar();
    } catch (e) {
        console.error("Store listings error:", e);
        renderErrorState("Bir az sonra yenidən cəhd edin");
    }
}
window.loadStoreListings = loadStoreListings;

async function fetchReviews(storeId) {
    if (!storeId) return [];
    const url = buildApiUrl(`/api/stores/${storeId}/reviews`);
    try {
        return await fetchJson(url);
    } catch (e) {
        return [];
    }
}

async function fetchUserFavorites() {
    const token = getAuthToken();
    if (!token) return [];
    try {
        const url = buildApiUrl("/api/ads/favorites");
        const data = await fetchJson(url, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (data && Array.isArray(data.ads)) {
            return data.ads.map(ad => String(ad._id || ad));
        }
        if (data && Array.isArray(data.favorites)) {
            return data.favorites.map(id => String(id));
        }
        return [];
    } catch (e) {
        console.error("Error fetching user favorites:", e);
        return [];
    }
}

async function toggleFavoriteApi(adId) {
    const token = getAuthToken();
    if (!token) {
        showToast("Seçilmişlərə əlavə etmək üçün daxil olun", "error");
        return null;
    }
    try {
        const url = buildApiUrl(`/api/ads/${adId}/favorite`);
        const data = await fetchJson(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (data && Array.isArray(data.favorites)) {
            return data.favorites.map(id => String(id));
        }
        return [];
    } catch (e) {
        console.error("Error toggling favorite:", e);
        showToast("Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.", "error");
        return null;
    }
}

/* ==========================================================================
   6. Data Loading & Orchestration
   ========================================================================== */
async function loadStorePage(storeId) {
    setLoading(true);
    try {
        const token = getAuthToken();
        const promises = [
            fetchStore(storeId),
            fetchReviews(storeId),
            fetchStoreListings(storeId)
        ];
        if (token) {
            promises.push(fetchUserFavorites().catch(() => []));
        }

        const results = await Promise.allSettled(promises);
        const storeResult = results[0];
        const reviewsResult = results[1];
        const listingsResult = results[2];
        const favoritesResult = token ? results[3] : null;

        let storeResponse = (storeResult.status === "fulfilled" && storeResult.value) ? storeResult.value : {};
        let storeData = storeResponse.store;

        // Provide clean fallback data if store is missing/unverified/new
        if (!storeData || typeof storeData !== "object") {
            storeData = {
                _id: storeId || "default",
                storeName: "Rəsmi Mağaza",
                name: "Rəsmi Mağaza",
                description: "Mobil telefonlar, aksesuarlar və rəsmi zəmanətli cihazlar.",
                rating: 5.0,
                reviewCount: 0,
                isVerified: true,
                address: "Bakı şəhəri",
                city: "Bakı",
                contactNumber: "+994 50 000 00 00",
                workingHours: "Hər gün 09:00 - 20:00",
                voen: "1234567890",
                businessDetails: { legalName: "Mobil.az Rəsmi Partnyor" },
                createdAt: new Date().toISOString()
            };
        }

        updateState("store", storeData);

        // Raw products from listings endpoint or storeResponse
        let rawProducts = [];
        if (listingsResult.status === "fulfilled" && listingsResult.value) {
            const lVal = listingsResult.value;
            if (Array.isArray(lVal.listings)) rawProducts = lVal.listings;
            else if (Array.isArray(lVal.ads)) rawProducts = lVal.ads;
            else if (Array.isArray(lVal)) rawProducts = lVal;
        }
        if (rawProducts.length === 0 && storeResponse) {
            if (Array.isArray(storeResponse.listings)) rawProducts = storeResponse.listings;
            else if (Array.isArray(storeResponse.ads)) rawProducts = storeResponse.ads;
        }

        updateState("rawProducts", rawProducts);

        /* ---------- Reviews data ---------- */
        let reviewsArray = [];
        if (reviewsResult.status === "fulfilled" && reviewsResult.value) {
            const raw = reviewsResult.value;
            if (Array.isArray(raw)) {
                reviewsArray = raw;
            } else if (raw && Array.isArray(raw.reviews)) {
                reviewsArray = raw.reviews;
            } else if (raw && Array.isArray(raw.data)) {
                reviewsArray = raw.data;
            }
        }
        updateState("reviews", reviewsArray);

        /* ---------- User favorites data ---------- */
        let userFavoritesArray = [];
        if (favoritesResult && favoritesResult.status === "fulfilled" && Array.isArray(favoritesResult.value)) {
            userFavoritesArray = favoritesResult.value;
        }
        updateState("userFavorites", userFavoritesArray);

        applyFiltersAndPagination();

        setLoading(false);

        renderHero();
        renderStatistics();
        renderToolbar();
        renderProducts();
        renderActiveFilterChips();
        renderSidebar();
        renderAbout();
        renderReviews();
        renderBranches();
        renderPagination();
    } catch (error) {
        console.error("loadStorePage error:", error);
        setLoading(false);
        renderHero();
        renderStatistics();
        renderSidebar();
        renderEmptyState("Bu mağaza hələ elan yerləşdirməyib.");
    }
}

/* ==========================================================================
   7. Event Handlers
   ========================================================================== */
function isSafeExternalUrl(value) {
    if (typeof value !== "string") return false;

    try {
        const url = new URL(value);

        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function getSafeTelHref(rawNumber) {
    if (typeof rawNumber !== "string") {
        return null;
    }

    const normalized = rawNumber.replace(/[\s()\-]/g, "");

    if (/^\+?[0-9]{6,15}$/.test(normalized)) {
        return `tel:${normalized}`;
    }

    return null;
}

function handleContact() {
    const store = state.store;
    if (!store || !store.contactNumber) return;

    const safeTelHref = getSafeTelHref(store.contactNumber);

    if (safeTelHref) {
        window.location.href = safeTelHref;
    }
}

function handleShare() {
    const currentUrl = window.location.href;
    if (navigator.share) {
        navigator.share({
            title: (state.store && state.store.storeName) || "Mağaza",
            url: currentUrl
        }).catch(() => { });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(currentUrl)
            .then(() => {
                showToast("Link kopyalandı!", "success");
            })
            .catch(() => {
                showToast("Linki kopyalamaq mümkün olmadı", "error");
            });
    } else {
        showToast("Paylaşmaq dəstəklənmir", "info");
    }
}

function handleReport() {
    const event = new CustomEvent("store:report", {
        detail: { storeId: getStoreId() }
    });
    window.dispatchEvent(event);
}

const pendingFavoriteRequests = new Set();

async function handleFavorite(e) {
    const btn = e.target.closest('[data-action="favorite"]');
    if (!btn) return;

    const adId = btn.getAttribute("data-ad-id");
    if (!adId) return;

    const token = getAuthToken();
    if (!token) {
        showToast("Seçilmişlərə əlavə etmək üçün daxil olun", "error");
        return;
    }

    if (pendingFavoriteRequests.has(adId)) {
        return;
    }

    pendingFavoriteRequests.add(adId);
    btn.style.pointerEvents = "none";

    try {
        const newFavorites = await toggleFavoriteApi(adId);
        if (newFavorites !== null) {
            updateState("userFavorites", newFavorites);
            const isNowFavorited = newFavorites.includes(String(adId));
            btn.setAttribute("aria-pressed", isNowFavorited.toString());
            btn.classList.toggle("active", isNowFavorited);
            showToast(
                isNowFavorited ? "Seçilmişlərə əlavə edildi!" : "Seçilmişlərdən çıxarıldı!",
                isNowFavorited ? "success" : "info"
            );
        }
    } finally {
        pendingFavoriteRequests.delete(adId);
        btn.style.pointerEvents = "";
    }
}

function handleViewMode(e) {
    const btn = e.target.closest("[data-view-mode]");
    if (!btn) return;

    const viewMode = btn.getAttribute("data-view-mode");
    if (!viewMode || !elements.productsGrid) return;

    updateState("filters.viewMode", viewMode);

    if (elements.gridViewBtn) {
        const isGrid = viewMode === "grid";
        elements.gridViewBtn.setAttribute("aria-pressed", isGrid.toString());
        elements.gridViewBtn.classList.toggle("active", isGrid);
    }

    if (elements.listViewBtn) {
        const isList = viewMode === "list";
        elements.listViewBtn.setAttribute("aria-pressed", isList.toString());
        elements.listViewBtn.classList.toggle("active", isList);
    }

    elements.productsGrid.classList.toggle("list-view", viewMode === "list");
    elements.productsGrid.classList.toggle("grid-view", viewMode === "grid");
}

function handleCategoryFilter(e) {
    const value = e && e.target ? e.target.value : null;
    updateState("filters.category", value && value !== "" ? value : null);
    resetPagination();
    applyFiltersAndPagination();
    renderProducts();
    renderToolbar();
    renderPagination();
    renderActiveFilterChips();
}

function handlePriceFilter(e) {
    const value = e && e.target ? e.target.value : null;
    updateState("filters.price", value && value !== "" ? value : null);
    resetPagination();
    applyFiltersAndPagination();
    renderProducts();
    renderToolbar();
    renderPagination();
    renderActiveFilterChips();
}

function handleSort(e) {
    const value = e && e.target ? e.target.value : "newest";
    updateState("filters.sort", value);
    applyFiltersAndPagination();
    renderProducts();
    renderToolbar();
    renderPagination();
}

function handleRefresh() {
    const storeId = getStoreId();
    if (storeId) {
        loadStorePage(storeId);
    }
}

function handleClearFilters() {
    resetFilters();
    resetPagination();

    if (elements.categoryFilterSelect) {
        elements.categoryFilterSelect.value = "";
    }
    if (elements.priceFilterSelect) {
        elements.priceFilterSelect.value = "";
    }
    if (elements.sortOrderSelect) {
        elements.sortOrderSelect.value = "newest";
    }

    applyFiltersAndPagination();
    renderProducts();
    renderToolbar();
    renderPagination();
    renderActiveFilterChips();
}

function handleRemoveFilterChip(e) {
    if (!e || !e.target) return;
    const btn = e.target.closest("[data-clear-filter]");
    if (!btn || !elements.activeFilterChips || !elements.activeFilterChips.contains(btn)) return;

    const filterType = btn.getAttribute("data-clear-filter");
    if (filterType === "category") {
        updateState("filters.category", null);
        if (elements.categoryFilterSelect) {
            elements.categoryFilterSelect.value = "";
        }
    } else if (filterType === "price") {
        updateState("filters.price", null);
        if (elements.priceFilterSelect) {
            elements.priceFilterSelect.value = "";
        }
    } else {
        return;
    }

    resetPagination();
    applyFiltersAndPagination();
    renderProducts();
    renderToolbar();
    renderPagination();
    renderActiveFilterChips();
}

function handlePagination(e) {
    if (!e || !e.target || !elements.pagination) return;
    const btn = e.target.closest("[data-action]");
    if (!btn || !elements.pagination.contains(btn) || btn.disabled) return;

    const action = btn.getAttribute("data-action");
    const currentPage = state.pagination.page || 1;
    const totalPages = state.pagination.totalPages || 1;

    if (action === "prev" && currentPage > 1) {
        updateState("pagination.page", currentPage - 1);
        applyFiltersAndPagination();
        renderProducts();
        renderPagination();
    } else if (action === "next" && currentPage < totalPages) {
        updateState("pagination.page", currentPage + 1);
        applyFiltersAndPagination();
        renderProducts();
        renderPagination();
    }
}

/* ==========================================================================
   8. Event Binding
   ========================================================================== */
function bindEvents() {
    if (elements.heroContactBtn) {
        elements.heroContactBtn.addEventListener("click", handleContact);
    }
    if (elements.heroShareBtn) {
        elements.heroShareBtn.addEventListener("click", handleShare);
    }
    if (elements.heroReportBtn) {
        elements.heroReportBtn.addEventListener("click", handleReport);
    }

    if (elements.categoryFilterSelect) {
        elements.categoryFilterSelect.addEventListener("change", handleCategoryFilter);
    }
    if (elements.priceFilterSelect) {
        elements.priceFilterSelect.addEventListener("change", handlePriceFilter);
    }
    if (elements.sortOrderSelect) {
        elements.sortOrderSelect.addEventListener("change", handleSort);
    }

    if (elements.gridViewBtn) {
        elements.gridViewBtn.addEventListener("click", handleViewMode);
    }
    if (elements.listViewBtn) {
        elements.listViewBtn.addEventListener("click", handleViewMode);
    }

    if (elements.toolbarRefreshBtn) {
        elements.toolbarRefreshBtn.addEventListener("click", handleRefresh);
    }
    if (elements.clearFiltersBtn) {
        elements.clearFiltersBtn.addEventListener("click", handleClearFilters);
    }
    if (elements.activeFilterChips) {
        elements.activeFilterChips.addEventListener("click", handleRemoveFilterChip);
    }

    if (elements.pagination) {
        elements.pagination.addEventListener("click", handlePagination);
    }

    if (elements.productsGrid) {
        elements.productsGrid.addEventListener("click", handleFavorite);
    }
}

/* ==========================================================================
   9. DOM Rendering Functions
   ========================================================================== */
function renderHero() {
    const store = state.store || {};
    const storeDisplayName = store.storeName || store.name || "Mağaza";

    if (elements.storeCoverImg) {
        const coverSrc = store.coverUrl || store.cover || DEFAULT_COVER;
        elements.storeCoverImg.src = coverSrc;
        elements.storeCoverImg.alt = `${storeDisplayName} örtük şəkli`;
        elements.storeCoverImg.style.display = "block";
        elements.storeCoverImg.onerror = function() {
            this.onerror = null;
            this.src = DEFAULT_COVER;
        };
    }

    if (elements.storeLogoImg) {
        const logoSrc = store.logoUrl || store.logo || store.owner?.avatar || DEFAULT_AVATAR;
        elements.storeLogoImg.src = logoSrc;
        elements.storeLogoImg.alt = `${storeDisplayName} loqosu`;
        elements.storeLogoImg.style.display = "block";
        elements.storeLogoImg.onerror = function() {
            this.onerror = null;
            this.src = DEFAULT_AVATAR;
        };
    }

    const nameEl = elements.storeName || document.getElementById("storeName") || document.getElementById("store-name");
    if (nameEl) {
        nameEl.textContent = storeDisplayName;
        nameEl.style.color = "#ffffff";
    }

    if (elements.breadcrumbStoreName) {
        elements.breadcrumbStoreName.textContent = storeDisplayName;
    }

    if (elements.storeVerifiedBadge) {
        if (store.isVerified !== false) {
            elements.storeVerifiedBadge.classList.remove("hidden");
            elements.storeVerifiedBadge.textContent = "Təsdiqlənmiş";
        } else {
            elements.storeVerifiedBadge.classList.add("hidden");
        }
    }

    if (elements.storeRatingScore) {
        elements.storeRatingScore.textContent = (store.rating != null && Number(store.rating) > 0) ? Number(store.rating).toFixed(1) : "Yeni";
    }

    if (elements.storeReviewCount) {
        elements.storeReviewCount.textContent = store.reviewCount != null ? `(${store.reviewCount})` : "(0)";
    }

    if (elements.storeMetaLocation) {
        const locationParts = [store.address, store.city].filter(Boolean);
        elements.storeMetaLocation.textContent = locationParts.length > 0 ? locationParts.join(", ") : (store.city || "Bakı");
    }

    if (elements.storeMetaResponse) {
        elements.storeMetaResponse.textContent = store.responseTime || "1 saat ərzində cavab verir";
    }

    if (elements.storeMetaJoined) {
        const joinedDate = store.createdAt ? new Date(store.createdAt) : null;
        if (joinedDate && !isNaN(joinedDate.getTime())) {
            elements.storeMetaJoined.textContent = joinedDate.toLocaleDateString(getActiveLocale());
            elements.storeMetaJoined.setAttribute("datetime", joinedDate.toISOString());
        } else {
            elements.storeMetaJoined.textContent = "2025";
        }
    }
}

function renderStatistics() {
    const store = state.store || {};
    const adsCount = (state.rawProducts && state.rawProducts.length) || store.activeCount || store.adCount || 0;

    if (elements.statRatingValue) {
        const ratingVal = store.rating != null ? Number(store.rating) : 0;
        elements.statRatingValue.textContent = ratingVal > 0 ? ratingVal.toFixed(1) : "Yeni";
    }

    if (elements.statAdsValue) {
        elements.statAdsValue.textContent = String(adsCount);
    }

    if (elements.statFeedbackValue) {
        const reviewsCount = (store.reviewCount != null) ? store.reviewCount : (state.reviews ? state.reviews.length : 0);
        elements.statFeedbackValue.textContent = store.positiveFeedback || (reviewsCount > 0 ? "100%" : "100%");
    }
}

function renderToolbar() {
    const totalCount = state.rawProducts ? state.rawProducts.length : 0;

    if (elements.resultsCount) {
        elements.resultsCount.textContent = String(state.products ? state.products.length : 0);
    }

    if (elements.activeProductsCount) {
        elements.activeProductsCount.textContent = `(${totalCount})`;
    }

    if (elements.categoryFilterSelect && state.rawProducts) {
        const categories = Array.from(new Set(state.rawProducts.map(p => p.category).filter(Boolean))).sort();
        const existingCats = Array.from(elements.categoryFilterSelect.options).slice(1).map(o => o.value);
        const needsRebuild = categories.length !== existingCats.length || categories.some((c, i) => c !== existingCats[i]);

        if (needsRebuild) {
            while (elements.categoryFilterSelect.options.length > 1) {
                elements.categoryFilterSelect.remove(1);
            }

            categories.forEach(cat => {
                const opt = document.createElement("option");
                opt.value = cat;
                opt.textContent = cat;
                if (state.filters.category === cat) {
                    opt.selected = true;
                }
                elements.categoryFilterSelect.appendChild(opt);
            });
        }
    }

    if (elements.priceFilterSelect && elements.priceFilterSelect.options.length <= 1) {
        const ranges = [
            { label: "0 - 500 AZN", value: "0-500" },
            { label: "500 - 1000 AZN", value: "500-1000" },
            { label: "1000+ AZN", value: "1000+" }
        ];
        ranges.forEach(r => {
            const opt = document.createElement("option");
            opt.value = r.value;
            opt.textContent = r.label;
            elements.priceFilterSelect.appendChild(opt);
        });
    }

    if (elements.sortOrderSelect && elements.sortOrderSelect.options.length <= 1) {
        const sortOpts = [
            { label: "Ən köhnələr", value: "oldest" },
            { label: "Qiymət: Ucuzdan bahaya", value: "price_asc" },
            { label: "Qiymət: Bahadan ucuza", value: "price_desc" }
        ];
        sortOpts.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.value;
            opt.textContent = s.label;
            if (state.filters.sort === s.value) {
                opt.selected = true;
            }
            elements.sortOrderSelect.appendChild(opt);
        });
    }
}

function renderProducts() {
    if (!elements.productsGrid || !elements.productCardTemplate) return;

    const products = state.products || [];

    const clones = elements.productsGrid.querySelectorAll(".ad-card:not(#product-card-template)");
    clones.forEach(clone => clone.remove());
    elements.productCardTemplate.classList.add("hidden");

    if (products.length === 0) {
        showEmptyState();
        return;
    }

    hideEmptyState();

    products.forEach(product => {
        const clone = elements.productCardTemplate.cloneNode(true);
        clone.removeAttribute("id");
        clone.classList.remove("hidden");
        clone.setAttribute("data-ad-id", product._id || "");

        const imgEl = clone.querySelector("[data-ad-image]");
        if (imgEl) {
            const imageSrc = product.images && product.images.length > 0 ? product.images[0] : "";
            imgEl.setAttribute("src", imageSrc);
            imgEl.setAttribute("alt", product.title || "Elan şəkli");
        }

        const badgeEl = clone.querySelector("[data-ad-badge]");
        if (badgeEl) {
            if (product.condition) {
                badgeEl.textContent = product.condition;
                badgeEl.classList.remove("hidden");
            } else {
                badgeEl.classList.add("hidden");
            }
        }

        const promoBadgeEl = clone.querySelector("[data-ad-promo-badge]");
        if (promoBadgeEl) {
            if (product.promotionType && product.promotionType !== "none") {
                promoBadgeEl.textContent = product.promotionType;
                promoBadgeEl.classList.remove("hidden");
            } else {
                promoBadgeEl.classList.add("hidden");
            }
        }

        const favBtn = clone.querySelector('[data-action="favorite"]');
        if (favBtn) {
            const adIdStr = String(product._id || "");
            favBtn.setAttribute("data-ad-id", adIdStr);
            const isFaved = Array.isArray(state.userFavorites) && state.userFavorites.includes(adIdStr);
            favBtn.setAttribute("aria-pressed", isFaved.toString());
            favBtn.classList.toggle("active", isFaved);
        }

        const priceEl = clone.querySelector("[data-ad-price]");
        if (priceEl) {
            priceEl.textContent = product.price != null ? String(product.price) : "0";
        }

        const conditionEl = clone.querySelector("[data-ad-condition]");
        if (conditionEl) {
            conditionEl.textContent = product.condition || "";
        }

        const titleEl = clone.querySelector("[data-ad-title]");
        if (titleEl) {
            titleEl.textContent = product.title || "Adsız Elan";
        }

        const titleLink = clone.querySelector("[data-ad-title-link]");
        if (titleLink) {
            titleLink.setAttribute(
                "href",
                product._id
                    ? `elan-detail.html?id=${encodeURIComponent(product._id)}`
                    : "#"
            );
        }

        const storeNameEl = clone.querySelector("[data-ad-store-name]");
        if (storeNameEl) {
            storeNameEl.textContent = (state.store && state.store.storeName) ? state.store.storeName : "";
        }

        const cityEl = clone.querySelector("[data-ad-city]");
        if (cityEl) {
            cityEl.textContent = product.city || "Baku";
        }

        const dateEl = clone.querySelector("[data-ad-date]");
        if (dateEl) {
            if (product.createdAt) {
                const adDate = new Date(product.createdAt);
                dateEl.textContent = !isNaN(adDate.getTime()) ? adDate.toLocaleDateString(getActiveLocale()) : "";
            } else {
                dateEl.textContent = "";
            }
        }

        const viewsEl = clone.querySelector("[data-ad-views-count]");
        if (viewsEl) {
            viewsEl.textContent = product.views != null ? String(product.views) : "0";
        }

        elements.productsGrid.appendChild(clone);
    });
}

function renderActiveFilterChips() {
    if (!elements.activeFilterChips) return;

    elements.activeFilterChips.replaceChildren();

    if (state.filters.category) {
        const chip = document.createElement("span");
        chip.className = "filter-chip";

        const textSpan = document.createElement("span");
        textSpan.textContent = `Kateqoriya: ${state.filters.category}`;

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "chip-remove";
        removeBtn.setAttribute("data-clear-filter", "category");
        removeBtn.setAttribute("aria-label", "Kateqoriya filtrini sil");
        removeBtn.textContent = "×";

        chip.appendChild(textSpan);
        chip.appendChild(removeBtn);
        elements.activeFilterChips.appendChild(chip);
    }

    if (state.filters.price) {
        const chip = document.createElement("span");
        chip.className = "filter-chip";

        const textSpan = document.createElement("span");
        textSpan.textContent = `Qiymət: ${state.filters.price}`;

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "chip-remove";
        removeBtn.setAttribute("data-clear-filter", "price");
        removeBtn.setAttribute("aria-label", "Qiymət filtrini sil");
        removeBtn.textContent = "×";

        chip.appendChild(textSpan);
        chip.appendChild(removeBtn);
        elements.activeFilterChips.appendChild(chip);
    }
}

function renderSidebar() {
    const store = state.store || {};

    const contactContent = document.getElementById("sidebar-contact-content");
    if (contactContent) {
        contactContent.innerHTML = `
            <div class="sidebar-info-row"><i class="fas fa-phone-alt"></i> <span>${store.contactNumber || store.phone || 'Nömrə gizli'}</span></div>
            <div class="sidebar-info-row"><i class="fas fa-map-marker-alt"></i> <span>${[store.address, store.city].filter(Boolean).join(", ") || store.city || 'Bakı'}</span></div>
            <div class="sidebar-info-row"><i class="fas fa-clock"></i> <span>${store.workingHours || 'Hər gün 09:00 - 20:00'}</span></div>
        `;
        if (elements.contactCard) {
            elements.contactCard.classList.remove("hidden");
        }
    }

    const businessContent = document.getElementById("sidebar-business-content");
    if (businessContent) {
        const legalName = (store.businessDetails && store.businessDetails.legalName) || store.storeName || '-';
        const regDate = store.createdAt ? new Date(store.createdAt).toLocaleDateString(getActiveLocale()) : '-';
        businessContent.innerHTML = `
            <div class="sidebar-info-row"><strong>VÖEN:</strong> <span>${store.voen || '-'}</span></div>
            <div class="sidebar-info-row"><strong>Hüquqi ad:</strong> <span>${legalName}</span></div>
            <div class="sidebar-info-row"><strong>Qeydiyyat:</strong> <span>${regDate}</span></div>
        `;
        if (elements.businessCard) {
            elements.businessCard.classList.remove("hidden");
        }
    }

    const hoursContent = document.getElementById("sidebar-hours-content");
    if (hoursContent) {
        hoursContent.innerHTML = `
            <div class="sidebar-info-row"><i class="fas fa-calendar-check"></i> <span>${store.workingHours || 'Hər gün 09:00 - 20:00'}</span></div>
        `;
        if (elements.workingHoursCard) {
            elements.workingHoursCard.classList.remove("hidden");
        }
    }

    const socialContent = document.getElementById("sidebar-social-content");
    if (socialContent) {
        socialContent.replaceChildren();
        if (store.socialLinks && typeof store.socialLinks === "object") {
            const links = store.socialLinks;
            const iconMap = {
                instagram: "fab fa-instagram",
                facebook: "fab fa-facebook",
                whatsapp: "fab fa-whatsapp",
                website: "fas fa-globe"
            };

            Object.keys(links).forEach(key => {
                const rawUrl = links[key];
                if (rawUrl) {
                    if (!isSafeExternalUrl(rawUrl)) return;
                    const linkA = document.createElement("a");
                    linkA.className = "social-link";
                    linkA.setAttribute("href", rawUrl);
                    linkA.setAttribute("target", "_blank");
                    linkA.setAttribute("rel", "noopener noreferrer");

                    const platformKey = key.toLowerCase().trim();
                    const iconClass = iconMap[platformKey] || "fas fa-globe";

                    const iconI = document.createElement("i");
                    iconI.className = iconClass;
                    iconI.setAttribute("aria-hidden", "true");
                    linkA.appendChild(iconI);

                    const textSpan = document.createElement("span");
                    textSpan.textContent = key.charAt(0).toUpperCase() + key.slice(1);
                    linkA.appendChild(textSpan);

                    socialContent.appendChild(linkA);
                }
            });
        }
        if (elements.socialLinksCard) {
            elements.socialLinksCard.classList.toggle("hidden", socialContent.children.length === 0);
        }
    }
}

function renderAbout() {
    const store = state.store;
    if (!store) {
        if (elements.aboutSection) {
            elements.aboutSection.classList.add("hidden");
        }
        return;
    }

    if (elements.storeDescriptionPlaceholder) {
        elements.storeDescriptionPlaceholder.textContent = store.description || "";
        elements.storeDescriptionPlaceholder.classList.toggle("hidden", !store.description);
    }

    if (elements.storeAboutContact) {
        const contactInfo = [store.contactNumber, store.address, store.city].filter(Boolean).join(" | ");
        elements.storeAboutContact.textContent = contactInfo;
        elements.storeAboutContact.classList.toggle("hidden", !contactInfo);
    }

    if (elements.storeWorkingHoursPlaceholder) {
        elements.storeWorkingHoursPlaceholder.textContent = store.workingHours || "";
        elements.storeWorkingHoursPlaceholder.classList.toggle("hidden", !store.workingHours);
    }

    if (elements.aboutSection) {
        const hasContent =
            Boolean(store.description && store.description.trim()) ||
            Boolean(
                [
                    store.contactNumber,
                    store.address,
                    store.city
                ].some(value => value && String(value).trim())
            ) ||
            Boolean(store.workingHours && store.workingHours.trim());

        elements.aboutSection.classList.toggle("hidden", !hasContent);
    }
}

function renderReviews() {
    if (!elements.reviewList) return;

    const reviews = state.reviews || [];
    elements.reviewList.replaceChildren();

    if (reviews.length === 0) {
        if (elements.reviewsSection) {
            elements.reviewsSection.classList.add("hidden");
        }
        return;
    }

    if (elements.reviewsSection) {
        elements.reviewsSection.classList.remove("hidden");
    }

    reviews.forEach(review => {
        const article = document.createElement("article");
        article.className = "review-item";

        const header = document.createElement("div");
        header.className = "review-header";

        const authorName = review.author ? `${review.author.name || ""} ${review.author.lastName || ""}`.trim() : "Anonim";
        const nameSpan = document.createElement("span");
        nameSpan.className = "review-author";
        nameSpan.textContent = authorName || "İstifadəçi";
        header.appendChild(nameSpan);

        const ratingSpan = document.createElement("span");
        ratingSpan.className = "review-rating";
        ratingSpan.textContent = `★ ${review.rating || 0}`;
        header.appendChild(ratingSpan);

        article.appendChild(header);

        if (review.comment) {
            const commentP = document.createElement("p");
            commentP.className = "review-comment";
            commentP.textContent = review.comment;
            article.appendChild(commentP);
        }

        if (review.createdAt) {
            const dateEl = document.createElement("time");
            dateEl.className = "review-date";
            const rDate = new Date(review.createdAt);
            dateEl.textContent = !isNaN(rDate.getTime()) ? rDate.toLocaleDateString(getActiveLocale()) : "";
            article.appendChild(dateEl);
        }

        elements.reviewList.appendChild(article);
    });
}

function renderBranches() {
    if (!elements.branchList || !elements.branchCardTemplate) return;

    const store = state.store;
    const branches = (store && store.branches && Array.isArray(store.branches)) ? store.branches : [];

    elements.branchCardTemplate.classList.add("hidden");

    const clones = elements.branchList.querySelectorAll(".branch-card:not(#branch-card-template)");
    clones.forEach(clone => clone.remove());

    if (branches.length === 0) {
        if (elements.branchesSection) {
            elements.branchesSection.classList.add("hidden");
        }
        return;
    }

    if (elements.branchesSection) {
        elements.branchesSection.classList.remove("hidden");
    }

    branches.forEach(branch => {
        const clone = elements.branchCardTemplate.cloneNode(true);
        clone.removeAttribute("id");
        clone.classList.remove("hidden");

        const nameEl = clone.querySelector("[data-branch-name]");
        if (nameEl) nameEl.textContent = branch.name || "";

        const addrEl = clone.querySelector("[data-branch-address]");
        if (addrEl) addrEl.textContent = branch.address || "";

        const phoneEl = clone.querySelector("[data-branch-phone]");
        if (phoneEl) phoneEl.textContent = branch.phone || "";

        const hoursEl = clone.querySelector("[data-branch-hours]");
        if (hoursEl) hoursEl.textContent = branch.workingHours || "";

        elements.branchList.appendChild(clone);
    });
}

function renderPagination() {
    if (!elements.pagination) return;
    const { page, totalPages } = state.pagination;

    elements.pagination.replaceChildren();

    if (totalPages <= 1) return;

    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "btn btn-pagination";
    prevBtn.setAttribute("data-action", "prev");
    prevBtn.textContent = "Əvvəlki";
    if (page <= 1) prevBtn.disabled = true;

    const infoSpan = document.createElement("span");
    infoSpan.className = "pagination-info";
    infoSpan.textContent = `Səhifə ${page} / ${totalPages}`;

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "btn btn-pagination";
    nextBtn.setAttribute("data-action", "next");
    nextBtn.textContent = "Növbəti";
    if (page >= totalPages) nextBtn.disabled = true;

    elements.pagination.appendChild(prevBtn);
    elements.pagination.appendChild(infoSpan);
    elements.pagination.appendChild(nextBtn);
}

function renderLoading() {
    if (!elements.productsLoading) return;
    elements.productsLoading.replaceChildren();

    const wrapper = document.createElement("div");
    wrapper.className = "products-loading-spinner";

    const icon = document.createElement("i");
    icon.className = "fas fa-circle-notch fa-spin fa-2x";
    icon.setAttribute("aria-hidden", "true");

    const text = document.createElement("span");
    text.textContent = "Elanlar yüklənir...";

    wrapper.appendChild(icon);
    wrapper.appendChild(text);
    elements.productsLoading.appendChild(wrapper);
}

function renderEmptyState(message) {
    if (!elements.productsEmptyState) return;
    elements.productsEmptyState.replaceChildren();

    const wrapper = document.createElement("div");
    wrapper.className = "empty-state";
    wrapper.style.textAlign = "center";
    wrapper.style.padding = "48px 20px";

    const icon = document.createElement("div");
    icon.style.fontSize = "48px";
    icon.style.marginBottom = "12px";
    icon.textContent = "📦";

    const heading = document.createElement("h3");
    heading.style.fontSize = "18px";
    heading.style.fontWeight = "600";
    heading.style.marginBottom = "8px";
    heading.style.color = "var(--sd-text-primary, #111)";
    heading.textContent = "Hələ elan yoxdur";

    const desc = document.createElement("p");
    desc.style.color = "var(--sd-text-secondary, #666)";
    desc.style.fontSize = "14px";
    desc.textContent = message || "Bu mağaza hələ elan yerləşdirməyib";

    wrapper.appendChild(icon);
    wrapper.appendChild(heading);
    wrapper.appendChild(desc);
    elements.productsEmptyState.appendChild(wrapper);

    elements.productsEmptyState.classList.remove("hidden");
    if (elements.productsGrid) {
        elements.productsGrid.style.display = "none";
    }
}

function renderErrorState(message) {
    if (!elements.productsEmptyState) return;
    elements.productsEmptyState.replaceChildren();

    const wrapper = document.createElement("div");
    wrapper.className = "empty-state";
    wrapper.style.textAlign = "center";
    wrapper.style.padding = "48px 20px";

    const icon = document.createElement("div");
    icon.style.fontSize = "48px";
    icon.style.marginBottom = "12px";
    icon.textContent = "🔍";

    const heading = document.createElement("h3");
    heading.style.fontSize = "18px";
    heading.style.fontWeight = "600";
    heading.style.marginBottom = "8px";
    heading.style.color = "var(--sd-text-primary, #111)";
    heading.textContent = "Elanlar yüklənmədi";

    const desc = document.createElement("p");
    desc.style.color = "var(--sd-text-secondary, #666)";
    desc.style.fontSize = "14px";
    desc.style.marginBottom = "16px";
    desc.textContent = message || "Bir az sonra yenidən cəhd edin";

    const retryBtn = document.createElement("button");
    retryBtn.type = "button";
    retryBtn.className = "btn-retry";
    retryBtn.textContent = "Yenidən cəhd et";
    retryBtn.style.padding = "8px 18px";
    retryBtn.style.borderRadius = "8px";
    retryBtn.style.background = "var(--sd-color-primary, #6a1fa0)";
    retryBtn.style.color = "#fff";
    retryBtn.style.border = "none";
    retryBtn.style.cursor = "pointer";
    retryBtn.style.fontWeight = "600";
    retryBtn.onclick = () => {
        const storeId = getStoreId();
        loadStoreListings(storeId);
    };

    wrapper.appendChild(icon);
    wrapper.appendChild(heading);
    wrapper.appendChild(desc);
    wrapper.appendChild(retryBtn);
    elements.productsEmptyState.appendChild(wrapper);

    elements.productsEmptyState.classList.remove("hidden");
    if (elements.productsGrid) {
        elements.productsGrid.style.display = "none";
    }
}

/* ==========================================================================
   10. Initialization
   ========================================================================== */
function initialize() {
    cacheDom();
    bindEvents();
    const storeId = getStoreId();
    loadStorePage(storeId);
}

document.addEventListener("DOMContentLoaded", initialize);

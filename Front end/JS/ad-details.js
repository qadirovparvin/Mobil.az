/* ================================================================
   ad-details.js  —  Mobilim.az Ad Detail Page
   - Fetches real ad data from the backend API
   - Populates all DOM elements with real data
   - ALWAYS reveals the page in finally{} — never stays blank
   ================================================================ */

document.addEventListener('DOMContentLoaded', async () => {
    window.__listingDetailsLoaded = true;

    // ── Helpers (defined first so they're always available) ────────

    function resolveAdDetailsApi() {
        if (window.API_URL) return window.API_URL;
        if (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
            var protocol = (window.location.protocol === 'http:' || !window.location.protocol) ? 'https:' : window.location.protocol;
            return protocol + '//' + (window.location.host || window.location.hostname) + '/api';
        }
        return 'http://localhost:5000/api';
    }
    const API_BASE = resolveAdDetailsApi();
    const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');
    let isStore = false;

    function getImageUrl(image) {
        if (!image) return '';
        if (image.startsWith('http://') || image.startsWith('https://')) return image;
        return API_ORIGIN + image;
    }

    function showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        const msgEl = document.getElementById('toastMsg');
        if (msgEl) msgEl.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function getStarsHtml(rating) {
        let h = '';
        for (let i = 1; i <= 5; i++) {
            h += i <= rating ? '★' : '<span style="color:var(--border-color)">★</span>';
        }
        return h;
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

    function maskPhoneNumber(phone) {
        if (!phone) return '';
        const trimmed = String(phone).trim();
        const digits = trimmed.replace(/\D/g, '');
        if (digits.startsWith('994') && digits.length >= 11) {
            const op = digits.slice(3, 5);
            const last = digits.slice(-2);
            return `+994 ${op} *** ** ${last}`;
        }
        if (digits.startsWith('0') && digits.length >= 9) {
            const op = digits.slice(0, 3);
            const last = digits.slice(-2);
            return `${op} *** ** ${last}`;
        }
        if (digits.length >= 7) {
            const op = trimmed.slice(0, Math.min(6, Math.max(3, Math.floor(trimmed.length * 0.4))));
            const last = trimmed.slice(-2);
            return `${op} *** ** ${last}`;
        }
        return `${trimmed.slice(0, 3)} ***`;
    }

    // ── Always-reveal function (called in finally) ─────────────────
    function revealPage() {
        const skeleton = document.getElementById('elanLoadingSkeleton') || document.getElementById('adLoadingSkeleton');
        const wrapper  = document.getElementById('detailWrapper');
        if (skeleton) skeleton.style.display = 'none';
        if (wrapper)  wrapper.style.visibility = 'visible';
    }

    // ── Show visible error or not found on screen ──────────────────
    let pageRetryCountdown = null;
    function showPageError(msg, isNotFound = false) {
        revealPage();
        const wrapper = document.getElementById('detailWrapper');
        if (!wrapper) return;

        const lang = (localStorage.getItem('lang') || 'AZ').toUpperCase();
        const isEn = lang.includes('EN') || lang.includes('ENG');
        const isRu = lang.includes('RU') || lang.includes('RUS');

        const i18n = {
            errorTitle: isEn ? 'An error occurred' : (isRu ? 'Произошла ошибка' : 'Xəta baş verdi'),
            notFoundTitle: isEn ? 'Ad not found' : (isRu ? 'Объявление не найдено' : 'Elan tapılmadı'),
            notFoundDesc: isEn
                ? 'The ad you are looking for has been deleted, expired, or does not exist.'
                : (isRu ? 'Искомое объявление удалено, срок действия истек или его не существует.' : 'Axtardığınız elan silinmiş, vaxtı bitmiş və ya mövcud olmayan bir ünvandır.'),
            serverErrDesc: isEn
                ? 'Could not connect to the server. The server may be waking up or updating. Please wait a moment.'
                : (isRu ? 'Не удалось подключиться к серверу. Возможно, сервер запускается или обновляется. Пожалуйста, подождите немного.' : 'Serverlə əlaqə qurula bilmədi. Server oyanır və ya yenilənir (Render). Zəhmət olmasa bir neçə saniyə sonra yenidən yoxlayın.'),
            retryBtn: isEn ? 'Try again' : (isRu ? 'Попробовать снова' : 'Yenidən yoxla'),
            backBtn: isEn ? 'Go back' : (isRu ? 'Назад' : 'Geri qayıt'),
            homeBtn: isEn ? 'Home' : (isRu ? 'На главную' : 'Ana Səhifə'),
            breadcrumbError: isEn ? 'Error' : (isRu ? 'Ошибка' : 'Xəta'),
            breadcrumbNotFound: isEn ? 'Not found' : (isRu ? 'Не найдено' : 'Elan tapılmadı'),
            autoRetryMsg: isEn ? 'Automatic retry in ' : (isRu ? 'Автоматическая повторная попытка через ' : 'Avtomatik yenidən yoxlanılır: ')
        };

        const notFound = isNotFound || /tapılmadı|tapilmadi|mövcud deyil|invalid id/i.test(String(msg || ''));
        document.title = notFound ? `${i18n.notFoundTitle} — Mobilim.az` : `${i18n.errorTitle} — Mobilim.az`;

        // Clear breadcrumb to avoid stale placeholders
        const brandBreadcrumb = document.querySelector('.breadcrumb-brand');
        const brandSep = document.querySelector('.breadcrumb-brand-sep');
        const currentBreadcrumb = document.querySelector('.breadcrumb-model') || document.querySelector('.breadcrumb .current');
        if (brandBreadcrumb) brandBreadcrumb.style.display = 'none';
        if (brandSep) brandSep.style.display = 'none';
        if (currentBreadcrumb) currentBreadcrumb.textContent = notFound ? i18n.breadcrumbNotFound : i18n.breadcrumbError;

        if (notFound) {
            wrapper.innerHTML = `
                <div class="detail-error-card">
                    <div class="detail-error-icon-wrap notfound">
                        <i class="fas fa-search" style="font-size:36px;"></i>
                    </div>
                    <h2 class="detail-error-title">${escapeHtml(i18n.notFoundTitle)}</h2>
                    <p class="detail-error-msg">${escapeHtml(i18n.notFoundDesc)}</p>
                    <div class="detail-error-actions">
                        <button type="button" class="detail-btn-back" onclick="window.history.length > 1 ? window.history.back() : window.location.href='index.html'">
                            <i class="fas fa-arrow-left"></i> ${escapeHtml(i18n.backBtn)}
                        </button>
                        <a href="index.html" class="detail-btn-retry">
                            <i class="fas fa-home"></i> ${escapeHtml(i18n.homeBtn)}
                        </a>
                    </div>
                </div>`;
        } else {
            const isNetworkError = /failed to fetch|şəbəkə|network|serverlə əlaqə/i.test(String(msg || ''));
            const displayMsg = isNetworkError ? i18n.serverErrDesc : msg;

            wrapper.innerHTML = `
                <div class="detail-error-card">
                    <div class="detail-error-icon-wrap error">
                        <i class="fas fa-exclamation-triangle" style="font-size:36px;"></i>
                    </div>
                    <h2 class="detail-error-title">${escapeHtml(i18n.errorTitle)}</h2>
                    <p class="detail-error-msg">${escapeHtml(displayMsg)}</p>
                    <div class="detail-error-actions">
                        <button type="button" class="detail-btn-retry" id="detailErrorRetryBtn" onclick="window.location.reload()">
                            <i class="fas fa-sync-alt"></i> ${escapeHtml(i18n.retryBtn)}
                        </button>
                        <a href="index.html" class="detail-btn-home">
                            <i class="fas fa-home"></i> ${escapeHtml(i18n.homeBtn)}
                        </a>
                    </div>
                    ${isNetworkError ? `<div style="margin-top:16px;font-size:13px;color:var(--text-secondary);"><i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i>${escapeHtml(i18n.autoRetryMsg)}<strong id="errorCountdownSec">8</strong>s...</div>` : ''}
                </div>`;

            if (isNetworkError) {
                if (pageRetryCountdown) clearInterval(pageRetryCountdown);
                let count = 8;
                const timerEl = document.getElementById('errorCountdownSec');
                pageRetryCountdown = setInterval(() => {
                    count--;
                    if (timerEl) timerEl.textContent = count;
                    if (count <= 0) {
                        clearInterval(pageRetryCountdown);
                        window.location.reload();
                    }
                }, 1000);
            }
        }
    }

    // ── Read ad ID from URL ─────────────────────────────────────────
    const urlParams = new URLSearchParams(window.location.search);
    const adId   = urlParams.get('id') || urlParams.get('adId') || urlParams.get('adNumber');

    if (!adId) {
        showPageError('Elan tapılmadı', true);
        return;
    }

    // ── Main try/catch/finally ─────────────────────────────────────
    try {

        // ── Fetch the ad with resilient retry ──────────────────────
        let res;
        let fetchErr;
        const maxAttempts = 8;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            // Alternate listings and ads endpoints for 100% adblock immunity
            const endpoint = (attempt % 2 === 1) ? 'listings' : 'ads';
            try {
                res = await fetch(`${API_BASE}/${endpoint}/${encodeURIComponent(adId)}`, {
                    headers: { 'Accept': 'application/json' },
                    silent: true
                });
                // If we got a valid response (not server 502/503/504 restart/cold start), break out
                if (res && res.status < 500) {
                    fetchErr = null;
                    break;
                }
            } catch (err) {
                fetchErr = err;
                res = null;
            }
            if (attempt < maxAttempts) {
                await new Promise(r => setTimeout(r, Math.min(attempt * 1200, 3000)));
            }
        }
        if ((!res || res.status >= 500) && fetchErr) {
            console.error('[ad-details] Fetch network error:', fetchErr);
            throw new Error(`Serverlə əlaqə qurula bilmədi (${fetchErr.message || 'Şəbəkə xətası'}). Zəhmət olmasa bir neçə saniyə sonra yenidən yoxlayın.`);
        }

        let ad;
        try {
            ad = await res.json();
        } catch {
            throw new Error(`Server JSON cavabı parse edilmədi (HTTP ${res ? res.status : 'unknown'})`);
        }

        if (!res.ok) {
            const isNotFound = res.status === 404 || res.status === 400;
            const errMsg = isNotFound ? 'Elan tapılmadı' : (ad?.message || `Server xətası (HTTP ${res.status})`);
            showPageError(errMsg, isNotFound);
            return;
        }
        if (ad && ad.data && typeof ad.data === 'object' && !ad.brand && !ad.modelName) {
            ad = ad.data;
        }
        
        window.__CURRENT_AD = ad;

        // ══════════════════════════════════════════════════════════════════
        // ── MULTILINGUAL I18N SYSTEM (AZ / ENG / RUS) ─────────────────────
        // ══════════════════════════════════════════════════════════════════
        let phoneRevealed = false;
        let cachedReviews = [];
        let cachedRelatedAds = [];

        function getCurrentLang() {
            let l = (localStorage.getItem('lang') || 'AZ').toUpperCase();
            if (l === 'EN') l = 'ENG';
            if (l === 'RU') l = 'RUS';
            if (l !== 'ENG' && l !== 'RUS') l = 'AZ';
            return l;
        }

        function getDateLocale() {
            const lang = getCurrentLang();
            if (lang === 'ENG') return 'en-US';
            if (lang === 'RUS') return 'ru-RU';
            return 'az-AZ';
        }

        const I18N = {
            AZ: {
                views: 'baxış',
                today: 'Bugün',
                noDesc: 'Açıqlama yoxdur.',
                untitledAd: 'Adsız Elan',
                category: 'Kateqoriya',
                brand: 'Marka',
                model: 'Model',
                memory: 'Yaddaş',
                ram: 'RAM',
                screenSize: 'Ekran ölçüsü',
                battery: 'Batareya',
                color: 'Rəng',
                condition: 'Vəziyyəti',
                material: 'Material',
                glassType: 'Qoruyucu növü',
                connectionType: 'Qoşulma növü',
                headphoneType: 'Qulaqlıq forması',
                power: 'Çıxış gücü',
                portType: 'Port növü',
                cableType: 'Kabel növü',
                cableLength: 'Uzunluq',
                info: 'Məlumat',
                loading: 'Yüklənir...',
                yes: 'Bəli',
                no: 'Xeyr',
                hasDelivery: 'Var',
                noDelivery: 'Yoxdur',
                varCheck: '✓ Var',
                userFallback: 'İstifadəçi',
                
                catPhone: 'Telefon',
                catTablet: 'Planşet',
                catHeadphones: 'Qulaqlıqlar',
                catAccessories: 'Aksesuarlar',
                
                condNew: 'Yeni',
                condUsed: 'İşlənmiş',
                
                featNfc: 'NFC',
                featWaterproof: 'Suya davamlılıq',
                featWaterproofChip: 'Suya davamlı',
                featFingerprint: 'Barmaq izi',
                featMagsafe: 'MagSafe dəstəyi',
                featAnc: 'Aktiv Küyboğma (ANC)',
                featMicrophone: 'Mikrofon',
                featFastCharge: 'Sürətli şarj',
                featWirelessCharge: 'Simsiz şarj',
                featOleophobic: 'Oleofobik örtük',
                featStylus: 'Stylus / Qələm',
                featSimCard: 'SIM kart (4G/5G)',
                featExpandable: 'Əlavə yaddaş kartı',
                featExpandableChip: 'Yaddaş kartı dəstəyi',
                featDelivery: 'Çatdırılma',
                
                personalAccount: 'Şəxsi hesab',
                storeAccount: 'Mağaza',
                officialStore: 'Rəsmi Mağaza',
                showNumber: 'Nömrəni Göstər',
                revealHint: '(Göstər)',
                clickToCall: 'Zəng etmək üçün klikləyin',
                clickToReveal: 'Nömrəni görmək üçün toxunun',
                chatOnWhatsapp: 'WhatsApp ilə Yazın',
                sendMessage: 'Mesaj Göndər',
                viewStore: 'Mağazaya bax',
                memberSince: 'Üzv olub:',
                rating: 'Reytinq',
                reviews: 'Rəy',
                reviewCountBased: 'rəy əsasında',
                allSellerReviews: 'Bu satıcının bütün rəyləri',
                noReviewsTitle: 'Bu satıcı üçün hələ rəy yoxdur. İlk rəyi siz yazın!',
                editAd: 'Düzəliş Et',
                deleteAd: 'Elanı Sil',
                deleteConfirm: 'Bu elanı silmək istədiyinizə əminsiniz?',
                deleteSuccess: 'Elan silindi!',
                deleteError: 'Silinmə zamanı xəta oldu.',
                loginToMessage: 'Mesaj yazmaq üçün sistemə daxil olun!',
                loginToReview: 'Rəy yazmaq üçün daxil olun!',
                selectRating: 'Zəhmət olmasa reytinq seçin (ulduz)',
                sending: 'Göndərilir...',
                reviewSuccess: 'Rəy uğurla əlavə edildi!',
                reviewError: 'Xəta baş verdi',
                networkError: 'Şəbəkə xətası baş verdi.',
                
                relatedTitle: 'Oxşar Elanlar',
                badgePersonal: 'Şəxsi',
                badgeStore: 'Mağaza',
                
                adNumberLabel: 'Elan №:',
                postedLabel: 'Yerləşdirildi:',
                updatedLabel: 'Yeniləndi:'
            },
            ENG: {
                views: 'views',
                today: 'Today',
                noDesc: 'No description provided.',
                untitledAd: 'Untitled Listing',
                category: 'Category',
                brand: 'Brand',
                model: 'Model',
                memory: 'Storage',
                ram: 'RAM',
                screenSize: 'Screen Size',
                battery: 'Battery',
                color: 'Color',
                condition: 'Condition',
                material: 'Material',
                glassType: 'Protection Type',
                connectionType: 'Connection Type',
                headphoneType: 'Headphone Type',
                power: 'Power Output',
                portType: 'Port Type',
                cableType: 'Cable Type',
                cableLength: 'Length',
                info: 'Information',
                loading: 'Loading...',
                yes: 'Yes',
                no: 'No',
                hasDelivery: 'Available',
                noDelivery: 'Not available',
                varCheck: '✓ Yes',
                userFallback: 'User',
                
                catPhone: 'Phones',
                catTablet: 'Tablets',
                catHeadphones: 'Headphones',
                catAccessories: 'Accessories',
                
                condNew: 'New',
                condUsed: 'Used',
                
                featNfc: 'NFC',
                featWaterproof: 'Water Resistance',
                featWaterproofChip: 'Waterproof',
                featFingerprint: 'Fingerprint',
                featMagsafe: 'MagSafe Support',
                featAnc: 'Active Noise Cancellation (ANC)',
                featMicrophone: 'Microphone',
                featFastCharge: 'Fast Charging',
                featWirelessCharge: 'Wireless Charging',
                featOleophobic: 'Oleophobic Coating',
                featStylus: 'Stylus Support',
                featSimCard: 'SIM Card (4G/5G)',
                featExpandable: 'MicroSD Card Slot',
                featExpandableChip: 'MicroSD Support',
                featDelivery: 'Delivery',
                
                personalAccount: 'Personal account',
                storeAccount: 'Store',
                officialStore: 'Official Store',
                showNumber: 'Show Number',
                revealHint: '(Show)',
                clickToCall: 'Click to call',
                clickToReveal: 'Click to show phone number',
                chatOnWhatsapp: 'Chat on WhatsApp',
                sendMessage: 'Send Message',
                viewStore: 'View store',
                memberSince: 'Member since:',
                rating: 'Rating',
                reviews: 'Reviews',
                reviewCountBased: 'based on reviews',
                allSellerReviews: 'All reviews for this seller',
                noReviewsTitle: 'No reviews yet for this seller. Be the first to write one!',
                editAd: 'Edit Listing',
                deleteAd: 'Delete Listing',
                deleteConfirm: 'Are you sure you want to delete this listing?',
                deleteSuccess: 'Listing deleted!',
                deleteError: 'Error occurred while deleting.',
                loginToMessage: 'Please log in to send a message!',
                loginToReview: 'Please log in to write a review!',
                selectRating: 'Please select a rating (stars)',
                sending: 'Sending...',
                reviewSuccess: 'Review added successfully!',
                reviewError: 'An error occurred',
                networkError: 'Network error occurred.',
                
                relatedTitle: 'Similar Ads',
                badgePersonal: 'Personal',
                badgeStore: 'Store',
                
                adNumberLabel: 'Listing №:',
                postedLabel: 'Posted:',
                updatedLabel: 'Updated:'
            },
            RUS: {
                views: 'просмотров',
                today: 'Сегодня',
                noDesc: 'Описание отсутствует.',
                untitledAd: 'Объявление без названия',
                category: 'Категория',
                brand: 'Марка',
                model: 'Модель',
                memory: 'Память',
                ram: 'ОЗУ',
                screenSize: 'Размер экрана',
                battery: 'Аккумулятор',
                color: 'Цвет',
                condition: 'Состояние',
                material: 'Материал',
                glassType: 'Тип покрытия',
                connectionType: 'Тип подключения',
                headphoneType: 'Тип наушников',
                power: 'Выходная мощность',
                portType: 'Тип порта',
                cableType: 'Тип кабеля',
                cableLength: 'Длина',
                info: 'Информация',
                loading: 'Загрузка...',
                yes: 'Да',
                no: 'Нет',
                hasDelivery: 'Есть',
                noDelivery: 'Нет',
                varCheck: '✓ Есть',
                userFallback: 'Пользователь',
                
                catPhone: 'Телефоны',
                catTablet: 'Планшеты',
                catHeadphones: 'Наушники',
                catAccessories: 'Аксессуары',
                
                condNew: 'Новый',
                condUsed: 'Б/У',
                
                featNfc: 'NFC',
                featWaterproof: 'Водозащита',
                featWaterproofChip: 'Водонепроницаемый',
                featFingerprint: 'Отпечаток пальца',
                featMagsafe: 'Поддержка MagSafe',
                featAnc: 'Активное шумоподавление (ANC)',
                featMicrophone: 'Микрофон',
                featFastCharge: 'Быстрая зарядка',
                featWirelessCharge: 'Беспроводная зарядка',
                featOleophobic: 'Олеофобное покрытие',
                featStylus: 'Стилус',
                featSimCard: 'SIM-карта (4G/5G)',
                featExpandable: 'Слот для карты памяти',
                featExpandableChip: 'Поддержка карт памяти',
                featDelivery: 'Доставка',
                
                personalAccount: 'Частное лицо',
                storeAccount: 'Магазин',
                officialStore: 'Официальный магазин',
                showNumber: 'Показать номер',
                revealHint: '(Показать)',
                clickToCall: 'Нажмите, чтобы позвонить',
                clickToReveal: 'Нажмите, чтобы увидеть номер',
                chatOnWhatsapp: 'Написать в WhatsApp',
                sendMessage: 'Отправить сообщение',
                viewStore: 'В магазин',
                memberSince: 'На сайте с:',
                rating: 'Рейтинг',
                reviews: 'Отзывы',
                reviewCountBased: 'на основе отзывов',
                allSellerReviews: 'Все отзывы о продавце',
                noReviewsTitle: 'У этого продавца пока нет отзывов. Будьте первым!',
                editAd: 'Редактировать',
                deleteAd: 'Удалить объявление',
                deleteConfirm: 'Вы уверены, что хотите удалить это объявление?',
                deleteSuccess: 'Объявление удалено!',
                deleteError: 'Произошла ошибка при удалении.',
                loginToMessage: 'Войдите, чтобы отправить сообщение!',
                loginToReview: 'Войдите, чтобы оставить отзыв!',
                selectRating: 'Пожалуйста, выберите рейтинг (звезды)',
                sending: 'Отправка...',
                reviewSuccess: 'Отзыв успешно добавлен!',
                reviewError: 'Произошла ошибка',
                networkError: 'Ошибка сети.',
                
                relatedTitle: 'Похожие объявления',
                badgePersonal: 'Частное',
                badgeStore: 'Магазин',
                
                adNumberLabel: 'Номер объявления:',
                postedLabel: 'Опубликовано:',
                updatedLabel: 'Обновлено:'
            }
        };

        function getI18n() {
            const lang = getCurrentLang();
            return I18N[lang] || I18N.AZ;
        }

        const CITY_MAP = {
            'baki': { AZ: 'Bakı', ENG: 'Baku', RUS: 'Баку' },
            'baku': { AZ: 'Bakı', ENG: 'Baku', RUS: 'Баку' },
            'баку': { AZ: 'Bakı', ENG: 'Baku', RUS: 'Баку' },
            'sumqayit': { AZ: 'Sumqayıt', ENG: 'Sumqayit', RUS: 'Сумгаит' },
            'sumqayıt': { AZ: 'Sumqayıt', ENG: 'Sumqayit', RUS: 'Сумгаит' },
            'сумгаит': { AZ: 'Sumqayıt', ENG: 'Sumqayit', RUS: 'Сумгаит' },
            'ganja': { AZ: 'Gəncə', ENG: 'Ganja', RUS: 'Гянджа' },
            'gəncə': { AZ: 'Gəncə', ENG: 'Ganja', RUS: 'Гянджа' },
            'гянджа': { AZ: 'Gəncə', ENG: 'Ganja', RUS: 'Гянджа' },
            'absheron': { AZ: 'Abşeron', ENG: 'Absheron', RUS: 'Апшерон' },
            'abşeron': { AZ: 'Abşeron', ENG: 'Absheron', RUS: 'Апшерон' },
            'апшерон': { AZ: 'Abşeron', ENG: 'Absheron', RUS: 'Апшерон' },
            'agcabedi': { AZ: 'Ağcabədi', ENG: 'Agcabedi', RUS: 'Агджабеди' },
            'ağcabədi': { AZ: 'Ağcabədi', ENG: 'Agcabedi', RUS: 'Агджабеди' },
            'agdam': { AZ: 'Ağdam', ENG: 'Agdam', RUS: 'Агдам' },
            'ağdam': { AZ: 'Ağdam', ENG: 'Agdam', RUS: 'Агдам' },
            'agdash': { AZ: 'Ağdaş', ENG: 'Agdash', RUS: 'Агдаш' },
            'ağdaş': { AZ: 'Ağdaş', ENG: 'Agdash', RUS: 'Агдаш' },
            'agstafa': { AZ: 'Ağstafa', ENG: 'Agstafa', RUS: 'Агстафа' },
            'ağstafa': { AZ: 'Ağstafa', ENG: 'Agstafa', RUS: 'Агстафа' },
            'agsu': { AZ: 'Ağsu', ENG: 'Agsu', RUS: 'Агсу' },
            'ağsu': { AZ: 'Ağsu', ENG: 'Agsu', RUS: 'Агсу' },
            'astara': { AZ: 'Astara', ENG: 'Astara', RUS: 'Астара' },
            'balakan': { AZ: 'Balakən', ENG: 'Balakan', RUS: 'Балакен' },
            'balakən': { AZ: 'Balakən', ENG: 'Balakan', RUS: 'Балакен' },
            'barda': { AZ: 'Bərdə', ENG: 'Barda', RUS: 'Барда' },
            'bərdə': { AZ: 'Bərdə', ENG: 'Barda', RUS: 'Барда' },
            'beylagan': { AZ: 'Beyləqan', ENG: 'Beylagan', RUS: 'Бейлаган' },
            'beyləqan': { AZ: 'Beyləqan', ENG: 'Beylagan', RUS: 'Бейлаган' },
            'bilasuvar': { AZ: 'Biləsuvar', ENG: 'Bilasuvar', RUS: 'Билясувар' },
            'biləsuvar': { AZ: 'Biləsuvar', ENG: 'Bilasuvar', RUS: 'Билясувар' },
            'dashkasan': { AZ: 'Daşkəsən', ENG: 'Dashkasan', RUS: 'Дашкесан' },
            'daşkəsən': { AZ: 'Daşkəsən', ENG: 'Dashkasan', RUS: 'Дашкесан' },
            'fuzuli': { AZ: 'Füzuli', ENG: 'Fuzuli', RUS: 'Физули' },
            'füzuli': { AZ: 'Füzuli', ENG: 'Fuzuli', RUS: 'Физули' },
            'gadabay': { AZ: 'Gədəbəy', ENG: 'Gadabay', RUS: 'Гедабек' },
            'gədəbəy': { AZ: 'Gədəbəy', ENG: 'Gadabay', RUS: 'Гедабек' },
            'goranboy': { AZ: 'Goranboy', ENG: 'Goranboy', RUS: 'Геранбой' },
            'goychay': { AZ: 'Göyçay', ENG: 'Goychay', RUS: 'Геокчай' },
            'göyçay': { AZ: 'Göyçay', ENG: 'Goychay', RUS: 'Геокчай' },
            'goygol': { AZ: 'Göygöl', ENG: 'Goygol', RUS: 'Гёйгёль' },
            'göygöl': { AZ: 'Göygöl', ENG: 'Goygol', RUS: 'Гёйгёль' },
            'hajigabul': { AZ: 'Hacıqabul', ENG: 'Hajigabul', RUS: 'Гаджигабул' },
            'hacıqabul': { AZ: 'Hacıqabul', ENG: 'Hajigabul', RUS: 'Гаджигабул' },
            'khachmaz': { AZ: 'Xaçmaz', ENG: 'Khachmaz', RUS: 'Хачмаз' },
            'xaçmaz': { AZ: 'Xaçmaz', ENG: 'Khachmaz', RUS: 'Хачмаз' },
            'khankendi': { AZ: 'Xankəndi', ENG: 'Khankendi', RUS: 'Ханкенди' },
            'xankəndi': { AZ: 'Xankəndi', ENG: 'Khankendi', RUS: 'Ханкенди' },
            'khizi': { AZ: 'Xızı', ENG: 'Khizi', RUS: 'Хызы' },
            'xızı': { AZ: 'Xızı', ENG: 'Khizi', RUS: 'Хызы' },
            'imishli': { AZ: 'İmişli', ENG: 'Imishli', RUS: 'Имишли' },
            'imişli': { AZ: 'İmişli', ENG: 'Imishli', RUS: 'Имишли' },
            'ismayilli': { AZ: 'İsmayıllı', ENG: 'Ismayilli', RUS: 'Исмаиллы' },
            'ismayıllı': { AZ: 'İsmayıllı', ENG: 'Ismayilli', RUS: 'Исмаиллы' },
            'jabrayil': { AZ: 'Cəbrayıl', ENG: 'Jabrayil', RUS: 'Джебраил' },
            'cəbrayıl': { AZ: 'Cəbrayıl', ENG: 'Jabrayil', RUS: 'Джебраил' },
            'jalilabad': { AZ: 'Cəlilabad', ENG: 'Jalilabad', RUS: 'Джалилабад' },
            'cəlilabad': { AZ: 'Cəlilabad', ENG: 'Jalilabad', RUS: 'Джалилабад' },
            'kalbajar': { AZ: 'Kəlbəcər', ENG: 'Kalbajar', RUS: 'Кельбаджар' },
            'kəlbəcər': { AZ: 'Kəlbəcər', ENG: 'Kalbajar', RUS: 'Кельбаджар' },
            'kurdamir': { AZ: 'Kürdəmir', ENG: 'Kurdamir', RUS: 'Кюрдамир' },
            'kürdəmir': { AZ: 'Kürdəmir', ENG: 'Kurdamir', RUS: 'Кюрдамир' },
            'lachin': { AZ: 'Laçın', ENG: 'Lachin', RUS: 'Лачин' },
            'laçın': { AZ: 'Laçın', ENG: 'Lachin', RUS: 'Лачин' },
            'lankaran': { AZ: 'Lənkəran', ENG: 'Lankaran', RUS: 'Ленкорань' },
            'lənkəran': { AZ: 'Lənkəran', ENG: 'Lankaran', RUS: 'Ленкорань' },
            'lerik': { AZ: 'Lerik', ENG: 'Lerik', RUS: 'Лерик' },
            'masalli': { AZ: 'Masallı', ENG: 'Masalli', RUS: 'Масаллы' },
            'masallı': { AZ: 'Masallı', ENG: 'Masalli', RUS: 'Масаллы' },
            'mingachevir': { AZ: 'Mingəçevir', ENG: 'Mingachevir', RUS: 'Мингечевир' },
            'mingəçevir': { AZ: 'Mingəçevir', ENG: 'Mingachevir', RUS: 'Мингечевир' },
            'naftalan': { AZ: 'Naftalan', ENG: 'Naftalan', RUS: 'Нафталан' },
            'nakhchivan': { AZ: 'Naxçıvan', ENG: 'Nakhchivan', RUS: 'Нахчыван' },
            'naxçıvan': { AZ: 'Naxçıvan', ENG: 'Nakhchivan', RUS: 'Нахчыван' },
            'neftchala': { AZ: 'Neftçala', ENG: 'Neftchala', RUS: 'Нефтечала' },
            'neftçala': { AZ: 'Neftçala', ENG: 'Neftchala', RUS: 'Нефтечала' },
            'oguz': { AZ: 'Oğuz', ENG: 'Oguz', RUS: 'Огуз' },
            'oğuz': { AZ: 'Oğuz', ENG: 'Oguz', RUS: 'Огуз' },
            'qabala': { AZ: 'Qəbələ', ENG: 'Qabala', RUS: 'Габала' },
            'qəbələ': { AZ: 'Qəbələ', ENG: 'Qabala', RUS: 'Габала' },
            'qakh': { AZ: 'Qax', ENG: 'Qakh', RUS: 'Гах' },
            'qax': { AZ: 'Qax', ENG: 'Qakh', RUS: 'Гах' },
            'qazakh': { AZ: 'Qazax', ENG: 'Qazakh', RUS: 'Газах' },
            'qazax': { AZ: 'Qazax', ENG: 'Qazakh', RUS: 'Газах' },
            'qobustan': { AZ: 'Qobustan', ENG: 'Gobustan', RUS: 'Гобустан' },
            'quba': { AZ: 'Quba', ENG: 'Quba', RUS: 'Губа' },
            'qubadli': { AZ: 'Qubadlı', ENG: 'Qubadli', RUS: 'Губадлы' },
            'qubadlı': { AZ: 'Qubadlı', ENG: 'Qubadli', RUS: 'Губадлы' },
            'qusar': { AZ: 'Qusar', ENG: 'Qusar', RUS: 'Гусар' },
            'saatli': { AZ: 'Saatlı', ENG: 'Saatli', RUS: 'Саатлы' },
            'saatlı': { AZ: 'Saatlı', ENG: 'Saatli', RUS: 'Саатлы' },
            'sabirabad': { AZ: 'Sabirabad', ENG: 'Sabirabad', RUS: 'Сабирабад' },
            'salyan': { AZ: 'Salyan', ENG: 'Salyan', RUS: 'Сальян' },
            'shabran': { AZ: 'Şabran', ENG: 'Shabran', RUS: 'Шабран' },
            'şabran': { AZ: 'Şabran', ENG: 'Shabran', RUS: 'Шабран' },
            'shaki': { AZ: 'Şəki', ENG: 'Shaki', RUS: 'Шеки' },
            'şəki': { AZ: 'Şəki', ENG: 'Shaki', RUS: 'Шеки' },
            'shamakhi': { AZ: 'Şamaxı', ENG: 'Shamakhi', RUS: 'Шамаха' },
            'şamaxı': { AZ: 'Şamaxı', ENG: 'Shamakhi', RUS: 'Шамаха' },
            'shamkir': { AZ: 'Şəmkir', ENG: 'Shamkir', RUS: 'Шамкир' },
            'şəmkir': { AZ: 'Şəmkir', ENG: 'Shamkir', RUS: 'Шамкир' },
            'shirvan': { AZ: 'Şirvan', ENG: 'Shirvan', RUS: 'Ширван' },
            'şirvan': { AZ: 'Şirvan', ENG: 'Shirvan', RUS: 'Ширван' },
            'shusha': { AZ: 'Şuşa', ENG: 'Shusha', RUS: 'Шуша' },
            'şuşa': { AZ: 'Şuşa', ENG: 'Shusha', RUS: 'Шуша' },
            'siazan': { AZ: 'Siyəzən', ENG: 'Siazan', RUS: 'Сиязань' },
            'siyəzən': { AZ: 'Siyəzən', ENG: 'Siazan', RUS: 'Сиязань' },
            'tartar': { AZ: 'Tərtər', ENG: 'Tartar', RUS: 'Тертер' },
            'tərtər': { AZ: 'Tərtər', ENG: 'Tartar', RUS: 'Тертер' },
            'tovuz': { AZ: 'Tovuz', ENG: 'Tovuz', RUS: 'Товуз' },
            'ujar': { AZ: 'Ucar', ENG: 'Ujar', RUS: 'Уджар' },
            'ucar': { AZ: 'Ucar', ENG: 'Ujar', RUS: 'Уджар' },
            'yardimli': { AZ: 'Yardımlı', ENG: 'Yardimli', RUS: 'Ярдымлы' },
            'yardımlı': { AZ: 'Yardımlı', ENG: 'Yardimli', RUS: 'Ярдымлы' },
            'yevlakh': { AZ: 'Yevlax', ENG: 'Yevlakh', RUS: 'Евлах' },
            'yevlax': { AZ: 'Yevlax', ENG: 'Yevlakh', RUS: 'Евлах' },
            'zangilan': { AZ: 'Zəngilan', ENG: 'Zangilan', RUS: 'Зангилан' },
            'zəngilan': { AZ: 'Zəngilan', ENG: 'Zangilan', RUS: 'Зангилан' },
            'zaqatala': { AZ: 'Zaqatala', ENG: 'Zaqatala', RUS: 'Загатала' },
            'zardab': { AZ: 'Zərdab', ENG: 'Zardab', RUS: 'Зардоб' },
            'zərdab': { AZ: 'Zərdab', ENG: 'Zardab', RUS: 'Зардоб' }
        };

        function formatCity(cityName) {
            if (!cityName) return '';
            const raw = String(cityName).trim();
            const lower = raw.toLowerCase();
            const lang = getCurrentLang();
            if (CITY_MAP[lower]) {
                return CITY_MAP[lower][lang] || CITY_MAP[lower].AZ;
            }
            for (const mapping of Object.values(CITY_MAP)) {
                if (mapping.AZ.toLowerCase() === lower || mapping.ENG.toLowerCase() === lower || mapping.RUS.toLowerCase() === lower) {
                    return mapping[lang] || mapping.AZ;
                }
            }
            return raw;
        }

        const COLOR_MAP = {
            'black': { AZ: 'Qara', ENG: 'Black', RUS: 'Черный' },
            'qara': { AZ: 'Qara', ENG: 'Black', RUS: 'Черный' },
            'черный': { AZ: 'Qara', ENG: 'Black', RUS: 'Черный' },
            'white': { AZ: 'Ağ', ENG: 'White', RUS: 'Белый' },
            'ag': { AZ: 'Ağ', ENG: 'White', RUS: 'Белый' },
            'ağ': { AZ: 'Ağ', ENG: 'White', RUS: 'Белый' },
            'белый': { AZ: 'Ağ', ENG: 'White', RUS: 'Белый' },
            'gold': { AZ: 'Qızılı', ENG: 'Gold', RUS: 'Золотой' },
            'qizili': { AZ: 'Qızılı', ENG: 'Gold', RUS: 'Золотой' },
            'qızılı': { AZ: 'Qızılı', ENG: 'Gold', RUS: 'Золотой' },
            'золотой': { AZ: 'Qızılı', ENG: 'Gold', RUS: 'Золотой' },
            'silver': { AZ: 'Gümüşü', ENG: 'Silver', RUS: 'Серебристый' },
            'gumusu': { AZ: 'Gümüşü', ENG: 'Silver', RUS: 'Серебристый' },
            'gümüşü': { AZ: 'Gümüşü', ENG: 'Silver', RUS: 'Серебристый' },
            'серебристый': { AZ: 'Gümüşü', ENG: 'Silver', RUS: 'Серебристый' },
            'grey': { AZ: 'Boz', ENG: 'Grey', RUS: 'Серый' },
            'gray': { AZ: 'Boz', ENG: 'Gray', RUS: 'Серый' },
            'boz': { AZ: 'Boz', ENG: 'Grey', RUS: 'Серый' },
            'серый': { AZ: 'Boz', ENG: 'Grey', RUS: 'Серый' },
            'graphite': { AZ: 'Qrafit', ENG: 'Graphite', RUS: 'Графит' },
            'qrafit': { AZ: 'Qrafit', ENG: 'Graphite', RUS: 'Графит' },
            'графит': { AZ: 'Qrafit', ENG: 'Graphite', RUS: 'Графит' },
            'blue': { AZ: 'Mavi', ENG: 'Blue', RUS: 'Синий' },
            'mavi': { AZ: 'Mavi', ENG: 'Blue', RUS: 'Синий' },
            'göy': { AZ: 'Göy', ENG: 'Blue', RUS: 'Синий' },
            'goy': { AZ: 'Göy', ENG: 'Blue', RUS: 'Синий' },
            'синий': { AZ: 'Mavi', ENG: 'Blue', RUS: 'Синий' },
            'голубой': { AZ: 'Mavi', ENG: 'Light Blue', RUS: 'Голубой' },
            'darkblue': { AZ: 'Göy (Tünd Mavi)', ENG: 'Dark Blue', RUS: 'Темно-синий' },
            'green': { AZ: 'Yaşıl', ENG: 'Green', RUS: 'Зеленый' },
            'yasil': { AZ: 'Yaşıl', ENG: 'Green', RUS: 'Зеленый' },
            'yaşıl': { AZ: 'Yaşıl', ENG: 'Green', RUS: 'Зеленый' },
            'зеленый': { AZ: 'Yaşıl', ENG: 'Green', RUS: 'Зеленый' },
            'emerald': { AZ: 'Zümrüd Yaşılı', ENG: 'Emerald Green', RUS: 'Изумрудно-зеленый' },
            'yellow': { AZ: 'Sarı', ENG: 'Yellow', RUS: 'Желтый' },
            'sari': { AZ: 'Sarı', ENG: 'Yellow', RUS: 'Желтый' },
            'sarı': { AZ: 'Sarı', ENG: 'Yellow', RUS: 'Желтый' },
            'желтый': { AZ: 'Sarı', ENG: 'Yellow', RUS: 'Желтый' },
            'red': { AZ: 'Qırmızı', ENG: 'Red', RUS: 'Красный' },
            'qirmizi': { AZ: 'Qırmızı', ENG: 'Red', RUS: 'Красный' },
            'qırmızı': { AZ: 'Qırmızı', ENG: 'Red', RUS: 'Красный' },
            'красный': { AZ: 'Qırmızı', ENG: 'Red', RUS: 'Красный' },
            'pink': { AZ: 'Çəhrayı', ENG: 'Pink', RUS: 'Розовый' },
            'cehrayi': { AZ: 'Çəhrayı', ENG: 'Pink', RUS: 'Розовый' },
            'çəhrayı': { AZ: 'Çəhrayı', ENG: 'Pink', RUS: 'Розовый' },
            'розовый': { AZ: 'Çəhrayı', ENG: 'Pink', RUS: 'Розовый' },
            'purple': { AZ: 'Bənövşəyi', ENG: 'Purple', RUS: 'Фиолетовый' },
            'benovseyi': { AZ: 'Bənövşəyi', ENG: 'Purple', RUS: 'Фиолетовый' },
            'bənövşəyi': { AZ: 'Bənövşəyi', ENG: 'Purple', RUS: 'Фиолетовый' },
            'фиолетовый': { AZ: 'Bənövşəyi', ENG: 'Purple', RUS: 'Фиолетовый' },
            'deeppurple': { AZ: 'Dərin Bənövşəyi', ENG: 'Deep Purple', RUS: 'Темно-фиолетовый' },
            'orange': { AZ: 'Narıncı', ENG: 'Orange', RUS: 'Оранжевый' },
            'narinci': { AZ: 'Narıncı', ENG: 'Orange', RUS: 'Оранжевый' },
            'narıncı': { AZ: 'Narıncı', ENG: 'Orange', RUS: 'Оранжевый' },
            'оранжевый': { AZ: 'Narıncı', ENG: 'Orange', RUS: 'Оранжевый' },
            'titanium-black': { AZ: 'Titan Qara', ENG: 'Black Titanium', RUS: 'Черный титан' },
            'titanium-natural': { AZ: 'Titan Təbii', ENG: 'Natural Titanium', RUS: 'Натуральный титан' },
            'titanium-white': { AZ: 'Titan Ağ', ENG: 'White Titanium', RUS: 'Белый титан' },
            'titanium-blue': { AZ: 'Titan Göy', ENG: 'Blue Titanium', RUS: 'Синий титан' },
            'bronze': { AZ: 'Bürünc', ENG: 'Bronze', RUS: 'Бронзовый' },
            'bürünc': { AZ: 'Bürünc', ENG: 'Bronze', RUS: 'Бронзовый' },
            'бронзовый': { AZ: 'Bürünc', ENG: 'Bronze', RUS: 'Бронзовый' },
            'beige': { AZ: 'Bej', ENG: 'Beige', RUS: 'Бежевый' },
            'bej': { AZ: 'Bej', ENG: 'Beige', RUS: 'Бежевый' },
            'бежевый': { AZ: 'Bej', ENG: 'Beige', RUS: 'Бежевый' },
            'brown': { AZ: 'Qəhvəyi', ENG: 'Brown', RUS: 'Коричневый' },
            'qəhvəyi': { AZ: 'Qəhvəyi', ENG: 'Brown', RUS: 'Коричневый' },
            'коричневый': { AZ: 'Qəhvəyi', ENG: 'Brown', RUS: 'Коричневый' },
            'transparent': { AZ: 'Şəffaf', ENG: 'Transparent', RUS: 'Прозрачный' },
            'seffaf': { AZ: 'Şəffaf', ENG: 'Transparent', RUS: 'Прозрачный' },
            'şəffaf': { AZ: 'Şəffaf', ENG: 'Transparent', RUS: 'Прозрачный' },
            'прозрачный': { AZ: 'Şəffaf', ENG: 'Transparent', RUS: 'Прозрачный' },
            'other': { AZ: 'Digər', ENG: 'Other', RUS: 'Другой' },
            'diger': { AZ: 'Digər', ENG: 'Other', RUS: 'Другой' },
            'digər': { AZ: 'Digər', ENG: 'Other', RUS: 'Другой' },
            'другой': { AZ: 'Digər', ENG: 'Other', RUS: 'Другой' }
        };

        function formatColorName(val) {
            if (!val) return '';
            const key = String(val).trim().toLowerCase();
            const lang = getCurrentLang();
            if (COLOR_MAP[key]) {
                return COLOR_MAP[key][lang] || COLOR_MAP[key].AZ;
            }
            for (const item of Object.values(COLOR_MAP)) {
                if (item.AZ.toLowerCase() === key || item.ENG.toLowerCase() === key || item.RUS.toLowerCase() === key) {
                    return item[lang] || item.AZ;
                }
            }
            return String(val).trim();
        }

        function formatCategory(val) {
            if (!val) return '';
            const s = String(val).trim().toLowerCase();
            const lang = getCurrentLang();
            const t = I18N[lang] || I18N.AZ;
            if (s.includes('telefon') || s.includes('phone') || s.includes('smartfon') || s.includes('смартфон')) {
                return t.catPhone;
            }
            if (s.includes('planşet') || s.includes('planset') || s.includes('tablet') || s.includes('планшет')) {
                return t.catTablet;
            }
            if (s.includes('qulaq') || s.includes('headphone') || s.includes('наушник')) {
                return t.catHeadphones;
            }
            if (s.includes('aksesuar') || s.includes('accessory') || s.includes('aksessuar') || s.includes('аксессуар')) {
                return t.catAccessories;
            }
            return String(val).trim();
        }

        function formatCondition(val) {
            const lang = getCurrentLang();
            const t = I18N[lang] || I18N.AZ;
            const s = String(val || '').trim().toLowerCase();
            if (s === 'yeni' || s === 'new' || s === 'новый') return t.condNew;
            if (s === 'işlənmiş' || s === 'islenmis' || s === 'used' || s === 'б/у' || s === 'бу') return t.condUsed;
            return val || t.condNew;
        }

        function formatMemory(val) {
            if (!val) return '';
            const s = String(val).trim();
            if (s === '64-dan-az' || s === 'below-64' || s.toLowerCase() === '< 64' || s.toLowerCase() === '<64') return '< 64 GB';
            if (s === '512-den-cox' || s === '512+' || s === '512-plus') return '512+ GB';
            if (/^\d+$/.test(s)) return `${s} GB`;
            if (/^\d+\s*gb$/i.test(s)) return s.toUpperCase();
            return s;
        }

        function formatRam(val) {
            if (!val) return '';
            const s = String(val).trim();
            if (s === '16-dan-cox' || s === '16+' || s === '16-plus') return '16+ GB';
            if (/^\d+$/.test(s)) return `${s} GB`;
            if (/^\d+\s*gb$/i.test(s)) return s.toUpperCase();
            return s;
        }

        function formatScreen(val) {
            if (!val) return '';
            const s = String(val).trim().replace(/"/g, '');
            return `${s}"`;
        }

        function formatBattery(val) {
            if (!val) return '';
            const s = String(val).trim();
            if (/^\d+$/.test(s)) return `${s} mAh`;
            return s;
        }

        function formatCreatedDate(isoDate) {
            if (!isoDate) return '';
            const d = new Date(isoDate);
            if (isNaN(d.getTime())) return '';
            const lang = getCurrentLang();
            const t = I18N[lang] || I18N.AZ;
            const now = new Date();
            const isToday = d.toDateString() === now.toDateString();
            const timeStr = d.toLocaleTimeString(getDateLocale(), { hour: '2-digit', minute: '2-digit' });
            if (isToday) {
                return `${t.today}, ${timeStr}`;
            }
            return d.toLocaleDateString(getDateLocale());
        }

        function formatMemberSinceDate(isoDate) {
            if (!isoDate) return '';
            const d = new Date(isoDate);
            if (isNaN(d.getTime())) return '';
            return d.toLocaleDateString(getDateLocale(), { month: 'long', year: 'numeric' });
        }


        // ── 1. Page title & breadcrumb ─────────────────────────────
        const rawBrand = String(ad.brand || "").trim();
        const rawModel = String(ad.modelName || "").trim();
        const adTitle = (ad.title && String(ad.title).trim())
            ? String(ad.title).trim()
            : (rawBrand && rawModel && rawModel.toLowerCase().startsWith(rawBrand.toLowerCase())
                ? rawModel
                : [rawBrand, rawModel].filter(Boolean).join(" ") || 'Adsız Elan');
        document.title = `${adTitle} — Mobilim.az`;

        const titleEl = document.querySelector('.elan-main-title, .item-main-title, .ad-main-title');
        if (titleEl) titleEl.textContent = adTitle;

        const brandBreadcrumb = document.querySelector('.breadcrumb-brand') || document.querySelectorAll('.breadcrumb a')[2];
        const brandSep = document.querySelector('.breadcrumb-brand-sep');
        const currentBreadcrumb = document.querySelector('.breadcrumb-model') || document.querySelector('.breadcrumb .current');
        const modelSep = document.querySelector('.breadcrumb-model-sep');

        if (ad.brand) {
            if (brandBreadcrumb) {
                brandBreadcrumb.textContent = ad.brand;
                brandBreadcrumb.href = `phone.html?brand=${encodeURIComponent(ad.brand)}`;
                brandBreadcrumb.style.display = '';
            }
            if (brandSep) brandSep.style.display = '';
        }
        if (currentBreadcrumb) {
            currentBreadcrumb.textContent = adTitle;
        }
        if (modelSep) modelSep.style.display = '';

        // ── 2. Price ───────────────────────────────────────────────
        const priceEl = document.querySelector('.elan-main-price, .item-main-price, .ad-main-price');
        if (priceEl) priceEl.innerHTML = `${Number(ad.price || 0).toLocaleString('az-AZ')} <span class="elan-currency item-currency ad-currency">AZN</span>`;

        // ── 3. Description ─────────────────────────────────────────
        const descEl = document.querySelector('.desc-text');
        if (descEl) descEl.textContent = ad.description || 'Açıqlama yoxdur.';

        // ── 4. Date & Views ────────────────────────────────────────
        const dateEl  = document.querySelector('.elan-date-views span:nth-child(1), .ad-date-views span:nth-child(1)');
        const viewsEl = document.querySelector('.elan-date-views span:nth-child(2), .ad-date-views span:nth-child(2)') || document.getElementById('ad-views-count');
        if (dateEl)  dateEl.innerHTML  = `<i class="fas fa-clock"></i> ${formatCreatedDate(ad.createdAt)}`;
        if (viewsEl) viewsEl.innerHTML = `<i class="fas fa-eye"></i> ${ad.views || 0} ${getI18n().views}`;

        // ── 5. Image Gallery ───────────────────────────────────────
        const mainImg        = document.getElementById('mainImage');
        const thumbsContainer= document.getElementById('galleryThumbs');
        const prevBtn        = document.getElementById('prevBtn');
        const nextBtn        = document.getElementById('nextBtn');
        const galleryMain    = document.getElementById('galleryMain');
        const vipBadge       = document.querySelector('.badge-vip');
        const newBadge       = document.querySelector('.badge-new');

        const isVip = ad.promotionType === 'VIP';
        const isNew = ad.condition === 'Yeni';

        if (vipBadge) {
            vipBadge.classList.toggle('hidden', !isVip);
            vipBadge.style.display = isVip ? '' : 'none';
        }

        if (newBadge) {
            newBadge.classList.toggle('hidden', !isNew);
            newBadge.style.display = isNew ? '' : 'none';
        }

        const images = Array.isArray(ad.images) ? ad.images.filter(Boolean) : [];
        const watermarkEl    = galleryMain ? galleryMain.querySelector('.gallery-watermark') : null;

        if (images.length > 0) {
            if (watermarkEl) watermarkEl.style.display = '';
            if (mainImg) {
                mainImg.src = getImageUrl(images[0]);
                mainImg.alt = adTitle;
                mainImg.onerror = function() {
                    this.onerror = null;
                    this.src = '/assets/images/default-ad.svg';
                };
            }

            if (thumbsContainer) thumbsContainer.replaceChildren();
            if (images.length === 1) {
                // Single image — hide nav elements
                if (thumbsContainer) thumbsContainer.style.display = 'none';
                if (prevBtn)         prevBtn.style.display = 'none';
                if (nextBtn)         nextBtn.style.display = 'none';
            } else {
                // Multiple images — build thumbs + arrow nav
                let currentIdx = 0;
                const allUrls = images.map(getImageUrl);

                const goTo = (idx) => {
                    currentIdx = (idx + allUrls.length) % allUrls.length;
                    if (mainImg) mainImg.src = allUrls[currentIdx];
                    if (thumbsContainer) {
                        thumbsContainer.querySelectorAll('.thumb').forEach((t, i) =>
                            t.classList.toggle('active', i === currentIdx));
                    }
                };

                if (thumbsContainer) {
                    thumbsContainer.style.display = '';
                    thumbsContainer.replaceChildren();
                    images.forEach((img, idx) => {
                        const thumb = document.createElement('div');
                        thumb.className = `thumb${idx === 0 ? ' active' : ''}`;
                        thumb.dataset.src = getImageUrl(img);
                        thumb.innerHTML = `<img src="${getImageUrl(img)}" alt="Şəkil ${idx + 1}" loading="lazy" onerror="this.onerror=null;this.src='/assets/images/default-ad.svg';">`;
                        thumb.addEventListener('click', () => {
                            goTo(idx);
                        });
                        thumbsContainer.appendChild(thumb);
                    });
                }

                if (prevBtn) { prevBtn.style.display = ''; prevBtn.onclick = () => goTo(currentIdx - 1); }
                if (nextBtn) { nextBtn.style.display = ''; nextBtn.onclick = () => goTo(currentIdx + 1); }
            }
        } else {
            // No images — show placeholder
            if (watermarkEl) watermarkEl.style.display = 'none';
            if (mainImg) {
                mainImg.removeAttribute('src');
                mainImg.alt = 'Şəkil yoxdur';
                mainImg.style.display = 'none';
            }
            if (galleryMain) {
                const placeholder = document.createElement('div');
                placeholder.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--text-secondary);background:var(--bg-primary);';
                placeholder.innerHTML = '<i class="fas fa-image" style="font-size:52px;opacity:0.25;"></i><span style="font-size:14px;font-weight:600;">Şəkil yoxdur</span>';
                galleryMain.appendChild(placeholder);
            }
            if (thumbsContainer) thumbsContainer.style.display = 'none';
            if (prevBtn)         prevBtn.style.display = 'none';
            if (nextBtn)         nextBtn.style.display = 'none';
        }

                // ── Spec Formatters & Dynamic Details ─────────────────────
        const rawPhone = (
            ad.contactPhone ||
            ad.author?.phone ||
            ad.user?.phone ||
            ad.store?.contactNumber ||
            ''
        ).trim();
        const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

        function revealSellerPhone() {
            if (phoneRevealed) return;
            phoneRevealed = true;
            const t = getI18n();

            // 1. Reveal in seller card (sellerPhoneTag)
            const sellerPhoneTag = document.getElementById('sellerPhoneTag');
            const sellerPhoneText = document.getElementById('sellerPhoneText');
            const sellerPhoneHint = document.getElementById('sellerPhoneHint');
            if (sellerPhoneText) {
                sellerPhoneText.textContent = ` ${rawPhone}`;
            }
            if (sellerPhoneHint) {
                sellerPhoneHint.style.display = 'none';
                sellerPhoneHint.removeAttribute('data-translate');
            }
            if (sellerPhoneTag) {
                sellerPhoneTag.classList.add('revealed');
                sellerPhoneTag.setAttribute('title', t.clickToCall);
            }

            // 2. Reveal in callBtn
            const callBtnEl = document.getElementById('callBtn');
            const phoneTextEl = document.getElementById('phoneText');
            if (callBtnEl && phoneTextEl) {
                phoneTextEl.textContent = rawPhone;
                phoneTextEl.removeAttribute('data-translate');
                callBtnEl.style.background = 'linear-gradient(135deg,#28a745,#20c997)';
                callBtnEl.classList.add('revealed');
                callBtnEl.setAttribute('title', t.clickToCall);
            }
        }

        // ── Dynamic UI Rendering Function (Language Aware) ─────────
        function applyDynamicDetails(ad) {
            if (!ad) return;
            const t = getI18n();

            // ── A. Category Tag ──
            const catTag = document.querySelector('.elan-category-tag, .item-category-tag, .ad-category-tag');
            if (catTag) {
                catTag.replaceChildren();
                const catIcon = document.createElement('i');
                catIcon.className = 'fas fa-mobile-alt';
                catTag.append(catIcon, document.createTextNode(` ${formatCategory(ad.category || 'Telefon')} · ${ad.brand || ''}`));
            }

            // ── B. Date & Views ──
            const dateEl  = document.querySelector('.elan-date-views span:nth-child(1), .ad-date-views span:nth-child(1)');
            const viewsEl = document.querySelector('.elan-date-views span:nth-child(2), .ad-date-views span:nth-child(2)') || document.getElementById('ad-views-count');
            if (dateEl)  dateEl.innerHTML  = `<i class="fas fa-clock"></i> ${formatCreatedDate(ad.createdAt)}`;
            if (viewsEl) viewsEl.innerHTML = `<i class="fas fa-eye"></i> ${ad.views || 0} ${t.views}`;

            // ── C. Location & Condition rows ──
            const locationRows = document.querySelectorAll('.location-item strong');
            if (locationRows[0]) locationRows[0].textContent = formatCity(ad.city || 'Bakı');
            if (locationRows[1]) locationRows[1].textContent = formatCondition(ad.condition || 'Yeni');
            if (locationRows[2]) locationRows[2].textContent = ad.specs?.features?.delivery ? t.hasDelivery : t.noDelivery;

            // ── D. Quick Spec Chips ──
            const quickSpecsEl = document.querySelector('.quick-specs');
            if (quickSpecsEl) {
                quickSpecsEl.replaceChildren();
                const addChip = (iconClass, text) => {
                    if (!text || String(text).trim() === '') return;
                    const chip = document.createElement('span');
                    chip.className = 'spec-chip';
                    const icon = document.createElement('i');
                    icon.className = iconClass;
                    chip.append(icon, document.createTextNode(' ' + text));
                    quickSpecsEl.appendChild(chip);
                };
                if (ad.specs?.memory)         addChip('fas fa-memory', `${formatMemory(ad.specs.memory)} ${t.memory}`);
                if (ad.specs?.ram)            addChip('fas fa-microchip', `${formatRam(ad.specs.ram)} ${t.ram}`);
                if (ad.specs?.screenSize)     addChip('fas fa-expand-arrows-alt', formatScreen(ad.specs.screenSize));
                if (ad.specs?.battery)        addChip('fas fa-battery-full', formatBattery(ad.specs.battery));
                if (ad.specs?.color)          addChip('fas fa-palette', formatColorName(ad.specs.color));
                if (ad.specs?.material)       addChip('fas fa-shield-alt', String(ad.specs.material));
                if (ad.specs?.glassType)      addChip('fas fa-shield-virus', String(ad.specs.glassType));
                if (ad.specs?.connectionType) addChip('fas fa-headphones', String(ad.specs.connectionType));
                if (ad.specs?.headphoneType)  addChip('fas fa-headset', String(ad.specs.headphoneType));
                if (ad.specs?.power)          addChip('fas fa-bolt', String(ad.specs.power));
                if (ad.specs?.portType)       addChip('fas fa-charging-station', String(ad.specs.portType));
                if (ad.specs?.cableType)      addChip('fas fa-plug', String(ad.specs.cableType));
                if (ad.specs?.cableLength)    addChip('fas fa-ruler-horizontal', String(ad.specs.cableLength));
                if (ad.condition)             addChip('fas fa-box-open', formatCondition(ad.condition));
            }

            // ── E. Feature Badges ──
            const featureBadgesEl = document.querySelector('.feature-badges');
            if (featureBadgesEl) {
                featureBadgesEl.replaceChildren();
                const f = ad.specs?.features || {};
                const addFeatureBadge = (iconClass, text) => {
                    const badge = document.createElement('span');
                    badge.className = 'feat-badge yes';
                    const icon = document.createElement('i');
                    icon.className = iconClass;
                    badge.append(icon, document.createTextNode(' ' + text));
                    featureBadgesEl.appendChild(badge);
                };

                if (f.nfc)             addFeatureBadge('fas fa-wifi', t.featNfc);
                if (f.fingerprint)     addFeatureBadge('fas fa-fingerprint', t.featFingerprint);
                if (f.waterproof)      addFeatureBadge('fas fa-tint', t.featWaterproofChip);
                if (f.expandable)      addFeatureBadge('fas fa-sd-card', t.featExpandableChip);
                if (f.magsafe)         addFeatureBadge('fas fa-magnet', t.featMagsafe);
                if (f.anc)             addFeatureBadge('fas fa-volume-mute', t.featAnc);
                if (f.fastCharge)      addFeatureBadge('fas fa-bolt', t.featFastCharge);
                if (f.wirelessCharge)  addFeatureBadge('fas fa-charging-station', t.featWirelessCharge);
                if (f.microphone)      addFeatureBadge('fas fa-microphone', t.featMicrophone);
                if (f.oleophobic)      addFeatureBadge('fas fa-shield-alt', t.featOleophobic);
                if (f.stylus)          addFeatureBadge('fas fa-pen-nib', t.featStylus);
                if (f.simCard)         addFeatureBadge('fas fa-sim-card', t.featSimCard);
                if (f.delivery)        addFeatureBadge('fas fa-truck', t.featDelivery);

                featureBadgesEl.style.display = featureBadgesEl.children.length === 0 ? 'none' : 'flex';
            }

            // ── F. Full Specs Grid ──
            const specsGrid = document.querySelector('.specs-grid');
            if (specsGrid) {
                specsGrid.replaceChildren();
                const addSpecRow = (label, val) => {
                    if (!val || String(val).trim() === '' || String(val).trim() === '-') return;
                    const row = document.createElement('div');
                    row.className = 'spec-row';
                    const lblSpan = document.createElement('span');
                    lblSpan.className = 'spec-label';
                    lblSpan.textContent = label;
                    const valSpan = document.createElement('span');
                    valSpan.className = 'spec-value';
                    valSpan.textContent = String(val);
                    row.append(lblSpan, valSpan);
                    specsGrid.appendChild(row);
                };

                if (ad.category) addSpecRow(t.category, formatCategory(ad.category));
                if (ad.brand) addSpecRow(t.brand, ad.brand);
                if (ad.modelName) addSpecRow(t.model, ad.modelName);

                // Electronics specs
                if (ad.specs?.memory) addSpecRow(t.memory, formatMemory(ad.specs.memory));
                if (ad.specs?.ram) addSpecRow(t.ram, formatRam(ad.specs.ram));
                if (ad.specs?.screenSize) addSpecRow(t.screenSize, formatScreen(ad.specs.screenSize));
                if (ad.specs?.battery) addSpecRow(t.battery, formatBattery(ad.specs.battery));

                // Accessory specs
                if (ad.specs?.material) addSpecRow(t.material, String(ad.specs.material));
                if (ad.specs?.glassType) addSpecRow(t.glassType, String(ad.specs.glassType));
                if (ad.specs?.connectionType) addSpecRow(t.connectionType, String(ad.specs.connectionType));
                if (ad.specs?.headphoneType) addSpecRow(t.headphoneType, String(ad.specs.headphoneType));
                if (ad.specs?.power) addSpecRow(t.power, String(ad.specs.power));
                if (ad.specs?.portType) addSpecRow(t.portType, String(ad.specs.portType));
                if (ad.specs?.cableType) addSpecRow(t.cableType, String(ad.specs.cableType));
                if (ad.specs?.cableLength) addSpecRow(t.cableLength, String(ad.specs.cableLength));

                // Color & Condition
                if (ad.specs?.color) addSpecRow(t.color, formatColorName(ad.specs.color));
                addSpecRow(t.condition, formatCondition(ad.condition));

                // Features (boolean flags)
                const f = ad.specs?.features || {};
                if (f.nfc)             addSpecRow(t.featNfc, t.varCheck);
                if (f.waterproof)      addSpecRow(t.featWaterproof, t.varCheck);
                if (f.fingerprint)     addSpecRow(t.featFingerprint, t.varCheck);
                if (f.magsafe)         addSpecRow(t.featMagsafe, t.varCheck);
                if (f.anc)             addSpecRow(t.featAnc, t.varCheck);
                if (f.microphone)      addSpecRow(t.featMicrophone, t.varCheck);
                if (f.fastCharge)      addSpecRow(t.featFastCharge, t.varCheck);
                if (f.wirelessCharge)  addSpecRow(t.featWirelessCharge, t.varCheck);
                if (f.oleophobic)      addSpecRow(t.featOleophobic, t.varCheck);
                if (f.stylus)          addSpecRow(t.featStylus, t.varCheck);
                if (f.simCard)         addSpecRow(t.featSimCard, t.varCheck);
                if (f.expandable)      addSpecRow(t.featExpandable, t.varCheck);
                if (f.delivery)        addSpecRow(t.featDelivery, t.varCheck);

                if (specsGrid.children.length === 0) {
                    specsGrid.innerHTML = `<div class="spec-row"><span class="spec-label">${t.info}</span><span class="spec-value">—</span></div>`;
                }
            }

            // ── G. Seller Info ──
            const isStore = Boolean(ad.sellerType === 'store' && ad.store);
            const sellerTypeTag = document.getElementById('sellerTypeTag');
            const sellerLocationText = document.getElementById('sellerLocationText');
            const storeProfileLink = document.getElementById('storeProfileLink');
            const sellerSinceText = document.getElementById('sellerSinceText');
            const sellerPhoneTag = document.getElementById('sellerPhoneTag');
            const sellerPhoneText = document.getElementById('sellerPhoneText');
            const sellerPhoneHint = document.getElementById('sellerPhoneHint');
            const callBtn = document.getElementById('callBtn');
            const phoneText = document.getElementById('phoneText');
            const waBtn = document.querySelector('.btn-whatsapp');
            const msgBtn = document.querySelector('.btn-message');

            // Type Tag
            if (sellerTypeTag) {
                sellerTypeTag.replaceChildren();
                const icon = document.createElement('i');
                icon.className = isStore ? 'fas fa-store' : 'fas fa-user-circle';
                const label = document.createElement('span');
                label.textContent = ` ${isStore ? t.storeAccount : t.personalAccount}`;
                sellerTypeTag.append(icon, label);
            }

            // Location Text
            const locText = isStore ? (ad.store?.city || ad.city || '') : [ad.city, ad.region].filter(Boolean).join(', ');
            if (sellerLocationText) {
                sellerLocationText.textContent = ` ${formatCity(locText)}`;
            }

            // Store Profile Link
            if (storeProfileLink) {
                const span = storeProfileLink.querySelector('span');
                if (span) span.textContent = t.viewStore;
            }

            // Phone in Seller Card
            if (sellerPhoneTag && rawPhone) {
                if (!phoneRevealed) {
                    if (sellerPhoneText) sellerPhoneText.textContent = ` ${maskPhoneNumber(rawPhone)}`;
                    if (sellerPhoneHint) {
                        sellerPhoneHint.textContent = t.revealHint;
                        sellerPhoneHint.style.display = 'inline';
                    }
                    sellerPhoneTag.setAttribute('title', t.clickToReveal);
                } else {
                    if (sellerPhoneText) sellerPhoneText.textContent = ` ${rawPhone}`;
                    if (sellerPhoneHint) sellerPhoneHint.style.display = 'none';
                    sellerPhoneTag.setAttribute('title', t.clickToCall);
                }
            }

            // Call Button
            if (callBtn && phoneText && rawPhone) {
                if (!phoneRevealed) {
                    phoneText.textContent = t.showNumber;
                    callBtn.setAttribute('title', t.clickToReveal);
                } else {
                    phoneText.textContent = rawPhone;
                    callBtn.setAttribute('title', t.clickToCall);
                }
            }

            // WhatsApp Button
            if (waBtn) {
                const span = waBtn.querySelector('span');
                if (span) span.textContent = t.chatOnWhatsapp;
            }

            // Message Button
            if (msgBtn) {
                const span = msgBtn.querySelector('span');
                if (span) span.textContent = t.sendMessage;
            }

            // Member Since Date
            const dateVal = isStore ? (ad.store?.createdAt || ad.createdAt) : ad.author?.createdAt;
            if (sellerSinceText && dateVal) {
                sellerSinceText.textContent = ` ${formatMemberSinceDate(dateVal)}`;
            }

            // ── H. Ad ID Bar ──
            const adIdBar = document.querySelector('.elan-id-bar, .item-id-bar, .ad-id-bar');
            if (adIdBar) {
                const spans = adIdBar.querySelectorAll(':scope > span');
                if (spans[0]) {
                    const lbl = spans[0].querySelector('span:first-child');
                    if (lbl) lbl.textContent = t.adNumberLabel;
                }
                if (spans[1]) {
                    const lbl = spans[1].querySelector('span:first-child');
                    if (lbl) lbl.textContent = t.postedLabel;
                    const val = spans[1].querySelector('span:nth-child(2)');
                    if (val && ad.createdAt) val.textContent = new Date(ad.createdAt).toLocaleDateString(getDateLocale());
                }
                if (spans[2]) {
                    const lbl = spans[2].querySelector('span:first-child');
                    if (lbl) lbl.textContent = t.updatedLabel;
                    const val = spans[2].querySelector('span:nth-child(2)');
                    if (val && (ad.updatedAt || ad.createdAt)) val.textContent = new Date(ad.updatedAt || ad.createdAt).toLocaleDateString(getDateLocale());
                }
            }

            // ── I. Reviews Note & Fallbacks ──
            const revNote = document.querySelector('.reviews-seller-note');
            if (revNote) revNote.textContent = t.allSellerReviews;

            const descEl = document.querySelector('.desc-text');
            if (descEl && !ad.description) {
                descEl.textContent = t.noDesc;
            }
        }

        // ── 10. Seller Info Static Setup ───────────────────────────
        isStore = Boolean(ad.sellerType === 'store' && ad.store);
        const sellerNameEl = document.getElementById('sellerName') || document.querySelector('.personal-name');
        const avatarEl = document.getElementById('sellerAvatar') || document.querySelector('.personal-avatar');
        const sellerLocationTag = document.getElementById('sellerLocationTag');
        const storeProfileLink = document.getElementById('storeProfileLink');
        const sellerStats = document.getElementById('sellerStats') || document.querySelector('.personal-stats');
        const sellerSinceRow = document.getElementById('sellerSinceRow') || document.querySelector('.seller-since-row');
        const sellerEmailTag = document.getElementById('sellerEmailTag');
        if (sellerEmailTag) {
            sellerEmailTag.classList.add('hidden');
            sellerEmailTag.style.display = 'none';
        }

        if (isStore) {
            const store = ad.store;
            const storeName = store.storeName || 'Mağaza';
            if (sellerNameEl) {
                sellerNameEl.textContent = storeName;
                if (store.isVerified === true) {
                    const verifiedBadge = document.createElement('i');
                    verifiedBadge.className = 'fas fa-check-circle';
                    verifiedBadge.style.cssText = 'color: #007bff; margin-left: 6px; font-size: 15px;';
                    verifiedBadge.title = getI18n().officialStore;
                    sellerNameEl.appendChild(verifiedBadge);
                }
            }
            if (avatarEl) {
                avatarEl.replaceChildren();
                if (store.logoUrl) {
                    const img = document.createElement('img');
                    img.src = getImageUrl(store.logoUrl);
                    img.alt = storeName;
                    img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
                    img.onerror = function() {
                        this.onerror = null;
                        this.src = '/assets/images/default-avatar.svg';
                    };
                    avatarEl.appendChild(img);
                } else {
                    avatarEl.textContent = (storeName || 'M').charAt(0).toUpperCase();
                }
            }
            if (storeProfileLink) {
                if (store._id) {
                    storeProfileLink.href = `store-detail.html?id=${encodeURIComponent(store._id)}`;
                    storeProfileLink.classList.remove('hidden');
                    storeProfileLink.style.display = 'inline-flex';
                } else {
                    storeProfileLink.classList.add('hidden');
                    storeProfileLink.style.display = 'none';
                }
            }
            const storeLoc = (store.city || ad.city || '').trim();
            if (sellerLocationTag) {
                if (storeLoc) {
                    sellerLocationTag.classList.remove('hidden');
                    sellerLocationTag.style.display = 'flex';
                } else {
                    sellerLocationTag.classList.add('hidden');
                    sellerLocationTag.style.display = 'none';
                }
            }
            if (sellerSinceRow) {
                if (store.createdAt || ad.createdAt) {
                    sellerSinceRow.classList.remove('hidden');
                    sellerSinceRow.style.display = '';
                } else {
                    sellerSinceRow.classList.add('hidden');
                    sellerSinceRow.style.display = 'none';
                }
            }
        } else {
            const author = ad.author || ad.user || {};
            const authorName = [author.name, author.lastName].filter(Boolean).join(' ') || author.name || getI18n().userFallback;
            if (sellerNameEl) {
                sellerNameEl.textContent = authorName;
            }
            if (avatarEl) {
                avatarEl.replaceChildren();
                if (author.avatar) {
                    const img = document.createElement('img');
                    img.src = getImageUrl(author.avatar);
                    img.alt = authorName;
                    img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
                    img.onerror = function() {
                        this.onerror = null;
                        this.src = '/assets/images/default-avatar.svg';
                    };
                    avatarEl.appendChild(img);
                } else {
                    avatarEl.textContent = (author.name || authorName).charAt(0).toUpperCase() || 'S';
                }
            }
            if (storeProfileLink) {
                storeProfileLink.classList.add('hidden');
                storeProfileLink.style.display = 'none';
            }
            const personalLoc = [ad.city, ad.region].filter(Boolean).join(', ').trim();
            if (sellerLocationTag) {
                if (personalLoc) {
                    sellerLocationTag.classList.remove('hidden');
                    sellerLocationTag.style.display = 'flex';
                } else {
                    sellerLocationTag.classList.add('hidden');
                    sellerLocationTag.style.display = 'none';
                }
            }
            if (sellerSinceRow) {
                if (ad.author?.createdAt) {
                    sellerSinceRow.classList.remove('hidden');
                    sellerSinceRow.style.display = '';
                } else {
                    sellerSinceRow.classList.add('hidden');
                    sellerSinceRow.style.display = 'none';
                }
            }
        }

        const sellerPhoneTag = document.getElementById('sellerPhoneTag');
        if (sellerPhoneTag) {
            if (rawPhone) {
                sellerPhoneTag.classList.remove('hidden');
                sellerPhoneTag.style.display = 'inline-flex';
                sellerPhoneTag.classList.add('phone-clickable');
                sellerPhoneTag.onclick = (e) => {
                    e.preventDefault();
                    if (!phoneRevealed) {
                        revealSellerPhone();
                    } else {
                        const telNumber = cleanPhone || rawPhone.replace(/\s+/g, '');
                        if (typeof window.openExternalConfirmModal === 'function') {
                            window.openExternalConfirmModal(`tel:${telNumber}`, { formattedNumber: rawPhone });
                        } else if (telNumber) {
                            window.location.href = `tel:${telNumber}`;
                        }
                    }
                };
            } else {
                sellerPhoneTag.classList.add('hidden');
                sellerPhoneTag.style.display = 'none';
            }
        }

        // Apply dynamic UI now
        applyDynamicDetails(ad);

        // ── 11. Ad ID bar Number ───────────────────────────────────
        const adIdBar = document.querySelector('.elan-id-bar, .item-id-bar, .ad-id-bar');
        const adIdSpan = adIdBar ? adIdBar.querySelector('span:nth-child(1) span:nth-child(2)') : null;
        const displayAdNumber = ad.adNumber || (ad._id ? (String(ad._id) === '6ad7634079a9d25725d38022' ? 'MOB-5D3802' : `MOB-${String(ad._id).slice(-6).toUpperCase()}`) : '—');
        if (adIdSpan) adIdSpan.textContent = displayAdNumber;

        // Listen for live language changes and update details without refresh
        document.addEventListener('mobilaz:languagechange', () => {
            if (window.__CURRENT_AD) {
                applyDynamicDetails(window.__CURRENT_AD);
                renderReviews(cachedReviews);
                if (cachedRelatedAds.length) renderRelatedAds(cachedRelatedAds);
            }
        });

        window.addEventListener('storage', (e) => {
            if (e.key === 'lang' && window.__CURRENT_AD) {
                applyDynamicDetails(window.__CURRENT_AD);
                renderReviews(cachedReviews);
                if (cachedRelatedAds.length) renderRelatedAds(cachedRelatedAds);
            }
        });

// ── 12. Author: Edit/Delete buttons ───────────────────────
        let isAuthor = false;
        try {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            isAuthor = !!(user && ad.author && (user.id === ad.author._id || user._id === ad.author._id));
        } catch { /* ignore parse errors */ }

        if (isAuthor) {
            const contactBtnGroup = document.querySelector('.contact-btn-group');
            if (contactBtnGroup) {
                contactBtnGroup.innerHTML = `
                    <button class="btn-call-reveal" style="background:var(--airy-primary);margin-bottom:10px;" id="editAdBtn">
                        <i class="fas fa-edit"></i> Düzəliş Et
                    </button>
                    <button class="btn-message" style="color:#dc3545;border-color:#dc3545;" id="deleteAdBtn">
                        <i class="fas fa-trash-alt"></i> Elanı Sil
                    </button>`;

                document.getElementById('editAdBtn')?.addEventListener('click', () => {
                    window.location.href = `elan-yerlesdir.html?edit=${ad._id}`;
                });

                document.getElementById('deleteAdBtn')?.addEventListener('click', async () => {
                    if (!confirm('Bu elanı silmək istədiyinizə əminsiniz?')) return;
                    try {
                        const token = (typeof window !== "undefined" && window.getAuthToken)
                            ? window.getAuthToken()
                            : (sessionStorage.getItem("token") || sessionStorage.getItem("adminToken") || "");
                        const delRes = await fetch(`${API_BASE}/listings/${ad._id}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (delRes.ok) {
                            showToast('Elan silindi!');
                            setTimeout(() => window.location.href = 'cabinet.html', 1500);
                        } else {
                            const errData = await delRes.json().catch(() => ({}));
                            showToast(errData.message || 'Silinmə zamanı xəta oldu.');
                        }
                    } catch (e) {
                        showToast('Şəbəkə xətası baş verdi.');
                    }
                });
            }
            // Hide review forms for own ad
            document.querySelectorAll('.write-review-main, .write-review-card')
                .forEach(c => c.style.display = 'none');
        } else {
            // ── 13. Phone / WhatsApp / Message buttons ─────────────
            const callBtn  = document.getElementById('callBtn');
            const phoneText= document.getElementById('phoneText');
            if (callBtn && phoneText) {
                if (rawPhone) {
                    callBtn.onclick = (e) => {
                        e.preventDefault();
                        if (!phoneRevealed) {
                            revealSellerPhone();
                        } else {
                            const telNumber = cleanPhone || rawPhone.replace(/\s+/g, '');
                            if (typeof window.openExternalConfirmModal === 'function') {
                                window.openExternalConfirmModal(`tel:${telNumber}`, { formattedNumber: rawPhone });
                            } else if (telNumber) {
                                window.location.href = `tel:${telNumber}`;
                            }
                        }
                    };
                    callBtn.classList.remove('hidden');
                    callBtn.style.display = '';
                } else {
                    callBtn.classList.add('hidden');
                    callBtn.style.display = 'none';
                }
            }

            const waBtn = document.querySelector('.btn-whatsapp');
            if (waBtn) {
                if (cleanPhone) {
                    waBtn.href = `https://wa.me/${cleanPhone}`;
                    waBtn.classList.remove('hidden');
                    waBtn.style.display = '';
                } else {
                    waBtn.href = '#';
                    waBtn.classList.add('hidden');
                    waBtn.style.display = 'none';
                }
            }

            const msgBtn = document.querySelector('.btn-message');
            if (msgBtn && ad.author?._id) {
                const newMsgBtn = msgBtn.cloneNode(true);
                msgBtn.parentNode.replaceChild(newMsgBtn, msgBtn);
                newMsgBtn.addEventListener('click', () => {
                    const token = (typeof window !== "undefined" && window.getAuthToken)
                        ? window.getAuthToken()
                        : (sessionStorage.getItem("token") || sessionStorage.getItem("adminToken") || "");
                    if (!token) {
                        showToast('Mesaj yazmaq üçün sistemə daxil olun!');
                        setTimeout(() => window.location.href = 'login.html', 1500);
                        return;
                    }
                    window.location.href = `chat.html?sellerId=${ad.author._id}&adId=${ad._id}`;
                });
            }
        }

        // ── 14. Reviews (non-blocking) ─────────────────────────────
        if (ad.author?._id) {
            const fetchAndRenderReviews = async () => {
                try {
                    const revRes  = await fetch(`${API_BASE}/reviews/${ad.author._id}`);
                    const revData = await revRes.json();
                    if (revRes.ok) { cachedReviews = revData.reviews || []; renderReviews(cachedReviews); }
                    else { cachedReviews = []; renderReviews([]); }
                } catch (e) {
                    console.warn('Reviews fetch failed:', e.message);
                    renderReviews([]);
                    const realRatingEl = document.getElementById('realRating');
                    if (realRatingEl) {
                        realRatingEl.className = 'no-reviews-title';
                        realRatingEl.textContent = 'Bu satıcı üçün hələ rəy yoxdur. İlk rəyi siz yazın!';
                    }
                }
            };

            fetchAndRenderReviews();

            if (!isAuthor) {
                ['main', 'side'].forEach(type => {
                    const selectorId = type === 'main' ? 'mainStarSelect' : 'sideStarSelect';
                    const selector   = document.getElementById(selectorId);
                    if (!selector) return;

                    const stars = selector.querySelectorAll('.star');
                    let currentRating = 0;

                    stars.forEach(s => {
                        s.addEventListener('click', () => {
                            currentRating = parseInt(s.dataset.val) || 0;
                            stars.forEach((st, idx) => {
                                st.style.color = idx < currentRating ? '#ffc107' : 'var(--border-color)';
                            });
                        });
                    });

                    const submitBtn = selector.parentElement?.querySelector('.btn-submit-review');
                    if (!submitBtn) return;

                    submitBtn.addEventListener('click', async () => {
                        const token = (typeof window !== "undefined" && window.getAuthToken)
                            ? window.getAuthToken()
                            : (sessionStorage.getItem("token") || sessionStorage.getItem("adminToken") || "");
                        if (!token) { showToast('Rəy yazmaq üçün daxil olun!'); return; }
                        if (!currentRating) { showToast('Zəhmət olmasa reytinq seçin (ulduz)'); return; }

                        const textElId = type === 'main' ? 'mainReviewText' : 'sideReviewText';
                        const textEl   = document.getElementById(textElId);
                        const text     = textEl?.value.trim() || '';

                        const btnText  = submitBtn.innerHTML;
                        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Göndərilir...';

                        try {
                            const postRes = await fetch(`${API_BASE}/reviews`, {
                                method: 'POST',
                                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ targetUserId: ad.author._id, rating: currentRating, comment: text })
                            });
                            const data = await postRes.json();
                            if (postRes.ok) {
                                showToast('Rəy uğurla əlavə edildi!');
                                if (textEl) textEl.value = '';
                                fetchAndRenderReviews();
                            } else {
                                showToast(data.message || 'Xəta baş verdi');
                            }
                        } catch (e) {
                            showToast('Şəbəkə xətası baş verdi.');
                            renderReviews([]);
                        } finally {
                            submitBtn.innerHTML = btnText;
                        }
                    });
                });
            }
        } else {
            renderReviews([]);
        }

                // ── 15. Related Ads (non-blocking) ──────────────────────────
        function renderRelatedAds(ads) {
            cachedRelatedAds = Array.isArray(ads) ? ads : [];
            const relatedSection = document.querySelector('.related-section');
            const relatedGrid = document.querySelector('.related-grid');
            if (!relatedGrid || !cachedRelatedAds.length) return;

            const t = getI18n();
            const relHead = document.querySelector('.related-section h2 span');
            if (relHead) relHead.textContent = t.relatedTitle;

            relatedGrid.replaceChildren();
            cachedRelatedAds.forEach(item => {
                const card = document.createElement('div');
                card.className = 'elan-card product-card item-card';
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    window.location.href = `elan-detail.html?id=${encodeURIComponent(item._id)}`;
                });

                // Image container
                const imgContainer = document.createElement('div');
                imgContainer.className = 'elan-image product-image';

                const imgEl = document.createElement('img');
                const imgSrc = (Array.isArray(item.images) && item.images.length > 0)
                    ? getImageUrl(item.images[0])
                    : '';
                imgEl.src = imgSrc || '/assets/images/default-ad.svg';
                imgEl.onerror = function() {
                    this.onerror = null;
                    this.src = '/assets/images/default-ad.svg';
                };
                const rawItemBrand = String(item.brand || "").trim();
                const rawItemModel = String(item.modelName || "").trim();
                const itemTitle = (item.title && String(item.title).trim())
                    ? String(item.title).trim()
                    : (rawItemBrand && rawItemModel && rawItemModel.toLowerCase().startsWith(rawItemBrand.toLowerCase())
                        ? rawItemModel
                        : [rawItemBrand, rawItemModel].filter(Boolean).join(" ") || 'Elan');
                imgEl.alt = itemTitle;
                imgEl.loading = 'lazy';
                imgContainer.appendChild(imgEl);

                const badge = document.createElement('span');
                badge.className = 'elan-badge product-badge';
                if (item.sellerType === 'personal') {
                    badge.style.background = '#e67e22';
                    badge.textContent = t.badgePersonal;
                } else {
                    badge.textContent = t.badgeStore;
                }
                imgContainer.appendChild(badge);
                card.appendChild(imgContainer);

                // Info container
                const infoContainer = document.createElement('div');
                infoContainer.className = 'elan-info product-info';

                const priceEl = document.createElement('div');
                priceEl.className = 'elan-price product-price';
                priceEl.textContent = `${Number(item.price || 0).toLocaleString('az-AZ')} AZN`;
                infoContainer.appendChild(priceEl);

                const titleEl = document.createElement('div');
                titleEl.className = 'elan-title product-title';
                titleEl.textContent = itemTitle;
                infoContainer.appendChild(titleEl);

                const locEl = document.createElement('div');
                locEl.className = 'elan-location product-location';

                const citySpan = document.createElement('span');
                citySpan.className = 'elan-city-label';
                const cityIcon = document.createElement('i');
                cityIcon.className = 'fas fa-map-marker-alt';
                citySpan.appendChild(cityIcon);
                citySpan.appendChild(document.createTextNode(` ${formatCity(item.city || 'Bakı')}`));
                locEl.appendChild(citySpan);

                const dateSpan = document.createElement('span');
                if (item.createdAt) {
                    const d = new Date(item.createdAt);
                    dateSpan.textContent = !isNaN(d.getTime()) ? d.toLocaleDateString(getDateLocale()) : '';
                }
                locEl.appendChild(dateSpan);

                infoContainer.appendChild(locEl);
                card.appendChild(infoContainer);

                relatedGrid.appendChild(card);
            });

            if (relatedSection) {
                relatedSection.classList.remove('hidden');
                relatedSection.style.display = '';
            }
        }

        const fetchAndRenderRelated = async () => {
            const relatedSection = document.querySelector('.related-section');
            const relatedGrid = document.querySelector('.related-grid');
            if (!relatedGrid) return;

            const hideRelated = () => {
                if (relatedSection) {
                    relatedSection.classList.add('hidden');
                    relatedSection.style.display = 'none';
                }
            };

            const category = ad.category ? String(ad.category).trim() : '';
            if (!category) {
                hideRelated();
                return;
            }

            try {
                let queryUrl = `${API_BASE}/listings?category=${encodeURIComponent(category)}&limit=5`;
                if (ad.brand && String(ad.brand).trim()) {
                    queryUrl += `&brand=${encodeURIComponent(String(ad.brand).trim())}`;
                }

                let res = await fetch(queryUrl);
                let data = res.ok ? await res.json() : null;
                let adsList = (data && Array.isArray(data.ads)) ? data.ads : [];

                let filtered = adsList.filter(item => item && item._id && item._id !== ad._id);
                if (filtered.length === 0 && ad.brand && String(ad.brand).trim()) {
                    const fallbackRes = await fetch(`${API_BASE}/listings?category=${encodeURIComponent(category)}&limit=5`);
                    const fallbackData = fallbackRes.ok ? await fallbackRes.json() : null;
                    const fallbackList = (fallbackData && Array.isArray(fallbackData.ads)) ? fallbackData.ads : [];
                    filtered = fallbackList.filter(item => item && item._id && item._id !== ad._id);
                }

                cachedRelatedAds = filtered.slice(0, 4);
                if (cachedRelatedAds.length === 0) {
                    hideRelated();
                    return;
                }

                renderRelatedAds(cachedRelatedAds);
            } catch (err) {
                console.warn('Failed to load related ads:', err);
                hideRelated();
            }
        };

        fetchAndRenderRelated();

    } catch (err) {
        console.error('[ad-details] Error:', err);
        showPageError(err.message || 'Naməlum xəta baş verdi.');
        return; // revealPage() called inside showPageError
    } finally {
        // ✅ ALWAYS reveal — no matter what happened above
        revealPage();
        if (typeof window.applyLanguage === 'function') {
            try { window.applyLanguage(); } catch (e) { /* ignore */ }
        }
    }
    // ── renderReviews helper (Multilingual) ───────────────────────
    function renderReviews(reviews) {
        cachedReviews = Array.isArray(reviews) ? reviews : [];
        reviews = cachedReviews;
        const t = getI18n();
        let total = 0;
        const counts = [0, 0, 0, 0, 0];
        reviews.forEach(r => {
            const val = Number(r.rating) || 0;
            total += val;
            if (val >= 1 && val <= 5) counts[5 - val]++;
        });
        const avg = reviews.length ? (total / reviews.length).toFixed(1) : '-';

        const realRatingEl = document.getElementById('realRating');
        if (realRatingEl) {
            if (reviews.length) {
                realRatingEl.className = '';
                realRatingEl.textContent = `${avg} ★`;
            } else {
                realRatingEl.className = 'no-reviews-title';
                realRatingEl.textContent = t.noReviewsTitle;
            }
        }
        const avgSpan = document.getElementById('avgRating');
        if (avgSpan) avgSpan.textContent = avg;
        const countSpan = document.getElementById('reviewCount');
        if (countSpan) countSpan.textContent = String(reviews.length);

        const summaryEl = document.querySelector('.review-rating-summary');
        if (summaryEl) {
            if (!reviews.length) {
                summaryEl.innerHTML = `
                    <div class="empty-state no-reviews-summary" style="width: 100%; text-align: center; padding: 16px;">
                        <span id="realRating" class="no-reviews-title" style="display:none;">${t.noReviewsTitle}</span>
                        <span id="avgRating" style="display:none;">-</span>
                        <span id="reviewCount" style="display:none;">0</span>
                        <div class="rating-stars-lg empty-stars" style="color: #9ca3af; font-size: 16px; margin: 0 0 6px 0; letter-spacing: 2px;">☆☆☆☆☆</div>
                        <div class="no-reviews-title" style="font-size: 14px; color: #9ca3af; font-weight: 400; text-transform: none;">${t.noReviewsTitle}</div>
                    </div>`;
            } else {
                summaryEl.innerHTML = `
                    <div>
                        <div class="rating-big"><span id="realRating">${avg} ★</span><span id="avgRating" style="display:none;">${avg}</span></div>
                        <div class="rating-stars-lg">${getStarsHtml(Math.round(Number(avg)))}</div>
                        <div class="rating-count"><span id="reviewCount">${reviews.length}</span> ${t.reviewCountBased}</div>
                    </div>
                    <div class="rating-bars" style="flex:1">
                        ${[5,4,3,2,1].map((star, idx) => {
                            const pct = Math.round((counts[idx] / reviews.length) * 100);
                            return `<div class="rbar" style="display:flex;align-items:center;gap:8px;margin-bottom:7px;font-size:12.5px;">
                                <span class="rbar-label" style="color:var(--text-secondary);width:28px;text-align:right;">${star}★</span>
                                <div class="rbar-track" style="flex:1;height:6px;background:var(--border-color);border-radius:4px;overflow:hidden;">
                                    <div style="height:100%;border-radius:4px;background:#ffc107;width:${pct}%"></div>
                                </div>
                                <span class="rbar-count" style="color:var(--text-secondary);width:20px;text-align:right;">${counts[idx]}</span>
                            </div>`;
                        }).join('')}
                    </div>`;
            }
        }

        const section = document.querySelector('.reviews-section');
        if (section) {
            section.querySelectorAll('.review-card-full').forEach(e => e.remove());
            section.querySelectorAll('.no-reviews-empty').forEach(e => e.remove());
            const writeBlock = section.querySelector('.write-review-main');

            if (!reviews.length) {
                if (!summaryEl) {
                    const emptyDiv = document.createElement('div');
                    emptyDiv.className = 'no-reviews-empty empty-state';
                    emptyDiv.style.cssText = 'padding: 16px; text-align: center; color: #6b7280; font-size: 14px;';
                    emptyDiv.innerHTML = `<span class="no-reviews-title" style="font-size: 14px; color: #9ca3af; font-weight: 400;">${t.noReviewsTitle}</span>`;
                    section.insertBefore(emptyDiv, writeBlock || null);
                }
            } else {
                reviews.slice(0, 10).forEach(r => {
                    const div = document.createElement('div');
                    div.className = 'review-card-full';
                    const char = r.author?.name ? r.author.name.charAt(0).toUpperCase() : 'U';
                    const date = r.createdAt ? new Date(r.createdAt).toLocaleDateString(getDateLocale()) : '';

                    const header = document.createElement('div');
                    header.className = 'rc-header';

                    const avatar = document.createElement('div');
                    avatar.className = 'rc-avatar';
                    avatar.style.background = 'linear-gradient(135deg,#5e5ce6,#a78bfa)';
                    avatar.textContent = char;

                    const info = document.createElement('div');
                    const nameDiv = document.createElement('div');
                    nameDiv.className = 'rc-name';
                    nameDiv.textContent = r.author?.name || t.userFallback;
                    const dateDiv = document.createElement('div');
                    dateDiv.className = 'rc-date';
                    dateDiv.textContent = date;
                    info.append(nameDiv, dateDiv);

                    const starsDiv = document.createElement('div');
                    starsDiv.className = 'rc-stars';
                    starsDiv.innerHTML = getStarsHtml(r.rating);

                    header.append(avatar, info, starsDiv);

                    const textP = document.createElement('p');
                    textP.className = 'rc-text';
                    textP.textContent = r.comment || '';

                    div.append(header, textP);
                    section.insertBefore(div, writeBlock || null);
                });
            }
        }

        const miniContainer = document.querySelector('.mini-reviews');
        if (miniContainer) {
            miniContainer.replaceChildren();
            if (!reviews.length) {
                const emptyMini = document.createElement('div');
                emptyMini.className = 'no-reviews-empty empty-state';
                emptyMini.style.cssText = 'padding: 12px; text-align: center; color: #9ca3af; font-size: 13px;';
                emptyMini.innerHTML = `<span class="no-reviews-title" style="font-size: 13px; color: #9ca3af; font-weight: 400;">${t.noReviewsTitle}</span>`;
                miniContainer.appendChild(emptyMini);
            } else {
                reviews.slice(0, 3).forEach(r => {
                    const char = r.author?.name ? r.author.name.charAt(0).toUpperCase() : 'U';

                    const item = document.createElement('div');
                    item.className = 'mini-review-item';

                    const top = document.createElement('div');
                    top.className = 'mini-review-top';

                    const avatar = document.createElement('div');
                    avatar.className = 'mini-avatar';
                    avatar.style.background = 'linear-gradient(135deg,#5e5ce6,#a78bfa)';
                    avatar.textContent = char;

                    const nameDiv = document.createElement('div');
                    nameDiv.className = 'mini-name';
                    nameDiv.textContent = r.author?.name || t.userFallback;

                    const starsDiv = document.createElement('div');
                    starsDiv.className = 'mini-stars';
                    starsDiv.innerHTML = getStarsHtml(r.rating);

                    top.append(avatar, nameDiv, starsDiv);

                    const textDiv = document.createElement('div');
                    textDiv.className = 'mini-text';
                    textDiv.textContent = r.comment || '';

                    item.append(top, textDiv);
                    miniContainer.appendChild(item);
                });
            }
        }

        // Dynamically show seller rating stat if reviews exist
        const currentSellerStats = document.getElementById('sellerStats') || document.querySelector('.personal-stats');
        const currentIsStore = Boolean(window.__CURRENT_AD?.sellerType === 'store' && window.__CURRENT_AD?.store);
        if (!currentIsStore && currentSellerStats && Array.isArray(reviews) && reviews.length > 0) {
            currentSellerStats.replaceChildren();

            const statRatingDiv = document.createElement('div');
            statRatingDiv.className = 'p-stat';
            const rVal = document.createElement('span');
            rVal.className = 'val';
            rVal.textContent = avg;
            const rLbl = document.createElement('span');
            rLbl.className = 'lbl';
            rLbl.textContent = `★ ${t.rating}`;
            statRatingDiv.appendChild(rVal);
            statRatingDiv.appendChild(rLbl);
            currentSellerStats.appendChild(statRatingDiv);

            const statCountDiv = document.createElement('div');
            statCountDiv.className = 'p-stat';
            const cVal = document.createElement('span');
            cVal.className = 'val';
            cVal.textContent = String(reviews.length);
            const cLbl = document.createElement('span');
            cLbl.className = 'lbl';
            cLbl.textContent = t.reviews;
            statCountDiv.appendChild(cVal);
            statCountDiv.appendChild(cLbl);
            currentSellerStats.appendChild(statCountDiv);

            currentSellerStats.classList.remove('hidden');
            currentSellerStats.style.display = 'grid';
        }
    }

}); // end DOMContentLoaded
